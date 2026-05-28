// Serveur WebRTC pour la gestion des appels
import { WebSocketServer } from 'ws';
import http from 'http';

const server = http.createServer();
const wss = new WebSocketServer({ server });

const rooms = new Map();

wss.on('connection', (ws) => {
  console.log('Nouvelle connexion WebRTC');
  let currentRoom = null;
  let userRole = null;
  let userId = null;

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log('Message WebRTC reçu:', data.type);

      switch (data.type) {
        case 'join-room':
          currentRoom = data.roomId;
          userRole = data.role;
          userId = data.userId;
          
          if (!rooms.has(currentRoom)) {
            rooms.set(currentRoom, new Set());
          }
          rooms.get(currentRoom).add(ws);
          
          console.log(`${userId} (${userRole}) a rejoint la room ${currentRoom}`);
          
          // Notifier les autres utilisateurs
          ws.send(JSON.stringify({
            type: 'joined-room',
            roomId: currentRoom,
            role: userRole
          }));
          
          // Lister les autres utilisateurs
          const otherUsers = Array.from(rooms.get(currentRoom))
            .filter(client => client !== ws)
            .map(client => ({ role: 'user', id: 'other-user' }));
          
          if (otherUsers.length > 0) {
            ws.send(JSON.stringify({
              type: 'other-users',
              users: otherUsers
            }));
          }
          break;

        case 'call-notification':
          if (currentRoom && rooms.has(currentRoom)) {
            rooms.get(currentRoom).forEach(client => {
              if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                  type: 'incoming-call',
                  from: userId,
                  message: data.message
                }));
              }
            });
          }
          break;

        case 'offer':
        case 'answer':
        case 'ice-candidate':
          // Transmettre les messages WebRTC
          if (currentRoom && rooms.has(currentRoom)) {
            rooms.get(currentRoom).forEach(client => {
              if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(data));
              }
            });
          }
          break;

        case 'call-ended':
          // Transmettre la notification de fin d'appel à tous les utilisateurs de la room
          if (currentRoom && rooms.has(currentRoom)) {
            rooms.get(currentRoom).forEach(client => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(data));
              }
            });
          }
          break;
      }
    } catch (error) {
      console.error('Erreur traitement message WebRTC:', error);
    }
  });

  ws.on('close', () => {
    console.log('Connexion WebRTC fermée');
    if (currentRoom && rooms.has(currentRoom)) {
      // Notifier les autres utilisateurs de la déconnexion (fin d'appel implicite)
      rooms.get(currentRoom).forEach(client => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'call-ended',
            from: userId || 'unknown',
            reason: 'user-disconnected'
          }));
        }
      });
      
      rooms.get(currentRoom).delete(ws);
      if (rooms.get(currentRoom).size === 0) {
        rooms.delete(currentRoom);
      }
    }
  });

  ws.on('error', (error) => {
    console.error('Erreur WebSocket WebRTC:', error);
  });
});

const PORT = 3010; // Changé de 3008 à 3010 (éviter les conflits)
server.listen(PORT, () => {
  console.log(`Serveur WebRTC démarré sur le port ${PORT}`);
});