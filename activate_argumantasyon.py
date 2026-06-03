import os
path = 'kelime-bankasi.html'
with open(path) as f: html = f.read()

old = '''        <a href="#" class="qb-hub-card cat-kb-argumantasyon" style="--cat-tint: #7A3B3B; --cat-tint-soft: rgba(122,59,59,0.10);" style="opacity:0.55;pointer-events:none;">
          <span class="qb-hub-badge">Yakında</span>
          <div class="qb-hub-mark">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
          </div>
          <h3>Argümantasyon ve Eleştiri</h3>
          <p class="qb-hub-desc">İddia kurma, çürütme, destekleme, kabul etme. SAT R&W, IELTS Writing ve akademik tartışma için kritik.</p>
          <span class="qb-hub-cta">Hazırlanıyor</span>
        </a>'''

new = '''        <a href="kelime.html?cat=argumantasyon-ve-elestiri" class="qb-hub-card cat-kb-argumantasyon" style="--cat-tint: #7A3B3B; --cat-tint-soft: rgba(122,59,59,0.10);">
          <span class="qb-hub-badge active">Hazır</span>
          <div class="qb-hub-mark">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
          </div>
          <h3>Argümantasyon ve Eleştiri</h3>
          <p class="qb-hub-desc">İddia kurma, çürütme, destekleme, kabul etme. SAT R&W, IELTS Writing ve akademik tartışma için kritik.</p>
          <div class="qb-hub-meta">
            <div class="m-item"><span class="m-num">100</span><span class="m-lbl">Kelime</span></div>
            <div class="m-item"><span class="m-num">SAT</span><span class="m-lbl">Hedef</span></div>
            <div class="m-item"><span class="m-num">IELTS</span><span class="m-lbl">Hedef</span></div>
          </div>
          <span class="qb-hub-cta">Çalışmaya Başla &rsaquo;</span>
        </a>'''

if old in html:
    html = html.replace(old, new)
    with open(path, 'w') as f: f.write(html)
    print('[ok] Argumantasyon card aktive edildi')
elif new in html:
    print('[skip] zaten aktive edilmis')
else:
    print('[err] card pattern bulunamadi')
