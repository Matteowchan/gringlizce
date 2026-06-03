#!/usr/bin/env python3
"""Faz 1.7-D3 - Floating pill dock (bottom-nav + q-actionbar)."""
import os

REPO_ROOT = os.path.dirname(os.path.abspath(__file__))

CSS = '''
/* ===== FLOATING PILL DOCK (Faz 1.7-D3) ===== */

/* Body padding (floating dock için yeterli alan) */
@media (max-width: 700px) {
  body.app-mode:not(.has-actionbar) {
    padding-bottom: calc(86px + env(safe-area-inset-bottom, 0px)) !important;
  }
  body.app-mode.has-actionbar {
    padding-bottom: calc(90px + env(safe-area-inset-bottom, 0px)) !important;
  }
}

/* === Bottom navigation (anasayfa, hub sayfaları, vs) === */
.app-bottom-nav {
  bottom: max(14px, env(safe-area-inset-bottom, 14px)) !important;
  left: 14px !important;
  right: 14px !important;
  height: auto !important;
  background: rgba(26, 31, 37, 0.92) !important;
  backdrop-filter: blur(20px) saturate(180%) !important;
  -webkit-backdrop-filter: blur(20px) saturate(180%) !important;
  border-top: none !important;
  border-radius: 22px !important;
  padding: 7px 6px !important;
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.25), 0 2px 6px rgba(0, 0, 0, 0.1) !important;
  display: flex !important;
  justify-content: space-around !important;
  align-items: center !important;
  gap: 4px !important;
  box-sizing: border-box !important;
}

.abn-item {
  flex: 0 1 auto !important;
  display: flex !important;
  flex-direction: row !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 6px !important;
  padding: 9px 11px !important;
  border-radius: 14px !important;
  color: #888377 !important;
  transition: all 0.2s ease !important;
  text-decoration: none !important;
}

.abn-item.active {
  background: #2C5856 !important;
  color: #F4EFE3 !important;
  padding: 9px 14px !important;
}

.abn-icon {
  width: 18px !important;
  height: 18px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}

.abn-label {
  font-size: 0 !important;
  font-weight: 600 !important;
  letter-spacing: 0.02em !important;
  font-family: 'Inter', sans-serif !important;
  overflow: hidden !important;
  white-space: nowrap !important;
  transition: font-size 0.2s ease !important;
}

.abn-item.active .abn-label {
  font-size: 11.5px !important;
}

/* === q-actionbar (soru sayfası) app modu === */
@media (max-width: 700px) {
  .app-mode .q-actionbar {
    bottom: max(14px, env(safe-area-inset-bottom, 14px)) !important;
    left: 14px !important;
    right: 14px !important;
    background: rgba(26, 31, 37, 0.92) !important;
    backdrop-filter: blur(20px) saturate(180%) !important;
    -webkit-backdrop-filter: blur(20px) saturate(180%) !important;
    border-top: none !important;
    border: none !important;
    border-radius: 22px !important;
    padding: 7px 8px !important;
    box-shadow: 0 8px 28px rgba(0, 0, 0, 0.25), 0 2px 6px rgba(0, 0, 0, 0.1) !important;
    gap: 4px !important;
    box-sizing: border-box !important;
  }

  .app-mode .q-nav-pill {
    background: rgba(244, 239, 227, 0.1) !important;
    color: #F4EFE3 !important;
    border: none !important;
    padding: 7px 11px !important;
    border-radius: 12px !important;
    font-size: 11px !important;
    font-weight: 600 !important;
  }
  .app-mode .q-nav-pill .np-count strong { color: #F4EFE3 !important; }
  .app-mode .q-nav-pill .np-count { color: rgba(244, 239, 227, 0.75) !important; }
  .app-mode .q-nav-pill .np-caret { color: rgba(244, 239, 227, 0.6) !important; }

  .app-mode .q-btn {
    background: transparent !important;
    color: #c4bfb2 !important;
    border: none !important;
    padding: 9px 10px !important;
    border-radius: 12px !important;
    transition: all 0.2s ease !important;
  }
  .app-mode .q-btn:hover,
  .app-mode .q-btn:active {
    background: rgba(244, 239, 227, 0.1) !important;
    color: #F4EFE3 !important;
  }

  .app-mode .q-btn-explain,
  .app-mode .q-btn-vocab {
    color: #6FC2BD !important;
  }
  .app-mode .q-btn-explain:hover,
  .app-mode .q-btn-vocab:hover {
    background: rgba(111, 194, 189, 0.15) !important;
    color: #6FC2BD !important;
  }
}

/* Light theme - dock'un light moddaki versiyonu da koyu cam (premium his) */
'''

def append():
    path = os.path.join(REPO_ROOT, 'assets', 'app-mode.css')
    if not os.path.exists(path):
        print('[err] app-mode.css yok'); return
    with open(path) as f: css = f.read()
    if 'FLOATING PILL DOCK (Faz 1.7-D3)' in css:
        print('[skip] zaten ekli'); return
    with open(path, 'a') as f: f.write(CSS)
    print('[ok] floating dock CSS eklendi')

if __name__ == '__main__':
    append()
