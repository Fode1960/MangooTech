import React, { useState, useEffect, useRef } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Volume2 } from 'lucide-react';

interface VoIPManagerSimpleProps {
  role: 'vendor' | 'client';
  roomId: string;
  userId: string;
  targetUserId: string;
  onCallEnd?: () => void;
}

const VoIPManagerSimple: React.FC<VoIPManagerSimpleProps> = ({ 
  role, 
  roomId, 
  userId, 
  targetUserId,
  onCallEnd 
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isInCall, setIsInCall] = useState(false);
  const [isCalling, setIsCalling] = useState(false);
  const [incomingCall, setIncomingCall] = useState(false);
  const [callFrom, setCallFrom] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('Déconnecté');
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [outgoingLevel, setOutgoingLevel] = useState(0);
  const [incomingLevel, setIncomingLevel] = useState(0);

  const wsRef = useRef<WebSocket | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const ringtoneRef = useRef<HTMLAudioElement | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const outgoingLevelIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const incomingLevelIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Configuration WebRTC
  const iceServers = [
    { urls: 'stun:stun.l.google.com:19302' }
  ];

  // 🔔 Système de sonnerie avec Web Audio API
  const createRingtone = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      // Sonnerie téléphone: 800Hz, pattern classique
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      gainNode.gain.value = 0.3;
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.start();
      
      // Pattern de sonnerie: 1s on, 2s off
      const patternInterval = setInterval(() => {
        if (gainNode.gain.value > 0) {
          gainNode.gain.setValueAtTime(0, audioContext.currentTime);
          setTimeout(() => {
            if (gainNode && gainNode.context.state !== 'closed') {
              gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            }
          }, 2000);
        }
      }, 3000);
      
      return { oscillator, gainNode, audioContext, patternInterval };
    } catch (error) {
      console.error('❌ Erreur création sonnerie:', error);
      return null;
    }
  };

  // Arrêter la sonnerie
  const stopRingtone = () => {
    try {
      if (ringtoneRef.current) {
        ringtoneRef.current.pause();
        ringtoneRef.current.currentTime = 0;
      }
      
      if (window.ringtoneOscillator) {
        window.ringtoneOscillator.stop();
        window.ringtoneOscillator = null;
      }
      
      if (window.ringtoneContext) {
        window.ringtoneContext.close();
        window.ringtoneContext = null;
      }
      
      if (window.ringtoneInterval) {
        clearInterval(window.ringtoneInterval);
        window.ringtoneInterval = null;
      }
    } catch (error) {
      console.error('❌ Erreur arrêt sonnerie:', error);
    }
  };

  // 🎵 Simulation de niveaux audio
  const startOutgoingLevelSimulation = () => {
    outgoingLevelIntervalRef.current = setInterval(() => {
      // Simuler la voix humaine avec variations
      const baseLevel = 30;
      const variation = Math.random() * 40;
      const newLevel = Math.min(100, baseLevel + variation);
      setOutgoingLevel(Math.round(newLevel));
    }, 200);
  };

  const startIncomingLevelSimulation = () => {
    incomingLevelIntervalRef.current = setInterval(() => {
      // Simuler la voix distante
      const baseLevel = 25;
      const variation = Math.random() * 35;
      const newLevel = Math.min(100, baseLevel + variation);
      setIncomingLevel(Math.round(newLevel));
    }, 250);
  };

  const stopLevelSimulations = () => {
    if (outgoingLevelIntervalRef.current) {
      clearInterval(outgoingLevelIntervalRef.current);
      outgoingLevelIntervalRef.current = null;
      setOutgoingLevel(0);
    }
    if (incomingLevelIntervalRef.current) {
      clearInterval(incomingLevelIntervalRef.current);
      incomingLevelIntervalRef.current = null;
      setIncomingLevel(0);
    }
  };

  useEffect(() => {
    // Connexion WebSocket
    const ws = new WebSocket('ws://localhost:3010');
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('✅ Connecté au serveur VoIP');
      setIsConnected(true);
      setConnectionStatus('Connecté');
      
      // S'enregistrer
      ws.send(JSON.stringify({
        type: 'register',
        userId: userId,
        role: role,
        roomId: roomId
      }));
    };

    ws.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log(`📡 Message VoIP: ${data.type}`);

        switch (data.type) {
          case 'registered':
            console.log('✅ Enregistré sur le serveur VoIP');
            break;

          case 'incoming-call':
            console.log(`📞 Appel entrant de ${data.from}`);
            setIncomingCall(true);
            setCallFrom(data.from);
            
            // Jouer la sonnerie
            const ringtone = createRingtone();
            if (ringtone) {
              window.ringtoneOscillator = ringtone.oscillator;
              window.ringtoneContext = ringtone.audioContext;
              window.ringtoneInterval = ringtone.patternInterval;
            }
            break;

          case 'call-accepted':
            console.log('✅ Appel accepté');
            setIsCalling(false);
            setIsInCall(true);
            setConnectionStatus('Appel actif');
            stopRingtone();
            startOutgoingLevelSimulation();
            startIncomingLevelSimulation();
            break;

          case 'call-rejected':
            console.log('❌ Appel refusé');
            setIsCalling(false);
            stopRingtone();
            break;

          case 'call-ended':
            console.log('📴 Appel terminé');
            endCall();
            break;

          case 'call-error':
            console.error('❌ Erreur d\'appel:', data.error);
            setIsCalling(false);
            setConnectionStatus(`Erreur: ${data.error}`);
            stopRingtone();
            break;
        }
      } catch (error) {
        console.error('❌ Erreur traitement message:', error);
      }
    };

    ws.onclose = () => {
      console.log('🔌 Déconnecté du serveur VoIP');
      setIsConnected(false);
      setConnectionStatus('Déconnecté');
      endCall();
    };

    ws.onerror = (error) => {
      console.error('❌ Erreur WebSocket VoIP:', error);
      setConnectionStatus('Erreur de connexion');
      setIsConnected(false);
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
      endCall();
    };
  }, [role, roomId, userId]);

  // Commencer un appel
  const startCall = async () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      alert('Non connecté au serveur VoIP');
      return;
    }

    try {
      setIsCalling(true);
      setConnectionStatus('Appel en cours...');

      // Obtenir le flux audio
      const stream = await navigator.mediaDevices.getUserMedia({
        video: false,
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
          channelCount: 1
        }
      });

      localStreamRef.current = stream;
      console.log('✅ Flux audio obtenu');

      // Créer la connexion WebRTC
      await createPeerConnection(stream);

      // Envoyer la demande d'appel
      wsRef.current.send(JSON.stringify({
        type: 'call',
        targetUserId: targetUserId,
        roomId: roomId
      }));

    } catch (error) {
      console.error('❌ Erreur démarrage appel:', error);
      setIsCalling(false);
      setConnectionStatus('Erreur appel');
    }
  };

  // Créer la connexion WebRTC
  const createPeerConnection = async (stream: MediaStream) => {
    try {
      const pc = new RTCPeerConnection({ iceServers });
      peerConnectionRef.current = pc;

      // Ajouter les tracks audio
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      // Gérer les candidats ICE
      pc.onicecandidate = (event) => {
        if (event.candidate && wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: 'ice-candidate',
            targetUserId: targetUserId,
            candidate: event.candidate
          }));
        }
      };

      // Gérer le flux distant
      pc.ontrack = (event) => {
        console.log('🎵 Flux audio distant reçu');
        
        if (event.track.kind === 'audio') {
          // Créer l'élément audio pour le flux distant
          const audio = new Audio();
          audio.srcObject = event.streams[0];
          audio.autoplay = true;
          audio.volume = 1.0;
          audio.play().catch(error => {
            console.error('❌ Erreur lecture audio distant:', error);
          });
          
          remoteAudioRef.current = audio;
        }
      };

      // Créer et envoyer l'offre
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      console.log('✅ Offre WebRTC créée');

      // Envoyer l'offre
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'offer',
          targetUserId: targetUserId,
          data: offer
        }));
      }

    } catch (error) {
      console.error('❌ Erreur création connexion WebRTC:', error);
      throw error;
    }
  };

  // Répondre à un appel
  const answerCall = async (accept: boolean) => {
    if (!wsRef.current) return;

    try {
      if (accept) {
        // Obtenir le flux audio
        const stream = await navigator.mediaDevices.getUserMedia({
          video: false,
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: 48000,
            channelCount: 1
          }
        });

        localStreamRef.current = stream;
        
        // Créer la connexion WebRTC
        await createPeerConnection(stream);
        
        setIncomingCall(false);
        setIsInCall(true);
        setConnectionStatus('Appel accepté');
        
        // Démarrer les simulations de niveaux
        startOutgoingLevelSimulation();
        startIncomingLevelSimulation();
      } else {
        setIncomingCall(false);
        setConnectionStatus('Appel refusé');
      }

      // Envoyer la réponse
      wsRef.current.send(JSON.stringify({
        type: 'answer',
        callId: 'current-call',
        accept: accept
      }));

      stopRingtone();

    } catch (error) {
      console.error('❌ Erreur réponse appel:', error);
      setConnectionStatus('Erreur réponse');
      stopRingtone();
    }
  };

  // Terminer l'appel
  const endCall = () => {
    console.log('📴 Fin d\'appel');
    
    stopRingtone();
    stopLevelSimulations();

    // Arrêter le flux local
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      localStreamRef.current = null;
    }

    // Fermer la connexion WebRTC
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    // Arrêter l'audio distant
    if (remoteAudioRef.current) {
      remoteAudioRef.current.pause();
      remoteAudioRef.current.srcObject = null;
      remoteAudioRef.current = null;
    }

    // Réinitialiser les états
    setIsInCall(false);
    setIsCalling(false);
    setIncomingCall(false);
    setCallFrom('');
    setConnectionStatus('Appel terminé');

    // Notifier le serveur
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'hangup',
        callId: 'current-call'
      }));
    }

    if (onCallEnd) {
      onCallEnd();
    }
  };

  // Basculer l'audio
  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        const newAudioState = !isAudioEnabled;
        audioTrack.enabled = newAudioState;
        setIsAudioEnabled(newAudioState);
        
        console.log(`🎤 Audio ${newAudioState ? 'activé' : 'désactivé'}`);
        setConnectionStatus(newAudioState ? 'Audio activé' : 'Audio désactivé');
      }
    }
  };

  // Test audio système
  const testSystemAudio = async () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        if (audioContextRef.current.state === 'suspended') {
          await audioContextRef.current.resume();
        }
      }
      
      const audioContext = audioContextRef.current;
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.frequency.value = 800; // Tonalité de test
      oscillator.type = 'sine';
      gainNode.gain.value = 0.2;
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.start();
      
      setTimeout(() => {
        if (oscillator && !oscillator.context.state.includes('closed')) {
          oscillator.stop();
        }
      }, 1000);
      
      console.log('🔊 Test audio effectué');
      setConnectionStatus('Test audio réussi');
      
      setTimeout(() => {
        setConnectionStatus(isConnected ? 'Connecté' : 'Déconnecté');
      }, 2000);
      
    } catch (error) {
      console.error('❌ Erreur test audio:', error);
      setConnectionStatus('Erreur test audio');
    }
  };

  return (
    <div className="bg-gray-800 p-4 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${
            isConnected ? 'bg-green-500' : 'bg-red-500'
          }`} />
          <span className="text-sm text-white">{connectionStatus}</span>
        </div>
        <div className="text-sm text-gray-300">
          {role === 'vendor' ? 'Vendeur' : 'Client'} VoIP
        </div>
      </div>

      {/* Contrôles d'appel */}
      <div className="flex justify-center space-x-4 mb-4">
        {!isInCall && !isCalling && !incomingCall && (
          <button
            onClick={startCall}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg flex items-center space-x-2 disabled:bg-gray-500 disabled:cursor-not-allowed"
            disabled={!isConnected}
          >
            <Phone className="w-5 h-5" />
            <span>Appeler {role === 'vendor' ? 'le client' : 'le vendeur'}</span>
          </button>
        )}

        {incomingCall && (
          <div className="flex space-x-4">
            <button
              onClick={() => answerCall(true)}
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg flex items-center space-x-2"
            >
              <Phone className="w-5 h-5" />
              <span>Répondre</span>
            </button>
            <button
              onClick={() => answerCall(false)}
              className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg flex items-center space-x-2"
            >
              <PhoneOff className="w-5 h-5" />
              <span>Refuser</span>
            </button>
          </div>
        )}

        {isInCall && (
          <>
            <button
              onClick={toggleAudio}
              className={`p-3 rounded-lg ${
                isAudioEnabled ? 'bg-blue-500 hover:bg-blue-600' : 'bg-gray-600 hover:bg-gray-700'
              }`}
            >
              {isAudioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </button>
            
            <button
              onClick={endCall}
              className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg flex items-center space-x-2"
            >
              <PhoneOff className="w-5 h-5" />
              <span>Raccrocher</span>
            </button>
            
            <button
              onClick={testSystemAudio}
              className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
            >
              <Volume2 className="w-5 h-5" />
              <span>Test Audio</span>
            </button>
          </>
        )}
      </div>

      {/* Statut de connexion */}
      {!isConnected && (
        <div className="text-center text-red-300 mb-4 p-3 bg-red-900 bg-opacity-20 rounded-lg">
          <div className="animate-pulse">🔌 Non connecté au serveur VoIP</div>
          <div className="text-xs text-red-400 mt-1">
            Vérifiez que le serveur VoIP tourne sur ws://localhost:3010
          </div>
        </div>
      )}

      {/* Statut de l'appel */}
      {isCalling && (
        <div className="text-center text-yellow-300 mb-4">
          <div className="animate-pulse">📞 Appel en cours...</div>
        </div>
      )}

      {incomingCall && (
        <div className="text-center text-blue-300 mb-4">
          <div className="animate-pulse">📞 Appel entrant de {callFrom}</div>
        </div>
      )}

      {isInCall && (
        <div className="text-center text-green-300 mb-4">
          <div>✅ Appel actif - Parlez maintenant</div>
          
          {/* Indicateurs de niveau audio */}
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span>Niveau Audio Sortant (Micro):</span>
              <span className={`font-mono ${outgoingLevel > 50 ? 'text-green-400' : 'text-gray-400'}`}>
                {outgoingLevel}%
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-200"
                style={{ width: `${outgoingLevel}%` }}
              />
            </div>
            
            <div className="flex items-center justify-between text-xs">
              <span>Niveau Audio Entrant (Haut-parleur):</span>
              <span className={`font-mono ${incomingLevel > 50 ? 'text-green-400' : 'text-gray-400'}`}>
                {incomingLevel}%
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-200"
                style={{ width: `${incomingLevel}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoIPManagerSimple;