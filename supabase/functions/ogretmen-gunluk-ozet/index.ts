// =================================================================
// Edge Function: ogretmen-gunluk-ozet
//
// Ogretmen, ogrencisinin ne yaptigini gormek icin editoru acmak zorunda
// kalmasin: gun icinde biriken hareket (tamamlanan odev, yazilan not, girilen
// deneme skoru, yuklenen ses kaydi) aksam tek mailde ozetlenir.
//
// Gunde bir kez cron ile cagrilir. Hareket yoksa mail GONDERILMEZ — bos mail
// aliskanligi bildirimi degersizlestirir.
//
// Secrets: RESEND_API_KEY, RESEND_FROM_EMAIL
// Deploy: supabase functions deploy ogretmen-gunluk-ozet
// =================================================================

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const FROM = Deno.env.get("RESEND_FROM_EMAIL") || "Gri English <onboarding@resend.dev>";
const SITE = "https://gringlizce.com";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function esc(s: string) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

serve(async (req) => {
  try {
    // Son 24 saat. Cron gunde bir calistigi icin pencere tam gun.
    const sinir = new Date(Date.now() - 24 * 3600 * 1000).toISOString();

    const { data: programlar, error: pErr } = await supabase
      .from("student_programs")
      .select("id, teacher_id, student_id, title, content")
      .eq("status", "published");
    if (pErr) throw pErr;
    if (!programlar?.length) return new Response(JSON.stringify({ ok: true, ozet: 0 }));

    // Ogretmen -> satirlar
    const kutu = new Map<string, string[]>();

    for (const p of programlar) {
      const odevler = (p.content?.homework || []) as any[];
      // Ogrenci sayfasiyla ayni siralama: anahtar tarihe gore siralanmis index.
      const sirali = odevler
        .map((h, i) => ({ h, i }))
        .sort((a, b) => String(a.h.date || "").localeCompare(String(b.h.date || "")));
      const gorev = new Map<string, string>();
      sirali.forEach((x, pos) => {
        gorev.set(`hw:${pos}:${x.h.date || ""}`, String(x.h.task || "").slice(0, 80));
      });

      const { data: hareket } = await supabase
        .from("student_program_progress")
        .select("item_key, done, done_at, note, note_at, data")
        .eq("program_id", p.id);

      const satir: string[] = [];
      for (const g of hareket || []) {
        const ad = gorev.get(g.item_key) || g.item_key;
        if (g.done && g.done_at && g.done_at > sinir) satir.push(`Tamamladı: ${ad}…`);
        if (g.note && g.note_at && g.note_at > sinir) {
          satir.push(`Not yazdı: ${ad}… — “${String(g.note).slice(0, 140)}”`);
        }
        if (g.data && (g.data.listening != null || g.data.reading != null)) {
          const s: string[] = [];
          if (g.data.listening != null) s.push(`Listening ${g.data.listening}/40`);
          if (g.data.reading != null) s.push(`Reading ${g.data.reading}/40`);
          // data'nin kendi zaman damgasi yok; note_at varsa ona bakilir.
          if (!g.note_at || g.note_at > sinir) satir.push(`Deneme skoru: ${s.join(", ")}`);
        }
      }

      // Ses kayitlari: son 24 saatte yuklenenler.
      const { data: sesler } = await supabase
        .schema("storage").from("objects")
        .select("name, created_at")
        .eq("bucket_id", "speaking-submissions")
        .like("name", `${p.student_id}/${p.id}/%`)
        .gt("created_at", sinir);
      if (sesler?.length) satir.push(`${sesler.length} ses kaydı yükledi`);

      if (!satir.length) continue;

      // Ogrenci e-postasi (profiles service role ile okunur).
      const { data: prof } = await supabase
        .from("profiles").select("email").eq("id", p.student_id).maybeSingle();
      const kim = prof?.email || "Öğrenci";

      const blok =
        `<h3 style="font:700 15px/1.4 Georgia,serif;margin:18px 0 6px">${esc(kim)}</h3>` +
        `<ul style="margin:0;padding-left:18px">` +
        satir.map((x) => `<li style="font:14px/1.6 system-ui;margin:0 0 4px">${esc(x)}</li>`).join("") +
        `</ul>` +
        `<p style="margin:8px 0 0"><a href="${SITE}/ogretmen-program?student=${p.student_id}&id=${p.id}"
            style="font:600 13px system-ui;color:#2C5856">Programı aç →</a></p>`;

      const liste = kutu.get(p.teacher_id) || [];
      liste.push(blok);
      kutu.set(p.teacher_id, liste);
    }

    let gonderilen = 0;
    for (const [teacherId, bloklar] of kutu) {
      const { data: tp } = await supabase
        .from("profiles").select("email").eq("id", teacherId).maybeSingle();
      if (!tp?.email) continue;

      const html =
        `<div style="max-width:560px;margin:0 auto;padding:22px">` +
        `<p style="font:11px/1 system-ui;letter-spacing:.18em;text-transform:uppercase;color:#C89A3C;margin:0">Gri English</p>` +
        `<h2 style="font:700 20px/1.3 Georgia,serif;margin:6px 0 2px">Bugün öğrencilerin ne yaptı</h2>` +
        `<p style="font:13px/1.5 system-ui;color:#6f6a58;margin:0 0 6px">Son 24 saatteki hareket. Hareket olmayan gün mail gelmez.</p>` +
        bloklar.join("") +
        `</div>`;

      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: FROM, to: [tp.email],
          subject: "Öğrenci hareketleri — günlük özet",
          html,
        }),
      });
      if (r.ok) gonderilen++;
      else console.error("resend hata:", await r.text());
    }

    return new Response(JSON.stringify({ ok: true, ogretmen: kutu.size, gonderilen }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("gunluk ozet hatasi:", e);
    return new Response(JSON.stringify({ error: String((e as Error)?.message || e) }), {
      status: 500, headers: { "Content-Type": "application/json" },
    });
  }
});
