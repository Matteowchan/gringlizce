/* Gri Premium — paylaşılan yetki (entitlement) yardımcısı
   - Giriş yapan kullanıcının profiles.premium_until değerini okur.
   - window.GRI_PREMIUM = { active, until } yayınlar.
   - <html data-premium="1"> set eder → reklamlar CSS ile gizlenir.
   - 'gri-premium' event'i tetikler; GriPremium.refresh()/isActive() sunar.
   Not: premium_until server-side trigger ile korunur; client sadece okur. */
(function () {
  var SB_URL = 'https://vazbvbqgvtlaqkytfsbi.supabase.co';
  var SB_KEY = 'sb_publishable_F5K-wIVQHXlD4e4GYnySNw_Xm4teO9g';

  function setState(active, until) {
    window.GRI_PREMIUM = { active: !!active, until: until || null };
    try { document.documentElement.setAttribute('data-premium', active ? '1' : '0'); } catch (e) {}
    try { window.dispatchEvent(new CustomEvent('gri-premium', { detail: window.GRI_PREMIUM })); } catch (e) {}
  }

  // Premium'da reklam gizleme kuralı (ins.adsbygoogle + genel ad kapsayıcıları)
  try {
    var css = 'html[data-premium="1"] .adsbygoogle,' +
              'html[data-premium="1"] ins.adsbygoogle,' +
              'html[data-premium="1"] .ad-slot,' +
              'html[data-premium="1"] .ad-unit,' +
              'html[data-premium="1"] [data-ad],' +
              'html[data-premium="1"] .gri-ad{display:none !important}';
    var st = document.createElement('style');
    st.setAttribute('data-gri-premium', '1');
    st.textContent = css;
    (document.head || document.documentElement).appendChild(st);
  } catch (e) {}

  function waitSupabase(tries) {
    return new Promise(function (resolve) {
      (function loop(n) {
        if (window.supabase && window.supabase.createClient) return resolve(true);
        if (n <= 0) return resolve(false);
        setTimeout(function () { loop(n - 1); }, 150);
      })(tries);
    });
  }

  async function getClient() {
    if (window.__griPremiumClient) return window.__griPremiumClient;
    var ok = await waitSupabase(20); // ~3s
    if (!ok) return null;
    try {
      window.__griPremiumClient = window.supabase.createClient(SB_URL, SB_KEY, {
        auth: { persistSession: true, autoRefreshToken: true }
      });
      return window.__griPremiumClient;
    } catch (e) { return null; }
  }

  async function refresh() {
    try {
      var c = await getClient();
      if (!c) { setState(false, null); return window.GRI_PREMIUM; }
      var s = await c.auth.getSession();
      var user = s && s.data && s.data.session && s.data.session.user;
      if (!user) { setState(false, null); return window.GRI_PREMIUM; }
      var r = await c.from('profiles').select('premium_until').eq('id', user.id).maybeSingle();
      var until = (r && r.data) ? r.data.premium_until : null;
      var active = !!(until && (new Date(until).getTime() > Date.now()));
      setState(active, until);
      return window.GRI_PREMIUM;
    } catch (e) {
      setState(false, null);
      return window.GRI_PREMIUM;
    }
  }

  // varsayılan: premium değil (anonim ziyaretçi)
  setState(false, null);

  window.GriPremium = {
    refresh: refresh,
    isActive: function () { return !!(window.GRI_PREMIUM && window.GRI_PREMIUM.active); },
    until: function () { return window.GRI_PREMIUM ? window.GRI_PREMIUM.until : null; }
  };

  if (document.readyState !== 'loading') refresh();
  else document.addEventListener('DOMContentLoaded', refresh);
})();
