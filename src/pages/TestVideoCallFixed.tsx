import React, { useState, useRef, useEffect } from 'react';
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff, Users, Wifi, WifiOff, AlertCircle, CheckCircle } from 'lucide-react';

interface CallParticipant {
  id: string;
  name: string;
  isLocal: boolean;
  stream?: MediaStream;
  audioEnabled: boolean;
  videoEnabled: boolean;
}

export default function TestVideoCallFixed() {
  const [isCallActive, setIsCallActive] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [useSimulatedStream, setUseSimulatedStream] = useState(false);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  // Créer un flux vidéo simulé avec animation canvas
  const createSimulatedStream = () => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    let frame = 0;
    const animate = () => {
      frame++;
      
      // Fond dégradé
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, '#1e40af');
      gradient.addColorStop(1, '#7c3aed');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Animation de cercles
      for (let i = 0; i < 5; i++) {
        const x = (Math.sin(frame * 0.01 + i) * 100) + canvas.width / 2;
        const y = (Math.cos(frame * 0.015 + i) * 80) + canvas.height / 2;
        const radius = 20 + Math.sin(frame * 0.02 + i) * 10;
        
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + Math.sin(frame * 0.01 + i) * 0.2})`;
        ctx.fill();
      }
      
      // Texte
      ctx.fillStyle = 'white';
      ctx.font = '24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Flux Vidéo Simulé', canvas.width / 2, 50);
      ctx.font = '16px Arial';
      ctx.fillText(`Mode Démo - Frame: ${frame}`, canvas.width / 2, 80);
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animate();
    
    // Créer le flux vidéo depuis le canvas
    const stream = canvas.captureStream(30);
    
    // Ajouter un audio silencieux
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      gainNode.gain.value = 0; // Audio silencieux
      oscillator.start();
      
      const audioDestination = audioContext.createMediaStreamDestination();
      oscillator.connect(audioDestination);
      
      // Combiner les flux
      const audioTrack = audioDestination.stream.getAudioTracks()[0];
      if (audioTrack) {
        stream.addTrack(audioTrack);
      }
    } catch (error) {
      console.warn('Erreur lors de la création du contexte audio:', error);
    }
    
    return stream;
  };

  // Obtenir le flux média (caméra/micro ou simulé)
  const getMediaStream = async () => {
    try {
      // Tenter d'abord d'obtenir le flux réel
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: true
      });
      setMediaError(null);
      setUseSimulatedStream(false);
      return stream;
    } catch (error) {
      console.warn('Impossible d\'accéder aux médias:', error);
      
      let errorMessage = 'Erreur média inconnue';
      if (error instanceof Error) {
        switch (error.name) {
          case 'NotAllowedError':
            errorMessage = 'Accès caméra/micro refusé - Utilisation du mode démo';
            break;
          case 'NotFoundError':
            errorMessage = 'Aucun périphérique trouvé - Utilisation du mode démo';
            break;
          case 'NotReadableError':
            errorMessage = 'Périphérique non disponible - Utilisation du mode démo';
            break;
          default:
            errorMessage = `${error.message} - Utilisation du mode démo`;
        }
      }
      
      setMediaError(errorMessage);
      setUseSimulatedStream(true);
      
      // Utiliser le flux simulé
      return createSimulatedStream();
    }
  };

  // Démarrer un appel
  const startCall = async () => {
    setConnectionStatus('connecting');
    
    try {
      const stream = await getMediaStream();
      if (!stream) {
        throw new Error('Impossible de créer le flux vidéo');
      }
      
      setLocalStream(stream);
      setIsCallActive(true);
      setConnectionStatus('connected');
      
      // Simuler un flux distant après un court délai
      setTimeout(() => {
        const remoteSimulatedStream = createSimulatedStream();
        if (remoteSimulatedStream) {
          setRemoteStream(remoteSimulatedStream);
        }
      }, 1000);
      
    } catch (error) {
      console.error('Erreur lors du démarrage de l\'appel:', error);
      setConnectionStatus('error');
      setMediaError('Erreur lors de la connexion');
    }
  };

  // Arrêter l'appel
  const stopCall = () => {
    setIsCallActive(false);
    setConnectionStatus('idle');
    
    // Arrêter l'animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    // Arrêter tous les flux
    if (localStream) {
      localStream.getTracks().forEach(track => {
        track.stop();
      });
      setLocalStream(null);
    }
    
    if (remoteStream) {
      remoteStream.getTracks().forEach(track => {
        track.stop();
      });
      setRemoteStream(null);
    }
    
    setMediaError(null);
  };

  // Basculer l'audio
  const toggleAudio = () => {
    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !audioEnabled;
      });
      setAudioEnabled(!audioEnabled);
    }
  };

  // Basculer la vidéo
  const toggleVideo = () => {
    if (localStream) {
      const videoTracks = localStream.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = !videoEnabled;
      });
      setVideoEnabled(!videoEnabled);
    }
  };

  // Effet pour mettre à jour les vidéos
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Nettoyage
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      if (remoteStream) {
        remoteStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Utiliser un style plus simple pour éviter les erreurs DOM
  const PhoneIcon = Phone;
  const PhoneOffIcon = PhoneOff;
  const VideoIcon = Video;
  const VideoOffIcon = VideoOff;
  const MicIcon = Mic;
  const MicOffIcon = MicOff;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      {/* Canvas caché pour la simulation vidéo */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      
      <div className="max-w-6xl mx-auto">
        {/* En-tête */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Test Appel Vidéo</h1>
          <p className="text-gray-400">Testez les fonctionnalités d'appel vidéo WebRTC</p>
          
          {/* Indicateur de statut */}
          <div className="mt-4 p-4 bg-gray-800 rounded-lg">
            <div className="flex items-center justify-center gap-4">
              <div className="flex items-center gap-2">
                {connectionStatus === 'connected' ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : connectionStatus === 'error' ? (
                  <AlertCircle className="w-5 h-5 text-red-500" />
                ) : connectionStatus === 'connecting' ? (
                  <Wifi className="w-5 h-5 text-yellow-500 animate-pulse" />
                ) : (
                  <WifiOff className="w-5 h-5 text-gray-500" />
                )}
                <span className={`font-medium ${
                  connectionStatus === 'connected' ? 'text-green-500' :
                  connectionStatus === 'error' ? 'text-red-500' :
                  connectionStatus === 'connecting' ? 'text-yellow-500' :
                  'text-gray-500'
                }`}>
                  {connectionStatus === 'connected' ? 'Connecté' :
                   connectionStatus === 'error' ? 'Erreur' :
                   connectionStatus === 'connecting' ? 'Connexion...' :
                   'Déconnecté'}
                </span>
              </div>
              
              {useSimulatedStream && (
                <div className="flex items-center gap-2 text-orange-500">
                  <AlertCircle className="w-5 h-5" />
                  <span className="text-sm">Mode Démo</span>
                </div>
              )}
            </div>
            
            {mediaError && (
              <div className="mt-2 text-sm text-orange-400">
                {mediaError}
              </div>
            )}
          </div>
        </div>

        {/* Zone vidéo */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
          {/* Vidéo locale */}
          <div className="relative bg-gray-800 rounded-lg overflow-hidden">
            <div className="absolute top-4 left-4 z-10 bg-black bg-opacity-50 px-2 py-1 rounded text-sm">
              Votre caméra {useSimulatedStream ? '(Simulé)' : ''}
            </div>
            
            {localStream ? (
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-64 object-cover"
              />
            ) : (
              <div className="w-full h-64 bg-gray-700 flex items-center justify-center">
                <div className="text-center">
                  <VideoOffIcon className="w-16 h-16 text-gray-500 mx-auto mb-2" />
                  <p className="text-gray-400">Caméra désactivée</p>
                </div>
              </div>
            )}
          </div>

          {/* Vidéo distante */}
          <div className="relative bg-gray-800 rounded-lg overflow-hidden">
            <div className="absolute top-4 left-4 z-10 bg-black bg-opacity-50 px-2 py-1 rounded text-sm">
              Participant à distance
            </div>
            
            {remoteStream ? (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-64 object-cover"
              />
            ) : (
              <div className="w-full h-64 bg-gray-700 flex items-center justify-center">
                <div className="text-center">
                  <Users className="w-16 h-16 text-gray-500 mx-auto mb-2" />
                  <p className="text-gray-400">
                    {isCallActive ? 'Connexion en cours...' : 'Aucun participant'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Contrôles */}
        <div className="flex flex-col items-center gap-4">
          {!isCallActive ? (
            <button
              onClick={startCall}
              disabled={connectionStatus === 'connecting'}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
            >
              <PhoneIcon className="w-5 h-5" />
              Démarrer l'appel de test
            </button>
          ) : (
            <button
              onClick={stopCall}
              className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
            >
              <PhoneOffIcon className="w-5 h-5" />
              Terminer l'appel
            </button>
          )}

          {/* Contrôles média */}
          {isCallActive && (
            <div className="flex gap-4">
              <button
                onClick={toggleAudio}
                className={`p-3 rounded-lg transition-colors ${
                  audioEnabled 
                    ? 'bg-blue-600 hover:bg-blue-700' 
                    : 'bg-gray-600 hover:bg-gray-700'
                }`}
              >
                {audioEnabled ? <MicIcon className="w-5 h-5" /> : <MicOffIcon className="w-5 h-5" />}
              </button>
              
              <button
                onClick={toggleVideo}
                className={`p-3 rounded-lg transition-colors ${
                  videoEnabled 
                    ? 'bg-blue-600 hover:bg-blue-700' 
                    : 'bg-gray-600 hover:bg-gray-700'
                }`}
              >
                {videoEnabled ? <VideoIcon className="w-5 h-5" /> : <VideoOffIcon className="w-5 h-5" />}
              </button>
            </div>
          )}
        </div>

        {/* Informations techniques */}
        <div className="mt-8 bg-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-4">Informations techniques</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-400">État de WebRTC:</p>
              <p className={`font-medium ${
                connectionStatus === 'connected' ? 'text-green-400' :
                connectionStatus === 'error' ? 'text-red-400' :
                'text-yellow-400'
              }`}>
                {connectionStatus === 'connected' ? 'Connecté' :
                 connectionStatus === 'error' ? 'Erreur média' :
                 connectionStatus === 'connecting' ? 'Connexion...' :
                 'Inactif'}
              </p>
            </div>
            
            <div>
              <p className="text-gray-400">Pistes audio:</p>
              <p className="font-medium text-blue-400">
                {localStream ? localStream.getAudioTracks().length : 0}
              </p>
            </div>
            
            <div>
              <p className="text-gray-400">Pistes vidéo:</p>
              <p className="font-medium text-blue-400">
                {localStream ? localStream.getVideoTracks().length : 0}
              </p>
            </div>
            
            <div>
              <p className="text-gray-400">Appel actif:</p>
              <p className={`font-medium ${
                isCallActive ? 'text-green-400' : 'text-gray-400'
              }`}>
                {isCallActive ? 'Oui' : 'Non'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}