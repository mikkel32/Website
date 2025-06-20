const CACHE_NAME = 'sg-cache-v2';
const ASSETS = [
  '/',
  '/index.html',
  '/main.css',
  '/main.js',
  '/anime.bundle.mjs',
  '/dashboard/chart.bundle.mjs',
  '/node_modules/@fontsource/poppins/files/poppins-devanagari-400-normal.woff2',
  '/node_modules/@fontsource/poppins/files/poppins-latin-ext-400-normal.woff2',
  '/node_modules/@fontsource/poppins/files/poppins-latin-400-normal.woff2',
  '/node_modules/@fortawesome/fontawesome-free/webfonts/fa-v4compatibility.woff2',
  '/node_modules/@fortawesome/fontawesome-free/webfonts/fa-solid-900.woff2',
  '/node_modules/@fortawesome/fontawesome-free/webfonts/fa-regular-400.woff2',
  '/node_modules/@fortawesome/fontawesome-free/webfonts/fa-brands-400.woff2'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      );
    })
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== location.origin) return;

  event.respondWith(
    caches.match(event.request).then(res => res || fetch(event.request))
  );
});
