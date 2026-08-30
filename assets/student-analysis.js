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

  var EXAM_META = { sat: { label: 'SAT' }, sat_deneme: { label: 'SAT Denemeleri' }, yds: { label: 'YDS' }, ydt: { label: 'YDT' }, udsp: { label: 'ÜDS / YÖKDİL' }, toefl: { label: 'TOEFL' }, ielts: { label: 'IELTS (Deneme)' }, vocab: { label: 'Kelime Bilgisi' }, hazirlik: { label: 'Üniversite Hazırlık Atlama' }, toefl_deneme: { label: 'TOEFL Denemeleri' }, ge: { label: 'Genel İngilizce Sınavları' } };
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
    + '.ga-head{display:flex;gap:0.5rem;align-items:center;flex-wrap:wrap;margin-bottom:0.7rem;}'
    + '.ga-exam{flex:1;min-width:180px;max-width:340px;font:inherit;padding:8px 11px;border:1px solid var(--line,#e6ddca);border-radius:9px;background:var(--bg-card,#fff);color:var(--text,#1a2230);}'
    + '.ga-print{flex:0 0 auto;border:1px solid var(--teal,#2C5856);background:transparent;color:var(--teal,#2C5856);border-radius:9px;padding:8px 13px;font:inherit;font-size:0.82rem;font-weight:600;cursor:pointer;}'
    + '.ga-print:hover{background:var(--teal,#2C5856);color:#fff;}'
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
    + '.ga-verdict{margin-top:1rem;padding:0.8rem 1rem;background:var(--bg-card,#fff);border:1px solid var(--line,#e6ddca);border-left:3px solid var(--teal,#2C5856);border-radius:8px;font-size:0.86rem;line-height:1.55;}'
    + '.ga-att{border:1px solid var(--line,#e6ddca);border-radius:9px;margin:0.45rem 0;background:var(--bg-card,#fff);overflow:hidden;}'
    + '.ga-att>summary{list-style:none;cursor:pointer;padding:0.55rem 0.75rem;display:flex;align-items:center;gap:0.5rem;font-size:0.84rem;font-weight:600;}'
    + '.ga-att>summary::-webkit-details-marker{display:none;}'
    + '.ga-att>summary::before{content:"\\25B8";color:var(--teal,#2C5856);font-size:0.75rem;flex:0 0 auto;}'
    + '.ga-att[open]>summary::before{content:"\\25BE";}'
    + '.ga-att .ga-secname{font-family:var(--font-display,Georgia),serif;}'
    + '.ga-att .ga-bchip{margin-left:auto;font-weight:600;}'
    + '.ga-att .ga-when{color:var(--text-muted,#6b6862);font-weight:400;font-size:0.74rem;}'
    + '.ga-qs{padding:0 0.75rem 0.6rem;}'
    + '.ga-q{display:flex;gap:0.5rem;align-items:flex-start;padding:0.32rem 0;border-top:1px solid var(--line,#efe9db);font-size:0.8rem;}'
    + '.ga-q .qn{flex:0 0 2.7rem;color:var(--text-muted,#6b6862);font-variant-numeric:tabular-nums;}'
    + '.ga-q .qmark{flex:0 0 0.9rem;font-weight:700;text-align:center;}'
    + '.ga-q.ok .qmark{color:#1FA971;}.ga-q.no .qmark{color:#c0392b;}.ga-q.part .qmark{color:#B78A2E;}'
    + '.ga-q .qtext{flex:1;min-width:0;}'
    + '.ga-q .qans{display:block;color:var(--text-muted,#6b6862);font-size:0.75rem;margin-top:1px;}'
    + '.ga-q .qgood{color:#1FA971;font-weight:600;}.ga-q .qbad{color:#c0392b;}'
    + '.ga-q .qexp{display:block;font-size:0.74rem;line-height:1.5;color:var(--text-muted,#6b6862);font-style:italic;margin-top:4px;padding:4px 8px;background:rgba(183,138,46,0.09);border-left:3px solid #B78A2E;border-radius:4px;}'
    + '.ga-q .qexp b{color:#8a6a1e;font-style:normal;}'
    + '.ga-q.no .qexp{background:rgba(192,57,43,0.08);border-left-color:#c0392b;}.ga-q.no .qexp b{color:#b33a3a;}'
    + ':root[data-theme="dark"] .ga-q .qexp b{color:#D8B25A;}:root[data-theme="dark"] .ga-q.no .qexp b{color:#e5837b;}'
    + '.ga-essay{margin:0.55rem 0 0.2rem;}'
    + '.ga-essay .et{font-size:0.8rem;font-weight:600;margin-bottom:0.25rem;}'
    + '.ga-essay .et small{font-weight:400;color:var(--text-muted,#6b6862);}'
    + '.ga-essay-box{white-space:pre-wrap;background:var(--bg,#faf7ef);border:1px solid var(--line,#e6ddca);border-radius:7px;padding:0.6rem 0.7rem;font-size:0.8rem;line-height:1.55;max-height:240px;overflow:auto;}'
    + '.ga-fb{font-size:0.77rem;color:var(--text-muted,#6b6862);margin:0.3rem 0 0;line-height:1.5;padding-left:0.7rem;border-left:2px solid var(--line,#e6ddca);}'
    + '.ga-fb b{color:var(--text,#1a2230);}'
    + '.ga-bchip,.ga-chip{display:inline-block;font-size:0.72rem;padding:1px 8px;border-radius:20px;background:var(--teal,#2C5856);color:#fff;}'
    + '.ga-chip.mut{background:var(--line,#e6ddca);color:var(--text,#1a2230);}'
    + '.ga-empty-mini{color:var(--text-muted,#6b6862);font-style:italic;font-size:0.8rem;padding:0.3rem 0;}'
    + '.gri-eval-row{display:flex;align-items:center;gap:0.5rem;flex-wrap:wrap;margin:0.55rem 0 0.2rem;}'
    + '.gri-eval-btn{border:1px solid var(--teal,#2C5856);background:var(--teal,#2C5856);color:#fff;font:inherit;font-size:0.76rem;font-weight:600;padding:0.32rem 0.72rem;border-radius:7px;cursor:pointer;}'
    + '.gri-eval-btn:hover{opacity:0.88;}.gri-eval-btn:disabled{opacity:0.6;cursor:default;}'
    + '.gri-eval-badge{font-size:0.68rem;font-weight:600;color:#1FA971;background:rgba(31,169,113,0.12);border-radius:20px;padding:2px 9px;}'
    + '.gri-eval-msg{font-size:0.75rem;width:100%;}'
    + '.gri-eval-msg .gri-eval-pending{color:var(--text-muted,#6b6862);font-style:italic;}'
    + '.gri-eval-msg .gri-eval-err{color:#c0392b;}';

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
  function fmtDate(iso) { if (!iso) return ''; var dd = new Date(iso); if (isNaN(dd)) return ''; return dd.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' }); }
  var WR_LBL = {
    task1_achievement: 'Task 1 · Görev Başarımı', task1_coherence: 'Task 1 · Tutarlılık', task1_lexical: 'Task 1 · Kelime', task1_grammar: 'Task 1 · Gramer',
    task2_response: 'Task 2 · Görev Yanıtı', task2_coherence: 'Task 2 · Tutarlılık', task2_lexical: 'Task 2 · Kelime', task2_grammar: 'Task 2 · Gramer'
  };

  // Bir denemenin (attempt) soru dökümünü render eder — doğru yeşil ✓, yanlış kırmızı ✗
  function ieltsQuestionRows(qs) {
    if (!qs || !qs.length) return '<div class="ga-empty-mini">Soru dökümü yok.</div>';
    return qs.map(function (q) {
      var pooled = !!q.pooled;
      var ok = q.ok === true;
      var cls = ok ? 'ok' : (pooled && q.correct_count > 0 ? 'part' : 'no');
      var mark = ok ? '✓' : (pooled && q.correct_count > 0 ? '±' : '✗');
      var qtext = q.q ? esc(String(q.q)) : '';
      var ans = '';
      if (pooled) {
        ans = '<span class="qans">Seçilen: ' + (q.user ? esc(q.user) : '<span class="qbad">— boş —</span>')
            + ' · Doğru: <span class="qgood">' + esc(q.correct || '') + '</span>'
            + ' · <b>' + (q.correct_count || 0) + '/' + (q.span || 0) + '</b></span>';
      } else if (ok) {
        ans = '<span class="qans"><span class="qgood">' + esc(q.user || q.correct || '') + '</span></span>';
      } else {
        ans = '<span class="qans">Öğrenci: ' + (q.user ? '<span class="qbad">' + esc(q.user) + '</span>' : '<span class="qbad">— boş —</span>')
            + ' · Doğru: <span class="qgood">' + esc(q.correct || '') + '</span></span>';
      }
      var expHtml = (q.exp && String(q.exp).trim()) ? '<span class="qexp"><b>Neden:</b> ' + esc(String(q.exp)) + '</span>' : '';
      return '<div class="ga-q ' + cls + '"><span class="qn">' + esc(String(q.n)) + '</span><span class="qmark">' + mark + '</span>'
        + '<span class="qtext">' + (qtext || '<span style="color:var(--text-muted,#6b6862);">Soru ' + esc(String(q.n)) + '</span>') + ans + expHtml + '</span></div>';
    }).join('');
  }

  function ieltsAttemptBlock(a) {
    var band = num1(a.band);
    var when = fmtDate(a.completed_at);
    var raw = (a.raw_score != null && a.total_questions != null) ? (a.raw_score + '/' + a.total_questions) : '';
    var head = '<summary><span class="ga-secname">' + esc(SECTION_LABEL[a.section] || a.section) + '</span>'
      + (when ? ' <span class="ga-when">' + esc(when) + '</span>' : '')
      + '<span class="ga-bchip" style="background:' + (band != null ? bandColor(band) : 'var(--teal,#2C5856)') + '">Band ' + (band != null ? band.toFixed(1) : '—') + (raw ? ' · ' + raw : '') + '</span></summary>';
    return '<details class="ga-att">' + head + '<div class="ga-qs">' + ieltsQuestionRows(a.questions) + '</div></details>';
  }

  // ===== Öğretmen/admin: öğrenci yazısını Gri ile değerlendirme =====
  var _sb = null, _ieltsWrMap = {};
  var A_EVAL_ENDPOINT = 'https://vazbvbqgvtlaqkytfsbi.supabase.co/functions/v1/gri-evaluate-writing';
  var GRI_WR_PROMPT = 'IELTS Writing test: Task 1 (visual description, 150-200 words) and Task 2 (argumentative essay, 250-300 words). Evaluate both tasks separately using IELTS Band Descriptors (0-9). Provide separate band scores for each criterion of each task.';
  function griEvalControls(w) {
    if (!w || !w.id) return '';
    var evaluated = !!w.evaluated;
    var label = evaluated ? 'Gri ile yeniden değerlendir' : 'Gri ile değerlendir';
    var badge = evaluated ? '<span class="gri-eval-badge">Gri değerlendirdi</span>' : '';
    return '<div class="gri-eval-row">'
      + '<button type="button" class="gri-eval-btn" data-sub="' + esc(String(w.id)) + '">' + label + '</button>'
      + badge + '<div class="gri-eval-msg" data-for="' + esc(String(w.id)) + '"></div></div>';
  }
  function attachGriHandlers(scope) {
    if (!scope) return;
    scope.querySelectorAll('.gri-eval-btn').forEach(function (btn) {
      if (btn.dataset.bound) return; btn.dataset.bound = '1';
      btn.addEventListener('click', function (e) {
        e.preventDefault(); e.stopPropagation();
        var subId = btn.dataset.sub;
        var msgEl = document.querySelector('.gri-eval-msg[data-for="' + subId + '"]');
        runGriEval(subId, btn, msgEl);
      });
    });
  }
  async function runGriEval(subId, btn, msgEl) {
    var w = _ieltsWrMap[subId];
    if (!w || !_sb) return;
    var orig = btn.textContent;
    btn.disabled = true; btn.textContent = 'Değerlendiriliyor…';
    if (msgEl) msgEl.innerHTML = '<span class="gri-eval-pending">Gri yazıyı okuyor, 10-20 sn…</span>';
    try {
      var sess = (await _sb.auth.getSession()).data.session;
      if (!sess) throw new Error('Oturum bulunamadı, tekrar giriş yap.');
      var combinedText = '## TASK 1\n\n' + (w.task1_essay || '(boş)') + '\n\n## TASK 2\n\n' + (w.task2_essay || '(boş)');
      var combinedWordCount = (w.task1_word_count || 0) + (w.task2_word_count || 0);
      var r = await fetch(A_EVAL_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + sess.access_token },
        body: JSON.stringify({ text_type_id: 'ielts-writing-complete', level: null, prompt_id: null, prompt_snapshot: GRI_WR_PROMPT, text: combinedText, word_count: combinedWordCount })
      });
      if (r.status === 402) { var pb = await r.json().catch(function () { return {}; }); throw new Error(pb.error || 'Değerlendirme hakkı bitti.'); }
      if (!r.ok) { var eb = await r.json().catch(function () { return {}; }); throw new Error(eb.error || ('HTTP ' + r.status)); }
      var j = await r.json();
      var evaluation = j.evaluation || {};
      var sc = evaluation.scores || {};
      function avg(keys) { var v = keys.map(function (k) { return Number(sc[k]); }).filter(function (x) { return !isNaN(x); }); return v.length ? Math.round((v.reduce(function (a, b) { return a + b; }, 0) / v.length) * 2) / 2 : null; }
      var t1 = avg(['task1_achievement', 'task1_coherence', 'task1_lexical', 'task1_grammar']);
      var t2 = avg(['task2_response', 'task2_coherence', 'task2_lexical', 'task2_grammar']);
      var overall = (t1 != null && t2 != null) ? Math.round(((t1 + 2 * t2) / 3) * 2) / 2 : null;
      var sv = await _sb.rpc('teacher_save_ielts_writing_eval', { p_submission_id: subId, p_evaluation: evaluation, p_task1_band: t1, p_task2_band: t2, p_overall: overall });
      if (sv.error) throw sv.error;
      if (sv.data && sv.data.error) throw new Error(sv.data.error === 'forbidden' ? 'Bu öğrencinin yazısını değerlendirme yetkin yok.' : sv.data.error);
      w.evaluated = true; w.comments = evaluation.comments || {}; w.scores = evaluation.scores || {};
      w.task1_band = t1; w.task2_band = t2; w.overall_band = overall;
      var wrap = document.getElementById('giw-' + String(subId));
      if (wrap) { wrap.innerHTML = ieltsEssayInner(w, true); attachGriHandlers(wrap); }
    } catch (e) {
      if (msgEl) msgEl.innerHTML = '<span class="gri-eval-err">' + esc(e.message || String(e)) + '</span>';
      btn.disabled = false; btn.textContent = orig;
    }
  }

  function ieltsEssayBlock(w) {
    if (w && w.id) _ieltsWrMap[String(w.id)] = w;
    return '<div class="giw-wrap" id="giw-' + esc(String(w.id)) + '">' + ieltsEssayInner(w, false) + '</div>';
  }
  function ieltsEssayInner(w, keepOpen) {
    var head = '<summary><span class="ga-secname">Writing — ' + esc(w.test_name || 'Deneme') + '</span>'
      + (w.submitted_at ? ' <span class="ga-when">' + esc(fmtDate(w.submitted_at)) + '</span>' : '')
      + '<span class="ga-bchip">' + (w.overall_band != null ? 'Band ' + num1(w.overall_band).toFixed(1) : (w.evaluated ? 'Değerlendirildi' : 'Değerlendirilmedi')) + '</span></summary>';
    var comments = w.comments || {};
    function taskHtml(n) {
      var essay = n === 1 ? w.task1_essay : w.task2_essay;
      var wc = n === 1 ? w.task1_word_count : w.task2_word_count;
      var band = num1(n === 1 ? w.task1_band : w.task2_band);
      if ((essay == null || String(essay).trim() === '') && band == null) return '';
      var h = '<div class="ga-essay"><div class="et">Task ' + n
        + (band != null ? ' <span class="ga-chip" style="background:' + bandColor(band) + '">Band ' + band.toFixed(1) + '</span>' : '')
        + (wc != null ? ' <small>· ' + wc + ' kelime</small>' : '') + '</div>';
      if (essay != null && String(essay).trim() !== '') {
        h += '<div class="ga-essay-box">' + esc(String(essay)) + '</div>';
      } else {
        h += '<div class="ga-empty-mini">Bu göreve yazı girilmemiş.</div>';
      }
      // ilgili task yorumları
      var fb = '';
      Object.keys(WR_LBL).forEach(function (k) {
        if (k.indexOf('task' + n) === 0 && comments[k]) {
          fb += '<div class="ga-fb"><b>' + esc(WR_LBL[k].replace('Task ' + n + ' · ', '')) + ':</b> ' + esc(String(comments[k])) + '</div>';
        }
      });
      h += fb + '</div>';
      return h;
    }
    return '<details class="ga-att"' + (keepOpen ? ' open' : '') + '>' + head + '<div class="ga-qs">' + (taskHtml(1) + taskHtml(2) || '<div class="ga-empty-mini">Yazı bulunamadı.</div>') + griEvalControls(w) + '</div></details>';
  }

  function buildIelts(d) {
    var att = d.attempts || 0;
    var detail = d.attempts_detail || [];
    var writing = d.writing || [];
    if (!att && !writing.length) return '<div class="ga-empty">IELTS deneme verisi yok.</div>';
    var overall = num1(d.overall);
    var secs = (d.sections || []).slice();
    var html = '<div class="ga-cards">';
    html += card('Genel Band', overall != null ? overall.toFixed(1) : '—', '/9', att, true);
    secs.forEach(function (s) { var av = num1(s.avg); html += card(SECTION_LABEL[s.section] || s.section, av != null ? av.toFixed(1) : '—', '/9', s.attempts); });
    // Yazma ortalama bandı (essay'lerden)
    var wBands = writing.map(function (w) { return num1(w.overall_band); }).filter(function (x) { return x != null; });
    var wAvg = wBands.length ? (wBands.reduce(function (a, b) { return a + b; }, 0) / wBands.length) : null;
    if (wAvg != null && !secs.some(function (s) { return s.section === 'writing'; })) {
      html += card('Writing', wAvg.toFixed(1), '/9', wBands.length);
    }
    html += '</div>';
    html += '<div class="ga-note">Gerçek IELTS deneme verisi · ' + att + ' bölüm denemesi · ' + writing.length + ' yazma gönderimi.</div>';
    var goal = num1(d.goal);
    if (goal != null && overall != null) {
      var gap = Math.round((goal - overall) * 10) / 10;
      var gColor = gap <= 0 ? '#1FA971' : (gap <= 0.5 ? '#B78A2E' : '#c0392b');
      var gTxt = gap <= 0 ? 'hedefin üzerinde ▲' : ('hedefe ' + gap + ' band var');
      html += '<div class="ga-goal">🎯 Hedef band: <b>' + esc(String(d.goal)) + '</b> · Ortalama: <b>' + overall.toFixed(1) + '</b> · <b style="color:' + gColor + '">' + gTxt + '</b></div>';
    } else if (d.goal) { html += '<div class="ga-goal">🎯 Hedef band: <b>' + esc(String(d.goal)) + '</b></div>'; }

    if (secs.length) {
      html += '<div class="ga-grp">Bölüm Ortalaması (en iyi · son)</div>';
      html += secs.map(function (s) {
        var av = num1(s.avg) || 0, p = Math.round(av / 9 * 100);
        var best = num1(s.best), last = num1(s.last);
        return '<div class="ga-row"><span class="n">' + esc(SECTION_LABEL[s.section] || s.section) + '</span>' + bar(p, bandColor(av)) + '<span class="p">' + av.toFixed(1) + ' <span style="opacity:.65">(' + (best != null ? best.toFixed(1) : '—') + ' · ' + (last != null ? last.toFixed(1) : '—') + ')</span></span></div>';
      }).join('');
    }

    // Soru-düzeyi deneme dökümü (reading & listening)
    if (detail.length) {
      html += '<div class="ga-grp">Deneme Dökümü — Soru / Cevap (' + detail.length + ')</div>';
      html += detail.map(ieltsAttemptBlock).join('');
    }

    // Yazma essay'leri (tam metin + band + geri bildirim)
    if (writing.length) {
      html += '<div class="ga-grp">Yazma (Writing) — Öğrenci Metinleri (' + writing.length + ')</div>';
      html += writing.map(ieltsEssayBlock).join('');
    }

    // Güçlü/zayıf verdict — reading + listening + writing birlikte
    var perf = [];
    secs.forEach(function (s) { var av = num1(s.avg); if (av != null) perf.push({ label: SECTION_LABEL[s.section] || s.section, val: av }); });
    if (wAvg != null && !perf.some(function (p) { return p.label === 'Writing'; })) perf.push({ label: 'Writing', val: wAvg });
    perf.sort(function (a, b) { return b.val - a.val; });
    var v = '<b>IELTS</b>: Ortalama band <b>' + (overall != null ? overall.toFixed(1) : '—') + '</b>. ';
    if (perf.length) {
      v += 'En güçlü: <b>' + esc(perf[0].label) + '</b> (' + perf[0].val.toFixed(1) + '). ';
      if (perf.length > 1) { var wk = perf[perf.length - 1]; v += 'En zayıf: <b>' + esc(wk.label) + '</b> (' + wk.val.toFixed(1) + ') — bu bölüme ağırlık verilmeli. '; }
    }
    if (wAvg != null) {
      v += 'Yazmada ortalama <b>' + wAvg.toFixed(1) + '</b>; ' + (wAvg < 6 ? 'gramer ve görev yanıtı üzerine çalışılmalı.' : (wAvg < 7 ? 'sağlam, tutarlılık ve kelime çeşitliliğiyle yükselebilir.' : 'güçlü, koru.'));
    }
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

  // ===== SAT adaptif denemeler =====
  function satKindLabel(k) { return k === 'rw' ? 'Reading & Writing' : (k === 'math' ? 'Matematik' : (k === 'full' ? 'Tam SAT' : (k || 'Deneme'))); }
  function satScoreColor(scaled, max) { var p = max ? Math.round(100 * scaled / max) : 0; return p >= 75 ? '#1FA971' : (p >= 55 ? '#B78A2E' : '#c0392b'); }
  function satDenemeName(slug) { return String(slug == null ? 'Deneme' : slug).replace(/[-_]/g, ' ').replace(/\b\w/g, function (m) { return m.toUpperCase(); }); }
  function satAttemptBlock(a) {
    var when = fmtDate(a.completed_at);
    var kind = a.kind;
    var chipTxt, chipColor;
    if (kind === 'full') { chipTxt = (a.total_scaled != null ? a.total_scaled + ' /1600' : '—'); chipColor = a.total_scaled != null ? satScoreColor(a.total_scaled, 1600) : 'var(--teal,#2C5856)'; }
    else if (kind === 'math') { chipTxt = (a.math_scaled != null ? a.math_scaled + ' /800' : '—'); chipColor = a.math_scaled != null ? satScoreColor(a.math_scaled, 800) : 'var(--teal,#2C5856)'; }
    else { chipTxt = (a.rw_scaled != null ? a.rw_scaled + ' /800' : '—'); chipColor = a.rw_scaled != null ? satScoreColor(a.rw_scaled, 800) : 'var(--teal,#2C5856)'; }
    var head = '<summary><span class="ga-secname">' + esc(satDenemeName(a.deneme_slug)) + '</span>'
      + ' <span class="ga-when">' + esc(satKindLabel(kind)) + (when ? ' · ' + esc(when) : '') + '</span>'
      + '<span class="ga-bchip" style="background:' + chipColor + '">' + esc(chipTxt) + '</span></summary>';
    var lines = '';
    if (a.kind !== 'math' && (a.rw_answered || a.rw_scaled != null)) {
      var rp = pctOf(a.rw_answered, a.rw_correct);
      lines += '<div class="ga-row"><span class="n">R&amp;W</span>' + bar(rp, accColor(rp))
        + '<span class="p">' + (a.rw_scaled != null ? a.rw_scaled + '/800 · ' : '') + a.rw_correct + '/' + a.rw_answered + '</span></div>';
    }
    if (a.kind !== 'rw' && (a.math_answered || a.math_scaled != null)) {
      var mp = pctOf(a.math_answered, a.math_correct);
      lines += '<div class="ga-row"><span class="n">Matematik</span>' + bar(mp, accColor(mp))
        + '<span class="p">' + (a.math_scaled != null ? a.math_scaled + '/800 · ' : '') + a.math_correct + '/' + a.math_answered + '</span></div>';
    }
    var tp = pctOf(a.answered, a.correct);
    lines += '<div class="ga-row"><span class="n">Toplam doğruluk</span>' + bar(tp, accColor(tp)) + '<span class="p">%' + tp + ' (' + (a.correct || 0) + '/' + (a.answered || 0) + ')</span></div>';
    return '<details class="ga-att">' + head + '<div class="ga-qs">' + lines + '</div></details>';
  }

  function buildSatDeneme(d) {
    var att = d.attempts || 0;
    var detail = d.attempts_detail || [];
    var assigned = d.assigned || [];
    var html = '';
    // Atanan denemeler: her biri çözüldü mü + skoru
    if (assigned.length) {
      html += '<div class="ga-grp">Atanan Denemeler (' + assigned.length + ')</div>';
      html += assigned.map(function (x) {
        var name = esc(satDenemeName(x.deneme_slug));
        if (x.solved) {
          var sc = (x.total_scaled != null) ? (x.total_scaled + '/1600')
                 : ((x.rw_scaled != null ? x.rw_scaled : '—') + ' R&amp;W · ' + (x.math_scaled != null ? x.math_scaled : '—') + ' Mat');
          return '<div class="ga-row"><span class="n" style="flex:1;">' + name + '</span><span style="color:#1FA971;font-weight:700;white-space:nowrap;">✓ Çözüldü · ' + sc + '</span></div>';
        }
        return '<div class="ga-row"><span class="n" style="flex:1;">' + name + '</span><span style="color:#c0392b;font-weight:600;white-space:nowrap;">✗ Çözülmedi</span></div>';
      }).join('');
    }
    if (!att) {
      if (assigned.length) return html + '<div class="ga-note">Henüz çözülen deneme yok — öğrenci çözünce R&amp;W / Matematik / Toplam ölçekli skorları burada listelenir.</div>';
      return '<div class="ga-empty">Bu öğrenci henüz bir SAT denemesi çözmemiş. Atadığın denemeler öğrenci tamamlayınca R&amp;W / Matematik / Toplam ölçekli skorlarıyla burada görünür.</div>';
    }
    var cats = d.categories || [];
    var bestRw = d.best_rw, bestMath = d.best_math, bestTotal = d.best_total;
    var estTotal = (bestTotal != null) ? bestTotal : ((bestRw != null && bestMath != null) ? (bestRw + bestMath) : null);

    html += '<div class="ga-cards">';
    html += card('En iyi R&W', bestRw != null ? bestRw : null, '/800', att);
    html += card('En iyi Matematik', bestMath != null ? bestMath : null, '/800', att);
    if (estTotal != null) html += card('En iyi Toplam' + (bestTotal == null ? ' (tahmini)' : ''), estTotal, '/1600', att, true);
    html += '</div>';
    html += '<div class="ga-note">Skorlar deneme motorunun ölçekli puanıdır (R&W / Matematik 200-800, Tam SAT 400-1600) · ' + att + ' deneme çözülmüş.</div>';

    // Hedefle karşılaştırma (1600 üzerinden)
    var goal = goalNum(d.goal);
    if (goal != null && estTotal != null) {
      var gap = goal - estTotal;
      var gColor = gap <= 0 ? '#1FA971' : (gap <= 120 ? '#B78A2E' : '#c0392b');
      var gapTxt = gap <= 0 ? 'hedefin üzerinde ▲' : ('hedefe ' + gap + ' puan var');
      html += '<div class="ga-goal">🎯 Hedef: <b>' + esc(String(d.goal)) + '</b>/1600 · En iyi: <b>' + estTotal + '</b>/1600 · <b style="color:' + gColor + '">' + gapTxt + '</b></div>';
    } else if (d.goal) {
      html += '<div class="ga-goal">🎯 Hedef: <b>' + esc(String(d.goal)) + '</b>/1600 <span style="color:var(--text-muted,#6b6862);">(karşılaştırma için tam deneme gerek)</span></div>';
    }

    // Denemeler (soru/skor dökümü)
    html += '<div class="ga-grp">Denemeler (' + detail.length + ')</div>';
    html += detail.map(satAttemptBlock).join('');

    // Güçlü / Zayıf konular (RW domain + Math konu)
    if (cats.length) {
      var sig = cats.filter(function (x) { return x.answered >= 3; });
      var pool = sig.length ? sig : cats;
      var byAcc = pool.slice().sort(function (a, b) { return pctOf(b.answered, b.correct) - pctOf(a.answered, a.correct); });
      var strong = byAcc.slice(0, 3);
      var weak = byAcc.slice().reverse().slice(0, 3).filter(function (x) { return pctOf(x.answered, x.correct) < 100; });
      html += '<div class="ga-2col">';
      html += '<div><div class="ga-grp" style="color:#1FA971;">Güçlü Konular</div>' + (strong.length ? strong.map(function (x) { return catRow(x, false); }).join('') : '<div class="ga-empty" style="font-size:0.8rem;">—</div>') + '</div>';
      html += '<div><div class="ga-grp" style="color:#c0392b;">Zayıf Konular</div>' + (weak.length ? weak.map(function (x) { return catRow(x, false); }).join('') : '<div class="ga-empty" style="font-size:0.8rem;">Belirgin zayıf konu yok.</div>') + '</div>';
      html += '</div>';
      html += '<div class="ga-grp">Konu Doğruluğu (' + cats.length + ')</div>';
      html += cats.map(function (x) { return catRow(x, false); }).join('');
    }

    // Zorluk kırılımı
    var diffs = d.difficulties || [];
    if (diffs.length) {
      var order = { easy: 0, medium: 1, hard: 2 }, dl = { easy: 'Kolay', medium: 'Orta', hard: 'Zor' };
      diffs.sort(function (a, b) { return (order[a.difficulty] == null ? 9 : order[a.difficulty]) - (order[b.difficulty] == null ? 9 : order[b.difficulty]); });
      html += '<div class="ga-grp" style="margin-top:0.8rem;">Zorluk Kırılımı</div>';
      html += diffs.map(function (x) { var p = pctOf(x.answered, x.correct); return '<div class="ga-row"><span class="n" style="flex:0 0 3.5rem;">' + (dl[x.difficulty] || x.difficulty) + '</span>' + bar(p, accColor(p)) + '<span class="p">%' + p + ' (' + x.correct + '/' + x.answered + ')</span></div>'; }).join('');
    }

    // Değerlendirme
    var v = '<b>SAT Denemeleri</b>: ' + att + ' deneme çözülmüş. ';
    if (estTotal != null) v += 'En iyi toplam <b>' + estTotal + '</b>/1600' + (bestTotal == null ? ' (R&W + Matematik en iyileri)' : '') + '. ';
    if (cats.length) {
      var sc = cats.slice().sort(function (a, b) { return pctOf(b.answered, b.correct) - pctOf(a.answered, a.correct); });
      v += 'En güçlü: ' + esc(catLabel(sc[0].category)) + ' (%' + pctOf(sc[0].answered, sc[0].correct) + '). ';
      var wc = sc[sc.length - 1];
      if (pctOf(wc.answered, wc.correct) < 100) v += 'En zayıf: <b>' + esc(catLabel(wc.category)) + '</b> (%' + pctOf(wc.answered, wc.correct) + ') — bu konuya ağırlık verilmeli.';
    }
    html += '<div class="ga-verdict">' + v + '</div>';
    return html;
  }

  // ===== Üniversite Hazırlık Atlama denemeleri =====
  function hazirlikSecLabel(s) {
    var M = { reading: 'Okuma', vocabulary: 'Kelime', use_of_english: 'Dil Kullanımı', grammar: 'Gramer', sentence_analysis: 'Cümle Analizi', writing: 'Yazma', listening: 'Dinleme' };
    return M[s] || catLabel(s);
  }
  function hazirlikQuestionRows(qs) {
    if (!qs || !qs.length) return '';
    return qs.map(function (q) {
      var ok = q.ok === true;
      var cls = ok ? 'ok' : 'no';
      var mark = ok ? '✓' : '✗';
      var qtext = q.q ? esc(String(q.q)) : ('<span style="color:var(--text-muted,#6b6862);">Soru ' + esc(String(q.n)) + '</span>');
      var ans;
      if (ok) {
        var okTxt = q.chosen_text != null && String(q.chosen_text) !== '' ? q.chosen_text : (q.correct_text != null ? q.correct_text : (q.chosen != null ? q.chosen : q.correct));
        ans = '<span class="qans"><span class="qgood">' + esc(okTxt || '') + (q.chosen ? ' (' + esc(q.chosen) + ')' : '') + '</span></span>';
      } else {
        var stud = (q.chosen != null && String(q.chosen) !== '')
          ? (esc(q.chosen_text != null && String(q.chosen_text) !== '' ? q.chosen_text : q.chosen) + (q.chosen != null ? ' (' + esc(q.chosen) + ')' : ''))
          : '— boş —';
        var corr = esc(q.correct_text != null && String(q.correct_text) !== '' ? q.correct_text : (q.correct || '')) + (q.correct != null ? ' (' + esc(q.correct) + ')' : '');
        ans = '<span class="qans">Öğrenci: <span class="qbad">' + stud + '</span> · Doğru: <span class="qgood">' + corr + '</span></span>';
      }
      return '<div class="ga-q ' + cls + '"><span class="qn">' + esc(String(q.n)) + '</span><span class="qmark">' + mark + '</span>'
        + '<span class="qtext">' + qtext + ans + '</span></div>';
    }).join('');
  }
  function hazirlikAttemptBlock(a) {
    var score = a.total_score;
    var passed = !!a.passed;
    var chipColor = passed ? '#1FA971' : '#c0392b';
    var when = fmtDate(a.created_at);
    var head = '<summary><span class="ga-secname">' + esc(a.exam_set || 'Deneme') + '</span>'
      + (when ? ' <span class="ga-when">' + esc(when) + '</span>' : '')
      + '<span class="ga-bchip" style="background:' + chipColor + '">' + (score != null ? score + '/100' : '—') + (passed ? ' · Geçti' : ' · Kaldı') + '</span></summary>';
    var body = '';
    if (a.mc_total) {
      var mp = pctOf(a.mc_total, a.mc_correct);
      body += '<div class="ga-row"><span class="n">Çoktan Seçmeli</span>' + bar(mp, accColor(mp)) + '<span class="p">%' + mp + ' (' + (a.mc_correct || 0) + '/' + (a.mc_total || 0) + ')</span></div>';
    }
    (a.sections || []).forEach(function (s) {
      var p = pctOf(s.total, s.correct);
      body += '<div class="ga-row"><span class="n">' + esc(hazirlikSecLabel(s.section)) + '</span>' + bar(p, accColor(p)) + '<span class="p">%' + p + ' (' + (s.correct || 0) + '/' + (s.total || 0) + ')</span></div>';
    });
    var qrows = hazirlikQuestionRows(a.questions);
    if (qrows) body += qrows;
    if (a.essay_text && String(a.essay_text).trim()) {
      var ev = a.essay_eval || null;
      body += '<div class="ga-essay"><div class="et">Yazma (Essay)'
        + (ev && ev.overall20 != null ? ' <span class="ga-chip">' + esc(ev.overall20) + '/20</span>' : '')
        + (ev && ev.cefr ? ' <span class="ga-chip mut">' + esc(ev.cefr) + '</span>' : '') + '</div>';
      if (a.essay_prompt) body += '<div class="ga-fb"><b>Soru:</b> ' + esc(String(a.essay_prompt)) + '</div>';
      body += '<div class="ga-essay-box">' + esc(String(a.essay_text)) + '</div>';
      if (ev) {
        var sc = ev.scores || {};
        var SCL = { content: 'İçerik', language: 'Dil', organisation: 'Organizasyon', communication: 'İletişim' };
        Object.keys(SCL).forEach(function (k) {
          if (sc[k] == null) return;
          var val = num1(sc[k]); if (val == null) return;
          var p = Math.max(0, Math.min(100, Math.round(val / 5 * 100)));
          body += '<div class="ga-row"><span class="n">' + SCL[k] + '</span>' + bar(p, accColor(p)) + '<span class="p">' + val + '/5</span></div>';
        });
        if (ev.comment) body += '<div class="ga-fb"><b>Yorum:</b> ' + esc(String(ev.comment)) + '</div>';
        if (ev.strengths) { var str = Array.isArray(ev.strengths) ? ev.strengths.join(', ') : String(ev.strengths); if (str.trim()) body += '<div class="ga-fb"><b>Güçlü yönler:</b> ' + esc(str) + '</div>'; }
      }
      body += '</div>';
    }
    return '<details class="ga-att">' + head + '<div class="ga-qs">' + (body || '<div class="ga-empty-mini">Döküm bulunamadı.</div>') + '</div></details>';
  }
  function buildHazirlik(d) {
    var detail = d.attempts_detail || [];
    if (!detail.length && !(d.attempts > 0)) return '<div class="ga-empty">Üniversite Hazırlık Atlama denemesi verisi yok.</div>';
    var scores = detail.map(function (a) { return a.total_score; }).filter(function (x) { return x != null; });
    var best = scores.length ? Math.max.apply(null, scores) : null;
    var passCount = detail.filter(function (a) { return !!a.passed; }).length;
    var html = '<div class="ga-cards">';
    html += card('En iyi skor', best, '/100', detail.length, true);
    html += card('Geçme', passCount, 'deneme', detail.length);
    html += card('Deneme', d.attempts != null ? d.attempts : detail.length, '', detail.length);
    html += '</div>';
    html += '<div class="ga-note">Üniversite Hazırlık Atlama deneme sonuçları · ' + (d.attempts != null ? d.attempts : detail.length) + ' deneme · geçme: ' + passCount + '.</div>';
    var goal = goalNum(d.goal);
    if (goal != null && best != null) {
      var gap = goal - best;
      var gColor = gap <= 0 ? '#1FA971' : (gap <= 10 ? '#B78A2E' : '#c0392b');
      var gapTxt = gap <= 0 ? 'hedefin üzerinde ▲' : ('hedefe ' + gap + ' puan var');
      html += '<div class="ga-goal">🎯 Hedef: <b>' + esc(String(d.goal)) + '</b>/100 · En iyi: <b>' + best + '</b>/100 · <b style="color:' + gColor + '">' + gapTxt + '</b></div>';
    } else if (d.goal) {
      html += '<div class="ga-goal">🎯 Hedef: <b>' + esc(String(d.goal)) + '</b></div>';
    }
    html += '<div class="ga-grp">Denemeler (' + detail.length + ')</div>';
    html += detail.map(hazirlikAttemptBlock).join('');
    // Bölüm bazlı zayıflık (verdict)
    var secAgg = {};
    detail.forEach(function (a) { (a.sections || []).forEach(function (s) { if (!secAgg[s.section]) secAgg[s.section] = { c: 0, t: 0 }; secAgg[s.section].c += s.correct || 0; secAgg[s.section].t += s.total || 0; }); });
    var weakest = null;
    Object.keys(secAgg).forEach(function (k) { if (!secAgg[k].t) return; var p = pctOf(secAgg[k].t, secAgg[k].c); if (weakest == null || p < weakest.p) weakest = { sec: k, p: p }; });
    var v = '<b>Üniversite Hazırlık Atlama</b>: ' + detail.length + ' deneme çözülmüş';
    if (best != null) v += ', en iyi skor <b>' + best + '</b>/100';
    v += '. ';
    if (passCount) v += passCount + ' denemede geçme barajı aşıldı. ';
    if (weakest) v += 'En zayıf bölüm: <b>' + esc(hazirlikSecLabel(weakest.sec)) + '</b> (%' + weakest.p + ') — bu bölüme ağırlık verilmeli.';
    html += '<div class="ga-verdict">' + v + '</div>';
    return html;
  }

  // ===== TOEFL denemeleri =====
  function toeflDenemeBlock(a) {
    var pct = a.percent;
    var chipColor = pct != null ? accColor(pct) : 'var(--teal,#2C5856)';
    var when = fmtDate(a.completed_at);
    var name = String(a.deneme_slug == null ? 'Deneme' : a.deneme_slug).replace(/^toefl-/, 'Deneme ').replace(/[-_]/g, ' ');
    var head = '<summary><span class="ga-secname">' + esc(name) + '</span>'
      + (when ? ' <span class="ga-when">' + esc(when) + '</span>' : '')
      + '<span class="ga-bchip" style="background:' + chipColor + '">' + (pct != null ? '%' + pct : '—') + (a.total_raw != null ? ' · ' + a.total_raw + '/' + (a.total_max != null ? a.total_max : '—') : '') + '</span></summary>';
    var body = '';
    function secBar(label, raw, max) {
      if (raw == null) return '';
      var p = max ? pctOf(max, raw) : 0;
      return '<div class="ga-row"><span class="n">' + label + '</span>' + bar(p, accColor(p)) + '<span class="p">' + raw + '/' + max + '</span></div>';
    }
    body += secBar('Grammar', a.grammar_raw, 18);
    body += secBar('Spelling', a.spelling_raw, 9);
    body += secBar('Reading', a.reading_raw, 25);
    return '<details class="ga-att">' + head + '<div class="ga-qs">' + (body || '<div class="ga-empty-mini">Bölüm dökümü yok.</div>') + '</div></details>';
  }
  function buildToeflDeneme(d) {
    var detail = d.attempts_detail || [];
    if (!detail.length && !(d.attempts > 0)) return '<div class="ga-empty">TOEFL deneme verisi yok.</div>';
    var html = '<div class="ga-cards">';
    html += card('En iyi', d.best_percent, '%', detail.length, true);
    if (d.best_total_raw != null) html += card('En iyi ham', d.best_total_raw, '/' + (d.total_max != null ? d.total_max : '—'), detail.length);
    html += card('Deneme', d.attempts != null ? d.attempts : detail.length, '', detail.length);
    html += '</div>';
    html += '<div class="ga-note">TOEFL deneme sonuçları · ' + (d.attempts != null ? d.attempts : detail.length) + ' deneme.</div>';
    html += '<div class="ga-grp">Denemeler (' + detail.length + ')</div>';
    html += detail.map(toeflDenemeBlock).join('');
    // en zayıf bölüm (ortalama %)
    var agg = { grammar_raw: { c: 0, t: 0, m: 18, l: 'Grammar' }, spelling_raw: { c: 0, t: 0, m: 9, l: 'Spelling' }, reading_raw: { c: 0, t: 0, m: 25, l: 'Reading' } };
    detail.forEach(function (a) { ['grammar_raw', 'spelling_raw', 'reading_raw'].forEach(function (k) { if (a[k] != null) { agg[k].c += a[k]; agg[k].t += agg[k].m; } }); });
    var weakest = null;
    Object.keys(agg).forEach(function (k) { if (!agg[k].t) return; var p = pctOf(agg[k].t, agg[k].c); if (weakest == null || p < weakest.p) weakest = { l: agg[k].l, p: p }; });
    var v = '<b>TOEFL Denemeleri</b>: ' + (d.attempts != null ? d.attempts : detail.length) + ' deneme çözülmüş';
    if (d.best_percent != null) v += ', en iyi %' + d.best_percent;
    if (d.best_total_raw != null && d.total_max != null) v += ' (' + d.best_total_raw + '/' + d.total_max + ')';
    v += '. ';
    if (weakest) v += 'En zayıf bölüm: <b>' + esc(weakest.l) + '</b> (%' + weakest.p + ') — bu bölüme ağırlık verilmeli.';
    html += '<div class="ga-verdict">' + v + '</div>';
    return html;
  }

  // ===== Genel İngilizce sınavları (midterm / final) =====
  function buildGe(d) {
    var results = d.results || [];
    if (!results.length) return '<div class="ga-empty">Genel İngilizce sınav verisi yok.</div>';
    var EXL = { midterm: 'Ara Sınav', final: 'Final' };
    var pcts = results.map(function (r) { return r.pct; }).filter(function (x) { return x != null; });
    var best = pcts.length ? Math.max.apply(null, pcts) : null;
    var passCount = results.filter(function (r) { return !!r.passed; }).length;
    var html = '<div class="ga-cards">';
    html += card('En iyi', best, '%', results.length, true);
    html += card('Geçme', passCount, 'sınav', results.length);
    html += card('Sınav', results.length, '', results.length);
    html += '</div>';
    html += '<div class="ga-note">Genel İngilizce sınav sonuçları · ' + results.length + ' sınav · geçme: ' + passCount + '.</div>';
    html += '<div class="ga-grp">Sınav Sonuçları (' + results.length + ')</div>';
    html += results.map(function (r) {
      var when = fmtDate(r.taken_at);
      var examL = EXL[r.exam] || (r.exam || '');
      var name = (r.level ? esc(r.level) + ' · ' : '') + esc(examL) + (when ? ' <span class="ga-when">' + esc(when) + '</span>' : '');
      var pct = r.pct;
      var chipColor = pct != null ? accColor(pct) : 'var(--teal,#2C5856)';
      var badge = r.passed ? '<span class="ga-chip" style="background:#1FA971">Geçti</span>' : '<span class="ga-chip" style="background:#c0392b">Kaldı</span>';
      return '<div class="ga-row"><span class="n" style="flex:0 0 42%;">' + name + '</span>'
        + bar(pct != null ? pct : 0, chipColor)
        + '<span class="p">' + (r.score != null ? r.score : '—') + '/' + (r.total != null ? r.total : '—') + ' · %' + (pct != null ? pct : '—') + '</span> ' + badge + '</div>';
    }).join('');
    var v = '<b>Genel İngilizce Sınavları</b>: ' + results.length + ' sınav sonucu';
    if (best != null) v += ', en iyi %' + best;
    v += '. ' + passCount + '/' + results.length + ' sınav geçildi.';
    html += '<div class="ga-verdict">' + v + '</div>';
    return html;
  }

  function printAnalysis(sel, body, studentLabel) {
    var win = window.open('', '_blank', 'width=820,height=940');
    if (!win) { alert('PDF için açılır pencereye izin ver.'); return; }
    var examLabel = (sel && sel.selectedOptions && sel.selectedOptions[0]) ? sel.selectedOptions[0].textContent : '';
    var when = new Date().toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' });
    var doc = '<!doctype html><html><head><meta charset="utf-8"><title>Sınav Analizi</title><style>'
      + 'body{font-family:Inter,-apple-system,system-ui,sans-serif;color:#1a2230;margin:28px;}'
      + ':root{--teal:#2C5856;--line:#e2dccc;--text:#1a2230;--text-muted:#6b6862;--bg-card:#fff;--font-display:Georgia,serif;}'
      + 'h1{font-family:Georgia,serif;font-size:20px;margin:0 0 2px;}.ga-sub{color:#6b6862;font-size:12px;margin-bottom:18px;}'
      + CSS + '.ga-assign{display:none!important;}'
      + '</style></head><body>'
      + '<h1>Sınav Analizi — ' + esc(studentLabel || 'Öğrenci') + '</h1>'
      + '<div class="ga-sub">' + esc(examLabel) + ' · ' + esc(when) + ' · Gri English</div>'
      + '<div class="ga">' + (body ? body.innerHTML.replace(/<details/g, '<details open') : '') + '</div>'
      + '<scr' + 'ipt>window.onload=function(){setTimeout(function(){window.print();},300);};</scr' + 'ipt>'
      + '</body></html>';
    win.document.open(); win.document.write(doc); win.document.close();
  }

  function mount(opts) {
    var sb = opts.sb, cont = opts.container, userId = opts.userId, onAssign = opts.onAssign;
    if (!sb || !cont || !userId) return;
    _sb = sb;
    injectCSS();
    cont.innerHTML = '<div class="ga"><div class="ga-head"><select class="ga-exam"><option>Yükleniyor…</option></select><button class="ga-print" type="button">PDF / Yazdır</button></div><div class="ga-body ga-empty">Yükleniyor…</div></div>';
    var sel = cont.querySelector('.ga-exam'), body = cont.querySelector('.ga-body'), printBtn = cont.querySelector('.ga-print');
    if (printBtn) { printBtn.addEventListener('click', function () { printAnalysis(sel, body, opts.studentLabel); }); }

    function render(exam) {
      body.className = 'ga-body ga-empty'; body.textContent = 'Analiz ediliyor…';
      var rpc, arg;
      if (exam === 'ielts') { rpc = 'admin_user_ielts_analysis'; arg = { p_user_id: userId }; }
      else if (exam === 'vocab') { rpc = 'admin_user_vocab_analysis'; arg = { p_user_id: userId }; }
      else if (exam === 'sat_deneme') { rpc = 'admin_user_sat_deneme_analysis'; arg = { p_user_id: userId }; }
      else if (exam === 'hazirlik') { rpc = 'admin_user_hazirlik_analysis'; arg = { p_user_id: userId }; }
      else if (exam === 'toefl_deneme') { rpc = 'admin_user_toefl_deneme_analysis'; arg = { p_user_id: userId }; }
      else if (exam === 'ge') { rpc = 'admin_user_ge_analysis'; arg = { p_user_id: userId }; }
      else { rpc = 'admin_user_exam_analysis'; arg = { p_user_id: userId, p_exam: exam }; }
      sb.rpc(rpc, arg).then(function (r) {
        if (r.error) throw r.error;
        body.className = 'ga-body';
        var d = r.data || {};
        if (exam === 'ielts') { body.innerHTML = buildIelts(d); attachGriHandlers(body); }
        else if (exam === 'vocab') { body.innerHTML = buildVocab(d); }
        else if (exam === 'sat_deneme') { body.innerHTML = buildSatDeneme(d); }
        else if (exam === 'hazirlik') { body.innerHTML = buildHazirlik(d); }
        else if (exam === 'toefl_deneme') { body.innerHTML = buildToeflDeneme(d); }
        else if (exam === 'ge') { body.innerHTML = buildGe(d); }
        else {
          body.innerHTML = build(exam, d, !!onAssign, opts.assignLabel);
          if (onAssign) { body.querySelectorAll('[data-assign-cat]').forEach(function (b) { b.addEventListener('click', function () { onAssign(exam, b.dataset.assignCat, b.dataset.assignLabel); }); }); }
        }
      }).catch(function () { body.className = 'ga-body ga-empty'; body.textContent = 'Analiz yüklenemedi.'; });
    }

    sb.rpc('admin_user_exams', { p_user_id: userId }).then(function (r) {
      if (r.error) throw r.error;
      var exams = r.data || [];
      // SAT öğrencisiyse "SAT Denemeleri"ni her zaman göster (0 olsa bile): atanan deneme çözüldü mü + skor takibi
      var hasSat = exams.some(function (e) { return e.exam === 'sat'; });
      var hasDen = exams.some(function (e) { return e.exam === 'sat_deneme'; });
      if (hasSat && !hasDen) { exams.push({ exam: 'sat_deneme', answered: 0 }); }
      // initialExam istenmiş ama admin_user_exams listelemiyorsa yine de seçilebilir + render edilebilir yap
      if (opts.initialExam && !exams.some(function (e) { return e.exam === opts.initialExam; })) { exams.push({ exam: opts.initialExam, answered: 0 }); }
      if (!exams.length) { sel.style.display = 'none'; if (printBtn) { printBtn.style.display = 'none'; } body.className = 'ga-body ga-empty'; body.textContent = 'Bu öğrenci soru bankası, IELTS denemesi ya da kelime çalışması yapmamış — analiz için henüz veri yok.'; return; }
      sel.innerHTML = exams.map(function (e) {
        var m = EXAM_META[e.exam] || { label: e.exam };
        var unit = (e.exam === 'sat_deneme' || e.exam === 'hazirlik' || e.exam === 'toefl_deneme') ? ' deneme' : (e.exam === 'ge' ? ' sınav' : ' soru');
        return '<option value="' + esc(e.exam) + '">' + esc(m.label) + ' (' + e.answered + unit + ')</option>';
      }).join('');
      sel.addEventListener('change', function () { render(sel.value); });
      var startExam = (opts.initialExam && exams.some(function (e) { return e.exam === opts.initialExam; })) ? opts.initialExam : exams[0].exam;
      sel.value = startExam;
      render(startExam);
    }).catch(function () { sel.style.display = 'none'; body.className = 'ga-body ga-empty'; body.textContent = 'Analiz yüklenemedi.'; });
  }

  window.GriAnalysis = { mount: mount };
})();
