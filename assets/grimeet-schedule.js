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
    + '.gsch-item{display:block;background:#fff;border:1px solid #e5ddcd;border-radius:14px;padding:12px 13px;}'
    + '.gsch-item.soon{border-color:#2C5856;box-shadow:0 0 0 2px rgba(44,88,86,.12);}'
    + '.gsch-item-head{display:flex;align-items:center;gap:8px;margin-bottom:5px;}'
    + '.gsch-daypill{flex:0 0 auto;font:800 11px/1 inherit;color:#2C5856;background:#e7f0ee;border-radius:20px;padding:5px 9px;}'
    + '.gsch-item.soon .gsch-daypill{background:#2C5856;color:#fff;}'
    + '.gsch-item-title{font-weight:700;font-size:15px;color:#2a2a2a;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0;}'
    + '.gsch-item-sub{font-size:12.5px;color:#8a8172;line-height:1.5;}'
    + '.gsch-item-note{font-size:12px;color:#a89a78;margin-top:3px;font-style:italic;}'
    + '.gsch-item-actions{margin-top:9px;display:flex;gap:6px;}'
    + '.gsch-item-actions .gsch-btn{flex:1;text-align:center;}'
    + '.gsch-empty{text-align:center;color:#8a8172;font-size:14px;padding:26px;background:#faf7f0;border-radius:12px;}'
    + '.gsch-cal{background:#fff;border:1px solid #e5ddcd;border-radius:14px;padding:14px;box-shadow:0 2px 10px rgba(30,25,20,.04);}'
    + '.gsch-cal-h{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;}'
    + '.gsch-cal-h b{font-size:16px;font-weight:700;color:#2a2a2a;}'
    + '.gsch-cal-h button{border:1px solid #e0d8c8;background:#faf7f0;border-radius:9px;width:34px;height:34px;font-size:17px;color:#6a6250;cursor:pointer;transition:background .12s,border-color .12s,color .12s;}'
    + '.gsch-cal-h button:hover{background:#2C5856;color:#fff;border-color:#2C5856;}'
    + '.gsch-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:5px;}'
    + '.gsch-grid .wd{text-align:center;font-size:10.5px;color:#a89a78;padding:2px 0 6px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;}'
    + '.gsch-cell{min-height:66px;border:1px solid #efe7d6;border-radius:10px;padding:5px;font-size:12px;position:relative;cursor:default;background:#fdfbf7;overflow:hidden;transition:border-color .12s,background .12s,box-shadow .12s;}'
    + '.gsch-cell.out{opacity:.3;background:transparent;border-color:transparent;}'
    + '.gsch-cell.has{cursor:pointer;background:#fff;border-color:#cbe0dc;}'
    + '.gsch-cell.has:hover{border-color:#2C5856;box-shadow:0 3px 10px rgba(44,88,86,.12);}'
    + '.gsch-cell.today{border-color:#C79A3A;box-shadow:inset 0 0 0 1px #C79A3A;}'
    + '.gsch-cell.today .num{color:#B0791E;}'
    + '.gsch-cell.sel{background:#2C5856;border-color:#2C5856;color:#fff;}'
    + '.gsch-cell.sel .num{color:#fff;}'
    + '.gsch-cell .num{font-weight:700;font-size:12.5px;color:#6a6250;}'
    + '.gsch-cell .ev{display:block;font-size:9.5px;line-height:1.35;background:#e7f0ee;color:#2C5856;border-radius:5px;padding:2px 5px;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-weight:600;}'
    + '.gsch-cell .ev b{font-weight:800;}'
    + '.gsch-cell .ev.ev-more{background:transparent;color:#8a8172;padding:0 5px;font-weight:700;}'
    + '.gsch-cell .ev[draggable="true"]{cursor:grab;}'
    + '.gsch-cell .ev.dragging{opacity:.4;}'
    + '.gsch-cell.drop-ok{border-color:#2C5856;background:#eaf3f1;box-shadow:inset 0 0 0 2px rgba(44,88,86,.30);}'
    + '.gsch-form.editing{border-color:#2C5856;box-shadow:0 0 0 2px rgba(44,88,86,.15);}'
    + '.gsch-form .edit-tag{display:none;font-size:12px;color:#2C5856;font-weight:700;margin-bottom:8px;}'
    + '.gsch-form.editing .edit-tag{display:block;}'
    + '.gsch-cell.sel .ev{background:rgba(255,255,255,.22);color:#fff;}'
    + '.gsch-cell.sel .ev.ev-more{background:transparent;color:#eee;}'
    + '.gsch-daylist{margin-top:12px;}'
    + '.gsch-split{display:flex;gap:16px;align-items:stretch;}'
    + '.gsch-col{min-width:0;}'
    + '.gsch-col-cal{flex:1 1 63%;}'
    + '.gsch-col-list{flex:1 1 37%;position:relative;}'
    + '.gsch-col-list-inner{position:absolute;inset:0;overflow-y:auto;overflow-x:hidden;padding-right:6px;}'
    + '.gsch-col-list-inner::-webkit-scrollbar{width:8px;}'
    + '.gsch-col-list-inner::-webkit-scrollbar-thumb{background:#d8d2c4;border-radius:6px;}'
    + '.gsch-col-list-inner::-webkit-scrollbar-track{background:transparent;}'
    + '.gsch-item{transition:box-shadow .15s,border-color .15s,transform .1s;}'
    + '.gsch-item:hover{transform:translateY(-1px);box-shadow:0 5px 16px rgba(30,25,20,.10);}'
    + '.gsch-item.hl{border-color:#2C5856;box-shadow:0 0 0 2px rgba(44,88,86,.20);}'
    + '@media(max-width:760px){.gsch-split{flex-direction:column;}.gsch-col-list{position:static;}.gsch-col-list-inner{position:static;max-height:320px;}}'
    + '@media(max-width:480px){'
    + '.gsch-cal{padding:8px;}'
    + '.gsch-grid{gap:2px;}'
    + '.gsch-cell{min-height:50px;padding:2px 3px;font-size:11px;}'
    + '.gsch-cell .num{font-size:11px;}'
    + '.gsch-cell .ev{font-size:8px;padding:1px 3px;margin-top:2px;}'
    + '.gsch-date{min-width:44px;}'
    + '.gsch-date .d{font-size:19px;}'
    + '.gsch-item{gap:10px;padding:10px 11px;}'
    + '.gsch-new{margin-left:0;width:100%;padding:10px;}'
    + '.gsch-head{gap:6px;}'
    + '.gsch-form .acts{flex-wrap:wrap;}'
    + '.gsch-form .acts .gsch-btn{flex:1 1 auto;}'
    + '}'
    /* ── Gece modu (data-theme="dark") override — açık tema aynen korunur ── */
    + ':root[data-theme="dark"] .gsch{color:#f0e9db;}'
    + ':root[data-theme="dark"] .gsch-toggle{border-color:#3a3428;}'
    + ':root[data-theme="dark"] .gsch-toggle button{background:#2a2419;color:#b5ac98;}'
    + ':root[data-theme="dark"] .gsch-form{background:#1f1b14;border-color:#3a3428;}'
    + ':root[data-theme="dark"] .gsch-form label{color:#b5ac98;}'
    + ':root[data-theme="dark"] .gsch-form input,:root[data-theme="dark"] .gsch-form select{background:#2a2419;border-color:#3a3428;color:#f0e9db;}'
    + ':root[data-theme="dark"] .gsch-form .f-colon{color:#b5ac98;}'
    + ':root[data-theme="dark"] .gsch-btn.ghost{color:#b5ac98;border-color:#3a3428;}'
    + ':root[data-theme="dark"] .gsch-btn.danger{color:#e6796a;border-color:#5a3630;}'
    + ':root[data-theme="dark"] .gsch-item{background:#241f18;border-color:#3a3428;}'
    + ':root[data-theme="dark"] .gsch-daypill{background:#22403e;color:#bfe0da;}'
    + ':root[data-theme="dark"] .gsch-item-title{color:#f0e9db;}'
    + ':root[data-theme="dark"] .gsch-item-sub{color:#b5ac98;}'
    + ':root[data-theme="dark"] .gsch-item-note{color:#9a917d;}'
    + ':root[data-theme="dark"] .gsch-empty{background:#1f1b14;color:#b5ac98;}'
    + ':root[data-theme="dark"] .gsch-cal{background:#241f18;border-color:#3a3428;box-shadow:0 2px 10px rgba(0,0,0,.25);}'
    + ':root[data-theme="dark"] .gsch-cal-h b{color:#f0e9db;}'
    + ':root[data-theme="dark"] .gsch-cal-h button{background:#2a2419;border-color:#3a3428;color:#b5ac98;}'
    + ':root[data-theme="dark"] .gsch-cal-h button:hover{background:#2C5856;color:#fff;border-color:#2C5856;}'
    + ':root[data-theme="dark"] .gsch-grid .wd{color:#9a917d;}'
    + ':root[data-theme="dark"] .gsch-cell:not(.out):not(.sel){background:#1c1813;border-color:#332e23;}'
    + ':root[data-theme="dark"] .gsch-cell.has:not(.sel){background:#241f18;border-color:#2f4e4b;}'
    + ':root[data-theme="dark"] .gsch-cell.today{border-color:#C79A3A;box-shadow:inset 0 0 0 1px #C79A3A;}'
    + ':root[data-theme="dark"] .gsch-cell:not(.sel) .num{color:#b5ac98;}'
    + ':root[data-theme="dark"] .gsch-cell.today .num{color:#E0B85A;}'
    + ':root[data-theme="dark"] .gsch-cell:not(.sel) .ev{background:#22403e;color:#bfe0da;}'
    + ':root[data-theme="dark"] .gsch-cell:not(.sel) .ev.ev-more{background:transparent;color:#9a917d;}'
    + ':root[data-theme="dark"] .gsch-col-list-inner::-webkit-scrollbar-thumb{background:#3a3428;}'
    + '';

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
    var manageOwn=!!opts.manageOwn;               // öğrenci sayfasında da SAHİBİ olduğun dersi düzenle
    var classList=opts.classes||[];               // aggregate modda ders planlama için sınıf seçici
    var _savedView='list'; try{ var _v=localStorage.getItem('gsch-view'); if(_v==='cal'||_v==='list') _savedView=_v; }catch(e){}
    var state={ view:_savedView, month:new Date(new Date().getFullYear(),new Date().getMonth(),1), rows:[], sel:null, editing:null };

    var _hopt='<option value="">--</option>'; for(var _h=0;_h<24;_h++){ var _hh=('0'+_h).slice(-2); _hopt+='<option value="'+_hh+'">'+_hh+'</option>'; }
    var _mopt='<option value="">--</option>'; for(var _m=0;_m<60;_m+=5){ var _mm=('0'+_m).slice(-2); _mopt+='<option value="'+_mm+'">'+_mm+'</option>'; }

    cont.innerHTML =
      '<div class="gsch">'
      + (role==='teacher' ? '<div class="gsch-head"><button class="gsch-new">+ Yeni Ders Planla</button></div>' : '')
      + ((role==='teacher'||manageOwn) ?
          '<div class="gsch-form">'
          + '<div class="edit-tag">Dersi düzenliyorsun — saat, tarih, süre veya notu değiştir.</div>'
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
    cont.querySelectorAll('.gsch-toggle button').forEach(function(b){ b.addEventListener('click',function(){ state.view=b.dataset.v; try{localStorage.setItem('gsch-view',state.view);}catch(e){} cont.querySelectorAll('.gsch-toggle button').forEach(function(x){x.classList.toggle('on',x===b);}); render(); }); });

    function resetForm(){
      var f=cont.querySelector('.gsch-form'); if(!f) return;
      f.classList.remove('open'); f.classList.remove('editing');
      state.editing=null;
      var sv=cont.querySelector('.f-save'); if(sv) sv.textContent='Planla';
      cont.querySelector('.f-title').value=''; cont.querySelector('.f-note').value='';
    }

    var form=cont.querySelector('.gsch-form');
    if(form){
      var newBtn=cont.querySelector('.gsch-new');
      if(newBtn) newBtn.addEventListener('click',function(){
        if(form.classList.contains('open')){ resetForm(); }
        else { resetForm(); form.classList.add('open'); }
      });
      cont.querySelector('.f-cancel').addEventListener('click', resetForm);
      cont.querySelector('.f-save').addEventListener('click', save);
    }

    function canManage(row){ return role==='teacher' || (!!opts.userId && String(row.teacher_id)===String(opts.userId)); }

    function startEdit(id){
      var row=null; for(var i=0;i<state.rows.length;i++){ if(String(state.rows[i].id)===String(id)){ row=state.rows[i]; break; } }
      if(!row || !canManage(row)) return;
      state.editing=id;
      var d=row._d;
      if(aggregate){ var fc=cont.querySelector('.f-class'); if(fc) fc.value=row.class_id; }
      cont.querySelector('.f-title').value=row.title||'';
      cont.querySelector('.f-date').value=d.getFullYear()+'-'+two(d.getMonth()+1)+'-'+two(d.getDate());
      cont.querySelector('.f-h').value=two(d.getHours());
      cont.querySelector('.f-m').value=two(Math.floor(d.getMinutes()/5)*5);
      cont.querySelector('.f-dur').value=String(row.duration_min||60);
      cont.querySelector('.f-note').value=row.note||'';
      var f=cont.querySelector('.gsch-form'); f.classList.add('open'); f.classList.add('editing');
      cont.querySelector('.f-save').textContent='Güncelle';
      if(f.scrollIntoView) f.scrollIntoView({behavior:'smooth',block:'nearest'});
    }

    async function reschedule(id, iso){
      try{
        var r=await sb.from('grimeet_schedule').update({starts_at:iso}).eq('id',id);
        if(r.error) throw r.error;
        sb.functions.invoke('notify-class-assignment',{body:{kind:'lesson',schedule_id:id}}).catch(function(){});
        await load();
      }catch(e){ alert('Taşınamadı: '+(e.message||'hata')); }
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
        if(state.editing){
          var upd={ title:title, starts_at:startsAt.toISOString(), duration_min:dur, note:note||null };
          if(aggregate && classId){ upd.class_id=classId; upd.room_code=room; }
          var ru=await sb.from('grimeet_schedule').update(upd).eq('id',state.editing);
          if(ru.error) throw ru.error;
          sb.functions.invoke('notify-class-assignment',{body:{kind:'lesson',schedule_id:state.editing}}).catch(function(){});
          resetForm();
          await load();
        } else {
          var r=await sb.from('grimeet_schedule').insert({ class_id:classId, teacher_id:opts.userId, title:title, starts_at:startsAt.toISOString(), duration_min:dur, room_code:room, note:note||null }).select('id').single();
          if(r.error) throw r.error;
          if(r.data&&r.data.id){ sb.functions.invoke('notify-class-assignment',{body:{kind:'lesson',schedule_id:r.data.id}}).catch(function(){}); }
          resetForm();
          await load();
        }
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
        var q=sb.from('grimeet_schedule').select('id,title,starts_at,duration_min,room_code,note,status,class_id,teacher_id,classes(name)').eq('status','scheduled').gte('starts_at',floor).order('starts_at',{ascending:true});
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
      if(canManage(row)){
        return '<a class="gsch-btn" href="grimeet-oda.html?room='+encodeURIComponent(row.room_code)+'&host=1">'+(live?'Şimdi Başlat':'Başlat')+'</a>'
             + '<button class="gsch-btn ghost" data-edit="'+row.id+'">Düzenle</button>'
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
      var line=WD[(d.getDay()+6)%7]+' '+d.getDate()+' '+MONTHS[d.getMonth()]+' · '+hhmm(d)+' · '+dur+' dk'+(showCls&&cls?(' · '+esc(cls)):'');
      return '<div class="gsch-item'+(soon?' soon':'')+'" data-date="'+d.toDateString()+'">'
        + '<div class="gsch-item-head"><span class="gsch-daypill">'+d.getDate()+' '+MONTHS[d.getMonth()]+'</span><span class="gsch-item-title">'+esc(row.title)+'</span></div>'
        + '<div class="gsch-item-sub">'+line+'</div>'
        + (row.note?'<div class="gsch-item-note">'+esc(row.note)+'</div>':'')
        + '<div class="gsch-item-actions">'+actionBtns(row)+'</div>'
        + '</div>';
    }

    function bindActions(scope){
      scope.querySelectorAll('[data-cancel]').forEach(function(b){ b.addEventListener('click',function(){ cancelLesson(b.getAttribute('data-cancel')); }); });
      scope.querySelectorAll('[data-edit]').forEach(function(b){ b.addEventListener('click',function(){ startEdit(b.getAttribute('data-edit')); }); });
    }

    function renderListInner(el){
      if(!state.rows.length){ el.innerHTML='<div class="gsch-empty">'+(role==='teacher'?'Henüz planlanmış ders yok. “+ Yeni Ders Planla” ile ekle.':'Yaklaşan online ders yok.')+'</div>'; return; }
      el.innerHTML='<div class="gsch-list">'+state.rows.map(itemHTML).join('')+'</div>';
      bindActions(el);
    }

    function highlightDay(dt){
      var lst=cont.querySelector('.gsch-col-list-inner'); if(!lst)return;
      var key=dt.toDateString(), first=null;
      lst.querySelectorAll('.gsch-item').forEach(function(it){ var on=it.getAttribute('data-date')===key; it.classList.toggle('hl',on); if(on&&!first)first=it; });
      if(first&&first.scrollIntoView) first.scrollIntoView({behavior:'smooth',block:'nearest'});
    }

    function renderCal(el){
      var m=state.month, y=m.getFullYear(), mo=m.getMonth();
      var first=new Date(y,mo,1), startWd=(first.getDay()+6)%7; // Pzt=0
      var days=new Date(y,mo+1,0).getDate();
      var byDay={}; state.rows.forEach(function(r){ if(r._d.getFullYear()===y&&r._d.getMonth()===mo){ (byDay[r._d.getDate()]=byDay[r._d.getDate()]||[]).push(r); } });
      var today=new Date();
      var cells='';
      for(var i=0;i<startWd;i++) cells+='<div class="gsch-cell out"></div>';
      for(var dnum=1;dnum<=days;dnum++){
        var evs=byDay[dnum]||[], has=evs.length>0, isToday=sameDay(new Date(y,mo,dnum),today), selD=state.sel&&sameDay(new Date(y,mo,dnum),state.sel);
        var evHTML=evs.slice(0,2).map(function(r){ var cn=r.classes&&r.classes.name?r.classes.name:''; var lbl=cn?(esc(cn)+' ('+esc(r.title)+')'):esc(r.title); return '<span class="ev"'+(canManage(r)?' draggable="true" data-id="'+esc(r.id)+'"':'')+'><b>'+hhmm(r._d)+'</b> '+lbl+'</span>'; }).join('');
        if(evs.length>2) evHTML+='<span class="ev ev-more">+'+(evs.length-2)+'</span>';
        cells+='<div class="gsch-cell'+(has?' has':'')+(isToday?' today':'')+(selD?' sel':'')+'" data-day="'+dnum+'"><span class="num">'+dnum+'</span>'+evHTML+'</div>';
      }
      el.innerHTML='<div class="gsch-cal"><div class="gsch-cal-h"><button class="cal-prev" aria-label="Önceki ay">‹</button><b>'+MONTHS_L[mo]+' '+y+'</b><button class="cal-next" aria-label="Sonraki ay">›</button></div>'
        + '<div class="gsch-grid">'+WD.map(function(w){return '<div class="wd">'+w+'</div>';}).join('')+cells+'</div></div>';
      el.querySelector('.cal-prev').addEventListener('click',function(){ state.month=new Date(y,mo-1,1); state.sel=null; renderCal(el); });
      el.querySelector('.cal-next').addEventListener('click',function(){ state.month=new Date(y,mo+1,1); state.sel=null; renderCal(el); });
      el.querySelectorAll('.gsch-cell.has').forEach(function(c){ c.addEventListener('click',function(){ var dd=parseInt(c.dataset.day,10); state.sel=new Date(y,mo,dd); renderCal(el); highlightDay(new Date(y,mo,dd)); }); });
      if(role==='teacher'||manageOwn){
        el.querySelectorAll('.ev[draggable="true"]').forEach(function(ev){
          ev.addEventListener('dragstart',function(e){ e.stopPropagation(); try{ e.dataTransfer.setData('text/plain', ev.getAttribute('data-id')); e.dataTransfer.effectAllowed='move'; }catch(_e){} ev.classList.add('dragging'); });
          ev.addEventListener('dragend',function(){ ev.classList.remove('dragging'); el.querySelectorAll('.drop-ok').forEach(function(x){x.classList.remove('drop-ok');}); });
        });
        el.querySelectorAll('.gsch-cell:not(.out)').forEach(function(c){
          c.addEventListener('dragover',function(e){ e.preventDefault(); try{ e.dataTransfer.dropEffect='move'; }catch(_e){} c.classList.add('drop-ok'); });
          c.addEventListener('dragleave',function(){ c.classList.remove('drop-ok'); });
          c.addEventListener('drop',function(e){ e.preventDefault(); c.classList.remove('drop-ok'); var id=''; try{ id=e.dataTransfer.getData('text/plain'); }catch(_e){} var day=parseInt(c.dataset.day,10); if(!id||!day) return; dropReschedule(id,y,mo,day); });
        });
      }
    }

    function dropReschedule(id,y,mo,day){
      var row=null; for(var i=0;i<state.rows.length;i++){ if(String(state.rows[i].id)===String(id)){ row=state.rows[i]; break; } }
      if(!row || !canManage(row)) return;
      var od=row._d;
      if(od.getFullYear()===y && od.getMonth()===mo && od.getDate()===day) return;
      var nd=new Date(y,mo,day,od.getHours(),od.getMinutes(),0,0);
      if(!confirm('“'+(row.title||'Ders')+'” dersi '+day+' '+MONTHS_L[mo]+' '+y+', '+hhmm(od)+' saatine taşınsın mı?\n(Saati değiştirmek için Düzenle’yi kullan.)')) return;
      reschedule(id, nd.toISOString());
    }

    function render(){
      if(!state.rows.length){ body.innerHTML='<div class="gsch-empty">'+(role==='teacher'?'Henüz planlanmış ders yok. “+ Yeni Ders Planla” ile ekle.':'Yaklaşan online ders yok.')+'</div>'; return; }
      body.innerHTML='<div class="gsch-split"><div class="gsch-col gsch-col-cal"></div><div class="gsch-col gsch-col-list"><div class="gsch-col-list-inner"></div></div></div>';
      renderCal(body.querySelector('.gsch-col-cal'));
      renderListInner(body.querySelector('.gsch-col-list-inner'));
    }

    load();
    return { reload:load };
  }

  window.GriSchedule = { mount: mount };
})();
