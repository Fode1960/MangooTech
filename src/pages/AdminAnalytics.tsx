import { useState, useEffect } from 'react';

export default function AdminAnalytics() {
  const [mounted, setMounted] = useState(false);

  console.log('🎯 ADMIN ANALYTICS: Component function called');
  console.log('📍 Current URL:', window.location.href);
  console.log('🔄 Component rendering...');

  useEffect(() => {
    console.log('🎯 ADMIN ANALYTICS: useEffect triggered - Component mounted!');
    setMounted(true);
    
    // ALERT pour confirmation visuelle
    alert('🎯 ADMIN ANALYTICS: Component est monté et visible!');
  }, []);

  return (
    <div className="p-8">
      {(() => {
        console.log('🎯 ADMIN ANALYTICS: RETURN executed - JSX rendering!');
        console.log('🎯 ADMIN ANALYTICS: mounted state:', mounted);
        return null;
      })()}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">Statistiques et analyses de la plateforme</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Utilisateurs Actifs</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">1,234</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              <span className="text-blue-600 dark:text-blue-300 text-xl">👥</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Boutiques</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">56</p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
              <span className="text-green-600 dark:text-green-300 text-xl">🏪</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Commandes</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">789</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
              <span className="text-purple-600 dark:text-purple-300 text-xl">📦</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Revenus</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">€12,345</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center">
              <span className="text-yellow-600 dark:text-yellow-300 text-xl">💰</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Activité Récente</h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Nouvelle boutique créée - Boutique de Mode</p>
              <span className="text-xs text-gray-400 dark:text-gray-500">il y a 2h</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Commande passée - €125.50</p>
              <span className="text-xs text-gray-400 dark:text-gray-500">il y a 4h</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Nouvel utilisateur inscrit</p>
              <span className="text-xs text-gray-400 dark:text-gray-500">il y a 6h</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Performance</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-300">Taux de conversion</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">3.2%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '32%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-300">Satisfaction client</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">94%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: '94%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}