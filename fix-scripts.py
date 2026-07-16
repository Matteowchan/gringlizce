#!/usr/bin/env python3
"""
Gri English . cift script temizligi + alt klasor yol hatasi duzeltmesi.
  - Tekrar eden script'lerden (supabase CDN, site-config, nav, curriculum, track) birer tane birakir.
  - kelime.html gibi kendi esm.sh modulu olanlara DOKUNMAZ (sadece CDN formu deduplike edilir).
  - Alt klasorde assets/ olan yollari ../assets'e cevirir.
Idempotent, guvenli.  python3 fix-scripts.py --dry  /  python3 fix-scripts.py
"""
import os, re, sys
DRY = "--dry" in sys.argv
SKIP_DIRS = {"assets","files","icons","supabase",".git","node_modules"}

DEDUP = [
  r'<script src="https://cdn\.jsdelivr\.net/npm/@supabase/supabase-js@2"[^>]*></script>',
  r'<script src="[^"]*assets/nav\.js"></script>',
  r'<script src="[^"]*assets/curriculum\.js"></script>',
  r'<script src="[^"]*assets/track\.js"[^>]*></script>',
  r'<script src="[^"]*assets/site-config\.js"[^>]*></script>',
]

def dedup(h, rx):
    ms = list(re.finditer(rx, h))
    if len(ms) <= 1: return h, 0
    removed = 0
    for m in ms[1:][::-1]:
        start, end = m.start(), m.end()
        ls = h.rfind('\n', 0, start)
        seg = ls+1 if ls != -1 else start
        if h[seg:start].strip() == "": start = seg
        if end < len(h) and h[end] == '\n': end += 1
        h = h[:start] + h[end:]; removed += 1
    return h, removed

def process(path, depth):
    h = open(path, encoding="utf-8").read()
    orig = h; notes = []
    for rx in DEDUP:
        h, n = dedup(h, rx)
        if n: notes.append("dedup")
    # yol hatasi: alt klasorde assets/ -> ../assets/
    if depth > 0:
        pre = "../"*depth
        def repl(m): return 'src="' + pre + 'assets/' + m.group(1)
        h2 = re.sub(r'src="assets/((?:nav|curriculum|track|site-config)\.js)', repl, h)
        if h2 != h: h = h2; notes.append("yol")
    if h == orig: return "temiz"
    if not DRY: open(path,"w",encoding="utf-8").write(h)
    return "duzeltildi:" + ",".join(sorted(set(notes)))

def main():
    c={}
    for root,dirs,files in os.walk("."):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS and not d.startswith(".")]
        for fn in sorted(files):
            if not fn.endswith(".html"): continue
            p=os.path.join(root,fn); depth=os.path.relpath(p,".").count(os.sep)
            r=process(p,depth); k=r.split(":")[0]; c[k]=c.get(k,0)+1
            if r.startswith("duzeltildi"): print(("[DRY] " if DRY else "")+os.path.relpath(p,".")+"  "+r)
    print("\nOzet:",c)
    print("DRY." if DRY else "Bitti. git diff ile bak, commit et.")

if __name__=="__main__": main()
