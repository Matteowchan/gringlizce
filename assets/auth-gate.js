/**
 * Gri English — Guest Auth Gate
 * Allows guests to VIEW questions but blocks interactions (answering, navigating,
 * bookmarking, AI ask, vocab add). Show a friendly signup modal instead.
 *
 * Usage: include in every question/test page after Supabase client setup.
 *   <script src="assets/auth-gate.js" defer></script>
 *
 * To opt-out for a specific page (e.g. fully-public pages), add to body:
 *   <body data-no-auth-gate="1">
 */
(function () {
  'use strict';

  if (document.body && document.body.getAttribute('data-no-auth-gate') === '1') return;

  var FREE_VIEW_COUNT = 1; // First N questions can be answered fully as a teaser, set to 0 to gate immediately
  var STORAGE_KEY = 'gri_guest_views';

  function waitForSupabase(cb, tries) {
    tries = tries || 0;
    if (tries > 100) return; // give up after ~10s
    if (window.supabase && window.SUPABASE_URL && window.SUPABASE_KEY) {
      try {
        var c = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_KEY);
        cb(c);
        return;
      } catch (e) { /* fall through */ }
    }
    setTimeout(function () { waitForSupabase(cb, tries + 1); }, 100);
  }

  function readGuestViews() {
    try {
      var n = parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10);
      return isNaN(n) ? 0 : n;
    } catch (e) { return 0; }
  }
  function bumpGuestViews() {
    try { localStorage.setItem(STORAGE_KEY, String(readGuestViews() + 1)); } catch (e) {}
  }

  function init() {
    waitForSupabase(function (client) {
      client.auth.getSession().then(function (res) {
        var session = res && res.data && res.data.session;
        if (session) return; // logged in: do nothing
        installGate();
      }).catch(function () { installGate(); });
    });
  }

  function installGate() {
    document.documentElement.classList.add('gri-guest');
    injectStyles();
    injectModal();
    injectBanner();

    // Capture phase so we run BEFORE the app's own handlers
    document.addEventListener('click', onAnyClick, true);
    document.addEventListener('contextmenu', onAnyClick, true);
    document.addEventListener('keydown', onKeydown, true);
  }

  // Selectors of actions a guest is NOT allowed to perform.
  // View is allowed; interaction is not.
  var BLOCKED_SELECTORS = [
    '.q-option:not(.answered)',           // answer click
    '.q-tool-btn',                         // bookmark, note
    '.q-btn-explain',                      // show explanation
    '.q-btn-vocab',                        // add to vocab
    '.q-btn-remix',                        // remix
    '.q-nav-pill',                         // jump between questions
    '.nav-sq',                             // jump grid
    '.q-comp-btn',                         // completion screen actions
    '.q-completion-review',                // review wrongs
    '[data-ask-gri]',                      // AI ask
    '[data-bookmark]',                     // alt bookmark hook
    '[data-action="next"]',                // future-proof
    '[data-action="prev"]',
    '[data-action="submit"]'
  ].join(',');

  function isBlockedTarget(el) {
    if (!el || !el.closest) return null;
    return el.closest(BLOCKED_SELECTORS);
  }

  function onAnyClick(e) {
    var hit = isBlockedTarget(e.target);
    if (!hit) return;

    // Teaser logic: allow the first FREE_VIEW_COUNT answers (q-option clicks) to go through.
    // After that, every interaction is gated.
    var isFirstAnswerOption = hit.matches && hit.matches('.q-option:not(.answered)');
    if (isFirstAnswerOption && readGuestViews() < FREE_VIEW_COUNT) {
      bumpGuestViews();
      // After this answer, lock everything else by setting views to limit
      // The natural app flow will reveal the answer + explanation. The NEXT click is gated.
      return; // let it through this once
    }

    e.preventDefault();
    e.stopImmediatePropagation();
    e.stopPropagation();
    showModal();
  }

  function onKeydown(e) {
    // Block keyboard shortcuts that might trigger navigation (arrow keys are common in QB apps)
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft' || e.key === 'Enter') {
      // Only block when focus is on the body or an interactive element managed by the app
      var ae = document.activeElement;
      if (!ae || ae === document.body || (ae.matches && ae.matches('.q-option, .q-btn, .q-nav-pill'))) {
        e.preventDefault();
        e.stopImmediatePropagation();
        showModal();
      }
    }
  }

  function injectStyles() {
    if (document.getElementById('gri-gate-style')) return;
    var css = ''
      + '#gri-gate-modal{position:fixed;inset:0;z-index:99999;display:none;align-items:center;justify-content:center;padding:1.5rem;}'
      + '#gri-gate-modal.show{display:flex;}'
      + '#gri-gate-modal .ggm-bg{position:absolute;inset:0;background:rgba(20,24,32,0.55);backdrop-filter:blur(2px);}'
      + '#gri-gate-modal .ggm-box{position:relative;background:var(--bg-card,#fff);border:1px solid var(--line,#d9d2c4);border-radius:8px;max-width:460px;width:100%;padding:2.2rem 2rem 1.8rem;box-shadow:0 24px 60px rgba(0,0,0,0.22);text-align:center;}'
      + '#gri-gate-modal .ggm-eyebrow{display:inline-block;font-family:var(--font-ui,Inter,sans-serif);font-size:10px;letter-spacing:0.22em;text-transform:uppercase;color:var(--gold,#c89a3c);font-weight:700;margin-bottom:0.7rem;}'
      + '#gri-gate-modal .ggm-title{font-family:var(--font-display,Georgia,serif);font-size:1.55rem;font-weight:600;line-height:1.2;margin:0 0 0.8rem;color:var(--text,#1a2230);}'
      + '#gri-gate-modal .ggm-title em{font-style:italic;color:var(--teal,#2c5856);}'
      + '#gri-gate-modal .ggm-text{font-family:var(--font-body,Georgia,serif);font-size:1rem;line-height:1.55;color:var(--text-soft,#4a4a48);margin:0 0 1.6rem;}'
      + '#gri-gate-modal .ggm-actions{display:flex;flex-direction:column;gap:0.6rem;margin-bottom:1.1rem;}'
      + '#gri-gate-modal .ggm-btn{display:block;width:100%;padding:0.95rem 1.4rem;font-family:var(--font-ui,Inter,sans-serif);font-size:11px;letter-spacing:0.2em;text-transform:uppercase;font-weight:700;text-decoration:none;border-radius:3px;border:none;cursor:pointer;transition:transform 0.15s,background 0.15s;text-align:center;}'
      + '#gri-gate-modal .ggm-btn-primary{background:var(--teal,#2c5856);color:#fff;}'
      + '#gri-gate-modal .ggm-btn-primary:hover{background:#1d4341;transform:translateY(-1px);}'
      + '#gri-gate-modal .ggm-btn-ghost{background:transparent;color:var(--text,#1a2230);border:1px solid var(--line,#d9d2c4);}'
      + '#gri-gate-modal .ggm-btn-ghost:hover{background:var(--bg-soft,#f3efe5);}'
      + '#gri-gate-modal .ggm-note{font-family:var(--font-ui,Inter,sans-serif);font-size:11px;color:var(--text-muted,#6b6862);letter-spacing:0.02em;line-height:1.5;}'
      + '#gri-gate-modal .ggm-close{position:absolute;top:0.7rem;right:0.85rem;background:transparent;border:none;width:32px;height:32px;border-radius:50%;color:var(--text-muted,#6b6862);cursor:pointer;font-size:1.3rem;line-height:1;display:flex;align-items:center;justify-content:center;}'
      + '#gri-gate-modal .ggm-close:hover{background:var(--bg-soft,#f3efe5);color:var(--text);}'
      + '#gri-gate-banner{position:sticky;top:0;z-index:50;background:#1a2230;color:#f4efe3;padding:0.55rem 1rem;text-align:center;font-family:var(--font-ui,Inter,sans-serif);font-size:12px;letter-spacing:0.04em;display:flex;justify-content:center;align-items:center;gap:0.7rem;flex-wrap:wrap;}'
      + '#gri-gate-banner strong{color:#c89a3c;font-weight:700;}'
      + '#gri-gate-banner a{color:#f4efe3;text-decoration:underline;text-underline-offset:3px;font-weight:600;}'
      + '#gri-gate-banner a:hover{color:#c89a3c;}';
    var style = document.createElement('style');
    style.id = 'gri-gate-style';
    style.textContent = css;
    document.head.appendChild(style);
  }

  function injectModal() {
    if (document.getElementById('gri-gate-modal')) return;
    var html = ''
      + '<div id="gri-gate-modal" role="dialog" aria-modal="true" aria-labelledby="ggm-title">'
      + '  <div class="ggm-bg" data-gate-close></div>'
      + '  <div class="ggm-box">'
      + '    <button class="ggm-close" type="button" aria-label="Kapat" data-gate-close>&times;</button>'
      + '    <span class="ggm-eyebrow">Devam etmek için</span>'
      + '    <h3 class="ggm-title" id="ggm-title">Ücretsiz hesap aç, <em>çözmeye devam et</em></h3>'
      + '    <p class="ggm-text">Soruları görüntülemek serbest. Çözmek, yer imine eklemek, kelime kaydetmek ve Gri\'ye sormak için ücretsiz bir hesap aç. 30 saniye sürer, kredi kartı istenmez.</p>'
      + '    <div class="ggm-actions">'
      + '      <a href="giris.html#signup" class="ggm-btn ggm-btn-primary">Ücretsiz Hesap Aç</a>'
      + '      <a href="giris.html" class="ggm-btn ggm-btn-ghost">Zaten hesabım var, giriş yap</a>'
      + '    </div>'
      + '    <p class="ggm-note">Hesap açan herkese günde <strong>10 ücretsiz AI mentor hakkı</strong> tanımlı.</p>'
      + '  </div>'
      + '</div>';
    var wrap = document.createElement('div');
    wrap.innerHTML = html;
    document.body.appendChild(wrap.firstChild);

    document.querySelectorAll('[data-gate-close]').forEach(function (el) {
      el.addEventListener('click', hideModal);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') hideModal();
    });
  }

  function injectBanner() {
    if (document.getElementById('gri-gate-banner')) return;
    var b = document.createElement('div');
    b.id = 'gri-gate-banner';
    b.innerHTML = 'Misafir olarak inceliyorsun. Çözüm ve diğer özellikler için <a href="giris.html#signup"><strong>ücretsiz hesap aç &rsaquo;</strong></a>';
    // Insert just under the launch-banner if present, else at top of body
    var launch = document.querySelector('.launch-banner');
    if (launch && launch.parentNode) {
      launch.parentNode.insertBefore(b, launch.nextSibling);
    } else {
      document.body.insertBefore(b, document.body.firstChild);
    }
  }

  function showModal() {
    var m = document.getElementById('gri-gate-modal');
    if (m) m.classList.add('show');
  }
  function hideModal() {
    var m = document.getElementById('gri-gate-modal');
    if (m) m.classList.remove('show');
  }

  // Wait for DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
