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

  var io = null, seen = [];
  /* GÜVENLİK AĞI: yalnız şu an görünür/üstte olanları aç — alttaki bölümler scroll'da belirmeye devam etsin
     (eskiden hepsini açıyordu, bu da 2sn sonra scroll-reveal'i tümden devre dışı bırakıyordu). */
  function showAll() {
    var vh = window.innerHeight || document.documentElement.clientHeight || 0;
    for (var i = 0; i < seen.length; i++) {
      var el = seen[i];
      try { if (el.getBoundingClientRect().top < vh + 40) el.classList.add('in'); }
      catch (e) { el.classList.add('in'); }
    }
  }
  function observe(list) {
    for (var i = 0; i < list.length; i++) {
      var el = list[i];
      if (el.__grv) continue; el.__grv = 1; el.setAttribute('data-grv', '1'); seen.push(el);
      if (io) io.observe(el); else el.classList.add('in');
    }
  }
  function run() {
    if ('IntersectionObserver' in window) {
      io = new IntersectionObserver(function (entries) {
        for (var i = 0; i < entries.length; i++) {
          var e = entries[i];
          if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
        }
      }, { rootMargin: '0px 0px -6% 0px', threshold: 0.04 });
    }
    observe(D.querySelectorAll('[data-reveal]'));

    /* JS ile sonradan eklenen [data-reveal] içeriği de yakala (JS-render'lı hub sayfaları için) */
    if ('MutationObserver' in window) {
      var mo = new MutationObserver(function () { observe(D.querySelectorAll('[data-reveal]:not([data-grv])')); });
      try { mo.observe(D.body, { childList: true, subtree: true }); } catch (e) {}
      /* dinamik render için pencereyi biraz açık tut, sonra kapat (kalıcı gözlemci maliyeti olmasın) */
      setTimeout(function () { try { mo.disconnect(); } catch (e) {} }, 8000);
    }

    /* GÜVENLİK AĞI: 2sn sonra ne olursa olsun her şeyi göster (hiçbir içerik gizli kalmasın) */
    setTimeout(showAll, 2000);
  }

  if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', run);
  else run();
})();
