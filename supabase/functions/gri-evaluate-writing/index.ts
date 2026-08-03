// =================================================================
// Edge Function: gri-evaluate-writing
//
// Deno runtime, Supabase Edge Function
// Path: supabase/functions/gri-evaluate-writing/index.ts
//
// Sorumlulukları:
//   1. Auth check (JWT validate)
//   2. Writing quota check (günlük + bonus) — admin bypass
//   3. Text type config'i DB'den çek (rubric)
//   4. OpenAI Chat Completions çağır (key sunucuda)
//   5. ai_call_log'a yaz (cost, latency, status)
//   6. Quota düşür — admin'de düşürülmez
//   7. Submission'ı kaydet
//   8. Response döndür
//
// Deploy:
//   supabase functions deploy gri-evaluate-writing --no-verify-jwt
// =================================================================

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")!;

const OPENAI_MODEL = "gpt-4o-mini";

// Admin emails: kota check'lerini ve sayaç artışını atlar
const ADMIN_EMAILS = ["mertatasal@gmail.com", "atasal@gringlizce.com"];

// Module-scope client. Her request'te yeniden yaratma yerine paylaşılır.
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ===== Yardımcılar =====
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function err(message: string, status = 400, code?: string) {
  return json({ error: message, code }, status);
}

function todayUTC(): string {
  // İstanbul günü (reset TR gece yarısı, UTC+3 sabit)
  return new Date(Date.now() + 3 * 3600 * 1000).toISOString().slice(0, 10);
}
const WRITING_COST = 5; // Gri Token / yazı değerlendirmesi (ortak günlük havuz)

// ===== AI Call Logging =====
// OpenAI pricing per 1M tokens (USD). Yeni model eklersen buraya da ekle.
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
  // Insert non-blocking — log hatası AI cevabını engellemesin
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

// ===== Quota mantığı =====
interface QuotaState {
  daily_remaining: number;
  bonus_remaining: number;
  total_remaining: number;
}

function computeWritingQuota(row: any): QuotaState {
  // ORTAK günlük havuz: günde 10 Gri Token; her yazı = 5 Gri Token (soru sorma 1)
  const dailyLimit = row?.daily_limit ?? 10;
  if (!row) {
    const w = Math.floor(dailyLimit / WRITING_COST);
    return { daily_remaining: w, bonus_remaining: 0, total_remaining: w };
  }
  const today = todayUTC();
  const last = row.last_used_date;
  const dailyUsed = (last === today) ? (row.daily_used_count ?? 0) : 0;
  const dailyWritingsAvailable = Math.floor(Math.max(0, dailyLimit - dailyUsed) / WRITING_COST);

  const bonusQuota = row.bonus_quota ?? 0;
  const bonusUsed = row.bonus_used ?? 0;
  const bonusRemaining = Math.max(0, bonusQuota - bonusUsed);
  const bonusWritingsAvailable = Math.floor(bonusRemaining / WRITING_COST);

  return {
    daily_remaining: dailyWritingsAvailable,
    bonus_remaining: bonusWritingsAvailable,
    total_remaining: dailyWritingsAvailable + bonusWritingsAvailable,
  };
}

// ===== Ana Handler =====
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return err("Method not allowed", 405);
  }

  try {
    // ===== 1) Auth =====
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return err("Auth header required. Lütfen giriş yapın.", 401, "no_auth");
    }
    const jwt = authHeader.replace("Bearer ", "");

    const { data: userData, error: userErr } = await supabase.auth.getUser(jwt);
    if (userErr || !userData?.user) {
      return err("Geçersiz oturum. Lütfen tekrar giriş yapın.", 401, "invalid_jwt");
    }
    const userId = userData.user.id;
    const userEmail = userData.user.email || null;
    const isAdmin = ADMIN_EMAILS.includes(userEmail || "");

    // ===== 2) Request body =====
    let body: any;
    try {
      body = await req.json();
    } catch {
      return err("Geçersiz JSON body", 400);
    }

    const {
      text_type_id,
      level,
      prompt_id,
      prompt_snapshot,
      text,
      word_count,
    } = body;

    if (!text_type_id || !text || !prompt_snapshot || typeof word_count !== "number") {
      return err("Eksik alan: text_type_id, text, prompt_snapshot, word_count zorunlu", 400);
    }

    // Cap: devasa input maliyetini kes (normal yazi << 20000 karakter)
    if (typeof text === "string" && text.length > 20000) {
      return err("Metin cok uzun (en fazla 20000 karakter).", 400, "text_too_long");
    }

    // ===== 3) Text type config =====
    const { data: textType, error: ttErr } = await supabase
      .from("writing_text_types")
      .select("*")
      .eq("id", text_type_id)
      .eq("is_active", true)
      .maybeSingle();

    if (ttErr || !textType) {
      return err(`Geçersiz text type: ${text_type_id}`, 400, "invalid_text_type");
    }
    if (textType.is_coming_soon) {
      return err("Bu text type henüz aktif değil", 400, "coming_soon");
    }

    // Word count target range — Gri'ye bilgi olarak geçilir, sınırlama yok
    const minWc = level === "hl"
      ? (textType.word_count_min_hl ?? textType.word_count_min)
      : textType.word_count_min;
    const maxWc = level === "hl"
      ? (textType.word_count_max_hl ?? textType.word_count_max)
      : textType.word_count_max;

    // ===== 4) Quota check =====
    const { data: quotaRow } = await supabase
      .from("ai_quota")
      .select("daily_limit, daily_used_count, last_used_date, bonus_quota, bonus_used, writing_daily_used_count, writing_last_used_date, writing_daily_limit")
      .eq("user_id", userId)
      .maybeSingle();

    const quota = computeWritingQuota(quotaRow);

    // Admin'de kota check'i atlanır
    if (!isAdmin && quota.total_remaining <= 0) {
      return err(
        "Günlük yazı değerlendirme hakkın bitti. Yeni hak için 24 saat bekle veya Gri Token satın al.",
        402,
        "quota_exhausted"
      );
    }

    const useDailyFree = quota.daily_remaining > 0;
    const costQuota = isAdmin ? 0 : WRITING_COST;
    const costSource = isAdmin ? "admin" : (useDailyFree ? "daily" : "bonus");

    // ===== 5) OpenAI çağrısı (logged) =====
    let evaluation: any;
    const callStart = Date.now();
    try {
      const aiResult = await callOpenAI({
        text,
        word_count,
        prompt_snapshot,
        textType,
        level,
        minWc,
        maxWc,
      });
      evaluation = aiResult.evaluation;
      await logAiCall({
        feature: "gri-evaluate-writing",
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
    } catch (e: any) {
      const errMsg = String(e?.message || e);
      const isTimeout = /timeout|timed out|aborted/i.test(errMsg);
      await logAiCall({
        feature: "gri-evaluate-writing",
        user_id: userId,
        user_email: userEmail,
        provider: "openai",
        model: OPENAI_MODEL,
        status: isTimeout ? "timeout" : "error",
        error_msg: errMsg.slice(0, 500),
        duration_ms: Date.now() - callStart,
      });
      throw e;
    }

    // ===== 6) Quota düşür — yazı için 5 Gri Token, ORTAK günlük havuzdan (RPC atomik). Admin'de atla =====
    if (!isAdmin) {
      const { error: consumeErr } = await supabase.rpc("consume_ai_quota_n", { p_user_id: userId, p_amount: WRITING_COST });
      if (consumeErr) console.error("consume_ai_quota_n failed:", consumeErr);
    }

    // ===== 7) Submission kaydet =====
    const totalScore = computeTotalScore(evaluation, textType);
    const totalMax = textType.rubric_json?.total_max ?? 30;

    await supabase.from("writing_submissions").insert({
      user_id: userId,
      exam: textType.exam,
      text_type: textType.text_type,
      level: level || null,
      prompt_id: prompt_id || null,
      prompt_snapshot,
      text,
      word_count,
      evaluation_json: evaluation,
      total_score: totalScore,
      total_max: totalMax,
      cost_quota: costQuota,
      cost_source: costSource,
    });

    // ===== 8) Güncel kotayı oku ve dön =====
    const { data: newQuotaRow } = await supabase
      .from("ai_quota")
      .select("daily_limit, daily_used_count, last_used_date, bonus_quota, bonus_used, writing_daily_used_count, writing_last_used_date, writing_daily_limit")
      .eq("user_id", userId)
      .maybeSingle();
    const newQuota = computeWritingQuota(newQuotaRow);

    return json({
      evaluation,
      total_score: totalScore,
      total_max: totalMax,
      cost_quota: costQuota,
      cost_source: costSource,
      quota: newQuota,
    });

  } catch (e: any) {
    console.error("Writing eval error:", e);
    return err("Sunucu hatası: " + (e?.message || String(e)), 500, "server_error");
  }
});

// =================================================================
// OPENAI CALL
// =================================================================
type AiCallResult = {
  evaluation: any;
  model: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  duration_ms: number;
};

async function callOpenAI(opts: {
  text: string;
  word_count: number;
  prompt_snapshot: string;
  textType: any;
  level: string | null;
  minWc?: number | null;
  maxWc?: number | null;
}): Promise<AiCallResult> {
  const { text, word_count, prompt_snapshot, textType, level, minWc, maxWc } = opts;

  const examName = textType.exam.toUpperCase();
  const textTypeName = textType.display_name;
  const rubric = textType.rubric_json;
  const criteria = rubric?.criteria || [];

  const rubricText = criteria.map((c: any) =>
    `- ${c.label} (key: "${c.key}") — max ${c.max_points} points: ${c.description}`
  ).join("\n");
  const totalMax = rubric?.total_max ?? 30;
  const levelStr = level ? ` (${level.toUpperCase()})` : "";

  const isIelts = examName === "IELTS";
  const isTask1 = /task\s*1/i.test(textTypeName);
  const ieltsGuidance = isIelts ? `
IELTS WRITING — RESMİ DEĞERLENDİRME MANTIĞI (bunu KATI uygula; bu bir IELTS ${textTypeName})
Dört kriter 1–9 band ölçeğinde ayrı ayrı puanlanır (yarım band serbest) ve ortalaması alınır. Kriterler:
1) ${isTask1 ? "TASK ACHIEVEMENT (Task 1)" : "TASK RESPONSE (Task 2)"} — ${isTask1
    ? "Öğrenci ana özellikleri/eğilimleri özetlemiş mi; bir Overview/Overall cümlesi (genel resim) VAR mı; verileri ve karşılaştırmaları doğru raporlamış mı; ≥150 kelime mi? Overview YOKSA bu kriter 5–6'yı geçemez."
    : "Prompt'un TÜM parçalarına cevap vermiş mi; net ve tutarlı bir position var mı; ana fikirler reason/example ile geliştirilmiş mi; ≥250 kelime mi? Tek taraf eksik veya position belirsizse 6'yı zor geçer."}
2) COHERENCE & COHESION — mantıksal ilerleme, net paragraflama (her paragrafta tek central idea), cohesive device'ların DOĞAL ve çeşitli kullanımı (mekanik/aşırı 'firstly, secondly' değil), referencing.
3) LEXICAL RESOURCE — kelime çeşitliliği ve İSABETİ, collocation, yerinde kullanılan less-common kelimeler, doğru spelling/word-formation.
4) GRAMMATICAL RANGE & ACCURACY — yapı çeşitliliği (complex/subordinate cümleler), doğruluk, noktalama.
BAND SINIRLARI (uygula):
- Band 5: görev kısmen/dengesiz karşılanmış; sınırlı kelime + belirgin hatalar; sınırlı gramer kontrolü.
- Band 6: görev karşılanmış ama fikirler under-developed; kelime yeterli ama limited/tekrarlı; hatalar fark edilir ama anlamı nadiren bozar.
- Band 7: net position/overview; geliştirilmiş & desteklenmiş fikirler; esnek kelime + some less-common lexis + collocation farkındalığı; sık sık hatasız complex cümleler.
- Band 8: tam gelişmiş; geniş ve isabetli kelime doğal kullanılmış; cümlelerin çoğu hatasız.
HER kriter yorumunda ŞUNU yap: (a) verdiğin band'ı yaz, (b) bu metinde o band'da TUTAN spesifik özelliği kısa bir alıntıyla göster, (c) bir üst yarım-band için TAM olarak neyi değiştireceğini söyle.
` : "";

  const systemPrompt = `You are Gri — an AI English tutor designed for Turkish university and high school students preparing for international exams. A student has submitted a ${textTypeName} for ${examName}${levelStr}. You will evaluate it against the rubric below.

RUBRIC (TOTAL: ${totalMax} points):
${rubricText}
${ieltsGuidance}
WORD COUNT CONTEXT
- Student's word count: ${word_count} words
- Target range for this text type: ${minWc ?? "—"} to ${maxWc ?? "—"} words${level === "hl" ? " (HL)" : level === "sl" ? " (SL)" : ""}
- If significantly under the minimum (e.g. less than 80% of minWc), explicitly mention this in your overallComment and reduce the relevant rubric scores (Task Achievement / Message / Task Response) accordingly because the response is incomplete.
- If significantly over the maximum (e.g. more than 130% of maxWc), mention that the response is too long, which often leads to weaker focus, repetition, or grammatical slips under time pressure. Still evaluate based on what is written.
- Do NOT refuse to evaluate or skip criteria because of word count. Score everything based on what the student wrote.

CHARACTER AND VOICE
- Direct but warm. Not distant or artificial. The student should feel they are reading words from a real mentor who pays attention.
- Specific and actionable. No clichés. Never write empty advice like "keep practicing" or "read more books".
- Speak about THIS text, not writing in general.

LANGUAGE OF EACH FIELD (CRITICAL)
All human-facing fields must be BILINGUAL with Turkish-DOMINANT code-switching, as a Turkish English teacher would speak with a student. Turkish carries the connective, explanatory, and advisory parts. English is preserved for technical terms (introduction, thesis, supporting evidence, cohesion, transitions, vocabulary range, paragraph structure, task achievement, lexical resource, run-on, fragment, articles, prepositions, subject-verb agreement, register, hedging, claim, counter-argument, etc.) and for direct quotes from the student's text.

- "scores": numeric values only (0.5 increments allowed).
- "comments": BILINGUAL TURKISH-DOMINANT. 4 to 6 sentences per criterion. Be detailed, not brief. Point to specific places in the student's text (cite short English fragments inline when useful). The LAST sentence of each comment must be a concrete next-step instruction for that specific criterion. Use exam-appropriate framing for the final sentence:
  - For IELTS, end with "X.X bandına çıkmak için [somut, spesifik aksiyon]." where X.X is one half-band above the score you assigned for that criterion.
  - For IB English B, end with "Bir üst achievement level'a çıkmak için [somut aksiyon]."
  - For TOEFL or other exams, end with "Bir üst seviyeye çıkmak için [somut aksiyon]."
  Example tone for IELTS Task Response: "Task response açısından prompt'a verdiğin cevap kısmen yeterli ama position belirsiz. Birinci body paragraphta 'tourism brings money' diye başlamışsın, hangi ülke veya hangi sektör belli değil, somut bir örnek konmamış. İkinci paragraphta counter-argument tek cümleyle geçilmiş, develop edilmemiş. Conclusion'da position tekrar edilmiş ama yeni bir formülasyon yok. 6.5 bandına çıkmak için her body paragraph'ta en az bir spesifik örnek koy (ülke, sektör, çalışma vb.) ve counter-argument'ı 3-4 cümleyle aç."
- "specificMistakes": Provide 8–12 items. Include TWO kinds:
  (a) ACTUAL ERRORS → "type": "grammar" | "convention" | "tone".
  (b) LEXICAL/STRUCTURAL UPGRADES → "type": "upgrade" — the phrase is correct but basic, repetitive or imprecise; show a stronger, more precise or more academic alternative (band-raising). If the text has few outright errors, include AT LEAST 4 "upgrade" items so the student always gets vocabulary/phrasing guidance ("yerine yazabileceği kelimeler").
  - "original": the exact phrase from the student's text, in English, as written.
  - "correction": the improved English. For "upgrade" items give 2–3 alternatives separated by " / " (e.g., "rose steadily / climbed gradually / increased progressively"); for errors give the single correct form.
  - "explanation": BILINGUAL TURKISH-DOMINANT. 1-2 sentences. Errors: neyin yanlış olduğunu + nedenini söyle (English grammar terms korunur). Upgrades: neden daha güçlü/daha isabetli olduğunu ve hangi bağlamda tercih edileceğini söyle. Örnek (error): "Subject-verb agreement hatası, 'students' plural olduğu için 'is' yerine 'are' gelmeli." Örnek (upgrade): "'increased' Task 1 için çok temel; 'rose steadily / climbed gradually' daha isabetli ve lexical resource band'ini yukarı çeker."
- "overallComment": BILINGUAL TURKISH-DOMINANT. 2-3 sentences. Example tone: "Argument yapın net ama supporting examples çok yüzeysel kalmış. Vocabulary range yeterli, fakat cohesion'da boşluklar var ve birkaç yerde awkward phrasing göze çarpıyor."
- "improvementAdvice": BILINGUAL TURKISH-DOMINANT. 3-5 sentences. Address the student directly ("sen", "yazın"). Focus on ONE priority improvement for this specific text and tell them exactly how to work on it. Never list multiple issues. Example tone: "Senin introduction'ın iyi ama body paragraph'larında supporting evidence çok zayıf. Özellikle ikinci paragraphta 'many people think' gibi vague claim'ler yerine somut bir örnek ver, kendi deneyimin veya bir okuduğun kaynaktan. Bir sonraki yazında her ana claim'in arkasına 'because + specific reason' yapısı ekle. Bu küçük disiplin senin development & support skorunu belirgin şekilde yukarı çeker."

EVALUATION APPROACH
- Apply the rubric rigorously. Be fair — do not inflate scores but also do not punish unnecessarily.
- In "specificMistakes" provide 8–12 items total: the most critical errors PLUS lexical/structural "upgrade" suggestions (weak→stronger phrasing with alternatives). "type" must be one of: "grammar", "convention", "tone", "upgrade". When the text is short or has few errors, prioritise "upgrade" items so the section is always substantial and genuinely useful.
- Mentor tone. Neither overly positive nor harsh.

NEVER WRITE THIS STYLE
"Yazını çok beğendim ama biraz daha pratik yapman gerekiyor. Cümle yapılarına dikkat et." This kind of vague feedback is forbidden.

SCORE KEYS
The keys inside "scores" and "comments" objects MUST be EXACTLY: ${criteria.map((c: any) => `"${c.key}"`).join(", ")}.`;

  const userQuery = `PROMPT GIVEN TO STUDENT:
"${prompt_snapshot}"

WORD COUNT: ${word_count}

STUDENT TEXT:
"""
${text}
"""

Evaluate and return JSON. Remember: ALL human-facing text fields ("comments", "specificMistakes.explanation", "overallComment", "improvementAdvice") must be BILINGUAL with TURKISH-DOMINANT code-switching, exactly as a Turkish English teacher would speak with a student. English is preserved for technical terms and direct quotes from the student's text. Only "specificMistakes.original" and "specificMistakes.correction" stay fully in English, since they reference the student's actual English text. Every "comments" entry must end with a concrete next-step sentence using exam-appropriate framing (IELTS "X.X bandına çıkmak için...", IB "bir üst achievement level'a çıkmak için...", others "bir üst seviyeye çıkmak için...").`;

  // Build OpenAI structured output schema (strict mode)
  const scoreProperties: any = {};
  const commentProperties: any = {};
  const scoreRequired: string[] = [];
  const commentRequired: string[] = [];
  criteria.forEach((c: any) => {
    scoreProperties[c.key] = { type: "number" };
    commentProperties[c.key] = { type: "string" };
    scoreRequired.push(c.key);
    commentRequired.push(c.key);
  });

  const schema = {
    type: "object",
    properties: {
      scores: {
        type: "object",
        properties: scoreProperties,
        required: scoreRequired,
        additionalProperties: false,
      },
      comments: {
        type: "object",
        properties: commentProperties,
        required: commentRequired,
        additionalProperties: false,
      },
      specificMistakes: {
        type: "array",
        items: {
          type: "object",
          properties: {
            original: { type: "string" },
            correction: { type: "string" },
            explanation: { type: "string" },
            type: { type: "string", enum: ["grammar", "convention", "tone", "upgrade"] },
          },
          required: ["original", "correction", "explanation", "type"],
          additionalProperties: false,
        },
      },
      overallComment: { type: "string" },
      improvementAdvice: { type: "string" },
    },
    required: ["scores", "comments", "specificMistakes", "overallComment", "improvementAdvice"],
    additionalProperties: false,
  };

  const requestBody = {
    model: OPENAI_MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userQuery },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "writing_evaluation",
        strict: true,
        schema,
      },
    },
    temperature: 0.4,
  };

  const start = Date.now();
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });
  const duration_ms = Date.now() - start;

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `OpenAI HTTP ${response.status}`);
  }

  const result = await response.json();
  const raw = result?.choices?.[0]?.message?.content;
  if (!raw) throw new Error("OpenAI'den geçerli yanıt alınamadı");

  if (result?.choices?.[0]?.message?.refusal) {
    throw new Error("Model değerlendirmeyi reddetti: " + result.choices[0].message.refusal);
  }

  const usage = result?.usage || {};
  return {
    evaluation: JSON.parse(raw),
    model: result?.model || OPENAI_MODEL,
    prompt_tokens: usage.prompt_tokens || 0,
    completion_tokens: usage.completion_tokens || 0,
    total_tokens: usage.total_tokens || 0,
    duration_ms,
  };
}

function computeTotalScore(evaluation: any, textType?: any): number {
  const scores = evaluation?.scores || {};
  const vals = Object.values(scores).map((v: any) => Number(v) || 0);
  if (!vals.length) return 0;
  // IELTS: her kriter 1-9 band; genel skor = kriterlerin ortalaması, en yakın 0.5 band'a yuvarlanır
  // (toplam DEĞİL — aksi halde total_max=9 ile "53/9" gibi anlamsız değer çıkıyordu).
  if (textType?.exam === "IELTS") {
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    return Math.round(avg * 2) / 2;
  }
  // Diğer sınavlar: kriter puanları toplamı (mevcut davranış korunur).
  return vals.reduce((a, b) => a + b, 0);
}