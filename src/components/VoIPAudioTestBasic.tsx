import React, { useState, useRef } from 'react';

// Test VoIP ULTRA-BASIQUE - juste microphone vers casque
const VoIPAudioTestBasic: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState('Prêt pour test');
  
  const localStreamRef = useRef<MediaStream | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  // Démarrer le test ultra-basique
  const startTest = async () => {
    try {
      setStatus('Activation microphone...');
      console.log('🎤 Démarrage test ultra-basique...');
      
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
      
      console.log('✅ Microphone activé:', stream.getAudioTracks()[0].label);
      localStreamRef.current = stream;
      
      setStatus('Création audio vers casque...');
      
      // Créer l'élément audio DIRECT
      const audioElement = document.createElement('audio');
      audioElement.srcObject = stream;
      audioElement.autoplay = true;
      audioElement.muted = false;
      audioElement.volume = 1.0;
      audioElement.controls = true;
      audioElement.playsInline = true;
      
      // Ajouter à la page
      document.body.appendChild(audioElement);
      audioElementRef.current = audioElement;
      
      setStatus('Lecture audio...');
      
      // Jouer l'audio
      await audioElement.play();
      
      console.log('✅ Audio joué avec succès !');
      setStatus('🎧 PARLEZ ! Vous devriez vous entendre dans le casque');
      setIsActive(true);
      
      // Test de volume
      setTimeout(() => {
        if (audioElement.volume > 0) {
          console.log('✅ Volume audio:', audioElement.volume);
          setStatus('🎧 Audio ACTIF - parlez dans le microphone !');
        } else {
          console.log('⚠️ Volume à 0');
          audioElement.volume = 1.0;
        }
      }, 1000);
      
    } catch (error) {
      console.error('❌ Erreur:', error);
      setStatus(`❌ Erreur: ${error}`);
    }
  };

  // Arrêter le test
  const stopTest = () => {
    console.log('📴 Arrêt test');
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

  return (
    <div className="p-6 bg-gray-900 text-white rounded-lg max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-center">🎧 Test Audio ULTRA-BASIQUE</h2>
      
      <div className="mb-6 text-center">
        <div className="text-lg mb-2 font-semibold">{status}</div>
        <div className="text-sm text-gray-400">
          Connexion directe: Microphone → Casque
        </div>
      </div>

      {/* Contrôles */}
      <div className="flex justify-center gap-4 mb-6">
        {!isActive ? (
          <button 
            onClick={startTest}
            className="px-8 py-4 bg-green-600 hover:bg-green-700 rounded-lg font-bold text-lg transition-colors transform hover:scale-105"
          >
            🎤 Démarrer Test Audio
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

      {/* Instructions */}
      <div className="mt-6 p-4 bg-gray-800 rounded-lg">
        <h3 className="font-semibold mb-2 text-yellow-400">⚡ Instructions ULTRA-SIMPLES:</h3>
        <ol className="list-decimal list-inside space-y-2 text-sm">
          <li>Mettez votre casque</li>
          <li>Cliquez sur <span className="text-green-400 font-bold">"Démarrer Test Audio"</span></li>
          <li>Parlez dans le microphone</li>
          <li className="text-yellow-300 font-bold">Vous devriez entendre votre voix DANS LE CASQUE</li>
          <li>Si vous ne vous entendez pas, le problème est système/navigateur</li>
        </ol>
      </div>

      {/* Debug console */}
      <div className="mt-4 p-3 bg-black rounded text-xs font-mono text-green-400">
        <div>🖥️ Console: Ouvrez F12 → Console pour voir les logs</div>
      </div>

      {/* Test rapide */}
      <div className="mt-4 text-center">
        <div className="text-xs text-gray-400 mb-2">🔄 Test rapide:</div>
        <button 
          onClick={() => {
            const audio = new Audio();
            audio.volume = 0.5;
            audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmFgU7k9n1unEiBC13yO/eizEIHWq+8+OWT';
            audio.play().then(() => {
              console.log('✅ Test son OK');
              setStatus('✅ Test son OK - haut-parleurs fonctionnent');
            }).catch(err => {
              console.error('❌ Test son échoué:', err);
              setStatus('❌ Haut-parleurs bloqués');
            });
          }}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm"
        >
          🔊 Test Haut-parleurs
        </button>
      </div>
    </div>
  );
};

export default VoIPAudioTestBasic;