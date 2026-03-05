// Serveur de signalisation WebRTC pour MangooTech
const WebSocket = require('ws');
const http = require('http');

const server = http.createServer();
const wss = new WebSocket.Server({ server });

// Stockage des rooms et utilisateurs
const rooms = new Map();

wss.on('connection', (ws) => {
  console.log('Nouvelle connexion WebSocket');
  
  let currentRoom = null;
  let currentUser = null;

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log('Message reçu:', data.type);

      switch (data.type) {
        case 'join':
          handleJoin(ws, data);
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

        case 'leave':
          handleLeave(ws, data);
          break;

        default:
          console.log('Type de message inconnu:', data.type);
      }
    } catch (error) {
      console.error('Erreur lors du traitement du message:', error);
    }
  });

  ws.on('close', () => {
    console.log('Connexion WebSocket fermée');
    if (currentRoom && currentUser) {
      handleUserDisconnect(currentRoom, currentUser);
    }
  });

  function handleJoin(ws, data) {
    const { roomId, role, userName } = data;
    
    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Map());
    }

    const room = rooms.get(roomId);
    
    // Ajouter l'utilisateur à la room
    room.set(ws, {
      id: Date.now().toString(),
      role,
      userName,
      ws
    });

    currentRoom = roomId;
    currentUser = room.get(ws);

    console.log(`Utilisateur ${userName} (${role}) a rejoint la room ${roomId}`);

    // Informer les autres utilisateurs de la room
    broadcastToRoom(roomId, {
      type: 'user-joined',
      userName,
      role
    }, ws);

    // Envoyer la liste des utilisateurs existants
    const existingUsers = Array.from(room.values())
      .filter(user => user.ws !== ws)
      .map(user => ({
        userName: user.userName,
        role: user.role
      }));

    ws.send(JSON.stringify({
      type: 'room-users',
      users: existingUsers
    }));
  }

  function handleOffer(ws, data) {
    const { offer, roomId } = data;
    
    // Transmettre l'offre aux autres utilisateurs de la room
    broadcastToRoom(roomId, {
      type: 'offer',
      offer,
      from: getUserInfo(ws)
    }, ws);
  }

  function handleAnswer(ws, data) {
    const { answer, roomId } = data;
    
    // Transmettre la réponse aux autres utilisateurs de la room
    broadcastToRoom(roomId, {
      type: 'answer',
      answer,
      from: getUserInfo(ws)
    }, ws);
  }

  function handleIceCandidate(ws, data) {
    const { candidate, roomId } = data;
    
    // Transmettre le candidat ICE aux autres utilisateurs de la room
    broadcastToRoom(roomId, {
      type: 'ice-candidate',
      candidate,
      from: getUserInfo(ws)
    }, ws);
  }

  function handleLeave(ws, data) {
    const { roomId } = data;
    handleUserDisconnect(roomId, getUserInfo(ws));
  }

  function handleUserDisconnect(roomId, userInfo) {
    if (!rooms.has(roomId)) return;

    const room = rooms.get(roomId);
    
    // Informer les autres utilisateurs
    broadcastToRoom(roomId, {
      type: 'user-left',
      userName: userInfo.userName,
      role: userInfo.role
    });

    // Retirer l'utilisateur de la room
    room.delete(ws);

    console.log(`Utilisateur ${userInfo.userName} a quitté la room ${roomId}`);

    // Supprimer la room si elle est vide
    if (room.size === 0) {
      rooms.delete(roomId);
      console.log(`Room ${roomId} supprimée (vide)`);
    }
  }

  function broadcastToRoom(roomId, message, excludeWs = null) {
    if (!rooms.has(roomId)) return;

    const room = rooms.get(roomId);
    room.forEach((user, ws) => {
      if (ws !== excludeWs && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
      }
    });
  }

  function getUserInfo(ws) {
    if (!currentRoom || !rooms.has(currentRoom)) return null;
    
    const room = rooms.get(currentRoom);
    const user = room.get(ws);
    return user ? {
      userName: user.userName,
      role: user.role
    } : null;
  }
});

// Gestion du health check
server.on('request', (req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      rooms: rooms.size,
      totalUsers: Array.from(rooms.values()).reduce((total, room) => total + room.size, 0)
    }));
  } else {
    res.writeHead(404);
    res.end();
  }
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`🚀 Serveur de signalisation WebRTC démarré sur le port ${PORT}`);
  console.log(`📊 Health check disponible sur http://localhost:${PORT}/health`);
});