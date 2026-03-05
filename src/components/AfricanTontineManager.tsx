import React, { useState, useEffect } from 'react';
import { Users, Calendar, TrendingUp, PiggyBank, HandHeart, Target, Award, Clock } from 'lucide-react';

interface TontineMember {
  id: string;
  name: string;
  phoneNumber: string;
  contribution: number;
  totalContributed: number;
  status: 'active' | 'inactive' | 'beneficiary';
  joinDate: Date;
  reliabilityScore: number;
}

interface TontineGroup {
  id: string;
  name: string;
  description: string;
  members: TontineMember[];
  totalAmount: number;
  contributionAmount: number;
  frequency: 'weekly' | 'monthly';
  nextPaymentDate: Date;
  currentBeneficiary: string;
  cycleNumber: number;
  totalCycles: number;
  status: 'active' | 'paused' | 'completed';
  createdBy: string;
  category: string;
}

interface Contribution {
  id: string;
  memberId: string;
  amount: number;
  date: Date;
  paymentMethod: 'mobile_money' | 'cash' | 'bank_transfer';
  status: 'pending' | 'confirmed' | 'late';
  cycleNumber: number;
}

const AfricanTontineManager: React.FC = () => {
  const [tontineGroups] = useState<TontineGroup[]>([
    {
      id: '1',
      name: 'Tontine des Femmes d\'Affaires de Dakar',
      description: 'Groupe d\'épargne rotative pour femmes entrepreneures',
      members: [
        {
          id: '1',
          name: 'Aminata Diop',
          phoneNumber: '+221 77 123 45 67',
          contribution: 50000,
          totalContributed: 300000,
          status: 'active',
          joinDate: new Date('2023-01-15'),
          reliabilityScore: 98
        },
        {
          id: '2',
          name: 'Fatou Sarr',
          phoneNumber: '+221 76 234 56 78',
          contribution: 50000,
          totalContributed: 250000,
          status: 'beneficiary',
          joinDate: new Date('2023-01-15'),
          reliabilityScore: 95
        },
        {
          id: '3',
          name: 'Marième Ba',
          phoneNumber: '+221 78 345 67 89',
          contribution: 50000,
          totalContributed: 200000,
          status: 'active',
          joinDate: new Date('2023-01-15'),
          reliabilityScore: 100
        }
      ],
      totalAmount: 500000,
      contributionAmount: 50000,
      frequency: 'monthly',
      nextPaymentDate: new Date('2024-02-15'),
      currentBeneficiary: 'Fatou Sarr',
      cycleNumber: 6,
      totalCycles: 12,
      status: 'active',
      createdBy: 'Aminata Diop',
      category: 'Femmes entrepreneures'
    },
    {
      id: '2',
      name: 'Tontine des Jeunes Agriculteurs',
      description: 'Soutien financier pour projets agricoles',
      members: [
        {
          id: '4',
          name: 'Moussa Traoré',
          phoneNumber: '+221 70 456 78 90',
          contribution: 25000,
          totalContributed: 150000,
          status: 'active',
          joinDate: new Date('2023-06-01'),
          reliabilityScore: 92
        },
        {
          id: '5',
          name: 'Oumar Diallo',
          phoneNumber: '+221 76 567 89 01',
          contribution: 25000,
          totalContributed: 125000,
          status: 'active',
          joinDate: new Date('2023-06-01'),
          reliabilityScore: 88
        }
      ],
      totalAmount: 200000,
      contributionAmount: 25000,
      frequency: 'weekly',
      nextPaymentDate: new Date('2024-02-10'),
      currentBeneficiary: 'Moussa Traoré',
      cycleNumber: 8,
      totalCycles: 20,
      status: 'active',
      createdBy: 'Moussa Traoré',
      category: 'Agriculture'
    }
  ]);

  const [selectedGroup, setSelectedGroup] = useState<TontineGroup | null>(null);
  const [activeTab, setActiveTab] = useState<'groups' | 'members' | 'analytics'>('groups');
  const [contributions] = useState<Contribution[]>([
    {
      id: '1',
      memberId: '1',
      amount: 50000,
      date: new Date('2024-01-15'),
      paymentMethod: 'mobile_money',
      status: 'confirmed',
      cycleNumber: 5
    },
    {
      id: '2',
      memberId: '3',
      amount: 50000,
      date: new Date('2024-01-16'),
      paymentMethod: 'mobile_money',
      status: 'confirmed',
      cycleNumber: 5
    }
  ]);

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'beneficiary': return 'text-blue-600 bg-blue-100';
      case 'inactive': return 'text-red-600 bg-red-100';
      case 'confirmed': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'late': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getReliabilityColor = (score: number): string => {
    if (score >= 95) return 'text-green-600';
    if (score >= 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  const calculateGroupProgress = (group: TontineGroup): number => {
    return (group.cycleNumber / group.totalCycles) * 100;
  };

  const formatCurrency = (amount: number): string => {
    return amount.toLocaleString() + ' FCFA';
  };

  const simulateContribution = (groupId: string, memberId: string) => {
    alert(`Simulation de contribution pour le membre ${memberId} dans le groupe ${groupId}`);
  };

  const selectNextBeneficiary = (groupId: string) => {
    alert(`Sélection du prochain bénéficiaire pour le groupe ${groupId}`);
  };

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">Gestion des Tontines Africaines</h1>
        <p className="text-lg text-gray-600">Système moderne pour les groupes d\'épargne traditionnels</p>
      </div>

      {/* Navigation */}
      <div className="flex justify-center mb-8">
        <div className="bg-white rounded-lg p-1 shadow-lg">
          <button
            onClick={() => setActiveTab('groups')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'groups'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-gray-600 hover:text-purple-600'
            }`}
          >
            <Users className="w-5 h-5 inline mr-2" />
            Groupes
          </button>
          <button
            onClick={() => setActiveTab('members')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'members'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-gray-600 hover:text-purple-600'
            }`}
          >
            <PiggyBank className="w-5 h-5 inline mr-2" />
            Membres
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'analytics'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-gray-600 hover:text-purple-600'
            }`}
          >
            <TrendingUp className="w-5 h-5 inline mr-2" />
            Analytiques
          </button>
        </div>
      </div>

      {/* Groupes de tontine */}
      {activeTab === 'groups' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold mb-4">Groupes Actifs</h2>
            {tontineGroups.map((group) => (
              <div
                key={group.id}
                className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setSelectedGroup(group)}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">{group.name}</h3>
                    <p className="text-gray-600 text-sm">{group.description}</p>
                    <p className="text-gray-500 text-xs">Créé par {group.createdBy}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(group.status)}`}>
                    {group.status}
                  </span>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span>Progression du cycle:</span>
                    <span className="font-medium">{calculateGroupProgress(group).toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div 
                      className="bg-purple-600 h-2 rounded-full"
                      style={{ width: `${calculateGroupProgress(group)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Cycle {group.cycleNumber}</span>
                    <span>Sur {group.totalCycles} cycles</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                  <div>
                    <span className="text-gray-500">Montant total:</span>
                    <p className="font-medium">{formatCurrency(group.totalAmount)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Contribution:</span>
                    <p className="font-medium">{formatCurrency(group.contributionAmount)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Membres:</span>
                    <p className="font-medium">{group.members.length}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Fréquence:</span>
                    <p className="font-medium">{group.frequency === 'weekly' ? 'Hebdo' : 'Mensuelle'}</p>
                  </div>
                </div>

                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Bénéficiaire actuel:</strong> {group.currentBeneficiary}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Prochain paiement: {group.nextPaymentDate.toLocaleDateString()}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => selectNextBeneficiary(group.id)}
                    className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700"
                  >
                    Choisir bénéficiaire
                  </button>
                  <button className="bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700">
                    Gérer
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Détails du groupe sélectionné */}
          <div className="bg-white rounded-lg shadow-md p-6">
            {selectedGroup ? (
              <div>
                <h3 className="text-xl font-semibold mb-4">Détails du Groupe</h3>
                
                <div className="mb-6">
                  <h4 className="font-medium mb-2">Résumé financier</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <p className="text-sm text-purple-600">Montant par cycle</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {formatCurrency(selectedGroup.totalAmount)}
                      </p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="text-sm text-green-600">Total distribué</p>
                      <p className="text-2xl font-bold text-green-600">
                        {formatCurrency(selectedGroup.totalAmount * selectedGroup.cycleNumber)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="font-medium mb-3">Membres actifs</h4>
                  <div className="space-y-3">
                    {selectedGroup.members.map((member) => (
                      <div key={member.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{member.name}</p>
                          <p className="text-sm text-gray-600">{member.phoneNumber}</p>
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(member.status)}`}>
                            {member.status}
                          </span>
                          <p className="text-sm font-medium mt-1">
                            {formatCurrency(member.totalContributed)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button 
                  onClick={() => simulateContribution(selectedGroup.id, '1')}
                  className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700"
                >
                  Simuler une contribution
                </button>
              </div>
            ) : (
              <p className="text-gray-500">Sélectionnez un groupe pour voir les détails</p>
            )}
          </div>
        </div>
      )}

      {/* Membres */}
      {activeTab === 'members' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-6">Tous les Membres</h2>
          <div className="space-y-4">
            {tontineGroups.flatMap(group => 
              group.members.map(member => ({ ...member, groupName: group.name, groupId: group.id }))
            ).map((member) => (
              <div key={member.id} className="flex justify-between items-center p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <Users className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-lg">{member.name}</p>
                    <p className="text-sm text-gray-600">{member.phoneNumber}</p>
                    <p className="text-xs text-gray-500">{member.groupName}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(member.status)}`}>
                      {member.status}
                    </span>
                    <span className={`font-medium ${getReliabilityColor(member.reliabilityScore)}`}>
                      {member.reliabilityScore}%
                    </span>
                  </div>
                  <p className="text-sm font-medium">{formatCurrency(member.totalContributed)}</p>
                  <p className="text-xs text-gray-500">
                    Membre depuis {member.joinDate.toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analytiques */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Total des Contributions</h3>
              <PiggyBank className="w-8 h-8 text-purple-600" />
            </div>
            <p className="text-3xl font-bold text-purple-600">
              {formatCurrency(tontineGroups.reduce((sum, group) => sum + (group.totalAmount * group.cycleNumber), 0))}
            </p>
            <p className="text-sm text-gray-600 mt-2">Tous les groupes confondus</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Membres Actifs</h3>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-blue-600">
              {tontineGroups.reduce((sum, group) => sum + group.members.length, 0)}
            </p>
            <p className="text-sm text-gray-600 mt-2">Dans {tontineGroups.length} groupes</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Taux de Réussite</h3>
              <Award className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-green-600">96.5%</p>
            <p className="text-sm text-gray-600 mt-2">Contributions à temps</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 lg:col-span-3">
            <h3 className="text-lg font-semibold mb-4">Performance par Groupe</h3>
            <div className="space-y-4">
              {tontineGroups.map((group) => (
                <div key={group.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium">{group.name}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(group.status)}`}>
                      {group.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Montant</p>
                      <p className="font-medium">{formatCurrency(group.totalAmount)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Membres</p>
                      <p className="font-medium">{group.members.length}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Progression</p>
                      <p className="font-medium">{calculateGroupProgress(group).toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Fiabilité</p>
                      <p className="font-medium">
                        {Math.round(group.members.reduce((sum, member) => sum + member.reliabilityScore, 0) / group.members.length)}%
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AfricanTontineManager;