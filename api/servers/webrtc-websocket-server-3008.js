// Serveur WebSocket WebRTC pour MangooTech - Port 3008
const WebSocket = require('ws');
const http = require('http');

const server = http.createServer();
const wss = new WebSocket.Server({ server });

// Stockage des rooms et utilisateurs
const rooms = new Map();
const users = new Map();

wss.on('connection', (ws) => {
  console.log('[WebRTC-3008] Nouvelle connexion WebSocket');
  
  let currentRoom = null;
  let currentUser = null;

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log('[WebRTC-3008] Message reçu:', data.type);

      switch (data.type) {
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

        case 'call-notification':
          handleCallNotification(ws, data);
          break;

        case 'call-ended':
          handleCallEnded(ws, data);
          break;

        case 'chat-message':
          handleChatMessage(ws, data);
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
    console.log('[WebRTC-3008] Connexion WebSocket fermée');
    if (currentRoom && currentUser) {
      handleUserDisconnect(currentRoom, currentUser);
    }
  });

  function handleJoinRoom(ws, data) {
    const { roomId, role, userId } = data;
    
    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Map());
    }

    const room = rooms.get(roomId);
    
    // Ajouter l'utilisateur à la room
    const userData = {
      id: userId,
      role: role,
      userId: userId,
      ws: ws,
      joinedAt: new Date()
    };
    
    room.set(userId, userData);
    users.set(userId, { roomId, ws, userData });

    currentRoom = roomId;
    currentUser = userData;

    console.log(`[WebRTC-3008] Utilisateur ${userId} (${role}) a rejoint la room ${roomId}`);

    // Informer les autres utilisateurs de la room
    broadcastToRoom(roomId, {
      type: 'joined-room',
      roomId: roomId,
      userId: userId,
      role: role
    }, userId);

    // Envoyer la liste des utilisateurs existants
    const existingUsers = Array.from(room.values())
      .filter(user => user.id !== userId)
      .map(user => ({
        userId: user.id,
        role: user.role
      }));

    ws.send(JSON.stringify({
      type: 'other-users',
      users: existingUsers
    }));
  }

  function handleOffer(ws, data) {
    const { roomId, data: offerData } = data;
    
    console.log(`[WebRTC-3008] Offre reçue de ${currentUser.id} pour la room ${roomId}`);
    console.log(`[WebRTC-3008] Type d'offre: ${offerData.type}`);
    console.log(`[WebRTC-3008] SDP présent: ${offerData.sdp ? 'Oui' : 'Non'}`);
    
    // Transmettre l'offre aux autres utilisateurs de la room
    broadcastToRoom(roomId, {
      type: 'offer',
      data: offerData,
      from: currentUser.id
    }, currentUser.id);
    
    console.log(`[WebRTC-3008] Offre transmise dans la room ${roomId}`);
  }

  function handleAnswer(ws, data) {
    const { roomId, data: answerData } = data;
    
    console.log(`[WebRTC-3008] Réponse reçue de ${currentUser.id} pour la room ${roomId}`);
    console.log(`[WebRTC-3008] Type de réponse: ${answerData.type}`);
    console.log(`[WebRTC-3008] SDP présent: ${answerData.sdp ? 'Oui' : 'Non'}`);
    
    // Transmettre la réponse aux autres utilisateurs de la room
    broadcastToRoom(roomId, {
      type: 'answer',
      data: answerData,
      from: currentUser.id
    }, currentUser.id);
    
    console.log(`[WebRTC-3008] Réponse transmise dans la room ${roomId}`);
  }

  function handleIceCandidate(ws, data) {
    const { roomId, data: candidateData } = data;
    
    // Transmettre le candidat ICE aux autres utilisateurs de la room
    broadcastToRoom(roomId, {
      type: 'ice-candidate',
      data: candidateData,
      from: currentUser.id
    }, currentUser.id);
    
    console.log(`[WebRTC-3008] ICE candidate transmis dans la room ${roomId}`);
  }

  function handleCallNotification(ws, data) {
    const { roomId, from, message } = data;
    
    // Notifier les autres utilisateurs de l'appel entrant
    broadcastToRoom(roomId, {
      type: 'incoming-call',
      from: from,
      message: message
    }, currentUser.id);
    
    console.log(`[WebRTC-3008] Notification d'appel transmise dans la room ${roomId}`);
  }

  function handleCallEnded(ws, data) {
    const { roomId, from, timestamp } = data;
    
    // Notifier les autres utilisateurs de la fin d'appel
    broadcastToRoom(roomId, {
      type: 'call-ended',
      from: from,
      timestamp: timestamp
    }, currentUser.id);
    
    console.log(`[WebRTC-3008] Notification de fin d'appel transmise dans la room ${roomId}`);
  }

  function handleChatMessage(ws, data) {
    const { roomId, message, from, timestamp } = data;
    
    // Transmettre le message aux autres utilisateurs de la room
    broadcastToRoom(roomId, {
      type: 'chat-message',
      message: message,
      from: from,
      timestamp: timestamp
    }, currentUser.id);
    
    console.log(`[WebRTC-3008] Message chat transmis dans la room ${roomId}`);
  }

  function handleUserDisconnect(roomId, userInfo) {
    if (!rooms.has(roomId)) return;

    const room = rooms.get(roomId);
    
    // Informer les autres utilisateurs
    broadcastToRoom(roomId, {
      type: 'user-left',
      userId: userInfo.id,
      role: userInfo.role
    });

    // Retirer l'utilisateur de la room
    room.delete(userInfo.id);
    users.delete(userInfo.id);

    console.log(`[WebRTC-3008] Utilisateur ${userInfo.id} a quitté la room ${roomId}`);

    // Supprimer la room si elle est vide
    if (room.size === 0) {
      rooms.delete(roomId);
      console.log(`[WebRTC-3008] Room ${roomId} supprimée (vide)`);
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

// Health check endpoint
server.on('request', (req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      rooms: rooms.size,
      users: users.size
    }));
  } else {
    res.writeHead(404);
    res.end();
  }
});

const PORT = process.env.PORT || 3008;
server.listen(PORT, () => {
  console.log(`🚀 [WebRTC-3008] Serveur WebSocket WebRTC démarré sur le port ${PORT}`);
  console.log(`📡 [WebRTC-3008] WebSocket: ws://localhost:${PORT}`);
  console.log(`🏥 [WebRTC-3008] Health check: http://localhost:${PORT}/health`);
});