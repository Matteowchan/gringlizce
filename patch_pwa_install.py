#!/usr/bin/env python3
"""Faz 1.7-B - PWA Install Prompt."""
import os

REPO_ROOT = os.path.dirname(os.path.abspath(__file__))

PWA_INSTALL_JS = r"""// Gri English — PWA Install Prompt
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
"""

PWA_INSTALL_CSS = """/* Gri English — PWA Install Prompt */
.pwa-install-overlay {
  position: fixed;
  inset: 0;
  background: rgba(26, 31, 37, 0);
  z-index: 99998;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  transition: background 0.3s ease;
  pointer-events: none;
}
.pwa-install-overlay.show {
  background: rgba(26, 31, 37, 0.55);
  pointer-events: auto;
}
.pwa-install-sheet {
  background: #faf7ee;
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
  width: 100%;
  max-width: 480px;
  padding: 10px 22px max(22px, env(safe-area-inset-bottom));
  font-family: 'Inter', sans-serif;
  transform: translateY(100%);
  transition: transform 0.3s ease;
  box-shadow: 0 -8px 30px rgba(0,0,0,0.18);
}
.pwa-install-overlay.show .pwa-install-sheet { transform: translateY(0); }

.pwa-install-handle {
  width: 38px;
  height: 4px;
  background: #d9d2bf;
  border-radius: 2px;
  margin: 0 auto 18px;
}

.pwa-install-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 14px;
}
.pwa-install-icon img {
  width: 100%; height: 100%;
  border-radius: 14px;
  object-fit: cover;
}

.pwa-install-sheet h3 {
  font-family: 'Lora', serif;
  font-size: 19px;
  color: #2a2a2a;
  margin: 0 0 6px;
  font-weight: 500;
  text-align: center;
}
.pwa-install-sheet p {
  font-size: 13px;
  color: #5a5e58;
  line-height: 1.55;
  margin: 0 0 18px;
  text-align: center;
}

.pwa-install-steps {
  background: #ffffff;
  border-radius: 10px;
  padding: 4px 14px;
  margin-bottom: 18px;
  border: 0.5px solid #e6e1d3;
}
.pwa-step {
  display: flex;
  gap: 11px;
  padding: 10px 0;
  align-items: center;
}
.pwa-step:not(:last-child) {
  border-bottom: 0.5px solid #e6e1d3;
}
.pwa-step-num {
  width: 22px; height: 22px;
  border-radius: 50%;
  background: #2C5856;
  color: #F4EFE3;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 600;
  flex-shrink: 0;
}
.pwa-step-text {
  font-size: 13px;
  color: #3a3a32;
  line-height: 1.4;
}
.pwa-step-text strong { font-weight: 600; color: #2a2a2a; }

.pwa-install-btn-primary {
  display: block;
  width: 100%;
  padding: 12px 20px;
  background: #2C5856;
  color: #F4EFE3;
  border: none;
  border-radius: 8px;
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  font-weight: 600;
  cursor: pointer;
  margin-bottom: 14px;
}

.pwa-install-fallback {
  background: rgba(200,154,60,0.08);
  border-left: 3px solid #c89a3c;
  padding: 10px 14px;
  margin: 0 0 18px !important;
  font-size: 13px;
  text-align: left !important;
}

.pwa-install-actions {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: stretch;
}
.pwa-install-btn-secondary {
  background: transparent;
  border: 1px solid #2C5856;
  color: #2C5856;
  padding: 11px 18px;
  border-radius: 8px;
  font-family: 'Inter', sans-serif;
  font-size: 11px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  font-weight: 600;
  cursor: pointer;
  width: 100%;
}
.pwa-install-btn-link {
  background: none;
  border: none;
  color: #9a9890;
  font-family: 'Inter', sans-serif;
  font-size: 11px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  cursor: pointer;
  padding: 6px;
  font-weight: 500;
  margin-top: 4px;
}
.pwa-install-btn-link:hover { color: #5a5e58; }

/* Dark mode */
:root[data-theme="dark"] .pwa-install-sheet { background: #232017; }
:root[data-theme="dark"] .pwa-install-handle { background: #3a3530; }
:root[data-theme="dark"] .pwa-install-sheet h3 { color: #e8e3d6; }
:root[data-theme="dark"] .pwa-install-sheet p { color: #c4bfb2; }
:root[data-theme="dark"] .pwa-install-steps {
  background: #28241e;
  border-color: #3a3530;
}
:root[data-theme="dark"] .pwa-step:not(:last-child) { border-bottom-color: #3a3530; }
:root[data-theme="dark"] .pwa-step-num { background: #6FC2BD; color: #1a1815; }
:root[data-theme="dark"] .pwa-step-text { color: #d8d2c0; }
:root[data-theme="dark"] .pwa-step-text strong { color: #e8e3d6; }
:root[data-theme="dark"] .pwa-install-btn-primary {
  background: #6FC2BD; color: #1a1815;
}
:root[data-theme="dark"] .pwa-install-btn-secondary {
  border-color: #6FC2BD; color: #6FC2BD;
}
:root[data-theme="dark"] .pwa-install-btn-link { color: #888377; }
:root[data-theme="dark"] .pwa-install-fallback {
  background: rgba(216,178,102,0.1);
  border-left-color: #d8b266;
  color: #d8d2c0;
}
"""


def write_pwa_install_files():
    assets_dir = os.path.join(REPO_ROOT, 'assets')
    if not os.path.exists(assets_dir):
        print('[err] assets/ bulunamadı'); return
    with open(os.path.join(assets_dir, 'pwa-install.js'), 'w', encoding='utf-8') as f:
        f.write(PWA_INSTALL_JS)
    with open(os.path.join(assets_dir, 'pwa-install.css'), 'w', encoding='utf-8') as f:
        f.write(PWA_INSTALL_CSS)
    print('[ok] assets/pwa-install.js ve .css yazıldı')


def inject_into_html():
    inject_block = '''  <!-- PWA INSTALL -->
  <link rel="stylesheet" href="/assets/pwa-install.css">
  <script src="/assets/pwa-install.js" defer></script>
</head>'''

    html_files = []
    for root, dirs, files in os.walk(REPO_ROOT):
        dirs[:] = [d for d in dirs if not d.startswith('.') and d != 'node_modules']
        for f in files:
            if f.endswith('.html'):
                html_files.append(os.path.join(root, f))

    patched = already = no_head = 0
    for path in html_files:
        with open(path, 'r', encoding='utf-8') as f: html = f.read()
        if '<!-- PWA INSTALL -->' in html:
            already += 1; continue
        if '</head>' not in html:
            no_head += 1; continue
        html = html.replace('</head>', inject_block, 1)
        with open(path, 'w', encoding='utf-8') as f: f.write(html)
        patched += 1
    print(f'[ok] HTML <head> patched: {patched} | already: {already} | no-head: {no_head}')


def main():
    print('=' * 60)
    print('Faz 1.7-B - PWA Install Prompt')
    print('=' * 60)
    write_pwa_install_files()
    inject_into_html()
    print('=' * 60)
    print('Bitti! git add . && git commit -m "Faz 1.7-B PWA install prompt" && git push')
    print('Test: GriInstall.show()  (console\'da, manual trigger)')
    print('Reset: GriInstall.reset()  (storage temizle)')
    print('=' * 60)


if __name__ == '__main__':
    main()
