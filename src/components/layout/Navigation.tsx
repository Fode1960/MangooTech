import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Film, Settings, Users, ShoppingBag, TestTube } from 'lucide-react';

const Navigation = () => {
  const location = useLocation();
  
  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: '/', label: 'Accueil', icon: '🏠' },
    { path: '/webrtc-test', label: 'Test WebRTC', icon: '🎧' },
    { path: '/test-room-management', label: 'Rooms', icon: '🏢' },
    { path: '/enhanced-live-shopping', label: 'Live Shopping+', icon: Film },
    { path: '/test-admin-setup', label: 'Admin Setup', icon: Settings },
    { path: '/marketplace', label: 'Marketplace', icon: ShoppingBag },
  ];

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-2">
            <div className="text-2xl font-bold text-green-600">🥭 MangooTech</div>
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
                  {typeof item.icon === 'string' ? (
                    <span>{item.icon}</span>
                  ) : (
                    <item.icon className="w-4 h-4" />
                  )}
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