import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import VendorAccessQR from '../components/VendorAccessQR';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const VendorAccessQRPage = () => {
  const [shops, setShops] = useState([]);
  const [selectedShop, setSelectedShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Charger la liste des boutiques
  const loadShops = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Chargement de la liste des boutiques...');
      
      const { data, error } = await supabase
        .from('shops')
        .select('*')
        .order('name');

      if (error) {
        console.error('Erreur lors du chargement des boutiques:', error);
        setError('Impossible de charger la liste des boutiques');
        return;
      }

      console.log('Boutiques chargées:', data);
      setShops(data || []);
      
      // Sélectionner la première boutique par défaut
      if (data && data.length > 0) {
        setSelectedShop(data[0]);
      }
    } catch (err) {
      console.error('Erreur inattendue:', err);
      setError('Erreur inattendue lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  // Charger au montage
  useEffect(() => {
    loadShops();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des boutiques...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h2 className="text-xl font-semibold text-red-800 mb-2">Erreur</h2>
          <p className="text-red-700">{error}</p>
          <button 
            onClick={loadShops}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  if (shops.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md">
          <h2 className="text-xl font-semibold text-yellow-800 mb-2">Aucune boutique</h2>
          <p className="text-yellow-700">Aucune boutique n'a été trouvée.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* En-tête */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Accès & QR des Vendeurs
            </h1>
            <p className="mt-2 text-gray-600">
              Gérez les paramètres d'authentification de vos vendeurs
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Liste des boutiques */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Sélectionner une boutique</h2>
              <div className="space-y-2">
                {shops.map((shop) => (
                  <button
                    key={shop.id}
                    onClick={() => {
                      console.log('Sélection de la boutique:', shop);
                      setSelectedShop(shop);
                    }}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedShop?.id === shop.id
                        ? 'bg-blue-50 border-blue-300 text-blue-800'
                        : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className="font-medium">{shop.name}</div>
                    <div className="text-sm text-gray-500">{shop.slug}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Détails de la boutique sélectionnée */}
          <div className="lg:col-span-3">
            {selectedShop && (
              <div>
                {/* Bouton de test pour vérifier que tout fonctionne */}
                <div className="mb-6">
                  <button
                    onClick={() => {
                      console.log('=== TEST DU BOUTON ACCÈS & QR ===');
                      console.log('Boutique sélectionnée:', selectedShop);
                      console.log('ID:', selectedShop.id);
                      console.log('Nom:', selectedShop.name);
                      console.log('Slug:', selectedShop.slug);
                      alert(`Boutique: ${selectedShop.name}\nID: ${selectedShop.id}\nSlug: ${selectedShop.slug}`);
                    }}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 font-semibold"
                  >
                    🧪 TESTER LE BOUTON ACCÈS & QR
                  </button>
                </div>

                {/* Composant d'accès et QR */}
                <VendorAccessQR
                  shopId={selectedShop.id}
                  shopName={selectedShop.name}
                  shopSlug={selectedShop.slug}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorAccessQRPage;