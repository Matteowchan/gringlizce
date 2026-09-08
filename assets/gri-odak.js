/* gri-odak.js — "Odak Modu" (Faz 6.2)
   Soru çözerken dikkat dağıtan çevre öğelerini (site menüsü, breadcrumb, ipuçları,
   karıştır/etiketler) sakince gizler; soru, şıklar, açıklama ve temel gezinme
   (önceki/sonraki/açıklama) TAM korunur. Opt-in, kolay çıkılır (buton + Esc),
   tercih hatırlanır. prefers-reduced-motion'a saygılı. Yalnızca runner'da (soru.html).
   Hiçbir veriyi/akışı değiştirmez — sadece bir gövde sınıfı + CSS. */
(function () {
  'use strict';
  if (window.GriOdak) return;
  var KEY = 'gri-odak';
  var CLS = 'gri-odak';

  function onRunner() { return !!document.getElementById('qPageWrap'); }

  function ensureStyle() {
    if (document.getElementById('gri-odak-css')) return;
    var s = document.createElement('style'); s.id = 'gri-odak-css';
    s.textContent =
      /* çıkış/aç pili — her zaman görünür */
      '.gri-odak-pill{position:fixed;top:14px;right:14px;z-index:9200;display:inline-flex;align-items:center;gap:.45rem;font-family:var(--font-ui,Inter,system-ui,sans-serif);font-size:.82rem;font-weight:700;color:var(--text-soft,#6E6353);background:var(--bg-card,#FBF6EC);border:1px solid var(--line,#E3D8C3);border-radius:999px;padding:.42rem .8rem;cursor:pointer;box-shadow:var(--shadow-sm,0 1px 2px rgba(44,42,38,.06));transition:border-color .14s,color .14s}' +
      '.gri-odak-pill:hover{border-color:var(--teal,#2E6E6A);color:var(--teal,#2E6E6A)}' +
      '.gri-odak-pill svg{width:15px;height:15px;flex:none}' +
      '@media(max-width:640px){.gri-odak-pill{top:auto;bottom:16px;right:16px}}' +
      /* aktif odak modu */
      'body.' + CLS + ' header.gri-nav{display:none!important}' +
      'body.' + CLS + ' #qBreadcrumb{display:none!important}' +
      'body.' + CLS + ' .q-hint{display:none!important}' +
      'body.' + CLS + ' .q-tags-bar{display:none!important}' +
      'body.' + CLS + ' #remixBtn{display:none!important}' +
      'body.' + CLS + ' #bookmarkBtn,body.' + CLS + ' #reportBtn,body.' + CLS + ' #noteBtn{opacity:.4;transition:opacity .14s}' +
      'body.' + CLS + ' #bookmarkBtn:hover,body.' + CLS + ' #reportBtn:hover,body.' + CLS + ' #noteBtn:hover{opacity:1}' +
      'body.' + CLS + ' .gri-odak-pill{background:var(--teal,#2E6E6A);color:#fff;border-color:var(--teal,#2E6E6A)}' +
      'body.' + CLS + ' .gri-odak-pill:hover{color:#fff;background:var(--teal-deep,#123C39)}' +
      /* sakin zemin + biraz daha nefes */
      'body.' + CLS + '{background:var(--bg-soft,#F4EFE3)!important}' +
      'body.' + CLS + ' .q-page-wrap{padding-top:2.4rem}' +
      '@media(prefers-reduced-motion:reduce){.gri-odak-pill{transition:none}}';
    document.head.appendChild(s);
  }

  var EYE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';

  var pill = null;
  function label() {
    if (!pill) return;
    var on = document.body.classList.contains(CLS);
    pill.setAttribute('aria-pressed', on ? 'true' : 'false');
    pill.innerHTML = EYE + '<span>' + (on ? 'Odaktan çık' : 'Odak modu') + '</span>';
    pill.setAttribute('aria-label', on ? 'Odak modundan çık' : 'Odak moduna geç');
  }

  function apply(on, persist) {
    document.body.classList.toggle(CLS, on);
    if (persist) { try { on ? localStorage.setItem(KEY, '1') : localStorage.removeItem(KEY); } catch (e) {} }
    label();
    if (on) window.scrollTo({ top: 0, behavior: 'auto' });
  }

  function makePill() {
    if (pill) return;
    ensureStyle();
    pill = document.createElement('button');
    pill.type = 'button';
    pill.className = 'gri-odak-pill';
    pill.addEventListener('click', function () { apply(!document.body.classList.contains(CLS), true); });
    document.body.appendChild(pill);
    label();
  }

  function init() {
    if (!onRunner()) return;
    makePill();
    var saved = false;
    try { saved = localStorage.getItem(KEY) === '1'; } catch (e) {}
    if (saved) apply(true, false);
    // Esc'i kaçırmıyoruz: runner'ın kendi Esc davranışlarıyla çakışmasın.
    // Çıkış her zaman görünür pille yapılır.
  }

  window.GriOdak = { on: function () { apply(true, true); }, off: function () { apply(false, true); } };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
