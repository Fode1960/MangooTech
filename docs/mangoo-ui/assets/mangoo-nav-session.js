/* ==========================================================================
 * Mangoo Nav Session — bouton d'en-tête adaptatif (« Connexion » / « Mon espace »
 * / « Mon dashboard ») partagé entre les pages publiques (accueil, carte, …).
 * --------------------------------------------------------------------------
 * Détecte la session courante dans cet ordre :
 *   1. mgt_user            — session réelle (client / prestataire / vendeur / …)
 *   2. mgt_vendor_identity_v1 — identité prestataire synchronisée à la connexion
 *   3. ?demo=prestataire|boutique — aperçu public sans session (mode démo)
 * --------------------------------------------------------------------------
 * Toute balise <a data-nav-auth> est réécrite :
 *   - client           → « Mon espace »     → client-dashboard.html
 *   - prestataire/…    → « Mon dashboard »  → dashboard-overview.html
 *   - démo             → « Mon dashboard »  → dashboard-overview.html?demo=…
 *   - sinon            → « Connexion »      → auth.html
 * ========================================================================== */
(function (global) {
  'use strict';
  if (global.__MangooNavSession) return;
  global.__MangooNavSession = true;

  function readJSON(key) {
    try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch (e) { return null; }
  }
  function roleOf(u) { return String((u && u.role) || '').toLowerCase(); }

  function role() {
    var r = roleOf(readJSON('mgt_user'));
    if (!r) r = roleOf(readJSON('mgt_vendor_identity_v1'));
    return r;
  }

  function demoRole() {
    try {
      var m = /[?&]demo=(prestataire|boutique|vendeur|1)\b/.exec(location.search);
      if (!m) return '';
      var r = m[1];
      return (r === 'vendeur' || r === '1') ? 'boutique' : r;
    } catch (e) { return ''; }
  }

  function isClient() { var r = role(); return r === 'client' || r === 'cliente'; }
  function isPro() {
    var r = role();
    return r === 'prestataire' || r === 'vendeur' || r === 'livreur';
  }

  function apply() {
    var btns = document.querySelectorAll('[data-nav-auth]');
    for (var i = 0; i < btns.length; i++) {
      var b = btns[i];
      var href, label;
      if (isClient()) {
        href = './client-dashboard.html'; label = 'Mon espace';
      } else if (isPro()) {
        href = './dashboard-overview.html'; label = 'Mon dashboard';
      } else {
        var d = demoRole();
        if (d) {
          href = './dashboard-overview.html?demo=' + d; label = 'Mon dashboard';
        } else {
          href = './auth.html'; label = 'Connexion';
        }
      }
      b.setAttribute('href', href);
      b.textContent = label;
    }
  }

  // Si la session locale est vide (localStorage nettoyé, autre onglet, cookie
  // httpOnly `mgt_session` comme source de vérité), on resynchronise depuis
  // /api/auth/session puis on réapplique le bouton.
  function resyncAndApply() {
    if (role()) { apply(); return; }
    try {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', '/api/auth/session', true);
      xhr.setRequestHeader('Accept', 'application/json');
      xhr.onreadystatechange = function () {
        if (xhr.readyState !== 4) return;
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            var d = JSON.parse(xhr.responseText);
            if (d && d.ok && d.user) {
              try { localStorage.setItem('mgt_user', JSON.stringify(d.user)); } catch (e) {}
            }
          } catch (e) {}
        }
        apply();
      };
      xhr.send(null);
    } catch (e) { apply(); }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', resyncAndApply);
  } else {
    resyncAndApply();
  }
})(window);
