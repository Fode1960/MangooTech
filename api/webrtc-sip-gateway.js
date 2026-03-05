const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const SIPGateway = require('./sip-gateway');

/**
 * WebRTC-SIP Gateway Server
 * Connecte les clients WebRTC au système FreePBX/Asterisk
 */
class WebRTCSIPGatewayServer {
  constructor(port = 8080) {
    this.port = port;
    this.app = express();
    this.server = http.createServer(this.app);
    this.io = socketIo(this.server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });
    
    this.sipGateway = new SIPGateway();
    this.connectedClients = new Map();
    this.activeCalls = new Map();
    
    this.setupMiddleware();
    this.setupRoutes();
    this.setupSocketHandlers();
    this.setupSIPGatewayEvents();
  }

  setupMiddleware() {
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.static('public'));
  }

  setupRoutes() {
    // Route de statut
    this.app.get('/api/status', (req, res) => {
      const stats = this.sipGateway.getStats();
      res.json({
        status: 'running',
        timestamp: new Date().toISOString(),
        sipGateway: stats,
        connectedClients: this.connectedClients.size,
        activeCalls: this.activeCalls.size
      });
    });

    // Route pour obtenir les appels actifs
    this.app.get('/api/calls', (req, res) => {
      res.json({
        calls: Array.from(this.activeCalls.values()),
        clients: Array.from(this.connectedClients.entries()).map(([id, client]) => ({
          id,
          userId: client.userId,
          connectedAt: client.connectedAt
        }))
      });
    });

    // Route pour terminer un appel
    this.app.post('/api/calls/:callId/end', (req, res) => {
      const { callId } = req.params;
      try {
        this.sipGateway.terminateCall(callId);
        this.activeCalls.delete(callId);
        res.json({ success: true, message: 'Appel terminé' });
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });

    // Route pour enregistrer un utilisateur
    this.app.post('/api/register', (req, res) => {
      const { userId, sipCredentials } = req.body;
      try {
        this.sipGateway.registerUser(userId, sipCredentials);
        res.json({ success: true, message: 'Utilisateur enregistré' });
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });
  }

  setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`🔌 Client connecté: ${socket.id}`);

      socket.on('register', (data) => {
        this.handleClientRegister(socket, data);
      });

      socket.on('offer', (data) => {
        this.handleOffer(socket, data);
      });

      socket.on('answer', (data) => {
        this.handleAnswer(socket, data);
      });

      socket.on('ice-candidate', (data) => {
        this.handleIceCandidate(socket, data);
      });

      socket.on('end-call', (data) => {
        this.handleEndCall(socket, data);
      });

      socket.on('test-connection', (data) => {
        console.log('Test de connexion reçu:', data);
        socket.emit('connection-test-response', { 
          success: true, 
          timestamp: Date.now(),
          message: 'Connexion WebSocket fonctionnelle'
        });
      });

      socket.on('disconnect', () => {
        this.handleClientDisconnect(socket);
      });
    });
  }

  setupSIPGatewayEvents() {
    this.sipGateway.on('incomingCall', (data) => {
      // Trouver le socket du destinataire et lui envoyer l'appel spécifiquement
      const calleeSocket = this.findClientSocket(data.callee);
      if (calleeSocket) {
        calleeSocket.emit('incoming-call', data);
        console.log(`📞 Appel entrant envoyé à ${data.callee}`);
      } else {
        console.warn(`⚠️ Client ${data.callee} non trouvé pour l'appel entrant`);
      }
    });

    this.sipGateway.on('callAnswered', (data) => {
      // Diffuser à toutes les sessions pour synchronisation
      this.io.emit('call-answered', data);
    });

    this.sipGateway.on('callEnded', (data) => {
      this.io.emit('call-ended', data);
      this.activeCalls.delete(data.callId);
    });

    this.sipGateway.on('error', (error) => {
      console.error('SIP Gateway Error:', error);
      this.io.emit('gateway-error', { error: error.message });
    });

    // Ajouter une diffusion régulière du temps d'appel pour synchronisation (optionnelle)
    // Retiré pour éviter les conflits - laisser chaque client gérer son propre compteur
  }

  handleClientRegister(socket, data) {
    const { userId, sipCredentials } = data;
    
    this.connectedClients.set(socket.id, {
      socket,
      userId,
      sipCredentials,
      connectedAt: new Date()
    });

    try {
      this.sipGateway.registerUser(userId, sipCredentials);
      socket.emit('registered', { success: true });
      console.log(`👤 Utilisateur enregistré: ${userId}`);
    } catch (error) {
      socket.emit('registration-failed', { error: error.message });
      console.error(`❌ Échec enregistrement: ${error.message}`);
    }
  }

  handleOffer(socket, data) {
    const { targetUserId, offer, callId } = data;
    const client = this.connectedClients.get(socket.id);
    
    if (!client) {
      socket.emit('error', { message: 'Client non enregistré' });
      return;
    }

    try {
      // Trouver le socket du destinataire pour l'appel WebRTC direct
      const targetSocket = this.findClientSocket(targetUserId);
      
      if (!targetSocket) {
        socket.emit('call-error', { error: 'Destinataire non connecté' });
        console.warn(`⚠️ Destinataire ${targetUserId} non trouvé`);
        return;
      }

      // Créer l'appel WebRTC direct (sans passer par SIP)
      const webrtcCallId = callId || `webrtc-${Date.now()}`;

      this.activeCalls.set(webrtcCallId, {
        id: webrtcCallId,
        caller: client.userId,
        callee: targetUserId,
        status: 'initiating',
        startTime: new Date(),
        callerSocketId: socket.id,
        calleeSocketId: targetSocket.id,
        callerUserId: client.userId,
        calleeUserId: targetUserId
      });

      // Envoyer l'offre au destinataire
      targetSocket.emit('incoming-call', {
        callId: webrtcCallId,
        caller: client.userId,
        callee: targetUserId,
        sdp: offer.sdp
      });

      socket.emit('call-initiated', { 
        callId: webrtcCallId,
        startTime: this.activeCalls.get(webrtcCallId).startTime.toISOString()
      });
      
      console.log(`📞 Appel WebRTC initié: ${client.userId} → ${targetUserId}`);

    } catch (error) {
      socket.emit('call-error', { error: error.message });
      console.error(`❌ Échec appel: ${error.message}`);
    }
  }

  handleAnswer(socket, data) {
    const { callId, answer } = data;
    
    try {
      const call = this.activeCalls.get(callId);
      if (!call) {
        socket.emit('answer-error', { error: 'Appel non trouvé' });
        return;
      }

      call.status = 'answered';
      
      // Envoyer la réponse complète (avec SDP) à l'appelant (caller)
      const callerSocket = this.findClientSocket(call.caller);
      if (callerSocket) {
        callerSocket.emit('call-answered', { 
          callId, 
          answer: answer,
          startTime: call.startTime.toISOString()
        });
      }

      // Informer le répondant que l'appel est établi
      socket.emit('call-answered', { 
        callId, 
        startTime: call.startTime.toISOString()
      });

      console.log(`✅ Appel WebRTC répondu: ${callId}`);
    } catch (error) {
      socket.emit('answer-error', { error: error.message });
      console.error(`❌ Échec réponse: ${error.message}`);
    }
  }

  handleIceCandidate(socket, data) {
    // Router les candidats ICE au bon participant
    const { callId, candidate } = data;
    
    const call = this.activeCalls.get(callId);
    if (!call) {
      console.log(`⚠️ Appel ${callId} non trouvé pour candidat ICE`);
      return;
    }

    // Déterminer si c'est l'appelant ou le répondant
    const isCaller = call.callerSocketId === socket.id;
    const targetSocketId = isCaller ? call.calleeSocketId : call.callerSocketId;
    
    if (targetSocketId) {
      const targetSocket = this.connectedClients.get(targetSocketId)?.socket;
      if (targetSocket) {
        targetSocket.emit('ice-candidate', {
          callId,
          candidate
        });
        console.log(`🧊 ICE candidate routed: ${isCaller ? 'caller' : 'callee'} → ${isCaller ? 'callee' : 'caller'}`);
      } else {
        console.log(`⚠️ Socket cible non trouvé pour ${isCaller ? 'callee' : 'caller'}`);
      }
    } else {
      console.log(`⚠️ ID socket cible non défini`);
    }
  }

  findClientSocket(userId) {
    // Trouver le socket d'un client par son userId
    for (const [socketId, client] of this.connectedClients) {
      if (client.userId === userId) {
        return client.socket;
      }
    }
    return null;
  }

  handleEndCall(socket, data) {
    const { callId } = data;
    
    try {
      this.sipGateway.terminateCall(callId);
      this.activeCalls.delete(callId);
      
      // Notifier tous les participants
      this.io.emit('call-ended', { callId });
      
      console.log(`🔚 Appel terminé: ${callId}`);
    } catch (error) {
      socket.emit('end-call-error', { error: error.message });
      console.error(`❌ Échec fin appel: ${error.message}`);
    }
  }

  handleClientDisconnect(socket) {
    const client = this.connectedClients.get(socket.id);
    if (client) {
      console.log(`🔌 Client déconnecté: ${client.userId}`);
      this.connectedClients.delete(socket.id);
      
      // Nettoyer les appels associés
      this.activeCalls.forEach((call, callId) => {
        if (call.socketId === socket.id) {
          try {
            this.sipGateway.terminateCall(callId);
            this.activeCalls.delete(callId);
            this.io.emit('call-ended', { callId, reason: 'participant-disconnected' });
          } catch (error) {
            console.error(`Erreur nettoyage appel ${callId}:`, error);
          }
        }
      });
    }
  }

  start() {
    this.server.listen(this.port, () => {
      console.log(`🚀 WebRTC-SIP Gateway Server démarré sur le port ${this.port}`);
      console.log(`🔗 Connexion WebSocket: ws://localhost:${this.port}`);
      console.log(`📞 Connexion SIP: ${this.sipGateway.sipServer}:${this.sipGateway.sipPort}`);
    });
  }

  stop() {
    this.server.close(() => {
      console.log('🛑 Serveur WebRTC-SIP Gateway arrêté');
    });
  }
}

// Démarrer le serveur si ce fichier est exécuté directement
if (require.main === module) {
  const port = process.env.SIP_GATEWAY_PORT || 8080;
  const server = new WebRTCSIPGatewayServer(port);
  server.start();
}

module.exports = WebRTCSIPGatewayServer;