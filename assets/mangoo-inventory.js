/* ==========================================================================
 * Mangoo Inventaire — module client partagé de gestion des stocks
 * --------------------------------------------------------------------------
 * Centralise les catégories produits, les statuts de stock, le formatage
 * des prix/montants et le client d'API REST /inventaire (références + seuils)
 * et /inventaire/mouvements (entrées/sorties). Utilisé par le dashboard
 * de gestion des stocks du prestataire.
 * ========================================================================== */
(function (global) {
  'use strict';
  if (global.MangooInventory) return;

  var CATEGORIES = [
    { id: 'cheveux',      label: 'Cheveux',      icon: 'scissors',   tone: 'primary', domain: 'salon' },
    { id: 'cosmetiques',  label: 'Cosmétiques',  icon: 'droplets',   tone: 'accent',  domain: 'salon' },
    { id: 'ongles',       label: 'Ongles',       icon: 'brush',      tone: 'info',    domain: 'salon' },
    { id: 'accessoires',  label: 'Accessoires',  icon: 'sparkles',   tone: 'warning', domain: 'salon' },
    { id: 'mode',         label: 'Vêtements & mode', icon: 'shirt',      tone: 'primary', domain: 'commerce' },
    { id: 'chaussures',   label: 'Chaussures',   icon: 'footprints', tone: 'accent',  domain: 'commerce' },
    { id: 'sacs',         label: 'Sacs & maroquinerie', icon: 'backpack', tone: 'info', domain: 'commerce' },
    { id: 'electronique', label: 'Électronique', icon: 'smartphone', tone: 'warning', domain: 'commerce' },
    { id: 'maison',       label: 'Maison & déco', icon: 'lamp',       tone: 'primary', domain: 'commerce' },
    { id: 'beaute',       label: 'Beauté & parfums', icon: 'sparkles', tone: 'accent',  domain: 'commerce' }
  ];

  // Retourne les catégories d'un domaine (salon / commerce).
  function categoriesFor(domain) {
    var out = [];
    for (var i = 0; i < CATEGORIES.length; i++) {
      if (!domain || CATEGORIES[i].domain === domain) out.push(CATEGORIES[i]);
    }
    return out;
  }

  // Dégradés cohérents avec les tokens MangooTech (fond doux + texte foncé).
  var TONE_STYLES = {
    primary: { bg: 'rgb(var(--mgt-primary-50))', fg: 'rgb(var(--mgt-primary-700))' },
    accent:  { bg: 'rgb(var(--mgt-accent-50))',  fg: 'rgb(var(--mgt-accent-700))'  },
    info:    { bg: 'rgb(219 234 254)',           fg: 'rgb(29 78 216)'              },
    warning: { bg: 'rgb(255 247 237)',           fg: 'rgb(194 65 12)'              }
  };

  function categoryById(id) {
    for (var i = 0; i < CATEGORIES.length; i++) {
      if (CATEGORIES[i].id === id) return CATEGORIES[i];
    }
    return { id: id || 'autre', label: 'Autre', icon: 'package', tone: 'warning' };
  }

  function categoryLabel(id) { return categoryById(id).label; }
  function categoryIcon(id) { return categoryById(id).icon; }
  function categoryStyle(id) { return TONE_STYLES[categoryById(id).tone] || TONE_STYLES.warning; }

  function formatPrice(n) {
    n = Math.round(Number(n) || 0);
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' FCFA';
  }

  function formatNumber(n) {
    n = Number(n) || 0;
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  }

  // Statut de stock : rupture (stock 0) / stock bas (<= seuil) / en stock.
  function statusFor(item) {
    var stock = Number(item && item.stock) || 0;
    var threshold = Number(item && item.threshold) || 0;
    if (stock <= 0) return { key: 'rupture', label: 'Rupture',  tone: 'error' };
    if (stock <= threshold) return { key: 'bas', label: 'Stock bas', tone: 'warning' };
    return { key: 'ok', label: 'En stock', tone: 'success' };
  }

  function statusStyle(key) {
    var map = {
      rupture: { bg: 'rgb(var(--mgt-error) / 0.15)', fg: 'rgb(var(--mgt-error))' },
      bas:     { bg: 'rgb(var(--mgt-warning) / 0.20)', fg: 'rgb(var(--mgt-accent-700))' },
      ok:      { bg: 'rgb(var(--mgt-success) / 0.15)', fg: 'rgb(var(--mgt-primary-600))' }
    };
    return map[key] || map.ok;
  }

  function apiBase() {
    return (global.MangooInventory && global.MangooInventory.__base) || '/inventaire';
  }

  function list(opts) {
    opts = opts || {};
    var qs = [];
    if (opts.vendor) qs.push('vendor=' + encodeURIComponent(opts.vendor));
    if (opts.category && opts.category !== 'all') qs.push('category=' + encodeURIComponent(opts.category));
    var url = apiBase() + (qs.length ? '?' + qs.join('&') : '');
    return fetch(url, { headers: { 'Accept': 'application/json' } }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    }).then(function (d) {
      return (d && Array.isArray(d.inventaire)) ? d.inventaire : [];
    });
  }

  function save(item) {
    return fetch(apiBase(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    });
  }

  function remove(id) {
    return fetch(apiBase() + '?id=' + encodeURIComponent(id), {
      method: 'DELETE',
      headers: { 'Accept': 'application/json' }
    }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    });
  }

  function listMovements(vendor) {
    var url = apiBase() + '/mouvements';
    if (vendor) url += '?vendor=' + encodeURIComponent(vendor);
    return fetch(url, { headers: { 'Accept': 'application/json' } }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    }).then(function (d) {
      return (d && Array.isArray(d.mouvements)) ? d.mouvements : [];
    });
  }

  function addMovement(m) {
    return fetch(apiBase() + '/mouvements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(m)
    }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    });
  }

  global.MangooInventory = {
    CATEGORIES: CATEGORIES,
    categoriesFor: categoriesFor,
    categoryById: categoryById,
    categoryLabel: categoryLabel,
    categoryIcon: categoryIcon,
    categoryStyle: categoryStyle,
    formatPrice: formatPrice,
    formatNumber: formatNumber,
    statusFor: statusFor,
    statusStyle: statusStyle,
    api: {
      list: list,
      save: save,
      remove: remove,
      listMovements: listMovements,
      addMovement: addMovement
    }
  };
})(window);
