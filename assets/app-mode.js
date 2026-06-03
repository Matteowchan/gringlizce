// Gri English — App Mode
(function() {
  'use strict';
  var STORAGE_KEY = 'gri_app_mode';
  var urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('mode') === 'app') {
    localStorage.setItem(STORAGE_KEY, 'true');
  }
  var isAppMode = localStorage.getItem(STORAGE_KEY) === 'true';
  if (!isAppMode) return;
  document.documentElement.classList.add('app-mode');

  function init() {
    if (!document.body) return;
    document.body.classList.add('app-mode');
    setupCalismaPaketleriModal();
    injectBottomNav();
  }

  function setupCalismaPaketleriModal() {
    document.addEventListener('click', function(e) {
      var link = e.target.closest('a[href*="calisma-paketleri"]');
      if (!link) return;
      if (link.closest('.app-mode-modal-overlay')) return;
      e.preventDefault();
      var href = link.href;
      showAppModeModal({
        title: 'Bu içerik web sürümünde',
        message: 'Çalışma Paketleri sadece web sitesinde mevcut. Tarayıcıda açmak ister misin?',
        confirmText: 'Tarayıcıda Aç',
        cancelText: 'Vazgeç',
        onConfirm: function() { window.open(href, '_blank'); }
      });
    });
  }

  function showAppModeModal(opts) {
    var existing = document.querySelector('.app-mode-modal-overlay');
    if (existing) existing.remove();
    var overlay = document.createElement('div');
    overlay.className = 'app-mode-modal-overlay';
    overlay.innerHTML =
      '<div class="app-mode-modal">' +
        '<div class="amm-icon">' +
          '<svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' +
            '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>' +
            '<polyline points="15 3 21 3 21 9"></polyline>' +
            '<line x1="10" y1="14" x2="21" y2="3"></line>' +
          '</svg>' +
        '</div>' +
        '<h3>' + opts.title + '</h3>' +
        '<p>' + opts.message + '</p>' +
        '<div class="amm-buttons">' +
          '<button class="amm-btn amm-btn-cancel">' + (opts.cancelText || 'Vazgeç') + '</button>' +
          '<button class="amm-btn amm-btn-confirm">' + (opts.confirmText || 'Tamam') + '</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);
    overlay.querySelector('.amm-btn-cancel').addEventListener('click', function() { overlay.remove(); });
    overlay.querySelector('.amm-btn-confirm').addEventListener('click', function() {
      if (opts.onConfirm) opts.onConfirm();
      overlay.remove();
    });
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) overlay.remove();
    });
  }

  function injectBottomNav() {
    if (window.innerWidth > 700) return;
    if (document.querySelector('.app-bottom-nav')) return;
    var nav = document.createElement('nav');
    nav.className = 'app-bottom-nav';
    nav.setAttribute('aria-label', 'App navigation');
    var items = [
      { href: '/', label: 'Ana Sayfa', icon: 'home', match: ['index.html', ''] },
      { href: '/soru-bankasi.html', label: 'Soru', icon: 'questions', match: ['soru-bankasi.html'] },
      { href: '/kelime-bankasi.html', label: 'Kelime', icon: 'book', match: ['kelime-bankasi.html'] },
      { href: '/yazi-pratigi.html', label: 'Yazı', icon: 'pencil', match: ['yazi-pratigi.html'] },
      { href: '/panelim.html', label: 'Profil', icon: 'user', match: ['panelim.html'] }
    ];
    var icons = {
      home: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1V9.5z"/></svg>',
      questions: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.7"/><circle cx="12" cy="17" r="0.6" fill="currentColor"/></svg>',
      book: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h12a3 3 0 0 1 3 3v13H7a3 3 0 0 1-3-3V4z"/><path d="M4 17h15"/></svg>',
      pencil: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>',
      user: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-7 8-7s8 3 8 7"/></svg>'
    };
    var currentFile = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
    items.forEach(function(item) {
      var link = document.createElement('a');
      link.href = item.href;
      link.className = 'abn-item';
      if (item.match.indexOf(currentFile) !== -1) link.classList.add('active');
      link.innerHTML = '<span class="abn-icon">' + icons[item.icon] + '</span><span class="abn-label">' + item.label + '</span>';
      nav.appendChild(link);
    });
    document.body.appendChild(nav);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.addEventListener('resize', function() {
    var nav = document.querySelector('.app-bottom-nav');
    if (window.innerWidth > 700 && nav) {
      nav.remove();
    } else if (window.innerWidth <= 700 && !nav) {
      injectBottomNav();
    }
  });

  window.GriAppMode = {
    exit: function() { localStorage.removeItem(STORAGE_KEY); window.location.href = window.location.pathname; },
    enter: function() { localStorage.setItem(STORAGE_KEY, 'true'); window.location.reload(); }
  };
})();
