// Serveur WebSocket WebRTC pour MangooTech - Port 3008
import http from 'http';
import WebSocket, { WebSocketServer } from 'ws';

const server = http.createServer();
const wss = new WebSocketServer({ server });

// Stockage des rooms et utilisateurs
const rooms = new Map();
const users = new Map();

wss.on('connection', (ws) => {
  console.log('[WebRTC-3008] Nouvelle connexion WebSocket');
  
  let currentUser = null;
  const joinedRooms = new Set();

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

        case 'call-accepted':
          handleCallAccepted(ws, data);
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
    if (currentUser && joinedRooms.size) {
      for (const rid of Array.from(joinedRooms.values())) {
        handleUserDisconnect(rid, currentUser);
      }
    }
  });

  function handleJoinRoom(ws, data) {
    const { roomId, role, userId, silent } = data;
    if (!roomId || !userId) return;
    
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
    users.set(`${roomId}|${userId}`, { roomId, ws, userData });
    joinedRooms.add(roomId);

    if (!currentUser) currentUser = userData;

    console.log(`[WebRTC-3008] Utilisateur ${userId} (${role}) a rejoint la room ${roomId}`);

    if (silent) return;

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
      roomId: roomId,
      users: existingUsers
    }));
  }

  function handleOffer(ws, data) {
    const { roomId, data: offerData, fromLabel, callId, callMode } = data;
    const cm = typeof callMode === 'string' ? callMode.trim().toLowerCase() : '';
    
    console.log(`[WebRTC-3008] Offre reçue de ${currentUser.id} pour la room ${roomId}`);
    console.log(`[WebRTC-3008] Type d'offre: ${offerData.type}`);
    console.log(`[WebRTC-3008] SDP présent: ${offerData.sdp ? 'Oui' : 'Non'}`);
    
    // Transmettre l'offre aux autres utilisateurs de la room
    broadcastToRoom(roomId, {
      type: 'offer',
      roomId: roomId,
      data: offerData,
      from: currentUser.id,
      fromLabel: typeof fromLabel === 'string' && fromLabel.trim() ? fromLabel.trim() : undefined,
      fromRole: currentUser.role,
      ...((cm === 'audio' || cm === 'video') ? { callMode: cm } : {}),
      ...(typeof callId === 'string' && callId.trim() ? { callId: callId.trim() } : {})
    }, currentUser.id);
    
    console.log(`[WebRTC-3008] Offre transmise dans la room ${roomId}`);
  }

  function handleAnswer(ws, data) {
    const { roomId, data: answerData, callId } = data;
    
    console.log(`[WebRTC-3008] Réponse reçue de ${currentUser.id} pour la room ${roomId}`);
    console.log(`[WebRTC-3008] Type de réponse: ${answerData.type}`);
    console.log(`[WebRTC-3008] SDP présent: ${answerData.sdp ? 'Oui' : 'Non'}`);
    
    // Transmettre la réponse aux autres utilisateurs de la room
    broadcastToRoom(roomId, {
      type: 'answer',
      roomId: roomId,
      data: answerData,
      from: currentUser.id,
      fromRole: currentUser.role,
      ...(typeof callId === 'string' && callId.trim() ? { callId: callId.trim() } : {})
    }, currentUser.id);
    
    console.log(`[WebRTC-3008] Réponse transmise dans la room ${roomId}`);
  }

  function handleIceCandidate(ws, data) {
    const { roomId, data: candidateData, callId } = data;
    
    // Transmettre le candidat ICE aux autres utilisateurs de la room
    broadcastToRoom(roomId, {
      type: 'ice-candidate',
      roomId: roomId,
      data: candidateData,
      from: currentUser.id,
      ...(typeof callId === 'string' && callId.trim() ? { callId: callId.trim() } : {})
    }, currentUser.id);
    
    console.log(`[WebRTC-3008] ICE candidate transmis dans la room ${roomId}`);
  }

  function handleCallNotification(ws, data) {
    const { roomId, from, message, fromLabel, timestamp, callId, callMode } = data;
    const cm = typeof callMode === 'string' ? callMode.trim().toLowerCase() : '';
    
    // Notifier les autres utilisateurs de l'appel entrant
    broadcastToRoom(roomId, {
      type: 'incoming-call',
      roomId: roomId,
      from: from || (currentUser ? currentUser.id : ''),
      fromLabel: typeof fromLabel === 'string' && fromLabel.trim() ? fromLabel.trim() : undefined,
      fromRole: currentUser ? currentUser.role : undefined,
      ...((cm === 'audio' || cm === 'video') ? { callMode: cm } : {}),
      message: message,
      timestamp: timestamp || Date.now(),
      ...(typeof callId === 'string' && callId.trim() ? { callId: callId.trim() } : {})
    }, currentUser.id);
    
    console.log(`[WebRTC-3008] Notification d'appel transmise dans la room ${roomId}`);
  }

  function handleCallEnded(ws, data) {
    const { roomId, from, timestamp, callId } = data;
    
    // Notifier les autres utilisateurs de la fin d'appel
    broadcastToRoom(roomId, {
      type: 'call-ended',
      roomId: roomId,
      from: from,
      timestamp: timestamp,
      ...(typeof callId === 'string' && callId.trim() ? { callId: callId.trim() } : {})
    }, currentUser.id);
    
    console.log(`[WebRTC-3008] Notification de fin d'appel transmise dans la room ${roomId}`);
  }

  function handleCallAccepted(ws, data) {
    const { roomId, from, fromLabel, timestamp, callId } = data;
    
    broadcastToRoom(roomId, {
      type: 'call-accepted',
      roomId: roomId,
      from: from || (currentUser ? currentUser.id : ''),
      fromLabel: typeof fromLabel === 'string' && fromLabel.trim() ? fromLabel.trim() : undefined,
      fromRole: currentUser ? currentUser.role : undefined,
      timestamp: timestamp || Date.now(),
      ...(typeof callId === 'string' && callId.trim() ? { callId: callId.trim() } : {})
    }, currentUser.id);
    
    console.log(`[WebRTC-3008] Notification call-accepted transmise dans la room ${roomId}`);
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
    const existing = room.get(userInfo.id);
    if (!existing) return;
    if (existing.ws !== userInfo.ws) {
      console.log(`[WebRTC-3008] Ignoré disconnect ancien socket pour ${userInfo.id} (room ${roomId})`);
      return;
    }
    
    // Informer les autres utilisateurs
    broadcastToRoom(roomId, {
      type: 'user-left',
      userId: userInfo.id,
      role: userInfo.role,
      roomId: roomId
    });

    // Retirer l'utilisateur de la room
    room.delete(userInfo.id);
    users.delete(`${roomId}|${userInfo.id}`);
    joinedRooms.delete(roomId);

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
const HOST = process.env.HOST || '0.0.0.0';
server.listen(PORT, HOST, () => {
  console.log(`🚀 [WebRTC-3008] Serveur WebSocket WebRTC démarré sur le port ${PORT}`);
  console.log(`📡 [WebRTC-3008] WebSocket: ws://${HOST}:${PORT}`);
  console.log(`🏥 [WebRTC-3008] Health check: http://${HOST}:${PORT}/health`);
});
