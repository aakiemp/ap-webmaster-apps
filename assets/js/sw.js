/* AP Webmaster Apps service worker. Scope: /apps/demo/ only.
 * Caches this plugin's own versioned files so the app opens quickly.
 * Never caches pages or anything from the rest of the website. */
const VERSION = '__APWA_VERSION__';
const ASSET_PREFIX = '__APWA_ASSET_PREFIX__';
const CACHE = 'apwa-assets-' + VERSION;

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('apwa-assets-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || !req.url.startsWith(ASSET_PREFIX)) return;
  event.respondWith(
    caches.open(CACHE).then((cache) =>
      cache.match(req).then((hit) => hit || fetch(req).then((res) => {
        if (res.ok) cache.put(req, res.clone());
        return res;
      }))
    )
  );
});
