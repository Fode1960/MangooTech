import React, { useState, useEffect, useCallback } from 'react';
import { Store, Package, Users, DollarSign, TrendingUp, Settings, LogOut, QrCode, Link, Eye } from 'lucide-react';
import { supabase } from '../config/supabase';
import { useParams, useNavigate } from 'react-router-dom';

const VendorDashboard = () => {
  const { shopId } = useParams();
  const navigate = useNavigate();
  const [shop, setShop] = useState(null);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalCustomers: 0
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const loadShopData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Charger les données de la boutique
      const { data: shopData, error: shopError } = await supabase
        .from('shops')
        .select('*')
        .eq('id', shopId)
        .single();

      if (shopError) {
        throw new Error('Boutique non trouvée');
      }

      if (shopData.status !== 'approved') {
        throw new Error(`Votre boutique est ${shopData.status}. Contactez l'administrateur.`);
      }

      setShop(shopData);

      // Charger les statistiques
      await loadShopStats(shopId);

    } catch (error) {
      console.error('Erreur chargement boutique:', error);
      alert(error.message);
      navigate('/vendor-login');
    } finally {
      setLoading(false);
    }
  }, [navigate, shopId]);

  useEffect(() => {
    if (shopId) {
      void loadShopData();
    }
  }, [loadShopData, shopId]);

  const loadShopStats = async (shopId) => {
    try {
      // Statistiques des produits
      const { count: productsCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('shop_id', shopId);

      // Statistiques des commandes
      const { count: ordersCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('shop_id', shopId);

      // Revenus totaux
      const { data: revenueData } = await supabase
        .from('orders')
        .select('total_amount')
        .eq('shop_id', shopId)
        .eq('status', 'completed');

      const totalRevenue = revenueData?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;

      // Clients uniques
      const { data: customersData } = await supabase
        .from('orders')
        .select('user_id', { distinct: true })
        .eq('shop_id', shopId);

      setStats({
        totalProducts: productsCount || 0,
        totalOrders: ordersCount || 0,
        totalRevenue: totalRevenue,
        totalCustomers: customersData?.length || 0
      });

    } catch (error) {
      console.error('Erreur chargement statistiques:', error);
    }
  };

  const handleLogout = () => {
    if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
      navigate('/vendor-login');
    }
  };

  const handleQRCode = () => {
    // Afficher le QR code de la boutique
    const shopUrl = `https://mangootech.com/shop/${shop?.slug || shopId}`;
    alert(`QR Code pour votre boutique:\n${shopUrl}\n\nÀ implémenter avec affichage visuel`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Chargement de votre tableau de bord...</p>
        </div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Store className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Boutique non trouvée</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">Veuillez vous reconnecter</p>
          <button
            onClick={() => navigate('/vendor-login')}
            className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Se reconnecter
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Store className="w-8 h-8 text-orange-500" />
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">{shop.name}</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Tableau de bord vendeur</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleQRCode}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                title="QR Code de la boutique"
              >
                <QrCode className="w-5 h-5" />
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Déconnexion</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Produits</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalProducts}</p>
              </div>
              <Package className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Commandes</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalOrders}</p>
              </div>
              <Users className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Revenus</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalRevenue.toLocaleString('fr-FR')} FCFA</p>
              </div>
              <DollarSign className="w-8 h-8 text-yellow-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Clients</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalCustomers}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Navigation par onglets */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-8">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'overview'
                    ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                Aperçu
              </button>
              <button
                onClick={() => setActiveTab('products')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'products'
                    ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                Produits
              </button>
              <button
                onClick={() => setActiveTab('orders')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'orders'
                    ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                Commandes
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'settings'
                    ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                Paramètres
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Bienvenue dans votre tableau de bord</h3>
                <div className="text-center py-8">
                  <Store className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{shop.name}</h4>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">{shop.description || 'Aucune description'}</p>
                  <div className="flex items-center justify-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                    <span>📍 {shop.city || 'Ville non spécifiée'}</span>
                    <span>📞 {shop.contact_phone || 'Téléphone non spécifié'}</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'products' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Gestion des produits</h3>
                <div className="text-center py-8">
                  <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">Fonctionnalité de gestion des produits à implémenter</p>
                  <button className="mt-4 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition-colors">
                    Ajouter un produit
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'orders' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Commandes récentes</h3>
                <div className="text-center py-8">
                  <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">Fonctionnalité de gestion des commandes à implémenter</p>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Paramètres de la boutique</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">URL de votre boutique</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        https://mangootech.com/shop/{shop.slug || shopId}
                      </p>
                    </div>
                    <button className="flex items-center space-x-2 text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300">
                      <Eye className="w-4 h-4" />
                      <span>Voir</span>
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Statut de la boutique</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">{shop.status}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      shop.status === 'approved' ? 'bg-green-100 text-green-800' :
                      shop.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      shop.status === 'suspended' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {shop.status}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions rapides */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <button className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
            <Package className="w-8 h-8 text-blue-500 mb-3" />
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">Ajouter un produit</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Ajoutez de nouveaux produits à votre boutique</p>
          </button>

          <button className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
            <QrCode className="w-8 h-8 text-green-500 mb-3" />
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">QR Code</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Générez votre QR code pour partager votre boutique</p>
          </button>

          <button className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
            <Settings className="w-8 h-8 text-purple-500 mb-3" />
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">Paramètres</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Modifiez les paramètres de votre boutique</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default VendorDashboard;
