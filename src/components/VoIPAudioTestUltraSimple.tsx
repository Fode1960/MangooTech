import React, { useState, useRef, useEffect } from 'react';

// Test VoIP ULTRA-SIMPLE pour vérifier l'audio dans le casque
const VoIPAudioTestUltraSimple: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [status, setStatus] = useState('Cliquez pour commencer');
  
  const localStreamRef = useRef<MediaStream | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);

  // Démarrer le test ultra-simple
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
      
      // Créer l'élément audio et le connecter directement
      const audioElement = new Audio();
      audioElement.srcObject = stream;
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
      audioElementRef.current = audioElement;
      
      setStatus('Microphone vers casque - parlez !');
      
      // Jouer l'audio
      await audioElement.play();
      
      // Créer l'AudioContext pour l'analyse
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Analyser le niveau audio
      startAudioAnalysis(stream);
      
      setIsActive(true);
      
    } catch (error) {
      console.error('❌ Erreur:', error);
      setStatus(`Erreur: ${error}`);
    }
  };

  // Analyser le niveau audio
  const startAudioAnalysis = (stream: MediaStream) => {
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
      
      if (isActive) {
        requestAnimationFrame(updateLevel);
      }
    };
    
    updateLevel();
  };

  // Arrêter le test
  const stopTest = () => {
    setStatus('Test arrêté');
    setIsActive(false);
    setAudioLevel(0);
    
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
      <h2 className="text-2xl font-bold mb-4 text-center">🎧 Test Audio ULTRA-SIMPLE</h2>
      
      <div className="mb-6 text-center">
        <div className="text-lg mb-2">{status}</div>
        <div className="text-sm text-gray-400">
          Connexion directe microphone → casque
        </div>
      </div>

      {/* Contrôles */}
      <div className="flex justify-center gap-4 mb-6">
        {!isActive ? (
          <button 
            onClick={startTest}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition-colors"
          >
            🎤 Démarrer Test
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

      {/* Niveau audio */}
      {isActive && (
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <span>🎤 Niveau Micro:</span>
              <span>{audioLevel}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-100"
                style={{ width: `${audioLevel}%` }}
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
          <li>Cliquez sur "Démarrer Test"</li>
          <li>Parlez dans le microphone</li>
          <li>Vous devriez entendre votre voix dans le casque IMMÉDIATEMENT</li>
          <li>La barre doit bouger quand vous parlez</li>
        </ol>
      </div>

      {/* Debug info */}
      <div className="mt-4 text-xs text-gray-400 text-center">
        Connexion directe • Pas de WebRTC • Audio immédiat
      </div>
    </div>
  );
};

export default VoIPAudioTestUltraSimple;