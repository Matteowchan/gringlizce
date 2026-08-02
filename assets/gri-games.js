/* gri-games.js — oyunlaştırma: coin + rozetler. localStorage tabanlı, kütüphanesiz. */
(function(){
  if(window.GriGames)return;

  var BADGES={
    'yol-kaptani':{name:'Yol Kaptanı',desc:'Kelime Yolu 10. seviye'},
    'tam-skor':{name:'Tam Skor',desc:'Wordle 3 denemede'},
    'karisim-ustasi':{name:'Karışım Ustası',desc:'Eşleştirme hatasız'},
    'ince-iscilik':{name:'İnce İşçilik',desc:'Kelime Avı tamamla'},
    'yaratici':{name:'Yaratıcı',desc:'Bir bulmaca çöz'},
    'hedef-belirleyen':{name:'Hedef Belirleyen',desc:'Wordle 7 gün seri'},
    'tarif-takipci':{name:'Tarif Takipçi',desc:'10 sonsuz seviye'},
    'icten-yazar':{name:'İçten Yazar',desc:'50 kelime öğren'}
  };

  function lsGet(k,d){ try{ var v=localStorage.getItem(k); return v==null?d:v; }catch(e){ return d; } }
  function lsSet(k,v){ try{ localStorage.setItem(k,v); }catch(e){} }
  function coins(){ return parseInt(lsGet('gri-coins','0'),10)||0; }
  function addCoins(n){ var c=coins()+(n||0); lsSet('gri-coins',c); paintCoins(); return c; }
  function earned(){ try{ return JSON.parse(lsGet('gri-badges','[]'))||[]; }catch(e){ return []; } }
  function has(id){ return earned().indexOf(id)>=0; }

  function css(){
    if(document.getElementById('gri-games-css'))return;
    var s=document.createElement('style'); s.id='gri-games-css';
    s.textContent=[
      '.oy-brz.locked img{filter:grayscale(1) opacity(.42);}',
      '.oy-brz.locked span{opacity:.5;}',
      '.oy-brz.earned img{box-shadow:0 3px 12px rgba(199,154,58,.5);}',
      '.oy-brz.earned::after{content:"✓";position:absolute;top:-2px;right:6px;width:18px;height:18px;background:#2E6E4E;color:#fff;border-radius:50%;font-size:12px;font-weight:800;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 3px rgba(0,0,0,.2);}',
      '.oy-brz{position:relative;}',
      '.gg-toast{position:fixed;left:50%;top:22%;transform:translateX(-50%) scale(.6);opacity:0;background:var(--card,#fff);border:1px solid var(--line,#d9cfbb);border-radius:16px;padding:16px 22px;text-align:center;z-index:10000;box-shadow:0 12px 40px rgba(43,33,24,.25);transition:transform .4s cubic-bezier(.34,1.56,.64,1),opacity .3s;max-width:88vw;}',
      '.gg-toast.show{transform:translateX(-50%) scale(1);opacity:1;}',
      '.gg-toast img{width:104px;height:104px;border-radius:50%;display:block;margin:0 auto 8px;box-shadow:0 4px 16px rgba(43,33,24,.18);}',
      '.gg-toast .lbl{font-family:var(--font-ui,inherit);font-size:.72rem;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--gold,#B78A2E);}',
      '.gg-toast .nm{font-family:var(--font-display,Georgia,serif);font-size:1.3rem;font-weight:800;color:var(--text,#2b2118);margin-top:2px;}',
      '.gg-toast .ds{font-size:.85rem;color:var(--text-soft,#7a6f5d);margin-top:2px;}'
    ].join('');
    document.head.appendChild(s);
  }

  function unlockToast(id){
    css();
    var b=BADGES[id]; if(!b)return;
    var d=document.createElement('div'); d.className='gg-toast';
    d.innerHTML='<img src="'+id+'.png" alt=""><div class="lbl">Yeni Rozet</div><div class="nm">'+b.name+'</div><div class="ds">'+b.desc+'</div>';
    document.body.appendChild(d);
    requestAnimationFrame(function(){ d.className='gg-toast show'; });
    if(window.GriConfetti)window.GriConfetti.burst();
    if(window.GriFX)window.GriFX.sound('win');
    setTimeout(function(){ d.className='gg-toast'; setTimeout(function(){ if(d.parentNode)d.parentNode.removeChild(d); },400); },2600);
  }

  function unlock(id){
    if(!BADGES[id]||has(id))return false;
    var e=earned(); e.push(id); lsSet('gri-badges',JSON.stringify(e));
    unlockToast(id); paint();
    return true;
  }

  /* sayaç odaklı ilerleme (öğrenilen kelime vs) */
  function bump(key,by){ var v=(parseInt(lsGet('gri-cnt-'+key,'0'),10)||0)+(by||1); lsSet('gri-cnt-'+key,v); return v; }
  function getCnt(key){ return parseInt(lsGet('gri-cnt-'+key,'0'),10)||0; }

  function paint(){
    var els=document.querySelectorAll('.oy-brz[data-badge]');
    for(var i=0;i<els.length;i++){ var id=els[i].getAttribute('data-badge'); els[i].className='oy-brz'+(has(id)?' earned':' locked'); }
  }
  function paintCoins(){ var el=document.getElementById('oyCoins'); if(el)el.textContent=coins(); }

  window.GriGames={ coins:coins, addCoins:addCoins, earned:earned, has:has, unlock:unlock, bump:bump, getCnt:getCnt, paint:paint, paintCoins:paintCoins, BADGES:BADGES };
})();
