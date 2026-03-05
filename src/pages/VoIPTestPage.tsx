import React, { useState } from 'react';
import VoIPManager from '../components/VoIPManager';

const VoIPTestPage: React.FC = () => {
  const [userType, setUserType] = useState<'vendor' | 'client' | null>(null);
  const [roomId] = useState('voip-test-room');
  const [userId] = useState(() => `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);

  const targetUserId = userType === 'vendor' ? 'client-test-user' : 'vendor-test-user';

  if (!userType) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-8">Test Système VoIP</h1>
          <p className="text-gray-300 mb-8">Choisissez votre rôle pour tester les appels audio</p>
          
          <div className="flex space-x-4 justify-center">
            <button
              onClick={() => setUserType('vendor')}
              className="bg-blue-600 hover:bg-blue-700 px-8 py-4 rounded-lg text-lg font-semibold transition-colors"
            >
              🏪 Vendeur
            </button>
            
            <button
              onClick={() => setUserType('client')}
              className="bg-green-600 hover:bg-green-700 px-8 py-4 rounded-lg text-lg font-semibold transition-colors"
            >
              🛒 Client
            </button>
          </div>
          
          <div className="mt-8 text-sm text-gray-400">
            <p>Ouvrez cette page dans deux onglets différents</p>
            <p>et sélectionnez des rôles différents pour tester les appels</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 p-4">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold">
            Test VoIP - {userType === 'vendor' ? 'Vendeur' : 'Client'}
          </h1>
          <div className="text-sm text-gray-300">
            Room: {roomId} | User: {userId}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="container mx-auto p-6">
        <div className="max-w-2xl mx-auto">
          {/* Instructions */}
          <div className="bg-gray-800 p-6 rounded-lg mb-6">
            <h2 className="text-lg font-semibold mb-4">Instructions de test</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-300">
              <li>Ouvrez cette page dans un autre onglet/navigateur</li>
              <li>Sélectionnez le rôle opposé dans l'autre onglet</li>
              <li>Cliquez sur "Appeler" pour tester l'appel audio</li>
              <li>Parlez dans le microphone pour tester l'audio</li>
              <li>Utilisez le bouton audio pour activer/désactiver le micro</li>
            </ol>
          </div>

          {/* VoIP Manager */}
          <div className="mb-6">
            <VoIPManager
              role={userType}
              roomId={roomId}
              userId={userId}
              targetUserId={targetUserId}
            />
          </div>

          {/* Test audio */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Test Audio Système</h3>
            <button
              onClick={() => {
                // Test audio simple
                try {
                  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
                  const oscillator = audioContext.createOscillator();
                  const gainNode = audioContext.createGain();
                  
                  oscillator.connect(gainNode);
                  gainNode.connect(audioContext.destination);
                  
                  oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
                  oscillator.type = 'sine';
                  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                  
                  oscillator.start();
                  oscillator.stop(audioContext.currentTime + 0.5);
                  
                  console.log('✅ Test audio système lancé');
                } catch (error) {
                  console.error('❌ Erreur test audio:', error);
                }
              }}
              className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg flex items-center space-x-2"
            >
              <span>🎵</span>
              <span>Tester le son système</span>
            </button>
            
            <div className="mt-4 text-sm text-gray-400">
              <p>Ce test vérifie que votre système audio fonctionne correctement.</p>
              <p>Vous devriez entendre un bip de 800Hz.</p>
            </div>
          </div>

          {/* Retour au choix */}
          <div className="mt-6 text-center">
            <button
              onClick={() => setUserType(null)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ← Changer de rôle
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoIPTestPage;