import React from 'react';

interface AdminButtonTesterProps {
  currentPage: string;
}

export default function AdminButtonTester({ currentPage }: AdminButtonTesterProps) {
  const testNavigation = (page: string) => {
    console.log(`🧪 Test navigation vers: ${page}`);
    window.location.hash = `#/admin/${page}`;
  };

  const pages = [
    'dashboard',
    'shops',
    'shops/create',
    'payments',
    'commissions',
    'users',
    'settings'
  ];

  return (
    <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
      <h3 className="text-sm font-bold mb-2 text-gray-900 dark:text-white">🧪 Test Navigation</h3>
      <div className="space-y-2">
        {pages.map((page) => (
          <button
            key={page}
            onClick={() => testNavigation(page)}
            className={`block w-full text-xs px-3 py-2 rounded transition-colors ${
              currentPage === page
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {page}
          </button>
        ))}
      </div>
      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Page actuelle: <span className="font-mono">{currentPage || 'dashboard'}</span>
        </p>
      </div>
    </div>
  );
}