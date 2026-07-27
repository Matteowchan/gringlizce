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
  room:(params.get('room')||'').toUpperCase(), isHost:params.get('host')==='1',
  name:'', identity:'u'+Math.random().toString(36).slice(2,9),
  micOn:true, camOn:true, handUp:false, mode:'grid',
  lkRoom:null, connected:false, demo:false, localStream:null, camTrack:null,
  bg:'none', supabase:null, tiles:{}, currentMaterial:null, matShared:false, matZoom:1,
  camId:'', micId:'', spotlight:null, chatLocked:false,
  quiz:null, quizView:null, quizScore:0, quizQueue:[], quizSet:null, quizRun:null,
  breakout:null, myGroup:null, boTimer:null, ytPlayer:null, _ytPending:null, _ytHb:null
};

var BGS=[
  {id:'none',label:'Yok'},{id:'blur',label:'Bulanık'},
  {id:'bg-01',label:'Dağlar'},{id:'bg-02',label:'Orman & Deniz'},{id:'bg-03',label:'Yeşil Orman'},
  {id:'bg-04',label:'Şelale'},{id:'bg-05',label:'Altın Tarla'},{id:'bg-06',label:'Puslu Çayır'},
  {id:'bg-07',label:'Kayalık Sahil'},{id:'bg-08',label:'Çiçekler'},{id:'bg-09',label:'Çöl Gecesi'},
  {id:'bg-10',label:'Kır Çiçekleri'},{id:'bg-11',label:'Sınıf'}
];
function bgFile(id){ return new URL('assets/grimeet-bg/'+id+'.jpg',location.href).href; }

var ROOM_THEMES=[
  {t:'krem',n:'Krem',bg:'#F1EAD9',stage:'#E7DDC8',s1:'#FBF6EC',s2:'#F4EDDC',line:'#E3D8C3',ink:'#241E17',isoft:'#6E6353',ifaint:'#9A8E7B',a:'#2E6E6A',d:'#1E4E4B',g:'#B78A2E'},
  {t:'erik',n:'Erik',bg:'#F1E7EC',stage:'#E7DAE0',s1:'#FAF3F6',s2:'#F3E7EC',line:'#E7D6DE',ink:'#2A1E24',isoft:'#6E5A63',ifaint:'#9A8A91',a:'#8A4A63',d:'#5C3042',g:'#B0764A'},
  {t:'orman',n:'Orman',bg:'#E8EEE5',stage:'#DAE3D6',s1:'#F2F6F0',s2:'#E6EDE4',line:'#D6E0D2',ink:'#1E2A20',isoft:'#586355',ifaint:'#889183',a:'#3E6B4A',d:'#20402B',g:'#8A7A2E'},
  {t:'kum',n:'Kum',bg:'#F3EAD6',stage:'#E7DBC0',s1:'#FAF3E4',s2:'#F3EAD4',line:'#E3D6BC',ink:'#2A2213',isoft:'#6E6048',ifaint:'#9A8E70',a:'#A9772E',d:'#6E4B18',g:'#8A6A1E'},
  {t:'okyanus',n:'Okyanus',bg:'#E7EDF3',stage:'#D8E2EC',s1:'#F2F6FA',s2:'#E4EDF4',line:'#D6E0EC',ink:'#1E2A34',isoft:'#556170',ifaint:'#8894A2',a:'#2E5E8A',d:'#1E3E5C',g:'#4A6A8A'},
  {t:'gul',n:'Gül',bg:'#F3E9EE',stage:'#E7D9E1',s1:'#FAF3F6',s2:'#F3E7EE',line:'#E7D6DF',ink:'#2A1E24',isoft:'#6E5A63',ifaint:'#9A8A91',a:'#B0567A',d:'#7E3A56',g:'#A05A6A'},
  {t:'bordo',n:'Bordo',bg:'#F1E8EA',stage:'#E5D6DA',s1:'#FAF2F4',s2:'#F2E6E9',line:'#E5D6DA',ink:'#2A1E21',isoft:'#6E5A5E',ifaint:'#9A8A8E',a:'#8E3B4C',d:'#5E2632',g:'#8A4A3B'},
  {t:'lavanta',n:'Lavanta',bg:'#ECE9F3',stage:'#DED9EC',s1:'#F5F3FA',s2:'#E9E5F2',line:'#DED9EC',ink:'#221E2A',isoft:'#5A566E',ifaint:'#8A86A2',a:'#6E5AA0',d:'#493A6E',g:'#8A6A9A'},
  {t:'dark',n:'Gece',bg:'#161311',stage:'#0e0c0a',s1:'#211d18',s2:'#2a251f',line:'#352f27',ink:'#F1E9D9',isoft:'#B7AB96',ifaint:'#8A7E6C',a:'#6FB6AF',d:'#2E6E6A',g:'#D8B25A'}
];
function applyRoomTheme(t){ var x=null; for(var i=0;i<ROOM_THEMES.length;i++){ if(ROOM_THEMES[i].t===t){x=ROOM_THEMES[i];break;} } if(!x)x=ROOM_THEMES[0]; var r=document.documentElement.style;
  r.setProperty('--gm-bg',x.bg); r.setProperty('--gm-stage',x.stage); r.setProperty('--gm-surface',x.s1); r.setProperty('--gm-surface-2',x.s2); r.setProperty('--gm-line',x.line);
  r.setProperty('--gm-ink',x.ink); r.setProperty('--gm-ink-soft',x.isoft); r.setProperty('--gm-ink-faint',x.ifaint);
  r.setProperty('--gm-teal',x.a); r.setProperty('--gm-teal-deep',x.d); r.setProperty('--gm-gold',x.g);
  try{localStorage.setItem('gri-theme',x.t);}catch(e){} var sel=document.getElementById('gmr-theme'); if(sel)sel.value=x.t; }
function buildThemeSel(){ var sel=document.getElementById('gmr-theme'); if(!sel)return; ROOM_THEMES.forEach(function(x){ var o=document.createElement('option'); o.value=x.t; o.textContent='Tema: '+x.n; sel.appendChild(o); }); var saved='krem'; try{ saved=localStorage.getItem('gri-theme')||'krem'; }catch(e){} sel.addEventListener('change',function(){ applyRoomTheme(sel.value); }); applyRoomTheme(saved); }

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
  async function preview(){
    try{ if(gateStream)gateStream.getTracks().forEach(function(t){t.stop();});
      gateStream=await navigator.mediaDevices.getUserMedia({video:camOn?(STATE.camId?{deviceId:{exact:STATE.camId}}:true):false,audio:false});
      gv.srcObject=gateStream; gp.classList.remove('camoff'); fillDevices();
    }catch(e){ camOn=false; $('#gate-cam').classList.remove('on'); $('#gate-cam').textContent='Kamera kapalı'; gp.classList.add('camoff'); fillDevices(); }
  }
  if(camOn) preview(); else { gp.classList.add('camoff'); fillDevices(); }
  camSel.addEventListener('change',function(){ STATE.camId=camSel.value; if(camOn)preview(); });
  micSel.addEventListener('change',function(){ STATE.micId=micSel.value; });
  $('#gate-cam').addEventListener('click',function(){ camOn=!camOn; this.classList.toggle('on',camOn); this.textContent=camOn?'Kamera açık':'Kamera kapalı'; if(camOn)preview(); else{ gp.classList.add('camoff'); if(gateStream)gateStream.getTracks().forEach(function(t){t.stop();}); } });
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
    if(gateStream) gateStream.getTracks().forEach(function(t){t.stop();});
    $('#gmr-gate').classList.add('hidden'); enterRoom();
  });
}

/* ================= ENTER ROOM ================= */
async function enterRoom(){
  startTs=Date.now(); setInterval(tickClock,1000);
  $('#gmr-room-name').textContent=STATE.isHost?'Ders Odası (Öğretmen)':'Ders Odası';
  $('#gmr-code').textContent=STATE.room||'·····';
  if(STATE.isHost) $('#gm-app').classList.add('is-host'); else $('#gm-app').classList.add('is-student');
  ensureTile('self',{name:STATE.name+' (Sen)',host:STATE.isHost}); updateGridCount();
  connectLiveKit();
}

/* ================= LIVEKIT ================= */
async function connectLiveKit(){
  if(!LK){ enterDemo('LiveKit yüklenemedi'); return; }
  setStatus('connecting','Bağlanıyor…');
  var token=null;
  try{
    var headers={'Content-Type':'application/json'};
    if(STATE.supabase){ try{ var s=await STATE.supabase.auth.getSession(); if(s.data&&s.data.session){ headers['Authorization']='Bearer '+s.data.session.access_token; headers['apikey']=SUPABASE_ANON_KEY; } }catch(e){} }
    var res=await fetch(TOKEN_ENDPOINT,{method:'POST',headers:headers,body:JSON.stringify({room:STATE.room,identity:STATE.identity,name:STATE.name,isHost:STATE.isHost})});
    if(res.status===403){ var e403=await res.json().catch(function(){return{};}); blockJoin(e403.error||'Oda bulunamadı.'); return; }
    if(res.ok){ var jr=await res.json(); token=jr.token; if(jr.url)LIVEKIT_URL=jr.url; }
  }catch(e){}
  if(!token){ enterDemo('Token alınamadı'); return; }
  try{
    var room=new LK.Room({adaptiveStream:true,dynacast:true}); STATE.lkRoom=room;
    room.on(LK.RoomEvent.ParticipantConnected,onParticipant);
    room.on(LK.RoomEvent.ParticipantDisconnected,function(p){ removeTile(p.identity); sysChat((p.name||'Katılımcı')+' ayrıldı'); refreshPeople(); updateGridCount(); });
    room.on(LK.RoomEvent.TrackSubscribed,function(track,pub,p){ attachTrack(track,pub,p); });
    room.on(LK.RoomEvent.TrackUnsubscribed,function(track,pub,p){ if(isScreen(pub)){ clearScreen(); if(STATE.mode==='screen'&&!STATE.isHost) setMode('grid',{remote:true}); } else if(track.kind==='video'){ renderPlaceholder(p.identity); } });
    room.on(LK.RoomEvent.ActiveSpeakersChanged,onSpeakers);
    room.on(LK.RoomEvent.DataReceived,onData);
    room.on(LK.RoomEvent.Disconnected,function(){ setStatus('err','Bağlantı koptu'); });
    room.on(LK.RoomEvent.TrackMuted,function(pub,p){ if(pub.kind==='audio')updateMic(p.identity,false); refreshPeople(); });
    room.on(LK.RoomEvent.TrackUnmuted,function(pub,p){ if(pub.kind==='audio')updateMic(p.identity,true); refreshPeople(); });
    room.on(LK.RoomEvent.LocalTrackPublished,function(pub){ if(pub.source===LK.Track.Source.Camera){ STATE.camTrack=pub.videoTrack; attachSelf(); if(STATE.bg!=='none') applyBackground(STATE.bg); } else if(pub.source===LK.Track.Source.ScreenShare){ attachScreen(pub.track,true); } });
    room.on(LK.RoomEvent.LocalTrackUnpublished,function(pub){ if(pub.source===LK.Track.Source.ScreenShare){ clearScreen(); setMode('grid'); } });

    await room.connect(LIVEKIT_URL,token);
    STATE.connected=true; setStatus('live','Canlı');
    try{ await room.localParticipant.setMicrophoneEnabled(STATE.micOn); }catch(e){}
    try{ await room.localParticipant.setCameraEnabled(STATE.camOn); }catch(e){}
    try{ if(STATE.camId) await room.switchActiveDevice('videoinput',STATE.camId); if(STATE.micId) await room.switchActiveDevice('audioinput',STATE.micId); }catch(e){}
    var camPub=room.localParticipant.getTrackPublication(LK.Track.Source.Camera);
    if(camPub&&camPub.videoTrack){ STATE.camTrack=camPub.videoTrack; attachSelf(); }
    room.remoteParticipants.forEach(onParticipant);
    refreshPeople(); updateGridCount();
    if(!STATE.isHost) setTimeout(function(){ sendData({t:'req-state'}); },900);
  }catch(e){ enterDemo('Bağlanılamadı'); }
}
function enterDemo(reason){
  STATE.demo=true; setStatus('demo','Demo modu');
  sysChat('Demo modu: '+reason+'. Gerçek video/arka plan için canlı bağlantı gerekir; tahta, materyal ve araçlar çalışır.');
  navigator.mediaDevices.getUserMedia({video:STATE.camOn,audio:false}).then(function(st){ STATE.localStream=st; attachSelf(); }).catch(function(){});
  refreshPeople(); updateGridCount();
}
function setStatus(cls,txt){ $('#gmr-status').className='gmr-status '+cls; $('#gmr-status-txt').textContent=txt; }
function blockJoin(msg){
  setStatus('err','Oda yok');
  var ex=document.getElementById('gmr-block'); if(ex)ex.remove();
  var b=document.createElement('div'); b.className='gmr-gate'; b.id='gmr-block';
  b.innerHTML='<div class="gmr-gate-card"><div class="gmr-brand big">Gri<span>Meet</span></div><p style="color:#d66;font-size:15px;margin:16px 0;line-height:1.5">'+esc(msg)+'</p><button class="gmr-btn" id="blk-retry">Tekrar Dene</button><button class="gmr-btn" id="blk-exit" style="background:transparent;border:1px solid var(--gm-line);color:var(--gm-ink-soft);margin-top:8px">Çıkış</button></div>';
  document.body.appendChild(b);
  b.querySelector('#blk-retry').addEventListener('click',function(){ b.remove(); connectLiveKit(); });
  b.querySelector('#blk-exit').addEventListener('click',function(){ location.href='grimeet.html'; });
}
function isScreen(pub){ return pub&&(pub.source===LK.Track.Source.ScreenShare); }

function onParticipant(p){ ensureTile(p.identity,{name:p.name||'Öğrenci',host:isHostMeta(p)}); refreshPeople(); updateGridCount(); p.trackPublications.forEach(function(pub){ if(pub.isSubscribed&&pub.track) attachTrack(pub.track,pub,p); }); }
function isHostMeta(p){ try{ return (p.metadata&&JSON.parse(p.metadata).host)===true; }catch(e){ return false; } }

function attachTrack(track,pub,p){
  if(isScreen(pub)){ attachScreen(track,false); return; }
  var t=ensureTile(p.identity,{name:p.name||'Öğrenci',host:isHostMeta(p)});
  if(track.kind==='video'){ var v=t.querySelector('video.cam')||document.createElement('video'); v.className='cam'; v.autoplay=true;v.playsInline=true; track.attach(v); var av=t.querySelector('.avatar'); if(av)av.remove(); if(!v.parentNode)t.insertBefore(v,t.firstChild); if(STATE.spotlight===p.identity) applySpotlightVideo(); }
  else if(track.kind==='audio'){ var a=document.createElement('audio'); a.autoplay=true; track.attach(a); t.appendChild(a); if(STATE.breakout) refreshBreakoutAV(); }
}
function attachSelf(){
  var t=ensureTile('self',{name:STATE.name+' (Sen)',host:STATE.isHost});
  var v=t.querySelector('video.cam');
  if(STATE.camTrack){ if(!v){ v=document.createElement('video'); v.className='cam mirror'; v.autoplay=true;v.muted=true;v.playsInline=true; } STATE.camTrack.attach(v); var av=t.querySelector('.avatar'); if(av)av.remove(); if(!v.parentNode)t.insertBefore(v,t.firstChild); }
  else if(STATE.localStream){ if(!v){ v=document.createElement('video'); v.className='cam mirror'; v.autoplay=true;v.muted=true;v.playsInline=true; v.srcObject=STATE.localStream; var av2=t.querySelector('.avatar'); if(av2)av2.remove(); t.insertBefore(v,t.firstChild); } }
}

function attachScreen(track,local){ var box=$('#gmr-screen'); var v=box.querySelector('video'); if(!v){ v=document.createElement('video'); v.autoplay=true;v.playsInline=true; if(local)v.muted=true; box.insertBefore(v,box.firstChild); } track.attach(v); $('#scr-label').textContent=local?'Ekranını paylaşıyorsun':'Paylaşılan ekran'; setMode('screen'); }
function clearScreen(){ var box=$('#gmr-screen'); var v=box.querySelector('video'); if(v)v.remove(); }

/* ================= TILES ================= */
function tileEl(id){ return STATE.tiles[id]; }
function ensureTile(id,info){
  if(STATE.tiles[id]) return STATE.tiles[id];
  var t=document.createElement('div'); t.className='vtile'+(info&&info.host?' host':''); t.dataset.id=id;
  var ctrl='';
  if(STATE.isHost){
    ctrl='<div class="hostctrl"><button data-act="spot" title="Odağa al"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v3M12 18v3M3 12h3M18 12h3"/><circle cx="12" cy="12" r="4"/></svg></button>'+
      (id!=='self'?'<button data-act="mute" title="Sustur"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 9v3a3 3 0 0 0 5 2M9 5a3 3 0 0 1 6 0v3M4 4l16 16"/></svg></button><button data-act="kick" class="danger" title="Çıkar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6L6 18"/></svg></button>':'')+'</div>';
  }
  t.innerHTML='<div class="avatar"><span>'+initials(info?info.name:'?')+'</span></div>'+
    '<div class="name"><span class="nm">'+esc(info?info.name:'Öğrenci')+'</span></div>'+
    (info&&info.host?'<div class="badge">Öğretmen</div>':'')+ctrl;
  STATE.tiles[id]=t; $('#gmr-videos').appendChild(t); updateGridCount(); return t;
}
function renderPlaceholder(id){ var t=tileEl(id); if(!t)return; var v=t.querySelector('video.cam'); if(v)v.remove(); if(!t.querySelector('.avatar')){ var d=document.createElement('div'); d.className='avatar'; d.innerHTML='<span>'+initials(t.querySelector('.nm').textContent)+'</span>'; t.insertBefore(d,t.firstChild); } }
function removeTile(id){ var t=tileEl(id); if(t){t.remove(); delete STATE.tiles[id]; updateGridCount();} }
function updateMic(id,on){ var t=tileEl(id); if(!t)return; var nm=t.querySelector('.name'); var m=nm.querySelector('.mic-off'); if(!on&&!m){ var s=document.createElement('span'); s.className='mic-off'; s.textContent='🔇'; nm.appendChild(s);} else if(on&&m)m.remove(); }
function onSpeakers(sp){ var ids={}; sp.forEach(function(p){ ids[(STATE.lkRoom&&p.identity===STATE.lkRoom.localParticipant.identity)?'self':p.identity]=1; }); Object.keys(STATE.tiles).forEach(function(id){ STATE.tiles[id].classList.toggle('speaking',!!ids[id]); }); }
function updateGridCount(){ var n=Object.keys(STATE.tiles).length; $('#gmr-videos').setAttribute('data-n',n); $('#gmr-count-n').textContent=n; }

/* ================= MODE / VIEW ================= */
var MODE_LBL={grid:'Kameralar',board:'Tahta',materials:'Materyal',screen:'Ekran',spotlight:'Odak'};
function setMode(mode,opts){
  opts=opts||{}; STATE.mode=mode; $('#gm-app').setAttribute('data-mode',mode);
  $('#ctrl-board').classList.toggle('active',mode==='board');
  $('#ctrl-materials').classList.toggle('active',mode==='materials');
  $('#gmr-share-what').textContent=MODE_LBL[mode]||'Kameralar';
  if(mode==='board') setTimeout(WB.resize,40);
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

function bindControls(){
  $('#ctrl-mic').addEventListener('click',async function(){ STATE.micOn=!STATE.micOn; this.setAttribute('data-on',STATE.micOn?'1':'0'); if(STATE.lkRoom){try{await STATE.lkRoom.localParticipant.setMicrophoneEnabled(STATE.micOn);}catch(e){}} refreshPeople(); });
  $('#ctrl-cam').addEventListener('click',async function(){ STATE.camOn=!STATE.camOn; this.setAttribute('data-on',STATE.camOn?'1':'0');
    if(STATE.lkRoom){ try{ await STATE.lkRoom.localParticipant.setCameraEnabled(STATE.camOn); }catch(e){}
      if(STATE.camOn){ var cp=STATE.lkRoom.localParticipant.getTrackPublication(LK.Track.Source.Camera); if(cp&&cp.videoTrack){ STATE.camTrack=cp.videoTrack; attachSelf(); if(STATE.bg!=='none') applyBackground(STATE.bg); } }
      else { STATE.camTrack=null; renderPlaceholder('self'); } } });
  $('#ctrl-tools').addEventListener('click',function(){ toggleDock('tools'); });
  $('#ctrl-share').addEventListener('click',shareScreen);
  $('#ctrl-board').addEventListener('click',function(){ setMode(STATE.mode==='board'?'grid':'board'); });
  $('#ctrl-materials').addEventListener('click',function(){ setMode(STATE.mode==='materials'?'grid':'materials'); });
  $('#ctrl-bg').addEventListener('click',function(){ $('#bg-modal').classList.remove('hidden'); });
  $('#ctrl-record').addEventListener('click',function(){ $('#rec-modal').classList.remove('hidden'); });
  $('#ctrl-hand').addEventListener('click',function(){ STATE.handUp=!STATE.handUp; this.classList.toggle('active',STATE.handUp); setSelfHand(STATE.handUp); sendData({t:'hand',up:STATE.handUp}); if(STATE.handUp)toast('El kaldırdın.'); });
  $('#ctrl-people').addEventListener('click',function(){ toggleDock('people'); });
  $('#ctrl-chat').addEventListener('click',function(){ toggleDock('chat'); });
  $('#ctrl-leave').addEventListener('click',leaveRoom);
  $('#gmr-code').addEventListener('click',function(){ try{navigator.clipboard.writeText(STATE.room);toast('Oda kodu kopyalandı: '+STATE.room);}catch(e){} });
  $('#gmr-videos').addEventListener('click',function(e){ var b=e.target.closest('[data-act]'); if(!b||!STATE.isHost)return; var id=b.closest('.vtile').dataset.id;
    if(b.dataset.act==='spot'){ setSpotlight(STATE.spotlight===id?null:id); }
    else if(b.dataset.act==='mute'){ sendData({t:'force-mute',target:id}); toast('Susturma isteği gönderildi.'); }
    else if(b.dataset.act==='kick'){ if(confirm('Bu katılımcı çıkarılsın mı?')){ sendData({t:'kick',target:id}); toast('Çıkarma isteği gönderildi.'); } } });
  $$('[data-close-modal]').forEach(function(x){ x.addEventListener('click',function(){ x.closest('.gmr-modal').classList.add('hidden'); }); });
  $$('.gmr-modal').forEach(function(m){ if(m.id==='quiz-modal')return; m.addEventListener('click',function(e){ if(e.target===m)m.classList.add('hidden'); }); });
  $('#dock-close').addEventListener('click',function(){ $('#gmr-dock').classList.add('hidden'); $('#ctrl-people').classList.remove('active'); $('#ctrl-chat').classList.remove('active'); var ct=$('#ctrl-tools'); if(ct)ct.classList.remove('active'); });
  bindSplit(); bindDockResize();
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

async function shareScreen(){
  if(!STATE.lkRoom){ toast('Ekran paylaşımı için canlı bağlantı gerekli.'); return; }
  try{ var on=STATE.lkRoom.localParticipant.isScreenShareEnabled; await STATE.lkRoom.localParticipant.setScreenShareEnabled(!on,{audio:true}); $('#ctrl-share').classList.toggle('active',!on); if(!on){ setMode('screen'); toast('Ses için "Sekme sesini paylaş" kutusunu işaretle.'); } else { clearScreen(); setMode('grid'); } }
  catch(e){ toast('Ekran paylaşımı iptal edildi.'); }
}
function leaveRoom(){ if(!confirm('Dersten ayrılmak istiyor musun?'))return; hardLeave(); }
function hardLeave(){ try{if(STATE.lkRoom)STATE.lkRoom.disconnect();}catch(e){} try{if(STATE.localStream)STATE.localStream.getTracks().forEach(function(t){t.stop();});}catch(e){} location.href='grimeet.html'; }
function setSelfHand(up){ var t=tileEl('self'); if(!t)return; var h=t.querySelector('.hand'); if(up&&!h){var d=document.createElement('div');d.className='hand';d.textContent='✋';t.appendChild(d);} else if(!up&&h)h.remove(); }

function bindSplit(){
  var split=$('#gmr-split'),dragging=false;
  split.addEventListener('pointerdown',function(e){ dragging=true; split.setPointerCapture(e.pointerId); e.preventDefault(); });
  split.addEventListener('pointermove',function(e){ if(!dragging)return; var dock=$('#gmr-dock'); var right=dock.classList.contains('hidden')?window.innerWidth:dock.getBoundingClientRect().left; var w=right-e.clientX; w=Math.max(120,Math.min(620,w)); document.documentElement.style.setProperty('--strip',w+'px'); });
  split.addEventListener('pointerup',function(e){ dragging=false; try{split.releasePointerCapture(e.pointerId);}catch(_){} });
}

/* ================= HOST ACTIONS ================= */
function bindHostActions(){
  var ma=$('#btn-mute-all'); if(ma)ma.addEventListener('click',function(){ sendData({t:'force-mute',target:'*'}); toast('Herkese susturma isteği gönderildi.'); });
  var lh=$('#btn-lower-hands'); if(lh)lh.addEventListener('click',function(){ sendData({t:'lower-hands'}); Object.keys(STATE.tiles).forEach(function(id){ var h=STATE.tiles[id].querySelector('.hand'); if(h)h.remove(); }); toast('Tüm eller indirildi.'); });
  var tc=$('#btn-toggle-chat'); if(tc)tc.addEventListener('click',function(){ STATE.chatLocked=!STATE.chatLocked; this.textContent=STATE.chatLocked?'Sohbeti Aç':'Sohbeti Kapat'; sendData({t:'chat-lock',on:STATE.chatLocked}); toast(STATE.chatLocked?'Öğrenci sohbeti kapatıldı.':'Sohbet açıldı.'); });
}

/* ================= DATA ================= */
var encd=new TextEncoder(),decd=new TextDecoder();
function sendData(obj){ if(!STATE.lkRoom||!STATE.connected)return; try{ STATE.lkRoom.localParticipant.publishData(encd.encode(JSON.stringify(obj)),{reliable:true}); }catch(e){} }
function onData(payload,p){
  var msg; try{ msg=JSON.parse(decd.decode(payload)); }catch(e){ return; }
  var from=p?(p.name||'Katılımcı'):'?', id=p?p.identity:null, fromHost=p?isHostMeta(p):false;
  if(msg.t==='chat') addChat(from,msg.text);
  else if(msg.t==='hand'){ if(id){ var tl=tileEl(id); if(tl){ var h=tl.querySelector('.hand'); if(msg.up&&!h){var d=document.createElement('div');d.className='hand';d.textContent='✋';tl.appendChild(d);} else if(!msg.up&&h)h.remove(); } } if(msg.up)sysChat(from+' el kaldırdı ✋'); }
  else if(msg.t==='view'){ if(!STATE.isHost&&fromHost) setMode(msg.mode,{remote:true}); }
  else if(msg.t==='spotlight'){ if(!STATE.isHost&&fromHost){ if(msg.target){ STATE.spotlight=msg.target; applySpotlightVideo(); setMode('spotlight',{remote:true}); var tt=tileEl(msg.target); $('#spot-label').textContent=(tt?tt.querySelector('.nm').textContent:'Odak'); } else { STATE.spotlight=null; setMode('grid',{remote:true}); } } }
  else if(msg.t==='mat'){ if(!STATE.isHost&&fromHost){ loadMaterial(msg,true); setMode('materials',{remote:true}); sysChat('Öğretmen bir materyal paylaştı.'); } }
  else if(msg.t==='mat-stop'){ if(!STATE.isHost&&fromHost&&STATE.mode==='materials') setMode('grid',{remote:true}); }
  else if(msg.t==='mat-scroll'){ if(!STATE.isHost&&fromHost) applyMatScroll(msg.frac); }
  else if(msg.t==='force-mute'){ if((msg.target==='*'||msg.target==='self'||(STATE.lkRoom&&msg.target===STATE.lkRoom.localParticipant.identity))&&!STATE.isHost&&fromHost){ STATE.micOn=false; $('#ctrl-mic').setAttribute('data-on','0'); if(STATE.lkRoom)STATE.lkRoom.localParticipant.setMicrophoneEnabled(false); toast('Öğretmen mikrofonunu kapattı.'); } }
  else if(msg.t==='kick'){ if((msg.target==='self'||(STATE.lkRoom&&msg.target===STATE.lkRoom.localParticipant.identity))&&!STATE.isHost&&fromHost){ toast('Öğretmen seni çıkardı.'); setTimeout(hardLeave,1500); } }
  else if(msg.t==='lower-hands'){ if(!STATE.isHost){ STATE.handUp=false; $('#ctrl-hand').classList.remove('active'); setSelfHand(false); } }
  else if(msg.t==='chat-lock'){ if(!STATE.isHost&&fromHost){ STATE.chatLocked=msg.on; applyChatLock(); } }
  else if(msg.t==='quizset'){ if(!STATE.isHost&&fromHost) openQuizSet(msg.list,msg.dur); }
  else if(msg.t==='quiz-vote'){ if(STATE.isHost&&STATE.quizSet){ var vi=msg.idx||0; var vv=STATE.quizSet.votes[vi]=STATE.quizSet.votes[vi]||{}; vv[msg.a]=(vv[msg.a]||0)+1; renderQuizSetTally(); } }
  else if(msg.t==='yt-sync'){ if(!STATE.isHost&&fromHost) applyYtSync(msg); }
  else if(msg.t==='req-state'){ if(STATE.isHost) sendState(); }
  else if(msg.t==='state'){ if(!STATE.isHost&&fromHost) applyState(msg); }
  else if(msg.t==='breakout'){ if(!STATE.isHost&&fromHost) applyBreakout(msg.map,msg.mins); }
  else if(msg.t==='breakout-end'){ if(!STATE.isHost&&fromHost) clearBreakout(); }
  else if(msg.t==='wb'){ WB.applyRemote(msg); }
  else if(msg.t==='anno'){ ANNO.applyRemote(msg.strokes); }
}
function sendState(){ sendData({t:'state',mode:(STATE.mode==='spotlight'||STATE.mode==='screen')?'grid':STATE.mode,material:(STATE.matShared?STATE.currentMaterial:null),wb:WB.items(),chatLock:STATE.chatLocked}); }
function applyState(msg){ if(msg.wb) WB.applyRemote({items:msg.wb}); if(msg.chatLock){ STATE.chatLocked=true; applyChatLock(); } if(msg.material){ loadMaterial(msg.material,true); setMode('materials',{remote:true}); } else if(msg.mode&&msg.mode!=='grid'){ setMode(msg.mode,{remote:true}); } }

/* ================= CHAT / PEOPLE ================= */
var chatUnread=0;
function chatEmpty(){ var log=$('#chat-log'); var e=log.querySelector('.dock-empty'); if(e)e.remove(); }
function addChat(who,text){ chatEmpty(); var log=$('#chat-log'); var d=document.createElement('div'); d.className='chat-msg'; d.innerHTML='<span class="who">'+esc(who)+':</span>'+esc(text); log.appendChild(d); log.scrollTop=log.scrollHeight;
  var dock=$('#gmr-dock'); if(dock.classList.contains('hidden')||dock.getAttribute('data-active')!=='chat'){ chatUnread++; var b=$('#chat-badge'); b.textContent=chatUnread>9?'9+':chatUnread; b.classList.add('show'); } }
function sysChat(text){ chatEmpty(); var log=$('#chat-log'); var d=document.createElement('div'); d.className='chat-msg sys'; d.textContent=text; log.appendChild(d); log.scrollTop=log.scrollHeight; }
function applyChatLock(){ var i=$('#chat-text'),b=$('#chat-send'); var locked=STATE.chatLocked&&!STATE.isHost; i.disabled=locked; b.disabled=locked; i.placeholder=locked?'Sohbet öğretmen tarafından kapatıldı':'Mesaj yaz…'; }
function bindChat(){ function send(){ if(STATE.chatLocked&&!STATE.isHost)return; var i=$('#chat-text'); var t=(i.value||'').trim(); if(!t)return; addChat(STATE.name+' (Sen)',t); sendData({t:'chat',text:t}); i.value=''; } $('#chat-send').addEventListener('click',send); $('#chat-text').addEventListener('keydown',function(e){ if(e.key==='Enter')send(); }); }
function refreshPeople(){
  var ul=$('#people-list'); if(!ul)return; ul.innerHTML='';
  var list=[{name:STATE.name+' (Sen)',host:STATE.isHost,mic:STATE.micOn}];
  if(STATE.lkRoom) STATE.lkRoom.remoteParticipants.forEach(function(p){ list.push({name:p.name||'Öğrenci',host:isHostMeta(p),mic:p.isMicrophoneEnabled}); });
  list.forEach(function(m){ var li=document.createElement('li'); li.innerHTML='<span class="pav">'+initials(m.name)+'</span><span class="pnm">'+esc(m.name)+'</span>'+(m.host?'<span class="ptag">Öğretmen</span>':'')+'<span class="pmic'+(m.mic?'':' off')+'">'+(m.mic?'🎤':'🔇')+'</span>'; ul.appendChild(li); });
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
  $('#btn-breakout').addEventListener('click',makeBreakout);
  // quiz popup (student)
  $('#quiz-close').addEventListener('click',function(){ $('#quiz-modal').classList.add('hidden'); if(STATE.quizRun) $('#quiz-pill').classList.add('show'); });
  $('#quiz-pill').addEventListener('click',function(){ $('#quiz-modal').classList.remove('hidden'); $('#quiz-pill').classList.remove('show'); });
}
function startTimer(sec){ clearInterval(timerInt); timerLeft=sec; $('#timer-display').textContent=fmt(timerLeft); timerInt=setInterval(function(){ timerLeft--; $('#timer-display').textContent=fmt(timerLeft); if(timerLeft<=0){ clearInterval(timerInt); timerInt=null; toast('Süre doldu!'); try{beep();}catch(e){} } },1000); }
function beep(){ var a=new (window.AudioContext||window.webkitAudioContext)(); var o=a.createOscillator(); o.connect(a.destination); o.frequency.value=880; o.start(); setTimeout(function(){o.stop();a.close();},350); }
function studentNames(){ var names=[]; if(STATE.lkRoom)STATE.lkRoom.remoteParticipants.forEach(function(p){ if(!isHostMeta(p))names.push(p.name||'Öğrenci'); }); if(!STATE.isHost)names.push(STATE.name); return names; }
function pickStudent(){ var names=studentNames(); if(!names.length){ $('#pick-result').textContent='Öğrenci yok.'; return; } var i=0,n=0,max=14+Math.floor(Math.random()*8),el=$('#pick-result'); var iv=setInterval(function(){ el.textContent=names[i%names.length]; i++; n++; if(n>=max){ clearInterval(iv); el.textContent='🎯 '+names[Math.floor(Math.random()*names.length)]; } },80); }

/* ---- Quiz (host) ---- */
function readQuizForm(){ var q=($('#quiz-q').value||'').trim(); var opts={}; $$('#quiz-opts input[data-opt]').forEach(function(i){ var v=(i.value||'').trim(); if(v)opts[i.dataset.opt]=v; }); var c=$('#quiz-opts .cor.on'); return {q:q,opts:opts,correct:c?c.dataset.cor:null}; }
function clearQuizForm(){ $('#quiz-q').value=''; $$('#quiz-opts input[data-opt]').forEach(function(i){i.value='';}); $$('#quiz-opts .cor').forEach(function(x){x.classList.remove('on');}); }
function quizFilled(f){ return !!(f.q||Object.keys(f.opts).length||f.correct); }
function updateQueueLabel(){ var el=$('#quiz-queue'); if(el)el.textContent=STATE.quizQueue.length?(STATE.quizQueue.length+' soru kuyrukta'):''; }
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
  el.innerHTML=L.map(function(item,qi){ var v=V[qi]||{}; var tot=(v.A||0)+(v.B||0)+(v.C||0)+(v.D||0)||1;
    return '<div style="margin:8px 0 4px;font-weight:700;font-size:12px">Soru '+(qi+1)+(item.q?': '+esc(item.q).slice(0,36):'')+'</div>'+['A','B','C','D'].map(function(k){ return '<div class="qrow'+(item.correct===k?' correct':'')+'"><b>'+k+'</b><div class="qbar" style="width:'+((v[k]||0)/tot*120)+'px"></div><span>'+(v[k]||0)+'</span></div>'; }).join(''); }).join('');
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
  ['A','B','C','D'].forEach(function(k){ var b=document.createElement('button'); b.dataset.k=k; b.innerHTML='<span class="k">'+k+'</span> '+esc((item.opts&&item.opts[k])||''); b.addEventListener('click',function(){ qAnswer(k); }); ans.appendChild(b); });
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
function applyBreakout(map,mins){
  STATE.breakout=map;
  var myId=STATE.lkRoom?STATE.lkRoom.localParticipant.identity:null;
  STATE.myGroup=STATE.isHost?0:(map[myId]||null);
  refreshBreakoutAV(); showBreakoutBanner(mins);
}
function clearBreakout(){ STATE.breakout=null; STATE.myGroup=null; refreshBreakoutAV(); hideBreakoutBanner(); var bo=$('#bo-result'); if(bo)bo.innerHTML=''; }
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
async function loadTP(){ if(TP||tpTried)return TP; tpTried=true; try{ TP=await import('https://esm.sh/@livekit/track-processors'); }catch(e){ try{ TP=await import('https://cdn.jsdelivr.net/npm/@livekit/track-processors/+esm'); }catch(e2){ TP=null; } } return TP; }
function buildBgGrid(){
  var g=$('#bg-grid'); g.innerHTML='';
  BGS.forEach(function(b){ var d=document.createElement('button'); d.className='bg-opt '+(b.id==='none'?'none':b.id==='blur'?'blur':'')+(STATE.bg===b.id?' on':''); d.dataset.bg=b.id; if(b.id!=='none'&&b.id!=='blur') d.style.backgroundImage='url("'+bgFile(b.id)+'")'; d.innerHTML='<span>'+b.label+'</span>'; d.addEventListener('click',function(){ $$('.bg-opt').forEach(function(x){x.classList.remove('on');}); d.classList.add('on'); applyBackground(b.id); }); g.appendChild(d); });
}
async function applyBackground(bg){
  STATE.bg=bg; try{localStorage.setItem('gm-bg',bg);}catch(e){} var track=STATE.camTrack;
  if(!track){ toast(STATE.demo?'Arka plan için canlı bağlantı gerekli.':'Kamera açık değil.'); return; }
  var note=$('#bg-note'); if(note)note.textContent='Uygulanıyor…';
  try{
    if(bg==='none'){ if(track.getProcessor&&track.getProcessor()) await track.stopProcessor(); }
    else{ var tp=await loadTP(); if(!tp){ toast('Bu tarayıcıda arka plan efekti desteklenmiyor.'); if(note)note.textContent='Bu tarayıcıda desteklenmiyor.'; return; }
      if(bg==='blur') await track.setProcessor(tp.BackgroundBlur(14));
      else await track.setProcessor(tp.VirtualBackground(bgFile(bg))); }
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
    if(!STATE.matShared){ sendData({t:'mat',kind:STATE.currentMaterial.kind,value:STATE.currentMaterial.value}); STATE.matShared=true; sh.textContent='Paylaşımı Durdur'; sh.classList.add('stop'); toast('Öğrencilere paylaşıldı.'); }
    else { sendData({t:'mat-stop'}); STATE.matShared=false; sh.textContent='Öğrencilerle Paylaş'; sh.classList.remove('stop'); toast('Paylaşım durduruldu.'); }
  });
  $('#mat-zoom-in').addEventListener('click',function(){ STATE.matZoom=Math.min(2.5,Math.round((STATE.matZoom+0.15)*100)/100); applyZoom(); });
  $('#mat-zoom-out').addEventListener('click',function(){ STATE.matZoom=Math.max(0.4,Math.round((STATE.matZoom-0.15)*100)/100); applyZoom(); });
  var at=$('#mat-anno-toggle'); if(at) at.addEventListener('click',function(){ var on=$('#gmr-materials').classList.toggle('annotating'); at.classList.toggle('on',on); if(on) setTimeout(ANNO.resize,30); });
}
function ytId(u){ var m=String(u).match(/(?:v=|youtu\.be\/|embed\/)([\w-]{11})/); return m?m[1]:(String(u).length===11?u:null); }
function loadMaterial(m,remote){
  STATE.currentMaterial={kind:m.kind,value:m.value};
  ANNO.reset(!remote);
  if(m.kind==='yt'){ var id=ytId(m.value); if(!id){ if(!remote)toast('Geçerli YouTube bağlantısı değil.'); return; } matTab('youtube'); ensureYtPlayer(id); }
  else if(m.kind==='unit'){ matTab('unite'); var frame=$('#mat-unit-frame');
    if(remote){ frame.innerHTML='<iframe id="mat-uni-if" title="Sayfa"></iframe>'; applyZoom();
      fetch(materialProxy(m.value),{headers:{apikey:SUPABASE_ANON_KEY}}).then(function(r){return r.text();}).then(function(h){ var f=document.getElementById('mat-uni-if'); if(f){ f.srcdoc=h; applyZoom(); } }).catch(function(){ frame.innerHTML='<div class="mat-empty">Sayfa yüklenemedi.</div>'; });
    } else { frame.innerHTML='<iframe id="mat-uni-if" src="'+esc(new URL(m.value,'https://gringlizce.com/').href)+'" title="Sayfa"></iframe>'; applyZoom(); attachMatScrollBroadcast(); }
  }
  applyZoom();
  if(!remote&&STATE.matShared){ sendData({t:'mat',kind:m.kind,value:m.value}); }
}
function applyZoom(){ $$('.mat-frame iframe').forEach(function(f){ try{ f.style.zoom=STATE.matZoom; }catch(e){} }); var v=$('#mat-zoom-val'); if(v)v.textContent=Math.round(STATE.matZoom*100)+'%'; }
function materialProxy(f){ return SUPABASE_URL+'/functions/v1/grimeet-material?f='+encodeURIComponent(f); }
function throttle(fn,ms){ var last=0,timer=null; return function(){ var now=Date.now(),wait=ms-(now-last); if(wait<=0){ last=now; fn(); } else { clearTimeout(timer); timer=setTimeout(function(){ last=Date.now(); fn(); },wait); } }; }
function attachMatScrollBroadcast(){ var itf=document.getElementById('mat-uni-if'); if(!itf)return;
  itf.addEventListener('load',function(){ try{ var w=itf.contentWindow;
    var bc=throttle(function(){ if(!STATE.matShared)return; try{ var d=w.document.documentElement||w.document.body; var max=(d.scrollHeight-w.innerHeight)||1; var y=(w.scrollY||w.pageYOffset||0); sendData({t:'mat-scroll',frac:Math.max(0,Math.min(1,y/max))}); }catch(e){} },160);
    w.addEventListener('scroll',bc,{passive:true});
  }catch(e){} });
}
function applyMatScroll(frac){ try{ var itf=document.getElementById('mat-uni-if'); if(!itf||!itf.contentWindow)return; var w=itf.contentWindow; var d=w.document.documentElement||w.document.body; var max=(d.scrollHeight-w.innerHeight)||1; w.scrollTo(0,frac*max); }catch(e){} }
var _ytApiP=null;
function loadYtApi(){ if(window.YT&&window.YT.Player) return Promise.resolve(); if(_ytApiP) return _ytApiP; _ytApiP=new Promise(function(res){ var prev=window.onYouTubeIframeAPIReady; window.onYouTubeIframeAPIReady=function(){ if(prev)try{prev();}catch(e){} res(); }; var s=document.createElement('script'); s.src='https://www.youtube.com/iframe_api'; document.head.appendChild(s); }); return _ytApiP; }
function ensureYtPlayer(id){
  loadYtApi().then(function(){
    clearInterval(STATE._ytHb);
    var host=$('#mat-yt-frame'); host.innerHTML='<div id="yt-player" style="width:100%;height:100%"></div>';
    if(STATE.ytPlayer&&STATE.ytPlayer.destroy){ try{STATE.ytPlayer.destroy();}catch(e){} }
    STATE.ytPlayer=new YT.Player('yt-player',{ videoId:id, playerVars:{rel:0,modestbranding:1,enablejsapi:1,origin:location.origin}, events:{
      onReady:function(){ applyZoom(); if(STATE._ytPending){ applyYtSync(STATE._ytPending); STATE._ytPending=null; }
        if(STATE.isHost){ STATE._ytHb=setInterval(function(){ if(!STATE.matShared||!STATE.ytPlayer||!STATE.ytPlayer.getPlayerState)return; try{ var st=STATE.ytPlayer.getPlayerState(); if(st===1) sendData({t:'yt-sync',state:1,time:STATE.ytPlayer.getCurrentTime(),id:id}); }catch(e){} },4000); } },
      onStateChange:function(e){ if(STATE.isHost&&STATE.matShared){ try{ sendData({t:'yt-sync',state:e.data,time:STATE.ytPlayer.getCurrentTime(),id:id}); }catch(er){} } }
    }});
  });
}
function applyYtSync(msg){ var p=STATE.ytPlayer; if(!p||!p.seekTo){ STATE._ytPending=msg; return; } try{ if(typeof msg.time==='number'){ var cur=p.getCurrentTime?p.getCurrentTime():0; if(Math.abs(cur-msg.time)>1.3) p.seekTo(msg.time,true); } if(msg.state===1) p.playVideo(); else if(msg.state===2||msg.state===0) p.pauseVideo(); }catch(e){} }
function normalizePath(u){ return String(u).replace(/^https?:\/\/[^\/]+\//i,'').replace(/^\/+/,''); }
function buildPresets(){ var el=$('#mat-presets'); if(!el)return; var P=[
  {l:'IELTS Listening',p:'ielts-bolum-calisma.html?bolum=listening'},{l:'IELTS Reading',p:'ielts-bolum-calisma.html?bolum=reading'},
  {l:'IELTS Writing',p:'ielts-bolum-calisma.html?bolum=writing'},{l:'IELTS Deneme',p:'ielts-deneme.html'},
  {l:'TOEFL',p:'toefl-ogren.html'},{l:'YDS',p:'yds-ogren.html'},{l:'YDT',p:'ydt-ogren.html'},
  {l:'SAT Öğren',p:'sat-ogren.html'},{l:'Seviye Testi',p:'seviye-belirleme.html'}
];
  P.forEach(function(x){ var b=document.createElement('button'); b.textContent=x.l; b.addEventListener('click',function(){ var u=$('#mat-page-url'); if(u)u.value=x.p; loadMaterial({kind:'unit',value:x.p},false); }); el.appendChild(b); }); }
function matTab(which){ $$('.mat-tab').forEach(function(x){x.classList.toggle('active',x.dataset.mat===which);}); $$('.mat-pane').forEach(function(p){p.classList.toggle('hidden',p.getAttribute('data-mat-pane')!==which);}); var lk=$('#mat-lock'); if(lk) lk.classList.toggle('on',which==='unite'); }
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
function downloadBlob(blob){ var url=URL.createObjectURL(blob),a=document.createElement('a'),d=new Date(); a.href=url; a.download='gri-meet-ders-'+d.getFullYear()+pad(d.getMonth()+1)+pad(d.getDate())+'-'+pad(d.getHours())+pad(d.getMinutes())+'.webm'; document.body.appendChild(a); a.click(); setTimeout(function(){ URL.revokeObjectURL(url); a.remove(); },1000); toast('Kayıt indirildi.'); }

/* ================= WHITEBOARD ================= */
var WB=(function(){
  var cv,ctx,wrap,W=0,H=0,dpr=1,tool='pen',color='#1b1b1b',size=4;
  var items=[],drawing=false,cur=null,startPt=null,sel=null,dragOff=null,clip=null;
  var COLORS=['#1b1b1b','#d64545','#2E6E6A','#2E5E8A','#B78A2E','#7E3A56','#3E6B4A','#ffffff'];
  function canEdit(){ return true; }
  function init(){
    cv=$('#gmr-canvas'); if(!cv)return; ctx=cv.getContext('2d'); wrap=$('#gmr-board-canvaswrap');
    var cw=$('#wb-colors'); COLORS.forEach(function(c,i){ var b=document.createElement('button'); b.style.background=c; if(i===0)b.classList.add('on'); b.dataset.color=c; cw.appendChild(b); });
    cw.addEventListener('click',function(e){ var b=e.target.closest('[data-color]'); if(!b)return; color=b.dataset.color; $$('#wb-colors button').forEach(function(x){x.classList.remove('on');}); b.classList.add('on'); });
    $('#wb-size').addEventListener('input',function(){ size=parseInt(this.value,10); });
    $$('.wb-tool').forEach(function(b){ b.addEventListener('click',function(){ tool=b.dataset.tool; $$('.wb-tool').forEach(function(x){x.classList.remove('active');}); b.classList.add('active'); cv.style.cursor=(tool==='select')?'move':((tool==='text'||tool==='bullet')?'text':'crosshair'); }); });
    $('#wb-image').addEventListener('click',function(){ $('#wb-file').click(); });
    $('#wb-file').addEventListener('change',onImage);
    $('#wb-copy').addEventListener('click',function(){ if(sel!=null){ clip=JSON.parse(JSON.stringify(strip(items[sel]))); toast('Kopyalandı.'); } });
    $('#wb-cut').addEventListener('click',function(){ if(sel!=null){ clip=JSON.parse(JSON.stringify(strip(items[sel]))); items.splice(sel,1); sel=null; redraw(); broadcast(); } });
    $('#wb-paste').addEventListener('click',function(){ if(clip){ var it=JSON.parse(JSON.stringify(clip)); shift(it,26,26); items.push(it); sel=items.length-1; redraw(); broadcast(); } });
    $('#wb-undo').addEventListener('click',function(){ items.pop(); sel=null; redraw(); broadcast(); });
    $('#wb-clear').addEventListener('click',function(){ if(confirm('Tahta temizlensin mi?')){ items=[]; sel=null; redraw(); broadcast(); } });
    cv.addEventListener('pointerdown',down); cv.addEventListener('pointermove',move); window.addEventListener('pointerup',up);
    window.addEventListener('resize',resize);
    document.addEventListener('keydown',function(e){ if(STATE.mode!=='board')return; var m=(e.ctrlKey||e.metaKey); if(m&&e.key==='c')$('#wb-copy').click(); else if(m&&e.key==='x')$('#wb-cut').click(); else if(m&&e.key==='v')$('#wb-paste').click(); else if(m&&e.key==='z')$('#wb-undo').click(); else if(e.key==='Delete'&&sel!=null){ items.splice(sel,1);sel=null;redraw();broadcast(); } });
    if(window.ResizeObserver){ try{ new ResizeObserver(function(){ resize(); }).observe(wrap); }catch(e){} }
    resize();
  }
  function strip(it){ var c=Object.assign({},it); delete c._img; return c; }
  function resize(){ if(!cv||!wrap)return; var r=wrap.getBoundingClientRect(); if(!r.width)return; dpr=window.devicePixelRatio||1; cv.width=r.width*dpr; cv.height=r.height*dpr; W=r.width;H=r.height; ctx.setTransform(dpr,0,0,dpr,0,0); redraw(); }
  function pos(e){ var r=cv.getBoundingClientRect(); return {x:e.clientX-r.left,y:e.clientY-r.top}; }
  function shift(it,dx,dy){ if(it.points)it.points.forEach(function(p){p.x+=dx;p.y+=dy;}); else{ it.x+=dx; it.y+=dy; } }
  function bbox(it){ if(it.points){ var xs=it.points.map(function(p){return p.x;}),ys=it.points.map(function(p){return p.y;}); return {x:Math.min.apply(0,xs),y:Math.min.apply(0,ys),w:Math.max.apply(0,xs)-Math.min.apply(0,xs),h:Math.max.apply(0,ys)-Math.min.apply(0,ys)}; } if(it.type==='text'){ var lines=it.lines||[it.text||'']; var mw=0; lines.forEach(function(l){ mw=Math.max(mw,(l||'').length); }); return {x:it.x,y:it.y-it.size,w:mw*it.size*0.56,h:lines.length*it.size*1.25}; } return {x:Math.min(it.x,it.x+it.w),y:Math.min(it.y,it.y+it.h),w:Math.abs(it.w),h:Math.abs(it.h)}; }
  function hit(pt){ for(var i=items.length-1;i>=0;i--){ var b=bbox(items[i]); if(pt.x>=b.x-6&&pt.x<=b.x+b.w+6&&pt.y>=b.y-6&&pt.y<=b.y+b.h+6)return i; } return -1; }
  function down(e){ e.preventDefault(); if(!W||!H){ resize(); if(!W||!H)return; } var p=pos(e);
    if(tool==='select'){ sel=hit(p); if(sel>=0)dragOff={x:p.x,y:p.y,orig:JSON.parse(JSON.stringify(strip(items[sel])))}; redraw(); return; }
    if(tool==='text'||tool==='bullet'){ placeText(p.x,p.y,tool==='bullet'); return; }
    drawing=true; startPt=p;
    if(tool==='pen'||tool==='highlighter'||tool==='eraser'){ cur={type:tool,color:tool==='eraser'?'#fbfaf6':color,size:tool==='highlighter'?size*3:(tool==='eraser'?size*4:size),points:[p],alpha:tool==='highlighter'?0.35:1}; items.push(cur); }
    else { cur={type:tool,x:p.x,y:p.y,w:0,h:0,color:color,size:size}; items.push(cur); }
  }
  function move(e){ var p=pos(e);
    if(tool==='select'&&sel!=null&&sel>=0&&dragOff){ var o=dragOff.orig; items[sel]=JSON.parse(JSON.stringify(o)); shift(items[sel],p.x-dragOff.x,p.y-dragOff.y); redraw(); return; }
    if(!drawing||!cur)return; if(cur.points)cur.points.push(p); else{ cur.w=p.x-startPt.x; cur.h=p.y-startPt.y; } redraw();
  }
  function up(){ if(tool==='select'&&dragOff){ dragOff=null; broadcast(); } if(drawing){ drawing=false; cur=null; broadcast(); } }
  function placeText(x,y,bullet){
    var ex=$('#gmr-wb-textarea'); if(ex)ex.remove();
    var ta=document.createElement('textarea'); ta.id='gmr-wb-textarea';
    var fs=Math.max(18,size*4); ta.style.left=x+'px'; ta.style.top=(y-fs*0.9)+'px'; ta.style.color=color; ta.style.fontSize=fs+'px'; ta.rows=1;
    ta.placeholder=bullet?'Her satır bir madde…':'Metin…';
    wrap.appendChild(ta); ta.focus();
    function commit(){ var v=(ta.value||'').replace(/\s+$/,''); if(v){ var lines=v.split('\n'); if(bullet)lines=lines.map(function(l){return l.trim()?'•  '+l:l;}); items.push({type:'text',x:x,y:y,lines:lines,color:color,size:fs}); redraw(); broadcast(); } ta.remove(); }
    ta.addEventListener('blur',commit);
    ta.addEventListener('input',function(){ ta.style.height='auto'; ta.style.height=ta.scrollHeight+'px'; });
    ta.addEventListener('keydown',function(e){ if(e.key==='Escape'){ ta.value=''; ta.blur(); } else if(e.key==='Enter'&&(e.ctrlKey||e.metaKey)){ ta.blur(); } });
  }
  function onImage(e){ var f=e.target.files[0]; if(!f)return; var rd=new FileReader(); rd.onload=function(){ var img=new Image(); img.onload=function(){ var mw=Math.min(340,img.width),ratio=img.height/img.width; items.push({type:'img',x:W/2-mw/2,y:H/2-mw*ratio/2,w:mw,h:mw*ratio,src:rd.result,_img:img}); redraw(); broadcast(); }; img.src=rd.result; }; rd.readAsDataURL(f); e.target.value=''; }
  function drawItem(it){
    ctx.save(); ctx.globalAlpha=it.alpha||1; ctx.strokeStyle=it.color; ctx.fillStyle=it.color; ctx.lineWidth=it.size||3; ctx.lineCap='round'; ctx.lineJoin='round';
    if(it.type==='pen'||it.type==='highlighter'||it.type==='eraser'){ ctx.beginPath(); it.points.forEach(function(p,i){ i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y); }); ctx.stroke(); }
    else if(it.type==='line'){ ctx.beginPath(); ctx.moveTo(it.x,it.y); ctx.lineTo(it.x+it.w,it.y+it.h); ctx.stroke(); }
    else if(it.type==='arrow'){ ctx.beginPath(); ctx.moveTo(it.x,it.y); ctx.lineTo(it.x+it.w,it.y+it.h); ctx.stroke(); var ang=Math.atan2(it.h,it.w),L=10+it.size; ctx.beginPath(); ctx.moveTo(it.x+it.w,it.y+it.h); ctx.lineTo(it.x+it.w-L*Math.cos(ang-0.4),it.y+it.h-L*Math.sin(ang-0.4)); ctx.moveTo(it.x+it.w,it.y+it.h); ctx.lineTo(it.x+it.w-L*Math.cos(ang+0.4),it.y+it.h-L*Math.sin(ang+0.4)); ctx.stroke(); }
    else if(it.type==='rect'){ ctx.strokeRect(it.x,it.y,it.w,it.h); }
    else if(it.type==='ellipse'){ ctx.beginPath(); ctx.ellipse(it.x+it.w/2,it.y+it.h/2,Math.abs(it.w/2),Math.abs(it.h/2),0,0,7); ctx.stroke(); }
    else if(it.type==='text'){ ctx.font='600 '+it.size+'px Inter,sans-serif'; ctx.textBaseline='alphabetic'; var lines=it.lines||[it.text||'']; lines.forEach(function(l,i){ ctx.fillText(l,it.x,it.y+i*it.size*1.25); }); }
    else if(it.type==='img'){ var im=it._img; if(!im){ im=new Image(); im.onload=redraw; im.src=it.src; it._img=im; } if(im.complete)ctx.drawImage(im,it.x,it.y,it.w,it.h); }
    ctx.restore();
  }
  function redraw(){ if(!ctx)return; ctx.clearRect(0,0,W,H); ctx.fillStyle='#fbfaf6'; ctx.fillRect(0,0,W,H); items.forEach(drawItem); if(sel!=null&&sel>=0&&items[sel]){ var b=bbox(items[sel]); ctx.save(); ctx.strokeStyle='#2E6E6A'; ctx.setLineDash([6,4]); ctx.lineWidth=1.5; ctx.strokeRect(b.x-6,b.y-6,b.w+12,b.h+12); ctx.restore(); } }
  function broadcast(){ sendData({t:'wb',items:items.map(strip)}); }
  function applyRemote(msg){ if(!msg.items)return; items=msg.items; items.forEach(function(it){ if(it.type==='img'&&it.src&&!it._img){ var im=new Image(); im.onload=redraw; im.src=it.src; it._img=im; } }); redraw(); }
  return {init:init,resize:resize,applyRemote:applyRemote,getCanvas:function(){return cv;},items:function(){return items.map(strip);}};
})();

/* ================= ANNOTATION OVERLAY (materyal üstü çizim) ================= */
var ANNO=(function(){
  var cv,ctx,W=0,H=0,dpr=1,tool='pen',color='#d64545',strokes=[],cur=null,drawing=false;
  var COLORS=['#d64545','#2E6E6A','#2E5E8A','#B78A2E','#1b1b1b','#ffffff'];
  function init(){ cv=$('#anno-canvas'); if(!cv)return; ctx=cv.getContext('2d');
    var cc=$('#anno-colors'); COLORS.forEach(function(c,i){ var b=document.createElement('button'); b.style.background=c; if(i===0)b.classList.add('on'); b.dataset.color=c; cc.appendChild(b); });
    cc.addEventListener('click',function(e){ var b=e.target.closest('[data-color]'); if(!b)return; color=b.dataset.color; $$('#anno-colors button').forEach(function(x){x.classList.remove('on');}); b.classList.add('on'); });
    $$('.anno-tool[data-atool]').forEach(function(b){ b.addEventListener('click',function(){ tool=b.dataset.atool; $$('.anno-tool[data-atool]').forEach(function(x){x.classList.remove('active');}); b.classList.add('active'); }); });
    $('#anno-clear').addEventListener('click',function(){ strokes=[]; redraw(); broadcast(); });
    cv.addEventListener('pointerdown',down); cv.addEventListener('pointermove',move); window.addEventListener('pointerup',up);
    if(window.ResizeObserver){ try{ new ResizeObserver(function(){ resize(); }).observe(cv); }catch(e){} }
    window.addEventListener('resize',resize); resize();
  }
  function resize(){ if(!cv)return; var r=cv.getBoundingClientRect(); if(!r.width)return; dpr=window.devicePixelRatio||1; cv.width=r.width*dpr; cv.height=r.height*dpr; W=r.width;H=r.height; ctx.setTransform(dpr,0,0,dpr,0,0); redraw(); }
  function pos(e){ var r=cv.getBoundingClientRect(); return {x:(e.clientX-r.left)/r.width, y:(e.clientY-r.top)/r.height}; }
  function down(e){ e.preventDefault(); if(!W||!H){ resize(); if(!W||!H)return; } drawing=true; var p=pos(e); cur={tool:tool,color:tool==='eraser'?null:color,size:(tool==='highlighter'?11:tool==='eraser'?26:3)/1000,alpha:tool==='highlighter'?0.35:1,pts:[p]}; strokes.push(cur); redraw(); }
  function move(e){ if(!drawing||!cur)return; cur.pts.push(pos(e)); redraw(); }
  function up(){ if(drawing){ drawing=false; cur=null; broadcast(); } }
  function drawStroke(s){ ctx.save(); if(s.tool==='eraser'){ ctx.globalCompositeOperation='destination-out'; ctx.strokeStyle='rgba(0,0,0,1)'; } else { ctx.globalAlpha=s.alpha||1; ctx.strokeStyle=s.color; } ctx.lineWidth=Math.max(1,(s.size||0.003)*W); ctx.lineCap='round'; ctx.lineJoin='round'; ctx.beginPath(); s.pts.forEach(function(p,i){ var x=p.x*W,y=p.y*H; i?ctx.lineTo(x,y):ctx.moveTo(x,y); }); ctx.stroke(); ctx.restore(); }
  function redraw(){ if(!ctx)return; ctx.clearRect(0,0,W,H); strokes.forEach(drawStroke); }
  function broadcast(){ sendData({t:'anno',strokes:strokes}); }
  function applyRemote(s){ if(!s)return; strokes=s; resize(); }
  function reset(bc){ strokes=[]; redraw(); if(bc)broadcast(); }
  return {init:init,resize:resize,applyRemote:applyRemote,reset:reset};
})();

/* ================= BOOT ================= */
function boot(){
  if(!STATE.room) STATE.room='DEMO'+Math.floor(Math.random()*90+10);
  try{ STATE.bg=localStorage.getItem('gm-bg')||'none'; }catch(e){}
  initSupabase();
  bindControls(); bindDockTabs(); bindChat(); bindHostActions(); bindTools(); bindMaterials(); bindRecording();
  buildBgGrid(); buildThemeSel(); WB.init(); ANNO.init(); setupGate();
  window.addEventListener('beforeunload',function(){ try{ if(STATE.lkRoom)STATE.lkRoom.disconnect(); }catch(e){} });
}
if(document.readyState!=='loading') boot(); else document.addEventListener('DOMContentLoaded',boot);
})();
