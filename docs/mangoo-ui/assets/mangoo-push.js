/* ==========================================================================
 * Mangoo Push — abonnement aux notifications Web Push (VAPID + Service Worker)
 * --------------------------------------------------------------------------
 * Expose `window.MangooPush` pour :
 *   - supported()   : le navigateur supporte-t-il les notifications push ?
 *   - autoSubscribe(): s'abonne silencieusement si la permission est déjà
 *                     accordée (aucun prompt) — appelé au chargement des pages.
 *   - enable()      : demande la permission puis s'abonne (doit être déclenché
 *                     par un geste utilisateur : clic sur un bouton).
 *   - disable()     : se désabonne et coupe la réception.
 *
 * Identité : l'abonnement est rattaché à l'identité temps réel de l'utilisateur
 * (même id que le WebSocket) pour que le serveur puisse cibler appels/messages.
 * ========================================================================== */
(function (global) {
  'use strict';
  if (global.MangooPush) return;

  var SUBSCRIBED_KEY = 'mgt_push_subscribed_v1';

  function readUser() {
    try {
      var raw = localStorage.getItem('mgt_user');
      if (!raw) return null;
      var u = JSON.parse(raw);
      return u || null;
    } catch (e) { return null; }
  }

  function token() {
    try { return localStorage.getItem('mgt_token') || ''; } catch (e) { return ''; }
  }

  // Id de routage = même identifiant que le WebSocket :
  //   - pro (vendeur/prestataire) → vendorId (slug boutique)
  //   - client                     → id du compte
  function routingId() {
    var u = readUser();
    if (!u) return '';
    var role = String(u.role || '').toLowerCase();
    if (role === 'vendeur' || role === 'prestataire' || role === 'livreur') return u.vendorId || u.id || '';
    return u.id || u.vendorId || '';
  }

  function userName() {
    var u = readUser();
    if (!u) return '';
    return u.enseigne || u.fullName || u.name || '';
  }

  function role() {
    var u = readUser();
    if (!u) return '';
    return String(u.role || '').toLowerCase();
  }

  function supported() {
    return !!(global.isSecureContext && 'serviceWorker' in navigator && 'PushManager' in global && 'Notification' in global);
  }

  function authHeaders() {
    return { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token() };
  }

  function fetchPublicKey() {
    return fetch('/push/vapid-public-key', { headers: { 'Accept': 'application/json' } })
      .then(function (r) { return r.json(); })
      .then(function (d) { return (d && d.publicKey) ? d.publicKey : ''; })
      .catch(function () { return ''; });
  }

  // Convertit une clé VAPID publique (base64url) en Uint8Array pour subscribe().
  function urlBase64ToUint8Array(base64String) {
    var padding = '='.repeat((4 - base64String.length % 4) % 4);
    var base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    var rawData = atob(base64);
    var outputArray = new Uint8Array(rawData.length);
    for (var i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
    return outputArray;
  }

  function markSubscribed() {
    try { localStorage.setItem(SUBSCRIBED_KEY, '1'); } catch (e) { /* ignore */ }
  }

  function markUnsubscribed() {
    try { localStorage.removeItem(SUBSCRIBED_KEY); } catch (e) { /* ignore */ }
  }

  function postSubscription(subscription) {
    return fetch('/push/subscribe', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        subscription: subscription.toJSON ? subscription.toJSON() : subscription,
        role: role(),
        name: userName()
      })
    }).then(function (r) {
      if (!r.ok) throw new Error('échec abonnement ' + r.status);
      return r.json();
    });
  }

  // Abonnement complet : clé VAPID → enregistrement SW → souscription → envoi serveur.
  function subscribeNow() {
    return fetchPublicKey().then(function (pk) {
      if (!pk) throw new Error('clé VAPID indisponible');
      return navigator.serviceWorker.register('/sw.js', { scope: '/' }).then(function (reg) {
        return reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(pk) });
      });
    }).then(function (subscription) {
      return postSubscription(subscription);
    }).then(function () {
      markSubscribed();
      return true;
    });
  }

  // S'assure qu'un abonnement valide existe (sans re-demander la permission).
  function ensureSubscribed() {
    if (!supported() || !token() || !routingId()) return Promise.resolve(false);
    return navigator.serviceWorker.ready.then(function (reg) {
      return reg.pushManager.getSubscription();
    }).then(function (sub) {
      if (sub) {
        // Re-synchronise l'endpoint (utile après rotation VAPID ou purge).
        return postSubscription(sub).then(function () { markSubscribed(); return true; })
          .catch(function () { return true; });
      }
      return subscribeNow();
    }).catch(function () { return false; });
  }

  // Abonnement silencieux : uniquement si la permission est déjà accordée.
  function autoSubscribe() {
    if (!supported()) return Promise.resolve(false);
    if (global.Notification.permission !== 'granted') return Promise.resolve(false);
    return ensureSubscribed();
  }

  // Demande la permission (geste utilisateur) puis s'abonne.
  function enable() {
    if (!supported()) return Promise.resolve({ granted: false, reason: 'unsupported' });
    return global.Notification.requestPermission().then(function (p) {
      if (p !== 'granted') return { granted: false, reason: p };
      return subscribeNow()
        .then(function () { return { granted: true }; })
        .catch(function (e) { return { granted: true, error: e && e.message }; });
    });
  }

  function disable() {
    if (!supported()) return Promise.resolve(false);
    return navigator.serviceWorker.ready.then(function (reg) {
      return reg.pushManager.getSubscription().then(function (sub) {
        if (!sub) { markUnsubscribed(); return false; }
        var endpoint = sub.endpoint;
        return fetch('/push/unsubscribe', {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({ endpoint: endpoint })
        }).catch(function () { /* le serveur peut être hors ligne */ })
          .then(function () { return sub.unsubscribe(); })
          .then(function () { markUnsubscribed(); return true; });
      });
    }).catch(function () { markUnsubscribed(); return false; });
  }

  // Réabonnement automatique si le navigateur remplace l'abonnement.
  if (supported()) {
    navigator.serviceWorker.ready.then(function (reg) {
      reg.addEventListener('pushsubscriptionchange', function () { autoSubscribe(); });
    }).catch(function () { /* ignore */ });
  }

  // Mini-invite d'activation : s'affiche UNE fois si la permission n'a pas
  // encore été choisie et que l'utilisateur est authentifié. Le clic fournit
  // le geste utilisateur requis (iOS Safari y compris) pour requestPermission.
  function maybeShowEnablePrompt() {
    if (!supported()) return;
    if (!token() || !routingId()) return;
    if (global.Notification.permission !== 'default') return;
    try { if (sessionStorage.getItem('mgt_push_prompt_dismissed') === '1') return; } catch (e) {}
    if (document.getElementById('mgt-push-prompt')) return;

    var el = document.createElement('div');
    el.id = 'mgt-push-prompt';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', 'Activer les notifications');
    el.style.cssText = 'position:fixed;right:16px;bottom:16px;z-index:2147483000;max-width:320px;' +
      'background:#0f172a;color:#fff;border:1px solid rgba(255,255,255,.14);border-radius:14px;' +
      'padding:14px 16px;box-shadow:0 12px 40px rgba(0,0,0,.35);' +
      'font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;font-size:14px;line-height:1.45';

    var title = document.createElement('div');
    title.style.cssText = 'font-weight:700;font-size:14px;margin-bottom:4px';
    title.textContent = 'Recevoir les appels et messages';

    var desc = document.createElement('div');
    desc.style.cssText = 'color:rgba(255,255,255,.78);margin-bottom:12px';
    desc.textContent = 'Soyez prévenu même quand votre espace est fermé.';

    function btn(label, primary) {
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = label;
      b.style.cssText = 'cursor:pointer;border:0;border-radius:8px;padding:8px 12px;font-size:13px;font-weight:600;' +
        (primary ? 'background:#16a34a;color:#fff;' : 'background:transparent;color:rgba(255,255,255,.8);');
      return b;
    }

    function dismiss(remember) {
      try { if (remember) sessionStorage.setItem('mgt_push_prompt_dismissed', '1'); } catch (e) {}
      if (el.parentNode) el.parentNode.removeChild(el);
    }

    var actions = document.createElement('div');
    actions.style.cssText = 'display:flex;gap:8px;justify-content:flex-end';

    var later = btn('Plus tard', false);
    later.addEventListener('click', function () { dismiss(true); });

    var enableBtn = btn('Activer', true);
    enableBtn.addEventListener('click', function () {
      enable().then(function () { dismiss(true); });
    });

    actions.appendChild(later);
    actions.appendChild(enableBtn);
    el.appendChild(title);
    el.appendChild(desc);
    el.appendChild(actions);
    document.body.appendChild(el);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', maybeShowEnablePrompt);
  } else {
    maybeShowEnablePrompt();
  }

  global.MangooPush = {
    supported: supported,
    isGranted: function () { return supported() && global.Notification.permission === 'granted'; },
    autoSubscribe: autoSubscribe,
    enable: enable,
    disable: disable
  };
})(window);
