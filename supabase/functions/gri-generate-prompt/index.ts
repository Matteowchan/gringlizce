// ============================================================================
// GRI-GENERATE-PROMPT EDGE FUNCTION  (Writing Slice 3)
// ============================================================================
// Ogretmen icin AI prompt TASLAGI uretir. Sinav/tur/seviye/konu verilir; gercek
// sinav tarzinda tek bir yazma promptu + onerilen uzunluk + degerlendirme
// odaklari doner. TASLAKTIR: ogretmen gorur, duzenler, onaylar. Onaylamadan
// ogrenciye hicbir sey gitmez (yalniz modaldeki prompt kutusunu doldurur).
//
// Yetki: yalniz ogretmen (profiles.role='teacher') veya admin. Kota yok (dusuk
// frekans). Mevcut hicbir akisi degistirmez — tamamen yeni, additive fonksiyon.
//
// Body: { exam, text_type, level, topic }
// RESPONSE: { ok, prompt, suggested_length, criteria:[string], note }
// ============================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")!;
const MODEL = "gpt-4o";
const ADMIN_EMAILS = ["mertatasal@gmail.com", "atasal@gringlizce.com"];

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });
}

const PRICING: Record<string, { input: number; output: number }> = {
  "gpt-4o-mini": { input: 0.150, output: 0.600 },
  "gpt-4o": { input: 2.500, output: 10.000 },
};
function calcCostUsd(model: string, p: number, c: number): number {
  let pr = PRICING[model];
  if (!pr) { for (const k of Object.keys(PRICING)) { if (model.startsWith(k)) { pr = PRICING[k]; break; } } }
  if (!pr) return 0;
  return Number(((p / 1_000_000) * pr.input + (c / 1_000_000) * pr.output).toFixed(6));
}
async function logAiCall(p: Record<string, unknown>): Promise<void> {
  try { await supabase.from("ai_call_log").insert(p); } catch (e) { console.error("ai_call_log:", e); }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (req.method !== "POST") return json({ ok: false, error: "method_not_allowed" }, 405);

  const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "").trim();
  if (!token) return json({ ok: false, error: "unauthorized" }, 401);
  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData?.user) return json({ ok: false, error: "invalid_token" }, 401);
  const userId = userData.user.id;
  const userEmail = userData.user.email || null;

  const isAdmin = ADMIN_EMAILS.includes(userEmail || "");
  if (!isAdmin) {
    const { data: prof } = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle();
    if (!prof || prof.role !== "teacher") {
      return json({ ok: false, error: "forbidden", detail: "Bu islem yalnizca ogretmen/admin icindir." }, 403);
    }
  }

  let body: { exam?: string; text_type?: string; level?: string; topic?: string };
  try { body = await req.json(); } catch { return json({ ok: false, error: "invalid_body" }, 400); }

  const exam = String(body.exam || "").toUpperCase().slice(0, 40);
  const textType = String(body.text_type || "").slice(0, 80);
  const level = String(body.level || "").slice(0, 12);
  const topic = String(body.topic || "").trim().slice(0, 300);
  if (!topic) return json({ ok: false, error: "no_topic", detail: "Konu bos olamaz." }, 400);

  const SYSTEM = `You are an experienced ${exam || "English"} writing task designer. Produce ONE realistic ${exam || "English"} ${textType || "writing"} prompt for a student${level ? " at CEFR level " + level : ""}, on the given topic. The prompt must read exactly like a real exam question: self-contained, in clear English, appropriately demanding for the level, with no answer or explanation.

Return ONLY a JSON object:
{
  "prompt": "<the writing prompt itself, in English>",
  "suggested_length": "<e.g. '250-300 words'>",
  "criteria": ["<3 short evaluation focus points in English>"],
  "note": "<one short tip for the teacher, in Turkish>"
}

Rules:
- prompt: the task as a student would see it. For IELTS Task 2 use the standard 'To what extent...' / 'Discuss both views...' style; for Task 1 describe a chart/process to summarise; for TOEFL/IB match their real formats.
- Do not invent data figures for a Task-1-style prompt unless the topic implies them; keep it describable.
- criteria: short phrases (e.g. "Clear position developed with reasons").
- Plain text, no markdown.`;

  const userContent = `EXAM: ${exam || "(unspecified)"}\nTEXT TYPE: ${textType || "(unspecified)"}\nLEVEL: ${level || "(free)"}\nTOPIC: ${topic}`;

  let parsed: Record<string, unknown>;
  const callStart = Date.now();
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${OPENAI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "system", content: SYSTEM }, { role: "user", content: userContent }],
        max_tokens: 700,
        temperature: 0.6,
        response_format: { type: "json_object" },
      }),
    });
    if (!res.ok) {
      const t = await res.text();
      await logAiCall({ feature: "gri-generate-prompt", user_id: userId, user_email: userEmail, provider: "openai", model: MODEL, status: "error", error_msg: `HTTP ${res.status} ${t}`.slice(0, 500), duration_ms: Date.now() - callStart });
      return json({ ok: false, error: "ai_unavailable" }, 502);
    }
    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) { await logAiCall({ feature: "gri-generate-prompt", user_id: userId, user_email: userEmail, provider: "openai", model: MODEL, status: "error", error_msg: "no_content", duration_ms: Date.now() - callStart }); return json({ ok: false, error: "ai_no_content" }, 502); }
    parsed = JSON.parse(content);
    const usage = data?.usage || {};
    const model = data?.model || MODEL;
    await logAiCall({ feature: "gri-generate-prompt", user_id: userId, user_email: userEmail, provider: "openai", model, status: "success", duration_ms: Date.now() - callStart, prompt_tokens: usage.prompt_tokens || 0, completion_tokens: usage.completion_tokens || 0, total_tokens: usage.total_tokens || 0, cost_usd: calcCostUsd(model, usage.prompt_tokens || 0, usage.completion_tokens || 0) });
  } catch (e) {
    const errMsg = String(e);
    await logAiCall({ feature: "gri-generate-prompt", user_id: userId, user_email: userEmail, provider: "openai", model: MODEL, status: /timeout|aborted/i.test(errMsg) ? "timeout" : "error", error_msg: errMsg.slice(0, 500), duration_ms: Date.now() - callStart });
    return json({ ok: false, error: "ai_unavailable" }, 502);
  }

  const promptText = String(parsed.prompt || "").slice(0, 4000);
  const suggested = String(parsed.suggested_length || "").slice(0, 60);
  const criteria = Array.isArray(parsed.criteria) ? (parsed.criteria as unknown[]).map((x) => String(x).slice(0, 160)).slice(0, 5) : [];
  const note = String(parsed.note || "").slice(0, 400);
  if (!promptText) return json({ ok: false, error: "empty_prompt" }, 502);

  return json({ ok: true, prompt: promptText, suggested_length: suggested, criteria, note });
});
