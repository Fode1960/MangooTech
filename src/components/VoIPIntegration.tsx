import React, { useState, useEffect, useRef } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX, Settings, Transfer, Voicemail, User, Clock, AlertCircle } from 'lucide-react';
import { getWsUrl } from '../utils/realtimeUrls';

interface VoIPCredentials {
  username: string;
  password: string;
  domain: string;
  server: string;
  port: number;
}

interface CallSession {
  id: string;
  caller: string;
  callee: string;
  status: 'idle' | 'calling' | 'connected' | 'incoming' | 'transferring';
  startTime: Date | null;
  duration: number;
  isMuted: boolean;
  isOnHold: boolean;
  recordingActive: boolean;
}

interface VoicemailMessage {
  id: string;
  caller: string;
  timestamp: Date;
  duration: number;
  isRead: boolean;
}

interface CallTransfer {
  target: string;
  status: 'idle' | 'searching' | 'ringing' | 'connected';
}

const VoIPIntegration: React.FC = () => {
  const [credentials, setCredentials] = useState<VoIPCredentials>({
    username: '',
    password: '',
    domain: 'mangootech.local',
    server: '194.163.190.74',
    port: 5060
  });
  
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [callSession, setCallSession] = useState<CallSession>({
    id: '',
    caller: '',
    callee: '',
    status: 'idle',
    startTime: null,
    duration: 0,
    isMuted: false,
    isOnHold: false,
    recordingActive: false
  });
  
  const [voicemailMessages, setVoicemailMessages] = useState<VoicemailMessage[]>([]);
  const [callTransfer, setCallTransfer] = useState<CallTransfer>({
    target: '',
    status: 'idle'
  });
  
  const [audioLevel, setAudioLevel] = useState({ local: 0, remote: 0 });
  const [showSettings, setShowSettings] = useState(false);
  const [showVoicemail, setShowVoicemail] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  
  const localAudioRef = useRef<HTMLAudioElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const wsConnectionRef = useRef<WebSocket | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Configuration WebRTC
  const iceServers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ];

  // Effet pour la connexion WebSocket
  useEffect(() => {
    if (credentials.username && credentials.password) {
      connectToVoIPServer();
    }
    
    return () => {
      disconnectFromVoIPServer();
      cleanupAudio();
    };
  }, [credentials]);

  // Effet pour le minuteur d'appel
  useEffect(() => {
    if (callSession.status === 'connected' && callSession.startTime) {
      timerIntervalRef.current = setInterval(() => {
        const duration = Math.floor((Date.now() - callSession.startTime!.getTime()) / 1000);
        setCallSession(prev => ({ ...prev, duration }));
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }
    
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [callSession.status, callSession.startTime]);

  // Connexion au serveur VoIP
  const connectToVoIPServer = async () => {
    try {
      setConnectionStatus('connecting');
      
      // Connexion WebSocket au serveur WebRTC-SIP Gateway
      const wsUrl = getWsUrl(8080);
      wsConnectionRef.current = new WebSocket(wsUrl);
      
      wsConnectionRef.current.onopen = () => {
        console.log('✅ Connecté au serveur VoIP');
        setConnectionStatus('connected');
        setIsConnected(true);
        
        // Enregistrement SIP
        registerSIPUser();
      };
      
      wsConnectionRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleVoIPMessage(data);
        } catch (error) {
          console.error('Erreur de parsing du message VoIP:', error);
        }
      };
      
      wsConnectionRef.current.onclose = () => {
        console.log('🔌 Déconnecté du serveur VoIP');
        setConnectionStatus('disconnected');
        setIsConnected(false);
      };
      
      wsConnectionRef.current.onerror = (error) => {
        console.error('❌ Erreur de connexion VoIP:', error);
        setConnectionStatus('error');
        setIsConnected(false);
      };
      
    } catch (error) {
      console.error('❌ Erreur de connexion au serveur VoIP:', error);
      setConnectionStatus('error');
      setIsConnected(false);
    }
  };

  // Déconnexion du serveur VoIP
  const disconnectFromVoIPServer = () => {
    if (wsConnectionRef.current) {
      wsConnectionRef.current.close();
      wsConnectionRef.current = null;
    }
  };

  // Enregistrement SIP
  const registerSIPUser = () => {
    if (wsConnectionRef.current && wsConnectionRef.current.readyState === WebSocket.OPEN) {
      const registerMessage = {
        type: 'register',
        userId: credentials.username,
        sipUsername: credentials.username,
        sipPassword: credentials.password,
        sipDomain: credentials.domain,
        sipServer: credentials.server,
        sipPort: credentials.port
      };
      
      wsConnectionRef.current.send(JSON.stringify(registerMessage));
      console.log(`👤 Enregistrement SIP: ${credentials.username}`);
    }
  };

  // Gestion des messages VoIP
  const handleVoIPMessage = (data: any) => {
    switch (data.type) {
      case 'registered':
        console.log('✅ Enregistrement SIP réussi');
        break;
        
      case 'registration-failed':
        console.error('❌ Échec de l\'enregistrement SIP:', data.error);
        break;
        
      case 'incoming-call':
        handleIncomingCall(data);
        break;
        
      case 'call-answered':
        handleCallAnswered(data);
        break;
        
      case 'call-ended':
        handleCallEnded(data);
        break;
        
      case 'call-error':
        handleCallError(data);
        break;
        
      case 'transfer-complete':
        handleTransferComplete(data);
        break;
        
      case 'voicemail-received':
        handleVoicemailReceived(data);
        break;
        
      default:
        console.log('Message VoIP non géré:', data.type);
    }
  };

  // Gestion des appels entrants
  const handleIncomingCall = async (data: any) => {
    console.log('📞 Appel entrant de:', data.caller);
    
    setCallSession({
      id: data.callId,
      caller: data.caller,
      callee: credentials.username,
      status: 'incoming',
      startTime: null,
      duration: 0,
      isMuted: false,
      isOnHold: false,
      recordingActive: false
    });
    
    // Demander l'accès au microphone
    try {
      await setupAudio();
    } catch (error) {
      console.error('❌ Erreur de configuration audio:', error);
    }
  };

  // Réponse à un appel
  const handleCallAnswered = (data: any) => {
    console.log('✅ Appel répondu');
    
    setCallSession(prev => ({
      ...prev,
      status: 'connected',
      startTime: new Date()
    }));
    
    // Démarrer l'analyse audio
    startAudioAnalysis();
  };

  // Fin d'appel
  const handleCallEnded = (data: any) => {
    console.log('🔚 Appel terminé');
    
    // Si l'appel a duré plus de 5 secondes et a un enregistrement, créer un message vocal
    if (callSession.recordingActive && callSession.duration > 5) {
      const voicemail: VoicemailMessage = {
        id: `vm-${Date.now()}`,
        caller: callSession.caller,
        timestamp: new Date(),
        duration: callSession.duration,
        isRead: false
      };
      
      setVoicemailMessages(prev => [voicemail, ...prev]);
    }
    
    resetCallSession();
    cleanupAudio();
  };

  // Erreur d'appel
  const handleCallError = (data: any) => {
    console.error('❌ Erreur d\'appel:', data.error);
    resetCallSession();
    cleanupAudio();
  };

  // Transfert d'appel complet
  const handleTransferComplete = (data: any) => {
    console.log('🔄 Transfert d\'appel complété vers:', data.target);
    setCallTransfer({ target: '', status: 'idle' });
    
    // Mettre à jour la session d'appel avec le nouvel interlocuteur
    setCallSession(prev => ({
      ...prev,
      callee: data.target,
      status: 'connected'
    }));
  };

  // Réception d'un message vocal
  const handleVoicemailReceived = (data: any) => {
    const voicemail: VoicemailMessage = {
      id: data.messageId,
      caller: data.caller,
      timestamp: new Date(data.timestamp),
      duration: data.duration,
      isRead: false
    };
    
    setVoicemailMessages(prev => [voicemail, ...prev]);
  };

  // Configuration audio
  const setupAudio = async () => {
    try {
      // Demander l'accès au microphone
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      localStreamRef.current = stream;
      
      // Créer le contexte audio pour l'analyse
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      
      analyserRef.current.fftSize = 512;
      
      return stream;
      
    } catch (error) {
      console.error('❌ Erreur de configuration audio:', error);
      throw error;
    }
  };

  // Analyse audio en temps réel
  const startAudioAnalysis = () => {
    if (!analyserRef.current) return;
    
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const updateAudioLevel = () => {
      if (!analyserRef.current) return;
      
      analyserRef.current.getByteFrequencyData(dataArray);
      
      // Calculer le niveau RMS
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i] * dataArray[i];
      }
      const rms = Math.sqrt(sum / dataArray.length);
      const localLevel = Math.min(100, (rms / 128) * 100);
      
      setAudioLevel(prev => ({
        ...prev,
        local: localLevel
      }));
      
      // Simuler l'audio distant pour la démo
      const remoteLevel = Math.random() * 30 + 20;
      setAudioLevel(prev => ({
        ...prev,
        remote: remoteLevel
      }));
      
      animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
    };
    
    updateAudioLevel();
  };

  // Nettoyer l'audio
  const cleanupAudio = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    analyserRef.current = null;
    setAudioLevel({ local: 0, remote: 0 });
  };

  // Réinitialiser la session d'appel
  const resetCallSession = () => {
    setCallSession({
      id: '',
      caller: '',
      callee: '',
      status: 'idle',
      startTime: null,
      duration: 0,
      isMuted: false,
      isOnHold: false,
      recordingActive: false
    });
  };

  // Répondre à un appel
  const answerCall = async () => {
    if (!wsConnectionRef.current || callSession.status !== 'incoming') return;
    
    try {
      await setupAudio();
      
      const answerMessage = {
        type: 'answer',
        callId: callSession.id,
        callee: credentials.username
      };
      
      wsConnectionRef.current.send(JSON.stringify(answerMessage));
      
      setCallSession(prev => ({
        ...prev,
        status: 'connected',
        startTime: new Date()
      }));
      
      startAudioAnalysis();
      
    } catch (error) {
      console.error('❌ Erreur lors de la réponse à l\'appel:', error);
    }
  };

  // Raccrocher
  const hangUp = () => {
    if (!wsConnectionRef.current || callSession.status === 'idle') return;
    
    const hangupMessage = {
      type: 'hangup',
      callId: callSession.id
    };
    
    wsConnectionRef.current.send(JSON.stringify(hangupMessage));
    
    resetCallSession();
    cleanupAudio();
  };

  // Basculer le mute
  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setCallSession(prev => ({
          ...prev,
          isMuted: !audioTrack.enabled
        }));
      }
    }
  };

  // Mettre en attente
  const toggleHold = () => {
    setCallSession(prev => ({
      ...prev,
      isOnHold: !prev.isOnHold
    }));
    
    // Envoyer message de mise en attente
    if (wsConnectionRef.current) {
      const holdMessage = {
        type: 'hold',
        callId: callSession.id,
        hold: !callSession.isOnHold
      };
      
      wsConnectionRef.current.send(JSON.stringify(holdMessage));
    }
  };

  // Démarrer/arrêter l'enregistrement
  const toggleRecording = () => {
    setCallSession(prev => ({
      ...prev,
      recordingActive: !prev.recordingActive
    }));
    
    // Envoyer message d'enregistrement
    if (wsConnectionRef.current) {
      const recordingMessage = {
        type: 'recording',
        callId: callSession.id,
        recording: !callSession.recordingActive
      };
      
      wsConnectionRef.current.send(JSON.stringify(recordingMessage));
    }
  };

  // Transférer l'appel
  const transferCall = (target: string) => {
    if (!wsConnectionRef.current || !target) return;
    
    setCallTransfer({ target, status: 'searching' });
    
    const transferMessage = {
      type: 'transfer',
      callId: callSession.id,
      target: target
    };
    
    wsConnectionRef.current.send(JSON.stringify(transferMessage));
  };

  // Envoyer vers la messagerie vocale
  const sendToVoicemail = () => {
    if (!wsConnectionRef.current) return;
    
    const voicemailMessage = {
      type: 'voicemail',
      callId: callSession.id
    };
    
    wsConnectionRef.current.send(JSON.stringify(voicemailMessage));
    
    // Mettre fin à l'appel actuel
    resetCallSession();
  };

  // Formatage du temps
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* En-tête */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-r from-orange-500 to-yellow-500 p-3 rounded-full">
                <Phone className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Système VoIP MangooTech</h1>
                <p className="text-gray-600">Intégration FreePBX/Asterisk</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${
                connectionStatus === 'connected' ? 'bg-green-500' :
                connectionStatus === 'connecting' ? 'bg-yellow-500' :
                connectionStatus === 'error' ? 'bg-red-500' : 'bg-gray-400'
              }`}></div>
              <span className="text-sm text-gray-600">
                {connectionStatus === 'connected' ? 'Connecté' :
                 connectionStatus === 'connecting' ? 'Connexion...' :
                 connectionStatus === 'error' ? 'Erreur' : 'Déconnecté'}
              </span>
            </div>
          </div>
        </div>

        {/* Configuration */}
        {!isConnected && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Configuration VoIP</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nom d'utilisateur SIP</label>
                <input
                  type="text"
                  value={credentials.username}
                  onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Ex: vendeur001"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mot de passe</label>
                <input
                  type="password"
                  value={credentials.password}
                  onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Votre mot de passe SIP"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Domaine</label>
                <input
                  type="text"
                  value={credentials.domain}
                  onChange={(e) => setCredentials(prev => ({ ...prev, domain: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Serveur</label>
                <input
                  type="text"
                  value={credentials.server}
                  onChange={(e) => setCredentials(prev => ({ ...prev, server: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="mt-4">
              <button
                onClick={connectToVoIPServer}
                disabled={!credentials.username || !credentials.password}
                className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white px-6 py-2 rounded-lg font-medium hover:from-orange-600 hover:to-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                Se connecter
              </button>
            </div>
          </div>
        )}

        {/* Interface d'appel */}
        {isConnected && (
          <div className="space-y-6">
            {/* Panneau de contrôle d'appel */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="text-center">
                {/* Statut de l'appel */}
                <div className="mb-6">
                  {callSession.status === 'idle' && (
                    <div className="text-gray-600">
                      <Phone className="w-16 h-16 mx-auto mb-2 text-gray-400" />
                      <p className="text-lg">Prêt pour les appels</p>
                    </div>
                  )}
                  
                  {callSession.status === 'incoming' && (
                    <div className="text-blue-600">
                      <Phone className="w-16 h-16 mx-auto mb-2 animate-pulse" />
                      <p className="text-lg font-semibold">Appel entrant</p>
                      <p className="text-sm">{callSession.caller}</p>
                    </div>
                  )}
                  
                  {callSession.status === 'calling' && (
                    <div className="text-yellow-600">
                      <Phone className="w-16 h-16 mx-auto mb-2 animate-pulse" />
                      <p className="text-lg font-semibold">Appel en cours...</p>
                      <p className="text-sm">{callSession.callee}</p>
                    </div>
                  )}
                  
                  {callSession.status === 'connected' && (
                    <div className="text-green-600">
                      <Phone className="w-16 h-16 mx-auto mb-2" />
                      <p className="text-lg font-semibold">Appel connecté</p>
                      <p className="text-sm">{callSession.caller || callSession.callee}</p>
                      <p className="text-2xl font-mono mt-2">{formatTime(callSession.duration)}</p>
                    </div>
                  )}
                </div>

                {/* Visualiseur audio */}
                {(callSession.status === 'connected' || callSession.status === 'calling') && (
                  <div className="mb-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600 mb-2">Audio Local</p>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div 
                            className="bg-gradient-to-r from-green-400 to-green-600 h-3 rounded-full transition-all duration-100"
                            style={{ width: `${audioLevel.local}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{Math.round(audioLevel.local)}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-2">Audio Distant</p>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div 
                            className="bg-gradient-to-r from-blue-400 to-blue-600 h-3 rounded-full transition-all duration-100"
                            style={{ width: `${audioLevel.remote}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{Math.round(audioLevel.remote)}%</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Boutons de contrôle */}
                <div className="flex justify-center space-x-4">
                  {callSession.status === 'incoming' && (
                    <>
                      <button
                        onClick={answerCall}
                        className="bg-green-500 hover:bg-green-600 text-white p-4 rounded-full transition-colors duration-200"
                      >
                        <Phone className="w-6 h-6" />
                      </button>
                      <button
                        onClick={hangUp}
                        className="bg-red-500 hover:bg-red-600 text-white p-4 rounded-full transition-colors duration-200"
                      >
                        <PhoneOff className="w-6 h-6" />
                      </button>
                    </>
                  )}
                  
                  {callSession.status === 'connected' && (
                    <>
                      <button
                        onClick={toggleMute}
                        className={`p-3 rounded-full transition-colors duration-200 ${
                          callSession.isMuted 
                            ? 'bg-red-500 hover:bg-red-600 text-white' 
                            : 'bg-gray-500 hover:bg-gray-600 text-white'
                        }`}
                      >
                        {callSession.isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                      </button>
                      
                      <button
                        onClick={toggleHold}
                        className={`p-3 rounded-full transition-colors duration-200 ${
                          callSession.isOnHold 
                            ? 'bg-yellow-500 hover:bg-yellow-600 text-white' 
                            : 'bg-gray-500 hover:bg-gray-600 text-white'
                        }`}
                      >
                        <Clock className="w-5 h-5" />
                      </button>
                      
                      <button
                        onClick={toggleRecording}
                        className={`p-3 rounded-full transition-colors duration-200 ${
                          callSession.recordingActive 
                            ? 'bg-red-500 hover:bg-red-600 text-white' 
                            : 'bg-gray-500 hover:bg-gray-600 text-white'
                        }`}
                      >
                        <Volume2 className="w-5 h-5" />
                      </button>
                      
                      <button
                        onClick={() => setShowTransfer(true)}
                        className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-full transition-colors duration-200"
                      >
                        <Transfer className="w-5 h-5" />
                      </button>
                      
                      <button
                        onClick={hangUp}
                        className="bg-red-500 hover:bg-red-600 text-white p-3 rounded-full transition-colors duration-200"
                      >
                        <PhoneOff className="w-5 h-5" />
                      </button>
                    </>
                  )}
                  
                  {(callSession.status === 'calling' || callSession.status === 'connected') && (
                    <button
                      onClick={hangUp}
                      className="bg-red-500 hover:bg-red-600 text-white p-4 rounded-full transition-colors duration-200"
                    >
                      <PhoneOff className="w-6 h-6" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Messagerie vocale */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Messagerie Vocale</h3>
                <button
                  onClick={() => setShowVoicemail(!showVoicemail)}
                  className="text-orange-500 hover:text-orange-600"
                >
                  <Voicemail className="w-5 h-5" />
                </button>
              </div>
              
              {voicemailMessages.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Aucun message vocal</p>
              ) : (
                <div className="space-y-3">
                  {voicemailMessages.map((message) => (
                    <div key={message.id} className={`p-3 rounded-lg border ${
                      message.isRead ? 'bg-gray-50 border-gray-200' : 'bg-blue-50 border-blue-200'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4 text-gray-600" />
                          <span className="font-medium">{message.caller}</span>
                        </div>
                        <span className="text-sm text-gray-500">{formatTime(message.duration)}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {message.timestamp.toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Paramètres */}
            {showSettings && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Paramètres VoIP</h3>
                  <button
                    onClick={() => setShowSettings(false)}
                    className="text-gray-500 hover:text-gray-600"
                  >
                    ×
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Qualité audio</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent">
                      <option>Haute qualité (HD)</option>
                      <option>Qualité standard</option>
                      <option>Économie de bande passante</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Codecs audio</label>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-2" defaultChecked />
                        G.711 (PCMU)
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-2" defaultChecked />
                        G.729
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-2" />
                        Opus
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Transfert d'appel */}
            {showTransfer && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Transférer l'appel</h3>
                  <button
                    onClick={() => setShowTransfer(false)}
                    className="text-gray-500 hover:text-gray-600"
                  >
                    ×
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Destinataire</label>
                    <input
                      type="text"
                      value={callTransfer.target}
                      onChange={(e) => setCallTransfer(prev => ({ ...prev, target: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="Nom d'utilisateur ou numéro"
                    />
                  </div>
                  
                  <div className="flex space-x-3">
                    <button
                      onClick={() => transferCall(callTransfer.target)}
                      disabled={!callTransfer.target}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    >
                      Transférer
                    </button>
                    <button
                      onClick={() => setShowTransfer(false)}
                      className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Bouton de paramètres */}
        {isConnected && (
          <div className="fixed bottom-6 right-6">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white p-3 rounded-full shadow-lg hover:from-orange-600 hover:to-yellow-600 transition-all duration-200"
            >
              <Settings className="w-6 h-6" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VoIPIntegration;
