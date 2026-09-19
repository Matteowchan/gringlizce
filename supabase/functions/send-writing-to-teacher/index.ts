// supabase/functions/send-writing-to-teacher/index.ts
// -----------------------------------------------------------------------------
// Ogrencinin "Kendi Yazilarim" alanindaki kayitli bir yazisini, Gri'nin
// degerlendirmesiyle birlikte hocasina e-posta olarak yollar.
//
// Guvenlik:
//   - JWT zorunlu (verify_jwt: true)
//   - Yazi yalnizca SAHIBI tarafindan yollanabilir (user_id === caller)
//   - Gunluk gonderim limiti (spam relay olmasin)
//   - Serbest metin yalnizca kisa "not" alani; escape edilir, 500 karakterle sinirli
//
// Deploy:  supabase functions deploy send-writing-to-teacher
// Secrets: RESEND_API_KEY, RESEND_FROM_EMAIL (verify edilmis domain)
// -----------------------------------------------------------------------------

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const FROM = Deno.env.get("RESEND_FROM_EMAIL") || "Gri English <onboarding@resend.dev>";

const DAILY_SEND_LIMIT = 10;
const NOTE_MAX = 500;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}
function err(message: string, status = 400, code?: string) {
  return json({ error: message, code }, status);
}
function esc(s: unknown): string {
  return String(s ?? "").replace(/[&<>"]/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string));
}
function paras(text: string): string {
  return String(text || "")
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 14px;line-height:1.75;color:#241E17">${esc(p).replace(/\n/g, "<br>")}</p>`)
    .join("");
}
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// IELTS band -> renk. Diger sinavlarda notr.
function bandColor(score: number | null, isIelts: boolean): string {
  if (score == null) return "#6a6a6a";
  if (!isIelts) return "#2C5856";
  if (score >= 7) return "#3f7d58";
  if (score >= 6) return "#b07a2b";
  return "#a8423f";
}

interface Writing {
  id: string;
  user_id: string;
  exam: string;
  text_type: string;
  level: string | null;
  prompt_title: string | null;
  prompt_snapshot: string;
  text: string;
  word_count: number;
  saved_at: string;
  custom_prompt: boolean;
  task_image_path: string | null;
  evaluation_json: any;
  total_score: number | null;
  total_max: number | null;
  send_count: number;
}

const CRITERION_LABEL: Record<string, string> = {
  task_achievement: "Task Achievement",
  task_response: "Task Response",
  coherence_cohesion: "Coherence & Cohesion",
  lexical_resource: "Lexical Resource",
  grammatical_range: "Grammatical Range & Accuracy",
  grammar: "Grammatical Range & Accuracy",
};
function critLabel(key: string): string {
  return CRITERION_LABEL[key] || key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function buildEmail(opts: {
  studentName: string;
  studentEmail: string;
  w: Writing;
  note: string;
  hasImage: boolean;
}): string {
  const { studentName, studentEmail, w, note, hasImage } = opts;
  const ev = w.evaluation_json || {};
  const isIelts = (w.exam || "").toLowerCase() === "ielts";
  const scores: Record<string, number> = ev.scores || {};
  const comments: Record<string, string> = ev.comments || {};
  const mistakes: any[] = Array.isArray(ev.specificMistakes) ? ev.specificMistakes : [];

  const dateStr = new Date(w.saved_at).toLocaleDateString("tr-TR", {
    day: "numeric", month: "long", year: "numeric",
  });
  const taskLabel = `${(w.exam || "").toUpperCase()} — ${String(w.text_type || "").replace(/_/g, " ")}${w.level ? " (" + w.level.toUpperCase() + ")" : ""}`;

  const bandBox = w.total_score != null
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 0 4px">
         <tr><td style="background:#f3efe4;border:1px solid #e0d6c2;border-radius:10px;padding:14px 22px;text-align:center">
           <div style="font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#6a6a6a;font-weight:700">${isIelts ? "Genel Band" : "Toplam"}</div>
           <div style="font-size:30px;font-weight:700;color:${bandColor(w.total_score, isIelts)};line-height:1.15;margin-top:2px">${esc(w.total_score)}${isIelts ? "" : ` <span style="font-size:15px;color:#8a8a8a">/ ${esc(w.total_max ?? "")}</span>`}</div>
         </td></tr></table>`
    : "";

  const scoreRows = Object.keys(scores).map((k) => {
    const v = scores[k];
    const pct = isIelts ? Math.max(4, Math.min(100, (Number(v) / 9) * 100)) : 100;
    return `<tr>
      <td style="padding:10px 0 4px;border-top:1px solid #ece4d2">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
          <tr>
            <td style="font-size:14px;font-weight:700;color:#241E17">${esc(critLabel(k))}</td>
            <td align="right" style="font-size:16px;font-weight:700;color:${bandColor(Number(v), isIelts)};white-space:nowrap">${esc(v)}</td>
          </tr>
        </table>
        ${isIelts ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:#ece4d2;border-radius:4px;overflow:hidden;margin:6px 0 8px">
          <tr><td width="${pct.toFixed(0)}%" style="background:${bandColor(Number(v), isIelts)};height:6px;font-size:0;line-height:0">&nbsp;</td><td style="font-size:0;line-height:0">&nbsp;</td></tr>
        </table>` : ""}
        <div style="font-size:13.5px;line-height:1.7;color:#4a463f">${esc(comments[k] || "")}</div>
      </td></tr>`;
  }).join("");

  const mistakeRows = mistakes.slice(0, 12).map((m) => {
    const isUpgrade = m?.type === "upgrade";
    return `<tr><td style="padding:9px 0;border-top:1px solid #ece4d2">
      <div style="font-size:11px;letter-spacing:.08em;text-transform:uppercase;font-weight:700;color:${isUpgrade ? "#2C5856" : "#a8423f"};margin-bottom:3px">${isUpgrade ? "Daha güçlü alternatif" : esc(m?.type || "hata")}</div>
      <div style="font-size:14px;color:#241E17;line-height:1.6">
        <span style="text-decoration:${isUpgrade ? "none" : "line-through"};color:#8a8a8a">${esc(m?.original || "")}</span>
        <span style="color:#b0a99a">&nbsp;→&nbsp;</span>
        <strong style="color:#2C5856">${esc(m?.correction || "")}</strong>
      </div>
      <div style="font-size:13px;color:#6a6a6a;line-height:1.6;margin-top:3px">${esc(m?.explanation || "")}</div>
    </td></tr>`;
  }).join("");

  return `<!DOCTYPE html>
<html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f7f4ec;font-family:Georgia,'Times New Roman',serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:#f7f4ec">
<tr><td align="center" style="padding:28px 14px">
<table role="presentation" width="640" cellpadding="0" cellspacing="0" style="border-collapse:collapse;max-width:640px;width:100%;background:#fffdf8;border:1px solid #e6dcc8;border-radius:14px;overflow:hidden">

  <tr><td style="background:#2C5856;padding:22px 30px">
    <div style="font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#a9c9c4;font-weight:700">Gri English &middot; Yazı Pratiği</div>
    <div style="font-size:21px;color:#ffffff;font-weight:700;margin-top:4px">${esc(studentName)} bir yazısını paylaştı</div>
  </td></tr>

  <tr><td style="padding:24px 30px 0">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
      <tr>
        <td style="vertical-align:top">
          <div style="font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:#8a8a8a;font-weight:700">${esc(taskLabel)}</div>
          <div style="font-size:15px;color:#4a463f;margin-top:5px">${esc(dateStr)} &middot; ${esc(w.word_count)} kelime${w.custom_prompt ? " &middot; kendi sorusu" : ""}${hasImage ? " &middot; görsel ekte" : ""}</div>
        </td>
        <td align="right" style="vertical-align:top">${bandBox}</td>
      </tr>
    </table>
  </td></tr>

  ${note ? `<tr><td style="padding:20px 30px 0">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:#f3efe4;border-left:3px solid #2C5856;border-radius:0 8px 8px 0">
      <tr><td style="padding:13px 16px">
        <div style="font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:#6a6a6a;font-weight:700;margin-bottom:5px">Öğrencinin notu</div>
        <div style="font-size:14.5px;line-height:1.7;color:#241E17">${esc(note).replace(/\n/g, "<br>")}</div>
      </td></tr></table>
  </td></tr>` : ""}

  <tr><td style="padding:22px 30px 0">
    <div style="font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:#8a8a8a;font-weight:700;margin-bottom:7px">Soru</div>
    <div style="font-size:14.5px;line-height:1.7;color:#241E17;border-left:3px solid #d8cdb6;padding-left:14px">${esc(w.prompt_snapshot).replace(/\n/g, "<br>")}</div>
  </td></tr>

  <tr><td style="padding:24px 30px 0">
    <div style="font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:#8a8a8a;font-weight:700;margin-bottom:9px">Yazı</div>
    <div style="font-size:15.5px">${paras(w.text)}</div>
  </td></tr>

  ${scoreRows ? `<tr><td style="padding:14px 30px 0">
    <div style="font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:#8a8a8a;font-weight:700;margin-bottom:2px">Gri'nin değerlendirmesi</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">${scoreRows}</table>
  </td></tr>` : ""}

  ${ev.overallComment ? `<tr><td style="padding:20px 30px 0">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:#f3efe4;border-radius:10px">
      <tr><td style="padding:15px 18px">
        <div style="font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:#6a6a6a;font-weight:700;margin-bottom:6px">Genel yorum</div>
        <div style="font-size:14.5px;line-height:1.75;color:#241E17">${esc(ev.overallComment)}</div>
        ${ev.improvementAdvice ? `<div style="font-size:14.5px;line-height:1.75;color:#241E17;margin-top:11px;padding-top:11px;border-top:1px solid #e0d6c2">${esc(ev.improvementAdvice)}</div>` : ""}
      </td></tr></table>
  </td></tr>` : ""}

  ${mistakeRows ? `<tr><td style="padding:22px 30px 0">
    <div style="font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:#8a8a8a;font-weight:700;margin-bottom:2px">Düzeltmeler ve daha güçlü alternatifler</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">${mistakeRows}</table>
  </td></tr>` : ""}

  <tr><td style="padding:26px 30px 28px">
    <div style="font-size:13px;line-height:1.7;color:#6a6a6a;border-top:1px solid #ece4d2;padding-top:16px">
      Bu e-postayı <strong style="color:#241E17">${esc(studentName)}</strong> (${esc(studentEmail)}) gringlizce.com üzerinden gönderdi.
      Doğrudan yanıtlarsan mesajın öğrenciye ulaşır.
      ${w.evaluation_json ? "Puanlama Gri (AI) tarafından yapıldı; nihai değerlendirme her zaman öğretmene aittir." : ""}
    </div>
  </td></tr>

  <tr><td style="background:#f3efe4;padding:15px 30px;text-align:center">
    <div style="font-size:12px;color:#8a8a8a">Gri English &middot; Focus &middot; Practice &middot; Succeed</div>
  </td></tr>

</table></td></tr></table></body></html>`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return err("Yalnizca POST", 405);

  // ---- Auth ----
  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) return err("Oturum bulunamadi", 401, "no_auth");

  const { data: userData, error: userErr } = await supabase.auth.getUser(token);
  const user = userData?.user;
  if (userErr || !user) return err("Gecersiz oturum", 401, "bad_auth");

  // ---- Body ----
  let body: any;
  try { body = await req.json(); } catch { return err("Gecersiz JSON", 400); }

  const writingId = String(body?.writing_id || "").trim();
  const toEmail = String(body?.to_email || "").trim().toLowerCase();
  const note = String(body?.note || "").trim().slice(0, NOTE_MAX);

  if (!writingId) return err("writing_id zorunlu", 400);
  if (!EMAIL_RE.test(toEmail)) return err("Gecerli bir e-posta adresi gir.", 400, "bad_email");

  // ---- Gunluk limit ----
  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const { count: sentToday } = await supabase
    .from("user_saved_writings")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("sent_at", since);
  if ((sentToday || 0) >= DAILY_SEND_LIMIT) {
    return err(`Gunde en fazla ${DAILY_SEND_LIMIT} yazi yollayabilirsin. Yarin tekrar dene.`, 429, "rate_limited");
  }

  // ---- Yaziyi yukle + sahiplik ----
  const { data: w, error: wErr } = await supabase
    .from("user_saved_writings")
    .select("*")
    .eq("id", writingId)
    .maybeSingle();
  if (wErr) return err("Yazi okunamadi: " + wErr.message, 500);
  if (!w) return err("Yazi bulunamadi", 404, "not_found");
  if (w.user_id !== user.id) return err("Bu yazi sana ait degil", 403, "forbidden");

  // ---- Ogrenci adi ----
  let studentName = user.email?.split("@")[0] || "Ogrenci";
  try {
    const { data: prof } = await supabase
      .from("profiles").select("full_name").eq("id", user.id).maybeSingle();
    studentName = ((prof as any)?.full_name || "").trim() || studentName;
  } catch (_) { /* profil yoksa e-posta adi kullanilir */ }

  // ---- Task 1 gorseli (varsa) ek olarak ----
  const attachments: Array<{ filename: string; content: string }> = [];
  if (w.task_image_path) {
    try {
      const { data: blob } = await supabase.storage
        .from("writing-task-images").download(w.task_image_path);
      if (blob) {
        const buf = new Uint8Array(await blob.arrayBuffer());
        if (buf.byteLength <= 5_000_000) {
          let bin = "";
          for (let i = 0; i < buf.length; i += 8192) bin += String.fromCharCode(...buf.subarray(i, i + 8192));
          const ext = (w.task_image_path.split(".").pop() || "jpg").toLowerCase();
          attachments.push({ filename: `task-gorseli.${ext}`, content: btoa(bin) });
        }
      }
    } catch (e) {
      console.error("attachment failed:", e);
    }
  }

  // ---- Gonder ----
  const html = buildEmail({
    studentName,
    studentEmail: user.email || "",
    w: w as Writing,
    note,
    hasImage: attachments.length > 0,
  });
  const bandPart = w.total_score != null ? ` — ${(w.exam || "").toLowerCase() === "ielts" ? "Band " : ""}${w.total_score}` : "";
  const subject = `${studentName} — ${(w.exam || "").toUpperCase()} ${String(w.text_type || "").replace(/_/g, " ")} yazısı${bandPart}`;

  const payload: Record<string, unknown> = {
    from: FROM,
    to: [toEmail],
    subject,
    html,
  };
  if (user.email) payload.reply_to = user.email;
  if (attachments.length) payload.attachments = attachments;

  const resp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const rd = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    return err(rd?.error?.message || `E-posta gonderilemedi (HTTP ${resp.status})`, 502, "send_failed");
  }

  // ---- Kaydi isaretle ----
  await supabase.from("user_saved_writings").update({
    sent_to: toEmail,
    sent_at: new Date().toISOString(),
    send_count: (w.send_count || 0) + 1,
  }).eq("id", writingId);

  return json({ ok: true, message_id: rd?.id || null, to: toEmail });
});
