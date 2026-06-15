// ============================================================================
// GRI-ASK EDGE FUNCTION (v3)
// ============================================================================
// Soru bankası ve SAT kamp soruları için AI destekli açıklama üretir.
//
// İKİ MOD:
//
// A) DB MODU (soru bankası, gri-ask.js):
//    Body: { question_id: UUID, message: string }
//    - questions tablosundan soru çekilir, varsa passage de
//    - ai_question_usage tablosunda cache var mı bakılır
//    - feature='gri-ask' olarak log'lanır
//
// B) INLINE MODU (SAT kamp Day sayfaları, sat-camp-features.js):
//    Body: {
//      question_slug: 'sat-(rw|math)-kamp-d{D}-m{M}-q{Q}',
//      user_prompt: string,
//      inline_question: { passage, data, question, options[], correct, source }
//    }
//    - DB lookup atlanır (kamp soruları DB'de yok)
//    - ai_question_usage'a yazılmaz (FK constraint questions tablosunaa)
//    - feature='gri-ask-camp' olarak log'lanır
//
// QUOTA SCHEMA:
// ai_quota tablosu modern kolonlar:
//   daily_limit, daily_used_count, last_used_date  → günlük havuz (gün bazlı reset)
//   bonus_quota, bonus_used                        → paket alarak eklenen bonus
// total_remaining = max(0, daily_limit - effective_daily_used) + (bonus_quota - bonus_used)
//
// RPC consume_ai_quota(p_user_id) atomik olarak önce daily'den, biterse bonus'tan
// 1 hak düşürür ve yeni (daily_remaining, bonus_remaining) döndürür.
//
// RESPONSE SHAPE (gri-ask.js renderResponseState ile uyumlu):
//   {
//     ok, cached,
//     turns: [{ user_message, ai_response, used_at }],
//     quota: { daily_limit, daily_remaining, bonus_remaining, total_remaining },
//     can_ask_more: boolean,
//     // Geriye uyumluluk:
//     user_message, response, remaining
//   }
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

// ----------------------------------------------------------------------------
// Prompt builders
// ----------------------------------------------------------------------------

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

function buildInlineUserPrompt(
  inline: Record<string, unknown>,
  userMessage: string,
): string {
  const parts: string[] = ["SORU BAĞLAMI:\n"];

  const source = inline.source ? String(inline.source) : "";
  if (source) {
    const trackMatch = /^sat-(rw|math)-kamp-day-(\d+)$/.exec(source);
    if (trackMatch) {
      const trackLabel = trackMatch[1] === "math" ? "SAT Math" : "SAT Reading and Writing";
      parts.push(`Sınav: ${trackLabel} | Kaynak: 8 Günlük Kamp · Day ${trackMatch[2]}`);
    } else {
      parts.push(`Kaynak: ${source}`);
    }
  }

  const passage = inline.passage ? String(inline.passage).trim() : "";
  if (passage) {
    parts.push("\nPasaj:");
    parts.push(passage);
  }

  const data = inline.data ? String(inline.data).trim() : "";
  if (data) {
    parts.push("\nVeri/Şekil:");
    parts.push(data);
  }

  const question = inline.question ? String(inline.question).trim() : "";
  if (question) {
    parts.push("\nSoru:");
    parts.push(question);
  }

  if (inline.options && Array.isArray(inline.options) && inline.options.length > 0) {
    parts.push("\nSeçenekler:");
    for (const opt of inline.options as unknown[]) {
      parts.push(String(opt));
    }
  }

  if (inline.correct !== undefined && inline.correct !== null) {
    let correctDisplay = String(inline.correct);
    if (typeof inline.correct === "number" && Array.isArray(inline.options)) {
      const idx = inline.correct;
      if (idx >= 0 && idx < 26) {
        correctDisplay = String.fromCharCode(65 + idx);
      }
    }
    parts.push(`\nDoğru cevap: ${correctDisplay}`);
  }

  parts.push("\n---\n\nÖĞRENCİNİN SORUSU:");
  parts.push(userMessage);

  return parts.join("\n");
}

// ----------------------------------------------------------------------------
// Quota helpers (modern schema)
// ----------------------------------------------------------------------------

type QuotaRow = {
  daily_limit: number | null;
  daily_used_count: number | null;
  last_used_date: string | null;
  bonus_quota: number | null;
  bonus_used: number | null;
};

type QuotaState = {
  daily_limit: number;
  daily_remaining: number;
  bonus_remaining: number;
  total_remaining: number;
};

function computeQuota(row: QuotaRow | null): QuotaState {
  if (!row) {
    return { daily_limit: 10, daily_remaining: 10, bonus_remaining: 0, total_remaining: 10 };
  }
  const dailyLimit = Number(row.daily_limit ?? 10);
  const rawDailyUsed = Number(row.daily_used_count ?? 0);
  const today = new Date().toISOString().slice(0, 10);
  const lastDate = row.last_used_date || null;
  // Gün değiştiyse daily_used'ı 0 say (RPC zaten aynı kararı veriyor, frontend de aynı)
  const effectiveDailyUsed = (lastDate && String(lastDate) >= today) ? rawDailyUsed : 0;
  const dailyRemaining = Math.max(0, dailyLimit - effectiveDailyUsed);
  const bonusQuota = Number(row.bonus_quota ?? 0);
  const bonusUsed = Number(row.bonus_used ?? 0);
  const bonusRemaining = Math.max(0, bonusQuota - bonusUsed);
  return {
    daily_limit: dailyLimit,
    daily_remaining: dailyRemaining,
    bonus_remaining: bonusRemaining,
    total_remaining: dailyRemaining + bonusRemaining,
  };
}

async function fetchQuotaState(userId: string): Promise<QuotaState> {
  const { data } = await supabase
    .from("ai_quota")
    .select("daily_limit, daily_used_count, last_used_date, bonus_quota, bonus_used")
    .eq("user_id", userId)
    .maybeSingle();
  return computeQuota(data as QuotaRow | null);
}

// ----------------------------------------------------------------------------
// OpenAI
// ----------------------------------------------------------------------------

type OpenAiResult = {
  content: string;
  model: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  duration_ms: number;
};

async function callOpenAI(systemPrompt: string, userPrompt: string): Promise<OpenAiResult> {
  const start = Date.now();
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

  const usage = data?.usage || {};
  return {
    content: content.trim(),
    model: data?.model || OPENAI_MODEL,
    prompt_tokens: usage.prompt_tokens || 0,
    completion_tokens: usage.completion_tokens || 0,
    total_tokens: usage.total_tokens || 0,
    duration_ms: Date.now() - start,
  };
}

// ----------------------------------------------------------------------------
// AI call logging
// ----------------------------------------------------------------------------

const PRICING: Record<string, { input: number; output: number }> = {
  "gpt-4o-mini":   { input: 0.150, output: 0.600 },
  "gpt-4o":        { input: 2.500, output: 10.000 },
  "gpt-4o-2024":   { input: 2.500, output: 10.000 },
  "gpt-3.5-turbo": { input: 0.500, output: 1.500 },
  "gpt-4-turbo":   { input: 10.000, output: 30.000 },
};

function calcCostUsd(model: string, promptTokens: number, completionTokens: number): number {
  let pricing = PRICING[model];
  if (!pricing) {
    for (const key of Object.keys(PRICING)) {
      if (model.startsWith(key)) { pricing = PRICING[key]; break; }
    }
  }
  if (!pricing) return 0;
  const inputCost = (promptTokens / 1_000_000) * pricing.input;
  const outputCost = (completionTokens / 1_000_000) * pricing.output;
  return Number((inputCost + outputCost).toFixed(6));
}

type LogPayload = {
  feature: string;
  user_id: string | null;
  user_email: string | null;
  provider: string;
  model?: string | null;
  status: "success" | "error" | "timeout" | "retry_ok";
  error_code?: string | null;
  error_msg?: string | null;
  duration_ms: number;
  retries?: number;
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
  cost_usd?: number;
};

async function logAiCall(p: LogPayload): Promise<void> {
  try {
    await supabase.from("ai_call_log").insert({
      feature: p.feature,
      user_id: p.user_id,
      user_email: p.user_email,
      provider: p.provider,
      model: p.model || null,
      status: p.status,
      error_code: p.error_code || null,
      error_msg: p.error_msg || null,
      duration_ms: p.duration_ms,
      retries: p.retries || 0,
      prompt_tokens: p.prompt_tokens || null,
      completion_tokens: p.completion_tokens || null,
      total_tokens: p.total_tokens || null,
      cost_usd: p.cost_usd || 0,
    });
  } catch (e) {
    console.error("ai_call_log insert failed:", e);
  }
}

// ----------------------------------------------------------------------------
// Paywall packs
// ----------------------------------------------------------------------------
const PAYWALL_PACKS = [
  { slug: "ai-pack-10", name: "10 Soru", price: 100, url: "https://www.shopier.com/SATquestionBank/47230429" },
  { slug: "ai-pack-25", name: "25 Soru", price: 225, url: "https://www.shopier.com/SATquestionBank/47230479" },
  { slug: "ai-pack-50", name: "50 Soru", price: 425, url: "https://www.shopier.com/SATquestionBank/47230505" },
];

// ----------------------------------------------------------------------------
// Server
// ----------------------------------------------------------------------------

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS });
  }

  if (req.method !== "POST") {
    return json({ error: "method_not_allowed" }, 405);
  }

  // 1. Auth
  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) return json({ error: "unauthorized" }, 401);

  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData?.user) return json({ error: "invalid_token" }, 401);
  const userId = userData.user.id;
  const userEmail = userData.user.email || null;

  // 2. Body parse
  let body: {
    question_id?: string;
    question_slug?: string;
    message?: string;
    user_prompt?: string;
    inline_question?: Record<string, unknown>;
  };
  try {
    body = await req.json();
  } catch {
    return json({ error: "invalid_body" }, 400);
  }

  const rawQid = String(body.question_id || "").trim();
  const rawSlug = String(body.question_slug || "").trim();
  const message = String(body.message || body.user_prompt || "").trim();
  const inlineQuestion = (body.inline_question && typeof body.inline_question === "object")
    ? body.inline_question
    : null;

  if ((!rawQid && !rawSlug) || !message) {
    return json({
      error: "missing_fields",
      detail: "question_id (UUID) veya question_slug + message gerekli",
    }, 400);
  }
  if (message.length > 1000) {
    return json({ error: "message_too_long", detail: "En fazla 1000 karakter" }, 400);
  }

  const isInlineMode = !!(rawSlug && inlineQuestion);
  if (!isInlineMode && !rawQid) {
    return json({
      error: "missing_fields",
      detail: "question_slug gönderildiğinde inline_question payload'u da gerekli",
    }, 400);
  }

  const questionId = isInlineMode ? "" : rawQid;
  const featureName = isInlineMode ? "gri-ask-camp" : "gri-ask";

  // 3. Modern quota state
  let quota = await fetchQuotaState(userId);

  // 4. DB modu: önce cache kontrolü
  let existing: { user_message: string; ai_response: string; used_at: string } | null = null;
  if (!isInlineMode) {
    const { data } = await supabase
      .from("ai_question_usage")
      .select("user_message, ai_response, used_at")
      .eq("user_id", userId)
      .eq("question_id", questionId)
      .maybeSingle();
    existing = data;
  }

  if (existing) {
    // Cache hit, quota harcanmaz
    return json({
      ok: true,
      cached: true,
      turns: [
        { user_message: existing.user_message, ai_response: existing.ai_response, used_at: existing.used_at },
      ],
      quota,
      can_ask_more: false,
      // Geriye uyumluluk
      user_message: existing.user_message,
      response: existing.ai_response,
      remaining: quota.total_remaining,
      used_at: existing.used_at,
    });
  }

  // 5. Quota check (modern kolonlar)
  if (quota.total_remaining <= 0) {
    return json({
      ok: false,
      error: "quota_exhausted",
      quota,
      remaining: 0,
      packs: PAYWALL_PACKS,
    }, 402);
  }

  // 6. Prompt
  let userPrompt: string;
  if (isInlineMode) {
    userPrompt = buildInlineUserPrompt(inlineQuestion!, message);
  } else {
    const { data: question, error: qError } = await supabase
      .from("questions")
      .select("*")
      .eq("id", questionId)
      .maybeSingle();
    if (qError || !question) {
      console.error("question fetch failed:", qError);
      return json({ ok: false, error: "question_not_found" }, 404);
    }
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
    userPrompt = buildUserPrompt(question, passage, message);
  }

  // 7. AI çağrısı
  let aiResponse: string;
  let aiUsedAt: string = new Date().toISOString();
  const callStart = Date.now();
  try {
    const aiResult = await callOpenAI(SYSTEM_PROMPT, userPrompt);
    aiResponse = aiResult.content;
    await logAiCall({
      feature: featureName,
      user_id: userId,
      user_email: userEmail,
      provider: "openai",
      model: aiResult.model,
      status: "success",
      duration_ms: aiResult.duration_ms,
      prompt_tokens: aiResult.prompt_tokens,
      completion_tokens: aiResult.completion_tokens,
      total_tokens: aiResult.total_tokens,
      cost_usd: calcCostUsd(aiResult.model, aiResult.prompt_tokens, aiResult.completion_tokens),
    });
  } catch (e) {
    console.error("AI call failed:", e);
    const errMsg = String(e);
    const isTimeout = /timeout|timed out|aborted/i.test(errMsg);
    await logAiCall({
      feature: featureName,
      user_id: userId,
      user_email: userEmail,
      provider: "openai",
      model: OPENAI_MODEL,
      status: isTimeout ? "timeout" : "error",
      error_msg: errMsg.slice(0, 500),
      duration_ms: Date.now() - callStart,
    });
    return json({ ok: false, error: "ai_unavailable", detail: errMsg }, 502);
  }

  // 8. DB modu: usage kaydet
  if (!isInlineMode) {
    const { data: insertedRow, error: insertError } = await supabase
      .from("ai_question_usage")
      .insert({
        user_id: userId,
        question_id: questionId,
        user_message: message,
        ai_response: aiResponse,
      })
      .select("used_at")
      .maybeSingle();
    if (insertError) {
      if (insertError.code === "23505") {
        // Eş zamanlı çift istek, mevcut kaydı dön
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
            turns: [{ user_message: re.user_message, ai_response: re.ai_response, used_at: re.used_at }],
            quota,
            can_ask_more: false,
            user_message: re.user_message,
            response: re.ai_response,
            remaining: quota.total_remaining,
            used_at: re.used_at,
          });
        }
      }
      console.error("usage insert failed:", insertError);
    } else if (insertedRow?.used_at) {
      aiUsedAt = insertedRow.used_at;
    }
  }

  // 9. Quota harca (RPC her çağrıda 1 düşürür, daily biterse bonus'a geçer)
  const { data: consumeResult, error: consumeError } = await supabase.rpc("consume_ai_quota", {
    p_user_id: userId,
  });

  if (consumeError) {
    console.error("consume_ai_quota failed:", consumeError);
  } else if (consumeResult && consumeResult[0]) {
    const row = consumeResult[0] as { success: boolean; daily_remaining: number; bonus_remaining: number };
    const dailyRem = Math.max(0, Number(row.daily_remaining ?? 0));
    const bonusRem = Math.max(0, Number(row.bonus_remaining ?? 0));
    quota = {
      daily_limit: quota.daily_limit,
      daily_remaining: dailyRem,
      bonus_remaining: bonusRem,
      total_remaining: dailyRem + bonusRem,
    };
  } else {
    // RPC döndüremezse local düş
    if (quota.daily_remaining > 0) {
      quota = { ...quota, daily_remaining: quota.daily_remaining - 1, total_remaining: quota.total_remaining - 1 };
    } else if (quota.bonus_remaining > 0) {
      quota = { ...quota, bonus_remaining: quota.bonus_remaining - 1, total_remaining: quota.total_remaining - 1 };
    }
  }

  return json({
    ok: true,
    cached: false,
    turns: [{ user_message: message, ai_response: aiResponse, used_at: aiUsedAt }],
    quota,
    can_ask_more: false,
    // Geriye uyumluluk alanları
    user_message: message,
    response: aiResponse,
    remaining: quota.total_remaining,
  });
});