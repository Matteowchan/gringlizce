/* gri-wordsearch.js — Kelime Avı. Bağımsız, kendi CSS'i, data-theme, dokunmatik.
 * GriWordSearch.mount(el,{words:[{w,tr}], size, onFinish, onReplay})
 */
(function(){
  if(window.GriWordSearch)return;
  function css(){
    if(document.getElementById('gri-ws-css'))return;
    var s=document.createElement('style');s.id='gri-ws-css';
    s.textContent=[
      '.gws{--ws-line:#d9cfbb;--ws-cell:#fffdf7;--ws-ink:#2b2118;--ws-sel:#C79A3A;--ws-selbg:#ffe9ad;--ws-ok:#2E6E4E;--ws-okbg:#bfe6cd;font-family:inherit;width:100%;max-width:560px;margin:0 auto;display:flex;flex-direction:column;align-items:center;gap:14px;}',
      ':root[data-theme="dark"] .gws{--ws-line:#4a4133;--ws-cell:#2f2a21;--ws-ink:#f0e9db;--ws-selbg:#6a5622;--ws-okbg:#24503a;}',
      '.gws-grid{display:grid;gap:3px;background:transparent;touch-action:none;user-select:none;-webkit-user-select:none;width:max-content;max-width:100%;}',
      '.gws-c{width:34px;height:34px;max-width:8.6vw;max-height:8.6vw;display:flex;align-items:center;justify-content:center;background:var(--ws-cell);border:1px solid var(--ws-line);border-radius:6px;font-weight:700;font-size:16px;text-transform:uppercase;color:var(--ws-ink);box-sizing:border-box;}',
      '@media(max-width:520px){.gws-c{font-size:13px;border-radius:4px;}}',
      '.gws-c.sel{background:var(--ws-selbg);border-color:var(--ws-sel);}',
      '.gws-c.ok{background:var(--ws-okbg);border-color:var(--ws-ok);color:var(--ws-ok);}',
      '.gws-list{display:flex;flex-wrap:wrap;gap:6px 12px;justify-content:center;}',
      '.gws-w{font-size:.9rem;font-weight:700;color:var(--ws-ink);padding:2px 4px;}',
      '.gws-w small{font-weight:500;opacity:.6;}',
      '.gws-w.found{opacity:.5;text-decoration:line-through;color:var(--ws-ok);}',
      '.gws-done{text-align:center;padding:12px 16px;border:1px solid var(--ws-line);border-radius:12px;background:var(--ws-cell);color:var(--ws-ink);}',
      '.gws-done b{color:var(--ws-ok);}',
      '.gws-btn{margin-top:8px;font:700 14px inherit;padding:9px 18px;border-radius:9px;border:0;background:var(--ws-ok);color:#fff;cursor:pointer;}'
    ].join('');document.head.appendChild(s);
  }
  var DIRS=[[0,1],[1,0],[1,1],[1,-1],[0,-1],[-1,0],[-1,-1],[-1,1]];
  var AL='ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  function norm(w){return String(w||'').toUpperCase().replace(/[^A-Z]/g,'');}
  function rnd(n,seed){ return Math.floor(Math.random()*n); }

  function mount(host,opts){
    css(); opts=opts||{};
    var words=(opts.words||[]).map(function(o){return {w:norm(o.w),tr:o.tr||''};}).filter(function(o){return o.w.length>=3;}).slice(0,opts.count||8);
    var maxLen=words.reduce(function(m,o){return Math.max(m,o.w.length);},3);
    var N=Math.max(opts.size||0,maxLen+1,9);
    host.className=(host.className||'')+' gws'; host.innerHTML='';

    var grid=[]; for(var r=0;r<N;r++){grid.push([]);for(var c=0;c<N;c++)grid[r].push('');}
    var placed=[];
    words.forEach(function(o){
      for(var attempt=0;attempt<200;attempt++){
        var d=DIRS[rnd(DIRS.length)], dr=d[0],dc=d[1];
        var r0=rnd(N), c0=rnd(N);
        var rEnd=r0+dr*(o.w.length-1), cEnd=c0+dc*(o.w.length-1);
        if(rEnd<0||rEnd>=N||cEnd<0||cEnd>=N)continue;
        var ok=true, cells=[];
        for(var i=0;i<o.w.length;i++){ var rr=r0+dr*i,cc=c0+dc*i,cur=grid[rr][cc]; if(cur&&cur!==o.w.charAt(i)){ok=false;break;} cells.push([rr,cc]); }
        if(!ok)continue;
        for(var j=0;j<o.w.length;j++)grid[cells[j][0]][cells[j][1]]=o.w.charAt(j);
        o.cells=cells; placed.push(o); return;
      }
    });
    for(var r2=0;r2<N;r2++)for(var c2=0;c2<N;c2++)if(!grid[r2][c2])grid[r2][c2]=AL.charAt(rnd(26));

    var gEl=document.createElement('div'); gEl.className='gws-grid'; gEl.style.gridTemplateColumns='repeat('+N+',auto)';
    var cellEls={};
    for(var r3=0;r3<N;r3++)for(var c3=0;c3<N;c3++){
      var d=document.createElement('div'); d.className='gws-c'; d.textContent=grid[r3][c3]; d.setAttribute('data-r',r3); d.setAttribute('data-c',c3);
      gEl.appendChild(d); cellEls[r3+'_'+c3]=d;
    }
    host.appendChild(gEl);

    var list=document.createElement('div'); list.className='gws-list';
    placed.forEach(function(o,i){ var w=document.createElement('span'); w.className='gws-w'; w.setAttribute('data-i',i); w.innerHTML='<b>'+(o.tr||o.w)+'</b>'; list.appendChild(w); o._el=w; });
    host.appendChild(list);

    var foundCount=0, anchor=null, curSel=[];
    function cellAt(x,y){ var el=document.elementFromPoint(x,y); if(!el)return null; if(el.className.indexOf('gws-c')<0)return null; return el; }
    function lineCells(a,b){
      var r0=+a.getAttribute('data-r'),c0=+a.getAttribute('data-c'),r1=+b.getAttribute('data-r'),c1=+b.getAttribute('data-c');
      var dr=r1-r0,dc=c1-c0; if(!(dr===0||dc===0||Math.abs(dr)===Math.abs(dc)))return null;
      var steps=Math.max(Math.abs(dr),Math.abs(dc)); var sr=dr===0?0:dr/Math.abs(dr), sc=dc===0?0:dc/Math.abs(dc);
      var arr=[]; for(var i=0;i<=steps;i++)arr.push([r0+sr*i,c0+sc*i]); return arr;
    }
    function clearSel(){ curSel.forEach(function(p){ var e=cellEls[p[0]+'_'+p[1]]; if(e&&e.className.indexOf('ok')<0)e.className='gws-c'; }); curSel=[]; }
    function setSel(arr){ clearSel(); curSel=arr; arr.forEach(function(p){ var e=cellEls[p[0]+'_'+p[1]]; if(e&&e.className.indexOf('ok')<0)e.className='gws-c sel'; }); }
    function wordOf(arr){ return arr.map(function(p){return grid[p[0]][p[1]];}).join(''); }
    function tryMatch(){
      if(!curSel.length)return;
      var w=wordOf(curSel), wr=w.split('').reverse().join('');
      for(var i=0;i<placed.length;i++){ if(placed[i]._done)continue;
        if(placed[i].w===w||placed[i].w===wr){
          placed[i]._done=true; foundCount++;
          if(window.GriFX){ GriFX.sound('ok'); GriFX.speak(placed[i].w); }
          curSel.forEach(function(p){ cellEls[p[0]+'_'+p[1]].className='gws-c ok'; });
          placed[i]._el.className='gws-w found'; placed[i]._el.innerHTML='<b>'+(placed[i].tr||'')+'</b> <small>'+placed[i].w+'</small>';
          curSel=[];
          if(foundCount===placed.length)finish();
          return;
        }
      }
      clearSel();
    }
    gEl.addEventListener('pointerdown',function(e){ var c=cellAt(e.clientX,e.clientY); if(!c)return; anchor=c; setSel([[+c.getAttribute('data-r'),+c.getAttribute('data-c')]]); if(gEl.setPointerCapture)try{gEl.setPointerCapture(e.pointerId);}catch(_){} e.preventDefault(); });
    gEl.addEventListener('pointermove',function(e){ if(!anchor)return; var c=cellAt(e.clientX,e.clientY); if(!c)return; var arr=lineCells(anchor,c); if(arr)setSel(arr); });
    function end(){ if(!anchor)return; anchor=null; tryMatch(); }
    gEl.addEventListener('pointerup',end); gEl.addEventListener('pointercancel',end);

    var doneEl=null;
    function finish(){
      if(window.GriConfetti)window.GriConfetti.burst();
      doneEl=document.createElement('div'); doneEl.className='gws-done';
      doneEl.innerHTML='<b>Bravo!</b> Tüm kelimeleri buldun.';
      var btn=document.createElement('button'); btn.className='gws-btn'; btn.textContent='Yeni Oyun';
      btn.addEventListener('click',function(){ if(opts.onReplay)opts.onReplay(); });
      doneEl.appendChild(btn); host.appendChild(doneEl);
      if(opts.onFinish)opts.onFinish({found:foundCount});
    }
    return {};
  }
  window.GriWordSearch={ mount:mount };
})();
