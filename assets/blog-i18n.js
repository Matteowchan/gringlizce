/* ============================================================
   GRI ENGLISH — Blog EN/TR dil değiştirici
   Yalnızca sayfada [data-blog-lang="en"] içeriği varsa devreye girer.
   Türkçe-only sayfalarda hiçbir şey yapmaz (no-op).
   Seçim localStorage'da 'gri-blog-lang' anahtarında saklanır.
   ============================================================ */
(function () {
  'use strict';
  var KEY = 'gri-blog-lang';

  function getLang() {
    try { var v = localStorage.getItem(KEY); if (v === 'en' || v === 'tr') return v; } catch (e) {}
    return 'tr';
  }
  function setLang(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }

  function apply(lang) {
    var groups = document.querySelectorAll('[data-blog-lang]');
    if (!groups.length) return;
    for (var i = 0; i < groups.length; i++) {
      groups[i].hidden = (groups[i].getAttribute('data-blog-lang') !== lang);
    }
    document.documentElement.setAttribute('lang', lang === 'en' ? 'en' : 'tr');
    var btns = document.querySelectorAll('.blog-lang-toggle button[data-lang]');
    for (var j = 0; j < btns.length; j++) {
      btns[j].setAttribute('aria-pressed', btns[j].getAttribute('data-lang') === lang ? 'true' : 'false');
    }
  }

  function injectToggle() {
    // Dil değiştirici artık nav'da (nav.js, site-geneli tek switch). Hero'ya toggle enjekte etme.
    if (window.griSetLang) return;
    if (document.querySelector('.blog-lang-toggle')) return;
    var hero = document.querySelector('.blog-hero, .blog-hub-head, .ka-hero, .kt-hero');
    if (!hero) return;
    var wrap = document.createElement('div');
    wrap.className = 'blog-lang-toggle';
    wrap.setAttribute('role', 'group');
    wrap.setAttribute('aria-label', 'Dil / Language');
    wrap.innerHTML =
      '<button type="button" data-lang="tr" aria-pressed="true" title="Türkçe">TR</button>' +
      '<button type="button" data-lang="en" aria-pressed="false" title="English">EN</button>';
    hero.appendChild(wrap);
    wrap.addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('[data-lang]') : null;
      if (!b) return;
      var lang = b.getAttribute('data-lang');
      setLang(lang);
      apply(lang);
    });
  }

  function init() {
    if (!document.querySelector('[data-blog-lang="en"]')) return; // TR-only: no-op
    injectToggle();
    apply(getLang());
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
