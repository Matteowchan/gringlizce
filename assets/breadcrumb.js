/* ============================================================
   GRI ENGLISH — Breadcrumb + Sticky Category Subnav
   ============================================================
   Header'ın altında yapışkan tek bir bar oluşturur.
     Sol: Ana Sayfa › Kategori › Bu Sayfa  (tıklanabilir crumbs)
     Sağ: Mevcut kategorinin alt sayfa shortcut'ları (aktif highlight)

   Kullanım:
     <script src="assets/breadcrumb.js" defer></script>            (root)
     <script src="../assets/breadcrumb.js" defer></script>         (urun/)

   Otomatik gizleme:
     - Aktif kamp/sınav UI'sı varsa (.topbar veya .sc-brand-bar)
       bar oluşturulmaz. Kullanıcının dikkati dağılmasın.
   ============================================================ */
(function () {
  'use strict';

  // ----------- KATEGORİ TANIMLARI ------------
  // Her kategori: anasayfa + alt sayfa shortcut'ları
  var CATEGORIES = {
    sat: {
      label: 'SAT',
      home: 'sat.html',
      subnav: [
        { label: 'Soru Bankası', href: 'sat-soru-bankasi.html' },
        { label: 'Öğren',        href: 'sat-ogren.html' },
        { label: 'Coaching',     href: 'sat-coaching.html' }
      ]
    },
    ielts: {
      label: 'IELTS',
      home: 'ielts.html',
      subnav: [
        { label: 'Tam Deneme',       href: 'ielts-deneme.html' },
        { label: 'Soru Bankası',     href: 'ielts-soru-bankasi.html' },
        { label: 'Bölüm Çalışma',    href: 'ielts-bolum-calisma.html' },
        { label: 'Writing',          href: 'ielts-writing-task1.html' },
        { label: 'Coaching',         href: 'ielts-coaching.html' }
      ]
    },
    toefl: {
      label: 'TOEFL',
      home: 'toefl.html',
      subnav: [
        { label: 'Soru Bankası',  href: 'toefl-soru-bankasi.html' },
        { label: 'Reading',       href: 'toefl-soru-bankasi-reading.html' },
        { label: 'Writing',       href: 'toefl-writing.html' },
        { label: 'Coaching',      href: 'toefl-coaching.html' }
      ]
    },
    ib: {
      label: 'IB',
      home: 'ib.html',
      subnav: [
        { label: 'English B SL',  href: 'ib-english-b-sl.html' },
        { label: 'English B HL',  href: 'ib-english-b-hl.html' },
        { label: 'TOK',           href: 'ib-tok.html' },
        { label: 'Yazı Pratiği',  href: 'ib-yazi-pratigi.html' },
        { label: 'Soru Bankası',  href: 'ib-soru-bankasi.html' },
        { label: 'Öğren',         href: 'ib-ogren.html' },
        { label: 'Coaching',      href: 'ib-coaching.html' }
      ]
    },
    ydt: {
      label: 'YDT',
      home: 'ydt.html',
      subnav: [
        { label: 'Soru Bankası',  href: 'ydt-soru-bankasi.html' },
        { label: 'Öğren',         href: 'ydt-ogren.html' },
        { label: 'YDT-YDS',       href: 'ydt-yds.html' },
        { label: 'Coaching',      href: 'ydt-coaching.html' }
      ]
    },
    yds: {
      label: 'YDS',
      home: 'yds.html',
      subnav: [
        { label: 'Soru Bankası',     href: 'yds-soru-bankasi.html' },
        { label: 'YDS',              href: 'yds-soru-bankasi-yds.html' },
        { label: 'YÖKDİL Fen',       href: 'yds-soru-bankasi-yokdil-fen.html' },
        { label: 'YÖKDİL Sağlık',    href: 'yds-soru-bankasi-yokdil-saglik.html' },
        { label: 'YÖKDİL Sosyal',    href: 'yds-soru-bankasi-yokdil-sosyal.html' },
        { label: 'Öğren',            href: 'yds-ogren.html' },
        { label: 'Coaching',         href: 'yds-coaching.html' }
      ]
    },
    udsp: {
      label: 'UDSP',
      home: 'udsp.html',
      subnav: [
        { label: 'Soru Bankası', href: 'udsp-soru-bankasi.html' }
      ]
    }
  };

  // ----------- SAYFA BAŞLIKLARI ------------
  // Dosya adı → görünür crumb metni
  var PAGE_LABELS = {
    'index.html': 'Ana Sayfa',
    'sat.html': 'SAT',
    'sat-coaching.html': 'Coaching',
    'sat-ders-notlari.html': 'Ders Notları',
    'sat-rw-ders-notlari.html': 'RW Ders Notları',
    'sat-math-ders-notlari.html': 'Math Ders Notları',
    'sat-soru-bankasi.html': 'Soru Bankası',
    'sat-soru-bankasi-rw.html': 'Reading & Writing',
    'sat-soru-bankasi-math.html': 'Math',
    'sat-rw-cross-text-connections-1.html': 'Cross-Text Connections',

    'ielts.html': 'IELTS',
    'ielts-coaching.html': 'Coaching',
    'ielts-ders-notlari.html': 'Ders Notları',
    'ielts-soru-bankasi.html': 'Soru Bankası',
    'ielts-bolum-calisma.html': 'Bölüm Çalışması',
    'ielts-deneme.html': 'Tam Deneme',
    'ielts-deneme-listening.html': 'Listening',
    'ielts-deneme-reading.html': 'Reading',
    'ielts-deneme-writing.html': 'Writing',
    'ielts-deneme-sonuc.html': 'Sonuç',
    'ielts-deneme-writing-feedback.html': 'Writing Feedback',
    'ielts-writing-feedback.html': 'Writing Feedback',

    'toefl.html': 'TOEFL',
    'toefl-coaching.html': 'Coaching',
    'toefl-ders-notlari.html': 'Ders Notları',
    'toefl-soru-bankasi.html': 'Soru Bankası',
    'toefl-soru-bankasi-reading.html': 'Reading',
    'toefl-writing-practice.html': 'Writing Pratiği',

    'ib.html': 'IB',
    'ib-coaching.html': 'Coaching',
    'ib-ders-notlari.html': 'Ders Notları',
    'ib-english-b-sl.html': 'English B SL',
    'ib-english-b-hl.html': 'English B HL',
    'ib-tok.html': 'TOK',
    'ib-yazi-pratigi.html': 'Yazı Pratiği',
    'ib-yazi-pratigi-blog.html': 'Yazı Pratiği Blog',
    'ib-yazi-pratigi-wizard.html': 'Yazı Pratiği Wizard',
    'ib-soru-bankasi.html': 'Soru Bankası',

    'udsp.html': 'UDSP',
    'udsp-soru-bankasi.html': 'Soru Bankası',

    'ydt.html': 'YDT',
    'ydt-coaching.html': 'Coaching',
    'ydt-ders-notlari.html': 'Ders Notları',
    'ydt-soru-bankasi.html': 'Soru Bankası',
    'ydt-conditionals.html': 'Conditionals',
    'ydt-modals.html': 'Modals',
    'ydt-relative-clauses.html': 'Relative Clauses',
    'ydt-tenses.html': 'Tenses',
    'ydt-yds.html': 'YDT-YDS',

    'yds.html': 'YDS',
    'yds-coaching.html': 'Coaching',
    'yds-ders-notlari.html': 'Ders Notları',
    'yds-soru-bankasi.html': 'Soru Bankası',
    'yds-soru-bankasi-yds.html': 'YDS',
    'yds-soru-bankasi-yokdil-fen.html': 'YÖKDİL Fen',
    'yds-soru-bankasi-yokdil-saglik.html': 'YÖKDİL Sağlık',
    'yds-soru-bankasi-yokdil-sosyal.html': 'YÖKDİL Sosyal',
    'yds-mini-deneme-1.html': 'Mini Deneme 1',
    'yds-mini-deneme-2.html': 'Mini Deneme 2',
    'yds-mini-deneme-3.html': 'Mini Deneme 3',

    'soru-bankasi.html': 'Soru Bankası',
    'ders-notlari.html': 'Ders Notları',
    'yazi-pratigi.html': 'Yazı Pratiği',
    'calisma-paketleri.html': 'Tüm Paketler',
    'panelim.html': 'Çalışma Masam',
    'hakkinda.html': 'Hakkımızda',
    'iletisim.html': 'İletişim',
    'giris.html': 'Giriş',
    'sifre-sifirla.html': 'Şifre Sıfırla',
    'ogretmen.html': 'Öğretmen',
    'ogretmen-sinif.html': 'Sınıf Yönetimi',
    'soru.html': 'Soru',
    'sorular.html': 'Sorular',
    'spelling-practice.html': 'Spelling Pratiği',
    'study-pack.html': 'Çalışma Paketi',
    'task1-line-bar-chart.html': 'Task 1 Chart',
    'tok-essay-feedback.html': 'TOK Essay Feedback',
    'vocabulary-pack.html': 'Vocabulary Pack',

    // urun/
    'sat-rw-8-gunluk-kamp.html': '8 Günlük SAT Kamp',
    'sat-mock-1.html': 'Tam Deneme 1',
    'sat-full-deneme-1.html': 'Full Deneme 1',
    'sat-full-deneme-1-sinav.html': 'Full Deneme 1 — Sınav',
    'day-1-information-and-ideas.html': 'Day 1 — Information and Ideas',
    'day-1-math-linear.html': 'Day 1 — Math Linear',
    'day-2-inferences-quantitative.html': 'Day 2 — Inferences & Quantitative',
    'day-2-math-systems.html': 'Day 2 — Math Systems',
    'day-3-words-in-context.html': 'Day 3 — Words in Context',
    'day-3-math-quadratic.html': 'Day 3 — Math Quadratic',
    'day-4-structure-and-connections.html': 'Day 4 — Structure & Connections',
    'day-4-math-epr.html': 'Day 4 — Math EPR',
    'day-5-transitions.html': 'Day 5 — Transitions',
    'day-5-math-psda.html': 'Day 5 — Math PSDA',
    'day-6-rhetorical-synthesis.html': 'Day 6 — Rhetorical Synthesis',
    'day-6-math-stats.html': 'Day 6 — Math Stats',
    'day-7-mock-review.html': 'Day 7 — Mock Review',
    'day-7-math-geo.html': 'Day 7 — Math Geo',
    'day-8-final-review.html': 'Day 8 — Final Review',
    'day-8-math-mock.html': 'Day 8 — Math Mock',
    'full-test-1.html': 'Full Test 1',
    'full-test-2.html': 'Full Test 2',
    'full-test-3.html': 'Full Test 3',
    'full-test-4.html': 'Full Test 4',
    'full-test-5.html': 'Full Test 5',
    'full-test-bundle.html': 'Full Test Bundle',
    'grammar-pack-1.html': 'Grammar Pack 1',
    'grammar-pack-2.html': 'Grammar Pack 2',
    'grammar-pack-3.html': 'Grammar Pack 3'
  };

  // ----------- KATEGORİ TESPİTİ ------------
  function inferCategory(filename) {
    var f = filename.toLowerCase();
    // sat-rw-, sat-math- gibi compound prefixler de "sat" altına girer
    if (f.indexOf('sat') === 0 || f.indexOf('sat-rw-8-gunluk-kamp') === 0 ||
        f.indexOf('sat-mock-') === 0 || f.indexOf('sat-full-deneme-') === 0 ||
        f.indexOf('day-') === 0) {
      // day-* kamp dosyaları SAT altında
      return 'sat';
    }
    if (f.indexOf('ielts') === 0) return 'ielts';
    if (f.indexOf('toefl') === 0) return 'toefl';
    if (f.indexOf('ib-') === 0 || f === 'ib.html') return 'ib';
    if (f.indexOf('udsp') === 0) return 'udsp';
    if (f.indexOf('ydt') === 0) return 'ydt';
    if (f.indexOf('yds') === 0) return 'yds';
    return null;
  }

  // ----------- ALT SAYFA ZİNCİRİ ------------
  // Kategori → bu dosya arasında ara crumb varsa ekle
  // Örn: sat-soru-bankasi-rw.html → SAT › Soru Bankası › Reading & Writing
  function getIntermediateCrumbs(filename, cat) {
    var crumbs = [];
    if (filename === 'sat-soru-bankasi-rw.html' || filename === 'sat-soru-bankasi-math.html') {
      crumbs.push({ label: 'Soru Bankası', href: 'sat-soru-bankasi.html' });
    }
    if (filename === 'ielts-deneme-listening.html' || filename === 'ielts-deneme-reading.html' ||
        filename === 'ielts-deneme-writing.html' || filename === 'ielts-deneme-sonuc.html' ||
        filename === 'ielts-deneme-writing-feedback.html') {
      crumbs.push({ label: 'Tam Deneme', href: 'ielts-deneme.html' });
    }
    if (filename === 'toefl-soru-bankasi-reading.html') {
      crumbs.push({ label: 'Soru Bankası', href: 'toefl-soru-bankasi.html' });
    }
    if (filename.indexOf('yds-soru-bankasi-') === 0) {
      crumbs.push({ label: 'Soru Bankası', href: 'yds-soru-bankasi.html' });
    }
    if (filename === 'day-1-information-and-ideas.html' || filename === 'day-1-math-linear.html' ||
        filename === 'day-2-inferences-quantitative.html' || filename === 'day-2-math-systems.html' ||
        filename === 'day-3-words-in-context.html' || filename === 'day-3-math-quadratic.html' ||
        filename === 'day-4-structure-and-connections.html' || filename === 'day-4-math-epr.html' ||
        filename === 'day-5-transitions.html' || filename === 'day-5-math-psda.html' ||
        filename === 'day-6-rhetorical-synthesis.html' || filename === 'day-6-math-stats.html' ||
        filename === 'day-7-mock-review.html' || filename === 'day-7-math-geo.html' ||
        filename === 'day-8-final-review.html' || filename === 'day-8-math-mock.html') {
      crumbs.push({ label: '8 Günlük Kamp', href: 'sat-rw-8-gunluk-kamp.html' });
    }
    if (filename === 'sat-full-deneme-1-sinav.html') {
      crumbs.push({ label: 'Full Deneme 1', href: 'sat-full-deneme-1.html' });
    }
    return crumbs;
  }

  // ----------- URL ÇÖZÜMLEME ------------
  function resolveRelativePath(target) {
    // target 'sat.html' veya 'urun/foo.html' veya '../foo.html' formatında olabilir.
    // Mevcut konuma göre uygun relative path döndür.
    var pathname = location.pathname || '';
    var inUrun = pathname.indexOf('/urun/') !== -1;

    if (target.charAt(0) === '/' || /^https?:/i.test(target)) return target;

    // Hedef urun/ klasöründe mi (kamp/deneme dosyaları)?
    var isUrunTarget = (
      target.indexOf('day-') === 0 ||
      target.indexOf('sat-rw-8-gunluk-kamp') === 0 ||
      target.indexOf('sat-mock-') === 0 ||
      target.indexOf('sat-full-deneme-') === 0 ||
      target.indexOf('full-test-') === 0 ||
      target.indexOf('grammar-pack-') === 0 ||
      target.indexOf('vocabulary-pack') === 0 ||
      target.indexOf('study-pack') === 0 ||
      target.indexOf('spelling-practice') === 0 ||
      target.indexOf('tok-essay-feedback') === 0 ||
      target.indexOf('-coaching') !== -1 ||
      target.indexOf('-feedback') !== -1 ||
      target.indexOf('-writing-practice') !== -1
    );

    if (inUrun && !isUrunTarget) return '../' + target;
    if (!inUrun && isUrunTarget) return 'urun/' + target;
    return target;
  }

  // ----------- BREADCRUMB ÜRET ------------
  function buildCrumbs(filename) {
    var crumbs = [{ label: 'Ana Sayfa', href: 'index.html' }];
    var cat = inferCategory(filename);
    if (cat && CATEGORIES[cat]) {
      crumbs.push({ label: CATEGORIES[cat].label, href: CATEGORIES[cat].home });
    }
    // Ara seviyeler
    var intermediates = getIntermediateCrumbs(filename, cat);
    intermediates.forEach(function (c) { crumbs.push(c); });
    // Bu sayfa
    var pageLabel = PAGE_LABELS[filename];
    if (pageLabel && filename !== 'index.html') {
      // Eğer kategori anasayfasıysa veya zaten son crumb ile aynıysa ekleme
      var last = crumbs[crumbs.length - 1];
      if (last.label !== pageLabel) {
        crumbs.push({ label: pageLabel, href: null });
      }
    }
    return { crumbs: crumbs, category: cat };
  }

  // ----------- HTML ÜRET ------------
  function buildBarHTML(crumbsData, currentFilename) {
    var crumbs = crumbsData.crumbs;
    var cat = crumbsData.category;
    var subnavHtml = '';

    if (cat && CATEGORIES[cat]) {
      var subnav = CATEGORIES[cat].subnav;
      subnavHtml = '<div class="gri-bc-subnav" role="navigation" aria-label="Kategori menüsü">';
      subnav.forEach(function (item) {
        var isActive = (item.href === currentFilename);
        var cls = 'gri-bc-subnav-item' + (isActive ? ' is-active' : '');
        var href = resolveRelativePath(item.href);
        subnavHtml += '<a href="' + href + '" class="' + cls + '">' + item.label + '</a>';
      });
      subnavHtml += '</div>';
    }

    var crumbsHtml = '<nav class="gri-bc-trail" aria-label="Sayfa yolu"><ol>';
    crumbs.forEach(function (c, i) {
      var isLast = (i === crumbs.length - 1);
      crumbsHtml += '<li>';
      if (c.href && !isLast) {
        crumbsHtml += '<a href="' + resolveRelativePath(c.href) + '">' + c.label + '</a>';
      } else {
        crumbsHtml += '<span aria-current="page">' + c.label + '</span>';
      }
      if (!isLast) {
        crumbsHtml += '<span class="gri-bc-sep" aria-hidden="true">›</span>';
      }
      crumbsHtml += '</li>';
    });
    crumbsHtml += '</ol></nav>';

    return '<div class="gri-bc-inner">' + crumbsHtml + subnavHtml + '</div>';
  }

  // ----------- STİL ------------
  var STYLE = (
    '.gri-bc-bar{' +
      'position:sticky;top:0;z-index:50;' +
      'background:var(--bg-soft,#FAF6EA);' +
      'border-bottom:1px solid var(--line,#D9D2C4);' +
      'font-family:inherit;font-size:13px;' +
      'box-shadow:0 1px 2px rgba(26,34,48,0.04);' +
    '}' +
    '.gri-bc-inner{' +
      'max-width:1200px;margin:0 auto;padding:9px 18px;' +
      'display:flex;align-items:center;justify-content:space-between;gap:18px;' +
      'flex-wrap:wrap;' +
    '}' +
    '.gri-bc-trail ol{' +
      'list-style:none;padding:0;margin:0;display:flex;flex-wrap:wrap;align-items:center;' +
      'min-width:0;' +
    '}' +
    '.gri-bc-trail li{display:inline-flex;align-items:center;}' +
    '.gri-bc-trail a{' +
      'color:var(--text-soft,#3A4250);text-decoration:none;' +
      'transition:color 0.15s;' +
    '}' +
    '.gri-bc-trail a:hover{color:var(--teal,#2C5856);text-decoration:underline;}' +
    '.gri-bc-trail span[aria-current]{' +
      'color:var(--text,#1A2230);font-weight:600;' +
    '}' +
    '.gri-bc-sep{' +
      'margin:0 8px;color:var(--text-muted,#6B6862);font-weight:400;' +
    '}' +
    '.gri-bc-subnav{' +
      'display:flex;flex-wrap:wrap;gap:4px 2px;align-items:center;' +
    '}' +
    '.gri-bc-subnav-item{' +
      'color:var(--text-soft,#3A4250);text-decoration:none;' +
      'padding:4px 10px;border-radius:999px;' +
      'transition:background 0.15s,color 0.15s;font-size:12.5px;' +
      'white-space:nowrap;' +
    '}' +
    '.gri-bc-subnav-item:hover{' +
      'background:var(--teal-soft,rgba(44,88,86,0.12));' +
      'color:var(--teal,#2C5856);' +
    '}' +
    '.gri-bc-subnav-item.is-active{' +
      'background:var(--teal,#2C5856);color:#fff;font-weight:500;' +
    '}' +
    '.gri-bc-subnav-item.is-active:hover{background:var(--teal-deep,#1A3D3B);}' +
    '@media (max-width: 720px){' +
      '.gri-bc-inner{padding:8px 12px;gap:10px;}' +
      '.gri-bc-trail{order:1;flex:1 1 100%;overflow-x:auto;}' +
      '.gri-bc-trail ol{flex-wrap:nowrap;}' +
      '.gri-bc-trail li{flex-shrink:0;}' +
      '.gri-bc-subnav{order:2;flex:1 1 100%;overflow-x:auto;padding-bottom:2px;}' +
      '.gri-bc-subnav-item{flex-shrink:0;}' +
    '}' +
    '@media print{.gri-bc-bar{display:none !important;}}'
  );

  // ----------- KAMP/SINAV TESPİTİ ------------
  function isExamLikePage() {
    if (document.getElementById('topbar')) return true;
    if (document.getElementById('quiz')) return true;
    if (document.querySelector('.sc-brand-bar')) return true;
    return false;
  }

  // ----------- KURULUM ------------
  function init() {
    if (isExamLikePage()) return;

    var filename = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    if (filename && !/\.html$/.test(filename)) filename += '.html'; // temiz URL (uzantısız) -> .html anahtarlarıyla eşleşsin
    if (!filename || filename === 'index.html') return; // Ana sayfada breadcrumb olmaz

    var data = buildCrumbs(filename);
    if (!data.crumbs || data.crumbs.length <= 1) return;

    // Sayfada zaten native bir .breadcrumb varsa duplicate olmasın diye gizle.
    // (Bazı sayfalarda inline breadcrumb HTML mevcut, biz tek tip bar
    // gösterelim, eski olanı sayfaya bastığı momentten itibaren gizleyelim.)
    var nativeStyle = document.createElement('style');
    nativeStyle.textContent = '.breadcrumb{display:none !important;}';
    document.head.appendChild(nativeStyle);

    var styleEl = document.createElement('style');
    styleEl.textContent = STYLE;
    document.head.appendChild(styleEl);

    var bar = document.createElement('div');
 bar.className = 'gri-bc-bar';
    bar.innerHTML = buildBarHTML(data, filename);
    placeBar(bar, 0);
  }

  // Breadcrumb'i dogru yere koy: once yeni nav (.gri-nav), sonra eski header, sonra body basi.
  function placeBar(bar, tries) {
    var nav = document.querySelector('.gri-nav');
    if (nav && nav.parentNode) {
      nav.parentNode.insertBefore(bar, nav.nextSibling);
      return;
    }
    var header = document.querySelector('.site-header');
    if (header && header.parentNode) {
      header.parentNode.insertBefore(bar, header.nextSibling);
      return;
    }
    if (tries < 20) {
      setTimeout(function () { placeBar(bar, tries + 1); }, 50);
      return;
    }
    document.body.insertBefore(bar, document.body.firstChild);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
