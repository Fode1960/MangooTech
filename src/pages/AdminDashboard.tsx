import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Legend
} from 'recharts';
import { 
  Store, 
  DollarSign, 
  Wallet,
  Users, 
  TrendingUp, 
  TrendingDown,
  Smartphone,
  CreditCard,
  AlertCircle,
  CheckCircle,
  Clock,
  MapPin,
  Star,
  Activity,
  Target,
  BarChart3,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  Settings,
  Eye,
  Edit,
  Trash2,
  Plus,
  Search
} from 'lucide-react';

const CHART_COLORS = ['#1b5e20', '#ffa726', '#ffe082', '#1b5e20', '#1b5e20'];

interface DashboardStats {
  period_days: number;
  shops: {
    total: number;
    active: number;
    verified: number;
    new_this_period: number;
    approval_rate: number;
  };
  payments: {
    total: number;
    successful: number;
    success_rate: number;
    total_revenue: number;
    methods_distribution: Record<string, number>;
    mobile_money_breakdown: {
      orange: number;
      mtn: number;
      moov: number;
    };
  };
  users: {
    new_this_period: number;
  };
  shop_metrics: {
    total_revenue: number;
    total_orders: number;
  };
}

interface TopShop {
  id: string;
  name: string;
  slug: string;
  status: string;
  is_verified: boolean;
  rating: number;
  review_count: number;
  metrics: {
    total_revenue: number;
    total_orders: number;
    successful_payments: number;
    avg_conversion_rate: number;
  };
}

interface PaymentMethodData {
  name: string;
  value: number;
  color: string;
}

interface TimeSeriesData {
  date: string;
  revenue: number;
  orders: number;
  conversion_rate: number;
}

interface CountryData {
  country: string;
  revenue: number;
  orders: number;
  shops: number;
  flag: string;
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: any;
  action?: () => void;
  path?: string;
  external?: boolean;
  color: string;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [topShops, setTopShops] = useState<TopShop[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodData[]>([]);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [countryData, setCountryData] = useState<CountryData[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(30);
  const [selectedMetric, setSelectedMetric] = useState<'revenue' | 'orders' | 'conversion_rate'>('revenue');
  const requestRef = useRef<AbortController | null>(null);

  const fetchWithTimeout = useCallback(async (url: string, signal: AbortSignal, timeoutMs = 2500) => {
    const timeoutController = new AbortController();
    const timeout = setTimeout(() => timeoutController.abort(), timeoutMs);
    const onAbort = () => timeoutController.abort();
    signal.addEventListener('abort', onAbort);
    try {
      const res = await fetch(url, { signal: timeoutController.signal });
      if (!res.ok) return null;
      const text = await res.text();
      try {
        return JSON.parse(text);
      } catch {
        return null;
      }
    } catch {
      return null;
    } finally {
      clearTimeout(timeout);
      signal.removeEventListener('abort', onAbort);
    }
  }, []);

  const generateDemoData = useCallback(() => {
    const demoStats: DashboardStats = {
      period_days: period,
      shops: {
        total: 247,
        active: 198,
        verified: 156,
        new_this_period: 23,
        approval_rate: 89.5
      },
      payments: {
        total: 1847,
        successful: 1723,
        success_rate: 93.3,
        total_revenue: 15678000,
        methods_distribution: {
          mobile_money: 1423,
          card: 267,
          cash: 157
        },
        mobile_money_breakdown: {
          orange: 578,
          mtn: 521,
          moov: 324
        }
      },
      users: {
        new_this_period: 89
      },
      shop_metrics: {
        total_revenue: 15678000,
        total_orders: 1847
      }
    };

    const demoTimeSeries: TimeSeriesData[] = [];
    const days = Math.min(period, 30); // Limiter l'affichage a 30 jours
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      demoTimeSeries.push({
        date: date.toISOString().split('T')[0],
        revenue: Math.floor(Math.random() * 500000) + 200000,
        orders: Math.floor(Math.random() * 80) + 20,
        conversion_rate: Math.random() * 5 + 2
      });
    }

    const demoCountries: CountryData[] = [
      { country: 'CÃ´te d\'Ivoire', revenue: 8234000, orders: 923, shops: 89, flag: 'ðŸ‡¨ðŸ‡®' },
      { country: 'SÃ©nÃ©gal', revenue: 3421000, orders: 412, shops: 45, flag: 'ðŸ‡¸ðŸ‡³' },
      { country: 'Mali', revenue: 2187000, orders: 267, shops: 32, flag: 'ðŸ‡²ðŸ‡±' },
      { country: 'Burkina Faso', revenue: 1845000, orders: 245, shops: 28, flag: 'ðŸ‡§ðŸ‡«' }
    ];

    const demoTopShops: TopShop[] = [
      {
        id: '1',
        name: 'Boutique Ã‰lÃ©gance Africaine',
        slug: 'elegance-africaine',
        status: 'approved',
        is_verified: true,
        rating: 4.8,
        review_count: 127,
        metrics: {
          total_revenue: 2345000,
          total_orders: 89,
          successful_payments: 84,
          avg_conversion_rate: 4.2
        }
      },
      {
        id: '2',
        name: 'Tech Store CI',
        slug: 'tech-store-ci',
        status: 'approved',
        is_verified: true,
        rating: 4.6,
        review_count: 203,
        metrics: {
          total_revenue: 1892000,
          total_orders: 156,
          successful_payments: 148,
          avg_conversion_rate: 3.8
        }
      },
      {
        id: '3',
        name: 'Mode & Tradition',
        slug: 'mode-tradition',
        status: 'approved',
        is_verified: false,
        rating: 4.3,
        review_count: 89,
        metrics: {
          total_revenue: 1567000,
          total_orders: 67,
          successful_payments: 63,
          avg_conversion_rate: 3.5
        }
      },
      {
        id: '4',
        name: 'Artisanat du SÃ©nÃ©gal',
        slug: 'artisanat-senegal',
        status: 'approved',
        is_verified: true,
        rating: 4.7,
        review_count: 94,
        metrics: {
          total_revenue: 1234000,
          total_orders: 45,
          successful_payments: 43,
          avg_conversion_rate: 4.1
        }
      },
      {
        id: '5',
        name: 'Ã‰picerie Bio Mali',
        slug: 'epicerie-bio-mali',
        status: 'pending',
        is_verified: false,
        rating: 4.1,
        review_count: 56,
        metrics: {
          total_revenue: 987000,
          total_orders: 38,
          successful_payments: 35,
          avg_conversion_rate: 3.2
        }
      }
    ];

    return { demoStats, demoTimeSeries, demoCountries, demoTopShops };
  }, [period]);

  const applyDemoData = useCallback(() => {
    const { demoStats, demoTimeSeries, demoCountries, demoTopShops } = generateDemoData();
    setStats(demoStats);
    setPaymentMethods([
      { name: 'Mobile Money', value: demoStats.payments.mobile_money_breakdown.orange + demoStats.payments.mobile_money_breakdown.mtn + demoStats.payments.mobile_money_breakdown.moov, color: '#ffa726' },
      { name: 'Carte Bancaire', value: demoStats.payments.methods_distribution.card || 267, color: '#1b5e20' },
      { name: 'Espèces', value: demoStats.payments.methods_distribution.cash || 157, color: '#ffe082' }
    ]);
    setTopShops(demoTopShops);
    setTimeSeriesData(demoTimeSeries);
    setCountryData(demoCountries);
  }, [generateDemoData]);

  const fetchDashboardData = useCallback(async () => {
    try {
      requestRef.current?.abort();
      const controller = new AbortController();
      requestRef.current = controller;
      setLoading(true);
      applyDemoData();
      setLoading(false);

      const overviewUrl = `/api/admin/dashboard/overview?period=${period}`;
      const topShopsUrl = `/api/admin/analytics/top-shops?period=${period}&metric=${selectedMetric}&limit=5`;
      const trendsUrl = `/api/admin/analytics/revenue-trends?period=${period}`;
      const countriesUrl = `/api/admin/analytics/country-stats?period=${period}`;

      const [overview, top, trends, countries] = await Promise.all([
        fetchWithTimeout(overviewUrl, controller.signal),
        fetchWithTimeout(topShopsUrl, controller.signal),
        fetchWithTimeout(trendsUrl, controller.signal),
        fetchWithTimeout(countriesUrl, controller.signal)
      ]);

      if (controller.signal.aborted) return;

      if (overview?.success && overview?.data) {
        setStats(overview.data);
        const dist = overview.data?.payments?.methods_distribution || {};
        const methodsData = Object.entries(dist)
          .map(([name, value], index) => ({
            name: name === 'mobile_money' ? 'Mobile Money' : name === 'card' ? 'Carte Bancaire' : name === 'cash' ? 'Espèces' : name,
            value: Number(value || 0),
            color: CHART_COLORS[index % CHART_COLORS.length]
          }));
        if (methodsData.length > 0) setPaymentMethods(methodsData);
      }

      if (top?.success && top?.data?.top_shops) {
        setTopShops(top.data.top_shops);
      }

      if (trends?.success && trends?.data?.trends) {
        setTimeSeriesData(trends.data.trends);
      }

      if (countries?.success && countries?.data?.countries) {
        setCountryData(countries.data.countries);
      }

    } catch (error) {
      applyDemoData();
    } finally {
      setLoading(false);
    }
  }, [applyDemoData, fetchWithTimeout, period, selectedMetric]);

  useEffect(() => {
    fetchDashboardData();
    // Ajouter un timer pour mettre a jour l'heure
    const timer = setInterval(() => {
      setLastUpdated(new Date());
    }, 60000); // Mise a jour toutes les minutes

    return () => clearInterval(timer);
  }, [fetchDashboardData]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('fr-FR').format(num);
  };

  const exportDashboardData = (format: 'csv' | 'pdf' = 'csv') => {
    const csvContent = [
      ['Métrique', 'Valeur', 'Période'],
      ['Total Boutiques', stats.shops.total.toString(), `${period} jours`],
      ['Boutiques Actives', stats.shops.active.toString(), `${period} jours`],
      ['Boutiques Vérifiées', stats.shops.verified.toString(), `${period} jours`],
      ['Revenus Totaux', formatCurrency(stats.payments.total_revenue), `${period} jours`],
      ['Taux de Réussite', `${stats.payments.success_rate}%`, `${period} jours`],
      ['Paiements Mobiles', formatNumber(stats.payments.mobile_money_breakdown.orange + stats.payments.mobile_money_breakdown.mtn + stats.payments.mobile_money_breakdown.moov), `${period} jours`],
      ['Orange Money', formatNumber(stats.payments.mobile_money_breakdown.orange), `${period} jours`],
      ['MTN Money', formatNumber(stats.payments.mobile_money_breakdown.mtn), `${period} jours`],
      ['Moov Money', formatNumber(stats.payments.mobile_money_breakdown.moov), `${period} jours`],
      ['Nouveaux Utilisateurs', formatNumber(stats.users.new_this_period), `${period} jours`]
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `tableau_bord_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const getCountryFlag = (country: string) => {
    const flags: Record<string, string> = {
      'Côte d\'Ivoire': '🇨🇮',
      'Sénégal': '🇸🇳',
      'Mali': '🇲🇱',
      'Burkina Faso': '🇧🇫',
      'Niger': '🇳🇪',
      'Togo': '🇹🇬',
      'Bénin': '🇧🇯',
      'Ghana': '🇬🇭',
      'Nigeria': '🇳🇬',
      'Cameroun': '🇨🇲'
    };
    return flags[country] || '🌍';
  };

  const getOperatorColor = (operator: string) => {
    const colors: Record<string, string> = {
      'orange': '#ffa726',
      'mtn': '#ffe082',
      'moov': '#1b5e20'
    };
    return colors[operator] || '#6B7280';
  };

  // Fonction pour générer des données de démonstration
  const legacyGenerateDemoData = () => {
    const demoStats: DashboardStats = {
      period_days: period,
      shops: {
        total: 247,
        active: 198,
        verified: 156,
        new_this_period: 23,
        approval_rate: 89.5
      },
      payments: {
        total: 1847,
        successful: 1723,
        success_rate: 93.3,
        total_revenue: 15678000,
        methods_distribution: {
          mobile_money: 1423,
          card: 267,
          cash: 157
        },
        mobile_money_breakdown: {
          orange: 578,
          mtn: 521,
          moov: 324
        }
      },
      users: {
        new_this_period: 89
      },
      shop_metrics: {
        total_revenue: 15678000,
        total_orders: 1847
      }
    };

    const demoTimeSeries: TimeSeriesData[] = [];
    const days = Math.min(period, 30); // Limiter à 30 jours pour l'affichage
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      demoTimeSeries.push({
        date: date.toISOString().split('T')[0],
        revenue: Math.floor(Math.random() * 500000) + 200000,
        orders: Math.floor(Math.random() * 80) + 20,
        conversion_rate: Math.random() * 5 + 2
      });
    }

    const demoCountries: CountryData[] = [
      { country: 'Côte d\'Ivoire', revenue: 8234000, orders: 923, shops: 89, flag: '🇨🇮' },
      { country: 'Sénégal', revenue: 3421000, orders: 412, shops: 45, flag: '🇸🇳' },
      { country: 'Mali', revenue: 2187000, orders: 267, shops: 32, flag: '🇲🇱' },
      { country: 'Burkina Faso', revenue: 1845000, orders: 245, shops: 28, flag: '🇧🇫' }
    ];

    const demoTopShops: TopShop[] = [
      {
        id: '1',
        name: 'Boutique Élégance Africaine',
        slug: 'elegance-africaine',
        status: 'approved',
        is_verified: true,
        rating: 4.8,
        review_count: 127,
        metrics: {
          total_revenue: 2345000,
          total_orders: 89,
          successful_payments: 84,
          avg_conversion_rate: 4.2
        }
      },
      {
        id: '2',
        name: 'Tech Store CI',
        slug: 'tech-store-ci',
        status: 'approved',
        is_verified: true,
        rating: 4.6,
        review_count: 203,
        metrics: {
          total_revenue: 1892000,
          total_orders: 156,
          successful_payments: 148,
          avg_conversion_rate: 3.8
        }
      },
      {
        id: '3',
        name: 'Mode & Tradition',
        slug: 'mode-tradition',
        status: 'approved',
        is_verified: false,
        rating: 4.3,
        review_count: 89,
        metrics: {
          total_revenue: 1567000,
          total_orders: 67,
          successful_payments: 63,
          avg_conversion_rate: 3.5
        }
      },
      {
        id: '4',
        name: 'Artisanat du Sénégal',
        slug: 'artisanat-senegal',
        status: 'approved',
        is_verified: true,
        rating: 4.7,
        review_count: 94,
        metrics: {
          total_revenue: 1234000,
          total_orders: 45,
          successful_payments: 43,
          avg_conversion_rate: 4.1
        }
      },
      {
        id: '5',
        name: 'Épicerie Bio Mali',
        slug: 'epicerie-bio-mali',
        status: 'pending',
        is_verified: false,
        rating: 4.1,
        review_count: 56,
        metrics: {
          total_revenue: 987000,
          total_orders: 38,
          successful_payments: 35,
          avg_conversion_rate: 3.2
        }
      }
    ];

    return { demoStats, demoTimeSeries, demoCountries, demoTopShops };
  };

  const quickActions: QuickAction[] = [
    {
      id: 'create-shop',
      title: 'Créer une boutique',
      description: 'Ajouter une nouvelle boutique à la plateforme',
      icon: Plus,
      action: () => {
        navigate('/admin/shops');
      },
      color: 'orange'
    },
    {
      id: 'mangoo-wallet',
      title: 'Portefeuille',
      description: 'Gérer la trésorerie et les crédits BNPL',
      icon: Wallet,
      action: () => {
        navigate('/admin/wallet');
      },
      color: 'orange'
    },
    {
      id: 'mangoo-local',
      title: 'Mangoo Local+',
      description: 'Voir la carte et les innovations locales',
      icon: MapPin,
      action: () => {
        window.open('/mangoo-local.html', '_blank');
      },
      color: 'green'
    },
    {
      id: 'view-payments',
      title: 'Voir les paiements',
      description: 'Consulter l\'historique des transactions',
      icon: CreditCard,
      path: '/admin/wallet?view=payments',
      color: 'green'
    },
    {
      id: 'manage-commissions',
      title: 'Gérer les commissions',
      description: 'Modifier les règles de commission',
      icon: DollarSign,
      path: '/admin/wallet?view=commissions',
      color: 'yellow'
    },
    {
      id: 'export-data',
      title: 'Exporter les données',
      description: 'Télécharger les rapports en CSV/PDF',
      icon: Download,
      action: () => exportDashboardData(),
      color: 'amber'
    }
  ];

  if (loading) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'} p-6 flex items-center justify-center`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1b5e20] mx-auto mb-4"></div>
          <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'} p-6`}>
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>Erreur lors du chargement des données</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="px-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Tableau de bord</h1>
              <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'} mt-1`}>Vue d'ensemble de la plateforme Mangoo Tech</p>
              <div className="flex items-center space-x-2 mt-2">
                <div className={`flex items-center text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  <Clock className="h-4 w-4 mr-1" />
                  Mis à jour: {lastUpdated.toLocaleTimeString('fr-FR')}
                </div>
                <button 
                  onClick={fetchDashboardData}
                  className={`p-1 transition-colors ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'}`}
                  title="Actualiser les données"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Activity className="h-5 w-5 text-[#1b5e20]" />
                <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>En ligne</span>
              </div>
              <select
                value={period}
                onChange={(e) => setPeriod(Number(e.target.value))}
                className={`px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#1b5e20] focus:border-transparent ${
                  isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                <option value={7}>7 derniers jours</option>
                <option value={30}>30 derniers jours</option>
                <option value={90}>90 derniers jours</option>
                <option value={365}>1 an</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Boutiques */}
          <div className={`rounded-lg shadow-sm p-6 border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Total Boutiques</p>
                <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{formatNumber(stats.shops.total)}</p>
                <p className={`text-sm mt-1 ${isDark ? 'text-[#66bb6a]' : 'text-[#1b5e20]'}`}>
                  <TrendingUp className="inline h-4 w-4 mr-1" />
                  {stats.shops.new_this_period} nouvelles ({period}j)
                </p>
              </div>
              <div className={`p-3 rounded-lg ${isDark ? 'bg-[#ffa726]/15' : 'bg-[#eef6ea]'}`}>
                <Store className={`h-6 w-6 ${isDark ? 'text-[#66bb6a]' : 'text-[#1b5e20]'}`} />
              </div>
            </div>
            <div className={`mt-4 pt-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className={`flex justify-between text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                <span>Actives:</span>
                <span className="font-medium">{stats.shops.active}</span>
              </div>
              <div className={`flex justify-between text-sm mt-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                <span>Vérifiées:</span>
                <span className="font-medium">{stats.shops.verified}</span>
              </div>
              <div className={`flex justify-between text-sm mt-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                <span>Taux d'approbation:</span>
                <span className="font-medium">{stats.shops.approval_rate}%</span>
              </div>
            </div>
          </div>

          {/* Revenus */}
          <div className={`rounded-lg shadow-sm p-6 border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Revenus Totaux</p>
                <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(stats.payments.total_revenue)}</p>
                <p className={`text-sm mt-1 ${isDark ? 'text-[#66bb6a]' : 'text-[#1b5e20]'}`}>
                  <TrendingUp className="inline h-4 w-4 mr-1" />
                  {stats.payments.success_rate}% de réussite
                </p>
              </div>
              <div className={`p-3 rounded-lg ${isDark ? 'bg-[#1b5e20]/15' : 'bg-[#eef6ea]'}`}>
                <DollarSign className={`h-6 w-6 ${isDark ? 'text-[#66bb6a]' : 'text-[#1b5e20]'}`} />
              </div>
            </div>
            <div className={`mt-4 pt-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className={`flex justify-between text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                <span>Paiements:</span>
                <span className="font-medium">{formatNumber(stats.payments.total)}</span>
              </div>
              <div className={`flex justify-between text-sm mt-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                <span>Réussis:</span>
                <span className="font-medium">{formatNumber(stats.payments.successful)}</span>
              </div>
            </div>
          </div>

          {/* Mobile Money */}
          <div className={`rounded-lg shadow-sm p-6 border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Mobile Money</p>
                <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {formatNumber(
                    stats.payments.mobile_money_breakdown.orange + 
                    stats.payments.mobile_money_breakdown.mtn + 
                    stats.payments.mobile_money_breakdown.moov
                  )}
                </p>
                <p className={`text-sm mt-1 ${isDark ? 'text-[#ffe082]' : 'text-[#8f4b00]'}`}>
                  <Smartphone className="inline h-4 w-4 mr-1" />
                  Paiements mobiles
                </p>
              </div>
              <div className={`p-3 rounded-lg ${isDark ? 'bg-[#ffa726]/15' : 'bg-[#fff4d6]'}`}>
                <Smartphone className={`h-6 w-6 ${isDark ? 'text-[#ffe082]' : 'text-[#8f4b00]'}`} />
              </div>
            </div>
            <div className={`mt-4 pt-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className={`flex justify-between text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                <span>Orange Money:</span>
                <span className="font-medium">{formatNumber(stats.payments.mobile_money_breakdown.orange)}</span>
              </div>
              <div className={`flex justify-between text-sm mt-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                <span>MTN Money:</span>
                <span className="font-medium">{formatNumber(stats.payments.mobile_money_breakdown.mtn)}</span>
              </div>
              <div className={`flex justify-between text-sm mt-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                <span>Moov Money:</span>
                <span className="font-medium">{formatNumber(stats.payments.mobile_money_breakdown.moov)}</span>
              </div>
            </div>
          </div>

          {/* Nouveaux Utilisateurs */}
          <div className={`rounded-lg shadow-sm p-6 border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Nouveaux Utilisateurs</p>
                <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{formatNumber(stats.users.new_this_period)}</p>
                <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  <Clock className="inline h-4 w-4 mr-1" />
                  {period} derniers jours
                </p>
              </div>
              <div className={`p-3 rounded-lg ${isDark ? 'bg-[#ffa726]/15' : 'bg-[#eef6ea]'}`}>
                <Users className={`h-6 w-6 ${isDark ? 'text-[#66bb6a]' : 'text-[#1b5e20]'}`} />
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Payment Methods Distribution */}
          <div className={`rounded-lg shadow-sm p-6 border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Répartition des Méthodes de Paiement</h3>
              <button className={`p-2 ${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}>
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentMethods}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#ffa726"
                    dataKey="value"
                  >
                    {paymentMethods.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [formatNumber(Number(value)), 'Transactions']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {paymentMethods.map((method, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: method.color }}></div>
                  <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{method.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Mobile Money Breakdown */}
          <div className={`rounded-lg shadow-sm p-6 border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Détail Mobile Money</h3>
              <div className="flex space-x-2">
                <button className={`p-2 ${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}>
                  <Filter className="h-4 w-4" />
                </button>
                <button className={`p-2 ${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}>
                  <Download className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    { 
                      name: 'Orange Money', 
                      value: stats.payments.mobile_money_breakdown.orange, 
                      color: '#ffa726',
                      fill: '#ffa726'
                    },
                    { 
                      name: 'MTN Money', 
                      value: stats.payments.mobile_money_breakdown.mtn, 
                      color: '#ffe082',
                      fill: '#ffe082'
                    },
                    { 
                      name: 'Moov Money', 
                      value: stats.payments.mobile_money_breakdown.moov, 
                      color: '#1b5e20',
                      fill: '#1b5e20'
                    }
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => [formatNumber(Number(value)), 'Transactions']} />
                  <Bar dataKey="value" fill="#ffa726" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-4 text-center">
              <div className={`p-3 rounded-lg ${isDark ? 'bg-[#ffa726]/15' : 'bg-[#eef6ea]'}`}>
                <div className={`text-2xl font-bold ${isDark ? 'text-[#66bb6a]' : 'text-[#1b5e20]'}`}>{formatNumber(stats.payments.mobile_money_breakdown.orange)}</div>
                <div className={`text-xs ${isDark ? 'text-[#66bb6a]' : 'text-[#16381a]'}`}>Orange Money</div>
              </div>
              <div className={`p-3 rounded-lg ${isDark ? 'bg-[#ffa726]/15' : 'bg-[#fff4d6]'}`}>
                <div className={`text-2xl font-bold ${isDark ? 'text-[#ffa726]' : 'text-[#8f4b00]'}`}>{formatNumber(stats.payments.mobile_money_breakdown.mtn)}</div>
                <div className={`text-xs ${isDark ? 'text-[#ffe082]' : 'text-[#8f4b00]'}`}>MTN Money</div>
              </div>
              <div className={`p-3 rounded-lg ${isDark ? 'bg-[#1b5e20]/15' : 'bg-[#eef6ea]'}`}>
                <div className={`text-2xl font-bold ${isDark ? 'text-[#66bb6a]' : 'text-[#1b5e20]'}`}>{formatNumber(stats.payments.mobile_money_breakdown.moov)}</div>
                <div className={`text-xs ${isDark ? 'text-[#66bb6a]' : 'text-[#16381a]'}`}>Moov Money</div>
              </div>
            </div>
          </div>
        </div>

        {/* Revenue Trends Chart */}
        {timeSeriesData.length > 0 && (
          <div className={`rounded-lg shadow-sm p-6 border mb-8 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Évolution des Revenus</h3>
              <div className="flex space-x-2">
                <button className={`px-3 py-1 text-sm ${isDark ? 'bg-[#ffa726]/15 text-[#66bb6a]' : 'bg-[#eef6ea] text-[#16381a]'} rounded-lg`}>Revenus</button>
                <button className={`px-3 py-1 text-sm ${isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'} rounded-lg`}>Commandes</button>
                <button className={`px-3 py-1 text-sm ${isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'} rounded-lg`}>Taux de conversion</button>
              </div>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => [
                      name === 'revenue' ? formatCurrency(Number(value)) : formatNumber(Number(value)),
                      name === 'revenue' ? 'Revenus' : 'Commandes'
                    ]}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#ffa726" 
                    fill="#ffa726" 
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="orders" 
                    stroke="#ffa726" 
                    strokeWidth={2}
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {quickActions.map((action) => {
            const IconComponent = action.icon;
            const colorClasses = {
              orange: 'bg-[#eef6ea] hover:bg-[#d7e4d1] border-[#cfe0c8] text-[#1b5e20]',
              green: 'bg-[#eef6ea] hover:bg-[#d7e4d1] border-[#cfe0c8] text-[#1b5e20]',
              yellow: 'bg-[#fff4d6] hover:bg-[#ffe082] border-[#ffe082] text-[#8f4b00]',
              amber: 'bg-[#fff4d6] hover:bg-[#ffe082] border-[#ffe082] text-[#8f4b00]'
            };
            
            const cardContent = (
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-lg bg-white bg-opacity-50">
                  <IconComponent className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">{action.title}</h4>
                  <p className="text-xs opacity-80 mt-1">{action.description}</p>
                </div>
              </div>
            );

            const cardClasses = `block p-6 rounded-lg border cursor-pointer transition-all duration-200 ${colorClasses[action.color as keyof typeof colorClasses]}`;

            if (action.external && action.path) {
              return (
                <a
                  key={action.id}
                  href={action.path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cardClasses}
                >
                  {cardContent}
                </a>
              );
            }

            if (action.path) {
              return (
                <Link
                  key={action.id}
                  to={action.path}
                  className={cardClasses}
                >
                  {cardContent}
                </Link>
              );
            }

            return (
              <div 
                key={action.id}
                onClick={action.action}
                className={cardClasses}
              >
                {cardContent}
              </div>
            );
          })}
        </div>

        {/* Country Performance */}
        {countryData.length > 0 && (
          <div className={`rounded-lg shadow-sm border mb-8 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className={`p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex justify-between items-center">
                <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Performance par Pays</h3>
                <div className="flex space-x-2">
                  <button className={`p-2 ${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}>
                    <Filter className="h-4 w-4" />
                  </button>
                  <button className={`p-2 ${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}>
                    <Download className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {countryData.map((country, index) => (
                  <div key={index} className={`flex items-center justify-between p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <div className="flex items-center space-x-4">
                      <div className="text-2xl">{getCountryFlag(country.country)}</div>
                      <div>
                        <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{country.country}</h4>
                        <div className={`flex items-center space-x-4 text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          <span>{formatNumber(country.shops)} boutiques</span>
                          <span>•</span>
                          <span>{formatNumber(country.orders)} commandes</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {formatCurrency(country.revenue)}
                      </div>
                      <div className={`text-sm ${isDark ? 'text-[#66bb6a]' : 'text-[#1b5e20]'}`}>
                        +{((country.revenue / countryData.reduce((sum, c) => sum + c.revenue, 0)) * 100).toFixed(1)}% du total
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Top Shops Section */}
        <div className={`rounded-lg shadow-sm border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className={`p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex justify-between items-center">
              <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Meilleures Boutiques</h3>
              <select
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value as any)}
                className={`px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#1b5e20] focus:border-transparent ${
                  isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                <option value="revenue">Par Revenu</option>
                <option value="orders">Par Commandes</option>
                <option value="conversion_rate">Par Taux de Conversion</option>
              </select>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {topShops.map((shop, index) => (
                <div key={shop.id} className={`flex items-center justify-between p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDark ? 'bg-[#ffa726]/15 text-[#66bb6a]' : 'bg-[#eef6ea] text-[#1b5e20]'}`}>
                        <span className="font-semibold">{index + 1}</span>
                      </div>
                    </div>
                    <div>
                      <h4 className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{shop.name}</h4>
                      <div className="flex items-center space-x-2 mt-1">
                        <div className="flex items-center">
                          <Star className="h-4 w-4 text-[#ffe082] fill-current" />
                          <span className={`text-sm ml-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{shop.rating}</span>
                        </div>
                        {shop.is_verified && (
                          <CheckCircle className="h-4 w-4 text-[#1b5e20]" />
                        )}
                        {shop.status === 'approved' ? (
                          <span className="px-2 py-1 text-xs bg-[#eef6ea] text-[#16381a] rounded-full">Approuvée</span>
                        ) : (
                          <span className="px-2 py-1 text-xs bg-[#fff4d6] text-[#8f4b00] rounded-full">En attente</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {selectedMetric === 'revenue' && formatCurrency(shop.metrics.total_revenue)}
                      {selectedMetric === 'orders' && formatNumber(shop.metrics.total_orders) + ' commandes'}
                      {selectedMetric === 'conversion_rate' && shop.metrics.avg_conversion_rate.toFixed(1) + '%'}
                    </div>
                    <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {formatNumber(shop.metrics.successful_payments)} paiements réussis
                    </div>
                  </div>
                </div>
              ))}
              {topShops.length === 0 && (
                <div className="text-center py-8">
                  <Store className={`h-12 w-12 mx-auto mb-4 ${isDark ? 'text-gray-400' : 'text-gray-400'}`} />
                  <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>Aucune boutique disponible pour cette période</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
