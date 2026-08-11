// Service Worker pour Mangoo Tech - avec Push Notifications
// ?? CE SW NE G�RE PAS LES DOCUMENTS HTML � le navigateur les r�cup�re directement
const CACHE_NAME = 'mangoo-tech-v24';

// Installation du service worker
self.addEventListener('install', (event) => {
  console.log('[SW v17] Installation');
  self.skipWaiting();
});

// Activation du service worker � supprimer tous les anciens caches + notifier les clients
self.addEventListener('activate', (event) => {
  console.log('[SW v17] Activation � suppression de tous les anciens caches');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter(name => name !== CACHE_NAME).map((cacheName) => caches.delete(cacheName))
      );
    }).then(() => {
      return self.clients.claim();
    }).then(() => {
      // Notifier TOUS les clients qu'une mise � jour est dispo ? rechargement auto
      return self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'SW_UPDATED', version: 'v17' });
        });
      });
    })
  );
});

// �couter les messages du client (ex: SKIP_WAITING)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW v17] SKIP_WAITING re�u ? skipWaiting');
    self.skipWaiting();
  }
});

// Strat�gie : NE PAS intercepter les documents HTML.
// Le navigateur les r�cup�re directement ? toujours la derni�re version.
// Le SW ne g�re que les assets statiques (JS, CSS, images) et les Push.
self.addEventListener('fetch', (event) => {
  // Ignorer les requ�tes Vite HMR, WebSocket et ping
  if (event.request.url.includes('/@vite/') ||
      event.request.url.includes('/__vite_ping') ||
      event.request.url.includes('ws://') ||
      event.request.url.includes('wss://')) {
    return;
  }

  // DOCUMENTS HTML + NAVIGATION : ne pas intercepter.
  // Le navigateur g�re directement ? pas de cache SW ? toujours frais.
  if (event.request.destination === 'document' ||
      event.request.mode === 'navigate') {
    return; // pas de event.respondWith() ? le navigateur fait le fetch lui-m�me
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
  console.log('[SW v17] === PUSH RECU ===');
  console.log('[SW v17] Timestamp:', new Date().toISOString());

  let data = {};
  try {
    if (event.data) {
      data = event.data.json();
      console.log('[SW v17] Payload:', JSON.stringify(data).substring(0, 200));
    } else {
      console.log('[SW v17] Pas de donnees dans le push (event.data est null)');
    }
  } catch (e) {
    console.warn('[SW v17] Erreur parsing push:', e.message);
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

  console.log('[SW v17] showNotification:', title, '| tag:', options.tag, '| actions:', options.actions ? options.actions.length : 0);
  event.waitUntil(
    self.registration.showNotification(title, options).then(function() {
      console.log('[SW v17] Notification affichee avec succes');
    }).catch(function(err) {
      console.error('[SW v17] ECHEC affichage notification:', err.message);
      // Fallback: notification sans actions (compatible tous navigateurs)
      var fallbackOpts = {
        body: options.body,
        icon: options.icon,
        badge: options.badge,
        tag: options.tag,
        requireInteraction: true,
        vibrate: [200, 100, 200],
        data: options.data
      };
      return self.registration.showNotification(title, fallbackOpts).then(function() {
        console.log('[SW v17] Notification fallback affichee');
      }).catch(function(err2) {
        console.error('[SW v17] ECHEC fallback aussi:', err2.message);
      });
    })
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
      params.push('lpRole=vendor');
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
  params.set('lpRole', 'vendor');
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
