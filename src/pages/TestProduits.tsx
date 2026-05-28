import React, { useState } from 'react';
import ProductManagerSimple from '../components/ProductManagerSimple';

const TestProduits = () => {
  const [showProductManager, setShowProductManager] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          Test du Bouton Produits
        </h1>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Test du Gestionnaire de Produits
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Cliquez sur le bouton ci-dessous pour tester le gestionnaire de produits :
          </p>
          
          <button
            onClick={() => setShowProductManager(!showProductManager)}
            className="bg-gradient-to-r from-orange-500 to-green-600 text-white px-6 py-3 rounded-lg font-medium hover:from-orange-600 hover:to-green-700 transition-all"
          >
            {showProductManager ? 'Masquer' : 'Afficher'} le Gestionnaire de Produits
          </button>
        </div>

        {showProductManager && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <ProductManagerSimple vendorId="test-vendor-123" />
          </div>
        )}
      </div>
    </div>
  );
};

export default TestProduits;