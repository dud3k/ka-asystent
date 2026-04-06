// Service Worker — KA Asystent PWA
// Cache-first: app shell działa offline po pierwszym załadowaniu

const CACHE = 'ka-v1';
const SHELL = [
  '/ka-asystent/',
  '/ka-asystent/index.html'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // Nie przechwytuj żądań do zewnętrznych API (Anthropic, GitHub)
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;

  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
