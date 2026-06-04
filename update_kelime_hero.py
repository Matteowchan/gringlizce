path = 'kelime-bankasi.html'
with open(path, encoding='utf-8') as f:
    html = f.read()

# 1. Meta description
old_meta = 'content="SAT, TOEFL ve akademik İngilizce kelimeleri 10 fonksiyonel kategoriye ayrılmış olarak çalış. Anlamı sorulur, sınavda kullanımı, fun fact ve örnek cümle ile pekiştirilir."'
new_meta = 'content="SAT, TOEFL, IELTS, YDT ve YDS sınavlarına yönelik akademik İngilizce kelimeleri 10 fonksiyonel kategoride çalış. Anlamı sorulur, sınavda kullanımı, fun fact ve örnek cümle ile pekiştirilir."'
if old_meta in html:
    html = html.replace(old_meta, new_meta)
    print('[+] meta description guncellendi')
else:
    print('[=] meta zaten guncel veya pattern bulunamadi')

# 2. Hero lead
old_lead = '<p class="lead">SAT ve TOEFL akademik kelimelerini fonksiyonel kategorilere ayırdık. Her açılışta rastgele bir kelime gelir; anlamı sorulur, sınavda nasıl kullanıldığı ve hatırlamayı kolaylaştıran bir fun fact ile pekiştirilir.</p>'
new_lead = '<p class="lead">SAT, TOEFL, IELTS, YDT ve YDS sınavlarına yönelik akademik kelimeleri fonksiyonel kategorilere ayırdık. Her açılışta rastgele bir kelime gelir; anlamı sorulur, sınavda nasıl kullanıldığı ve hatırlamayı kolaylaştıran bir fun fact ile pekiştirilir.</p>'
if old_lead in html:
    html = html.replace(old_lead, new_lead)
    print('[+] hero lead guncellendi')
else:
    print('[=] hero lead zaten guncel')

# 3. Stats: 200+ -> 1.000+, SAT · TOEFL -> 5 Sınav
old_stats = '''<div class="stats">
        <div><span class="s-num">10</span><span class="s-lbl">Kategori</span></div>
        <div><span class="s-num">200+</span><span class="s-lbl">Kelime</span></div>
        <div><span class="s-num">SAT &middot; TOEFL</span><span class="s-lbl">Hedef</span></div>
      </div>'''
new_stats = '''<div class="stats">
        <div><span class="s-num">10</span><span class="s-lbl">Kategori</span></div>
        <div><span class="s-num">1.000+</span><span class="s-lbl">Kelime</span></div>
        <div><span class="s-num">5</span><span class="s-lbl">Sınav</span></div>
      </div>'''
if old_stats in html:
    html = html.replace(old_stats, new_stats)
    print('[+] stats guncellendi (200+ -> 1.000+, SAT·TOEFL -> 5 Sinav)')
else:
    print('[=] stats zaten guncel veya pattern bulunamadi')

with open(path, 'w', encoding='utf-8') as f:
    f.write(html)

print('\nKelime bankasi hero hazir.')
