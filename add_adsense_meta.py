#!/usr/bin/env python3
"""
Tüm HTML dosyalarına Google AdSense doğrulama meta tag'i ekler.

Kullanım:
    cd /repo/root
    python3 add_adsense_meta.py

Mevcut meta tag varsa atlar (idempotent).
"""
import os
import re
import sys

CLIENT_ID = 'ca-pub-5818550785641442'
META_TAG = f'<meta name="google-adsense-account" content="{CLIENT_ID}">'

# Tarayacağı dizinler (relative, repo root'tan)
SEARCH_DIRS = ['.', './urun', './sb']


def patch_file(path):
    with open(path, encoding='utf-8') as f:
        content = f.read()

    if 'google-adsense-account' in content:
        return 'skip_already_has'

    # <meta charset=...>'tan hemen sonra ekle
    m = re.search(r'(<meta charset[^>]*>)', content)
    if not m:
        return 'skip_no_charset'

    new_content = content[:m.end()] + '\n  ' + META_TAG + content[m.end():]
    with open(path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    return 'ok'


def main():
    files = []
    for d in SEARCH_DIRS:
        if not os.path.isdir(d):
            continue
        for entry in sorted(os.listdir(d)):
            if entry.endswith('.html'):
                files.append(os.path.join(d, entry))

    if not files:
        print('UYARI: HTML dosyası bulunamadı. Repo root\'unda mısın?', file=sys.stderr)
        sys.exit(1)

    counts = {'ok': 0, 'skip_already_has': 0, 'skip_no_charset': 0}
    no_charset_files = []

    for path in files:
        result = patch_file(path)
        counts[result] += 1
        if result == 'skip_no_charset':
            no_charset_files.append(path)

    print(f'Toplam taranan: {len(files)}')
    print(f'Eklendi: {counts["ok"]}')
    print(f'Zaten vardı (atlandı): {counts["skip_already_has"]}')
    if counts['skip_no_charset'] > 0:
        print(f'<meta charset> bulunamayan (atlandı): {counts["skip_no_charset"]}')
        for p in no_charset_files[:5]:
            print(f'  - {p}')
        if len(no_charset_files) > 5:
            print(f'  ... ve {len(no_charset_files) - 5} tane daha')


if __name__ == '__main__':
    main()
