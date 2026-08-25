/* ==========================================================================
 * Mangoo Catalogue — module client du catalogue de produits (biens physiques)
 * --------------------------------------------------------------------------
 * Centralise les catégories produits, le formatage des prix et le client
 * d'API REST /catalogue. Utilisé par le dashboard de gestion (produits
 * beauté/coiffure) et par la boutique publique (plats & boissons).
 * ========================================================================== */
(function (global) {
  'use strict';
  if (global.MangooCatalogue) return;

  var CATEGORIES = [
    // Produits salon / boutique beauté
    { id: 'cheveux',          label: 'Cheveux',          icon: 'scissors',    tone: 'primary', domain: 'salon' },
    { id: 'cosmetiques',      label: 'Cosmétiques',      icon: 'droplets',    tone: 'accent',  domain: 'salon' },
    { id: 'ongles',           label: 'Ongles',           icon: 'brush',       tone: 'info',    domain: 'salon' },
    { id: 'accessoires',      label: 'Accessoires',      icon: 'sparkles',    tone: 'warning', domain: 'salon' },
    // Produits restaurant
    { id: 'plats',            label: 'Plats',            icon: 'utensils',    tone: 'primary', domain: 'restaurant' },
    { id: 'entrees',          label: 'Entrées',          icon: 'salad',       tone: 'accent',  domain: 'restaurant' },
    { id: 'boissons',         label: 'Boissons',         icon: 'glass-water', tone: 'info',    domain: 'restaurant' },
    { id: 'accompagnements',  label: 'Accompagnements',  icon: 'cooking-pot', tone: 'warning', domain: 'restaurant' },
    // Produits boutique vendeur (commerce général — ex. DAN Boutique)
    { id: 'mode',             label: 'Vêtements & mode', icon: 'shirt',       tone: 'primary', domain: 'commerce' },
    { id: 'chaussures',       label: 'Chaussures',       icon: 'footprints',  tone: 'accent',  domain: 'commerce' },
    { id: 'sacs',             label: 'Sacs & maroquinerie', icon: 'backpack', tone: 'info',    domain: 'commerce' },
    { id: 'electronique',     label: 'Électronique',     icon: 'smartphone',  tone: 'warning', domain: 'commerce' },
    { id: 'maison',           label: 'Maison & déco',    icon: 'lamp',        tone: 'primary', domain: 'commerce' },
    { id: 'beaute',           label: 'Beauté & parfums', icon: 'sparkles',    tone: 'accent',  domain: 'commerce' }
  ];

  // Dégradés cohérents avec les tokens MangooTech (fond doux + texte foncé).
  var TONE_STYLES = {
    primary: { bg: 'rgb(var(--mgt-primary-50))',   fg: 'rgb(var(--mgt-primary-700))'   },
    accent:  { bg: 'rgb(var(--mgt-accent-50))',    fg: 'rgb(var(--mgt-accent-700))'    },
    info:    { bg: 'rgb(219 234 254)',             fg: 'rgb(29 78 216)'                },
    warning: { bg: 'rgb(255 247 237)',             fg: 'rgb(194 65 12)'                }
  };

  var DEFAULT_CATEGORY = { id: 'accessoires', label: 'Autre', icon: 'package', tone: 'warning' };

  function categoryById(id) {
    for (var i = 0; i < CATEGORIES.length; i++) {
      if (CATEGORIES[i].id === id) return CATEGORIES[i];
    }
    return DEFAULT_CATEGORY;
  }

  // Retourne les catégories d'un domaine (salon / restaurant / commerce).
  function categoriesFor(domain) {
    var out = [];
    for (var i = 0; i < CATEGORIES.length; i++) {
      if (!domain || CATEGORIES[i].domain === domain) out.push(CATEGORIES[i]);
    }
    return out;
  }

  function categoryLabel(id) {
    return categoryById(id).label;
  }

  function categoryIcon(id) {
    return categoryById(id).icon;
  }

  function categoryStyle(id) {
    return TONE_STYLES[categoryById(id).tone] || TONE_STYLES.warning;
  }

  function formatPrice(n) {
    n = Math.round(Number(n) || 0);
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' FCFA';
  }

  function priceFromText(t) {
    var m = String(t || '').replace(/[^\d]/g, '');
    return m ? parseInt(m, 10) : 0;
  }

  /* ------------------------------------------------------------------ *
   *  Client API REST /catalogue
   * ------------------------------------------------------------------ */
  function apiBase() {
    var base = (window.MangooCatalogue && window.MangooCatalogue.__base) || '/catalogue';
    return base;
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
      return (d && Array.isArray(d.catalogue)) ? d.catalogue : [];
    });
  }

  function save(product) {
    return fetch(apiBase(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product)
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

  global.MangooCatalogue = {
    CATEGORIES: CATEGORIES,
    categoriesFor: categoriesFor,
    categoryById: categoryById,
    categoryLabel: categoryLabel,
    categoryIcon: categoryIcon,
    categoryStyle: categoryStyle,
    formatPrice: formatPrice,
    priceFromText: priceFromText,
    api: { list: list, save: save, remove: remove }
  };
})(window);
