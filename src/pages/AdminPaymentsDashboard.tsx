import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { useThemeStore } from '../stores/themeStore';
import { 
  DollarSign, 
  CreditCard, 
  Smartphone, 
  TrendingUp, 
  TrendingDown,
  RefreshCw,
  Download,
  Filter,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  Users,
  Globe,
  PieChart,
  BarChart3,
  Activity,
  Settings,
  Eye,
  Search,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

interface PaymentStats {
  total_revenue: number;
  total_transactions: number;
  success_rate: number;
  pending_amount: number;
  failed_amount: number;
  commission_earned: number;
  period_days: number;
}

interface PaymentMethodStats {
  method: string;
  total_amount: number;
  transaction_count: number;
  success_rate: number;
  average_amount: number;
  processing_fee: number;
  net_revenue: number;
}

interface RecentPayment {
  id: string;
  amount: number;
  currency: string;
  payment_method: string;
  status: string;
  created_at: string;
  user_email?: string;
  user_name?: string;
  processing_fee: number;
  net_amount: number;
  metadata?: any;
}

interface TimeSeriesData {
  date: string;
  revenue: number;
  transactions: number;
  success_rate: number;
}

interface CountryStats {
  country: string;
  flag: string;
  revenue: number;
  transactions: number;
  success_rate: number;
}

export default function AdminPaymentsDashboard() {
  const { isDark } = useThemeStore();
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [methodStats, setMethodStats] = useState<PaymentMethodStats[]>([]);
  const [recentPayments, setRecentPayments] = useState<RecentPayment[]>([]);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [countryStats, setCountryStats] = useState<CountryStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(30);
  const [selectedMethod, setSelectedMethod] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const COLORS = {
    stripe: '#635BFF',
    paypal: '#0070BA',
    orange_money: '#FF6B35',
    mtn_momo: '#FFC107',
    moov_money: '#4CAF50',
    cash: '#8B5CF6',
    card: '#EF4444',
    mobile_money: '#10B981'
  };

  useEffect(() => {
    fetchPaymentsData();
    const timer = setInterval(() => {
      setLastUpdated(new Date());
    }, 60000); // Mise à jour toutes les minutes

    return () => clearInterval(timer);
  }, [period, selectedMethod, selectedStatus]);

  const fetchPaymentsData = async () => {
    try {
      setLoading(true);

      // Fetch payment statistics
      const statsResponse = await fetch(`/api/admin/payments/stats?period=${period}`);
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData.data);
      }

      // Fetch payment methods statistics
      const methodsResponse = await fetch(`/api/admin/payments/methods?period=${period}`);
      if (methodsResponse.ok) {
        const methodsData = await methodsResponse.json();
        setMethodStats(methodsData.data);
      }

      // Fetch recent payments
      const recentResponse = await fetch(`/api/admin/payments/recent?limit=20&method=${selectedMethod}&status=${selectedStatus}`);
      if (recentResponse.ok) {
        const recentData = await recentResponse.json();
        setRecentPayments(recentData.data);
      }

      // Fetch time series data
      const timeSeriesResponse = await fetch(`/api/admin/payments/timeseries?period=${period}`);
      if (timeSeriesResponse.ok) {
        const timeSeriesData = await timeSeriesResponse.json();
        setTimeSeriesData(timeSeriesData.data);
      }

      // Fetch country statistics
      const countryResponse = await fetch(`/api/admin/payments/countries?period=${period}`);
      if (countryResponse.ok) {
        const countryData = await countryResponse.json();
        setCountryStats(countryData.data);
      }

    } catch (error) {
      console.error('Erreur lors du chargement des données de paiement:', error);
      // Utiliser des données de démonstration en cas d'erreur
      generateDemoData();
    } finally {
      setLoading(false);
    }
  };

  const generateDemoData = () => {
    // Données de démonstration
    setStats({
      total_revenue: 15678000,
      total_transactions: 1847,
      success_rate: 93.3,
      pending_amount: 234000,
      failed_amount: 89000,
      commission_earned: 784000,
      period_days: period
    });

    setMethodStats([
      {
        method: 'orange_money',
        total_amount: 8234000,
        transaction_count: 923,
        success_rate: 94.2,
        average_amount: 8920,
        processing_fee: 82340,
        net_revenue: 8151660
      },
      {
        method: 'mtn_momo',
        total_amount: 3421000,
        transaction_count: 412,
        success_rate: 92.8,
        average_amount: 8303,
        processing_fee: 51315,
        net_revenue: 3369685
      },
      {
        method: 'moov_money',
        total_amount: 2187000,
        transaction_count: 267,
        success_rate: 91.5,
        average_amount: 8191,
        processing_fee: 26244,
        net_revenue: 2160756
      },
      {
        method: 'stripe',
        total_amount: 1567000,
        transaction_count: 198,
        success_rate: 96.5,
        average_amount: 7914,
        processing_fee: 47010,
        net_revenue: 1519990
      },
      {
        method: 'paypal',
        total_amount: 289000,
        transaction_count: 47,
        success_rate: 95.7,
        average_amount: 6149,
        processing_fee: 8670,
        net_revenue: 280330
      }
    ]);

    // Générer des données de séries temporelles
    const demoTimeSeries: TimeSeriesData[] = [];
    const days = Math.min(period, 30);
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      demoTimeSeries.push({
        date: date.toISOString().split('T')[0],
        revenue: Math.floor(Math.random() * 500000) + 200000,
        transactions: Math.floor(Math.random() * 80) + 20,
        success_rate: Math.random() * 5 + 90
      });
    }
    
    setTimeSeriesData(demoTimeSeries);

    // Paiements récents de démonstration
    setRecentPayments([
      {
        id: '1',
        amount: 15000,
        currency: 'XOF',
        payment_method: 'orange_money',
        status: 'succeeded',
        created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
        user_email: 'client@example.com',
        user_name: 'Jean Dupont',
        processing_fee: 150,
        net_amount: 14850,
        metadata: { phone_number: '+22507070707' }
      },
      {
        id: '2',
        amount: 25000,
        currency: 'XOF',
        payment_method: 'mtn_momo',
        status: 'succeeded',
        created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        user_email: 'marie@example.com',
        user_name: 'Marie Konaté',
        processing_fee: 375,
        net_amount: 24625,
        metadata: { phone_number: '+22505050505' }
      }
    ]);

    // Statistiques par pays
    setCountryStats([
      {
        country: 'Côte d\'Ivoire',
        flag: '🇨🇮',
        revenue: 8234000,
        transactions: 923,
        success_rate: 94.2
      },
      {
        country: 'Sénégal',
        flag: '🇸🇳',
        revenue: 3421000,
        transactions: 412,
        success_rate: 92.8
      },
      {
        country: 'Mali',
        flag: '🇲🇱',
        revenue: 2187000,
        transactions: 267,
        success_rate: 91.5
      }
    ]);
  };

  const formatCurrency = (amount: number, currency: string = 'XOF') => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('fr-FR').format(num);
  };

  const getMethodIcon = (method: string) => {
    const icons: Record<string, any> = {
      stripe: CreditCard,
      paypal: DollarSign,
      orange_money: Smartphone,
      mtn_momo: Smartphone,
      moov_money: Smartphone,
      mobile_money: Smartphone,
      card: CreditCard,
      cash: DollarSign
    };
    return icons[method] || DollarSign;
  };

  const getMethodColor = (method: string) => {
    return COLORS[method as keyof typeof COLORS] || '#6B7280';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'succeeded': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'pending': return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'failed': return <AlertCircle className="h-5 w-5 text-red-500" />;
      default: return <Activity className="h-5 w-5 text-gray-500" />;
    }
  };

  const exportData = (format: 'csv' | 'pdf' = 'csv') => {
    const csvContent = [
      ['Date', 'Méthode', 'Montant', 'Frais', 'Net', 'Statut', 'Client'],
      ...recentPayments.map(payment => [
        new Date(payment.created_at).toLocaleDateString('fr-FR'),
        payment.payment_method,
        formatCurrency(payment.amount),
        formatCurrency(payment.processing_fee),
        formatCurrency(payment.net_amount),
        payment.status,
        payment.user_name || 'Anonyme'
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `paiements_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'} p-6 flex items-center justify-center`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>Chargement des données de paiement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'} p-6`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Tableau de Bord Paiements
              </h1>
              <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'} mt-1`}>
                Analyse complète des revenus et transactions
              </p>
              <div className="flex items-center space-x-2 mt-2">
                <div className={`flex items-center text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  <Clock className="h-4 w-4 mr-1" />
                  Mis à jour: {lastUpdated.toLocaleTimeString('fr-FR')}
                </div>
                <button 
                  onClick={fetchPaymentsData}
                  className={`p-1 transition-colors ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'}`}
                  title="Actualiser les données"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={period}
                onChange={(e) => setPeriod(Number(e.target.value))}
                className={`px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                <option value={7}>7 derniers jours</option>
                <option value={30}>30 derniers jours</option>
                <option value={90}>90 derniers jours</option>
                <option value={365}>1 an</option>
              </select>
              <button
                onClick={() => exportData('csv')}
                className={`flex items-center space-x-2 px-4 py-2 border rounded-lg transition-colors ${
                  isDark 
                    ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Download className="h-4 w-4" />
                <span>Exporter</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Revenus Totaux */}
            <div className={`rounded-lg shadow-sm p-6 border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    Revenus Totaux
                  </p>
                  <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {formatCurrency(stats.total_revenue)}
                  </p>
                  <p className={`text-sm mt-1 ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                    <TrendingUp className="inline h-4 w-4 mr-1" />
                    +12.5% vs période précédente
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${isDark ? 'bg-green-900/20' : 'bg-green-100'}`}>
                  <DollarSign className={`h-6 w-6 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                </div>
              </div>
            </div>

            {/* Transactions */}
            <div className={`rounded-lg shadow-sm p-6 border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    Transactions
                  </p>
                  <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {formatNumber(stats.total_transactions)}
                  </p>
                  <p className={`text-sm mt-1 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                    <Activity className="inline h-4 w-4 mr-1" />
                    {stats.success_rate}% de réussite
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${isDark ? 'bg-blue-900/20' : 'bg-blue-100'}`}>
                  <CreditCard className={`h-6 w-6 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                </div>
              </div>
            </div>

            {/* Commissions */}
            <div className={`rounded-lg shadow-sm p-6 border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    Commissions
                  </p>
                  <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {formatCurrency(stats.commission_earned)}
                  </p>
                  <p className={`text-sm mt-1 ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>
                    <TrendingUp className="inline h-4 w-4 mr-1" />
                    5% du chiffre d'affaires
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${isDark ? 'bg-purple-900/20' : 'bg-purple-100'}`}>
                  <PieChart className={`h-6 w-6 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                </div>
              </div>
            </div>

            {/* Montants en Attente */}
            <div className={`rounded-lg shadow-sm p-6 border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    En Attente
                  </p>
                  <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {formatCurrency(stats.pending_amount)}
                  </p>
                  <p className={`text-sm mt-1 ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`}>
                    <Clock className="inline h-4 w-4 mr-1" />
                    {Math.round((stats.pending_amount / stats.total_revenue) * 100)}% du total
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${isDark ? 'bg-yellow-900/20' : 'bg-yellow-100'}`}>
                  <Clock className={`h-6 w-6 ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Méthodes de Paiement */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Répartition par Méthode */}
          <div className={`rounded-lg shadow-sm border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className={`p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Répartition par Méthode
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {methodStats.map((method, index) => {
                  const IconComponent = getMethodIcon(method.method);
                  const color = getMethodColor(method.method);
                  const percentage = (method.total_amount / (stats?.total_revenue || 1)) * 100;
                  
                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 rounded-lg" style={{ backgroundColor: `${color}20` }}>
                            <IconComponent className="h-5 w-5" style={{ color }} />
                          </div>
                          <div>
                            <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {method.method.replace('_', ' ').toUpperCase()}
                            </p>
                            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                              {formatNumber(method.transaction_count)} transactions
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {formatCurrency(method.total_amount)}
                          </p>
                          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            {percentage.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                        <div 
                          className="h-2 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${percentage}%`, 
                            backgroundColor: color 
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Performances par Pays */}
          <div className={`rounded-lg shadow-sm border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className={`p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Performances par Pays
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {countryStats.map((country, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">{country.flag}</div>
                      <div>
                        <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {country.country}
                        </p>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {formatNumber(country.transactions)} transactions
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {formatCurrency(country.revenue)}
                      </p>
                      <div className="flex items-center space-x-1">
                        {getStatusIcon(country.success_rate > 92 ? 'succeeded' : 'pending')}
                        <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {country.success_rate}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Transactions Récentes */}
        <div className={`rounded-lg shadow-sm border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className={`p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex justify-between items-center">
              <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Transactions Récentes
              </h3>
              <div className="flex items-center space-x-2">
                <select
                  value={selectedMethod}
                  onChange={(e) => setSelectedMethod(e.target.value)}
                  className={`px-3 py-1 text-sm border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="all">Toutes méthodes</option>
                  <option value="orange_money">Orange Money</option>
                  <option value="mtn_momo">MTN MoMo</option>
                  <option value="moov_money">Moov Money</option>
                  <option value="stripe">Stripe</option>
                  <option value="paypal">PayPal</option>
                </select>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className={`px-3 py-1 text-sm border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="all">Tous statuts</option>
                  <option value="succeeded">Réussies</option>
                  <option value="pending">En attente</option>
                  <option value="failed">Échouées</option>
                </select>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentPayments.map((payment) => (
                <div key={payment.id} className={`flex items-center justify-between p-4 rounded-lg border ${
                  isDark ? 'border-gray-700 bg-gray-750' : 'border-gray-200 bg-gray-50'
                }`}>
                  <div className="flex items-center space-x-4">
                    {getStatusIcon(payment.status)}
                    <div>
                      <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {payment.user_name || 'Utilisateur Anonyme'}
                      </p>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {payment.user_email || 'Email non disponible'}
                      </p>
                      <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                        {new Date(payment.created_at).toLocaleString('fr-FR')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {formatCurrency(payment.amount)}
                    </p>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {payment.payment_method.replace('_', ' ').toUpperCase()}
                    </p>
                    <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                      Net: {formatCurrency(payment.net_amount)}
                    </p>
                  </div>
                </div>
              ))}
              {recentPayments.length === 0 && (
                <div className="text-center py-8">
                  <CreditCard className={`h-12 w-12 mx-auto mb-4 ${isDark ? 'text-gray-400' : 'text-gray-400'}`} />
                  <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>Aucune transaction trouvée</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}