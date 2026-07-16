#!/usr/bin/env python3
"""
Gri English . sinav/deneme sayfalarindan nav'i geri cikar (kok + urun/).
Cikarilan: curriculum.js, nav.js, track.js script satirlari + launch-banner div + banner stili.
Dokunulmayan: site-config.js, supabase (fiyat gosterimi ve zararsiz).
Idempotent, guvenli.  python3 clean-exams.py --dry  /  python3 clean-exams.py
"""
import os, re, sys, glob
DRY = "--dry" in sys.argv

# nav'i olmayacak sinav/deneme sayfalari (dosya adi)
TARGETS = {
  "sat-mock-1.html","full-test-1.html","full-test-2.html","full-test-3.html",
  "full-test-4.html","full-test-5.html","full-test-bundle.html",
  "ielts-deneme.html","ielts-deneme-listening.html","ielts-deneme-reading.html","ielts-deneme-writing.html",
  "udsp-deneme-1.html","udsp-deneme-2.html","udsp-deneme-3.html",
  "yds-mini-deneme-1.html","yds-mini-deneme-2.html","yds-mini-deneme-3.html",
  "vocab-quiz.html","sat-full-deneme-1.html","sat-full-deneme-1-sinav.html",
}
DIRS = [".", "urun"]

PATS = [
  r'[ \t]*<script src="[^"]*assets/curriculum\.js"></script>\n',
  r'[ \t]*<script src="[^"]*assets/nav\.js"></script>\n',
  r'[ \t]*<script src="[^"]*assets/track\.js"[^>]*></script>\n',
  r'[ \t]*<div class="launch-banner" data-site-banner></div>\n',
  r'[ \t]*<style>\.launch-banner\{[^<]*</style>\n',
]

def clean(path):
    h = open(path, encoding="utf-8").read()
    orig = h
    for p in PATS:
        h = re.sub(p, "", h)
    if h == orig:
        return "temiz-zaten"
    if not DRY:
        open(path, "w", encoding="utf-8").write(h)
    return "temizlendi"

def main():
    c = {}
    for d in DIRS:
        for path in sorted(glob.glob(os.path.join(d, "*.html"))):
            if os.path.basename(path) in TARGETS:
                r = clean(path); c[r] = c.get(r, 0) + 1
                if r == "temizlendi": print(("[DRY] " if DRY else "") + path)
    print("\nOzet:", c)
    print("DRY." if DRY else "Bitti. git diff ile bak, commit et.")

if __name__ == "__main__": main()
