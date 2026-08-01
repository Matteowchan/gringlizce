/* Gri Cat — sınıf rozetleri için deterministik piksel-kedi ikonu.
   Her sınıf (seed) farklı renkli bir kedi alır. Dış kaynak yok, saf inline SVG. */
(function () {
  var MAP = [
    "  o        o  ",
    "  oo      oo  ",
    "  oio    oio  ",
    "  oiooooooio  ",
    " oooooooooooo ",
    " ooeoooooeooo ",
    " oooooooooooo ",
    " ooooonnooooo ",
    " oooooooooooo ",
    " oooooooooooo ",
    "  oooooooooo  ",
    "  oooooooooo  ",
    "   oooooooo   ",
    "    oo  oo    "
  ];
  var U = 14;

  function hashSeed(seed) {
    var s = String(seed == null ? '' : seed), h = 0;
    for (var i = 0; i < s.length; i++) { h = (h * 31 + s.charCodeAt(i)) >>> 0; }
    return h;
  }

  function svg(seed, px) {
    var h = hashSeed(seed);
    var hue = h % 360;
    var body = 'hsl(' + hue + ',52%,46%)';
    var ear = 'hsl(' + hue + ',58%,75%)';
    var bg = 'hsl(' + hue + ',42%,93%)';
    var eye = '#243039';
    var nose = 'hsl(342,66%,67%)';
    var rects = '';
    for (var r = 0; r < MAP.length; r++) {
      var row = MAP[r];
      for (var c = 0; c < row.length; c++) {
        var ch = row.charAt(c);
        if (ch === ' ') continue;
        var col = ch === 'e' ? eye : ch === 'n' ? nose : ch === 'i' ? ear : body;
        rects += '<rect x="' + c + '" y="' + r + '" width="1.02" height="1.02" fill="' + col + '"/>';
      }
    }
    var dim = px ? ('width="' + px + '" height="' + px + '"') : 'width="100%" height="100%"';
    return '<svg viewBox="0 0 ' + U + ' ' + U + '" ' + dim + ' shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg" style="display:block">'
      + '<rect x="0" y="0" width="' + U + '" height="' + U + '" rx="3" fill="' + bg + '"/>'
      + rects + '</svg>';
  }

  window.GriCat = {
    svg: svg,
    // Bir elemanın içini kediyle doldur (badge kare). Yeşil arka planı SVG'nin bg'si kaplar.
    set: function (el, seed, px) {
      if (!el) return;
      el.innerHTML = svg(seed, px);
      el.style.background = 'transparent';
      el.style.padding = '0';
      el.style.overflow = 'hidden';
    }
  };
})();
