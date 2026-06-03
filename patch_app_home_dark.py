#!/usr/bin/env python3
"""Faz 1.5 dark mode düzeltmesi."""
import os

REPO_ROOT = os.path.dirname(os.path.abspath(__file__))

DARK_MODE_CSS = '''
/* ===== APP MODE DARK THEME ===== */
:root[data-theme="dark"] .app-bottom-nav {
  background: #1a1815;
  border-top-color: #3a3530;
}
:root[data-theme="dark"] .abn-item { color: #888377; }
:root[data-theme="dark"] .abn-item.active { color: #6FC2BD; }
:root[data-theme="dark"] .abn-item:hover { color: #6FC2BD; }

:root[data-theme="dark"] .app-mode-modal { background: #232017; }
:root[data-theme="dark"] .app-mode-modal h3 { color: #e8e3d6; }
:root[data-theme="dark"] .app-mode-modal p { color: #c4bfb2; }
:root[data-theme="dark"] .amm-icon {
  background: rgba(111, 194, 189, 0.15);
  color: #6FC2BD;
}
:root[data-theme="dark"] .amm-btn-cancel { color: #6FC2BD; border-color: #6FC2BD; }
:root[data-theme="dark"] .amm-btn-confirm {
  background: #6FC2BD; color: #1a1815; border-color: #6FC2BD;
}

:root[data-theme="dark"] .ah-greeting h1 { color: #e8e3d6; }
:root[data-theme="dark"] .ah-streak-pill {
  background: rgba(200, 154, 60, 0.18);
  color: #d8b266;
}
:root[data-theme="dark"] .ah-section-label { color: #a89a78; }
:root[data-theme="dark"] .ah-continue { background: #2C5856; }

:root[data-theme="dark"] .ah-card {
  background: #28241e;
  border-color: #3a3530;
}
:root[data-theme="dark"] .ah-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}
:root[data-theme="dark"] .ah-card-title { color: #e8e3d6; }
:root[data-theme="dark"] .ah-card-sub { color: #9e9482; }
:root[data-theme="dark"] .ah-c-teal .ah-card-icon {
  background: rgba(111, 194, 189, 0.15);
  color: #6FC2BD;
}
:root[data-theme="dark"] .ah-c-gold .ah-card-icon {
  background: rgba(216, 178, 102, 0.18);
  color: #d8b266;
}
:root[data-theme="dark"] .ah-c-coral .ah-card-icon {
  background: rgba(220, 130, 100, 0.18);
  color: #dc8264;
}
:root[data-theme="dark"] .ah-c-purple .ah-card-icon {
  background: rgba(150, 135, 215, 0.18);
  color: #9687d7;
}

:root[data-theme="dark"] .ah-word-card {
  background: #28241e;
  border-color: #3a3530;
}
:root[data-theme="dark"] .ah-word-text { color: #6FC2BD; }
:root[data-theme="dark"] .ah-word-pos { color: #a89a78; }
:root[data-theme="dark"] .ah-word-pron { color: #9e9482; }
:root[data-theme="dark"] .ah-word-def { color: #d8d2c0; }

:root[data-theme="dark"] .ah-premium-card {
  background: linear-gradient(135deg, rgba(216, 178, 102, 0.16), rgba(111, 194, 189, 0.1));
  border-color: rgba(216, 178, 102, 0.45);
}
:root[data-theme="dark"] .ah-premium-icon {
  background: #d8b266;
  color: #1a1815;
}
:root[data-theme="dark"] .ah-premium-title { color: #e8e3d6; }
:root[data-theme="dark"] .ah-premium-sub { color: #b8b0a2; }
:root[data-theme="dark"] .ah-premium-arrow { color: #d8b266; }
'''

def append_dark_mode_css():
    path = os.path.join(REPO_ROOT, 'assets', 'app-mode.css')
    if not os.path.exists(path):
        print('[err] assets/app-mode.css bulunamadı'); return
    with open(path, 'r', encoding='utf-8') as f: css = f.read()
    if 'APP MODE DARK THEME' in css:
        print('[skip] dark theme zaten ekli'); return
    with open(path, 'a', encoding='utf-8') as f: f.write(DARK_MODE_CSS)
    print('[ok] dark mode CSS eklendi')

if __name__ == '__main__':
    print('--- Faz 1.5 dark mode fix ---')
    append_dark_mode_css()
    print('Bitti.')
