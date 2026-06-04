import re
path = 'kelime-bankasi.html'
with open(path, encoding='utf-8') as f:
    html = f.read()

html = html.replace(
    '<div><span class="s-num">2.500+</span><span class="s-lbl">Kelime</span></div>',
    '<div><span class="s-num">2.600+</span><span class="s-lbl">Kelime</span></div>'
)
print('[+] Hero: 2.500+ -> 2.600+ Kelime')

pat = re.compile(
    r'(class="qb-hub-card cat-kb-akademik-tutum".*?<span class="m-num">)100(</span><span class="m-lbl">Kelime</span>)',
    re.DOTALL
)
new_html, n = pat.subn(r'\g<1>200\g<2>', html)
if n:
    html = new_html
    print(f'[+] Akademik card: 100 -> 200')
else:
    print('[!] Card etiketi bulunamadi')

with open(path, 'w', encoding='utf-8') as f:
    f.write(html)
