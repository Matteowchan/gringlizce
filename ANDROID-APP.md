# Gri English — Android Uygulaması (PWA + TWA) Yol Haritası

Site zaten kurulabilir bir **PWA**: `manifest.json` (id + 4 kısayol + maskable ikonlar),
`service-worker.js` (kayıtlı, push destekli), tüm ikonlar, HTTPS (gringlizce.com).
Kalan iş: siteyi **TWA (Trusted Web Activity)** ile paketleyip Play Store'a koymak.
Tek kod tabanı — site güncellenince uygulama da güncel olur.

---

## 1. Paketi üret — PWABuilder (en kolay, yerel kurulum yok)

1. https://www.pwabuilder.com adresine git.
2. `https://gringlizce.com` yaz → **Start / Analyze**. (Manifest + SW + ikonlar yeşil çıkmalı.)
3. **Package For Stores → Android → Generate Package**. Ayarlar:
   - **Package ID:** `com.gringlizce.app`  *(bir daha DEĞİŞTİRİLEMEZ — Play'de kimlik budur)*
   - **App name:** `Gri English`
   - **Launcher name:** `Gri English`
   - **Display mode:** `Standalone` (veya tam ekran istiyorsan `Fullscreen`)
   - **Status bar color / Nav color:** `#2C5856` (theme) / `#faf7ee` (background)
   - **Signing key:** *"Create new"* seç → PWABuilder bir `.keystore` üretir.
4. İnen zip'te şunlar olur:
   - `app-release-signed.aab` → Play Console'a yüklenecek dosya
   - **imza anahtarı (`.keystore`) + şifreler** → **MUTLAKA SAKLA/yedekle.** Bunu kaybedersen
     uygulamayı bir daha GÜNCELLEYEMEZSİN.
   - `assetlinks.json` → aşağıdaki 2. adım için (parmak izi PWABuilder tarafından dolduruldu)

> Alternatif (yerel, geliştirici için): `npx @bubblewrap/cli init --manifest https://gringlizce.com/manifest.json`
> — JDK + Android SDK ister. PWABuilder daha pratik.

## 2. assetlinks.json (adres çubuğunu kaldırır — "gerçek app" hissi)

PWABuilder'ın verdiği `assetlinks.json` dosyasını repoda şu yola koy ve push et:
```
/.well-known/assetlinks.json
```
İçeriği şu şekildedir (PWABuilder gerçek SHA256'yı doldurur):
```json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "com.gringlizce.app",
    "sha256_cert_fingerprints": ["<PWABuilder/Play'in verdiği SHA256 parmak izi>"]
  }
}]
```
Not: Play App Signing kullanırsan (önerilir), gerçek parmak izi **Play Console → Uygulama
imzalama** sayfasında olur; onu buraya ekle. Yanlış/eksik parmak izi olursa app açılırken
üstte tarayıcı adres çubuğu görünür (çalışır ama "web" gibi durur).

`https://gringlizce.com/.well-known/assetlinks.json` yayında ve 200 dönmeli. (Şu an 404.)

## 3. Play Console

1. **Google Play Developer** hesabı aç (tek seferlik ~25 USD).
2. **Uygulama oluştur** → ad: Gri English, dil: Türkçe, tür: Uygulama, ücretsiz.
3. **Yayın → İç test** (önce) → `app-release-signed.aab` yükle. Kendinde test et, sonra
   **Üretim**'e çıkar.
4. **Play App Signing** öner (Play imzayı yönetir; anahtarı kaybetme riski azalır). Etkinleştirince
   assetlinks parmak izini Play'den al (2. adım).
5. **Store girişi** (aşağıdaki hazır metin), **grafikler**, **içerik derecelendirme anketi**,
   **Veri güvenliği formu**, **Gizlilik Politikası URL'i** (zorunlu — bir sayfa gerekir).

### Gerekli grafikler
- **Uygulama ikonu 512×512:** hazır → `icons/icon-512.png`
- **Öne çıkan görsel (feature graphic) 1024×500:** yeni tasarlanmalı (marka: teal #2C5856 + logo)
- **Telefon ekran görüntüleri:** en az 2 (önerilen 1080×1920). Ana sayfa, Soru Bankası, Çalışma
  Masam, Gri Meet ekranları iyi olur.

---

## 4. Play Store Girişi — Hazır Metin (TR)

**Uygulama adı:** Gri English — Sınav İngilizcesi

**Kısa açıklama (80 karakter):**
SAT, IELTS, TOEFL ve akademik İngilizce: soru bankası, kelime ve sınav denemeleri.

**Tam açıklama:**
Gri English, sınav İngilizcesine hazırlananlar için ücretsiz ve kapsamlı bir çalışma
platformudur. SAT, IELTS, TOEFL, YDS, YDT, ÜDS/YÖKDİL, IB English ve kurumsal Genel İngilizce
tek bir yerde.

Neler var:
• Binlerce soruluk soru bankası — kategori kategori, Türkçe açıklamalı çözümlerle
• Kelime bankası ve bağlamda kelime çalışmaları
• Gerçek sınav formatında, puanlı deneme sınavları
• Öğren modülleri: konu konu anlatım + otantik alıştırmalar
• Çalışma Masam: günlük hedef, seri (streak), ilerleme takibi, yanlışların
• Öğretmen–öğrenci sınıfları ve ödev takibi
• Gri Meet: canlı görüntülü ders sınıfı (beyaz tahta, ekran paylaşımı, quiz)
• Yazma pratiği ve yapay zekâ destekli geri bildirim

Ücretsiz içeriklerle her gün çalış, kendini sınav gününe hazırla.

**Kategori:** Eğitim
**Etiketler:** SAT, IELTS, TOEFL, İngilizce, sınav, kelime, deneme
**İletişim e-postası:** (senin adresin)
**Web sitesi:** https://gringlizce.com

---

## 5. Bakım / Güncelleme
- Site içeriği güncellenince uygulama otomatik günceldir (TWA canlı siteyi açar).
- Yeni AAB **yalnızca** şu durumlarda gerekir: paket adı/imza dışı bir değişiklik,
  minimum Android sürümü, uygulama adı/ikonu, veya TWA ayarları değişirse.
- `?mode=app` parametresi: manifest `start_url` ve kısayollar bununla açılır; sitede istersen
  bu parametreyle uygulama-içi (app-mode) farklı davranış tetiklenebilir (nav.js zaten
  `app-mode` sınıfını destekliyor).

## Yapıldı (bu repoda)
- `manifest.json`: `id`, güncel `name`, 4 uygulama kısayolu (Soru Bankası, Kelime, Masam, Gri Meet).
- PWA temeli (SW + ikonlar + HTTPS) zaten hazırdı.

## Senin yapman gerekenler (özet)
1. PWABuilder ile AAB + imza üret, **anahtarı yedekle**.
2. `assetlinks.json`'u `/.well-known/` altına koy + push (parmak izini Play/PWABuilder'dan al).
3. Play Developer hesabı + uygulama oluştur + AAB yükle + store girişi + gizlilik politikası.
4. Feature graphic (1024×500) ve 2+ telefon ekran görüntüsü hazırla.
