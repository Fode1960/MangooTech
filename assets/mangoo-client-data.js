/* =============================================================
   MangooTech — Couche de données client partagée (côté client)
   Stocke dans localStorage les adresses de livraison du client
   connecté, et les expose via window.MangooClient.
   Utilisée par : client-profile.html, fiche-boutique.html, checkout.html
   ============================================================= */
(function (global) {
  'use strict';

  var KEY_ADDRESSES = 'mgt_client_addresses_v1';
  var KEY_DEFAULT = 'mgt_client_default_address_v1';
  var KEY_USER = 'mgt_client_user_v1';
  var KEY_FAVORITES = 'mgt_client_favorites_v1';
  var KEY_ORDERS = 'mgt_client_orders_v1';
  var KEY_WALLET = 'mgt_client_wallet_v1';

  function readJSON(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch (e) {
      return fallback;
    }
  }
  function writeJSON(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
  }

  // Vrai si un token de session est présent. En production, les données d'un
  // compte doivent toujours provenir du serveur, jamais d'un jeu de données local.
  function isAuthenticated() {
    try { return !!localStorage.getItem('mgt_token'); } catch (e) { return false; }
  }

  function uid() {
    return 'addr-' + Date.now().toString(36) + '-' + Math.floor(Math.random() * 1e4).toString(36);
  }

  // ---- Helpers date / heure / montant pour les commandes ----
  var MONTHS = ['Jan', 'Fev', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aout', 'Sep', 'Oct', 'Nov', 'Dec'];
  function pad2(n) { n = Number(n) || 0; return (n < 10 ? '0' : '') + n; }

  // Fuseau horaire de résidence de celui qui commande. L'heure affichée doit
  // correspondre au lieu de résidence du client, pas au fuseau du navigateur.
  var CITY_TZ = {
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
  function detectBrowserTimeZone() {
    try { return Intl.DateTimeFormat().resolvedOptions().timeZone || null; } catch (e) { return null; }
  }
  // Résout le fuseau depuis une ville (résidence) ou un fuseau IANA déjà donné.
  // Sans ville, on retombe sur le fuseau du navigateur (l'appareil réel de celui
  // qui commande), jamais sur une valeur codée en dur.
  function timeZoneForCity(city) {
    var c = String(city || '').trim();
    if (!c) return detectBrowserTimeZone() || 'Africa/Dakar';
    if (c.indexOf('/') !== -1) return c; // déjà un fuseau IANA
    return CITY_TZ[c.toLowerCase()] || 'Africa/Dakar';
  }
  function resolveTimeZone(city) {
    return timeZoneForCity(city);
  }

  function dateLabel(ts, city) {
    var tz = resolveTimeZone(city);
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
      return (parseInt(day, 10)) + ' ' + (MONTHS[mIdx] || month) + ' ' + year;
    } catch (e) {
      var d = new Date(ts || Date.now());
      return d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear();
    }
  }
  function timeLabel(ts, city) {
    var tz = resolveTimeZone(city);
    try {
      var parts = new Intl.DateTimeFormat('fr-FR', { timeZone: tz, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
        .formatToParts(new Date(ts || Date.now()));
      var h = '', m = '';
      parts.forEach(function (p) {
        if (p.type === 'hour') h = p.value;
        else if (p.type === 'minute') m = p.value;
      });
      return pad2(parseInt(h, 10)) + ':' + pad2(parseInt(m, 10));
    } catch (e) {
      var d = new Date(ts || Date.now());
      return pad2(d.getHours()) + ':' + pad2(d.getMinutes());
    }
  }
  function amountNumber(a) {
    if (typeof a === 'number') return a;
    var s = String(a == null ? '' : a).replace(/[^\d]/g, '');
    return parseInt(s, 10) || 0;
  }
  function normalizeOrder(o) {
    if (!o) return o;
    var ts = o.createdAt || o.ts || null;
    // Ville de résidence de l'acheteur (explicite) et fuseau associé. Le fuseau
    // est recalculé à chaque lecture afin d'appliquer rétroactivement la bonne
    // heure même aux commandes déjà enregistrées.
    var city = o.clientCity || o.buyerCity || o.city || '';
    var tz = o.clientTz || o.buyerTz || (city ? timeZoneForCity(city) : detectBrowserTimeZone());
    return Object.assign({}, o, {
      id: o.id || ('CMD-' + Date.now().toString(36).toUpperCase()),
      createdAt: ts,
      clientCity: city,
      clientTz: tz,
      mine: true,
      date: ts ? dateLabel(ts, tz) : (o.date || ''),
      time: ts ? timeLabel(ts, tz) : (o.time || ''),
      amountN: amountNumber(o.amount || o.total),
      status: o.status || 'en-cours'
    });
  }

  function normalizeAddress(a) {
    return {
      id: a.id || uid(),
      label: (a.label || 'Adresse').trim(),
      fullName: (a.fullName || '').trim(),
      phone: (a.phone || '').trim(),
      line1: (a.line1 || '').trim(),
      line2: (a.line2 || '').trim(),
      city: (a.city || '').trim(),
      isDefault: !!a.isDefault
    };
  }

  function ensureSeeded() {
    var list = readJSON(KEY_ADDRESSES, null);
    if (!Array.isArray(list) || list.length === 0) {
      if (isAuthenticated()) {
        writeJSON(KEY_ADDRESSES, []);
        writeJSON(KEY_DEFAULT, null);
        return [];
      }
      list = [];
      writeJSON(KEY_ADDRESSES, list);
      writeJSON(KEY_DEFAULT, null);
    }
    return list;
  }

  function getAddresses() {
    return ensureSeeded().map(normalizeAddress);
  }

  function getDefaultAddress() {
    var list = getAddresses();
    var defId = readJSON(KEY_DEFAULT, null);
    return list.find(function (a) { return a.id === defId; }) ||
      list.find(function (a) { return a.isDefault; }) ||
      list[0] ||
      null;
  }

  function saveAddresses(list) {
    var normalized = list.map(normalizeAddress);
    // Garantit un défaut unique
    var hasDefault = normalized.some(function (a) { return a.isDefault; });
    if (!hasDefault && normalized.length) normalized[0].isDefault = true;
    if (normalized.length) {
      var def = normalized.find(function (a) { return a.isDefault; }) || normalized[0];
      writeJSON(KEY_DEFAULT, def.id);
    } else {
      writeJSON(KEY_DEFAULT, null);
    }
    writeJSON(KEY_ADDRESSES, normalized);
    return normalized;
  }

  function addAddress(a) {
    var list = getAddresses();
    var addr = normalizeAddress(a);
    if (!list.length) addr.isDefault = true;
    list.push(addr);
    return saveAddresses(list);
  }

  function updateAddress(id, patch) {
    var list = getAddresses();
    list = list.map(function (a) {
      if (a.id !== id) return a;
      return normalizeAddress(Object.assign({}, a, patch, { id: id }));
    });
    return saveAddresses(list);
  }

  function removeAddress(id) {
    var list = getAddresses().filter(function (a) { return a.id !== id; });
    return saveAddresses(list);
  }

  function setDefault(id) {
    var list = getAddresses().map(function (a) {
      a.isDefault = (a.id === id);
      return a;
    });
    return saveAddresses(list);
  }

  function readSessionUser() {
    try {
      var raw = localStorage.getItem('mgt_user');
      if (!raw) return null;
      var u = JSON.parse(raw);
      return (u && (u.name || u.email || u.id)) ? u : null;
    } catch (e) { return null; }
  }
  // Normalise un utilisateur quelle que soit sa provenance (session `mgt_user`,
  // ancienne clé locale ou seed) : `name` reste prioritaire mais on garantit
  // toujours un `fullName` utilisable par les pages qui l'affichent.
  function normalizeUser(u) {
    if (!u) return null;
    var name = u.name || u.fullName || '';
    return {
      id: u.id || null,
      role: u.role || 'client',
      name: name,
      fullName: u.fullName || name,
      enseigne: u.enseigne || '',
      email: u.email || '',
      phone: u.phone || '',
      city: u.city || '',
      address: u.address || u.adresse || '',
      logo: u.logo || '',
      verified: !!u.verified,
      plan: u.plan || ''
    };
  }
  // Utilisateur réellement connecté (écrit par auth.html dans `mgt_user`).
  function sessionUser() {
    var u = readSessionUser();
    return u ? normalizeUser(u) : null;
  }
  function getUser() {
    var s = sessionUser();
    if (s) return s;
    var u = readJSON(KEY_USER, null);
    if (u) return normalizeUser(u);
    if (isAuthenticated()) return null;
    return null;
  }
  function saveUser(patch) {
    var u = Object.assign({}, getUser(), patch);
    writeJSON(KEY_USER, u);
    return u;
  }

  // ---- Favoris ----
  function ensureFavoritesSeeded() {
    var list = readJSON(KEY_FAVORITES, null);
    if (!Array.isArray(list) || list.length === 0) {
      if (isAuthenticated()) {
        writeJSON(KEY_FAVORITES, []);
        return [];
      }
      list = [];
      writeJSON(KEY_FAVORITES, list);
    }
    return list;
  }
  function getFavorites() {
    return ensureFavoritesSeeded();
  }
  function isFavorite(id) {
    return getFavorites().some(function (f) { return f.id === id; });
  }
  function addFavorite(fav) {
    var list = getFavorites();
    if (fav && fav.id && !isFavorite(fav.id)) list.push(fav);
    writeJSON(KEY_FAVORITES, list);
    return list;
  }
  function removeFavorite(id) {
    var list = getFavorites().filter(function (f) { return f.id !== id; });
    writeJSON(KEY_FAVORITES, list);
    return list;
  }
  function toggleFavorite(fav) {
    if (!fav || !fav.id) return getFavorites();
    return isFavorite(fav.id) ? removeFavorite(fav.id) : addFavorite(fav);
  }

  // ---- Commandes ----
  function ensureOrdersSeeded() {
    var list = readJSON(KEY_ORDERS, null);
    if (!Array.isArray(list) || list.length === 0) {
      if (isAuthenticated()) {
        writeJSON(KEY_ORDERS, []);
        return [];
      }
      list = [];
      writeJSON(KEY_ORDERS, list);
    }
    return list;
  }
  function getOrders() {
    return ensureOrdersSeeded();
  }
  function getOrder(id) {
    return getOrders().find(function (o) { return o.id === id; }) || null;
  }
  function addOrder(order) {
    if (!order) return getOrders();
    var normalized = normalizeOrder(order);
    var list = getOrders().filter(function (o) { return o.id !== normalized.id; });
    list.unshift(normalized);
    writeJSON(KEY_ORDERS, list);
    return list;
  }
  // Commandes réellement passées par le client courant (exclut les commandes
  // qui n'ont ni createdAt ni le drapeau `mine`).
  function getMyOrders() {
    return getOrders()
      .filter(function (o) { return o && (o.mine === true || o.createdAt || o.ts); })
      .map(normalizeOrder)
      .sort(function (a, b) { return (b.createdAt || 0) - (a.createdAt || 0); });
  }
  function updateOrderStatus(id, status) {
    var list = getOrders().map(function (o) {
      if (o.id === id) o.status = status;
      return o;
    });
    writeJSON(KEY_ORDERS, list);
    return list;
  }
  function cancelOrder(id) {
    return updateOrderStatus(id, 'annulee');
  }

  // ---- Portefeuille (Solde client) ----
  function ensureWalletSeeded() {
    var w = readJSON(KEY_WALLET, null);
    if (!w || typeof w.balance !== 'number') {
      w = { balance: 0, currency: 'XOF' };
      writeJSON(KEY_WALLET, w);
    }
    if (!w.currency) w.currency = 'XOF';
    return w;
  }
  function getWallet() {
    return ensureWalletSeeded();
  }
  function getBalance() {
    return getWallet().balance;
  }
  function setBalance(amount) {
    var w = getWallet();
    w.balance = Math.max(0, Math.round(Number(amount) || 0));
    writeJSON(KEY_WALLET, w);
    return w;
  }
  function creditWallet(amount) {
    var w = getWallet();
    w.balance += Math.round(Number(amount) || 0);
    writeJSON(KEY_WALLET, w);
    return w;
  }
  function debitWallet(amount) {
    var w = getWallet();
    var amt = Math.round(Number(amount) || 0);
    if (amt <= 0) return false;
    if (w.balance < amt) return false;
    w.balance -= amt;
    writeJSON(KEY_WALLET, w);
    return true;
  }

  // ---- Portefeuille serveur (source de vérité) ----
  // Appelle GET /api/wallet avec le token de session et retourne le vrai solde.
  // Met à jour le cache local puis invoque cb({ ok, wallet, balance, ... }).
  function fetchServerWallet(cb) {
    cb = typeof cb === 'function' ? cb : function () {};
    var token = null;
    try { token = localStorage.getItem('mgt_token'); } catch (e) {}
    if (!token) { cb({ ok: false, error: 'Non authentifié' }); return; }
    var headers = { 'Accept': 'application/json', 'Authorization': 'Bearer ' + token };
    try {
      fetch('/api/wallet', { headers: headers }).then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      }).then(function (res) {
        var w = res && res.wallet ? res.wallet : null;
        if (!w) { cb({ ok: false, error: 'Portefeuille introuvable' }); return; }
        var balance = Math.round(Number(w.balance) || 0);
        var wallet = { balance: balance, currency: w.currency || 'XOF' };
        writeJSON(KEY_WALLET, wallet);
        cb({ ok: true, wallet: wallet, balance: balance, transactions: res.transactions || [], devise: res.devise || 'XOF' });
      }).catch(function (err) {
        cb({ ok: false, error: (err && err.message) || 'Erreur réseau' });
      });
    } catch (e) {
      cb({ ok: false, error: 'Erreur' });
    }
  }

  global.MangooClient = {
    KEY_ADDRESSES: KEY_ADDRESSES,
    getAddresses: getAddresses,
    getDefaultAddress: getDefaultAddress,
    addAddress: addAddress,
    updateAddress: updateAddress,
    removeAddress: removeAddress,
    setDefault: setDefault,
    getUser: getUser,
    sessionUser: sessionUser,
    saveUser: saveUser,
    getFavorites: getFavorites,
    isFavorite: isFavorite,
    addFavorite: addFavorite,
    removeFavorite: removeFavorite,
    toggleFavorite: toggleFavorite,
    getOrders: getOrders,
    getOrder: getOrder,
    getMyOrders: getMyOrders,
    addOrder: addOrder,
    updateOrderStatus: updateOrderStatus,
    cancelOrder: cancelOrder,
    normalizeOrder: normalizeOrder,
    dateLabel: dateLabel,
    timeLabel: timeLabel,
    amountNumber: amountNumber,
    MONTHS: MONTHS,
    getWallet: getWallet,
    getBalance: getBalance,
    creditWallet: creditWallet,
    debitWallet: debitWallet,
    fetchServerWallet: fetchServerWallet
  };
})(window);
