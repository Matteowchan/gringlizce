/* gri-pekistir.js — "İki soruyla pekiştir" (Faz 7.B)
   Bir soruyu yanlış yapan öğrenciye, aynı KONUDAN (subcategory) 2 kısa soruyla
   aynı mantığı pekiştirme fırsatı sunar. Erişilebilir modal mini-quiz;
   toparlanmayı (recovery) ölçer. Sadece serbest çalışma alanında (deneme/mock
   sırasında çağrılmaz — bunu çağıran sayfa denetler).
   Kaynak: questions tablosu (RLS: public read). Kimseyi giriş yapmaz. */
(function () {
  'use strict';
  if (window.GriPekistir) return;
  var SB_URL = 'https://vazbvbqgvtlaqkytfsbi.supabase.co';
  var SB_KEY = 'sb_publishable_F5K-wIVQHXlD4e4GYnySNw_Xm4teO9g';

  function client() {
    if (window.GRI_SB) return window.GRI_SB;
    if (window.griTrackSB) return window.griTrackSB;
    if (window.GriAuth && window.GriAuth.supabase) return window.GriAuth.supabase;
    try { if (window.supabase && window.supabase.createClient) { window.griTrackSB = window.supabase.createClient(SB_URL, SB_KEY); return window.griTrackSB; } } catch (e) {}
    return null;
  }

  function firstBody(node) {
    if (node && node.steps && node.steps.length) {
      return node.steps.map(function (s) { return s.body; }).filter(Boolean).slice(0, 2).join(' ');
    }
    return '';
  }
  function shortExp(ex, correctLetter) {
    if (!ex || typeof ex !== 'object') return '';
    var t = firstBody(ex.answer) || firstBody(ex.correct) || (correctLetter && firstBody(ex[correctLetter])) || '';
    if (!t) { for (var k in ex) { if (Object.prototype.hasOwnProperty.call(ex, k)) { t = firstBody(ex[k]); if (t) break; } } }
    return String(t || '').replace(/<script[\s\S]*?<\/script>/gi, '');
  }
  function usable(q) {
    return q && q.question_text && Array.isArray(q.options) && q.options.length >= 2 &&
      q.options.every(function (o) { return o && o.letter && o.text; }) && q.correct_answer;
  }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  var host = null, prevFocus = null, keyHandler = null, state = null;

  function ensureStyle() {
    if (document.getElementById('gri-pk-css')) return;
    var s = document.createElement('style'); s.id = 'gri-pk-css';
    s.textContent =
      '.gripk-back{position:fixed;inset:0;z-index:9750;background:rgba(20,18,16,.42);display:flex;align-items:center;justify-content:center;padding:16px;opacity:0;transition:opacity .2s}' +
      '.gripk-back.in{opacity:1}@media(prefers-reduced-motion:reduce){.gripk-back{transition:none}}' +
      '.gripk{background:var(--bg-card,#FBF6EC);border:1px solid var(--line,#E3D8C3);border-radius:18px;box-shadow:0 24px 60px rgba(20,18,16,.3);max-width:520px;width:100%;padding:1.3rem 1.4rem 1.2rem;font-family:var(--font-ui,Inter,system-ui,sans-serif);max-height:92vh;overflow:auto}' +
      '.gripk-top{display:flex;align-items:center;justify-content:space-between;gap:.6rem;margin-bottom:.5rem}' +
      '.gripk-eyebrow{font-size:.7rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--gold,#B78A2E)}' +
      '.gripk-count{font-size:.8rem;color:var(--text-soft,#6E6353);font-weight:600}' +
      '.gripk-x{background:none;border:none;font-size:22px;line-height:1;color:var(--text-muted,#8B7F6B);cursor:pointer;border-radius:8px;width:30px;height:30px}' +
      '.gripk-x:hover{background:var(--teal-soft,rgba(46,110,106,.12));color:var(--text)}' +
      '.gripk-q{font-family:var(--font-prose,Georgia,serif);font-size:1.12rem;line-height:1.5;color:var(--text,#241E17);margin:.3rem 0 .9rem}' +
      '.gripk-opts{display:flex;flex-direction:column;gap:.45rem}' +
      '.gripk-opt{display:flex;align-items:center;gap:.6rem;width:100%;text-align:left;font:inherit;font-size:.98rem;color:var(--text);background:var(--bg-soft,#F4EFE3);border:1px solid var(--line,#E3D8C3);border-radius:10px;padding:.6rem .8rem;cursor:pointer;transition:border-color .12s,background .12s}' +
      '.gripk-opt:hover:not(:disabled){border-color:var(--teal,#2E6E6A)}.gripk-opt:disabled{cursor:default}' +
      '.gripk-opt .k{font-weight:700;font-size:.78rem;width:1.4rem;height:1.4rem;flex:none;display:flex;align-items:center;justify-content:center;border-radius:50%;background:var(--teal-soft,rgba(46,110,106,.12));color:var(--teal-deep,#123C39)}' +
      '.gripk-opt.correct{border-color:var(--correct,#2C6E49);background:var(--correct-soft,rgba(44,110,73,.12))}.gripk-opt.correct .k{background:var(--correct,#2C6E49);color:#fff}' +
      '.gripk-opt.wrong{border-color:var(--incorrect,#B0342C);background:var(--incorrect-soft,rgba(176,52,44,.1))}.gripk-opt.wrong .k{background:var(--incorrect,#B0342C);color:#fff}' +
      '.gripk-opt .mk{margin-left:auto;font-weight:800}.gripk-opt.correct .mk{color:var(--correct,#2C6E49)}.gripk-opt.wrong .mk{color:var(--incorrect,#B0342C)}' +
      '.gripk-exp{margin-top:.9rem;background:var(--bg-soft,#F4EFE3);border:1px solid var(--line,#E3D8C3);border-left:3px solid var(--teal,#2E6E6A);border-radius:10px;padding:.8rem .9rem;font-size:.9rem;line-height:1.55;color:var(--text-soft,#6E6353)}' +
      '.gripk-exp b,.gripk-exp strong{color:var(--text)}' +
      '.gripk-foot{display:flex;justify-content:flex-end;margin-top:1rem}' +
      '.gripk-btn{font:inherit;font-weight:700;font-size:.95rem;background:var(--teal,#2E6E6A);color:#fff;border:none;border-radius:10px;padding:.6rem 1.3rem;cursor:pointer}.gripk-btn:hover{background:var(--teal-deep,#123C39)}' +
      '.gripk-recap{text-align:center}.gripk-recap img{width:56px;height:56px;border-radius:50%;object-fit:cover;margin:0 auto .3rem;display:block}' +
      '.gripk-recap h3{font-family:var(--font-display,Georgia,serif);font-size:1.3rem;margin:.2rem 0 .2rem;color:var(--text)}' +
      '.gripk-recap p{color:var(--text-soft,#6E6353);font-size:.92rem;margin:0 0 1rem}' +
      '.gripk-recap .acts{display:flex;gap:.5rem;justify-content:center;flex-wrap:wrap}' +
      '.gripk-recap a,.gripk-recap button{font:inherit;font-weight:700;font-size:.9rem;text-decoration:none;border-radius:10px;padding:.55rem 1.1rem;cursor:pointer;border:1px solid transparent}' +
      '.gripk-recap .p{background:var(--teal,#2E6E6A);color:#fff}.gripk-recap .g{background:transparent;color:var(--teal,#2E6E6A);border-color:var(--line-strong,#C9BCA0)}' +
      '.gripk-empty{text-align:center;color:var(--text-soft);font-size:.95rem;padding:1rem 0}';
    document.head.appendChild(s);
  }

  function focusables() { return host ? host.querySelectorAll('button,a,[tabindex]:not([tabindex="-1"])') : []; }

  function open() {
    if (host) return;
    ensureStyle();
    prevFocus = document.activeElement;
    host = document.createElement('div');
    host.className = 'gripk-back'; host.setAttribute('role', 'dialog'); host.setAttribute('aria-modal', 'true'); host.setAttribute('aria-label', 'İki soruyla pekiştir');
    host.innerHTML = '<div class="gripk"><div class="gripk-top"><span class="gripk-eyebrow">Pekiştir</span><span class="gripk-count" id="gripkCount"></span><button type="button" class="gripk-x" aria-label="Kapat">&times;</button></div><div id="gripkBody"><div class="gripk-empty">Sorular hazırlanıyor…</div></div></div>';
    document.body.appendChild(host);
    host.querySelector('.gripk-x').addEventListener('click', close);
    host.addEventListener('mousedown', function (e) { if (e.target === host) close(); });
    keyHandler = function (e) {
      if (e.key === 'Escape') { e.preventDefault(); close(); return; }
      if (e.key === 'Tab') { var f = focusables(); if (!f.length) return; var a = f[0], b = f[f.length - 1]; if (e.shiftKey && document.activeElement === a) { e.preventDefault(); b.focus(); } else if (!e.shiftKey && document.activeElement === b) { e.preventDefault(); a.focus(); } }
    };
    document.addEventListener('keydown', keyHandler, true);
    requestAnimationFrame(function () { requestAnimationFrame(function () { host.classList.add('in'); }); });
  }
  function close() {
    if (!host) return;
    host.classList.remove('in');
    document.removeEventListener('keydown', keyHandler, true);
    var h = host; host = null; state = null;
    window.setTimeout(function () { if (h && h.parentNode) h.parentNode.removeChild(h); }, 200);
    try { if (prevFocus && prevFocus.focus) prevFocus.focus(); } catch (e) {}
  }

  function renderEmpty(msg) {
    var b = host && host.querySelector('#gripkBody'); if (!b) return;
    b.innerHTML = '<div class="gripk-empty">' + esc(msg || 'Bu konuda pekiştirme sorusu bulunamadı.') + '</div><div class="gripk-foot"><button type="button" class="gripk-btn" id="gripkClose2">Kapat</button></div>';
    var c = b.querySelector('#gripkClose2'); if (c) { c.addEventListener('click', close); c.focus(); }
  }

  function renderQuestion() {
    var b = host && host.querySelector('#gripkBody'); if (!b) return;
    var q = state.items[state.i];
    host.querySelector('#gripkCount').textContent = 'Soru ' + (state.i + 1) + ' / ' + state.items.length;
    var order = q.options.slice().sort(function (a, c) { return a.letter < c.letter ? -1 : 1; });
    var opts = order.map(function (o, k) {
      return '<button type="button" class="gripk-opt" data-letter="' + esc(o.letter) + '"><span class="k">' + String.fromCharCode(65 + k) + '</span><span class="tx">' + esc(o.text) + '</span></button>';
    }).join('');
    b.innerHTML = '<p class="gripk-q" lang="en">' + esc(q.question_text) + '</p><div class="gripk-opts">' + opts + '</div><div id="gripkAfter"></div>';
    [].forEach.call(b.querySelectorAll('.gripk-opt'), function (btn) { btn.addEventListener('click', function () { answer(btn, q); }); });
    var first = b.querySelector('.gripk-opt'); if (first) first.focus();
  }

  function answer(btn, q) {
    if (state.answered) return; state.answered = true;
    var chosen = btn.getAttribute('data-letter');
    var correct = chosen === q.correct_answer;
    [].forEach.call(host.querySelectorAll('.gripk-opt'), function (o) {
      o.disabled = true;
      var L = o.getAttribute('data-letter');
      if (L === q.correct_answer) { o.classList.add('correct'); o.insertAdjacentHTML('beforeend', '<span class="mk">✓</span>'); }
    });
    if (correct) state.recovered++;
    else { btn.classList.add('wrong'); btn.insertAdjacentHTML('beforeend', '<span class="mk">✕</span>'); }
    var exp = shortExp(q.explanations, q.correct_answer);
    var after = host.querySelector('#gripkAfter');
    after.innerHTML = (exp ? '<div class="gripk-exp">' + exp + '</div>' : '') +
      '<div class="gripk-foot"><button type="button" class="gripk-btn" id="gripkNext">' + (state.i + 1 >= state.items.length ? 'Bitir' : 'Sonraki →') + '</button></div>';
    var nb = host.querySelector('#gripkNext');
    nb.addEventListener('click', function () {
      state.i++; state.answered = false;
      if (state.i >= state.items.length) recap(); else renderQuestion();
    });
    nb.focus();
  }

  function recap() {
    var b = host && host.querySelector('#gripkBody'); if (!b) return;
    host.querySelector('#gripkCount').textContent = '';
    var r = state.recovered, n = state.items.length;
    var msg = r === n ? 'Toparladın — mantık oturdu.' : r > 0 ? 'Bir adım ilerledin. Bu konuya biraz daha bakmak iyi gelir.' : 'Sorun değil; asıl öğrenme burada. Konuyu kısa bir tekrarla pekiştir.';
    b.innerHTML = '<div class="gripk-recap"><img src="assets/gri-cat-happy.png" alt="Gri"><h3>' + r + ' / ' + n + '</h3><p>' + esc(msg) + '</p><div class="acts">' +
      (state.topic ? '<a class="p" href="' + esc(state.topic) + '">Konuyu çalış</a>' : '') +
      '<button type="button" class="g" id="gripkDone">Kapat</button></div></div>';
    var d = b.querySelector('#gripkDone'); if (d) { d.addEventListener('click', close); d.focus(); }
  }

  // Ana giriş: bir slug'ın konusundan (subcategory) 2 pekiştirme sorusu aç
  function forSlug(slug) {
    open();
    var c = client();
    if (!c || !slug) { renderEmpty(); return; }
    (async function () {
      try {
        var cur = await c.from('questions').select('subcategory,category').eq('slug', slug).maybeSingle();
        var sub = cur && cur.data ? (cur.data.subcategory || cur.data.category) : null;
        if (!sub) { renderEmpty(); return; }
        var res = await c.from('questions')
          .select('slug,question_text,options,correct_answer,explanations')
          .eq('subcategory', sub).eq('active', true).eq('premium_locked', false).neq('slug', slug).limit(16);
        var pool = (res && res.data ? res.data : []).filter(usable);
        if (!pool.length) { renderEmpty('Bu konuda uygun pekiştirme sorusu yok — konuyu çalışmayı deneyebilirsin.'); return; }
        state = { items: shuffle(pool).slice(0, 2), i: 0, answered: false, recovered: 0, topic: 'soru-bankasi' };
        renderQuestion();
      } catch (e) { renderEmpty(); }
    })();
  }

  window.GriPekistir = { forSlug: forSlug, close: close };
})();
