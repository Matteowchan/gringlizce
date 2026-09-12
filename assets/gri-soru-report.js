/* gri-soru-report.js — paylaşılan "soruda hata bildir" bileşeni.
   Kullanım (runner tarafı): her sorunun şablonuna küçük bir buton göm:
     <button type="button" class="gri-report-btn" data-slug="SLUG">Hata bildir</button>
   Bu dosya sayfaya bir kez dahil edilir:
     <script src="assets/gri-soru-report.js?v=1" defer></script>
   Gerisi otomatik: tıklamada modal açılır, gönderince soru_bildirimleri'ne yazılır.
   Kendi supabase istemcisini kurar; sb/user plumbing gerektirmez. Tamamen additive. */
(function () {
  'use strict';
  if (window.GriSoruReport) return;
  var SUPABASE_URL = 'https://vazbvbqgvtlaqkytfsbi.supabase.co';
  var SUPABASE_KEY = 'sb_publishable_F5K-wIVQHXlD4e4GYnySNw_Xm4teO9g';
  var CATS = ['Yanlış/tartışmalı cevap', 'Soru kökünde hata', 'Yazım / dil hatası', 'Görsel / teknik sorun', 'Diğer'];
  var _sb = null, _uid = null, _slug = '', _built = false;

  function sb() {
    if (_sb) return _sb;
    try { _sb = window.supabase && window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY); } catch (e) { _sb = null; }
    if (_sb) { try { _sb.auth.getUser().then(function (r) { _uid = r && r.data && r.data.user ? r.data.user.id : null; }).catch(function(){}); } catch (e) {} }
    return _sb;
  }

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  function ensureStyle() {
    if (document.getElementById('gri-rp-css')) return;
    var s = document.createElement('style'); s.id = 'gri-rp-css';
    s.textContent =
      '.gri-report-btn{display:inline-flex;align-items:center;gap:.3rem;font:600 .72rem/1 var(--font-ui,Inter),system-ui,sans-serif;color:var(--text-muted,#8a7f68);background:transparent;border:1px solid var(--gri-line,rgba(0,0,0,.14));border-radius:999px;padding:.24rem .6rem;cursor:pointer;transition:color .15s,border-color .15s}' +
      '.gri-report-btn:hover{color:var(--incorrect,#b4544a);border-color:var(--incorrect,#b4544a)}' +
      '.gri-rp-back{position:fixed;inset:0;background:rgba(20,16,12,.5);z-index:99998;display:none}' +
      '.gri-rp-back.on{display:block}' +
      '.gri-rp{position:fixed;z-index:99999;left:50%;top:50%;transform:translate(-50%,-50%);width:min(460px,92vw);background:var(--bg-card,#fff);color:var(--text,#241c12);border:1px solid var(--gri-line,rgba(0,0,0,.15));border-radius:14px;box-shadow:0 20px 60px rgba(20,15,10,.3);padding:1.1rem 1.2rem;display:none;font-family:var(--font-ui,Inter),system-ui,sans-serif}' +
      '.gri-rp.on{display:block}' +
      '.gri-rp h3{margin:.1rem 0 .8rem;font:700 1.05rem/1.2 var(--font-display,Georgia),serif}' +
      '.gri-rp label{display:block;font-size:.8rem;font-weight:600;margin:.6rem 0 .3rem}' +
      '.gri-rp select,.gri-rp textarea{width:100%;box-sizing:border-box;border:1px solid var(--gri-line,rgba(0,0,0,.18));border-radius:8px;padding:.5rem .6rem;font:inherit;font-size:.9rem;background:var(--bg-soft,#fff);color:var(--text,#241c12)}' +
      '.gri-rp textarea{min-height:90px;resize:vertical}' +
      '.gri-rp-row{display:flex;gap:.5rem;justify-content:flex-end;margin-top:1rem;align-items:center}' +
      '.gri-rp-x{background:transparent;border:1px solid var(--gri-line,rgba(0,0,0,.18));border-radius:8px;padding:.45rem .9rem;cursor:pointer;font:inherit;color:var(--text,#241c12)}' +
      '.gri-rp-go{background:var(--teal,#2C5856);color:#fff;border:0;border-radius:8px;padding:.5rem 1rem;cursor:pointer;font:inherit;font-weight:700}' +
      '.gri-rp-go:disabled{opacity:.6;cursor:default}' +
      '.gri-rp-fb{font-size:.82rem;margin-right:auto}.gri-rp-fb.ok{color:var(--correct,#2e8b57)}.gri-rp-fb.err{color:var(--incorrect,#b4544a)}';
    document.head.appendChild(s);
  }

  function build() {
    if (_built) return; _built = true;
    ensureStyle();
    var back = document.createElement('div'); back.className = 'gri-rp-back';
    var m = document.createElement('div'); m.className = 'gri-rp'; m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true');
    m.innerHTML =
      '<h3>Soruda hata bildir</h3>' +
      '<label for="gri-rp-cat">Sorun türü</label>' +
      '<select id="gri-rp-cat"><option value="">Seç...</option>' + CATS.map(function (c) { return '<option value="' + esc(c) + '">' + esc(c) + '</option>'; }).join('') + '</select>' +
      '<label for="gri-rp-det">Detay</label>' +
      '<textarea id="gri-rp-det" placeholder="Neyin yanlış olduğunu kısaca yaz..."></textarea>' +
      '<div class="gri-rp-row"><span class="gri-rp-fb" id="gri-rp-fb"></span>' +
      '<button type="button" class="gri-rp-x" id="gri-rp-x">Vazgeç</button>' +
      '<button type="button" class="gri-rp-go" id="gri-rp-go">Gönder</button></div>';
    document.body.appendChild(back); document.body.appendChild(m);
    back.addEventListener('click', close);
    document.getElementById('gri-rp-x').addEventListener('click', close);
    document.getElementById('gri-rp-go').addEventListener('click', submit);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  }
  function open(slug) {
    _slug = slug || ''; build();
    document.getElementById('gri-rp-cat').value = '';
    document.getElementById('gri-rp-det').value = '';
    var fb = document.getElementById('gri-rp-fb'); fb.textContent = ''; fb.className = 'gri-rp-fb';
    document.querySelector('.gri-rp-back').classList.add('on');
    document.querySelector('.gri-rp').classList.add('on');
  }
  function close() {
    var b = document.querySelector('.gri-rp-back'), m = document.querySelector('.gri-rp');
    if (b) b.classList.remove('on'); if (m) m.classList.remove('on');
  }
  async function submit() {
    var cat = document.getElementById('gri-rp-cat').value;
    var det = document.getElementById('gri-rp-det').value.trim();
    var fb = document.getElementById('gri-rp-fb'), go = document.getElementById('gri-rp-go');
    if (!cat) { fb.textContent = 'Sorun türü seç.'; fb.className = 'gri-rp-fb err'; return; }
    if (!det) { fb.textContent = 'Kısa bir detay yaz.'; fb.className = 'gri-rp-fb err'; return; }
    var client = sb();
    if (!client) { fb.textContent = 'Bağlantı yok, sonra dene.'; fb.className = 'gri-rp-fb err'; return; }
    go.disabled = true; go.textContent = 'Gönderiliyor...';
    try {
      var row = { kategori: cat, detay: det, soru_slug: _slug, soru_url: location.href, user_agent: navigator.userAgent };
      if (_uid) row.user_id = _uid;
      var res = await client.from('soru_bildirimleri').insert(row);
      if (res.error) throw res.error;
      fb.textContent = 'Teşekkürler, bildirim iletildi.'; fb.className = 'gri-rp-fb ok';
      setTimeout(close, 1200);
    } catch (e) {
      fb.textContent = 'Gönderilemedi: ' + (e.message || e); fb.className = 'gri-rp-fb err';
    } finally {
      go.disabled = false; go.textContent = 'Gönder';
    }
  }

  // delegated click: any .gri-report-btn opens the modal with its data-slug
  document.addEventListener('click', function (e) {
    var btn = e.target && e.target.closest && e.target.closest('.gri-report-btn');
    if (!btn) return;
    e.preventDefault();
    open(btn.getAttribute('data-slug') || '');
  });

  // warm the client early (best-effort)
  if (document.readyState !== 'loading') { try { sb(); } catch (e) {} }
  else document.addEventListener('DOMContentLoaded', function () { try { sb(); } catch (e) {} });

  window.GriSoruReport = { open: open, btnHtml: function (slug) { return '<button type="button" class="gri-report-btn" data-slug="' + esc(slug) + '">Hata bildir</button>'; } };
})();
