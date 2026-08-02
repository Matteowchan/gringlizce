/* wordle-daily.js — günün kelimesi + durum kaydı + streak + paylaş
 * GriWordle motorunu kullanır. GriWordleDaily.mountDaily(hostEl, opts)
 */
(function(){
  if(window.GriWordleDaily)return;
  var WORDS_URL='assets/wordle-words.json';
  var cache=null;

  function fetchWords(cb){
    if(cache)return cb(cache);
    fetch(WORDS_URL,{cache:'no-cache'}).then(function(r){return r.json();}).then(function(j){ cache=j||[]; cb(cache); })
      .catch(function(){ cb([]); });
  }
  function epochDay(){ return Math.floor(Date.now()/86400000); }
  function dateKey(){ var d=new Date(); function p(n){return (n<10?'0':'')+n;} return d.getUTCFullYear()+'-'+p(d.getUTCMonth()+1)+'-'+p(d.getUTCDate()); }
  function todayWord(words){ if(!words.length)return null; var i=((epochDay()%words.length)+words.length)%words.length; return words[i]; }

  function lsGet(k,def){ try{ var v=localStorage.getItem(k); return v?JSON.parse(v):def; }catch(e){ return def; } }
  function lsSet(k,v){ try{ localStorage.setItem(k,JSON.stringify(v)); }catch(e){} }

  function loadState(dk){ return lsGet('gri-wd-'+dk,null); }
  function saveState(dk,st){ lsSet('gri-wd-'+dk,st); }

  function getStreak(){ return lsGet('gri-wd-streak',{last:null,streak:0,best:0,played:0,wins:0}); }
  function yesterdayKey(){ var d=new Date(Date.now()-86400000); function p(n){return (n<10?'0':'')+n;} return d.getUTCFullYear()+'-'+p(d.getUTCMonth()+1)+'-'+p(d.getUTCDate()); }
  function updateStreak(dk,win){
    var s=getStreak();
    if(s.last===dk)return s; /* bugün zaten işlendi */
    s.played=(s.played||0)+1;
    if(win){ s.wins=(s.wins||0)+1; s.streak=(s.last===yesterdayKey())?(s.streak+1):1; }
    else { s.streak=0; }
    s.best=Math.max(s.best||0,s.streak);
    s.last=dk; lsSet('gri-wd-streak',s); return s;
  }

  function shareGrid(guesses,answer){
    var lines=[];
    for(var g=0;g<guesses.length;g++){
      var res=window.GriWordle.score(guesses[g],answer), row='';
      for(var i=0;i<res.length;i++)row+=(res[i]==='ok'?'🟩':res[i]==='pre'?'🟨':'⬛');
      lines.push(row);
    }
    return lines.join('\n');
  }

  function mountDaily(host,opts){
    opts=opts||{};
    fetchWords(function(words){
      var word=todayWord(words);
      if(!word){ host.innerHTML='<p style="text-align:center;opacity:.7">Kelime yüklenemedi.</p>'; return; }
      var dk=dateKey(), saved=loadState(dk);
      var inst=window.GriWordle.mount(host,{
        answer:word.w, tr:word.tr, ex:word.ex, hint:word.hint, maxRows:6, state:saved,
        onChange:function(i){ saveState(dk,i.getState()); },
        onFinish:function(r){
          var s=updateStreak(dk,r.win);
          renderExtras(host,inst,word,s);
          if(opts.onFinish)opts.onFinish(r,s);
        }
      });
      if(saved&&saved.done){ renderExtras(host,inst,word,getStreak()); }
      if(opts.onReady)opts.onReady(inst,word,getStreak(),saved);
    });
  }

  function renderExtras(host,inst,word,streak){
    if(host.querySelector('.gwd-share'))return;
    var st=inst.getState();
    var box=document.createElement('div'); box.className='gwd-share';
    box.style.cssText='width:100%;max-width:520px;text-align:center;margin-top:4px;';
    var line='Gri Wordle — '+(st.win?st.guesses.length+'/6':'X/6');
    var grid=shareGrid(st.guesses,word.w);
    var btn=document.createElement('button');
    btn.textContent='Sonucu Kopyala';
    btn.style.cssText='font:700 14px inherit;padding:9px 18px;border-radius:9px;border:0;background:#4c9f70;color:#fff;cursor:pointer;';
    btn.addEventListener('click',function(){
      var txt=line+'  (seri: '+streak.streak+')\n'+grid+'\ngringlizce.com';
      if(navigator.clipboard&&navigator.clipboard.writeText){ navigator.clipboard.writeText(txt).then(function(){ btn.textContent='Kopyalandı ✓'; setTimeout(function(){btn.textContent='Sonucu Kopyala';},1500); }); }
    });
    box.appendChild(btn);
    var note=document.createElement('div'); note.style.cssText='margin-top:8px;font-size:.82rem;opacity:.7;'; note.textContent='Yarın yeni bir kelime! Seri: '+streak.streak+' gün · En iyi: '+(streak.best||streak.streak);
    box.appendChild(note);
    host.appendChild(box);
  }

  window.GriWordleDaily={ mountDaily:mountDaily, getStreak:getStreak, todayWord:todayWord, fetchWords:fetchWords, dateKey:dateKey };
})();
