import React, { useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { useThemeStore } from '../stores/themeStore';
import { TrendingUp, TrendingDown, DollarSign, Users, Package, Activity } from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];
const DARK_COLORS = ['#60A5FA', '#34D399', '#FBBF24', '#FB923C', '#A78BFA'];

export const PaymentAnalyticsDashboard = () => {
  const { isDark } = useThemeStore();
  const isDarkMode = isDark;
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30d');
  const [currency, setCurrency] = useState('all');

  const fetchAnalyticsData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3009/api/analytics/stats?range=${dateRange}&currency=${currency}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const text = await response.text();
      if (!text) {
        throw new Error('Réponse API vide');
      }
      
      const data = JSON.parse(text);
      
      if (data.success && data.data) {
        setAnalyticsData(data.data);
      } else {
        console.warn('Données analytics invalides:', data);
        setAnalyticsData({
          totalRevenue: 0,
          totalTransactions: 0,
          activeUsers: 0,
          packsSold: 0,
          conversionRate: 0,
          revenueTrend: [],
          paymentMethodDistribution: [],
          topUsers: []
        });
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des données analytics:', error);
      // Utiliser des données mock en cas d'erreur
      setAnalyticsData({
        totalRevenue: 125430.50,
        totalTransactions: 342,
        activeUsers: 156,
        packsSold: 89,
        conversionRate: 23.5,
        revenueTrend: [
          { date: '2024-01-01', revenue: 1200 },
          { date: '2024-01-02', revenue: 1850 },
          { date: '2024-01-03', revenue: 2100 },
          { date: '2024-01-04', revenue: 1750 },
          { date: '2024-01-05', revenue: 2300 },
          { date: '2024-01-06', revenue: 2800 },
          { date: '2024-01-07', revenue: 3200 }
        ],
        paymentMethodDistribution: [
          { name: 'Orange Money', value: 35 },
          { name: 'MTN Money', value: 28 },
          { name: 'Moov Money', value: 15 },
          { name: 'PayPal', value: 12 },
          { name: 'Stripe', value: 10 }
        ],
        topUsers: [
          { id: 1, name: 'Jean Dupont', email: 'jean@example.com', totalSpent: 1250.00, transactionCount: 15 },
          { id: 2, name: 'Marie Martin', email: 'marie@example.com', totalSpent: 980.50, transactionCount: 12 },
          { id: 3, name: 'Pierre Bernard', email: 'pierre@example.com', totalSpent: 750.25, transactionCount: 8 }
        ]
      });
    } finally {
      setLoading(false);
    }
  }, [currency, dateRange]);

  useEffect(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  if (loading) {
    return (
      <div className={`min-h-screen p-6 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="flex items-center justify-center h-64">
          <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${isDarkMode ? 'border-blue-400' : 'border-blue-500'}`}></div>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className={`min-h-screen p-6 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className={`text-center ${isDarkMode ? 'text-red-400' : 'text-red-500'}`}>
          Erreur lors du chargement des données
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-6 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-3xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Tableau de Bord Analytics
          </h1>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Suivez les performances de vos paiements et analysez les tendances
          </p>
          
          {/* Controls */}
          <div className="flex flex-wrap gap-4 mb-6">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className={`px-4 py-2 rounded-lg border transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                isDarkMode 
                  ? 'bg-gray-800 border-gray-600 text-white hover:bg-gray-700' 
                  : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50'
              }`}
            >
              <option value="7d">7 derniers jours</option>
              <option value="30d">30 derniers jours</option>
              <option value="90d">90 derniers jours</option>
              <option value="1y">1 an</option>
            </select>
            
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className={`px-4 py-2 rounded-lg border transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                isDarkMode 
                  ? 'bg-gray-800 border-gray-600 text-white hover:bg-gray-700' 
                  : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50'
              }`}
            >
              <option value="all">Toutes les devises</option>
              <option value="XOF">XOF</option>
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
            </select>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className={`rounded-xl shadow-lg p-6 border-l-4 border-blue-500 transition-colors duration-300 ${
            isDarkMode 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Revenu Total
                </p>
                <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {analyticsData.totalRevenue || '0.00'} €
                </p>
              </div>
              <div className={`p-3 rounded-full ${isDarkMode ? 'bg-blue-900/30' : 'bg-blue-100'}`}>
                <DollarSign className={`h-6 w-6 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <TrendingUp className={`h-4 w-4 mr-1 ${isDarkMode ? 'text-green-400' : 'text-green-500'}`} />
              <span className={`text-sm ${isDarkMode ? 'text-green-400' : 'text-green-500'}`}>+12.5%</span>
            </div>
          </div>

          <div className={`rounded-xl shadow-lg p-6 border-l-4 border-green-500 transition-colors duration-300 ${
            isDarkMode 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Transactions
                </p>
                <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {analyticsData.totalTransactions || 0}
                </p>
              </div>
              <div className={`p-3 rounded-full ${isDarkMode ? 'bg-green-900/30' : 'bg-green-100'}`}>
                <Activity className={`h-6 w-6 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <TrendingUp className={`h-4 w-4 mr-1 ${isDarkMode ? 'text-green-400' : 'text-green-500'}`} />
              <span className={`text-sm ${isDarkMode ? 'text-green-400' : 'text-green-500'}`}>+8.2%</span>
            </div>
          </div>

          <div className={`rounded-xl shadow-lg p-6 border-l-4 border-purple-500 transition-colors duration-300 ${
            isDarkMode 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Utilisateurs Actifs
                </p>
                <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {analyticsData.activeUsers || 0}
                </p>
              </div>
              <div className={`p-3 rounded-full ${isDarkMode ? 'bg-purple-900/30' : 'bg-purple-100'}`}>
                <Users className={`h-6 w-6 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <TrendingDown className={`h-4 w-4 mr-1 ${isDarkMode ? 'text-red-400' : 'text-red-500'}`} />
              <span className={`text-sm ${isDarkMode ? 'text-red-400' : 'text-red-500'}`}>-2.1%</span>
            </div>
          </div>

          <div className={`rounded-xl shadow-lg p-6 border-l-4 border-orange-500 transition-colors duration-300 ${
            isDarkMode 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Packs Vendus
                </p>
                <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {analyticsData.packsSold || 0}
                </p>
              </div>
              <div className={`p-3 rounded-full ${isDarkMode ? 'bg-orange-900/30' : 'bg-orange-100'}`}>
                <Package className={`h-6 w-6 ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`} />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <TrendingUp className={`h-4 w-4 mr-1 ${isDarkMode ? 'text-green-400' : 'text-green-500'}`} />
              <span className={`text-sm ${isDarkMode ? 'text-green-400' : 'text-green-500'}`}>+15.3%</span>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Revenue Trend */}
          <div className={`p-6 rounded-lg shadow-lg transition-all duration-300 hover:shadow-2xl ${
            isDarkMode 
              ? 'bg-gray-800 border border-gray-700' 
              : 'bg-white border border-gray-200'
          }`}>
            <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Évolution du Revenu
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analyticsData.revenueTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#4b5563' : '#e5e7eb'} />
                <XAxis 
                  dataKey="date" 
                  stroke={isDarkMode ? '#d1d5db' : '#6b7280'}
                  fontSize={12}
                />
                <YAxis 
                  stroke={isDarkMode ? '#d1d5db' : '#6b7280'}
                  fontSize={12}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
                    border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
                    borderRadius: '8px',
                    color: isDarkMode ? '#ffffff' : '#000000'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke={isDarkMode ? '#60A5FA' : '#3b82f6'} 
                  strokeWidth={2}
                  dot={{ fill: isDarkMode ? '#60A5FA' : '#3b82f6', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Payment Method Distribution */}
          <div className={`p-6 rounded-lg shadow-lg transition-all duration-300 hover:shadow-2xl ${
            isDarkMode 
              ? 'bg-gray-800 border border-gray-700' 
              : 'bg-white border border-gray-200'
          }`}>
            <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Répartition par Méthode de Paiement
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analyticsData.paymentMethodDistribution}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelStyle={{
                    fill: isDarkMode ? '#ffffff' : '#000000',
                    fontSize: 12,
                    fontWeight: 'bold'
                  }}
                >
                  {analyticsData.paymentMethodDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={isDarkMode ? DARK_COLORS[index % DARK_COLORS.length] : COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
                    border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
                    borderRadius: '8px',
                    color: isDarkMode ? '#ffffff' : '#000000'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Users Table */}
        <div className={`p-6 rounded-lg shadow-lg transition-all duration-300 hover:shadow-2xl ${
          isDarkMode 
            ? 'bg-gray-800 border border-gray-700' 
            : 'bg-white border border-gray-200'
        }`}>
          <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Top Utilisateurs par Dépenses
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className={`border-b ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                  <th className={`text-left py-3 px-4 font-semibold ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Utilisateur
                  </th>
                  <th className={`text-left py-3 px-4 font-semibold ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Email
                  </th>
                  <th className={`text-left py-3 px-4 font-semibold ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Dépenses Totales
                  </th>
                  <th className={`text-left py-3 px-4 font-semibold ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Transactions
                  </th>
                </tr>
              </thead>
              <tbody>
                {analyticsData.topUsers.map((user, index) => (
                  <tr key={user.id} className={`border-b transition-colors duration-200 ${
                    isDarkMode 
                      ? 'border-gray-600 hover:bg-gray-800/50' 
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}>
                    <td className={`py-3 px-4 font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {user.name}
                    </td>
                    <td className={`py-3 px-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {user.email}
                    </td>
                    <td className={`py-3 px-4 font-semibold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                      {user.totalSpent.toFixed(2)} €
                    </td>
                    <td className={`py-3 px-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {user.transactionCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentAnalyticsDashboard;
