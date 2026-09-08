/* gri-plan.js — "Bugünün Planı" + sınav geri sayımı.
   Öğrenciye tek bir soruya yanıt verir: "Bugün ne yapmalıyım?"
   - Hedef sınav + tarih öğrencinin kendi seçimi (localStorage 'gri-plan').
   - Uydurma performans verisi YOK. Yeterli veri yoksa mantıklı bir ilk-adım önerir.
   - Tek net birincil öneri; ikincil aksiyonlar sessiz. Değiştir/ertele/kapat serbest.
   - Sakin, öğretmen dili; baskı/şu kadar gün kaldı-panik yok.
   DB gerektirmez; ileride hesap-senkronu eklenebilir. */
(function () {
  'use strict';
  if (window.GriPlan) return;
  var KEY = 'gri-plan';
  var EXAMS = [
    { v: 'sat', label: 'Digital SAT' }, { v: 'ielts', label: 'IELTS' },
    { v: 'toefl', label: 'TOEFL' }, { v: 'ydt', label: 'YDT (YKS)' },
    { v: 'yds', label: 'YDS / YÖKDİL' }, { v: 'ib', label: 'IB English' },
    { v: 'udsp', label: 'UDSP' }, { v: 'genel', label: 'Genel İngilizce' }
  ];
  // Sınav başına anlamlı çalışma yolları (uydurma veri değil, gerçek sayfalar)
  var PATHS = {
    sat:   [['konu-anlatimi','Bir SAT konusunu çalış'],['soru-bankasi','Açıklamalı SAT sorusu çöz'],['sat-deneme','Bir bölüm denemesi yap'],['gri-hata-avi','Hata avıyla ısın']],
    ielts: [['konu-ielts-writing-task2','IELTS Writing Task 2 çalış'],['yazi-pratigi','Bir writing taslağı yaz'],['ielts-deneme','IELTS bölüm denemesi'],['soru-bankasi','IELTS sorusu çöz']],
    toefl: [['konu-anlatimi','Bir TOEFL konusunu çalış'],['soru-bankasi','TOEFL sorusu çöz'],['yazi-pratigi','TOEFL writing pratiği'],['toefl-deneme','TOEFL denemesi']],
    ydt:   [['konu-anlatimi','Bir YDT konusunu çalış'],['soru-bankasi','YDT sorusu çöz'],['kelime-bankasi','Kelime tekrarı yap'],['gri-hata-avi','Hata avı turu']],
    yds:   [['konu-anlatimi','Bir YDS konusunu çalış'],['soru-bankasi','YDS sorusu çöz'],['kelime-bankasi','Akademik kelime tekrarı'],['yds-deneme','YDS denemesi']],
    ib:    [['konu-ib-genel-bakis','IB konusunu çalış'],['yazi-pratigi','IB writing pratiği'],['soru-bankasi','Soru çöz'],['gri-hata-avi','Hata avı turu']],
    udsp:  [['udsp-ogren','UDSP konusunu çalış'],['udsp-soru-bankasi','UDSP sorusu çöz'],['kelime-bankasi','Kelime tekrarı'],['gri-hata-avi','Hata avı turu']],
    genel: [['ogrenme-haritasi','Seviyene uygun modülü aç'],['kelime-bankasi','Kelime tekrarı yap'],['soru-bankasi','Soru çöz'],['gri-hata-avi','Hata avı turu']]
  };

  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || null; } catch (e) { return null; } }
  function save(o) { try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) {} }
  function daysLeft(dateStr) {
    if (!dateStr) return null;
    var d = new Date(dateStr + 'T00:00:00'); if (isNaN(d)) return null;
    var now = new Date(); now.setHours(0, 0, 0, 0);
    return Math.round((d - now) / 86400000);
  }
  function examLabel(v) { for (var i = 0; i < EXAMS.length; i++) if (EXAMS[i].v === v) return EXAMS[i].label; return 'sınavın'; }
  function dayIndex() { var n = new Date(); return (n.getFullYear() * 372 + n.getMonth() * 31 + n.getDate()); }

  function ensureStyle() {
    if (document.getElementById('gri-plan-css')) return;
    var s = document.createElement('style'); s.id = 'gri-plan-css';
    s.textContent =
      '.griplan{background:var(--bg-card,#FBF6EC);border:1px solid var(--line,#E3D8C3);border-radius:16px;box-shadow:var(--shadow-sm,0 1px 2px rgba(44,42,38,.05));padding:1.1rem 1.2rem;font-family:var(--font-ui,Inter,system-ui,sans-serif)}' +
      '.griplan-top{display:flex;align-items:center;justify-content:space-between;gap:.6rem;margin-bottom:.6rem}' +
      '.griplan-eyebrow{font-size:.7rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--gold,#B78A2E)}' +
      '.griplan-count{font-size:.8rem;color:var(--text-soft,#6E6353);font-weight:600}' +
      '.griplan-count b{color:var(--teal,#2E6E6A)}' +
      '.griplan-primary{display:flex;align-items:center;gap:.7rem;background:var(--teal-soft,rgba(46,110,106,.12));border:1px solid color-mix(in srgb,var(--teal,#2E6E6A) 25%,transparent);border-radius:12px;padding:.75rem .9rem;text-decoration:none;color:inherit;transition:transform .12s,box-shadow .12s}' +
      '.griplan-primary:hover{transform:translateY(-2px);box-shadow:var(--shadow-sm,0 1px 2px rgba(44,42,38,.05))}' +
      '.griplan-primary .ic{width:34px;height:34px;border-radius:9px;background:var(--teal,#2E6E6A);color:#fff;display:flex;align-items:center;justify-content:center;flex:none;font-size:1.05rem}' +
      '.griplan-primary .t b{display:block;font-size:.97rem;color:var(--text,#241E17)}' +
      '.griplan-primary .t span{font-size:.8rem;color:var(--text-soft,#6E6353)}' +
      '.griplan-primary .arw{margin-left:auto;color:var(--teal,#2E6E6A);font-weight:700}' +
      '.griplan-secs{display:flex;gap:.4rem;flex-wrap:wrap;margin-top:.6rem}' +
      '.griplan-sec{font-size:.8rem;color:var(--text-soft,#6E6353);text-decoration:none;border:1px solid var(--line,#E3D8C3);border-radius:999px;padding:.3rem .7rem;transition:border-color .12s,color .12s}' +
      '.griplan-sec:hover{border-color:var(--teal,#2E6E6A);color:var(--teal,#2E6E6A)}' +
      '.griplan-foot{display:flex;gap:.8rem;margin-top:.7rem}' +
      '.griplan-link{background:none;border:none;padding:0;font:inherit;font-size:.78rem;color:var(--text-muted,#8B7F6B);cursor:pointer;text-decoration:underline;text-underline-offset:2px}' +
      '.griplan-link:hover{color:var(--teal,#2E6E6A)}' +
      '.griplan-setup label{display:block;font-size:.82rem;color:var(--text-soft,#6E6353);margin:.5rem 0 .25rem}' +
      '.griplan-setup select,.griplan-setup input{width:100%;font:inherit;font-size:.95rem;padding:.55rem .7rem;border:1px solid var(--line,#E3D8C3);border-radius:10px;background:var(--bg-soft,#F4EFE3);color:var(--text,#241E17)}' +
      '.griplan-setup .row{display:flex;gap:.6rem}.griplan-setup .row>div{flex:1}' +
      '.griplan-btn{margin-top:.8rem;font:inherit;font-weight:700;font-size:.9rem;background:var(--teal,#2E6E6A);color:#fff;border:none;border-radius:10px;padding:.6rem 1.1rem;cursor:pointer}' +
      '.griplan-btn:hover{background:var(--teal-deep,#123C39)}' +
      '.griplan h3{font-family:var(--font-display,Georgia,serif);font-size:1.15rem;margin:0 0 .2rem;color:var(--text,#241E17)}' +
      '.griplan p.sub{font-size:.86rem;color:var(--text-soft,#6E6353);margin:0}';
    document.head.appendChild(s);
  }

  function recommend(plan) {
    var paths = PATHS[plan.exam] || PATHS.genel;
    var dl = daysLeft(plan.date);
    var idx;
    // Basit, dürüst mantık: sınav çok yakınsa deneme/tekrar; uzaksa konu; her gün döner.
    if (dl != null && dl <= 10) idx = 2;           // yakın → deneme
    else if (dl != null && dl <= 30) idx = 1;      // orta → soru çöz
    else idx = dayIndex() % 2;                      // uzak/serbest → konu/soru arası döner (çekirdek çalışma)
    if (idx >= paths.length) idx = 0;
    var primary = paths[idx];
    var secs = paths.filter(function (p, i) { return i !== idx; }).slice(0, 2);
    return { primary: primary, secs: secs, dl: dl };
  }

  function render(el, plan) {
    ensureStyle();
    if (!plan || !plan.exam) { renderSetup(el, plan); return; }
    var r = recommend(plan);
    var countHtml = '';
    if (r.dl != null) {
      if (r.dl > 0) countHtml = examLabel(plan.exam) + '\'a <b>' + r.dl + ' gün</b>';
      else if (r.dl === 0) countHtml = examLabel(plan.exam) + ' <b>bugün</b> — başarılar';
      else countHtml = examLabel(plan.exam) + ' · hedef tarih geçti';
    } else { countHtml = 'Hedef: <b>' + examLabel(plan.exam) + '</b>'; }
    var html =
      '<div class="griplan-top"><span class="griplan-eyebrow">Bugünün Planı</span><span class="griplan-count">' + countHtml + '</span></div>' +
      '<a class="griplan-primary" href="' + r.primary[0] + '">' +
        '<span class="ic">▶</span><span class="t"><b>' + esc(r.primary[1]) + '</b><span>Önerilen ilk adım</span></span><span class="arw">→</span></a>' +
      (r.secs.length ? '<div class="griplan-secs">' + r.secs.map(function (p) { return '<a class="griplan-sec" href="' + p[0] + '">' + esc(p[1]) + '</a>'; }).join('') + '</div>' : '') +
      '<div class="griplan-foot"><button type="button" class="griplan-link" data-act="change">Hedefi değiştir</button><button type="button" class="griplan-link" data-act="other">Bugün başka bir şey</button></div>';
    el.className = 'griplan'; el.innerHTML = html;
    el.querySelector('[data-act="change"]').addEventListener('click', function () { renderSetup(el, plan); });
    el.querySelector('[data-act="other"]').addEventListener('click', function () {
      if (window.GriChooser) window.GriChooser.open();
      else window.location.href = 'ogrenme-haritasi';
    });
  }

  function renderSetup(el, plan) {
    ensureStyle();
    plan = plan || {};
    var opts = EXAMS.map(function (e) { return '<option value="' + e.v + '"' + (plan.exam === e.v ? ' selected' : '') + '>' + e.label + '</option>'; }).join('');
    el.className = 'griplan griplan-setup';
    el.innerHTML =
      '<h3>Hedefini belirle</h3><p class="sub">Sınavını ve (varsa) tarihini seç — sana her gün tek bir öneri getirelim.</p>' +
      '<div class="row" style="margin-top:.6rem"><div><label for="gpExam">Sınav</label><select id="gpExam">' + opts + '</select></div>' +
      '<div><label for="gpDate">Tarih (opsiyonel)</label><input type="date" id="gpDate" value="' + (plan.date || '') + '"></div></div>' +
      '<button type="button" class="griplan-btn" id="gpSave">Planı oluştur</button>';
    el.querySelector('#gpSave').addEventListener('click', function () {
      var np = { exam: el.querySelector('#gpExam').value, date: el.querySelector('#gpDate').value || '' };
      save(np); render(el, np);
    });
  }

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  window.GriPlan = {
    mount: function (target) {
      var el = typeof target === 'string' ? document.querySelector(target) : target;
      if (!el) return;
      render(el, load());
    },
    get: load, set: function (p) { save(p); }
  };
})();
