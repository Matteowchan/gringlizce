/* gri-ui-en.js — JS-runner UI için GÖMÜLÜ (baked) TR→EN sözlüğü.
   Amaç: EN pill seçiliyken JS ile üretilen runner arayüzü de İngilizce olsun.
   Güvenlik: AĞ YOK (edge-fn/proxy yok — eski freeze'in sebebi buydu), yalnız
   statik sözlük; tam-eşleşen text node'ları çevirir; kendi mutasyonunu gözlemlemez
   (apply sırasında observer disconnect); TR'ye dönünce geri alır.
   Entegrasyon: nav.js'e DOKUNMAZ — pill tıklamasını + localStorage'ı kendisi dinler.
   Yalnız gerektiği runner sayfalarına <script> ile eklenir (küratörlü [data-blog-lang]
   sayfalarına EKLENMEZ; onlar zaten EN'i data-blog-lang ile yönetir). */
(function () {
  'use strict';
  var DICT = {
    // eylemler / butonlar
    'Gönder': 'Submit', 'Gönderiliyor...': 'Submitting...', 'Kaydet': 'Save',
    'Vazgeç': 'Cancel', 'Devam': 'Continue', 'Devam Et': 'Continue',
    'İleri': 'Next', 'Geri': 'Back', 'Önceki soru': 'Previous question',
    'Sonraki soru': 'Next question', 'Sonraki Soru': 'Next question',
    'Tekrar Başla': 'Restart', 'Tamamlandı': 'Completed', 'Bitir': 'Finish',
    'Seçiniz': 'Select', 'Tümü': 'All', 'Diğer': 'Other', 'Çıkış': 'Exit',
    'Giriş Yap': 'Sign in', 'Yanıtları İncele': 'Review answers',
    'İnceleme modu': 'Review mode', 'İpucu': 'Hint', 'Yer İmi': 'Bookmark',
    // durum / sonuç
    'Doğru': 'Correct', 'Yanlış': 'Wrong', 'Doğru Cevap': 'Correct answer',
    'Doğru cevap': 'Correct answer', 'Yanlış Cevap': 'Wrong answer',
    'Yanlış cevap': 'Wrong answer', 'Doğruluk': 'Accuracy',
    'İyi gidiyorsun': "You're doing well", 'Çok iyi': 'Great', 'Olağanüstü': 'Outstanding',
    'Görülmüş': 'Seen', 'Cevap': 'Answer', 'Puan': 'Score', 'Süre': 'Time',
    // yükleniyor / hata
    'Aranıyor...': 'Searching...', 'Soru yükleniyor': 'Loading question',
    'Soru yükleniyor...': 'Loading question...', 'Yükleniyor': 'Loading',
    'Yükleniyor...': 'Loading...', 'Soru bulunamadı.': 'No question found.',
    'Soru bulunamadı': 'No question found', 'Bu soru bulunamadı.': 'This question was not found.',
    'Soru hatası': 'Question error', 'Açıklama hatası': 'Explanation error',
    'Soru bilgisi alınamadı.': 'Could not load question data.',
    'Deneme yüklenemedi.': 'Could not load the mock test.',
    'Tekrar listesi yüklenemedi.': 'Could not load the review list.',
    'Görüntü sorunu': 'Display issue',
    // navigasyon / bölümler
    'Soru Bankası': 'Question Bank', 'Soru Bankasına Dön': 'Back to Question Bank',
    'Çalışma Masama Dön': 'Back to My Study Desk', 'Konu Anlatımı': 'Topic Lessons',
    'IELTS Konu Anlatımı': 'IELTS Topic Lessons', 'Sözlük': 'Dictionary',
    'Çeviri': 'Translation', 'Kelime Anlamı': 'Word meaning', 'Kelime kartları': 'Flashcards',
    'Kelime Yaz': 'Type the word', 'İngilizce kelime yaz...': 'Type the English word...',
    // araçlar / filtreler
    'Zamanlayıcıyı göster': 'Show timer', 'Zamanlayıcıyı gizle': 'Hide timer',
    'Sıraları karıştır': 'Shuffle', 'Kolaydan zora sırala': 'Sort easy to hard',
    'Sorun türü': 'Issue type', 'Sorun bildir': 'Report an issue', 'Hata bildir': 'Report an error',
    // SAT/okuma kategori adları (runner'da etiket olarak çıkar)
    'Okuduğunu Anlama': 'Reading Comprehension', 'Çıkarım': 'Inference',
    'Yazarın Amacı': "Author's Purpose", 'Cümle Yapısı': 'Sentence Structure',
    'Durum İfadesi': 'Claim/Thesis', 'Kelime Bilgisi': 'Vocabulary'
  };

  var handled = [];      // {node, orig}
  var mo = null, timer = null, curEN = false;

  function skip(el) {
    while (el && el.nodeType === 1 && el !== document.body) {
      var tag = el.tagName;
      if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'TEXTAREA' || tag === 'INPUT' ||
          tag === 'CODE' || tag === 'PRE' || tag === 'OPTION' || tag === 'SELECT') return true;
      if (el.isContentEditable) return true;
      if (el.hasAttribute) {
        if (el.hasAttribute('data-blog-lang') || el.hasAttribute('data-i18n') ||
            el.hasAttribute('data-no-en') || el.getAttribute('lang') === 'en') return true;
      }
      if (el.classList && (el.classList.contains('gri-nav') || el.classList.contains('gri-lang') ||
          el.classList.contains('site-footer'))) return true;
      el = el.parentElement;
    }
    return false;
  }

  function apply() {
    if (!curEN) return;               // TR'ye dönülmüşse bekleyen apply çalışmasın
    if (mo) mo.disconnect();
    try {
      var w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
      var n, hits = [];
      while ((n = w.nextNode())) {
        var raw = n.nodeValue; if (!raw) continue;
        var key = raw.trim(); if (!key || !DICT[key]) continue;
        if (skip(n.parentElement)) continue;
        hits.push(n);
      }
      for (var i = 0; i < hits.length; i++) {
        var node = hits[i], k = node.nodeValue.trim(), en = DICT[k];
        if (!en) continue;
        handled.push({ node: node, orig: node.nodeValue });
        node.nodeValue = node.nodeValue.replace(k, en);
      }
    } catch (e) { /* sessiz: çeviri hiçbir zaman sayfayı bozmasın */ }
    if (mo && curEN) mo.observe(document.body, { childList: true, subtree: true, characterData: true });
  }

  function revert() {
    for (var i = 0; i < handled.length; i++) {
      try { handled[i].node.nodeValue = handled[i].orig; } catch (e) {}
    }
    handled = [];
  }

  function setEN(on) {
    on = !!on;
    curEN = on;
    if (on) {
      if (!mo) mo = new MutationObserver(function () {
        if (timer) clearTimeout(timer);
        timer = setTimeout(apply, 180);
      });
      apply(); // apply reconnects observer at the end
    } else {
      if (timer) { clearTimeout(timer); timer = null; }
      if (mo) mo.disconnect();
      revert();
    }
  }

  function curLang() {
    try { return localStorage.getItem('gri-blog-lang') === 'en' ? 'en' : 'tr'; }
    catch (e) { return 'tr'; }
  }

  // Dışarıya açık kanca (nav.js isterse çağırabilir; şart değil)
  window.griUiEN = function (on) { setEN(on); };

  // Kendi entegrasyonu: pill tıklamasını yakala (nav.js applyLang senkron çalışır,
  // bir tick sonra yeni dil localStorage'da olur)
  document.addEventListener('click', function (e) {
    var t = e.target;
    var b = t && t.closest ? t.closest('.gri-lang [data-setlang], [data-setlang]') : null;
    if (b) setTimeout(function () { setEN(curLang() === 'en'); }, 40);
  }, true);

  // Belt-and-suspenders: programatik dil değişimlerini de yakala
  function wrapSetLang() {
    if (typeof window.griSetLang === 'function' && !window.griSetLang.__uiWrapped) {
      var orig = window.griSetLang;
      window.griSetLang = function () {
        var rv = orig.apply(this, arguments);
        setTimeout(function () { setEN(curLang() === 'en'); }, 0);
        return rv;
      };
      window.griSetLang.__uiWrapped = true;
    }
  }

  function init() {
    wrapSetLang();
    setEN(curLang() === 'en');
    // nav.js griSetLang'i DOMContentLoaded'da atayabilir; kısa süre tekrar dene
    if (!(window.griSetLang && window.griSetLang.__uiWrapped)) {
      var tries = 0, iv = setInterval(function () {
        wrapSetLang();
        if ((window.griSetLang && window.griSetLang.__uiWrapped) || ++tries > 30) clearInterval(iv);
      }, 100);
    }
  }
  if (document.readyState !== 'loading') init();
  else document.addEventListener('DOMContentLoaded', init);
  // defer script senkron çalışabilir (readyState 'interactive'); DCL'de tekrar dene
  document.addEventListener('DOMContentLoaded', function () { wrapSetLang(); setEN(curLang() === 'en'); });
})();
