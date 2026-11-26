/* ============================================================
   Gri English — JUNIOR etkileşim katmanı (junior.css ile birlikte)
   - Bölümleri renk kodlar (data-jrk), maskot "Gri" ipucu kutusu ekler (A2-C2)
   - Menü başlığına yıldız sayacı (tamamlanan bölüm = 1 yıldız)
   - Doğru cevapta konfeti + övgü; bölüm bitince büyük kutlama
   Ünite motoruna DOKUNMAZ: yalnız DOM'u gözlemler (MutationObserver). ES5.
   ============================================================ */
(function () {
  'use strict';
  var root = document.documentElement;
  var mode = root.getAttribute('data-jr');
  if (!mode) return;
  var m = /genel-junior-([a-c][12])-/i.exec(location.pathname) || [];
  var lvl = (m[1] || 'a2').toLowerCase();
  var TR = (lvl === 'a1' || lvl === 'a2');            // A1-A2: Türkçe destek; B1+: İngilizce
  var HINT = (lvl === 'b1' || lvl === 'b2');           // B seviyelerinde küçük Türkçe satır
  var reduce = false;
  try { reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

  var CATS = {
    grammar: 'assets/images/cat-teaching.webp', speaking: 'assets/gri-cat-happy.webp',
    reading: 'assets/images/cat-content.webp', listening: 'assets/gri-cat-curious.webp',
    practice: 'assets/images/cat-pointing.webp', writing: 'assets/images/cat-writing.webp',
    check: 'assets/images/cat-stretching.webp'
  };
  var MSG = {
    grammar:  ['<b>Kural zamanı!</b> Önce örnekleri oku, sonra mini soruları çöz. Acele yok, adım adım gidiyoruz.',
               '<b>Grammar time!</b> Read the examples first, then try the mini questions. No rush, step by step.',
               'Önce örnekleri oku, sonra soruları çöz.'],
    speaking: ['<b>Yeni kelimeler!</b> Kartları sesli oku, sonra kendi cümlelerini kur. Burada hata yapmak serbest!',
               '<b>New words!</b> Say them out loud, then make your own sentences. Mistakes are welcome here.',
               'Kelimeleri sesli söyle, kendi cümleni kur.'],
    reading:  ['<b>Hikâye zamanı!</b> Metni iki kez oku: önce keyif için, sonra cevapları bulmak için.',
               '<b>Story time!</b> Read it twice: once for fun, once to hunt for the answers.',
               'İki kez oku: önce keyif, sonra cevap avı.'],
    listening:['<b>Kulaklar açık!</b> Dikkatle dinle. Anlamadığın yeri tekrar dinleyebilirsin.',
               '<b>Ears ready!</b> Listen carefully. You can always listen again.',
               'Dikkatle dinle; istersen tekrar dinle.'],
    practice: ['<b>Oyun gibi pratik!</b> Her doğru cevap seni bir yıldıza daha yaklaştırır.',
               '<b>Practice lab!</b> Every correct answer brings you closer to a star.',
               'Her doğru cevap seni yıldıza yaklaştırır.'],
    writing:  ['<b>Yazar sensin!</b> Kısa cümlelerle başla, sonra onları <b>and, but, because</b> ile birleştir.',
               '<b>You are the author!</b> Start with short sentences, then join them with <b>and, but, because</b>.',
               'Kısa cümlelerle başla, bağlaçlarla birleştir.'],
    check:    ['<b>Son durak!</b> Öğrendiklerini göster ve bu ünitenin yıldızlarını tamamla.',
               '<b>Last stop!</b> Show what you learned and collect the last star of this unit.',
               'Öğrendiklerini göster, son yıldızı topla.']
  };
  var PRAISE = TR ? ['Harika!', 'Süpersin!', 'Aferin!', 'Great job!', 'Çok iyi!', 'Well done!']
                  : ['Great job!', 'Well done!', 'Awesome!', 'You got it!', 'Brilliant!', 'Nice one!'];
  var SOFT = TR ? ['Olsun, öğreniyoruz!', 'Yaklaştın!', 'Açıklamayı oku, sıradaki senin!']
                : ['Nice try!', 'So close!', 'Read the tip, the next one is yours!'];
  var STAR_SVG = '<svg class="jrx-star" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.6l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17l-5.7 3.1 1.2-6.4L2.8 9.3l6.4-.8z"/></svg>';

  function $(s, c) { return (c || document).querySelector(s); }
  function $all(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }

  /* ---------- bölüm renk kodu + maskot ---------- */
  function subLinks() { return $all('.ge-unit.open .ge-sub a[data-sec]'); }
  function decorate() {
    var links = subLinks();
    for (var i = 0; i < links.length; i++) {
      var key = links[i].getAttribute('data-key') || '';
      var sec = document.getElementById('ge-sec-' + links[i].getAttribute('data-sec'));
      if (!key || !sec) continue;
      links[i].setAttribute('data-jrk', key);
      if (sec.getAttribute('data-jrk')) continue;
      sec.setAttribute('data-jrk', key);
      if (mode !== '1' || !MSG[key]) continue;
      if (sec.querySelector('.jr-hero,.jrx-hero')) continue;
      var box = document.createElement('div');
      box.className = 'jrx-hero';
      var txt = TR ? MSG[key][0] : MSG[key][1];
      if (HINT) txt += '<span class="tr">' + MSG[key][2] + '</span>';
      box.innerHTML = '<img class="jrx-cat" src="' + CATS[key] + '" alt="Gri" width="92" height="92" loading="lazy">' +
                      '<div class="jrx-bubble">' + txt + '</div>';
      var head = sec.querySelector('.ge-sec-head');
      if (head && head.parentNode === sec) sec.insertBefore(box, head.nextSibling);
      else sec.insertBefore(box, sec.firstChild);
    }
  }

  /* ---------- yıldız sayacı ---------- */
  var lastDone = -1;
  function stars(celebrate) {
    var head = $('.ge-rail-head'); var links = subLinks();
    if (!head || !links.length) return;
    var done = 0, i;
    for (i = 0; i < links.length; i++) if (/\bdone\b/.test(links[i].className)) done++;
    var wrap = $('.jrx-stars', head);
    if (!wrap) {
      wrap = document.createElement('div'); wrap.className = 'jrx-stars';
      var h = '';
      for (i = 0; i < links.length; i++) h += STAR_SVG;
      wrap.innerHTML = h + '<span class="jrx-stars-lbl"></span>';
      head.appendChild(wrap);
    }
    var st = $all('.jrx-star', wrap);
    for (i = 0; i < st.length; i++) {
      var on = i < done;
      if (on && !/\bon\b/.test(st[i].getAttribute('class'))) {
        st[i].setAttribute('class', 'jrx-star on' + (celebrate && armed && lastDone >= 0 ? ' pop' : ''));
      } else if (!on) st[i].setAttribute('class', 'jrx-star');
    }
    var lbl = $('.jrx-stars-lbl', wrap);
    if (lbl) lbl.textContent = done + ' / ' + links.length + (TR ? ' yıldız' : ' stars');
    if (celebrate && armed && lastDone >= 0 && done > lastDone) {
      var r = wrap.getBoundingClientRect();
      var all = done === links.length;
      burst(r.left + r.width / 2, r.top + r.height / 2, all ? 34 : 20);
      praise(window.innerWidth / 2, Math.min(window.innerHeight * 0.4, 320),
             all ? (TR ? 'Ünite tamam! Tüm yıldızlar senin!' : 'Unit complete! All stars are yours!')
                 : (TR ? 'Bir yıldız kazandın!' : 'You earned a star!'), 'big');
    }
    lastDone = done;
  }

  /* ---------- kutlama ---------- */
  var COLORS = ['#FFC24B', '#FF8A4C', '#4FB8E8', '#6FCF6B', '#FF6F91', '#9B7BEA'];
  function burst(x, y, n) {
    if (reduce) return;
    for (var i = 0; i < n; i++) {
      var c = document.createElement('i'); c.className = 'jrx-conf';
      var ang = Math.random() * Math.PI * 2, dist = 60 + Math.random() * 130;
      c.style.left = x + 'px'; c.style.top = y + 'px';
      c.style.background = COLORS[i % COLORS.length];
      c.style.setProperty('--x', Math.round(Math.cos(ang) * dist) + 'px');
      c.style.setProperty('--y', Math.round(Math.sin(ang) * dist + 90) + 'px');
      c.style.setProperty('--r', Math.round(Math.random() * 720 - 360) + 'deg');
      c.style.setProperty('--d', Math.round(700 + Math.random() * 500) + 'ms');
      if (i % 3 === 0) { c.style.borderRadius = '50%'; c.style.height = '10px'; }
      document.body.appendChild(c);
      (function (el) { setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 1400); })(c);
    }
  }
  var praiseAt = 0, pi = 0, si = 0;
  function praise(x, y, text, kind) {
    var now = Date.now();
    if (kind !== 'big' && now - praiseAt < 450) return;   // art arda yığılmasın
    praiseAt = now;
    var p = document.createElement('div');
    p.className = 'jrx-praise' + (kind ? ' ' + kind : '');
    p.textContent = text;
    p.style.left = Math.max(90, Math.min(window.innerWidth - 90, x)) + 'px';
    p.style.top = Math.max(70, y) + 'px';
    p.setAttribute('aria-hidden', 'true');
    document.body.appendChild(p);
    setTimeout(function () { if (p.parentNode) p.parentNode.removeChild(p); }, kind === 'big' ? 2000 : 1350);
  }
  function center(el) { var r = el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }
  function visible(el) { var r = el.getBoundingClientRect(); return r.width > 0 && r.bottom > 0 && r.top < window.innerHeight; }

  // Sayfa açılışında kayıtlı ilerleme geri yüklenirken (done/ok sınıfları) kutlama YAPMA: 4 sn sonra devreye gir.
  var armed = false; setTimeout(function () { armed = true; }, 4000);
  function once(el, tag) {
    var k = '__jrx' + tag;
    if (el[k]) return false; el[k] = 1; return true;
  }
  function onClassChange(el) {
    var cn = el.className; if (typeof cn !== 'string') return;
    if (!armed) { if (el.tagName === 'A' && el.hasAttribute('data-sec')) stars(false); return; }
    if (/\bge-qfb\b/.test(cn)) {
      if (/\bok\b/.test(cn) && once(el, 'ok') && visible(el)) { var c = center(el.parentNode || el); burst(c[0], c[1] - 20, 12); praise(c[0], c[1] - 30, PRAISE[pi++ % PRAISE.length]); }
      else if (/\bno\b/.test(cn) && once(el, 'no') && visible(el)) { var c2 = center(el.parentNode || el); praise(c2[0], c2[1] - 30, SOFT[si++ % SOFT.length], 'soft'); }
    } else if (/\bge-gap\b/.test(cn)) {
      if (/\bok\b/.test(cn) && once(el, 'ok') && visible(el)) { var c3 = center(el); burst(c3[0], c3[1], 8); praise(c3[0], c3[1] - 24, PRAISE[pi++ % PRAISE.length]); }
    } else if (el.tagName === 'A' && el.hasAttribute('data-sec')) {
      stars(true);
    }
  }

  function start() {
    decorate(); stars(false);
    if (typeof MutationObserver === 'undefined') return;
    var mo = new MutationObserver(function (muts) {
      var redo = false;
      for (var i = 0; i < muts.length; i++) {
        var mu = muts[i];
        if (mu.type === 'attributes') onClassChange(mu.target);
        else if (mu.addedNodes && mu.addedNodes.length) redo = true;
      }
      if (redo) { decorate(); }
    });
    mo.observe(document.body, { subtree: true, attributes: true, attributeFilter: ['class'], childList: true });
    // ilerleme localStorage'dan gecikmeli yüklenirse yıldızları tazele
    setTimeout(function () { stars(false); }, 1200);
    setTimeout(function () { stars(false); }, 3500);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
