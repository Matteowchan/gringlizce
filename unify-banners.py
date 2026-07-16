#!/usr/bin/env python3
"""
Gri English . elle yazilmis launch-banner'lari admin sistemine cevir (kok + alt klasor).
  <div class="launch-banner">Sabit metin</div>  ->  <div class="launch-banner" data-site-banner></div>
Boylece admin'den yonetilen tek duyuru her sayfada gorunur.
site-config.js yoksa ekler (banner'i o doldurur). Idempotent.
  python3 unify-banners.py --dry   /   python3 unify-banners.py
"""
import os, re, sys
DRY = "--dry" in sys.argv
SKIP_DIRS = {"assets","files","icons","supabase",".git","node_modules"}
EXCLUDE = {
  "giris.html","sifre-sifirla.html","kayit.html","admin.html","admin-writing-review.html",
  "sat-mock-1.html","full-test-1.html","full-test-2.html","full-test-3.html","full-test-4.html",
  "full-test-5.html","full-test-bundle.html","ielts-deneme.html","ielts-deneme-listening.html",
  "ielts-deneme-reading.html","ielts-deneme-writing.html","udsp-deneme-1.html","udsp-deneme-2.html",
  "udsp-deneme-3.html","yds-mini-deneme-1.html","yds-mini-deneme-2.html","yds-mini-deneme-3.html",
  "vocab-quiz.html","sat-full-deneme-1.html","sat-full-deneme-1-sinav.html",
}
SUPA = '<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>'
# Sabit banner: class="launch-banner"> hemen ardindan icerik, data-site-banner DEGIL
HARD = re.compile(r'<div class="launch-banner">.*?</div>', re.S)

def process(path, depth):
    h = open(path, encoding="utf-8").read()
    if not HARD.search(h):
        return "yok"
    did = []
    h2 = HARD.sub('<div class="launch-banner" data-site-banner></div>', h)
    if h2 != h:
        h = h2; did.append("banner")
    # site-config yoksa ekle ki banner dolsun
    if "site-config.js" not in h and "</head>" in h:
        pre = "../"*depth
        supa = "" if "supabase-js" in h else "  " + SUPA + "\n"
        h = h.replace("</head>", supa + '  <script src="%sassets/site-config.js" defer></script>\n' % pre + "</head>", 1)
        did.append("site-config")
    if not did:
        return "zaten"
    if not DRY:
        open(path,"w",encoding="utf-8").write(h)
    return "cevrildi: " + ",".join(did)

def main():
    c={}
    for root,dirs,files in os.walk("."):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS and not d.startswith(".")]
        for fn in sorted(files):
            if not fn.endswith(".html"): continue
            if fn in EXCLUDE: c["haric"]=c.get("haric",0)+1; continue
            p=os.path.join(root,fn); depth=os.path.relpath(p,".").count(os.sep)
            r=process(p,depth); key=r.split(":")[0]; c[key]=c.get(key,0)+1
            if r.startswith("cevrildi"): print(("[DRY] " if DRY else "")+os.path.relpath(p,".")+"  ->  "+r)
    print("\nOzet:",c)
    print("DRY." if DRY else "Bitti. git diff ile bak, commit et.")

if __name__=="__main__": main()
