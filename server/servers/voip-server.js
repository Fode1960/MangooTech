// Serveur VoIP simplifié pour MangooTech avec FILTRAGE AUDIO
const http = require('http');
const WebSocket = require('ws');
const dgram = require('dgram');

const server = http.createServer();
const wss = new WebSocket.Server({ server });

// Configuration VoIP - Ports alternatifs
const UDP_PORT = 5014;
const RTP_PORT = 5015;

// Stockage des utilisateurs VoIP
const voipUsers = new Map();
const activeCalls = new Map();

// 🔧 FILTRAGE AUDIO CÔTÉ SERVEUR - ÉLIMINER LE BRUIT DE FOND
function filterAudioPacket(buffer) {
  // Analyser et filtrer les paquets RTP pour réduire le bruit
  // Cette fonction applique un filtrage basique sur les paquets audio
  
  if (buffer.length < 12) return buffer; // Paquet RTP trop petit
  
  // Header RTP (12 bytes)
  const header = buffer.slice(0, 12);
  const payload = buffer.slice(12);
  
  // Appliquer un filtrage simple pour réduire le bruit de fond
  // C'est une simplification - en production, on utiliserait des algorithmes plus sophistiqués
  const filteredPayload = Buffer.from(payload);
  
  // Réduction du bruit: atténuer les échantillons très faibles (bruit de fond)
  for (let i = 0; i < filteredPayload.length; i += 2) {
    const sample = filteredPayload.readInt16LE(i);
    
    // Seuil de bruit: atténuer les échantillons très faibles
    if (Math.abs(sample) < 100) { // Seuil de bruit
      const filteredSample = Math.round(sample * 0.3); // Réduction 70%
      filteredPayload.writeInt16LE(filteredSample, i);
    }
    
    // Limiter les valeurs extrêmes pour éviter la saturation
    if (Math.abs(sample) > 28000) {
      const limitedSample = sample > 0 ? 28000 : -28000;
      filteredPayload.writeInt16LE(limitedSample, i);
    }
  }
  
  return Buffer.concat([header, filteredPayload]);
}

// Serveur UDP pour l'audio RTP avec FILTRAGE
const udpServer = dgram.createSocket('udp4');

udpServer.on('message', (msg, rinfo) => {
  console.log(`📞 Paquet RTP reçu de ${rinfo.address}:${rinfo.port}, taille: ${msg.length}`);
  
  // 🔧 APPLIQUER LE FILTRAGE AUDIO AVANT RETRANSMISSION
  const filteredMsg = filterAudioPacket(msg);
  
  // Retransmettre l'audio filtré aux autres participants de l'appel
  voipUsers.forEach((user, userId) => {
    if (user.udpPort && user.address && user.address !== rinfo.address) {
      udpServer.send(filteredMsg, user.udpPort, user.address, (error) => {
        if (error) {
          console.error(`❌ Erreur envoi RTP filtré à ${userId}:`, error);
        } else {
          console.log(`✅ Audio filtré envoyé à ${userId}`);
        }
      });
    }
  });
});

udpServer.on('listening', () => {
  const address = udpServer.address();
  console.log(`🎧 Serveur UDP VoIP écoutant sur ${address.address}:${address.port}`);
});

udpServer.bind(UDP_PORT);

// Configuration WebSocket - Port alternatif
const WS_PORT = 3035;

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
          
        case 'call-initiated':
          // Déjà géré dans handleCall, mais on log quand même
          console.log(`📞 Message call-initiated reçu (déjà traité)`);
          break;
          
        case 'answer-webrtc':
          handleAnswerWebRTC(ws, data);
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
      // 🧹 Nettoyage anti-écho lors de la déconnexion
      console.log(`🧹 Nettoyage anti-écho pour ${currentUser.userId}`);
      
      // Terminer tous les appels actifs de cet utilisateur
      for (const [callId, call] of activeCalls) {
        if (call.caller === currentUser.userId || call.callee === currentUser.userId) {
          console.log(`🧹 Terminaison d'appel ${callId} due à la déconnexion`);
          
          // Notifier l'autre partie
          const otherUserId = call.caller === currentUser.userId ? call.callee : call.caller;
          const otherUser = voipUsers.get(otherUserId);
          
          if (otherUser && otherUser.ws.readyState === 1) {
            otherUser.ws.send(JSON.stringify({
              type: 'call-ended',
              callId,
              message: 'Appel terminé - Partenaire déconnecté',
              cleanup: true
            }));
          }
          
          activeCalls.delete(callId);
        }
      }
      
      // Nettoyer les données UDP
      if (currentUser.udpPort) {
        console.log(`🧹 Nettoyage UDP pour ${currentUser.userId}`);
        currentUser.udpPort = null;
        currentUser.address = null;
      }
      
      voipUsers.delete(currentUser.userId);
      console.log(`👤 Utilisateur ${currentUser.userId} déconnecté du VoIP avec nettoyage`);
    }
  });

  function handleRegister(ws, data) {
    const { userId, role, roomId } = data;
    
    currentUser = {
      userId,
      role,
      roomId,
      ws,
      registeredAt: new Date()
    };
    
    voipUsers.set(userId, currentUser);
    
    ws.send(JSON.stringify({
      type: 'registered',
      userId,
      message: 'Enregistré avec succès sur le serveur VoIP'
    }));
    
    console.log(`✅ Utilisateur ${userId} (${role}) enregistré pour la room ${roomId}`);
  }

  function handleCall(ws, data) {
    const { targetUserId, roomId } = data;
    
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
    
    console.log(`📞 Appel de ${callerUser.userId} vers ${targetUserId}`);
    
    // Vérifier s'il n'y a pas déjà un appel actif
    for (const [existingCallId, existingCall] of activeCalls) {
      if ((existingCall.caller === callerUser.userId || existingCall.callee === callerUser.userId) && 
          (existingCall.caller === targetUserId || existingCall.callee === targetUserId) &&
          existingCall.status !== 'ended') {
        console.log(`⚠️ Appel déjà existant entre ${callerUser.userId} et ${targetUserId}`);
        ws.send(JSON.stringify({
          type: 'call-error',
          error: 'Appel déjà en cours'
        }));
        return;
      }
    }
    
    // Créer l'appel
    const callId = `${callerUser.userId}-${targetUserId}-${Date.now()}`;
    const call = {
      id: callId,
      caller: callerUser.userId,
      callee: targetUserId,
      roomId,
      status: 'ringing',
      createdAt: new Date()
    };
    
    activeCalls.set(callId, call);
    
    // Notifier l'appelant
    ws.send(JSON.stringify({
      type: 'call-initiated',
      callId,
      message: 'Appel en cours...',
      targetUserId: targetUserId
    }));
    
    // Trouver l'utilisateur cible
    const targetUser = voipUsers.get(targetUserId);
    if (!targetUser) {
      ws.send(JSON.stringify({
        type: 'call-error',
        error: 'Utilisateur cible non trouvé ou déconnecté'
      }));
      return;
    }
    
    // Notifier le destinataire
    targetUser.ws.send(JSON.stringify({
      type: 'incoming-call',
      callId,
      from: callerUser.userId,
      fromRole: callerUser.role,
      message: `${callerUser.role === 'vendor' ? 'Vendeur' : 'Client'} vous appelle`,
      callerRole: callerUser.role
    }));
    
    console.log(`📞 Appel ${callId} initié entre ${callerUser.userId} et ${targetUserId}`);
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
          type: 'call-answered',
          callId,
          message: 'Appel accepté, connexion audio en cours...'
        }));
      }
      
      if (callee) {
        callee.ws.send(JSON.stringify({
          type: 'call-answered',
          callId,
          message: 'Vous avez accepté l\'appel'
        }));
      }
      
      console.log(`✅ Appel ${callId} accepté`);
    } else {
      call.status = 'rejected';
      
      // Notifier l'appelant du refus
      if (caller) {
        caller.ws.send(JSON.stringify({
          type: 'call-rejected',
          callId,
          message: 'Appel refusé'
        }));
      }
      
      activeCalls.delete(callId);
      console.log(`❌ Appel ${callId} refusé`);
    }
  }

  function handleHangup(ws, data) {
    const { callId } = data;
    
    let call = activeCalls.get(callId);
    if (!call) {
      // Chercher l'appel par utilisateur si callId non fourni
      const userId = findUserIdByWebSocket(ws);
      if (userId) {
        for (const [existingCallId, existingCall] of activeCalls) {
          if ((existingCall.caller === userId || existingCall.callee === userId) && 
              existingCall.status !== 'ended') {
            // Utiliser l'appel trouvé
            call = existingCall;
            break;
          }
        }
      }
      
      if (!call) {
        console.log(`⚠️ Aucun appel actif trouvé pour callId: ${callId}`);
        return;
      }
    }
    
    const caller = voipUsers.get(call.caller);
    const callee = voipUsers.get(call.callee);
    
    call.status = 'ended';
    
    // 🧹 Nettoyage anti-écho côté serveur
    console.log(`🧹 Nettoyage anti-écho pour l'appel ${call.id}`);
    
    // Notifier les deux parties de la fin d'appel avec message anti-écho
    if (caller) {
      caller.ws.send(JSON.stringify({
        type: 'call-ended',
        callId: call.id,
        message: 'Appel terminé - Nettoyage audio en cours',
        cleanup: true // Indicateur de nettoyage
      }));
    }
    
    if (callee) {
      callee.ws.send(JSON.stringify({
        type: 'call-ended',
        callId: call.id,
        message: 'Appel terminé - Nettoyage audio en cours',
        cleanup: true // Indicateur de nettoyage
      }));
    }
    
    // 🧹 Nettoyer les données UDP/RTP pour éviter l'écho réseau
    if (caller && caller.udpPort) {
      console.log(`🧹 Nettoyage UDP pour caller ${call.caller}`);
      caller.udpPort = null;
    }
    
    if (callee && callee.udpPort) {
      console.log(`🧹 Nettoyage UDP pour callee ${call.callee}`);
      callee.udpPort = null;
    }
    
    activeCalls.delete(call.id);
    console.log(`📴 Appel ${call.id} terminé avec nettoyage anti-écho`);
  }

  function findUserIdByWebSocket(ws) {
    for (const [userId, user] of voipUsers) {
      if (user.ws === ws) {
        return userId;
      }
    }
    return null;
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
        callId: callId
      }));
    }
  }

  function handleRtpInfo(ws, data) {
    const { udpPort, address } = data;
    
    if (currentUser) {
      currentUser.udpPort = udpPort;
      currentUser.address = address;
      
      console.log(`🎧 Info RTP pour ${currentUser.userId}: ${address}:${udpPort}`);
      
      ws.send(JSON.stringify({
        type: 'rtp-registered',
        message: 'Port RTP enregistré'
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
    
    console.log(`📞 Offre WebRTC de ${senderUser.userId} vers ${targetUserId}`);
    
    // Transmettre l'offre à l'utilisateur cible
    targetUser.ws.send(JSON.stringify({
      type: 'offer',
      offer: offerData,
      from: senderUser.userId,
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
    
    console.log(`✅ Réponse WebRTC de ${senderUser.userId}, callId: ${callId}`);
    
    // Trouver l'utilisateur cible (celui qui a envoyé l'offre)
    // Le callId contient généralement l'ID de l'appelant
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
    
    console.log(`✅ Réponse WebRTC de ${senderUser.userId} vers ${targetUser.userId}`);
    
    // Transmettre la réponse à l'utilisateur cible
    targetUser.ws.send(JSON.stringify({
      type: 'answer',
      answer: answerData,
      from: senderUser.userId
    }));
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
      udpPort: UDP_PORT
    }));
  } else {
    res.writeHead(404);
    res.end();
  }
});

const PORT = process.env.PORT || 3035;
server.listen(PORT, () => {
  console.log(`🚀 Serveur VoIP démarré`);
  console.log(`📡 WebSocket: ws://localhost:${PORT}`);
  console.log(`🎧 UDP/RTP: udp://localhost:${UDP_PORT}`);
  console.log(`🏥 Health: http://localhost:${PORT}/health`);
});