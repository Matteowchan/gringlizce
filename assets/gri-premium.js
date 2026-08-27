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

  // ── Paylaşılan premium/kilit rozeti (.gpb) — tüm site tek görsel dil ──
  // Kilitli = turuncu (kilit ikonu) · Açık/Ücretsiz = yeşil (açık kilit / rozetsiz)
  try {
    var bcss =
      '.gpb{display:inline-flex;align-items:center;gap:.34em;font-family:var(--font-ui,Inter),system-ui,sans-serif;' +
      'font-size:.66rem;font-weight:800;letter-spacing:.05em;text-transform:uppercase;padding:.26em .64em;' +
      'border-radius:100px;line-height:1;white-space:nowrap;vertical-align:.1em}' +
      '.gpb svg{width:1em;height:1em;flex:none;display:block}' +
      '.gpb--lock{background:#BE6A1B;color:#fff}' +
      '.gpb--open{background:#2F8F6B;color:#fff}' +
      '.gpb--free{background:#2F8F6B;color:#fff}';
    var bst = document.createElement('style');
    bst.setAttribute('data-gri-premium-badge', '1');
    bst.textContent = bcss;
    (document.head || document.documentElement).appendChild(bst);
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

  var LOCK_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2h-1V7a5 5 0 0 0-5-5zm-3 8V7a3 3 0 0 1 6 0v3H9z"/></svg>';
  var OPEN_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a5 5 0 0 0-5 5 1 1 0 0 0 2 0 3 3 0 0 1 6 0v3H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2h-1V7a5 5 0 0 0-5-5z"/></svg>';

  // Paylaşılan rozet HTML üreticisi.
  //   state: 'lock' (kilitli/turuncu) · 'open' (premium açık/yeşil) · 'free' (ücretsiz/yeşil)
  //   label: opsiyonel metin (varsayılan: lock/open → 'Premium', free → 'Ücretsiz')
  function badge(state, label) {
    if (state === 'free') return '<span class="gpb gpb--free">' + (label || 'Ücretsiz') + '</span>';
    if (state === 'open')  return '<span class="gpb gpb--open">' + OPEN_SVG + (label || 'Premium') + '</span>';
    return '<span class="gpb gpb--lock">' + LOCK_SVG + (label || 'Premium') + '</span>';
  }

  window.GriPremium = {
    refresh: refresh,
    isActive: function () { return !!(window.GRI_PREMIUM && window.GRI_PREMIUM.active); },
    until: function () { return window.GRI_PREMIUM ? window.GRI_PREMIUM.until : null; },
    badge: badge
  };

  if (document.readyState !== 'loading') refresh();
  else document.addEventListener('DOMContentLoaded', refresh);
})();
