/* ============================================================
   GRINGLIZCE — SITE CONFIG RUNTIME
   ============================================================
   Sayfa açılışında Supabase'den site_config çeker,
   banner'ı DOM'a yansıtır. Admin paneli yazınca
   tüm sayfalar bir sonraki sayfa yüklemesinde günceli görür.

   Bağımlılık: supabase-js v2 BU dosyadan ÖNCE yüklenmiş olmalı.

   Markup sözleşmesi:
   - <div class="launch-banner" data-site-banner></div>
       inner HTML'i site_config.banner.text ile dolar,
       banner.enabled false ise display: none.
   ============================================================ */

(function () {
  var SUPABASE_URL = 'https://vazbvbqgvtlaqkytfsbi.supabase.co';
  var SUPABASE_KEY = 'sb_publishable_F5K-wIVQHXlD4e4GYnySNw_Xm4teO9g';

  // Banner ve site-config'i supabase-js OLMADAN da REST ile yükle:
  // blog silosu gibi supabase-js içermeyen sayfalarda da banner görünsün.
  loadConfigRest();

  if (!window.supabase || !window.supabase.createClient) {
    console.warn('[SiteConfig] supabase-js yok; banner/config REST ile yüklendi, auth/presence atlanıyor.');
    return;
  }

  var sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

  function parseBannerText(raw) {
    var s = escapeHtml(raw);
    s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, function (m, t, u) {
      u = u.trim();
      if (/^(javascript|data):/i.test(u)) { return t; }
      return '<a href="' + u + '" style="color:inherit;text-decoration:underline;">' + t + '</a>';
    });
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/__([^_]+)__/g, '<u>$1</u>');
    s = s.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    return s;
  }

  function buildBannerHtml(b) {
    var s = [];
    if (b.color) { s.push('color:' + b.color); }
    if (b.bold) { s.push('font-weight:700'); }
    if (b.italic) { s.push('font-style:italic'); }
    if (b.size) { s.push('font-size:' + parseInt(b.size, 10) + 'px'); }
    var inner = '<span style="' + s.join(';') + '">' + parseBannerText(b.text) + '</span>';
    if (b.link && b.text.indexOf('](') === -1) {
      inner = '<a href="' + escapeHtml(b.link) + '" style="color:inherit;text-decoration:none;">' + inner + '</a>';
    }
    return inner;
  }

  function bannerContrast(hex) {
    try {
      var h = String(hex).replace('#', '');
      if (h.length === 3) { h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2]; }
      var r = parseInt(h.substr(0, 2), 16), g = parseInt(h.substr(2, 2), 16), b = parseInt(h.substr(4, 2), 16);
      return (0.299 * r + 0.587 * g + 0.114 * b) > 150 ? '#241E17' : '#ffffff';
    } catch (e) { return '#ffffff'; }
  }

  function applyBanner(cfg) {
    var banner = cfg.banner || { enabled: false, text: '' };
    document.querySelectorAll('[data-site-banner]').forEach(function (el) {
      if (banner.enabled && banner.text) {
        el.innerHTML = (banner.v === 2) ? buildBannerHtml(banner) : banner.text;
        if (banner.v === 2 && banner.bg) {
          el.style.background = banner.bg;
          el.style.color = banner.color ? '' : bannerContrast(banner.bg);
        } else {
          el.style.background = '';
          el.style.color = '';
        }
        el.style.display = 'block';
      } else {
        el.style.display = 'none';
      }
    });
  }

  // supabase-js gerektirmeyen hafif config yükleyici (REST). Banner her sayfada çalışsın diye.
  async function loadConfigRest() {
    try {
      var res = await fetch(SUPABASE_URL + '/rest/v1/site_config?select=key,value', {
        headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY }
      });
      if (!res.ok) return;
      var rows = await res.json();
      var cfg = {};
      (rows || []).forEach(function (row) { cfg[row.key] = row.value; });
      applyBanner(cfg);
      if (!window.GriSiteConfig) { window.GriSiteConfig = { config: cfg }; }
      document.dispatchEvent(new CustomEvent('gri-site-config-loaded'));
    } catch (e) { console.warn('[SiteConfig] REST config yüklenemedi:', e); }
  }

  async function init() {
    try {
      var configRes = await sb.from('site_config').select('*');

      if (configRes.error) { throw configRes.error; }

      var cfg = {};
      (configRes.data || []).forEach(function (row) { cfg[row.key] = row.value; });

      applyBanner(cfg);

      window.GriSiteConfig = {
        config: cfg
      };

      document.dispatchEvent(new CustomEvent('gri-site-config-loaded'));
    } catch (e) {
      console.error('[SiteConfig] Yüklenemedi:', e);
    }
  }

  // =============================================================
  // ACTIVITY TRACKING — login olmuş kullanıcılar için
  // user_activity tablosuna her sayfa açılışında + 5 dakikada bir update
  // =============================================================
  var ACTIVITY_INTERVAL_MS = 5 * 60 * 1000;
  var activityUserId = null;

  // Gerçek etkileşim takibi: boşta duran/unutulmuş sekmeler "aktif" sayılmasın.
  // Heartbeat yalnızca sekme görünürken VE son 5 dk içinde etkileşim varken atılır.
  var lastInteractionAt = Date.now();
  ['pointerdown', 'keydown', 'scroll', 'touchstart'].forEach(function (ev) {
    window.addEventListener(ev, function () { lastInteractionAt = Date.now(); }, { passive: true });
  });
  function isReallyActive() {
    return document.visibilityState === 'visible' &&
      (Date.now() - lastInteractionAt) < ACTIVITY_INTERVAL_MS;
  }

  async function trackActivity() {
    try {
      if (!activityUserId) {
        var userRes = await sb.auth.getUser();
        if (!userRes || !userRes.data || !userRes.data.user) return;
        activityUserId = userRes.data.user.id;
      }
      await sb.from('user_activity').upsert({
        user_id: activityUserId,
        last_active_at: new Date().toISOString()
      });
    } catch (e) {
      // sessizce geç, tracking sayfa fonksiyonelliğini etkilemesin
    }
  }

  // =============================================================
  // REALTIME PRESENCE — anonim dahil tüm visitor'lar için
  // site_presence channel'a join ol, admin paneli online sayar + kim olduğunu görür
  // =============================================================
  function joinPresence() {
    try {
      var presenceId = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : (Date.now() + '-' + Math.random().toString(36).slice(2));
      var channel = sb.channel('site_presence', {
        config: { presence: { key: presenceId } }
      });
      channel.subscribe(async function (status) {
        if (status === 'SUBSCRIBED') {
          var trackData = {
            id: presenceId,
            joined_at: Date.now(),
            page: location.pathname,
            anon: true
          };
          // GÜVENLİK: presence kanalı public (anon abone olabilir) → PII (email/isim) YAYINLAMA.
          // Yalnızca user_id (uuid) yayınlanır; admin paneli email'i sunucu-taraflı admin-gate'li RPC ile çözer.
          try {
            var sess = await sb.auth.getSession();
            var user = sess && sess.data && sess.data.session && sess.data.session.user;
            if (user) {
              trackData.user_id = user.id;
              trackData.anon = false;
            }
          } catch (e) {}
          try { await channel.track(trackData); } catch (e) {}
        }
      });
      window.__griPresence = channel;
    } catch (e) {}
  }

  // =============================================================
  // BADGE EVALUATION TRIGGER — Major aksiyon sonrası rozet kontrolü
  // Debounce'lu, en fazla 30 saniyede bir çağrı yapılır.
  // Yeni kazanılan rozet varsa toast notification (panelim'deki gibi)
  // çıkacak şekilde tasarlı.
  // =============================================================
  var __badgeCheckBusy = false;
  var __badgeCheckLastRun = 0;
  var __badgeCheckMinInterval = 30000; // 30 sn
  var __badgeCheckPending = false;

  window.triggerBadgeCheck = async function (opts) {
    opts = opts || {};
    var force = opts.force === true;
    var silent = opts.silent === true;

    var now = Date.now();
    if (!force && (now - __badgeCheckLastRun < __badgeCheckMinInterval)) {
      __badgeCheckPending = true;
      return null;
    }
    if (__badgeCheckBusy) return null;
    __badgeCheckBusy = true;
    __badgeCheckLastRun = now;
    __badgeCheckPending = false;

    try {
      var sess = await sb.auth.getSession();
      var uid = sess && sess.data && sess.data.session && sess.data.session.user && sess.data.session.user.id;
      if (!uid) return null;

      var res = await sb.rpc('evaluate_user_progress', { p_user_id: uid });
      if (res.error) {
        console.warn('[badge-eval] failed:', res.error);
        return null;
      }
      var newBadges = res.data || [];
      if (!silent && newBadges && newBadges.length) {
        try { window.__showBadgeToast && window.__showBadgeToast(newBadges); } catch (e) {}
      }
      return newBadges;
    } catch (e) {
      console.warn('[badge-eval] exception:', e);
      return null;
    } finally {
      __badgeCheckBusy = false;
      // Pending varsa interval sonunda tekrar dene
      if (__badgeCheckPending) {
        setTimeout(function () { window.triggerBadgeCheck(); }, __badgeCheckMinInterval);
      }
    }
  };

  // Auto-trigger on tab close (best-effort)
  window.addEventListener('beforeunload', function () {
    if (__badgeCheckPending) {
      try { window.triggerBadgeCheck({ force: true, silent: true }); } catch (e) {}
    }
  });

  // =============================================================
  // BADGE TOAST — Yeni kazanılan rozet için sağ alttan slide-in
  // panelim.html dışındaki tüm sayfalarda kullanılır.
  // panelim.html zaten kendi toast'unu çalıştırıyor, override etmez.
  // =============================================================
  window.__showBadgeToast = window.__showBadgeToast || function (badges) {
    if (!badges || !badges.length) return;
    // CSS'i bir kez enjekte et
    if (!document.getElementById('gri-badge-toast-style')) {
      var style = document.createElement('style');
      style.id = 'gri-badge-toast-style';
      style.textContent = [
        '.gri-toast{position:fixed;bottom:1.5rem;right:1.5rem;background:var(--bg-card,#fefcf7);border:1px solid var(--line,#d4c9ae);border-left:3px solid #c89a3c;padding:0.9rem 1.2rem;box-shadow:0 10px 28px rgba(26,34,48,0.15);z-index:99999;display:flex;align-items:center;gap:0.9rem;max-width:360px;transform:translateX(440px);transition:transform 0.55s cubic-bezier(0.4,0,0.2,1);font-family:Georgia,serif;}',
        '.gri-toast.show{transform:translateX(0);}',
        '.gri-toast-icon{width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,#f0c060,#a8801f);display:flex;align-items:center;justify-content:center;flex-shrink:0;color:#fefcf7;font-size:24px;}',
        '.gri-toast-eyebrow{font-family:Inter,sans-serif;font-size:9px;letter-spacing:0.2em;text-transform:uppercase;color:#c89a3c;font-weight:700;}',
        '.gri-toast-name{font-size:1.05rem;font-weight:500;color:#1a2230;line-height:1.2;margin-top:0.15rem;}',
        '.gri-toast-desc{font-style:italic;font-size:0.82rem;color:#8a9099;margin-top:0.15rem;}'
      ].join('');
      document.head.appendChild(style);
    }

    badges.forEach(function (b, i) {
      setTimeout(function () {
        var el = document.createElement('div');
        el.className = 'gri-toast';
        el.innerHTML =
          '<div class="gri-toast-icon">★</div>' +
          '<div>' +
            '<div class="gri-toast-eyebrow">Yeni Rozet</div>' +
            '<div class="gri-toast-name">' + (b.name || 'Rozet kazandın') + '</div>' +
            '<div class="gri-toast-desc">' + (b.description || '') + '</div>' +
          '</div>';
        document.body.appendChild(el);
        setTimeout(function () { el.classList.add('show'); }, 50);
        setTimeout(function () {
          el.classList.remove('show');
          setTimeout(function () { try { el.remove(); } catch (e) {} }, 600);
        }, 5000);
      }, i * 600);
    });
  };

  // =============================================================
  // NAV AUTH TOGGLE — login olmuş kullanıcı için Giriş → Çalışma Masam
  // Tüm sayfalarda nav'daki giris.html linkini panelim.html'e çevirir
  // =============================================================
  // NAV AUTH MOUNT — #navUserMount içine login durumuna göre içerik bas
  // - Login değilse: "Giriş" CTA → giris.html
  // - Login ise: dairesel avatar (email/isim ilk harfi) + dropdown (Çalışma Masam / Şifre / Çıkış)
  // =============================================================
  function inSubdir() {
    // True if the page sits inside any one-level subdirectory (e.g. /urun/, /sat-ders-notlari/)
    var path = location.pathname.replace(/\/+$/, '');
    var parts = path.split('/').filter(Boolean);
    // If there are 2+ parts, last is the file, second-to-last is the subdir
    return parts.length >= 2;
  }
  function pageHref(name) {
    name = name.replace(/\.html$/, ''); // temiz URL: uzantısız
    return inSubdir() ? ('../' + name) : name;
  }

  function renderGuestCta(mount) {
    var a = document.createElement('a');
    a.href = pageHref('giris.html');
    a.className = 'btn-nav-cta';
    a.textContent = 'Giriş';
    mount.innerHTML = '';
    mount.appendChild(a);
  }

  (function injectUserNavCss(){
    if (document.getElementById('gri-usernav-css')) return;
    var css = document.createElement('style');
    css.id = 'gri-usernav-css';
    css.textContent =
      '.nav-user{position:relative;display:inline-flex;align-items:center}' +
      '.nav-user-btn{width:34px;height:34px;border-radius:50%;border:none;cursor:pointer;' +
        'background:var(--teal,#2C5856);color:#fff;font-family:Inter,system-ui,sans-serif;' +
        'font-weight:700;font-size:14px;display:inline-flex;align-items:center;justify-content:center;' +
        'line-height:1;padding:0;transition:filter .15s}' +
      '.nav-user-btn:hover{filter:brightness(1.08)}' +
      '.nav-user-menu{position:absolute;top:calc(100% + 8px);right:0;min-width:210px;background:#fff;' +
        'border:1px solid var(--line,#E3D8C5);border-radius:12px;box-shadow:0 14px 40px rgba(20,15,10,.18);' +
        'padding:6px;display:none;z-index:1000}' +
      '.nav-user-menu.open{display:block}' +
      '.nav-user-head{padding:9px 11px 8px;border-bottom:1px solid var(--line,#E3D8C5);margin-bottom:4px}' +
      '.nav-user-name{font-family:Inter,system-ui,sans-serif;font-weight:700;font-size:13.5px;color:var(--text,#1A2230)}' +
      '.nav-user-email{font-family:Inter,system-ui,sans-serif;font-size:11.5px;color:var(--text-muted,#8A7F6E);margin-top:2px}' +
      '.nav-user-menu a,.nav-user-menu .nav-user-logout{display:block;width:100%;text-align:left;' +
        'padding:8px 11px;border-radius:8px;font-family:Inter,system-ui,sans-serif;font-size:13px;' +
        'color:var(--text,#1A2230);text-decoration:none;background:none;border:none;cursor:pointer}' +
      '.nav-user-menu a:hover,.nav-user-menu .nav-user-logout:hover{background:var(--teal-soft,#DDEBE9)}' +
      '.nav-user-logout{color:#A8382F}' +
      /* Premium rozeti: avatarın sağ-alt köşesinde küçük yıldız */
      '.nav-user.nav-premium::after{content:"\\2605";position:absolute;right:-3px;bottom:-3px;width:15px;height:15px;border-radius:50%;' +
        'background:linear-gradient(135deg,#9a5252,#6d2f2f);color:#fff;font-family:Inter,system-ui,sans-serif;font-size:8.5px;font-weight:700;' +
        'line-height:15px;text-align:center;box-shadow:0 0 0 2px var(--surface,#fff),0 1px 3px rgba(20,15,10,.35);pointer-events:none}' +
      '.nav-premium-tag{display:inline-flex;align-items:center;gap:4px;margin-top:5px;padding:2px 8px;border-radius:100px;' +
        'background:linear-gradient(135deg,#9a5252,#6d2f2f);color:#fff;font-family:Inter,system-ui,sans-serif;font-size:10px;font-weight:700;letter-spacing:.05em}';
    document.head.appendChild(css);
  })();
  function renderUserAvatar(mount, user) {
    var email = (user && user.email) || '';
    var meta = (user && user.user_metadata) || {};
    var displayName = meta.full_name || meta.name || email;
    var initial = (displayName || 'U').trim().charAt(0).toUpperCase();

    mount.innerHTML = '';
    mount.classList.add('nav-user-mount-active');

    var wrap = document.createElement('div');
    wrap.className = 'nav-user';

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'nav-user-btn';
    btn.setAttribute('aria-label', 'Hesap menüsü');
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('title', displayName);
    btn.textContent = initial;

    var menu = document.createElement('div');
    menu.className = 'nav-user-menu';
    menu.setAttribute('role', 'menu');
    menu.innerHTML =
      '<div class="nav-user-head">' +
        '<div class="nav-user-name">' + escapeHtml(displayName) + '</div>' +
        (displayName !== email ? '<div class="nav-user-email">' + escapeHtml(email) + '</div>' : '') +
      '</div>' +
      '<a href="' + pageHref('panelim.html') + '" role="menuitem">Çalışma Masam</a>' +
      '<a href="' + pageHref('sifre-sifirla.html') + '" role="menuitem">Şifre değiştir</a>' +
      '<button type="button" class="nav-user-logout" role="menuitem">Çıkış yap</button>';

    wrap.appendChild(btn);
    wrap.appendChild(menu);
    mount.appendChild(wrap);

    // Premium rozeti — profiles.premium_until aktifse avatara yıldız + menüye etiket
    (async function markPremium() {
      try {
        if (!sb || !user || !user.id) return;
        var r = await sb.from('profiles').select('premium_until').eq('id', user.id).maybeSingle();
        var until = r && r.data ? r.data.premium_until : null;
        if (!until || new Date(until).getTime() <= Date.now()) return;
        wrap.classList.add('nav-premium');
        btn.setAttribute('title', displayName + ' · Premium');
        var head = menu.querySelector('.nav-user-head');
        if (head && !head.querySelector('.nav-premium-tag')) {
          var tag = document.createElement('span');
          tag.className = 'nav-premium-tag';
          tag.textContent = '★ Premium';
          head.appendChild(tag);
        }
      } catch (e) {}
    })();

    function open() { menu.classList.add('open'); btn.setAttribute('aria-expanded', 'true'); }
    function close() { menu.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); }

    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (menu.classList.contains('open')) close(); else open();
    });
    document.addEventListener('click', function (e) {
      if (!menu.classList.contains('open')) return;
      if (wrap.contains(e.target)) return;
      close();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.classList.contains('open')) close();
    });

    var logoutBtn = menu.querySelector('.nav-user-logout');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async function () {
        try {
          await sb.auth.signOut();
        } catch (e) {}
        location.href = '/';
      });
    }
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

 async function updateAuthNav(_tries) {
    var mount = document.getElementById('navUserMount');
    if (!mount) {
      if ((_tries || 0) < 20) return void setTimeout(function(){ updateAuthNav((_tries||0)+1); }, 100);
      return;
    }

    var user = null;
    try {
      var userRes = await sb.auth.getUser();
      if (userRes && userRes.data && userRes.data.user) {
        user = userRes.data.user;
      }
    } catch (e) {}

    if (user) {
      renderUserAvatar(mount, user);
    } else {
      renderGuestCta(mount);
    }
  }

 function startTracking() {
    if (document.visibilityState === 'visible') trackActivity();
    setInterval(function () { if (isReallyActive()) trackActivity(); }, ACTIVITY_INTERVAL_MS);
    joinPresence();
    updateAuthNav();
    try {
      sb.auth.onAuthStateChange(function(){ updateAuthNav(); });
    } catch (e) {}
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
    document.addEventListener('DOMContentLoaded', startTracking);
  } else {
    init();
    startTracking();
  }
})();
