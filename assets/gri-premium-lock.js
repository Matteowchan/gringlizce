/* gri-premium-lock.js — Premium içerik kilidi (yönlendirmesiz tam-ekran overlay).
   Amaç: sınav runner'larında premium olmayan kullanıcıyı 'location.replace("premium")' ile
   YÖNLENDİRMEK yerine, sayfada tutup tam-ekran bir kilit overlay'i göstermek.
   Neden: hard-redirect geçmiş (history) girdisini premium ile değiştiriyordu → sonradan
   "Geri" tuşu beklenen sayfa yerine premium'a gidiyordu. Overlay geçmişi kirletmez.
   Kullanım: içerik yüklenmeden ÖNCE `GriPremiumLock.show(); return;` çağır (böylece
   ücretli içerik hiç yüklenmez; overlay üstünü kapatır). body hazır değilse kuyruğa alır. */
(function () {
  'use strict';
  if (window.GriPremiumLock) return;
  var shown = false;

  function href(name) {
    // temiz URL: alt dizindeyse ../ ekle
    var parts = location.pathname.replace(/\/+$/, '').split('/').filter(Boolean);
    return (parts.length >= 2 ? '../' : '') + name;
  }

  function build() {
    if (shown || document.getElementById('griPremLock')) return;
    shown = true;
    var ov = document.createElement('div');
    ov.id = 'griPremLock';
    ov.style.cssText = 'position:fixed;inset:0;z-index:2147483000;background:#FFF9EF;display:flex;align-items:center;justify-content:center;padding:1.5rem;font-family:system-ui,-apple-system,sans-serif';
    var lock = '<svg viewBox="0 0 24 24" width="34" height="34" style="margin-bottom:.3rem" aria-hidden="true"><path fill="#BE6A1B" d="M12 2a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2h-1V7a5 5 0 0 0-5-5zm-3 8V7a3 3 0 0 1 6 0v3H9z"/></svg>';
    var box = '<div style="max-width:460px;width:100%;text-align:center;background:#fff;border:2px solid #BE6A1B;border-radius:22px;padding:2.2rem 1.8rem;box-shadow:0 10px 34px rgba(190,106,27,.14)">';
    box += lock;
    box += '<div style="font-family:Georgia,serif;font-size:1.4rem;color:#BE6A1B;font-weight:700;margin-bottom:.3rem">Gri <span style="font-style:italic">English</span> Premium</div>';
    box += '<h2 style="margin:.2rem 0 .6rem;font-size:1.15rem;color:#2E3A59">Bu içerik Premium</h2>';
    box += '<p style="color:#666;font-size:.94rem;line-height:1.6;margin:0 0 1.3rem">Bu deneme/içerik Premium üyelere açıktır. Ücretsiz içeriklerle çalışmaya devam edebilir veya Premium\'a geçebilirsin.</p>';
    box += '<a href="' + href('premium') + '" style="display:inline-block;background:#BE6A1B;color:#fff;text-decoration:none;font-weight:700;padding:.7rem 1.4rem;border-radius:999px;font-size:.95rem">Premium\'a Geç</a>';
    box += '<div style="margin-top:.9rem"><button type="button" id="griPremBack" style="background:none;border:none;color:#BE6A1B;font-size:.88rem;cursor:pointer;text-decoration:underline">Geri dön</button></div>';
    box += '</div>';
    ov.innerHTML = box;
    document.body.appendChild(ov);
    try { document.documentElement.style.overflow = 'hidden'; } catch (e) {}
    var back = document.getElementById('griPremBack');
    if (back) back.addEventListener('click', function () {
      // Geçmiş kirletilmediği için gerçek önceki sayfaya döner; yoksa ana sayfaya.
      if (history.length > 1) history.back(); else location.href = href('index');
    });
  }

  function show() {
    if (document.body) build();
    else document.addEventListener('DOMContentLoaded', build);
  }

  window.GriPremiumLock = { show: show };
})();
