/* ============================================================
   GRI ENGLISH — KULLANICI VERİTABANI
   ============================================================
   
   Yeni müşteri eklemek için:
   1. Aşağıdaki örnekleri model alarak yeni satır ekle.
   2. Her satır şu formatta:
      "kullaniciadi": { password: "sifre", products: [...] }
   3. Kullanıcı adı küçük harf, Türkçe karakter YOK (i, s, c, o, u, g).
   4. Virgüller ve süslü parantezler önemli.
   5. Kaydet, commit at, GitHub Pages 1 dk içinde yenilenir.
   
   Geçerli ürün slug'ları:
     SAT Konu Paketleri:
       grammar-pack-1, grammar-pack-2, grammar-pack-3
       vocabulary-pack, study-pack
     SAT Full Tests:
       full-test-1, full-test-2, full-test-3, full-test-4, full-test-5
     SAT Bundle:
       full-test-bundle  ← bu yazılırsa otomatik full-test 1-5 erişimi açılır
     TOEFL iBT / Versant:
       toefl-writing-practice, spelling-practice
     IELTS Academic:
       ielts-full-test
   
   Hizmet ürünleri (IELTS Writing, EE Feedback, TOK Essay) Shopier
   üzerinden ödeme alınır ve e-posta üzerinden yürütülür. Bu hesap
   sisteminde tanımlanmaz.
   ============================================================ */

window.GRI_USERS = {
  
  // ===== ADMIN (test, tüm materyallere erişim) =====
  "admin": {
    password: "admin",
    role: "admin"
  },
  
  // ===== GERÇEK MÜŞTERİLER =====
  // Yeni müşteri için aşağıya örnek formatta satır ekle:
  //
  // "kullaniciadi": {
  //   password: "guclu-sifre-123",
  //   products: ["grammar-pack-1", "study-pack"]
  // },
  
};
