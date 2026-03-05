import React, { useState, useEffect } from 'react';
import { Users, Calendar, DollarSign, TrendingUp, Shield, Clock, Award, AlertCircle, CheckCircle, Plus, Minus, Send, History, Target } from 'lucide-react';

interface TontineMember {
  id: string;
  name: string;
  phone: string;
  contribution: number;
  totalContributed: number;
  position: number;
  hasReceived: boolean;
  joinDate: Date;
  boutiqueId: string;
}

interface TontineCycle {
  id: string;
  name: string;
  description: string;
  members: TontineMember[];
  totalAmount: number;
  contributionAmount: number;
  frequency: 'weekly' | 'monthly';
  startDate: Date;
  endDate: Date;
  currentPosition: number;
  status: 'active' | 'completed' | 'pending';
  boutiqueId: string;
  createdBy: string;
}

interface TontineInvitation {
  id: string;
  phone: string;
  status: 'pending' | 'accepted' | 'rejected';
  sentDate: Date;
  responseDate?: Date;
  cycleId: string;
}

const TontinesNumeriques: React.FC = () => {
  const [cycles, setCycles] = useState<TontineCycle[]>([]);
  const [invitations, setInvitations] = useState<TontineInvitation[]>([]);
  const [activeTab, setActiveTab] = useState<'active' | 'create' | 'invitations' | 'history'>('active');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedCycle, setSelectedCycle] = useState<TontineCycle | null>(null);
  const [showInvitationModal, setShowInvitationModal] = useState(false);
  const [showContributeModal, setShowContributeModal] = useState(false);
  const [currentUser, setCurrentUser] = useState({ id: 'user-001', name: 'Utilisateur Test', phone: '+221771234567' });

  // Formulaire de création
  const [newCycle, setNewCycle] = useState({
    name: '',
    description: '',
    contributionAmount: 10000,
    frequency: 'weekly' as 'weekly' | 'monthly',
    maxMembers: 10,
    startDate: new Date().toISOString().split('T')[0],
    boutiqueId: 'boutique-001'
  });

  // Données de démonstration
  useEffect(() => {
    const demoCycles: TontineCycle[] = [
      {
        id: 'cycle-001',
        name: "Tontine Commerce de N'Diaye",
        description: 'Tontine hebdomadaire pour les commerçants du marché',
        members: [
          {
            id: 'member-001',
            name: 'Aminata Diop',
            phone: '+221771234567',
            contribution: 10000,
            totalContributed: 30000,
            position: 1,
            hasReceived: true,
            joinDate: new Date('2024-01-01'),
            boutiqueId: 'boutique-001'
          },
          {
            id: 'member-002',
            name: 'Moussa Sow',
            phone: '+221778765432',
            contribution: 10000,
            totalContributed: 20000,
            position: 2,
            hasReceived: false,
            joinDate: new Date('2024-01-01'),
            boutiqueId: 'boutique-002'
          },
          {
            id: 'member-003',
            name: 'Fatou Ba',
            phone: '+221775556666',
            contribution: 10000,
            totalContributed: 10000,
            position: 3,
            hasReceived: false,
            joinDate: new Date('2024-01-01'),
            boutiqueId: 'boutique-003'
          }
        ],
        totalAmount: 30000,
        contributionAmount: 10000,
        frequency: 'weekly',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-03-25'),
        currentPosition: 2,
        status: 'active',
        boutiqueId: 'boutique-001',
        createdBy: 'user-001'
      }
    ];

    const demoInvitations: TontineInvitation[] = [
      {
        id: 'invite-001',
        phone: '+221779998877',
        status: 'pending',
        sentDate: new Date(),
        cycleId: 'cycle-001'
      }
    ];

    setCycles(demoCycles);
    setInvitations(demoInvitations);
  }, []);

  const createCycle = () => {
    if (!newCycle.name || !newCycle.description) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    const cycle: TontineCycle = {
      id: `cycle-${Date.now()}`,
      name: newCycle.name,
      description: newCycle.description,
      members: [{
        id: `member-${Date.now()}`,
        name: currentUser.name,
        phone: currentUser.phone,
        contribution: 0,
        totalContributed: 0,
        position: 1,
        hasReceived: false,
        joinDate: new Date(),
        boutiqueId: newCycle.boutiqueId
      }],
      totalAmount: 0,
      contributionAmount: newCycle.contributionAmount,
      frequency: newCycle.frequency,
      startDate: new Date(newCycle.startDate),
      endDate: new Date(new Date(newCycle.startDate).getTime() + (newCycle.maxMembers * (newCycle.frequency === 'weekly' ? 7 : 30) * 24 * 60 * 60 * 1000)),
      currentPosition: 1,
      status: 'pending',
      boutiqueId: newCycle.boutiqueId,
      createdBy: currentUser.id
    };

    setCycles([...cycles, cycle]);
    setShowCreateForm(false);
    setNewCycle({
      name: '',
      description: '',
      contributionAmount: 10000,
      frequency: 'weekly',
      maxMembers: 10,
      startDate: new Date().toISOString().split('T')[0],
      boutiqueId: 'boutique-001'
    });
  };

  const inviteMember = (cycleId: string, phone: string) => {
    const invitation: TontineInvitation = {
      id: `invite-${Date.now()}`,
      phone,
      status: 'pending',
      sentDate: new Date(),
      cycleId
    };

    setInvitations([...invitations, invitation]);
    alert(`Invitation envoyée à ${phone}`);
  };

  const contribute = (cycleId: string, amount: number) => {
    setCycles(cycles.map(cycle => {
      if (cycle.id === cycleId) {
        const updatedMembers = cycle.members.map(member => {
          if (member.phone === currentUser.phone) {
            return {
              ...member,
              contribution: member.contribution + amount,
              totalContributed: member.totalContributed + amount
            };
          }
          return member;
        });

        return {
          ...cycle,
          members: updatedMembers,
          totalAmount: cycle.totalAmount + amount
        };
      }
      return cycle;
    }));
  };

  const nextPosition = (cycleId: string) => {
    setCycles(cycles.map(cycle => {
      if (cycle.id === cycleId && cycle.status === 'active') {
        const nextPos = cycle.currentPosition + 1;
        if (nextPos <= cycle.members.length) {
          return {
            ...cycle,
            currentPosition: nextPos
          };
        } else {
          return {
            ...cycle,
            status: 'completed'
          };
        }
      }
      return cycle;
    }));
  };

  const getCycleStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getNextPaymentDate = (cycle: TontineCycle) => {
    const today = new Date();
    const daysSinceStart = Math.floor((today.getTime() - cycle.startDate.getTime()) / (1000 * 60 * 60 * 24));
    const frequencyDays = cycle.frequency === 'weekly' ? 7 : 30;
    const daysUntilNext = frequencyDays - (daysSinceStart % frequencyDays);
    const nextDate = new Date(today.getTime() + (daysUntilNext * 24 * 60 * 60 * 1000));
    return nextDate;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* En-tête */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-gradient-to-r from-green-500 to-blue-500 p-3 rounded-full">
              <Users className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Tontines Numériques
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Révolutionnez l'épargne traditionnelle africaine avec des tontines numériques sécurisées 
            et transparentes pour vos mini-boutiques
          </p>
        </div>

        {/* Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-lg p-1 shadow-lg">
            {[
              { key: 'active', label: 'Tontines Actives', icon: <TrendingUp className="w-4 h-4" /> },
              { key: 'create', label: 'Créer', icon: <Plus className="w-4 h-4" /> },
              { key: 'invitations', label: 'Invitations', icon: <Users className="w-4 h-4" /> },
              { key: 'history', label: 'Historique', icon: <History className="w-4 h-4" /> }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`px-4 py-2 rounded-md font-medium transition-all duration-200 flex items-center space-x-2 ${
                  activeTab === tab.key
                    ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Contenu principal */}
        <div className="space-y-6">
          {activeTab === 'active' && (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {cycles.filter(cycle => cycle.status === 'active').map(cycle => (
                <div key={cycle.id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-gray-800">{cycle.name}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getCycleStatusColor(cycle.status)}`}>
                      {cycle.status.toUpperCase()}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 mb-4">{cycle.description}</p>
                  
                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Montant par contribution:</span>
                      <span className="font-semibold text-green-600">{cycle.contributionAmount.toLocaleString()} FCFA</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Total collecté:</span>
                      <span className="font-semibold text-blue-600">{cycle.totalAmount.toLocaleString()} FCFA</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Position actuelle:</span>
                      <span className="font-semibold">{cycle.currentPosition} / {cycle.members.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Prochain paiement:</span>
                      <span className="font-semibold text-orange-600">
                        {getNextPaymentDate(cycle).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => setSelectedCycle(cycle)}
                      className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                    >
                      Voir Détails
                    </button>
                    <button
                      onClick={() => setShowContributeModal(true)}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                    >
                      Contribuer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'create' && (
            <div className="max-w-2xl mx-auto">
              <div className="bg-white rounded-xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Créer une Nouvelle Tontine</h2>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nom de la tontine *
                    </label>
                    <input
                      type="text"
                      value={newCycle.name}
                      onChange={(e) => setNewCycle({ ...newCycle, name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="ex: Tontine des Commerçants"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description *
                    </label>
                    <textarea
                      value={newCycle.description}
                      onChange={(e) => setNewCycle({ ...newCycle, description: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      rows={3}
                      placeholder="Décrivez le but et les règles de cette tontine..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Montant par contribution (FCFA)
                      </label>
                      <input
                        type="number"
                        value={newCycle.contributionAmount}
                        onChange={(e) => setNewCycle({ ...newCycle, contributionAmount: parseInt(e.target.value) })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        min="1000"
                        step="1000"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Fréquence
                      </label>
                      <select
                        value={newCycle.frequency}
                        onChange={(e) => setNewCycle({ ...newCycle, frequency: e.target.value as 'weekly' | 'monthly' })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      >
                        <option value="weekly">Hebdomadaire</option>
                        <option value="monthly">Mensuelle</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nombre maximum de membres
                      </label>
                      <input
                        type="number"
                        value={newCycle.maxMembers}
                        onChange={(e) => setNewCycle({ ...newCycle, maxMembers: parseInt(e.target.value) })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        min="3"
                        max="50"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date de début
                      </label>
                      <input
                        type="date"
                        value={newCycle.startDate}
                        onChange={(e) => setNewCycle({ ...newCycle, startDate: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <Shield className="w-5 h-5 text-green-600" />
                      <span className="font-medium text-green-800">Sécurité et Transparence</span>
                    </div>
                    <p className="text-green-700 text-sm mt-2">
                      Toutes les contributions sont enregistrées de manière transparente. 
                      Les membres peuvent suivre l'évolution en temps réel.
                    </p>
                  </div>

                  <div className="flex space-x-4">
                    <button
                      onClick={() => setShowCreateForm(false)}
                      className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={createCycle}
                      className="flex-1 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200"
                    >
                      Créer la Tontine
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'invitations' && (
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Invitations en Attente</h2>
                
                <div className="space-y-4">
                  {invitations.filter(inv => inv.status === 'pending').map(invitation => (
                    <div key={invitation.id} className="border border-gray-200 rounded-lg p-4 flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="bg-yellow-100 p-2 rounded-full">
                          <Users className="w-5 h-5 text-yellow-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">Invitation à rejoindre une tontine</p>
                          <p className="text-sm text-gray-600">Numéro: {invitation.phone}</p>
                          <p className="text-xs text-gray-500">Envoyée le: {invitation.sentDate.toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                          Accepter
                        </button>
                        <button className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                          Refuser
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="max-w-6xl mx-auto">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Historique des Tontines</h2>
                
                <div className="space-y-4">
                  {cycles.filter(cycle => cycle.status === 'completed').map(cycle => (
                    <div key={cycle.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-semibold text-gray-800">{cycle.name}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getCycleStatusColor(cycle.status)}`}>
                          TERMINÉE
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Montant total:</span>
                          <p className="font-semibold text-green-600">{cycle.totalAmount.toLocaleString()} FCFA</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Membres:</span>
                          <p className="font-semibold">{cycle.members.length}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Période:</span>
                          <p className="font-semibold">{cycle.startDate.toLocaleDateString()} - {cycle.endDate.toLocaleDateString()}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Créée par:</span>
                          <p className="font-semibold">{cycle.createdBy}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Statistiques */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="bg-green-100 p-3 rounded-full w-12 h-12 mx-auto mb-4 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800">{cycles.length}</h3>
            <p className="text-gray-600">Tontines créées</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="bg-blue-100 p-3 rounded-full w-12 h-12 mx-auto mb-4 flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800">
              {cycles.reduce((total, cycle) => total + cycle.members.length, 0)}
            </h3>
            <p className="text-gray-600">Membres total</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="bg-yellow-100 p-3 rounded-full w-12 h-12 mx-auto mb-4 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-yellow-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800">
              {cycles.reduce((total, cycle) => total + cycle.totalAmount, 0).toLocaleString()}
            </h3>
            <p className="text-gray-600">FCFA collectés</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="bg-purple-100 p-3 rounded-full w-12 h-12 mx-auto mb-4 flex items-center justify-center">
              <Award className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800">
              {cycles.filter(c => c.status === 'completed').length}
            </h3>
            <p className="text-gray-600">Tontines terminées</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TontinesNumeriques;