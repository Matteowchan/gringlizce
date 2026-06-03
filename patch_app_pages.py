#!/usr/bin/env python3
"""Faz 1.7-D - Soru/Kelime sayfaları app-mode UX."""
import os

REPO_ROOT = os.path.dirname(os.path.abspath(__file__))

APP_PAGES_CSS = '''
/* ===== APP MODE PAGE UX (Faz 1.7-D) ===== */
.app-mode .site-footer { display: none !important; }
.app-mode .site-header { padding: 0.3rem 0 !important; }
.app-mode .site-header .brand { font-size: 0.95rem !important; }
.app-mode .site-header .wrap {
  padding-top: 0.3rem !important;
  padding-bottom: 0.3rem !important;
}
.app-mode .qb-hub-hero { padding: 1.2rem 0 0.5rem !important; }
.app-mode .qb-hub-hero .eyebrow {
  font-size: 9px !important;
  margin-bottom: 0.3rem !important;
}
.app-mode .qb-hub-hero h1 {
  font-size: 1.7rem !important;
  margin: 0.2rem 0 0.5rem !important;
  line-height: 1.15 !important;
}
.app-mode .qb-hub-hero .divider { margin: 0.4rem auto !important; }
.app-mode .qb-hub-hero .lead {
  font-size: 0.92rem !important;
  line-height: 1.5 !important;
  margin-bottom: 0.7rem !important;
}
.app-mode .qb-hub-hero .stats {
  margin-top: 0.7rem !important;
  gap: 1.2rem !important;
}
.app-mode .qb-hub-hero .stats .s-num { font-size: 1.4rem !important; }
.app-mode .qb-hub-hero .stats .s-lbl { font-size: 9px !important; }
.app-mode .qb-hub-grid { gap: 0.7rem !important; }
@media (max-width: 700px) {
  .app-mode .qb-hub-grid { grid-template-columns: 1fr !important; }
}
.app-mode .qb-hub-card { padding: 1rem 1.1rem !important; }
.app-mode .qb-hub-card h3 {
  font-size: 1.1rem !important;
  margin-bottom: 0.3rem !important;
}
.app-mode .qb-hub-desc {
  font-size: 0.85rem !important;
  line-height: 1.45 !important;
  margin-bottom: 0.5rem !important;
}
.app-mode .qb-hub-meta { margin-top: 0.4rem !important; }
.app-mode .qb-hub-meta .m-num { font-size: 0.95rem !important; }
.app-mode .qb-hub-meta .m-lbl { font-size: 9px !important; }
.app-mode section[style*="padding: 1rem 0 5rem"] {
  padding: 0.5rem 0 1rem !important;
}
.app-mode .page-hero {
  padding-top: 1rem !important;
  padding-bottom: 0.8rem !important;
}
.app-mode .page-hero h1 { font-size: 1.6rem !important; }
.app-mode .yp-hero,
.app-mode .writing-hero { padding: 1rem 0 0.6rem !important; }
.app-mode .top-banner,
.app-mode .promo-strip,
.app-mode .announcement-bar,
.app-mode .global-discount-banner,
.app-mode #global-discount-banner,
.app-mode .home-discount-banner { display: none !important; }
@media (max-width: 700px) {
  body.app-mode { padding-bottom: 78px !important; }
}
'''

def append_to_app_mode_css():
    path = os.path.join(REPO_ROOT, 'assets', 'app-mode.css')
    if not os.path.exists(path):
        print('[err] assets/app-mode.css bulunamadı'); return
    with open(path, 'r', encoding='utf-8') as f: css = f.read()
    if 'APP MODE PAGE UX (Faz 1.7-D)' in css:
        print('[skip] page UX zaten ekli'); return
    with open(path, 'a', encoding='utf-8') as f: f.write(APP_PAGES_CSS)
    print('[ok] page UX CSS eklendi')

if __name__ == '__main__':
    print('--- Faz 1.7-D Page UX ---')
    append_to_app_mode_css()
    print('Bitti.')
