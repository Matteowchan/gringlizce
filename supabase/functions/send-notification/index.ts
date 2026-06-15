import nodemailer from "npm:nodemailer@6.9.13";

const GMAIL_USER = Deno.env.get("GMAIL_USER")!;
const GMAIL_PASS = Deno.env.get("GMAIL_APP_PASS")!;
const SENDER = Deno.env.get("SENDER_EMAIL") || "iletisim@gringlizce.com";
const RECIPIENT = Deno.env.get("RECIPIENT_EMAIL") || "atasal@gringlizce.com";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: { user: GMAIL_USER, pass: GMAIL_PASS },
});

function esc(s: any): string {
  if (s === null || s === undefined) return "";
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!)
  );
}

function nl2br(s: string): string {
  return esc(s).replace(/\n/g, "<br>");
}

function reportEmail(r: any) {
  const subject = `Gri English — Soru bildirimi: ${r.kategori}`;
  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#222;">
      <h2 style="color:#222;border-bottom:2px solid #c44a40;padding-bottom:10px;margin:0 0 16px;">Yeni soru bildirimi</h2>
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:8px 0;color:#666;width:130px;">Kategori</td><td style="padding:8px 0;"><strong>${esc(r.kategori)}</strong></td></tr>
        <tr><td style="padding:8px 0;color:#666;">Soru slug</td><td style="padding:8px 0;">${esc(r.soru_slug) || "—"}</td></tr>
        <tr><td style="padding:8px 0;color:#666;">Soru URL</td><td style="padding:8px 0;"><a href="${esc(r.soru_url)}">${esc(r.soru_url) || "—"}</a></td></tr>
        <tr><td style="padding:8px 0;color:#666;">Tarih</td><td style="padding:8px 0;">${new Date(r.created_at).toLocaleString("tr-TR")}</td></tr>
      </table>
      <div style="margin-top:20px;padding:14px 16px;background:#f7f5ee;border-left:3px solid #c44a40;">
        <strong style="display:block;margin-bottom:6px;">Detay</strong>
        ${nl2br(r.detay)}
      </div>
    </div>`;
  return { subject, html, replyTo: undefined };
}

function messageEmail(r: any) {
  const subject = `Gri English — İletişim (${r.kategori}): ${r.ad_soyad}`;
  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#222;">
      <h2 style="color:#222;border-bottom:2px solid #c44a40;padding-bottom:10px;margin:0 0 16px;">Yeni iletişim mesajı</h2>
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:8px 0;color:#666;width:130px;">Kategori</td><td style="padding:8px 0;"><strong>${esc(r.kategori)}</strong></td></tr>
        <tr><td style="padding:8px 0;color:#666;">Ad Soyad</td><td style="padding:8px 0;">${esc(r.ad_soyad)}</td></tr>
        <tr><td style="padding:8px 0;color:#666;">E-posta</td><td style="padding:8px 0;"><a href="mailto:${esc(r.email)}">${esc(r.email)}</a></td></tr>
        ${r.telefon ? `<tr><td style="padding:8px 0;color:#666;">Telefon</td><td style="padding:8px 0;">${esc(r.telefon)}</td></tr>` : ""}
        <tr><td style="padding:8px 0;color:#666;">Tarih</td><td style="padding:8px 0;">${new Date(r.created_at).toLocaleString("tr-TR")}</td></tr>
      </table>
      <div style="margin-top:20px;padding:14px 16px;background:#f7f5ee;border-left:3px solid #c44a40;">
        <strong style="display:block;margin-bottom:6px;">Mesaj</strong>
        ${nl2br(r.mesaj)}
      </div>
    </div>`;
  return { subject, html, replyTo: r.email };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    const payload = await req.json();
    const { type, table, record } = payload;

    if (type !== "INSERT" || !record) {
      return new Response(JSON.stringify({ skipped: true }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    let email;
    if (table === "soru_bildirimleri") {
      email = reportEmail(record);
    } else if (table === "iletisim_mesajlari") {
      email = messageEmail(record);
    } else {
      return new Response(JSON.stringify({ error: "unknown table" }), {
        status: 400, headers: { "Content-Type": "application/json" },
      });
    }

    await transporter.sendMail({
      from: `Gri English <${SENDER}>`,
      to: RECIPIENT,
      replyTo: email.replyTo,
      subject: email.subject,
      html: email.html,
    });

    return new Response(JSON.stringify({ sent: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("send-notification error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { "Content-Type": "application/json" },
    });
  }
});