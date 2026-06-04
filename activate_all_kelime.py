path = 'kelime-bankasi.html'
with open(path) as f: html = f.read()

CATEGORIES = [
    {
        "slug": "argumantasyon-ve-elestiri",
        "tint": "#7A3B3B",
        "tint_soft": "rgba(122,59,59,0.10)",
        "svg": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
        "title": "Argümantasyon ve Eleştiri",
        "desc": "İddia kurma, çürütme, eleştiri, savunma. SAT R&W ve IELTS Writing pasajlarının kalbi.",
        "hedef1": "SAT", "hedef2": "IELTS"
    },
    {
        "slug": "analiz-ve-cikarim",
        "tint": "#4a6a8a",
        "tint_soft": "rgba(74,106,138,0.10)",
        "svg": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
        "title": "Analiz ve Çıkarım",
        "desc": "Veri inceleme, çıkarım yapma, sentezleme, ayırt etme. Tüm akademik sınavlarda Reading bölümünün omurgası.",
        "hedef1": "SAT", "hedef2": "TOEFL"
    },
    {
        "slug": "sebep-etki-onleme",
        "tint": "#b85c2f",
        "tint_soft": "rgba(184,92,47,0.10)",
        "svg": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 17 9 11 13 15 21 7"/><polyline points="14 7 21 7 21 14"/></svg>',
        "title": "Sebep, Etki, Önleme",
        "desc": "Neden olma, kötüleştirme, hafifletme, engelleme. Bilim ve sosyal bilim pasajlarının kelime havuzu.",
        "hedef1": "SAT", "hedef2": "TOEFL"
    },
    {
        "slug": "degisim-ve-donusum",
        "tint": "#5e7c3a",
        "tint_soft": "rgba(94,124,58,0.10)",
        "svg": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>',
        "title": "Değişim ve Dönüşüm",
        "desc": "Dönüşme, evrilme, kötüleşme, çoğalma, uyum sağlama. Yaşam bilimleri ve toplumsal değişim metinlerinde sık.",
        "hedef1": "SAT", "hedef2": "TOEFL"
    },
    {
        "slug": "miktar-ve-derece",
        "tint": "#c89a3c",
        "tint_soft": "rgba(200,154,60,0.10)",
        "svg": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>',
        "title": "Miktar ve Derece",
        "desc": "Çok, az, kayda değer, ihmal edilebilir, marjinal. Sayısal ya da nicel iddiaların kelimeleri.",
        "hedef1": "SAT", "hedef2": "IELTS"
    },
    {
        "slug": "akademik-tutum",
        "tint": "#6b4a8a",
        "tint_soft": "rgba(107,74,138,0.10)",
        "svg": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
        "title": "Akademik Tutum",
        "desc": "Nesnel, taraflı, şüpheci, dogmatik. Bir argümanın tonunu ve yazarın bakışını adlandıran kelimeler.",
        "hedef1": "SAT", "hedef2": "TOEFL"
    },
    {
        "slug": "toplum-ve-yapi",
        "tint": "#3d4a5c",
        "tint_soft": "rgba(61,74,92,0.10)",
        "svg": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
        "title": "Toplum ve Yapı",
        "desc": "Hiyerarşi, paradigma, kurum, çerçeve, rejim. Sosyal bilim pasajlarının yapı taşı kelimeleri.",
        "hedef1": "SAT", "hedef2": "IELTS"
    },
    {
        "slug": "dusunce-ve-yargi",
        "tint": "#a87c2f",
        "tint_soft": "rgba(168,124,47,0.10)",
        "svg": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.374 3.374 0 0 0 14 18.469V19a2 2 0 1 1-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>',
        "title": "Düşünce ve Yargı",
        "desc": "Öncül, varsayım, hipotez, iddia, kanaat. Argümanı oluşturan zihinsel yapı taşları.",
        "hedef1": "SAT", "hedef2": "TOEFL"
    },
    {
        "slug": "karsitlik-ve-uyum",
        "tint": "#7a6b5c",
        "tint_soft": "rgba(122,107,92,0.10)",
        "svg": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>',
        "title": "Karşıtlık ve Uyum",
        "desc": "Çelişmek, uzlaşmak, uyum sağlamak, sapmak. Karşıtlıkları ve uyumları adlandıran kelime grubu.",
        "hedef1": "SAT", "hedef2": "TOEFL"
    },
]

activated = 0
skipped = 0
errors = []

for c in CATEGORIES:
    old = f'''        <a href="#" class="qb-hub-card cat-kb-{c["slug"]}" style="--cat-tint: {c["tint"]}; --cat-tint-soft: {c["tint_soft"]};" style="opacity:0.55;pointer-events:none;">
          <span class="qb-hub-badge">Yakında</span>
          <div class="qb-hub-mark">
            {c["svg"]}
          </div>
          <h3>{c["title"]}</h3>
          <p class="qb-hub-desc">{c["desc"]}</p>
          <span class="qb-hub-cta">Hazırlanıyor</span>
        </a>'''

    new = f'''        <a href="kelime.html?cat={c["slug"]}" class="qb-hub-card cat-kb-{c["slug"]}" style="--cat-tint: {c["tint"]}; --cat-tint-soft: {c["tint_soft"]};">
          <span class="qb-hub-badge active">Hazır</span>
          <div class="qb-hub-mark">
            {c["svg"]}
          </div>
          <h3>{c["title"]}</h3>
          <p class="qb-hub-desc">{c["desc"]}</p>
          <div class="qb-hub-meta">
            <div class="m-item"><span class="m-num">100</span><span class="m-lbl">Kelime</span></div>
            <div class="m-item"><span class="m-num">{c["hedef1"]}</span><span class="m-lbl">Hedef</span></div>
            <div class="m-item"><span class="m-num">{c["hedef2"]}</span><span class="m-lbl">Hedef</span></div>
          </div>
          <span class="qb-hub-cta">Çalışmaya Başla &rsaquo;</span>
        </a>'''

    if old in html:
        html = html.replace(old, new)
        activated += 1
        print(f'[+] aktive: {c["title"]}')
    elif new in html:
        skipped += 1
        print(f'[=] zaten aktif: {c["title"]}')
    else:
        errors.append(c["slug"])
        print(f'[X] pattern bulunamadi: {c["title"]}')

if activated > 0:
    with open(path, 'w') as f: f.write(html)

print(f'\nOzet: {activated} yeni aktive, {skipped} zaten aktif, {len(errors)} hata')
if errors:
    print(f'Hatalar: {errors}')
