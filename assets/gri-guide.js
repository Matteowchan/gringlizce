/* Gri Guide — hub tanıtım reel'i (paylaşılan modül)
   Kullanım:
     GriGuide.mount({ container, eyebrow, title, subtitle, slides, dismissible, storageKey });
   slides: [{ tag, title, desc, cta, href, scene }]  (scene = HTML string)
   Sahne yardımcıları:
     GriGuide.win(url, innerHTML)   — tarayıcı penceresi çerçevesi
     GriGuide.sub(text)             — koyu altyazı çipi
     GriGuide.cat('happy'|'curious')— Gri kedi maskotu
   Sahne içi hazır sınıflar (animasyonlu): .qo/.qo-a/.qo-b/.qo-c/.qck/.qexp (soru),
     .dk/.dk-num/.dk-lbl/.dk-bar>span/.dk-streak (istatistik), .lv/.lvh/.lv-tag (seviye),
     .vg/.spk/.vg-cap (video grid), .fcard/.fc-in/.fc-f/.fc-b/.fc-hint (flashcard),
     .ai-row.before/.ai-row.after/.ai-badge (önce-sonra).
   assets/ göreli yol maskot için: sayfa kökten servis edilmeli (site öyle).
*/
(function () {
  if (window.GriGuide) return;

  var CSS = ''
    + '.gg{padding:4.2rem 0;background:linear-gradient(180deg,var(--bg,#f7f1e6),color-mix(in srgb,var(--teal,#2E6E6A) 5%,var(--bg,#f7f1e6)));}'
    + '.gg[hidden]{display:none;}'
    + '.gg .gg-wrap{max-width:1120px;margin:0 auto;padding:0 1.4rem;}'
    + '.gg-head{display:flex;align-items:flex-start;justify-content:center;gap:1rem;text-align:center;margin-bottom:1.8rem;position:relative;}'
    + '.gg.gg-dismissible .gg-head{text-align:left;justify-content:space-between;}'
    + '.gg-eyebrow{font-family:var(--font-ui,Inter),sans-serif;font-size:.72rem;letter-spacing:.16em;text-transform:uppercase;color:var(--gold,#B78A2E);font-weight:700;}'
    + '.gg-head h2{font-family:var(--font-display,Georgia),serif;font-size:clamp(1.5rem,3.4vw,2.3rem);margin:.3rem 0 .35rem;color:var(--text,#241c12);}'
    + '.gg-head p{font-family:var(--font-ui,Inter),sans-serif;color:var(--text-muted,#6b6250);font-size:.98rem;margin:0;}'
    + '.gg-close{flex:0 0 auto;width:34px;height:34px;border-radius:50%;border:1px solid var(--line,#e3d8c3);background:var(--bg-card,#fff);color:var(--text-muted,#6b6250);font-size:1.3rem;line-height:1;cursor:pointer;}'
    + '.gg-close:hover{color:var(--text,#241c12);}'
    + '.gg-reopen{display:inline-flex;align-items:center;gap:.4rem;margin:1.2rem auto 0;font-family:var(--font-ui,Inter),sans-serif;font-weight:700;font-size:.85rem;color:var(--teal,#2E6E6A);background:var(--teal-soft,rgba(46,110,106,.12));border:1px solid var(--line,#e3d8c3);border-radius:99px;padding:.55rem 1.2rem;cursor:pointer;}'
    + '.gg-reopen[hidden]{display:none;}'
    + '.gg-reel{position:relative;}'
    + '.gg-viewport{position:relative;overflow:hidden;border-radius:24px;border:1px solid var(--line,#e3d8c3);box-shadow:0 24px 60px rgba(40,30,15,.14),0 2px 8px rgba(40,30,15,.06);background:var(--bg-card,#fff);}'
    + '.gg-viewport::before{content:"";position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,var(--teal,#2E6E6A),var(--gold,#B78A2E));z-index:5;}'
    + '.gg-track{display:flex;transition:transform .55s cubic-bezier(.4,0,.15,1);}'
    + '.gg-slide{flex:0 0 100%;display:grid;grid-template-columns:1.12fr .88fr;min-height:400px;}'
    + '.gg-scene{position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center;padding:2.4rem 2rem 3.4rem;background:radial-gradient(100% 82% at 50% -8%,#fff,transparent 55%),linear-gradient(165deg,#FBF6EC,#EEE3CE);}'
    + '.gg-scene::after{content:"";position:absolute;width:340px;height:340px;border-radius:50%;background:radial-gradient(circle,rgba(46,110,106,.13),transparent 70%);top:-120px;right:-90px;pointer-events:none;}'
    + '.gg-win{position:relative;z-index:2;width:100%;max-width:340px;background:#fff;border-radius:14px;border:1px solid #e6dcc6;box-shadow:0 24px 46px rgba(40,30,15,.2),0 3px 10px rgba(40,30,15,.08);overflow:hidden;animation:ggFloat 6s ease-in-out infinite;}'
    + '.gg-bar{display:flex;align-items:center;gap:6px;padding:9px 12px;background:#F4EEE1;border-bottom:1px solid #ece2cf;}'
    + '.gg-bar i{width:9px;height:9px;border-radius:50%;background:#d9cdb4;}'
    + '.gg-bar i:nth-child(1){background:#e69289;}.gg-bar i:nth-child(2){background:#e6c982;}.gg-bar i:nth-child(3){background:#95cba4;}'
    + '.gg-url{flex:1;margin-left:7px;background:#fff;border:1px solid #e6dcc6;border-radius:7px;padding:3px 9px;font:600 10px/1.4 var(--font-ui,Inter),sans-serif;color:#9a8e7b;font-style:normal;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}'
    + '.gg-app{padding:14px 15px 15px;position:relative;min-height:158px;}'
    + '.gg .qh{font:700 9px/1 var(--font-ui,Inter),sans-serif;letter-spacing:.08em;text-transform:uppercase;color:var(--teal,#2E6E6A);margin-bottom:9px;}'
    + '.gg .qs{font:600 12.5px/1.42 var(--font-ui,Inter),sans-serif;color:#241E17;margin-bottom:11px;}'
    + '.gg .qo{position:relative;font:500 12px/1.2 var(--font-ui,Inter),sans-serif;color:#3a3020;border:1.5px solid #e6dcc6;border-radius:9px;padding:8px 11px;margin-bottom:7px;background:#FBF7F0;}'
    + '.gg .qck{position:absolute;right:10px;top:50%;transform:translateY(-50%) scale(0);width:17px;height:17px;border-radius:50%;background:#1FA971;color:#fff;font-size:10px;display:flex;align-items:center;justify-content:center;-webkit-text-fill-color:#fff;}'
    + '.gg .qo-a,.gg .qo-c{animation:ggDim 7s ease-in-out infinite;}'
    + '.gg .qo-b{animation:ggPick 7s ease-in-out infinite;}'
    + '.gg .qo-b .qck{animation:ggCheck 7s ease-in-out infinite;}'
    + '.gg .qexp{position:absolute;left:15px;right:15px;bottom:13px;background:var(--teal,#2E6E6A);color:#fff;border-radius:10px;padding:9px 11px;font:500 10.5px/1.4 var(--font-ui,Inter),sans-serif;box-shadow:0 10px 20px rgba(18,60,57,.28);opacity:0;transform:translateY(16px);animation:ggExp 7s ease-in-out infinite;}'
    + '.gg .qexp b{color:#f8e2a6;}'
    + '@keyframes ggPick{0%,26%{border-color:#e6dcc6;background:#FBF7F0;color:#3a3020;}32%,44%{border-color:var(--gold,#B78A2E);background:#fff;}50%,92%{border-color:#1FA971;background:#e7f6ef;color:#0f7a52;}100%{border-color:#e6dcc6;background:#FBF7F0;color:#3a3020;}}'
    + '@keyframes ggDim{0%,44%{opacity:1;}52%,92%{opacity:.38;}100%{opacity:1;}}'
    + '@keyframes ggCheck{0%,46%{transform:translateY(-50%) scale(0);}54%,92%{transform:translateY(-50%) scale(1);}100%{transform:translateY(-50%) scale(0);}}'
    + '@keyframes ggExp{0%,48%{opacity:0;transform:translateY(16px);}58%,92%{opacity:1;transform:translateY(0);}100%{opacity:0;transform:translateY(16px);}}'
    + '.gg .dk{text-align:center;padding:.5rem 0 .2rem;}'
    + '.gg .dk-num{font:800 2.7rem/1 var(--font-display,Georgia),serif;color:var(--teal,#2E6E6A);}'
    + '.gg .dk-lbl{font:500 11px var(--font-ui,Inter),sans-serif;color:#786D59;margin-top:2px;}'
    + '.gg .dk-bar{height:7px;border-radius:5px;background:#eee3cf;margin:12px 6px 0;overflow:hidden;}'
    + '.gg .dk-bar span{display:block;height:100%;background:linear-gradient(90deg,var(--teal,#2E6E6A),var(--gold,#B78A2E));width:14%;animation:ggFill 7s ease-in-out infinite;}'
    + '@keyframes ggFill{0%,20%{width:14%;}55%,90%{width:78%;}100%{width:14%;}}'
    + '.gg .dk-streak{display:block;text-align:center;margin-top:13px;font:700 11px var(--font-ui,Inter),sans-serif;color:#b8620e;}'
    + '.gg .dk-streak::before{content:"\\1F525 ";}'
    + '.gg .lvh{font:700 9px/1 var(--font-ui,Inter),sans-serif;letter-spacing:.08em;text-transform:uppercase;color:var(--teal,#2E6E6A);margin-bottom:16px;}'
    + '.gg .lv{display:flex;gap:.5rem;align-items:flex-end;height:66px;}'
    + '.gg .lv span{flex:1;text-align:center;font:600 10px var(--font-ui,Inter),sans-serif;color:#9a8e7b;display:flex;flex-direction:column;justify-content:flex-end;gap:5px;}'
    + '.gg .lv i{display:block;height:10px;border-radius:5px;background:#eadfca;}'
    + '.gg .lv .on{color:var(--teal,#2E6E6A);font-weight:800;}'
    + '.gg .lv .on i{background:linear-gradient(180deg,var(--gold,#B78A2E),var(--teal,#2E6E6A));animation:ggGrow 7s ease-in-out infinite;}'
    + '@keyframes ggGrow{0%,25%{height:10px;}55%,90%{height:50px;}100%{height:10px;}}'
    + '.gg .lv-tag{margin-top:14px;font:500 11px var(--font-ui,Inter),sans-serif;color:#786D59;}'
    + '.gg .lv-tag b{color:var(--teal,#2E6E6A);font-family:var(--font-display,Georgia),serif;}'
    + '.gg-app.dark,.gg .gg-app-dark{background:#1b2725;}'
    + '.gg .vg{display:grid;grid-template-columns:1fr 1fr;gap:7px;}'
    + '.gg .vg>div{aspect-ratio:16/11;border-radius:8px;background:#2c3a37;border:1px solid #3a4a46;}'
    + '.gg .vg .spk{outline:2px solid var(--gold,#B78A2E);animation:ggSpk 2.4s ease-in-out infinite;}'
    + '@keyframes ggSpk{0%,100%{box-shadow:0 0 0 0 rgba(183,138,46,.5);}50%{box-shadow:0 0 0 5px rgba(183,138,46,0);}}'
    + '.gg .vg-cap{margin-top:10px;font:600 10px var(--font-ui,Inter),sans-serif;color:#b7ab96;}'
    + '.gg .fcard{perspective:800px;display:flex;justify-content:center;padding:.5rem 0 .2rem;}'
    + '.gg .fc-in{position:relative;width:180px;height:96px;transform-style:preserve-3d;animation:ggFlip 7s ease-in-out infinite;}'
    + '.gg .fc-f,.gg .fc-b{position:absolute;inset:0;backface-visibility:hidden;border-radius:14px;display:flex;align-items:center;justify-content:center;box-shadow:0 8px 18px rgba(0,0,0,.12);font-family:var(--font-display,Georgia),serif;}'
    + '.gg .fc-f{background:#fff;border:1px solid #e6dcc6;color:#241E17;font-size:1.35rem;}'
    + '.gg .fc-b{background:var(--teal,#2E6E6A);color:#fff;font-size:1.1rem;transform:rotateY(180deg);}'
    + '@keyframes ggFlip{0%,42%{transform:rotateY(0);}54%,92%{transform:rotateY(180deg);}100%{transform:rotateY(0);}}'
    + '.gg .fc-hint{text-align:center;margin-top:14px;font:500 10.5px var(--font-ui,Inter),sans-serif;color:#9a8e7b;}'
    + '.gg .ai-row{position:relative;border-radius:9px;padding:9px 11px;margin-bottom:8px;font:500 11px/1.4 var(--font-ui,Inter),sans-serif;}'
    + '.gg .ai-row em{display:block;font:800 8px/1 var(--font-ui,Inter),sans-serif;letter-spacing:.09em;text-transform:uppercase;font-style:normal;margin-bottom:4px;opacity:.75;}'
    + '.gg .ai-row.before{background:#f4eee1;color:#6E6353;}'
    + '.gg .ai-row.after{background:var(--teal,#2E6E6A);color:#fff;opacity:0;transform:translateY(10px);animation:ggAiIn 6.5s ease-in-out infinite;}'
    + '.gg .ai-row.after em{color:#f8e2a6;opacity:1;}'
    + '@keyframes ggAiIn{0%,38%{opacity:0;transform:translateY(10px);}50%,92%{opacity:1;transform:translateY(0);}100%{opacity:0;transform:translateY(10px);}}'
    + '.gg .ai-badge{position:absolute;right:9px;bottom:9px;background:#f8e2a6;color:#5c4610;-webkit-text-fill-color:#5c4610;border-radius:5px;font:800 8px var(--font-ui,Inter),sans-serif;padding:2px 6px;}'
    + '.gg-cat{position:absolute;bottom:-2px;left:18px;width:68px;z-index:3;filter:drop-shadow(0 8px 12px rgba(0,0,0,.16));animation:ggCat 5s ease-in-out infinite;}'
    + '@keyframes ggCat{0%,100%{transform:translateY(0) rotate(-3deg);}50%{transform:translateY(-5px) rotate(2deg);}}'
    + '.gg-sub{position:absolute;bottom:15px;left:50%;transform:translateX(-50%);max-width:80%;background:rgba(18,14,9,.88);color:#fff;border-radius:9px;padding:7px 13px;font:500 12px/1.35 var(--font-ui,Inter),sans-serif;text-align:center;box-shadow:0 8px 18px rgba(0,0,0,.22);z-index:4;}'
    + '.gg-sub b{background:#fff;color:#1a1a1a;-webkit-text-fill-color:#1a1a1a;border-radius:4px;font:800 8px var(--font-ui,Inter),sans-serif;padding:1px 5px;margin-right:6px;letter-spacing:.08em;vertical-align:middle;}'
    + '.gg-sub em{color:#f8e2a6;font-style:normal;font-weight:700;}'
    + '.gg-meta{position:relative;overflow:hidden;padding:2.4rem;display:flex;flex-direction:column;justify-content:center;gap:.5rem;background:linear-gradient(180deg,var(--bg-card,#fff),color-mix(in srgb,var(--gold,#B78A2E) 4%,var(--bg-card,#fff)));}'
    + '.gg-wm{position:absolute;top:.2rem;right:1.2rem;font-family:var(--font-display,Georgia),serif;font-size:6.5rem;font-weight:800;line-height:1;color:var(--teal,#2E6E6A);opacity:.06;pointer-events:none;-webkit-text-fill-color:currentColor;}'
    + '.gg-tag{font-family:var(--font-ui,Inter),sans-serif;font-size:.7rem;letter-spacing:.14em;text-transform:uppercase;font-weight:700;color:var(--teal,#2E6E6A);}'
    + '.gg-meta h3{font-family:var(--font-display,Georgia),serif;font-size:1.6rem;margin:.1rem 0 0;color:var(--text,#241c12);}'
    + '.gg-meta p{font-family:var(--font-ui,Inter),sans-serif;color:var(--text-muted,#6b6250);font-size:.96rem;line-height:1.6;margin:.15rem 0 .5rem;max-width:34ch;}'
    + '.gg-cta{align-self:flex-start;display:inline-flex!important;align-items:center;gap:.55rem;font-family:var(--font-ui,Inter),sans-serif;font-weight:700;font-size:.9rem;line-height:1!important;color:#fff!important;-webkit-text-fill-color:#fff!important;background:var(--teal,#2E6E6A)!important;padding:0 1.4rem!important;height:46px!important;min-height:0!important;box-sizing:border-box!important;border-radius:99px;text-decoration:none!important;box-shadow:0 8px 20px rgba(46,110,106,.34);transition:transform .18s,box-shadow .18s,background .18s;}'
    + '.gg-cta:hover{transform:translateY(-2px);background:var(--gold,#B78A2E)!important;box-shadow:0 10px 26px rgba(183,138,46,.42);}'
    + '.gg-cta .gg-arw{display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:50%;background:rgba(255,255,255,.22);font-size:.78rem;transition:transform .18s;}'
    + '.gg-cta:hover .gg-arw{transform:translateX(3px);}'
    + '.gg-arrow{position:absolute;top:calc(50% - 22px);width:44px;height:44px;border-radius:50%;border:1px solid var(--line,#e3d8c3);background:rgba(255,255,255,.94);color:var(--teal,#2E6E6A);font-size:1.5rem;line-height:1;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 6px 18px rgba(0,0,0,.12);transition:transform .15s;-webkit-text-fill-color:var(--teal,#2E6E6A);}'
    + '.gg-arrow:hover{transform:scale(1.08);}.gg-prev{left:-14px;}.gg-next{right:-14px;}'
    + '.gg-dots{display:flex;gap:.5rem;justify-content:center;margin-top:1.3rem;}'
    + '.gg-dots button{width:9px;height:9px;border-radius:50%;border:none;background:var(--line,#d9cdb4);cursor:pointer;padding:0;transition:width .25s,background .25s;}'
    + '.gg-dots button.on{width:26px;border-radius:6px;background:var(--gold,#B78A2E);}'
    + '@media(max-width:760px){.gg-slide{grid-template-columns:1fr;min-height:0;}.gg-scene{min-height:250px;padding-bottom:3rem;}.gg-meta{padding:1.6rem;}.gg-arrow{display:none;}.gg-cat{width:54px;left:8px;}.gg-sub{font-size:11px;bottom:11px;max-width:88%;}}'
    + '@media(prefers-reduced-motion:reduce){.gg-track,.gg-win,.gg-cat,.gg .qo-a,.gg .qo-b,.gg .qo-c,.gg .qexp,.gg .qo-b .qck,.gg .dk-bar span,.gg .lv .on i,.gg .vg .spk,.gg .fc-in,.gg .ai-row.after{animation:none!important;}.gg .qexp,.gg .ai-row.after{opacity:1;transform:none;}.gg .fc-in{transform:none;}}';

  function injectCSS() { if (document.getElementById('gg-css')) return; var s = document.createElement('style'); s.id = 'gg-css'; s.textContent = CSS; document.head.appendChild(s); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function win(url, inner) { return '<div class="gg-win"><div class="gg-bar"><i></i><i></i><i></i><em class="gg-url">' + url + '</em></div><div class="gg-app">' + inner + '</div></div>'; }
  function sub(txt) { return '<div class="gg-sub"><b>CC</b> ' + txt + '</div>'; }
  function cat(v) { return '<img class="gg-cat" src="assets/gri-cat-' + (v === 'curious' ? 'curious' : 'happy') + '.png" alt="" loading="lazy">'; }

  function mount(opts) {
    injectCSS();
    var cont = typeof opts.container === 'string' ? document.querySelector(opts.container) : opts.container;
    if (!cont) return null;
    var slides = opts.slides || [];
    if (!slides.length) { return null; }
    var dismissible = !!opts.dismissible;
    var key = opts.storageKey || 'gg-seen';

    var headInner = '<div>' + (opts.eyebrow ? '<span class="gg-eyebrow">' + esc(opts.eyebrow) + '</span>' : '')
      + '<h2>' + esc(opts.title || 'Nasıl kullanılır?') + '</h2>'
      + (opts.subtitle ? '<p>' + esc(opts.subtitle) + '</p>' : '') + '</div>'
      + (dismissible ? '<button class="gg-close" type="button" aria-label="Kapat">&times;</button>' : '');
    var reel = '<div class="gg-reel"><div class="gg-viewport"><div class="gg-track"></div></div>'
      + '<button class="gg-arrow gg-prev" type="button" aria-label="Önceki">&#8249;</button>'
      + '<button class="gg-arrow gg-next" type="button" aria-label="Sonraki">&#8250;</button>'
      + '<div class="gg-dots" role="tablist"></div></div>';
    cont.innerHTML = '<section class="gg' + (dismissible ? ' gg-dismissible' : '') + '"><div class="gg-wrap"><div class="gg-head">' + headInner + '</div>' + reel + '</div></section>'
      + (dismissible ? '<div style="text-align:center;"><button class="gg-reopen" type="button" hidden>Nasıl kullanılır? &#9662;</button></div>' : '');

    var root = cont.querySelector('.gg');
    var track = cont.querySelector('.gg-track');
    track.innerHTML = slides.map(function (s, k) {
      var n = ('0' + (k + 1)).slice(-2);
      return '<article class="gg-slide"><div class="gg-scene">' + (s.scene || '') + '</div>'
        + '<div class="gg-meta"><span class="gg-wm">' + n + '</span><div class="gg-tag">' + esc(s.tag || '') + '</div>'
        + '<h3>' + esc(s.title || '') + '</h3><p>' + esc(s.desc || '') + '</p>'
        + (s.href ? '<a class="gg-cta" href="' + esc(s.href) + '">' + esc(s.cta || 'Dene') + '<span class="gg-arw">&#8594;</span></a>' : '')
        + '</div></article>';
    }).join('');

    var dotsEl = cont.querySelector('.gg-dots');
    dotsEl.innerHTML = slides.map(function (_, k) { return '<button type="button" role="tab" aria-label="' + (k + 1) + '"></button>'; }).join('');
    var dotEls = Array.prototype.slice.call(dotsEl.children);
    var i = 0, timer = null;
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion:reduce)').matches;
    function go(n) { i = (n + slides.length) % slides.length; track.style.transform = 'translateX(-' + (i * 100) + '%)'; dotEls.forEach(function (d, k) { d.classList.toggle('on', k === i); }); }
    function stop() { if (timer) { clearInterval(timer); timer = null; } }
    function start() { if (reduce || root.hidden) return; stop(); timer = setInterval(function () { go(i + 1); }, 4800); }
    dotEls.forEach(function (d, k) { d.addEventListener('click', function () { go(k); start(); }); });
    cont.querySelector('.gg-next').addEventListener('click', function () { go(i + 1); start(); });
    cont.querySelector('.gg-prev').addEventListener('click', function () { go(i - 1); start(); });
    var reelEl = cont.querySelector('.gg-reel');
    reelEl.addEventListener('mouseenter', stop); reelEl.addEventListener('mouseleave', start);
    reelEl.addEventListener('focusin', stop); reelEl.addEventListener('focusout', start);
    var x0 = null;
    track.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; stop(); }, { passive: true });
    track.addEventListener('touchend', function (e) { if (x0 === null) return; var dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 40) { go(i + (dx < 0 ? 1 : -1)); } x0 = null; start(); }, { passive: true });

    if (dismissible) {
      var reopen = cont.querySelector('.gg-reopen');
      function setClosed(c) { root.hidden = c; if (reopen) reopen.hidden = !c; try { localStorage.setItem(key, c ? '1' : '0'); } catch (e) {} if (c) { stop(); } else { go(i); start(); } }
      cont.querySelector('.gg-close').addEventListener('click', function () { setClosed(true); });
      if (reopen) reopen.addEventListener('click', function () { setClosed(false); });
      var wasClosed = false; try { wasClosed = localStorage.getItem(key) === '1'; } catch (e) {}
      if (wasClosed) { setClosed(true); return { open: function () { setClosed(false); } }; }
    }
    go(0); start();
    return { reload: function () { go(0); } };
  }

  window.GriGuide = { mount: mount, win: win, sub: sub, cat: cat };
})();
