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
 {id:"sat",big:true,name:"SAT",mark:"S",desc:"Digital SAT . Reading & Writing ve Math",pct:0,
  tools:[
    {ic:"soru",label:"Soru Bankasi",desc:"Reading & Writing ve Math soru bankasi, kategori kategori cozum ve aciklamalarla.",href:"sat-soru-bankasi.html"},
    {ic:"deneme",label:"Deneme",desc:"Mock 1-10, gercek sinav formatinda, adaptif ve puanli.",href:"sat-mock-1.html"},
    {ic:"kelime",label:"Kelime",desc:"Words in Context kelime setleri, Turkce karsilik ve SAT formatinda quizler.",href:"sat-kelime.html"},
    {ic:"yazi",label:"Gramer Drill",desc:"Punctuation, boundaries, transitions ve daha fazlasi. Turkce aciklamali drilller.",href:"sat-grammar-drill.html"},
  ],
  sections:[{label:"Ogren . Reading & Writing",units:[
    {name:"Unite 1 . Information and Ideas",desc:"Command of Evidence, Central Ideas, Inferences",state:"live",lessons:[
      {name:"Command of Evidence: Textual",s:"todo",href:"sat-unite-1.html"},
      {name:"Command of Evidence: Quantitative",s:"todo",href:"sat-unite-1.html"},
      {name:"Central Ideas and Details",s:"todo",href:"sat-unite-1.html"},
      {name:"Inferences",s:"todo",href:"sat-unite-1.html"}]},
    {name:"Unite 2 . Craft and Structure",desc:"Words in Context, Text Structure, Cross-Text",state:"live",lessons:[
      {name:"Words in Context",s:"todo",href:"sat-unite-2.html"},
      {name:"Text Structure and Purpose",s:"todo",href:"sat-unite-2.html"},
      {name:"Cross-Text Connections",s:"todo",href:"sat-unite-2.html"}]},
    {name:"Unite 3 . Expression of Ideas",desc:"Transitions, Rhetorical Synthesis",state:"live",lessons:[
      {name:"Transitions",s:"todo",href:"sat-unite-3.html"},
      {name:"Rhetorical Synthesis",s:"todo",href:"sat-unite-3.html"}]},
    {name:"Unite 4 . Standard English Conventions",desc:"Boundaries, Form Structure and Sense",state:"live",lessons:[
      {name:"Boundaries",s:"todo",href:"sat-unite-4.html"},
      {name:"Form, Structure, and Sense",s:"todo",href:"sat-unite-4.html"}]}]},
   {label:"Ogren . Math",units:[
    {name:"Math",desc:"Algebra, veri, ileri matematik, geometri",state:"live",lessons:[{name:"Dort konu drilleri",s:"todo",href:"sat-math.html"}]}]}]},
 {id:"ielts",big:true,name:"IELTS",mark:"I",desc:"Academic . dort beceri, kelime, gramer",pct:0,
  tools:[
    {ic:"yazi",label:"Yazi Pratigi",desc:"Task 1 ve Task 2 icin AI destekli geri bildirim, band tahmini ve paragraf paragraf analiz.",href:"ielts-bolum-calisma.html?bolum=writing"},
    {ic:"soru",label:"Pratik",desc:"Okuma, dinleme ve yazma denemeleri, bolum bazli calisma.",href:"ielts-bolum-calisma.html"},
    {ic:"kelime",label:"Kelime",desc:"15 tematik quiz paketi, 150 kelime, otomatik puanli.",href:"ielts-kelime.html"},
    {ic:"deneme",label:"Deneme",desc:"Tam uzunlukta IELTS deneme testleri.",href:"ielts-deneme.html"},
  ],
  sections:[{label:"Ogren . Beceriler",units:[
    {name:"Reading",desc:"11 soru tipi, 3 tam deneme, 120 soru",state:"live",lessons:[
      {name:"Strateji: Not Given ve paraphrase",s:"todo",href:"ielts-ogren-reading.html"},{name:"Uc tam deneme, 120 soru",s:"todo",href:"ielts-ogren-reading.html"}]},
    {name:"Writing",desc:"Task 1 ve Task 2 ayri, bolum bazli denemeler",state:"live",lessons:[
      {name:"Task 1 . grafik betimleme",s:"todo",href:"ielts-writing-task1.html"},{name:"Task 2 . deneme yazma",s:"todo",href:"ielts-writing-task2.html"},{name:"Writing denemeleri . bolum bazli",s:"todo",href:"ielts-bolum-calisma.html?bolum=writing"}]},
    {name:"Listening",desc:"Ogren modulu ve bolum bazli denemeler",state:"live",lessons:[
      {name:"Ogren . yapi, soru tipleri ve kurallar",s:"todo",href:"ielts-ogren-listening.html"},{name:"Listening denemeleri . bolum bazli",s:"todo",href:"ielts-bolum-calisma.html?bolum=listening"}]},
    {name:"Speaking",desc:"Kayit protokolu ve on iki kayit gorevi",state:"live",lessons:[
      {name:"Kayit protokolu ve cevap iskeletleri",s:"todo",href:"ielts-ogren-speaking.html"},{name:"On iki kayit gorevi",s:"todo",href:"ielts-ogren-speaking.html"}]},
    {name:"Kelime",desc:"15 tema paketi, 150 kelime, otomatik puanli quizler",state:"live",lessons:[
      {name:"15 kelime paketi ve quizler",s:"todo",href:"ielts-kelime.html"}]},
    {name:"Spelling ve Exact Wording",desc:"Yazim, cogul, kelime siniri ve homofon drilleri",state:"live",lessons:[
      {name:"Bes yazim ve exact wording drilli",s:"todo",href:"ielts-spelling.html"}]},
    {name:"Gramer Dogrulugu",desc:"Yedi hata turu, 113 alistirma",state:"live",lessons:[
      {name:"Yedi hata turu, 113 alistirma",s:"todo",href:"ielts-gramer.html"}]}]}]},
 {id:"toefl",name:"TOEFL",mark:"T",desc:"iBT 2026 . adaptive, dort beceri",pct:0,
  tools:[{ic:"yazi",label:"Ogren",desc:"2026 formati: Reading, Listening, Speaking (Listen and Repeat, Take an Interview) ve Writing (Email, Academic Discussion). Strateji + puanli alistirmalar.",href:"toefl-ogren.html"}],
  sections:[{label:"Ogren . 2026 Format",units:[
    {name:"Genel . 2026 Yapisi",desc:"Adaptive format, dort bolum",state:"live",lessons:[
      {name:"2026 Yeni Format",s:"todo",href:"toefl-ogren.html#yapi"}]},
    {name:"Reading",desc:"Complete the Words, Daily Life, Academic Passage",state:"live",lessons:[
      {name:"Yapi ve Strateji",s:"todo",href:"toefl-ogren.html#read-genel"},
      {name:"Complete the Words & Daily Life",s:"todo",href:"toefl-ogren.html#read-words-daily"},
      {name:"Academic Passage",s:"todo",href:"toefl-ogren.html#read-academic"}]},
    {name:"Listening",desc:"Dort gorev tipi, not alma",state:"live",lessons:[
      {name:"Dort Gorev ve Not Alma",s:"todo",href:"toefl-ogren.html#listen-genel"},
      {name:"Announcement & Academic Talk",s:"todo",href:"toefl-ogren.html#listen-mono"},
      {name:"Choose a Response & Conversation",s:"todo",href:"toefl-ogren.html#listen-dialog"}]},
    {name:"Speaking",desc:"Listen and Repeat, Take an Interview",state:"live",lessons:[
      {name:"Kriterler ve IRT",s:"todo",href:"toefl-ogren.html#speak-genel"},
      {name:"Listen and Repeat",s:"todo",href:"toefl-ogren.html#speak-repeat"},
      {name:"Take an Interview",s:"todo",href:"toefl-ogren.html#speak-interview"}]},
    {name:"Writing",desc:"Build a Sentence, Email, Academic Discussion",state:"live",lessons:[
      {name:"Uc Gorev ve Build a Sentence",s:"todo",href:"toefl-ogren.html#write-genel"},
      {name:"Write an Email",s:"todo",href:"toefl-ogren.html#write-email"},
      {name:"Academic Discussion",s:"todo",href:"toefl-ogren.html#write-discussion"}]}
  ]}]},
 {id:"ib",name:"IB English B",mark:"IB",desc:"SL ve HL . Paper 1, 14 metin turu + Gri AI",pct:0,
  tools:[{ic:"soru",label:"Metin turleri",desc:"14 metin turu (makale, blog, gunluk, roportaj, haber, inceleme, rapor, oneri, yonerge, deneme...). Her biri sozlesme + model + Gri AI'li yazma sihirbazi.",href:"ib-ogren.html"}],
  sections:[{label:"Ogren . Paper 1",units:[
    {name:"Giris ve Kriterler",desc:"Paper 1, A/B/C kriterleri, tur secimi",state:"live",lessons:[
      {name:"Paper 1 ve Kriterler",s:"todo",href:"ib-ogren.html#basla"},
      {name:"Karsilastirma Tablosu",s:"todo",href:"ib-ogren.html#karsilastirma"}]},
    {name:"Kisisel Turler",desc:"Blog, gunluk, gayriresmi mektup",state:"live",lessons:[
      {name:"Blog / Gunluk",s:"todo",href:"ib-ogren.html#t-blog"},
      {name:"Gunluk (Diary)",s:"todo",href:"ib-ogren.html#t-diary"},
      {name:"Gayriresmi Mektup / E-posta",s:"todo",href:"ib-ogren.html#t-informal"},
      {name:"Sosyal Medya Gonderisi",s:"todo",href:"ib-ogren.html#t-social"}]},
    {name:"Profesyonel Turler",desc:"Resmi mektup, rapor, oneri, yonerge, deneme",state:"live",lessons:[
      {name:"Resmi Mektup / E-posta",s:"todo",href:"ib-ogren.html#t-letter"},
      {name:"Resmi Rapor (Report)",s:"todo",href:"ib-ogren.html#t-report"},
      {name:"Oneri (Proposal, HL)",s:"todo",href:"ib-ogren.html#t-proposal"},
      {name:"Yonerge (Instructions)",s:"todo",href:"ib-ogren.html#t-instructions"},
      {name:"Deneme (Essay)",s:"todo",href:"ib-ogren.html#t-essay"}]},
    {name:"Kitle Iletisim Turleri",desc:"Makale, konusma, brosur, gorus, roportaj, haber, inceleme",state:"live",lessons:[
      {name:"Makale (Article)",s:"todo",href:"ib-ogren.html#t-article"},
      {name:"Konusma (Speech)",s:"todo",href:"ib-ogren.html#t-speech"},
      {name:"Brosur / Leaflet",s:"todo",href:"ib-ogren.html#t-brochure"},
      {name:"Gorus Yazisi (Opinion Column)",s:"todo",href:"ib-ogren.html#t-opinion"},
      {name:"Roportaj (Interview)",s:"todo",href:"ib-ogren.html#t-interview"},
      {name:"Haber (News Report)",s:"todo",href:"ib-ogren.html#t-news"},
      {name:"Inceleme (Review)",s:"todo",href:"ib-ogren.html#t-review"},
      {name:"Reklam (Advertisement)",s:"todo",href:"ib-ogren.html#t-ad"},
      {name:"Web Sayfasi (Web Page)",s:"todo",href:"ib-ogren.html#t-webpage"}]},
    {name:"Writing",desc:"Paper 1 yazma + Gri AI degerlendirme",state:"live",lessons:[
      {name:"Paper 1 Yazma",s:"todo",href:"ib-ogren.html#paper1"}]}
  ]}]},
 {id:"deutsch",name:"Deutsch B",mark:"DE",desc:"IB Almanca . Paper 1, 15 Textsorte + model",pct:0,
  tools:[{ic:"soru",label:"Textsorten",desc:"15 Alman metin turu (Blog, Brief, Bericht, Artikel, Rede, Rezension...). Her biri sozlesme + adim-adim + Almanca model + oz-kontrol.",href:"deutsch-ogren.html"}],
  sections:[{label:"Ogren . Paper 1",units:[
    {name:"Giris ve Kriterler",desc:"Paper 1, A/B/C kriterleri, du/Sie",state:"live",lessons:[
      {name:"Paper 1 ve Kriterler",s:"todo",href:"deutsch-ogren.html#basla"},
      {name:"Karsilastirma Tablosu",s:"todo",href:"deutsch-ogren.html#karsilastirma"}]},
    {name:"Kisisel Turler",desc:"Blog, Tagebuch, informeller Brief",state:"live",lessons:[
      {name:"Blog",s:"todo",href:"deutsch-ogren.html#t-blog"},
      {name:"Tagebuch (Gunluk)",s:"todo",href:"deutsch-ogren.html#t-tagebuch"},
      {name:"Informeller Brief",s:"todo",href:"deutsch-ogren.html#t-informell"}]},
    {name:"Profesyonel Turler",desc:"Brief, Bericht, Vorschlag, Anleitung, Aufsatz",state:"live",lessons:[
      {name:"Formeller Brief",s:"todo",href:"deutsch-ogren.html#t-formell"},
      {name:"Bericht (Rapor)",s:"todo",href:"deutsch-ogren.html#t-bericht"},
      {name:"Vorschlag (Oneri, HL)",s:"todo",href:"deutsch-ogren.html#t-vorschlag"},
      {name:"Anleitung (Yonerge)",s:"todo",href:"deutsch-ogren.html#t-anleitung"},
      {name:"Aufsatz (Deneme, SL)",s:"todo",href:"deutsch-ogren.html#t-aufsatz"}]},
    {name:"Kitle Iletisim Turleri",desc:"Artikel, Rede, Broschuere, Kommentar, Interview, Nachricht, Rezension",state:"live",lessons:[
      {name:"Artikel (Makale)",s:"todo",href:"deutsch-ogren.html#t-artikel"},
      {name:"Rede (Konusma)",s:"todo",href:"deutsch-ogren.html#t-rede"},
      {name:"Broschuere / Flyer",s:"todo",href:"deutsch-ogren.html#t-broschuere"},
      {name:"Meinungsartikel / Kommentar",s:"todo",href:"deutsch-ogren.html#t-meinung"},
      {name:"Interview (Roportaj)",s:"todo",href:"deutsch-ogren.html#t-interview"},
      {name:"Nachrichtenbericht (Haber)",s:"todo",href:"deutsch-ogren.html#t-nachricht"},
      {name:"Rezension (Inceleme)",s:"todo",href:"deutsch-ogren.html#t-rezension"}]},
    {name:"Writing",desc:"Paper 1 yazma + model",state:"live",lessons:[
      {name:"Paper 1 Yazma",s:"todo",href:"deutsch-ogren.html#paper1"}]}
  ]}]},
 {id:"tok",name:"TOK",mark:"TK",desc:"Theory of Knowledge . Essay + Exhibition",pct:0,
  tools:[{ic:"yazi",label:"TOK Rehberi",desc:"Bilgi Sorulari, AOK'lar, TOK Essay ve Exhibition icin adim-adim rehber + model metinler ve yazma sihirbazlari.",href:"tok-ogren.html"}],
  sections:[{label:"Ogren",units:[
    {name:"Temeller",desc:"TOK nedir, Knowledge Questions, AOK'lar",state:"live",lessons:[
      {name:"TOK Nedir?",s:"todo",href:"tok-ogren.html#basla"},
      {name:"Knowledge Questions",s:"todo",href:"tok-ogren.html#bilgi-sorulari"},
      {name:"AOK'lar ve Cekirdek Tema",s:"todo",href:"tok-ogren.html#aok"}]},
    {name:"Degerlendirme",desc:"Essay ve Exhibition",state:"live",lessons:[
      {name:"TOK Essay Nasil Yazilir",s:"todo",href:"tok-ogren.html#essay"},
      {name:"TOK Exhibition Nasil Yapilir",s:"todo",href:"tok-ogren.html#exhibition"}]}
  ]}]},
 {id:"udsp",name:"UDSP",mark:"U",desc:"Almanca + Ingilizce . 8 tema paketi",pct:0,
  tools:[{ic:"kelime",label:"Kelime",desc:"8 tema paketi (Alltag, Schule, Reisen, Essen, Familie, Natur, Stadt, Arbeit). Almanca-Ingilizce-Turkce + eslestirme quizleri.",href:"udsp-ogren.html"}],
  sections:[{label:"Ogren",units:[
    {name:"Kelime Paketleri",desc:"Almanca-Ingilizce, tema tema, quizli",state:"live",lessons:[
      {name:"UDSP Hakkinda",s:"todo",href:"udsp-ogren.html#basla"},
      {name:"1. Alltag (Gunluk)",s:"todo",href:"udsp-ogren.html#p1"},
      {name:"2. Schule (Okul)",s:"todo",href:"udsp-ogren.html#p2"},
      {name:"3. Reisen (Seyahat)",s:"todo",href:"udsp-ogren.html#p3"},
      {name:"4. Essen und Trinken",s:"todo",href:"udsp-ogren.html#p4"},
      {name:"5. Familie und Menschen",s:"todo",href:"udsp-ogren.html#p5"},
      {name:"6. Natur und Wetter",s:"todo",href:"udsp-ogren.html#p6"},
      {name:"7. Stadt und Verkehr",s:"todo",href:"udsp-ogren.html#p7"},
      {name:"8. Arbeit und Zeit",s:"todo",href:"udsp-ogren.html#p8"}]}
  ]}]},
 {id:"ydt",name:"YDT",mark:"Y",desc:"Yabanci Dil . tum soru tipleri, bes sikli",pct:0,
  tools:[{ic:"soru",label:"Drilller",desc:"Kelime, dilbilgisi, baglac, cloze, cumle tamamlama, diyalog, restatement, ceviri ve paragraf drilleri. Bes sikli, puanli.",href:"ydt-ogren.html"}],
  sections:[{label:"Ogren",units:[
    {name:"Yapi ve Strateji",desc:"YDT yapisi, puanlama, taktik",state:"live",lessons:[
      {name:"YDT Yapisi",s:"todo",href:"ydt-ogren.html#basla"}]},
    {name:"Dil Bilgisi ve Kelime",desc:"Kelime, dilbilgisi, baglaclar",state:"live",lessons:[
      {name:"Kelime",s:"todo",href:"ydt-ogren.html#kelime"},
      {name:"Dilbilgisi",s:"todo",href:"ydt-ogren.html#dilbilgisi"},
      {name:"Baglaclar ve Gecisler",s:"todo",href:"ydt-ogren.html#baglac"}]},
    {name:"Soru Tipleri",desc:"Cloze, cumle tamamlama, diyalog, restatement, ceviri, paragraf",state:"live",lessons:[
      {name:"Cloze Test",s:"todo",href:"ydt-ogren.html#cloze"},
      {name:"Cumle Tamamlama",s:"todo",href:"ydt-ogren.html#cumletam"},
      {name:"Diyalog Tamamlama",s:"todo",href:"ydt-ogren.html#diyalog"},
      {name:"Restatement",s:"todo",href:"ydt-ogren.html#restatement"},
      {name:"Ceviri",s:"todo",href:"ydt-ogren.html#ceviri"},
      {name:"Paragraf",s:"todo",href:"ydt-ogren.html#paragraf"}]}
  ]}]},
 {id:"yds",name:"YDS / YOKDIL",mark:"Y",desc:"Akademik . tum soru tipleri, bes sikli",pct:0,
  tools:[{ic:"soru",label:"Drilller",desc:"Akademik kelime, dilbilgisi, baglac, cloze, cumle tamamlama, restatement, ceviri, paragraf ve diyalog drilleri. Bes sikli, puanli.",href:"yds-ogren.html"}],
  sections:[{label:"Ogren",units:[
    {name:"Yapi ve Strateji",desc:"YDS/YOKDIL yapisi, puanlama",state:"live",lessons:[
      {name:"YDS / YOKDIL Yapisi",s:"todo",href:"yds-ogren.html#basla"}]},
    {name:"Dil Bilgisi ve Kelime",desc:"Akademik kelime, dilbilgisi, baglaclar",state:"live",lessons:[
      {name:"Akademik Kelime",s:"todo",href:"yds-ogren.html#kelime"},
      {name:"Dilbilgisi",s:"todo",href:"yds-ogren.html#dilbilgisi"},
      {name:"Baglaclar",s:"todo",href:"yds-ogren.html#baglac"}]},
    {name:"Soru Tipleri",desc:"Cloze, cumle tamamlama, restatement, ceviri, paragraf, diyalog",state:"live",lessons:[
      {name:"Cloze Test",s:"todo",href:"yds-ogren.html#cloze"},
      {name:"Cumle Tamamlama",s:"todo",href:"yds-ogren.html#cumletam"},
      {name:"Restatement",s:"todo",href:"yds-ogren.html#restatement"},
      {name:"Ceviri",s:"todo",href:"yds-ogren.html#ceviri"},
      {name:"Paragraf",s:"todo",href:"yds-ogren.html#paragraf"},
      {name:"Diyalog Tamamlama",s:"todo",href:"yds-ogren.html#diyalog"}]}
  ]}]},
];
  window.GRI_DATA = { IC: IC, EXAMS: EXAMS,
    PULSE: { overall: 0, streak: 0, weekLessons: 0, newBadges: 0 } };
  window.GRI_INFO = null; // gercek launch-banner korunur; ileride admin kaynagina baglanir
  window.GRI_NAV = [
    { label: "Öğrenme Haritası", href: "ogrenme-haritasi.html" },
    { label: "Sınav Bilgisi", href: "sat.html", children: [
      { label: "SAT", href: "sat.html" }, { label: "IELTS", href: "ielts.html" },
      { label: "TOEFL", href: "toefl.html" }, { label: "IB", href: "ib.html" },
      { label: "Deutsch B", href: "deutsch-ogren.html" }, { label: "TOK", href: "tok-ogren.html" },
      { label: "UDSP", href: "udsp.html" }, { label: "YDT", href: "ydt.html" },
      { label: "YDS / YÖKDİL", href: "yds.html" }
    ] },
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
    { label: "Yanlış Defteri", href: "yanlis-defteri.html" },
    { label: "Ders Notları", href: "ders-notlari.html", children: [
      { label: "SAT", href: "sat-ders-notlari.html" }, { label: "IELTS", href: "ielts-ders-notlari.html" },
      { label: "TOEFL", href: "toefl-ders-notlari.html" }, { label: "IB", href: "ib-ders-notlari.html" },
      { label: "YDT", href: "ydt-ders-notlari.html" }, { label: "YDS / YÖKDİL", href: "yds-ders-notlari.html" }
    ] },
    { label: "Yazı Pratiği", href: "yazi-pratigi.html" },
    { label: "AI Detector", href: "ai-araclari.html" },
    { label: "Çalışma Paketleri", href: "calisma-paketleri.html" },
    { label: "Bize Ulaşın", href: "iletisim.html" }
  ];
})();
