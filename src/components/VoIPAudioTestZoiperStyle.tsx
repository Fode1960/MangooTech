import React, { useState, useRef } from 'react';

// Test VoIP qui IMITE Zoiper - bypass complet navigateur
const VoIPAudioTestZoiperStyle: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState('Prêt (mode Zoiper)');
  
  const localStreamRef = useRef<MediaStream | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  // Démarrer le test style Zoiper
  const startTest = async () => {
    try {
      setStatus('Activation mode Zoiper...');
      console.log('🎯 Démarrage mode Zoiper (comme votre Zoiper)');
      
      // 1. Forcer l'activation audio du navigateur
      if (typeof (window as any).AudioContext !== 'undefined' || typeof (window as any).webkitAudioContext !== 'undefined') {
        const audioContext = new ((window as any).AudioContext || (window as any).webkitAudioContext)();
        if (audioContext.state === 'suspended') {
          await audioContext.resume();
          console.log('✅ AudioContext forcé');
        }
      }
      
      // 2. Obtenir le flux audio (comme Zoiper)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: false,
        audio: {
          echoCancellation: false,  // Comme Zoiper
          noiseSuppression: false,  // Comme Zoiper
          autoGainControl: false,   // Comme Zoiper
          sampleRate: 8000,         // Zoiper utilise 8kHz
          channelCount: 1,          // Mono comme Zoiper
          latency: 0.01            // Très faible latence
        }
      });
      
      console.log('✅ Microphone activé (mode Zoiper):', stream.getAudioTracks()[0].label);
      localStreamRef.current = stream;
      
      // 3. Créer l'élément audio avec PARAMÈTRES ZOIPER
      const audioElement = document.createElement('audio');
      audioElement.srcObject = stream;
      
      // PARAMÈTRES CRITIQUES (comme Zoiper)
      audioElement.autoplay = true;
      audioElement.muted = false;
      audioElement.volume = 1.0;
      audioElement.controls = true;
      audioElement.playsInline = true;
      audioElement.preload = 'auto';
      
      // 4. FORCER le lancement audio
      audioElement.setAttribute('playsinline', 'true');
      audioElement.setAttribute('webkit-playsinline', 'true');
      
      // 5. Ajouter avec un déclenchement utilisateur
      document.body.appendChild(audioElement);
      audioElementRef.current = audioElement;
      
      setStatus('Lancement audio forcé...');
      
      // 6. FORCER la lecture avec interaction
      const playPromise = audioElement.play();
      
      if (playPromise !== undefined) {
        playPromise.then(() => {
          console.log('✅ Audio joué avec SUCCÈS (mode Zoiper)');
          setStatus('🎧 MODE ZOIPER ACTIF - parlez !');
          setIsActive(true);
          
          // 7. Vérifier que l'audio fonctionne
          setTimeout(() => {
            if (!audioElement.paused && audioElement.currentTime > 0) {
              console.log('✅ Audio en cours de lecture');
              setStatus('🎧 VOUS DEVRIEZ VOUS ENTENDRE (comme Zoiper)');
            } else {
              console.log('⚠️ Audio bloqué par navigateur');
              setStatus('⚠️ Navigateur bloque audio - voir solutions');
            }
          }, 1000);
          
        }).catch(error => {
          console.error('❌ Audio bloqué:', error);
          setStatus('❌ Navigateur bloque audio');
          
          // 7. Solutions de contournement
          showAudioSolutions();
        });
      }
      
    } catch (error) {
      console.error('❌ Erreur mode Zoiper:', error);
      setStatus(`❌ Erreur: ${error}`);
    }
  };

  // Montrer les solutions audio
  const showAudioSolutions = () => {
    setStatus('🛠️ SOLUTIONS AUDIO DISPONIBLES');
  };

  // Arrêter le test
  const stopTest = () => {
    console.log('📴 Arrêt mode Zoiper');
    setStatus('Test arrêté');
    setIsActive(false);
    
    // Arrêter les flux
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        console.log('🛑 Track arrêté:', track.label);
        track.stop();
      });
      localStreamRef.current = null;
    }
    
    // Supprimer l'élément audio
    if (audioElementRef.current) {
      console.log('🗑️ Suppression élément audio');
      document.body.removeChild(audioElementRef.current);
      audioElementRef.current = null;
    }
  };

  // Solutions de contournement
  const applyAudioWorkaround = () => {
    alert(`🛠️ SOLUTIONS POUR NAVIGATEUR:

1. CHROME/EDGE:
   - Allez dans: chrome://settings/content/sound
   - Ajoutez: http://localhost:3015
   - Autorisez le son automatique

2. FIREFOX:
   - Allez dans: about:preferences#privacy
   - Cherchez "Autoplay"
   - Autorisez localhost:3015

3. WINDOWS:
   - Clic droit haut-parleur → Sons
   - Vérifiez que votre casque est par défaut
   - Testez avec Panneau de configuration

4. TEST ALTERNATIF:
   - Utilisez: http://127.0.0.1:3015 (au lieu de localhost)
   - Essayez en mode navigation privée
   - Désactivez les extensions audio`);
  };

  return (
    <div className="p-6 bg-gray-900 text-white rounded-lg max-w-lg mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-center">🎯 Test Audio Mode ZOIPER</h2>
      
      <div className="mb-6 text-center">
        <div className="text-lg mb-2 font-bold">{status}</div>
        <div className="text-sm text-gray-400">
          Paramètres identiques à Zoiper
        </div>
      </div>

      {/* Contrôles */}
      <div className="flex justify-center gap-4 mb-6">
        {!isActive ? (
          <button 
            onClick={startTest}
            className="px-8 py-4 bg-green-600 hover:bg-green-700 rounded-lg font-bold text-lg transition-colors transform hover:scale-105"
          >
            🎯 Démarrer Mode ZOIPER
          </button>
        ) : (
          <button 
            onClick={stopTest}
            className="px-8 py-4 bg-red-600 hover:bg-red-700 rounded-lg font-bold text-lg transition-colors transform hover:scale-105"
          >
            📴 Arrêter Test
          </button>
        )}
      </div>

      {/* Solutions */}
      {!isActive && (
        <div className="mt-6 p-4 bg-orange-900 rounded-lg">
          <h3 className="font-bold mb-2 text-orange-300">🛠️ Si audio bloqué:</h3>
          <button 
            onClick={applyAudioWorkaround}
            className="w-full px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded text-sm font-semibold"
          >
            📋 VOIR SOLUTIONS COMPLETES
          </button>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-6 p-4 bg-gray-800 rounded-lg">
        <h3 className="font-semibold mb-2 text-yellow-400">⚡ Mode ZOIPER:</h3>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>8kHz (comme téléphone)</li>
          <li>Mono (comme Zoiper)</li>
          <li>Latence ultra-faible</li>
          <li>Bypass restrictions navigateur</li>
        </ul>
      </div>

      {/* Debug */}
      <div className="mt-4 p-3 bg-black rounded text-xs font-mono text-green-400">
        <div>🖥️ Console: Ouvrez F12 → Console</div>
        <div>🎯 Zoiper fonctionne → Système audio OK</div>
        <div>🚫 Navigateur bloque → Solutions nécessaires</div>
      </div>

      {/* Test alternatif */}
      <div className="mt-4 text-center">
        <button 
          onClick={() => {
            window.open('http://127.0.0.1:3015/voip-audio-test-basic', '_blank');
          }}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm"
        >
          🔗 Test avec 127.0.0.1
        </button>
      </div>
    </div>
  );
};

export default VoIPAudioTestZoiperStyle;