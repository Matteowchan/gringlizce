import re
path = 'kelime-bankasi.html'
with open(path, encoding='utf-8') as f:
    html = f.read()

html = html.replace(
    '<div><span class="s-num">17</span><span class="s-lbl">Kategori</span></div>',
    '<div><span class="s-num">18</span><span class="s-lbl">Kategori</span></div>'
)
html = html.replace(
    '<div><span class="s-num">1.700+</span><span class="s-lbl">Kelime</span></div>',
    '<div><span class="s-num">1.800+</span><span class="s-lbl">Kelime</span></div>'
)
print('[+] Hero: 17->18 Kategori, 1.700+ -> 1.800+ Kelime')

new_card = '''
        <a href="kelime.html?cat=saglik-ve-tip" class="qb-hub-card cat-kb-saglik-ve-tip" style="--cat-tint: #4aa890; --cat-tint-soft: rgba(74,168,144,0.10);">
          <span class="qb-hub-badge active">Hazır</span>
          <div class="qb-hub-mark">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/><path d="M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27"/></svg>
          </div>
          <h3>Sağlık ve Tıp</h3>
          <p class="qb-hub-desc">Hastalık, semptom, tıp alanları, tedavi, anatomi, önleme, epidemiyoloji ve sağlık sistemi. SAT ve TOEFL bilim pasajları için.</p>
          <div class="qb-hub-meta">
            <div class="m-item"><span class="m-num">100</span><span class="m-lbl">Kelime</span></div>
            <div class="m-item"><span class="m-num">SAT</span><span class="m-lbl">Hedef</span></div>
            <div class="m-item"><span class="m-num">TOEFL</span><span class="m-lbl">Hedef</span></div>
          </div>
          <span class="qb-hub-cta">Çalışmaya Başla &rsaquo;</span>
        </a>
'''

pat = re.compile(r'(class="qb-hub-card cat-kb-mekan-ve-hareket".*?</a>)', re.DOTALL)
m = pat.search(html)
if m and 'cat-kb-saglik-ve-tip' not in html:
    html = html[:m.end()] + new_card + html[m.end():]
    print('[+] Saglik ve Tip card eklendi')
elif 'cat-kb-saglik-ve-tip' in html:
    print('[=] Card zaten mevcut')

with open(path, 'w', encoding='utf-8') as f:
    f.write(html)
