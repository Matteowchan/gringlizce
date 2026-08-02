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
      '.gcw{--gcw-line:#d7cfc3;--gcw-blank:#efe8dc;--gcw-bg:#fff;--gcw-num:#8a7f6d;--gcw-hl:#fff4d6;--gcw-hlb:#f0c667;--gcw-ok:#1f8a4c;--gcw-okbg:#e4f5ea;--gcw-bad:#c0392b;--gcw-badbg:#fbe7e4;font-family:inherit;}',
      '@media (prefers-color-scheme:dark){.gcw{--gcw-line:#3a352c;--gcw-blank:#232019;--gcw-bg:#2b271f;--gcw-num:#a99a7f;--gcw-hl:#4a3f22;--gcw-hlb:#7a6425;--gcw-okbg:#1c3327;--gcw-badbg:#3a201c;}}',
      '.gcw-grid{display:grid;gap:2px;background:var(--gcw-line);border:2px solid var(--gcw-line);border-radius:8px;padding:2px;width:max-content;max-width:100%;overflow:auto;margin:0 0 6px;}',
      '.gcw-c{position:relative;width:34px;height:34px;background:var(--gcw-bg);}',
      '.gcw-c.blank{background:var(--gcw-blank);}',
      '.gcw-c input{position:absolute;inset:0;width:100%;height:100%;border:0;background:transparent;text-align:center;font-size:16px;font-weight:700;text-transform:uppercase;color:inherit;caret-color:var(--gcw-hlb);padding:0;margin:0;}',
      '.gcw-c input:focus{outline:0;background:var(--gcw-hl);}',
      '.gcw-c.hl{background:var(--gcw-hl);}',
      '.gcw-c.ok input{color:var(--gcw-ok);}.gcw-c.ok{background:var(--gcw-okbg);}',
      '.gcw-c.bad input{color:var(--gcw-bad);}.gcw-c.bad{background:var(--gcw-badbg);}',
      '.gcw-n{position:absolute;top:1px;left:2px;font-size:9px;line-height:1;color:var(--gcw-num);font-weight:700;pointer-events:none;}',
      '.gcw-clues{display:grid;grid-template-columns:1fr 1fr;gap:14px 22px;margin-top:10px;}',
      '@media(max-width:560px){.gcw-clues{grid-template-columns:1fr;}.gcw-c{width:30px;height:30px;}.gcw-c input{font-size:14px;}}',
      '.gcw-cluecol h4{margin:0 0 6px;font-size:.82rem;letter-spacing:.04em;text-transform:uppercase;opacity:.75;}',
      '.gcw-clue{display:flex;gap:7px;font-size:.9rem;line-height:1.4;padding:3px 5px;border-radius:6px;cursor:pointer;}',
      '.gcw-clue:hover{background:var(--gcw-hl);}',
      '.gcw-clue.cur{background:var(--gcw-hl);box-shadow:inset 0 0 0 1px var(--gcw-hlb);}',
      '.gcw-clue.solved{opacity:.55;}',
      '.gcw-clue b{color:var(--gcw-num);min-width:16px;text-align:right;}'
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
    var active={ent:null};

    /* grid */
    var grid=document.createElement('div');
    grid.className='gcw-grid';
    grid.style.gridTemplateColumns='repeat('+cols+',auto)';
    for(var r=0;r<rows;r++){
      for(var c=0;c<cols;c++){
        var k=ck(r,c), cell=cells[k];
        var div=document.createElement('div');
        if(!cell){ div.className='gcw-c blank'; grid.appendChild(div); continue; }
        div.className='gcw-c'; div.setAttribute('data-k',k);
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
    host.innerHTML=''; host.appendChild(grid);

    /* clues */
    var cluesWrap=document.createElement('div'); cluesWrap.className='gcw-clues';
    var across=entries.filter(function(e){return e.dir==='across';}).sort(function(a,b){return a.num-b.num;});
    var down=entries.filter(function(e){return e.dir==='down';}).sort(function(a,b){return a.num-b.num;});
    function col(title,list){
      var col=document.createElement('div'); col.className='gcw-cluecol';
      var h=document.createElement('h4'); h.textContent=title; col.appendChild(h);
      list.forEach(function(e){
        var d=document.createElement('div'); d.className='gcw-clue'; d.setAttribute('data-en',e.dir+'-'+e.num);
        d.innerHTML='<b>'+e.num+'</b><span>'+escapeHtml(e.clue)+'</span>';
        d.addEventListener('click',function(){ focusEntry(e); });
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
      if(el.value&&active.ent){ var nk=nextInEntry(active.ent,k,1); if(nk&&inputs[nk])inputs[nk].focus(); }
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
        var o=(st&&st.cw)||{}; for(var k in inputs){ inputs[k].value=o[k]?norm(o[k]).slice(0,1):''; inputs[k].parentNode.className=inputs[k].parentNode.className.replace(/\s*\b(ok|bad)\b/g,''); }
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
    return inst;
  }

  function escapeHtml(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  window.GriCrossword={ mount:mount };
})();
