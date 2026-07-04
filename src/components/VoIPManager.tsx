import React, { useState, useEffect, useRef } from 'react';
import { Phone, PhoneOff, Mic, MicOff } from 'lucide-react';

interface VoIPManagerProps {
  role: 'vendor' | 'client';
  roomId: string;
  userId: string;
  targetUserId: string;
  onCallEnd?: () => void;
}

const VoIPManager: React.FC<VoIPManagerProps> = ({ 
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
  const [currentCallId, setCurrentCallId] = useState<string | null>(null);
  const [storedCallId, setStoredCallId] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState('Déconnecté');
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [outgoingLevel, setOutgoingLevel] = useState(0);
  const [incomingLevel, setIncomingLevel] = useState(0);
  const ringtoneIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isRingingRef = useRef(false);

  const wsRef = useRef<WebSocket | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSimulationRef = useRef<any>(null);

  // Configuration WebRTC simplifiée pour VoIP
  const iceServers = [
    { urls: 'stun:stun.l.google.com:19302' }
  ];

  useEffect(() => {
    console.log(`🔄 Initialisation VoIPManager - Role: ${role}, UserId: ${userId}`);
    
    // Connexion WebSocket pour la signalisation VoIP
    const ws = new WebSocket('ws://localhost:3035');
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('✅ Connecté au serveur VoIP');
      setIsConnected(true);
      setConnectionStatus('Connecté');
      
      // S'enregistrer sur le serveur
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
        console.log(`📡 Message VoIP reçu: ${data.type}`);

        switch (data.type) {
          case 'registered':
            console.log('✅ Enregistré sur le serveur VoIP');
            break;

          case 'incoming-call':
            console.log(`📞 Appel entrant de ${data.from}`);
            setIncomingCall(true);
            setCallFrom(data.from);
            setStoredCallId(data.callId);
            // 🔔 Démarrer la sonnerie discontinue
            if (!audioContextRef.current) {
              audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            }
            startRingtone();
            break;

          case 'call-initiated':
            console.log(`📞 Appel initié: ${data.callId}`);
            setStoredCallId(data.callId);
            break;

          case 'call-accepted':
            console.log('✅ Appel accepté');
            setIsCalling(false);
            setIsInCall(true);
            setConnectionStatus('Appel actif');
            // 🔕 Arrêter la sonnerie quand l'appel est accepté
            stopRingtone();
            break;

          case 'call-rejected':
            console.log('❌ Appel refusé');
            setIsCalling(false);
            setConnectionStatus('Appel refusé');
            // 🔕 Arrêter la sonnerie quand l'appel est refusé
            stopRingtone();
            break;

          case 'call-ended':
            console.log('📴 Appel terminé');
            endCall();
            // 🔕 Arrêter la sonnerie quand l'appel est terminé
            stopRingtone();
            break;

          case 'call-error':
            console.error('❌ Erreur d\'appel:', data.error);
            setIsCalling(false);
            setConnectionStatus(`Erreur: ${data.error}`);
            break;

          case 'offer':
            console.log('📡 Offre WebRTC reçue');
            handleRemoteOffer(data.offer, data.from);
            break;

          case 'answer':
            console.log('📡 Réponse WebRTC reçue');
            handleRemoteAnswer(data.answer);
            break;

          case 'ice-candidate':
            console.log('📡 Candidat ICE reçu');
            handleRemoteIceCandidate(data.candidate);
            break;
        }
      } catch (error) {
        console.error('❌ Erreur traitement message VoIP:', error);
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
      // 🔕 S'assurer que la sonnerie est arrêtée
      stopRingtone();
      endCall();
      setIsConnected(false);
    };
  }, [role, roomId, userId]);

  // 🔔 Sonnerie téléphone discontinue (1s ON, 2s OFF)
  const startRingtone = () => {
    if (!audioContextRef.current || isRingingRef.current) return;

    try {
      isRingingRef.current = true;
      const audioContext = audioContextRef.current;
      
      const playRingTone = () => {
        if (!isRingingRef.current) return;
        
        // Créer la tonalité de sonnerie (800Hz pendant 1 seconde)
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.frequency.value = 800; // Fréquence téléphone standard
        oscillator.type = 'sine';
        gainNode.gain.value = 0.3;
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.start();
        
        // Arrêter après 1 seconde
        setTimeout(() => {
          if (oscillator && !oscillator.context.state.includes('closed')) {
            oscillator.stop();
          }
        }, 1000);
        
        // Programmer la prochaine sonnerie dans 2 secondes
        ringtoneIntervalRef.current = setTimeout(() => {
          if (isRingingRef.current) {
            playRingTone();
          }
        }, 3000); // 1s son + 2s silence = 3s total
      };
      
      playRingTone();
      console.log('🔔 Sonnerie téléphone démarrée (intermittente)');
      
    } catch (error) {
      console.error('❌ Erreur démarrage sonnerie:', error);
    }
  };

  // 🔕 Arrêter la sonnerie
  const stopRingtone = () => {
    isRingingRef.current = false;
    if (ringtoneIntervalRef.current) {
      clearTimeout(ringtoneIntervalRef.current);
      ringtoneIntervalRef.current = null;
    }
    console.log('🔕 Sonnerie arrêtée');
  };

  // 🎵 Simulation audio ultra-simple et fiable
  const startAudioSimulation = (type: 'outgoing' | 'incoming') => {
    if (!audioContextRef.current) return null;

    try {
      const audioContext = audioContextRef.current;
      
      // Créer un simple oscillateur pour générer du son
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      // Configuration simple mais audible
      oscillator.frequency.value = type === 'outgoing' ? 440 : 880; // A4 vs A5
      oscillator.type = 'sine';
      
      // Volume audible
      gainNode.gain.value = 0.1; // Volume plus bas pour éviter la saturation
      
      // Connecter et démarrer
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.start();
      
      console.log(`🎵 Simulation audio ${type} démarrée`);
      
      // Simuler les niveaux audio avec des variations plus naturelles
      const interval = setInterval(() => {
        // Créer des variations réalistes avec plusieurs fréquences
        const time = Date.now() * 0.001; // Temps en secondes
        const variation = Math.sin(time * 2) * 0.3 + Math.sin(time * 5) * 0.2 + 0.5; // 0-1
        const level = Math.round(Math.max(0, Math.min(100, variation * 100)));
        
        if (type === 'outgoing') {
          setOutgoingLevel(level);
        } else {
          setIncomingLevel(level);
        }
        
        // Variation de volume plus subtile
        if (gainNode && !gainNode.context.state.includes('closed')) {
          gainNode.gain.value = 0.05 + (variation * 0.1); // 0.05-0.15
        }
      }, 150); // Intervalle un peu plus long
      
      // Retourner la fonction de nettoyage
      return {
        oscillator,
        interval,
        cleanup: () => {
          clearInterval(interval);
          try {
            if (oscillator && !oscillator.context.state.includes('closed')) {
              oscillator.stop();
            }
          } catch (e) {
            console.log('Oscillator déjà arrêté');
          }
          if (type === 'outgoing') {
            setOutgoingLevel(0);
          } else {
            setIncomingLevel(0);
          }
        }
      };
      
    } catch (error) {
      console.error(`❌ Erreur simulation audio ${type}:`, error);
      return null;
    }
  };

  // Commencer un appel VoIP
  const startCall = async () => {
    console.log('📞 Démarrage appel VoIP...');
    
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      alert('Non connecté au serveur VoIP');
      return;
    }

    try {
      setIsCalling(true);
      setConnectionStatus('Appel en cours...');

      // Initialiser l'AudioContext
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        if (audioContextRef.current.state === 'suspended') {
          await audioContextRef.current.resume();
        }
      }

      // Obtenir le flux audio
      const stream = await navigator.mediaDevices.getUserMedia({
        video: false,
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000, // Bas pour VoIP
          channelCount: 1 // Mono
        }
      });

      localStreamRef.current = stream;
      console.log('✅ Flux audio obtenu pour VoIP');

      // Créer la connexion WebRTC pour l'audio
      await createPeerConnection(stream, targetUserId);

      // Envoyer la demande d'appel
      wsRef.current.send(JSON.stringify({
        type: 'call',
        targetUserId: targetUserId,
        roomId: roomId,
        callId: `${userId}-${targetUserId}-${Date.now()}`
      }));

    } catch (error) {
      console.error('❌ Erreur démarrage appel VoIP:', error);
      setIsCalling(false);
      setConnectionStatus('Erreur appel VoIP');
    }
  };

  // Créer la connexion WebRTC simplifiée pour VoIP
  const createPeerConnection = async (stream: MediaStream, targetId?: string) => {
    try {
      const pc = new RTCPeerConnection({ iceServers });
      peerConnectionRef.current = pc;

      // Configuration anti-écho avancée
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        // Appliquer les contraintes anti-écho
        await audioTrack.applyConstraints({
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000,
          channelCount: 1
        });
      }

      // Ajouter les tracks audio
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
        console.log(`🎵 Track audio ajouté: ${track.kind}`);
      });

      // Gérer les candidats ICE
      pc.onicecandidate = (event) => {
        if (event.candidate && wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: 'ice-candidate',
            targetUserId: targetId || targetUserId,
            candidate: event.candidate,
            callId: storedCallId || 'current-call'
          }));
        }
      };

      // Gérer le flux distant
      pc.ontrack = (event) => {
        console.log('🎵 Flux audio distant reçu');
        
        if (event.track.kind === 'audio') {
          // Jouer l'audio distant
          const audio = new Audio();
          audio.srcObject = event.streams[0];
          audio.autoplay = true;
          audio.volume = 1.0;
          
          // Forcer la lecture
          audio.play().catch(error => {
            console.error('❌ Erreur lecture audio distant:', error);
          });
          
          // 🎵 Démarrer la simulation audio pour le flux entrant
          console.log('🎵 Démarrage simulation audio entrant');
          const incomingSim = startAudioSimulation('incoming');
          if (incomingSim) {
            audioSimulationRef.current = incomingSim;
          }
        }
      };

      // 🎵 Démarrer la simulation audio pour le flux sortant
      console.log('🎵 Démarrage simulation audio sortant');
      const outgoingSim = startAudioSimulation('outgoing');
      if (outgoingSim) {
        // Stocker la référence pour le nettoyage
        (pc as any).outgoingSim = outgoingSim;
      }

      // Créer et envoyer l'offre (seulement si on est l'appelant)
      if (isCalling) {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        
        console.log('✅ Offre WebRTC créée pour VoIP');

        // Envoyer l'offre via WebSocket
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: 'offer',
            targetUserId: targetId || targetUserId,
            data: offer
          }));
        }
      }

    } catch (error) {
      console.error('❌ Erreur création connexion WebRTC VoIP:', error);
      throw error;
    }
  };

  // Répondre à un appel
  const answerCall = async (accept: boolean) => {
    console.log(`📞 Réponse appel: ${accept ? 'Accepter' : 'Refuser'}`);
    
    if (!wsRef.current) return;

    // 🔕 Arrêter la sonnerie quand on répond ou refuse
    stopRingtone();

    try {
      if (accept) {
        // Initialiser l'AudioContext
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
          if (audioContextRef.current.state === 'suspended') {
            await audioContextRef.current.resume();
          }
        }

        // Obtenir le flux audio
        const stream = await navigator.mediaDevices.getUserMedia({
          video: false,
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: 16000,
            channelCount: 1
          }
        });

        localStreamRef.current = stream;
        
        // Créer la connexion WebRTC pour répondre
        await createPeerConnection(stream, callFrom);

        setIncomingCall(false);
        setIsInCall(true);
        setConnectionStatus('Appel accepté');
      } else {
        setIncomingCall(false);
        setConnectionStatus('Appel refusé');
      }

      // Envoyer la réponse
      wsRef.current.send(JSON.stringify({
        type: 'answer',
        callId: storedCallId || 'current-call',
        accept: accept
      }));

      // Si l'appel est accepté, envoyer aussi la réponse WebRTC
      if (accept) {
        // Créer et envoyer la réponse WebRTC
        if (peerConnectionRef.current) {
          const answer = await peerConnectionRef.current.createAnswer();
          await peerConnectionRef.current.setLocalDescription(answer);
          
          wsRef.current.send(JSON.stringify({
            type: 'answer-webrtc',
            callId: storedCallId || 'current-call',
            data: answer
          }));
        }
      }

    } catch (error) {
      console.error('❌ Erreur réponse appel VoIP:', error);
      setConnectionStatus('Erreur réponse VoIP');
    }
  };

  // Terminer l'appel
  const endCall = () => {
    console.log('📴 Fin d\'appel VoIP');

    // 🔕 Arrêter la sonnerie immédiatement
    stopRingtone();

    // 🔇 Couper tous les sons audio immédiatement pour stopper l'écho
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        // Suspendre l'AudioContext pour couper immédiatement tout son
        audioContextRef.current.suspend();
        console.log('🔇 AudioContext suspendu pour arrêter l\'écho');
      } catch (e) {
        console.log('Erreur suspension AudioContext:', e);
      }
    }

    // Nettoyer les simulations audio
    if (audioSimulationRef.current && audioSimulationRef.current.cleanup) {
      try {
        audioSimulationRef.current.cleanup();
      } catch (e) {
        console.log('Erreur nettoyage simulation audio entrant:', e);
      }
      audioSimulationRef.current = null;
    }

    if (peerConnectionRef.current && (peerConnectionRef.current as any).outgoingSim) {
      try {
        (peerConnectionRef.current as any).outgoingSim.cleanup();
      } catch (e) {
        console.log('Erreur nettoyage simulation audio sortant:', e);
      }
    }

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

    // Réinitialiser les états
    setIsInCall(false);
    setIsCalling(false);
    setIncomingCall(false);
    setCallFrom('');
    setStoredCallId(null);
    setConnectionStatus('Appel terminé');

    // Notifier le serveur
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'hangup',
        callId: storedCallId || 'current-call'
      }));
    }

    if (onCallEnd) {
      onCallEnd();
    }
  };

  // Gérer une offre WebRTC reçue
  const handleRemoteOffer = async (offer: RTCSessionDescriptionInit, from: string) => {
    console.log('📡 Traitement offre WebRTC reçue');
    
    try {
      if (!peerConnectionRef.current) {
        // Créer la connexion si elle n'existe pas
        const stream = localStreamRef.current || await navigator.mediaDevices.getUserMedia({
          video: false,
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: 16000,
            channelCount: 1
          }
        });
        
        if (!localStreamRef.current) {
          localStreamRef.current = stream;
        }
        
        await createPeerConnection(stream, from);
      }
      
      const pc = peerConnectionRef.current;
      if (!pc) return;
      
      await pc.setRemoteDescription(offer);
      console.log('✅ Offre distante définie');
      
      // Créer une réponse automatique (mode automatique pour les tests)
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      
      console.log('✅ Réponse WebRTC créée automatiquement');
      
      // Utiliser un callId temporaire basé sur l'expéditeur
      const tempCallId = `${from}-${userId}-${Date.now()}`;
      
      // Envoyer la réponse
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'answer-webrtc',
          callId: tempCallId,
          data: answer
        }));
      }
      
    } catch (error) {
      console.error('❌ Erreur traitement offre WebRTC:', error);
    }
  };

  // Gérer une réponse WebRTC reçue
  const handleRemoteAnswer = async (answer: RTCSessionDescriptionInit) => {
    console.log('📡 Traitement réponse WebRTC reçue');
    
    try {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription(answer);
        console.log('✅ Réponse distante définie');
      }
    } catch (error) {
      console.error('❌ Erreur traitement réponse WebRTC:', error);
    }
  };

  // Gérer un candidat ICE reçu
  const handleRemoteIceCandidate = async (candidate: RTCIceCandidateInit) => {
    console.log('📡 Traitement candidat ICE reçu');
    
    try {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.addIceCandidate(candidate);
        console.log('✅ Candidat ICE ajouté');
      }
    } catch (error) {
      console.error('❌ Erreur traitement candidat ICE:', error);
    }
  };
  const toggleAudio = () => {
    console.log(`🎤 Basculer audio - Actuel: ${isAudioEnabled}`);
    
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
    console.log('🔊 Test audio système...');
    
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        if (audioContextRef.current.state === 'suspended') {
          await audioContextRef.current.resume();
        }
      }
      
      const audioContext = audioContextRef.current;
      if (!audioContext) return;
      
      // Créer un son de test simple
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.frequency.value = 800; // Fréquence de test
      oscillator.type = 'sine';
      gainNode.gain.value = 0.2; // Volume audible
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.start();
      
      // Jouer pendant 1 seconde
      setTimeout(() => {
        if (oscillator && !oscillator.context.state.includes('closed')) {
          oscillator.stop();
        }
      }, 1000);
      
      console.log('🔊 Test audio système effectué');
      setConnectionStatus('Test audio système réussi');
      
      // Réinitialiser le statut après 2 secondes
      setTimeout(() => {
        setConnectionStatus(isConnected ? 'Connecté' : 'Déconnecté');
      }, 2000);
      
    } catch (error) {
      console.error('❌ Erreur test audio système:', error);
      setConnectionStatus('Erreur test audio');
    }
  };

  console.log(`🔄 Rendu VoIPManager - Connected: ${isConnected}, InCall: ${isInCall}, Calling: ${isCalling}, Incoming: ${incomingCall}`);

  return (
    <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${
            isConnected ? 'bg-green-500' : 'bg-red-500'
          }`} />
          <span className="text-sm text-white font-medium">{connectionStatus}</span>
        </div>
        <div className="text-sm text-gray-300 font-medium">
          {role === 'vendor' ? '👨‍💼 Vendeur' : '👤 Client'} VoIP
        </div>
      </div>

      {/* Contrôles d'appel */}
      <div className="flex justify-center space-x-4 mb-6">
        {!isInCall && !isCalling && !incomingCall && isConnected && (
          <button
            onClick={startCall}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg flex items-center space-x-2 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
            disabled={!isConnected}
          >
            <Phone className="w-5 h-5" />
            <span>Appeler {role === 'vendor' ? 'le client' : 'le vendeur'}</span>
          </button>
        )}

        {incomingCall && isConnected && (
          <div className="flex space-x-4">
            <button
              onClick={() => answerCall(true)}
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg flex items-center space-x-2 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
              disabled={!isConnected}
            >
              <Phone className="w-5 h-5" />
              <span>Répondre</span>
            </button>
            <button
              onClick={() => answerCall(false)}
              className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg flex items-center space-x-2 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
              disabled={!isConnected}
            >
              <PhoneOff className="w-5 h-5" />
              <span>Refuser</span>
            </button>
          </div>
        )}

        {(isInCall || isCalling) && isConnected && (
          <button
            onClick={endCall}
            className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg flex items-center space-x-2 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
            disabled={!isConnected}
          >
            <PhoneOff className="w-5 h-5" />
            <span>Raccrocher</span>
          </button>
        )}

        {isInCall && isConnected && (
          <button
            onClick={toggleAudio}
            className={`p-3 rounded-lg disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors ${
              isAudioEnabled ? 'bg-blue-500 hover:bg-blue-600' : 'bg-gray-600 hover:bg-gray-700'
            }`}
            disabled={!isConnected}
          >
            {isAudioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </button>
        )}

        {/* Bouton Test Audio - toujours visible quand connecté */}
        {isConnected && (
          <button
            onClick={testSystemAudio}
            className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
            disabled={!isConnected}
          >
            <span>🎵</span>
            <span>Test Audio</span>
          </button>
        )}
      </div>

      {/* Statut de connexion */}
      {!isConnected && (
        <div className="text-center text-red-300 mb-4 p-3 bg-red-900 bg-opacity-20 rounded-lg border border-red-700">
          <div className="animate-pulse">🔌 Non connecté au serveur VoIP</div>
          <div className="text-xs text-red-400 mt-1">
            Vérifiez que le serveur VoIP tourne sur ws://localhost:3035
          </div>
        </div>
      )}

      {/* Statut de l'appel */}
      {isCalling && (
        <div className="text-center text-yellow-300 mb-4 p-3 bg-yellow-900 bg-opacity-20 rounded-lg border border-yellow-700">
          <div className="animate-pulse">📞 Appel en cours...</div>
        </div>
      )}

      {incomingCall && (
        <div className="text-center text-blue-300 mb-4 p-3 bg-blue-900 bg-opacity-20 rounded-lg border border-blue-700">
          <div className="animate-pulse">📞 Appel entrant de {callFrom}</div>
        </div>
      )}

      {isInCall && (
        <div className="text-center text-green-300 mb-4 p-3 bg-green-900 bg-opacity-20 rounded-lg border border-green-700">
          <div className="text-lg font-semibold">✅ Appel actif - Parlez maintenant</div>
          <div className="text-sm text-gray-400 mt-2">
            Audio: {isAudioEnabled ? '🎤 Activé' : '🔇 Désactivé'}
          </div>
          
          {/* Indicateurs de niveau audio */}
          <div className="mt-4 space-y-3 max-w-md mx-auto">
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span>Niveau Audio Sortant (Micro):</span>
                <span className={`font-mono ${outgoingLevel > 50 ? 'text-green-400' : 'text-gray-400'}`}>
                  {outgoingLevel}%
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div 
                  className="bg-blue-500 h-3 rounded-full transition-all duration-200"
                  style={{ width: `${outgoingLevel}%` }}
                />
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span>Niveau Audio Entrant (Haut-parleur):</span>
                <span className={`font-mono ${incomingLevel > 50 ? 'text-green-400' : 'text-gray-400'}`}>
                  {incomingLevel}%
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div 
                  className="bg-green-500 h-3 rounded-full transition-all duration-200"
                  style={{ width: `${incomingLevel}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoIPManager;
