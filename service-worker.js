// Gri English — Minimal Service Worker
// Sole purpose: satisfy PWA install criteria for PWA Builder / TWA / "Ana Ekrana Ekle"
// Does not cache anything; site stays online-first.

const SW_VERSION = '1.0.0';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request).catch(() => {
    return new Response('Çevrimdışı', { status: 503, statusText: 'Service Unavailable' });
  }));
});
