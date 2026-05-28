const WebSocket = require('ws');
const http = require('http');
const express = require('express');
const cors = require('cors');

/**
 * Serveur de Chat pour Live Shopping
 * Gère la synchronisation des messages et des produits entre vendeur et clients
 * Support des rooms multiples pour plusieurs sessions simultanées
 */

// Import du RoomManager (on va le copier ici pour Node.js)
class RoomManager {
  constructor() {
    this.activeRooms = new Map();
  }
  
  addRoom(roomId, info) {
    this.activeRooms.set(roomId, {
      ...info,
      createdAt: new Date(),
      isActive: true
    });
  }
  
  removeRoom(roomId) {
    this.activeRooms.delete(roomId);
  }
  
  getRoom(roomId) {
    return this.activeRooms.get(roomId);
  }
  
  getActiveRooms() {
    return Array.from(this.activeRooms.values())
      .filter(room => room.isActive)
      .sort((a, b) => b.viewers - a.viewers);
  }
  
  updateRoomViewers(roomId, viewers) {
    const room = this.activeRooms.get(roomId);
    if (room) {
      room.viewers = viewers;
      room.lastActivity = new Date();
    }
  }
  
  getRoomCount() {
    return this.activeRooms.size;
  }
}

const roomManager = new RoomManager();

const app = express();
app.use(cors());
app.use(express.json());

// Configuration
const PORT = process.env.LIVE_SHOPPING_CHAT_PORT || 3007;
const HEARTBEAT_INTERVAL = 30000; // 30 secondes

// Gestion des rooms et participants
const rooms = new Map();
const participants = new Map();

/**
 * Structure d'une room
 * {
 *   id: string,
 *   participants: Map<participantId, ParticipantInfo>,
 *   currentProduct: any,
 *   messages: Array,
 *   createdAt: Date
 * }
 */

/**
 * Structure d'un participant
 * {
 *   id: string,
 *   ws: WebSocket,
 *   roomId: string,
 *   role: 'vendor' | 'client',
 *   userId: string,
 *   lastPing: Date
 * }
 */

// Créer le serveur HTTP
const server = http.createServer(app);

// Créer le serveur WebSocket
const wss = new WebSocket.Server({ server });

/**
 * Diffuser un message à tous les participants d'une room
 */
function broadcastToRoom(roomId, message, excludeParticipantId = null) {
  if (!rooms.has(roomId)) return;
  
  const room = rooms.get(roomId);
  room.participants.forEach((participant, participantId) => {
    if (participantId !== excludeParticipantId && participant.ws.readyState === WebSocket.OPEN) {
      participant.ws.send(JSON.stringify(message));
    }
  });
}

/**
 * Envoyer un message à un participant spécifique
 */
function sendToParticipant(participantId, message) {
  const participant = participants.get(participantId);
  if (participant && participant.ws.readyState === WebSocket.OPEN) {
    participant.ws.send(JSON.stringify(message));
  }
}

/**
 * Gérer la déconnexion d'un participant
 */
function handleParticipantDisconnect(participantId) {
  const participant = participants.get(participantId);
  if (!participant) return;

  const { roomId, userId, role } = participant;
  
  // Retirer le participant de la room
  if (rooms.has(roomId)) {
    const room = rooms.get(roomId);
    room.participants.delete(participantId);
    
    // Si la room est vide, la supprimer
    if (room.participants.size === 0) {
      rooms.delete(roomId);
      console.log(`Room ${roomId} supprimée (vide)`);
    } else {
      // Notifier les autres participants
      broadcastToRoom(roomId, {
        type: 'participant-left',
        data: { participantId, userId, role }
      });
    }
  }

  // Retirer le participant global
  participants.delete(participantId);
  
  console.log(`Participant ${participantId} (${userId}) déconnecté`);
}

/**
 * Gestion des connexions WebSocket
 */
wss.on('connection', (ws, request) => {
  console.log('Nouvelle connexion WebSocket');
  
  let currentParticipantId = null;
  
  // Gestion des messages
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      console.log('Message reçu:', message.type);
      
      switch (message.type) {
        case 'join-live-shopping':
          handleJoinLiveShopping(message, ws);
          break;
          
        case 'live-chat-message':
          handleLiveChatMessage(message);
          break;
          
        case 'product-selected':
          handleProductSelected(message);
          break;
          
        case 'ping':
          handlePing(currentParticipantId);
          break;
          
        default:
          console.log('Type de message inconnu:', message.type);
      }
    } catch (error) {
      console.error('Erreur lors du traitement du message:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Erreur lors du traitement du message'
      }));
    }
  });
  
  // Gestion de la déconnexion
  ws.on('close', () => {
    if (currentParticipantId) {
      handleParticipantDisconnect(currentParticipantId);
    }
  });
  
  // Gestion des erreurs
  ws.on('error', (error) => {
    console.error('Erreur WebSocket:', error);
  });
  
  // Envoyer un ping initial
  ws.send(JSON.stringify({
    type: 'connected',
    message: 'Connecté au serveur de chat Live Shopping'
  }));
});

/**
 * Gérer la connexion d'un participant au live shopping
 */
function handleJoinLiveShopping(message, ws) {
  const { roomId, userId, role, title, vendor } = message;
  const participantId = `${userId}-${Date.now()}`;
  
  // Créer la room si elle n'existe pas
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      id: roomId,
      participants: new Map(),
      currentProduct: null,
      messages: [],
      createdAt: new Date()
    });
    
    // Enregistrer dans le RoomManager
    roomManager.addRoom(roomId, {
      roomId,
      title: title || `Live de ${vendor || 'Vendeur'}`,
      vendor: vendor || 'Vendeur',
      vendorId: userId,
      viewers: 0,
      currentProduct: null,
      isActive: true,
      createdAt: new Date()
    });
    
    console.log(`🆕 Nouvelle room créée: ${roomId}`);
  }
  
  const room = rooms.get(roomId);
  
  // Ajouter le participant
  const participant = {
    id: participantId,
    ws,
    roomId,
    role,
    userId,
    lastPing: new Date()
  };
  
  room.participants.set(participantId, participant);
  participants.set(participantId, participant);
  
  // Mettre à jour le compteur de viewers dans le RoomManager
  roomManager.updateRoomViewers(roomId, room.participants.size);
  
  console.log(`Participant ${userId} (${role}) rejoint la room ${roomId}`);
  console.log(`Participant ID généré: ${participantId}`);
  console.log(`📊 Viewers dans ${roomId}: ${room.participants.size}`);
  
  // Envoyer l'état actuel au nouveau participant
  ws.send(JSON.stringify({
    type: 'joined-live-shopping',
    data: {
      participantId: participantId,
      currentProduct: room.currentProduct,
      participantCount: room.participants.size,
      messages: room.messages.slice(-10), // 10 derniers messages
      roomInfo: roomManager.getRoom(roomId)
    }
  }));
  
  // Notifier les autres participants
  broadcastToRoom(roomId, {
    type: 'participant-joined',
    data: { participantId, userId, role, viewerCount: room.participants.size }
  }, participantId);
  
  return participantId;
}

/**
 * Gérer l'envoi d'un message de chat
 */
function handleLiveChatMessage(message) {
  const { data } = message;
  const participant = participants.get(data.participantId);
  
  if (!participant) {
    console.error('Participant non trouvé:', data.participantId);
    return;
  }
  
  const room = rooms.get(participant.roomId);
  if (!room) {
    console.error('Room non trouvée:', participant.roomId);
    return;
  }
  
  // Ajouter le message à la room
  room.messages.push(data);
  
  // Diffuser le message à tous les participants de la room
  broadcastToRoom(participant.roomId, {
    type: 'live-chat-message',
    data
  });
}

/**
 * Gérer la sélection d'un produit
 */
function handleProductSelected(message) {
  const { data } = message;
  console.log('=== handleProductSelected ===');
  console.log('Message reçu:', JSON.stringify(message, null, 2));
  console.log('Recherche participantId:', data.participantId);
  console.error('Participants disponibles:', Array.from(participants.keys()));
  
  const participant = participants.get(data.participantId);
  
  if (!participant) {
    console.error('Participant non trouvé:', data.participantId);
    return;
  }
  
  const room = rooms.get(participant.roomId);
  if (!room) {
    console.error('Room non trouvée:', participant.roomId);
    return;
  }
  
  // Vérifier que c'est bien le vendeur qui sélectionne le produit
  if (participant.role !== 'vendor') {
    console.warn('Seul le vendeur peut sélectionner un produit');
    return;
  }
  
  // Mettre à jour le produit actuel de la room
  room.currentProduct = data.product;
  
  // Diffuser la sélection à tous les participants
  broadcastToRoom(participant.roomId, {
    type: 'product-selected',
    data: data.product
  });
  
  console.log(`Produit sélectionné dans la room ${participant.roomId}:`, data.product.name);
}

/**
 * Gérer le ping (heartbeat)
 */
function handlePing(participantId) {
  const participant = participants.get(participantId);
  if (participant) {
    participant.lastPing = new Date();
  }
}

/**
 * Nettoyage périodique des connexions inactives
 */
setInterval(() => {
  const now = new Date();
  const timeout = 60000; // 1 minute
  
  participants.forEach((participant, participantId) => {
    if (now.getTime() - participant.lastPing.getTime() > timeout) {
      console.log(`Participant ${participantId} inactif, déconnexion...`);
      handleParticipantDisconnect(participantId);
      participant.ws.close();
    }
  });
}, HEARTBEAT_INTERVAL);

/**
 * Endpoint API pour obtenir l'état d'une room
 */
app.get('/api/live-shopping/room/:roomId', (req, res) => {
  const { roomId } = req.params;
  const room = rooms.get(roomId);
  
  if (!room) {
    return res.status(404).json({ error: 'Room non trouvée' });
  }
  
  res.json({
    id: room.id,
    currentProduct: room.currentProduct,
    participantCount: room.participants.size,
    messages: room.messages,
    createdAt: room.createdAt
  });
});

/**
 * Endpoint API pour obtenir toutes les rooms actives
 */
app.get('/api/live-shopping/rooms/active', (req, res) => {
  const activeRooms = roomManager.getActiveRooms();
  
  res.json(activeRooms.map(roomInfo => ({
    roomId: roomInfo.roomId,
    title: roomInfo.title,
    vendor: roomInfo.vendor,
    vendorId: roomInfo.vendorId,
    viewers: roomInfo.viewers,
    currentProduct: roomInfo.currentProduct,
    isActive: roomInfo.isActive,
    createdAt: roomInfo.createdAt
  })));
});

/**
 * Endpoint API pour obtenir les participants d'une room
 */
app.get('/api/live-shopping/room/:roomId/participants', (req, res) => {
  const { roomId } = req.params;
  const room = rooms.get(roomId);
  
  if (!room) {
    return res.status(404).json({ error: 'Room non trouvée' });
  }
  
  const participantList = Array.from(room.participants.values()).map(p => ({
    id: p.id,
    userId: p.userId,
    role: p.role,
    lastPing: p.lastPing
  }));
  
  res.json(participantList);
});

/**
 * Health check
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    rooms: rooms.size,
    participants: participants.size
  });
});

// Démarrer le serveur
server.listen(PORT, () => {
  console.log(`🛍️ Serveur de chat Live Shopping démarré sur le port ${PORT}`);
  console.log(`📡 WebSocket: ws://localhost:${PORT}`);
  console.log(`🌐 HTTP: http://localhost:${PORT}`);
});