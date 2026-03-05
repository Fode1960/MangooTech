import React, { useState, useEffect } from 'react';
import { Phone, PhoneCall, PhoneOff, User, Clock, MessageCircle, Video } from 'lucide-react';
import { unifiedCommunicationService } from '../services/UnifiedCommunicationService';

interface IncomingCall {
  id: string;
  from: string;
  fromName?: string;
  to: string;
  type: 'audio' | 'video';
  timestamp: Date;
}

interface IncomingCallModalProps {
  onAccept: (callId: string, type: 'audio' | 'video') => void;
  onReject: (callId: string) => void;
  onMessage: (callerNumber: string) => void;
}

export const IncomingCallModal: React.FC<IncomingCallModalProps> = ({
  onAccept,
  onReject,
  onMessage
}) => {
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const [ringing, setRinging] = useState(false);
  const [callTimer, setCallTimer] = useState(0);

  const communicationService = unifiedCommunicationService;

  useEffect(() => {
    const handleIncomingCall = (call: IncomingCall) => {
      setIncomingCall(call);
      setRinging(true);
      setCallTimer(0);
      
      // Jouer la sonnerie
      playRingtone();
    };

    const handleCallEnded = () => {
      setIncomingCall(null);
      setRinging(false);
      stopRingtone();
    };

    communicationService.on('incomingCall', handleIncomingCall);
    communicationService.on('callEnded', handleCallEnded);

    return () => {
      communicationService.off('incomingCall', handleIncomingCall);
      communicationService.off('callEnded', handleCallEnded);
      stopRingtone();
    };
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (ringing) {
      interval = setInterval(() => {
        setCallTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [ringing]);

  const playRingtone = () => {
    // Créer un son de sonnerie simple
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.type = 'sine';
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    
    // Pattern de sonnerie classique
    const playPattern = () => {
      oscillator.start();
      setTimeout(() => {
        oscillator.stop();
        setTimeout(() => {
          if (ringing) {
            const newOsc = audioContext.createOscillator();
            const newGain = audioContext.createGain();
            newOsc.connect(newGain);
            newGain.connect(audioContext.destination);
            newOsc.frequency.setValueAtTime(800, audioContext.currentTime);
            newOsc.type = 'sine';
            newGain.gain.setValueAtTime(0.3, audioContext.currentTime);
            newOsc.start();
            setTimeout(() => {
              newOsc.stop();
              if (ringing) {
                setTimeout(playPattern, 2000);
              }
            }, 1000);
          }
        }, 1000);
      }, 1000);
    };
    
    playPattern();
  };

  const stopRingtone = () => {
    setRinging(false);
    // Le context audio sera nettoyé automatiquement
  };

  const handleAccept = (type: 'audio' | 'video') => {
    if (incomingCall) {
      stopRingtone();
      onAccept(incomingCall.id, type);
      setIncomingCall(null);
    }
  };

  const handleReject = () => {
    if (incomingCall) {
      stopRingtone();
      onReject(incomingCall.id);
      setIncomingCall(null);
    }
  };

  const handleMessage = () => {
    if (incomingCall) {
      stopRingtone();
      onMessage(incomingCall.from);
      setIncomingCall(null);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatPhoneNumber = (number: string) => {
    return number.replace(/(\d{2})/g, '$1 ').trim();
  };

  if (!incomingCall) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header avec animation */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 opacity-75">
            <div className={`absolute inset-0 bg-white opacity-20 rounded-full ${ringing ? 'animate-ping' : ''}`}></div>
          </div>
          <div className="relative z-10 text-center">
            <Phone className={`h-16 w-16 mx-auto mb-4 ${ringing ? 'animate-bounce' : ''}`} />
            <h2 className="text-2xl font-bold mb-2">Appel entrant</h2>
            <p className="text-blue-100">
              {incomingCall.fromName || 'Appelant inconnu'}
            </p>
            <p className="text-sm text-blue-200 mt-1">
              {formatPhoneNumber(incomingCall.from)}
            </p>
            {ringing && (
              <div className="flex items-center justify-center mt-3 text-blue-100">
                <Clock className="h-4 w-4 mr-2" />
                <span className="text-sm">{formatDuration(callTimer)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Type d'appel */}
        <div className="p-6">
          <div className="flex items-center justify-center mb-6">
            <div className={`flex items-center space-x-2 px-4 py-2 rounded-full ${
              incomingCall.type === 'video' 
                ? 'bg-purple-100 text-purple-800' 
                : 'bg-blue-100 text-blue-800'
            }`}>
              {incomingCall.type === 'video' ? (
                <><Video className="h-4 w-4" /> <span className="text-sm font-medium">Appel vidéo</span></>
              ) : (
                <><Phone className="h-4 w-4" /> <span className="text-sm font-medium">Appel audio</span></>
              )}
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            {/* Accepter l'appel */}
            <button
              onClick={() => handleAccept('audio')}
              className="bg-green-500 hover:bg-green-600 text-white p-4 rounded-xl transition-all duration-200 transform hover:scale-105 flex flex-col items-center space-y-2"
            >
              <PhoneCall className="h-8 w-8" />
              <span className="text-sm font-medium">Accepter</span>
            </button>

            {/* Rejeter l'appel */}
            <button
              onClick={handleReject}
              className="bg-red-500 hover:bg-red-600 text-white p-4 rounded-xl transition-all duration-200 transform hover:scale-105 flex flex-col items-center space-y-2"
            >
              <PhoneOff className="h-8 w-8" />
              <span className="text-sm font-medium">Rejeter</span>
            </button>
          </div>

          {/* Actions supplémentaires */}
          {incomingCall.type === 'video' && (
            <button
              onClick={() => handleAccept('video')}
              className="w-full bg-purple-500 hover:bg-purple-600 text-white p-3 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 mb-3"
            >
              <Video className="h-5 w-5" />
              <span className="text-sm font-medium">Accepter en vidéo</span>
            </button>
          )}

          <button
            onClick={handleMessage}
            className="w-full bg-gray-500 hover:bg-gray-600 text-white p-3 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2"
          >
            <MessageCircle className="h-5 w-5" />
            <span className="text-sm font-medium">Envoyer un message</span>
          </button>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-3 text-center">
          <p className="text-xs text-gray-500">
            Appel via MangooTech Communication
          </p>
        </div>
      </div>
    </div>
  );
};

export default IncomingCallModal;