/* gri-link-label.js — bir URL'yi okunur bir etikete cevirir.
 *
 * Calisma programlarinda odevlerin linki ham URL olarak gorunuyordu
 * ("https://gringlizce.com/ielts-reading-tfng" gibi) ve hem ogretmen hem ogrenci
 * icin okunmasi zordu. Burasi tek dogru kaynak: hem ogretmen editoru
 * (ogretmen-program) hem ogrenci sayfasi (calisma-programim) ayni etiketi gosterir.
 *
 * window.GriLinkLabel(url) -> "IELTS Okuma · True / False / Not Given"
 */
(function () {
  'use strict';

  // Site ici sayfa yolu -> Turkce etiket. Uzantisiz temiz URL'lerle eslesir.
  var SAYFA = {
    'yazi-pratigi': 'Yazı Pratiği',
    'kendi-yazilarim': 'Kendi Yazıların',
    'panelim': 'Panelim',
    'calisma-programim': 'Çalışma Programım',
    'konusma-pratigi': 'Konuşma Pratiği · soru + kayıt',
    'ielts-reading-tfng': 'IELTS Okuma · True / False / Not Given',
    'ielts-reading-completion': 'IELTS Okuma · Boşluk doldurma',
    'ielts-reading-matching-headings': 'IELTS Okuma · Başlık eşleştirme',
    'ielts-reading-multiple-choice': 'IELTS Okuma · Çoktan seçmeli',
    'ielts-reading-matching': 'IELTS Okuma · Bilgi eşleştirme',
    'ielts-reading-diagram': 'IELTS Okuma · Diyagram etiketleme',
    'ielts-speaking-part1': 'IELTS Konuşma · Part 1',
    'ielts-speaking-part2': 'IELTS Konuşma · Part 2 (cue card)',
    'ielts-speaking-part3': 'IELTS Konuşma · Part 3',
    'konu-ielts-genel-bakis': 'IELTS Konu Anlatımı · Genel bakış',
    'konu-ielts-listening': 'IELTS Konu Anlatımı · Dinleme',
    'konu-ielts-reading': 'IELTS Konu Anlatımı · Okuma',
    'konu-ielts-speaking': 'IELTS Konu Anlatımı · Konuşma',
    'konu-ielts-grammar': 'IELTS Konu Anlatımı · Gramer',
    'konu-ielts-kelime': 'IELTS Konu Anlatımı · Kelime',
    'konu-ielts-akademik-kelime': 'IELTS Konu Anlatımı · Akademik kelime',
    'konu-ielts-writing-task1': 'IELTS Konu Anlatımı · Writing Task 1',
    'konu-ielts-writing-task2': 'IELTS Konu Anlatımı · Writing Task 2',
    'ielts-deneme': 'IELTS Deneme',
    'ielts-deneme-reading': 'IELTS Deneme · Okuma',
    'ielts-deneme-listening': 'IELTS Deneme · Dinleme',
    'ielts-deneme-writing': 'IELTS Deneme · Yazma'
  };

  // Site disi alan adi -> kaynak adi.
  var DIS = {
    'huffpost.com': 'HuffPost makalesi',
    'www.huffpost.com': 'HuffPost makalesi',
    'ieltsonlinetests.com': 'IELTS Online Tests',
    'www.ieltsonlinetests.com': 'IELTS Online Tests',
    'youtube.com': 'YouTube videosu',
    'www.youtube.com': 'YouTube videosu',
    'youtu.be': 'YouTube videosu'
  };

  // panelim ici capalar.
  var CAPA = { hatadefteri: 'Hata Defteri', kelime: 'Kelime Bankası' };

  // Yazi Pratigi'ndeki gorev tipleri (writing_text_types.id).
  var GOREV = {
    'ielts-task1-academic': 'Task 1',
    'ielts-task2': 'Task 2',
    'ielts-writing-complete': 'Task 1 + Task 2',
    'task1_academic': 'Task 1',
    'task2': 'Task 2'
  };

  function baslikCevir(slug) {
    // Haritada olmayan site sayfasi: tireleri bosluga cevirip bas harfi buyut.
    var s = slug.replace(/-/g, ' ').trim();
    return s ? s.charAt(0).toUpperCase() + s.slice(1) : 'Sayfa';
  }

  window.GriLinkLabel = function (url) {
    if (!url) return '';
    var raw = String(url).trim();
    if (!raw) return '';
    if (!/^https?:\/\//i.test(raw)) return raw;   // duz metin: oldugu gibi

    var u;
    try { u = new URL(raw); } catch (e) { return raw; }

    var yol = u.pathname.replace(/^\/+|\/+$/g, '').replace(/\.html$/i, '');
    var etiket;

    if (/(^|\.)gringlizce\.com$/i.test(u.hostname)) {
      etiket = SAYFA[yol];
      // Tema bazli kelime sayfalari kalipli: ielts-kelime-<tema>
      if (!etiket) {
        var kel = /^ielts-kelime-(.+)$/.exec(yol);
        if (kel) etiket = 'IELTS Kelime · ' + baslikCevir(kel[1]);
      }
      if (!etiket) etiket = yol ? baslikCevir(yol) : 'Gri English';
      var capa = (u.hash || '').replace('#', '');
      if (capa && CAPA[capa]) etiket += ' · ' + CAPA[capa];
      // Yazi Pratigi linkleri: hangi gorev tipi oldugu ve sorunun hazir gelip
      // gelmedigi etikete yazilir, yoksa iki Task 1/Task 2 linki ayni gorunur.
      var tip = u.searchParams.get('type');
      if (tip) etiket += ' · ' + (GOREV[tip] || baslikCevir(tip));
      if (u.searchParams.get('prompt')) etiket += ' · soru hazır';
      else if (u.searchParams.get('assignment_id')) etiket += ' · ödev';
      return etiket;
    }

    return DIS[u.hostname] || u.hostname.replace(/^www\./, '');
  };
})();
