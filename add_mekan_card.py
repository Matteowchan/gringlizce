import re
path = 'kelime-bankasi.html'
with open(path, encoding='utf-8') as f:
    html = f.read()

html = html.replace(
    '<div><span class="s-num">16</span><span class="s-lbl">Kategori</span></div>',
    '<div><span class="s-num">17</span><span class="s-lbl">Kategori</span></div>'
)
html = html.replace(
    '<div><span class="s-num">1.600+</span><span class="s-lbl">Kelime</span></div>',
    '<div><span class="s-num">1.700+</span><span class="s-lbl">Kelime</span></div>'
)
print('[+] Hero: 16->17 Kategori, 1.600+ -> 1.700+ Kelime')

new_card = '''
        <a href="kelime.html?cat=mekan-ve-hareket" class="qb-hub-card cat-kb-mekan-ve-hareket" style="--cat-tint: #2a6b6b; --cat-tint-soft: rgba(42,107,107,0.10);">
          <span class="qb-hub-badge active">Hazır</span>
          <div class="qb-hub-mark">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>
          </div>
          <h3>Mekan ve Hareket</h3>
          <p class="qb-hub-desc">Konum, yön, uzaklık, hareket, taşıma, edatlar ve coğrafya. IELTS Task 1 ve coğrafya pasajları için temel.</p>
          <div class="qb-hub-meta">
            <div class="m-item"><span class="m-num">100</span><span class="m-lbl">Kelime</span></div>
            <div class="m-item"><span class="m-num">IELTS</span><span class="m-lbl">Hedef</span></div>
            <div class="m-item"><span class="m-num">YDS</span><span class="m-lbl">Hedef</span></div>
          </div>
          <span class="qb-hub-cta">Çalışmaya Başla &rsaquo;</span>
        </a>
'''

pat = re.compile(r'(class="qb-hub-card cat-kb-iletisim-ve-dil".*?</a>)', re.DOTALL)
m = pat.search(html)
if m and 'cat-kb-mekan-ve-hareket' not in html:
    html = html[:m.end()] + new_card + html[m.end():]
    print('[+] Mekan ve Hareket card eklendi')
elif 'cat-kb-mekan-ve-hareket' in html:
    print('[=] Card zaten mevcut')

with open(path, 'w', encoding='utf-8') as f:
    f.write(html)
