/* ============================================================
   Gri English — Auth Helpers (Supabase Auth)
   ============================================================
   Eski window.GriAuth API'si aynı kalır. İçerideki kullanıcı
   verisi window.GRI_USERS yerine artık Supabase'den geliyor:
     - Auth → supabase.auth (e-posta + şifre)
     - Ürünler → public.purchases tablosu
     - Rol → public.profiles tablosu
   Önemli: supabase-js v2 kütüphanesi BU DOSYADAN ÖNCE yüklenmeli.
   ============================================================ */

(function () {
  var SUPABASE_URL = 'https://vazbvbqgvtlaqkytfsbi.supabase.co';
  var SUPABASE_KEY = 'sb_publishable_F5K-wIVQHXlD4e4GYnySNw_Xm4teO9g';
  var CACHE_KEY = 'gri_cache';

  // Eski auth.js'nin localStorage anahtarını temizle (varsa)
  try { localStorage.removeItem('gri_user'); } catch (e) {}

  if (!window.supabase || !window.supabase.createClient) {
    console.error('[GriAuth] supabase-js yüklenmemiş. auth.js iptal.');
    return;
  }

  var sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });

  function getCache() {
    try { return JSON.parse(localStorage.getItem(CACHE_KEY) || 'null'); }
    catch (e) { return null; }
  }

  function setCache(data) {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(data)); } catch (e) {}
  }

  function clearCache() {
    try { localStorage.removeItem(CACHE_KEY); } catch (e) {}
  }

  // Supabase'den taze profile + purchases çek, cache'e yaz
  async function refreshCache() {
    var resp = await sb.auth.getSession();
    var session = resp && resp.data && resp.data.session;
    if (!session) { clearCache(); return null; }

    var userId = session.user.id;
    var email = session.user.email || '';

    var role = 'customer';
    try {
      var pr = await sb.from('profiles').select('role').eq('id', userId).single();
      if (pr && pr.data && pr.data.role) role = pr.data.role;
    } catch (e) {}

    var products = [];
    try {
      var ps = await sb.from('purchases').select('product_slug').eq('user_id', userId);
      if (ps && ps.data) {
        products = ps.data.map(function (r) { return r.product_slug; }).filter(Boolean);
      }
    } catch (e) {}

    var cache = {
      email: email,
      user_id: userId,
      role: role,
      products: products,
      cached_at: Date.now()
    };
    setCache(cache);
    return cache;
  }

  // Sync verify: cache okur. Eski yapıdaki { username, record } imzasını korur.
  function verify() {
    var c = getCache();
    if (!c || !c.email) return null;
    return {
      username: c.email,
      record: { role: c.role, products: c.products }
    };
  }

  function getOwnedProducts(rec) {
    if (!rec) return [];
    if (rec.role === 'admin') return '*';
    var owned = Array.isArray(rec.products) ? rec.products.slice() : [];
    if (owned.indexOf('full-test-bundle') !== -1) {
      ['full-test-1','full-test-2','full-test-3','full-test-4','full-test-5'].forEach(function (s) {
        if (owned.indexOf(s) === -1) owned.push(s);
      });
    }
    return owned;
  }

  // Demo materyaller: giriş yapan herkese ücretsiz açık
  var FREE_DEMO_SLUGS = [
    'spelling-practice-2',
    'spelling-practice-3',
    'toefl-writing-practice-2',
    'toefl-writing-practice-3',
    'kelime-bankasi'
  ];

  function hasAccess(rec, slug) {
    if (slug && FREE_DEMO_SLUGS.indexOf(slug) !== -1) return true;
    var owned = getOwnedProducts(rec);
    if (owned === '*') return true;
    return owned.indexOf(slug) !== -1;
  }

  async function login(email, password) {
    var clean = String(email || '').trim().toLowerCase();
    var resp;
    try {
      resp = await sb.auth.signInWithPassword({ email: clean, password: password });
    } catch (e) {
      return { ok: false, error: 'Sunucuya ulaşılamadı, tekrar deneyin.' };
    }
    if (resp.error || !resp.data || !resp.data.session) {
      return { ok: false, error: 'E-posta veya şifre hatalı.' };
    }
    await refreshCache();
    return { ok: true };
  }

  async function logout() {
    intentionalSignOut = true;
    try { await sb.auth.signOut(); } catch (e) {}
    clearCache();
  }

  // Şifremi unuttum maili gönder
  async function sendPasswordReset(email) {
    var clean = String(email || '').trim().toLowerCase();
    if (!clean) return { ok: false, error: 'E-posta gerekli.' };
    try {
      var resp = await sb.auth.resetPasswordForEmail(clean, {
        redirectTo: 'https://gringlizce.com/sifre-sifirla.html'
      });
      if (resp.error) {
        return { ok: false, error: 'İstek gönderilemedi, tekrar deneyin.' };
      }
      return { ok: true };
    } catch (e) {
      return { ok: false, error: 'Sunucuya ulaşılamadı, tekrar deneyin.' };
    }
  }

  // Mevcut oturumla yeni şifre belirle (panelim veya sifre-sifirla akışı)
  async function updatePassword(newPassword) {
    if (!newPassword || newPassword.length < 8) {
      return { ok: false, error: 'Şifre en az 8 karakter olmalı.' };
    }
    try {
      var resp = await sb.auth.updateUser({ password: newPassword });
      if (resp.error) {
        return { ok: false, error: resp.error.message || 'Şifre güncellenemedi.' };
      }
      return { ok: true };
    } catch (e) {
      return { ok: false, error: 'Sunucuya ulaşılamadı, tekrar deneyin.' };
    }
  }

  function requireAuth(slug, redirectPath) {
    var auth = verify();
    if (!auth) {
      window.location.href = '/giris.html?return=' + encodeURIComponent(redirectPath || window.location.pathname);
      return null;
    }
    if (slug && !hasAccess(auth.record, slug)) {
      window.location.href = '/panelim.html?error=no-access&slug=' + encodeURIComponent(slug);
      return null;
    }
    return auth;
  }

  /* ============================================================
     PROAKTİF OTURUM KORUMASI
     ------------------------------------------------------------
     Panel sayfalarında token süresi dolunca RPC/SELECT'ler anon
     rolüyle gidip "permission denied" veriyor ya da sayfa boş
     kalıyordu. Aşağıdaki blok token'ı süresi dolmadan yeniler,
     yenilenemezse (refresh token ölü) kullanıcıyı zorla çıkarmadan
     üst bir bildirim şeridiyle uyarır.
     ============================================================ */

  window.GRI_SESSION_OK = true;      // sayfalar isterse kontrol edebilsin
  var intentionalSignOut = false;    // logout() sırasında "süre doldu" uyarısı çıkmasın
  var hadSession = false;            // bu sayfada hiç geçerli oturum gördük mü

  function hideSessionExpiredBar() {
    var b = (typeof document !== 'undefined') && document.getElementById('gri-session-bar');
    if (b && b.parentNode) b.parentNode.removeChild(b);
  }

  function showSessionExpiredBar() {
    if (typeof document === 'undefined') return;
    var build = function () {
      if (document.getElementById('gri-session-bar')) return;
      var ret = encodeURIComponent(window.location.pathname + window.location.search);
      var bar = document.createElement('div');
      bar.id = 'gri-session-bar';
      bar.setAttribute('role', 'alert');
      // Kendi stilini enjekte eder — main.css'e güvenmez (paylaşılan JS kuralı).
      bar.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:2147483000;' +
        'background:#b91c1c;color:#fff;' +
        'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;' +
        'font-size:14px;line-height:1.45;padding:10px 44px 10px 14px;text-align:center;' +
        'box-shadow:0 2px 10px rgba(0,0,0,.28);';
      bar.innerHTML =
        '<span style="vertical-align:middle;">Oturumunun süresi doldu — veriler görüntülenemeyebilir. </span>' +
        '<a href="/giris.html?return=' + ret + '" style="color:#fff;font-weight:700;' +
        'text-decoration:underline;vertical-align:middle;margin:0 4px;">Tekrar giriş yap</a>' +
        '<button type="button" id="gri-session-bar-x" aria-label="Kapat" style="position:absolute;' +
        'top:50%;right:12px;transform:translateY(-50%);background:transparent;border:0;color:#fff;' +
        'font-size:20px;line-height:1;cursor:pointer;padding:0 4px;">&times;</button>';
      document.body.appendChild(bar);
      var x = document.getElementById('gri-session-bar-x');
      if (x) x.onclick = function () { hideSessionExpiredBar(); };
    };
    if (document.body) build();
    else document.addEventListener('DOMContentLoaded', build);
  }

  // getSession → süresi yakın/geçmişse refreshSession. Ağ hatasında agresif olma.
  async function ensureFreshSession() {
    var resp;
    try { resp = await sb.auth.getSession(); }
    catch (e) { return true; } // geçici ağ sorunu; oturumu geçersiz sayma

    var session = resp && resp.data && resp.data.session;
    if (!session) {
      // Hiç oturum yoksa: giriş yapmamış (public) kullanıcı olabilir → uyarı gösterme.
      // Ama daha önce oturum vardıysa (silinmiş) → uyar.
      if (hadSession) { window.GRI_SESSION_OK = false; showSessionExpiredBar(); }
      return false;
    }

    hadSession = true;
    var now = Math.floor(Date.now() / 1000);
    var exp = session.expires_at || 0;

    if (exp - now < 120) { // 2 dk kala (ya da geçmişse) proaktif yenile
      var rr;
      try { rr = await sb.auth.refreshSession(); }
      catch (e) { return true; } // ağ sorunu olabilir; bir sonraki tetikte tekrar dene
      if (rr && rr.error || !(rr && rr.data && rr.data.session)) {
        // Refresh token ölü → yenilenemez. Zorla logout YOK, sadece uyar.
        window.GRI_SESSION_OK = false;
        showSessionExpiredBar();
        return false;
      }
    }
    window.GRI_SESSION_OK = true;
    hideSessionExpiredBar();
    return true;
  }

  // Oturum durumu değişimlerini dinle
  try {
    sb.auth.onAuthStateChange(function (event, session) {
      if (event === 'TOKEN_REFRESHED') {
        window.GRI_SESSION_OK = true; hadSession = true; hideSessionExpiredBar();
      } else if (event === 'SIGNED_IN') {
        window.GRI_SESSION_OK = true; hadSession = true; hideSessionExpiredBar();
      } else if (event === 'SIGNED_OUT') {
        window.GRI_SESSION_OK = false;
        if (hadSession && !intentionalSignOut) showSessionExpiredBar();
      }
    });
  } catch (e) {}

  // Sekme tekrar öne gelince + periyodik olarak oturumu canlı tut (sessiz)
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'visible') { ensureFreshSession(); }
    });
  }
  try { setInterval(function () { ensureFreshSession(); }, 50 * 60 * 1000); } catch (e) {}

  // Sayfa yüklenince ilk proaktif kontrol
  ensureFreshSession();

  window.GriAuth = {
    verify: verify,
    getOwnedProducts: getOwnedProducts,
    hasAccess: hasAccess,
    login: login,
    logout: logout,
    requireAuth: requireAuth,
    refreshCache: refreshCache,
    sendPasswordReset: sendPasswordReset,
    updatePassword: updatePassword,
    ensureFreshSession: ensureFreshSession,
    showSessionExpiredBar: showSessionExpiredBar,
    supabase: sb
  };
})();
