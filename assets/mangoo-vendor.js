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
    city: '',
    rating: '4.8',
    verified: true,
    plan: 'decouverte'
  };

  // Identités de démonstration publiques (aperçu via ?demo=prestataire|boutique).
  // Permet d'explorer les DEUX rôles sans session : prestataire de service
  // (DAN Coiffure) et vendeur / boutique (DAN Boutique).
  var DEMO_VENDORS = {
    prestataire: {
      vendorId: 'pro-eb10536cd12d',
      name: 'DAN Coiffure',
      role: 'prestataire',
      category: 'salon',
      phone: '+221 77 000 00 00',
      email: 'dan.coiffure@exemple.com',
      city: 'Dakar',
      rating: '4.8',
      verified: true,
      plan: 'decouverte'
    },
    boutique: {
      vendorId: 'pro-41cafa4bcb31',
      name: 'DAN Boutique',
      role: 'vendeur',
      category: 'commerce',
      phone: '+221 77 111 11 11',
      email: 'contact@dan-boutique.com',
      city: 'Dakar',
      rating: '4.8',
      verified: true,
      plan: 'decouverte'
    }
  };

  function demoRoleFromUrl() {
    try {
      var m = /[?&]demo=(prestataire|boutique|vendeur)\b/.exec(location.search);
      if (!m) return null;
      return m[1] === 'vendeur' ? 'boutique' : m[1];
    } catch (e) { return null; }
  }

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
      name: user.enseigne || user.name || 'Ma boutique',
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
    // Aperçu démo public (?demo=prestataire|boutique) : identité fixe, lue sans
    // écrire dans le localStorage (ne pollue pas la vraie session mgt_user).
    // La détection passe par MangooDemo quand il est présent (rôle conservé en
    // sessionStorage lors de la navigation entre pages du dashboard).
    var demo = (global.MangooDemo && global.MangooDemo.role()) || demoRoleFromUrl();
    if (demo && DEMO_VENDORS[demo]) return normalize(DEMO_VENDORS[demo]);
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
      return Array.isArray(list) ? list : [];
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
      // Correspondance par catégorie de rôle.
      if (vid === 'pro-41cafa4bcb31' && o.kind === 'commerce') return true;
      return false;
    });
  }

  // ---- Portefeuille vendeur (solde disponible, côté démo local) ----
  // Le solde du vendeur est persisté en localStorage : quand un client règle
  // une commande (fiche-boutique.html / fiche.html), le montant est crédité
  // ici, et le dashboard finances lit ce même solde pour rester cohérent.
  var WALLETS_KEY = 'mgt_vendor_wallets_v1';

  var SEED_WALLETS = [
    { vendorId: 'pro-41cafa4bcb31', name: 'DAN Boutique', balance: 58500, currency: 'XOF' },
    { vendorId: 'pro-eb10536cd12d', name: 'DAN Coiffure', balance: 42000, currency: 'XOF' }
  ];

  function readWallets() {
    try {
      var raw = localStorage.getItem(WALLETS_KEY);
      if (raw) {
        var list = JSON.parse(raw);
        if (Array.isArray(list) && list.length) return list;
      }
    } catch (e) { /* ignore */ }
    return null;
  }

  function writeWallets(list) {
    try { localStorage.setItem(WALLETS_KEY, JSON.stringify(list)); } catch (e) { /* ignore */ }
  }

  function ensureWallets() {
    var list = readWallets();
    if (!list) list = [];
    // Garantit que les vendeurs de démonstration existent toujours (sans jamais
    // écraser un solde déjà crédité). Ainsi une commande créditée ne part pas
    // dans le vide si l'ancienne liste localStorage ne contenait pas DAN.
    SEED_WALLETS.forEach(function (seed) {
      var exists = list.some(function (w) { return w.vendorId === seed.vendorId; });
      if (!exists) {
        list.push({ vendorId: seed.vendorId, name: seed.name, balance: seed.balance, currency: seed.currency });
      }
    });
    writeWallets(list);
    return list;
  }

  function resolveVendorId(v) {
    if (typeof v === 'string' && v) return v;
    if (v && typeof v === 'object' && v.vendorId) return v.vendorId;
    return current().vendorId;
  }

  function getVendorWallet(v) {
    var vid = resolveVendorId(v);
    var list = ensureWallets();
    var w = list.find(function (x) { return x.vendorId === vid; });
    if (!w) {
      w = { vendorId: vid, name: (v && v.name) || vid, balance: 0, currency: 'FCFA' };
      list.push(w);
      writeWallets(list);
    }
    if (!w.currency) w.currency = 'FCFA';
    return w;
  }

  function vendorAmountNumber(a) {
    if (typeof a === 'number') return a;
    var s = String(a == null ? '' : a).replace(/[^\d]/g, '');
    return parseInt(s, 10) || 0;
  }

  // Solde vendeur fiabilisé par réconciliation : solde de départ + somme des
  // montants des commandes non annulées passées par les clients. Ainsi, même
  // une commande passée par un autre chemin que fiche-boutique.html est
  // comptabilisée et le solde ne reste plus figé.
  function reconcileVendorBalance(v) {
    var vid = resolveVendorId(v);
    var seed = SEED_WALLETS.find(function (s) { return s.vendorId === vid; });
    var base = seed ? Math.round(Number(seed.balance) || 0) : 0;
    var earned = ordersForVendor(v).reduce(function (sum, o) {
      if (!o || o.status === 'annulee') return sum;
      return sum + vendorAmountNumber(o.amountN != null ? o.amountN : (o.amount || o.total));
    }, 0);
    return base + earned;
  }

  // Le solde de référence est celui du portefeuille vendeur (w.balance), muté par
  // creditVendor()/debitVendor(). `reconcileVendorBalance()` ne sert qu'à
  // initialiser ce solde une seule fois (solde de départ + commandes passées),
  // puis toutes les écritures (recharge, retrait, commande) s'y cumulent. Sans
  // cela, une recharge modifiait un champ jamais relu et le solde restait figé.
  function getVendorBalance(v) {
    var vid = resolveVendorId(v);
    var list = ensureWallets();
    var w = list.find(function (x) { return x.vendorId === vid; });
    if (!w) {
      w = { vendorId: vid, name: (v && v.name) || vid, balance: 0, currency: 'FCFA' };
      list.push(w);
    }
    if (w.updatedAt == null) {
      w.balance = reconcileVendorBalance(v);
      w.updatedAt = Date.now();
      writeWallets(list);
    }
    return Math.round(Number(w.balance) || 0);
  }

  function creditVendor(v, amount, reason) {
    var vid = resolveVendorId(v);
    var list = ensureWallets();
    var w = list.find(function (x) { return x.vendorId === vid; });
    if (!w) {
      w = { vendorId: vid, name: (v && v.name) || vid, balance: 0, currency: 'FCFA' };
      list.push(w);
    }
    w.balance = Math.round((Number(w.balance) || 0) + (Number(amount) || 0));
    if (reason) w.lastReason = reason;
    w.updatedAt = Date.now();
    writeWallets(list);
    return w;
  }

  function debitVendor(v, amount, reason) {
    var vid = resolveVendorId(v);
    var list = ensureWallets();
    var w = list.find(function (x) { return x.vendorId === vid; });
    if (!w) {
      w = { vendorId: vid, name: (v && v.name) || vid, balance: 0, currency: 'FCFA' };
      list.push(w);
    }
    var amt = Math.round(Number(amount) || 0);
    w.balance = Math.max(0, Math.round((Number(w.balance) || 0) - amt));
    if (reason) w.lastReason = reason;
    w.updatedAt = Date.now();
    writeWallets(list);
    return w;
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
    if (!s) return detectVendorTz() || 'Africa/Dakar';
    if (s.indexOf('/') !== -1) return s; // déjà un fuseau IANA
    return VENDOR_CITY_TZ[s.toLowerCase()] || 'Africa/Dakar';
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
    WALLETS_KEY: WALLETS_KEY,
    SEED_WALLETS: SEED_WALLETS,
    getVendorWallet: getVendorWallet,
    getVendorBalance: getVendorBalance,
    creditVendor: creditVendor,
    debitVendor: debitVendor,
    timeZone: 'Africa/Dakar',
    vendorTimeZone: vendorTimeZone,
    formatTime: formatTime,
    formatDate: formatDate
  };
})(window);
