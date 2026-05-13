/* Gri English — Auth helpers */

window.GriAuth = (function() {
  const STORAGE_KEY = 'gri_user';
  
  function getStored() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    } catch(e) {
      return null;
    }
  }
  
  function verify() {
    const stored = getStored();
    if (!stored || !stored.username || !stored.password) return null;
    if (!window.GRI_USERS) return null;
    const rec = window.GRI_USERS[stored.username];
    if (!rec || rec.password !== stored.password) return null;
    return { username: stored.username, record: rec };
  }
  
  function getOwnedProducts(rec) {
    if (rec.role === 'admin') return '*'; // all access
    let owned = (rec.products || []).slice();
    if (owned.includes('full-test-bundle')) {
      ['full-test-1','full-test-2','full-test-3','full-test-4','full-test-5'].forEach(p => {
        if (!owned.includes(p)) owned.push(p);
      });
    }
    return owned;
  }
  
  function hasAccess(rec, slug) {
    const owned = getOwnedProducts(rec);
    if (owned === '*') return true;
    return owned.includes(slug);
  }
  
  function login(username, password) {
    if (!window.GRI_USERS) return { ok: false, error: 'Sistem yüklenemedi.' };
    const u = username.trim().toLowerCase();
    const rec = window.GRI_USERS[u];
    if (!rec || rec.password !== password) {
      return { ok: false, error: 'Kullanıcı adı veya şifre hatalı.' };
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ username: u, password: password }));
    return { ok: true };
  }
  
  function logout() {
    localStorage.removeItem(STORAGE_KEY);
  }
  
  function requireAuth(slug, redirectPath) {
    const auth = verify();
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
  
  return {
    verify: verify,
    getOwnedProducts: getOwnedProducts,
    hasAccess: hasAccess,
    login: login,
    logout: logout,
    requireAuth: requireAuth
  };
})();
