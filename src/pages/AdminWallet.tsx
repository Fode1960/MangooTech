import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  RefreshCw, 
  Download, 
  CreditCard,
  Users,
  AlertCircle,
  Filter,
  DollarSign
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

export default function AdminWallet() {
  const { isDark } = useTheme();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const view = searchParams.get('view') || 'overview'; // overview, payments, commissions
  
  const [balance, setBalance] = useState(12500000); // 12.5M FCFA (Admin Pool)
  const [transactions, setTransactions] = useState([
    { id: 1, type: 'credit_repayment', user: 'Maman Paul', amount: 15000, date: '2026-02-28 14:30', status: 'completed' },
    { id: 2, type: 'tontine_deposit', user: 'Groupe Tontine A', amount: 75000, date: '2026-02-28 12:15', status: 'completed' },
    { id: 3, type: 'bnpl_disbursement', user: 'Jean Mecano', amount: -25000, date: '2026-02-28 10:00', status: 'completed' },
    { id: 4, type: 'wallet_topup', user: 'Utilisateur Mangoo', amount: 5000, date: '2026-02-28 09:45', status: 'completed' },
    { id: 5, type: 'commission', user: 'Boutique Chez Sarah', amount: 1250, date: '2026-02-28 08:30', status: 'completed' },
    { id: 6, type: 'commission', user: 'Tech Store CI', amount: 3500, date: '2026-02-27 18:45', status: 'completed' },
    { id: 7, type: 'payment', user: 'Client A', amount: 12000, date: '2026-02-27 16:20', status: 'completed' },
    { id: 8, type: 'payment', user: 'Client B', amount: 8500, date: '2026-02-27 15:10', status: 'completed' },
  ]);

  const getTitle = () => {
    switch(view) {
      case 'payments': return 'Historique des Paiements';
      case 'commissions': return 'Gestion des Commissions';
      default: return 'Portefeuille Mangoo Tech';
    }
  };

  const getDescription = () => {
    switch(view) {
      case 'payments': return 'Consultez tous les flux entrants et sortants';
      case 'commissions': return 'Suivi des revenus de la plateforme';
      default: return 'Gestion de la trésorerie et des flux financiers';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(Math.abs(amount));
  };

  // Filtrer les transactions selon la vue
  const getFilteredTransactions = () => {
    if (view === 'commissions') {
      return transactions.filter(t => t.type === 'commission');
    }
    if (view === 'payments') {
      return transactions.filter(t => t.type !== 'commission');
    }
    return transactions;
  };

  const filteredTransactions = getFilteredTransactions();

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'} p-6`}>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{getTitle()}</h1>
            <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} mt-1`}>{getDescription()}</p>
          </div>
          <div className="flex space-x-2">
            <button className={`flex items-center space-x-2 px-4 py-2 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${isDark ? 'border-gray-600 text-gray-300' : 'border-gray-300 text-gray-700'}`}>
              <Filter className="h-4 w-4" />
              <span>Filtrer</span>
            </button>
            <button className="flex items-center space-x-2 px-4 py-2 bg-[#1b5e20] text-white rounded-lg hover:bg-[#16381a] transition-colors">
              <Download className="h-4 w-4" />
              <span>Exporter Rapport</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs (Visual) */}
        <div className="flex space-x-1 bg-gray-200 dark:bg-gray-700 p-1 rounded-xl mb-6 w-fit">
          <button 
            onClick={() => navigate('/admin/wallet?view=overview')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${view === 'overview' ? 'bg-white text-[#1b5e20] shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'}`}
          >
            Vue d'ensemble
          </button>
          <button 
             onClick={() => navigate('/admin/wallet?view=payments')}
             className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${view === 'payments' ? 'bg-white text-[#1b5e20] shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'}`}
          >
            Paiements
          </button>
          <button 
             onClick={() => navigate('/admin/wallet?view=commissions')}
             className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${view === 'commissions' ? 'bg-white text-[#1b5e20] shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'}`}
          >
            Commissions
          </button>
        </div>

        {/* Main Stats Cards - Only show in Overview or if relevant */}
        {(view === 'overview' || view === 'commissions') && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Total Balance */}
          <div className={`rounded-xl p-6 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg border-l-4 border-[#cfe0c8]`}>
            <div className="flex justify-between items-start">
              <div>
                <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Solde Total (Pool)</p>
                <h3 className={`text-3xl font-bold mt-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(balance)}</h3>
              </div>
              <div className="p-3 bg-[#eef6ea] rounded-full">
                <Wallet className="h-6 w-6 text-[#1b5e20]" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-[#1b5e20]">
              <ArrowUpRight className="h-4 w-4 mr-1" />
              <span>+2.5% cette semaine</span>
            </div>
          </div>

          {/* BNPL Exposure - Hide for commissions view */}
          {view !== 'commissions' && (
          <div className={`rounded-xl p-6 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg border-l-4 border-[#cfe0c8]`}>
            <div className="flex justify-between items-start">
              <div>
                <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Crédits BNPL en cours</p>
                <h3 className={`text-3xl font-bold mt-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(450000)}</h3>
              </div>
              <div className="p-3 bg-[#eef6ea] rounded-full">
                <CreditCard className="h-6 w-6 text-[#1b5e20]" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-[#1b5e20]">
              <AlertCircle className="h-4 w-4 mr-1" />
              <span>15 crédits actifs</span>
            </div>
          </div>
          )}

          {/* Commissions Specific Card */}
          {view === 'commissions' && (
          <div className={`rounded-xl p-6 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg border-l-4 border-[#cfe0c8]`}>
            <div className="flex justify-between items-start">
              <div>
                <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Commissions (Mois)</p>
                <h3 className={`text-3xl font-bold mt-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(125000)}</h3>
              </div>
              <div className="p-3 bg-[#eef6ea] rounded-full">
                <DollarSign className="h-6 w-6 text-[#1b5e20]" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-[#1b5e20]">
              <ArrowUpRight className="h-4 w-4 mr-1" />
              <span>+12% vs M-1</span>
            </div>
          </div>
          )}

          {/* Tontine Reserve - Hide for commissions */}
          {view !== 'commissions' && (
          <div className={`rounded-xl p-6 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg border-l-4 border-[#cfe0c8]`}>
            <div className="flex justify-between items-start">
              <div>
                <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Réserve Tontines</p>
                <h3 className={`text-3xl font-bold mt-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(890000)}</h3>
              </div>
              <div className="p-3 bg-[#ffe082]/50 rounded-full">
                <Users className="h-6 w-6 text-[#8f4b00]" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-[#8f4b00]">
              <ArrowUpRight className="h-4 w-4 mr-1" />
              <span>8 groupes actifs</span>
            </div>
          </div>
          )}
        </div>
        )}

        {/* Recent Transactions Table */}
        <div className={`rounded-xl shadow-sm border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {view === 'commissions' ? 'Historique des Commissions' : 
               view === 'payments' ? 'Historique des Paiements' : 
               'Dernières Transactions (Temps Réel)'}
            </h3>
            <button className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors`}>
              <RefreshCw className={`h-5 w-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={`bg-gray-50 dark:bg-gray-700/50`}>
                <tr>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Type</th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Utilisateur / Entité</th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Date</th>
                  <th className={`px-6 py-3 text-right text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Montant</th>
                  <th className={`px-6 py-3 text-center text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Statut</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-200'}`}>
                {filteredTransactions.length > 0 ? (
                  filteredTransactions.map((tx) => (
                    <tr key={tx.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`p-2 rounded-full mr-3 ${
                            tx.type.includes('bnpl') ? 'bg-[#eef6ea] text-[#1b5e20]' :
                            tx.type.includes('tontine') ? 'bg-[#eef6ea] text-[#1b5e20]' :
                            tx.type === 'commission' ? 'bg-[#ffe082]/50 text-[#8f4b00]' :
                            'bg-[#eef6ea] text-[#1b5e20]'
                          }`}>
                            {tx.amount > 0 ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                          </div>
                          <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            {tx.type === 'credit_repayment' ? 'Remboursement Crédit' :
                             tx.type === 'tontine_deposit' ? 'Dépôt Tontine' :
                             tx.type === 'bnpl_disbursement' ? 'Sortie BNPL' :
                             tx.type === 'wallet_topup' ? 'Rechargement' : 
                             tx.type === 'commission' ? 'Commission' : 'Paiement'}
                          </span>
                        </div>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{tx.user}</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{tx.date}</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-bold ${tx.amount > 0 ? 'text-[#1b5e20]' : 'text-red-600'}`}>
                        {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-[#eef6ea] text-[#1b5e20]">
                          Succès
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      Aucune transaction trouvée pour cette catégorie.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
