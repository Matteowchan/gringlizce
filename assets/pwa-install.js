// Gri English — PWA Install Prompt
(function() {
  'use strict';

  var STORAGE_DISMISSED = 'gri_install_dismissed_at';
  var STORAGE_NEVER = 'gri_install_never';
  var STORAGE_FIRST_VISIT = 'gri_install_first_visit';
  var DISMISS_DAYS = 7;
  var MIN_ENGAGEMENT_MS = 20000;

  function isStandalone() {
    return window.matchMedia('(display-mode: standalone)').matches ||
           window.navigator.standalone === true;
  }

  function isMobile() {
    return window.innerWidth <= 768;
  }

  function isIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  }

  function shouldShow() {
    if (isStandalone()) return false;
    if (!isMobile()) return false;
    if (localStorage.getItem(STORAGE_NEVER) === 'true') return false;

    var dismissedAt = localStorage.getItem(STORAGE_DISMISSED);
    if (dismissedAt) {
      var elapsed = (Date.now() - Number(dismissedAt)) / (1000 * 60 * 60 * 24);
      if (elapsed < DISMISS_DAYS) return false;
    }

    var firstVisit = localStorage.getItem(STORAGE_FIRST_VISIT);
    if (!firstVisit) {
      localStorage.setItem(STORAGE_FIRST_VISIT, String(Date.now()));
      return false;
    }
    return true;
  }

  var deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', function(e) {
    e.preventDefault();
    deferredPrompt = e;
  });

  function showPrompt() {
    if (document.querySelector('.pwa-install-overlay')) return;

    var ios = isIOS();
    var sheet = document.createElement('div');
    sheet.className = 'pwa-install-overlay';

    var html = '<div class="pwa-install-sheet">' +
      '<div class="pwa-install-handle"></div>' +
      '<div class="pwa-install-icon"><img src="/apple-touch-icon.png" alt="Gri"></div>' +
      '<h3>Ana Ekrana Ekle</h3>' +
      '<p>Gri English\'e tek dokunuşla eriş. App gibi açılsın, URL yazmaya gerek kalmasın.</p>';

    if (ios) {
      html += '<div class="pwa-install-steps">' +
        '<div class="pwa-step">' +
          '<div class="pwa-step-num">1</div>' +
          '<div class="pwa-step-text">Altta <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px"><path d="M12 16V4M12 4l-4 4M12 4l4 4"/><path d="M20 14v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-6"/></svg> <strong>Paylaş</strong> ikonuna bas' +
          '</div>' +
        '</div>' +
        '<div class="pwa-step">' +
          '<div class="pwa-step-num">2</div>' +
          '<div class="pwa-step-text"><strong>Ana Ekrana Ekle</strong> seçeneğini bul, onayla</div>' +
        '</div>' +
      '</div>';
    } else if (deferredPrompt) {
      html += '<button class="pwa-install-btn-primary" id="pwa-install-btn">Yükle</button>';
    } else {
      html += '<p class="pwa-install-fallback">Tarayıcı menüsünden <strong>"Ana Ekrana Ekle"</strong> seçeneğini bul.</p>';
    }

    html += '<div class="pwa-install-actions">' +
      '<button class="pwa-install-btn-secondary" data-action="dismiss">Şimdi değil</button>' +
      '<button class="pwa-install-btn-link" data-action="never">Bir daha gösterme</button>' +
    '</div>' +
    '</div>';

    sheet.innerHTML = html;
    document.body.appendChild(sheet);

    requestAnimationFrame(function() {
      sheet.classList.add('show');
    });

    sheet.addEventListener('click', function(e) {
      var action = e.target.dataset && e.target.dataset.action;
      if (action === 'dismiss') {
        localStorage.setItem(STORAGE_DISMISSED, String(Date.now()));
        closePrompt(sheet);
      } else if (action === 'never') {
        localStorage.setItem(STORAGE_NEVER, 'true');
        closePrompt(sheet);
      } else if (e.target === sheet) {
        localStorage.setItem(STORAGE_DISMISSED, String(Date.now()));
        closePrompt(sheet);
      }
    });

    var installBtn = sheet.querySelector('#pwa-install-btn');
    if (installBtn && deferredPrompt) {
      installBtn.addEventListener('click', function() {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then(function(choiceResult) {
          if (choiceResult.outcome === 'accepted') {
            localStorage.setItem(STORAGE_NEVER, 'true');
          } else {
            localStorage.setItem(STORAGE_DISMISSED, String(Date.now()));
          }
          closePrompt(sheet);
          deferredPrompt = null;
        });
      });
    }
  }

  function closePrompt(sheet) {
    sheet.classList.remove('show');
    setTimeout(function() { sheet.remove(); }, 300);
  }

  function tryShow() {
    if (!shouldShow()) return;
    setTimeout(function() {
      if (shouldShow() && document.hasFocus()) showPrompt();
    }, MIN_ENGAGEMENT_MS);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', tryShow);
  } else {
    tryShow();
  }

  window.GriInstall = {
    show: showPrompt,
    reset: function() {
      localStorage.removeItem(STORAGE_DISMISSED);
      localStorage.removeItem(STORAGE_NEVER);
      localStorage.removeItem(STORAGE_FIRST_VISIT);
      console.log('[GriInstall] reset done');
    }
  };
})();
