import React from 'react';
import { Video, ShoppingCart, Phone, ArrowLeft } from 'lucide-react';

interface TestNavigationProps {
  currentPage?: string;
}

const TestNavigation: React.FC<TestNavigationProps> = ({ currentPage }) => {
  const testLinks = [
    {
      name: 'Appel Vidéo',
      path: '/test-video-call',
      icon: Video,
      description: 'Testez les appels vidéo WebRTC'
    },
    {
      name: 'Live Shopping',
      path: '/test-live-shopping',
      icon: ShoppingCart,
      description: 'Testez la vente en direct'
    },
    {
      name: 'Démo Principale',
      path: '/demo',
      icon: Phone,
      description: 'Retour à l\'interface de démo'
    }
  ];

  return (
    <div className="bg-gray-800 text-white p-4 rounded-lg mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Navigation des Tests</h3>
        <a
          href="/demo"
          className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour</span>
        </a>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {testLinks.map((link) => {
          const Icon = link.icon;
          const isActive = currentPage === link.path;
          
          return (
            <a
              key={link.path}
              href={link.path}
              className={`p-4 rounded-lg border transition-all hover:scale-105 ${
                isActive
                  ? 'bg-blue-600 border-blue-500'
                  : 'bg-gray-700 border-gray-600 hover:bg-gray-600'
              }`}
            >
              <div className="flex items-center space-x-3 mb-2">
                <Icon className="w-6 h-6" />
                <span className="font-semibold">{link.name}</span>
              </div>
              <p className="text-sm text-gray-300">{link.description}</p>
            </a>
          );
        })}
      </div>
    </div>
  );
};

export default TestNavigation;