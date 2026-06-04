import re

CATEGORIES = {
    "cat-kb-argumantasyon":      {"slug": "argumantasyon-ve-elestiri", "h1": "SAT", "h2": "IELTS"},
    "cat-kb-analiz-ve-cikarim":  {"slug": "analiz-ve-cikarim",         "h1": "SAT", "h2": "TOEFL"},
    "cat-kb-sebep-etki":         {"slug": "sebep-etki-onleme",         "h1": "SAT", "h2": "TOEFL"},
    "cat-kb-degisim-ve-donusum": {"slug": "degisim-ve-donusum",        "h1": "SAT", "h2": "TOEFL"},
    "cat-kb-miktar-ve-derece":   {"slug": "miktar-ve-derece",          "h1": "SAT", "h2": "IELTS"},
    "cat-kb-akademik-tutum":     {"slug": "akademik-tutum",            "h1": "SAT", "h2": "TOEFL"},
    "cat-kb-toplum-ve-yapi":     {"slug": "toplum-ve-yapi",            "h1": "SAT", "h2": "IELTS"},
    "cat-kb-dusunce-ve-yargi":   {"slug": "dusunce-ve-yargi",          "h1": "SAT", "h2": "TOEFL"},
    "cat-kb-karsitlik-ve-uyum":  {"slug": "karsitlik-ve-uyum",         "h1": "SAT", "h2": "TOEFL"},
}

with open('kelime-bankasi.html', encoding='utf-8') as f:
    html = f.read()

activated = 0
skipped = 0

for class_name, cfg in CATEGORIES.items():
    old_a = f'<a href="#" class="qb-hub-card {class_name}"'
    if old_a not in html:
        skipped += 1
        print(f'[=] {class_name} zaten aktif')
        continue
    
    html = html.replace(old_a, f'<a href="kelime.html?cat={cfg["slug"]}" class="qb-hub-card {class_name}"')
    
    pat = re.compile(r'(class="qb-hub-card ' + re.escape(class_name) + r'"[^>]*?) style="opacity:0\.55;pointer-events:none;"')
    html = pat.sub(r'\1', html)
    
    badge_pat = re.compile(
        r'(class="qb-hub-card ' + re.escape(class_name) + r'".*?)<span class="qb-hub-badge">Yakında</span>',
        re.DOTALL
    )
    html = badge_pat.sub(r'\1<span class="qb-hub-badge active">Hazır</span>', html, count=1)
    
    cta_pat = re.compile(
        r'(class="qb-hub-card ' + re.escape(class_name) + r'".*?)<span class="qb-hub-cta">Hazırlanıyor</span>',
        re.DOTALL
    )
    new_cta = (
        '<div class="qb-hub-meta">\n'
        '            <div class="m-item"><span class="m-num">100</span><span class="m-lbl">Kelime</span></div>\n'
        f'            <div class="m-item"><span class="m-num">{cfg["h1"]}</span><span class="m-lbl">Hedef</span></div>\n'
        f'            <div class="m-item"><span class="m-num">{cfg["h2"]}</span><span class="m-lbl">Hedef</span></div>\n'
        '          </div>\n'
        '          <span class="qb-hub-cta">Çalışmaya Başla &rsaquo;</span>'
    )
    html = cta_pat.sub(r'\1' + new_cta, html, count=1)
    
    activated += 1
    print(f'[+] {class_name} aktive')

# Zaman ve Süreklilik: 20 -> 100
zaman_pat = re.compile(
    r'(class="qb-hub-card cat-kb-zaman-ve-sureklilik".*?)<div class="m-item"><span class="m-num">20</span>',
    re.DOTALL
)
new_html, n = zaman_pat.subn(r'\1<div class="m-item"><span class="m-num">100</span>', html, count=1)
if n:
    html = new_html
    print('[+] Zaman ve Sureklilik: 20 -> 100')
else:
    print('[=] Zaman zaten 100')

with open('kelime-bankasi.html', 'w', encoding='utf-8') as f:
    f.write(html)

print(f'\nOzet: {activated} aktive, {skipped} zaten aktif')
