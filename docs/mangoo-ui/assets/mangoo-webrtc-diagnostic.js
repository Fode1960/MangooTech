/* =========================================================================
 * Mangoo Tech — Diagnostic WebRTC (TURN relay) + journal téléchargeable
 * -------------------------------------------------------------------------
 * Affiche en direct, pendant un appel, si le flux audio/vidéo passe par :
 *   - le TURN dédié turn.mangoo.tech  →  « TURN OK » (vert)
 *   - un repli (openrelay / autre)    →  « TURN (repli) » (orange)
 *   - ou en direct P2P (host/srflx)   →  « Direct (P2P) » (bleu)
 *
 * Journal : enregistre en continu, avec horodatage, chaque paire de candidats
 * ICE et son évolution (état, sélection/nomination). Un bouton « Télécharger »
 * exporte l'historique complet au format JSON (et une variante texte) pour
 * documenter le test d'appel.
 *
 * INACTIF PAR DÉFAUT : sans effet sur les utilisateurs finaux.
 * Activation (pour le test d'appel) :
 *   1. Ajouter ?diagnostic=1 à l'URL  →  https://mangoo.tech/...?diagnostic=1
 *   2. ou, dans la console du navigateur :
 *        localStorage.setItem('mgt-webrtc-diagnostic','1')
 *      (persiste entre les pages pendant le test ; retirer avec
 *        localStorage.removeItem('mgt-webrtc-diagnostic'))
 * ========================================================================= */
(function () {
  'use strict';

  // --- Activation --------------------------------------------------------
  var ON = false;
  try {
    ON = (location.search || '').indexOf('diagnostic=1') >= 0 ||
         localStorage.getItem('mgt-webrtc-diagnostic') === '1';
  } catch (e) { /* ignore */ }
  if (!ON) return;

  // IP publique du VPS coturn (turn.mangoo.tech -> 167.235.27.95).
  var KNOWN_RELAY_IP = '167.235.27.95';
  var KNOWN_RELAY_HOST = 'turn.mangoo.tech';

  function log() {
    var args = Array.prototype.slice.call(arguments);
    args.unshift('[MangooDiag]');
    try { console.log.apply(console, args); } catch (e) {}
  }
  log('Diagnostic activé. Repli relais attendu :', KNOWN_RELAY_HOST, '(' + KNOWN_RELAY_IP + ')');

  // --- Journal horodaté --------------------------------------------------
  var SESSION_START = Date.now();
  var history = []; // { t, ts, kind, ... }
  function iso(ms) {
    return new Date(ms || Date.now()).toISOString();
  }
  function addEvent(kind, data) {
    var e = { t: iso(), ts: Date.now() - SESSION_START, kind: kind };
    for (var k in data) e[k] = data[k];
    history.push(e);
  }
  addEvent('session-start', { url: location.href, ua: navigator.userAgent });

  // --- Patch global RTCPeerConnection ------------------------------------
  // On intercepte TOUTES les connexions WebRTC créées après chargement de ce
  // script (appel sortant, appel entrant, écran live, etc.).
  var observed = []; // { pc, id, latest: {...}, sig: <dernier snapshot> }

  var NativePC = window.RTCPeerConnection || window.webkitRTCPeerConnection;

  function makeWrapper(Native) {
    if (!Native) return null;
    function Wrapped(config, constraints) {
      var pc;
      try { pc = new Native(config, constraints); }
      catch (e) { pc = new Native(); }
      var entry = { pc: pc, id: 'pc-' + (observed.length + 1), latest: null, sig: '' };
      observed.push(entry);
      log('Nouvelle connexion WebRTC observée :', entry.id);
      try { addEvent('pc-created', { id: entry.id, iceServers: config && config.iceServers ? config.iceServers : null }); } catch (e) {}
      try {
        pc.addEventListener('connectionstatechange', function () {
          var st = pc.connectionState || 'unknown';
          addEvent('connection-state', { id: entry.id, state: st });
        });
        pc.addEventListener('iceconnectionstatechange', function () {
          var st = pc.iceConnectionState || 'unknown';
          addEvent('ice-state', { id: entry.id, state: st });
        });
      } catch (e) { /* ignore */ }
      return pc;
    }
    Wrapped.prototype = Native.prototype;
    return Wrapped;
  }

  if (NativePC) {
    var W = makeWrapper(NativePC);
    window.RTCPeerConnection = W;
    if (window.webkitRTCPeerConnection) window.webkitRTCPeerConnection = W;
    if (window.mozRTCPeerConnection) window.mozRTCPeerConnection = W;
  } else {
    log('RTCPeerConnection indisponible dans ce navigateur.');
  }

  // --- Utilitaires stats --------------------------------------------------
  function ipOf(cand) {
    if (!cand) return '';
    if (cand.ip) return cand.ip;
    if (cand.address) return cand.address;
    // Repli : parser la chaîne « candidate:... <ip> <port> typ ... »
    try {
      var m = (cand.candidate || '').match(/(\d{1,3}(?:\.\d{1,3}){3})\s+\d+\s+typ\s+(\w+)/);
      if (m) return m[1];
    } catch (e) { /* ignore */ }
    return '';
  }
  function portOf(cand) {
    if (!cand) return null;
    if (cand.port) return cand.port;
    try {
      var m = (cand.candidate || '').match(/(\d{1,3}(?:\.\d{1,3}){3})\s+(\d+)\s+typ\s+(\w+)/);
      if (m) return parseInt(m[2], 10);
    } catch (e) { /* ignore */ }
    return null;
  }
  function desc(cand) {
    if (!cand) return null;
    return {
      type: cand.candidateType || null,
      protocol: cand.relayProtocol || cand.protocol || null,
      address: ipOf(cand) || null,
      port: portOf(cand),
      priority: cand.priority != null ? cand.priority : null
    };
  }

  function collectPairs(report) {
    var pairs = [];
    report.forEach(function (r) {
      if (r.type === 'candidate-pair') {
        pairs.push({
          id: r.id,
          local: desc(report.get(r.localCandidateId)),
          remote: desc(report.get(r.remoteCandidateId)),
          state: r.state || null,
          nominated: !!r.nominated,
          selected: !!r.selected,
          writable: r.writable != null ? !!r.writable : null
        });
      }
    });
    pairs.sort(function (a, b) {
      var sa = a.selected ? 1 : 0, sb = b.selected ? 1 : 0;
      if (sa !== sb) return sb - sa;
      var na = a.nominated ? 1 : 0, nb = b.nominated ? 1 : 0;
      return nb - na;
    });
    return pairs;
  }

  function findSelectedPair(pairs) {
    return pairs[0] || null;
  }

  function classify(pc, pair) {
    var ice = pc.iceConnectionState || 'new';
    if (ice === 'failed') return { state: 'failed', label: 'Échec ICE', ice: ice };
    if (!pair || !pair.local) return { state: 'connecting', label: 'Connexion…', ice: ice };

    var lType = pair.local.type;
    var rType = pair.remote ? pair.remote.type : null;
    var lIp = pair.local.address || '';

    if (lType === 'relay') {
      var ours = lIp.indexOf(KNOWN_RELAY_IP) >= 0;
      return {
        state: ours ? 'turn-ok' : 'turn-fallback',
        label: ours ? ('TURN OK — ' + KNOWN_RELAY_HOST) : 'TURN (repli)',
        ip: lIp,
        protocol: pair.local.protocol || '',
        lType: lType,
        rType: rType,
        ice: ice
      };
    }
    if (lType === 'host' || lType === 'srflx') {
      return { state: 'p2p', label: 'Direct (P2P)', ip: lIp, lType: lType, rType: rType, ice: ice };
    }
    return { state: 'other', label: 'ICE: ' + lType, ip: lIp, lType: lType, rType: rType, ice: ice };
  }

  // --- Badge UI ----------------------------------------------------------
  var STYLE_ID = 'mgt-diag-style';
  if (!document.getElementById(STYLE_ID)) {
    var css = document.createElement('style');
    css.id = STYLE_ID;
    css.textContent = [
      '#mgt-diag-badge{position:fixed;top:14px;right:14px;z-index:999999;max-width:360px;',
      'font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:12px;line-height:1.45;',
      'background:#0f172a;color:#e2e8f0;border:1px solid #334155;border-radius:10px;',
      'box-shadow:0 10px 30px rgba(0,0,0,.35);overflow:hidden;}',
      '#mgt-diag-badge .hd{display:flex;align-items:center;gap:8px;padding:8px 12px;',
      'background:#1e293b;border-bottom:1px solid #334155;cursor:default;}',
      '#mgt-diag-badge .hd b{font-size:12px;letter-spacing:.03em;}',
      '#mgt-diag-badge .hd .actions{margin-left:auto;display:flex;gap:6px;}',
      '#mgt-diag-badge .hd .act{cursor:pointer;color:#94a3b8;background:none;border:0;',
      'font-size:11px;line-height:1;padding:2px 4px;border-radius:4px;}',
      '#mgt-diag-badge .hd .act:hover{color:#fff;background:#334155;}',
      '#mgt-diag-badge .hd .close{cursor:pointer;color:#94a3b8;background:none;border:0;',
      'font-size:16px;line-height:1;padding:0 2px;}',
      '#mgt-diag-badge .hd .close:hover{color:#fff;}',
      '#mgt-diag-badge .body{padding:8px 12px;}',
      '#mgt-diag-badge .row{display:flex;align-items:center;gap:7px;}',
      '#mgt-diag-badge .dot{width:9px;height:9px;border-radius:9999px;flex:0 0 auto;}',
      '#mgt-diag-badge .lbl{font-weight:700;color:#f8fafc;}',
      '#mgt-diag-badge .meta{color:#94a3b8;margin-top:2px;word-break:break-word;}',
      '#mgt-diag-badge .det{margin-top:8px;border-top:1px dashed #334155;padding-top:6px;}',
      '#mgt-diag-badge .det-btn{cursor:pointer;color:#7dd3fc;background:none;border:0;padding:0;font-size:11px;}',
      '#mgt-diag-badge .det-list{display:none;margin-top:6px;max-height:220px;overflow:auto;color:#cbd5e1;}',
      '#mgt-diag-badge .det-list.open{display:block;}',
      '#mgt-diag-badge .det-list .it{padding:3px 0;border-bottom:1px solid #1e293b;}',
      '#mgt-diag-badge .ok{background:#22c55e;}',
      '#mgt-diag-badge .warn{background:#f59e0b;}',
      '#mgt-diag-badge .p2p{background:#3b82f6;}',
      '#mgt-diag-badge .err{background:#ef4444;}',
      '#mgt-diag-badge .conn{background:#94a3b8;}'
    ].join('');
    document.head.appendChild(css);
  }

  var badge = document.createElement('div');
  badge.id = 'mgt-diag-badge';
  badge.innerHTML =
    '<div class="hd"><b>Diagnostic WebRTC</b>' +
    '<span class="actions">' +
      '<button class="act" data-dl="json" title="Télécharger le journal (JSON)">⤓ JSON</button>' +
      '<button class="act" data-dl="txt" title="Télécharger le journal (texte)">⤓ TXT</button>' +
    '</span>' +
    '<button class="close" title="Fermer">×</button></div>' +
    '<div class="body">' +
      '<div class="row"><span class="dot conn"></span><span class="lbl">En attente d\'un appel…</span></div>' +
      '<div class="meta">Aucune connexion WebRTC active.</div>' +
      '<div class="det"><button class="det-btn">Détails ▾</button>' +
      '<div class="det-list"></div></div>' +
    '</div>';
  document.body.appendChild(badge);

  badge.querySelector('.close').addEventListener('click', function () {
    badge.remove();
  });
  var detBtn = badge.querySelector('.det-btn');
  var detList = badge.querySelector('.det-list');
  detBtn.addEventListener('click', function () {
    detList.classList.toggle('open');
    detBtn.textContent = detList.classList.contains('open') ? 'Détails ▴' : 'Détails ▾';
  });

  // --- Téléchargement du journal -----------------------------------------
  function downloadJournal(format) {
    var stamp = iso().replace(/[:.]/g, '-');
    var fname = 'mangoo-webrtc-journal-' + stamp;
    var blob, mime;
    if (format === 'txt') {
      mime = 'text/plain;charset=utf-8';
      fname += '.txt';
      var lines = ['Mangoo Tech — Journal diagnostic WebRTC',
        'Session: ' + iso(SESSION_START) + ' · ' + (location.href || ''),
        'TURN dédié attendu: ' + KNOWN_RELAY_HOST + ' (' + KNOWN_RELAY_IP + ')',
        '---'];
      history.forEach(function (e) {
        if (e.kind === 'pairs') {
          lines.push(e.t + '  [' + e.id + '] paires de candidats:');
          e.pairs.forEach(function (p) {
            lines.push('    ' + (p.selected ? '*' : ' ') + (p.nominated ? 'N ' : '  ') +
              'local=' + (p.local ? p.local.type + '/' + (p.local.protocol || '-') + ' ' + p.local.address + ':' + p.local.port : '—') +
              '  remote=' + (p.remote ? p.remote.type + '/' + (p.remote.protocol || '-') + ' ' + p.remote.address + ':' + p.remote.port : '—') +
              '  state=' + (p.state || '-') + ' writable=' + p.writable);
          });
        } else {
          lines.push(e.t + '  [' + (e.id || '-') + '] ' + e.kind +
            (e.state ? ' state=' + e.state : '') +
            (e.label ? ' label=' + e.label : ''));
        }
      });
      blob = new Blob([lines.join('\r\n')], { type: mime });
    } else {
      mime = 'application/json;charset=utf-8';
      fname += '.json';
      var doc = {
        session: iso(SESSION_START),
        url: location.href,
        userAgent: navigator.userAgent,
        knownRelayHost: KNOWN_RELAY_HOST,
        knownRelayIp: KNOWN_RELAY_IP,
        events: history
      };
      blob = new Blob([JSON.stringify(doc, null, 2)], { type: mime });
    }
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = fname;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () {
      URL.revokeObjectURL(a.href);
      a.remove();
    }, 300);
    addEvent('journal-download', { format: format });
    log('Journal téléchargé (' + format + ').');
  }

  Array.prototype.forEach.call(badge.querySelectorAll('.act[data-dl]'), function (btn) {
    btn.addEventListener('click', function () {
      downloadJournal(btn.getAttribute('data-dl'));
    });
  });

  function setDot(cls) {
    var d = badge.querySelector('.dot');
    d.className = 'dot ' + cls;
  }
  function setLbl(text) {
    badge.querySelector('.lbl').textContent = text;
  }
  function setMeta(text) {
    badge.querySelector('.meta').textContent = text;
  }

  // --- Boucle de mesure ----------------------------------------------------
  var STATUS_DOT = {
    'turn-ok': 'ok',
    'turn-fallback': 'warn',
    'p2p': 'p2p',
    'failed': 'err',
    'connecting': 'conn',
    'other': 'conn'
  };

  function pairSignature(pairs) {
    return pairs.map(function (p) {
      return (p.local ? p.local.type + '/' + (p.local.protocol || '-') + '/' + p.local.address : '—') +
        '>' + (p.remote ? p.remote.type + '/' + (p.remote.protocol || '-') + '/' + p.remote.address : '—') +
        ':' + (p.state || '-') + (p.selected ? 'S' : '') + (p.nominated ? 'N' : '');
    }).join('|');
  }

  function pollOnce() {
    var active = observed.filter(function (o) { return o.pc; });
    if (!active.length) {
      setDot('conn');
      setLbl('En attente d\'un appel…');
      setMeta('Aucune connexion WebRTC active.');
      return;
    }

    var pending = active.length;
    var results = [];
    var rows = [];

    active.forEach(function (o) {
      var pc = o.pc;
      var done = function (report) {
        var pairs = collectPairs(report);
        var sig = pairSignature(pairs);
        // Journalise seulement quand l'ensemble des paires a changé (évite le spam).
        if (sig && sig !== o.sig) {
          o.sig = sig;
          addEvent('pairs', { id: o.id, pairs: pairs });
        }
        var pair = findSelectedPair(pairs);
        var c = classify(pc, pair);
        o.latest = c;
        results.push(c);
        var lc = pair ? pair.local : null;
        var rc = pair ? pair.remote : null;
        rows.push({
          id: o.id,
          ice: pc.iceConnectionState,
          conn: pc.connectionState,
          l: lc ? lc.type : '—',
          r: rc ? rc.type : '—',
          lIp: lc ? lc.address : '', rIp: rc ? rc.address : ''
        });
        pending--;
        if (pending === 0) render(results, rows, active.length);
      };
      try {
        if (typeof pc.getStats === 'function') {
          var p = pc.getStats(null);
          if (p && typeof p.then === 'function') { p.then(done).catch(function () { done(empty()); }); }
          else { pc.getStats(function (report) { done(report); }, function () { done(empty()); }); }
        } else {
          pending--;
          if (pending === 0) render(results, rows, active.length);
        }
      } catch (e) {
        pending--;
        if (pending === 0) render(results, rows, active.length);
      }
    });
  }

  function empty() {
    var m = new Map();
    return { get: function () { return null; }, forEach: function () {} };
  }

  function render(results, rows, count) {
    var order = { 'turn-ok': 0, 'turn-fallback': 1, 'p2p': 2, 'other': 3, 'failed': 4, 'connecting': 5 };
    var best = null;
    results.forEach(function (r) {
      if (!best || (order[r.state] < order[best.state])) best = r;
    });
    if (!best) best = { state: 'connecting', label: 'Connexion…', ice: '' };

    setDot(STATUS_DOT[best.state] || 'conn');
    setLbl(best.label);

    var metaParts = [];
    if (best.ip) metaParts.push('IP ' + best.ip);
    if (best.protocol) metaParts.push((best.protocol || '').toUpperCase());
    if (best.lType) metaParts.push('local=' + best.lType + (best.rType ? ' · distant=' + best.rType : ''));
    metaParts.push(count + ' connexion' + (count > 1 ? 's' : ''));
    metaParts.push(history.length + ' év.');
    setMeta(metaParts.join(' · '));

    detList.innerHTML = '';
    rows.forEach(function (r) {
      var div = document.createElement('div');
      div.className = 'it';
      div.textContent = r.id + ' — ' + r.l + ' → ' + r.r +
        (r.lIp ? ' (' + r.lIp + (r.rIp ? ' ↔ ' + r.rIp : '') + ')' : '') +
        ' · ' + r.conn;
      detList.appendChild(div);
    });

    log('État ICE :', best.state, best.label, metaParts.join(' | '));
  }

  setInterval(pollOnce, 1000);
  pollOnce();

  // --- Sécurité : purge automatique du journal si trop volumineux ---------
  setInterval(function () {
    if (history.length > 5000) history.splice(0, history.length - 5000);
  }, 30000);
})();
