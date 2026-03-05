import React, { useState, useEffect } from 'react';

const VoIPCallTest: React.FC = () => {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [incomingCall, setIncomingCall] = useState<string | null>(null);
  const [callStatus, setCallStatus] = useState('Déconnecté');
  const [logs, setLogs] = useState<string[]>([]);
  const [testNumber, setTestNumber] = useState('8889');

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  // Connect to VoIP server
  const connectVoIP = () => {
    addLog('Connexion au serveur VoIP...');
    
    const websocket = new WebSocket('ws://localhost:3040');
    setWs(websocket);

    websocket.onopen = () => {
      addLog('✅ WebSocket connecté');
      setCallStatus('Connecté au serveur');
      
      // Register as 8888
      websocket.send(JSON.stringify({
        type: 'register',
        userId: 'vendor-8888',
        role: 'host',
        roomId: 'test-room'
      }));
    };

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      addLog(`📨 Message reçu: ${data.type}`);
      
      switch (data.type) {
        case 'registered':
          setIsRegistered(true);
          setCallStatus('Enregistré comme 8888');
          addLog('✅ Enregistrement réussi');
          break;
          
        case 'incoming-call':
          setIncomingCall(data.fromUsername);
          setCallStatus(`Appel entrant de ${data.fromUsername}`);
          addLog(`📞 Appel entrant de ${data.fromUsername}`);
          break;
          
        case 'call-accepted':
          setCallStatus('Appel en cours');
          setIncomingCall(null);
          addLog('✅ Appel accepté');
          break;
          
        case 'call-ended':
          setCallStatus('Appel terminé');
          setIncomingCall(null);
          addLog('📴 Appel terminé');
          break;
          
        case 'call-error':
          setCallStatus(`Erreur: ${data.error}`);
          addLog(`❌ Erreur: ${data.error}`);
          break;
      }
    };

    websocket.onclose = () => {
      addLog('❌ WebSocket déconnecté');
      setIsRegistered(false);
      setCallStatus('Déconnecté');
    };

    websocket.onerror = (error) => {
      addLog(`❌ Erreur WebSocket: ${error}`);
      setCallStatus('Erreur de connexion');
    };
  };

  // Make a call
  const makeCall = () => {
    if (!ws || !isRegistered) {
      addLog('❌ Non connecté ou non enregistré');
      return;
    }
    
    addLog(`📞 Appel de 8888 vers ${testNumber}...`);
    setCallStatus(`Appel vers ${testNumber}...`);
    
    ws.send(JSON.stringify({
      type: 'call',
      targetUserId: `client-${testNumber}`,
      roomId: 'test-room',
      callId: `call-${Date.now()}`
    }));
  };

  // Answer call
  const answerCall = () => {
    if (!ws || !incomingCall) {
      addLog('❌ Aucun appel entrant');
      return;
    }
    
    addLog('📞 Réponse à l\'appel...');
    ws.send(JSON.stringify({
      type: 'answer',
      callId: incomingCall,
      accept: true
    }));
  };

  // End call
  const endCall = () => {
    if (!ws) {
      addLog('❌ Non connecté');
      return;
    }
    
    addLog('📴 Raccrochage...');
    ws.send(JSON.stringify({
      type: 'hangup',
      callId: `call-${Date.now()}`
    }));
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
            Test VoIP Call Direct
          </h1>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Controls */}
            <div className="space-y-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <h2 className="text-lg font-semibold text-blue-800 mb-4">Contrôles</h2>
                
                <div className="space-y-3">
                  <button
                    onClick={connectVoIP}
                    disabled={!!ws}
                    className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white py-2 px-4 rounded-lg transition-colors"
                  >
                    {ws ? 'Connecté' : 'Connecter'}
                  </button>
                  
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={testNumber}
                      onChange={(e) => setTestNumber(e.target.value)}
                      placeholder="Numéro à appeler"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={makeCall}
                      disabled={!isRegistered}
                      className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      Appeler
                    </button>
                  </div>
                  
                  {incomingCall && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <p className="text-sm text-yellow-800 mb-2">
                        Appel entrant de: {incomingCall}
                      </p>
                      <button
                        onClick={answerCall}
                        className="w-full bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg transition-colors"
                      >
                        Répondre
                      </button>
                    </div>
                  )}
                  
                  <button
                    onClick={endCall}
                    disabled={!isRegistered}
                    className="w-full bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white py-2 px-4 rounded-lg transition-colors"
                  >
                    Raccrocher
                  </button>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Statut</h3>
                <p className={`text-sm font-medium ${
                  callStatus.includes('Erreur') ? 'text-red-600' : 
                  callStatus.includes('en cours') ? 'text-green-600' : 
                  'text-gray-600'
                }`}>
                  {callStatus}
                </p>
              </div>
            </div>
            
            {/* Logs */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Logs</h2>
              <div className="h-80 overflow-y-auto bg-white rounded border p-3 text-sm font-mono">
                {logs.length === 0 ? (
                  <p className="text-gray-500">Aucun log disponible</p>
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
                  Effacer les logs
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoIPCallTest;