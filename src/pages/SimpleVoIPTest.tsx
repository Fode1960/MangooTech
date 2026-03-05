import React, { useState, useEffect } from 'react';

const SimpleVoIPTest: React.FC = () => {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [callStatus, setCallStatus] = useState('Non connecté');
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
    console.log(`[VoIP Test] ${message}`);
  };

  // Test 1: Register as 8888
  const testRegister8888 = () => {
    addLog('Test 1: Enregistrement de 8888...');
    
    const websocket = new WebSocket('ws://localhost:3040');
    setWs(websocket);

    websocket.onopen = () => {
      addLog('✅ WebSocket connecté');
      
      websocket.send(JSON.stringify({
        type: 'register',
        userId: 'vendor-8888',
        role: 'host',
        roomId: 'test-room-8888'
      }));
    };

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      addLog(`📨 Message: ${data.type}`);
      
      if (data.type === 'registered') {
        setIsRegistered(true);
        setCallStatus('8888 enregistré');
        addLog('✅ 8888 enregistré avec succès');
      }
    };

    websocket.onerror = (error) => {
      addLog(`❌ Erreur WebSocket: ${error}`);
    };
  };

  // Test 2: Make call from 8888 to 8889
  const testCall8888to8889 = () => {
    if (!ws || !isRegistered) {
      addLog('❌ 8888 non enregistré');
      return;
    }
    
    addLog('Test 2: Appel de 8888 vers 8889...');
    setCallStatus('Appel en cours...');
    
    ws.send(JSON.stringify({
      type: 'call',
      targetUserId: 'client-8889',
      roomId: 'test-room-8888',
      callId: `test-call-${Date.now()}`
    }));
    
    addLog('📞 Appel envoyé vers 8889');
  };

  // Test 3: Register as 8889 and answer
  const testRegister8889AndAnswer = () => {
    addLog('Test 3: Enregistrement de 8889 et réponse...');
    
    const websocket8889 = new WebSocket('ws://localhost:3040');
    
    websocket8889.onopen = () => {
      addLog('✅ WebSocket 8889 connecté');
      
      websocket8889.send(JSON.stringify({
        type: 'register',
        userId: 'client-8889',
        role: 'viewer',
        roomId: 'test-room-8888'
      }));
    };

    websocket8889.onmessage = (event) => {
      const data = JSON.parse(event.data);
      addLog(`📨 8889 reçu: ${data.type}`);
      
      if (data.type === 'incoming-call') {
        addLog(`📞 Appel entrant de ${data.fromUsername}`);
        
        // Answer the call
        setTimeout(() => {
          addLog('📞 Réponse à l\'appel...');
          websocket8889.send(JSON.stringify({
            type: 'answer',
            callId: data.callId,
            accept: true
          }));
        }, 1000);
      }
      
      if (data.type === 'call-accepted') {
        addLog('✅ Appel accepté!');
        setCallStatus('Appel connecté');
      }
    };

    websocket8889.onerror = (error) => {
      addLog(`❌ Erreur WebSocket 8889: ${error}`);
    };
  };

  // Test 4: End call
  const testEndCall = () => {
    if (!ws) {
      addLog('❌ Non connecté');
      return;
    }
    
    addLog('Test 4: Raccrochage...');
    
    ws.send(JSON.stringify({
      type: 'hangup',
      callId: `test-call-${Date.now()}`
    }));
    
    setCallStatus('Appel terminé');
    addLog('📴 Appel terminé');
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
            Test Simple VoIP 8888 ↔ 8889
          </h1>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Test Controls */}
            <div className="space-y-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <h2 className="text-lg font-semibold text-blue-800 mb-4">
                  Tests Séquentiels
                </h2>
                
                <div className="space-y-3">
                  <button
                    onClick={testRegister8888}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition-colors"
                  >
                    1️⃣ Enregistrer 8888
                  </button>
                  
                  <button
                    onClick={testCall8888to8889}
                    disabled={!isRegistered}
                    className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white py-2 px-4 rounded-lg transition-colors"
                  >
                    2️⃣ Appeler 8889
                  </button>
                  
                  <button
                    onClick={testRegister8889AndAnswer}
                    className="w-full bg-purple-500 hover:bg-purple-600 text-white py-2 px-4 rounded-lg transition-colors"
                  >
                    3️⃣ Enregistrer 8889 & Répondre
                  </button>
                  
                  <button
                    onClick={testEndCall}
                    className="w-full bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg transition-colors"
                  >
                    4️⃣ Raccrocher
                  </button>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">
                  Statut Actuel
                </h3>
                <p className={`text-sm font-medium ${
                  callStatus.includes('Erreur') ? 'text-red-600' : 
                  callStatus.includes('connecté') ? 'text-green-600' : 
                  'text-gray-600'
                }`}>
                  {callStatus}
                </p>
              </div>
            </div>
            
            {/* Logs */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Journal des Tests
              </h2>
              <div className="h-80 overflow-y-auto bg-white rounded border p-3 text-sm font-mono">
                {logs.length === 0 ? (
                  <p className="text-gray-500">Aucun test effectué</p>
                ) : (
                  logs.map((log, index) => (
                    <div key={index} className="mb-1 text-gray-700">
                      {log}
                    </div>
                  ))
                )}
              </div>
              
              {logs.length > 0 && (
                <button
                  onClick={() => setLogs([])}
                  className="mt-3 text-xs text-gray-500 hover:text-gray-700 underline"
                >
                  Effacer le journal
                </button>
              )}
            </div>
          </div>
          
          {/* Instructions */}
          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-yellow-800 mb-2">
              Instructions de Test
            </h3>
            <ol className="text-sm text-yellow-700 space-y-1">
              <li>1. Cliquez sur "Enregistrer 8888" pour connecter le vendeur</li>
              <li>2. Cliquez sur "Appeler 8889" pour lancer l'appel</li>
              <li>3. Cliquez sur "Enregistrer 8889 & Répondre" pour connecter le client</li>
              <li>4. Le système répondra automatiquement à l'appel</li>
              <li>5. Cliquez sur "Raccrocher" pour terminer l'appel</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleVoIPTest;