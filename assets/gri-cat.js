/* Gri Cat — sınıf rozetleri için deterministik oturan piksel-kedi (referans: siyah oturan kedi).
   Her sınıf (seed) farklı koyu renk tonunda bir kedi alır. Dış kaynak yok, saf inline SVG. */
(function () {
  // 16x18 oturan kedi: sivri kulaklar, pembe kulak içi, sarı gözler, oturan gövde, patiler.
  // o=gövde(koyu), i=kulak içi(pembe), y=göz(sarı)
  var MAP = [
    "   o        o   ",
    "   oo      oo   ",
    "   oio    oio   ",
    "   oiooooooio   ",
    "  oooooooooooo  ",
    "  oooooooooooo  ",
    "  oyyooooooyyo  ",
    "  oyyooooooyyo  ",
    "  oooooooooooo  ",
    "  oooooooooooo  ",
    "   oooooooooo   ",
    "   oooooooooo   ",
    "  oooooooooooo  ",
    " oooooooooooooo ",
    " oooooooooooooo ",
    "oooooooooooooooo",
    "ooooo oooo ooooo",
    "                "
  ];
  var U = 16, H = MAP.length;

  function hashSeed(seed) {
    var s = String(seed == null ? '' : seed), h = 0;
    for (var i = 0; i < s.length; i++) { h = (h * 31 + s.charCodeAt(i)) >>> 0; }
    return h;
  }

  function svg(seed, px) {
    var h = hashSeed(seed);
    var hue = h % 360;
    var body = 'hsl(' + hue + ',36%,24%)';     // koyu, hue ipuçlu (referans: siyah kedi)
    var ear = 'hsl(345,60%,68%)';               // pembe kulak içi
    var eye = '#f4c518';                          // sarı göz
    var bg = 'hsl(' + hue + ',42%,92%)';         // açık renkli tile
    var col = { o: body, i: ear, y: eye };
    var rects = '';
    for (var r = 0; r < H; r++) {
      var row = MAP[r];
      for (var c = 0; c < row.length; c++) {
        var ch = row.charAt(c);
        if (ch === ' ') continue;
        rects += '<rect x="' + c + '" y="' + r + '" width="1.03" height="1.03" fill="' + (col[ch] || body) + '"/>';
      }
    }
    var dim = px ? ('width="' + px + '" height="' + px + '"') : 'width="100%" height="100%"';
    return '<svg viewBox="0 0 ' + U + ' ' + H + '" ' + dim + ' preserveAspectRatio="xMidYMid meet" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg" style="display:block">'
      + '<rect x="-1" y="-1" width="' + (U + 2) + '" height="' + (H + 2) + '" fill="' + bg + '"/>'
      + rects + '</svg>';
  }

  window.GriCat = {
    svg: svg,
    set: function (el, seed, px) {
      if (!el) return;
      el.innerHTML = svg(seed, px);
      el.style.background = 'transparent';
      el.style.padding = '0';
      el.style.overflow = 'hidden';
    }
  };
})();
