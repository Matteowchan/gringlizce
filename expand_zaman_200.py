import re
path = 'kelime-bankasi.html'
with open(path, encoding='utf-8') as f:
    html = f.read()

html = html.replace(
    '<div><span class="s-num">2.900+</span><span class="s-lbl">Kelime</span></div>',
    '<div><span class="s-num">3.000+</span><span class="s-lbl">Kelime</span></div>'
)
print('[+] Hero: 2.900+ -> 3.000+ Kelime')

pat = re.compile(
    r'(class="qb-hub-card cat-kb-zaman-ve-sureklilik".*?<span class="m-num">)100(</span><span class="m-lbl">Kelime</span>)',
    re.DOTALL
)
new_html, n = pat.subn(r'\g<1>200\g<2>', html)
if n:
    html = new_html
    print(f'[+] Zaman card: 100 -> 200')
else:
    print('[!] Card etiketi bulunamadi')

with open(path, 'w', encoding='utf-8') as f:
    f.write(html)
