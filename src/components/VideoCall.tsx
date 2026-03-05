import React, { useState, useEffect, useRef } from 'react';
import { useVideoCall } from '../contexts/VideoCallContext';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, Monitor, Maximize2, Minimize2 } from 'lucide-react';

interface VideoCallProps {
  participantId: string;
  participantName?: string;
  onCallEnd?: () => void;
  className?: string;
}

const VideoCall: React.FC<VideoCallProps> = ({ 
  participantId, 
  participantName = 'Participant',
  onCallEnd,
  className = ''
}) => {
  const {
    isInCall,
    currentSession,
    localStream,
    remoteStreams,
    isMuted,
    isVideoOff,
    isScreenSharing,
    callDuration,
    startCall,
    endCall,
    toggleMute,
    toggleVideo,
    shareScreen
  } = useVideoCall();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [callState, setCallState] = useState<'idle' | 'calling' | 'connected' | 'ended'>('idle');
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Met à jour les vidéos lorsque les streams changent
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStreams.size > 0) {
      const firstRemoteStream = Array.from(remoteStreams.values())[0];
      remoteVideoRef.current.srcObject = firstRemoteStream;
    }
  }, [remoteStreams]);

  // Gestion des changements d'état d'appel
  useEffect(() => {
    if (isInCall && currentSession) {
      setCallState('connected');
    } else if (callState === 'calling') {
      setCallState('ended');
      if (onCallEnd) onCallEnd();
    }
  }, [isInCall, currentSession]);

  const handleStartCall = async (type: 'video' | 'audio') => {
    try {
      setCallState('calling');
      await startCall(participantId, type);
    } catch (error) {
      console.error('Erreur lors du démarrage de l\'appel:', error);
      setCallState('idle');
    }
  };

  const handleEndCall = () => {
    endCall();
    setCallState('ended');
    setTimeout(() => setCallState('idle'), 1000);
  };

  const handleShareScreen = async () => {
    try {
      if (isScreenSharing) {
        // Logique pour arrêter le partage d'écran
        // Implémentée dans le service WebRTC
      } else {
        await shareScreen();
      }
    } catch (error) {
      console.error('Erreur lors du partage d\'écran:', error);
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

  if (callState === 'idle') {
    return (
      <div className={`bg-gray-900 rounded-lg p-6 ${className}`}>
        <div className="text-center">
          <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Phone className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-white text-lg font-semibold mb-2">Prêt pour l'appel vidéo</h3>
          <p className="text-gray-400 mb-6">{participantName}</p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => handleStartCall('audio')}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Phone className="w-5 h-5" />
              <span>Appel audio</span>
            </button>
            <button
              onClick={() => handleStartCall('video')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Video className="w-5 h-5" />
              <span>Appel vidéo</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`bg-black rounded-lg overflow-hidden ${className} ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}
    >
      {/* Zone vidéo principale */}
      <div className="relative aspect-video bg-gray-900">
        {/* Vidéo distante (principale) */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
          style={{ display: remoteStreams.size > 0 ? 'block' : 'none' }}
        />
        
        {/* Overlay quand pas de vidéo distante */}
        {remoteStreams.size === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <VideoOff className="w-10 h-10 text-gray-400" />
              </div>
              <p className="text-gray-400 text-lg">{participantName}</p>
              <p className="text-gray-500 text-sm mt-2">
                {callState === 'calling' ? 'Appel en cours...' : 'En attente de connexion'}
              </p>
            </div>
          </div>
        )}

        {/* Vidéo locale (petite) */}
        {localStream && (
          <div className="absolute top-4 right-4 w-32 h-24 bg-gray-800 rounded-lg overflow-hidden border-2 border-gray-600">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{ transform: 'scaleX(-1)' }} // Miroir pour la caméra frontale
            />
            {isVideoOff && (
              <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                <VideoOff className="w-6 h-6 text-gray-400" />
              </div>
            )}
          </div>
        )}

        {/* Indicateurs d'état */}
        <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-lg flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${
            callState === 'connected' ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'
          }`} />
          <span className="text-sm">
            {callState === 'connected' ? formatDuration(callDuration) : 'Connexion...'}
          </span>
        </div>

        {/* Bouton fullscreen */}
        <button
          onClick={toggleFullscreen}
          className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white p-2 rounded-lg hover:bg-opacity-70 transition-colors"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Contrôles */}
      <div className="bg-gray-900 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleMute}
              className={`p-3 rounded-full transition-colors ${
                isMuted 
                  ? 'bg-red-600 hover:bg-red-700 text-white' 
                  : 'bg-gray-700 hover:bg-gray-600 text-white'
              }`}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
            
            <button
              onClick={toggleVideo}
              className={`p-3 rounded-full transition-colors ${
                isVideoOff 
                  ? 'bg-red-600 hover:bg-red-700 text-white' 
                  : 'bg-gray-700 hover:bg-gray-600 text-white'
              }`}
            >
              {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
            </button>
            
            <button
              onClick={handleShareScreen}
              className={`p-3 rounded-full transition-colors ${
                isScreenSharing 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'bg-gray-700 hover:bg-gray-600 text-white'
              }`}
            >
              <Monitor className="w-5 h-5" />
            </button>
          </div>

          <button
            onClick={handleEndCall}
            className="bg-red-600 hover:bg-red-700 text-white p-3 rounded-full transition-colors"
          >
            <PhoneOff className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoCall;