const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Stockage des sessions d'appel actives
const activeCalls = new Map();
const connectedUsers = new Map();

// Configuration WebRTC
const iceServers = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' }
];

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Enregistrement de l'utilisateur
  socket.on('register', (userData) => {
    connectedUsers.set(socket.id, {
      id: socket.id,
      userId: userData.userId,
      name: userData.name,
      role: userData.role,
      socketId: socket.id
    });
    
    socket.join(userData.userId);
    console.log(`User ${userData.userId} registered as ${userData.role}`);
    
    // Notifier les autres utilisateurs
    socket.broadcast.emit('userOnline', {
      userId: userData.userId,
      name: userData.name,
      role: userData.role
    });
  });

  // Gestion des appels vidéo/audio
  socket.on('startCall', (callData) => {
    const { targetUserId, callType, offer } = callData;
    const caller = connectedUsers.get(socket.id);
    
    if (!caller) {
      socket.emit('callError', { message: 'Caller not registered' });
      return;
    }

    const callId = `call_${Date.now()}`;
    const callSession = {
      id: callId,
      caller: caller,
      callee: targetUserId,
      type: callType,
      status: 'ringing',
      startTime: new Date(),
      offer: offer
    };

    activeCalls.set(callId, callSession);

    // Envoyer l'appel au destinataire
    socket.to(targetUserId).emit('incomingCall', {
      callId,
      caller: caller,
      callType,
      offer: offer
    });

    console.log(`Call initiated: ${caller.userId} -> ${targetUserId}`);
  });

  // Réponse à un appel
  socket.on('answerCall', (answerData) => {
    const { callId, answer } = answerData;
    const callSession = activeCalls.get(callId);
    
    if (!callSession) {
      socket.emit('callError', { message: 'Call not found' });
      return;
    }

    const callee = connectedUsers.get(socket.id);
    callSession.status = 'connected';
    callSession.answer = answer;
    callSession.callee = callee;

    // Envoyer la réponse à l'appelant
    socket.to(callSession.caller.userId).emit('callAnswered', {
      callId,
      answer: answer,
      callee: callee
    });

    console.log(`Call answered: ${callId}`);
  });

  // Rejet d'appel
  socket.on('rejectCall', (rejectData) => {
    const { callId } = rejectData;
    const callSession = activeCalls.get(callId);
    
    if (callSession) {
      callSession.status = 'rejected';
      
      // Notifier l'appelant
      socket.to(callSession.caller.userId).emit('callRejected', {
        callId,
        reason: 'User rejected the call'
      });
      
      activeCalls.delete(callId);
      console.log(`Call rejected: ${callId}`);
    }
  });

  // Terminaison d'appel
  socket.on('endCall', (endData) => {
    const { callId } = endData;
    const callSession = activeCalls.get(callId);
    
    if (callSession) {
      callSession.status = 'ended';
      callSession.endTime = new Date();
      
      // Notifier l'autre partie
      const otherParty = callSession.caller.userId === socket.id ? 
        callSession.callee : callSession.caller.userId;
      
      socket.to(otherParty).emit('callEnded', {
        callId,
        endedBy: connectedUsers.get(socket.id)
      });
      
      activeCalls.delete(callId);
      console.log(`Call ended: ${callId}`);
    }
  });

  // Échange de candidats ICE
  socket.on('iceCandidate', (iceData) => {
    const { callId, candidate } = iceData;
    const callSession = activeCalls.get(callId);
    
    if (callSession) {
      const otherParty = callSession.caller.userId === socket.id ? 
        callSession.callee : callSession.caller.userId;
      
      socket.to(otherParty).emit('iceCandidate', {
        callId,
        candidate: candidate
      });
    }
  });

  // Messages du canal de données
  socket.on('dataChannelMessage', (messageData) => {
    const { callId, message } = messageData;
    const callSession = activeCalls.get(callId);
    
    if (callSession) {
      const otherParty = callSession.caller.userId === socket.id ? 
        callSession.callee : callSession.caller.userId;
      
      socket.to(otherParty).emit('dataChannelMessage', {
        callId,
        message: message
      });
    }
  });

  // Live Shopping - Démarrage d'un stream
  socket.on('startLiveStream', (streamData) => {
    const { title, description, products } = streamData;
    const streamer = connectedUsers.get(socket.id);
    
    if (!streamer) {
      socket.emit('streamError', { message: 'Streamer not registered' });
      return;
    }

    const streamId = `stream_${Date.now()}`;
    const liveStream = {
      id: streamId,
      streamer: streamer,
      title: title,
      description: description,
      products: products,
      viewers: new Set(),
      startTime: new Date(),
      status: 'live'
    };

    // Stocker le stream
    socket.join(streamId);
    activeCalls.set(streamId, liveStream);

    // Diffuser l'annonce du stream
    socket.broadcast.emit('liveStreamStarted', {
      streamId,
      streamer: streamer,
      title: title,
      description: description,
      products: products
    });

    console.log(`Live stream started: ${streamId} by ${streamer.userId}`);
  });

  // Rejoindre un stream live
  socket.on('joinLiveStream', (joinData) => {
    const { streamId } = joinData;
    const stream = activeCalls.get(streamId);
    
    if (stream && stream.status === 'live') {
      socket.join(streamId);
      stream.viewers.add(socket.id);
      
      // Notifier le streamer
      socket.to(stream.streamer.userId).emit('viewerJoined', {
        viewer: connectedUsers.get(socket.id),
        viewerCount: stream.viewers.size
      });

      console.log(`Viewer joined stream: ${socket.id} -> ${streamId}`);
    }
  });

  // Interaction avec le stream (chat, achats, etc.)
  socket.on('streamInteraction', (interactionData) => {
    const { streamId, type, data } = interactionData;
    const stream = activeCalls.get(streamId);
    
    if (stream) {
      // Diffuser l'interaction à tous les viewers
      socket.to(streamId).emit('streamInteraction', {
        viewer: connectedUsers.get(socket.id),
        type: type,
        data: data,
        timestamp: new Date()
      });
      
      console.log(`Stream interaction: ${type} from ${socket.id}`);
    }
  });

  // Déconnexion
  socket.on('disconnect', () => {
    const user = connectedUsers.get(socket.id);
    
    if (user) {
      console.log(`User disconnected: ${user.userId}`);
      
      // Nettoyer les appels actifs
      for (const [callId, callSession] of activeCalls) {
        if (callSession.caller?.userId === user.userId || 
            callSession.callee?.userId === user.userId) {
          
          const otherParty = callSession.caller?.userId === user.userId ? 
            callSession.callee?.userId : callSession.caller?.userId;
          
          if (otherParty) {
            socket.to(otherParty).emit('callEnded', {
              callId,
              reason: 'Other party disconnected'
            });
          }
          
          activeCalls.delete(callId);
        }
      }
      
      // Notifier la déconnexion
      socket.broadcast.emit('userOffline', {
        userId: user.userId,
        name: user.name
      });
      
      connectedUsers.delete(socket.id);
    }
  });
});

// Routes API REST
app.get('/api/calls', (req, res) => {
  const calls = Array.from(activeCalls.values()).map(call => ({
    id: call.id,
    caller: call.caller,
    callee: call.callee,
    type: call.type,
    status: call.status,
    startTime: call.startTime,
    endTime: call.endTime
  }));
  
  res.json(calls);
});

app.get('/api/users/online', (req, res) => {
  const onlineUsers = Array.from(connectedUsers.values()).map(user => ({
    userId: user.userId,
    name: user.name,
    role: user.role
  }));
  
  res.json(onlineUsers);
});

app.get('/api/stats', (req, res) => {
  const stats = {
    activeCalls: activeCalls.size,
    onlineUsers: connectedUsers.size,
    timestamp: new Date()
  };
  
  res.json(stats);
});

// Configuration du serveur
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';

server.listen(PORT, HOST, () => {
  console.log(`🚀 WebRTC Signaling Server running on ${HOST}:${PORT}`);
  console.log(`📞 Call management: WebSocket`);
  console.log(`🔊 VoIP integration: Ready for Contabo server`);
  console.log(`📺 Live Shopping: Stream management active`);
});

module.exports = { app, server, io };