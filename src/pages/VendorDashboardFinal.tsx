import React, { useState } from 'react';

// Icônes SVG inline pour éviter toute dépendance externe
const PackageIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-orange-600">
    <path d="m7.5 4.27 9 5.15"/>
    <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/>
    <path d="m3.3 7 8.7 5 8.7-5"/>
    <path d="M12 22v-10"/>
  </svg>
);

const LogOutIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" x2="9" y1="12" y2="12"/>
  </svg>
);

const VendorDashboardFinal = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [products] = useState([
    { id: 1, name: 'Produit Test 1', price: 10000 },
    { id: 2, name: 'Produit Test 2', price: 20000 }
  ]);

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <PackageIcon />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Espace Vendeur (Final)</h2>
          <p className="text-gray-600 mb-6">Version stabilisée et isolée.</p>
          <button
            onClick={() => setIsLoggedIn(true)}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-bold"
          >
            Accéder au tableau de bord
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow p-4 flex justify-between items-center sticky top-0 z-10">
        <h1 className="text-xl font-bold text-gray-800">Dashboard Vendeur</h1>
        <button 
          onClick={() => setIsLoggedIn(false)} 
          className="flex items-center gap-2 text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors"
        >
          <LogOutIcon /> Déconnexion
        </button>
      </header>

      <main className="container mx-auto p-4 py-8">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2 border-b pb-4">
            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
               <PackageIcon />
            </div>
            Mes Produits
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {products.map(p => (
              <div key={p.id} className="border border-gray-200 p-6 rounded-xl hover:shadow-md transition-shadow bg-white">
                <h3 className="font-bold text-lg mb-2">{p.name}</h3>
                <p className="text-green-600 font-medium bg-green-50 inline-block px-3 py-1 rounded-full">
                  {p.price.toLocaleString()} FCFA
                </p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default VendorDashboardFinal;