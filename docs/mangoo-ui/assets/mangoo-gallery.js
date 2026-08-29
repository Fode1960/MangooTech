/* ==========================================================================
 * Mangoo Galerie — module client du portfolio photos
 * --------------------------------------------------------------------------
 * Centralise les catégories de photos (coiffure, maquillage, manucure, soin),
 * les dégradés de vignettes cohérents avec les tokens MangooTech, le formatage
 * des compteurs et le client d'API REST /galerie. Utilisé par le dashboard
 * de gestion de la galerie du prestataire.
 * ========================================================================== */
(function (global) {
  'use strict';
  if (global.MangooGallery) return;

  var CATEGORIES = [
    { id: 'coiffure',     label: 'Coiffure',     icon: 'scissors',     group: 'beauty',   g1: 'var(--mgt-primary-100)', g2: 'var(--mgt-primary-500)' },
    { id: 'maquillage',   label: 'Maquillage',   icon: 'brush',        group: 'beauty',   g1: 'var(--mgt-accent-100)',  g2: 'var(--mgt-accent-500)'  },
    { id: 'manucure',     label: 'Manucure',     icon: 'hand',         group: 'beauty',   g1: 'var(--mgt-primary-50)',  g2: 'var(--mgt-primary-300)' },
    { id: 'soin',         label: 'Soin',         icon: 'heart',        group: 'beauty',   g1: 'var(--mgt-accent-50)',   g2: 'var(--mgt-accent-300)'  },
    { id: 'mode',         label: 'Mode',         icon: 'shirt',        group: 'commerce', g1: 'var(--mgt-primary-100)', g2: 'var(--mgt-primary-500)' },
    { id: 'chaussures',   label: 'Chaussures',   icon: 'footprints',   group: 'commerce', g1: 'var(--mgt-accent-100)',  g2: 'var(--mgt-accent-500)'  },
    { id: 'sacs',         label: 'Sacs',         icon: 'shopping-bag', group: 'commerce', g1: 'var(--mgt-primary-50)',  g2: 'var(--mgt-primary-300)' },
    { id: 'electronique', label: 'Électronique', icon: 'smartphone',   group: 'commerce', g1: 'var(--mgt-accent-50)',   g2: 'var(--mgt-accent-300)'  },
    { id: 'maison',       label: 'Maison',       icon: 'home',         group: 'commerce', g1: 'var(--mgt-primary-100)', g2: 'var(--mgt-primary-300)' },
    { id: 'beaute',       label: 'Beauté',       icon: 'sparkles',     group: 'commerce', g1: 'var(--mgt-accent-100)',  g2: 'var(--mgt-accent-300)'  }
  ];

  var DEFAULT_CATEGORY = { id: 'autre', label: 'Autre', icon: 'image', g1: 'var(--mgt-muted)', g2: 'var(--mgt-muted-foreground)' };

  function categoryById(id) {
    for (var i = 0; i < CATEGORIES.length; i++) {
      if (CATEGORIES[i].id === id) return CATEGORIES[i];
    }
    return DEFAULT_CATEGORY;
  }

  // Retourne les catégories d'un groupe donné ('beauty' | 'commerce'),
  // ou toutes les catégories si aucun groupe n'est fourni.
  function categoriesFor(group) {
    if (!group) return CATEGORIES;
    return CATEGORIES.filter(function (c) { return c.group === group; });
  }

  function categoryLabel(id) { return categoryById(id).label; }
  function categoryIcon(id) { return categoryById(id).icon; }

  // Dégradé de vignette : fond doux -> teinte moyenne, cohérent avec les tokens.
  function categoryGradient(id) {
    var c = categoryById(id);
    return 'linear-gradient(135deg, rgb(' + c.g1 + '), rgb(' + c.g2 + '))';
  }

  function formatNumber(n) {
    n = Number(n) || 0;
    if (n >= 1000) return (n / 1000).toFixed(1).replace('.', ',') + ' k';
    return String(n);
  }

  function apiBase() {
    return (global.MangooGallery && global.MangooGallery.__base) || '/galerie';
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
      return (d && Array.isArray(d.galerie)) ? d.galerie : [];
    });
  }

  function save(photo) {
    return fetch(apiBase(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(photo)
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

  global.MangooGallery = {
    CATEGORIES: CATEGORIES,
    categoriesFor: categoriesFor,
    categoryById: categoryById,
    categoryLabel: categoryLabel,
    categoryIcon: categoryIcon,
    categoryGradient: categoryGradient,
    formatNumber: formatNumber,
    api: { list: list, save: save, remove: remove }
  };
})(window);
