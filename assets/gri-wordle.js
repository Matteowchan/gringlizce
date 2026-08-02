/* gri-wordle.js — paylaşılan Wordle motoru (kelime tahmin oyunu)
 * Bağımsız: kendi CSS'ini enjekte eder, main.css'e güvenmez.
 * GriWordle.mount(el, {answer, tr, ex, maxRows=6, state, onChange, onFinish, readOnly}) -> inst
 *   inst.getState() -> {guesses:[...], done:bool, win:bool}
 *   inst.setState(st); inst.isDone(); inst.result() -> {done,win,tries}
 */
(function(){
  if(window.GriWordle)return;

  function injectCss(){
    if(document.getElementById('gri-wd-css'))return;
    var s=document.createElement('style'); s.id='gri-wd-css';
    s.textContent=[
      '.gwd{--gwd-line:#c9bda6;--gwd-cell:#fffdf7;--gwd-ink:#2b2118;--gwd-empty:#efe8db;--gwd-key:#e7ddca;--gwd-keyink:#2b2118;--gwd-ok:#4c9f70;--gwd-pre:#d8a838;--gwd-no:#9a9184;font-family:inherit;display:flex;flex-direction:column;align-items:center;gap:16px;width:100%;}',
      '@media (prefers-color-scheme:dark){.gwd{--gwd-line:#3a352c;--gwd-cell:#2b271f;--gwd-ink:#f0e9db;--gwd-empty:#232019;--gwd-key:#3a352c;--gwd-keyink:#f0e9db;--gwd-no:#4a453b;}}',
      '.gwd-board{display:grid;gap:6px;margin:0 auto;}',
      '.gwd-row{display:grid;gap:6px;grid-template-columns:repeat(var(--n),1fr);}',
      '.gwd-t{width:54px;height:54px;max-width:14vw;max-height:14vw;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:26px;text-transform:uppercase;border:2px solid var(--gwd-line);background:var(--gwd-empty);color:var(--gwd-ink);border-radius:6px;box-sizing:border-box;transition:transform .1s;}',
      '.gwd-t.filled{background:var(--gwd-cell);border-color:var(--gwd-ink);animation:gwdpop .1s;}',
      '@keyframes gwdpop{0%{transform:scale(.9)}100%{transform:scale(1)}}',
      '.gwd-t.ok{background:var(--gwd-ok);border-color:var(--gwd-ok);color:#fff;}',
      '.gwd-t.pre{background:var(--gwd-pre);border-color:var(--gwd-pre);color:#fff;}',
      '.gwd-t.no{background:var(--gwd-no);border-color:var(--gwd-no);color:#fff;}',
      '.gwd-t.rev{animation:gwdflip .5s ease;}',
      '@keyframes gwdflip{0%{transform:rotateX(0)}50%{transform:rotateX(90deg)}100%{transform:rotateX(0)}}',
      '.gwd-msg{min-height:1.2em;font-weight:700;font-size:.95rem;text-align:center;}',
      '.gwd-msg.err{color:#c0392b;}',
      '.gwd-kb{display:flex;flex-direction:column;gap:7px;width:100%;max-width:520px;}',
      '.gwd-kr{display:flex;gap:5px;justify-content:center;}',
      '.gwd-k{flex:1;min-width:0;height:52px;border:0;border-radius:7px;background:var(--gwd-key);color:var(--gwd-keyink);font-weight:700;font-size:15px;cursor:pointer;text-transform:uppercase;font-family:inherit;transition:transform .06s;}',
      '.gwd-k:active{transform:scale(.94);}',
      '.gwd-k.wide{flex:1.6;font-size:12px;}',
      '.gwd-k.ok{background:var(--gwd-ok);color:#fff;}',
      '.gwd-k.pre{background:var(--gwd-pre);color:#fff;}',
      '.gwd-k.no{background:var(--gwd-no);color:#fff;}',
      '.gwd-done{width:100%;max-width:520px;text-align:center;padding:14px 16px;border:1px solid var(--gwd-line);border-radius:12px;background:var(--gwd-cell);}',
      '.gwd-done .w{font-size:1.5rem;font-weight:800;letter-spacing:.06em;color:var(--gwd-ink);}',
      '.gwd-done .tr{font-size:1.05rem;font-weight:700;color:var(--gwd-ok);margin-top:3px;}',
      '.gwd-done .ex{font-size:.92rem;opacity:.82;margin-top:6px;font-style:italic;}',
      '.gwd-done .res{font-size:.9rem;font-weight:700;margin-bottom:6px;}'
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
      doneCard=document.createElement('div'); doneCard.className='gwd-done';
      var tries=win?st.guesses.length:('X');
      doneCard.innerHTML='<div class="res">'+(win?'Tebrikler! '+st.guesses.length+'/'+MAX+' denemede buldun.':'Bitti — doğru kelime:')+'</div>'
        +'<div class="w">'+answer+'</div>'
        +(opts.tr?'<div class="tr">'+esc(opts.tr)+'</div>':'')
        +(opts.ex?'<div class="ex">'+esc(opts.ex)+'</div>':'');
      host.appendChild(doneCard);
      if(kb)kb.style.opacity='.5';
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
      destroy:function(){ if(!opts.readOnly)document.removeEventListener('keydown',onKey); }
    };
    return inst;
  }

  function esc(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  window.GriWordle={ mount:mount, score:score };
})();
