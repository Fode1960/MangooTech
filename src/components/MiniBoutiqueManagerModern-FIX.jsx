import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Edit, Trash2, Store, Users, Package, Star, Power, Settings, Palette, Upload, Key, QrCode, Link } from 'lucide-react';
import { supabase } from '../config/supabase';
import VendorAuthSystem from './VendorAuthSystem';

const MiniBoutiqueManagerModern = ({ vendorId }) => {
  const [isDark, setIsDark] = useState(false);
  const [boutiques, setBoutiques] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingBoutique, setEditingBoutique] = useState(null);
  const [activeTab, setActiveTab] = useState('list');
  const [selectedBoutiqueForAuth, setSelectedBoutiqueForAuth] = useState(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [previewBoutique, setPreviewBoutique] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    logo: '',
    banner: '',
    primaryColor: '#FF6B35',
    secondaryColor: '#4CAF50',
    categories: [],
    isActive: true,
    socialLinks: {
      instagram: '',
      facebook: ''
    }
  });

  // Références pour la gestion robuste des événements
  const tabButtonsRef = useRef({});
  const createButtonRef = useRef(null);

  const availableCategories = [
    { id: 'fashion', name: 'Mode & Accessoires', icon: '👗' },
    { id: 'electronics', name: 'Électronique', icon: '📱' },
    { id: 'handicraft', name: 'Artisanat Local', icon: '🎨' },
    { id: 'food', name: 'Alimentation & Épicerie', icon: '🍲' },
    { id: 'beauty', name: 'Beauté & Santé', icon: '💄' },
    { id: 'home', name: 'Maison & Décor', icon: '🏠' },
    { id: 'sports', name: 'Sports & Loisirs', icon: '⚽' },
    { id: 'books', name: 'Livres & Papeterie', icon: '📚' },
    { id: 'toys', name: 'Jouets & Enfants', icon: '🧸' },
    { id: 'auto', name: 'Auto & Moto', icon: '🚗' }
  ];

  const colorPalettes = [
    { primary: '#FF6B35', secondary: '#4CAF50', name: 'Afrique Vibrante' },
    { primary: '#2196F3', secondary: '#FF9800', name: 'Tech Moderne' },
    { primary: '#9C27B0', secondary: '#E91E63', name: 'Élégance' },
    { primary: '#795548', secondary: '#FFC107', name: 'Naturel' },
    { primary: '#607D8B', secondary: '#00BCD4', name: 'Professionnel' }
  ];

  // NOUVEAU: Chargement amélioré avec gestion d'erreurs
  const loadBoutiques = async () => {
    setLoading(true);
    setAuthError(null);
    
    try {
      console.log('🔄 [LOAD] Début chargement des boutiques');
      
      // Essayer d'abord d'obtenir l'utilisateur connecté
      const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.warn('⚠️ [LOAD] Erreur auth:', authError);
        setAuthError(authError.message);
      }
      
      setUser(currentUser);
      console.log(`👤 [LOAD] Utilisateur: ${currentUser ? currentUser.email : 'Non connecté'}`);

      let shops = [];
      
      if (currentUser) {
        // Si connecté, charger ses boutiques
        console.log('[LOAD] Chargement boutiques utilisateur connecté');
        const { data, error } = await supabase
          .from('shops')
          .select('*')
          .eq('user_id', currentUser.id)
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error('❌ [LOAD] Erreur chargement user shops:', error);
        } else {
          shops = data || [];
          console.log(`✅ [LOAD] ${shops.length} boutiques utilisateur chargées`);
        }
      } else {
        // Si non connecté, charger toutes les boutiques (mode demo)
        console.log('[LOAD] Mode demo: chargement de toutes les boutiques');
        const { data, error } = await supabase
          .from('shops')
          .select('*')
          .limit(10)
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error('❌ [LOAD] Erreur chargement demo shops:', error);
        } else {
          shops = data || [];
          console.log(`✅ [LOAD] ${shops.length} boutiques demo chargées`);
        }
      }

      // Si toujours aucune boutique, créer des boutiques de démonstration
      if (shops.length === 0) {
        console.log('[LOAD] Création de boutiques de démonstration');
        shops = [
          {
            id: 1,
            name: 'Boutique 1 - Démo',
            description: 'Boutique de démonstration avec paramètres d\'accès',
            logo_url: 'https://via.placeholder.com/100',
            banner_url: 'https://via.placeholder.com/400x200',
            category: 'fashion',
            status: 'approved',
            total_orders: 15,
            rating: 4.5,
            instagram_url: 'boutique1_demo',
            contact_phone: '+22501010101',
            created_at: new Date().toISOString(),
            user_id: 'demo-user-1'
          },
          {
            id: 2,
            name: 'Boutique 2 - Démo',
            description: 'Deuxième boutique de démonstration',
            logo_url: 'https://via.placeholder.com/100',
            banner_url: 'https://via.placeholder.com/400x200',
            category: 'electronics',
            status: 'approved',
            total_orders: 8,
            rating: 4.2,
            instagram_url: 'boutique2_demo',
            contact_phone: '+22502020202',
            created_at: new Date().toISOString(),
            user_id: 'demo-user-2'
          },
          {
            id: 3,
            name: 'Boutique 3 - Démo',
            description: 'Troisième boutique de démonstration',
            logo_url: 'https://via.placeholder.com/100',
            banner_url: 'https://via.placeholder.com/400x200',
            category: 'handicraft',
            status: 'pending',
            total_orders: 3,
            rating: 4.8,
            instagram_url: 'boutique3_demo',
            contact_phone: '+22503030303',
            created_at: new Date().toISOString(),
            user_id: 'demo-user-3'
          }
        ];
      }

      const transformedBoutiques = shops.map(shop => ({
        id: shop.id,
        name: shop.name,
        description: shop.description,
        logo: shop.logo_url || '',
        banner: shop.banner_url || '',
        primaryColor: '#FF6B35',
        secondaryColor: '#4CAF50',
        categories: shop.category ? [shop.category] : [],
        isActive: shop.status === 'approved',
        productsCount: shop.total_orders || 0,
        followers: 0,
        rating: shop.rating || 0,
        socialLinks: {
          instagram: shop.instagram_url || '',
          facebook: ''
        },
        createdAt: shop.created_at,
        status: shop.status,
        address: shop.address ? JSON.stringify(shop.address) : '',
        phone: shop.contact_phone,
        email: shop.contact_email,
        website: shop.website_url,
        city: shop.city,
        country: shop.country
      }));

      setBoutiques(transformedBoutiques);
      console.log(`✅ [LOAD] ${transformedBoutiques.length} boutiques chargées au total`);
      
    } catch (error) {
      console.error('❌ [LOAD] Erreur générale:', error);
      setAuthError(error.message);
      
      // En cas d'erreur, créer des boutiques de démonstration
      const demoBoutiques = [
        {
          id: 1,
          name: 'Boutique Démo 1',
          description: 'Boutique de démonstration',
          logo: 'https://via.placeholder.com/100',
          banner: 'https://via.placeholder.com/400x200',
          primaryColor: '#FF6B35',
          secondaryColor: '#4CAF50',
          categories: ['fashion'],
          isActive: true,
          productsCount: 15,
          followers: 25,
          rating: 4.5,
          socialLinks: { instagram: 'demo1', facebook: '' },
          createdAt: new Date().toISOString(),
          status: 'approved'
        }
      ];
      setBoutiques(demoBoutiques);
    } finally {
      setLoading(false);
    }
  };

  // Gestionnaire robuste de changement d'onglet
  const handleTabChange = useCallback((tabName, event = null) => {
    console.log(`🎯 [TAB CHANGE] Début changement vers: ${tabName}`);
    
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    // Forcer la mise à jour de l'état
    setActiveTab(tabName);
    
    // Réinitialiser les sélections selon l'onglet
    if (tabName === 'auth') {
      setSelectedBoutiqueForAuth(null);
    } else if (tabName === 'list') {
      setEditingBoutique(null);
      setShowForm(false);
    } else if (tabName === 'create') {
      // Rien de spécial pour create
    }
    
    console.log(`✅ [TAB CHANGE] Changement vers ${tabName} complété`);
  }, []);

  // Gestionnaire pour le bouton Accès & QR avec validation AMÉLIORÉE
  const handleAccessQR = useCallback((event) => {
    console.log('🔑 [ACCESS QR] Bouton Accès & QR cliqué');
    console.log(`📊 [ACCESS QR] Nombre de boutiques: ${boutiques.length}`);
    console.log(`👤 [ACCESS QR] Utilisateur: ${user ? user.email : 'Non connecté'}`);
    
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    // Validation modifiée - permettre l'accès même sans connexion
    if (!boutiques || boutiques.length === 0) {
      console.log('⚠️ [ACCESS QR] Aucune boutique disponible');
      alert('Aucune boutique disponible. Le système va créer des boutiques de démonstration.');
      return;
    }

    handleTabChange('auth', event);
    console.log('✅ [ACCESS QR] Navigation vers auth réussie');
  }, [boutiques, user, handleTabChange]);

  // Gestionnaire pour le bouton Créer AMÉLIORÉ
  const handleCreate = useCallback((event) => {
    console.log('➕ [CREATE] Bouton Créer cliqué');
    console.log(`👤 [CREATE] Utilisateur: ${user ? user.email : 'Non connecté'}`);
    
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    // MODIFICATION: Permettre la création même sans connexion
    if (!user) {
      console.log('⚠️ [CREATE] Mode demo: utilisateur non connecté');
      alert('Mode démonstration: vous pouvez créer des boutiques en mode demo');
    }

    handleTabChange('create', event);
    console.log('✅ [CREATE] Navigation vers create réussie');
  }, [user, handleTabChange]);

  // Gestionnaire pour le bouton Mes Boutiques
  const handleList = useCallback((event) => {
    console.log('🏪 [LIST] Bouton Mes Boutiques cliqué');
    
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    handleTabChange('list', event);
    console.log('✅ [LIST] Navigation vers list réussie');
  }, [handleTabChange]);

  // Effet pour déboguer les changements d'état
  useEffect(() => {
    console.log(`📊 [STATE] activeTab changé vers: ${activeTab}`);
  }, [activeTab]);

  useEffect(() => {
    loadBoutiques();
  }, [vendorId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('📝 [SUBMIT] Début soumission formulaire');
    
    try {
      if (!user) {
        console.log('⚠️ [SUBMIT] Mode demo: création de boutique demo');
        // En mode demo, créer une boutique localement
        const newBoutique = {
          id: Date.now(),
          name: formData.name,
          description: formData.description,
          logo: formData.logo,
          banner: formData.banner,
          primaryColor: formData.primaryColor,
          secondaryColor: formData.secondaryColor,
          categories: formData.categories,
          isActive: true,
          productsCount: 0,
          followers: 0,
          rating: 0,
          socialLinks: formData.socialLinks,
          createdAt: new Date().toISOString(),
          status: 'approved'
        };
        
        setBoutiques(prev => [newBoutique, ...prev]);
        alert('Boutique demo créée avec succès!');
        resetForm();
        return;
      }

      // Logique normale si connecté...
      const updateData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        logo_url: formData.logo,
        banner_url: formData.banner,
        category: formData.categories[0] || 'general',
        contact_phone: String(formData.phone || '').trim(),
        contact_email: user.email,
        website_url: formData.socialLinks.instagram ? `https://instagram.com/${formData.socialLinks.instagram.replace('@', '')}` : '',
        status: formData.isActive ? 'active' : 'inactive',
        updated_at: new Date().toISOString()
      };
      
      if (editingBoutique) {
        const { error } = await supabase
          .from('shops')
          .update(updateData)
          .eq('id', editingBoutique.id)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('shops')
          .insert({
            user_id: user.id,
            name: formData.name.trim(),
            slug: `${formData.name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-')}-${Date.now().toString(36)}`,
            description: formData.description.trim(),
            status: 'pending',
            is_verified: false
          })
          .select();
          
        if (error) throw error;
      }
      
      await loadBoutiques();
      resetForm();
      alert(editingBoutique ? 'Boutique mise à jour!' : 'Boutique créée!');
      console.log('✅ [SUBMIT] Processus complet terminé');
      
    } catch (error) {
      console.error('❌ [SUBMIT] Erreur générale:', error);
      alert(`Erreur: ${error.message}`);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      logo: '',
      banner: '',
      primaryColor: '#FF6B35',
      secondaryColor: '#4CAF50',
      categories: [],
      isActive: true,
      socialLinks: {
        instagram: '',
        facebook: ''
      }
    });
    setShowForm(false);
    setEditingBoutique(null);
    setActiveTab('list');
    console.log('🔄 [RESET] Formulaire réinitialisé');
  };

  const handleEdit = (boutique) => {
    console.log(`✏️ [EDIT] Edition boutique: ${boutique.name}`);
    setFormData(boutique);
    setEditingBoutique(boutique);
    setActiveTab('create');
  };

  const handleDelete = async (boutiqueId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette boutique ?')) {
      console.log(`🗑️ [DELETE] Suppression boutique: ${boutiqueId}`);
      
      try {
        if (!user) {
          // Mode demo: suppression locale
          setBoutiques(prev => prev.filter(b => b.id !== boutiqueId));
          alert('Boutique demo supprimée!');
          return;
        }

        const { error } = await supabase
          .from('shops')
          .delete()
          .eq('id', boutiqueId)
          .eq('user_id', user.id);

        if (error) throw error;

        await loadBoutiques();
        alert('Boutique supprimée!');
        console.log('✅ [DELETE] Suppression réussie');
        
      } catch (error) {
        console.error('❌ [DELETE] Erreur générale:', error);
        alert('Erreur lors de la suppression');
      }
    }
  };

  // Rendu principal avec gestion d'erreurs et mode démo
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-orange-50 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header moderne */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-500 to-green-600 bg-clip-text text-transparent mb-2">
                Mes Mini-Boutiques
              </h1>
              <p className="text-gray-600 dark:text-gray-300 text-lg">
                {user ? `Connecté: ${user.email}` : 'Mode démonstration - Toutes les boutiques visibles'}
              </p>
            </div>
            <button
              ref={createButtonRef}
              onClick={handleCreate}
              className="group bg-gradient-to-r from-orange-500 to-green-600 text-white px-6 py-3 rounded-xl font-medium hover:from-orange-600 hover:to-green-700 transition-all duration-300 flex items-center space-x-2 shadow-lg hover:shadow-xl"
            >
              <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
              <span>{user ? 'Créer une Boutique' : 'Créer (Mode Demo)'}</span>
            </button>
          </div>

          {/* Navigation par onglets - VERSION ULTIME */}
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
            <button
              ref={el => tabButtonsRef.current.list = el}
              onClick={handleList}
              className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 ${
                activeTab === 'list'
                  ? 'bg-white dark:bg-gray-700 text-orange-600 dark:text-orange-400 shadow-sm ring-2 ring-orange-500 ring-opacity-50'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <Store className="w-4 h-4 inline mr-2" />
              Mes Boutiques
            </button>
            <button
              ref={el => tabButtonsRef.current.create = el}
              onClick={handleCreate}
              className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 ${
                activeTab === 'create'
                  ? 'bg-white dark:bg-gray-700 text-orange-600 dark:text-orange-400 shadow-sm ring-2 ring-orange-500 ring-opacity-50'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <Plus className="w-4 h-4 inline mr-2" />
              Créer/Éditer
            </button>
            <button
              ref={el => tabButtonsRef.current.auth = el}
              onClick={handleAccessQR}
              className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 ${
                activeTab === 'auth'
                  ? 'bg-white dark:bg-gray-700 text-orange-600 dark:text-orange-400 shadow-sm ring-2 ring-orange-500 ring-opacity-50'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <Key className="w-4 h-4 inline mr-2" />
              Accès & QR
            </button>
          </div>
        </div>

        {/* Affichage d'état et débogage */}
        <div className="debug-info bg-gray-100 dark:bg-gray-800 p-4 rounded-lg mb-4 text-sm font-mono">
          <div className="text-gray-600 dark:text-gray-400">
            État actuel: <span className="font-bold text-orange-600">{activeTab}</span> | 
            Boutiques: <span className="font-bold text-green-600">{boutiques.length}</span> |
            Status: <span className="font-bold text-blue-600">{user ? 'Connecté' : 'Mode Demo'}</span> |
            Debug: <span className="font-bold text-purple-600">{new Date().toLocaleTimeString()}</span>
          </div>
          {authError && (
            <div className="text-red-500 mt-2">
              ⚠️ Erreur auth: {authError}
            </div>
          )}
        </div>

        {/* Indicateur de chargement */}
        {loading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Chargement des boutiques...</p>
          </div>
        )}

        {/* Contenu de l'onglet Liste */}
        {!loading && activeTab === 'list' && (
          <div className="animate-fade-in">
            {boutiques.length === 0 ? (
              <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-orange-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl">
                <Store className="w-20 h-20 text-gray-400 mx-auto mb-6" />
                <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-4">Aucune boutique trouvée</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-8">
                  {user ? 'Commencez par créer votre première boutique' : 'Le système va créer des boutiques de démonstration'}
                </p>
                <button
                  onClick={handleCreate}
                  className="bg-gradient-to-r from-orange-500 to-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-orange-600 hover:to-green-700 transition-all"
                >
                  {user ? 'Créer ma première boutique' : 'Créer une boutique demo'}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {boutiques.map((boutique) => (
                  <div key={boutique.id} className="group bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 dark:border-gray-700">
                    {/* Contenu de la carte */}
                    <div className="p-6">
                      <div className="flex items-center space-x-4 mb-4">
                        <img 
                          src={boutique.logo || 'https://via.placeholder.com/60'} 
                          alt={`${boutique.name} logo`}
                          className="w-16 h-16 rounded-xl object-cover border-3 border-white shadow-lg"
                        />
                        <div className="flex-1">
                          <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-1">
                            {boutique.name}
                          </h3>
                          <p className="text-gray-600 dark:text-gray-300 text-sm">
                            {boutique.description}
                          </p>
                        </div>
                      </div>

                      {/* Boutons d'action */}
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(boutique)}
                          className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-2 px-3 rounded-lg text-sm font-medium hover:from-blue-600 hover:to-blue-700 transition-all"
                        >
                          <Edit className="w-4 h-4 inline mr-1" />
                          Modifier
                        </button>
                        <button
                          onClick={() => {
                            setSelectedBoutiqueForAuth(boutique);
                            handleTabChange('auth');
                          }}
                          className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white py-2 px-3 rounded-lg text-sm font-medium hover:from-purple-600 hover:to-indigo-600 transition-all"
                          title="Accès et QR Code"
                        >
                          <Key className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Contenu de l'onglet Créer */}
        {!loading && activeTab === 'create' && (
          <div className="animate-fade-in">
            <div className="max-w-4xl mx-auto">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-green-600 bg-clip-text text-transparent">
                    {editingBoutique ? 'Modifier la Boutique' : 'Créer une Mini-Boutique'}
                  </h2>
                  <button
                    onClick={resetForm}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl transition-colors"
                  >
                    ×
                  </button>
                </div>

                {!user && (
                  <div className="bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-400 dark:border-yellow-600 rounded-lg p-4 mb-6">
                    <p className="text-yellow-800 dark:text-yellow-300 text-sm">
                      ⚠️ Mode démonstration: Les boutiques créées seront locales et temporaires.
                    </p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* Informations de base */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                        Nom de la Boutique *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                        placeholder="Ex: Boutique Élégance Africaine"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                      Description *
                    </label>
                    <textarea
                      required
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                      rows="3"
                      placeholder="Décrivez votre boutique et ses spécialités..."
                    />
                  </div>

                  {/* Boutons d'action */}
                  <div className="flex space-x-4">
                    <button
                      type="submit"
                      className="flex-1 bg-gradient-to-r from-orange-500 to-green-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-orange-600 hover:to-green-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                    >
                      {editingBoutique ? 'Mettre à jour' : 'Créer la Boutique'}
                    </button>
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:border-orange-500 hover:text-orange-600 transition-all"
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Contenu de l'onglet Authentification */}
        {!loading && activeTab === 'auth' && (
          <div className="animate-fade-in">
            <div className="max-w-6xl mx-auto">
              {selectedBoutiqueForAuth ? (
                <div className="animate-slide-in">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center space-x-3">
                      <Key className="w-6 h-6 text-orange-500" />
                      <span>Paramètres d'accès - {selectedBoutiqueForAuth.name}</span>
                    </h3>
                    <button
                      onClick={() => setSelectedBoutiqueForAuth(null)}
                      className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                    >
                      <Store className="w-4 h-4" />
                      <span>Voir toutes les boutiques</span>
                    </button>
                  </div>
                  <VendorAuthSystem boutique={selectedBoutiqueForAuth} />
                </div>
              ) : (
                <div>
                  <div className="text-center mb-8">
                    <Key className="w-16 h-16 text-orange-500 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Gérez l'accès à vos boutiques</h3>
                    <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                      {boutiques.length === 0 
                        ? 'Aucune boutique disponible pour afficher les paramètres d\'accès'
                        : 'Cliquez sur une boutique pour voir ses paramètres d\'accès uniques (login, mot de passe, QR code)'
                      }
                    </p>
                  </div>
                  
                  {boutiques.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {boutiques.map((boutique) => (
                        <div
                          key={boutique.id}
                          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer group"
                          onClick={() => setSelectedBoutiqueForAuth(boutique)}
                        >
                          <div className="flex items-center space-x-4 mb-4">
                            <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-green-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                              <Store className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-orange-600 transition-colors">{boutique.name}</h3>
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                boutique.status === 'approved' 
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                                  : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                              }`}>
                                {boutique.status === 'approved' ? 'Approuvée' : 'En attente'}
                              </span>
                            </div>
                          </div>
                          
                          <div className="space-y-3 mb-6">
                            <div className="flex items-center space-x-3 text-sm">
                              <QrCode className="w-5 h-5 text-orange-500" />
                              <span className="text-gray-600 dark:text-gray-400">QR Code disponible</span>
                            </div>
                            <div className="flex items-center space-x-3 text-sm">
                              <Key className="w-5 h-5 text-green-500" />
                              <span className="text-gray-600 dark:text-gray-400">Accès sécurisé unique</span>
                            </div>
                            <div className="flex items-center space-x-3 text-sm">
                              <Link className="w-5 h-5 text-blue-500" />
                              <span className="text-gray-600 dark:text-gray-400">URL personnalisée</span>
                            </div>
                          </div>
                          
                          <button className="w-full bg-gradient-to-r from-orange-500 to-green-600 text-white py-3 px-4 rounded-lg font-medium hover:from-orange-600 hover:to-green-700 transition-all duration-300 shadow-lg group-hover:shadow-xl">
                            Voir les paramètres d'accès
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Message si aucune boutique en mode auth */}
        {!loading && activeTab === 'auth' && boutiques.length === 0 && (
          <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-orange-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl">
            <Key className="w-20 h-20 text-gray-400 mx-auto mb-6" />
            <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-4">Aucune boutique disponible</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              Aucune boutique à afficher pour les paramètres d'accès
            </p>
            <button
              onClick={handleCreate}
              className="bg-gradient-to-r from-orange-500 to-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-orange-600 hover:to-green-700 transition-all"
            >
              Créer une boutique
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MiniBoutiqueManagerModern;
