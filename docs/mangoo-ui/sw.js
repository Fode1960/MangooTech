/* ==========================================================================
 * Mangoo Connect+ — Service Worker (notifications Web Push)
 * --------------------------------------------------------------------------
 * Reçoit les notifications envoyées par le serveur (appels, messages,
 * Live Shopping) même lorsque le Dashboard est FERMÉ, pourvu que le
 * navigateur soit actif (arrière-plan autorisé).
 *
 * Cycle de vie :
 *   - install  : prend immédiatement le contrôle (skipWaiting)
 *   - activate : contrôle les pages déjà ouvertes (clients.claim)
 *   - push     : affiche une notification système
 *   - notificationclick : ouvre (ou ramène au premier plan) la page cible
 * ========================================================================== */
'use strict';

self.addEventListener('install', function () {
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(self.clients.claim());
});

// Gestionnaire fetch minimal — requis par Chrome pour rendre l'app installable
// (déclenchement de `beforeinstallprompt`) et pour fournir un repli hors-ligne
// basique. Stratégie « réseau d'abord » : aucun cache écrit, donc aucun asset
// périmé ne peut être servi ; le comportement en ligne reste strictement
// identique à l'absence de service worker.
self.addEventListener('fetch', function (event) {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request).catch(function () {
      return caches.match(event.request).then(function (cached) {
        if (cached) return cached;
        return new Response('Hors ligne', {
          status: 503,
          statusText: 'Offline',
          headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
      });
    })
  );
});

// Normalise une URL cible : les chemins relatifs sont résolus sur l'origine.
function resolveUrl(url) {
  if (!url) return '/';
  try {
    return new URL(url, self.location.origin).href;
  } catch (e) {
    return '/';
  }
}

// Mémorise la dernière cible de notification (message / appel) dans le cache afin
// que la page d'accueil — ouverte via le logo de la PWA sans clic sur la
// notification — puisse rediriger le professionnel connecté vers la bonne
// conversation / l'overlay d'appel. Le cache est le seul espace partagé entre le
// service worker et les pages (localStorage n'est pas accessible au SW).
var LAST_LANDING_CACHE = 'mgt-push-state';
var LAST_LANDING_KEY = '/__mgt_last_landing__';
function persistLastLanding(url) {
  try {
    return caches.open(LAST_LANDING_CACHE).then(function (cache) {
      // Stocke l'URL avec un horodatage pour pouvoir ignorer un landing périmé
      // (et ne plus rejouer indéfiniment une vieille notification).
      var payload = JSON.stringify({ url: String(url || '/'), ts: Date.now() });
      return cache.put(LAST_LANDING_KEY, new Response(payload));
    });
  } catch (e) { return Promise.resolve(); }
}
function clearLastLanding() {
  try {
    return caches.open(LAST_LANDING_CACHE).then(function (cache) {
      return cache.delete(LAST_LANDING_KEY);
    });
  } catch (e) { return Promise.resolve(); }
}

self.addEventListener('push', function (event) {
  var payload = {};
  try {
    if (event.data) payload = event.data.json();
  } catch (e) {
    try {
      payload = { title: 'MangooTech', body: event.data ? event.data.text() : '' };
    } catch (e2) {
      payload = { title: 'MangooTech', body: '' };
    }
  }

  var title = payload.title || 'MangooTech';
  var targetUrl = resolveUrl(payload.url || '/');
  var options = {
    body: payload.body || '',
    icon: payload.icon || '/assets/favicon.png',
    badge: payload.badge || '/assets/favicon.png',
    tag: payload.tag || ('mangoo-' + Date.now()),
    data: {
      url: targetUrl,
      extra: payload.data || {}
    },
    vibrate: [200, 100, 200]
  };

  if (payload.requireInteraction) options.requireInteraction = true;
  if (Array.isArray(payload.actions) && payload.actions.length) options.actions = payload.actions;

  event.waitUntil(
    self.registration.showNotification(title, options).then(function () {
      return persistLastLanding(targetUrl);
    })
  );
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  var target = '/';
  try {
    var d = event.notification.data || {};
    target = d.url || '/';
  } catch (e) {
    target = '/';
  }

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        if (client.url === target || (client.url && client.url.indexOf(target) === 0)) {
          return client.focus().then(function () { return clearLastLanding(); });
        }
      }
      return self.clients.openWindow(target).then(function () { return clearLastLanding(); });
    })
  );
});
