// ============================================================================
// GRI-CLASSIFY-TARGETS EDGE FUNCTION  (Writing Slice 4)
// ============================================================================
// Ogretmenin belirledigi hedef dil ogelerini (zorunlu/onerilen kelime, baglac,
// gramer hedefi, kacinilacak ifade) ogrencinin yazisinda GERCEK kullanima gore
// siniflandirir: correct (dogru+baglama uygun) / weak (kullanildi ama zayif) /
// unused (kullanilmadi) / overused (gereksiz tekrar). 'avoid' icin 'unused' iyi,
// kullanim 'flagged'. Puan salt gecise gore verilmez; baglam+dogruluk esas.
//
// Yetki: gecerli oturum (ogrenci kendi geri bildirimi icin cagirir). Ucuz model
// (gpt-4o-mini). Yeni, additive fonksiyon — mevcut hicbir akisi degistirmez.
//
// Body: { text, targets: { required?, suggested?, linking?, grammar?, avoid? } }
// RESPONSE: { ok, results: [{ term, kind, status }] }
// ============================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")!;
const MODEL = "gpt-4o-mini";
const MAX_INPUT_CHARS = 12000;
const MAX_TERMS = 40;

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });
}
async function logAiCall(p: Record<string, unknown>): Promise<void> {
  try { await supabase.from("ai_call_log").insert(p); } catch (e) { console.error("ai_call_log:", e); }
}

const KIND_ORDER = ["required", "suggested", "linking", "grammar", "avoid"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (req.method !== "POST") return json({ ok: false, error: "method_not_allowed" }, 405);

  const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "").trim();
  if (!token) return json({ ok: false, error: "unauthorized" }, 401);
  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData?.user) return json({ ok: false, error: "invalid_token" }, 401);
  const userId = userData.user.id;
  const userEmail = userData.user.email || null;

  let body: { text?: string; targets?: Record<string, unknown> };
  try { body = await req.json(); } catch { return json({ ok: false, error: "invalid_body" }, 400); }

  const text = String(body.text || "").trim();
  if (text.length < 30) return json({ ok: false, error: "text_too_short" }, 400);
  if (text.length > MAX_INPUT_CHARS) return json({ ok: false, error: "text_too_long" }, 400);

  const targetsObj = (body.targets && typeof body.targets === "object") ? body.targets : {};
  const flat: { term: string; kind: string }[] = [];
  for (const kind of KIND_ORDER) {
    const arr = (targetsObj as Record<string, unknown>)[kind];
    if (Array.isArray(arr)) {
      for (const t of arr) {
        const term = String(t || "").trim();
        if (term && flat.length < MAX_TERMS) flat.push({ term, kind });
      }
    }
  }
  if (flat.length === 0) return json({ ok: true, results: [] });

  const list = flat.map((t, i) => `${i + 1}. [${t.kind}] ${t.term}`).join("\n");

  const SYSTEM = `You judge how well a student used specific target language items in their writing. For each item, return a status:
- "correct": used accurately and appropriately in context.
- "weak": attempted/used but with a grammar, collocation, or context problem.
- "unused": not present in the writing.
- "overused": used more than necessary / repeated mechanically.
Item kinds: required/suggested = words or phrases; linking = connectors; grammar = a structure (e.g. passive, relative clause) — judge whether the structure is used correctly; avoid = the student should NOT use it, so "unused" is good and any real use should be "weak" (flag it).
Judge by MEANING and CORRECTNESS, not mere presence. Return ONLY JSON: {"results":[{"i":<item number>,"status":"correct|weak|unused|overused"}]}.`;

  const userContent = `TARGET ITEMS:\n${list}\n\nSTUDENT WRITING:\n${text}`;

  let parsed: Record<string, unknown>;
  const callStart = Date.now();
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${OPENAI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: MODEL, messages: [{ role: "system", content: SYSTEM }, { role: "user", content: userContent }], max_tokens: 700, temperature: 0.1, response_format: { type: "json_object" } }),
    });
    if (!res.ok) {
      const t = await res.text();
      await logAiCall({ feature: "gri-classify-targets", user_id: userId, user_email: userEmail, provider: "openai", model: MODEL, status: "error", error_msg: `HTTP ${res.status} ${t}`.slice(0, 500), duration_ms: Date.now() - callStart });
      return json({ ok: false, error: "ai_unavailable" }, 502);
    }
    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) return json({ ok: false, error: "ai_no_content" }, 502);
    parsed = JSON.parse(content);
    const usage = data?.usage || {};
    await logAiCall({ feature: "gri-classify-targets", user_id: userId, user_email: userEmail, provider: "openai", model: data?.model || MODEL, status: "success", duration_ms: Date.now() - callStart, prompt_tokens: usage.prompt_tokens || 0, completion_tokens: usage.completion_tokens || 0, total_tokens: usage.total_tokens || 0 });
  } catch (e) {
    await logAiCall({ feature: "gri-classify-targets", user_id: userId, user_email: userEmail, provider: "openai", model: MODEL, status: "error", error_msg: String(e).slice(0, 500), duration_ms: Date.now() - callStart });
    return json({ ok: false, error: "ai_unavailable" }, 502);
  }

  const rawResults = Array.isArray(parsed.results) ? parsed.results : [];
  const byIndex: Record<number, string> = {};
  const VALID = ["correct", "weak", "unused", "overused"];
  for (const r of rawResults as Array<Record<string, unknown>>) {
    const idx = Number(r.i);
    let st = String(r.status || "").toLowerCase();
    if (!VALID.includes(st)) st = "unused";
    if (idx >= 1 && idx <= flat.length) byIndex[idx] = st;
  }
  const results = flat.map((t, i) => ({ term: t.term, kind: t.kind, status: byIndex[i + 1] || "unused" }));
  return json({ ok: true, results });
});
