import React, { useState, useRef, useEffect } from 'react';

// Test VoIP avec FORÇAGE AUDIO vers casque
const VoIPAudioTestForce: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [outputLevel, setOutputLevel] = useState(0);
  const [status, setStatus] = useState('Cliquez pour commencer');
  
  const localStreamRef = useRef<MediaStream | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const outputAnalyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const outputDataArrayRef = useRef<Uint8Array | null>(null);

  // Démarrer le test avec forçage audio
  const startTest = async () => {
    try {
      setStatus('Activation microphone...');
      
      // Obtenir le flux audio
      const stream = await navigator.mediaDevices.getUserMedia({
        video: false,
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          sampleRate: 16000,
          channelCount: 1
        }
      });
      
      localStreamRef.current = stream;
      setStatus('Microphone activé - création audio...');
      
      // Créer l'AudioContext AVANT l'élément audio pour le forçage
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Créer la chaîne audio complète
      createAudioChain(stream);
      
      setIsActive(true);
      
    } catch (error) {
      console.error('❌ Erreur:', error);
      setStatus(`Erreur: ${error}`);
    }
  };

  // Créer la chaîne audio complète avec forçage
  const createAudioChain = async (stream: MediaStream) => {
    if (!audioContextRef.current) return;
    
    console.log('🔄 Création chaîne audio complète...');
    
    try {
      // 1. Créer la source depuis le microphone
      const source = audioContextRef.current.createMediaStreamSource(stream);
      
      // 2. Créer un analyseur pour l'entrée
      const inputAnalyser = audioContextRef.current.createAnalyser();
      inputAnalyser.fftSize = 256;
      source.connect(inputAnalyser);
      analyserRef.current = inputAnalyser;
      
      // 3. Créer un analyseur pour la sortie
      const outputAnalyser = audioContextRef.current.createAnalyser();
      outputAnalyser.fftSize = 256;
      outputAnalyserRef.current = outputAnalyser;
      
      // 4. Créer un gain pour amplifier le son
      const gainNode = audioContextRef.current.createGain();
      gainNode.gain.value = 2.0; // Amplifier x2
      
      // 5. Créer un destination pour l'audio de sortie
      const destination = audioContextRef.current.createMediaStreamDestination();
      
      // 6. Connecter la chaîne : source → gain → analyseur sortie → destination
      source.connect(gainNode);
      gainNode.connect(outputAnalyser);
      outputAnalyser.connect(destination);
      
      // 7. Créer l'élément audio de sortie
      const audioElement = new Audio();
      audioElement.srcObject = destination.stream;
      audioElement.autoplay = true;
      audioElement.muted = false;
      audioElement.volume = 1.0;
      audioElement.controls = true;
      audioElement.playsInline = true;
      
      // 8. FORCER le casque audio
      await forceHeadsetAudio(audioElement);
      
      // 9. Positionner et afficher l'élément
      audioElement.style.position = 'fixed';
      audioElement.style.bottom = '10px';
      audioElement.style.right = '10px';
      audioElement.style.width = '200px';
      audioElement.style.height = '40px';
      audioElement.style.zIndex = '1000';
      
      document.body.appendChild(audioElement);
      audioElementRef.current = audioElement;
      
      // 10. Jouer l'audio
      await audioElement.play();
      
      console.log('✅ Chaîne audio complète créée !');
      setStatus('🎧 Audio FORCÉ vers casque - parlez !');
      
      // 11. Analyser les niveaux
      startAudioAnalysis(stream, destination.stream);
      
    } catch (error) {
      console.error('❌ Erreur chaîne audio:', error);
      setStatus(`❌ Erreur chaîne: ${error}`);
    }
  };

  // Forcer le casque audio
  const forceHeadsetAudio = async (audioElement: HTMLAudioElement) => {
    try {
      console.log('🎧 FORÇAGE audio vers casque...');
      
      // Méthode 1: setSinkId si disponible
      if ('setSinkId' in audioElement) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioOutputs = devices.filter(device => device.kind === 'audiooutput');
        
        console.log('🎧 Périphériques audio disponibles:', audioOutputs.map(d => ({label: d.label, id: d.deviceId})));
        
        // Trouver le casque
        let targetDevice = audioOutputs.find(device => 
          device.label.toLowerCase().includes('casque') || 
          device.label.toLowerCase().includes('headset') ||
          device.label.toLowerCase().includes('écouteurs') ||
          device.label.toLowerCase().includes('headphones')
        );
        
        // Si pas de casque, utiliser le premier périphérique non-par défaut
        if (!targetDevice && audioOutputs.length > 1) {
          targetDevice = audioOutputs.find(d => !d.label.toLowerCase().includes('default')) || audioOutputs[1];
        } else if (!targetDevice && audioOutputs.length > 0) {
          targetDevice = audioOutputs[0];
        }
        
        if (targetDevice) {
          // @ts-ignore
          await audioElement.setSinkId(targetDevice.deviceId);
          console.log(`✅ Audio FORCÉ vers: ${targetDevice.label || targetDevice.deviceId}`);
        }
      }
      
      // Méthode 2: Paramètres de volume maximum
      audioElement.volume = 1.0;
      audioElement.muted = false;
      
      // Méthode 3: Créer un contexte audio dédié pour ce périphérique
      if (audioContextRef.current) {
        // S'assurer que le contexte est bien lancé
        if (audioContextRef.current.state === 'suspended') {
          await audioContextRef.current.resume();
        }
      }
      
    } catch (error) {
      console.error('❌ Erreur forçage casque:', error);
      // Continuer quand même même si le forçage échoue
    }
  };

  // Analyser les niveaux audio
  const startAudioAnalysis = (inputStream: MediaStream, outputStream: MediaStream) => {
    if (!audioContextRef.current) return;
    
    const inputDataArray = new Uint8Array(analyserRef.current!.frequencyBinCount);
    const outputDataArray = new Uint8Array(outputAnalyserRef.current!.frequencyBinCount);
    dataArrayRef.current = inputDataArray;
    outputDataArrayRef.current = outputDataArray;
    
    const updateLevels = () => {
      if (!isActive) return;
      
      // Analyser l'entrée
      if (analyserRef.current && inputDataArray) {
        analyserRef.current.getByteFrequencyData(inputDataArray);
        let sum = 0;
        for (let i = 0; i < inputDataArray.length; i++) {
          sum += inputDataArray[i];
        }
        const inputAverage = sum / inputDataArray.length;
        const inputLevel = Math.round((inputAverage / 255) * 100);
        setAudioLevel(inputLevel);
      }
      
      // Analyser la sortie
      if (outputAnalyserRef.current && outputDataArray) {
        outputAnalyserRef.current.getByteFrequencyData(outputDataArray);
        let sum = 0;
        for (let i = 0; i < outputDataArray.length; i++) {
          sum += outputDataArray[i];
        }
        const outputAverage = sum / outputDataArray.length;
        const outputLevel = Math.round((outputAverage / 255) * 100);
        setOutputLevel(outputLevel);
      }
      
      requestAnimationFrame(updateLevels);
    };
    
    updateLevels();
  };

  // Arrêter le test
  const stopTest = () => {
    setStatus('Test arrêté');
    setIsActive(false);
    setAudioLevel(0);
    setOutputLevel(0);
    
    // Arrêter les flux
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    
    // Supprimer l'élément audio
    if (audioElementRef.current) {
      document.body.removeChild(audioElementRef.current);
      audioElementRef.current = null;
    }
    
    // Fermer l'AudioContext
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  };

  return (
    <div className="p-6 bg-gray-900 text-white rounded-lg">
      <h2 className="text-2xl font-bold mb-4 text-center">🎧 Test Audio avec FORÇAGE Casque</h2>
      
      <div className="mb-6 text-center">
        <div className="text-lg mb-2">{status}</div>
        <div className="text-sm text-gray-400">
          Connexion forcée vers votre casque
        </div>
      </div>

      {/* Contrôles */}
      <div className="flex justify-center gap-4 mb-6">
        {!isActive ? (
          <button 
            onClick={startTest}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition-colors"
          >
            🎤 Démarrer Test FORCÉ
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
      {isActive && (
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <span>🎤 Niveau Micro (Entrant):</span>
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
              <span>🔊 Niveau Casque (Sortant):</span>
              <span>{outputLevel}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-100"
                style={{ width: `${outputLevel}%` }}
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
          <li>Cliquez sur "Démarrer Test FORCÉ"</li>
          <li>Parlez dans le microphone</li>
          <li>Le son doit être FORCÉ vers votre casque</li>
          <li>Les DEUX barres doivent bouger</li>
        </ol>
      </div>

      {/* Debug info */}
      <div className="mt-4 text-xs text-gray-400 text-center">
        Audio FORCÉ vers casque • Amplification x2 • Analyse bidirectionnelle
      </div>
    </div>
  );
};

export default VoIPAudioTestForce;