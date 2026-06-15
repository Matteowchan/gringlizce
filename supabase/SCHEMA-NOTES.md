# Gringlizce — Backend / Veritabanı Haritası

Bu klasör, gringlizce.com'un Supabase backend'ini içerir. Edge function kaynak
kodları `functions/` altında. Aşağıdaki tablo/RPC listesi bu fonksiyonların
kodundan türetilmiştir (canlı DB'den dump DEĞİL — kolon detayları için canlı
şemayı doğrula).

Supabase proje: `https://vazbvbqgvtlaqkytfsbi.supabase.co`

## Edge Functions (supabase/functions/)

| Function | Görev |
|---|---|
| `gri-ask` | AI mentor "Gri" — soru/passage bağlamında açıklama üretir, kotayı düşer |
| `gri-evaluate-writing` | Yazma (writing) değerlendirmesi, AI puanlama |
| `gri-evaluate-rubric` | Rubric tabanlı değerlendirme |
| `ai-detector-check` | AI-yazısı tespit kontrolü |
| `ai-tools` | Genel AI araçları + günlük kullanım/kota takibi |
| `vocab-lookup` | Kelime arama (`vocabulary` tablosu) |
| `shopier-osb` | Shopier ödeme webhook'u — satın alma kaydı + kota ekleme |
| `admin-user-actions` | Admin: kullanıcı şifre sıfırla / banla / sil (auth.admin) |
| `send-notification` | DB webhook → email (soru bildirimi / iletişim mesajı) |
| `send-queued-emails` | Kuyruktaki email kampanyalarını gönderir |
| `send-writing-email` | Writing sonucu email'i (kampanya tabanlı) |

## Tablolar (koddan görülen)

- **profiles** — kullanıcı profili (auth.users'a bağlı)
- **products** — ürünler/fiyatlar (slug, base_price, has_discount, product_type, variants JSONB)
- **purchases** — satın almalar (Shopier)
- **site_config** — site ayarları (key/value: banner, discount vb.)
- **ai_quota** — kullanıcı AI kotası (user_id, bonus_quota, bonus_used)
- **ai_call_log** — AI çağrı logu
- **ai_question_usage** — soru bazlı AI kullanımı
- **tool_usage_daily** — günlük AI araç kullanımı (used_date, used_count)
- **questions** — soru bankası soruları
- **passages** — okuma parçaları
- **vocabulary** — kelime sözlüğü
- **writing_submissions** — yazma gönderimleri
- **writing_sessions** — yazma oturumları
- **writing_text_types** — yazma metin türleri
- **email_campaigns** — email kampanyaları
- **email_templates** — email şablonları
- **email_sends** — gönderilen email logu
- **user_activity** — kullanıcı aktivite takibi (site-config.js)
- **soru_bildirimleri** — soru hata bildirimleri (send-notification trigger)
- **iletisim_mesajlari** — iletişim formu mesajları (send-notification trigger)
- **auth.users** — Supabase Auth (yönetilen)

## RPC Fonksiyonları (koddan görülen)

- `consume_ai_quota(...)` — AI kotası düşer (tanımı: consume_ai_quota.sql)
- `add_ai_quota(...)` — satın alma sonrası kota ekler
- `evaluate_user_progress(p_user_id)` — rozet değerlendirmesi (site-config.js)
- `admin_resolve_audience(p_filter)` — kampanya hedef kitlesini çözer
- `claim_next_campaign()` — sıradaki kampanyayı kilitler
- `mark_campaign_done(...)` — kampanyayı tamamlandı işaretler

## NOT
Bu dosyalar kod içerir, gerçek kullanıcı verisi (email/şifre) İÇERMEZ — o veri
sadece Supabase DB'sinde. Tam ve kesin şema (kolon tipleri, RLS politikaları)
gerekirse Supabase SQL Editor'den / pg_dump --schema-only ile çekilmeli.
