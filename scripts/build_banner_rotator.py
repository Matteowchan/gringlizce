#!/usr/bin/env python3
# Build the daily rotator payload for site_config.banner_rotator and emit an UPSERT SQL.
# v2: no category prefixes ("Ilginc bilgi:", "Gunun kelimesi:"), sharper / less basic content.
import json, os
B = "https://gringlizce.com/"

# (tr, en, link_page_or_None). No prefixes. Aim: genuinely interesting / useful / non-obvious.
M = [
    # --- Non-obvious language facts ---
    ("Noktalama tek başına anlamı tersine çevirir: \"Let's eat, Grandma\" ile \"Let's eat Grandma\" aynı değildir.", "Punctuation alone flips meaning: \"Let's eat, Grandma\" is not \"Let's eat Grandma.\"", "konu-anlatimi"),
    ("İngilizcede sıfat sırası sabittir: \"big red car\" doğru, \"red big car\" kulağı tırmalar (görüş-boyut-yaş-renk...).", "English fixes adjective order: \"big red car\" is right, \"red big car\" sounds off (opinion-size-age-color...).", "gramer-adjective-order"),
    ("Shakespeare İngilizceye 1700'den fazla sözcük kazandırdı — \"lonely\", \"eyeball\", \"fashionable\" onlardan.", "Shakespeare gave English over 1,700 words — \"lonely,\" \"eyeball,\" and \"fashionable\" among them.", "blog"),
    ("\"ghoti\" aslında \"fish\" gibi okunabilir: enou**gh**, w**o**men, na**ti**on. İngilizce yazımı kuralsız görünür ama örüntülüdür.", "\"ghoti\" could spell \"fish\": enou**gh**, w**o**men, na**ti**on. English spelling looks lawless but has patterns.", "telaffuz-word-stress"),
    ("\"literally\" sözlüklerde artık mecazi anlamıyla da yer alıyor — dil kurallarla değil kullanımla yaşar.", "Dictionaries now list \"literally\" in its figurative sense too — usage, not rules, keeps a language alive.", "konu-anlatimi"),
    ("En çok karıştırılan ikili: \"affect\" fiildir (etkilemek), \"effect\" isimdir (etki). Tek harf, iki dünya.", "The classic mix-up: \"affect\" is the verb, \"effect\" the noun. One letter, two worlds.", "gramer-linking-words"),
    ("İngilizce tek büyük dildir ki \"I\" zamirini her zaman büyük harfle yazar.", "English is the only major language that always capitalizes the pronoun \"I.\"", "konu-anlatimi"),
    ("\"rhythm\" ve \"rhythms\" — sesli harf içermeyen en uzun yaygın İngilizce sözcükler.", "\"rhythm\" and \"rhythms\" are among the longest common English words with no vowel letters.", "kelime"),
    ("İngilizcenin resmi bir dil akademisi yoktur; sözlükler kuralı koymaz, kullanımı KAYDEDER.", "English has no official language academy; dictionaries don't set rules, they record usage.", "konu-anlatimi"),
    ("Bir cümlede sözcük sırasını değiştirmek vurguyu değiştirir: \"Only she loves him\" ile \"She loves only him\" farklıdır.", "Word order shifts emphasis: \"Only she loves him\" differs from \"She loves only him.\"", "gramer-inversion"),
    ("\"Uncopyrightable\" 15 harflidir ve hiçbir harfi tekrar etmez — İngilizcenin en uzun yaygın izogramlarından.", "\"Uncopyrightable\" has 15 letters and repeats none — one of English's longest common isograms.", "kelime"),
    ("Sessiz harfler İngilizce sözcüklerin çoğunda vardır; \"knight\" altı harf, üç ses.", "Silent letters hide in most English words: \"knight\" is six letters but three sounds.", "telaffuz-minimal-pairs"),

    # --- Sharp exam insights (accurate, specific) ---
    ("Digital SAT uyarlanır: ilk R&W modülünde iyi gidersen ikincisi zorlaşır ve en yüksek puan bandı ancak öyle açılır.", "The Digital SAT adapts: do well on module 1 and module 2 gets harder — that's the only path to the top score band.", "sat-soru-bankasi"),
    ("SAT dilbilgisinde \"NO CHANGE\" şıkkı diğerleri kadar sık doğrudur; refleksle eleme.", "On SAT grammar, \"NO CHANGE\" is correct about as often as any other option — don't reflexively rule it out.", "sat-soru-bankasi"),
    ("IELTS Reading'de cevaplar metinde neredeyse hep SIRAYLA gelir; 5. sorunun cevabı 4'ünkinden sonradır.", "IELTS Reading answers almost always appear in passage order — question 5's answer comes after question 4's.", "ielts-soru-bankasi"),
    ("IELTS'te en sık puan kaybı parlak dilde değil, görevi tam karşılamamakta (Task Response) olur.", "The most common IELTS band loss isn't weak language — it's not fully answering the task.", "ielts-ornek-sorular"),
    ("TOEFL Speaking'de ezber şablon fazla belli olursa puan düşer; içerik ve doğallık kazandırır.", "On TOEFL Speaking, an obvious memorized template lowers your score — content and naturalness win.", "toefl-soru-bankasi"),
    ("YDS'de her soru eşit puandır; uzun paragrafta takılmak yerine kolayları toplayıp sona dönmek daha çok net getirir.", "Every YDS question is worth the same — bank the easy ones and return to long passages for more net correct.", "yds-soru-bankasi"),
    ("SAT Math'te en çok puan, zor soruda değil, kolay soruda yapılan dikkatsiz hatanın önlenmesinde saklıdır.", "On SAT Math, the biggest gains come from not fumbling easy questions, not from cracking the hardest one.", "sat-soru-bankasi"),
    ("Çeldirici uzun ve ayrıntılı diye doğru değildir; iyi yazılmış sınavda uzunluk ipucu vermez, kanıt verir.", "A long, detailed option isn't the answer; in a well-built test, length is no clue — evidence is.", "sat-soru-bankasi"),
    ("Okuma sorusunda \"kısmen doğru\" şık en tehlikeli tuzaktır: bir kelimesi metinle çelişir.", "In reading questions the \"partly true\" option is the deadliest trap — one word contradicts the text.", "sat-soru-bankasi"),

    # --- Study science (accurate) ---
    ("Bir kelimeyi kalıcı kılmak için onu birçok farklı bağlamda görmen gerekir; izole liste hızla silinir.", "To make a word stick you must meet it in many contexts — an isolated list fades fast.", "kelime"),
    ("Yanlış çözdüğün soruyu bir gün sonra tekrar çöz: hafıza, tam unutmaya başladığında tekrar edince pekişir.", "Redo a missed question a day later — memory consolidates when you review just as forgetting begins.", "ogrenme-haritasi"),
    ("Deneme çözmek fotoğraf çeker; hata analizi ilerleme sağlar. Asıl çalışma denemeden SONRA başlar.", "A mock test takes a snapshot; reviewing mistakes creates progress. The real work starts after the test.", "sat-deneme"),
    ("Her gün 20 dakika, haftada bir 3 saatlik maratondan daha çok öğretir — süreklilik yoğunluğu yener.", "Twenty minutes daily teaches more than one three-hour weekend cram — consistency beats intensity.", "ogrenme-haritasi"),
    ("Konuyu okuduktan hemen sonra o konudan 5 soru çöz; öğrenmeyi teste bağlamak bilgiyi kilitler.", "Right after reading a topic, do 5 questions on it — linking learning to testing locks it in.", "konu-anlatimi"),
    ("Sesli okumak telaffuz ve akıcılığı aynı anda geliştirir; beyin duyduğu sesi daha iyi hatırlar.", "Reading aloud builds pronunciation and fluency at once — the brain remembers what it hears.", "telaffuz-connected-speech"),

    # --- Precise writing / usage tips ---
    ("Akademik yazıda \"very + sıfat\" yerine tek güçlü sözcük kullan: \"very important\" yerine \"crucial\".", "In academic writing, swap \"very + adjective\" for one strong word: \"very important\" becomes \"crucial.\"", "akademik-boosters"),
    ("İyi akademik cümle iddiayı yumuşatır: \"X causes Y\" yerine \"X is likely to contribute to Y\" (hedging).", "Strong academic writing hedges: not \"X causes Y\" but \"X is likely to contribute to Y.\"", "akademik-hedging"),
    ("Bağlaçlar fikirler arası köprüdür: \"however\", \"therefore\", \"nevertheless\" cümleye yön verir.", "Connectors bridge ideas: \"however,\" \"therefore,\" and \"nevertheless\" steer the reader.", "akademik-cohesion-coherence"),
    ("Nominalizasyon akademik tona yükseltir: \"they decided\" yerine \"their decision\".", "Nominalization lifts the academic tone: \"they decided\" becomes \"their decision.\"", "akademik-nominalization"),
    ("Kısa, net cümle uzun ve dolambaçlıdan güçlüdür; virgülle uzatmak zekâ değil risk taşır.", "A short, clear sentence beats a long, tangled one — stacking commas is risk, not sophistication.", "yazi-pratigi"),
    ("Paraphrase, IELTS ve TOEFL'ın gizli belkemiğidir: aynı fikri farklı sözcükler ve yapıyla kur.", "Paraphrasing is the quiet backbone of IELTS and TOEFL — same idea, new words and structure.", "akademik-paraphrasing"),
    ("IELTS yazıda dört paragraf yeter, asla beş: giriş, iki gelişme, sonuç. Fazlası zamanı yer.", "Four paragraphs is enough for IELTS writing, never five: intro, two bodies, conclusion.", "ielts-ornek-sorular"),

    # --- Advanced vocabulary (crisp, with a usage cue; no label) ---
    ("\"nuance\" — ince anlam farkı; akademik düşüncenin kalbi. \"a subtle nuance in tone\".", "\"nuance\" — a subtle difference in meaning; the heart of academic thinking.", "kelime"),
    ("\"mitigate\" — bir etkiyi hafifletmek. \"measures to mitigate the risk\".", "\"mitigate\" — to make something less severe: \"measures to mitigate the risk.\"", "kelime"),
    ("\"ubiquitous\" — her yerde bulunan. \"Smartphones are now ubiquitous.\"", "\"ubiquitous\" — found everywhere: \"Smartphones are now ubiquitous.\"", "kelime"),
    ("\"juxtapose\" — karşıtlığı görünür kılmak için yan yana koymak.", "\"juxtapose\" — to place side by side so a contrast stands out.", "kelime"),
    ("\"undermine\" — bir şeyi yavaşça, içten zayıflatmak. \"doubts that undermine trust\".", "\"undermine\" — to weaken something gradually from within.", "kelime"),
    ("\"compelling\" — karşı konulmaz derecede ikna edici. \"a compelling argument\".", "\"compelling\" — convincing in a way that's hard to resist.", "kelime"),
    ("\"scrutinize\" — en ince ayrıntısına dek incelemek.", "\"scrutinize\" — to examine in the closest detail.", "kelime"),
    ("\"inevitable\" — kaçınılmaz, önlenemez. Sonuç cümlelerinin gücü.", "\"inevitable\" — certain to happen and impossible to avoid.", "kelime"),
    ("\"plausible\" — kanıtı olmasa da akla yatkın, inandırıcı.", "\"plausible\" — believable and reasonable, even without proof.", "kelime"),
    ("\"arbitrary\" — mantığa değil keyfe dayalı. \"an arbitrary choice\".", "\"arbitrary\" — based on whim rather than reason.", "kelime"),
    ("\"coherent\" — parçaları mantıkla bağlanan; her sınav yazısının puan sözcüğü.", "\"coherent\" — logically connected throughout; a scoring quality in every exam essay.", "kelime"),
    ("\"ambiguous\" — birden çok anlama açık, belirsiz. Sınavda tehlikeli, edebiyatta değerli.", "\"ambiguous\" — open to more than one meaning: risky in exams, prized in literature.", "kelime"),
    ("\"redundant\" — gereksiz yere tekrar eden. İyi düzeltme, fazlalığı keser.", "\"redundant\" — needlessly repetitive; good editing cuts it.", "kelime"),
    ("\"prevalent\" — yaygın, baskın. \"a prevalent misconception\".", "\"prevalent\" — widespread and dominant: \"a prevalent misconception.\"", "kelime"),
    ("\"synthesize\" — dağınık parçaları tek bir bütünde birleştirmek. Command of Evidence'ın özü.", "\"synthesize\" — to combine scattered parts into one whole; the core of Command of Evidence.", "sat-soru-bankasi"),

    # --- Confusables / precision the exams reward ---
    ("\"fewer\" sayılabilenler için, \"less\" sayılamayanlar için: \"fewer cars, less traffic\".", "\"fewer\" for countables, \"less\" for uncountables: \"fewer cars, less traffic.\"", "gramer-countable-uncountable"),
    ("\"its\" iyeliktir, \"it's\" ise \"it is\"tir; kesme işareti sahiplik değil kısaltma demektir.", "\"its\" shows possession, \"it's\" means \"it is\" — the apostrophe marks a contraction, not ownership.", "gramer-articles"),
    ("\"who\" özne, \"whom\" nesnedir: \"Who called?\" ama \"To whom did you speak?\".", "\"who\" is the subject, \"whom\" the object: \"Who called?\" but \"To whom did you speak?\"", "gramer-linking-words"),
    ("\"imply\" konuşan ima eder, \"infer\" dinleyen çıkarım yapar; ikisi zıt uçlardadır.", "The speaker \"implies,\" the listener \"infers\" — they sit at opposite ends.", "kelime"),
    ("\"e.g.\" örnek verir, \"i.e.\" açıklar; ilki \"for example\", ikincisi \"that is\".", "\"e.g.\" gives an example, \"i.e.\" restates: one is \"for example,\" the other \"that is.\"", "akademik-citation-reporting-verbs"),

    # --- Motivational (kept few, and sharper) ---
    ("İlerleme hız değil süreklilik ödüllendirir; bugünkü küçük adım yarının eksiğini kapatır.", "Progress rewards consistency, not speed — today's small step closes tomorrow's gap.", "ogrenme-haritasi"),
    ("Zor sorular seni değil, hazırlığını sınar. Yanlış, bir sonraki doğrunun haritasıdır.", "Hard questions test your prep, not your worth — a wrong answer maps the next right one.", "soru-bankasi"),
    ("Bugün çözmediğin soru, sınavda karşına çıkacak boşluktur. Küçük ama düzenli ilerle.", "The question you skip today is the gap you meet on exam day — move steadily.", "soru-bankasi"),
    ("Hedefini yaz, yolu böl, her gün bir parça al; büyük sonuç küçük günlerin toplamıdır.", "Write the goal, split the path, take one piece daily — big results are the sum of small days.", "ogrenme-haritasi"),

    # --- Quick daily tasks (no "today's challenge" label, phrased as an invitation) ---
    ("Bir SAT Reading pasajı bitir ve yalnızca yanlışlarını gerekçesiyle not al.", "Finish one SAT Reading passage and log only your wrong answers with reasons.", "sat-soru-bankasi"),
    ("Beş yeni sözcüğü bugün kendi cümlelerinde kullan; bağlam, ezberden güçlüdür.", "Use five new words in your own sentences today — context beats memorization.", "kelime"),
    ("Bir IELTS Task 1'i 20 dakikada yaz, sonra kelime tekrarlarını işaretle.", "Write one IELTS Task 1 in 20 minutes, then mark your repeated words.", "yazi-pratigi"),
    ("Bir gramer konusunu bitir ve aynı konudan on soru çöz; köprüyü hemen kur.", "Finish one grammar topic and solve ten questions on it — build the bridge at once.", "konu-anlatimi"),
]

msgs = []
for tr, en, link in M:
    m = {"tr": tr, "en": en}
    if link:
        m["link"] = B + link
    msgs.append(m)

payload = {"enabled": True, "theme_bg": True, "bg": "", "messages": msgs}
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
