/* Gri Meet — Ders Planlama / Takvim (paylaşılan modül)
   Kullanım:
     GriSchedule.mount({ sb, container, role:'teacher', classId, userId, roomForClass:fn })
     GriSchedule.mount({ sb, container, role:'student' })   // RLS öğrenciyi kendi sınıflarına kısıtlar
*/
(function(){
  if (window.GriSchedule) return;

  var CSS = ''
    + '.gsch{font-family:inherit;color:#2a2a2a;}'
    + '.gsch-head{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:12px;}'
    + '.gsch-toggle{display:inline-flex;border:1px solid #d8d2c4;border-radius:9px;overflow:hidden;}'
    + '.gsch-toggle button{border:none;background:#f4efe6;color:#6a6250;padding:7px 14px;font:inherit;font-size:13px;cursor:pointer;}'
    + '.gsch-toggle button.on{background:#2C5856;color:#fff;}'
    + '.gsch-new{margin-left:auto;background:#2C5856;color:#fff;border:none;border-radius:9px;padding:9px 16px;font:inherit;font-weight:600;font-size:13px;cursor:pointer;}'
    + '.gsch-form{background:#faf7f0;border:1px solid #e5ddcd;border-radius:12px;padding:14px;margin-bottom:14px;display:none;}'
    + '.gsch-form.open{display:block;}'
    + '.gsch-form .row{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:10px;}'
    + '.gsch-form label{font-size:12px;color:#6a6250;display:flex;flex-direction:column;gap:4px;flex:1;min-width:140px;}'
    + '.gsch-form input,.gsch-form select{font:inherit;padding:8px 10px;border:1px solid #d8d2c4;border-radius:8px;background:#fff;}'
    + '.gsch-form .f-when-ctl{display:flex;gap:6px;align-items:center;}'
    + '.gsch-form .f-when-ctl .f-date{flex:1;min-width:120px;}'
    + '.gsch-form .f-when-ctl select{padding:8px 6px;}'
    + '.gsch-form .f-colon{color:#6a6250;font-weight:700;}'
    + '.gsch-form .acts{display:flex;gap:8px;}'
    + '.gsch-btn{background:#2C5856;color:#fff;border:none;border-radius:8px;padding:9px 16px;font:inherit;font-weight:600;font-size:13px;cursor:pointer;}'
    + '.gsch-btn.ghost{background:transparent;color:#6a6250;border:1px solid #d8d2c4;}'
    + '.gsch-btn.danger{background:transparent;color:#b3402f;border:1px solid #e3b6ae;}'
    + '.gsch-btn:disabled{opacity:.5;cursor:default;}'
    + '.gsch-list{display:flex;flex-direction:column;gap:10px;}'
    + '.gsch-item{display:flex;align-items:center;gap:14px;background:#fff;border:1px solid #e5ddcd;border-radius:12px;padding:12px 14px;}'
    + '.gsch-item.soon{border-color:#2C5856;box-shadow:0 0 0 2px rgba(44,88,86,.12);}'
    + '.gsch-date{text-align:center;min-width:56px;line-height:1.1;}'
    + '.gsch-date .d{font-size:22px;font-weight:800;color:#2C5856;}'
    + '.gsch-date .m{font-size:11px;text-transform:uppercase;color:#8a8172;}'
    + '.gsch-meta{flex:1;min-width:0;}'
    + '.gsch-meta .t{font-weight:700;font-size:15px;}'
    + '.gsch-meta .s{font-size:12.5px;color:#8a8172;margin-top:2px;}'
    + '.gsch-item .go{display:flex;gap:6px;flex-shrink:0;}'
    + '.gsch-empty{text-align:center;color:#8a8172;font-size:14px;padding:26px;background:#faf7f0;border-radius:12px;}'
    + '.gsch-cal{background:#fff;border:1px solid #e5ddcd;border-radius:12px;padding:12px;}'
    + '.gsch-cal-h{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;}'
    + '.gsch-cal-h b{font-size:15px;}'
    + '.gsch-cal-h button{border:1px solid #d8d2c4;background:#f4efe6;border-radius:8px;width:32px;height:32px;font-size:16px;cursor:pointer;}'
    + '.gsch-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:4px;}'
    + '.gsch-grid .wd{text-align:center;font-size:11px;color:#8a8172;padding:4px 0;font-weight:600;}'
    + '.gsch-cell{min-height:64px;border:1px solid #eee4d4;border-radius:8px;padding:4px;font-size:12px;position:relative;cursor:default;background:#fdfbf7;overflow:hidden;}'
    + '.gsch-cell.out{opacity:.35;}'
    + '.gsch-cell.has{cursor:pointer;border-color:#cbe0dc;}'
    + '.gsch-cell.today{border-color:#2C5856;}'
    + '.gsch-cell.sel{background:#2C5856;color:#fff;}'
    + '.gsch-cell .num{font-weight:600;}'
    + '.gsch-cell .ev{display:block;font-size:9.5px;line-height:1.3;background:#e7f0ee;color:#2C5856;border-radius:4px;padding:1px 4px;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}'
    + '.gsch-cell .ev b{font-weight:700;}'
    + '.gsch-cell .ev.ev-more{background:transparent;color:#8a8172;padding:0 4px;}'
    + '.gsch-cell.sel .ev{background:rgba(255,255,255,.22);color:#fff;}'
    + '.gsch-cell.sel .ev.ev-more{background:transparent;color:#eee;}'
    + '.gsch-daylist{margin-top:12px;}';

  function injectCSS(){ if(document.getElementById('gsch-css'))return; var s=document.createElement('style'); s.id='gsch-css'; s.textContent=CSS; document.head.appendChild(s); }
  function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
  var MONTHS=['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'];
  var MONTHS_L=['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
  var WD=['Pzt','Sal','Çar','Per','Cum','Cmt','Paz'];
  function two(n){return n<10?'0'+n:''+n;}
  function sameDay(a,b){ return a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate(); }
  function hhmm(d){ return two(d.getHours())+':'+two(d.getMinutes()); }
  function relLabel(start){
    var ms=start.getTime()-Date.now();
    if(ms<0) return 'başladı';
    var m=Math.round(ms/60000);
    if(m<60) return m+' dk sonra';
    var h=Math.round(m/60); if(h<24) return h+' saat sonra';
    var d=Math.round(h/24); return d+' gün sonra';
  }

  function mount(opts){
    injectCSS();
    var sb=opts.sb, role=opts.role, cont=opts.container;
    if(!sb||!cont) return null;
    var aggregate=!!opts.aggregate;               // öğretmenin TÜM sınıfları tek takvimde
    var classList=opts.classes||[];               // aggregate modda ders planlama için sınıf seçici
    var state={ view:'list', month:new Date(new Date().getFullYear(),new Date().getMonth(),1), rows:[], sel:null };

    var _hopt='<option value="">--</option>'; for(var _h=0;_h<24;_h++){ var _hh=('0'+_h).slice(-2); _hopt+='<option value="'+_hh+'">'+_hh+'</option>'; }
    var _mopt='<option value="">--</option>'; for(var _m=0;_m<60;_m+=5){ var _mm=('0'+_m).slice(-2); _mopt+='<option value="'+_mm+'">'+_mm+'</option>'; }

    cont.innerHTML =
      '<div class="gsch">'
      + '<div class="gsch-head">'
      +   '<div class="gsch-toggle"><button data-v="list" class="on">Liste</button><button data-v="cal">Takvim</button></div>'
      +   (role==='teacher' ? '<button class="gsch-new">+ Yeni Ders Planla</button>' : '')
      + '</div>'
      + (role==='teacher' ?
          '<div class="gsch-form">'
          + (aggregate ? '<div class="row"><label>Sınıf<select class="f-class">'+classList.map(function(c){return '<option value="'+esc(c.id)+'">'+esc(c.name||c.id)+'</option>';}).join('')+'</select></label></div>' : '')
          + '<div class="row"><label>Başlık<input type="text" class="f-title" placeholder="Örn. Speaking pratiği" maxlength="80"></label>'
          + '<label>Tarih & saat<span class="f-when-ctl"><input type="date" class="f-date" lang="tr-TR"><select class="f-h">'+_hopt+'</select><span class="f-colon">:</span><select class="f-m">'+_mopt+'</select></span></label>'
          + '<label>Süre<select class="f-dur"><option value="30">30 dk</option><option value="45">45 dk</option><option value="60" selected>60 dk</option><option value="90">90 dk</option><option value="120">120 dk</option></select></label></div>'
          + '<div class="row"><label style="flex:2">Not (opsiyonel)<input type="text" class="f-note" placeholder="Öğrencilere kısa not" maxlength="140"></label></div>'
          + '<div class="acts"><button class="gsch-btn f-save">Planla</button><button class="gsch-btn ghost f-cancel">Vazgeç</button></div>'
          + '</div>'
        : '')
      + '<div class="gsch-body"></div>'
      + '</div>';

    var body=cont.querySelector('.gsch-body');
    cont.querySelectorAll('.gsch-toggle button').forEach(function(b){ b.addEventListener('click',function(){ state.view=b.dataset.v; cont.querySelectorAll('.gsch-toggle button').forEach(function(x){x.classList.toggle('on',x===b);}); render(); }); });

    if(role==='teacher'){
      var form=cont.querySelector('.gsch-form');
      cont.querySelector('.gsch-new').addEventListener('click',function(){ form.classList.toggle('open'); });
      cont.querySelector('.f-cancel').addEventListener('click',function(){ form.classList.remove('open'); });
      cont.querySelector('.f-save').addEventListener('click', save);
    }

    async function save(){
      var title=(cont.querySelector('.f-title').value||'').trim();
      var _fd=(cont.querySelector('.f-date').value||'');
      var _fh=cont.querySelector('.f-h').value, _fm=cont.querySelector('.f-m').value;
      var when=_fd ? (_fd+'T'+(_fh||'00')+':'+(_fm||'00')) : '';
      var dur=parseInt(cont.querySelector('.f-dur').value,10)||60;
      var note=(cont.querySelector('.f-note').value||'').trim();
      if(!title){ alert('Başlık gir.'); return; }
      if(!_fd){ alert('Tarih seç.'); return; }
      if(!_fh){ alert('Saat seç.'); return; }
      var startsAt=new Date(when);
      if(isNaN(startsAt.getTime())){ alert('Geçerli bir tarih seç.'); return; }
      var classId = aggregate ? ((cont.querySelector('.f-class')||{}).value||'') : opts.classId;
      if(aggregate && !classId){ alert('Sınıf seç.'); return; }
      var room=(opts.roomForClass?opts.roomForClass(classId):('C'+String(classId).replace(/[^a-zA-Z0-9]/g,'').slice(0,8)).toUpperCase());
      var btn=cont.querySelector('.f-save'); btn.disabled=true; var old=btn.textContent; btn.textContent='Kaydediliyor…';
      try{
        var r=await sb.from('grimeet_schedule').insert({ class_id:classId, teacher_id:opts.userId, title:title, starts_at:startsAt.toISOString(), duration_min:dur, room_code:room, note:note||null }).select('id').single();
        if(r.error) throw r.error;
        if(r.data&&r.data.id){ sb.functions.invoke('notify-class-assignment',{body:{kind:'lesson',schedule_id:r.data.id}}).catch(function(){}); }
        cont.querySelector('.f-title').value=''; cont.querySelector('.f-note').value=''; cont.querySelector('.gsch-form').classList.remove('open');
        await load();
      }catch(e){ alert('Kaydedilemedi: '+(e.message||'hata')); }
      finally{ btn.disabled=false; btn.textContent=old; }
    }

    async function cancelLesson(id){
      if(!confirm('Bu ders iptal edilsin mi?')) return;
      try{ var r=await sb.from('grimeet_schedule').update({status:'cancelled'}).eq('id',id); if(r.error) throw r.error; await load(); }
      catch(e){ alert('İptal edilemedi.'); }
    }

    async function load(){
      body.innerHTML='<div class="gsch-empty">Yükleniyor…</div>';
      try{
        var floor=new Date(Date.now()-3*3600*1000).toISOString(); // son 3 saati de göster
        var q=sb.from('grimeet_schedule').select('id,title,starts_at,duration_min,room_code,note,status,class_id,classes(name)').eq('status','scheduled').gte('starts_at',floor).order('starts_at',{ascending:true});
        if(role==='teacher'){ if(aggregate) q=q.eq('teacher_id',opts.userId); else q=q.eq('class_id',opts.classId); }
        var r=await q;
        if(r.error) throw r.error;
        state.rows=(r.data||[]).map(function(x){ x._d=new Date(x.starts_at); return x; });
        render();
        if(opts.onLoad) try{ opts.onLoad(state.rows.length); }catch(_e){}
      }catch(e){ body.innerHTML='<div class="gsch-empty">Program yüklenemedi.</div>'; if(opts.onLoad) try{ opts.onLoad(0); }catch(_e){} }
    }

    function actionBtns(row){
      var start=row._d, dur=row.duration_min||60;
      var openFrom=start.getTime()-15*60000, openTo=start.getTime()+ (dur+30)*60000;
      var now=Date.now(), live=now>=openFrom&&now<=openTo;
      if(role==='teacher'){
        return '<a class="gsch-btn" href="grimeet-oda.html?room='+encodeURIComponent(row.room_code)+'&host=1">'+(live?'Şimdi Başlat':'Başlat')+'</a>'
             + '<button class="gsch-btn danger" data-cancel="'+row.id+'">İptal</button>';
      }
      if(live) return '<a class="gsch-btn" href="grimeet-oda.html?room='+encodeURIComponent(row.room_code)+'">Katıl</a>';
      return '<button class="gsch-btn" disabled>'+relLabel(start)+'</button>';
    }

    function itemHTML(row){
      var d=row._d, dur=row.duration_min||60;
      var start=d.getTime(), soon=(start-Date.now())<60*60000 && (start-Date.now())>-((dur+30)*60000);
      var cls=row.classes&&row.classes.name?row.classes.name:'';
      var showCls=(role==='student'||aggregate);
      var sub=WD[(d.getDay()+6)%7]+' '+d.getDate()+' '+MONTHS[d.getMonth()]+' · '+hhmm(d)+' · '+dur+' dk'+(showCls&&cls?(' · '+esc(cls)):'')+' · '+relLabel(d);
      return '<div class="gsch-item'+(soon?' soon':'')+'">'
        + '<div class="gsch-date"><div class="d">'+d.getDate()+'</div><div class="m">'+MONTHS[d.getMonth()]+'</div></div>'
        + '<div class="gsch-meta"><div class="t">'+esc(row.title)+'</div><div class="s">'+sub+(row.note?(' — '+esc(row.note)):'')+'</div></div>'
        + '<div class="go">'+actionBtns(row)+'</div>'
        + '</div>';
    }

    function bindActions(scope){
      scope.querySelectorAll('[data-cancel]').forEach(function(b){ b.addEventListener('click',function(){ cancelLesson(b.getAttribute('data-cancel')); }); });
    }

    function renderList(){
      if(!state.rows.length){ body.innerHTML='<div class="gsch-empty">'+(role==='teacher'?'Henüz planlanmış ders yok. “+ Yeni Ders Planla” ile ekle.':'Yaklaşan canlı ders yok.')+'</div>'; return; }
      body.innerHTML='<div class="gsch-list">'+state.rows.map(itemHTML).join('')+'</div>';
      bindActions(body);
    }

    function renderCal(){
      var m=state.month, y=m.getFullYear(), mo=m.getMonth();
      var first=new Date(y,mo,1), startWd=(first.getDay()+6)%7; // Pzt=0
      var days=new Date(y,mo+1,0).getDate();
      var byDay={}; state.rows.forEach(function(r){ if(r._d.getFullYear()===y&&r._d.getMonth()===mo){ (byDay[r._d.getDate()]=byDay[r._d.getDate()]||[]).push(r); } });
      var today=new Date();
      var cells='';
      for(var i=0;i<startWd;i++) cells+='<div class="gsch-cell out"></div>';
      for(var dnum=1;dnum<=days;dnum++){
        var evs=byDay[dnum]||[], has=evs.length>0, isToday=sameDay(new Date(y,mo,dnum),today), selD=state.sel&&sameDay(new Date(y,mo,dnum),state.sel);
        var evHTML=evs.slice(0,3).map(function(r){ var cn=r.classes&&r.classes.name?r.classes.name:''; var lbl=cn?(esc(cn)+' ('+esc(r.title)+')'):esc(r.title); return '<span class="ev"><b>'+hhmm(r._d)+'</b> '+lbl+'</span>'; }).join('');
        if(evs.length>3) evHTML+='<span class="ev ev-more">+'+(evs.length-3)+' ders</span>';
        cells+='<div class="gsch-cell'+(has?' has':'')+(isToday?' today':'')+(selD?' sel':'')+'" data-day="'+dnum+'"><span class="num">'+dnum+'</span>'+evHTML+'</div>';
      }
      body.innerHTML='<div class="gsch-cal"><div class="gsch-cal-h"><button class="cal-prev">‹</button><b>'+MONTHS_L[mo]+' '+y+'</b><button class="cal-next">›</button></div>'
        + '<div class="gsch-grid">'+WD.map(function(w){return '<div class="wd">'+w+'</div>';}).join('')+cells+'</div>'
        + '<div class="gsch-daylist"></div></div>';
      body.querySelector('.cal-prev').addEventListener('click',function(){ state.month=new Date(y,mo-1,1); state.sel=null; renderCal(); });
      body.querySelector('.cal-next').addEventListener('click',function(){ state.month=new Date(y,mo+1,1); state.sel=null; renderCal(); });
      body.querySelectorAll('.gsch-cell.has').forEach(function(c){ c.addEventListener('click',function(){ state.sel=new Date(y,mo,parseInt(c.dataset.day,10)); renderCal(); }); });
      var dl=body.querySelector('.gsch-daylist');
      var showDay = state.sel || (Object.keys(byDay).length? new Date(y,mo,parseInt(Object.keys(byDay).sort(function(a,b){return a-b;})[0],10)) : null);
      if(showDay){ state.sel=showDay; body.querySelectorAll('.gsch-cell').forEach(function(c){ if(c.dataset.day) c.classList.toggle('sel', parseInt(c.dataset.day,10)===showDay.getDate()); });
        var list=byDay[showDay.getDate()]||[];
        dl.innerHTML='<div class="gsch-list">'+list.map(itemHTML).join('')+'</div>';
        bindActions(dl);
      }
    }

    function render(){ if(state.view==='list') renderList(); else renderCal(); }

    load();
    return { reload:load };
  }

  window.GriSchedule = { mount: mount };
})();
