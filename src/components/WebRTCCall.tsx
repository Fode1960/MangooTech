import React, { useState, useEffect, useRef } from 'react';
import { Phone, PhoneOff, PhoneCall, User, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { getWsUrl } from '../utils/realtimeUrls';

interface WebRTCCallProps {
  sessionId: string;
  vendorId: string;
  clientId?: string;
  mode: 'vendor' | 'client';
  onCallStart?: () => void;
  onCallEnd?: () => void;
}

const WebRTCCall: React.FC<WebRTCCallProps> = ({
  sessionId,
  vendorId,
  clientId,
  mode,
  onCallStart,
  onCallEnd
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isInCall, setIsInCall] = useState(false);
  const [isCalling, setIsCalling] = useState(false);
  const [hasIncomingCall, setHasIncomingCall] = useState(false);
  const [callStatus, setCallStatus] = useState<'idle' | 'calling' | 'in-call' | 'incoming-call'>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [remoteUserId, setRemoteUserId] = useState<string>('');
  const [isCallInitiator, setIsCallInitiator] = useState(false);
  
  const wsRef = useRef<WebSocket | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const localAudioRef = useRef<HTMLAudioElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const userId = mode === 'vendor' ? vendorId : (clientId || 'client-' + Math.random().toString(36).substr(2, 9));

  // Configuration WebRTC
  const RTC_CONFIG = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  /* eslint-disable react-hooks/exhaustive-deps */
  // This effect intentionally initializes the signaling socket once for the mounted call surface.
  useEffect(() => {
    initializeWebSocket();
    return () => {
      cleanup();
    };
  }, []);
  /* eslint-enable react-hooks/exhaustive-deps */

  const cleanup = () => {
    try {
      wsRef.current?.close();
    } catch {
    }
    try {
      pcRef.current?.close();
    } catch {
    }
    try {
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
    } catch {
    }
    try {
      remoteStreamRef.current?.getTracks().forEach((track) => track.stop());
    } catch {
    }
    wsRef.current = null;
    pcRef.current = null;
    localStreamRef.current = null;
    remoteStreamRef.current = null;
  };

  const initializeWebSocket = () => {
    try {
      const wsUrl = getWsUrl(3008);
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log(`WebSocket connecté pour ${userId}`);
        setIsConnected(true);
        toast.success('Connecté au serveur WebRTC');
        
        // S'enregistrer auprès du serveur
        wsRef.current?.send(JSON.stringify({
          type: 'register',
          userId: userId,
          sessionId: sessionId
        }));
      };

      wsRef.current.onmessage = async (event) => {
        const message = JSON.parse(event.data);
        console.log('Message reçu:', message);
        
        switch (message.type) {
          case 'call-offer':
            handleIncomingCall(message);
            break;
          case 'call-answer':
            handleCallAnswer(message);
            break;
          case 'ice-candidate':
            handleIceCandidate(message);
            break;
          case 'call-ended':
            handleRemoteCallEnd();
            break;
          case 'user-not-found':
            toast.error('Utilisateur non trouvé');
            setIsCalling(false);
            setCallStatus('idle');
            break;
        }
      };

      wsRef.current.onclose = () => {
        console.log('WebSocket déconnecté');
        setIsConnected(false);
        toast.error('Déconnecté du serveur WebRTC');
      };

      wsRef.current.onerror = (error) => {
        console.error('Erreur WebSocket:', error);
        toast.error('Erreur de connexion WebRTC');
      };

    } catch (error) {
      console.error('Erreur lors de la connexion WebSocket:', error);
      toast.error('Impossible de se connecter au serveur WebRTC');
    }
  };

  const createPeerConnection = async () => {
    pcRef.current = new RTCPeerConnection(RTC_CONFIG);
    
    // Gérer les candidats ICE
    pcRef.current.onicecandidate = (event) => {
      if (event.candidate && wsRef.current) {
        wsRef.current.send(JSON.stringify({
          type: 'ice-candidate',
          candidate: event.candidate,
          to: remoteUserId,
          from: userId
        }));
      }
    };

    // Gérer le flux distant
    pcRef.current.ontrack = (event) => {
      console.log('Flux distant reçu');
      remoteStreamRef.current = event.streams[0];
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = remoteStreamRef.current;
      }
    };

    // Obtenir le flux local
    try {
      localStreamRef.current = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }, 
        video: false 
      });
      
      if (localAudioRef.current) {
        localAudioRef.current.srcObject = localStreamRef.current;
      }

      // Ajouter les pistes locales à la connexion
      localStreamRef.current.getTracks().forEach(track => {
        pcRef.current?.addTrack(track, localStreamRef.current!);
      });

    } catch (error) {
      console.error('Erreur lors de l\'obtention du flux média:', error);
      toast.error('Impossible d\'accéder au microphone');
      throw error;
    }
  };

  const handleIncomingCall = async (message: any) => {
    console.log('Appel entrant reçu');
    setHasIncomingCall(true);
    setCallStatus('incoming-call'); // Changé pour correspondre à la version fonctionnelle
    setRemoteUserId(message.from);
    toast.info(`Appel entrant de ${message.from}`);
  };

  const handleCallAnswer = async (message: any) => {
    console.log('Réponse à l\'appel reçue');
    if (pcRef.current) {
      await pcRef.current.setRemoteDescription(new RTCSessionDescription(message.answer));
      setIsCalling(false);
      setIsInCall(true);
      setCallStatus('in-call');
      onCallStart?.();
      toast.success('Appel connecté');
    }
  };

  const handleIceCandidate = async (message: any) => {
    if (pcRef.current) {
      await pcRef.current.addIceCandidate(new RTCIceCandidate(message.candidate));
    }
  };

  const handleRemoteCallEnd = () => {
    console.log('Appel terminé à distance');
    cleanupCall();
    toast.info('Appel terminé');
  };

  const makeCall = async () => {
    if (!wsRef.current || !isConnected) {
      toast.error('Non connecté au serveur');
      return;
    }

    const targetUserId = mode === 'vendor' ? clientId : vendorId;
    if (!targetUserId) {
      toast.error('ID de l\'utilisateur cible manquant');
      return;
    }

    try {
      setIsCalling(true);
      setCallStatus('calling');
      setRemoteUserId(targetUserId);
      setIsCallInitiator(true); // Marquer comme initiateur de l'appel
      
      await createPeerConnection();
      
      // Créer l'offre
      const offer = await pcRef.current!.createOffer();
      await pcRef.current!.setLocalDescription(offer);
      
      // Envoyer l'offre
      wsRef.current.send(JSON.stringify({
        type: 'call-offer',
        offer: offer,
        to: targetUserId,
        from: userId,
        sessionId: sessionId
      }));
      
      toast.info('Appel en cours...');
      
    } catch (error) {
      console.error('Erreur lors de l\'appel:', error);
      setIsCalling(false);
      setCallStatus('idle');
      setIsCallInitiator(false);
      toast.error('Erreur lors de l\'appel');
    }
  };

  const answerCall = async () => {
    if (!pcRef.current && hasIncomingCall) {
      try {
        await createPeerConnection();
        
        // Créer la réponse
        const answer = await pcRef.current!.createAnswer();
        await pcRef.current!.setLocalDescription(answer);
        
        // Envoyer la réponse
        wsRef.current?.send(JSON.stringify({
          type: 'call-answer',
          answer: answer,
          to: remoteUserId,
          from: userId
        }));
        
        setHasIncomingCall(false);
        setIsInCall(true);
        setCallStatus('in-call');
        onCallStart?.();
        toast.success('Appel accepté');
        
      } catch (error) {
        console.error('Erreur lors de la réponse à l\'appel:', error);
        toast.error('Erreur lors de la réponse');
      }
    }
  };

  const rejectCall = () => {
    if (hasIncomingCall) {
      wsRef.current?.send(JSON.stringify({
        type: 'call-rejected',
        to: remoteUserId,
        from: userId
      }));
      
      setHasIncomingCall(false);
      setCallStatus('idle');
      toast.info('Appel rejeté');
    }
  };

  const hangupCall = () => {
    if (wsRef.current && (isInCall || isCalling)) {
      wsRef.current.send(JSON.stringify({
        type: 'call-ended',
        to: remoteUserId,
        from: userId
      }));
    }
    
    cleanupCall();
    toast.info('Appel terminé');
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleDeafen = () => {
    if (remoteAudioRef.current) {
      remoteAudioRef.current.muted = !remoteAudioRef.current.muted;
      setIsDeafened(remoteAudioRef.current.muted);
    }
  };

  const cleanupCall = () => {
    // Fermer la connexion peer
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    
    // Arrêter le flux local
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    
    // Réinitialiser l'état
    setIsCalling(false);
    setIsInCall(false);
    setHasIncomingCall(false);
    setCallStatus('idle');
    setIsMuted(false);
    setIsDeafened(false);
    setRemoteUserId('');
    setIsCallInitiator(false); // Réinitialiser l'initiateur
    
    onCallEnd?.();
  };

  const getButtonStates = () => {
    // Logique selon la version fonctionnelle test-webrtc-audio-complet.html
    if (callStatus === 'idle' || !isConnected) {
      return {
        callBtn: true,
        answerBtn: true,
        hangupBtn: true,
        rejectBtn: true
      };
    }
    
    if (callStatus === 'calling') {
      // Appelant: 8888 appelle 8889
      return {
        callBtn: true,      // Désactivé (déjà en train d'appeler)
        answerBtn: true,    // Désactivé (pas d'appel entrant pour l'appelant)
        hangupBtn: false,   // Activé (peut raccrocher)
        rejectBtn: true     // Désactivé (pas d'appel entrant)
      };
    }
    
    if (callStatus === 'incoming-call') {
      // Appelé: 8889 reçoit l'appel
      return {
        callBtn: true,      // Désactivé (déjà en appel)
        answerBtn: false,   // Activé (peut répondre)
        hangupBtn: true,    // Désactivé (pas encore en appel)
        rejectBtn: false    // Activé (peut rejeter)
      };
    }
    
    if (callStatus === 'in-call') {
      // Les deux sont en appel
      return {
        callBtn: true,      // Désactivé (déjà en appel)
        answerBtn: true,    // Désactivé (déjà en appel)
        hangupBtn: false,   // Activé (peut raccrocher)
        rejectBtn: true     // Désactivé (déjà en appel)
      };
    }
    
    return {
      callBtn: true,
      answerBtn: true,
      hangupBtn: true,
      rejectBtn: true
    };
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
      <Toaster position="top-right" />
      
      {/* Audio elements cachés */}
      <audio ref={localAudioRef} autoPlay muted className="hidden" />
      <audio ref={remoteAudioRef} autoPlay className="hidden" />
      
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Phone className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-800">
            Appel Audio {mode === 'vendor' ? 'Vendeur' : 'Client'}
          </h3>
        </div>
        
        <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
          isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          <div className={`w-2 h-2 rounded-full ${
            isConnected ? 'bg-green-500' : 'bg-red-500'
          } ${isConnected ? 'animate-pulse' : ''}`} />
          <span>{isConnected ? 'Connecté' : 'Déconnecté'}</span>
        </div>
      </div>

      {/* Status */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="text-sm text-gray-600 mb-1">Statut de l'appel</div>
        <div className={`font-medium ${
          callStatus === 'in-call' ? 'text-green-600' :
          callStatus === 'calling' ? 'text-blue-600' :
          callStatus === 'incoming-call' ? 'text-orange-600' :
          'text-gray-500'
        }`}>
          {callStatus === 'in-call' ? '🎧 En appel' :
           callStatus === 'calling' ? '📞 Appel en cours...' :
           callStatus === 'incoming-call' ? '📱 Appel entrant' :
           callStatus === 'idle' ? '💤 En attente' :
           '❓ Inconnu'}
        </div>
        {remoteUserId && (
          <div className="text-xs text-gray-500 mt-1">
            Avec: {remoteUserId}
          </div>
        )}
      </div>

      {/* Incoming Call - Affiché uniquement pour l'appelé */}
      {hasIncomingCall && (
        <div className="mb-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-orange-800">Appel entrant</div>
              <div className="text-sm text-orange-600">De {remoteUserId}</div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={answerCall}
                disabled={getButtonStates().answerBtn}
                className="bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white p-2 rounded-full transition-colors"
                title="Répondre"
              >
                <PhoneCall className="w-4 h-4" />
              </button>
              <button
                onClick={rejectCall}
                disabled={getButtonStates().rejectBtn}
                className="bg-red-500 hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white p-2 rounded-full transition-colors"
                title="Rejeter"
              >
                <PhoneOff className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Call Controls */}
      <div className="flex items-center justify-center space-x-3 mb-4">
        {/* Make Call */}
        <button
          onClick={makeCall}
          disabled={getButtonStates().callBtn}
          className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white p-3 rounded-full transition-colors"
          title="Appeler"
        >
          <PhoneCall className="w-5 h-5" />
        </button>

        {/* Hang Up - Actif pendant l'appel, l'appel en cours ou l'appel entrant */}
        <button
          onClick={hangupCall}
          disabled={getButtonStates().hangupBtn}
          className="bg-red-500 hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white p-3 rounded-full transition-colors"
          title="Raccrocher"
        >
          <PhoneOff className="w-5 h-5" />
        </button>

        {/* Mute */}
        <button
          onClick={toggleMute}
          disabled={getButtonStates().answerBtn} // Utiliser la même logique que answerBtn pour la cohérence
          className={`${isMuted ? 'bg-red-500' : 'bg-gray-500'} hover:opacity-80 disabled:bg-gray-300 disabled:cursor-not-allowed text-white p-3 rounded-full transition-colors`}
          title={isMuted ? 'Réactiver le micro' : 'Couper le micro'}
        >
          {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        {/* Deafen */}
        <button
          onClick={toggleDeafen}
          disabled={getButtonStates().answerBtn} // Utiliser la même logique que answerBtn pour la cohérence
          className={`${isDeafened ? 'bg-red-500' : 'bg-gray-500'} hover:opacity-80 disabled:bg-gray-300 disabled:cursor-not-allowed text-white p-3 rounded-full transition-colors`}
          title={isDeafened ? 'Réactiver l\'audio' : 'Couper l\'audio'}
        >
          {isDeafened ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
      </div>

      {/* Session Info */}
      <div className="text-xs text-gray-500 text-center">
        Session: {sessionId} | Utilisateur: {userId}
      </div>
    </div>
  );
};

export default WebRTCCall;
