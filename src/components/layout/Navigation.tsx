import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Building2, Film, Home, Settings, ShoppingBag, Store } from 'lucide-react';
import mangooLogo from '../../assets/mangoo-logo.svg';

const Navigation = () => {
  const location = useLocation();
  
  const isActive = (path: string) => location.pathname === path;
  const isDev = Boolean(import.meta.env.DEV);

  const navItems = [
    { path: '/', label: 'Accueil', icon: Home },
    { path: '/enhanced-live-shopping', label: 'Live Shopping+', icon: Film },
    { path: '/marketplace', label: 'Marketplace', icon: ShoppingBag },
    ...(isDev
      ? [
          { path: '/webrtc-test', label: 'WebRTC', icon: Store },
          { path: '/test-room-management', label: 'Rooms', icon: Building2 },
          { path: '/test-admin-setup', label: 'Admin', icon: Settings },
        ]
      : []),
  ];

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-2">
            <img src={mangooLogo} alt="" className="h-9 w-9 rounded-full object-contain" />
            <div className="text-2xl font-bold text-green-700">MangooTech</div>
          </div>
          
          <div className="flex space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive(item.path)
                    ? 'bg-green-100 text-green-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
