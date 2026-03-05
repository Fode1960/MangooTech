import React from 'react';
import { User, Store, LogIn } from 'lucide-react';
import { useThemeStore } from '../stores/themeStore';

interface QuickLoginProps {
  onLogin: (userData: any) => void;
}

const QuickLogin: React.FC<QuickLoginProps> = ({ onLogin }) => {
  const { isDark } = useThemeStore();

  const demoUsers = [
    {
      email: 'admin@mangoo.tech',
      password: 'admin123',
      user: {
        id: 1,
        name: 'Administrateur',
        role: 'admin',
        email: 'admin@mangoo.tech',
        avatar: '👨‍💼'
      },
      icon: <User className="w-5 h-5" />,
      color: 'bg-purple-500 hover:bg-purple-600',
      description: 'Panel Admin Complet'
    },
    {
      email: 'vendor@example.com',
      password: 'vendor123',
      user: {
        id: 2,
        name: 'Commerçant Demo',
        role: 'vendor',
        email: 'vendor@example.com',
        shopName: 'Boutique Demo',
        avatar: '👨‍🎨'
      },
      icon: <Store className="w-5 h-5" />,
      color: 'bg-orange-500 hover:bg-orange-600',
      description: 'Nouveau Système de Chat + Notifications'
    },
    {
      email: 'client@example.com',
      password: 'client123',
      user: {
        id: 3,
        name: 'Client Demo',
        role: 'client',
        email: 'client@example.com',
        avatar: '🧑‍💻'
      },
      icon: <User className="w-5 h-5" />,
      color: 'bg-green-500 hover:bg-green-600',
      description: 'Chat avec Vendeurs en Direct'
    }
  ];

  const handleQuickLogin = (userData: any) => {
    onLogin(userData.user);
  };

  return (
    <div className={`fixed top-4 right-4 z-50 rounded-lg shadow-2xl p-4 border ${
      isDark 
        ? 'bg-gray-800 border-gray-700 text-white' 
        : 'bg-white border-gray-200 text-gray-900'
    }`}>
      <div className="flex items-center space-x-2 mb-3">
        <LogIn className="w-5 h-5 text-orange-500" />
        <h3 className="font-semibold text-sm">Connexion Rapide</h3>
      </div>
      
      <div className="space-y-2">
        {demoUsers.map((demoUser, index) => (
          <button
            key={index}
            onClick={() => handleQuickLogin(demoUser)}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 transform hover:scale-105 ${
              demoUser.color
            } text-white`}
          >
            <div className="flex-shrink-0">{demoUser.icon}</div>
            <div className="flex-1 text-left">
              <div className="font-semibold">{demoUser.user.role.toUpperCase()}</div>
              <div className="text-xs opacity-90">{demoUser.description}</div>
            </div>
            <div className="text-2xl">{demoUser.user.avatar}</div>
          </button>
        ))}
      </div>
      
      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          💡 Cliquez pour tester les nouvelles fonctionnalités!
        </p>
      </div>
    </div>
  );
};

export default QuickLogin;