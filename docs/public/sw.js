/**
 * @fileoverview Service worker — lightweight Cache-First strategy for static assets.
 * Caches the app shell on install; serves from cache when available, falls back to network.
 */

const CACHE_NAME = 'alph0x-portfolio-v2';
const SHELL_ASSETS = [
  '/',
  '/index.html',
  '/editor.html',
  '/model-viewer.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/apple-touch-icon.png',
  '/assets/models/macbook.glb',
  '/assets/env/dusk_1k.hdr',
  '/assets/models/ATTRIBUTION.md',
  '/assets/tex/fabric/fabric_leather_02_diff_1k.jpg',
  '/assets/tex/fabric/fabric_leather_02_nor_gl_1k.jpg',
  '/assets/tex/fabric/fabric_leather_02_rough_1k.jpg',
  '/assets/tex/metal/metal_plate_diff_1k.jpg',
  '/assets/tex/metal/metal_plate_nor_gl_1k.jpg',
  '/assets/tex/metal/metal_plate_rough_1k.jpg',
  '/assets/tex/plaster/plastered_wall_diff_1k.jpg',
  '/assets/tex/plaster/plastered_wall_nor_gl_1k.jpg',
  '/assets/tex/plaster/plastered_wall_rough_1k.jpg',
  '/assets/tex/wood-floor/wood_floor_deck_diff_1k.jpg',
  '/assets/tex/wood-floor/wood_floor_deck_nor_gl_1k.jpg',
  '/assets/tex/wood-floor/wood_floor_deck_rough_1k.jpg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS))
  );
  // @ts-ignore skipWaiting exists on ServiceWorkerGlobalScope
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  // @ts-ignore clients exists on ServiceWorkerGlobalScope
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests from same origin
  const request = event.request;
  if (request.method !== 'GET') return;
  if (!request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        // Cache new static assets opportunistically
        if (response.ok && request.destination !== 'document') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      });
    })
  );
});
