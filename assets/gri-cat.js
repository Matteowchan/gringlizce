/* Gri Cat — sınıf rozetleri için sevimli kedi ikonu.
   Her sınıf (seed) deterministik olarak bir kedi emojisi + renkli tile alır.
   Emoji = işletim sisteminin profesyonel kedi ikonu; kesin "kedi" görünür. */
(function () {
  var CATS = ['🐱', '😺', '😸', '😻', '😽', '🐈', '😼', '🐈‍⬛'];

  function hashSeed(seed) {
    var s = String(seed == null ? '' : seed), h = 0;
    for (var i = 0; i < s.length; i++) { h = (h * 31 + s.charCodeAt(i)) >>> 0; }
    return h;
  }

  function pick(seed) {
    var h = hashSeed(seed);
    return { cat: CATS[h % CATS.length], hue: h % 360 };
  }

  function svg(seed, px) {
    var p = pick(seed);
    var bg = 'hsl(' + p.hue + ',46%,90%)';
    var dim = px ? ('width="' + px + '" height="' + px + '"') : 'width="100%" height="100%"';
    return '<svg viewBox="0 0 32 32" ' + dim + ' xmlns="http://www.w3.org/2000/svg" style="display:block">'
      + '<rect width="32" height="32" rx="7" fill="' + bg + '"/>'
      + '<text x="16" y="16.5" font-size="19" text-anchor="middle" dominant-baseline="central">' + p.cat + '</text>'
      + '</svg>';
  }

  window.GriCat = {
    svg: svg,
    emoji: function (seed) { return pick(seed).cat; },
    set: function (el, seed, px) {
      if (!el) return;
      el.innerHTML = svg(seed, px);
      el.style.background = 'transparent';
      el.style.padding = '0';
      el.style.overflow = 'hidden';
    }
  };
})();
