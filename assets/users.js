/* ============================================================
   GRI ENGLISH — KULLANICI VERİTABANI
   ============================================================
   
   Buraya yeni müşteri eklemek için:
   1. Aşağıdaki örnekleri model alarak yeni satır ekle.
   2. Her satır şu formatta: "kullaniciadi": { password: "sifre", products: [...] }
   3. Kullanıcı adı küçük harf, Türkçe karakter YOK (i, s, c, o, u, g).
   4. Virgüller ve süslü parantezler önemli.
   5. Kaydet, commit at, GitHub Pages 1 dk içinde yenilenir.
   
   Geçerli ürün kısaltmaları (slug):
     grammar-pack-1, grammar-pack-2, grammar-pack-3
     vocabulary-pack, study-pack
     full-test-1, full-test-2, full-test-3, full-test-4, full-test-5
     full-test-bundle  (5'li paket — tüm Full Test'lere erişim verir)
     english-practice-module
   
   "full-test-bundle" yazarsan otomatik olarak 1-5 arası tüm Full Test'lere erişim açılır.
   
   NOT: "admin" hesabı tüm materyallere erişim sağlar (test için).
   İstersen daha güvenli bir şifreye çevirebilirsin.
   ============================================================ */

window.GRI_USERS = {
  
  // ===== ADMIN (test, tüm materyallere erişim) =====
  // role: "admin" → tüm materyallere erişim sağlar, ürün listesi gerekmez
  "admin": {
    password: "admin",
    role: "admin"
  },
  
  // ===== DEMO HESAP (test için, silinebilir) =====
  "demo": {
    password: "demo",
    products: ["grammar-pack-1", "vocabulary-pack"]
  },
  
  // ===== GERÇEK MÜŞTERİLER =====
  // Yeni müşteri için aşağıya örnek formatta satır ekle:
  //
  // "kullaniciadi": {
  //   password: "guclu-sifre-123",
  //   products: ["vocabulary-pack"]
  // },
  //
  // Birden fazla ürün için:
  //
  // "alikartal": {
  //   password: "ali2026x7",
  //   products: ["grammar-pack-1", "study-pack", "full-test-bundle"]
  // },
  
};
