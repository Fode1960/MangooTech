import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Store, Package, Star, Power, Settings, Palette, Upload, LogOut } from 'lucide-react';

const MiniBoutiqueTestMode = ({ vendorId }) => {
  const [boutiques, setBoutiques] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    logo: '',
    banner: '',
    primaryColor: '#FF6B35',
    secondaryColor: '#4CAF50',
    isActive: true
  });

  const availableCategories = [
    { id: 'fashion', name: 'Mode & Accessoires', icon: '👗' },
    { id: 'electronics', name: 'Électronique', icon: '📱' },
    { id: 'handicraft', name: 'Artisanat Local', icon: '🎨' },
    { id: 'food', name: 'Alimentation & Épicerie', icon: '🍲' },
    { id: 'beauty', name: 'Beauté & Santé', icon: '💄' },
    { id: 'home', name: 'Maison & Décor', icon: '🏠' }
  ];

  // Charger les boutiques depuis le localStorage
  const loadBoutiques = () => {
    const savedBoutiques = JSON.parse(localStorage.getItem('mock_boutiques') || '[]');
    const transformedBoutiques = savedBoutiques.map(shop => ({
      id: shop.id,
      name: shop.name,
      description: shop.description,
      logo: shop.logo_url || '',
      banner: shop.banner_url || '',
      primaryColor: shop.primary_color || '#FF6B35',
      secondaryColor: shop.secondary_color || '#4CAF50',
      isActive: shop.isActive !== false,
      isVerified: shop.is_verified || true,
      status: shop.status || 'approved',
      createdAt: shop.created_at,
      productsCount: shop.total_orders || 0,
      followers: 0,
      rating: shop.rating || 0
    }));
    setBoutiques(transformedBoutiques);
  };

  useEffect(() => {
    loadBoutiques();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const baseSlug = formData.name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
    const uniqueSlug = `${baseSlug}-${Date.now().toString(36)}`;
    
    const newBoutique = {
      id: 'mock-' + Date.now(),
      user_id: '550e8400-e29b-41d4-a716-446655440000',
      name: formData.name.trim(),
      slug: uniqueSlug,
      description: formData.description.trim(),
      status: 'approved',
      is_verified: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      logo_url: formData.logo || null,
      banner_url: formData.banner || null,
      primary_color: formData.primaryColor,
      secondary_color: formData.secondaryColor,
      isActive: formData.isActive,
      total_orders: 0,
      rating: 0
    };
    
    // Sauvegarder dans localStorage
    const existingBoutiques = JSON.parse(localStorage.getItem('mock_boutiques') || '[]');
    existingBoutiques.push(newBoutique);
    localStorage.setItem('mock_boutiques', JSON.stringify(existingBoutiques));
    
    // Recharger les boutiques
    loadBoutiques();
    
    // Réinitialiser le formulaire
    setFormData({
      name: '',
      description: '',
      logo: '',
      banner: '',
      primaryColor: '#FF6B35',
      secondaryColor: '#4CAF50',
      isActive: true
    });
    setShowForm(false);
    
    alert('✅ Boutique créée avec succès !');
  };

  const deleteBoutique = (boutiqueId) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette boutique ?')) {
      const existingBoutiques = JSON.parse(localStorage.getItem('mock_boutiques') || '[]');
      const filteredBoutiques = existingBoutiques.filter(b => b.id !== boutiqueId);
      localStorage.setItem('mock_boutiques', JSON.stringify(filteredBoutiques));
      loadBoutiques();
      alert('Boutique supprimée !');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-orange-50 p-6">
      {/* Bouton de déconnexion pour le mode test */}
      <div className="max-w-7xl mx-auto mb-4">
        <div className="flex justify-end">
          <button
            onClick={() => {
              localStorage.removeItem('test_mode');
              localStorage.removeItem('test_user');
              localStorage.removeItem('mock_boutiques');
              window.location.href = '/login';
            }}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
          >
            <LogOut className="w-4 h-4" />
            <span>Quitter le Mode Test</span>
          </button>
        </div>
      </div>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-500 to-green-600 bg-clip-text text-transparent mb-2">
                Mes Mini-Boutiques
              </h1>
              <p className="text-gray-600 text-lg">
                Mode Test Simplifié - Créez et gérez vos boutiques
              </p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="bg-gradient-to-r from-orange-500 to-green-500 hover:from-orange-600 hover:to-green-600 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Créer une Mini-Boutique</span>
            </button>
          </div>
        </div>

        {/* Liste des boutiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {boutiques.map((boutique) => (
            <div key={boutique.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
              <div className="h-32 bg-gradient-to-r from-orange-400 to-green-500 relative">
                {boutique.banner && (
                  <img src={boutique.banner} alt="Banner" className="w-full h-full object-cover" />
                )}
                <div className="absolute top-4 right-4 flex space-x-2">
                  <button
                    onClick={() => deleteBoutique(boutique.id)}
                    className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl" style={{ backgroundColor: boutique.primaryColor }}>
                      {boutique.logo ? (
                        <img src={boutique.logo} alt="Logo" className="w-8 h-8 rounded-full" />
                      ) : (
                        <Store className="w-6 h-6 text-white" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{boutique.name}</h3>
                      <p className="text-sm text-gray-600">{boutique.description}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span>{boutique.rating}/5</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Package className="w-4 h-4" />
                    <span>{boutique.productsCount} produits</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                    boutique.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {boutique.isActive ? 'Active' : 'Inactive'}
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                    boutique.isVerified ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {boutique.isVerified ? 'Vérifié' : 'Non vérifié'}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {boutiques.length === 0 && (
          <div className="text-center py-12">
            <Store className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucune boutique créée</h3>
            <p className="text-gray-600 mb-6">Commencez par créer votre première mini-boutique</p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-gradient-to-r from-orange-500 to-green-500 hover:from-orange-600 hover:to-green-600 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200"
            >
              Créer ma première boutique
            </button>
          </div>
        )}

        {/* Modal de création */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Créer une Mini-Boutique</h2>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom de la Boutique *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Ex: DAN Shop"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Décrivez votre boutique..."
                    rows={3}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Couleur Principale
                    </label>
                    <input
                      type="color"
                      value={formData.primaryColor}
                      onChange={(e) => setFormData({...formData, primaryColor: e.target.value})}
                      className="w-full h-10 rounded-lg border border-gray-300"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Couleur Secondaire
                    </label>
                    <input
                      type="color"
                      value={formData.secondaryColor}
                      onChange={(e) => setFormData({...formData, secondaryColor: e.target.value})}
                      className="w-full h-10 rounded-lg border border-gray-300"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                    className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                  />
                  <label htmlFor="isActive" className="text-sm text-gray-700">
                    Activer la boutique immédiatement
                  </label>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <Settings className="w-5 h-5 text-blue-600" />
                    <span className="text-sm text-blue-800 font-medium">Mode Test Actif</span>
                  </div>
                  <p className="text-sm text-blue-700 mt-1">
                    Les boutiques créées sont stockées localement et apparaissent approuvées pour les tests.
                  </p>
                </div>

                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-orange-500 to-green-500 hover:from-orange-600 hover:to-green-600 text-white py-2 px-4 rounded-lg font-medium transition-all duration-200"
                  >
                    Créer la Boutique
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MiniBoutiqueTestMode;