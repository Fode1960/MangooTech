/* ==========================================================================
 * Mangoo Demo Sandbox — aperçu public sans session (Mode démo)
 * --------------------------------------------------------------------------
 * À charger AVANT les modules de données (mangoo-vendor.js, catalogue, etc.).
 *
 * Ce module fournit :
 *   1. window.MangooDemo  — détection du mode démo depuis l'URL (`?demo=`).
 *   2. Un bac à sable local — en mode démo, TOUTE écriture (POST/PUT/DELETE)
 *      est interceptée et appliquée en mémoire (jamais envoyée au serveur).
 *      Les listes principales (catalogue, prestations, inventaire, galerie)
 *      sont fusionnées en mémoire : on peut ajouter/modifier/supprimer et voir
 *      le résultat dans la page, sans toucher aux comptes réels DAN Boutique /
 *      DAN Coiffure. Tout est réinitialisé au rechargement.
 *   3. Le badge « Mode démo » + la réécriture des liens internes du dashboard
 *      pour conserver `?demo=` lors de la navigation (le rôle reste dans l'URL,
 *      jamais en sessionStorage, pour ne pas contaminer les pages publiques).
 * ========================================================================== */
(function (global) {
  'use strict';
  if (global.__mangooDemoSandboxInstalled) return;
  global.__mangooDemoSandboxInstalled = true;

  var originalFetch = global.fetch && global.fetch.bind(global);

  // Ressources « liste » dont on fusionne l'overlay en mémoire (id + clé de liste).
  var RESOURCES = {
    'catalogue': { listKey: 'catalogue' },
    'prestations': { listKey: 'prestations' },
    'inventaire': { listKey: 'inventaire' },
    'galerie': { listKey: 'galerie' }
  };

  // Overlay en mémoire : { added:[], removed:[], updated:{} } par ressource.
  var overlay = {};
  Object.keys(RESOURCES).forEach(function (k) {
    overlay[k] = { added: [], removed: [], updated: {} };
  });

  function readUrlDemo() {
    try {
      var m = /[?&]demo=(prestataire|boutique|vendeur|1)\b/.exec(location.search);
      if (!m) return null;
      var r = m[1];
      return (r === 'vendeur' || r === '1') ? 'boutique' : r;
    } catch (e) { return null; }
  }

  function inDemo() { return !!readUrlDemo(); }

  // Vraie session (authentification PIN) présente ? En production, une session
  // locale réelle prime sur le mode démo : on ne doit JAMAIS intercepter les
  // écritures d'un utilisateur réellement connecté.
  function hasRealSession() {
    try {
      if (localStorage.getItem('mgt_token')) return true;
      var raw = localStorage.getItem('mgt_user');
      if (!raw) return false;
      var u = JSON.parse(raw);
      return !!(u && (u.id || u.vendorId));
    } catch (e) { return false; }
  }

  // ------------------------------------------------------------------ *
  //  Bac à sable : interceptor fetch
  // ------------------------------------------------------------------ */
  function resourceFor(url) {
    var path = String(url).split('?')[0];
    if (path.indexOf('/inventaire/mouvements') >= 0) return null; // simple ack
    var keys = Object.keys(RESOURCES);
    for (var i = 0; i < keys.length; i++) {
      if (path.indexOf('/' + keys[i]) >= 0) return keys[i];
    }
    return null;
  }

  function fakeResponse(obj) {
    return {
      ok: true,
      status: 200,
      statusText: 'OK',
      json: function () { return Promise.resolve(obj); },
      text: function () { return Promise.resolve(JSON.stringify(obj)); }
    };
  }

  function applyOverlay(resKey, list) {
    var o = overlay[resKey];
    if (!o) return list;
    var out = [];
    (list || []).forEach(function (item) {
      var id = item && item.id;
      if (id && o.removed.indexOf(id) >= 0) return;
      if (id && o.updated[id]) { out.push(o.updated[id]); return; }
      out.push(item);
    });
    o.added.forEach(function (item) { out.push(item); });
    return out;
  }

  function genId() {
    return 'demo-' + Date.now() + '-' + Math.floor(Math.random() * 1000000);
  }

  if (global.fetch) {
    global.fetch = function (input, init) {
      init = init || {};
      if (!inDemo() || hasRealSession()) return originalFetch(input, init);

      var url = typeof input === 'string' ? input : (input && input.url) || '';
      var method = String(init.method || 'GET').toUpperCase();
      var resKey = resourceFor(url);

      // Lecture : on laisse passer au serveur, puis on fusionne l'overlay
      // en mémoire pour les ressources « liste » (catalogue, prestations, …).
      if (method === 'GET') {
        if (!resKey) return originalFetch(input, init);
        return originalFetch(input, init).then(function (r) {
          return r.json().then(function (d) {
            var lk = RESOURCES[resKey].listKey;
            if (d && Array.isArray(d[lk])) d[lk] = applyOverlay(resKey, d[lk]);
            return fakeResponse(d);
          }).catch(function () { return r; });
        });
      }

      // Écriture : jamais envoyée au serveur en mode démo.
      if (method === 'POST' || method === 'PUT' || method === 'DELETE' || method === 'PATCH') {
        return Promise.resolve().then(function () {
          var body = {};
          try { if (init.body) body = JSON.parse(init.body); } catch (e) {}

          if (method === 'DELETE') {
            var q = String(url).split('?')[1] || '';
            var mm = /(?:^|&)id=([^&]+)/.exec(q);
            var id = mm ? decodeURIComponent(mm[1]) : null;
            if (resKey && id) {
              overlay[resKey].removed.push(id);
              delete overlay[resKey].updated[id];
              overlay[resKey].added = overlay[resKey].added.filter(function (a) { return a.id !== id; });
            }
            return fakeResponse({ ok: true });
          }

          if (resKey) {
            var item = Object.assign({}, body);
            item.id = body.id || genId();
            if (body.id) {
              overlay[resKey].updated[item.id] = item;
              overlay[resKey].removed = overlay[resKey].removed.filter(function (x) { return x !== item.id; });
            } else {
              overlay[resKey].added.push(item);
            }
            return fakeResponse({ ok: true, product: item, prestation: item, item: item });
          }

          // Autres endpoints (boosters, paiements, offres, config…) : succès simulé.
          var ack = { ok: true };
          if (body && typeof body === 'object') {
            for (var k in body) if (Object.prototype.hasOwnProperty.call(body, k)) ack[k] = body[k];
          }
          if (!ack.id) ack.id = genId();
          return fakeResponse(ack);
        });
      }

      return originalFetch(input, init);
    };
  }

  global.MangooDemo = {
    active: inDemo,
    inDemo: inDemo,
    role: function () { return readUrlDemo() || ''; }
  };

  // ------------------------------------------------------------------ *
  //  Badge « Mode démo » + conservation du paramètre ?demo= dans les liens
  // ------------------------------------------------------------------ */
  function onReady() {
    var demoRole = readUrlDemo();
    if (!demoRole) return;

    // Badge visible.
    if (!document.getElementById('mgt-demo-banner')) {
      var bar = document.createElement('div');
      bar.id = 'mgt-demo-banner';
      bar.setAttribute('role', 'status');
      bar.style.cssText = 'position:fixed;top:14px;right:14px;z-index:99999;display:flex;align-items:center;gap:8px;' +
        'padding:8px 14px;border-radius:9999px;background:rgb(var(--mgt-accent));color:rgb(var(--mgt-accent-foreground));' +
        'font-family:var(--mgt-font-sans,system-ui);font-size:12.5px;font-weight:600;line-height:1;' +
        'box-shadow:0 6px 20px rgba(0,0,0,.18);pointer-events:none;';
      var dot = document.createElement('span');
      dot.style.cssText = 'width:8px;height:8px;border-radius:50%;background:#fff;opacity:.9;';
      bar.appendChild(dot);
      bar.appendChild(document.createTextNode('Mode démo · aperçu public'));
      (document.body || document.documentElement).appendChild(bar);
    }

    // Réécrit les liens internes vers les pages du dashboard pour conserver
    // ?demo= (les liens publics accueil/contact/etc. ne sont pas touchés).
    var links = document.querySelectorAll('a[href*="dashboard-"]');
    for (var i = 0; i < links.length; i++) {
      var a = links[i];
      var href = a.getAttribute('href') || '';
      if (!href) continue;
      if (/[?&]demo=/.test(href)) continue;
      a.setAttribute('href', href + (href.indexOf('?') >= 0 ? '&' : '?') + 'demo=' + demoRole);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onReady);
  } else {
    onReady();
  }
})(window);
