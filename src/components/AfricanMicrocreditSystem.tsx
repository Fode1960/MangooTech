import React, { useState, useEffect } from 'react';
import { Users, TrendingUp, Shield, Clock, Target, HandHeart, Coins, Award } from 'lucide-react';

interface BorrowerProfile {
  id: string;
  name: string;
  creditScore: number;
  monthlyIncome: number;
  businessType: string;
  location: string;
  loanHistory: {
    totalLoans: number;
    repaidLoans: number;
    onTimeRepayments: number;
  };
  socialScore: number;
  guarantors: number;
}

interface LoanProduct {
  id: string;
  name: string;
  amount: number;
  interestRate: number;
  duration: number;
  requirements: string[];
  riskLevel: 'low' | 'medium' | 'high';
  targetSector: string;
}

interface CommunityFunding {
  id: string;
  name: string;
  description: string;
  targetAmount: number;
  currentAmount: number;
  contributors: number;
  daysLeft: number;
  category: string;
  creator: string;
}

const AfricanMicrocreditSystem: React.FC = () => {
  const [borrowers] = useState<BorrowerProfile[]>([
    {
      id: '1',
      name: 'Awa Diallo',
      creditScore: 750,
      monthlyIncome: 150000,
      businessType: 'Commerce de textiles',
      location: 'Dakar, Sénégal',
      loanHistory: {
        totalLoans: 5,
        repaidLoans: 5,
        onTimeRepayments: 5
      },
      socialScore: 85,
      guarantors: 3
    },
    {
      id: '2',
      name: 'Mamadou Traoré',
      creditScore: 680,
      monthlyIncome: 80000,
      businessType: 'Agriculture maraîchère',
      location: 'Bamako, Mali',
      loanHistory: {
        totalLoans: 3,
        repaidLoans: 2,
        onTimeRepayments: 2
      },
      socialScore: 78,
      guarantors: 2
    },
    {
      id: '3',
      name: 'Fatou Sow',
      creditScore: 820,
      monthlyIncome: 200000,
      businessType: 'Transformation agro-alimentaire',
      location: 'Conakry, Guinée',
      loanHistory: {
        totalLoans: 8,
        repaidLoans: 8,
        onTimeRepayments: 7
      },
      socialScore: 92,
      guarantors: 4
    }
  ]);

  const [loanProducts] = useState<LoanProduct[]>([
    {
      id: '1',
      name: 'Microcrédit Commercial',
      amount: 500000,
      interestRate: 2.5,
      duration: 6,
      requirements: ['Commerçant actif', 'Référence de quartier', 'Garant'],
      riskLevel: 'low',
      targetSector: 'Commerce'
    },
    {
      id: '2',
      name: 'Prêt Agricole Saisonnier',
      amount: 1000000,
      interestRate: 3.0,
      duration: 12,
      requirements: ['Exploitation agricole', 'Plan de culture', 'Accès à l\'eau'],
      riskLevel: 'medium',
      targetSector: 'Agriculture'
    },
    {
      id: '3',
      name: 'Financement Artisanal',
      amount: 300000,
      interestRate: 4.0,
      duration: 4,
      requirements: ['Artisan reconnu', 'Outils professionnels', 'Commandes'],
      riskLevel: 'medium',
      targetSector: 'Artisanat'
    }
  ]);

  const [communityFundings] = useState<CommunityFunding[]>([
    {
      id: '1',
      name: 'Coopérative Maraîchère Grand Yoff',
      description: 'Achat de matériel d\'irrigation pour 25 femmes maraîchères',
      targetAmount: 5000000,
      currentAmount: 3200000,
      contributors: 47,
      daysLeft: 15,
      category: 'Agriculture',
      creator: 'Association des Femmes de Grand Yoff'
    },
    {
      id: '2',
      name: 'Atelier de Couture Parcelles',
      description: 'Création d\'un atelier de couture pour jeunes femmes',
      targetAmount: 2500000,
      currentAmount: 1800000,
      contributors: 32,
      daysLeft: 22,
      category: 'Artisanat',
      creator: 'Maman Coumba'
    },
    {
      id: '3',
      name: 'Boutique Collective Tilène',
      description: 'Lancement d\'une boutique collective pour artisans',
      targetAmount: 8000000,
      currentAmount: 6500000,
      contributors: 89,
      daysLeft: 8,
      category: 'Commerce',
      creator: 'Groupement Tilène'
    }
  ]);

  const [selectedTab, setSelectedTab] = useState<'borrowers' | 'loans' | 'community'>('borrowers');
  const [selectedBorrower, setSelectedBorrower] = useState<BorrowerProfile | null>(null);
  const [selectedLoan, setSelectedLoan] = useState<LoanProduct | null>(null);

  const calculateRiskScore = (borrower: BorrowerProfile): number => {
    const creditScore = borrower.creditScore / 10;
    const incomeStability = Math.min(borrower.monthlyIncome / 100000, 10);
    const repaymentHistory = (borrower.loanHistory.repaidLoans / borrower.loanHistory.totalLoans) * 10;
    const socialFactor = borrower.socialScore / 10;
    const guarantorFactor = Math.min(borrower.guarantors * 2, 10);
    
    return Math.round((creditScore + incomeStability + repaymentHistory + socialFactor + guarantorFactor) / 5);
  };

  const getRiskColor = (score: number): string => {
    if (score >= 8) return 'text-green-600 bg-green-100';
    if (score >= 6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const simulateLoanApproval = (borrower: BorrowerProfile, loan: LoanProduct): boolean => {
    const riskScore = calculateRiskScore(borrower);
    const loanRisk = loan.riskLevel === 'low' ? 8 : loan.riskLevel === 'medium' ? 6 : 4;
    return riskScore >= loanRisk;
  };

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gradient-to-br from-blue-50 to-green-50">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">Système de Microcrédit Africain</h1>
        <p className="text-lg text-gray-600">Financement communautaire et microcrédit intelligent pour l'Afrique</p>
      </div>

      {/* Navigation par onglets */}
      <div className="flex justify-center mb-8">
        <div className="bg-white rounded-lg p-1 shadow-lg">
          <button
            onClick={() => setSelectedTab('borrowers')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              selectedTab === 'borrowers'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-600 hover:text-blue-600'
            }`}
          >
            <Users className="w-5 h-5 inline mr-2" />
            Emprunteurs
          </button>
          <button
            onClick={() => setSelectedTab('loans')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              selectedTab === 'loans'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-600 hover:text-blue-600'
            }`}
          >
            <Coins className="w-5 h-5 inline mr-2" />
            Produits de Prêt
          </button>
          <button
            onClick={() => setSelectedTab('community')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              selectedTab === 'community'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-600 hover:text-blue-600'
            }`}
          >
            <HandHeart className="w-5 h-5 inline mr-2" />
            Financement Communautaire
          </button>
        </div>
      </div>

      {/* Contenu des onglets */}
      {selectedTab === 'borrowers' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Liste des emprunteurs */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-2xl font-semibold mb-4">Profils d'Emprunteurs</h2>
            {borrowers.map((borrower) => (
              <div
                key={borrower.id}
                className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setSelectedBorrower(borrower)}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">{borrower.name}</h3>
                    <p className="text-gray-600">{borrower.businessType}</p>
                    <p className="text-sm text-gray-500">{borrower.location}</p>
                  </div>
                  <div className="text-right">
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${getRiskColor(calculateRiskScore(borrower))}`}>
                      Score: {calculateRiskScore(borrower)}/10
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Revenu mensuel:</span>
                    <p className="font-medium">{borrower.monthlyIncome.toLocaleString()} FCFA</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Score de crédit:</span>
                    <p className="font-medium">{borrower.creditScore}/1000</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Prêts remboursés:</span>
                    <p className="font-medium">{borrower.loanHistory.repaidLoans}/{borrower.loanHistory.totalLoans}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Garanteurs:</span>
                    <p className="font-medium">{borrower.guarantors}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Détails de l'emprunteur sélectionné */}
          <div className="bg-white rounded-lg shadow-md p-6">
            {selectedBorrower ? (
              <div>
                <h3 className="text-xl font-semibold mb-4">Détails de {selectedBorrower.name}</h3>
                
                <div className="space-y-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="font-medium text-blue-800 mb-2">Évaluation de Risque</h4>
                    <div className="text-3xl font-bold text-blue-600">{calculateRiskScore(selectedBorrower)}/10</div>
                    <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${calculateRiskScore(selectedBorrower) * 10}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Historique de Prêts</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Total des prêts:</span>
                        <span className="font-medium">{selectedBorrower.loanHistory.totalLoans}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Remboursés:</span>
                        <span className="font-medium text-green-600">{selectedBorrower.loanHistory.repaidLoans}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>A temps:</span>
                        <span className="font-medium text-blue-600">{selectedBorrower.loanHistory.onTimeRepayments}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Score Social</h4>
                    <div className="flex items-center gap-2">
                      <Award className="w-5 h-5 text-yellow-500" />
                      <span className="font-medium">{selectedBorrower.socialScore}/100</span>
                    </div>
                  </div>

                  <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700">
                    Voir les offres de prêt
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">Sélectionnez un emprunteur pour voir les détails</p>
            )}
          </div>
        </div>
      )}

      {selectedTab === 'loans' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {loanProducts.map((loan) => (
            <div key={loan.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-semibold">{loan.name}</h3>
                <span className={`px-3 py-1 rounded-full text-sm ${
                  loan.riskLevel === 'low' ? 'bg-green-100 text-green-800' :
                  loan.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {loan.riskLevel}
                </span>
              </div>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span>Montant maximum:</span>
                  <span className="font-medium">{loan.amount.toLocaleString()} FCFA</span>
                </div>
                <div className="flex justify-between">
                  <span>Taux d\'intérêt:</span>
                  <span className="font-medium">{loan.interestRate}%/mois</span>
                </div>
                <div className="flex justify-between">
                  <span>Durée:</span>
                  <span className="font-medium">{loan.duration} mois</span>
                </div>
                <div className="flex justify-between">
                  <span>Secteur cible:</span>
                  <span className="font-medium">{loan.targetSector}</span>
                </div>
              </div>

              <div className="mb-4">
                <h4 className="font-medium mb-2">Conditions requises:</h4>
                <ul className="space-y-1">
                  {loan.requirements.map((req, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <Target className="w-4 h-4 text-blue-600" />
                      {req}
                    </li>
                  ))}
                </ul>
              </div>

              <button 
                onClick={() => setSelectedLoan(loan)}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
              >
                Demander ce prêt
              </button>
            </div>
          ))}
        </div>
      )}

      {selectedTab === 'community' && (
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold mb-6">Projets de Financement Communautaire</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {communityFundings.map((funding) => (
              <div key={funding.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold mb-2">{funding.name}</h3>
                  <p className="text-gray-600 text-sm mb-3">{funding.description}</p>
                  <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                    {funding.category}
                  </span>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span>Progression:</span>
                    <span className="font-medium">
                      {((funding.currentAmount / funding.targetAmount) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${(funding.currentAmount / funding.targetAmount) * 100}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{funding.currentAmount.toLocaleString()} FCFA</span>
                    <span>{funding.targetAmount.toLocaleString()} FCFA</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                  <div>
                    <span className="text-gray-500">Contributeurs:</span>
                    <p className="font-medium">{funding.contributors}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Jours restants:</span>
                    <p className="font-medium">{funding.daysLeft}</p>
                  </div>
                </div>

                <div className="mb-4">
                  <span className="text-gray-500 text-sm">Initiateur:</span>
                  <p className="font-medium text-sm">{funding.creator}</p>
                </div>

                <button className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700">
                  Contribuer
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AfricanMicrocreditSystem;