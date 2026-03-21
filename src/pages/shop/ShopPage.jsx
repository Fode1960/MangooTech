import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Store, MapPin, Star, Package, Calendar, Shield, Truck, Heart, Share2, MessageCircle, Users, ShoppingCart } from 'lucide-react';
import VendorProductManager from '../../components/VendorProductManager';

const ShopPage = () => {
  const { shopSlug } = useParams();
  const navigate = useNavigate();
  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('products');
  const [isFollowing, setIsFollowing] = useState(false);
  const [canManageProducts, setCanManageProducts] = useState(false);
  const [showVendorManager, setShowVendorManager] = useState(false);
  const [shopOwnerEmail, setShopOwnerEmail] = useState('');
  const [showVendorMode, setShowVendorMode] = useState(false);
  const [vendorEmail, setVendorEmail] = useState('');
  const [pendingMismatch, setPendingMismatch] = useState(false);

  const maskEmail = (value) => {
    const email = String(value || '').trim();
    const [local, domain] = email.split('@');
    if (!local || !domain) return '';
    if (local.length <= 2) return `${local[0] || '*'}*@${domain}`;
    return `${local[0]}${'*'.repeat(Math.min(6, local.length - 2))}${local[local.length - 1]}@${domain}`;
  };

  // Données de démonstration pour la boutique
  const demoShop = {
    id: '1',
    name: 'Boutique Demo',
    slug: 'boutique-demo',
    description: 'Une boutique de démonstration pour tester le marketplace avec des produits de qualité',
    business_type: 'individual',
    status: 'approved',
    contact_email: 'demo@example.com',
    address: { city: 'Paris', country: 'France' },
    commission_rate: 5.00,
    review_count: 42,
    followers_count: 156,
    total_sales: 234,
    total_revenue: 12580.50,
    created_at: '2024-01-01T00:00:00Z',
    policies: {
      shipping: 'Livraison gratuite en France métropolitaine',
      returns: 'Retours acceptés sous 30 jours',
      warranty: 'Garantie 2 ans sur tous les produits'
    }
  };

  // Données de démonstration pour les produits
  const demoProducts = [
    {
      id: '1',
      name: 'Smartphone Premium',
      slug: 'smartphone-premium',
      description: 'Un smartphone haut de gamme avec toutes les dernières fonctionnalités',
      short_description: 'Smartphone haut de gamme',
      price: 599.99,
      status: 'active',
      featured: true,
      images: [{ url: 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=400', alt_text: 'Smartphone Premium' }],
      category: { name: 'Électronique', slug: 'electronique' },
      average_rating: 4.5,
      review_count: 12,
      sales_count: 45,
      variants: [{ inventory_quantity: 15 }]
    },
    {
      id: '2',
      name: 'T-shirt en Coton Bio',
      slug: 't-shirt-coton-bio',
      description: 'T-shirt confortable en coton biologique',
      short_description: 'T-shirt écologique',
      price: 29.99,
      status: 'active',
      featured: false,
      images: [{ url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400', alt_text: 'T-shirt Bio' }],
      category: { name: 'Mode', slug: 'mode' },
      average_rating: 4.2,
      review_count: 8,
      sales_count: 67,
      variants: [{ inventory_quantity: 50 }]
    },
    {
      id: '3',
      name: 'Lampe Design LED',
      slug: 'lampe-design-led',
      description: 'Lampe moderne avec technologie LED',
      short_description: 'Éclairage moderne',
      price: 89.99,
      status: 'active',
      featured: true,
      images: [{ url: 'https://images.unsplash.com/photo-1565636192335-f2e4b8f9c0a0?w=400', alt_text: 'Lampe LED' }],
      category: { name: 'Maison', slug: 'maison' },
      average_rating: 4.7,
      review_count: 15,
      sales_count: 23,
      variants: [{ inventory_quantity: 8 }]
    },
    {
      id: '4',
      name: 'Chaussures de Running',
      slug: 'chaussures-running',
      description: 'Chaussures de course professionnelles',
      short_description: 'Chaussures sport',
      price: 129.99,
      status: 'active',
      featured: false,
      images: [{ url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400', alt_text: 'Chaussures Running' }],
      category: { name: 'Sport', slug: 'sport' },
      average_rating: 4.3,
      review_count: 20,
      sales_count: 89,
      variants: [{ inventory_quantity: 25 }]
    }
  ];

  useEffect(() => {
    loadShopData();
  }, [shopSlug]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('followed_shops');
      const followed = raw ? JSON.parse(raw) : [];
      if (Array.isArray(followed)) {
        setIsFollowing(followed.includes(shopSlug));
      }
    } catch {
      setIsFollowing(false);
    }
  }, [shopSlug]);

  const loadShopData = async () => {
    try {
      setLoading(true);
      
      // Si le shopSlug est une route ShopApp, ne pas traiter comme une boutique
      if (['create', 'products', 'dashboard'].includes(shopSlug)) {
        setError('Cette page n\'est pas une boutique');
        setLoading(false);
        return;
      }

      const localShop = (() => {
        try {
          const raw = localStorage.getItem('demo_shops');
          const shops = raw ? JSON.parse(raw) : [];
          if (!Array.isArray(shops)) return null;
          return shops.find((s) => s?.slug === shopSlug) || null;
        } catch {
          return null;
        }
      })();

      const localPlusVendor = (() => {
        const slugify = (value) => {
          return String(value || '')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
        };
        try {
          const rawLegacy = localStorage.getItem('mangoo_vendors');
          const legacyParsed = rawLegacy ? JSON.parse(rawLegacy) : [];
          const legacy = Array.isArray(legacyParsed) ? legacyParsed : [];
          const rawCustom = localStorage.getItem('mangoo_custom_vendors');
          const customParsed = rawCustom ? JSON.parse(rawCustom) : [];
          const custom = Array.isArray(customParsed) ? customParsed : [];
          const list = [...legacy, ...custom];

          return list.find((v) => {
            const kind = String(v?.kind || 'shop').trim().toLowerCase();
            if (kind !== 'shop') return false;
            const id = String(v?.id ?? '').trim();
            const name = String(v?.name || '').trim();
            if (!id || !name) return false;
            const base = slugify(name) || `boutique-${id}`;
            const expected = `${base}-${id}`;
            return expected === shopSlug;
          }) || null;
        } catch {
          return null;
        }
      })();

      const currentUser = (() => {
        try {
          const raw = localStorage.getItem('mangoo-current-user');
          return raw ? JSON.parse(raw) : null;
        } catch {
          return null;
        }
      })();

      if (localShop) {
        const approvalStatus = String(localShop?.approvalStatus || 'pending');
        const localProducts = (() => {
          try {
            const raw = localStorage.getItem('demo_products');
            const map = raw ? JSON.parse(raw) : {};
            const list = map && typeof map === 'object' ? map[shopSlug] : [];
            return Array.isArray(list) ? list : [];
          } catch {
            return [];
          }
        })();

        const primary = localShop.primaryColor || '#F97316';
        const secondary = localShop.secondaryColor || '#FBBF24';

        const ownerEmail = String(localShop?.ownerEmail || '').trim().toLowerCase();
        const currentEmail = String(currentUser?.email || '').trim().toLowerCase();
        setShopOwnerEmail(ownerEmail);
        setCanManageProducts(currentUser?.role === 'vendor' && Boolean(currentEmail) && Boolean(ownerEmail) && currentEmail === ownerEmail);

        const isOwner = currentUser?.role === 'vendor' && Boolean(currentEmail) && Boolean(ownerEmail) && currentEmail === ownerEmail;
        const isAdmin = currentUser?.role === 'admin';
        if (approvalStatus !== 'approved' && !isOwner && !isAdmin) {
          setError('Boutique en attente d’approbation');
          setLoading(false);
          return;
        }

        setShop({
          ...demoShop,
          id: localShop.id || demoShop.id,
          name: localShop.name || demoShop.name,
          slug: localShop.slug || demoShop.slug,
          description: localShop.description || demoShop.description,
          contact_email: localShop.ownerEmail || demoShop.contact_email,
          primaryColor: primary,
          secondaryColor: secondary,
          logoDataUrl: localShop.logoDataUrl || ''
        });
        setProducts(localProducts);
        setError(null);
        setLoading(false);
        return;
      }

      if (localPlusVendor) {
        const normalizeCategory = (raw) => {
          const c = String(raw || '').trim().toLowerCase();
          if (!c) return 'general';
          if (c.includes('épicer') || c.includes('epicer') || c.includes('vivre') || c.includes('aliment') || c.includes('food')) return 'food';
          if (c.includes('tech') || c.includes('elect') || c.includes('teleph') || c.includes('téléph') || c.includes('electron')) return 'tech';
          if (c.includes('mode') || c.includes('fashion') || c.includes('vêt') || c.includes('vet') || c.includes('tailleur')) return 'fashion';
          if (c.includes('beaut') || c.includes('cosm')) return 'beauty';
          if (c.includes('maison') || c.includes('home')) return 'home';
          if (c.includes('service') || c.includes('métier') || c.includes('metier')) return 'services';
          return 'general';
        };

        const localProducts = (() => {
          try {
            const raw = localStorage.getItem('demo_products');
            const map = raw ? JSON.parse(raw) : {};
            const list = map && typeof map === 'object' ? map[shopSlug] : [];
            return Array.isArray(list) ? list : [];
          } catch {
            return [];
          }
        })();

        const description = String(localPlusVendor?.voicePitch || '').trim()
          || `Bienvenue dans ma nouvelle boutique ${String(localPlusVendor?.name || 'Boutique')} ! Venez découvrir mes produits.`;

        setShop({
          ...demoShop,
          id: `localplus-${String(localPlusVendor?.id ?? shopSlug)}`,
          name: String(localPlusVendor?.name || demoShop.name),
          slug: shopSlug,
          description,
          category: normalizeCategory(localPlusVendor?.category),
          status: 'approved',
          contact_email: '',
          address: { city: 'Douala', country: 'Cameroun' },
          primaryColor: '#0EA5E9',
          secondaryColor: '#38BDF8',
          review_count: 0,
          followers_count: 0,
          total_sales: 0,
          total_revenue: 0,
          created_at: new Date().toISOString(),
          logoDataUrl: ''
        });
        setProducts(localProducts);
        setCanManageProducts(false);
        setShopOwnerEmail('');
        setError(null);
        setLoading(false);
        return;
      }

      if (shopSlug === 'boutique-demo') {
        const extraProducts = (() => {
          try {
            const raw = localStorage.getItem('demo_products');
            const map = raw ? JSON.parse(raw) : {};
            const list = map && typeof map === 'object' ? map[shopSlug] : [];
            return Array.isArray(list) ? list : [];
          } catch {
            return [];
          }
        })();
        setShop(demoShop);
        setProducts(extraProducts.length ? extraProducts : demoProducts);
        setCanManageProducts(false);
        setShopOwnerEmail('');
        setError(null);
        setLoading(false);
        return;
      }

      setError('Boutique non trouvée');
      setLoading(false);
      
    } catch (err) {
      setError(err.message || 'Erreur lors du chargement de la boutique');
      setLoading(false);
    }
  };

  const activateVendorMode = () => {
    const owner = String(shopOwnerEmail || '').trim().toLowerCase();
    const provided = String(vendorEmail || '').trim().toLowerCase();
    if (!owner) {
      toast.error('Cette boutique n’est pas associée à un compte vendeur (démo).');
      return;
    }
    if (!provided) {
      toast.error('Entrez votre email vendeur.');
      return;
    }
    if (provided !== owner) {
      setPendingMismatch(true);
      toast.error(`Email vendeur non reconnu. Email attendu: ${maskEmail(owner)}`);
      return;
    }
    const userData = { role: 'vendor', name: 'Vendeur', avatar: '🏪', email: provided };
    try {
      localStorage.setItem('mangoo-current-user', JSON.stringify(userData));
    } catch {
      // ignore
    }
    setCanManageProducts(true);
    setShowVendorMode(false);
    setVendorEmail('');
    setShowVendorManager(true);
    toast.success('Mode vendeur activé');
  };

  const claimShopForEmail = () => {
    const provided = String(vendorEmail || '').trim().toLowerCase();
    if (!provided) {
      toast.error('Entrez votre email vendeur.');
      return;
    }
    try {
      const raw = localStorage.getItem('demo_shops');
      const shops = raw ? JSON.parse(raw) : [];
      const list = Array.isArray(shops) ? shops : [];
      const next = list.map((s) => (s?.slug === shopSlug ? { ...s, ownerEmail: provided } : s));
      localStorage.setItem('demo_shops', JSON.stringify(next));
      window.dispatchEvent(new Event('demo-shops-updated'));
      setShopOwnerEmail(provided);
      setPendingMismatch(false);
      toast.success('Boutique associée à cet email (démo)');
    } catch {
      toast.error('Impossible de modifier la boutique (démo).');
    }
  };

  useEffect(() => {
    const reloadProducts = () => {
      try {
        const raw = localStorage.getItem('demo_products');
        const map = raw ? JSON.parse(raw) : {};
        const list = map && typeof map === 'object' ? map[shopSlug] : [];
        if (Array.isArray(list)) {
          setProducts(list);
        }
      } catch {
        // ignore
      }
    };

    const onUpdated = () => reloadProducts();
    window.addEventListener('demo_products_updated', onUpdated);
    return () => window.removeEventListener('demo_products_updated', onUpdated);
  }, [shopSlug]);

  const toggleFollow = () => {
    const slug = shop?.slug || shopSlug;
    if (!slug) {
      toast.error('Boutique invalide');
      return;
    }

    setIsFollowing((prev) => {
      const nextValue = !prev;
      try {
        const raw = localStorage.getItem('followed_shops');
        const followed = raw ? JSON.parse(raw) : [];
        const list = Array.isArray(followed) ? followed : [];
        const next = nextValue
          ? Array.from(new Set([...list, slug]))
          : list.filter((s) => s !== slug);
        localStorage.setItem('followed_shops', JSON.stringify(next));
      } catch {
        try {
          localStorage.setItem('followed_shops', JSON.stringify(nextValue ? [slug] : []));
        } catch {
          toast.error('Impossible d’enregistrer le suivi (stockage local)');
        }
      }

      setShop((current) => {
        if (!current) return current;
        const currentCount = Number(current.followers_count || 0);
        const updatedCount = nextValue ? currentCount + 1 : Math.max(0, currentCount - 1);
        return { ...current, followers_count: updatedCount };
      });

      toast.success(nextValue ? 'Boutique suivie' : 'Suivi retiré');
      return nextValue;
    });
  };

  const contactShop = () => {
    const email = shop?.contact_email;
    if (!email) {
      toast.error('Email de contact indisponible');
      return;
    }
    const subject = encodeURIComponent(`Contact boutique: ${shop?.name || ''}`);
    const body = encodeURIComponent('Bonjour,\n\nJe souhaite avoir plus d’informations sur vos produits.\n');
    const url = `mailto:${email}?subject=${subject}&body=${body}`;
    toast.info('Ouverture de votre application email…');
    window.location.href = url;
  };

  const shareShop = () => {
    if (navigator.share) {
      navigator.share({
        title: shop.name,
        text: shop.description,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Lien copié dans le presse-papiers');
    }
  };

  const backToAllShops = () => {
    try {
      localStorage.setItem('mangoo-last-view', 'shops');
    } catch {
      // ignore
    }
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen py-8">
        <div className="container">
          <div className="text-center">
            <div className="spinner w-12 h-12 mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement de la boutique...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen py-8">
        <div className="container">
          <div className="max-w-md mx-auto">
            <div className="card text-center">
              <div className="card-body">
                <Store className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Erreur</h1>
                <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
                <div className="space-y-3">
                  <Link
                    to="/shop/create"
                    className="btn-primary w-full"
                  >
                    Créer ma boutique
                  </Link>
                  <Link
                    to="/marketplace"
                    className="btn-secondary w-full"
                  >
                    Retour au marketplace
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="min-h-screen py-8">
        <div className="container">
          <div className="max-w-md mx-auto">
            <div className="card text-center">
              <div className="card-body">
                <Store className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Boutique non trouvée</h1>
                <p className="text-gray-600 dark:text-gray-400 mb-6">La boutique que vous recherchez n&apos;existe pas.</p>
                <div className="space-y-3">
                  <Link
                    to="/shop/create"
                    className="btn-primary w-full"
                  >
                    Créer ma boutique
                  </Link>
                  <Link
                    to="/marketplace"
                    className="btn-secondary w-full"
                  >
                    Retour au marketplace
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Shop Header - Style conforme */}
      <section
        className="relative overflow-hidden pt-24 pb-16 lg:pt-32 lg:pb-24"
        style={{
          background: `linear-gradient(135deg, ${shop.primaryColor || '#F97316'}, ${shop.secondaryColor || '#FBBF24'})`
        }}
      >
        <div className="absolute top-6 left-6 z-20">
          <button
            type="button"
            onClick={backToAllShops}
            className="px-4 py-2 rounded-full bg-white/15 text-white border border-white/30 hover:bg-white/25 transition-colors backdrop-blur-sm"
          >
            ← Toutes les boutiques
          </button>
        </div>
        <div className="absolute inset-0 bg-black/20 pointer-events-none"></div>
        
        {/* Éléments décoratifs */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-white/10 rounded-full animate-float pointer-events-none"></div>
        <div className="absolute top-40 right-20 w-16 h-16 bg-white/10 rounded-full animate-float delay-200 pointer-events-none"></div>
        <div className="absolute bottom-20 left-1/4 w-12 h-12 bg-white/10 rounded-full animate-float delay-400 pointer-events-none"></div>
        
        <div className="container relative z-10">
          <div className="max-w-4xl mx-auto text-center text-white">
            <div className="mb-8">
              <div className="w-20 h-20 mx-auto mb-6 bg-white/20 rounded-full flex items-center justify-center overflow-hidden">
                {shop.logoDataUrl ? (
                  <img src={shop.logoDataUrl} alt="Logo" className="w-20 h-20 object-cover" />
                ) : (
                  <Store className="w-10 h-10" />
                )}
              </div>
              <div className="flex items-center justify-center gap-3 mb-4">
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold">{shop.name}</h1>
                {shop.status === 'approved' && (
                  <div className="flex items-center gap-1 bg-green-100/20 text-green-100 px-3 py-1 rounded-full text-sm">
                    <Shield className="w-4 h-4" />
                    Vérifié
                  </div>
                )}
              </div>
              <p className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl mx-auto">{shop.description}</p>
              <div className="flex flex-wrap justify-center items-center gap-6 text-sm text-white/80">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>{shop.address?.city}, {shop.address?.country}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>Depuis {new Date(shop.created_at).toLocaleDateString('fr-FR')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  <span>{shop.total_sales} ventes</span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {canManageProducts && (
                <button
                  type="button"
                  onClick={() => {
                    try {
                      localStorage.setItem('mangoo-last-view', 'landing');
                    } catch {
                      // ignore
                    }
                    navigate('/');
                  }}
                  className="text-lg px-8 py-4 inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-200 backdrop-blur-sm bg-white text-gray-900 hover:bg-gray-100 hover:-translate-y-0.5"
                >
                  Tableau de bord
                </button>
              )}

              {canManageProducts && (
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      navigate(`/?lp_role=vendor&lp_vendor_tab=shops&lp_vendor_edit_shop=${encodeURIComponent(String(shopSlug || ''))}`);
                    }}
                    className="px-4 py-2 rounded-full bg-white/10 text-white border border-white/25 hover:bg-white/20 transition-colors"
                  >
                    ⚙️ Réglages
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('products');
                      setShowVendorManager(true);
                    }}
                    className="px-4 py-2 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold hover:from-orange-600 hover:to-amber-600 transition-all"
                  >
                    📦 Nouveau
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      navigate('/?lp_role=vendor&lp_vendor_tab=supply');
                    }}
                    className="px-4 py-2 rounded-full bg-white/10 text-white border border-white/25 hover:bg-white/20 transition-colors"
                  >
                    🏭 S'approvisionner
                  </button>
                </div>
              )}
              <button
                type="button"
                onClick={toggleFollow}
                className={`text-lg px-8 py-4 inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-200 backdrop-blur-sm hover:-translate-y-0.5 ${
                  isFollowing
                    ? 'bg-white text-gray-900 hover:bg-gray-100'
                    : 'bg-white/15 text-white border border-white/30 hover:bg-white/25'
                }`}
              >
                <Users className="w-5 h-5 mr-2" />
                {isFollowing ? 'Suivi' : 'Suivre'}
              </button>
              <button
                type="button"
                onClick={shareShop}
                className="text-lg px-8 py-4 inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-200 backdrop-blur-sm bg-white/10 text-white border border-white/25 hover:bg-white/20 hover:-translate-y-0.5"
              >
                <Share2 className="w-5 h-5 mr-2" />
                Partager
              </button>
              <button type="button" onClick={contactShop} className="text-lg px-8 py-4 inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-200 backdrop-blur-sm bg-white/10 text-white border border-white/25 hover:bg-white/20 hover:-translate-y-0.5">
                <MessageCircle className="w-5 h-5 mr-2" />
                Contacter
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Shop Stats - Style conforme */}
      <section className="py-16 bg-white dark:bg-gray-800">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="card text-center hover-scale">
              <div className="card-body">
                <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star className="w-8 h-8 text-white" />
                </div>
                <div className="text-3xl font-bold text-primary-600 mb-2">{shop.review_count}</div>
                <div className="text-gray-600 dark:text-gray-400">Avis clients</div>
              </div>
            </div>
            <div className="card text-center hover-scale">
              <div className="card-body">
                <div className="w-16 h-16 bg-secondary-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <div className="text-3xl font-bold text-secondary-600 mb-2">{shop.followers_count}</div>
                <div className="text-gray-600 dark:text-gray-400">Abonnés</div>
              </div>
            </div>
            <div className="card text-center hover-scale">
              <div className="card-body">
                <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="w-8 h-8 text-white" />
                </div>
                <div className="text-3xl font-bold text-primary-700 mb-2">{shop.total_sales}</div>
                <div className="text-gray-600 dark:text-gray-400">Ventes totales</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Shop Policies - Style conforme */}
      <section className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="card hover-scale">
              <div className="card-body text-center">
                <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Truck className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Livraison</h3>
                <p className="text-gray-600 dark:text-gray-400">{shop.policies?.shipping || 'Livraison standard avec délais variables selon le produit.'}</p>
              </div>
            </div>
            <div className="card hover-scale">
              <div className="card-body text-center">
                <div className="w-16 h-16 bg-secondary-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Retours</h3>
                <p className="text-gray-600 dark:text-gray-400">{shop.policies?.returns || 'Retours acceptés dans les conditions générales de vente.'}</p>
              </div>
            </div>
            <div className="card hover-scale">
              <div className="card-body text-center">
                <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Garantie</h3>
                <p className="text-gray-600 dark:text-gray-400">{shop.policies?.warranty || 'Garantie fabricant selon les produits.'}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tabs - Style conforme */}
      <section className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container">
          <nav className="flex space-x-8">
            {[
              { id: 'products', label: 'Produits', icon: Package },
              { id: 'reviews', label: 'Avis', icon: Star },
              { id: 'about', label: 'À propos', icon: Store }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </section>

      {/* Tab Content - Style conforme */}
      <section className="py-16">
        <div className="container">
          {activeTab === 'products' && (
            <div>
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {products.length} produit(s)
                </h2>
                <div className="flex gap-2">
                  {canManageProducts && (
                    <button
                      type="button"
                      onClick={() => setShowVendorManager(true)}
                      className="btn-primary"
                    >
                      Ajouter un produit
                    </button>
                  )}
                  {!canManageProducts && shopOwnerEmail && (
                    <button
                      type="button"
                      onClick={() => setShowVendorMode(true)}
                      className="btn-primary"
                    >
                      Je suis le vendeur
                    </button>
                  )}
                  <select className="form-input">
                    <option>Tri: Pertinence</option>
                    <option>Prix: croissant</option>
                    <option>Prix: décroissant</option>
                    <option>Plus récents</option>
                    <option>Mieux notés</option>
                  </select>
                </div>
              </div>

              {products.length === 0 ? (
                <div className="card">
                  <div className="card-body text-center py-12">
                    <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      Aucun produit disponible
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Cette boutique n&apos;a pas encore de produits en vente.
                    </p>
                    {canManageProducts && (
                      <div className="mt-6">
                        <button
                          type="button"
                          onClick={() => setShowVendorManager(true)}
                          className="btn-primary"
                        >
                          Ajouter mon premier produit
                        </button>
                      </div>
                    )}
                    {!canManageProducts && shopOwnerEmail && (
                      <div className="mt-6">
                        <button
                          type="button"
                          onClick={() => setShowVendorMode(true)}
                          className="btn-primary"
                        >
                          Je suis le vendeur
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} shop={shop} />
                  ))}
                </div>
              )}
            </div>
          )}

          {showVendorMode && (
            <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
              <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-2xl">
                <div className="p-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
                  <div className="font-semibold text-gray-900 dark:text-white">Activer le mode vendeur</div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowVendorMode(false);
                      setVendorEmail('');
                      setPendingMismatch(false);
                    }}
                    className="px-3 py-2 rounded-lg text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    Fermer
                  </button>
                </div>
                <div className="p-4 space-y-3">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Entrez l’email utilisé lors de la création de cette boutique pour gérer vos produits.
                  </div>
                  {shopOwnerEmail && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Email associé à cette boutique (démo): {maskEmail(shopOwnerEmail)}
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Email vendeur</label>
                    <input
                      value={vendorEmail}
                      onChange={(e) => setVendorEmail(e.target.value)}
                      type="email"
                      placeholder="ex: vous@exemple.com"
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                    />
                  </div>
                  {pendingMismatch && (
                    <div className="rounded-xl border border-orange-200 bg-orange-50 text-orange-800 p-3 text-sm">
                      <div className="font-semibold">Vous n’avez pas le bon email ?</div>
                      <div className="text-xs mt-1">Mode démo: vous pouvez associer cette boutique à l’email saisi.</div>
                      <div className="mt-3 flex justify-end">
                        <button
                          type="button"
                          onClick={claimShopForEmail}
                          className="px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-orange-500 to-green-600 text-white"
                        >
                          Associer à cet email (démo)
                        </button>
                      </div>
                    </div>
                  )}
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowVendorMode(false);
                        setVendorEmail('');
                        setPendingMismatch(false);
                      }}
                      className="px-4 py-2 rounded-xl text-sm font-semibold border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200"
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      onClick={activateVendorMode}
                      className="px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-orange-500 to-green-600 text-white"
                    >
                      Activer
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {showVendorManager && (
            <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
              <div className="w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-2xl">
                <div className="p-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
                  <div className="font-semibold text-gray-900 dark:text-white">Gestion des produits</div>
                  <button
                    type="button"
                    onClick={() => setShowVendorManager(false)}
                    className="px-3 py-2 rounded-lg text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    Fermer
                  </button>
                </div>
                <div className="p-4">
                  <VendorProductManager
                    shops={[{
                      id: shop?.id || shopSlug,
                      slug: shopSlug,
                      name: shop?.name || 'Boutique',
                      category: shop?.category || 'general',
                      primaryColor: shop?.primaryColor,
                      secondaryColor: shop?.secondaryColor,
                      logoDataUrl: shop?.logoDataUrl || ''
                    }]}
                    defaultShopSlug={shopSlug}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div>
              <div className="card mb-8">
                <div className="card-body">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Note moyenne: {shop.review_count > 0 ? '4.5' : 'N/A'}
                    </h3>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-5 h-5 ${
                              i < 4 ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-gray-600 dark:text-gray-400">
                        {shop.review_count} avis
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                {/* Avis simulés */}
                {[
                  { name: 'Marie L.', rating: 5, comment: 'Excellent service, produit conforme à la description. Je recommande !', date: '2024-01-15' },
                  { name: 'Jean D.', rating: 4, comment: 'Bonne qualité, livraison rapide. Satisfait de mon achat.', date: '2024-01-10' },
                  { name: 'Sophie M.', rating: 5, comment: 'Produit exceptionnel, vendeur très professionnel.', date: '2024-01-08' }
                ].map((review, index) => (
                  <div key={index} className="card">
                    <div className="card-body">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                            <span className="text-primary-600 dark:text-primary-400 font-medium">{review.name.charAt(0)}</span>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">{review.name}</div>
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">{review.date}</span>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300">{review.comment}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'about' && (
            <div className="max-w-4xl">
              <div className="card mb-8">
                <div className="card-body">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    À propos de {shop.name}
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 mb-6">
                    {shop.description} Nous sommes spécialisés dans la vente de produits de qualité 
                    avec un service client exceptionnel. Notre objectif est de satisfaire tous nos clients 
                    avec des produits soigneusement sélectionnés.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-3">Informations</h4>
                      <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                        <div>Type: {shop.business_type === 'individual' ? 'Vendeur individuel' : 'Entreprise'}</div>
                        <div>Commission: {shop.commission_rate}%</div>
                        <div>Statut: {shop.status === 'approved' ? 'Approuvé' : 'En attente'}</div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-3">Statistiques</h4>
                      <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                        <div>Ventes totales: {shop.total_sales}</div>
                        <div>Chiffre d&apos;affaires: {shop.total_revenue.toFixed(2)} €</div>
                        <div>Avis clients: {shop.review_count}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-body">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-4">Politiques de la boutique</h4>
                  <div className="space-y-6">
                    <div>
                      <h5 className="font-medium text-gray-900 dark:text-white mb-2">Livraison</h5>
                      <p className="text-gray-600 dark:text-gray-400">{shop.policies?.shipping || 'Livraison standard avec délais variables selon le produit.'}</p>
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-900 dark:text-white mb-2">Retours</h5>
                      <p className="text-gray-600 dark:text-gray-400">{shop.policies?.returns || 'Retours acceptés dans les conditions générales de vente.'}</p>
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-900 dark:text-white mb-2">Garantie</h5>
                      <p className="text-gray-600 dark:text-gray-400">{shop.policies?.warranty || 'Garantie fabricant selon les produits.'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

// Composant ProductCard - Style conforme
const ProductCard = ({ product, shop }) => {
  const [isWishlisted, setIsWishlisted] = useState(false);

  const toggleWishlist = () => {
    setIsWishlisted(!isWishlisted);
  };

  const addToCart = () => {
    toast.success(`Produit "${product.name}" ajouté au panier`);
  };

  return (
    <div className="card hover-scale overflow-hidden">
      <div className="relative">
        <Link to={`/shop/${shop.slug}/product/${product.slug}`}>
          <img
            src={product.images[0]?.url || 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=400'}
            alt={product.images[0]?.alt_text || product.name}
            className="w-full h-48 object-cover hover:scale-105 transition-transform duration-300"
          />
        </Link>
        {product.featured && (
          <div className="absolute top-2 left-2 bg-secondary-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
            Vedette
          </div>
        )}
        <button
          onClick={toggleWishlist}
          className="absolute top-2 right-2 p-2 bg-white/90 dark:bg-gray-800/90 rounded-full shadow-md hover:shadow-lg transition-shadow"
        >
          <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
        </button>
      </div>
      
      <div className="card-body">
        <div className="mb-2">
          <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            {product.category.name}
          </span>
        </div>
        
        <Link to={`/shop/${shop.slug}/product/${product.slug}`}>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 hover:text-primary-600 dark:hover:text-primary-400 line-clamp-2">
            {product.name}
          </h3>
        </Link>
        
        <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-2">
          {product.short_description}
        </p>
        
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  i < Math.floor(product.average_rating)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300'
                }`}
              />
            ))}
          </div>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {product.average_rating} ({product.review_count})
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-xl font-bold text-gray-900 dark:text-white">
            {product.price.toFixed(2)} €
          </span>
          <button
            onClick={addToCart}
            className="btn-primary p-2"
          >
            <ShoppingCart className="w-5 h-5" />
          </button>
        </div>
        
        {product.variants[0]?.inventory_quantity <= 5 && (
          <div className="mt-2 text-xs text-orange-600 font-medium">
            {product.variants[0].inventory_quantity} restants
          </div>
        )}
      </div>
    </div>
  );
};

export default ShopPage;
