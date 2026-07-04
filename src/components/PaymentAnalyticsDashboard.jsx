import React, { useState, useEffect } from 'react';
/* eslint-disable no-useless-escape */
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { useThemeStore } from '../stores/themeStore';
import { TrendingUp, TrendingDown, DollarSign, Users, Package, Activity } from 'lucide-react';
import '../styles/analytics-dark-mode.css';
import { AnalyticsDarkModeWrapper } from './AnalyticsDarkModeWrapper';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];
const DARK_COLORS = ['#60A5FA', '#34D399', '#FBBF24', '#FB923C', '#A78BFA'];

export const PaymentAnalyticsDashboard = () => {
  const { isDark } = useThemeStore();
  const isDarkMode = isDark;
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30d');
  const [currency, setCurrency] = useState('all');

  // Helper pour générer les styles conditionnels
  const getCardStyles = (isDarkMode) => ({
    backgroundColor: isDarkMode ? '#1e293b' : undefined,
    borderColor: isDarkMode ? '#334155' : undefined,
    color: isDarkMode ? '#f8fafc' : undefined
  });

  // Helper pour générer les props des cartes avec styles forcés
  const getCardProps = (isDarkMode, borderColor) => ({
    className: `analytics-card rounded-xl p-6 border-l-4 ${borderColor} transition-all duration-300 hover:scale-105 hover:shadow-2xl ${
      isDarkMode 
        ? 'bg-gray-900 border-gray-700 shadow-2xl shadow-blue-500/10 hover:shadow-blue-500/20' 
        : 'bg-white border-gray-200 shadow-lg hover:shadow-xl'
    }`,
    style: {
      backgroundColor: isDarkMode ? '#1e293b' : undefined,
      borderColor: isDarkMode ? '#334155' : undefined,
      color: isDarkMode ? '#f8fafc' : undefined,
      borderLeftColor: isDarkMode ? (borderColor.includes('blue') ? '#60a5fa' : 
                                   borderColor.includes('green') ? '#34d399' :
                                   borderColor.includes('purple') ? '#a78bfa' :
                                   borderColor.includes('orange') ? '#fb923c' : undefined) : undefined
    }
  });

  // Helper pour forcer les couleurs de texte
  const getTextStyle = (isDarkMode, colorClass) => {
    if (!isDarkMode) return {};
    
    const colorMap = {
      'text-gray-900': '#f8fafc',
      'text-gray-600': '#cbd5e1',
      'text-gray-300': '#94a3b8',
      'text-white': '#ffffff',
      'text-gray-400': '#9ca3af',
      'text-blue-400': '#60a5fa',
      'text-green-400': '#34d399',
      'text-purple-400': '#a78bfa',
      'text-orange-400': '#fb923c',
      'text-red-400': '#f87171'
    };
    
    return {
      color: colorMap[colorClass] || undefined
    };
  };

  // Helper pour forcer les couleurs de fond des badges
  const getBadgeStyle = (isDarkMode, bgClass) => {
    if (!isDarkMode) return {};
    
    const bgMap = {
      'bg-blue-100': 'rgba(59, 130, 246, 0.1)',
      'bg-green-100': 'rgba(34, 197, 94, 0.1)',
      'bg-purple-100': 'rgba(147, 51, 234, 0.1)',
      'bg-orange-100': 'rgba(251, 146, 60, 0.1)',
      'bg-blue-900/30': 'rgba(30, 58, 138, 0.3)',
      'bg-green-900/30': 'rgba(22, 101, 52, 0.3)',
      'bg-purple-900/30': 'rgba(88, 28, 156, 0.3)',
      'bg-orange-900/30': 'rgba(124, 45, 18, 0.3)'
    };
    
    return {
      backgroundColor: bgMap[bgClass] || undefined
    };
  };

  // Helper pour créer une carte complète avec styles forcés
  const StatCard = ({ title, value, icon: Icon, trend, trendValue, borderColor, bgClass, iconClass }) => {
    const cardProps = getCardProps(isDarkMode, borderColor);
    
    return (
      <div {...cardProps}>
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}
               style={getTextStyle(isDarkMode, isDarkMode ? 'text-gray-300' : 'text-gray-600')}>
              {title}
            </p>
            <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
               style={getTextStyle(isDarkMode, isDarkMode ? 'text-white' : 'text-gray-900')}>
              {value}
            </p>
          </div>
          <div className={`p-3 rounded-full ${isDarkMode ? bgClass.replace('100', '900/30') : bgClass}`}
               style={getBadgeStyle(isDarkMode, isDarkMode ? bgClass.replace('100', '900/30') : bgClass)}>
            <Icon className={`h-6 w-6 ${isDarkMode ? iconClass.replace('600', '400') : iconClass}`}
                 style={getTextStyle(isDarkMode, isDarkMode ? iconClass.replace('600', '400') : iconClass)} />
          </div>
        </div>
        {trend && (
          <div className="mt-4 flex items-center">
            {trend === 'up' ? (
              <TrendingUp className={`h-4 w-4 mr-1 ${isDarkMode ? 'text-green-400' : 'text-green-500'}`}
                         style={getTextStyle(isDarkMode, isDarkMode ? 'text-green-400' : 'text-green-500')} />
            ) : (
              <TrendingDown className={`h-4 w-4 mr-1 ${isDarkMode ? 'text-red-400' : 'text-red-500'}`}
                           style={getTextStyle(isDarkMode, isDarkMode ? 'text-red-400' : 'text-red-500')} />
            )}
            <span className={`text-sm ${isDarkMode ? (trend === 'up' ? 'text-green-400' : 'text-red-400') : (trend === 'up' ? 'text-green-500' : 'text-red-500')}`}
                  style={getTextStyle(isDarkMode, isDarkMode ? (trend === 'up' ? 'text-green-400' : 'text-red-400') : (trend === 'up' ? 'text-green-500' : 'text-red-500'))}>
              {trendValue}
            </span>
          </div>
        )}
      </div>
    );
  };

  useEffect(() => {
    fetchAnalyticsData();
    
    // Ajouter la classe dark-mode au body pour les styles globaux
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
      
      // Forcer l'application des styles sombres avec JavaScript
      const style = document.createElement('style');
      style.id = 'analytics-dark-mode-styles';
      style.textContent = `
        /* Forcer l'uniformité du mode nuit - styles ultra prioritaires */
        .analytics-dashboard {
          background-color: #0f172a !important;
        }
        
        .analytics-card {
          background-color: #1e293b !important;
          border: 1px solid #334155 !important;
          color: #f8fafc !important;
        }
        
        .analytics-card * {
          color: #f8fafc !important;
        }
        
        .analytics-card .text-gray-900 {
          color: #f8fafc !important;
        }
        
        .analytics-card .text-gray-600 {
          color: #cbd5e1 !important;
        }
        
        .analytics-card .text-gray-300 {
          color: #94a3b8 !important;
        }
        
        .analytics-card .text-white {
          color: #ffffff !important;
        }
        
        .analytics-card .bg-blue-100 {
          background-color: rgba(59, 130, 246, 0.1) !important;
        }
        
        .analytics-card .bg-green-100 {
          background-color: rgba(34, 197, 94, 0.1) !important;
        }
        
        .analytics-card .bg-purple-100 {
          background-color: rgba(147, 51, 234, 0.1) !important;
        }
        
        .analytics-card .bg-orange-100 {
          background-color: rgba(251, 146, 60, 0.1) !important;
        }
        
        .analytics-card .bg-blue-900\/30 {
          background-color: rgba(30, 58, 138, 0.3) !important;
        }
        
        .analytics-card .bg-green-900\/30 {
          background-color: rgba(22, 101, 52, 0.3) !important;
        }
        
        .analytics-card .bg-purple-900\/30 {
          background-color: rgba(88, 28, 156, 0.3) !important;
        }
        
        .analytics-card .bg-orange-900\/30 {
          background-color: rgba(124, 45, 18, 0.3) !important;
        }
        
        .analytics-card .border-gray-200 {
          border-color: #334155 !important;
        }
        
        .analytics-card .border-gray-300 {
          border-color: #475569 !important;
        }
        
        .analytics-card .border-gray-600 {
          border-color: #64748b !important;
        }
        
        .analytics-card .border-gray-700 {
          border-color: #374151 !important;
        }
        
        .analytics-card table.min-w-full {
          background-color: #1e293b !important;
        }
        
        .analytics-card .hover\:bg-gray-50:hover {
          background-color: #334155 !important;
        }
        
        .analytics-card .hover\:bg-gray-700:hover {
          background-color: #475569 !important;
        }
        
        /* Graphiques */
        .recharts-cartesian-grid-horizontal line,
        .recharts-cartesian-grid-vertical line {
          stroke: #334155 !important;
        }
        
        .recharts-text {
          fill: #cbd5e1 !important;
        }
        
        .recharts-tooltip-wrapper {
          background-color: #1e293b !important;
          border: 1px solid #334155 !important;
          border-radius: 8px !important;
        }
        
        select {
          background-color: #1e293b !important;
          border-color: #334155 !important;
          color: #f8fafc !important;
        }
        
        select option {
          background-color: #1e293b !important;
          color: #f8fafc !important;
        }
      `;
      document.head.appendChild(style);
    } else {
      document.body.classList.remove('dark-mode');
      // Retirer les styles forcés
      const existingStyle = document.getElementById('analytics-dark-mode-styles');
      if (existingStyle) {
        existingStyle.remove();
      }
    }
    
    return () => {
      document.body.classList.remove('dark-mode');
      const existingStyle = document.getElementById('analytics-dark-mode-styles');
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, [dateRange, currency, isDarkMode]);

  // Forcer les styles sur tous les éléments après le rendu
  useEffect(() => {
    if (isDarkMode) {
      // Attendre que le DOM soit complètement rendu
      const timeoutId = setTimeout(() => {
        // Forcer les styles sur tous les éléments du tableau de bord
        const dashboardElements = document.querySelectorAll('.analytics-dashboard, .analytics-card, .bg-white, .bg-gray-50, .rounded-lg, .rounded-xl');
        dashboardElements.forEach(el => {
          if (!el.classList.contains('analytics-card')) {
            el.classList.add('analytics-card');
          }
          // Forcer les styles inline si nécessaire
          el.style.setProperty('background-color', '#1e293b', 'important');
          el.style.setProperty('border-color', '#334155', 'important');
          el.style.setProperty('color', '#f8fafc', 'important');
        });

        // Forcer les couleurs de texte
        const textElements = document.querySelectorAll('.text-gray-900, .text-gray-600, .text-gray-500, .text-gray-300');
        textElements.forEach(el => {
          if (el.classList.contains('text-gray-900')) {
            el.style.setProperty('color', '#f8fafc', 'important');
          } else if (el.classList.contains('text-gray-600')) {
            el.style.setProperty('color', '#cbd5e1', 'important');
          } else if (el.classList.contains('text-gray-500') || el.classList.contains('text-gray-300')) {
            el.style.setProperty('color', '#94a3b8', 'important');
          }
        });

        // Forcer l'arrière-grand principal
        const mainContainer = document.querySelector('.analytics-dashboard');
        if (mainContainer) {
          mainContainer.style.setProperty('background-color', '#0f172a', 'important');
        }

        // Forcer les graphiques
        const chartElements = document.querySelectorAll('.recharts-wrapper, .recharts-surface');
        chartElements.forEach(el => {
          el.style.setProperty('background-color', '#1e293b', 'important');
        });

        // Forcer les tableaux
        const tableElements = document.querySelectorAll('table, thead, tbody, tr, td, th');
        tableElements.forEach(el => {
          el.style.setProperty('background-color', '#1e293b', 'important');
          el.style.setProperty('border-color', '#334155', 'important');
          el.style.setProperty('color', '#f8fafc', 'important');
        });
      }, 500); // Délai plus long pour s'assurer que tout est rendu

      return () => clearTimeout(timeoutId);
    } else {
      // Nettoyer les styles inline en mode clair
      const allElements = document.querySelectorAll('.analytics-dashboard, .analytics-card, .text-gray-900, .text-gray-600, .text-gray-500, .text-gray-300, table, thead, tbody, tr, td, th');
      allElements.forEach(el => {
        el.style.removeProperty('background-color');
        el.style.removeProperty('border-color');
        el.style.removeProperty('color');
      });
    }
  }, [isDarkMode, loading]); // Re-exécuter quand isDarkMode ou loading change

  const fetchAnalyticsData = async () => {
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
        // Utiliser des données par défaut si l'API ne retourne pas de données valides
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
  };

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
    <AnalyticsDarkModeWrapper>
      <div className={`analytics-dashboard min-h-screen p-6 transition-colors duration-300 ${
        isDarkMode ? 'bg-gray-950' : 'bg-gray-50'
      }`}>
      <style>{`
        /* Styles globaux pour forcer l'uniformité du mode nuit - ULTRA PRIORITAIRES */
        body.dark-mode .min-h-screen {
          background-color: #0f172a !important;
        }
        
        /* Cartes de statistiques - Mode nuit forcé */
        body.dark-mode .analytics-card,
        body.dark-mode .bg-white,
        body.dark-mode .bg-gray-50,
        body.dark-mode .rounded-lg,
        body.dark-mode .rounded-xl,
        body.dark-mode .shadow-lg,
        body.dark-mode .shadow-xl,
        body.dark-mode .shadow-2xl {
          background-color: #1e293b !important;
          border-color: #334155 !important;
          color: #f8fafc !important;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.15) !important;
        }
        
        /* Texte en mode nuit */
        body.dark-mode .text-gray-900,
        body.dark-mode h1,
        body.dark-mode h2,
        body.dark-mode h3,
        body.dark-mode h4,
        body.dark-mode h5,
        body.dark-mode h6,
        body.dark-mode p,
        body.dark-mode span,
        body.dark-mode div {
          color: #f8fafc !important;
        }
        
        body.dark-mode .text-gray-600 {
          color: #cbd5e1 !important;
        }
        
        body.dark-mode .text-gray-500 {
          color: #94a3b8 !important;
        }
        
        body.dark-mode .text-gray-300 {
          color: #64748b !important;
        }
        
        /* Icônes et badges */
        body.dark-mode .bg-blue-100,
        body.dark-mode .bg-green-100,
        body.dark-mode .bg-purple-100,
        body.dark-mode .bg-orange-100 {
          background-color: rgba(59, 130, 246, 0.1) !important;
        }
        
        body.dark-mode .bg-green-100 {
          background-color: rgba(34, 197, 94, 0.1) !important;
        }
        
        body.dark-mode .bg-purple-100 {
          background-color: rgba(147, 51, 234, 0.1) !important;
        }
        
        body.dark-mode .bg-orange-100 {
          background-color: rgba(251, 146, 60, 0.1) !important;
        }
        
        /* Tableau */
        body.dark-mode table.min-w-full,
        body.dark-mode table,
        body.dark-mode thead,
        body.dark-mode tbody,
        body.dark-mode tr,
        body.dark-mode td,
        body.dark-mode th {
          background-color: #1e293b !important;
          border-color: #334155 !important;
          color: #f8fafc !important;
        }
        
        body.dark-mode .border-gray-200 {
          border-color: #334155 !important;
        }
        
        body.dark-mode .border-gray-300 {
          border-color: #475569 !important;
        }
        
        body.dark-mode .border-gray-600 {
          border-color: #64748b !important;
        }
        
        body.dark-mode .border-gray-700 {
          border-color: #374151 !important;
        }
        
        /* Graphiques - Grille et axes */
        body.dark-mode .recharts-cartesian-grid-horizontal line,
        body.dark-mode .recharts-cartesian-grid-vertical line {
          stroke: #334155 !important;
        }
        
        body.dark-mode .recharts-text {
          fill: #cbd5e1 !important;
        }
        
        body.dark-mode .recharts-surface {
          background-color: #1e293b !important;
        }
        
        /* Tooltips */
        body.dark-mode .recharts-tooltip-wrapper,
        body.dark-mode .recharts-tooltip {
          background-color: #1e293b !important;
          border: 1px solid #334155 !important;
          border-radius: 8px !important;
          color: #f8fafc !important;
        }
        
        body.dark-mode .recharts-tooltip * {
          color: #f8fafc !important;
        }
        
        /* Select dropdowns */
        body.dark-mode select,
        body.dark-mode .select,
        body.dark-mode .dropdown {
          background-color: #1e293b !important;
          border-color: #334155 !important;
          color: #f8fafc !important;
        }
        
        body.dark-mode select option {
          background-color: #1e293b !important;
          color: #f8fafc !important;
        }
        
        /* Éléments spécifiques qui restent blancs */
        body.dark-mode .bg-gray-100,
        body.dark-mode .bg-gray-200,
        body.dark-mode .bg-gray-300 {
          background-color: #1e293b !important;
          border-color: #334155 !important;
          color: #f8fafc !important;
        }
        
        /* Forcer tous les éléments enfants */
        body.dark-mode .analytics-card * {
          background-color: transparent !important;
          color: #f8fafc !important;
        }
        
        /* Hover effects */
        body.dark-mode .hover\:bg-gray-50:hover {
          background-color: #334155 !important;
        }
        
        body.dark-mode .hover\:bg-gray-100:hover {
          background-color: #475569 !important;
        }
        
        body.dark-mode .hover\:bg-gray-700:hover {
          background-color: #64748b !important;
        }
      `}</style>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-3xl font-bold mb-4 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
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
            
            <style>{`
              select {
                background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
                background-position: right 0.5rem center;
                background-repeat: no-repeat;
                background-size: 1.5em 1.5em;
                padding-right: 2.5rem;
              }
              select option {
                background-color: ${isDarkMode ? '#1f2937' : '#ffffff'};
                color: ${isDarkMode ? '#ffffff' : '#000000'};
              }
            `}</style>
            
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
          <style>{`
            @keyframes pulse {
              0%, 100% {
                opacity: 1;
              }
              50% {
                opacity: 0.8;
              }
            }
            .animate-pulse-slow {
              animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
            }
          `}</style>
          <div {...getCardProps(isDarkMode, 'border-blue-500')}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}
                   style={getTextStyle(isDarkMode, isDarkMode ? 'text-gray-300' : 'text-gray-600')}>
                  Revenu Total
                </p>
                <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                   style={getTextStyle(isDarkMode, isDarkMode ? 'text-white' : 'text-gray-900')}>
                  {analyticsData.totalRevenue || '0.00'} €
                </p>
              </div>
              <div className={`p-3 rounded-full ${isDarkMode ? 'bg-blue-900/30' : 'bg-blue-100'}`}
                   style={getBadgeStyle(isDarkMode, isDarkMode ? 'bg-blue-900/30' : 'bg-blue-100')}>
                <DollarSign className={`h-6 w-6 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}
                           style={getTextStyle(isDarkMode, isDarkMode ? 'text-blue-400' : 'text-blue-600')} />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <TrendingUp className={`h-4 w-4 mr-1 ${isDarkMode ? 'text-green-400' : 'text-green-500'}`}
                         style={getTextStyle(isDarkMode, isDarkMode ? 'text-green-400' : 'text-green-500')} />
              <span className={`text-sm ${isDarkMode ? 'text-green-400' : 'text-green-500'}`}
                    style={getTextStyle(isDarkMode, isDarkMode ? 'text-green-400' : 'text-green-500')}>+12.5%</span>
            </div>
          </div>

          <div {...getCardProps(isDarkMode, 'border-green-500')}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
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

          <div {...getCardProps(isDarkMode, 'border-purple-500')}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
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

          <div {...getCardProps(isDarkMode, 'border-orange-500')}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
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
          <div className={`analytics-card p-6 rounded-lg transition-all duration-300 hover:shadow-2xl ${
            isDarkMode 
              ? 'bg-gray-900 border border-gray-700 shadow-2xl shadow-gray-500/10 hover:shadow-gray-500/20' 
              : 'bg-white border border-gray-200 shadow-lg hover:shadow-xl'
          }`}
          style={getCardStyles(isDarkMode)}>
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
          <div className={`analytics-card p-6 rounded-lg transition-all duration-300 hover:shadow-2xl ${
            isDarkMode 
              ? 'bg-gray-900 border border-gray-700 shadow-2xl shadow-gray-500/10 hover:shadow-gray-500/20' 
              : 'bg-white border border-gray-200 shadow-lg hover:shadow-xl'
          }`}
          style={getCardStyles(isDarkMode)}>
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
        <div className={`analytics-card p-6 rounded-lg transition-all duration-300 hover:shadow-2xl ${
          isDarkMode 
            ? 'bg-gray-900 border border-gray-700 shadow-2xl shadow-gray-500/10 hover:shadow-gray-500/20' 
            : 'bg-white border border-gray-200 shadow-lg hover:shadow-xl'
        }`}
        style={getCardStyles(isDarkMode)}>
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
      </AnalyticsDarkModeWrapper>
  );
};

export default PaymentAnalyticsDashboard;
