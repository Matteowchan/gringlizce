#!/usr/bin/env python3
# Build the ~100-message daily rotator payload for site_config.banner_rotator
# and emit a single UPSERT SQL statement (single quotes doubled) to stdout / file.
import json, os
B = "https://gringlizce.com/"

# Each entry: (tr, en, link_page_or_None)
# link is a verified real page basename (clean URL, no .html). None = no link.
M = [
    # --- Kelime / Word of the day (exam-level academic vocabulary) ---
    ("Günün kelimesi: **ubiquitous** — her yerde bulunan, yaygın.", "Word of the day: **ubiquitous** — found everywhere, very common.", "kelime"),
    ("Günün kelimesi: **mitigate** — hafifletmek, azaltmak.", "Word of the day: **mitigate** — to make less severe.", "kelime"),
    ("Günün kelimesi: **nuance** — ince anlam farkı, nüans.", "Word of the day: **nuance** — a subtle difference in meaning.", "kelime"),
    ("Günün kelimesi: **coherent** — tutarlı, mantıklı akan.", "Word of the day: **coherent** — logical and well-connected.", "kelime"),
    ("Günün kelimesi: **concise** — özlü, gereksiz söz içermeyen.", "Word of the day: **concise** — short and to the point.", "kelime"),
    ("Günün kelimesi: **inference** — çıkarım, satır aralarını okuma.", "Word of the day: **inference** — a conclusion drawn from evidence.", "sat-soru-bankasi"),
    ("Günün kelimesi: **arbitrary** — keyfi, gelişigüzel.", "Word of the day: **arbitrary** — based on chance, not reason.", "kelime"),
    ("Günün kelimesi: **empirical** — gözleme/deneye dayalı.", "Word of the day: **empirical** — based on observation or experiment.", "kelime"),
    ("Günün kelimesi: **salient** — göze çarpan, en önemli.", "Word of the day: **salient** — most noticeable or important.", "kelime"),
    ("Günün kelimesi: **ambiguous** — belirsiz, birden çok anlamlı.", "Word of the day: **ambiguous** — open to more than one meaning.", "kelime"),
    ("Günün kelimesi: **explicit** — açık, doğrudan belirtilen.", "Word of the day: **explicit** — stated clearly and directly.", "kelime"),
    ("Günün kelimesi: **rhetoric** — etkili dil kullanımı, retorik.", "Word of the day: **rhetoric** — the art of persuasive language.", "konu-anlatimi"),
    ("Günün kelimesi: **paraphrase** — başka sözcüklerle ifade etmek.", "Word of the day: **paraphrase** — to restate in other words.", "kelime"),
    ("Günün kelimesi: **cohesion** — metin bütünlüğü, bağdaşıklık.", "Word of the day: **cohesion** — how well ideas connect in a text.", "konu-anlatimi"),
    ("Günün kelimesi: **juxtapose** — yan yana koyup karşılaştırmak.", "Word of the day: **juxtapose** — to place side by side for contrast.", "kelime"),
    ("Günün kelimesi: **plausible** — makul, akla yatkın.", "Word of the day: **plausible** — reasonable and believable.", "kelime"),
    ("Günün kelimesi: **advocate** — savunmak; savunucu.", "Word of the day: **advocate** — to support; a supporter.", "kelime"),
    ("Günün kelimesi: **undermine** — temelini zayıflatmak.", "Word of the day: **undermine** — to weaken gradually.", "kelime"),
    ("Günün kelimesi: **prevalent** — yaygın, hâkim.", "Word of the day: **prevalent** — widespread, common.", "kelime"),
    ("Günün kelimesi: **scrutinize** — dikkatle incelemek.", "Word of the day: **scrutinize** — to examine closely.", "kelime"),
    ("Günün kelimesi: **compelling** — ikna edici, sürükleyici.", "Word of the day: **compelling** — convincing and forceful.", "kelime"),
    ("Günün kelimesi: **redundant** — gereksiz tekrar eden.", "Word of the day: **redundant** — unnecessary, repetitive.", "kelime"),
    ("Günün kelimesi: **synthesize** — parçaları birleştirip bütün kurmak.", "Word of the day: **synthesize** — to combine parts into a whole.", "kelime"),
    ("Günün kelimesi: **implicit** — üstü kapalı, ima edilen.", "Word of the day: **implicit** — implied, not directly stated.", "kelime"),
    ("Günün kelimesi: **feasible** — yapılabilir, uygulanabilir.", "Word of the day: **feasible** — possible to do easily.", "kelime"),

    # --- İlginç bilgi / Fun facts ---
    ("İlginç bilgi: İngilizcede en çok kullanılan harf **e**'dir.", "Fun fact: the most common letter in English is **e**.", "blog"),
    ("İlginç bilgi: SAT ezber değil, **akıl yürütme** ölçer.", "Fun fact: the SAT tests **reasoning**, not memorization.", "sat-soru-bankasi"),
    ("İlginç bilgi: IELTS bandı **0 ile 9** arasında yarım puanlarla verilir.", "Fun fact: IELTS is scored in half-bands from **0 to 9**.", "ielts-ornek-sorular"),
    ("İlginç bilgi: \"set\" sözcüğünün İngilizcede en çok anlamı vardır.", "Fun fact: \"set\" has more meanings than any other English word.", "kelime"),
    ("İlginç bilgi: TOEFL tamamen bilgisayar üzerinden ve akademik odaklıdır.", "Fun fact: the TOEFL is fully computer-based and academic.", "toefl-soru-bankasi"),
    ("İlginç bilgi: İngilizce kelimelerin yaklaşık %60'ı Latince/Fransızca kökenlidir.", "Fun fact: about 60% of English words have Latin or French roots.", "konu-anlatimi"),
    ("İlginç bilgi: Digital SAT uyarlanır — ilk modül sonraki modülün zorluğunu belirler.", "Fun fact: the Digital SAT is adaptive — module 1 sets module 2's difficulty.", "sat-soru-bankasi"),
    ("İlginç bilgi: \"e\" harfi olmadan roman yazan yazarlar olmuştur (lipogram).", "Fun fact: some novels are written with no letter \"e\" — a lipogram.", "blog"),
    ("İlginç bilgi: IELTS'te Reading ve Listening'de **çeyrek puanlar yoktur**, sorular tek tek sayılır.", "Fun fact: IELTS Reading and Listening are scored by raw correct answers.", "ielts-soru-bankasi"),
    ("İlginç bilgi: YDS/YÖKDİL'de her sorunun ağırlığı eşittir; strateji zaman yönetimidir.", "Fun fact: in YDS every question counts equally — timing is the strategy.", "yds-soru-bankasi"),
    ("İlginç bilgi: İngilizcede yaklaşık her iki saatte bir yeni bir sözcük türetilir.", "Fun fact: a new English word is coined roughly every two hours.", "kelime"),
    ("İlginç bilgi: \"I am\" İngilizcedeki en kısa tam cümledir.", "Fun fact: \"I am\" is the shortest complete sentence in English.", "genel-ingilizce"),
    ("İlginç bilgi: Noktalama bir cümlenin anlamını tümden değiştirebilir.", "Fun fact: punctuation alone can flip a sentence's meaning.", "konu-anlatimi"),
    ("İlginç bilgi: SAT Reading'de \"en iyi\" cevap, çoğu kez en kanıtlı olandır — en uzunu değil.", "Fun fact: on SAT Reading the best answer is the best-supported, not the longest.", "sat-soru-bankasi"),
    ("İlginç bilgi: İngilizcede sessiz harfler (silent letters) sözcüklerin ~%60'ında görülür.", "Fun fact: silent letters appear in around 60% of English words.", "konu-anlatimi"),

    # --- Çalışma ipucu / Study tips ---
    ("İpucu: Reading'de önce soruyu oku, sonra metne dön — zaman kazanırsın.", "Tip: read the question first, then scan the passage — save time.", "sat-soru-bankasi"),
    ("İpucu: Kelimeyi cümle içinde öğren; yalın liste çabuk unutulur.", "Tip: learn words in context — plain lists fade fast.", "kelime"),
    ("İpucu: Yazmadan önce 2 dakika planla; yapı puanı yükseltir.", "Tip: plan for 2 minutes before writing — structure lifts your score.", "yazi-pratigi"),
    ("İpucu: IELTS yazıda 4 paragraf yeterlidir — asla 5 değil.", "Tip: four paragraphs is enough for IELTS writing — never five.", "ielts-ornek-sorular"),
    ("İpucu: Yanlışlarını bir deftere yaz; ilerlemenin en hızlı yolu budur.", "Tip: keep an error log — it's the fastest way to improve.", "ogrenme-haritasi"),
    ("İpucu: Matematikte kolay soruları önce topla, zoruna sonra dön.", "Tip: bank the easy math questions first, return to the hard ones.", "sat-soru-bankasi"),
    ("İpucu: Her gün 15 dakika okuma, haftada bir maraton çalışmadan iyidir.", "Tip: 15 minutes daily beats one weekend cram session.", "ogrenme-haritasi"),
    ("İpucu: Deneme çöz, ama asıl kazanç yanlışları analiz etmekte.", "Tip: take practice tests, but the real gain is reviewing your mistakes.", "sat-deneme"),
    ("İpucu: Geçiş kelimeleri (however, therefore) fikirler arası köprü kurar.", "Tip: transitions like 'however' and 'therefore' bridge your ideas.", "konu-anlatimi"),
    ("İpucu: Konu anlatımını oku, sonra aynı konudan soru çöz — kalıcı olur.", "Tip: read the lesson, then solve questions on it — it sticks.", "konu-anlatimi"),
    ("İpucu: Listening'de soruları önceden okumak seni sese hazırlar.", "Tip: read the questions before the audio starts — get ready to listen.", "ielts-soru-bankasi"),
    ("İpucu: Şık elerken \"kısmen doğru\" tuzağına dikkat et.", "Tip: beware the 'partly true' trap when eliminating options.", "sat-soru-bankasi"),
    ("İpucu: Kısa ve net cümle, uzun ve karmaşık cümleden güçlüdür.", "Tip: a short, clear sentence beats a long, tangled one.", "yazi-pratigi"),
    ("İpucu: Gramer kurallarını örnek cümlelerle eşleştir, ezberleme.", "Tip: pair grammar rules with example sentences instead of memorizing.", "konu-anlatimi"),
    ("İpucu: Sınav gününden önceki gece yeni konu açma; dinlen.", "Tip: don't start new topics the night before — rest instead.", "ogrenme-haritasi"),
    ("İpucu: Paraphrase (yeniden ifade) IELTS ve TOEFL'da anahtar beceridir.", "Tip: paraphrasing is a key skill for IELTS and TOEFL.", "yazi-pratigi"),
    ("İpucu: UDSP için hedefin %70; zamanı bölümlere böl.", "Tip: UDSP needs 70% — split your time across sections.", "udsp-soru-bankasi"),
    ("İpucu: YDT'de kelime bilgisi belirleyicidir; her gün 10 yeni sözcük.", "Tip: vocabulary decides YDT — learn 10 new words a day.", "ydt-soru-bankasi"),
    ("İpucu: Yüksek sesle oku; telaffuz ve akıcılık birlikte gelişir.", "Tip: read aloud — pronunciation and fluency grow together.", "genel-ingilizce"),
    ("İpucu: Çeldirici uzun diye doğru sanma; kanıta bak.", "Tip: a long option isn't proof — check the evidence.", "sat-soru-bankasi"),

    # --- Hızlı görev / Mini challenges ---
    ("Bugünkü görev: 10 soru çöz, seriyi bozma.", "Today's challenge: solve 10 questions and keep your streak.", "soru-bankasi"),
    ("Bugünkü görev: bir SAT Reading pasajı bitir.", "Today's challenge: finish one SAT Reading passage.", "sat-soru-bankasi"),
    ("Bugünkü görev: bir IELTS Task 1 yaz ve gözden geçir.", "Today's challenge: write one IELTS Task 1 and review it.", "yazi-pratigi"),
    ("Bugünkü görev: 5 yeni kelimeyi cümle içinde kullan.", "Today's challenge: use 5 new words in your own sentences.", "kelime"),
    ("Bugünkü görev: kısa bir deneme çöz, sonucunu not al.", "Today's challenge: take a short practice test and log your score.", "toefl-denemeler"),
    ("Bugünkü görev: bir gramer konusunu bitir ve 5 soru çöz.", "Today's challenge: finish one grammar topic and solve 5 questions.", "konu-anlatimi"),
    ("Bugünkü görev: öğrenme haritanda bir adım ilerle.", "Today's challenge: advance one step on your learning map.", "ogrenme-haritasi"),
    ("Bugünkü görev: dünkü yanlışlarını tekrar çöz.", "Today's challenge: redo yesterday's wrong answers.", "soru-bankasi"),
    ("Bugünkü görev: bir YDS paragraf sorusu çöz ve mantığını yaz.", "Today's challenge: solve one YDS paragraph question and explain your logic.", "yds-soru-bankasi"),
    ("Bugünkü görev: 20 dakika sessiz, kesintisiz çalış.", "Today's challenge: study 20 minutes with zero distractions.", "ogrenme-haritasi"),

    # --- Motivasyon / Nudge ---
    ("Küçük ama düzenli adımlar, büyük sıçramalardan güçlüdür.", "Small, steady steps beat big, rare leaps.", "ogrenme-haritasi"),
    ("Bugün çözmediğin soru, yarınki eksiğindir.", "The question you skip today is tomorrow's gap.", "soru-bankasi"),
    ("İlerleme hız değil, süreklilik ister.", "Progress rewards consistency, not speed.", "ogrenme-haritasi"),
    ("Zor sorular seni değil, hazırlığını sınar.", "Hard questions test your prep, not your worth.", "sat-soru-bankasi"),
    ("Her doğru cevap bir sonrakinin provasıdır.", "Every correct answer rehearses the next.", "soru-bankasi"),
    ("Hedefini yaz, yolunu böl, her gün bir parça al.", "Write your goal, split the path, take one piece daily.", "ogrenme-haritasi"),
    ("Okumadan çözme, çözmeden geçme.", "Don't answer before reading, don't move on before checking.", "sat-soru-bankasi"),
    ("Bugün 1% daha iyi ol; bir yıl sonra 37 kat.", "Get 1% better today — that compounds over a year.", "ogrenme-haritasi"),

    # --- Sınav-özel kısa hatırlatmalar ---
    ("SAT R&W: dilbilgisi soruları kısa ve net cevabı sever.", "SAT R&W: grammar items reward the short, clean answer.", "sat-soru-bankasi"),
    ("SAT Math: birim ve işaret hatalarını son 10 saniyede kontrol et.", "SAT Math: check units and signs in the last 10 seconds.", "sat-soru-bankasi"),
    ("IELTS Writing: görevi tam karşıla — soru ne soruyorsa onu yaz.", "IELTS Writing: fully answer the task — write what's asked.", "ielts-ornek-sorular"),
    ("IELTS Speaking: fikri örnekle destekle, tek cümlede bırakma.", "IELTS Speaking: support ideas with examples, not one liners.", "ielts-soru-bankasi"),
    ("TOEFL Integrated: dinlediğini ve okuduğunu bağla.", "TOEFL Integrated: connect what you read to what you hear.", "toefl-soru-bankasi"),
    ("YÖKDİL: cümle tamamlamada anlam bütünlüğü önce gelir.", "YÖKDİL: in sentence completion, meaning comes first.", "yds-soru-bankasi"),
    ("Genel İngilizce: her hafta 4 beceriyi de dokun — denge önemli.", "General English: touch all four skills weekly — balance matters.", "genel-ingilizce"),
    ("Deneme sonrası: skoru değil, hangi konuda düştüğünü not al.", "After a mock: log the topic you missed, not just the score.", "sat-deneme"),
    ("Bir konuyu bitirince aynı konudan deneme çöz — köprü kur.", "Finish a topic, then test it — bridge learning to practice.", "konu-anlatimi"),
    ("Kelime kartların birikince tekrar et; unutma eğrisini yen.", "Review your word cards regularly — beat the forgetting curve.", "kelime"),

    # --- Ek kelime turu (100'e tamamlama) ---
    ("Günün kelimesi: **candid** — samimi, açık sözlü.", "Word of the day: **candid** — honest and direct.", "kelime"),
    ("Günün kelimesi: **diligent** — özenli, çalışkan.", "Word of the day: **diligent** — hard-working and careful.", "kelime"),
    ("Günün kelimesi: **skeptical** — kuşkucu, şüpheci.", "Word of the day: **skeptical** — doubtful, questioning.", "kelime"),
    ("Günün kelimesi: **vivid** — canlı, capcanlı (betimleme).", "Word of the day: **vivid** — bright and lifelike.", "kelime"),
    ("Günün kelimesi: **notion** — kavram, düşünce.", "Word of the day: **notion** — an idea or concept.", "kelime"),
    ("Günün kelimesi: **profound** — derin, köklü.", "Word of the day: **profound** — very deep or intense.", "kelime"),
    ("Günün kelimesi: **reluctant** — isteksiz, gönülsüz.", "Word of the day: **reluctant** — unwilling, hesitant.", "kelime"),
    ("Günün kelimesi: **abundant** — bol, çok sayıda.", "Word of the day: **abundant** — plentiful, in large amounts.", "kelime"),
    ("Günün kelimesi: **deliberate** — kasıtlı; ölçülü.", "Word of the day: **deliberate** — intentional; careful.", "kelime"),
    ("Günün kelimesi: **inevitable** — kaçınılmaz.", "Word of the day: **inevitable** — certain to happen.", "kelime"),
    ("Günün kelimesi: **subtle** — ince, sezilmesi güç.", "Word of the day: **subtle** — delicate, not obvious.", "kelime"),
    ("Günün kelimesi: **elaborate** — ayrıntılı; ayrıntılandırmak.", "Word of the day: **elaborate** — detailed; to add detail.", "kelime"),
    ("Günün kelimesi: **contrary** — aksine, zıt.", "Word of the day: **contrary** — opposite, conflicting.", "kelime"),
    ("Günün kelimesi: **valid** — geçerli, sağlam (gerekçe).", "Word of the day: **valid** — sound and well-founded.", "kelime"),
    ("Günün kelimesi: **acknowledge** — kabul etmek, teslim etmek.", "Word of the day: **acknowledge** — to accept or admit.", "kelime"),
    ("Günün kelimesi: **derive** — türetmek, çıkarmak.", "Word of the day: **derive** — to obtain from a source.", "kelime"),
    ("Günün kelimesi: **restrain** — dizginlemek, tutmak.", "Word of the day: **restrain** — to hold back.", "kelime"),
    ("Günün kelimesi: **notable** — dikkate değer, önemli.", "Word of the day: **notable** — worthy of attention.", "kelime"),
    ("Günün kelimesi: **contradict** — çelişmek, yalanlamak.", "Word of the day: **contradict** — to state the opposite.", "kelime"),
    ("Günün kelimesi: **emphasize** — vurgulamak.", "Word of the day: **emphasize** — to give special importance.", "kelime"),
    ("Günün kelimesi: **conventional** — geleneksel, alışılmış.", "Word of the day: **conventional** — traditional, standard.", "kelime"),
    ("Günün kelimesi: **transparent** — saydam; açık, anlaşılır.", "Word of the day: **transparent** — clear and easy to understand.", "kelime"),
    ("Günün kelimesi: **anticipate** — öngörmek, beklemek.", "Word of the day: **anticipate** — to expect in advance.", "kelime"),
    ("Günün kelimesi: **objective** — nesnel; hedef.", "Word of the day: **objective** — unbiased; a goal.", "kelime"),
    ("Günün kelimesi: **relevant** — konuyla ilgili, yerinde.", "Word of the day: **relevant** — closely connected to the topic.", "kelime"),
]

msgs = []
for tr, en, link in M:
    m = {"tr": tr, "en": en}
    if link:
        m["link"] = B + link
    msgs.append(m)

payload = {"enabled": True, "bg": "#2E6E6A", "messages": msgs}
js = json.dumps(payload, ensure_ascii=False, separators=(",", ":"))
sql_json = js.replace("'", "''")
sql = ("insert into site_config(key, value, updated_at) values "
       "('banner_rotator', '" + sql_json + "'::jsonb, now()) "
       "on conflict (key) do update set value = excluded.value, updated_at = now();")

out = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                   "scripts", "banner_rotator_upsert.sql")
open(out, "w", encoding="utf-8").write(sql)
print("messages:", len(msgs))
print("SQL bytes:", len(sql))
print("written:", out)
