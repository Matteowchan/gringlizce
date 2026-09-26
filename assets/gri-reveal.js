/* gri-reveal.js — paylaşılan giriş/scroll beliriş orkestrasyonu (UX motion katmanı).
   GÜVENLİK İLKESİ: gating sınıfını (html.gri-rv) SCRIPT'in KENDİSİ ekler → script yüklenmez/çalışmazsa
   hiçbir şey gizlenmez (içerik anında görünür). Ayrıca 2sn'lik sabit güvenlik zamanlayıcısı her şeyi
   açar; IntersectionObserver yoksa hepsi görünür; prefers-reduced-motion'da gating hiç eklenmez.
   Kullanım: bir elemana data-reveal (tekil beliriş) veya data-reveal="stagger" (çocukları kademeli). */
(function () {
  'use strict';
  var D = document, root = D.documentElement;
  var reduce = false;
  try { reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  if (reduce) return; /* hareket azaltma: hiç gate etme, her şey normal görünür */

  root.classList.add('gri-rv'); /* gating: yalnız script çalışırsa beliriş devreye girer */

  function run() {
    var els = [].slice.call(D.querySelectorAll('[data-reveal]'));
    if (!els.length) return;
    function showAll() { for (var i = 0; i < els.length; i++) els[i].classList.add('in'); }

    if (!('IntersectionObserver' in window)) { showAll(); return; }

    var io = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        var e = entries[i];
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      }
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.04 });

    els.forEach(function (el) {
      /* zaten görünür alandaysa (üst-kıvrım) hemen aç — jank/gecikme yok */
      io.observe(el);
    });

    /* GÜVENLİK AĞI: 2sn sonra ne olursa olsun her şeyi göster (hiçbir içerik gizli kalmasın) */
    setTimeout(showAll, 2000);
  }

  if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', run);
  else run();
})();
