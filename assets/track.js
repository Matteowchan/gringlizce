/* Gri English . merkezi aktivite izleme (track.js)
   Her sayfaya:  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
                 <script src="assets/track.js" defer></script>   (alt klasorde ../assets/track.js)
   Kullanim:  logEvent('vocab_answer', { word: 'ubiquitous', correct: true });
   Otomatik: sayfa acilisinda page_view; oturumda ilk kez gorulunce login.
   Sadece giris yapmis kullanicilar kaydedilir (RLS de bunu zorlar).
   Sessiz ve bloklamaz: hata olsa bile sayfayi etkilemez. */
(function () {
  "use strict";
  var URL = "https://vazbvbqgvtlaqkytfsbi.supabase.co";
  var KEY = "sb_publishable_F5K-wIVQHXlD4e4GYnySNw_Xm4teO9g";

  var _sb = null, _userId = null, _ready = false, _queue = [];

  function client() {
    if (_sb) return _sb;
    if (window.griTrackSB) { _sb = window.griTrackSB; return _sb; }
    if (window.supabase && window.supabase.createClient) {
      _sb = window.supabase.createClient(URL, KEY);
      window.griTrackSB = _sb;
      return _sb;
    }
    return null;
  }

  function whenReady(cb) {
    if (window.supabase && window.supabase.createClient) return cb();
    var tries = 0;
    var iv = setInterval(function () {
      tries++;
      if (window.supabase && window.supabase.createClient) { clearInterval(iv); cb(); }
      else if (tries > 50) { clearInterval(iv); cb(); } // ~5sn sonra vazgec
    }, 100);
  }

  function flush() {
    if (!_ready || !_userId) return;           // giris yoksa gonderme
    var sb = client(); if (!sb) return;
    if (!_queue.length) return;
    var batch = _queue.splice(0, _queue.length);
    var rows = batch.map(function (e) {
      return { user_id: _userId, event_type: e.type, event_data: e.data || {}, page: e.page };
    });
    try {
      var p = sb.from("events").insert(rows);
      if (p && p.then) p.then(function () {}, function () {}); // sessiz
    } catch (e) { /* yut */ }
  }

  // Ana API
  window.logEvent = function (type, data) {
    if (!type) return;
    _queue.push({ type: String(type), data: data || {}, page: location.pathname });
    if (_ready) flush();
  };

  // ---- Seviye belirleme track kilidi ----
  // Kullanici seviye belirleme sinavinda bir track (junior/teen/adult) + seviye secip
  // ge_track_placement'a yazilir. Farkli track'in ya da ust seviyenin dersine girerse kilitlenir.
  // FAIL-OPEN: kayit yoksa / hata olursa / sinifli ogrenciyse hicbir sey yapmaz.
  var LVLORD = { A1: 1, A2: 2, B1: 3, B2: 4, C1: 5, C2: 6 };
  function trackName(t) { return t === "junior" ? "Junior" : t === "teen" ? "Teen" : "Adult"; }
  function pageIdentity() {
    var p = (location.pathname.split("/").pop() || "").toLowerCase();
    var m = p.match(/^genel-(junior|teen)-(a1|a2|b1|b2|c1|c2)-unite-\d+(?:\.html)?$/);
    if (m) return { track: m[1], level: m[2].toUpperCase() };
    var m2 = p.match(/^genel-(a1|a2|b1|b2|c1|c2)-unite-\d+(?:\.html)?$/);
    if (m2) return { track: "adult", level: m2[1].toUpperCase() };
    return null;
  }
  function showTrackLock(rec, pageTrack, pageLevel, reason) {
    if (document.getElementById("geTrackLock")) return;
    var msg = reason === "track"
      ? ("Seviye belirleme sinavinda <b>" + trackName(rec.track) + "</b> kategorisini sectin. Bu ders <b>" + trackName(pageTrack) + "</b> kategorisine ait, o yuzden sana kapali.")
      : reason === "classlevel"
      ? ("Ogretmenin seni <b>" + rec.level + "</b> seviyesine kadar acti. <b>" + pageLevel + "</b> seviyesi henuz acik degil — yukselince ogretmenin acacak.")
      : ("Seviye belirleme sinavinda <b>" + rec.level + "</b> seviyesine yerlestin. <b>" + pageLevel + "</b> seviyesi henuz acik degil.");
    var ov = document.createElement("div");
    ov.id = "geTrackLock";
    ov.style.cssText = "position:fixed;inset:0;z-index:99999;background:#FFF9EF;display:flex;align-items:center;justify-content:center;padding:1.5rem;font-family:system-ui,-apple-system,sans-serif;";
    var box = '<div style="max-width:440px;width:100%;text-align:center;background:#fff;border:2px solid #EE6E2E;border-radius:22px;padding:2.2rem 1.8rem;box-shadow:0 10px 34px rgba(238,110,46,.12)">';
    box += '<div style="font-family:Georgia,serif;font-size:1.5rem;color:#EE6E2E;font-weight:700;margin-bottom:.5rem">Gri <span style="font-style:italic">English</span></div>';
    box += '<h2 style="margin:.2rem 0 .6rem;font-size:1.15rem;color:#2E3A59">Bu ders senin icin acik degil</h2>';
    box += '<p style="color:#666;font-size:.94rem;line-height:1.6;margin:0 0 1.3rem">' + msg + '</p>';
    box += '<a href="genel-ingilizce.html" style="display:inline-block;background:#EE6E2E;color:#fff;text-decoration:none;font-weight:700;padding:.7rem 1.3rem;border-radius:999px;font-size:.95rem">Genel Ingilizce&#39;ye Don</a>';
    box += '<div style="margin-top:.9rem"><a href="seviye-belirleme.html" style="color:#EE6E2E;font-size:.85rem">Sinavi tekrar coz</a></div></div>';
    ov.innerHTML = box;
    document.body.appendChild(ov);
    try { document.documentElement.style.overflow = "hidden"; } catch (e) {}
  }
  function checkPlacement(sb, uid, id) {
    try {
      sb.from("ge_track_placement").select("track,level").eq("user_id", uid).maybeSingle().then(function (pr) {
        var rec = pr && pr.data;
        if (!rec || !rec.track) return;            // kayit yok -> acik (fail-open)
        if (rec.track !== id.track) { showTrackLock(rec, id.track, id.level, "track"); return; }
        if (LVLORD[id.level] > (LVLORD[rec.level] || 1)) { showTrackLock(rec, id.track, id.level, "level"); }
      }, function () {});
    } catch (e) {}
  }
  function applyTrackGate(sb, uid) {
    if (!uid || !sb) return;
    var id = pageIdentity();
    if (!id) return;                                // ders sayfasi degil
    try {
      sb.rpc("ge_student_class_state").then(function (res) {
        var st = res && res.data;
        if (st && st.in_class) {
          // Sinifli ogrenci: atanan seviye UST SINIR — A1..assigned_level acik, ustu kilitli.
          // FAIL-OPEN: seviye atanmamissa (null) hicbir sey kilitlenmez.
          var al = st.assigned_level;
          if (al && LVLORD[id.level] && LVLORD[al] && LVLORD[id.level] > LVLORD[al]) {
            showTrackLock({ track: id.track, level: al }, id.track, id.level, "classlevel");
          }
          return;
        }
        checkPlacement(sb, uid, id);
      }, function () { checkPlacement(sb, uid, id); });
    } catch (e) { checkPlacement(sb, uid, id); }
  }

  function init() {
    var sb = client();
    if (!sb) { _ready = true; return; }
    sb.auth.getUser().then(function (r) {
      _userId = (r && r.data && r.data.user) ? r.data.user.id : null;
      _ready = true;
      if (_userId) {
        // oturumda ilk kez: login
        try {
          if (!sessionStorage.getItem("gri-sess-login")) {
            sessionStorage.setItem("gri-sess-login", "1");
            window.logEvent("login", {});
          }
        } catch (e) {}
        window.logEvent("page_view", {});
        try { applyTrackGate(sb, _userId); } catch (e) {}
      }
      flush();
    }, function () { _ready = true; });

    // oturum degisince (giris/cikis) user'i tazele
    try {
      sb.auth.onAuthStateChange(function (evt, session) {
        _userId = session && session.user ? session.user.id : null;
        if (evt === "SIGNED_IN" && _userId) { window.logEvent("login", {}); }
        if (evt === "SIGNED_OUT") { /* cikis: sayfa genelde yenilenir */ }
        flush();
      });
    } catch (e) {}
  }

  if (document.readyState !== "loading") whenReady(init);
  else document.addEventListener("DOMContentLoaded", function () { whenReady(init); });
})();
