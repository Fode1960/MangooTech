import React from 'react';
import { useThemeStore } from '../stores/themeStore';
import { 
  Store, 
  Moon, 
  Sun, 
  ShoppingBag, 
  ArrowRight, 
  ShoppingCart, 
  MapPin, 
  Video, 
  MessageCircle, 
  Smartphone, 
  Facebook, 
  Twitter, 
  Instagram 
} from 'lucide-react';

const LandingPage = ({ onNavigate, onLogin }) => {
  // Simple check for dark mode to avoid store dependencies
  const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const toggleTheme = () => {
    // Basic toggle implementation or just ignore for now to prevent crashes
    document.body.classList.toggle('dark');
  };

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${
      isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
    }`}>
      {/* Header */}
      <header className={`shadow-sm border-b sticky top-0 z-50 transition-colors ${
        isDark ? 'bg-gray-900 border-gray-800' : 'bg-white'
      }`}>
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-md transform rotate-3">
              <Store className="text-white w-5 h-5" />
            </div>
            <span className={`text-2xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>MangooTech</span>
          </div>
          <nav className={`hidden md:flex gap-6 text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            <a href="#" className="hover:text-orange-600 transition-colors">Accueil</a>
            <a href="#features" className="hover:text-orange-600 transition-colors">Fonctionnalités</a>
            <a href="#pricing" className="hover:text-orange-600 transition-colors">Tarifs</a>
            <a href="#innovations" className="hover:text-orange-600 transition-colors">Innovations</a>
            <a href="#contact" className="hover:text-orange-600 transition-colors">Contact</a>
          </nav>
          <div className="flex items-center gap-4">
            <button 
              onClick={toggleTheme} 
              className={`p-2 rounded-full transition-colors ${isDark ? 'bg-gray-800 text-yellow-400' : 'bg-gray-100 text-gray-600'}`} 
              title="Mode Jour/Nuit"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button 
              onClick={() => onLogin({ role: 'login_request' })} 
              className={`px-5 py-2 rounded-full font-bold text-sm transition-colors ${
                isDark ? 'bg-orange-600 hover:bg-orange-700 text-white' : 'bg-gray-900 hover:bg-gray-800 text-white'
              }`}
            >
              Connexion
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 container mx-auto px-4 py-12 flex flex-col items-center justify-center text-center">
        <div className="max-w-3xl animate-fadeIn">
          <span className="inline-block bg-orange-100 text-orange-700 px-4 py-1 rounded-full text-sm font-bold mb-6">🚀 La solution n°1 pour le commerce digital</span>
          <h1 className={`text-5xl md:text-6xl font-extrabold mb-6 leading-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Vendez et Achetez <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-600">En Toute Simplicité</span>
          </h1>
          <p className={`text-xl mb-10 max-w-2xl mx-auto ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            MangooTech connecte vendeurs et acheteurs avec des outils puissants : Live Shopping, Appels Vidéo et Chat en temps réel.
          </p>
  
          <div className="flex flex-col md:flex-row gap-6 justify-center w-full max-w-2xl mx-auto animate-slideUp">
            
            {/* Carte Vendeur */}
            <button 
              onClick={() => onLogin({ role: 'login_request' })}
              className={`group flex-1 rounded-3xl p-8 border shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1 relative overflow-hidden text-left ${
                isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
              }`}
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-500 to-red-600"></div>
              <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <h2 className={`text-2xl font-bold mb-2 text-center ${isDark ? 'text-white' : 'text-gray-900'}`}>Je suis Vendeur</h2>
              <p className={`mb-6 text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Créez votre boutique en 2 minutes et commencez à vendre.</p>
              <div className="bg-orange-50 text-orange-700 py-3 rounded-xl font-bold group-hover:bg-orange-600 group-hover:text-white transition-colors flex items-center justify-center gap-2">
                Créer ma boutique <ArrowRight className="w-4 h-4" />
              </div>
            </button>
  
            {/* Carte Acheteur */}
            <button 
              onClick={() => onNavigate('marketplace')}
              className={`group flex-1 rounded-3xl p-8 border shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1 relative overflow-hidden text-left ${
                isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
              }`}
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform">
                <ShoppingCart className="w-8 h-8" />
              </div>
              <h2 className={`text-2xl font-bold mb-2 text-center ${isDark ? 'text-white' : 'text-gray-900'}`}>Je suis Acheteur</h2>
              <p className={`mb-6 text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Découvrez des produits uniques et achetez en direct.</p>
              <div className="bg-blue-50 text-blue-700 py-3 rounded-xl font-bold group-hover:bg-blue-600 group-hover:text-white transition-colors flex items-center justify-center gap-2">
                Explorer les boutiques <ArrowRight className="w-4 h-4" />
              </div>
            </button>
  
          </div>
  
          {/* MANGOO LOCAL+ BANNER */}
          <div className="mt-12 w-full max-w-2xl mx-auto animate-fadeIn animate-slideUp" style={{ animationDelay: '0.1s' }}>
            <button 
              onClick={() => onNavigate('innovation')}
              className="w-full block bg-gradient-to-r from-green-600 to-emerald-700 rounded-3xl p-1 shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-1 group text-decoration-none"
            >
              <div className="bg-white/10 backdrop-blur-sm rounded-[20px] p-6 flex items-center justify-between">
                <div className="text-left text-white">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-white text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">NOUVEAU</span>
                    <h3 className="text-xl font-bold">Mangoo Local+ 🌍</h3>
                  </div>
                  <p className="text-green-50 text-sm mb-0">Trouvez les commerces autour de vous (Géolocalisation & Voix)</p>
                </div>
                <div className="bg-white text-green-700 w-12 h-12 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <MapPin className="w-6 h-6" />
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Features Preview */}
        <div id="features" className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl w-full animate-fadeIn scroll-mt-24" style={{ animationDelay: '0.2s' }}>
          <div className={`p-6 rounded-2xl shadow-sm border flex items-center gap-4 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600">
              <Video className="w-6 h-6" />
            </div>
            <div className="text-left">
              <h3 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Live Shopping</h3>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Vendez en direct vidéo</p>
            </div>
          </div>
          <div className={`p-6 rounded-2xl shadow-sm border flex items-center gap-4 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600">
              <MessageCircle className="w-6 h-6" />  
            </div>
            <div className="text-left">
              <h3 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Chat Intégré</h3>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Discutez avec vos clients</p>
            </div>
          </div>
          <div className={`p-6 rounded-2xl shadow-sm border flex items-center gap-4 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-purple-600">
              <Smartphone className="w-6 h-6" />      
            </div>
            <div className="text-left">
              <h3 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Mobile First</h3> 
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Optimisé pour tous les écrans</p>
            </div>
          </div>
        </div>

      </main>

      <footer className="bg-gray-900 text-white py-12 border-t border-gray-800">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
                <Store className="text-white w-4 h-4" />
              </div>
              <span className="text-xl font-bold">MangooTech</span>
            </div>
            <p className="text-gray-400 text-sm">La plateforme de référence pour le commerce digital en Afrique.</p>
          </div>
          <div>
            <h4 className="font-bold mb-4">Produit</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#features" className="hover:text-white">Fonctionnalités</a></li>
              <li><a href="#pricing" className="hover:text-white">Tarifs</a></li>
              <li><button onClick={() => onLogin({ role: 'login_request' })} className="hover:text-white">Créer une boutique</button></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4">Légal</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#" className="hover:text-white">Conditions d'utilisation</a></li>
              <li><a href="#" className="hover:text-white">Politique de confidentialité</a></li>
              <li><a href="#" className="hover:text-white">Mentions légales</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4">Suivez-nous</h4>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-orange-600 transition-colors"><Facebook className="w-5 h-5" /></a>
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-400 transition-colors"><Twitter className="w-5 h-5" /></a>
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-pink-600 transition-colors"><Instagram className="w-5 h-5" /></a>
            </div>
          </div>
        </div>
        <div className="text-center text-gray-500 text-sm pt-8 border-t border-gray-800">
          <p>&copy; 2026 MangooTech. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
