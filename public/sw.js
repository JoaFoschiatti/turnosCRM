// public/sw.js
const CACHE_NAME = 'turnero-v1';
const urlsToCache = [
  '/turneroCRMNew/public/',
  '/turneroCRMNew/public/index.html',
  '/turneroCRMNew/public/app.html',
  '/turneroCRMNew/public/css/styles.css',
  '/turneroCRMNew/public/js/toast.js',
  '/turneroCRMNew/public/js/auth.js',
  '/turneroCRMNew/public/js/app.js',
  '/turneroCRMNew/public/js/services.js',
  '/turneroCRMNew/public/js/clients.js',
  '/turneroCRMNew/public/js/appointments.js',
  '/turneroCRMNew/public/js/users.js',
  '/turneroCRMNew/public/js/dashboard.js',
  '/turneroCRMNew/public/manifest.json',
  '/turneroCRMNew/public/assets/icons/icon-192.png',
  '/turneroCRMNew/public/assets/icons/icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(resp => resp || fetch(e.request))
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(name => name !== CACHE_NAME).map(name => caches.delete(name))
      );
    })
  );
});

self.addEventListener('sync', e => {
  if (e.tag === 'sync-appointments') {
    e.waitUntil(
      (async () => {
        const clients = await self.clients.matchAll();
        const client = clients[0];
        if (client) {
          client.postMessage({ action: 'sync-appointments' });
        }
      })()
    );
  }
});