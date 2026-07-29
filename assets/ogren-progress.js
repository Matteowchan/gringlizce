/* Gri öğren modülü ilerleme takibi (SPA modülleri: toefl/yds/ydt/udsp/ielts-ogren...).
   Öğrenci bir dersi görüntüleyince veya ders quiz'ini çözünce module_progress'e yazar.
   Ödev tarafı (list_my_assignments, kind='ogren_spa') bu satırları sayar.
   Sayfaların inline motoruna dokunmaz; window.GRI_SB + window.GRI_UID kullanır. */
(function () {
  var MODULE = (location.pathname.split('/').pop() || '').replace(/\.html$/i, '').toLowerCase();
  if (!MODULE || MODULE.indexOf('ogren') < 0) return; // yalnızca öğren modülü sayfaları

  // Sayfanın inline verisinden geçerli ders id'lerini topla (varsa)
  var VALID = null;
  try {
    var dataEl = document.getElementById('data');
    if (dataEl && dataEl.type === 'application/json') {
      var d = JSON.parse(dataEl.textContent || '{}');
      var lessons = d.lessons || (d.units ? [] : []);
      if (Array.isArray(lessons) && lessons.length) {
        VALID = {};
        lessons.forEach(function (l) { if (l && l.id) VALID[String(l.id)] = 1; });
      }
    }
  } catch (e) { VALID = null; }

  var written = {};              // aynı derse tekrar tekrar yazma
  var pending = null;

  function currentLesson() {
    var h = (location.hash || '').replace(/^#/, '').trim();
    if (!h) return '';
    if (VALID && !VALID[h]) return ''; // bilinmeyen hash'i yazma
    return h;
  }

  function mark(lesson) {
    if (!lesson) return;
    var uid = window.GRI_UID, sb = window.GRI_SB;
    if (!uid || !sb) { pending = lesson; return; } // client hazır değil, sonra dene
    var key = lesson;
    var now = Date.now();
    // Aynı dersi 60 sn içinde tekrar yazma (updated_at güncellemesi için 60sn'de bir yeter)
    if (written[key] && (now - written[key]) < 60000) return;
    written[key] = now;
    try {
      sb.from('module_progress').upsert(
        { user_id: uid, module: MODULE, lesson: lesson, updated_at: new Date().toISOString() },
        { onConflict: 'user_id,module,lesson' }
      ).then(function () {}, function () {});
    } catch (e) {}
  }

  function tick() { mark(currentLesson()); }

  // Client geç yüklenebilir; birkaç kez dene
  var tries = 0;
  var iv = setInterval(function () {
    tries++;
    if (window.GRI_SB && window.GRI_UID) {
      clearInterval(iv);
      if (pending) { var p = pending; pending = null; mark(p); }
      tick();
    } else if (tries > 40) { clearInterval(iv); } // ~20sn sonra vazgeç
  }, 500);

  window.addEventListener('hashchange', tick);
  // Ders quiz'i çözülünce (güçlü sinyal) da işaretle
  document.addEventListener('click', function (e) {
    var t = e.target;
    if (t && (t.closest && (t.closest('.mcheck') || t.closest('.mcq')))) {
      setTimeout(tick, 50);
    }
  }, true);
  if (document.readyState !== 'loading') tick();
  else document.addEventListener('DOMContentLoaded', tick);
})();
