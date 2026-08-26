/* ==========================================================================
 * Mangoo Public Nav — active le menu mobile des pages publiques / marketing
 * --------------------------------------------------------------------------
 * Plusieurs pages (accueil, fiche, fiche-boutique, checkout, comparatif) ont
 * un bouton « hamburger » dans le header mais sans gestionnaire : sur mobile,
 * cliquer dessus ne faisait rien. Ce module :
 *   1. Repère le header sticky et son bouton menu (avec ou sans id).
 *   2. Récupère les liens du <nav> desktop (masqué sur mobile) de la page.
 *   3. Injecte un tiroir + overlay qui reprennent exactement ces mêmes liens.
 *   4. Branche l'ouverture/fermeture du tiroir sur le bouton hamburger.
 *
 * Auto-porteur et idempotent. Aucune dépendance externe.
 * ========================================================================== */
(function (global) {
  'use strict';
  if (global.MangooPublicNav && global.MangooPublicNav.__ready) return;

  var CSS = [
    '.mgt-nav-overlay{display:none;position:fixed;inset:0;background:rgba(15,23,42,.45);z-index:1080;}',
    '.mgt-nav-overlay.show{display:block;}',
    '.mgt-nav-drawer{position:fixed;top:0;left:0;bottom:0;z-index:1090;width:280px;max-width:85vw;background:rgb(var(--mgt-background));border-right:1px solid rgb(var(--mgt-border));transform:translateX(-100%);transition:transform .25s ease;display:flex;flex-direction:column;overflow-y:auto;}',
    '.mgt-nav-drawer.open{transform:translateX(0);box-shadow:0 0 60px rgba(0,0,0,.3);}',
    '.mgt-nav-head{display:flex;align-items:center;justify-content:space-between;padding:18px 20px;border-bottom:1px solid rgb(var(--mgt-border));}',
    '.mgt-nav-brand{display:flex;align-items:center;gap:12px;}',
    '.mgt-nav-logo{width:40px;height:40px;border-radius:10px;background:rgb(var(--mgt-primary));color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:18px;}',
    '.mgt-nav-title{font-size:16px;font-weight:700;color:rgb(var(--mgt-foreground));margin:0;}',
    '.mgt-nav-sub{font-size:12px;color:rgb(var(--mgt-muted-foreground));margin:0;}',
    '.mgt-nav-close{border:none;background:none;cursor:pointer;color:rgb(var(--mgt-muted-foreground));font-size:18px;line-height:1;padding:6px;border-radius:8px;}',
    '.mgt-nav-close:hover{background:rgb(var(--mgt-muted));}',
    '.mgt-nav-list{flex:1;padding:12px;display:flex;flex-direction:column;gap:2px;}',
    '.mgt-nav-link{display:flex;align-items:center;gap:12px;padding:12px 12px;border-radius:10px;color:rgb(var(--mgt-foreground));text-decoration:none;font-size:14px;font-weight:500;}',
    '.mgt-nav-link:hover{background:rgb(var(--mgt-muted));}',
    '.mgt-nav-link.cta{margin-top:8px;background:rgb(var(--mgt-accent));color:rgb(var(--mgt-accent-foreground));justify-content:center;font-weight:600;}',
    '.mgt-nav-link.cta:hover{background:rgb(var(--mgt-accent));filter:brightness(1.05);}',
    '.mgt-nav-foot{padding:12px;border-top:1px solid rgb(var(--mgt-border));}',
    '.mgt-live-dot-nav{position:relative;display:inline-block;width:9px;height:9px;border-radius:50%;background:#ef4444;margin-left:6px;vertical-align:middle;box-shadow:0 0 0 2px rgb(var(--mgt-primary));}'
  ].join('\n');

  function injectStyle() {
    if (document.getElementById('mgt-public-nav-style')) return;
    var s = document.createElement('style');
    s.id = 'mgt-public-nav-style';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function findHeader() {
    return document.querySelector('header.sticky') || document.querySelector('header');
  }

  function findToggle(header) {
    return header.querySelector('#mobile-menu-toggle')
      || header.querySelector('button[aria-label="Menu"]')
      || header.querySelector('button.md\\:hidden')
      || header.querySelector('button[data-lucide="menu"]');
  }

  function findDesktopNav(header) {
    var navs = header.querySelectorAll('nav');
    for (var i = 0; i < navs.length; i++) {
      var cls = navs[i].className || '';
      if (cls.indexOf('hidden') !== -1 || cls.indexOf('md:flex') !== -1) return navs[i];
    }
    return header.querySelector('nav');
  }

  // Ajoute un accès rapide « Lives en direct » dans le header public quand il
  // est absent (certaines pages — fiche, checkout, comparatif — n'ont pas ce
  // lien). Idempotent : n'injecte rien si le lien existe déjà.
  function ensureLivesLink() {
    var header = findHeader();
    if (!header) return;
    var nav = findDesktopNav(header);
    if (!nav) return;
    var links = nav.querySelectorAll('a');
    for (var i = 0; i < links.length; i++) {
      if ((links[i].getAttribute('href') || '').indexOf('lives-en-direct.html') >= 0) return;
    }
    var anchor = null;
    for (var j = 0; j < links.length; j++) {
      if ((links[j].getAttribute('href') || '').indexOf('carte.html') >= 0) { anchor = links[j]; break; }
    }
    var a = document.createElement('a');
    a.href = './lives-en-direct.html';
    a.className = 'text-sm font-medium transition-opacity hover:opacity-80';
    a.style.cssText = 'color: rgb(var(--mgt-primary-foreground)); font-family: var(--mgt-font-sans);';
    a.innerHTML = 'Lives en direct<span class="mgt-live-dot-nav" style="display:none;"></span>';
    if (anchor && anchor.parentNode) {
      anchor.parentNode.insertBefore(a, anchor.nextSibling);
    } else {
      nav.appendChild(a);
    }
  }

  // Affiche/masque la pastille rouge des liens « Lives en direct » selon l'état
  // réel des lives (sondage /live-status, filet de sécurité léger).
  function refreshLiveDots() {
    function poll() {
      fetch('/live-status', { cache: 'no-store' })
        .then(function (r) { return r.json(); })
        .then(function (d) {
          var active = !!(d && d.active);
          document.querySelectorAll('.mgt-live-dot-nav').forEach(function (el) {
            el.style.display = active ? 'inline-block' : 'none';
          });
        })
        .catch(function () { /* ignore */ });
    }
    poll();
    setInterval(poll, 5000);
    document.addEventListener('visibilitychange', function () { if (!document.hidden) poll(); });
  }

  function init() {
    var header = findHeader();
    if (!header) return;
    var toggle = findToggle(header);
    if (!toggle) return;
    var desktopNav = findDesktopNav(header);
    if (!desktopNav) return;

    var links = Array.prototype.slice.call(desktopNav.querySelectorAll('a')).map(function (a) {
      return { href: a.getAttribute('href'), text: (a.textContent || '').trim() };
    }).filter(function (l) { return l.text; });

    // Un menu vide ne sert à rien.
    if (!links.length) return;

    injectStyle();

    var overlay = document.createElement('div');
    overlay.className = 'mgt-nav-overlay';
    var drawer = document.createElement('aside');
    drawer.className = 'mgt-nav-drawer';

    var items = links.map(function (l) {
      var isCta = /connexion|inscri|connect|log\s*in/i.test(l.text);
      return '<a class="mgt-nav-link' + (isCta ? ' cta' : '') + '" href="' + escapeHtml(l.href) + '">' + escapeHtml(l.text) + '</a>';
    }).join('');

    drawer.innerHTML =
      '<div class="mgt-nav-head"><div class="mgt-nav-brand"><div class="mgt-nav-logo">M</div><div><p class="mgt-nav-title">MangooTech</p><p class="mgt-nav-sub">Navigation</p></div></div><button class="mgt-nav-close" id="mgt-nav-close" aria-label="Fermer">✕</button></div>' +
      '<nav class="mgt-nav-list">' + items + '</nav>';

    document.body.appendChild(overlay);
    document.body.appendChild(drawer);

    function open() { drawer.classList.add('open'); overlay.classList.add('show'); }
    function close() { drawer.classList.remove('open'); overlay.classList.remove('show'); }

    toggle.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      drawer.classList.contains('open') ? close() : open();
    });
    overlay.addEventListener('click', close);
    drawer.querySelector('#mgt-nav-close').addEventListener('click', close);
    drawer.querySelectorAll('.mgt-nav-link').forEach(function (a) {
      a.addEventListener('click', function () { if (window.innerWidth <= 768) close(); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') close();
    });
  }

  function boot() {
    ensureLivesLink();
    init();
    refreshLiveDots();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  global.MangooPublicNav = { __ready: true, init: init, ensureLivesLink: ensureLivesLink };
})(window);
