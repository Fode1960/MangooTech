/* ==========================================================================
 * Mangoo Vendor Config — profil & configuration partagés du prestataire
 * --------------------------------------------------------------------------
 * Source unique de vérité pour les 12 modules de l'espace « Prestataire
 * certifié » : Paramètres, Vérification, Abonnement, Offres & tarifs,
 * Classement, Fidélité, Parrainage, Rapports, Support, Hors-ligne,
 * Promotions et Découverte.
 *
 * Chaque page lit/écrit SA section du document, mais toutes partagent le
 * même objet persisté côté serveur (data/vendor-config.json). C'est ce qui
 * garantit l'interconnexion : la Vérification influe sur le Classement,
 * l'Abonnement active les droits des modules payants, etc.
 * ========================================================================== */
(function (global) {
  'use strict';
  if (global.MangooVendorConfig) return;

  var ENDPOINT = '/api/vendor-config';

  function vendorId() {
    var v = (global.MangooVendor && global.MangooVendor.current) ? global.MangooVendor.current() : null;
    return (v && v.vendorId) || '';
  }

  function post(body) {
    return fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }).then(function (r) { return r.json(); });
  }

  function get() {
    return fetch(ENDPOINT + '?vendor=' + encodeURIComponent(vendorId()), { cache: 'no-store' })
      .then(function (r) { return r.json(); });
  }

  function patch(section, patchObj) {
    return post({ action: 'patch', vendorId: vendorId(), section: section, patch: patchObj });
  }

  function save(config) {
    return post({ action: 'save', vendorId: vendorId(), config: config });
  }

  function setPlan(plan) {
    return post({ action: 'set-plan', vendorId: vendorId(), plan: plan });
  }

  function setVerification(status, note) {
    return post({ action: 'set-verification', vendorId: vendorId(), status: status, note: note });
  }

  // Certifie / retire le badge « Certifié » d'un vendeur cible (utilisé par l'admin).
  function setVendorVerification(targetVendorId, status, note, badgeVisible) {
    var visible = badgeVisible !== undefined ? !!badgeVisible : (status === 'certifie');
    return post({
      action: 'set-verification',
      vendorId: vendorId(),
      targetVendorId: targetVendorId,
      status: status,
      note: note,
      badgeVisible: visible
    });
  }

  function toggleOnline(online) {
    return post({ action: 'toggle-online', vendorId: vendorId(), online: online });
  }

  function setWelcomeAudio(recording) {
    var r = recording || {};
    return post({
      action: 'set-welcome-audio',
      vendorId: vendorId(),
      text: r.text || '',
      dataUrl: r.dataUrl || '',
      mime: r.mime || 'audio/webm'
    });
  }

  // Calcule le taux de complétude du profil (pour le Classement / la Découverte).
  function completeness(config) {
    var checks = [];
    var p = config.profile || {};
    checks.push({ key: 'profil', ok: !!(p.enseigne && p.city && p.address) });
    checks.push({ key: 'contact', ok: !!(p.email && p.phone) });
    checks.push({ key: 'horaires', ok: !!(config.horaires && Object.keys(config.horaires).length >= 7) });
    checks.push({ key: 'paiements', ok: !!(config.paiements && config.paiements.methods && config.paiements.methods.length) });
    checks.push({ key: 'verification', ok: !!(config.verification && config.verification.status === 'certifie') });
    checks.push({ key: 'abonnement', ok: !!(config.subscription && config.subscription.plan && config.subscription.plan !== 'decouverte') });
    var done = checks.filter(function (c) { return c.ok; }).length;
    return { total: checks.length, done: done, pct: Math.round((done / checks.length) * 100), missing: checks.filter(function (c) { return !c.ok; }).map(function (c) { return c.key; }) };
  }

  function planLabel(planId, plans) {
    var found = (plans || []).find(function (x) { return x.id === planId; });
    return found ? found.name : (planId || '');
  }

  var VERIF_LABELS = {
    non_soumis: 'Non soumis',
    en_attente: 'En attente',
    certifie: 'Prestataire certifié',
    refuse: 'Refusé'
  };

  function verifLabel(status) {
    if (status === 'certifie') {
      var v = (global.MangooVendor && global.MangooVendor.current) ? global.MangooVendor.current() : null;
      var isBoutique = v && (v.role === 'vendeur' || v.category === 'commerce');
      return isBoutique ? 'Boutique certifiée' : 'Prestataire certifié';
    }
    return VERIF_LABELS[status] || status || '—';
  }

  global.MangooVendorConfig = {
    ENDPOINT: ENDPOINT,
    vendorId: vendorId,
    get: get,
    patch: patch,
    save: save,
    setPlan: setPlan,
    setVerification: setVerification,
    setVendorVerification: setVendorVerification,
    toggleOnline: toggleOnline,
    setWelcomeAudio: setWelcomeAudio,
    completeness: completeness,
    planLabel: planLabel,
    verifLabel: verifLabel
  };
})(window);
