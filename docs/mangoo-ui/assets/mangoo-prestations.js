/* ==========================================================================
 * Mangoo Prestations — module partagé
 * Catégories de services multi-métiers + client API serveur.
 * Utilisé par le dashboard prestataire (gestion) et la fiche client (affichage).
 * ========================================================================== */
(function (global) {
  'use strict';
  if (global.MangooPrestations) return;

  var CATEGORIES = [
    { id: 'beaute-coiffure',       label: 'Beauté & Coiffure',       icon: 'scissors',       gradient: 'linear-gradient(135deg,#ffe4e6,#fecdd3)', chipBg: '#ffe4e6', chipText: '#9f1239', iconColor: '#be123c' },
    { id: 'artisanat-reparation',  label: 'Artisanat & Réparation',  icon: 'hammer',         gradient: 'linear-gradient(135deg,#e8f5e9,#c8e6c9)', chipBg: '#e8f5e9', chipText: '#166534', iconColor: '#166534' },
    { id: 'maison-services',       label: 'Maison & Services',       icon: 'wrench',         gradient: 'linear-gradient(135deg,#e0f2fe,#bae6fd)', chipBg: '#e0f2fe', chipText: '#075985', iconColor: '#0369a1' },
    { id: 'bien-etre-massage',     label: 'Bien-être & Massage',     icon: 'flower',         gradient: 'linear-gradient(135deg,#ede9fe,#ddd6fe)', chipBg: '#ede9fe', chipText: '#5b21b6', iconColor: '#6d28d9' },
    { id: 'evenementiel',          label: 'Événementiel',            icon: 'party-popper',   gradient: 'linear-gradient(135deg,#fef3c7,#fde68a)', chipBg: '#fef3c7', chipText: '#92400e', iconColor: '#b45309' },
    { id: 'coaching-formation',    label: 'Coaching & Formation',    icon: 'graduation-cap', gradient: 'linear-gradient(135deg,#ccfbf1,#99f6e4)', chipBg: '#ccfbf1', chipText: '#115e59', iconColor: '#0f766e' }
  ];

  var UNITS = ['Par prestation', 'Par heure', 'Par jour', 'Forfait', 'Devis'];

  function categoryById(id) {
    for (var i = 0; i < CATEGORIES.length; i++) {
      if (CATEGORIES[i].id === id) return CATEGORIES[i];
    }
    return CATEGORIES[2]; // maison-services par défaut
  }

  function formatPrice(n) {
    n = Number(n) || 0;
    return n.toLocaleString('fr-FR');
  }

  function formatDuration(min) {
    min = Number(min) || 0;
    if (min <= 0) return '';
    if (min >= 1440 && min % 1440 === 0) return (min / 1440) + ' j';
    if (min % 60 === 0) return (min / 60) + 'h';
    if (min < 60) return min + ' min';
    return Math.floor(min / 60) + 'h' + (min % 60);
  }

  function api() {
    function list(vendor) {
      var url = '/prestations';
      if (vendor) url += '?vendor=' + encodeURIComponent(vendor);
      return fetch(url).then(function (r) {
        if (!r.ok) throw new Error('Erreur serveur (' + r.status + ')');
        return r.json();
      }).then(function (d) { return d.prestations || []; });
    }
    function save(p) {
      return fetch('/prestations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(p)
      }).then(function (r) { return r.json(); });
    }
    function remove(id) {
      return fetch('/prestations?id=' + encodeURIComponent(id), { method: 'DELETE' })
        .then(function (r) { return r.json(); });
    }
    return { list: list, save: save, remove: remove };
  }

  global.MangooPrestations = {
    CATEGORIES: CATEGORIES,
    UNITS: UNITS,
    categoryById: categoryById,
    formatPrice: formatPrice,
    formatDuration: formatDuration,
    api: api()
  };
})(window);
