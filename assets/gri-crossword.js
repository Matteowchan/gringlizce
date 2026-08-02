/* gri-crossword.js — paylaşılan interaktif crossword (bulmaca) çözücü
 * Bağımsız: kendi CSS'ini enjekte eder, main.css'e güvenmez.
 * Kullanım:
 *   var inst = GriCrossword.mount(el, task, {value, readOnly, onChange});
 *   inst.isFilled(); inst.getState(); inst.setState(obj);
 *   inst.check() -> {correct,total,cellsFilled,cellsTotal};
 *   inst.gradeSilent() -> {correct,total};
 * task = {type:'crossword', cols, rows, entries:[{num,dir:'across'|'down',row,col,answer,clue}]}
 */
(function(){
  if(window.GriCrossword)return;

  function injectCss(){
    if(document.getElementById('gri-cw-css'))return;
    var s=document.createElement('style');
    s.id='gri-cw-css';
    s.textContent=[
      /* kağıt üzerine bulmaca — her iki temada da açık hücre + koyu mürekkep */
      '.gcw{--gcw-cell:#fffdf7;--gcw-ink:#2b2118;--gcw-line:#c9bda6;--gcw-num:#a08a63;--gcw-hl:#fff1c2;--gcw-hlb:#e6a92e;--gcw-ok:#177a41;--gcw-okbg:#dff3e4;--gcw-bad:#c0392b;--gcw-badbg:#fbe3df;font-family:inherit;}',
      '.gcw-scroll{width:100%;overflow:auto;padding:4px 0 8px;-webkit-overflow-scrolling:touch;}',
      '.gcw-grid{display:grid;gap:0;width:max-content;margin:0 auto;background:transparent;}',
      '.gcw-c{position:relative;width:36px;height:36px;box-sizing:border-box;}',
      '.gcw-c.open{background:var(--gcw-cell);border:1px solid var(--gcw-line);margin:-0.5px;}',
      '.gcw-c.blank{background:transparent;border:0;}',
      '.gcw-c input{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;box-sizing:border-box!important;border:0!important;border-radius:0!important;background:transparent!important;box-shadow:none!important;text-align:center!important;font:700 17px/1 inherit!important;text-transform:uppercase!important;color:var(--gcw-ink)!important;caret-color:var(--gcw-hlb)!important;padding:0!important;margin:0!important;min-height:0!important;-webkit-appearance:none!important;appearance:none!important;}',
      '.gcw-c input:focus{outline:0!important;}',
      '.gcw-c.open input:focus{background:var(--gcw-hl)!important;}',
      '.gcw-c.hl{background:var(--gcw-hl);}',
      '.gcw-c.ok{background:var(--gcw-okbg);}.gcw-c.ok input{color:var(--gcw-ok)!important;}',
      '.gcw-c.bad{background:var(--gcw-badbg);}.gcw-c.bad input{color:var(--gcw-bad)!important;}',
      '.gcw-c.given{background:#e7eefb;}.gcw-c.given input{color:#2c5a82!important;font-weight:800!important;}',
      '.gcw-c.hint{background:var(--gcw-hl);}.gcw-c.hint input{color:var(--gcw-hlb)!important;}',
      '.gcw-n{position:absolute;top:1px;left:2px;font-size:9px;line-height:1;color:var(--gcw-num);font-weight:700;pointer-events:none;z-index:1;}',
      '.gcw-clues{display:grid;grid-template-columns:1fr 1fr;gap:16px 24px;margin-top:14px;}',
      '@media(max-width:560px){.gcw-clues{grid-template-columns:1fr;}.gcw-c{width:32px;height:32px;}.gcw-c input{font:700 15px/1 inherit!important;}}',
      '.gcw-cluecol h4{margin:0 0 8px;font-size:.78rem;letter-spacing:.06em;text-transform:uppercase;color:var(--gcw-hlb);font-weight:800;}',
      '.gcw-clue{display:flex;gap:8px;font-size:.92rem;line-height:1.45;padding:4px 7px;border-radius:7px;cursor:pointer;transition:background .12s;}',
      '.gcw-clue:hover{background:var(--gcw-hl);}',
      '.gcw-clue.cur{background:var(--gcw-hl);box-shadow:inset 0 0 0 1.5px var(--gcw-hlb);}',
      '.gcw-clue.solved{opacity:.5;text-decoration:line-through;}',
      '.gcw-clue.solved .gcw-hint{display:none;}',
      '.gcw-clue b{color:var(--gcw-hlb);min-width:16px;text-align:right;font-weight:800;flex:none;}',
      '.gcw-clue span{color:inherit;flex:1;}',
      '.gcw-len{font-style:normal;color:var(--gcw-num);font-weight:600;white-space:nowrap;}',
      '.gcw-ex{font-style:normal;margin-left:6px;font-size:.68rem;font-weight:800;color:#2c5a82;background:rgba(58,110,168,.16);padding:1px 7px;border-radius:6px;text-transform:uppercase;letter-spacing:.04em;vertical-align:1px;}',
      '@media (prefers-color-scheme:dark){.gcw-ex{color:#8ab8e0;}}',
      '.gcw-hint{flex:none;align-self:flex-start;margin-top:1px;font:700 .72rem/1 inherit;color:var(--gcw-hlb);background:transparent;border:1px solid var(--gcw-hlb);border-radius:6px;padding:3px 9px;cursor:pointer;opacity:.7;transition:opacity .12s,background .12s;}',
      '.gcw-hint:hover{opacity:1;background:var(--gcw-hl);}'
    ].join('');
    document.head.appendChild(s);
  }

  function norm(ch){ return String(ch||'').toUpperCase().replace(/[^A-ZÇĞİÖŞÜ]/g,''); }
  function ck(r,c){ return r+'_'+c; }

  function mount(host, task, opts){
    injectCss();
    opts=opts||{};
    var entries=(task.entries||[]).map(function(e){
      return {num:e.num, dir:(e.dir==='down'?'down':'across'), row:e.row|0, col:e.col|0,
              answer:String(e.answer||'').toUpperCase(), clue:e.clue||''};
    });
    /* build cell model */
    var cells={}, maxR=0, maxC=0;
    entries.forEach(function(e){
      for(var i=0;i<e.answer.length;i++){
        var r=e.row+(e.dir==='down'?i:0), c=e.col+(e.dir==='across'?i:0);
        var k=ck(r,c);
        if(!cells[k])cells[k]={r:r,c:c,sol:norm(e.answer.charAt(i)),ents:[],num:null};
        cells[k].ents.push(e);
        if(i===0&&cells[k].num==null)cells[k].num=e.num;
        if(r>maxR)maxR=r; if(c>maxC)maxC=c;
      }
    });
    var cols=task.cols||maxC+1, rows=task.rows||maxR+1;

    host.className=(host.className||'')+' gcw';
    var inputs={}; /* k -> input el */
    var given={};  /* k -> true (örnek/verili hücre, kilitli) */
    var active={ent:null};
    /* çözülmüş örnek kelime: task.example {num,dir} verilirse o, yoksa en kısa kelime (az spoiler) */
    var exEnt=(task.example&&typeof task.example==='object')
      ? entries.filter(function(e){return e.num===task.example.num&&e.dir===task.example.dir;})[0]
      : entries.slice().sort(function(a,b){return a.answer.length-b.answer.length;})[0];

    /* grid */
    var scroll=document.createElement('div'); scroll.className='gcw-scroll';
    var grid=document.createElement('div');
    grid.className='gcw-grid';
    grid.style.gridTemplateColumns='repeat('+cols+',36px)';
    for(var r=0;r<rows;r++){
      for(var c=0;c<cols;c++){
        var k=ck(r,c), cell=cells[k];
        var div=document.createElement('div');
        if(!cell){ div.className='gcw-c blank'; grid.appendChild(div); continue; }
        div.className='gcw-c open'; div.setAttribute('data-k',k);
        if(cell.num!=null){ var n=document.createElement('span'); n.className='gcw-n'; n.textContent=cell.num; div.appendChild(n); }
        var inp=document.createElement('input');
        inp.type='text'; inp.setAttribute('maxlength','1');
        inp.autocomplete='off'; inp.autocapitalize='characters'; inp.spellcheck=false;
        inp.setAttribute('data-k',k);
        if(opts.readOnly)inp.readOnly=true;
        div.appendChild(inp); grid.appendChild(div);
        inputs[k]=inp;
      }
    }
    host.innerHTML=''; scroll.appendChild(grid); host.appendChild(scroll);

    /* clues */
    var cluesWrap=document.createElement('div'); cluesWrap.className='gcw-clues';
    var across=entries.filter(function(e){return e.dir==='across';}).sort(function(a,b){return a.num-b.num;});
    var down=entries.filter(function(e){return e.dir==='down';}).sort(function(a,b){return a.num-b.num;});
    function col(title,list){
      var col=document.createElement('div'); col.className='gcw-cluecol';
      var h=document.createElement('h4'); h.textContent=title; col.appendChild(h);
      list.forEach(function(e){
        var d=document.createElement('div'); d.className='gcw-clue'+(e===exEnt?' isex':''); d.setAttribute('data-en',e.dir+'-'+e.num);
        var ex=(e===exEnt)?'<em class="gcw-ex">örnek</em>':'';
        var btn=(e===exEnt)?'':'<button type="button" class="gcw-hint" tabindex="-1">ipucu</button>';
        d.innerHTML='<b>'+e.num+'</b><span>'+escapeHtml(e.clue)+' <i class="gcw-len">('+e.answer.length+')</i>'+ex+'</span>'+btn;
        d.addEventListener('click',function(ev){
          if(ev.target&&ev.target.className&&ev.target.className.indexOf('gcw-hint')>-1){ revealHint(e); ev.stopPropagation(); return; }
          focusEntry(e);
        });
        col.appendChild(d); e._el=d;
      });
      return col;
    }
    if(across.length)cluesWrap.appendChild(col('Soldan Sağa · Across',across));
    if(down.length)cluesWrap.appendChild(col('Yukarıdan Aşağıya · Down',down));
    host.appendChild(cluesWrap);

    /* helpers */
    function entryCells(e){
      var arr=[];
      for(var i=0;i<e.answer.length;i++){
        var r=e.row+(e.dir==='down'?i:0), c=e.col+(e.dir==='across'?i:0);
        arr.push(ck(r,c));
      }
      return arr;
    }
    function clearHl(){
      for(var k in inputs){ inputs[k].parentNode.className=inputs[k].parentNode.className.replace(/\s*\bhl\b/g,''); }
      entries.forEach(function(e){ if(e._el)e._el.className=e._el.className.replace(/\s*\bcur\b/g,''); });
    }
    function highlight(e){
      clearHl();
      if(!e)return;
      entryCells(e).forEach(function(k){ if(inputs[k])inputs[k].parentNode.className+=' hl'; });
      if(e._el)e._el.className+=' cur';
    }
    function focusEntry(e){ active.ent=e; highlight(e); var k=entryCells(e)[0]; if(inputs[k])inputs[k].focus(); }
    function entriesAt(k){ return cells[k]?cells[k].ents:[]; }
    function nextInEntry(e,k,step){
      var arr=entryCells(e); var i=arr.indexOf(k)+step;
      if(i<0||i>=arr.length)return null; return arr[i];
    }
    function nextEditable(e,k,step){
      var nk=nextInEntry(e,k,step);
      while(nk&&given[nk])nk=nextInEntry(e,nk,step);
      return nk;
    }
    function applyExample(){
      if(!exEnt)return;
      var ks=entryCells(exEnt);
      for(var i=0;i<ks.length;i++){
        var inp=inputs[ks[i]]; if(!inp)continue;
        inp.value=norm(exEnt.answer.charAt(i)); inp.readOnly=true; given[ks[i]]=true;
        var p=inp.parentNode;
        if(p.className.indexOf('given')<0)p.className=p.className.replace(/\s*\b(ok|bad|hint)\b/g,'')+' given';
      }
    }
    function revealHint(e){
      var ks=entryCells(e);
      for(var i=0;i<ks.length;i++){
        var inp=inputs[ks[i]]; if(!inp||given[ks[i]])continue;
        if(norm(inp.value)!==cells[ks[i]].sol){
          inp.value=cells[ks[i]].sol;
          inp.parentNode.className=inp.parentNode.className.replace(/\s*\b(ok|bad)\b/g,'')+' hint';
          if(opts.onChange)opts.onChange(inst);
          return;
        }
      }
    }

    /* interactions */
    grid.addEventListener('focusin',function(ev){
      var k=ev.target.getAttribute&&ev.target.getAttribute('data-k'); if(!k)return;
      var es=entriesAt(k);
      if(!active.ent||es.indexOf(active.ent)<0){ active.ent=es[0]||null; }
      highlight(active.ent);
    });
    grid.addEventListener('click',function(ev){
      var k=ev.target.getAttribute&&ev.target.getAttribute('data-k'); if(!k)return;
      var es=entriesAt(k);
      if(es.length>1&&active.ent&&es.indexOf(active.ent)>=0){
        active.ent=es[(es.indexOf(active.ent)+1)%es.length];
      }else if(es.indexOf(active.ent)<0){ active.ent=es[0]||null; }
      highlight(active.ent);
    });
    grid.addEventListener('input',function(ev){
      var el=ev.target; var k=el.getAttribute('data-k'); if(!k)return;
      el.value=norm(el.value).slice(0,1);
      el.parentNode.className=el.parentNode.className.replace(/\s*\b(ok|bad)\b/g,'');
      if(el.value&&active.ent){ var nk=nextEditable(active.ent,k,1); if(nk&&inputs[nk])inputs[nk].focus(); }
      if(opts.onChange)opts.onChange(inst);
    });
    grid.addEventListener('keydown',function(ev){
      var el=ev.target; var k=el.getAttribute('data-k'); if(!k)return;
      var key=ev.key;
      if(key==='Backspace'&&!el.value&&active.ent){ var pk=nextInEntry(active.ent,k,-1); if(pk&&inputs[pk]){inputs[pk].value='';inputs[pk].focus();ev.preventDefault(); if(opts.onChange)opts.onChange(inst);} return; }
      var cur=cells[k]; if(!cur)return;
      function go(r,c){ var nk=ck(r,c); if(inputs[nk]){inputs[nk].focus();ev.preventDefault();} }
      if(key==='ArrowRight')go(cur.r,cur.c+1);
      else if(key==='ArrowLeft')go(cur.r,cur.c-1);
      else if(key==='ArrowDown')go(cur.r+1,cur.c);
      else if(key==='ArrowUp')go(cur.r-1,cur.c);
    });

    /* state / grading */
    var inst={
      task:task,
      getState:function(){ var o={}; for(var k in inputs){ if(inputs[k].value)o[k]=inputs[k].value; } return {cw:o}; },
      setState:function(st){
        var o=(st&&st.cw)||{}; for(var k in inputs){ if(given[k])continue; inputs[k].value=o[k]?norm(o[k]).slice(0,1):''; inputs[k].parentNode.className=inputs[k].parentNode.className.replace(/\s*\b(ok|bad)\b/g,''); }
        applyExample();
      },
      isFilled:function(){ for(var k in inputs){ if(!inputs[k].value)return false; } return true; },
      gradeSilent:function(){
        var correct=0;
        entries.forEach(function(e){
          var ok=true, ks=entryCells(e);
          for(var i=0;i<ks.length;i++){ if(norm(inputs[ks[i]].value)!==cells[ks[i]].sol){ok=false;break;} }
          if(ok)correct++;
        });
        return {correct:correct,total:entries.length};
      },
      check:function(){
        var cellsFilled=0,cellsTotal=0;
        for(var k in inputs){ cellsTotal++; if(inputs[k].value)cellsFilled++; }
        /* color cells */
        for(var k2 in inputs){
          var el=inputs[k2], p=el.parentNode;
          p.className=p.className.replace(/\s*\b(ok|bad)\b/g,'');
          if(!el.value)continue;
          p.className+=(norm(el.value)===cells[k2].sol?' ok':' bad');
        }
        /* mark solved clues */
        var g=this.gradeSilent();
        entries.forEach(function(e){
          if(!e._el)return;
          var ok=true, ks=entryCells(e);
          for(var i=0;i<ks.length;i++){ if(norm(inputs[ks[i]].value)!==cells[ks[i]].sol){ok=false;break;} }
          e._el.className=e._el.className.replace(/\s*\bsolved\b/g,'')+(ok?' solved':'');
        });
        return {correct:g.correct,total:g.total,cellsFilled:cellsFilled,cellsTotal:cellsTotal};
      }
    };
    if(opts.value)inst.setState({cw:opts.value});
    applyExample();
    return inst;
  }

  function escapeHtml(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  window.GriCrossword={ mount:mount };
})();
