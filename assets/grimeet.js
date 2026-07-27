/* ===== Gri Meet — ders odası motoru v2 ===== */
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
  bg:'none', supabase:null, tiles:{}, quizVotes:{A:0,B:0,C:0,D:0}, quizOn:false,
  currentMaterial:null, matShared:false
};

var BGS=[
  {id:'none',label:'Yok'},{id:'blur',label:'Bulanık'},
  {id:'bg-01',label:'Dağlar'},{id:'bg-02',label:'Orman & Deniz'},{id:'bg-03',label:'Yeşil Orman'},
  {id:'bg-04',label:'Şelale'},{id:'bg-05',label:'Altın Tarla'},{id:'bg-06',label:'Puslu Çayır'},
  {id:'bg-07',label:'Kayalık Sahil'},{id:'bg-08',label:'Çiçekler'},{id:'bg-09',label:'Çöl Gecesi'},
  {id:'bg-10',label:'Kır Çiçekleri'}
];
function bgFile(id){ return new URL('assets/grimeet-bg/'+id+'.jpg',location.href).href; }

var toastT;
function toast(m){var t=$('#gmr-toast');t.textContent=m;t.classList.add('show');clearTimeout(toastT);toastT=setTimeout(function(){t.classList.remove('show');},2800);}
function initials(n){n=(n||'?').trim();var p=n.split(/\s+/);return ((p[0]||'?')[0]+(p[1]?p[1][0]:'')).toUpperCase();}
function pad(n){return (n<10?'0':'')+n;}
function fmt(s){s=Math.max(0,Math.floor(s));return pad(Math.floor(s/60))+':'+pad(s%60);}
function escapeHtml(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}

function initSupabase(){ try{ if(window.supabase&&window.supabase.createClient) STATE.supabase=window.supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY); }catch(e){} }

var startTs=null;
function tickClock(){ if(startTs) $('#gmr-clock').textContent=fmt((Date.now()-startTs)/1000); }

/* ================= JOIN GATE ================= */
var gateStream=null;
function setupGate(){
  $('#gate-room-code').textContent=STATE.room||'—';
  var camOn=true,micOn=true,gv=$('#gate-video'),gp=$('.gate-preview');
  async function preview(){ try{ if(gateStream)gateStream.getTracks().forEach(function(t){t.stop();}); gateStream=await navigator.mediaDevices.getUserMedia({video:camOn,audio:false}); gv.srcObject=gateStream; gp.classList.remove('camoff'); }catch(e){ camOn=false; $('#gate-cam').classList.remove('on'); $('#gate-cam').textContent='Kamera kapalı'; gp.classList.add('camoff'); } }
  if(camOn) preview(); else gp.classList.add('camoff');
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
  if(STATE.isHost) $('#gm-app').classList.add('is-host');
  ensureSelfTile();
  connectLiveKit();
}
function ensureSelfTile(){ ensureTile('self',{name:STATE.name+' (Sen)',host:STATE.isHost}); updateGridCount(); }

/* ================= LIVEKIT ================= */
async function connectLiveKit(){
  if(!LK){ enterDemo('LiveKit yüklenemedi'); return; }
  setStatus('connecting','Bağlanıyor…');
  var token=null;
  try{
    var headers={'Content-Type':'application/json'};
    if(STATE.supabase){ try{ var s=await STATE.supabase.auth.getSession(); if(s.data&&s.data.session){ headers['Authorization']='Bearer '+s.data.session.access_token; headers['apikey']=SUPABASE_ANON_KEY; } }catch(e){} }
    var res=await fetch(TOKEN_ENDPOINT,{method:'POST',headers:headers,body:JSON.stringify({room:STATE.room,identity:STATE.identity,name:STATE.name,isHost:STATE.isHost})});
    if(res.ok){ var j=await res.json(); token=j.token; if(j.url)LIVEKIT_URL=j.url; if(j.host===false)STATE.isHost=STATE.isHost&&false; }
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
    var camPub=room.localParticipant.getTrackPublication(LK.Track.Source.Camera);
    if(camPub&&camPub.videoTrack){ STATE.camTrack=camPub.videoTrack; attachSelf(); }
    room.remoteParticipants.forEach(onParticipant);
    refreshPeople(); updateGridCount();
  }catch(e){ enterDemo('Bağlanılamadı'); }
}
function enterDemo(reason){
  STATE.demo=true; setStatus('demo','Demo modu');
  sysChat('Demo modu: '+reason+'. Gerçek video/arka plan için canlı bağlantı gerekir; tahta, materyal ve araçlar çalışır.');
  navigator.mediaDevices.getUserMedia({video:STATE.camOn,audio:false}).then(function(st){ STATE.localStream=st; attachSelf(); }).catch(function(){});
  refreshPeople(); updateGridCount();
}
function setStatus(cls,txt){ $('#gmr-status').className='gmr-status '+cls; $('#gmr-status-txt').textContent=txt; }
function isScreen(pub){ return pub&&(pub.source===LK.Track.Source.ScreenShare); }

function onParticipant(p){ ensureTile(p.identity,{name:p.name||'Öğrenci',host:isHostMeta(p)}); refreshPeople(); updateGridCount(); p.trackPublications.forEach(function(pub){ if(pub.isSubscribed&&pub.track) attachTrack(pub.track,pub,p); }); }
function isHostMeta(p){ try{ return (p.metadata&&JSON.parse(p.metadata).host)===true; }catch(e){ return false; } }

function attachTrack(track,pub,p){
  if(isScreen(pub)){ attachScreen(track,false); return; }
  var t=ensureTile(p.identity,{name:p.name||'Öğrenci',host:isHostMeta(p)});
  if(track.kind==='video'){ var v=t.querySelector('video.cam')||document.createElement('video'); v.className='cam'; v.autoplay=true;v.playsInline=true; track.attach(v); var av=t.querySelector('.avatar'); if(av)av.remove(); if(!v.parentNode)t.insertBefore(v,t.firstChild); }
  else if(track.kind==='audio'){ var a=document.createElement('audio'); a.autoplay=true; track.attach(a); t.appendChild(a); }
}
function attachSelf(){
  var t=ensureTile('self',{name:STATE.name+' (Sen)',host:STATE.isHost});
  var v=t.querySelector('video.cam');
  if(STATE.camTrack){ if(!v){ v=document.createElement('video'); v.className='cam mirror'; v.autoplay=true;v.muted=true;v.playsInline=true; } STATE.camTrack.attach(v); var av=t.querySelector('.avatar'); if(av)av.remove(); if(!v.parentNode)t.insertBefore(v,t.firstChild); }
  else if(STATE.localStream){ if(!v){ v=document.createElement('video'); v.className='cam mirror'; v.autoplay=true;v.muted=true;v.playsInline=true; v.srcObject=STATE.localStream; var av=t.querySelector('.avatar'); if(av)av.remove(); t.insertBefore(v,t.firstChild); } }
}

/* --- Screen share --- */
function attachScreen(track,local){
  var box=$('#gmr-screen'); var v=box.querySelector('video'); if(!v){ v=document.createElement('video'); v.autoplay=true;v.playsInline=true; if(local)v.muted=true; box.insertBefore(v,box.firstChild); }
  track.attach(v);
  $('#scr-label').textContent=local?'Ekranını paylaşıyorsun':'Paylaşılan ekran';
  setMode('screen');
}
function clearScreen(){ var box=$('#gmr-screen'); var v=box.querySelector('video'); if(v)v.remove(); }

/* ================= TILES ================= */
function tileEl(id){ return STATE.tiles[id]; }
function ensureTile(id,info){
  if(STATE.tiles[id]) return STATE.tiles[id];
  var t=document.createElement('div'); t.className='vtile'+(info&&info.host?' host':''); t.dataset.id=id;
  t.innerHTML='<div class="avatar"><span>'+initials(info?info.name:'?')+'</span></div>'+
    '<div class="name"><span class="nm">'+escapeHtml(info?info.name:'Öğrenci')+'</span></div>'+
    (info&&info.host?'<div class="badge">Öğretmen</div>':'')+
    (STATE.isHost&&id!=='self'?'<div class="hostctrl"><button data-act="mute" title="Sustur"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 9v3a3 3 0 0 0 5 2M9 5a3 3 0 0 1 6 0v3M4 4l16 16"/></svg></button><button data-act="kick" title="Çıkar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>':'');
  STATE.tiles[id]=t; $('#gmr-videos').appendChild(t); updateGridCount(); return t;
}
function renderPlaceholder(id){ var t=tileEl(id); if(!t)return; var v=t.querySelector('video.cam'); if(v)v.remove(); if(!t.querySelector('.avatar')){ var d=document.createElement('div'); d.className='avatar'; d.innerHTML='<span>'+initials(t.querySelector('.nm').textContent)+'</span>'; t.insertBefore(d,t.firstChild); } }
function removeTile(id){ var t=tileEl(id); if(t){t.remove(); delete STATE.tiles[id]; updateGridCount();} }
function updateMic(id,on){ var t=tileEl(id); if(!t)return; var nm=t.querySelector('.name'); var m=nm.querySelector('.mic-off'); if(!on&&!m){ var s=document.createElement('span'); s.className='mic-off'; s.textContent='🔇'; nm.appendChild(s);} else if(on&&m)m.remove(); }
function onSpeakers(sp){ var ids={}; sp.forEach(function(p){ ids[(STATE.lkRoom&&p.identity===STATE.lkRoom.localParticipant.identity)?'self':p.identity]=1; }); Object.keys(STATE.tiles).forEach(function(id){ STATE.tiles[id].classList.toggle('speaking',!!ids[id]); }); }
function updateGridCount(){ var n=Object.keys(STATE.tiles).length; $('#gmr-videos').setAttribute('data-n',n); $('#gmr-count-n').textContent=n; }

/* ================= MODE / VIEW ================= */
var MODE_LBL={grid:'Kameralar',board:'Tahta',materials:'Materyal',screen:'Ekran'};
function setMode(mode,opts){
  opts=opts||{}; STATE.mode=mode; $('#gm-app').setAttribute('data-mode',mode);
  $('#ctrl-board').classList.toggle('active',mode==='board');
  $('#ctrl-materials').classList.toggle('active',mode==='materials');
  $('#gmr-share-what').textContent=MODE_LBL[mode]||'Kameralar';
  if(mode==='board') setTimeout(WB.resize,40);
  if(STATE.isHost&&!opts.remote) sendData({t:'view',mode:mode});
}
function bindControls(){
  $('#ctrl-mic').addEventListener('click',async function(){ STATE.micOn=!STATE.micOn; this.setAttribute('data-on',STATE.micOn?'1':'0'); if(STATE.lkRoom){try{await STATE.lkRoom.localParticipant.setMicrophoneEnabled(STATE.micOn);}catch(e){}} refreshPeople(); });
  $('#ctrl-cam').addEventListener('click',async function(){ STATE.camOn=!STATE.camOn; this.setAttribute('data-on',STATE.camOn?'1':'0'); if(STATE.lkRoom){ try{ await STATE.lkRoom.localParticipant.setCameraEnabled(STATE.camOn); }catch(e){} if(!STATE.camOn) renderPlaceholder('self'); } });
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
  $('#gmr-videos').addEventListener('click',function(e){ var b=e.target.closest('[data-act]'); if(!b||!STATE.isHost)return; var id=b.closest('.vtile').dataset.id; if(b.dataset.act==='mute'){ sendData({t:'force-mute',target:id}); toast('Susturma isteği gönderildi.'); } if(b.dataset.act==='kick'){ if(confirm('Bu katılımcı çıkarılsın mı?')){ sendData({t:'kick',target:id}); toast('Çıkarma isteği gönderildi.'); } } });
  $$('[data-close-modal]').forEach(function(x){ x.addEventListener('click',function(){ x.closest('.gmr-modal').classList.add('hidden'); }); });
  $$('.gmr-modal').forEach(function(m){ m.addEventListener('click',function(e){ if(e.target===m)m.classList.add('hidden'); }); });
  bindSplit();
}
function toggleDock(which){
  var dock=$('#gmr-dock'), open=!dock.classList.contains('hidden'), cur=dock.getAttribute('data-active');
  if(open&&cur===which){ dock.classList.add('hidden'); $('#ctrl-people').classList.remove('active'); $('#ctrl-chat').classList.remove('active'); return; }
  dock.classList.remove('hidden'); dock.setAttribute('data-active',which);
  $$('.dock-tab').forEach(function(t){ t.classList.toggle('active',t.dataset.dock===which); });
  $$('.dock-pane').forEach(function(p){ p.classList.toggle('hidden',p.getAttribute('data-dock-pane')!==which); });
  $('#ctrl-people').classList.toggle('active',which==='people'); $('#ctrl-chat').classList.toggle('active',which==='chat');
}
function bindDockTabs(){ $$('.dock-tab').forEach(function(t){ t.addEventListener('click',function(){ toggleDockTab(t.dataset.dock); }); }); }
function toggleDockTab(which){ var dock=$('#gmr-dock'); dock.setAttribute('data-active',which); $$('.dock-tab').forEach(function(t){ t.classList.toggle('active',t.dataset.dock===which); }); $$('.dock-pane').forEach(function(p){ p.classList.toggle('hidden',p.getAttribute('data-dock-pane')!==which); }); }

async function shareScreen(){
  if(!STATE.lkRoom){ toast('Ekran paylaşımı için canlı bağlantı gerekli.'); return; }
  try{ var on=STATE.lkRoom.localParticipant.isScreenShareEnabled; await STATE.lkRoom.localParticipant.setScreenShareEnabled(!on); $('#ctrl-share').classList.toggle('active',!on); if(!on) setMode('screen'); else { clearScreen(); setMode('grid'); } }
  catch(e){ toast('Ekran paylaşımı iptal edildi.'); }
}
function leaveRoom(){ if(!confirm('Dersten ayrılmak istiyor musun?'))return; try{if(STATE.lkRoom)STATE.lkRoom.disconnect();}catch(e){} try{if(STATE.localStream)STATE.localStream.getTracks().forEach(function(t){t.stop();});}catch(e){} location.href='grimeet.html'; }
function leaveForce(){ try{if(STATE.lkRoom)STATE.lkRoom.disconnect();}catch(e){} location.href='grimeet.html'; }
function setSelfHand(up){ var t=tileEl('self'); if(!t)return; var h=t.querySelector('.hand'); if(up&&!h){var d=document.createElement('div');d.className='hand';d.textContent='✋';t.appendChild(d);} else if(!up&&h)h.remove(); }

/* --- Split resize --- */
function bindSplit(){
  var split=$('#gmr-split'), dragging=false;
  split.addEventListener('pointerdown',function(e){ dragging=true; split.setPointerCapture(e.pointerId); e.preventDefault(); });
  split.addEventListener('pointermove',function(e){ if(!dragging)return; var dock=$('#gmr-dock'); var right=dock.classList.contains('hidden')?window.innerWidth:dock.getBoundingClientRect().left; var w=right-e.clientX; w=Math.max(120,Math.min(560,w)); document.documentElement.style.setProperty('--strip',w+'px'); });
  split.addEventListener('pointerup',function(e){ dragging=false; try{split.releasePointerCapture(e.pointerId);}catch(_){} });
}

/* ================= DATA ================= */
var enc=new TextEncoder(),dec=new TextDecoder();
function sendData(obj){ if(!STATE.lkRoom||!STATE.connected)return; try{ STATE.lkRoom.localParticipant.publishData(enc.encode(JSON.stringify(obj)),{reliable:true}); }catch(e){} }
function onData(payload,p){
  var msg; try{ msg=JSON.parse(dec.decode(payload)); }catch(e){ return; }
  var from=p?(p.name||'Katılımcı'):'?', id=p?p.identity:null;
  if(msg.t==='chat') addChat(from,msg.text);
  else if(msg.t==='hand'){ if(id){ var tl=tileEl(id); if(tl){ var h=tl.querySelector('.hand'); if(msg.up&&!h){var d=document.createElement('div');d.className='hand';d.textContent='✋';tl.appendChild(d);} else if(!msg.up&&h)h.remove(); } } if(msg.up)sysChat(from+' el kaldırdı ✋'); }
  else if(msg.t==='view'){ if(!STATE.isHost) setMode(msg.mode,{remote:true}); }
  else if(msg.t==='mat'){ if(!STATE.isHost){ loadMaterial(msg,true); setMode('materials',{remote:true}); sysChat('Öğretmen bir materyal paylaştı.'); } }
  else if(msg.t==='mat-stop'){ if(!STATE.isHost&&STATE.mode==='materials') setMode('grid',{remote:true}); }
  else if(msg.t==='force-mute'){ if(msg.target==='*'||msg.target==='self'||(STATE.lkRoom&&msg.target===STATE.lkRoom.localParticipant.identity)){ if(!STATE.isHost){ STATE.micOn=false; $('#ctrl-mic').setAttribute('data-on','0'); if(STATE.lkRoom)STATE.lkRoom.localParticipant.setMicrophoneEnabled(false); toast('Öğretmen mikrofonunu kapattı.'); } } }
  else if(msg.t==='kick'){ if((msg.target==='self'||(STATE.lkRoom&&msg.target===STATE.lkRoom.localParticipant.identity))&&!STATE.isHost){ toast('Öğretmen seni çıkardı.'); setTimeout(leaveForce,1500); } }
  else if(msg.t==='quiz') showStudentQuiz(msg.q);
  else if(msg.t==='quiz-vote'){ if(STATE.isHost&&STATE.quizOn){ STATE.quizVotes[msg.a]=(STATE.quizVotes[msg.a]||0)+1; renderQuizTally(); } }
  else if(msg.t==='wb') WB.applyRemote(msg);
}

/* ================= CHAT / PEOPLE ================= */
function addChat(who,text){ var log=$('#chat-log'); var d=document.createElement('div'); d.className='chat-msg'; d.innerHTML='<span class="who">'+escapeHtml(who)+':</span>'+escapeHtml(text); log.appendChild(d); log.scrollTop=log.scrollHeight; }
function sysChat(text){ var log=$('#chat-log'); var d=document.createElement('div'); d.className='chat-msg sys'; d.textContent=text; log.appendChild(d); log.scrollTop=log.scrollHeight; }
function bindChat(){ function send(){ var i=$('#chat-text'); var t=(i.value||'').trim(); if(!t)return; addChat(STATE.name+' (Sen)',t); sendData({t:'chat',text:t}); i.value=''; } $('#chat-send').addEventListener('click',send); $('#chat-text').addEventListener('keydown',function(e){ if(e.key==='Enter')send(); }); }
function refreshPeople(){
  var ul=$('#people-list'); if(!ul)return; ul.innerHTML='';
  var list=[{name:STATE.name+' (Sen)',host:STATE.isHost,mic:STATE.micOn}];
  if(STATE.lkRoom) STATE.lkRoom.remoteParticipants.forEach(function(p){ list.push({name:p.name||'Öğrenci',host:isHostMeta(p),mic:p.isMicrophoneEnabled}); });
  list.forEach(function(m){ var li=document.createElement('li'); li.innerHTML='<span class="pav">'+initials(m.name)+'</span><span class="pnm">'+escapeHtml(m.name)+'</span>'+(m.host?'<span class="ptag">Öğretmen</span>':'')+'<span class="pmic'+(m.mic?'':' off')+'">'+(m.mic?'🎤':'🔇')+'</span>'; ul.appendChild(li); });
}
function bindPeople(){ var b=$('#btn-mute-all'); if(b)b.addEventListener('click',function(){ sendData({t:'force-mute',target:'*'}); toast('Herkese susturma isteği gönderildi.'); }); }

/* ================= TOOLS ================= */
var timerInt=null,timerLeft=0;
function bindTools(){
  $$('.timer-btns [data-tmin]').forEach(function(b){ b.addEventListener('click',function(){ startTimer(parseInt(b.dataset.tmin,10)*60); }); });
  $('#timer-stop').addEventListener('click',function(){ clearInterval(timerInt); timerInt=null; $('#timer-display').textContent='00:00'; });
  $('#btn-pick').addEventListener('click',pickStudent);
  var q=$('#btn-quiz'); if(q)q.addEventListener('click',sendQuiz);
  var bo=$('#btn-breakout'); if(bo)bo.addEventListener('click',makeBreakout);
}
function startTimer(sec){ clearInterval(timerInt); timerLeft=sec; $('#timer-display').textContent=fmt(timerLeft); timerInt=setInterval(function(){ timerLeft--; $('#timer-display').textContent=fmt(timerLeft); if(timerLeft<=0){ clearInterval(timerInt); timerInt=null; toast('Süre doldu!'); try{beep();}catch(e){} } },1000); }
function beep(){ var a=new (window.AudioContext||window.webkitAudioContext)(); var o=a.createOscillator(); o.connect(a.destination); o.frequency.value=880; o.start(); setTimeout(function(){o.stop();a.close();},350); }
function studentNames(){ var names=[]; if(STATE.lkRoom)STATE.lkRoom.remoteParticipants.forEach(function(p){ if(!isHostMeta(p))names.push(p.name||'Öğrenci'); }); if(!STATE.isHost)names.push(STATE.name); return names; }
function pickStudent(){ var names=studentNames(); if(!names.length){ $('#pick-result').textContent='Öğrenci yok.'; return; } var i=0,n=0,max=14+Math.floor(Math.random()*8),el=$('#pick-result'); var iv=setInterval(function(){ el.textContent=names[i%names.length]; i++; n++; if(n>=max){ clearInterval(iv); el.textContent='🎯 '+names[Math.floor(Math.random()*names.length)]; } },80); }
function sendQuiz(){ var q=($('#quiz-q').value||'').trim()||'Doğru cevap hangisi?'; STATE.quizOn=true; STATE.quizVotes={A:0,B:0,C:0,D:0}; sendData({t:'quiz',q:q}); renderQuizTally(); toast('Quiz gönderildi.'); }
function renderQuizTally(){ var el=$('#quiz-tally'); if(!el)return; var tot=(STATE.quizVotes.A+STATE.quizVotes.B+STATE.quizVotes.C+STATE.quizVotes.D)||1; el.innerHTML=['A','B','C','D'].map(function(k){ return '<div class="qrow"><b>'+k+'</b><div class="qbar" style="width:'+(STATE.quizVotes[k]/tot*150)+'px"></div><span>'+STATE.quizVotes[k]+'</span></div>'; }).join(''); }
function showStudentQuiz(q){ toggleDock('tools'); toggleDockTab('tools'); var body=$('.dock-pane[data-dock-pane="tools"]'); if(!body)return; var box=document.createElement('div'); box.className='tool-box'; box.style.borderColor='var(--gm-gold)'; box.innerHTML='<div class="tool-box-h">Quiz: '+escapeHtml(q)+'</div><div class="mat-row" style="margin:0">'+['A','B','C','D'].map(function(k){return '<button class="dock-btn" data-vote="'+k+'" style="flex:1;margin:0">'+k+'</button>';}).join('')+'</div>'; body.insertBefore(box,body.firstChild); box.addEventListener('click',function(e){ var b=e.target.closest('[data-vote]'); if(!b)return; sendData({t:'quiz-vote',a:b.dataset.vote}); box.innerHTML='<div class="tool-box-h">Cevabın: '+b.dataset.vote+' ✓</div>'; }); }
function makeBreakout(){ var names=studentNames().filter(function(n){return n!==STATE.name||!STATE.isHost;}); names=studentNames(); if(!names.length){ $('#bo-result').textContent='Öğrenci yok.'; return; } var n=Math.max(2,Math.min(5,parseInt($('#bo-count').value,10)||2)); for(var i=names.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)); var t=names[i];names[i]=names[j];names[j]=t; } var groups=[]; for(var g=0;g<n;g++)groups.push([]); names.forEach(function(nm,idx){ groups[idx%n].push(nm); }); $('#bo-result').innerHTML=groups.map(function(gr,idx){ return '<div style="margin-bottom:6px"><b>Grup '+(idx+1)+':</b> '+gr.map(escapeHtml).join(', ')+'</div>'; }).join('')+'<div class="mat-resize-note">Ayrı ses odaları yakında; şimdilik grup listesi.</div>'; }

/* ================= BACKGROUND (segmentation) ================= */
var TP=null,tpTried=false;
async function loadTP(){ if(TP||tpTried)return TP; tpTried=true; try{ TP=await import('https://esm.sh/@livekit/track-processors'); }catch(e){ try{ TP=await import('https://cdn.jsdelivr.net/npm/@livekit/track-processors/+esm'); }catch(e2){ TP=null; } } return TP; }
function buildBgGrid(){
  var g=$('#bg-grid'); g.innerHTML='';
  BGS.forEach(function(b){ var d=document.createElement('button'); d.className='bg-opt '+(b.id==='none'?'none':b.id==='blur'?'blur':'')+(STATE.bg===b.id?' on':''); d.dataset.bg=b.id; if(b.id!=='none'&&b.id!=='blur') d.style.backgroundImage='url("'+bgFile(b.id)+'")'; d.innerHTML='<span>'+b.label+'</span>'; d.addEventListener('click',function(){ $$('.bg-opt').forEach(function(x){x.classList.remove('on');}); d.classList.add('on'); applyBackground(b.id); }); g.appendChild(d); });
}
async function applyBackground(bg){
  STATE.bg=bg; var track=STATE.camTrack;
  if(!track){ toast(STATE.demo?'Arka plan için canlı bağlantı gerekli.':'Kamera açık değil.'); return; }
  var note=$('#bg-note'); if(note)note.textContent='Uygulanıyor…';
  try{
    if(bg==='none'){ if(track.getProcessor&&track.getProcessor()) await track.stopProcessor(); }
    else{ var tp=await loadTP(); if(!tp){ toast('Bu tarayıcıda arka plan efekti desteklenmiyor.'); if(note)note.textContent='Bu tarayıcıda desteklenmiyor.'; return; }
      if(bg==='blur') await track.setProcessor(tp.BackgroundBlur(14));
      else await track.setProcessor(tp.VirtualBackground(bgFile(bg))); }
    if(note)note.textContent='Kişiyi arka plandan ayırma ilk seçimde birkaç saniye sürebilir.';
    setTimeout(function(){ $('#bg-modal').classList.add('hidden'); },300);
  }catch(e){ toast('Arka plan uygulanamadı.'); if(note)note.textContent='Uygulanamadı.'; }
}

/* ================= MATERIALS ================= */
function bindMaterials(){
  $('#gmr-mat-close').addEventListener('click',function(){ setMode('grid'); });
  $$('.mat-tab').forEach(function(t){ t.addEventListener('click',function(){ $$('.mat-tab').forEach(function(x){x.classList.remove('active');}); t.classList.add('active'); $$('.mat-pane').forEach(function(p){ p.classList.toggle('hidden',p.getAttribute('data-mat-pane')!==t.dataset.mat); }); }); });
  $('#mat-yt-load').addEventListener('click',function(){ var u=$('#mat-yt-url').value.trim(); if(!u)return; loadMaterial({kind:'yt',value:u},false); });
  buildUnitSelectors();
  $('#mat-unit-load').addEventListener('click',function(){ var f=$('#mat-unit').value; if(!f)return; loadMaterial({kind:'unit',value:f},false); });
  var sh=$('#mat-share'); if(sh) sh.addEventListener('click',function(){
    if(!STATE.currentMaterial){ toast('Önce bir materyal aç.'); return; }
    if(!STATE.matShared){ sendData({t:'mat',kind:STATE.currentMaterial.kind,value:STATE.currentMaterial.value}); STATE.matShared=true; sh.textContent='Paylaşımı Durdur'; sh.classList.add('stop'); toast('Öğrencilere paylaşıldı.'); }
    else { sendData({t:'mat-stop'}); STATE.matShared=false; sh.textContent='Öğrencilerle Paylaş'; sh.classList.remove('stop'); toast('Paylaşım durduruldu.'); }
  });
}
function ytId(u){ var m=String(u).match(/(?:v=|youtu\.be\/|embed\/)([\w-]{11})/); return m?m[1]:(String(u).length===11?u:null); }
function loadMaterial(m,remote){
  STATE.currentMaterial={kind:m.kind,value:m.value};
  if(m.kind==='yt'){ var id=ytId(m.value); if(!id){ if(!remote)toast('Geçerli YouTube bağlantısı değil.'); return; } $('#mat-yt-frame').innerHTML='<iframe src="https://www.youtube.com/embed/'+id+'?rel=0" allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture" allowfullscreen></iframe>'; $$('.mat-tab').forEach(function(x){x.classList.toggle('active',x.dataset.mat==='youtube');}); $$('.mat-pane').forEach(function(p){p.classList.toggle('hidden',p.getAttribute('data-mat-pane')!=='youtube');}); }
  else if(m.kind==='unit'){ $('#mat-unit-frame').innerHTML='<iframe src="'+escapeHtml(m.value)+'" title="Ünite"></iframe>'; $$('.mat-tab').forEach(function(x){x.classList.toggle('active',x.dataset.mat==='unite');}); $$('.mat-pane').forEach(function(p){p.classList.toggle('hidden',p.getAttribute('data-mat-pane')!=='unite');}); }
  if(!remote&&STATE.matShared){ sendData({t:'mat',kind:m.kind,value:m.value}); }
}
function buildUnitSelectors(){
  var tracks=[{v:'',t:'Adult'},{v:'teen-',t:'Teen'},{v:'junior-',t:'Junior'}], levels=['a1','a2','b1','b2','c1','c2'];
  var tSel=$('#mat-track'),lSel=$('#mat-level'),uSel=$('#mat-unit');
  tracks.forEach(function(x){ var o=document.createElement('option'); o.value=x.v; o.textContent=x.t; tSel.appendChild(o); });
  levels.forEach(function(l){ var o=document.createElement('option'); o.value=l; o.textContent=l.toUpperCase(); lSel.appendChild(o); });
  function fill(){ uSel.innerHTML=''; for(var i=1;i<=21;i++){ var f='genel-'+tSel.value+lSel.value+'-unite-'+i+'.html'; var o=document.createElement('option'); o.value=f; o.textContent='Ünite '+i; uSel.appendChild(o); } }
  tSel.addEventListener('change',fill); lSel.addEventListener('change',fill); fill();
}

/* ================= WHITEBOARD ================= */
var WB=(function(){
  var cv,ctx,wrap,W=0,H=0,dpr=1,tool='pen',color='#1b1b1b',size=4;
  var items=[],drawing=false,cur=null,startPt=null,sel=null,dragOff=null,clip=null;
  var COLORS=['#1b1b1b','#d64545','#2E6E6A','#2E5E8A','#B78A2E','#7E3A56','#3E6B4A','#ffffff'];
  function init(){
    cv=$('#gmr-canvas'); if(!cv)return; ctx=cv.getContext('2d'); wrap=$('#gmr-board-canvaswrap');
    var cw=$('#wb-colors'); COLORS.forEach(function(c,i){ var b=document.createElement('button'); b.style.background=c; if(i===0)b.classList.add('on'); b.dataset.color=c; cw.appendChild(b); });
    cw.addEventListener('click',function(e){ var b=e.target.closest('[data-color]'); if(!b)return; color=b.dataset.color; $$('#wb-colors button').forEach(function(x){x.classList.remove('on');}); b.classList.add('on'); });
    $('#wb-size').addEventListener('input',function(){ size=parseInt(this.value,10); });
    $$('.wb-tool').forEach(function(b){ b.addEventListener('click',function(){ tool=b.dataset.tool; $$('.wb-tool').forEach(function(x){x.classList.remove('active');}); b.classList.add('active'); cv.style.cursor=(tool==='select')?'move':((tool==='text'||tool==='bullet')?'text':'crosshair'); }); });
    $('#wb-image').addEventListener('click',function(){ $('#wb-file').click(); });
    $('#wb-file').addEventListener('change',onImage);
    $('#wb-copy').addEventListener('click',function(){ if(sel!=null){ clip=JSON.parse(JSON.stringify(strip(items[sel]))); toast('Kopyalandı.'); } });
    $('#wb-cut').addEventListener('click',function(){ if(sel!=null){ clip=JSON.parse(JSON.stringify(strip(items[sel]))); items.splice(sel,1); sel=null; redraw(); broadcast(); toast('Kesildi.'); } });
    $('#wb-paste').addEventListener('click',function(){ if(clip){ var it=JSON.parse(JSON.stringify(clip)); shift(it,26,26); items.push(it); sel=items.length-1; redraw(); broadcast(); } });
    $('#wb-undo').addEventListener('click',function(){ items.pop(); sel=null; redraw(); broadcast(); });
    $('#wb-clear').addEventListener('click',function(){ if(confirm('Tahta temizlensin mi?')){ items=[]; sel=null; redraw(); broadcast(); } });
    cv.addEventListener('pointerdown',down); cv.addEventListener('pointermove',move); window.addEventListener('pointerup',up);
    window.addEventListener('resize',resize);
    document.addEventListener('keydown',function(e){ if(STATE.mode!=='board')return; var m=(e.ctrlKey||e.metaKey); if(m&&e.key==='c')$('#wb-copy').click(); else if(m&&e.key==='x')$('#wb-cut').click(); else if(m&&e.key==='v')$('#wb-paste').click(); else if(m&&e.key==='z')$('#wb-undo').click(); else if(e.key==='Delete'&&sel!=null){ items.splice(sel,1);sel=null;redraw();broadcast(); } });
    resize();
  }
  function strip(it){ var c=Object.assign({},it); delete c._img; return c; }
  function resize(){ if(!cv||!wrap)return; var r=wrap.getBoundingClientRect(); if(!r.width)return; dpr=window.devicePixelRatio||1; cv.width=r.width*dpr; cv.height=r.height*dpr; W=r.width;H=r.height; ctx.setTransform(dpr,0,0,dpr,0,0); redraw(); }
  function pos(e){ var r=cv.getBoundingClientRect(); return {x:e.clientX-r.left,y:e.clientY-r.top}; }
  function shift(it,dx,dy){ if(it.points)it.points.forEach(function(p){p.x+=dx;p.y+=dy;}); else{ it.x+=dx; it.y+=dy; } }
  function bbox(it){ if(it.points){ var xs=it.points.map(function(p){return p.x;}),ys=it.points.map(function(p){return p.y;}); return {x:Math.min.apply(0,xs),y:Math.min.apply(0,ys),w:Math.max.apply(0,xs)-Math.min.apply(0,xs),h:Math.max.apply(0,ys)-Math.min.apply(0,ys)}; } if(it.type==='text'){ var lines=it.lines||[it.text||'']; var mw=0; lines.forEach(function(l){ mw=Math.max(mw,(l||'').length); }); return {x:it.x,y:it.y-it.size,w:mw*it.size*0.56,h:lines.length*it.size*1.25}; } return {x:Math.min(it.x,it.x+it.w),y:Math.min(it.y,it.y+it.h),w:Math.abs(it.w),h:Math.abs(it.h)}; }
  function hit(pt){ for(var i=items.length-1;i>=0;i--){ var b=bbox(items[i]); if(pt.x>=b.x-6&&pt.x<=b.x+b.w+6&&pt.y>=b.y-6&&pt.y<=b.y+b.h+6)return i; } return -1; }
  function down(e){ e.preventDefault(); var p=pos(e);
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
  return {init:init,resize:resize,applyRemote:applyRemote,getCanvas:function(){return cv;}};
})();

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

/* ================= BOOT ================= */
function boot(){
  if(!STATE.room) STATE.room='DEMO'+Math.floor(Math.random()*90+10);
  initSupabase();
  bindControls(); bindDockTabs(); bindChat(); bindPeople(); bindTools(); bindMaterials(); bindRecording();
  buildBgGrid(); WB.init(); setupGate(); refreshPeople();
  window.addEventListener('beforeunload',function(){ try{ if(STATE.lkRoom)STATE.lkRoom.disconnect(); }catch(e){} });
}
if(document.readyState!=='loading') boot(); else document.addEventListener('DOMContentLoaded',boot);
})();
