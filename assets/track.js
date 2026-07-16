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
