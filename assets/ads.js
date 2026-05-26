// =============================================================
// Gri English — Ads Manager (Google AdSense)
// =============================================================
// AdSense onayı gelene kadar enabled: false. Onay sonrası
// clientId + slot ID'leri doldurulur, tek push ile canlıya alır.
// =============================================================

window.GRINGLIZCE_ADS = {
  // AdSense onayı sonrası true yap
  enabled: false,

  // ca-pub-XXXXXXXXXXXXXXXX (AdSense panelinden al)
  clientId: '',

  // Her placement için slot ID (AdSense > Ads > By ad unit'ten al)
  slots: {
    'home-top':        '',  // index.html hero altı
    'home-mid':        '',  // index.html sayfa ortası
    'blog-top':        '',  // ders notları makale başlangıcı
    'blog-mid':        '',  // ders notları makale ortası
    'blog-bottom':     '',  // ders notları makale sonu
    '404':             '',  // 404 sayfası
    'product-bottom':  ''   // marketing sayfaları (diskret, lazy)
  }
};

(function () {
  var C = window.GRINGLIZCE_ADS;

  function isEnabled() {
    return C && C.enabled === true
      && typeof C.clientId === 'string'
      && C.clientId.indexOf('ca-pub-') === 0;
  }

  function loadAdSenseScript() {
    if (document.getElementById('gri-adsense-script')) return;
    var s = document.createElement('script');
    s.id = 'gri-adsense-script';
    s.async = true;
    s.crossOrigin = 'anonymous';
    s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + encodeURIComponent(C.clientId);
    document.head.appendChild(s);
  }

  function renderSlot(el) {
    if (el.dataset.adRendered === '1') return;
    var name = el.dataset.adSlot;
    var slotId = C.slots[name];
    if (!slotId) return;  // Config'de slot ID yoksa render etme

    var inner = el.querySelector('.ad-slot-inner') || el;
    var ins = document.createElement('ins');
    ins.className = 'adsbygoogle';
    ins.style.display = 'block';
    ins.setAttribute('data-ad-client', C.clientId);
    ins.setAttribute('data-ad-slot', slotId);
    ins.setAttribute('data-ad-format', el.dataset.adFormat || 'auto');
    ins.setAttribute('data-full-width-responsive', 'true');
    inner.appendChild(ins);

    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      // AdSense henüz yüklenmediyse, sessiz geç
    }

    el.dataset.adRendered = '1';
    el.classList.add('ad-slot-active');
  }

  function renderEager() {
    var slots = document.querySelectorAll('[data-ad-slot]:not([data-ad-lazy="true"])');
    slots.forEach(renderSlot);
  }

  function renderLazy() {
    var lazy = document.querySelectorAll('[data-ad-slot][data-ad-lazy="true"]');
    if (!lazy.length) return;
    if (!('IntersectionObserver' in window)) {
      // Fallback: hemen render et
      lazy.forEach(renderSlot);
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          renderSlot(entry.target);
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '200px 0px 200px 0px' });
    lazy.forEach(function (el) { io.observe(el); });
  }

  function init() {
    if (!isEnabled()) {
      // Devre dışı: slot'lar görünmez (CSS .ad-slot-active class'ı eklenmiyor)
      return;
    }
    loadAdSenseScript();
    renderEager();
    renderLazy();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
