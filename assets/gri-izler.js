/* gri-izler.js — "Çalışma İzleri" (Faz 6.5)
   Öğrencinin gerçek çalışmasının bıraktığı izleri sakin, dürüst biçimde gösterir:
   ulaşılmış kilometre taşları (kaç soru, kaç farklı gün, ne zamandan beri).
   Puan/rozet/baskı YOK — yalnız gerçekten olan şey. Metrik panosu değil, bir iz defteri.
   Güvenli: RLS ile yalnız kullanıcının kendi user_answers verisi; veri yoksa/giriş yoksa
   sessizce sıcak bir ilk-kullanım durumu. Uydurma sayı yok. */
(function () {
  'use strict';
  if (window.GriIzler) return;
  var SB_URL = 'https://vazbvbqgvtlaqkytfsbi.supabase.co';
  var SB_KEY = 'sb_publishable_F5K-wIVQHXlD4e4GYnySNw_Xm4teO9g';

  var AYLAR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  // Kilometre taşı merdivenleri (yalnız ulaşılanlar gösterilir)
  var SORU_TASLARI = [10, 25, 50, 100, 200, 350, 500, 750, 1000, 1500, 2000];
  var GUN_TASLARI = [3, 7, 14, 30, 60, 100, 200];

  function client() {
    if (window.GRI_SB) return window.GRI_SB;
    if (window.griTrackSB) return window.griTrackSB;
    if (window.GriAuth && window.GriAuth.supabase) return window.GriAuth.supabase;
    try { if (window.supabase && window.supabase.createClient) { window.griTrackSB = window.supabase.createClient(SB_URL, SB_KEY); return window.griTrackSB; } } catch (e) {}
    return null;
  }

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function trTarih(d) { if (!(d instanceof Date) || isNaN(d)) return ''; return d.getDate() + ' ' + AYLAR[d.getMonth()] + ' ' + d.getFullYear(); }
  function gunFarki(a, b) { return Math.max(0, Math.round((b.getTime() - a.getTime()) / 86400000)); }
  // ulaşılan en yüksek taş + o taşın etiketi
  function reached(ladder, val) { var hit = 0; for (var i = 0; i < ladder.length; i++) { if (val >= ladder[i]) hit = ladder[i]; else break; } return hit; }
  function next(ladder, val) { for (var i = 0; i < ladder.length; i++) { if (val < ladder[i]) return ladder[i]; } return null; }

  function ensureStyle() {
    if (document.getElementById('gri-iz-css')) return;
    var s = document.createElement('style'); s.id = 'gri-iz-css';
    s.textContent =
      '.griz{background:var(--bg-card,#FBF6EC);border:1px solid var(--line,#E3D8C3);border-radius:16px;box-shadow:var(--shadow-sm,0 1px 2px rgba(44,42,38,.05));padding:1.2rem 1.3rem;font-family:var(--font-ui,Inter,system-ui,sans-serif)}' +
      '.griz-head{display:flex;align-items:center;gap:.6rem;margin-bottom:.15rem}' +
      '.griz-head .em{width:34px;height:34px;border-radius:9px;background:var(--teal-soft,rgba(46,110,106,.12));display:flex;align-items:center;justify-content:center;flex:none}' +
      '.griz-head h2{font-family:var(--font-display,Georgia,serif);font-size:1.2rem;margin:0;color:var(--text,#241E17)}' +
      '.griz-sub{font-size:.85rem;color:var(--text-soft,#6E6353);margin:.15rem 0 1rem;line-height:1.5}' +
      '.griz-sub b{color:var(--text,#241E17);font-weight:700}' +
      '.griz-row{display:flex;flex-wrap:wrap;gap:.55rem}' +
      '.griz-stone{display:flex;align-items:center;gap:.55rem;background:var(--bg-soft,#F4EFE3);border:1px solid var(--line,#E3D8C3);border-radius:12px;padding:.55rem .8rem;min-width:0}' +
      '.griz-stone .dot{width:26px;height:26px;flex:none;border-radius:50%;background:var(--teal-soft,rgba(46,110,106,.14));display:flex;align-items:center;justify-content:center;color:var(--teal,#2E6E6A)}' +
      '.griz-stone .dot svg{width:15px;height:15px;display:block}' +
      '.griz-stone .b{display:flex;flex-direction:column;min-width:0}' +
      '.griz-stone .t{font-size:.9rem;font-weight:700;color:var(--text,#241E17);line-height:1.2}' +
      '.griz-stone .d{font-size:.74rem;color:var(--text-muted,#8B7F6B);line-height:1.3}' +
      '.griz-next{display:flex;align-items:center;gap:.6rem;margin-top:1rem;padding:.7rem .9rem;background:transparent;border:1px dashed var(--line-strong,#C9BCA0);border-radius:12px}' +
      '.griz-next .dot{width:26px;height:26px;flex:none;border-radius:50%;border:1.5px dashed var(--line-strong,#C9BCA0);display:flex;align-items:center;justify-content:center;color:var(--text-muted,#8B7F6B);font-size:.68rem;font-weight:700}' +
      '.griz-next p{margin:0;font-size:.85rem;color:var(--text-soft,#6E6353);line-height:1.45}' +
      '.griz-next p b{color:var(--text,#241E17);font-weight:700}' +
      '.griz-empty{display:flex;gap:.9rem;align-items:center}' +
      '.griz-empty img{width:52px;height:52px;border-radius:50%;object-fit:cover;flex:none}' +
      '.griz-empty p{margin:0;font-size:.9rem;color:var(--text-soft,#6E6353);line-height:1.55}' +
      '.griz-note{font-size:.78rem;color:var(--text-muted,#8B7F6B);margin:.9rem 0 0}';
    document.head.appendChild(s);
  }

  var CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';

  function renderEmpty(el) {
    el.className = 'griz';
    el.innerHTML =
      '<div class="griz-head"><span class="em">🪶</span><h2>Çalışma İzleri</h2></div>' +
      '<div class="griz-empty"><img src="assets/gri-cat-happy.png" alt="Gri"><p>Çalışman burada iz bırakacak. İlk sorularını çözdükçe, kaç gün geldiğin ve nereye kadar ilerlediğin küçük izler hâlinde birikecek — kimseyle yarışmadan, kendi tempona göre.</p></div>' +
      '<div style="margin-top:.9rem"><a href="soru-bankasi" style="font-weight:700;font-size:.9rem;color:var(--teal,#2E6E6A);text-decoration:none">İlk izini bırak →</a></div>';
  }

  function stone(title, sub) {
    return '<div class="griz-stone"><span class="dot">' + CHECK + '</span><span class="b"><span class="t">' + esc(title) + '</span>' + (sub ? '<span class="d">' + esc(sub) + '</span>' : '') + '</span></div>';
  }

  function render(el, data) {
    el.className = 'griz';
    var stones = [];
    // 1) ne zamandan beri
    var span = data.firstDay ? gunFarki(data.firstDay, new Date()) : 0;
    // 2) toplam soru taşı
    var soruTas = reached(SORU_TASLARI, data.total);
    if (soruTas) stones.push(stone(soruTas + ' soru', 'çözdüğün soru sayısı bunu geçti'));
    // 3) farklı gün taşı
    var gunTas = reached(GUN_TASLARI, data.days);
    if (gunTas) stones.push(stone(gunTas + ' farklı gün', 'bu kadar ayrı günde çalıştın'));
    // 4) süreklilik izi (ilk günden bugüne)
    if (span >= 7 && data.firstDay) stones.push(stone(span + ' gündür buradasın', trTarih(data.firstDay) + '’den beri'));

    // "yaklaştığın iz" — en yakın ulaşılmamış taş (oransal olarak)
    var nextSoru = next(SORU_TASLARI, data.total);
    var nextGun = next(GUN_TASLARI, data.days);
    var nextHtml = '';
    var pickSoru = nextSoru ? (data.total / nextSoru) : 0;
    var pickGun = nextGun ? (data.days / nextGun) : 0;
    if (nextSoru && pickSoru >= pickGun) {
      var kalan = nextSoru - data.total;
      nextHtml = '<div class="griz-next"><span class="dot">' + nextSoru + '</span><p>Yaklaştığın bir iz: <b>' + nextSoru + ' soru</b>. ' + kalan + ' soru kaldı — acele yok, geldiğinde burada olacak.</p></div>';
    } else if (nextGun) {
      var kalanG = nextGun - data.days;
      nextHtml = '<div class="griz-next"><span class="dot">' + nextGun + '</span><p>Yaklaştığın bir iz: <b>' + nextGun + ' farklı gün</b>. ' + kalanG + ' gün daha geldiğinde bu iz de düşer.</p></div>';
    }

    var lead = 'Bugüne kadar <b>' + data.total + ' soru</b> çözdün, <b>' + data.days + ' farklı gün</b> geldin' +
      (data.firstDay ? ' — <b>' + trTarih(data.firstDay) + '</b>’den beri buradasın' : '') + '.';

    el.innerHTML =
      '<div class="griz-head"><span class="em">🪶</span><h2>Çalışma İzleri</h2></div>' +
      '<p class="griz-sub">' + lead + '</p>' +
      (stones.length ? '<div class="griz-row">' + stones.join('') + '</div>' : '') +
      nextHtml +
      '<p class="griz-note">Bunlar puan değil; yalnızca senin çalışmanın bıraktığı gerçek izler. Kimseyle yarışmıyorsun.</p>';
  }

  function load(el) {
    ensureStyle();
    var c = client();
    if (!c) { renderEmpty(el); return; }
    (async function () {
      try {
        var sess = await c.auth.getSession();
        var u = sess && sess.data && sess.data.session ? sess.data.session.user.id : null;
        if (!u) { renderEmpty(el); return; }
        var res = await c.from('user_answers').select('answered_at').eq('user_id', u).limit(5000);
        var rows = (res && res.data) ? res.data : [];
        if (!rows.length) { renderEmpty(el); return; }
        var total = rows.length;
        var dayset = {}, first = null;
        rows.forEach(function (r) {
          if (!r.answered_at) return;
          var d = new Date(r.answered_at); if (isNaN(d)) return;
          var key = d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
          dayset[key] = 1;
          if (!first || d < first) first = d;
        });
        var days = Object.keys(dayset).length;
        render(el, { total: total, days: days, firstDay: first });
      } catch (e) { renderEmpty(el); }
    })();
  }

  window.GriIzler = {
    mount: function (target) { var el = typeof target === 'string' ? document.querySelector(target) : target; if (el) load(el); }
  };
})();
