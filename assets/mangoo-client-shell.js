/* ==========================================================================
 * Mangoo Client Shell — active la topbar + menu mobile des pages Client
 * --------------------------------------------------------------------------
 * Auto-porteur et idempotent. Corrige le menu mobile (les anciens scripts
 * ciblaient des sélecteurs inexistants sur certaines pages) et rend actifs les
 * boutons statiques de la topbar : cloche (notifications), compte (menu),
 * recherche (palette de navigation).
 *
 * Identité client par défaut : neutre (Client invité).
 * ========================================================================== */
(function (global) {
  'use strict';

  // ---- Garde d'accès par rôle (espace client) ----
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
    var s = readSession();
    if (!s.token || !s.user) { window.location.replace('./auth.html'); return false; }
    if (s.user.role !== role) { window.location.replace('./' + homeForRole(s.user.role)); return false; }
    return true;
  }
  if (!requireRole('client')) return;

  if (global.MangooClientShell && global.MangooClientShell.__ready) return;

  var NOTIF_KEY = 'mgt_client_notifications_v1';
  var NOTIF_SEED = [];

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
    'html,body{overflow-x:hidden;overflow-x:clip;}',
    'img,svg,video,canvas{max-width:100%;}',
    '.mgt-table-scroll{overflow-x:auto;-webkit-overflow-scrolling:touch;width:100%;max-width:100%;}',
    '@media (max-width:768px){',
    '  .mgt-shell-main{margin-left:0 !important;width:100% !important;max-width:100% !important;min-width:0 !important;}',
    '  .mgt-shell-main main,.mgt-shell-main header,.mgt-shell-main > div{min-width:0;}',
    '  .mgt-shell-main .flex > *{min-width:0;}',
    '  .mgt-shell-main main{overflow-x:hidden;}',
    '}',
    '@media (max-width:640px){',
    '  .mgt-shell-main .grid-cols-2,.mgt-shell-main .grid-cols-3,.mgt-shell-main .grid-cols-4,.mgt-shell-main .grid-cols-5,.mgt-shell-main .grid-cols-6{grid-template-columns:1fr !important;}',
    '  .mgt-shell-main main{padding-left:16px !important;padding-right:16px !important;}',
    '}'
  ].join('\n');

  var MOBILE_CSS = [
    '.mgt-menu-btn{display:none;align-items:center;justify-content:center;width:40px;height:40px;border:none;background:none;cursor:pointer;color:rgb(var(--mgt-foreground));border-radius:10px;flex-shrink:0;}',
    '.mgt-menu-btn:active{background:rgb(var(--mgt-muted));}',
    '.mgt-menu-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:35;}',
    '.mgt-menu-overlay.show{display:block;}',
    '@media (max-width:768px){',
    '  .mgt-menu-btn{display:flex;}',
    '  .mgt-shell-sidebar{transform:translateX(-100%) !important;transition:transform .25s ease;}',
    '  .mgt-shell-sidebar.open{transform:translateX(0) !important;box-shadow:0 0 60px rgba(0,0,0,.4);}',
    '  .mgt-shell-main{margin-left:0 !important;}',
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
    var n = readJSON(NOTIF_KEY, null);
    if (!Array.isArray(n)) {
      n = NOTIF_SEED.map(function (x) { return Object.assign({}, x); });
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
    if (document.getElementById('mgt-client-shell-style')) return;
    var s = document.createElement('style');
    s.id = 'mgt-client-shell-style';
    s.textContent = CSS;
    document.head.appendChild(s);
  }
  function injectMobileStyle() {
    if (document.getElementById('mgt-client-mobile-style')) return;
    var s = document.createElement('style');
    s.id = 'mgt-client-mobile-style';
    s.textContent = MOBILE_CSS;
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

  function findSidebar() {
    return document.querySelector('.dashboard-sidebar')
      || document.querySelector('.client-sidebar')
      || document.querySelector('aside.sidebar')
      || document.querySelector('aside.fixed');
  }
  function findMain(sidebar) {
    var sels = ['.dashboard-main', '.client-main-wrap', '.main-content', 'div.flex-1.ml-60', 'div[class*="ml-60"]'];
    for (var i = 0; i < sels.length; i++) {
      var el = document.querySelector(sels[i]);
      if (el && el !== sidebar && !sidebar.contains(el)) return el;
    }
    var sib = sidebar.nextElementSibling;
    while (sib && (sib.tagName === 'SCRIPT' || sib.tagName === 'STYLE')) sib = sib.nextElementSibling;
    return sib;
  }
  function findHeader() {
    return document.querySelector('header.dashboard-topbar')
      || document.querySelector('header.client-header')
      || document.querySelector('header.sticky')
      || document.querySelector('header.topbar')
      || document.querySelector('header');
  }
  function findSearch(header) {
    return header.querySelector('input[type="text"], input[type="search"]');
  }
  function findBell(header) {
    var btns = header.querySelectorAll('button');
    for (var i = 0; i < btns.length; i++) {
      var b = btns[i];
      if (b.querySelector('[data-lucide="bell"], .lucide-bell') || /notif/i.test(b.getAttribute('aria-label') || '')) return b;
    }
    return null;
  }
  function findAccount(header) {
    return header.querySelector('[class*="border-l"]');
  }

  function wireMenuButton(btn, sidebar) {
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
    var links = sidebar.querySelectorAll('a');
    for (var i = 0; i < links.length; i++) {
      (function (a) {
        a.addEventListener('click', function () { if (window.innerWidth <= 768) close(); });
      })(links[i]);
    }
  }

  function buildMobileNav(sidebar, header) {
    injectMobileStyle();
    sidebar.classList.add('mgt-shell-sidebar');

    var existing = document.getElementById('btn-app-menu') || header.querySelector('.mobile-menu-btn');
    if (existing) return; // déjà géré (ex. client-dashboard avec un bouton fonctionnel)

    var btn = document.createElement('button');
    btn.id = 'btn-app-menu';
    btn.type = 'button';
    btn.className = 'mgt-menu-btn';
    btn.title = 'Menu';
    btn.setAttribute('aria-label', 'Ouvrir le menu');
    btn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>';

    var title = header.querySelector('h1, .topbar-title');
    if (title) { title.parentNode.insertBefore(btn, title); } else { header.insertBefore(btn, header.firstChild); }
    wireMenuButton(btn, sidebar);
  }

  function buildNotifications(bell) {
    function render() {
      var notifs = getNotifs();
      var unread = notifs.filter(function (n) { return n.unread; }).length;
      var html = '<div class="mgt-pop-header">Notifications <span class="mgt-pop-count">' + unread + '</span></div>';
      if (!notifs.length) {
        html += '<div class="mgt-pop-empty">Aucune notification</div>';
      } else {
        html += '<div class="mgt-pop-list">' + notifs.map(function (n) {
          return '<div class="mgt-pop-item"><span class="dot ' + (n.unread ? '' : 'read') + '"></span><div style="flex:1;min-width:0;"><b>' + esc(n.title) + '</b><p>' + esc(n.body) + '</p><time>' + esc(n.time) + '</time></div></div>';
        }).join('') + '</div>';
      }
      html += '<div class="mgt-pop-footer"><button data-act="markall">Tout marquer comme lu</button></div>';
      return html;
    }
    var pop = makePopover(bell, render);
    pop.el.addEventListener('click', function (e) {
      e.stopPropagation();
      if (e.target.closest('[data-act="markall"]')) {
        setAllRead();
        pop.open();
      }
    });
  }

  function clientName() {
    try {
      var raw = localStorage.getItem('mgt_user');
      if (raw) {
        var u = JSON.parse(raw);
        if (u && (u.name || u.email)) return u;
      }
    } catch (e) {}
    return { name: 'Client invité' };
  }
  function clientInitials(name) {
    var n = String(name || '').trim();
    var p = n.split(/\s+/).filter(Boolean);
    if (!p.length) return '--';
    if (p.length === 1) return p[0].slice(0, 2).toUpperCase();
    return (p[0][0] + p[p.length - 1][0]).toUpperCase();
  }

  // Identité complète du client connecté : nom, logo, ville, email. La session
  // `mgt_user` est la source de vérité (écrite par auth.html puis enrichie du
  // logo par client-profile.html). On s'y réfère directement pour rester
  // indépendant de l'ordre de chargement de MangooClient.
  function clientIdentity() {
    var u = null;
    try {
      var raw = localStorage.getItem('mgt_user');
      if (raw) u = JSON.parse(raw);
    } catch (e) { u = null; }
    if (!u && global.MangooClient && global.MangooClient.sessionUser) {
      u = global.MangooClient.sessionUser();
    }
    if (!u) u = {};
    var name = String(u.fullName || u.name || (u.email ? String(u.email).split('@')[0] : 'Client') || 'Client').trim();
    var logo = u.logo || '';
    if (logo && String(logo).slice(0, 11) !== 'data:image/') logo = '';
    var city = String(u.city || '').trim();
    if (city.toLowerCase() === 'other' || city.toLowerCase() === 'autre') city = '';
    return { name: name, logo: logo, city: city, email: u.email || '' };
  }

  // Affiche un logo data URL dans une pastille circulaire, sinon les initiales.
  function applyAvatarToEl(el, logo, initials) {
    if (!el) return;
    el.style.overflow = 'hidden';
    if (logo) {
      el.innerHTML = '<img src="' + esc(logo) + '" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%;display:block;">';
    } else {
      el.textContent = initials;
    }
  }

  // Hydrate les pastilles d'identité du client (sidebar en bas à gauche, topbar,
  // message de bienvenue) avec le nom et le logo réellement connectés. C'est le
  // pendant client de `hydrateIdentity()` du shell prestataire.
  function hydrateIdentity() {
    var id = clientIdentity();
    var initials = clientInitials(id.name);
    function setText(sel, txt) {
      var el = document.getElementById(sel);
      if (el) el.textContent = txt;
    }

    applyAvatarToEl(document.getElementById('sidebar-user-avatar'), id.logo, initials);
    applyAvatarToEl(document.getElementById('topbar-avatar'), id.logo, initials);

    setText('sidebar-user-name', id.name || 'Client');
    setText('sidebar-user-city', id.city ? (id.city.charAt(0).toUpperCase() + id.city.slice(1)) : 'Cliente');
    setText('topbar-name', id.name || 'Client');

    var greet = document.getElementById('topbar-greeting');
    if (greet) {
      var first = id.name ? (id.name.split(/\s+/).filter(Boolean)[0] || '') : '';
      greet.textContent = first || '';
    }
  }

  function doLogout() {
    var token = null;
    try { token = localStorage.getItem('mgt_token'); } catch (err) {}
    var clearAndGo = function () {
      try { localStorage.removeItem('mgt_token'); localStorage.removeItem('mgt_user'); localStorage.removeItem('mgt_vendor_identity_v1'); } catch (err) {}
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

  function buildAccount(account) {
    function render() {
      var id = clientIdentity();
      var name = id.name || 'Client';
      var ini = clientInitials(name);
      var avatarHtml = id.logo
        ? '<span style="width:32px;height:32px;border-radius:50%;overflow:hidden;flex-shrink:0;"><img src="' + esc(id.logo) + '" alt="" style="width:100%;height:100%;object-fit:cover;display:block;"></span>'
        : '<span style="width:32px;height:32px;border-radius:50%;background:rgb(var(--mgt-accent));color:rgb(var(--mgt-accent-foreground));display:inline-flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;">' + esc(ini) + '</span>';
      return '<div class="mgt-pop-header"><div style="display:flex;gap:10px;align-items:center;">' + avatarHtml + '<span>' + esc(name) + '</span></div></div>' +
        '<div class="mgt-pop-list" style="padding:6px;">' +
          '<a class="mgt-pop-item" href="./client-profile.html"><div style="flex:1;">Mon profil</div></a>' +
          '<a class="mgt-pop-item" href="./client-orders.html"><div style="flex:1;">Mes commandes</div></a>' +
          '<a class="mgt-pop-item" href="./client-favorites.html"><div style="flex:1;">Mes favoris</div></a>' +
        '</div>' +
        '<div class="mgt-pop-footer"><span style="font-size:11px;color:rgb(var(--mgt-muted-foreground));">Cliente</span><a href="#" data-act="logout" class="mgt-pop-item danger" style="padding:0;">Déconnexion</a></div>';
    }
    var pop = makePopover(account, render);
    pop.el.addEventListener('click', function (e) {
      var logout = e.target.closest('[data-act="logout"]');
      if (logout) {
        e.preventDefault();
        doLogout();
      }
    });
  }

  function buildSearch(input) {
    var wrap = input.closest('.relative') || input.parentNode;
    wrap.style.position = 'relative';
    var pop = document.createElement('div');
    pop.className = 'mgt-popover';
    pop.style.cssText = 'position:absolute;top:calc(100% + 8px);left:0;width:100%;min-width:280px;background:rgb(var(--mgt-popover));border:1px solid rgb(var(--mgt-border));border-radius:12px;box-shadow:var(--mgt-shadow-lg);z-index:1200;display:none;overflow:hidden;';
    wrap.appendChild(pop);

    var sidebar = findSidebar();
    var links = sidebar ? Array.prototype.slice.call(sidebar.querySelectorAll('nav a, a')) : [];
    function render() {
      var q = input.value.trim().toLowerCase();
      if (!q) { pop.style.display = 'none'; return; }
      var matches = links.filter(function (a) { return a.textContent.toLowerCase().indexOf(q) >= 0; });
      if (!matches.length) {
        pop.innerHTML = '<div class="mgt-pop-empty">Aucun résultat pour « ' + esc(input.value.trim()) + ' »</div>';
      } else {
        pop.innerHTML = '<div class="mgt-pop-list" style="padding:6px;">' + matches.slice(0, 8).map(function (a) {
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
      }
    });
    document.addEventListener('click', function (e) {
      if (pop.style.display === 'block' && !wrap.contains(e.target)) pop.style.display = 'none';
    });
  }

  // Enveloppe les tableaux dans un conteneur à défilement horizontal sur mobile.
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

  function init() {
    injectStyle();
    hydrateIdentity();
    var sidebar = findSidebar();
    if (!sidebar) return;
    var main = findMain(sidebar);
    if (main) main.classList.add('mgt-shell-main');
    var header = findHeader();
    if (header) {
      buildMobileNav(sidebar, header);
      var bell = findBell(header);
      var search = findSearch(header);
      var account = findAccount(header);
      if (bell) buildNotifications(bell);
      if (search) buildSearch(search);
      if (account) buildAccount(account);
    }
    wrapTables();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  global.MangooClientShell = { __ready: true, init: init, hydrateIdentity: hydrateIdentity, unreadCount: unreadCount, setAllRead: setAllRead };
})(window);
