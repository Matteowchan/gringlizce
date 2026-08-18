// supabase/functions/send-queued-emails/index.ts
//
// Bekleyen email kampanyalarını işler. İki şekilde çağrılır:
//   1. pg_cron (her 5 dakikada bir, 23 numaralı SQL ile kurulan job)
//   2. admin.html'deki "Hemen Gönder" butonu (Supabase JS client üzerinden invoke)
//
// Çalışma akışı:
//   1. scheduled_at <= NOW() ve status IN ('scheduled', 'queued') olan kampanyaları çeker
//   2. Her birini 'processing' durumuna geçirir (race condition'a karşı)
//   3. admin_resolve_audience RPC ile alıcı listesini alır
//   4. Template'i email_templates'ten çeker
//   5. Her alıcıya Resend API'si üzerinden gönderir
//   6. email_sends'e her gönderim için bir satır insert eder
//   7. email_campaigns.status'u 'sent' veya 'failed' olarak günceller
//
// Gerekli env vars (Supabase Dashboard → Edge Functions → Secrets):
//   RESEND_API_KEY        (zorunlu, re_ ile başlar)
//   RESEND_FROM_EMAIL     (zorunlu, verified bir adres olmalı, örn. noreply@gringlizce.com)
//   SUPABASE_URL          (otomatik)
//   SUPABASE_SERVICE_ROLE_KEY (otomatik)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const RESEND_FROM_EMAIL =
  Deno.env.get('RESEND_FROM_EMAIL') ||
  Deno.env.get('SENDER_EMAIL') ||
  'Gri English <iletisim@gringlizce.com>';
// Yanıtlar bildirim/rapor adresine düşsün
const REPLY_TO_EMAIL = Deno.env.get('REPLY_TO_EMAIL') || 'atasal@gringlizce.com';
// Manuel/duyuru kampanyalarında admin'e kopya (BCC). Otomatik lifecycle mailleri hariç (sel önlemi).
const BCC_EMAIL = Deno.env.get('BCC_EMAIL') || 'mertatasal@gmail.com';
const NO_BCC_CATS = ['welcome', 'reactivation'];
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function substituteVars(text: string, vars: Record<string, string>): string {
  if (!text) return '';
  return text.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? '');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return json({ error: 'Supabase env vars missing' }, 500);
  }
  if (!RESEND_API_KEY) {
    return json({ error: 'RESEND_API_KEY secret not set in Edge Function settings' }, 500);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const nowIso = new Date().toISOString();
  const errors: string[] = [];

  try {
    // 1. Bekleyen kampanyaları çek
    const { data: campaigns, error: campErr } = await supabase
      .from('email_campaigns')
      .select('id, name, template_id, audience_filter, status, scheduled_at')
      .in('status', ['scheduled', 'queued'])
      .lte('scheduled_at', nowIso)
      .order('scheduled_at', { ascending: true })
      .limit(5);

    if (campErr) throw campErr;
    if (!campaigns || campaigns.length === 0) {
      return json({ processed: 0, sent: 0, failed: 0, message: 'Bekleyen kampanya yok' });
    }

    let totalProcessed = 0;
    let totalSent = 0;
    let totalFailed = 0;

    for (const campaign of campaigns) {
      // 2. Atomik claim: status'u 'processing' yap, sadece hâlâ scheduled/queued ise
      const { data: claimed, error: claimErr } = await supabase
        .from('email_campaigns')
        .update({ status: 'processing' })
        .eq('id', campaign.id)
        .eq('status', campaign.status)
        .select()
        .maybeSingle();

      if (claimErr) {
        errors.push(`Claim hatası ${campaign.id}: ${claimErr.message}`);
        continue;
      }
      if (!claimed) {
        // Başka bir instance aynı kampanyayı kapmış olabilir
        continue;
      }

      try {
        // 3. Alıcı listesini çöz
        const { data: audience, error: audErr } = await supabase
          .rpc('admin_resolve_audience', { p_filter: campaign.audience_filter });

        if (audErr) throw new Error(`Audience resolve: ${audErr.message}`);
        if (!audience || audience.length === 0) {
          await supabase.from('email_campaigns')
            .update({ status: 'sent', sent_at: nowIso })
            .eq('id', campaign.id);
          totalProcessed++;
          continue;
        }

        // 4. Template'i çek
        const { data: template, error: tplErr } = await supabase
          .from('email_templates')
          .select('id, subject, body_html, category')
          .eq('id', campaign.template_id)
          .maybeSingle();

        if (tplErr) throw new Error(`Template fetch: ${tplErr.message}`);
        if (!template) throw new Error(`Template bulunamadı: ${campaign.template_id}`);

        const templateSubject = template.subject || '';
        const templateBody = template.body_html || '';

        let campaignSent = 0;
        let campaignFailed = 0;

        // 5. Her alıcıya Resend ile gönder
        for (const recipient of audience) {
          const vars = {
            name: recipient.display_name || 'değerli üyemiz',
            email: recipient.email,
          };
          const subject = substituteVars(templateSubject, vars);
          const html = substituteVars(templateBody, vars);

          try {
            const resendPayload: Record<string, unknown> = {
              from: RESEND_FROM_EMAIL,
              to: [recipient.email],
              subject: subject,
              html: html,
              reply_to: REPLY_TO_EMAIL,
            };
            if (BCC_EMAIL && !NO_BCC_CATS.includes(template.category)) {
              resendPayload.bcc = [BCC_EMAIL];
            }

            console.log(`[send] To: ${recipient.email}, From: ${RESEND_FROM_EMAIL}, Subject: ${subject}`);

            const resendRes = await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${RESEND_API_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(resendPayload),
            });

            const responseText = await resendRes.text();
            let resendData: any = {};
            try { resendData = JSON.parse(responseText); } catch { resendData = { raw: responseText }; }

            console.log(`[send] Resend HTTP ${resendRes.status}, response:`, responseText);

            if (!resendRes.ok) {
              const errMsg = `HTTP ${resendRes.status}: ${(resendData.message || resendData.name || responseText || 'unknown').slice(0, 400)}`;
              await supabase.from('email_sends').insert({
                campaign_id: campaign.id,
                user_id: recipient.user_id,
                email: recipient.email,
                status: 'failed',
                error_message: errMsg,
                created_at: new Date().toISOString(),
              });
              campaignFailed++;
              errors.push(`${recipient.email}: ${errMsg}`);
            } else {
              // Resend success genelde {id: "uuid"} döner
              const resendId = resendData.id || '';
              await supabase.from('email_sends').insert({
                campaign_id: campaign.id,
                user_id: recipient.user_id,
                email: recipient.email,
                status: 'sent',
                sent_at: new Date().toISOString(),
                error_message: resendId ? `resend_id=${resendId}` : 'no_resend_id_returned',
                created_at: new Date().toISOString(),
              });
              campaignSent++;
            }
          } catch (sendErr) {
            const msg = sendErr instanceof Error ? sendErr.message : String(sendErr);
            console.error(`[send] Exception for ${recipient.email}:`, msg);
            await supabase.from('email_sends').insert({
              campaign_id: campaign.id,
              user_id: recipient.user_id,
              email: recipient.email,
              status: 'failed',
              error_message: msg.slice(0, 500),
              created_at: new Date().toISOString(),
            });
            campaignFailed++;
            errors.push(`${recipient.email}: ${msg}`);
          }
        }

        // 6. Kampanya status güncelle
        const finalStatus = campaignSent > 0 ? 'sent' : 'failed';
        await supabase.from('email_campaigns')
          .update({ status: finalStatus, sent_at: nowIso })
          .eq('id', campaign.id);

        totalProcessed++;
        totalSent += campaignSent;
        totalFailed += campaignFailed;

      } catch (campaignErr) {
        const msg = campaignErr instanceof Error ? campaignErr.message : String(campaignErr);
        await supabase.from('email_campaigns')
          .update({ status: 'failed' })
          .eq('id', campaign.id);
        errors.push(`Campaign ${campaign.id}: ${msg}`);
      }
    }

    return json({
      processed: totalProcessed,
      sent: totalSent,
      failed: totalFailed,
      errors: errors.slice(0, 10),
    });

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return json({ error: msg, errors }, 500);
  }
});