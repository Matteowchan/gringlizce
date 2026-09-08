/* gri-secim.js — "Seçili metni Gri'ye sor" (Faz 7.C)
   Kullanıcı pasajda (veya soru kökünde) bir metin seçince, seçimin yanında küçük
   bir "Gri'ye sor" pili belirir. Tıklayınca MEVCUT Gri'ye Sor paneli açılır ve
   soru kutusu seçili metinle ilgili bir soruyla önden doldurulur — kota/tur/premium
   mantığı olduğu gibi korunur (kullanıcı yine kendisi gönderir). Tamamen additive:
   gri-ask.js'in içine dokunmaz, yalnız #griBtn tetikleyip #gri-prompt-input'u doldurur.
   Yalnız runner'da ve Gri mevcutsa (deneme modunda değil). */
(function () {
  'use strict';
  if (window.GriSecim) return;
  var MINLEN = 3, MAXQUOTE = 180;
  var pill = null, selText = '';

  function griAvailable() { return !!document.getElementById('griBtn') && !window.GRI_DENEME_MODE; }

  function ensureStyle() {
    if (document.getElementById('gri-secim-css')) return;
    var s = document.createElement('style'); s.id = 'gri-secim-css';
    s.textContent =
      '.gri-secim-pill{position:fixed;z-index:9300;transform:translate(-50%,-100%);display:none;align-items:center;gap:.4rem;font-family:var(--font-ui,Inter,system-ui,sans-serif);font-size:.82rem;font-weight:700;color:#fff;background:var(--teal,#2E6E6A);border:none;border-radius:999px;padding:.42rem .8rem;cursor:pointer;box-shadow:0 6px 18px rgba(20,18,16,.28);white-space:nowrap}' +
      '.gri-secim-pill.in{display:inline-flex}' +
      '.gri-secim-pill:hover{background:var(--teal-deep,#123C39)}' +
      '.gri-secim-pill img{width:16px;height:16px;border-radius:50%;flex:none}' +
      '.gri-secim-pill::after{content:"";position:absolute;top:100%;left:50%;transform:translateX(-50%);border:5px solid transparent;border-top-color:var(--teal,#2E6E6A)}';
    document.head.appendChild(s);
  }

  function makePill() {
    if (pill) return;
    ensureStyle();
    pill = document.createElement('button');
    pill.type = 'button';
    pill.className = 'gri-secim-pill';
    pill.setAttribute('aria-label', "Seçili metni Gri'ye sor");
    pill.innerHTML = '<img src="assets/gri-mascot.png" alt=""><span>Gri\'ye sor</span>';
    // mousedown'da seçim kaybolmasın diye engelle; asıl eylemi burada tetikle
    pill.addEventListener('mousedown', function (e) { e.preventDefault(); e.stopPropagation(); ask(); });
    document.body.appendChild(pill);
  }

  function showPill(rect) {
    makePill();
    var x = rect.left + rect.width / 2;
    var y = rect.top - 8;
    // ekran içinde tut
    x = Math.max(60, Math.min(window.innerWidth - 60, x));
    if (y < 44) y = rect.bottom + 22; // seçim en üstteyse altına al
    pill.style.left = x + 'px';
    pill.style.top = y + 'px';
    pill.classList.add('in');
  }
  function hidePill() { if (pill) pill.classList.remove('in'); }

  function inPassage(node) {
    var el = node && (node.nodeType === 1 ? node : node.parentElement);
    if (!el || !el.closest) return false;
    return !!(el.closest('.q-texts') || el.closest('.q-prompt'));
  }

  function selectionInfo() {
    var sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.rangeCount) return null;
    var txt = sel.toString().replace(/\s+/g, ' ').trim();
    if (txt.length < MINLEN) return null;
    var range = sel.getRangeAt(0);
    if (!inPassage(range.startContainer) && !inPassage(range.endContainer)) return null;
    var rect = range.getBoundingClientRect();
    if (!rect || (!rect.width && !rect.height)) return null;
    return { txt: txt, rect: rect };
  }

  function onSelectEnd() {
    if (!griAvailable()) { hidePill(); return; }
    var info = selectionInfo();
    if (!info) { hidePill(); return; }
    selText = info.txt.length > MAXQUOTE ? info.txt.slice(0, MAXQUOTE).trim() + '…' : info.txt;
    showPill(info.rect);
  }

  var asking = false;
  function ask() {
    if (!selText || asking) return;
    asking = true; setTimeout(function () { asking = false; }, 500);
    var q = 'Metindeki şu kısmı açıklar mısın: "' + selText + '"';
    hidePill();
    try { window.getSelection().removeAllRanges(); } catch (e) {}
    var grid = document.getElementById('qGrid');
    var open = grid && grid.classList.contains('show-gri');
    if (!open) { var b = document.getElementById('griBtn'); if (b) b.click(); }
    // panel prompt kutusu gelene kadar bekle, sonra doldur
    var tries = 0;
    var iv = setInterval(function () {
      tries++;
      var inp = document.getElementById('gri-prompt-input');
      if (inp) {
        clearInterval(iv);
        inp.value = q;
        try { inp.dispatchEvent(new Event('input')); } catch (e) {}
        try { inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length); } catch (e) {}
        try { inp.scrollIntoView({ block: 'center', behavior: 'auto' }); } catch (e) {}
      } else if (tries > 30) { clearInterval(iv); }
    }, 80);
  }

  // Seçim biten olaylar
  document.addEventListener('mouseup', function () { setTimeout(onSelectEnd, 10); });
  document.addEventListener('keyup', function (e) { if (e.shiftKey || e.key === 'Shift') setTimeout(onSelectEnd, 10); });
  // Seçim kaybolunca / kaydırınca pili gizle
  document.addEventListener('selectionchange', function () {
    var sel = window.getSelection();
    if (!sel || sel.isCollapsed) hidePill();
  });
  window.addEventListener('scroll', hidePill, true);
  window.addEventListener('resize', hidePill);
  // Soru değişince gizle
  window.addEventListener('gri-question-change', hidePill);

  window.GriSecim = { hide: hidePill };
})();
