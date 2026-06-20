/* ============================================================
   GRINGLIZCE — SITE CONFIG RUNTIME
   ============================================================
   Sayfa açılışında Supabase'den site_config + products çeker,
   banner'ı ve fiyatları DOM'a yansıtır. Admin paneli yazınca
   tüm sayfalar bir sonraki sayfa yüklemesinde günceli görür.

   Bağımlılık: supabase-js v2 BU dosyadan ÖNCE yüklenmiş olmalı.

   Markup sözleşmesi:
   - <div class="launch-banner" data-site-banner></div>
       inner HTML'i site_config.banner.text ile dolar,
       banner.enabled false ise display: none.

   - <span class="product-price" data-price-slug="grammar-pack-1"></span>
       Kategori sayfası kart fiyatı. has-discount sınıfı otomatik
       eklenir/silinir. Service ürünlerde min-max aralığı gösterir.

   - <div data-price-detail-slug="grammar-pack-1"></div>
       Ürün detay sayfası price-box içeriği (discount badge + eski +
       yeni). Tek ürün (variant'sız) ürünler için.

   - <div class="tier-price" data-variant-slug="ielts-writing-feedback"
          data-variant-index="0"></div>
       Service ürün detay sayfasında her Seçenek için. Index 0,1,2
       sırasıyla variants[0..2].price'i yansıtır. İndirim
       uygulanmaz (has_discount FALSE service'lerde).
   ============================================================ */

(function () {
  var SUPABASE_URL = 'https://vazbvbqgvtlaqkytfsbi.supabase.co';
  var SUPABASE_KEY = 'sb_publishable_F5K-wIVQHXlD4e4GYnySNw_Xm4teO9g';

  if (!window.supabase || !window.supabase.createClient) {
    console.warn('[SiteConfig] supabase-js yok, runtime atlanıyor.');
    return;
  }

  var sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

  function fmt(n) {
    return Number(n).toLocaleString('tr-TR');
  }

  function discountedPrice(base, pct) {
    return Math.round(Number(base) * (100 - Number(pct)) / 100);
  }

  function renderCardPrice(product, discountCfg) {
    var price = Number(product.base_price);
    var pct = Number(discountCfg.percentage || 0);
    var applyDiscount = !!(product.has_discount && discountCfg.enabled && pct > 0);

    // Service ürün varyasyonluysa min-max aralığı göster
    if (product.product_type === 'service' && Array.isArray(product.variants) && product.variants.length > 0) {
      var prices = product.variants.map(function (v) { return Number(v.price); });
      var lo = Math.min.apply(null, prices);
      var hi = Math.max.apply(null, prices);
      return '<span class="price-new"><span class="currency">₺</span>' + fmt(lo) +
             '</span><span class="price-range-sep" style="margin: 0 0.4rem; color: var(--text-muted);">—</span>' +
             '<span class="price-new"><span class="currency">₺</span>' + fmt(hi) + '</span>';
    }

    if (applyDiscount) {
      var d = discountedPrice(price, pct);
      return '<span class="price-old">₺' + fmt(price) + '</span>' +
             '<span class="price-new"><span class="currency">₺</span>' + fmt(d) + '</span>';
    }
    return '<span class="price-new"><span class="currency">₺</span>' + fmt(price) + '</span>';
  }

  function renderDetailPrice(product, discountCfg) {
    var price = Number(product.base_price);
    var pct = Number(discountCfg.percentage || 0);
    var applyDiscount = !!(product.has_discount && discountCfg.enabled && pct > 0);

    if (applyDiscount) {
      var d = discountedPrice(price, pct);
      return '<div class="discount-badge">%' + pct + ' Açılış İndirimi</div>' +
             '<span class="price-old">₺' + fmt(price) + '</span>' +
             '<div class="price"><span class="currency">₺</span>' + fmt(d) + '</div>';
    }
    return '<div class="price"><span class="currency">₺</span>' + fmt(price) + '</div>';
  }

  function renderVariantPrice(variant) {
    return '<span class="currency">₺</span>' + fmt(Number(variant.price));
  }

  function buildBannerHtml(b) {
    var s = [];
    if (b.color) { s.push('color:' + b.color); }
    if (b.bold) { s.push('font-weight:700'); }
    if (b.italic) { s.push('font-style:italic'); }
    if (b.size) { s.push('font-size:' + parseInt(b.size, 10) + 'px'); }
    var inner = '<span style="' + s.join(';') + '">' + escapeHtml(b.text) + '</span>';
    if (b.link) { inner = '<a href="' + escapeHtml(b.link) + '" style="color:inherit;text-decoration:none;">' + inner + '</a>'; }
    return inner;
  }

  function applyBanner(cfg) {
    var banner = cfg.banner || { enabled: false, text: '' };
    document.querySelectorAll('[data-site-banner]').forEach(function (el) {
      if (banner.enabled && banner.text) {
        el.innerHTML = (banner.v === 2) ? buildBannerHtml(banner) : banner.text;
        el.style.display = 'block';
      } else {
        el.style.display = 'none';
      }
    });
  }

  function applyCardPrices(productsBySlug, discountCfg) {
    document.querySelectorAll('[data-price-slug]').forEach(function (el) {
      var slug = el.getAttribute('data-price-slug');
      var p = productsBySlug[slug];
      if (!p) { return; }
      var applyDiscount = !!(p.has_discount && discountCfg.enabled && Number(discountCfg.percentage || 0) > 0);
      var hasService = p.product_type === 'service' && Array.isArray(p.variants) && p.variants.length > 0;
      el.classList.toggle('has-discount', applyDiscount && !hasService);
      el.innerHTML = renderCardPrice(p, discountCfg);
    });
  }

  function applyDetailPrices(productsBySlug, discountCfg) {
    document.querySelectorAll('[data-price-detail-slug]').forEach(function (el) {
      var slug = el.getAttribute('data-price-detail-slug');
      var p = productsBySlug[slug];
      if (!p) { return; }
      el.innerHTML = renderDetailPrice(p, discountCfg);
    });
  }

  function applyVariantPrices(productsBySlug) {
    document.querySelectorAll('[data-variant-slug]').forEach(function (el) {
      var slug = el.getAttribute('data-variant-slug');
      var idx = parseInt(el.getAttribute('data-variant-index') || '0', 10);
      var p = productsBySlug[slug];
      if (!p || !Array.isArray(p.variants) || !p.variants[idx]) { return; }
      el.innerHTML = renderVariantPrice(p.variants[idx]);
    });
  }

  async function init() {
    try {
      var results = await Promise.all([
        sb.from('site_config').select('*'),
        sb.from('products').select('*')
      ]);
      var configRes = results[0];
      var productsRes = results[1];

      if (configRes.error) { throw configRes.error; }
      if (productsRes.error) { throw productsRes.error; }

      var cfg = {};
      (configRes.data || []).forEach(function (row) { cfg[row.key] = row.value; });

      var discountCfg = cfg.discount || { enabled: false, percentage: 0 };

      var productsBySlug = {};
      (productsRes.data || []).forEach(function (p) {
        // variants JSONB Supabase'den geldiğinde array olarak parse edilmiş olmalı,
        // string olarak gelirse parse edelim
        if (typeof p.variants === 'string') {
          try { p.variants = JSON.parse(p.variants); } catch (e) { p.variants = null; }
        }
        productsBySlug[p.slug] = p;
      });

      applyBanner(cfg);
      applyCardPrices(productsBySlug, discountCfg);
      applyDetailPrices(productsBySlug, discountCfg);
      applyVariantPrices(productsBySlug);

      window.GriSiteConfig = {
        config: cfg,
        productsBySlug: productsBySlug,
        discount: discountCfg
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
          // Eğer login olmuşsa, user_id + email + display_name'i de ekle
          try {
            var sess = await sb.auth.getSession();
            var user = sess && sess.data && sess.data.session && sess.data.session.user;
            if (user) {
              trackData.user_id = user.id;
              trackData.email = user.email;
              trackData.display_name = (user.user_metadata && (user.user_metadata.full_name || user.user_metadata.name)) || (user.email ? user.email.split('@')[0] : '');
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
        location.href = pageHref('index.html');
      });
    }
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  async function updateAuthNav() {
    var mount = document.getElementById('navUserMount');
    if (!mount) return;

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
    trackActivity();
    setInterval(trackActivity, ACTIVITY_INTERVAL_MS);
    joinPresence();
    updateAuthNav();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
    document.addEventListener('DOMContentLoaded', startTracking);
  } else {
    init();
    startTracking();
  }
})();
