#!/usr/bin/env python3
"""
Gri English . tek seferlik nav migrasyonu
------------------------------------------
Ne yapar:
  1. Her kok HTML dosyasindaki eski nav'i (<header class="site-header">...</header>) cikarir.
  2. <head> icine iki satir ekler: assets/curriculum.js ve assets/nav.js.
  3. launch-banner'a (admin promo bari) DOKUNMAZ. nav onun altina enjekte olur.
Guvenli:
  - Sadece "site-header" iceren dosyalari isler (birebir degistirme).
  - Zaten migrate edilmis dosyayi (assets/nav.js iceren) atlar. Iki kez calistirilabilir.
  - Dosyayi bastan formatlamaz, yalnizca ilgili blogu keser ve iki satir ekler.
Kullanim:
  cd <repo koku>
  python3 migrate-nav.py            # uygular
  python3 migrate-nav.py --dry      # sadece raporlar, dosyaya yazmaz
Sonra:  git diff   ile birkac dosyayi gozden gecir, begenirsen commit et.
"""
import os, re, sys, glob

HEAD_SCRIPTS = '  <script src="assets/curriculum.js"></script>\n  <script src="assets/nav.js"></script>\n'
DRY = "--dry" in sys.argv

def find_balanced(html, tag, class_needle):
    """<tag ... class=...class_needle...> ile eslesen bloğun (start,end) araligini dondur, ic ice sayarak."""
    m = re.search(r'<' + tag + r'\b[^>]*class="[^"]*' + re.escape(class_needle) + r'[^"]*"[^>]*>', html, re.I)
    if not m:
        return None
    start, i, depth = m.start(), m.end(), 1
    open_re = re.compile(r'<' + tag + r'\b', re.I)
    close_re = re.compile(r'</' + tag + r'>', re.I)
    while depth > 0:
        nc = close_re.search(html, i)
        if not nc:
            return None  # bozuk yapi, dokunma
        no = open_re.search(html, i, nc.start())
        if no:
            depth += 1; i = no.end()
        else:
            depth -= 1; i = nc.end()
    return (start, i)

def migrate(path):
    html = open(path, encoding="utf-8").read()
    if "assets/nav.js" in html:
        return "atlandi-zaten"
    if "site-header" not in html:
        return "atlandi-navyok"
    span = find_balanced(html, "header", "site-header")
    if not span:
        return "atlandi-eslesmedi"
    if "</head>" not in html:
        return "atlandi-headyok"
    s, e = span
    # eski nav'i kes; ardindan kalan bos satiri toparla
    new = html[:s] + html[e:]
    new = re.sub(r'(<body[^>]*>)\s*\n\s*\n', r'\1\n', new, count=1)
    # scriptleri </head>'ten once ekle
    new = new.replace("</head>", HEAD_SCRIPTS + "</head>", 1)
    if not DRY:
        open(path, "w", encoding="utf-8").write(new)
    return "migrate"

def main():
    root = "."
    files = sorted(glob.glob(os.path.join(root, "*.html")))
    counts = {}
    for f in files:
        r = migrate(f)
        counts[r] = counts.get(r, 0) + 1
        if r == "migrate":
            print(("[DRY] " if DRY else "") + "nav degisti: " + os.path.basename(f))
    print("\nOzet:", counts)
    print(("DRY calisma, hicbir dosya degismedi." if DRY else "Bitti. 'git diff' ile gozden gecir, sonra commit et."))

if __name__ == "__main__":
    main()
