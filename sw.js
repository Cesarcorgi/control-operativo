/* Modo sin conexión de Control Operativo.
   Al subir una versión nueva, cambia VERSION para que los teléfonos la descarguen. */
const VERSION = '1.0.0';
const CACHE = 'control-operativo-' + VERSION;
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/maskable-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(ASSETS.map((u) => new Request(u, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys
        .filter((k) => k.startsWith('control-operativo-') && k !== CACHE)
        .map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === 'navigate') {
    // Abre al instante con la copia guardada; en segundo plano baja la versión nueva
    const net = fetch(req.url, { cache: 'no-cache' })
      .then((r) => {
        if (r.ok) { const copy = r.clone(); caches.open(CACHE).then((c) => c.put('./index.html', copy)); }
        return r;
      })
      .catch(() => null);
    e.waitUntil(net);
    e.respondWith(
      caches.match('./index.html').then((hit) => hit || net.then((r) => r ||
        new Response('<h1>Sin conexión</h1><p>Abre la app una vez con internet.</p>',
          { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } })))
    );
    return;
  }

  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then((hit) => hit || fetch(req).then((r) => {
      if (r.ok) { const copy = r.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
      return r;
    }))
  );
});
