import re
path = 'kelime-bankasi.html'
with open(path, encoding='utf-8') as f:
    html = f.read()

html = html.replace(
    '<div><span class="s-num">15</span><span class="s-lbl">Kategori</span></div>',
    '<div><span class="s-num">16</span><span class="s-lbl">Kategori</span></div>'
)
html = html.replace(
    '<div><span class="s-num">1.500+</span><span class="s-lbl">Kelime</span></div>',
    '<div><span class="s-num">1.600+</span><span class="s-lbl">Kelime</span></div>'
)
print('[+] Hero: 15->16 Kategori, 1.500+ -> 1.600+ Kelime')

new_card = '''
        <a href="kelime.html?cat=iletisim-ve-dil" class="qb-hub-card cat-kb-iletisim-ve-dil" style="--cat-tint: #3a8aa8; --cat-tint-soft: rgba(58,138,168,0.10);">
          <span class="qb-hub-badge active">Hazır</span>
          <div class="qb-hub-mark">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 9a2 2 0 0 1-2 2H6l-4 4V4c0-1.1.9-2 2-2h8a2 2 0 0 1 2 2z"/><path d="M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1"/></svg>
          </div>
          <h3>İletişim ve Dil</h3>
          <p class="qb-hub-desc">Hitap, retorik, yazılı iletişim, dil özellikleri, medya ve tartışma. IB English B, YDT ve SAT için temel.</p>
          <div class="qb-hub-meta">
            <div class="m-item"><span class="m-num">100</span><span class="m-lbl">Kelime</span></div>
            <div class="m-item"><span class="m-num">SAT</span><span class="m-lbl">Hedef</span></div>
            <div class="m-item"><span class="m-num">YDT</span><span class="m-lbl">Hedef</span></div>
          </div>
          <span class="qb-hub-cta">Çalışmaya Başla &rsaquo;</span>
        </a>
'''

pat = re.compile(r'(class="qb-hub-card cat-kb-insan-ve-davranis".*?</a>)', re.DOTALL)
m = pat.search(html)
if m and 'cat-kb-iletisim-ve-dil' not in html:
    html = html[:m.end()] + new_card + html[m.end():]
    print('[+] Iletisim ve Dil card eklendi')
elif 'cat-kb-iletisim-ve-dil' in html:
    print('[=] Card zaten mevcut')

with open(path, 'w', encoding='utf-8') as f:
    f.write(html)
