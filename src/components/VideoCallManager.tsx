import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useVideoCall } from '../contexts/VideoCallContext';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import VideoCall from './VideoCall';
import { Phone, Video, Users, Play, Square, Settings, Wifi, WifiOff } from 'lucide-react';

interface VoIPConfig {
  host: string;
  port: number;
  username: string;
  password: string;
}

interface LiveStreamSession {
  id: string;
  title: string;
  description: string;
  streamer: {
    id: string;
    name: string;
  };
  viewers: number;
  products: any[];
  status: 'live' | 'ended';
  startTime: Date;
}

const VideoCallManager: React.FC = () => {
  const { user } = useAuth();
  const { connectToVoIP, webRTCService, isInCall } = useVideoCall();
  const { addNotification } = useNotification();
  
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [voipConfig, setVoipConfig] = useState<VoIPConfig>({
    host: '',
    port: 8080,
    username: '',
    password: ''
  });
  
  // État des sessions
  const [activeSessions, setActiveSessions] = useState<LiveStreamSession[]>([]);
  const [myStreams, setMyStreams] = useState<LiveStreamSession[]>([]);
  const [showVoipConfig, setShowVoipConfig] = useState(false);
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [currentCallParticipant, setCurrentCallParticipant] = useState<string>('');
  const handleAnswerCallRef = useRef<(callData: any) => void | Promise<void>>(() => {});
  const handleRejectCallRef = useRef<(callId: string) => void>(() => {});

  // Connexion au serveur de signalisation
  useEffect(() => {
    if (!user) return;

    const displayName = user.user_metadata?.full_name || user.email;
    const userRole = 'customer';

    const newSocket = io('http://localhost:3001', {
      transports: ['websocket']
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      console.log('Connecté au serveur WebRTC');
      
      // S'enregistrer
      newSocket.emit('register', {
        userId: user.id,
        name: displayName,
        role: userRole
      });
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Déconnecté du serveur WebRTC');
    });

    // Gestion des appels entrants
    newSocket.on('incomingCall', (callData) => {
      addNotification({
        type: 'info',
        title: 'Appel entrant',
        message: `${callData.caller.name} vous appelle`,
        priority: 'high',
        duration: 10000,
        actions: [
          {
            label: 'Répondre',
            onClick: () => void handleAnswerCallRef.current(callData)
          },
          {
            label: 'Refuser',
            onClick: () => handleRejectCallRef.current(callData.callId)
          }
        ]
      });
    });

    // Gestion des streams live
    newSocket.on('liveStreamStarted', (streamData) => {
      setActiveSessions(prev => [...prev, {
        ...streamData,
        startTime: new Date(),
        status: 'live'
      }]);
    });

    newSocket.on('liveStreamEnded', (streamData) => {
      setActiveSessions(prev => prev.filter(s => s.id !== streamData.streamId));
      setMyStreams(prev => prev.filter(s => s.id !== streamData.streamId));
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [addNotification, user]);

  const handleConnectVoIP = async () => {
    try {
      await connectToVoIP({
        username: voipConfig.username,
        password: voipConfig.password
      });
      
      addNotification({
        type: 'success',
        title: 'VoIP Connecté',
        message: 'Connexion au serveur VoIP établie',
        priority: 'low',
      });
      
      setShowVoipConfig(false);
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Erreur VoIP',
        message: 'Impossible de se connecter au serveur VoIP',
        priority: 'high',
      });
    }
  };

  const handleStartLiveStream = () => {
    if (!socket) return;

    const streamData = {
      title: '📱 Vente Flash Smartphones - Jusqu\'à -50%',
      description: 'Découvrez nos meilleurs smartphones en promotion limitée!',
      products: [
        {
          id: 'prod_001',
          name: 'iPhone 14 Pro',
          price: '899€',
          originalPrice: '1199€',
          image: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=300'
        },
        {
          id: 'prod_002', 
          name: 'Samsung Galaxy S23',
          price: '699€',
          originalPrice: '899€',
          image: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=300'
        }
      ]
    };

    socket.emit('startLiveStream', streamData);
    
    const newStream = {
      id: `stream_${Date.now()}`,
      ...streamData,
      streamer: { id: user.id, name: user.user_metadata?.full_name || user.email },
      viewers: 0,
      status: 'live' as const,
      startTime: new Date()
    };
    
    setMyStreams(prev => [...prev, newStream]);
    
    addNotification({
      type: 'success',
      title: 'Stream Démaré',
      message: 'Votre live shopping est en ligne',
      priority: 'low',
    });
  };

  const handleAnswerCall = async (callData: any) => {
    if (!socket) return;

    setCurrentCallParticipant(callData.caller.userId);
    setShowVideoCall(true);

    // Répondre à l'appel via WebRTC
    try {
      if (webRTCService && callData.offer) {
        await webRTCService.answerCall(callData.caller.userId, callData.offer);
      }
      
      socket.emit('answerCall', {
        callId: callData.callId,
        answer: {} // La réponse WebRTC sera gérée par le service
      });
    } catch (error) {
      console.error('Erreur lors de la réponse à l\'appel:', error);
    }
  };

  const handleRejectCall = (callId: string) => {
    if (!socket) return;
    
    socket.emit('rejectCall', { callId });
  };

  handleAnswerCallRef.current = handleAnswerCall;
  handleRejectCallRef.current = handleRejectCall;

  const handleStartCall = (participantId: string, type: 'video' | 'audio') => {
    setCurrentCallParticipant(participantId);
    setShowVideoCall(true);
  };

  return (
    <div className="space-y-6">
      {/* En-tête avec statut de connexion */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Gestion des Appels Vidéo</h2>
            <p className="text-gray-600">Appels audio/vidéo et live shopping</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              {isConnected ? (
                <div className="flex items-center space-x-2 text-green-600">
                  <Wifi className="w-5 h-5" />
                  <span className="text-sm">Connecté</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2 text-red-600">
                  <WifiOff className="w-5 h-5" />
                  <span className="text-sm">Déconnecté</span>
                </div>
              )}
            </div>
            
            <button
              onClick={() => setShowVoipConfig(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
            >
              <Settings className="w-4 h-4" />
              <span>Config VoIP</span>
            </button>
          </div>
        </div>
      </div>

      {/* Configuration VoIP */}
      {showVoipConfig && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Configuration Serveur VoIP</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Hôte</label>
              <input
                type="text"
                value={voipConfig.host}
                onChange={(e) => setVoipConfig(prev => ({ ...prev, host: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="votre-serveur-contabo.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Port</label>
              <input
                type="number"
                value={voipConfig.port}
                onChange={(e) => setVoipConfig(prev => ({ ...prev, port: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nom d'utilisateur</label>
              <input
                type="text"
                value={voipConfig.username}
                onChange={(e) => setVoipConfig(prev => ({ ...prev, username: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mot de passe</label>
              <input
                type="password"
                value={voipConfig.password}
                onChange={(e) => setVoipConfig(prev => ({ ...prev, password: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex space-x-4 mt-6">
            <button
              onClick={handleConnectVoIP}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
            >
              Connecter
            </button>
            <button
              onClick={() => setShowVoipConfig(false)}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Actions rapides */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Video className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold">Appel Vidéo</h3>
          </div>
          <p className="text-gray-600 mb-4">Démarrez un appel vidéo avec un client</p>
          <button
            onClick={() => handleStartCall('client_001', 'video')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg"
          >
            Démarrer Appel
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Phone className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold">Appel Audio</h3>
          </div>
          <p className="text-gray-600 mb-4">Appel audio uniquement</p>
          <button
            onClick={() => handleStartCall('client_001', 'audio')}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg"
          >
            Démarrer Appel
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold">Live Shopping</h3>
          </div>
          <p className="text-gray-600 mb-4">Démarrez une session de vente en direct</p>
          <button
            onClick={handleStartLiveStream}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg"
          >
            <Play className="w-4 h-4 inline mr-2" />
            Démarrer Stream
          </button>
        </div>
      </div>

      {/* Sessions actives */}
      {activeSessions.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Sessions Live Actives</h3>
          <div className="space-y-4">
            {activeSessions.map((session) => (
              <div key={session.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">{session.title}</h4>
                    <p className="text-gray-600 text-sm">{session.description}</p>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                      <span>Streamer: {session.streamer.name}</span>
                      <span>{session.viewers} viewers</span>
                      <span className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                        <span>LIVE</span>
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      // Logique pour rejoindre le stream
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                  >
                    Rejoindre
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mes streams */}
      {myStreams.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Mes Streams</h3>
          <div className="space-y-4">
            {myStreams.map((stream) => (
              <div key={stream.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">{stream.title}</h4>
                    <p className="text-gray-600 text-sm">{stream.description}</p>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                      <span>{stream.viewers} viewers</span>
                      <span>Duration: {Math.floor((Date.now() - stream.startTime.getTime()) / 1000 / 60)} min</span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      // Logique pour arrêter le stream
                      if (socket) {
                        socket.emit('endLiveStream', { streamId: stream.id });
                      }
                    }}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                  >
                    <Square className="w-4 h-4" />
                    <span>Arrêter</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Appel vidéo actif */}
      {showVideoCall && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Appel Vidéo</h3>
              <button
                onClick={() => setShowVideoCall(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            <div className="p-4">
              <VideoCall
                participantId={currentCallParticipant}
                participantName="Client"
                onCallEnd={() => setShowVideoCall(false)}
                className="w-full"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoCallManager;
