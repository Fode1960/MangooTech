import React from 'react';
import { Link } from 'react-router-dom';
import { User, ShoppingBag, Star, MessageCircle, Video, Film, Zap, ArrowRight } from 'lucide-react';

const CustomerDashboard: React.FC = () => {
  // console.log('CustomerDashboard mounting');
  // return <div className="p-10 text-2xl font-bold text-green-600">CUSTOMER DASHBOARD WORKS</div>; // DEBUG

  const features = [
    {
      icon: ShoppingBag,
      title: 'Parcourir les Produits',
      description: 'Découvrez des produits authentiques africains',
      path: '/products',
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      icon: Video,
      title: 'Appels Vidéo',
      description: 'Appelez les vendeurs en direct',
      path: '/client-webrtc-page',
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      icon: Film,
      title: 'Live Shopping',
      description: 'Assistez à des ventes en direct',
      path: '/live-shopping',
      color: 'bg-red-500 hover:bg-red-600'
    },
    {
      icon: Star,
      title: 'Mes Avis',
      description: 'Consultez et laissez des avis',
      path: '/reviews',
      color: 'bg-yellow-500 hover:bg-yellow-600'
    },
    {
      icon: MessageCircle,
      title: 'Chat',
      description: 'Discutez avec les vendeurs',
      path: '/chat',
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    {
      icon: Zap,
      title: 'Notifications',
      description: 'Restez informé des offres',
      path: '/notifications',
      color: 'bg-orange-500 hover:bg-orange-600'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-orange-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Tableau de Bord Client</h1>
            <p className="text-xl text-gray-600">Découvrez et achetez des produits authentiques</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Accès Rapide</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Link
                key={index}
                to={feature.path}
                className={`${feature.color} text-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 group`}
              >
                <div className="flex items-center justify-between mb-6">
                  <Icon className="w-12 h-12" />
                  <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                </div>
                <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
                <p className="text-white/90">{feature.description}</p>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Featured Products Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Produits Recommandés</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Produit 1 */}
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-6 hover:shadow-lg transition-shadow">
              <div className="w-full h-48 bg-gradient-to-r from-orange-200 to-amber-200 rounded-lg mb-4 flex items-center justify-center">
                <ShoppingBag className="w-16 h-16 text-orange-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Robe Wax Ankara</h3>
              <p className="text-gray-600 mb-4">Robe traditionnelle en wax avec motifs africains authentiques</p>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-orange-500">45,000 FCFA</span>
                <Link
                  to="/client-webrtc-page"
                  className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors flex items-center space-x-2"
                >
                  <Video className="w-4 h-4" />
                  <span>Appeler</span>
                </Link>
              </div>
            </div>

            {/* Produit 2 */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 hover:shadow-lg transition-shadow">
              <div className="w-full h-48 bg-gradient-to-r from-green-200 to-emerald-200 rounded-lg mb-4 flex items-center justify-center">
                <Star className="w-16 h-16 text-green-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Collier Perles</h3>
              <p className="text-gray-600 mb-4">Collier artisanal en perles traditionnelles africaines</p>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-green-500">25,000 FCFA</span>
                <Link
                  to="/live-shopping"
                  className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-2"
                >
                  <Film className="w-4 h-4" />
                  <span>Live</span>
                </Link>
              </div>
            </div>

            {/* Produit 3 */}
            <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl p-6 hover:shadow-lg transition-shadow">
              <div className="w-full h-48 bg-gradient-to-r from-purple-200 to-violet-200 rounded-lg mb-4 flex items-center justify-center">
                <Zap className="w-16 h-16 text-purple-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Tissu Wax Premium</h3>
              <p className="text-gray-600 mb-4">Tissu wax de qualité supérieure avec motifs exclusifs</p>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-purple-500">18,000 FCFA</span>
                <Link
                  to="/products"
                  className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors flex items-center space-x-2"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Acheter</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Live Shopping Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-gradient-to-r from-red-500 to-pink-500 rounded-2xl p-8 text-white text-center">
          <div className="flex items-center justify-center mb-4">
            <Film className="w-12 h-12 mr-4" />
            <h2 className="text-3xl font-bold">Live Shopping Actif!</h2>
          </div>
          <p className="text-xl mb-6">Rejoignez notre session de vente en direct et découvrez nos nouveaux produits</p>
          <Link
            to="/live-shopping"
            className="bg-white text-red-500 px-8 py-4 rounded-xl font-bold hover:bg-gray-100 transition-colors inline-flex items-center space-x-2"
          >
            <Film className="w-6 h-6" />
            <span>Rejoindre le Live</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboard;