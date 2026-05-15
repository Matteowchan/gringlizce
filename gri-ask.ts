// ============================================================================
// GRI-ASK EDGE FUNCTION
// ============================================================================
// Soru bankası içindeki bir soru için AI destekli açıklama üretir.
// Akış:
//   1. Authorization header'dan kullanıcıyı doğrula
//   2. ai_question_usage'da bu kullanıcının bu soru için kaydı var mı bak
//      → Varsa eskiyi döndür (quota harcamadan, "tekrar gösterim")
//   3. ai_quota'da kalan hak var mı bak
//      → Yoksa 402 + paket bilgisi dön
//   4. questions tablosundan soru bağlamını al (varsa passages da)
//   5. OpenAI chat completions çağır
//   6. ai_question_usage'a yaz, consume_ai_quota RPC ile sayacı artır
//   7. Cevabı dön
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

// Sokratik değil, açıklayıcı kişilik. Mert sonradan değiştirebilir.
const SYSTEM_PROMPT = `Sen Gri'sin. Gringlizce.com İngilizce sınav hazırlık sitesinin yapay zeka asistanısın.

Görev: Öğrenciler soru bankasındaki bir soruyu çözdükten sonra ek açıklama için sana danışır. Soruyu net şekilde açıkla; doğru cevabın neden doğru, yanlış seçeneklerin neden elendiğini göster. Öğrencinin sorduğu spesifik noktaya odaklan.

Üslup:
- Profesyonel ama sıcak; deneyimli bir İngilizce öğretmeni gibi konuş.
- Öğrencinin sorduğu dilde cevap ver. Türkçe sorduysa Türkçe, İngilizce sorduysa İngilizce.
- Kısa ve odaklı: 250 kelime maksimum.
- Mantığı açık göster. "X doğru" deme; "X şu sebepten doğru" de.
- Pasaj varsa, pasajdan kanıt göstererek konuş.

Kaçınılması gerekenler:
- ChatGPT, OpenAI, GPT, language model, AI gibi terimleri kullanma; sen "Gri"sin.
- "Bir yapay zeka olarak" gibi açılışlar kullanma.
- Argo, kabalaşma, küçümseme.

Öğrencinin sorusu mevcut soruyla ilgili değilse (genel İngilizce sorusu, başka sınav, kişisel konu, off-topic), nazikçe yönlendir: "Bu pencerede sadece bu soru hakkında yardımcı olabilirim. Genel İngilizce ile ilgili soruları gringlizce.com iletişim sayfasından iletebilirsin."`;

function buildUserPrompt(
  q: Record<string, unknown>,
  passage: Record<string, unknown> | null,
  userMessage: string,
): string {
  const parts: string[] = ["SORU BAĞLAMI:\n"];

  const tags: string[] = [];
  if (q.exam_type) tags.push(`Sınav: ${String(q.exam_type).toUpperCase()}`);
  if (q.section) tags.push(`Bölüm: ${q.section}`);
  if (q.category) tags.push(`Kategori: ${q.category}`);
  if (q.subcategory) tags.push(`Alt kategori: ${q.subcategory}`);
  if (q.difficulty) tags.push(`Zorluk: ${q.difficulty}`);
  if (tags.length) parts.push(tags.join(" | "));

  if (passage) {
    parts.push("\nPasaj:");
    const passageText = passage.content || passage.text || passage.passage_text || passage.body;
    if (passageText) {
      parts.push(String(passageText));
    } else {
      parts.push(JSON.stringify(passage));
    }
  }

  if (q.question_text) {
    parts.push("\nSoru:");
    parts.push(String(q.question_text));
  }

  if (q.options) {
    parts.push("\nSeçenekler:");
    if (Array.isArray(q.options)) {
      for (const opt of q.options as Array<Record<string, unknown>>) {
        const letter = opt.letter || opt.key || "";
        const text = opt.text || opt.content || opt.body || "";
        parts.push(`${letter}) ${text}`);
      }
    } else if (typeof q.options === "object") {
      for (const [k, v] of Object.entries(q.options as Record<string, unknown>)) {
        parts.push(`${k}) ${typeof v === "object" ? JSON.stringify(v) : v}`);
      }
    }
  }

  if (q.correct_answer) {
    parts.push(`\nDoğru cevap: ${q.correct_answer}`);
  }

  if (q.explanations) {
    let expText = "";
    try {
      const exps = q.explanations as Record<string, unknown>;
      if (q.correct_answer && exps[String(q.correct_answer)]) {
        expText = JSON.stringify(exps[String(q.correct_answer)]);
      } else {
        expText = JSON.stringify(exps);
      }
    } catch {
      expText = String(q.explanations);
    }
    parts.push("\nMevcut adım adım açıklama (öğrenci zaten okudu):");
    parts.push(expText);
  }

  parts.push("\n---\n\nÖĞRENCİNİN SORUSU:");
  parts.push(userMessage);

  return parts.join("\n");
}

async function callOpenAI(systemPrompt: string, userPrompt: string): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 800,
      temperature: 0.4,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("OpenAI error:", res.status, errText);
    throw new Error(`OpenAI request failed: ${res.status}`);
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content || typeof content !== "string") {
    throw new Error("OpenAI returned no content");
  }
  return content.trim();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS });
  }

  if (req.method !== "POST") {
    return json({ error: "method_not_allowed" }, 405);
  }

  // 1. Auth doğrulama
  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) {
    return json({ error: "unauthorized" }, 401);
  }

  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData?.user) {
    return json({ error: "invalid_token" }, 401);
  }
  const userId = userData.user.id;

  // 2. Body parse
  let body: { question_id?: string; message?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "invalid_body" }, 400);
  }

  const questionId = String(body.question_id || "").trim();
  const message = String(body.message || "").trim();

  if (!questionId || !message) {
    return json({ error: "missing_fields", detail: "question_id ve message gerekli" }, 400);
  }
  if (message.length > 1000) {
    return json({ error: "message_too_long", detail: "En fazla 1000 karakter" }, 400);
  }

  // 3. Mevcut kullanım kontrolü (bu soru için zaten kullandı mı?)
  const { data: existing } = await supabase
    .from("ai_question_usage")
    .select("user_message, ai_response, used_at")
    .eq("user_id", userId)
    .eq("question_id", questionId)
    .maybeSingle();

  // Kalan quota (her durumda gerekli)
  const { data: quotaRow } = await supabase
    .from("ai_quota")
    .select("total_quota, used_count")
    .eq("user_id", userId)
    .maybeSingle();
  const remaining = quotaRow
    ? Math.max(0, quotaRow.total_quota - quotaRow.used_count)
    : 0;

  if (existing) {
    return json({
      ok: true,
      cached: true,
      user_message: existing.user_message,
      response: existing.ai_response,
      remaining,
      used_at: existing.used_at,
    });
  }

  // 4. Quota kontrol
  if (!quotaRow || quotaRow.used_count >= quotaRow.total_quota) {
    return json({
      ok: false,
      error: "quota_exhausted",
      remaining: 0,
      packs: [
        { slug: "ai-pack-10", name: "10 Soru", price: 100, url: "https://www.shopier.com/SATquestionBank/47230429" },
        { slug: "ai-pack-25", name: "25 Soru", price: 225, url: "https://www.shopier.com/SATquestionBank/47230479" },
        { slug: "ai-pack-50", name: "50 Soru", price: 425, url: "https://www.shopier.com/SATquestionBank/47230505" },
      ],
    }, 402);
  }

  // 5. Soruyu çek
  const { data: question, error: qError } = await supabase
    .from("questions")
    .select("*")
    .eq("id", questionId)
    .maybeSingle();

  if (qError || !question) {
    console.error("question fetch failed:", qError);
    return json({ ok: false, error: "question_not_found" }, 404);
  }

  // 6. Pasaj (varsa)
  let passage: Record<string, unknown> | null = null;
  const passageId = question.passage_id || question.passageId;
  if (passageId) {
    const { data: p } = await supabase
      .from("passages")
      .select("*")
      .eq("id", passageId)
      .maybeSingle();
    if (p) passage = p;
  }

  // 7. AI'a sor
  let aiResponse: string;
  try {
    const userPrompt = buildUserPrompt(question, passage, message);
    aiResponse = await callOpenAI(SYSTEM_PROMPT, userPrompt);
  } catch (e) {
    console.error("AI call failed:", e);
    return json({ ok: false, error: "ai_unavailable", detail: String(e) }, 502);
  }

  // 8. Usage kaydet
  const { error: insertError } = await supabase.from("ai_question_usage").insert({
    user_id: userId,
    question_id: questionId,
    user_message: message,
    ai_response: aiResponse,
  });
  if (insertError) {
    // UNIQUE çakışması olabilir (eş zamanlı çift istek). Mevcut kaydı dön.
    if (insertError.code === "23505") {
      const { data: re } = await supabase
        .from("ai_question_usage")
        .select("user_message, ai_response, used_at")
        .eq("user_id", userId)
        .eq("question_id", questionId)
        .maybeSingle();
      if (re) {
        return json({
          ok: true,
          cached: true,
          user_message: re.user_message,
          response: re.ai_response,
          remaining,
          used_at: re.used_at,
        });
      }
    }
    console.error("usage insert failed:", insertError);
  }

  // 9. Quota tüket (atomik RPC)
  const { data: consumeResult, error: consumeError } = await supabase.rpc("consume_ai_quota", {
    p_user_id: userId,
  });

  let newRemaining = remaining - 1;
  if (consumeError) {
    console.error("consume_ai_quota failed:", consumeError);
  } else if (consumeResult && consumeResult[0]) {
    newRemaining = consumeResult[0].remaining;
  }

  return json({
    ok: true,
    cached: false,
    user_message: message,
    response: aiResponse,
    remaining: newRemaining,
  });
});
