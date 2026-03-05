import React, { useState, useEffect } from 'react';
import { Phone, PhoneOff, Video, Mic, MicOff, Settings, Users } from 'lucide-react';

const TestVideoCall = () => {
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [callStatus, setCallStatus] = useState<string>('Prêt à appeler');
  const [connectionStatus, setConnectionStatus] = useState<string>('Déconnecté');

  // Initialiser la caméra et le microphone
  const initializeMedia = async () => {
    try {
      // Vérifier si nous sommes en HTTPS ou localhost
      const isSecureContext = window.isSecureContext;
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      
      if (!isSecureContext && !isLocalhost) {
        console.warn('Contexte non sécurisé - utilisation du mode démo');
        setConnectionStatus('Mode démo (HTTP)');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      setLocalStream(stream);
      setConnectionStatus('Média prêt');
    } catch (error) {
      console.error('Erreur lors de l\'accès aux médias:', error);
      
      // En cas d'erreur, créer un flux simulé pour la démo
      if (error.name === 'NotAllowedError') {
        setConnectionStatus('Permission refusée - Mode démo');
      } else if (error.name === 'NotFoundError') {
        setConnectionStatus('Aucun périphérique - Mode démo');
      } else {
        setConnectionStatus('Erreur média - Mode démo');
      }
      
      // Créer un canvas animé comme flux simulé
      createSimulatedStream();
    }
  };

  // Créer un flux vidéo simulé avec un canvas animé
  const createSimulatedStream = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      let frame = 0;
      const animate = () => {
        // Fond dégradé
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, '#1e40af');
        gradient.addColorStop(1, '#7c3aed');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Texte animé
        ctx.fillStyle = 'white';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Flux Vidéo Simulé', canvas.width / 2, canvas.height / 2 - 20);
        ctx.font = '16px Arial';
        ctx.fillText(`Frame: ${frame++}`, canvas.width / 2, canvas.height / 2 + 20);
        
        // Animation des ondes
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          const radius = 50 + i * 30 + Math.sin(frame * 0.1 + i) * 10;
          ctx.arc(canvas.width / 2, canvas.height / 2, radius, 0, Math.PI * 2);
          ctx.stroke();
        }
        
        requestAnimationFrame(animate);
      };
      animate();
      
      // Convertir le canvas en MediaStream
      const stream = canvas.captureStream(30);
      
      // Ajouter un audio track simulé
      const audioContext = new AudioContext();
      const oscillator = audioContext.createOscillator();
      const destination = audioContext.createMediaStreamDestination();
      oscillator.connect(destination);
      oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // A4 note
      oscillator.start();
      
      // Combiner les streams
      stream.addTrack(destination.stream.getAudioTracks()[0]);
      
      setLocalStream(stream);
    }
  };

  useEffect(() => {
    initializeMedia();
    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startCall = () => {
    setIsCallActive(true);
    setCallStatus('Appel en cours...');
    
    // Simuler un flux distant
    setTimeout(() => {
      setRemoteStream(localStream); // Pour la démo, on utilise le même flux
    }, 1000);
  };

  const endCall = () => {
    setIsCallActive(false);
    setCallStatus('Appel terminé');
    setRemoteStream(null);
    
    // Arrêter l'audio simulé si présent
    if (localStream) {
      localStream.getTracks().forEach(track => {
        if (track.kind === 'audio') {
          track.stop();
        }
      });
    }
  };

  const toggleMute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOn(videoTrack.enabled);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-6xl mx-auto">
        {/* Navigation rapide */}
        <div className="mb-6">
          <a
            href="/demo"
            className="inline-flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors"
          >
            <span>← Retour à la démo</span>
          </a>
        </div>

        {/* En-tête */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Test Appel Vidéo</h1>
          <p className="text-gray-400">Testez les fonctionnalités d'appel vidéo WebRTC</p>
          <div className="mt-4 p-2 bg-blue-900 rounded">
            <p className="text-sm">Statut: <span className="font-semibold">{connectionStatus}</span></p>
            <p className="text-sm">Appel: <span className="font-semibold">{callStatus}</span></p>
          </div>
        </div>

        {/* Zone vidéo principale */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
          {/* Vidéo locale */}
          <div className="relative bg-gray-800 rounded-lg overflow-hidden">
            <div className="aspect-video bg-gray-700 flex items-center justify-center">
              {localStream ? (
                <video
                  autoPlay
                  muted
                  playsInline
                  ref={(video) => {
                    if (video && localStream) {
                      video.srcObject = localStream;
                    }
                  }}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center">
                  <Video className="w-16 h-16 mx-auto mb-2 text-gray-500" />
                  <p className="text-gray-400">Votre caméra</p>
                  {connectionStatus.includes('Mode démo') && (
                    <div className="mt-2 text-xs text-blue-400 animate-pulse">
                      Mode démo activé
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 px-2 py-1 rounded text-xs">
              Vous
            </div>
            {/* Indicateur de statut */}
            <div className="absolute top-2 right-2">
              {connectionStatus.includes('Mode démo') ? (
                <div className="bg-yellow-600 text-white px-2 py-1 rounded text-xs">
                  Démo
                </div>
              ) : connectionStatus === 'Média prêt' ? (
                <div className="bg-green-600 text-white px-2 py-1 rounded text-xs">
                  Prêt
                </div>
              ) : (
                <div className="bg-red-600 text-white px-2 py-1 rounded text-xs">
                  Erreur
                </div>
              )}
            </div>
          </div>

          {/* Vidéo distante */}
          <div className="relative bg-gray-800 rounded-lg overflow-hidden">
            <div className="aspect-video bg-gray-700 flex items-center justify-center">
              {remoteStream ? (
                <video
                  autoPlay
                  playsInline
                  ref={(video) => {
                    if (video && remoteStream) {
                      video.srcObject = remoteStream;
                    }
                  }}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center">
                  <Users className="w-16 h-16 mx-auto mb-2 text-gray-500" />
                  <p className="text-gray-400">Participant distant</p>
                  {isCallActive && (
                    <div className="animate-pulse text-blue-400 mt-2">
                      Connexion en cours...
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 px-2 py-1 rounded text-xs">
              Participant
            </div>
          </div>
        </div>

        {/* Contrôles d'appel */}
        <div className="flex justify-center items-center space-x-4 mb-8">
          {!isCallActive ? (
            <button
              onClick={startCall}
              className="bg-green-600 hover:bg-green-700 text-white p-4 rounded-full transition-colors"
            >
              <Phone className="w-6 h-6" />
            </button>
          ) : (
            <button
              onClick={endCall}
              className="bg-red-600 hover:bg-red-700 text-white p-4 rounded-full transition-colors"
            >
              <PhoneOff className="w-6 h-6" />
            </button>
          )}

          {isCallActive && (
            <>
              <button
                onClick={toggleMute}
                className={`p-3 rounded-full transition-colors ${
                  isMuted 
                    ? 'bg-red-600 hover:bg-red-700 text-white' 
                    : 'bg-gray-600 hover:bg-gray-700 text-white'
                }`}
              >
                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              <button
                onClick={toggleVideo}
                className={`p-3 rounded-full transition-colors ${
                  !isVideoOn 
                    ? 'bg-red-600 hover:bg-red-700 text-white' 
                    : 'bg-gray-600 hover:bg-gray-700 text-white'
                }`}
              >
                <Video className="w-5 h-5" />
              </button>
            </>
          )}
        </div>

        {/* Informations techniques */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Settings className="w-5 h-5 mr-2" />
            Informations techniques
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-400">WebRTC Status:</p>
              <p className="font-mono">{connectionStatus}</p>
            </div>
            <div>
              <p className="text-gray-400">Audio Tracks:</p>
              <p className="font-mono">{localStream?.getAudioTracks().length || 0}</p>
            </div>
            <div>
              <p className="text-gray-400">Video Tracks:</p>
              <p className="font-mono">{localStream?.getVideoTracks().length || 0}</p>
            </div>
            <div>
              <p className="text-gray-400">Call Active:</p>
              <p className="font-mono">{isCallActive.toString()}</p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-900 rounded">
            <h4 className="font-semibold mb-2">Instructions de test:</h4>
            <ul className="text-sm space-y-1">
              <li>• Cliquez sur l'icône téléphone pour démarrer un appel</li>
              <li>• Utilisez les boutons microphone et vidéo pour contrôler votre flux</li>
              <li>• Le bouton rouge termine l'appel</li>
              <li>• Le mode démo est activé car vous êtes en HTTP</li>
            </ul>
          </div>

          {connectionStatus.includes('Mode démo') && (
            <div className="mt-4 p-4 bg-yellow-900 border border-yellow-600 rounded">
              <h4 className="font-semibold mb-2 text-yellow-200">ℹ️ Mode Démo Activé</h4>
              <p className="text-sm text-yellow-100">
                Vous êtes actuellement en mode démo car le site n'est pas en HTTPS. 
                Pour accéder à vos vrais périphériques caméra/microphone, utilisez HTTPS ou localhost.
              </p>
              <p className="text-xs text-yellow-200 mt-2">
                Le flux vidéo simulé démontre les fonctionnalités WebRTC.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TestVideoCall;