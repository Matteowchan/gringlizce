/* gri-prompt.js — "Gri Prompt": zamanında öğretmen rehberliği gibi hisseden,
   reklam gibi olmayan bağlamsal ipucu sistemi.
   Kurallar (brief):
   - Oturum başına en fazla 1 otomatik ipucu (kullanıcı açıkça tetiklemedikçe).
   - Her ipucu kolayca kapatılır; kapatılan agresifçe geri gelmez (cooldown).
   - Süreli deneme, aktif yazma, canlı ders, ödeme akışı veya açıklama okurken
     ASLA gösterilmez → sayfa `window.GriPromptBlocked=true` ya da
     <html data-gri-focus> ile bloklar; ödeme/şifre alanları da bloklar.
   - Klavye erişilebilir, ekran okuyucu dostu, odak tuzağı YOK.
   Bu dosya SADECE bileşeni sağlar; NE ZAMAN gösterileceğine çağıran sayfa karar verir. */
(function () {
  'use strict';
  if (window.GriPrompt) return;
  var SESSION_FLAG = '__griPromptShownThisSession';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var host = null, current = null;

  function seenKey(id) { return 'gri-prompt-seen-' + id; }
  function isSeen(id, cooldownDays) {
    try {
      var v = localStorage.getItem(seenKey(id));
      if (!v) return false;
      if (v === 'once') return true;
      var ts = parseInt(v, 10);
      if (!ts) return false;
      var days = (Date.now() - ts) / 86400000;
      return days < (cooldownDays || 14);
    } catch (e) { return false; }
  }
  function markSeen(id, once) {
    try { localStorage.setItem(seenKey(id), once ? 'once' : String(Date.now())); } catch (e) {}
  }

  function blocked() {
    if (window.GriPromptBlocked) return true;
    var de = document.documentElement;
    if (de.hasAttribute('data-gri-focus')) return true;
    // ödeme/şifre bağlamı ya da aktif süreli test göstergesi
    if (document.querySelector('[data-timed-active],[data-gri-no-prompt],input[type="password"]')) return true;
    return false;
  }

  function ensureStyle() {
    if (document.getElementById('gri-prompt-css')) return;
    var s = document.createElement('style'); s.id = 'gri-prompt-css';
    s.textContent =
      '.griprompt{position:fixed;right:16px;bottom:16px;z-index:9600;max-width:340px;width:calc(100% - 32px);' +
        'background:var(--bg-card,#FBF6EC);color:var(--text,#241E17);border:1px solid var(--line,#E3D8C3);' +
        'border-radius:16px;box-shadow:0 18px 44px rgba(44,42,38,.22);padding:14px 14px 14px 14px;' +
        'font-family:var(--font-ui,Inter,system-ui,sans-serif);opacity:0;transform:translateY(14px);' +
        'transition:opacity .28s ease,transform .28s ease}' +
      '.griprompt.in{opacity:1;transform:none}' +
      '@media(prefers-reduced-motion:reduce){.griprompt{transition:none}}' +
      '@media(max-width:520px){.griprompt{left:16px;right:16px;bottom:12px;max-width:none}}' +
      '.griprompt-row{display:flex;gap:10px;align-items:flex-start}' +
      '.griprompt-cat{width:38px;height:38px;border-radius:50%;object-fit:cover;flex:none;background:var(--teal-soft,rgba(46,110,106,.13))}' +
      '.griprompt-body{flex:1;min-width:0}' +
      '.griprompt-title{font-weight:700;font-size:.92rem;color:var(--text,#241E17);margin:0 0 2px;line-height:1.3}' +
      '.griprompt-text{font-size:.86rem;color:var(--text-soft,#6E6353);line-height:1.5;margin:0}' +
      '.griprompt-x{flex:none;width:28px;height:28px;border:none;background:transparent;color:var(--text-muted,#8B7F6B);' +
        'font-size:20px;line-height:1;border-radius:8px;cursor:pointer}' +
      '.griprompt-x:hover{background:var(--teal-soft,rgba(46,110,106,.13));color:var(--text,#241E17)}' +
      '.griprompt-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:11px;padding-left:48px}' +
      '.griprompt-btn{font:inherit;font-size:.85rem;font-weight:700;border-radius:9px;padding:.5rem .9rem;cursor:pointer;' +
        'border:1px solid transparent;background:var(--teal,#2E6E6A);color:#fff;text-decoration:none;display:inline-flex;align-items:center;gap:.3rem}' +
      '.griprompt-btn:hover{background:var(--teal-deep,#123C39)}' +
      '.griprompt-btn.ghost{background:transparent;color:var(--text-soft,#6E6353);border-color:var(--line-strong,#C9BCA0)}' +
      '.griprompt-btn.ghost:hover{color:var(--teal,#2E6E6A);border-color:var(--teal,#2E6E6A);background:transparent}' +
      '.griprompt:focus-visible{outline:2px solid var(--teal,#2E6E6A);outline-offset:2px}';
    document.head.appendChild(s);
  }

  function close(markCd) {
    if (!current) return;
    var el = current.el, opts = current.opts;
    if (markCd !== false) markSeen(opts.id, opts.once);
    current = null;
    el.classList.remove('in');
    var rt = current && current.returnFocus;
    window.setTimeout(function () { if (el && el.parentNode) el.parentNode.removeChild(el); }, reduce ? 0 : 300);
    try { if (opts._returnFocus && opts._returnFocus.focus) opts._returnFocus.focus(); } catch (e) {}
  }

  function show(opts) {
    opts = opts || {};
    if (!opts.id) return false;
    if (blocked()) return false;
    if (isSeen(opts.id, opts.cooldownDays)) return false;
    // oturum başına 1 otomatik ipucu (force ile aşılır)
    if (!opts.force && window[SESSION_FLAG]) return false;
    if (current) close(false);
    ensureStyle();

    var el = document.createElement('div');
    el.className = 'griprompt';
    el.setAttribute('role', 'region');
    el.setAttribute('aria-label', opts.title || 'Gri önerisi');
    el.tabIndex = -1;

    var cat = 'assets/gri-cat-happy.png';
    var actionsHtml = '';
    (opts.actions || []).forEach(function (a, i) {
      var cls = 'griprompt-btn' + (a.ghost ? ' ghost' : '');
      if (a.href) actionsHtml += '<a class="' + cls + '" href="' + a.href + '" data-i="' + i + '">' + esc(a.label) + '</a>';
      else actionsHtml += '<button type="button" class="' + cls + '" data-i="' + i + '">' + esc(a.label) + '</button>';
    });

    el.innerHTML =
      '<div class="griprompt-row">' +
        '<img class="griprompt-cat" src="' + cat + '" alt="Gri" width="38" height="38" loading="lazy">' +
        '<div class="griprompt-body">' +
          (opts.title ? '<p class="griprompt-title">' + esc(opts.title) + '</p>' : '') +
          '<p class="griprompt-text">' + esc(opts.body || '') + '</p>' +
        '</div>' +
        '<button type="button" class="griprompt-x" aria-label="Kapat">&times;</button>' +
      '</div>' +
      (actionsHtml ? '<div class="griprompt-actions">' + actionsHtml + '</div>' : '');

    document.body.appendChild(el);
    opts._returnFocus = document.activeElement;
    current = { el: el, opts: opts };
    if (!opts.force) window[SESSION_FLAG] = true;

    el.querySelector('.griprompt-x').addEventListener('click', function () { close(true); if (opts.onDismiss) opts.onDismiss(); });
    (opts.actions || []).forEach(function (a, i) {
      var node = el.querySelector('[data-i="' + i + '"]');
      if (!node) return;
      node.addEventListener('click', function (e) {
        if (a.onClick) { e.preventDefault(); a.onClick(); }
        // href varsa tarayıcı gezinir; her durumda ipucu kapanır (cooldown işaretlenir)
        markSeen(opts.id, opts.once);
        if (!a.href) close(false);
      });
    });
    // Esc kapatır; odak tuzağı YOK (Tab normal akışta)
    el.addEventListener('keydown', function (e) { if (e.key === 'Escape') { close(true); } });
    document.addEventListener('keydown', escOnce, { once: true });
    function escOnce(e) { if (e.key === 'Escape' && current && current.el === el) close(true); }

    // görünür yap + ilk eyleme odak (tuzak değil)
    requestAnimationFrame(function () { requestAnimationFrame(function () { el.classList.add('in'); }); });
    var firstBtn = el.querySelector('.griprompt-btn');
    if (firstBtn) { try { firstBtn.focus({ preventScroll: true }); } catch (e) { firstBtn.focus(); } }

    if (opts.autoDismiss) window.setTimeout(function () { if (current && current.el === el) close(false); }, opts.autoDismiss);
    return true;
  }

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  window.GriPrompt = { show: show, close: function () { close(true); }, isSeen: isSeen, reset: function (id) { try { localStorage.removeItem(seenKey(id)); } catch (e) {} } };
})();
