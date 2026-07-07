import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Store, User, Settings, LogOut, Video, Film, ShoppingBag, Star, MessageCircle, Bell, Rocket, Globe, MapPin, Users } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Toaster, toast } from 'sonner';

const Navigation: React.FC = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Vérifier si on est en mode test
  const isTestMode = localStorage.getItem('test_mode') === 'true';

  const handleLogout = async () => {
    try {
      // Si en mode test, nettoyer le localStorage
      if (isTestMode) {
        localStorage.removeItem('test_mode');
        localStorage.removeItem('test_user');
        localStorage.removeItem('mock_boutiques');
      }
      
      await signOut();
      toast.success('Déconnexion réussie!');
      navigate('/login');
    } catch (error) {
      toast.error('Erreur lors de la déconnexion');
      console.error('Logout error:', error);
    }
  };

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path);
  };

  if (!user && !isTestMode) {
    return null; // Ne pas afficher la navigation si l'utilisateur n'est pas connecté et pas en mode test
  }

  const navItems = [
    { path: '/dashboard', label: 'Accueil', icon: Store },
    { path: '/products', label: 'Produits', icon: ShoppingBag },
    { path: '/mini-boutiques', label: 'Mini-Boutiques', icon: ShoppingBag },
    { path: '/tontines', label: 'Tontines', icon: Users },
    { path: '/video-calls', label: 'Appels Vidéo', icon: Video },
    { path: '/live-shopping-rooms', label: 'Live Rooms', icon: Film },
    { path: '/enhanced-live-shopping', label: 'Live Shopping+', icon: Film },
    { path: '/test-room-management', label: 'Test Rooms', icon: Film },
    { path: '/live-shopping', label: 'Live Shopping', icon: Film },
    { path: '/reviews', label: 'Avis', icon: Star },
    { path: '/chat', label: 'Chat', icon: MessageCircle },
    { path: '/notifications', label: 'Notifications', icon: Bell },
    { path: '/innovation-hub', label: 'Innovations', icon: Rocket },
    { path: '/african-innovations', label: 'Afrique Tech', icon: Globe },
    ...(isTestMode ? [{ path: '/voip-audio-test', label: 'Test Audio VoIP', icon: Video }] : []),
  ];

  return (
    <nav className="bg-white shadow-lg border-b border-[#cfe0c8]">
      <Toaster position="top-right" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-4">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-[#1b5e20] rounded-full flex items-center justify-center">
                <Store className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">MangooTech</span>
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-6">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive(item.path)
                      ? 'bg-[#eef6ea] text-[#1b5e20]'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-gray-600" />
              </div>
              <span className="text-sm font-medium text-gray-700">
                {isTestMode ? 'Mode Test' : user?.user_metadata?.full_name || user?.email || 'Utilisateur'}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 text-gray-600 hover:text-red-600 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">{isTestMode ? 'Quitter Test' : 'Déconnexion'}</span>
            </button>
          </div>
        </div>

        {/* Navigation mobile */}
        <div className="md:hidden border-t border-gray-200 py-4">
          <div className="grid grid-cols-3 gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex flex-col items-center space-y-1 p-2 rounded-lg text-xs font-medium transition-colors ${
                    isActive(item.path)
                      ? 'bg-[#eef6ea] text-[#1b5e20]'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
