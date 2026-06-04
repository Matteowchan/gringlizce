path = 'kelime-bankasi.html'
with open(path) as f: html = f.read()
changes = 0

# 1. ANALİZ VE ÇIKARIM
old_analiz = '''        <a href="#" class="qb-hub-card cat-kb-analiz-ve-cikarim" style="--cat-tint: #4a6a8a; --cat-tint-soft: rgba(74,106,138,0.10);" style="opacity:0.55;pointer-events:none;">
          <span class="qb-hub-badge">Yakında</span>
          <div class="qb-hub-mark">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </div>
          <h3>Analiz ve Çıkarım</h3>
          <p class="qb-hub-desc">Veri inceleme, çıkarım yapma, sentezleme, ayırt etme. Tüm akademik sınavlarda Reading bölümünün omurgası.</p>
          <span class="qb-hub-cta">Hazırlanıyor</span>
        </a>'''

new_analiz = '''        <a href="kelime.html?cat=analiz-ve-cikarim" class="qb-hub-card cat-kb-analiz-ve-cikarim" style="--cat-tint: #4a6a8a; --cat-tint-soft: rgba(74,106,138,0.10);">
          <span class="qb-hub-badge active">Hazır</span>
          <div class="qb-hub-mark">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </div>
          <h3>Analiz ve Çıkarım</h3>
          <p class="qb-hub-desc">Veri inceleme, çıkarım yapma, sentezleme, ayırt etme. Tüm akademik sınavlarda Reading bölümünün omurgası.</p>
          <div class="qb-hub-meta">
            <div class="m-item"><span class="m-num">100</span><span class="m-lbl">Kelime</span></div>
            <div class="m-item"><span class="m-num">SAT</span><span class="m-lbl">Hedef</span></div>
            <div class="m-item"><span class="m-num">TOEFL</span><span class="m-lbl">Hedef</span></div>
          </div>
          <span class="qb-hub-cta">Çalışmaya Başla &rsaquo;</span>
        </a>'''

if old_analiz in html:
    html = html.replace(old_analiz, new_analiz)
    changes += 1
    print('[ok] Analiz ve Cikarim aktive edildi')
elif new_analiz in html:
    print('[skip] Analiz zaten aktive')
else:
    print('[err] Analiz pattern bulunamadi')

# 2. SEBEP, ETKİ, ÖNLEME
old_sebep = '''        <a href="#" class="qb-hub-card cat-kb-sebep-etki-onleme" style="--cat-tint: #b85c2f; --cat-tint-soft: rgba(184,92,47,0.10);" style="opacity:0.55;pointer-events:none;">
          <span class="qb-hub-badge">Yakında</span>
          <div class="qb-hub-mark">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 17 9 11 13 15 21 7"/><polyline points="14 7 21 7 21 14"/></svg>
          </div>
          <h3>Sebep, Etki, Önleme</h3>
          <p class="qb-hub-desc">Neden olma, kötüleştirme, hafifletme, engelleme. Bilim ve sosyal bilim pasajlarının kelime havuzu.</p>
          <span class="qb-hub-cta">Hazırlanıyor</span>
        </a>'''

new_sebep = '''        <a href="kelime.html?cat=sebep-etki-onleme" class="qb-hub-card cat-kb-sebep-etki-onleme" style="--cat-tint: #b85c2f; --cat-tint-soft: rgba(184,92,47,0.10);">
          <span class="qb-hub-badge active">Hazır</span>
          <div class="qb-hub-mark">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 17 9 11 13 15 21 7"/><polyline points="14 7 21 7 21 14"/></svg>
          </div>
          <h3>Sebep, Etki, Önleme</h3>
          <p class="qb-hub-desc">Neden olma, kötüleştirme, hafifletme, engelleme. Bilim ve sosyal bilim pasajlarının kelime havuzu.</p>
          <div class="qb-hub-meta">
            <div class="m-item"><span class="m-num">100</span><span class="m-lbl">Kelime</span></div>
            <div class="m-item"><span class="m-num">SAT</span><span class="m-lbl">Hedef</span></div>
            <div class="m-item"><span class="m-num">TOEFL</span><span class="m-lbl">Hedef</span></div>
          </div>
          <span class="qb-hub-cta">Çalışmaya Başla &rsaquo;</span>
        </a>'''

if old_sebep in html:
    html = html.replace(old_sebep, new_sebep)
    changes += 1
    print('[ok] Sebep, Etki, Onleme aktive edildi')
elif new_sebep in html:
    print('[skip] Sebep zaten aktive')
else:
    print('[err] Sebep pattern bulunamadi')

# 3. DEĞİŞİM VE DÖNÜŞÜM
old_degisim = '''        <a href="#" class="qb-hub-card cat-kb-degisim-ve-donusum" style="--cat-tint: #5e7c3a; --cat-tint-soft: rgba(94,124,58,0.10);" style="opacity:0.55;pointer-events:none;">
          <span class="qb-hub-badge">Yakında</span>
          <div class="qb-hub-mark">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
          </div>
          <h3>Değişim ve Dönüşüm</h3>
          <p class="qb-hub-desc">Dönüşme, evrilme, kötüleşme, çoğalma, uyum sağlama. Yaşam bilimleri ve toplumsal değişim metinlerinde sık.</p>
          <span class="qb-hub-cta">Hazırlanıyor</span>
        </a>'''

new_degisim = '''        <a href="kelime.html?cat=degisim-ve-donusum" class="qb-hub-card cat-kb-degisim-ve-donusum" style="--cat-tint: #5e7c3a; --cat-tint-soft: rgba(94,124,58,0.10);">
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

if old_degisim in html:
    html = html.replace(old_degisim, new_degisim)
    changes += 1
    print('[ok] Degisim ve Donusum aktive edildi')
elif new_degisim in html:
    print('[skip] Degisim zaten aktive')
else:
    print('[err] Degisim pattern bulunamadi')

if changes > 0:
    with open(path, 'w') as f: f.write(html)
print(f'\nToplam {changes} kategori guncellendi')
