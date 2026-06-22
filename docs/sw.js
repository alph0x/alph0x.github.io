const CACHE_NAME = 'alph0x-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/editor.html',
  '/js/app.js',
  '/js/game.js',
  '/js/core.js',
  '/js/seed.js',
  '/style.css',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)));
});

self.addEventListener('fetch', (e) => {
  e.respondWith(caches.match(e.request).then((r) => r || fetch(e.request)));
});
