// Serveur VoIP SIP pour MangooTech - Connexion aux comptes 8888/8889
const http = require('http');
const WebSocket = require('ws');
const dgram = require('dgram');

const server = http.createServer();
const wss = new WebSocket.Server({ server });

// Configuration SIP
const SIP_SERVER = 'localhost'; // Remplacez par votre serveur SIP
const SIP_PORT = 5060; // Port SIP standard
const SIP_ACCOUNTS = {
  'vendor-8888': { username: '8888', password: '8888' },
  'client-8889': { username: '8889', password: '8889' }
};

// Configuration VoIP - Ports alternatifs
const UDP_PORT = 5020;  // Port changé pour éviter les conflits
const RTP_PORT = 5021;

// Stockage des utilisateurs VoIP
const voipUsers = new Map();
const activeCalls = new Map();

// Statistiques RTP
const rtpStats = {
  packetsReceived: 0,
  bytesReceived: 0,
  packetsRelayed: 0,
  bytesRelayed: 0,
  lastReceivedAt: null
};

// Serveur UDP pour l'audio RTP
const udpServer = dgram.createSocket('udp4');

udpServer.on('message', (msg, rinfo) => {
  console.log(`📞 Paquet RTP reçu de ${rinfo.address}:${rinfo.port}, taille: ${msg.length}`);
  
  // Traquer les statistiques RTP
  rtpStats.packetsReceived++;
  rtpStats.bytesReceived += msg.length;
  rtpStats.lastReceivedAt = new Date();
  
  // Trouver l'utilisateur qui a envoyé ce paquet
  let senderUser = null;
  for (const [userId, user] of voipUsers) {
    if (user.address === rinfo.address && user.udpPort === rinfo.port) {
      senderUser = user;
      break;
    }
  }
  
  if (!senderUser) {
    console.log(`❌ Expéditeur RTP non trouvé pour ${rinfo.address}:${rinfo.port}`);
    console.log(`👥 Utilisateurs enregistrés:`, Array.from(voipUsers.entries()).map(([id, user]) => ({
      id, 
      username: user.sipAccount.username, 
      address: user.address, 
      port: user.udpPort 
    })));
    return;
  }
  
  console.log(`✅ Paquet RTP reçu de ${senderUser.sipAccount.username}`);
  
  // Trouver l'appel actif de cet utilisateur
  let currentCall = null;
  for (const [callId, call] of activeCalls) {
    if (call.from === senderUser.sipAccount.username || call.to === senderUser.sipAccount.username) {
      currentCall = call;
      break;
    }
  }
  
  if (!currentCall) {
    console.log(`❌ Aucun appel actif trouvé pour ${senderUser.sipAccount.username}`);
    console.log(`📞 Appels actifs:`, Array.from(activeCalls.entries()).map(([id, call]) => ({
      id, 
      from: call.from, 
      to: call.to, 
      status: call.status 
    })));
    return;
  }
  
  console.log(`🎵 Retransmission audio pour l'appel ${currentCall.callId}`);
  
  // Retransmettre l'audio à l'autre participant de l'appel
  let relayed = false;
  voipUsers.forEach((user, userId) => {
    if (user.udpPort && user.address && 
        user.sipAccount.username !== senderUser.sipAccount.username &&
        (user.sipAccount.username === currentCall.from || user.sipAccount.username === currentCall.to)) {
      console.log(`🔄 Retransmission audio vers ${user.sipAccount.username} (${user.address}:${user.udpPort})`);
      
      // Créer une copie du message pour chaque destinataire
      const messageCopy = Buffer.from(msg);
      
      udpServer.send(messageCopy, user.udpPort, user.address, (error) => {
        if (error) {
          console.error(`❌ Erreur envoi RTP à ${userId}:`, error);
        } else {
          console.log(`✅ Audio RTP envoyé à ${user.sipAccount.username}`);
          rtpStats.packetsRelayed++;
          rtpStats.bytesRelayed += msg.length;
        }
      });
      
      relayed = true;
    }
  });
  
  if (!relayed) {
    console.log(`❌ Aucun destinataire trouvé pour l'audio de ${senderUser.sipAccount.username}`);
    console.log(`📞 Appel actif: ${currentCall.callId}, de ${currentCall.from} à ${currentCall.to}`);
    console.log(`👥 Utilisateurs connectés: ${Array.from(voipUsers.keys()).join(', ')}`);
  }
});

udpServer.on('listening', () => {
  const address = udpServer.address();
  console.log(`🎧 Serveur UDP VoIP écoutant sur ${address.address}:${address.port}`);
});

udpServer.bind(UDP_PORT);

// Configuration WebSocket - Port alternatif
const WS_PORT = 3040;  // Port changé pour éviter les conflits

// WebSocket pour la signalisation
wss.on('connection', (ws) => {
  console.log('🔌 Connexion WebSocket VoIP établie');
  
  let currentUser = null;

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log(`📡 Message VoIP reçu: ${data.type}`);

      switch (data.type) {
        case 'register':
          handleRegister(ws, data);
          break;
          
        case 'call':
          handleCall(ws, data);
          break;
          
        case 'answer':
          handleAnswer(ws, data);
          break;
          
        case 'answer-call':
          handleAnswer(ws, data);
          break;
          
        case 'hangup':
          handleHangup(ws, data);
          break;
          
        case 'ice-candidate':
          handleIceCandidate(ws, data);
          break;
          
        case 'rtp-info':
          handleRtpInfo(ws, data);
          break;
          
        case 'offer':
          handleOffer(ws, data);
          break;
          
        case 'answer-webrtc':
          handleAnswerWebRTC(ws, data);
          break;
          
        case 'get-stats':
          handleGetStats(ws, data);
          break;
          
        case 'rtp-packet':
          handleRtpPacket(ws, data);
          break;
          
        default:
          console.log(`❌ Type de message inconnu: ${data.type}`);
      }
    } catch (error) {
      console.error('❌ Erreur traitement message VoIP:', error);
    }
  });

  ws.on('close', () => {
    console.log('🔌 Connexion WebSocket VoIP fermée');
    if (currentUser) {
      voipUsers.delete(currentUser.userId);
      console.log(`👤 Utilisateur ${currentUser.userId} déconnecté du VoIP`);
    }
  });

  function handleRegister(ws, data) {
    const { userId, role, roomId } = data;
    
    // Vérifier si c'est un compte SIP valide
    const sipAccount = SIP_ACCOUNTS[userId];
    if (!sipAccount) {
      ws.send(JSON.stringify({
        type: 'register-error',
        error: 'Compte SIP non valide'
      }));
      return;
    }
    
    currentUser = {
      userId,
      role,
      roomId,
      ws,
      sipAccount,
      registeredAt: new Date()
    };
    
    voipUsers.set(userId, currentUser);
    
    ws.send(JSON.stringify({
      type: 'registered',
      userId,
      message: `Compte SIP ${sipAccount.username} enregistré avec succès`,
      sipUsername: sipAccount.username
    }));
    
    console.log(`✅ Compte SIP ${sipAccount.username} (${role}) enregistré pour la room ${roomId}`);
  }

  function handleCall(ws, data) {
    const { targetUserId, roomId, callId } = data;
    
    // Trouver l'utilisateur qui fait l'appel
    let callerUser = null;
    for (const [userId, user] of voipUsers) {
      if (user.ws === ws) {
        callerUser = user;
        break;
      }
    }
    
    if (!callerUser) {
      ws.send(JSON.stringify({
        type: 'call-error',
        error: 'Utilisateur non enregistré'
      }));
      return;
    }
    
    const targetUser = voipUsers.get(targetUserId);
    if (!targetUser) {
      ws.send(JSON.stringify({
        type: 'call-error',
        error: 'Utilisateur cible non trouvé'
      }));
      return;
    }
    
    // Utiliser l'ID d'appel fourni ou en créer un nouveau
    const finalCallId = callId || `call-${Date.now()}`;
    const call = {
      callId: finalCallId,
      from: callerUser.sipAccount.username,
      to: targetUser.sipAccount.username,
      caller: callerUser.userId,
      callee: targetUser.userId,
      callerSip: callerUser.sipAccount.username,
      calleeSip: targetUser.sipAccount.username,
      status: 'ringing',
      createdAt: new Date()
    };
    
    activeCalls.set(finalCallId, call);
    
    console.log(`📞 Appel créé: ${call.from} → ${call.to} (ID: ${finalCallId})`);
    
    // Informer l'appelant
    callerUser.ws.send(JSON.stringify({
      type: 'call-initiated',
      callId: finalCallId,
      targetUserId: targetUserId,
      targetUsername: targetUser.sipAccount.username
    }));
    
    // Informer l'appelé
    targetUser.ws.send(JSON.stringify({
      type: 'incoming-call',
      callId: finalCallId,
      fromUserId: callerUser.userId,
      fromUsername: callerUser.sipAccount.username,
      roomId
    }));
  }

  function handleAnswer(ws, data) {
    const { callId, accept } = data;
    
    const call = activeCalls.get(callId);
    if (!call) {
      ws.send(JSON.stringify({
        type: 'answer-error',
        error: 'Appel non trouvé'
      }));
      return;
    }
    
    const caller = voipUsers.get(call.caller);
    const callee = voipUsers.get(call.callee);
    
    if (accept) {
      call.status = 'active';
      
      // Notifier les deux parties que l'appel est actif
      if (caller) {
        caller.ws.send(JSON.stringify({
          type: 'call-accepted',
          callId,
          message: `Appel SIP accepté, connexion audio en cours...`,
          calleeSip: call.calleeSip,
          otherPartyRtpInfo: callee ? { 
            username: callee.sipAccount.username,
            address: callee.address,
            udpPort: callee.udpPort 
          } : null
        }));
      }
      
      if (callee) {
        callee.ws.send(JSON.stringify({
          type: 'call-accepted',
          callId,
          message: `Vous avez accepté l'appel de ${call.callerSip}`,
          otherPartyRtpInfo: caller ? { 
            username: caller.sipAccount.username,
            address: caller.address,
            udpPort: caller.udpPort 
          } : null
        }));
      }
      
      console.log(`✅ Appel SIP ${callId} accepté entre ${call.callerSip} et ${call.calleeSip}`);
    } else {
      call.status = 'rejected';
      
      // Notifier l'appelant du refus
      if (caller) {
        caller.ws.send(JSON.stringify({
          type: 'call-rejected',
          callId,
          message: `Appel SIP refusé par ${call.calleeSip}`
        }));
      }
      
      activeCalls.delete(callId);
      console.log(`❌ Appel SIP ${callId} refusé par ${call.calleeSip}`);
    }
  }

  function handleHangup(ws, data) {
    const { callId } = data;
    
    console.log(`📴 Raccrochage demandé pour callId: ${callId}`);
    
    // Si pas de callId spécifique, trouver l'appel actif de cet utilisateur
    let call = null;
    let currentUser = null;
    
    // Trouver l'utilisateur qui raccroche
    for (const [userId, user] of voipUsers) {
      if (user.ws === ws) {
        currentUser = user;
        break;
      }
    }
    
    if (!currentUser) {
      console.log('❌ Utilisateur raccrochant non trouvé');
      return;
    }
    
    if (callId) {
      // Raccrochage spécifique par callId
      call = activeCalls.get(callId);
    } else {
      // Raccrochage général - trouver l'appel actif de cet utilisateur
      for (const [activeCallId, activeCall] of activeCalls) {
        if (activeCall.from === currentUser.sipAccount.username || 
            activeCall.to === currentUser.sipAccount.username) {
          call = activeCall;
          break;
        }
      }
    }
    
    if (!call) {
      console.log(`❌ Aucun appel actif trouvé pour ${currentUser.sipAccount.username}`);
      return;
    }
    
    const caller = voipUsers.get(call.caller);
    const callee = voipUsers.get(call.callee);
    
    call.status = 'ended';
    
    console.log(`📴 Raccrochage de ${currentUser.sipAccount.username} pour l'appel ${call.callId}`);
    
    // Notifier les deux parties de la fin d'appel
    if (caller && caller.ws.readyState === WebSocket.OPEN) {
      caller.ws.send(JSON.stringify({
        type: 'call-ended',
        callId: call.callId,
        message: `Appel SIP avec ${call.calleeSip} terminé`,
        endedBy: currentUser.sipAccount.username
      }));
    }
    
    if (callee && callee.ws.readyState === WebSocket.OPEN) {
      callee.ws.send(JSON.stringify({
        type: 'call-ended',
        callId: call.callId,
        message: `Appel SIP avec ${call.callerSip} terminé`,
        endedBy: currentUser.sipAccount.username
      }));
    }
    
    activeCalls.delete(call.callId);
    console.log(`📴 Appel SIP ${call.callId} terminé entre ${call.callerSip} et ${call.calleeSip}`);
  }

  function handleIceCandidate(ws, data) {
    const { targetUserId, candidate, callId } = data;
    
    // Trouver l'utilisateur qui envoie le candidat ICE
    let senderUser = null;
    for (const [userId, user] of voipUsers) {
      if (user.ws === ws) {
        senderUser = user;
        break;
      }
    }
    
    if (!senderUser) {
      console.log('❌ Utilisateur ICE non trouvé');
      return;
    }
    
    const targetUser = voipUsers.get(targetUserId);
    if (targetUser) {
      targetUser.ws.send(JSON.stringify({
        type: 'ice-candidate',
        candidate,
        from: senderUser.userId,
        fromSip: senderUser.sipAccount.username,
        callId: callId
      }));
    }
  }

  function handleRtpInfo(ws, data) {
    const { udpPort, address } = data;
    
    if (currentUser) {
      currentUser.udpPort = udpPort;
      currentUser.address = address;
      
      console.log(`🎧 Info RTP pour ${currentUser.sipAccount.username}: ${address}:${udpPort}`);
      
      ws.send(JSON.stringify({
        type: 'rtp-registered',
        message: 'Port RTP enregistré',
        sipUsername: currentUser.sipAccount.username
      }));
    }
  }

  function handleOffer(ws, data) {
    const { targetUserId, data: offerData } = data;
    
    // Trouver l'utilisateur qui envoie l'offre
    let senderUser = null;
    for (const [userId, user] of voipUsers) {
      if (user.ws === ws) {
        senderUser = user;
        break;
      }
    }
    
    if (!senderUser) {
      ws.send(JSON.stringify({
        type: 'offer-error',
        error: 'Utilisateur offre non trouvé'
      }));
      return;
    }
    
    const targetUser = voipUsers.get(targetUserId);
    if (!targetUser) {
      ws.send(JSON.stringify({
        type: 'offer-error',
        error: 'Utilisateur cible non trouvé'
      }));
      return;
    }
    
    console.log(`📞 Offre WebRTC de ${senderUser.sipAccount.username} vers ${targetUser.sipAccount.username}`);
    
    // Transmettre l'offre à l'utilisateur cible
    targetUser.ws.send(JSON.stringify({
      type: 'offer',
      offer: offerData,
      from: senderUser.userId,
      fromSip: senderUser.sipAccount.username,
      fromRole: senderUser.role
    }));
  }

  function handleAnswerWebRTC(ws, data) {
    const { callId, data: answerData } = data;
    
    // Trouver l'utilisateur qui envoie la réponse
    let senderUser = null;
    for (const [userId, user] of voipUsers) {
      if (user.ws === ws) {
        senderUser = user;
        break;
      }
    }
    
    if (!senderUser) {
      ws.send(JSON.stringify({
        type: 'answer-error',
        error: 'Utilisateur réponse non trouvé'
      }));
      return;
    }
    
    console.log(`✅ Réponse WebRTC de ${senderUser.sipAccount.username}, callId: ${callId}`);
    
    // Trouver l'utilisateur cible (celui qui a envoyé l'offre)
    let targetUser = null;
    
    // Essayer de trouver l'appelant à partir du callId ou chercher tous les utilisateurs
    for (const [userId, user] of voipUsers) {
      if (userId !== senderUser.userId) {
        targetUser = user;
        break;
      }
    }
    
    if (!targetUser) {
      ws.send(JSON.stringify({
        type: 'answer-error',
        error: 'Aucun autre utilisateur trouvé'
      }));
      return;
    }
    
    console.log(`✅ Réponse WebRTC de ${senderUser.sipAccount.username} vers ${targetUser.sipAccount.username}`);
    
    // Transmettre la réponse à l'utilisateur cible
    targetUser.ws.send(JSON.stringify({
      type: 'answer',
      answer: answerData,
      from: senderUser.userId,
      fromSip: senderUser.sipAccount.username
    }));
    
    // Mettre à jour le statut de l'appel si trouvé
    for (const [callId, call] of activeCalls) {
      if ((call.from === senderUser.sipAccount.username && call.to === targetUser.sipAccount.username) ||
          (call.from === targetUser.sipAccount.username && call.to === senderUser.sipAccount.username)) {
        call.status = 'connected';
        call.connectedAt = new Date();
        console.log(`📞 Appel ${callId} maintenant CONNECTÉ entre ${call.from} et ${call.to}`);
        break;
      }
    }
  }
});

// Health check endpoint
server.on('request', (req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      voipUsers: voipUsers.size,
      activeCalls: activeCalls.size,
      sipAccounts: Object.keys(SIP_ACCOUNTS).length,
      udpPort: UDP_PORT,
      sipServer: SIP_SERVER,
      sipPort: SIP_PORT
    }));
  } else {
    res.writeHead(404);
    res.end();
  }
});

const PORT = process.env.PORT || 3040;
server.listen(PORT, () => {
  console.log(`🚀 Serveur VoIP SIP démarré`);
  console.log(`📡 WebSocket: ws://localhost:${PORT}`);
  console.log(`🎧 UDP/RTP: udp://localhost:${UDP_PORT}`);
  console.log(`📞 SIP Server: ${SIP_SERVER}:${SIP_PORT}`);
  console.log(`👥 Comptes SIP configurés:`, Object.keys(SIP_ACCOUNTS));
  console.log(`🏥 Health: http://localhost:${PORT}/health`);
});

// Fonction pour simuler le flux audio RTP entre les utilisateurs
function simulateAudioFlow() {
  // Si aucun paquet RTP n'a été reçu depuis longtemps, simuler un flux
  const now = new Date();
  const lastReceived = rtpStats.lastReceivedAt;
  
  if (!lastReceived || (now.getTime() - lastReceived.getTime()) > 2000) {
    // Simuler un flux audio basique
    if (activeCalls.size > 0) {
      console.log('🎵 Simulation flux audio RTP (aucun paquet reçu depuis 2s)');
      
      // Envoyer des paquets simulés à tous les appels actifs
      activeCalls.forEach((call, callId) => {
        const caller = voipUsers.get(call.caller);
        const callee = voipUsers.get(call.callee);
        
        if (caller && callee && caller.udpPort && callee.udpPort) {
          // Simuler des paquets audio de l'appelant vers l'appelé
          const simulatedPacket = Buffer.from([0x80, 0x08, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
          
          udpServer.send(simulatedPacket, callee.udpPort, callee.address, (error) => {
            if (error) {
              console.error(`❌ Erreur simulation RTP vers ${callee.sipAccount.username}:`, error);
            } else {
              console.log(`✅ Paquet RTP simulé envoyé de ${caller.sipAccount.username} vers ${callee.sipAccount.username}`);
              rtpStats.packetsRelayed++;
              rtpStats.bytesRelayed += simulatedPacket.length;
            }
          });
          
          // Simuler des paquets audio de l'appelé vers l'appelant
          udpServer.send(simulatedPacket, caller.udpPort, caller.address, (error) => {
            if (error) {
              console.error(`❌ Erreur simulation RTP vers ${caller.sipAccount.username}:`, error);
            } else {
              console.log(`✅ Paquet RTP simulé envoyé de ${callee.sipAccount.username} vers ${caller.sipAccount.username}`);
              rtpStats.packetsRelayed++;
              rtpStats.bytesRelayed += simulatedPacket.length;
            }
          });
        }
      });
    }
  }
}

// Désactiver la simulation automatique - on utilise l'audio réel via WebSocket
// setInterval(simulateAudioFlow, 500);
console.log('🎤 Simulation audio désactivée - utilisation audio réel WebSocket');

// Fonction pour gérer les paquets RTP via WebSocket (alternative au UDP)
function handleRtpPacket(ws, data) {
  const { callId, audioData, targetUsername } = data;
  
  console.log(`🎵 Paquet RTP WebSocket reçu pour l'appel ${callId}`);
  
  // Traquer les statistiques
  rtpStats.packetsReceived++;
  rtpStats.bytesReceived += audioData ? audioData.length : 0;
  rtpStats.lastReceivedAt = new Date();
  
  // Trouver l'appel
  const call = activeCalls.get(callId);
  if (!call) {
    console.log(`❌ Appel ${callId} non trouvé pour retransmission RTP`);
    return;
  }
  
  // Trouver le destinataire
  let targetUser = null;
  for (const [userId, user] of voipUsers) {
    if (user.sipAccount.username === targetUsername) {
      targetUser = user;
      break;
    }
  }
  
  if (!targetUser || !targetUser.ws || targetUser.ws.readyState !== WebSocket.OPEN) {
    console.log(`❌ Destinataire ${targetUsername} non trouvé ou déconnecté`);
    return;
  }
  
  // Retransmettre le paquet audio
  targetUser.ws.send(JSON.stringify({
    type: 'rtp-audio',
    callId: callId,
    audioData: audioData,
    from: call.from
  }));
  
  rtpStats.packetsRelayed++;
  rtpStats.bytesRelayed += audioData ? audioData.length : 0;
  
  console.log(`✅ Audio RTP retransmis de ${call.from} vers ${targetUsername}`);
}
function handleGetStats(ws, data) {
  console.log('📊 Demande de statistiques VoIP');
  
  const stats = {
    voipUsers: Array.from(voipUsers.entries()).map(([id, user]) => ({
      userId: id,
      username: user.sipAccount.username,
      role: user.role,
      address: user.address,
      udpPort: user.udpPort,
      registeredAt: user.registeredAt
    })),
    activeCalls: Array.from(activeCalls.entries()).map(([id, call]) => ({
      callId: id,
      from: call.from,
      to: call.to,
      status: call.status,
      createdAt: call.createdAt
    })),
    udpServer: {
      listening: udpServer.listening,
      port: UDP_PORT,
      status: udpServer.listening ? 'actif' : 'inactif',
      stats: {
        packetsReceived: rtpStats.packetsReceived,
        bytesReceived: rtpStats.bytesReceived,
        packetsRelayed: rtpStats.packetsRelayed,
        bytesRelayed: rtpStats.bytesRelayed,
        lastReceivedAt: rtpStats.lastReceivedAt
      }
    }
  };
  
  ws.send(JSON.stringify({
    type: 'stats',
    stats
  }));
}