/* ============================================================
   Gri English — Hata Bildir butonu
   Sayfaya floating bir buton ekler, modal ile form acar,
   Supabase'e bug_reports tablosuna insert atar.

   Kullanim:
     <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2" defer></script>
     <script src="assets/bug-report.js" defer></script>

   Sayfa yuklendikten sonra otomatik calisir, baska kurulum gerekmez.
   ============================================================ */

(function () {
  var SUPABASE_URL = 'https://vazbvbqgvtlaqkytfsbi.supabase.co';
  var SUPABASE_KEY = 'sb_publishable_F5K-wIVQHXlD4e4GYnySNw_Xm4teO9g';

  // Stil
  var css =
    '#gri-bug-btn{position:fixed;top:96px;right:18px;z-index:9998;background:#fcfaf3;color:#1a2a28;border:1px solid #d8d2c4;padding:0.45rem 0.8rem;border-radius:3px;font:600 0.8rem/1 Georgia,serif;cursor:pointer;box-shadow:0 1px 3px rgba(0,0,0,0.08);letter-spacing:0.02em}' +
    '#gri-bug-btn:hover{background:#fff;border-color:#1a2a28}' +
    '#gri-bug-overlay{position:fixed;inset:0;background:rgba(20,25,24,0.55);z-index:9999;display:none;align-items:center;justify-content:center;padding:1rem}' +
    '#gri-bug-overlay.show{display:flex}' +
    '#gri-bug-modal{background:#fcfaf3;border:1px solid #d8d2c4;border-radius:4px;max-width:520px;width:100%;padding:1.5rem 1.6rem;font-family:Georgia,serif;color:#1a2a28;box-shadow:0 8px 28px rgba(0,0,0,0.2)}' +
    '#gri-bug-modal h3{margin:0 0 0.3rem;font-size:1.3rem}' +
    '#gri-bug-modal p.lead{margin:0 0 1rem;font-size:0.9rem;color:#5a5a52;line-height:1.5}' +
    '#gri-bug-modal label{display:block;font-size:0.78rem;font-weight:600;letter-spacing:0.05em;text-transform:uppercase;color:#5a5a52;margin:0.8rem 0 0.3rem}' +
    '#gri-bug-modal textarea,#gri-bug-modal input{width:100%;box-sizing:border-box;background:#fff;border:1px solid #d8d2c4;border-radius:3px;padding:0.6rem 0.7rem;font:0.95rem Georgia,serif;color:#1a2a28;resize:vertical}' +
    '#gri-bug-modal textarea:focus,#gri-bug-modal input:focus{outline:none;border-color:#1a2a28}' +
    '#gri-bug-modal textarea{min-height:110px}' +
    '#gri-bug-modal .meta{font-size:0.75rem;color:#8a8a82;margin-top:0.3rem;font-style:italic}' +
    '#gri-bug-modal .row{display:flex;gap:0.5rem;justify-content:flex-end;margin-top:1.2rem}' +
    '#gri-bug-modal button{font:600 0.85rem/1 Georgia,serif;padding:0.55rem 1.1rem;border-radius:3px;cursor:pointer;border:1px solid #1a2a28}' +
    '#gri-bug-modal .btn-cancel{background:#fff;color:#1a2a28}' +
    '#gri-bug-modal .btn-submit{background:#1a2a28;color:#fcfaf3}' +
    '#gri-bug-modal .btn-submit:disabled{opacity:0.6;cursor:not-allowed}' +
    '#gri-bug-modal .gri-bug-status{margin-top:0.8rem;font-size:0.85rem;padding:0.5rem 0.7rem;border-radius:3px;display:none}' +
    '#gri-bug-modal .gri-bug-status.ok{display:block;background:#e8f1e6;color:#2d5a3d;border:1px solid #b9d4b5}' +
    '#gri-bug-modal .gri-bug-status.err{display:block;background:#f7e8e8;color:#8a3535;border:1px solid #d4b5b5}';

  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  // Buton + overlay markup
  var btn = document.createElement('button');
  btn.id = 'gri-bug-btn';
  btn.type = 'button';
  btn.textContent = 'Hata Bildir';
  btn.setAttribute('aria-label', 'Sayfada bir hata bildir');

  var overlay = document.createElement('div');
  overlay.id = 'gri-bug-overlay';
  overlay.innerHTML =
    '<div id="gri-bug-modal" role="dialog" aria-modal="true" aria-labelledby="gri-bug-title">' +
      '<h3 id="gri-bug-title">Hata Bildir</h3>' +
      '<p class="lead">Sayfada karsilastigin hatayi (yanlis cevap, eksik gorsel, calismayan buton, vb.) burada bildir. Sayfa URL ve sinav bilgisi otomatik gonderilir.</p>' +
      '<label for="gri-bug-desc">Aciklama</label>' +
      '<textarea id="gri-bug-desc" placeholder="Hata kisaca neydi?" required></textarea>' +
      '<label for="gri-bug-email">E-posta (opsiyonel)</label>' +
      '<input type="email" id="gri-bug-email" placeholder="ornek@email.com">' +
      '<div class="meta" id="gri-bug-context"></div>' +
      '<div class="gri-bug-status" id="gri-bug-status"></div>' +
      '<div class="row">' +
        '<button type="button" class="btn-cancel" id="gri-bug-cancel">Iptal</button>' +
        '<button type="button" class="btn-submit" id="gri-bug-submit">Gonder</button>' +
      '</div>' +
    '</div>';

  function init() {
    document.body.appendChild(btn);
    document.body.appendChild(overlay);

    var ctxEl = document.getElementById('gri-bug-context');
    var descEl = document.getElementById('gri-bug-desc');
    var emailEl = document.getElementById('gri-bug-email');
    var statusEl = document.getElementById('gri-bug-status');
    var submitBtn = document.getElementById('gri-bug-submit');
    var cancelBtn = document.getElementById('gri-bug-cancel');

    // Sayfa baglami
    function inferContext() {
      var url = window.location.href;
      var params = new URLSearchParams(window.location.search);
      var testSlug = params.get('test') || '';
      var section = '';
      var path = window.location.pathname;
      if (path.indexOf('listening') !== -1) section = 'listening';
      else if (path.indexOf('reading') !== -1) section = 'reading';
      else if (path.indexOf('writing') !== -1) section = 'writing';
      return { url: url, testSlug: testSlug, section: section };
    }

    function showModal() {
      var ctx = inferContext();
      var parts = [];
      if (ctx.testSlug) parts.push(ctx.testSlug);
      if (ctx.section) parts.push(ctx.section);
      ctxEl.textContent = parts.length ? 'Baglam: ' + parts.join(' / ') : '';
      statusEl.className = 'gri-bug-status';
      statusEl.textContent = '';
      submitBtn.disabled = false;
      submitBtn.textContent = 'Gonder';
      overlay.classList.add('show');
      setTimeout(function () { descEl.focus(); }, 50);
    }

    function hideModal() {
      overlay.classList.remove('show');
      descEl.value = '';
      emailEl.value = '';
    }

    btn.addEventListener('click', showModal);
    cancelBtn.addEventListener('click', hideModal);
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) hideModal();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && overlay.classList.contains('show')) hideModal();
    });

    submitBtn.addEventListener('click', async function () {
      var description = (descEl.value || '').trim();
      if (!description) {
        statusEl.className = 'gri-bug-status err';
        statusEl.textContent = 'Lutfen aciklama gir.';
        descEl.focus();
        return;
      }

      // Supabase'i bekle
      var start = Date.now();
      while (!window.supabase && Date.now() - start < 5000) {
        await new Promise(function (r) { setTimeout(r, 50); });
      }
      if (!window.supabase) {
        statusEl.className = 'gri-bug-status err';
        statusEl.textContent = 'Supabase yuklenemedi. Internet baglantini kontrol et.';
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Gonderiliyor...';
      statusEl.className = 'gri-bug-status';
      statusEl.textContent = '';

      var ctx = inferContext();
      var sb;
      try {
        sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
      } catch (e) {
        statusEl.className = 'gri-bug-status err';
        statusEl.textContent = 'Baglanti hatasi: ' + (e.message || e);
        submitBtn.disabled = false;
        submitBtn.textContent = 'Gonder';
        return;
      }

      // Login email
      var userEmail = (emailEl.value || '').trim() || null;
      try {
        var sess = await sb.auth.getSession();
        if (sess && sess.data && sess.data.session && sess.data.session.user) {
          if (!userEmail) userEmail = sess.data.session.user.email || null;
        }
      } catch (e) { /* sessiz gec */ }

      // Bağlam bilgisini detail'ın başına ekle ki mail içeriğinde de görünsün
      var contextLines = [];
      if (ctx.testSlug) contextLines.push('Test: ' + ctx.testSlug);
      if (ctx.section) contextLines.push('Bolum: ' + ctx.section);
      if (userEmail) contextLines.push('E-posta: ' + userEmail);
      var fullDetail = (contextLines.length ? contextLines.join('\n') + '\n\n' : '') + description;

      var payload = {
        kategori: 'IELTS hata bildirimi' + (ctx.section ? ' (' + ctx.section + ')' : ''),
        detay: fullDetail,
        soru_slug: ctx.testSlug || null,
        soru_url: ctx.url,
        user_agent: navigator.userAgent || null
      };

      var res = await sb.from('soru_bildirimleri').insert(payload);
      if (res.error) {
        console.error('[bug-report]', res.error);
        statusEl.className = 'gri-bug-status err';
        statusEl.textContent = 'Hata: ' + (res.error.message || 'gonderilemedi');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Gonder';
        return;
      }

      statusEl.className = 'gri-bug-status ok';
      statusEl.textContent = 'Tesekkurler, hata kaydedildi. Inceleyip duzeltecegim.';
      submitBtn.textContent = 'Gonderildi';
      setTimeout(hideModal, 1800);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
