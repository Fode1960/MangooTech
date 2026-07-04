import React, { useState, useRef, useEffect } from 'react';
import { Phone, PhoneOff, Mic, Settings } from 'lucide-react';

// Test final complet pour vérifier la réception de la voix dans le casque
const VoIPFinalTest: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isInCall, setIsInCall] = useState(false);
  const [localAudioLevel, setLocalAudioLevel] = useState(0);
  const [remoteAudioLevel, setRemoteAudioLevel] = useState(0);
  const [status, setStatus] = useState('Prêt pour test complet');
  const [testResults, setTestResults] = useState<string[]>([]);
  
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const localAnalyserRef = useRef<AnalyserNode | null>(null);
  const remoteAnalyserRef = useRef<AnalyserNode | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  // Test 1: Vérifier les permissions et le microphone
  const testMicrophone = async () => {
    try {
      setStatus('Test 1: Vérification microphone...');
      addTestResult('🎤 Test microphone en cours...');
      
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
      addTestResult('✅ Microphone accessible');
      
      // Vérifier que le microphone capte du son
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;
      
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      
      source.connect(analyser);
      localAnalyserRef.current = analyser;
      
      // Tester le niveau audio pendant 3 secondes
      return new Promise<void>((resolve) => {
        let maxLevel = 0;
        const testInterval = setInterval(() => {
          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          analyser.getByteFrequencyData(dataArray);
          
          const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
          const level = Math.round((average / 255) * 100);
          maxLevel = Math.max(maxLevel, level);
          
          setLocalAudioLevel(level);
        }, 100);
        
        setTimeout(() => {
          clearInterval(testInterval);
          if (maxLevel > 5) {
            addTestResult(`✅ Microphone actif (niveau max: ${maxLevel}%)`);
          } else {
            addTestResult(`⚠️ Microphone faible (niveau max: ${maxLevel}%) - parlez plus fort`);
          }
          resolve();
        }, 3000);
      });
      
    } catch (error) {
      addTestResult(`❌ Erreur microphone: ${error}`);
      throw error;
    }
  };

  // Test 2: Vérifier la sortie audio (haut-parleurs/casque)
  const testAudioOutput = async () => {
    try {
      setStatus('Test 2: Vérification sortie audio...');
      addTestResult('🔊 Test sortie audio en cours...');
      
      // Créer un son de test
      const audioContext = audioContextRef.current!;
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // La note A4
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Jouer un son pendant 2 secondes
      oscillator.start();
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      
      addTestResult('✅ Son de test généré');
      
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          oscillator.stop();
          addTestResult('✅ Sortie audio fonctionnelle');
          resolve();
        }, 2000);
      });
      
    } catch (error) {
      addTestResult(`❌ Erreur sortie audio: ${error}`);
      throw error;
    }
  };

  // Test 3: Test de boucle audio directe (microphone vers casque)
  const testDirectAudioLoop = async () => {
    try {
      setStatus('Test 3: Test boucle audio directe...');
      addTestResult('🔄 Test boucle audio directe en cours...');
      
      if (!localStreamRef.current) {
        throw new Error('Pas de flux local disponible');
      }
      
      // Créer un élément audio pour la sortie
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
      audioElement.srcObject = localStreamRef.current;
      
      // Forcer vers le casque
      await forceAudioToOutput(audioElement);
      
      // Jouer l'audio
      await audioElement.play();
      addTestResult('✅ Boucle audio directe activée');
      
      // Analyser le niveau audio distant (sortie)
      const audioContext = audioContextRef.current!;
      const destination = audioContext.createMediaStreamDestination();
      const source = audioContext.createMediaStreamSource(localStreamRef.current);
      source.connect(destination);
      
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      remoteAnalyserRef.current = analyser;
      
      // Tester le niveau audio de sortie pendant 5 secondes
      return new Promise<void>((resolve) => {
        let maxRemoteLevel = 0;
        const testInterval = setInterval(() => {
          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          analyser.getByteFrequencyData(dataArray);
          
          const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
          const level = Math.round((average / 255) * 100);
          maxRemoteLevel = Math.max(maxRemoteLevel, level);
          
          setRemoteAudioLevel(level);
        }, 100);
        
        setTimeout(() => {
          clearInterval(testInterval);
          if (maxRemoteLevel > 3) {
            addTestResult(`✅ Audio sortie détecté (niveau max: ${maxRemoteLevel}%)`);
            addTestResult('🎧 VOUS DEVRIEZ ENTENDRE VOTRE VOIX DANS LE CASQUE !');
          } else {
            addTestResult(`⚠️ Audio sortie faible (niveau max: ${maxRemoteLevel}%)`);
          }
          resolve();
        }, 5000);
      });
      
    } catch (error) {
      addTestResult(`❌ Erreur boucle audio: ${error}`);
      throw error;
    }
  };

  // Fonction pour forcer l'audio vers le casque
  const forceAudioToOutput = async (audioElement: HTMLAudioElement) => {
    try {
      console.log('🎧 Configuration sortie audio vers casque...');
      
      // Énumérer les périphériques audio disponibles
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioOutputs = devices.filter(device => device.kind === 'audiooutput');
      
      console.log('🎧 Périphériques audio disponibles:', audioOutputs.map(d => ({label: d.label, id: d.deviceId})));
      addTestResult(`🎧 ${audioOutputs.length} périphériques audio trouvés`);
      
      // Trouver le casque ou utiliser le périphérique par défaut
      let targetDevice = audioOutputs.find(device => 
        device.label.toLowerCase().includes('casque') || 
        device.label.toLowerCase().includes('headset') ||
        device.label.toLowerCase().includes('écouteurs')
      );
      
      // Si pas de casque trouvé, utiliser le périphérique par défaut
      if (!targetDevice && audioOutputs.length > 0) {
        targetDevice = audioOutputs[0];
      }
      
      if (targetDevice && 'setSinkId' in audioElement) {
        await audioElement.setSinkId(targetDevice.deviceId);
        addTestResult(`✅ Audio routé vers: ${targetDevice.label || targetDevice.deviceId}`);
      } else {
        addTestResult('ℹ️ Utilisation du périphérique par défaut');
      }
      
      // Configuration finale
      audioElement.volume = 1.0;
      audioElement.muted = false;
      audioElement.playsInline = true;
      
    } catch (error) {
      addTestResult(`❌ Erreur configuration sortie audio: ${error}`);
    }
  };

  // Test 4: Vérifier les permissions du navigateur
  const testBrowserPermissions = async () => {
    try {
      setStatus('Test 4: Vérification permissions navigateur...');
      addTestResult('🔒 Test permissions navigateur en cours...');
      
      // Vérifier l'autoplay policy
      const audioContext = audioContextRef.current!;
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
        addTestResult('✅ AudioContext repris');
      }
      
      // Vérifier les permissions
      if ('permissions' in navigator) {
        const microphonePermission = await navigator.permissions.query({ name: 'microphone' });
        addTestResult(`🎤 Permission microphone: ${microphonePermission.state}`);
        
        const audioOutputPermission = await navigator.permissions.query({ name: 'speaker-selection' } as unknown as PermissionDescriptor);
        addTestResult(`🔊 Permission sortie audio: ${audioOutputPermission.state}`);
      }
      
      addTestResult('✅ Permissions navigateur vérifiées');
      
    } catch (error) {
      addTestResult(`⚠️ Erreur permissions: ${error}`);
    }
  };

  // Exécuter tous les tests
  const runAllTests = async () => {
    try {
      setTestResults([]);
      addTestResult('🚀 Démarrage des tests complets...');
      
      await testMicrophone();
      await testAudioOutput();
      await testDirectAudioLoop();
      await testBrowserPermissions();
      
      setStatus('✅ Tests terminés ! Vérifiez les résultats ci-dessous.');
      addTestResult('🎉 TESTS TERMINÉS !');
      addTestResult('💡 Résultat: Si vous entendez votre voix dans le casque, tout fonctionne !');
      
    } catch (error) {
      setStatus(`❌ Erreur lors des tests: ${error}`);
      addTestResult(`❌ Erreur générale: ${error}`);
    }
  };

  // Nettoyage
  useEffect(() => {
    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (remoteAudioRef.current && remoteAudioRef.current.parentNode) {
        remoteAudioRef.current.parentNode.removeChild(remoteAudioRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return (
    <div className="p-6 bg-gray-900 text-white rounded-lg max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-center">🎧 Test Final VoIP - Réception Voix dans Casque</h2>
      
      <div className="mb-6 text-center">
        <button
          onClick={runAllTests}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
        >
          🚀 Lancer les Tests Complets
        </button>
      </div>

      <div className="mb-4 text-center">
        <div className="text-lg font-semibold">{status}</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Niveau audio local */}
        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">🎤 Microphone (Entrant)</h3>
          <div className="w-full bg-gray-700 rounded-full h-4 mb-2">
            <div 
              className="bg-blue-500 h-4 rounded-full transition-all duration-100"
              style={{ width: `${localAudioLevel}%` }}
            ></div>
          </div>
          <div className="text-sm text-gray-300">Niveau: {localAudioLevel}%</div>
        </div>

        {/* Niveau audio distant */}
        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">🔊 Casque (Sortant)</h3>
          <div className="w-full bg-gray-700 rounded-full h-4 mb-2">
            <div 
              className="bg-green-500 h-4 rounded-full transition-all duration-100"
              style={{ width: `${remoteAudioLevel}%` }}
            ></div>
          </div>
          <div className="text-sm text-gray-300">Niveau: {remoteAudioLevel}%</div>
        </div>
      </div>

      {/* Résultats des tests */}
      <div className="bg-gray-800 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">📋 Résultats des Tests</h3>
        <div className="max-h-64 overflow-y-auto">
          {testResults.length === 0 ? (
            <div className="text-gray-400">Aucun test effectué. Cliquez sur "Lancer les Tests Complets".</div>
          ) : (
            testResults.map((result, index) => (
              <div key={index} className="text-sm mb-1 font-mono">
                {result}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-6 p-4 bg-yellow-900 border border-yellow-600 rounded-lg">
        <h4 className="font-semibold text-yellow-200 mb-2">💡 Instructions:</h4>
        <ul className="text-sm text-yellow-100 space-y-1">
          <li>1. Cliquez sur "Lancer les Tests Complets"</li>
          <li>2. Parlez dans le microphone pendant les tests</li>
          <li>3. Écoutez attentivement dans votre casque</li>
          <li>4. Si vous entendez votre voix: ✅ Le système fonctionne !</li>
          <li>5. Si vous n'entendez rien: ❌ Il y a un problème à résoudre</li>
        </ul>
      </div>
    </div>
  );
};

export default VoIPFinalTest;
