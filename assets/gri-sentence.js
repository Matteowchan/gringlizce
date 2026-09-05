/* ============================================================
   GriSentence — "Cümle Kur" (Sentence Builder) grammar game
   GriSentence.mount(host, { sentences:[{tr, tokens:[..], hint?}], onReplay, onFinish }) -> {reset}
   Kelimeleri doğru sıraya diz; söz dizimi / gramer odaklı.
   ============================================================ */
(function () {
  if (window.GriSentence) return;

  function css() {
    if (document.getElementById('gri-sentence-css')) return;
    var s = document.createElement('style'); s.id = 'gri-sentence-css';
    s.textContent =
      '.gsc{--gsc-acc:var(--teal,#2C5856);--gsc-line:var(--gri-line,var(--line,rgba(0,0,0,.14)));--gsc-card:var(--bg-card,#fff);--gsc-ink:var(--text,#241c12);--gsc-muted:var(--text-muted,#7a7168);font-family:var(--font-ui,Inter),system-ui,sans-serif;color:var(--gsc-ink)}' +
      '.gsc-top{display:flex;justify-content:space-between;align-items:center;font-size:.86rem;color:var(--gsc-muted);margin-bottom:.7rem;font-weight:600}' +
      '.gsc-top b{color:var(--gsc-ink);font-variant-numeric:tabular-nums}' +
      '.gsc-streak{display:inline-flex;align-items:center;gap:.3rem}' +
      '.gsc-prompt{background:color-mix(in srgb,var(--gsc-acc) 8%,transparent);border:1px solid var(--gsc-line);border-radius:14px;padding:.85rem 1rem;margin-bottom:.9rem}' +
      '.gsc-prompt .lbl{font-size:.66rem;letter-spacing:.12em;text-transform:uppercase;font-weight:800;color:var(--gsc-acc)}' +
      '.gsc-prompt .tr{font-size:1.12rem;line-height:1.4;margin-top:.15rem;font-weight:600}' +
      '.gsc-answer{min-height:58px;display:flex;flex-wrap:wrap;gap:.4rem;align-content:flex-start;border:2px dashed var(--gsc-line);border-radius:14px;padding:.6rem;margin-bottom:.5rem;transition:border-color .2s,background .2s}' +
      '.gsc-answer.ok{border-color:#2f7d58;border-style:solid;background:rgba(47,125,88,.08)}' +
      '.gsc-answer.no{border-color:#c0563e;border-style:solid;background:rgba(192,86,62,.07);animation:gscShake .34s}' +
      '@keyframes gscShake{0%,100%{transform:translateX(0)}20%{transform:translateX(-6px)}40%{transform:translateX(6px)}60%{transform:translateX(-4px)}80%{transform:translateX(4px)}}' +
      '.gsc-answer:empty::before{content:"Kelimeleri buraya diz…";color:var(--gsc-muted);font-size:.9rem;opacity:.75;align-self:center;padding:.3rem .4rem}' +
      '.gsc-bank{display:flex;flex-wrap:wrap;gap:.45rem;justify-content:center;margin-bottom:1rem;min-height:44px}' +
      '.gsc-w{font:inherit;font-size:1rem;font-weight:600;cursor:pointer;border:1px solid var(--gsc-line);background:var(--gsc-card);color:var(--gsc-ink);border-radius:11px;padding:.5rem .85rem;line-height:1.1;transition:transform .12s,box-shadow .12s,opacity .12s;box-shadow:0 1px 2px rgba(0,0,0,.05)}' +
      '.gsc-w:hover{transform:translateY(-2px);box-shadow:0 4px 12px rgba(0,0,0,.12);border-color:var(--gsc-acc)}' +
      '.gsc-w:active{transform:translateY(0)}' +
      '.gsc-w.in-answer{background:var(--gsc-acc);color:#fff;border-color:var(--gsc-acc)}' +
      '.gsc-w.used{opacity:0;pointer-events:none;width:0;padding:0;margin:0;border:0}' +
      '.gsc-w.wrong{background:rgba(192,86,62,.14);border-color:#c0563e}' +
      '.gsc-actions{display:flex;gap:.5rem;justify-content:center;flex-wrap:wrap}' +
      '.gsc-btn{font:inherit;font-weight:700;cursor:pointer;border-radius:11px;padding:.6rem 1.3rem;border:1px solid var(--gsc-acc);background:var(--gsc-acc);color:#fff;transition:filter .15s}' +
      '.gsc-btn:hover{filter:brightness(1.08)}.gsc-btn[disabled]{opacity:.45;cursor:default;filter:none}' +
      '.gsc-btn.ghost{background:transparent;color:var(--gsc-acc)}' +
      '.gsc-hintline{text-align:center;font-size:.85rem;color:var(--gsc-muted);min-height:1.2em;margin-top:.6rem}' +
      '.gsc-done{text-align:center;padding:1.6rem 1rem}' +
      '.gsc-done .big{font-family:var(--font-display,Georgia),serif;font-size:1.7rem;margin:.2rem 0}' +
      '.gsc-done .sc{color:var(--gsc-acc);font-weight:800;font-size:2rem;font-variant-numeric:tabular-nums}' +
      '@media(prefers-reduced-motion:reduce){.gsc-answer.no{animation:none}.gsc-w{transition:none}}';
    document.head.appendChild(s);
  }

  function esc(t){ return String(t==null?'':t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function shuffle(a){ a=a.slice(); for(var i=a.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)); var t=a[i];a[i]=a[j];a[j]=t; } return a; }

  function mount(host, opts) {
    css();
    opts = opts || {};
    var all = (opts.sentences || []).filter(function(s){ return s && s.tokens && s.tokens.length >= 2; });
    var round = shuffle(all).slice(0, opts.count || 6);
    if (!round.length) { host.textContent = 'İçerik bulunamadı.'; return { reset: function(){} }; }

    var i = 0, correct = 0, streak = 0, best = 0, tries = 0;
    var wrap = document.createElement('div'); wrap.className = 'gsc';
    host.innerHTML = ''; host.appendChild(wrap);

    function render() {
      var s = round[i];
      // ensure shuffled order differs from correct
      var order = shuffle(s.tokens); var guard = 0;
      while (order.join('') === s.tokens.join('') && guard++ < 8) order = shuffle(s.tokens);
      tries = 0;
      wrap.innerHTML =
        '<div class="gsc-top"><span>Cümle <b>' + (i + 1) + '</b>/' + round.length + '</span>' +
        '<span class="gsc-streak">🔥 <b>' + streak + '</b></span></div>' +
        '<div class="gsc-prompt"><span class="lbl">Türkçe</span><div class="tr">' + esc(s.tr) + '</div></div>' +
        '<div class="gsc-answer" id="gscAns" aria-label="Kurduğun cümle"></div>' +
        '<div class="gsc-bank" id="gscBank"></div>' +
        '<div class="gsc-actions">' +
        '<button type="button" class="gsc-btn ghost" id="gscHint">İpucu</button>' +
        '<button type="button" class="gsc-btn" id="gscCheck" disabled>Kontrol Et</button></div>' +
        '<div class="gsc-hintline" id="gscHintLine" aria-live="polite"></div>';
      var bank = wrap.querySelector('#gscBank');
      var ans = wrap.querySelector('#gscAns');
      var check = wrap.querySelector('#gscCheck');
      var hintBtn = wrap.querySelector('#gscHint');
      var hintLine = wrap.querySelector('#gscHintLine');

      order.forEach(function (tok, k) {
        var b = document.createElement('button');
        b.type = 'button'; b.className = 'gsc-w'; b.textContent = tok; b.setAttribute('data-k', k);
        b.addEventListener('click', function () {
          if (b.classList.contains('in-answer')) { // remove from answer
            b.classList.remove('in-answer', 'wrong'); bank.appendChild(b);
          } else { // move to answer
            b.classList.remove('wrong'); b.classList.add('in-answer'); ans.appendChild(b);
          }
          ans.classList.remove('ok', 'no');
          check.disabled = (ans.children.length !== s.tokens.length);
        });
        bank.appendChild(b);
      });

      hintBtn.addEventListener('click', function () {
        hintLine.textContent = s.hint ? s.hint : ('İlk kelime: “' + s.tokens[0] + '”');
      });

      check.addEventListener('click', function () {
        var got = [].map.call(ans.children, function (el) { return el.textContent; });
        if (got.join('') === s.tokens.join('')) {
          ans.classList.add('ok'); check.disabled = true;
          correct++; streak++; best = Math.max(best, streak);
          hintLine.textContent = '✓ Doğru!';
          if (window.GriFX && GriFX.sound) GriFX.sound('correct');
          setTimeout(next, 780);
        } else {
          ans.classList.remove('no'); void ans.offsetWidth; ans.classList.add('no');
          streak = 0; tries++;
          // mark first wrong position
          [].forEach.call(ans.children, function (el, idx) {
            el.classList.toggle('wrong', el.textContent !== s.tokens[idx]);
          });
          if (window.GriFX && GriFX.sound) GriFX.sound('wrong');
          if (tries >= 2) { hintLine.textContent = 'Doğrusu: ' + s.tokens.join(' '); }
          else { hintLine.textContent = 'Sıra tam değil — tekrar dene.'; }
        }
      });
    }

    function next() {
      i++;
      if (i < round.length) { render(); }
      else { finish(); }
    }

    function finish() {
      var acc = Math.round((correct / round.length) * 100);
      wrap.innerHTML =
        '<div class="gsc-done"><div style="font-size:2.2rem">🧱</div>' +
        '<div class="big">Tebrikler!</div>' +
        '<div class="sc">' + correct + '/' + round.length + '</div>' +
        '<p style="color:var(--gsc-muted);margin:.4rem 0 1.1rem">En uzun seri: ' + best + ' · Doğruluk: ' + acc + '%</p>' +
        '<button type="button" class="gsc-btn" id="gscAgain">Yeni Cümleler</button></div>';
      wrap.querySelector('#gscAgain').addEventListener('click', function () {
        if (opts.onReplay) opts.onReplay(); else { round = shuffle(all).slice(0, opts.count || 6); i = 0; correct = 0; streak = 0; best = 0; render(); }
      });
      if (window.GriConfetti && acc >= 60) GriConfetti.burst();
      if (opts.onFinish) opts.onFinish({ acc: acc, correct: correct, total: round.length });
    }

    render();
    return { reset: function () { i = 0; correct = 0; streak = 0; best = 0; round = shuffle(all).slice(0, opts.count || 6); render(); } };
  }

  window.GriSentence = { mount: mount };
})();
