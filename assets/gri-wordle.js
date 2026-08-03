/* gri-wordle.js — paylaşılan Wordle motoru (kelime tahmin oyunu)
 * Bağımsız: kendi CSS'ini enjekte eder, main.css'e güvenmez.
 * GriWordle.mount(el, {answer, tr, ex, maxRows=6, state, onChange, onFinish, readOnly}) -> inst
 *   inst.getState() -> {guesses:[...], done:bool, win:bool}
 *   inst.setState(st); inst.isDone(); inst.result() -> {done,win,tries}
 */
(function(){
  if(window.GriWordle)return;

  /* Aktif instance: fiziksel klavye yalnız son etkileşilen board'a gitsin.
   * Tek-wordle sayfalarında ilk (ve tek) mount otomatik aktif olur → davranış aynı. */
  var activeInst=null;

  function injectCss(){
    if(document.getElementById('gri-wd-css'))return;
    var s=document.createElement('style'); s.id='gri-wd-css';
    s.textContent=[
      /* Gri kimliği: krem kağıt hücreler, altın/teal/yeşil aksan; tema site data-theme ile */
      '.gwd{--gwd-line:#d9cfbb;--gwd-cell:#fffdf7;--gwd-ink:#2b2118;--gwd-empty:#f6f0e4;--gwd-key:#ece2cf;--gwd-keyink:#3a2f22;--gwd-ok:#2E6E4E;--gwd-pre:#C79A3A;--gwd-no:#7c766b;font-family:inherit;display:flex;flex-direction:column;align-items:center;gap:16px;width:100%;}',
      ':root[data-theme="dark"] .gwd{--gwd-line:#4a4133;--gwd-cell:#2f2a21;--gwd-ink:#f0e9db;--gwd-empty:#26221a;--gwd-key:#3c352b;--gwd-keyink:#ece2cf;--gwd-ok:#3f9068;--gwd-pre:#cfa441;--gwd-no:#4a4235;}',
      '.gwd-board{display:grid;gap:7px;margin:0 auto;}',
      '.gwd-row{display:grid;gap:7px;grid-template-columns:repeat(var(--n),1fr);}',
      '.gwd-t{width:56px;height:56px;max-width:14.5vw;max-height:14.5vw;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:26px;text-transform:uppercase;border:2px solid var(--gwd-line);background:var(--gwd-empty);color:var(--gwd-ink);border-radius:9px;box-sizing:border-box;transition:transform .1s,border-color .1s;}',
      '.gwd-t.filled{background:var(--gwd-cell);border-color:var(--gwd-pre);animation:gwdpop .1s;}',
      '@keyframes gwdpop{0%{transform:scale(.88)}100%{transform:scale(1)}}',
      '.gwd-t.ok{background:var(--gwd-ok);border-color:var(--gwd-ok);color:#fff;}',
      '.gwd-t.pre{background:var(--gwd-pre);border-color:var(--gwd-pre);color:#fff;}',
      '.gwd-t.no{background:var(--gwd-no);border-color:var(--gwd-no);color:#fff;}',
      '.gwd-t.rev{animation:gwdflip .5s ease;}',
      '@keyframes gwdflip{0%{transform:rotateX(0)}50%{transform:rotateX(90deg)}100%{transform:rotateX(0)}}',
      '.gwd-hint{font-size:.84rem;font-weight:600;color:var(--gwd-ink);opacity:.85;background:var(--gwd-empty);border:1px solid var(--gwd-line);border-radius:20px;padding:5px 15px;}',
      '.gwd-hint b{color:var(--gwd-pre);}',
      '.gwd-msg{min-height:1.2em;font-weight:700;font-size:.95rem;text-align:center;color:var(--gwd-ink);}',
      '.gwd-msg.err{color:#c0392b;}',
      '.gwd-kb{display:flex;flex-direction:column;gap:8px;width:100%;max-width:500px;}',
      '.gwd-kr{display:flex;gap:6px;justify-content:center;}',
      '.gwd-k{flex:1;min-width:0;height:54px;border:1px solid var(--gwd-line);border-radius:9px;background:var(--gwd-key);color:var(--gwd-keyink);font-weight:700;font-size:15px;cursor:pointer;text-transform:uppercase;font-family:inherit;transition:transform .06s;}',
      '.gwd-k:active{transform:scale(.94);}',
      '.gwd-k.wide{flex:1.6;font-size:12px;}',
      '.gwd-k.ok{background:var(--gwd-ok);color:#fff;border-color:var(--gwd-ok);}',
      '.gwd-k.pre{background:var(--gwd-pre);color:#fff;border-color:var(--gwd-pre);}',
      '.gwd-k.no{background:var(--gwd-no);color:#fff;border-color:var(--gwd-no);}',
      '.gwd-done{width:100%;max-width:500px;text-align:center;padding:16px 18px;border:1px solid var(--gwd-line);border-radius:14px;background:var(--gwd-cell);box-shadow:0 6px 20px rgba(43,33,24,.08);}',
      '.gwd-done .w{font-family:var(--font-display,Georgia,serif);font-size:1.7rem;font-weight:800;letter-spacing:.08em;color:var(--gwd-ink);}',
      '.gwd-say{font-size:1rem;background:none;border:0;cursor:pointer;vertical-align:middle;opacity:.7;padding:2px 4px;}.gwd-say:hover{opacity:1;}',
      '.gwd-done .tr{font-size:1.08rem;font-weight:700;color:var(--gwd-ok);margin-top:4px;}',
      '.gwd-done .ex{font-size:.92rem;opacity:.82;margin-top:7px;font-style:italic;color:var(--gwd-ink);}',
      '.gwd-done .res{font-size:.92rem;font-weight:700;margin-bottom:7px;color:var(--gwd-ink);}'
    ].join('');
    document.head.appendChild(s);
  }

  var ROWS_KB=['QWERTYUIOP','ASDFGHJKL','ZXCVBNM'];
  function norm(s){ return String(s||'').toUpperCase().replace(/[^A-Z]/g,''); }

  /* Wordle skorlama — tekrarlı harf kurallı */
  function score(guess,answer){
    var n=answer.length, res=new Array(n), tally={};
    for(var i=0;i<n;i++){ var a=answer.charAt(i); tally[a]=(tally[a]||0)+1; }
    for(i=0;i<n;i++){ if(guess.charAt(i)===answer.charAt(i)){ res[i]='ok'; tally[guess.charAt(i)]--; } }
    for(i=0;i<n;i++){ if(res[i])continue; var g=guess.charAt(i);
      if(tally[g]>0){ res[i]='pre'; tally[g]--; } else res[i]='no'; }
    return res;
  }

  function mount(host, opts){
    injectCss();
    opts=opts||{};
    var answer=norm(opts.answer), N=answer.length, MAX=opts.maxRows||6;
    if(!N)return null;
    host.className=(host.className||'')+' gwd';
    host.innerHTML='';
    if(opts.hint){ var hintEl=document.createElement('div'); hintEl.className='gwd-hint'; hintEl.innerHTML='İpucu · <b>'+esc(opts.hint)+'</b>'; host.appendChild(hintEl); }

    var st={guesses:(opts.state&&opts.state.guesses)?opts.state.guesses.slice():[], done:!!(opts.state&&opts.state.done), win:!!(opts.state&&opts.state.win)};
    var cur=''; /* current typing row */
    var keyState={}; /* letter -> best state */
    var replaying=false;

    var board=document.createElement('div'); board.className='gwd-board';
    var msg=document.createElement('div'); msg.className='gwd-msg';
    var tiles=[]; /* [row][col] */
    for(var r=0;r<MAX;r++){
      var row=document.createElement('div'); row.className='gwd-row'; row.style.setProperty('--n',N);
      var tr=[];
      for(var c=0;c<N;c++){ var t=document.createElement('div'); t.className='gwd-t'; row.appendChild(t); tr.push(t); }
      board.appendChild(row); tiles.push(tr);
    }
    host.appendChild(board); host.appendChild(msg);

    var kb=null, keyEls={};
    if(!opts.readOnly){
      kb=document.createElement('div'); kb.className='gwd-kb';
      ROWS_KB.forEach(function(rowStr,ri){
        var kr=document.createElement('div'); kr.className='gwd-kr';
        if(ri===2){ kr.appendChild(mkKey('ENTER','ENTER',true)); }
        for(var i=0;i<rowStr.length;i++){ kr.appendChild(mkKey(rowStr.charAt(i),rowStr.charAt(i),false)); }
        if(ri===2){ kr.appendChild(mkKey('⌫','BACK',true)); }
        kb.appendChild(kr);
      });
      host.appendChild(kb);
    }
    function mkKey(label,val,wide){
      var b=document.createElement('button'); b.type='button'; b.className='gwd-k'+(wide?' wide':''); b.textContent=label; b.setAttribute('data-key',val);
      b.addEventListener('click',function(){ handle(val); });
      if(!wide)keyEls[val]=b;
      return b;
    }

    /* Host'a dokunma/tıklama gelince bu instance'ı aktif yap (klavye ona odaklansın) */
    if(!opts.readOnly)host.addEventListener('pointerdown',function(){ activeInst=inst; });

    var doneCard=null;

    function paintRow(ri,guess,res){
      for(var c=0;c<N;c++){
        var t=tiles[ri][c];
        t.textContent=guess.charAt(c);
        t.className='gwd-t filled '+res[c]+' rev';
        (function(t){ setTimeout(function(){ t.className=t.className.replace(/\s*\brev\b/g,''); },500); })(t);
        var g=guess.charAt(c), s=res[c], prev=keyState[g];
        var rank={no:1,pre:2,ok:3};
        if(!prev||rank[s]>rank[prev]){ keyState[g]=s; if(keyEls[g])keyEls[g].className='gwd-k '+s; }
      }
    }
    function renderCurrent(){
      if(st.done)return;
      var ri=st.guesses.length;
      for(var c=0;c<N;c++){ var t=tiles[ri]&&tiles[ri][c]; if(!t)continue; var ch=cur.charAt(c)||''; t.textContent=ch; t.className='gwd-t'+(ch?' filled':''); }
    }
    function flash(m){ msg.textContent=m; msg.className='gwd-msg err'; setTimeout(function(){ if(msg.textContent===m){msg.textContent='';msg.className='gwd-msg';} },1400); }

    function finish(win){
      st.done=true; st.win=win;
      if(win&&!replaying&&window.GriConfetti)window.GriConfetti.burst();
      doneCard=document.createElement('div'); doneCard.className='gwd-done';
      doneCard.innerHTML='<div class="res">'+(win?'Tebrikler! '+st.guesses.length+'/'+MAX+' denemede buldun.':'Bitti — doğru kelime:')+'</div>'
        +'<div class="w">'+answer+' <button type="button" class="gwd-say" aria-label="Sesli oku">🔊</button></div>'
        +(opts.tr?'<div class="tr">'+esc(opts.tr)+'</div>':'')
        +(opts.ex?'<div class="ex">'+esc(opts.ex)+'</div>':'');
      host.appendChild(doneCard);
      var sayb=doneCard.querySelector('.gwd-say'); if(sayb)sayb.addEventListener('click',function(){ if(window.GriFX)GriFX.speak(answer); });
      if(kb)kb.style.opacity='.5';
      if(!replaying&&window.GriFX){ if(win)GriFX.sound('win'); GriFX.speak(answer); }
      if(!replaying){
        if(opts.onChange)opts.onChange(inst);
        if(opts.onFinish)opts.onFinish({win:win,tries:win?st.guesses.length:MAX});
      }
    }

    function submit(){
      if(st.done)return;
      if(cur.length<N){ flash('Yetersiz harf'); shake(st.guesses.length); return; }
      var guess=cur, res=score(guess,answer);
      st.guesses.push(guess);
      paintRow(st.guesses.length-1,guess,res);
      cur='';
      if(opts.onChange)opts.onChange(inst);
      if(guess===answer){ setTimeout(function(){ finish(true); },600); return; }
      if(st.guesses.length>=MAX){ setTimeout(function(){ finish(false); },600); }
    }
    function shake(ri){ var row=board.children[ri]; if(!row)return; row.style.animation='none'; row.offsetHeight; row.style.animation='gwdshake .4s'; }

    function handle(val){
      if(st.done||opts.readOnly)return;
      if(val==='ENTER'){ submit(); return; }
      if(val==='BACK'){ cur=cur.slice(0,-1); renderCurrent(); return; }
      if(/^[A-Z]$/.test(val)){ if(cur.length<N){ cur+=val; renderCurrent(); } }
    }

    function onKey(e){
      if(activeInst!==inst)return; /* yalnız aktif board fiziksel klavyeyi işlesin (çapraz-besleme fix) */
      if(st.done)return;
      if(e.key==='Enter'){ handle('ENTER'); }
      else if(e.key==='Backspace'){ handle('BACK'); e.preventDefault(); }
      else { var k=norm(e.key); if(k.length===1) handle(k); }
    }
    if(!opts.readOnly)document.addEventListener('keydown',onKey);

    /* replay saved guesses */
    (function replay(){
      for(var i=0;i<st.guesses.length;i++){ var g=st.guesses[i]; paintRow(i,g,score(g,answer)); }
      if(st.done){ st.done=false; replaying=true; finish(st.win||st.guesses.indexOf(answer)>=0); replaying=false; }
    })();

    /* shake keyframes (once) */
    if(!document.getElementById('gri-wd-shake')){ var sk=document.createElement('style'); sk.id='gri-wd-shake'; sk.textContent='@keyframes gwdshake{10%,90%{transform:translateX(-2px)}20%,80%{transform:translateX(4px)}30%,50%,70%{transform:translateX(-7px)}40%,60%{transform:translateX(7px)}}'; document.head.appendChild(sk); }

    var inst={
      getState:function(){ return {guesses:st.guesses.slice(),done:st.done,win:st.win}; },
      setState:function(s){ /* not needed post-mount; state passed at mount */ },
      isDone:function(){ return st.done; },
      result:function(){ return {done:st.done,win:st.win,tries:st.done?(st.win?st.guesses.length:MAX):0}; },
      destroy:function(){ if(!opts.readOnly)document.removeEventListener('keydown',onKey); if(activeInst===inst)activeInst=null; }
    };
    /* İlk (tek) etkileşimli board otomatik aktif: tek-wordle sayfası tıklamasız çalışır (regresyon yok) */
    if(!opts.readOnly&&activeInst===null)activeInst=inst;
    return inst;
  }

  function esc(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  window.GriWordle={ mount:mount, score:score };
})();
