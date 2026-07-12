// Serveur WebSocket WebRTC pour MangooTech - Port 3008
// Avec tracking presence, push notifications et verification horaires
import http from 'http';
import WebSocket, { WebSocketServer } from 'ws';
import fs from 'fs';
import path from 'path';
import webpush from 'web-push';
import { saveSubscription, removeSubscription, getSubscriptions } from './webrtc-push-store.js';

// Configuration VAPID pour Web Push
const VAPID_KEYS = {
  publicKey: 'BOZ9Fe4c0vpE7UiBnhWUX62s5shdFTJngzG1PoO2RKqNH02N-XSugmasWvcAOjo7RrNBQZqHgPbgzJo_FnQlyPs',
  privateKey: 'jyg4ZLempjREByaxLglNq4szkouwv5hK7F8Li-6XXQg'
};
const VAPID_SUBJECT = 'mailto:contact@mangootech.com';

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_KEYS.publicKey, VAPID_KEYS.privateKey);

const server = http.createServer();
const wss = new WebSocketServer({ server });

// Stockage des rooms et utilisateurs
const rooms = new Map();
const users = new Map();

// Stockage des offres en attente pour le replay (scenario push : le vendeur rejoint apres l'offre)
// Map: roomId -> { offer, fromLabel, callId, callMode, from, timestamp }
const pendingOffers = new Map();

// Stockage des sessions d'appel actives: roomId -> WebSocket du client appelant
// Permet d'envoyer call-accepted / call-ended directement au client
const callSessions = new Map();

// ===== PRESENCE TRACKING =====
// Map: vendorId -> { ws, userId, connectedAt, lastPing }
const vendorPresence = new Map();

// ===== ANTI-DUPLICATION PUSH =====
// Empeche l'envoi de push multiples pour le meme appel
const recentPushCallIds = new Map(); // callId -> timestamp
const PUSH_DEDUP_WINDOW = 60000; // 60 secondes
const recentPushMessageIds = new Map(); // messageId -> timestamp
const MESSAGE_PUSH_DEDUP_WINDOW = 60000; // 60 secondes

// ===== HORAIRES D'OUVERTURE =====
// Charge les horaires depuis le fichier de donnees local
const localSyncPath = path.join(process.cwd(), 'server', 'data', 'local-sync.json');
const chatStorePath = path.join(process.cwd(), 'server', 'data', 'connect-plus-chat-store.json');

function loadVendorData() {
  try {
    if (!fs.existsSync(localSyncPath)) return { shops: [], providers: [], localPlusVendors: [] };
    const raw = fs.readFileSync(localSyncPath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return { shops: [], providers: [], localPlusVendors: [] };
  }
}

function ensureDataDir() {
  try {
    fs.mkdirSync(path.dirname(chatStorePath), { recursive: true });
  } catch {
  }
}

function loadChatStore() {
  try {
    if (!fs.existsSync(chatStorePath)) return { rooms: {} };
    const raw = fs.readFileSync(chatStorePath, 'utf-8');
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return { rooms: {} };
    if (!parsed.rooms || typeof parsed.rooms !== 'object') parsed.rooms = {};
    return parsed;
  } catch {
    return { rooms: {} };
  }
}

function saveChatStore(store) {
  try {
    ensureDataDir();
    fs.writeFileSync(chatStorePath, JSON.stringify(store, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('[WebRTC-3008] Erreur sauvegarde chat store:', err);
    return false;
  }
}

function appendChatMessage(roomId, message) {
  try {
    const store = loadChatStore();
    if (!store.rooms[roomId]) store.rooms[roomId] = { messages: [], updatedAt: null };
    const room = store.rooms[roomId];
    if (!Array.isArray(room.messages)) room.messages = [];
    room.messages.push(message);
    room.messages = room.messages.slice(-100);
    room.updatedAt = new Date().toISOString();
    saveChatStore(store);
    return true;
  } catch (err) {
    console.error('[WebRTC-3008] Erreur append chat:', err);
    return false;
  }
}

function getChatHistory(roomId) {
  try {
    const store = loadChatStore();
    const room = store.rooms && store.rooms[roomId];
    return Array.isArray(room?.messages) ? room.messages : [];
  } catch {
    return [];
  }
}

/**
 * Verifie si un vendeur est dans ses heures d'ouverture
 * @param {string} vendorId - ID du vendeur
 * @returns {{ isOpen: boolean, reason?: string }}
 */
function checkOpeningHours(vendorId) {
  try {
    const data = loadVendorData();
    const vendors = data.localPlusVendors || [];

    const vendor = vendors.find(v => v.id === vendorId || v.slug === vendorId);
    if (!vendor) return { isOpen: true, reason: 'vendor_not_found' };

    const openTime = vendor.open_time || vendor.openTime || null;
    const closeTime = vendor.close_time || vendor.closeTime || null;

    // Si pas d'horaires definis, considere comme ouvert
    if (!openTime || !closeTime) return { isOpen: true, reason: 'no_hours_set' };

    const timezone = vendor.timezone || 'Africa/Douala';
    const now = new Date();
    const localTimeStr = now.toLocaleTimeString('fr-FR', { timeZone: timezone, hour12: false, hour: '2-digit', minute: '2-digit' });

    const nowMinutes = timeToMinutes(localTimeStr);
    const openMinutes = timeToMinutes(openTime);
    const closeMinutes = timeToMinutes(closeTime);

    if (nowMinutes >= openMinutes && nowMinutes < closeMinutes) {
      return { isOpen: true };
    }
    return {
      isOpen: false,
      reason: 'closed',
      openTime,
      closeTime,
      timezone
    };
  } catch (err) {
    console.error('[WebRTC-3008] Erreur verification horaires:', err);
    return { isOpen: true, reason: 'error' };
  }
}

function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const parts = String(timeStr).split(':');
  return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
}

/**
 * Extrait l'identifiant brut depuis le roomId (format: shop:slug-ou-id)
 */
function extractRawIdFromRoomId(roomId) {
  if (!roomId) return null;
  const parts = String(roomId).split(':');
  return parts.length > 1 ? parts.slice(1).join(':') : parts[0];
}

/**
 * Resout l'ID reel du vendeur a partir d'un slug ou d'un ID partiel
 * Cherche d'abord par ID exact, puis par slug
 */
function resolveVendorId(rawId) {
  if (!rawId) return null;
  const data = loadVendorData();
  const vendors = data.localPlusVendors || [];

  // Essayer correspondance exacte par ID
  let vendor = vendors.find(v => v.id === rawId);
  if (vendor) return vendor.id;

  // Essayer par slug
  vendor = vendors.find(v => v.slug === rawId);
  if (vendor) return vendor.id;

  // Essayer par nom (slugifie)
  vendor = vendors.find(v => {
    const nameSlug = String(v.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    return nameSlug === rawId;
  });
  if (vendor) return vendor.id;

  // Aucune correspondance : retourner l'ID brut (c'est peut-etre deja l'ID)
  return rawId;
}

/**
 * Verifie si un vendeur est en ligne (WebSocket connecte)
 * Cherche par ID exact ou resolu depuis le slug
 */
function isVendorOnline(vendorIdOrSlug) {
  // Verifier directement
  if (vendorPresence.has(vendorIdOrSlug)) return true;
  // Resoudre depuis le slug vers l'ID canonique
  const resolved = resolveVendorId(vendorIdOrSlug);
  if (resolved !== vendorIdOrSlug && vendorPresence.has(resolved)) return true;
  // Reverse : parcourir les cles de presence pour voir si l'une d'elles
  // correspond a ce vendorId une fois resolue
  for (const key of vendorPresence.keys()) {
    if (resolveVendorId(key) === vendorIdOrSlug) return true;
  }
  return false;
}

/**
 * Envoie une notification push a un vendeur hors-ligne
 */
async function sendPushToVendor(vendorId, payload) {
  const subscriptions = getSubscriptions(vendorId);
  if (subscriptions.length === 0) {
    console.log(`[WebRTC-3008] Aucune souscription push pour vendor ${vendorId}`);
    return false;
  }

  let sent = 0;
  const pushPayload = JSON.stringify(payload);

  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(sub, pushPayload);
      sent++;
      console.log(`[WebRTC-3008] Push envoye a ${vendorId} (endpoint: ${sub.endpoint.substring(0, 60)}...)`);
    } catch (err) {
      console.error(`[WebRTC-3008] Echec push pour ${vendorId}:`, err.statusCode, err.message);
      // Nettoyer les souscriptions invalides (410 Gone, 404 Not Found)
      if (err.statusCode === 410 || err.statusCode === 404) {
        removeSubscription(vendorId, sub.endpoint);
      }
    }
  }
  return sent > 0;
}

// ===== WEBSOCKET HANDLERS =====

wss.on('connection', (ws) => {
  console.log('[WebRTC-3008] Nouvelle connexion WebSocket');

  let currentUser = null;
  const joinedRooms = new Set();

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);

      switch (data.type) {
        case 'register-presence':
          handleRegisterPresence(ws, data);
          break;

        case 'join-room':
          handleJoinRoom(ws, data);
          break;

        case 'offer':
          handleOffer(ws, data);
          break;

        case 'answer':
          handleAnswer(ws, data);
          break;

        case 'ice-candidate':
          handleIceCandidate(ws, data);
          break;

        case 'product-preview':
          handleProductPreview(ws, data);
          break;

        case 'call-notification':
          handleCallNotification(ws, data);
          break;

        case 'call-accepted':
          handleCallAccepted(ws, data);
          break;

        case 'call-ended':
          handleCallEnded(ws, data);
          break;

        case 'leave-room':
          handleLeaveRoom(ws, data);
          break;

        case 'chat-message':
          handleChatMessage(ws, data);
          break;

        case 'chat-notification':
          handleChatNotification(ws, data);
          break;

        case 'ping':
          ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
          break;

        default:
          console.log('[WebRTC-3008] Type de message inconnu:', data.type);
          ws.send(JSON.stringify({
            type: 'error',
            error: `Type inconnu: ${data.type}`
          }));
      }
    } catch (error) {
      console.error('[WebRTC-3008] Erreur traitement message:', error);
      ws.send(JSON.stringify({
        type: 'error',
        error: 'Erreur traitement message'
      }));
    }
  });

  ws.on('close', () => {
    console.log('[WebRTC-3008] Connexion WebSocket fermee');
    // Nettoyer les rooms
    if (currentUser && joinedRooms.size) {
      for (const rid of Array.from(joinedRooms.values())) {
        handleUserDisconnect(rid, currentUser);
      }
    }
    // Nettoyer la presence
    if (currentUser && currentUser.vendorId) {
      const existing = vendorPresence.get(currentUser.vendorId);
      if (existing && existing.ws === ws) {
        vendorPresence.delete(currentUser.vendorId);
        console.log(`[WebRTC-3008] Presence retirée pour vendor ${currentUser.vendorId}`);
      }
    }
  });

  // ===== PRESENCE =====

  function handleRegisterPresence(ws, data) {
    let { vendorId, userId } = data;
    if (!vendorId || !userId) return;

    // Normaliser : toujours resoudre vers l'ID canonique
    const resolved = resolveVendorId(vendorId);
    if (resolved) {
      console.log(`[WebRTC-3008] Presence normalisee: ${vendorId} → ${resolved}`);
      vendorId = resolved;
    }

    currentUser = { id: userId, vendorId, ws };

    vendorPresence.set(vendorId, {
      ws,
      userId,
      connectedAt: new Date(),
      lastPing: Date.now()
    });

    console.log(`[WebRTC-3008] Presence enregistree: vendor ${vendorId} (user ${userId})`);
    ws.send(JSON.stringify({
      type: 'presence-registered',
      vendorId,
      status: 'online'
    }));
  }

  // ===== ROOM MANAGEMENT =====

  function handleJoinRoom(ws, data) {
    const { roomId, role, userId, silent } = data;
    if (!roomId || !userId) return;

    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Map());
    }

    const room = rooms.get(roomId);
    const userData = {
      id: userId,
      role: role,
      userId: userId,
      ws: ws,
      joinedAt: new Date()
    };

    room.set(userId, userData);
    users.set(`${roomId}|${userId}`, { roomId, ws, userData });
    joinedRooms.add(roomId);

    currentUser = userData;

    console.log(`[WebRTC-3008] ${userId} (${role}) a rejoint room ${roomId}`);

    if (silent) return;

    broadcastToRoom(roomId, {
      type: 'joined-room',
      roomId: roomId,
      userId: userId,
      role: role
    }, userId);

    const existingUsers = Array.from(room.values())
      .filter(user => user.id !== userId)
      .map(user => ({
        userId: user.id,
        role: user.role
      }));

    ws.send(JSON.stringify({
      type: 'other-users',
      roomId: roomId,
      users: existingUsers
    }));

    // Replay de l'offre en attente si le vendeur rejoint apres l'offre (scenario push)
    const pendingOffer = pendingOffers.get(roomId);
    if (pendingOffer) {
      console.log(`[WebRTC-3008] Replay offre en attente vers ${userId} (${role}) pour room ${roomId}`);
      ws.send(JSON.stringify({
        type: 'offer',
        roomId: roomId,
        data: pendingOffer.offer,
        from: pendingOffer.from,
        fromLabel: pendingOffer.fromLabel,
        fromRole: 'client',
        callMode: pendingOffer.callMode,
        ...(pendingOffer.callId ? { callId: pendingOffer.callId } : {})
      }));
    }
  }

  function handleLeaveRoom(ws, data) {
    const { roomId } = data;
    if (!roomId || !currentUser) return;

    if (rooms.has(roomId)) {
      const room = rooms.get(roomId);
      room.delete(currentUser.id);
      if (room.size === 0) rooms.delete(roomId);
    }
    joinedRooms.delete(roomId);
    users.delete(`${roomId}|${currentUser.id}`);
    console.log(`[WebRTC-3008] ${currentUser.id} a quitté room ${roomId}`);

    broadcastToRoom(roomId, {
      type: 'user-left',
      userId: currentUser.id,
      role: currentUser.role,
      roomId: roomId
    }, currentUser.id);
  }

  // ===== SIGNALING =====

  function handleOffer(ws, data) {
    const { roomId, data: offerData, fromLabel, callId, callMode } = data;
    const cm = typeof callMode === 'string' ? callMode.trim().toLowerCase() : '';

    console.log(`[WebRTC-3008] Offre de ${currentUser?.id} pour room ${roomId}`);

    // Stocker l'offre en attente pour replay quand le vendeur rejoint (scenario push)
    pendingOffers.set(roomId, {
      offer: offerData,
      fromLabel: typeof fromLabel === 'string' && fromLabel.trim() ? fromLabel.trim() : undefined,
      callId: typeof callId === 'string' && callId.trim() ? callId.trim() : undefined,
      callMode: cm || 'audio',
      from: currentUser?.id,
      timestamp: Date.now()
    });

    broadcastToRoom(roomId, {
      type: 'offer',
      roomId: roomId,
      data: offerData,
      from: currentUser?.id,
      fromLabel: typeof fromLabel === 'string' && fromLabel.trim() ? fromLabel.trim() : undefined,
      fromRole: currentUser?.role,
      ...((cm === 'audio' || cm === 'video') ? { callMode: cm } : {}),
      ...(typeof callId === 'string' && callId.trim() ? { callId: callId.trim() } : {})
    }, currentUser?.id);
  }

  function handleAnswer(ws, data) {
    const { roomId, data: answerData, callId } = data;

    // Nettoyer l'offre en attente (appel accepte)
    pendingOffers.delete(roomId);

    broadcastToRoom(roomId, {
      type: 'answer',
      roomId: roomId,
      data: answerData,
      from: currentUser?.id,
      fromRole: currentUser?.role,
      ...(typeof callId === 'string' && callId.trim() ? { callId: callId.trim() } : {})
    }, currentUser?.id);
  }

  function handleIceCandidate(ws, data) {
    const { roomId, data: candidateData, callId } = data;

    broadcastToRoom(roomId, {
      type: 'ice-candidate',
      roomId: roomId,
      data: candidateData,
      from: currentUser?.id,
      ...(typeof callId === 'string' && callId.trim() ? { callId: callId.trim() } : {})
    }, currentUser?.id);
  }

  function handleProductPreview(ws, data) {
    const { roomId, product } = data;
    if (!roomId || !product) return;

    // Trouver l'expediteur dans la room via sa connexion ws (pas currentUser qui est partage)
    let senderUserId = null;
    const room = rooms.get(roomId);
    if (room) {
      for (const [uid, userData] of room) {
        if (userData.ws === ws) {
          senderUserId = uid;
          break;
        }
      }
    }

    console.log(`[WebRTC-3008] Product-preview de ${senderUserId || 'inconnu'} pour room ${roomId}: ${product.name || 'sans nom'}`);

    broadcastToRoom(roomId, {
      type: 'product-preview',
      roomId: roomId,
      product: product,
      from: senderUserId
    }, senderUserId);
  }

  // ===== CALL NOTIFICATION AVEC HORAIRES + PRESENCE + PUSH =====

  function handleCallNotification(ws, data) {
    const { roomId, from, message, fromLabel, timestamp, callId, callMode, vendorId: dataVendorId } = data;
    const cm = typeof callMode === 'string' ? callMode.trim().toLowerCase() : '';

    // Extraire l'identifiant brut puis resoudre l'ID reel du vendeur
    const rawId = extractRawIdFromRoomId(roomId);
    let vendorId = resolveVendorId(rawId);
    // Fallback : utiliser le vendorId explicite du message s'il differe
    const fallbackVendorId = (typeof dataVendorId === 'string' && dataVendorId.trim()) ? resolveVendorId(dataVendorId.trim()) : null;
    if (!vendorId && fallbackVendorId) vendorId = fallbackVendorId;
    console.log(`[WebRTC-3008] Call notification: rawId=${rawId} resolvedVendorId=${vendorId}` + (fallbackVendorId && fallbackVendorId !== vendorId ? ` fallback=${fallbackVendorId}` : ''));

    // 1. Verifier les heures d'ouverture
    const hoursCheck = checkOpeningHours(vendorId);
    if (!hoursCheck.isOpen) {
      console.log(`[WebRTC-3008] Vendor ${vendorId} est ferme (${hoursCheck.reason})`);
      ws.send(JSON.stringify({
        type: 'vendor-closed',
        roomId,
        vendorId,
        reason: 'closed',
        openTime: hoursCheck.openTime,
        closeTime: hoursCheck.closeTime,
        timezone: hoursCheck.timezone,
        message: 'La boutique est actuellement fermee. Laissez un message vocal.'
      }));
      return;
    }

    // 2. Preparer le message incoming-call
    const incomingCallMsg = {
      type: 'incoming-call',
      roomId: roomId,
      from: from || (currentUser ? currentUser.id : ''),
      fromLabel: typeof fromLabel === 'string' && fromLabel.trim() ? fromLabel.trim() : undefined,
      fromRole: currentUser ? currentUser.role : undefined,
      ...((cm === 'audio' || cm === 'video') ? { callMode: cm } : {}),
      message: message,
      timestamp: timestamp || Date.now(),
      ...(typeof callId === 'string' && callId.trim() ? { callId: callId.trim() } : {})
    };

    // 3. Si le vendeur est en ligne, envoyer via WebSocket
    const vendorOnline = isVendorOnline(vendorId) || (fallbackVendorId ? isVendorOnline(fallbackVendorId) : false);
    // Stocker la session client pour pouvoir lui renvoyer call-accepted / call-ended
    callSessions.set(roomId, ws);
    if (vendorOnline) {
      console.log(`[WebRTC-3008] Vendor ${vendorId} est en ligne, envoi direct (pas de push)`);
      const vendorPres = vendorPresence.get(vendorId) || vendorPresence.get(rawId) || (fallbackVendorId ? vendorPresence.get(fallbackVendorId) : null);
      if (vendorPres && vendorPres.ws !== ws && vendorPres.ws.readyState === WebSocket.OPEN) {
        vendorPres.ws.send(JSON.stringify(incomingCallMsg));
        console.log(`[WebRTC-3008] Appel envoye directement au vendor ${vendorId}`);
      } else if (vendorPres && vendorPres.ws === ws) {
        console.log(`[WebRTC-3008] ATTENTION: le client appelant est enregistre comme vendeur ${vendorId} - incoming-call NON envoye (evite boucle)`);
      }
      broadcastToRoom(roomId, incomingCallMsg, currentUser?.id);
      return; // Pas de push quand le vendeur est en ligne
    }

    console.log(`[WebRTC-3008] Vendor ${vendorId} est hors-ligne, envoi push`);

    // 4. Anti-duplication push : ne pas renvoyer pour le meme callId
    const cid = callId || '';
    const lastPush = recentPushCallIds.get(cid);
    if (lastPush && (Date.now() - lastPush) < PUSH_DEDUP_WINDOW) {
      console.log(`[WebRTC-3008] Push deja envoye pour callId ${cid}, ignore doublon`);
      return;
    }
    recentPushCallIds.set(cid, Date.now());

    // Nettoyer les entrees expirees
    for (const [key, ts] of recentPushCallIds) {
      if (Date.now() - ts > PUSH_DEDUP_WINDOW) recentPushCallIds.delete(key);
    }

    const pushPayload = {
      title: 'Appel entrant',
      body: `${fromLabel || 'Un client'} souhaite vous appeler en ${cm === 'video' ? 'video' : 'audio'}`,
      icon: '/mangoo-logo-192.png',
      badge: '/mangoo-logo-192.png',
      tag: 'mangoo-call-' + (callId || Date.now()),
      url: '/webrtc-audio.html',
      roomId,
      vendorId,
      callId: callId || '',
      callMode: cm || 'audio',
      fromLabel: fromLabel || '',
      acceptLabel: 'Repondre',
      rejectLabel: 'Refuser'
    };

    sendPushToVendor(vendorId, pushPayload).then(pushSent => {
      if (!pushSent) {
        console.log(`[WebRTC-3008] Aucun push envoye pour vendor ${vendorId} (pas de souscriptions)`);
      }
    });

    // 5. Informer le client
    ws.send(JSON.stringify({
      type: 'call-routing',
      roomId,
      vendorId,
      status: 'ringing',
      method: vendorOnline ? 'websocket+push' : 'push',
      message: vendorOnline
        ? 'Le vendeur est en ligne. Son telephone sonne egalement.'
        : 'Notification envoyee au vendeur. Il devrait repondre bientot...'
    }));
  }

  function handleCallEnded(ws, data) {
    const { roomId, from, timestamp, callId } = data;

    // Nettoyer l'offre en attente
    pendingOffers.delete(roomId);

    const endedMsg = {
      type: 'call-ended',
      roomId: roomId,
      from: from,
      timestamp: timestamp,
      ...(typeof callId === 'string' && callId.trim() ? { callId: callId.trim() } : {})
    };

    // Envoyer call-ended directement au client appelant
    const clientWs = callSessions.get(roomId);
    if (clientWs && clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(JSON.stringify(endedMsg));
      console.log(`[WebRTC-3008] call-ended envoye directement au client pour room ${roomId}`);
    } else {
      console.log(`[WebRTC-3008] call-ended: client WS non trouve ou ferme pour room ${roomId}. callSessions.size=${callSessions.size}, clientWs=${!!clientWs}, readyState=${clientWs ? clientWs.readyState : 'N/A'}`);
    }

    // Envoyer call-ended au vendeur si le client raccroche
    const rawId = extractRawIdFromRoomId(roomId);
    let vendorId = resolveVendorId(rawId);
    const fallbackVendorId = (typeof data.vendorId === 'string' && data.vendorId.trim()) ? resolveVendorId(data.vendorId.trim()) : null;
    if (!vendorId && fallbackVendorId) vendorId = fallbackVendorId;
    const vendorPres = vendorPresence.get(vendorId) || vendorPresence.get(rawId) || (fallbackVendorId ? vendorPresence.get(fallbackVendorId) : null);
    if (vendorPres && vendorPres.ws !== ws && vendorPres.ws.readyState === WebSocket.OPEN) {
      vendorPres.ws.send(JSON.stringify(endedMsg));
      console.log(`[WebRTC-3008] call-ended envoye directement au vendor ${vendorId} pour room ${roomId}`);
    }

    // Fallback broadcast
    broadcastToRoom(roomId, endedMsg, currentUser?.id);

    // Nettoyer la room (evite que des entrees perimees interferent avec les appels suivants)
    if (rooms.has(roomId)) {
      const room = rooms.get(roomId);
      for (const [userId] of room) {
        users.delete(`${roomId}|${userId}`);
      }
      rooms.delete(roomId);
      console.log(`[WebRTC-3008] Room ${roomId} nettoyee apres call-ended`);
    }

    // Nettoyer la session
    callSessions.delete(roomId);
  }

  function handleCallAccepted(ws, data) {
    const { roomId, from, fromLabel, timestamp, callId } = data;

    // Envoyer call-accepted directement au client appelant (pas via broadcastToRoom car le client n'est pas dans la room)
    const clientWs = callSessions.get(roomId);
    if (clientWs && clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(JSON.stringify({
        type: 'call-accepted',
        roomId: roomId,
        from: from || (currentUser ? currentUser.id : ''),
        fromLabel: typeof fromLabel === 'string' && fromLabel.trim() ? fromLabel.trim() : undefined,
        fromRole: currentUser ? currentUser.role : undefined,
        timestamp: timestamp || Date.now(),
        ...(typeof callId === 'string' && callId.trim() ? { callId: callId.trim() } : {})
      }));
      console.log(`[WebRTC-3008] call-accepted envoye directement au client pour room ${roomId}`);
    } else {
      console.log(`[WebRTC-3008] Aucun client WS trouve pour room ${roomId}, fallback broadcast`);
      broadcastToRoom(roomId, {
        type: 'call-accepted',
        roomId: roomId,
        from: from || (currentUser ? currentUser.id : ''),
        fromLabel: typeof fromLabel === 'string' && fromLabel.trim() ? fromLabel.trim() : undefined,
        fromRole: currentUser ? currentUser.role : undefined,
        timestamp: timestamp || Date.now(),
        ...(typeof callId === 'string' && callId.trim() ? { callId: callId.trim() } : {})
      }, currentUser?.id);
    }
  }

  function handleChatMessage(ws, data) {
    const {
      roomId,
      message,
      from,
      timestamp,
      messageId,
      fromLabel,
      fromRole,
      vendorId,
      clientId,
      tags
    } = data;
    if (!roomId || !message) return;

    const chatMsg = {
      type: 'chat-message',
      roomId,
      messageId: messageId || ('msg-' + Date.now()),
      message: message,
      from: from,
      fromLabel: typeof fromLabel === 'string' && fromLabel.trim() ? fromLabel.trim() : undefined,
      fromRole: typeof fromRole === 'string' && fromRole.trim() ? fromRole.trim() : undefined,
      vendorId: vendorId || resolveVendorId(extractRawIdFromRoomId(roomId)),
      clientId: clientId || '',
      tags: Array.isArray(tags) ? tags.slice(0, 8) : [],
      timestamp: timestamp || Date.now()
    };

    appendChatMessage(roomId, chatMsg);
    broadcastToRoom(roomId, chatMsg, currentUser?.id);
  }

  function handleChatNotification(ws, data) {
    const {
      roomId,
      from,
      fromLabel,
      message,
      timestamp,
      messageId,
      clientId
    } = data;
    if (!roomId || !message) return;

    const rawId = extractRawIdFromRoomId(roomId);
    const vendorId = resolveVendorId(rawId);
    const incomingChatMsg = {
      type: 'incoming-chat',
      roomId,
      vendorId,
      clientId: clientId || '',
      from: from || (currentUser ? currentUser.id : ''),
      fromLabel: typeof fromLabel === 'string' && fromLabel.trim() ? fromLabel.trim() : 'Client',
      message: String(message || ''),
      messageId: typeof messageId === 'string' && messageId.trim() ? messageId.trim() : ('msg-' + Date.now()),
      timestamp: timestamp || Date.now()
    };

    const vendorOnline = isVendorOnline(vendorId);
    if (vendorOnline) {
      console.log(`[WebRTC-3008] Vendor ${vendorId} est en ligne, message envoye directement`);
      const vendorPres = vendorPresence.get(vendorId) || vendorPresence.get(rawId);
      if (vendorPres && vendorPres.ws.readyState === WebSocket.OPEN) {
        vendorPres.ws.send(JSON.stringify(incomingChatMsg));
      }
      ws.send(JSON.stringify({
        type: 'chat-routing',
        roomId,
        vendorId,
        status: 'delivered-online',
        method: 'websocket',
        message: 'Le vendeur est en ligne. Votre message a ete transmis.'
      }));
      return;
    }

    const dedupId = incomingChatMsg.messageId;
    const lastPush = recentPushMessageIds.get(dedupId);
    if (lastPush && (Date.now() - lastPush) < MESSAGE_PUSH_DEDUP_WINDOW) {
      console.log(`[WebRTC-3008] Push message deja envoye pour ${dedupId}, ignore doublon`);
      return;
    }
    recentPushMessageIds.set(dedupId, Date.now());
    for (const [key, ts] of recentPushMessageIds) {
      if (Date.now() - ts > MESSAGE_PUSH_DEDUP_WINDOW) recentPushMessageIds.delete(key);
    }

    const preview = String(message || '').replace(/\s+/g, ' ').trim().slice(0, 120);
    const pushPayload = {
      kind: 'chat',
      title: 'Nouveau message',
      body: `${incomingChatMsg.fromLabel}: ${preview}`,
      icon: '/mangoo-logo-192.png',
      badge: '/mangoo-logo-192.png',
      tag: 'mangoo-chat-' + dedupId,
      url: '/mangoo-local.html',
      roomId,
      vendorId,
      clientId: incomingChatMsg.clientId,
      fromLabel: incomingChatMsg.fromLabel,
      messageText: String(message || ''),
      messageId: dedupId,
      acceptLabel: 'Ouvrir',
      rejectLabel: 'Plus tard'
    };

    sendPushToVendor(vendorId, pushPayload).then(pushSent => {
      if (!pushSent) {
        console.log(`[WebRTC-3008] Aucun push message envoye pour vendor ${vendorId}`);
      }
    });

    ws.send(JSON.stringify({
      type: 'chat-routing',
      roomId,
      vendorId,
      status: 'notified',
      method: 'push',
      message: 'Notification de message envoyee au vendeur.'
    }));
  }

  // ===== HELPERS =====

  function handleUserDisconnect(roomId, userInfo) {
    if (!rooms.has(roomId)) return;

    const room = rooms.get(roomId);
    const existing = room.get(userInfo.id);
    if (!existing) return;
    if (existing.ws !== userInfo.ws) {
      console.log(`[WebRTC-3008] Ignore disconnect ancien socket pour ${userInfo.id}`);
      return;
    }

    broadcastToRoom(roomId, {
      type: 'user-left',
      userId: userInfo.id,
      role: userInfo.role,
      roomId: roomId
    });

    room.delete(userInfo.id);
    users.delete(`${roomId}|${userInfo.id}`);
    joinedRooms.delete(roomId);

    console.log(`[WebRTC-3008] ${userInfo.id} a quitte room ${roomId}`);

    if (room.size === 0) {
      rooms.delete(roomId);
      console.log(`[WebRTC-3008] Room ${roomId} supprimee (vide)`);
    }
  }

  function broadcastToRoom(roomId, message, excludeUserId = null) {
    if (!rooms.has(roomId)) return;

    const room = rooms.get(roomId);
    room.forEach((user, userId) => {
      if (userId === excludeUserId) return;

      if (user.ws.readyState === WebSocket.OPEN) {
        user.ws.send(JSON.stringify(message));
      }
    });
  }
});

// ===== HTTP ENDPOINTS =====

function parseBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try { resolve(JSON.parse(body)); }
      catch { resolve({}); }
    });
  });
}

function sendJson(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(data));
}

server.on('request', async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end();
    return;
  }

  switch (url.pathname) {
    // Health check
    case '/health':
      sendJson(res, 200, {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        rooms: rooms.size,
        users: users.size,
        onlineVendors: vendorPresence.size
      });
      break;

    // Cle publique VAPID pour le frontend
    case '/push/vapid-public-key':
      sendJson(res, 200, {
        publicKey: VAPID_KEYS.publicKey
      });
      break;

    // Souscription push
    case '/push/subscribe':
    case '/webrtc-ws/push/subscribe':
      if (req.method === 'POST') {
        const body = await parseBody(req);
        const { vendorId, subscription } = body;
        if (!vendorId || !subscription) {
          sendJson(res, 400, { error: 'vendorId et subscription requis' });
          return;
        }
        const ok = saveSubscription(vendorId, subscription);
        sendJson(res, ok ? 200 : 500, { success: ok });
      } else {
        sendJson(res, 405, { error: 'Method not allowed' });
      }
      break;

    // Desouscription push
    case '/push/unsubscribe':
      if (req.method === 'POST') {
        const body = await parseBody(req);
        const { vendorId, endpoint } = body;
        if (!vendorId || !endpoint) {
          sendJson(res, 400, { error: 'vendorId et endpoint requis' });
          return;
        }
        const ok = removeSubscription(vendorId, endpoint);
        sendJson(res, 200, { success: ok });
      } else {
        sendJson(res, 405, { error: 'Method not allowed' });
      }
      break;

    // Verifier la presence d'un vendeur
    case '/presence/check':
      if (req.method === 'GET') {
        const vendorId = url.searchParams.get('vendorId');
        if (!vendorId) {
          sendJson(res, 400, { error: 'vendorId requis' });
          return;
        }
        sendJson(res, 200, {
          vendorId,
          online: isVendorOnline(vendorId)
        });
      } else {
        sendJson(res, 405, { error: 'Method not allowed' });
      }
      break;

    // Historique d'une conversation Connect+
    case '/chat/history':
    case '/webrtc-ws/chat/history':
      if (req.method === 'GET') {
        const roomId = String(url.searchParams.get('roomId') || '').trim();
        if (!roomId) {
          sendJson(res, 400, { error: 'roomId requis' });
          return;
        }
        sendJson(res, 200, {
          roomId,
          messages: getChatHistory(roomId)
        });
      } else {
        sendJson(res, 405, { error: 'Method not allowed' });
      }
      break;

    // Verifier les horaires d'un vendeur
    case '/hours/check':
      if (req.method === 'GET') {
        const vendorId = url.searchParams.get('vendorId');
        if (!vendorId) {
          sendJson(res, 400, { error: 'vendorId requis' });
          return;
        }
        const result = checkOpeningHours(vendorId);
        sendJson(res, 200, result);
      } else {
        sendJson(res, 405, { error: 'Method not allowed' });
      }
      break;

    default:
      res.writeHead(404);
      res.end();
  }
});

const PORT = process.env.PORT || 3008;
const HOST = process.env.HOST || '0.0.0.0';
server.listen(PORT, HOST, () => {
  console.log(`🚀 [WebRTC-3008] Serveur WebSocket WebRTC demarre sur le port ${PORT}`);
  console.log(`📡 [WebRTC-3008] WebSocket: ws://${HOST}:${PORT}`);
  console.log(`🏥 [WebRTC-3008] Health check: http://${HOST}:${PORT}/health`);
  console.log(`🔔 [WebRTC-3008] Push notifications actives`);
});
