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

  // État courant, pour afficher un bouton « Notifications » dans la cloche.
  function state() {
    return {
      supported: supported(),
      permission: supported() ? global.Notification.permission : 'unsupported',
      granted: supported() && global.Notification.permission === 'granted'
    };
  }

  // Réglage « suivi des vendeurs » : lit les préférences + la liste des
  // vendeurs/prestataires disponibles auprès du serveur.
  function getPreferences() {
    return fetch('/push/preferences', { headers: authHeaders() })
      .then(function (r) {
        if (!r.ok) throw new Error('préférences indisponibles ' + r.status);
        return r.json();
      })
      .then(function (d) {
        return {
          prefs: (d && d.prefs) || { followMode: 'all', vendorIds: [] },
          vendors: (d && d.vendors) || []
        };
      });
  }

  function savePreferences(prefs) {
    return fetch('/push/preferences', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(prefs || {})
    }).then(function (r) {
      if (!r.ok) throw new Error('échec enregistrement ' + r.status);
      return r.json();
    });
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // Libellé d'état du bouton « Notifications » (pour la cloche).
  function notifLabel() {
    if (!supported()) return 'Non pris en charge';
    if (global.Notification.permission === 'granted') return 'Activées';
    if (global.Notification.permission === 'denied') return 'Bloquées';
    return 'Désactivées';
  }

  // Ouvre la modale « Suivi des vendeurs » : choisir de quels lives être prévenu.
  function openFollowSettings() {
    var overlay = document.createElement('div');
    overlay.id = 'mgt-follow-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:2147483500;display:flex;align-items:center;justify-content:center;padding:16px;';

    var box = document.createElement('div');
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-label', 'Suivi des vendeurs');
    box.style.cssText = 'background:#fff;color:#0f172a;border-radius:16px;width:100%;max-width:460px;max-height:80vh;display:flex;flex-direction:column;overflow:hidden;' +
      'font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;box-shadow:0 24px 80px rgba(0,0,0,.4);';

    var head = document.createElement('div');
    head.style.cssText = 'padding:16px 18px;border-bottom:1px solid #e2e8f0;display:flex;align-items:center;justify-content:space-between;';
    var title = document.createElement('div');
    title.style.cssText = 'font-weight:700;font-size:16px;';
    title.textContent = 'Suivi des vendeurs';
    var closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.textContent = '×';
    closeBtn.style.cssText = 'border:0;background:none;font-size:24px;line-height:1;cursor:pointer;color:#64748b;padding:0 4px;';
    head.appendChild(title);
    head.appendChild(closeBtn);
    box.appendChild(head);

    var body = document.createElement('div');
    body.style.cssText = 'padding:16px 18px;overflow-y:auto;';
    body.innerHTML = '<div style="color:#64748b;font-size:13px;padding-bottom:14px;">Choisissez de quels lives vous souhaitez être prévenu(e).</div>';
    box.appendChild(body);

    function radio(name, value, checked, label, sub) {
      var lab = document.createElement('label');
      lab.style.cssText = 'display:flex;gap:10px;align-items:flex-start;padding:12px;border:1px solid #e2e8f0;border-radius:10px;cursor:pointer;margin-bottom:10px;';
      lab.style.background = checked ? '#f0fdf4' : '#fff';
      lab.style.borderColor = checked ? '#16a34a' : '#e2e8f0';
      var input = document.createElement('input');
      input.type = 'radio';
      input.name = name;
      input.value = value;
      input.checked = checked;
      input.style.cssText = 'margin-top:2px;accent-color:#16a34a;';
      var div = document.createElement('div');
      var strong = document.createElement('div');
      strong.textContent = label;
      strong.style.cssText = 'font-weight:600;font-size:14px;';
      div.appendChild(strong);
      if (sub) { var s = document.createElement('div'); s.textContent = sub; s.style.cssText = 'font-size:12px;color:#64748b;margin-top:2px;'; div.appendChild(s); }
      lab.appendChild(input);
      lab.appendChild(div);
      body.appendChild(lab);
      return input;
    }

    var allRadio = radio('mgt-follow-mode', 'all', true, 'Tous les lives', 'Soyez prévenu dès qu\'un vendeur démarre un live.');
    var selRadio = radio('mgt-follow-mode', 'selected', false, 'Seulement les vendeurs suivis', 'Ne recevez que les lives des vendeurs cochés ci-dessous.');

    var vendorList = document.createElement('div');
    vendorList.style.cssText = 'display:none;margin-top:4px;';
    body.appendChild(vendorList);

    var footer = document.createElement('div');
    footer.style.cssText = 'padding:14px 18px;border-top:1px solid #e2e8f0;display:flex;justify-content:flex-end;gap:8px;';
    var cancel = document.createElement('button');
    cancel.type = 'button';
    cancel.textContent = 'Annuler';
    cancel.style.cssText = 'cursor:pointer;border:1px solid #e2e8f0;background:#fff;color:#334155;border-radius:10px;padding:9px 14px;font-size:14px;font-weight:600;';
    var save = document.createElement('button');
    save.type = 'button';
    save.textContent = 'Enregistrer';
    save.style.cssText = 'cursor:pointer;border:0;background:#16a34a;color:#fff;border-radius:10px;padding:9px 16px;font-size:14px;font-weight:600;';
    footer.appendChild(cancel);
    footer.appendChild(save);
    box.appendChild(footer);

    overlay.appendChild(box);
    document.body.appendChild(overlay);

    function close() { if (overlay.parentNode) overlay.parentNode.removeChild(overlay); }
    closeBtn.addEventListener('click', close);
    cancel.addEventListener('click', close);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
    document.addEventListener('keydown', function onKey(e) { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', onKey); } });

    var loadedPrefs = { followMode: 'all', vendorIds: [] };
    getPreferences().then(function (res) {
      loadedPrefs = res.prefs;
      var mode = loadedPrefs.followMode || 'all';
      allRadio.checked = (mode === 'all');
      selRadio.checked = (mode === 'selected');
      vendorList.style.display = (mode === 'selected') ? 'block' : 'none';
      renderVendors(res.vendors || []);
    }).catch(function () { /* modal reste sur les défauts */ });

    function renderVendors(vendors) {
      var checked = (loadedPrefs.vendorIds || []).slice();
      if (!vendors.length) {
        vendorList.innerHTML = '<div style="color:#94a3b8;font-size:13px;padding:12px;">Aucun vendeur disponible pour le moment.</div>';
        return;
      }
      var html = '<div style="font-size:12px;color:#64748b;margin:4px 0 6px;">Cochez les vendeurs à suivre :</div>';
      vendors.forEach(function (v) {
        var id = String(v.vendorId || '');
        var isChecked = checked.indexOf(id) !== -1;
        html += '<label style="display:flex;align-items:center;gap:10px;padding:9px 10px;border:1px solid #e2e8f0;border-radius:9px;margin-bottom:6px;cursor:pointer;">' +
          '<input type="checkbox" data-vendor="' + esc(id) + '"' + (isChecked ? ' checked' : '') + ' style="accent-color:#16a34a;width:16px;height:16px;flex-shrink:0;">' +
          '<span style="flex:1;min-width:0;"><span style="display:block;font-size:13.5px;font-weight:600;color:#0f172a;">' + esc(v.name) + '</span>' +
          ((v.category || v.city) ? '<span style="display:block;font-size:12px;color:#64748b;">' + esc([v.category, v.city].filter(Boolean).join(' · ')) + '</span>' : '') +
          '</span></label>';
      });
      vendorList.innerHTML = html;
    }

    function currentMode() {
      return selRadio.checked ? 'selected' : 'all';
    }
    function currentVendorIds() {
      var ids = [];
      var boxes = vendorList.querySelectorAll('input[data-vendor]:checked');
      for (var i = 0; i < boxes.length; i++) ids.push(boxes[i].getAttribute('data-vendor'));
      return ids;
    }

    allRadio.addEventListener('change', function () { vendorList.style.display = 'none'; });
    selRadio.addEventListener('change', function () { vendorList.style.display = 'block'; });

    save.addEventListener('click', function () {
      save.disabled = true;
      save.textContent = 'Enregistrement…';
      savePreferences({ followMode: currentMode(), vendorIds: currentVendorIds() })
        .then(function () { close(); })
        .catch(function () { save.disabled = false; save.textContent = 'Enregistrer'; });
    });
  }

  // --- Ligne « Notifications » (toggle) injectée dans le panneau cloche ---
  var BELL_ON = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>';
  var BELL_OFF = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.7 3A6 6 0 0 1 18 8a21.3 21.3 0 0 0 .6 5"/><path d="M17 17H3s3-2 3-9a4.67 4.67 0 0 1 .3-1.7"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/><path d="m2 2 20 20"/></svg>';

  function bellRowHTML() {
    if (!supported()) {
      return '<div style="padding:12px 14px;font-size:12.5px;color:rgb(var(--mgt-muted-foreground));border-bottom:1px solid rgb(var(--mgt-border));">Les notifications push ne sont pas prises en charge par ce navigateur.</div>';
    }
    var granted = isGranted();
    var label = notifLabel();
    var iconColor = granted ? '#16a34a' : 'rgb(var(--mgt-muted-foreground))';
    var icon = granted ? BELL_ON : BELL_OFF;
    var knobLeft = granted ? '18px' : '3px';
    return '<button type="button" data-act="toggle-notif" style="display:flex;align-items:center;gap:12px;width:100%;text-align:left;background:none;border:0;cursor:pointer;padding:12px 14px;border-bottom:1px solid rgb(var(--mgt-border));color:rgb(var(--mgt-foreground));font-family:inherit;">' +
      '<span style="width:36px;height:36px;border-radius:50%;background:' + (granted ? 'rgba(22,163,74,.14)' : 'rgb(var(--mgt-muted))') + ';display:inline-flex;align-items:center;justify-content:center;color:' + iconColor + ';flex-shrink:0;">' + icon + '</span>' +
      '<span style="flex:1;min-width:0;"><span style="display:block;font-size:13px;font-weight:600;">Notifications</span><span style="display:block;font-size:11.5px;color:rgb(var(--mgt-muted-foreground));">' + label + ' · appels, messages, live</span></span>' +
      '<span style="width:40px;height:22px;border-radius:999px;background:' + (granted ? '#16a34a' : 'rgb(var(--mgt-border))') + ';position:relative;flex-shrink:0;display:inline-block;transition:background .2s;"><span style="position:absolute;top:2px;left:' + knobLeft + ';width:18px;height:18px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.25);transition:left .2s;"></span></span>' +
      '</button>';
  }

  // À appeler une fois le popover créé : active le bouton toggle (délégation,
  // car le contenu n'existe qu'après la première ouverture) et rafraîchit la
  // vue via onChanged (ex. re-ouverture du popover).
  function bindBellRow(rootEl, onChanged) {
    if (!rootEl) return;
    rootEl.addEventListener('click', function (e) {
      var btn = e.target && e.target.closest ? e.target.closest('[data-act="toggle-notif"]') : null;
      if (!btn) return;
      e.stopPropagation();
      if (!supported()) return;
      var granted = isGranted();
      var done = function () { if (typeof onChanged === 'function') onChanged(); };
      if (granted) { disable().then(done); } else { enable().then(done); }
    });
  }

  global.MangooPush = {
    supported: supported,
    isGranted: function () { return supported() && global.Notification.permission === 'granted'; },
    state: state,
    notifLabel: notifLabel,
    autoSubscribe: autoSubscribe,
    enable: enable,
    disable: disable,
    getPreferences: getPreferences,
    savePreferences: savePreferences,
    openFollowSettings: openFollowSettings,
    bellRowHTML: bellRowHTML,
    bindBellRow: bindBellRow
  };
})(window);
