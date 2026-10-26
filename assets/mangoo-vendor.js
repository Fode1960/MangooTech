/* ==========================================================================
 * Mangoo Vendor — identité du prestataire / vendeur connecté
 * --------------------------------------------------------------------------
 * Stocke dans localStorage l'identité du professionnel connecté et l'expose
 * via window.MangooVendor. Sert de source unique de vérité pour :
 *   - le dashboard prestataire (nom, initiales, rôle, note)
 *   - l'enregistrement temps réel via MangooConnect.register('vendor', …)
 *   - le filtrage des prestations (vendorId)
 * ========================================================================== */
(function (global) {
  'use strict';
  if (global.MangooVendor) return;

  var KEY = 'mgt_vendor_identity_v1';
  var USER_KEY = 'mgt_user';

  // Identité par défaut (sans connexion réelle) — remplacée dès qu'un
  // professionnel se connecte via MangooVendor.save(...).
  var SEED = {
    vendorId: 'pro-41cafa4bcb31',
    name: 'DAN Boutique',
    role: 'vendeur',            // 'prestataire' | 'vendeur'
    category: 'commerce',
    phone: '',
    email: '',
    city: 'Paris',
    rating: '—',
    verified: false,
    plan: 'decouverte'
  };

  function read() {
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* ignore */ }
    return null;
  }

  function readUser() {
    try {
      var raw = localStorage.getItem(USER_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* ignore */ }
    return null;
  }

  function write(v) {
    try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) { /* ignore */ }
  }

  function normalize(v) {
    return Object.assign({}, SEED, v || {});
  }

  // Construit l'identité prestataire/vendeur à partir de la session `mgt_user`
  // (même logique que `auth.html` saveSession). Retourne null si l'utilisateur
  // n'est pas un professionnel (admin/client) ou s'il n'y a pas de session.
  function identityFromUser(user) {
    if (!user) return null;
    var role = user.role || '';
    if (role !== 'prestataire' && role !== 'vendeur') return null;
    return {
      vendorId: user.vendorId || user.id || '',
      name: user.enseigne || user.name || 'DAN Boutique',
      role: role,
      category: user.category || 'salon',
      phone: user.phone || '',
      email: user.email || '',
      city: user.city || '',
      logo: user.logo || '',
      rating: (user.rating != null && user.rating !== '') ? String(user.rating) : '—',
      verified: !!user.verified,
      plan: user.plan || 'decouverte'
    };
  }

  function current() {
    // Priorité à la session réelle (mgt_user) : elle est la source de vérité
    // pour l'identité connectée (DAN Boutique → pro-41cafa4bcb31).
    var fromUser = identityFromUser(readUser());
    if (fromUser) {
      var synced = normalize(fromUser);
      write(synced);           // synchronise mgt_vendor_identity_v1
      return synced;
    }
    var v = read();
    if (!v) {
      v = normalize(SEED);
      write(v);
    }
    return normalize(v);
  }

  function save(patch) {
    var v = normalize(Object.assign({}, current(), patch));
    write(v);
    return v;
  }

  function clear() {
    try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ }
  }

  function initials(name) {
    var n = String(name || current().name || '').trim();
    var parts = n.split(/\s+/).filter(Boolean);
    if (!parts.length) return 'MT';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  function roleBase(v) {
    return (v && v.role) === 'vendeur' ? 'Boutique' : 'Prestataire';
  }
  function roleLabel(v) {
    if (v && v.verified) {
      return (v.role === 'vendeur') ? 'Boutique certifiée' : 'Prestataire certifié';
    }
    return roleBase(v);
  }

  function registerRT() {
    var v = current();
    if (global.MangooConnect && typeof global.MangooConnect.register === 'function') {
      global.MangooConnect.register('vendor', v.vendorId, v.name);
    }
    return v;
  }

  // Retourne le vendorId du professionnel réellement connecté (session mgt_user),
  // ou '' s'il n'y a pas de session professionnelle. Évite le repli SEED.
  function connectedVendorId() {
    var u = identityFromUser(readUser());
    return (u && u.vendorId) ? u.vendorId : '';
  }

  // ---- Commandes clients partagées (localStorage) ----
  // Les commandes passées côté client (fiche-boutique.html / checkout) sont
  // persistées dans `mgt_client_orders_v1` (cf. mangoo-client-data.js). Le
  // vendeur les lit ici et filtre par vendorId pour alimenter ses pages
  // « Commandes » et « Vue d'ensemble », sans dépendre du serveur.
  var ORDERS_KEY = 'mgt_client_orders_v1';

  function readClientOrders() {
    try {
      var raw = localStorage.getItem(ORDERS_KEY);
      if (!raw) return [];
      var list = JSON.parse(raw);
      if (!Array.isArray(list)) return [];
      // Exclut la commande de démonstration persistée côté client : elle
      // n’est pas réelle et ne doit jamais apparaître dans les indicateurs.
      return list.filter(function (o) {
        if (!o) return false;
        var id = String(o.id || '').toUpperCase();
        return id !== 'CMD-2026-4931';
      });
    } catch (e) { return []; }
  }

  function ordersForVendor(v) {
    var vid = (typeof v === 'string') ? v : ((v && v.vendorId) || '');
    var name = (v && typeof v === 'object') ? (v.name || '') : '';
    var nameLc = String(name).toLowerCase();
    var list = readClientOrders();
    return list.filter(function (o) {
      if (!o) return false;
      // Correspondance explicite par identifiant boutique/prestataire.
      if (vid && o.vendorId === vid) return true;
      // Correspondance par enseigne/nom du professionnel (seed orders).
      if (nameLc && o.provider && String(o.provider).toLowerCase() === nameLc) return true;
      return false;
    });
  }

  // ---- Commandes serveur (source de vérité en production) ----
  // En production, la liste des commandes du pro est servie par GET /api/orders
  // (filtrée côté serveur par l'identité connectée). Le localStorage ne sert
  // plus que de repli hors-ligne / démo.
  function authToken() {
    try { return localStorage.getItem('mgt_token') || null; } catch (e) { return null; }
  }
  function fetchServerOrders(cb) {
    cb = typeof cb === 'function' ? cb : function () {};
    var token = authToken();
    if (!token) { cb({ ok: false, error: 'Non authentifié' }); return; }
    var headers = { 'Accept': 'application/json', 'Authorization': 'Bearer ' + token };
    try {
      fetch('/api/orders', { headers: headers }).then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      }).then(function (res) {
        var list = Array.isArray(res && res.orders) ? res.orders : [];
        cb({ ok: true, orders: list });
      }).catch(function (err) {
        cb({ ok: false, error: (err && err.message) || 'Erreur réseau' });
      });
    } catch (e) { cb({ ok: false, error: 'Erreur' }); }
  }

  // Met à jour le statut d'une commande côté serveur (source de vérité).
  function updateOrderStatus(id, status, cb) {
    cb = typeof cb === 'function' ? cb : function () {};
    var token = authToken();
    if (!token) { cb({ ok: false, error: 'Non authentifié' }); return; }
    var headers = { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token };
    try {
      fetch('/api/orders/status', { method: 'POST', headers: headers, body: JSON.stringify({ id: String(id).replace(/^#/, ''), status: status }) })
        .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
        .then(function (res) { cb({ ok: true, order: res && res.order }); })
        .catch(function (err) { cb({ ok: false, error: (err && err.message) || 'Erreur réseau' }); });
    } catch (e) { cb({ ok: false, error: 'Erreur' }); }
  }

  // ---- Formatage horaire dans le fuseau de résidence de l'acheteur ----
  // L'heure d'une commande affichée côté vendeur correspond au lieu où réside
  // celui qui a commandé, pas au fuseau du navigateur du vendeur.
  var VENDOR_CITY_TZ = {
    'dakar': 'Africa/Dakar', 'pikine': 'Africa/Dakar', 'guediawaye': 'Africa/Dakar',
    'guédiawaye': 'Africa/Dakar', 'rufisque': 'Africa/Dakar', 'thies': 'Africa/Dakar',
    'thiès': 'Africa/Dakar', 'touba': 'Africa/Dakar', 'kaolack': 'Africa/Dakar',
    'ziguinchor': 'Africa/Dakar', 'mbour': 'Africa/Dakar', 'saint-louis': 'Africa/Dakar',
    'louga': 'Africa/Dakar', 'tambacounda': 'Africa/Dakar', 'kolda': 'Africa/Dakar',
    'diourbel': 'Africa/Dakar', 'fatick': 'Africa/Dakar', 'matam': 'Africa/Dakar',
    'sedhiou': 'Africa/Dakar', 'sédhiou': 'Africa/Dakar', 'kedougou': 'Africa/Dakar',
    'kédougou': 'Africa/Dakar', 'paris': 'Europe/Paris', 'abidjan': 'Africa/Abidjan',
    'bamako': 'Africa/Bamako', 'conakry': 'Africa/Conakry', 'ouagadougou': 'Africa/Ouagadougou',
    'cotonou': 'Africa/Porto-Novo', 'lome': 'Africa/Lome', 'lomé': 'Africa/Lome',
    'douala': 'Africa/Douala', 'kinshasa': 'Africa/Kinshasa', 'libreville': 'Africa/Libreville'
  };
  function detectVendorTz() {
    try { return Intl.DateTimeFormat().resolvedOptions().timeZone || null; } catch (e) { return null; }
  }
  function vendorTimeZone(cityOrZone) {
    var s = String(cityOrZone || '').trim();
    if (!s) return detectVendorTz() || 'Europe/Paris';
    if (s.indexOf('/') !== -1) return s; // déjà un fuseau IANA
    return VENDOR_CITY_TZ[s.toLowerCase()] || 'Europe/Paris';
  }
  var VENDOR_MONTHS = ['Jan', 'Fev', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aout', 'Sep', 'Oct', 'Nov', 'Dec'];
  function pad2tz(n) { n = Number(n) || 0; return (n < 10 ? '0' : '') + n; }
  function formatTime(ts, cityOrZone) {
    var tz = vendorTimeZone(cityOrZone);
    try {
      var parts = new Intl.DateTimeFormat('fr-FR', { timeZone: tz, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
        .formatToParts(new Date(ts || Date.now()));
      var h = '', m = '';
      parts.forEach(function (p) {
        if (p.type === 'hour') h = p.value;
        else if (p.type === 'minute') m = p.value;
      });
      return pad2tz(parseInt(h, 10)) + ':' + pad2tz(parseInt(m, 10));
    } catch (e) {
      var d = new Date(ts || Date.now());
      return pad2tz(d.getHours()) + ':' + pad2tz(d.getMinutes());
    }
  }
  function formatDate(ts, cityOrZone) {
    var tz = vendorTimeZone(cityOrZone);
    try {
      var parts = new Intl.DateTimeFormat('en-GB', { timeZone: tz, day: '2-digit', month: 'numeric', year: 'numeric' })
        .formatToParts(new Date(ts || Date.now()));
      var day = '', month = '', year = '';
      parts.forEach(function (p) {
        if (p.type === 'day') day = p.value;
        else if (p.type === 'month') month = p.value;
        else if (p.type === 'year') year = p.value;
      });
      var mIdx = (parseInt(month, 10) - 1);
      return (parseInt(day, 10)) + ' ' + (VENDOR_MONTHS[mIdx] || month) + ' ' + year;
    } catch (e) {
      var d = new Date(ts || Date.now());
      return d.getDate() + ' ' + VENDOR_MONTHS[d.getMonth()] + ' ' + d.getFullYear();
    }
  }

  global.MangooVendor = {
    KEY: KEY,
    SEED: SEED,
    current: current,
    save: save,
    clear: clear,
    initials: initials,
    roleBase: roleBase,
    roleLabel: roleLabel,
    registerRT: registerRT,
    connectedVendorId: connectedVendorId,
    readClientOrders: readClientOrders,
    ordersForVendor: ordersForVendor,
    fetchServerOrders: fetchServerOrders,
    updateOrderStatus: updateOrderStatus,
    timeZone: 'Europe/Paris',
    vendorTimeZone: vendorTimeZone,
    formatTime: formatTime,
    formatDate: formatDate
  };
})(window);
