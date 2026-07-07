import React, { useState, useEffect, useRef } from 'react';
import { Phone, PhoneOff, Video, Mic, MicOff, Settings, Users } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import io from 'socket.io-client';

/**
 * WebRTC SIP Client
 * Connecte les appels WebRTC au système FreePBX/Asterisk via le gateway
 */
interface CallSession {
  id: string;
  status: 'idle' | 'calling' | 'ringing' | 'answered' | 'ended';
  remoteUser?: string;
  startTime?: Date;
  endTime?: Date;
}

interface SIPClientProps {
  userId: string;
  sipCredentials: {
    username: string;
    password: string;
    domain: string;
  };
}

const SIPClient: React.FC<SIPClientProps> = ({ userId, sipCredentials }) => {
  const [socket, setSocket] = useState<any>(null);
  const [connected, setConnected] = useState(false);
  const [callSession, setCallSession] = useState<CallSession>({ id: '', status: 'idle' });
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [incomingCall, setIncomingCall] = useState<any>(null);
  const [sipRegistered, setSipRegistered] = useState(false);
  const [mediaPermission, setMediaPermission] = useState<'pending' | 'granted' | 'denied'>('pending');
  const [audioLevel, setAudioLevel] = useState(0);
  const [remoteAudioLevel, setRemoteAudioLevel] = useState(0);
  const audioMonitorRef = useRef<any>(null);
  const remoteAudioMonitorRef = useRef<any>(null);
  const callStatusRef = useRef<CallSession['status']>('idle');
  const cleanupMediaRef = useRef<() => void>(() => {});
  const handleIncomingCallRef = useRef<(data: any) => void | Promise<void>>(() => {});
  const handleCallAnsweredRef = useRef<(data: any) => void | Promise<void>>(() => {});
  const handleCallEndedRef = useRef<(data: any) => void>(() => {});
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

  // Configuration WebRTC
  const rtcConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  useEffect(() => {
    // Connexion au serveur de passerelle avec gestion d'erreur
    const socketConnection = io('http://localhost:8080', {
      transports: ['websocket', 'polling'], // Fallback si WebSocket échoue
      timeout: 5000,
      forceNew: true
    });
    
    socketConnection.on('connect', () => {
      setConnected(true);
      console.log('🔌 Connecté au serveur SIP Gateway');
      toast.success('Connecté au serveur SIP');
      
      // S'enregistrer dans le système SIP
      socketConnection.emit('register', {
        userId,
        sipCredentials
      });
    });

    socketConnection.on('disconnect', () => {
      setConnected(false);
      toast.error('Déconnecté du serveur SIP');
    });

    socketConnection.on('connect_error', (error) => {
      console.error('Erreur de connexion WebSocket:', error);
      toast.error('Erreur de connexion au serveur');
      setConnected(false);
    });

    socketConnection.on('registered', () => {
      setSipRegistered(true);
      toast.success('Enregistré dans le système SIP');
    });

    socketConnection.on('registration-failed', (data) => {
      setSipRegistered(false);
      toast.error(`Échec d'enregistrement: ${data.error}`);
    });

    socketConnection.on('incoming-call', (data) => {
      void handleIncomingCallRef.current(data);
    });

    socketConnection.on('call-answered', (data) => {
      void handleCallAnsweredRef.current(data);
    });

    socketConnection.on('call-ended', (data) => {
      handleCallEndedRef.current(data);
    });

    socketConnection.on('call-initiated', (data) => {
      console.log('Appel initié:', data);
      // Synchroniser le startTime du serveur pour l'appelant
      if (data.startTime && callStatusRef.current === 'calling') {
        setCallSession(prev => ({
          ...prev,
          startTime: new Date(data.startTime)
        }));
      }
    });

    socketConnection.on('ice-candidate', (data) => {
      console.log('🧊 Candidat ICE reçu:', data);
      handleIceCandidate(data);
    });

    socketConnection.on('connection-test-response', (data) => {
      console.log('Réponse test connexion:', data);
      toast.success('Connexion WebSocket OK!');
    });

    setSocket(socketConnection);

    return () => {
      socketConnection.disconnect();
      cleanupMediaRef.current();
    };
  }, [userId, sipCredentials]); // Ajouter les dépendances pour reconnexion si changement d'utilisateur

  useEffect(() => {
    callStatusRef.current = callSession.status;
  }, [callSession.status]);

  // Mettre à jour les flux vidéo
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

  const initializeMedia = async () => {
    try {
      // Si nous avons déjà un flux local, l'utiliser
      if (localStream) {
        return localStream;
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      setLocalStream(stream);
      setMediaPermission('granted');
      return stream;
    } catch (error) {
      console.error('Erreur accès média:', error);
      setMediaPermission('denied');
      toast.error('Impossible d\'accéder à la caméra/microphone');
      throw error;
    }
  };

  const cleanupMedia = () => {
    stopAudioMonitoring(); // Arrêter la surveillance audio
    
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    if (remoteStream) {
      remoteStream.getTracks().forEach(track => track.stop());
      setRemoteStream(null);
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
  };

  const createPeerConnection = (stream: MediaStream) => {
    const pc = new RTCPeerConnection(rtcConfig);
    
    // Ajouter le flux local
    stream.getTracks().forEach(track => {
      pc.addTrack(track, stream);
    });

    // Gérer le flux distant
    pc.ontrack = (event) => {
      console.log('📺 Flux distant reçu:', event.streams);
      const [remoteStream] = event.streams;
      setRemoteStream(remoteStream);
      
      // Démarrer la surveillance audio du flux distant
      if (remoteStream.getAudioTracks().length > 0) {
        startAudioMonitoring(remoteStream, true);
        console.log('🎤 Surveillance audio distante démarrée');
      }
    };

    // Gérer les candidats ICE
    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        console.log('🧊 Émission candidat ICE:', event.candidate);
        socket.emit('ice-candidate', {
          callId: callSession.id,
          candidate: event.candidate
        });
      }
    };

    // Gérer les changements de connexion
    pc.onconnectionstatechange = () => {
      console.log('État connexion WebRTC:', pc.connectionState);
      if (pc.connectionState === 'connected') {
        toast.success('Connexion audio établie !');
        console.log('✅ Connexion WebRTC établie avec succès');
      }
    };

    // Gérer l'établissement de la connexion
    pc.oniceconnectionstatechange = () => {
      console.log('État connexion ICE:', pc.iceConnectionState);
      if (pc.iceConnectionState === 'connected') {
        console.log('🧊 Connexion ICE établie');
      }
    };

    peerConnectionRef.current = pc;
    return pc;
  };

  const startCall = async (targetUserId: string) => {
    try {
      console.log('🎯 Démarrage appel vers:', targetUserId);
      const callId = generateCallId();
      const startTime = new Date(); // Définir le startTime immédiatement
      
      // IMPORTANT: Définir la session AVANT tout traitement async
      setCallSession({ 
        id: callId, 
        status: 'calling',
        remoteUser: targetUserId,
        startTime: startTime
      });
      
      toast.info('Appel en cours...');
      
      // Traitement WebRTC en arrière-plan
      const stream = await initializeMedia();
      const pc = createPeerConnection(stream);
      
      // Créer l'offre WebRTC
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      // Envoyer l'offre au serveur SIP
      if (socket) {
        console.log('📤 Envoi offre au serveur:', { targetUserId, callId });
        socket.emit('offer', {
          targetUserId,
          offer,
          callId: callId
        });
      }
      
    } catch (error) {
      console.error('❌ Erreur démarrage appel:', error);
      toast.error('Échec du démarrage de l\'appel');
      setCallSession({ id: '', status: 'idle' });
    }
  };

  const handleIncomingCall = async (data: any) => {
    const { callId, caller, sdp } = data;
    
    console.log('📞 Appel entrant reçu:', { callId, caller, userId });
    
    // Stocker l'appel entrant pour afficher une notification persistante
    setIncomingCall({
      callId,
      caller,
      sdp,
      timestamp: new Date()
    });
    
    // Afficher aussi une notification toast
    toast.info(`Appel entrant de ${caller}`, {
      duration: 10000,
      action: {
        label: 'Répondre',
        onClick: () => answerCall(callId, sdp)
      }
    });
    
    setCallSession({
      id: callId,
      status: 'ringing',
      remoteUser: caller,
      startTime: new Date() // Définir le startTime dès la réception de l'appel
    });
  };

  const answerCall = async (callId: string, sdpOffer: string) => {
    try {
      // Effacer la notification d'appel entrant
      setIncomingCall(null);
      
      const stream = await initializeMedia();
      const pc = createPeerConnection(stream);
      
      // Définir la description distante
      await pc.setRemoteDescription({ type: 'offer', sdp: sdpOffer });
      
      // Créer la réponse
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      
      // Envoyer la réponse avec le SDP
      if (socket) {
        socket.emit('answer', {
          callId,
          answer: {
            type: answer.type,
            sdp: answer.sdp
          }
        });
      }
      
      setCallSession(prev => ({
        ...prev,
        status: 'answered',
        startTime: new Date()
      }));
      
      // Démarrer la surveillance audio locale
      if (stream) {
        startAudioMonitoring(stream, false);
        console.log('🎤 Surveillance audio locale démarrée pour le répondant');
      }
      
      toast.success('Appel accepté');
    } catch (error) {
      console.error('Erreur réponse appel:', error);
      toast.error('Échec de la réponse à l\'appel');
      endCall();
    }
  };

  const startAudioMonitoring = (stream: MediaStream, isRemote: boolean = false) => {
    try {
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      
      const microphone = audioContext.createMediaStreamSource(stream);
      microphone.connect(analyser);
      
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      
      const monitor = () => {
        analyser.getByteFrequencyData(dataArray);
        
        // Calculer le niveau RMS
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i] * dataArray[i];
        }
        const rms = Math.sqrt(sum / dataArray.length);
        const normalizedLevel = Math.min(100, (rms / 128) * 100);
        
        if (isRemote) {
          setRemoteAudioLevel(normalizedLevel);
        } else {
          setAudioLevel(normalizedLevel);
        }
      };
      
      const interval = setInterval(monitor, 100);
      
      if (isRemote) {
        remoteAudioMonitorRef.current = { audioContext, microphone, interval };
      } else {
        audioMonitorRef.current = { audioContext, microphone, interval };
      }
      
    } catch (error) {
      console.error('❌ Erreur surveillance audio:', error);
    }
  };

  const stopAudioMonitoring = () => {
    if (audioMonitorRef.current) {
      clearInterval(audioMonitorRef.current.interval);
      audioMonitorRef.current.microphone.disconnect();
      audioMonitorRef.current.audioContext.close();
      audioMonitorRef.current = null;
    }
    if (remoteAudioMonitorRef.current) {
      clearInterval(remoteAudioMonitorRef.current.interval);
      remoteAudioMonitorRef.current.microphone.disconnect();
      remoteAudioMonitorRef.current.audioContext.close();
      remoteAudioMonitorRef.current = null;
    }
    setAudioLevel(0);
    setRemoteAudioLevel(0);
  };

  const handleCallAnswered = async (data: any) => {
    console.log('🎯 Appel répondu, début du compteur pour:', userId, data);
    
    // Si nous avons une réponse SDP, l'appliquer
    if (data.answer && peerConnectionRef.current) {
      try {
        await peerConnectionRef.current.setRemoteDescription(data.answer);
        console.log('✅ Description distante appliquée pour:', userId);
        
        // Démarrer la surveillance audio locale
        if (localStream) {
          startAudioMonitoring(localStream, false);
        }
        
        // Attendre un court instant pour que le flux distant soit établi
        setTimeout(() => {
          if (remoteStream) {
            startAudioMonitoring(remoteStream, true);
            console.log('🎤 Surveillance audio distante démarrée pour l\'appelant');
          }
        }, 1000);
        
      } catch (error) {
        console.error('❌ Erreur application description distante:', error);
      }
    }
    
    // LOGIQUE ALTERNÉE FONCTIONNELLE : Chaque client gère son propre compteur
    // Utiliser le startTime du serveur s'il est fourni, sinon créer un nouveau
    const effectiveStartTime = data.startTime ? new Date(data.startTime) : new Date();
    
    setCallSession(prev => ({
      ...prev,
      status: 'answered',
      startTime: effectiveStartTime
    }));
    
    console.log('✅ Compteur démarré pour:', userId, 'à', effectiveStartTime.toISOString());
    toast.success('Appel accepté');
  };

  const handleCallEnded = (data: any) => {
    cleanupMedia();
    setCallSession({ id: '', status: 'idle' });
    toast.info('Appel terminé');
  };

  const handleIceCandidate = (data: any) => {
    if (peerConnectionRef.current && data.candidate) {
      console.log('🧊 Ajout candidat ICE:', data.candidate);
      peerConnectionRef.current.addIceCandidate(data.candidate)
        .then(() => {
          console.log('✅ Candidat ICE ajouté avec succès');
        })
        .catch((error) => {
          console.error('❌ Erreur ajout candidat ICE:', error);
        });
    }
  };

  cleanupMediaRef.current = cleanupMedia;
  handleIncomingCallRef.current = handleIncomingCall;
  handleCallAnsweredRef.current = handleCallAnswered;
  handleCallEndedRef.current = handleCallEnded;

  const endCall = () => {
    if (socket && callSession.id) {
      socket.emit('end-call', { callId: callSession.id });
    }
    cleanupMedia();
    setCallSession({ id: '', status: 'idle' });
    setIncomingCall(null); // Effacer toute notification d'appel entrant
  };

  const toggleMute = () => {
    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTracks = localStream.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff(!isVideoOff);
    }
  };

  const generateCallId = () => {
    return `call-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  const testConnection = () => {
    if (socket) {
      socket.emit('test-connection', { timestamp: Date.now() });
      toast.info('Test de connexion envoyé');
    } else {
      toast.error('Non connecté au serveur');
    }
  };

  const requestMediaAccess = async () => {
    try {
      // Demander l'accès et garder le flux actif
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      // IMPORTANT: Stocker le flux et l'afficher dans la vidéo locale
      setLocalStream(stream);
      setMediaPermission('granted');
      
      // Afficher le flux dans la vidéo locale pour confirmer que ça fonctionne
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      toast.success('Accès microphone et caméra autorisé!');
      
    } catch (error) {
      setMediaPermission('denied');
      toast.error('Accès refusé - veuillez autoriser microphone et caméra');
      console.error('Erreur accès média:', error);
    }
  };

  const testAudioLevel = async () => {
    if (!localStream) {
      toast.error('Aucun accès microphone détecté - cliquez d\'abord sur "Autoriser Micro/Caméra"');
      return;
    }
    
    setIsTestingAudio(true);
    toast.info('Test audio en cours... parlez maintenant!');
    
    try {
      // Créer un contexte audio pour analyser le microphone
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      
      // Connecter le microphone au contexte audio
      const microphone = audioContext.createMediaStreamSource(localStream);
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      microphone.connect(analyser);
      
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      
      let testCount = 0;
      const testInterval = setInterval(() => {
        analyser.getByteFrequencyData(dataArray);
        
        // Calculer le niveau RMS (Root Mean Square) pour une meilleure détection
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i] * dataArray[i];
        }
        const rms = Math.sqrt(sum / dataArray.length);
        const normalizedLevel = Math.min(100, (rms / 128) * 100);
        
        setAudioLevel(normalizedLevel);
        testCount++;
        
        if (testCount > 50) { // 5 secondes de test
          clearInterval(testInterval);
          microphone.disconnect();
          audioContext.close();
          setIsTestingAudio(false);
          setAudioLevel(0);
          toast.success('Test audio termine');
        }
      }, 100);
      
    } catch (error) {
      console.error('❌ Erreur test audio:', error);
      toast.error('Erreur lors du test audio');
      setIsTestingAudio(false);
      setAudioLevel(0);
    }
  };

  const testCounter = () => {
    // Test ALTERNÉ FONCTIONNEL du compteur - basé sur les tests précédents
    console.log('🧪 TEST COMPTEUR DÉMARRÉ pour:', userId);
    const testStartTime = new Date();
    
    // Forcer le statut et le startTime - LOGIQUE QUI A MARCHÉ ALTERNÉMENT
    setCallSession(prev => ({
      ...prev,
      id: `test-call-${userId}`,
      status: 'answered',
      remoteUser: 'test-user',
      startTime: testStartTime
    }));
    
    toast.success(`Test compteur demarre pour ${userId}`);
    
    // Arrêter le test après 15 secondes
    setTimeout(() => {
      setCallSession(prev => ({ ...prev, id: '', status: 'idle' }));
      toast.info(`Test compteur termine pour ${userId}`);
    }, 15000);
  };

  const formatDuration = (startTime?: Date) => {
    if (!startTime) return '00:00';
    const now = new Date();
    const diff = Math.floor((now.getTime() - startTime.getTime()) / 1000);
    // Si le temps est négatif (startTime dans le futur), commencer à 0
    const positiveDiff = Math.max(0, diff);
    const minutes = Math.floor(positiveDiff / 60);
    const seconds = positiveDiff % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // État pour le compteur en temps réel - LOGIQUE SIMPLIFIÉE
  const [currentTime, setCurrentTime] = React.useState(new Date());
  const [showSettings, setShowSettings] = React.useState(false);
  const [isTestingAudio, setIsTestingAudio] = useState(false);

  // Compteur séparé pour éviter les conflits - LOGIQUE ALTERNÉE FONCTIONNELLE
  const [counterKey, setCounterKey] = useState(0);
  
  // Audio monitoring for active calls - DÉJÀ DÉCLARÉS PLUS HAUT
  // const audioMonitorRef = useRef<any>(null); // SUPPRIMÉ - DOUBLON
  // const remoteAudioMonitorRef = useRef<any>(null); // SUPPRIMÉ - DOUBLON
  
  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    
    // Démarrer le compteur SEULEMENT quand l'appel est en cours
    if (callSession.status === 'answered' && callSession.startTime) {
      console.log('🎯 DÉMARRAGE COMPTEUR - Appel actif pour:', userId);
      
      interval = setInterval(() => {
        // Force re-render en changeant la clé - CETTE LOGIQUE A MARCHÉ ALTERNÉMENT
        setCounterKey(prev => prev + 1);
      }, 1000);
    }
    
    return () => {
      if (interval) {
        console.log('🛑 ARRÊT COMPTEUR pour:', userId);
        clearInterval(interval);
      }
    };
  }, [callSession.status, callSession.startTime, userId]); // Ajouter userId pour séparer les sessions

  return (
    <div className="min-h-screen bg-[#f6faf3] p-4">
      <Toaster position="top-right" />
      
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <Phone className="w-6 h-6 text-[#1b5e20] mr-3" />
                Client SIP WebRTC
              </h1>
              <p className="text-gray-600 mt-1">
                Connecte: {connected ? 'Oui' : 'Non'} | Utilisateur: {userId}
              </p>
              {!connected && (
                <button 
                  onClick={testConnection}
                  className="mt-2 px-3 py-1 bg-[#1b5e20] text-white text-sm rounded hover:bg-[#16381a]"
                >
                  Tester la connexion
                </button>
              )}
              {connected && callSession.status === 'idle' && (
                <>
                  <button 
                    onClick={testCounter}
                    className="mt-2 px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 mr-2"
                  >
                    Tester le compteur
                  </button>
                  {mediaPermission !== 'granted' && (
                    <button 
                      onClick={requestMediaAccess}
                      className="mt-2 px-3 py-1 bg-[#1b5e20] text-white text-sm rounded hover:bg-[#16381a]"
                    >
                      Autoriser Micro/Caméra
                    </button>
                  )}
                </>
              )}
            </div>
            <div className="text-sm text-gray-500">
              {callSession.status !== 'idle' && callSession.startTime && (
                <div key={`duration-${counterKey}`} className={`px-3 py-1 rounded-lg font-mono font-bold animate-pulse ${
                  callSession.status === 'answered' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  Durée: {formatDuration(callSession.startTime)}
                </div>
              )}
              {callSession.status !== 'idle' && !callSession.startTime && (
                <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-lg font-mono font-bold animate-pulse">
                  Durée: 00:00
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Zone d'appel */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Vidéo locale */}
          <div className="bg-white rounded-2xl shadow-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Votre vidéo</h3>
            <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden relative">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
              {callSession.status === 'answered' && (
                <div className="absolute bottom-2 left-2 right-2 bg-black bg-opacity-50 rounded p-2">
                  <div className="flex items-center justify-between text-white text-xs">
                    <span>Votre audio:</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-gray-600 rounded-full h-2">
                        <div 
                          className={`h-full rounded-full transition-all duration-100 ${
                            audioLevel > 70 ? 'bg-red-500' : 
                            audioLevel > 40 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${audioLevel}%` }}
                        />
                      </div>
                      <span>{Math.round(audioLevel)}%</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Vidéo distante */}
          <div className="bg-white rounded-2xl shadow-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {callSession.remoteUser ? `Appel avec ${callSession.remoteUser}` : 'Vidéo distante'}
            </h3>
            <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden relative">
              {remoteStream ? (
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <Users className="w-16 h-16" />
                </div>
              )}
              {callSession.status === 'answered' && remoteStream && (
                <div className="absolute bottom-2 left-2 right-2 bg-black bg-opacity-50 rounded p-2">
                  <div className="flex items-center justify-between text-white text-xs">
                    <span>Audio distant:</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-gray-600 rounded-full h-2">
                        <div 
                          className={`h-full rounded-full transition-all duration-100 ${
                            remoteAudioLevel > 70 ? 'bg-red-500' : 
                            remoteAudioLevel > 40 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${remoteAudioLevel}%` }}
                        />
                      </div>
                      <span>{Math.round(remoteAudioLevel)}%</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Notification d'appel entrant */}
        {incomingCall && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl shadow-lg p-6 mt-6">
            <div className="text-center">
              <div className="flex items-center justify-center mb-4">
                <div className="animate-pulse bg-[#1b5e20] rounded-full p-3">
                  <Phone className="w-8 h-8 text-white" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-[#1b5e20] mb-2">
                Appel entrant de {incomingCall.caller}
              </h3>
              <p className="text-[#1b5e20] mb-4">L'appel a commencé à {new Date(incomingCall.timestamp).toLocaleTimeString()}</p>
              <div className="flex items-center justify-center space-x-4">
                <button
                  onClick={() => answerCall(incomingCall.callId, incomingCall.sdp)}
                  className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-full flex items-center space-x-2 transition-colors"
                >
                  <Phone className="w-5 h-5" />
                  <span>Répondre</span>
                </button>
                <button
                  onClick={() => {
                    setIncomingCall(null);
                    toast.info('Appel refusé');
                  }}
                  className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-full flex items-center space-x-2 transition-colors"
                >
                  <PhoneOff className="w-5 h-5" />
                  <span>Refuser</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Contrôles */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mt-6">
          <div className="flex items-center justify-center space-x-4">
            {/* Bouton Appeler */}
            {callSession.status === 'idle' && (
              <button
                onClick={() => startCall(userId === '1001' ? 'vendor@example.com' : '1001')}
                className="bg-green-500 hover:bg-green-600 text-white p-4 rounded-full transition-colors"
              >
                <Phone className="w-6 h-6" />
              </button>
            )}

            {/* Bouton Terminer */}
            {(callSession.status === 'calling' || callSession.status === 'answered') && (
              <button
                onClick={endCall}
                className="bg-red-500 hover:bg-red-600 text-white p-4 rounded-full transition-colors"
              >
                <PhoneOff className="w-6 h-6" />
              </button>
            )}

            {/* Contrôle audio */}
            {localStream && (
              <button
                onClick={toggleMute}
                className={`p-4 rounded-full transition-colors ${
                  isMuted 
                    ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              </button>
            )}

            {/* Contrôle vidéo */}
            {localStream && (
              <button
                onClick={toggleVideo}
                className={`p-4 rounded-full transition-colors ${
                  isVideoOff 
                    ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Video className="w-6 h-6" />
              </button>
            )}

            {/* Paramètres */}
            <button 
              onClick={() => setShowSettings(true)}
              className="bg-gray-100 hover:bg-gray-200 text-gray-600 p-4 rounded-full transition-colors"
            >
              <Settings className="w-6 h-6" />
            </button>
          </div>

          {/* Statut de l'appel */}
          <div className="text-center mt-4">
            <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
              callSession.status === 'idle' ? 'bg-gray-100 text-gray-800' :
              callSession.status === 'calling' ? 'bg-yellow-100 text-yellow-800' :
              callSession.status === 'ringing' ? 'bg-[#eef6ea] text-[#1b5e20]' :
              callSession.status === 'answered' ? 'bg-green-100 text-green-800' :
              'bg-red-100 text-red-800'
            }`}>
              {callSession.status === 'idle' ? 'Prêt' :
               callSession.status === 'calling' ? 'Appel en cours...' :
               callSession.status === 'ringing' ? 'Sonnerie...' :
               callSession.status === 'answered' ? 'En appel' :
               'Appel terminé'}
            </div>
          </div>
        </div>

        {/* Informations de connexion */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations de connexion</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Statut:</span>
              <span className={`ml-2 font-medium ${
                sipRegistered ? 'text-green-600' : 'text-red-600'
              }`}>
                {sipRegistered ? 'Connecté' : 'Déconnecté'}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Utilisateur SIP:</span>
              <span className="ml-2 font-medium text-gray-900">{sipCredentials.username}</span>
            </div>
            <div>
              <span className="text-gray-500">Domaine:</span>
              <span className="ml-2 font-medium text-gray-900">{sipCredentials.domain}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Boîte de dialogue des paramètres */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Paramètres Audio/Video</h3>
              <button 
                onClick={() => setShowSettings(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Microphone
                </label>
                <select className="w-full p-2 border border-gray-300 rounded-lg mb-2">
                  <option>Périphérique par défaut</option>
                  <option>Microphone intégré</option>
                  <option>Casque avec microphone</option>
                </select>
                
                {/* Indicateur de niveau audio en temps réel */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-500">Niveau audio:</span>
                    <button 
                      onClick={testAudioLevel}
                      disabled={isTestingAudio}
                      className={`text-xs px-2 py-1 rounded ${
                        isTestingAudio 
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                          : 'bg-[#1b5e20] text-white hover:bg-[#16381a]'
                      }`}
                    >
                      {isTestingAudio ? 'Test en cours...' : 'Tester'}
                    </button>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 relative overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-100 ${
                        audioLevel > 70 ? 'bg-red-500' : 
                        audioLevel > 40 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${audioLevel}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {audioLevel > 0 ? `${Math.round(audioLevel)}%` : 'Parlez pour tester'}
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Haut-parleurs
                </label>
                <select className="w-full p-2 border border-gray-300 rounded-lg">
                  <option>Périphérique par défaut</option>
                  <option>Haut-parleurs intégrés</option>
                  <option>Casque</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Caméra
                </label>
                <select className="w-full p-2 border border-gray-300 rounded-lg">
                  <option>Caméra par défaut</option>
                  <option>Caméra HD</option>
                </select>
              </div>
              
              <div className="flex items-center">
                <input type="checkbox" id="echo" className="mr-2" />
                <label htmlFor="echo" className="text-sm text-gray-700">
                  Suppression d'écho
                </label>
              </div>
              
              <div className="flex items-center">
                <input type="checkbox" id="noise" className="mr-2" defaultChecked />
                <label htmlFor="noise" className="text-sm text-gray-700">
                  Réduction de bruit
                </label>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button 
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button 
                onClick={() => {
                  toast.success('Paramètres sauvegardés');
                  setShowSettings(false);
                }}
                className="px-4 py-2 bg-[#1b5e20] text-white rounded-lg hover:bg-[#16381a]"
              >
                Sauvegarder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SIPClient;
