/* ==========================================================================
 * Mangoo Dashboard Shell — active la barre supérieure du dashboard prestataire
 * --------------------------------------------------------------------------
 * Branche l'identité du professionnel connecté (MangooVendor) et rend actifs
 * les boutons statiques de la topbar :
 *   - Cloche  → panneau de notifications (badge non-lus, « tout marquer lu »)
 *   - Avatar  → menu compte (profil, abonnement, paramètres, déconnexion)
 *   - Recherche → palette de navigation rapide dans le menu latéral
 *
 * Auto-porteur et idempotent. S'appuie sur des ancres stables :
 *   #btn-notifications, #btn-account, #topbar-search
 *   + attributs data-vendor-name / data-vendor-initials /
 *     data-vendor-role / data-vendor-rating pour l'identité.
 * ========================================================================== */
(function (global) {
  'use strict';

  // Charge MangooConnect (messagerie + appels temps réel) sur toutes les pages
  // du dashboard qui n'en disposent pas encore, SAUF dashboard-live.html qui
  // gère son propre WebSocket. Sans ce module, les pages sans script ne reçoivent
  // ni les messages ni les appels (le chat auto ne s'ouvre que si le WS est là).
  // Chargement synchrone pour que MangooConnect soit disponible avant le
  // registerRT() de MangooVendor appelé plus bas dans init().
  (function ensureConnectPlus() {
    if (global.MangooConnect) return;
    var page = (location.pathname.split('/').pop() || '').toLowerCase();
    if (page === 'dashboard-live.html') return;
    try {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', '../assets/mangoo-connect-plus.js', false);
      xhr.send(null);
      if (xhr.status >= 200 && xhr.status < 300) {
        (0, eval)(xhr.responseText);
      }
    } catch (e) { /* non bloquant */ }
  })();

  // ---- Garde d'accès par rôle (espace prestataire) ----
  function readSession() {
    try {
      var token = localStorage.getItem('mgt_token');
      var raw = localStorage.getItem('mgt_user');
      var user = raw ? JSON.parse(raw) : null;
      return { token: token, user: user };
    } catch (e) { return { token: null, user: null }; }
  }
  function homeForRole(role) {
    if (role === 'admin') return 'admin.html';
    if (role === 'client') return 'client-dashboard.html';
    if (role === 'vendeur' || role === 'prestataire') return 'dashboard-overview.html';
    return 'auth.html';
  }
  function requireRole(role) {
    // Aperçu démo depuis les liens publics (ex. footer « Dashboard prestataire ») :
    // affiche le dashboard prestataire de démonstration sans exiger de session
    // ni rediriger vers l'espace client. Le rôle démo est conservé en session
    // (via MangooDemo) lors de la navigation entre pages du dashboard.
    if (window.MangooDemo && window.MangooDemo.inDemo()) return true;
    if (/[?&]demo=(prestataire|boutique|vendeur|1)\b/.test(location.search)) return true;
    var s = readSession();
    // L'annuaire est un prototype consultable même sans session (aperçu canvas /
    // iframe) : il ne doit pas rediriger, sinon la liste apparaît « vide ».
    var guestPages = ['annuaire-prestataires.html', 'annuaire.html'];
    var isGuestPage = guestPages.indexOf(currentPageName()) >= 0;
    if (!s.token || !s.user) {
      if (isGuestPage) return true;
      window.location.replace('./auth.html');
      return false;
    }
    var r = s.user.role;
    var ok = (r === role) || (role === 'prestataire' && r === 'vendeur');
    if (!ok) { window.location.replace('./' + homeForRole(r)); return false; }
    return true;
  }
  // ---- Modules propres à chaque rôle (liste partagée nav + garde) ----
  // Modules réellement propres à chaque rôle.
  // Prestataire : rendez-vous, équipe, prestations, découverte.
  // Vendeur : catalogue, inventaire, livraisons, promotions, fidélité.
  // Tout le reste (Live, Hors-ligne, Classement, Parrainage, Performance,
  // Galerie, Finances, Avis, etc.) est TRANSVERSE et reste visible pour les deux.
  var PRESTA_ONLY = ['dashboard-agenda.html', 'dashboard-team.html', 'dashboard-services.html', 'dashboard-recommandation.html'];
  var VENDEUR_ONLY = ['dashboard-catalogue.html', 'dashboard-inventaire.html', 'dashboard-delivery.html', 'dashboard-promotions.html', 'dashboard-fidelite.html'];

  function currentPageName() {
    return (location.pathname.split('/').pop() || '').toLowerCase();
  }
  function guardPageRole(user) {
    var page = currentPageName();
    var r = (user && user.role) || '';
    if (PRESTA_ONLY.indexOf(page) >= 0 && r === 'vendeur') { window.location.replace('./dashboard-overview.html'); return false; }
    if (VENDEUR_ONLY.indexOf(page) >= 0 && r === 'prestataire') { window.location.replace('./dashboard-overview.html'); return false; }
    return true;
  }

  if (!requireRole('prestataire')) return;
  if (!guardPageRole(readSession().user)) return;

  if (global.MangooShell && global.MangooShell.__ready) return;

  var NOTIF_KEY = 'mgt_vendor_notifications_v1';

  var NOTIF_SEED_PRESTA = [];

  var NOTIF_SEED_VENDEUR = [];

  function currentNotifRole() {
    var vendor = global.MangooVendor ? global.MangooVendor.current() : null;
    return (vendor && vendor.role === 'vendeur') ? 'vendeur' : 'prestataire';
  }
  function seedNotifs() {
    var src = currentNotifRole() === 'vendeur' ? NOTIF_SEED_VENDEUR : NOTIF_SEED_PRESTA;
    return src.map(function (x) { return Object.assign({}, x); });
  }

  var CSS = [
    '.mgt-popover{font-family:var(--mgt-font-sans);color:rgb(var(--mgt-foreground));text-align:left;font-size:14px;}',
    '.mgt-popover a{text-decoration:none;color:inherit;}',
    '.mgt-pop-header{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:12px 14px;border-bottom:1px solid rgb(var(--mgt-border));font-weight:600;}',
    '.mgt-pop-count{min-width:20px;height:20px;padding:0 6px;border-radius:9999px;background:rgb(var(--mgt-accent));color:rgb(var(--mgt-accent-foreground));font-size:12px;font-weight:700;display:inline-flex;align-items:center;justify-content:center;}',
    '.mgt-pop-list{max-height:320px;overflow-y:auto;padding:6px;}',
    '.mgt-pop-item{display:flex;gap:10px;align-items:flex-start;padding:10px 8px;border-radius:8px;cursor:pointer;transition:background .15s;}',
    '.mgt-pop-item:hover{background:rgb(var(--mgt-muted));}',
    '.mgt-pop-item .dot{width:8px;height:8px;border-radius:50%;background:rgb(var(--mgt-accent));margin-top:6px;flex-shrink:0;}',
    '.mgt-pop-item .dot.read{background:transparent;}',
    '.mgt-pop-item b{display:block;font-size:13px;font-weight:600;line-height:1.3;}',
    '.mgt-pop-item p{font-size:12px;color:rgb(var(--mgt-muted-foreground));margin:2px 0 4px;line-height:1.4;}',
    '.mgt-pop-item time{font-size:11px;color:rgb(var(--mgt-muted-foreground));opacity:.8;}',
    '.mgt-pop-empty{padding:22px 14px;text-align:center;color:rgb(var(--mgt-muted-foreground));font-size:13px;}',
    '.mgt-pop-footer{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:10px 14px;border-top:1px solid rgb(var(--mgt-border));}',
    '.mgt-pop-footer button{background:none;border:none;cursor:pointer;font-size:12.5px;font-weight:600;color:rgb(var(--mgt-primary));padding:0;font-family:inherit;}',
    '.mgt-pop-footer button:hover{text-decoration:underline;}',
    '.mgt-pop-footer a{font-size:12.5px;font-weight:600;color:rgb(var(--mgt-muted-foreground));}',
    '.mgt-pop-footer a:hover{color:rgb(var(--mgt-foreground));}',
    '.mgt-pop-item.danger{color:rgb(var(--mgt-error));font-weight:600;}',
    '@keyframes mgt-pulse{0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,.45);}50%{box-shadow:0 0 0 6px rgba(239,68,68,0);}}',
    'aside nav a.mgt-nav-match{background:rgba(255,255,255,.22) !important;color:#fff !important;box-shadow:inset 0 0 0 1px rgba(255,255,255,.35);}',
    // — Scrollbars (menu latéral + contenu principal + tableaux) ——————————————
    // Charte unifiée : rail toujours transparent (aucun pavé blanc ne « croque »
    // un fond coloré), poignée arrondie et translucide qui s'intensifie au survol.
    // Sur fond vert (menu) → poignée blanche ; sur fond clair (page/tableaux)
    // → poignée gris ardoise, pour rester discrète et lisible partout.
    'aside nav{scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.45) transparent;}',
    'aside nav::-webkit-scrollbar{width:6px;height:6px;}',
    'aside nav::-webkit-scrollbar-track{background:transparent;}',
    'aside nav::-webkit-scrollbar-thumb{background:rgba(255,255,255,.40);border-radius:9999px;}',
    'aside nav::-webkit-scrollbar-thumb:hover{background:rgba(255,255,255,.70);}',
    'html{scrollbar-width:thin;scrollbar-color:rgba(71 85 105 / .55) transparent;}',
    'html::-webkit-scrollbar{width:8px;height:8px;}',
    'html::-webkit-scrollbar-track{background:transparent;}',
    'html::-webkit-scrollbar-thumb{background:rgba(71 85 105 / .45);border-radius:9999px;}',
    'html::-webkit-scrollbar-thumb:hover{background:rgba(71 85 105 / .70);}',
    '.mgt-table-scroll,.overflow-x-auto{scrollbar-width:thin;scrollbar-color:rgba(71 85 105 / .55) transparent;}',
    '.mgt-table-scroll::-webkit-scrollbar,.overflow-x-auto::-webkit-scrollbar{width:6px;height:6px;}',
    '.mgt-table-scroll::-webkit-scrollbar-track,.overflow-x-auto::-webkit-scrollbar-track{background:transparent;}',
    '.mgt-table-scroll::-webkit-scrollbar-thumb,.overflow-x-auto::-webkit-scrollbar-thumb{background:rgba(71 85 105 / .40);border-radius:9999px;}',
    '.mgt-table-scroll::-webkit-scrollbar-thumb:hover,.overflow-x-auto::-webkit-scrollbar-thumb:hover{background:rgba(71 85 105 / .65);}',
    '.mgt-sidebar-logout{display:flex;align-items:center;gap:8px;width:100%;margin-top:12px;padding:9px 12px;border:1px solid rgba(255,255,255,.18);border-radius:10px;background:rgba(255,255,255,.08);color:rgba(255,255,255,.85);font-family:inherit;font-size:13px;font-weight:600;cursor:pointer;transition:background .15s,border-color .15s;}',
    '.mgt-sidebar-logout:hover{background:rgba(239,68,68,.22);border-color:rgba(239,68,68,.55);color:#fff;}',
    '.mgt-sidebar-logout svg{flex-shrink:0;}',
    'html,body{overflow-x:hidden;overflow-x:clip;}',
    'img,svg,video,canvas{max-width:100%;}',
    '.mgt-table-scroll{overflow-x:auto;-webkit-overflow-scrolling:touch;width:100%;max-width:100%;}',
    '@media (max-width:768px){',
    '  #app-main{margin-left:0 !important;width:100% !important;max-width:100% !important;min-width:0 !important;}',
    '  #app-main main,#app-main header,#app-main > div{min-width:0;}',
    '  #app-main .flex > *{min-width:0;}',
    '  #app-main main{overflow-x:hidden;}',
    '}',
    '@media (max-width:640px){',
    '  #app-main .grid-cols-2,#app-main .grid-cols-3,#app-main .grid-cols-4,#app-main .grid-cols-5,#app-main .grid-cols-6{grid-template-columns:1fr !important;}',
    '  #app-main main{padding-left:16px !important;padding-right:16px !important;}',
    '}',
    // — Corrections mobiles des en-têtes / badges / recherche ————————————————
    // Sur mobile, la topbar (titre + badges + recherche + cloche + avatar) passe
    // en pile : les badges se replient au lieu de se chevaucher, et la barre de
    // recherche redevient visible pleine largeur.
    '@media (max-width:768px){',
    '  #app-main header.mgt-header{flex-wrap:wrap !important;gap:8px !important;padding-left:12px !important;padding-right:12px !important;}',
    '  #app-main header.mgt-header > .mgt-header-group{min-width:0;flex-wrap:wrap !important;gap:8px !important;}',
    '  #app-main header.mgt-header > .mgt-header-group:first-child{flex:1 1 100% !important;}',
    '  #app-main header.mgt-header > .mgt-header-group:last-child{flex:1 1 100% !important;align-items:center;}',
    '  #app-main header.mgt-header .mgt-search-wrap{display:block !important;flex:1 1 100% !important;width:100% !important;}',
    '  #app-main header.mgt-header .mgt-search-wrap input{width:100% !important;}',
    '  #app-main main .flex.items-center.gap-3:has(input[placeholder*="Rechercher"]){flex-wrap:wrap !important;}',
    '  #app-main main .flex.items-center.gap-3:has(input[placeholder*="Rechercher"]) > .relative{flex:1 1 100% !important;width:100% !important;}',
    '  #app-main main .flex.items-center.justify-between{flex-wrap:wrap !important;gap:8px !important;}',
    '}',
    // — Popovers (cloche / compte) : sur mobile, la topbar se replie sur deux
    // lignes et pousse le bouton à gauche. On ancre alors le popover en feuille
    // inférieure plein écran pour qu'il reste visible au lieu de déborder à gauche.
    '@media (max-width:768px){',
    '  .mgt-popover{position:fixed !important;top:auto !important;bottom:12px !important;left:12px !important;right:12px !important;width:auto !important;min-width:0 !important;max-width:none !important;border-radius:16px !important;}',
    '}'
  ].join('\n');

  function readJSON(key, fb) {
    try { var r = localStorage.getItem(key); return r ? JSON.parse(r) : fb; } catch (e) { return fb; }
  }
  function writeJSON(key, v) {
    try { localStorage.setItem(key, JSON.stringify(v)); } catch (e) { /* ignore */ }
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function getNotifs() {
    var role = currentNotifRole();
    var n = readJSON(NOTIF_KEY, null);
    var roleMatches = Array.isArray(n) && n.length > 0 && n[0]._role === role;
    if (!roleMatches) {
      n = seedNotifs();
      writeJSON(NOTIF_KEY, n);
    }
    return n;
  }
  function unreadCount() {
    return getNotifs().filter(function (n) { return n.unread; }).length;
  }
  function setAllRead() {
    var n = getNotifs().map(function (x) { x.unread = false; return x; });
    writeJSON(NOTIF_KEY, n);
  }

  function injectStyle() {
    if (document.getElementById('mgt-shell-style')) return;
    var s = document.createElement('style');
    s.id = 'mgt-shell-style';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  function makePopover(trigger, renderHTML) {
    trigger.style.position = 'relative';
    var pop = document.createElement('div');
    pop.className = 'mgt-popover';
    pop.style.cssText = 'position:absolute;top:calc(100% + 8px);right:0;min-width:320px;background:rgb(var(--mgt-popover));border:1px solid rgb(var(--mgt-border));border-radius:12px;box-shadow:var(--mgt-shadow-lg);z-index:1200;display:none;overflow:hidden;';
    trigger.appendChild(pop);

    function close() { pop.style.display = 'none'; }
    function open() { pop.innerHTML = renderHTML(); pop.style.display = 'block'; }
    function toggle() { if (pop.style.display === 'block') { close(); } else { open(); } }

    trigger.addEventListener('click', function (e) {
      e.stopPropagation();
      toggle();
    });
    document.addEventListener('click', function (e) {
      if (pop.style.display === 'block' && !trigger.contains(e.target)) close();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') close();
    });
    return { el: pop, open: open, close: close, toggle: toggle };
  }

  // Statut de certification réel du prestataire (lu depuis vendor-config).
  // null = pas encore chargé ; true/false après l'appel à applyVerificationRole().
  var verifCertified = null;

  function currentRoleLabel(vendor) {
    var isVendeur = !!(vendor && vendor.role === 'vendeur');
    var base = (global.MangooVendor && global.MangooVendor.roleBase)
      ? global.MangooVendor.roleBase(vendor)
      : 'Prestataire';
    if (verifCertified === true) {
      return isVendeur ? 'Boutique certifiée' : 'Prestataire certifié';
    }
    return base;
  }

  // Relie le libellé « Prestataire certifié » au statut de vérification réel.
  // Tant que la vérification n'est pas « certifie », on n'affiche que le rôle de
  // base (Prestataire / Vendeur), sans le suffixe « certifié ».
  function applyVerificationRole() {
    if (!global.MangooVendorConfig || !global.MangooVendorConfig.get) return;
    global.MangooVendorConfig.get().then(function (res) {
      var config = (res && res.config) || {};
      var status = config.verification && config.verification.status;
      verifCertified = (status === 'certifie');
      var vendor = global.MangooVendor ? global.MangooVendor.current() : null;
      var label = currentRoleLabel(vendor);
      var els = document.querySelectorAll('[data-vendor-role]');
      for (var i = 0; i < els.length; i++) els[i].textContent = label;
    }).catch(function () { /* laisse le libellé de base */ });
  }

  function hydrateIdentity() {
    var vendor = global.MangooVendor ? global.MangooVendor.current() : null;
    if (!vendor) return;
    var ini = global.MangooVendor.initials(vendor.name);
    var role = currentRoleLabel(vendor);
    var map = {
      'data-vendor-name': vendor.name,
      'data-vendor-initials': ini,
      'data-vendor-role': role,
      'data-vendor-rating': vendor.rating || ''
    };
    Object.keys(map).forEach(function (attr) {
      var els = document.querySelectorAll('[' + attr + ']');
      for (var i = 0; i < els.length; i++) els[i].textContent = map[attr];
    });

    // Affiche le logo du prestataire (data URL) dans les pastilles, sinon on
    // conserve les initiales. Le logo est stocké à l'inscription/connexion.
    // On relit aussi le logo depuis la session (mgt_user) : si l'identité
    // locale est ancienne et n'a pas de logo, on ne masque pas le logo du
    // professionnel déjà connecté.
    var logo = vendor.logo || '';
    if (logo && String(logo).slice(0, 11) !== 'data:image/') logo = '';
    if (!logo) {
      var s = readSession();
      if (s.user && s.user.logo && String(s.user.logo).slice(0, 11) === 'data:image/') logo = s.user.logo;
    }
    var circles = document.querySelectorAll('[data-vendor-initials]');
    for (var j = 0; j < circles.length; j++) {
      var c = circles[j];
      c.style.overflow = 'hidden';
      if (logo) {
        c.innerHTML = '<img src="' + logo + '" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%;display:block;">';
      } else {
        c.textContent = ini;
      }
    }
  }

  function buildNotifications(trigger) {
    function render() {
      var notifs = getNotifs();
      var unread = notifs.filter(function (n) { return n.unread; }).length;
      var html = '<div class="mgt-pop-header">Notifications <span class="mgt-pop-count">' + unread + '</span></div>';
      if (global.MangooPush && global.MangooPush.bellRowHTML) {
        html += global.MangooPush.bellRowHTML();
      }
      if (!notifs.length) {
        html += '<div class="mgt-pop-empty">Aucune notification</div>';
      } else {
        html += '<div class="mgt-pop-list">' + notifs.map(function (n) {
          return '<div class="mgt-pop-item"><span class="dot ' + (n.unread ? '' : 'read') + '"></span><div style="flex:1;min-width:0;"><b>' + esc(n.title) + '</b><p>' + esc(n.body) + '</p><time>' + esc(n.time) + '</time></div></div>';
        }).join('') + '</div>';
      }
      html += '<div class="mgt-pop-footer"><button data-act="markall">Tout marquer comme lu</button><a href="./dashboard-notifications.html">Voir tout</a></div>';
      return html;
    }
    var pop = makePopover(trigger, render);
    pop.el.addEventListener('click', function (e) {
      e.stopPropagation();
      var btn = e.target.closest('[data-act="markall"]');
      if (btn) {
        setAllRead();
        pop.open();
        updateBellBadge();
      }
    });
    if (global.MangooPush && global.MangooPush.bindBellRow) {
      global.MangooPush.bindBellRow(pop.el, function () { pop.open(); });
    }
    updateBellBadge();
  }

  function updateBellBadge() {
    var badge = document.getElementById('btn-notifications-badge');
    if (!badge) return;
    var count = unreadCount();
    badge.textContent = count > 0 ? String(count) : '';
    badge.style.display = count > 0 ? '' : 'none';
  }

  function buildAccount(trigger, vendor) {
    function render() {
      var ini = global.MangooVendor ? global.MangooVendor.initials(vendor.name) : 'MT';
      var role = currentRoleLabel(vendor);
      return '<div class="mgt-pop-header"><div style="display:flex;gap:10px;align-items:center;"><span style="width:32px;height:32px;border-radius:50%;background:rgb(var(--mgt-accent));color:rgb(var(--mgt-accent-foreground));display:inline-flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;">' + ini + '</span><span>' + esc(vendor.name) + '</span></div></div>' +
        '<div class="mgt-pop-list" style="padding:6px;">' +
          '<a class="mgt-pop-item" href="./dashboard-settings.html"><div style="flex:1;">Profil & identité</div></a>' +
          '<a class="mgt-pop-item" href="./dashboard-abonnement.html"><div style="flex:1;">Abonnement</div></a>' +
          '<a class="mgt-pop-item" href="./dashboard-settings.html"><div style="flex:1;">Paramètres</div></a>' +
        '</div>' +
        '<div class="mgt-pop-footer"><span style="font-size:11px;color:rgb(var(--mgt-muted-foreground));">' + esc(role) + '</span><a href="#" data-act="logout" class="mgt-pop-item danger" style="padding:0;">Déconnexion</a></div>';
    }
    var pop = makePopover(trigger, render);
    pop.el.addEventListener('click', function (e) {
      var logout = e.target.closest('[data-act="logout"]');
      if (logout) {
        e.preventDefault();
        doLogout();
      }
    });
  }

  // Déconnexion : révoque la session côté serveur puis vide le local.
  function doLogout() {
    var token = null;
    try { token = localStorage.getItem('mgt_token'); } catch (err) {}
    var clearAndGo = function () {
      try { localStorage.removeItem('mgt_token'); localStorage.removeItem('mgt_user'); } catch (err) {}
      if (global.MangooVendor && global.MangooVendor.clear) global.MangooVendor.clear();
      window.location.href = './auth.html';
    };
    if (token) {
      fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token }
      }).catch(function () {}).then(clearAndGo);
    } else {
      clearAndGo();
    }
  }

  function buildSearch(input) {
    var wrap = input.closest('.relative') || input.parentNode;
    wrap.style.position = 'relative';
    var pop = document.createElement('div');
    pop.className = 'mgt-popover';
    pop.style.cssText = 'position:absolute;top:calc(100% + 8px);left:0;width:100%;min-width:280px;background:rgb(var(--mgt-popover));border:1px solid rgb(var(--mgt-border));border-radius:12px;box-shadow:var(--mgt-shadow-lg);z-index:1200;display:none;overflow:hidden;';
    wrap.appendChild(pop);

    var links = Array.prototype.slice.call(document.querySelectorAll('aside nav a')).filter(function (a) { return a.style.display !== 'none'; });

    // Normalise accents/casse pour que « fidelite » trouve « Fidélité »,
    // « verification » trouve « Vérification », etc.
    function normalize(s) {
      return String(s == null ? '' : s)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
    }

    function clearHighlight() {
      links.forEach(function (a) { a.classList.remove('mgt-nav-match'); });
    }

    function highlight(matches) {
      clearHighlight();
      matches.forEach(function (a) { a.classList.add('mgt-nav-match'); });
    }

    function render() {
      var q = normalize(input.value);
      if (!q) { pop.style.display = 'none'; clearHighlight(); return; }
      var matches = links.filter(function (a) { return normalize(a.textContent).indexOf(q) >= 0; });
      highlight(matches);
      if (!matches.length) {
        pop.innerHTML = '<div class="mgt-pop-empty">Aucun module pour « ' + esc(input.value.trim()) + ' »</div>';
      } else {
        pop.innerHTML = '<div class="mgt-pop-list" style="padding:6px;">' + matches.slice(0, 10).map(function (a) {
          return '<a class="mgt-pop-item" href="' + esc(a.getAttribute('href')) + '"><div style="flex:1;">' + esc(a.textContent.trim()) + '</div></a>';
        }).join('') + '</div>';
      }
      pop.style.display = 'block';
    }

    input.addEventListener('input', render);
    input.addEventListener('focus', render);
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        var first = pop.querySelector('a');
        if (first) window.location.href = first.getAttribute('href');
      } else if (e.key === 'Escape') {
        pop.style.display = 'none';
        clearHighlight();
      }
    });
    document.addEventListener('click', function (e) {
      if (pop.style.display === 'block' && !wrap.contains(e.target)) {
        pop.style.display = 'none';
        clearHighlight();
      }
    });
  }

  function buildMobileNav() {
    // Normalise les IDs structurels (certaines pages propagées ne les portent pas
    // encore) pour que le menu hamburger mobile fonctionne partout de façon uniforme.
    var sidebar = document.getElementById('app-sidebar') || document.querySelector('aside.fixed.inset-y-0.left-0');
    if (sidebar && !sidebar.id) sidebar.id = 'app-sidebar';
    var main = document.getElementById('app-main') || document.querySelector('div.flex-1.ml-60');
    if (main && !main.id) main.id = 'app-main';

    // CSS mobile canonique (injecté une seule fois).
    if (!document.getElementById('mgt-shell-mobile')) {
      var style = document.createElement('style');
      style.id = 'mgt-shell-mobile';
      style.textContent = [
        '.mobile-menu-btn{display:none;align-items:center;justify-content:center;width:40px;height:40px;border:none;background:none;cursor:pointer;color:rgb(var(--mgt-foreground));border-radius:10px;flex-shrink:0;}',
        '.mgt-menu-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:35;}',
        '.mgt-menu-overlay.show{display:block;}',
        '@media (max-width:768px){',
        '  .mobile-menu-btn{display:flex;}',
        '  .mobile-menu-btn:active{background:rgb(var(--mgt-muted));}',
        '  #app-sidebar{transform:translateX(-100%);transition:transform .25s ease;}',
        '  #app-sidebar.open{transform:translateX(0);box-shadow:0 0 60px rgba(0,0,0,.4);}',
        '  #app-main{margin-left:0 !important;}',
        '}'
      ].join('\n');
      document.head.appendChild(style);
    }

    var btn = document.getElementById('btn-app-menu');
    var injected = false;
    if (!btn) {
      var header = document.querySelector('header.sticky') || document.querySelector('header');
      if (header) {
        var left = header.querySelector('div.flex.items-center');
        btn = document.createElement('button');
        btn.id = 'btn-app-menu';
        btn.className = 'mobile-menu-btn';
        btn.type = 'button';
        btn.title = 'Menu';
        btn.setAttribute('aria-label', 'Ouvrir le menu');
        btn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>';
        if (left) { left.insertBefore(btn, left.firstChild); } else { header.insertBefore(btn, header.firstChild); }
        injected = true;
      }
    }

    if (!btn || !sidebar) return;

    var overlay = document.createElement('div');
    overlay.className = 'mgt-menu-overlay';
    document.body.appendChild(overlay);
    function close() { sidebar.classList.remove('open'); overlay.classList.remove('show'); }
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      sidebar.classList.toggle('open');
      overlay.classList.toggle('show');
    });
    overlay.addEventListener('click', close);
    var navLinks = sidebar.querySelectorAll('a');
    for (var i = 0; i < navLinks.length; i++) {
      (function (a) {
        a.addEventListener('click', function () { if (window.innerWidth <= 768) close(); });
      })(navLinks[i]);
    }
  }

  function buildSidebarLogout() {
    var sidebar = document.getElementById('app-sidebar') || document.querySelector('aside.fixed.inset-y-0.left-0') || document.querySelector('aside');
    if (!sidebar) return;
    if (sidebar.querySelector('.mgt-sidebar-logout')) return; // déjà présent
    var nameEl = sidebar.querySelector('[data-vendor-name]');
    if (!nameEl) return;

    // Bloc « compte » en bas du menu latéral (border-t / py-4).
    var block = nameEl.closest('.py-4') || nameEl.closest('div.border-t') || (nameEl.parentElement && nameEl.parentElement.parentElement && nameEl.parentElement.parentElement.parentElement);
    if (!block) return;

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'mgt-sidebar-logout';
    btn.title = 'Se déconnecter';
    btn.setAttribute('aria-label', 'Se déconnecter');
    btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg><span>Déconnexion</span>';
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      doLogout();
    });
    block.appendChild(btn);
  }

  // Enveloppe les tableaux dans un conteneur à défilement horizontal afin qu'ils
  // ne fassent pas déborder la page sur mobile (au lieu de masquer/clipper le contenu).
  function wrapTables() {
    var tables = document.querySelectorAll('table');
    for (var i = 0; i < tables.length; i++) {
      var t = tables[i];
      if (t.closest('.mgt-table-scroll')) continue;
      var p = t.parentElement;
      if (!p) continue;
      if (/overflow-x-auto/.test(String(p.className || ''))) continue;
      var node = p, already = false;
      while (node && node !== document.body) {
        var cs = window.getComputedStyle(node);
        if (cs.overflowX === 'auto' || cs.overflowX === 'scroll') { already = true; break; }
        node = node.parentElement;
      }
      if (already) continue;
      var wrapper = document.createElement('div');
      wrapper.className = 'mgt-table-scroll';
      p.insertBefore(wrapper, t);
      wrapper.appendChild(t);
    }
  }

  // Prépare la topbar pour le responsive mobile : marque les groupes d'enfants
  // et la barre de recherche afin que le CSS du shell puisse les empiler sans
  // chevauchement et rendre la recherche visible sur Android/iOS.
  function prepHeader() {
    var header = document.querySelector('#app-main header') || document.querySelector('header');
    if (!header) return;
    header.classList.add('mgt-header');
    var groups = header.children;
    for (var i = 0; i < groups.length; i++) {
      var child = groups[i];
      if (child && child.nodeType === 1) child.classList.add('mgt-header-group');
    }
    // Barre de recherche de la topbar (l'id peut varier selon les pages :
    // #topbar-search ou un simple input placeholder « Rechercher... »).
    var inputs = header.querySelectorAll('input[placeholder*="Rechercher"], #topbar-search');
    for (var j = 0; j < inputs.length; j++) {
      var wrap = inputs[j].closest('.relative') || inputs[j].parentNode;
      if (wrap) wrap.classList.add('mgt-search-wrap');
    }
  }

  // Fait défiler le menu latéral pour que le module actif soit visible sans
  // scroll manuel (utile quand on navigue vers un module situé en bas de liste).
  function scrollActiveNav() {
    var sidebar = document.getElementById('app-sidebar') || document.querySelector('aside.fixed.inset-y-0.left-0') || document.querySelector('aside');
    if (!sidebar) return;
    var nav = sidebar.querySelector('nav');
    if (!nav) return;
    var active = nav.querySelector('a[class*="bg-white/15"]');
    if (!active) {
      var path = (location.pathname.split('/').pop() || '').toLowerCase();
      var links = nav.querySelectorAll('a');
      for (var i = 0; i < links.length; i++) {
        var href = (links[i].getAttribute('href') || '').toLowerCase();
        if (path && href.indexOf(path) >= 0) { active = links[i]; break; }
      }
    }
    if (!active) return;
    var navRect = nav.getBoundingClientRect();
    var linkRect = active.getBoundingClientRect();
    var target = nav.scrollTop + (linkRect.top - navRect.top) - (navRect.height - linkRect.height) / 2;
    nav.scrollTop = Math.max(0, target);
  }

  // ---- Sidebar dynamique selon le rôle ----
  // Prestataires de services et boutiques-vendeurs n'exposent pas les mêmes
  // modules. On masque ceux hors périmètre et on ajoute « Livraisons » à la
  // boutique, qui n'est pas présent dans le menu par défaut.
  var NAV_LINK_CLASS = 'flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/70 hover:bg-white/10 hover:text-white text-sm font-medium transition-colors';

  function applyRoleNav() {
    var vendor = global.MangooVendor ? global.MangooVendor.current() : null;
    var isVendeur = !!(vendor && vendor.role === 'vendeur');
    var sidebar = document.getElementById('app-sidebar') || document.querySelector('aside.fixed.inset-y-0.left-0') || document.querySelector('aside');
    if (!sidebar) return;
    var nav = sidebar.querySelector('nav');
    if (!nav) return;
    var hide = isVendeur ? PRESTA_ONLY : VENDEUR_ONLY;
    var links = nav.querySelectorAll('a');
    var hasDelivery = false;
    for (var i = 0; i < links.length; i++) {
      var href = links[i].getAttribute('href') || '';
      if (href.indexOf('dashboard-delivery.html') >= 0) hasDelivery = true;
      var hidden = hide.some(function (m) { return href.indexOf(m) >= 0; });
      links[i].style.display = hidden ? 'none' : '';
    }
    if (isVendeur && !hasDelivery) {
      var anchor = null;
      for (var j = 0; j < links.length; j++) {
        if ((links[j].getAttribute('href') || '').indexOf('dashboard-inventaire.html') >= 0) { anchor = links[j]; break; }
      }
      var a = document.createElement('a');
      a.href = './dashboard-delivery.html';
      a.className = NAV_LINK_CLASS;
      a.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg><span>Livraisons</span>';
      if (anchor && anchor.parentNode) {
        anchor.parentNode.insertBefore(a, anchor.nextSibling);
      } else {
        nav.appendChild(a);
      }
    }
    applyActiveNav();
  }

  // Marque le module courant comme actif dans la sidebar (fond + texte pleins),
  // et réinitialise les autres. Idempotent : corrige les pages qui arrivent avec
  // un état actif codé en dur ou avec un lien « Livraisons » injecté.
  function applyActiveNav() {
    var sidebar = document.getElementById('app-sidebar') || document.querySelector('aside.fixed.inset-y-0.left-0') || document.querySelector('aside');
    if (!sidebar) return;
    var nav = sidebar.querySelector('nav');
    if (!nav) return;
    var path = currentPageName();
    var links = nav.querySelectorAll('a');
    var matched = null;
    for (var i = 0; i < links.length; i++) {
      var a = links[i];
      var href = (a.getAttribute('href') || '').toLowerCase();
      a.classList.remove('bg-white/15', 'text-white');
      if (!a.classList.contains('text-white/70')) a.classList.add('text-white/70');
      if (!matched && path && href.indexOf(path) >= 0) matched = a;
    }
    if (matched) {
      matched.classList.remove('text-white/70');
      matched.classList.add('bg-white/15', 'text-white');
    }
  }

  // ---- Accès « Carte Local+ » + indicateur « En direct » dans la sidebar ----
  // Injecte un lien vers la carte Local+ (carte.html) et un badge « En direct »
  // pulsant sur le lien Live, rafraîchi depuis /live-status. Permet à un
  // vendeur/prestataire de savoir qu'un live est lancé et de rejoindre la carte
  // sans quitter son espace.
  function buildLiveNav() {
    var sidebar = document.getElementById('app-sidebar') || document.querySelector('aside.fixed.inset-y-0.left-0') || document.querySelector('aside');
    if (!sidebar) return;
    var nav = sidebar.querySelector('nav');
    if (!nav) return;
    var links = nav.querySelectorAll('a');

    // 0) Lien « Annuaire des pros » : présent uniquement sur certaines pages.
    // On le réinjecte ici pour qu'il soit visible sur TOUS les dashboards,
    // sinon les utilisateurs ne peuvent plus ouvrir l'annuaire depuis le menu.
    var hasAnnuaire = false;
    for (var ai = 0; ai < links.length; ai++) {
      if ((links[ai].getAttribute('href') || '').indexOf('annuaire-prestataires.html') >= 0) hasAnnuaire = true;
    }
    if (!hasAnnuaire) {
      var annAnchor = null;
      for (var aj = 0; aj < links.length; aj++) {
        if ((links[aj].getAttribute('href') || '').indexOf('dashboard-live.html') >= 0) { annAnchor = links[aj]; break; }
      }
      var ann = document.createElement('a');
      ann.href = './annuaire-prestataires.html';
      ann.className = NAV_LINK_CLASS;
      ann.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="M17 18a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2"/><rect x="3" y="4" width="18" height="18" rx="2"/><circle cx="12" cy="10" r="2"/><line x1="8" x2="8" y1="2" y2="4"/><line x1="16" x2="16" y1="2" y2="4"/></svg><span>Annuaire des pros</span>';
      if (annAnchor && annAnchor.parentNode) {
        annAnchor.parentNode.insertBefore(ann, annAnchor);
      } else {
        nav.appendChild(ann);
      }
      links = nav.querySelectorAll('a');
    }

    // 1) Lien « Carte Local+ » injecté après « Annuaire des pros ».
    var hasCarte = false;
    for (var i = 0; i < links.length; i++) {
      if ((links[i].getAttribute('href') || '').indexOf('carte.html') >= 0) hasCarte = true;
    }
    if (!hasCarte) {
      var anchor = null;
      for (var j = 0; j < links.length; j++) {
        if ((links[j].getAttribute('href') || '').indexOf('annuaire-prestataires.html') >= 0) { anchor = links[j]; break; }
      }
      var a = document.createElement('a');
      a.href = './carte.html';
      a.className = NAV_LINK_CLASS;
      a.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z"/><path d="M15 5.764v15"/><path d="M9 3.236v15"/></svg><span>Carte Local+</span>';
      if (anchor && anchor.parentNode) {
        anchor.parentNode.insertBefore(a, anchor.nextSibling);
      } else {
        nav.appendChild(a);
      }
      links = nav.querySelectorAll('a');
    }

    // 2) Le lien « Live » reste TOUJOURS la page de diffusion du pro
    //    (dashboard-live). Un vendeur/prestataire doit pouvoir lancer SON
    //    propre live même quand d'autres pros diffusent en parallèle : on ne
    //    détourne donc PLUS ce lien vers live-client (réservé aux spectateurs).
    //    On ajoute à la place un lien séparé « Lives en direct » (porteur du
    //    badge « En direct ») pour découvrir/rejoindre les lives des autres.
    var liveLink = null;
    for (var k = 0; k < links.length; k++) {
      if ((links[k].getAttribute('href') || '').indexOf('dashboard-live.html') >= 0) { liveLink = links[k]; break; }
    }

    // Renomme le lien de diffusion en « Lancer mon Live » pour lever toute
    // ambiguïté avec « Lives en direct » (la liste des directs des autres).
    // On conserve l'icône (radio) et on remplace uniquement le texte. Le
    // libellé d'origine varie selon les pages (« Live », « Live actif »…).
    if (liveLink) {
      var _iconEl = liveLink.querySelector('i[data-lucide], svg');
      var _newLabel = document.createElement('span');
      _newLabel.textContent = 'Lancer mon Live';
      liveLink.innerHTML = '';
      if (_iconEl) liveLink.appendChild(_iconEl);
      liveLink.appendChild(_newLabel);
      if (global.lucide && typeof global.lucide.createIcons === 'function') {
        global.lucide.createIcons();
      }
    }

    // Lien « Lives en direct » (liste multi-salles), injecté juste après « Live ».
    var hasDir = false;
    for (var li = 0; li < links.length; li++) {
      if ((links[li].getAttribute('href') || '').indexOf('lives-en-direct.html') >= 0) hasDir = true;
    }
    var dirLink = null;
    if (!hasDir) {
      var dla = document.createElement('a');
      dla.href = './lives-en-direct.html';
      dla.className = NAV_LINK_CLASS;
      dla.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9"/><path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5"/><circle cx="12" cy="12" r="2"/><path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5"/><path d="M19.1 4.9C23 8.8 23 15.2 19.1 19.1"/></svg><span>Lives en direct</span>';
      if (liveLink && liveLink.parentNode) {
        liveLink.parentNode.insertBefore(dla, liveLink.nextSibling);
      } else {
        nav.appendChild(dla);
      }
      links = nav.querySelectorAll('a');
    }
    for (var lj = 0; lj < links.length; lj++) {
      if ((links[lj].getAttribute('href') || '').indexOf('lives-en-direct.html') >= 0) { dirLink = links[lj]; break; }
    }

    // Badge « En direct » porté par le lien « Lives en direct ».
    var badge = null;
    if (dirLink) {
      badge = dirLink.querySelector('.mgt-live-badge');
      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'mgt-live-badge';
        badge.style.cssText = 'display:none;margin-left:auto;align-items:center;gap:4px;font-size:10px;font-weight:700;line-height:1;padding:2px 7px;border-radius:9999px;background:#ef4444;color:#fff;';
        badge.innerHTML = '<span style="width:6px;height:6px;border-radius:50%;background:#fff;animation:mgt-pulse 1.6s infinite;"></span>En direct';
        dirLink.appendChild(badge);
      }
    }

    // Met à jour uniquement le badge : le lien « Live » (diffusion) ne change
    // JAMAIS de destination, et « Lives en direct » pointe toujours vers la
    // liste multi-salles. C'est ce qui garantit qu'un pro peut toujours lancer
    // son live, quel que soit l'état des lives des autres.
    function setLiveState(st) {
      var active = !!(st && st.active);
      if (badge) badge.style.display = active ? 'inline-flex' : 'none';
    }
    function poll() {
      fetch('/live-status', { cache: 'no-store' })
        .then(function (r) { return r.json(); })
        .then(function (d) { setLiveState({ active: !!(d && d.active), vendorId: (d && d.vendorId) || '' }); })
        .catch(function () { /* ignore */ });
    }
    // 1) Réaction immédiate aux événements WebSocket (live-started / live-ended),
    //    quand MangooConnect est disponible (chargé ci-dessus ou par la page).
    if (global.MangooConnect && typeof global.MangooConnect.onLive === 'function') {
      global.MangooConnect.onLive(function (st) { setLiveState(st); });
    }
    // 2) Filet de sécurité : sondage /live-status rapproché (2 s) + re-sondage
    //    immédiat quand l'onglet redevient visible. Garantit une détection
    //    quasi instantanée même si la connexion WebSocket n'est pas établie.
    poll();
    setInterval(poll, 2000);
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) poll();
    });
    window.addEventListener('focus', poll);
  }

  function init() {
    injectStyle();
    prepHeader();
    hydrateIdentity();
    applyVerificationRole();
    applyRoleNav();
    buildLiveNav();
    if (global.MangooVendor) global.MangooVendor.registerRT();

    var bell = document.getElementById('btn-notifications');
    var account = document.getElementById('btn-account');
    var search = document.getElementById('topbar-search');

    var vendor = global.MangooVendor ? global.MangooVendor.current() : { name: 'DAN Boutique', role: 'vendeur' };

    if (bell) buildNotifications(bell);
    if (account) buildAccount(account, vendor);
    if (search) buildSearch(search);
    buildMobileNav();
    buildSidebarLogout();
    wrapTables();

    // S'assure que le module actif est visible dans la barre latérale, y compris
    // après le rendu des icônes et à l'ouverture du menu mobile.
    requestAnimationFrame(scrollActiveNav);
    setTimeout(scrollActiveNav, 120);
    window.addEventListener('resize', scrollActiveNav);
    var menuBtn = document.getElementById('btn-app-menu');
    if (menuBtn) menuBtn.addEventListener('click', function () { setTimeout(scrollActiveNav, 180); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  global.MangooShell = {
    __ready: true,
    init: init,
    unreadCount: unreadCount,
    setAllRead: setAllRead
  };
})(window);
