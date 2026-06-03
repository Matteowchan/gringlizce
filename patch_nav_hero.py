#!/usr/bin/env python3
"""Gringlizce nav iki-satır + hero hizalama patch."""
import os, re

REPO_ROOT = os.path.dirname(os.path.abspath(__file__))

def patch_main_css():
    path = os.path.join(REPO_ROOT, 'assets', 'main.css')
    if not os.path.exists(path):
        print(f'[skip] {path} bulunamadı')
        return False
    with open(path, 'r', encoding='utf-8') as f:
        css = f.read()
    if '/* NAV-TWO-LINE-PATCH */' in css:
        print('[skip] main.css zaten patched')
        return False
    old_v4 = '''.nav-links {
  display: flex;
  list-style: none;
  margin: 0;
  padding: 0;
  gap: 1.4rem;
  font-family: var(--font-ui);
  font-size: 0.85rem;
  letter-spacing: 0.04em;
}

.nav-links a {
  position: relative;
  color: var(--text-soft);
  padding: 0.3rem 0;
  font-weight: 500;
  white-space: nowrap;
}'''
    old_orig = '''.nav-links {
  display: flex;
  list-style: none;
  margin: 0;
  padding: 0;
  gap: 1.8rem;
  font-family: var(--font-ui);
  font-size: 0.85rem;
  letter-spacing: 0.04em;
}

.nav-links a {
  position: relative;
  color: var(--text-soft);
  padding: 0.3rem 0;
  font-weight: 500;
}'''
    new = '''.nav-links {
  display: flex;
  list-style: none;
  margin: 0;
  padding: 0;
  gap: 1.6rem;
  font-family: 'Lora', Georgia, serif;
}

.nav-links a {
  position: relative;
  color: var(--text-soft);
  padding: 0.3rem 0;
  font-weight: 500;
  white-space: nowrap;
  display: inline-flex;
  flex-direction: column;
  align-items: flex-start;
  line-height: 1.25;
  text-align: left;
}

/* NAV-TWO-LINE-PATCH */
.nav-links a .nw1 {
  font-size: 13px;
  color: #2a2a2a;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.nav-links a .nw2 {
  font-size: 12px;
  color: #7a7a6e;
  font-weight: 400;
}
.nav-links a svg.caret {
  width: 8px;
  height: 8px;
  opacity: 0.5;
}
.nav-links a:hover,
.nav-links a.active {
  border-bottom: 1.5px solid var(--gold, #c89a3c);
}
.nav-links a:hover .nw1,
.nav-links a.active .nw1 {
  color: var(--teal, #2C5856);
}
.nav-links a:hover .nw2,
.nav-links a.active .nw2 {
  color: var(--teal, #2C5856);
  opacity: 0.85;
}
.nav-links a:hover svg.caret,
.nav-links a.active svg.caret {
  opacity: 0.7;
}'''
    if old_v4 in css:
        css = css.replace(old_v4, new)
        print('[ok] main.css (gap 1.4) bloğu güncellendi')
    elif old_orig in css:
        css = css.replace(old_orig, new)
        print('[ok] main.css (gap 1.8) bloğu güncellendi')
    else:
        print('[warn] main.css nav-links bloğu bulunamadı')
        return False
    with open(path, 'w', encoding='utf-8') as f:
        f.write(css)
    return True

def patch_index_html_hero():
    path = os.path.join(REPO_ROOT, 'index.html')
    if not os.path.exists(path):
        print(f'[skip] {path} bulunamadı')
        return False
    with open(path, 'r', encoding='utf-8') as f:
        html = f.read()
    if '/* HERO-ALIGN-PATCH */' in html:
        print('[skip] index.html hero zaten patched')
        return False
    hero_align_css = '''
  /* HERO-ALIGN-PATCH */
  @media (max-width: 700px) {
    .hm-line { max-width: 300px !important; margin-left: auto !important; margin-right: auto !important; line-height: 1.5 !important; }
    .hm-tagline { max-width: 300px !important; margin-left: auto !important; margin-right: auto !important; }
    .hm-exam-list { font-size: 0.78rem !important; letter-spacing: 0.02em !important; line-height: 1.8 !important; max-width: 320px !important; margin-left: auto !important; margin-right: auto !important; flex-wrap: wrap !important; justify-content: center !important; }
    .hm-cta-row { width: 100% !important; flex-direction: column !important; align-items: center !important; padding: 0 0.25rem !important; gap: 0.9rem !important; box-sizing: border-box !important; }
    .hm-cta { width: 100% !important; max-width: 280px !important; padding: 0.8rem 1.1rem !important; letter-spacing: 0.12em !important; border-radius: 8px !important; }
  }
</style>'''
    if '</style>' not in html:
        print('[warn] index.html içinde </style> bulunamadı')
        return False
    idx = html.rfind('</style>')
    html = html[:idx] + hero_align_css + html[idx + len('</style>'):]
    print('[ok] index.html\'e hero hizalama CSS\'i eklendi')
    with open(path, 'w', encoding='utf-8') as f:
        f.write(html)
    return True

DROPDOWN_PAIRS = [
    ('Sınav Bilgisi', 'Sınav', 'Bilgisi'),
    ('Soru Bankası', 'Soru', 'Bankası'),
    ('Ders Notları', 'Ders', 'Notları'),
]

def patch_dropdown_triggers(html):
    changed = False
    for full, w1, w2 in DROPDOWN_PAIRS:
        pattern = re.compile(
            r'(<a[^>]*class="nav-dropdown-trigger"[^>]*>)\s*'
            r'<span>' + re.escape(full) + r'</span>\s*'
            r'(<svg class="caret"[^>]*>[^<]*<path[^/]*/>\s*</svg>)\s*'
            r'(</a>)',
            re.DOTALL
        )
        def repl(m):
            return f'{m.group(1)}<span class="nw1">{w1} {m.group(2)}</span><span class="nw2">{w2}</span>{m.group(3)}'
        new_html, n = pattern.subn(repl, html)
        if n > 0:
            html = new_html
            changed = True
    return html, changed

def patch_simple_links(html):
    changed = False
    items = [
        (r'kelime-bankasi\.html', 'Kelime Bankası', 'Kelime', 'Bankası', False),
        (r'yazi-pratigi\.html', 'Yazı Pratiği', 'Yazı', 'Pratiği', False),
        (r'calisma-paketleri\.html', 'Çalışma Paketleri', 'Çalışma', 'Paketleri', True),
        (r'iletisim\.html', 'Bize Ulaşın', 'Bize', 'Ulaşın', False),
        (r'iletisim\.html', 'İletişim', 'Bize', 'Ulaşın', False),
    ]
    for href_re, old_text, w1, w2, gold_dot in items:
        if gold_dot:
            pattern = re.compile(
                r'(<li><a href="(?:\.\./)?' + href_re + r'">)'
                r'<span style="color:#9C7F45;[^"]*" aria-hidden="true">&bull;</span>'
                + re.escape(old_text) +
                r'(</a></li>)',
                re.DOTALL
            )
        else:
            pattern = re.compile(
                r'(<li><a href="(?:\.\./)?' + href_re + r'">)'
                + re.escape(old_text) +
                r'(</a></li>)',
                re.DOTALL
            )
        replacement = r'\1<span class="nw1">' + w1 + r'</span><span class="nw2">' + w2 + r'</span>\2'
        new_html, n = pattern.subn(replacement, html)
        if n > 0:
            html = new_html
            changed = True
    return html, changed

def patch_all_html_files():
    html_files = []
    for root, dirs, files in os.walk(REPO_ROOT):
        dirs[:] = [d for d in dirs if not d.startswith('.') and d != 'node_modules']
        for f in files:
            if f.endswith('.html'):
                html_files.append(os.path.join(root, f))
    print(f'\n{len(html_files)} HTML dosyası tarandı...')
    dropdown_patched = 0
    simple_patched = 0
    skipped = 0
    for path in html_files:
        with open(path, 'r', encoding='utf-8') as f:
            html = f.read()
        if 'class="nw1"' in html and 'class="nw2"' in html:
            skipped += 1
            continue
        orig = html
        html, c1 = patch_dropdown_triggers(html)
        html, c2 = patch_simple_links(html)
        if html != orig:
            with open(path, 'w', encoding='utf-8') as f:
                f.write(html)
            if c1: dropdown_patched += 1
            if c2: simple_patched += 1
    print(f'[ok] Dropdown trigger patched: {dropdown_patched} dosya')
    print(f'[ok] Simple link patched: {simple_patched} dosya')
    print(f'[skip] Zaten patched: {skipped} dosya')

def main():
    print('=' * 60)
    print('Gringlizce nav iki-satır + hero hizalama patch')
    print('=' * 60)
    print('\n--- Step 1: assets/main.css ---')
    patch_main_css()
    print('\n--- Step 2: index.html hero hizalama ---')
    patch_index_html_hero()
    print('\n--- Step 3: Tüm HTML\'lerde nav-links yapısı ---')
    patch_all_html_files()
    print('\n' + '=' * 60)
    print('Bitti! Şimdi:')
    print('  git diff --stat')
    print('  git add .')
    print('  git commit -m "Nav iki-satır + hero hizalama"')
    print('  git push')
    print('=' * 60)

if __name__ == '__main__':
    main()
