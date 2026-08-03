// ============================================================================
// AI-DETECTOR-CHECK EDGE FUNCTION (metrik + rubrik)
// ============================================================================
// Gri English / Gringlizce - Paste-and-Check (Flow B)
//
// Tespit yontemi: deterministik dilsel metrikler (kod) + LLM rubrik degerlendirmesi.
// Nihai yuzde seffaf bir formulle KOD'da hesaplanir, modelin hissiyle degil.
// Hata yogunlugu en agir sinyaldir, ESL yanlis pozitifini sert keser.
//
// KOTA (ai_quota): gunde 2 ucretsiz, sonra 10 Gri Token (bonus). Admin muaf.
// Body: { text }
// RESPONSE: { ok, analysis, is_paid, cost, quota }
//   analysis = { estimate_low, estimate_high, band, summary, esl_note, flagged_sentences[], signals{} }
// ============================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") ?? "";

const DETECT_MODEL = "gpt-4.1";
const ADMIN_EMAILS = ["mertatasal@gmail.com", "atasal@gringlizce.com"];
const FREE_PER_DAY = 2;
const BONUS_COST = 10;

// ===== Skor agirliklari (ayarlanabilir) =====
const W = { error: 0.40, idiom: 0.20, burst: 0.15, structure: 0.15, connector: 0.10 };

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
function todayUTC(): string { return new Date().toISOString().slice(0, 10); }
function clamp(v: number, lo: number, hi: number): number { return Math.max(lo, Math.min(hi, v)); }
function round(v: number, d = 2): number { const f = Math.pow(10, d); return Math.round(v * f) / f; }

const PAYWALL_PACKS = [
  { slug: "ai-pack-10", name: "10 Soru", price: 100, url: "https://www.shopier.com/SATquestionBank/47230429" },
  { slug: "ai-pack-25", name: "25 Soru", price: 225, url: "https://www.shopier.com/SATquestionBank/47230479" },
  { slug: "ai-pack-50", name: "50 Soru", price: 425, url: "https://www.shopier.com/SATquestionBank/47230505" },
];

// ===== AI call logging (diger fonksiyonlardaki desen) =====
const PRICING: Record<string, { input: number; output: number }> = {
  "gpt-4o-mini":   { input: 0.150, output: 0.600 },
  "gpt-4o":        { input: 2.500, output: 10.000 },
  "gpt-4o-2024":   { input: 2.500, output: 10.000 },
  "gpt-4.1":       { input: 2.000, output: 8.000 },
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

// ===== 1) Deterministik metrikler =====
const CONNECTORS = [
  "moreover", "furthermore", "in addition", "additionally", "however", "therefore",
  "thus", "consequently", "in conclusion", "firstly", "secondly", "thirdly", "finally",
  "on the other hand", "for example", "for instance", "nevertheless", "nonetheless",
  "as a result", "overall", "to sum up", "in summary", "in contrast", "to conclude",
];

interface Metrics {
  sentence_count: number; mean_len: number; std_len: number; cv: number;
  ttr: number; total_words: number; connector_rate: number;
}

function computeMetrics(text: string): Metrics {
  const sentences = text.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter((s) => s.length > 0);
  const lens = sentences.map((s) => s.split(/\s+/).filter(Boolean).length).filter((n) => n > 0);
  const n = lens.length || 1;
  const mean = lens.reduce((a, b) => a + b, 0) / n;
  const variance = lens.reduce((a, b) => a + (b - mean) ** 2, 0) / n;
  const std = Math.sqrt(variance);
  const cv = mean > 0 ? std / mean : 0;

  const words = text.split(/\s+/).filter(Boolean);
  const lower = words.map((w) => w.toLowerCase().replace(/[^a-z']/g, "")).filter(Boolean);
  const ttr = lower.length ? new Set(lower).size / lower.length : 0;

  let connHits = 0;
  for (const s of sentences) {
    const head = s.toLowerCase();
    if (CONNECTORS.some((c) => head.startsWith(c + " ") || head.startsWith(c + ",") || head.startsWith(c + " ,"))) connHits++;
  }
  const connRate = sentences.length ? connHits / sentences.length : 0;

  return {
    sentence_count: sentences.length, mean_len: round(mean, 1), std_len: round(std, 1),
    cv: round(cv, 3), ttr: round(ttr, 3), total_words: words.length, connector_rate: round(connRate, 3),
  };
}

// ===== 2) LLM rubrik =====
const SYSTEM_PROMPT = `Sen bir Ingilizce yazi analizcisisin. Bir ogrenci metnini RUBRIK ile degerlendireceksin. Nihai yuzde hesabi KOD'a birakilacak, sen yalnizca asagidaki alanlari uretirsin.

Sen bir AI-detektoru DEGILSIN. Ogrenciler cogunlukla ana dili Ingilizce olmayan Turk ogrencilerdir. Gercek ogrenci hatalari (makale/edat hatalari, yanlis collocation, L1 transferi, awkward ifadeler, tutarsiz zaman) insan/ESL isaretidir ve onemlidir.

Sana metnin olculmus metrikleri verilecek (cumle sayisi, ortalama uzunluk, varyasyon katsayisi cv, baglac orani, kelime cesitliligi). Degerlendirirken bunlari dikkate al. Dusuk cv ve yuksek baglac orani AI'ya, yuksek cv ve dogal hatalar insana isaret eder.

Yalnizca su JSON nesnesini don, baska hicbir sey yazma:
{
  "idiomaticity": <0-10 tamsayi. Metnin seviye ustu, native-benzeri deyim ve akicilik derecesi. 0 = bariz ikinci dil/ogrenci, 10 = kusursuz native akicilik>,
  "formulaic_structure": <0-10 tamsayi. Genel, sablon, kalip yapi derecesi. 0 = ozgun ve duzensiz, 10 = tipik AI sablonu>,
  "learner_errors": [ { "original": "<metinden birebir hatali ifade>", "correction": "<dogrusu>", "type": "grammar|collocation|article|preposition|tense|awkward" } ],
  "flagged_sentences": [ { "text": "<AI gibi okunan birebir cumle>", "reason": "<Turkce kisa gerekce>" } ],
  "summary": "<Turkce 2-3 cumle, genel degerlendirme>",
  "esl_note": "<Turkce, hata desenleri ne soyluyor, AI mi insan mi>"
}

learner_errors: metindeki TUM gercek ogrenci hatalarini eksiksiz bul, sadece birkac ornek degil. Hata yogunlugu nihai skorda EN agir sinyaldir. Hata yoksa bos dizi.
flagged_sentences: AI gibi okunan TUM cumleler (orani genel izlenimle ortusur). En fazla 40 cumle. Yoksa bos dizi.`;

interface Rubric {
  idiomaticity: number;
  formulaic_structure: number;
  learner_errors: Array<{ original: string; correction: string; type: string }>;
  flagged_sentences: Array<{ text: string; reason: string }>;
  summary: string;
  esl_note: string;
}

type RubricResult = {
  rubric: Rubric; model: string;
  prompt_tokens: number; completion_tokens: number; total_tokens: number; duration_ms: number;
};

async function callRubric(text: string, m: Metrics): Promise<RubricResult> {
  if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY secret is not set");
  const start = Date.now();
  const metricsBlock = `OLCULEN METRIKLER:
- Cumle sayisi: ${m.sentence_count}
- Ortalama cumle uzunlugu: ${m.mean_len} kelime
- Uzunluk varyasyon katsayisi (cv): ${m.cv}  (dusuk = tekdüze = AI'ya yakin)
- Baglac orani: ${m.connector_rate}  (yuksek = kalip = AI'ya yakin)
- Kelime cesitliligi (ttr): ${m.ttr}
- Toplam kelime: ${m.total_words}`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Authorization": `Bearer ${OPENAI_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: DETECT_MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: metricsBlock + "\n\nINCELENECEK METIN:\n\n" + text },
      ],
      // "TUM hatalari eksiksiz bul" + 40 flagged cumle isteniyor; 15000 karakterlik
      // hata-yogun metinde dusuk limit JSON'u ortadan keser -> parse hatasi -> 502.
      max_tokens: 6000,
      temperature: 0.2,
      response_format: { type: "json_object" },
    }),
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
  if (choice?.finish_reason === "length") throw new Error("Rubric output truncated at max_tokens");

  let p: Record<string, unknown>;
  try { p = JSON.parse(content); } catch { throw new Error("OpenAI returned non-JSON content"); }

  const errors = Array.isArray(p.learner_errors)
    ? (p.learner_errors as Array<Record<string, unknown>>).slice(0, 60).map((e) => ({
        original: String(e.original || "").slice(0, 300),
        correction: String(e.correction || "").slice(0, 300),
        type: String(e.type || "").slice(0, 40),
      })).filter((e) => e.original)
    : [];
  const flagged = Array.isArray(p.flagged_sentences)
    ? (p.flagged_sentences as Array<Record<string, unknown>>).slice(0, 40).map((f) => ({
        text: String(f.text || "").slice(0, 600),
        reason: String(f.reason || "").slice(0, 300),
      })).filter((f) => f.text)
    : [];

  const rubric: Rubric = {
    idiomaticity: clamp(Math.round(Number(p.idiomaticity ?? 0)), 0, 10),
    formulaic_structure: clamp(Math.round(Number(p.formulaic_structure ?? 0)), 0, 10),
    learner_errors: errors,
    flagged_sentences: flagged,
    summary: String(p.summary || "").slice(0, 1200),
    esl_note: String(p.esl_note || "").slice(0, 1200),
  };
  const usage = data?.usage || {};
  return {
    rubric,
    model: data?.model || DETECT_MODEL,
    prompt_tokens: usage.prompt_tokens || 0,
    completion_tokens: usage.completion_tokens || 0,
    total_tokens: usage.total_tokens || 0,
    duration_ms: Date.now() - start,
  };
}

// ===== 3) Seffaf skor birlestirme =====
function computeBand(estimateHigh: number): string {
  if (estimateHigh > 65) return "Yüksek";
  if (estimateHigh >= 40) return "Orta";
  return "Düşük";
}

function buildAnalysis(m: Metrics, r: Rubric) {
  const errCount = r.learner_errors.length;
  const errPer100 = m.total_words > 0 ? (errCount / m.total_words) * 100 : 0;

  // Alt skorlar (0-100, yuksek = AI'ya yakin)
  const error_ai = clamp(Math.round(100 - errPer100 * 25), 0, 100);   // 4 hata/100kelime -> 0
  const idiom_ai = clamp(Math.round(r.idiomaticity * 10), 0, 100);
  const structure_ai = clamp(Math.round(r.formulaic_structure * 10), 0, 100);
  const burst_ai = clamp(Math.round(100 * (0.70 - m.cv) / (0.70 - 0.20)), 0, 100); // cv<=0.20 ->100, >=0.70 ->0
  const connector_ai = clamp(Math.round(100 * (m.connector_rate - 0.10) / (0.60 - 0.10)), 0, 100);

  let estimate = Math.round(
    W.error * error_ai + W.idiom * idiom_ai + W.burst * burst_ai +
    W.structure * structure_ai + W.connector * connector_ai,
  );

  // Sert kurallar: hata yogunlugu insan lehine baskindir
  if (errPer100 >= 5) estimate = Math.min(estimate, 18);
  else if (errPer100 >= 3) estimate = Math.min(estimate, 30);
  // Cok temiz + cok tekdüze metin yukari sabitlenir
  if (errPer100 < 0.5 && burst_ai > 70) estimate = Math.max(estimate, 70);
  // Akici-insan korumasi: dogal cumle varyasyonu (yuksek cv) + kalipsiz baglac kullanimi
  // insan isaretidir; temiz ama insansi metni "Yüksek" banda itme (yanlis pozitif keser)
  if (m.cv >= 0.55 && connector_ai < 40) estimate = Math.min(estimate, 55);
  estimate = clamp(estimate, 0, 100);

  const low = clamp(estimate - 8, 0, 100);
  const high = clamp(estimate + 8, 0, 100);

  return {
    estimate_low: low,
    estimate_high: high,
    band: computeBand(high),
    summary: r.summary,
    esl_note: r.esl_note,
    flagged_sentences: r.flagged_sentences,
    signals: {
      error_density: round(errPer100, 1),
      errors_count: errCount,
      burstiness_cv: m.cv,
      connector_rate: m.connector_rate,
      ttr: m.ttr,
      sentence_count: m.sentence_count,
      mean_len: m.mean_len,
      scores: { error_ai, idiom_ai, burst_ai, structure_ai, connector_ai },
    },
  };
}

// ===== Kota (ai_quota) =====
interface DetQuota { daily_free_remaining: number; bonus_checks: number; total_remaining: number; }
function computeDetectorQuota(row: Record<string, any> | null): DetQuota {
  const today = todayUTC();
  const last = row?.detector_last_used_date || null;
  const limit = Number(row?.detector_daily_limit ?? FREE_PER_DAY);
  const used = (last === today) ? Number(row?.detector_daily_used_count ?? 0) : 0;
  const dailyFree = Math.max(0, limit - used);
  const bonusRemaining = Math.max(0, Number(row?.bonus_quota ?? 0) - Number(row?.bonus_used ?? 0));
  const bonusChecks = Math.floor(bonusRemaining / BONUS_COST);
  return { daily_free_remaining: dailyFree, bonus_checks: bonusChecks, total_remaining: dailyFree + bonusChecks };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (req.method !== "POST") return json({ ok: false, error: "method_not_allowed" }, 405);

  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) return json({ ok: false, error: "unauthorized" }, 401);
  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData?.user) return json({ ok: false, error: "invalid_token" }, 401);
  const userId = userData.user.id;
  const userEmail = userData.user.email || null;
  const isAdmin = ADMIN_EMAILS.includes(userEmail || "");

  let body: { text?: string };
  try { body = await req.json(); } catch { return json({ ok: false, error: "invalid_body" }, 400); }
  const text = String(body.text || "").trim();
  if (text.length < 250) return json({ ok: false, error: "text_too_short", detail: "En az 250 karakter gerekli" }, 400);
  if (text.length > 15000) return json({ ok: false, error: "text_too_long", detail: "En fazla 15000 karakter" }, 400);

  // Ayni-metin cache: kullanici ayni metni daha once kontrol ettiyse sonucu
  // yeniden hesaplamadan don (kota YANMAZ, API maliyeti olusmaz).
  // Kota kontrolunden ONCE: hakki bitmis kullanici da eski sonucunu gorebilsin.
  try {
    const { data: cached } = await supabase.from("writing_sessions")
      .select("analysis, is_paid_check")
      .eq("teacher_id", userId).eq("check_type", "paste").eq("final_text", text)
      .not("analysis", "is", null)
      .order("submitted_at", { ascending: false }).limit(1).maybeSingle();
    if (cached?.analysis) {
      const { data: qRow } = await supabase.from("ai_quota")
        .select("bonus_quota, bonus_used, detector_daily_used_count, detector_last_used_date, detector_daily_limit")
        .eq("user_id", userId).maybeSingle();
      return json({ ok: true, analysis: cached.analysis, is_paid: false, cost: 0,
        is_cached: true, quota: computeDetectorQuota(qRow as Record<string, any> | null) });
    }
  } catch (e) { console.error("cache lookup failed:", e); }

  const { data: quotaRow } = await supabase
    .from("ai_quota")
    .select("bonus_quota, bonus_used, detector_daily_used_count, detector_last_used_date, detector_daily_limit")
    .eq("user_id", userId).maybeSingle();
  const quota = computeDetectorQuota(quotaRow as Record<string, any> | null);

  if (!isAdmin && quota.total_remaining <= 0) {
    return json({ ok: false, error: "quota_exhausted",
      message: "Bugunluk ucretsiz kontrolun bitti ve token yetersiz. Yarin tekrar dene veya Gri Token al.",
      packs: PAYWALL_PACKS, quota }, 402);
  }

  // Metrik + rubrik
  const metrics = computeMetrics(text);
  let analysis;
  const callStart = Date.now();
  try {
    const rr = await callRubric(text, metrics);
    analysis = buildAnalysis(metrics, rr.rubric);
    await logAiCall({
      feature: "ai-detector-check", user_id: userId, user_email: userEmail, provider: "openai",
      model: rr.model, status: "success", duration_ms: rr.duration_ms,
      prompt_tokens: rr.prompt_tokens, completion_tokens: rr.completion_tokens,
      total_tokens: rr.total_tokens,
      cost_usd: calcCostUsd(rr.model, rr.prompt_tokens, rr.completion_tokens),
    });
  } catch (e) {
    console.error("AI call failed:", e);
    const errMsg = String(e);
    const isTimeout = /timeout|timed out|aborted/i.test(errMsg);
    await logAiCall({
      feature: "ai-detector-check", user_id: userId, user_email: userEmail, provider: "openai",
      model: DETECT_MODEL, status: isTimeout ? "timeout" : "error", error_msg: errMsg.slice(0, 500),
      duration_ms: Date.now() - callStart,
    });
    return json({ ok: false, error: "ai_unavailable", detail: errMsg.slice(0, 300) }, 502);
  }

  // Kota dusur — ATOMIK RPC (read-modify-write yerine yaris kosulunu keser)
  let cost = 0;
  if (!isAdmin) {
    const { data: consumeData, error: consumeErr } = await supabase.rpc("consume_detector_quota", {
      p_user_id: userId, p_bonus_cost: BONUS_COST,
    });
    const row = Array.isArray(consumeData) ? consumeData[0] : consumeData;
    if (consumeErr) {
      console.error("consume_detector_quota failed:", consumeErr);
    } else if (row && row.success === false) {
      // Yaris kosulunda hak bitmis olabilir; analiz zaten uretildi, kullaniciyi cezalandirma
      console.warn("consume_detector_quota returned success=false (race)");
    } else if (row && row.used_free === false) {
      cost = BONUS_COST;
    }
  }

  // Gecmis
  const wordCount = metrics.total_words;
  try {
    await supabase.from("writing_sessions").insert({
      teacher_id: userId, student_name: "Yapıştırılan metin", final_text: text,
      word_count: wordCount, submitted_at: new Date().toISOString(),
      is_paid_check: cost > 0, check_type: "paste", analysis, active: false,
    });
  } catch (e) { console.error("session insert failed:", e); }

  const { data: newRow } = await supabase
    .from("ai_quota")
    .select("bonus_quota, bonus_used, detector_daily_used_count, detector_last_used_date, detector_daily_limit")
    .eq("user_id", userId).maybeSingle();
  const newQuota = computeDetectorQuota(newRow as Record<string, any> | null);

  return json({ ok: true, analysis, is_paid: cost > 0, cost, quota: newQuota });
});