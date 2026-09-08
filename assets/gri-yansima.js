/* gri-yansima.js — "Yansıma Kartı" (Faz 7.E)
   Bir çalışma seti bittiğinde, kapatmadan önce isteğe bağlı tek cümlelik bir yansıma
   sunar (metacognition). Baskı yok, atlanabilir. Kaydedilen düşünce bir sonraki
   oturumda panelim'de sakince yeniden görünür — böylece bir süreklilik ipi oluşur.
   Yalnız localStorage (gri-yansima) — sıfır sunucu riski, kişiye özel, cihazda kalır.
   Deneme/mock sırasında çağıran taraf (soru.html) tetiklemez. */
(function () {
  'use strict';
  if (window.GriYansima) return;
  var KEY = 'gri-yansima';
  var MAX = 12;

  function load() { try { var v = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(v) ? v : []; } catch (e) { return []; } }
  function save(list) { try { localStorage.setItem(KEY, JSON.stringify(list.slice(-MAX))); } catch (e) {} }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  var AYLAR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  function trTarih(iso) { var d = new Date(iso); if (isNaN(d)) return ''; return d.getDate() + ' ' + AYLAR[d.getMonth()]; }
  function birazOnce(iso) {
    var d = new Date(iso); if (isNaN(d)) return '';
    var s = (Date.now() - d.getTime()) / 1000;
    if (s < 3600) return 'az önce';
    if (s < 86400) return 'bugün';
    if (s < 172800) return 'dün';
    return trTarih(iso) + '’de';
  }

  function ensureStyle() {
    if (document.getElementById('gri-yn-css')) return;
    var s = document.createElement('style'); s.id = 'gri-yn-css';
    s.textContent =
      '.griyn{margin:1.4rem auto 0;max-width:440px;text-align:left;background:var(--bg-soft,#F4EFE3);border:1px solid var(--line,#E3D8C3);border-left:3px solid var(--gold,#B78A2E);border-radius:12px;padding:.95rem 1.05rem;font-family:var(--font-ui,Inter,system-ui,sans-serif)}' +
      '.griyn-q{font-family:var(--font-display,Georgia,serif);font-size:1rem;color:var(--text,#241E17);margin:0 0 .1rem}' +
      '.griyn-hint{font-size:.8rem;color:var(--text-muted,#8B7F6B);margin:0 0 .6rem}' +
      '.griyn textarea{width:100%;box-sizing:border-box;min-height:64px;resize:vertical;font:inherit;font-size:.92rem;line-height:1.5;color:var(--text,#241E17);background:var(--bg-card,#FBF6EC);border:1px solid var(--line,#E3D8C3);border-radius:9px;padding:.55rem .7rem}' +
      '.griyn textarea:focus{outline:none;border-color:var(--teal,#2E6E6A)}' +
      '.griyn-row{display:flex;align-items:center;gap:.7rem;margin-top:.6rem}' +
      '.griyn-save{font:inherit;font-weight:700;font-size:.88rem;background:var(--teal,#2E6E6A);color:#fff;border:none;border-radius:9px;padding:.5rem 1.1rem;cursor:pointer}.griyn-save:hover{background:var(--teal-deep,#123C39)}.griyn-save:disabled{opacity:.5;cursor:default}' +
      '.griyn-skip{font:inherit;font-size:.82rem;color:var(--text-muted,#8B7F6B);background:none;border:none;cursor:pointer;text-decoration:underline;text-underline-offset:3px}' +
      '.griyn-done{display:flex;align-items:center;gap:.5rem;color:var(--teal,#2E6E6A);font-size:.9rem;font-weight:600}' +
      '.griyn-done svg{width:17px;height:17px;flex:none}' +
      /* panelim süreklilik kartı */
      '.griyn-thread{background:var(--bg-card,#FBF6EC);border:1px solid var(--line,#E3D8C3);border-radius:14px;box-shadow:var(--shadow-sm,0 1px 2px rgba(44,42,38,.05));padding:1rem 1.15rem;font-family:var(--font-ui,Inter,system-ui,sans-serif);display:flex;gap:.85rem;align-items:flex-start}' +
      '.griyn-thread .em{width:30px;height:30px;flex:none;border-radius:8px;background:var(--gold-soft,rgba(183,138,46,.15));display:flex;align-items:center;justify-content:center}' +
      '.griyn-thread .b{min-width:0}' +
      '.griyn-thread .lab{font-size:.72rem;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--gold-deep,#8A6A22);margin:0 0 .15rem}' +
      '.griyn-thread .txt{font-family:var(--font-prose,Georgia,serif);font-size:1rem;line-height:1.5;color:var(--text,#241E17);margin:0}' +
      '.griyn-thread .meta{font-size:.78rem;color:var(--text-muted,#8B7F6B);margin:.3rem 0 0}';
    document.head.appendChild(s);
  }

  var CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';

  // Set-tamamlama ekranına yansıma bloğu ekle
  function offer(detail) {
    var comp = document.querySelector('.q-completion');
    if (!comp || comp.querySelector('.griyn')) return;
    ensureStyle();
    var box = document.createElement('div');
    box.className = 'griyn';
    box.innerHTML =
      '<p class="griyn-q">Kapatmadan önce, bir cümle</p>' +
      '<p class="griyn-hint">Bugün ne netleşti, neye takıldın? (istersen)</p>' +
      '<textarea maxlength="400" aria-label="Bugünün yansıması" placeholder="Örn. Bağlamdan anlam çıkarmada hızlandım; geçişlerde hâlâ zorlanıyorum."></textarea>' +
      '<div class="griyn-row"><button type="button" class="griyn-save" disabled>Not et</button><button type="button" class="griyn-skip">Şimdilik geç</button></div>';
    // stop linkinin önüne koy (birincil aksiyonların altında, sakin)
    var stop = comp.querySelector('.q-completion-stop');
    if (stop) comp.insertBefore(box, stop); else comp.appendChild(box);

    var ta = box.querySelector('textarea');
    var saveBtn = box.querySelector('.griyn-save');
    var skipBtn = box.querySelector('.griyn-skip');
    ta.addEventListener('input', function () { saveBtn.disabled = ta.value.trim().length === 0; });
    saveBtn.addEventListener('click', function () {
      var txt = ta.value.trim(); if (!txt) return;
      var list = load();
      list.push({ d: new Date().toISOString(), text: txt, cat: (detail && detail.category) || null });
      save(list);
      box.innerHTML = '<div class="griyn-done">' + CHECK + '<span>Not edildi — bir sonraki çalışmanda seni burada bekler.</span></div>';
    });
    skipBtn.addEventListener('click', function () { box.remove(); });
  }

  // panelim'de en son yansımayı sakince göster
  function mount(target) {
    var el = typeof target === 'string' ? document.querySelector(target) : target;
    if (!el) return;
    var list = load();
    if (!list.length) { el.hidden = true; return; }
    ensureStyle();
    var last = list[list.length - 1];
    el.hidden = false;
    el.innerHTML =
      '<div class="griyn-thread"><span class="em">🪶</span><div class="b">' +
      '<p class="lab">Geçen çalışmandan</p>' +
      '<p class="txt">“' + esc(last.text) + '”</p>' +
      '<p class="meta">' + esc(birazOnce(last.d)) + ' yazmıştın — bugün oradan devam edebilirsin.</p>' +
      '</div></div>';
  }

  window.GriYansima = { offer: offer, mount: mount };

  // soru.html set-complete olayını dinle (deneme modunda tetiklenmez)
  document.addEventListener('gri:set-complete', function (e) { try { offer(e && e.detail); } catch (err) {} });
})();
