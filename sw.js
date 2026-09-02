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

// Identifiant de version : à chaque déploiement, on le change pour forcer la
// purge des anciens caches (dont « mgt-push-state » qui mémorisait un landing de
// notification). Cela garantit qu'aucun vieux routage — ex. renvoyer un
// professionnel vers la page client chat.html — n'est rejoué après coup.
var SW_VERSION = 'mgt-sw-2026-09-02-1';

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      // Aucun cache n'est persistant : le SW est « réseau d'abord » (aucune
      // écriture de cache de page) et mgt-push-state est un usage one-shot.
      return Promise.all(keys.map(function (key) { return caches.delete(key); }));
    }).then(function () {
      return self.clients.claim();
    }).then(function () {
      // Recharge les fenêtres bloquées sur l'ancienne page client chat.html
      // (résidu d'un vieux routage) : la page fraîche contient le garde-fou qui
      // renvoie un professionnel vers sa propre messagerie.
      return self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clients) {
        clients.forEach(function (client) {
          try {
            if (client.url && client.url.indexOf('/pages/chat.html') >= 0) {
              client.navigate(client.url);
            }
          } catch (e) { /* ignore */ }
        });
      });
    })
  );
});

// Permet aux pages de forcer l'activation immédiate d'un worker en attente
// (utilisé par l'auto-mise à jour de mangoo-push.js). Sans cela, un worker
// « waiting » pourrait rester inactif jusqu'à la fermeture de tous les onglets.
self.addEventListener('message', function (event) {
  var data = event.data || {};
  if (data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (data.type === 'CLEAR_NOTIFICATIONS') {
    // Demande émise par mangoo-push.js (ex. après une redirection landing) :
    // on ferme TOUTES les notifications système encore affichées afin qu'une
    // seconde notification ne reste pas à l'écran une fois la première consultée.
    event.waitUntil(closeAllNotifications());
  }
});

// Ferme toutes les notifications actives, quel que soit leur `tag`. C'est le
// comportement attendu : consulter une notification doit purger l'écran (évite
// qu'une 2ᵉ notification reste perçue comme nouvelle).
function closeAllNotifications() {
  if (!self.registration || !self.registration.getNotifications) {
    return Promise.resolve();
  }
  return self.registration.getNotifications().then(function (list) {
    (list || []).forEach(function (n) { try { n.close(); } catch (e) {} });
  }).catch(function () { /* ignore */ });
}

// Gestionnaire fetch minimal — requis par Chrome pour rendre l'app installable
// (déclenchement de `beforeinstallprompt`) et pour fournir un repli hors-ligne
// basique. Stratégie « réseau d'abord » : aucun cache écrit, donc aucun asset
// périmé ne peut être servi ; le comportement en ligne reste strictement
// identique à l'absence de service worker.
self.addEventListener('fetch', function (event) {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request, { cache: 'no-store' }).catch(function () {
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

  // Déduplication : au premier clic on ferme TOUTES les notifications actives
  // (message, appel, live…) — pas seulement celles du même `tag` — afin qu'une
  // seconde notification ne reste pas à l'écran et ne soit plus perçue comme
  // nouvelle après consultation de la première.
  event.waitUntil(
    closeAllNotifications().then(function () {
      return self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    }).then(function (clientList) {
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
