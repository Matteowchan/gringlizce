/* Gri Review — öğretmen inceleme modu.
   Öğren/drill sayfasına ?review=<student_id>&assignment=<assignment_id> ile gelince,
   öğrencinin çözdüğü soruları (assignment_student_detail RPC) çekip her soruyu
   ✓ doğru / ✗ yanlış işaretler ve öğrencinin seçtiği şıkkı vurgular. Salt-görsel. */
(function () {
  var q = new URLSearchParams(location.search);
  var sid = q.get('review');
  var aid = q.get('assignment');
  if (!sid || !aid) return;

  var answers = null; // slug -> {ok, chosen}

  function injectCss() {
    if (document.getElementById('gr-review-css')) return;
    var s = document.createElement('style'); s.id = 'gr-review-css';
    s.textContent =
      '.gr-review-banner{position:sticky;top:0;left:0;right:0;z-index:9998;background:#2C5856;color:#fff;text-align:center;padding:8px 12px;font-family:Inter,system-ui,sans-serif;font-size:13px;font-weight:600;box-shadow:0 2px 8px rgba(0,0,0,.15)}'
      + '.gr-reviewed{position:relative}'
      + '.gr-reviewed.gr-ok{box-shadow:0 0 0 2px #2e8b57 inset;border-radius:10px}'
      + '.gr-reviewed.gr-no{box-shadow:0 0 0 2px #c0453b inset;border-radius:10px}'
      + '.gr-badge{position:absolute;top:8px;right:10px;font-family:Inter,system-ui,sans-serif;font-size:11px;font-weight:700;padding:3px 9px;border-radius:999px;z-index:3}'
      + '.gr-badge.ok{background:#2e8b57;color:#fff}.gr-badge.no{background:#c0453b;color:#fff}'
      + '.gr-chosen{outline:2px solid #c89a3c !important;outline-offset:1px;border-radius:8px}'
      + '.gr-chosen::after{content:"öğrencinin cevabı";position:absolute;font-size:9px;color:#8a6a22;margin-left:8px}';
    document.head.appendChild(s);
  }

  function loadAnswers(cb, tries) {
    tries = tries || 0;
    var sb = window.GRI_SB || window.griTrackSB || (window.supabase && window.GRI_SB);
    if (!sb || !sb.rpc) {
      if (tries > 40) return; // ~12sn
      return setTimeout(function () { loadAnswers(cb, tries + 1); }, 300);
    }
    sb.rpc('assignment_student_detail', { p_assignment_id: aid, p_student_id: sid }).then(function (r) {
      if (r.error || !r.data || r.data.error) return;
      var m = {};
      (r.data.items || []).forEach(function (it) { if (it.slug) m[it.slug] = { ok: !!it.is_correct, chosen: it.chosen }; });
      answers = m; cb();
    }).catch(function () {});
  }

  function mark() {
    if (!answers) return;
    var nodes = document.querySelectorAll('.mcq[data-slug], .qz[data-slug], [data-bm-slug]');
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      if (el.getAttribute('data-gr-done')) continue;
      var slug = el.getAttribute('data-slug') || el.getAttribute('data-bm-slug');
      var a = answers[slug];
      if (!a) continue;
      el.setAttribute('data-gr-done', '1');
      el.classList.add('gr-reviewed', a.ok ? 'gr-ok' : 'gr-no');
      var badge = document.createElement('div');
      badge.className = 'gr-badge ' + (a.ok ? 'ok' : 'no');
      badge.textContent = a.ok ? '✓ Doğru' : '✗ Yanlış';
      el.appendChild(badge);
      if (a.chosen) {
        var lab = el.querySelector('label[data-k="' + a.chosen + '"]');
        if (lab) lab.classList.add('gr-chosen');
      }
    }
  }

  function banner() {
    if (document.getElementById('gr-review-banner')) return;
    var b = document.createElement('div'); b.id = 'gr-review-banner'; b.className = 'gr-review-banner';
    b.textContent = 'İnceleme modu — öğrencinin doğru/yanlış cevapları işaretli (' + (answers ? Object.keys(answers).length : 0) + ' soru)';
    document.body.insertBefore(b, document.body.firstChild);
  }

  function start() {
    injectCss();
    loadAnswers(function () {
      banner(); mark();
      try {
        var mo = new MutationObserver(function () { mark(); });
        mo.observe(document.body, { childList: true, subtree: true });
      } catch (e) {}
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
