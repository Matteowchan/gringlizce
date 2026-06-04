path = 'kelime-bankasi.html'
with open(path) as f: html = f.read()

old = '''        <a href="#" class="qb-hub-card cat-kb-degisim-ve-donusum" style="--cat-tint: #5e7c3a; --cat-tint-soft: rgba(94,124,58,0.10);" style="opacity:0.55;pointer-events:none;">
          <span class="qb-hub-badge">Yakında</span>
          <div class="qb-hub-mark">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
          </div>
          <h3>Değişim ve Dönüşüm</h3>
          <p class="qb-hub-desc">Dönüşme, evrilme, kötüleşme, çoğalma, uyum sağlama. Yaşam bilimleri ve toplumsal değişim metinlerinde sık.</p>
          <span class="qb-hub-cta">Hazırlanıyor</span>
        </a>'''

new = '''        <a href="kelime.html?cat=degisim-ve-donusum" class="qb-hub-card cat-kb-degisim-ve-donusum" style="--cat-tint: #5e7c3a; --cat-tint-soft: rgba(94,124,58,0.10);">
          <span class="qb-hub-badge active">Hazır</span>
          <div class="qb-hub-mark">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
          </div>
          <h3>Değişim ve Dönüşüm</h3>
          <p class="qb-hub-desc">Dönüşme, evrilme, kötüleşme, çoğalma, uyum sağlama. Yaşam bilimleri ve toplumsal değişim metinlerinde sık.</p>
          <div class="qb-hub-meta">
            <div class="m-item"><span class="m-num">100</span><span class="m-lbl">Kelime</span></div>
            <div class="m-item"><span class="m-num">SAT</span><span class="m-lbl">Hedef</span></div>
            <div class="m-item"><span class="m-num">TOEFL</span><span class="m-lbl">Hedef</span></div>
          </div>
          <span class="qb-hub-cta">Çalışmaya Başla &rsaquo;</span>
        </a>'''

if old in html:
    html = html.replace(old, new)
    with open(path, 'w') as f: f.write(html)
    print('[ok] aktive edildi')
elif new in html:
    print('[skip] zaten aktive')
else:
    print('[err] pattern bulunamadi')
