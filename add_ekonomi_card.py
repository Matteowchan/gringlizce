import re
path = 'kelime-bankasi.html'
with open(path, encoding='utf-8') as f:
    html = f.read()

html = html.replace(
    '<div><span class="s-num">12</span><span class="s-lbl">Kategori</span></div>',
    '<div><span class="s-num">13</span><span class="s-lbl">Kategori</span></div>'
)
html = html.replace(
    '<div><span class="s-num">1.100+</span><span class="s-lbl">Kelime</span></div>',
    '<div><span class="s-num">1.300+</span><span class="s-lbl">Kelime</span></div>'
)
print('[+] Hero: 12->13 Kategori, 1.100+ -> 1.300+ Kelime')

new_card = '''
        <a href="kelime.html?cat=ekonomi-ve-is" class="qb-hub-card cat-kb-ekonomi-ve-is" style="--cat-tint: #1e6091; --cat-tint-soft: rgba(30,96,145,0.10);">
          <span class="qb-hub-badge active">Hazır</span>
          <div class="qb-hub-mark">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/><rect width="20" height="14" x="2" y="6" rx="2"/></svg>
          </div>
          <h3>Ekonomi ve İş</h3>
          <p class="qb-hub-desc">Piyasa, finans, şirket yapıları, ekonomi politikası, yatırım, istihdam ve pazarlama. SAT, IELTS, YDS pasajlarında merkezi alan.</p>
          <div class="qb-hub-meta">
            <div class="m-item"><span class="m-num">100</span><span class="m-lbl">Kelime</span></div>
            <div class="m-item"><span class="m-num">SAT</span><span class="m-lbl">Hedef</span></div>
            <div class="m-item"><span class="m-num">IELTS</span><span class="m-lbl">Hedef</span></div>
          </div>
          <span class="qb-hub-cta">Çalışmaya Başla &rsaquo;</span>
        </a>
'''

pat = re.compile(r'(class="qb-hub-card cat-kb-sanat-ve-edebiyat".*?</a>)', re.DOTALL)
m = pat.search(html)
if m and 'cat-kb-ekonomi-ve-is' not in html:
    html = html[:m.end()] + new_card + html[m.end():]
    print('[+] Ekonomi ve Is card eklendi')
elif 'cat-kb-ekonomi-ve-is' in html:
    print('[=] Card zaten mevcut')

with open(path, 'w', encoding='utf-8') as f:
    f.write(html)
