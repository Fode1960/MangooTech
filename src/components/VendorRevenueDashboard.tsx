import React, { useState, useEffect, useMemo } from 'react';
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Users, Calendar, Download, Filter, Eye } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

interface RevenueData {
  date: string;
  revenue: number;
  orders: number;
  commission: number;
  netRevenue: number;
}

interface ProductRevenue {
  name: string;
  revenue: number;
  quantity: number;
  color: string;
}

interface PaymentMethodRevenue {
  method: string;
  revenue: number;
  percentage: number;
  color: string;
}

interface VendorRevenueDashboardProps {
  vendorId: string;
  dateRange?: 'week' | 'month' | 'quarter' | 'year';
}

const VendorRevenueDashboard: React.FC<VendorRevenueDashboardProps> = ({ vendorId, dateRange = 'month' }) => {
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [productRevenue, setProductRevenue] = useState<ProductRevenue[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodRevenue[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState(dateRange);
  const [isLoading, setIsLoading] = useState(true);

  // Données de démonstration
  const demoRevenueData: RevenueData[] = useMemo(() => [
    { date: '2024-01-01', revenue: 450000, orders: 12, commission: 11250, netRevenue: 438750 },
    { date: '2024-01-02', revenue: 380000, orders: 8, commission: 9500, netRevenue: 370500 },
    { date: '2024-01-03', revenue: 520000, orders: 15, commission: 13000, netRevenue: 507000 },
    { date: '2024-01-04', revenue: 290000, orders: 6, commission: 7250, netRevenue: 282750 },
    { date: '2024-01-05', revenue: 670000, orders: 18, commission: 16750, netRevenue: 653250 },
    { date: '2024-01-06', revenue: 420000, orders: 11, commission: 10500, netRevenue: 409500 },
    { date: '2024-01-07', revenue: 580000, orders: 14, commission: 14500, netRevenue: 565500 }
  ], []);

  const demoProductRevenue: ProductRevenue[] = useMemo(() => [
    { name: 'iPhone 14 Pro Max', revenue: 1250000, quantity: 25, color: '#3B82F6' },
    { name: 'Robe Wax Africain', revenue: 850000, quantity: 42, color: '#10B981' },
    { name: 'AttiÃ©kÃ© Traditionnel', revenue: 320000, quantity: 128, color: '#F59E0B' },
    { name: 'Chaussures Nike', revenue: 680000, quantity: 34, color: '#EF4444' },
    { name: 'Montre Rolex', revenue: 2100000, quantity: 3, color: '#8B5CF6' }
  ], []);

  const demoPaymentMethods: PaymentMethodRevenue[] = useMemo(() => [
    { method: 'Carte Bancaire', revenue: 2340000, percentage: 45, color: '#3B82F6' },
    { method: 'Orange Money', revenue: 1560000, percentage: 30, color: '#F97316' },
    { method: 'MTN Money', revenue: 1040000, percentage: 20, color: '#EAB308' },
    { method: 'Moov Money', revenue: 260000, percentage: 5, color: '#8B5CF6' }
  ], []);

  useEffect(() => {
    // Simulation du chargement des données
    const timeoutId = window.setTimeout(() => {
      setRevenueData(demoRevenueData);
      setProductRevenue(demoProductRevenue);
      setPaymentMethods(demoPaymentMethods);
      setIsLoading(false);
    }, 1000);

    return () => window.clearTimeout(timeoutId);
  }, [demoPaymentMethods, demoProductRevenue, demoRevenueData, selectedPeriod]);

  const calculateTotals = () => {
    const totalRevenue = revenueData.reduce((sum, day) => sum + day.revenue, 0);
    const totalOrders = revenueData.reduce((sum, day) => sum + day.orders, 0);
    const totalCommission = revenueData.reduce((sum, day) => sum + day.commission, 0);
    const totalNetRevenue = revenueData.reduce((sum, day) => sum + day.netRevenue, 0);
    
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    
    return {
      totalRevenue,
      totalOrders,
      totalCommission,
      totalNetRevenue,
      avgOrderValue
    };
  };

  const totals = calculateTotals();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (number: number) => {
    return new Intl.NumberFormat('fr-FR').format(number);
  };

  const exportData = () => {
    const data = {
      period: selectedPeriod,
      totals,
      dailyData: revenueData,
      productRevenue,
      paymentMethods
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `revenue-report-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const previousPeriodData = {
    revenue: totals.totalRevenue * 0.85, // -15% par rapport à la période actuelle
    orders: Math.floor(totals.totalOrders * 0.9) // -10% par rapport à la période actuelle
  };

  const revenueChange = ((totals.totalRevenue - previousPeriodData.revenue) / previousPeriodData.revenue) * 100;
  const ordersChange = ((totals.totalOrders - previousPeriodData.orders) / previousPeriodData.orders) * 100;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1b5e20]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec contrôles */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Tableau de Bord des Revenus</h2>
          <p className="text-gray-600">Analyse détaillée de vos performances financières</p>
        </div>
        <div className="flex gap-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1b5e20]/30 focus:border-transparent"
          >
            <option value="week">Cette semaine</option>
            <option value="month">Ce mois</option>
            <option value="quarter">Ce trimestre</option>
            <option value="year">Cette année</option>
          </select>
          <button
            onClick={exportData}
            className="px-4 py-2 bg-[#1b5e20] text-white rounded-lg hover:bg-[#1b5e20] transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Exporter
          </button>
        </div>
      </div>

      {/* Cartes de statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Revenu Total</p>
              <p className="text-3xl font-bold text-gray-900">{formatCurrency(totals.totalRevenue)}</p>
              <div className={`flex items-center gap-1 mt-1 text-sm ${revenueChange >= 0 ? 'text-[#1b5e20]' : 'text-red-600'}`}>
                {revenueChange >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                <span>{Math.abs(revenueChange).toFixed(1)}% vs période précédente</span>
              </div>
            </div>
            <div className="bg-[#eef6ea] p-3 rounded-full">
              <DollarSign className="w-6 h-6 text-[#1b5e20]" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Commandes</p>
              <p className="text-3xl font-bold text-gray-900">{formatNumber(totals.totalOrders)}</p>
              <div className={`flex items-center gap-1 mt-1 text-sm ${ordersChange >= 0 ? 'text-[#1b5e20]' : 'text-red-600'}`}>
                {ordersChange >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                <span>{Math.abs(ordersChange).toFixed(1)}% vs période précédente</span>
              </div>
            </div>
            <div className="bg-[#eef6ea] p-3 rounded-full">
              <ShoppingCart className="w-6 h-6 text-[#1b5e20]" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Commission Totale</p>
              <p className="text-3xl font-bold text-gray-900">{formatCurrency(totals.totalCommission)}</p>
              <p className="text-xs text-gray-500 mt-1">Frais de la plateforme</p>
            </div>
            <div className="bg-[#fff4d6] p-3 rounded-full">
              <DollarSign className="w-6 h-6 text-[#8f4b00]" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Revenu Net</p>
              <p className="text-3xl font-bold text-gray-900">{formatCurrency(totals.totalNetRevenue)}</p>
              <p className="text-xs text-gray-500 mt-1">Après commission</p>
            </div>
            <div className="bg-[#eef6ea] p-3 rounded-full">
              <DollarSign className="w-6 h-6 text-[#1b5e20]" />
            </div>
          </div>
        </div>
      </div>

      {/* Graphique des revenus quotidiens */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Évolution des Revenus</h3>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>7 derniers jours</span>
          </div>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={(date) => new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })} />
              <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
              <Tooltip 
                formatter={(value, name) => [formatCurrency(Number(value)), name === 'revenue' ? 'Revenu brut' : 'Revenu net']}
                labelFormatter={(date) => new Date(date).toLocaleDateString('fr-FR')}
              />
              <Line type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={2} name="Revenu brut" />
              <Line type="monotone" dataKey="netRevenue" stroke="#10B981" strokeWidth={2} name="Revenu net" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenus par produit */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Revenus par Produit</h3>
            <Filter className="w-5 h-5 text-gray-400" />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={productRevenue}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Revenu']} />
                <Bar dataKey="revenue" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Répartition par méthode de paiement */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Répartition par Méthode de Paiement</h3>
            <Eye className="w-5 h-5 text-gray-400" />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={paymentMethods}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ method, percentage }) => `${method} (${percentage}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="revenue"
                >
                  {paymentMethods.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Revenu']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            {paymentMethods.map((method) => (
              <div key={method.method} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: method.color }}></div>
                  <span className="text-sm text-gray-600">{method.method}</span>
                </div>
                <span className="text-sm font-medium text-gray-900">{formatCurrency(method.revenue)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tableau des performances quotidiennes */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Performances Quotidiennes</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revenu Brut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Commission
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revenu Net
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Commandes
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Panier Moyen
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {revenueData.map((day, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(day.date).toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: '2-digit' })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatCurrency(day.revenue)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatCurrency(day.commission)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#1b5e20]">
                    {formatCurrency(day.netRevenue)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {day.orders}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatCurrency(day.revenue / day.orders)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default VendorRevenueDashboard;
