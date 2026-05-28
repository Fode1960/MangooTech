import React, { useState } from 'react';
import LiveShoppingManager from '../components/LiveShoppingManager';

const TestLiveShoppingAudio: React.FC = () => {
  const [mode, setMode] = useState<'host' | 'viewer'>('host');
  const [isLive, setIsLive] = useState(false);

  const handleStartLive = () => {
    setIsLive(true);
  };

  const handleEndStream = () => {
    setIsLive(false);
    if (confirm('Êtes-vous sûr de vouloir terminer le live ?')) {
      setIsLive(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
      {/* En-tête */}
      <div className="bg-white shadow-lg border-b border-orange-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              🎧 Test Audio Live Shopping
            </h1>
            <p className="text-gray-600">
              Test complet de la réception audio dans le casque
            </p>
          </div>
        </div>
      </div>

      {/* Contrôles de test */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Contrôles de Test Audio</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mode</label>
              <div className="flex space-x-2">
                <button
                  onClick={() => setMode('host')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    mode === 'host'
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Vendeur
                </button>
                <button
                  onClick={() => setMode('viewer')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    mode === 'viewer'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Client
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Statut Live</label>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${isLive ? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`} />
                <span className="text-sm font-medium text-gray-700">
                  {isLive ? 'EN DIRECT' : 'HORS LIGNE'}
                </span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Actions</label>
              <div className="space-x-2">
                <button
                  onClick={handleStartLive}
                  disabled={isLive}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  Démarrer Live
                </button>
                <button
                  onClick={handleEndStream}
                  disabled={!isLive}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  Arrêter Live
                </button>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-2">🎯 Instructions pour tester l'audio :</h3>
            <ol className="text-sm text-blue-700 space-y-1">
              <li>1. Cliquez sur "Démarrer Live" pour activer l'audio</li>
              <li>2. Parlez dans votre microphone</li>
              <li>3. Vérifiez que les barres de niveau audio s'animent (Micro et Casque)</li>
              <li>4. Écoutez dans votre casque - vous devriez entendre votre voix !</li>
              <li>5. Les niveaux doivent montrer : Micro (bleu) et Casque (vert)</li>
            </ol>
          </div>
        </div>

        {/* Interface Live Shopping */}
        {isLive && (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <LiveShoppingManager
              mode={mode}
              roomId="test-audio-room"
              userId={mode === 'host' ? 'test-host' : 'test-viewer'}
              userName={mode === 'host' ? 'Test Vendeur' : 'Test Client'}
              onEndStream={handleEndStream}
            />
          </div>
        )}

        {!isLive && (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">🎤</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Prêt pour le test audio ?</h3>
            <p className="text-gray-600 mb-4">
              Cliquez sur "Démarrer Live" pour activer le système audio complet.
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-md mx-auto">
              <p className="text-sm text-yellow-800">
                💡 <strong>Astuce :</strong> Assurez-vous d'avoir un microphone connecté et un casque audio pour le test complet.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Pied de page */}
      <div className="bg-gray-800 text-white py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm text-gray-300">
            Test de réception audio dans le casque - Solution Live Shopping MangooTech
          </p>
        </div>
      </div>
    </div>
  );
};

export default TestLiveShoppingAudio;