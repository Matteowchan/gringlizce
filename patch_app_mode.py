#!/usr/bin/env python3
"""Gringlizce Faz 1 — PWA App Mode patch."""
import os, json, re

REPO_ROOT = os.path.dirname(os.path.abspath(__file__))

APP_MODE_JS = r"""// Gri English — App Mode
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
"""

APP_MODE_CSS = """/* Gri English — App Mode Styles */
.app-mode .hide-in-app,
.app-mode [data-hide-in-app] { display: none !important; }
.app-mode .top-banner,
.app-mode .promo-bar,
.app-mode .home-discount-banner,
.app-mode #global-discount-banner,
.app-mode .global-discount { display: none !important; }
@media (max-width: 700px) {
  body.app-mode { padding-bottom: 70px; }
}
.app-bottom-nav {
  display: flex; position: fixed; bottom: 0; left: 0; right: 0;
  height: 62px; background: #faf7ee; border-top: 0.5px solid #d9d2bf;
  z-index: 9999; align-items: stretch; justify-content: space-around;
  padding: 4px 0 max(4px, env(safe-area-inset-bottom));
  box-sizing: content-box; font-family: 'Inter', sans-serif;
}
.abn-item {
  flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 3px; text-decoration: none; color: #9a9890;
  font-size: 10px; letter-spacing: 0.02em; padding: 6px 0;
  transition: color 0.15s ease;
}
.abn-item.active { color: #2C5856; }
.abn-item:hover { color: #2C5856; }
.abn-icon { display: flex; align-items: center; justify-content: center; width: 24px; height: 24px; }
.abn-label { font-weight: 500; font-size: 10px; }
html.dark .app-bottom-nav, body.dark .app-bottom-nav {
  background: #1a1f25; border-top-color: #2c3036;
}
.app-mode-modal-overlay {
  position: fixed; inset: 0; background: rgba(26, 31, 37, 0.6);
  z-index: 99999; display: flex; align-items: center; justify-content: center;
  padding: 20px; animation: ammFadeIn 0.2s ease;
}
@keyframes ammFadeIn { from { opacity: 0; } to { opacity: 1; } }
.app-mode-modal {
  background: #faf7ee; border-radius: 16px; max-width: 360px; width: 100%;
  padding: 28px 22px; text-align: center; font-family: 'Inter', sans-serif;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.35);
  animation: ammSlideUp 0.25s ease;
}
@keyframes ammSlideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
.amm-icon {
  width: 56px; height: 56px; background: rgba(44, 88, 86, 0.1);
  border-radius: 50%; display: flex; align-items: center; justify-content: center;
  margin: 0 auto 16px; color: #2C5856;
}
.app-mode-modal h3 {
  font-family: 'Lora', serif; font-size: 18px; color: #2a2a2a;
  margin: 0 0 10px; font-weight: 500; line-height: 1.3;
}
.app-mode-modal p { font-size: 14px; color: #5a5e58; line-height: 1.5; margin: 0 0 22px; }
.amm-buttons { display: flex; gap: 10px; }
.amm-btn {
  flex: 1; padding: 11px 14px; border-radius: 8px;
  font-family: 'Inter', sans-serif; font-size: 11px;
  letter-spacing: 0.1em; text-transform: uppercase; font-weight: 600;
  cursor: pointer; transition: opacity 0.15s ease; border: 1px solid #2C5856;
}
.amm-btn-cancel { background: transparent; color: #2C5856; }
.amm-btn-confirm { background: #2C5856; color: #F4EFE3; }
.amm-btn:hover { opacity: 0.85; }
html.dark .app-mode-modal, body.dark .app-mode-modal { background: #232830; }
html.dark .app-mode-modal h3 { color: #e8e6e0; }
html.dark .app-mode-modal p { color: #b0aea8; }
"""

MANIFEST = {
    "name": "Gri English",
    "short_name": "Gri English",
    "description": "Sınav İngilizcesi pratik platformu. SAT, IELTS, TOEFL, IB, YDT için soru bankası, kelime bankası ve yazı pratiği.",
    "start_url": "/?mode=app",
    "scope": "/",
    "display": "standalone",
    "orientation": "portrait",
    "background_color": "#faf7ee",
    "theme_color": "#2C5856",
    "lang": "tr",
    "dir": "ltr",
    "categories": ["education", "books"],
    "icons": [
        {"src": "/apple-touch-icon.png", "sizes": "180x180", "type": "image/png", "purpose": "any"},
        {"src": "/apple-touch-icon.png", "sizes": "180x180", "type": "image/png", "purpose": "maskable"}
    ]
}

INDEX_HIDE_PATTERNS = [
    ('<a href="ogretmen.html" class="hm-cta-link">', '<a href="ogretmen.html" class="hm-cta-link hide-in-app">'),
    ('<a href="ogretmen.html" class="hm-cta hm-cta-ghost">Öğretmensen Buradan</a>',
     '<a href="ogretmen.html" class="hm-cta hm-cta-ghost hide-in-app">Öğretmensen Buradan</a>'),
    ('<a href="ogretmen.html" class="hm-card hm-c-purple"', '<a href="ogretmen.html" class="hm-card hm-c-purple hide-in-app"'),
    ('<a href="ogretmen.html" class="hm-cta hm-cta-ghost" style="border-color: #3C3489; color: #3C3489;">Sınıfını Kur</a>',
     '<a href="ogretmen.html" class="hm-cta hm-cta-ghost hide-in-app" style="border-color: #3C3489; color: #3C3489;">Sınıfını Kur</a>'),
]


def write_app_mode_assets():
    assets_dir = os.path.join(REPO_ROOT, 'assets')
    if not os.path.exists(assets_dir):
        print('[err] assets/ bulunamadı'); return False
    with open(os.path.join(assets_dir, 'app-mode.js'), 'w', encoding='utf-8') as f:
        f.write(APP_MODE_JS)
    with open(os.path.join(assets_dir, 'app-mode.css'), 'w', encoding='utf-8') as f:
        f.write(APP_MODE_CSS)
    print('[ok] assets/app-mode.js ve assets/app-mode.css yazıldı')


def write_manifest():
    path = os.path.join(REPO_ROOT, 'manifest.json')
    if os.path.exists(path):
        try:
            with open(path) as f:
                existing = json.load(f)
            existing['start_url'] = '/?mode=app'
            with open(path, 'w', encoding='utf-8') as f:
                json.dump(existing, f, indent=2, ensure_ascii=False)
            print('[ok] manifest.json güncellendi (start_url: /?mode=app)')
            return
        except Exception:
            pass
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(MANIFEST, f, indent=2, ensure_ascii=False)
    print('[ok] manifest.json oluşturuldu')


def inject_app_mode_into_html():
    inject_block = '''  <!-- APP MODE -->
  <link rel="stylesheet" href="/assets/app-mode.css">
  <script src="/assets/app-mode.js" defer></script>
</head>'''
    html_files = []
    for root, dirs, files in os.walk(REPO_ROOT):
        dirs[:] = [d for d in dirs if not d.startswith('.') and d != 'node_modules']
        for f in files:
            if f.endswith('.html'): html_files.append(os.path.join(root, f))
    patched = already = no_head = 0
    for path in html_files:
        with open(path, 'r', encoding='utf-8') as f: html = f.read()
        if '<!-- APP MODE -->' in html: already += 1; continue
        if '</head>' not in html: no_head += 1; continue
        html = html.replace('</head>', inject_block, 1)
        with open(path, 'w', encoding='utf-8') as f: f.write(html)
        patched += 1
    print(f'[ok] HTML head patched: {patched} | already: {already} | no-head: {no_head}')


def patch_index_html_teacher():
    path = os.path.join(REPO_ROOT, 'index.html')
    if not os.path.exists(path): return
    with open(path, 'r', encoding='utf-8') as f: html = f.read()
    patched = 0
    for old, new in INDEX_HIDE_PATTERNS:
        if old in html and new not in html:
            html = html.replace(old, new); patched += 1
    teacher_section_old = '''     BÖLÜM 02 — Öğretmen 3-Step Flow
     =================================================================== -->
<section class="bolum bolum-02">'''
    teacher_section_new = '''     BÖLÜM 02 — Öğretmen 3-Step Flow
     =================================================================== -->
<section class="bolum bolum-02 hide-in-app">'''
    if teacher_section_old in html and teacher_section_new not in html:
        html = html.replace(teacher_section_old, teacher_section_new)
        patched += 1
        print('[ok] index.html Bölüm 02 (Öğretmen) hide-in-app eklendi')
    with open(path, 'w', encoding='utf-8') as f: f.write(html)
    print(f'[ok] index.html öğretmen elementleri: {patched} değişiklik')


def patch_panelim_teacher():
    path = os.path.join(REPO_ROOT, 'panelim.html')
    if not os.path.exists(path): print('[skip] panelim.html bulunamadı'); return
    with open(path, 'r', encoding='utf-8') as f: html = f.read()
    patched = 0
    patterns = [
        ('<a href="ogretmen.html"', '<a href="ogretmen.html" class="hide-in-app"'),
        ('<a href="ogretmen-sinif.html"', '<a href="ogretmen-sinif.html" class="hide-in-app"'),
        ('<a href="ogretmen-yazi-degerlendirme.html"', '<a href="ogretmen-yazi-degerlendirme.html" class="hide-in-app"'),
        ('<a href="admin.html"', '<a href="admin.html" class="hide-in-app"'),
        ('<a href="admin-writing-review.html"', '<a href="admin-writing-review.html" class="hide-in-app"'),
    ]
    for old, new in patterns:
        if new in html: continue
        if old in html:
            html = html.replace(old, new); patched += 1
    with open(path, 'w', encoding='utf-8') as f: f.write(html)
    print(f'[ok] panelim.html öğretmen linkleri: {patched} değişiklik')


def main():
    print('=' * 60)
    print('Faz 1 — PWA App Mode patch')
    print('=' * 60)
    print('\n--- Step 1: assets/app-mode.js + css ---')
    write_app_mode_assets()
    print('\n--- Step 2: manifest.json ---')
    write_manifest()
    print('\n--- Step 3: HTML <head> inject ---')
    inject_app_mode_into_html()
    print('\n--- Step 4: index.html öğretmen ---')
    patch_index_html_teacher()
    print('\n--- Step 5: panelim.html öğretmen ---')
    patch_panelim_teacher()
    print('\n' + '=' * 60)
    print('Bitti! Şimdi: git add . && git commit -m "Faz 1 - App Mode" && git push')
    print('Test: https://gringlizce.com/?mode=app')
    print('Çıkış (browser console): GriAppMode.exit()')
    print('=' * 60)

if __name__ == '__main__': main()
