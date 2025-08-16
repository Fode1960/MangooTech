// Composant pour le tracking et l'analyse des statistiques de services

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Eye,
  ShoppingCart,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  Activity,
  Target,
  Zap,
  Globe,
  Clock,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  getAllServices,
  getUserServices,
  updateUserServiceStats
} from '../../lib/services.js';

const ServiceAnalytics = () => {
  const [services, setServices] = useState([]);
  const [userServices, setUserServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [selectedService, setSelectedService] = useState('all');
  const [analyticsData, setAnalyticsData] = useState(null);

  // Charger les données
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [servicesData, userServicesData] = await Promise.all([
        getAllServices(),
        // Simuler la récupération de tous les services utilisateur
        Promise.resolve(generateMockUserServices())
      ]);
      
      setServices(servicesData);
      setUserServices(userServicesData);
      
      // Générer les données d'analyse
      const analytics = generateAnalyticsData(servicesData, userServicesData, selectedPeriod);
      setAnalyticsData(analytics);
      
    } catch (err) {
      console.error('Erreur lors du chargement des données:', err);
      setError('Impossible de charger les données d\'analyse');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedPeriod, selectedService]);

  // Générer des données simulées pour les services utilisateur
  const generateMockUserServices = () => {
    const mockData = [];
    const userIds = ['1', '2', '3', '4', '5'];
    const serviceIds = ['1', '2', '3', '4', '5'];
    
    userIds.forEach(userId => {
      serviceIds.forEach(serviceId => {
        if (Math.random() > 0.3) { // 70% de chance d'avoir le service
          mockData.push({
            user_id: userId,
            service_id: serviceId,
            status: ['active', 'inactive', 'pending'][Math.floor(Math.random() * 3)],
            visits: Math.floor(Math.random() * 1000) + 50,
            sales: Math.floor(Math.random() * 50) + 1,
            revenue: Math.floor(Math.random() * 50000) + 1000,
            created_at: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date().toISOString()
          });
        }
      });
    });
    
    return mockData;
  };

  // Générer les données d'analyse
  const generateAnalyticsData = (services, userServices, period) => {
    const now = new Date();
    const periodDays = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365
    }[period];
    
    // Données temporelles
    const timeSeriesData = [];
    for (let i = periodDays - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayData = {
        date: date.toISOString().split('T')[0],
        visits: Math.floor(Math.random() * 500) + 100,
        sales: Math.floor(Math.random() * 50) + 5,
        revenue: Math.floor(Math.random() * 25000) + 5000,
        activeUsers: Math.floor(Math.random() * 100) + 20
      };
      timeSeriesData.push(dayData);
    }
    
    // Statistiques par service
    const serviceStats = services.map(service => {
      const serviceUserServices = userServices.filter(us => us.service_id === service.id);
      const totalVisits = serviceUserServices.reduce((sum, us) => sum + (us.visits || 0), 0);
      const totalSales = serviceUserServices.reduce((sum, us) => sum + (us.sales || 0), 0);
      const totalRevenue = serviceUserServices.reduce((sum, us) => sum + (us.revenue || 0), 0);
      const activeUsers = serviceUserServices.filter(us => us.status === 'active').length;
      
      return {
        name: service.name,
        visits: totalVisits,
        sales: totalSales,
        revenue: totalRevenue,
        activeUsers,
        conversionRate: totalVisits > 0 ? (totalSales / totalVisits * 100).toFixed(2) : '0.00'
      };
    });
    
    // Répartition des statuts
    const statusDistribution = [
      {
        name: 'Actif',
        value: userServices.filter(us => us.status === 'active').length,
        color: '#10B981'
      },
      {
        name: 'Inactif',
        value: userServices.filter(us => us.status === 'inactive').length,
        color: '#EF4444'
      },
      {
        name: 'En attente',
        value: userServices.filter(us => us.status === 'pending').length,
        color: '#F59E0B'
      }
    ];
    
    // Métriques globales
    const totalVisits = userServices.reduce((sum, us) => sum + (us.visits || 0), 0);
    const totalSales = userServices.reduce((sum, us) => sum + (us.sales || 0), 0);
    const totalRevenue = userServices.reduce((sum, us) => sum + (us.revenue || 0), 0);
    const totalActiveUsers = userServices.filter(us => us.status === 'active').length;
    
    const previousPeriodMultiplier = 0.85 + Math.random() * 0.3; // Simulation de croissance
    
    return {
      timeSeries: timeSeriesData,
      serviceStats,
      statusDistribution,
      globalMetrics: {
        totalVisits: {
          current: totalVisits,
          previous: Math.floor(totalVisits * previousPeriodMultiplier),
          growth: ((totalVisits / (totalVisits * previousPeriodMultiplier) - 1) * 100).toFixed(1)
        },
        totalSales: {
          current: totalSales,
          previous: Math.floor(totalSales * previousPeriodMultiplier),
          growth: ((totalSales / (totalSales * previousPeriodMultiplier) - 1) * 100).toFixed(1)
        },
        totalRevenue: {
          current: totalRevenue,
          previous: Math.floor(totalRevenue * previousPeriodMultiplier),
          growth: ((totalRevenue / (totalRevenue * previousPeriodMultiplier) - 1) * 100).toFixed(1)
        },
        activeUsers: {
          current: totalActiveUsers,
          previous: Math.floor(totalActiveUsers * previousPeriodMultiplier),
          growth: ((totalActiveUsers / (totalActiveUsers * previousPeriodMultiplier) - 1) * 100).toFixed(1)
        }
      }
    };
  };

  const getPeriodLabel = (period) => {
    switch (period) {
      case '7d': return '7 derniers jours';
      case '30d': return '30 derniers jours';
      case '90d': return '90 derniers jours';
      case '1y': return '1 an';
      default: return '30 derniers jours';
    }
  };

  const MetricCard = ({ title, value, previousValue, growth, icon: Icon, color }) => {
    const isPositive = parseFloat(growth) >= 0;
    
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </p>
          </div>
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color}`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
        
        <div className="mt-4 flex items-center">
          {isPositive ? (
            <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
          ) : (
            <TrendingDown className="w-4 h-4 text-red-600 mr-1" />
          )}
          <span className={`text-sm font-medium ${
            isPositive ? 'text-green-600' : 'text-red-600'
          }`}>
            {isPositive ? '+' : ''}{growth}%
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
            vs période précédente
          </span>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Analytics des Services
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Suivez les performances et statistiques de vos services
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={loadData}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Actualiser</span>
          </button>
          
          <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors">
            <Download className="w-4 h-4" />
            <span>Exporter</span>
          </button>
        </div>
      </div>

      {/* Messages d'erreur */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-2" />
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        </div>
      )}

      {/* Filtres */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="7d">7 derniers jours</option>
                <option value="30d">30 derniers jours</option>
                <option value="90d">90 derniers jours</option>
                <option value="1y">1 an</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={selectedService}
                onChange={(e) => setSelectedService(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">Tous les services</option>
                {services.map(service => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Période: {getPeriodLabel(selectedPeriod)}
          </div>
        </div>
      </div>

      {analyticsData && (
        <>
          {/* Métriques globales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              title="Total Visites"
              value={analyticsData.globalMetrics.totalVisits.current}
              previousValue={analyticsData.globalMetrics.totalVisits.previous}
              growth={analyticsData.globalMetrics.totalVisits.growth}
              icon={Eye}
              color="bg-blue-500"
            />
            <MetricCard
              title="Total Ventes"
              value={analyticsData.globalMetrics.totalSales.current}
              previousValue={analyticsData.globalMetrics.totalSales.previous}
              growth={analyticsData.globalMetrics.totalSales.growth}
              icon={ShoppingCart}
              color="bg-green-500"
            />
            <MetricCard
              title="Revenus Totaux"
              value={`${analyticsData.globalMetrics.totalRevenue.current.toLocaleString()} FCFA`}
              previousValue={analyticsData.globalMetrics.totalRevenue.previous}
              growth={analyticsData.globalMetrics.totalRevenue.growth}
              icon={DollarSign}
              color="bg-purple-500"
            />
            <MetricCard
              title="Utilisateurs Actifs"
              value={analyticsData.globalMetrics.activeUsers.current}
              previousValue={analyticsData.globalMetrics.activeUsers.previous}
              growth={analyticsData.globalMetrics.activeUsers.growth}
              icon={Users}
              color="bg-orange-500"
            />
          </div>

          {/* Graphiques temporels */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Évolution des visites et ventes */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Évolution des Visites et Ventes
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analyticsData.timeSeries}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => new Date(value).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    labelFormatter={(value) => new Date(value).toLocaleDateString('fr-FR')}
                    formatter={(value, name) => [
                      typeof value === 'number' ? value.toLocaleString() : value,
                      name === 'visits' ? 'Visites' : name === 'sales' ? 'Ventes' : name
                    ]}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="visits" 
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    name="Visites"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="sales" 
                    stroke="#10B981" 
                    strokeWidth={2}
                    name="Ventes"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Évolution des revenus */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Évolution des Revenus
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={analyticsData.timeSeries}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => new Date(value).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    labelFormatter={(value) => new Date(value).toLocaleDateString('fr-FR')}
                    formatter={(value) => [`${value.toLocaleString()} FCFA`, 'Revenus']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#8B5CF6" 
                    fill="#8B5CF6" 
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Statistiques par service et répartition des statuts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Performances par service */}
            <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Performances par Service
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analyticsData.serviceStats}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    formatter={(value, name) => [
                      typeof value === 'number' ? value.toLocaleString() : value,
                      name === 'visits' ? 'Visites' : 
                      name === 'sales' ? 'Ventes' : 
                      name === 'revenue' ? 'Revenus (FCFA)' : 
                      name === 'activeUsers' ? 'Utilisateurs Actifs' : name
                    ]}
                  />
                  <Legend />
                  <Bar dataKey="visits" fill="#3B82F6" name="Visites" />
                  <Bar dataKey="sales" fill="#10B981" name="Ventes" />
                  <Bar dataKey="activeUsers" fill="#F59E0B" name="Utilisateurs Actifs" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Répartition des statuts */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Répartition des Statuts
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analyticsData.statusDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {analyticsData.statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value, name) => [value, 'Services']}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Tableau détaillé des services */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Détails par Service
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Service
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Visites
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Ventes
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Revenus
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Utilisateurs Actifs
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Taux de Conversion
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {analyticsData.serviceStats.map((service, index) => (
                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {service.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">
                        {service.visits.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">
                        {service.sales.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">
                        {service.revenue.toLocaleString()} FCFA
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">
                        {service.activeUsers}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                          {service.conversionRate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ServiceAnalytics;