// Gri English — Service Worker
// Amaç: PWA/TWA + offline dayanıklılık + hız (app-shell + statik varlık cache).
// Strateji:
//   - Supabase / çapraz-origin / non-GET  -> cache YOK, ağa geç.
//   - HTML gezinme (navigate)            -> network-first, ağ yoksa cache, o da yoksa offline.html.
//   - Same-origin statik (css/js/img/font)-> stale-while-revalidate (cache'ten ver, arkada güncelle).
// Sürüm bump = eski cache temizlenir.

const SW_VERSION = '2.2.0';
const STATIC_CACHE = 'gri-static-' + SW_VERSION;
const PAGES_CACHE  = 'gri-pages-' + SW_VERSION;
const OFFLINE_URL  = '/offline.html';

// Açılışta öncelikli yüklenenler (kritik app-shell).
const PRECACHE = [
  OFFLINE_URL,
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/assets/main.css',
  '/assets/site-overrides.css',
  '/assets/app-mode.css'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) =>
      // Tek tek ekle: biri 404 olsa bile install çökmesin.
      Promise.all(PRECACHE.map((url) =>
        fetch(url, { cache: 'no-cache' })
          .then((res) => { if (res.ok) return cache.put(url, res); })
          .catch(() => {})
      ))
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((k) => k.startsWith('gri-') && k !== STATIC_CACHE && k !== PAGES_CACHE)
          .map((k) => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

function isHtmlRequest(req) {
  return req.mode === 'navigate' ||
    (req.headers.get('accept') || '').indexOf('text/html') !== -1;
}

// Uygulama kodu (JS/CSS): DEPLOY sonrası eski kod servis edilmemeli — auth'a bağlı,
// stale kod "oturum tanınmadı" / yavaş / karışık davranışa yol açar. Bunlar network-first.
function isAppCode(url) {
  return /\.(css|js)$/i.test(url.pathname);
}
// Gerçekten statik varlıklar (görsel/font/ses): stale-while-revalidate güvenli + hızlı.
function isMediaAsset(url) {
  return /\.(png|jpg|jpeg|gif|svg|webp|ico|woff2?|ttf|otf|mp3|m4a)$/i.test(url.pathname);
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  let url;
  try { url = new URL(req.url); } catch (e) { return; }

  // Çapraz-origin (Supabase, GTM, CDN, fonts vb.) ve Supabase fonksiyon/DB: dokunma, ağa geç.
  if (url.origin !== self.location.origin) return;
  if (url.hostname.indexOf('supabase') !== -1) return;

  // HTML gezinme: network-first -> cache -> offline.
  // no-store: tarayicinin HTTP cache'ini ATLA (GitHub Pages max-age ~10dk stale HTML sunmasin).
  if (isHtmlRequest(req)) {
    event.respondWith(
      fetch(req, { cache: 'no-store' }).then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(PAGES_CACHE).then((c) => c.put(req, copy)).catch(() => {});
        }
        return res;
      }).catch(() =>
        caches.match(req).then((cached) => cached || caches.match(OFFLINE_URL))
      )
    );
    return;
  }

  // Uygulama kodu (JS/CSS): network-first -> cache fallback (deploy sonrası hep güncel kod).
  if (isAppCode(url)) {
    event.respondWith(
      fetch(req, { cache: 'no-store' }).then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(STATIC_CACHE).then((c) => c.put(req, copy)).catch(() => {});
        }
        return res;
      }).catch(() => caches.match(req))
    );
    return;
  }

  // Medya (görsel/font/ses): stale-while-revalidate.
  if (isMediaAsset(url)) {
    event.respondWith(
      caches.open(STATIC_CACHE).then((cache) =>
        cache.match(req).then((cached) => {
          const network = fetch(req).then((res) => {
            if (res && res.ok) cache.put(req, res.clone());
            return res;
          }).catch(() => cached);
          return cached || network;
        })
      )
    );
    return;
  }
  // Diğerleri: varsayılan (ağ).
});

// ---- Web Push ----
self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch (e) { data = {}; }
  const title = data.title || 'Gri English';
  const options = {
    body: data.body || 'Çalışma zamanı.',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: data.tag || 'gri-reminder',
    data: { url: data.url || 'https://gringlizce.com/panelim.html' }
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || 'https://gringlizce.com/panelim.html';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.indexOf('gringlizce.com') !== -1 && 'focus' in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});
