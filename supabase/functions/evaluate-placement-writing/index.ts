// supabase/functions/evaluate-placement-writing/index.ts
// -----------------------------------------------------------------------------
// Seviye belirleme sınavının Writing bölümünü (Story + Essay) Gri AI ile
// otomatik değerlendirir. CEFR B1+ / FCE tarzı 4 kriter üzerinden puanlar,
// Türkçe geri bildirim döndürür. Öğrenci (giriş yapmış) sonuç ekranından çağırır.
//
// Deploy: supabase functions deploy evaluate-placement-writing
// Secret: OPENAI_API_KEY
// -----------------------------------------------------------------------------

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")!;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface Task { type: string; prompt: string; text: string; min?: number; max?: number; }

const SYS = `You are an experienced Cambridge English examiner grading B1+/B2 (FCE for Schools) level writing from Turkish learners of English. For EACH task, assess four criteria on a 0–5 scale:
- content: task fully addressed, relevant, right length
- communication: appropriate register and effect on the reader (story = engaging; essay = formal)
- organisation: paragraphing, logical order, linking devices
- language: range and accuracy of vocabulary and grammar
Then give an overall CEFR estimate for that piece (one of: A1, A2, B1, "B1+", B2, C1).
Be honest and calibrated: gibberish, off-topic, or very short/empty answers must get low scores (0–1) and A1/A2. Do NOT inflate.
Write "strengths", "improvements" and "comment" in TURKISH, concise and specific (mention actual issues: tenses, linking words, vocabulary, task completion). Keep each under ~40 words.
Return ONLY valid JSON in this exact shape:
{"evaluations":[{"type":"...","cefr":"...","overall20":<0-20 integer>,"scores":{"content":<0-5>,"communication":<0-5>,"organisation":<0-5>,"language":<0-5>},"strengths":"...","improvements":"...","comment":"..."}]}`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405, headers: CORS });
  if (!OPENAI_API_KEY) return new Response(JSON.stringify({ error: "OPENAI_API_KEY missing" }), { status: 500, headers: { ...CORS, "Content-Type": "application/json" } });

  let body: { tasks?: Task[] };
  try { body = await req.json(); } catch { return new Response(JSON.stringify({ error: "invalid json" }), { status: 400, headers: { ...CORS, "Content-Type": "application/json" } }); }

  const tasks = (body.tasks || []).filter((t) => t && typeof t.text === "string");
  if (!tasks.length) return new Response(JSON.stringify({ error: "no tasks" }), { status: 400, headers: { ...CORS, "Content-Type": "application/json" } });

  // Aşırı uzun girişleri kırp (token güvenliği)
  const userMsg = tasks.map((t, i) =>
    `TASK ${i + 1} — ${t.type} (target ${t.min ?? "?"}–${t.max ?? "?"} words)\nPROMPT: ${String(t.prompt).slice(0, 400)}\nSTUDENT ANSWER:\n${String(t.text).slice(0, 3000) || "(empty)"}`
  ).join("\n\n---\n\n");

  try {
    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.2,
        max_tokens: 1200,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYS },
          { role: "user", content: "Grade the following. Return one evaluation object per task, in order.\n\n" + userMsg },
        ],
      }),
    });
    const data = await resp.json();
    if (!resp.ok) {
      return new Response(JSON.stringify({ error: data?.error?.message || `HTTP ${resp.status}` }), { status: 502, headers: { ...CORS, "Content-Type": "application/json" } });
    }
    const content = data?.choices?.[0]?.message?.content || "{}";
    let parsed: unknown;
    try { parsed = JSON.parse(content); } catch { parsed = { evaluations: [] }; }
    return new Response(JSON.stringify(parsed), { headers: { ...CORS, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), { status: 502, headers: { ...CORS, "Content-Type": "application/json" } });
  }
});
