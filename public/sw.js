// Service Worker pour Mangoo Tech - avec Push Notifications
// ⚠️ CE SW NE GÈRE PAS LES DOCUMENTS HTML — le navigateur les récupère directement
const CACHE_NAME = 'mangoo-tech-v13';

// Installation du service worker
self.addEventListener('install', (event) => {
  console.log('[SW v13] Installation');
  self.skipWaiting();
});

// Activation du service worker – supprimer tous les anciens caches + notifier les clients
self.addEventListener('activate', (event) => {
  console.log('[SW v13] Activation – suppression de tous les anciens caches');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter(name => name !== CACHE_NAME).map((cacheName) => caches.delete(cacheName))
      );
    }).then(() => {
      return self.clients.claim();
    }).then(() => {
      // Notifier TOUS les clients qu'une mise à jour est dispo → rechargement auto
      return self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'SW_UPDATED', version: 'v13' });
        });
      });
    })
  );
});

// Écouter les messages du client (ex: SKIP_WAITING)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW v13] SKIP_WAITING reçu → skipWaiting');
    self.skipWaiting();
  }
});

// Stratégie : NE PAS intercepter les documents HTML.
// Le navigateur les récupère directement → toujours la dernière version.
// Le SW ne gère que les assets statiques (JS, CSS, images) et les Push.
self.addEventListener('fetch', (event) => {
  // Ignorer les requêtes Vite HMR, WebSocket et ping
  if (event.request.url.includes('/@vite/') ||
      event.request.url.includes('/__vite_ping') ||
      event.request.url.includes('ws://') ||
      event.request.url.includes('wss://')) {
    return;
  }

  // DOCUMENTS HTML + NAVIGATION : ne pas intercepter.
  // Le navigateur gère directement → pas de cache SW → toujours frais.
  if (event.request.destination === 'document' ||
      event.request.mode === 'navigate') {
    return; // pas de event.respondWith() → le navigateur fait le fetch lui-même
  }

  // Assets statiques : network-first, cache en fallback
  event.respondWith(
    fetch(event.request).then((networkResponse) => {
      if (event.request.method === 'GET' && networkResponse.ok) {
        const responseClone = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        });
      }
      return networkResponse;
    }).catch(() => {
      return caches.match(event.request).then((cachedResponse) => {
        return cachedResponse || new Response('', { status: 503 });
      });
    })
  );
});

// ===== PUSH NOTIFICATIONS =====

/**
 * Evenement push - recoit une notification push du serveur
 * Quand le vendeur n'est pas connecte, lui envoie une notification d'appel entrant
 */
self.addEventListener('push', (event) => {
  console.log('[SW] Push recu:', event);

  let data = {};
  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (e) {
    data = { title: 'Appel entrant', body: 'Quelqu\'un souhaite vous parler' };
  }

  const title = data.title || 'MangooTech - Appel entrant';
  const notifKind = data.kind || 'call';
  const options = {
    body: data.body || 'Un client souhaite vous contacter',
    icon: data.icon || '/favicon.svg',
    badge: data.badge || '/favicon.svg',
    tag: data.tag || (notifKind === 'chat' ? 'mangoo-chat-' : 'mangoo-call-') + (data.roomId || Date.now()),
    requireInteraction: data.requireInteraction !== undefined ? data.requireInteraction : (notifKind !== 'system'),
    vibrate: notifKind === 'system' ? [100] : [200, 100, 200, 100, 200],
    data: {
      kind: notifKind,
      url: data.url || '/mangoo-local.html',
      roomId: data.roomId || '',
      callMode: data.callMode || 'audio',
      fromLabel: data.fromLabel || '',
      vendorId: data.vendorId || '',
      callId: data.callId || '',
      clientId: data.clientId || '',
      messageText: data.messageText || '',
      messageId: data.messageId || ''
    },
    ...(notifKind !== 'system' ? {
      actions: [
        {
          action: 'accept',
          title: data.acceptLabel || (notifKind === 'chat' ? 'Ouvrir' : 'Repondre')
        },
        {
          action: 'reject',
          title: data.rejectLabel || (notifKind === 'chat' ? 'Plus tard' : 'Refuser')
        }
      ]
    } : {})
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

/**
 * Clic sur une notification
 */
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification cliquee:', event.action);
  event.notification.close();

  const notifData = event.notification.data || {};
  // Utiliser l'URL absolue si fournie, sinon relative
  const basePage = (notifData.url && notifData.url.startsWith('http')) ? notifData.url : '/mangoo-local.html';

  // Si le vendeur accepte un message, ouvrir directement le chat
  if (event.action === 'accept') {
    if (notifData.kind === 'chat') {
      let targetUrl = basePage;
      const params = [];
      if (!targetUrl.includes('?')) params.push('v=' + Date.now());
      params.push('chatAction=open');
      if (notifData.roomId) params.push('roomId=' + encodeURIComponent(notifData.roomId));
      if (notifData.vendorId) params.push('vendorId=' + encodeURIComponent(notifData.vendorId));
      if (notifData.clientId) params.push('clientId=' + encodeURIComponent(notifData.clientId));
      if (notifData.fromLabel) params.push('fromLabel=' + encodeURIComponent(notifData.fromLabel));
      if (notifData.messageText) params.push('messageText=' + encodeURIComponent(notifData.messageText));
      if (notifData.messageId) params.push('messageId=' + encodeURIComponent(notifData.messageId));
      targetUrl += (targetUrl.includes('?') ? '&' : '?') + params.join('&');

      event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
          for (const client of clientList) {
            if (client.url.includes('mangoo-local')) {
              return client.focus().then(() => client.navigate(targetUrl));
            }
          }
          return clients.openWindow(targetUrl);
        })
      );
      return;
    }

    // Si le vendeur accepte, ouvrir directement la page d'appel
    let callUrl = basePage;
    const params = [];
    if (!callUrl.includes('?')) params.push('v=' + Date.now());
    if (notifData.roomId) params.push('roomId=' + encodeURIComponent(notifData.roomId));
    if (notifData.callMode) params.push('mode=' + encodeURIComponent(notifData.callMode));
    else params.push('mode=audio');
    params.push('lpRole=vendor');
    if (notifData.fromLabel) params.push('callee=' + encodeURIComponent(notifData.fromLabel));
    if (notifData.callId) params.push('callId=' + encodeURIComponent(notifData.callId));
    if (notifData.vendorId) params.push('vendor=' + encodeURIComponent(notifData.vendorId));
    callUrl += (callUrl.includes('?') ? '&' : '?') + params.join('&');

    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes('mangoo-local')) {
            return client.focus().then(() => client.navigate(callUrl));
          }
        }
        return clients.openWindow(callUrl);
      })
    );
    return;
  }

  // Refus ou clic simple : ouvrir mangoo-local
  let targetUrl = basePage;
  const params = new URLSearchParams();
  if (notifData.roomId) params.set('roomId', notifData.roomId);
  if (notifData.callMode) params.set('callMode', notifData.callMode);
  if (notifData.fromLabel) params.set('fromLabel', notifData.fromLabel);
  if (notifData.vendorId) params.set('vendor', notifData.vendorId);
  if (notifData.callId) params.set('callId', notifData.callId);
  if (notifData.kind) params.set('kind', notifData.kind);
  if (notifData.clientId) params.set('clientId', notifData.clientId);
  if (notifData.messageText) params.set('messageText', notifData.messageText);
  if (notifData.messageId) params.set('messageId', notifData.messageId);

  if (event.action === 'reject') {
    params.set('action', notifData.kind === 'chat' ? 'dismiss-chat' : 'reject-call');
  }

  const separator = targetUrl.includes('?') ? '&' : '?';
  targetUrl += separator + params.toString();

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('mangoo-local') || client.url.includes('webrtc-audio')) {
          return client.focus().then(() => client.navigate(targetUrl));
        }
      }
      return clients.openWindow(targetUrl);
    })
  );
});
