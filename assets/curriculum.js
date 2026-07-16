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
    {ic:"kelime",label:"Kelime",desc:"Tematik SAT kelime setleri ve tekrar quizleri.",href:"kelime-bankasi.html"},
    {ic:"yazi",label:"Gramer Drill",desc:"Punctuation, boundaries ve transitions icin kisa hedefli alistirmalar.",href:"#"},
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
    {name:"Unite 3 . Expression of Ideas",desc:"Transitions, Rhetorical Synthesis",state:"soon",lessons:[
      {name:"Transitions",s:"todo"},{name:"Rhetorical Synthesis",s:"todo"}]}]},
   {label:"Ogren . Math",units:[
    {name:"Algebra",desc:"Linear, sistemler, esitsizlikler",state:"soon",lessons:[{name:"Linear denklemler",s:"todo"}]}]}]},
 {id:"ielts",big:true,name:"IELTS",mark:"I",desc:"Academic . dort beceri, kelime, gramer",pct:0,
  tools:[
    {ic:"yazi",label:"Yazi Pratigi",desc:"Task 1 ve Task 2 icin AI destekli geri bildirim, band tahmini ve paragraf paragraf analiz.",href:"ielts-writing.html"},
    {ic:"soru",label:"Pratik",desc:"Okuma ve dinleme pratikleri, 11 soru tipi, transkript uzerinden calisma.",href:"ielts-pratik.html"},
    {ic:"kelime",label:"Kelime",desc:"15 tematik quiz paketi, bilim, cevre, egitim ve daha fazlasi.",href:"kelime-bankasi.html"},
    {ic:"deneme",label:"Deneme",desc:"Tam uzunlukta IELTS deneme testleri.",href:"#"},
  ],
  sections:[{label:"Ogren . Beceriler",units:[
    {name:"Reading",desc:"11 soru tipi, 3 pratik test",state:"live",lessons:[
      {name:"True/False/Not Given",s:"todo",href:"#"},{name:"Matching Headings",s:"todo",href:"#"},{name:"Summary Completion",s:"todo",href:"#"}]},
    {name:"Writing",desc:"Task 1 ve Task 2",state:"live",lessons:[
      {name:"Task 1 . Grafik betimleme",s:"todo",href:"#"},{name:"Task 2 . Deneme yapisi",s:"todo",href:"#"}]},
    {name:"Listening",desc:"Transkript uzerinden calisma",state:"live",lessons:[
      {name:"Form ve not tamamlama",s:"todo",href:"#"},{name:"Harita ve plan",s:"todo",href:"#"}]},
    {name:"Speaking",desc:"Uc bolum, akicilik",state:"soon",lessons:[{name:"Part 2 . Cue card",s:"todo"}]}]}]},
 {id:"toefl",name:"TOEFL",mark:"T",desc:"iBT . Integrated Writing, Academic Discussion",pct:0,
  tools:[{ic:"yazi",label:"Yazi",desc:"Integrated ve academic discussion pratikleri. Hazirlaniyor.",href:"#"}],
  sections:[{label:"Ogren",units:[{name:"Integrated Writing",desc:"hazirlaniyor",state:"soon",lessons:[{name:"Yakinda",s:"todo"}]}]}]},
 {id:"ib",name:"IB English B",mark:"IB",desc:"SL ve HL . Paper 1 metin turleri",pct:0,
  tools:[{ic:"soru",label:"Metin turleri",desc:"Makale, deneme, konusma, poster. Amac, kitle, ton karsilastirmalari. Hazirlaniyor.",href:"#"}],
  sections:[{label:"Ogren",units:[{name:"Paper 1 metin turleri",desc:"hazirlaniyor",state:"soon",lessons:[{name:"Yakinda",s:"todo"}]}]}]},
 {id:"udsp",name:"UDSP",mark:"U",desc:"Almanca ve Ingilizce",pct:0,
  tools:[{ic:"kelime",label:"Kelime",desc:"Almanca ve Ingilizce kelime listeleri. Hazirlaniyor.",href:"#"}],
  sections:[{label:"Ogren",units:[{name:"Kelime listeleri",desc:"hazirlaniyor",state:"soon",lessons:[{name:"Yakinda",s:"todo"}]}]}]},
 {id:"ydt",name:"YDT",mark:"Y",desc:"Gramer ve kelime setleri",pct:0,
  tools:[{ic:"soru",label:"Soru",desc:"YDT gramer ve kelime soru setleri. Hazirlaniyor.",href:"#"}],
  sections:[{label:"Ogren",units:[{name:"Gramer setleri",desc:"hazirlaniyor",state:"soon",lessons:[{name:"Yakinda",s:"todo"}]}]}]},
 {id:"yds",name:"YDS / YOKDIL",mark:"Y",desc:"960 soruluk paketler",pct:0,
  tools:[{ic:"soru",label:"Soru",desc:"YDS ve YOKDIL soru paketleri, cozumleriyle. Hazirlaniyor.",href:"#"}],
  sections:[{label:"Ogren",units:[{name:"Soru paketleri",desc:"hazirlaniyor",state:"soon",lessons:[{name:"Yakinda",s:"todo"}]}]}]},
];
  window.GRI_DATA = { IC: IC, EXAMS: EXAMS,
    PULSE: { overall: 0, streak: 0, weekLessons: 0, newBadges: 0 } };
  window.GRI_INFO = null; // gercek launch-banner korunur; ileride admin kaynagina baglanir
  window.GRI_NAV = [
    { label: "Öğrenme Haritası", href: "ogrenme-haritasi.html" },
    { label: "Sınav Bilgisi", href: "sat.html", children: [
      { label: "SAT", href: "sat.html" }, { label: "IELTS", href: "ielts.html" },
      { label: "TOEFL", href: "toefl.html" }, { label: "IB", href: "ib.html" },
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
