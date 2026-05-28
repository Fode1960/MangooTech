import React, { useState, useEffect } from 'react';
import { Phone, PhoneOff, Hash, Star, User, Clock, Plus, Minus, RotateCcw } from 'lucide-react';

interface DialPadProps {
  onCall: (number: string) => void;
  onHangup: () => void;
  currentCall?: {
    number: string;
    status: 'calling' | 'connected' | 'incoming';
    duration: number;
  };
  recentCalls?: Array<{
    id: string;
    number: string;
    name?: string;
    type: 'outgoing' | 'incoming' | 'missed';
    duration: number;
    timestamp: Date;
  }>;
  contacts?: Array<{
    id: string;
    name: string;
    number: string;
    avatar?: string;
  }>;
}

const DialPad: React.FC<DialPadProps> = ({ 
  onCall, 
  onHangup, 
  currentCall, 
  recentCalls = [], 
  contacts = [] 
}) => {
  const [display, setDisplay] = useState('');
  const [activeTab, setActiveTab] = useState<'dial' | 'recent' | 'contacts'>('dial');
  const [isMuted, setIsMuted] = useState(false);
  const [isOnHold, setIsOnHold] = useState(false);
  const [showKeypad, setShowKeypad] = useState(false);
  const [dtmfTone, setDtmfTone] = useState('');

  const dialPad = [
    ['1', '', ''],
    ['2', 'ABC', ''],
    ['3', 'DEF', ''],
    ['4', 'GHI', ''],
    ['5', 'JKL', ''],
    ['6', 'MNO', ''],
    ['7', 'PQRS', ''],
    ['8', 'TUV', ''],
    ['9', 'WXYZ', ''],
    ['*', '', ''],
    ['0', '+', ''],
    ['#', '', '']
  ];

  const handleDigitPress = (digit: string) => {
    if (currentCall?.status === 'connected') {
      // Envoyer DTMF pendant l'appel
      sendDTMF(digit);
      setDtmfTone(digit);
      setTimeout(() => setDtmfTone(''), 200);
    } else {
      // Ajouter au numéro
      setDisplay(prev => prev + digit);
    }
  };

  const sendDTMF = (digit: string) => {
    // Émettre l'événement DTMF via WebSocket
    if (window.wsConnection) {
      window.wsConnection.send(JSON.stringify({
        type: 'dtmf',
        callId: currentCall?.number,
        digit: digit
      }));
    }
  };

  const handleCallPress = () => {
    if (display.trim()) {
      onCall(display.trim());
    }
  };

  const handleHangupPress = () => {
    onHangup();
    setDisplay('');
  };

  const handleContactCall = (number: string) => {
    setDisplay(number);
    onCall(number);
  };

  const handleRecentCall = (call: any) => {
    setDisplay(call.number);
    onCall(call.number);
  };

  const clearDisplay = () => {
    setDisplay('');
  };

  const deleteLastDigit = () => {
    setDisplay(prev => prev.slice(0, -1));
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) {
      return 'À l\'instant';
    } else if (hours < 24) {
      return `Il y a ${hours}h`;
    } else {
      return date.toLocaleDateString();
    }
  };

  // Effet pour créer les sons DTMF
  useEffect(() => {
    // Créer l'objet audio pour les sons DTMF
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    const playDtmfTone = (digit: string) => {
      const frequencies = {
        '1': [697, 1209], '2': [697, 1336], '3': [697, 1477],
        '4': [770, 1209], '5': [770, 1336], '6': [770, 1477],
        '7': [852, 1209], '8': [852, 1336], '9': [852, 1477],
        '*': [941, 1209], '0': [941, 1336], '#': [941, 1477]
      };
      
      if (frequencies[digit]) {
        const [f1, f2] = frequencies[digit];
        const duration = 0.1; // 100ms
        
        const oscillator1 = audioContext.createOscillator();
        const oscillator2 = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator1.connect(gainNode);
        oscillator2.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator1.frequency.value = f1;
        oscillator2.frequency.value = f2;
        
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
        
        oscillator1.start(audioContext.currentTime);
        oscillator2.start(audioContext.currentTime);
        oscillator1.stop(audioContext.currentTime + duration);
        oscillator2.stop(audioContext.currentTime + duration);
      }
    };
    
    // Jouer le son si un digit est actif
    if (dtmfTone) {
      playDtmfTone(dtmfTone);
    }
    
    return () => {
      audioContext.close();
    };
  }, [dtmfTone]);

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* En-tête avec onglets */}
      <div className="bg-gradient-to-r from-orange-500 to-yellow-500 p-4">
        <div className="flex space-x-1">
          <button
            onClick={() => setActiveTab('dial')}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'dial'
                ? 'bg-white text-orange-600 shadow-md'
                : 'bg-orange-400 bg-opacity-50 text-white hover:bg-opacity-70'
            }`}
          >
            <Phone className="w-4 h-4 mx-auto mb-1" />
            Composer
          </button>
          <button
            onClick={() => setActiveTab('recent')}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'recent'
                ? 'bg-white text-orange-600 shadow-md'
                : 'bg-orange-400 bg-opacity-50 text-white hover:bg-opacity-70'
            }`}
          >
            <Clock className="w-4 h-4 mx-auto mb-1" />
            Récents
          </button>
          <button
            onClick={() => setActiveTab('contacts')}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'contacts'
                ? 'bg-white text-orange-600 shadow-md'
                : 'bg-orange-400 bg-opacity-50 text-white hover:bg-opacity-70'
            }`}
          >
            <User className="w-4 h-4 mx-auto mb-1" />
            Contacts
          </button>
        </div>
      </div>

      {/* Affichage de l'appel actuel */}
      {currentCall && (
        <div className="bg-green-50 border-b border-green-200 p-4">
          <div className="text-center">
            <div className="text-green-800 font-semibold mb-1">
              {currentCall.status === 'calling' && 'Appel en cours...'}
              {currentCall.status === 'connected' && 'Appel connecté'}
              {currentCall.status === 'incoming' && 'Appel entrant'}
            </div>
            <div className="text-green-600 text-sm mb-2">{currentCall.number}</div>
            <div className="text-green-800 font-mono text-lg">
              {formatDuration(currentCall.duration)}
            </div>
            
            {/* Contrôles d'appel */}
            <div className="flex justify-center space-x-3 mt-3">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className={`p-2 rounded-full transition-colors ${
                  isMuted ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              
              <button
                onClick={() => setIsOnHold(!isOnHold)}
                className={`p-2 rounded-full transition-colors ${
                  isOnHold ? 'bg-yellow-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <Pause className="w-4 h-4" />
              </button>
              
              <button
                onClick={() => setShowKeypad(!showKeypad)}
                className={`p-2 rounded-full transition-colors ${
                  showKeypad ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <Hash className="w-4 h-4" />
              </button>
              
              <button
                onClick={handleHangupPress}
                className="p-2 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
              >
                <PhoneOff className="w-4 h-4" />
              </button>
            </div>
            
            {/* Clavier DTMF */}
            {showKeypad && (
              <div className="mt-4 bg-white rounded-lg p-3">
                <div className="grid grid-cols-3 gap-2">
                  {dialPad.map((row, rowIndex) => (
                    <React.Fragment key={rowIndex}>
                      {row.map((digit, colIndex) => (
                        <button
                          key={`${rowIndex}-${colIndex}`}
                          onClick={() => digit && handleDigitPress(digit)}
                          className="aspect-square bg-gray-100 hover:bg-gray-200 rounded-lg flex flex-col items-center justify-center transition-colors"
                          disabled={!digit}
                        >
                          <span className="text-lg font-semibold text-gray-800">
                            {digit || ''}
                          </span>
                          {row[colIndex + 1] && (
                            <span className="text-xs text-gray-500">
                              {row[colIndex + 1]}
                            </span>
                          )}
                        </button>
                      ))}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Contenu selon l'onglet actif */}
      <div className="p-4">
        {activeTab === 'dial' && (
          <div className="space-y-4">
            {/* Écran d'affichage */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <input
                  type="tel"
                  value={display}
                  onChange={(e) => setDisplay(e.target.value)}
                  className="flex-1 bg-transparent text-2xl font-mono text-gray-800 outline-none"
                  placeholder="Numéro..."
                />
                <div className="flex space-x-2">
                  <button
                    onClick={deleteLastDigit}
                    className="p-2 text-gray-500 hover:text-gray-700"
                    disabled={!display}
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                  <button
                    onClick={clearDisplay}
                    className="p-2 text-gray-500 hover:text-gray-700"
                    disabled={!display}
                  >
                    <RotateCcw className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Clavier numérique */}
            <div className="grid grid-cols-3 gap-3">
              {dialPad.map((row, rowIndex) => (
                <React.Fragment key={rowIndex}>
                  {row.map((digit, colIndex) => (
                    <button
                      key={`${rowIndex}-${colIndex}`}
                      onClick={() => digit && handleDigitPress(digit)}
                      className="aspect-square bg-gray-100 hover:bg-gray-200 rounded-xl flex flex-col items-center justify-center transition-colors text-xl font-semibold text-gray-800"
                      disabled={!digit}
                    >
                      <span>{digit || ''}</span>
                      {row[colIndex + 1] && (
                        <span className="text-xs text-gray-500 mt-1">
                          {row[colIndex + 1]}
                        </span>
                      )}
                    </button>
                  ))}
                </React.Fragment>
              ))}
            </div>

            {/* Bouton d'appel */}
            <button
              onClick={handleCallPress}
              disabled={!display.trim() || currentCall?.status === 'calling'}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-300 disabled:to-gray-400 text-white py-4 rounded-xl font-semibold text-lg transition-all duration-200 flex items-center justify-center space-x-2"
            >
              <Phone className="w-6 h-6" />
              <span>Appeler</span>
            </button>
          </div>
        )}

        {activeTab === 'recent' && (
          <div className="space-y-2">
            {recentCalls.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Aucun appel récent</p>
              </div>
            ) : (
              recentCalls.map((call) => (
                <div
                  key={call.id}
                  onClick={() => handleRecentCall(call)}
                  className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      call.type === 'outgoing' ? 'bg-green-100 text-green-600' :
                      call.type === 'incoming' ? 'bg-blue-100 text-blue-600' :
                      'bg-red-100 text-red-600'
                    }`}>
                      {call.type === 'outgoing' && <Phone className="w-4 h-4" />}
                      {call.type === 'incoming' && <Phone className="w-4 h-4" />}
                      {call.type === 'missed' && <PhoneOff className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="font-medium text-gray-800">
                        {call.name || call.number}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatTimestamp(call.timestamp)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600">
                      {formatDuration(call.duration)}
                    </div>
                    <div className="text-xs text-gray-400">
                      {call.type === 'outgoing' && 'Sortant'}
                      {call.type === 'incoming' && 'Entrant'}
                      {call.type === 'missed' && 'Manqué'}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'contacts' && (
          <div className="space-y-2">
            {contacts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <User className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Aucun contact</p>
              </div>
            ) : (
              contacts.map((contact) => (
                <div
                  key={contact.id}
                  className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-orange-400 to-yellow-400 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-800">
                        {contact.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {contact.number}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleContactCall(contact.number)}
                    className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-full transition-colors"
                  >
                    <Phone className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DialPad;