import React, { useState, useEffect, useRef } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX, Settings } from 'lucide-react';

interface VoIPSIPManagerProps {
  role: 'vendor' | 'client';
  sipUsername: string;
  sipPassword: string;
  sipServer: string;
  sipPort: number;
  targetUsername: string;
}

const VoIPSIPManager: React.FC<VoIPSIPManagerProps> = ({
  role,
  sipUsername,
  sipPassword,
  sipServer,
  sipPort,
  targetUsername
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isCalling, setIsCalling] = useState(false);
  const [isInCall, setIsInCall] = useState(false);
  const [micEnabled, setMicEnabled] = useState(true);
  const [speakerEnabled, setSpeakerEnabled] = useState(true);
  const [status, setStatus] = useState('Non connecté');
  const [callStatus, setCallStatus] = useState('');
  const [audioLevel, setAudioLevel] = useState(0);
  const [incomingAudioLevel, setIncomingAudioLevel] = useState(0);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [connectionError, setConnectionError] = useState<string>('');
  
  const wsRef = useRef<WebSocket | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const incomingAnalyserRef = useRef<AnalyserNode | null>(null);
  const userIdRef = useRef<string>('');
  const currentCallId = useRef<string>('');
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    connectToVoIPServer();
    return () => {
      cleanup();
    };
  }, []);

  const cleanup = () => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
    if (remoteAudioRef.current) {
      remoteAudioRef.current.pause();
      remoteAudioRef.current.srcObject = null;
    }
  };

  const connectToVoIPServer = async () => {
    try {
      setStatus('Connexion au serveur VoIP...');
      setConnectionError('');
      
      const ws = new WebSocket('ws://localhost:3010');
      wsRef.current = ws;

      ws.onopen = () => {
        setStatus('Connecté au serveur VoIP');
        setIsConnected(true);
        console.log('✅ Connecté au serveur VoIP');
        
        // Register with SIP credentials
        ws.send(JSON.stringify({
          type: 'register',
          role: role,
          username: sipUsername,
          password: sipPassword,
          server: sipServer,
          port: sipPort
        }));
      };

      ws.onmessage = async (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log(`📡 Message VoIP SIP reçu: ${message.type}`, 'Données complètes:', message);
          
          switch (message.type) {
            case 'registered':
              userIdRef.current = message.userId;
              setStatus(`Enregistré comme ${role} (${sipUsername})`);
              await setupAudio();
              break;

            case 'incoming-call':
              setCallStatus(`Appel entrant de ${message.from}...`);
              currentCallId.current = message.callId;
              if (role === 'client') {
                setTimeout(() => {
                  answerCall(message.callId);
                }, 1000);
              }
              break;

            case 'call-answered':
              setIsInCall(true);
              setIsCalling(false);
              setCallStatus('Appel connecté');
              currentCallId.current = message.callId;
              console.log('📞 Appel établi');
              setupIncomingAudio();
              break;

            case 'call-connected':
              setIsInCall(true);
              setIsCalling(false);
              setCallStatus('Appel en cours');
              currentCallId.current = message.callId;
              console.log('📞 Appel connecté');
              setupIncomingAudio();
              break;

            case 'call-ended':
              setIsInCall(false);
              setIsCalling(false);
              setCallStatus('Appel terminé');
              currentCallId.current = '';
              console.log('📞 Appel terminé');
              break;

            case 'error':
              setStatus(`Erreur: ${message.message}`);
              setConnectionError(message.message);
              console.error('❌ Erreur:', message.message);
              break;

            case 'audio-stream':
              if (message.audioData) {
                handleIncomingAudioStream(message.audioData);
              }
              break;
          }
        } catch (error) {
          console.error('❌ Erreur traitement message WebSocket:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('❌ Erreur WebSocket:', error);
        setStatus('Erreur de connexion');
        setConnectionError('Impossible de se connecter au serveur VoIP');
      };

      ws.onclose = () => {
        setIsConnected(false);
        setStatus('Déconnecté');
        console.log('🔌 Déconnecté du serveur VoIP');
      };

    } catch (error) {
      console.error('❌ Erreur connexion VoIP:', error);
      setStatus('Erreur connexion serveur');
      setConnectionError('Erreur lors de la connexion');
    }
  };

  const setupAudio = async () => {
    try {
      audioContextRef.current = new AudioContext();
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      localStreamRef.current = stream;
      
      // Analyze outgoing audio level
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      
      source.connect(analyserRef.current);
      
      // Monitor outgoing audio level
      const updateAudioLevel = () => {
        if (analyserRef.current) {
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
          setAudioLevel(average);
          requestAnimationFrame(updateAudioLevel);
        }
      };
      updateAudioLevel();
      
      console.log('✅ Audio configuré');
    } catch (error) {
      console.error('❌ Erreur configuration audio:', error);
      setConnectionError('Impossible d\'accéder au microphone');
    }
  };

  const setupIncomingAudio = () => {
    try {
      if (!audioContextRef.current) return;
      
      console.log('🎵 Configuration réception audio');
      
      // Create audio element for remote audio
      const audioElement = new Audio();
      audioElement.autoplay = true;
      audioElement.controls = false;
      document.body.appendChild(audioElement);
      remoteAudioRef.current = audioElement;
      
      // Create analyser for incoming audio
      incomingAnalyserRef.current = audioContextRef.current.createAnalyser();
      incomingAnalyserRef.current.fftSize = 256;
      
      // Monitor incoming audio level
      const updateIncomingAudioLevel = () => {
        if (incomingAnalyserRef.current && isInCall) {
          const dataArray = new Uint8Array(incomingAnalyserRef.current.frequencyBinCount);
          incomingAnalyserRef.current.getByteFrequencyData(dataArray);
          
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const average = sum / dataArray.length;
          
          setIncomingAudioLevel(average);
          requestAnimationFrame(updateIncomingAudioLevel);
        }
      };
      updateIncomingAudioLevel();
      
      console.log('✅ Réception audio configurée');
    } catch (error) {
      console.error('❌ Erreur configuration réception audio:', error);
    }
  };

  const handleIncomingAudioStream = (audioData: string) => {
    try {
      // Decode base64 audio data
      const binaryString = atob(audioData);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      // Create audio buffer and play
      if (audioContextRef.current && remoteAudioRef.current) {
        audioContextRef.current.decodeAudioData(bytes.buffer, (audioBuffer) => {
          const source = audioContextRef.current!.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(audioContextRef.current!.destination);
          source.start();
          
          // Also connect to analyser for level monitoring
          if (incomingAnalyserRef.current) {
            source.connect(incomingAnalyserRef.current);
          }
        });
      }
    } catch (error) {
      console.error('❌ Erreur traitement audio entrant:', error);
    }
  };

  const callTarget = () => {
    if (!wsRef.current || !isConnected || isInCall) return;
    
    setIsCalling(true);
    setCallStatus(`Appel de ${targetUsername}...`);
    
    wsRef.current.send(JSON.stringify({
      type: 'call',
      target: targetUsername,
      callId: `call-${Date.now()}`
    }));
  };

  const answerCall = (callId: string) => {
    if (!wsRef.current) return;
    
    wsRef.current.send(JSON.stringify({
      type: 'answer-call',
      callId: callId
    }));
    
    setCallStatus('Réponse à l\'appel...');
  };

  const hangupCall = () => {
    if (!wsRef.current || !currentCallId.current) return;
    
    wsRef.current.send(JSON.stringify({
      type: 'hangup-call',
      callId: currentCallId.current
    }));
    
    setIsInCall(false);
    setIsCalling(false);
    setCallStatus('Appel terminé');
  };

  const toggleMic = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !micEnabled;
        setMicEnabled(!micEnabled);
      }
    }
  };

  const testSpeakers = async () => {
    try {
      const audioContext = new AudioContext();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.start();
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      
      setTimeout(() => {
        oscillator.stop();
        audioContext.close();
      }, 1000);
      
      setStatus('Test haut-parleurs effectué');
    } catch (error) {
      console.error('❌ Erreur test haut-parleurs:', error);
      setConnectionError('Impossible de tester les haut-parleurs');
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      {/* Status */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-400">Statut SIP</span>
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
        </div>
        <p className="text-white font-medium">{status}</p>
        {connectionError && (
          <p className="text-red-400 text-sm mt-1">{connectionError}</p>
        )}
      </div>

      {/* Controls */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <button
          onClick={callTarget}
          disabled={!isConnected || isCalling || isInCall}
          className="flex flex-col items-center p-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
        >
          <Phone className="w-6 h-6 mb-1" />
          <span className="text-xs">Appeler {targetUsername}</span>
        </button>

        <button
          onClick={hangupCall}
          disabled={!isInCall}
          className="flex flex-col items-center p-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
        >
          <PhoneOff className="w-6 h-6 mb-1" />
          <span className="text-xs">Raccrocher</span>
        </button>

        <button
          onClick={toggleMic}
          className={`flex flex-col items-center p-3 rounded-lg transition-colors ${
            micEnabled ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-600 text-gray-300'
          }`}
        >
          {micEnabled ? <Mic className="w-6 h-6 mb-1" /> : <MicOff className="w-6 h-6 mb-1" />}
          <span className="text-xs">Micro</span>
        </button>

        <button
          onClick={testSpeakers}
          className="flex flex-col items-center p-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
        >
          <Volume2 className="w-6 h-6 mb-1" />
          <span className="text-xs">Test HP</span>
        </button>
      </div>

      {/* Audio Levels */}
      {isInCall && (
        <div className="space-y-4 mb-6">
          <div className="bg-blue-900 bg-opacity-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-blue-300">Niveau Audio Sortant (Micro)</span>
              <span className="text-sm font-semibold text-blue-100">{Math.round(audioLevel)}%</span>
            </div>
            <div className="w-full bg-blue-800 rounded-full h-2">
              <div 
                className="bg-blue-400 h-2 rounded-full transition-all duration-100"
                style={{ width: `${Math.min(audioLevel, 100)}%` }}
              ></div>
            </div>
          </div>
          
          <div className="bg-green-900 bg-opacity-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-green-300">Niveau Audio Entrant (Haut-parleur)</span>
              <span className="text-sm font-semibold text-green-100">{Math.round(incomingAudioLevel)}%</span>
            </div>
            <div className="w-full bg-green-800 rounded-full h-2">
              <div 
                className="bg-green-400 h-2 rounded-full transition-all duration-100"
                style={{ width: `${Math.min(incomingAudioLevel, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* Call Status */}
      {callStatus && (
        <div className="bg-yellow-900 bg-opacity-20 border border-yellow-700 rounded-lg p-4 text-center mb-4">
          <p className="text-yellow-300 font-medium">{callStatus}</p>
        </div>
      )}

      {/* Connection Info */}
      <div className="bg-gray-700 rounded-lg p-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-400">Compte:</span>
            <span className="text-white ml-2">{sipUsername}</span>
          </div>
          <div>
            <span className="text-gray-400">Rôle:</span>
            <span className="text-white ml-2">{role === 'vendor' ? 'Vendeur' : 'Client'}</span>
          </div>
          <div>
            <span className="text-gray-400">Serveur:</span>
            <span className="text-white ml-2">{sipServer}:{sipPort}</span>
          </div>
          <div>
            <span className="text-gray-400">Cible:</span>
            <span className="text-white ml-2">{targetUsername}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoIPSIPManager;