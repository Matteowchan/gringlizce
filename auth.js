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
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false }
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

  function hasAccess(rec, slug) {
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
    try { await sb.auth.signOut(); } catch (e) {}
    clearCache();
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

  window.GriAuth = {
    verify: verify,
    getOwnedProducts: getOwnedProducts,
    hasAccess: hasAccess,
    login: login,
    logout: logout,
    requireAuth: requireAuth,
    refreshCache: refreshCache,
    supabase: sb
  };
})();
