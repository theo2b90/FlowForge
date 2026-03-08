const CACHE_NAME = 'focus-contexts-v1';
const urlsToCache = [
  './',
  './pomodoro_tools.html',
  './manifest.json'
];

// Installation du service worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache ouvert');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.warn('Erreur lors du caching:', error);
      })
  );
  self.skipWaiting();
});

// Activation du service worker
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Suppression de l\'ancien cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Stratégie: Network-first, fall back to cache
self.addEventListener('fetch', event => {
  // Ne cacher que les requêtes GET
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    // Essayer d'abord le réseau
    fetch(event.request)
      .then(response => {
        // Si succès, mettre en cache et retourner
        if (!response || response.status !== 200 || response.type === 'error') {
          return response;
        }

        const responseToCache = response.clone();
        caches.open(CACHE_NAME)
          .then(cache => {
            cache.put(event.request, responseToCache);
          });

        return response;
      })
      .catch(() => {
        // Si le réseau échoue, utiliser le cache
        return caches.match(event.request)
          .then(response => {
            return response || new Response('Hors ligne - ressource non trouvée');
          });
      })
  );
});
