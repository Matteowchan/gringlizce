#!/usr/bin/env python3
# Build a supplementary TR->EN dictionary (window.__MTMAP merge) for JS-#data content pages.
# Extracts Turkish strings from each page's #data JSON blob + its .seo-intro section,
# translates them via the site's /functions/v1/translate edge fn (batched), and writes
# assets/gri-i18n-extra.js. Idempotent-ish: re-run appends new pages; existing keys reused.
import json, re, sys, time, urllib.request, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EP = "https://vazbvbqgvtlaqkytfsbi.supabase.co/functions/v1/translate"
AK = "sb_publishable_F5K-wIVQHXlD4e4GYnySNw_Xm4teO9g"
OUT = os.path.join(ROOT, "assets", "gri-i18n-extra.js")

# pages to process passed as argv (basenames without .html); default = IELTS content pages
DEFAULT = ["ielts-ogren-reading","ielts-ogren-listening","ielts-ogren-speaking",
           "ielts-writing-task1","ielts-writing-task2","ielts-gramer","ielts-kelime","ielts-spelling"]
PAGES = sys.argv[1:] or DEFAULT

TR_CHARS = re.compile(r"[ğışöüçĞİÖŞÜÇ]")
TR_WORDS = re.compile(r"\b(ve|bir|bu|için|ile|olarak|daha|çok|ama|gibi|sonra|önce|kadar|soru|cevap|konu|puan|beceri|yaz|oku|hangi|ile|değil|olan|nasıl)\b", re.I)
def is_tr(s):
    return bool(TR_CHARS.search(s) or TR_WORDS.search(s))
def ok(s):
    s2 = re.sub(r"\s+", " ", s).strip()
    if len(s2) < 2 or len(s2) > 3000: return False
    if not re.search(r"[A-Za-zğışöüçĞİÖŞÜÇ]", s2): return False
    if re.fullmatch(r"[0-9\s.,:;/%+\-()]+", s2): return False
    return True
def key_of(s):
    return re.sub(r"\s+", " ", s).strip()

def collect_from_json(obj, out):
    if obj is None: return
    if isinstance(obj, str):
        s = obj.strip()
        if s and ok(s) and is_tr(s): out.add(key_of(s))
    elif isinstance(obj, list):
        for x in obj: collect_from_json(x, out)
    elif isinstance(obj, dict):
        for v in obj.values(): collect_from_json(v, out)

def strip_tags(html):
    html = re.sub(r"<(script|style)[\s\S]*?</\1>", " ", html, flags=re.I)
    parts = re.split(r"<[^>]+>", html)
    return parts

def extract_page(base):
    path = os.path.join(ROOT, base + ".html")
    if not os.path.exists(path):
        print(f"  ! {base}.html not found", flush=True); return set()
    html = open(path, encoding="utf-8").read()
    keys = set()
    # #data JSON blob
    m = re.search(r'<script[^>]*id="data"[^>]*>([\s\S]*?)</script>', html)
    if m:
        raw = m.group(1).strip()
        try:
            data = json.loads(raw)
            collect_from_json(data, keys)
        except Exception as e:
            print(f"  ! {base}: #data JSON parse failed: {e}", flush=True)
    # .seo-intro visible content
    sm = re.search(r'<section class="seo-intro"[\s\S]*?</section>', html)
    if sm:
        for piece in strip_tags(sm.group(0)):
            t = re.sub(r"\s+", " ", piece).strip()
            # unescape a few common entities
            t = t.replace("&amp;","&").replace("&rsquo;","'").replace("&nbsp;"," ").replace("&#39;","'")
            if t and ok(t) and is_tr(t): keys.add(key_of(t))
    return keys

def translate_batch(texts):
    body = json.dumps({"texts": texts}).encode("utf-8")
    req = urllib.request.Request(EP, data=body, method="POST", headers={
        "Content-Type": "application/json", "apikey": AK, "Authorization": "Bearer " + AK})
    with urllib.request.urlopen(req, timeout=120) as r:
        d = json.loads(r.read().decode("utf-8"))
    return (d or {}).get("translations", {}) or {}

def load_existing():
    if not os.path.exists(OUT): return {}
    txt = open(OUT, encoding="utf-8").read()
    m = re.search(r"__MTMAP\|\|\{\},\s*(\{[\s\S]*\})\s*\);", txt)
    if not m: return {}
    try: return json.loads(m.group(1))
    except Exception: return {}

def main():
    existing = load_existing()
    print(f"existing dict keys: {len(existing)}", flush=True)
    all_keys = set()
    for base in PAGES:
        ks = extract_page(base)
        print(f"  {base}: {len(ks)} TR strings", flush=True)
        all_keys |= ks
    todo = sorted(k for k in all_keys if k not in existing)
    print(f"total unique TR: {len(all_keys)}, new to translate: {len(todo)}", flush=True)
    result = dict(existing)
    B = 60
    for i in range(0, len(todo), B):
        chunk = todo[i:i+B]
        try:
            tr = translate_batch(chunk)
        except Exception as e:
            print(f"  ! batch {i//B} failed: {e}", flush=True); time.sleep(3); continue
        got = 0
        for k in chunk:
            en = tr.get(k)
            if en and en != k:
                result[k] = en; got += 1
        print(f"  batch {i//B+1}/{(len(todo)+B-1)//B}: {got}/{len(chunk)} translated", flush=True)
        time.sleep(0.6)
    # write file (sorted for stable diffs)
    ordered = {k: result[k] for k in sorted(result)}
    js = ("/* gri-i18n-extra.js — ek TR->EN sözlük (JS-#data içerik sayfaları için).\n"
          "   build_i18n_extra.py ile üretilir; window.__MTMAP'e merge olur. Elle düzenleme. */\n"
          "window.__MTMAP = Object.assign(window.__MTMAP || {}, " +
          json.dumps(ordered, ensure_ascii=False, separators=(",", ":")) + ");\n")
    open(OUT, "w", encoding="utf-8").write(js)
    print(f"WROTE {OUT} with {len(ordered)} keys ({len(ordered)-len(existing)} new)", flush=True)

if __name__ == "__main__":
    main()
