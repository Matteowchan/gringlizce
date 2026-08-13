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

/* ===== Gri Meet senkron köprüsü — iframe'e gömülüyken (veya gmsync=1) aktif =====
   Amaç: öğretmen (host) ile öğrenci aynı ekranı görsün ve aynı soru/essay üzerinde birlikte
   çalışsın. Runner "Sınava Başla", passage/task geçişi ve cevap/essay değişiminde durumu
   parent'a (grimeet) postMessage'lar; grimeet karşı tarafa yayınlar, o da runner iframe'ine
   apply eder. Gömülü DEĞİLKEN (normal sınav, üst pencere) bu blok tamamen atlanır — davranış
   birebir eskisi gibi. Aktivasyon iframe'e gömülü olmaya bağlı çünkü öğretmen runner'a Gri Meet
   içinde iç-navigasyonla (loadMaterial'dan geçmeden) varabilir; URL bayrağı o yolda eklenmez. */
(function(){
  // Aktivasyon: bir iframe'e gömülüyse (Gri Meet materyali) VEYA gmsync=1 bayrağıyla.
  // Gömülü DEĞİL ve gmsync yoksa (normal sınav, üst pencere) köprü tamamen kapalı — davranış eskisi gibi.
  var hasFlag=false; try{ hasFlag=new URLSearchParams(location.search).has('gmsync'); }catch(e){}
  if(window.parent===window && !hasFlag) return;

  var applying=false; // apply sırasında yeniden-post'u engelle (sonsuz döngü koruması)
  var audioSuppressUntil=0; // remote ses uygulanırken doğan play/pause/seeked olaylarını yok say (echo yok)
  var pendingAudio=null;    // ses elemanı henüz hazır değilken gelen komut
  function post(st){ try{ window.parent.postMessage({__gmex:1, state:st}, '*'); }catch(e){} }
  function okOrigin(o){ if(!o||o==='null') return true; try{ var h=new URL(o).hostname; return h===location.hostname || /(^|\.)gringlizce\.com$/.test(h); }catch(e){ return false; } }

  // Cevap/essay yayını — runner'ın __gmSync.get() ile mevcut cevaplarını oku, debounce'la yolla.
  // Debounce 220ms: "çok geç" olmadan, tuş-başına-paket fırtınası da yapmadan makul akış.
  var ansTimer=null;
  function scheduleAnswers(){
    if(applying) return;
    clearTimeout(ansTimer);
    ansTimer=setTimeout(function(){
      if(applying) return;
      if(window.__gmSync && typeof window.__gmSync.get==='function'){
        try{ var g=window.__gmSync.get(); if(g && g.answers) post({answers:g.answers}); }catch(e){}
      }
    },220);
  }
  function onAnswerEvent(e){
    if(applying) return;
    var t=e.target; if(!t||!t.matches) return;
    // reading/listening cevap kontrolleri (.q-input, data-q) veya writing essay textarea'sı
    if(t.matches('.q-input,[data-q],.editor-textarea,textarea[data-task]')) scheduleAnswers();
  }

  // ===== Ses (listening) senkronu — sürücü play/pause/seek yapınca karşı taraf uygular =====
  function audioEl(){ return document.getElementById('audio') || document.querySelector('audio'); }
  function postAudio(action){ var a=audioEl(); if(!a) return; post({audio:{action:action, time:a.currentTime||0, paused:a.paused}}); }
  function onAudioEvt(action){ return function(){ if(applying) return; if(Date.now()<audioSuppressUntil) return; postAudio(action); }; }
  var _audioWired=false;
  function wireAudio(){
    var a=audioEl(); if(!a || a.__gmWired) return; a.__gmWired=1; _audioWired=true;
    a.addEventListener('play', onAudioEvt('play'));
    a.addEventListener('pause', onAudioEvt('pause'));
    a.addEventListener('seeked', onAudioEvt('seek'));
  }
  // Tarayıcı autoplay politikası: öğrenci tarafında kullanıcı etkileşimi olmadan play() reddedilebilir.
  // Zarif fallback: "dokun" bandı; dokununca doğru konumdan oynatır.
  function fallbackBanner(a, target){
    var id='gm-audio-tap'; if(document.getElementById(id)) return;
    var b=document.createElement('div'); b.id=id;
    b.style.cssText='position:fixed;left:50%;top:14px;transform:translateX(-50%);z-index:99999;background:#2C5856;color:#fff;padding:10px 16px;border-radius:10px;font:600 14px/1.3 system-ui,-apple-system,sans-serif;box-shadow:0 6px 20px rgba(0,0,0,.25);cursor:pointer;max-width:90%;text-align:center';
    b.textContent='Öğretmen sesi başlattı — oynatmak için dokun';
    b.addEventListener('click',function(){ audioSuppressUntil=Date.now()+900; try{ if(typeof target==='number') a.currentTime=target; }catch(e){} var pr=a.play(); if(pr&&pr.catch)pr.catch(function(){}); b.remove(); });
    document.body.appendChild(b);
  }
  function applyAudio(au, tries){
    var a=audioEl();
    if(!a || !a.src){ pendingAudio=au; if((tries||0)<20) setTimeout(function(){ applyAudio(au,(tries||0)+1); }, 250); return; }
    pendingAudio=null; audioSuppressUntil=Date.now()+900;
    try{ if(typeof au.time==='number' && Math.abs((a.currentTime||0)-au.time)>0.8) a.currentTime=au.time; }catch(e){}
    if(au.action==='play' || au.paused===false){
      var p=a.play();
      if(p && p.catch) p.catch(function(){ fallbackBanner(a, au.time); });
    } else if(au.action==='pause' || au.paused===true){
      try{ a.pause(); }catch(e){}
    }
  }

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
  function currentPart(){
    var at=document.querySelector('.tab-btn.active'); if(at&&at.dataset&&at.dataset.part){ var n=parseInt(at.dataset.part,10); if(!isNaN(n)) return n; }
    return null;
  }
  function isStarted(){ var ss=document.getElementById('startScreen'); return !ss || ss.style.display==='none'; }
  // Anlık tam durum (paylaşım başında / kontrol devrinde / geç yüklenen runner için tek seferlik senkron):
  // başlatıldı mı + aktif part + cevaplar + ses konumu tek pakette. Alan tarafı sırayla uygular.
  function emitFullState(){
    var out={};
    if(window.__gmSync && typeof window.__gmSync.get==='function'){ try{ var g=window.__gmSync.get(); if(g&&g.answers) out.answers=g.answers; }catch(e){} }
    if(isStarted()) out.started=true;
    var cp=currentPart(); if(cp!=null) out.part=cp;
    var a=audioEl(); if(a && a.src){ out.audio={action:a.paused?'pause':'play', time:a.currentTime||0, paused:a.paused}; }
    if(out.answers || out.started || out.audio) post(out);
  }

  function setup(){
    if(!wrapPart('setActivePart')) wrapPart('setActiveTask');
    var sb=document.getElementById('startBtn');
    if(sb) sb.addEventListener('click', function(){ if(!applying) setTimeout(function(){ var cp=currentPart(); post(cp!=null?{started:true, part:cp}:{started:true}); },0); });
    // Cevap/essay değişimlerini yakala (capture ile, runner'ın kendi handler'ından bağımsız).
    document.addEventListener('input', onAnswerEvent, true);
    document.addEventListener('change', onAnswerEvent, true);
    wireAudio();
    // Ses elemanı "Sınava Başla" sonrası kurulabilir (src o an set edilir) → DOM/attr değişimini gözle.
    try{ var mo=new MutationObserver(function(){ if(!_audioWired) wireAudio(); }); mo.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['src']}); }catch(e){}
  }

  window.addEventListener('message', function(e){
    var d=e.data; if(!d||d.__gmex!==1) return;
    if(!okOrigin(e.origin)) return;
    if(d.requestState){ emitFullState(); return; } // parent (grimeet) tam durumu istiyor → tek seferlik yayınla
    if(!d.apply) return;
    var s=d.apply; applying=true;
    try{
      if(s.started){ var ss=document.getElementById('startScreen'); if(ss && ss.style.display!=='none' && typeof window.startTest==='function') window.startTest(); }
      if(typeof s.part==='number'){ if(typeof window.setActivePart==='function') window.setActivePart(s.part); else if(typeof window.setActiveTask==='function') window.setActiveTask(s.part); }
      // Cevap/essay senkronu: odak guard'ı runner'ın __gmSync.apply'ında (caret savaşı yok).
      if(s.answers && window.__gmSync && typeof window.__gmSync.apply==='function'){ window.__gmSync.apply({answers:s.answers}); }
    }catch(err){}
    applying=false;
    // Ses uygula: async play() + kendi suppress penceresi (applying guard'ından bağımsız).
    if(s.audio){ try{ applyAudio(s.audio,0); }catch(err2){} }
  });

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', setup); else setup();
})();
