import re
path = 'kelime-bankasi.html'
with open(path, encoding='utf-8') as f:
    html = f.read()

html = html.replace(
    '<div><span class="s-num">14</span><span class="s-lbl">Kategori</span></div>',
    '<div><span class="s-num">15</span><span class="s-lbl">Kategori</span></div>'
)
html = html.replace(
    '<div><span class="s-num">1.400+</span><span class="s-lbl">Kelime</span></div>',
    '<div><span class="s-num">1.500+</span><span class="s-lbl">Kelime</span></div>'
)
print('[+] Hero: 14->15 Kategori, 1.400+ -> 1.500+ Kelime')

new_card = '''
        <a href="kelime.html?cat=insan-ve-davranis" class="qb-hub-card cat-kb-insan-ve-davranis" style="--cat-tint: #7a5fa8; --cat-tint-soft: rgba(122,95,168,0.10);">
          <span class="qb-hub-badge active">Hazır</span>
          <div class="qb-hub-mark">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/></svg>
          </div>
          <h3>İnsan ve Davranış</h3>
          <p class="qb-hub-desc">Kişilik, duygular, motivasyon, biliş, gelişim ve ruh sağlığı. SAT pasajları ve IELTS okuma için psikoloji havuzu.</p>
          <div class="qb-hub-meta">
            <div class="m-item"><span class="m-num">100</span><span class="m-lbl">Kelime</span></div>
            <div class="m-item"><span class="m-num">SAT</span><span class="m-lbl">Hedef</span></div>
            <div class="m-item"><span class="m-num">IELTS</span><span class="m-lbl">Hedef</span></div>
          </div>
          <span class="qb-hub-cta">Çalışmaya Başla &rsaquo;</span>
        </a>
'''

pat = re.compile(r'(class="qb-hub-card cat-kb-tarih-ve-politika".*?</a>)', re.DOTALL)
m = pat.search(html)
if m and 'cat-kb-insan-ve-davranis' not in html:
    html = html[:m.end()] + new_card + html[m.end():]
    print('[+] İnsan ve Davranis card eklendi')
elif 'cat-kb-insan-ve-davranis' in html:
    print('[=] Card zaten mevcut')

with open(path, 'w', encoding='utf-8') as f:
    f.write(html)
