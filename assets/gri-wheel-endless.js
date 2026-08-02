/* gri-wheel-endless.js — Kelime Yolu "Sonsuz Mod": mevcut oyun kelimelerinden
 * prosedürel level üretir (tarayıcı-içi crossword yerleşimi). Tüm kelimeler Türkçe anlamlı.
 * GriWheelEndless.buildPool(cb) -> cb(pool) ; GriWheelEndless.makeLevel(pool) -> level|null
 */
(function(){
  if(window.GriWheelEndless)return;

  function isSub(w,base){ var b={},i; for(i=0;i<base.length;i++)b[base.charAt(i)]=(b[base.charAt(i)]||0)+1; for(i=0;i<w.length;i++){ var ch=w.charAt(i); if(!b[ch])return false; b[ch]--; } return true; }
  function shuffle(a){ for(var i=a.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)); var t=a[i];a[i]=a[j];a[j]=t; } return a; }
  function uniq(a){ var s={},o=[]; for(var i=0;i<a.length;i++){ if(!s[a[i]]){s[a[i]]=1;o.push(a[i]);} } return o; }

  /* tarayıcı-içi crossword yerleştirme (perl levelgen'in portu) */
  function makeGrid(words){
    var grid={}, placed=[];
    function g(r,c){ return grid[r+','+c]; }
    function set(r,c,ch){ grid[r+','+c]=ch; }
    function canPlace(w,r,c,dir){
      var dr=dir==='down'?1:0, dc=dir==='across'?1:0;
      if(g(r-dr,c-dc))return false;
      if(g(r+dr*w.length,c+dc*w.length))return false;
      var cross=0;
      for(var i=0;i<w.length;i++){ var rr=r+dr*i,cc=c+dc*i,cur=g(rr,cc),ch=w.charAt(i);
        if(cur){ if(cur!==ch)return false; cross++; }
        else{ if(dir==='across'){ if(g(rr-1,cc)||g(rr+1,cc))return false; } else { if(g(rr,cc-1)||g(rr,cc+1))return false; } }
      }
      return cross>0;
    }
    function place(w,r,c,dir){ var dr=dir==='down'?1:0,dc=dir==='across'?1:0; for(var i=0;i<w.length;i++)set(r+dr*i,c+dc*i,w.charAt(i)); placed.push({w:w,r:r,c:c,dir:dir}); }
    words=words.slice().sort(function(a,b){return b.length-a.length;});
    place(words[0],0,0,'across');
    for(var n=1;n<words.length;n++){
      var o=words[n], done=false;
      for(var p=0;p<placed.length&&!done;p++){ var pw=placed[p],pdr=pw.dir==='down'?1:0,pdc=pw.dir==='across'?1:0;
        for(var i=0;i<pw.w.length&&!done;i++){ var pr=pw.r+pdr*i,pc=pw.c+pdc*i,letter=pw.w.charAt(i);
          for(var j=0;j<o.length&&!done;j++){ if(o.charAt(j)!==letter)continue;
            var dir=pw.dir==='across'?'down':'across',ddr=dir==='down'?1:0,ddc=dir==='across'?1:0;
            var r=pr-ddr*j,c=pc-ddc*j;
            if(canPlace(o,r,c,dir)){ place(o,r,c,dir); done=true; }
          }
        }
      }
      if(!done)return null;
    }
    var minR=1e9,minC=1e9,maxR=-1e9,maxC=-1e9;
    for(var k in grid){ var a=k.split(','),rr=+a[0],cc=+a[1]; if(rr<minR)minR=rr; if(cc<minC)minC=cc; if(rr>maxR)maxR=rr; if(cc>maxC)maxC=cc; }
    placed.forEach(function(pp){ pp.r-=minR; pp.c-=minC; });
    return { cols:maxC-minC+1, rows:maxR-minR+1, placed:placed };
  }
  function tryGrid(words){ for(var t=0;t<words.length;t++){ var arr=words.slice(t).concat(words.slice(0,t)); var res=makeGrid(arr); if(res&&res.placed.length===words.length)return res; } return null; }

  function addWord(pool,w,tr){
    w=String(w||'').toUpperCase().replace(/[^A-Z]/g,'');
    if(w.length<3||w.length>7)return;
    if(!pool.gloss[w]){ pool.gloss[w]=tr||''; pool.words.push(w); if(w.length>=5)pool.bases.push(w); }
    else if(!pool.gloss[w]&&tr){ pool.gloss[w]=tr; }
  }

  function buildPool(cb){
    var pool={gloss:{},words:[],bases:[]};
    var srcs=[
      {url:'assets/wow-levels.json',pick:function(j){ (j||[]).forEach(function(lv){ (lv.words||[]).forEach(function(o){ addWord(pool,o.w,o.tr); }); }); }},
      {url:'assets/wordle-words.json',pick:function(j){ (j||[]).forEach(function(o){ addWord(pool,o.w,(o.tr||'').split(' / ')[0]); }); }},
      {url:'assets/wordle-words-social.json',pick:function(j){ (j||[]).forEach(function(o){ addWord(pool,o.w,(o.tr||'').split(' / ')[0]); }); }},
      {url:'assets/game-words.json',pick:function(j){ ((j&&j.themes)||[]).forEach(function(t){ (t.words||[]).forEach(function(o){ addWord(pool,o.w,o.tr); }); }); }},
      {url:'assets/game-dict.json',pick:function(j){ (j||[]).forEach(function(o){ addWord(pool,o.w,o.tr); }); }}
    ];
    var done=0;
    srcs.forEach(function(s){
      fetch(s.url,{cache:'no-cache'}).then(function(r){return r.json();}).then(function(j){ try{ s.pick(j); }catch(e){} }).catch(function(){}).then(function(){
        if(++done===srcs.length){ pool.words=uniq(pool.words); pool.bases=uniq(pool.bases); cb(pool); }
      });
    });
  }

  function makeLevel(pool){
    if(!pool||!pool.bases.length)return null;
    for(var attempt=0;attempt<60;attempt++){
      var base=pool.bases[Math.floor(Math.random()*pool.bases.length)];
      var cands=[];
      for(var i=0;i<pool.words.length;i++){ var w=pool.words[i]; if(w!==base&&w.length<=base.length&&isSub(w,base))cands.push(w); }
      if(cands.length<3)continue;
      shuffle(cands);
      var chosen=cands.slice(0,Math.min(8,cands.length));
      chosen.push(base); chosen=uniq(chosen);
      if(chosen.length<3)continue;
      var res=tryGrid(chosen);
      if(!res){ for(var d=0; d<chosen.length && !res; d++){ var sub=chosen.slice(); sub.splice(d,1); if(sub.length>=3)res=tryGrid(sub); } if(res)chosen=null; }
      if(!res)continue;
      var grid=res.placed.map(function(p){ return {r:p.r,c:p.c,dir:p.dir,answer:p.w}; });
      var words=res.placed.map(function(p){ return {w:p.w,tr:pool.gloss[p.w]||''}; });
      return { theme:'Sonsuz', letters:base, cols:res.cols, rows:res.rows, grid:grid, words:words };
    }
    return null;
  }

  window.GriWheelEndless={ buildPool:buildPool, makeLevel:makeLevel };
})();
