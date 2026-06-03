#!/usr/bin/env python3
"""Faz 1.7-D2 - q-actionbar bottom-nav uyumu."""
import os

REPO_ROOT = os.path.dirname(os.path.abspath(__file__))

PATCH_CSS = '''
/* ===== APP MODE q-actionbar fix (soru.html) ===== */
@media (max-width: 700px) {
  .app-mode .q-actionbar {
    bottom: calc(62px + env(safe-area-inset-bottom, 0px)) !important;
  }
  body.app-mode[data-cat] {
    padding-bottom: calc(140px + env(safe-area-inset-bottom, 0px)) !important;
  }
}
'''

def append():
    path = os.path.join(REPO_ROOT, 'assets', 'app-mode.css')
    if not os.path.exists(path):
        print('[err] app-mode.css yok'); return
    with open(path) as f: css = f.read()
    if 'q-actionbar fix' in css:
        print('[skip] zaten ekli'); return
    with open(path, 'a') as f: f.write(PATCH_CSS)
    print('[ok] q-actionbar fix eklendi')

if __name__ == '__main__':
    append()
