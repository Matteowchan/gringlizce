import re
path = 'kelime-bankasi.html'
with open(path, encoding='utf-8') as f:
    html = f.read()

# Hero: 11 -> 12 Kategori, 1.000+ -> 1.100+ Kelime
html = html.replace(
    '<div><span class="s-num">11</span><span class="s-lbl">Kategori</span></div>',
    '<div><span class="s-num">12</span><span class="s-lbl">Kategori</span></div>'
)
html = html.replace(
    '<div><span class="s-num">1.000+</span><span class="s-lbl">Kelime</span></div>',
    '<div><span class="s-num">1.100+</span><span class="s-lbl">Kelime</span></div>'
)
print('[+] Hero: 11->12 Kategori, 1.000+ -> 1.100+ Kelime')

new_card = '''
        <a href="kelime.html?cat=sanat-ve-edebiyat" class="qb-hub-card cat-kb-sanat-ve-edebiyat" style="--cat-tint: #b85070; --cat-tint-soft: rgba(184,80,112,0.10);">
          <span class="qb-hub-badge active">Hazır</span>
          <div class="qb-hub-mark">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
          </div>
          <h3>Sanat ve Edebiyat</h3>
          <p class="qb-hub-desc">Edebi türler, anlatım sanatları, sanat akımları, estetik kavramlar, eleştiri ve kültürel miras. SAT, IELTS ve IB pasajları için temel.</p>
          <div class="qb-hub-meta">
            <div class="m-item"><span class="m-num">100</span><span class="m-lbl">Kelime</span></div>
            <div class="m-item"><span class="m-num">SAT</span><span class="m-lbl">Hedef</span></div>
            <div class="m-item"><span class="m-num">IELTS</span><span class="m-lbl">Hedef</span></div>
          </div>
          <span class="qb-hub-cta">Çalışmaya Başla &rsaquo;</span>
        </a>
'''

# Bilim ve Doga card'inin kapanisindan sonra ekle (yoksa karsitlik sonrasi)
pat = re.compile(r'(class="qb-hub-card cat-kb-bilim-ve-doga".*?</a>)', re.DOTALL)
m = pat.search(html)
if m and 'cat-kb-sanat-ve-edebiyat' not in html:
    html = html[:m.end()] + new_card + html[m.end():]
    print('[+] Sanat ve Edebiyat card eklendi')
elif 'cat-kb-sanat-ve-edebiyat' in html:
    print('[=] Card zaten mevcut')
else:
    # Bilim ve Doga yoksa karsitlik sonrasi dene
    pat2 = re.compile(r'(class="qb-hub-card cat-kb-karsitlik-ve-uyum".*?</a>)', re.DOTALL)
    m2 = pat2.search(html)
    if m2:
        html = html[:m2.end()] + new_card + html[m2.end():]
        print('[+] Sanat ve Edebiyat card eklendi (Karsitlik sonrasi - Bilim yokmus)')

with open(path, 'w', encoding='utf-8') as f:
    f.write(html)
