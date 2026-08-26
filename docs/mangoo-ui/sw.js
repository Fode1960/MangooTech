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

// Normalise une URL cible : les chemins relatifs sont résolus sur l'origine.
function resolveUrl(url) {
  if (!url) return '/';
  try {
    return new URL(url, self.location.origin).href;
  } catch (e) {
    return '/';
  }
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
  var options = {
    body: payload.body || '',
    icon: payload.icon || '/assets/favicon.png',
    badge: payload.badge || '/assets/favicon.png',
    tag: payload.tag || ('mangoo-' + Date.now()),
    data: {
      url: resolveUrl(payload.url || '/'),
      extra: payload.data || {}
    },
    vibrate: [200, 100, 200]
  };

  if (payload.requireInteraction) options.requireInteraction = true;
  if (Array.isArray(payload.actions) && payload.actions.length) options.actions = payload.actions;

  event.waitUntil(self.registration.showNotification(title, options));
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
          return client.focus();
        }
      }
      return self.clients.openWindow(target);
    })
  );
});
