/* gri-ogretmen-ipuclari.js — "Öğretmen İpuçları" (Faz 6.7)
   Öğretmenin sınıf panelinde, GERÇEK sınıf verisinden hesaplanan sakin, uygulanabilir
   birkaç ipucu gösterir: değerlendirme bekleyen yazılar, süresi geçmiş ödevler,
   uzun süredir pasif öğrenciler, düşük tamamlanan ödevler. Baskı/utandırma YOK,
   öğrenci ismi YOK — yalnız sayılar + ilgili sekmeye götüren aksiyon.
   Mevcut RPC'leri kullanır (class_roster / list_class_assignments / list_class_writings);
   yeni sunucu fonksiyonu gerekmez. RLS: yalnız öğretmenin kendi sınıfı.
   Bir şey yoksa "sınıfın iyi durumda" durumu. */
(function () {
  'use strict';
  if (window.GriOgretmenIpuclari) return;
  var SB_URL = 'https://vazbvbqgvtlaqkytfsbi.supabase.co';
  var SB_KEY = 'sb_publishable_F5K-wIVQHXlD4e4GYnySNw_Xm4teO9g';
  var DAY = 86400000;

  function client() {
    if (window.sb) return window.sb;
    if (window.GRI_SB) return window.GRI_SB;
    if (window.GriAuth && window.GriAuth.supabase) return window.GriAuth.supabase;
    try { if (window.supabase && window.supabase.createClient) return window.supabase.createClient(SB_URL, SB_KEY, { auth: { persistSession: true, autoRefreshToken: true } }); } catch (e) {}
    return null;
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function ageDays(iso) { if (!iso) return null; var t = new Date(iso).getTime(); if (isNaN(t)) return null; return Math.floor((Date.now() - t) / DAY); }
  function gotoTab(t) { var b = document.querySelector('.ks-tab[data-tab="' + t + '"]'); if (b) { b.click(); try { b.scrollIntoView({ block: 'center', behavior: 'auto' }); } catch (e) {} } }

  function ensureStyle() {
    if (document.getElementById('gri-oi-css')) return;
    var s = document.createElement('style'); s.id = 'gri-oi-css';
    s.textContent =
      '.grioi{background:var(--bg-card,#FBF6EC);border:1px solid var(--line,#E3D8C3);border-radius:16px;box-shadow:var(--shadow-sm,0 1px 2px rgba(44,42,38,.05));padding:1.15rem 1.3rem;margin:1.1rem 0 0;font-family:var(--font-ui,Inter,system-ui,sans-serif)}' +
      '.grioi-head{display:flex;align-items:center;gap:.6rem;margin-bottom:.15rem}' +
      '.grioi-head .em{width:32px;height:32px;flex:none;border-radius:9px;background:var(--teal-soft,rgba(46,110,106,.12));display:flex;align-items:center;justify-content:center}' +
      '.grioi-head h3{font-family:var(--font-display,Georgia,serif);font-size:1.15rem;margin:0;color:var(--text,#241E17)}' +
      '.grioi-sub{font-size:.84rem;color:var(--text-soft,#6E6353);margin:.1rem 0 .9rem}' +
      '.grioi-list{display:flex;flex-direction:column;gap:.55rem}' +
      '.grioi-row{display:flex;align-items:center;gap:.8rem;background:var(--bg-soft,#F4EFE3);border:1px solid var(--line,#E3D8C3);border-left:3px solid var(--gold,#B78A2E);border-radius:11px;padding:.65rem .85rem}' +
      '.grioi-row.urgent{border-left-color:var(--teal,#2E6E6A)}' +
      '.grioi-row .ic{font-size:1.15rem;flex:none;width:1.5rem;text-align:center}' +
      '.grioi-row .tx{flex:1;min-width:0;font-size:.92rem;line-height:1.45;color:var(--text,#241E17)}' +
      '.grioi-row .go{flex:none;font:inherit;font-size:.82rem;font-weight:700;color:var(--teal,#2E6E6A);background:none;border:1px solid var(--line-strong,#C9BCA0);border-radius:8px;padding:.35rem .7rem;cursor:pointer;white-space:nowrap}' +
      '.grioi-row .go:hover{border-color:var(--teal,#2E6E6A);background:var(--teal-soft,rgba(46,110,106,.12))}' +
      '.grioi-empty{display:flex;align-items:center;gap:.8rem;color:var(--text-soft,#6E6353);font-size:.9rem;line-height:1.5}' +
      '.grioi-empty img{width:40px;height:40px;border-radius:50%;flex:none;object-fit:cover}' +
      '.grioi-note{font-size:.76rem;color:var(--text-muted,#8B7F6B);margin:.85rem 0 0}';
    document.head.appendChild(s);
  }

  function renderEmpty(el) {
    el.hidden = false; el.className = 'grioi';
    el.innerHTML =
      '<div class="grioi-head"><span class="em">🧭</span><h3>Öğretmen İpuçları</h3></div>' +
      '<div class="grioi-empty"><img src="assets/gri-cat-happy.png" alt="Gri"><span>Şu an dikkat isteyen bir şey görünmüyor — sınıfın iyi durumda. Yeni teslimler geldikçe burada özetlerim.</span></div>';
  }

  function render(el, hints) {
    if (!hints.length) { renderEmpty(el); return; }
    el.hidden = false; el.className = 'grioi';
    var rows = hints.map(function (h) {
      return '<div class="grioi-row' + (h.urgent ? ' urgent' : '') + '">' +
        '<span class="ic" aria-hidden="true">' + h.ic + '</span>' +
        '<span class="tx">' + esc(h.text) + '</span>' +
        '<button type="button" class="go" data-tab="' + esc(h.tab) + '">' + esc(h.action) + '</button></div>';
    }).join('');
    el.innerHTML =
      '<div class="grioi-head"><span class="em">🧭</span><h3>Öğretmen İpuçları</h3></div>' +
      '<p class="grioi-sub">Sınıfının verisinden birkaç sakin öneri — sıra sende.</p>' +
      '<div class="grioi-list">' + rows + '</div>' +
      '<p class="grioi-note">Yalnızca senin sınıfının gerçek verisinden; sayılar tıklayınca ilgili sekmeye götürür.</p>';
    [].forEach.call(el.querySelectorAll('.go'), function (b) { b.addEventListener('click', function () { gotoTab(b.getAttribute('data-tab')); }); });
  }

  function compute(roster, assigns, writings) {
    var hints = [], now = Date.now();

    // 1) Değerlendirme bekleyen yazılar (öğretmenin kendi işi → en öncelikli)
    var ungraded = writings.filter(function (w) { return w && w.has_evaluation === false; }).length;
    if (ungraded > 0) hints.push({ ic: '✍️', urgent: true, pr: 1, tab: 'writings',
      text: ungraded + ' öğrenci yazısı geri bildirim bekliyor.', action: 'Yazılar' });

    // 2) Süresi geçmiş, hâlâ eksik teslimli ödevler
    var overdue = assigns.filter(function (a) { return a.due_date && new Date(a.due_date).getTime() < now && (a.pending_count || 0) > 0; });
    if (overdue.length) {
      var pend = overdue.reduce(function (s, a) { return s + (a.pending_count || 0); }, 0);
      hints.push({ ic: '⏳', urgent: true, pr: 2, tab: 'assignments',
        text: overdue.length + (overdue.length === 1 ? ' ödevin' : ' ödevin') + ' süresi doldu; toplam ' + pend + ' teslim eksik.', action: 'Ödevler' });
    }

    // 3) Uzun süredir pasif öğrenciler (7+ gün; yeni katılanları sayma)
    var inactive = roster.filter(function (s) {
      var joined = ageDays(s.joined_at); if (joined != null && joined < 7) return false;
      var la = ageDays(s.last_active);
      return la == null || la >= 7;
    }).length;
    if (inactive > 0) hints.push({ ic: '🌱', pr: 3, tab: 'students',
      text: inactive + ' öğrenci son 7 gündür aktif değil — küçük bir hatırlatma iyi gelebilir.', action: 'Öğrenciler' });

    // 4) Düşük tamamlanan (süresi geçmemiş) ödevler
    var low = assigns.filter(function (a) {
      var ts = a.total_students || 0, cc = a.completed_count || 0;
      var notOver = !a.due_date || new Date(a.due_date).getTime() >= now;
      return notOver && ts >= 3 && (cc / ts) < 0.4;
    }).length;
    if (low > 0) hints.push({ ic: '📊', pr: 4, tab: 'assignments',
      text: low + ' ödevi sınıfın çoğu henüz tamamlamadı.', action: 'Ödevler' });

    hints.sort(function (a, b) { return a.pr - b.pr; });
    return hints.slice(0, 3);
  }

  function load(el) {
    ensureStyle();
    var sb = client();
    var classId = new URLSearchParams(window.location.search).get('id') || window.classId || null;
    if (!sb || !classId) { el.hidden = true; return; }
    (async function () {
      try {
        var sess = await sb.auth.getSession();
        if (!sess || !sess.data || !sess.data.session) { el.hidden = true; return; }
        var res = await Promise.all([
          sb.rpc('class_roster', { p_class_id: classId }),
          sb.rpc('list_class_assignments', { p_class_id: classId }),
          sb.rpc('list_class_writings', { p_class_id: classId })
        ]);
        var roster = (res[0] && res[0].data) || [];
        var assigns = (res[1] && res[1].data) || [];
        var writings = (res[2] && res[2].data) || [];
        if (!Array.isArray(roster)) roster = [];
        if (!Array.isArray(assigns)) assigns = [];
        if (!Array.isArray(writings)) writings = [];
        render(el, compute(roster, assigns, writings));
      } catch (e) { el.hidden = true; }
    })();
  }

  window.GriOgretmenIpuclari = {
    mount: function (target) { var el = typeof target === 'string' ? document.querySelector(target) : target; if (el) load(el); }
  };
})();
