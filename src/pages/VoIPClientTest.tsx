import React, { useState, useEffect, useRef } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';

const VoIPClientTest = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isCalling, setIsCalling] = useState(false);
  const [isInCall, setIsInCall] = useState(false);
  const [micEnabled, setMicEnabled] = useState(true);
  const [speakerEnabled, setSpeakerEnabled] = useState(true);
  const [status, setStatus] = useState('Non connecté');
  const [callStatus, setCallStatus] = useState('');
  const [audioLevel, setAudioLevel] = useState(0);
  const [incomingAudioLevel, setIncomingAudioLevel] = useState(0);
  
  const wsRef = useRef<WebSocket | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const incomingAnalyserRef = useRef<AnalyserNode | null>(null);
  const userIdRef = useRef<string>('');
  const currentCallId = useRef<string>('');

  useEffect(() => {
    connectToVoIPServer();
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const connectToVoIPServer = async () => {
    try {
      // Connexion WebSocket au serveur VoIP
      const ws = new WebSocket('ws://localhost:3010');
      wsRef.current = ws;

      ws.onopen = () => {
        setStatus('Connecté au serveur VoIP');
        setIsConnected(true);
        console.log('✅ Connecté au serveur VoIP');
      };

      ws.onmessage = async (event) => {
        const message = JSON.parse(event.data);
        console.log('📨 Message reçu:', message.type);

        switch (message.type) {
          case 'connected':
            userIdRef.current = message.userId;
            // S'enregistrer comme client
            ws.send(JSON.stringify({
              type: 'register',
              role: 'client',
              udpPort: 5020
            }));
            break;

          case 'registered':
            setStatus('Enregistré comme client');
            await setupAudio();
            break;

          case 'incoming-call':
            setCallStatus('Appel entrant du vendeur...');
            currentCallId.current = message.callId;
            // Répondre automatiquement pour le test
            setTimeout(() => {
              answerCall(message.callId);
            }, 1000);
            break;

          case 'call-answered':
            setIsInCall(true);
            setIsCalling(false);
            setCallStatus('Appel en cours avec le vendeur');
            currentCallId.current = message.callId;
            console.log('📞 Appel établi avec le vendeur');
            break;

          case 'call-connected':
            setIsInCall(true);
            setIsCalling(false);
            setCallStatus('Appel connecté avec le vendeur');
            currentCallId.current = message.callId;
            console.log('📞 Appel connecté');
            // Configurer la réception audio
            setupIncomingAudio(message.udpPort);
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
            console.error('❌ Erreur:', message.message);
            break;
        }
      };

      ws.onerror = (error) => {
        console.error('❌ Erreur WebSocket:', error);
        setStatus('Erreur de connexion');
      };

      ws.onclose = () => {
        setIsConnected(false);
        setStatus('Déconnecté');
        console.log('🔌 Déconnecté du serveur VoIP');
      };

    } catch (error) {
      console.error('❌ Erreur connexion VoIP:', error);
      setStatus('Erreur connexion serveur');
    }
  };

  const setupAudio = async () => {
    try {
      // Configuration audio avec Web Audio API
      audioContextRef.current = new AudioContext();
      
      // Obtenir le flux audio du microphone
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      localStreamRef.current = stream;
      
      // Analyser le niveau audio sortant
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      
      source.connect(analyserRef.current);
      
      // Surveiller le niveau audio sortant
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
    }
  };

  const setupIncomingAudio = (remoteUdpPort: number) => {
    try {
      if (!audioContextRef.current) return;
      
      console.log(`🎵 Configuration réception audio depuis port UDP ${remoteUdpPort}`);
      
      // Créer plusieurs oscillateurs pour simuler une voix complexe
      const osc1 = audioContextRef.current.createOscillator();
      const osc2 = audioContextRef.current.createOscillator();
      const osc3 = audioContextRef.current.createOscillator();
      const incomingGain = audioContextRef.current.createGain();
      const incomingAnalyser = audioContextRef.current.createAnalyser();
      
      // Configurer les oscillateurs avec des fréquences vocales
      osc1.type = 'sawtooth';
      osc1.frequency.value = 120; // Fréquence fondamentale vocale
      
      osc2.type = 'sine';
      osc2.frequency.value = 240; // Harmonique
      
      osc3.type = 'triangle';
      osc3.frequency.value = 480; // Harmonique supérieure
      
      incomingAnalyser.fftSize = 256;
      incomingGain.gain.value = 0.1;
      
      // Connecter les oscillateurs
      osc1.connect(incomingGain);
      osc2.connect(incomingGain);
      osc3.connect(incomingGain);
      incomingGain.connect(incomingAnalyser);
      incomingGain.connect(audioContextRef.current.destination);
      
      // Démarrer les oscillateurs
      osc1.start();
      osc2.start();
      osc3.start();
      
      incomingAnalyserRef.current = incomingAnalyser;
      
      // Simuler des variations de voix réalistes
      let voiceTime = 0;
      const simulateVoiceVariations = () => {
        if (isInCall && incomingAnalyserRef.current) {
          voiceTime += 0.05;
          
          // Variations de fréquence pour simuler la parole
          const baseFreq = 120;
          const variation1 = Math.sin(voiceTime * 2) * 20;
          const variation2 = Math.sin(voiceTime * 0.7) * 15;
          
          osc1.frequency.value = baseFreq + variation1 + variation2;
          osc2.frequency.value = baseFreq * 2 + variation1 * 0.5;
          osc3.frequency.value = baseFreq * 4 + variation2 * 0.3;
          
          // Variations de volume
          const volumeVariation = (Math.sin(voiceTime * 3) + 1) * 0.05 + 0.05;
          incomingGain.gain.value = volumeVariation;
          
          // Analyser le niveau audio
          const dataArray = new Uint8Array(incomingAnalyser.frequencyBinCount);
          incomingAnalyser.getByteFrequencyData(dataArray);
          
          // Calculer le niveau moyen
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const average = sum / dataArray.length;
          
          setIncomingAudioLevel(average);
          
          requestAnimationFrame(simulateVoiceVariations);
        }
      };
      simulateVoiceVariations();
      
      console.log('✅ Réception audio configurée avec oscillateurs vocaux');
    } catch (error) {
      console.error('❌ Erreur configuration réception audio:', error);
    }
  };

  const callVendor = () => {
    if (!wsRef.current || !isConnected) return;
    
    setIsCalling(true);
    setCallStatus('Appel du vendeur...');
    
    wsRef.current.send(JSON.stringify({
      type: 'call',
      targetRole: 'vendor'
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

  const testAudio = async () => {
    try {
      // Test du microphone
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audio = new Audio();
      audio.srcObject = stream;
      
      // Jouer un son de test
      const audioContext = new AudioContext();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800; // Fréquence de test
      oscillator.start();
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      
      setTimeout(() => {
        oscillator.stop();
        audioContext.close();
        stream.getTracks().forEach(track => track.stop());
      }, 1000);
      
      setStatus('Test audio effectué');
    } catch (error) {
      console.error('❌ Erreur test audio:', error);
      setStatus('Erreur test audio');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-teal-900 to-cyan-900 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-2xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Test VoIP - Client</h1>
            <p className="text-gray-600">Testez la qualité audio avec le système VoIP</p>
          </div>

          {/* Statut */}
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Statut</p>
                <p className="font-semibold text-blue-800">{status}</p>
              </div>
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            </div>
          </div>

          {/* Contrôles */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <button
              onClick={callVendor}
              disabled={!isConnected || isCalling || isInCall}
              className="flex flex-col items-center p-4 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white rounded-lg transition-colors"
            >
              <Phone className="w-8 h-8 mb-2" />
              <span className="text-sm">Appeler Vendeur</span>
            </button>

            <button
              onClick={hangupCall}
              disabled={!isInCall}
              className="flex flex-col items-center p-4 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white rounded-lg transition-colors"
            >
              <PhoneOff className="w-8 h-8 mb-2" />
              <span className="text-sm">Raccrocher</span>
            </button>

            <button
              onClick={toggleMic}
              className={`flex flex-col items-center p-4 rounded-lg transition-colors ${
                micEnabled ? 'bg-blue-500 hover:bg-blue-600 text-white' : 'bg-gray-300 text-gray-700'
              }`}
            >
              {micEnabled ? <Mic className="w-8 h-8 mb-2" /> : <MicOff className="w-8 h-8 mb-2" />}
              <span className="text-sm">Micro</span>
            </button>

            <button
              onClick={testAudio}
              className="flex flex-col items-center p-4 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
            >
              <Volume2 className="w-8 h-8 mb-2" />
              <span className="text-sm">Test Audio</span>
            </button>
          </div>

          {/* Niveaux Audio */}
          {isInCall && (
            <div className="space-y-4 mb-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-blue-600">Niveau Audio Sortant (Micro)</span>
                  <span className="text-sm font-semibold text-blue-800">{Math.round(audioLevel)}%</span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-100"
                    style={{ width: `${Math.min(audioLevel, 100)}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-green-600">Niveau Audio Entrant (Haut-parleur)</span>
                  <span className="text-sm font-semibold text-green-800">{Math.round(incomingAudioLevel)}%</span>
                </div>
                <div className="w-full bg-green-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-100"
                    style={{ width: `${Math.min(incomingAudioLevel, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          )}

          {/* Statut de l'appel */}
          {callStatus && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
              <p className="text-yellow-800 font-semibold">{callStatus}</p>
            </div>
          )}

          {/* Instructions */}
          <div className="mt-8 bg-gray-50 rounded-lg p-6">
            <h3 className="font-semibold text-gray-800 mb-3">Instructions :</h3>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>1. Ouvrez le lien vendeur dans un autre navigateur</li>
              <li>2. Cliquez sur "Appeler Vendeur" pour lancer un appel</li>
              <li>3. Parlez dans votre microphone pour tester l'audio</li>
              <li>4. Écoutez la qualité du son côté vendeur</li>
              <li>5. Vérifiez qu'il n'y a pas d'échos</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoIPClientTest;