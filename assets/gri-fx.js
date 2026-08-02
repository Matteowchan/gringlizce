/* gri-fx.js — oyun sesleri (WebAudio) + telaffuz (Web Speech). Kütüphanesiz. */
(function(){
  if(window.GriFX)return;
  function muted(){ try{ return localStorage.getItem('gri-fx-mute')==='1'; }catch(e){ return false; } }
  function setMuted(m){ try{ localStorage.setItem('gri-fx-mute', m?'1':'0'); }catch(e){} }

  /* ---- telaffuz ---- */
  var voices=[];
  function loadVoices(){ try{ voices=window.speechSynthesis?window.speechSynthesis.getVoices():[]; }catch(e){} }
  try{ if(window.speechSynthesis){ loadVoices(); window.speechSynthesis.onvoiceschanged=loadVoices; } }catch(e){}
  function speak(text){
    try{
      if(!window.speechSynthesis)return;
      var u=new SpeechSynthesisUtterance(String(text||''));
      u.lang='en-US'; u.rate=.92; u.pitch=1;
      var v=null; for(var i=0;i<voices.length;i++){ if(/en[-_]?US/i.test(voices[i].lang)){ v=voices[i]; break; } }
      if(!v){ for(var j=0;j<voices.length;j++){ if(/^en/i.test(voices[j].lang)){ v=voices[j]; break; } } }
      if(v)u.voice=v;
      window.speechSynthesis.cancel(); window.speechSynthesis.speak(u);
    }catch(e){}
  }

  /* ---- ses efektleri ---- */
  var actx=null;
  function ctx(){ if(!actx){ try{ actx=new (window.AudioContext||window.webkitAudioContext)(); }catch(e){} } if(actx&&actx.state==='suspended'){ try{actx.resume();}catch(e){} } return actx; }
  function tone(freq,dur,type,vol,when){
    var c=ctx(); if(!c)return;
    var o=c.createOscillator(), g=c.createGain();
    o.type=type||'sine'; o.frequency.value=freq;
    var t=c.currentTime+(when||0);
    g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(vol||.06,t+0.01);
    g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
    o.connect(g); g.connect(c.destination); o.start(t); o.stop(t+dur+0.02);
  }
  function sound(name){
    if(muted())return;
    if(name==='ok'){ tone(660,.12,'sine',.06); tone(880,.12,'sine',.05,.06); }
    else if(name==='bad'){ tone(200,.18,'sawtooth',.05); }
    else if(name==='dupe'){ tone(520,.09,'sine',.04); }
    else if(name==='win'){ [523,659,784,1047].forEach(function(f,i){ tone(f,.2,'triangle',.06,i*0.09); }); }
    else if(name==='coin'){ tone(988,.07,'square',.05); tone(1319,.1,'square',.05,.06); }
    else if(name==='key'){ tone(430,.045,'sine',.028); }
  }

  window.GriFX={ speak:speak, sound:sound, muted:muted, setMuted:setMuted };
})();
