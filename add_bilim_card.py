import re
path = 'kelime-bankasi.html'
with open(path, encoding='utf-8') as f:
    html = f.read()

old_stat = '<div><span class="s-num">10</span><span class="s-lbl">Kategori</span></div>'
new_stat = '<div><span class="s-num">11</span><span class="s-lbl">Kategori</span></div>'
if old_stat in html:
    html = html.replace(old_stat, new_stat)
    print('[+] Hero: 10 -> 11 Kategori')

new_card = '''
        <a href="kelime.html?cat=bilim-ve-doga" class="qb-hub-card cat-kb-bilim-ve-doga" style="--cat-tint: #3a8c5a; --cat-tint-soft: rgba(58,140,90,0.10);">
          <span class="qb-hub-badge active">Hazır</span>
          <div class="qb-hub-mark">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19.2 2.96c.97 2.91.74 6.31-.4 9.04C17.5 15 14 17 11 20Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6"/></svg>
          </div>
          <h3>Bilim ve Doğa</h3>
          <p class="qb-hub-desc">Canlı türleri, ekosistem, evrim, fizik, kimya, jeoloji ve uzay. SAT ve TOEFL bilim pasajlarının kelime havuzu.</p>
          <div class="qb-hub-meta">
            <div class="m-item"><span class="m-num">100</span><span class="m-lbl">Kelime</span></div>
            <div class="m-item"><span class="m-num">SAT</span><span class="m-lbl">Hedef</span></div>
            <div class="m-item"><span class="m-num">TOEFL</span><span class="m-lbl">Hedef</span></div>
          </div>
          <span class="qb-hub-cta">Çalışmaya Başla &rsaquo;</span>
        </a>
'''

pat = re.compile(r'(class="qb-hub-card cat-kb-karsitlik-ve-uyum".*?</a>)', re.DOTALL)
m = pat.search(html)
if m and 'cat-kb-bilim-ve-doga' not in html:
    html = html[:m.end()] + new_card + html[m.end():]
    print('[+] Bilim ve Doga card eklendi')
elif 'cat-kb-bilim-ve-doga' in html:
    print('[=] Card zaten mevcut')

with open(path, 'w', encoding='utf-8') as f:
    f.write(html)
