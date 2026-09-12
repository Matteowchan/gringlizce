#!/usr/bin/env python3
# Make .ka-sec konu-anlatimi guide pages TR/EN bilingual using the site's translate edge fn.
# Deterministic + idempotent. Wraps each <section class="ka-sec" id=X> inner and the hero
# editorial blocks (ka-trnote, ka-summary, ka-band, ka-qr) in data-blog-lang tr/en pairs,
# injects the toggle CSS + blog-i18n.js. Translation preserves HTML (gpt via edge fn).
#
# Usage: python scripts/konu_bilingual.py --dry PAGE.html        (report blocks, no write)
#        python scripts/konu_bilingual.py --apply PAGE.html ...  (convert in place)
import re, sys, json, time, urllib.request

EP = "https://vazbvbqgvtlaqkytfsbi.supabase.co/functions/v1/translate"
AK = "sb_publishable_F5K-wIVQHXlD4e4GYnySNw_Xm4teO9g"
MAXLEN = 2900  # edge fn drops texts > 3000

TOGGLE_STYLE = ('<style>.ka-hero{position:relative}.blog-lang-toggle{position:absolute;top:0;right:0;display:inline-flex;'
  'gap:2px;border:1px solid var(--gri-line,rgba(0,0,0,.15));border-radius:999px;padding:2px;background:var(--bg-card,#fff);'
  'z-index:2}.blog-lang-toggle button{font:700 .72rem/1 var(--font-ui,Inter),sans-serif;letter-spacing:.03em;border:0;'
  'background:transparent;color:var(--text-muted,#7a7168);padding:.3rem .62rem;border-radius:999px;cursor:pointer}'
  '.blog-lang-toggle button[aria-pressed="true"]{background:var(--teal,#2C5856);color:#fff}'
  '[data-blog-lang][hidden]{display:none!important}@media(max-width:600px){.blog-lang-toggle{position:static;'
  'margin:.2rem 0 .4rem;align-self:flex-start}}</style>')
TOGGLE_SCRIPT = '<script src="assets/blog-i18n.js?v=5" defer></script>'

def find_close(html, tag, open_start):
    """Return index just past the matching close tag for the element whose opening '<tag' starts at open_start."""
    # find end of opening tag
    i = html.find('>', open_start) + 1
    depth = 1
    pat = re.compile(r'<(/?)' + tag + r'(?:\s|>|/)', re.I)
    while depth > 0:
        m = pat.search(html, i)
        if not m:
            return -1
        if m.group(1) == '/':
            depth -= 1
            i = html.find('>', m.end() - 1) + 1
        else:
            # self-closing?
            gt = html.find('>', m.start())
            if gt != -1 and html[gt-1] == '/':
                i = gt + 1
            else:
                depth += 1
                i = gt + 1
    return i

def collect_blocks(html):
    """Return list of dicts {span:(a,b), inner:(ia,ib), kind, id?} for translatable regions, in order."""
    blocks = []
    # sections: inner is between > and </section>
    for m in re.finditer(r'<section class="ka-sec" id="([^"]+)">', html):
        a = m.start()
        b = find_close(html, 'section', a)
        if b == -1:
            continue
        ia = m.end()
        ib = html.rfind('</section>', ia, b)
        blocks.append({'kind': 'section', 'id': m.group(1), 'span': (a, b), 'inner': (ia, ib)})
    # hero simple <p class="ka-trnote"> / ka-summary  (no nested block tags)
    for cls in ('ka-trnote', 'ka-summary'):
        for m in re.finditer(r'<p class="' + cls + r'"[^>]*>(.*?)</p>', html, re.S):
            blocks.append({'kind': cls, 'span': (m.start(), m.end()), 'inner': (m.start(1), m.end(1))})
    # hero ka-band (div) and ka-qr (details) — balanced
    for tag, cls in (('div', 'ka-band'), ('details', 'ka-qr')):
        for m in re.finditer(r'<' + tag + r' class="' + cls + r'"', html):
            a = m.start()
            b = find_close(html, tag, a)
            if b == -1:
                continue
            ia = html.find('>', a) + 1
            ib = html.rfind('</' + tag + '>', ia, b)
            blocks.append({'kind': cls, 'span': (a, b), 'inner': (ia, ib)})
    # sort by span start; drop overlaps (keep first)
    blocks.sort(key=lambda d: d['span'][0])
    out, last = [], -1
    for bl in blocks:
        if bl['span'][0] >= last:
            out.append(bl); last = bl['span'][1]
    return out

def chunk_html(s):
    """Split an HTML fragment into <=MAXLEN pieces on tag seams, preserving order/content."""
    if len(s) <= MAXLEN:
        return [s]
    pieces, cur = [], ''
    # split on '><' seams but keep them
    parts = re.split(r'(?<=>)(?=<)', s)
    for p in parts:
        if len(cur) + len(p) > MAXLEN and cur:
            pieces.append(cur); cur = ''
        if len(p) > MAXLEN:
            # hard split
            for i in range(0, len(p), MAXLEN):
                pieces.append(p[i:i+MAXLEN])
        else:
            cur += p
    if cur:
        pieces.append(cur)
    return pieces

def translate_map(texts):
    """texts: list of unique strings -> dict tr->en via edge fn (batched)."""
    uniq = [t for t in dict.fromkeys(texts) if t.strip()]
    res = {}
    B = 40
    for i in range(0, len(uniq), B):
        chunk = uniq[i:i+B]
        body = json.dumps({"texts": chunk}).encode('utf-8')
        req = urllib.request.Request(EP, data=body, method="POST", headers={
            "Content-Type": "application/json", "apikey": AK, "Authorization": "Bearer " + AK})
        for attempt in range(3):
            try:
                d = json.loads(urllib.request.urlopen(req, timeout=180).read().decode('utf-8'))
                res.update((d.get("translations") or {}))
                break
            except Exception as e:
                if attempt == 2:
                    print("  ! batch fail:", str(e)[:100], flush=True)
                else:
                    time.sleep(3)
        time.sleep(0.4)
    return res

def translate_fragment(frag, tmap):
    return ''.join(tmap.get(p, p) for p in chunk_html(frag))

def process(path, apply):
    html = open(path, encoding='utf-8').read()
    if 'data-blog-lang="en"' in html:
        print(f"SKIP (already bilingual): {path}", flush=True)
        return None
    blocks = collect_blocks(html)
    if not blocks:
        print(f"SKIP (no blocks): {path}", flush=True)
        return None
    # gather all chunk-strings needing translation
    all_chunks = []
    for bl in blocks:
        ia, ib = bl['inner']
        all_chunks += chunk_html(html[ia:ib])
    kinds = {}
    for bl in blocks:
        kinds[bl['kind']] = kinds.get(bl['kind'], 0) + 1
    print(f"{path}: {len(blocks)} blocks {kinds}, {len(set(all_chunks))} uniq chunks", flush=True)
    if not apply:
        return None
    tmap = translate_map(all_chunks)
    # rebuild from end to start so spans stay valid
    new = html
    for bl in sorted(blocks, key=lambda d: d['span'][0], reverse=True):
        a, b = bl['span']
        ia, ib = bl['inner']
        tr_inner = html[ia:ib]
        en_inner = translate_fragment(tr_inner, tmap)
        if bl['kind'] == 'section':
            open_tag = html[a:ia]  # '<section ... >'
            rebuilt = (open_tag + '<div data-blog-lang="tr">' + tr_inner + '</div>'
                       + '<div data-blog-lang="en" hidden lang="en">' + en_inner + '</div></section>')
        else:
            # wrap the whole element: original as tr (add attr), plus en sibling clone
            orig = html[a:b]
            # inject data-blog-lang="tr" into the element's opening tag
            gt = orig.find('>')
            tr_el = orig[:gt] + ' data-blog-lang="tr"' + orig[gt:]
            # en clone: same open tag with en attrs, translated inner
            open_tag = html[a:ia]
            close = orig[orig.rfind('</'):]
            en_open = open_tag[:open_tag.find('>')] + ' data-blog-lang="en" hidden lang="en"' + '>'
            en_el = en_open + en_inner + close
            rebuilt = tr_el + en_el
        new = new[:a] + rebuilt + new[b:]
    # inject assets before </head>
    if '[data-blog-lang][hidden]' not in new:
        new = new.replace('</head>', TOGGLE_STYLE + '\n' + TOGGLE_SCRIPT + '\n</head>', 1)
    elif 'blog-i18n.js' not in new:
        new = new.replace('</head>', TOGGLE_SCRIPT + '\n</head>', 1)
    # verify counts
    ntr = new.count('data-blog-lang="tr"')
    nen = new.count('data-blog-lang="en"')
    if ntr != nen or nen != len(blocks):
        print(f"  !! COUNT MISMATCH tr={ntr} en={nen} blocks={len(blocks)} -> NOT WRITING {path}", flush=True)
        return False
    open(path, 'w', encoding='utf-8').write(new)
    print(f"  OK wrote {path}: {len(blocks)} blocks bilingual (tr={ntr} en={nen})", flush=True)
    return True

def main():
    args = sys.argv[1:]
    apply = '--apply' in args
    dry = '--dry' in args
    pages = [a for a in args if not a.startswith('--')]
    ok = 0
    for p in pages:
        r = process(p, apply and not dry)
        if r:
            ok += 1
    print(f"DONE: {ok}/{len(pages)} converted", flush=True)

if __name__ == '__main__':
    main()
