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

  // Gestionnaire pour le bouton Accès & QR avec validation
  const handleAccessQR = useCallback((event) => {
    console.log('🔑 [ACCESS QR] Bouton Accès & QR cliqué');
    
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    // Validation de sécurité
    if (!boutiques || boutiques.length === 0) {
      console.log('⚠️ [ACCESS QR] Aucune boutique disponible');
      alert('Vous devez d\'abord créer une boutique pour accéder aux paramètres');
      return;
    }

    handleTabChange('auth', event);
    console.log('✅ [ACCESS QR] Navigation vers auth réussie');
  }, [boutiques, handleTabChange]);

  // Gestionnaire pour le bouton Créer
  const handleCreate = useCallback((event) => {
    console.log('➕ [CREATE] Bouton Créer cliqué');
    
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    handleTabChange('create', event);
    console.log('✅ [CREATE] Navigation vers create réussie');
  }, [handleTabChange]);

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

  const loadBoutiques = async () => {
    try {
      // Vérifier d'abord le mode test
      const isTestMode = localStorage.getItem('test_mode') === 'true'
      const testUserData = localStorage.getItem('test_user')
      
      let userId = null
      
      if (isTestMode && testUserData) {
        // Mode test - FORCER l'utilisation d'un UUID valide PostgreSQL
        userId = '550e8400-e29b-41d4-a716-446655440000'
        console.log('🧪 [LOAD] Mode test forcé, UUID:', userId)
        
        // Pour le mode test, utiliser des données simulées si la base de données échoue
        try {
          const { data: shops, error } = await supabase
            .from('shops')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })

          if (error) {
            console.log('🧪 [LOAD] Utilisation de données simulées pour le test');
            
            // Charger les boutiques simulées depuis le localStorage
            const savedMockBoutiques = JSON.parse(localStorage.getItem('mock_boutiques') || '[]');
            
            // Données simulées par défaut + données sauvegardées
            const defaultMockShops = [
              {
                id: 'test-shop-1',
                user_id: userId,
                name: 'Boutique Test DAN',
                description: 'Vente produits divers',
                status: 'active',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                logo_url: '',
                banner_url: '',
                category: 'general',
                contact_phone: '+221771234567',
                contact_email: 'test@vendeur.com',
                website_url: '',
                is_verified: true,
                rating: 0,
                total_orders: 0
              }
            ];
            
            // Combiner les données par défaut et les données sauvegardées
            const allMockShops = [...defaultMockShops, ...savedMockBoutiques];
            
            const transformedBoutiques = allMockShops.map(shop => ({
              id: shop.id,
              name: shop.name,
              description: shop.description,
              logo: shop.logo_url,
              banner: shop.banner_url,
              status: shop.status,
              isActive: shop.status === 'active',
              isVerified: shop.is_verified,
              categories: [shop.category],
              createdAt: shop.created_at,
              updatedAt: shop.updated_at,
              socialLinks: {
                instagram: '',
                facebook: ''
              },
              colors: {
                primary: '#FF6B35',
                secondary: '#4CAF50'
              }
            }));
            
            setBoutiques(transformedBoutiques);
            return;
          }
          
          // Si la requête réussit, utiliser les vraies données
          const transformedBoutiques = shops.map(shop => ({
            id: shop.id,
            name: shop.name,
            description: shop.description,
            logo: shop.logo_url,
            banner: shop.banner_url,
            status: shop.status,
            isActive: shop.status === 'active',
            isVerified: shop.is_verified,
            categories: [shop.category],
            createdAt: shop.created_at,
            updatedAt: shop.updated_at,
            socialLinks: {
              instagram: shop.website_url ? shop.website_url.replace('https://instagram.com/', '') : '',
              facebook: ''
            },
            colors: {
              primary: '#FF6B35',
              secondary: '#4CAF50'
            }
          }));
          
          setBoutiques(transformedBoutiques);
          console.log(`✅ [LOAD] ${transformedBoutiques.length} boutiques chargées`);
          return;
          
        } catch (dbError) {
          console.log('🧪 [LOAD] Erreur base de données, utilisation données simulées');
          // Utiliser les données simulées en cas d'erreur
          const mockShops = [
            {
              id: 'test-shop-1',
              user_id: userId,
              name: 'Boutique Test DAN',
              description: 'Vente produits divers',
              status: 'active',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              logo_url: '',
              banner_url: '',
              category: 'general',
              contact_phone: '+221771234567',
              contact_email: 'test@vendeur.com',
              website_url: '',
              is_verified: true
            }
          ];
          
          const transformedBoutiques = mockShops.map(shop => ({
            id: shop.id,
            name: shop.name,
            description: shop.description,
            logo: shop.logo_url,
            banner: shop.banner_url,
            status: shop.status,
            isActive: shop.status === 'active',
            isVerified: shop.is_verified,
            categories: [shop.category],
            createdAt: shop.created_at,
            updatedAt: shop.updated_at,
            socialLinks: {
              instagram: '',
              facebook: ''
            },
            colors: {
              primary: '#FF6B35',
              secondary: '#4CAF50'
            }
          }));
          
          setBoutiques(transformedBoutiques);
          return;
        }
      } else {
        // Mode normal - utiliser Supabase
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          console.error('❌ [LOAD] Utilisateur non connecté')
          return
        }
        
        userId = user.id
      }

      const { data: shops, error } = await supabase
        .from('shops')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ [LOAD] Erreur lors du chargement:', error);
        return;
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
          facebook: shop.facebook_url || ''
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
      console.log(`✅ [LOAD] ${transformedBoutiques.length} boutiques chargées`);
    } catch (error) {
      console.error('❌ [LOAD] Erreur générale:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('📝 [SUBMIT] Début soumission formulaire');
    
    try {
      // Vérifier d'abord le mode test
      const isTestMode = localStorage.getItem('test_mode') === 'true'
      const testUserData = localStorage.getItem('test_user')
      
      let userId = null
      let userEmail = null
      
      if (isTestMode && testUserData) {
        // Mode test - FORCER l'utilisation d'un UUID valide PostgreSQL
        userId = '550e8400-e29b-41d4-a716-446655440000'
        userEmail = 'test@vendeur.com'
        console.log('🧪 [SUBMIT] Mode test forcé, UUID:', userId)
      } else {
        // Mode normal - utiliser Supabase
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          alert('Vous devez être connecté')
          return
        }
        
        userId = user.id
        userEmail = user.email
      }

      if (editingBoutique) {
        const updateData = {
          name: formData.name.trim(),
          description: formData.description.trim(),
          logo_url: formData.logo,
          banner_url: formData.banner,
          category: formData.categories[0] || 'general',
          contact_phone: String(formData.phone || '').trim(),
          contact_email: userEmail,
          website_url: formData.socialLinks.instagram ? `https://instagram.com/${formData.socialLinks.instagram.replace('@', '')}` : '',
          status: formData.isActive ? 'active' : 'inactive',
          updated_at: new Date().toISOString()
        };
        
        const { error } = await supabase
          .from('shops')
          .update(updateData)
          .eq('id', editingBoutique.id)
          .eq('user_id', userId);

        if (error) {
          console.error('❌ [SUBMIT] Erreur mise à jour:', error);
          alert(`Erreur: ${error.message}`);
          return;
        }
        
        console.log('✅ [SUBMIT] Mise à jour réussie');
      } else {
        const baseSlug = formData.name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
        const uniqueSlug = `${baseSlug}-${Date.now().toString(36)}`;
        
        const { data, error } = await supabase
          .from('shops')
          .insert({
            user_id: userId,
            name: formData.name.trim(),
            slug: uniqueSlug,
            description: formData.description.trim(),
            status: 'pending',
            is_verified: false
          })
          .select();
          
        if (error) {
          console.error('❌ [SUBMIT] Erreur création:', error);
          
          // Vérifier si c'est une erreur UUID et corriger automatiquement
          if (error.message.includes('invalid input syntax for type uuid') && isTestMode) {
            console.log('🔄 [SUBMIT] Tentative de correction automatique UUID');
            
            // Réessayer avec un UUID valide forcé
            const { data: retryData, error: retryError } = await supabase
              .from('shops')
              .insert({
                user_id: '550e8400-e29b-41d4-a716-446655440000', // UUID valide forcé
                name: formData.name.trim(),
                slug: uniqueSlug,
                description: formData.description.trim(),
                status: 'pending',
                is_verified: false
              })
              .select();
              
            if (retryError) {
              console.error('❌ [SUBMIT] Échec correction:', retryError);
              
              // Solution de secours : créer une boutique simulée localement
              console.log('🔄 [SUBMIT] Utilisation du mode simulation');
              const mockBoutique = {
                id: 'mock-' + Date.now(),
                user_id: '550e8400-e29b-41d4-a716-446655440000',
                name: formData.name.trim(),
                slug: uniqueSlug,
                description: formData.description.trim(),
                status: 'approved', // Approuvé directement pour les tests
                is_verified: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                logo_url: formData.logo || null,
                banner_url: formData.banner || null,
                primary_color: formData.primaryColor,
                secondary_color: formData.secondaryColor,
                categories: formData.categories,
                isActive: formData.isActive,
                social_links: formData.socialLinks,
                total_sales: 0,
                total_orders: 0,
                rating: 0,
                review_count: 0
              };
              
              // Stocker dans le localStorage pour persistance
              const existingMockBoutiques = JSON.parse(localStorage.getItem('mock_boutiques') || '[]');
              existingMockBoutiques.push(mockBoutique);
              localStorage.setItem('mock_boutiques', JSON.stringify(existingMockBoutiques));

              try {
                const existingDemo = JSON.parse(localStorage.getItem('demo_shops') || '[]');
                const list = Array.isArray(existingDemo) ? existingDemo : [];
                const demoEntry = {
                  id: mockBoutique.id,
                  name: mockBoutique.name,
                  slug: mockBoutique.slug,
                  category: (Array.isArray(mockBoutique.categories) ? mockBoutique.categories[0] : '') || 'general',
                  primaryColor: mockBoutique.primary_color || '#FF6B35',
                  secondaryColor: mockBoutique.secondary_color || '#4CAF50',
                  logoDataUrl: mockBoutique.logo_url || '',
                  ownerEmail: userEmail,
                  approvalStatus: 'approved',
                  sourceVendorId: mockBoutique.id,
                };
                const others = list.filter((s) => String(s?.slug || '') !== String(demoEntry.slug || ''));
                localStorage.setItem('demo_shops', JSON.stringify([demoEntry, ...others].slice(0, 200)));
                window.dispatchEvent(new Event('demo-shops-updated'));
              } catch {
              }
              
              alert('Boutique créée en mode test ! (Données locales)');
              
              // Simuler le succès et continuer
              console.log('✅ [SUBMIT] Simulation réussie');
              await loadBoutiques();
              resetForm();
              setShowForm(false);
              return;
            }
            
            console.log('✅ [SUBMIT] Correction automatique réussie');
            // Continuer avec les données corrigées
          } else {
            alert(`Erreur: ${error.message}`);
            return;
          }
        }
        
        console.log('✅ [SUBMIT] Création réussie');
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
        // Vérifier d'abord le mode test
        const isTestMode = localStorage.getItem('test_mode') === 'true'
        const testUserData = localStorage.getItem('test_user')
        
        let userId = null
        
        if (isTestMode && testUserData) {
          // Mode test - utiliser l'utilisateur de test
          const testUser = JSON.parse(testUserData)
          // FORCER l'utilisation d'un UUID valide PostgreSQL
          userId = '550e8400-e29b-41d4-a716-446655440000'
          console.log('🧪 [DELETE] Mode test activé, UUID forcé:', userId)
        } else {
          // Mode normal - utiliser Supabase
          const { data: { user } } = await supabase.auth.getUser()
          
          if (!user) {
            alert('Vous devez être connecté')
            return
          }
          
          userId = user.id
        }

        const { error } = await supabase
          .from('shops')
          .delete()
          .eq('id', boutiqueId)
          .eq('user_id', userId);

        if (error) {
          console.error('❌ [DELETE] Erreur:', error);
          alert('Erreur lors de la suppression');
          return;
        }

        await loadBoutiques();
        alert('Boutique supprimée!');
        console.log('✅ [DELETE] Suppression réussie');
        
      } catch (error) {
        console.error('❌ [DELETE] Erreur générale:', error);
        alert('Erreur lors de la suppression');
      }
    }
  };

  // Rendu principal avec gestion d'erreurs
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
                Créez et gérez vos boutiques spécialisées avec style
              </p>
            </div>
            <button
              ref={createButtonRef}
              onClick={handleCreate}
              className="group bg-gradient-to-r from-orange-500 to-green-600 text-white px-6 py-3 rounded-xl font-medium hover:from-orange-600 hover:to-green-700 transition-all duration-300 flex items-center space-x-2 shadow-lg hover:shadow-xl"
            >
              <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
              <span>Créer une Boutique</span>
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

        {/* Affichage conditionnel des onglets avec débogage */}
        <div className="debug-info bg-gray-100 dark:bg-gray-800 p-4 rounded-lg mb-4 text-sm font-mono">
          <div className="text-gray-600 dark:text-gray-400">
            État actuel: <span className="font-bold text-orange-600">{activeTab}</span> | 
            Boutiques: <span className="font-bold text-green-600">{boutiques.length}</span> |
            Debug: <span className="font-bold text-blue-600">{new Date().toLocaleTimeString()}</span>
          </div>
        </div>

        {/* Contenu de l'onglet Liste */}
        {activeTab === 'list' && (
          <div className="animate-fade-in">
            {boutiques.length === 0 ? (
              <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-orange-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl">
                <Store className="w-20 h-20 text-gray-400 mx-auto mb-6" />
                <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-4">Aucune boutique</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-8">Commencez par créer votre première boutique</p>
                <button
                  onClick={handleCreate}
                  className="bg-gradient-to-r from-orange-500 to-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-orange-600 hover:to-green-700 transition-all"
                >
                  Créer ma première boutique
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
        {activeTab === 'create' && (
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
        {activeTab === 'auth' && (
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
                      Cliquez sur une boutique pour voir ses paramètres d'accès uniques
                    </p>
                  </div>
                  
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
                </div>
              )}
            </div>
          </div>
        )}

        {/* Message si aucune boutique en mode auth */}
        {activeTab === 'auth' && boutiques.length === 0 && (
          <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-orange-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl">
            <Key className="w-20 h-20 text-gray-400 mx-auto mb-6" />
            <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-4">Aucune boutique disponible</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-8">Vous devez d'abord créer une boutique</p>
            <button
              onClick={handleCreate}
              className="bg-gradient-to-r from-orange-500 to-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-orange-600 hover:to-green-700 transition-all"
            >
              Créer ma première boutique
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MiniBoutiqueManagerModern;
