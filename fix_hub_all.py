import re

path = 'kelime-bankasi.html'
with open(path, encoding='utf-8') as f:
    html = f.read()

# 200'e cikarilan 9 kategori
to_200 = [
    'argumantasyon-ve-elestiri',
    'analiz-ve-cikarim',
    'sebep-etki-onleme',
    'degisim-ve-donusum',
    'miktar-ve-derece',
    'akademik-tutum',
    'toplum-ve-yapi',
    'dusunce-ve-yargi',
    'karsitlik-ve-uyum',
]

# Toplam: 9*200 + 11*100 = 2.900
hero_pat = re.compile(r'(<div><span class="s-num">)[\d.]+\+(</span><span class="s-lbl">Kelime</span></div>)')
html, n = hero_pat.subn(r'\g<1>2.900+\g<2>', html)
print(f'Hero -> 2.900+ ({n} match)')

for slug in to_200:
    pat = re.compile(
        r'(class="qb-hub-card cat-kb-' + re.escape(slug) + r'".*?<span class="m-num">)\d+(</span><span class="m-lbl">Kelime</span>)',
        re.DOTALL
    )
    html, n = pat.subn(r'\g<1>200\g<2>', html)
    print(f'  {slug}: {"OK" if n else "BULUNAMADI"}')

with open(path, 'w', encoding='utf-8') as f:
    f.write(html)
print('Bitti.')
