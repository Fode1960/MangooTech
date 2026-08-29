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
  var VAPID_KEY = 'mgt_push_vapid_key_v1';

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

  function storedVapidKey() {
    try { return localStorage.getItem(VAPID_KEY) || ''; } catch (e) { return ''; }
  }
  function storeVapidKey(pk) {
    try { localStorage.setItem(VAPID_KEY, pk || ''); } catch (e) { /* ignore */ }
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

  // Attend que le service worker soit réellement ACTIF. `register()` se résout
  // souvent pendant l'installation (état `installing`/`waiting`) ; or
  // `pushManager.subscribe()` exige un worker `activated`, sinon Chrome renvoie
  // « Subscription failed - no active Service Worker ».
  function waitForActiveWorker(reg) {
    return new Promise(function (resolve) {
      if (reg.active) { resolve(); return; }
      var w = reg.waiting || reg.installing;
      if (!w) { resolve(); return; }
      var done = false;
      function onState() {
        if (w.state === 'activated') {
          done = true;
          w.removeEventListener('statechange', onState);
          resolve();
        }
      }
      w.addEventListener('statechange', onState);
      // Filet de sécurité : ne jamais bloquer l'abonnement plus de 4 s.
      setTimeout(function () {
        if (!done) { w.removeEventListener('statechange', onState); resolve(); }
      }, 4000);
    });
  }

  // Abonnement complet : clé VAPID → enregistrement SW → souscription → envoi serveur.
  function subscribeNow() {
    var currentKey = '';
    return fetchPublicKey().then(function (pk) {
      currentKey = pk;
      if (!pk) throw new Error('clé VAPID indisponible');
      return navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' }).then(function (reg) {
        return waitForActiveWorker(reg).then(function () {
          return reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(pk) });
        });
      });
    }).then(function (subscription) {
      return postSubscription(subscription);
    }).then(function () {
      storeVapidKey(currentKey);
      markSubscribed();
      return true;
    });
  }

  // S'assure qu'un abonnement valide existe (sans re-demander la permission).
  // IMPORTANT : on enregistre EXPLICITEMENT le service worker avant d'attendre
  // sa disponibilité. Sinon, quand la permission est déjà « granted » mais que
  // le SW n'a jamais été installé, navigator.serviceWorker.ready ne se résout
  // JAMAIS (aucun SW actif) => deadlock => subscriptionsTotal reste à 0.
  function ensureSubscribed() {
    if (!supported() || !token() || !routingId()) return Promise.resolve(false);
    return fetchPublicKey().then(function (pk) {
      var wantKey = pk || '';
      return navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' })
        .then(function (reg) {
          return reg.pushManager.getSubscription().then(function (sub) {
            if (sub) {
              // Après rotation des clés VAPID, un abonnement existant est chiffré
              // avec l'ancienne clé et rejeté (403) par le service push. On le
              // détruit puis on se réabonne avec la clé courante.
              if (wantKey && storedVapidKey() !== wantKey) {
                return sub.unsubscribe().then(function () { return subscribeNow(); });
              }
              // Re-synchronise l'endpoint (utile après purge côté serveur).
              return postSubscription(sub).then(function () { markSubscribed(); return true; })
                .catch(function () { return true; });
            }
            return subscribeNow();
          });
        });
    }).catch(function (e) {
      console.warn('[Push] échec ensureSubscribed :', (e && e.message) || e);
      return false;
    });
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

  // ===== Auto-mise à jour du service worker =====
  // Le navigateur met en cache le script du service worker et espace ses contrôles
  // de mise à jour (jusqu'à ~24 h). Après un déploiement, un ANCIEN worker (et son
  // ancien routage de notification / ses anciennes pages en cache) peut donc rester
  // actif, d'où des comportements fantômes (ex. logo PWA qui renvoie vers la page
  // de chat au lieu de l'espace pro). On force un contrôle de mise à jour à chaque
  // chargement, puis on recharge UNE seule fois quand le nouveau worker prend le
  // contrôle, pour appliquer la correction immédiatement sans vider le cache à la main.
  if ('serviceWorker' in navigator) {
    try {
      navigator.serviceWorker.getRegistration('/sw.js').then(function (reg) {
        if (!reg) return;
        reg.update().catch(function () { /* ignore */ });
        if (reg.waiting) { try { reg.waiting.postMessage({ type: 'SKIP_WAITING' }); } catch (e) { /* ignore */ } }
      }).catch(function () { /* ignore */ });
      var _mgtSwReloaded = false;
      navigator.serviceWorker.addEventListener('controllerchange', function () {
        if (_mgtSwReloaded) return;
        _mgtSwReloaded = true;
        try { global.location.reload(); } catch (e) { /* ignore */ }
      });
    } catch (e) { /* ignore */ }
  }

  // État courant, pour afficher un bouton « Notifications » dans la cloche.
  function state() {
    return {
      supported: supported(),
      permission: supported() ? global.Notification.permission : 'unsupported',
      granted: supported() && global.Notification.permission === 'granted'
    };
  }

  // Diagnostic détaillé (pour le support) : permission, support, identité de
  // routage, et état de l'abonnement service worker / push réel.
  function diagnose() {
    var u = readUser();
    var out = {
      supported: supported(),
      secureContext: !!(global.isSecureContext),
      permission: supported() ? global.Notification.permission : 'unsupported',
      token: !!token(),
      routingId: routingId(),
      role: u ? u.role : '',
      userRaw: readUser()
    };
    if (!supported()) return Promise.resolve(out);
    return navigator.serviceWorker.getRegistration('/sw.js').then(function (reg) {
      out.hasSwRegistration = !!reg;
      if (!reg) return out;
      if (reg.active) out.swState = 'active';
      else if (reg.waiting) out.swState = 'waiting';
      else if (reg.installing) out.swState = 'installing';
      else out.swState = 'none';
      return reg.pushManager.getSubscription().then(function (sub) {
        out.hasSubscription = !!sub;
        out.endpoint = sub ? sub.endpoint : '';
        return out;
      });
    }).catch(function (e) { out.error = (e && e.message) || String(e); return out; });
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

  // --- Installabilité PWA (manifest + méta iOS) ---
  function isIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !global.MSStream;
  }
  function isStandalone() {
    try {
      if (global.navigator.standalone === true) return true;
      if (global.matchMedia && global.matchMedia('(display-mode: standalone)').matches) return true;
    } catch (e) { /* ignore */ }
    return false;
  }

  // Injecte une seule fois les métadonnées PWA : manifest + icône Apple Touch +
  // mode standalone iOS. Sans elles, « Ajouter à l'écran d'accueil » crée un
  // simple raccourci web (pas de lancement plein écran, pas de vraie PWA).
  function injectPwaMeta() {
    if (document.querySelector('link[rel="manifest"]')) return;
    var head = document.head || document.documentElement;

    var manifest = document.createElement('link');
    manifest.rel = 'manifest';
    manifest.href = '/manifest.json';

    var touchIcon = document.createElement('link');
    touchIcon.rel = 'apple-touch-icon';
    touchIcon.href = '/assets/apple-touch-icon.png';

    function meta(name, content) {
      var m = document.createElement('meta');
      m.name = name;
      m.content = content;
      head.appendChild(m);
    }

    head.appendChild(manifest);
    head.appendChild(touchIcon);
    meta('apple-mobile-web-app-capable', 'yes');
    meta('apple-mobile-web-app-status-bar-style', 'black-translucent');
    meta('apple-mobile-web-app-title', 'MangooTech');
    meta('mobile-web-app-capable', 'yes');
    meta('theme-color', '#1a5c2a');
  }

  // Bandeau d'activation iOS : sur iPhone/iPad (Safari), il n'y a pas de
  // `beforeinstallprompt` ; l'utilisateur doit passer par la feuille de partage.
  // On affiche donc un guide « Ajouter à l'écran d'accueil », affiché UNE fois
  // (persisté en localStorage) et refermable.
  function maybeShowIosInstallBanner() {
    if (!isIOS() || isStandalone()) return;
    try { if (localStorage.getItem('mgt_ios_install_dismissed') === '1') return; } catch (e) {}
    if (document.getElementById('mgt-ios-install-banner')) return;

    var bar = document.createElement('div');
    bar.id = 'mgt-ios-install-banner';
    bar.setAttribute('role', 'dialog');
    bar.setAttribute('aria-label', 'Installer MangooTech');
    bar.style.cssText = 'position:fixed;left:12px;right:12px;bottom:12px;z-index:2147483600;max-width:480px;margin:0 auto;' +
      'background:#0f172a;color:#fff;border:1px solid rgba(255,255,255,.16);border-radius:16px;padding:14px 14px 14px 16px;' +
      'box-shadow:0 18px 60px rgba(0,0,0,.45);display:flex;gap:12px;align-items:flex-start;' +
      'font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;';

    var icon = document.createElement('img');
    icon.src = '/assets/favicon.png';
    icon.alt = '';
    icon.style.cssText = 'width:40px;height:40px;border-radius:10px;flex-shrink:0;object-fit:cover;';

    var mid = document.createElement('div');
    mid.style.cssText = 'flex:1;min-width:0;';
    var title = document.createElement('div');
    title.style.cssText = 'font-weight:700;font-size:14px;line-height:1.3;';
    title.textContent = 'Installer MangooTech';
    var desc = document.createElement('div');
    desc.style.cssText = 'font-size:12.5px;line-height:1.45;color:rgba(255,255,255,.78);margin-top:3px;';
    desc.textContent = 'Ajoutez l\'app à votre écran d\'accueil pour recevoir appels, messages et lives, même espace fermé.';

    var steps = document.createElement('div');
    steps.style.cssText = 'display:none;margin-top:8px;padding:8px 10px;background:rgba(255,255,255,.08);border-radius:10px;font-size:12px;line-height:1.55;color:rgba(255,255,255,.85);';
    steps.innerHTML = '1. Touchez <b>Partager</b> <span style="font-size:13px;">(⎋)</span> en bas du navigateur.<br>' +
      '2. Faites défiler et touchez <b>« Ajouter à l\'écran d\'accueil »</b>.<br>' +
      '3. Touchez <b>Ajouter</b>, puis ouvrez l\'app depuis votre écran.';

    mid.appendChild(title);
    mid.appendChild(desc);
    mid.appendChild(steps);

    var actions = document.createElement('div');
    actions.style.cssText = 'display:flex;flex-direction:column;gap:6px;align-items:flex-end;flex-shrink:0;';

    var howBtn = document.createElement('button');
    howBtn.type = 'button';
    howBtn.textContent = 'Comment faire';
    howBtn.style.cssText = 'cursor:pointer;border:0;background:#16a34a;color:#fff;border-radius:9px;padding:8px 12px;font-size:12.5px;font-weight:600;white-space:nowrap;';
    howBtn.addEventListener('click', function () {
      var open = steps.style.display !== 'none';
      steps.style.display = open ? 'none' : 'block';
      howBtn.textContent = open ? 'Comment faire' : 'Masquer';
    });

    var closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.setAttribute('aria-label', 'Fermer');
    closeBtn.textContent = '×';
    closeBtn.style.cssText = 'cursor:pointer;border:0;background:transparent;color:rgba(255,255,255,.6);font-size:20px;line-height:1;padding:2px 4px;';
    closeBtn.addEventListener('click', function () {
      try { localStorage.setItem('mgt_ios_install_dismissed', '1'); } catch (e) {}
      if (bar.parentNode) bar.parentNode.removeChild(bar);
    });

    actions.appendChild(howBtn);
    actions.appendChild(closeBtn);

    bar.appendChild(icon);
    bar.appendChild(mid);
    bar.appendChild(actions);
    document.body.appendChild(bar);
  }

  // --- Bouton « Installer l'app » (Android / Desktop) ---
  // Chrome/Edge (et Firefox sur Android) émettent `beforeinstallprompt` lorsque
  // le site est installable. On capture cet événement pour pouvoir déclencher
  // l'installation sur un geste utilisateur explicite (le prompt natif ne peut
  // pas être appelé n'importe quand). iOS ne l'émet pas (géré par le bandeau).
  var deferredInstallPrompt = null;
  global.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferredInstallPrompt = e;
    maybeShowInstallButton();
  });
  global.addEventListener('appinstalled', function () {
    deferredInstallPrompt = null;
    var btn = document.getElementById('mgt-install-button');
    if (btn && btn.parentNode) btn.parentNode.removeChild(btn);
  });

  function isInstallable() {
    return !!deferredInstallPrompt;
  }

  function maybeShowInstallButton() {
    if (!deferredInstallPrompt || isStandalone()) return;
    try { if (localStorage.getItem('mgt_install_btn_dismissed') === '1') return; } catch (e) {}
    if (document.getElementById('mgt-install-button')) return;

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'mgt-install-button';
    btn.setAttribute('aria-label', 'Installer l\'application MangooTech');
    btn.style.cssText = 'position:fixed;right:16px;bottom:16px;z-index:2147483600;display:flex;align-items:center;gap:8px;' +
      'background:#16a34a;color:#fff;border:0;border-radius:999px;padding:12px 16px;font-size:13.5px;font-weight:700;' +
      'cursor:pointer;box-shadow:0 12px 36px rgba(0,0,0,.35);font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;';

    btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/></svg>' +
      '<span>Installer l\'app</span>';

    btn.addEventListener('click', function () {
      if (!deferredInstallPrompt) return;
      deferredInstallPrompt.prompt();
      deferredInstallPrompt.userChoice.then(function (choice) {
        deferredInstallPrompt = null;
        if (btn.parentNode) btn.parentNode.removeChild(btn);
        try { if (choice && choice.outcome === 'dismissed') localStorage.setItem('mgt_install_btn_dismissed', '1'); } catch (e) {}
      });
    });

    document.body.appendChild(btn);
  }

  // Déclenche explicitement l'installation (utilisé par d'éventuels boutons).
  function promptInstall() {
    if (!deferredInstallPrompt) {
      // Fallback : sur mobile Android, le raccourci menu est la seule autre voie.
      return Promise.resolve(false);
    }
    deferredInstallPrompt.prompt();
    return deferredInstallPrompt.userChoice.then(function (choice) {
      deferredInstallPrompt = null;
      var btn = document.getElementById('mgt-install-button');
      if (btn && btn.parentNode) btn.parentNode.removeChild(btn);
      return !!(choice && choice.outcome === 'accepted');
    });
  }

  // Bandeau d'activation des notifications push. Le Web Push exige un geste
  // utilisateur : on ne peut pas demander la permission automatiquement. Ce
  // bandeau est affiché UNE fois (persisté) pour tout utilisateur CONNECTÉ qui
  // n'a pas encore accordé la permission, avec un bouton « Activer » explicite.
  // Sans lui, l'activation reste enfouie dans la cloche et l'utilisateur ne
  // s'abonne jamais => subscriptionsTotal reste à 0 côté serveur.
  function maybeShowEnableBanner() {
    if (!supported()) return;
    if (global.Notification.permission !== 'default') return;
    if (!token() || !routingId()) return;
    try { if (localStorage.getItem('mgt_push_enable_dismissed') === '1') return; } catch (e) {}
    if (document.getElementById('mgt-push-enable-banner')) return;

    var bar = document.createElement('div');
    bar.id = 'mgt-push-enable-banner';
    bar.setAttribute('role', 'dialog');
    bar.setAttribute('aria-label', 'Activer les notifications');
    bar.style.cssText = 'position:fixed;left:12px;right:12px;bottom:12px;z-index:2147483590;max-width:480px;margin:0 auto;' +
      'background:#0f172a;color:#fff;border:1px solid rgba(255,255,255,.16);border-radius:16px;padding:14px 14px 14px 16px;' +
      'box-shadow:0 18px 60px rgba(0,0,0,.45);display:flex;gap:12px;align-items:center;' +
      'font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;';

    var icon = document.createElement('span');
    icon.style.cssText = 'width:40px;height:40px;border-radius:12px;background:#16a34a;display:inline-flex;align-items:center;justify-content:center;color:#fff;flex-shrink:0;font-size:20px;';
    icon.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>';

    var mid = document.createElement('div');
    mid.style.cssText = 'flex:1;min-width:0;';
    var title = document.createElement('div');
    title.style.cssText = 'font-weight:700;font-size:14px;line-height:1.3;';
    title.textContent = 'Activer les notifications';
    var desc = document.createElement('div');
    desc.style.cssText = 'font-size:12.5px;line-height:1.45;color:rgba(255,255,255,.78);margin-top:3px;';
    desc.textContent = 'Recevez appels, messages et lives même quand votre espace est fermé.';
    mid.appendChild(title);
    mid.appendChild(desc);

    var actions = document.createElement('div');
    actions.style.cssText = 'display:flex;align-items:center;gap:8px;flex-shrink:0;';

    var actBtn = document.createElement('button');
    actBtn.type = 'button';
    actBtn.textContent = 'Activer';
    actBtn.style.cssText = 'cursor:pointer;border:0;background:#16a34a;color:#fff;border-radius:9px;padding:9px 14px;font-size:13px;font-weight:700;white-space:nowrap;';
    actBtn.addEventListener('click', function () {
      actBtn.disabled = true;
      actBtn.textContent = '…';
      enable().then(function (res) {
        if (res && res.granted && !res.error) {
          if (bar.parentNode) bar.parentNode.removeChild(bar);
        } else {
          actBtn.disabled = false;
          actBtn.textContent = 'Réessayer';
          if (res && res.reason === 'denied') {
            desc.textContent = 'Notifications bloquées par le navigateur. Autorisez-les via le cadenas de la barre d\'adresse.';
          } else if (res && res.error) {
            desc.textContent = 'Échec de l\'abonnement. Réessayez ou rechargez la page.';
          }
        }
      });
    });

    var closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.setAttribute('aria-label', 'Fermer');
    closeBtn.textContent = '×';
    closeBtn.style.cssText = 'cursor:pointer;border:0;background:transparent;color:rgba(255,255,255,.6);font-size:20px;line-height:1;padding:2px 4px;';
    closeBtn.addEventListener('click', function () {
      try { localStorage.setItem('mgt_push_enable_dismissed', '1'); } catch (e) {}
      if (bar.parentNode) bar.parentNode.removeChild(bar);
    });

    actions.appendChild(actBtn);
    actions.appendChild(closeBtn);

    bar.appendChild(icon);
    bar.appendChild(mid);
    bar.appendChild(actions);
    document.body.appendChild(bar);
  }

  // Injection automatique des métadonnées PWA + bandeau iOS (une fois).
  injectPwaMeta();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      maybeShowIosInstallBanner();
      maybeShowInstallButton();
      maybeShowEnableBanner();
    });
  } else {
    maybeShowIosInstallBanner();
    maybeShowInstallButton();
    maybeShowEnableBanner();
  }

  global.MangooPush = {
    supported: supported,
    isGranted: function () { return supported() && global.Notification.permission === 'granted'; },
    state: state,
    diagnose: diagnose,
    notifLabel: notifLabel,
    autoSubscribe: autoSubscribe,
    enable: enable,
    disable: disable,
    getPreferences: getPreferences,
    savePreferences: savePreferences,
    openFollowSettings: openFollowSettings,
    bellRowHTML: bellRowHTML,
    bindBellRow: bindBellRow,
    isIOS: isIOS,
    isStandalone: isStandalone,
    isInstallable: isInstallable,
    promptInstall: promptInstall,
    maybeShowInstallButton: maybeShowInstallButton,
    maybeShowIosInstallBanner: maybeShowIosInstallBanner,
    injectPwaMeta: injectPwaMeta
  };
})(window);
