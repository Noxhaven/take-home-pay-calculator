const CACHE = 'take-home-v8';
const ASSETS = ['./', './index.html', './manifest.webmanifest', './icons/icon.svg', './icons/icon-maskable.svg'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())
  );
});

function isNavigation(req) {
  if (req.mode === 'navigate') return true;
  if (req.destination === 'document') return true;
  const p = new URL(req.url).pathname;
  return p.endsWith('/') || /\/index\.html$/i.test(p);
}

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;

  if (isNavigation(e.request)) {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then(c => {
              c.put(e.request, copy);
              c.put('./index.html', res.clone());
              c.put('./', res.clone());
            });
          }
          return res;
        })
        .catch(() =>
          caches.match(e.request).then(cached => cached || caches.match('./index.html') || caches.match('./'))
        )
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then(cached => {
      const network = fetch(e.request)
        .then(res => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then(c => c.put(e.request, copy));
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
