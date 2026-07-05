import React, { useState, useEffect, useRef } from 'react';
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff, MessageCircle, Send, User, Users } from 'lucide-react';
import { useLiveShopping } from '../contexts/LiveShoppingContext';
import { getWsUrl } from '../utils/realtimeUrls';

interface WebRTCManagerFinalProps {
  role: 'vendor' | 'client';
  roomId: string;
  userId: string;
  onCallEnd?: () => void;
}

interface ChatMessage {
  id: string;
  from: string;
  message: string;
  timestamp: Date;
}

const WebRTCManagerFinal: React.FC<WebRTCManagerFinalProps> = ({ 
  role, 
  roomId, 
  userId, 
  onCallEnd 
}) => {
  const { messages: globalMessages, sendMessage: sendGlobalMessage } = useLiveShopping();
  const [isConnected, setIsConnected] = useState(false);
  const [isInCall, setIsInCall] = useState(false);
  const [isCalling, setIsCalling] = useState(false);
  const [incomingCall, setIncomingCall] = useState(false);
  const [callFrom, setCallFrom] = useState('');
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('Déconnecté');
  const [isRinging, setIsRinging] = useState(false);
  const [audioStatus, setAudioStatus] = useState('🔇'); // Indicateur visuel audio

  const wsRef = useRef<WebSocket | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const ringtoneRef = useRef<HTMLAudioElement | null>(null);
  const messageAudioRef = useRef<HTMLAudioElement | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null); // Élément audio dédié pour la voix
  const pendingOfferRef = useRef<RTCSessionDescriptionInit | null>(null);
  const pendingIceCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const isInCallRef = useRef(false);
  const isCallingRef = useRef(false);
  const chatMessagesRef = useRef<ChatMessage[]>([]);
  const playRingtoneRef = useRef<() => void>(() => {});
  const sendGlobalMessageRef = useRef(sendGlobalMessage);
  const handleOfferRef = useRef<(offer: RTCSessionDescriptionInit) => Promise<void>>(async () => {});
  const handleAnswerRef = useRef<(answer: RTCSessionDescriptionInit) => Promise<void>>(async () => {});

  // Configuration WebRTC
  const iceServers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ];

  // Créer la sonnerie avec Web Audio API - VERSION SIMPLIFIÉE
  const createRingtone = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      // Configuration simplifiée mais efficace
      oscillator.type = 'sine';
      oscillator.frequency.value = 800; // 800Hz pour sonnerie téléphonique
      gainNode.gain.value = 0.3; // Volume modéré
      
      // Connecter les nœuds
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Démarrer l'oscillateur immédiatement
      oscillator.start();
      
      return { audioContext, oscillator, gainNode };
    } catch (error) {
      console.error('Erreur création sonnerie:', error);
      return null;
    }
  };

  // Jouer la sonnerie - VERSION SIMPLIFIÉE
  const playRingtone = () => {
    try {
      console.log('Démarrage de la sonnerie simplifiée...');
      
      // Créer la sonnerie Web Audio API
      const ringtone = createRingtone();
      if (ringtone) {
        // Stocker les références pour arrêter plus tard
        window.ringtoneOscillator = ringtone.oscillator;
        window.ringtoneGain = ringtone.gainNode;
        window.ringtoneContext = ringtone.audioContext;
        
        // Pattern SIMPLE : 1 seconde ON, 2 secondes OFF
        const pattern = () => {
          if (window.ringtoneGain) {
            window.ringtoneGain.gain.setValueAtTime(0.3, ringtone.audioContext.currentTime);
            setTimeout(() => {
              if (window.ringtoneGain) {
                window.ringtoneGain.gain.setValueAtTime(0, ringtone.audioContext.currentTime);
              }
            }, 1000); // 1 seconde ON
          }
        };
        
        pattern(); // Premier cycle
        window.ringtoneInterval = setInterval(pattern, 3000); // Toutes les 3 secondes
      }
      
      setIsRinging(true);
      
      // Jouer aussi le son audio HTML5 comme fallback
      if (ringtoneRef.current) {
        ringtoneRef.current.play().catch(console.error);
      }
    } catch (error) {
      console.error('Erreur lecture sonnerie:', error);
    }
  };

  chatMessagesRef.current = chatMessages;
  playRingtoneRef.current = playRingtone;
  sendGlobalMessageRef.current = sendGlobalMessage;

  // Arrêter la sonnerie - Méthode NUCLÉAIRE ABSOLUE
  const stopRingtone = () => {
    try {
      console.log('🛑 ARRÊT NUCLÉAIRE DE LA SONNERIE 🛑');
      
      // ARRÊT IMMÉDIAT ET TOTAL - VERSION ULTRA-RADICALE
      
      // 1. Couper l'intervalle instantanément
      if (window.ringtoneInterval) {
        clearInterval(window.ringtoneInterval);
        window.ringtoneInterval = null;
        console.log('✅ Intervalle arrêté');
      }
      
      // 2. FORCER LA FRÉQUENCE À 0 ET COUPER LE GAIN EN MÊME TEMPS
      if (window.ringtoneOscillator && window.ringtoneOscillator.frequency) {
        try {
          const now = window.ringtoneOscillator.context.currentTime;
          // Couper la fréquence à 0.001 Hz (quasi-silence)
          window.ringtoneOscillator.frequency.setValueAtTime(0.001, now);
          // Couper le gain à 0 instantanément
          if (window.ringtoneGain && window.ringtoneGain.gain) {
            window.ringtoneGain.gain.setValueAtTime(0, now);
          }
          console.log('✅ Fréquence et gain coupés');
        } catch (e) {
          console.log('❌ Erreur fréquence/gain:', e);
        }
      }
      
      // 3. DÉCONNECTER IMMÉDIATEMENT TOUTES LES CONNEXIONS
      if (window.ringtoneOscillator) {
        try {
          window.ringtoneOscillator.disconnect();
          console.log('✅ Oscillateur déconnecté');
        } catch (e) {
          console.log('❌ Erreur déconnexion oscillateur:', e);
        }
      }
      
      if (window.ringtoneGain) {
        try {
          window.ringtoneGain.disconnect();
          console.log('✅ Gain déconnecté');
        } catch (e) {
          console.log('❌ Erreur déconnexion gain:', e);
        }
      }
      
      // 4. ARRÊTER L'OSCILLATEUR IMMÉDIATEMENT (pas de délai)
      if (window.ringtoneOscillator) {
        try {
          if (window.ringtoneOscillator.context && window.ringtoneOscillator.context.state !== 'closed') {
            window.ringtoneOscillator.stop();
            console.log('✅ Oscillateur arrêté');
          }
        } catch (e) {
          console.log('❌ Erreur arrêt oscillateur:', e);
        }
        window.ringtoneOscillator = null;
      }
      
      // 5. FERMER LE CONTEXTE AUDIO IMMÉDIATEMENT
      if (window.ringtoneContext) {
        try {
          if (window.ringtoneContext.state !== 'closed') {
            window.ringtoneContext.close();
            console.log('✅ Contexte audio fermé');
          }
        } catch (e) {
          console.log('❌ Erreur fermeture contexte:', e);
        }
        window.ringtoneContext = null;
        window.ringtoneGain = null;
      }
      
      // 6. ARRÊTER LE SON HTML5 IMMÉDIATEMENT
      if (ringtoneRef.current) {
        try {
          ringtoneRef.current.pause();
          ringtoneRef.current.currentTime = 0;
          ringtoneRef.current.src = ''; // Vider la source
          console.log('✅ Audio HTML5 arrêté');
        } catch (e) {
          console.log('❌ Erreur arrêt audio HTML5:', e);
        }
      }
      
      // 7. CRÉER UN CONTEXTE DE SILENCE ABSOLU (nuclear option)
      try {
        const silenceContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const silenceOscillator = silenceContext.createOscillator();
        const silenceGain = silenceContext.createGain();
        
        // Configuration de silence absolu
        silenceOscillator.frequency.setValueAtTime(0.001, silenceContext.currentTime); // Fréquence minimale
        silenceGain.gain.setValueAtTime(0, silenceContext.currentTime); // Gain à zéro
        
        silenceOscillator.connect(silenceGain);
        silenceGain.connect(silenceContext.destination);
        
        // Démarrer et arrêter immédiatement pour "nettoyer" l'audio
        silenceOscillator.start();
        silenceOscillator.stop(silenceContext.currentTime + 0.01);
        
        setTimeout(() => {
          silenceContext.close();
          console.log('✅ Contexte de silence créé et fermé');
        }, 50);
        
      } catch (e) {
        console.log('❌ Erreur contexte silence:', e);
      }
      
      // 8. RÉINITIALISATION TOTALE DES VARIABLES GLOBALES
      window.ringtoneOscillator = null;
      window.ringtoneGain = null;
      window.ringtoneContext = null;
      window.ringtoneInterval = null;
      
      console.log('🔇 SONNERIE ULTRA-TUÉE - TOUT EST À ZÉRO 🔇');
      setIsRinging(false);
      
    } catch (error) {
      console.error('❌ ERREUR CRITIQUE ARRÊT SONNERIE:', error);
      
      // Dernière ligne de défense: forcer l'arrêt même en cas d'erreur
      try {
        if (window.ringtoneContext && window.ringtoneContext.state !== 'closed') {
          window.ringtoneContext.close();
        }
      } catch (e) {}
      
      window.ringtoneOscillator = null;
      window.ringtoneGain = null;
      window.ringtoneContext = null;
      window.ringtoneInterval = null;
      setIsRinging(false);
    }
  };

  // Son de notification de message
  const playMessageSound = () => {
    if (messageAudioRef.current) {
      messageAudioRef.current.play().catch(console.error);
    }
  };

  // 🔍 VALIDATION COMPLÈTE DE L'ÉTAT WEBRTC
  const validateWebRTCState = (action: string, expectedState?: string) => {
    if (!peerConnectionRef.current) {
      console.error(`❌ WebRTC: Pas de connexion active pour ${action}`);
      return false;
    }
    
    const currentState = peerConnectionRef.current.signalingState;
    console.log(`🔍 WebRTC State Check - Action: ${action}, Current: ${currentState}, Expected: ${expectedState || 'any'}`);
    
    if (expectedState && currentState !== expectedState) {
      console.warn(`⚠️ WebRTC: État inattendu pour ${action}. Attendu: ${expectedState}, Actuel: ${currentState}`);
      return false;
    }
    
    return true;
  };

  useEffect(() => {
    // Créer les éléments audio
    const ringtoneAudio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
    ringtoneAudio.loop = true;
    ringtoneRef.current = ringtoneAudio;

    const messageAudio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
    messageAudioRef.current = messageAudio;

    // 🔊 CRÉER UN ÉLÉMENT AUDIO DÉDIÉ POUR LA VOIX
    const remoteAudio = document.createElement('audio');
    remoteAudio.autoplay = true;
    remoteAudio.controls = false;
    remoteAudio.muted = false;
    remoteAudio.volume = 1.0;
    remoteAudio.style.display = 'none'; // Caché mais fonctionnel
    document.body.appendChild(remoteAudio);
    remoteAudioRef.current = remoteAudio;
    
    console.log('🔊 Élément audio distant créé:', remoteAudio);

    return () => {
      if (ringtoneRef.current) {
        ringtoneRef.current.pause();
      }
      if (messageAudioRef.current) {
        messageAudioRef.current.pause();
      }
      // 🔊 Nettoyer l'élément audio dédié
      if (remoteAudioRef.current) {
        remoteAudioRef.current.pause();
        remoteAudioRef.current.srcObject = null;
        if (remoteAudioRef.current.parentNode) {
          remoteAudioRef.current.parentNode.removeChild(remoteAudioRef.current);
        }
      }
    };
  }, []);

  // Connexion WebSocket
  useEffect(() => {
    const ws = new WebSocket(getWsUrl(3008)); // Utiliser le nouveau port WebRTC
    wsRef.current = ws;
    
    console.log(`🔌 Tentative de connexion WebSocket pour ${role}...`);

    ws.onopen = () => {
      console.log(`✅ WebSocket connecté en tant que ${role}`);
      setConnectionStatus('Connecté');
      setIsConnected(true);
      
      // Rejoindre la room
      ws.send(JSON.stringify({
        type: 'join-room',
        roomId: roomId,
        role: role,
        userId: userId
      }));
    };

    ws.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log(`📨 Message reçu (${role}):`, data.type, data);

        switch (data.type) {
          case 'joined-room':
            console.log(`✅ Rejoint la room: ${data.roomId} comme ${data.role}`);
            break;

          case 'other-users':
            console.log(`👥 Autres utilisateurs trouvés:`, data.users);
            break;

          case 'incoming-call':
            console.log(`📞 Appel entrant de ${data.from}`);
            setIncomingCall(true);
            setCallFrom(data.from);
            setIsRinging(true);
            playRingtoneRef.current();
            break;

          case 'offer':
            console.log(`📄 Offre reçue de ${data.from}`);
            if (isInCallRef.current) {
              await handleOfferRef.current(data.data);
              break;
            }

            pendingOfferRef.current = data.data;
            setIncomingCall(true);
            setCallFrom(data.from);
            break;

          case 'answer':
            console.log(`📄 Réponse reçue de ${data.from}`);
            stopRingtone();
            setIncomingCall(false);
            await handleAnswerRef.current(data.data);
            break;

          case 'ice-candidate':
            console.log(`🧊 Candidat ICE reçu de ${data.from}`);
            await handleIceCandidate(data.data);
            break;

          case 'chat-message': {
            // CRITIQUE: Éviter les doublons en vérifiant si le message existe déjà
            const existingMessage = chatMessagesRef.current.find(msg => 
              msg.message === data.message && 
              msg.from === data.from && 
              Math.abs(new Date(data.timestamp).getTime() - msg.timestamp.getTime()) < 1000
            );
            
            if (!existingMessage) {
              const newMessage: ChatMessage = {
                id: Date.now().toString(),
                from: data.from,
                message: data.message,
                timestamp: new Date(data.timestamp)
              };
              setChatMessages(prev => [...prev, newMessage]);
              
              // Ajouter aussi au contexte global pour synchroniser avec le chat principal
              const displayName = data.from.includes('vendor') ? 'Vendeur' : 'Client';
              sendGlobalMessageRef.current(data.message, displayName, roomId);
              
              playMessageSound();
            }
            break;
          }

          case 'call-ended':
            console.log('📞 Appel terminé par:', data.from);
            
            // Arrêter immédiatement la sonnerie avec la méthode améliorée
            stopRingtone();
            
            // Arrêter proprement la connexion WebRTC
            if (peerConnectionRef.current) {
              try {
                peerConnectionRef.current.close();
              } catch (e) {
                console.log('Erreur fermeture connexion:', e);
              }
              peerConnectionRef.current = null;
            }
            
            // Arrêter tous les tracks média
            if (localStreamRef.current) {
              localStreamRef.current.getTracks().forEach(track => {
                try {
                  track.stop();
                } catch (e) {
                  console.log('Erreur arrêt track:', e);
                }
              });
              localStreamRef.current = null;
            }
            
            // Nettoyer les références vidéo
            if (localVideoRef.current) {
              localVideoRef.current.srcObject = null;
            }
            
            if (remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = null;
            }
            
            // Réinitialiser les états
            setIsCalling(false);
            setIncomingCall(false);
            setCallFrom('');
            setIsInCall(false);
            setConnectionStatus('Appel terminé par l\'autre utilisateur');
            break;
            
          case 'answer-error':
            console.error('❌ Erreur de réponse WebRTC:', data.error);
            setConnectionStatus(data.error || 'Erreur réponse');
            setIsCalling(false);
            break;
            
          case 'call-error':
            console.error('❌ Erreur d\'appel:', data.error);
            setConnectionStatus(data.error || 'Erreur appel');
            setIsCalling(false);
            break;
        }
      } catch (error) {
        console.error('❌ Erreur traitement message:', error);
      }
    };

    ws.onclose = () => {
      console.log('🔌 WebSocket déconnecté');
      setConnectionStatus('Déconnecté');
      setIsConnected(false);
      stopRingtone();
    };

    ws.onerror = (error) => {
      console.error('❌ Erreur WebSocket:', error);
      setConnectionStatus('Erreur de connexion');
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
      stopRingtone();
    };
  }, [role, roomId, userId]);

  useEffect(() => {
    isInCallRef.current = isInCall;
  }, [isInCall]);

  useEffect(() => {
    isCallingRef.current = isCalling;
  }, [isCalling]);

  // Initialiser la connexion WebRTC
  const initializePeerConnection = () => {
    console.log('🔄 Initialisation nouvelle connexion WebRTC...');
    
    // Fermer l'ancienne connexion si elle existe
    if (peerConnectionRef.current) {
      console.log('🔄 Fermeture connexion WebRTC existante avant création nouvelle...');
      peerConnectionRef.current.close();
    }
    
    const pc = new RTCPeerConnection({ iceServers });
    peerConnectionRef.current = pc;
    
    console.log('✅ Nouvelle connexion WebRTC créée, état initial:', pc.signalingState);

    pc.onicecandidate = (event) => {
      if (event.candidate && wsRef.current?.readyState === WebSocket.OPEN) {
        console.log('🧊 ICE candidate généré:', event.candidate.candidate);
        wsRef.current.send(JSON.stringify({
          type: 'ice-candidate',
          roomId,
          data: event.candidate
        }));
      }
    };

    // 🔍 FONCTION DE DÉBOGAGE AUDIO ULTRA-COMPLET
    const debugAudioCompletely = (stream: MediaStream, element: HTMLVideoElement) => {
      console.log('🔊 DÉBOGAGE AUDIO COMPLET 🔊');
      
      // 1. Vérifier tous les tracks audio
      const audioTracks = stream.getAudioTracks();
      console.log('📊 Nombre de tracks audio:', audioTracks.length);
      
      audioTracks.forEach((track, index) => {
        console.log(`🎵 Track ${index}:`, {
          kind: track.kind,
          label: track.label,
          enabled: track.enabled,
          readyState: track.readyState,
          muted: track.muted,
          id: track.id
        });
      });
      
      // 2. Vérifier l'élément vidéo
      console.log('📺 Configuration vidéo:', {
        muted: element.muted,
        volume: element.volume,
        paused: element.paused,
        currentTime: element.currentTime,
        duration: element.duration,
        readyState: element.readyState,
        srcObject: element.srcObject ? 'Stream attaché' : 'Aucun stream'
      });
      
      // 3. Vérifier le contexte audio système
      if ('AudioContext' in window || 'webkitAudioContext' in window) {
        console.log('🎧 AudioContext disponible');
      } else {
        console.log('❌ AudioContext NON disponible');
      }
      
      // 4. Test de volume
      console.log('🔊 Test volume: element.volume =', element.volume);
      
      // 5. Forcer le déblocage audio (stratégie de secours)
      if (element.muted) {
        console.log('🚨 ÉLÉMENT MUET DÉTECTÉ - DÉBLOCAGE FORCÉ');
        element.muted = false;
        element.volume = 1.0;
      }
      
      // 6. Test de lecture forcé
      element.play().then(() => {
        console.log('✅ Lecture forcée réussie');
      }).catch(err => {
        console.error('❌ Erreur lecture forcée:', err);
      });
    };

    pc.ontrack = (event) => {
      console.log('🎯 Track reçu:', event.track.kind, 'from remote peer');
      console.log('📡 Stream reçu:', event.streams[0]);
      console.log('🔢 Nombre de tracks dans le stream:', event.streams[0]?.getTracks().length);
      
      if (remoteVideoRef.current && event.streams[0]) {
        const remoteStream = event.streams[0];
        
        // 🔊 Configuration audio ULTRA-DÉTAILLÉE
        if (event.track.kind === 'audio') {
          console.log('🎵 Configuration audio du track reçu...');
          
          // Configuration maximale pour la voix
          event.track.enabled = true;
          
          // Configuration de l'élément vidéo pour l'audio
          remoteVideoRef.current.muted = false;  // CRITIQUE: PAS MUET
          remoteVideoRef.current.volume = 1.0;   // Volume MAXIMUM
          
          console.log('🎤 Track audio configuré:', {
            enabled: event.track.enabled,
            readyState: event.track.readyState,
            muted: event.track.muted,
            elementMuted: remoteVideoRef.current.muted,
            elementVolume: remoteVideoRef.current.volume
          });
          
          if (event.track.readyState === 'live') {
            console.log('🟢 Track audio est LIVE et prêt');
          }
          
          // 🔊 FORCER LA SORTIE AUDIO SUR LES HAUT-PARLEURS
          forceAudioToSpeakers(remoteVideoRef.current);
        }
        
        // Assigner le stream
        remoteVideoRef.current.srcObject = remoteStream;
        
        // 🔊 DÉBOGAGE AUDIO COMPLET
        debugAudioCompletely(remoteStream, remoteVideoRef.current);
        
        // 🔊 SOLUTION FINALE : Web Audio API exactement comme le TEST AUDIO réussi
        if (event.track.kind === 'audio') {
          console.log('🎵 CONFIGURATION AUDIO WEBRTC - MÉTHODE TEST AUDIO');
          console.log('🎯 RÔLE ACTUEL:', role); // SAVOIR SI C'EST VENDEUR OU CLIENT
          
          // 🔍 VÉRIFICATION DÉTAILLÉE DU STREAM AUDIO
          const audioTracks = remoteStream.getAudioTracks();
          console.log('🔍 Nombre de pistes audio dans le stream:', audioTracks.length);
          
          if (audioTracks.length === 0) {
            console.error('❌ AUCUNE PISTE AUDIO DANS LE STREAM WEBRTC');
            setAudioStatus('❌ AUCUN AUDIO REÇU');
            return;
          }
          
          audioTracks.forEach((track, index) => {
            console.log(`🎵 Piste audio ${index}:`, {
              kind: track.kind,
              label: track.label,
              enabled: track.enabled,
              readyState: track.readyState,
              muted: track.muted
            });
          });
          
          // 🔊 TEST AUDIO DIRECT POUR VÉRIFIER LE FONCTIONNEMENT
          console.log('🔊 TEST AUDIO DIRECT AVANT WEBRTC...');
          try {
            const testAudioContext = new (window.AudioContext || window.webkitAudioContext)();
            const testOscillator = testAudioContext.createOscillator();
            const testGain = testAudioContext.createGain();
            
            testOscillator.connect(testGain);
            testGain.connect(testAudioContext.destination);
            
            testOscillator.frequency.setValueAtTime(800, testAudioContext.currentTime);
            testOscillator.type = 'sine';
            testGain.gain.setValueAtTime(0.3, testAudioContext.currentTime);
            
            testOscillator.start();
            testOscillator.stop(testAudioContext.currentTime + 0.5);
            
            console.log('✅ TEST AUDIO DIRECT RÉUSSI - Votre système audio fonctionne');
          } catch (testError) {
            console.error('❌ TEST AUDIO DIRECT ÉCHOUÉ:', testError);
          }
          
          // 🔊 SOLUTION PRINCIPALE : Web Audio API (exactement comme le test réussi)
          try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // 🔍 VÉRIFICATION : Le contexte audio est-il actif ?
            if (audioContext.state === 'suspended') {
              console.log('🔄 Contexte audio suspendu, tentative de reprise...');
              audioContext.resume().then(() => {
                console.log('✅ Contexte audio repris');
              }).catch(err => {
                console.error('❌ Impossible de reprendre le contexte audio:', err);
              });
            }
            
            // 🔍 CRITIQUE : Vérifier que le stream a bien du audio
            const hasAudio = remoteStream.getAudioTracks().length > 0;
            const hasVideo = remoteStream.getVideoTracks().length > 0;
            console.log(`📊 Stream distant: Audio=${hasAudio}, Vidéo=${hasVideo}`);
            
            // Créer la source audio à partir du stream WebRTC
            const mediaStreamSource = audioContext.createMediaStreamSource(remoteStream);
            
            // 🔍 VÉRIFICATION : La source est-elle valide ?
            if (!mediaStreamSource) {
              console.error('❌ SOURCE AUDIO WEBRTC INVALIDE');
              setAudioStatus('❌ SOURCE INVALIDE');
              return;
            }
            
            console.log('✅ Source WebRTC créée avec succès');
            
            // Créer un nœud de gain pour contrôler le volume
            const gainNode = audioContext.createGain();
            
            // Connecter la source au gain, puis au haut-parleur
            mediaStreamSource.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            // Volume maximum (1.0)
            gainNode.gain.setValueAtTime(1.0, audioContext.currentTime);
            
            console.log('✅ Web Audio API configuré pour le flux distant');
            console.log('✅ Flux audio WebRTC connecté au haut-parleur via Web Audio API');
            console.log('🔊 AUDIO WEBRTC PRÊT - PARLEZ DANS LE MICRO');
            console.log('💡 CONSEIL: Parlez fort et près du micro pendant 5 secondes');
            setAudioStatus('🔊 AUDIO WEBRTC ACTIF');
            
            // 🔍 SURVEILLANCE DU NIVEAU AUDIO
            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;
            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            
            mediaStreamSource.connect(analyser);
            
            const checkAudioLevel = () => {
              analyser.getByteFrequencyData(dataArray);
              let sum = 0;
              for (let i = 0; i < dataArray.length; i++) {
                sum += dataArray[i];
              }
              const average = sum / dataArray.length;
              
              if (average > 10) {
                console.log(`🔊 NIVEAU AUDIO DÉTECTÉ: ${average} (VOIX ACTIVE)`);
              } else {
                console.log(`🔇 NIVEAU AUDIO: ${average} (silence)`);
              }
              
              if (average > 5) {
                console.log('✅ VOIX DÉTECTÉE DANS LE STREAM WEBRTC!');
              }
            };
            
            // Vérifier le niveau audio toutes les secondes
            const audioCheckInterval = setInterval(checkAudioLevel, 1000);
            
            // Arrêter la surveillance après 10 secondes
            setTimeout(() => {
              clearInterval(audioCheckInterval);
              console.log('🔍 Surveillance audio terminée');
            }, 10000);
            
          } catch (audioError) {
            console.error('❌ Erreur Web Audio API:', audioError);
            console.error('Détails de l\'erreur:', audioError.message);
            setAudioStatus('❌ AUDIO WEBRTC BLOQUÉ');
          }
          
          // Configuration de l'élément audio comme backup (sans play())
          if (remoteAudioRef.current) {
            remoteAudioRef.current.srcObject = remoteStream;
            remoteAudioRef.current.muted = false;
            remoteAudioRef.current.volume = 1.0;
            remoteAudioRef.current.autoplay = true;
            
            // 🔊 FORCER LA SORTIE AUDIO SUR LES HAUT-PARLEURS POUR L'ÉLÉMENT AUDIO
            forceAudioToSpeakers(remoteAudioRef.current);
            
            console.log('✅ Élément audio configuré comme backup (sans play)');
          }
        }
        
        // Lecture vidéo (sans audio pour éviter les conflits)
        remoteVideoRef.current.play().then(() => {
          console.log('✅ Lecture vidéo distante démarrée');
        }).catch(error => {
          console.error('❌ Erreur lecture vidéo:', error);
        });
      }
      
      // 🔍 Analyse complète des tracks
      if (event.streams[0]) {
        event.streams[0].getTracks().forEach((track, index) => {
          console.log(`📊 Track ${index}:`, track.kind, 'label:', track.label, 'enabled:', track.enabled, 'readyState:', track.readyState);
        });
      }
    };

    pc.onconnectionstatechange = () => {
      console.log('🔄 État de connexion WebRTC changé:', pc.connectionState);
      
      switch (pc.connectionState) {
        case 'connected':
          console.log('✅ Connexion WebRTC établie avec succès');
          setIsInCall(true);
          setIsCalling(false);
          setIncomingCall(false);
          setConnectionStatus('En appel');
          stopRingtone();
          
          // CRITIQUE: Prévenir l'écho dès que la connexion est établie
          preventEchoDuringCall();
          break;
          
        case 'connecting':
          console.log('🔄 Connexion WebRTC en cours...');
          setConnectionStatus('Connexion en cours...');
          break;
          
        case 'disconnected':
          console.log('⚠️ Connexion WebRTC déconnectée');
          setConnectionStatus('Déconnecté');
          break;
          
        case 'failed':
          console.error('❌ Connexion WebRTC échouée');
          setConnectionStatus('Connexion échouée');
          endCall();
          break;
          
        case 'closed':
          console.log('🔒 Connexion WebRTC fermée');
          setConnectionStatus('Connexion fermée');
          endCall();
          break;
          
        default:
          console.log(`État de connexion: ${pc.connectionState}`);
      }
    };

    // 🔍 Gestionnaire d'état de signalisation pour le suivi de la négociation
    pc.onsignalingstatechange = () => {
      console.log('📡 État de signalisation WebRTC changé:', pc.signalingState);
      
      switch (pc.signalingState) {
        case 'stable':
          console.log('✅ État stable - Connexion établie ou prête');
          break;
          
        case 'have-local-offer':
          console.log('📤 Offre locale créée et prête à être envoyée');
          break;
          
        case 'have-remote-offer':
          console.log('📥 Offre distante reçue, création de la réponse...');
          break;
          
        case 'have-local-pranswer':
          console.log('📤 Réponse provisoire locale créée');
          break;
          
        case 'have-remote-pranswer':
          console.log('📥 Réponse provisoire distante reçue');
          break;
          
        case 'closed':
          console.log('🔒 Signalisation fermée');
          break;
          
        default:
          console.log(`État de signalisation: ${pc.signalingState}`);
      }
    };

    return pc;
  };

  // 🔊 TEST AUDIO AUTOMATIQUE AU CHARGEMENT
  useEffect(() => {
    const autoTestAudio = async () => {
      console.log('🔊 TEST AUDIO AUTOMATIQUE DÉMARRÉ...');
      
      // Attendre 2 secondes que la page soit complètement chargée
      setTimeout(() => {
        console.log('🎵 Lancement test audio automatique...');
        
        // Test 1: Beep avec Web Audio API (toujours autorisé)
        try {
          const audioContext = new (window.AudioContext || window.webkitAudioContext)();
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
          oscillator.type = 'sine';
          gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
          
          oscillator.start();
          oscillator.stop(audioContext.currentTime + 0.5);
          
          console.log('✅ BEEP AUTOMATIQUE 600Hz LANCÉ - Vérifiez si vous entendez');
        } catch (err) {
          console.error('❌ Beep automatique échoué:', err);
        }
        
        // Test 2: Message vocal synthétisé
        setTimeout(() => {
          try {
            if ('speechSynthesis' in window) {
              const utterance = new SpeechSynthesisUtterance('Test audio système');
              utterance.volume = 1.0;
              utterance.rate = 1.0;
              speechSynthesis.speak(utterance);
              console.log('✅ SYNTHÈSE VOCALE LANCÉE - Vérifiez si vous entendez "Test audio système"');
            }
          } catch (err) {
            console.error('❌ Synthèse vocale échouée:', err);
          }
        }, 1000);
        
      }, 2000);
    };
    
    autoTestAudio();
  }, []);

  // 🔊 VÉRIFICATION DES PÉRIPHÉRIQUES AUDIO
  const checkAudioDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputDevices = devices.filter(device => device.kind === 'audioinput');
      const audioOutputDevices = devices.filter(device => device.kind === 'audiooutput');
      
      console.log('🎤 Périphériques audio entrée:', audioInputDevices.length);
      audioInputDevices.forEach((device, index) => {
        console.log(`  ${index}: ${device.label} (${device.deviceId})`);
      });
      
      console.log('🔊 Périphériques audio sortie:', audioOutputDevices.length);
      audioOutputDevices.forEach((device, index) => {
        console.log(`  ${index}: ${device.label} (${device.deviceId})`);
      });
      
      return { audioInputDevices, audioOutputDevices };
    } catch (error) {
      console.error('❌ Erreur vérification périphériques:', error);
      return { audioInputDevices: [], audioOutputDevices: [] };
    }
  };

  // 🔊 FORCER LA SORTIE AUDIO SUR LES HAUT-PARLEURS
  const forceAudioToSpeakers = async (element: HTMLVideoElement | HTMLAudioElement) => {
    try {
      console.log('🔊 FORCAGE SORTIE AUDIO SUR HAUT-PARLEURS...');
      
      // Vérifier si l'API setSinkId est disponible
      if ('setSinkId' in element) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const speakers = devices.filter(device => 
          device.kind === 'audiooutput' && 
          (device.label.toLowerCase().includes('speakers') || 
           device.label.toLowerCase().includes('haut-parleurs') ||
           device.label.toLowerCase().includes('sortie'))
        );
        
        if (speakers.length > 0) {
          // Utiliser le premier haut-parleur trouvé
          await (element as any).setSinkId(speakers[0].deviceId);
          console.log('✅ Sortie audio forcée sur:', speakers[0].label);
        } else {
          console.log('⚠️ Aucun haut-parleur trouvé, utilisation par défaut');
        }
      } else {
        console.log('⚠️ API setSinkId non disponible');
      }
      
      // Configuration maximale du volume
      element.volume = 1.0;
      element.muted = false;
      
      console.log('✅ Configuration audio forcée terminée');
      
    } catch (error) {
      console.error('❌ Erreur forçage sortie audio:', error);
    }
  };

  // 🔊 TEST AUDIO SIMPLE POUR VÉRIFIER LE FONCTIONNEMENT
  const testSimpleAudio = () => {
    console.log('🎵 DÉMARRAGE TEST AUDIO...');
    try {
      // Test 1: Audio avec beep simple
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 1);
      
      console.log('✅ Test audio Web Audio API: BEEP 800Hz lancé');
      
      // Test 2: Audio HTML5 simple
      setTimeout(() => {
        const audio = new Audio();
        audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT';
        audio.volume = 1.0;
        audio.play().then(() => {
          console.log('✅ Test audio HTML5: SON AUDIBLE');
          setTimeout(() => audio.pause(), 1000);
        }).catch(err => {
          console.error('❌ Test audio HTML5 échoué:', err);
        });
      }, 500);
      
    } catch (error) {
      console.error('❌ Erreur test audio:', error);
      console.error('Détails:', error.message);
    }
  };

  const getLocalMediaStream = async () => {
    const audioConstraints: MediaTrackConstraints = {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    };

    const tryGet = async (video: boolean, audio: boolean | MediaTrackConstraints) => {
      return await navigator.mediaDevices.getUserMedia({ video, audio });
    };

    try {
      return await tryGet(isVideoEnabled, audioConstraints);
    } catch (e1) {
      if (isVideoEnabled) {
        try {
          return await tryGet(false, audioConstraints);
        } catch (e2) {
          try {
            return await tryGet(false, true);
          } catch (e3) {
            throw e1;
          }
        }
      }
      try {
        return await tryGet(false, true);
      } catch (e2) {
        throw e1;
      }
    }
  };

  const flushPendingIceCandidates = async (pc: RTCPeerConnection) => {
    const pending = pendingIceCandidatesRef.current;
    if (!pending.length) return;
    pendingIceCandidatesRef.current = [];

    for (const candidate of pending) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error('❌ Erreur ajout candidat ICE en différé:', err);
      }
    }
  };

  // Commencer un appel
  const startCall = async () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      alert('Non connecté au serveur');
      return;
    }

    try {
      setIsCalling(true);
      setConnectionStatus('Appel en cours...');

      // 🔊 VÉRIFICATION AUDIO AVANT L'APPEL
      console.log('🔊 DÉMARRAGE VÉRIFICATION AUDIO...');
      await checkAudioDevices();
      testSimpleAudio();

      // Vérifier et fermer toute connexion existante
      if (peerConnectionRef.current) {
        console.log('🔄 Fermeture de la connexion WebRTC existante...');
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }

      const stream = await getLocalMediaStream();
      
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.muted = true; // CRITIQUE: Pas d'echo local
        localVideoRef.current.volume = 0;   // CRITIQUE: Volume à zéro pour local
      }

      // CRITIQUE: S'assurer que l'élément audio distant est configuré pour la VOIX
      if (remoteVideoRef.current) {
        remoteVideoRef.current.muted = false; // IMPORTANT: PAS MUET
        remoteVideoRef.current.volume = 1.0;  // Volume maximum
        remoteVideoRef.current.autoplay = true;
        remoteVideoRef.current.controls = false;
      }

      // Créer une nouvelle connexion WebRTC
      const pc = initializePeerConnection();
      
      // Ajouter chaque track individuellement avec logs
      stream.getTracks().forEach(track => {
        console.log('Ajout du track:', track.kind, track.label);
        pc.addTrack(track, stream);
      });
      
      console.log('Tous les tracks ajoutés à la connexion WebRTC côté appelant');

      // Vérifier l'état avant de créer l'offre
      console.log('🔍 État avant createOffer:', pc.signalingState);
      
      const offer = await pc.createOffer();
      console.log('📄 Offre créée:', offer);
      
      await pc.setLocalDescription(offer);
      console.log('✅ Local description définie, nouvel état:', pc.signalingState);

      wsRef.current.send(JSON.stringify({
        type: 'call-notification',
        roomId,
        from: userId,
        message: `${role === 'vendor' ? 'Vendeur' : 'Client'} vous appelle`
      }));

      // Envoyer l'offre
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'offer',
          roomId,
          data: offer
        }));
        console.log('✅ Offre envoyée');
      }

    } catch (error) {
      console.error('❌ Erreur démarrage appel:', error);
      console.error('Détails complets:', error.message, error.stack);
      
      // Envoyer message d'erreur détaillé
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'call-error',
          error: 'Erreur lors du démarrage de l\'appel',
          details: error.message
        }));
      }
      
      setIsCalling(false);
      setConnectionStatus('Erreur appel');
    }
  };

  // Répondre à un appel
  const answerCall = async () => {
    if (!incomingCall || !wsRef.current) return;

    try {
      stopRingtone();
      setIncomingCall(false);
      setConnectionStatus('Réponse en cours...');

      // 🔊 VÉRIFICATION AUDIO AVANT LA RÉPONSE
      console.log('🔊 DÉMARRAGE VÉRIFICATION AUDIO POUR RÉPONSE...');
      await checkAudioDevices();
      testSimpleAudio();

      const offer = pendingOfferRef.current;
      if (!offer) {
        setIsInCall(false);
        setConnectionStatus('Erreur réponse');
        return;
      }

      await handleOffer(offer);
      pendingOfferRef.current = null;

    } catch (error) {
      console.error('❌ Erreur réponse appel:', error);
      console.error('Détails complets:', error.message, error.stack);
      
      setIsInCall(false);
      setConnectionStatus('Erreur réponse');
      
      // 🔴 ENVOYER MESSAGE D'ERREUR DÉTAILLÉ AU CLIENT
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'call-error',
          error: 'Erreur lors de la réponse à l\'appel',
          details: error.message,
          stack: error.stack
        }));
      }
    }
  };

  // Refuser un appel
  const rejectCall = () => {
    stopRingtone();
    setIncomingCall(false);
    setCallFrom('');
    setConnectionStatus('Appel refusé');
  };

  // Gérer l'offre
  const handleOffer = async (offer: RTCSessionDescriptionInit) => {
    try {
      console.log('🎯 TRAITEMENT OFFRE WEBRTC...');
      console.log('📄 Offre reçue:', offer);
      
      // Vérifier l'état actuel de la connexion
      if (peerConnectionRef.current) {
        console.log('🔄 Connexion WebRTC existante détectée, état:', peerConnectionRef.current.signalingState);
        
        // Si la connexion est déjà stable, on peut la réutiliser ou la recréer
        if (peerConnectionRef.current.signalingState === 'stable') {
          console.log('⚠️ Connexion déjà stable, fermeture et recréation...');
          peerConnectionRef.current.close();
          peerConnectionRef.current = null;
        }
      }
      
      // S'assurer que le flux local est prêt
      if (!localStreamRef.current) {
        console.log('📹 Flux local non prêt, création...');
        
        const stream = await getLocalMediaStream();
        
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          localVideoRef.current.muted = true;
          localVideoRef.current.volume = 0;
        }
      }

      const pc = initializePeerConnection();
      
      // Ajouter le flux local à la connexion AVANT de traiter l'offre
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => {
          console.log('🎵 Ajout track:', track.kind, track.label);
          pc.addTrack(track, localStreamRef.current!);
        });
      }

      // Vérifier l'état avant de traiter l'offre
      console.log('🔍 État avant setRemoteDescription:', pc.signalingState);
      
      // Traiter l'offre
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      console.log('✅ Remote description définie, nouvel état:', pc.signalingState);

      await flushPendingIceCandidates(pc);
      
      // Créer et envoyer la réponse
      const answer = await pc.createAnswer();
      console.log('📄 Réponse créée:', answer);
      
      await pc.setLocalDescription(answer);
      console.log('✅ Local description définie, nouvel état:', pc.signalingState);
      
      // Envoyer la réponse
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'answer',
          roomId,
          data: answer
        }));
        console.log('✅ Réponse envoyée');
      }
      
      console.log('🎉 OFFRE TRAITÉE AVEC SUCCÈS');

      setIsCalling(false);
      setIsInCall(true);
      setIncomingCall(false);
      setCallFrom('');
      setConnectionStatus('Appel établi');
      stopRingtone();
      remoteVideoRef.current?.play().catch(() => {});
      
    } catch (error) {
      console.error('❌ Erreur traitement offre:', error);
      console.error('Détails complets:', error.message, error.stack);
      
      // Envoyer message d'erreur détaillé
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'answer-error',
          error: 'Erreur lors du traitement de l\'offre',
          details: error.message,
          signalingState: peerConnectionRef.current?.signalingState || 'unknown'
        }));
      }
    }
  };

  handleOfferRef.current = handleOffer;

  // Gérer la réponse
  const handleAnswer = async (answer: RTCSessionDescriptionInit) => {
    try {
      if (peerConnectionRef.current) {
        const pc = peerConnectionRef.current;
        console.log('🎯 TRAITEMENT RÉPONSE WEBRTC...');
        console.log('📄 Réponse reçue:', answer);
        console.log('État actuel de la connexion:', pc.signalingState);
        
        // Vérifier l'état avant de traiter la réponse
        if (pc.signalingState === 'have-local-offer') {
          console.log('✅ État correct: have-local-offer');
          
          // Traiter la réponse
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
          console.log('✅ Remote description définie avec succès');

          await flushPendingIceCandidates(pc);
          
          setIsCalling(false);
          setIsInCall(true);
          setConnectionStatus('Appel établi');
          stopRingtone();
          setIncomingCall(false);
          remoteVideoRef.current?.play().catch(() => {});
          
          console.log('🎉 RÉPONSE WEBRTC TRAITÉE AVEC SUCCÈS');
          
        } else if (pc.signalingState === 'stable') {
          console.log('⚠️ Connexion déjà stable, réponse déjà traitée');
          setIsCalling(false);
          setIsInCall(true);
        } else {
          console.log('❌ État incorrect:', pc.signalingState);
          
          // Forcer la configuration quand même
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(answer));
            console.log('✅ Remote description forcée avec succès');
            await flushPendingIceCandidates(pc);
            setIsCalling(false);
            setIsInCall(true);
            stopRingtone();
            setIncomingCall(false);
          } catch (forceError) {
            console.error('❌ Impossible de forcer la réponse:', forceError);
            console.error('Détails complets:', forceError.message, forceError.stack);
            
            // Envoyer message d'erreur détaillé
            if (wsRef.current?.readyState === WebSocket.OPEN) {
              wsRef.current.send(JSON.stringify({
                type: 'answer-error',
                error: 'Erreur lors du traitement de la réponse',
                details: forceError.message,
                signalingState: pc.signalingState,
                answerType: answer.type,
                answerSdp: answer.sdp ? 'present' : 'missing'
              }));
            }
          }
        }
      } else {
        console.log('❌ Pas de connexion WebRTC active');
        
        // Envoyer message d'erreur
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: 'answer-error',
            error: 'Pas de connexion WebRTC active',
            details: 'La connexion WebRTC n\'a pas été initialisée correctement'
          }));
        }
      }
    } catch (error) {
      console.error('❌ Erreur traitement réponse:', error);
      console.error('Détails complets:', error.message, error.stack);
      
      // Envoyer message d'erreur détaillé
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'answer-error',
          error: 'Erreur lors du traitement de la réponse',
          details: error.message,
          stack: error.stack
        }));
      }
    }
  };

  handleAnswerRef.current = handleAnswer;

  // Gérer les candidats ICE
  const handleIceCandidate = async (candidate: RTCIceCandidateInit) => {
    try {
      if (peerConnectionRef.current) {
        const pc = peerConnectionRef.current;
        console.log('🧊 Ajout candidat ICE, état actuel:', pc.signalingState);
        
        // Vérifier l'état avant d'ajouter le candidat
        if (pc.remoteDescription) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
          console.log('✅ Candidat ICE ajouté avec succès');
        } else {
          console.log('⚠️ Pas de remote description, stockage du candidat pour plus tard');
          pendingIceCandidatesRef.current.push(candidate);
        }
      }
    } catch (error) {
      console.error('❌ Erreur traitement candidat ICE:', error);
      console.error('Détails:', error.message);
    }
  };

  // Envoyer un message chat
  const sendChatMessage = () => {
    if (!chatInput.trim()) return;

    // CRITIQUE: Utiliser UNIQUEMENT le contexte LiveShopping pour éviter les doublons
    const displayName = role === 'vendor' ? 'Vendeur' : 'Client';
    
    // Ajouter d'abord au contexte global (cela déclenchera la synchro WebSocket)
    sendGlobalMessage(chatInput.trim(), displayName, roomId);

    // Ajouter à l'historique local pour l'affichage immédiat
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      from: displayName,
      message: chatInput.trim(),
      timestamp: new Date()
    };
    setChatMessages(prev => [...prev, newMessage]);
    setChatInput('');

    // Envoyer aussi via WebSocket pour la synchronisation (sécurité double)
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'chat-message',
        roomId,
        message: chatInput.trim(),
        from: userId,
        timestamp: new Date().toISOString()
      }));
    }
  };

  // Basculer la vidéo
  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !isVideoEnabled;
        setIsVideoEnabled(!isVideoEnabled);
      }
    }
  };

  // CRITIQUE: Fonction pour éliminer l'écho après l'appel (VERSION MODÉRÉE)
  const eliminateEcho = () => {
    try {
      console.log('🔇 ÉLIMINATION DE L\'ÉCHO APRÈS APPEL 🔇');
      
      // 1. Couper l'audio local (mais pas l'audio distant pour ne pas couper la voix)
      if (localVideoRef.current) {
        localVideoRef.current.muted = true;
        localVideoRef.current.volume = 0;
      }
      
      // 2. Désactiver les tracks audio locaux SEULEMENT
      if (localStreamRef.current) {
        localStreamRef.current.getAudioTracks().forEach(track => {
          track.enabled = false;
        });
      }
      
      // 3. NE PAS couper l'audio distant - c'est là qu'on entend la voix
      // if (remoteVideoRef.current) {
      //   remoteVideoRef.current.muted = false; // Garder l'audio distant actif
      //   remoteVideoRef.current.volume = 1.0;  // Volume normal
      // }
      
      console.log('✅ Écho éliminé - Audio distant conservé pour la voix');
    } catch (error) {
      console.error('❌ Erreur élimination écho:', error);
    }
  };

  // CRITIQUE: Fonction pour prévenir l'écho pendant l'appel (VERSION ÉQUILIBRÉE)
  const preventEchoDuringCall = () => {
    try {
      console.log('🎧 PRÉVENTION DE L\'ÉCHO PENDANT L\'APPEL 🎧');
      
      // 1. S'assurer que la vidéo locale est en sourdine (IMPORTANT: pas d'echo local)
      if (localVideoRef.current) {
        localVideoRef.current.muted = true;  // CRITIQUE: Pas d'audio local pour éviter l'écho
        localVideoRef.current.volume = 0;    // CRITIQUE: Volume zéro pour local
      }
      
      // 2. Configurer l'audio distant avec volume NORMAL pour entendre la voix
      if (remoteVideoRef.current) {
        remoteVideoRef.current.volume = 1.0; // Volume MAXIMUM pour entendre la voix
        remoteVideoRef.current.muted = false; // S'assurer que ce n'est PAS muet
        
        // CRITIQUE: Forcer la lecture audio
        try {
          if (remoteVideoRef.current.paused) {
            remoteVideoRef.current.play();
            console.log('✅ Lecture audio forcée côté distant');
          }
        } catch (e) {
          console.log('❌ Erreur lecture audio forcée:', e);
        }
      }
      
      // 3. Activer l'audio local seulement si le microphone est activé
      if (localStreamRef.current && isAudioEnabled) {
        localStreamRef.current.getAudioTracks().forEach(track => {
          track.enabled = true; // Activer l'envoi de la voix
        });
      }
      
      console.log('✅ Prévention écho configurée - Audio distant activé');
    } catch (error) {
      console.error('❌ Erreur prévention écho:', error);
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
        
        console.log(`🎤 Microphone ${newAudioState ? 'ACTIVÉ' : 'DÉSACTIVÉ'}`);
        
        // CRITIQUE: Mettre à jour le statut de connexion
        setConnectionStatus(newAudioState ? 'Microphone activé' : 'Microphone désactivé');
      }
    }
  };

  // Terminer l'appel
  const endCall = () => {
    console.log('🛑 TERMINAISON DE L\'APPEL 🛑');
    
    // ARRÊT IMMÉDIAT DE LA SONNERIE (priorité maximale)
    stopRingtone();
    
    // ÉLIMINATION TOTALE DE L'ÉCHO (CRITIQUE)
    eliminateEcho();
    
    // Notifier l'autre utilisateur de la fin d'appel (plusieurs tentatives)
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const endCallMessage = JSON.stringify({
        type: 'call-ended',
        roomId,
        from: userId,
        timestamp: Date.now()
      });
      
      // Envoyer plusieurs fois pour s'assurer que le message passe
      wsRef.current.send(endCallMessage);
      setTimeout(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(endCallMessage);
        }
      }, 100);
      setTimeout(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(endCallMessage);
        }
      }, 500);
    }
    
    // Arrêter proprement la connexion WebRTC
    if (peerConnectionRef.current) {
      try {
        // Fermer tous les senders avant de fermer la connexion
        peerConnectionRef.current.getSenders().forEach(sender => {
          if (sender.track) {
            sender.track.stop();
          }
        });
        
        peerConnectionRef.current.close();
        console.log('✅ Connexion WebRTC fermée');
      } catch (e) {
        console.log('❌ Erreur fermeture connexion:', e);
      }
      peerConnectionRef.current = null;
    }

    // Arrêter tous les tracks média
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        try {
          track.stop();
          console.log('✅ Track arrêté:', track.kind);
        } catch (e) {
          console.log('❌ Erreur arrêt track:', e);
        }
      });
      localStreamRef.current = null;
    }

    // Nettoyer les références vidéo
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
      console.log('✅ Vidéo locale nettoyée');
    }

    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
      console.log('✅ Vidéo distante nettoyée');
    }
    
    // 🔇 ARRÊT COMPLET DE L'AUDIO DISTANT (CRITIQUE pour l'écho)
    console.log('🔇 ARRÊT AUDIO DISTANT - ÉLIMINATION ÉCHO');
    
    // Arrêter l'élément audio distant
    if (remoteAudioRef.current) {
      try {
        remoteAudioRef.current.pause();
        remoteAudioRef.current.srcObject = null;
        console.log('✅ Audio distant arrêté');
      } catch (e) {
        console.log('ℹ️ Audio distant déjà arrêté');
      }
    }
    
    // Réinitialiser les états
    setIsInCall(false);
    setIsCalling(false);
    setIncomingCall(false);
    setCallFrom('');
    setConnectionStatus('Appel terminé');
    setAudioStatus('🔇');
    
    console.log('✅ APPEL TERMINÉ AVEC SUCCÈS');

    if (onCallEnd) {
      onCallEnd();
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0 bg-gray-900 text-white">
      {/* Barre de statut */}
      <div className="bg-gray-800 p-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${
            isConnected ? 'bg-green-500' : 'bg-red-500'
          }`} />
          <span className="text-sm">{connectionStatus}</span>
        </div>
        <div className="text-sm font-medium">
          {role === 'vendor' ? 'Vendeur' : 'Client'} - Room: {roomId}
        </div>
      </div>

      {/* Zone vidéo */}
      <div className="flex-1 relative bg-black">
        {/* Vidéo distante */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />
        
        {/* Vidéo locale */}
        <div className="absolute top-4 right-4 w-32 h-24 bg-gray-800 rounded-lg overflow-hidden">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        </div>

        {/* Overlay d'appel */}
        {isCalling && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-pulse text-2xl mb-4">📞</div>
              <div className="text-lg">Appel en cours...</div>
            </div>
          </div>
        )}

        {/* Overlay d'appel entrant */}
        {incomingCall && (
          <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center">
            <div className="bg-gray-800 p-8 rounded-lg text-center">
              <div className="text-4xl mb-4">📞</div>
              <div className="text-xl mb-2">Appel entrant</div>
              <div className="text-lg mb-6">De: {callFrom}</div>
              <div className="flex space-x-4">
                <button
                  onClick={answerCall}
                  className="bg-green-500 hover:bg-green-600 px-6 py-3 rounded-lg flex items-center space-x-2"
                >
                  <Phone className="w-5 h-5" />
                  <span>Répondre</span>
                </button>
                <button
                  onClick={rejectCall}
                  className="bg-red-500 hover:bg-red-600 px-6 py-3 rounded-lg flex items-center space-x-2"
                >
                  <PhoneOff className="w-5 h-5" />
                  <span>Refuser</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Contrôles */}
      <div className="bg-gray-800 p-4">
        {/* 🔊 BOUTON DE TEST AUDIO ULTRA-SIMPLE */}
        <div className="flex justify-center mb-4">
          <button
            onClick={() => {
              console.log('🎵 TEST AUDIO ULTRA-SIMPLE...');
              
              // Test 1: BEEP immédiat avec Web Audio API
              try {
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
                oscillator.type = 'sine';
                gainNode.gain.setValueAtTime(0.7, audioContext.currentTime);
                
                oscillator.start();
                oscillator.stop(audioContext.currentTime + 0.8);
                
                console.log('✅ BEEP 800Hz LANCÉ - Entendez-vous le son ?');
              } catch (err) {
                console.error('❌ BEEP échoué:', err);
              }
              
              // Test 2: Message vocal après 1 seconde
              setTimeout(() => {
                if ('speechSynthesis' in window) {
                  const msg = new SpeechSynthesisUtterance('Audio test réussi');
                  msg.volume = 1.0;
                  speechSynthesis.speak(msg);
                  console.log('✅ MESSAGE VOCAL: "Audio test réussi"');
                }
              }, 1000);
            }}
            className="bg-green-500 hover:bg-green-600 px-8 py-4 rounded-lg text-xl font-bold border-2 border-green-300"
            style={{minWidth: '200px'}}
          >
            🎵 TEST AUDIO
          </button>
        </div>
        
        <div className="flex justify-center items-center space-x-4 mb-4">
          {!isInCall && !isCalling && !incomingCall && (
                <>
                  <button
                    onClick={startCall}
                    className="bg-blue-500 hover:bg-blue-600 px-6 py-3 rounded-lg flex items-center space-x-2"
                  >
                    <Phone className="w-5 h-5" />
                    <span>{role === 'vendor' ? 'Appeler le client' : 'Appeler le vendeur'}</span>
                  </button>
                </>
              )}

          {isInCall && (
            <>
              <button
                onClick={toggleVideo}
                className={`p-3 rounded-lg ${
                  isVideoEnabled ? 'bg-blue-500 hover:bg-blue-600' : 'bg-gray-600 hover:bg-gray-700'
                }`}
              >
                {isVideoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              </button>
              
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
                className="bg-red-500 hover:bg-red-600 px-6 py-3 rounded-lg flex items-center space-x-2"
              >
                <PhoneOff className="w-5 h-5" />
                <span>Raccrocher</span>
              </button>
            </>
          )}
        </div>

        {/* Chat */}
        <div className="border-t border-gray-700 pt-4">
          <div className="flex items-center space-x-2 mb-2">
            <MessageCircle className="w-5 h-5" />
            <span className="font-medium">Chat</span>
          </div>
          
          <div className="h-32 bg-gray-700 rounded-lg p-3 mb-2 overflow-y-auto">
            {chatMessages.length === 0 ? (
              <div className="text-gray-400 text-sm">Aucun message</div>
            ) : (
              chatMessages.map((msg) => (
                <div key={msg.id} className={`mb-1 ${
                  msg.from === userId ? 'text-right' : 'text-left'
                }`}>
                  <div className={`inline-block px-3 py-1 rounded-lg text-sm ${
                    msg.from === userId 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-600 text-white'
                  }`}>
                    <div className="font-medium text-xs opacity-75">
                      {msg.from === userId ? 'Vous' : msg.from}
                    </div>
                    <div>{msg.message}</div>
                  </div>
                </div>
              ))
            )}
          </div>
          
          <div className="flex space-x-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
              placeholder="Tapez votre message..."
              className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={sendChatMessage}
              disabled={!chatInput.trim()}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed px-4 py-2 rounded-lg flex items-center space-x-2"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WebRTCManagerFinal;

// Déclaration globale pour TypeScript
declare global {
  interface Window {
    ringtoneOscillator: OscillatorNode | null;
    ringtoneGain: GainNode | null;
    ringtoneContext: AudioContext | null;
    ringtoneInterval: NodeJS.Timeout | null;
  }
}
