#!/usr/bin/env python3
"""
Gri English . track.js'i TUM sayfalara ekle (kok + alt klasor, idempotent).
Her sayfaya, eksikse: supabase-js (yoksa) + assets/track.js (dogru derinlikte).
EXCLUDE/SKIP_DIRS'e dokunmaz. Iki kez calistirilabilir.
  python3 add-track.py --dry
  python3 add-track.py
"""
import os, re, sys
DRY = "--dry" in sys.argv
SKIP_DIRS = {"assets","files","icons","supabase",".git","node_modules"}
EXCLUDE = {"giris.html","sifre-sifirla.html","kayit.html","admin.html","admin-writing-review.html"}
SUPA = '<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>'

def process(path, depth):
    html = open(path, encoding="utf-8").read()
    if "</head>" not in html: return "yapiyok"
    if "assets/track.js" in html: return "zaten"
    pre = "../"*depth
    add = ""
    if "supabase-js" not in html:
        add += "  " + SUPA + "\n"
    add += '  <script src="%sassets/track.js" defer></script>\n' % pre
    html = html.replace("</head>", add + "</head>", 1)
    if not DRY: open(path,"w",encoding="utf-8").write(html)
    return "eklendi"

def main():
    c={}
    for root,dirs,files in os.walk("."):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS and not d.startswith(".")]
        for fn in sorted(files):
            if not fn.endswith(".html"): continue
            if fn in EXCLUDE: c["haric"]=c.get("haric",0)+1; continue
            p=os.path.join(root,fn); depth=os.path.relpath(p,".").count(os.sep)
            r=process(p,depth); c[r]=c.get(r,0)+1
            if r=="eklendi": print(("[DRY] " if DRY else "")+os.path.relpath(p,"."))
    print("\nOzet:",c)
    print("DRY." if DRY else "Bitti. git diff ile bak, commit et.")

if __name__=="__main__": main()
