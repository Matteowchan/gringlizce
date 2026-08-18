// supabase/functions/admin-user-actions/index.ts
// Deploy: supabase functions deploy admin-user-actions
//
// Şu işlemleri admin için yapar:
//   - reset_password_email  : kullanıcıya şifre sıfırlama maili gönder
//   - set_password          : admin yeni şifre belirler (geçici şifre)
//   - set_ban               : kullanıcıyı banla / banı kaldır
//   - delete_user           : kullanıcıyı kalıcı sil (cascade)
//
// Sadece admin emails çalıştırabilir. Service role gerektirir.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const ADMIN_EMAILS = ['mertatasal@gmail.com', 'atasal@gringlizce.com'];

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: CORS_HEADERS });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'no auth' }, 401);

    // 1. Caller'ın admin olduğunu doğrula
    const callerClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user: caller }, error: callerErr } = await callerClient.auth.getUser();
    if (callerErr || !caller) return json({ error: 'invalid auth' }, 401);
    if (!ADMIN_EMAILS.includes(caller.email!)) return json({ error: 'forbidden' }, 403);

    // 2. Service role client (admin işlemleri için)
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const body = await req.json();
    const { action, user_id } = body;

    if (!action || !user_id) return json({ error: 'missing action or user_id' }, 400);

    // Hedef kullanıcı bilgisini al
    const { data: targetData, error: targetErr } = await adminClient.auth.admin.getUserById(user_id);
    if (targetErr || !targetData?.user) return json({ error: 'target user not found' }, 404);
    const targetUser = targetData.user;

    // Self-ban guard: admin kendini banlamasın
    if (targetUser.email && ADMIN_EMAILS.includes(targetUser.email) && action === 'set_ban' && body.banned) {
      return json({ error: 'admin cannot ban themselves or other admins' }, 400);
    }

    // ---- Actions ----

    if (action === 'reset_password_email') {
      const { error } = await adminClient.auth.resetPasswordForEmail(targetUser.email!, {
        redirectTo: 'https://gringlizce.com/sifre-sifirla.html',
      });
      if (error) return json({ error: error.message }, 500);
      return json({ success: true, sent_to: targetUser.email });
    }

    if (action === 'set_password') {
      const password = String(body.password || '');
      if (password.length < 6) return json({ error: 'password must be at least 6 chars' }, 400);
      const { error } = await adminClient.auth.admin.updateUserById(user_id, { password });
      if (error) return json({ error: error.message }, 500);
      return json({ success: true });
    }

    if (action === 'set_ban') {
      const banned = Boolean(body.banned);
      const ban_duration = banned ? '876000h' : 'none'; // ~100 yıl veya iptal
      const { error } = await adminClient.auth.admin.updateUserById(user_id, { ban_duration } as never);
      if (error) return json({ error: error.message }, 500);
      return json({ success: true, banned });
    }

    if (action === 'set_premium') {
      const clear = Boolean(body.clear);
      let until: string | null = null;
      if (!clear) {
        const months = Number(body.months || 1) || 1;
        const { data: prof } = await adminClient.from('profiles').select('premium_until').eq('id', user_id).maybeSingle();
        const now = Date.now();
        const cur = prof?.premium_until ? new Date(prof.premium_until).getTime() : 0;
        const base = cur > now ? cur : now; // aktifse üstüne ekle, değilse şimdiden başlat
        const d = new Date(base);
        d.setMonth(d.getMonth() + months);
        until = d.toISOString();
      }
      const { error } = await adminClient.from('profiles').update({ premium_until: until }).eq('id', user_id);
      if (error) return json({ error: error.message }, 500);
      return json({ success: true, premium_until: until });
    }

    if (action === 'delete_user') {
      // Self-delete + diğer admin'i silme guard
      if (targetUser.email && ADMIN_EMAILS.includes(targetUser.email)) {
        return json({ error: 'admin hesapları silinemez' }, 400);
      }
      const { error } = await adminClient.auth.admin.deleteUser(user_id);
      if (error) return json({ error: error.message }, 500);
      return json({ success: true, deleted: targetUser.email });
    }

    return json({ error: 'unknown action: ' + action }, 400);

  } catch (e) {
    return json({ error: String(e instanceof Error ? e.message : e) }, 500);
  }
});