// ============================================================================
// AI-TOOLS EDGE FUNCTION
// ============================================================================
// Gri English / Gringlizce
// Tek fonksiyon, coklu araç: humanizer, summarizer, paraphraser, grammar, translator
//
// KOTA (genel desen):
//   - Her araç gunde 2 ucretsiz (tool_usage_daily, feature bazli, tarih ile reset)
//   - Ucretsiz bitince kontrol basina 1 Gri Token (ortak ai_quota.bonus)
//   - Admin (ADMIN_EMAILS) atlar
//
// Body: { tool: string, text: string, options?: object }
// RESPONSE: { ok, output, corrections?, cost, quota }
//   402: { ok:false, error:'quota_exhausted', message, packs, quota }
// ============================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") ?? "";

const MODEL = "gpt-4o-mini";
const ADMIN_EMAILS = ["mertatasal@gmail.com", "atasal@gringlizce.com"];
const FREE_PER_DAY = 2;
const TOKEN_COST = 10;

const VALID_TOOLS = ["humanizer", "summarizer", "paraphraser", "grammar", "translator"];

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

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

const PAYWALL_PACKS = [
  { slug: "ai-pack-10", name: "10 Soru", price: 100, url: "https://www.shopier.com/SATquestionBank/47230429" },
  { slug: "ai-pack-25", name: "25 Soru", price: 225, url: "https://www.shopier.com/SATquestionBank/47230479" },
  { slug: "ai-pack-50", name: "50 Soru", price: 425, url: "https://www.shopier.com/SATquestionBank/47230505" },
];

const LANG_NAMES: Record<string, string> = { en: "English", tr: "Turkish", de: "German" };

// Tool basina sistem prompt + JSON modu gerekip gerekmedigi
function buildPrompts(tool: string, text: string, options: Record<string, string>) {
  let system = "";
  let jsonMode = false;

  if (tool === "humanizer") {
    system = `You are an English editor. Rewrite the user's text so it reads with a natural human cadence. Deliberately VARY sentence length a lot: mix short, punchy sentences with longer ones, break up uniform rhythm. Use natural, varied connectors instead of formulaic ones (avoid always starting with "Moreover", "Furthermore", "In addition"). Prefer plain, direct wording over polished, generic phrasing. Keep the original meaning, the language, and the writer's approximate level. Do not add new facts or arguments, do not inflate the vocabulary. Return ONLY the rewritten text, no preamble.`;
  } else if (tool === "summarizer") {
    const len = options.length === "kisa" ? "2-3 sentences"
      : options.length === "uzun" ? "a detailed paragraph"
      : "one short paragraph";
    system = `You are a summarizer. Summarize the user's English text in English in ${len}. Preserve the key points and main argument. Do not add opinions. Return ONLY the summary.`;
  } else if (tool === "paraphraser") {
    const tone = options.tone === "akademik" ? "an academic register"
      : options.tone === "resmi" ? "a formal register"
      : "a clear, plain register";
    system = `You are a paraphraser. Rewrite the user's English text in ${tone}, preserving meaning and language. Do not add new information. Return ONLY the paraphrase.`;
  } else if (tool === "grammar") {
    jsonMode = true;
    system = `You are an English grammar checker for ESL (Turkish) students. Correct grammar, spelling, and punctuation in the user's English text. Keep the student's meaning and style; do not rewrite for style, only fix errors.
Return ONLY this JSON object:
{
  "corrected": "<the full corrected English text>",
  "corrections": [ { "original": "<wrong phrase from text>", "correction": "<fixed phrase>", "explanation": "<Turkish-dominant short explanation, English grammar terms preserved>" } ]
}
List at most 12 corrections, only real errors. If there are none, return the text unchanged and an empty corrections array.`;
  } else if (tool === "translator") {
    const target = LANG_NAMES[options.target] || "English";
    system = `You are a translator. Translate the user's text into ${target}. Keep meaning and tone faithful and natural. Return ONLY the translation, no notes.`;
  }

  return { system, user: text, jsonMode };
}

type ModelResult = {
  content: string; model: string;
  prompt_tokens: number; completion_tokens: number; total_tokens: number; duration_ms: number;
};

async function callModel(system: string, user: string, jsonMode: boolean): Promise<ModelResult> {
  if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY secret is not set");
  const start = Date.now();
  const reqBody: Record<string, unknown> = {
    model: MODEL,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    // Girdi siniri 15000 karakter; grammar/humanizer tam metni yeniden uretir.
    // Dusuk limit ciktiyi ortadan keser (grammar'da yarim JSON'a yol acar).
    max_tokens: 8192,
    temperature: 0.5,
  };
  if (jsonMode) reqBody.response_format = { type: "json_object" };

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Authorization": `Bearer ${OPENAI_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(reqBody),
  });
  if (!res.ok) {
    const t = await res.text();
    console.error("OpenAI error:", res.status, t);
    throw new Error(`OpenAI request failed: ${res.status}`);
  }
  const data = await res.json();
  const choice = data?.choices?.[0];
  const content = choice?.message?.content;
  if (!content || typeof content !== "string") throw new Error("OpenAI returned no content");
  if (choice?.finish_reason === "length") {
    console.error("OpenAI output truncated at max_tokens; tool output may be incomplete");
    if (jsonMode) throw new Error("Output truncated (max_tokens) in JSON mode");
  }
  const usage = data?.usage || {};
  return {
    content: content.trim(),
    model: data?.model || MODEL,
    prompt_tokens: usage.prompt_tokens || 0,
    completion_tokens: usage.completion_tokens || 0,
    total_tokens: usage.total_tokens || 0,
    duration_ms: Date.now() - start,
  };
}

// ===== AI call logging (diger fonksiyonlardaki desen) =====
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
  return Number((((promptTokens / 1_000_000) * pricing.input) + ((completionTokens / 1_000_000) * pricing.output)).toFixed(6));
}
type LogPayload = {
  feature: string; user_id: string | null; user_email: string | null; provider: string;
  model?: string | null; status: "success" | "error" | "timeout"; error_msg?: string | null;
  duration_ms: number; prompt_tokens?: number; completion_tokens?: number; total_tokens?: number; cost_usd?: number;
};
async function logAiCall(p: LogPayload): Promise<void> {
  try {
    await supabase.from("ai_call_log").insert({
      feature: p.feature, user_id: p.user_id, user_email: p.user_email, provider: p.provider,
      model: p.model || null, status: p.status, error_msg: p.error_msg || null, duration_ms: p.duration_ms,
      prompt_tokens: p.prompt_tokens || null, completion_tokens: p.completion_tokens || null,
      total_tokens: p.total_tokens || null, cost_usd: p.cost_usd || 0,
    });
  } catch (e) { console.error("ai_call_log insert failed:", e); }
}

interface ToolQuota { daily_free_remaining: number; bonus_tokens: number; total_remaining: number; }

function computeQuota(toolRow: Record<string, any> | null, bonusRow: Record<string, any> | null): ToolQuota {
  const today = todayUTC();
  const used = (toolRow && toolRow.used_date === today) ? Number(toolRow.used_count || 0) : 0;
  const dailyFree = Math.max(0, FREE_PER_DAY - used);
  const bonusRemaining = Math.max(0, Number(bonusRow?.bonus_quota ?? 0) - Number(bonusRow?.bonus_used ?? 0));
  const bonusTokens = Math.floor(bonusRemaining / TOKEN_COST);
  return { daily_free_remaining: dailyFree, bonus_tokens: bonusTokens, total_remaining: dailyFree + bonusTokens };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (req.method !== "POST") return json({ ok: false, error: "method_not_allowed" }, 405);

  // Auth
  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) return json({ ok: false, error: "unauthorized" }, 401);
  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData?.user) return json({ ok: false, error: "invalid_token" }, 401);
  const userId = userData.user.id;
  const userEmail = userData.user.email || null;
  const isAdmin = ADMIN_EMAILS.includes(userEmail || "");

  // Body
  let body: { tool?: string; text?: string; options?: Record<string, string> };
  try {
    body = await req.json();
  } catch {
    return json({ ok: false, error: "invalid_body" }, 400);
  }
  const tool = String(body.tool || "").trim();
  const text = String(body.text || "").trim();
  const options = (body.options && typeof body.options === "object") ? body.options : {};

  if (!VALID_TOOLS.includes(tool)) return json({ ok: false, error: "invalid_tool" }, 400);
  if (text.length < 20) return json({ ok: false, error: "text_too_short", detail: "En az 20 karakter gerekli" }, 400);
  if (text.length > 15000) return json({ ok: false, error: "text_too_long", detail: "En fazla 15000 karakter" }, 400);

  // Kota oku
  const { data: toolRow } = await supabase
    .from("tool_usage_daily").select("used_date, used_count")
    .eq("user_id", userId).eq("feature", tool).maybeSingle();
  const { data: bonusRow } = await supabase
    .from("ai_quota").select("bonus_quota, bonus_used")
    .eq("user_id", userId).maybeSingle();

  const quota = computeQuota(toolRow as Record<string, any> | null, bonusRow as Record<string, any> | null);

  if (!isAdmin && quota.total_remaining <= 0) {
    return json({
      ok: false,
      error: "quota_exhausted",
      message: "Bu araçta bugunluk ucretsiz hakkin bitti ve token yetersiz. Yarin tekrar dene veya Gri Token al.",
      packs: PAYWALL_PACKS,
      quota,
    }, 402);
  }

  // AI cagrisi (dusum basaridan sonra)
  const { system, user, jsonMode } = buildPrompts(tool, text, options);
  let raw: string;
  const callStart = Date.now();
  try {
    const aiRes = await callModel(system, user, jsonMode);
    raw = aiRes.content;
    await logAiCall({
      feature: `ai-tools:${tool}`, user_id: userId, user_email: userEmail, provider: "openai",
      model: aiRes.model, status: "success", duration_ms: aiRes.duration_ms,
      prompt_tokens: aiRes.prompt_tokens, completion_tokens: aiRes.completion_tokens,
      total_tokens: aiRes.total_tokens,
      cost_usd: calcCostUsd(aiRes.model, aiRes.prompt_tokens, aiRes.completion_tokens),
    });
  } catch (e) {
    console.error("AI call failed:", e);
    const errMsg = String(e);
    const isTimeout = /timeout|timed out|aborted/i.test(errMsg);
    await logAiCall({
      feature: `ai-tools:${tool}`, user_id: userId, user_email: userEmail, provider: "openai",
      model: MODEL, status: isTimeout ? "timeout" : "error", error_msg: errMsg.slice(0, 500),
      duration_ms: Date.now() - callStart,
    });
    return json({ ok: false, error: "ai_unavailable", detail: errMsg.slice(0, 300) }, 502);
  }

  // Sonucu sekillendir
  let output = raw;
  let corrections: Array<{ original: string; correction: string; explanation: string }> | undefined;
  if (jsonMode) {
    try {
      const parsed = JSON.parse(raw);
      output = String(parsed.corrected || "");
      if (Array.isArray(parsed.corrections)) {
        corrections = parsed.corrections.slice(0, 12).map((x: Record<string, unknown>) => ({
          original: String(x.original || "").slice(0, 400),
          correction: String(x.correction || "").slice(0, 400),
          explanation: String(x.explanation || "").slice(0, 400),
        }));
      }
    } catch {
      // JSON gelmezse ham metni don
      output = raw;
    }
  }

  // Kota dusur (admin atlar) — ATOMIK RPC (read-modify-write yerine yaris kosulunu keser)
  let cost = 0;
  if (!isAdmin) {
    const { data: consumeData, error: consumeErr } = await supabase.rpc("consume_tool_quota", {
      p_user_id: userId, p_feature: tool, p_free_per_day: FREE_PER_DAY, p_token_cost: TOKEN_COST,
    });
    const row = Array.isArray(consumeData) ? consumeData[0] : consumeData;
    if (consumeErr) {
      console.error("consume_tool_quota failed:", consumeErr);
    } else if (row && row.success === false) {
      // Yaris kosulunda hak bitmis olabilir; AI zaten uretildi, kullaniciyi cezalandirma
      console.warn("consume_tool_quota returned success=false (race)");
    } else if (row && row.used_free === false) {
      cost = TOKEN_COST;
    }
  }

  // Guncel kota
  const { data: newToolRow } = await supabase
    .from("tool_usage_daily").select("used_date, used_count")
    .eq("user_id", userId).eq("feature", tool).maybeSingle();
  const { data: newBonusRow } = await supabase
    .from("ai_quota").select("bonus_quota, bonus_used")
    .eq("user_id", userId).maybeSingle();
  const newQuota = computeQuota(newToolRow as Record<string, any> | null, newBonusRow as Record<string, any> | null);

  return json({ ok: true, output, corrections, cost, quota: newQuota });
});