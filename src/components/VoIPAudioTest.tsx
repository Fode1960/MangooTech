import React, { useState, useRef, useEffect } from 'react';

// Test VoIP simplifié pour vérifier l'audio dans le casque
const VoIPAudioTest: React.FC = () => {
  const [isCalling, setIsCalling] = useState(false);
  const [isInCall, setIsInCall] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [remoteAudioLevel, setRemoteAudioLevel] = useState(0);
  const [status, setStatus] = useState('Prêt pour test');
  
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);

  // Configuration WebRTC simplifiée
  const iceServers = [
    { urls: 'stun:stun.l.google.com:19302' }
  ];

  // Démarrer le test audio
  const startTest = async () => {
    try {
      setStatus('Activation microphone...');
      
      // Obtenir le flux audio
      const stream = await navigator.mediaDevices.getUserMedia({
        video: false,
        audio: {
          echoCancellation: false, // Désactivé pour test
          noiseSuppression: false, // Désactivé pour test
          autoGainControl: false, // Désactivé pour test
          sampleRate: 16000,
          channelCount: 1
        }
      });
      
      localStreamRef.current = stream;
      setStatus('Microphone activé');
      
      // Créer l'AudioContext pour l'analyse
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Analyser le niveau audio local
      startLocalAudioAnalysis(stream);
      
      // Créer une boucle audio directe simple
      createSimpleAudioLoop(stream);
      
      setIsCalling(true);
      setStatus('Boucle audio créée - parlez !');
      
    } catch (error) {
      console.error('❌ Erreur démarrage test:', error);
      setStatus(`Erreur: ${error}`);
    }
  };

  // Créer une boucle audio simple
  const createSimpleAudioLoop = (stream: MediaStream) => {
    console.log('🔄 Création boucle audio ultra-simple...');
    
    // Créer un élément audio de sortie
    const audioElement = new Audio();
    audioElement.autoplay = true;
    audioElement.muted = false;
    audioElement.volume = 1.0;
    audioElement.controls = true;
    audioElement.playsInline = true;
    
    // Positionner l'élément
    audioElement.style.position = 'fixed';
    audioElement.style.bottom = '10px';
    audioElement.style.right = '10px';
    audioElement.style.width = '200px';
    audioElement.style.height = '40px';
    audioElement.style.zIndex = '1000';
    
    document.body.appendChild(audioElement);
    remoteAudioRef.current = audioElement;
    
    // Connecter directement le microphone à l'élément audio
    audioElement.srcObject = stream;
    
    // Forcer vers le casque
    forceAudioToOutput(audioElement);
    
    // Jouer l'audio
    audioElement.play().then(() => {
      console.log('✅ Boucle audio ultra-simple active !');
      setStatus('🎧 Microphone direct vers casque - parlez !');
      
      // Analyser le niveau audio distant (sortie)
      startRemoteAudioAnalysis(stream);
    }).catch(error => {
      console.error('❌ Erreur boucle audio:', error);
      setStatus('❌ Erreur boucle audio');
    });
  };

  // Analyser le niveau audio local
  const startLocalAudioAnalysis = (stream: MediaStream) => {
    if (!audioContextRef.current) return;
    
    const source = audioContextRef.current.createMediaStreamSource(stream);
    const analyser = audioContextRef.current.createAnalyser();
    analyser.fftSize = 256;
    
    source.connect(analyser);
    
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    analyserRef.current = analyser;
    dataArrayRef.current = dataArray;
    
    const updateLevel = () => {
      if (!analyser || !dataArray) return;
      
      analyser.getByteFrequencyData(dataArray);
      
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const average = sum / dataArray.length;
      const level = Math.round((average / 255) * 100);
      
      setAudioLevel(level);
      
      // Continuer l'analyse même sans appel (pour le test local)
      requestAnimationFrame(updateLevel);
    };
    
    updateLevel();
  };

  // Créer la connexion WebRTC
  const createPeerConnection = async (stream: MediaStream) => {
    const pc = new RTCPeerConnection({ iceServers });
    peerConnectionRef.current = pc;
    
    // Créer une deuxième connexion pour la boucle locale
    const pc2 = new RTCPeerConnection({ iceServers });
    
    // Quand pc reçoit un flux, l'envoyer à pc2
    pc.ontrack = (event) => {
      console.log('🎵 Flux reçu sur pc1:', event);
      handleRemoteStream(event.streams[0]);
    };
    
    // Quand pc2 reçoit un flux, l'envoyer à pc1
    pc2.ontrack = (event) => {
      console.log('🎵 Flux reçu sur pc2:', event);
      handleRemoteStream(event.streams[0]);
    };
    
    // Connecter les deux connexions
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        pc2.addIceCandidate(event.candidate);
      }
    };
    
    pc2.onicecandidate = (event) => {
      if (event.candidate) {
        pc.addIceCandidate(event.candidate);
      }
    };
    
    // Ajouter le flux local à pc1
    stream.getTracks().forEach(track => {
      pc.addTrack(track, stream);
      console.log('📡 Track ajouté à pc1:', track.kind);
    });
    
    // Créer l'offre et la réponse
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    
    await pc2.setRemoteDescription(offer);
    const answer = await pc2.createAnswer();
    await pc2.setLocalDescription(answer);
    await pc.setRemoteDescription(answer);
    
    console.log('✅ Connexion WebRTC locale établie');
    setStatus('Connexion établie - parlez !');
    setIsInCall(true);
  };

  // Gérer le flux distant
  const handleRemoteStream = (remoteStream: MediaStream) => {
    console.log('🔊 Flux distant reçu, création audio immédiate');
    
    // Créer l'élément audio
    const audioElement = new Audio();
    audioElement.srcObject = remoteStream;
    audioElement.autoplay = true;
    audioElement.muted = false;
    audioElement.volume = 1.0;
    audioElement.controls = true;
    audioElement.playsInline = true;
    
    // Positionner l'élément
    audioElement.style.position = 'fixed';
    audioElement.style.bottom = '10px';
    audioElement.style.right = '10px';
    audioElement.style.width = '200px';
    audioElement.style.height = '40px';
    audioElement.style.zIndex = '1000';
    
    document.body.appendChild(audioElement);
    remoteAudioRef.current = audioElement;
    
    // Forcer vers le casque
    forceAudioToOutput(audioElement);
    
    // Analyser le niveau audio distant
    startRemoteAudioAnalysis(remoteStream);
    
    // Jouer l'audio immédiatement
    audioElement.play().then(() => {
      console.log('✅ Audio distant joué avec succès');
      setStatus('🎧 Audio distant actif - parlez dans le microphone !');
    }).catch(error => {
      console.error('❌ Erreur lecture audio:', error);
      setStatus('❌ Erreur lecture audio distant');
    });
  };

  // Analyser le niveau audio distant
  const startRemoteAudioAnalysis = (remoteStream: MediaStream) => {
    if (!audioContextRef.current) return;
    
    const source = audioContextRef.current.createMediaStreamSource(remoteStream);
    const analyser = audioContextRef.current.createAnalyser();
    analyser.fftSize = 256;
    
    source.connect(analyser);
    
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    
    const updateRemoteLevel = () => {
      if (!isInCall) return;
      
      analyser.getByteFrequencyData(dataArray);
      
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const average = sum / dataArray.length;
      const level = Math.round((average / 255) * 100);
      
      setRemoteAudioLevel(level);
      
      requestAnimationFrame(updateRemoteLevel);
    };
    
    updateRemoteLevel();
  };

  // Forcer l'audio vers le casque
  const forceAudioToOutput = async (audioElement: HTMLAudioElement) => {
    try {
      console.log('🎧 Configuration sortie audio vers casque...');
      
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioOutputs = devices.filter(device => device.kind === 'audiooutput');
      
      console.log('🎧 Périphériques audio:', audioOutputs.map(d => d.label));
      
      // Trouver le casque
      let targetDevice = audioOutputs.find(device => 
        device.label.toLowerCase().includes('casque') || 
        device.label.toLowerCase().includes('headset') ||
        device.label.toLowerCase().includes('écouteurs')
      );
      
      // Si pas de casque, utiliser le premier périphérique
      if (!targetDevice && audioOutputs.length > 0) {
        targetDevice = audioOutputs[0];
      }
      
      if (targetDevice && 'setSinkId' in audioElement) {
        await audioElement.setSinkId(targetDevice.deviceId);
        console.log(`✅ Audio routé vers: ${targetDevice.label || targetDevice.deviceId}`);
      } else {
        console.log('ℹ️ Utilisation périphérique par défaut');
      }
      
      audioElement.volume = 1.0;
      audioElement.muted = false;
      
    } catch (error) {
      console.error('❌ Erreur configuration audio:', error);
    }
  };

  // Arrêter le test
  const stopTest = () => {
    console.log('📴 Arrêt test audio');
    
    setIsCalling(false);
    setIsInCall(false);
    setStatus('Test arrêté');
    
    // Arrêter les flux
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    
    // Fermer la connexion WebRTC
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    
    // Supprimer l'élément audio
    if (remoteAudioRef.current) {
      document.body.removeChild(remoteAudioRef.current);
      remoteAudioRef.current = null;
    }
    
    // Fermer l'AudioContext
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    setAudioLevel(0);
    setRemoteAudioLevel(0);
  };

  return (
    <div className="p-6 bg-gray-900 text-white rounded-lg">
      <h2 className="text-2xl font-bold mb-4 text-center">🎧 Test Audio VoIP Direct</h2>
      
      <div className="mb-6 text-center">
        <div className="text-lg mb-2">{status}</div>
        <div className="text-sm text-gray-400">
          Ce test crée une connexion WebRTC locale pour vérifier l'audio dans votre casque
        </div>
      </div>

      {/* Contrôles */}
      <div className="flex justify-center gap-4 mb-6">
        {!isCalling ? (
          <button 
            onClick={startTest}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition-colors"
          >
            🎤 Démarrer Test Audio
          </button>
        ) : (
          <button 
            onClick={stopTest}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition-colors"
          >
            📴 Arrêter Test
          </button>
        )}
      </div>

      {/* Niveaux audio */}
      {isCalling && (
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <span>🎤 Niveau Micro (Sortant):</span>
              <span>{audioLevel}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-100"
                style={{ width: `${audioLevel}%` }}
              />
            </div>
          </div>
          
          <div>
            <div className="flex justify-between mb-2">
              <span>🔊 Niveau Casque (Entrant):</span>
              <span>{remoteAudioLevel}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-100"
                style={{ width: `${remoteAudioLevel}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-6 p-4 bg-gray-800 rounded-lg">
        <h3 className="font-semibold mb-2">📋 Instructions:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>Mettez votre casque</li>
          <li>Cliquez sur "Démarrer Test Audio"</li>
          <li>Parlez dans le microphone</li>
          <li>Vous devriez entendre votre voix dans le casque (avec un petit délai)</li>
          <li>Les barres doivent bouger quand vous parlez</li>
        </ol>
      </div>

      {/* Debug info */}
      <div className="mt-4 text-xs text-gray-400 text-center">
        Connexion WebRTC locale • Audio bidirectionnel • Test direct
      </div>
    </div>
  );
};

export default VoIPAudioTest;
