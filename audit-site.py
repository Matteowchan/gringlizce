#!/usr/bin/env python3
"""
Gri English . site denetimi (SALT OKUNUR, hicbir sey degistirmez).
Yapisal hatalari tarar ve raporlar:
  - cift nav (eski site-header + yeni nav.js ayni sayfada)
  - cift banner div
  - cift script (nav/curriculum/track/site-config/supabase birden fazla)
  - alt klasor yol hatasi (assets/ yerine ../assets/ olmali)
  - eksik bagimlilik (nav var curriculum yok / track var supabase yok)
  - eksik </head> veya <body>
  - kirik ic linkler (var olmayan .html'e link)
Kullanim:  python3 audit-site.py
"""
import os, re
SKIP_DIRS = {"assets","files","icons","supabase",".git","node_modules"}

def all_html():
    out=[]
    for root,dirs,files in os.walk("."):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS and not d.startswith(".")]
        for fn in files:
            if fn.endswith(".html"): out.append(os.path.join(root,fn))
    return out

def cnt(h,pat): return len(re.findall(pat,h))

def main():
    files = all_html()
    existing = set(os.path.normpath(f) for f in files)
    issues = {}
    def add(kind, path, extra=""):
        issues.setdefault(kind,[]).append(os.path.relpath(path,".")+(("  "+extra) if extra else ""))

    broken_links = []
    for path in files:
        h = open(path, encoding="utf-8", errors="ignore").read()
        depth = os.path.relpath(path,".").count(os.sep)
        rel = os.path.relpath(path,".")

        if "</head>" not in h or "<body" not in h:
            add("EKSIK-YAPI (head/body yok)", path); continue

        if 'class="site-header"' in h and "nav.js" in h:
            add("CIFT-NAV (eski + yeni)", path)
        nb = cnt(h, r'class="launch-banner"')
        if nb>1: add("CIFT-BANNER", path, "("+str(nb)+")")
        for name,rx in [("nav.js",r'assets/nav\.js'),("curriculum.js",r'assets/curriculum\.js'),
                        ("track.js",r'assets/track\.js'),("site-config.js",r'assets/site-config\.js'),
                        ("supabase-js",r'supabase-js@2')]:
            c=cnt(h,rx)
            if c>1: add("CIFT-SCRIPT", path, name+" x"+str(c))
        # alt klasor yol hatasi: depth>0 iken assets/ (../ yok, / yok)
        if depth>0:
            if re.search(r'src="assets/(nav|curriculum|track|site-config)\.js', h):
                add("YOL-HATASI (../assets olmali)", path)
        # eksik bagimlilik
        if "assets/nav.js" in h and "assets/curriculum.js" not in h:
            add("BAGIMLILIK (nav var, curriculum yok)", path)
        if "assets/track.js" in h and "supabase-js" not in h:
            add("BAGIMLILIK (track var, supabase yok)", path)
        # kirik ic linkler
        for m in re.finditer(r'href="([^":#?]+\.html)(?:[#?][^"]*)?"', h):
            href=m.group(1)
            if href.startswith("http") or href.startswith("//"): continue
            tgt = os.path.normpath(os.path.join(os.path.dirname(path), href))
            if tgt not in existing:
                broken_links.append((rel, href))

    print("="*60)
    print("GRI ENGLISH . SITE DENETIM RAPORU")
    print("Toplam HTML:", len(files))
    print("="*60)
    if not issues and not broken_links:
        print("\nTemiz. Yapisal hata bulunamadi.")
    for kind in sorted(issues):
        print("\n["+kind+"]  ("+str(len(issues[kind]))+")")
        for x in issues[kind][:40]: print("   "+x)
        if len(issues[kind])>40: print("   ... +"+str(len(issues[kind])-40)+" daha")
    if broken_links:
        print("\n[KIRIK IC LINK]  ("+str(len(broken_links))+")")
        seen=set()
        for src,href in broken_links:
            key=(src,href)
            if key in seen: continue
            seen.add(key)
            if len(seen)<=50: print("   "+src+"  ->  "+href)
        if len(seen)>50: print("   ... +"+str(len(seen)-50)+" daha")
    print()

if __name__=="__main__": main()
