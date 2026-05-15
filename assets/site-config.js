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

  function applyBanner(cfg) {
    var banner = cfg.banner || { enabled: false, text: '' };
    document.querySelectorAll('[data-site-banner]').forEach(function (el) {
      if (banner.enabled && banner.text) {
        el.innerHTML = banner.text;
        el.style.display = '';
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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
