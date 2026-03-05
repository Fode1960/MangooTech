import React from 'react';
import { Link } from 'react-router-dom';
import { Store, ShoppingBag, Users, Star, Video, Film, Zap, ArrowRight, Rocket, Sparkles } from 'lucide-react';

const Home: React.FC = () => {
  const features = [
    {
      icon: ShoppingBag,
      title: 'Marketplace Africain',
      description: 'Découvrez des produits authentiques du continent africain'
    },
    {
      icon: Video,
      title: 'Appels Vidéo',
      description: 'Communiquez en direct avec les vendeurs via WebRTC'
    },
    {
      icon: Film,
      title: 'Live Shopping',
      description: 'Assistez à des ventes en direct et achetez en temps réel'
    },
    {
      icon: Users,
      title: 'Communauté',
      description: 'Rejoignez une communauté de passionnés et de créateurs'
    },
    {
      icon: Star,
      title: 'Avis Vérifiés',
      description: 'Consultez des avis authentiques sur les produits et vendeurs'
    },
    {
      icon: Rocket,
      title: 'Innovations Révolutionnaires',
      description: 'IA, AR, Blockchain et technologies de pointe intégrées'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <div className="mb-8">
              <div className="w-20 h-20 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Store className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
                Bienvenue sur{' '}
                <span className="bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
                  MangooTech
                </span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
                La première marketplace africaine avec appels vidéo et live shopping intégrés. 
                Découvrez, connectez-vous et achetez des produits authentiques en direct.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-amber-600 transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                Commencer
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center px-8 py-4 bg-white text-orange-500 font-semibold rounded-xl border-2 border-orange-500 hover:bg-orange-50 transition-all duration-200"
              >
                Se connecter
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Fonctionnalités Révolutionnaires
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              MangooTech combine le commerce traditionnel africain avec les dernières technologies 
              pour créer une expérience d'achat unique et authentique.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-8 hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl flex items-center justify-center mb-6">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section className="py-24 bg-gradient-to-r from-orange-500 to-amber-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-8">
            Essayez nos fonctionnalités maintenant
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Link
              to="/live-shopping-demo"
              className="bg-white text-orange-500 px-6 py-4 rounded-xl font-semibold hover:bg-orange-50 transition-colors flex items-center justify-center space-x-2"
            >
              <Film className="w-5 h-5" />
              <span>Live Shopping</span>
            </Link>
            <Link
              to="/webrtc-test-hub"
              className="bg-white text-orange-500 px-6 py-4 rounded-xl font-semibold hover:bg-orange-50 transition-colors flex items-center justify-center space-x-2"
            >
              <Video className="w-5 h-5" />
              <span>Appels Vidéo</span>
            </Link>
            <Link
              to="/login"
              className="bg-white text-orange-500 px-6 py-4 rounded-xl font-semibold hover:bg-orange-50 transition-colors flex items-center justify-center space-x-2"
            >
              <Store className="w-5 h-5" />
              <span>Espace Vendeur</span>
            </Link>
            <Link
              to="/register"
              className="bg-white text-orange-500 px-6 py-4 rounded-xl font-semibold hover:bg-orange-50 transition-colors flex items-center justify-center space-x-2"
            >
              <Users className="w-5 h-5" />
              <span>Rejoindre</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Innovation Hub Section */}
      <section className="py-24 bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center space-x-3 mb-6">
              <Rocket className="w-12 h-12 text-purple-600" />
              <h2 className="text-4xl font-bold text-gray-900">
                Technologies Révolutionnaires
              </h2>
              <Sparkles className="w-12 h-12 text-blue-600" />
            </div>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Découvrez nos innovations de pointe : IA prédictive, Réalité Augmentée, 
              Détection de fraude, Blockchain et bien plus encore.
            </p>
          </div>

          <div className="text-center">
            <Link
              to="/innovation-hub"
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              <Rocket className="mr-3 w-6 h-6" />
              Explorer l'Innovation Hub
              <ArrowRight className="ml-3 w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full flex items-center justify-center">
                  <Store className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">MangooTech</span>
              </div>
              <p className="text-gray-400">
                La marketplace africaine de référence avec technologies innovantes.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Plateforme</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/login" className="hover:text-white">Connexion</Link></li>
                <li><Link to="/register" className="hover:text-white">Inscription</Link></li>
                <li><Link to="/live-shopping-demo" className="hover:text-white">Live Shopping</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Technologies</h3>
              <ul className="space-y-2 text-gray-400">
                <li>WebRTC</li>
                <li>Live Streaming</li>
                <li>Chat en temps réel</li>
                <li>Notifications Push</li>
                <li><Link to="/innovation-hub" className="hover:text-white">IA & Innovations</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Aide</li>
                <li>Contact</li>
                <li>Conditions</li>
                <li>Confidentialité</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 MangooTech. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;