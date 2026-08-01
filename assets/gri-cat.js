/* Gri Cat — sınıf rozetleri için deterministik, sevimli piksel-kedi ikonu.
   Her sınıf (seed) farklı renkli bir kedi alır. Dış kaynak yok, saf inline SVG. */
(function () {
  // 16x16 sevimli kedi yüzü: büyük parlak gözler, pembe kulak/burun, allık, pati.
  // o=kürk, i=kulak içi(pembe), e=göz, h=göz parıltısı(beyaz), n=burun, b=allık, m=ağız
  var MAP = [
    "  oo        oo  ",
    "  oio      oio  ",
    "  oiio    oiio  ",
    "  oooooooooooo  ",
    " oooooooooooooo ",
    " oooooooooooooo ",
    " ooeehooooeehoo ",
    " ooeehooooeehoo ",
    " boooooooooooob ",
    " oooooonnoooooo ",
    " ooooommmmooooo ",
    " oooooooooooooo ",
    "  oooooooooooo  ",
    "   oooooooooo   ",
    "   oo  oo  oo   ",
    "                "
  ];
  var U = 16;

  function hashSeed(seed) {
    var s = String(seed == null ? '' : seed), h = 0;
    for (var i = 0; i < s.length; i++) { h = (h * 31 + s.charCodeAt(i)) >>> 0; }
    return h;
  }

  function svg(seed, px) {
    var h = hashSeed(seed);
    var hue = h % 360;
    var fur = 'hsl(' + hue + ',55%,53%)';
    var ear = 'hsl(340,72%,80%)';
    var eye = '#2b2b33';
    var hl = '#ffffff';
    var nose = 'hsl(340,76%,66%)';
    var blush = 'hsl(350,82%,80%)';
    var mouth = 'hsl(' + hue + ',42%,34%)';
    var bg = 'hsl(' + hue + ',44%,94%)';
    var col = { o: fur, i: ear, e: eye, h: hl, n: nose, b: blush, m: mouth };
    var rects = '';
    for (var r = 0; r < MAP.length; r++) {
      var row = MAP[r];
      for (var c = 0; c < row.length; c++) {
        var ch = row.charAt(c);
        if (ch === ' ') continue;
        rects += '<rect x="' + c + '" y="' + r + '" width="1.03" height="1.03" fill="' + (col[ch] || fur) + '"/>';
      }
    }
    var dim = px ? ('width="' + px + '" height="' + px + '"') : 'width="100%" height="100%"';
    return '<svg viewBox="0 0 ' + U + ' ' + U + '" ' + dim + ' shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg" style="display:block">'
      + '<rect x="0" y="0" width="' + U + '" height="' + U + '" rx="3" fill="' + bg + '"/>'
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
