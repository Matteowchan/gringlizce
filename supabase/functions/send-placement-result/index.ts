// supabase/functions/send-placement-result/index.ts
// -----------------------------------------------------------------------------
// Seviye belirleme sınavı sonucunu profesyonel bir HTML rapor olarak Resend ile
// e-postayla gönderir. Öğrenci (giriş yapmış) sonuç ekranından tetikler.
// Sonucu placement_results tablosuna da kaydeder (best-effort).
//
// Deploy:  supabase functions deploy send-placement-result
// Secrets: RESEND_API_KEY, RESEND_FROM_EMAIL (verify edilmiş domain)
// -----------------------------------------------------------------------------

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const FROM = Deno.env.get("RESEND_FROM_EMAIL") || "Gri English <onboarding@resend.dev>";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface Skill { name: string; short?: string; c: number; t: number; pct: number; level: string; what?: string; comment?: string; study?: string; }
interface Result {
  cefr: string; cefrName: string; score: number; total: number; pct: number;
  skills: Skill[]; missedTopics: string[]; wrongCount: number;
}

const CEFR_DESC: Record<string, string> = {
  "C1": "İleri seviye. Karmaşık metinleri ve konuşmaları rahatça anlıyor, akıcı ve doğru bir dil kullanıyorsun.",
  "B2": "Üst-orta seviye. Çoğu durumda akıcısın; soyut konuları da büyük ölçüde takip edebiliyorsun.",
  "B1+": "Orta seviyenin üstü. Günlük ve tanıdık akademik konularda kendini iyi ifade ediyorsun; sağlam bir temelin var.",
  "B1": "Orta seviye. Tanıdık konularda iletişim kurabiliyorsun; yapı ve kelime dağarcığını genişletmek seni bir üst basamağa taşır.",
  "A2": "Temel-üstü seviye. Basit, günlük ifadeleri anlıyor ve kullanıyorsun; düzenli çalışmayla hızla ilerleyebilirsin.",
  "A1": "Başlangıç seviyesi. Temel kelime ve kalıpları tanıyorsun; sistemli bir programla sağlam bir temel kurabilirsin.",
};

function esc(s: unknown): string {
  return String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string));
}
function barColor(level: string): string {
  return level === "g" ? "#4a8a52" : level === "w" ? "#c08a2c" : "#b94a4a";
}
function levelLabel(level: string): string {
  return level === "g" ? "Güçlü" : level === "w" ? "Geliştirilebilir" : "Öncelikli eksik";
}

function bar(pct: number, color: string): string {
  const w = Math.max(3, Math.min(100, pct));
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:#ece4d2;border-radius:5px;overflow:hidden;margin-top:4px">
    <tr><td width="${w}%" style="background:${color};height:9px;font-size:0;line-height:0">&nbsp;</td><td style="font-size:0;line-height:0">&nbsp;</td></tr></table>`;
}

function buildEmail(name: string, r: Result): string {
  const cefrDesc = CEFR_DESC[r.cefr] || "";
  const enc = (o: unknown) => encodeURIComponent(JSON.stringify(o));
  const barCfg = { type: "horizontalBar", data: { labels: r.skills.map((s) => s.short || s.name), datasets: [{ data: r.skills.map((s) => s.pct), backgroundColor: r.skills.map((s) => barColor(s.level)) }] }, options: { legend: { display: false }, title: { display: true, text: "Beceri profili (% dogru)", fontColor: "#1f3f3e", fontSize: 15 }, scales: { xAxes: [{ ticks: { min: 0, max: 100, fontColor: "#6a6a6a" } }], yAxes: [{ ticks: { fontColor: "#333", fontSize: 11 } }] } } };
  const barUrl = "https://quickchart.io/chart?bkg=white&w=560&h=300&c=" + enc(barCfg);
  const doughCfg = { type: "doughnut", data: { labels: ["Dogru", "Yanlis"], datasets: [{ data: [r.score, Math.max(0, r.total - r.score)], backgroundColor: ["#2C5856", "#e6ddca"] }] }, options: { legend: { position: "bottom", labels: { fontColor: "#333" } }, cutoutPercentage: 62, title: { display: true, text: r.cefr + " · %" + r.pct, fontColor: "#2C5856", fontSize: 18 } } };
  const doughUrl = "https://quickchart.io/chart?bkg=white&w=320&h=280&c=" + enc(doughCfg);
  const skillRows = r.skills.map((s) => `
    <tr><td style="padding:9px 0;border-bottom:1px solid #efe8d6">
      <div style="font-size:14px;color:#1b1b1b">${esc(s.name)}
        <span style="float:right;font-weight:700;color:${barColor(s.level)}">${s.c}/${s.t} · %${s.pct}</span></div>
      ${bar(s.pct, barColor(s.level))}
    </td></tr>`).join("");

  const details = r.skills.map((s) => `
    <div style="background:#faf7ee;border-radius:10px;padding:14px 16px;margin:10px 0">
      <div style="font-family:Georgia,serif;font-size:15px;color:#1f3f3e;font-weight:700">${esc(s.name)}
        <span style="font-size:11px;font-weight:700;padding:2px 9px;border-radius:11px;color:#fff;background:${barColor(s.level)};margin-left:6px">${levelLabel(s.level)} · %${s.pct}</span></div>
      ${s.what ? `<div style="font-size:12.5px;color:#6a6a6a;margin:4px 0">${esc(s.what)}</div>` : ""}
      <div style="font-size:13px;color:#1b1b1b;margin:6px 0">${esc(s.comment)}</div>
      ${s.study ? `<div style="font-size:13px;margin-top:4px"><b style="color:#1f3f3e">Çalışma önerisi:</b> ${esc(s.study)}</div>` : ""}
    </div>`).join("");

  const topics = (r.missedTopics && r.missedTopics.length)
    ? `<h2 style="font-family:Georgia,serif;color:#1f3f3e;font-size:17px;border-bottom:2px solid #c89a3c;padding-bottom:6px;margin-top:26px">Öncelikli çalışman gereken konular</h2>
       <p style="font-size:13px;color:#6a6a6a;margin:6px 0">Yanlış yaptığın sorulardan çıkarılan, adım adım tekrar etmen gereken spesifik yapı ve konular:</p>
       <ul style="font-size:13.5px;color:#1b1b1b;padding-left:18px;margin:8px 0">${r.missedTopics.map((t) => `<li style="margin:4px 0">${esc(t)}</li>`).join("")}</ul>`
    : `<p style="font-size:13.5px;color:#4a8a52;margin-top:20px"><b>Tebrikler!</b> Dilbilgisi ve kelime bölümlerinde belirgin bir eksik konu çıkmadı.</p>`;

  return `<!DOCTYPE html><html><body style="margin:0;background:#f2ede0;font-family:Arial,Helvetica,sans-serif">
  <div style="max-width:640px;margin:0 auto;background:#fff">
    <div style="background:#1f3f3e;padding:22px 28px">
      <div style="color:#fff;font-family:Georgia,serif;font-size:20px;font-weight:700">Gri <span style="font-style:italic;color:#c89a3c">English</span></div>
      <div style="color:#b9cfcd;font-size:12px;letter-spacing:.14em;text-transform:uppercase;margin-top:2px;opacity:.85">Seviye Belirleme Raporu</div>
    </div>
    <div style="padding:26px 28px">
      <p style="font-size:14px;color:#1b1b1b">Merhaba ${esc(name)},</p>
      <p style="font-size:14px;color:#1b1b1b">İngilizce seviye belirleme sınavını tamamladın. İşte kişisel raporun.</p>

      <div style="text-align:center;background:#faf7ee;border-radius:14px;padding:20px;margin:18px 0">
        <div style="font-family:Georgia,serif;font-size:46px;color:#2C5856;line-height:1">${esc(r.cefr)}</div>
        <div style="font-size:14px;color:#6a6a6a">${esc(r.cefrName)}</div>
        <div style="font-size:16px;margin-top:8px;color:#1b1b1b">Toplam: <b>${r.score} / ${r.total}</b> doğru &nbsp;·&nbsp; %${r.pct}</div>
        <div style="font-size:13px;color:#4a4a4a;margin-top:8px;max-width:460px;margin-left:auto;margin-right:auto">${esc(cefrDesc)}</div>
      </div>

      <div style="text-align:center;margin:2px 0 14px"><img src="${doughUrl}" alt="Genel skor" width="300" style="max-width:100%"></div>
      <h2 style="font-family:Georgia,serif;color:#1f3f3e;font-size:17px;border-bottom:2px solid #c89a3c;padding-bottom:6px">Beceri kırılımı</h2>
      <div style="text-align:center;margin:10px 0"><img src="${barUrl}" alt="Beceri grafiği" width="560" style="max-width:100%;border:1px solid #efe8d6;border-radius:8px"></div>
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">${skillRows}</table>

      <h2 style="font-family:Georgia,serif;color:#1f3f3e;font-size:17px;border-bottom:2px solid #c89a3c;padding-bottom:6px;margin-top:26px">Detaylı analiz &amp; çalışma planı</h2>
      <p style="font-size:12.5px;color:#6a6a6a;margin:6px 0">En zayıf becerilerinden başlayarak sıralandı.</p>
      ${details}

      ${topics}

      <div style="text-align:center;margin:28px 0 8px">
        <a href="https://gringlizce.com/ogrenme-haritasi.html" style="display:inline-block;background:#2C5856;color:#fff;text-decoration:none;border-radius:22px;padding:12px 26px;font-size:14px;font-weight:700">Öğrenme Haritasına Git</a>
      </div>
      <p style="font-size:11.5px;color:#9a9a9a;text-align:center;margin-top:18px">Bu rapor objektif (Reading, Use of English, Listening) bölümlere dayalı bir tahmindir. Writing ve Speaking ayrıca bir öğretmen tarafından değerlendirilmelidir.<br>Gri English · gringlizce.com</p>
    </div>
  </div></body></html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405, headers: CORS });

  if (!RESEND_API_KEY) {
    return new Response(JSON.stringify({ error: "RESEND_API_KEY missing" }), { status: 500, headers: { ...CORS, "Content-Type": "application/json" } });
  }

  let body: { to?: string; name?: string; result?: Result };
  try { body = await req.json(); } catch { return new Response(JSON.stringify({ error: "invalid json" }), { status: 400, headers: { ...CORS, "Content-Type": "application/json" } }); }

  const to = (body.to || "").trim();
  const result = body.result;
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) return new Response(JSON.stringify({ error: "geçersiz e-posta" }), { status: 400, headers: { ...CORS, "Content-Type": "application/json" } });
  if (!result || !Array.isArray(result.skills) || typeof result.cefr !== "string") return new Response(JSON.stringify({ error: "eksik rapor verisi" }), { status: 400, headers: { ...CORS, "Content-Type": "application/json" } });

  const name = (body.name || "").toString().slice(0, 80) || "Öğrenci";
  const html = buildEmail(name, result);
  const subject = `Seviye Belirleme Raporun — ${result.cefr} (${result.score}/${result.total})`;

  // Resend gönder
  let sent = false, messageId = "", errMsg = "";
  try {
    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM, to: [to], subject, html }),
    });
    const data = await resp.json();
    if (resp.ok) { sent = true; messageId = data.id || ""; }
    else errMsg = data?.error?.message || `HTTP ${resp.status}`;
  } catch (e) { errMsg = e instanceof Error ? e.message : String(e); }

  // DB kaydı (best-effort)
  try {
    const sb = createClient(SUPABASE_URL, SERVICE_ROLE);
    let userId: string | null = null;
    const auth = req.headers.get("Authorization");
    if (auth && auth.startsWith("Bearer ")) {
      const { data: u } = await sb.auth.getUser(auth.replace("Bearer ", ""));
      userId = u?.user?.id ?? null;
    }
    await sb.from("placement_results").insert({
      user_id: userId, email: to, cefr: result.cefr, score: result.score,
      total: result.total, pct: result.pct, emailed: sent,
    });
  } catch (_e) { /* tablo yoksa yok say */ }

  if (sent) return new Response(JSON.stringify({ sent: true, messageId }), { headers: { ...CORS, "Content-Type": "application/json" } });
  return new Response(JSON.stringify({ sent: false, error: errMsg }), { status: 502, headers: { ...CORS, "Content-Type": "application/json" } });
});
