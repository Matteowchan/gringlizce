#!/usr/bin/env python3
"""
Gri English . nav + duyuru barini TUM sayfalara yay (kok + alt klasorler, idempotent)
------------------------------------------------------------------------------------
Her HTML sayfasina (alt klasorler dahil), eksikse:
  1. eski nav'i (<header class="site-header">...</header>) kaldirir
  2. curriculum.js + nav.js ekler        (dogru derinlik: kokte assets/, alt klasorde ../assets/)
  3. supabase-js + site-config.js ekler  (duyuru bari + gercek hesap menusu)
  4. <div class="launch-banner" data-site-banner></div> ekler (hic banner yoksa)
  5. main.css yoksa kucuk bir .launch-banner stili ekler

Guvenli: EXCLUDE ve SKIP_DIRS'e dokunmaz. Zaten olani atlar. Iki kez calistirilabilir.
Kullanim:
  python3 migrate-all.py --dry     # rapor
  python3 migrate-all.py           # uygula
"""
import os, re, sys

DRY = "--dry" in sys.argv

SKIP_DIRS = {"assets", "files", "icons", "supabase", ".git", "node_modules"}
EXCLUDE = {
    "giris.html", "sifre-sifirla.html", "kayit.html",
    "admin.html", "admin-writing-review.html",
    "ogrenme-haritasi.html",
    # Sinav/deneme sayfalarini haric tutmak istersen adlarini ekle, ornek:
    # "ielts-deneme-listening.html", "udsp-deneme-1.html", "sat-mock-1.html", "vocab-quiz.html",
}

SUPA = '<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>'
BANNER_CSS = ('  <style>.launch-banner{display:none;background:#1A2230;color:#F4EFE3;text-align:center;'
              'padding:.55rem 1rem;font-family:Inter,system-ui,sans-serif;font-size:.72rem;letter-spacing:.12em;'
              'text-transform:uppercase;font-weight:500;line-height:1.5}.launch-banner strong{color:#C89A3C;font-weight:600}</style>\n')
BANNER_DIV = '<div class="launch-banner" data-site-banner></div>\n'

def strip_site_header(html):
    m = re.search(r'<header\b[^>]*class="[^"]*site-header[^"]*"[^>]*>', html, re.I)
    if not m:
        return html, False
    start, i, depth = m.start(), m.end(), 1
    op = re.compile(r'<header\b', re.I); cl = re.compile(r'</header>', re.I)
    while depth > 0:
        nc = cl.search(html, i)
        if not nc:
            return html, False
        no = op.search(html, i, nc.start())
        if no: depth += 1; i = no.end()
        else:  depth -= 1; i = nc.end()
    return html[:start] + html[i:], True

def add_head(html, snippet):
    return html.replace("</head>", snippet + "</head>", 1)

def process(path, depth):
    html = open(path, encoding="utf-8").read()
    if "</head>" not in html or "<body" not in html:
        return "atlandi-yapiyok"
    pre = "../" * depth        # dogru gorece yol on eki
    did = []

    # 0) eski nav'i kaldir
    html, removed = strip_site_header(html)
    if removed: did.append("eski-nav-silindi")

    # 1) nav + curriculum
    if "nav.js" not in html:
        html = add_head(html, '  <script src="%sassets/curriculum.js"></script>\n  <script src="%sassets/nav.js"></script>\n' % (pre, pre))
        did.append("nav")

    # 2) supabase + site-config
    if "site-config.js" not in html:
        supa = "" if "supabase-js" in html else "  " + SUPA + "\n"
        html = add_head(html, supa + '  <script src="%sassets/site-config.js" defer></script>\n' % pre)
        did.append("site-config")

    # 3) banner (hic launch-banner yoksa)
    if "launch-banner" not in html:
        if "main.css" not in html:
            html = add_head(html, BANNER_CSS); did.append("banner-css")
        html = re.sub(r"(<body[^>]*>)\s*", r"\1\n" + BANNER_DIV, html, count=1)
        did.append("banner")

    if not did:
        return "atlandi-zaten"
    if not DRY:
        open(path, "w", encoding="utf-8").write(html)
    return "islendi: " + ", ".join(did)

def main():
    counts = {}
    for root, dirs, files in os.walk("."):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS and not d.startswith(".")]
        for fn in sorted(files):
            if not fn.endswith(".html"):
                continue
            if fn in EXCLUDE:
                counts["haric"] = counts.get("haric", 0) + 1; continue
            path = os.path.join(root, fn)
            depth = os.path.relpath(path, ".").count(os.sep)
            r = process(path, depth)
            key = r.split(":")[0]
            counts[key] = counts.get(key, 0) + 1
            if r.startswith("islendi"):
                print(("[DRY] " if DRY else "") + os.path.relpath(path, ".") + "  ->  " + r)
    print("\nOzet:", counts)
    print("DRY, hicbir dosya degismedi." if DRY else "Bitti. 'git diff' ile gozden gecir, sonra commit et.")

if __name__ == "__main__":
    main()
