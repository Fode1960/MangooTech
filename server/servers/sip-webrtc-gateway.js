/**
 * SIP-WebRTC Gateway
 * Pont ultime entre FreePBX/Asterisk et WebRTC
 * Permet les appels entre téléphones SIP et navigateurs Web
 */

const dgram = require('dgram');
const WebSocket = require('ws');
const express = require('express');
const cors = require('cors');

/**
 * Configuration du Gateway
 */
const CONFIG = {
  // Connexion SIP vers FreePBX/Asterisk
  SIP_SERVER: process.env.SIP_SERVER || '194.163.190.74',
  SIP_PORT: process.env.SIP_PORT || 5060,
  SIP_DOMAIN: process.env.SIP_DOMAIN || 'mangootech.com',
  
  // Connexion WebRTC
  WEBRTC_SIGNALING: process.env.WEBRTC_SIGNALING || 'ws://localhost:8080',
  TURN_SERVER: process.env.TURN_SERVER || '194.163.190.74:3478',
  
  // Gateway
  GATEWAY_PORT: process.env.GATEWAY_PORT || 9091,
  
  // Authentification
  SIP_USERNAME: process.env.SIP_USERNAME || 'gateway',
  SIP_PASSWORD: process.env.SIP_PASSWORD || 'gateway_secret_2024'
};

/**
 * SIP Message Parser
 */
class SIPParser {
  static parseMessage(message) {
    const lines = message.split('\r\n');
    const firstLine = lines[0];
    const headers = {};
    let body = '';
    let inBody = false;
    
    // Parser la première ligne
    const parts = firstLine.split(' ');
    const method = parts[0];
    const uri = parts[1];
    const version = parts[2];
    
    // Parser les headers
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (line === '') {
        inBody = true;
        continue;
      }
      
      if (inBody) {
        body += line + '\r\n';
      } else {
        const colonIndex = line.indexOf(':');
        if (colonIndex > -1) {
          const headerName = line.substring(0, colonIndex).trim();
          const headerValue = line.substring(colonIndex + 1).trim();
          headers[headerName.toLowerCase()] = headerValue;
        }
      }
    }
    
    return {
      method,
      uri,
      version,
      headers,
      body: body.trim()
    };
  }
  
  static buildMessage(method, uri, headers = {}, body = '') {
    let message = `${method} ${uri} SIP/2.0\r\n`;
    
    for (const [key, value] of Object.entries(headers)) {
      message += `${key}: ${value}\r\n`;
    }
    
    if (body) {
      message += `Content-Length: ${Buffer.byteLength(body)}\r\n`;
      message += '\r\n';
      message += body;
    } else {
      message += 'Content-Length: 0\r\n';
      message += '\r\n';
    }
    
    return message;
  }
}

/**
 * WebRTC-SIP Call Bridge
 */
class CallBridge {
  constructor(sipGateway, webrtcGateway) {
    this.sipGateway = sipGateway;
    this.webrtcGateway = webrtcGateway;
    this.activeCalls = new Map(); // callId -> callInfo
    this.callIdCounter = 0;
  }
  
  generateCallId() {
    return `call_${Date.now()}_${++this.callIdCounter}`;
  }
  
  /**
   * Appel WebRTC vers SIP
   */
  async makeWebRTCToSIPCall(webrtcPeerId, sipNumber, webrtcData) {
    const callId = this.generateCallId();
    
    console.log(`[GATEWAY] WebRTC→SIP Call: ${webrtcPeerId} → ${sipNumber}`);
    
    const callInfo = {
      id: callId,
      direction: 'webrtc-to-sip',
      webrtcPeerId: webrtcPeerId,
      sipNumber: sipNumber,
      status: 'initiating',
      startTime: new Date(),
      webrtcData: webrtcData
    };
    
    this.activeCalls.set(callId, callInfo);
    
    // Créer l'invitation SIP
    const from = `gateway@${CONFIG.SIP_DOMAIN}`;
    const to = `${sipNumber}@${CONFIG.SIP_DOMAIN}`;
    const via = `SIP/2.0/UDP ${CONFIG.SIP_SERVER}:${CONFIG.SIP_PORT};branch=z9hG4bK${callId}`;
    
    const inviteMessage = SIPParser.buildMessage('INVITE', `sip:${to}`, {
      'Via': via,
      'From': `<sip:${from}>;tag=${callId}_from`,
      'To': `<sip:${to}>`,
      'Call-ID': callId,
      'CSeq': '1 INVITE',
      'Contact': `<sip:${from}>`,
      'Content-Type': 'application/sdp',
      'Allow': 'INVITE, ACK, CANCEL, OPTIONS, BYE, REFER, NOTIFY, MESSAGE, SUBSCRIBE, INFO',
      'Max-Forwards': '70',
      'User-Agent': 'Mangootech-SIP-Gateway/1.0'
    }, webrtcData.sdp);
    
    // Envoyer l'invitation SIP
    this.sipGateway.sendSIPMessage(inviteMessage, CONFIG.SIP_SERVER, CONFIG.SIP_PORT);
    
    return callId;
  }
  
  /**
   * Appel SIP vers WebRTC
   */
  async makeSIPToWebRTCCall(sipCallId, fromSip, webrtcTargetId, sipData) {
    const callId = this.generateCallId();
    
    console.log(`[GATEWAY] SIP→WebRTC Call: ${fromSip} → ${webrtcTargetId}`);
    
    const callInfo = {
      id: callId,
      direction: 'sip-to-webrtc',
      sipCallId: sipCallId,
      fromSip: fromSip,
      webrtcTargetId: webrtcTargetId,
      status: 'initiating',
      startTime: new Date(),
      sipData: sipData
    };
    
    this.activeCalls.set(callId, callInfo);
    
    // Créer l'offre WebRTC
    const offerData = {
      type: 'offer',
      sdp: sipData.sdp,
      from: fromSip,
      callId: callId
    };
    
    // Envoyer l'offre au client WebRTC
    this.webrtcGateway.sendToPeer(webrtcTargetId, 'incoming-call', offerData);
    
    return callId;
  }
  
  /**
   * Terminer un appel
   */
  endCall(callId, reason = 'normal-clearing') {
    const callInfo = this.activeCalls.get(callId);
    if (!callInfo) {
      console.warn(`[GATEWAY] Appel inconnu: ${callId}`);
      return;
    }
    
    console.log(`[GATEWAY] Fin d'appel: ${callId} (${reason})`);
    
    if (callInfo.direction === 'webrtc-to-sip') {
      // Envoyer BYE vers SIP
      const byeMessage = SIPParser.buildMessage('BYE', `sip:${callInfo.sipNumber}@${CONFIG.SIP_DOMAIN}`, {
        'Via': `SIP/2.0/UDP ${CONFIG.SIP_SERVER}:${CONFIG.SIP_PORT}`,
        'From': `<sip:gateway@${CONFIG.SIP_DOMAIN}>;tag=${callId}_from`,
        'To': `<sip:${callInfo.sipNumber}@${CONFIG.SIP_DOMAIN}>`,
        'Call-ID': callId,
        'CSeq': '2 BYE'
      });
      
      this.sipGateway.sendSIPMessage(byeMessage, CONFIG.SIP_SERVER, CONFIG.SIP_PORT);
      
      // Notifier WebRTC
      this.webrtcGateway.sendToPeer(callInfo.webrtcPeerId, 'call-ended', { callId, reason });
      
    } else if (callInfo.direction === 'sip-to-webrtc') {
      // Notifier WebRTC
      this.webrtcGateway.sendToPeer(callInfo.webrtcTargetId, 'call-ended', { callId, reason });
    }
    
    callInfo.status = 'ended';
    callInfo.endTime = new Date();
    callInfo.duration = callInfo.endTime - callInfo.startTime;
    
    // Supprimer après un délai
    setTimeout(() => {
      this.activeCalls.delete(callId);
    }, 5000);
  }
  
  /**
   * Obtenir les statistiques d'appel
   */
  getCallStats() {
    const stats = {
      totalCalls: this.activeCalls.size,
      activeCalls: Array.from(this.activeCalls.values()).map(call => ({
        id: call.id,
        direction: call.direction,
        status: call.status,
        duration: call.duration || (new Date() - call.startTime),
        webrtcPeer: call.webrtcPeerId || call.webrtcTargetId,
        sipNumber: call.sipNumber || call.fromSip
      }))
    };
    
    return stats;
  }
}

/**
 * SIP Gateway
 */
class SIPGateway {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.bridge = null;
  }
  
  setBridge(bridge) {
    this.bridge = bridge;
  }
  
  /**
   * Connexion au serveur SIP (FreePBX/Asterisk)
   */
  connect() {
    this.socket = dgram.createSocket('udp4');
    
    this.socket.on('message', (msg, rinfo) => {
      this.handleSIPMessage(msg.toString(), rinfo);
    });
    
    this.socket.on('error', (err) => {
      console.error('[SIP] Erreur:', err);
    });
    
    this.socket.on('listening', () => {
      const address = this.socket.address();
      console.log(`[SIP] Gateway SIP écoutant sur ${address.address}:${address.port}`);
      this.isConnected = true;
    });
    
    this.socket.bind(0); // Port aléatoire
    
    // S'enregistrer auprès du serveur SIP
    this.registerWithSIPServer();
  }
  
  /**
   * Enregistrement SIP
   */
  registerWithSIPServer() {
    const callId = `reg_${Date.now()}`;
    const from = `gateway@${CONFIG.SIP_DOMAIN}`;
    
    const registerMessage = SIPParser.buildMessage('REGISTER', `sip:${CONFIG.SIP_DOMAIN}`, {
      'Via': `SIP/2.0/UDP ${CONFIG.SIP_SERVER}:${CONFIG.SIP_PORT};branch=z9hG4bK${callId}`,
      'From': `<sip:${from}>;tag=${callId}_reg`,
      'To': `<sip:${from}>`,
      'Call-ID': callId,
      'CSeq': '1 REGISTER',
      'Contact': `<sip:${from}>`,
      'Expires': '3600',
      'Authorization': `Digest username="${CONFIG.SIP_USERNAME}", realm="${CONFIG.SIP_DOMAIN}", nonce="", uri="sip:${CONFIG.SIP_DOMAIN}", response=""`
    });
    
    this.sendSIPMessage(registerMessage, CONFIG.SIP_SERVER, CONFIG.SIP_PORT);
    console.log('[SIP] Enregistrement envoyé');
  }
  
  /**
   * Envoyer un message SIP
   */
  sendSIPMessage(message, host, port) {
    if (!this.socket) {
      console.error('[SIP] Socket non connecté');
      return;
    }
    
    this.socket.send(message, port, host, (error) => {
      if (error) {
        console.error('[SIP] Erreur envoi:', error);
      } else {
        console.log(`[SIP] Message envoyé à ${host}:${port}`);
      }
    });
  }
  
  /**
   * Traiter un message SIP reçu
   */
  handleSIPMessage(message, rinfo) {
    console.log(`[SIP] Message reçu de ${rinfo.address}:${rinfo.port}`);
    
    try {
      const parsed = SIPParser.parseMessage(message);
      console.log('[SIP] Message parsé:', parsed.method || parsed.status);
      
      if (parsed.method === 'INVITE') {
        this.handleIncomingCall(parsed, rinfo);
      } else if (parsed.method === 'BYE') {
        this.handleCallEnd(parsed);
      } else if (parsed.status && parsed.status.startsWith('200')) {
        this.handleSuccessResponse(parsed);
      }
      
    } catch (error) {
      console.error('[SIP] Erreur parsing:', error);
    }
  }
  
  /**
   * Gérer un appel entrant SIP
   */
  handleIncomingCall(sipMessage, rinfo) {
    const from = sipMessage.headers['from'];
    const to = sipMessage.headers['to'];
    const callId = sipMessage.headers['call-id'];
    
    console.log(`[SIP] Appel entrant de ${from} vers ${to}`);
    
    // Extraire le numéro de téléphone
    const sipNumber = this.extractPhoneNumber(from);
    const targetNumber = this.extractPhoneNumber(to);
    
    // Trouver le client WebRTC correspondant (par numéro ou ID)
    const webrtcTargetId = this.findWebRTCTarget(targetNumber);
    
    if (webrtcTargetId && this.bridge) {
      this.bridge.makeSIPToWebRTCCall(callId, sipNumber, webrtcTargetId, {
        sdp: sipMessage.body,
        from: sipNumber,
        to: targetNumber
      });
    } else {
      console.warn(`[SIP] Aucune cible WebRTC trouvée pour ${targetNumber}`);
      
      // Envoyer une réponse d'erreur
      const response = SIPParser.buildMessage('SIP/2.0 404 Not Found', '', {
        'Via': sipMessage.headers['via'],
        'From': sipMessage.headers['from'],
        'To': sipMessage.headers['to'],
        'Call-ID': callId,
        'CSeq': sipMessage.headers['cseq']
      });
      
      this.sendSIPMessage(response, rinfo.address, rinfo.port);
    }
  }
  
  /**
   * Extraire un numéro de téléphone d'un header SIP
   */
  extractPhoneNumber(sipHeader) {
    const match = sipHeader.match(/sip:([^@>]+)/);
    return match ? match[1] : '';
  }
  
  /**
   * Trouver la cible WebRTC (à implémenter selon votre logique)
   */
  findWebRTCTarget(sipNumber) {
    // Logique pour mapper un numéro SIP à un ID WebRTC
    // Par exemple : "1001" → "user_123" ou "vendor_456"
    const mapping = {
      '1001': 'vendor_demo',
      '1002': 'customer_demo',
      'support': 'support_agent'
    };
    
    return mapping[sipNumber] || null;
  }
  
  handleCallEnd(sipMessage) {
    const callId = sipMessage.headers['call-id'];
    if (this.bridge) {
      this.bridge.endCall(callId, 'remote-ended');
    }
  }
  
  handleSuccessResponse(sipMessage) {
    console.log('[SIP] Réponse succès:', sipMessage.status);
    // Traiter les réponses 200 OK, etc.
  }
}

/**
 * WebRTC Gateway
 */
class WebRTCGateway {
  constructor() {
    this.socket = null;
    this.peers = new Map();
    this.bridge = null;
  }
  
  setBridge(bridge) {
    this.bridge = bridge;
  }
  
  /**
   * Connexion au serveur de signalisation WebRTC
   */
  connect() {
    this.socket = new WebSocket(CONFIG.WEBRTC_SIGNALING);
    
    this.socket.on('open', () => {
      console.log('[WebRTC] Connecté au serveur de signalisation');
      
      // S'enregistrer comme gateway
      this.socket.send(JSON.stringify({
        type: 'register',
        data: {
          peerId: 'sip_gateway',
          userData: {
            id: 'sip_gateway',
            role: 'gateway',
            type: 'sip-webrtc-bridge'
          }
        }
      }));
    });
    
    this.socket.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        this.handleWebRTCMessage(message);
      } catch (error) {
        console.error('[WebRTC] Erreur parsing:', error);
      }
    });
    
    this.socket.on('close', () => {
      console.log('[WebRTC] Déconnecté du serveur de signalisation');
    });
    
    this.socket.on('error', (error) => {
      console.error('[WebRTC] Erreur WebSocket:', error);
    });
  }
  
  /**
   * Traiter un message WebRTC
   */
  handleWebRTCMessage(message) {
    const { type, data } = message;
    
    console.log('[WebRTC] Message reçu:', type);
    
    switch (type) {
      case 'make-call':
        this.handleMakeCall(data);
        break;
        
      case 'answer':
        this.handleWebRTCAnswer(data);
        break;
        
      case 'call-ended':
        this.handleWebRTCCallEnd(data);
        break;
        
      default:
        console.warn('[WebRTC] Type inconnu:', type);
    }
  }
  
  /**
   * Gérer une demande d'appel WebRTC
   */
  handleMakeCall(data) {
    const { peerId, targetNumber, offer } = data;
    
    console.log(`[WebRTC] Appel demandé: ${peerId} → ${targetNumber}`);
    
    if (this.bridge) {
      this.bridge.makeWebRTCToSIPCall(peerId, targetNumber, {
        sdp: offer.sdp,
        type: offer.type
      });
    }
  }
  
  /**
   * Envoyer un message à un peer WebRTC
   */
  sendToPeer(peerId, type, data) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({
        type: type,
        data: {
          peerId: peerId,
          ...data
        }
      }));
    }
  }
  
  handleWebRTCAnswer(data) {
    // Traiter la réponse WebRTC
    console.log('[WebRTC] Réponse reçue:', data);
  }
  
  handleWebRTCCallEnd(data) {
    const { callId } = data;
    if (this.bridge) {
      this.bridge.endCall(callId, 'webrtc-ended');
    }
  }
}

/**
 * Serveur API du Gateway
 */
class GatewayServer {
  constructor(bridge) {
    this.app = express();
    this.bridge = bridge;
    this.setupMiddleware();
    this.setupRoutes();
  }
  
  setupMiddleware() {
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
  }
  
  setupRoutes() {
    // Health check
    this.app.get('/api/gateway/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date(),
        uptime: process.uptime(),
        version: '1.0.0'
      });
    });
    
    // Statistiques
    this.app.get('/api/gateway/stats', (req, res) => {
      const stats = this.bridge.getCallStats();
      res.json(stats);
    });
    
    // Liste des appels actifs
    this.app.get('/api/gateway/calls', (req, res) => {
      const stats = this.bridge.getCallStats();
      res.json(stats.activeCalls);
    });
    
    // Terminer un appel
    this.app.post('/api/gateway/calls/:callId/end', (req, res) => {
      const { callId } = req.params;
      const { reason } = req.body;
      
      this.bridge.endCall(callId, reason);
      res.json({ success: true, message: 'Call ended' });
    });
    
    // Configuration
    this.app.get('/api/gateway/config', (req, res) => {
      res.json({
        sipServer: CONFIG.SIP_SERVER,
        sipPort: CONFIG.SIP_PORT,
        webrtcSignaling: CONFIG.WEBRTC_SIGNALING,
        turnServer: CONFIG.TURN_SERVER
      });
    });
  }
  
  start(port = CONFIG.GATEWAY_PORT) {
    this.server = this.app.listen(port, () => {
      console.log(`[GATEWAY] Serveur API démarré sur le port ${port}`);
      console.log(`[GATEWAY] Health check: http://localhost:${port}/api/gateway/health`);
      console.log(`[GATEWAY] Stats: http://localhost:${port}/api/gateway/stats`);
    });
    
    return this.server;
  }
}

/**
 * Point d'entrée principal
 */
class SIPWebRTCGateway {
  constructor() {
    this.sipGateway = new SIPGateway();
    this.webrtcGateway = new WebRTCGateway();
    this.bridge = new CallBridge(this.sipGateway, this.webrtcGateway);
    this.server = new GatewayServer(this.bridge);
  }
  
  async start() {
    console.log('🚀 Démarrage du SIP-WebRTC Gateway...');
    
    // Connecter les composants
    this.sipGateway.setBridge(this.bridge);
    this.webrtcGateway.setBridge(this.bridge);
    
    // Démarrer les connexions
    this.sipGateway.connect();
    this.webrtcGateway.connect();
    
    // Démarrer le serveur API
    this.server.start();
    
    console.log('✅ Gateway démarré avec succès!');
    console.log('📞 Connexions disponibles:');
    console.log(`   • SIP: ${CONFIG.SIP_SERVER}:${CONFIG.SIP_PORT}`);
    console.log(`   • WebRTC: ${CONFIG.WEBRTC_SIGNALING}`);
    console.log(`   • TURN: ${CONFIG.TURN_SERVER}`);
  }
  
  stop() {
    console.log('🛑 Arrêt du Gateway...');
    
    if (this.sipGateway.socket) {
      this.sipGateway.socket.close();
    }
    
    if (this.webrtcGateway.socket) {
      this.webrtcGateway.socket.close();
    }
    
    if (this.server.server) {
      this.server.server.close();
    }
    
    console.log('✅ Gateway arrêté');
  }
}

// Démarrer le gateway
const gateway = new SIPWebRTCGateway();

gateway.start().catch(error => {
  console.error('❌ Erreur lors du démarrage:', error);
  process.exit(1);
});

// Gestion de l'arrêt
process.on('SIGTERM', () => {
  gateway.stop();
  process.exit(0);
});

process.on('SIGINT', () => {
  gateway.stop();
  process.exit(0);
});

module.exports = { SIPWebRTCGateway, CallBridge, SIPParser };