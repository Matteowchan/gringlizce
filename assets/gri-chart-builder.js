/* gri-chart-builder.js — Task 1 veri grafiği oluşturucu (Writing Slice 2)
   Öğretmen modalında, GriChart renderer'ını kullanan düzenlenebilir bir grafik
   oluşturucu UI üretir: tür seç, veri gir, canlı önizle, otomatik alt-text (düzenlenebilir).
   AI/rastgele görsel YOK — tamamen öğretmenin girdiği veriye dayalı, deterministik.
   API: GriChartBuilder.init(rootEl); GriChartBuilder.getSpec() -> spec|null; .reset().
   getSpec yalnız "etkin" ve veri varken spec döndürür; submit handler bunu config.chart'a yazar. */
(function () {
  'use strict';
  if (window.GriChartBuilder) return;

  var root = null, altEdited = false;
  var TYPES = [['bar', 'Sütun'], ['line', 'Çizgi'], ['pie', 'Pasta'], ['donut', 'Halka'], ['table', 'Tablo'], ['process', 'Süreç']];

  function el(id) { return root ? root.querySelector(id) : null; }
  function csv(s) { return String(s || '').split(',').map(function (x) { return x.trim(); }).filter(function (x) { return x !== ''; }); }
  function nums(s) { return String(s || '').split(',').map(function (x) { var n = parseFloat(x.trim()); return isFinite(n) ? n : 0; }); }

  function ensureStyle() {
    if (document.getElementById('gri-cb-css')) return;
    var s = document.createElement('style'); s.id = 'gri-cb-css';
    s.textContent =
      '.cb-wrap{margin-top:1rem;padding:.85rem 1rem;background:var(--bg-soft,#F4EFE3);border:1px dashed var(--line-strong,#C9BCA0);border-radius:10px}' +
      '.cb-top{display:flex;align-items:center;justify-content:space-between;gap:.6rem}' +
      '.cb-top .cb-ttl{font-family:var(--font-ui,Inter),sans-serif;font-size:.82rem;font-weight:700;color:var(--text-soft,#6E6353)}' +
      '.cb-toggle{display:inline-flex;align-items:center;gap:.4rem;font-size:.84rem;color:var(--text);cursor:pointer;font-weight:400;text-transform:none;letter-spacing:normal}' +
      '.cb-toggle input{width:auto!important;margin:0!important}' +
      '.cb-body{margin-top:.8rem}' +
      '.cb-body[hidden]{display:none}' +
      '.cb-row{display:grid;grid-template-columns:1fr 1fr;gap:.6rem;margin-bottom:.5rem}' +
      '.cb-wrap label{font-family:var(--font-ui,Inter),sans-serif;font-size:.72rem;font-weight:600;letter-spacing:.02em;text-transform:none;color:var(--text-soft,#6E6353);margin:0 0 .2rem;display:block}' +
      '.cb-wrap input,.cb-wrap select,.cb-wrap textarea{width:100%;box-sizing:border-box;font-family:var(--font-ui,Inter),sans-serif;font-size:.86rem;padding:.45rem .55rem;border:1px solid var(--line,#E3D8C3);border-radius:8px;background:var(--bg-card,#FBF6EC);color:var(--text);margin:0}' +
      '.cb-wrap textarea{resize:vertical;min-height:56px;line-height:1.4}' +
      '.cb-ser{display:grid;grid-template-columns:1fr 1.4fr auto;gap:.5rem;align-items:end;margin-bottom:.45rem}' +
      '.cb-ser button,.cb-addser{font-family:var(--font-ui,Inter),sans-serif;font-size:.8rem;font-weight:700;border:1px solid var(--line-strong,#C9BCA0);background:var(--bg-card,#FBF6EC);color:var(--teal,#2E6E6A);border-radius:8px;padding:.4rem .6rem;cursor:pointer;width:auto}' +
      '.cb-addser{margin:.2rem 0 .3rem}' +
      '.cb-alt-row{display:flex;align-items:center;justify-content:space-between;gap:.5rem}' +
      '.cb-auto{font-size:.76rem;font-weight:700;color:var(--teal,#2E6E6A);background:none;border:none;cursor:pointer;padding:0;width:auto;text-decoration:underline;text-underline-offset:2px}' +
      '.cb-preview{margin-top:.8rem;padding:.7rem;background:var(--bg-card,#FBF6EC);border:1px solid var(--line,#E3D8C3);border-radius:10px;min-height:40px}' +
      '.cb-preview-lbl{font-size:.72rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--text-muted,#8B7F6B);margin:0 0 .4rem}' +
      '.cb-hint{font-size:.76rem;color:var(--text-muted,#8B7F6B);margin:.15rem 0 0;line-height:1.4}' +
      '@media(max-width:600px){.cb-row{grid-template-columns:1fr}.cb-ser{grid-template-columns:1fr}}';
    document.head.appendChild(s);
  }

  var series = [{ name: '', vals: '' }];

  function fieldsFor(type) {
    if (type === 'table') {
      return '<label>Başlık</label><input id="cb-title" placeholder="Tablo başlığı">' +
        '<div style="margin-top:.5rem"><label>Sütunlar (virgülle)</label><input id="cb-cols" placeholder="Ülke, 2020, 2021"></div>' +
        '<div style="margin-top:.5rem"><label>Satırlar (her satır bir satır; hücreler virgülle)</label><textarea id="cb-rows" placeholder="Türkiye, 10, 12&#10;Almanya, 20, 22"></textarea></div>';
    }
    if (type === 'process') {
      return '<label>Başlık</label><input id="cb-title" placeholder="Süreç başlığı">' +
        '<div style="margin-top:.5rem"><label>Adımlar (her adım bir satır)</label><textarea id="cb-steps" placeholder="Toplama&#10;Ayrıştırma&#10;Öğütme"></textarea></div>';
    }
    var isPie = (type === 'pie' || type === 'donut');
    var h = '<div class="cb-row"><div><label>Başlık</label><input id="cb-title" placeholder="Grafik başlığı"></div><div><label>Birim</label><input id="cb-unit" placeholder="%, milyon, °C"></div></div>';
    if (!isPie) h += '<div class="cb-row"><div><label>X ekseni etiketi</label><input id="cb-xlabel" placeholder="Yıl"></div><div><label>Y ekseni etiketi</label><input id="cb-ylabel" placeholder="Milyon $"></div></div>';
    h += '<label>' + (isPie ? 'Dilim etiketleri (virgülle)' : 'Kategoriler (virgülle)') + '</label><input id="cb-cats" placeholder="2019, 2020, 2021">';
    if (isPie) {
      h += '<div style="margin-top:.5rem"><label>Değerler (virgülle, kategori sırasıyla)</label><input id="cb-pievals" placeholder="52, 31, 17"></div>';
    } else {
      h += '<div style="margin-top:.6rem"><label>Seriler</label><div id="cb-series"></div><button type="button" class="cb-addser">+ Seri ekle</button></div>';
    }
    return h;
  }

  function renderSeries() {
    var box = el('#cb-series'); if (!box) return;
    box.innerHTML = series.map(function (s, i) {
      return '<div class="cb-ser" data-i="' + i + '">' +
        '<div><label>Ad</label><input class="cb-sname" value="' + (s.name || '').replace(/"/g, '&quot;') + '" placeholder="Seri ' + (i + 1) + '"></div>' +
        '<div><label>Değerler (virgülle)</label><input class="cb-svals" value="' + (s.vals || '').replace(/"/g, '&quot;') + '" placeholder="10, 25, 18"></div>' +
        '<button type="button" class="cb-delser" title="Seriyi sil" aria-label="Seriyi sil"' + (series.length <= 1 ? ' disabled style="opacity:.4"' : '') + '>×</button>' +
        '</div>';
    }).join('');
  }

  function buildSpec() {
    var type = el('#cb-type') ? el('#cb-type').value : 'bar';
    var spec = { type: type, title: (el('#cb-title') || {}).value || '', source: (el('#cb-source') || {}).value || '' };
    if (type === 'table') {
      spec.columns = csv((el('#cb-cols') || {}).value);
      spec.rows = String((el('#cb-rows') || {}).value || '').split('\n').map(function (l) { return csv(l); }).filter(function (r) { return r.length; });
    } else if (type === 'process') {
      spec.steps = String((el('#cb-steps') || {}).value || '').split('\n').map(function (x) { return x.trim(); }).filter(Boolean);
    } else {
      spec.unit = (el('#cb-unit') || {}).value || '';
      spec.categories = csv((el('#cb-cats') || {}).value);
      if (type === 'pie' || type === 'donut') {
        spec.series = [{ name: '', values: nums((el('#cb-pievals') || {}).value) }];
      } else {
        spec.xLabel = (el('#cb-xlabel') || {}).value || '';
        spec.yLabel = (el('#cb-ylabel') || {}).value || '';
        // sync series[] from inputs
        var rows = root.querySelectorAll('.cb-ser');
        series = [].map.call(rows, function (r) { return { name: r.querySelector('.cb-sname').value, vals: r.querySelector('.cb-svals').value }; });
        if (!series.length) series = [{ name: '', vals: '' }];
        spec.series = series.map(function (s) { return { name: s.name, values: nums(s.vals) }; });
      }
    }
    spec.alt = (el('#cb-alt') || {}).value || '';
    return spec;
  }

  function hasData(spec) {
    if (!spec) return false;
    if (spec.type === 'table') return (spec.columns && spec.columns.length) || (spec.rows && spec.rows.length);
    if (spec.type === 'process') return spec.steps && spec.steps.length;
    return (spec.categories && spec.categories.length) && spec.series && spec.series.some(function (s) { return s.values && s.values.length; });
  }

  function refresh() {
    if (!window.GriChart) return;
    var spec = buildSpec();
    // auto alt unless teacher edited
    if (!altEdited) { var a = el('#cb-alt'); if (a) { var auto = window.GriChart.altText(Object.assign({}, spec, { alt: '' })); a.value = auto; spec.alt = auto; } }
    var prev = el('#cb-preview');
    if (prev) prev.innerHTML = hasData(spec) ? window.GriChart.render(spec) : '<p class="cb-hint">Veri girdikçe önizleme burada görünecek.</p>';
    if (root) root.dataset.enabled = el('#cb-enable') && el('#cb-enable').checked ? '1' : '0';
  }

  function rebuildFields() {
    var type = el('#cb-type').value;
    el('#cb-fields').innerHTML = fieldsFor(type);
    if (type === 'bar' || type === 'line') { if (!series.length) series = [{ name: '', vals: '' }]; renderSeries(); }
    altEdited = false;
    refresh();
  }

  function init(rootEl) {
    root = typeof rootEl === 'string' ? document.querySelector(rootEl) : rootEl;
    if (!root || root.dataset.cbInit) return; root.dataset.cbInit = '1';
    ensureStyle();
    root.className = 'cb-wrap';
    root.innerHTML =
      '<div class="cb-top"><span class="cb-ttl">Task 1 veri grafiği</span>' +
      '<label class="cb-toggle"><input type="checkbox" id="cb-enable"> Veri grafiği oluştur</label></div>' +
      '<div class="cb-body" id="cb-body" hidden>' +
      '<label>Grafik türü</label><select id="cb-type">' + TYPES.map(function (t) { return '<option value="' + t[0] + '">' + t[1] + '</option>'; }).join('') + '</select>' +
      '<div id="cb-fields" style="margin-top:.5rem"></div>' +
      '<div style="margin-top:.5rem"><label>Kaynak notu (opsiyonel)</label><input id="cb-source" placeholder="Örn. Örnek veri / OECD 2022"></div>' +
      '<div style="margin-top:.5rem"><div class="cb-alt-row"><label>Alt metin (erişilebilirlik)</label><button type="button" class="cb-auto" id="cb-auto">Otomatik yenile</button></div><textarea id="cb-alt" placeholder="Otomatik üretilir; düzenleyebilirsin."></textarea></div>' +
      '<p class="cb-hint">Grafik öğrencinin promptunun yanında bu haliyle görünür. Alt metin görme engelli öğrenciler için okunur.</p>' +
      '<div class="cb-preview"><p class="cb-preview-lbl">Önizleme</p><div id="cb-preview"></div></div>' +
      '</div>';

    var body = el('#cb-body'), enable = el('#cb-enable');
    enable.addEventListener('change', function () { body.hidden = !enable.checked; if (enable.checked) rebuildFields(); refresh(); });
    el('#cb-type').addEventListener('change', rebuildFields);
    root.addEventListener('input', function (e) {
      if (e.target.id === 'cb-alt') altEdited = (e.target.value.trim() !== '');
      refresh();
    });
    root.addEventListener('click', function (e) {
      if (e.target.classList.contains('cb-addser')) { series = readSeries(); series.push({ name: '', vals: '' }); renderSeries(); refresh(); }
      else if (e.target.classList.contains('cb-delser') && !e.target.disabled) { series = readSeries(); var i = +e.target.closest('.cb-ser').dataset.i; series.splice(i, 1); if (!series.length) series = [{ name: '', vals: '' }]; renderSeries(); refresh(); }
      else if (e.target.id === 'cb-auto') { altEdited = false; refresh(); }
    });
    rebuildFields();
    body.hidden = true;
  }
  function readSeries() {
    var rows = root.querySelectorAll('.cb-ser');
    var arr = [].map.call(rows, function (r) { return { name: r.querySelector('.cb-sname').value, vals: r.querySelector('.cb-svals').value }; });
    return arr.length ? arr : [{ name: '', vals: '' }];
  }

  function getSpec() {
    if (!root || !el('#cb-enable') || !el('#cb-enable').checked) return null;
    var spec = buildSpec();
    return hasData(spec) ? spec : null;
  }
  function reset() { if (root) { var e = el('#cb-enable'); if (e) { e.checked = false; el('#cb-body').hidden = true; } } series = [{ name: '', vals: '' }]; altEdited = false; }

  window.GriChartBuilder = { init: init, getSpec: getSpec, reset: reset };
})();
