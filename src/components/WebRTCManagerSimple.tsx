import React, { useState, useEffect, useRef } from 'react';
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff, Send, User } from 'lucide-react';

interface WebRTCManagerSimpleProps {
  mode: 'video-call' | 'live-shopping';
  roomId: string;
  userRole: 'vendor' | 'customer';
  onStreamStart?: () => void;
  onStreamEnd?: () => void;
}

interface ChatMessage {
  id: string;
  user: string;
  message: string;
  timestamp: Date;
  role: 'vendor' | 'customer';
}

const WebRTCManagerSimple: React.FC<WebRTCManagerSimpleProps> = ({
  mode,
  roomId,
  userRole,
  onStreamStart,
  onStreamEnd
}) => {
  const [isCallActive, setIsCallActive] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [remoteUserName, setRemoteUserName] = useState('');
  const [incomingCall, setIncomingCall] = useState(false);
  const [callRinging, setCallRinging] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const messageEndRef = useRef<HTMLDivElement>(null);
  const isCallActiveRef = useRef(isCallActive);
  const notifyIncomingCallRef = useRef<() => void>(() => {});

  // Configuration WebRTC
  const iceServers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ];

  // Créer une sonnerie audio réelle
  const playRingtone = () => {
    try {
      // Créer un son de sonnerie classique
      const audioContext = new AudioContext();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Créer une mélodie de sonnerie téléphonique classique
      const now = audioContext.currentTime;
      oscillator.frequency.setValueAtTime(800, now);
      oscillator.frequency.setValueAtTime(600, now + 0.2);
      oscillator.frequency.setValueAtTime(800, now + 0.4);
      
      gainNode.gain.setValueAtTime(0.3, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
      
      oscillator.start(now);
      oscillator.stop(now + 0.6);
      
      // Répéter la sonnerie
      if (callRinging) {
        setTimeout(() => {
          if (callRinging) {
            playRingtone();
          }
        }, 1000);
      }
      
    } catch (error) {
      console.error('Erreur sonnerie:', error);
    }
  };

  // Notifier un appel entrant
  const notifyIncomingCall = () => {
    console.log('Appel entant détecté!');
    setIncomingCall(true);
    setCallRinging(true);
    playRingtone();
    
    // Notification navigateur
    if (Notification.permission === 'granted') {
      new Notification('📞 Appel entrant', {
        body: `${userRole === 'vendor' ? 'Un client' : 'Le vendeur'} vous appelle`,
        icon: '/vite.svg',
        badge: '/vite.svg',
        vibrate: [200, 100, 200]
      });
    }
  };

  isCallActiveRef.current = isCallActive;
  notifyIncomingCallRef.current = notifyIncomingCall;

  // Accepter l'appel
  const acceptIncomingCall = async () => {
    console.log('Acceptation de l\'appel');
    setIncomingCall(false);
    setCallRinging(false);
    await startCall();
  };

  // Refuser l'appel
  const rejectIncomingCall = () => {
    console.log('Refus de l\'appel');
    setIncomingCall(false);
    setCallRinging(false);
  };

  // Demander permission notifications
  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Connexion WebSocket simplifiée
  useEffect(() => {
    console.log('Connexion WebSocket...');
    const ws = new WebSocket('ws://localhost:3001');
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connecté');
      ws.send(JSON.stringify({
        type: 'join-room',
        roomId,
        role: userRole,
        userId: userRole === 'vendor' ? 'vendor-123' : 'client-456'
      }));
    };

    ws.onmessage = async (event) => {
      const data = JSON.parse(event.data);
      console.log('Message reçu:', data.type, data);
      
      switch (data.type) {
        case 'joined-room':
          console.log('Rejoint la salle:', data.roomId);
          break;

        case 'other-users':
          console.log('Autres utilisateurs:', data.users);
          // Si on est le client et qu'il y a un vendeur, on attend l'appel
          if (userRole === 'customer' && data.users.length > 0) {
            console.log('Client en attente d\'appel du vendeur');
          }
          break;

        case 'offer':
          console.log('Offre reçue du vendeur');
          if (!isCallActiveRef.current) {
            notifyIncomingCallRef.current();
          }
          await handleOffer(data.data, data.from);
          break;

        case 'answer':
          console.log('Réponse reçue');
          await handleAnswer(data.data);
          break;

        case 'ice-candidate':
          await handleIceCandidate(data.data);
          break;

        case 'chat-message':
          console.log('Message chat reçu:', data.message);
          {
            const newMsg: ChatMessage = {
              id: Date.now().toString(),
              user: data.from === 'vendor' ? 'Vendeur' : 'Client',
              message: data.message,
              timestamp: new Date(data.timestamp),
              role: data.from
            };
            setMessages(prev => [...prev, newMsg]);
          }
          break;
      }
    };

    ws.onclose = () => {
      console.log('WebSocket déconnecté');
    };

    return () => {
      ws.close();
    };
  }, [roomId, userRole]);

  // WebRTC Functions
  const createOffer = async () => {
    if (!peerConnectionRef.current) return;
    try {
      console.log('Création de l\'offre...');
      const offer = await peerConnectionRef.current.createOffer();
      await peerConnectionRef.current.setLocalDescription(offer);
      
      console.log('Envoi de l\'offre');
      wsRef.current?.send(JSON.stringify({
        type: 'offer',
        data: offer
      }));
    } catch (error) {
      console.error('Erreur offre:', error);
    }
  };

  const handleOffer = async (offer: RTCSessionDescriptionInit, from: string) => {
    if (!peerConnectionRef.current) return;
    try {
      console.log('Traitement de l\'offre...');
      await peerConnectionRef.current.setRemoteDescription(offer);
      const answer = await peerConnectionRef.current.createAnswer();
      await peerConnectionRef.current.setLocalDescription(answer);
      
      console.log('Envoi de la réponse');
      wsRef.current?.send(JSON.stringify({
        type: 'answer',
        data: answer
      }));
    } catch (error) {
      console.error('Erreur traitement offre:', error);
    }
  };

  const handleAnswer = async (answer: RTCSessionDescriptionInit) => {
    if (!peerConnectionRef.current) return;
    try {
      console.log('Traitement de la réponse...');
      await peerConnectionRef.current.setRemoteDescription(answer);
    } catch (error) {
      console.error('Erreur traitement réponse:', error);
    }
  };

  const handleIceCandidate = async (candidate: RTCIceCandidateInit) => {
    if (!peerConnectionRef.current) return;
    try {
      await peerConnectionRef.current.addIceCandidate(candidate);
    } catch (error) {
      console.error('Erreur ICE:', error);
    }
  };

  // Démarrer l'appel
  const startCall = async () => {
    try {
      console.log('Démarrage de l\'appel...');
      setConnectionStatus('connecting');

      // Obtenir le flux média
      console.log('Obtention du flux média...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: isVideoEnabled,
        audio: isAudioEnabled
      });

      console.log('Flux média obtenu');
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Créer connexion peer-to-peer
      console.log('Création de la connexion peer-to-peer...');
      const peerConnection = new RTCPeerConnection({ iceServers });
      peerConnectionRef.current = peerConnection;

      // Ajouter le flux local
      stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, stream);
      });

      // Gérer le flux distant
      peerConnection.ontrack = (event) => {
        console.log('Flux distant reçu:', event.streams[0]);
        if (remoteVideoRef.current && event.streams[0]) {
          remoteVideoRef.current.srcObject = event.streams[0];
          setConnectionStatus('connected');
          setRemoteUserName(userRole === 'vendor' ? 'Client' : 'Vendeur');
        }
      };

      // Gérer les candidats ICE
      peerConnection.onicecandidate = (event) => {
        if (event.candidate && wsRef.current) {
          console.log('Envoi du candidat ICE');
          wsRef.current.send(JSON.stringify({
            type: 'ice-candidate',
            data: event.candidate
          }));
        }
      };

      setIsCallActive(true);
      onStreamStart?.();

      // Si on est le vendeur, on crée l'offre
      if (userRole === 'vendor') {
        console.log('Vendeur: création de l\'offre...');
        await createOffer();
      }

    } catch (error) {
      console.error('Erreur démarrage appel:', error);
      alert('Impossible d\'accéder à la caméra ou au microphone.');
      setConnectionStatus('disconnected');
    }
  };

  // Envoyer un message
  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !wsRef.current) return;

    const message: ChatMessage = {
      id: Date.now().toString(),
      user: userRole === 'vendor' ? 'Vendeur' : 'Client',
      message: newMessage,
      timestamp: new Date(),
      role: userRole
    };

    console.log('Envoi du message:', newMessage);
    wsRef.current.send(JSON.stringify({
      type: 'chat-message',
      from: userRole,
      message: newMessage,
      timestamp: new Date().toISOString()
    }));

    setMessages(prev => [...prev, message]);
    setNewMessage('');
  };

  // Faire défiler vers le bas pour les nouveaux messages
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Terminer l'appel
  const endCall = () => {
    console.log('Fin de l\'appel');
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }

    setIsCallActive(false);
    setConnectionStatus('disconnected');
    setRemoteUserName('');
    onStreamEnd?.();
  };

  // Basculer la vidéo
  const toggleVideo = () => {
    setIsVideoEnabled(!isVideoEnabled);
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !isVideoEnabled;
      }
    }
  };

  // Basculer l'audio
  const toggleAudio = () => {
    setIsAudioEnabled(!isAudioEnabled);
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !isAudioEnabled;
      }
    }
  };

  return (
    <div className="h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex flex-col overflow-hidden">
      {/* Notification d'appel entrant */}
      {incomingCall && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 text-center max-w-md mx-4 shadow-2xl">
            <div className="text-8xl mb-6 animate-bounce">📞</div>
            <h3 className="text-2xl font-bold mb-3 text-gray-800">Appel entrant</h3>
            <p className="text-gray-600 mb-8 text-lg">
              {userRole === 'vendor' ? 'Un client' : 'Le vendeur'} vous appelle...
            </p>
            <div className="flex space-x-6">
              <button
                onClick={acceptIncomingCall}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white py-4 px-6 rounded-xl flex items-center justify-center space-x-3 text-lg font-medium transition-colors shadow-lg"
              >
                <Phone className="w-6 h-6" />
                <span>Répondre</span>
              </button>
              <button
                onClick={rejectIncomingCall}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-4 px-6 rounded-xl flex items-center justify-center space-x-3 text-lg font-medium transition-colors shadow-lg"
              >
                <PhoneOff className="w-6 h-6" />
                <span>Refuser</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white p-4 flex-shrink-0 shadow-lg">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-4">
            <Phone className="w-7 h-7" />
            <div>
              <h1 className="text-2xl font-bold">MangooTech WebRTC</h1>
              <p className="text-orange-100">
                {userRole === 'vendor' ? 'Vendeur' : 'Client'} • 
                {connectionStatus === 'connected' ? `Connecté avec ${remoteUserName}` : 'En attente de connexion'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className={`w-4 h-4 rounded-full ${
                connectionStatus === 'connected' ? 'bg-green-400 animate-pulse' :
                connectionStatus === 'connecting' ? 'bg-yellow-400 animate-pulse' :
                'bg-gray-400'
              }`} />
              <span className="text-lg font-medium">
                {connectionStatus === 'connected' ? 'Connecté' :
                 connectionStatus === 'connecting' ? 'Connexion...' :
                 'Déconnecté'}
              </span>
            </div>
            
            {isCallActive && (
              <button
                onClick={endCall}
                className="bg-red-500 hover:bg-red-600 px-6 py-3 rounded-xl flex items-center space-x-3 text-lg font-medium transition-colors shadow-lg"
              >
                <PhoneOff className="w-5 h-5" />
                <span>Raccrocher</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Zone principale */}
      <div className="flex-1 p-6 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full max-w-7xl mx-auto">
          {/* Zone vidéo */}
          <div className="lg:col-span-2 flex flex-col">
            <div className="bg-black rounded-2xl overflow-hidden shadow-2xl relative flex-1 min-h-0">
              {/* Vidéo locale */}
              <div className="relative h-full">
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
                
                {/* Vidéo distante */}
                {connectionStatus === 'connected' && (
                  <div className="absolute top-6 right-6 w-48 h-36 bg-gray-800 rounded-xl overflow-hidden border-4 border-orange-500 shadow-xl">
                    <video
                      ref={remoteVideoRef}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-2 left-2 bg-black bg-opacity-80 text-white text-sm px-2 py-1 rounded-lg">
                      {remoteUserName}
                    </div>
                  </div>
                )}
                
                {/* Badge rôle */}
                <div className="absolute top-6 left-6 bg-orange-500 text-white px-4 py-2 rounded-full text-lg font-bold shadow-lg">
                  {userRole === 'vendor' ? 'Vendeur' : 'Client'}
                </div>
                
                {/* Contrôles vidéo */}
                {isCallActive && (
                  <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-4">
                    <button
                      onClick={toggleVideo}
                      className={`p-4 rounded-full transition-all shadow-xl transform hover:scale-110 ${
                        isVideoEnabled 
                          ? 'bg-orange-500 hover:bg-orange-600 text-white' 
                          : 'bg-gray-700 hover:bg-gray-800 text-white'
                      }`}
                      title={isVideoEnabled ? 'Désactiver la vidéo' : 'Activer la vidéo'}
                    >
                      {isVideoEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
                    </button>
                    
                    <button
                      onClick={toggleAudio}
                      className={`p-4 rounded-full transition-all shadow-xl transform hover:scale-110 ${
                        isAudioEnabled 
                          ? 'bg-orange-500 hover:bg-orange-600 text-white' 
                          : 'bg-gray-700 hover:bg-gray-800 text-white'
                      }`}
                      title={isAudioEnabled ? 'Désactiver le micro' : 'Activer le micro'}
                    >
                      {isAudioEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
                    </button>
                    
                    <button
                      onClick={endCall}
                      className="p-4 rounded-full bg-red-500 hover:bg-red-600 text-white transition-all shadow-xl transform hover:scale-110"
                      title="Raccrocher"
                    >
                      <PhoneOff className="w-6 h-6" />
                    </button>
                  </div>
                )}
              </div>
              
              {/* Zone de contrôle principal */}
              {!isCallActive && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-60">
                  <div className="text-center">
                    <div className="text-6xl mb-6 animate-bounce">📹</div>
                    <button
                      onClick={startCall}
                      className="bg-green-500 hover:bg-green-600 text-white px-10 py-5 rounded-2xl flex items-center space-x-4 text-xl font-bold transition-all shadow-2xl transform hover:scale-105"
                    >
                      <Phone className="w-8 h-8" />
                      <span>Commencez l'appel</span>
                    </button>
                    <p className="text-white mt-4 text-lg">Appel sécurisé MangooTech</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Chat */}
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white p-5">
              <div className="flex items-center space-x-3">
                <Send className="w-6 h-6" />
                <h3 className="font-bold text-xl">Chat Africain</h3>
                <div className="flex-1"></div>
                {connectionStatus === 'connected' && (
                  <div className="flex items-center space-x-2 bg-green-500 px-3 py-1 rounded-full">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium">En ligne</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-5 space-y-4 min-h-0">
              {messages.length === 0 ? (
                <div className="text-gray-500 text-center py-12">
                  <User className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">Aucun message encore</p>
                  <p className="text-sm mt-2">Discutez avec {userRole === 'vendor' ? 'votre client' : 'le vendeur'} !</p>
                  {connectionStatus !== 'connected' && (
                    <p className="text-xs mt-3 text-orange-500">💡 Connectez-vous pour discuter</p>
                  )}
                </div>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} className={`p-4 rounded-2xl transition-all ${
                    msg.role === userRole
                      ? 'bg-orange-100 ml-8 shadow-sm'
                      : 'bg-gray-100 mr-8 shadow-sm'
                  }`}>
                    <div className="flex items-center space-x-3 mb-2">
                      <div className={`w-3 h-3 rounded-full ${
                        msg.role === 'vendor' ? 'bg-orange-500' : 'bg-blue-500'
                      }`} />
                      <div className="font-bold text-sm text-gray-700">{msg.user}</div>
                      <div className="text-xs text-gray-500">
                        {msg.timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <div className="text-gray-800 text-base leading-relaxed">{msg.message}</div>
                  </div>
                ))
              )}
              <div ref={messageEndRef} />
            </div>
            
            <form onSubmit={sendMessage} className="p-5 border-t bg-gray-50">
              <div className="flex space-x-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={connectionStatus === 'connected' ? 'Tapez votre message...' : 'Connectez-vous pour discuter'}
                  className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all text-lg"
                  disabled={connectionStatus !== 'connected'}
                />
                <button
                  type="submit"
                  className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl transition-all transform hover:scale-105 disabled:bg-gray-300 disabled:transform-none shadow-lg font-medium"
                  disabled={connectionStatus !== 'connected' || !newMessage.trim()}
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WebRTCManagerSimple;
