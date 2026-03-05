import React, { useState, useEffect } from 'react';
import { Phone, Plus, Settings, PhoneCall, PhoneOff, User, Building } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { unifiedCommunicationService } from '../services/UnifiedCommunicationService';

interface PhoneNumber {
  id: string;
  number: string;
  extension: string;
  status: 'active' | 'inactive' | 'busy';
  assignedTo: string;
  type: 'main' | 'department' | 'mobile';
  forwardTo?: string;
  voicemailEnabled: boolean;
}

interface CallHistory {
  id: string;
  from: string;
  to: string;
  type: 'incoming' | 'outgoing' | 'missed';
  duration: number;
  timestamp: Date;
  status: 'completed' | 'failed' | 'ongoing';
}

export const VendorPhoneManager: React.FC = () => {
  const { user } = useAuth();
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([]);
  const [callHistory, setCallHistory] = useState<CallHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCall, setActiveCall] = useState<any>(null);
  const [showAddNumber, setShowAddNumber] = useState(false);
  const [showSettings, setShowSettings] = useState<string | null>(null);
  const [newNumber, setNewNumber] = useState({ extension: '', type: 'department' as const });

  const communicationService = unifiedCommunicationService;

  useEffect(() => {
    loadPhoneNumbers();
    loadCallHistory();
    setupCallListeners();
  }, []);

  const loadPhoneNumbers = async () => {
    try {
      const numbers = await communicationService.getPhoneNumbers(user?.id || '');
      setPhoneNumbers(numbers);
    } catch (error) {
      console.error('Erreur chargement numéros:', error);
      // Données de démonstration
      setPhoneNumbers([
        {
          id: '1',
          number: '+33-1-23-45-67-89',
          extension: '100',
          status: 'active',
          assignedTo: 'Boutique Principale',
          type: 'main',
          voicemailEnabled: true
        },
        {
          id: '2',
          number: '+33-1-23-45-67-90',
          extension: '101',
          status: 'inactive',
          assignedTo: 'Service Client',
          type: 'department',
          voicemailEnabled: true
        }
      ]);
    }
    setLoading(false);
  };

  const loadCallHistory = async () => {
    try {
      const history = await communicationService.getCallHistory(user?.id || '');
      setCallHistory(history);
    } catch (error) {
      console.error('Erreur chargement historique:', error);
      // Données de démonstration
      setCallHistory([
        {
          id: '1',
          from: '+33-6-12-34-56-78',
          to: '+33-1-23-45-67-89',
          type: 'incoming',
          duration: 185,
          timestamp: new Date(Date.now() - 3600000),
          status: 'completed'
        },
        {
          id: '2',
          from: '+33-1-23-45-67-89',
          to: '+33-6-98-76-54-32',
          type: 'outgoing',
          duration: 0,
          timestamp: new Date(Date.now() - 7200000),
          status: 'failed'
        }
      ]);
    }
  };

  const setupCallListeners = () => {
    communicationService.on('incomingCall', (call) => {
      setActiveCall(call);
    });

    communicationService.on('callEnded', () => {
      setActiveCall(null);
      loadCallHistory();
    });
  };

  const handleAddNumber = async () => {
    try {
      await communicationService.assignPhoneNumber({
        vendorId: user?.id || '',
        extension: newNumber.extension,
        type: newNumber.type
      });
      loadPhoneNumbers();
      setShowAddNumber(false);
      setNewNumber({ extension: '', type: 'department' });
    } catch (error) {
      console.error('Erreur attribution numéro:', error);
    }
  };

  const handleToggleStatus = async (numberId: string, currentStatus: string) => {
    try {
      await communicationService.updatePhoneNumber(numberId, {
        status: currentStatus === 'active' ? 'inactive' : 'active'
      });
      loadPhoneNumbers();
    } catch (error) {
      console.error('Erreur mise à jour statut:', error);
    }
  };

  const handleAnswerCall = async () => {
    if (activeCall) {
      await communicationService.answerCall(activeCall.id);
    }
  };

  const handleEndCall = async () => {
    if (activeCall) {
      await communicationService.endCall(activeCall.id);
    }
    setActiveCall(null);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatPhoneNumber = (number: string) => {
    return number.replace(/(\d{2})/g, '$1-').slice(0, -1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Appel actif */}
      {activeCall && (
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-4 rounded-lg shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <PhoneCall className="h-6 w-6 animate-pulse" />
              <div>
                <p className="font-semibold">Appel en cours</p>
                <p className="text-sm opacity-90">{formatPhoneNumber(activeCall.from)}</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleAnswerCall}
                className="bg-white text-green-600 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Répondre
              </button>
              <button
                onClick={handleEndCall}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
              >
                Raccrocher
              </button>
            </div>
          </div>
        </div>
      )}

      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestion Téléphonique</h2>
          <p className="text-gray-600">Configurez et gérez vos numéros de téléphone</p>
        </div>
        <button
          onClick={() => setShowAddNumber(true)}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>Ajouter un numéro</span>
        </button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Numéros Actifs</p>
              <p className="text-2xl font-bold text-gray-900">
                {phoneNumbers.filter(n => n.status === 'active').length}
              </p>
            </div>
            <Phone className="h-8 w-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Appels Aujourd'hui</p>
              <p className="text-2xl font-bold text-gray-900">
                {callHistory.filter(c => 
                  c.timestamp.toDateString() === new Date().toDateString()
                ).length}
              </p>
            </div>
            <PhoneCall className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Durée Totale</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatDuration(callHistory.reduce((acc, call) => acc + call.duration, 0))}
              </p>
            </div>
            <User className="h-8 w-8 text-purple-500" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Messagerie</p>
              <p className="text-2xl font-bold text-gray-900">
                {phoneNumbers.filter(n => n.voicemailEnabled).length}
              </p>
            </div>
            <Building className="h-8 w-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Liste des numéros */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Numéros de Téléphone</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {phoneNumbers.map((number) => (
            <div key={number.id} className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`p-2 rounded-full ${
                  number.status === 'active' ? 'bg-green-100' :
                  number.status === 'busy' ? 'bg-red-100' : 'bg-gray-100'
                }`}>
                  <Phone className={`h-5 w-5 ${
                    number.status === 'active' ? 'text-green-600' :
                    number.status === 'busy' ? 'text-red-600' : 'text-gray-400'
                  }`} />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{number.number}</p>
                  <p className="text-sm text-gray-600">Poste: {number.extension} • {number.assignedTo}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      number.status === 'active' ? 'bg-green-100 text-green-800' :
                      number.status === 'busy' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {number.status === 'active' ? 'Actif' :
                       number.status === 'busy' ? 'Occupé' : 'Inactif'}
                    </span>
                    {number.voicemailEnabled && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Messagerie
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleToggleStatus(number.id, number.status)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    number.status === 'active'
                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  {number.status === 'active' ? 'Désactiver' : 'Activer'}
                </button>
                <button
                  onClick={() => setShowSettings(number.id)}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <Settings className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Historique des appels */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Historique des Appels</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {callHistory.slice(0, 10).map((call) => (
            <div key={call.id} className="px-6 py-3 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`p-1 rounded-full ${
                  call.type === 'incoming' ? 'bg-blue-100' :
                  call.type === 'outgoing' ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  {call.type === 'incoming' ? (
                    <PhoneCall className="h-4 w-4 text-blue-600" />
                  ) : call.type === 'outgoing' ? (
                    <PhoneCall className="h-4 w-4 text-green-600" />
                  ) : (
                    <PhoneOff className="h-4 w-4 text-red-600" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {call.type === 'incoming' ? `De: ${call.from}` : `Vers: ${call.to}`}
                  </p>
                  <p className="text-xs text-gray-600">
                    {call.timestamp.toLocaleString()} • {formatDuration(call.duration)}
                  </p>
                </div>
              </div>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                call.status === 'completed' ? 'bg-green-100 text-green-800' :
                call.status === 'failed' ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {call.status === 'completed' ? 'Terminé' :
                 call.status === 'failed' ? 'Échoué' : 'En cours'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Modal ajout numéro */}
      {showAddNumber && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Ajouter un Numéro</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Extension</label>
                <input
                  type="text"
                  value={newNumber.extension}
                  onChange={(e) => setNewNumber({ ...newNumber, extension: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Ex: 102"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={newNumber.type}
                  onChange={(e) => setNewNumber({ ...newNumber, type: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="department">Département</option>
                  <option value="mobile">Mobile</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAddNumber(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleAddNumber}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
              >
                Ajouter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};