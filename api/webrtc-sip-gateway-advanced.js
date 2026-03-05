const WebSocket = require('ws');
const dgram = require('dgram');
const net = require('net');

/**
 * WebRTC-SIP Gateway Server avec fonctionnalités avancées
 * Intégration complète FreePBX/Asterisk pour MangooTech
 */
class WebRTCSIPGatewayServer {
  constructor() {
    this.clients = new Map(); // clientId -> { socket, userId, sipUsername, callSessions: Map }
    this.sipConnections = new Map(); // userId -> { socket, registered, lastPing }
    this.callSessions = new Map(); // callId -> { caller, callee, status, startTime, recording, transfer }
    this.voicemailMessages = new Map(); // userId -> [{ id, caller, timestamp, duration, audioData }]
    this.activeRecordings = new Map(); // callId -> { startTime, audioChunks }
    
    this.wss = null;
    this.sipSocket = null;
    this.sipServer = '194.163.190.74';
    this.sipPort = 5060;
    
    this.init();
  }

  init() {
    this.setupWebSocketServer();
    this.setupSIPConnection();
    this.setupHealthCheck();
    console.log('🚀 WebRTC-SIP Gateway Server démarré');
    console.log(`📞 Connexion SIP: ${this.sipServer}:${this.sipPort}`);
  }

  // Configuration du serveur WebSocket
  setupWebSocketServer() {
    this.wss = new WebSocket.Server({ port: 8080 });
    
    this.wss.on('connection', (ws, req) => {
      const clientId = this.generateId();
      console.log(`🔌 Nouveau client connecté: ${clientId}`);
      
      this.clients.set(clientId, {
        socket: ws,
        userId: null,
        sipUsername: null,
        callSessions: new Map(),
        registered: false
      });
      
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleWebSocketMessage(clientId, message);
        } catch (error) {
          console.error('❌ Erreur de parsing JSON:', error);
          ws.send(JSON.stringify({ type: 'error', error: 'Invalid JSON' }));
        }
      });
      
      ws.on('close', () => {
        console.log(`🔌 Client déconnecté: ${clientId}`);
        this.handleClientDisconnect(clientId);
      });
      
      ws.on('error', (error) => {
        console.error(`❌ Erreur WebSocket client ${clientId}:`, error);
      });
      
      // Envoyer l'ID client
      ws.send(JSON.stringify({
        type: 'client-id',
        clientId: clientId
      }));
    });
    
    console.log('🌐 Serveur WebSocket démarré sur le port 8080');
  }

  // Configuration de la connexion SIP
  setupSIPConnection() {
    this.sipSocket = dgram.createSocket('udp4');
    
    this.sipSocket.on('message', (msg, rinfo) => {
      this.handleSIPMessage(msg, rinfo);
    });
    
    this.sipSocket.on('error', (error) => {
      console.error('❌ Erreur socket SIP:', error);
    });
    
    this.sipSocket.bind(() => {
      console.log('📡 Socket SIP configuré');
    });
  }

  // Gestion des messages WebSocket
  handleWebSocketMessage(clientId, message) {
    const client = this.clients.get(clientId);
    if (!client) {
      console.error(`❌ Client ${clientId} non trouvé`);
      return;
    }
    
    console.log(`📨 Message reçu de ${clientId}:`, message.type);
    
    switch (message.type) {
      case 'register':
        this.handleRegister(clientId, message);
        break;
        
      case 'call':
        this.handleCall(clientId, message);
        break;
        
      case 'answer':
        this.handleAnswer(clientId, message);
        break;
        
      case 'hangup':
        this.handleHangup(clientId, message);
        break;
        
      case 'hold':
        this.handleHold(clientId, message);
        break;
        
      case 'transfer':
        this.handleTransfer(clientId, message);
        break;
        
      case 'recording':
        this.handleRecording(clientId, message);
        break;
        
      case 'voicemail':
        this.handleVoicemail(clientId, message);
        break;
        
      case 'dtmf':
        this.handleDTMF(clientId, message);
        break;
        
      case 'conference':
        this.handleConference(clientId, message);
        break;
        
      default:
        console.log(`Type de message non géré: ${message.type}`);
        client.socket.send(JSON.stringify({
          type: 'error',
          error: `Type de message non supporté: ${message.type}`
        }));
    }
  }

  // Gestion de l'enregistrement SIP
  handleRegister(clientId, message) {
    const client = this.clients.get(clientId);
    if (!client) return;
    
    const { userId, sipUsername, sipPassword, sipDomain, sipServer, sipPort } = message;
    
    client.userId = userId;
    client.sipUsername = sipUsername;
    client.sipDomain = sipDomain;
    client.sipServer = sipServer || this.sipServer;
    client.sipPort = sipPort || this.sipPort;
    
    console.log(`👤 Enregistrement SIP: ${sipUsername}@${sipDomain}`);
    
    // Construction du message SIP REGISTER
    const callId = this.generateCallId();
    const registerSIP = `REGISTER sip:${sipDomain} SIP/2.0
Via: SIP/2.0/UDP ${this.getLocalIP()}:5061;branch=z9hG4bK${this.generateBranch()}
Max-Forwards: 70
From: <sip:${sipUsername}@${sipDomain}>;tag=${this.generateTag()}
To: <sip:${sipUsername}@${sipDomain}>
Call-ID: ${callId}
CSeq: 1 REGISTER
Contact: <sip:${sipUsername}@${this.getLocalIP()}:5061>;transport=udp
Expires: 3600
Content-Length: 0

`;
    
    // Envoyer au serveur SIP
    this.sendSIPMessage(registerSIP, client.sipServer, client.sipPort);
    
    // Stocker la connexion SIP
    this.sipConnections.set(userId, {
      clientId: clientId,
      socket: this.sipSocket,
      registered: false,
      username: sipUsername,
      domain: sipDomain,
      lastPing: Date.now()
    });
    
    client.socket.send(JSON.stringify({
      type: 'register-sent',
      userId: userId,
      sipUsername: sipUsername
    }));
  }

  // Gestion des appels
  handleCall(clientId, message) {
    const client = this.clients.get(clientId);
    if (!client) return;
    
    const { caller, callee, callId } = message;
    
    console.log(`📞 Appel de ${caller} vers ${callee}`);
    
    // Créer la session d'appel
    const session = {
      id: callId || this.generateCallId(),
      caller: caller,
      callee: callee,
      status: 'calling',
      startTime: new Date(),
      recording: false,
      transfer: null
    };
    
    this.callSessions.set(session.id, session);
    client.callSessions.set(session.id, session);
    
    // Trouver le client destinataire
    const targetClient = this.findClientByUsername(callee);
    
    if (targetClient) {
      // Appel WebRTC direct entre navigateurs
      targetClient.socket.send(JSON.stringify({
        type: 'incoming-call',
        callId: session.id,
        caller: caller,
        callee: callee
      }));
      
      client.socket.send(JSON.stringify({
        type: 'call-initiated',
        callId: session.id,
        target: callee
      }));
    } else {
      // Passer par le serveur SIP
      this.initiateSIPCall(session);
    }
  }

  // Réponse à un appel
  handleAnswer(clientId, message) {
    const client = this.clients.get(clientId);
    if (!client) return;
    
    const { callId, callee } = message;
    const session = this.callSessions.get(callId);
    
    if (!session) {
      client.socket.send(JSON.stringify({
        type: 'call-error',
        error: 'Session d\'appel non trouvée'
      }));
      return;
    }
    
    console.log(`✅ Appel répondu: ${callId}`);
    
    session.status = 'connected';
    session.answerTime = new Date();
    
    // Notifier l'appelant
    const callerClient = this.findClientByUsername(session.caller);
    if (callerClient) {
      callerClient.socket.send(JSON.stringify({
        type: 'call-answered',
        callId: callId,
        callee: callee,
        startTime: session.answerTime
      }));
    }
    
    // Notifier le répondant
    client.socket.send(JSON.stringify({
      type: 'call-answered',
      callId: callId,
      startTime: session.answerTime
    }));
  }

  // Raccrocher
  handleHangup(clientId, message) {
    const client = this.clients.get(clientId);
    if (!client) return;
    
    const { callId } = message;
    const session = this.callSessions.get(callId);
    
    if (!session) {
      client.socket.send(JSON.stringify({
        type: 'call-error',
        error: 'Session d\'appel non trouvée'
      }));
      return;
    }
    
    console.log(`🔚 Appel terminé: ${callId}`);
    
    session.status = 'ended';
    session.endTime = new Date();
    session.duration = Math.floor((session.endTime - session.startTime) / 1000);
    
    // Si l'appel était enregistré, sauvegarder la messagerie vocale
    if (session.recording && session.duration > 5) {
      this.saveVoicemailMessage(session);
    }
    
    // Notifier tous les participants
    this.notifyCallParticipants(callId, 'call-ended', {
      callId: callId,
      duration: session.duration
    });
    
    // Nettoyer la session
    this.callSessions.delete(callId);
    
    // Nettoyer les sessions client
    this.clients.forEach(client => {
      client.callSessions.delete(callId);
    });
  }

  // Mise en attente
  handleHold(clientId, message) {
    const client = this.clients.get(clientId);
    if (!client) return;
    
    const { callId, hold } = message;
    const session = this.callSessions.get(callId);
    
    if (!session) return;
    
    session.onHold = hold;
    
    this.notifyCallParticipants(callId, 'hold-status', {
      callId: callId,
      onHold: hold
    });
  }

  // Transfert d'appel
  handleTransfer(clientId, message) {
    const client = this.clients.get(clientId);
    if (!client) return;
    
    const { callId, target } = message;
    const session = this.callSessions.get(callId);
    
    if (!session) return;
    
    console.log(`🔄 Transfert d'appel ${callId} vers ${target}`);
    
    session.transfer = {
      from: session.callee,
      to: target,
      timestamp: new Date()
    };
    
    // Trouver le client cible du transfert
    const targetClient = this.findClientByUsername(target);
    
    if (targetClient) {
      // Transfert WebRTC direct
      targetClient.socket.send(JSON.stringify({
        type: 'transfer-request',
        callId: callId,
        from: session.caller,
        originalCallee: session.callee
      }));
      
      client.socket.send(JSON.stringify({
        type: 'transfer-initiated',
        callId: callId,
        target: target
      }));
    } else {
      // Transfert via SIP
      this.transferSIPCall(session, target);
    }
  }

  // Enregistrement d'appel
  handleRecording(clientId, message) {
    const client = this.clients.get(clientId);
    if (!client) return;
    
    const { callId, recording } = message;
    const session = this.callSessions.get(callId);
    
    if (!session) return;
    
    session.recording = recording;
    
    if (recording) {
      // Démarrer l'enregistrement
      this.activeRecordings.set(callId, {
        startTime: new Date(),
        audioChunks: []
      });
      
      console.log(`🔴 Enregistrement démarré: ${callId}`);
    } else {
      // Arrêter l'enregistrement
      const recordingData = this.activeRecordings.get(callId);
      if (recordingData) {
        console.log(`⏹️ Enregistrement arrêté: ${callId} (${recordingData.audioChunks.length} chunks)`);
        this.activeRecordings.delete(callId);
      }
    }
    
    this.notifyCallParticipants(callId, 'recording-status', {
      callId: callId,
      recording: recording
    });
  }

  // Messagerie vocale
  handleVoicemail(clientId, message) {
    const client = this.clients.get(clientId);
    if (!client) return;
    
    const { callId } = message;
    const session = this.callSessions.get(callId);
    
    if (!session) return;
    
    console.log(`📮 Envoi vers la messagerie vocale: ${callId}`);
    
    // Créer un message vocal immédiatement
    this.saveVoicemailMessage(session);
    
    // Notifier l'appelant
    this.notifyCallParticipants(callId, 'voicemail-sent', {
      callId: callId,
      message: 'Appel transféré vers la messagerie vocale'
    });
    
    // Terminer l'appel
    this.handleHangup(clientId, { callId: callId });
  }

  // DTMF (tonalités)
  handleDTMF(clientId, message) {
    const client = this.clients.get(clientId);
    if (!client) return;
    
    const { callId, digit } = message;
    const session = this.callSessions.get(callId);
    
    if (!session) return;
    
    console.log(`🔢 DTMF: ${digit} dans l'appel ${callId}`);
    
    // Envoyer le DTMF via SIP
    this.sendDTMFOverSIP(session, digit);
    
    // Notifier les participants
    this.notifyCallParticipants(callId, 'dtmf-sent', {
      callId: callId,
      digit: digit
    });
  }

  // Conférence
  handleConference(clientId, message) {
    const client = this.clients.get(clientId);
    if (!client) return;
    
    const { callId, action, participants } = message;
    
    console.log(`👥 Conférence ${action}: ${callId}`);
    
    switch (action) {
      case 'create':
        this.createConference(callId, participants);
        break;
        
      case 'add':
        this.addToConference(callId, participants);
        break;
        
      case 'remove':
        this.removeFromConference(callId, participants);
        break;
        
      case 'end':
        this.endConference(callId);
        break;
    }
  }

  // Gestion des messages SIP
  handleSIPMessage(message, rinfo) {
    const messageStr = message.toString();
    console.log('📨 Message SIP reçu:', messageStr.substring(0, 200));
    
    // Parser le message SIP
    const lines = messageStr.split('\r\n');
    const firstLine = lines[0];
    
    if (firstLine.includes('SIP/2.0')) {
      // Réponse SIP
      const statusMatch = firstLine.match(/SIP\/2\.0 (\d+) (.+)/);
      if (statusMatch) {
        const statusCode = parseInt(statusMatch[1]);
        const statusText = statusMatch[2];
        this.handleSIPResponse(statusCode, statusText, lines);
      }
    } else {
      // Requête SIP
      const requestMatch = firstLine.match(/(\w+) sip:(.+) SIP\/2\.0/);
      if (requestMatch) {
        const method = requestMatch[1];
        const uri = requestMatch[2];
        this.handleSIPRequest(method, uri, lines);
      }
    }
  }

  // Gestion des réponses SIP
  handleSIPResponse(statusCode, statusText, lines) {
    console.log(`📡 Réponse SIP: ${statusCode} ${statusText}`);
    
    // Trouver le Call-ID
    const callIdLine = lines.find(line => line.startsWith('Call-ID:'));
    const callId = callIdLine ? callIdLine.split(':')[1].trim() : null;
    
    if (callId) {
      const session = this.callSessions.get(callId);
      if (session) {
        // Notifier les clients WebSocket
        this.notifyCallParticipants(callId, 'sip-response', {
          callId: callId,
          statusCode: statusCode,
          statusText: statusText
        });
      }
    }
    
    switch (statusCode) {
      case 200:
        console.log('✅ Succès SIP');
        break;
        
      case 401:
        console.log('🔒 Authentification requise');
        // Gérer l'authentification SIP
        this.handleSIPAuthentication(callId, lines);
        break;
        
      case 404:
        console.log('❌ Destinataire non trouvé');
        break;
        
      case 486:
        console.log('📞 Ligne occupée');
        break;
        
      case 603:
        console.log('❌ Appel refusé');
        break;
    }
  }

  // Gestion des requêtes SIP
  handleSIPRequest(method, uri, lines) {
    console.log(`📤 Requête SIP: ${method} ${uri}`);
    
    switch (method) {
      case 'INVITE':
        this.handleSIPInvite(uri, lines);
        break;
        
      case 'BYE':
        this.handleSIPBye(uri, lines);
        break;
        
      case 'CANCEL':
        this.handleSIPCancel(uri, lines);
        break;
        
      case 'ACK':
        this.handleSIPAck(uri, lines);
        break;
    }
  }

  // Méthodes utilitaires
  generateId() {
    return Math.random().toString(36).substr(2, 9);
  }
  
  generateCallId() {
    return `${this.generateId()}@${this.getLocalIP()}`;
  }
  
  generateBranch() {
    return `z9hG4bK${this.generateId()}`;
  }
  
  generateTag() {
    return this.generateId();
  }
  
  getLocalIP() {
    const interfaces = require('os').networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        if (iface.family === 'IPv4' && !iface.internal) {
          return iface.address;
        }
      }
    }
    return '127.0.0.1';
  }
  
  findClientByUsername(username) {
    for (const [clientId, client] of this.clients) {
      if (client.userId === username || client.sipUsername === username) {
        return client;
      }
    }
    return null;
  }
  
  sendSIPMessage(message, server, port) {
    if (this.sipSocket) {
      this.sipSocket.send(message, port, server, (error) => {
        if (error) {
          console.error('❌ Erreur envoi SIP:', error);
        } else {
          console.log(`📤 Message SIP envoyé à ${server}:${port}`);
        }
      });
    }
  }
  
  notifyCallParticipants(callId, type, data) {
    this.clients.forEach(client => {
      if (client.callSessions.has(callId)) {
        client.socket.send(JSON.stringify({
          type: type,
          ...data
        }));
      }
    });
  }
  
  handleClientDisconnect(clientId) {
    const client = this.clients.get(clientId);
    if (client) {
      // Nettoyer les sessions d'appel
      client.callSessions.forEach((session, callId) => {
        this.callSessions.delete(callId);
      });
      
      // Nettoyer la connexion SIP
      if (client.userId) {
        this.sipConnections.delete(client.userId);
      }
      
      this.clients.delete(clientId);
    }
  }
  
  initiateSIPCall(session) {
    // Implémentation de l'appel SIP
    console.log(`📞 Appel SIP initié: ${session.caller} -> ${session.callee}`);
    
    const inviteSIP = `INVITE sip:${session.callee}@${this.sipServer} SIP/2.0
Via: SIP/2.0/UDP ${this.getLocalIP()}:5061;branch=z9hG4bK${this.generateBranch()}
Max-Forwards: 70
From: <sip:${session.caller}@${this.sipServer}>;tag=${this.generateTag()}
To: <sip:${session.callee}@${this.sipServer}>
Call-ID: ${session.id}
CSeq: 1 INVITE
Contact: <sip:${session.caller}@${this.getLocalIP()}:5061>;transport=udp
Content-Type: application/sdp
Content-Length: 0

`;
    
    this.sendSIPMessage(inviteSIP, this.sipServer, this.sipPort);
  }
  
  transferSIPCall(session, target) {
    console.log(`🔄 Transfert SIP: ${session.callee} -> ${target}`);
    
    // Implémentation du transfert SIP (REFER)
    const referSIP = `REFER sip:${session.callee}@${this.sipServer} SIP/2.0
Via: SIP/2.0/UDP ${this.getLocalIP()}:5061;branch=z9hG4bK${this.generateBranch()}
Max-Forwards: 70
From: <sip:${session.caller}@${this.sipServer}>;tag=${this.generateTag()}
To: <sip:${session.callee}@${this.sipServer}>
Call-ID: ${session.id}
CSeq: 2 REFER
Contact: <sip:${session.caller}@${this.getLocalIP()}:5061>;transport=udp
Refer-To: <sip:${target}@${this.sipServer}>
Referred-By: <sip:${session.caller}@${this.sipServer}>
Content-Length: 0

`;
    
    this.sendSIPMessage(referSIP, this.sipServer, this.sipPort);
  }
  
  saveVoicemailMessage(session) {
    const voicemail = {
      id: `vm-${Date.now()}`,
      caller: session.caller,
      callee: session.callee,
      timestamp: new Date(),
      duration: session.duration,
      callId: session.id
    };
    
    // Stocker pour le destinataire
    const userVoicemails = this.voicemailMessages.get(session.callee) || [];
    userVoicemails.push(voicemail);
    this.voicemailMessages.set(session.callee, userVoicemails);
    
    console.log(`📮 Message vocal sauvegardé: ${voicemail.id}`);
    
    // Notifier le destinataire
    const calleeClient = this.findClientByUsername(session.callee);
    if (calleeClient) {
      calleeClient.socket.send(JSON.stringify({
        type: 'voicemail-received',
        messageId: voicemail.id,
        caller: voicemail.caller,
        timestamp: voicemail.timestamp,
        duration: voicemail.duration
      }));
    }
  }
  
  sendDTMFOverSIP(session, digit) {
    // Implémentation DTMF via SIP INFO
    const infoSIP = `INFO sip:${session.callee}@${this.sipServer} SIP/2.0
Via: SIP/2.0/UDP ${this.getLocalIP()}:5061;branch=z9hG4bK${this.generateBranch()}
Max-Forwards: 70
From: <sip:${session.caller}@${this.sipServer}>;tag=${this.generateTag()}
To: <sip:${session.callee}@${this.sipServer}>
Call-ID: ${session.id}
CSeq: 3 INFO
Content-Type: application/dtmf-relay
Content-Length: ${digit.length + 10}

Signal=${digit}
Duration=250
`;
    
    this.sendSIPMessage(infoSIP, this.sipServer, this.sipPort);
  }
  
  setupHealthCheck() {
    // Vérification de la santé toutes les 30 secondes
    setInterval(() => {
      this.checkSIPConnections();
      this.cleanupExpiredSessions();
    }, 30000);
  }
  
  checkSIPConnections() {
    const now = Date.now();
    this.sipConnections.forEach((connection, userId) => {
      if (now - connection.lastPing > 60000) { // 1 minute
        console.log(`⚠️ Connexion SIP expirée: ${userId}`);
        this.sipConnections.delete(userId);
      }
    });
  }
  
  cleanupExpiredSessions() {
    const now = Date.now();
    this.callSessions.forEach((session, callId) => {
      if (session.status === 'ended' && now - session.endTime.getTime() > 300000) { // 5 minutes
        console.log(`🧹 Nettoyage session expirée: ${callId}`);
        this.callSessions.delete(callId);
      }
    });
  }
}

// Démarrer le serveur
const server = new WebRTCSIPGatewayServer();

console.log('🎯 WebRTC-SIP Gateway Server prêt');
console.log('🔗 WebSocket: ws://localhost:8080');
console.log(`📞 SIP Gateway: ${server.sipServer}:${server.sipPort}`);

module.exports = WebRTCSIPGatewayServer;