/* ===== Gri Meet — ders odası motoru =====
   - LiveKit ile canlı video (token Supabase edge'den). Bağlanamazsa "demo" mod (yerel önizleme).
   - Beyaz tahta, materyal paneli, sohbet, katılımcı, araçlar, arka plan, kayıt (öğretmen).
   - Sohbet / tahta / el kaldırma / quiz LiveKit data kanalıyla senkron. */
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
  room:(params.get('room')||'').toUpperCase(),
  isHost:params.get('host')==='1',
  name:'', identity:'u'+Math.random().toString(36).slice(2,9),
  micOn:true, camOn:true, handUp:false, view:'grid',
  lkRoom:null, connected:false, demo:false,
  localStream:null, screenTrack:null, bg:'none',
  supabase:null, tiles:{}, quizVotes:{A:0,B:0,C:0,D:0}, quizOn:false
};

var toastT;
function toast(m){var t=$('#gmr-toast');t.textContent=m;t.classList.add('show');clearTimeout(toastT);toastT=setTimeout(function(){t.classList.remove('show');},2800);}
function initials(n){n=(n||'?').trim();var p=n.split(/\s+/);return ((p[0]||'?')[0]+(p[1]?p[1][0]:'')).toUpperCase();}
function pad(n){return (n<10?'0':'')+n;}
function fmt(s){s=Math.max(0,Math.floor(s));return pad(Math.floor(s/60))+':'+pad(s%60);}

/* ---------------- Supabase (isim + rol) ---------------- */
function initSupabase(){
  try{ if(window.supabase&&window.supabase.createClient) STATE.supabase=window.supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY); }catch(e){}
}

/* ---------------- Clock ---------------- */
var startTs=null;
function tickClock(){ if(!startTs)return; $('#gmr-clock').textContent=fmt((Date.now()-startTs)/1000); }

/* ================= JOIN GATE ================= */
var gatePreviewStream=null;
function setupGate(){
  $('#gate-room-code').textContent=STATE.room||'—';
  var camOn=true, micOn=true;
  var gv=$('#gate-video'), gp=$('.gate-preview');

  async function startPreview(){
    try{
      if(gatePreviewStream) gatePreviewStream.getTracks().forEach(function(t){t.stop();});
      gatePreviewStream=await navigator.mediaDevices.getUserMedia({video:camOn,audio:false});
      gv.srcObject=gatePreviewStream; gp.classList.remove('camoff');
    }catch(e){ camOn=false; $('#gate-cam').classList.remove('on'); $('#gate-cam').textContent='Kamera kapalı'; gp.classList.add('camoff'); }
  }
  if(camOn) startPreview(); else gp.classList.add('camoff');

  $('#gate-cam').addEventListener('click',function(){
    camOn=!camOn; this.classList.toggle('on',camOn); this.textContent=camOn?'Kamera açık':'Kamera kapalı';
    if(camOn) startPreview(); else { gp.classList.add('camoff'); if(gatePreviewStream) gatePreviewStream.getTracks().forEach(function(t){t.stop();}); }
  });
  $('#gate-mic').addEventListener('click',function(){ micOn=!micOn; this.classList.toggle('on',micOn); this.textContent=micOn?'Mikrofon açık':'Mikrofon kapalı'; });

  // İsim: giriş yapılmışsa doldur
  (async function(){
    if(!STATE.supabase)return;
    try{
      var u=await STATE.supabase.auth.getUser(); var user=u.data&&u.data.user;
      if(user){
        var nm=(user.user_metadata&&(user.user_metadata.full_name||user.user_metadata.name))||user.email||'';
        if(nm) $('#gate-name').value=nm.split('@')[0];
        // host doğrulama: yalnızca öğretmen/admin host olabilir
        if(STATE.isHost){
          var p=await STATE.supabase.from('profiles').select('role').eq('id',user.id).maybeSingle();
          var role=(p.data&&p.data.role)||'customer';
          if(role!=='teacher'&&role!=='admin'){ STATE.isHost=false; }
        }
      } else if(STATE.isHost){ STATE.isHost=false; }
    }catch(e){}
    $('#gate-note').textContent=STATE.isHost?'Bu odayı öğretmen olarak açıyorsun.':'Derse öğrenci olarak katılıyorsun.';
  })();

  $('#gate-join').addEventListener('click',function(){
    var nm=($('#gate-name').value||'').trim();
    if(!nm){ toast('Lütfen adını yaz.'); $('#gate-name').focus(); return; }
    STATE.name=nm; STATE.micOn=micOn; STATE.camOn=camOn;
    if(gatePreviewStream) gatePreviewStream.getTracks().forEach(function(t){t.stop();});
    $('#gmr-gate').classList.add('hidden');
    enterRoom();
  });
}

/* ================= ENTER ROOM ================= */
async function enterRoom(){
  startTs=Date.now(); setInterval(tickClock,1000);
  $('#gmr-room-name').textContent=STATE.isHost?'Ders Odası (Öğretmen)':'Ders Odası';
  $('#gmr-code').textContent=STATE.room||'·····';
  if(STATE.isHost) $('#gm-app').classList.add('is-host');

  await getLocalMedia();
  renderSelfTile();
  connectLiveKit();
}

async function getLocalMedia(){
  try{
    STATE.localStream=await navigator.mediaDevices.getUserMedia({
      video:STATE.camOn?{width:{ideal:1280},height:{ideal:720}}:false,
      audio:STATE.micOn
    });
  }catch(e){
    try{ STATE.localStream=await navigator.mediaDevices.getUserMedia({video:false,audio:STATE.micOn}); STATE.camOn=false; }
    catch(e2){ STATE.localStream=null; STATE.camOn=false; STATE.micOn=false; toast('Kamera/mikrofona erişilemedi.'); }
  }
  syncCtrlButtons();
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
    if(res.ok){ var j=await res.json(); token=j.token; if(j.url) LIVEKIT_URL=j.url; }
  }catch(e){}
  if(!token){ enterDemo('Token alınamadı — demo modu'); return; }

  try{
    var room=new LK.Room({adaptiveStream:true,dynacast:true});
    STATE.lkRoom=room;
    room.on(LK.RoomEvent.ParticipantConnected,onParticipant);
    room.on(LK.RoomEvent.ParticipantDisconnected,function(p){ removeTile(p.identity); sysChat((p.name||'Bir katılımcı')+' ayrıldı'); refreshPeople(); });
    room.on(LK.RoomEvent.TrackSubscribed,function(track,pub,p){ attachTrack(track,p); });
    room.on(LK.RoomEvent.TrackUnsubscribed,function(track,pub,p){ if(track.kind==='video') renderTilePlaceholder(p.identity); });
    room.on(LK.RoomEvent.ActiveSpeakersChanged,onSpeakers);
    room.on(LK.RoomEvent.DataReceived,onData);
    room.on(LK.RoomEvent.Disconnected,function(){ setStatus('err','Bağlantı koptu'); });
    room.on(LK.RoomEvent.TrackMuted,function(pub,p){ if(pub.kind==='audio') updateTileMic(p.identity,false); refreshPeople(); });
    room.on(LK.RoomEvent.TrackUnmuted,function(pub,p){ if(pub.kind==='audio') updateTileMic(p.identity,true); refreshPeople(); });

    await room.connect(LIVEKIT_URL,token);
    STATE.connected=true; setStatus('live','Canlı');

    if(STATE.localStream){
      var vt=STATE.localStream.getVideoTracks()[0], at=STATE.localStream.getAudioTracks()[0];
      if(vt&&STATE.camOn) await room.localParticipant.publishTrack(vt);
      if(at&&STATE.micOn) await room.localParticipant.publishTrack(at);
      if(!STATE.micOn&&at) at.enabled=false;
    }
    room.remoteParticipants.forEach(onParticipant);
    refreshPeople(); updateGridCount();
  }catch(e){ enterDemo('Bağlanılamadı: '+(e&&e.message||e)); }
}

function enterDemo(reason){
  STATE.demo=true; setStatus('demo','Demo modu');
  sysChat('Demo modu: '+reason+'. Video bağlantısı için LiveKit token servisi gerekiyor. Tahta, materyal ve araçlar çalışır.');
  refreshPeople(); updateGridCount();
}

function setStatus(cls,txt){ var el=$('#gmr-status'); el.className='gmr-status '+cls; $('#gmr-status-txt').textContent=txt; }

function onParticipant(p){ ensureTile(p.identity,{name:p.name||'Öğrenci',host:isHostMeta(p)}); refreshPeople(); updateGridCount();
  p.trackPublications.forEach(function(pub){ if(pub.isSubscribed&&pub.track) attachTrack(pub.track,p); }); }
function isHostMeta(p){ try{ return (p.metadata&&JSON.parse(p.metadata).host)===true; }catch(e){ return false; } }

function attachTrack(track,p){
  var t=ensureTile(p.identity,{name:p.name||'Öğrenci',host:isHostMeta(p)});
  if(track.kind==='video'){ var v=t.querySelector('video')||document.createElement('video'); v.autoplay=true;v.playsInline=true; track.attach(v); if(!v.parentNode){ var av=t.querySelector('.avatar'); if(av)av.remove(); t.insertBefore(v,t.firstChild);} }
  else if(track.kind==='audio'){ var a=document.createElement('audio'); a.autoplay=true; track.attach(a); t.appendChild(a); }
}

/* ================= VIDEO TILES ================= */
function tileEl(id){ return STATE.tiles[id]; }
function ensureTile(id,info){
  if(STATE.tiles[id]) return STATE.tiles[id];
  var t=document.createElement('div'); t.className='vtile'+(info&&info.host?' host':''); t.dataset.id=id;
  t.innerHTML='<div class="avatar"><span>'+initials(info?info.name:'?')+'</span></div>'+
    '<div class="name"><span class="nm">'+escapeHtml(info?info.name:'Öğrenci')+'</span></div>'+
    (info&&info.host?'<div class="badge">Öğretmen</div>':'')+
    (STATE.isHost&&id!=='self'?'<div class="hostctrl"><button data-act="mute" title="Sustur"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 9v3a3 3 0 0 0 5 2M9 5a3 3 0 0 1 6 0v3M4 4l16 16"/></svg></button><button data-act="kick" title="Çıkar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>':'');
  STATE.tiles[id]=t;
  $('#gmr-videos').appendChild(t);
  syncFilmstrip();
  updateGridCount();
  return t;
}
function renderSelfTile(){
  var t=ensureTile('self',{name:STATE.name+' (Sen)',host:STATE.isHost});
  if(STATE.localStream&&STATE.camOn){
    var v=document.createElement('video'); v.autoplay=true;v.muted=true;v.playsInline=true;v.className='mirror'; v.srcObject=STATE.localStream;
    var av=t.querySelector('.avatar'); if(av)av.remove(); t.insertBefore(v,t.firstChild);
  }
  applyBgToSelf();
}
function renderTilePlaceholder(id){ var t=tileEl(id); if(!t)return; var v=t.querySelector('video'); if(v)v.remove(); if(!t.querySelector('.avatar')){ var d=document.createElement('div'); d.className='avatar'; d.innerHTML='<span>'+initials(t.querySelector('.nm').textContent)+'</span>'; t.insertBefore(d,t.firstChild);} }
function removeTile(id){ var t=tileEl(id); if(t){t.remove(); delete STATE.tiles[id]; syncFilmstrip(); updateGridCount();} }
function updateTileMic(id,on){ var t=tileEl(id); if(!t)return; var nm=t.querySelector('.name'); var m=nm.querySelector('.mic-off'); if(!on&&!m){ var s=document.createElement('span'); s.className='mic-off'; s.innerHTML=' 🔇'; nm.appendChild(s);} else if(on&&m){ m.remove(); } }
function onSpeakers(speakers){ var ids={}; speakers.forEach(function(p){ ids[p.identity===STATE.lkRoom.localParticipant.identity?'self':p.identity]=1; }); Object.keys(STATE.tiles).forEach(function(id){ STATE.tiles[id].classList.toggle('speaking',!!ids[id]); }); }
function updateGridCount(){ var n=Object.keys(STATE.tiles).length; var g=$('#gmr-videos'); g.setAttribute('data-n',n); $('#gmr-count-n').textContent=n; }
function syncFilmstrip(){ /* board görünümünde küçük şeritte kopya göstermek yerine ana ızgara referanslanır */ }

/* ================= CONTROLS ================= */
function syncCtrlButtons(){
  $('#ctrl-mic').setAttribute('data-on',STATE.micOn?'1':'0');
  $('#ctrl-cam').setAttribute('data-on',STATE.camOn?'1':'0');
}
function bindControls(){
  $('#ctrl-mic').addEventListener('click',async function(){
    STATE.micOn=!STATE.micOn; syncCtrlButtons();
    if(STATE.lkRoom){ try{ await STATE.lkRoom.localParticipant.setMicrophoneEnabled(STATE.micOn); }catch(e){} }
    else if(STATE.localStream){ STATE.localStream.getAudioTracks().forEach(function(t){t.enabled=STATE.micOn;}); }
  });
  $('#ctrl-cam').addEventListener('click',async function(){
    STATE.camOn=!STATE.camOn; syncCtrlButtons();
    if(STATE.lkRoom){ try{ await STATE.lkRoom.localParticipant.setCameraEnabled(STATE.camOn); }catch(e){} }
    if(STATE.camOn){ if(!STATE.localStream||!STATE.localStream.getVideoTracks().length){ await getLocalMedia(); } renderSelfTile(); }
    else { renderTilePlaceholder('self'); }
  });
  $('#ctrl-share').addEventListener('click',shareScreen);
  $('#ctrl-board').addEventListener('click',function(){ toggleView('board'); });
  $('#ctrl-materials').addEventListener('click',function(){ toggleView('materials'); });
  $('#ctrl-bg').addEventListener('click',function(){ $('#bg-modal').classList.remove('hidden'); });
  $('#ctrl-record').addEventListener('click',function(){ $('#rec-modal').classList.remove('hidden'); });
  $('#ctrl-hand').addEventListener('click',function(){
    STATE.handUp=!STATE.handUp; this.classList.toggle('active',STATE.handUp);
    setSelfHand(STATE.handUp); sendData({t:'hand',up:STATE.handUp,name:STATE.name});
    if(STATE.handUp) toast('El kaldırdın.');
  });
  $('#ctrl-people').addEventListener('click',function(){ toggleDock('people'); });
  $('#ctrl-chat').addEventListener('click',function(){ toggleDock('chat'); });
  $('#ctrl-leave').addEventListener('click',leaveRoom);

  $('#gmr-code').addEventListener('click',function(){ try{ navigator.clipboard.writeText(STATE.room); toast('Oda kodu kopyalandı: '+STATE.room); }catch(e){} });

  // host tile controls (event delegation)
  $('#gmr-videos').addEventListener('click',function(e){
    var b=e.target.closest('[data-act]'); if(!b||!STATE.isHost)return;
    var tile=b.closest('.vtile'), id=tile.dataset.id;
    if(b.dataset.act==='mute'){ sendData({t:'force-mute',target:id}); toast('Susturma isteği gönderildi.'); }
    if(b.dataset.act==='kick'){ if(confirm('Bu katılımcı çıkarılsın mı?')){ sendData({t:'kick',target:id}); toast('Çıkarma isteği gönderildi.'); } }
  });

  // modal close
  $$('[data-close-modal]').forEach(function(x){ x.addEventListener('click',function(){ x.closest('.gmr-modal').classList.add('hidden'); }); });
  $$('.gmr-modal').forEach(function(m){ m.addEventListener('click',function(e){ if(e.target===m) m.classList.add('hidden'); }); });
}

function toggleView(v){
  var app=$('#gm-app');
  if(STATE.view===v){ STATE.view='grid'; } else { STATE.view=v; }
  $('#gmr-videos').classList.toggle('hidden',STATE.view!=='grid');
  $('#gmr-board').classList.toggle('hidden',STATE.view!=='board');
  $('#gmr-materials').classList.toggle('hidden',STATE.view!=='materials');
  $('#ctrl-board').classList.toggle('active',STATE.view==='board');
  $('#ctrl-materials').classList.toggle('active',STATE.view==='materials');
  app.setAttribute('data-view',STATE.view);
  if(STATE.view==='board'){ setTimeout(WB.resize,30); }
}
function toggleDock(which){
  var dock=$('#gmr-dock'); var open=!dock.classList.contains('hidden');
  var cur=dock.getAttribute('data-active');
  if(open&&cur===which){ dock.classList.add('hidden'); return; }
  dock.classList.remove('hidden'); dock.setAttribute('data-active',which);
  $$('.dock-tab').forEach(function(t){ t.classList.toggle('active',t.dataset.dock===which); });
  $$('.dock-pane').forEach(function(p){ p.classList.toggle('hidden',p.getAttribute('data-dock-pane')!==which); });
  $('#ctrl-people').classList.toggle('active',which==='people'&&!dock.classList.contains('hidden'));
  $('#ctrl-chat').classList.toggle('active',which==='chat'&&!dock.classList.contains('hidden'));
}

async function shareScreen(){
  if(!STATE.lkRoom){ toast('Ekran paylaşımı için canlı bağlantı gerekli.'); return; }
  try{
    var enabled=STATE.lkRoom.localParticipant.isScreenShareEnabled;
    await STATE.lkRoom.localParticipant.setScreenShareEnabled(!enabled);
    $('#ctrl-share').classList.toggle('active',!enabled);
  }catch(e){ toast('Ekran paylaşımı iptal edildi.'); }
}

function leaveRoom(){
  if(!confirm('Dersten ayrılmak istiyor musun?'))return;
  try{ if(STATE.lkRoom) STATE.lkRoom.disconnect(); }catch(e){}
  try{ if(STATE.localStream) STATE.localStream.getTracks().forEach(function(t){t.stop();}); }catch(e){}
  location.href='grimeet.html';
}

function setSelfHand(up){ var t=tileEl('self'); if(!t)return; var h=t.querySelector('.hand'); if(up&&!h){ var d=document.createElement('div'); d.className='hand'; d.textContent='✋'; t.appendChild(d);} else if(!up&&h){ h.remove(); } }

/* ================= DATA CHANNEL (chat/hand/quiz/whiteboard) ================= */
var enc=new TextEncoder(), dec=new TextDecoder();
function sendData(obj){ if(!STATE.lkRoom||!STATE.connected)return; try{ STATE.lkRoom.localParticipant.publishData(enc.encode(JSON.stringify(obj)),{reliable:true}); }catch(e){} }
function onData(payload,p){
  var msg; try{ msg=JSON.parse(dec.decode(payload)); }catch(e){ return; }
  var from=p?(p.name||'Katılımcı'):'?';
  if(msg.t==='chat'){ addChat(from,msg.text); }
  else if(msg.t==='hand'){ var id=p?p.identity:null; if(id){ var tl=tileEl(id); if(tl){ var h=tl.querySelector('.hand'); if(msg.up&&!h){var d=document.createElement('div');d.className='hand';d.textContent='✋';tl.appendChild(d);} else if(!msg.up&&h)h.remove(); } } if(msg.up) sysChat(from+' el kaldırdı ✋'); }
  else if(msg.t==='force-mute'){ if(msg.target==='self'||(STATE.lkRoom&&msg.target===STATE.lkRoom.localParticipant.identity)){ STATE.micOn=false; syncCtrlButtons(); if(STATE.lkRoom) STATE.lkRoom.localParticipant.setMicrophoneEnabled(false); toast('Öğretmen mikrofonunu kapattı.'); } }
  else if(msg.t==='kick'){ if(msg.target==='self'||(STATE.lkRoom&&msg.target===STATE.lkRoom.localParticipant.identity)){ toast('Öğretmen seni dersten çıkardı.'); setTimeout(leaveRoomForce,1500); } }
  else if(msg.t==='quiz'){ showStudentQuiz(msg.q); }
  else if(msg.t==='quiz-vote'){ if(STATE.isHost&&STATE.quizOn){ STATE.quizVotes[msg.a]=(STATE.quizVotes[msg.a]||0)+1; renderQuizTally(); } }
  else if(msg.t==='wb'){ WB.applyRemote(msg); }
  else if(msg.t==='yt'){ loadYouTube(msg.url,true); }
}
function leaveRoomForce(){ try{ if(STATE.lkRoom) STATE.lkRoom.disconnect(); }catch(e){} location.href='grimeet.html'; }

/* ================= CHAT ================= */
function addChat(who,text){ var log=$('#chat-log'); var d=document.createElement('div'); d.className='chat-msg'; d.innerHTML='<span class="who">'+escapeHtml(who)+':</span>'+escapeHtml(text); log.appendChild(d); log.scrollTop=log.scrollHeight; }
function sysChat(text){ var log=$('#chat-log'); var d=document.createElement('div'); d.className='chat-msg sys'; d.textContent=text; log.appendChild(d); log.scrollTop=log.scrollHeight; }
function bindChat(){
  function send(){ var i=$('#chat-text'); var t=(i.value||'').trim(); if(!t)return; addChat(STATE.name+' (Sen)',t); sendData({t:'chat',text:t}); i.value=''; }
  $('#chat-send').addEventListener('click',send);
  $('#chat-text').addEventListener('keydown',function(e){ if(e.key==='Enter')send(); });
}

/* ================= PEOPLE ================= */
function refreshPeople(){
  var ul=$('#people-list'); if(!ul)return; ul.innerHTML='';
  var list=[{name:STATE.name+' (Sen)',host:STATE.isHost,mic:STATE.micOn}];
  if(STATE.lkRoom){ STATE.lkRoom.remoteParticipants.forEach(function(p){ list.push({name:p.name||'Öğrenci',host:isHostMeta(p),mic:p.isMicrophoneEnabled}); }); }
  list.forEach(function(m){
    var li=document.createElement('li');
    li.innerHTML='<span class="pav">'+initials(m.name)+'</span><span class="pnm">'+escapeHtml(m.name)+'</span>'+(m.host?'<span class="ptag">Öğretmen</span>':'')+'<span class="pmic'+(m.mic?'':' off')+'">'+(m.mic?'🎤':'🔇')+'</span>';
    ul.appendChild(li);
  });
}
function bindPeople(){ var b=$('#btn-mute-all'); if(b) b.addEventListener('click',function(){ sendData({t:'force-mute',target:'*'}); toast('Herkese susturma isteği gönderildi.'); }); }

/* ================= TOOLS: timer / picker / quiz / breakout ================= */
var timerInt=null,timerLeft=0;
function bindTools(){
  $$('.timer-btns [data-tmin]').forEach(function(b){ b.addEventListener('click',function(){ startTimer(parseInt(b.dataset.tmin,10)*60); }); });
  $('#timer-stop').addEventListener('click',function(){ clearInterval(timerInt); timerInt=null; $('#timer-display').textContent='00:00'; });
  $('#btn-pick').addEventListener('click',pickStudent);
  var q=$('#btn-quiz'); if(q) q.addEventListener('click',sendQuiz);
  var bo=$('#btn-breakout'); if(bo) bo.addEventListener('click',makeBreakout);
}
function startTimer(sec){ clearInterval(timerInt); timerLeft=sec; $('#timer-display').textContent=fmt(timerLeft);
  timerInt=setInterval(function(){ timerLeft--; $('#timer-display').textContent=fmt(timerLeft); if(timerLeft<=0){ clearInterval(timerInt); timerInt=null; toast('Süre doldu!'); try{beep();}catch(e){} } },1000); }
function beep(){ var a=new (window.AudioContext||window.webkitAudioContext)(); var o=a.createOscillator(); o.connect(a.destination); o.frequency.value=880; o.start(); setTimeout(function(){o.stop();a.close();},350); }
function pickStudent(){
  var names=[]; if(STATE.lkRoom){ STATE.lkRoom.remoteParticipants.forEach(function(p){ if(!isHostMeta(p)) names.push(p.name||'Öğrenci'); }); }
  if(!STATE.isHost) names.push(STATE.name);
  if(!names.length){ $('#pick-result').textContent='Öğrenci yok.'; return; }
  var i=0,n=0,max=14+Math.floor(Math.random()*8);
  var el=$('#pick-result');
  var iv=setInterval(function(){ el.textContent=names[i%names.length]; i++; n++; if(n>=max){ clearInterval(iv); el.textContent='🎯 '+names[Math.floor(Math.random()*names.length)]; } },80);
}
function sendQuiz(){ var q=($('#quiz-q').value||'').trim()||'Doğru cevap hangisi?'; STATE.quizOn=true; STATE.quizVotes={A:0,B:0,C:0,D:0}; sendData({t:'quiz',q:q}); renderQuizTally(); toast('Quiz gönderildi.'); }
function renderQuizTally(){ var el=$('#quiz-tally'); if(!el)return; var tot=STATE.quizVotes.A+STATE.quizVotes.B+STATE.quizVotes.C+STATE.quizVotes.D||1; el.innerHTML=['A','B','C','D'].map(function(k){ var v=STATE.quizVotes[k]; return '<div class="qrow"><b>'+k+'</b><div class="qbar" style="width:'+(v/tot*160)+'px"></div><span>'+v+'</span></div>'; }).join(''); }
function showStudentQuiz(q){
  toggleDock('tools');
  var box=document.createElement('div'); box.className='tool-box'; box.style.borderColor='var(--gm-gold)';
  box.innerHTML='<div class="tool-box-h">Quiz: '+escapeHtml(q)+'</div><div class="mat-row">'+['A','B','C','D'].map(function(k){return '<button class="dock-btn" data-vote="'+k+'" style="flex:1">'+k+'</button>';}).join('')+'</div>';
  var body=$('.gmr-dock-body [data-dock-pane="tools"]'); if(body){ body.insertBefore(box,body.firstChild);
    box.addEventListener('click',function(e){ var b=e.target.closest('[data-vote]'); if(!b)return; sendData({t:'quiz-vote',a:b.dataset.vote}); box.innerHTML='<div class="tool-box-h">Cevabın: '+b.dataset.vote+' ✓</div>'; }); }
}
function makeBreakout(){
  var n=Math.max(2,Math.min(5,parseInt($('#bo-count').value,10)||2));
  var names=[]; if(STATE.lkRoom){ STATE.lkRoom.remoteParticipants.forEach(function(p){ if(!isHostMeta(p)) names.push(p.name||'Öğrenci'); }); }
  if(!names.length){ $('#bo-result').textContent='Gruplara ayrılacak öğrenci yok.'; return; }
  for(var i=names.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)); var t=names[i];names[i]=names[j];names[j]=t; }
  var groups=[]; for(var g=0;g<n;g++)groups.push([]);
  names.forEach(function(nm,idx){ groups[idx%n].push(nm); });
  $('#bo-result').innerHTML=groups.map(function(gr,idx){ return '<div style="margin-bottom:6px"><b>Grup '+(idx+1)+':</b> '+gr.map(escapeHtml).join(', ')+'</div>'; }).join('');
  toast('Not: Ayrı ses odaları LiveKit oda-bağlama ile eklenecek; şimdilik grup listesi.');
}

/* ================= BACKGROUNDS ================= */
var BGS=[
  {id:'none',label:'Yok',cls:'none'},
  {id:'blur',label:'Bulanık',cls:'blur'},
  {id:'lib',label:'Kütüphane',img:'linear-gradient(135deg,#6b4f2a,#3a2a15)'},
  {id:'class',label:'Sınıf',img:'linear-gradient(135deg,#2E6E6A,#123C39)'},
  {id:'office',label:'Ofis',img:'linear-gradient(135deg,#40506a,#1e2a3e)'},
  {id:'plant',label:'Bitkiler',img:'linear-gradient(135deg,#3E6B4A,#20402B)'},
  {id:'warm',label:'Sıcak',img:'linear-gradient(135deg,#B78A2E,#6E4B18)'},
  {id:'rose',label:'Gül',img:'linear-gradient(135deg,#B0567A,#7E3A56)'},
  {id:'ocean',label:'Okyanus',img:'linear-gradient(135deg,#2E5E8A,#1E3E5C)'},
  {id:'lav',label:'Lavanta',img:'linear-gradient(135deg,#6E5AA0,#493A6E)'},
  {id:'space',label:'Uzay',img:'linear-gradient(135deg,#2a2350,#0a0818)'},
  {id:'sunset',label:'Gün batımı',img:'linear-gradient(135deg,#c05a2c,#5a2a4a)'}
];
function buildBgGrid(){
  var g=$('#bg-grid'); g.innerHTML='';
  BGS.forEach(function(b){
    var d=document.createElement('button'); d.className='bg-opt '+(b.cls||'')+(STATE.bg===b.id?' on':''); d.dataset.bg=b.id;
    if(b.img) d.style.backgroundImage=b.img;
    d.innerHTML='<span>'+b.label+'</span>';
    d.addEventListener('click',function(){ STATE.bg=b.id; $$('.bg-opt').forEach(function(x){x.classList.remove('on');}); d.classList.add('on'); applyBgToSelf(); });
    g.appendChild(d);
  });
}
function applyBgToSelf(){
  var t=tileEl('self'); if(!t)return; var v=t.querySelector('video'); if(!v)return;
  // Şimdilik görsel önizleme: blur = CSS filtre; hazır arka plan = tile arka planı (gerçek segmentasyon LiveKit track-processor ile eklenecek)
  if(STATE.bg==='blur'){ v.style.filter='blur(7px)'; t.style.background=''; }
  else if(STATE.bg==='none'){ v.style.filter=''; t.style.background='#000'; }
  else { var b=BGS.filter(function(x){return x.id===STATE.bg;})[0]; v.style.filter=''; if(b&&b.img){ t.style.background=b.img; } }
}

/* ================= WHITEBOARD ENGINE ================= */
var WB=(function(){
  var cv,ctx,W=0,H=0,dpr=1;
  var tool='pen',color='#1b1b1b',size=4;
  var items=[]; // {type,color,size,points|x,y,w,h,text,img}
  var drawing=false,cur=null,startPt=null;
  var sel=null,dragOff=null,clip=null;
  var COLORS=['#1b1b1b','#d64545','#2E6E6A','#2E5E8A','#B78A2E','#7E3A56','#3E6B4A','#ffffff'];

  function init(){
    cv=$('#gmr-canvas'); if(!cv)return; ctx=cv.getContext('2d');
    var cw=$('#wb-colors'); COLORS.forEach(function(c,i){ var b=document.createElement('button'); b.style.background=c; if(i===0)b.classList.add('on'); b.dataset.color=c; cw.appendChild(b); });
    cw.addEventListener('click',function(e){ var b=e.target.closest('[data-color]'); if(!b)return; color=b.dataset.color; $$('#wb-colors button').forEach(function(x){x.classList.remove('on');}); b.classList.add('on'); });
    $('#wb-size').addEventListener('input',function(){ size=parseInt(this.value,10); });
    $$('.wb-tool').forEach(function(b){ b.addEventListener('click',function(){ tool=b.dataset.tool; $$('.wb-tool').forEach(function(x){x.classList.remove('active');}); b.classList.add('active'); cv.style.cursor=(tool==='select')?'move':(tool==='text'?'text':'crosshair'); }); });
    $('#wb-image').addEventListener('click',function(){ $('#wb-file').click(); });
    $('#wb-file').addEventListener('change',onImage);
    $('#wb-copy').addEventListener('click',function(){ if(sel!=null){ clip=JSON.parse(JSON.stringify(items[sel])); toast('Kopyalandı.'); } });
    $('#wb-cut').addEventListener('click',function(){ if(sel!=null){ clip=JSON.parse(JSON.stringify(items[sel])); items.splice(sel,1); sel=null; redraw(); broadcast(); toast('Kesildi.'); } });
    $('#wb-paste').addEventListener('click',function(){ if(clip){ var it=JSON.parse(JSON.stringify(clip)); shift(it,24,24); items.push(it); sel=items.length-1; redraw(); broadcast(); } });
    $('#wb-undo').addEventListener('click',function(){ items.pop(); sel=null; redraw(); broadcast(); });
    $('#wb-clear').addEventListener('click',function(){ if(confirm('Tahta temizlensin mi?')){ items=[]; sel=null; redraw(); broadcast(); } });

    cv.addEventListener('pointerdown',down); cv.addEventListener('pointermove',move); window.addEventListener('pointerup',up);
    window.addEventListener('resize',resize);
    document.addEventListener('keydown',function(e){ if(STATE.view!=='board')return; if((e.ctrlKey||e.metaKey)&&e.key==='c'){ $('#wb-copy').click(); } if((e.ctrlKey||e.metaKey)&&e.key==='x'){ $('#wb-cut').click(); } if((e.ctrlKey||e.metaKey)&&e.key==='v'){ $('#wb-paste').click(); } if((e.ctrlKey||e.metaKey)&&e.key==='z'){ $('#wb-undo').click(); } if(e.key==='Delete'&&sel!=null){ items.splice(sel,1);sel=null;redraw();broadcast(); } });
    resize();
  }
  function resize(){ if(!cv)return; var r=cv.getBoundingClientRect(); dpr=window.devicePixelRatio||1; cv.width=r.width*dpr; cv.height=r.height*dpr; W=r.width;H=r.height; ctx.setTransform(dpr,0,0,dpr,0,0); redraw(); }
  function pos(e){ var r=cv.getBoundingClientRect(); return {x:e.clientX-r.left,y:e.clientY-r.top}; }
  function shift(it,dx,dy){ if(it.points){ it.points.forEach(function(p){p.x+=dx;p.y+=dy;}); } else { it.x+=dx; it.y+=dy; } }
  function bbox(it){ if(it.points){ var xs=it.points.map(function(p){return p.x;}),ys=it.points.map(function(p){return p.y;}); return {x:Math.min.apply(0,xs),y:Math.min.apply(0,ys),w:Math.max.apply(0,xs)-Math.min.apply(0,xs),h:Math.max.apply(0,ys)-Math.min.apply(0,ys)}; } if(it.type==='text'){ return {x:it.x,y:it.y-it.size,w:(it.text.length*it.size*0.6),h:it.size*1.2}; } return {x:Math.min(it.x,it.x+it.w),y:Math.min(it.y,it.y+it.h),w:Math.abs(it.w),h:Math.abs(it.h)}; }
  function hit(pt){ for(var i=items.length-1;i>=0;i--){ var b=bbox(items[i]); if(pt.x>=b.x-6&&pt.x<=b.x+b.w+6&&pt.y>=b.y-6&&pt.y<=b.y+b.h+6) return i; } return -1; }

  function down(e){ e.preventDefault(); var p=pos(e);
    if(tool==='select'){ sel=hit(p); if(sel>=0){ dragOff={x:p.x,y:p.y,orig:JSON.parse(JSON.stringify(items[sel]))}; } redraw(); return; }
    if(tool==='text'){ var txt=prompt('Metin:'); if(txt){ items.push({type:'text',x:p.x,y:p.y,text:txt,color:color,size:Math.max(14,size*4)}); redraw(); broadcast(); } return; }
    drawing=true; startPt=p;
    if(tool==='pen'||tool==='highlighter'||tool==='eraser'){ cur={type:tool,color:tool==='eraser'?'#fbfaf6':color,size:tool==='highlighter'?size*3:(tool==='eraser'?size*4:size),points:[p],alpha:tool==='highlighter'?0.35:1}; items.push(cur); }
    else { cur={type:tool,x:p.x,y:p.y,w:0,h:0,color:color,size:size}; items.push(cur); }
  }
  function move(e){ var p=pos(e);
    if(tool==='select'&&sel!=null&&sel>=0&&dragOff){ var it=items[sel]; var o=dragOff.orig; var dx=p.x-dragOff.x,dy=p.y-dragOff.y; items[sel]=JSON.parse(JSON.stringify(o)); shift(items[sel],dx,dy); redraw(); return; }
    if(!drawing||!cur)return;
    if(cur.points){ cur.points.push(p); } else { cur.w=p.x-startPt.x; cur.h=p.y-startPt.y; }
    redraw();
  }
  function up(){ if(tool==='select'&&dragOff){ dragOff=null; broadcast(); } if(drawing){ drawing=false; cur=null; broadcast(); } }

  function onImage(e){ var f=e.target.files[0]; if(!f)return; var rd=new FileReader(); rd.onload=function(){ var img=new Image(); img.onload=function(){ var mw=Math.min(320,img.width),ratio=img.height/img.width; items.push({type:'img',x:W/2-mw/2,y:H/2-mw*ratio/2,w:mw,h:mw*ratio,src:rd.result,_img:img}); redraw(); broadcast(); }; img.src=rd.result; }; rd.readAsDataURL(f); e.target.value=''; }

  function drawItem(it){
    ctx.save(); ctx.globalAlpha=it.alpha||1; ctx.strokeStyle=it.color; ctx.fillStyle=it.color; ctx.lineWidth=it.size||3; ctx.lineCap='round'; ctx.lineJoin='round';
    if(it.type==='pen'||it.type==='highlighter'||it.type==='eraser'){ ctx.beginPath(); it.points.forEach(function(p,i){ i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y); }); ctx.stroke(); }
    else if(it.type==='line'){ ctx.beginPath(); ctx.moveTo(it.x,it.y); ctx.lineTo(it.x+it.w,it.y+it.h); ctx.stroke(); }
    else if(it.type==='arrow'){ ctx.beginPath(); ctx.moveTo(it.x,it.y); ctx.lineTo(it.x+it.w,it.y+it.h); ctx.stroke(); var ang=Math.atan2(it.h,it.w),L=10+it.size; ctx.beginPath(); ctx.moveTo(it.x+it.w,it.y+it.h); ctx.lineTo(it.x+it.w-L*Math.cos(ang-0.4),it.y+it.h-L*Math.sin(ang-0.4)); ctx.moveTo(it.x+it.w,it.y+it.h); ctx.lineTo(it.x+it.w-L*Math.cos(ang+0.4),it.y+it.h-L*Math.sin(ang+0.4)); ctx.stroke(); }
    else if(it.type==='rect'){ ctx.strokeRect(it.x,it.y,it.w,it.h); }
    else if(it.type==='ellipse'){ ctx.beginPath(); ctx.ellipse(it.x+it.w/2,it.y+it.h/2,Math.abs(it.w/2),Math.abs(it.h/2),0,0,7); ctx.stroke(); }
    else if(it.type==='text'){ ctx.font='600 '+it.size+'px Inter,sans-serif'; ctx.fillText(it.text,it.x,it.y); }
    else if(it.type==='img'){ var im=it._img; if(!im){ im=new Image(); im.onload=redraw; im.src=it.src; it._img=im; } if(im.complete) ctx.drawImage(im,it.x,it.y,it.w,it.h); }
    ctx.restore();
  }
  function redraw(){ if(!ctx)return; ctx.clearRect(0,0,W,H); ctx.fillStyle='#fbfaf6'; ctx.fillRect(0,0,W,H); items.forEach(drawItem);
    if(sel!=null&&sel>=0&&items[sel]){ var b=bbox(items[sel]); ctx.save(); ctx.strokeStyle='#2E6E6A'; ctx.setLineDash([6,4]); ctx.lineWidth=1.5; ctx.strokeRect(b.x-6,b.y-6,b.w+12,b.h+12); ctx.restore(); } }

  function broadcast(){ sendData({t:'wb',items:items.map(function(it){ var c=Object.assign({},it); delete c._img; return c; })}); }
  function applyRemote(msg){ if(!msg.items)return; items=msg.items; items.forEach(function(it){ if(it.type==='img'&&it.src&&!it._img){ var im=new Image(); im.onload=redraw; im.src=it.src; it._img=im; } }); redraw(); }

  return {init:init,resize:resize,applyRemote:applyRemote,getCanvas:function(){return cv;}};
})();

/* ================= MATERIALS ================= */
function bindMaterials(){
  $('#gmr-mat-close').addEventListener('click',function(){ toggleView('materials'); });
  $$('.mat-tab').forEach(function(t){ t.addEventListener('click',function(){ $$('.mat-tab').forEach(function(x){x.classList.remove('active');}); t.classList.add('active'); $$('.mat-pane').forEach(function(p){ p.classList.toggle('hidden',p.getAttribute('data-mat-pane')!==t.dataset.mat); }); }); });
  $('#mat-yt-load').addEventListener('click',function(){ var u=$('#mat-yt-url').value.trim(); if(!u)return; loadYouTube(u,false); sendData({t:'yt',url:u}); });
  buildUnitSelectors();
  $('#mat-unit-load').addEventListener('click',function(){ var f=$('#mat-unit').value; if(!f)return; $('#mat-unit-frame').innerHTML='<iframe src="'+f+'" title="Ünite"></iframe>'; });
}
function ytId(u){ var m=u.match(/(?:v=|youtu\.be\/|embed\/)([\w-]{11})/); return m?m[1]:(u.length===11?u:null); }
function loadYouTube(u,remote){ var id=ytId(u); if(!id){ if(!remote)toast('Geçerli bir YouTube bağlantısı değil.'); return; } $('#mat-yt-frame').innerHTML='<iframe src="https://www.youtube.com/embed/'+id+'?rel=0" allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture" allowfullscreen></iframe>'; if(remote){ if(STATE.view!=='materials')toggleView('materials'); } }
function buildUnitSelectors(){
  var tracks=[{v:'',t:'Adult'},{v:'teen-',t:'Teen'},{v:'junior-',t:'Junior'}];
  var levels=['a1','a2','b1','b2','c1','c2'];
  var tSel=$('#mat-track'),lSel=$('#mat-level'),uSel=$('#mat-unit');
  tracks.forEach(function(x){ var o=document.createElement('option'); o.value=x.v; o.textContent=x.t; tSel.appendChild(o); });
  levels.forEach(function(l){ var o=document.createElement('option'); o.value=l; o.textContent=l.toUpperCase(); lSel.appendChild(o); });
  function fillUnits(){ uSel.innerHTML=''; for(var i=1;i<=21;i++){ var f='genel-'+tSel.value+lSel.value+'-unite-'+i+'.html'; var o=document.createElement('option'); o.value=f; o.textContent='Ünite '+i; uSel.appendChild(o); } }
  tSel.addEventListener('change',fillUnits); lSel.addEventListener('change',fillUnits); fillUnits();
}

/* ================= RECORDING (öğretmen, saklanmaz) ================= */
var REC={mr:null,chunks:[],int:null,secs:0,ac:null,raf:null};
function bindRecording(){
  $('#rec-start').addEventListener('click',startRecording);
  $('#rec-stop').addEventListener('click',stopRecording);
}
function collectAudioStream(){
  try{
    REC.ac=new (window.AudioContext||window.webkitAudioContext)();
    var dest=REC.ac.createMediaStreamDestination();
    var added=0;
    if(STATE.localStream){ STATE.localStream.getAudioTracks().forEach(function(t){ try{ REC.ac.createMediaStreamSource(new MediaStream([t])).connect(dest); added++; }catch(e){} }); }
    if(STATE.lkRoom){ STATE.lkRoom.remoteParticipants.forEach(function(p){ p.trackPublications.forEach(function(pub){ if(pub.track&&pub.track.kind==='audio'&&pub.track.mediaStreamTrack){ try{ REC.ac.createMediaStreamSource(new MediaStream([pub.track.mediaStreamTrack])).connect(dest); added++; }catch(e){} } }); }); }
    return added?dest.stream:null;
  }catch(e){ return null; }
}
function startRecording(){
  $('#rec-modal').classList.add('hidden');
  // Sahneyi bir canvas'a çizerek kaydet (video ızgarası veya tahta)
  var rc=document.createElement('canvas'); rc.width=1280; rc.height=720; var rctx=rc.getContext('2d');
  function frame(){
    rctx.fillStyle='#0e0c0a'; rctx.fillRect(0,0,1280,720);
    if(STATE.view==='board'&&WB.getCanvas()){ var bc=WB.getCanvas(); try{ rctx.drawImage(bc,0,0,1280,720); }catch(e){} }
    else {
      var vids=$$('#gmr-videos video'); var n=vids.length||1; var cols=Math.ceil(Math.sqrt(n)),rows=Math.ceil(n/cols); var cw=1280/cols,ch=720/rows;
      vids.forEach(function(v,i){ var cx=(i%cols)*cw,cy=Math.floor(i/cols)*ch; try{ rctx.drawImage(v,cx+4,cy+4,cw-8,ch-8); }catch(e){} });
      if(!vids.length){ rctx.fillStyle='#B7AB96'; rctx.font='28px Inter'; rctx.textAlign='center'; rctx.fillText('Gri Meet — Ders Kaydı',640,360); }
    }
    REC.raf=requestAnimationFrame(frame);
  }
  frame();
  var vStream=rc.captureStream(25);
  var mixed=new MediaStream(); vStream.getVideoTracks().forEach(function(t){mixed.addTrack(t);});
  if($('#rec-audio').checked){ var a=collectAudioStream(); if(a) a.getAudioTracks().forEach(function(t){mixed.addTrack(t);}); }
  var mime=MediaRecorder.isTypeSupported('video/webm;codecs=vp9')?'video/webm;codecs=vp9':'video/webm';
  try{ REC.mr=new MediaRecorder(mixed,{mimeType:mime}); }catch(e){ toast('Tarayıcı kaydı desteklemiyor.'); cancelAnimationFrame(REC.raf); return; }
  REC.chunks=[]; REC.mr.ondataavailable=function(e){ if(e.data.size) REC.chunks.push(e.data); };
  REC.mr.onstop=function(){ cancelAnimationFrame(REC.raf); if(REC.ac){try{REC.ac.close();}catch(e){}} var blob=new Blob(REC.chunks,{type:'video/webm'}); downloadBlob(blob); };
  REC.mr.start(1000); REC.secs=0;
  $('#ctrl-record').classList.add('rec-on'); $('#rec-bar').classList.remove('hidden');
  REC.int=setInterval(function(){ REC.secs++; $('#rec-time').textContent=fmt(REC.secs); },1000);
  toast('Kayıt başladı. Durdurunca inecek.');
}
function stopRecording(){ if(REC.mr&&REC.mr.state!=='inactive'){ REC.mr.stop(); } clearInterval(REC.int); $('#ctrl-record').classList.remove('rec-on'); $('#rec-bar').classList.add('hidden'); }
function downloadBlob(blob){ var url=URL.createObjectURL(blob); var a=document.createElement('a'); var d=new Date(); a.href=url; a.download='gri-meet-ders-'+d.getFullYear()+pad(d.getMonth()+1)+pad(d.getDate())+'-'+pad(d.getHours())+pad(d.getMinutes())+'.webm'; document.body.appendChild(a); a.click(); setTimeout(function(){ URL.revokeObjectURL(url); a.remove(); },1000); toast('Kayıt indirildi.'); }

/* ================= UTIL ================= */
function escapeHtml(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }

/* ================= BOOT ================= */
function boot(){
  if(!STATE.room){ STATE.room='DEMO'+Math.floor(Math.random()*90+10); }
  initSupabase();
  bindControls(); bindChat(); bindPeople(); bindTools(); bindMaterials(); bindRecording();
  buildBgGrid(); WB.init();
  setupGate();
  refreshPeople();
  window.addEventListener('beforeunload',function(){ try{ if(STATE.lkRoom)STATE.lkRoom.disconnect(); }catch(e){} });
}
if(document.readyState!=='loading') boot(); else document.addEventListener('DOMContentLoaded',boot);

})();
