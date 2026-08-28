/* =========================================================================
   Mangoo Connect+ — système de communication interne WebRTC de MangooTech
   -------------------------------------------------------------------------
   Module auto-porteur : injecte son style, son overlay d'appel et sa
   conversation, puis expose :
     - window.MangooConnect  (chat / appel / itinéraire / temps réel)
     - window.MangooExpress  (taxonomie des types de livraison)

   Temps réel : se connecte au serveur /webrtc-ws (serveur.cjs) pour la
   présence, la signalisation WebRTC (audio/vidéo), le chat et les rendez-vous.
   En l'absence de serveur ou de caméra/micro, il dégrade proprement vers une
   simulation (même comportement visuel qu'en production).
   ========================================================================= */
(function (global) {
  'use strict';

  if (global.MangooConnect) return;

  /* ------------------------------------------------------------------ *
   *  Thème
   * ------------------------------------------------------------------ */
  var html = document.documentElement;

  function isDark() {
    try {
      if (html.classList.contains('dark')) return true;
      var saved = localStorage.getItem('mgt-theme');
      if (saved === 'dark') return true;
      if (saved === 'light') return false;
      var auto = localStorage.getItem('mgt-theme-auto');
      return auto === '1' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch (e) {
      return false;
    }
  }

  function initials(name) {
    if (!name) return 'MT';
    var parts = String(name).trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  /* ------------------------------------------------------------------ *
   *  Style (Jour / Nuit)
   * ------------------------------------------------------------------ */
  var CSS = [
    '/* ===== Mangoo Connect+ (auto-injecté) ===== */',
    '.mcp-call-overlay{position:fixed;inset:0;z-index:9000;display:flex;align-items:center;justify-content:center;padding:24px;background:rgb(4,22,9);opacity:0;visibility:hidden;transition:opacity .25s,visibility .25s;overflow:hidden;}',
    'html.dark .mcp-call-overlay{background:rgb(7,10,8);}',
    '.mcp-call-overlay.open{opacity:1;visibility:visible;}',
    '.mcp-call-overlay .mcp-remote{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;background:#000;display:none;}',
    '.mcp-call-overlay .mcp-remote.show{display:block;}',
    '.mcp-call-overlay .mcp-local{position:absolute;top:16px;right:16px;width:112px;height:150px;object-fit:cover;border-radius:14px;background:#000;border:1px solid rgba(255,255,255,.25);display:none;z-index:3;box-shadow:0 8px 30px rgba(0,0,0,.4);}',
    '.mcp-call-overlay .mcp-local.show{display:block;}',
    '.mcp-call-overlay .mcp-center{position:relative;z-index:2;display:flex;flex-direction:column;align-items:center;justify-content:center;width:100%;max-width:420px;}',
    '.mcp-call-overlay .mcp-avatar{width:96px;height:96px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:rgb(232,97,12);color:#fff;font-size:32px;font-weight:700;text-transform:uppercase;border:3px solid rgba(255,255,255,.25);margin-bottom:16px;}',
    '.mcp-call-overlay .mcp-name{color:#fff;font-size:20px;font-weight:600;margin-bottom:4px;text-align:center;}',
    '.mcp-call-overlay .mcp-state{color:rgba(255,255,255,.92);font-size:14px;margin-bottom:8px;text-align:center;}',
    '.mcp-call-overlay .mcp-timer{color:rgba(255,255,255,.85);font-size:15px;font-variant-numeric:tabular-nums;margin-bottom:32px;}',
    '.mcp-call-overlay .mcp-actions{display:flex;gap:20px;}',
    '.mcp-call-overlay .mcp-btn{width:62px;height:62px;border-radius:50%;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:transform .15s;}',
    '.mcp-call-overlay .mcp-btn:hover{transform:scale(1.08);}',
    '.mcp-call-overlay .mcp-btn svg{width:26px;height:26px;}',
    '.mcp-call-overlay .mcp-btn.end{background:#ef4444;color:#fff;}',
    '.mcp-call-overlay .mcp-btn.accept{background:#22c55e;color:#fff;}',
    '.mcp-call-overlay .mcp-btn.mute{background:rgba(255,255,255,.18);color:#fff;}',
    '.mcp-call-overlay .mcp-btn.mute.off{background:rgba(255,255,255,.1);color:rgba(255,255,255,.85);}',
    '.mcp-call-overlay .mcp-hint{position:absolute;bottom:24px;left:0;right:0;text-align:center;color:rgba(255,255,255,.55);font-size:11px;z-index:2;}',
    '',
    '.mcp-chat{position:fixed;right:16px;bottom:16px;z-index:9500;width:360px;max-width:calc(100vw - 32px);max-height:min(520px,calc(100vh - 32px));display:flex;flex-direction:column;border-radius:16px;overflow:hidden;background:rgb(var(--mgt-card,255,255,255));border:1px solid rgb(var(--mgt-border,226,232,240));box-shadow:0 24px 60px -20px rgba(15,23,42,.35);opacity:0;transform:translateY(12px);visibility:hidden;transition:opacity .22s,transform .22s,visibility .22s;}',
    '.mcp-chat.open{opacity:1;transform:translateY(0);visibility:visible;}',
    '.mcp-chat .mcp-chat-head{display:flex;align-items:center;gap:10px;padding:12px 14px;background:rgb(var(--mgt-primary,26,92,42));color:rgb(var(--mgt-primary-foreground,255,255,255));}',
    '.mcp-chat .mcp-chat-head .mcp-avatar{width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:rgb(232,97,12);color:#fff;font-size:14px;font-weight:700;text-transform:uppercase;flex-shrink:0;}',
    '.mcp-chat .mcp-chat-head .mcp-who{flex:1;min-width:0;}',
    '.mcp-chat .mcp-chat-head .mcp-who b{display:block;font-size:14px;font-weight:600;line-height:1.2;}',
    '.mcp-chat .mcp-chat-head .mcp-who span{display:block;font-size:11px;opacity:.85;line-height:1.2;}',
    '.mcp-chat .mcp-close{background:none;border:none;color:inherit;cursor:pointer;padding:4px;display:flex;opacity:.9;}',
    '.mcp-chat .mcp-close:hover{opacity:1;}',
    '.mcp-chat .mcp-close svg{width:18px;height:18px;}',
    '.mcp-chat .mcp-body{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px;background:rgb(var(--mgt-muted,248,250,252));}',
    '.mcp-chat .mcp-msg{max-width:82%;padding:9px 12px;border-radius:14px;font-size:13px;line-height:1.45;}',
    '.mcp-chat .mcp-msg.in{background:rgb(var(--mgt-card,255,255,255));color:rgb(var(--mgt-foreground,15,23,42));border:1px solid rgb(var(--mgt-border,226,232,240));align-self:flex-start;border-bottom-left-radius:4px;}',
    '.mcp-chat .mcp-msg.out{background:rgb(var(--mgt-primary,26,92,42));color:rgb(var(--mgt-primary-foreground,255,255,255));align-self:flex-end;border-bottom-right-radius:4px;}',
    '.mcp-chat .mcp-msg.sys{align-self:center;background:transparent;color:rgb(var(--mgt-muted-foreground,100,116,139));font-size:11.5px;text-align:center;padding:2px 8px;}',
    '.mcp-chat .mcp-typing{display:flex;align-items:center;gap:8px;padding:6px 14px 0;background:rgb(var(--mgt-muted,248,250,252));color:rgb(var(--mgt-muted-foreground,100,116,139));font-size:12px;}',
    '.mcp-chat .mcp-typing .mcp-typing-dots{display:inline-flex;gap:3px;}',
    '.mcp-chat .mcp-typing .mcp-typing-dots i{width:5px;height:5px;border-radius:50%;background:rgb(var(--mgt-muted-foreground,100,116,139));display:inline-block;animation:mcpBlink 1.2s infinite ease-in-out;}',
    '.mcp-chat .mcp-typing .mcp-typing-dots i:nth-child(2){animation-delay:.15s;}',
    '.mcp-chat .mcp-typing .mcp-typing-dots i:nth-child(3){animation-delay:.3s;}',
    '@keyframes mcpBlink{0%,60%,100%{opacity:.25;transform:translateY(0);}30%{opacity:1;transform:translateY(-3px);}}',
    '.mcp-chat .mcp-foot{display:flex;gap:8px;padding:10px 12px;background:rgb(var(--mgt-card,255,255,255));border-top:1px solid rgb(var(--mgt-border,226,232,240));}',
    '.mcp-chat .mcp-input{flex:1;border:1px solid rgb(var(--mgt-input,226,232,240));background:rgb(var(--mgt-background,255,255,255));color:rgb(var(--mgt-foreground,15,23,42));border-radius:10px;padding:10px 12px;font-size:13px;outline:none;font-family:inherit;}',
    '.mcp-chat .mcp-send{flex-shrink:0;width:40px;height:40px;border-radius:10px;border:none;background:rgb(var(--mgt-primary,26,92,42));color:rgb(var(--mgt-primary-foreground,255,255,255));cursor:pointer;display:flex;align-items:center;justify-content:center;}',
    '.mcp-chat .mcp-send svg{width:18px;height:18px;}',
    '',
    '.mcp-delivery-badge{display:inline-flex;align-items:center;gap:7px;padding:6px 10px;border-radius:9999px;font-size:12px;font-weight:600;line-height:1.2;background:rgb(var(--mgt-primary-50,232,245,233));color:rgb(var(--mgt-primary-700,38,112,42));}',
    'html.dark .mcp-delivery-badge{background:rgba(76,168,82,.16);color:rgb(129,199,134);}',
    '.mcp-delivery-badge svg{width:15px;height:15px;flex-shrink:0;}',
    ''
  ].join('\n');

  var styleEl = document.createElement('style');
  styleEl.id = 'mangoo-connect-plus-css';
  styleEl.textContent = CSS;
  document.head.appendChild(styleEl);

  /* ------------------------------------------------------------------ *
   *  DOM : overlay d'appel
   * ------------------------------------------------------------------ */
  var callOverlay = document.createElement('div');
  callOverlay.className = 'mcp-call-overlay';
  callOverlay.setAttribute('role', 'dialog');
  callOverlay.setAttribute('aria-label', 'Appel Mangoo Connect+');
  callOverlay.innerHTML =
    '<video class="mcp-remote" data-mcp="remote" autoplay playsinline></video>' +
    '<video class="mcp-local" data-mcp="local" autoplay playsinline muted></video>' +
    '<div class="mcp-center">' +
      '<div class="mcp-avatar" data-mcp="avatar">MT</div>' +
      '<div class="mcp-name" data-mcp="name">—</div>' +
      '<div class="mcp-state" data-mcp="state">Connexion…</div>' +
      '<div class="mcp-timer" data-mcp="timer"></div>' +
      '<div class="mcp-actions">' +
        '<button class="mcp-btn mute" data-mcp="mute" aria-label="Couper le micro" title="Couper le micro">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>' +
        '</button>' +
        '<button class="mcp-btn accept" data-mcp="accept" aria-label="Répondre" title="Répondre" style="display:none;">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>' +
        '</button>' +
        '<button class="mcp-btn end" data-mcp="end" aria-label="Raccrocher" title="Raccrocher">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/><line x1="4" y1="4" x2="20" y2="20"/></svg>' +
        '</button>' +
      '</div>' +
    '</div>' +
    '<div class="mcp-hint">Appel sécurisé via Mangoo Connect+</div>';
  document.body.appendChild(callOverlay);

  /* ------------------------------------------------------------------ *
   *  DOM : conversation
   * ------------------------------------------------------------------ */
  var chatEl = document.createElement('div');
  chatEl.className = 'mcp-chat';
  chatEl.setAttribute('role', 'dialog');
  chatEl.setAttribute('aria-label', 'Discussion Mangoo Connect+');
  chatEl.innerHTML =
    '<div class="mcp-chat-head">' +
      '<div class="mcp-avatar" data-mcp="avatar">MT</div>' +
      '<div class="mcp-who"><b data-mcp="name">—</b><span>Mangoo Connect+ · en ligne</span></div>' +
      '<button class="mcp-close" data-mcp="close" aria-label="Fermer">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
      '</button>' +
    '</div>' +
    '<div class="mcp-body" data-mcp="body"></div>' +
    '<div class="mcp-typing" data-mcp="typing" style="display:none;">' +
      '<span class="mcp-typing-dots"><i></i><i></i><i></i></span>' +
      '<span class="mcp-typing-name" data-mcp="typing-name">est en train d\'écrire…</span>' +
    '</div>' +
    '<div class="mcp-foot">' +
      '<input class="mcp-input" data-mcp="input" type="text" placeholder="Écrivez un message…" />' +
      '<button class="mcp-send" data-mcp="send" aria-label="Envoyer">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>' +
      '</button>' +
    '</div>';
  document.body.appendChild(chatEl);

  function q(sel, root) { return (root || document).querySelector(sel); }

  /* ------------------------------------------------------------------ *
   *  État de l'appel
   * ------------------------------------------------------------------ */
  var callState = {
    open: false,
    connected: false,
    muted: false,
    incoming: false,
    timer: null,
    seconds: 0,
    target: null,
    pc: null,
    stream: null,
    hasVideo: false,
    callId: null,
    incomingSdp: null,
    incomingMode: 'audio',
    simTimers: []
  };

  function clearSimTimers() {
    callState.simTimers.forEach(function (t) { try { clearTimeout(t); } catch (e) {} });
    callState.simTimers = [];
  }

  function formatTimer(s) {
    var m = Math.floor(s / 60);
    var sec = s % 60;
    return (m < 10 ? '0' : '') + m + ':' + (sec < 10 ? '0' : '') + sec;
  }

  function setCallState(text) {
    q('[data-mcp="state"]', callOverlay).textContent = text;
  }

  function setCallTarget(target) {
    callState.target = target;
    q('[data-mcp="avatar"]', callOverlay).textContent = initials(target && target.name);
    q('[data-mcp="name"]', callOverlay).textContent = target && target.name ? target.name : '—';
  }

  function resetVideos() {
    callState.hasVideo = false;
    var remote = q('[data-mcp="remote"]', callOverlay);
    var local = q('[data-mcp="local"]', callOverlay);
    if (remote) { remote.srcObject = null; remote.classList.remove('show'); }
    if (local) { local.srcObject = null; local.classList.remove('show'); }
  }

  function startTimer() {
    stopTimer();
    stopRingback();
    callState.seconds = 0;
    callState.connected = true;
    q('[data-mcp="timer"]', callOverlay).textContent = formatTimer(0);
    setCallState('Connecté');
    callState.timer = setInterval(function () {
      callState.seconds++;
      q('[data-mcp="timer"]', callOverlay).textContent = formatTimer(callState.seconds);
    }, 1000);
  }

  function stopTimer() {
    if (callState.timer) clearInterval(callState.timer);
    callState.timer = null;
    callState.connected = false;
  }

  function cleanupPeer() {
    if (callState.pc) { try { callState.pc.close(); } catch (e) {} callState.pc = null; }
    if (callState.stream) {
      callState.stream.getTracks().forEach(function (t) { try { t.stop(); } catch (e) {} });
      callState.stream = null;
    }
    resetVideos();
    callState.callId = null;
    callState.incomingSdp = null;
    callState.hasVideo = false;
  }

  function endCall(notify) {
    stopTimer();
    stopRingback();
    stopIncomingRing();
    clearSimTimers();
    callState.open = false;
    callState.incoming = false;
    callOverlay.classList.remove('open');
    q('[data-mcp="accept"]', callOverlay).style.display = 'none';
    q('[data-mcp="mute"]', callOverlay).style.display = '';
    if (notify && callState.callId) {
      sendWS({ type: 'call-end', callId: callState.callId });
    }
    cleanupPeer();
    setCallState('Appel terminé');
    emitCallEnded();
  }

  /* ------------------------------------------------------------------ *
   *  Sonnerie (ringback) via Web Audio
   * ------------------------------------------------------------------ */
  var audioCtx = null;
  var ringNodes = [];

  function ensureAudio() {
    if (!audioCtx) {
      try {
        var AC = global.AudioContext || global.webkitAudioContext;
        if (AC) audioCtx = new AC();
      } catch (e) { audioCtx = null; }
    }
    return audioCtx;
  }
  function primeAudio() {
    var ctx = ensureAudio();
    if (ctx && ctx.state === 'suspended') { try { ctx.resume(); } catch (e) {} }
  }
  // Débloque l'audio (AudioContext) dès la première interaction de l'utilisateur.
  // Sur mobile, un AudioContext créé pendant la sonnerie d'un appel entrant reste
  // suspendu (aucun geste préalable) et ne produit aucun son ; en le créant tôt,
  // la sonnerie WebAudio devient audible.
  function unlockAudioOnGesture() {
    primeAudio();
    ['pointerdown', 'touchstart', 'keydown', 'click'].forEach(function (ev) {
      try { global.removeEventListener(ev, unlockAudioOnGesture, true); } catch (e) {}
    });
  }
  ['pointerdown', 'touchstart', 'keydown', 'click'].forEach(function (ev) {
    global.addEventListener(ev, unlockAudioOnGesture, true);
  });
  function stopRingback() {
    ringNodes.forEach(function (n) {
      try { if (n.stop) n.stop(); } catch (e) {}
      try { if (n.disconnect) n.disconnect(); } catch (e) {}
    });
    ringNodes = [];
  }
  function startRingback() {
    stopRingback();
    var ctx = ensureAudio();
    if (!ctx) return;
    if (ctx.state === 'suspended') { try { ctx.resume(); } catch (e) {} }
    var now = ctx.currentTime;
    function pulse(start) {
      var o1 = ctx.createOscillator();
      var o2 = ctx.createOscillator();
      var gain = ctx.createGain();
      var out = ctx.createGain();
      o1.type = 'sine'; o1.frequency.value = 440;
      o2.type = 'sine'; o2.frequency.value = 480;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.05, start + 0.03);
      gain.gain.setValueAtTime(0.05, start + 0.97);
      gain.gain.linearRampToValueAtTime(0, start + 1.0);
      o1.connect(gain); o2.connect(gain);
      gain.connect(out); out.connect(ctx.destination);
      o1.start(start); o2.start(start);
      o1.stop(start + 1.05); o2.stop(start + 1.05);
      ringNodes.push(o1, o2, gain, out);
    }
    for (var i = 0; i < 4; i++) pulse(now + i * 3);
  }

  var incomingRingTimer = null;
  function vibrateRing() {
    try { if (navigator.vibrate) navigator.vibrate([600, 250, 600, 250, 600]); } catch (e) {}
  }
  function stopVibrate() {
    try { if (navigator.vibrate) navigator.vibrate(0); } catch (e) {}
  }
  function startIncomingRing() {
    stopIncomingRing();
    startRingback();
    vibrateRing();
    incomingRingTimer = setInterval(function () {
      if (!callState.open || !callState.incoming) { stopIncomingRing(); return; }
      startRingback();
      vibrateRing();
    }, 3000);
  }
  function stopIncomingRing() {
    if (incomingRingTimer) clearInterval(incomingRingTimer);
    incomingRingTimer = null;
    stopRingback();
    stopVibrate();
  }

  /* ------------------------------------------------------------------ *
   *  Transport temps réel (WebSocket /webrtc-ws)
   * ------------------------------------------------------------------ */
  var ws = null;
  var identity = null;       // { role, id, name }
  var registered = false;
  var connState = 'offline';
  var reconnectAttempts = 0; // compteur de tentatives (backoff progressif)
  var reconnectTimer = null; // timer de reconnexion différée

  var presenceCbs = [];
  var messageCbs = [];
  var incomingCallCbs = [];
  var callEndedCbs = [];
  var appointmentCbs = [];
  var appointmentReplyCbs = [];
  var fileCbs = [];
  var fileProgressCbs = [];
  var fileSendProgressCbs = [];
  var statusCbs = [];
  var typingCbs = [];
  var liveCbs = [];

  function emit(list, arg) { list.forEach(function (cb) { try { cb(arg); } catch (e) {} }); }

  // Notifie les abonnés `onCallEnded` quand un appel se termine. Appelé par
  // `endCall()`. Était référencé mais jamais défini, ce qui levait une
  // `ReferenceError` dès la fin d'un appel.
  function emitCallEnded() { emit(callEndedCbs, {}); }

  function setConnState(s) {
    connState = s;
    emit(statusCbs, s);
  }

  function sendWS(obj) {
    if (ws && ws.readyState === 1) { try { ws.send(JSON.stringify(obj)); } catch (e) {} return true; }
    return false;
  }

  function ensureWS() {
    if (ws && (ws.readyState === 0 || ws.readyState === 1)) return;
    if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
    var proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
    try {
      ws = new WebSocket(proto + '//' + location.host + '/webrtc-ws');
    } catch (e) { ws = null; setConnState('offline'); scheduleReconnect(); return; }
    ws.binaryType = 'arraybuffer';
    setConnState('connecting');
    ws.onopen = function () {
      reconnectAttempts = 0; // réinitialise le backoff après une connexion réussie
      setConnState('online');
      if (identity) sendWS({ type: 'register', role: identity.role, id: identity.id, name: identity.name });
    };
    ws.onmessage = function (ev) {
      if (ev.data instanceof ArrayBuffer) { onFileChunk(currentFileId, ev.data); return; }
      var msg; try { msg = JSON.parse(ev.data); } catch (e) { return; }
      handleWS(msg);
    };
    ws.onclose = function () {
      setConnState('offline');
      ws = null;
      registered = false;
      scheduleReconnect();
    };
    ws.onerror = function () { /* onclose suivra */ };
  }

  // Reconnexion automatique avec backoff progressif (1 s → 2 s → 4 s → 8 s →
  // 16 s max) afin d'éviter une avalanche de connexions après une coupure
  // réseau, un redémarrage serveur ou un redéploiement Render. Le délai est
  // réinitialisé dès qu'une connexion aboutit (voir onopen).
  function scheduleReconnect() {
    if (reconnectTimer) return;
    var base = 1000;
    var delay = Math.min(base * Math.pow(2, reconnectAttempts), 16000);
    reconnectAttempts++;
    reconnectTimer = setTimeout(function () {
      reconnectTimer = null;
      ensureWS();
    }, delay);
  }

  function handleWS(msg) {
    switch (msg.type) {
      case 'registered': registered = true; setConnState(connState); flushOutbox(); break;
      case 'presence': emit(presenceCbs, msg.peers || []); break;
      case 'call-ring': onCallRing(msg); break;
      case 'call-accepted': onCallAccepted(msg); break;
      case 'call-rejected': onCallRejected(msg); break;
      case 'call-ended': onCallEndedFromPeer(msg); break;
      case 'call-error': onCallError(msg); break;
      case 'ice-candidate': onIce(msg); break;
      case 'chat-new': onChatNew(msg); break;
      case 'chat-ack': break;
      case 'typing': onTypingInternal(msg); emit(typingCbs, { from: msg.from, fromName: msg.fromName, isTyping: msg.isTyping }); break;
      case 'chat-history': break;
      case 'appointment-new': emit(appointmentCbs, msg); break;
      case 'appointment-accepted':
      case 'appointment-declined': emit(appointmentReplyCbs, msg); break;
      case 'file-start': onFileStart(msg); break;
      case 'file-end': onFileEnd(msg); break;
      case 'file-error': emit(fileCbs, { error: true, fileId: msg.fileId, reason: msg.reason }); break;
      case 'live-started': emit(liveCbs, { active: true, vendorId: msg.vendorId, vendorName: msg.vendorName, title: msg.title }); break;
      case 'live-ended': emit(liveCbs, { active: false }); break;
      case 'live-state': emit(liveCbs, { active: !!msg.active, vendorId: msg.vendorId, vendorName: msg.vendorName, title: msg.title, rooms: msg.rooms || [] }); break;
      case 'pong': break;
    }
  }

  function isReal() { return registered && connState === 'online'; }

  // File d'attente des messages à émettre avant que l'identité WS soit enregistrée.
  // Sur les pages publiques (carte, fiche, boutique), l'enregistrement démarre au
  // premier chargement ; un envoi immédiat de message arrivait parfois avant le
  // 'registered' serveur et était silencieusement abandonné (sendMessage renvoyait
  // false). On met donc en file tout envoi hors temps réel et on le purge dès que
  // isReal() devient vrai (événement 'registered').
  var outbox = [];

  function enqueueOutbox(fn) {
    if (isReal()) { fn(); return true; }
    outbox.push(fn);
    ensureGuest();
    return true;
  }

  function flushOutbox() {
    if (!isReal()) return;
    var queue = outbox.splice(0, outbox.length);
    queue.forEach(function (fn) { try { fn(); } catch (e) {} });
  }

  // Résout l'identifiant de routage d'une cible : un prestataire/boutique est
  // référencé par `vendorId` (ex. pro-41cafa4bcb31) côté annuaire, pas par
  // l'index numérique `id` renvoyé par /api/carte.
  function targetId(target) {
    if (!target) return '';
    return String(target.vendorId || target.id || '');
  }

  // Récupère l'identité d'un client déjà connecté (session `mgt_user`) afin que
  // les pages publiques (carte, fiche, boutique) identifient Dida DANSO par son
  // vrai profil plutôt que par un « Visiteur » anonyme. Les visiteurs sans compte
  // restent des invités.
  function readStoredClient() {
    try {
      var raw = localStorage.getItem('mgt_user');
      if (!raw) return null;
      var u = JSON.parse(raw);
      if (!u) return null;
      var role = String(u.role || '').toLowerCase();
      if (role !== 'client' && role !== 'cliente') return null;
      var id = u.id || u.vendorId || '';
      if (!id) return null;
      var name = u.fullName || u.name || u.enseigne || 'Client';
      return { id: id, name: name };
    } catch (e) { return null; }
  }

  // Enregistre automatiquement une identité (client connecté ou « invité ») pour
  // que les appels/discussions partent en temps réel vers le prestataire, même
  // sans compte. Sans identité, isReal() reste faux et on bascule en simulation.
  function ensureGuest() {
    if (identity) return identity;
    var stored = readStoredClient();
    if (stored) {
      identity = { role: 'client', id: stored.id, name: stored.name };
    } else {
      identity = {
        role: 'guest',
        id: 'guest-' + Date.now() + '-' + Math.floor(Math.random() * 1e6),
        name: 'Visiteur'
      };
    }
    ensureWS();
    if (ws && ws.readyState === 1) {
      sendWS({ type: 'register', role: identity.role, id: identity.id, name: identity.name });
    }
    return identity;
  }

  /* ------------------------------------------------------------------ *
   *  WebRTC
   * ------------------------------------------------------------------ */
  function getMedia(mode) {
    var constraints = (mode === 'video')
      ? { audio: true, video: { facingMode: 'user' } }
      : { audio: true, video: false };
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      return navigator.mediaDevices.getUserMedia(constraints);
    }
    return Promise.reject(new Error('media indisponible'));
  }

  function createPC() {
    var RTCPC = global.RTCPeerConnection || global.webkitRTCPeerConnection;
    var pc = new RTCPC({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
    pc.onicecandidate = function (e) {
      if (e.candidate && callState.callId) {
        sendWS({ type: 'ice-candidate', callId: callState.callId, candidate: e.candidate });
      }
    };
    pc.ontrack = function (e) {
      if (e.streams && e.streams[0]) {
        var remote = q('[data-mcp="remote"]', callOverlay);
        if (remote) { remote.srcObject = e.streams[0]; remote.classList.add('show'); callState.hasVideo = true; }
      }
    };
    pc.onconnectionstatechange = function () {
      if ((pc.connectionState === 'failed' || pc.connectionState === 'disconnected') && callState.open && callState.connected) {
        setCallState('Connexion perdue');
      }
    };
    return pc;
  }

  function showLocalPreview(stream) {
    if (!stream.getVideoTracks().length) return;
    var local = q('[data-mcp="local"]', callOverlay);
    if (local) { local.srcObject = stream; local.classList.add('show'); }
  }

  function realOutgoingCall(target, mode) {
    getMedia(mode).then(function (stream) {
      if (!callState.open) { stream.getTracks().forEach(function (t) { t.stop(); }); return; }
      callState.stream = stream;
      showLocalPreview(stream);
      var pc = createPC();
      callState.pc = pc;
      stream.getTracks().forEach(function (track) { pc.addTrack(track, stream); });
      pc.createOffer()
        .then(function (offer) { return pc.setLocalDescription(offer); })
        .then(function () {
          setCallState('Sonnerie…');
          startRingback();
          sendWS({ type: 'call-offer', callId: callState.callId, to: targetId(target), mode: mode, sdp: pc.localDescription });
        })
        .catch(function () { simulateConnect(); });
    }).catch(function () {
      // Pas de caméra/micro (HTTP sans HTTPS, ou refus) -> message clair
      mediaFailed();
    });
  }

  function incomingCall(target) {
    primeAudio();
    setCallTarget(target);
    resetVideos();
    q('[data-mcp="timer"]', callOverlay).textContent = '';
    q('[data-mcp="accept"]', callOverlay).style.display = '';
    q('[data-mcp="mute"]', callOverlay).style.display = 'none';
    q('[data-mcp="mute"]', callOverlay).classList.remove('off');
    callState.muted = false;
    callState.incoming = true;
    callState.open = true;
    setCallState('Appel entrant…');
    callOverlay.classList.add('open');
    startIncomingRing();
  }

  function onCallRing(msg) {
    callState.callId = msg.callId;
    callState.incomingSdp = msg.sdp;
    callState.incomingMode = msg.mode || 'audio';
    emit(incomingCallCbs, {
      callId: msg.callId, from: msg.from, fromName: msg.fromName, mode: msg.mode || 'audio',
      accept: function () { acceptIncoming(); },
      reject: function () { rejectIncoming(); }
    });
    incomingCall({ id: msg.from, name: msg.fromName, role: 'peer' });
  }

  function acceptIncoming() {
    stopIncomingRing();
    callState.incoming = false;
    q('[data-mcp="accept"]', callOverlay).style.display = 'none';
    q('[data-mcp="mute"]', callOverlay).style.display = '';
    getMedia(callState.incomingMode).then(function (stream) {
      callState.stream = stream;
      showLocalPreview(stream);
      var pc = createPC();
      callState.pc = pc;
      stream.getTracks().forEach(function (track) { pc.addTrack(track, stream); });
      var RTCSessionDesc = global.RTCSessionDescription || global.webkitRTCSessionDescription;
      pc.setRemoteDescription(new RTCSessionDesc(callState.incomingSdp))
        .then(function () { return pc.createAnswer(); })
        .then(function (answer) { return pc.setLocalDescription(answer); })
        .then(function () {
          sendWS({ type: 'call-answer', callId: callState.callId, sdp: pc.localDescription });
          startTimer();
        })
        .catch(function () { startTimer(); });
    }).catch(function () {
      // Pas de média -> on refuse proprement et on informe l'appelant
      mediaFailed();
      if (callState.callId) sendWS({ type: 'call-reject', callId: callState.callId });
      setTimeout(function () { if (callState.open && !callState.connected) endCall(false); }, 1600);
    });
  }

  function rejectIncoming() {
    stopIncomingRing();
    if (callState.callId) sendWS({ type: 'call-reject', callId: callState.callId });
    endCall(false);
  }

  function onCallAccepted(msg) {
    if (!callState.pc) { startTimer(); return; }
    var RTCSessionDesc = global.RTCSessionDescription || global.webkitRTCSessionDescription;
    if (msg.sdp) {
      callState.pc.setRemoteDescription(new RTCSessionDesc(msg.sdp)).then(function () {
        startTimer();
      }).catch(function () { startTimer(); });
    } else {
      startTimer();
    }
  }

  function onCallRejected(msg) {
    setCallState('Appel refusé');
    setTimeout(function () { if (callState.open && !callState.connected) endCall(false); }, 1200);
  }

  function onCallEndedFromPeer(msg) {
    setCallState('Appel terminé par l’autre partie');
    setTimeout(function () { endCall(false); }, 800);
  }

  function onCallError(msg) {
    stopRingback();
    if (msg.reason === 'offline') setCallState('Utilisateur indisponible');
    else setCallState('Appel impossible');
  }

  function onIce(msg) {
    if (callState.pc && msg.candidate) {
      try {
        var RTCIceCand = global.RTCIceCandidate || global.webkitRTCIceCandidate;
        callState.pc.addIceCandidate(new RTCIceCand(msg.candidate));
      } catch (e) {}
    }
  }

  /* ------------------------------------------------------------------ *
   *  Appel — entrée publique (réel si possible, sinon simulation)
   * ------------------------------------------------------------------ */
  function mediaFailed() {
    stopRingback();
    stopIncomingRing();
    var reason;
    if (global.isSecureContext === false) {
      reason = 'Caméra/micro indisponibles : contexte non sécurisé (HTTP).';
    } else if (!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) {
      reason = 'Caméra/micro non pris en charge par ce navigateur.';
    } else {
      reason = 'Caméra/micro refusées ou indisponibles.';
    }
    setCallState(reason);
    var hint = q('.mcp-hint', callOverlay);
    if (hint) hint.textContent = 'Utilisez HTTPS (https://…:8443) et autorisez la caméra/micro.';
  }

  function simulateConnect() {
    if (callState.connected) return;
    setCallState('Sonnerie…');
    startRingback();
    setTimeout(function () {
      if (!callState.open) return;
      startTimer();
    }, 1200);
  }

  function simulateIncomingAccept() {
    callState.incoming = false;
    stopIncomingRing();
    startTimer();
  }

  /* ------------------------------------------------------------------ *
   *  Conversation (chat)
   * ------------------------------------------------------------------ */
  var chatTarget = null;
  // Certaines pages gèrent elles-mêmes l'affichage des messages (ex. chat.html
  // avec son propre fil). Elles désactivent l'ouverture automatique de l'overlay
  // pour éviter le double affichage (page de chat + mini-chat Connect+).
  var suppressAutoOpen = false;

  function appendMsg(kind, text) {
    var body = q('[data-mcp="body"]', chatEl);
    if (!body) return;
    var el = document.createElement('div');
    el.className = 'mcp-msg ' + kind;
    el.textContent = text;
    body.appendChild(el);
    body.scrollTop = body.scrollHeight;
  }

  function openChat(target) {
    // Le mini-chat a pu être retiré du DOM (disableAutoOpenChat sur chat.html) :
    // dans ce cas on ne fait rien, la page gère son propre fil.
    if (!chatEl || !chatEl.parentNode) return;
    ensureGuest();
    chatTarget = target;
    q('[data-mcp="avatar"]', chatEl).textContent = initials(target && target.name);
    q('[data-mcp="name"]', chatEl).textContent = target && target.name ? target.name : '—';
    var body = q('[data-mcp="body"]', chatEl);
    body.innerHTML = '';
    appendMsg('sys', isReal() ? 'Conversation en temps réel (Mangoo Connect+)' : 'Messages chiffrés de bout en bout via Mangoo Connect+');
    if (!isReal() && target && target.name) {
      setTimeout(function () {
        appendMsg('in', 'Bonjour 👋, je suis ' + target.name + '. Comment puis-je vous aider ?');
      }, 350);
    }
    chatEl.classList.add('open');
    var input = q('[data-mcp="input"]', chatEl);
    if (input) setTimeout(function () { input.focus(); }, 250);
  }

  function sendChat() {
    var input = q('[data-mcp="input"]', chatEl);
    var text = input && input.value.trim();
    if (!text) return;
    input.value = '';
    appendMsg('out', text);
    if (chatTarget && targetId(chatTarget)) {
      // Même file d'attente que l'API publique (sendMessage) : le message est
      // émis dès que l'identité WS est enregistrée, au lieu d'être abandonné
      // si l'enregistrement n'est pas encore terminé.
      enqueueOutbox(function () {
        sendWS({ type: 'chat-message', to: targetId(chatTarget), text: text });
      });
    } else if (chatTarget && chatTarget.name) {
      setTimeout(function () {
        if (!chatTarget) return;
        appendMsg('in', 'Merci pour votre message ! Je vous réponds tout de suite. — ' + chatTarget.name);
      }, 850);
    }
  }

  function onChatNew(msg) {
    var text = String(msg.text || '');
    emit(messageCbs, { from: msg.from, fromName: msg.fromName, text: text, sentAt: msg.sentAt });
    if (!text) return;
    var isCurrent = chatTarget && targetId(chatTarget) === String(msg.from || '');
    if (chatEl.classList.contains('open') && isCurrent) {
      appendMsg('in', text);
      return;
    }
    // Les pages qui affichent déjà leur propre fil (ex. chat.html) désactivent
    // l'ouverture automatique de cet overlay pour éviter le double affichage.
    if (suppressAutoOpen) return;
    // Messagerie pro↔pro : si un message arrive d'un pair alors que la
    // discussion n'est pas ouverte (ou pas sur ce pair), on l'ouvre pour
    // afficher le texte immédiatement au lieu de le laisser « invisible ».
    openChat({ vendorId: msg.from, id: msg.from, name: msg.fromName || msg.from });
    appendMsg('in', text);
  }

  /* Indicateur « en train d'écrire » côté discussion (overlay). */
  var typingTimers = {};
  function showChatTyping(name) {
    var el = q('[data-mcp="typing"]', chatEl);
    var nameEl = q('[data-mcp="typing-name"]', chatEl);
    if (el) el.style.display = 'flex';
    if (nameEl) nameEl.textContent = (name || 'Quelqu\'un') + ' est en train d\'écrire…';
  }
  function hideChatTyping() {
    var el = q('[data-mcp="typing"]', chatEl);
    if (el) el.style.display = 'none';
  }
  function onTypingInternal(msg) {
    var from = String(msg.from || '');
    var isTyping = !!msg.isTyping;
    if (typingTimers[from]) { clearTimeout(typingTimers[from]); delete typingTimers[from]; }
    var isCurrent = chatTarget && targetId(chatTarget) === from;
    if (!isTyping) { if (isCurrent) hideChatTyping(); return; }
    if (isCurrent) showChatTyping(msg.fromName || '');
    typingTimers[from] = setTimeout(function () {
      delete typingTimers[from];
      if (chatTarget && targetId(chatTarget) === from) hideChatTyping();
    }, 3000);
  }

  /* ------------------------------------------------------------------ *
   *  Transfert de fichiers (pièces jointes)
   * ------------------------------------------------------------------ */
  var fileIncoming = {};   // fileId -> { name, size, mime, chunks[], received, from, fromName }
  var currentFileId = null; // fichier en cours de réception sur cette connexion

  function onFileStart(msg) {
    currentFileId = msg.fileId;
    fileIncoming[msg.fileId] = {
      name: msg.name, size: msg.size, mime: msg.mime,
      chunks: [], received: 0,
      from: msg.from, fromName: msg.fromName
    };
  }

  function onFileChunk(fileId, buf) {
    if (!fileId) return;
    var f = fileIncoming[fileId];
    if (!f) return;
    f.chunks.push(buf);
    f.received += buf.byteLength;
    var pct = f.size ? Math.min(100, Math.round((f.received / f.size) * 100)) : 0;
    emit(fileProgressCbs, { fileId: fileId, received: f.received, size: f.size, pct: pct });
  }

  function onFileEnd(msg) {
    var f = fileIncoming[msg.fileId];
    if (!f) return;
    var blob = new Blob(f.chunks, { type: f.mime || 'application/octet-stream' });
    delete fileIncoming[msg.fileId];
    currentFileId = null;
    emit(fileCbs, {
      fileId: msg.fileId,
      from: f.from, fromName: f.fromName,
      name: f.name, size: f.received, mime: f.mime,
      blob: blob
    });
  }

  function sendFile(to, file) {
    if (!file) return false;
    var fileId = 'file-' + Date.now() + '-' + Math.floor(Math.random() * 1e4);
    var name = file.name || 'fichier';
    var size = file.size || 0;
    var mime = file.type || 'application/octet-stream';
    var CHUNK = 256 * 1024;
    // L'envoi démarre dès que l'identité WS est enregistrée (isReal) : mis en file
    // sinon, pour que les pièces jointes partent même si l'utilisateur joint un
    // fichier avant la fin de l'enregistrement.
    enqueueOutbox(function () {
      sendWS({ type: 'file-start', fileId: fileId, to: to, name: name, size: size, mime: mime });
      emit(fileSendProgressCbs, { fileId: fileId, name: name, sent: 0, size: size, pct: 0 });
      var offset = 0;
      (function next() {
        var blob = file.slice(offset, offset + CHUNK);
        var p = (typeof blob.arrayBuffer === 'function') ? blob.arrayBuffer() : null;
        if (!p) { sendWS({ type: 'file-end', fileId: fileId }); emit(fileSendProgressCbs, { fileId: fileId, name: name, sent: size, size: size, pct: 100, done: true }); return; }
        p.then(function (buf) {
          if (ws && ws.readyState === 1) { try { ws.send(buf); } catch (e) {} }
          offset += buf.byteLength;
          var pct = size ? Math.min(100, Math.round((offset / size) * 100)) : 100;
          if (offset < size) {
            emit(fileSendProgressCbs, { fileId: fileId, name: name, sent: offset, size: size, pct: pct });
            next();
          } else {
            sendWS({ type: 'file-end', fileId: fileId });
            emit(fileSendProgressCbs, { fileId: fileId, name: name, sent: size, size: size, pct: 100, done: true });
          }
        }).catch(function () {});
      })();
    });
    return fileId;
  }

  /* ------------------------------------------------------------------ *
   *  Itinéraire
   * ------------------------------------------------------------------ */
  function navigate(target) {
    if (!target) return;
    if (target.lat != null && target.lng != null) {
      var url = 'https://www.openstreetmap.org/directions?from=&to=' +
        encodeURIComponent(target.lat + ',' + target.lng) +
        '#map=15/' + target.lat + '/' + target.lng;
      global.open(url, '_blank', 'noopener');
      return;
    }
    if (target.address) {
      global.open('https://www.openstreetmap.org/search?query=' + encodeURIComponent(target.address), '_blank', 'noopener');
    }
  }

  /* ------------------------------------------------------------------ *
   *  Événements
   * ------------------------------------------------------------------ */
  q('[data-mcp="end"]', callOverlay).addEventListener('click', function () {
    if (callState.callId && isReal()) sendWS({ type: 'call-end', callId: callState.callId });
    if (callState.incoming && callState.callId && isReal()) sendWS({ type: 'call-reject', callId: callState.callId });
    endCall(false);
  });
  q('[data-mcp="mute"]', callOverlay).addEventListener('click', function () {
    callState.muted = !callState.muted;
    this.classList.toggle('off', callState.muted);
    if (callState.stream) {
      callState.stream.getAudioTracks().forEach(function (t) { t.enabled = !callState.muted; });
    }
  });
  q('[data-mcp="accept"]', callOverlay).addEventListener('click', function () {
    if (isReal() && callState.callId) { acceptIncoming(); }
    else { simulateIncomingAccept(); }
  });
  q('[data-mcp="close"]', chatEl).addEventListener('click', function () {
    chatEl.classList.remove('open');
    hideChatTyping();
  });
  q('[data-mcp="send"]', chatEl).addEventListener('click', sendChat);
  q('[data-mcp="input"]', chatEl).addEventListener('keydown', function (e) {
    if (e.key === 'Enter') sendChat();
  });
  // Indicateur de frappe sortant (messagerie pro↔pro) : notifie le pair.
  var chatTypingTimer = null;
  var chatTypingSentAt = 0;
  q('[data-mcp="input"]', chatEl).addEventListener('input', function () {
    var to = chatTarget ? targetId(chatTarget) : '';
    if (!to || !isReal()) return;
    if (chatTypingTimer) { clearTimeout(chatTypingTimer); chatTypingTimer = null; }
    var now = Date.now();
    if (now - chatTypingSentAt > 2000) {
      chatTypingSentAt = now;
      sendWS({ type: 'typing', to: to, isTyping: true });
    }
    chatTypingTimer = setTimeout(function () {
      sendWS({ type: 'typing', to: to, isTyping: false });
    }, 2500);
  });

  /* ------------------------------------------------------------------ *
   *  API publique
   * ------------------------------------------------------------------ */
  var api = {
    /* Identité / présence */
    register: function (role, id, name) {
      identity = { role: role || 'client', id: String(id || ''), name: name || id || '' };
      ensureWS();
      // Si déjà connecté, on enregistre immédiatement ; sinon l'événement
      // onopen de ensureWS() s'en charge (il appelle setConnState('online')
      // puis envoie le register). Ne pas écraser onopen ici.
      if (ws && ws.readyState === 1) {
        sendWS({ type: 'register', role: identity.role, id: identity.id, name: identity.name });
      }
      return identity;
    },
    identity: function () { return identity; },
    isReal: isReal,
    canVideo: function () {
      return !!(global.isSecureContext && navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    },
    status: function () { return connState; },
    onStatus: function (cb) { statusCbs.push(cb); },
    onPresence: function (cb) { presenceCbs.push(cb); },
    onMessage: function (cb) { messageCbs.push(cb); },
    // Désactive l'ouverture automatique de l'overlay de discussion lors de
    // l'arrivée d'un message. À utiliser par les pages qui affichent déjà le
    // fil elles-mêmes (ex. chat.html) pour éviter un double affichage.
    disableAutoOpenChat: function () {
      suppressAutoOpen = true;
      // Les pages qui affichent déjà leur propre fil (ex. chat.html) appellent
      // cette méthode : le mini-chat Connect+ est alors redondant. On le retire
      // complètement du DOM (et pas seulement son auto-ouverture) pour qu'il ne
      // s'affiche jamais en double à côté de la grande page de chat.
      if (chatEl && chatEl.parentNode) { chatEl.parentNode.removeChild(chatEl); }
    },
    onTyping: function (cb) { typingCbs.push(cb); },
    onLive: function (cb) { liveCbs.push(cb); },
    onIncomingCall: function (cb) { incomingCallCbs.push(cb); },
    onCallEnded: function (cb) { callEndedCbs.push(cb); },
    onAppointment: function (cb) { appointmentCbs.push(cb); },
    onAppointmentReply: function (cb) { appointmentReplyCbs.push(cb); },
    onFile: function (cb) { fileCbs.push(cb); },
    onFileProgress: function (cb) { fileProgressCbs.push(cb); },
    onFileSendProgress: function (cb) { fileSendProgressCbs.push(cb); },
    sendMessage: function (to, text) {
      var payload = { type: 'chat-message', to: to, text: String(text || '') };
      return enqueueOutbox(function () { sendWS(payload); });
    },
    sendTyping: function (to, isTyping) {
      if (!to) return false;
      // Aligné sur sendMessage/sendFile : passe par la file d'attente pour que
      // l'indicateur de frappe parte même si l'enregistrement WS n'est pas encore
      // terminé (sinon sendWS renvoie false et la frappe est silencieusement perdue).
      return enqueueOutbox(function () {
        sendWS({ type: 'typing', to: to, isTyping: !!isTyping });
      });
    },
    sendFile: function (to, file) {
      return sendFile(to, file);
    },
    sendAppointment: function (to, data) {
      var payload = {
        type: 'appointment-request', to: to,
        service: data && data.service, day: data && data.day,
        time: data && data.time, note: data && data.note
      };
      return enqueueOutbox(function () { sendWS(payload); });
    },
    replyAppointment: function (apptId, accept) {
      if (isReal() && apptId) {
        return sendWS({ type: accept ? 'appointment-confirm' : 'appointment-decline', apptId: apptId });
      }
      return false;
    },

    /* Appels */
    call: function (target, opts) {
      primeAudio();
      ensureGuest();
      setCallTarget(target);
      resetVideos();
      q('[data-mcp="timer"]', callOverlay).textContent = '';
      q('[data-mcp="accept"]', callOverlay).style.display = 'none';
      q('[data-mcp="mute"]', callOverlay).style.display = '';
      q('[data-mcp="mute"]', callOverlay).classList.remove('off');
      callState.muted = false;
      callState.incoming = false;
      callState.callId = (opts && opts.callId) || 'call-' + Date.now() + '-' + Math.floor(Math.random() * 1e4);
      stopIncomingRing();
      setCallState('Connexion…');
      callOverlay.classList.add('open');
      callState.open = true;
      var mode = (opts && opts.mode) || 'audio';
      var toId = targetId(target);
      function proceed() {
        if (isReal() && toId) {
          realOutgoingCall(target, mode);
        } else {
          simulateConnect();
        }
      }
      if (isReal()) {
        proceed();
      } else {
        // Laisse le temps à l'enregistrement (invité/client) de monter en
        // temps réel avant de placer l'appel ; sinon repli en simulation.
        var waited = 0;
        var t = setInterval(function () {
          waited += 100;
          if (isReal() || waited >= 3000) { clearInterval(t); proceed(); }
        }, 100);
      }
    },
    incomingCall: incomingCall,
    simulateOutgoingCall: function (target) {
      primeAudio();
      clearSimTimers();
      setCallTarget(target);
      resetVideos();
      q('[data-mcp="timer"]', callOverlay).textContent = '';
      q('[data-mcp="accept"]', callOverlay).style.display = 'none';
      q('[data-mcp="mute"]', callOverlay).style.display = '';
      q('[data-mcp="mute"]', callOverlay).classList.remove('off');
      callState.muted = false;
      callState.incoming = false;
      callState.open = true;
      stopIncomingRing();
      setCallState('Sonnerie…');
      callOverlay.classList.add('open');
      startRingback();
      callState.simTimers.push(setTimeout(function () {
        if (!callState.open) return;
        startTimer();
      }, 2000));
      callState.simTimers.push(setTimeout(function () {
        if (!callState.open) return;
        setCallState('Appel terminé par le client');
        endCall(false);
      }, 7000));
    },

    /* Divers */
    chat: openChat,
    navigate: navigate,
    endCall: function () { endCall(true); },
    hangup: function () { endCall(true); },
    isOpen: function () { return callState.open; },
    isMuted: function () { return callState.muted; }
  };

  global.MangooConnect = api;

  /* ------------------------------------------------------------------ *
   *  Notifications Web Push — abonnement silencieux
   * ------------------------------------------------------------------ *
   * Charge le module d'abonnement push puis, si la permission est déjà
   * accordée, re-synchronise l'abonnement auprès du serveur. Aucun prompt
   * n'est affiché ici : la demande de permission est déclenchée par un
   * geste explicite (bouton « Activer les notifications »).
   * ------------------------------------------------------------------ */
  (function ensurePush() {
    if (!global.MangooPush) {
      try {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', '/assets/mangoo-push.js', false);
        xhr.send(null);
        if (xhr.status >= 200 && xhr.status < 300) (0, eval)(xhr.responseText);
      } catch (e) { /* non bloquant */ }
    }
    if (global.MangooPush && global.MangooPush.autoSubscribe) {
      global.MangooPush.autoSubscribe();
    }
  })();

  /* ------------------------------------------------------------------ *
   *  Mangoo Express+ — taxonomie des types de livraison
   * ------------------------------------------------------------------ */
  global.MangooExpress = {
    TYPES: {
      nourriture: { label: 'Nourriture', vehicle: 'Moto' },
      produits:   { label: 'Colis & produits', vehicle: 'Van' },
      materiaux:  { label: 'Ciment & matériaux', vehicle: 'Camion' },
      agricole:   { label: 'Agricole', vehicle: 'Camion' },
      vrac:       { label: 'Vrac & agrégats', vehicle: 'Camion' }
    },
    fromCategory: function (category) {
      switch (String(category || '').toLowerCase()) {
        case 'restaurant': return 'nourriture';
        case 'salon':
        case 'artisan':
        case 'service':
        case 'boutique': return 'produits';
        case 'construction': return 'materiaux';
        case 'agriculture': return 'agricole';
        case 'vrac': return 'vrac';
        default: return 'produits';
      }
    },
    typeLabel: function (type) {
      var t = this.TYPES[type];
      return t ? t.label : 'Colis & produits';
    },
    vehicleLabel: function (type) {
      var t = this.TYPES[type];
      return t ? t.vehicle : 'Van';
    },
    badge: function (type) {
      var t = this.TYPES[type] || this.TYPES.produits;
      var vehicleIcon =
        t.vehicle === 'Moto'
          ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19a2 2 0 1 0 4 0 2 2 0 0 0-4 0Z"/><path d="M16 19a2 2 0 1 0 4 0 2 2 0 0 0-4 0Z"/><path d="M8 19h8"/><path d="M5 19V9l3-4h6l3 4v10"/><path d="M8 12h8"/></svg>'
          : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 5h13v10H1z"/><path d="M14 8h4l4 4v3h-8z"/><circle cx="6" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>';
      return '<span class="mcp-delivery-badge">' + vehicleIcon +
        'Mangoo Express+ · ' + t.label + ' · ' + t.vehicle + '</span>';
    }
  };

  /* ------------------------------------------------------------------ *
   *  Bandeau « Live en cours » (pages publiques / client)
   * ------------------------------------------------------------------ *
   *  Affiche une pastille flottante « En direct · Rejoindre » sur les pages
   *  clients (accueil, carte, fiche, boutique…) dès qu'un Live Shopping est
   *  actif, pour qu'un client sache qu'un direct est en cours sans passer par
   *  le Dashboard. Réagit aux événements WS (onLive, instantané) et se
   *  ré-appuie sur un sondage /live-status toutes les 15 s en filet de
   *  sécurité (pages sans WebSocket déjà ouvert).
   */
  function injectLiveBanner() {
    var filename = (location.pathname.split('/').pop() || '').toLowerCase();
    if (!filename) return;
    // Pages de diffusion / visionnage du direct : le bandeau « Rejoindre » n'y a
    // pas sa place (on est déjà dans le live).
    if (filename === 'live-client.html' || filename === 'live-shopping.html' || filename === 'live-vendor.html') return;
    // Dashboards pro (dashboard-*.html) : le pro a déjà, dans sa sidebar, les
    // deux entrées « Live » (lancer son propre live) et « Lives en direct »
    // (voir les autres). Le bandeau « Rejoindre » est réservé aux pages
    // publiques / clients, sinon il détourne le vendeur vers le live d'un autre
    // et l'empêche de lancer le sien.
    if (filename.indexOf('dashboard-') === 0) return;

    var pagesBase = location.pathname.indexOf('/pages/') >= 0 ? './' : 'pages/';

    var style = document.createElement('style');
    style.textContent =
      '@keyframes mgt-live-dot{0%,100%{opacity:1}50%{opacity:.25}}' +
      '@keyframes mgt-live-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}';
    document.head.appendChild(style);

    var el = document.createElement('a');
    el.id = 'mgt-live-banner';
    el.href = pagesBase + 'live-client.html';
    el.setAttribute('aria-label', 'Rejoindre le live en cours');
    el.style.cssText =
      'position:fixed;top:16px;right:16px;z-index:9999;display:none;' +
      'align-items:center;gap:7px;padding:8px 14px;border-radius:9999px;' +
      'background:#ef4444;color:#fff;font-weight:600;font-size:13px;line-height:1;' +
      'box-shadow:0 4px 14px rgba(0,0,0,.18);text-decoration:none;' +
      'font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;';
    el.innerHTML = '<span style="width:8px;height:8px;border-radius:50%;background:#fff;animation:mgt-live-dot 1.6s infinite;flex-shrink:0;"></span><span id="mgt-live-banner-label">En direct</span>';
    document.body.appendChild(el);

    function myVendorId() {
      try {
        if (global.MangooVendor && typeof global.MangooVendor.connectedVendorId === 'function') {
          return String(global.MangooVendor.connectedVendorId() || '');
        }
      } catch (e) { /* ignore */ }
      return '';
    }
    function myName() {
      try {
        var v = global.MangooVendor ? global.MangooVendor.current() : null;
        return v ? (v.name || '') : '';
      } catch (e) { return ''; }
    }

    function apply(st) {
      var active = !!(st && st.active);
      var rooms = (st && Array.isArray(st.rooms)) ? st.rooms : [];
      var liveVendorId = String((st && st.vendorId) || '');
      var label = document.getElementById('mgt-live-banner-label');

      // Un seul live actif, et c'est le nôtre : on ne montre pas le bandeau.
      if (rooms.length <= 1 && liveVendorId && myVendorId() && liveVendorId === myVendorId()) {
        el.style.display = 'none';
        return;
      }
      if (!active) { el.style.display = 'none'; return; }

      // Plusieurs lives simultanés : on renvoie vers la liste « Lives en
      // direct » pour que le client CHOISISSE lequel rejoindre, au lieu de
      // l'envoyer aveuglément vers un seul direct.
      if (rooms.length > 1) {
        if (label) label.textContent = rooms.length + ' lives en direct';
        el.href = pagesBase + 'lives-en-direct.html';
        el.style.display = 'inline-flex';
        return;
      }

      // Un seul live : redirection directe vers la salle du vendeur.
      if (label) label.textContent = 'En direct · Rejoindre';
      var c = readStoredClient();
      if (c && c.id) {
        el.href = pagesBase + 'live-client.html?id=' + encodeURIComponent(c.id) + '&name=' + encodeURIComponent(c.name || '');
      } else if (myVendorId()) {
        el.href = pagesBase + 'live-client.html?id=' + encodeURIComponent(myVendorId()) + '&name=' + encodeURIComponent(myName() || '');
      } else {
        el.href = pagesBase + 'live-client.html';
      }
      el.style.display = 'inline-flex';
    }

    // 1) Instantané via le WebSocket (pages déjà connectées via MangooConnect).
    api.onLive(apply);

    // 2) Filet de sécurité : sondage /live-status rapproché (2 s) + re-sondage
    //    immédiat quand l'onglet redevient visible.
    function poll() {
      fetch('/live-status', { cache: 'no-store' })
        .then(function (r) { return r.json(); })
        .then(function (d) { apply({ active: !!(d && d.active), vendorId: (d && d.vendorId) || '', rooms: (d && d.rooms) || [] }); })
        .catch(function () { /* ignore */ });
    }
    poll();
    setInterval(poll, 2000);
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) poll();
    });
    window.addEventListener('focus', poll);
  }

  // Auto-enregistrement du client connecté sur toutes les pages qui chargent ce
  // module. Sans cela, un client (Dida) naviguant hors de chat.html n'est pas
  // inscrit côté WebSocket et le professionnel (DAN) ne peut pas le joindre en
  // temps réel : le message ou l'appel tomberait en Web Push ou serait ignoré.
  // Le prestataire est, lui, auto-enregistré par mangoo-dashboard-shell via
  // MangooVendor.registerRT(). Ici on ne crée PAS de connexion « guest » pour les
  // visiteurs anonymes : on n'enregistre que le client réellement connecté.
  (function autoRegisterClient() {
    var stored = readStoredClient();
    if (!stored || !stored.id) return; // visiteur anonyme
    if (identity && identity.id === stored.id) return; // déjà enregistré
    try {
      api.register('client', stored.id, stored.name);
    } catch (e) { /* non bloquant */ }
  })();

  // Charge et auto-abonne le module Web Push sur TOUTES les pages qui chargent
  // ce module (chat, accueil, carte, fiche-boutique, checkout...), pas seulement
  // les pages dotées d'un shell. Indispensable pour le scénario « dashboard
  // fermé » : l'abonnement doit exister dès la navigation, sinon
  // subscriptionsTotal reste à 0 côté serveur. Auto-abonnement silencieux :
  // il ne s'exécute que si la permission est déjà « granted » (sinon, le bandeau
  // « Activer » de mangoo-push.js prend le relais via un geste utilisateur).
  (function ensurePush() {
    if (global.MangooPush) return;
    try {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', '/assets/mangoo-push.js', false);
      xhr.send(null);
      if (xhr.status >= 200 && xhr.status < 300) {
        (0, eval)(xhr.responseText);
      }
    } catch (e) { /* non bloquant */ }
    if (global.MangooPush && global.MangooPush.autoSubscribe) {
      global.MangooPush.autoSubscribe();
    }
  })();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectLiveBanner);
  } else {
    injectLiveBanner();
  }
})(window);
