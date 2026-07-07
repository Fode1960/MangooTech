import React, { useState, useEffect } from 'react';
import { Plus, Store, MapPin, Phone, Mail, Globe, Package, QrCode, Camera, Trash2, Edit, Save, X, Download, Upload, Palette, Image as ImageIcon } from 'lucide-react';

interface Shop {
  id: string;
  name: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  category: string;
  image?: string;
  logo?: string;
  primaryColor?: string;
  secondaryColor?: string;
  qrCode?: string;
  ownerId: string;
  createdAt: string;
  status: 'active' | 'inactive';
}

const MiniBoutiqueTestSimple: React.FC = () => {
  const [shops, setShops] = useState<Shop[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingShop, setEditingShop] = useState<Shop | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Formulaire
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    category: 'general',
    logo: '',
    primaryColor: '#F97316', // Orange par défaut
    secondaryColor: '#FBBF24' // Jaune/ambre par défaut
  });

  const categories = [
    'general',
    'alimentation',
    'vetements',
    'electronique',
    'artisanat',
    'services',
    'agriculture',
    'beauté',
    'santé'
  ];

  // Palettes de couleurs prédéfinies
  const colorPalettes = [
    { name: 'Orange Mangoo', primary: '#F97316', secondary: '#FBBF24' },
    { name: 'Bleu Ciel', primary: '#0EA5E9', secondary: '#38BDF8' },
    { name: 'Vert Nature', primary: '#10B981', secondary: '#34D399' },
    { name: 'Rouge Passion', primary: '#EF4444', secondary: '#F87171' },
    { name: 'Violet Royal', primary: '#8B5CF6', secondary: '#A78BFA' },
    { name: 'Rose Doux', primary: '#EC4899', secondary: '#F472B6' },
    { name: 'Marron Terre', primary: '#A16207', secondary: '#CA8A04' },
    { name: 'Gris Moderne', primary: '#6B7280', secondary: '#9CA3AF' }
  ];

  useEffect(() => {
    const storageEntries = [
      ['local_mode', 'local_user'],
      ['test_mode', 'test_user'],
      ['demo_mode', 'demo_user'],
      ['fake_mode', 'fake_user'],
    ] as const;

    const user = storageEntries.reduce<any>((found, [modeKey, userKey]) => {
      if (found) return found;
      const mode = localStorage.getItem(modeKey);
      const rawUser = localStorage.getItem(userKey);
      if (mode === 'true' && rawUser) {
        try {
          return JSON.parse(rawUser);
        } catch {
          return null;
        }
      }
      return null;
    }, null);

    setCurrentUser(user);

    if (user) {
      const shopsKey = getShopsKey(user.id);
      const savedShops = localStorage.getItem(shopsKey);
      if (savedShops) {
        try {
          const parsedShops = JSON.parse(savedShops);
          setShops(parsedShops);
          console.log(`Boutiques chargÃ©es pour l'utilisateur ${user.id}:`, parsedShops.length);
        } catch (error) {
          console.error('Erreur lors du chargement des boutiques:', error);
          setShops([]);
        }
      } else {
        console.log(`Aucune boutique trouvÃ©e pour l'utilisateur ${user.id}`);
        setShops([]);
      }
    }
  }, []);

  const getCurrentUser = () => {
    // Vérifier tous les modes d'authentification
    const localMode = localStorage.getItem('local_mode');
    const localUser = localStorage.getItem('local_user');
    const testMode = localStorage.getItem('test_mode');
    const testUser = localStorage.getItem('test_user');
    const demoMode = localStorage.getItem('demo_mode');
    const demoUser = localStorage.getItem('demo_user');
    const fakeMode = localStorage.getItem('fake_mode');
    const fakeUser = localStorage.getItem('fake_user');
    
    if (localMode === 'true' && localUser) {
      return JSON.parse(localUser);
    }
    if (testMode === 'true' && testUser) {
      return JSON.parse(testUser);
    }
    if (demoMode === 'true' && demoUser) {
      return JSON.parse(demoUser);
    }
    if (fakeMode === 'true' && fakeUser) {
      return JSON.parse(fakeUser);
    }
    
    return null;
  };

  const getShopsKey = (userId: string) => {
    return `test_shops_${userId}`;
  };

  const loadShops = (userId: string) => {
    const shopsKey = getShopsKey(userId);
    const savedShops = localStorage.getItem(shopsKey);
    
    if (savedShops) {
      try {
        const parsedShops = JSON.parse(savedShops);
        setShops(parsedShops);
        console.log(`Boutiques chargées pour l'utilisateur ${userId}:`, parsedShops.length);
      } catch (error) {
        console.error('Erreur lors du chargement des boutiques:', error);
        setShops([]);
      }
    } else {
      console.log(`Aucune boutique trouvée pour l'utilisateur ${userId}`);
      setShops([]);
    }
  };

  const saveShops = (userId: string, newShops: Shop[]) => {
    const shopsKey = getShopsKey(userId);
    localStorage.setItem(shopsKey, JSON.stringify(newShops));
    setShops(newShops);
    console.log(`Boutiques sauvegardées pour l'utilisateur ${userId}:`, newShops.length);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>, type: 'logo') => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string;
      if (type === 'logo') {
        setFormData({...formData, logo: imageUrl});
      }
    };
    reader.readAsDataURL(file);
    
    // Réinitialiser l'input
    event.target.value = '';
  };

  const applyColorPalette = (palette: typeof colorPalettes[0]) => {
    setFormData({
      ...formData,
      primaryColor: palette.primary,
      secondaryColor: palette.secondary
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      if (!currentUser) {
        throw new Error('Vous devez être connecté pour créer une boutique');
      }

      const newShop: Shop = {
        id: 'shop-' + Date.now(),
        name: formData.name,
        description: formData.description,
        address: formData.address,
        phone: formData.phone,
        email: formData.email,
        website: formData.website,
        category: formData.category,
        logo: formData.logo,
        primaryColor: formData.primaryColor,
        secondaryColor: formData.secondaryColor,
        ownerId: currentUser.id,
        createdAt: new Date().toISOString(),
        status: 'active'
      };

      // Ajouter la nouvelle boutique
      const updatedShops = [...shops, newShop];
      saveShops(currentUser.id, updatedShops);

      // Réinitialiser le formulaire
      setFormData({
        name: '',
        description: '',
        address: '',
        phone: '',
        email: '',
        website: '',
        category: 'general',
        logo: '',
        primaryColor: '#F97316',
        secondaryColor: '#FBBF24'
      });
      setShowForm(false);
      
      setMessage('✅ Boutique créée avec succès!');
      setTimeout(() => setMessage(''), 3000);

    } catch (error: any) {
      setMessage(`❌ Erreur: ${error.message}`);
      setTimeout(() => setMessage(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (shopId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette boutique?')) {
      if (!currentUser) return;
      
      const updatedShops = shops.filter(shop => shop.id !== shopId);
      saveShops(currentUser.id, updatedShops);
      setMessage('🗑️ Boutique supprimée');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleEdit = (shop: Shop) => {
    setEditingShop(shop);
    setFormData({
      name: shop.name,
      description: shop.description,
      address: shop.address,
      phone: shop.phone,
      email: shop.email,
      website: shop.website || '',
      category: shop.category,
      logo: shop.logo || '',
      primaryColor: shop.primaryColor || '#F97316',
      secondaryColor: shop.secondaryColor || '#FBBF24'
    });
    setShowForm(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!editingShop || !currentUser) return;

      const updatedShop: Shop = {
        ...editingShop,
        name: formData.name,
        description: formData.description,
        address: formData.address,
        phone: formData.phone,
        email: formData.email,
        website: formData.website,
        category: formData.category,
        logo: formData.logo,
        primaryColor: formData.primaryColor,
        secondaryColor: formData.secondaryColor
      };

      const updatedShops = shops.map(shop => 
        shop.id === editingShop.id ? updatedShop : shop
      );
      saveShops(currentUser.id, updatedShops);

      setEditingShop(null);
      setShowForm(false);
      resetForm();
      
      setMessage('✅ Boutique mise à jour!');
      setTimeout(() => setMessage(''), 3000);

    } catch (error: any) {
      setMessage(`❌ Erreur: ${error.message}`);
      setTimeout(() => setMessage(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      address: '',
      phone: '',
      email: '',
      website: '',
      category: 'general',
      logo: '',
      primaryColor: '#F97316',
      secondaryColor: '#FBBF24'
    });
    setEditingShop(null);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingShop(null);
    resetForm();
  };

  // Exporter les données
  const exportData = () => {
    if (!currentUser) return;
    
    const data = {
      userId: currentUser.id,
      userEmail: currentUser.email,
      shops: shops,
      exportDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `boutiques_${currentUser.email}_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    setMessage('📥 Données exportées avec succès!');
    setTimeout(() => setMessage(''), 3000);
  };

  // Importer des données
  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !currentUser) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.shops && Array.isArray(data.shops)) {
          // Mettre à jour le ownerId pour correspondre à l'utilisateur actuel
          const importedShops = data.shops.map((shop: Shop) => ({
            ...shop,
            ownerId: currentUser.id,
            id: 'shop-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9)
          }));
          
          saveShops(currentUser.id, importedShops);
          setMessage('📤 Données importées avec succès!');
          setTimeout(() => setMessage(''), 3000);
        }
      } catch (error) {
        setMessage('❌ Erreur lors de l\'importation des données');
        setTimeout(() => setMessage(''), 5000);
      }
    };
    reader.readAsText(file);
    
    // Réinitialiser l'input
    event.target.value = '';
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#f6faf3] p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <Store className="w-16 h-16 text-[#1b5e20] mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Connexion Requise</h2>
            <p className="text-gray-600 mb-6">
              Vous devez être connecté pour accéder aux Mini-Boutiques.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => window.location.href = '/login'}
                className="w-full bg-[#1b5e20] text-white hover:bg-[#16381a] py-3 px-6 rounded-lg transition-all duration-200 font-medium"
              >
                Se Connecter
              </button>
              <button
                onClick={() => {
                  // Mode test rapide
                  const testUser = {
                    id: 'test-user-' + Date.now(),
                    email: 'test@local.com',
                    user_metadata: {
                      role: 'vendor',
                      full_name: 'Test Local'
                    }
                  };
                  localStorage.setItem('local_user', JSON.stringify(testUser));
                  localStorage.setItem('local_mode', 'true');
                  window.location.reload();
                }}
                className="w-full bg-[#1b5e20] text-white hover:bg-[#16381a] py-3 px-6 rounded-lg transition-all duration-200 font-medium"
              >
                Mode Test Rapide
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6faf3] p-6">
      <div className="max-w-6xl mx-auto">
        {/* En-tête */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Mini-Boutiques</h1>
              <p className="text-gray-600">Gérez vos boutiques locales avec style</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={exportData}
                className="bg-[#1b5e20] text-white hover:bg-[#16381a] px-4 py-2 rounded-lg transition-all duration-200 flex items-center space-x-2 font-medium text-sm"
              >
                <Download className="w-4 h-4" />
                <span>Exporter</span>
              </button>
              <label className="bg-[#1b5e20] text-white hover:bg-[#16381a] px-4 py-2 rounded-lg transition-all duration-200 flex items-center space-x-2 font-medium text-sm cursor-pointer">
                <Upload className="w-4 h-4" />
                <span>Importer</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={importData}
                  className="hidden"
                />
              </label>
              <button
                onClick={() => setShowForm(true)}
                className="bg-[#1b5e20] text-white hover:bg-[#16381a] px-6 py-2 rounded-lg transition-all duration-200 flex items-center space-x-2 font-medium"
              >
                <Plus className="w-5 h-5" />
                <span>Créer une Boutique</span>
              </button>
            </div>
          </div>
        </div>

        {/* Messages */}
        {message && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-green-800">{message}</p>
          </div>
        )}

        {/* Info utilisateur */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-blue-800">
            <strong>Utilisateur connecté:</strong> {currentUser.email} ({currentUser.id})
          </p>
          <p className="text-blue-600 text-sm mt-1">
            Personnalisez vos boutiques avec des logos et des couleurs uniques.
          </p>
        </div>

        {/* Formulaire de création/édition */}
        {showForm && (
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingShop ? 'Modifier la Boutique' : 'Créer une Nouvelle Boutique'}
            </h2>
            <form onSubmit={editingShop ? handleUpdate : handleSubmit} className="space-y-6">
              
              {/* Section Logo et Couleurs */}
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Palette className="w-5 h-5 mr-2" />
                  Personnalisation Visuelle
                </h3>
                
                {/* Logo */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Logo de la boutique</label>
                  <div className="flex items-center space-x-4">
                    {formData.logo ? (
                      <div className="relative">
                        <img 
                          src={formData.logo} 
                          alt="Logo" 
                          className="w-16 h-16 rounded-lg object-cover border-2 border-gray-300"
                        />
                        <button
                          type="button"
                          onClick={() => setFormData({...formData, logo: ''})}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-100">
                        <ImageIcon className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                    <label className="bg-white border border-gray-300 rounded-lg px-4 py-2 cursor-pointer hover:bg-gray-50 flex items-center space-x-2">
                      <Camera className="w-4 h-4" />
                      <span className="text-sm">Choisir une image</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, 'logo')}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* Palettes de couleurs */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Palette de couleurs</label>
                  <div className="grid grid-cols-4 gap-3">
                    {colorPalettes.map((palette) => (
                      <button
                        key={palette.name}
                        type="button"
                        onClick={() => applyColorPalette(palette)}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          formData.primaryColor === palette.primary && formData.secondaryColor === palette.secondary
                            ? 'border-gray-900 shadow-md'
                            : 'border-gray-200 hover:border-gray-400'
                        }`}
                        title={palette.name}
                      >
                        <div className="flex space-x-1">
                          <div 
                            className="w-4 h-4 rounded-full" 
                            style={{ backgroundColor: palette.primary }}
                          />
                          <div 
                            className="w-4 h-4 rounded-full" 
                            style={{ backgroundColor: palette.secondary }}
                          />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sélecteurs de couleurs personnalisés */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Couleur principale</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={formData.primaryColor}
                        onChange={(e) => setFormData({...formData, primaryColor: e.target.value})}
                        className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={formData.primaryColor}
                        onChange={(e) => setFormData({...formData, primaryColor: e.target.value})}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        placeholder="#F97316"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Couleur secondaire</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={formData.secondaryColor}
                        onChange={(e) => setFormData({...formData, secondaryColor: e.target.value})}
                        className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={formData.secondaryColor}
                        onChange={(e) => setFormData({...formData, secondaryColor: e.target.value})}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        placeholder="#FBBF24"
                      />
                    </div>
                  </div>
                </div>

                {/* Aperçu des couleurs */}
                <div className="mt-4 p-3 rounded-lg border border-gray-200 bg-white">
                  <p className="text-sm text-gray-600 mb-2">Aperçu :</p>
                  <div className="flex items-center space-x-4">
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                      style={{ backgroundColor: formData.primaryColor }}
                    >
                      A
                    </div>
                    <div 
                      className="px-3 py-1 rounded-full text-white text-xs font-medium"
                      style={{ backgroundColor: formData.secondaryColor }}
                    >
                      Bouton
                    </div>
                    <div 
                      className="flex-1 h-2 rounded"
                      style={{ 
                        background: `linear-gradient(90deg, ${formData.primaryColor}, ${formData.secondaryColor})` 
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Informations de base */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nom de la boutique *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1b5e20]"
                    required
                    placeholder="ex: Boutique Mamadou"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Catégorie</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1b5e20]"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1b5e20]"
                  rows={3}
                  required
                  placeholder="Décrivez votre boutique et ses produits..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Adresse *</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1b5e20]"
                    required
                    placeholder="ex: Dakar, Sénégal"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone *</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1b5e20]"
                    required
                    placeholder="ex: +221771234567"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1b5e20]"
                    required
                    placeholder="ex: contact@boutique.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Site web (optionnel)</label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({...formData, website: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1b5e20]"
                    placeholder="ex: www.boutique.com"
                  />
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-[#1b5e20] text-white hover:bg-[#16381a] px-6 py-2 rounded-lg transition-all duration-200 flex items-center space-x-2 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{loading ? 'Chargement...' : (editingShop ? 'Mettre à jour' : 'Créer')}</span>
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-all duration-200 flex items-center space-x-2"
                >
                  <X className="w-4 h-4" />
                  <span>Annuler</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Liste des boutiques */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Mes Boutiques ({shops.length})</h2>
          
          {shops.length === 0 ? (
            <div className="text-center py-12">
              <Store className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune boutique créée</h3>
              <p className="text-gray-600 mb-4">Commencez par créer votre première boutique personnalisée</p>
              <button
                onClick={() => setShowForm(true)}
                className="bg-[#1b5e20] text-white hover:bg-[#16381a] px-6 py-2 rounded-lg transition-all duration-200"
              >
                Créer une Boutique
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {shops.map((shop) => (
                <div 
                  key={shop.id} 
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-all duration-200 overflow-hidden"
                  style={{ 
                    borderColor: shop.primaryColor || '#F97316',
                    background: `linear-gradient(135deg, ${shop.primaryColor || '#F97316'}05, ${shop.secondaryColor || '#FBBF24'}05)`
                  }}
                >
                  {/* En-tête avec couleurs personnalisées */}
                  <div 
                    className="-mx-4 -mt-4 mb-4 px-4 py-3 flex items-center justify-between"
                    style={{ 
                      background: `linear-gradient(90deg, ${shop.primaryColor || '#F97316'}, ${shop.secondaryColor || '#FBBF24'})`
                    }}
                  >
                    <div className="flex items-center space-x-3">
                      {shop.logo ? (
                        <img 
                          src={shop.logo} 
                          alt="Logo" 
                          className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-md"
                        />
                      ) : (
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md"
                          style={{ backgroundColor: shop.primaryColor || '#F97316' }}
                        >
                          {shop.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <h3 className="font-semibold text-white text-shadow">
                        {shop.name}
                      </h3>
                    </div>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => handleEdit(shop)}
                        className="p-1 text-white hover:bg-white hover:bg-opacity-20 rounded"
                        title="Modifier"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(shop.id)}
                        className="p-1 text-white hover:bg-white hover:bg-opacity-20 rounded"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">{shop.description}</p>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-2 text-gray-700">
                      <MapPin className="w-4 h-4" style={{ color: shop.primaryColor }} />
                      <span>{shop.address}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-700">
                      <Phone className="w-4 h-4" style={{ color: shop.primaryColor }} />
                      <span>{shop.phone}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-700">
                      <Mail className="w-4 h-4" style={{ color: shop.primaryColor }} />
                      <span>{shop.email}</span>
                    </div>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 capitalize px-2 py-1 rounded" 
                            style={{ backgroundColor: `${shop.primaryColor}10`, color: shop.primaryColor }}>
                        {shop.category}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        shop.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {shop.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MiniBoutiqueTestSimple;
