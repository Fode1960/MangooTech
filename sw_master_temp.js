// Service Worker Mangoo Tech v9 ÔÇö Push uniquement, z├®ro cache, z├®ro interception
const SW_VERSION = 'v9';

self.addEventListener('install', () => {
  console.log('[SW ' + SW_VERSION + '] Install');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW ' + SW_VERSION + '] Activate ÔÇô wiping all caches');
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.map(function(k) { return caches.delete(k); }));
    }).then(function() {
      return self.clients.claim();
    })
  );
});

// AUCUN fetch listener ÔÇö on laisse tout passer directement au r├®seau

// ===== PUSH NOTIFICATIONS =====
// ---- Subscription change (Chrome peut invalider silencieusement l'abonnement) ----
self.addEventListener('pushsubscriptionchange', (event) => {
  console.log('[SW] pushsubscriptionchange d├®tect├®');
  event.waitUntil(
    (async function() {
      try {
        const oldSub = event.oldSubscription;
        const newSub = event.newSubscription;
        if (newSub) {
          // Nouvelle souscription disponible, notifier les clients
          const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
          clients.forEach(function(client) {
            client.postMessage({
              type: 'push-subscription-changed',
              oldEndpoint: oldSub ? oldSub.endpoint : null,
              newEndpoint: newSub.endpoint
            });
          });
        } else if (oldSub) {
          // Ancienne souscription invalid├®e, pas de nouvelle ÔåÆ demander r├®abonnement
          const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
          clients.forEach(function(client) {
            client.postMessage({
              type: 'push-subscription-lost',
              oldEndpoint: oldSub.endpoint
            });
          });
        }
      } catch(e) {
        console.error('[SW] Erreur pushsubscriptionchange:', e);
      }
    })()
  );
});

self.addEventListener('push', (event) => {
  console.log('[SW] Push re├ºu');
  let data = {};
  try { if (event.data) data = event.data.json(); } catch(e) {
    data = { title: 'Appel entrant', body: 'Quelqu\'un souhaite vous parler' };
  }
  const notifKind = data.kind || 'call';
  const options = {
    body: data.body || 'Un client souhaite vous contacter',
    icon: data.icon || '/mangoo-logo-192.png',
    badge: data.badge || '/mangoo-logo-192.png',
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
    actions: notifKind !== 'system' ? [
      { action: 'accept', title: data.acceptLabel || (notifKind === 'chat' ? 'Ouvrir' : 'R├®pondre') },
      { action: 'reject', title: data.rejectLabel || (notifKind === 'chat' ? 'Plus tard' : 'Refuser') }
    ] : undefined
  };
  event.waitUntil(self.registration.showNotification(data.title || 'MangooTech - Appel entrant', options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const d = event.notification.data || {};
  const basePage = (d.url && d.url.startsWith('http')) ? d.url : '/mangoo-local.html';

  if (event.action === 'accept') {
    let targetUrl = basePage;
    const p = [];
    p.push('v=' + Date.now());
    if (d.kind === 'chat') {
      p.push('chatAction=open');
      if (d.roomId) p.push('roomId=' + encodeURIComponent(d.roomId));
      if (d.clientId) p.push('clientId=' + encodeURIComponent(d.clientId));
      if (d.fromLabel) p.push('fromLabel=' + encodeURIComponent(d.fromLabel));
      if (d.messageText) p.push('messageText=' + encodeURIComponent(d.messageText));
      if (d.messageId) p.push('messageId=' + encodeURIComponent(d.messageId));
    } else {
      if (d.roomId) p.push('roomId=' + encodeURIComponent(d.roomId));
      p.push('mode=' + encodeURIComponent(d.callMode || 'audio'));
      p.push('lpRole=vendor');
      if (d.fromLabel) p.push('callee=' + encodeURIComponent(d.fromLabel));
      if (d.callId) p.push('callId=' + encodeURIComponent(d.callId));
    }
    if (d.vendorId) p.push('vendor=' + encodeURIComponent(d.vendorId));
    targetUrl += (targetUrl.includes('?') ? '&' : '?') + p.join('&');
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(list) {
        for (var i = 0; i < list.length; i++) {
          if (list[i].url.includes('mangoo-local')) return list[i].focus().then(function() { return list[i].navigate(targetUrl); });
        }
        return clients.openWindow(targetUrl);
      })
    );
    return;
  }

  var rejectUrl = basePage;
  var qs = [];
  if (d.roomId) qs.push('roomId=' + encodeURIComponent(d.roomId));
  if (d.callMode) qs.push('callMode=' + encodeURIComponent(d.callMode));
  if (d.fromLabel) qs.push('fromLabel=' + encodeURIComponent(d.fromLabel));
  if (d.vendorId) qs.push('vendor=' + encodeURIComponent(d.vendorId));
  if (d.callId) qs.push('callId=' + encodeURIComponent(d.callId));
  if (d.kind) qs.push('kind=' + encodeURIComponent(d.kind));
  if (d.clientId) qs.push('clientId=' + encodeURIComponent(d.clientId));
  if (event.action === 'reject') qs.push('action=' + (d.kind === 'chat' ? 'dismiss-chat' : 'reject-call'));
  rejectUrl += (rejectUrl.includes('?') ? '&' : '?') + qs.join('&');
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(list) {
      for (var i = 0; i < list.length; i++) {
        if (list[i].url.includes('mangoo-local') || list[i].url.includes('webrtc-audio')) {
          return list[i].focus().then(function() { return list[i].navigate(rejectUrl); });
        }
      }
      return clients.openWindow(rejectUrl);
    })
  );
});
