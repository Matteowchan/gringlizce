import re
path = 'kelime-bankasi.html'
with open(path, encoding='utf-8') as f:
    html = f.read()

html = html.replace(
    '<div><span class="s-num">13</span><span class="s-lbl">Kategori</span></div>',
    '<div><span class="s-num">14</span><span class="s-lbl">Kategori</span></div>'
)
html = html.replace(
    '<div><span class="s-num">1.300+</span><span class="s-lbl">Kelime</span></div>',
    '<div><span class="s-num">1.400+</span><span class="s-lbl">Kelime</span></div>'
)
print('[+] Hero: 13->14 Kategori, 1.300+ -> 1.400+ Kelime')

new_card = '''
        <a href="kelime.html?cat=tarih-ve-politika" class="qb-hub-card cat-kb-tarih-ve-politika" style="--cat-tint: #8b6232; --cat-tint-soft: rgba(139,98,50,0.10);">
          <span class="qb-hub-badge active">Hazır</span>
          <div class="qb-hub-mark">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="22" x2="21" y2="22"/><line x1="5" y1="22" x2="5" y2="12"/><line x1="19" y1="22" x2="19" y2="12"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M5 12 12 4l7 8"/></svg>
          </div>
          <h3>Tarih ve Politika</h3>
          <p class="qb-hub-desc">Siyasi sistemler, hareketler, hukuk, yönetim, ideolojiler, tarihsel dönemler ve diplomasi. SAT pasajları ve YDS için temel alan.</p>
          <div class="qb-hub-meta">
            <div class="m-item"><span class="m-num">100</span><span class="m-lbl">Kelime</span></div>
            <div class="m-item"><span class="m-num">SAT</span><span class="m-lbl">Hedef</span></div>
            <div class="m-item"><span class="m-num">YDS</span><span class="m-lbl">Hedef</span></div>
          </div>
          <span class="qb-hub-cta">Çalışmaya Başla &rsaquo;</span>
        </a>
'''

pat = re.compile(r'(class="qb-hub-card cat-kb-ekonomi-ve-is".*?</a>)', re.DOTALL)
m = pat.search(html)
if m and 'cat-kb-tarih-ve-politika' not in html:
    html = html[:m.end()] + new_card + html[m.end():]
    print('[+] Tarih ve Politika card eklendi')
elif 'cat-kb-tarih-ve-politika' in html:
    print('[=] Card zaten mevcut')

with open(path, 'w', encoding='utf-8') as f:
    f.write(html)
