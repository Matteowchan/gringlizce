/* ===== Gri Meet — ders odası motoru v4 ===== */
(function(){
"use strict";

var SUPABASE_URL='https://vazbvbqgvtlaqkytfsbi.supabase.co';
var SUPABASE_ANON_KEY='sb_publishable_F5K-wIVQHXlD4e4GYnySNw_Xm4teO9g';
var LIVEKIT_URL='wss://gringlizce-zmd4hjzv.livekit.cloud';
var TOKEN_ENDPOINT=SUPABASE_URL+'/functions/v1/grimeet-token';

var LK=window.LivekitClient||null;
var $=function(s,r){return (r||document).querySelector(s);};
var $$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s));};
var params=new URLSearchParams(location.search);

var STATE={
  room:(params.get('room')||'').toUpperCase(), isHost:params.get('host')==='1', classId:(params.get('class')||''),
  name:'', identity:'u'+Math.random().toString(36).slice(2,9),
  micOn:true, camOn:true, handUp:false, mode:'grid',
  lkRoom:null, connected:false, demo:false, localStream:null, camTrack:null, preTrack:null,
  _leaving:false, _reconnecting:false, _reconnectTries:0, _reconnectTimer:null,
  mirror:true, _bgApplied:false, bgFlip:false,
  bg:'none', customBg:'', supabase:null, tiles:{}, currentMaterial:null, matShared:false, matPaused:false, matZoom:1, scrZoom:1, matControl:false, _matScrollLock:false,
  camId:'', micId:'', camRes:'540', spotlight:null, chatLocked:false, layout:'gallery', pinned:null, activeSpeaker:null,
  quiz:null, quizView:null, quizScore:0, quizQueue:[], quizSet:null, quizRun:null,
  breakout:null, myGroup:null, boTimer:null, ytPlayer:null, _ytPending:null, _ytHb:null, hands:[], _hb:null,
  waitingRoom:true, admitted:false, pending:[], _admitTimer:null,
  attendance:{}, points:{}, pnames:{}, startedAt:null,
  captionsOn:false, transcript:[]
};
// Oda içi Ödevler paneli (grimeet-oda.html inline script) STATE'i window üzerinden okur:
// böylece kimliği doğrulanmış Supabase istemcisini (STATE.supabase) ve gerçek isHost/classId'yi
// kullanır — kendi anon istemcisini kurup öğretmeni yanlışlıkla "öğrenci" görünümüne düşürmez (#107).
try{ window.STATE=STATE; }catch(e){}

var BGS=[
  {id:'none',label:'Yok'},{id:'blur',label:'Bulanık'},
  {id:'bg-01',label:'Dağlar'},{id:'bg-02',label:'Orman & Deniz'},{id:'bg-03',label:'Yeşil Orman'},
  {id:'bg-04',label:'Şelale'},{id:'bg-05',label:'Altın Tarla'},{id:'bg-06',label:'Puslu Çayır'},
  {id:'bg-07',label:'Kayalık Sahil'},{id:'bg-08',label:'Çiçekler'},{id:'bg-09',label:'Çöl Gecesi'},
  {id:'bg-10',label:'Kır Çiçekleri'},
  {id:'bg-12',label:'Sonbahar Yolu'},{id:'bg-13',label:'Fiyort'},{id:'bg-14',label:'İskele'},
  {id:'bg-11',label:'Sınıf'},{id:'bg-15',label:'Çalışma Masası'},{id:'bg-16',label:'Daktilo'}
];
function bgFile(id){ if(id==='custom') return STATE.customBg||''; return new URL('assets/grimeet-bg/'+id+'.jpg',location.href).href; }

var RES_MAP={ '360':{width:640,height:360,frameRate:24}, '540':{width:960,height:540,frameRate:24}, '720':{width:1280,height:720,frameRate:24}, '1080':{width:1920,height:1080,frameRate:24} };
function resObj(){ return RES_MAP[STATE.camRes]||RES_MAP['540']; }
// Arka plan görselini yatay çevir (flip): canvas'a aynalı çizip dataURL döndür. Hata olursa orijinali döndür.
var _flipCache={};
function flipImageUrl(url){ return new Promise(function(res){ if(_flipCache[url]){res(_flipCache[url]);return;} try{ var img=new Image(); img.crossOrigin='anonymous'; img.onload=function(){ try{ var w=img.naturalWidth||img.width, h=img.naturalHeight||img.height; var c=document.createElement('canvas'); c.width=w; c.height=h; var ctx=c.getContext('2d'); ctx.translate(w,0); ctx.scale(-1,1); ctx.drawImage(img,0,0); var d=c.toDataURL('image/jpeg',0.92); _flipCache[url]=d; res(d); }catch(e){ res(url); } }; img.onerror=function(){ res(url); }; img.src=url; }catch(e){ res(url); } }); }
async function bgSrc(id){ var u=bgFile(id); if(STATE.bgFlip){ try{ u=await flipImageUrl(u); }catch(e){} } return u; }

var ROOM_THEMES=[
  {t:'krem',n:'Zümrüt',ic:'💎',bg:'#F1EAD9',stage:'#E7DDC8',s1:'#FBF6EC',s2:'#F4EDDC',line:'#E3D8C3',ink:'#241E17',isoft:'#6E6353',ifaint:'#9A8E7B',a:'#3B7A75',d:'#2C5856',g:'#C79A3A'},
  {t:'erik',n:'Orkide',ic:'🪻',bg:'#F1E7EC',stage:'#E7DAE0',s1:'#FAF3F6',s2:'#F3E7EC',line:'#E7D6DE',ink:'#2A1E24',isoft:'#6E5A63',ifaint:'#9A8A91',a:'#8A4A63',d:'#5C3042',g:'#B0764A'},
  {t:'orman',n:'Avokado',ic:'🥑',bg:'#E8EEE5',stage:'#DAE3D6',s1:'#F2F6F0',s2:'#E6EDE4',line:'#D6E0D2',ink:'#1E2A20',isoft:'#586355',ifaint:'#889183',a:'#3E6B4A',d:'#20402B',g:'#8A7A2E'},
  {t:'okyanus',n:'Denim',ic:'👖',bg:'#E7EDF3',stage:'#D8E2EC',s1:'#F2F6FA',s2:'#E4EDF4',line:'#D6E0EC',ink:'#1E2A34',isoft:'#556170',ifaint:'#8894A2',a:'#2E5E8A',d:'#1E3E5C',g:'#4A6A8A'},
  {t:'gul',n:'Gül Kurusu',ic:'🥀',bg:'#F3E9EE',stage:'#E7D9E1',s1:'#FAF3F6',s2:'#F3E7EE',line:'#E7D6DF',ink:'#2A1E24',isoft:'#6E5A63',ifaint:'#9A8A91',a:'#B0567A',d:'#7E3A56',g:'#A05A6A'},
  {t:'bordo',n:'Şarap',ic:'🍷',bg:'#F1E8EA',stage:'#E5D6DA',s1:'#FAF2F4',s2:'#F2E6E9',line:'#E5D6DA',ink:'#2A1E21',isoft:'#6E5A5E',ifaint:'#9A8A8E',a:'#8E3B4C',d:'#5E2632',g:'#8A4A3B'},
  {t:'lavanta',n:'Lila',ic:'💜',bg:'#ECE9F3',stage:'#DED9EC',s1:'#F5F3FA',s2:'#E9E5F2',line:'#DED9EC',ink:'#221E2A',isoft:'#5A566E',ifaint:'#8A86A2',a:'#6E5AA0',d:'#493A6E',g:'#8A6A9A'},
  {t:'tiffany',n:'Tiffany',ic:'💍',bg:'#E1F3F0',stage:'#D2E9E5',s1:'#EFFAF8',s2:'#DBEFEB',line:'#CFE6E1',ink:'#16302D',isoft:'#4E6763',ifaint:'#86A19C',a:'#0B8C86',d:'#08615D',g:'#C79A3A'},
  {t:'mocha',n:'Mocha',ic:'☕',bg:'#F1E8E2',stage:'#E5D8CE',s1:'#F8F1EC',s2:'#EFE3DA',line:'#E4D5C9',ink:'#2A1E17',isoft:'#6E5C4E',ifaint:'#9A8A7B',a:'#8A5A44',d:'#5E3B2C',g:'#B0864A'},
  {t:'visne',n:'Nar',ic:'🍎',bg:'#F5E7E8',stage:'#E9D6D8',s1:'#FBF2F2',s2:'#F3E4E5',line:'#E9D6D8',ink:'#2A1A1C',isoft:'#6E5658',ifaint:'#9A868A',a:'#B02A37',d:'#7E1D27',g:'#B0764A'},
  {t:'persimmon',n:'Persimmon',ic:'🍊',bg:'#F6EAE1',stage:'#EBD9CC',s1:'#FBF3ED',s2:'#F3E6DA',line:'#E9D8C9',ink:'#2A1E14',isoft:'#6E5C4C',ifaint:'#9A8A78',a:'#BC5A2E',d:'#8A3E1C',g:'#A9772E'},
  {t:'wasabi',n:'Wasabi',ic:'🥬',bg:'#EDF0DC',stage:'#DEE3C8',s1:'#F5F6E9',s2:'#E7ECD5',line:'#DCE2C7',ink:'#24280F',isoft:'#5E634A',ifaint:'#8A9070',a:'#6F7D1C',d:'#4A5312',g:'#A9902E'},
  {t:'matcha',n:'Matcha',ic:'🍵',bg:'#EAF0E3',stage:'#DBE6CF',s1:'#F3F7EC',s2:'#E6EEDB',line:'#D8E2C9',ink:'#1F2818',isoft:'#586150',ifaint:'#88927E',a:'#5B8C4E',d:'#3A6030',g:'#A9902E'},
  {t:'barbie',n:'Barbie',ic:'🎀',bg:'#FBE6F1',stage:'#F4D4E4',s1:'#FEF1F8',s2:'#F8E2EE',line:'#F2D2E2',ink:'#2E1522',isoft:'#7A5364',ifaint:'#B085A0',a:'#E24E9C',d:'#B23C7E',g:'#C79A3A'},
  {t:'kobalt',n:'Kobalt',ic:'🔵',bg:'#E6EAF5',stage:'#D5DDF1',s1:'#F1F3FB',s2:'#E2E8F6',line:'#D3DCEF',ink:'#171E30',isoft:'#525A72',ifaint:'#858FA9',a:'#2E52C8',d:'#1E357E',g:'#C79A3A'},
  {t:'somon',n:'Somon',ic:'🍣',bg:'#FBEAE3',stage:'#F4D8CD',s1:'#FEF3EE',s2:'#F8E5DC',line:'#F2D6CB',ink:'#2E1913',isoft:'#7A594E',ifaint:'#B0877A',a:'#E0705A',d:'#B04A38',g:'#C79A3A'},
  {t:'karamel',n:'Karamel',ic:'🍮',bg:'#F6EDDD',stage:'#EBDDC4',s1:'#FCF5E9',s2:'#F4E9D4',line:'#EADBC0',ink:'#2A2013',isoft:'#6E6046',ifaint:'#9A8C70',a:'#C07A34',d:'#8A521C',g:'#A9772E'},
  {t:'nane',n:'Nane',ic:'🌿',bg:'#E3F2EC',stage:'#D2E8DE',s1:'#F0F9F4',s2:'#DFF0E9',line:'#CFE6DB',ink:'#16302A',isoft:'#4E675E',ifaint:'#86A199',a:'#1FA98C',d:'#0E6E5A',g:'#C79A3A'},
  {t:'fusya',n:'Fuşya',ic:'🌺',bg:'#F8E6F2',stage:'#F0D5E8',s1:'#FDF1FA',s2:'#F6E2F0',line:'#EFD1E6',ink:'#2C1428',isoft:'#785268',ifaint:'#AE84A0',a:'#C64BB0',d:'#932A82',g:'#C79A3A'},
  {t:'gokyuzu',n:'Gökyüzü',ic:'🌤️',bg:'#E5F0F8',stage:'#D3E5F2',s1:'#F0F7FC',s2:'#E1EEF7',line:'#D1E3F0',ink:'#16283A',isoft:'#4E6070',ifaint:'#8598A8',a:'#2E86C6',d:'#1E5E90',g:'#C79A3A'},
  {t:'zeytin',n:'Zeytin',ic:'🫒',bg:'#EEEFDE',stage:'#E0E2CA',s1:'#F6F6EB',s2:'#E9EAD7',line:'#DEE0C8',ink:'#26280F',isoft:'#5E6048',ifaint:'#8E9070',a:'#77803A',d:'#4E541F',g:'#A9902E'},
  {t:'pudra',n:'Pudra',ic:'🌸',bg:'#FAECEF',stage:'#F3DBE1',s1:'#FEF4F6',s2:'#F8E5EA',line:'#F2D7DE',ink:'#2E1A1F',isoft:'#7A5860',ifaint:'#B0868E',a:'#D06A82',d:'#A24458',g:'#C79A3A'},
  {t:'indigo',n:'İndigo',ic:'🔷',bg:'#E9E7F5',stage:'#DAD6EC',s1:'#F3F2FB',s2:'#E4E2F2',line:'#D6D2EA',ink:'#1A1630',isoft:'#524E6E',ifaint:'#8884A2',a:'#4B3B8F',d:'#31266B',g:'#C79A3A'},
  {t:'menekse',n:'Menekşe',ic:'🟣',bg:'#EFE7F3',stage:'#E2D6EA',s1:'#F7F1FA',s2:'#EAE0F0',line:'#E0D3E8',ink:'#241A2A',isoft:'#5E526A',ifaint:'#8E82A0',a:'#7B3FA0',d:'#552A70',g:'#C79A3A'},
  {t:'seftali',n:'Şeftali',ic:'🍑',bg:'#FBEEE1',stage:'#F0DDCB',s1:'#FEF6EE',s2:'#F8E9D9',line:'#EEDBC7',ink:'#2A1E14',isoft:'#6E5C4C',ifaint:'#9A8A78',a:'#D9824A',d:'#A85B2C',g:'#C79A3A'},
  {t:'lacivert',n:'Lacivert',ic:'🫐',bg:'#E6EAF0',stage:'#D5DCE8',s1:'#F1F3F7',s2:'#E1E6EE',line:'#D3DAE6',ink:'#161E2A',isoft:'#4E5A6A',ifaint:'#8894A2',a:'#26426B',d:'#172A47',g:'#C79A3A'},
  {t:'bakir',n:'Bakır',ic:'🟤',bg:'#F5E9E1',stage:'#E9D6C9',s1:'#FBF3ED',s2:'#F2E4D9',line:'#E7D5C7',ink:'#2A1A12',isoft:'#6E5648',ifaint:'#9A8676',a:'#B05C36',d:'#7E3E20',g:'#C79A3A'},
  {t:'sis',n:'Sis',ic:'🌫️',bg:'#ECEEF0',stage:'#DCE0E4',s1:'#F5F6F7',s2:'#E4E7EA',line:'#DADEE3',ink:'#1A1E22',isoft:'#525A63',ifaint:'#868E97',a:'#5C6673',d:'#3A424C',g:'#C79A3A'},
  {t:'bugday',n:'Buğday',ic:'🌾',bg:'#F6EFDC',stage:'#EBE0C4',s1:'#FCF6E8',s2:'#F3EBD3',line:'#E9DEC2',ink:'#2A2410',isoft:'#6E6446',ifaint:'#9A9070',a:'#C7A24A',d:'#8E6E24',g:'#C79A3A'},
  {t:'dark',n:'Gece',ic:'🌙',bg:'#161311',stage:'#0e0c0a',s1:'#211d18',s2:'#2a251f',line:'#352f27',ink:'#F1E9D9',isoft:'#B7AB96',ifaint:'#8A7E6C',a:'#6FB6AF',d:'#2E6E6A',g:'#D8B25A'}
];
function applyRoomTheme(t){ var x=null; for(var i=0;i<ROOM_THEMES.length;i++){ if(ROOM_THEMES[i].t===t){x=ROOM_THEMES[i];break;} } if(!x)x=ROOM_THEMES[0]; var r=document.documentElement.style;
  r.setProperty('--gm-bg',x.bg); r.setProperty('--gm-stage',x.stage); r.setProperty('--gm-surface',x.s1); r.setProperty('--gm-surface-2',x.s2); r.setProperty('--gm-line',x.line);
  r.setProperty('--gm-ink',x.ink); r.setProperty('--gm-ink-soft',x.isoft); r.setProperty('--gm-ink-faint',x.ifaint);
  r.setProperty('--gm-teal',x.a); r.setProperty('--gm-teal-deep',x.d); r.setProperty('--gm-gold',x.g);
  try{localStorage.setItem('gri-theme',x.t);}catch(e){}
  var pop=document.getElementById('gmr-theme-pop'); if(pop){ var bs=pop.querySelectorAll('.gmr-sw'); for(var k=0;k<bs.length;k++){ bs[k].classList.toggle('on', bs[k].getAttribute('data-t')===x.t); } }
}
function buildThemeSel(){
  var pop=document.getElementById('gmr-theme-pop'), btn=document.getElementById('gmr-theme-btn'); if(!pop||!btn)return;
  pop.innerHTML=ROOM_THEMES.map(function(x){ return '<button class="gmr-sw" data-t="'+x.t+'" title="'+esc(x.n)+'" aria-label="'+esc(x.n)+'"><span class="sw-dot" style="background:'+x.a+'">'+(x.ic||'')+'</span><span class="sw-n">'+esc(x.n)+'</span></button>'; }).join('');
  pop.addEventListener('click',function(e){ var b=e.target.closest('.gmr-sw'); if(!b)return; applyRoomTheme(b.getAttribute('data-t')); pop.classList.remove('open'); btn.setAttribute('aria-expanded','false'); });
  btn.addEventListener('click',function(e){ e.stopPropagation(); var open=pop.classList.toggle('open'); btn.setAttribute('aria-expanded',open?'true':'false'); });
  document.addEventListener('click',function(e){ if(!pop.contains(e.target)&&!btn.contains(e.target)){ pop.classList.remove('open'); btn.setAttribute('aria-expanded','false'); } });
  var saved='krem'; try{ saved=localStorage.getItem('gri-theme')||'krem'; }catch(e){} applyRoomTheme(saved);
}

var toastT;
function toast(m){var t=$('#gmr-toast');t.textContent=m;t.classList.add('show');clearTimeout(toastT);toastT=setTimeout(function(){t.classList.remove('show');},2800);}
function initials(n){n=(n||'?').trim();var p=n.split(/\s+/);return ((p[0]||'?')[0]+(p[1]?p[1][0]:'')).toUpperCase();}
function pad(n){return (n<10?'0':'')+n;}
function fmt(s){s=Math.max(0,Math.floor(s));return pad(Math.floor(s/60))+':'+pad(s%60);}
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}

function initSupabase(){ try{ if(window.supabase&&window.supabase.createClient) STATE.supabase=window.supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY); }catch(e){} }
var startTs=null;
function tickClock(){ if(startTs) $('#gmr-clock').textContent=fmt((Date.now()-startTs)/1000); }

/* ================= JOIN GATE ================= */
var gateStream=null;
function setupGate(){
  $('#gate-room-code').textContent=STATE.room||'—';
  var camOn=true,micOn=true,gv=$('#gate-video'),gp=$('.gate-preview');
  var camSel=$('#gate-cam-sel'),micSel=$('#gate-mic-sel');
  async function fillDevices(){
    try{ var devs=await navigator.mediaDevices.enumerateDevices();
      camSel.innerHTML=''; micSel.innerHTML='';
      devs.filter(function(d){return d.kind==='videoinput';}).forEach(function(d,i){ var o=document.createElement('option'); o.value=d.deviceId; o.textContent=d.label||('Kamera '+(i+1)); camSel.appendChild(o); });
      devs.filter(function(d){return d.kind==='audioinput';}).forEach(function(d,i){ var o=document.createElement('option'); o.value=d.deviceId; o.textContent=d.label||('Mikrofon '+(i+1)); micSel.appendChild(o); });
      if(camSel.value) STATE.camId=camSel.value; if(micSel.value) STATE.micId=micSel.value;
    }catch(e){}
  }
  function applyMirror(){ if(gv) gv.classList.toggle('mirror', STATE.mirror!==false); }
  function stopPre(){
    try{ if(STATE.preTrack){ STATE.preTrack.detach(); STATE.preTrack.stop(); STATE.preTrack=null; } }catch(e){}
    try{ if(gateStream){ gateStream.getTracks().forEach(function(t){t.stop();}); gateStream=null; } }catch(e){}
    try{ if(gv) gv.srcObject=null; }catch(e){}
  }
  async function preview(){
    if(!camOn){ gp.classList.add('camoff'); stopPre(); fillDevices(); return; }
    // Tercih: LiveKit LocalVideoTrack — segmentasyon modeli BURADA yüklenir, arka plan canlı önizlenir,
    // ve aynı track odaya taşınır (oda açılışı anlık, donma yok). LK yoksa ham getUserMedia'ya düşer.
    if(LK && LK.createLocalVideoTrack){
      try{
        stopPre();
        STATE.preTrack = await LK.createLocalVideoTrack({ deviceId: STATE.camId||undefined, resolution:resObj() });
        STATE.preTrack.attach(gv); gp.classList.remove('camoff'); applyMirror(); fillDevices();
        if(STATE.bg && STATE.bg!=='none') applyGateBg(STATE.bg);
        return;
      }catch(e){ stopPre(); }
    }
    try{
      stopPre();
      gateStream=await navigator.mediaDevices.getUserMedia({video:STATE.camId?{deviceId:{exact:STATE.camId}}:true,audio:false});
      gv.srcObject=gateStream; gp.classList.remove('camoff'); applyMirror(); fillDevices();
    }catch(e){ camOn=false; $('#gate-cam').classList.remove('on'); $('#gate-cam').textContent='Kamera kapalı'; gp.classList.add('camoff'); fillDevices(); }
  }
  async function applyGateBg(bg){
    STATE.bg=bg; try{localStorage.setItem('gm-bg',bg);}catch(e){} highlightGateBg(bg);
    if(!STATE.preTrack){ if(bg!=='none') toast('Arka plan önizlemesi için kamerayı aç.'); STATE._bgApplied=(bg!=='none'); return; }
    var lbl=$('#gate-bg-hint'); if(lbl&&bg!=='none') lbl.textContent='(uygulanıyor…)';
    try{
      if(bg==='none'){ if(STATE.preTrack.getProcessor&&STATE.preTrack.getProcessor()) await STATE.preTrack.stopProcessor(); STATE._bgApplied=false; }
      else if(_HQBG && window.GriBg){
        try{ await STATE.preTrack.setProcessor(window.GriBg.create({mode:bg==='blur'?'blur':'image',blurRadius:14,imagePath:bg==='blur'?null:await bgSrc(bg),flip:STATE.bgFlip})); STATE._bgApplied=true; }
        catch(_hq){ var tpG=await loadTP(); if(tpG){ if(bg==='blur') await STATE.preTrack.setProcessor(tpG.BackgroundBlur(12)); else await STATE.preTrack.setProcessor(tpG.VirtualBackground(await bgSrc(bg))); STATE._bgApplied=true; } else { if(lbl)lbl.textContent='(uygulanamadı)'; return; } } }
      else{ var tp=await loadTP(); if(!tp){ toast('Bu tarayıcıda arka plan efekti desteklenmiyor.'); if(lbl)lbl.textContent='(bu tarayıcıda yok)'; return; }
        if(bg==='blur') await STATE.preTrack.setProcessor(tp.BackgroundBlur(12));
        else await STATE.preTrack.setProcessor(tp.VirtualBackground(await bgSrc(bg)));
        STATE._bgApplied=true; }
      if(lbl) lbl.textContent='(dersten önce seç, canlı gör)';
    }catch(e){ toast('Arka plan uygulanamadı.'); if(lbl)lbl.textContent='(uygulanamadı)'; }
  }
  function highlightGateBg(bg){ $$('#gate-bg-row .gate-bg-opt').forEach(function(x){ x.classList.toggle('on', x.dataset.bg===bg); }); }
  function buildGateBg(){
    var row=$('#gate-bg-row'); if(!row)return; row.innerHTML='';
    BGS.forEach(function(b){ var d=document.createElement('button'); d.type='button'; d.className='gate-bg-opt '+(b.id==='none'?'none':b.id==='blur'?'blur':'')+(STATE.bg===b.id?' on':''); d.dataset.bg=b.id; if(b.id!=='none'&&b.id!=='blur') d.style.backgroundImage='url("'+bgFile(b.id)+'")'; d.innerHTML='<span>'+b.label+'</span>'; d.addEventListener('click',function(){ applyGateBg(b.id); }); row.appendChild(d); });
    if(STATE.customBg){ var c=document.createElement('button'); c.type='button'; c.className='gate-bg-opt'+(STATE.bg==='custom'?' on':''); c.dataset.bg='custom'; c.style.backgroundImage='url("'+STATE.customBg+'")'; c.innerHTML='<span>Benim</span>'; c.addEventListener('click',function(){ applyGateBg('custom'); }); row.appendChild(c); }
  }
  buildGateBg();
  var mir=$('#gate-mirror'); if(mir){ mir.checked=STATE.mirror!==false; mir.addEventListener('change',function(){ STATE.mirror=mir.checked; try{localStorage.setItem('gm-mirror',mir.checked?'1':'0');}catch(e){} applyMirror(); }); }
  var resSel=$('#gate-res'); if(resSel){ resSel.value=STATE.camRes; resSel.addEventListener('change',function(){ STATE.camRes=resSel.value; try{localStorage.setItem('gm-res',resSel.value);}catch(e){} if(camOn){ toast('Kalite değiştiriliyor…'); preview(); } }); }
  var bgf=$('#gate-bg-flip'); if(bgf){ bgf.checked=!!STATE.bgFlip; bgf.addEventListener('change',function(){ STATE.bgFlip=bgf.checked; try{localStorage.setItem('gm-bgflip',bgf.checked?'1':'0');}catch(e){} var b=$('#bg-flip'); if(b)b.checked=bgf.checked; if(STATE.bg&&STATE.bg!=='none'&&STATE.bg!=='blur') applyGateBg(STATE.bg); }); }
  if(camOn) preview(); else { gp.classList.add('camoff'); fillDevices(); }
  camSel.addEventListener('change',function(){ STATE.camId=camSel.value; if(camOn)preview(); });
  micSel.addEventListener('change',function(){ STATE.micId=micSel.value; });
  $('#gate-cam').addEventListener('click',function(){ camOn=!camOn; this.classList.toggle('on',camOn); this.textContent=camOn?'Kamera açık':'Kamera kapalı'; if(camOn)preview(); else{ gp.classList.add('camoff'); stopPre(); } });
  $('#gate-mic').addEventListener('click',function(){ micOn=!micOn; this.classList.toggle('on',micOn); this.textContent=micOn?'Mikrofon açık':'Mikrofon kapalı'; });
  (async function(){
    if(!STATE.supabase)return;
    try{ var u=await STATE.supabase.auth.getUser(); var user=u.data&&u.data.user;
      if(user){ var nm=(user.user_metadata&&(user.user_metadata.full_name||user.user_metadata.name))||user.email||''; if(nm)$('#gate-name').value=nm.split('@')[0];
        if(STATE.isHost){ var p=await STATE.supabase.from('profiles').select('role').eq('id',user.id).maybeSingle(); var role=(p.data&&p.data.role)||'customer'; if(role!=='teacher'&&role!=='admin') STATE.isHost=false; } }
      else if(STATE.isHost) STATE.isHost=false;
    }catch(e){}
    $('#gate-note').textContent=STATE.isHost?'Bu odayı öğretmen olarak açıyorsun.':'Derse öğrenci olarak katılıyorsun.';
  })();
  $('#gate-join').addEventListener('click',function(){
    var nm=($('#gate-name').value||'').trim(); if(!nm){ toast('Lütfen adını yaz.'); $('#gate-name').focus(); return; }
    STATE.name=nm; STATE.micOn=micOn; STATE.camOn=camOn;
    // Token'ı hemen çekmeye başla — oda hazırlığıyla paralel
    STATE._tokenPromise = fetchLKToken().catch(function(){ return {}; });
    // preTrack varsa odaya taşınmak üzere KORUNUR (kamera yeniden açılmaz, model+arka plan hazır → giriş anlık).
    // Yalnız ham gate akışı (fallback) serbest bırakılır.
    if(!STATE.preTrack && gateStream){ gateStream.getTracks().forEach(function(t){t.stop();}); gateStream=null; try{ if(gv) gv.srcObject=null; }catch(e){} }
    $('#gmr-gate').classList.add('hidden');
    setTimeout(enterRoom, STATE.preTrack?60:200);
  });
}

/* ================= ENTER ROOM ================= */
async function enterRoom(){
  startTs=Date.now(); STATE.startedAt=Date.now(); recordAttend('self',STATE.name+(STATE.isHost?' (Öğretmen)':' (Sen)')); setInterval(tickClock,1000);
  $('#gmr-room-name').textContent=STATE.isHost?'Ders Odası (Öğretmen)':'Ders Odası';
  $('#gmr-code').textContent=STATE.room||'·····';
  if(STATE.isHost) $('#gm-app').classList.add('is-host'); else $('#gm-app').classList.add('is-student');
  ensureTile('self',{name:STATE.name+' (Sen)',host:STATE.isHost}); updateGridCount();
  // Odaya girer girmez kendi kamerani goster (ogrenci admit beklerken de kamera canli kalir).
  if(STATE.camOn) attachSelf();
  connectLiveKit();
}

/* ================= LIVEKIT ================= */
// Token'ı önden çekilebilir yap: join anında başlatıp kamera/UI hazırlanırken paralel getir
async function fetchLKToken(){
  var headers={'Content-Type':'application/json'};
  if(STATE.supabase){ try{ var s=await STATE.supabase.auth.getSession(); if(s.data&&s.data.session){ headers['Authorization']='Bearer '+s.data.session.access_token; headers['apikey']=SUPABASE_ANON_KEY; } }catch(e){} }
  try{
    var res=await fetch(TOKEN_ENDPOINT,{method:'POST',headers:headers,body:JSON.stringify({room:STATE.room,identity:STATE.identity,name:STATE.name,isHost:STATE.isHost})});
    if(res.status===403){ var e403=await res.json().catch(function(){return{};}); return {blocked:e403.error||'Oda bulunamadı.'}; }
    if(res.ok){ var jr=await res.json(); return {token:jr.token, url:jr.url}; }
  }catch(e){}
  return {};
}
async function connectLiveKit(){
  if(!LK){ enterDemo('LiveKit yüklenemedi'); return; }
  setStatus('connecting','Bağlanıyor…');
  var result = STATE._tokenPromise ? await STATE._tokenPromise : await fetchLKToken();
  STATE._tokenPromise = null;
  if(result && result.blocked){ blockJoin(result.blocked); return; }
  var token = result && result.token;
  if(result && result.url) LIVEKIT_URL = result.url;
  if(!token){ enterDemo('Token alınamadı'); return; }
  try{
    var room=new LK.Room({adaptiveStream:true,dynacast:true,videoCaptureDefaults:{resolution:resObj()},audioCaptureDefaults:{echoCancellation:true,noiseSuppression:true,autoGainControl:true,voiceIsolation:true}}); STATE.lkRoom=room;
    room.on(LK.RoomEvent.ParticipantConnected,function(p){ onParticipant(p); playJoinChime(); sysChat((p.name||'Katılımcı')+' katıldı'); });
    room.on(LK.RoomEvent.ParticipantDisconnected,function(p){ removeTile(p.identity); handQueueRemove(p.identity); removePending(p.identity); attendLeave(p.identity); sysChat((p.name||'Katılımcı')+' ayrıldı'); refreshPeople(); updateGridCount(); });
    room.on(LK.RoomEvent.Reconnecting,function(){ setStatus('connecting','Yeniden bağlanıyor…'); });
    room.on(LK.RoomEvent.Reconnected,function(){ setStatus('live','Canlı'); });
    room.on(LK.RoomEvent.TrackSubscribed,function(track,pub,p){ attachTrack(track,pub,p); });
    room.on(LK.RoomEvent.TrackUnsubscribed,function(track,pub,p){ if(isScreen(pub)){ clearScreen(); if(STATE.mode==='screen') setMode('grid',{remote:true}); } else if(track.kind==='video'){ renderPlaceholder(p.identity); } });
    room.on(LK.RoomEvent.ActiveSpeakersChanged,onSpeakers);
    room.on(LK.RoomEvent.DataReceived,onData);
    room.on(LK.RoomEvent.Disconnected,function(reason){ handleDisconnect(reason); });
    room.on(LK.RoomEvent.TrackMuted,function(pub,p){ if(pub.kind==='audio')updateMic(p.identity,false); refreshPeople(); });
    room.on(LK.RoomEvent.TrackUnmuted,function(pub,p){ if(pub.kind==='audio')updateMic(p.identity,true); refreshPeople(); });
    room.on(LK.RoomEvent.LocalTrackPublished,function(pub){ if(pub.source===LK.Track.Source.Camera){ STATE.camTrack=pub.videoTrack; attachSelf(); scheduleAutoBg(); } else if(pub.source===LK.Track.Source.ScreenShare){ attachScreen(pub.track,true); } });
    room.on(LK.RoomEvent.LocalTrackUnpublished,function(pub){ if(pub.source===LK.Track.Source.ScreenShare){ clearScreen(); setMode('grid'); } });
    room.on(LK.RoomEvent.ConnectionQualityChanged,function(q,p){ var pid=(p===room.localParticipant)?'self':p.identity; var t=tileEl(pid); if(!t)return; var d=t.querySelector('.qdot'); if(d)d.className='qdot '+(q==='excellent'?'q-excellent':(q==='poor'||q==='lost')?'q-poor':'q-good'); });

    await room.connect(LIVEKIT_URL,token);
    STATE.connected=true; STATE._reconnecting=false; STATE._reconnectTries=0; clearTimeout(STATE._reconnectTimer);
    var _reconGate=document.getElementById('gmr-recon'); if(_reconGate)_reconGate.remove();
    setStatus('live','Canlı');
    room.remoteParticipants.forEach(onParticipant);
    refreshPeople(); updateGridCount(); startHeartbeat();
    if(STATE.isHost){ STATE.admitted=true; await publishLocal(); }
    else if(STATE.admitted){ hideWaiting(); $$('#gmr-videos audio').forEach(function(a){a.muted=false;}); await publishLocal(); setTimeout(function(){ sendData({t:'req-state'}); },600); }
    else { showWaiting(); setTimeout(function(){ sendData({t:'knock',name:STATE.name}); },400); STATE._admitTimer=setTimeout(admitSelf,20000); setTimeout(function(){ sendData({t:'req-state'}); },1200); }
  }catch(e){ if(STATE._reconnecting){ scheduleReconnect(); } else { enterDemo('Bağlanılamadı'); } }
}
/* ---- Tam kopmada otomatik yeniden bağlanma ----
   Not: LiveKit'in kendi Reconnecting/Reconnected (ICE) akışı ayrıdır; bu yalnızca TAM disconnect içindir.
   Kasıtlı ayrılma (leaveRoom/hardLeave/kick/deny/room-closed) STATE._leaving ile ayrılır — o durumda rejoin edilmez. */
var GM_MAX_RECON=4;
function handleDisconnect(reason){
  if(STATE._leaving) return; // kasıtlı çıkış
  try{ if(LK&&LK.DisconnectReason&&reason===LK.DisconnectReason.CLIENT_INITIATED) return; }catch(e){}
  if(STATE.demo) return;
  STATE.connected=false;
  scheduleReconnect();
}
function scheduleReconnect(){
  if(STATE._leaving) return;
  clearTimeout(STATE._reconnectTimer);
  if(STATE._reconnectTries>=GM_MAX_RECON){ STATE._reconnecting=false; showReconnectFailed(); return; }
  STATE._reconnectTries++;
  setStatus('connecting','Yeniden bağlanılıyor…');
  var delay=STATE._reconnectTries===1?2200:3500;
  STATE._reconnectTimer=setTimeout(function(){
    if(STATE._leaving) return;
    STATE._reconnecting=true;
    // Eski oda referansını temizle (dinleyiciler + bağlantı) — yeni bir Room ile taze bağlanılır.
    try{ if(STATE.lkRoom){ if(STATE.lkRoom.removeAllListeners)STATE.lkRoom.removeAllListeners(); STATE.lkRoom.disconnect(true); } }catch(e){}
    STATE.lkRoom=null; STATE._tokenPromise=null;
    connectLiveKit();
  }, delay);
}
function showReconnectFailed(){
  setStatus('err','Bağlantı koptu');
  var ex=document.getElementById('gmr-recon'); if(ex)ex.remove();
  var b=document.createElement('div'); b.className='gmr-modal'; b.id='gmr-recon';
  b.innerHTML='<div class="gmr-modal-card" style="max-width:380px;text-align:center"><h3 style="margin-bottom:10px">Bağlantı koptu</h3><p style="color:var(--gm-ink-soft);font-size:14px;line-height:1.5;margin-bottom:18px">Sunucuya yeniden bağlanılamadı. İnternet bağlantını kontrol edip tekrar dene.</p><button class="gmr-btn" id="recon-retry">Tekrar Dene</button><button class="gmr-btn" id="recon-exit" style="background:transparent;border:1px solid var(--gm-line);color:var(--gm-ink-soft);margin-top:8px">Çıkış</button></div>';
  document.body.appendChild(b);
  b.querySelector('#recon-retry').addEventListener('click',function(){ b.remove(); STATE._reconnectTries=0; scheduleReconnect(); });
  b.querySelector('#recon-exit').addEventListener('click',function(){ STATE._leaving=true; hardLeave(); });
}
async function publishLocal(){ if(!STATE.lkRoom)return;
  try{ await STATE.lkRoom.localParticipant.setMicrophoneEnabled(STATE.micOn); }catch(e){}
  if(STATE.micOn) scheduleNoiseFilter();
  var lp=STATE.lkRoom.localParticipant;
  // ARKA PLANSIZ: gate track'ini doğrudan yayına taşı (kamera yeniden açılmaz, anlık).
  if(STATE.camOn && STATE.preTrack && !STATE._bgApplied){
    try{
      await lp.publishTrack(STATE.preTrack,{source:LK.Track.Source.Camera});
      STATE.camTrack=STATE.preTrack; STATE.preTrack=null; attachSelf();
    }catch(e){
      // Devir başarısızsa eski track'i MUTLAKA durdur — yoksa kamera meşgul kalır ve yeni track siyah gelir.
      try{ STATE.preTrack.stop(); }catch(_){}
      STATE.preTrack=null;
      try{ await lp.setCameraEnabled(true); }catch(e2){}
      var cp0=lp.getTrackPublication(LK.Track.Source.Camera);
      if(cp0&&cp0.videoTrack){ STATE.camTrack=cp0.videoTrack; attachSelf(); scheduleAutoBg(); }
    }
  } else {
    // ARKA PLAN SEÇİLİYSE (veya hazır track yoksa): işlenmiş pre-track'i BIRAK (cihazı serbest bırak),
    // kamerayı taze aç, sonra arka planı yeni track'e yeniden uygula. İşlenmiş track'i taşımak kırılgan → siyah.
    if(STATE.preTrack){ try{ STATE.preTrack.stop(); }catch(_){} STATE.preTrack=null; await new Promise(function(r){ setTimeout(r,180); }); }
    try{ await lp.setCameraEnabled(STATE.camOn); }catch(e){}
    if(STATE.camOn){ try{ if(STATE.camId) await STATE.lkRoom.switchActiveDevice('videoinput',STATE.camId); }catch(e){}
      var camPub=lp.getTrackPublication(LK.Track.Source.Camera);
      if(camPub&&camPub.videoTrack){ STATE.camTrack=camPub.videoTrack; attachSelf();
        if(STATE._bgApplied && STATE.bg && STATE.bg!=='none'){ applyBackground(STATE.bg); } else { scheduleAutoBg(); } } }
  }
  try{ if(STATE.micId) await STATE.lkRoom.switchActiveDevice('audioinput',STATE.micId); }catch(e){}
}
function showWaiting(){ var w=$('#gmr-waiting'); if(w)w.classList.remove('hidden'); }
function hideWaiting(){ var w=$('#gmr-waiting'); if(w)w.classList.add('hidden'); }
function admitSelf(){ if(STATE.admitted)return; STATE.admitted=true; clearTimeout(STATE._admitTimer); hideWaiting(); $$('#gmr-videos audio').forEach(function(a){a.muted=false;}); publishLocal(); if(STATE.breakout) refreshBreakoutAV(); }
function addPending(id,name){ if(!id||STATE.pending.some(function(p){return p.id===id;}))return; STATE.pending.push({id:id,name:name}); renderPending(); toast(name+' kapıda bekliyor.'); }
function removePending(id){ STATE.pending=STATE.pending.filter(function(p){return p.id!==id;}); renderPending(); }
function pendItemsHtml(){ return STATE.pending.map(function(p){ return '<div class="pend-item"><span class="hqn">'+esc(p.name)+'</span><button data-admit="'+esc(p.id)+'">Kabul</button><button class="deny" data-deny="'+esc(p.id)+'">Reddet</button></div>'; }).join(''); }
function ensurePendPop(){
  var pop=document.getElementById('gmr-pendpop');
  if(pop)return pop;
  pop=document.createElement('div'); pop.id='gmr-pendpop'; pop.className='gmr-pendpop hidden';
  pop.innerHTML='<div class="gmr-pendpop-h"><span class="gmr-pendpop-t">Kapıda bekleyenler</span><button class="gmr-pendpop-x" title="Gizle" aria-label="Gizle">&times;</button></div><div class="gmr-pendpop-list"></div>';
  document.body.appendChild(pop);
  pop.querySelector('.gmr-pendpop-x').addEventListener('click',function(){ pop.classList.add('hidden'); });
  pop.querySelector('.gmr-pendpop-list').addEventListener('click',function(e){ var a=e.target.closest('[data-admit]'),d=e.target.closest('[data-deny]'); if(a){ var id=a.getAttribute('data-admit'); sendData({t:'admit',target:id}); removePending(id); } else if(d){ var id2=d.getAttribute('data-deny'); sendData({t:'deny',target:id2}); removePending(id2); } });
  return pop;
}
function renderPending(){
  var items=pendItemsHtml();
  var el=$('#pending-list'); if(el){ el.innerHTML=STATE.pending.length?('<div class="hq-h">Kapıda bekleyenler ('+STATE.pending.length+')</div>'+items):''; }
  /* Sağ alt köşede kalıcı popup — öğretmen paneli açmadan da bekleyenleri görür ve içeri alır */
  var pop=ensurePendPop();
  if(STATE.pending.length){
    var t=pop.querySelector('.gmr-pendpop-t'); if(t)t.textContent='Kapıda bekleyenler ('+STATE.pending.length+')';
    var lst=pop.querySelector('.gmr-pendpop-list'); if(lst)lst.innerHTML=items;
    pop.classList.remove('hidden');
  } else { pop.classList.add('hidden'); }
}
function bindWaiting(){
  var b=$('#btn-waiting'); if(b){ b.textContent='Bekleme Odası: '+(STATE.waitingRoom?'Açık':'Kapalı'); b.classList.toggle('on',STATE.waitingRoom); b.addEventListener('click',function(){ STATE.waitingRoom=!STATE.waitingRoom; this.textContent='Bekleme Odası: '+(STATE.waitingRoom?'Açık':'Kapalı'); this.classList.toggle('on',STATE.waitingRoom); toast(STATE.waitingRoom?'Bekleme odası açık — girenler onay bekler.':'Bekleme odası kapalı.'); if(!STATE.waitingRoom){ STATE.pending.forEach(function(p){ sendData({t:'admit',target:p.id}); }); STATE.pending=[]; renderPending(); } }); }
  var pl=$('#pending-list'); if(pl)pl.addEventListener('click',function(e){ var a=e.target.closest('[data-admit]'),d=e.target.closest('[data-deny]'); if(a){ var id=a.getAttribute('data-admit'); sendData({t:'admit',target:id}); removePending(id); } else if(d){ var id2=d.getAttribute('data-deny'); sendData({t:'deny',target:id2}); removePending(id2); } });
  var wc=$('#wait-cancel'); if(wc)wc.addEventListener('click',hardLeave);
}
function enterDemo(reason){
  // Yeniden bağlanma denemesi sırasında demo moduna DÜŞME — yeniden dene / "Tekrar dene" göster.
  if(STATE._reconnecting && !STATE._leaving){ scheduleReconnect(); return; }
  STATE.demo=true; setStatus('demo','Demo modu');
  try{ if(STATE.preTrack){ STATE.preTrack.detach(); STATE.preTrack.stop(); STATE.preTrack=null; } }catch(e){}
  sysChat('Demo modu: '+reason+'. Gerçek video/arka plan için canlı bağlantı gerekir; tahta, materyal ve araçlar çalışır.');
  navigator.mediaDevices.getUserMedia({video:STATE.camOn,audio:false}).then(function(st){ STATE.localStream=st; attachSelf(); }).catch(function(){});
  refreshPeople(); updateGridCount();
}
function setStatus(cls,txt){ $('#gmr-status').className='gmr-status '+cls; $('#gmr-status-txt').textContent=txt; }
function blockJoin(msg){
  STATE._reconnecting=false; STATE._reconnectTries=0; clearTimeout(STATE._reconnectTimer);
  setStatus('err','Oda yok');
  var ex=document.getElementById('gmr-block'); if(ex)ex.remove();
  var b=document.createElement('div'); b.className='gmr-gate'; b.id='gmr-block';
  b.innerHTML='<div class="gmr-gate-card"><div class="gmr-brand big">Gri<span>Meet</span></div><p style="color:#d66;font-size:15px;margin:16px 0;line-height:1.5">'+esc(msg)+'</p><button class="gmr-btn" id="blk-retry">Tekrar Dene</button><button class="gmr-btn" id="blk-exit" style="background:transparent;border:1px solid var(--gm-line);color:var(--gm-ink-soft);margin-top:8px">Çıkış</button></div>';
  document.body.appendChild(b);
  b.querySelector('#blk-retry').addEventListener('click',function(){ b.remove(); connectLiveKit(); });
  b.querySelector('#blk-exit').addEventListener('click',function(){ location.href='grimeet.html'; });
}
function isScreen(pub){ return pub&&(pub.source===LK.Track.Source.ScreenShare); }

function onParticipant(p){ ensureTile(p.identity,{name:p.name||'Öğrenci',host:isHostMeta(p)}); recordAttend(p.identity,p.name||'Öğrenci'); refreshPeople(); updateGridCount(); p.trackPublications.forEach(function(pub){ if(pub.isSubscribed&&pub.track) attachTrack(pub.track,pub,p); }); }
var promotedHosts=new Set();
function isHostMeta(p){ try{ if(p&&p.identity&&promotedHosts.has(p.identity))return true; return (p.metadata&&JSON.parse(p.metadata).host)===true; }catch(e){ return false; } }
function becomeHost(){ if(STATE.isHost)return; STATE.isHost=true; var app=$('#gm-app'); if(app){ app.classList.remove('is-student'); app.classList.add('is-host'); } var rn=$('#gmr-room-name'); if(rn)rn.textContent='Ders Odası (Öğretmen)'; toast('Öğretmen sana ders yönetimi yetkisi verdi.'); try{ DOC.startSnapshots(); }catch(e){} refreshPeople(); }

function attachTrack(track,pub,p){
  if(isScreen(pub)){ try{ if(pub.setVideoQuality&&LK.VideoQuality) pub.setVideoQuality(LK.VideoQuality.HIGH); }catch(e){} attachScreen(track,false); return; }
  var t=ensureTile(p.identity,{name:p.name||'Öğrenci',host:isHostMeta(p)});
  if(track.kind==='video'){ var v=t.querySelector('video.cam')||document.createElement('video'); v.className='cam'; v.autoplay=true;v.playsInline=true; track.attach(v); var av=t.querySelector('.avatar'); if(av)av.remove(); if(!v.parentNode)t.insertBefore(v,t.firstChild); if(STATE.spotlight===p.identity) applySpotlightVideo(); }
  else if(track.kind==='audio'){ var a=document.createElement('audio'); a.autoplay=true; a.muted=(!STATE.isHost&&!STATE.admitted); track.attach(a); t.appendChild(a); if(STATE.breakout) refreshBreakoutAV(); }
}
function attachSelf(){
  var t=ensureTile('self',{name:STATE.name+' (Sen)',host:STATE.isHost});
  var v=t.querySelector('video.cam');
  var mirCls='cam'+((STATE.mirror!==false)?' mirror':'');
  if(STATE.camTrack){ if(!v){ v=document.createElement('video'); v.className=mirCls; v.autoplay=true;v.muted=true;v.playsInline=true; } else { v.className=mirCls; } STATE.camTrack.attach(v); var av=t.querySelector('.avatar'); if(av)av.remove(); if(!v.parentNode)t.insertBefore(v,t.firstChild); }
  // Yayın öncesi (öğrenci bekleme odasında): gate'te açılan preTrack'i self-kutuda göster,
  // yoksa katılınca kamera "ölmüş" gibi kararır.
  else if(STATE.preTrack){ if(!v){ v=document.createElement('video'); v.className=mirCls; v.autoplay=true;v.muted=true;v.playsInline=true; } else { v.className=mirCls; } STATE.preTrack.attach(v); var av3=t.querySelector('.avatar'); if(av3)av3.remove(); if(!v.parentNode)t.insertBefore(v,t.firstChild); }
  else if(STATE.localStream){ if(!v){ v=document.createElement('video'); v.className=mirCls; v.autoplay=true;v.muted=true;v.playsInline=true; v.srcObject=STATE.localStream; var av2=t.querySelector('.avatar'); if(av2)av2.remove(); t.insertBefore(v,t.firstChild); } else { v.className=mirCls; } }
}

function attachScreen(track,local){ var box=$('#gmr-screen'); var v=box.querySelector('video'); if(!v){ v=document.createElement('video'); v.autoplay=true;v.playsInline=true; if(local)v.muted=true; box.insertBefore(v,box.firstChild); }
  STATE._screenTrack=track;
  try{ track.attach(v); }catch(e){}
  // Paylaşılan pencere resize/track değişince donma/kararma olmasın: metadata/resize'da zoom'u yeniden uygula,
  // videoyu oynat; gerekiyorsa aktif track'i yeniden bağla. Dinleyiciler bir kez bağlanır.
  if(!v._gmScreenBound){ v._gmScreenBound=true;
    var reflow=function(){ try{ applyScreenZoom(); if(v.paused){ var pr=v.play(); if(pr&&pr.catch)pr.catch(function(){}); } }catch(e){} };
    v.addEventListener('loadedmetadata',reflow);
    v.addEventListener('resize',function(){ reflow(); try{ if(STATE._screenTrack) STATE._screenTrack.attach(v); }catch(e){} });
    v.addEventListener('pause',function(){ try{ var pr=v.play(); if(pr&&pr.catch)pr.catch(function(){}); }catch(e){} });
  }
  $('#scr-label').textContent=local?'Ekranını paylaşıyorsun':'Paylaşılan ekran'; setMode('screen'); applyScreenZoom(); if(local&&STATE.isHost&&STATE.scrZoom&&STATE.scrZoom!==1){ try{ sendData({t:'scr-zoom',z:STATE.scrZoom}); }catch(e){} } }
function clearScreen(){ var box=$('#gmr-screen'); var v=box.querySelector('video'); if(v)v.remove(); STATE._screenTrack=null; STATE.scrZoom=1; applyScreenZoom(); }
// Ekran paylaşımı zoom — her izleyici kendi görünümünü büyütür (yerel); >1'de kaydırarak gezilir.
function applyScreenZoom(){
  var box=document.getElementById('gmr-screen'); if(!box)return;
  var v=box.querySelector('video');
  if(v){ v.style.width=(STATE.scrZoom*100)+'%'; v.style.height='auto'; v.style.maxWidth='none'; v.style.margin='0 auto'; v.style.display='block'; }
  box.style.overflow = STATE.scrZoom>1 ? 'auto' : 'hidden';
  var val=document.getElementById('scr-zoom-val'); if(val)val.textContent=Math.round(STATE.scrZoom*100)+'%';
}
// Tab/pencere değişince kamerayı küçük PiP penceresinde göster (Google Meet gibi).
// Sekme gizlenince en anlamlı videoyu PiP'e alır; geri dönünce kapatır.
function setupAutoPiP(){
  if(!('pictureInPictureEnabled' in document) || !document.pictureInPictureEnabled) return;
  var cv=null,cx=null,hv=null,stm=null,drawT=null;
  function screenVid(){ var v=document.querySelector('#gmr-screen video'); return (v&&v.videoWidth>0&&v.readyState>=2)?v:null; }
  function cams(){ var out=[]; document.querySelectorAll('#gmr-spotlight video.cam, #gmr-videos video.cam').forEach(function(v){ if(v.videoWidth>0&&v.readyState>=2&&v.offsetParent!==null) out.push(v); }); return out; }
  function stopDraw(){ if(drawT){clearInterval(drawT);drawT=null;} if(stm){ try{stm.getTracks().forEach(function(t){t.stop();});}catch(e){} stm=null;} if(hv){ try{hv.srcObject=null;}catch(e){} } }
  function drawFrame(){
    var list=cams(); if(!list.length) return;
    var n=Math.min(list.length,12), cols=Math.ceil(Math.sqrt(n)), rows=Math.ceil(n/cols);
    var CW=640, CH=360; if(cv.width!==CW){cv.width=CW;} if(cv.height!==CH){cv.height=CH;}
    cx.fillStyle='#0d0f10'; cx.fillRect(0,0,CW,CH);
    var cw=CW/cols, ch=CH/rows, gap=3;
    for(var i=0;i<n;i++){
      var v=list[i], r=Math.floor(i/cols), c=i%cols;
      var ox=c*cw+gap, oy=r*ch+gap, w=cw-gap*2, h=ch-gap*2;
      var vr=v.videoWidth/v.videoHeight, br=w/h, sw,sh,sx,sy;
      if(vr>br){ sh=v.videoHeight; sw=sh*br; sx=(v.videoWidth-sw)/2; sy=0; } else { sw=v.videoWidth; sh=sw/br; sx=0; sy=(v.videoHeight-sh)/2; }
      cx.save();
      try{
        if(v.classList.contains('mirror')){ cx.translate(ox+w,oy); cx.scale(-1,1); cx.drawImage(v,sx,sy,sw,sh,0,0,w,h); }
        else { cx.drawImage(v,sx,sy,sw,sh,ox,oy,w,h); }
      }catch(e){}
      cx.restore();
    }
  }
  async function enterPiP(){
    if(document.pictureInPictureElement) return;
    var scr=screenVid();
    if(scr && scr.requestPictureInPicture){ try{ if(scr.paused){var p=scr.play(); if(p&&p.catch)p.catch(function(){});} await scr.requestPictureInPicture(); }catch(e){} return; }
    var list=cams(); if(!list.length) return;
    /* Birden çok kamerayı (öğrenciler + öğretmen) tek PiP'te göstermek için canvas'a grid çiz;
       self'i ekrandaki tile ile aynı aynalama yönünde çiz (flip algısını önler). */
    if(!cv){ cv=document.createElement('canvas'); cv.width=640; cv.height=360; cx=cv.getContext('2d'); }
    if(!hv){ hv=document.createElement('video'); hv.muted=true; hv.playsInline=true; hv.setAttribute('playsinline',''); hv.style.cssText='position:fixed;left:-9999px;top:0;width:2px;height:2px;opacity:0;pointer-events:none;'; document.body.appendChild(hv); }
    stopDraw();
    drawFrame();
    drawT=setInterval(drawFrame,120); /* arka planda tarayıcı ~1fps'e kısabilir; yüzleri görmek için yeterli */
    try{ stm=cv.captureStream(12); hv.srcObject=stm; var pp=hv.play(); if(pp&&pp.catch)pp.catch(function(){}); }catch(e){ stopDraw(); return; }
    try{ await hv.requestPictureInPicture(); }catch(e){ stopDraw(); }
  }
  function exitPiP(){ try{ if(document.pictureInPictureElement) document.exitPictureInPicture().catch(function(){}); }catch(e){} stopDraw(); }
  document.addEventListener('visibilitychange',function(){ try{ if(document.hidden) enterPiP(); else exitPiP(); }catch(e){} });
  document.addEventListener('leavepictureinpicture',function(){ stopDraw(); });
}
function bindScreenZoom(){
  var zi=document.getElementById('scr-zoom-in'), zo=document.getElementById('scr-zoom-out');
  if(zi)zi.addEventListener('click',function(){ STATE.scrZoom=Math.min(3,Math.round((STATE.scrZoom+0.2)*100)/100); applyScreenZoom(); if(STATE.isHost)sendData({t:'scr-zoom',z:STATE.scrZoom}); });
  if(zo)zo.addEventListener('click',function(){ STATE.scrZoom=Math.max(1,Math.round((STATE.scrZoom-0.2)*100)/100); applyScreenZoom(); if(STATE.isHost)sendData({t:'scr-zoom',z:STATE.scrZoom}); });
}

/* ================= TILES ================= */
function tileEl(id){ return STATE.tiles[id]; }
function ensureTile(id,info){
  if(STATE.tiles[id]) return STATE.tiles[id];
  var t=document.createElement('div'); t.className='vtile'+(info&&info.host?' host':''); t.dataset.id=id;
  var ctrl='<div class="tilectrl"><button data-act="pin" title="Sabitle"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 4h6l-1 6 3 3v2H7v-2l3-3z"/><path d="M12 15v5"/></svg></button>'+
    (STATE.isHost?('<button data-act="spot" title="Odağa al"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v3M12 18v3M3 12h3M18 12h3"/><circle cx="12" cy="12" r="4"/></svg></button>'+
      (id!=='self'?'<button data-act="mute" title="Sustur"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 9v3a3 3 0 0 0 5 2M9 5a3 3 0 0 1 6 0v3M4 4l16 16"/></svg></button><button data-act="kick" class="danger" title="Çıkar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6L6 18"/></svg></button>':'')):'')+'</div>';
  t.innerHTML='<div class="avatar"><span>'+initials(info?info.name:'?')+'</span></div>'+
    '<div class="name"><span class="nm">'+esc(info?info.name:'Öğrenci')+'</span></div>'+
    '<span class="qdot" title="Bağlantı"></span>'+
    (info&&info.host?'<div class="badge">Öğretmen</div>':'')+ctrl;
  STATE.tiles[id]=t; $('#gmr-videos').appendChild(t); updateGridCount(); return t;
}
function renderPlaceholder(id){ var t=tileEl(id); if(!t)return; var v=t.querySelector('video.cam'); if(v)v.remove(); if(!t.querySelector('.avatar')){ var d=document.createElement('div'); d.className='avatar'; d.innerHTML='<span>'+initials(t.querySelector('.nm').textContent)+'</span>'; t.insertBefore(d,t.firstChild); } }
function removeTile(id){ var t=tileEl(id); if(t){t.remove(); delete STATE.tiles[id]; updateGridCount();} }
function updateMic(id,on){ var t=tileEl(id); if(!t)return; var nm=t.querySelector('.name'); var m=nm.querySelector('.mic-off'); if(!on&&!m){ var s=document.createElement('span'); s.className='mic-off'; s.textContent='🔇'; nm.appendChild(s);} else if(on&&m)m.remove(); }
function onSpeakers(sp){ var ids={},first=null; sp.forEach(function(p){ var tid=(STATE.lkRoom&&p.identity===STATE.lkRoom.localParticipant.identity)?'self':p.identity; ids[tid]=1; if(!first)first=tid; }); Object.keys(STATE.tiles).forEach(function(id){ STATE.tiles[id].classList.toggle('speaking',!!ids[id]); }); if(first)STATE.activeSpeaker=first; if(STATE.layout==='speaker'&&!STATE.pinned) updateFeatured(); }
function updateGridCount(){ var n=Object.keys(STATE.tiles).length; $('#gmr-videos').setAttribute('data-n',n); $('#gmr-count-n').textContent=n; if(STATE.layout==='speaker') updateFeatured(); }

/* ================= MODE / VIEW ================= */
var MODE_LBL={grid:'Kameralar',board:'Tahta',materials:'Materyal',screen:'Ekran',spotlight:'Odak',doc:'Yazı Tahtası'};
function setMode(mode,opts){
  opts=opts||{}; STATE.mode=mode; $('#gm-app').setAttribute('data-mode',mode);
  $('#ctrl-board').classList.toggle('active',mode==='board');
  $('#ctrl-materials').classList.toggle('active',mode==='materials');
  var _cd=$('#ctrl-doc'); if(_cd) _cd.classList.toggle('active',mode==='doc');
  $('#gmr-share-what').textContent=MODE_LBL[mode]||'Kameralar';
  if(mode==='board') setTimeout(WB.resize,40);
  if(mode==='doc') setTimeout(function(){ var a=document.querySelector('#doc-col-C .ql-editor'); if(a)a.focus(); },80);
  if(STATE.isHost&&!opts.remote) sendData({t:'view',mode:mode});
}

/* ================= SPOTLIGHT ================= */
function setSpotlight(id,opts){
  opts=opts||{}; STATE.spotlight=id;
  if(!id){ if(STATE.mode==='spotlight') setMode('grid',opts); if(STATE.isHost&&!opts.remote) sendData({t:'spotlight',target:null}); return; }
  applySpotlightVideo(); setMode('spotlight',opts);
  var t=tileEl(id); $('#spot-label').textContent=(t?t.querySelector('.nm').textContent:'Odak');
  if(STATE.isHost&&!opts.remote) sendData({t:'spotlight',target:id});
}
function applySpotlightVideo(){
  var id=STATE.spotlight; if(!id)return; var box=$('#gmr-spotlight'); var v=box.querySelector('video'); if(!v){ v=document.createElement('video'); v.autoplay=true;v.playsInline=true; box.insertBefore(v,box.firstChild); }
  var track=null;
  if(id==='self'){ track=STATE.camTrack; v.muted=true; }
  else if(STATE.lkRoom){ STATE.lkRoom.remoteParticipants.forEach(function(p){ if(p.identity===id){ var pub=p.getTrackPublication(LK.Track.Source.Camera); if(pub&&pub.videoTrack)track=pub.videoTrack; } }); }
  if(track) track.attach(v);
}

/* ===== Layout: Galeri / Konuşmacı + Pin + Tam ekran ===== */
function setLayout(l){ STATE.layout=l; $('#gm-app').setAttribute('data-layout',l); var b=$('#gmr-layout'); if(b)b.classList.toggle('on',l==='speaker'); updateFeatured(); if(l==='speaker') initSpotW(true); toast(l==='speaker'?'Konuşmacı görünümü':'Galeri görünümü'); }
/* Konuşmacı/sabitleme görünümü: odak (SOL) genişliği — lokal, --gm-spot-w px olarak tutulur (yayınlanmaz) */
function spotVideosW(){ var v=$('#gmr-videos'); return v?Math.max(0,v.clientWidth-32):0; }
function clampSpotW(px){ var vw=spotVideosW(); if(vw<=0)return Math.round(px); return Math.max(Math.round(vw*0.30),Math.min(Math.round(vw*0.75),Math.round(px))); }
function initSpotW(reset){ if(STATE.layout!=='speaker')return; var v=$('#gmr-videos'); if(!v)return; var vw=Math.max(0,v.clientWidth-32); if(vw<=0)return; var cur=parseInt((getComputedStyle(document.documentElement).getPropertyValue('--gm-spot-w')||''),10); var px=(reset||!cur||isNaN(cur))?Math.round(vw*0.5):cur; document.documentElement.style.setProperty('--gm-spot-w',clampSpotW(px)+'px'); document.documentElement.style.setProperty('--gm-spot-h',Math.max(240,v.clientHeight-32)+'px'); }
function updateFeatured(){
  Object.keys(STATE.tiles).forEach(function(id){ STATE.tiles[id].classList.remove('featured'); STATE.tiles[id].classList.toggle('pinned',STATE.pinned===id); });
  if(STATE.layout!=='speaker')return;
  var id=STATE.pinned; if(!id||!tileEl(id)) id=STATE.activeSpeaker;
  if(!id||!tileEl(id)){ id=null; Object.keys(STATE.tiles).forEach(function(k){ if(!id&&STATE.tiles[k].classList.contains('host'))id=k; }); if(!id) id=(tileEl('self')?'self':Object.keys(STATE.tiles)[0]); }
  var t=tileEl(id); if(t)t.classList.add('featured');
}
function togglePin(id){ if(!id)return; STATE.pinned=(STATE.pinned===id?null:id); if(STATE.pinned&&STATE.layout!=='speaker'){ setLayout('speaker'); } else updateFeatured(); toast(STATE.pinned?'Katılımcı sabitlendi':'Sabitleme kaldırıldı'); }
function toggleFullscreen(){ try{ if(!document.fullscreenElement){ var el=document.documentElement; (el.requestFullscreen||el.webkitRequestFullscreen).call(el); $('#gmr-fs').classList.add('on'); } else { (document.exitFullscreen||document.webkitExitFullscreen).call(document); $('#gmr-fs').classList.remove('on'); } }catch(e){} }
/* Resizable galeri: kamera tile min-genişligini ayarla (herkesin kamerasi grid'de) */
function setTileSize(px,save){ px=Math.max(160,Math.min(620,px|0)); document.documentElement.style.setProperty('--tile-min',px+'px'); var app=$('#gm-app'); if(app)app.setAttribute('data-tilemanual','1'); var r=$('#gmr-tile-range'); if(r&&(+r.value)!==px)r.value=px; if(save!==false){ try{ localStorage.setItem('gm-tilemin',px); }catch(e){} } }

function bindControls(){
  $('#ctrl-mic').addEventListener('click',async function(){ STATE.micOn=!STATE.micOn; this.setAttribute('data-on',STATE.micOn?'1':'0'); if(STATE.lkRoom){try{await STATE.lkRoom.localParticipant.setMicrophoneEnabled(STATE.micOn);}catch(e){}} if(STATE.micOn){ _krispOn=false; setTimeout(applyNoiseFilter,600); } refreshPeople(); });
  $('#ctrl-cam').addEventListener('click',async function(){ STATE.camOn=!STATE.camOn; this.setAttribute('data-on',STATE.camOn?'1':'0');
    if(STATE.lkRoom){ try{ await STATE.lkRoom.localParticipant.setCameraEnabled(STATE.camOn); }catch(e){}
      if(STATE.camOn){ var cp=STATE.lkRoom.localParticipant.getTrackPublication(LK.Track.Source.Camera); if(cp&&cp.videoTrack){ STATE.camTrack=cp.videoTrack; attachSelf(); if(STATE._bgApplied&&STATE.bg&&STATE.bg!=='none'){ applyBackground(STATE.bg); } else { scheduleAutoBg(); } } }
      else { STATE.camTrack=null; renderPlaceholder('self'); } } });
  $('#ctrl-tools').addEventListener('click',function(){ toggleDock('tools'); });
  $('#ctrl-share').addEventListener('click',shareScreen);
  $('#ctrl-board').addEventListener('click',function(){ setMode(STATE.mode==='board'?'grid':'board'); });
  $('#ctrl-materials').addEventListener('click',function(){ setMode(STATE.mode==='materials'?'grid':'materials'); });
  var _cdoc=$('#ctrl-doc'); if(_cdoc) _cdoc.addEventListener('click',function(){ setMode(STATE.mode==='doc'?'grid':'doc'); });
  $('#ctrl-bg').addEventListener('click',function(){ $('#bg-modal').classList.remove('hidden'); });
  $('#ctrl-record').addEventListener('click',function(){ $('#rec-modal').classList.remove('hidden'); });
  $('#ctrl-hand').addEventListener('click',function(){ STATE.handUp=!STATE.handUp; this.classList.toggle('active',STATE.handUp); setSelfHand(STATE.handUp); sendData({t:'hand',up:STATE.handUp}); if(STATE.handUp)toast('El kaldırdın.'); });
  $('#ctrl-people').addEventListener('click',function(){ toggleDock('people'); });
  $('#ctrl-chat').addEventListener('click',function(){ toggleDock('chat'); });
  $('#ctrl-leave').addEventListener('click',leaveRoom);
  $('#gmr-code').addEventListener('click',function(){ var code=STATE.room||''; var link=location.origin+location.pathname+'?room='+encodeURIComponent(code); try{ navigator.clipboard.writeText(link); toast('Davet linki kopyalandı — öğrencilere gönder, tıklayınca odaya katılırlar.'); }catch(e){ try{ navigator.clipboard.writeText(code); toast('Oda kodu kopyalandı: '+code); }catch(_){} } });
  $('#gmr-videos').addEventListener('click',function(e){ var b=e.target.closest('[data-act]'); if(!b)return; var id=b.closest('.vtile').dataset.id;
    if(b.dataset.act==='pin'){ togglePin(id); return; }
    if(!STATE.isHost)return;
    if(b.dataset.act==='spot'){ setSpotlight(STATE.spotlight===id?null:id); }
    else if(b.dataset.act==='mute'){ sendData({t:'force-mute',target:id}); toast('Susturma isteği gönderildi.'); }
    else if(b.dataset.act==='kick'){ if(confirm('Bu katılımcı çıkarılsın mı?')){ sendData({t:'kick',target:id}); toast('Çıkarma isteği gönderildi.'); } } });
  $$('[data-close-modal]').forEach(function(x){ x.addEventListener('click',function(){ x.closest('.gmr-modal').classList.add('hidden'); }); });
  $$('.gmr-modal').forEach(function(m){ if(m.id==='quiz-modal')return; m.addEventListener('click',function(e){ if(e.target===m)m.classList.add('hidden'); }); });
  $('#dock-close').addEventListener('click',function(){ $('#gmr-dock').classList.add('hidden'); $('#ctrl-people').classList.remove('active'); $('#ctrl-chat').classList.remove('active'); var ct=$('#ctrl-tools'); if(ct)ct.classList.remove('active'); });
  $('#gmr-layout').addEventListener('click',function(){ setLayout(STATE.layout==='gallery'?'speaker':'gallery'); });
  (function(){ var r=$('#gmr-tile-range'); if(r)r.addEventListener('input',function(){ setTileSize(+this.value); }); var d=$('#gmr-tile-down'); if(d)d.addEventListener('click',function(){ var c=(+($('#gmr-tile-range')||{}).value)||230; setTileSize(c-40); }); var u=$('#gmr-tile-up'); if(u)u.addEventListener('click',function(){ var c=(+($('#gmr-tile-range')||{}).value)||230; setTileSize(c+40); }); })();
  $('#gmr-fs').addEventListener('click',toggleFullscreen);
  $('#gmr-videos').addEventListener('dblclick',function(e){ var t=e.target.closest('.vtile'); if(t) togglePin(t.dataset.id); });
  document.addEventListener('fullscreenchange',function(){ var b=$('#gmr-fs'); if(b)b.classList.toggle('on',!!document.fullscreenElement); });
  bindSplit(); bindDockResize(); bindSpotResize();
}
function bindDockResize(){
  var h=$('#dock-resize'), dock=$('#gmr-dock'), dragging=false;
  if(!h)return;
  h.addEventListener('pointerdown',function(e){ dragging=true; h.setPointerCapture(e.pointerId); e.preventDefault(); });
  h.addEventListener('pointermove',function(e){ if(!dragging)return; var w=window.innerWidth-e.clientX; w=Math.max(260,Math.min(640,w)); dock.style.width=w+'px'; });
  h.addEventListener('pointerup',function(e){ dragging=false; try{h.releasePointerCapture(e.pointerId);}catch(_){} });
}
function toggleDock(which){
  var dock=$('#gmr-dock'), open=!dock.classList.contains('hidden'), cur=dock.getAttribute('data-active');
  function syncCtrls(w){ $('#ctrl-people').classList.toggle('active',w==='people'); $('#ctrl-chat').classList.toggle('active',w==='chat'); var ct=$('#ctrl-tools'); if(ct)ct.classList.toggle('active',w==='tools'); }
  if(open&&cur===which){ dock.classList.add('hidden'); syncCtrls(null); return; }
  dock.classList.remove('hidden'); dock.setAttribute('data-active',which);
  $$('.dock-tab').forEach(function(t){ t.classList.toggle('active',t.dataset.dock===which); });
  $$('.dock-pane').forEach(function(p){ p.classList.toggle('hidden',p.getAttribute('data-dock-pane')!==which); });
  syncCtrls(which);
  if(which==='chat'){ chatUnread=0; $('#chat-badge').classList.remove('show'); }
}
function bindDockTabs(){ $$('.dock-tab').forEach(function(t){ t.addEventListener('click',function(){ toggleDockTab(t.dataset.dock); }); }); }
function toggleDockTab(which){ var dock=$('#gmr-dock'); dock.setAttribute('data-active',which); $$('.dock-tab').forEach(function(t){ t.classList.toggle('active',t.dataset.dock===which); }); $$('.dock-pane').forEach(function(p){ p.classList.toggle('hidden',p.getAttribute('data-dock-pane')!==which); }); if(which==='chat'){ chatUnread=0; $('#chat-badge').classList.remove('show'); } }
/* NOT: 'assign' sekmesini artık grimeet-oda.html içindeki zengin panel (native + GE havuz ödevleri,
   öğretmen/öğrenci görünümü) tek başına yönetir. Eski loadClassAssignments() ile #gm-assign-root'a
   çift yazım yarışı ödevlerin kaybolmasına/yanıp sönmesine yol açıyordu (#107) — çağrı kaldırıldı. */
// Ders sırasında sınıf ödevlerini + tamamlanma oranını göster (öğretmen sınıftan başlattıysa).
var _gmAssignLoaded=false;
function loadClassAssignments(force){
  var root=document.getElementById('gm-assign-root'); if(!root) return;
  if(_gmAssignLoaded && !force) return;
  if(!STATE.supabase || !STATE.classId){ root.innerHTML='<div class="dock-empty" style="padding:8px 0">Sınıf ödevleri yalnızca sınıftan başlatılan canlı derste görünür.</div>'; _gmAssignLoaded=true; return; }
  root.innerHTML='<div class="dock-empty" style="padding:8px 0">Yükleniyor…</div>';
  STATE.supabase.rpc('list_class_assignments',{p_class_id:STATE.classId}).then(function(r){
    if(r.error) throw r.error;
    var list=r.data||[]; _gmAssignLoaded=true;
    if(!list.length){ root.innerHTML='<div class="dock-empty" style="padding:8px 0">Bu sınıfa henüz ödev atanmamış.</div>'; return; }
    root.innerHTML='<div style="display:flex;flex-direction:column;gap:8px">'+list.map(function(a){
      var total=parseInt(a.total_students,10)||0, done=parseInt(a.completed_count,10)||0;
      var pct=total>0?Math.round(100*done/total):0;
      var url=(a.config&&a.config.url)?a.config.url:'';
      return '<div style="background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);border-radius:10px;padding:10px 12px">'
        +'<div style="font-weight:600;font-size:13px;margin-bottom:5px">'+esc(a.title||'Ödev')+'</div>'
        +'<div style="height:6px;background:rgba(255,255,255,.12);border-radius:4px;overflow:hidden;margin-bottom:5px"><div style="height:100%;width:'+pct+'%;background:#3a9d78"></div></div>'
        +'<div style="font-size:11px;opacity:.78">'+done+' / '+total+' tamamladı · %'+pct+(url?' · <a href="'+esc(url)+'" target="_blank" rel="noopener" style="color:#8fd3bd">Aç</a>':'')+'</div>'
      +'</div>';
    }).join('')+'</div>'
    +'<button id="gm-assign-refresh" style="margin-top:8px;width:100%;padding:7px;border:1px solid rgba(255,255,255,.18);background:transparent;color:#cfe;border-radius:8px;cursor:pointer;font-size:12px">Yenile</button>';
    var rb=document.getElementById('gm-assign-refresh'); if(rb)rb.addEventListener('click',function(){ loadClassAssignments(true); });
  }).catch(function(e){ root.innerHTML='<div class="dock-empty" style="padding:8px 0;color:#e88">Yüklenemedi: '+esc(e&&e.message||e)+'</div>'; _gmAssignLoaded=false; });
}

async function shareScreen(){
  if(!STATE.lkRoom){ toast('Ekran paylaşımı için canlı bağlantı gerekli.'); return; }
  var on=STATE.lkRoom.localParticipant.isScreenShareEnabled;
  if(on){ doShareScreen(); return; } // kapatma her zaman serbest
  if(!STATE.isHost && !STATE._shareOK){ sendData({t:'share-req',name:STATE.name}); toast('Ekran paylaşımı için öğretmen onayı bekleniyor…'); return; }
  doShareScreen();
}
async function doShareScreen(){
  if(!STATE.lkRoom)return;
  try{ var on=STATE.lkRoom.localParticipant.isScreenShareEnabled; await STATE.lkRoom.localParticipant.setScreenShareEnabled(!on,{audio:true}); $('#ctrl-share').classList.toggle('active',!on); if(!on){ setMode('screen'); toast('Ses için "Sekme sesini paylaş" kutusunu işaretle.'); STATE._shareOK=false; } else { clearScreen(); setMode('grid'); } }
  catch(e){ toast('Ekran paylaşımı iptal edildi.'); }
}
function leaveRoom(){ if(!confirm('Dersten ayrılmak istiyor musun?'))return; if(STATE.isHost){ try{ if(confirm('Ayrılmadan ders paketini (özet + transcript + tahta) indirmek ister misin?')) endLessonPackage(); }catch(e){} } hardLeave(); }
// TÜM kamera/mikrofon kaynaklarını serbest bırak — yayınlanmış VE yayınlanmamış
// (preTrack, gateStream, camTrack, localStream). Her çıkış yolunda çağrılmalı, yoksa
// track açık kalır ve OS kamerayı "kullanımda" görür → başka sekme/site de alamaz.
function releaseAllMedia(){
  try{ if(STATE.lkRoom&&STATE.lkRoom.localParticipant){ STATE.lkRoom.localParticipant.trackPublications.forEach(function(pub){ try{ if(pub.track&&pub.track.stop) pub.track.stop(); }catch(_){}}); } }catch(e){}
  try{ if(STATE.preTrack){ try{STATE.preTrack.detach();}catch(_){} try{STATE.preTrack.stop();}catch(_){} STATE.preTrack=null; } }catch(e){}
  try{ if(STATE.camTrack){ if(STATE.camTrack.stop) STATE.camTrack.stop(); STATE.camTrack=null; } }catch(e){}
  try{ if(gateStream){ gateStream.getTracks().forEach(function(t){try{t.stop();}catch(_){}}); gateStream=null; } }catch(e){}
  try{ if(STATE.localStream){ STATE.localStream.getTracks().forEach(function(t){try{t.stop();}catch(_){}}); STATE.localStream=null; } }catch(e){}
}
function hardLeave(){ STATE._leaving=true; clearTimeout(STATE._reconnectTimer); try{if(STATE.lkRoom)STATE.lkRoom.disconnect();}catch(e){} releaseAllMedia(); location.href='grimeet.html'; }
function setSelfHand(up){ var t=tileEl('self'); if(!t)return; var h=t.querySelector('.hand'); if(up&&!h){var d=document.createElement('div');d.className='hand';d.textContent='✋';t.appendChild(d);} else if(!up&&h)h.remove(); }

/* ---- Panel boyutu senkronu (#3): öğretmen tahta/materyal/video düzenini boyutlandırınca öğrencide
   de AYNI ORANDA (r = px/referans genişlik) uygulanır. Yeni mesaj tipi t:'layout' {pane,r}; host→öğrenci
   yönlü (view/scr-zoom kalıbı). Geriye uyum: bilinmeyen pane sessizce yok sayılır; eski istemci mesajı hiç
   işlemez. Geç-katılım: sendState.layout ile taşınır. ---- */
function applyPaneLayout(msg){
  if(!msg||!msg.pane)return; var r=+msg.r; if(!(r>0))return;
  if(msg.pane==='strip'){ var w=Math.max(120,Math.min(620,Math.round(r*window.innerWidth))); document.documentElement.style.setProperty('--strip',w+'px'); }
  else if(msg.pane==='spot'){ var vw=spotVideosW(); if(vw>0) document.documentElement.style.setProperty('--gm-spot-w',clampSpotW(Math.round(r*vw))+'px'); }
  else if(msg.pane==='docL'){ try{ DOC.applyGutter('L',r); }catch(e){} }
  else if(msg.pane==='docR'){ try{ DOC.applyGutter('R',r); }catch(e){} }
}
function bindSplit(){
  var split=$('#gmr-split'),dragging=false,_r=0;
  var bc=throttle(function(){ if(STATE.isHost&&_r>0) sendData({t:'layout',pane:'strip',r:_r}); },60);
  split.addEventListener('pointerdown',function(e){ dragging=true; split.setPointerCapture(e.pointerId); e.preventDefault(); });
  split.addEventListener('pointermove',function(e){ if(!dragging)return; var dock=$('#gmr-dock'); var right=dock.classList.contains('hidden')?window.innerWidth:dock.getBoundingClientRect().left; var w=right-e.clientX; w=Math.max(120,Math.min(620,w)); document.documentElement.style.setProperty('--strip',w+'px'); _r=w/(window.innerWidth||1); bc(); });
  split.addEventListener('pointerup',function(e){ dragging=false; try{split.releasePointerCapture(e.pointerId);}catch(_){} if(STATE.isHost&&_r>0) sendData({t:'layout',pane:'strip',r:_r}); });
}
/* Konuşmacı görünümü odak/galeri ayırıcısı — sol odağın genişliğini sürükleyerek ayarla (senkron #3) */
function bindSpotResize(){
  var h=$('#gmr-spot-resize'); if(!h)return; var dragging=false,_r=0;
  var bc=throttle(function(){ if(STATE.isHost&&_r>0) sendData({t:'layout',pane:'spot',r:_r}); },60);
  h.addEventListener('pointerdown',function(e){ dragging=true; h.setPointerCapture(e.pointerId); e.preventDefault(); });
  h.addEventListener('pointermove',function(e){ if(!dragging)return; var v=$('#gmr-videos'); if(!v)return; var r=v.getBoundingClientRect(); var px=clampSpotW(e.clientX-r.left-16); document.documentElement.style.setProperty('--gm-spot-w',px+'px'); var vw=spotVideosW(); if(vw>0){ _r=px/vw; bc(); } });
  h.addEventListener('pointerup',function(e){ dragging=false; try{h.releasePointerCapture(e.pointerId);}catch(_){} if(STATE.isHost&&_r>0) sendData({t:'layout',pane:'spot',r:_r}); });
  window.addEventListener('resize',function(){ if(STATE.layout==='speaker') initSpotW(false); });
}

/* ================= HOST ACTIONS ================= */
function bindHostActions(){
  var ma=$('#btn-mute-all'); if(ma)ma.addEventListener('click',function(){ sendData({t:'force-mute',target:'*'}); toast('Herkese susturma isteği gönderildi.'); });
  var lh=$('#btn-lower-hands'); if(lh)lh.addEventListener('click',function(){ sendData({t:'lower-hands'}); Object.keys(STATE.tiles).forEach(function(id){ var h=STATE.tiles[id].querySelector('.hand'); if(h)h.remove(); }); STATE.hands=[]; renderHandQueue(); toast('Tüm eller indirildi.'); });
  var hq=$('#hand-queue'); if(hq)hq.addEventListener('click',function(e){ var b=e.target.closest('[data-lower]'); if(!b)return; var id=b.getAttribute('data-lower'); sendData({t:'lower-one',target:id}); handQueueRemove(id); var tl=tileEl(id); if(tl){ var h=tl.querySelector('.hand'); if(h)h.remove(); } });
  var tc=$('#btn-toggle-chat'); if(tc)tc.addEventListener('click',function(){ STATE.chatLocked=!STATE.chatLocked; this.textContent=STATE.chatLocked?'Sohbeti Aç':'Sohbeti Kapat'; sendData({t:'chat-lock',on:STATE.chatLocked}); toast(STATE.chatLocked?'Öğrenci sohbeti kapatıldı.':'Sohbet açıldı.'); });
  var ep=$('#btn-endpkg'); if(ep)ep.addEventListener('click',endLessonPackage);
  var pl=$('#people-list'); if(pl)pl.addEventListener('click',function(e){
    if(!STATE.isHost)return;
    var pb=e.target.closest('[data-promote]'); var kb=e.target.closest('[data-kick]');
    if(pb){ var pid=pb.getAttribute('data-promote'); if(confirm('Bu katılımcıya öğretmen (ders yönetimi) yetkisi verilsin mi?')){ promotedHosts.add(pid); sendData({t:'promote',target:pid}); toast('Öğretmen yetkisi verildi.'); refreshPeople(); } }
    else if(kb){ var kid=kb.getAttribute('data-kick'); if(confirm('Bu katılımcı odadan çıkarılsın mı?')){ sendData({t:'kick',target:kid}); toast('Katılımcı çıkarıldı.'); } }
  });
}
function showShareReq(id,who){
  /* Bloklamayan anlık onay: native confirm() arka plan sekmede/başka dialog açıkken
     gösterilmiyordu (host'a "geç" geliyordu). Sağ-alt in-app kart + çınlama ile anında. */
  var wrap=document.getElementById('gmr-reqpop');
  if(!wrap){ wrap=document.createElement('div'); wrap.id='gmr-reqpop'; wrap.className='gmr-reqpop'; document.body.appendChild(wrap); }
  if(wrap.querySelector('[data-reqid="'+id+'"]')) return; /* aynı kişiden tekrar isteği çoğaltma */
  var card=document.createElement('div'); card.className='gmr-reqcard'; card.setAttribute('data-reqid',id);
  card.innerHTML='<div class="gmr-reqtxt"><b>'+esc(who)+'</b> ekranını paylaşmak istiyor.</div><div class="gmr-reqbtns"><button class="ok">İzin Ver</button><button class="no">Reddet</button></div>';
  card.querySelector('.ok').addEventListener('click',function(){ sendData({t:'share-grant',target:id}); toast(who+' için ekran paylaşımına izin verildi.'); card.remove(); });
  card.querySelector('.no').addEventListener('click',function(){ sendData({t:'share-deny',target:id}); card.remove(); });
  wrap.appendChild(card);
  try{ playJoinChime(); }catch(e){}
  try{ toast(who+' ekran paylaşmak istiyor — sağ altta onayla.'); }catch(e){}
}

/* ================= DATA ================= */
var encd=new TextEncoder(),decd=new TextDecoder();
/* Faz0 0.3: LiveKit reliable publishData ~15KB'de sessizce düşürür → senkron kırılmasının kök nedeni.
   Büyük yükleri string olarak parçala (__chunk); karşıda birleştir. opts.to=[identity,...] → yalnız o kimliklere yolla. */
var CHUNK_MAX=8000; /* JSON string char/parça (çoğu yük ASCII: koordinat/base64 kalıntısı → ~byte); güvenli üst sınır */
var _chunkOut=0, _chunkIn={};
function _rawSend(bytes,pubOpts){ STATE.lkRoom.localParticipant.publishData(bytes,pubOpts); }
function sendData(obj,opts){ if(!STATE.lkRoom||!STATE.connected)return;
  var pubOpts={reliable:true}; if(opts&&opts.to&&opts.to.length) pubOpts.destinationIdentities=opts.to;
  try{
    var str=JSON.stringify(obj);
    if(str.length<=CHUNK_MAX){ _rawSend(encd.encode(str),pubOpts); return; }
    var self=(STATE.lkRoom&&STATE.lkRoom.localParticipant&&STATE.lkRoom.localParticipant.identity)||'x';
    var id=(++_chunkOut)+'_'+self, n=Math.ceil(str.length/CHUNK_MAX);
    for(var i=0;i<n;i++){ _rawSend(encd.encode(JSON.stringify({t:'__chunk',id:id,i:i,n:n,s:str.substr(i*CHUNK_MAX,CHUNK_MAX)})),pubOpts); }
  }catch(e){ try{ toast('Senkron paketi gönderilemedi (görsel çok büyük olabilir).'); }catch(_){} }
}
// Materyal paylaşımını artan seq ile yayınla (öğrencide last-wins: eski nav yok sayılır).
function broadcastMat(kind,value,ext,nav){ STATE._matSeq=(STATE._matSeq||0)+1; sendData({t:'mat',kind:kind,value:value,ext:ext,nav:nav?1:0,seq:STATE._matSeq}); }
function onData(payload,p){
  var msg; try{ msg=JSON.parse(decd.decode(payload)); }catch(e){ return; }
  if(msg&&msg.t==='__chunk'){ _onChunk(msg,p); return; }
  handleMsg(msg,p);
}
function _onChunk(msg,p){ if(!msg.id||!msg.n)return;
  var b=_chunkIn[msg.id]; if(!b){ b=_chunkIn[msg.id]={n:msg.n,parts:new Array(msg.n),got:0,ts:Date.now()}; }
  if(b.parts[msg.i]==null){ b.parts[msg.i]=msg.s; b.got++; }
  if(b.got>=b.n){ delete _chunkIn[msg.id]; var full; try{ full=JSON.parse(b.parts.join('')); }catch(e){ return; } handleMsg(full,p); }
  var now=Date.now(); for(var k in _chunkIn){ if(_chunkIn[k].ts&&now-_chunkIn[k].ts>30000) delete _chunkIn[k]; } /* yarım kalan parçaları temizle */
}
function handleMsg(msg,p){
  var from=p?(p.name||'Katılımcı'):'?', id=p?p.identity:null, fromHost=p?isHostMeta(p):false;
  if(msg.t==='chat'){ addChat(from,msg.text); if(STATE.isHost&&id)addPoint(id,from,1); }
  else if(msg.t==='hand'){ if(id){ var tl=tileEl(id); if(tl){ var h=tl.querySelector('.hand'); if(msg.up&&!h){var d=document.createElement('div');d.className='hand';d.textContent='✋';tl.appendChild(d);} else if(!msg.up&&h)h.remove(); } if(msg.up){ handQueueAdd(id,from); sysChat(from+' el kaldırdı ✋'); if(STATE.isHost)addPoint(id,from,1); } else handQueueRemove(id); } }
  else if(msg.t==='react'){ floatReact(msg.e); if(STATE.isHost&&id){ STATE._rp=STATE._rp||{}; var _now=Date.now(); if(!STATE._rp[id]||_now-STATE._rp[id]>10000){ STATE._rp[id]=_now; addPoint(id,from,1); } } }
  else if(msg.t==='lower-one'){ if(!STATE.isHost&&STATE.lkRoom&&msg.target===STATE.lkRoom.localParticipant.identity){ STATE.handUp=false; $('#ctrl-hand').classList.remove('active'); setSelfHand(false); sendData({t:'hand',up:false}); } }
  else if(msg.t==='room-closed'){ if(!STATE.isHost&&fromHost){ STATE._leaving=true; toast('Öğretmen odayı kapattı.'); setTimeout(hardLeave,1500); } }
  else if(msg.t==='knock'){ if(STATE.isHost&&id){ if(STATE.waitingRoom) addPending(id,from); else sendData({t:'admit',target:id}); } }
  else if(msg.t==='admit'){ if(!STATE.isHost&&fromHost&&STATE.lkRoom&&msg.target===STATE.lkRoom.localParticipant.identity) admitSelf(); }
  else if(msg.t==='deny'){ if(!STATE.isHost&&fromHost&&STATE.lkRoom&&msg.target===STATE.lkRoom.localParticipant.identity){ STATE._leaving=true; toast('Öğretmen katılımını onaylamadı.'); setTimeout(hardLeave,1500); } }
  else if(msg.t==='view'){ if(!STATE.isHost&&fromHost) setMode(msg.mode,{remote:true}); }
  else if(msg.t==='scr-zoom'){ if(!STATE.isHost&&fromHost){ STATE.scrZoom=Math.max(1,Math.min(3, (+msg.z)||1)); applyScreenZoom(); } }
  else if(msg.t==='spotlight'){ if(!STATE.isHost&&fromHost){ if(msg.target){ STATE.spotlight=msg.target; applySpotlightVideo(); setMode('spotlight',{remote:true}); var tt=tileEl(msg.target); $('#spot-label').textContent=(tt?tt.querySelector('.nm').textContent:'Odak'); } else { STATE.spotlight=null; setMode('grid',{remote:true}); } } }
  else if(msg.t==='mat'){ if((!STATE.isHost&&fromHost)||(STATE.isHost&&STATE.matControl&&!fromHost)){
      // Öğrenci→öğretmen de uygula: kontrol verilmişken öğrencinin soru/sayfa geçişi öğretmene yansır (iki yönlü).
      var _ms=(typeof msg.seq==='number')?msg.seq:0;
      if(_ms && _ms<(STATE._appliedMatSeq||0)) return; // eski (yavaş gelen) nav — yok say
      if(_ms) STATE._appliedMatSeq=_ms;
      if(msg.nav&&STATE.currentMaterial&&STATE.currentMaterial.kind===msg.kind&&STATE.currentMaterial.value===msg.value)return;
      loadMaterial(msg,true); setMode('materials',{remote:true}); if(!msg.nav&&!STATE.isHost)sysChat('Öğretmen bir materyal paylaştı.'); } }
  else if(msg.t==='mat-stop'){ if(!STATE.isHost&&fromHost&&STATE.mode==='materials') setMode('grid',{remote:true}); }
  else if(msg.t==='mat-scroll'){ if(!STATE.isHost&&fromHost) applyMatScroll(msg.frac); else if(STATE.isHost&&STATE.matControl&&!fromHost) applyMatScroll(msg.frac); }
  else if(msg.t==='pdf-hl'){ if(!STATE.isHost&&fromHost) PDFHL.applyRemote(msg.items); }
  else if(msg.t==='mat-zoom'){ if((!STATE.isHost&&fromHost)||(STATE.isHost&&STATE.matControl&&!fromHost)){ var _z=+msg.z; if(_z>=0.4&&_z<=2.5){ STATE.matZoom=_z; applyZoom(); } } }
  else if(msg.t==='mat-control'){ if(!STATE.isHost&&fromHost){ STATE.matControl=!!msg.on; STATE._appliedMatSeq=0; applyMatLock(); toast(msg.on?'Öğretmen sayfada gezinme iznini verdi — kaydırıp tıklayabilirsin.':'Sayfa kontrolü öğretmene geri alındı.');
      // Kontrol öğrenciye geçtiyse köprü KOPMAZ; yeni sürücü mevcut nav/durumunu hemen yayınlasın (iframe reload YOK).
      if(STATE.matControl){ STATE._lastNavRel=null; setTimeout(function(){ var f=document.getElementById('mat-uni-if'); if(f){ try{ navBroadcastNow(f); }catch(e){} } requestRunnerState(); },200); } } }
  else if(msg.t==='exstate'){
      // Cevap/essay: sürücüden bağımsız iki yönlü (paylaşım aktif + duraksatılmamışsa). Diğer durum (nav/ses): sürücü kuralı.
      var _isAns=!!(msg.s&&msg.s.answers);
      var _accept=_isAns
        ? ((!STATE.isHost&&fromHost&&!!STATE.currentMaterial&&!STATE.matPaused)||(STATE.isHost&&STATE.matShared&&!STATE.matPaused&&!fromHost))
        : ((!STATE.isHost&&fromHost)||(STATE.isHost&&STATE.matControl&&!fromHost));
      if(_accept){ var _exif=document.getElementById('mat-uni-if'); if(_exif&&_exif.contentWindow){ try{ _exif.contentWindow.postMessage({__gmex:1, apply:msg.s}, '*'); }catch(e){} } } }
  else if(msg.t==='exreq'){ if(STATE.isHost&&STATE.matShared&&!STATE.matPaused) requestRunnerState(); } // öğrenci runner'ı yüklendi → tam durumu iste
  else if(msg.t==='force-mute'){ if((msg.target==='*'||msg.target==='self'||(STATE.lkRoom&&msg.target===STATE.lkRoom.localParticipant.identity))&&!STATE.isHost&&fromHost){ STATE.micOn=false; $('#ctrl-mic').setAttribute('data-on','0'); if(STATE.lkRoom)STATE.lkRoom.localParticipant.setMicrophoneEnabled(false); toast('Öğretmen mikrofonunu kapattı.'); } }
  else if(msg.t==='kick'){ if((msg.target==='self'||(STATE.lkRoom&&msg.target===STATE.lkRoom.localParticipant.identity))&&!STATE.isHost&&fromHost){ STATE._leaving=true; toast('Öğretmen seni çıkardı.'); setTimeout(hardLeave,1500); } }
  else if(msg.t==='lower-hands'){ if(!STATE.isHost){ STATE.handUp=false; $('#ctrl-hand').classList.remove('active'); setSelfHand(false); } }
  else if(msg.t==='chat-lock'){ if(!STATE.isHost&&fromHost){ STATE.chatLocked=msg.on; applyChatLock(); } }
  else if(msg.t==='quizset'){ if(!STATE.isHost&&fromHost) openQuizSet(msg.list,msg.dur); }
  else if(msg.t==='quiz-vote'){ if(STATE.isHost&&STATE.quizSet){ var vi=msg.idx||0; var vv=STATE.quizSet.votes[vi]=STATE.quizSet.votes[vi]||{}; vv[msg.a]=(vv[msg.a]||0)+1; renderQuizSetTally(); addPoint(id,msg.name||from,2); } }
  else if(msg.t==='yt-sync'){ if(!STATE.isHost&&fromHost) applyYtSync(msg); else if(STATE.isHost&&STATE.matControl&&!fromHost) applyYtSync(msg); }
  else if(msg.t==='doc'){ DOC.applyRemote(msg); }
  else if(msg.t==='doc-layout'){ DOC.applyLayout(msg); }
  else if(msg.t==='doc-clear'){ DOC.applyClear(); }
  else if(msg.t==='doc-timer'){ if(!STATE.isHost&&fromHost) DOC.applyTimer(msg); }
  else if(msg.t==='doc-draw'){ DOCDRAW.applyRemote(msg); }
  else if(msg.t==='doc-sel'){ if(!STATE.isHost&&fromHost) DOC.applyRemoteSel(msg); }
  else if(msg.t==='doc-page-add'){ if(!STATE.isHost&&fromHost) DOC.applyAddPane(msg.id,msg.side); }
  else if(msg.t==='doc-page-del'){ if(!STATE.isHost&&fromHost) DOC.applyRemovePane(msg.id); }
  else if(msg.t==='wb-lock'){ if(!STATE.isHost&&fromHost){ STATE.wbLocked=!!msg.on; applyWbLock(); toast(msg.on?'Öğretmen tahtayı kilitledi — şu an çizemezsin':'Öğretmen tahta kilidini açtı'); } }
  else if(msg.t==='doc-lock'){ if(!STATE.isHost&&fromHost){ STATE.docLocked=!!msg.on; DOC.setLocked(!!msg.on); toast(msg.on?'Öğretmen yazı tahtasını kilitledi — düzenleyemezsin':'Öğretmen yazı tahtası kilidini açtı'); } }
  else if(msg.t==='req-state'){ if(STATE.isHost){ sendState(id); try{ WB.broadcastAllPages(id); }catch(e){} if(STATE.matShared&&!STATE.matPaused&&STATE.currentMaterial&&isExamRunner(STATE.currentMaterial.value)) setTimeout(requestRunnerState,150); } }
  else if(msg.t==='state'){ if(!STATE.isHost&&fromHost) applyState(msg); }
  else if(msg.t==='breakout'){ if(!STATE.isHost&&fromHost) applyBreakout(msg.map,msg.mins); }
  else if(msg.t==='breakout-end'){ if(!STATE.isHost&&fromHost) clearBreakout(); }
  else if(msg.t==='share-req'){ if(STATE.isHost&&id) showShareReq(id,msg.name||from); }
  else if(msg.t==='share-grant'){ if(!STATE.isHost&&fromHost&&STATE.lkRoom&&msg.target===STATE.lkRoom.localParticipant.identity){ STATE._shareOK=true; toast('Öğretmen izin verdi. Ekranını seç.'); doShareScreen(); } }
  else if(msg.t==='share-deny'){ if(!STATE.isHost&&fromHost&&STATE.lkRoom&&msg.target===STATE.lkRoom.localParticipant.identity){ toast('Öğretmen ekran paylaşımına izin vermedi.'); } }
  else if(msg.t==='promote'){ if(fromHost&&msg.target){ promotedHosts.add(msg.target); if(!STATE.isHost&&STATE.lkRoom&&msg.target===STATE.lkRoom.localParticipant.identity) becomeHost(); refreshPeople(); } }
  else if(msg.t==='wb'){ WB.applyRemote(msg); }
  else if(msg.t==='wb-live'){ WB.applyLive(msg); }
  else if(msg.t==='wb-nav'){ WB.applyNav(msg); }
  else if(msg.t==='anno'){ ANNO.applyRemote(msg); }
  else if(msg.t==='anno-live'){ ANNO.applyLive(msg); }
  else if(msg.t==='layout'){ if(!STATE.isHost&&fromHost) applyPaneLayout(msg); }
  else if(msg.t==='caption'){ var cwho=msg.name||from||'Katılımcı'; if(msg.fin){ pushTranscript(cwho,msg.text||''); _rememberRemoteCap(msg.text||''); } if(STATE.captionsOn) showCaption(cwho,msg.text||'',!!msg.fin); }
}
function sendState(to){ var _anno=[]; try{ _anno=ANNO.items()||[]; }catch(e){}
  var _lay=null; try{ var cs=getComputedStyle(document.documentElement); var sp=parseInt(cs.getPropertyValue('--strip'),10); var stripR=(sp>0)?(sp/(window.innerWidth||1)):null; var sw=parseInt(cs.getPropertyValue('--gm-spot-w'),10); var vw=spotVideosW(); var spotR=(sw>0&&vw>0)?(sw/vw):null; if(stripR||spotR) _lay={strip:stripR,spot:spotR}; }catch(e){}
  sendData({t:'state',mode:(STATE.mode==='spotlight'||STATE.mode==='screen')?'grid':STATE.mode,material:(STATE.matShared?STATE.currentMaterial:null),wb:WB.items(),wbix:WB.pageIndex(),wbnp:WB.pageCount(),chatLock:STATE.chatLocked,docState:DOC.getState(),wbLock:!!STATE.wbLocked,docLock:!!STATE.docLocked,pdfhl:PDFHL.items(),anno:((STATE.matShared&&_anno.length)?_anno:null),docdraw:(DOCDRAW.items().length?DOCDRAW.items():null),layout:_lay}, to?{to:[to]}:null); }
function applyState(msg){ if(msg.layout){ if(msg.layout.strip>0) applyPaneLayout({pane:'strip',r:msg.layout.strip}); if(msg.layout.spot>0) applyPaneLayout({pane:'spot',r:msg.layout.spot}); } if(msg.wb) WB.applyRemote({items:msg.wb,page:(typeof msg.wbix==='number'?msg.wbix:0),np:msg.wbnp}); if(msg.docState) DOC.applyFullState(msg.docState); if(msg.docdraw&&msg.docdraw.length){ try{ DOCDRAW.applyRemote({items:msg.docdraw}); }catch(e){} } if(!STATE.isHost){ if(msg.wbLock){ STATE.wbLocked=true; applyWbLock(); } if(msg.docLock){ STATE.docLocked=true; DOC.setLocked(true); } } if(msg.chatLock){ STATE.chatLocked=true; applyChatLock(); } if(msg.material){ if(msg.pdfhl&&msg.pdfhl.length) STATE._pendPdfHl=msg.pdfhl; var _sameMat=STATE.matShared&&STATE.currentMaterial&&STATE.currentMaterial.kind===msg.material.kind&&STATE.currentMaterial.value===msg.material.value; if(!_sameMat) loadMaterial(msg.material,true); /* Faz0: materyal aynıysa iframe'i YENİDEN YÜKLEME — scroll/zoom/sınav cevapları korunur (reload fırtınası fix) */ setMode('materials',{remote:true}); if(msg.pdfhl){ try{ PDFHL.applyRemote(msg.pdfhl); }catch(e){} }
    // Materyal üstündeki çizimleri (Üstüne Çiz) geç-katılımda da uygula — loadMaterial ANNO'yu sıfırladığı
    // için MUTLAKA materyal yüklendikten SONRA gelir (#108). Boş/eski durumda dokunma.
    if(msg.anno&&msg.anno.length){ try{ ANNO.applyRemote({items:msg.anno}); }catch(e){} } } else if(msg.mode&&msg.mode!=='grid'){ setMode(msg.mode,{remote:true}); } }

/* ===== IELTS deneme runner senkron köprüsü (gmsync) =====
   Materyal iframe'i (mat-uni-if) bir IELTS deneme runner'ıysa, runner "Sınava Başla" ve
   passage/task geçişlerinde {__gmex:1, state:{...}} postMessage'lar. HOST bu durumu odaya
   yayınlar (exstate); öğrenci grimeet'i onu kendi runner iframe'ine apply eder (onData). */
function _gmExOriginOk(o){ if(!o||o==='null') return true; try{ var h=new URL(o).hostname; return h===location.hostname||/(^|\.)gringlizce\.com$/.test(h); }catch(e){ return false; } }
window.addEventListener('message', function(e){
  var d=e.data; if(!d||d.__gmex!==1||!d.state) return;
  if(!_gmExOriginOk(e.origin)) return;
  var itf=document.getElementById('mat-uni-if');
  if(!itf||e.source!==itf.contentWindow) return; // yalnız materyal iframe'inden gelen durumu kabul et
  // Cevap/essay durumu (writing metni dahil) DRIVER modelinden BAĞIMSIZ iki yönlü akar: paylaşım
  // aktif oldukça (duraksatılmadıkça) hem öğretmen hem öğrenci kendi yazdığını karşıya yollar
  // (caret savaşı runner apply'ında engelli). Nav/scroll/zoom/ses ise sürücü kuralına (canBroadcastScroll) bağlı.
  var isAns=!!(d.state.answers);
  if(isAns ? canSyncAnswers() : canBroadcastScroll()) sendData({t:'exstate', s:d.state});
});

/* ================= CHAT / PEOPLE ================= */
var chatUnread=0;
function chatEmpty(){ var log=$('#chat-log'); var e=log.querySelector('.dock-empty'); if(e)e.remove(); }
function addChat(who,text){ chatEmpty(); var log=$('#chat-log'); var d=document.createElement('div'); d.className='chat-msg'; d.innerHTML='<span class="who">'+esc(who)+':</span>'+esc(text); log.appendChild(d); log.scrollTop=log.scrollHeight;
  var dock=$('#gmr-dock'); if(dock.classList.contains('hidden')||dock.getAttribute('data-active')!=='chat'){ chatUnread++; var b=$('#chat-badge'); b.textContent=chatUnread>9?'9+':chatUnread; b.classList.add('show'); } }
function sysChat(text){ chatEmpty(); var log=$('#chat-log'); var d=document.createElement('div'); d.className='chat-msg sys'; d.textContent=text; log.appendChild(d); log.scrollTop=log.scrollHeight; }
function applyChatLock(){ var i=$('#chat-text'),b=$('#chat-send'); var locked=STATE.chatLocked&&!STATE.isHost; i.disabled=locked; b.disabled=locked; i.placeholder=locked?'Sohbet öğretmen tarafından kapatıldı':'Mesaj yaz…'; }
/* Faz3.2: tahta kilidi öğrencide görünür (araç çubuğu soluk + rozet) */
function applyWbLock(){ var b=document.getElementById('gmr-board'); if(b) b.classList.toggle('wb-locked', !!STATE.wbLocked && !STATE.isHost); }
function bindChat(){ function send(){ if(STATE.chatLocked&&!STATE.isHost)return; var i=$('#chat-text'); var t=(i.value||'').trim(); if(!t)return; addChat(STATE.name+' (Sen)',t); sendData({t:'chat',text:t}); i.value=''; } $('#chat-send').addEventListener('click',send); $('#chat-text').addEventListener('keydown',function(e){ if(e.key==='Enter')send(); }); }

/* ===== Ortak Doküman (Google Docs benzeri: Quill zengin editör + 3 sayfa, canlı senkron) ===== */
var DOC=(function(){
  var Q={}, ready=false, snapTimer=null, lastSnap={C:'',L:'',R:''};
  var EXTRA=[]; /* dinamik ek sayfalar: [{id,side}] — 'C','L','R' sabit; ek'ler L2..L5 / R2..R5 */
  function panes(){ return ['C','L','R'].concat(EXTRA.map(function(e){ return e.id; })); }
  /* Yazım denetimi (kırmızı çizgiler) aç/kapa — YERELdir (senkronlanmaz); varsayılan KAPALI, tercih localStorage'da.
     Öğretmen spelling çalışması yapacağında açar; normalde kapalı tutarak kırmızı çizgi kalabalığını engeller. */
  var SPELL=false; try{ SPELL=(localStorage.getItem('gm-doc-spell')==='1'); }catch(e){}
  function _applySpell(){ panes().forEach(function(p){ var q=Q[p]; if(q&&q._spell){ try{ q._spell.setEnabled(SPELL); }catch(e){} } }); var b=document.getElementById('doc-spell'); if(b){ b.classList.toggle('on',SPELL); b.title=SPELL?'Yazım denetimi AÇIK — İngilizce + Türkçe yanlış yazımlar kırmızı dalgalı çizgiyle işaretlenir. Kapatmak için tıkla.':'Yazım denetimi kapalı. İngilizce + Türkçe canlı denetim için tıkla.'; } }
  function applySpell(){ if(SPELL && window.GriSpell && window.GriSpell.load && !(window.GriSpell.ready&&window.GriSpell.ready())){ window.GriSpell.load().then(_applySpell,function(){ _applySpell(); try{ if(SPELL) toast('Yazım sözlüğü yüklenemedi — bağlantını kontrol edip denetimi tekrar aç.'); }catch(e){} }); } _applySpell(); }
  function toggleSpell(){ SPELL=!SPELL; try{ localStorage.setItem('gm-doc-spell',SPELL?'1':'0'); }catch(e){} var firstLoad=(SPELL && window.GriSpell && window.GriSpell.ready && !window.GriSpell.ready()); applySpell(); try{ toast(SPELL?(firstLoad?'Yazım denetimi açılıyor — sözlük yükleniyor (EN+TR)…':'Yazım denetimi açıldı — İngilizce + Türkçe yanlış yazımlar kırmızı dalgalı çizgiyle işaretlenir'):'Yazım denetimi kapatıldı'); }catch(e){} }
  /* Süreli yazı çalışması geri sayımı — host başlatır, herkeste senkron gösterilir. */
  var TMR=null,tmrLeft=0,tmrPaused=false;
  function tmrFmt(s){ s=Math.max(0,s|0); var m=Math.floor(s/60),ss=s%60; return (m<10?'0':'')+m+':'+(ss<10?'0':'')+ss; }
  function tmrBtn(){ var b=document.getElementById('doc-timer-btn'); if(!b)return; var active=(TMR||tmrPaused); b.classList.toggle('on',!!active); var s=b.querySelector('span'); if(s)s.textContent='Süre'; }
  function tmrPaint(){ var c=document.getElementById('doc-timer-chip'); if(!c)return; if(tmrLeft<=0&&!TMR&&!tmrPaused){ c.setAttribute('hidden',''); return; } c.removeAttribute('hidden'); c.textContent=(tmrPaused?'⏸ ':'⏱ ')+tmrFmt(tmrLeft); c.classList.toggle('warn',tmrLeft<=30&&!tmrPaused); }
  function tmrTick(){ TMR=setInterval(function(){ tmrLeft--; if(tmrLeft<=0){ clearInterval(TMR); TMR=null; tmrPaused=false; tmrPaint(); tmrBtn(); try{ toast('Süre doldu — yazma süresi bitti.'); beep(); }catch(e){} return; } tmrPaint(); },1000); }
  function tmrRun(sec){ if(TMR){ clearInterval(TMR); TMR=null; } tmrLeft=Math.max(0,sec|0); tmrPaused=false; tmrPaint(); tmrBtn(); if(tmrLeft>0) tmrTick(); }
  function tmrPause(remote){ if(!TMR)return; clearInterval(TMR); TMR=null; tmrPaused=true; tmrPaint(); tmrBtn(); if(!remote&&STATE.isHost) sendData({t:'doc-timer',op:'pause'}); }
  function tmrResume(remote){ if(!tmrPaused||tmrLeft<=0)return; tmrPaused=false; tmrPaint(); tmrBtn(); tmrTick(); if(!remote&&STATE.isHost) sendData({t:'doc-timer',op:'resume'}); }
  function tmrStop(silent){ if(TMR){ clearInterval(TMR); TMR=null; } tmrLeft=0; tmrPaused=false; tmrPaint(); tmrBtn(); if(!silent&&STATE.isHost) sendData({t:'doc-timer',op:'stop'}); }
  function tmrBegin(mins){ if(!(mins>0))return; var sec=Math.round(mins*60); tmrRun(sec); sendData({t:'doc-timer',op:'start',sec:sec}); try{ toast(mins+' dakikalık yazma süresi başladı.'); }catch(e){} }
  function timerPopup(){
    var ex=document.getElementById('doc-timer-pop'); if(ex){ ex.remove(); return; } /* toggle kapat */
    var btn=document.getElementById('doc-timer-btn'); if(!btn)return;
    var pop=document.createElement('div'); pop.id='doc-timer-pop'; pop.className='gmr-timer-pop';
    var active=(TMR||tmrPaused), h='';
    if(active){ h+='<div class="tctrl">'; if(TMR) h+='<button class="pausebtn" id="tmr-pause">⏸ Duraklat</button>'; else h+='<button class="resumebtn" id="tmr-resume">▶ Devam Et</button>'; h+='<button class="stopbtn" id="tmr-stop-btn">■ Durdur</button></div><div class="tsep"></div>'; }
    h+='<h5>'+(active?'Yeni süre başlat (dk)':'Yazma süresi (dk)')+'</h5><div class="row">';
    [5,10,15,20].forEach(function(m){ h+='<button class="preset" data-m="'+m+'">'+m+'</button>'; });
    h+='</div><div class="custom"><input id="tmr-custom" type="number" min="1" max="240" placeholder="Özel dk" inputmode="numeric"><button id="tmr-custom-go">Başlat</button></div>';
    pop.innerHTML=h; document.body.appendChild(pop);
    var r=btn.getBoundingClientRect(), pw=pop.offsetWidth||230;
    pop.style.left=Math.max(8,Math.min(r.left, (window.innerWidth||800)-pw-10))+'px'; pop.style.top=(r.bottom+6)+'px';
    function go(m){ tmrBegin(m); pop.remove(); }
    pop.querySelectorAll('.preset').forEach(function(b){ b.addEventListener('click',function(){ go(parseInt(b.dataset.m,10)); }); });
    var ci=pop.querySelector('#tmr-custom'), cg=pop.querySelector('#tmr-custom-go');
    function customGo(){ var v=parseFloat(String(ci.value||'').replace(',','.')); if(!(v>0)){ ci.focus(); return; } go(v); }
    if(cg)cg.addEventListener('click',customGo);
    if(ci)ci.addEventListener('keydown',function(e){ if(e.key==='Enter'){ e.preventDefault(); customGo(); } else if(e.key==='Escape'){ pop.remove(); } });
    var pb=pop.querySelector('#tmr-pause'); if(pb)pb.addEventListener('click',function(){ tmrPause(); pop.remove(); timerPopup(); });
    var rb=pop.querySelector('#tmr-resume'); if(rb)rb.addEventListener('click',function(){ tmrResume(); pop.remove(); timerPopup(); });
    var sb=pop.querySelector('#tmr-stop-btn'); if(sb)sb.addEventListener('click',function(){ tmrStop(); pop.remove(); });
    setTimeout(function(){ document.addEventListener('mousedown',function onOut(e){ if(!pop.contains(e.target)&&e.target!==btn&&!btn.contains(e.target)){ try{pop.remove();}catch(_){}; document.removeEventListener('mousedown',onOut); } }); },10);
  }
  function tmrStart(){ if(!STATE.isHost)return; timerPopup(); }
  function applyTimer(msg){ if(STATE.isHost||!msg)return; if(msg.op==='start') tmrRun(msg.sec||0); else if(msg.op==='pause') tmrPause(true); else if(msg.op==='resume') tmrResume(true); else if(msg.op==='stop') tmrStop(true); }
  var TOOLBAR=[
    [{'font':[]},{'size':['12px','14px',false,'18px','24px','32px']}],
    [{'header':[1,2,3,false]}],
    ['bold','italic','underline','strike'],
    [{'color':[]},{'background':[]}],
    [{'script':'sub'},{'script':'super'}],
    [{'list':'ordered'},{'list':'bullet'},{'indent':'-1'},{'indent':'+1'}],
    [{'align':[]}],
    ['blockquote','code-block','link','image'],
    ['clean']
  ];
  function colEl(pane){ return document.getElementById('doc-col-'+pane); }
  function isOpen(pane){ var c=colEl(pane); return c && !c.hasAttribute('hidden'); }
  function wc(){ try{ var t=(Q.C?Q.C.getText():''); var w=(t.trim().match(/\S+/g)||[]).length; var c=$('#doc-count'); if(c)c.textContent=w+' kelime'; }catch(e){} }
  // Base64 (data:) görseli Supabase Storage'a yükle, public URL olarak göm — büyük delta yerine küçük URL → öğrencide de senkron + kalıcı.
  function uploadDataImage(q, dataUrl){
    try{
      if(!STATE.supabase){ toast('Görsel eklemek için giriş yapmış olmalısın.'); return; }
      var m=/^data:([^;,]+);base64,(.*)$/i.exec(dataUrl||''); if(!m){ toast('Görsel biçimi desteklenmiyor.'); return; }
      var mime=m[1]||'image/png', b64=m[2]||''; var bin=atob(b64); var nn=bin.length; var arr=new Uint8Array(nn);
      for(var i=0;i<nn;i++) arr[i]=bin.charCodeAt(i);
      var ext=((mime.split('/')[1]||'png').replace(/[^a-z0-9]/gi,'')||'png');
      var path='doc/'+Date.now()+'-'+Math.floor(Math.random()*1e9)+'.'+ext;
      var sel=q.getSelection(true); var idx=sel?sel.index:q.getLength();
      toast('Görsel yükleniyor…');
      STATE.supabase.storage.from('grimeet-files').upload(path,new Blob([arr],{type:mime}),{upsert:false,contentType:mime}).then(function(res){
        if(res&&res.error){ toast('Görsel yüklenemedi.'); return; }
        var pub=STATE.supabase.storage.from('grimeet-files').getPublicUrl(path);
        var url=pub&&pub.data&&pub.data.publicUrl; if(!url){ toast('Görsel URL alınamadı.'); return; }
        q.insertEmbed(idx,'image',url,'user'); /* source=user → delta ile öğrenciye senkron */
      }).catch(function(){ toast('Görsel yüklenemedi.'); });
    }catch(e){ toast('Görsel eklenemedi.'); }
  }
  function imgHandler(pane){ return function(){ var q=Q[pane]; if(!q)return;
    var inp=document.createElement('input'); inp.type='file'; inp.accept='image/*';
    inp.onchange=function(){ var f=inp.files&&inp.files[0]; if(!f)return; var rd=new FileReader(); rd.onload=function(){ uploadDataImage(q, String(rd.result||'')); }; rd.readAsDataURL(f); };
    inp.click();
  }; }
  function mkEditor(pane,sel,ph){
    var host=document.querySelector(sel); if(!host)return null;
    var q=new Quill(host,{ theme:'snow', placeholder:ph, modules:{ toolbar:{ container:TOOLBAR, handlers:{ image:imgHandler(pane) } } } });
    // Yapıştırılan base64 (data:) görseli ham gömme (dev delta senkronu bozar); yerine Storage'a yükleyip URL göm → öğrencide de görünür.
    try{ q.clipboard.addMatcher('IMG',function(node,delta){ try{ var src=(node&&node.getAttribute)?(node.getAttribute('src')||''):''; if(/^data:/i.test(src)){ uploadDataImage(q, src); return new (Quill.import('delta'))(); } }catch(_){} return delta; }); }catch(e){}
    q.on('text-change',function(delta,old,source){ if(pane==='C') wc(); if(source==='user') sendData({t:'doc',pane:pane,d:delta.ops}); });
    // Öğretmenin metin seçimi/işaretlemesi öğrencide highlight olarak görünsün (selection presence).
    q.on('selection-change',function(range,old,source){ if(!STATE.connected||!STATE.isHost)return; if(range&&range.length>0) sendData({t:'doc-sel',pane:pane,index:range.index,length:range.length}); else sendData({t:'doc-sel',pane:pane,clear:1}); });
    try{ q.root.spellcheck=false; q.root.setAttribute('spellcheck','false'); }catch(e){} /* yerel denetim kapalı — GriSpell (EN+TR canlı overlay) kullanılır */
    try{ q._spell=(window.GriSpell&&window.GriSpell.attach)?window.GriSpell.attach(q):null; if(q._spell&&SPELL) q._spell.setEnabled(true); }catch(e){}
    return q;
  }
  function togglePane(pane,remote){
    var col=colEl(pane); if(!col)return;
    var g=document.getElementById('doc-gutter-'+pane);
    var willOpen=col.hasAttribute('hidden');
    if(willOpen){ col.removeAttribute('hidden'); if(g)g.removeAttribute('hidden'); } else { col.setAttribute('hidden',''); if(g)g.setAttribute('hidden',''); }
    var btn=document.getElementById('doc-toggle-'+(pane==='L'?'left':'right')); if(btn)btn.classList.toggle('active',willOpen);
    if(!remote && STATE.connected) sendData({t:'doc-layout',pane:pane,open:willOpen});
  }
  function applyLayout(msg){ if(!msg||!msg.pane)return; if(!!msg.open!==isOpen(msg.pane)) togglePane(msg.pane,true); }
  function wsW(){ var ws=document.getElementById('doc-workspace'); return (ws&&ws.clientWidth>0)?ws.clientWidth:0; }
  /* Sol/sağ sayfa genişliği (#3): öğretmen sürükleyince öğrencide de AYNI ORANDA uygulanır (t:'layout' pane docL/docR). */
  function applyGutter(pane,r){ var col=colEl(pane); var ww=wsW(); if(!col||!ww||!(r>0))return; var w=Math.max(180,Math.min(680,Math.round(r*ww))); col.style.flex='0 0 '+w+'px'; col.style.width=w+'px'; }
  function bindGutter(pane){
    var g=document.getElementById('doc-gutter-'+pane), col=colEl(pane); if(!g||!col)return;
    var dragging=false,startX=0,startW=0,_r=0;
    var bc=throttle(function(){ if(STATE.isHost&&_r>0) sendData({t:'layout',pane:'doc'+pane,r:_r}); },60);
    g.addEventListener('pointerdown',function(e){ dragging=true; startX=e.clientX; startW=col.offsetWidth; try{g.setPointerCapture(e.pointerId);}catch(_){} e.preventDefault(); });
    g.addEventListener('pointermove',function(e){ if(!dragging)return; var dx=e.clientX-startX; var w=(pane==='L')?(startW+dx):(startW-dx); w=Math.max(180,Math.min(680,w)); col.style.flex='0 0 '+w+'px'; col.style.width=w+'px'; var ww=wsW(); if(ww){ _r=w/ww; bc(); } });
    function end(e){ if(!dragging)return; dragging=false; try{g.releasePointerCapture(e.pointerId);}catch(_){} if(STATE.isHost&&_r>0) sendData({t:'layout',pane:'doc'+pane,r:_r}); }
    g.addEventListener('pointerup',end); g.addEventListener('pointercancel',end);
  }
  function sendSnapshot(){ if(!ready||!STATE.connected)return; panes().forEach(function(p){ var q=Q[p]; if(!q)return; try{ var ops=q.getContents().ops; var s=JSON.stringify(ops); if(s!==lastSnap[p] && encd.encode(s).length<13000){ lastSnap[p]=s; sendData({t:'doc',pane:p,full:ops}); } }catch(e){} }); }
  function combinedText(){ var out=[]; try{ if(Q.L&&isOpen('L')){ var l=Q.L.getText().trim(); if(l)out.push('=== SOL SAYFA ===\n'+l); } if(Q.C)out.push(Q.C.getText().trim()); if(Q.R&&isOpen('R')){ var r=Q.R.getText().trim(); if(r)out.push('=== SAĞ SAYFA ===\n'+r); } }catch(e){} return out.join('\n\n'); }
  /* İndirme için: tüm sayfaların (ek sayfalar dahil) zengin HTML'i — biçim + görsel korunur. */
  function combinedHtml(){ var parts=[]; try{ panes().forEach(function(p){ var q=Q[p]; if(!q||!q.root)return; var plain=(q.getText()||'').trim(); var html=q.root.innerHTML||''; if(!plain && !/<img/i.test(html))return; var label=(p==='C')?'':(p==='L'?'Sol Sayfa':p==='R'?'Sağ Sayfa':'Ek Sayfa'); parts.push((label?'<h3 style="font-family:Georgia,serif">'+label+'</h3>':'')+'<div>'+html+'</div>'); }); }catch(e){} return parts.join('<hr style="margin:18px 0;border:none;border-top:1px solid #ccc">'); }
  function init(){
    if(typeof Quill==='undefined'||!document.getElementById('doc-editor-C'))return;
    try{ var Size=Quill.import('attributors/style/size'); Size.whitelist=['12px','14px','18px','24px','32px']; Quill.register(Size,true); }catch(e){}
    Q.C=mkEditor('C','#doc-editor-C','Birlikte yazmaya başlayın… Öğretmen ve öğrenci aynı anda düzenleyebilir.');
    Q.L=mkEditor('L','#doc-editor-L','Sol sayfa — notlar, plan…');
    Q.R=mkEditor('R','#doc-editor-R','Sağ sayfa — öğrenci taslağı…');
    ready=true;
    if(STATE._docPendingState){ applyFullState(STATE._docPendingState); STATE._docPendingState=null; }
    var tl=$('#doc-toggle-left'); if(tl)tl.addEventListener('click',function(){ togglePane('L'); });
    var tr=$('#doc-toggle-right'); if(tr)tr.addEventListener('click',function(){ togglePane('R'); });
    var al=$('#doc-addleft'); if(al)al.addEventListener('click',function(){ if(STATE.isHost) addPane('L'); });
    var ar=$('#doc-addright'); if(ar)ar.addEventListener('click',function(){ if(STATE.isHost) addPane('R'); });
    bindGutter('L'); bindGutter('R');
    // Uzak (Storage) görsel URL'lerini data: URI olarak gömer — indirilen .doc'ta görsel görünsün.
    function _imgToDataUrl(url){ return new Promise(function(res){
      if(!url || /^data:/i.test(url)){ res(url); return; }
      try{ var img=new Image(); img.crossOrigin='anonymous';
        img.onload=function(){ try{ var c=document.createElement('canvas'); c.width=img.naturalWidth||img.width; c.height=img.naturalHeight||img.height; c.getContext('2d').drawImage(img,0,0); res(c.toDataURL('image/png')); }catch(e){ res(url); } };
        img.onerror=function(){ res(url); }; img.src=url;
      }catch(e){ res(url); }
    }); }
    var dl=$('#doc-download'); if(dl)dl.addEventListener('click',async function(){ try{
      var body=combinedHtml(); if(!body || (!body.replace(/<[^>]*>/g,'').trim() && !/<img/i.test(body))){ try{ toast('Yazı tahtası boş — indirilecek içerik yok.'); }catch(_){} return; }
      // Görselleri gövdeye göm (uzak URL indirilen dosyada yüklenmez)
      try{
        var _tmp=document.createElement('div'); _tmp.innerHTML=body;
        var _imgs=Array.prototype.slice.call(_tmp.querySelectorAll('img'));
        if(_imgs.length){ try{ toast('Görseller hazırlanıyor…'); }catch(_){} }
        for(var _i=0;_i<_imgs.length;_i++){ var _s=_imgs[_i].getAttribute('src')||''; if(_s && !/^data:/i.test(_s)){ var _d=await _imgToDataUrl(_s); if(_d) _imgs[_i].setAttribute('src',_d); } }
        body=_tmp.innerHTML;
      }catch(_e){}
      var html='<!DOCTYPE html><html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><title>Gri Meet — Yazı Tahtası</title><style>body{font-family:Georgia,\'Times New Roman\',serif;font-size:12pt;line-height:1.5;color:#111;margin:2.2cm} img{max-width:100%}</style></head><body>'+body+'</body></html>';
      var blob=new Blob(['﻿'+html],{type:'application/msword'});
      var a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='gri-meet-yazitahtasi.doc'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function(){try{URL.revokeObjectURL(a.href);}catch(_){}} ,1500);
      try{ toast('Word belgesi indirildi.'); }catch(_){}
    }catch(e){ try{ toast('İndirilemedi.'); }catch(_){} } });
    var cl=$('#doc-clear'); if(cl)cl.addEventListener('click',function(){ if(!STATE.isHost)return; if(!window.confirm('Ortak belge (tüm sayfalar) temizlensin mi?'))return; clearAll(); sendData({t:'doc-clear'}); });
    var lk=$('#doc-lock'); if(lk)lk.addEventListener('click',function(){ if(!STATE.isHost)return; STATE.docLocked=!STATE.docLocked; this.classList.toggle('on',STATE.docLocked); var s=this.querySelector('span'); if(s)s.textContent=STATE.docLocked?'Kilitli':'Kilitle'; sendData({t:'doc-lock',on:STATE.docLocked}); toast(STATE.docLocked?'Yazı tahtası kilitlendi — öğrenciler yazamaz':'Kilit açıldı'); });
    var sp=$('#doc-spell'); if(sp)sp.addEventListener('click',toggleSpell);
    var tb=$('#doc-timer-btn'); if(tb)tb.addEventListener('click',tmrStart);
    setLocked(STATE.docLocked);
    applySpell();
    if(STATE.isHost) snapTimer=setInterval(sendSnapshot,5000);
    wc();
  }
  function applyRemote(msg){
    if(!msg||!ready)return;
    var q=Q[msg.pane||'C']; if(!q)return;
    try{
      if(msg.d){ q.updateContents({ops:msg.d},'silent'); }
      else if(msg.full){ if(!q.hasFocus()) q.setContents({ops:msg.full},'silent'); }
      if((msg.pane||'C')==='C') wc();
    }catch(e){}
  }
  // Öğretmenin metin seçimini öğrencide highlight overlay olarak göster (içeriğe DOKUNMAZ).
  function applyRemoteSel(msg){
    try{
      if(!msg||!ready||STATE.isHost)return;
      var q=Q[msg.pane||'C']; if(!q)return;
      var cont=q.root&&q.root.parentElement; if(!cont)return;
      var ov=cont.querySelector('.doc-hostsel');
      if(msg.clear||!msg.length){ if(ov)ov.remove(); return; }
      if(!ov){ ov=document.createElement('div'); ov.className='doc-hostsel'; ov.setAttribute('contenteditable','false'); ov.style.cssText='position:absolute;pointer-events:none;background:rgba(255,213,74,.42);border-radius:2px;z-index:1'; try{ if(getComputedStyle(cont).position==='static') cont.style.position='relative'; }catch(_){}
        cont.appendChild(ov); }
      var b=q.getBounds(msg.index,msg.length); if(!b){ ov.remove(); return; }
      ov.style.left=b.left+'px'; ov.style.top=b.top+'px'; ov.style.width=Math.max(3,b.width)+'px'; ov.style.height=b.height+'px';
    }catch(e){}
  }
  /* Ekstra sayfa ekleme (#114): host "+ Sol"/"+ Sağ" → dinamik Quill paneli oluştur, öğrenciye yayınla, geç-katılımda yeniden kur. */
  function nextId(side){ return side+(2+EXTRA.filter(function(e){ return e.side===side; }).length); }
  function addPane(side, id, remote){
    if(side!=='L'&&side!=='R'||!ready) return;
    if(!id){ if(EXTRA.filter(function(e){ return e.side===side; }).length>=4){ toast('En fazla 4 ek '+(side==='L'?'sol':'sağ')+' sayfa.'); return; } id=nextId(side); }
    if(Q[id]) return;
    var ws=document.getElementById('doc-workspace'); if(!ws) return;
    var col=document.createElement('div'); col.className='gmr-doc-col'; col.id='doc-col-'+id; col.setAttribute('data-pane',id);
    var head=document.createElement('div'); head.className='gmr-doc-col-head'; head.textContent=(side==='L'?'Sol Sayfa ':'Sağ Sayfa ')+id.slice(1);
    var del=document.createElement('button'); del.type='button'; del.className='host-only'; del.title='Bu ek sayfayı sil'; del.textContent='×';
    del.style.cssText='float:right;border:none;background:transparent;color:#c0563e;font-size:1.15rem;line-height:1;cursor:pointer;padding:0 2px;font-weight:800';
    del.addEventListener('click',function(ev){ ev.stopPropagation(); if(STATE.isHost) removePane(id); });
    head.appendChild(del); col.appendChild(head);
    var ed=document.createElement('div'); ed.className='gmr-doc-editor'; ed.id='doc-editor-'+id; col.appendChild(ed);
    var gut=document.createElement('div'); gut.className='gmr-doc-gutter'; gut.id='doc-gutter-'+id; gut.title='Sürükleyip boyutlandır';
    if(side==='L'){ ws.insertBefore(gut, ws.firstChild); ws.insertBefore(col, gut); }
    else { ws.appendChild(gut); ws.appendChild(col); }
    EXTRA.push({id:id, side:side});
    Q[id]=mkEditor(id, '#doc-editor-'+id, side==='L'?'Ek sol sayfa…':'Ek sağ sayfa…');
    try{ bindGutter(id); }catch(_){}
    try{ if(Q[id]) Q[id].enable(STATE.isHost?true:!STATE.docLocked); }catch(_){}
    if(!remote && STATE.isHost && STATE.connected) sendData({t:'doc-page-add', id:id, side:side});
  }
  function applyAddPane(id, side){ if(!id||Q[id])return; addPane(side, id, true); }
  function removePane(id, remote){
    if(!id) return; var found=false;
    EXTRA=EXTRA.filter(function(x){ if(x.id===id){ found=true; return false; } return true; });
    if(!found && !Q[id]) return;
    try{ delete Q[id]; }catch(_){ Q[id]=null; }
    try{ delete lastSnap[id]; }catch(_){}
    var col=document.getElementById('doc-col-'+id); if(col)col.remove();
    var gut=document.getElementById('doc-gutter-'+id); if(gut)gut.remove();
    if(!remote && STATE.isHost && STATE.connected) sendData({t:'doc-page-del', id:id});
  }
  function applyRemovePane(id){ removePane(id, true); }
  /* Temizle: TÜM panelleri koşulsuz boşalt (öğrenci odakta olsa bile) — 'full' snapshot skip-if-focused sorununu aşar. */
  function clearAll(){ try{ panes().forEach(function(p){ var q=Q[p]; if(q){ try{ q.setText('','silent'); }catch(_){} } }); lastSnap={C:'',L:'',R:''}; }catch(e){} wc(); }
  function colR(p){ var c=colEl(p); var ww=wsW(); if(!c||c.hasAttribute('hidden')||!ww)return 0; return c.offsetWidth/ww; }
  function getState(){ if(!ready)return null; try{ return {
    C:Q.C?Q.C.getContents().ops:null, L:Q.L?Q.L.getContents().ops:null, R:Q.R?Q.R.getContents().ops:null,
    layL:isOpen('L'), layR:isOpen('R'), rL:colR('L'), rR:colR('R'),
    ex:EXTRA.map(function(e){ var q=Q[e.id]; return { id:e.id, side:e.side, ops:(q?q.getContents().ops:null), r:colR(e.id) }; })
  }; }catch(e){ return null; } }
  function applyFullState(st){
    if(!st)return;
    if(!ready){ STATE._docPendingState=st; return; }
    try{
      // m2: yetkili resync — odaklı panede BILE uygula (drift onarimi), imleci koru
      ['C','L','R'].forEach(function(p){ var q=Q[p]; if(!q||!st[p])return; var sel=q.hasFocus()?q.getSelection():null; q.setContents({ops:st[p]},'silent'); if(sel){ try{ q.setSelection(Math.min(sel.index,Math.max(0,q.getLength()-1)),0,'silent'); }catch(_){}} });
      if(st.layL&&!isOpen('L')) togglePane('L',true);
      if(st.layR&&!isOpen('R')) togglePane('R',true);
      if(st.rL>0&&isOpen('L')) applyGutter('L',st.rL);
      if(st.rR>0&&isOpen('R')) applyGutter('R',st.rR);
      if(Array.isArray(st.ex)){
        st.ex.forEach(function(e){ if(!e||!e.id)return; if(!Q[e.id]) addPane(e.side,e.id,true); var q=Q[e.id]; if(q&&e.ops){ var s2=q.hasFocus()?q.getSelection():null; q.setContents({ops:e.ops},'silent'); if(s2){ try{ q.setSelection(Math.min(s2.index,Math.max(0,q.getLength()-1)),0,'silent'); }catch(_){}} } if(e.r>0) applyGutter(e.id,e.r); });
        // Host yetkili uzlaştırma: host'un state'inde OLMAYAN yerel ek sayfaları kaldır (host yeniden yüklenince öğrencide de temizlenir).
        var keep={}; st.ex.forEach(function(e){ if(e&&e.id) keep[e.id]=1; });
        EXTRA.slice().forEach(function(x){ if(!keep[x.id]) removePane(x.id,true); });
      }
      wc();
    }catch(e){}
  }
  function startSnapshots(){ if(STATE.isHost&&ready&&!snapTimer) snapTimer=setInterval(sendSnapshot,5000); }
  function setLocked(on){ try{ panes().forEach(function(p){ var q=Q[p]; if(q) q.enable(STATE.isHost?true:!on); }); }catch(e){} }
  return { init:init, applyRemote:applyRemote, applyRemoteSel:applyRemoteSel, applyLayout:applyLayout, applyGutter:applyGutter, getState:getState, applyFullState:applyFullState, startSnapshots:startSnapshots, setLocked:setLocked, applyClear:clearAll, applyAddPane:applyAddPane, applyRemovePane:applyRemovePane, applyTimer:applyTimer };
})();
function bindDoc(){ DOC.init(); }
function refreshPeople(){
  var ul=$('#people-list'); if(!ul)return; ul.innerHTML='';
  var list=[{name:STATE.name+' (Sen)',host:STATE.isHost,mic:STATE.micOn,id:null}];
  if(STATE.lkRoom) STATE.lkRoom.remoteParticipants.forEach(function(p){ list.push({name:p.name||'Öğrenci',host:isHostMeta(p),mic:p.isMicrophoneEnabled,id:p.identity}); });
  list.forEach(function(m){ var li=document.createElement('li');
    var act=(STATE.isHost&&m.id&&!m.host)?('<span class="pacts"><button class="pact" data-promote="'+esc(m.id)+'" title="Öğretmen yap">★</button><button class="pact danger" data-kick="'+esc(m.id)+'" title="Odadan çıkar">✕</button></span>'):'';
    li.innerHTML='<span class="pav">'+initials(m.name)+'</span><span class="pnm">'+esc(m.name)+'</span>'+(m.host?'<span class="ptag">Öğretmen</span>':'')+'<span class="pmic'+(m.mic?'':' off')+'">'+(m.mic?'🎤':'🔇')+'</span>'+act; ul.appendChild(li); });
}

/* ================= TOOLS ================= */
var timerInt=null,timerLeft=0;
function bindTools(){
  $$('.timer-btns [data-tmin]').forEach(function(b){ b.addEventListener('click',function(){ startTimer(parseInt(b.dataset.tmin,10)*60); }); });
  $('#timer-stop').addEventListener('click',function(){ clearInterval(timerInt); timerInt=null; $('#timer-display').textContent='00:00'; });
  $('#btn-pick').addEventListener('click',pickStudent);
  $$('#quiz-opts .cor').forEach(function(b){ b.addEventListener('click',function(){ var on=b.classList.contains('on'); $$('#quiz-opts .cor').forEach(function(x){x.classList.remove('on');}); if(!on)b.classList.add('on'); }); });
  $('#btn-quiz-add').addEventListener('click',addQuizToQueue);
  $('#btn-quiz').addEventListener('click',sendQuiz);
  bindQuizBank();
  $('#btn-breakout').addEventListener('click',makeBreakout);
  var bm=$('#btn-breakout-manual'); if(bm) bm.addEventListener('click',renderManualBreakout);
  // quiz popup (student)
  $('#quiz-close').addEventListener('click',function(){ $('#quiz-modal').classList.add('hidden'); if(STATE.quizRun) $('#quiz-pill').classList.add('show'); });
  $('#quiz-pill').addEventListener('click',function(){ $('#quiz-modal').classList.remove('hidden'); $('#quiz-pill').classList.remove('show'); });
}
function startTimer(sec){ clearInterval(timerInt); timerLeft=sec; $('#timer-display').textContent=fmt(timerLeft); timerInt=setInterval(function(){ timerLeft--; $('#timer-display').textContent=fmt(timerLeft); if(timerLeft<=0){ clearInterval(timerInt); timerInt=null; toast('Süre doldu!'); try{beep();}catch(e){} } },1000); }
function beep(){ var a=new (window.AudioContext||window.webkitAudioContext)(); var o=a.createOscillator(); o.connect(a.destination); o.frequency.value=880; o.start(); setTimeout(function(){o.stop();a.close();},350); }
// Katılım zili: nazik iki-nota ding (gain zarfıyla, klik olmadan)
function playJoinChime(){ try{
  var a=new (window.AudioContext||window.webkitAudioContext)(); var now=a.currentTime;
  [ [659.25,0], [987.77,0.13] ].forEach(function(p){
    var o=a.createOscillator(), g=a.createGain(); o.type='sine'; o.frequency.value=p[0];
    var t=now+p[1]; g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(0.16,t+0.02); g.gain.exponentialRampToValueAtTime(0.0001,t+0.34);
    o.connect(g); g.connect(a.destination); o.start(t); o.stop(t+0.36);
  });
  setTimeout(function(){ try{a.close();}catch(e){} }, 700);
}catch(e){} }
function studentNames(){ var names=[]; if(STATE.lkRoom)STATE.lkRoom.remoteParticipants.forEach(function(p){ if(!isHostMeta(p))names.push(p.name||'Öğrenci'); }); if(!STATE.isHost)names.push(STATE.name); return names; }
function pickStudent(){ var names=studentNames(); if(!names.length){ $('#pick-result').textContent='Öğrenci yok.'; return; } var i=0,n=0,max=14+Math.floor(Math.random()*8),el=$('#pick-result'); var iv=setInterval(function(){ el.textContent=names[i%names.length]; i++; n++; if(n>=max){ clearInterval(iv); el.textContent='🎯 '+names[Math.floor(Math.random()*names.length)]; } },80); }

/* ---- Quiz (host) ---- */
function readQuizForm(){ var q=($('#quiz-q').value||'').trim(); var opts={}; $$('#quiz-opts input[data-opt]').forEach(function(i){ var v=(i.value||'').trim(); if(v)opts[i.dataset.opt]=v; }); var c=$('#quiz-opts .cor.on'); return {q:q,opts:opts,correct:c?c.dataset.cor:null}; }
function clearQuizForm(){ $('#quiz-q').value=''; $$('#quiz-opts input[data-opt]').forEach(function(i){i.value='';}); $$('#quiz-opts .cor').forEach(function(x){x.classList.remove('on');}); }
function quizFilled(f){ return !!(f.q||Object.keys(f.opts).length||f.correct); }
function updateQueueLabel(){ var el=$('#quiz-queue'); if(el)el.textContent=STATE.quizQueue.length?(STATE.quizQueue.length+' soru kuyrukta'):''; var b=$('#btn-quiz'); if(b)b.textContent=STATE.quizQueue.length?('Tümünü Gönder ('+STATE.quizQueue.length+' soru)'):'Quiz Gönder'; }
function addQuizToQueue(){ var f=readQuizForm(); if(!quizFilled(f)){ toast('Önce soru/şık doldur.'); return; } STATE.quizQueue.push(f); clearQuizForm(); updateQueueLabel(); toast('Kuyruğa eklendi ('+STATE.quizQueue.length+').'); }
function sendQuiz(){
  var cur=readQuizForm(); var list=STATE.quizQueue.slice(); if(quizFilled(cur)) list.push(cur);
  if(!list.length) list.push({q:'Doğru cevap hangisi?',opts:{},correct:null});
  STATE.quizSet={list:list,votes:{}}; STATE.quizQueue=[]; clearQuizForm(); updateQueueLabel();
  sendData({t:'quizset',list:list.map(function(x){return {q:x.q,opts:x.opts,correct:x.correct||null};}),dur:30});
  renderQuizSetTally();
  toast(list.length+' soruluk quiz gönderildi. Öğrenciler otomatik ilerler.');
}
function renderQuizSetTally(){ var el=$('#quiz-tally'); if(!el||!STATE.quizSet)return; var L=STATE.quizSet.list,V=STATE.quizSet.votes;
  el.innerHTML=L.map(function(item,qi){ var v=V[qi]||{}; var ks=(item.opts&&Object.keys(item.opts).length)?Object.keys(item.opts).sort():['A','B','C','D']; var tot=ks.reduce(function(s,k){return s+(v[k]||0);},0)||1;
    return '<div class="qtally-q">Soru '+(qi+1)+(item.q?': '+esc(item.q):'')+'</div>'+ks.map(function(k){ var otext=(item.opts&&item.opts[k])?esc(item.opts[k]):''; return '<div class="qrow'+(item.correct===k?' correct':'')+'"><b>'+k+'</b><span class="qopt">'+otext+'</span><div class="qbar" style="width:'+((v[k]||0)/tot*90)+'px"></div><span class="qn">'+(v[k]||0)+'</span></div>'; }).join(''); }).join('');
}
/* ---- Quiz (öğrenci — otomatik ilerler) ---- */
function openQuizSet(list,dur){ STATE.quizRun={list:list,i:0,score:0,dur:dur||30}; showQuizQ(); }
function showQuizQ(){
  var run=STATE.quizRun; if(!run)return;
  if(run.i>=run.list.length){ finishQuizSet(); return; }
  var item=run.list[run.i],idx=run.i+1,total=run.list.length;
  STATE.quizView={correct:item.correct||null,answered:false,picked:null};
  $('#quiz-modal').classList.remove('hidden'); $('#quiz-pill').classList.remove('show');
  $('#quiz-q-text').textContent=item.q||('Soru '+idx);
  $('#quiz-feedback').textContent=''; $('#quiz-feedback').className='quiz-feedback';
  $('#quiz-score').textContent='Puan: '+run.score;
  var ans=$('#quiz-answers'); ans.innerHTML='';
  var _keys=(item.opts&&Object.keys(item.opts).length)?Object.keys(item.opts).sort():['A','B','C','D'];
  _keys.forEach(function(k){ var b=document.createElement('button'); b.dataset.k=k; b.innerHTML='<span class="k">'+k+'</span> '+esc((item.opts&&item.opts[k])||''); b.addEventListener('click',function(){ qAnswer(k); }); ans.appendChild(b); });
  var left=run.dur; $('#quiz-count').textContent=idx+'/'+total+' · ('+left+')';
  clearInterval(STATE._qiv);
  STATE._qiv=setInterval(function(){ left--; $('#quiz-count').textContent=idx+'/'+total+' · ('+left+')'; if(left<=0){ clearInterval(STATE._qiv); if(!STATE.quizView.answered) qAnswer(null,true); } },1000);
}
function qAnswer(k,timeout){
  var run=STATE.quizRun; if(!run||!STATE.quizView||STATE.quizView.answered)return;
  STATE.quizView.answered=true; STATE.quizView.picked=k; clearInterval(STATE._qiv);
  $$('#quiz-answers button').forEach(function(b){ b.disabled=true; });
  var cor=STATE.quizView.correct,fb=$('#quiz-feedback');
  if(k){ var pb=$('#quiz-answers button[data-k="'+k+'"]'); if(pb)pb.classList.add('picked'); sendData({t:'quiz-vote',idx:run.i,a:k,name:STATE.name}); }
  if(cor){ var cb=$('#quiz-answers button[data-k="'+cor+'"]'); if(cb)cb.classList.add('correct');
    if(k&&k===cor){ run.score++; fb.textContent='Doğru!'; fb.className='quiz-feedback ok'; }
    else if(k){ var wb=$('#quiz-answers button[data-k="'+k+'"]'); if(wb)wb.classList.add('wrong'); fb.textContent='Yanlış. Doğru: '+cor; fb.className='quiz-feedback no'; }
    else { fb.textContent='Süre doldu. Doğru: '+cor; fb.className='quiz-feedback no'; }
  } else { fb.textContent=timeout?'Süre doldu.':('Cevabın: '+(k||'-')); }
  $('#quiz-score').textContent='Puan: '+run.score;
  setTimeout(function(){ if(!STATE.quizRun)return; STATE.quizRun.i++; showQuizQ(); },1600);
}
function finishQuizSet(){ clearInterval(STATE._qiv); var run=STATE.quizRun; $('#quiz-count').textContent=''; $('#quiz-q-text').textContent='Quiz bitti!'; $('#quiz-answers').innerHTML=''; $('#quiz-feedback').textContent=''; $('#quiz-feedback').className='quiz-feedback ok'; $('#quiz-score').textContent='Toplam puanın: '+(run?run.score:0)+' / '+(run?run.list.length:0); $('#quiz-pill').classList.remove('show'); STATE.quizRun=null; }

/* ---- Quiz: Soru / Kelime bankasından çekme ---- */
function prettyCat(c){ return String(c||'').replace(/^yds-/,'').replace(/[-_]/g,' '); }
function qbStrip(h){ var d=document.createElement('div'); d.innerHTML=h||''; return (d.textContent||'').replace(/\s+/g,' ').trim(); }
function qbShuffleTake(arr,n){ for(var i=arr.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)); var t=arr[i];arr[i]=arr[j];arr[j]=t; } return arr.slice(0,n); }
async function qbLoadCategories(){
  var sel=$('#qb-cat'); if(!sel)return; var exam=$('#qb-exam').value; sel.innerHTML='<option>Yükleniyor…</option>';
  if(!STATE.supabase){ sel.innerHTML='<option value="">Giriş gerekli</option>'; return; }
  try{
    var q = (exam==='vocab')
      ? STATE.supabase.from('kelimeler').select('category').eq('active',true).limit(4000)
      : STATE.supabase.from('questions').select('category').eq('active',true).is('passage_id',null).eq('exam_type',exam).limit(2000);
    var r=await q; var cats={}; (r.data||[]).forEach(function(x){ if(x.category)cats[x.category]=(cats[x.category]||0)+1; });
    var keys=Object.keys(cats).sort();
    sel.innerHTML = keys.length ? keys.map(function(c){ return '<option value="'+esc(c)+'">'+esc(prettyCat(c))+' ('+cats[c]+')</option>'; }).join('') : '<option value="">Kategori yok</option>';
  }catch(e){ sel.innerHTML='<option value="">Hata</option>'; }
}
async function qbAdd(){
  if(!STATE.supabase){ toast('Soru bankası için giriş yapmış olmalısın.'); return; }
  var exam=$('#qb-exam').value, cat=$('#qb-cat').value, n=Math.max(1,Math.min(15,parseInt($('#qb-count').value,10)||5));
  if(!cat){ toast('Önce kategori seç.'); return; }
  var btn=$('#qb-add'), old=btn?btn.textContent:''; if(btn){ btn.disabled=true; btn.textContent='Çekiliyor…'; }
  try{
    var items=[];
    if(exam==='vocab'){
      var r=await STATE.supabase.from('kelimeler').select('word,pos,options,correct').eq('active',true).eq('category',cat).limit(400);
      qbShuffleTake((r.data||[]).filter(function(w){return Array.isArray(w.options)&&w.correct;}),n).forEach(function(w){
        var opts={},L=['A','B','C','D','E']; (w.options||[]).forEach(function(t,i){ if(L[i])opts[L[i]]=qbStrip(String(t)); });
        items.push({ q:'“'+w.word+'”'+(w.pos?' ('+w.pos+')':'')+' — anlamı?', opts:opts, correct:String(w.correct).trim().toUpperCase() });
      });
    } else {
      var r2=await STATE.supabase.from('questions').select('question_text,options,correct_answer').eq('active',true).is('passage_id',null).eq('exam_type',exam).eq('category',cat).limit(300);
      qbShuffleTake((r2.data||[]).filter(function(q){return Array.isArray(q.options)&&q.correct_answer;}),n).forEach(function(q){
        var opts={}; (q.options||[]).forEach(function(o){ if(o&&o.letter)opts[String(o.letter).toUpperCase()]=qbStrip(o.text||''); });
        items.push({ q:qbStrip(q.question_text), opts:opts, correct:String(q.correct_answer).trim().toUpperCase() });
      });
    }
    if(!items.length){ toast('Bu kategoride uygun soru bulunamadı.'); return; }
    STATE.quizQueue=STATE.quizQueue.concat(items); updateQueueLabel();
    toast(items.length+' soru kuyruğa eklendi (toplam '+STATE.quizQueue.length+'). "Tümünü Gönder" ile yolla.');
  }catch(e){ toast('Soru çekilemedi.'); }
  finally{ if(btn){ btn.disabled=false; btn.textContent=old; } }
}
function bindQuizBank(){ var e=$('#qb-exam'); if(!e)return; e.addEventListener('change',qbLoadCategories); var a=$('#qb-add'); if(a)a.addEventListener('click',qbAdd); qbLoadCategories(); }

function makeBreakout(){
  if(!STATE.lkRoom){ toast('Breakout için canlı bağlantı gerekli.'); return; }
  var students=[]; STATE.lkRoom.remoteParticipants.forEach(function(p){ if(!isHostMeta(p)) students.push({id:p.identity,name:p.name||'Öğrenci'}); });
  if(!students.length){ $('#bo-result').textContent='Öğrenci yok.'; return; }
  var n=Math.max(2,Math.min(5,parseInt($('#bo-count').value,10)||2));
  var mins=Math.max(1,Math.min(30,parseInt(($('#bo-mins')&&$('#bo-mins').value)||'5',10)||5));
  for(var i=students.length-1;i>0;i--){ var jx=Math.floor(Math.random()*(i+1)); var t=students[i];students[i]=students[jx];students[jx]=t; }
  var map={}; students.forEach(function(s,idx){ map[s.id]=(idx%n)+1; });
  sendData({t:'breakout',map:map,mins:mins});
  applyBreakout(map,mins);
  var byG={}; students.forEach(function(s){ (byG[map[s.id]]=byG[map[s.id]]||[]).push(s.name); });
  $('#bo-result').innerHTML=Object.keys(byG).sort().map(function(g){ return '<div style="margin-bottom:5px"><b>Grup '+g+':</b> '+byG[g].map(esc).join(', ')+'</div>'; }).join('')+'<button class="dock-btn" id="bo-recall" style="margin-top:8px">Herkesi Geri Çağır</button>';
  var rc=$('#bo-recall'); if(rc)rc.addEventListener('click',function(){ sendData({t:'breakout-end'}); clearBreakout(); });
  toast(n+' grup, '+mins+' dk. Her grup yalnızca kendini duyar.');
}
function renderManualBreakout(){
  if(!STATE.lkRoom){ toast('Canlı bağlantı gerekli.'); return; }
  var students=[]; STATE.lkRoom.remoteParticipants.forEach(function(p){ if(!isHostMeta(p)) students.push({id:p.identity,name:p.name||'Öğrenci'}); });
  if(!students.length){ $('#bo-result').textContent='Öğrenci yok.'; return; }
  var n=Math.max(2,Math.min(5,parseInt($('#bo-count').value,10)||2));
  var html='<div style="font-size:12px;color:var(--gm-ink-soft);margin-bottom:6px">Her öğrenciye grup seç:</div>';
  html+=students.map(function(s){ var opts=''; for(var g=1;g<=n;g++)opts+='<option value="'+g+'">Grup '+g+'</option>'; return '<div style="display:flex;align-items:center;gap:8px;margin-bottom:5px"><span style="flex:1;font-size:13px;overflow:hidden;text-overflow:ellipsis">'+esc(s.name)+'</span><select data-bo-id="'+esc(s.id)+'" class="tool-inp" style="width:auto;margin:0;padding:5px 8px">'+opts+'</select></div>'; }).join('');
  html+='<button class="dock-btn" id="bo-manual-start" style="margin-top:6px">Grupları Başlat</button>';
  $('#bo-result').innerHTML=html;
  var st=$('#bo-manual-start'); if(st) st.addEventListener('click',startManualBreakout);
}
function startManualBreakout(){
  var map={}; $$('#bo-result select[data-bo-id]').forEach(function(sel){ map[sel.getAttribute('data-bo-id')]=parseInt(sel.value,10)||1; });
  if(!Object.keys(map).length)return;
  var mins=Math.max(1,Math.min(30,parseInt(($('#bo-mins')&&$('#bo-mins').value)||'5',10)||5));
  sendData({t:'breakout',map:map,mins:mins}); applyBreakout(map,mins);
  var byG={}; STATE.lkRoom.remoteParticipants.forEach(function(p){ if(map[p.identity]){ (byG[map[p.identity]]=byG[map[p.identity]]||[]).push(p.name||'Öğrenci'); } });
  $('#bo-result').innerHTML=Object.keys(byG).sort().map(function(g){ return '<div style="margin-bottom:5px"><b>Grup '+g+':</b> '+byG[g].map(esc).join(', ')+'</div>'; }).join('')+'<button class="dock-btn" id="bo-recall" style="margin-top:8px">Herkesi Geri Çağır</button>';
  var rc=$('#bo-recall'); if(rc)rc.addEventListener('click',function(){ sendData({t:'breakout-end'}); clearBreakout(); });
  toast('Gruplar (manuel) başlatıldı.');
}
function applyBreakout(map,mins){
  STATE.breakout=map;
  var myId=STATE.lkRoom?STATE.lkRoom.localParticipant.identity:null;
  STATE.myGroup=STATE.isHost?0:(map[myId]||null);
  refreshBreakoutAV(); showBreakoutBanner(mins);
  var app=$('#gm-app'); if(app)app.classList.add('in-breakout');
  if(!STATE.isHost){ if(STATE.myGroup){ setMode('grid',{remote:true}); toast('Breakout Odası '+STATE.myGroup+"'e taşındın — artık yalnızca grubunla görüşüyorsun."); sysChat('Breakout Odası '+STATE.myGroup+"'desin. Grup arkadaşlarınla çalış."); } else { toast('Öğretmen breakout başlattı.'); } }
}
function clearBreakout(){ var was=STATE.breakout,wasG=STATE.myGroup; STATE.breakout=null; STATE.myGroup=null; refreshBreakoutAV(); hideBreakoutBanner(); var bo=$('#bo-result'); if(bo)bo.innerHTML=''; var app=$('#gm-app'); if(app)app.classList.remove('in-breakout'); if(was&&!STATE.isHost){ toast('Ana odaya döndün.'); sysChat('Ana ders odasına döndün.'); } }
function refreshBreakoutAV(){
  if(!STATE.lkRoom)return;
  STATE.lkRoom.remoteParticipants.forEach(function(p){
    var t=tileEl(p.identity); if(!t)return;
    var sameG=STATE.breakout&&(STATE.breakout[p.identity]===STATE.myGroup);
    var hear=STATE.isHost||isHostMeta(p)||(!STATE.breakout)||sameG;
    var show=STATE.isHost||(!STATE.breakout)||sameG||isHostMeta(p);
    var au=t.querySelectorAll('audio'); for(var i=0;i<au.length;i++)au[i].muted=!hear;
    t.style.display=show?'':'none';
  });
  updateGridCount();
}
function showBreakoutBanner(mins){
  var bar=$('#gmr-breakout-bar'); if(!bar)return; bar.classList.remove('hidden');
  var left=mins*60;
  function render(){ var lbl=STATE.isHost?'Breakout aktif':('Grubun: '+STATE.myGroup); bar.innerHTML='<span>'+lbl+' · '+fmt(left)+'</span>'+(STATE.isHost?'<button id="bk-recall2">Geri Çağır</button>':''); var r=$('#bk-recall2'); if(r)r.addEventListener('click',function(){ sendData({t:'breakout-end'}); clearBreakout(); }); }
  render();
  clearInterval(STATE.boTimer);
  STATE.boTimer=setInterval(function(){ left--; if(left<=0){ clearInterval(STATE.boTimer); if(STATE.isHost) sendData({t:'breakout-end'}); clearBreakout(); return; } render(); },1000);
}
function hideBreakoutBanner(){ var bar=$('#gmr-breakout-bar'); if(bar)bar.classList.add('hidden'); clearInterval(STATE.boTimer); }

/* ================= BACKGROUND ================= */
var TP=null,tpTried=false;
// Yüksek-kalite arka plan (yumuşak maske + multiclass) — VARSAYILAN AÇIK.
// Kapatmak için ?hqbg=0 veya localStorage gm-hqbg='0'. Hata olursa track-processors'a düşer.
var _HQBG=!(/[?&]hqbg=0/.test(location.search)||(function(){try{return localStorage.getItem('gm-hqbg')==='0';}catch(e){return false;}})());
async function loadTP(){ if(TP||tpTried)return TP; tpTried=true; try{ TP=await import('https://esm.sh/@livekit/track-processors'); }catch(e){ try{ TP=await import('https://cdn.jsdelivr.net/npm/@livekit/track-processors/+esm'); }catch(e2){ TP=null; } } return TP; }
var _krisp=null,_krispTried=false,_krispOn=false,_nfNoted=false,_nfTries=0;
// Krisp WASM yüklemesi/başlatması AĞIR — kamera kurulumuyla AYNI anda çalışırsa ana
// thread kilitlenir ve kamera o süre boyunca kapanır/donar. Bu yüzden kamera açıksa
// gürültü filtresini kamera tam yerleşene kadar geciktir (çakışmayı ayır).
function scheduleNoiseFilter(){ setTimeout(applyNoiseFilter, STATE.camOn ? 3200 : 800); }
async function loadKrisp(){ if(_krisp||_krispTried)return _krisp; _krispTried=true; try{ _krisp=await import('https://esm.sh/@livekit/krisp-noise-filter'); }catch(e){ try{ _krisp=await import('https://cdn.jsdelivr.net/npm/@livekit/krisp-noise-filter/+esm'); }catch(e2){ _krisp=null; } } return _krisp; }
async function applyNoiseFilter(){ if(_krispOn)return; try{
  if(!STATE.lkRoom||!STATE.micOn)return;
  var mp=STATE.lkRoom.localParticipant.getTrackPublication(LK.Track.Source.Microphone); var at=mp&&mp.audioTrack;
  if((!at||!at.setProcessor)){ if(_nfTries++<6){ setTimeout(applyNoiseFilter,700); } return; }
  var k=await loadKrisp(); var KNF=k&&(k.KrispNoiseFilter||k.default);
  var sup=true; if(k&&typeof k.isKrispNoiseFilterSupported==='function'){ try{ sup=k.isKrispNoiseFilterSupported(); }catch(e){ sup=true; } }
  if(!KNF||!sup){ if(!_nfNoted){ _nfNoted=true; toast('Tarayıcı gürültü/eko bastırma açık. (Gelişmiş filtre bu bağlantıda kullanılamıyor.)'); } return; }
  await at.setProcessor(KNF()); _krispOn=true; if(!_nfNoted){ _nfNoted=true; toast('Gelişmiş gürültü filtresi açık — klavye ve tık sesleri bastırılıyor.'); }
}catch(e){ if(!_nfNoted){ _nfNoted=true; toast('Gürültü filtresi uygulanamadı; tarayıcı gürültü azaltma devrede.'); } } }
function buildBgGrid(){
  var g=$('#bg-grid'); if(!g)return; g.innerHTML='';
  BGS.forEach(function(b){ var d=document.createElement('button'); d.className='bg-opt '+(b.id==='none'?'none':b.id==='blur'?'blur':'')+(STATE.bg===b.id?' on':''); d.dataset.bg=b.id; if(b.id!=='none'&&b.id!=='blur') d.style.backgroundImage='url("'+bgFile(b.id)+'")'; d.innerHTML='<span>'+b.label+'</span>'; d.addEventListener('click',function(){ $$('.bg-opt').forEach(function(x){x.classList.remove('on');}); d.classList.add('on'); applyBackground(b.id); }); g.appendChild(d); });
  if(STATE.customBg){ var c=document.createElement('button'); c.className='bg-opt'+(STATE.bg==='custom'?' on':''); c.dataset.bg='custom'; c.style.backgroundImage='url("'+STATE.customBg+'")'; c.innerHTML='<span>Benim</span>'; c.addEventListener('click',function(){ $$('.bg-opt').forEach(function(x){x.classList.remove('on');}); c.classList.add('on'); applyBackground('custom'); }); g.appendChild(c); }
  var up=document.createElement('button'); up.type='button'; up.className='bg-opt bg-upload'; up.innerHTML='<span>+ Kendi arka planın</span>'; up.addEventListener('click',function(){ var i=$('#bg-file-input'); if(i)i.click(); }); g.appendChild(up);
}
function bindBgUpload(){ var i=$('#bg-file-input'); if(!i)return; i.addEventListener('change',function(){ var f=i.files&&i.files[0]; i.value=''; if(!f)return; if(!/^image\//.test(f.type)){ toast('Lütfen bir resim dosyası seç.'); return; }
  var rd=new FileReader(); rd.onload=function(){ var img=new Image(); img.onload=function(){ try{
    var mw=1280, sc=Math.min(1,mw/img.width), w=Math.round(img.width*sc), h=Math.round(img.height*sc);
    var cv=document.createElement('canvas'); cv.width=w; cv.height=h; cv.getContext('2d').drawImage(img,0,0,w,h);
    var data=cv.toDataURL('image/jpeg',0.82); STATE.customBg=data;
    try{ localStorage.setItem('gm-bg-custom',data); }catch(e){ toast('Görsel çok büyük, tekrar kaydedilemedi (daha küçük bir resim dene).'); }
    buildBgGrid(); applyBackground('custom');
  }catch(e){ toast('Görsel işlenemedi.'); } }; img.onerror=function(){ toast('Görsel açılamadı.'); }; img.src=rd.result; }; rd.readAsDataURL(f); }); }
// Girişte arka planı OTOMATİK uygulamıyoruz: segmentasyon modelinin ilk yüklemesi
// zayıf makinelerde ana thread'i kilitleyip sayfayı donduruyordu. Kayıtlı tercih
// korunur; kullanıcı odaya girince "Arka Plan"dan tek tıkla açar.
function bindBgFlip(){ var f=$('#bg-flip'); if(!f)return; f.checked=!!STATE.bgFlip; f.addEventListener('change',function(){ STATE.bgFlip=f.checked; try{localStorage.setItem('gm-bgflip',f.checked?'1':'0');}catch(e){} var g=$('#gate-bg-flip'); if(g)g.checked=f.checked; if(STATE.camTrack&&STATE.bg&&STATE.bg!=='none'&&STATE.bg!=='blur') applyBackground(STATE.bg); }); }
var _bgHintShown=false;
function scheduleAutoBg(){
  if(STATE._bgApplied) return; // arka plan gate'te zaten uygulandı — ipucu gösterme
  if(STATE.bg && STATE.bg!=='none' && !_bgHintShown){
    _bgHintShown=true;
    setTimeout(function(){ try{ toast('Arka planın hazır — açmak için “Arka Plan”a dokun.'); }catch(e){} }, 3000);
  }
}
async function applyBackground(bg){
  STATE.bg=bg; try{localStorage.setItem('gm-bg',bg);}catch(e){} var track=STATE.camTrack;
  if(!track){ toast(STATE.demo?'Arka plan için canlı bağlantı gerekli.':'Kamera açık değil.'); return; }
  var note=$('#bg-note'); if(note)note.textContent='Uygulanıyor…';
  try{
    if(bg==='none'){ if(track.getProcessor&&track.getProcessor()) await track.stopProcessor(); }
    else if(_HQBG && window.GriBg){
      try{ await track.setProcessor(window.GriBg.create({mode:bg==='blur'?'blur':'image',blurRadius:14,imagePath:bg==='blur'?null:await bgSrc(bg),flip:STATE.bgFlip})); }
      catch(_hq){ var tpH=await loadTP(); if(tpH){ if(bg==='blur') await track.setProcessor(tpH.BackgroundBlur(12)); else await track.setProcessor(tpH.VirtualBackground(await bgSrc(bg))); } else { toast('Arka plan uygulanamadı.'); if(note)note.textContent='Uygulanamadı.'; return; } } }
    else{ var tp=await loadTP(); if(!tp){ toast('Bu tarayıcıda arka plan efekti desteklenmiyor.'); if(note)note.textContent='Bu tarayıcıda desteklenmiyor.'; return; }
      if(bg==='blur') await track.setProcessor(tp.BackgroundBlur(12));
      else await track.setProcessor(tp.VirtualBackground(await bgSrc(bg))); }
    if(note)note.textContent='Hazır. İlk seçimde birkaç saniye sürebilir.';
    setTimeout(function(){ $('#bg-modal').classList.add('hidden'); },300);
  }catch(e){ toast('Arka plan uygulanamadı.'); if(note)note.textContent='Uygulanamadı.'; }
}

/* ================= MATERIALS ================= */
function bindMaterials(){
  $('#gmr-mat-close').addEventListener('click',function(){ setMode('grid'); });
  $$('.mat-tab').forEach(function(t){ t.addEventListener('click',function(){ $$('.mat-tab').forEach(function(x){x.classList.remove('active');}); t.classList.add('active'); $$('.mat-pane').forEach(function(p){ p.classList.toggle('hidden',p.getAttribute('data-mat-pane')!==t.dataset.mat); }); }); });
  $('#mat-yt-load').addEventListener('click',function(){ var u=$('#mat-yt-url').value.trim(); if(!u)return; loadMaterial({kind:'yt',value:u},false); });
  buildUnitSelectors(); buildPresets();
  $('#mat-unit-load').addEventListener('click',function(){ var f=$('#mat-unit').value; if(!f)return; loadMaterial({kind:'unit',value:f},false); });
  $('#mat-page-load').addEventListener('click',function(){ var u=($('#mat-page-url').value||'').trim(); if(!u)return; loadMaterial({kind:'unit',value:normalizePath(u)},false); });
  $('#mat-page-url').addEventListener('keydown',function(e){ if(e.key==='Enter')$('#mat-page-load').click(); });
  var sh=$('#mat-share'); if(sh) sh.addEventListener('click',function(){
    if(!STATE.currentMaterial){ toast('Önce bir materyal aç.'); return; }
    if(!STATE.matShared){ broadcastMat(STATE.currentMaterial.kind,STATE.currentMaterial.value,STATE.currentMaterial.ext,false); STATE.matShared=true; sh.textContent='Paylaşımı Durdur'; sh.classList.add('stop'); toast('Öğrencilere paylaşıldı.'); }
    else { sendData({t:'mat-stop'}); STATE.matShared=false; STATE.matPaused=false; var pz0=$('#mat-pause'); if(pz0){ pz0.classList.remove('on'); pz0.textContent='Duraksat'; } sh.textContent='Öğrencilerle Paylaş'; sh.classList.remove('stop'); toast('Paylaşım durduruldu.'); }
  });
  // Duraksat (#12): öğrenci seni takip etmeyi bıraksın, sen dosya/sayfa hazırla; Devam Et'te öğrenci
  // şu anki görünümüne çekilir. Duraksatınca nav/scroll/zoom yayınları bastırılır (currentMaterial
  // yine takip edilir, resume'de o yayınlanır).
  var pz=$('#mat-pause'); if(pz) pz.addEventListener('click',function(){
    if(!STATE.matShared){ toast('Önce paylaş, sonra duraksatabilirsin.'); return; }
    STATE.matPaused=!STATE.matPaused; pz.classList.toggle('on',STATE.matPaused); pz.textContent=STATE.matPaused?'Devam Et':'Duraksat';
    if(STATE.matPaused){ toast('Paylaşım duraksatıldı — öğrenci seni takip etmiyor, hazırlığını yapabilirsin.'); }
    else { if(STATE.currentMaterial){ broadcastMat(STATE.currentMaterial.kind,STATE.currentMaterial.value,STATE.currentMaterial.ext,false); if(STATE.matZoom!==1) sendData({t:'mat-zoom',z:STATE.matZoom}); } toast('Paylaşım devam ediyor — öğrenci seninle.'); }
  });
  function zBroadcast(){ if(canBroadcastScroll()) sendData({t:'mat-zoom',z:STATE.matZoom}); }
  function zin(){ STATE.matZoom=Math.min(2.5,Math.round((STATE.matZoom+0.15)*100)/100); applyZoom(); zBroadcast(); }
  function zout(){ STATE.matZoom=Math.max(0.4,Math.round((STATE.matZoom-0.15)*100)/100); applyZoom(); zBroadcast(); }
  $('#mat-zoom-in').addEventListener('click',zin);
  $('#mat-zoom-out').addEventListener('click',zout);
  var zfi=$('#mat-zoom-fab-in'); if(zfi)zfi.addEventListener('click',zin);
  var zfo=$('#mat-zoom-fab-out'); if(zfo)zfo.addEventListener('click',zout);
  var at=$('#mat-anno-toggle'); if(at) at.addEventListener('click',function(){ var on=$('#gmr-materials').classList.toggle('annotating'); at.classList.toggle('on',on); if(on) setTimeout(ANNO.resize,30); try{ PDFHL.syncActive(); }catch(e){} });
  var gc=$('#mat-give-control'); if(gc) gc.addEventListener('click',function(){ STATE.matControl=!STATE.matControl; STATE._appliedMatSeq=0; gc.classList.toggle('on',STATE.matControl); gc.textContent=STATE.matControl?'Kontrolü Al':'Kontrolü Ver'; sendData({t:'mat-control',on:STATE.matControl}); applyMatLock(); toast(STATE.matControl?'Öğrenci artık sayfayı kaydırıp tıklayabilir (iki yönlü senkron).':'Sayfa kontrolü sende.');
    // Kontrolü GERİ ALINCA öğretmen yeniden sürücü — mevcut nav/durumu hemen yayınla ki öğrenci kopmadan takip etsin (iframe reload YOK).
    if(!STATE.matControl){ STATE._lastNavRel=null; setTimeout(function(){ var f=document.getElementById('mat-uni-if'); if(f){ try{ navBroadcastNow(f); }catch(e){} } requestRunnerState(); },150); } });
  bindFileUpload();
}
function bindFileUpload(){
  var pick=$('#mat-file-pick'), inp=$('#mat-file-input'), st=$('#mat-file-status'); if(!pick||!inp)return;
  pick.addEventListener('click',function(){ inp.click(); });
  inp.addEventListener('change',async function(){
    var f=inp.files&&inp.files[0]; if(!f)return;
    var ext=(f.name.split('.').pop()||'').toLowerCase(); inp.value='';
    if(ext!=='pdf'){ toast('Sadece PDF yükleyebilirsin. Word/PowerPoint için PDF olarak kaydet ya da Ekran ile paylaş.'); return; }
    if(f.size>26214400){ toast('Dosya 25 MB sınırını aşıyor.'); return; }
    if(!STATE.supabase){ toast('Yükleme için giriş yapmış olmalısın.'); return; }
    st.textContent='Yükleniyor…';
    try{
      var safe=f.name.replace(/[^\w.\-]+/g,'_').slice(-56);
      var path=(STATE.room||'oda')+'/'+Date.now().toString(36)+Math.random().toString(36).slice(2,7)+'-'+safe;
      var up=await STATE.supabase.storage.from('grimeet-files').upload(path,f,{upsert:false,contentType:f.type||undefined});
      if(up.error) throw up.error;
      var pub=STATE.supabase.storage.from('grimeet-files').getPublicUrl(path);
      var url=pub&&pub.data&&pub.data.publicUrl; if(!url) throw new Error('URL alınamadı');
      st.textContent=f.name;
      loadMaterial({kind:'file',value:url,ext:ext,name:f.name},false);
      setMode('materials');
      toast('Dosya yüklendi. Öğrencilere göstermek için "Öğrencilerle Paylaş".');
    }catch(e){ st.textContent=''; toast('Yükleme başarısız: '+((e&&e.message)||'hata')); }
  });
}
function ytId(u){ var m=String(u).match(/(?:v=|youtu\.be\/|embed\/)([\w-]{11})/); return m?m[1]:(String(u).length===11?u:null); }
// Canlı yazı-senkronu runner'ları: IELTS deneme (reading/writing/listening) + odev (ödev).
// Bu sayfalar interaktif (input/essay) — geçiş URL değiştirmez, gmsync=1 bayrağıyla
// runner'ın postMessage köprüsünü açarız (öğretmen yazınca öğrenci görsün / iki yönlü). #108
function isExamRunner(v){ v=String(v||''); return /ielts-deneme-(reading|writing|listening)/i.test(v) || /(^|\/)odev(\.html)?([?#]|$)/i.test(v); }
function loadMaterial(m,remote){
  STATE.currentMaterial={kind:m.kind,value:m.value,ext:m.ext,name:m.name};
  STATE.matScrollEl=null;
  // Nav-izleyiciyi yeni materyale göre sıfırla (yt/file'a geçince de durdur).
  STATE._lastNavRel=(m.kind==='unit')?String(m.value):null; clearInterval(STATE._navWatch);
  ANNO.reset(!remote); try{ PDFHL.reset(!remote); }catch(e){}
  if(m.kind==='yt'){ var id=ytId(m.value); if(!id){ if(!remote)toast('Geçerli YouTube bağlantısı değil.'); return; } matTab('youtube'); ensureYtPlayer(id); }
  else if(m.kind==='file'){ matTab('file'); var ff=$('#mat-file-frame'); if(ff){ var ex=(m.ext||'').toLowerCase(); var st=$('#mat-file-status'); if(st&&m.name)st.textContent=m.name;
    if(ex==='pdf'){ ff.innerHTML='<div id="mat-file-scroll" class="pdf-scroll"><div class="mat-empty">PDF hazırlanıyor…</div></div>'; var sc=$('#mat-file-scroll'); applyZoom();
      renderPdf(m.value,sc).then(function(ok){ if(ok){ attachFileScrollSync(sc); applyZoom(); if(remote&&typeof STATE._pendFileScroll==='number'){ applyMatScroll(STATE._pendFileScroll); STATE._pendFileScroll=null; } } else { ff.innerHTML='<iframe id="mat-file-if" src="'+esc(m.value+'#toolbar=1&view=FitH')+'" title="Dosya" allowfullscreen></iframe>'; applyZoom(); } });
    } else { ff.innerHTML='<iframe id="mat-file-if" src="'+esc('https://view.officeapps.live.com/op/embed.aspx?src='+encodeURIComponent(m.value))+'" title="Dosya" allowfullscreen></iframe>'; applyZoom(); }
  } }
  else if(m.kind==='unit'){ matTab('unite'); var frame=$('#mat-unit-frame');
    // Hızlı geçiş: önceki yükleme-zamanlayıcısını iptal et; reqId artışı eski iframe load/fetch'ini geçersiz kılar (last-wins).
    clearTimeout(STATE._matLoadTmr);
    if(remote){ var reqId=(STATE._matReqId=(STATE._matReqId||0)+1); var done=false;
      frame.innerHTML='<iframe id="mat-uni-if" title="Sayfa"></iframe><div class="mat-loading" id="mat-loading">Öğretmenin sayfası yükleniyor…</div>'; var fr=document.getElementById('mat-uni-if'); attachMatScrollSync(fr); applyZoom();
      var stale=function(){ return reqId!==STATE._matReqId; };
      var clearOv=function(){ if(stale())return; var ld=document.getElementById('mat-loading'); if(ld)ld.remove(); };
      var failOv=function(){ if(stale())return; var ld=document.getElementById('mat-loading'); if(!ld)return; ld.style.pointerEvents='auto'; ld.innerHTML='Sayfa yüklenemedi. <button type="button" id="mat-reload" style="margin-left:8px;padding:6px 12px;border:1px solid var(--gm-line);border-radius:8px;background:var(--gm-surface);color:var(--gm-ink);cursor:pointer">Tekrar dene</button>'; var rb=document.getElementById('mat-reload'); if(rb)rb.addEventListener('click',function(){ loadMaterial(m,true); }); };
      // Uygulama/parametreli sayfalar (odev, sinif, panelim, ?id= / #hash vb.): srcdoc render'ı
      // window.location'ı about:srcdoc yapar → sayfa ?id/?class parametrelerini ve gringlizce.com
      // oturumunu okuyamaz ("Ödev/Sınıf bulunamadı"). Bunları gerçek same-origin iframe.src ile yükle:
      // öğrencinin kendi oturumu + URL parametreleri korunur (host tarafıyla aynı yol).
      var _isApp = /[?#]/.test(m.value) || /(^|\/)(odev|sinifim|ogretmen-sinif|panelim)\.html/i.test(m.value);
      if(_isApp){
        if(fr) fr.addEventListener('load',function(){ if(stale())return; done=true; clearTimeout(STATE._matLoadTmr); clearOv();
          // Exam runner ise: yüklenince öğretmenden tam durumu iste (paylaşım başında mevcut essay/cevap/başladı-part tek seferde gelsin).
          if(!STATE.isHost && isExamRunner(m.value)) setTimeout(function(){ sendData({t:'exreq'}); },400); });
        STATE._matLoadTmr=setTimeout(function(){ if(!done&&!stale()) failOv(); },10000);
        // present=1: öğrenci atanmamış olsa bile sunum modunda salt-okunur görebilsin (odev.html iframe+present kontrolü yapar)
        try{ var _pu=new URL(m.value,'https://gringlizce.com/'); _pu.searchParams.set('present','1'); if(isExamRunner(m.value)) _pu.searchParams.set('gmsync','1'); fr.src=_pu.href; }catch(e){ clearTimeout(STATE._matLoadTmr); failOv(); }
      } else {
        // Statik içerik sayfası: proxy ile çek, srcdoc'a bas (öğrencinin erişimi olmasa da içerik görünür).
        if(fr) fr.addEventListener('load',function(){ if(fr.getAttribute('srcdoc')) clearOv(); });
        STATE._matLoadTmr=setTimeout(function(){ if(!done&&!stale()) failOv(); },8000);
        fetch(materialProxy(m.value),{headers:{apikey:SUPABASE_ANON_KEY}}).then(function(r){ if(!r.ok) throw new Error('http '+r.status); return r.text(); }).then(function(h){ if(stale()){ return; } done=true; clearTimeout(STATE._matLoadTmr); var f=document.getElementById('mat-uni-if'); if(f){ try{ f.srcdoc=gmChromeHTML(h); }catch(e){} applyZoom(); } clearOv(); }).catch(function(){ if(stale()){ return; } done=true; clearTimeout(STATE._matLoadTmr); failOv(); });
      }
    } else {
      // HOST tarafı: ağır tam-site sayfası yüklenirken öğretmen kilitlenmesin — örtü + 10sn timeout + "Tekrar dene" + reqId iptali.
      var hReqId=(STATE._matReqId=(STATE._matReqId||0)+1), hDone=false;
      frame.innerHTML='<iframe id="mat-uni-if" title="Sayfa"></iframe><div class="mat-loading" id="mat-loading">Sayfa yükleniyor…</div>';
      var hf=document.getElementById('mat-uni-if'); attachMatScrollSync(hf); applyZoom();
      var hStale=function(){ return hReqId!==STATE._matReqId; };
      var hClear=function(){ if(hStale())return; var ld=document.getElementById('mat-loading'); if(ld)ld.remove(); };
      var hFail=function(){ if(hDone||hStale())return; var ld=document.getElementById('mat-loading'); if(!ld)return; ld.style.pointerEvents='auto'; ld.innerHTML='Sayfa yüklenemedi. <button type="button" id="mat-reload-h" style="margin-left:8px;padding:6px 12px;border:1px solid var(--gm-line);border-radius:8px;background:var(--gm-surface);color:var(--gm-ink);cursor:pointer">Tekrar dene</button>'; var rb=document.getElementById('mat-reload-h'); if(rb)rb.addEventListener('click',function(){ loadMaterial(m,false); }); };
      // iframe yüklenince (ilk yük ve sayfa-içi gezinme) örtüyü kaldır; yeni nav gelirse hStale iptal eder.
      if(hf) hf.addEventListener('load',function(){ if(hStale())return; hDone=true; clearTimeout(STATE._matLoadTmr); hClear(); });
      STATE._matLoadTmr=setTimeout(function(){ hFail(); },10000);
      try{ var _hu=new URL(m.value,'https://gringlizce.com/'); if(isExamRunner(m.value)) _hu.searchParams.set('gmsync','1'); hf.src=_hu.href; }catch(e){ clearTimeout(STATE._matLoadTmr); hFail(); }
    }
  }
  applyZoom();
  if(!remote&&STATE.matShared&&!STATE.matPaused){ broadcastMat(m.kind,m.value,m.ext,false); if(STATE.matZoom!==1) sendData({t:'mat-zoom',z:STATE.matZoom}); }
}
function applyZoom(){ $$('.mat-frame iframe').forEach(function(f){ try{ f.style.zoom=STATE.matZoom; }catch(e){} }); var fs=document.getElementById('mat-file-scroll'); if(fs){ try{ fs.style.zoom=STATE.matZoom; }catch(e){} } var pct=Math.round(STATE.matZoom*100)+'%'; var v=$('#mat-zoom-val'); if(v)v.textContent=pct; var vf=$('#mat-zoom-fab-val'); if(vf)vf.textContent=pct; }
function materialProxy(f){ return SUPABASE_URL+'/functions/v1/grimeet-material?f='+encodeURIComponent(f); }
var _pdfjs=null,_pdfjsTried=false,_pdfVer='4.7.76';
async function loadPdfjs(){ if(_pdfjs||_pdfjsTried)return _pdfjs; _pdfjsTried=true; try{ var m=await import('https://cdn.jsdelivr.net/npm/pdfjs-dist@'+_pdfVer+'/build/pdf.min.mjs'); m.GlobalWorkerOptions.workerSrc='https://cdn.jsdelivr.net/npm/pdfjs-dist@'+_pdfVer+'/build/pdf.worker.min.mjs'; _pdfjs=m; }catch(e){ _pdfjs=null; } return _pdfjs; }
async function renderPdf(url,container){
  var pdfjs=await loadPdfjs(); if(!pdfjs||!container)return false;
  try{
    var pdf=await pdfjs.getDocument({url:url,withCredentials:false}).promise;
    container.innerHTML=''; var scale=Math.min(2,(container.clientWidth-24)/612)||1.3; if(!(scale>0.3))scale=1.3;
    for(var i=1;i<=pdf.numPages;i++){ var page=await pdf.getPage(i); var vp=page.getViewport({scale:scale});
      var cv=document.createElement('canvas'); cv.className='pdf-page'; cv.width=vp.width; cv.height=vp.height; container.appendChild(cv);
      await page.render({canvasContext:cv.getContext('2d'),viewport:vp}).promise; }
    // Fosforlu katmanı: sayfalarla aynı scroll kabı içinde → PDF ile birlikte kayar.
    var hl=document.createElement('canvas'); hl.id='pdf-hl-canvas'; container.appendChild(hl); PDFHL.mount(hl,container);
    return true;
  }catch(e){ return false; }
}
/* ===== PDF Fosforlu (highlighter) — içerik-hizalı, scroll ile kayan AYRI katman. ANNO'ya dokunmaz.
   Yalnız 'Üstüne Çiz' AÇIK ve ANNO aracı 'highlighter' iken pointer yakalar; diğer araçlar #anno-canvas'ta kalır.
   Koordinatlar SAYFA-BAZLI normalize (0-1 + sayfa index) → çözünürlük/genişlik/margin bağımsız hizalama.
   Tek büyük canvas'ın belleği/boyut sınırı: backing store MAXDIM/MAXAREA ile ölçeklenir (görsel içerik boyu korunur). */
var PDFHL=(function(){
  var cv=null,ctx=null,cont=null,rects=[],cw=1,ch=1,bs=1,items=[],drawing=false,cur=null;
  var MAXDIM=8192,MAXAREA=16e6,PAD=14,_roT=null; // iOS Safari canvas alan sınırı (~16.7M px) altında kal
  function mounted(){ return !!(cv&&cv.isConnected&&ctx); }
  function acol(){ try{ return ANNO.currentColor(); }catch(e){ return '#ffe14d'; } }
  function asize(){ try{ return Math.max(10,(ANNO.currentSize()||6)*3); }catch(e){ return 18; } }
  function curTool(){ try{ return ANNO.currentTool(); }catch(e){ return ''; } }
  // İçerik ölçümünü zoom'dan bağımsız yap: zoom'u geçici sıfırla, yerel px oku, geri koy (canvas zoom'u kaptan miras alır).
  function measure(){
    if(!cv||!cont)return; var pages=Array.prototype.slice.call(cont.querySelectorAll('canvas.pdf-page')); if(!pages.length)return;
    var z=cont.style.zoom, un=(z&&z!==''&&z!=='1'); if(un) cont.style.zoom='';
    cw=cont.clientWidth||1; rects=pages.map(function(p){ return {left:p.offsetLeft,top:p.offsetTop,w:p.offsetWidth,h:p.offsetHeight}; });
    var last=pages[pages.length-1]; ch=(last.offsetTop+last.offsetHeight+PAD)||cont.scrollHeight||1;
    if(un) cont.style.zoom=z;
    cv.style.width=cw+'px'; cv.style.height=ch+'px';
    bs=Math.min(1, MAXDIM/cw, MAXDIM/ch, Math.sqrt(MAXAREA/(cw*ch))); if(!(bs>0))bs=1;
    cv.width=Math.max(1,Math.round(cw*bs)); cv.height=Math.max(1,Math.round(ch*bs)); ctx=cv.getContext('2d'); redraw();
  }
  function ro(){ clearTimeout(_roT); _roT=setTimeout(measure,120); }
  function pageAt(px,py){ var bi=0,bd=Infinity; for(var i=0;i<rects.length;i++){ var r=rects[i]; if(px>=r.left&&px<=r.left+r.w&&py>=r.top&&py<=r.top+r.h)return i; var cy=Math.max(r.top,Math.min(py,r.top+r.h)); var d=Math.abs(py-cy); if(d<bd){bd=d;bi=i;} } return bi; }
  function ptFromEvent(e){ var r=cv.getBoundingClientRect(); var px=(e.clientX-r.left)/r.width*cw, py=(e.clientY-r.top)/r.height*ch; var pi=pageAt(px,py); var pr=rects[pi]||{left:0,top:0,w:cw,h:ch}; return {p:pi,x:(px-pr.left)/(pr.w||1),y:(py-pr.top)/(pr.h||1)}; }
  var bcast=throttle(function(){ sendData({t:'pdf-hl',items:items}); },160);
  function down(e){ if(!mounted()||!rects.length)return; e.preventDefault(); try{ cv.setPointerCapture(e.pointerId); }catch(_){}
    drawing=true; cur={c:acol(),a:0.4,w:asize()/((rects[0]&&rects[0].w)||cw),pts:[ptFromEvent(e)]}; items.push(cur); redraw(); }
  function move(e){ if(!drawing||!cur)return; e.preventDefault(); cur.pts.push(ptFromEvent(e)); redraw(); bcast(); }
  function up(){ if(!drawing)return; drawing=false; cur=null; sendData({t:'pdf-hl',items:items}); }
  function drawStroke(it){ if(!it||!it.pts||!it.pts.length)return; var r0=rects[it.pts[0].p]||rects[0]; if(!r0)return;
    ctx.save(); ctx.globalCompositeOperation='multiply'; ctx.globalAlpha=it.a||0.4; ctx.strokeStyle=it.c||'#ffe14d'; ctx.lineCap='round'; ctx.lineJoin='round';
    ctx.lineWidth=Math.max(4,(it.w||0.02)*(r0.w||cw));
    ctx.beginPath(); it.pts.forEach(function(q,i){ var r=rects[q.p]||r0; var x=r.left+q.x*r.w, y=r.top+q.y*r.h; i?ctx.lineTo(x,y):ctx.moveTo(x,y); }); ctx.stroke(); ctx.restore(); }
  function redraw(){ if(!ctx)return; ctx.setTransform(bs,0,0,bs,0,0); ctx.clearRect(0,0,cw,ch); items.forEach(drawStroke); }
  function syncActive(){ var m=document.getElementById('gmr-materials'); if(!m)return;
    var on=m.classList.contains('annotating') && curTool()==='highlighter' && !!(STATE.currentMaterial&&STATE.currentMaterial.kind==='file'); m.classList.toggle('hl-pdf',on); }
  function mount(canvas,container){ cv=canvas; cont=container; ctx=cv.getContext('2d');
    if(!cv.__gmHL){ cv.__gmHL=1; cv.addEventListener('pointerdown',down); cv.addEventListener('pointermove',move); window.addEventListener('pointerup',up);
      if(window.ResizeObserver){ try{ new ResizeObserver(ro).observe(container); }catch(e){} } window.addEventListener('resize',ro); }
    if(STATE._pendPdfHl){ items=STATE._pendPdfHl||[]; STATE._pendPdfHl=null; }
    measure(); syncActive();
  }
  function applyRemote(list){ items=Array.isArray(list)?list:((list&&list.items)||[]); if(mounted())redraw(); else STATE._pendPdfHl=items; }
  function reset(bc){ items=[]; cur=null; drawing=false; if(mounted())redraw(); if(bc)sendData({t:'pdf-hl',items:[]}); }
  return {mount:mount,applyRemote:applyRemote,reset:reset,syncActive:syncActive,items:function(){return items;}};
})();
function attachFileScrollSync(el){ if(!el)return; STATE.matScrollEl=el; var bc=throttle(function(){ if(STATE._matScrollLock||!canBroadcastScroll())return; var max=(el.scrollHeight-el.clientHeight)||1; sendData({t:'mat-scroll',frac:Math.max(0,Math.min(1,el.scrollTop/max))}); },140); el.addEventListener('scroll',bc,{passive:true}); }
function throttle(fn,ms){ var last=0,timer=null; return function(){ var now=Date.now(),wait=ms-(now-last); if(wait<=0){ last=now; fn(); } else { clearTimeout(timer); timer=setTimeout(function(){ last=Date.now(); fn(); },wait); } }; }
// "Sürücü" kim? Materyal senkronunun kaynağı: paylaşan öğretmen (kontrol vermemişken) VEYA kontrol verilen
// öğrenci. Nav + scroll + zoom + exstate hepsi bu tek kurala göre yayınlanır → tam iki yönlü, kontrol verilse de.
function canBroadcastScroll(){ return (STATE.isHost&&STATE.matShared&&!STATE.matPaused&&!STATE.matControl)||(!STATE.isHost&&STATE.matControl); }
// Cevap/essay senkronu sürücüden bağımsız: paylaşım aktif + duraksatılmamış oldukça iki yönlü.
function canSyncAnswers(){ if(STATE.matPaused) return false; if(STATE.isHost) return !!STATE.matShared; return !!STATE.currentMaterial; }
// Materyal iframe'indeki exam runner'dan tam durumu (started/part/answers/audio) tek seferlik iste → köprü yayınlar.
function requestRunnerState(){ var f=document.getElementById('mat-uni-if'); if(f&&f.contentWindow){ try{ f.contentWindow.postMessage({__gmex:1, requestState:1}, '*'); }catch(e){} } }
function attachMatScrollSync(itf){ if(!itf)return;
  clearInterval(STATE._navWatch);
  itf.addEventListener('load',function(){ try{ var w=itf.contentWindow;
    injectChromeHide(w); // paylaşılan sayfanın site navbar/banner'ını gizle (gerçek iframe)
    if(canBroadcastScroll()) navBroadcastNow(itf); // tam-sayfa geçişte hemen yayınla (sürücü kimse)
    var bc=throttle(function(){ if(STATE._matScrollLock||!canBroadcastScroll())return; try{ var d=w.document.documentElement||w.document.body; var max=(d.scrollHeight-w.innerHeight)||1; var y=(w.scrollY||w.pageYOffset||0); sendData({t:'mat-scroll',frac:Math.max(0,Math.min(1,y/max))}); }catch(e){} },140);
    w.addEventListener('scroll',bc,{passive:true});
  }catch(e){} });
  // URL izleyici: iframe içindeki HER navigasyonu yakala — tam-sayfa geçiş (soru bankası → ielts-soru-bankasi),
  // hash/replaceState/pushState (öğren drilleri, seviye testi, alt-görünümler). 'load' bu SPA geçişlerinde
  // tetiklenmediği için periyodik izleme şart. Değişim yoksa yayın yok (exact-dedup), fırtına olmaz.
  STATE._navWatch=setInterval(function(){ if(canBroadcastScroll()) navBroadcastNow(itf); },1500); /* Faz2.3: idle yoklama 500→1500ms; anlık geçiş zaten 'load' olayıyla yayılır, dedup'lu */
}
// Materyal iframe'inin GÜNCEL URL'ini oku (temiz URL veya .html; hash + query dahil). Yayınlanmaması gereken
// yolları (auth/öğretmen paneli, statik asset, boş/srcdoc) ele.
function navRel(itf){
  try{ var w=itf.contentWindow; if(!w)return null; var loc=w.location;
    var path=String(loc.pathname||'').replace(/^\/+/,'');
    if(!path||path==='blank'||path==='srcdoc') return null;
    if(/(^|\/)(login|giris|ogretmen|ogretmen-sinif|ogretmen-yazi-degerlendirme|panelim|admin)(\.html)?($|\/)/i.test(path)) return null;
    if(/\.(css|js|png|jpe?g|svg|gif|webp|ico|json|mp3|mp4|pdf|woff2?)(\?|#|$)/i.test(path)) return null;
    // Temiz URL (uzantısız) → .html ekle: öğrenci tarafı srcdoc-proxy .html bekliyor (ilk paylaşım da .html ile
    // çalışıyor). Uzantısız 'ielts-soru-bankasi' öğrencide "Sayfa yüklenemedi" veriyordu.
    var _seg=path.split('/').pop(); if(_seg && _seg.indexOf('.')<0) path=path+'.html';
    // grimeet'in eklediği teknik parametreleri (gmsync/present) AYIKLA: yoksa canlı URL yayınlanan
    // değerden farklı görünür, dedup kırılır ve kontrol verilince runner spuriously yeniden yayınlanıp
    // öğretmeni reload eder (başlangıç ekranına döner). Bu ayıklama dedup'ı doğru tutar.
    var _qs=''; try{ var _sp=new URLSearchParams(loc.search||''); _sp.delete('gmsync'); _sp.delete('present'); var _s=_sp.toString(); _qs=_s?('?'+_s):''; }catch(e){ _qs=loc.search||''; }
    return path+_qs+(loc.hash||'');
  }catch(e){ return null; }
}
function navBroadcastNow(itf){
  var rel=navRel(itf); if(!rel||!canBroadcastScroll()) return;
  if(rel===STATE._lastNavRel) return;         // exact-dedup → fırtına yok
  STATE._lastNavRel=rel;
  STATE.currentMaterial={kind:'unit',value:rel};
  broadcastMat('unit',rel,undefined,true);
}
// Geriye uyumluluk: eski çağrı adı korunur.
function scheduleNavBroadcast(itf){ navBroadcastNow(itf);
}
// Paylaşılan sayfanın kendi site navbar'ı/banner/breadcrumb'ını materyal iframe'inde gizle → içeriğe tam yer
// (öğrenci ekranında özellikle önemli; öğretmen zaten Gri Meet araçlarıyla gezinir).
var GM_CHROME_CSS='.gri-nav,.launch-banner,[data-site-banner],.breadcrumb,#gri-breadcrumb{display:none!important}body{padding-top:0!important}';
function gmChromeHTML(h){ var s='<style id="gm-chrome-hide">'+GM_CHROME_CSS+'</style>'; return /<\/head>/i.test(h)?h.replace(/<\/head>/i,s+'</head>'):(s+h); }
function injectChromeHide(win){ try{ var d=win.document; if(!d||d.getElementById('gm-chrome-hide'))return; var st=d.createElement('style'); st.id='gm-chrome-hide'; st.textContent=GM_CHROME_CSS; (d.head||d.documentElement).appendChild(st); }catch(e){} }
function applyMatScroll(frac){ try{
  if(STATE.currentMaterial&&STATE.currentMaterial.kind==='file'){ var el=STATE.matScrollEl; if(!el||!el.isConnected){ STATE._pendFileScroll=frac; return; } var mx=(el.scrollHeight-el.clientHeight)||1; STATE._matScrollLock=true; el.scrollTop=frac*mx; clearTimeout(STATE._matScrollTmr); STATE._matScrollTmr=setTimeout(function(){ STATE._matScrollLock=false; },280); return; }
  var itf=document.getElementById('mat-uni-if'); if(!itf||!itf.contentWindow)return; var w=itf.contentWindow; var d=w.document.documentElement||w.document.body; var max=(d.scrollHeight-w.innerHeight)||1; STATE._matScrollLock=true; w.scrollTo(0,frac*max); clearTimeout(STATE._matScrollTmr); STATE._matScrollTmr=setTimeout(function(){ STATE._matScrollLock=false; },280); }catch(e){} }
var _ytApiP=null;
function loadYtApi(){ if(window.YT&&window.YT.Player) return Promise.resolve(); if(_ytApiP) return _ytApiP; _ytApiP=new Promise(function(res){ var prev=window.onYouTubeIframeAPIReady; window.onYouTubeIframeAPIReady=function(){ if(prev)try{prev();}catch(e){} res(); }; var s=document.createElement('script'); s.src='https://www.youtube.com/iframe_api'; document.head.appendChild(s); }); return _ytApiP; }
function ensureYtPlayer(id){
  loadYtApi().then(function(){
    clearInterval(STATE._ytHb);
    var host=$('#mat-yt-frame'); host.innerHTML='<div id="yt-player" style="width:100%;height:100%"></div>';
    if(STATE.ytPlayer&&STATE.ytPlayer.destroy){ try{STATE.ytPlayer.destroy();}catch(e){} }
    STATE.ytPlayer=new YT.Player('yt-player',{ videoId:id, playerVars:{rel:0,modestbranding:1,enablejsapi:1,origin:location.origin}, events:{
      onReady:function(){ applyZoom(); if(STATE._ytPending){ applyYtSync(STATE._ytPending); STATE._ytPending=null; }
        if(STATE.isHost){ STATE._ytHb=setInterval(function(){ if(!STATE.matShared||STATE.matControl||!STATE.ytPlayer||!STATE.ytPlayer.getPlayerState)return; try{ var st=STATE.ytPlayer.getPlayerState(); if(st===1) sendData({t:'yt-sync',state:1,time:STATE.ytPlayer.getCurrentTime(),id:id}); }catch(e){} },4000); } },
      onStateChange:function(e){ if((STATE.isHost&&STATE.matShared)||(!STATE.isHost&&STATE.matControl)){ try{ sendData({t:'yt-sync',state:e.data,time:STATE.ytPlayer.getCurrentTime(),id:id}); }catch(er){} } }
    }});
  });
}
function applyYtSync(msg){ var p=STATE.ytPlayer; if(!p||!p.seekTo){ STATE._ytPending=msg; return; } try{ if(typeof msg.time==='number'){ var cur=p.getCurrentTime?p.getCurrentTime():0; if(Math.abs(cur-msg.time)>1.3) p.seekTo(msg.time,true); } if(msg.state===1) p.playVideo(); else if(msg.state===2||msg.state===0) p.pauseVideo(); }catch(e){} }
function normalizePath(u){ return String(u).replace(/^https?:\/\/[^\/]+\//i,'').replace(/^\/+/,''); }
function buildPresets(){ var el=$('#mat-presets'); if(!el)return; var P=[
  {l:'IELTS Listening',p:'ielts-bolum-calisma.html?bolum=listening'},{l:'IELTS Reading',p:'ielts-bolum-calisma.html?bolum=reading'},
  {l:'IELTS Writing',p:'ielts-bolum-calisma.html?bolum=writing'},{l:'IELTS Deneme',p:'ielts-deneme.html'},
  {l:'TOEFL',p:'toefl-ogren.html'},{l:'YDS',p:'yds-ogren.html'},{l:'YDT',p:'ydt-ogren.html'},
  {l:'SAT Öğren',p:'sat-ogren.html'},{l:'Seviye Testi',p:'seviye-belirleme.html'},
  {l:'Soru Bankası',p:'soru-bankasi.html'},{l:'Kelime Bankası',p:'kelime-bankasi.html'}
];
  // Not: Öğretmen-panel/auth sayfaları (Sınıfım/Ödevler, Yazı Değerlendirme) preset'ten çıkarıldı —
  // bunlar öğretmenin kendi araçları; materyal olarak paylaşılınca öğrenci ekranında auth-duvarı +
  // nav yeniden-yayın döngüsü yaratıp senkronu kırıyordu. Ortak yazı için Yazı Tahtası kullanılır.
  P.forEach(function(x){ var b=document.createElement('button'); b.textContent=x.l; b.addEventListener('click',function(){ var u=$('#mat-page-url'); if(u)u.value=x.p; loadMaterial({kind:'unit',value:x.p},false); }); el.appendChild(b); }); }
function matTab(which){ $$('.mat-tab').forEach(function(x){x.classList.toggle('active',x.dataset.mat===which);}); $$('.mat-pane').forEach(function(p){p.classList.toggle('hidden',p.getAttribute('data-mat-pane')!==which);}); applyMatLock(); }
function activeMatTab(){ var a=$('.mat-tab.active'); return a?a.dataset.mat:''; }
function applyMatLock(){ var app=$('#gm-app'); if(app) app.classList.toggle('mat-controlled', !!STATE.matControl); var lk=$('#mat-lock'); if(!lk)return; lk.classList.toggle('on', activeMatTab()==='unite' && !STATE.matControl); }
function buildUnitSelectors(){
  var tracks=[{v:'',t:'Adult'},{v:'teen-',t:'Teen'},{v:'junior-',t:'Junior'}], levels=['a1','a2','b1','b2','c1','c2'];
  var tSel=$('#mat-track'),lSel=$('#mat-level'),uSel=$('#mat-unit');
  tracks.forEach(function(x){ var o=document.createElement('option'); o.value=x.v; o.textContent=x.t; tSel.appendChild(o); });
  levels.forEach(function(l){ var o=document.createElement('option'); o.value=l; o.textContent=l.toUpperCase(); lSel.appendChild(o); });
  function fill(){ uSel.innerHTML=''; for(var i=1;i<=21;i++){ var f='genel-'+tSel.value+lSel.value+'-unite-'+i+'.html'; var o=document.createElement('option'); o.value=f; o.textContent='Ünite '+i; uSel.appendChild(o); } }
  tSel.addEventListener('change',fill); lSel.addEventListener('change',fill); fill();
}

/* ================= RECORDING ================= */
var REC={mr:null,chunks:[],int:null,secs:0,ac:null,raf:null};
function bindRecording(){ $('#rec-start').addEventListener('click',startRecording); $('#rec-stop').addEventListener('click',stopRecording); }
function collectAudio(){ try{ REC.ac=new (window.AudioContext||window.webkitAudioContext)(); var dest=REC.ac.createMediaStreamDestination(),added=0;
  function add(tr){ try{ REC.ac.createMediaStreamSource(new MediaStream([tr])).connect(dest); added++; }catch(e){} }
  if(STATE.lkRoom){ var mp=STATE.lkRoom.localParticipant.getTrackPublication(LK.Track.Source.Microphone); if(mp&&mp.track&&mp.track.mediaStreamTrack)add(mp.track.mediaStreamTrack); STATE.lkRoom.remoteParticipants.forEach(function(p){ p.trackPublications.forEach(function(pub){ if(pub.track&&pub.track.kind==='audio'&&pub.track.mediaStreamTrack)add(pub.track.mediaStreamTrack); }); }); }
  else if(STATE.localStream){ STATE.localStream.getAudioTracks().forEach(add); }
  return added?dest.stream:null; }catch(e){ return null; } }
function startRecording(){
  $('#rec-modal').classList.add('hidden');
  var rc=document.createElement('canvas'); rc.width=1280; rc.height=720; var rctx=rc.getContext('2d');
  function frame(){ rctx.fillStyle='#0e0c0a'; rctx.fillRect(0,0,1280,720);
    if(STATE.mode==='board'&&WB.getCanvas()){ try{ rctx.drawImage(WB.getCanvas(),0,0,1280,720); }catch(e){} }
    else if(STATE.mode==='screen'){ var sv=$('#gmr-screen video'); if(sv){ try{ rctx.drawImage(sv,0,0,1280,720); }catch(e){} } }
    else if(STATE.mode==='spotlight'){ var pv=$('#gmr-spotlight video'); if(pv){ try{ rctx.drawImage(pv,0,0,1280,720); }catch(e){} } }
    else { var vids=$$('#gmr-videos video.cam'); var n=vids.length||1,cols=Math.ceil(Math.sqrt(n)),rows=Math.ceil(n/cols),cw=1280/cols,ch=720/rows; vids.forEach(function(v,i){ var cx=(i%cols)*cw,cy=Math.floor(i/cols)*ch; try{ rctx.drawImage(v,cx+4,cy+4,cw-8,ch-8); }catch(e){} }); if(!vids.length){ rctx.fillStyle='#B7AB96'; rctx.font='28px Inter'; rctx.textAlign='center'; rctx.fillText('Gri Meet — Ders Kaydı',640,360); } }
    REC.raf=requestAnimationFrame(frame);
  }
  frame();
  var vStream=rc.captureStream(25),mixed=new MediaStream(); vStream.getVideoTracks().forEach(function(t){mixed.addTrack(t);});
  if($('#rec-audio').checked){ var a=collectAudio(); if(a)a.getAudioTracks().forEach(function(t){mixed.addTrack(t);}); }
  var mime=MediaRecorder.isTypeSupported('video/webm;codecs=vp9')?'video/webm;codecs=vp9':'video/webm';
  try{ REC.mr=new MediaRecorder(mixed,{mimeType:mime}); }catch(e){ toast('Tarayıcı kaydı desteklemiyor.'); cancelAnimationFrame(REC.raf); return; }
  REC.chunks=[]; REC.mr.ondataavailable=function(e){ if(e.data.size)REC.chunks.push(e.data); };
  REC.mr.onstop=function(){ cancelAnimationFrame(REC.raf); if(REC.ac){try{REC.ac.close();}catch(e){}} downloadBlob(new Blob(REC.chunks,{type:'video/webm'})); };
  REC.mr.start(1000); REC.secs=0; $('#ctrl-record').classList.add('rec-on'); $('#rec-bar').classList.remove('hidden');
  REC.int=setInterval(function(){ REC.secs++; $('#rec-time').textContent=fmt(REC.secs); },1000);
  toast('Kayıt başladı.');
}
function stopRecording(){ if(REC.mr&&REC.mr.state!=='inactive')REC.mr.stop(); clearInterval(REC.int); $('#ctrl-record').classList.remove('rec-on'); $('#rec-bar').classList.add('hidden'); }
/* ---- Saf JS .docx üreteci (harici kütüphane yok): store-only ZIP + minimal WordprocessingML ---- */
function _dxU8(str){ return new TextEncoder().encode(str); }
function _dxCrc32(bytes){ var c,crc=0xFFFFFFFF; for(var i=0;i<bytes.length;i++){ c=(crc^bytes[i])&0xFF; for(var k=0;k<8;k++){ c=(c&1)?(0xEDB88320^(c>>>1)):(c>>>1);} crc=(crc>>>8)^c; } return (crc^0xFFFFFFFF)>>>0; }
function _dxZip(files){
  var chunks=[],central=[],offset=0;
  function w16(n){return [n&255,(n>>>8)&255];}
  function w32(n){return [n&255,(n>>>8)&255,(n>>>16)&255,(n>>>24)&255];}
  files.forEach(function(f){
    var nameB=_dxU8(f.name), crc=_dxCrc32(f.data), sz=f.data.length;
    var local=[].concat([0x50,0x4b,0x03,0x04],w16(20),w16(0),w16(0),w16(0),w16(0),w32(crc),w32(sz),w32(sz),w16(nameB.length),w16(0));
    var localU=new Uint8Array(local);
    chunks.push(localU,nameB,f.data);
    var cen=[].concat([0x50,0x4b,0x01,0x02],w16(20),w16(20),w16(0),w16(0),w16(0),w16(0),w32(crc),w32(sz),w32(sz),w16(nameB.length),w16(0),w16(0),w16(0),w16(0),w32(0),w32(offset));
    central.push(new Uint8Array(cen),nameB);
    offset+=localU.length+nameB.length+sz;
  });
  var cenSize=0; central.forEach(function(c){cenSize+=c.length;});
  var end=new Uint8Array([].concat([0x50,0x4b,0x05,0x06],w16(0),w16(0),w16(files.length),w16(files.length),w32(cenSize),w32(offset),w16(0)));
  return new Blob(chunks.concat(central,[end]),{type:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'});
}
function docxFromText(text){
  function ex(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
  var paras=String(text||'').split(/\r?\n/).map(function(l){
    return l==='' ? '<w:p/>' : '<w:p><w:r><w:t xml:space="preserve">'+ex(l)+'</w:t></w:r></w:p>';
  }).join('');
  var doc='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'+
    '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>'+paras+'<w:sectPr/></w:body></w:document>';
  var ct='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'+
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'+
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'+
    '<Default Extension="xml" ContentType="application/xml"/>'+
    '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>';
  var rels='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'+
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'+
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>';
  return _dxZip([{name:'[Content_Types].xml',data:_dxU8(ct)},{name:'_rels/.rels',data:_dxU8(rels)},{name:'word/document.xml',data:_dxU8(doc)}]);
}
function downloadBlob(blob){ var url=URL.createObjectURL(blob),a=document.createElement('a'),d=new Date(); a.href=url; a.download='gri-meet-ders-'+d.getFullYear()+pad(d.getMonth()+1)+pad(d.getDate())+'-'+pad(d.getHours())+pad(d.getMinutes())+'.webm'; document.body.appendChild(a); a.click(); setTimeout(function(){ URL.revokeObjectURL(url); a.remove(); },1000); toast('Kayıt indirildi.'); }

/* ================= WHITEBOARD ================= */
var WB=(function(){
  var cv,ctx,wrap,W=0,H=0,dpr=1,tool='pen',color='#1b1b1b',size=4,fontPx=32;
  var BW=1280,BH=720,S=1,OX=0,OY=0; /* paylasilan mantiksal tahta (herkes ayni gorur, contain-fit) */
  var BOARD_BG='#fbfaf6'; /* tahta kagit rengi (silgi de bunu kullanir; yazim icin acik kalir) */
  function lbColor(){ try{ var v=(getComputedStyle(document.documentElement).getPropertyValue('--gm-stage')||'').trim(); return v||'#e6e0d2'; }catch(e){ return '#e6e0d2'; } } /* tahta etrafi (letterbox) tema-bagli */
  var FONT_MIN=12,FONT_MAX=120,FONT_STEP=6;
  var pages=[[]],pageIx=0,items=pages[0],editingItem=null;
  var drawing=false,cur=null,startPt=null,sel=null,dragOff=null,clip=null,guides=[],resizing=false,fillOn=false,underlineOn=false;
  /* Faz3: gerçek Geri Al — items.pop() değil, eylem-öncesi anlık görüntü yığını (per-sayfa). Sayfa/uzak değişiminde sıfırlanır. */
  var _hist=[],_redo=[],_committed=null,_restoring=false;
  function wbSnap(){ return JSON.stringify(items.map(strip)); }
  function wbResetHist(){ _hist.length=0; _redo.length=0; try{ _committed=wbSnap(); }catch(e){ _committed=null; } }
  function wbUndo(){ if(!_hist.length){ toast('Geri alınacak adım yok.'); return; } _redo.push(_committed!=null?_committed:wbSnap()); var prev=_hist.pop(); setItems(JSON.parse(prev)); rehydrate(items); sel=null; _committed=prev; _restoring=true; redraw(); sendData({t:'wb',items:items.map(strip),page:pageIx,np:pages.length}); _restoring=false; }
  function wbRedo(){ if(!_redo.length)return; _hist.push(_committed!=null?_committed:wbSnap()); var nx=_redo.pop(); setItems(JSON.parse(nx)); rehydrate(items); sel=null; _committed=nx; _restoring=true; redraw(); sendData({t:'wb',items:items.map(strip),page:pageIx,np:pages.length}); _restoring=false; }
  var liveBc=throttle(broadcast,50); /* #4 mid-stroke canlı senkron: çizerken/taşırken öğrencide ~50ms'de görünür (up()'ta kesin gönderim) */
  /* Faz0: mid-stroke'ta tüm diziyi değil YALNIZ aktif öğeyi yolla — paket sabit/küçük kalır (15KB aşımı+jank çözümü). up()'ta tam broadcast reconcile eder. */
  var liveOne=throttle(function(it,idx){ if(!it)return; try{ sendData({t:'wb-live',item:strip(it),idx:idx,page:pageIx,np:pages.length}); }catch(_){} },50);
  var SNAP=6;
  function wbFont(sz){ return '600 '+(sz||24)+'px Inter,sans-serif'; }
  function shapeFill(it){ if(it&&it.fill){ ctx.save(); ctx.globalAlpha=(it.alpha||1)*0.2; ctx.fillStyle=it.color; ctx.fill(); ctx.restore(); } }
  // Metni kutu genisligine (it.w px) gore satirlara sar; it.w yoksa eski davranis (kaydirma yok)
  function textLines(it){
    var src=it.lines||[it.text||''];
    if(!it.w||!ctx) return src;
    var key=(it.size||24)+'|'+it.w+'|'+src.join('');
    if(it._dlKey===key && it._dl) return it._dl;
    ctx.font=wbFont(it.size); var out=[];
    src.forEach(function(line){
      if(!line){ out.push(''); return; }
      var words=String(line).split(' '), cur='';
      for(var i=0;i<words.length;i++){
        var wd=words[i];
        while(ctx.measureText(wd).width>it.w && wd.length>1){
          var k=wd.length; while(k>1 && ctx.measureText(wd.slice(0,k)).width>it.w) k--;
          if(cur){ out.push(cur); cur=''; }
          out.push(wd.slice(0,k)); wd=wd.slice(k);
        }
        var test=cur?cur+' '+wd:wd;
        if(ctx.measureText(test).width>it.w && cur){ out.push(cur); cur=wd; } else cur=test;
      }
      out.push(cur);
    });
    it._dl=out.length?out:['']; it._dlKey=key; return it._dl;
  }
  var COLORS=['#1b1b1b','#5b5b5b','#d64545','#c0392b','#e8833a','#e0a91b','#B78A2E','#3E6B4A','#2E6E6A','#3fa7d6','#2E5E8A','#1b3a6b','#7E3A56','#b5179e','#8b5e3c','#ffffff'];
  function canEdit(){ return true; }
  function init(){
    cv=$('#gmr-canvas'); if(!cv)return; ctx=cv.getContext('2d'); wrap=$('#gmr-board-canvaswrap');
    var cw=$('#wb-colors'); COLORS.forEach(function(c,i){ var b=document.createElement('button'); b.style.background=c; if(i===0)b.classList.add('on'); b.dataset.color=c; cw.appendChild(b); });
    cw.addEventListener('click',function(e){ var b=e.target.closest('[data-color]'); if(!b)return; color=b.dataset.color; $$('#wb-colors button').forEach(function(x){x.classList.remove('on');}); b.classList.add('on'); if(sel!=null&&sel>=0&&items[sel]){ items[sel].color=color; redraw(); broadcast(); } });
    $('#wb-size').addEventListener('input',function(){ size=parseInt(this.value,10); if(sel!=null&&sel>=0&&items[sel]&&items[sel].type!=='text'){ items[sel].size=size; redraw(); broadcast(); } });
    var fd=$('#wb-font-dec'); if(fd){ fd.addEventListener('mousedown',function(e){ e.preventDefault(); }); fd.addEventListener('click',function(){ bumpFont(-1); }); }
    var fi=$('#wb-font-inc'); if(fi){ fi.addEventListener('mousedown',function(e){ e.preventDefault(); }); fi.addEventListener('click',function(){ bumpFont(1); }); }
    fontLabel();
    /* Sayfa gezinme + ekleme (#114) */
    var _pp=$('#wb-page-prev'); if(_pp)_pp.addEventListener('click',function(){ gotoPage(pageIx-1); });
    var _pn=$('#wb-page-next'); if(_pn)_pn.addEventListener('click',function(){ gotoPage(pageIx+1); });
    var _pal=$('#wb-page-addleft'); if(_pal)_pal.addEventListener('click',function(){ addPage('left'); });
    var _par=$('#wb-page-addright'); if(_par)_par.addEventListener('click',function(){ addPage('right'); });
    updatePageUI(); updateWordCount();
    $$('.wb-tool').forEach(function(b){ b.addEventListener('click',function(){ tool=b.dataset.tool; $$('.wb-tool').forEach(function(x){x.classList.remove('active');}); b.classList.add('active'); cv.style.cursor=(tool==='select')?'move':((tool==='text'||tool==='bullet')?'text':'crosshair'); }); });
    $('#wb-image').addEventListener('click',function(){ $('#wb-file').click(); });
    $('#wb-file').addEventListener('change',onImage);
    $('#wb-copy').addEventListener('click',function(){ if(sel!=null){ clip=JSON.parse(JSON.stringify(strip(items[sel]))); toast('Kopyalandı.'); } });
    $('#wb-cut').addEventListener('click',function(){ if(sel!=null){ clip=JSON.parse(JSON.stringify(strip(items[sel]))); items.splice(sel,1); sel=null; redraw(); broadcast(); } });
    $('#wb-paste').addEventListener('click',function(){ if(clip){ var it=JSON.parse(JSON.stringify(clip)); shift(it,26,26); items.push(it); sel=items.length-1; redraw(); broadcast(); } });
    $('#wb-undo').addEventListener('click',function(){ wbUndo(); });
    var _clr=$('#wb-clear'); if(_clr){ _clr.title='Seçili öğeyi sil / tümünü temizle'; _clr.addEventListener('click',function(){ if(sel!=null&&sel>=0&&items[sel]){ items.splice(sel,1); sel=null; redraw(); broadcast(); return; } if(confirm('Bu sayfa temizlensin mi?')){ setItems([]); sel=null; redraw(); broadcast(); } }); }
    var _cp=$('#wb-color-custom'); if(_cp)_cp.addEventListener('input',function(){ color=this.value; $$('#wb-colors button').forEach(function(x){x.classList.remove('on');}); if(sel!=null&&sel>=0&&items[sel]){ items[sel].color=color; redraw(); broadcast(); } });
    var _fl=$('#wb-fill'); if(_fl)_fl.addEventListener('click',function(){ var it=(sel!=null&&sel>=0)?items[sel]:null; var shp=it&&!it.points&&it.type!=='text'; if(shp){ it.fill=!it.fill; this.classList.toggle('on',!!it.fill); redraw(); broadcast(); } else { fillOn=!fillOn; this.classList.toggle('on',fillOn); toast(fillOn?'Dolgu açık — yeni şekiller dolu çizilir':'Dolgu kapalı'); } });
    var _ul=$('#wb-underline'); if(_ul)_ul.addEventListener('click',function(){ var it=(sel!=null&&sel>=0&&items[sel]&&items[sel].type==='text')?items[sel]:null; if(it){ it.u=!it.u; it._dlKey=null; this.classList.toggle('on',!!it.u); redraw(); broadcast(); } else { underlineOn=!underlineOn; this.classList.toggle('on',underlineOn); toast(underlineOn?'Altı çizili metin açık — yeni metinler altı çizili':'Altı çizili kapalı'); } });
    var _dup=$('#wb-dup'); if(_dup)_dup.addEventListener('click',function(){ if(sel!=null&&sel>=0&&items[sel]){ var d=JSON.parse(JSON.stringify(strip(items[sel]))); shift(d,26,26); items.push(d); sel=items.length-1; redraw(); broadcast(); } });
    var _fr=$('#wb-front'); if(_fr)_fr.addEventListener('click',function(){ if(sel!=null&&sel>=0&&items[sel]){ var it=items.splice(sel,1)[0]; items.push(it); sel=items.length-1; redraw(); broadcast(); } });
    var _bk=$('#wb-back'); if(_bk)_bk.addEventListener('click',function(){ if(sel!=null&&sel>=0&&items[sel]){ var it=items.splice(sel,1)[0]; items.unshift(it); sel=0; redraw(); broadcast(); } });
    cv.addEventListener('pointerdown',down); cv.addEventListener('pointermove',move); window.addEventListener('pointerup',up);
    cv.addEventListener('dblclick',function(e){ if(STATE.wbLocked&&!STATE.isHost)return; var p=pos(e); var i=hit(p); if(i>=0&&items[i]&&items[i].type==='text') editText(i); });
    var _lk=$('#wb-lock'); if(_lk)_lk.addEventListener('click',function(){ if(!STATE.isHost)return; STATE.wbLocked=!STATE.wbLocked; this.classList.toggle('on',STATE.wbLocked); this.title=STATE.wbLocked?'Kilit açık — öğrenci çizemez':'Öğrenci çizimini kilitle'; sendData({t:'wb-lock',on:STATE.wbLocked}); toast(STATE.wbLocked?'Tahta kilitlendi — öğrenciler çizemez':'Tahta kilidi açıldı'); });
    window.addEventListener('resize',resize);
    document.addEventListener('keydown',function(e){ if(STATE.mode!=='board')return; var _t=e.target,_tg=_t&&_t.tagName; if(_tg==='TEXTAREA'||_tg==='INPUT'||(_t&&_t.isContentEditable))return; var m=(e.ctrlKey||e.metaKey); if(m&&e.key==='c')$('#wb-copy').click(); else if(m&&e.key==='x')$('#wb-cut').click(); else if(m&&e.key==='v')$('#wb-paste').click(); else if(m&&(e.key==='y'||(e.shiftKey&&(e.key==='z'||e.key==='Z')))){ e.preventDefault(); wbRedo(); } else if(m&&e.key==='z'){ e.preventDefault(); wbUndo(); } else if(e.key==='Delete'&&sel!=null){ items.splice(sel,1);sel=null;redraw();broadcast(); } });
    if(window.ResizeObserver){ try{ new ResizeObserver(function(){ resize(); }).observe(wrap); }catch(e){} }
    resize(); wbResetHist();
  }
  function strip(it){ var c=Object.assign({},it); delete c._img; delete c._dl; delete c._dlKey; return c; }
  /* ---- Çok sayfalı tahta (#114) ---- items her zaman pages[pageIx]'e referanstır; yeniden atamada setItems kullan. */
  function setItems(arr){ items=arr; pages[pageIx]=arr; }
  function ensurePages(n){ while(pages.length<n) pages.push([]); }
  function rehydrate(arr){ (arr||[]).forEach(function(it){ if(it&&it.type==='img'&&it.src&&!it._img){ var im=new Image(); im.onload=redraw; im.src=it.src; it._img=im; } }); }
  /* ---- Canlı kelime sayısı (#112): geçerli sayfadaki metin öğelerinin kelimeleri ---- */
  function countWords(){ var n=0; items.forEach(function(it){ if(it&&it.type==='text'){ var ls=it.lines||[it.text||'']; ls.forEach(function(l){ var m=String(l).replace(/^•\s+/,'').trim().match(/\S+/g); if(m)n+=m.length; }); } }); return n; }
  function updateWordCount(){ var el=$('#wb-wordcount'); if(el) el.textContent=countWords()+' kelime'; }
  function updatePageUI(){ var ind=$('#wb-page-ind'); if(ind) ind.textContent=(pageIx+1)+' / '+pages.length; var pv=$('#wb-page-prev'); if(pv) pv.disabled=(pageIx<=0); var nx=$('#wb-page-next'); if(nx) nx.disabled=(pageIx>=pages.length-1); }
  function closeTextarea(){ var ta=$('#gmr-wb-textarea'); if(ta){ ta.remove(); } editingItem=null; }
  function canModifyPages(){ return STATE.isHost || !STATE.wbLocked; }
  function gotoPage(ix,remote){ if(!remote && !canModifyPages()){ toast('Tahta kilitli — sayfayı öğretmen değiştirir.'); return; } ix=Math.max(0,Math.min(pages.length-1,ix)); closeTextarea(); pageIx=ix; items=pages[pageIx]; sel=null; wbResetHist(); redraw(); updatePageUI(); if(!remote) sendData({t:'wb-nav',op:'goto',ix:pageIx,np:pages.length}); }
  function addPage(side,remote){
    if(!remote && !canModifyPages()){ toast('Tahta kilitli — sayfa ekleyemezsin.'); return; }
    var at=(side==='left')?pageIx:(pageIx+1);
    if(at<0)at=0; if(at>pages.length)at=pages.length;
    closeTextarea(); pages.splice(at,0,[]); pageIx=at; items=pages[pageIx]; sel=null; wbResetHist(); redraw(); updatePageUI();
    if(!remote){ sendData({t:'wb-nav',op:'add',at:at,ix:pageIx,np:pages.length}); toast(side==='left'?'Sola yeni sayfa eklendi.':'Sağa yeni sayfa eklendi.'); }
  }
  /* Uzaktan gelen sayfa yapısı değişimi — index'ler iki tarafta AYNI konuma eklenerek hizalı kalır (#114). */
  function applyNav(msg){
    if(!msg)return; closeTextarea();
    if(msg.op==='add'){ var at=(typeof msg.at==='number')?msg.at:pages.length; if(at<0)at=0; if(at>pages.length)at=pages.length; pages.splice(at,0,[]); ensurePages(msg.np||pages.length); pageIx=(typeof msg.ix==='number')?Math.max(0,Math.min(pages.length-1,msg.ix)):pageIx; items=pages[pageIx]||(pages[pageIx]=[]); sel=null; wbResetHist(); redraw(); updatePageUI(); }
    else if(msg.op==='goto'){ ensurePages(msg.np||1); pageIx=Math.max(0,Math.min(pages.length-1,(typeof msg.ix==='number'?msg.ix:0))); items=pages[pageIx]; sel=null; wbResetHist(); redraw(); updatePageUI(); }
  }
  /* Katılan öğrenciye tüm sayfaları gönder (her sayfa ayrı wb mesajı → tek büyük paket riski yok). */
  function broadcastAllPages(to){ var o=to?{to:[to]}:null; pages.forEach(function(pg,ix){ sendData({t:'wb',items:pg.map(strip),page:ix,np:pages.length},o); }); sendData({t:'wb-nav',op:'goto',ix:pageIx,np:pages.length},o); }
  function selTextSize(){ return (sel!=null&&sel>=0&&items[sel]&&items[sel].type==='text')?(items[sel].size||fontPx):null; }
  function fontLabel(){ var el=$('#wb-fontpx'); if(el){ if(editingItem){ el.textContent=(editingItem.size||fontPx); return; } var s=selTextSize(); el.textContent=(s!=null?s:fontPx); } }
  function syncUlBtn(){ var b=$('#wb-underline'); if(!b)return; var on=(sel!=null&&sel>=0&&items[sel]&&items[sel].type==='text')?!!items[sel].u:underlineOn; b.classList.toggle('on',on); }
  /* Font büyüt/küçült (#113): 1) düzenlenen metin kutusu 2) seçili metin 3) yeni metin için varsayılan.
     Buton mousedown'ında preventDefault → textarea odağı kaçmaz, yazarken boyut anında değişir + senkronlanır. */
  function bumpFont(dir){
    if(editingItem){
      var ns=Math.min(FONT_MAX,Math.max(FONT_MIN,(editingItem.size||fontPx)+dir*FONT_STEP));
      editingItem.size=ns; fontPx=ns; editingItem._dlKey=null;
      var ta=$('#gmr-wb-textarea'); if(ta){ ta.style.fontSize=(ns*S)+'px'; ta.style.height='auto'; ta.style.height=ta.scrollHeight+'px'; }
      redraw(); broadcast(); fontLabel(); return;
    }
    var st=selTextSize();
    if(st!=null){ items[sel].size=Math.min(FONT_MAX,Math.max(FONT_MIN,st+dir*FONT_STEP)); items[sel]._dlKey=null; redraw(); broadcast(); }
    else { fontPx=Math.min(FONT_MAX,Math.max(FONT_MIN,fontPx+dir*FONT_STEP)); toast('Yazı boyutu: '+fontPx); }
    fontLabel();
  }
  function resize(){ if(!cv||!wrap)return; var r=wrap.getBoundingClientRect(); if(!r.width||!r.height)return; dpr=window.devicePixelRatio||1; cv.width=Math.round(r.width*dpr); cv.height=Math.round(r.height*dpr); W=BW;H=BH; S=Math.min(r.width/BW,r.height/BH); OX=(r.width-BW*S)/2; OY=(r.height-BH*S)/2; redraw(); }
  function pos(e){ var r=cv.getBoundingClientRect(); return {x:((e.clientX-r.left)-OX)/S, y:((e.clientY-r.top)-OY)/S}; }
  function shift(it,dx,dy){ if(it.points)it.points.forEach(function(p){p.x+=dx;p.y+=dy;}); else{ it.x+=dx; it.y+=dy; } }
  function bbox(it){ if(it.points){ var xs=it.points.map(function(p){return p.x;}),ys=it.points.map(function(p){return p.y;}); return {x:Math.min.apply(0,xs),y:Math.min.apply(0,ys),w:Math.max.apply(0,xs)-Math.min.apply(0,xs),h:Math.max.apply(0,ys)-Math.min.apply(0,ys)}; } if(it.type==='text'){ var dl=textLines(it); var bw=it.w; if(!bw){ var mw=0; dl.forEach(function(l){ mw=Math.max(mw,(l||'').length); }); bw=mw*it.size*0.56; } return {x:it.x,y:it.y-it.size,w:bw,h:dl.length*it.size*1.25}; } return {x:Math.min(it.x,it.x+it.w),y:Math.min(it.y,it.y+it.h),w:Math.abs(it.w),h:Math.abs(it.h)}; }
  function hit(pt){ for(var i=items.length-1;i>=0;i--){ var b=bbox(items[i]); if(pt.x>=b.x-6&&pt.x<=b.x+b.w+6&&pt.y>=b.y-6&&pt.y<=b.y+b.h+6)return i; } return -1; }
  /* otomatik hizalama: surenen nesneyi diger nesnelerin kenar/merkez hizasina yapistir + kilavuz cizgi goster */
  function snapDrag(){
    guides=[]; if(sel==null||sel<0||!items[sel])return;
    var b=bbox(items[sel]);
    var mx=[b.x,b.x+b.w/2,b.x+b.w], my=[b.y,b.y+b.h/2,b.y+b.h];
    var bestX=null,bestY=null;
    for(var i=0;i<items.length;i++){ if(i===sel)continue; var o=bbox(items[i]);
      var ox=[o.x,o.x+o.w/2,o.x+o.w], oy=[o.y,o.y+o.h/2,o.y+o.h];
      for(var a=0;a<3;a++){ for(var c=0;c<3;c++){
        var dx=ox[c]-mx[a]; if(Math.abs(dx)<=SNAP&&(!bestX||Math.abs(dx)<Math.abs(bestX.d)))bestX={d:dx,pos:ox[c]};
        var dy=oy[c]-my[a]; if(Math.abs(dy)<=SNAP&&(!bestY||Math.abs(dy)<Math.abs(bestY.d)))bestY={d:dy,pos:oy[c]};
      } }
    }
    var sx=bestX?bestX.d:0, sy=bestY?bestY.d:0;
    if(sx||sy)shift(items[sel],sx,sy);
    if(bestX)guides.push({o:'v',pos:bestX.pos});
    if(bestY)guides.push({o:'h',pos:bestY.pos});
  }
  function down(e){ e.preventDefault(); if(STATE.wbLocked&&!STATE.isHost)return; if(!W||!H){ resize(); if(!W||!H)return; } var p=pos(e);
    if(tool==='select'){
      if(sel!=null&&sel>=0&&items[sel]&&items[sel].type==='text'){ var hb=bbox(items[sel]); if(Math.hypot(p.x-(hb.x+hb.w+6),p.y-(hb.y+hb.h/2))<=10){ resizing=true; try{cv.setPointerCapture(e.pointerId);}catch(_){} return; } }
      sel=hit(p); if(sel>=0){ dragOff={x:p.x,y:p.y,orig:JSON.parse(JSON.stringify(strip(items[sel])))}; try{cv.setPointerCapture(e.pointerId);}catch(_){} } redraw(); return; }
    if(tool==='text'||tool==='bullet'){ placeText(p.x,p.y,tool==='bullet'); return; }
    drawing=true; startPt=p;
    if(tool==='pen'||tool==='highlighter'||tool==='eraser'){ cur={type:tool,color:tool==='eraser'?BOARD_BG:color,size:tool==='highlighter'?size*3:(tool==='eraser'?size*4:size),points:[p],alpha:tool==='highlighter'?0.35:1}; items.push(cur); }
    else { cur={type:tool,x:p.x,y:p.y,w:0,h:0,color:color,size:size,fill:fillOn}; items.push(cur); }
  }
  function move(e){ var p=pos(e);
    if(tool==='select'&&resizing&&sel!=null&&sel>=0&&items[sel]){ var rt=items[sel]; rt.w=Math.max(80,Math.min((W||1200)-rt.x-8,p.x-rt.x)); redraw(); liveOne(items[sel],sel); return; }
    if(tool==='select'&&sel!=null&&sel>=0&&dragOff){ var o=dragOff.orig; items[sel]=JSON.parse(JSON.stringify(o)); shift(items[sel],p.x-dragOff.x,p.y-dragOff.y); snapDrag(); redraw(); liveOne(items[sel],sel); return; }
    if(!drawing||!cur)return; if(cur.points){ var lp=cur.points[cur.points.length-1]; if(!lp||Math.hypot(p.x-lp.x,p.y-lp.y)>=2) cur.points.push(p); } else{ cur.w=p.x-startPt.x; cur.h=p.y-startPt.y; } redraw(); liveOne(cur, items.indexOf(cur));
  }
  function up(){ if(resizing){ resizing=false; broadcast(); redraw(); return; } if(tool==='select'&&dragOff){ dragOff=null; guides=[]; broadcast(); redraw(); } if(drawing){ drawing=false; if(cur&&!cur.points&&Math.abs(cur.w||0)<3&&Math.abs(cur.h||0)<3){ items.pop(); redraw(); } cur=null; broadcast(); } }
  function placeText(x,y,bullet){
    var ex=$('#gmr-wb-textarea'); if(ex)ex.remove();
    var ta=document.createElement('textarea'); ta.id='gmr-wb-textarea';
    var fs=fontPx; var boxW=Math.max(140,Math.min(440,(W?W-x-24:320)));
    ta.style.left=(OX+x*S)+'px'; ta.style.top=(OY+(y-fs*0.9)*S)+'px'; ta.style.color=color; ta.style.fontSize=(fs*S)+'px'; ta.style.width=(boxW*S)+'px'; ta.style.fontFamily='Inter,sans-serif'; ta.style.fontWeight='600'; ta.style.whiteSpace='pre-wrap'; ta.rows=1;
    ta.placeholder=bullet?'Madde yaz · Enter bitirir · Shift+Enter alt madde':'Metin · kutuya sığar, sağ kenardan boyutlandır · Enter bitirir';
    wrap.appendChild(ta); ta.focus();
    // Canlı taslak: öğrenci Enter'ı beklemeden, sen yazdıkça görsün (#5)
    var di={type:'text',x:x,y:y,lines:[''],color:color,size:fs,w:boxW,u:underlineOn,_draft:true};
    items.push(di); editingItem=di; var liveBc=throttle(broadcast,150);
    function parse(){ var lines=(ta.value||'').split('\n'); if(bullet)lines=lines.map(function(l){return l.trim()?'•  '+l:l;}); return lines; }
    function dropDraft(){ var ix=items.indexOf(di); if(ix>=0)items.splice(ix,1); }
    function commit(){ editingItem=null; var v=(ta.value||'').replace(/\s+$/,''); if(v){ delete di._draft; di.lines=parse(); sel=null; } else { dropDraft(); } redraw(); broadcast(); ta.remove(); }
    ta.addEventListener('blur',commit);
    ta.addEventListener('input',function(){ ta.style.height='auto'; ta.style.height=ta.scrollHeight+'px'; di.lines=parse(); redraw(); liveBc(); });
    ta.addEventListener('keydown',function(e){ if(e.key==='Escape'){ editingItem=null; ta.removeEventListener('blur',commit); dropDraft(); redraw(); broadcast(); ta.remove(); } else if(e.key==='Enter'&&!e.shiftKey){ e.preventDefault(); ta.blur(); } });
  }
  function editText(idx){
    var it=items[idx]; if(!it||it.type!=='text')return;
    editingItem=it;
    var ex=$('#gmr-wb-textarea'); if(ex)ex.remove();
    var fs=it.size||24, boxW=it.w||Math.min(600,Math.round(bbox(it).w||0)||260), ta=document.createElement('textarea'); ta.id='gmr-wb-textarea';
    ta.style.left=(OX+it.x*S)+'px'; ta.style.top=(OY+(it.y-fs*0.9)*S)+'px'; ta.style.color=it.color; ta.style.fontSize=(fs*S)+'px'; ta.style.width=(boxW*S)+'px'; ta.style.fontFamily='Inter,sans-serif'; ta.style.fontWeight='600'; ta.style.whiteSpace='pre-wrap';
    var lines=it.lines||[it.text||''];
    var isBullet=lines.some(function(l){return /^•\s/.test(l);});
    ta.value=lines.map(function(l){return l.replace(/^•\s+/,'');}).join('\n');
    wrap.appendChild(ta); ta.focus(); ta.select(); ta.style.height='auto'; ta.style.height=ta.scrollHeight+'px';
    var liveBc=throttle(broadcast,150);
    function parse(){ var ls=(ta.value||'').split('\n'); if(isBullet)ls=ls.map(function(l){return l.trim()?'•  '+l:l;}); return ls; }
    function commit(){ editingItem=null; var v=(ta.value||'').replace(/\s+$/,''); if(v){ items[idx].lines=parse(); items[idx].w=boxW; delete items[idx].text; } else { items.splice(idx,1); sel=null; } redraw(); broadcast(); ta.remove(); }
    ta.addEventListener('blur',commit);
    // Canlı düzenleme: değişiklik öğrenciye anında yansısın (#5)
    ta.addEventListener('input',function(){ ta.style.height='auto'; ta.style.height=ta.scrollHeight+'px'; if(items[idx]){ items[idx].lines=parse(); items[idx].w=boxW; delete items[idx].text; redraw(); liveBc(); } });
    ta.addEventListener('keydown',function(e){ if(e.key==='Escape'){ editingItem=null; ta.removeEventListener('blur',commit); ta.remove(); } else if(e.key==='Enter'&&!e.shiftKey){ e.preventDefault(); ta.blur(); } });
  }
  function onImage(e){ var f=e.target.files[0]; if(!f)return; e.target.value='';
    // Görseli Supabase Storage'a yükle, src'ye public URL koy — base64 gömme YOK (senkron paketi 15KB'yi aşıp tahtayı kalıcı bozardı).
    if(!STATE.supabase){ toast('Görsel eklemek için giriş yapmış olmalısın.'); return; }
    toast('Görsel yükleniyor…');
    var ext=((((f.type||'image/png').split('/')[1])||'png').replace(/[^a-z0-9]/gi,'')||'png');
    var path='wb/'+Date.now()+'-'+Math.floor(Math.random()*1e9)+'.'+ext;
    STATE.supabase.storage.from('grimeet-files').upload(path,f,{upsert:false,contentType:f.type||undefined}).then(function(res){
      if(res&&res.error){ toast('Görsel yüklenemedi.'); return; }
      var pub=STATE.supabase.storage.from('grimeet-files').getPublicUrl(path);
      var url=pub&&pub.data&&pub.data.publicUrl; if(!url){ toast('Görsel URL alınamadı.'); return; }
      var img=new Image(); img.onload=function(){ var mw=Math.min(340,img.width),ratio=img.height/img.width; items.push({type:'img',x:W/2-mw/2,y:H/2-mw*ratio/2,w:mw,h:mw*ratio,src:url,_img:img}); redraw(); broadcast(); }; img.src=url;
    }).catch(function(){ toast('Görsel yüklenemedi.'); });
  }
  function arrowHead(tipx,tipy,ang,sz){ var L=9+(sz||3)*2.4, w=0.42; ctx.beginPath(); ctx.moveTo(tipx,tipy); ctx.lineTo(tipx-L*Math.cos(ang-w),tipy-L*Math.sin(ang-w)); ctx.lineTo(tipx-L*Math.cos(ang)*0.72,tipy-L*Math.sin(ang)*0.72); ctx.lineTo(tipx-L*Math.cos(ang+w),tipy-L*Math.sin(ang+w)); ctx.closePath(); ctx.fill(); }
  function drawItem(it){
    ctx.save(); ctx.globalAlpha=it.alpha||1; ctx.strokeStyle=it.color; ctx.fillStyle=it.color; ctx.lineWidth=it.size||3; ctx.lineCap='round'; ctx.lineJoin='round';
    if(it.type==='pen'||it.type==='highlighter'||it.type==='eraser'){ ctx.beginPath(); it.points.forEach(function(p,i){ i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y); }); ctx.stroke(); }
    else if(it.type==='line'){ ctx.beginPath(); ctx.moveTo(it.x,it.y); ctx.lineTo(it.x+it.w,it.y+it.h); ctx.stroke(); }
    else if(it.type==='arrow'){ var ang=Math.atan2(it.h,it.w),hl=(9+(it.size||3)*2.4)*0.72; ctx.beginPath(); ctx.moveTo(it.x,it.y); ctx.lineTo(it.x+it.w-hl*Math.cos(ang),it.y+it.h-hl*Math.sin(ang)); ctx.stroke(); arrowHead(it.x+it.w,it.y+it.h,ang,it.size); }
    else if(it.type==='carrow'){ var ex=it.x+it.w,ey=it.y+it.h,mx=it.x+it.w/2,my=it.y+it.h/2,len=Math.max(1,Math.sqrt(it.w*it.w+it.h*it.h)),bs=(it.bend==null?0.3:it.bend),px=-it.h/len,py=it.w/len,cx=mx+px*len*bs,cy=my+py*len*bs; var a2=Math.atan2(ey-cy,ex-cx),hl2=(9+(it.size||3)*2.4)*0.72; ctx.beginPath(); ctx.moveTo(it.x,it.y); ctx.quadraticCurveTo(cx,cy,ex-hl2*Math.cos(a2),ey-hl2*Math.sin(a2)); ctx.stroke(); arrowHead(ex,ey,a2,it.size); }
    else if(it.type==='rect'){ ctx.beginPath(); ctx.rect(it.x,it.y,it.w,it.h); shapeFill(it); ctx.stroke(); }
    else if(it.type==='ellipse'){ ctx.beginPath(); ctx.ellipse(it.x+it.w/2,it.y+it.h/2,Math.abs(it.w/2),Math.abs(it.h/2),0,0,7); shapeFill(it); ctx.stroke(); }
    else if(it.type==='triangle'){ ctx.beginPath(); ctx.moveTo(it.x+it.w/2,it.y); ctx.lineTo(it.x,it.y+it.h); ctx.lineTo(it.x+it.w,it.y+it.h); ctx.closePath(); shapeFill(it); ctx.stroke(); }
    else if(it.type==='diamond'){ ctx.beginPath(); ctx.moveTo(it.x+it.w/2,it.y); ctx.lineTo(it.x+it.w,it.y+it.h/2); ctx.lineTo(it.x+it.w/2,it.y+it.h); ctx.lineTo(it.x,it.y+it.h/2); ctx.closePath(); shapeFill(it); ctx.stroke(); }
    else if(it.type==='star'){ var scx=it.x+it.w/2,scy=it.y+it.h/2,srx=Math.abs(it.w/2),sry=Math.abs(it.h/2); ctx.beginPath(); for(var si=0;si<10;si++){ var sa=-Math.PI/2+si*Math.PI/5,rr=(si%2===0)?1:0.42,spx=scx+Math.cos(sa)*srx*rr,spy=scy+Math.sin(sa)*sry*rr; si?ctx.lineTo(spx,spy):ctx.moveTo(spx,spy); } ctx.closePath(); shapeFill(it); ctx.stroke(); }
    else if(it.type==='text'){ ctx.font=wbFont(it.size); ctx.textBaseline='alphabetic'; var dl=textLines(it); dl.forEach(function(l,i){ var ly=it.y+i*it.size*1.25; ctx.fillText(l,it.x,ly); if(it.u&&l){ var _tw=ctx.measureText(l).width; ctx.save(); ctx.strokeStyle=it.color; ctx.lineWidth=Math.max(1,it.size*0.07); ctx.beginPath(); var _uy=ly+it.size*0.18; ctx.moveTo(it.x,_uy); ctx.lineTo(it.x+_tw,_uy); ctx.stroke(); ctx.restore(); } }); }
    else if(it.type==='img'){ var im=it._img; if(!im){ im=new Image(); im.onload=redraw; im.src=it.src; it._img=im; } if(im.complete)ctx.drawImage(im,it.x,it.y,it.w,it.h); }
    ctx.restore();
  }
  function redraw(){ if(!ctx)return; ctx.setTransform(1,0,0,1,0,0); ctx.clearRect(0,0,cv.width,cv.height); ctx.setTransform(dpr,0,0,dpr,0,0); ctx.fillStyle=lbColor(); ctx.fillRect(0,0,cv.width/dpr,cv.height/dpr); ctx.setTransform(dpr*S,0,0,dpr*S,dpr*OX,dpr*OY); ctx.fillStyle=BOARD_BG; ctx.fillRect(0,0,BW,BH); ctx.save(); ctx.strokeStyle='rgba(0,0,0,.10)'; ctx.lineWidth=1; ctx.strokeRect(0.5,0.5,BW-1,BH-1); ctx.restore(); items.forEach(drawItem); if(sel!=null&&sel>=0&&items[sel]){ var b=bbox(items[sel]); ctx.save(); ctx.strokeStyle='#2E6E6A'; ctx.setLineDash([6,4]); ctx.lineWidth=1.5; ctx.strokeRect(b.x-6,b.y-6,b.w+12,b.h+12); if(items[sel].type==='text'){ ctx.setLineDash([]); ctx.fillStyle='#2E6E6A'; ctx.beginPath(); ctx.arc(b.x+b.w+6,b.y+b.h/2,5,0,7); ctx.fill(); } ctx.restore(); }
    if(guides&&guides.length){ ctx.save(); ctx.strokeStyle='#E0567A'; ctx.lineWidth=1; ctx.setLineDash([5,4]); guides.forEach(function(g){ ctx.beginPath(); if(g.o==='v'){ ctx.moveTo(g.pos,0); ctx.lineTo(g.pos,BH); } else { ctx.moveTo(0,g.pos); ctx.lineTo(BW,g.pos); } ctx.stroke(); }); ctx.restore(); }
    fontLabel(); updateWordCount(); syncUlBtn(); }
  function broadcast(){ if(!_restoring){ var s=wbSnap(); if(_committed!=null&&_committed!==s){ _hist.push(_committed); if(_hist.length>60)_hist.shift(); _redo.length=0; } _committed=s; } sendData({t:'wb',items:items.map(strip),page:pageIx,np:pages.length}); }
  function applyRemote(msg){ if(!msg.items)return; var pg=(typeof msg.page==='number')?msg.page:pageIx; if(msg.np) ensurePages(msg.np); ensurePages(pg+1); pages[pg]=msg.items; rehydrate(pages[pg]); if(pg===pageIx){ items=pages[pageIx]; wbResetHist(); redraw(); } updatePageUI(); }
  /* Faz0: mid-stroke tek-öğe canlı güncelleme — idx'e upsert; tam 'wb' broadcast (up) sonra kesin reconcile eder. */
  function applyLive(msg){ if(!msg||!msg.item)return; var pg=(typeof msg.page==='number')?msg.page:pageIx; if(msg.np) ensurePages(msg.np); ensurePages(pg+1); var arr=pages[pg]; var idx=(typeof msg.idx==='number'&&msg.idx>=0)?msg.idx:arr.length; arr[idx]=msg.item; if(msg.item.type==='img') rehydrate([arr[idx]]); if(pg===pageIx){ items=pages[pageIx]; redraw(); } }
  return {init:init,resize:resize,applyRemote:applyRemote,applyLive:applyLive,applyNav:applyNav,broadcastAllPages:broadcastAllPages,pageIndex:function(){return pageIx;},pageCount:function(){return pages.length;},getCanvas:function(){return cv;},items:function(){return items.map(strip);}};
})();

/* ================= ANNOTATION OVERLAY (materyal üstü çizim) ================= */
/* ANNO — paylaşılan içerik (materyal/YouTube/ekran) üstü çizim.
   WB ile AYNI tam araç seti (şekil/ok/metin/madde/seçim/boyut/geri-al) ama
   ŞEFFAF overlay: arka plan doldurmaz, silgi destination-out. Koordinatlar
   0-1 normalize saklanır → farklı ekran boyutlarında hizalı görünür. */
var ANNO=(function(){
  var cv,ctx,wrap,W=0,H=0,dpr=1,tool='pen',color='#d64545',size=4,fontPx=30;
  var FONT_MIN=12,FONT_MAX=120,FONT_STEP=6;
  var items=[],drawing=false,cur=null,startPt=null,sel=null,dragOff=null,underlineOn=false;
  var liveBc=throttle(broadcast,50); /* #4 materyal-üstü çizim de mid-stroke canlı senkronlanır (up()'ta kesin gönderim) */
  /* Faz0: mid-stroke'ta tüm diziyi değil YALNIZ aktif öğeyi yolla (paket sabit/küçük; 15KB aşımı+jank çözümü). */
  var liveOne=throttle(function(it,idx){ if(!it)return; try{ sendData({t:'anno-live',item:it,idx:idx}); }catch(_){} },50);
  var COLORS=['#d64545','#2E6E6A','#2E5E8A','#B78A2E','#7E3A56','#1b1b1b','#ffffff'];
  function init(){
    cv=$('#anno-canvas'); if(!cv)return; ctx=cv.getContext('2d'); wrap=cv.parentElement;
    var cc=$('#anno-colors'); if(cc){ COLORS.forEach(function(c,i){ var b=document.createElement('button'); b.style.background=c; if(i===0)b.classList.add('on'); b.dataset.color=c; cc.appendChild(b); });
      cc.addEventListener('click',function(e){ var b=e.target.closest('[data-color]'); if(!b)return; color=b.dataset.color; $$('#anno-colors button').forEach(function(x){x.classList.remove('on');}); b.classList.add('on'); }); }
    $$('.anno-tool[data-atool]').forEach(function(b){ b.addEventListener('click',function(){ tool=b.dataset.atool; $$('.anno-tool[data-atool]').forEach(function(x){x.classList.remove('active');}); b.classList.add('active'); cv.style.cursor=(tool==='select')?'move':((tool==='text'||tool==='bullet')?'text':'crosshair'); try{ PDFHL.syncActive(); }catch(e){} }); });
    var sz=$('#anno-size'); if(sz)sz.addEventListener('input',function(){ size=parseInt(this.value,10); });
    var fd=$('#anno-font-dec'); if(fd)fd.addEventListener('click',function(){ bumpFont(-1); });
    var fi=$('#anno-font-inc'); if(fi)fi.addEventListener('click',function(){ bumpFont(1); });
    var un=$('#anno-undo'); if(un)un.addEventListener('click',function(){ items.pop(); sel=null; redraw(); broadcast(); });
    var _aul=$('#anno-underline'); if(_aul)_aul.addEventListener('click',function(){ var it=(sel!=null&&sel>=0&&items[sel]&&items[sel].type==='text')?items[sel]:null; if(it){ it.u=!it.u; this.classList.toggle('on',!!it.u); redraw(); broadcast(); } else { underlineOn=!underlineOn; this.classList.toggle('on',underlineOn); try{ toast(underlineOn?'Altı çizili metin açık — yeni metinler altı çizili':'Altı çizili kapalı'); }catch(e){} } });
    var cl=$('#anno-clear'); if(cl)cl.addEventListener('click',function(){ items=[]; sel=null; redraw(); broadcast(); try{ if(STATE.currentMaterial&&STATE.currentMaterial.kind==='file') PDFHL.reset(true); }catch(e){} });
    cv.addEventListener('pointerdown',down); cv.addEventListener('pointermove',move); window.addEventListener('pointerup',up);
    cv.addEventListener('dblclick',function(e){ var p=pxpos(e); var i=hit(p); if(i>=0&&items[i]&&items[i].type==='text') editText(i); });
    bindBarDrag();
    if(window.ResizeObserver){ try{ new ResizeObserver(function(){ resize(); }).observe(wrap||cv); }catch(e){} }
    window.addEventListener('resize',resize); resize();
  }
  function bumpFont(dir){ fontPx=Math.min(FONT_MAX,Math.max(FONT_MIN,fontPx+dir*FONT_STEP)); var el=$('#anno-fontpx'); if(el)el.textContent=fontPx; }
  // Araç çubuğunu sürükle: video/materyalin üstünü kapatmasın (#7). Konum host'a özel (UI), yayınlanmaz.
  function bindBarDrag(){ var bar=$('#anno-bar'), grip=$('#anno-drag'), host=wrap||cv.parentElement; if(!bar||!grip||!host)return;
    var dragging=false,sx=0,sy=0,bl=0,bt=0;
    function clamp(){ var hr=host.getBoundingClientRect(),br=bar.getBoundingClientRect(); var maxL=Math.max(0,hr.width-br.width),maxT=Math.max(0,hr.height-br.height); bl=Math.min(maxL,Math.max(0,bl)); bt=Math.min(maxT,Math.max(0,bt)); bar.style.left=bl+'px'; bar.style.top=bt+'px'; }
    grip.addEventListener('pointerdown',function(e){ e.preventDefault(); var hr=host.getBoundingClientRect(),br=bar.getBoundingClientRect(); bl=br.left-hr.left; bt=br.top-hr.top; bar.classList.add('moved','dragging'); bar.style.left=bl+'px'; bar.style.top=bt+'px'; dragging=true; sx=e.clientX; sy=e.clientY; try{grip.setPointerCapture(e.pointerId);}catch(_){} });
    grip.addEventListener('pointermove',function(e){ if(!dragging)return; bl+=(e.clientX-sx); bt+=(e.clientY-sy); sx=e.clientX; sy=e.clientY; clamp(); });
    grip.addEventListener('pointerup',function(e){ if(!dragging)return; dragging=false; bar.classList.remove('dragging'); try{grip.releasePointerCapture(e.pointerId);}catch(_){} });
    // Çift tıkla: köşeye topla (sağ-üst)
    grip.addEventListener('dblclick',function(){ bar.classList.add('moved'); var hr=host.getBoundingClientRect(),br=bar.getBoundingClientRect(); bl=hr.width-br.width-12; bt=12; clamp(); });
  }
  function resize(){ if(!cv)return; var host=wrap||cv.parentElement; if(!host)return; var w=Math.max(0,host.clientWidth-28), h=Math.max(0,host.clientHeight-28); if(!w||!h)return; dpr=window.devicePixelRatio||1; cv.style.width=w+'px'; cv.style.height=h+'px'; cv.width=Math.round(w*dpr); cv.height=Math.round(h*dpr); W=w;H=h; ctx.setTransform(dpr,0,0,dpr,0,0); redraw(); }
  /* normalize (0-1) <-> piksel */
  function pos(e){ var r=cv.getBoundingClientRect(); return {x:(e.clientX-r.left)/r.width, y:(e.clientY-r.top)/r.height}; }
  function pxpos(e){ var r=cv.getBoundingClientRect(); return {x:(e.clientX-r.left)/r.width*W, y:(e.clientY-r.top)/r.height*H}; }
  function P(p){ return {x:p.x*W,y:p.y*H}; }  /* norm→px */
  function N(x,y){ return {x:x/W,y:y/H}; }     /* px→norm */
  function shift(it,dx,dy){ dx/=W; dy/=H; if(it.points)it.points.forEach(function(p){p.x+=dx;p.y+=dy;}); else{ it.x+=dx; it.y+=dy; } }
  function bbox(it){ if(it.points){ var xs=it.points.map(function(p){return p.x*W;}),ys=it.points.map(function(p){return p.y*H;}); return {x:Math.min.apply(0,xs),y:Math.min.apply(0,ys),w:Math.max.apply(0,xs)-Math.min.apply(0,xs),h:Math.max.apply(0,ys)-Math.min.apply(0,ys)}; } if(it.type==='text'){ var lines=it.lines||[it.text||'']; var mw=0; lines.forEach(function(l){ mw=Math.max(mw,(l||'').length); }); var fp=it.size||fontPx; return {x:it.x*W,y:it.y*H-fp,w:mw*fp*0.56,h:lines.length*fp*1.25}; } var x=it.x*W,y=it.y*H,w=it.w*W,h=it.h*H; return {x:Math.min(x,x+w),y:Math.min(y,y+h),w:Math.abs(w),h:Math.abs(h)}; }
  function hit(pt){ for(var i=items.length-1;i>=0;i--){ var b=bbox(items[i]); if(pt.x>=b.x-6&&pt.x<=b.x+b.w+6&&pt.y>=b.y-6&&pt.y<=b.y+b.h+6)return i; } return -1; }
  function down(e){ e.preventDefault(); if(!W||!H){ resize(); if(!W||!H)return; } var p=pos(e), pp=P(p);
    if(tool==='select'){ sel=hit(pp); if(sel>=0)dragOff={x:pp.x,y:pp.y,orig:JSON.parse(JSON.stringify(items[sel]))}; redraw(); return; }
    if(tool==='text'||tool==='bullet'){ placeText(p,tool==='bullet'); return; }
    drawing=true; startPt=p;
    if(tool==='pen'||tool==='highlighter'||tool==='eraser'){ cur={type:tool,color:color,size:(tool==='highlighter'?size*3:(tool==='eraser'?size*4:size))/1000,alpha:tool==='highlighter'?0.35:1,points:[p]}; items.push(cur); }
    else { cur={type:tool,x:p.x,y:p.y,w:0,h:0,color:color,size:size}; items.push(cur); }
  }
  function move(e){ var p=pos(e),pp=P(p);
    if(tool==='select'&&sel!=null&&sel>=0&&dragOff){ items[sel]=JSON.parse(JSON.stringify(dragOff.orig)); shift(items[sel],pp.x-dragOff.x,pp.y-dragOff.y); redraw(); liveOne(items[sel],sel); return; }
    if(!drawing||!cur)return; if(cur.points){ var lp=cur.points[cur.points.length-1]; if(!lp||Math.hypot((p.x-lp.x)*W,(p.y-lp.y)*H)>=2) cur.points.push(p); } else{ cur.w=p.x-startPt.x; cur.h=p.y-startPt.y; } redraw(); liveOne(cur, items.indexOf(cur));
  }
  function up(){ if(tool==='select'&&dragOff){ dragOff=null; broadcast(); redraw(); } if(drawing){ drawing=false; cur=null; broadcast(); } }
  function placeText(p,bullet){
    var ex=document.getElementById('anno-textarea'); if(ex)ex.remove();
    var ox=cv.offsetLeft||0, oy=cv.offsetTop||0, px=p.x*W+ox, py=p.y*H+oy, ta=document.createElement('textarea'); ta.id='anno-textarea'; ta.className='gmr-anno-ta';
    ta.style.left=px+'px'; ta.style.top=(py-fontPx*0.9)+'px'; ta.style.color=color; ta.style.fontSize=fontPx+'px'; ta.rows=1;
    ta.placeholder=bullet?'Madde · Enter bitirir':'Metin · Enter bitirir';
    wrap.appendChild(ta); ta.focus();
    function commit(){ var v=(ta.value||'').replace(/\s+$/,''); if(v){ var lines=v.split('\n'); if(bullet)lines=lines.map(function(l){return l.trim()?'•  '+l:l;}); items.push({type:'text',x:p.x,y:p.y,lines:lines,color:color,size:fontPx,u:underlineOn}); redraw(); broadcast(); } ta.remove(); }
    ta.addEventListener('blur',commit);
    ta.addEventListener('input',function(){ ta.style.height='auto'; ta.style.height=ta.scrollHeight+'px'; });
    ta.addEventListener('keydown',function(e){ if(e.key==='Escape'){ ta.value=''; ta.blur(); } else if(e.key==='Enter'&&!e.shiftKey){ e.preventDefault(); ta.blur(); } });
  }
  function editText(idx){ var it=items[idx]; if(!it||it.type!=='text')return; var ex=document.getElementById('anno-textarea'); if(ex)ex.remove();
    var fp=it.size||fontPx, ox=cv.offsetLeft||0, oy=cv.offsetTop||0, ta=document.createElement('textarea'); ta.id='anno-textarea'; ta.className='gmr-anno-ta';
    ta.style.left=(it.x*W+ox)+'px'; ta.style.top=(it.y*H+oy-fp*0.9)+'px'; ta.style.color=it.color; ta.style.fontSize=fp+'px';
    var lines=it.lines||[it.text||'']; var isB=lines.some(function(l){return /^•\s/.test(l);}); ta.value=lines.map(function(l){return l.replace(/^•\s+/,'');}).join('\n');
    wrap.appendChild(ta); ta.focus(); ta.select(); ta.style.height='auto'; ta.style.height=ta.scrollHeight+'px';
    function commit(){ var v=(ta.value||'').replace(/\s+$/,''); if(v){ var ls=v.split('\n'); if(isB)ls=ls.map(function(l){return l.trim()?'•  '+l:l;}); items[idx].lines=ls; delete items[idx].text; } else { items.splice(idx,1); sel=null; } redraw(); broadcast(); ta.remove(); }
    ta.addEventListener('blur',commit);
    ta.addEventListener('input',function(){ ta.style.height='auto'; ta.style.height=ta.scrollHeight+'px'; });
    ta.addEventListener('keydown',function(e){ if(e.key==='Escape'){ ta.removeEventListener('blur',commit); ta.remove(); } else if(e.key==='Enter'&&!e.shiftKey){ e.preventDefault(); ta.blur(); } });
  }
  function arrowHead(tipx,tipy,ang,sz){ var L=9+(sz||3)*2.4, w=0.42; ctx.beginPath(); ctx.moveTo(tipx,tipy); ctx.lineTo(tipx-L*Math.cos(ang-w),tipy-L*Math.sin(ang-w)); ctx.lineTo(tipx-L*Math.cos(ang)*0.72,tipy-L*Math.sin(ang)*0.72); ctx.lineTo(tipx-L*Math.cos(ang+w),tipy-L*Math.sin(ang+w)); ctx.closePath(); ctx.fill(); }
  function drawItem(it){
    ctx.save();
    if(it.type==='eraser'){ ctx.globalCompositeOperation='destination-out'; ctx.strokeStyle='rgba(0,0,0,1)'; ctx.lineWidth=Math.max(1,(it.size||0.003)*W); ctx.lineCap='round'; ctx.lineJoin='round'; ctx.beginPath(); it.points.forEach(function(p,i){ var q=P(p); i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y); }); ctx.stroke(); ctx.restore(); return; }
    ctx.globalAlpha=it.alpha||1; ctx.strokeStyle=it.color; ctx.fillStyle=it.color; ctx.lineCap='round'; ctx.lineJoin='round';
    if(it.type==='pen'||it.type==='highlighter'){ ctx.lineWidth=Math.max(1,(it.size||0.003)*W); ctx.beginPath(); it.points.forEach(function(p,i){ var q=P(p); i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y); }); ctx.stroke(); }
    else { ctx.lineWidth=it.size||3; var x=it.x*W,y=it.y*H,w=(it.w||0)*W,h=(it.h||0)*H;
      if(it.type==='line'){ ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x+w,y+h); ctx.stroke(); }
      else if(it.type==='arrow'){ var ang=Math.atan2(h,w),hl=(9+(it.size||3)*2.4)*0.72; ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x+w-hl*Math.cos(ang),y+h-hl*Math.sin(ang)); ctx.stroke(); arrowHead(x+w,y+h,ang,it.size); }
      else if(it.type==='carrow'){ var ex=x+w,ey=y+h,mx=x+w/2,my=y+h/2,len=Math.max(1,Math.sqrt(w*w+h*h)),bs=0.3,px=-h/len,py=w/len,cx=mx+px*len*bs,cy=my+py*len*bs,a2=Math.atan2(ey-cy,ex-cx),hl2=(9+(it.size||3)*2.4)*0.72; ctx.beginPath(); ctx.moveTo(x,y); ctx.quadraticCurveTo(cx,cy,ex-hl2*Math.cos(a2),ey-hl2*Math.sin(a2)); ctx.stroke(); arrowHead(ex,ey,a2,it.size); }
      else if(it.type==='rect'){ ctx.strokeRect(x,y,w,h); }
      else if(it.type==='ellipse'){ ctx.beginPath(); ctx.ellipse(x+w/2,y+h/2,Math.abs(w/2),Math.abs(h/2),0,0,7); ctx.stroke(); }
      else if(it.type==='triangle'){ ctx.beginPath(); ctx.moveTo(x+w/2,y); ctx.lineTo(x,y+h); ctx.lineTo(x+w,y+h); ctx.closePath(); ctx.stroke(); }
      else if(it.type==='diamond'){ ctx.beginPath(); ctx.moveTo(x+w/2,y); ctx.lineTo(x+w,y+h/2); ctx.lineTo(x+w/2,y+h); ctx.lineTo(x,y+h/2); ctx.closePath(); ctx.stroke(); }
      else if(it.type==='star'){ var scx=x+w/2,scy=y+h/2,srx=Math.abs(w/2),sry=Math.abs(h/2); ctx.beginPath(); for(var si=0;si<10;si++){ var sa=-Math.PI/2+si*Math.PI/5,rr=(si%2===0)?1:0.42,spx=scx+Math.cos(sa)*srx*rr,spy=scy+Math.sin(sa)*sry*rr; si?ctx.lineTo(spx,spy):ctx.moveTo(spx,spy); } ctx.closePath(); ctx.stroke(); }
      else if(it.type==='text'){ var fp=it.size||fontPx; ctx.font='600 '+fp+'px Inter,sans-serif'; ctx.textBaseline='alphabetic'; var lines=it.lines||[it.text||'']; lines.forEach(function(l,i){ var ly=y+i*fp*1.25; ctx.fillText(l,x,ly); if(it.u&&l){ var tw=ctx.measureText(l).width; ctx.save(); ctx.strokeStyle=it.color; ctx.lineWidth=Math.max(1,fp*0.06); ctx.beginPath(); ctx.moveTo(x,ly+fp*0.12); ctx.lineTo(x+tw,ly+fp*0.12); ctx.stroke(); ctx.restore(); } }); }
    }
    ctx.restore();
  }
  function redraw(){ if(!ctx)return; ctx.clearRect(0,0,W,H); items.forEach(drawItem); if(sel!=null&&sel>=0&&items[sel]){ var b=bbox(items[sel]); ctx.save(); ctx.strokeStyle='#2E6E6A'; ctx.setLineDash([6,4]); ctx.lineWidth=1.5; ctx.strokeRect(b.x-6,b.y-6,b.w+12,b.h+12); ctx.restore(); } }
  function broadcast(){ sendData({t:'anno',items:items}); }
  function applyRemote(msg){ var it=(msg&&msg.items)?msg.items:(Array.isArray(msg)?msg:(msg&&msg.strokes)); if(!it)return; items=it; resize();
    // Materyal paneli o an görünür/ölçülü değilse (geç-katılım ya da öğrenci materyali daha yeni açıyorsa)
    // W/H=0 kalır ve çizim boş görünür. Bir sonraki karede yeniden ölçüp çiz → öğrencide anında belirir (#108).
    if(!W||!H){ try{ requestAnimationFrame(function(){ resize(); }); }catch(e){ setTimeout(resize,60); } }
    else redraw(); }
  /* Faz0: mid-stroke tek-öğe canlı güncelleme — idx'e upsert; tam 'anno' broadcast (up) sonra reconcile eder. */
  function applyLive(msg){ if(!msg||!msg.item)return; var idx=(typeof msg.idx==='number'&&msg.idx>=0)?msg.idx:items.length; items[idx]=msg.item; if(!W||!H){ try{ requestAnimationFrame(function(){ resize(); }); }catch(e){} } else redraw(); }
  function reset(bc){ items=[]; sel=null; redraw(); if(bc)broadcast(); }
  return {init:init,resize:resize,applyRemote:applyRemote,applyLive:applyLive,reset:reset,items:function(){return items;},broadcast:broadcast,currentTool:function(){return tool;},currentColor:function(){return color;},currentSize:function(){return size;}};
})();

/* ============ YAZI TAHTASI ÇİZİM KATMANI (DOC overlay: ok/şekil/kalem) ============
   Doc workspace'in üstünde şeffaf canvas; "Çiz" modunda pointer'ı yakalar, kapalıyken
   yazmaya izin verir. Koordinatlar 0-1 normalize; herkes çizebilir, {t:'doc-draw'} ile senkron. */
var DOCDRAW=(function(){
  var cv,ctx,wrap,W=0,H=0,dpr=1,tool='pen',color='#d64545',size=4,fontPx=26,on=false;
  var items=[],drawing=false,cur=null,startPt=null;
  var COLORS=['#d64545','#2E6E6A','#2E5E8A','#B78A2E','#7E3A56','#1b1b1b','#ffffff'];
  var liveBc=throttle(function(){ broadcast(); },60);
  function init(){
    cv=document.getElementById('docdraw-canvas'); if(!cv)return; ctx=cv.getContext('2d'); wrap=document.getElementById('doc-workspace');
    var cc=document.getElementById('docdraw-colors'); if(cc){ COLORS.forEach(function(c,i){ var b=document.createElement('button'); b.type='button'; b.style.background=c; if(i===0)b.classList.add('on'); b.dataset.color=c; cc.appendChild(b); });
      cc.addEventListener('click',function(e){ var b=e.target.closest('[data-color]'); if(!b)return; color=b.dataset.color; cc.querySelectorAll('button').forEach(function(x){x.classList.remove('on');}); b.classList.add('on'); }); }
    $$('.docdraw-tool[data-ddtool]').forEach(function(b){ b.addEventListener('click',function(){ tool=b.dataset.ddtool; $$('.docdraw-tool[data-ddtool]').forEach(function(x){x.classList.remove('active');}); b.classList.add('active'); }); });
    var un=document.getElementById('docdraw-undo'); if(un)un.addEventListener('click',function(){ items.pop(); redraw(); broadcast(); });
    var cl=document.getElementById('docdraw-clear'); if(cl)cl.addEventListener('click',function(){ items=[]; redraw(); broadcast(); });
    var cls=document.getElementById('docdraw-close'); if(cls)cls.addEventListener('click',function(){ setOn(false); });
    var tg=document.getElementById('doc-draw-toggle'); if(tg)tg.addEventListener('click',toggle);
    cv.addEventListener('pointerdown',down); cv.addEventListener('pointermove',move); window.addEventListener('pointerup',up);
    if(window.ResizeObserver){ try{ new ResizeObserver(function(){ resize(); }).observe(wrap); }catch(e){} }
    window.addEventListener('resize',resize); resize();
  }
  function setOn(v){ on=!!v; if(wrap) wrap.classList.toggle('drawing',on); var bar=document.getElementById('docdraw-bar'); if(bar){ if(on) bar.removeAttribute('hidden'); else bar.setAttribute('hidden',''); } var tg=document.getElementById('doc-draw-toggle'); if(tg) tg.classList.toggle('on',on); if(on) resize(); }
  function toggle(){ setOn(!on); }
  function resize(){ if(!cv||!wrap)return; var r=wrap.getBoundingClientRect(); if(!r.width||!r.height)return; dpr=window.devicePixelRatio||1; W=r.width; H=r.height; cv.width=Math.round(W*dpr); cv.height=Math.round(H*dpr); cv.style.width=W+'px'; cv.style.height=H+'px'; redraw(); }
  function pos(e){ var r=cv.getBoundingClientRect(); return {x:(e.clientX-r.left)/(r.width||1), y:(e.clientY-r.top)/(r.height||1)}; }
  function P(p){ return {x:p.x*W, y:p.y*H}; }
  function down(e){ if(!on)return; e.preventDefault(); var p=pos(e);
    if(tool==='text'){ placeText(p); return; }
    drawing=true; startPt=p;
    if(tool==='pen'||tool==='highlighter'||tool==='eraser'){ cur={type:tool,color:color,size:(tool==='highlighter'?size*3:(tool==='eraser'?size*4:size))/1000,alpha:tool==='highlighter'?0.35:1,points:[p]}; items.push(cur); }
    else { cur={type:tool,x:p.x,y:p.y,w:0,h:0,color:color,size:size}; items.push(cur); }
  }
  function move(e){ if(!on||!drawing||!cur)return; var p=pos(e); if(cur.points){ var lp=cur.points[cur.points.length-1]; if(!lp||Math.hypot((p.x-lp.x)*W,(p.y-lp.y)*H)>=2) cur.points.push(p); } else { cur.w=p.x-startPt.x; cur.h=p.y-startPt.y; } redraw(); liveBc(); }
  function up(){ if(drawing){ drawing=false; cur=null; broadcast(); } }
  function placeText(p){ var v=window.prompt('Metin:'); if(v==null||!v.trim())return; items.push({type:'text',x:p.x,y:p.y,lines:String(v).split('\n'),color:color,size:fontPx}); redraw(); broadcast(); }
  function arrowHead(tx,ty,ang,sz){ var L=9+(sz||3)*2.4, w=0.42; ctx.beginPath(); ctx.moveTo(tx,ty); ctx.lineTo(tx-L*Math.cos(ang-w),ty-L*Math.sin(ang-w)); ctx.lineTo(tx-L*Math.cos(ang)*0.72,ty-L*Math.sin(ang)*0.72); ctx.lineTo(tx-L*Math.cos(ang+w),ty-L*Math.sin(ang+w)); ctx.closePath(); ctx.fill(); }
  function drawItem(it){ ctx.save();
    if(it.type==='eraser'){ ctx.globalCompositeOperation='destination-out'; ctx.strokeStyle='rgba(0,0,0,1)'; ctx.lineWidth=Math.max(1,(it.size||0.003)*W); ctx.lineCap='round'; ctx.lineJoin='round'; ctx.beginPath(); it.points.forEach(function(p,i){ var q=P(p); i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y); }); ctx.stroke(); ctx.restore(); return; }
    ctx.globalAlpha=it.alpha||1; ctx.strokeStyle=it.color; ctx.fillStyle=it.color; ctx.lineCap='round'; ctx.lineJoin='round';
    if(it.type==='pen'||it.type==='highlighter'){ ctx.lineWidth=Math.max(1,(it.size||0.003)*W); ctx.beginPath(); it.points.forEach(function(p,i){ var q=P(p); i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y); }); ctx.stroke(); }
    else { ctx.lineWidth=it.size||3; var x=it.x*W,y=it.y*H,w=(it.w||0)*W,h=(it.h||0)*H;
      if(it.type==='line'){ ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x+w,y+h); ctx.stroke(); }
      else if(it.type==='arrow'){ var ang=Math.atan2(h,w),hl=(9+(it.size||3)*2.4)*0.72; ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x+w-hl*Math.cos(ang),y+h-hl*Math.sin(ang)); ctx.stroke(); arrowHead(x+w,y+h,ang,it.size); }
      else if(it.type==='carrow'){ var ex=x+w,ey=y+h,mx=x+w/2,my=y+h/2,len=Math.max(1,Math.sqrt(w*w+h*h)),bs=0.3,pxx=-h/len,pyy=w/len,cx=mx+pxx*len*bs,cy=my+pyy*len*bs,a2=Math.atan2(ey-cy,ex-cx),hl2=(9+(it.size||3)*2.4)*0.72; ctx.beginPath(); ctx.moveTo(x,y); ctx.quadraticCurveTo(cx,cy,ex-hl2*Math.cos(a2),ey-hl2*Math.sin(a2)); ctx.stroke(); arrowHead(ex,ey,a2,it.size); }
      else if(it.type==='rect'){ ctx.strokeRect(x,y,w,h); }
      else if(it.type==='ellipse'){ ctx.beginPath(); ctx.ellipse(x+w/2,y+h/2,Math.abs(w/2),Math.abs(h/2),0,0,7); ctx.stroke(); }
      else if(it.type==='triangle'){ ctx.beginPath(); ctx.moveTo(x+w/2,y); ctx.lineTo(x,y+h); ctx.lineTo(x+w,y+h); ctx.closePath(); ctx.stroke(); }
      else if(it.type==='diamond'){ ctx.beginPath(); ctx.moveTo(x+w/2,y); ctx.lineTo(x+w,y+h/2); ctx.lineTo(x+w/2,y+h); ctx.lineTo(x,y+h/2); ctx.closePath(); ctx.stroke(); }
      else if(it.type==='star'){ var scx=x+w/2,scy=y+h/2,srx=Math.abs(w/2),sry=Math.abs(h/2); ctx.beginPath(); for(var si=0;si<10;si++){ var sa=-Math.PI/2+si*Math.PI/5,rr=(si%2===0)?1:0.42,spx=scx+Math.cos(sa)*srx*rr,spy=scy+Math.sin(sa)*sry*rr; si?ctx.lineTo(spx,spy):ctx.moveTo(spx,spy); } ctx.closePath(); ctx.stroke(); }
      else if(it.type==='text'){ var fp=it.size||fontPx; ctx.font='600 '+fp+'px Inter,sans-serif'; ctx.textBaseline='alphabetic'; (it.lines||[it.text||'']).forEach(function(l,i){ ctx.fillText(l,x,y+i*fp*1.25); }); }
    }
    ctx.restore();
  }
  function redraw(){ if(!ctx||!cv)return; ctx.setTransform(1,0,0,1,0,0); ctx.clearRect(0,0,cv.width,cv.height); ctx.setTransform(dpr,0,0,dpr,0,0); items.forEach(drawItem); }
  function broadcast(){ try{ sendData({t:'doc-draw',items:items}); }catch(e){} }
  function applyRemote(msg){ var it=(msg&&msg.items)?msg.items:(Array.isArray(msg)?msg:null); if(!it)return; items=it; if(!W||!H){ try{ requestAnimationFrame(resize); }catch(e){ setTimeout(resize,60); } } else redraw(); }
  return { init:init, setOn:setOn, toggle:toggle, isOn:function(){return on;}, applyRemote:applyRemote, resize:resize, items:function(){return items;}, setItems:function(a){ items=a||[]; redraw(); } };
})();

/* ================= REACTIONS ================= */
var REACTS=['👍','👎','👏','❤️','😄','😂','🤔','😮','😠','🔥','🎉','🙌','❓'];
function bindReactions(){
  var bar=$('#gmr-react-bar'); if(!bar)return;
  REACTS.forEach(function(e){ var b=document.createElement('button'); b.textContent=e; b.addEventListener('click',function(ev){ ev.stopPropagation(); floatReact(e); sendData({t:'react',e:e}); }); bar.appendChild(b); });
  $('#gmr-react-btn').addEventListener('click',function(ev){ ev.stopPropagation(); $('#gmr-react').classList.toggle('open'); });
  document.addEventListener('click',function(ev){ if(!ev.target.closest('#gmr-react')) $('#gmr-react').classList.remove('open'); });
}
function floatReact(e){ var layer=$('#gmr-react-layer'); if(!layer)return; var el=document.createElement('div'); el.className='gmr-float'; el.textContent=e; el.style.left=(8+Math.random()*76)+'%'; layer.appendChild(el); setTimeout(function(){ el.remove(); },2500); }

/* ================= HAND QUEUE (host) ================= */
function handQueueAdd(id,name){ if(!id||STATE.hands.some(function(h){return h.id===id;}))return; STATE.hands.push({id:id,name:name}); renderHandQueue(); }
function handQueueRemove(id){ STATE.hands=STATE.hands.filter(function(h){return h.id!==id;}); renderHandQueue(); }
function renderHandQueue(){ var el=$('#hand-queue'); if(!el)return; if(!STATE.hands.length){ el.innerHTML=''; return; } el.innerHTML='<div class="hq-h">Kaldırılan eller ('+STATE.hands.length+')</div>'+STATE.hands.map(function(h){ return '<div class="hq-item"><span class="hqn">✋ '+esc(h.name)+'</span><button data-lower="'+esc(h.id)+'">İndir</button></div>'; }).join(''); }

/* ================= NOTES ================= */
function bindNotes(){ var ta=$('#notes-ta'); if(!ta)return; var key='gm-notes-'+STATE.room; try{ ta.value=localStorage.getItem(key)||''; }catch(e){} ta.addEventListener('input',function(){ try{ localStorage.setItem(key,ta.value); }catch(e){} }); }

/* ================= CLOSE ROOM + HEARTBEAT ================= */
function bindCloseRoom(){ var b=$('#btn-close-room'); if(!b)return; b.addEventListener('click',async function(){
  if(!confirm('Oda kapatılsın mı? Öğrenciler çıkarılır ve bu kodla tekrar girilemez.'))return;
  /* Kapatmadan önce ders paketini indir (özet + transcript + tahta) — oda yıkılınca veri kaybolmasın */
  try{ endLessonPackage(); }catch(e){}
  try{ var h={'Content-Type':'application/json','apikey':SUPABASE_ANON_KEY}; if(STATE.supabase){ var s=await STATE.supabase.auth.getSession(); if(s.data&&s.data.session)h['Authorization']='Bearer '+s.data.session.access_token; }
    await fetch(SUPABASE_URL+'/functions/v1/grimeet-room-close',{method:'POST',headers:h,body:JSON.stringify({room:STATE.room})}); }catch(e){}
  STATE._leaving=true; sendData({t:'room-closed'}); setTimeout(function(){ sendData({t:'room-closed'}); },500); toast('Oda kapatıldı. Katılımcılar çıkarılıyor…'); clearInterval(STATE._hb); setTimeout(hardLeave,2600);
}); }
function startHeartbeat(){ if(!STATE.isHost)return; clearInterval(STATE._hb); STATE._hb=setInterval(async function(){ try{ var h={'Content-Type':'application/json'}; if(STATE.supabase){ var s=await STATE.supabase.auth.getSession(); if(s.data&&s.data.session){ h['Authorization']='Bearer '+s.data.session.access_token; h['apikey']=SUPABASE_ANON_KEY; } } fetch(TOKEN_ENDPOINT,{method:'POST',headers:h,body:JSON.stringify({room:STATE.room,identity:STATE.identity,name:STATE.name,isHost:true,heartbeat:true})}); }catch(e){} },5*60*1000); }

/* ================= YOKLAMA + KATILIM PUANI + DERS SONU ================= */
function recordAttend(id,name){ if(!id)return; if(!STATE.attendance[id]) STATE.attendance[id]={name:name||'Öğrenci',joined:Date.now(),left:null}; if(name)STATE.pnames[id]=name; }
function attendLeave(id){ if(STATE.attendance[id]&&!STATE.attendance[id].left) STATE.attendance[id].left=Date.now(); }
function addPoint(id,name,n){ if(!STATE.isHost||!id)return; STATE.points[id]=(STATE.points[id]||0)+n; if(name)STATE.pnames[id]=name; renderPoints(); }
function renderPoints(){ var el=$('#points-list'); if(!el)return; var arr=Object.keys(STATE.points).map(function(id){ return {name:STATE.pnames[id]||'Öğrenci',p:STATE.points[id]}; }).sort(function(a,b){return b.p-a.p;}); if(!arr.length)return; el.innerHTML=arr.map(function(x,i){ return '<div class="pt-row"><span class="pt-rank">'+(i+1)+'</span><span class="pt-nm">'+esc(x.name)+'</span><span class="pt-val">'+x.p+'</span></div>'; }).join(''); }
function dstamp(){ var d=new Date(); return d.getFullYear()+pad(d.getMonth()+1)+pad(d.getDate())+'-'+pad(d.getHours())+pad(d.getMinutes()); }
function endLessonPackage(){
  try{ var cv=WB.getCanvas(); if(cv&&cv.width){ var url=cv.toDataURL('image/png'); var a=document.createElement('a'); a.href=url; a.download='gri-meet-tahta-'+dstamp()+'.png'; document.body.appendChild(a); a.click(); a.remove(); } }catch(e){}
  var dur=STATE.startedAt?fmt((Date.now()-STATE.startedAt)/1000):'—';
  var att=Object.keys(STATE.attendance).map(function(id){ var a=STATE.attendance[id]; var mins=Math.max(1,Math.round(((a.left||Date.now())-a.joined)/60000)); return '<tr><td>'+esc(a.name)+'</td><td>'+mins+' dk</td></tr>'; }).join('')||'<tr><td colspan=2>—</td></tr>';
  var pts=Object.keys(STATE.points).map(function(id){ return {n:STATE.pnames[id]||'Öğrenci',p:STATE.points[id]}; }).sort(function(a,b){return b.p-a.p;}).map(function(x,i){ return '<tr><td>'+(i+1)+'</td><td>'+esc(x.n)+'</td><td>'+x.p+'</td></tr>'; }).join('')||'<tr><td colspan=3>—</td></tr>';
  var notes=esc(($('#notes-ta')&&$('#notes-ta').value)||'');
  /* Ders transcript'i (canlı altyazıdan biriken) */
  var trHtml=STATE.transcript.length?STATE.transcript.map(function(x){ var ts=STATE.startedAt?fmt(Math.max(0,(x.t-STATE.startedAt)/1000)):''; return '<div style="margin:2px 0"><b>'+esc(x.name)+'</b> <span style="color:#999">['+ts+']</span> '+esc(x.text)+'</div>'; }).join(''):'<i>Bu derste canlı altyazı kullanılmadı.</i>';
  var html='<!doctype html><meta charset="utf-8"><title>Gri Meet Ders Özeti</title><body style="font-family:Arial,sans-serif;max-width:760px;margin:24px auto;color:#241E17"><h1 style="color:#2C5856">Gri Meet — Ders Özeti</h1><p><b>Oda:</b> '+esc(STATE.room)+' &nbsp; <b>Tarih:</b> '+new Date().toLocaleString('tr-TR')+' &nbsp; <b>Süre:</b> '+dur+'</p><h2>Yoklama</h2><table border="1" cellpadding="6" style="border-collapse:collapse"><tr><th>Katılımcı</th><th>Süre</th></tr>'+att+'</table><h2>Katılım Puanı</h2><table border="1" cellpadding="6" style="border-collapse:collapse"><tr><th>#</th><th>Öğrenci</th><th>Puan</th></tr>'+pts+'</table>'+(notes?'<h2>Notlar</h2><pre style="white-space:pre-wrap;background:#f5f0e3;padding:12px;border-radius:8px">'+notes+'</pre>':'')+'<h2>Ders Metni (Canlı Altyazı)</h2><div style="line-height:1.55;font-size:14px">'+trHtml+'</div></body>';
  var b=new Blob([html],{type:'text/html'}),u=URL.createObjectURL(b),a2=document.createElement('a'); a2.href=u; a2.download='gri-meet-ders-ozeti-'+dstamp()+'.html'; document.body.appendChild(a2); a2.click(); setTimeout(function(){URL.revokeObjectURL(u);a2.remove();},800);
  /* Transcript ayrı .txt olarak da indir (öğretmen için düz metin) */
  if(STATE.transcript.length){
    var txt=STATE.transcript.map(function(x){ var ts=STATE.startedAt?fmt(Math.max(0,(x.t-STATE.startedAt)/1000)):''; return '['+ts+'] '+x.name+': '+x.text; }).join('\n');
    var tb=new Blob([txt],{type:'text/plain;charset=utf-8'}),tu=URL.createObjectURL(tb),a3=document.createElement('a'); a3.href=tu; a3.download='gri-meet-transcript-'+dstamp()+'.txt'; document.body.appendChild(a3); a3.click(); setTimeout(function(){URL.revokeObjectURL(tu);a3.remove();},1200);
  }
  toast(STATE.transcript.length ? 'Ders paketi indirildi (özet + transcript + tahta PNG).' : 'Ders paketi indirildi (özet + tahta PNG). Transcript yok — bu derste canlı altyazı açılmadığı için konuşma metni birikmedi.');
}

/* ================= CANLI ALTYAZI (Web Speech API) =================
   Her katılımcı kendi mikrofonunu tarayıcıda tanır (sunucu/STT maliyeti yok),
   final metni veri kanalından yayınlar; herkes altyazı barında görür.
   Öğretmen tüm konuşmacıların transcript'ini biriktirir → ders sonu paketinde indirir. */
var GRECOG=null, _capTimer=null;
/* Eko-dedup: uzaktan gelen son altyazıları tut; yerel mikrofon karşı tarafı duyup
   transkript ederse (eko) bunu yayma. */
var _remoteCaps=[];
function _normCap(s){ return String(s||'').toLowerCase().replace(/[^a-z0-9\s]/g,' ').replace(/\s+/g,' ').trim(); }
function _rememberRemoteCap(t){ t=_normCap(t); if(!t)return; _remoteCaps.push({t:Date.now(),x:t}); if(_remoteCaps.length>12)_remoteCaps.shift(); }
function _isEchoOfRemote(text){
  var n=_normCap(text); if(!n)return false; var nw=n.split(' ').filter(Boolean); if(nw.length<2)return false;
  var now=Date.now();
  for(var i=_remoteCaps.length-1;i>=0;i--){ var rc=_remoteCaps[i]; if(now-rc.t>6000)break;
    var rw=rc.x.split(' ').filter(Boolean); if(rw.length<2)continue;
    var set={}; rw.forEach(function(w){set[w]=1;}); var common=0; nw.forEach(function(w){ if(set[w])common++; });
    if(common/Math.min(nw.length,rw.length) >= 0.5) return true;
  }
  return false;
}
function captionsSupported(){ return !!(window.SpeechRecognition||window.webkitSpeechRecognition); }
function ensureCaptionBar(){
  var el=document.getElementById('gmr-captions');
  if(!el){ el=document.createElement('div'); el.id='gmr-captions'; el.className='gmr-captions hidden';
    var host=document.getElementById('gmr-stage')||document.getElementById('gmr-videos')||document.body; host.appendChild(el); }
  return el;
}
function showCaption(name,text,final){
  if(!STATE.captionsOn && !final) { /* kendi arayüzünde kapalıysa gelen final'i yine göster */ }
  var el=ensureCaptionBar(); el.classList.remove('hidden');
  el.innerHTML='<span class="cap-name">'+esc(name)+':</span> <span class="cap-txt'+(final?'':' interim')+'">'+esc(text)+'</span>';
  clearTimeout(_capTimer); _capTimer=setTimeout(function(){ el.classList.add('hidden'); }, final?6000:4000);
}
function pushTranscript(name,text){ text=(text||'').trim(); if(!text)return; STATE.transcript.push({t:Date.now(),name:name,text:text}); }
function startCaptions(){
  var SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SR){ toast('Tarayıcın canlı altyazıyı desteklemiyor (Chrome/Edge önerilir).'); return false; }
  if(GRECOG)return true;
  var r; try{ r=new SR(); }catch(e){ toast('Altyazı başlatılamadı.'); return false; }
  GRECOG=r; r.lang='en-US'; r.continuous=true; r.interimResults=true; r.maxAlternatives=1;
  r.onresult=function(e){
    var interim='',fin='';
    for(var i=e.resultIndex;i<e.results.length;i++){ var alt=e.results[i][0]; var seg=alt?alt.transcript:'';
      if(e.results[i].isFinal){ var cf=(alt&&typeof alt.confidence==='number')?alt.confidence:1; if(cf>0 && cf<0.5) continue; /* düşük güven → çöp/eko olma ihtimali yüksek */ fin+=seg; }
      else interim+=seg; }
    if(fin){ fin=fin.trim();
      if(fin.length<3) return;                    // tek kısa token → çöp (ör. "jio")
      if(_isEchoOfRemote(fin)) return;            // karşı tarafın ekosu → yayma
      sendData({t:'caption',name:STATE.name,text:fin,fin:true}); showCaption(STATE.name+' (Sen)',fin,true); pushTranscript(STATE.name,fin); }
    else if(interim){ interim=interim.trim(); sendData({t:'caption',name:STATE.name,text:interim,fin:false}); showCaption(STATE.name+' (Sen)',interim,false); }
  };
  r.onerror=function(ev){ if(ev&&(ev.error==='not-allowed'||ev.error==='service-not-allowed')){ toast('Altyazı için mikrofon izni gerekli.'); stopCaptions(); syncCaptionBtn(); } };
  r.onend=function(){ if(STATE.captionsOn && GRECOG){ try{ GRECOG.start(); }catch(e){} } };
  try{ r.start(); }catch(e){}
  return true;
}
function stopCaptions(){ if(GRECOG){ try{ GRECOG.onend=null; GRECOG.stop(); }catch(e){} GRECOG=null; } var el=document.getElementById('gmr-captions'); if(el)el.classList.add('hidden'); }
function syncCaptionBtn(){ var b=document.getElementById('ctrl-caption'); if(b){ b.classList.toggle('active',STATE.captionsOn); var l=b.querySelector('.cl'); if(l)l.textContent=STATE.captionsOn?'Altyazı Açık':'Altyazı'; } }
function toggleCaptions(){
  if(!STATE.captionsOn){ if(!captionsSupported()){ toast('Tarayıcın canlı altyazıyı desteklemiyor (Chrome/Edge).'); return; } STATE.captionsOn=true; if(!startCaptions()){ STATE.captionsOn=false; } toast('Canlı altyazı açık — konuştukça altyazı çıkar.'); }
  else { STATE.captionsOn=false; stopCaptions(); toast('Canlı altyazı kapatıldı (transcript birikmeye devam eder).'); }
  syncCaptionBtn();
}
function bindCaptions(){ var b=document.getElementById('ctrl-caption'); if(b) b.addEventListener('click',toggleCaptions); }

/* ================= BOOT ================= */
function boot(){
  if(!STATE.room) STATE.room='DEMO'+Math.floor(Math.random()*90+10);
  try{ STATE.bg=localStorage.getItem('gm-bg')||'none'; }catch(e){}
  try{ STATE.customBg=localStorage.getItem('gm-bg-custom')||''; }catch(e){}
  if(STATE.bg==='custom'&&!STATE.customBg) STATE.bg='none';
  try{ STATE.mirror = localStorage.getItem('gm-mirror')!=='0'; }catch(e){}
  try{ var _r=localStorage.getItem('gm-res'); if(_r&&RES_MAP[_r]) STATE.camRes=_r; }catch(e){}
  try{ STATE.bgFlip = localStorage.getItem('gm-bgflip')==='1'; }catch(e){}
  try{ var _tm=parseInt(localStorage.getItem('gm-tilemin'),10); if(_tm>=160&&_tm<=620){ setTileSize(_tm,false); } }catch(e){}
  initSupabase();
  bindControls(); bindDockTabs(); bindChat(); bindDoc(); bindHostActions(); bindTools(); bindMaterials(); bindRecording(); bindWaiting();
  buildBgGrid(); bindBgUpload(); bindBgFlip(); buildThemeSel(); WB.init(); ANNO.init(); DOCDRAW.init(); bindReactions(); bindNotes(); bindCloseRoom(); bindScreenZoom(); setupAutoPiP(); bindCaptions(); setupGate();
  var _teardown=function(){ try{ if(STATE.lkRoom)STATE.lkRoom.disconnect(); }catch(e){} releaseAllMedia(); };
  window.addEventListener('beforeunload',_teardown);
  window.addEventListener('pagehide',_teardown);
}
if(document.readyState!=='loading') boot(); else document.addEventListener('DOMContentLoaded',boot);
})();
