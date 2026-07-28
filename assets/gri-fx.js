/* gri-fx.js — paylaşımlı kalite katmanı: konfeti + boş durum + skeleton yardımcıları
   Kullanım:
     GriFX.confetti();                       // ekran ortasından kutlama
     GriFX.confetti({ x: 0.5, y: 0.3 });     // oransal köken
     GriFX.emptyState(el, { icon:'🐱', title:'...', text:'...', ctaText:'...', ctaHref:'...' });
     GriFX.skeleton(el, { lines:3 });        // veya { card:true, count:3 }
*/
(function () {
  'use strict';
  var reduce = false;
  try { reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

  var COLORS = ['#2C5856', '#C09947', '#8E3B4C', '#3a726e', '#e0b669', '#4a8a52'];

  function confetti(opts) {
    opts = opts || {};
    if (reduce) return;
    var n = opts.count || 90;
    var ox = (opts.x != null ? opts.x : 0.5) * window.innerWidth;
    var oy = (opts.y != null ? opts.y : 0.42) * window.innerHeight;

    var cv = document.createElement('canvas');
    cv.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:99999;';
    cv.width = window.innerWidth; cv.height = window.innerHeight;
    document.body.appendChild(cv);
    var ctx = cv.getContext('2d');

    var parts = [];
    for (var i = 0; i < n; i++) {
      var ang = (Math.PI * 2) * (i / n) + (i % 3) * 0.2;
      var spd = 5 + (i % 7);
      parts.push({
        x: ox, y: oy,
        vx: Math.cos(ang) * spd * (0.6 + (i % 5) / 6),
        vy: Math.sin(ang) * spd - 4 - (i % 4),
        g: 0.22 + (i % 3) * 0.03,
        s: 5 + (i % 5),
        rot: (i % 360) * (Math.PI / 180),
        vr: (i % 2 ? 1 : -1) * (0.1 + (i % 5) / 30),
        c: COLORS[i % COLORS.length],
        life: 0
      });
    }

    var maxLife = 120;
    function frame() {
      ctx.clearRect(0, 0, cv.width, cv.height);
      var alive = 0;
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        if (p.life > maxLife) continue;
        alive++;
        p.life++;
        p.vy += p.g;
        p.x += p.vx; p.y += p.vy; p.rot += p.vr;
        var alpha = Math.max(0, 1 - p.life / maxLife);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.c;
        ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.6);
        ctx.restore();
      }
      if (alive > 0) { requestAnimationFrame(frame); }
      else { if (cv.parentNode) cv.parentNode.removeChild(cv); }
    }
    requestAnimationFrame(frame);
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function emptyState(el, o) {
    if (!el) return;
    o = o || {};
    var cta = (o.ctaText && o.ctaHref)
      ? '<a class="gri-empty-cta" href="' + esc(o.ctaHref) + '">' + esc(o.ctaText) + '</a>'
      : '';
    el.innerHTML = '<div class="gri-empty">'
      + '<div class="gri-empty-ic">' + (o.icon || '🐱') + '</div>'
      + '<h4>' + esc(o.title || 'Burada henüz bir şey yok') + '</h4>'
      + (o.text ? '<p>' + esc(o.text) + '</p>' : '')
      + cta
      + '</div>';
  }

  function skeleton(el, o) {
    if (!el) return;
    o = o || {};
    var html = '<div class="gri-skel-wrap">';
    if (o.card) {
      var cn = o.count || 3;
      for (var i = 0; i < cn; i++) html += '<div class="gri-skeleton gri-skel-card"></div>';
    } else {
      var ln = o.lines || 3;
      var widths = ['w80', '', 'w60', 'w40', 'w80', 'w60'];
      for (var j = 0; j < ln; j++) html += '<div class="gri-skeleton gri-skel-line ' + (widths[j % widths.length]) + '"></div>';
    }
    html += '</div>';
    el.innerHTML = html;
  }

  window.GriFX = { confetti: confetti, emptyState: emptyState, skeleton: skeleton, reduce: reduce };
})();
