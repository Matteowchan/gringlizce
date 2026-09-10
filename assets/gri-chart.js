/* gri-chart.js — "Task 1 Veri Grafiği" renderer (Faz 7 / Writing Slice 2)
   Öğretmenin girdiği veriden DETERMİNİSTİK, düzenlenebilir, erişilebilir bir grafik
   üretir (AI/rastgele görsel YOK). Türler: bar, line, pie, donut, table, process.
   Spec → SVG/HTML string + otomatik alt-text. Hem öğretmen modal önizlemesi hem
   öğrenci sayfası aynı modülü kullanır. Tema-duyarlı (var(--...) fallback'li).
   Kullanım: GriChart.render(spec) -> html string; GriChart.altText(spec) -> string;
   GriChart.blank(type) -> boş örnek spec. */
(function () {
  'use strict';
  if (window.GriChart) return;

  var PALETTE = ['#2E6E6A', '#B78A2E', '#7A3B3B', '#2A3F66', '#3E7350', '#8A5A2C', '#6B3D58'];
  var W = 600, H = 380;

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function num(v) { var n = parseFloat(v); return isFinite(n) ? n : 0; }
  function fmt(v, unit) {
    var n = num(v);
    var s = (Math.round(n * 100) / 100).toString();
    return unit ? (unit === '%' ? s + '%' : s + ' ' + unit) : s;
  }
  function niceMax(m) {
    if (m <= 0) return 10;
    var pow = Math.pow(10, Math.floor(Math.log10(m)));
    var n = m / pow;
    var step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
    return step * pow;
  }
  function color(i) { return PALETTE[i % PALETTE.length]; }

  function seriesList(spec) {
    var s = spec.series;
    if (!Array.isArray(s) || !s.length) return [{ name: '', values: [] }];
    return s.map(function (x) { return { name: x && x.name != null ? x.name : '', values: (x && Array.isArray(x.values)) ? x.values.map(num) : [] }; });
  }
  function cats(spec) { return Array.isArray(spec.categories) ? spec.categories : []; }

  /* ---------- axes (bar + line ortak) ---------- */
  function axisFrame(spec, maxVal) {
    var mL = 56, mR = 22, mT = 44, mB = 60;
    var x0 = mL, x1 = W - mR, y0 = mT, y1 = H - mB;
    var top = niceMax(maxVal);
    var g = '';
    // title
    if (spec.title) g += '<text x="' + (W / 2) + '" y="26" text-anchor="middle" font-family="Georgia,serif" font-size="17" font-weight="700" fill="var(--text,#241E17)">' + esc(spec.title) + '</text>';
    // y gridlines + ticks (5)
    for (var t = 0; t <= 5; t++) {
      var val = top * t / 5;
      var y = y1 - (y1 - y0) * (t / 5);
      g += '<line x1="' + x0 + '" y1="' + y.toFixed(1) + '" x2="' + x1 + '" y2="' + y.toFixed(1) + '" stroke="var(--line,#E3D8C3)" stroke-width="1"/>';
      g += '<text x="' + (x0 - 8) + '" y="' + (y + 4).toFixed(1) + '" text-anchor="end" font-family="Inter,sans-serif" font-size="11" fill="var(--text-muted,#8B7F6B)">' + fmt(val, spec.unit) + '</text>';
    }
    // y axis label
    if (spec.yLabel) g += '<text transform="translate(15,' + ((y0 + y1) / 2) + ') rotate(-90)" text-anchor="middle" font-family="Inter,sans-serif" font-size="11.5" font-weight="600" fill="var(--text-soft,#6E6353)">' + esc(spec.yLabel) + '</text>';
    // x axis label
    if (spec.xLabel) g += '<text x="' + ((x0 + x1) / 2) + '" y="' + (H - 12) + '" text-anchor="middle" font-family="Inter,sans-serif" font-size="11.5" font-weight="600" fill="var(--text-soft,#6E6353)">' + esc(spec.xLabel) + '</text>';
    return { g: g, x0: x0, x1: x1, y0: y0, y1: y1, top: top };
  }

  function legend(names) {
    if (names.length < 2 && !(names.length === 1 && names[0])) return '';
    var items = names.map(function (n, i) {
      return '<span class="gc-leg-i"><span class="gc-leg-sw" style="background:' + color(i) + '"></span>' + esc(n || ('Seri ' + (i + 1))) + '</span>';
    }).join('');
    return '<div class="gc-legend">' + items + '</div>';
  }

  function svgWrap(inner, alt) {
    return '<svg class="gc-svg" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(alt) + '" xmlns="http://www.w3.org/2000/svg"><title>' + esc(alt) + '</title>' + inner + '</svg>';
  }

  /* ---------- BAR (gruplu) ---------- */
  function renderBar(spec) {
    var c = cats(spec), ser = seriesList(spec);
    var maxV = 0; ser.forEach(function (s) { s.values.forEach(function (v) { if (v > maxV) maxV = v; }); });
    var f = axisFrame(spec, maxV);
    var plotW = f.x1 - f.x0, plotH = f.y1 - f.y0;
    var n = Math.max(1, c.length), gw = plotW / n;
    var bw = (gw * 0.72) / ser.length;
    var g = f.g;
    // baseline
    g += '<line x1="' + f.x0 + '" y1="' + f.y1 + '" x2="' + f.x1 + '" y2="' + f.y1 + '" stroke="var(--line-strong,#C9BCA0)" stroke-width="1.5"/>';
    c.forEach(function (cat, ci) {
      var gx = f.x0 + gw * ci + gw * 0.14;
      ser.forEach(function (s, si) {
        var v = num(s.values[ci]);
        var h = f.top > 0 ? (plotH * v / f.top) : 0;
        var x = gx + bw * si;
        g += '<rect x="' + x.toFixed(1) + '" y="' + (f.y1 - h).toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + h.toFixed(1) + '" fill="' + color(si) + '" rx="2"><title>' + esc((s.name ? s.name + ' — ' : '') + cat + ': ' + fmt(v, spec.unit)) + '</title></rect>';
      });
      g += '<text x="' + (f.x0 + gw * ci + gw / 2).toFixed(1) + '" y="' + (f.y1 + 16) + '" text-anchor="middle" font-family="Inter,sans-serif" font-size="11" fill="var(--text,#241E17)">' + esc(cat) + '</text>';
    });
    return svgWrap(g, altText(spec));
  }

  /* ---------- LINE ---------- */
  function renderLine(spec) {
    var c = cats(spec), ser = seriesList(spec);
    var maxV = 0; ser.forEach(function (s) { s.values.forEach(function (v) { if (v > maxV) maxV = v; }); });
    var f = axisFrame(spec, maxV);
    var plotW = f.x1 - f.x0, plotH = f.y1 - f.y0;
    var n = Math.max(1, c.length);
    var step = n > 1 ? plotW / (n - 1) : 0;
    var xAt = function (i) { return n > 1 ? f.x0 + step * i : f.x0 + plotW / 2; };
    var yAt = function (v) { return f.y1 - (f.top > 0 ? plotH * num(v) / f.top : 0); };
    var g = f.g;
    g += '<line x1="' + f.x0 + '" y1="' + f.y1 + '" x2="' + f.x1 + '" y2="' + f.y1 + '" stroke="var(--line-strong,#C9BCA0)" stroke-width="1.5"/>';
    ser.forEach(function (s, si) {
      var pts = c.map(function (_, i) { return xAt(i).toFixed(1) + ',' + yAt(s.values[i]).toFixed(1); }).join(' ');
      g += '<polyline points="' + pts + '" fill="none" stroke="' + color(si) + '" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>';
      c.forEach(function (_, i) { g += '<circle cx="' + xAt(i).toFixed(1) + '" cy="' + yAt(s.values[i]).toFixed(1) + '" r="3.5" fill="' + color(si) + '"><title>' + esc((s.name ? s.name + ' — ' : '') + c[i] + ': ' + fmt(s.values[i], spec.unit)) + '</title></circle>'; });
    });
    c.forEach(function (cat, i) { g += '<text x="' + xAt(i).toFixed(1) + '" y="' + (f.y1 + 16) + '" text-anchor="middle" font-family="Inter,sans-serif" font-size="11" fill="var(--text,#241E17)">' + esc(cat) + '</text>'; });
    return svgWrap(g, altText(spec));
  }

  /* ---------- PIE / DONUT ---------- */
  function renderPie(spec, donut) {
    var c = cats(spec), s0 = seriesList(spec)[0];
    var vals = c.map(function (_, i) { return num(s0.values[i]); });
    var total = vals.reduce(function (a, b) { return a + b; }, 0) || 1;
    var cx = W / 2, cy = 200, r = 120, ir = donut ? 62 : 0;
    var g = '';
    if (spec.title) g += '<text x="' + (W / 2) + '" y="26" text-anchor="middle" font-family="Georgia,serif" font-size="17" font-weight="700" fill="var(--text,#241E17)">' + esc(spec.title) + '</text>';
    var ang = -Math.PI / 2;
    vals.forEach(function (v, i) {
      var frac = v / total, a2 = ang + frac * 2 * Math.PI;
      var large = frac > 0.5 ? 1 : 0;
      var x1 = cx + r * Math.cos(ang), y1 = cy + r * Math.sin(ang);
      var x2 = cx + r * Math.cos(a2), y2 = cy + r * Math.sin(a2);
      var d;
      if (frac >= 0.9999) { // full circle
        d = 'M ' + (cx - r) + ' ' + cy + ' A ' + r + ' ' + r + ' 0 1 1 ' + (cx + r) + ' ' + cy + ' A ' + r + ' ' + r + ' 0 1 1 ' + (cx - r) + ' ' + cy + ' Z';
      } else {
        d = 'M ' + cx + ' ' + cy + ' L ' + x1.toFixed(1) + ' ' + y1.toFixed(1) + ' A ' + r + ' ' + r + ' 0 ' + large + ' 1 ' + x2.toFixed(1) + ' ' + y2.toFixed(1) + ' Z';
      }
      g += '<path d="' + d + '" fill="' + color(i) + '"><title>' + esc(c[i] + ': ' + fmt(v, spec.unit) + ' (' + Math.round(frac * 100) + '%)') + '</title></path>';
      // percent label
      var mid = ang + frac * Math.PI, lr = donut ? (r + ir) / 2 : r * 0.62;
      if (frac > 0.05) g += '<text x="' + (cx + lr * Math.cos(mid)).toFixed(1) + '" y="' + (cy + lr * Math.sin(mid) + 4).toFixed(1) + '" text-anchor="middle" font-family="Inter,sans-serif" font-size="12" font-weight="700" fill="#fff">' + Math.round(frac * 100) + '%</text>';
      ang = a2;
    });
    if (donut) g += '<circle cx="' + cx + '" cy="' + cy + '" r="' + ir + '" fill="var(--bg-card,#FBF6EC)"/>';
    return svgWrap(g, altText(spec));
  }

  /* ---------- TABLE ---------- */
  function renderTable(spec) {
    var cols = Array.isArray(spec.columns) ? spec.columns : [];
    var rows = Array.isArray(spec.rows) ? spec.rows : [];
    var h = '<table class="gc-table"><caption>' + esc(spec.title || 'Tablo') + '</caption>';
    if (cols.length) { h += '<thead><tr>' + cols.map(function (c) { return '<th scope="col">' + esc(c) + '</th>'; }).join('') + '</tr></thead>'; }
    h += '<tbody>' + rows.map(function (r) {
      return '<tr>' + (Array.isArray(r) ? r : []).map(function (cell, ci) { return ci === 0 ? '<th scope="row">' + esc(cell) + '</th>' : '<td>' + esc(cell) + '</td>'; }).join('') + '</tr>';
    }).join('') + '</tbody></table>';
    return h;
  }

  /* ---------- PROCESS (şematik bloklar) ---------- */
  function renderProcess(spec) {
    var steps = Array.isArray(spec.steps) ? spec.steps : [];
    var h = '';
    if (spec.title) h += '<p class="gc-proc-title">' + esc(spec.title) + '</p>';
    h += '<ol class="gc-process" aria-label="' + esc(spec.title || 'Süreç') + '">';
    steps.forEach(function (s, i) {
      h += '<li class="gc-proc-step"><span class="gc-proc-n">' + (i + 1) + '</span><span class="gc-proc-t">' + esc(s) + '</span></li>';
      if (i < steps.length - 1) h += '<li class="gc-proc-arrow" aria-hidden="true">→</li>';
    });
    h += '</ol>';
    return h;
  }

  /* ---------- alt-text ---------- */
  function altText(spec) {
    if (spec.alt && String(spec.alt).trim()) return String(spec.alt).trim();
    var t = spec.type, c = cats(spec), ser = seriesList(spec);
    var tname = { bar: 'Sütun grafiği', line: 'Çizgi grafiği', pie: 'Pasta grafiği', donut: 'Halka grafiği', table: 'Tablo', process: 'Süreç şeması' }[t] || 'Grafik';
    var parts = [tname + (spec.title ? ': ' + spec.title : '') + '.'];
    if (t === 'table') {
      parts.push((spec.columns || []).join(', ') + ' sütunlu, ' + (spec.rows || []).length + ' satırlık tablo.');
    } else if (t === 'process') {
      parts.push((spec.steps || []).length + ' adımlı süreç: ' + (spec.steps || []).join(' → ') + '.');
    } else if (t === 'pie' || t === 'donut') {
      var vals = c.map(function (_, i) { return num(ser[0].values[i]); });
      var total = vals.reduce(function (a, b) { return a + b; }, 0) || 1;
      parts.push(c.map(function (cat, i) { return cat + ' %' + Math.round(vals[i] / total * 100); }).join(', ') + '.');
    } else {
      // bar/line: describe each series' range
      ser.forEach(function (s) {
        var vs = s.values.map(num);
        if (!vs.length) return;
        var max = Math.max.apply(null, vs), min = Math.min.apply(null, vs);
        var maxI = vs.indexOf(max), minI = vs.indexOf(min);
        parts.push((s.name ? s.name + ': ' : '') + (spec.xLabel ? spec.xLabel + ' boyunca ' : '') + 'en yüksek ' + fmt(max, spec.unit) + ' (' + (c[maxI] || '') + '), en düşük ' + fmt(min, spec.unit) + ' (' + (c[minI] || '') + ').');
      });
    }
    if (spec.source) parts.push('Kaynak: ' + spec.source + '.');
    return parts.join(' ');
  }

  /* ---------- ana render ---------- */
  function render(spec) {
    if (!spec || !spec.type) return '';
    var body;
    switch (spec.type) {
      case 'bar': body = renderBar(spec); break;
      case 'line': body = renderLine(spec); break;
      case 'pie': body = renderPie(spec, false); break;
      case 'donut': body = renderPie(spec, true); break;
      case 'table': body = renderTable(spec); break;
      case 'process': body = renderProcess(spec); break;
      default: return '';
    }
    var isChart = /^(bar|line|pie|donut)$/.test(spec.type);
    var leg = isChart ? legend(seriesList(spec).map(function (s) { return s.name; })) : '';
    // pie/donut legend uses categories, not series
    if (spec.type === 'pie' || spec.type === 'donut') leg = legend(cats(spec));
    ensureStyle();
    return '<figure class="gc-fig" role="group" aria-label="' + esc(altText(spec)) + '">' + body + leg +
      (spec.source ? '<figcaption class="gc-source">Kaynak: ' + esc(spec.source) + '</figcaption>' : '') + '</figure>';
  }

  function blank(type) {
    var base = { type: type, title: '', source: '', alt: '' };
    if (type === 'table') return Object.assign(base, { columns: ['', '', ''], rows: [['', '', ''], ['', '', '']] });
    if (type === 'process') return Object.assign(base, { steps: ['', '', ''] });
    return Object.assign(base, { xLabel: '', yLabel: '', unit: '', categories: ['', '', ''], series: [{ name: '', values: [0, 0, 0] }] });
  }

  function ensureStyle() {
    if (document.getElementById('gri-chart-css')) return;
    var s = document.createElement('style'); s.id = 'gri-chart-css';
    s.textContent =
      '.gc-fig{margin:0;font-family:var(--font-ui,Inter,system-ui,sans-serif)}' +
      '.gc-svg{display:block;width:100%;height:auto;max-width:560px;margin:0 auto}' +
      '.gc-legend{display:flex;flex-wrap:wrap;gap:.4rem 1rem;justify-content:center;margin:.5rem 0 0}' +
      '.gc-leg-i{display:inline-flex;align-items:center;gap:.35rem;font-size:.82rem;color:var(--text-soft,#6E6353)}' +
      '.gc-leg-sw{width:12px;height:12px;border-radius:3px;display:inline-block;flex:none}' +
      '.gc-source{font-size:.76rem;color:var(--text-muted,#8B7F6B);text-align:center;margin:.5rem 0 0;font-style:italic}' +
      '.gc-table{border-collapse:collapse;width:100%;max-width:560px;margin:0 auto;font-size:.9rem;color:var(--text,#241E17)}' +
      '.gc-table caption{font-family:var(--font-display,Georgia,serif);font-size:1.05rem;font-weight:700;margin:0 0 .5rem;color:var(--text,#241E17)}' +
      '.gc-table th,.gc-table td{border:1px solid var(--line,#E3D8C3);padding:.45rem .6rem;text-align:left;font-variant-numeric:tabular-nums}' +
      '.gc-table thead th{background:var(--bg-soft,#F4EFE3);font-weight:700}' +
      '.gc-table tbody th{background:var(--bg-soft,#F4EFE3);font-weight:600}' +
      '.gc-proc-title{font-family:var(--font-display,Georgia,serif);font-size:1.05rem;font-weight:700;text-align:center;margin:0 0 .6rem;color:var(--text,#241E17)}' +
      '.gc-process{list-style:none;display:flex;flex-wrap:wrap;align-items:stretch;justify-content:center;gap:.5rem;padding:0;margin:0}' +
      '.gc-proc-step{display:flex;align-items:center;gap:.5rem;background:var(--bg-soft,#F4EFE3);border:1px solid var(--line,#E3D8C3);border-left:3px solid var(--teal,#2E6E6A);border-radius:10px;padding:.55rem .8rem;font-size:.9rem;color:var(--text,#241E17);max-width:220px}' +
      '.gc-proc-n{flex:none;width:22px;height:22px;border-radius:50%;background:var(--teal,#2E6E6A);color:#fff;display:flex;align-items:center;justify-content:center;font-size:.78rem;font-weight:700}' +
      '.gc-proc-arrow{display:flex;align-items:center;color:var(--text-muted,#8B7F6B);font-size:1.2rem;font-weight:700}';
    document.head.appendChild(s);
  }

  window.GriChart = { render: render, altText: altText, blank: blank, PALETTE: PALETTE };
})();
