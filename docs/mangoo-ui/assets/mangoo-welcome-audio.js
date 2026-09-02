/* =========================================================================
   Mangoo Welcome Audio — message vocal de bienvenue (enregistrement + lecture)
   -------------------------------------------------------------------------
   Permet à un prestataire / vendeur :
     - d'enregistrer son propre message de bienvenue au micro (téléphone ou PC),
     - de le réécouter et de le supprimer,
     - et, à défaut d'enregistrement, de lire un message par défaut (synthèse
       vocale fr-FR) qui complète la description écrite.

   Stockage : localStorage (prototype). En production, le blob serait uploadé
   sur le serveur (ex. /welcome-audio) et un délai d'expiration déclencherait
   la suppression automatique pour maîtriser les coûts de stockage.

   Expose window.MangooWelcomeAudio :
     supported(), hasRecording(id), getRecording(id), getTranscript(id),
     saveRecording(id, dataUrl, mime, text), removeRecording(id), migrate(from, to),
     play(id, defaultText, opts), speak(text, opts), stop(),
     recorder(id, opts)
   ========================================================================= */
(function (global) {
  'use strict';

  if (global.MangooWelcomeAudio) return;

  var STORE_KEY = 'mgt_welcome_audio_v1';

  // Durée maximale d'un enregistrement de badge (message Promotion / Nouveau).
  // Évite les fichiers trop volumineux et cadence le discours ; l'enregistreur
  // s'arrête automatiquement à ce seuil.
  var MAX_BADGE_MS = 30000;

  /* ---- Clés d'enregistrement ---- */
  // Les badges sont stockés par vendeur + type de badge (promo / new), de sorte
  // que l'enregistrement de DAN Coiffure ne soit jamais lu pour DAN Boutique, et
  // que « Promotion » et « Nouveau » restent indépendants.
  function badgeKey(vendorId, badgeType) {
    return (vendorId || 'vendor') + '::badge::' + (badgeType || '');
  }

  /* ---- Persistance locale (prototype) ---- */
  function readStore() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY) || '{}'); } catch (e) { return {}; }
  }
  function writeStore(s) {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(s)); } catch (e) {}
  }

  // Données servies par le serveur (source de vérité). La transcription et
  // l'audio de bienvenue sont persistés dans vendor-config.json (welcomeAudio).
  // Les fiches publiques les reçoivent via /api/vendor-config et les hydratent
  // ici afin que lecture et transcription correspondent au message réellement
  // enregistré par le prestataire, quel que soit l'appareil du visiteur.
  var serverStore = {};

  function hydrate(vendorId, recording) {
    if (!vendorId) return;
    if (recording && (recording.dataUrl || recording.text)) {
      serverStore[vendorId] = {
        dataUrl: recording.dataUrl || '',
        mime: recording.mime || 'audio/webm',
        text: recording.text || '',
        updatedAt: recording.updatedAt || null
      };
    } else {
      delete serverStore[vendorId];
    }
  }

  function supported() {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);
  }

  function hasRecording(vendorId) {
    var rec = getRecording(vendorId);
    return !!(rec && rec.dataUrl);
  }

  function getRecording(vendorId) {
    if (serverStore[vendorId]) return serverStore[vendorId];
    var s = readStore();
    return s[vendorId] || null;
  }

  function getTranscript(vendorId) {
    var rec = getRecording(vendorId);
    return (rec && rec.text) ? rec.text : '';
  }

  // Migre un enregistrement provisoire (ex. `reg_pending` avant attribution du
  // vendorId) vers son identifiant definitif. Ne remplace jamais un
  // enregistrement deja present cote cible.
  function migrate(fromId, toId) {
    if (!fromId || !toId || fromId === toId) return;
    var s = readStore();
    if (!s[fromId]) return;
    if (!s[toId] || !s[toId].dataUrl) s[toId] = s[fromId];
    delete s[fromId];
    writeStore(s);
  }

  function saveRecording(vendorId, dataUrl, mime, text) {
    var s = readStore();
    s[vendorId] = { dataUrl: dataUrl, mime: mime || 'audio/webm', size: dataUrl.length, text: text || '', updatedAt: Date.now() };
    writeStore(s);
  }

  function removeRecording(vendorId) {
    var s = readStore();
    delete s[vendorId];
    writeStore(s);
  }

  /* ---- Lecture ---- */
  var currentAudio = null;

  function stop() {
    if (currentAudio) {
      try { currentAudio.pause(); currentAudio.currentTime = 0; } catch (e) {}
      currentAudio = null;
    }
    if ('speechSynthesis' in window) { try { window.speechSynthesis.cancel(); } catch (e) {} }
  }

  function playDataUrl(dataUrl, opts) {
    stop();
    var a = new Audio(dataUrl);
    currentAudio = a;
    a.onended = function () { currentAudio = null; if (opts && opts.onEnd) opts.onEnd(); };
    a.onerror = function () { currentAudio = null; if (opts && opts.onError) opts.onError(); };
    if (opts && opts.onStart) opts.onStart();
    a.play().catch(function () {});
    return a;
  }

  function speak(text, opts) {
    stop();
    if (!('speechSynthesis' in window)) { if (opts && opts.onError) opts.onError(); return null; }
    var u = new SpeechSynthesisUtterance(text || '');
    u.lang = 'fr-FR';
    u.rate = 0.95;
    u.onend = function () { if (opts && opts.onEnd) opts.onEnd(); };
    u.onerror = function () { if (opts && opts.onError) opts.onError(); };
    if (opts && opts.onStart) opts.onStart();
    window.speechSynthesis.speak(u);
    return u;
  }

  // Lecture unifiée : enregistrement réel si présent, sinon message par défaut.
  function play(vendorId, defaultText, opts) {
    var rec = getRecording(vendorId);
    if (rec && rec.dataUrl) return playDataUrl(rec.dataUrl, opts);
    return speak(defaultText, opts);
  }

  // Lecture d'un badge (Promotion / Nouveau) : enregistrement personnalisé s'il
  // existe pour ce vendeur + ce type, sinon le texte par défaut (synthèse fr-FR).
  function playBadge(vendorId, badgeType, defaultText, opts) {
    return play(badgeKey(vendorId, badgeType), defaultText, opts);
  }

  /* ---- Enregistrement ---- */
  function pickMime() {
    var candidates = ['audio/webm', 'audio/mp4', 'audio/ogg'];
    if (!window.MediaRecorder) return '';
    for (var i = 0; i < candidates.length; i++) {
      if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(candidates[i])) return candidates[i];
    }
    return '';
  }

  function recorder(vendorId, opts) {
    var maxMs = (opts && opts.maxMs) ? Number(opts.maxMs) : 0;
    var state = {
      recording: false,
      mediaStream: null,
      mediaRecorder: null,
      chunks: [],
      onState: opts && opts.onState,
      autoStopTimer: null
    };

    function emit(on) { state.recording = on; if (state.onState) state.onState(on); }
    function stopStream() {
      if (state.mediaStream) {
        try { state.mediaStream.getTracks().forEach(function (t) { t.stop(); }); } catch (e) {}
        state.mediaStream = null;
      }
    }
    function clearAutoStop() {
      if (state.autoStopTimer) { clearTimeout(state.autoStopTimer); state.autoStopTimer = null; }
    }

    state.start = function () {
      if (state.recording) return;
      var mime = pickMime();
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(function (stream) {
          state.mediaStream = stream;
          var mr = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
          state.mediaRecorder = mr;
          state.chunks = [];
          mr.ondataavailable = function (e) { if (e.data && e.data.size > 0) state.chunks.push(e.data); };
          mr.onstop = function () {
            clearAutoStop();
            var type = (mr.mimeType || mime || 'audio/webm');
            var blob = new Blob(state.chunks, { type: type });
            var reader = new FileReader();
            reader.onloadend = function () {
              saveRecording(vendorId, reader.result, type);
              stopStream();
              if (opts && opts.onSaved) opts.onSaved(reader.result, type);
            };
            reader.readAsDataURL(blob);
          };
          mr.start();
          emit(true);
          if (opts && opts.onStart) opts.onStart();
          // Auto-arrêt : limite la durée pour éviter les enregistrements trop longs.
          if (maxMs > 0) {
            state.autoStopTimer = setTimeout(function () {
              if (state.recording) state.stop();
            }, maxMs);
          }
        })
        .catch(function (err) { if (opts && opts.onError) opts.onError(err); });
    };

    state.stop = function () {
      clearAutoStop();
      if (!state.recording) return;
      try { state.mediaRecorder.stop(); } catch (e) {}
      emit(false);
      if (opts && opts.onStop) opts.onStop();
    };

    state.cancel = function () {
      clearAutoStop();
      if (state.recording) { try { state.mediaRecorder.stop(); } catch (e) {} emit(false); }
      stopStream();
      if (opts && opts.onCancel) opts.onCancel();
    };

    return state;
  }

  global.MangooWelcomeAudio = {
    supported: supported,
    hasRecording: hasRecording,
    getRecording: getRecording,
    getTranscript: getTranscript,
    hydrate: hydrate,
    saveRecording: saveRecording,
    removeRecording: removeRecording,
    migrate: migrate,
    play: play,
    playBadge: playBadge,
    badgeKey: badgeKey,
    MAX_BADGE_MS: MAX_BADGE_MS,
    speak: speak,
    stop: stop,
    recorder: recorder
  };
})(window);
