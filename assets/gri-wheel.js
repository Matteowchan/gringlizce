/* gri-wheel.js — Gri WOW: harf çarkı + crossword ızgara (Words of Wonders tarzı)
 * Bağımsız: kendi CSS'i, data-theme, mobil + dokunmatik, animasyonlu.
 * GriWheel.mount(host, {level, onComplete}) ; level = {theme,letters,cols,rows,grid:[{r,c,dir,answer}],words:[{w,tr}]}
 */
(function(){
  if(window.GriWheel)return;
  var WH=288; // wheel karesi (px)
  function css(){
    if(document.getElementById('gri-wo-css'))return;
    var s=document.createElement('style'); s.id='gri-wo-css';
    s.textContent=[
      '.gwo{--wo-line:#d9cfbb;--wo-cell:#fffdf7;--wo-ink:#2b2118;--wo-hide:#efe7d7;--wo-gold:#C79A3A;--wo-goldbg:#fff1c2;--wo-ok:#2E6E4E;--wo-okbg:#cfeddb;font-family:inherit;width:100%;max-width:520px;margin:0 auto;display:flex;flex-direction:column;align-items:center;gap:14px;}',
      ':root[data-theme="dark"] .gwo{--wo-line:#4a4133;--wo-cell:#2f2a21;--wo-ink:#f0e9db;--wo-hide:#241f18;--wo-goldbg:#5a4a1e;--wo-okbg:#24503a;}',
      '.gwo-top{display:flex;justify-content:space-between;width:100%;max-width:360px;font-weight:700;font-size:.9rem;color:var(--wo-ink);}',
      '.gwo-top .th{color:var(--wo-gold);}',
      '.gwo-gridwrap{width:100%;overflow-x:auto;display:flex;justify-content:center;padding:2px 0;}',
      '.gwo-grid{display:grid;gap:4px;margin:0 auto;--gwo-cs:32px;}',
      '.gwo-cell{width:var(--gwo-cs);height:var(--gwo-cs);box-sizing:border-box;}',
      '@media(max-width:480px){.gwo-grid{--gwo-cs:26px;}.gwo-cell.on{font-size:14px;}}',
      '.gwo-cell.on{background:var(--wo-hide);border:1.5px solid var(--wo-line);border-radius:6px;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:17px;text-transform:uppercase;color:transparent;}',
      '.gwo-cell.rev{background:var(--wo-cell);color:var(--wo-ink);animation:gwoflip .5s ease;}',
      '@keyframes gwoflip{0%{transform:rotateX(90deg);background:var(--wo-ok);}60%{background:var(--wo-okbg);}100%{transform:rotateX(0);}}',
      '.gwo-formed{min-height:34px;display:flex;align-items:center;gap:3px;}',
      '.gwo-formed .p{font-weight:800;font-size:20px;letter-spacing:2px;text-transform:uppercase;color:var(--wo-ink);background:var(--wo-goldbg);border:1.5px solid var(--wo-gold);border-radius:22px;padding:5px 16px;min-width:40px;text-align:center;}',
      '.gwo-formed .p.ok{background:var(--wo-ok);color:#fff;border-color:var(--wo-ok);animation:gwopop .3s;}',
      '.gwo-formed .p.bad{animation:gwosh .35s;border-color:#c0392b;color:#c0392b;}',
      '.gwo-formed .p.dupe{animation:gwopop .3s;}',
      '@keyframes gwopop{0%{transform:scale(.8)}50%{transform:scale(1.12)}100%{transform:scale(1)}}',
      '@keyframes gwosh{25%{transform:translateX(-6px)}75%{transform:translateX(6px)}}',
      '.gwo-wheelwrap{position:relative;width:'+WH+'px;height:'+WH+'px;max-width:88vw;max-height:88vw;touch-action:none;}',
      '.gwo-wheel{position:absolute;inset:0;border-radius:50%;background:var(--wo-cell);border:2px solid var(--wo-line);box-shadow:0 6px 22px rgba(43,33,24,.10);}',
      '.gwo-svg{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;filter:drop-shadow(0 2px 5px rgba(43,33,24,.18));}',
      '.gwo-k{position:absolute;width:54px;height:54px;margin:-27px 0 0 -27px;border-radius:50%;background:var(--wo-cell);border:2.5px solid var(--wo-line);color:var(--wo-ink);font-weight:800;font-size:25px;text-transform:uppercase;display:flex;align-items:center;justify-content:center;transition:transform .14s cubic-bezier(.34,1.56,.64,1),background .14s,border-color .14s,box-shadow .14s;user-select:none;box-shadow:0 2px 6px rgba(43,33,24,.08);}',
      '.gwo-k.sel{background:var(--wo-gold);border-color:var(--wo-gold);color:#fff;transform:scale(1.22);box-shadow:0 6px 16px rgba(43,33,24,.22);}',
      '.gwo-tools{display:flex;gap:10px;}',
      '.gwo-btn{font:700 13px inherit;padding:8px 16px;border-radius:9px;border:1px solid var(--wo-line);background:var(--wo-cell);color:var(--wo-ink);cursor:pointer;}',
      '.gwo-btn:active{transform:scale(.96);}',
      '.gwo-done{text-align:center;padding:18px;border:1px solid var(--wo-line);border-radius:14px;background:var(--wo-cell);color:var(--wo-ink);animation:gwopop .4s;box-shadow:0 8px 24px rgba(43,33,24,.10);}',
      '.gwo-badge{width:96px;height:96px;border-radius:50%;display:block;margin:0 auto 8px;box-shadow:0 4px 16px rgba(43,33,24,.16);animation:gwobadge .55s ease;}',
      '@keyframes gwobadge{0%{transform:scale(.4) rotate(-14deg);opacity:0}60%{transform:scale(1.12) rotate(5deg)}100%{transform:scale(1) rotate(0);opacity:1}}',
      '.gwo-done .t{font-family:var(--font-display,Georgia,serif);font-size:1.4rem;font-weight:800;color:var(--wo-ok);}',
      '.gwo-done .btn{margin-top:10px;font:700 15px inherit;padding:10px 22px;border-radius:10px;border:0;background:var(--wo-gold);color:#231c10;cursor:pointer;}',
      '.gwo-mean{position:fixed;left:50%;bottom:24%;transform:translateX(-50%) translateY(10px);background:var(--wo-ink);color:#fff;padding:8px 16px;border-radius:22px;font-weight:700;font-size:.92rem;opacity:0;pointer-events:none;transition:opacity .25s,transform .25s;z-index:60;}',
      '.gwo-mean.show{opacity:1;transform:translateX(-50%) translateY(0);}'
    ].join('');
    document.head.appendChild(s);
  }
  function esc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}

  function mount(host, opts){
    css(); opts=opts||{};
    var level=opts.level; if(!level)return null;
    host.className=(host.className||'')+' gwo'; host.innerHTML='';
    if(opts.accent){ host.style.setProperty('--wo-gold',opts.accent); host.style.setProperty('--wo-ok',opts.accent); }
    var letters=level.letters.toUpperCase().split('');
    var entries=level.grid.map(function(e){return {r:e.r,c:e.c,dir:e.dir,answer:e.answer.toUpperCase()};});
    var totals=entries.length, found={};

    /* top */
    var top=document.createElement('div'); top.className='gwo-top';
    top.innerHTML='<span class="th">'+esc(level.theme)+'</span><span>Kelime: <b id="gwoN">0</b>/'+totals+'</span>';
    host.appendChild(top);

    /* grid */
    var cells={}; // r_c -> {ch, el}
    entries.forEach(function(e){ var dr=e.dir==='down'?1:0,dc=e.dir==='across'?1:0; for(var i=0;i<e.answer.length;i++){ var k=(e.r+dr*i)+'_'+(e.c+dc*i); if(!cells[k])cells[k]={ch:e.answer.charAt(i)}; } });
    var gEl=document.createElement('div'); gEl.className='gwo-grid'; gEl.style.gridTemplateColumns='repeat('+level.cols+',var(--gwo-cs,32px))';
    for(var r=0;r<level.rows;r++)for(var c=0;c<level.cols;c++){ var k=r+'_'+c; var d=document.createElement('div'); if(cells[k]){ d.className='gwo-cell on'; d.textContent=cells[k].ch; cells[k].el=d; } else d.className='gwo-cell'; gEl.appendChild(d); }
    var gWrap=document.createElement('div'); gWrap.className='gwo-gridwrap'; gWrap.appendChild(gEl); host.appendChild(gWrap);

    /* formed pill */
    var formedWrap=document.createElement('div'); formedWrap.className='gwo-formed';
    var pill=document.createElement('div'); pill.className='p'; pill.textContent=''; formedWrap.appendChild(pill); host.appendChild(formedWrap);

    /* wheel */
    var wrap=document.createElement('div'); wrap.className='gwo-wheelwrap';
    var wheel=document.createElement('div'); wheel.className='gwo-wheel'; wrap.appendChild(wheel);
    var svg=document.createElementNS('http://www.w3.org/2000/svg','svg'); svg.setAttribute('class','gwo-svg'); svg.setAttribute('viewBox','0 0 '+WH+' '+WH);
    var poly=document.createElementNS('http://www.w3.org/2000/svg','polyline'); poly.setAttribute('fill','none'); poly.setAttribute('stroke','var(--wo-gold)'); poly.setAttribute('stroke-width','9'); poly.setAttribute('stroke-linecap','round'); poly.setAttribute('stroke-linejoin','round'); poly.setAttribute('opacity','.92');
    svg.appendChild(poly); wrap.appendChild(svg);
    var keyEls=[], pos=[];
    var cx=WH/2, cy=WH/2, R=WH/2-34;
    function layout(order){
      wheel.querySelectorAll('.gwo-k').forEach(function(n){n.remove();}); keyEls=[]; pos=[];
      var n=order.length;
      order.forEach(function(li,idx){
        var ang=(-90+idx*360/n)*Math.PI/180;
        var x=cx+R*Math.cos(ang), y=cy+R*Math.sin(ang);
        var b=document.createElement('div'); b.className='gwo-k'; b.textContent=letters[li]; b.setAttribute('data-li',li);
        b.style.left=(x/WH*100)+'%'; b.style.top=(y/WH*100)+'%';
        wheel.appendChild(b); keyEls[li]=b; pos[li]={x:x,y:y};
      });
    }
    var order=letters.map(function(_,i){return i;});
    layout(order);
    host.appendChild(wrap);

    /* tools */
    var tools=document.createElement('div'); tools.className='gwo-tools';
    var shuf=document.createElement('button'); shuf.className='gwo-btn'; shuf.textContent='Karıştır';
    shuf.addEventListener('click',function(){ for(var i=order.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=order[i];order[i]=order[j];order[j]=t;} layout(order); });
    tools.appendChild(shuf); host.appendChild(tools);

    /* meaning toast */
    var toast=document.createElement('div'); toast.className='gwo-mean'; document.body.appendChild(toast);
    function showMean(tr){ if(!tr)return; toast.textContent=tr; toast.className='gwo-mean show'; setTimeout(function(){ toast.className='gwo-mean'; },1600); }

    /* selection */
    var path=[], selecting=false;
    function svgXY(clientX,clientY){ var rect=svg.getBoundingClientRect(); return {x:(clientX-rect.left)*WH/rect.width, y:(clientY-rect.top)*WH/rect.height}; }
    function drawLine(extra){ var pts=path.map(function(li){return pos[li].x+','+pos[li].y;}); if(extra)pts.push(extra.x+','+extra.y); poly.setAttribute('points',pts.join(' ')); }
    function setPill(cls){ pill.textContent=path.map(function(li){return letters[li];}).join(''); pill.className='p'+(cls?' '+cls:''); }
    function keyAt(x,y){ var el=document.elementFromPoint(x,y); if(!el)return -1; if(el.className.indexOf('gwo-k')<0)return -1; return +el.getAttribute('data-li'); }
    function start(e){ var li=keyAt(e.clientX,e.clientY); if(li<0)return; selecting=true; path=[li]; keyEls[li].className='gwo-k sel'; setPill(); drawLine(svgXY(e.clientX,e.clientY)); if(wrap.setPointerCapture)try{wrap.setPointerCapture(e.pointerId);}catch(_){} e.preventDefault(); }
    function move(e){ if(!selecting)return; var li=keyAt(e.clientX,e.clientY); if(li>=0&&path.indexOf(li)<0){ path.push(li); keyEls[li].className='gwo-k sel'; setPill(); } drawLine(svgXY(e.clientX,e.clientY)); }
    function end(){ if(!selecting)return; selecting=false; poly.setAttribute('points',''); path.forEach(function(li){keyEls[li].className='gwo-k';}); evaluate(); }
    wrap.addEventListener('pointerdown',start); wrap.addEventListener('pointermove',move); wrap.addEventListener('pointerup',end); wrap.addEventListener('pointercancel',end);

    function reveal(ans){
      entries.forEach(function(e){ if(e.answer!==ans)return; var dr=e.dir==='down'?1:0,dc=e.dir==='across'?1:0;
        for(var i=0;i<e.answer.length;i++){ (function(cell,delay){ if(!cell||cell.className.indexOf('rev')>=0)return; setTimeout(function(){ cell.className='gwo-cell on rev'; },delay); })(cells[(e.r+dr*i)+'_'+(e.c+dc*i)].el, i*70); }
      });
    }
    function evaluate(){
      var w=path.map(function(li){return letters[li];}).join('');
      if(w.length<2){ setPill(''); pill.textContent=''; return; }
      if(found[w]){ setPill('dupe'); if(window.GriFX)GriFX.sound('dupe'); fade(); return; }
      var isTarget=false, tr=''; for(var i=0;i<entries.length;i++){ if(entries[i].answer===w){isTarget=true;break;} }
      if(isTarget){
        found[w]=true; setPill('ok'); reveal(w);
        for(var j=0;j<level.words.length;j++){ if(level.words[j].w.toUpperCase()===w){ tr=level.words[j].tr; break; } }
        showMean(w+' — '+tr);
        if(window.GriFX){ GriFX.sound('ok'); GriFX.speak(w); }
        document.getElementById('gwoN').textContent=Object.keys(found).length;
        fade();
        if(Object.keys(found).length>=totals) setTimeout(complete,650);
      } else { setPill('bad'); if(window.GriFX)GriFX.sound('bad'); fade(); }
    }
    function fade(){ setTimeout(function(){ pill.textContent=''; pill.className='p'; },420); }

    function complete(){
      if(window.GriConfetti)window.GriConfetti.burst();
      if(window.GriFX)GriFX.sound('win');
      var d=document.createElement('div'); d.className='gwo-done';
      var badge=opts.badge?'<img class="gwo-badge" src="'+opts.badge+'" alt="" width="96" height="96">':'';
      d.innerHTML=badge+'<div class="t">'+esc(level.theme)+' tamamlandı!</div><div style="margin-top:6px;opacity:.85">Tüm kelimeleri buldun.</div>';
      var b=document.createElement('button'); b.className='btn'; b.textContent='Sonraki Seviye ›';
      b.addEventListener('click',function(){ if(opts.onComplete)opts.onComplete(level.n); });
      d.appendChild(b); host.appendChild(d); d.scrollIntoView({behavior:'smooth',block:'center'});
    }
    return { destroy:function(){ if(toast&&toast.parentNode)toast.parentNode.removeChild(toast); } };
  }
  window.GriWheel={ mount:mount };
})();
