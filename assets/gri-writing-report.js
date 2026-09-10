/* gri-writing-report.js — "Yazma Ödev Raporu" (Writing Slice 6)
   Bir yazma değerlendirmesinden görsel, dürüst bir rapor üretir: rubric profili
   (radar), geri bildirim odağı (donut), resmî-olmayan CEFR tahmini (net uyarıyla),
   "neler yapabiliyor" + en fazla 3 gelişim hedefi, Gri geri bildirimi ve öğretmen
   notu AYRI. IELTS/TOEFL/IB puanı + CEFR tahmini + öğretmen değerlendirmesi
   karıştırılmaz — her biri kendi etiketiyle. gri-chart.js'e bağımlı.
   API: GriWritingReport.fromEvaluation(evaluation, opts) -> data;
        GriWritingReport.render(data) -> html. */
(function () {
  'use strict';
  if (window.GriWritingReport) return;

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function num(v) { var n = parseFloat(v); return isFinite(n) ? n : 0; }

  // IELTS band → CEFR (kaba, resmî değil)
  function cefrFromBand(band) {
    band = num(band);
    if (band >= 8.5) return 'C2';
    if (band >= 7) return 'C1';
    if (band >= 5.5) return 'B2';
    if (band >= 4) return 'B1';
    return 'A2';
  }
  function cefrFromPct(pct) {
    if (pct >= 90) return 'C2';
    if (pct >= 75) return 'C1';
    if (pct >= 55) return 'B2';
    if (pct >= 40) return 'B1';
    return 'A2';
  }

  var MISTAKE_LABEL = { grammar: 'Dilbilgisi', convention: 'Yazım / Noktalama', tone: 'Register / Ton', upgrade: 'Kelime geliştirme', vocabulary: 'Kelime', mechanics: 'Yazım / Noktalama' };

  // gri-evaluate-writing çıktısını normalize et
  function fromEvaluation(ev, opts) {
    opts = opts || {};
    ev = ev || {};
    var data = { status: opts.status || 'ai', exam: opts.exam || '', textType: opts.textType || '', level: opts.level || '' };
    // rubric
    var scores = ev.scores || {};
    var crit = [];
    Object.keys(scores).forEach(function (k) {
      crit.push({ label: opts.labels && opts.labels[k] ? opts.labels[k] : prettyKey(k), score: num(scores[k]) });
    });
    var max = num(opts.criterionMax) || (opts.exam === 'ielts' ? 9 : 0);
    if (!max) { crit.forEach(function (c) { if (c.score > max) max = c.score; }); max = max <= 9 ? 9 : max; }
    data.rubric = { criteria: crit, max: max };
    // overall band
    var total = num(opts.totalScore != null ? opts.totalScore : (crit.length ? crit.reduce(function (a, c) { return a + c.score; }, 0) / crit.length : 0));
    var totMax = num(opts.totalMax) || max;
    data.band = { score: total, max: totMax };
    // CEFR
    data.cefr = opts.exam === 'ielts' ? cefrFromBand(total) : cefrFromPct(totMax > 0 ? total / totMax * 100 : 0);
    // feedback focus (mistake type counts)
    var focus = {};
    (ev.specificMistakes || []).forEach(function (m) { var t = (m && m.type) || 'other'; focus[t] = (focus[t] || 0) + 1; });
    data.focus = Object.keys(focus).map(function (k) { return { label: MISTAKE_LABEL[k] || prettyKey(k), n: focus[k] }; });
    // comments
    data.aiComment = ev.overallComment || '';
    data.goals = splitGoals(ev.improvementAdvice);
    data.canDo = opts.canDo || deriveCanDo(data.cefr);
    data.teacherNote = opts.teacherNote || '';
    return data;
  }

  function prettyKey(k) { return String(k || '').replace(/[-_]/g, ' ').replace(/\b\w/g, function (c) { return c.toUpperCase(); }); }
  function splitGoals(adv) {
    if (!adv) return [];
    if (Array.isArray(adv)) return adv.slice(0, 3);
    var s = String(adv).split(/\n+|(?:^|\s)\d[\).]\s|•|;/).map(function (x) { return x.trim(); }).filter(function (x) { return x.length > 4; });
    return s.slice(0, 3);
  }
  function deriveCanDo(cefr) {
    var m = { A2: 'Basit bağlaçlarla kısa, bağlantılı metinler yazabiliyor.', B1: 'Tanıdık konularda bağlantılı, anlaşılır metinler üretebiliyor.', B2: 'Net, ayrıntılı metinler yazıp görüş gerekçelendirebiliyor.', C1: 'Karmaşık konuları iyi yapılandırılmış, akıcı metinlerle işleyebiliyor.', C2: 'Konuyu esnek ve etkili biçimde, ince nüanslarla yazabiliyor.' };
    return m[cefr] || '';
  }

  function ensureStyle() {
    if (document.getElementById('gri-wr-css')) return;
    var s = document.createElement('style'); s.id = 'gri-wr-css';
    s.textContent =
      '.gwr{font-family:var(--font-ui,Inter,system-ui,sans-serif);color:var(--text,#241E17)}' +
      '.gwr-head{display:flex;align-items:center;flex-wrap:wrap;gap:.6rem;margin-bottom:1rem}' +
      '.gwr-head h2{font-family:var(--font-display,Georgia,serif);font-size:1.4rem;margin:0}' +
      '.gwr-badge{font-size:.72rem;font-weight:700;letter-spacing:.04em;border-radius:999px;padding:.2rem .6rem}' +
      '.gwr-badge.ai{background:var(--teal-soft,rgba(46,110,106,.14));color:var(--teal-deep,#123C39)}' +
      '.gwr-badge.teacher{background:var(--gold-soft,rgba(183,138,46,.15));color:var(--gold-deep,#8A6A22)}' +
      '.gwr-badge.final{background:var(--correct-soft,rgba(44,110,73,.13));color:var(--correct,#2C6E49)}' +
      '.gwr-grid{display:grid;grid-template-columns:1fr 1fr;gap:1.1rem;margin-bottom:1.1rem}' +
      '@media(max-width:640px){.gwr-grid{grid-template-columns:1fr}}' +
      '.gwr-card{background:var(--bg-card,#FBF6EC);border:1px solid var(--line,#E3D8C3);border-radius:14px;padding:1rem 1.1rem}' +
      '.gwr-card h3{font-family:var(--font-ui,Inter),sans-serif;font-size:.78rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--text-muted,#8B7F6B);margin:0 0 .7rem}' +
      '.gwr-band{display:flex;align-items:baseline;gap:.4rem;margin:.2rem 0 .3rem}' +
      '.gwr-band .n{font-family:var(--font-display,Georgia,serif);font-size:2.4rem;font-weight:700;line-height:1}' +
      '.gwr-band .d{font-size:1.1rem;color:var(--text-muted,#8B7F6B)}' +
      '.gwr-cefr{display:flex;align-items:center;gap:.7rem}' +
      '.gwr-cefr .lvl{font-family:var(--font-display,Georgia,serif);font-size:1.9rem;font-weight:700;color:var(--teal,#2E6E6A)}' +
      '.gwr-caveat{font-size:.78rem;color:var(--text-muted,#8B7F6B);line-height:1.5;margin:.5rem 0 0;font-style:italic}' +
      '.gwr-cando{font-size:.95rem;line-height:1.6;color:var(--text,#241E17);margin:0}' +
      '.gwr-goals{margin:.6rem 0 0;padding:0;list-style:none;display:flex;flex-direction:column;gap:.4rem}' +
      '.gwr-goals li{display:flex;gap:.55rem;align-items:flex-start;font-size:.92rem;line-height:1.5}' +
      '.gwr-goals .gn{flex:none;width:20px;height:20px;border-radius:50%;background:var(--gold,#B78A2E);color:#fff;font-size:.72rem;font-weight:700;display:flex;align-items:center;justify-content:center;margin-top:2px}' +
      '.gwr-fb{border-left:3px solid var(--teal,#2E6E6A);padding:.2rem 0 .2rem 0}' +
      '.gwr-fb.teacher{border-left-color:var(--gold,#B78A2E)}' +
      '.gwr-fb h3{margin-bottom:.4rem}' +
      '.gwr-fb p{font-size:.95rem;line-height:1.65;margin:0;color:var(--text,#241E17)}' +
      '.gwr-soon{font-size:.82rem;color:var(--text-muted,#8B7F6B);background:var(--bg-soft,#F4EFE3);border:1px dashed var(--line,#E3D8C3);border-radius:10px;padding:.7rem .85rem;margin:0}';
    document.head.appendChild(s);
  }

  function statusBadge(st) {
    var m = { ai: ['ai', 'Gri değerlendirdi'], teacher: ['teacher', 'Öğretmen kontrol etti'], final: ['final', 'Final teslim'] };
    var x = m[st] || m.ai;
    return '<span class="gwr-badge ' + x[0] + '">' + x[1] + '</span>';
  }

  function render(data) {
    if (!data) return '';
    ensureStyle();
    var C = (window.GriChart) ? window.GriChart : null;
    // rubric radar
    var rubricHtml = '';
    if (data.rubric && data.rubric.criteria && data.rubric.criteria.length >= 3 && C) {
      rubricHtml = C.render({ type: 'radar', axes: undefined, categories: data.rubric.criteria.map(function (c) { return c.label; }), series: [{ values: data.rubric.criteria.map(function (c) { return c.score; }) }], max: data.rubric.max });
    } else if (data.rubric && data.rubric.criteria && data.rubric.criteria.length && C) {
      rubricHtml = C.render({ type: 'bar', categories: data.rubric.criteria.map(function (c) { return c.label; }), series: [{ values: data.rubric.criteria.map(function (c) { return c.score; }) }] });
    }
    // focus donut
    var focusHtml = '';
    if (data.focus && data.focus.length && C) {
      focusHtml = C.render({ type: 'donut', categories: data.focus.map(function (f) { return f.label; }), series: [{ values: data.focus.map(function (f) { return f.n; }) }] });
    } else {
      focusHtml = '<p class="gwr-caveat">Belirgin bir hata yoğunluğu işaretlenmedi.</p>';
    }
    var scoreLbl = data.exam === 'ielts' ? 'IELTS bandı' : data.exam === 'toefl' ? 'TOEFL puanı' : data.exam === 'ib' ? 'IB puanı' : 'Puan';
    var h = '<div class="gwr">';
    h += '<div class="gwr-head"><h2>Yazma Raporu</h2>' + statusBadge(data.status) +
      (data.exam ? '<span class="gwr-badge ai" style="background:var(--bg-soft,#F4EFE3);color:var(--text-soft,#6E6353)">' + esc((data.exam || '').toUpperCase() + (data.textType ? ' · ' + data.textType : '')) + '</span>' : '') + '</div>';

    h += '<div class="gwr-grid">';
    // rubric card
    h += '<div class="gwr-card"><h3>Rubric profili</h3>' +
      '<div class="gwr-band"><span class="n">' + (Math.round(num(data.band.score) * 10) / 10) + '</span><span class="d">/ ' + (data.band.max || '') + ' · ' + esc(scoreLbl) + '</span></div>' +
      rubricHtml + '</div>';
    // CEFR card
    h += '<div class="gwr-card"><h3>Resmî olmayan Writing profili tahmini</h3>' +
      '<div class="gwr-cefr"><span class="lvl">' + esc(data.cefr || '—') + '</span><span style="font-size:.9rem;color:var(--text-soft,#6E6353)">tahmini CEFR düzeyi</span></div>' +
      '<p class="gwr-caveat">Bu tek bir yazıya dayalı bir tahmindir, kesin bir seviye değildir. Birden çok görevdeki tutarlı performansla anlamlı bir profil oluşur. Bu tahmin, sınav puanı ve öğretmen değerlendirmesinden ayrıdır.</p></div>';
    h += '</div>';

    // can-do + goals
    h += '<div class="gwr-grid">';
    h += '<div class="gwr-card"><h3>Bu öğrenci neler yapabiliyor?</h3><p class="gwr-cando">' + esc(data.canDo || '—') + '</p></div>';
    h += '<div class="gwr-card"><h3>Sonraki yazı için hedefler</h3>' +
      (data.goals && data.goals.length ? '<ul class="gwr-goals">' + data.goals.slice(0, 3).map(function (g, i) { return '<li><span class="gn">' + (i + 1) + '</span><span>' + esc(g) + '</span></li>'; }).join('') + '</ul>' : '<p class="gwr-caveat">Bu yazı için ayrı bir gelişim hedefi belirtilmedi.</p>') + '</div>';
    h += '</div>';

    // feedback focus donut
    h += '<div class="gwr-card" style="margin-bottom:1.1rem"><h3>Geri bildirim odağı</h3>' + focusHtml + '</div>';

    // Gri feedback (ayrı)
    if (data.aiComment) h += '<div class="gwr-card gwr-fb" style="margin-bottom:1.1rem"><h3>Gri\'nin Geri Bildirimi</h3><p>' + esc(data.aiComment) + '</p></div>';
    // Teacher note (ayrı)
    if (data.teacherNote) h += '<div class="gwr-card gwr-fb teacher" style="margin-bottom:1.1rem"><h3>Öğretmen Notu</h3><p>' + esc(data.teacherNote) + '</p></div>';

    // keyword report + önce/sonra → sonraki slice'lar
    h += '<p class="gwr-soon">Anahtar kelime / hedef-dil raporu ve ilk–final taslak karşılaştırması sonraki adımlarda bu rapora eklenecek.</p>';
    h += '</div>';
    return h;
  }

  window.GriWritingReport = { render: render, fromEvaluation: fromEvaluation, cefrFromBand: cefrFromBand };
})();
