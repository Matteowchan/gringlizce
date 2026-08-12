/* Gri IELTS deneme ekranları — soru gezgini + flag + cevap sayacı (reading/listening) */
(function(){
  function boot(){
    var container = document.getElementById('passagesContainer') || document.getElementById('testContainer');
    if(!container) return;
    // sadece soru olan ekranlarda (reading/listening) gezgini kur
    var flagged={}, built=false, cache=[];

    function inputsFor(n){ return container.querySelectorAll('[data-q="'+n+'"]'); }
    function isAnswered(n){
      var els=inputsFor(n); if(!els.length) return false;
      for(var i=0;i<els.length;i++){ var e=els[i];
        if(e.type==='checkbox'){ if(container.querySelectorAll('input[type=checkbox][data-q="'+n+'"]:checked').length) return true; }
        else if((e.value||'')!=='') return true;
      }
      return false;
    }
    function collect(){
      var items=[], seen={};
      container.querySelectorAll('.q-num-prefix').forEach(function(pf){
        var t=pf.textContent.replace(/[–—]/g,'-').trim();
        var m=t.match(/^(\d+)/); if(!m) return;
        var num=m[1]; if(seen[num]) return; seen[num]=1;
        var sec=pf.closest('[data-part-number]');
        items.push({num:num,part:sec?sec.getAttribute('data-part-number'):null,anchor:pf});
        if(!(pf.nextElementSibling && pf.nextElementSibling.classList.contains('ex-flag'))){
          var b=document.createElement('button'); b.type='button'; b.className='ex-flag'+(flagged[num]?' on':'');
          b.title='İşaretle / sonra dön'; b.setAttribute('data-flag',num); b.innerHTML='⚑';
          b.addEventListener('click',function(ev){ev.stopPropagation();flagged[num]=!flagged[num];b.classList.toggle('on',!!flagged[num]);refresh();});
          pf.insertAdjacentElement('afterend',b);
        }
      });
      items.sort(function(a,b){return (+a.num)-(+b.num);});
      return items;
    }
    var fab,panel,grid,count;
    function ensureUI(){
      if(fab) return;
      fab=document.createElement('button'); fab.type='button'; fab.className='ex-fab'; fab.setAttribute('aria-label','Soru gezgini');
      fab.innerHTML='<span>Sorular</span><b class="ex-count">0/0</b>';
      panel=document.createElement('div'); panel.className='ex-navpanel';
      panel.innerHTML='<h4>Soru Gezgini</h4><div class="ex-navgrid"></div><div class="ex-legend"><span><i style="background:var(--ex-accent)"></i>cevaplı</span><span><i style="border:1px solid var(--ex-line)"></i>boş</span><span><i style="background:var(--ex-warn-bg);border:1px solid var(--ex-warn)"></i>işaretli</span></div>';
      document.body.appendChild(fab); document.body.appendChild(panel);
      grid=panel.querySelector('.ex-navgrid'); count=fab.querySelector('.ex-count');
      fab.addEventListener('click',function(){ build(); panel.classList.toggle('open'); });
    }
    function build(){
      cache=collect(); if(!cache.length){ return; }
      ensureUI(); built=true; grid.innerHTML='';
      cache.forEach(function(it){
        var b=document.createElement('button'); b.type='button'; b.className='ex-navbtn'; b.textContent=it.num; b.setAttribute('data-nav',it.num);
        b.addEventListener('click',function(){
          try{ if(it.part && typeof window.setActivePart==='function') window.setActivePart(parseInt(it.part)); }catch(e){}
          setTimeout(function(){ it.anchor.scrollIntoView({behavior:'smooth',block:'center'}); },60);
          panel.classList.remove('open');
        });
        grid.appendChild(b);
      });
      refresh();
    }
    function refresh(){
      if(!built) return; var ans=0;
      cache.forEach(function(it){
        var a=isAnswered(it.num); if(a)ans++;
        var b=grid.querySelector('[data-nav="'+it.num+'"]'); if(b){b.classList.toggle('answered',a);b.classList.toggle('flag',!!flagged[it.num]);}
      });
      count.textContent=ans+'/'+cache.length;
    }
    document.addEventListener('input',function(e){ if(e.target.closest && e.target.closest('[data-q]')) { if(!built)build(); else refresh(); } });
    document.addEventListener('change',function(e){ if(e.target.closest && e.target.closest('[data-q]')) { if(!built)build(); else refresh(); } });
    // async render (Supabase) için gözlemle
    var obs=new MutationObserver(function(){ if(container.querySelector('.q-num-prefix') && (!built || container.querySelectorAll('.q-num-prefix').length!==cache.length)) build(); });
    obs.observe(container,{childList:true,subtree:true});
    setTimeout(build,900);

    // Passage highlight (reading): metni seç → sarı işaret; işarete tıkla → kaldır
    document.addEventListener('mouseup',function(){
      var sel=window.getSelection(); if(!sel||sel.isCollapsed||!sel.rangeCount) return;
      var r=sel.getRangeAt(0), a=r.commonAncestorContainer, node=a.nodeType===1?a:a.parentNode;
      if(!node.closest||!node.closest('.passage-content')) return;
      try{ var m=document.createElement('mark'); m.className='ex-hl'; r.surroundContents(m); sel.removeAllRanges(); }catch(e){}
    });
    document.addEventListener('click',function(e){
      var t=e.target; if(t.classList&&t.classList.contains('ex-hl')){ var p=t.parentNode; while(t.firstChild)p.insertBefore(t.firstChild,t); p.removeChild(t); if(p.normalize)p.normalize(); }
    });
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot();
})();

/* ===== Gri Meet senkron köprüsü — YALNIZ gmsync=1 embed'inde aktif =====
   Amaç: öğretmen (host) ile öğrenci aynı ekranı görsün. Runner, "Sınava Başla" ve
   passage/task geçişlerinde durumu parent'a (grimeet) postMessage'lar; grimeet host
   ise bunu odaya yayınlar, öğrenci grimeet'i öğrencinin runner iframe'ine apply eder.
   gmsync=1 YOKKEN (normal sınav) bu blok tamamen atlanır — davranış birebir eskisi gibi. */
(function(){
  var GMSYNC=false;
  try{ GMSYNC=new URLSearchParams(location.search).has('gmsync'); }catch(e){}
  if(!GMSYNC || window.parent===window) return; // normal sınav / üst pencere: köprü kapalı

  var applying=false; // apply sırasında yeniden-post'u engelle (sonsuz döngü koruması)
  function post(st){ try{ window.parent.postMessage({__gmex:1, state:st}, '*'); }catch(e){} }
  function okOrigin(o){ if(!o||o==='null') return true; try{ var h=new URL(o).hostname; return h===location.hostname || /(^|\.)gringlizce\.com$/.test(h); }catch(e){ return false; } }

  // Global part/task yöneticisini sar: her çağrıda (apply değilse) parent'a yayınla.
  // reading/listening → setActivePart(n); writing → setActiveTask(n). Klasik script'te
  // top-level function bildirimleri window property'sidir; sarma bare çağrılarda da geçerli.
  function wrapPart(name){
    var orig=window[name];
    if(typeof orig!=='function') return false;
    window[name]=function(){
      var r=orig.apply(this,arguments);
      if(!applying && typeof arguments[0]==='number') post({started:true, part:arguments[0]});
      return r;
    };
    return true;
  }
  function setup(){
    if(!wrapPart('setActivePart')) wrapPart('setActiveTask');
    var sb=document.getElementById('startBtn');
    if(sb) sb.addEventListener('click', function(){ if(!applying) setTimeout(function(){ post({started:true}); },0); });
  }

  window.addEventListener('message', function(e){
    var d=e.data; if(!d||d.__gmex!==1||!d.apply) return;
    if(!okOrigin(e.origin)) return;
    var s=d.apply; applying=true;
    try{
      if(s.started){ var ss=document.getElementById('startScreen'); if(ss && ss.style.display!=='none' && typeof window.startTest==='function') window.startTest(); }
      if(typeof s.part==='number'){ if(typeof window.setActivePart==='function') window.setActivePart(s.part); else if(typeof window.setActiveTask==='function') window.setActiveTask(s.part); }
    }catch(err){}
    applying=false;
  });

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', setup); else setup();
})();
