/* Gri — Öğrenci Sınav Analizi (paylaşılan modül)
   Kullanım:
     GriAnalysis.mount({ sb, container, userId, onAssign })
   - sb: supabase client
   - container: DOM elemanı (içi doldurulur)
   - userId: analiz edilecek öğrencinin uuid'i
   - onAssign(exam, category, categoryLabel): opsiyonel. Verilirse zayıf konu satırında
     "+ Ödev" butonu çıkar; tıklanınca bu callback çağrılır (öğretmen: ödev modalı).
   Yetki RPC tarafında (admin VEYA öğrencinin öğretmeni) kontrol edilir.
*/
(function () {
  if (window.GriAnalysis) return;

  var EXAM_META = { sat: { label: 'SAT' }, yds: { label: 'YDS' }, ydt: { label: 'YDT' }, udsp: { label: 'ÜDS / YÖKDİL' }, toefl: { label: 'TOEFL' }, ielts: { label: 'IELTS (Deneme)' }, vocab: { label: 'Kelime Bilgisi' } };
  var SECTION_LABEL = { reading: 'Reading', listening: 'Listening', writing: 'Writing', speaking: 'Speaking', genel: 'Genel' };
  function num1(x) { var n = parseFloat(x); return isNaN(n) ? null : n; }
  var SAT_MATH_CATS = { advanced_math: 1, algebra: 1, geometry_and_trigonometry: 1, problem_solving_and_data_analysis: 1 };
  var CAT_LABELS = {
    information_and_ideas: 'Information & Ideas', craft_and_structure: 'Craft & Structure',
    standard_english_conventions: 'Standard English Conventions', expression_of_ideas: 'Expression of Ideas',
    'reading-writing': 'Reading & Writing', advanced_math: 'Advanced Math', algebra: 'Algebra',
    geometry_and_trigonometry: 'Geometry & Trigonometry', problem_solving_and_data_analysis: 'Problem Solving & Data Analysis'
  };

  var CSS = ''
    + '.ga{font-family:inherit;color:var(--text,#1a2230);}'
    + '.ga-head{margin-bottom:0.7rem;}'
    + '.ga-exam{width:100%;max-width:340px;font:inherit;padding:8px 11px;border:1px solid var(--line,#e6ddca);border-radius:9px;background:var(--bg-card,#fff);color:var(--text,#1a2230);}'
    + '.ga-empty{color:var(--text-muted,#6b6862);font-style:italic;padding:0.6rem 0;}'
    + '.ga-cards{display:flex;gap:0.6rem;flex-wrap:wrap;margin-bottom:0.7rem;}'
    + '.ga-card{flex:1;min-width:118px;background:var(--bg-card,#fff);color:var(--text,#1a2230);border:1px solid var(--line,#e6ddca);border-radius:10px;padding:0.7rem 0.9rem;}'
    + '.ga-card.primary{background:var(--teal,#2C5856);color:#fff;border-color:transparent;}'
    + '.ga-card .l{font-size:0.7rem;letter-spacing:0.05em;text-transform:uppercase;opacity:0.75;}'
    + '.ga-card .v{font-family:var(--font-display,Georgia),serif;font-size:1.5rem;font-weight:600;line-height:1.2;}'
    + '.ga-card .v small{font-size:0.8rem;opacity:0.7;}'
    + '.ga-card .s{font-size:0.7rem;opacity:0.7;}'
    + '.ga-note{font-size:0.78rem;color:var(--text-muted,#6b6862);margin:0 0 0.8rem;}'
    + '.ga-goal{display:flex;align-items:center;gap:0.6rem;flex-wrap:wrap;padding:0.6rem 0.8rem;border:1px solid var(--line,#e6ddca);border-radius:9px;margin-bottom:0.9rem;font-size:0.86rem;background:var(--bg-card,#fff);}'
    + '.ga-goal b{font-family:var(--font-display,Georgia),serif;}'
    + '.ga-grp{font-size:0.72rem;letter-spacing:0.08em;text-transform:uppercase;color:var(--text-muted,#6b6862);margin:0.7rem 0 0.4rem;}'
    + '.ga-2col{display:grid;grid-template-columns:1fr 1fr;gap:0.9rem;margin-bottom:0.4rem;}'
    + '@media(max-width:520px){.ga-2col{grid-template-columns:1fr;}}'
    + '.ga-row{display:flex;align-items:center;gap:0.55rem;padding:0.22rem 0;font-size:0.82rem;}'
    + '.ga-row .n{flex:0 0 42%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}'
    + '.ga-bar{flex:1;height:7px;background:var(--line,#e6ddca);border-radius:4px;overflow:hidden;min-width:44px;}'
    + '.ga-bar > span{display:block;height:100%;}'
    + '.ga-row .p{min-width:5rem;text-align:right;color:var(--text-muted,#6b6862);}'
    + '.ga-assign{flex:0 0 auto;border:1px solid var(--teal,#2C5856);background:transparent;color:var(--teal,#2C5856);border-radius:7px;padding:2px 8px;font:inherit;font-size:0.72rem;font-weight:600;cursor:pointer;white-space:nowrap;}'
    + '.ga-assign:hover{background:var(--teal,#2C5856);color:#fff;}'
    + '.ga-verdict{margin-top:1rem;padding:0.8rem 1rem;background:var(--bg-card,#fff);border:1px solid var(--line,#e6ddca);border-left:3px solid var(--teal,#2C5856);border-radius:8px;font-size:0.86rem;line-height:1.55;}';

  function injectCSS() { if (document.getElementById('ga-css')) return; var s = document.createElement('style'); s.id = 'ga-css'; s.textContent = CSS; document.head.appendChild(s); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function catLabel(c) { return CAT_LABELS[c] || String(c == null ? '' : c).replace(/[-_]/g, ' ').replace(/\b\w/g, function (m) { return m.toUpperCase(); }); }
  function pctOf(n, c) { return n > 0 ? Math.round(100 * c / n) : 0; }
  function accColor(p) { return p >= 75 ? '#1FA971' : (p >= 50 ? '#B78A2E' : '#c0392b'); }
  function satScore(a) { return Math.round((200 + a / 100 * 600) / 10) * 10; }
  function goalNum(g) { var n = parseInt(String(g == null ? '' : g).replace(/[^0-9.]/g, ''), 10); return isNaN(n) ? null : n; }
  function bar(p, color) { return '<div class="ga-bar"><span style="width:' + p + '%;background:' + color + ';"></span></div>'; }
  function card(label, val, unit, n, primary) {
    var disp = (val == null) ? '—' : (unit === '%' ? '%' + val : val);
    var sub = (val == null) ? 'veri yok' : (n + ' soru');
    return '<div class="ga-card' + (primary ? ' primary' : '') + '"><div class="l">' + esc(label) + '</div><div class="v">' + disp + (val != null && unit !== '%' ? '<small> ' + unit + '</small>' : '') + '</div><div class="s">' + sub + '</div></div>';
  }
  function catRow(x, assignable, assignLabel) {
    var p = pctOf(x.answered, x.correct);
    var btn = assignable ? '<button class="ga-assign" data-assign-cat="' + esc(x.category) + '" data-assign-label="' + esc(catLabel(x.category)) + '">' + esc(assignLabel || '+ Ödev') + '</button>' : '';
    return '<div class="ga-row"><span class="n">' + esc(catLabel(x.category)) + '</span>' + bar(p, accColor(p)) + '<span class="p">%' + p + ' (' + x.correct + '/' + x.answered + ')</span>' + btn + '</div>';
  }

  function build(exam, d, hasAssign, assignLabel) {
    var total = d.total || 0, correct = d.correct || 0, acc = pctOf(total, correct);
    if (!total) return '<div class="ga-empty">Bu sınavdan veri yok.</div>';
    var conf = total < 15 ? 'düşük' : (total < 40 ? 'orta' : 'iyi');
    var confColor = total < 15 ? '#c0392b' : (total < 40 ? '#B78A2E' : '#1FA971');
    var cats = d.categories || [];
    var html = '';
    var predictedTotal = null, predUnit = '';

    // Skor kartları
    html += '<div class="ga-cards">';
    if (exam === 'sat') {
      var rw = { n: 0, c: 0 }, ma = { n: 0, c: 0 };
      cats.forEach(function (x) { if (SAT_MATH_CATS[x.category]) { ma.n += x.answered; ma.c += x.correct; } else { rw.n += x.answered; rw.c += x.correct; } });
      html += card('R&W', rw.n ? satScore(pctOf(rw.n, rw.c)) : null, '/800', rw.n);
      html += card('Matematik', ma.n ? satScore(pctOf(ma.n, ma.c)) : null, '/800', ma.n);
      if (rw.n && ma.n) { predictedTotal = satScore(pctOf(rw.n, rw.c)) + satScore(pctOf(ma.n, ma.c)); predUnit = '/1600'; html += card('Toplam (tahmini)', predictedTotal, '/1600', rw.n + ma.n, true); }
    } else if (exam === 'toefl') {
      html += card('Doğruluk', acc, '%', total, true);
    } else {
      predictedTotal = acc; predUnit = '/100';
      html += card('Öngörülen', acc, '/100', total, true);
    }
    html += '</div>';
    html += '<div class="ga-note">Tahmini skor, doğruluk oranından hesaplanır. Güven: <b style="color:' + confColor + '">' + conf + '</b> · ' + total + ' soru · %' + acc + ' doğru · ' + (d.active_days || 0) + ' aktif gün</div>';

    // Hedefle karşılaştırma
    var goal = goalNum(d.goal);
    if (goal != null && predictedTotal != null) {
      var gap = goal - predictedTotal;
      var gColor = gap <= 0 ? '#1FA971' : (gap <= (predUnit === '/1600' ? 120 : 12) ? '#B78A2E' : '#c0392b');
      var gapTxt = gap <= 0 ? 'hedefin üzerinde ▲' : ('hedefe ' + gap + ' ' + (predUnit === '/1600' ? 'puan' : '') + ' var');
      html += '<div class="ga-goal">🎯 Hedef: <b>' + esc(String(d.goal)) + '</b>' + predUnit + ' · Tahmini: <b>' + predictedTotal + '</b>' + predUnit + ' · <b style="color:' + gColor + '">' + gapTxt + '</b></div>';
    } else if (d.goal) {
      html += '<div class="ga-goal">🎯 Hedef: <b>' + esc(String(d.goal)) + '</b> <span style="color:var(--text-muted,#6b6862);">(karşılaştırma için yeterli veri yok)</span></div>';
    }

    // Güçlü / Zayıf
    var sig = cats.filter(function (x) { return x.answered >= 3; });
    var pool = sig.length ? sig : cats;
    var byAcc = pool.slice().sort(function (a, b) { return pctOf(b.answered, b.correct) - pctOf(a.answered, a.correct); });
    var strong = byAcc.slice(0, 3);
    var weak = byAcc.slice().reverse().slice(0, 3).filter(function (x) { return pctOf(x.answered, x.correct) < 100; });
    html += '<div class="ga-2col">';
    html += '<div><div class="ga-grp" style="color:#1FA971;">Güçlü Konular</div>' + (strong.length ? strong.map(function (x) { return catRow(x, false); }).join('') : '<div class="ga-empty" style="font-size:0.8rem;">—</div>') + '</div>';
    html += '<div><div class="ga-grp" style="color:#c0392b;">Zayıf Konular</div>' + (weak.length ? weak.map(function (x) { return catRow(x, hasAssign, assignLabel); }).join('') : '<div class="ga-empty" style="font-size:0.8rem;">Belirgin zayıf konu yok.</div>') + '</div>';
    html += '</div>';

    // Tüm kategoriler
    html += '<div class="ga-grp">Kategori Doğruluğu (' + cats.length + ')</div>';
    html += cats.map(function (x) { return catRow(x, false); }).join('');

    // Zorluk
    var diffs = d.difficulties || [];
    if (diffs.length) {
      var order = { easy: 0, medium: 1, hard: 2 }, dl = { easy: 'Kolay', medium: 'Orta', hard: 'Zor' };
      diffs.sort(function (a, b) { return (order[a.difficulty] == null ? 9 : order[a.difficulty]) - (order[b.difficulty] == null ? 9 : order[b.difficulty]); });
      html += '<div class="ga-grp" style="margin-top:0.8rem;">Zorluk Kırılımı</div>';
      html += diffs.map(function (x) { var p = pctOf(x.answered, x.correct); return '<div class="ga-row"><span class="n" style="flex:0 0 3.5rem;">' + (dl[x.difficulty] || x.difficulty) + '</span>' + bar(p, accColor(p)) + '<span class="p">%' + p + ' (' + x.correct + '/' + x.answered + ')</span></div>'; }).join('');
    }

    // Trend
    var h1 = d.half1 || {}, h2 = d.half2 || {};
    if ((h1.answered || 0) >= 4 && (h2.answered || 0) >= 4) {
      var a1 = pctOf(h1.answered, h1.correct), a2 = pctOf(h2.answered, h2.correct), delta = a2 - a1;
      var tl = delta >= 8 ? ('Gelişiyor ▲ +' + delta) : (delta <= -8 ? ('Geriliyor ▼ ' + delta) : 'Stabil');
      var tc = delta >= 8 ? '#1FA971' : (delta <= -8 ? '#c0392b' : 'var(--text-muted,#6b6862)');
      html += '<div class="ga-grp" style="margin-top:0.8rem;">Gelişim Trendi</div><div style="font-size:0.84rem;">İlk yarı %' + a1 + ' → son yarı %' + a2 + ' · <b style="color:' + tc + '">' + tl + '</b></div>';
    }

    // Değerlendirme + öneri
    var meta = EXAM_META[exam] || { label: exam };
    var v = '<b>' + esc(meta.label) + '</b>: ';
    if (conf === 'düşük') v += 'Henüz az soru çözülmüş (' + total + '), değerlendirme sınırlı. ';
    v += 'Genel doğruluk %' + acc + '. ';
    if (strong.length) v += 'En güçlü: ' + esc(catLabel(strong[0].category)) + ' (%' + pctOf(strong[0].answered, strong[0].correct) + '). ';
    if (weak.length) { var w = weak[0]; v += 'En zayıf: <b>' + esc(catLabel(w.category)) + '</b> (%' + pctOf(w.answered, w.correct) + ') — öneri: bu konuya ağırlık verilmeli.'; }
    else v += 'Belirgin zayıf konu yok, dengeli.';
    html += '<div class="ga-verdict">' + v + '</div>';

    return html;
  }

  function bandColor(b) { return b >= 6.5 ? '#1FA971' : (b >= 5 ? '#B78A2E' : '#c0392b'); }
  function buildIelts(d) {
    var att = d.attempts || 0;
    if (!att) return '<div class="ga-empty">IELTS deneme verisi yok.</div>';
    var overall = num1(d.overall);
    var secs = (d.sections || []).slice();
    var html = '<div class="ga-cards">';
    html += card('Genel Band', overall != null ? overall.toFixed(1) : '—', '/9', att, true);
    secs.forEach(function (s) { var av = num1(s.avg); html += card(SECTION_LABEL[s.section] || s.section, av != null ? av.toFixed(1) : '—', '/9', s.attempts); });
    html += '</div>';
    html += '<div class="ga-note">Gerçek IELTS deneme band ortalaması · ' + att + ' deneme · ' + secs.length + ' bölüm.</div>';
    var goal = num1(d.goal);
    if (goal != null && overall != null) {
      var gap = Math.round((goal - overall) * 10) / 10;
      var gColor = gap <= 0 ? '#1FA971' : (gap <= 0.5 ? '#B78A2E' : '#c0392b');
      var gTxt = gap <= 0 ? 'hedefin üzerinde ▲' : ('hedefe ' + gap + ' band var');
      html += '<div class="ga-goal">🎯 Hedef band: <b>' + esc(String(d.goal)) + '</b> · Ortalama: <b>' + overall.toFixed(1) + '</b> · <b style="color:' + gColor + '">' + gTxt + '</b></div>';
    } else if (d.goal) { html += '<div class="ga-goal">🎯 Hedef band: <b>' + esc(String(d.goal)) + '</b></div>'; }
    html += '<div class="ga-grp">Bölüm Detayı (en iyi · son)</div>';
    html += secs.map(function (s) {
      var av = num1(s.avg) || 0, p = Math.round(av / 9 * 100);
      var best = num1(s.best), last = num1(s.last);
      return '<div class="ga-row"><span class="n">' + esc(SECTION_LABEL[s.section] || s.section) + '</span>' + bar(p, bandColor(av)) + '<span class="p">' + av.toFixed(1) + ' <span style="opacity:.65">(' + (best != null ? best.toFixed(1) : '—') + ' · ' + (last != null ? last.toFixed(1) : '—') + ')</span></span></div>';
    }).join('');
    var sorted = secs.filter(function (s) { return num1(s.avg) != null; }).sort(function (a, b) { return num1(b.avg) - num1(a.avg); });
    var v = '<b>IELTS</b>: Ortalama band <b>' + (overall != null ? overall.toFixed(1) : '—') + '</b>. ';
    if (sorted.length) { v += 'En güçlü: ' + esc(SECTION_LABEL[sorted[0].section] || sorted[0].section) + ' (' + num1(sorted[0].avg).toFixed(1) + '). '; if (sorted.length > 1) { var w = sorted[sorted.length - 1]; v += 'En zayıf: <b>' + esc(SECTION_LABEL[w.section] || w.section) + '</b> (' + num1(w.avg).toFixed(1) + ') — bu bölüme ağırlık verilmeli.'; } }
    html += '<div class="ga-verdict">' + v + '</div>';
    return html;
  }
  function buildVocab(d) {
    var saved = d.saved || 0, mastered = d.mastered || 0, reviews = d.reviews || 0;
    var qa = d.quiz_attempts || 0, qs = d.quiz_score || 0, qt = d.quiz_total || 0;
    if (!saved && !qa) return '<div class="ga-empty">Kelime verisi yok.</div>';
    var quizPct = qt > 0 ? Math.round(100 * qs / qt) : null;
    var lvl = mastered >= 1500 ? 'C1+' : (mastered >= 800 ? 'B2' : (mastered >= 350 ? 'B1' : (mastered >= 120 ? 'A2' : 'A1')));
    var html = '<div class="ga-cards">';
    html += card('Tahmini Seviye', lvl, '', mastered + ' öğrenilmiş', true);
    html += card('Kaydedilen', saved, 'kelime', saved);
    html += card('Öğrenilmiş', mastered, '≥3 tekrar', mastered);
    if (quizPct != null) html += card('Quiz Doğruluğu', quizPct, '%', qa);
    html += '</div>';
    html += '<div class="ga-note">Seviye, öğrenilmiş (≥3 tekrar) kelime sayısından kaba bir tahmindir · toplam tekrar: ' + reviews + '.</div>';
    var v = '<b>Kelime Bilgisi</b>: ' + saved + ' kelime kaydedilmiş, ' + mastered + ' tanesi öğrenilmiş (≥3 tekrar). Tahmini seviye <b>' + lvl + '</b>. ';
    if (quizPct != null) v += 'Kelime quizlerinde %' + quizPct + ' doğruluk. ';
    if (saved > 0 && mastered < saved * 0.5) v += 'Öneri: kaydedilen kelimelerin tekrarı artırılmalı.'; else v += 'Tekrar disiplini iyi.';
    html += '<div class="ga-verdict">' + v + '</div>';
    return html;
  }

  function mount(opts) {
    var sb = opts.sb, cont = opts.container, userId = opts.userId, onAssign = opts.onAssign;
    if (!sb || !cont || !userId) return;
    injectCSS();
    cont.innerHTML = '<div class="ga"><div class="ga-head"><select class="ga-exam"><option>Yükleniyor…</option></select></div><div class="ga-body ga-empty">Yükleniyor…</div></div>';
    var sel = cont.querySelector('.ga-exam'), body = cont.querySelector('.ga-body');

    function render(exam) {
      body.className = 'ga-body ga-empty'; body.textContent = 'Analiz ediliyor…';
      var rpc, arg;
      if (exam === 'ielts') { rpc = 'admin_user_ielts_analysis'; arg = { p_user_id: userId }; }
      else if (exam === 'vocab') { rpc = 'admin_user_vocab_analysis'; arg = { p_user_id: userId }; }
      else { rpc = 'admin_user_exam_analysis'; arg = { p_user_id: userId, p_exam: exam }; }
      sb.rpc(rpc, arg).then(function (r) {
        if (r.error) throw r.error;
        body.className = 'ga-body';
        var d = r.data || {};
        if (exam === 'ielts') { body.innerHTML = buildIelts(d); }
        else if (exam === 'vocab') { body.innerHTML = buildVocab(d); }
        else {
          body.innerHTML = build(exam, d, !!onAssign, opts.assignLabel);
          if (onAssign) { body.querySelectorAll('[data-assign-cat]').forEach(function (b) { b.addEventListener('click', function () { onAssign(exam, b.dataset.assignCat, b.dataset.assignLabel); }); }); }
        }
      }).catch(function () { body.className = 'ga-body ga-empty'; body.textContent = 'Analiz yüklenemedi.'; });
    }

    sb.rpc('admin_user_exams', { p_user_id: userId }).then(function (r) {
      if (r.error) throw r.error;
      var exams = r.data || [];
      if (!exams.length) { sel.style.display = 'none'; body.className = 'ga-body ga-empty'; body.textContent = 'Bu öğrenci soru bankasından henüz soru çözmemiş. (Kelime Bankası ve denemeler ayrı bölümlerde görünür.)'; return; }
      sel.innerHTML = exams.map(function (e) { var m = EXAM_META[e.exam] || { label: e.exam }; return '<option value="' + esc(e.exam) + '">' + esc(m.label) + ' (' + e.answered + ' soru)</option>'; }).join('');
      sel.addEventListener('change', function () { render(sel.value); });
      render(exams[0].exam);
    }).catch(function () { sel.style.display = 'none'; body.className = 'ga-body ga-empty'; body.textContent = 'Analiz yüklenemedi.'; });
  }

  window.GriAnalysis = { mount: mount };
})();
