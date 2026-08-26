/* gri-spell.js — Gri Meet canlı yazım denetimi (EN + TR), overlay tabanlı.
 * Tarayıcının yerel spellcheck'i tek dil + geç görünür. Bu modül:
 *  - assets/gri-dict-en.txt (~47k) + assets/gri-dict-tr.txt (~130k) sözlüklerini
 *    yalnızca denetim AÇILINCA bir kez yükler (Set),
 *  - Quill editörünün üstüne konumlanan, düzenlemeyi engellemeyen (pointer-events:none)
 *    bir overlay'e yazarken (~300ms debounce) kırmızı dalgalı çizgiler çizer,
 *  - Dokümanı DEĞİŞTİRMEZ (Quill delta üretmez) → senkron/öğrenci tarafı bozulmaz.
 * Türkçe: sözlükte 130k çekimli form + basit özyinelemeli ek-soyma ile kök kontrolü
 * (yanlış-pozitifleri azaltmak için hoşgörülü: emin değilse işaretlemez).
 */
(function () {
  var EN = null, TR = null, loadingP = null, BASE = null;
  function base() {
    if (BASE != null) return BASE;
    // gri-spell.js'nin yüklendiği klasörden sözlükleri çöz (assets/)
    BASE = 'assets/';
    try {
      var s = document.currentScript || (function () { var a = document.getElementsByTagName('script'); for (var i = a.length - 1; i >= 0; i--) { if (/gri-spell\.js/.test(a[i].src)) return a[i]; } return null; })();
      if (s && s.src) { BASE = s.src.replace(/gri-spell\.js.*$/, ''); }
    } catch (e) {}
    return BASE;
  }
  function load() {
    if (EN && TR) return Promise.resolve();
    if (loadingP) return loadingP;
    var b = base();
    function grab(name) {
      return fetch(b + name).then(function (r) { if (!r.ok) throw new Error(name + ' ' + r.status); return r.text(); });
    }
    loadingP = Promise.all([grab('gri-dict-en.txt'), grab('gri-dict-tr.txt')]).then(function (arr) {
      var en = new Set(arr[0].split(/\r?\n/).filter(Boolean));
      var tr = new Set(arr[1].split(/\r?\n/).filter(Boolean));
      // Kısmi/boş yükleme koruması: eksikse HİÇ işaretleme yapma (her şeyi kırmızı yapmaktansa),
      // EN/TR yalnızca ikisi de gerçekten dolu gelince atanır → ready() true olur.
      if (en.size < 1000 || tr.size < 1000) throw new Error('dict too small en=' + en.size + ' tr=' + tr.size);
      EN = en; TR = tr;
    }).catch(function (e) { EN = null; TR = null; loadingP = null; throw e; });
    return loadingP;
  }
  function ready() { return !!(EN && TR); }

  function foldEn(w) { return w.toLowerCase(); }
  function foldTr(w) { return w.replace(/İ/g, 'i').replace(/I/g, 'ı').toLowerCase(); }

  // Türkçe ekler (çekim + türetim; özyinelemeli soyma ile katmanlı ekleri kapsar)
  var TRSUF = ['abiliyor', 'ebiliyor', 'amıyor', 'emiyor', 'ıyorum', 'iyorum', 'uyorum', 'üyorum', 'ıyorsun', 'iyorsun',
    'larımız', 'lerimiz', 'larınız', 'leriniz', 'larından', 'lerinden', 'larımı', 'lerimi', 'larını', 'lerini',
    'abilir', 'ebilir', 'acağım', 'eceğim', 'acaksın', 'eceksin', 'madan', 'meden', 'arak', 'erek', 'ınca', 'ince', 'unca', 'ünce',
    'ımız', 'imiz', 'umuz', 'ümüz', 'ınız', 'iniz', 'unuz', 'ünüz',
    'ların', 'lerin', 'ları', 'leri', 'larla', 'lerle', 'lardan', 'lerden', 'lara', 'lere', 'larda', 'lerde',
    'siniz', 'sınız', 'sunuz', 'sünüz', 'abil', 'ebil', 'acak', 'ecek', 'iyor', 'ıyor', 'uyor', 'üyor', 'yor',
    'mış', 'miş', 'muş', 'müş', 'malı', 'meli', 'mez', 'maz', 'mıyor', 'miyor', 'muyor', 'müyor',
    'sin', 'sın', 'sun', 'sün', 'sam', 'sem', 'san', 'sen', 'sak', 'sek', 'ken',
    'dır', 'dir', 'dur', 'dür', 'tır', 'tir', 'tur', 'tür', 'dık', 'dik', 'duk', 'dük', 'tık', 'tik', 'tuk', 'tük',
    'lar', 'ler', 'nda', 'nde', 'ndan', 'nden', 'dan', 'den', 'tan', 'ten', 'nın', 'nin', 'nun', 'nün',
    'yla', 'yle', 'yız', 'yiz', 'yuz', 'yüz', 'ki', 'lık', 'lik', 'luk', 'lük', 'sız', 'siz', 'suz', 'süz',
    'lı', 'li', 'lu', 'lü', 'ca', 'ce', 'ça', 'çe', 'mak', 'mek', 'dı', 'di', 'du', 'dü', 'tı', 'ti', 'tu', 'tü', 'sa', 'se',
    'da', 'de', 'ta', 'te', 'na', 'ne', 'ya', 'ye', 'la', 'le', 'yı', 'yi', 'yu', 'yü', 'ır', 'ir', 'ur', 'ür', 'ar', 'er',
    'ın', 'in', 'un', 'ün', 'ım', 'im', 'um', 'üm', 'ız', 'iz', 'uz', 'üz',
    'a', 'e', 'ı', 'i', 'u', 'ü', 'n', 'm', 'r', 's', 'k'];
  function trRoot(w, depth) {
    if (TR.has(w)) return true;
    if (w.length >= 2 && (TR.has(w + 'mak') || TR.has(w + 'mek'))) return true; // çıplak fiil gövdesi (mastar sözlükte: yap→yapmak)
    if (depth <= 0) return false;
    for (var i = 0; i < TRSUF.length; i++) {
      var s = TRSUF[i];
      if (w.length > s.length + 1 && w.slice(-s.length) === s) {
        if (trRoot(w.slice(0, -s.length), depth - 1)) return true;
      }
    }
    return false;
  }

  function checkWord(raw) {
    if (!raw) return true;
    if (/[0-9_]/.test(raw)) return true;                 // sayı/karışık → geç
    // Kesme işareti: İngilizce kasılma (don't) sözlükte; Türkçe özel ad'de eki (Türkiye'de) için apostrof öncesini kontrol et
    if (/['’]/.test(raw)) {
      var seg = raw.split(/['’]/)[0];
      if (seg.length >= 2) { var se = foldEn(seg), st = foldTr(seg); if (EN.has(se) || TR.has(st) || trRoot(st, 5) || TR.has(se)) return true; }
    }
    var en = foldEn(raw), tr = foldTr(raw);
    if (en.length <= 1) return true;                     // tek harf → geç (a, I…)
    if (EN.has(en)) return true;
    if (TR.has(tr) || trRoot(tr, 5)) return true;
    if (TR.has(en) || trRoot(en, 5)) return true;        // "internet" gibi ortak
    if (EN.has(tr)) return true;
    return false;
  }

  // Kelime: harf dizisi (İngilizce + Türkçe harfler + iç kesme işareti)
  var WORD_RE = /[A-Za-zÇĞİıÖŞÜçğöşü][A-Za-zÇĞİıÖŞÜçğöşü'’]*/g;

  function attach(quill) {
    if (!quill || !quill.root) return null;
    var editor = quill.root;                              // .ql-editor (contenteditable, scroll eden)
    var container = editor.parentNode;                   // .ql-container
    try { if (getComputedStyle(container).position === 'static') container.style.position = 'relative'; } catch (e) {}
    var ov = document.createElement('div');
    ov.className = 'gm-spell-ov';
    ov.setAttribute('aria-hidden', 'true');
    container.appendChild(ov);
    var enabled = false, t = null, ro = null;

    function clear() { ov.textContent = ''; }
    function place() {
      // overlay'i editörün görünür alanına oturt
      ov.style.left = editor.offsetLeft + 'px';
      ov.style.top = editor.offsetTop + 'px';
      ov.style.width = editor.clientWidth + 'px';
      ov.style.height = editor.clientHeight + 'px';
    }
    function paint() {
      clear();
      if (!enabled || !ready()) return;
      place();
      var cRect = container.getBoundingClientRect();
      var offX = cRect.left - editor.scrollLeft, offY = cRect.top - editor.scrollTop;
      // düzeltme: overlay container'a göre absolute; kelime rect'i viewport'tan container'a çevir
      var baseRect = ov.getBoundingClientRect();
      var walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT, null);
      var node, frag = document.createDocumentFragment(), count = 0;
      while ((node = walker.nextNode())) {
        var text = node.nodeValue; if (!text || !text.trim()) continue;
        WORD_RE.lastIndex = 0; var m;
        while ((m = WORD_RE.exec(text))) {
          var w = m[0];
          if (w.length < 2) continue;
          if (checkWord(w)) continue;
          if (count > 800) break;                        // güvenlik sınırı
          try {
            var rng = document.createRange();
            rng.setStart(node, m.index); rng.setEnd(node, m.index + w.length);
            var rects = rng.getClientRects();
            for (var i = 0; i < rects.length; i++) {
              var r = rects[i]; if (!r.width) continue;
              var u = document.createElement('span'); u.className = 'gm-spell-u';
              u.style.left = (r.left - baseRect.left) + 'px';
              u.style.top = (r.bottom - baseRect.top - 3) + 'px';
              u.style.width = r.width + 'px';
              frag.appendChild(u); count++;
            }
          } catch (e) {}
        }
        if (count > 800) break;
      }
      ov.appendChild(frag);
    }
    var schedule = function () { if (t) clearTimeout(t); t = setTimeout(paint, 320); };
    var repaintNow = function () { if (enabled) paint(); };

    quill.on('text-change', schedule);
    editor.addEventListener('scroll', repaintNow, { passive: true });
    window.addEventListener('resize', schedule);
    try { ro = new ResizeObserver(schedule); ro.observe(editor); } catch (e) {}

    return {
      setEnabled: function (on) { enabled = !!on; if (enabled) schedule(); else clear(); },
      refresh: schedule,
      destroy: function () {
        enabled = false; clear();
        try { quill.off('text-change', schedule); } catch (e) {}
        try { editor.removeEventListener('scroll', repaintNow); } catch (e) {}
        try { window.removeEventListener('resize', schedule); } catch (e) {}
        try { if (ro) ro.disconnect(); } catch (e) {}
        try { ov.remove(); } catch (e) {}
      }
    };
  }

  window.GriSpell = { load: load, ready: ready, attach: attach, check: checkWord };
})();
