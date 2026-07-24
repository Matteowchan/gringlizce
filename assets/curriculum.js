/* Gri English . icerik agaci (veri kaynagi)
   Yeni sinav/unite/ders/arac eklemek = buraya veri eklemek.
   Build yok, sayfa bu veriyi client tarafinda render eder. */
(function(){
var IC={
  ogren:'<path d="M3 5h14v10H3z M7 9h6 M7 12h4" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round"/>',
  soru:'<path d="M10 2a6 6 0 016 6c0 3-3 4-3 6M10 16h.01" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round"/>',
  yazi:'<path d="M4 14l9-9 3 3-9 9H4z M12 6l2 2" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linejoin="round"/>',
  kelime:'<path d="M4 4h9v12H4z M13 7h3v9h-9" stroke="currentColor" stroke-width="1.6" fill="none"/>',
  deneme:'<path d="M4 3h10l2 2v12H4z M7 8h6 M7 11h6" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round"/>',
};
var EXAMS=[
 {id:"sat",name:"SAT",mark:"S",desc:"Digital SAT . Reading & Writing ve Math",pct:0,
  tools:[
    {ic:"yazi",label:"Ogren Modulu",desc:"Standard English Conventions dilbilgisi ve Words in Context kelime, konu konu 1000 soru, dört şıklı SAT formatı, açıklamalı. Ücretsiz.",href:"sat-ogren.html"},
    {ic:"soru",label:"Soru Bankasi",desc:"Reading & Writing ve Math soru bankası, kategori kategori çözüm ve açıklamalarla.",href:"sat-soru-bankasi.html"},
    {ic:"deneme",label:"Deneme",desc:"Mock 1-10, gerçek sınav formatında, adaptif ve puanlı.",href:"sat-mock-1.html"},
    {ic:"kelime",label:"Kelime",desc:"Words in Context kelime setleri, Türkçe karşılık ve SAT formatında quizler.",href:"sat-kelime.html"},
    {ic:"yazi",label:"Gramer Drill",desc:"Punctuation, boundaries, transitions ve daha fazlası. Türkçe açıklamalı driller.",href:"sat-grammar-drill.html"},
  ],
  sections:[{label:"Ogren . Reading & Writing",units:[
    {name:"Ünite 1 . Information and Ideas",desc:"Command of Evidence, Central Ideas, Inferences",state:"live",lessons:[
      {name:"Command of Evidence: Textual",s:"todo",href:"sat-unite-1.html"},
      {name:"Command of Evidence: Quantitative",s:"todo",href:"sat-unite-1.html"},
      {name:"Central Ideas and Details",s:"todo",href:"sat-unite-1.html"},
      {name:"Inferences",s:"todo",href:"sat-unite-1.html"},{name:"Ünite Geçiş Testi — 27 soru · %70 baraj",s:"todo",href:"sat-unite-test.html?unite=info&mode=checkpoint&form=A",ck:1}]},
    {name:"Ünite 2 . Craft and Structure",desc:"Words in Context, Text Structure, Cross-Text",state:"live",lessons:[
      {name:"Words in Context",s:"todo",href:"sat-unite-2.html"},
      {name:"Text Structure and Purpose",s:"todo",href:"sat-unite-2.html"},
      {name:"Cross-Text Connections",s:"todo",href:"sat-unite-2.html"},{name:"Ünite Geçiş Testi — 27 soru · %70 baraj",s:"todo",href:"sat-unite-test.html?unite=craft&mode=checkpoint&form=A",ck:1}]},
    {name:"Ünite 3 . Expression of Ideas",desc:"Transitions, Rhetorical Synthesis",state:"live",lessons:[
      {name:"Transitions",s:"todo",href:"sat-unite-3.html"},
      {name:"Rhetorical Synthesis",s:"todo",href:"sat-unite-3.html"},{name:"Ünite Geçiş Testi — 27 soru · %70 baraj",s:"todo",href:"sat-unite-test.html?unite=expression&mode=checkpoint&form=A",ck:1}]},
    {name:"Ünite 4 . Standard English Conventions",desc:"Boundaries, Form Structure and Sense",state:"live",lessons:[
      {name:"Boundaries",s:"todo",href:"sat-unite-4.html"},
      {name:"Form, Structure, and Sense",s:"todo",href:"sat-unite-4.html"},{name:"Ünite Geçiş Testi — 27 soru · %70 baraj",s:"todo",href:"sat-unite-test.html?unite=conventions&mode=checkpoint&form=A",ck:1},{name:"Final Deneme — 3 modül · 81 soru · puan tahmini",s:"todo",href:"sat-unite-test.html?unite=all&mode=final",fin:1}]}]},
      {label:"Ogren . Ucretsiz Soru Modulu",units:[
        {name:"Dilbilgisi",desc:"Standard English Conventions - noktalama, uyum, niteleyici, paralel yapi, zaman",state:"live",lessons:[
            {name:"Sentence Boundaries",s:"todo",href:"sat-ogren.html#g11"},
            {name:"Punctuation — Commas",s:"todo",href:"sat-ogren.html#g12"},
            {name:"Punctuation — Colons, Semicolons & Dashes",s:"todo",href:"sat-ogren.html#g13"},
            {name:"Subject–Verb Agreement",s:"todo",href:"sat-ogren.html#g14"},
            {name:"Pronoun Reference & Agreement",s:"todo",href:"sat-ogren.html#g15"},
            {name:"Modifiers — Dangling & Misplaced",s:"todo",href:"sat-ogren.html#g16"},
            {name:"Parallel Structure",s:"todo",href:"sat-ogren.html#g17"},
            {name:"Verb Tense & Mood",s:"todo",href:"sat-ogren.html#g18"},
            {name:"Relative Clauses & Subordination",s:"todo",href:"sat-ogren.html#g19"},
            {name:"Mixed Grammar Review",s:"todo",href:"sat-ogren.html#g110"},
            {name:"Boundaries in Paragraph Context",s:"todo",href:"sat-ogren.html#g21"},
            {name:"Commas — Advanced",s:"todo",href:"sat-ogren.html#g22"},
            {name:"Colons & Semicolons in Context",s:"todo",href:"sat-ogren.html#g23"},
            {name:"Agreement in Complex Sentences",s:"todo",href:"sat-ogren.html#g24"},
            {name:"Pronoun Clarity",s:"todo",href:"sat-ogren.html#g25"},
            {name:"Modifiers — Advanced",s:"todo",href:"sat-ogren.html#g26"},
            {name:"Parallel Structure II",s:"todo",href:"sat-ogren.html#g27"},
            {name:"Tense Consistency",s:"todo",href:"sat-ogren.html#g28"},
            {name:"Subordinate Clauses",s:"todo",href:"sat-ogren.html#g29"},
            {name:"Mixed Grammar Review II",s:"todo",href:"sat-ogren.html#g210"},
            {name:"Apostrophes & Possessives",s:"todo",href:"sat-ogren.html#g31"},
            {name:"Concision & Redundancy",s:"todo",href:"sat-ogren.html#g32"},
            {name:"Nonrestrictive vs Restrictive Elements",s:"todo",href:"sat-ogren.html#g33"},
            {name:"Indefinite Pronoun Agreement",s:"todo",href:"sat-ogren.html#g34"},
            {name:"Verb Forms — Gerunds, Infinitives, Participles",s:"todo",href:"sat-ogren.html#g35"},
            {name:"Faulty Comparisons",s:"todo",href:"sat-ogren.html#g36"},
            {name:"Sentence Combining — Reduction & Subordination",s:"todo",href:"sat-ogren.html#g37"},
            {name:"Style, Register & Tone Consistency",s:"todo",href:"sat-ogren.html#g38"},
            {name:"Pronoun Case — Who/Whom & Reflexives",s:"todo",href:"sat-ogren.html#g39"},
            {name:"Mixed Grammar Review III",s:"todo",href:"sat-ogren.html#g310"},
            {name:"Transitions in Paragraph Context",s:"todo",href:"sat-ogren.html#sp1"},
            {name:"Logical Sentence Placement",s:"todo",href:"sat-ogren.html#sp2"}]},
        {name:"Kelime",desc:"Words in Context - bağlamda kelime",state:"live",lessons:[
            {name:"Foundation Vocabulary",s:"todo",href:"sat-ogren.html#v1"},
            {name:"Academic & Scientific Vocabulary",s:"todo",href:"sat-ogren.html#v2"},
            {name:"Critical Thinking Vocabulary",s:"todo",href:"sat-ogren.html#v3"},
            {name:"Literature & Arts Vocabulary",s:"todo",href:"sat-ogren.html#v4"},
            {name:"Social & Political Vocabulary",s:"todo",href:"sat-ogren.html#v5"},
            {name:"Philosophical & Analytical Vocabulary",s:"todo",href:"sat-ogren.html#v6"},
            {name:"Argumentation & Logic Vocabulary",s:"todo",href:"sat-ogren.html#v7"},
            {name:"Historical & Institutional Vocabulary",s:"todo",href:"sat-ogren.html#v8"},
            {name:"Rhetoric & Expression Vocabulary",s:"todo",href:"sat-ogren.html#v9"},
            {name:"Mixed Review — Advanced Vocabulary",s:"todo",href:"sat-ogren.html#v10"}]}]}
,
{label:"Ogren . Math",units:[
    {name:"Math",desc:"Dört ana konu, konu konu çözümlü - 120 soru, dört şıklı, ücretsiz",state:"live",lessons:[
      {name:"SAT Math Yapisi",s:"todo",href:"sat-math.html#basla"},
      {name:"Heart of Algebra (30 soru)",s:"todo",href:"sat-math.html#algebra"},
      {name:"Problem Solving & Data (30 soru)",s:"todo",href:"sat-math.html#data"},
      {name:"Advanced Math (30 soru)",s:"todo",href:"sat-math.html#advanced"},
      {name:"Geometry & Trigonometri (30 soru)",s:"todo",href:"sat-math.html#geometry"}]}]}]},
 {id:"ielts",name:"IELTS",mark:"I",desc:"Academic . dört beceri, kelime, gramer",pct:0,
  tools:[
    {ic:"yazi",label:"Yazi Pratigi",desc:"Task 1 ve Task 2 için AI destekli geri bildirim, band tahmini ve paragraf paragraf analiz.",href:"ielts-bolum-calisma.html?bolum=writing"},
    {ic:"soru",label:"Pratik",desc:"Okuma, dinleme ve yazma denemeleri, bölüm bazlı çalışma.",href:"ielts-bolum-calisma.html"},
    {ic:"kelime",label:"Kelime",desc:"15 tematik quiz paketi, 150 kelime, otomatik puanlı.",href:"ielts-kelime.html"},
    {ic:"deneme",label:"Deneme",desc:"Tam uzunlukta IELTS deneme testleri.",href:"ielts-deneme.html"},
  ],
  sections:[{label:"Ogren . Beceriler",units:[
    {name:"Reading",desc:"11 soru tipi, 3 tam deneme, 120 soru",state:"live",lessons:[
      {name:"Strateji: Not Given ve paraphrase",s:"todo",href:"ielts-ogren-reading.html"},{name:"Üç tam deneme, 120 soru",s:"todo",href:"ielts-ogren-reading.html"}]},
    {name:"Writing",desc:"Task 1 ve Task 2 ayrı, bölüm bazlı denemeler",state:"live",lessons:[
      {name:"Task 1 . grafik betimleme",s:"todo",href:"ielts-writing-task1.html"},{name:"Task 2 . deneme yazma",s:"todo",href:"ielts-writing-task2.html"},{name:"Writing denemeleri . bölüm bazlı",s:"todo",href:"ielts-bolum-calisma.html?bolum=writing"}]},
    {name:"Listening",desc:"Öğren modülü ve bölüm bazlı denemeler",state:"live",lessons:[
      {name:"Öğren . yapı, soru tipleri ve kurallar",s:"todo",href:"ielts-ogren-listening.html"},{name:"Listening denemeleri . bölüm bazlı",s:"todo",href:"ielts-bolum-calisma.html?bolum=listening"}]},
    {name:"Speaking",desc:"Kayıt protokolü ve on iki kayıt görevi",state:"live",lessons:[
      {name:"Kayıt protokolü ve cevap iskeletleri",s:"todo",href:"ielts-ogren-speaking.html"},{name:"On iki kayıt görevi",s:"todo",href:"ielts-ogren-speaking.html"}]},
    {name:"Kelime",desc:"15 tema paketi, 150 kelime, otomatik puanlı quizler",state:"live",lessons:[
      {name:"15 kelime paketi ve quizler",s:"todo",href:"ielts-kelime.html"}]},
    {name:"Spelling ve Exact Wording",desc:"Yazım, çoğul, kelime sınırı ve homofon drilleri",state:"live",lessons:[
      {name:"Beş yazım ve exact wording drilli",s:"todo",href:"ielts-spelling.html"},
      {name:"Academic Kelime Yazımı (300 kelime, ipuçlu)",s:"todo",href:"toefl-ogren.html#spell1"}]},
    {name:"Gramer Doğruluğu",desc:"Yedi hata türü, 113 alıştırma",state:"live",lessons:[
      {name:"Yedi hata türü, 113 alıştırma",s:"todo",href:"ielts-gramer.html"}]}]}]},
 {id:"toefl",name:"TOEFL",mark:"T",desc:"iBT 2026 . adaptive, dört beceri",pct:0,
  tools:[{ic:"yazi",label:"Ogren",desc:"2026 formatı: Reading, Listening, Speaking (Listen and Repeat, Take an Interview) ve Writing (Email, Academic Discussion). Strateji + puanlı alıştırmalar.",href:"toefl-ogren.html"}],
  sections:[{label:"Ogren . 2026 Format",units:[
    {name:"Genel . 2026 Yapisi",desc:"Adaptive format, dört bölüm",state:"live",lessons:[
      {name:"2026 Yeni Format",s:"todo",href:"toefl-ogren.html#yapi"}]},
    {name:"Reading",desc:"Complete the Words, Daily Life, Academic Passage",state:"live",lessons:[
      {name:"Yapı ve Strateji",s:"todo",href:"toefl-ogren.html#read-genel"},
      {name:"Complete the Words & Daily Life",s:"todo",href:"toefl-ogren.html#read-words-daily"},
      {name:"Academic Passage",s:"todo",href:"toefl-ogren.html#read-academic"}]},
    {name:"Listening",desc:"Dört görev tipi, not alma",state:"live",lessons:[
      {name:"Dört Görev ve Not Alma",s:"todo",href:"toefl-ogren.html#listen-genel"},
      {name:"Announcement & Academic Talk",s:"todo",href:"toefl-ogren.html#listen-mono"},
      {name:"Choose a Response & Conversation",s:"todo",href:"toefl-ogren.html#listen-dialog"}]},
    {name:"Speaking",desc:"Listen and Repeat, Take an Interview",state:"live",lessons:[
      {name:"Kriterler ve IRT",s:"todo",href:"toefl-ogren.html#speak-genel"},
      {name:"Listen and Repeat",s:"todo",href:"toefl-ogren.html#speak-repeat"},
      {name:"Take an Interview",s:"todo",href:"toefl-ogren.html#speak-interview"}]},
    {name:"Writing",desc:"Build a Sentence, Email, Academic Discussion",state:"live",lessons:[
      {name:"Üç Görev ve Build a Sentence",s:"todo",href:"toefl-ogren.html#write-genel"},
      {name:"Write an Email",s:"todo",href:"toefl-ogren.html#write-email"},
      {name:"Academic Discussion",s:"todo",href:"toefl-ogren.html#write-discussion"}]},
    {name:"Kelime Yazımı (Academic Vocabulary)",desc:"Türkçe anlamdan kelimeyi yaz - ilk harf + eş/zıt anlam ipucu, 300 kelime",state:"live",lessons:[
      {name:"Academic Verbs",s:"todo",href:"toefl-ogren.html#spell1"},
      {name:"Research & Analysis",s:"todo",href:"toefl-ogren.html#spell2"},
      {name:"Social Science & Society",s:"todo",href:"toefl-ogren.html#spell3"},
      {name:"Science & Technology",s:"todo",href:"toefl-ogren.html#spell4"},
      {name:"Academic Adjectives & Adverbs",s:"todo",href:"toefl-ogren.html#spell5"},
      {name:"Advanced Academic & TOEFL",s:"todo",href:"toefl-ogren.html#spell6"}]}
  ]},
  {label:"Alistir . Pratik",units:[
    {name:"Spelling ve Kelime Yazımı",desc:"Akademik kelime yazımı, word form, Complete the Words - 40 puanlı madde",state:"live",lessons:[
      {name:"Dört yazım drilli, 40 madde",s:"todo",href:"toefl-spelling.html"}]},
    {name:"Gramer Drill",desc:"Altı konu, 30 çoktan seçmeli, Türkçe açıklamalı",state:"live",lessons:[
      {name:"Altı konu, 30 soru",s:"todo",href:"toefl-grammar-drill.html"}]},
    {name:"Writing (Gri AI)",desc:"Email ve Academic Discussion, anlık ETS holistik (0-5) değerlendirme",state:"live",lessons:[
      {name:"3 Email + 3 Academic Discussion",s:"todo",href:"toefl-writing.html"}]}
  ]}]},
 {id:"ib",name:"IB English B",mark:"IB",desc:"SL ve HL . Paper 1, 14 metin türü + Gri AI",pct:0,
  tools:[{ic:"soru",label:"Metin turleri",desc:"14 metin türü (makale, blog, günlük, röportaj, haber, inceleme, rapor, öneri, yönerge, deneme...). Her biri sözleşme + model + Gri AI'li yazma sihirbazı.",href:"ib-ogren.html"},
    {ic:"deneme",label:"Paper 1 & Paper 2",desc:"HL ve SL için bölüm bazlı sınav pratiği: Paper 1 yazılı üretim (Gri AI), Paper 2 okuma anlama (otomatik puanlama).",href:"ib-english-b-hl.html"}],
  sections:[{label:"Ogren . Paper 1",units:[
    {name:"Giriş ve Kriterler",desc:"Paper 1, A/B/C kriterleri, tur secimi",state:"live",lessons:[
      {name:"Paper 1 ve Kriterler",s:"todo",href:"ib-ogren.html#basla"},
      {name:"Karsilastirma Tablosu",s:"todo",href:"ib-ogren.html#karsilastirma"}]},
    {name:"Kisisel Turler",desc:"Blog, günlük, gayriresmi mektup",state:"live",lessons:[
      {name:"Blog / Günlük",s:"todo",href:"ib-ogren.html#t-blog"},
      {name:"Günlük (Diary)",s:"todo",href:"ib-ogren.html#t-diary"},
      {name:"Gayriresmi Mektup / E-posta",s:"todo",href:"ib-ogren.html#t-informal"},
      {name:"Sosyal Medya Gonderisi",s:"todo",href:"ib-ogren.html#t-social"}]},
    {name:"Profesyonel Turler",desc:"Resmi mektup, rapor, öneri, yönerge, deneme",state:"live",lessons:[
      {name:"Resmi Mektup / E-posta",s:"todo",href:"ib-ogren.html#t-letter"},
      {name:"Resmi Rapor (Report)",s:"todo",href:"ib-ogren.html#t-report"},
      {name:"Öneri (Proposal, HL)",s:"todo",href:"ib-ogren.html#t-proposal"},
      {name:"Yönerge (Instructions)",s:"todo",href:"ib-ogren.html#t-instructions"},
      {name:"Deneme (Essay)",s:"todo",href:"ib-ogren.html#t-essay"}]},
    {name:"Kitle Iletisim Turleri",desc:"Makale, konuşma, broşür, görüş, röportaj, haber, inceleme",state:"live",lessons:[
      {name:"Makale (Article)",s:"todo",href:"ib-ogren.html#t-article"},
      {name:"Konuşma (Speech)",s:"todo",href:"ib-ogren.html#t-speech"},
      {name:"Broşür / Leaflet",s:"todo",href:"ib-ogren.html#t-brochure"},
      {name:"Görüş Yazısı (Opinion Column)",s:"todo",href:"ib-ogren.html#t-opinion"},
      {name:"Röportaj (Interview)",s:"todo",href:"ib-ogren.html#t-interview"},
      {name:"Haber (News Report)",s:"todo",href:"ib-ogren.html#t-news"},
      {name:"Inceleme (Review)",s:"todo",href:"ib-ogren.html#t-review"},
      {name:"Reklam (Advertisement)",s:"todo",href:"ib-ogren.html#t-ad"},
      {name:"Web Sayfasi (Web Page)",s:"todo",href:"ib-ogren.html#t-webpage"}]},
    {name:"Writing",desc:"Paper 1 yazma + Gri AI değerlendirme",state:"live",lessons:[
      {name:"Paper 1 Yazma",s:"todo",href:"ib-ogren.html#paper1"}]}
  ]}]},
 {id:"deutsch",name:"Deutsch B",mark:"DE",desc:"IB Almanca . Paper 1, 15 Textsorte + model",pct:0,
  tools:[{ic:"soru",label:"Textsorten",desc:"15 Alman metin türü (Blog, Brief, Bericht, Artikel, Rede, Rezension...). Her biri sözleşme + adım-adım + Almanca model + öz-kontrol.",href:"deutsch-ogren.html"}],
  sections:[{label:"Ogren . Paper 1",units:[
    {name:"Giriş ve Kriterler",desc:"Paper 1, A/B/C kriterleri, du/Sie",state:"live",lessons:[
      {name:"Paper 1 ve Kriterler",s:"todo",href:"deutsch-ogren.html#basla"},
      {name:"Karsilastirma Tablosu",s:"todo",href:"deutsch-ogren.html#karsilastirma"}]},
    {name:"Kisisel Turler",desc:"Blog, Tagebuch, informeller Brief",state:"live",lessons:[
      {name:"Blog",s:"todo",href:"deutsch-ogren.html#t-blog"},
      {name:"Tagebuch (Günlük)",s:"todo",href:"deutsch-ogren.html#t-tagebuch"},
      {name:"Informeller Brief",s:"todo",href:"deutsch-ogren.html#t-informell"}]},
    {name:"Profesyonel Turler",desc:"Brief, Bericht, Vorschlag, Anleitung, Aufsatz",state:"live",lessons:[
      {name:"Formeller Brief",s:"todo",href:"deutsch-ogren.html#t-formell"},
      {name:"Bericht (Rapor)",s:"todo",href:"deutsch-ogren.html#t-bericht"},
      {name:"Vorschlag (Öneri, HL)",s:"todo",href:"deutsch-ogren.html#t-vorschlag"},
      {name:"Anleitung (Yönerge)",s:"todo",href:"deutsch-ogren.html#t-anleitung"},
      {name:"Aufsatz (Deneme, SL)",s:"todo",href:"deutsch-ogren.html#t-aufsatz"}]},
    {name:"Kitle Iletisim Turleri",desc:"Artikel, Rede, Broschuere, Kommentar, Interview, Nachricht, Rezension",state:"live",lessons:[
      {name:"Artikel (Makale)",s:"todo",href:"deutsch-ogren.html#t-artikel"},
      {name:"Rede (Konuşma)",s:"todo",href:"deutsch-ogren.html#t-rede"},
      {name:"Broschuere / Flyer",s:"todo",href:"deutsch-ogren.html#t-broschuere"},
      {name:"Meinungsartikel / Kommentar",s:"todo",href:"deutsch-ogren.html#t-meinung"},
      {name:"Interview (Röportaj)",s:"todo",href:"deutsch-ogren.html#t-interview"},
      {name:"Nachrichtenbericht (Haber)",s:"todo",href:"deutsch-ogren.html#t-nachricht"},
      {name:"Rezension (Inceleme)",s:"todo",href:"deutsch-ogren.html#t-rezension"}]},
    {name:"Writing",desc:"Paper 1 yazma + model",state:"live",lessons:[
      {name:"Paper 1 Yazma",s:"todo",href:"deutsch-ogren.html#paper1"}]}
  ]}]},
 {id:"tok",name:"TOK",mark:"TK",desc:"Theory of Knowledge . Essay + Exhibition",pct:0,
  tools:[{ic:"yazi",label:"TOK Rehberi",desc:"Bilgi Soruları, AOK'lar, TOK Essay ve Exhibition için adım-adım rehber + model metinler ve yazma sihirbazları.",href:"tok-ogren.html"}],
  sections:[{label:"Ogren",units:[
    {name:"Temeller",desc:"TOK nedir, Knowledge Questions, AOK'lar",state:"live",lessons:[
      {name:"TOK Nedir?",s:"todo",href:"tok-ogren.html#basla"},
      {name:"Knowledge Questions",s:"todo",href:"tok-ogren.html#bilgi-sorulari"},
      {name:"AOK'lar ve Çekirdek Tema",s:"todo",href:"tok-ogren.html#aok"}]},
    {name:"Değerlendirme",desc:"Essay ve Exhibition",state:"live",lessons:[
      {name:"TOK Essay Nasil Yazilir",s:"todo",href:"tok-ogren.html#essay"},
      {name:"TOK Exhibition Nasil Yapilir",s:"todo",href:"tok-ogren.html#exhibition"}]}
  ]}]},
 {id:"udsp",name:"UDSP",mark:"U",desc:"Almanca + İngilizce . 8 tema paketi",pct:0,
  tools:[{ic:"kelime",label:"Kelime",desc:"8 tema paketi (Alltag, Schule, Reisen, Essen, Familie, Natur, Stadt, Arbeit). Almanca-İngilizce-Türkçe + eşleştirme quizleri.",href:"udsp-ogren.html"}],
  sections:[{label:"Ogren",units:[
    {name:"Kelime Paketleri",desc:"Almanca-İngilizce, tema tema, quizli",state:"live",lessons:[
      {name:"UDSP Hakkinda",s:"todo",href:"udsp-ogren.html#basla"},
      {name:"1. Alltag (Günlük)",s:"todo",href:"udsp-ogren.html#p1"},
      {name:"2. Schule (Okul)",s:"todo",href:"udsp-ogren.html#p2"},
      {name:"3. Reisen (Seyahat)",s:"todo",href:"udsp-ogren.html#p3"},
      {name:"4. Essen und Trinken",s:"todo",href:"udsp-ogren.html#p4"},
      {name:"5. Familie und Menschen",s:"todo",href:"udsp-ogren.html#p5"},
      {name:"6. Natur und Wetter",s:"todo",href:"udsp-ogren.html#p6"},
      {name:"7. Stadt und Verkehr",s:"todo",href:"udsp-ogren.html#p7"},
      {name:"8. Arbeit und Zeit",s:"todo",href:"udsp-ogren.html#p8"}]}
  ]}]},
 {id:"ydt",name:"YDT",mark:"Y",desc:"Yabancı Dil . tüm soru tipleri, beş şıklı",pct:0,
  tools:[{ic:"soru",label:"Drilller",desc:"Kelime, dilbilgisi, bağlaç, cloze, cümle tamamlama, diyalog, restatement, çeviri ve paragraf drilleri. Beş şıklı, puanlı.",href:"ydt-ogren.html"}],
  sections:[{label:"Ogren",units:[
    {name:"Yapı ve Strateji",desc:"YDT yapisi, puanlama, taktik",state:"live",lessons:[
      {name:"YDT Yapisi",s:"todo",href:"ydt-ogren.html#basla"}]},
    {name:"Dil Bilgisi ve Kelime",desc:"Kelime, dilbilgisi, bağlaçlar",state:"live",lessons:[
      {name:"Kelime",s:"todo",href:"ydt-ogren.html#kelime"},
      {name:"Dilbilgisi",s:"todo",href:"ydt-ogren.html#dilbilgisi"},
      {name:"Bağlaçlar ve Geçişler",s:"todo",href:"ydt-ogren.html#baglac"}]},
    {name:"Soru Tipleri",desc:"Cloze, cümle tamamlama, diyalog, restatement, çeviri, paragraf",state:"live",lessons:[
      {name:"Cloze Test",s:"todo",href:"ydt-ogren.html#cloze"},
      {name:"Cümle Tamamlama",s:"todo",href:"ydt-ogren.html#cumletam"},
      {name:"Diyalog Tamamlama",s:"todo",href:"ydt-ogren.html#diyalog"},
      {name:"Restatement",s:"todo",href:"ydt-ogren.html#restatement"},
      {name:"Çeviri",s:"todo",href:"ydt-ogren.html#ceviri"},
      {name:"Paragraf",s:"todo",href:"ydt-ogren.html#paragraf"},
      {name:"Koşul Cümleleri",s:"todo",href:"ydt-ogren.html#conditionals"},
      {name:"Kip Fiilleri (Modals)",s:"todo",href:"ydt-ogren.html#modals"},
      {name:"İlgi Cümlecikleri (Relative Clauses)",s:"todo",href:"ydt-ogren.html#relative"},
      {name:"Zamanlar (Tenses)",s:"todo",href:"ydt-ogren.html#tenses"}]}
  ]}]},
 {id:"yds",name:"YDS / YOKDIL",mark:"Y",desc:"Akademik . tüm soru tipleri, beş şıklı",pct:0,
  tools:[{ic:"soru",label:"Drilller",desc:"Akademik kelime, dilbilgisi, bağlaç, cloze, cümle tamamlama, restatement, çeviri, paragraf ve diyalog drilleri. Beş şıklı, puanlı.",href:"yds-ogren.html"}],
  sections:[{label:"Ogren",units:[
    {name:"Yapı ve Strateji",desc:"YDS/YOKDIL yapisi, puanlama",state:"live",lessons:[
      {name:"YDS / YOKDIL Yapisi",s:"todo",href:"yds-ogren.html#basla"}]},
    {name:"Dil Bilgisi ve Kelime",desc:"Akademik kelime, dilbilgisi, bağlaçlar",state:"live",lessons:[
      {name:"Akademik Kelime",s:"todo",href:"yds-ogren.html#kelime"},
      {name:"Dilbilgisi",s:"todo",href:"yds-ogren.html#dilbilgisi"},
      {name:"Bağlaçlar",s:"todo",href:"yds-ogren.html#baglac"}]},
    {name:"Soru Tipleri",desc:"Cloze, cümle tamamlama, restatement, çeviri, paragraf, diyalog",state:"live",lessons:[
      {name:"Cloze Test",s:"todo",href:"yds-ogren.html#cloze"},
      {name:"Cümle Tamamlama",s:"todo",href:"yds-ogren.html#cumletam"},
      {name:"Restatement",s:"todo",href:"yds-ogren.html#restatement"},
      {name:"Çeviri",s:"todo",href:"yds-ogren.html#ceviri"},
      {name:"Paragraf",s:"todo",href:"yds-ogren.html#paragraf"},
      {name:"Diyalog Tamamlama",s:"todo",href:"yds-ogren.html#diyalog"},
      {name:"Mini Deneme 1",s:"todo",href:"yds-ogren.html#deneme1"},
      {name:"Mini Deneme 2",s:"todo",href:"yds-ogren.html#deneme2"},
      {name:"Mini Deneme 3",s:"todo",href:"yds-ogren.html#deneme3"}]}
  ]}]},
];
  window.GRI_DATA = { IC: IC, EXAMS: EXAMS,
    PULSE: { overall: 0, streak: 0, weekLessons: 0, newBadges: 0 } };
  window.GRI_INFO = null; // gercek launch-banner korunur; ileride admin kaynagina baglanir
  window.GRI_NAV = [
    { label: "Öğrenme Haritası", href: "ogrenme-haritasi.html" },
    { label: "Soru Bankası", href: "soru-bankasi.html", children: [
      { label: "SAT", href: "sat-soru-bankasi.html", children: [
        { label: "Reading & Writing", href: "sat-soru-bankasi-rw.html" },
        { label: "Math", href: "sat-soru-bankasi-math.html" } ] },
      { label: "IELTS", href: "ielts-soru-bankasi.html", children: [
        { label: "Tam Deneme", href: "ielts-deneme.html" },
        { label: "Bölüm Bazlı", href: "ielts-bolum-calisma.html" } ] },
      { label: "TOEFL", href: "toefl-soru-bankasi.html" },
      { label: "UDSP", href: "udsp-soru-bankasi.html" },
      { label: "YDT", href: "ydt-soru-bankasi.html" },
      { label: "YDS / YÖKDİL", href: "yds-soru-bankasi.html", children: [
        { label: "YDS", href: "yds-soru-bankasi-yds.html" },
        { label: "YÖKDİL Fen", href: "yds-soru-bankasi-yokdil-fen.html" },
        { label: "YÖKDİL Sosyal", href: "yds-soru-bankasi-yokdil-sosyal.html" },
        { label: "YÖKDİL Sağlık", href: "yds-soru-bankasi-yokdil-saglik.html" } ] }
    ] },
    { label: "Kelime Bankası", href: "kelime-bankasi.html" },
    { label: "Yazı Pratiği", href: "yazi-pratigi.html" },
    { label: "Sınıflarım", href: "sinifim.html" },
    { label: "Genel İngilizce", href: "genel-ingilizce.html", children: [
      { label: "Seviyeler", href: "genel-ingilizce.html" },
      { label: "Exercises", href: "genel-odevler.html" } ] },
    { label: "Seviye Belirleme", href: "seviye-belirleme.html" },
    { label: "AI Detector", href: "ai-araclari.html" },
    { label: "Çalışma Paketleri", href: "calisma-paketleri.html" },
    { label: "Blog", href: "blog.html", children: [
      { label: "SAT", href: "blog-sat.html" },
      { label: "IELTS", href: "blog-ielts.html" },
      { label: "TOEFL", href: "blog-toefl.html" },
      { label: "YDS / YÖKDİL", href: "blog-yds.html" },
      { label: "YDT", href: "blog-ydt.html" },
      { label: "IB English B", href: "blog-ib-english.html" },
      { label: "Deutsch B", href: "blog-deutsch.html" },
      { label: "TOK", href: "blog-tok.html" }
    ] },
    { label: "Bize Ulaşın", href: "iletisim.html" }
  ];
})();
