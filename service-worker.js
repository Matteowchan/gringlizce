// Gri English — Minimal Service Worker
// Sole purpose: satisfy PWA install criteria for PWA Builder / TWA / "Ana Ekrana Ekle"
// Does not cache anything; site stays online-first.

const SW_VERSION = '1.1.0';

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
