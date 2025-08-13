// Service Worker pour Mangoo Tech
const CACHE_NAME = 'mangoo-tech-v1';
const urlsToCache = [
  '/'
];

// Installation du service worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
});

// Activation du service worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Interception des requêtes
self.addEventListener('fetch', (event) => {
  // Ignorer les requêtes vers les modules Vite et les WebSockets
  if (event.request.url.includes('/@vite/') || 
      event.request.url.includes('/__vite_ping') ||
      event.request.url.includes('.js?') ||
      event.request.url.includes('.css?') ||
      event.request.url.includes('ws://') ||
      event.request.url.includes('wss://')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Retourner la réponse du cache si elle existe
        if (response) {
          return response;
        }
        // Sinon, faire la requête réseau avec gestion d'erreur
        return fetch(event.request).catch((error) => {
          console.log('Service Worker: Fetch failed for', event.request.url, error);
          // Retourner une réponse par défaut pour les erreurs de réseau
          if (event.request.destination === 'document') {
            return caches.match('/');
          }
          throw error;
        });
      })
      .catch((error) => {
        console.log('Service Worker: Cache match failed', error);
        return fetch(event.request);
      })
  );
});