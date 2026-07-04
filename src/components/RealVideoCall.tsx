import React, { useCallback, useEffect, useRef, useState } from 'react';
import { webRTCService, CallOptions, LiveShoppingOptions } from '../services/WebRTCService';
import { useAuth } from '../contexts/AuthContext';
import { Mic, MicOff, Video, VideoOff, Phone, PhoneOff, Monitor, MonitorOff, Users, ShoppingBag, Settings, Maximize2, Minimize2 } from 'lucide-react';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'outline' | 'destructive' | 'ghost';
  size?: 'sm' | 'default' | 'lg' | 'icon';
};

const Button: React.FC<ButtonProps> = ({ variant = 'default', className = '', children, ...props }) => {
  const variantClass =
    variant === 'outline'
      ? 'border border-gray-300 bg-white text-gray-900 hover:bg-gray-50'
      : variant === 'destructive'
        ? 'bg-red-600 text-white hover:bg-red-700'
        : variant === 'ghost'
          ? 'bg-transparent text-gray-700 hover:bg-gray-100'
        : 'bg-orange-600 text-white hover:bg-orange-700';
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${variantClass} ${className}`}
    >
      {children}
    </button>
  );
};

const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className = '', children, ...props }) => (
  <div {...props} className={`rounded-xl border border-gray-200 bg-white shadow-sm ${className}`}>
    {children}
  </div>
);

const Badge: React.FC<React.HTMLAttributes<HTMLSpanElement> & { variant?: 'default' | 'destructive' }> = ({
  variant = 'default',
  className = '',
  children,
  ...props
}) => {
  const variantClass = variant === 'destructive' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700';
  return (
    <span {...props} className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${variantClass} ${className}`}>
      {children}
    </span>
  );
};

interface RealVideoCallProps {
  roomId?: string;
  mode: 'video-call' | 'audio-call' | 'live-shopping';
  onCallEnd?: () => void;
}

interface CallParticipant {
  id: string;
  name: string;
  stream?: MediaStream;
  isMuted: boolean;
  isVideoOff: boolean;
}

const RealVideoCall: React.FC<RealVideoCallProps> = ({ 
  roomId = `room_${Date.now()}`, 
  mode, 
  onCallEnd 
}) => {
  const { user } = useAuth();
  const [isCallActive, setIsCallActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [participants, setParticipants] = useState<CallParticipant[]>([]);
  const [callDuration, setCallDuration] = useState(0);
  const [connectionState, setConnectionState] = useState<'connecting' | 'connected' | 'disconnected' | 'failed'>('disconnected');
  const [liveViewers, setLiveViewers] = useState(0);
  const [liveTitle, setLiveTitle] = useState('');
  const [liveProducts, setLiveProducts] = useState<any[]>([]);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());
  const callDurationRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Configuration de l'appel
  const callOptions: CallOptions = {
    video: mode !== 'audio-call',
    audio: true,
    screenShare: false,
    quality: 'high'
  };

  // Configuration du live shopping
  const liveShoppingOptions: LiveShoppingOptions = {
    title: '📱 Vente Flash Smartphones - Jusqu\'à -50%',
    description: 'Découvrez nos meilleurs smartphones en promotion limitée!',
    products: [
      { id: '1', name: 'iPhone 14 Pro', price: 999, image: 'https://via.placeholder.com/150' },
      { id: '2', name: 'Samsung Galaxy S23', price: 899, image: 'https://via.placeholder.com/150' },
      { id: '3', name: 'Google Pixel 7', price: 599, image: 'https://via.placeholder.com/150' }
    ]
  };

  const endCall = useCallback(() => {
    webRTCService.endCall();
    setIsCallActive(false);
    setIsConnecting(false);
    setConnectionState('disconnected');
    setParticipants([]);
    setCallDuration(0);
    
    if (callDurationRef.current) {
      clearInterval(callDurationRef.current);
      callDurationRef.current = null;
    }
    
    if (onCallEnd) {
      onCallEnd();
    }
  }, [onCallEnd]);

  useEffect(() => {
    // Initialiser le service WebRTC
    if (user) {
      webRTCService.initialize(user.id, user.role === 'vendor' ? 'vendor' : 'customer')
        .then(() => {
          console.log('WebRTC Service initialized');
        })
        .catch(error => {
          console.error('Failed to initialize WebRTC:', error);
        });
    }

    return () => {
      webRTCService.destroy();
    };
  }, [user]);

  useEffect(() => {
    // Configurer les écouteurs d'événements
    const handleLocalStream = (stream: MediaStream) => {
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    };

    const handleRemoteStream = ({ peerId, stream }: { peerId: string; stream: MediaStream }) => {
      setParticipants(prev => {
        const existing = prev.find(p => p.id === peerId);
        if (existing) {
          return prev.map(p => p.id === peerId ? { ...p, stream } : p);
        } else {
          return [...prev, { id: peerId, name: `Participant ${peerId}`, stream, isMuted: false, isVideoOff: false }];
        }
      });
    };

    const handlePeerJoined = ({ peerId, userData }: { peerId: string; userData: any }) => {
      setParticipants(prev => [...prev, { 
        id: peerId, 
        name: userData?.name || `Participant ${peerId}`, 
        isMuted: false, 
        isVideoOff: false 
      }]);
    };

    const handlePeerLeft = ({ peerId }: { peerId: string }) => {
      setParticipants(prev => prev.filter(p => p.id !== peerId));
      remoteVideoRefs.current.delete(peerId);
    };

    const handleConnectionStateChange = ({ peerId, state }: { peerId: string; state: string }) => {
      if (state === 'connected') {
        setConnectionState('connected');
      } else if (state === 'failed') {
        setConnectionState('failed');
      }
    };

    const handleRoomJoined = (data: any) => {
      setConnectionState('connected');
      setIsConnecting(false);
      setIsCallActive(true);
      
      // Démarrer le compteur de durée
      callDurationRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    };

    const handleLiveStarted = (data: any) => {
      setLiveTitle(data.title);
      setLiveProducts(data.products || []);
      setConnectionState('connected');
      setIsConnecting(false);
      setIsCallActive(true);
    };

    const handleLiveJoined = (data: any) => {
      setLiveTitle(data.title);
      setLiveProducts(data.products || []);
      setLiveViewers(data.viewers || 0);
      setConnectionState('connected');
      setIsConnecting(false);
      setIsCallActive(true);
    };

    const handleViewerJoined = ({ viewers }: { viewers: number }) => {
      setLiveViewers(viewers);
    };

    const handleCallEnded = () => {
      endCall();
    };

    // Enregistrer les écouteurs
    webRTCService.on('localStream', handleLocalStream);
    webRTCService.on('remoteStream', handleRemoteStream);
    webRTCService.on('peerJoined', handlePeerJoined);
    webRTCService.on('peerLeft', handlePeerLeft);
    webRTCService.on('connectionStateChange', handleConnectionStateChange);
    webRTCService.on('roomJoined', handleRoomJoined);
    webRTCService.on('liveStarted', handleLiveStarted);
    webRTCService.on('liveJoined', handleLiveJoined);
    webRTCService.on('viewerJoined', handleViewerJoined);
    webRTCService.on('callEnded', handleCallEnded);

    return () => {
      webRTCService.off('localStream', handleLocalStream);
      webRTCService.off('remoteStream', handleRemoteStream);
      webRTCService.off('peerJoined', handlePeerJoined);
      webRTCService.off('peerLeft', handlePeerLeft);
      webRTCService.off('connectionStateChange', handleConnectionStateChange);
      webRTCService.off('roomJoined', handleRoomJoined);
      webRTCService.off('liveStarted', handleLiveStarted);
      webRTCService.off('liveJoined', handleLiveJoined);
      webRTCService.off('viewerJoined', handleViewerJoined);
      webRTCService.off('callEnded', handleCallEnded);
    };
  }, [endCall]);

  // Mettre à jour les vidéos distantes quand les participants changent
  useEffect(() => {
    participants.forEach(participant => {
      if (participant.stream && remoteVideoRefs.current.has(participant.id)) {
        const videoElement = remoteVideoRefs.current.get(participant.id);
        if (videoElement && videoElement.srcObject !== participant.stream) {
          videoElement.srcObject = participant.stream;
        }
      }
    });
  }, [participants]);

  const startCall = async () => {
    if (!user) return;
    
    setIsConnecting(true);
    setConnectionState('connecting');
    
    try {
      if (mode === 'live-shopping' && user.role === 'vendor') {
        // Vendor démarre un live shopping
        await webRTCService.startLiveShopping(liveShoppingOptions);
      } else if (mode === 'live-shopping') {
        // Customer rejoint un live shopping
        await webRTCService.joinLiveShopping(roomId);
      } else {
        // Appel vidéo/audio normal
        await webRTCService.startCall(roomId, callOptions);
      }
    } catch (error) {
      console.error('Failed to start call:', error);
      setIsConnecting(false);
      setConnectionState('failed');
    }
  };

  const joinCall = async () => {
    if (!user) return;
    
    setIsConnecting(true);
    setConnectionState('connecting');
    
    try {
      if (mode === 'live-shopping') {
        await webRTCService.joinLiveShopping(roomId);
      } else {
        await webRTCService.joinCall(roomId, callOptions);
      }
    } catch (error) {
      console.error('Failed to join call:', error);
      setIsConnecting(false);
      setConnectionState('failed');
    }
  };

  const toggleMute = () => {
    if (webRTCService.localMediaStream) {
      const audioTracks = webRTCService.localMediaStream.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (webRTCService.localMediaStream) {
      const videoTracks = webRTCService.localMediaStream.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff(!isVideoOff);
    }
  };

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      webRTCService.stopScreenShare();
      setIsScreenSharing(false);
    } else {
      try {
        await webRTCService.startScreenShare();
        setIsScreenSharing(true);
      } catch (error) {
        console.error('Failed to start screen share:', error);
      }
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    
    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Gestion du fullscreen
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  if (!isCallActive && !isConnecting) {
    return (
      <Card className="p-6 max-w-md mx-auto">
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            {mode === 'live-shopping' ? (
              <ShoppingBag className="w-8 h-8 text-blue-600" />
            ) : mode === 'audio-call' ? (
              <Phone className="w-8 h-8 text-blue-600" />
            ) : (
              <Video className="w-8 h-8 text-blue-600" />
            )}
          </div>
          
          <div>
            <h3 className="text-lg font-semibold">
              {mode === 'live-shopping' ? 'Live Shopping' : 
               mode === 'audio-call' ? 'Appel Audio' : 'Appel Vidéo'}
            </h3>
            <p className="text-gray-600 text-sm mt-1">
              {mode === 'live-shopping' ? 'Démarrez ou rejoignez un live shopping' :
               'Démarrez ou rejoignez un appel'}
            </p>
          </div>

          {mode === 'live-shopping' && user?.role === 'vendor' && (
            <div className="text-left space-y-2">
              <h4 className="font-medium">Configuration du Live :</h4>
              <input
                type="text"
                placeholder="Titre du live"
                value={liveTitle}
                onChange={(e) => setLiveTitle(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
              <textarea
                placeholder="Description"
                value={liveShoppingOptions.description}
                onChange={(e) => setLiveTitle(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm h-20 resize-none"
              />
            </div>
          )}

          <div className="flex gap-3">
            {user?.role === 'vendor' && mode === 'live-shopping' ? (
              <Button 
                onClick={startCall}
                className="flex-1 bg-red-600 hover:bg-red-700"
                disabled={isConnecting}
              >
                {isConnecting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Connexion...
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4 mr-2" />
                    Démarrer le Live
                  </>
                )}
              </Button>
            ) : (
              <>
                <Button 
                  onClick={startCall}
                  className="flex-1"
                  disabled={isConnecting}
                >
                  {isConnecting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Connexion...
                    </>
                  ) : (
                    <>
                      <Phone className="w-4 h-4 mr-2" />
                      Appeler
                    </>
                  )}
                </Button>
                <Button 
                  onClick={joinCall}
                  variant="outline"
                  className="flex-1"
                  disabled={isConnecting}
                >
                  Rejoindre
                </Button>
              </>
            )}
          </div>

          {connectionState === 'failed' && (
            <div className="text-red-600 text-sm">
              Échec de connexion. Vérifiez votre connexion internet et réessayez.
            </div>
          )}
        </div>
      </Card>
    );
  }

  return (
    <div ref={containerRef} className={`relative bg-gray-900 rounded-lg overflow-hidden ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* En-tête */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/50 to-transparent p-4">
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            {mode === 'live-shopping' && (
              <Badge variant="destructive" className="animate-pulse">
                <div className="w-2 h-2 bg-red-500 rounded-full mr-1"></div>
                LIVE
              </Badge>
            )}
            <div className="text-sm">
              {mode === 'live-shopping' ? liveTitle : `Appel ${mode === 'audio-call' ? 'audio' : 'vidéo'}`}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {mode === 'live-shopping' && (
              <div className="flex items-center gap-1 text-sm">
                <Users className="w-4 h-4" />
                {liveViewers}
              </div>
            )}
            <div className="text-sm font-mono">
              {formatDuration(callDuration)}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFullscreen}
              className="text-white hover:text-white hover:bg-white/20"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Zone vidéo principale */}
      <div className="relative h-96 md:h-[500px] lg:h-[600px]">
        {/* Vidéo locale */}
        <div className="absolute top-4 right-4 z-20 w-32 h-24 bg-gray-800 rounded-lg overflow-hidden border-2 border-white/20">
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
          />
          {isVideoOff && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-700">
              <VideoOff className="w-8 h-8 text-gray-400" />
            </div>
          )}
        </div>

        {/* Vidéos distantes */}
        <div className={`h-full ${participants.length === 0 ? 'flex items-center justify-center' : ''}`}>
          {participants.length === 0 ? (
            <div className="text-center text-white/60">
              <div className="w-20 h-20 mx-auto mb-4 bg-white/10 rounded-full flex items-center justify-center">
                {mode === 'live-shopping' ? (
                  <ShoppingBag className="w-10 h-10" />
                ) : (
                  <Users className="w-10 h-10" />
                )}
              </div>
              <p>En attente de participants...</p>
            </div>
          ) : (
            <div className={`grid gap-2 h-full ${
              participants.length === 1 ? 'grid-cols-1' :
              participants.length === 2 ? 'grid-cols-2' :
              participants.length <= 4 ? 'grid-cols-2' :
              'grid-cols-3'
            }`}>
              {participants.map((participant) => (
                <div key={participant.id} className="relative bg-gray-800 rounded-lg overflow-hidden">
                  <video
                    ref={(el) => {
                      if (el && participant.stream) {
                        remoteVideoRefs.current.set(participant.id, el);
                        el.srcObject = participant.stream;
                      }
                    }}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  {participant.isVideoOff && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-700">
                      <VideoOff className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                  <div className="absolute bottom-2 left-2 flex items-center gap-2 text-white text-sm">
                    <span className="bg-black/50 px-2 py-1 rounded">{participant.name}</span>
                    {participant.isMuted && <MicOff className="w-4 h-4" />}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Produits du live shopping */}
      {mode === 'live-shopping' && liveProducts.length > 0 && (
        <div className="absolute bottom-20 left-4 right-4 z-20">
          <div className="bg-black/80 backdrop-blur-sm rounded-lg p-4 text-white">
            <h4 className="font-semibold mb-3">Produits en vedette</h4>
            <div className="flex gap-3 overflow-x-auto">
              {liveProducts.map((product) => (
                <div key={product.id} className="flex-shrink-0 w-24 text-center">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-16 h-16 mx-auto rounded-lg object-cover mb-2"
                  />
                  <div className="text-xs font-medium truncate">{product.name}</div>
                  <div className="text-sm font-bold text-green-400">{product.price}€</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Contrôles */}
      <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/50 to-transparent p-4">
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="ghost"
            size="lg"
            onClick={toggleMute}
            className={`${isMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-white/20 hover:bg-white/30'} text-white rounded-full w-12 h-12`}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </Button>

          {mode !== 'audio-call' && (
            <Button
              variant="ghost"
              size="lg"
              onClick={toggleVideo}
              className={`${isVideoOff ? 'bg-red-600 hover:bg-red-700' : 'bg-white/20 hover:bg-white/30'} text-white rounded-full w-12 h-12`}
            >
              {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
            </Button>
          )}

          {mode === 'video-call' && (
            <Button
              variant="ghost"
              size="lg"
              onClick={toggleScreenShare}
              className={`${isScreenSharing ? 'bg-blue-600 hover:bg-blue-700' : 'bg-white/20 hover:bg-white/30'} text-white rounded-full w-12 h-12`}
            >
              {isScreenSharing ? <Monitor className="w-5 h-5" /> : <MonitorOff className="w-5 h-5" />}
            </Button>
          )}

          <Button
            variant="ghost"
            size="lg"
            onClick={endCall}
            className="bg-red-600 hover:bg-red-700 text-white rounded-full w-12 h-12"
          >
            <PhoneOff className="w-5 h-5" />
          </Button>

          <Button
            variant="ghost"
            size="lg"
            className="bg-white/20 hover:bg-white/30 text-white rounded-full w-12 h-12"
          >
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Indicateur de connexion */}
      {connectionState === 'connecting' && (
        <div className="absolute inset-0 z-30 bg-black/50 flex items-center justify-center">
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p>Connexion en cours...</p>
          </div>
        </div>
      )}

      {connectionState === 'failed' && (
        <div className="absolute inset-0 z-30 bg-black/50 flex items-center justify-center">
          <div className="text-center text-white">
            <div className="w-12 h-12 mx-auto mb-4 bg-red-600 rounded-full flex items-center justify-center">
              <PhoneOff className="w-6 h-6" />
            </div>
            <p>Échec de connexion</p>
            <Button onClick={startCall} variant="outline" className="mt-3">
              Réessayer
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RealVideoCall;
