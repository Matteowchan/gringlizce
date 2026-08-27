/* Gri Meet — Ders Planlama / Takvim (paylaşılan modül)
   Kullanım:
     GriSchedule.mount({ sb, container, role:'teacher', classId, userId, roomForClass:fn })
     GriSchedule.mount({ sb, container, role:'student' })   // RLS öğrenciyi kendi sınıflarına kısıtlar
*/
(function(){
  if (window.GriSchedule) return;

  var FEED_BASE='https://vazbvbqgvtlaqkytfsbi.supabase.co/functions/v1/calendar-feed';
  // Sınıf rengi paleti — nav.js tema accent renkleri
  var PALETTE=['#3B7A75','#8A4A63','#3E6B4A','#2E5E8A','#B0567A','#8E3B4C','#6E5AA0','#0B8C86','#8A5A44','#B02A37','#BC5A2E','#6F7D1C','#5B8C4E','#E24E9C','#2E52C8','#E0705A','#C07A34','#1FA98C','#C64BB0','#2E86C6','#77803A','#D06A82','#4B3B8F','#7B3FA0','#D9824A','#26426B','#B05C36','#5C6673','#C7A24A','#6FB6AF']; /* 30 tema rengi */
  function clsHash(s){ s=String(s||''); var h=0; for(var i=0;i<s.length;i++){ h=((h<<5)-h+s.charCodeAt(i))|0; } return Math.abs(h); }
  function autoColor(classId){ return PALETTE[clsHash(classId)%PALETTE.length]; }

  // ── Türkiye resmî tatilleri ──
  // Ulusal (sabit) tatiller ay-gün olarak: HER yıl otomatik üretilir.
  var NAT_HOL=[['01-01','Yılbaşı'],['04-23','23 Nisan'],['05-01','1 Mayıs'],['05-19','19 Mayıs'],['07-15','15 Temmuz'],['08-30','30 Ağustos Zafer Bayramı'],['10-29','29 Ekim Cumhuriyet Bayramı']];
  var NAT_HALF=[['10-28','29 Ekim arifesi']]; // yarım gün
  // Dinî bayramların 1. gün tarihleri (Diyanet). Ramazan 3 gün, Kurban 4 gün; arife = 1 gün öncesi (yarım gün).
  // Yeni yıl eklemek için buraya satır ekle.
  var RELIG_HOL={
    2026:{r:'2026-03-20',k:'2026-05-27'},
    2027:{r:'2027-03-09',k:'2027-05-16'},
    2028:{r:'2028-02-27',k:'2028-05-05'},
    2029:{r:'2029-02-15',k:'2029-04-24'},
    2030:{r:'2030-02-04',k:'2030-04-13'}
  };
  function _pad2(n){ return n<10?'0'+n:''+n; }
  function _ymd(d){ return d.getFullYear()+'-'+_pad2(d.getMonth()+1)+'-'+_pad2(d.getDate()); }
  function _shift(iso,n){ var p=iso.split('-'); var d=new Date(+p[0],+p[1]-1,+p[2]); d.setDate(d.getDate()+n); return d; }
  function _setHol(map,dObj,name,half){ var k=_ymd(dObj); var ex=map[k]; if(ex){ if(!ex.half) return; if(!half){ map[k]={name:name,half:false}; } return; } map[k]={name:name,half:half}; }
  var _holCache={};
  function holidayMap(year){
    if(_holCache[year]) return _holCache[year];
    var map={};
    NAT_HOL.forEach(function(x){ map[year+'-'+x[0]]={name:x[1],half:false}; });
    NAT_HALF.forEach(function(x){ var k=year+'-'+x[0]; if(!map[k]) map[k]={name:x[1],half:true}; });
    var R=RELIG_HOL[year];
    if(R){
      if(R.r){ _setHol(map,_shift(R.r,-1),'Ramazan Bayramı arifesi',true); for(var i=0;i<3;i++) _setHol(map,_shift(R.r,i),'Ramazan Bayramı',false); }
      if(R.k){ _setHol(map,_shift(R.k,-1),'Kurban Bayramı arifesi',true); for(var j=0;j<4;j++) _setHol(map,_shift(R.k,j),'Kurban Bayramı',false); }
    }
    _holCache[year]=map; return map;
  }

  var CSS = ''
    + '.gsch{font-family:inherit;color:#2a2a2a;}'
    + '.gsch-head{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:12px;}'
    + '.gsch-toggle{display:inline-flex;border:1px solid #d8d2c4;border-radius:9px;overflow:hidden;}'
    + '.gsch-toggle button{border:none;background:#f4efe6;color:#6a6250;padding:7px 14px;font:inherit;font-size:13px;cursor:pointer;}'
    + '.gsch-toggle button.on{background:var(--gri-accent,#2C5856);color:#fff;}'
    + '.gsch-new{margin-left:auto;background:var(--gri-accent,#2C5856);color:#fff;border:none;border-radius:9px;padding:9px 16px;font:inherit;font-weight:600;font-size:13px;cursor:pointer;}'
    + '.gsch-sub{background:transparent;color:var(--gri-accent,#2C5856);border:1px solid var(--gri-accent-soft,#bcd8d3);border-radius:9px;padding:8px 14px;font:inherit;font-weight:600;font-size:13px;cursor:pointer;}'
    + '.gsch-sub:hover{background:#e7f0ee;}'
    + '.gsch-sub:disabled{opacity:.5;cursor:default;}'
    + '.gsch-ext-tag{font-size:11px;font-weight:700;color:#8a8172;background:#f1ece1;border:1px dashed #c9bfa8;border-radius:20px;padding:4px 10px;}'
    + '.gsch-cell .ev.ev-ext b{font-weight:600;}'
    + '.gsch-imp{margin-top:16px;border-top:1px solid #e5ddcd;padding-top:14px;}'
    + '.gsch-imp h5{margin:0 0 4px;font-size:14px;font-weight:700;color:#2a2a2a;}'
    + '.gsch-imp p{margin:0 0 10px;font-size:12px;color:#6a6250;line-height:1.5;}'
    + '.gsch-imp .imp-row{display:flex;gap:6px;margin-bottom:8px;flex-wrap:wrap;}'
    + '.gsch-imp input{flex:1;min-width:120px;font:inherit;padding:8px 10px;border:1px solid #d8d2c4;border-radius:8px;background:#fff;color:#2a2a2a;}'
    + '.gsch-imp .imp-list{display:flex;flex-direction:column;gap:6px;margin-top:6px;}'
    + '.gsch-imp .imp-item{display:flex;align-items:center;gap:8px;font-size:12.5px;color:#2a2a2a;background:#faf7f0;border:1px solid #ece4d4;border-radius:8px;padding:7px 9px;}'
    + '.gsch-imp .imp-item .nm{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}'
    + '.gsch-imp .imp-item .rm{background:none;border:none;color:#b3402f;cursor:pointer;font-size:12px;font-weight:700;}'
    + '.gsch-imp .imp-sws{margin:2px 0 10px 2px;}'
    + '.gsch-imp .imp-sws .gsch-sw{width:20px;height:20px;}'
    + ':root[data-theme="dark"] .gsch-ext-tag{color:#b5ac98;background:#2a2419;border-color:#3a3428;}'
    + ':root[data-theme="dark"] .gsch-imp{border-color:#3a3428;}'
    + ':root[data-theme="dark"] .gsch-imp h5{color:#f0e9db;}'
    + ':root[data-theme="dark"] .gsch-imp p{color:#b5ac98;}'
    + ':root[data-theme="dark"] .gsch-imp input{background:#2a2419;border-color:#3a3428;color:#f0e9db;}'
    + ':root[data-theme="dark"] .gsch-imp .imp-item{background:#1f1b14;border-color:#3a3428;color:#f0e9db;}'
    + '.gsch-form-ov{position:fixed;inset:0;background:rgba(20,16,12,.5);display:none;align-items:center;justify-content:center;z-index:99998;padding:16px;}'
    + '.gsch-form-ov.open{display:flex;}'
    + '.gsch-form{background:#faf7f0;border:1px solid #e5ddcd;border-radius:16px;padding:18px 20px;margin:0;max-width:540px;width:100%;max-height:90vh;overflow-y:auto;box-shadow:0 18px 50px rgba(20,16,12,.3);}'
    + '.gsch-form-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:14px;}'
    + '.gsch-form-title{font-size:16px;font-weight:800;color:#2a2a2a;margin:0;}'
    + '.gsch-form-x{background:none;border:none;font-size:24px;line-height:1;color:#8a8172;cursor:pointer;padding:0 2px;}'
    + '.gsch-form-x:hover{color:#2a2a2a;}'
    + '.gsch-form .row{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:12px;}'
    + '.gsch-form label{font-size:12px;color:#6a6250;display:flex;flex-direction:column;gap:5px;flex:1;min-width:140px;}'
    + '.gsch-form input,.gsch-form select{font:inherit;padding:9px 10px;border:1px solid #d8d2c4;border-radius:8px;background:#fff;color:#2a2a2a;}'
    + '.gsch-form .f-when-ctl{display:flex;gap:6px;align-items:center;}'
    + '.gsch-form .f-when-ctl .f-datebtn{flex:1;min-width:130px;}'
    + '.gsch-form .f-when-ctl select{padding:9px 6px;}'
    + '.gsch-form .f-colon{color:#6a6250;font-weight:700;}'
    + '.f-datebtn{display:inline-flex;align-items:center;gap:7px;font:inherit;text-align:left;padding:9px 11px;border:1px solid #d8d2c4;border-radius:8px;background:#fff;color:#2a2a2a;cursor:pointer;}'
    + '.f-datebtn:hover{border-color:var(--gri-accent,#2C5856);}'
    + '.f-datebtn::before{content:"\\1F4C5";font-size:13px;filter:grayscale(1);opacity:.7;}'
    + '.f-datebtn.empty{color:#a89a78;}'
    + '.gsch-minical{background:#fff;border:1px solid #e5ddcd;border-radius:14px;padding:12px;box-shadow:0 18px 50px rgba(20,16,12,.32);width:288px;max-width:92vw;}'
    + '.gsch-minical .mc-h{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;}'
    + '.gsch-minical .mc-h b{font-size:14px;font-weight:800;color:#2a2a2a;}'
    + '.gsch-minical .mc-h button{border:1px solid #e4dccb;background:#fff;border-radius:50%;width:28px;height:28px;font-size:15px;line-height:1;color:#6a6250;cursor:pointer;}'
    + '.gsch-minical .mc-h button:hover{background:var(--gri-accent,#2C5856);color:#fff;border-color:var(--gri-accent,#2C5856);}'
    + '.gsch-minical .mc-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:2px;}'
    + '.gsch-minical .mc-wd{text-align:center;font-size:10px;font-weight:800;color:#9a8f79;padding:2px 0 4px;text-transform:uppercase;}'
    + '.gsch-minical .mc-cell{height:34px;}'
    + '.gsch-minical .mc-day{width:100%;height:100%;border:none;background:transparent;border-radius:9px;font:inherit;font-size:12.5px;font-weight:600;color:#2a2a2a;cursor:pointer;transition:background .1s;}'
    + '.gsch-minical .mc-day:hover{background:#eef2f5;}'
    + '.gsch-minical .mc-day.today{color:#B0791E;font-weight:800;}'
    + '.gsch-minical .mc-day.sel{background:var(--gri-accent,#2C5856);color:#fff;font-weight:800;}'
    + '.gsch-minical .mc-day.we{color:#6a7a86;}'
    + '.gsch-minical .mc-day.sel.we{color:#fff;}'
    + '.gsch-form .acts{display:flex;gap:8px;margin-top:4px;}'
    + '.gsch-btn{background:var(--gri-accent,#2C5856);color:#fff;border:none;border-radius:8px;padding:9px 16px;font:inherit;font-weight:600;font-size:13px;cursor:pointer;}'
    + '.gsch-btn.ghost{background:transparent;color:#6a6250;border:1px solid #d8d2c4;}'
    + '.gsch-btn.danger{background:transparent;color:#b3402f;border:1px solid #e3b6ae;}'
    + '.gsch-btn:disabled{opacity:.5;cursor:default;}'
    + '.gsch-list{display:flex;flex-direction:column;gap:7px;}'
    + '.gsch-daygroup{font:800 10.5px/1.2 var(--font-ui,inherit);letter-spacing:.07em;text-transform:uppercase;color:#8a8172;padding:5px 3px 4px;border-bottom:1px solid #ece4d4;}'
    + '.gsch-daygroup:not(:first-child){margin-top:5px;}'
    + '.gsch-item{display:block;background:#fff;border:1px solid #e5ddcd;border-radius:12px;padding:9px 11px;box-shadow:0 1px 3px rgba(30,25,20,.05);}'
    + '.gsch-item.soon{border-color:#2C5856;box-shadow:0 0 0 2px rgba(44,88,86,.12);}'
    + '.gsch-item-head{display:flex;align-items:center;gap:7px;margin-bottom:4px;}'
    + '.gsch-daypill{flex:0 0 auto;font:700 10.5px/1 inherit;color:#2C5856;background:#e7f0ee;border-radius:20px;padding:3px 7px;}'
    + '.gsch-item.soon .gsch-daypill{background:#2C5856;color:#fff;}'
    + '.gsch-item-title{font-weight:700;font-size:13.5px;color:#2a2a2a;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0;}'
    + '.gsch-item-sub{font-size:12px;color:#8a8172;line-height:1.4;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}'
    + '.gsch-item-note{font-size:12px;color:#a89a78;margin-top:3px;font-style:italic;}'
    + '.gsch-item-actions{margin-top:6px;display:flex;gap:6px;}'
    + '.gsch-item-actions .gsch-btn{flex:1;text-align:center;padding:5px 9px;font-size:12px;}'
    + '.gsch-empty{text-align:center;color:#8a8172;font-size:14px;padding:26px;background:#faf7f0;border-radius:12px;}'
    + '.gsch-cal{background:#fff;border:1px solid #e5ddcd;border-radius:16px;padding:16px 16px 14px;box-shadow:0 2px 12px rgba(30,25,20,.05);display:flex;flex-direction:column;min-height:0;height:100%;}'
    + '.gsch-cal-h{display:flex;align-items:center;gap:10px;margin-bottom:14px;}'
    + '.gsch-cal-h b{font-size:18px;font-weight:800;color:#2a2a2a;letter-spacing:-.01em;}'
    + '.gsch-cal-h .cal-nav{margin-left:auto;display:inline-flex;gap:6px;}'
    + '.gsch-cal-h button{border:1px solid #e4dccb;background:#fff;border-radius:50%;width:34px;height:34px;font-size:17px;line-height:1;color:#6a6250;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;transition:background .12s,border-color .12s,color .12s;}'
    + '.gsch-cal-h button:hover{background:var(--gri-accent,#2C5856);color:#fff;border-color:var(--gri-accent,#2C5856);}'
    /* ── Outlook-benzeri bağlı grid: 1px boşluk = paylaşılan çizgi; başlık satırı ayrı, gövde yüksekliği doldurur ── */
    + '.gsch-gridwrap{flex:1 1 auto;min-height:0;display:grid;grid-template-rows:auto 1fr;gap:1px;background:#e9e2d2;border:1px solid #e9e2d2;border-radius:12px;overflow:hidden;}'
    + '.gsch-wdrow{display:grid;grid-template-columns:repeat(7,1fr);gap:1px;background:#e9e2d2;}'
    + '.gsch-grid{display:grid;grid-template-columns:repeat(7,1fr);grid-auto-rows:1fr;gap:1px;background:#e9e2d2;min-height:0;}'
    + '.gsch-cal .wd{text-align:center;font-size:10.5px;color:#9a8f79;padding:8px 0;font-weight:800;letter-spacing:.06em;text-transform:uppercase;background:#f7f2e8;}'
    + '.gsch-cell{min-height:66px;padding:5px 5px 5px;font-size:12px;position:relative;cursor:default;background:#fffdf9;overflow:hidden;transition:background .12s;display:flex;flex-direction:column;}'
    + '.gsch-cell .gsch-evs{flex:1 1 auto;min-height:0;overflow:hidden;}'
    + '.gsch-cell.out{background:#f7f2e8;}'
    + '.gsch-cell.has{cursor:pointer;}'
    + '.gsch-cell.has:hover{background:#f1f8f6;}'
    + '.gsch-cell.today{background:#fbf7ee;}'
    + '.gsch-cell.sel{background:#eaf3f1;box-shadow:inset 0 0 0 2px #2C5856;}'
    + '.gsch-cell.sel .num{color:#1f4644;font-weight:800;}'
    + '.gsch-cell .num{flex:0 0 auto;align-self:flex-start;display:inline-flex;align-items:center;justify-content:center;min-width:22px;height:22px;padding:0 2px;border-radius:999px;font-weight:700;font-size:12.5px;color:#6a6250;margin-bottom:2px;line-height:1;}'
    + '.gsch-cell.today .num{background:#2C5856;color:#fff;font-weight:800;}'
    + '.gsch-cell .ev{display:block;font-size:10.5px;line-height:1.22;background:#e7f0ee;color:#2C5856;border-radius:4px;padding:1px 6px;margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-weight:600;}'
    + '.gsch-cell .gsch-evs .ev:first-child{margin-top:0;}'
    + '.gsch-cell .ev b{font-weight:800;margin-right:3px;}'
    + '.gsch-cell .ev:hover{filter:brightness(.96);}'
    + '.gsch-cell .ev.ev-more{background:transparent;color:#2C5856;padding:0 6px;font-size:10px;font-weight:800;margin-top:1px;cursor:pointer;}'
    + '.gsch-cell .ev.ev-more:hover{filter:none;text-decoration:underline;}'
    + ':root[data-theme="dark"] .gsch-cell .ev.ev-more{color:#7fb8b0;}'
    + '.gsch-cell .ev[draggable="true"]{cursor:grab;}'
    + '.gsch-cell .ev.dragging{opacity:.4;}'
    + '.gsch-cell.drop-ok{background:#eaf3f1;box-shadow:inset 0 0 0 2px rgba(44,88,86,.35);}'
    /* ── Hafta içi / hafta sonu / resmî tatil tonları (belirgin) ── */
    + '.gsch-cal .wd.we{background:#e6ebee;color:#78838d;}'
    + '.gsch-cell.we{background:#eef2f5;}'
    + '.gsch-cell.out.we{background:#e8edf1;}'
    + '.gsch-cell.we.has:hover{background:#e4eef0;}'
    + '.gsch-cell.holi{background:#fbe0db;}'
    + '.gsch-cell.holi.we{background:#f6dbd8;}'
    + '.gsch-cell .hol{flex:0 0 auto;display:block;font-size:10.5px;line-height:1.35;background:#efc7c0;color:#8c2b24;border-left:3px solid #B23A48;border-radius:4px;padding:2px 7px 3px;margin-bottom:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-weight:700;}'
    + '.gsch-cell .hol.half{background:#f2dccb;color:#894c22;border-left-color:#C67A34;font-weight:600;}'
    + '.gsch-form.editing{border-color:#2C5856;box-shadow:0 0 0 2px rgba(44,88,86,.15);}'
    + '.gsch-modal-ov{position:fixed;inset:0;background:rgba(20,16,12,.55);display:flex;align-items:center;justify-content:center;z-index:99999;padding:16px;}'
    + '.gsch-modal{background:#fff;border-radius:16px;padding:20px 22px;max-width:480px;width:100%;box-shadow:0 18px 50px rgba(20,16,12,.3);font-family:inherit;}'
    + '.gsch-modal h4{margin:0 0 6px;font-size:16px;font-weight:700;color:#2a2a2a;}'
    + '.gsch-modal p{margin:0 0 14px;font-size:13px;color:#6a6250;line-height:1.5;}'
    + '.gsch-modal .mrow{display:flex;align-items:center;gap:8px;margin-bottom:16px;}'
    + '.gsch-modal .mrow label{font-size:12px;color:#6a6250;font-weight:600;}'
    + '.gsch-modal select{font:inherit;padding:8px 10px;border:1px solid #d8d2c4;border-radius:8px;background:#fff;color:#2a2a2a;}'
    + '.gsch-modal .macts{display:flex;gap:8px;justify-content:flex-end;}'
    /* ── Gün planı popup ── */
    + '.gsch-clk{cursor:pointer;}'
    + '.gsch-daymodal{max-width:460px;}'
    + '.gsch-daymodal>h4{margin-bottom:10px;}'
    + '.gsch-daymodal-hol{font-size:12px;font-weight:700;color:#8c2b24;background:#f4d9d4;border-left:3px solid #B23A48;border-radius:4px;padding:6px 11px;margin:0 0 12px;}'
    + '.gsch-daymodal-hol.half{color:#894c22;background:#f2dccb;border-left-color:#C67A34;}'
    + '.gsch-daymodal-list{display:flex;flex-direction:column;gap:8px;max-height:56vh;overflow-y:auto;overflow-x:hidden;padding-right:4px;}'
    + '.gsch-daymodal-list::-webkit-scrollbar{width:7px;}'
    + '.gsch-daymodal-list::-webkit-scrollbar-thumb{background:#d8d2c4;border-radius:6px;}'
    + '.gsch-daymodal-list::-webkit-scrollbar-track{background:transparent;}'
    /* Gün popup — ajanda satırı (saat solda, ders sağda) */
    + '.gsch-dayrow{display:flex;gap:12px;align-items:flex-start;background:#fff;border:1px solid #ece4d4;border-radius:12px;padding:10px 12px 11px;box-shadow:0 1px 3px rgba(30,25,20,.05);}'
    + '.gsch-dayrow-time{flex:0 0 auto;text-align:right;min-width:46px;padding-top:1px;}'
    + '.gsch-dayrow-time b{display:block;font-size:15px;font-weight:800;color:#2a2a2a;line-height:1.1;}'
    + '.gsch-dayrow-time span{display:block;font-size:11px;color:#a89a78;margin-top:2px;}'
    + '.gsch-dayrow-main{flex:1 1 auto;min-width:0;}'
    + '.gsch-dayrow-title{font-weight:700;font-size:14px;color:#2a2a2a;display:flex;align-items:center;gap:8px;flex-wrap:wrap;line-height:1.3;}'
    + '.gsch-dayrow-cls{font-size:11px;font-weight:700;padding:1px 9px;border-radius:100px;white-space:nowrap;}'
    + '.gsch-dayrow-meta{font-size:12px;color:#8a8172;margin-top:3px;}'
    + '.gsch-dayrow .gsch-item-actions{margin-top:9px;}'
    + '.gsch-dayrow.ext{opacity:.92;}'
    + ':root[data-theme="dark"] .gsch-dayrow{background:#241f18;border-color:#3a3428;}'
    + ':root[data-theme="dark"] .gsch-dayrow-time b{color:#f0e9db;}'
    + ':root[data-theme="dark"] .gsch-dayrow-time span{color:#9a917d;}'
    + ':root[data-theme="dark"] .gsch-dayrow-title{color:#f0e9db;}'
    + ':root[data-theme="dark"] .gsch-dayrow-meta{color:#b5ac98;}'
    + ':root[data-theme="dark"] .gsch-daymodal-hol{color:#efab9f;background:#3a211d;border-left-color:#c2564d;}'
    + ':root[data-theme="dark"] .gsch-daymodal-hol.half{color:#e6b98c;background:#3a2a1a;border-left-color:#b5804a;}'
    + ':root[data-theme="dark"] .gsch-daymodal-list::-webkit-scrollbar-thumb{background:#3a3428;}'
    + '.gsch-clrlist{display:flex;flex-direction:column;gap:12px;max-height:52vh;overflow-y:auto;}'
    + '.gsch-clrrow{display:flex;flex-direction:column;gap:6px;}'
    + '.gsch-clrname{font-size:13px;font-weight:700;color:#2a2a2a;}'
    + '.gsch-sws{display:flex;flex-wrap:wrap;gap:6px;}'
    + '.gsch-sw{width:24px;height:24px;border-radius:50%;border:2px solid transparent;cursor:pointer;padding:0;box-shadow:0 0 0 1px rgba(0,0,0,.12);}'
    + '.gsch-sw.on{border-color:#2a2a2a;box-shadow:0 0 0 2px #fff,0 0 0 4px currentColor;}'
    + ':root[data-theme="dark"] .gsch-clrname{color:#f0e9db;}'
    + ':root[data-theme="dark"] .gsch-sw.on{border-color:#f0e9db;box-shadow:0 0 0 2px #241f18,0 0 0 4px currentColor;}'
    + '.gsch-form .edit-tag{display:none;font-size:12px;color:#2C5856;font-weight:700;margin-bottom:8px;}'
    + '.gsch-form.editing .edit-tag{display:block;}'
    + '.gsch-cell.sel .ev.ev-more{background:transparent;color:#2C5856;}'
    + '.gsch-daylist{margin-top:12px;}'
    + '.gsch-split{display:flex;gap:0;align-items:stretch;flex:1 1 auto;min-height:0;}'
    + '.gsch-col{min-width:0;}'
    + '.gsch-col-cal{flex:1 1 auto;min-width:420px;display:flex;flex-direction:column;min-height:0;}'
    + '.gsch-resizer{flex:0 0 16px;align-self:stretch;cursor:col-resize;position:relative;touch-action:none;user-select:none;}'
    + '.gsch-resizer::before{content:"";position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:4px;height:46px;border-radius:4px;background:#d8d2c4;transition:background .12s,height .12s;}'
    + '.gsch-resizer:hover::before,.gsch-resizer.drag::before{background:var(--gri-accent,#2C5856);height:64px;}'
    + '.gsch-col-list{flex:0 0 var(--gsch-list-w,400px);position:relative;}'
    + '.gsch-col-list-inner{position:absolute;inset:0;overflow-y:auto;overflow-x:hidden;padding-right:6px;}'
    + '.gsch-col-list-inner::-webkit-scrollbar{width:8px;}'
    + '.gsch-col-list-inner::-webkit-scrollbar-thumb{background:#d8d2c4;border-radius:6px;}'
    + '.gsch-col-list-inner::-webkit-scrollbar-track{background:transparent;}'
    + '.gsch-item{transition:box-shadow .15s,border-color .15s,transform .1s;}'
    + '.gsch-item:hover{transform:translateY(-1px);box-shadow:0 5px 16px rgba(30,25,20,.10);}'
    + '.gsch-item.hl{border-color:#2C5856;box-shadow:0 0 0 2px rgba(44,88,86,.20);}'
    /* ── Ders İstatistiği (açılır-kapanır yan panel) ── */
    + '.gsch-shell{display:flex;gap:16px;align-items:flex-start;}'
    + '.gsch-main{flex:1 1 auto;min-width:600px;min-height:440px;max-width:100%;max-height:1200px;height:900px;display:flex;flex-direction:column;resize:both;overflow:hidden;position:relative;}'
    + '.gsch-main::after{content:"";position:absolute;right:2px;bottom:2px;width:14px;height:14px;pointer-events:none;background:linear-gradient(135deg,transparent 0 45%,var(--gri-accent,#2C5856) 45% 55%,transparent 55% 70%,var(--gri-accent,#2C5856) 70% 80%,transparent 80%);opacity:.5;border-radius:0 0 4px 0;}'
    + '.gsch-stats{display:none;flex:0 0 300px;max-width:300px;background:#faf7f0;border:1px solid #e5ddcd;border-radius:14px;padding:12px 13px;}'
    + '.gsch-shell.stats-on .gsch-stats{display:block;}'
    + '.gsch-stats-h{font-size:13px;font-weight:800;color:#2a2a2a;margin-bottom:10px;letter-spacing:.01em;}'
    + '.gsch-stats-body{display:flex;flex-direction:column;gap:14px;max-height:520px;overflow-y:auto;overflow-x:hidden;}'
    + '.gsch-stats-empty{font-size:12.5px;color:#8a8172;text-align:center;padding:18px 8px;}'
    + '.gsch-stats-clsname{display:flex;align-items:center;gap:7px;font-size:13px;font-weight:700;color:#2a2a2a;margin-bottom:7px;}'
    + '.gsch-stats-dot{flex:0 0 auto;width:10px;height:10px;border-radius:50%;box-shadow:0 0 0 1px rgba(0,0,0,.08);}'
    + '.gsch-stats-wk{margin:0 0 8px 3px;padding-left:9px;border-left:2px solid #e5ddcd;}'
    + '.gsch-stats-wk-h{display:flex;align-items:baseline;justify-content:space-between;gap:8px;margin-bottom:3px;}'
    + '.gsch-stats-wk-range{font-size:12px;font-weight:700;color:#6a6250;}'
    + '.gsch-stats-wk-count{flex:0 0 auto;font-size:11px;font-weight:700;color:#2C5856;background:#e7f0ee;border-radius:20px;padding:2px 8px;}'
    + '.gsch-stats-wk-list{display:flex;flex-direction:column;gap:2px;}'
    + '.gsch-stats-ln{font-size:11.5px;color:#8a8172;line-height:1.5;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}'
    + '.gsch-stats-body::-webkit-scrollbar{width:8px;}'
    + '.gsch-stats-body::-webkit-scrollbar-thumb{background:#d8d2c4;border-radius:6px;}'
    + '.gsch-stats-body::-webkit-scrollbar-track{background:transparent;}'
    + '@media(max-width:900px){.gsch-shell{flex-direction:column;}.gsch-stats{flex-basis:auto;max-width:none;width:100%;}.gsch-stats-body{max-height:340px;}}'
    + '@media(max-width:760px){.gsch-main{resize:none;min-width:0;height:auto;max-height:none;}.gsch-split{flex-direction:column;}.gsch-resizer{display:none;}.gsch-col-cal{min-width:0;}.gsch-gridwrap{flex:none;}.gsch-grid{grid-auto-rows:auto;}.gsch-cell{min-height:92px;}.gsch-col-list{position:static;flex-basis:auto;}.gsch-col-list-inner{position:static;max-height:320px;}}'
    + '@media(max-width:480px){'
    + '.gsch-cal{padding:8px;}'
    + '.gsch-grid{gap:2px;}'
    + '.gsch-cell{min-height:98px;padding:3px 4px 4px;font-size:11px;}'
    + '.gsch-cell .num{font-size:12px;min-width:20px;height:20px;margin-bottom:2px;}'
    + '.gsch-cell .ev{font-size:10px;line-height:1.3;padding:1px 5px 2px;margin-top:2px;}'
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
    + ':root[data-theme="dark"] .gsch-form-title{color:#f0e9db;}'
    + ':root[data-theme="dark"] .gsch-form-x{color:#9a917d;}'
    + ':root[data-theme="dark"] .gsch-form-x:hover{color:#f0e9db;}'
    + ':root[data-theme="dark"] .f-datebtn{background:#2a2419;border-color:#3a3428;color:#f0e9db;}'
    + ':root[data-theme="dark"] .f-datebtn.empty{color:#9a917d;}'
    + ':root[data-theme="dark"] .gsch-minical{background:#241f18;border-color:#3a3428;}'
    + ':root[data-theme="dark"] .gsch-minical .mc-h b{color:#f0e9db;}'
    + ':root[data-theme="dark"] .gsch-minical .mc-h button{background:#2a2419;border-color:#3a3428;color:#b5ac98;}'
    + ':root[data-theme="dark"] .gsch-minical .mc-h button:hover{background:#2C5856;color:#fff;border-color:#2C5856;}'
    + ':root[data-theme="dark"] .gsch-minical .mc-day{color:#e6ddcb;}'
    + ':root[data-theme="dark"] .gsch-minical .mc-day:hover{background:#20302d;}'
    + ':root[data-theme="dark"] .gsch-minical .mc-day.today{color:#E0B85A;}'
    + ':root[data-theme="dark"] .gsch-minical .mc-day.sel{background:#3f7a72;color:#fff;}'
    + ':root[data-theme="dark"] .gsch-minical .mc-day.we{color:#93a3ad;}'
    + ':root[data-theme="dark"] .gsch-btn.ghost{color:#b5ac98;border-color:#3a3428;}'
    + ':root[data-theme="dark"] .gsch-btn.danger{color:#e6796a;border-color:#5a3630;}'
    + ':root[data-theme="dark"] .gsch-item{background:#241f18;border-color:#3a3428;}'
    + ':root[data-theme="dark"] .gsch-daygroup{color:#9a917d;border-bottom-color:#332e23;}'
    + ':root[data-theme="dark"] .gsch-daypill{background:#22403e;color:#bfe0da;}'
    + ':root[data-theme="dark"] .gsch-item-title{color:#f0e9db;}'
    + ':root[data-theme="dark"] .gsch-item-sub{color:#b5ac98;}'
    + ':root[data-theme="dark"] .gsch-item-note{color:#9a917d;}'
    + ':root[data-theme="dark"] .gsch-empty{background:#1f1b14;color:#b5ac98;}'
    + ':root[data-theme="dark"] .gsch-cal{background:#241f18;border-color:#3a3428;box-shadow:0 2px 10px rgba(0,0,0,.25);}'
    + ':root[data-theme="dark"] .gsch-cal-h b{color:#f0e9db;}'
    + ':root[data-theme="dark"] .gsch-cal-h button{background:#2a2419;border-color:#3a3428;color:#b5ac98;}'
    + ':root[data-theme="dark"] .gsch-cal-h button:hover{background:#2C5856;color:#fff;border-color:#2C5856;}'
    + ':root[data-theme="dark"] .gsch-grid{background:#332e23;border-color:#332e23;}'
    + ':root[data-theme="dark"] .gsch-cal .wd{color:#9a917d;background:#221d16;}'
    + ':root[data-theme="dark"] .gsch-cell{background:#1c1813;}'
    + ':root[data-theme="dark"] .gsch-cell.out{background:#181410;}'
    + ':root[data-theme="dark"] .gsch-cell.has:hover{background:#20302d;}'
    + ':root[data-theme="dark"] .gsch-cell.today{background:#231f16;}'
    + ':root[data-theme="dark"] .gsch-cell:not(.sel) .num{color:#b5ac98;}'
    + ':root[data-theme="dark"] .gsch-cell.today .num{background:#3f7a72;color:#fff;}'
    + ':root[data-theme="dark"] .gsch-cell:not(.sel) .ev{background:#22403e;color:#bfe0da;}'
    + ':root[data-theme="dark"] .gsch-cell:not(.sel) .ev.ev-more{background:transparent;color:#9a917d;}'
    + ':root[data-theme="dark"] .gsch-cell.sel{background:#1e2e2b;box-shadow:inset 0 0 0 2px #3f7a72;}'
    + ':root[data-theme="dark"] .gsch-cell.sel .num{color:#cbe8e2;}'
    + ':root[data-theme="dark"] .gsch-cell.sel .ev.ev-more{color:#bfe0da;}'
    + ':root[data-theme="dark"] .gsch-cal .wd.we{background:#191f25;color:#8794a0;}'
    + ':root[data-theme="dark"] .gsch-cell.we{background:#141a20;}'
    + ':root[data-theme="dark"] .gsch-cell.out.we{background:#10151b;}'
    + ':root[data-theme="dark"] .gsch-cell.we.has:hover{background:#1c2b30;}'
    + ':root[data-theme="dark"] .gsch-cell.holi{background:#331714;}'
    + ':root[data-theme="dark"] .gsch-cell.holi.we{background:#2d1512;}'
    + ':root[data-theme="dark"] .gsch-cell .hol{background:#4a251f;color:#efab9f;border-left-color:#c2564d;}'
    + ':root[data-theme="dark"] .gsch-cell .hol.half{background:#3a2a1a;color:#e6b98c;border-left-color:#b5804a;}'
    + ':root[data-theme="dark"] .gsch-col-list-inner::-webkit-scrollbar-thumb{background:#3a3428;}'
    + ':root[data-theme="dark"] .gsch-cell .gsch-evs::-webkit-scrollbar-thumb{background:#3a3428;}'
    + ':root[data-theme="dark"] .gsch-resizer::before{background:#3a3428;}'
    + ':root[data-theme="dark"] .gsch-resizer:hover::before,:root[data-theme="dark"] .gsch-resizer.drag::before{background:#3f7a72;}'
    + ':root[data-theme="dark"] .gsch-modal{background:#241f18;}'
    + ':root[data-theme="dark"] .gsch-modal h4{color:#f0e9db;}'
    + ':root[data-theme="dark"] .gsch-modal p{color:#b5ac98;}'
    + ':root[data-theme="dark"] .gsch-modal .mrow label{color:#b5ac98;}'
    + ':root[data-theme="dark"] .gsch-modal select{background:#2a2419;border-color:#3a3428;color:#f0e9db;}'
    + ':root[data-theme="dark"] .gsch-modal .m-url{background:#2a2419;border-color:#3a3428;color:#f0e9db;}'
    + ':root[data-theme="dark"] .gsch-sub{color:#bfe0da;border-color:#2f4e4b;}'
    + ':root[data-theme="dark"] .gsch-sub:hover{background:#22403e;}'
    + ':root[data-theme="dark"] .gsch-stats{background:#1f1b14;border-color:#3a3428;}'
    + ':root[data-theme="dark"] .gsch-stats-h{color:#f0e9db;}'
    + ':root[data-theme="dark"] .gsch-stats-clsname{color:#f0e9db;}'
    + ':root[data-theme="dark"] .gsch-stats-dot{box-shadow:0 0 0 1px rgba(255,255,255,.12);}'
    + ':root[data-theme="dark"] .gsch-stats-wk{border-color:#3a3428;}'
    + ':root[data-theme="dark"] .gsch-stats-wk-range{color:#b5ac98;}'
    + ':root[data-theme="dark"] .gsch-stats-wk-count{background:#22403e;color:#bfe0da;}'
    + ':root[data-theme="dark"] .gsch-stats-ln{color:#9a917d;}'
    + ':root[data-theme="dark"] .gsch-stats-empty{color:#b5ac98;}'
    + ':root[data-theme="dark"] .gsch-stats-body::-webkit-scrollbar-thumb{background:#3a3428;}'
    + '';

  function injectCSS(){ if(document.getElementById('gsch-css'))return; var s=document.createElement('style'); s.id='gsch-css'; s.textContent=CSS; document.head.appendChild(s); }
  function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
  var MONTHS=['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'];
  var MONTHS_L=['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
  var WD=['Pzt','Sal','Çar','Per','Cum','Cmt','Paz'];
  var MWD=['Pt','Sa','Ça','Pe','Cu','Ct','Pa'];
  function two(n){return n<10?'0'+n:''+n;}
  function parseIso(s){ var p=String(s||'').split('-'); if(p.length<3) return null; var d=new Date(+p[0],(+p[1])-1,+p[2]); return isNaN(d.getTime())?null:d; }
  function fmtDateLong(iso){ var d=parseIso(iso); if(!d) return ''; return d.getDate()+' '+MONTHS_L[d.getMonth()]+' '+d.getFullYear(); }
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
    var statsOpen=false; try{ statsOpen=localStorage.getItem('gsch-stats-open')==='1'; }catch(e){}
    var statsData=null; // Ders İstatistiği için gruplanmış geçmiş dersler (null=henüz yüklenmedi)
    var state={ view:_savedView, month:new Date(new Date().getFullYear(),new Date().getMonth(),1), rows:[], sel:null, editing:null };

    var _hopt='<option value="">--</option>'; for(var _h=0;_h<24;_h++){ var _hh=('0'+_h).slice(-2); _hopt+='<option value="'+_hh+'">'+_hh+'</option>'; }
    var _mopt='<option value="">--</option>'; for(var _m=0;_m<60;_m+=5){ var _mm=('0'+_m).slice(-2); _mopt+='<option value="'+_mm+'">'+_mm+'</option>'; }

    cont.innerHTML =
      '<div class="gsch">'
      + '<div class="gsch-head"><button class="gsch-sub" type="button">Takvime Abone Ol</button>'
        + ((role==='teacher' && classList.length) ? '<button class="gsch-sub gsch-colors" type="button">Takvim Renkleri</button>' : '')
        + '<button class="gsch-sub gsch-stats-btn" type="button">Ders İstatistiği '+(statsOpen?'▾':'▸')+'</button>'
        + (role==='teacher' ? '<button class="gsch-new">+ Yeni Ders Planla</button>' : '')
      + '</div>'
      + ((role==='teacher'||manageOwn) ?
          '<div class="gsch-form-ov"><div class="gsch-form">'
          + '<div class="gsch-form-head"><h4 class="gsch-form-title">Yeni Ders Planla</h4><button type="button" class="gsch-form-x f-cancel" aria-label="Kapat">&times;</button></div>'
          + '<div class="edit-tag">Dersi düzenliyorsun — saat, tarih, süre veya notu değiştir.</div>'
          + (aggregate ? '<div class="row"><label>Sınıf<select class="f-class">'+classList.map(function(c){return '<option value="'+esc(c.id)+'">'+esc(c.name||c.id)+'</option>';}).join('')+'</select></label></div>' : '')
          + '<div class="row"><label>Başlık<input type="text" class="f-title" placeholder="Örn. Speaking pratiği" maxlength="80"></label></div>'
          + '<div class="row"><label>Tarih & saat<span class="f-when-ctl"><input type="hidden" class="f-date"><button type="button" class="f-datebtn empty">Tarih seç</button><select class="f-h">'+_hopt+'</select><span class="f-colon">:</span><select class="f-m">'+_mopt+'</select></span></label>'
          + '<label>Süre<select class="f-dur"><option value="30">30 dk</option><option value="45">45 dk</option><option value="60" selected>60 dk</option><option value="90">90 dk</option><option value="120">120 dk</option></select></label></div>'
          + '<div class="row"><label style="flex:2">Not (opsiyonel)<input type="text" class="f-note" placeholder="Öğrencilere kısa not" maxlength="140"></label></div>'
          + '<div class="acts"><button class="gsch-btn f-save">Planla</button><button class="gsch-btn ghost f-cancel">Vazgeç</button></div>'
          + '</div></div>'
        : '')
      + '<div class="gsch-body"></div>'
      + '</div>';

    var body=cont.querySelector('.gsch-body');
    cont.querySelectorAll('.gsch-toggle button').forEach(function(b){ b.addEventListener('click',function(){ state.view=b.dataset.v; try{localStorage.setItem('gsch-view',state.view);}catch(e){} cont.querySelectorAll('.gsch-toggle button').forEach(function(x){x.classList.toggle('on',x===b);}); render(); }); });

    function setFDate(iso){
      var inp=cont.querySelector('.f-date'), btn=cont.querySelector('.f-datebtn'); if(!inp) return;
      inp.value=iso||'';
      if(btn){ if(iso){ btn.textContent=fmtDateLong(iso); btn.classList.remove('empty'); } else { btn.textContent='Tarih seç'; btn.classList.add('empty'); } }
    }
    function setFormTitle(t){ var el=cont.querySelector('.gsch-form-title'); if(el) el.textContent=t; }
    function formOpen(){ var ov=cont.querySelector('.gsch-form-ov'); if(ov) ov.classList.add('open'); }
    function resetForm(){
      var ov=cont.querySelector('.gsch-form-ov'), f=cont.querySelector('.gsch-form'); if(!f) return;
      if(ov) ov.classList.remove('open'); f.classList.remove('editing');
      state.editing=null;
      var sv=cont.querySelector('.f-save'); if(sv) sv.textContent='Planla';
      setFormTitle('Yeni Ders Planla');
      cont.querySelector('.f-title').value=''; cont.querySelector('.f-note').value=''; setFDate('');
      var fh=cont.querySelector('.f-h'), fm=cont.querySelector('.f-m'); if(fh) fh.value=''; if(fm) fm.value='';
    }

    var form=cont.querySelector('.gsch-form');
    if(form){
      var _formOvEl=cont.querySelector('.gsch-form-ov');
      var newBtn=cont.querySelector('.gsch-new');
      if(newBtn) newBtn.addEventListener('click',function(){
        if(_formOvEl && _formOvEl.classList.contains('open')){ resetForm(); }
        else { resetForm(); formOpen(); var ft=cont.querySelector('.f-title'); if(ft){ try{ ft.focus(); }catch(e){} } }
      });
      cont.querySelectorAll('.f-cancel').forEach(function(b){ b.addEventListener('click', resetForm); });
      cont.querySelector('.f-save').addEventListener('click', save);
      var _dbtn=cont.querySelector('.f-datebtn');
      if(_dbtn) _dbtn.addEventListener('click',function(){ openDatePicker(cont.querySelector('.f-date').value, function(iso){ setFDate(iso); }); });
      if(_formOvEl){ _formOvEl.addEventListener('click',function(e){ if(e.target===_formOvEl) resetForm(); }); }
      document.addEventListener('keydown',function(e){ if(e.key==='Escape'){ var ov=cont.querySelector('.gsch-form-ov'); if(ov&&ov.classList.contains('open')) resetForm(); } });
    }

    // Mini takvim tarih seçici popup
    function openDatePicker(curIso, onPick){
      var cur=parseIso(curIso)||new Date();
      var view=new Date(cur.getFullYear(),cur.getMonth(),1);
      var ov=document.createElement('div'); ov.className='gsch-modal-ov'; ov.style.zIndex='100001';
      ov.innerHTML='<div class="gsch-minical"></div>';
      var box=ov.querySelector('.gsch-minical');
      function close(){ if(ov.parentNode) ov.parentNode.removeChild(ov); }
      function draw(){
        var y=view.getFullYear(), mo=view.getMonth();
        var first=new Date(y,mo,1), startWd=(first.getDay()+6)%7, days=new Date(y,mo+1,0).getDate(), today=new Date();
        var cells='';
        for(var i=0;i<startWd;i++) cells+='<span class="mc-cell"></span>';
        for(var d=1;d<=days;d++){
          var dObj=new Date(y,mo,d), dw=(dObj.getDay()===0||dObj.getDay()===6);
          var sel=curIso&&sameDay(dObj,parseIso(curIso)), isT=sameDay(dObj,today);
          cells+='<span class="mc-cell"><button type="button" class="mc-day'+(sel?' sel':'')+(isT?' today':'')+(dw?' we':'')+'" data-d="'+d+'">'+d+'</button></span>';
        }
        box.innerHTML='<div class="mc-h"><button type="button" class="mc-prev" aria-label="Önceki ay">‹</button><b>'+MONTHS_L[mo]+' '+y+'</b><button type="button" class="mc-next" aria-label="Sonraki ay">›</button></div>'
          +'<div class="mc-grid">'+MWD.map(function(w){return '<span class="mc-wd">'+w+'</span>';}).join('')+cells+'</div>';
        box.querySelector('.mc-prev').onclick=function(){ view=new Date(y,mo-1,1); draw(); };
        box.querySelector('.mc-next').onclick=function(){ view=new Date(y,mo+1,1); draw(); };
        box.querySelectorAll('.mc-day').forEach(function(b){ b.onclick=function(){ var dd=parseInt(b.getAttribute('data-d'),10); curIso=y+'-'+two(mo+1)+'-'+two(dd); onPick(curIso); close(); }; });
      }
      ov.addEventListener('click',function(e){ if(e.target===ov) close(); });
      document.body.appendChild(ov); draw();
    }

    function canManage(row){ if(row._ext) return false; return role==='teacher' || (!!opts.userId && String(row.teacher_id)===String(opts.userId)); }
    function rowColor(row){ if(row._ext) return row._extColor || '#8a8172'; if(row.classes && row.classes.color) return row.classes.color; if(row.class_id) return autoColor(row.class_id); return '#2C5856'; }

    var _extTried=false;
    async function maybeSyncExternal(){
      if(_extTried || !opts.userId) return; _extTried=true;
      var flag=false; try{ flag=localStorage.getItem('gsch-ext-on-'+opts.userId)==='1'; }catch(_e){}
      if(!flag) return;
      var key='gsch-extsync-'+opts.userId, last=0; try{ last=+(localStorage.getItem(key)||0); }catch(_e){}
      if(Date.now()-last < 15*60000) return;
      try{ localStorage.setItem(key, String(Date.now())); }catch(_e){}
      try{ var res=await sb.functions.invoke('ext-calendar',{body:{action:'sync'}}); if(res && !res.error) load(); }catch(_e){}
    }

    var _subBtn=cont.querySelector('.gsch-sub:not(.gsch-colors):not(.gsch-stats-btn)'); if(_subBtn) _subBtn.addEventListener('click', openSubscribeModal);
    var _colBtn=cont.querySelector('.gsch-colors'); if(_colBtn) _colBtn.addEventListener('click', openColorsModal);
    var _statsBtn=cont.querySelector('.gsch-stats-btn');
    if(_statsBtn) _statsBtn.addEventListener('click', function(){
      statsOpen=!statsOpen;
      try{ localStorage.setItem('gsch-stats-open', statsOpen?'1':'0'); }catch(e){}
      _statsBtn.textContent='Ders İstatistiği '+(statsOpen?'▾':'▸');
      var shell=cont.querySelector('.gsch-shell'); if(shell) shell.classList.toggle('stats-on', statsOpen);
      if(statsOpen && statsData==null) loadStats();
    });

    async function openColorsModal(){
      var btn=cont.querySelector('.gsch-colors'); var oldt=btn?btn.textContent:'';
      if(btn){ btn.disabled=true; btn.textContent='Yükleniyor…'; }
      var colorMap={};
      try{
        var ids=classList.map(function(c){return c.id;});
        var r=await sb.from('classes').select('id,color').in('id',ids);
        if(r.error) throw r.error;
        (r.data||[]).forEach(function(c){ if(c.color) colorMap[c.id]=c.color; });
      }catch(e){ /* stored yoksa auto kullan */ }
      var extCals=[];
      if(opts.userId){ try{ var er=await sb.from('external_calendars').select('id,label,color').eq('user_id',opts.userId).order('created_at',{ascending:true}); extCals=er.data||[]; }catch(e){} }
      if(btn){ btn.disabled=false; btn.textContent=oldt; }
      var swatches=function(cid){ var cur=colorMap[cid]||autoColor(cid); return PALETTE.map(function(hx){ return '<button type="button" class="gsch-sw'+(hx.toLowerCase()===cur.toLowerCase()?' on':'')+'" data-cid="'+esc(cid)+'" data-hx="'+hx+'" style="background:'+hx+'" aria-label="'+hx+'"></button>'; }).join(''); };
      var extSwatches=function(cid,cur){ cur=cur||''; return PALETTE.map(function(hx){ return '<button type="button" class="gsch-sw'+(String(cur).toLowerCase()===hx.toLowerCase()?' on':'')+'" data-eid="'+esc(cid)+'" data-hx="'+hx+'" style="background:'+hx+'" aria-label="'+hx+'"></button>'; }).join(''); };
      var ov=document.createElement('div'); ov.className='gsch-modal-ov';
      ov.innerHTML='<div class="gsch-modal" style="max-width:420px"><h4>Takvim Renkleri</h4>'
        + '<p>Her sınıfa ve abone olduğun dış takvime takvimde kullanılacak rengi seç. Otomatik atanır, dilediğinde değiştirebilirsin.</p>'
        + '<div class="gsch-clrlist">'
        + classList.map(function(c){ return '<div class="gsch-clrrow"><span class="gsch-clrname">'+esc(c.name||c.id)+'</span><div class="gsch-sws" data-for="'+esc(c.id)+'">'+swatches(c.id)+'</div></div>'; }).join('')
        + '</div>'
        + (extCals.length ? ('<div style="font-weight:700;font-size:13px;margin:16px 0 6px;color:#2a2a2a">Abone takvimler</div><div class="gsch-clrlist">' + extCals.map(function(c){ return '<div class="gsch-clrrow"><span class="gsch-clrname">'+esc(c.label||'Dış takvim')+'</span><div class="gsch-sws" data-extfor="'+esc(c.id)+'">'+extSwatches(c.id,c.color)+'</div></div>'; }).join('') + '</div>') : '')
        + '<div class="macts" style="margin-top:14px;"><button type="button" class="gsch-btn m-close">Bitti</button></div>'
        + '</div>';
      document.body.appendChild(ov);
      function close(){ if(ov.parentNode) ov.parentNode.removeChild(ov); load(); }
      ov.addEventListener('click',function(e){ if(e.target===ov) close(); });
      ov.querySelector('.m-close').addEventListener('click',close);
      ov.querySelectorAll('.gsch-sw[data-cid]').forEach(function(sw){
        sw.addEventListener('click', async function(){
          var cid=sw.getAttribute('data-cid'), hx=sw.getAttribute('data-hx');
          var group=sw.parentNode; group.querySelectorAll('.gsch-sw').forEach(function(x){ x.classList.remove('on'); }); sw.classList.add('on');
          try{ var r=await sb.from('classes').update({color:hx}).eq('id',cid); if(r.error) throw r.error; }
          catch(e){ alert('Renk kaydedilemedi: '+(e.message||'hata')); }
        });
      });
      ov.querySelectorAll('.gsch-sw[data-eid]').forEach(function(sw){
        sw.addEventListener('click', async function(){
          var eid=sw.getAttribute('data-eid'), hx=sw.getAttribute('data-hx');
          var group=sw.parentNode; group.querySelectorAll('.gsch-sw').forEach(function(x){ x.classList.remove('on'); }); sw.classList.add('on');
          try{ var r=await sb.from('external_calendars').update({color:hx}).eq('id',eid); if(r.error) throw r.error; }
          catch(e){ alert('Renk kaydedilemedi: '+(e.message||'hata')); }
        });
      });
    }

    async function openSubscribeModal(){
      var btn=cont.querySelector('.gsch-sub'); var oldt=btn?btn.textContent:'';
      if(btn){ btn.disabled=true; btn.textContent='Bağlantı alınıyor…'; }
      var token='';
      try{ var r=await sb.rpc('get_or_create_calendar_token'); if(r.error) throw r.error; token=r.data; }
      catch(e){ alert('Abonelik bağlantısı alınamadı: '+(e.message||'hata')); if(btn){btn.disabled=false;btn.textContent=oldt;} return; }
      if(btn){ btn.disabled=false; btn.textContent=oldt; }
      if(!token){ alert('Abonelik bağlantısı alınamadı.'); return; }
      var httpsUrl=FEED_BASE+'?token='+encodeURIComponent(token);
      var webcalUrl=httpsUrl.replace(/^https:\/\//,'webcal://');
      var gcal='https://calendar.google.com/calendar/r?cid='+encodeURIComponent(webcalUrl);
      var outlook='https://outlook.live.com/calendar/0/addfromweb?url='+encodeURIComponent(httpsUrl)+'&name='+encodeURIComponent('Gringlizce Dersleri');
      var ov=document.createElement('div'); ov.className='gsch-modal-ov';
      ov.innerHTML='<div class="gsch-modal" style="max-width:460px"><h4>Takvime Abone Ol</h4>'
        + '<p>Derslerin Google, Outlook veya Apple takvimine otomatik gelir ve düzenli güncellenir. Bu bağlantı sana özeldir — paylaşma.</p>'
        + '<div class="mrow"><input type="text" class="m-url" readonly value="'+esc(httpsUrl)+'" style="flex:1;min-width:0;font:inherit;padding:8px 10px;border:1px solid #d8d2c4;border-radius:8px;background:#fff;color:#2a2a2a;"><button type="button" class="gsch-btn m-copy">Kopyala</button></div>'
        + '<div class="macts" style="flex-wrap:wrap;justify-content:flex-start;">'
          + '<a class="gsch-btn" href="'+esc(webcalUrl)+'">Apple / Takvim uygulaması</a>'
          + '<a class="gsch-btn ghost" href="'+esc(gcal)+'" target="_blank" rel="noopener">Google Takvim</a>'
          + '<a class="gsch-btn ghost" href="'+esc(outlook)+'" target="_blank" rel="noopener">Outlook</a>'
        + '</div>'
        + '<p style="margin-top:12px;font-size:12px;">Düğmeyle açılmazsa: bağlantıyı <b>Kopyala</b> → takvim uygulamanda “URL’den takvim ekle / abone ol” alanına yapıştır.</p>'
        + (opts.userId ? ('<div class="gsch-imp"><h5>Dış takvimini Gri’ye aktar</h5>'
            + '<p>Outlook/Google takvimini yayınla, <b>ICS (https)</b> bağlantısını yapıştır. Etkinlikler Gri takviminde <b>salt-okunur</b> (kesikli) görünür, düzenli güncellenir.</p>'
            + '<div class="imp-row"><input type="text" class="imp-url" placeholder="https://...ics"><input type="text" class="imp-label" placeholder="Ad (ör. Outlook)" style="flex:0 1 130px"><button type="button" class="gsch-btn imp-add">Ekle</button></div>'
            + '<div class="imp-list"></div></div>') : '')
        + '<div class="macts" style="margin-top:10px;"><button type="button" class="gsch-btn ghost m-close">Kapat</button></div>'
        + '</div>';
      document.body.appendChild(ov);
      function close(){ if(ov.parentNode) ov.parentNode.removeChild(ov); }
      ov.addEventListener('click',function(e){ if(e.target===ov) close(); });
      ov.querySelector('.m-close').addEventListener('click',close);
      ov.querySelector('.m-copy').addEventListener('click',function(){
        var inp=ov.querySelector('.m-url'); try{ inp.select(); }catch(_e){}
        var b=ov.querySelector('.m-copy');
        function ok(){ b.textContent='Kopyalandı'; setTimeout(function(){ b.textContent='Kopyala'; },1500); }
        try{ if(navigator.clipboard&&navigator.clipboard.writeText){ navigator.clipboard.writeText(inp.value).then(ok,function(){ try{document.execCommand('copy');ok();}catch(__e){} }); } else { document.execCommand('copy'); ok(); } }catch(_e){}
      });
      if(opts.userId){
        var impList=ov.querySelector('.imp-list');
        async function refreshImp(){
          impList.innerHTML='<div style="font-size:12px;color:#8a8172">Yükleniyor…</div>';
          try{
            var r=await sb.functions.invoke('ext-calendar',{body:{action:'list'}});
            var items=(r.data&&r.data.items)||[];
            try{ localStorage.setItem('gsch-ext-on-'+opts.userId, items.length?'1':'0'); }catch(_e){}
            if(!items.length){ impList.innerHTML=''; return; }
            var cmap={}; try{ var cr=await sb.from('external_calendars').select('id,color'); (cr.data||[]).forEach(function(c){ cmap[c.id]=c.color; }); }catch(_e){}
            impList.innerHTML=items.map(function(it){ var st=it.last_synced_at?'Senkron ✓':'Bekliyor'; var cur=cmap[it.id]||'#8a8172'; var sws=PALETTE.map(function(hx){ return '<button type="button" class="gsch-sw'+(hx.toLowerCase()===String(cur).toLowerCase()?' on':'')+'" data-cid="'+esc(it.id)+'" data-hx="'+hx+'" style="background:'+hx+'" aria-label="'+hx+'"></button>'; }).join(''); return '<div class="imp-item"><span class="nm" title="'+esc(it.url)+(it.last_error?(' — '+esc(it.last_error)):'')+'">'+esc(it.label||it.url)+' · <span style="color:'+(it.last_error?'#b3402f':'#8a8172')+'">'+(it.last_error?'Hata':st)+'</span></span><button type="button" class="rm" data-id="'+esc(it.id)+'">Kaldır</button></div><div class="gsch-sws imp-sws" data-for="'+esc(it.id)+'">'+sws+'</div>'; }).join('');
            impList.querySelectorAll('.rm').forEach(function(b){ b.addEventListener('click',async function(){ b.disabled=true; try{ await sb.functions.invoke('ext-calendar',{body:{action:'remove',id:b.getAttribute('data-id')}}); }catch(_e){} refreshImp(); load(); }); });
            impList.querySelectorAll('.imp-sws .gsch-sw').forEach(function(sw){ sw.addEventListener('click', async function(){ var cid=sw.getAttribute('data-cid'), hx=sw.getAttribute('data-hx'); var grp=sw.parentNode; grp.querySelectorAll('.gsch-sw').forEach(function(x){ x.classList.remove('on'); }); sw.classList.add('on'); try{ var ur=await sb.from('external_calendars').update({color:hx}).eq('id',cid); if(ur.error) throw ur.error; load(); }catch(e){ alert('Renk kaydedilemedi: '+(e.message||'hata')); } }); });
          }catch(e){ impList.innerHTML='<div style="font-size:12px;color:#b3402f">Liste alınamadı.</div>'; }
        }
        ov.querySelector('.imp-add').addEventListener('click', async function(){
          var b=ov.querySelector('.imp-add'); var iu=ov.querySelector('.imp-url'), il=ov.querySelector('.imp-label');
          var u2=(iu.value||'').trim(), lbl=(il.value||'').trim();
          if(!u2){ alert('ICS bağlantısı gir.'); return; }
          u2=u2.replace(/^webcal:\/\//i,'https://');
          b.disabled=true; var ot=b.textContent; b.textContent='Ekleniyor…';
          try{
            var r=await sb.functions.invoke('ext-calendar',{body:{action:'add',url:u2,label:lbl}});
            var err=(r.data&&r.data.error)||(r.error&&r.error.message);
            if(err){ alert('Eklenemedi: '+err); }
            else { iu.value=''; il.value=''; try{ localStorage.setItem('gsch-extsync-'+opts.userId,'0'); localStorage.setItem('gsch-ext-on-'+opts.userId,'1'); }catch(_e){} }
          }catch(e){ alert('Eklenemedi: '+(e.message||'hata')); }
          b.disabled=false; b.textContent=ot; refreshImp(); load();
        });
        refreshImp();
      }
    }

    function startEdit(id){
      var row=null; for(var i=0;i<state.rows.length;i++){ if(String(state.rows[i].id)===String(id)){ row=state.rows[i]; break; } }
      if(!row || !canManage(row)) return;
      state.editing=id;
      var d=row._d;
      if(aggregate){ var fc=cont.querySelector('.f-class'); if(fc) fc.value=row.class_id; }
      cont.querySelector('.f-title').value=row.title||'';
      setFDate(d.getFullYear()+'-'+two(d.getMonth()+1)+'-'+two(d.getDate()));
      cont.querySelector('.f-h').value=two(d.getHours());
      cont.querySelector('.f-m').value=two(Math.floor(d.getMinutes()/5)*5);
      cont.querySelector('.f-dur').value=String(row.duration_min||60);
      cont.querySelector('.f-note').value=row.note||'';
      var f=cont.querySelector('.gsch-form'); f.classList.add('editing');
      setFormTitle('Dersi Düzenle');
      cont.querySelector('.f-save').textContent='Güncelle';
      formOpen();
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
        var q=sb.from('grimeet_schedule').select('id,title,starts_at,duration_min,room_code,note,status,class_id,teacher_id,classes(name,color)').eq('status','scheduled').gte('starts_at',floor).order('starts_at',{ascending:true});
        if(role==='teacher'){ if(aggregate) q=q.eq('teacher_id',opts.userId); else q=q.eq('class_id',opts.classId); }
        var r=await q;
        if(r.error) throw r.error;
        state.rows=(r.data||[]).map(function(x){ x._d=new Date(x.starts_at); return x; });
        if(opts.userId){
          try{
            var _ecm={}; try{ var _ec=await sb.from('external_calendars').select('id,color').eq('user_id',opts.userId); (_ec.data||[]).forEach(function(c){ if(c.color) _ecm[c.id]=c.color; }); }catch(_e){}
            var ex=await sb.from('external_events').select('id,calendar_id,title,starts_at,ends_at,all_day,location').eq('user_id',opts.userId).gte('starts_at',floor).order('starts_at',{ascending:true});
            (ex.data||[]).forEach(function(e){ var d=new Date(e.starts_at); var dur=e.ends_at?Math.max(15,Math.round((new Date(e.ends_at).getTime()-d.getTime())/60000)):60; state.rows.push({ id:'ext-'+e.id, title:e.title, starts_at:e.starts_at, duration_min:dur, note:e.location||null, all_day:e.all_day, _d:d, _ext:true, _extColor:_ecm[e.calendar_id]||null }); });
            state.rows.sort(function(a,b){ return a._d.getTime()-b._d.getTime(); });
          }catch(_e){}
        }
        render();
        if(statsOpen) loadStats();
        maybeSyncExternal();
        if(opts.onLoad) try{ opts.onLoad(state.rows.length); }catch(_e){}
      }catch(e){ body.innerHTML='<div class="gsch-empty">Program yüklenemedi.</div>'; if(opts.onLoad) try{ opts.onLoad(0); }catch(_e){} }
    }

    function actionBtns(row){
      if(row._ext){ return '<span class="gsch-ext-tag">Dış takvim</span>'; }
      var start=row._d, dur=row.duration_min||60;
      var openFrom=start.getTime()-15*60000, openTo=start.getTime()+ (dur+30)*60000;
      var now=Date.now(), live=now>=openFrom&&now<=openTo;
      var clsQ = row.class_id ? ('&class='+encodeURIComponent(row.class_id)) : '';  // #107: panel dogru sinifa kilitlensin
      if(canManage(row)){
        return '<a class="gsch-btn" href="grimeet-oda.html?room='+encodeURIComponent(row.room_code)+'&host=1'+clsQ+'">'+(live?'Şimdi Başlat':'Başlat')+'</a>'
             + '<button class="gsch-btn ghost" data-edit="'+row.id+'">Düzenle</button>'
             + '<button class="gsch-btn danger" data-cancel="'+row.id+'">İptal</button>';
      }
      if(live) return '<a class="gsch-btn" href="grimeet-oda.html?room='+encodeURIComponent(row.room_code)+clsQ+'">Katıl</a>';
      return '<button class="gsch-btn" disabled>'+relLabel(start)+'</button>';
    }

    function itemHTML(row){
      var d=row._d, dur=row.duration_min||60;
      var start=d.getTime(), soon=(start-Date.now())<60*60000 && (start-Date.now())>-((dur+30)*60000);
      var cls=row.classes&&row.classes.name?row.classes.name:'';
      var showCls=(role==='student'||aggregate);
      var line=WD[(d.getDay()+6)%7]+' '+d.getDate()+' '+MONTHS[d.getMonth()]+' · '+hhmm(d)+' · '+dur+' dk'+(showCls&&cls?(' · '+esc(cls)):'');
      var col=rowColor(row);
      return '<div class="gsch-item'+(soon?' soon':'')+'" data-date="'+d.toDateString()+'" style="border-left:4px solid '+col+'">'
        + '<div class="gsch-item-head"><span class="gsch-daypill" style="background:'+col+';color:#fff">'+d.getDate()+' '+MONTHS[d.getMonth()]+'</span><span class="gsch-item-title">'+esc(row.title)+'</span></div>'
        + '<div class="gsch-item-sub">'+line+'</div>'
        + (row.note?'<div class="gsch-item-note">'+esc(row.note)+'</div>':'')
        + '<div class="gsch-item-actions">'+actionBtns(row)+'</div>'
        + '</div>';
    }

    // Gün popup için ajanda satırı: tarih tekrarı yok; saat solda, ders sağda
    function dayItemHTML(row){
      var d=row._d, dur=row.duration_min||60, col=rowColor(row);
      var end=new Date(d.getTime()+dur*60000);
      var cls=(row.classes&&row.classes.name)?row.classes.name:'';
      return '<div class="gsch-dayrow'+(row._ext?' ext':'')+'" style="border-left:4px solid '+col+'">'
        + '<div class="gsch-dayrow-time"><b>'+hhmm(d)+'</b><span>'+hhmm(end)+'</span></div>'
        + '<div class="gsch-dayrow-main">'
          + '<div class="gsch-dayrow-title">'+esc(row.title)+(cls?' <span class="gsch-dayrow-cls" style="background:'+col+'22;color:'+col+'">'+esc(cls)+'</span>':'')+'</div>'
          + '<div class="gsch-dayrow-meta">'+dur+' dk'+(row.note?(' · '+esc(row.note)):'')+'</div>'
          + '<div class="gsch-item-actions">'+actionBtns(row)+'</div>'
        + '</div></div>';
    }

    function bindActions(scope){
      scope.querySelectorAll('[data-cancel]').forEach(function(b){ b.addEventListener('click',function(){ cancelLesson(b.getAttribute('data-cancel')); }); });
      scope.querySelectorAll('[data-edit]').forEach(function(b){ b.addEventListener('click',function(){ startEdit(b.getAttribute('data-edit')); }); });
    }

    var WD_L=['Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi','Pazar'];
    function dayHdr(d){
      var t=new Date(); t.setHours(0,0,0,0);
      var dd=new Date(d.getFullYear(),d.getMonth(),d.getDate());
      var diff=Math.round((dd-t)/86400000);
      var base=d.getDate()+' '+MONTHS_L[d.getMonth()];
      if(diff===0) return 'Bugün · '+base;
      if(diff===1) return 'Yarın · '+base;
      return WD_L[(d.getDay()+6)%7]+' · '+base;
    }
    function renderListInner(el){
      if(!state.rows.length){ el.innerHTML='<div class="gsch-empty">'+(role==='teacher'?'Henüz planlanmış ders yok. “+ Yeni Ders Planla” ile ekle.':'Yaklaşan online ders yok.')+'</div>'; return; }
      var html='<div class="gsch-list">', lastKey='';
      state.rows.forEach(function(r){
        var key=r._d.toDateString();
        if(key!==lastKey){ html+='<div class="gsch-daygroup">'+esc(dayHdr(r._d))+'</div>'; lastKey=key; }
        html+=itemHTML(r);
      });
      html+='</div>';
      el.innerHTML=html;
      bindActions(el);
    }

    function highlightDay(dt){
      var lst=cont.querySelector('.gsch-col-list-inner'); if(!lst)return;
      var key=dt.toDateString(), first=null;
      lst.querySelectorAll('.gsch-item').forEach(function(it){ var on=it.getAttribute('data-date')===key; it.classList.toggle('hl',on); if(on&&!first)first=it; });
      if(first&&first.scrollIntoView) first.scrollIntoView({behavior:'smooth',block:'nearest'});
    }

    var _calRO=null;
    function renderCal(el){
      var m=state.month, y=m.getFullYear(), mo=m.getMonth();
      var first=new Date(y,mo,1), startWd=(first.getDay()+6)%7; // Pzt=0
      var days=new Date(y,mo+1,0).getDate();
      var byDay={}; state.rows.forEach(function(r){ if(r._d.getFullYear()===y&&r._d.getMonth()===mo){ (byDay[r._d.getDate()]=byDay[r._d.getDate()]||[]).push(r); } });
      var today=new Date();
      var holMap=holidayMap(y);
      var cells='';
      for(var i=0;i<startWd;i++) cells+='<div class="gsch-cell out'+(i>=5?' we':'')+'"></div>';
      for(var dnum=1;dnum<=days;dnum++){
        var _dd=new Date(y,mo,dnum), _dw=_dd.getDay(), we=(_dw===0||_dw===6);
        var hol=holMap[y+'-'+two(mo+1)+'-'+two(dnum)];
        var evs=byDay[dnum]||[], has=evs.length>0, isToday=sameDay(_dd,today), selD=state.sel&&sameDay(_dd,state.sel);
        var holHTML=hol?('<span class="hol'+(hol.half?' half':'')+'" title="'+esc(hol.name)+'">'+esc(hol.name)+'</span>'):'';
        var evHTML=evs.map(function(r){ var cn=r.classes&&r.classes.name?r.classes.name:''; var lbl=cn?(esc(cn)+' ('+esc(r.title)+')'):esc(r.title); var col=rowColor(r); return '<span class="ev'+(r._ext?' ev-ext':'')+'" style="background:'+col+'22;color:'+col+';border-left:3px '+(r._ext?'dashed':'solid')+' '+col+'"'+(canManage(r)?' draggable="true" data-id="'+esc(r.id)+'"':'')+'><b>'+hhmm(r._d)+'</b> '+lbl+'</span>'; }).join('');
        var cls='gsch-cell'+(has?' has':'')+((has||hol)?' gsch-clk':'')+(we?' we':'')+((hol&&!hol.half)?' holi':'')+(isToday?' today':'')+(selD?' sel':'');
        cells+='<div class="'+cls+'" data-day="'+dnum+'"><span class="num">'+dnum+'</span>'+holHTML+'<div class="gsch-evs">'+evHTML+'</div></div>';
      }
      el.innerHTML='<div class="gsch-cal"><div class="gsch-cal-h"><b>'+MONTHS_L[mo]+' '+y+'</b><span class="cal-nav"><button class="cal-prev" aria-label="Önceki ay">‹</button><button class="cal-next" aria-label="Sonraki ay">›</button></span></div>'
        + '<div class="gsch-gridwrap"><div class="gsch-wdrow">'+WD.map(function(w,i){return '<div class="wd'+(i>=5?' we':'')+'">'+w+'</div>';}).join('')+'</div><div class="gsch-grid">'+cells+'</div></div></div>';
      el.querySelector('.cal-prev').addEventListener('click',function(){ state.month=new Date(y,mo-1,1); state.sel=null; renderCal(el); });
      el.querySelector('.cal-next').addEventListener('click',function(){ state.month=new Date(y,mo+1,1); state.sel=null; renderCal(el); });
      el.querySelectorAll('.gsch-clk').forEach(function(c){ c.addEventListener('click',function(){ var dd=parseInt(c.dataset.day,10); openDayModal(y,mo,dd); }); });
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
      // Sığmayan dersleri "+N" ile göster; yükseklik değişince (kutu boyutlandırma) yeniden hesapla
      try{
        if(_calRO && _calRO.disconnect) _calRO.disconnect();
        var _gw=el.querySelector('.gsch-gridwrap');
        if(_gw){
          fitDayCells(_gw); // senkron ilk hesap (layout clientHeight okunarak zorlanır)
          if(window.ResizeObserver){ _calRO=new ResizeObserver(function(){ fitDayCells(_gw); }); _calRO.observe(_gw); }
        }
      }catch(e){ try{ fitDayCells(el.querySelector('.gsch-gridwrap')); }catch(_e){} }
    }

    function dropReschedule(id,y,mo,day){
      var row=null; for(var i=0;i<state.rows.length;i++){ if(String(state.rows[i].id)===String(id)){ row=state.rows[i]; break; } }
      if(!row || !canManage(row)) return;
      openDropModal(row,y,mo,day);
    }

    // Planlama formunu belirli bir günün tarihiyle ön-doldurup aç
    function openNewForm(y,mo,dnum){
      var f=cont.querySelector('.gsch-form'); if(!f) return;
      resetForm();
      if(y!=null) setFDate(y+'-'+two(mo+1)+'-'+two(dnum));
      formOpen();
      var ft=cont.querySelector('.f-title'); if(ft){ try{ ft.focus(); }catch(e){} }
    }

    // Bir güne tıklayınca o günün tüm planını gösteren popup (kaç ders olursa olsun)
    function openDayModal(y,mo,dnum){
      var dObj=new Date(y,mo,dnum);
      var rows=state.rows.filter(function(r){ return sameDay(r._d,dObj); });
      var hol=holidayMap(y)[y+'-'+two(mo+1)+'-'+two(dnum)];
      var head=WD_L[(dObj.getDay()+6)%7]+' · '+dnum+' '+MONTHS_L[mo]+' '+y;
      var holBadge=hol?('<div class="gsch-daymodal-hol'+(hol.half?' half':'')+'">'+esc(hol.name)+(hol.half?' · yarım gün':'')+'</div>'):'';
      var listHTML=rows.length ? rows.map(dayItemHTML).join('') : '<div class="gsch-empty" style="padding:20px">Bu gün planlı ders yok.</div>';
      var planBtn=(role==='teacher') ? '<button type="button" class="gsch-btn gsch-dayplan">+ Bu güne ders planla</button>' : '';
      var ov=document.createElement('div'); ov.className='gsch-modal-ov';
      ov.innerHTML='<div class="gsch-modal gsch-daymodal"><h4>'+esc(head)+'</h4>'+holBadge
        +'<div class="gsch-daymodal-list">'+listHTML+'</div>'
        +'<div class="macts" style="margin-top:14px;justify-content:space-between;">'+planBtn+'<button type="button" class="gsch-btn ghost m-close">Kapat</button></div></div>';
      document.body.appendChild(ov);
      function close(){ if(ov.parentNode) ov.parentNode.removeChild(ov); }
      ov.addEventListener('click',function(e){ if(e.target===ov) close(); });
      ov.querySelector('.m-close').addEventListener('click',close);
      var pb=ov.querySelector('.gsch-dayplan'); if(pb) pb.addEventListener('click',function(){ close(); openNewForm(y,mo,dnum); });
      bindActions(ov);
      ov.querySelectorAll('[data-edit],[data-cancel]').forEach(function(b){ b.addEventListener('click',close); });
    }

    // Hücreye sığmayan dersleri gizleyip "+N ders" etiketi ekle (yükseklik değişince yeniden çalışır)
    function fitDayCells(gw){
      if(!gw) return;
      gw.querySelectorAll('.gsch-cell .gsch-evs').forEach(function(evs){
        var pills=[].slice.call(evs.children).filter(function(x){ return x.classList&&x.classList.contains('ev')&&!x.classList.contains('ev-more'); });
        var oldChip=evs.querySelector('.ev-more'); if(oldChip) oldChip.parentNode.removeChild(oldChip);
        if(!pills.length) return;
        for(var k=0;k<pills.length;k++) pills[k].style.display='';
        var avail=evs.clientHeight; if(avail<=6) return;
        var total=0; pills.forEach(function(p){ total+=p.offsetHeight+1; });
        if(total<=avail) return; // hepsi sığıyor
        var chipH=15, used=0, showN=0;
        for(var i=0;i<pills.length;i++){ var h=pills[i].offsetHeight+1; if(used+h<=avail){ used+=h; showN++; } else break; }
        if(showN<1){ showN=1; used=pills[0].offsetHeight+1; }
        while(showN>0 && used+chipH>avail){ showN--; used-=(pills[showN].offsetHeight+1); }
        if(showN<1) showN=1;
        for(var j=showN;j<pills.length;j++) pills[j].style.display='none';
        var hidden=pills.length-showN; if(hidden<=0) return;
        var chip=document.createElement('span'); chip.className='ev ev-more'; chip.textContent='+'+hidden+' ders';
        evs.appendChild(chip);
      });
    }

    function openDropModal(row,y,mo,day){
      var od=row._d;
      var ov=document.createElement('div'); ov.className='gsch-modal-ov';
      ov.innerHTML='<div class="gsch-modal"><h4>Dersi Taşı</h4>'
        + '<p>“'+esc(row.title||'Ders')+'” &rarr; <b>'+day+' '+MONTHS_L[mo]+' '+y+'</b></p>'
        + '<div class="mrow"><label>Saat</label><select class="m-h">'+_hopt+'</select><span class="f-colon">:</span><select class="m-m">'+_mopt+'</select></div>'
        + '<div class="macts"><button type="button" class="gsch-btn ghost m-cancel">Vazgeç</button><button type="button" class="gsch-btn m-ok">Taşı</button></div>'
        + '</div>';
      document.body.appendChild(ov);
      var hSel=ov.querySelector('.m-h'), mSel=ov.querySelector('.m-m');
      hSel.value=two(od.getHours()); mSel.value=two(Math.floor(od.getMinutes()/5)*5);
      function close(){ if(ov.parentNode) ov.parentNode.removeChild(ov); }
      ov.addEventListener('click',function(e){ if(e.target===ov) close(); });
      ov.querySelector('.m-cancel').addEventListener('click',close);
      ov.querySelector('.m-ok').addEventListener('click',function(){
        var H=parseInt(hSel.value,10); if(isNaN(H))H=od.getHours();
        var M=parseInt(mSel.value,10); if(isNaN(M))M=od.getMinutes();
        var nd=new Date(y,mo,day,H,M,0,0);
        close();
        reschedule(row.id, nd.toISOString());
      });
    }

    // ── Ders İstatistiği: geçmiş dersleri sınıf + ISO-hafta bazında grupla ──
    function isoMonday(d){
      var x=new Date(d.getFullYear(),d.getMonth(),d.getDate());
      var wd=(x.getDay()+6)%7; // Pzt=0
      x.setDate(x.getDate()-wd);
      return x;
    }
    function weekRange(mon){
      var sun=new Date(mon.getFullYear(),mon.getMonth(),mon.getDate()+6);
      if(mon.getMonth()===sun.getMonth()) return mon.getDate()+'–'+sun.getDate()+' '+MONTHS[mon.getMonth()];
      return mon.getDate()+' '+MONTHS[mon.getMonth()]+'–'+sun.getDate()+' '+MONTHS[sun.getMonth()];
    }
    function groupStats(rows){
      var byClass={}, order=[];
      rows.forEach(function(x){
        var d=new Date(x.starts_at);
        if(isNaN(d.getTime())) return;
        var cname=(x.classes&&x.classes.name)?x.classes.name:'Genel';
        var cid=x.class_id||('_'+cname);
        if(!byClass[cid]){ byClass[cid]={name:cname,color:(x.classes&&x.classes.color)||(x.class_id?autoColor(x.class_id):'#2C5856'),weeks:{},wkOrder:[]}; order.push(cid); }
        var g=byClass[cid], mon=isoMonday(d);
        var wkey=mon.getFullYear()+'-'+two(mon.getMonth()+1)+'-'+two(mon.getDate());
        if(!g.weeks[wkey]){ g.weeks[wkey]={mon:mon,items:[]}; g.wkOrder.push(wkey); }
        g.weeks[wkey].items.push({d:d,title:x.title});
      });
      return order.map(function(cid){
        var g=byClass[cid];
        var weeks=g.wkOrder.map(function(k){return g.weeks[k];});
        weeks.sort(function(a,b){ return b.mon.getTime()-a.mon.getTime(); });          // haftalar: en yeni önce
        weeks.forEach(function(w){ w.items.sort(function(a,b){ return a.d.getTime()-b.d.getTime(); }); }); // hafta içi kronolojik
        return { name:g.name, color:g.color, weeks:weeks };
      });
    }
    function paintStats(){
      var el=cont.querySelector('.gsch-stats-body'); if(!el) return;
      if(statsData==null){ el.innerHTML='<div class="gsch-stats-empty">Yükleniyor…</div>'; return; }
      if(!statsData.length){ el.innerHTML='<div class="gsch-stats-empty">Bu dönemde geçmiş ders yok.</div>'; return; }
      el.innerHTML=statsData.map(function(g){
        return '<div class="gsch-stats-cls"><div class="gsch-stats-clsname"><span class="gsch-stats-dot" style="background:'+g.color+'"></span>'+esc(g.name)+'</div>'
          + g.weeks.map(function(w){
              return '<div class="gsch-stats-wk"><div class="gsch-stats-wk-h"><span class="gsch-stats-wk-range">'+weekRange(w.mon)+'</span><span class="gsch-stats-wk-count">'+w.items.length+' ders</span></div>'
                + '<div class="gsch-stats-wk-list">'+w.items.map(function(it){ return '<div class="gsch-stats-ln">'+WD[(it.d.getDay()+6)%7]+' '+it.d.getDate()+' · '+hhmm(it.d)+' · '+esc(it.title)+'</div>'; }).join('')+'</div></div>';
            }).join('')
          + '</div>';
      }).join('');
    }
    async function loadStats(){
      try{
        var q=sb.from('grimeet_schedule').select('id,title,starts_at,duration_min,class_id,teacher_id,classes(name,color)')
          .lt('starts_at', new Date().toISOString())
          .gte('starts_at', new Date(Date.now()-95*24*3600*1000).toISOString())
          .neq('status','cancelled')
          .order('starts_at',{ascending:false});
        if(role==='teacher'){ if(aggregate) q=q.eq('teacher_id',opts.userId); else q=q.eq('class_id',opts.classId); }
        var r=await q;
        if(r.error) throw r.error;
        statsData=groupStats(r.data||[]);
        paintStats();
      }catch(e){ statsData=[]; paintStats(); } // hata: ana takvimi etkileme, panel sessizce boş
    }

    function setupResizer(){
      // Kutu (takvim+liste) boyutunu geri yükle — sadece geniş ekran
      var main=body.querySelector('.gsch-main');
      if(main && window.innerWidth>760){
        try{ var bw=parseInt(localStorage.getItem('gsch-box-w'),10), bh=parseInt(localStorage.getItem('gsch-box-h'),10);
          if(bw&&bw>=600) main.style.width=Math.min(bw,3000)+'px';
          if(bh&&bh>=440) main.style.height=Math.min(bh,1100)+'px';
        }catch(e){}
      }
      var split=body.querySelector('.gsch-split'); if(!split) return;
      var rz=split.querySelector('.gsch-resizer'); if(!rz) return;
      var saved; try{ saved=parseInt(localStorage.getItem('gsch-list-w'),10); }catch(e){}
      if(saved && saved>=300 && saved<=760) split.style.setProperty('--gsch-list-w', saved+'px');
      var dragging=false, lastW=0;
      function clamp(w){ var maxW=Math.max(320, split.getBoundingClientRect().width-460); return Math.max(300, Math.min(Math.min(720,maxW), w)); }
      function move(e){ if(!dragging) return; var x=(e.touches&&e.touches[0])?e.touches[0].clientX:e.clientX; var r=split.getBoundingClientRect(); lastW=clamp(r.right - x - 8); split.style.setProperty('--gsch-list-w', lastW+'px'); if(e.cancelable) e.preventDefault(); }
      function up(){ if(!dragging) return; dragging=false; rz.classList.remove('drag'); try{ document.body.style.userSelect=''; }catch(e){} if(lastW){ try{ localStorage.setItem('gsch-list-w', String(Math.round(lastW))); }catch(e){} }
        document.removeEventListener('mousemove',move); document.removeEventListener('mouseup',up); document.removeEventListener('touchmove',move); document.removeEventListener('touchend',up); }
      function down(e){ dragging=true; rz.classList.add('drag'); try{ document.body.style.userSelect='none'; }catch(_e){} document.addEventListener('mousemove',move); document.addEventListener('mouseup',up); document.addEventListener('touchmove',move,{passive:false}); document.addEventListener('touchend',up); if(e.cancelable) e.preventDefault(); }
      rz.addEventListener('mousedown',down); rz.addEventListener('touchstart',down,{passive:false});
    }

    function render(){
      var mainHTML = !state.rows.length
        ? '<div class="gsch-empty">'+(role==='teacher'?'Henüz planlanmış ders yok. “+ Yeni Ders Planla” ile ekle.':'Yaklaşan online ders yok.')+'</div>'
        : '<div class="gsch-split"><div class="gsch-col gsch-col-cal"></div><div class="gsch-resizer" title="Sürükleyerek takvim / liste genişliğini ayarla" aria-label="Genişliği ayarla"></div><div class="gsch-col gsch-col-list"><div class="gsch-col-list-inner"></div></div></div>';
      body.innerHTML='<div class="gsch-shell'+(statsOpen?' stats-on':'')+'"><div class="gsch-main">'+mainHTML+'</div>'
        + '<aside class="gsch-stats"><div class="gsch-stats-h">Ders İstatistiği · son 3 ay</div><div class="gsch-stats-body"></div></aside></div>';
      if(state.rows.length){
        setupResizer();
        renderCal(body.querySelector('.gsch-col-cal'));
        renderListInner(body.querySelector('.gsch-col-list-inner'));
      }
      paintStats();
    }

    // Kutu köşe-boyutlandırma (native resize:both) kalıcılığı: pointerup'ta boyut değiştiyse kaydet
    (function(){
      var sw=0,sh=0;
      function refit(){ try{ fitDayCells(cont.querySelector('.gsch-gridwrap')); }catch(e){} }
      document.addEventListener('pointerdown',function(){ var m=cont.querySelector('.gsch-main'); if(!m)return; var r=m.getBoundingClientRect(); sw=r.width; sh=r.height; });
      document.addEventListener('pointerup',function(){ if(window.innerWidth<=760){ refit(); return; } var m=cont.querySelector('.gsch-main'); if(!m){ refit(); return; } var r=m.getBoundingClientRect(); if(Math.abs(r.width-sw)>2||Math.abs(r.height-sh)>2){ try{ localStorage.setItem('gsch-box-w',String(Math.round(r.width))); localStorage.setItem('gsch-box-h',String(Math.round(r.height))); }catch(e){} } refit(); });
      var _wt=null; window.addEventListener('resize',function(){ if(_wt) clearTimeout(_wt); _wt=setTimeout(refit,180); });
    })();

    load();
    return { reload:load };
  }

  window.GriSchedule = { mount: mount };
})();
