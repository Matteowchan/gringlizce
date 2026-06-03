#!/usr/bin/env python3
"""Faz 1.7-D2 - Soru sayfasında bottom-nav gizle, q-actionbar normal pozisyonda kalsın."""
import os

REPO_ROOT = os.path.dirname(os.path.abspath(__file__))


def update_js():
    path = os.path.join(REPO_ROOT, 'assets', 'app-mode.js')
    with open(path) as f: js = f.read()

    if 'has-actionbar' in js:
        print('[skip] JS zaten güncel'); return

    old = """  function injectBottomNav() {
    if (window.innerWidth > 700) return;
    if (document.querySelector('.app-bottom-nav')) return;"""

    new = """  function injectBottomNav() {
    if (window.innerWidth > 700) return;
    if (document.querySelector('.app-bottom-nav')) return;

    // Soru çözme sayfalarında (q-actionbar olanlar) bottom-nav gizle
    if (document.querySelector('.q-actionbar')) {
      document.body.classList.add('has-actionbar');
      return;
    }"""

    if old in js:
        js = js.replace(old, new)
        with open(path, 'w') as f: f.write(js)
        print('[ok] app-mode.js güncellendi')
    else:
        print('[err] injectBottomNav bulunamadı')


def update_css():
    path = os.path.join(REPO_ROOT, 'assets', 'app-mode.css')
    with open(path) as f: css = f.read()

    # Önceki q-actionbar fix patch'i varsa kaldır
    old_fix = """
/* ===== APP MODE q-actionbar fix (soru.html) ===== */
@media (max-width: 700px) {
  .app-mode .q-actionbar {
    bottom: calc(62px + env(safe-area-inset-bottom, 0px)) !important;
  }
  body.app-mode[data-cat] {
    padding-bottom: calc(140px + env(safe-area-inset-bottom, 0px)) !important;
  }
}
"""
    if old_fix in css:
        css = css.replace(old_fix, '')
        print('[ok] eski q-actionbar fix kaldırıldı')

    # Padding-bottom rule'a :not(.has-actionbar) ekle
    targets = [
        ('@media (max-width: 700px) {\n  body.app-mode {\n    padding-bottom: 78px !important;\n  }\n}',
         '@media (max-width: 700px) {\n  body.app-mode:not(.has-actionbar) {\n    padding-bottom: 78px !important;\n  }\n}'),
        ('@media (max-width: 700px) {\n  body.app-mode {\n    padding-bottom: 70px;\n  }\n}',
         '@media (max-width: 700px) {\n  body.app-mode:not(.has-actionbar) {\n    padding-bottom: 70px;\n  }\n}'),
    ]
    for old, new in targets:
        if old in css and new not in css:
            css = css.replace(old, new)
            print('[ok] padding-bottom kuralı güncellendi')

    with open(path, 'w') as f: f.write(css)


if __name__ == '__main__':
    print('--- Faz 1.7-D2 actionbar hide nav ---')
    update_js()
    update_css()
    print('Bitti.')
