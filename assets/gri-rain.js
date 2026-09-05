/* ============================================================
   GriRain — "Kelime Yağmuru" (Word Rain) vocabulary reflex game
   GriRain.mount(host, { words:[{en, tr}], onReplay, onFinish }) -> {reset}
   Bir İngilizce kelime yukarıdan düşer; altındaki üç Türkçe anlamdan
   doğru olanı, kelime yere değmeden seç. Tanıma + refleks + hız.
   ============================================================ */
(function () {
  if (window.GriRain) return;

  function css() {
    if (document.getElementById('gri-rain-css')) return;
    var s = document.createElement('style'); s.id = 'gri-rain-css';
    s.textContent =
      '.grr{--grr-acc:var(--teal,#2C5856);--grr-gold:var(--gold,#B78A2E);--grr-line:var(--gri-line,var(--line,rgba(0,0,0,.14)));--grr-card:var(--bg-card,#fff);--grr-ink:var(--text,#241c12);--grr-muted:var(--text-muted,#7a7168);font-family:var(--font-ui,Inter),system-ui,sans-serif;color:var(--grr-ink)}' +
      '.grr-top{display:flex;justify-content:space-between;align-items:center;gap:.6rem;font-size:.86rem;color:var(--grr-muted);margin-bottom:.7rem;font-weight:600;flex-wrap:wrap}' +
      '.grr-top b{color:var(--grr-ink);font-variant-numeric:tabular-nums}' +
      '.grr-stat{display:inline-flex;align-items:center;gap:.32rem}' +
      '.grr-lives{letter-spacing:.1em;font-size:1rem}' +
      '.grr-sky{position:relative;height:300px;border:1px solid var(--grr-line);border-radius:16px;overflow:hidden;' +
      'background:linear-gradient(180deg,color-mix(in srgb,var(--grr-acc) 10%,transparent),color-mix(in srgb,var(--grr-acc) 3%,transparent));margin-bottom:.9rem}' +
      '.grr-line-lo{position:absolute;left:0;right:0;bottom:0;height:3px;background:repeating-linear-gradient(90deg,var(--grr-acc) 0 10px,transparent 10px 20px);opacity:.4}' +
      '.grr-drop{position:absolute;top:0;left:50%;transform:translateX(-50%);white-space:nowrap;font-weight:800;font-size:1.5rem;letter-spacing:.01em;' +
      'padding:.5rem 1rem;border-radius:12px;background:var(--grr-card);border:1px solid var(--grr-line);box-shadow:0 4px 16px rgba(0,0,0,.12);color:var(--grr-ink)}' +
      '.grr-drop.pop{animation:grrPop .32s ease-out forwards}' +
      '.grr-drop.fall-anim{animation:grrShake .4s ease-out forwards}' +
      '@keyframes grrPop{0%{transform:translateX(-50%) scale(1)}50%{transform:translateX(-50%) scale(1.18)}100%{transform:translateX(-50%) scale(0);opacity:0}}' +
      '@keyframes grrShake{0%,100%{transform:translateX(-50%)}25%{transform:translate(-58%,0)}75%{transform:translate(-42%,0)}}' +
      '.grr-hint{position:absolute;top:.5rem;left:50%;transform:translateX(-50%);font-size:.68rem;letter-spacing:.14em;text-transform:uppercase;font-weight:800;color:var(--grr-acc);opacity:.55}' +
      '.grr-opts{display:grid;grid-template-columns:1fr;gap:.5rem}' +
      '@media(min-width:520px){.grr-opts{grid-template-columns:1fr 1fr 1fr}}' +
      '.grr-opt{font:inherit;font-size:1rem;font-weight:700;cursor:pointer;border:1px solid var(--grr-line);background:var(--grr-card);color:var(--grr-ink);border-radius:12px;padding:.7rem .8rem;line-height:1.2;transition:transform .1s,box-shadow .12s,background .12s,border-color .12s;text-align:center}' +
      '.grr-opt:hover{transform:translateY(-2px);box-shadow:0 4px 12px rgba(0,0,0,.1);border-color:var(--grr-acc)}' +
      '.grr-opt:active{transform:translateY(0)}' +
      '.grr-opt.ok{background:rgba(47,125,88,.14);border-color:#2f7d58;color:#1f5e3f}' +
      '.grr-opt.no{background:rgba(192,86,62,.12);border-color:#c0563e;color:#8f3a28}' +
      '.grr-opt[disabled]{cursor:default;opacity:.9}' +
      '.grr-pausebar{text-align:center;font-size:.85rem;color:var(--grr-muted);min-height:1.1em;margin-top:.55rem}' +
      '.grr-start,.grr-done{text-align:center;padding:1.4rem 1rem}' +
      '.grr-done .big{font-family:var(--font-display,Georgia),serif;font-size:1.6rem;margin:.2rem 0}' +
      '.grr-done .sc{color:var(--grr-acc);font-weight:800;font-size:2rem;font-variant-numeric:tabular-nums}' +
      '.grr-btn{font:inherit;font-weight:700;cursor:pointer;border-radius:11px;padding:.6rem 1.35rem;border:1px solid var(--grr-acc);background:var(--grr-acc);color:#fff;transition:filter .15s}' +
      '.grr-btn:hover{filter:brightness(1.08)}' +
      '@media(prefers-reduced-motion:reduce){.grr-drop.pop,.grr-drop.fall-anim{animation:none}}';
    document.head.appendChild(s);
  }

  function esc(t){ return String(t==null?'':t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function shuffle(a){ a=a.slice(); for(var i=a.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)); var t=a[i];a[i]=a[j];a[j]=t; } return a; }
  function reduced(){ try{ return window.matchMedia && matchMedia('(prefers-reduced-motion:reduce)').matches; }catch(e){ return false; } }

  function mount(host, opts) {
    css();
    opts = opts || {};
    var all = (opts.words || []).filter(function (w) { return w && w.en && w.tr; });
    // dedupe by en
    var seen = {}, pool = [];
    all.forEach(function (w) { var k = w.en.toLowerCase(); if (!seen[k]) { seen[k] = 1; pool.push({ en: w.en, tr: String(w.tr).split(' / ')[0].split(',')[0].trim() }); } });
    var wrap = document.createElement('div'); wrap.className = 'grr';
    host.innerHTML = ''; host.appendChild(wrap);

    if (pool.length < 4) { wrap.innerHTML = '<p style="text-align:center;color:var(--text-muted)">İçerik bulunamadı.</p>'; return { reset: function(){} }; }

    var score = 0, lives = 3, streak = 0, best = 0, order = [], idx = 0;
    var raf = null, running = false, dropY = 0, speed = 0, drop = null, curWord = null, height = 300;

    function bestKey(){ return 'gri-rain-best'; }
    function loadBest(){ try{ return parseInt(localStorage.getItem(bestKey()),10)||0; }catch(e){ return 0; } }
    function saveBest(n){ try{ localStorage.setItem(bestKey(), n); }catch(e){} }
    var hiScore = loadBest();

    function startScreen() {
      wrap.innerHTML =
        '<div class="grr-start"><div style="font-size:2.4rem">🌧️</div>' +
        '<h3 style="font-family:var(--font-display,Georgia),serif;font-size:1.5rem;margin:.3rem 0">Kelime Yağmuru</h3>' +
        '<p style="color:var(--grr-muted);max-width:30rem;margin:.3rem auto 1.1rem;line-height:1.5">İngilizce kelime yukarıdan düşer. Yere değmeden, altındaki üç Türkçe anlamdan <b>doğru olanı</b> seç. 3 canın var; hız arttıkça puan artar.</p>' +
        (hiScore ? '<p style="color:var(--grr-muted);margin-bottom:1rem">En iyi skor: <b>' + hiScore + '</b></p>' : '') +
        '<button type="button" class="grr-btn" id="grrStart">Başla</button></div>';
      wrap.querySelector('#grrStart').addEventListener('click', begin);
    }

    function begin() {
      score = 0; lives = 3; streak = 0; best = 0; order = shuffle(pool); idx = 0;
      wrap.innerHTML =
        '<div class="grr-top">' +
        '<span class="grr-stat">Skor <b id="grrScore">0</b></span>' +
        '<span class="grr-stat grr-streak">🔥 <b id="grrStreak">0</b></span>' +
        '<span class="grr-stat grr-lives" id="grrLives" aria-label="Can">❤️❤️❤️</span>' +
        '</div>' +
        '<div class="grr-sky" id="grrSky"><span class="grr-hint">düşen kelimeyi eşleştir</span><div class="grr-line-lo"></div></div>' +
        '<div class="grr-opts" id="grrOpts"></div>' +
        '<div class="grr-pausebar" id="grrMsg" aria-live="polite"></div>';
      running = true;
      nextWord();
    }

    function paintHud() {
      wrap.querySelector('#grrScore').textContent = score;
      wrap.querySelector('#grrStreak').textContent = streak;
      var hearts = ''; for (var i = 0; i < 3; i++) hearts += (i < lives ? '❤️' : '🖤');
      wrap.querySelector('#grrLives').textContent = hearts;
    }

    function nextWord() {
      if (!running) return;
      if (idx >= order.length) { order = shuffle(pool); idx = 0; }
      curWord = order[idx++];
      var sky = wrap.querySelector('#grrSky');
      height = sky.clientHeight || 300;
      // build drop
      drop = document.createElement('div'); drop.className = 'grr-drop'; drop.textContent = curWord.en;
      sky.appendChild(drop);
      dropY = 0;
      // fall speed grows with score (px per frame ~ at 60fps)
      speed = 0.9 + Math.min(score, 40) * 0.045; // ~0.9 -> ~2.7 px/frame
      // options: correct + 2 distractors
      var distract = shuffle(pool.filter(function (w) { return w.en !== curWord.en; })).slice(0, 2);
      var choices = shuffle([curWord].concat(distract));
      var optsEl = wrap.querySelector('#grrOpts'); optsEl.innerHTML = '';
      choices.forEach(function (c) {
        var b = document.createElement('button');
        b.type = 'button'; b.className = 'grr-opt'; b.textContent = c.tr;
        b.addEventListener('click', function () { answer(c, b); });
        optsEl.appendChild(b);
      });
      wrap.querySelector('#grrMsg').textContent = '';
      if (reduced()) { staticFall(); } else { paintHud(); raf = requestAnimationFrame(tick); }
    }

    function tick() {
      if (!running || !drop) return;
      dropY += speed;
      var maxY = height - drop.offsetHeight - 4;
      if (dropY >= maxY) { dropY = maxY; miss(); return; }
      drop.style.top = dropY + 'px';
      raf = requestAnimationFrame(tick);
    }

    // reduced-motion fallback: static word + countdown message, longer window
    var redTimer = null;
    function staticFall() {
      paintHud();
      drop.style.top = (height / 2 - 20) + 'px';
      var left = Math.max(3, 6 - Math.min(score, 30) * 0.08);
      var msg = wrap.querySelector('#grrMsg');
      redTimer = setInterval(function () {
        left -= 1;
        msg.textContent = 'Kalan süre: ' + left + ' sn';
        if (left <= 0) { clearInterval(redTimer); miss(); }
      }, 1000);
    }

    function clearFall() {
      if (raf) { cancelAnimationFrame(raf); raf = null; }
      if (redTimer) { clearInterval(redTimer); redTimer = null; }
    }

    function lockOpts(correctTr, chosenBtn, chosenCorrect) {
      var btns = wrap.querySelectorAll('.grr-opt');
      [].forEach.call(btns, function (b) {
        b.disabled = true;
        if (b.textContent === correctTr) b.classList.add('ok');
      });
      if (chosenBtn && !chosenCorrect) chosenBtn.classList.add('no');
    }

    function answer(choice, btn) {
      if (!running || !drop) return;
      clearFall();
      var correct = (choice.en === curWord.en);
      if (correct) {
        score++; streak++; best = Math.max(best, streak);
        drop.classList.add('pop');
        lockOpts(curWord.tr, btn, true);
        if (window.GriFX && GriFX.sound) GriFX.sound('correct');
        paintHud();
        setTimeout(cleanupAndNext, 340);
      } else {
        streak = 0; lives--;
        lockOpts(curWord.tr, btn, false);
        if (window.GriFX && GriFX.sound) GriFX.sound('wrong');
        wrap.querySelector('#grrMsg').textContent = '“' + curWord.en + '” = ' + curWord.tr;
        paintHud();
        if (lives <= 0) { setTimeout(finish, 900); }
        else { setTimeout(cleanupAndNext, 900); }
      }
    }

    function miss() {
      if (!running || !drop) return;
      clearFall();
      streak = 0; lives--;
      drop.classList.add('fall-anim');
      lockOpts(curWord.tr, null, false);
      if (window.GriFX && GriFX.sound) GriFX.sound('wrong');
      wrap.querySelector('#grrMsg').textContent = 'Kaçtı! “' + curWord.en + '” = ' + curWord.tr;
      paintHud();
      if (lives <= 0) { setTimeout(finish, 900); }
      else { setTimeout(cleanupAndNext, 900); }
    }

    function cleanupAndNext() {
      if (drop && drop.parentNode) drop.parentNode.removeChild(drop);
      drop = null;
      if (running) nextWord();
    }

    function finish() {
      running = false; clearFall();
      if (drop && drop.parentNode) drop.parentNode.removeChild(drop);
      if (score > hiScore) { hiScore = score; saveBest(hiScore); }
      wrap.innerHTML =
        '<div class="grr-done"><div style="font-size:2.2rem">🌧️</div>' +
        '<div class="big">Oyun bitti</div>' +
        '<div class="sc">' + score + '</div>' +
        '<p style="color:var(--grr-muted);margin:.4rem 0 1.1rem">En uzun seri: ' + best + ' · En iyi skor: ' + hiScore + '</p>' +
        '<button type="button" class="grr-btn" id="grrAgain">Tekrar Oyna</button></div>';
      wrap.querySelector('#grrAgain').addEventListener('click', function () {
        if (opts.onReplay) opts.onReplay(); else begin();
      });
      if (window.GriConfetti && score >= 10) GriConfetti.burst();
      if (opts.onFinish) opts.onFinish({ score: score, best: best });
    }

    startScreen();
    return { reset: function () { running = false; clearFall(); startScreen(); } };
  }

  window.GriRain = { mount: mount };
})();
