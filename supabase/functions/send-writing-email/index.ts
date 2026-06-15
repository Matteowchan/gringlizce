// supabase/functions/send-queued-emails/index.ts
// ----------------------------------------------------------------------------
// Cron-tetiklenen edge function. Her çağrıda en fazla 3 zamanlanmış kampanyayı
// işler. Her birinin audience'ini resolve eder, Resend ile gönderir, sonuçları
// email_sends tablosuna yazar.
//
// Deploy:
//   supabase functions deploy send-queued-emails --no-verify-jwt
//
// Required Supabase Secrets:
//   RESEND_API_KEY        -- Resend dashboard'dan al
//   RESEND_FROM_EMAIL     -- ornek: "Gringlizce <noreply@gringlizce.com>"
//                            (Resend'de domain verify edilmiş olmalı)
// ----------------------------------------------------------------------------

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const RESEND_FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL") || "Gringlizce <onboarding@resend.dev>";

const MAX_CAMPAIGNS_PER_RUN = 3;
const MAX_RECIPIENTS_PER_CAMPAIGN = 200;

interface ClaimResult {
  campaign_id: string;
  template_id: string;
  campaign_name: string;
  audience_filter: Record<string, unknown>;
  subject: string;
  body_html: string;
}

interface Recipient {
  user_id: string;
  email: string;
  display_name: string | null;
}

interface ResendResponse {
  id?: string;
  error?: { message?: string; name?: string };
}

function renderTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_match, key) => {
    return vars[key] ?? "";
  });
}

async function sendViaResend(to: string, subject: string, html: string): Promise<{ ok: boolean; messageId?: string; error?: string }> {
  try {
    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: RESEND_FROM_EMAIL,
        to: [to],
        subject,
        html,
      }),
    });

    const data: ResendResponse = await resp.json();
    if (!resp.ok) {
      return { ok: false, error: data.error?.message || `HTTP ${resp.status}` };
    }
    return { ok: true, messageId: data.id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

async function processCampaign(
  supabase: ReturnType<typeof createClient>,
  campaign: ClaimResult,
): Promise<{ sent: number; failed: number }> {
  // Resolve audience
  const { data: recipients, error: audErr } = await supabase
    .rpc("admin_resolve_audience", { p_filter: campaign.audience_filter });

  if (audErr || !recipients) {
    console.error("Audience resolve failed:", audErr);
    return { sent: 0, failed: 0 };
  }

  const list = (recipients as Recipient[]).slice(0, MAX_RECIPIENTS_PER_CAMPAIGN);

  let sent = 0;
  let failed = 0;

  for (const r of list) {
    const vars = {
      name: r.display_name || "Merhaba",
      email: r.email,
    };
    const subject = renderTemplate(campaign.subject, vars);
    const body = renderTemplate(campaign.body_html, vars);

    // Insert pending send row
    const { data: sendRow, error: insertErr } = await supabase
      .from("email_sends")
      .insert({
        campaign_id: campaign.campaign_id,
        user_id: r.user_id,
        email: r.email,
        status: "pending",
      })
      .select("id")
      .single();

    if (insertErr || !sendRow) {
      console.error("Insert pending failed:", insertErr);
      failed++;
      continue;
    }

    const result = await sendViaResend(r.email, subject, body);

    if (result.ok) {
      await supabase
        .from("email_sends")
        .update({ status: "sent", sent_at: new Date().toISOString() })
        .eq("id", sendRow.id);
      sent++;
    } else {
      await supabase
        .from("email_sends")
        .update({ status: "failed", error_message: result.error?.slice(0, 500) })
        .eq("id", sendRow.id);
      failed++;
    }
  }

  await supabase.rpc("mark_campaign_done", {
    p_campaign_id: campaign.campaign_id,
    p_sent: sent,
    p_failed: failed,
  });

  return { sent, failed };
}

Deno.serve(async (req) => {
  // Allow cron invocations and authenticated admin manual triggers
  if (req.method !== "POST" && req.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }

  if (!RESEND_API_KEY) {
    return new Response(
      JSON.stringify({ error: "RESEND_API_KEY secret missing" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const stats = { campaigns: 0, sent: 0, failed: 0, skipped: 0 };

  try {
    for (let i = 0; i < MAX_CAMPAIGNS_PER_RUN; i++) {
      const { data, error } = await supabase.rpc("claim_next_campaign");
      if (error) {
        console.error("Claim failed:", error);
        break;
      }
      if (!data || (Array.isArray(data) && data.length === 0)) {
        break;
      }

      const campaign = (Array.isArray(data) ? data[0] : data) as ClaimResult;
      const result = await processCampaign(supabase, campaign);
      stats.campaigns++;
      stats.sent += result.sent;
      stats.failed += result.failed;
    }

    return new Response(JSON.stringify(stats), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Top-level error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : String(e), stats }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});