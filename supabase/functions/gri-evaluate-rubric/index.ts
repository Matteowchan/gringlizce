// ============================================================================
// GRI-EVALUATE-RUBRIC EDGE FUNCTION
// ============================================================================
// Ogretmen yazi degerlendirme sayfasi icin AI taslak degerlendirme.
// Ogrenci metnini verilen rubrik kriterlerine gore puanlar, kisa geri bildirim verir.
// Ogretmen taslagi kontrol edip duzenler ve kendisi kaydeder.
//
// Yetki: gecerli oturum yeter (bu sayfaya yalnizca yetkili ogretmen/admin erisir).
// Token tuketmez. Gerekirse sonradan kota eklenebilir.
//
// Body: { text, prompt, exam, text_type, criteria:[{key,label,min,max,step}], unit }
// RESPONSE: { ok, scores:{<key>:number}, summary }
// ============================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")!;
const MODEL = "gpt-4o";

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
function clamp(v: number, lo: number, hi: number): number { return Math.max(lo, Math.min(hi, v)); }

interface Criterion { key: string; label: string; min: number; max: number; step: number; }

function snap(v: number, c: Criterion): number {
  if (isNaN(v)) return c.min;
  var stepped = c.min + Math.round((v - c.min) / c.step) * c.step;
  var r = clamp(stepped, c.min, c.max);
  // ondalik artiklari temizle (0.5 adimlari icin)
  return Math.round(r * 100) / 100;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (req.method !== "POST") return json({ ok: false, error: "method_not_allowed" }, 405);

  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) return json({ ok: false, error: "unauthorized" }, 401);
  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData?.user) return json({ ok: false, error: "invalid_token" }, 401);

  let body: {
    text?: string; prompt?: string; exam?: string; text_type?: string;
    criteria?: Criterion[]; unit?: string;
  };
  try { body = await req.json(); } catch { return json({ ok: false, error: "invalid_body" }, 400); }

  const text = String(body.text || "").trim();
  if (text.length < 50) return json({ ok: false, error: "text_too_short", detail: "Ogrenci metni cok kisa." }, 400);
  if (text.length > 15000) return json({ ok: false, error: "text_too_long" }, 400);

  const criteria = Array.isArray(body.criteria)
    ? body.criteria.filter((c) => c && c.key).map((c) => ({
        key: String(c.key), label: String(c.label || c.key),
        min: Number(c.min), max: Number(c.max), step: Number(c.step) || 1,
      }))
    : [];
  if (criteria.length === 0) return json({ ok: false, error: "no_criteria" }, 400);

  const exam = String(body.exam || "").toUpperCase();
  const textType = String(body.text_type || "");
  const prompt = String(body.prompt || "").slice(0, 4000);

  const critSpec = criteria.map((c) =>
    `- ${c.key} (${c.label}): ${c.min} to ${c.max}, step ${c.step}`).join("\n");

  // Gorev tipine ozgu yonerge (Task 1 ve Task 2 farkli olculur)
  const keys = criteria.map((c) => c.key);
  const isIelts = exam === "IELTS";
  const isTask1 = isIelts && (/task\s*1/i.test(textType) || keys.includes("task_achievement"));
  const isTask2 = isIelts && (/task\s*2/i.test(textType) || keys.includes("task_response"));
  let taskGuidance = "";
  if (isTask1) {
    taskGuidance = `\n\nTASK GUIDANCE (IELTS Academic Writing Task 1): The student must objectively describe and summarize the visual data. Reward a clear overview of the main trends, accurate selection and comparison of the key figures, and appropriate data-description language. Do NOT expect or reward a personal opinion or argument. Minimum length is about 150 words, penalize clear under-length. Task Achievement concerns coverage and accuracy of the data, not persuasion.`;
  } else if (isTask2) {
    taskGuidance = `\n\nTASK GUIDANCE (IELTS Writing Task 2): The student must present and develop a clear position on the prompt with relevant ideas, reasons, and examples, organized logically across paragraphs. Minimum length is about 250 words, penalize clear under-length. Task Response concerns how fully the prompt is addressed and how well the position is developed, not data description.`;
  }

  const SYSTEM = `You are an experienced ${exam || "English"} writing examiner. Evaluate the student's writing strictly against the official descriptors for each criterion. Score each criterion within its allowed range and step. Be accurate and fair, do not inflate scores, and do not penalize a student for non-native errors beyond what the descriptors require.

Return ONLY a JSON object, nothing else:
{
  "scores": { ${criteria.map((c) => `"${c.key}": <number>`).join(", ")} },
  "summary": "<concise professional feedback in English>"
}

Rules:
- Each score must respect its range and step exactly.
- summary: at most about 180 words. One short justification per criterion, then one overall line. Plain prose, no markdown, no bullet symbols.${taskGuidance}`;

  const userContent = `EXAM: ${exam}${textType ? " (" + textType + ")" : ""}

CRITERIA AND SCALES:
${critSpec}

TASK PROMPT:
${prompt || "(not provided)"}

STUDENT WRITING:
${text}`;

  let parsed: Record<string, unknown>;
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${OPENAI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "system", content: SYSTEM }, { role: "user", content: userContent }],
        max_tokens: 900,
        temperature: 0.2,
        response_format: { type: "json_object" },
      }),
    });
    if (!res.ok) {
      const t = await res.text();
      console.error("OpenAI error:", res.status, t);
      return json({ ok: false, error: "ai_unavailable" }, 502);
    }
    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) return json({ ok: false, error: "ai_no_content" }, 502);
    parsed = JSON.parse(content);
  } catch (e) {
    console.error("AI call failed:", e);
    return json({ ok: false, error: "ai_unavailable" }, 502);
  }

  const rawScores = (parsed.scores || {}) as Record<string, unknown>;
  const scores: Record<string, number> = {};
  for (const c of criteria) {
    const v = Number(rawScores[c.key]);
    scores[c.key] = snap(v, c);
  }
  const summary = String(parsed.summary || "").slice(0, 3000);

  return json({ ok: true, scores, summary });
});