/* =========================================================================
 * Mangoo Tech — Diagnostic WebRTC (TURN relay)
 * -------------------------------------------------------------------------
 * Affiche en direct, pendant un appel, si le flux audio/vidéo passe par :
 *   - le TURN dédié turn.mangoo.tech  →  « TURN OK » (vert)
 *   - un repli (openrelay / autre)    →  « TURN (repli) » (orange)
 *   - ou en direct P2P (host/srflx)   →  « Direct (P2P) » (bleu)
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

  // --- Patch global RTCPeerConnection ------------------------------------
  // On intercepte TOUTES les connexions WebRTC créées après chargement de ce
  // script (appel sortant, appel entrant, écran live, etc.).
  var observed = []; // { pc, id, latest: {...} }

  var NativePC = window.RTCPeerConnection || window.webkitRTCPeerConnection;

  function makeWrapper(Native) {
    if (!Native) return null;
    function Wrapped(config, constraints) {
      var pc;
      try { pc = new Native(config, constraints); }
      catch (e) { pc = new Native(); }
      observed.push({ pc: pc, id: 'pc-' + (observed.length + 1), latest: null });
      log('Nouvelle connexion WebRTC observée :', observed[observed.length - 1].id);
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

  function findSelectedPair(report) {
    var pairs = [];
    report.forEach(function (r) {
      if (r.type === 'candidate-pair') pairs.push(r);
    });
    pairs.sort(function (a, b) {
      var sa = a.selected ? 1 : 0, sb = b.selected ? 1 : 0;
      if (sa !== sb) return sb - sa;
      var na = a.nominated ? 1 : 0, nb = b.nominated ? 1 : 0;
      return nb - na;
    });
    return pairs[0] || null;
  }

  function classify(pc, pair, report) {
    var ice = pc.iceConnectionState || 'new';
    var conn = pc.connectionState || 'new';
    var local = pair ? report.get(pair.localCandidateId) : null;
    var remote = pair ? report.get(pair.remoteCandidateId) : null;
    var lType = local ? local.candidateType : null;
    var rType = remote ? remote.candidateType : null;
    var lIp = ipOf(local);

    if (ice === 'failed') return { state: 'failed', label: 'Échec ICE', ice: ice };
    if (!local) return { state: 'connecting', label: 'Connexion…', ice: ice };

    if (lType === 'relay') {
      var ours = lIp.indexOf(KNOWN_RELAY_IP) >= 0;
      return {
        state: ours ? 'turn-ok' : 'turn-fallback',
        label: ours ? ('TURN OK — ' + KNOWN_RELAY_HOST) : 'TURN (repli)',
        ip: lIp,
        protocol: local.relayProtocol || '',
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
      '#mgt-diag-badge{position:fixed;top:14px;right:14px;z-index:999999;max-width:340px;',
      'font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:12px;line-height:1.45;',
      'background:#0f172a;color:#e2e8f0;border:1px solid #334155;border-radius:10px;',
      'box-shadow:0 10px 30px rgba(0,0,0,.35);overflow:hidden;}',
      '#mgt-diag-badge .hd{display:flex;align-items:center;gap:8px;padding:8px 12px;',
      'background:#1e293b;border-bottom:1px solid #334155;cursor:default;}',
      '#mgt-diag-badge .hd b{font-size:12px;letter-spacing:.03em;}',
      '#mgt-diag-badge .hd .close{margin-left:auto;cursor:pointer;color:#94a3b8;',
      'background:none;border:0;font-size:16px;line-height:1;padding:0 2px;}',
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
        var pair = findSelectedPair(report);
        var c = classify(pc, pair, report);
        o.latest = c;
        results.push(c);
        var lc = pair ? report.get(pair.localCandidateId) : null;
        var rc = pair ? report.get(pair.remoteCandidateId) : null;
        rows.push({
          id: o.id,
          ice: pc.iceConnectionState,
          conn: pc.connectionState,
          l: lc ? lc.candidateType : '—',
          r: rc ? rc.candidateType : '—',
          lIp: ipOf(lc), rIp: ipOf(rc)
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
    // Priorité d'affichage : relay dédié > relay repli > p2p > failed > connecting
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

    // Journal console compact pour le débogage profond.
    log('État ICE :', best.state, best.label, metaParts.join(' | '));
  }

  setInterval(pollOnce, 1200);
  pollOnce();
})();
