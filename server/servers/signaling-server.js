const WebSocket = require('ws');
const http = require('http');
const express = require('express');
const cors = require('cors');

/**
 * Serveur de Signalisation WebRTC
 * Gère l'établissement des connexions peer-to-peer
 */

const app = express();
app.use(cors());
app.use(express.json());

// Configuration du serveur
const PORT = process.env.SIGNALING_PORT || 8080;
const HEARTBEAT_INTERVAL = 30000; // 30 secondes

// Gestion des rooms et peers
const rooms = new Map();
const peers = new Map();

// Créer le serveur HTTP
const server = http.createServer(app);

// Créer le serveur WebSocket
const wss = new WebSocket.Server({ server });

/**
 * Structure d'une room
 * {
 *   id: string,
 *   type: 'video-call' | 'live-shopping' | 'audio-call',
 *   participants: Map<peerId, PeerInfo>,
 *   createdAt: Date,
 *   maxParticipants: number
 * }
 */

/**
 * Structure d'un peer
 * {
 *   id: string,
 *   ws: WebSocket,
 *   roomId: string,
 *   userData: object,
 *   lastPing: Date
 * }
 */

// Middleware de logging
wss.on('connection', (ws, req) => {
  console.log(`[WebRTC] Nouvelle connexion depuis ${req.socket.remoteAddress}`);
  
  let peerId = null;
  
  // Envoyer le ping initial
  ws.send(JSON.stringify({
    type: 'ping',
    timestamp: Date.now()
  }));
  
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      handleMessage(ws, message, peerId);
    } catch (error) {
      console.error('[WebRTC] Erreur parsing message:', error);
      ws.send(JSON.stringify({
        type: 'error',
        error: 'Invalid message format'
      }));
    }
  });
  
  ws.on('close', () => {
    if (peerId) {
      handleDisconnect(peerId);
    }
    console.log(`[WebRTC] Connexion fermée pour ${peerId || 'inconnu'}`);
  });
  
  ws.on('pong', () => {
    if (peerId && peers.has(peerId)) {
      peers.get(peerId).lastPing = Date.now();
    }
  });
});

/**
 * Gère les messages entrants
 */
function handleMessage(ws, message, peerId) {
  const { type, data } = message;
  
  switch (type) {
    case 'register':
      peerId = handleRegister(ws, data);
      break;
      
    case 'join-room':
      handleJoinRoom(peerId, data);
      break;
      
    case 'leave-room':
      handleLeaveRoom(peerId);
      break;
      
    case 'offer':
      handleOffer(peerId, data);
      break;
      
    case 'answer':
      handleAnswer(peerId, data);
      break;
      
    case 'ice-candidate':
      handleIceCandidate(peerId, data);
      break;
      
    case 'live-start':
      handleLiveStart(peerId, data);
      break;
      
    case 'live-join':
      handleLiveJoin(peerId, data);
      break;
      
    case 'live-leave':
      handleLiveLeave(peerId);
      break;
      
    case 'pong':
      // Déjà géré dans l'événement pong
      break;
      
    default:
      console.warn(`[WebRTC] Type de message inconnu: ${type}`);
  }
}

/**
 * Enregistre un nouveau peer
 */
function handleRegister(ws, data) {
  const { peerId, userData } = data;
  
  if (peers.has(peerId)) {
    // Déconnecter l'ancienne connexion
    const oldPeer = peers.get(peerId);
    if (oldPeer.ws.readyState === WebSocket.OPEN) {
      oldPeer.ws.close();
    }
  }
  
  peers.set(peerId, {
    id: peerId,
    ws: ws,
    roomId: null,
    userData: userData || {},
    lastPing: Date.now()
  });
  
  console.log(`[WebRTC] Peer enregistré: ${peerId}`);
  
  ws.send(JSON.stringify({
    type: 'registered',
    peerId: peerId,
    serverTime: Date.now()
  }));
  
  return peerId;
}

/**
 * Rejoint une room
 */
function handleJoinRoom(peerId, data) {
  const { roomId, roomType = 'video-call', maxParticipants = 10 } = data;
  const peer = peers.get(peerId);
  
  if (!peer) {
    console.error(`[WebRTC] Peer non trouvé: ${peerId}`);
    return;
  }
  
  // Quitter l'ancienne room si nécessaire
  if (peer.roomId) {
    handleLeaveRoom(peerId);
  }
  
  // Créer la room si elle n'existe pas
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      id: roomId,
      type: roomType,
      participants: new Map(),
      createdAt: new Date(),
      maxParticipants: maxParticipants
    });
    console.log(`[WebRTC] Room créée: ${roomId} (${roomType})`);
  }
  
  const room = rooms.get(roomId);
  
  // Vérifier la limite de participants
  if (room.participants.size >= room.maxParticipants) {
    peer.ws.send(JSON.stringify({
      type: 'error',
      error: 'Room is full'
    }));
    return;
  }
  
  // Ajouter le peer à la room
  room.participants.set(peerId, {
    id: peerId,
    joinedAt: new Date(),
    userData: peer.userData
  });
  
  peer.roomId = roomId;
  
  console.log(`[WebRTC] Peer ${peerId} a rejoint la room ${roomId}`);
  
  // Notifier le nouveau participant
  peer.ws.send(JSON.stringify({
    type: 'room-joined',
    roomId: roomId,
    roomType: room.type,
    participants: Array.from(room.participants.keys()).filter(id => id !== peerId)
  }));
  
  // Notifier les autres participants
  broadcastToRoom(roomId, {
    type: 'peer-joined',
    peerId: peerId,
    userData: peer.userData
  }, peerId);
}

/**
 * Quitte une room
 */
function handleLeaveRoom(peerId) {
  const peer = peers.get(peerId);
  if (!peer || !peer.roomId) return;
  
  const roomId = peer.roomId;
  const room = rooms.get(roomId);
  
  if (room) {
    room.participants.delete(peerId);
    
    // Notifier les autres participants
    broadcastToRoom(roomId, {
      type: 'peer-left',
      peerId: peerId
    });
    
    // Supprimer la room si elle est vide
    if (room.participants.size === 0) {
      rooms.delete(roomId);
      console.log(`[WebRTC] Room supprimée: ${roomId}`);
    }
  }
  
  peer.roomId = null;
  console.log(`[WebRTC] Peer ${peerId} a quitté la room ${roomId}`);
}

/**
* Gère l'offre WebRTC
 */
function handleOffer(peerId, data) {
  const { targetPeerId, offer } = data;
  const peer = peers.get(peerId);
  const targetPeer = peers.get(targetPeerId);
  
  if (!peer || !targetPeer) {
    console.error(`[WebRTC] Peer invalide pour l'offre`);
    return;
  }
  
  // Vérifier que les deux peers sont dans la même room
  if (peer.roomId !== targetPeer.roomId) {
    console.error(`[WebRTC] Peers pas dans la même room`);
    return;
  }
  
  targetPeer.ws.send(JSON.stringify({
    type: 'offer',
    peerId: peerId,
    offer: offer
  }));
  
  console.log(`[WebRTC] Offre transmise de ${peerId} à ${targetPeerId}`);
}

/**
 * Gère la réponse WebRTC
 */
function handleAnswer(peerId, data) {
  const { targetPeerId, answer } = data;
  const peer = peers.get(peerId);
  const targetPeer = peers.get(targetPeerId);
  
  if (!peer || !targetPeer) {
    console.error(`[WebRTC] Peer invalide pour la réponse`);
    return;
  }
  
  targetPeer.ws.send(JSON.stringify({
    type: 'answer',
    peerId: peerId,
    answer: answer
  }));
  
  console.log(`[WebRTC] Réponse transmise de ${peerId} à ${targetPeerId}`);
}

/**
 * Gère les candidats ICE
 */
function handleIceCandidate(peerId, data) {
  const { targetPeerId, candidate } = data;
  const peer = peers.get(peerId);
  const targetPeer = peers.get(targetPeerId);
  
  if (!peer || !targetPeer) {
    console.error(`[WebRTC] Peer invalide pour ICE candidate`);
    return;
  }
  
  targetPeer.ws.send(JSON.stringify({
    type: 'ice-candidate',
    peerId: peerId,
    candidate: candidate
  }));
  
  console.log(`[WebRTC] ICE candidate transmis de ${peerId} à ${targetPeerId}`);
}

/**
 * Gère le démarrage d'un live shopping
 */
function handleLiveStart(peerId, data) {
  const { title, description, products } = data;
  const peer = peers.get(peerId);
  
  if (!peer) return;
  
  const roomId = `live_${Date.now()}`;
  
  // Créer une room spéciale pour le live shopping
  rooms.set(roomId, {
    id: roomId,
    type: 'live-shopping',
    title: title,
    description: description,
    products: products || [],
    hostId: peerId,
    participants: new Map(),
    viewers: 0,
    createdAt: new Date(),
    maxParticipants: 1000, // Pas de limite pour les viewers
    isLive: true
  });
  
  peer.roomId = roomId;
  
  peer.ws.send(JSON.stringify({
    type: 'live-started',
    roomId: roomId,
    streamKey: generateStreamKey(roomId)
  }));
  
  console.log(`[WebRTC] Live shopping démarré: ${roomId} par ${peerId}`);
}

/**
 * Rejoint un live shopping
 */
function handleLiveJoin(peerId, data) {
  const { roomId } = data;
  const peer = peers.get(peerId);
  
  if (!peer) return;
  
  const room = rooms.get(roomId);
  if (!room || room.type !== 'live-shopping') {
    peer.ws.send(JSON.stringify({
      type: 'error',
      error: 'Live shopping not found'
    }));
    return;
  }
  
  // Ajouter comme viewer
  room.participants.set(peerId, {
    id: peerId,
    role: 'viewer',
    joinedAt: new Date(),
    userData: peer.userData
  });
  
  room.viewers++;
  peer.roomId = roomId;
  
  peer.ws.send(JSON.stringify({
    type: 'live-joined',
    roomId: roomId,
    title: room.title,
    description: room.description,
    products: room.products,
    viewers: room.viewers,
    isHost: false
  }));
  
  // Notifier l'hôte
  const hostPeer = peers.get(room.hostId);
  if (hostPeer) {
    hostPeer.ws.send(JSON.stringify({
      type: 'viewer-joined',
      viewerId: peerId,
      viewers: room.viewers
    }));
  }
  
  console.log(`[WebRTC] Viewer ${peerId} a rejoint le live ${roomId}`);
}

/**
 * Gère la déconnexion d'un peer
 */
function handleDisconnect(peerId) {
  const peer = peers.get(peerId);
  if (!peer) return;
  
  // Quitter la room si nécessaire
  if (peer.roomId) {
    const room = rooms.get(peer.roomId);
    if (room && room.type === 'live-shopping' && room.hostId === peerId) {
      // C'est l'hôte qui se déconnecte - finir le live
      endLiveShopping(peer.roomId);
    } else {
      handleLeaveRoom(peerId);
    }
  }
  
  peers.delete(peerId);
  console.log(`[WebRTC] Peer déconnecté: ${peerId}`);
}

/**
 * Termine un live shopping
 */
function endLiveShopping(roomId) {
  const room = rooms.get(roomId);
  if (!room) return;
  
  // Notifier tous les viewers
  room.participants.forEach((participant, peerId) => {
    const peer = peers.get(peerId);
    if (peer) {
      peer.ws.send(JSON.stringify({
        type: 'live-ended',
        roomId: roomId
      }));
      peer.roomId = null;
    }
  });
  
  rooms.delete(roomId);
  console.log(`[WebRTC] Live shopping terminé: ${roomId}`);
}

/**
 * Diffuse un message à tous les peers d'une room (sauf l'expéditeur)
 */
function broadcastToRoom(roomId, message, excludePeerId = null) {
  const room = rooms.get(roomId);
  if (!room) return;
  
  room.participants.forEach((participant, peerId) => {
    if (peerId === excludePeerId) return;
    
    const peer = peers.get(peerId);
    if (peer && peer.ws.readyState === WebSocket.OPEN) {
      peer.ws.send(JSON.stringify(message));
    }
  });
}

/**
 * Génère une clé de stream unique
 */
function generateStreamKey(roomId) {
  return `stream_${roomId}_${Date.now()}`;
}

/**
 * Heartbeat - vérifie les connexions actives
 */
setInterval(() => {
  const now = Date.now();
  const timeout = HEARTBEAT_INTERVAL * 2;
  
  peers.forEach((peer, peerId) => {
    if (now - peer.lastPing > timeout) {
      console.log(`[WebRTC] Heartbeat timeout pour ${peerId}`);
      handleDisconnect(peerId);
    } else if (peer.ws.readyState === WebSocket.OPEN) {
      peer.ws.ping();
    }
  });
}, HEARTBEAT_INTERVAL);

/**
 * Routes HTTP pour la gestion des rooms
 */
app.get('/api/rooms', (req, res) => {
  const roomList = Array.from(rooms.values()).map(room => ({
    id: room.id,
    type: room.type,
    title: room.title,
    description: room.description,
    participants: room.participants.size,
    maxParticipants: room.maxParticipants,
    createdAt: room.createdAt,
    isLive: room.isLive || false,
    viewers: room.viewers || 0
  }));
  
  res.json(roomList);
});

app.get('/api/rooms/:roomId', (req, res) => {
  const room = rooms.get(req.params.roomId);
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }
  
  res.json({
    id: room.id,
    type: room.type,
    title: room.title,
    description: room.description,
    products: room.products || [],
    participants: Array.from(room.participants.values()),
    createdAt: room.createdAt,
    isLive: room.isLive || false,
    viewers: room.viewers || 0,
    hostId: room.hostId
  });
});

// Démarrer le serveur
server.listen(PORT, () => {
  console.log(`[WebRTC] Serveur de signalisation démarré sur le port ${PORT}`);
  console.log(`[WebRTC] Endpoint WebSocket: ws://localhost:${PORT}`);
  console.log(`[WebRTC] Endpoint HTTP: http://localhost:${PORT}/api/rooms`);
});

module.exports = { server, wss };