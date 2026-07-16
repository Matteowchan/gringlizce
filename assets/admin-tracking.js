/* Gri English . admin canli akis + ogrenci zaman cizgisi (kendi kendine yeter)
   admin.html'e tek satir:  <script src="assets/admin-tracking.js" defer></script>
   - Sag altta "Canli Akis" paneli: events tablosunu Realtime dinler, anlik gosterir.
   - Bir satira tiklayinca o ogrencinin tum zaman cizgisi acilir (admin_user_events).
   Mevcut admin kodunu DEGISTIRMEZ; varsa window.sb'yi kullanir, yoksa kendi client'ini kurar. */
(function () {
  "use strict";
  var URL = "https://vazbvbqgvtlaqkytfsbi.supabase.co";
  var KEY = "sb_publishable_F5K-wIVQHXlD4e4GYnySNw_Xm4teO9g";

  var TYPE_TR = {
    page_view: "Sayfa", login: "Giris", logout: "Cikis",
    question_answer: "Soru", vocab_answer: "Kelime", vocab_review: "Kelime tekrar",
    vocab_quiz: "Kelime testi", bookmark: "Yer imi", writing_submit: "Yazi",
    deneme: "Deneme", ai_ask: "AI soru", material_open: "Materyal", purchase: "Satin alma"
  };
  var emailCache = {};

  function sbc() {
    if (window.sb && window.sb.channel) return window.sb;
    if (window.griTrackSB) return window.griTrackSB;
    if (window.supabase && window.supabase.createClient) {
      window.griTrackSB = window.supabase.createClient(URL, KEY);
      return window.griTrackSB;
    }
    return null;
  }

  function esc(s){ return String(s==null?"":s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];}); }
  function fmt(t){ try{ var d=new Date(t); return d.toLocaleString('tr-TR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}); }catch(e){ return ""; } }
  function label(t){ return TYPE_TR[t] || t; }
  function who(row){ return row.email || emailCache[row.user_id] || (row.user_id? row.user_id.slice(0,8):'—'); }
  function detail(row){
    var d = row.event_data || {};
    if (row.event_type==='page_view' || row.event_type==='material_open') return esc(row.page||'');
    if (row.event_type==='question_answer') return esc((d.question_slug||d.slug||'')+' '+(d.status||''));
    if (row.event_type==='vocab_answer') return esc((d.word||'')+(d.correct===false?' (yanlis)':d.correct===true?' (dogru)':''));
    if (row.event_type==='writing_submit') return esc((d.exam||'')+(d.text_type?' · '+d.text_type:''));
    try{ var s=JSON.stringify(d); return esc(s.length>60?s.slice(0,60)+'…':s==='{}'?'':s); }catch(e){ return ''; }
  }

  var CSS =
    ".gat-fab{position:fixed;right:18px;bottom:18px;z-index:99998;background:#2C5856;color:#fff;border:none;border-radius:24px;padding:11px 18px;font-family:Inter,sans-serif;font-size:13px;font-weight:600;cursor:pointer;box-shadow:0 6px 20px rgba(0,0,0,.25)}" +
    ".gat-fab .dot{display:inline-block;width:8px;height:8px;border-radius:50%;background:#7fe0a0;margin-right:7px;animation:gatpulse 1.6s infinite}" +
    "@keyframes gatpulse{0%,100%{opacity:1}50%{opacity:.3}}" +
    ".gat-panel{position:fixed;right:18px;bottom:66px;width:360px;max-width:92vw;max-height:70vh;background:#fff;border:1px solid #e0dcd0;border-radius:16px;box-shadow:0 16px 48px rgba(0,0,0,.28);z-index:99998;display:none;flex-direction:column;overflow:hidden;font-family:Inter,sans-serif}" +
    ".gat-panel.open{display:flex}" +
    ".gat-head{padding:12px 16px;border-bottom:1px solid #eee;display:flex;align-items:center;gap:8px;font-weight:700;font-size:14px;color:#1a2230}" +
    ".gat-head .x{margin-left:auto;cursor:pointer;color:#888;font-size:18px}" +
    ".gat-list{overflow:auto;padding:4px 0}" +
    ".gat-row{display:flex;align-items:center;gap:9px;padding:8px 16px;border-bottom:1px solid #f2efe7;cursor:pointer;font-size:12.5px}" +
    ".gat-row:hover{background:#f7f4ec}" +
    ".gat-tag{flex-shrink:0;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.03em;color:#2C5856;background:#dcebe8;border-radius:20px;padding:2px 8px}" +
    ".gat-em{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#1a2230;font-weight:600}" +
    ".gat-de{color:#6b6862;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:120px}" +
    ".gat-at{color:#9a8e7b;font-size:11px;flex-shrink:0}" +
    ".gat-ov{position:fixed;inset:0;background:rgba(20,15,10,.45);z-index:99999;display:none;align-items:center;justify-content:center}" +
    ".gat-ov.open{display:flex}" +
    ".gat-card{background:#fff;border-radius:16px;width:520px;max-width:94vw;max-height:82vh;display:flex;flex-direction:column;overflow:hidden}" +
    ".gat-card .h{padding:14px 18px;border-bottom:1px solid #eee;font-weight:700;color:#1a2230;display:flex;align-items:center}" +
    ".gat-card .h .x{margin-left:auto;cursor:pointer;color:#888;font-size:20px}" +
    ".gat-tl{overflow:auto;padding:6px 0}";

  var panel, list, ov, ovBody, ovTitle;
  function inject() {
    var st = document.createElement("style"); st.textContent = CSS; document.head.appendChild(st);
    var fab = document.createElement("button"); fab.className = "gat-fab";
    fab.innerHTML = '<span class="dot"></span>Canli Akis';
    var p = document.createElement("div"); p.className = "gat-panel";
    p.innerHTML = '<div class="gat-head">Canli Akis<span class="x" data-close>&times;</span></div><div class="gat-list" id="gat-list"></div>';
    ov = document.createElement("div"); ov.className = "gat-ov";
    ov.innerHTML = '<div class="gat-card"><div class="h"><span id="gat-ov-title">Zaman Cizgisi</span><span class="x" data-ovclose>&times;</span></div><div class="gat-tl" id="gat-tl"></div></div>';
    document.body.appendChild(fab); document.body.appendChild(p); document.body.appendChild(ov);
    panel = p; list = p.querySelector("#gat-list"); ovBody = ov.querySelector("#gat-tl"); ovTitle = ov.querySelector("#gat-ov-title");
    fab.addEventListener("click", function(){ panel.classList.toggle("open"); });
    p.querySelector("[data-close]").addEventListener("click", function(){ panel.classList.remove("open"); });
    ov.addEventListener("click", function(e){ if(e.target===ov || e.target.hasAttribute("data-ovclose")) ov.classList.remove("open"); });
  }

  function rowHtml(r){
    return '<div class="gat-row" data-uid="'+esc(r.user_id)+'" data-em="'+esc(who(r))+'">' +
      '<span class="gat-tag">'+esc(label(r.event_type))+'</span>' +
      '<span class="gat-em">'+esc(who(r))+'</span>' +
      '<span class="gat-de">'+detail(r)+'</span>' +
      '<span class="gat-at">'+fmt(r.at||r.created_at)+'</span></div>';
  }

  function bindRows(container){
    container.querySelectorAll(".gat-row").forEach(function(el){
      el.addEventListener("click", function(){ openTimeline(el.getAttribute("data-uid"), el.getAttribute("data-em")); });
    });
  }

  async function loadFeed(){
    var sb = sbc(); if(!sb) return;
    try{
      var res = await sb.rpc("admin_recent_events", { p_limit: 60 });
      var rows = (res && res.data) || [];
      rows.forEach(function(r){ if(r.email) emailCache[r.user_id]=r.email; });
      list.innerHTML = rows.map(rowHtml).join("") || '<div style="padding:16px;color:#9a8e7b;font-size:12px">Henuz olay yok.</div>';
      bindRows(list);
    }catch(e){ list.innerHTML = '<div style="padding:16px;color:#b4504a;font-size:12px">Akis yuklenemedi.</div>'; }
  }

  function subscribe(){
    var sb = sbc(); if(!sb || !sb.channel) return;
    sb.channel("gat-events")
      .on("postgres_changes", { event:"INSERT", schema:"public", table:"events" }, function(payload){
        var r = payload["new"]; if(!r) return;
        r.at = r.created_at;
        var el = document.createElement("div"); el.innerHTML = rowHtml(r);
        var node = el.firstChild;
        if(list.firstChild) list.insertBefore(node, list.firstChild); else list.appendChild(node);
        node.addEventListener("click", function(){ openTimeline(node.getAttribute("data-uid"), node.getAttribute("data-em")); });
        while(list.children.length>120) list.removeChild(list.lastChild);
      })
      .subscribe();
  }

  async function openTimeline(uid, em){
    if(!uid) return;
    ovTitle.textContent = "Zaman Cizgisi . " + (em||uid.slice(0,8));
    ovBody.innerHTML = '<div style="padding:16px;color:#9a8e7b;font-size:12px">Yukleniyor…</div>';
    ov.classList.add("open");
    var sb = sbc(); if(!sb) return;
    try{
      var res = await sb.rpc("admin_user_events", { p_user_id: uid, p_limit: 200 });
      var rows = (res && res.data) || [];
      ovBody.innerHTML = rows.length ? rows.map(function(r){
        return '<div class="gat-row" style="cursor:default"><span class="gat-tag">'+esc(label(r.event_type))+'</span>' +
          '<span class="gat-em" style="font-weight:500">'+detail(r)+'</span>' +
          '<span class="gat-at">'+fmt(r.at)+'</span></div>';
      }).join("") : '<div style="padding:16px;color:#9a8e7b;font-size:12px">Bu ogrenci icin kayitli aktivite yok.</div>';
    }catch(e){ ovBody.innerHTML = '<div style="padding:16px;color:#b4504a;font-size:12px">Zaman cizgisi yuklenemedi.</div>'; }
  }
  window.showUserTimeline = openTimeline;  // admin modalindan da cagrilabilir

  function start(){ inject(); loadFeed(); subscribe(); }
  if (document.readyState !== "loading") start();
  else document.addEventListener("DOMContentLoaded", start);
})();
