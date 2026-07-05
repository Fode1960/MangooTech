import React, { useState, useEffect, useRef } from 'react';
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff, Settings, Send, User } from 'lucide-react';

interface WebRTCManagerAfricainProps {
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

const WebRTCManagerAfricain: React.FC<WebRTCManagerAfricainProps> = ({
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
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const notifyIncomingCallRef = useRef<() => void>(() => {});

  // Configuration WebRTC avec serveurs TURN/STUN
  const iceServers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    // Ajouter vos serveurs TURN ici si disponible
  ];

  // Fonction pour jouer la sonnerie
  const playRingtone = () => {
    if (audioRef.current) {
      audioRef.current.loop = true;
      audioRef.current.play().catch(console.error);
    }
  };

  // Fonction pour arrêter la sonnerie
  const stopRingtone = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  // Fonction pour notifier un appel entrant
  const notifyIncomingCall = () => {
    setIncomingCall(true);
    setCallRinging(true);
    playRingtone();
    
    // Notification navigateur
    if (Notification.permission === 'granted') {
      new Notification('Appel entrant', {
        body: `${userRole === 'vendor' ? 'Un client' : 'Le vendeur'} vous appelle`,
        icon: '/vite.svg'
      });
    }
  };

  notifyIncomingCallRef.current = notifyIncomingCall;

  // Accepter l'appel entrant
  const acceptIncomingCall = async () => {
    setIncomingCall(false);
    setCallRinging(false);
    stopRingtone();
    await startCall();
  };

  // Refuser l'appel entrant
  const rejectIncomingCall = () => {
    setIncomingCall(false);
    setCallRinging(false);
    stopRingtone();
  };

  // Demander la permission pour les notifications
  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Connexion WebSocket pour signalisation
  useEffect(() => {
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
      
      switch (data.type) {
        case 'joined-room':
          console.log('Rejoint la salle:', data.roomId);
          break;

        case 'other-users':
          if (data.users.length > 0 && !isCallActive) {
            notifyIncomingCallRef.current();
          }
          break;

        case 'offer':
          if (!isCallActive) {
            notifyIncomingCallRef.current();
          }
          await handleOffer(data.data, data.from);
          break;

        case 'answer':
          await handleAnswer(data.data);
          break;

        case 'ice-candidate':
          await handleIceCandidate(data.data);
          break;

        case 'chat-message':
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            user: data.from === 'vendor' ? 'Vendeur' : 'Client',
            message: data.message,
            timestamp: new Date(data.timestamp),
            role: data.from
          }]);
          break;
      }
    };

    ws.onclose = () => {
      console.log('WebSocket déconnecté');
      stopRingtone();
    };

    return () => {
      ws.close();
      stopRingtone();
    };
  }, [roomId, userRole, isCallActive]);

  // Créer une offre WebRTC
  const createOffer = async () => {
    if (!peerConnectionRef.current) return;

    try {
      const offer = await peerConnectionRef.current.createOffer();
      await peerConnectionRef.current.setLocalDescription(offer);
      
      wsRef.current?.send(JSON.stringify({
        type: 'offer',
        data: offer
      }));
    } catch (error) {
      console.error('Erreur lors de la création de l\'offre:', error);
    }
  };

  // Gérer une offre WebRTC
  const handleOffer = async (offer: RTCSessionDescriptionInit, from: string) => {
    if (!peerConnectionRef.current) return;

    try {
      await peerConnectionRef.current.setRemoteDescription(offer);
      const answer = await peerConnectionRef.current.createAnswer();
      await peerConnectionRef.current.setLocalDescription(answer);
      
      wsRef.current?.send(JSON.stringify({
        type: 'answer',
        data: answer
      }));
    } catch (error) {
      console.error('Erreur lors du traitement de l\'offre:', error);
    }
  };

  // Gérer une réponse WebRTC
  const handleAnswer = async (answer: RTCSessionDescriptionInit) => {
    if (!peerConnectionRef.current) return;

    try {
      await peerConnectionRef.current.setRemoteDescription(answer);
    } catch (error) {
      console.error('Erreur lors du traitement de la réponse:', error);
    }
  };

  // Gérer les candidats ICE
  const handleIceCandidate = async (candidate: RTCIceCandidateInit) => {
    if (!peerConnectionRef.current) return;

    try {
      await peerConnectionRef.current.addIceCandidate(candidate);
    } catch (error) {
      console.error('Erreur lors de l\'ajout du candidat ICE:', error);
    }
  };

  // Gérer le départ d'un utilisateur distant
  const handleRemoteUserLeft = () => {
    setRemoteUserName('');
    setConnectionStatus('disconnected');
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
  };

  // Démarrer l'appel WebRTC
  const startCall = async () => {
    try {
      setConnectionStatus('connecting');

      // Obtenir le flux média local
      const stream = await navigator.mediaDevices.getUserMedia({
        video: isVideoEnabled,
        audio: isAudioEnabled
      });

      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Créer la connexion peer-to-peer
      const peerConnection = new RTCPeerConnection({ iceServers });
      peerConnectionRef.current = peerConnection;

      // Ajouter le flux local
      stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, stream);
      });

      // Gérer le flux distant
      peerConnection.ontrack = (event) => {
        if (remoteVideoRef.current && event.streams[0]) {
          remoteVideoRef.current.srcObject = event.streams[0];
          setConnectionStatus('connected');
        }
      };

      // Gérer les candidats ICE
      peerConnection.onicecandidate = (event) => {
        if (event.candidate && wsRef.current) {
          wsRef.current.send(JSON.stringify({
            type: 'ice-candidate',
            data: event.candidate
          }));
        }
      };

      // Créer le canal de données pour le chat
      const dataChannel = peerConnection.createDataChannel('chat', {
        ordered: true
      });
      dataChannelRef.current = dataChannel;

      dataChannel.onopen = () => {
        console.log('Canal de données ouvert');
      };

      dataChannel.onmessage = (event) => {
        const message = JSON.parse(event.data);
        setMessages(prev => [...prev, message]);
      };

      // Gérer le canal de données distant
      peerConnection.ondatachannel = (event) => {
        const remoteDataChannel = event.channel;
        remoteDataChannel.onopen = () => {
          console.log('Canal de données distant ouvert');
        };
        remoteDataChannel.onmessage = (event) => {
          const message = JSON.parse(event.data);
          setMessages(prev => [...prev, message]);
        };
      };

      setIsCallActive(true);
      onStreamStart?.();

    } catch (error) {
      console.error('Erreur lors du démarrage de l\'appel:', error);
      alert('Impossible d\'accéder à la caméra ou au microphone. Veuillez vérifier les permissions.');
      setConnectionStatus('disconnected');
    }
  };

  // Envoyer un message via WebSocket
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

    // Envoyer via WebSocket
    wsRef.current.send(JSON.stringify({
      type: 'chat-message',
      from: userRole,
      message: newMessage,
      timestamp: new Date().toISOString()
    }));

    // Afficher le message localement
    setMessages(prev => [...prev, message]);
    setNewMessage('');
  };

  // Terminer l'appel
  const endCall = () => {
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
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex flex-col">
      {/* Audio pour la sonnerie */}
      <audio
        ref={audioRef}
        src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmFgU7k9n1unEiBC13yO/eizEIHWq+8+OWT"
        preload="auto"
      />

      {/* Notification d'appel entrant */}
      {incomingCall && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 text-center max-w-md mx-4">
            <div className="text-6xl mb-4">📞</div>
            <h3 className="text-xl font-bold mb-2">Appel entrant</h3>
            <p className="text-gray-600 mb-6">
              {userRole === 'vendor' ? 'Un client' : 'Le vendeur'} vous appelle...
            </p>
            <div className="flex space-x-4">
              <button
                onClick={acceptIncomingCall}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-lg flex items-center justify-center space-x-2"
              >
                <Phone className="w-5 h-5" />
                <span>Répondre</span>
              </button>
              <button
                onClick={rejectIncomingCall}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 px-4 rounded-lg flex items-center justify-center space-x-2"
              >
                <PhoneOff className="w-5 h-5" />
                <span>Refuser</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white p-4 flex-shrink-0">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center space-x-3">
            <Phone className="w-6 h-6" />
            <div>
              <h1 className="text-xl font-bold">MangooTech WebRTC Africain</h1>
              <p className="text-sm text-orange-100">
                {userRole === 'vendor' ? 'Vendeur' : 'Client'} • {remoteUserName ? `Connecté avec ${remoteUserName}` : 'En attente de connexion'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${
                connectionStatus === 'connected' ? 'bg-green-500' :
                connectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' :
                'bg-gray-400'
              }`} />
              <span className="text-sm">
                {connectionStatus === 'connected' ? 'Connecté' :
                 connectionStatus === 'connecting' ? 'Connexion...' :
                 'Déconnecté'}
              </span>
            </div>
            
            {isCallActive && (
              <button
                onClick={endCall}
                className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <PhoneOff className="w-4 h-4" />
                <span>Raccrocher</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Contenu principal avec flex-grow */}
      <div className="flex-1 max-w-6xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
          {/* Zone vidéo */}
          <div className="lg:col-span-2 flex flex-col">
            <div className="bg-black rounded-xl overflow-hidden shadow-lg relative flex-1">
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
                  <div className="absolute top-4 right-4 w-40 h-32 bg-gray-800 rounded-lg overflow-hidden border-2 border-orange-500">
                    <video
                      ref={remoteVideoRef}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-1 left-1 bg-black bg-opacity-70 text-white text-xs px-1 rounded">
                      {remoteUserName}
                    </div>
                  </div>
                )}
                
                {/* Badge rôle */}
                <div className="absolute top-4 left-4 bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                  {userRole === 'vendor' ? 'Vendeur' : 'Client'}
                </div>
                
                {/* Contrôles vidéo */}
                {isCallActive && (
                  <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-3">
                    <button
                      onClick={toggleVideo}
                      className={`p-3 rounded-full transition-colors shadow-lg ${
                        isVideoEnabled 
                          ? 'bg-orange-500 hover:bg-orange-600 text-white' 
                          : 'bg-gray-600 hover:bg-gray-700 text-white'
                      }`}
                      title={isVideoEnabled ? 'Désactiver la vidéo' : 'Activer la vidéo'}
                    >
                      {isVideoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                    </button>
                    
                    <button
                      onClick={toggleAudio}
                      className={`p-3 rounded-full transition-colors shadow-lg ${
                        isAudioEnabled 
                          ? 'bg-orange-500 hover:bg-orange-600 text-white' 
                          : 'bg-gray-600 hover:bg-gray-700 text-white'
                      }`}
                      title={isAudioEnabled ? 'Désactiver le micro' : 'Activer le micro'}
                    >
                      {isAudioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                    </button>
                    
                    <button
                      onClick={endCall}
                      className="p-3 rounded-full bg-red-500 hover:bg-red-600 text-white transition-colors shadow-lg"
                      title="Raccrocher"
                    >
                      <PhoneOff className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
              
              {/* Zone de contrôle principal */}
              {!isCallActive && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                  <button
                    onClick={startCall}
                    className="bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-xl flex items-center space-x-3 text-lg font-medium transition-colors"
                  >
                    <Phone className="w-6 h-6" />
                    <span>Commencez l'appel</span>
                  </button>
                </div>
              )}
            </div>
            
            {/* Statut de l'appel */}
            <div className="mt-4 bg-white rounded-lg p-4 shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    connectionStatus === 'connected' ? 'bg-green-500 animate-pulse' :
                    connectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' :
                    'bg-gray-400'
                  }`} />
                  <span className="font-medium">
                    {connectionStatus === 'connected' ? `Connecté avec ${remoteUserName}` :
                     connectionStatus === 'connecting' ? 'Connexion en cours...' :
                     'En attente de connexion'}
                  </span>
                </div>
                
                {isCallActive && (
                  <div className="text-sm text-gray-600">
                    Appel en cours
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Chat */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col">
            <div className="bg-orange-500 text-white p-4">
              <div className="flex items-center space-x-2">
                <Send className="w-5 h-5" />
                <h3 className="font-semibold">Chat Africain</h3>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
              {messages.length === 0 ? (
                <div className="text-gray-500 text-center py-8">
                  <User className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Aucun message encore</p>
                  <p className="text-sm">Discutez avec {userRole === 'vendor' ? 'votre client' : 'le vendeur'} !</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} className={`p-3 rounded-lg ${
                    msg.role === userRole
                      ? 'bg-orange-100 ml-8'
                      : 'bg-gray-100 mr-8'
                  }`}>
                    <div className="flex items-center space-x-2 mb-1">
                      <div className={`w-2 h-2 rounded-full ${
                        msg.role === 'vendor' ? 'bg-orange-500' : 'bg-blue-500'
                      }`} />
                      <div className="font-medium text-sm text-gray-600">{msg.user}</div>
                    </div>
                    <div className="text-gray-800">{msg.message}</div>
                  </div>
                ))
              )}
            </div>
            
            <form onSubmit={sendMessage} className="p-4 border-t flex-shrink-0">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Tapez votre message..."
                  className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  disabled={connectionStatus !== 'connected'}
                />
                <button
                  type="submit"
                  className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors disabled:bg-gray-300"
                  disabled={connectionStatus !== 'connected' || !newMessage.trim()}
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WebRTCManagerAfricain;
