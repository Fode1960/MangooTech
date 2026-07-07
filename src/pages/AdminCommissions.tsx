import React, { useState, useEffect } from 'react';
import { useTheme } from '../hooks/useTheme';
import { DollarSign, Percent, Settings, TrendingUp, Plus, Edit, Trash2, Search, Calculator, X } from 'lucide-react';

interface CommissionRule {
  id: string;
  name: string;
  description: string;
  commission_type: 'percentage' | 'fixed';
  commission_value: number;
  min_amount?: number;
  max_amount?: number;
  is_active: boolean;
  category?: {
    id: string;
    name_fr: string;
  };
  created_at: string;
  updated_at: string;
}

interface CommissionStats {
  total_stats: {
    total_revenue: number;
    total_commission: number;
    total_orders: number;
    shops_count: number;
  };
  by_rule: Array<{
    rule_id: string;
    rule_name: string;
    total_revenue: number;
    total_commission: number;
    total_orders: number;
    shops_count: number;
  }>;
}

const AdminCommissions: React.FC = () => {
  const { isDark } = useTheme();
  const [rules, setRules] = useState<CommissionRule[]>([]);
  const [stats, setStats] = useState<CommissionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState<CommissionRule | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    commission_type: 'percentage' as 'percentage' | 'fixed',
    commission_value: 0,
    min_amount: 0,
    max_amount: 0,
    is_active: true
  });

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

  useEffect(() => {
    fetchRules();
    fetchStats();
  }, []);

  const fetchRules = async () => {
    try {
      // Données de démonstration
      const demoRules: CommissionRule[] = [
        {
          id: '1',
          name: 'Standard',
          description: 'Commission standard pour toutes les boutiques',
          commission_type: 'percentage',
          commission_value: 5,
          is_active: true,
          category: { id: '1', name_fr: 'Général' },
          created_at: '2024-01-01',
          updated_at: '2024-01-01'
        },
        {
          id: '2',
          name: 'Premium',
          description: 'Commission premium pour boutiques à fort volume',
          commission_type: 'percentage',
          commission_value: 3,
          min_amount: 1000000,
          is_active: true,
          category: { id: '2', name_fr: 'Premium' },
          created_at: '2024-01-02',
          updated_at: '2024-01-02'
        },
        {
          id: '3',
          name: 'Fixe Petites Commandes',
          description: 'Commission fixe pour petites commandes',
          commission_type: 'fixed',
          commission_value: 500,
          max_amount: 50000,
          is_active: true,
          category: { id: '1', name_fr: 'Général' },
          created_at: '2024-01-03',
          updated_at: '2024-01-03'
        }
      ];
      setRules(demoRules);
    } catch (error) {
      console.error('Erreur lors de la récupération des règles:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Données de démonstration pour les statistiques
      const demoStats: CommissionStats = {
        total_stats: {
          total_revenue: 87500000,
          total_commission: 4375000,
          total_orders: 1250,
          shops_count: 45
        },
        by_rule: [
          {
            rule_id: '1',
            rule_name: 'Standard',
            total_revenue: 52500000,
            total_commission: 2625000,
            total_orders: 750,
            shops_count: 30
          },
          {
            rule_id: '2',
            rule_name: 'Premium',
            total_revenue: 30000000,
            total_commission: 900000,
            total_orders: 400,
            shops_count: 10
          },
          {
            rule_id: '3',
            rule_name: 'Fixe Petites Commandes',
            total_revenue: 5000000,
            total_commission: 850000,
            total_orders: 100,
            shops_count: 5
          }
        ]
      };
      setStats(demoStats);
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingRule) {
      // Mise à jour de la règle existante
      setRules(prev => prev.map(rule => 
        rule.id === editingRule.id 
          ? { ...editingRule, ...formData }
          : rule
      ));
    } else {
      // Création d'une nouvelle règle
      const newRule: CommissionRule = {
        id: Date.now().toString(),
        ...formData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      setRules(prev => [...prev, newRule]);
    }
    
    setShowModal(false);
    setEditingRule(null);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      commission_type: 'percentage',
      commission_value: 0,
      min_amount: 0,
      max_amount: 0,
      is_active: true
    });
  };

  const openCreateModal = () => {
    setEditingRule(null);
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (rule: CommissionRule) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      description: rule.description,
      commission_type: rule.commission_type,
      commission_value: rule.commission_value,
      min_amount: rule.min_amount || 0,
      max_amount: rule.max_amount || 0,
      is_active: rule.is_active
    });
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette règle ?')) {
      setRules(prev => prev.filter(rule => rule.id !== id));
    }
  };

  const toggleRuleStatus = (id: string) => {
    setRules(prev => prev.map(rule => 
      rule.id === id 
        ? { ...rule, is_active: !rule.is_active }
        : rule
    ));
  };

  if (loading) {
    return (
      <div className={`p-8 ${isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1b5e20]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-8 ${isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="px-0">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Gestion des Commissions</h1>
          <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>Configurez et gérez les règles de commission pour les boutiques</p>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className={`rounded-lg shadow-sm p-6 border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Revenus Totaux</p>
                  <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(stats.total_stats.total_revenue)}</p>
                  <p className={`text-sm mt-1 ${isDark ? 'text-[#66bb6a]' : 'text-[#1b5e20]'}`}>
                    <TrendingUp className="inline h-4 w-4 mr-1" />
                    30 derniers jours
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${isDark ? 'bg-[#17331c]/20' : 'bg-[#eef6ea]'}`}>
                  <DollarSign className={`h-6 w-6 ${isDark ? 'text-[#66bb6a]' : 'text-[#1b5e20]'}`} />
                </div>
              </div>
            </div>

            <div className={`rounded-lg shadow-sm p-6 border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Commissions Totales</p>
                  <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(stats.total_stats.total_commission)}</p>
                  <p className={`text-sm mt-1 ${isDark ? 'text-[#66bb6a]' : 'text-[#1b5e20]'}`}>
                    <Calculator className="inline h-4 w-4 mr-1" />
                    30 derniers jours
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${isDark ? 'bg-[#17331c]/20' : 'bg-[#eef6ea]'}`}>
                  <Percent className={`h-6 w-6 ${isDark ? 'text-[#66bb6a]' : 'text-[#1b5e20]'}`} />
                </div>
              </div>
            </div>

            <div className={`rounded-lg shadow-sm p-6 border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Commandes Totales</p>
                  <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{formatNumber(stats.total_stats.total_orders)}</p>
                  <p className={`text-sm mt-1 ${isDark ? 'text-[#66bb6a]' : 'text-[#1b5e20]'}`}>
                    <TrendingUp className="inline h-4 w-4 mr-1" />
                    30 derniers jours
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${isDark ? 'bg-[#17331c]/20' : 'bg-[#eef6ea]'}`}>
                  <Settings className={`h-6 w-6 ${isDark ? 'text-[#66bb6a]' : 'text-[#1b5e20]'}`} />
                </div>
              </div>
            </div>

            <div className={`rounded-lg shadow-sm p-6 border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Boutiques Actives</p>
                  <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{formatNumber(stats.total_stats.shops_count)}</p>
                  <p className={`text-sm mt-1 ${isDark ? 'text-[#66bb6a]' : 'text-[#1b5e20]'}`}>
                    Avec commissions
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${isDark ? 'bg-[#17331c]/20' : 'bg-[#eef6ea]'}`}>
                  <Settings className={`h-6 w-6 ${isDark ? 'text-[#66bb6a]' : 'text-[#1b5e20]'}`} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Commission Rules Management */}
        <div className={`rounded-lg shadow-sm border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className={`p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex justify-between items-center">
              <div>
                <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Règles de Commission</h3>
                <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'} mt-1`}>Gérez les règles de commission pour les boutiques</p>
              </div>
              <button
                onClick={openCreateModal}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
                  isDark 
                    ? 'bg-[#1b5e20] text-white hover:bg-[#16381a]' 
                    : 'bg-[#1b5e20] text-white hover:bg-[#16381a]'
                }`}
              >
                <Plus className="h-4 w-4" />
                <span>Nouvelle Règle</span>
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="space-y-4">
              {rules.map((rule) => (
                <div key={rule.id} className={`flex items-center justify-between p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <div>
                    <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{rule.name}</h4>
                    <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'} mt-1`}>{rule.description}</p>
                    <div className="flex items-center space-x-4 text-sm mt-1">
                      <span className="flex items-center">
                        {rule.commission_type === 'percentage' ? (
                          <Percent className="h-3 w-3 mr-1" />
                        ) : (
                          <DollarSign className="h-3 w-3 mr-1" />
                        )}
                        {rule.commission_value}{rule.commission_type === 'percentage' ? '%' : ' XOF'}
                      </span>
                      {rule.category && (
                        <span className={`px-2 py-1 rounded text-xs ${
                          isDark ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-700'
                        }`}>
                          {rule.category.name_fr}
                        </span>
                      )}
                      <span className={`px-2 py-1 rounded text-xs ${
                        rule.is_active 
                          ? (isDark ? 'bg-[#17331c]/20 text-[#66bb6a]' : 'bg-[#eef6ea] text-[#1b5e20]')
                          : (isDark ? 'bg-gray-600 text-gray-400' : 'bg-gray-100 text-gray-800')
                      }`}>
                        {rule.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => toggleRuleStatus(rule.id)}
                      className={`px-3 py-1 rounded text-sm transition-colors ${
                        rule.is_active
                          ? (isDark ? 'bg-red-900/20 text-red-400 hover:bg-red-900/30' : 'bg-red-100 text-red-800 hover:bg-red-200')
                          : (isDark ? 'bg-[#17331c]/20 text-[#66bb6a] hover:bg-[#17331c]/30' : 'bg-[#eef6ea] text-[#1b5e20] hover:bg-[#cfe0c8]')
                      }`}
                    >
                      {rule.is_active ? 'Désactiver' : 'Activer'}
                    </button>
                    <button
                      onClick={() => openEditModal(rule)}
                      className={`p-2 transition-colors ${
                        isDark 
                          ? 'text-gray-400 hover:text-[#66bb6a]' 
                          : 'text-gray-400 hover:text-[#1b5e20]'
                      }`}
                      title="Modifier"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(rule.id)}
                      className={`p-2 transition-colors ${
                        isDark 
                          ? 'text-gray-400 hover:text-red-400' 
                          : 'text-gray-400 hover:text-red-600'
                      }`}
                      title="Supprimer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className={`rounded-lg shadow-xl max-w-md w-full mx-4 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
              <div className={`p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="flex justify-between items-center">
                  <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {editingRule ? 'Modifier la Règle' : 'Nouvelle Règle'}
                  </h3>
                  <button
                    onClick={() => setShowModal(false)}
                    className={`p-1 transition-colors ${
                      isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Nom *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#1b5e20] focus:border-transparent ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    placeholder="Nom de la règle..."
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#1b5e20] focus:border-transparent ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    rows={3}
                    placeholder="Description de la règle..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Type *
                    </label>
                    <select
                      required
                      value={formData.commission_type}
                      onChange={(e) => setFormData(prev => ({ ...prev, commission_type: e.target.value as 'percentage' | 'fixed' }))}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#1b5e20] focus:border-transparent ${
                        isDark 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      <option value="percentage">Pourcentage (%)</option>
                      <option value="fixed">Montant Fixe (XOF)</option>
                    </select>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Valeur *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step={formData.commission_type === 'percentage' ? '0.1' : '1'}
                      value={formData.commission_value}
                      onChange={(e) => setFormData(prev => ({ ...prev, commission_value: parseFloat(e.target.value) || 0 }))}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#1b5e20] focus:border-transparent ${
                        isDark 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      placeholder={formData.commission_type === 'percentage' ? '5.0' : '1000'}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Montant Min (XOF)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.min_amount}
                      onChange={(e) => setFormData(prev => ({ ...prev, min_amount: parseFloat(e.target.value) || 0 }))}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#1b5e20] focus:border-transparent ${
                        isDark 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Montant Max (XOF)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.max_amount}
                      onChange={(e) => setFormData(prev => ({ ...prev, max_amount: parseFloat(e.target.value) || 0 }))}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#1b5e20] focus:border-transparent ${
                        isDark 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                    className="h-4 w-4 text-[#1b5e20] focus:ring-[#1b5e20] border-gray-300 rounded"
                  />
                  <label htmlFor="is_active" className={`ml-2 block text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Règle active
                  </label>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      isDark 
                        ? 'bg-gray-600 text-white hover:bg-gray-700' 
                        : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                    }`}
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      isDark 
                        ? 'bg-[#1b5e20] text-white hover:bg-[#16381a]' 
                        : 'bg-[#1b5e20] text-white hover:bg-[#16381a]'
                    }`}
                  >
                    {editingRule ? 'Modifier' : 'Créer'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCommissions;