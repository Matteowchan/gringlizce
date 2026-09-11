/* gri-secim.js — "Seçili metni Gri'ye sor" (Faz 7.C)
   Kullanıcı pasajda (veya soru kökünde) bir metin seçince "Gri'ye sor" eylemi sunulur:
   MEVCUT Gri'ye Sor paneli açılır ve soru kutusu seçili metinle ilgili bir soruyla önden
   doldurulur — kota/tur/premium mantığı olduğu gibi korunur (kullanıcı yine kendisi gönderir).
   Tamamen additive: gri-ask.js'in içine dokunmaz, yalnız #griBtn tetikleyip #gri-prompt-input'u doldurur.

   Runner'ın KENDİ seçim araç çubuğu (.hl-toolbar — altı çizme/vurgulama) varsa,
   ayrı bir pil GÖSTERMEYİZ; "Gri'ye sor" düğmesini o araç çubuğunun içine ekleriz.
   Böylece tek bir araç çubuğu çıkar, iki floating UI çakışmaz (altı-çizme bozulmaz).
   Native araç çubuğu yoksa (başka bir runner) eski bağımsız pil davranışı devreye girer. */
(function () {
  'use strict';
  if (window.GriSecim) return;
  var MINLEN = 3, MAXQUOTE = 180;
  var pill = null;

  function griAvailable() { return !!document.getElementById('griBtn') && !window.GRI_DENEME_MODE; }
  function nativeToolbar() { return document.querySelector('.hl-toolbar'); }

  function ensureStyle() {
    if (document.getElementById('gri-secim-css')) return;
    var s = document.createElement('style'); s.id = 'gri-secim-css';
    s.textContent =
      '.gri-secim-pill{position:fixed;z-index:9300;transform:translate(-50%,-100%);display:none;align-items:center;gap:.4rem;font-family:var(--font-ui,Inter,system-ui,sans-serif);font-size:.82rem;font-weight:700;color:#fff;background:var(--teal,#2E6E6A);border:none;border-radius:999px;padding:.42rem .8rem;cursor:pointer;box-shadow:0 6px 18px rgba(20,18,16,.28);white-space:nowrap}' +
      '.gri-secim-pill.in{display:inline-flex}' +
      '.gri-secim-pill:hover{background:var(--teal-deep,#123C39)}' +
      '.gri-secim-pill img{width:16px;height:16px;border-radius:50%;flex:none}' +
      '.gri-secim-pill::after{content:"";position:absolute;top:100%;left:50%;transform:translateX(-50%);border:5px solid transparent;border-top-color:var(--teal,#2E6E6A)}' +
      /* native araç çubuğu içine enjekte edilen düğme */
      '.gri-secim-hlbtn{display:inline-flex;align-items:center;gap:.34rem;margin-left:.15rem;padding:.28rem .6rem .28rem .4rem;height:24px;border:none;border-radius:999px;background:var(--teal,#2E6E6A);color:#fff;font-family:var(--font-ui,Inter,system-ui,sans-serif);font-size:.74rem;font-weight:700;line-height:1;cursor:pointer;white-space:nowrap}' +
      '.gri-secim-hlbtn:hover{background:var(--teal-deep,#123C39)}' +
      '.gri-secim-hlbtn img{width:16px;height:16px;border-radius:50%;flex:none}' +
      '.gri-secim-hlsep{width:1px;align-self:stretch;margin:.15rem .1rem;background:var(--line,rgba(0,0,0,.14))}';
    document.head.appendChild(s);
  }

  // ---- Bağımsız pil (native araç çubuğu OLMAYAN sayfalar için fallback) ----
  var selText = '';
  function makePill() {
    if (pill) return;
    ensureStyle();
    pill = document.createElement('button');
    pill.type = 'button';
    pill.className = 'gri-secim-pill';
    pill.setAttribute('aria-label', "Seçili metni Gri'ye sor");
    pill.innerHTML = '<img src="assets/gri-mascot.png" alt=""><span>Gri\'ye sor</span>';
    pill.addEventListener('mousedown', function (e) { e.preventDefault(); e.stopPropagation(); ask(selText); });
    document.body.appendChild(pill);
  }
  function showPill(rect) {
    makePill();
    var x = rect.left + rect.width / 2;
    var y = rect.top - 8;
    x = Math.max(60, Math.min(window.innerWidth - 60, x));
    if (y < 44) y = rect.bottom + 22;
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

  // ---- Native araç çubuğuna (.hl-toolbar) "Gri'ye sor" düğmesi enjekte et ----
  function injectIntoToolbar(bar) {
    if (!bar || bar.querySelector('.gri-secim-hlbtn')) return;
    ensureStyle();
    var sep = document.createElement('span');
    sep.className = 'gri-secim-hlsep';
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'gri-secim-hlbtn';
    btn.setAttribute('aria-label', "Seçili metni Gri'ye sor");
    btn.innerHTML = '<img src="assets/gri-mascot.png" alt=""><span>Gri\'ye sor</span>';
    // Seçim mousedown'da kaybolmasın; asıl eylemi burada tetikle.
    btn.addEventListener('mousedown', function (e) {
      e.preventDefault(); e.stopPropagation();
      var info = selectionInfo();
      var t = info ? info.txt : '';
      // Native araç çubuğunu gizle (highlight tool kendi hide()'ını dışa açmıyor).
      bar.classList.remove('show');
      if (t) ask(t);
    });
    bar.appendChild(sep);
    bar.appendChild(btn);
  }

  var asking = false;
  function ask(text) {
    if (!text || asking) return;
    text = text.length > MAXQUOTE ? text.slice(0, MAXQUOTE).trim() + '…' : text;
    asking = true; setTimeout(function () { asking = false; }, 500);
    var q = 'Metindeki şu kısmı açıklar mısın: "' + text + '"';
    hidePill();
    try { window.getSelection().removeAllRanges(); } catch (e) {}
    var grid = document.getElementById('qGrid');
    var open = grid && grid.classList.contains('show-gri');
    if (!open) { var b = document.getElementById('griBtn'); if (b) b.click(); }
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

  function onSelectEnd() {
    if (!griAvailable()) { hidePill(); return; }
    // Runner'ın kendi seçim araç çubuğu varsa: düğmeyi ona ekle, ayrı pil gösterme.
    var bar = nativeToolbar();
    if (bar) { injectIntoToolbar(bar); hidePill(); return; }
    var info = selectionInfo();
    if (!info) { hidePill(); return; }
    selText = info.txt.length > MAXQUOTE ? info.txt.slice(0, MAXQUOTE).trim() + '…' : info.txt;
    showPill(info.rect);
  }

  // Native araç çubuğu geç oluşuyorsa (initHighlightTool DOM'a sonradan ekliyor) yakala.
  (function waitForToolbar() {
    var bar = nativeToolbar();
    if (bar) { injectIntoToolbar(bar); return; }
    var mo = new MutationObserver(function () {
      var b = nativeToolbar();
      if (b) { injectIntoToolbar(b); mo.disconnect(); }
    });
    try { mo.observe(document.body, { childList: true }); } catch (e) {}
  })();

  document.addEventListener('mouseup', function () { setTimeout(onSelectEnd, 10); });
  document.addEventListener('keyup', function (e) { if (e.shiftKey || e.key === 'Shift') setTimeout(onSelectEnd, 10); });
  document.addEventListener('selectionchange', function () {
    var sel = window.getSelection();
    if (!sel || sel.isCollapsed) hidePill();
  });
  window.addEventListener('scroll', hidePill, true);
  window.addEventListener('resize', hidePill);
  window.addEventListener('gri-question-change', hidePill);

  window.GriSecim = { hide: hidePill };
})();
