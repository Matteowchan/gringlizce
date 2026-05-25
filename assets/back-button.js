/* ============================================================
   GRI ENGLISH — Smart Back Button
   ============================================================
   Tüm ürün sayfalarında (urun/*.html) sol üstte sticky bir
   "‹ Geri" butonu gösterir. Tıklandığında akıllı geri davranış:
     - document.referrer aynı sitedeyse → history.back()
     - Değilse → ../calisma-paketleri.html'e gider (Tüm Paketler)

   Otomatik gizleme:
     - Sayfada aktif kamp/sınav topbar'ı (.topbar.show veya
       .sc-brand-bar inside active flow) varsa buton gizlenir.
     - Quiz/exam dosyalarına bu script include edilmez.

   Kullanım:
     <script src="../assets/back-button.js" defer></script>
   ============================================================ */
(function () {
  'use strict';

  // Sayfada kamp/sınav modu aktif mi? Eğer öyleyse buton ekleme.
  function isExamLikePage() {
    // Kamp dosyalarında: .topbar.show veya .sc-brand-bar varsa
    // (sat-rw-8-gunluk-kamp gibi splash sayfalarında brand-bar var ama
    // topbar yok; bu dosyalarda buton görünmeli, dolayısıyla sadece
    // topbar.show'a bakmak yeterli)
    if (document.getElementById('topbar')) return true;
    if (document.getElementById('quiz')) return true;
    if (document.querySelector('.sc-brand-bar')) return true;
    return false;
  }

  function buildButton() {
    if (isExamLikePage()) return;

    // Inline style — sitenin mevcut CSS'iyle çakışmasın
    var style = document.createElement('style');
    style.textContent =
      '.gri-back-btn{' +
        'position:fixed;top:84px;left:14px;z-index:9990;' +
        'display:inline-flex;align-items:center;gap:6px;' +
        'background:rgba(28,30,34,0.82);color:#f4f4f4;' +
        'border:1px solid rgba(255,255,255,0.18);' +
        'padding:7px 14px 7px 11px;border-radius:999px;' +
        'font-size:13px;font-weight:500;cursor:pointer;' +
        'font-family:inherit;line-height:1.2;' +
        '-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);' +
        'transition:background 0.15s,transform 0.1s;' +
        'box-shadow:0 2px 8px rgba(0,0,0,0.15);' +
      '}' +
      '.gri-back-btn:hover{background:rgba(28,30,34,0.95);}' +
      '.gri-back-btn:active{transform:scale(0.97);}' +
      '.gri-back-btn .gri-back-arrow{font-size:15px;line-height:1;margin-right:1px;}' +
      '@media (max-width: 640px){' +
        '.gri-back-btn{top:70px;left:8px;padding:6px 12px 6px 9px;font-size:12px;}' +
      '}' +
      '@media print{.gri-back-btn{display:none !important;}}';
    document.head.appendChild(style);

    var btn = document.createElement('button');
    btn.className = 'gri-back-btn';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Önceki sayfaya dön');
    btn.innerHTML = '<span class="gri-back-arrow" aria-hidden="true">‹</span><span>Geri</span>';

    btn.addEventListener('click', function () {
      try {
        var ref = document.referrer || '';
        // Aynı site içinden geldiyse history.back
        if (ref && ref.indexOf(location.host) !== -1) {
          history.back();
          return;
        }
      } catch (e) { /* fall through */ }

      // Fallback: Tüm Paketler sayfası
      // Eğer dosya zaten urun/ klasöründeyse ../calisma-paketleri.html doğru
      var path = location.pathname || '';
      if (path.indexOf('/urun/') !== -1) {
        location.href = '../calisma-paketleri.html';
      } else {
        location.href = 'calisma-paketleri.html';
      }
    });

    document.body.appendChild(btn);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildButton);
  } else {
    buildButton();
  }
})();
