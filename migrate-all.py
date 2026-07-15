#!/usr/bin/env python3
"""
Gri English . nav + duyuru barini TUM sayfalara yay (tek seferlik, idempotent)
------------------------------------------------------------------------------
Her kok HTML sayfasina, eksikse, sunlari ekler:
  1. assets/curriculum.js + assets/nav.js   (paylasimli nav, hesap menusu mount noktasi dahil)
  2. supabase-js + assets/site-config.js     (duyuru bari + gercek hesap menusu)
  3. <div class="launch-banner" data-site-banner></div>  (duyuru bari yeri, admin doldurur)
  4. main.css yoksa kucuk bir .launch-banner stili (bar bicimli gorunsun)

Guvenli:
  - EXCLUDE listesindeki sayfalara DOKUNMAZ.
  - Zaten olani tekrar eklemez. Iki kez calistirilabilir.
  - Dosyayi bastan formatlamaz, yalnizca eksik satirlari ekler.

Kullanim:
  cd <repo koku>
  python3 migrate-all.py --dry      # sadece raporlar, yazmaz
  python3 migrate-all.py            # uygular
Sonra:  git diff   ile gozden gecir, begenirsen commit et.
"""
import os, re, sys, glob

DRY = "--dry" in sys.argv

# ---- Bu sayfalara nav/duyuru EKLENMEZ. Istedigini ekle/cikar. ----
EXCLUDE = {
    "giris.html", "sifre-sifirla.html", "kayit.html",   # giris / hesap
    "admin.html", "admin-writing-review.html",           # admin araclari
    "ogrenme-haritasi.html",                             # zaten tam kurulu
    # Sinav / deneme sayfalarini da haric tutmak istersen buraya ekle, ornek:
    # "ielts-deneme-listening.html", "ielts-deneme-reading.html", "ielts-deneme-writing.html",
    # "udsp-deneme-1.html", "udsp-deneme-2.html", "udsp-deneme-3.html",
    # "sat-mock-1.html", "full-test-4.html", "vocab-quiz.html", "sat-unite-1.html",
    # "day-1-math-linear.html",  # ... gunluk kamp sayfalari
}

SUPA = '<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>'
NAV_SCRIPTS = '  <script src="assets/curriculum.js"></script>\n  <script src="assets/nav.js"></script>\n'
CFG_SCRIPT = '  <script src="assets/site-config.js" defer></script>\n'
BANNER_DIV = '<div class="launch-banner" data-site-banner></div>\n'
BANNER_CSS = ('  <style>.launch-banner{display:none;background:#1A2230;color:#F4EFE3;text-align:center;'
              'padding:.55rem 1rem;font-family:Inter,system-ui,sans-serif;font-size:.72rem;letter-spacing:.12em;'
              'text-transform:uppercase;font-weight:500;line-height:1.5}.launch-banner strong{color:#C89A3C;font-weight:600}</style>\n')

def add_before_head_close(html, snippet):
    return html.replace("</head>", snippet + "</head>", 1)

def migrate(path):
    html = open(path, encoding="utf-8").read()
    if "</head>" not in html or "<body" not in html:
        return "atlandi-yapiyok"
    did = []

    # 1) nav + curriculum
    if "assets/nav.js" not in html:
        html = add_before_head_close(html, NAV_SCRIPTS); did.append("nav")

    # 2) supabase + site-config
    if "site-config.js" not in html:
        supa = "" if "supabase-js" in html else "  " + SUPA + "\n"
        html = add_before_head_close(html, supa + CFG_SCRIPT); did.append("site-config")

    # 3) banner div (+ main.css yoksa stil)
    if "launch-banner" not in html:
        if "main.css" not in html:
            html = add_before_head_close(html, BANNER_CSS); did.append("banner-css")
        html = re.sub(r"(<body[^>]*>)\s*", r"\1\n" + BANNER_DIV, html, count=1); did.append("banner")

    if not did:
        return "atlandi-zaten"
    if not DRY:
        open(path, "w", encoding="utf-8").write(html)
    return "eklendi: " + ", ".join(did)

def main():
    files = sorted(glob.glob("*.html"))
    counts = {}
    for f in files:
        if f in EXCLUDE:
            counts["haric"] = counts.get("haric", 0) + 1; continue
        r = migrate(f)
        key = r.split(":")[0]
        counts[key] = counts.get(key, 0) + 1
        if r.startswith("eklendi"):
            print(("[DRY] " if DRY else "") + f + "  ->  " + r)
    print("\nOzet:", counts)
    print("DRY, hicbir dosya degismedi." if DRY else "Bitti. 'git diff' ile gozden gecir, sonra commit et.")

if __name__ == "__main__":
    main()
