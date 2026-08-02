/* gri-match.js — Eşleştirme oyunu (kelime ↔ anlam). Bağımsız, kendi CSS'i, data-theme.
 * GriMatch.mount(el, {pairs:[{en,tr}], onFinish}) -> {reset}
 */
(function(){
  if(window.GriMatch)return;
  function css(){
    if(document.getElementById('gri-mt-css'))return;
    var s=document.createElement('style');s.id='gri-mt-css';
    s.textContent=[
      '.gmt{--mt-line:#d9cfbb;--mt-cell:#fffdf7;--mt-ink:#2b2118;--mt-sel:#C79A3A;--mt-selbg:#fff4d6;--mt-ok:#2E6E4E;--mt-okbg:#e2f1e8;--mt-bad:#c0392b;--mt-badbg:#fbe3df;font-family:inherit;width:100%;max-width:560px;margin:0 auto;}',
      ':root[data-theme="dark"] .gmt{--mt-line:#4a4133;--mt-cell:#2f2a21;--mt-ink:#f0e9db;--mt-selbg:#4a3f22;--mt-okbg:#1c3327;--mt-badbg:#3a201c;}',
      '.gmt-top{display:flex;justify-content:center;gap:14px;margin-bottom:12px;font-weight:700;font-size:.9rem;color:var(--mt-ink);opacity:.85;}',
      '.gmt-cols{display:grid;grid-template-columns:1fr 1fr;gap:10px;}',
      '.gmt-col{display:flex;flex-direction:column;gap:8px;}',
      '.gmt-i{background:var(--mt-cell);border:1.5px solid var(--mt-line);border-radius:10px;padding:12px 10px;font-size:.95rem;font-weight:600;color:var(--mt-ink);cursor:pointer;text-align:center;transition:transform .08s,background .12s,border-color .12s;min-height:20px;}',
      '.gmt-i:active{transform:scale(.97);}',
      '.gmt-i.sel{background:var(--mt-selbg);border-color:var(--mt-sel);}',
      '.gmt-i.ok{background:var(--mt-okbg);border-color:var(--mt-ok);color:var(--mt-ok);cursor:default;pointer-events:none;opacity:.75;}',
      '.gmt-i.bad{background:var(--mt-badbg);border-color:var(--mt-bad);animation:gmtsh .35s;}',
      '@keyframes gmtsh{25%{transform:translateX(-4px)}75%{transform:translateX(4px)}}',
      '.gmt-done{text-align:center;margin-top:14px;padding:14px;border:1px solid var(--mt-line);border-radius:12px;background:var(--mt-cell);color:var(--mt-ink);}',
      '.gmt-done b{color:var(--mt-ok);font-size:1.1rem;}',
      '.gmt-btn{margin-top:10px;font:700 14px inherit;padding:9px 18px;border-radius:9px;border:0;background:var(--mt-ok);color:#fff;cursor:pointer;}'
    ].join('');document.head.appendChild(s);
  }
  function shuffle(a){ a=a.slice(); for(var i=a.length-1;i>0;i--){ var j=(i*7+3)%(i+1); var t=a[i];a[i]=a[j];a[j]=t; } return a; }
  function esc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}

  function mount(host,opts){
    css(); opts=opts||{};
    var pairs=(opts.pairs||[]).slice(0,opts.count||6);
    host.className=(host.className||'')+' gmt'; host.innerHTML='';
    var moves=0, matched=0, startT=Date.now(), selEl=null, selPair=null, done=false;
    var top=document.createElement('div'); top.className='gmt-top';
    top.innerHTML='<span>Eşleşen: <b id="gmtM">0</b>/'+pairs.length+'</span><span>Hamle: <b id="gmtMv">0</b></span>';
    host.appendChild(top);
    var cols=document.createElement('div'); cols.className='gmt-cols';
    var lc=document.createElement('div'); lc.className='gmt-col';
    var rc=document.createElement('div'); rc.className='gmt-col';
    cols.appendChild(lc); cols.appendChild(rc); host.appendChild(cols);
    // build tiles: left=en shuffled, right=tr shuffled, tagged with pair index
    var idx=pairs.map(function(_,i){return i;});
    shuffle(idx).forEach(function(pi){ lc.appendChild(tile(pairs[pi].en,pi,'en')); });
    shuffle(idx).forEach(function(pi){ rc.appendChild(tile(pairs[pi].tr,pi,'tr')); });

    function tile(txt,pi,side){
      var d=document.createElement('div'); d.className='gmt-i'; d.textContent=txt; d.setAttribute('data-pi',pi); d.setAttribute('data-side',side);
      d.addEventListener('click',function(){ pick(d,pi,side); });
      return d;
    }
    function clearSel(){ if(selEl)selEl.className='gmt-i'; selEl=null; selPair=null; }
    function pick(d,pi,side){
      if(done||d.className.indexOf('ok')>=0)return;
      if(!selEl){ selEl=d; selPair=pi; d.className='gmt-i sel'; return; }
      if(selEl===d){ clearSel(); return; }
      if(side===selEl.getAttribute('data-side')){ clearSel(); selEl=d; selPair=pi; d.className='gmt-i sel'; return; }
      // second pick opposite side → evaluate
      moves++; document.getElementById('gmtMv').textContent=moves;
      if(pi===selPair){ d.className='gmt-i ok'; selEl.className='gmt-i ok'; selEl=null;selPair=null; matched++; document.getElementById('gmtM').textContent=matched; if(matched===pairs.length)finish(); }
      else { var a=selEl,b=d; a.className='gmt-i bad'; b.className='gmt-i bad'; setTimeout(function(){ if(a.className.indexOf('ok')<0)a.className='gmt-i'; if(b.className.indexOf('ok')<0)b.className='gmt-i'; },350); selEl=null;selPair=null; }
    }
    function finish(){
      done=true;
      var sec=Math.round((Date.now()-startT)/1000);
      var acc=Math.round(100*pairs.length/Math.max(moves,pairs.length));
      var card=document.createElement('div'); card.className='gmt-done';
      card.innerHTML='<div><b>Tebrikler!</b> Tüm kelimeleri eşleştirdin.</div><div style="margin-top:6px;opacity:.85;font-size:.9rem">Süre: '+sec+' sn · Hamle: '+moves+' · İsabet: %'+acc+'</div>';
      var btn=document.createElement('button'); btn.className='gmt-btn'; btn.textContent='Yeni Oyun';
      btn.addEventListener('click',function(){ if(opts.onReplay)opts.onReplay(); });
      card.appendChild(btn); host.appendChild(card);
      if(opts.onFinish)opts.onFinish({seconds:sec,moves:moves,acc:acc});
    }
    return {};
  }
  window.GriMatch={ mount:mount };
})();
