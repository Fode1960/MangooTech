/* ==========================================================================
 * Mangoo Boosters — module client des badges de visibilité payants
 * --------------------------------------------------------------------------
 * Centralise les métadonnées des 3 offres (Sponsorisé / En Promo / Nouveau),
 * le formatage des prix et compteurs, et le client d'API REST /boosters.
 * Utilisé par le dashboard de gestion des boosters du prestataire.
 * ========================================================================== */
(function (global) {
  'use strict';
  if (global.MangooBoosters) return;

  // Métadonnées visuelles par type d'offre (icône Lucide + teinte de dégradé).
  var TONES = {
    'sponsorise': { label: 'Sponsorisé', icon: 'megaphone', chip: 'accent', grad1: 'var(--mgt-accent-50)', grad2: 'var(--mgt-accent-500)', bar: 'accent' },
    'promo':      { label: 'En Promo', icon: 'tag',       chip: 'primary', grad1: 'var(--mgt-primary-100)', grad2: 'var(--mgt-primary-500)', bar: 'primary' },
    'nouveau':    { label: 'Nouveau', icon: 'sparkles',  chip: 'primary-300', grad1: 'var(--mgt-primary-50)', grad2: 'var(--mgt-primary-300)', bar: 'primary' }
  };

  function tone(type) { return TONES[type] || TONES['nouveau']; }
  function boosterLabel(type) { return tone(type).label; }
  function boosterIcon(type) { return tone(type).icon; }

  function formatNumber(n) {
    n = Number(n) || 0;
    try { return n.toLocaleString('fr-FR'); } catch (e) { return String(n); }
  }

  function formatPrice(n) {
    n = Number(n) || 0;
    try { return n.toLocaleString('fr-FR'); } catch (e) { return String(n); }
  }

  function apiBase() {
    return (global.MangooBoosters && global.MangooBoosters.__base) || '/boosters';
  }

  function list(opts) {
    opts = opts || {};
    var qs = [];
    if (opts.vendor) qs.push('vendor=' + encodeURIComponent(opts.vendor));
    var url = apiBase() + (qs.length ? '?' + qs.join('&') : '');
    return fetch(url, { headers: { 'Accept': 'application/json' } }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    });
  }

  function post(body) {
    return fetch(apiBase(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    });
  }

  function activate(vendorId, vendorName, boosterId, payment) {
    var body = { action: 'activate', vendorId: vendorId, vendorName: vendorName, boosterId: boosterId };
    if (payment && typeof payment === 'object') {
      if (payment.operator) body.operator = payment.operator;
      if (payment.phone) body.phone = payment.phone;
      if (payment.otp) body.otp = payment.otp;
      if (payment.payFromWallet === true) body.payFromWallet = true;
    }
    return post(body);
  }
  function renew(id, payment) {
    var body = { action: 'renew', id: id };
    if (payment && typeof payment === 'object') {
      if (payment.operator) body.operator = payment.operator;
      if (payment.phone) body.phone = payment.phone;
      if (payment.otp) body.otp = payment.otp;
      if (payment.payFromWallet === true) body.payFromWallet = true;
    }
    return post(body);
  }
  function stop(id) {
    return post({ action: 'stop', id: id });
  }
  function trial(vendorId, vendorName, boosterId) {
    return post({ action: 'activate', trial: true, vendorId: vendorId, vendorName: vendorName, boosterId: boosterId });
  }

  global.MangooBoosters = {
    tone: tone,
    boosterLabel: boosterLabel,
    boosterIcon: boosterIcon,
    formatNumber: formatNumber,
    formatPrice: formatPrice,
    api: { list: list, activate: activate, renew: renew, stop: stop, trial: trial }
  };
})(window);
