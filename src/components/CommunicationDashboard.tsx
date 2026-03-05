import React, { useState, useEffect } from 'react';
import { Phone, PhoneCall, PhoneOff, Video, VideoOff, Mic, MicOff, Settings, Users, Activity } from 'lucide-react';
import { useUnifiedCommunication } from '../hooks/useUnifiedCommunication';

interface CommunicationDashboardProps {
  boutiqueId: string;
  boutiqueName: string;
}

interface Call {
  id: string;
  type: 'incoming' | 'outgoing';
  from: string;
  to: string;
  status: 'ringing' | 'connected' | 'ended';
  startTime?: Date;
  duration?: number;
}

interface SipConfig {
  number: string;
  registered: boolean;
  status: 'connected' | 'disconnected' | 'registering';
}

export const CommunicationDashboard: React.FC<CommunicationDashboardProps> = ({
  boutiqueId,
  boutiqueName
}) => {
  const [activeCalls, setActiveCalls] = useState<Call[]>([]);
  const [sipConfig, setSipConfig] = useState<SipConfig>({
    number: '',
    registered: false,
    status: 'disconnected'
  });
  const [dialNumber, setDialNumber] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [callHistory, setCallHistory] = useState<Call[]>([]);
  const [liveShoppingMode, setLiveShoppingMode] = useState(false);
  const [participants, setParticipants] = useState(0);

  const {
    initialize,
    makeCall,
    answerCall,
    endCall,
    muteAudio,
    toggleVideo,
    shareScreen,
    connectionStatus,
    currentCall
  } = useUnifiedCommunication();

  useEffect(() => {
    // Initialiser le service de communication
    initialize(boutiqueId);
    
    // Charger la configuration SIP
    loadSipConfiguration();
    
    // Simuler des appels entrants pour la démo
    simulateIncomingCalls();
  }, [boutiqueId]);

  const loadSipConfiguration = async () => {
    try {
      const response = await fetch(`/api/boutiques/${boutiqueId}/sip-config`);
      const config = await response.json();
      setSipConfig({
        number: config.number || '+33123456789',
        registered: config.registered || true,
        status: config.status || 'connected'
      });
    } catch (error) {
      console.error('Erreur lors du chargement de la config SIP:', error);
      // Configuration par défaut pour la démo
      setSipConfig({
        number: '+33123456789',
        registered: true,
        status: 'connected'
      });
    }
  };

  const simulateIncomingCalls = () => {
    // Simuler un appel entrant après 10 secondes
    setTimeout(() => {
      const incomingCall: Call = {
        id: 'call-001',
        type: 'incoming',
        from: '+33612345678',
        to: sipConfig.number,
        status: 'ringing'
      };
      setActiveCalls(prev => [...prev, incomingCall]);
    }, 10000);
  };

  const handleMakeCall = async () => {
    if (!dialNumber) return;
    
    try {
      const callId = await makeCall(dialNumber, 'audio');
      const newCall: Call = {
        id: callId,
        type: 'outgoing',
        from: sipConfig.number,
        to: dialNumber,
        status: 'ringing',
        startTime: new Date()
      };
      setActiveCalls(prev => [...prev, newCall]);
      setDialNumber('');
    } catch (error) {
      console.error('Erreur lors de l\'appel:', error);
    }
  };

  const handleAnswerCall = async (callId: string) => {
    try {
      await answerCall(callId);
      setActiveCalls(prev => 
        prev.map(call => 
          call.id === callId 
            ? { ...call, status: 'connected', startTime: new Date() }
            : call
        )
      );
    } catch (error) {
      console.error('Erreur lors de la réponse:', error);
    }
  };

  const handleEndCall = async (callId: string) => {
    try {
      await endCall(callId);
      const endedCall = activeCalls.find(call => call.id === callId);
      if (endedCall) {
        setCallHistory(prev => [...prev, endedCall]);
      }
      setActiveCalls(prev => prev.filter(call => call.id !== callId));
    } catch (error) {
      console.error('Erreur lors de la fin d\'appel:', error);
    }
  };

  const handleMuteToggle = () => {
    muteAudio(!isMuted);
    setIsMuted(!isMuted);
  };

  const handleVideoToggle = () => {
    toggleVideo(!isVideoOff);
    setIsVideoOff(!isVideoOff);
  };

  const handleLiveShoppingToggle = () => {
    setLiveShoppingMode(!liveShoppingMode);
    if (!liveShoppingMode) {
      setParticipants(Math.floor(Math.random() * 50) + 10);
    }
  };

  const formatDuration = (startTime: Date) => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - startTime.getTime()) / 1000);
    const minutes = Math.floor(diff / 60);
    const seconds = diff % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          Centre de Communication - {boutiqueName}
        </h2>
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${
            connectionStatus === 'connected' ? 'bg-green-500' : 
            connectionStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
          }`}></div>
          <span className="text-sm text-gray-600">
            {connectionStatus === 'connected' ? 'Connecté' : 
             connectionStatus === 'connecting' ? 'Connexion...' : 'Déconnecté'}
          </span>
        </div>
      </div>

      {/* Configuration SIP */}
      <div className="bg-blue-50 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-blue-800">Numéro SIP</h3>
            <p className="text-blue-600">{sipConfig.number}</p>
            <p className={`text-sm ${
              sipConfig.status === 'connected' ? 'text-green-600' : 
              sipConfig.status === 'registering' ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {sipConfig.status === 'connected' ? '✅ Enregistré' : 
               sipConfig.status === 'registering' ? '⏳ Enregistrement...' : '❌ Non enregistré'}
            </p>
          </div>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Mode Live Shopping */}
      <div className="bg-purple-50 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-purple-800">Mode Live Shopping</h3>
            <p className="text-purple-600">
              {liveShoppingMode ? `🎥 En direct avec ${participants} participants` : 'Arrêté'}
            </p>
          </div>
          <button
            onClick={handleLiveShoppingToggle}
            className={`px-4 py-2 rounded-lg font-medium ${
              liveShoppingMode 
                ? 'bg-red-600 text-white hover:bg-red-700' 
                : 'bg-purple-600 text-white hover:bg-purple-700'
            }`}
          >
            {liveShoppingMode ? 'Arrêter le Live' : 'Démarrer le Live'}
          </button>
        </div>
      </div>

      {/* Composeur d'appel */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Composer un numéro</h3>
        <div className="flex space-x-2">
          <input
            type="tel"
            value={dialNumber}
            onChange={(e) => setDialNumber(e.target.value)}
            placeholder="+33XXXXXXXXX"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleMakeCall}
            disabled={!dialNumber}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <PhoneCall className="w-4 h-4" />
            <span>Appeler</span>
          </button>
        </div>
      </div>

      {/* Appels actifs */}
      {activeCalls.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Appels Actifs</h3>
          <div className="space-y-3">
            {activeCalls.map((call) => (
              <div key={call.id} className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-800">
                      {call.type === 'incoming' ? '→' : '←'} {call.from}
                    </p>
                    <p className="text-sm text-gray-600">
                      {call.status === 'connected' && call.startTime ? 
                        `Durée: ${formatDuration(call.startTime)}` : 
                        call.status === 'ringing' ? 'Sonnerie...' : 'En cours...'
                      }
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    {call.status === 'ringing' && call.type === 'incoming' && (
                      <button
                        onClick={() => handleAnswerCall(call.id)}
                        className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        <PhoneCall className="w-4 h-4" />
                      </button>
                    )}
                    {call.status === 'connected' && (
                      <>
                        <button
                          onClick={handleMuteToggle}
                          className={`p-2 rounded-lg ${
                            isMuted ? 'bg-red-600 text-white' : 'bg-gray-600 text-white'
                          }`}
                        >
                          {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={handleVideoToggle}
                          className={`p-2 rounded-lg ${
                            isVideoOff ? 'bg-red-600 text-white' : 'bg-gray-600 text-white'
                          }`}
                        >
                          {isVideoOff ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleEndCall(call.id)}
                      className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      <PhoneOff className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <Phone className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-2xl font-bold text-blue-800">{callHistory.length}</p>
              <p className="text-blue-600">Appels totaux</p>
            </div>
          </div>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <Users className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-2xl font-bold text-green-800">{activeCalls.length}</p>
              <p className="text-green-600">Appels actifs</p>
            </div>
          </div>
        </div>
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <Activity className="w-8 h-8 text-purple-600" />
            <div>
              <p className="text-2xl font-bold text-purple-800">{participants}</p>
              <p className="text-purple-600">Participants live</p>
            </div>
          </div>
        </div>
      </div>

      {/* Paramètres */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Paramètres de Communication</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Numéro SIP
                </label>
                <input
                  type="tel"
                  value={sipConfig.number}
                  onChange={(e) => setSipConfig(prev => ({ ...prev, number: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Mode Live Shopping</span>
                <button
                  onClick={handleLiveShoppingToggle}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    liveShoppingMode ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      liveShoppingMode ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  // Sauvegarder les paramètres
                  setShowSettings(false);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Sauvegarder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunicationDashboard;