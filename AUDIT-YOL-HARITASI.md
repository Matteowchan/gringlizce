# Gri English — Audit Düzeltme & İyileştirme Yol Haritası

8-ajanlı tester audit sonrası tam düzeltme + blog SILO genişletme planı. Sıra/hız serbest; hepsi yapılacak.

## Kısıt
- **Supabase MCP kopuk** → DB soru bankaları/denemeler + edge-function AI rubrikleri bu turda **düzeltilemez**. Statik/gömülü dosyalardaki her şey yapılır; DB/ses gerektirenler "DB-BLOCKED" işaretlenip MCP bağlanınca yapılır.
- Paralel güvenlik: her domain ajanı **yalnız kendi dosyalarını** düzenler; paylaşımlı dosyalar (curriculum.js, nav.js, main.css, site-config.js, theme.js, breadcrumb.js, app-mode.js, track.js, blog.html) merkezî (Wave 0/3). Ajanlar commit ETMEZ; merkezî commit.

## Dalga 0 — Çapraz/paylaşımlı hızlı kazanımlar (merkezî)
- [x] "Drilller" → "Driller" (curriculum.js + yds-ogren + ydt-ogren)
- [x] "Heart of Algebra" → "Algebra" (curriculum.js + sat-math)
- [x] curriculum YDT desc düzelt ("Testi" eksik / "çoğunlukla beş şıklı")

## Dalga 1 — 8 domain ajanı: audit düzeltmeleri + blog genişletme (paralel)
Her ajan (kendi dosyalarında):
1. **Audit bulgularını düzelt** (aşağıda domain listeleri).
2. **Blog SILO'yu zenginleştir** — ORTAK FORMAT (her blog sayfası):
   - Tarayıcıya-dostu yapı: kısa giriş + TL;DR + H2 bölümler + tablo/kutu.
   - **Örnek soru(lar):** gerçek sınav tipinde, çözümlü + neden doğru/yanlış.
   - **Örnek yazı/cevap** (writing içeren alanlarda): model + neden bu band/puan.
   - **"Neden puan alır / neden puan kaybeder":** güçlü vs zayıf cevap karşılaştırması.
   - İç link + FAQPage/Article JSON-LD + breadcrumb korunur. Türkçe açıklama, İng/Alm örnek. **Diakritik ŞART.** Akademik doğruluk ödünsüz; "güncel kılavuzdan teyit" dürüstlüğü korunur.

### Domain fix listeleri
- **SAT:** sat-ogren `why` harf-kayması senkronu; sat-math x^2→x² notasyon; sat.html hub'a "Ücretsiz Öğren" kartları; grid-in notu (DB-blocked havuz). Blog: blog-sat-*.
- **IELTS:** ogren-listening dürüst "strateji rehberi" etiketi (ses DB-blocked); ogren-reading "üç tam deneme" vaadi; ogren-speaking self-study dili; ielts-kelime diakritik; hub koçluk linki; blog-ielts-nedir "akademik deneme". Blog: blog-ielts-*.
- **TOEFL (P0):** site geneli 0-120→1-6 CEFR bant puanlama (7 dosya + ogren tablo); hub/soru-bankasi/reading/blog 2026 görev tipleri; writing "2 görev"→3; soru-bankasi "Digital SAT" breadcrumb; coaching eski-format satış dili. (2026 iddialarını WebSearch ile teyit et.) Blog: blog-toefl-*.
- **YDS:** yds-ogren deneme1-3 `why` harf-kayması (≥35); yds.html YÖKDİL ek hataları + terminoloji; soru-bankasi 11/10 + diyalog tipi; YOKDIL diakritik. Blog: blog-yds-*.
- **YDT:** ydt-ogren strateji çelişkisi ("ceza yok, işaretle"); diakritik puanlama notu; format ______→----; taksonomi. Blog: blog-ydt-*.
- **IB English B:** sl/hl "iki kâğıt"→IO dahil + gerçek SL/HL ayrım içeriği; Paper1 text-type'larından 4-5 çekirdek aç; token/süre tutarlılık; soru-bankasi placeholder; Paper2 "dinleme" vaadi ↔ içerik (ses DB-blocked → dürüst hizala). Blog: blog-ib-english-*.
- **Deutsch:** paper1:91 tema adları; Erfindungsgabe teyit; oral CTA; writing wizard ai:true (config). Blog: blog-deutsch-*.
- **TOK:** /ib-tok "Yakında"→gerçek modül+blog linkleri; IES→IA prompt; doğrulama→gerekçelendirme; meta description; Knowledge Framework 4 ayak isimlendirme. Blog: blog-tok-*.

## Dalga 2 — Kalıcı iyileştirme (merkezî, ajanlar sonrası)
- Açıklama şemasını harf-bağımsız `why_wrong{A,B,C,D}`'ye standardize (debias bağışıklığı).
- `lang="en"` sarmalama (İng içerik a11y) + SVG title/aria.
- DB-akış fallback + hata izleme (checkpoint/mock/bank).
- Hub'lara "Ücretsiz başla" birincil CTA + "Yakında" temizliği.
- Koçluk çift-kopya tekilleştirme.

## Dalga 3 — DB-BLOCKED (MCP bağlanınca)
- Soru bankalarında `why` harf-kayması denetimi (YDS/SAT çapraz risk).
- IB Paper 2 Listening ses + Individual Oral pratiği.
- IELTS/TOEFL Listening ses.
- AI değerlendirici sınav-bazlı rubrik kalibrasyonu.
- TOEFL 2026 ETS resmi teyidi.
