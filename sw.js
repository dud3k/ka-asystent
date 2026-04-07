// Service Worker — KA Asystent PWA
// Strategia: network-first dla HTML (zawsze świeża wersja), cache jako fallback offline

const CACHE = 'ka-v2';
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
  // Usuń stare cache (ka-v1, ka-v2, ...) przy aktualizacji SW
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Nie przechwytuj żądań do zewnętrznych API (Anthropic, GitHub)
  if (url.origin !== self.location.origin) return;

  // Network-first dla HTML — zawsze próbuj pobrać świeżą wersję
  // Fallback na cache gdy offline
  if (e.request.destination === 'document' ||
      url.pathname.endsWith('/') ||
      url.pathname.endsWith('.html')) {
    e.respondWith(
      fetch(e.request)
        .then(resp => {
          const clone = resp.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return resp;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // Cache-first dla pozostałych zasobów (ikony, manifest)
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
