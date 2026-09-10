/* MangooTech — bouton flottant « Contacter le support »
 * Affiche un bouton d'action flottant (FAB) en bas à droite des dashboards.
 * - Si Mangoo Connect+ est chargé (vendeur/prestataire + client), l'appel passe
 *   par Internet (audio WebRTC, gratuit partout dans le monde, vers le compte
 *   support partagé « Support MangooTech »).
 * - Sinon (livreur), repli sur l'appel téléphonique classique.
 */
(function () {
  'use strict';
  if (window.__mgtSupportFab) return;
  window.__mgtSupportFab = true;

  function callSupport() {
    try {
      if (window.MangooConnect && typeof window.MangooConnect.callSupport === 'function') {
        window.MangooConnect.callSupport();
        return;
      }
    } catch (e) { /* repli sur l'appel téléphonique */ }
    window.location.href = 'tel:+33962014080';
  }

  function build() {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'mgt-support-fab';
    btn.setAttribute('aria-label', 'Contacter le support');
    btn.title = 'Contacter le support';
    btn.innerHTML =
      '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M3 18v-6a9 9 0 0 1 18 0v6"></path>' +
      '<path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z"></path>' +
      '<path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path>' +
      '</svg>';
    btn.style.cssText = [
      'position:fixed', 'right:16px', 'bottom:20px', 'z-index:2147483000',
      'width:54px', 'height:54px', 'border-radius:9999px', 'border:none',
      'cursor:pointer', 'display:flex', 'align-items:center', 'justify-content:center',
      'background-color:rgb(var(--mgt-primary))', 'color:rgb(var(--mgt-primary-foreground))',
      'box-shadow:0 8px 24px rgba(0,0,0,.24)', 'transition:transform .15s ease, box-shadow .15s ease'
    ].join(';') + ';';
    btn.addEventListener('mouseenter', function () {
      btn.style.transform = 'scale(1.07)';
      btn.style.boxShadow = '0 10px 28px rgba(0,0,0,.30)';
    });
    btn.addEventListener('mouseleave', function () {
      btn.style.transform = 'scale(1)';
      btn.style.boxShadow = '0 8px 24px rgba(0,0,0,.24)';
    });
    btn.addEventListener('click', callSupport);
    document.body.appendChild(btn);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', build);
  } else {
    build();
  }
})();
