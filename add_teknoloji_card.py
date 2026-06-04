import re
path = 'kelime-bankasi.html'
with open(path, encoding='utf-8') as f:
    html = f.read()

html = html.replace(
    '<div><span class="s-num">18</span><span class="s-lbl">Kategori</span></div>',
    '<div><span class="s-num">19</span><span class="s-lbl">Kategori</span></div>'
)
html = html.replace(
    '<div><span class="s-num">1.800+</span><span class="s-lbl">Kelime</span></div>',
    '<div><span class="s-num">1.900+</span><span class="s-lbl">Kelime</span></div>'
)
print('[+] Hero: 18->19 Kategori, 1.800+ -> 1.900+ Kelime')

new_card = '''
        <a href="kelime.html?cat=teknoloji-ve-dijital" class="qb-hub-card cat-kb-teknoloji-ve-dijital" style="--cat-tint: #5a4a8a; --cat-tint-soft: rgba(90,74,138,0.10);">
          <span class="qb-hub-badge active">Hazır</span>
          <div class="qb-hub-mark">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></svg>
          </div>
          <h3>Teknoloji ve Dijital</h3>
          <p class="qb-hub-desc">Donanım, yazılım, ağ, programlama, veri, yapay zeka, dijital içerik, siber güvenlik ve inovasyon. SAT ve TOEFL teknoloji pasajları için.</p>
          <div class="qb-hub-meta">
            <div class="m-item"><span class="m-num">100</span><span class="m-lbl">Kelime</span></div>
            <div class="m-item"><span class="m-num">SAT</span><span class="m-lbl">Hedef</span></div>
            <div class="m-item"><span class="m-num">TOEFL</span><span class="m-lbl">Hedef</span></div>
          </div>
          <span class="qb-hub-cta">Çalışmaya Başla &rsaquo;</span>
        </a>
'''

pat = re.compile(r'(class="qb-hub-card cat-kb-saglik-ve-tip".*?</a>)', re.DOTALL)
m = pat.search(html)
if m and 'cat-kb-teknoloji-ve-dijital' not in html:
    html = html[:m.end()] + new_card + html[m.end():]
    print('[+] Teknoloji ve Dijital card eklendi')
elif 'cat-kb-teknoloji-ve-dijital' in html:
    print('[=] Card zaten mevcut')

with open(path, 'w', encoding='utf-8') as f:
    f.write(html)
