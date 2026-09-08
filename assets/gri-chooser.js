/* gri-chooser.js — "Karar veremiyorum" rehberli seçim akışı (Faz 7.G).
   Rastgele mekanik yerine kısa, faydalı bir karar akışı. Sonuç GERÇEK bir
   aktivite açar; dekoratif quiz değildir.
   Erişilebilir modal diyalog: odak yönetimi + tuzak + Esc + geri-odak.
   Kullanıcı-tetikli; asla otomatik açılmaz. */
(function () {
  'use strict';
  if (window.GriChooser) return;

  function plan() { try { return (window.GriPlan && window.GriPlan.get()) || JSON.parse(localStorage.getItem('gri-plan')) || null; } catch (e) { return null; } }
  var EXAM_TOPIC = { sat: 'konu-anlatimi', ielts: 'konu-ielts-writing-task2', toefl: 'konu-anlatimi', ydt: 'konu-anlatimi', yds: 'konu-anlatimi', ib: 'konu-ib-genel-bakis', udsp: 'udsp-ogren', genel: 'ogrenme-haritasi' };
  var EXAM_BANK = { sat: 'sat-soru-bankasi', ielts: 'ielts-soru-bankasi', toefl: 'toefl-soru-bankasi', ydt: 'ydt-soru-bankasi', yds: 'yds-soru-bankasi', ib: 'soru-bankasi', udsp: 'udsp-soru-bankasi', genel: 'soru-bankasi' };
  var EXAMS = [['sat', 'Digital SAT'], ['ielts', 'IELTS'], ['toefl', 'TOEFL'], ['ydt', 'YDT'], ['yds', 'YDS / YÖKDİL'], ['ib', 'IB'], ['udsp', 'UDSP'], ['genel', 'Genel İngilizce']];

  // Ana sorular → sonuç (href) ya da alt-akış
  var STEP1 = [
    { label: 'Sınava hazırlanmak', sub: 'Konu çalış veya soru çöz', next: 'exam' },
    { label: 'Yazı yazmak', sub: 'Rubric ile geri bildirim', href: 'yazi-pratigi' },
    { label: 'Kelime tekrar etmek', sub: 'Flashcard ve tekrar', href: 'kelime-bankasi' },
    { label: 'Yanlışları kapatmak', sub: 'Kısa hata avı turu', href: 'gri-hata-avi' },
    { label: 'Öğretmen ödevimi yapmak', sub: 'Sana atanan görevler', href: 'panelim' },
    { label: 'Ne çalışacağımı bilmiyorum', sub: 'Gri bir başlangıç önersin', href: 'gunun-sorusu' }
  ];

  var host = null, prevFocus = null, keyHandler = null;

  function ensureStyle() {
    if (document.getElementById('gri-chooser-css')) return;
    var s = document.createElement('style'); s.id = 'gri-chooser-css';
    s.textContent =
      '.grich-back{position:fixed;inset:0;z-index:9700;background:rgba(20,18,16,.42);display:flex;align-items:center;justify-content:center;padding:16px;opacity:0;transition:opacity .2s}' +
      '.grich-back.in{opacity:1}' +
      '@media(prefers-reduced-motion:reduce){.grich-back{transition:none}}' +
      '.grich{background:var(--bg-card,#FBF6EC);border:1px solid var(--line,#E3D8C3);border-radius:18px;box-shadow:0 24px 60px rgba(20,18,16,.3);max-width:440px;width:100%;padding:1.4rem 1.4rem 1.2rem;font-family:var(--font-ui,Inter,system-ui,sans-serif);max-height:90vh;overflow:auto}' +
      '.grich-top{display:flex;align-items:center;gap:.6rem;margin-bottom:.2rem}' +
      '.grich-top img{width:34px;height:34px;border-radius:50%;object-fit:cover}' +
      '.grich h2{font-family:var(--font-display,Georgia,serif);font-size:1.3rem;margin:0;color:var(--text,#241E17)}' +
      '.grich .sub{font-size:.88rem;color:var(--text-soft,#6E6353);margin:.2rem 0 1rem}' +
      '.grich-opts{display:flex;flex-direction:column;gap:.5rem}' +
      '.grich-opt{display:flex;align-items:center;gap:.7rem;width:100%;text-align:left;font:inherit;background:var(--bg-soft,#F4EFE3);border:1px solid var(--line,#E3D8C3);border-radius:12px;padding:.7rem .9rem;cursor:pointer;color:var(--text,#241E17);transition:border-color .12s,transform .1s,background .12s}' +
      '.grich-opt:hover,.grich-opt:focus-visible{border-color:var(--teal,#2E6E6A);background:var(--teal-soft,rgba(46,110,106,.12));transform:translateX(2px);outline:none}' +
      '.grich-opt b{display:block;font-size:.98rem}.grich-opt span{font-size:.8rem;color:var(--text-soft,#6E6353)}' +
      '.grich-opt .arw{margin-left:auto;color:var(--teal,#2E6E6A);font-weight:700}' +
      '.grich-foot{display:flex;justify-content:space-between;align-items:center;margin-top:1rem}' +
      '.grich-link{background:none;border:none;padding:0;font:inherit;font-size:.82rem;color:var(--text-muted,#8B7F6B);cursor:pointer;text-decoration:underline;text-underline-offset:2px}' +
      '.grich-link:hover{color:var(--teal,#2E6E6A)}';
    document.head.appendChild(s);
  }

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function focusables() { return host ? host.querySelectorAll('button,a,[tabindex]:not([tabindex="-1"])') : []; }

  function renderStep(title, sub, items, backFn) {
    var box = host.querySelector('.grich');
    box.querySelector('h2').textContent = title;
    box.querySelector('.sub').textContent = sub;
    var opts = box.querySelector('.grich-opts');
    opts.innerHTML = '';
    items.forEach(function (it) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'grich-opt';
      b.innerHTML = '<span class="t"><b>' + esc(it.label) + '</b>' + (it.sub ? '<span>' + esc(it.sub) + '</span>' : '') + '</span><span class="arw">→</span>';
      b.addEventListener('click', function () { it.act(); });
      opts.appendChild(b);
    });
    var back = box.querySelector('.grich-back-link');
    back.style.visibility = backFn ? 'visible' : 'hidden';
    back.onclick = backFn || null;
    var first = opts.querySelector('.grich-opt'); if (first) first.focus();
  }

  function step1() {
    renderStep('Bugün ne için geldin?', 'Bir tane seç, sana uygun bir başlangıç açalım.',
      STEP1.map(function (o) {
        return { label: o.label, sub: o.sub, act: function () { if (o.next === 'exam') examStep(); else go(o.href); } };
      }), null);
  }

  function examStep() {
    var p = plan();
    if (p && p.exam) { go(EXAM_BANK[p.exam] || 'soru-bankasi'); return; } // hedef biliniyorsa direkt
    renderStep('Hangi sınav?', 'Seçtiğin sınavın soru bankasını açalım.',
      EXAMS.map(function (e) { return { label: e[1], act: function () { go(EXAM_BANK[e[0]] || 'soru-bankasi'); } }; }), step1);
  }

  function go(href) { if (href) { window.location.href = href; } close(); }

  function close() {
    if (!host) return;
    host.classList.remove('in');
    document.removeEventListener('keydown', keyHandler, true);
    var h = host; host = null;
    window.setTimeout(function () { if (h && h.parentNode) h.parentNode.removeChild(h); }, 200);
    try { if (prevFocus && prevFocus.focus) prevFocus.focus(); } catch (e) {}
  }

  function open() {
    if (host) return;
    ensureStyle();
    prevFocus = document.activeElement;
    host = document.createElement('div');
    host.className = 'grich-back';
    host.setAttribute('role', 'dialog');
    host.setAttribute('aria-modal', 'true');
    host.setAttribute('aria-label', 'Ne çalışayım rehberi');
    host.innerHTML =
      '<div class="grich">' +
        '<div class="grich-top"><img src="assets/gri-cat-happy.png" alt="Gri" width="34" height="34"><h2>—</h2></div>' +
        '<p class="sub">—</p>' +
        '<div class="grich-opts"></div>' +
        '<div class="grich-foot"><button type="button" class="grich-link grich-back-link">‹ Geri</button><button type="button" class="grich-link grich-close">Kapat</button></div>' +
      '</div>';
    document.body.appendChild(host);
    host.querySelector('.grich-close').addEventListener('click', close);
    host.addEventListener('mousedown', function (e) { if (e.target === host) close(); });
    // odak tuzağı + Esc
    keyHandler = function (e) {
      if (e.key === 'Escape') { e.preventDefault(); close(); return; }
      if (e.key === 'Tab') {
        var f = focusables(); if (!f.length) return;
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', keyHandler, true);
    step1();
    requestAnimationFrame(function () { requestAnimationFrame(function () { host.classList.add('in'); }); });
  }

  window.GriChooser = { open: open, close: close };
})();
