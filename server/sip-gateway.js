const dgram = require('dgram');
const net = require('net');
const EventEmitter = require('events');

/**
 * SIP Gateway pour connecter FreePBX/Asterisk à WebRTC
 * Serveur: 194.163.190.74:5060 UDP
 */
class SIPGateway extends EventEmitter {
  constructor() {
    super();
    this.sipServer = '194.163.190.74';
    this.sipPort = 5060;
    this.localPort = 5061; // Port local pour éviter les conflits
    this.sessions = new Map();
    this.registeredUsers = new Map();
    
    this.initialize();
  }

  initialize() {
    // Créer socket UDP pour SIP
    this.socket = dgram.createSocket('udp4');
    
    this.socket.on('message', (msg, rinfo) => {
      this.handleSIPMessage(msg.toString(), rinfo);
    });

    this.socket.on('error', (err) => {
      console.error('Erreur SIP Gateway:', err);
      this.emit('error', err);
    });

    this.socket.bind(this.localPort, () => {
      console.log(`🔄 SIP Gateway démarré sur le port ${this.localPort}`);
      console.log(`📞 Connexion à FreePBX/Asterisk: ${this.sipServer}:${this.sipPort}`);
    });
  }

  /**
   * Enregistrer un utilisateur WebRTC dans le système SIP
   */
  registerUser(userId, sipCredentials) {
    const { username, password, domain } = sipCredentials;
    
    const registerMessage = 
      `REGISTER sip:${domain} SIP/2.0\r\n` +
      `Via: SIP/2.0/UDP ${this.getLocalIP()}:${this.localPort};branch=z9hG4bK${this.generateBranch()}\r\n` +
      `From: <sip:${username}@${domain}>;tag=${this.generateTag()}\r\n` +
      `To: <sip:${username}@${domain}>\r\n` +
      `Call-ID: ${this.generateCallId()}\r\n` +
      `CSeq: 1 REGISTER\r\n` +
      `Contact: <sip:${username}@${this.getLocalIP()}:${this.localPort}>\r\n` +
      `Expires: 3600\r\n` +
      `Content-Length: 0\r\n\r\n`;

    this.sendSIPMessage(registerMessage);
    
    this.registeredUsers.set(userId, {
      username,
      domain,
      registered: true,
      lastRegister: new Date()
    });

    console.log(`👤 Utilisateur ${username} enregistré dans le système SIP`);
  }

  /**
   * Établir un appel SIP vers WebRTC
   */
  initiateCall(callerId, calleeId, sdpOffer) {
    const caller = this.registeredUsers.get(callerId);
    const callee = this.registeredUsers.get(calleeId);
    
    if (!caller || !callee) {
      throw new Error('Utilisateurs non enregistrés');
    }

    const callId = this.generateCallId();
    const session = {
      id: callId,
      caller: callerId,
      callee: calleeId,
      status: 'initiating',
      sdpOffer,
      startTime: new Date()
    };

    this.sessions.set(callId, session);

    const inviteMessage =
      `INVITE sip:${callee.username}@${callee.domain} SIP/2.0\r\n` +
      `Via: SIP/2.0/UDP ${this.getLocalIP()}:${this.localPort};branch=z9hG4bK${this.generateBranch()}\r\n` +
      `From: <sip:${caller.username}@${caller.domain}>;tag=${this.generateTag()}\r\n` +
      `To: <sip:${callee.username}@${callee.domain}>\r\n` +
      `Call-ID: ${callId}\r\n` +
      `CSeq: 1 INVITE\r\n` +
      `Contact: <sip:${caller.username}@${this.getLocalIP()}:${this.localPort}>\r\n` +
      `Content-Type: application/sdp\r\n` +
      `Content-Length: ${sdpOffer.length}\r\n\r\n` +
      sdpOffer;

    this.sendSIPMessage(inviteMessage);
    
    console.log(`📞 Appel initié: ${caller.username} → ${callee.username}`);
    return callId;
  }

  /**
   * Répondre à un appel SIP
   */
  answerCall(callId, sdpAnswer) {
    const session = this.sessions.get(callId);
    if (!session) {
      throw new Error('Session d\'appel non trouvée');
    }

    session.status = 'answered';
    session.sdpAnswer = sdpAnswer;

    const okMessage =
      `SIP/2.0 200 OK\r\n` +
      `Via: SIP/2.0/UDP ${this.sipServer}:${this.sipPort}\r\n` +
      `From: <sip:${session.caller}>;tag=${this.generateTag()}\r\n` +
      `To: <sip:${session.callee}>;tag=${this.generateTag()}\r\n` +
      `Call-ID: ${callId}\r\n` +
      `CSeq: 1 INVITE\r\n` +
      `Contact: <sip:${session.callee}@${this.getLocalIP()}:${this.localPort}>\r\n` +
      `Content-Type: application/sdp\r\n` +
      `Content-Length: ${sdpAnswer.length}\r\n\r\n` +
      sdpAnswer;

    this.sendSIPMessage(okMessage);
    
    console.log(`✅ Appel répondu: ${callId}`);
  }

  /**
   * Terminer un appel
   */
  terminateCall(callId) {
    const session = this.sessions.get(callId);
    if (!session) return;

    const byeMessage =
      `BYE sip:${session.callee}@${this.sipServer} SIP/2.0\r\n` +
      `Via: SIP/2.0/UDP ${this.getLocalIP()}:${this.localPort};branch=z9hG4bK${this.generateBranch()}\r\n` +
      `From: <sip:${session.caller}>;tag=${this.generateTag()}\r\n` +
      `To: <sip:${session.callee}>;tag=${this.generateTag()}\r\n` +
      `Call-ID: ${callId}\r\n` +
      `CSeq: 1 BYE\r\n` +
      `Content-Length: 0\r\n\r\n`;

    this.sendSIPMessage(byeMessage);
    
    session.status = 'terminated';
    session.endTime = new Date();
    
    console.log(`🔚 Appel terminé: ${callId}`);
    
    // Émettre l'événement de fin d'appel
    this.emit('callEnded', {
      callId,
      duration: session.endTime - session.startTime
    });

    // Nettoyer après un délai
    setTimeout(() => {
      this.sessions.delete(callId);
    }, 5000);
  }

  /**
   * Gérer les messages SIP entrants
   */
  handleSIPMessage(message, rinfo) {
    const lines = message.split('\r\n');
    const firstLine = lines[0];
    
    console.log(`📨 Message SIP reçu: ${firstLine}`);

    if (firstLine.includes('INVITE')) {
      this.handleIncomingCall(message, rinfo);
    } else if (firstLine.includes('BYE')) {
      this.handleCallEnd(message);
    } else if (firstLine.includes('200 OK')) {
      this.handleCallAccept(message);
    } else if (firstLine.includes('180 Ringing')) {
      this.handleCallRinging(message);
    }
  }

  /**
   * Gérer un appel entrant
   */
  handleIncomingCall(message, rinfo) {
    const callId = this.extractCallId(message);
    const from = this.extractFrom(message);
    const to = this.extractTo(message);
    const sdp = this.extractSDP(message);

    const session = {
      id: callId,
      caller: from,
      callee: to,
      status: 'incoming',
      sdpOffer: sdp,
      startTime: new Date(),
      remoteAddress: rinfo.address
    };

    this.sessions.set(callId, session);

    console.log(`📞 Appel entrant: ${from} → ${to}`);
    
    // Émettre l'événement d'appel entrant
    this.emit('incomingCall', {
      callId,
      caller: from,
      callee: to,
      sdp
    });
  }

  /**
   * Méthodes utilitaires
   */
  sendSIPMessage(message) {
    const buffer = Buffer.from(message);
    this.socket.send(buffer, this.sipPort, this.sipServer, (error) => {
      if (error) {
        console.error('Erreur envoi SIP:', error);
      } else {
        console.log('📤 Message SIP envoyé');
      }
    });
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

  generateBranch() {
    return Math.random().toString(36).substring(2, 15);
  }

  generateTag() {
    return Math.random().toString(36).substring(2, 8);
  }

  generateCallId() {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }

  extractCallId(message) {
    const match = message.match(/Call-ID:\s*(.+)/i);
    return match ? match[1].trim() : '';
  }

  extractFrom(message) {
    const match = message.match(/From:\s*<sip:(.+?)>/i);
    return match ? match[1].trim() : '';
  }

  extractTo(message) {
    const match = message.match(/To:\s*<sip:(.+?)>/i);
    return match ? match[1].trim() : '';
  }

  extractSDP(message) {
    const sdpStart = message.indexOf('v=0');
    return sdpStart !== -1 ? message.substring(sdpStart) : '';
  }

  handleCallEnd(message) {
    const callId = this.extractCallId(message);
    this.terminateCall(callId);
  }

  handleCallAccept(message) {
    const callId = this.extractCallId(message);
    const session = this.sessions.get(callId);
    if (session) {
      session.status = 'answered';
      console.log(`✅ Appel accepté: ${callId}`);
      this.emit('callAnswered', { callId });
    }
  }

  handleCallRinging(message) {
    const callId = this.extractCallId(message);
    console.log(`📳 Sonnerie: ${callId}`);
    this.emit('callRinging', { callId });
  }

  /**
   * Obtenir les statistiques du gateway
   */
  getStats() {
    return {
      activeSessions: this.sessions.size,
      registeredUsers: this.registeredUsers.size,
      sessions: Array.from(this.sessions.values()),
      users: Array.from(this.registeredUsers.entries())
    };
  }
}

module.exports = SIPGateway;