// ============================================================================
// VOCAB-LOOKUP EDGE FUNCTION
// ============================================================================
// Akış:
//   1) Kelimeyi normalize et (lowercase, trim, noktalama temizle)
//   2) vocabulary tablosunda var mı bak → varsa anında dön (cache hit)
//   3) Yoksa OpenAI'a sor (auth gerekir, anonim için engel)
//   4) Dönen JSON'u vocabulary tablosuna yaz, kullanıcıya dön
//
// Anonim kullanıcı: sadece cache'den okuyabilir, yeni kelime tetikleyemez.
// Login kullanıcı: yeni kelime için OpenAI tetikleyebilir.
// ============================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")!;
const OPENAI_MODEL = Deno.env.get("OPENAI_MODEL") || "gpt-4o-mini";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

const SYSTEM_PROMPT = `Sen bir İngilizce sözlüksün. Türk öğrenciler için Digital SAT/IELTS/TOEFL kapsamında kelime analizi yapıyorsun.

KURALLAR:
1. Yanıtın SADECE aşağıdaki JSON formatında olmalı.
2. Kelime yanlış yazılmışsa en yakın doğru kelimeyi tahmin et.
3. Verilen tek bir kelime değilse (cümle, ifade), en kritik anahtar kelimeyi seç.
4. meanings: en yaygın 1-3 Türkçe anlamı, en yaygın olanı önce. Çok benzer anlamlardan sadece birini al. Her bir anlam 1-3 kelime olsun.
5. synonyms: 1-3 İngilizce eş anlamlı. Akademik bağlamda (SAT/IELTS) kullanılan kelimeler tercih et. Eş anlamlı yoksa boş array dön.
6. example: gerçek akademik veya günlük bağlamda 10-18 kelime arası, kelimenin en yaygın anlamını gösteren cümle.
7. translation: doğal Türkçe çevirisi, kelime kelime değil.
8. level: basic / intermediate / advanced.

JSON FORMATI:
{
  "word": "doğru yazımıyla kelime",
  "meanings": ["anlam1", "anlam2", "anlam3"],
  "example": "İngilizce örnek cümle",
  "translation": "Türkçe çevirisi",
  "synonyms": ["syn1", "syn2", "syn3"],
  "level": "intermediate"
}`;

async function callOpenAI(word: string): Promise<{
  word: string;
  meanings: string[];
  example: string;
  translation: string;
  synonyms: string[];
  level: string;
}> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Kelime: ${word}` },
      ],
      max_tokens: 400,
      temperature: 0.3,
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenAI failed: ${res.status} ${errText}`);
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error("OpenAI returned no content");
  const parsed = JSON.parse(content);

  // Normalize: enforce array shapes and max 3
  const meanings = Array.isArray(parsed.meanings)
    ? parsed.meanings.slice(0, 3).filter((x: unknown) => typeof x === "string" && x.trim())
    : (parsed.turkish ? [String(parsed.turkish)] : []);
  const synonyms = Array.isArray(parsed.synonyms)
    ? parsed.synonyms.slice(0, 3).filter((x: unknown) => typeof x === "string" && x.trim())
    : [];

  return {
    word: String(parsed.word || word).trim(),
    meanings: meanings,
    example: String(parsed.example || "").trim(),
    translation: String(parsed.translation || "").trim(),
    synonyms: synonyms,
    level: String(parsed.level || "intermediate").trim().toLowerCase(),
  };
}

function normalizeWord(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, " ");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS });
  }
  if (req.method !== "POST") {
    return json({ error: "method_not_allowed" }, 405);
  }

  // Auth — opsiyonel ama yeni kelime için gerekli
  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  let userId: string | null = null;
  if (token) {
    const { data: userData, error } = await supabase.auth.getUser(token);
    if (!error && userData?.user) {
      userId = userData.user.id;
    }
  }

  // Body
  let body: { word?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "invalid_body" }, 400);
  }

  const rawWord = String(body.word || "").trim();
  if (!rawWord || rawWord.length > 80) {
    return json({ error: "invalid_word" }, 400);
  }

  const normalized = normalizeWord(rawWord);
  if (!normalized) {
    return json({ error: "invalid_word" }, 400);
  }

  // Cache kontrolü
  const { data: cached } = await supabase
    .from("vocabulary")
    .select("id, word, word_display, definition_json, verified")
    .eq("word", normalized)
    .maybeSingle();

  if (cached) {
    return json({
      ok: true,
      cached: true,
      vocabulary_id: cached.id,
      word: cached.word_display,
      ...(cached.definition_json as Record<string, unknown>),
      verified: cached.verified,
    });
  }

  // Cache miss — anonim kullanıcı engellenir
  if (!userId) {
    return json({
      ok: false,
      error: "login_required",
      message: "Bu kelime henüz kayıtlı değil. Yeni kelime aramak için giriş yapmalısın.",
    }, 401);
  }

  // OpenAI
  let definition;
  try {
    definition = await callOpenAI(rawWord);
  } catch (e) {
    console.error("OpenAI failed:", e);
    return json({ ok: false, error: "ai_unavailable", detail: String(e) }, 502);
  }

  if (!definition.word || !definition.meanings.length || !definition.example) {
    return json({ ok: false, error: "invalid_response" }, 502);
  }

  const finalWord = String(definition.word).trim();
  const finalNormalized = normalizeWord(finalWord);

  // Cache'e yaz
  const { data: inserted, error: insertError } = await supabase
    .from("vocabulary")
    .insert({
      word: finalNormalized,
      word_display: finalWord,
      definition_json: {
        meanings: definition.meanings,
        example: definition.example,
        translation: definition.translation,
        synonyms: definition.synonyms,
        level: definition.level || "intermediate",
      },
      looked_up_by: userId,
    })
    .select("id")
    .single();

  let vocabularyId = inserted?.id;
  // Race condition: birisi aynı anda aynı kelimeyi eklemiş olabilir
  if (insertError && insertError.code === "23505") {
    const { data: existing } = await supabase
      .from("vocabulary")
      .select("id")
      .eq("word", finalNormalized)
      .single();
    vocabularyId = existing?.id;
  } else if (insertError) {
    console.error("Insert failed:", insertError);
  }

  return json({
    ok: true,
    cached: false,
    vocabulary_id: vocabularyId,
    word: finalWord,
    meanings: definition.meanings,
    example: definition.example,
    translation: definition.translation,
    synonyms: definition.synonyms,
    level: definition.level || "intermediate",
    verified: false,
  });
});