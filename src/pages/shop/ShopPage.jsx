import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useParams, Link } from 'react-router-dom';
import { Store, MapPin, Star, Package, Calendar, Shield, Truck, Heart, Share2, MessageCircle, Users, ShoppingCart } from 'lucide-react';

const ShopPage = () => {
  const { shopSlug } = useParams();
  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('products');
  const [isFollowing, setIsFollowing] = useState(false);

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

  const loadShopData = async () => {
    try {
      setLoading(true);
      
      // Si le shopSlug est une route ShopApp, ne pas traiter comme une boutique
      if (['create', 'products', 'dashboard'].includes(shopSlug)) {
        setError('Cette page n\'est pas une boutique');
        setLoading(false);
        return;
      }
      
      // Simuler le chargement des données
      setTimeout(() => {
        if (shopSlug === 'boutique-demo') {
          setShop(demoShop);
          setProducts(demoProducts);
          setLoading(false);
        } else {
          setError('Boutique non trouvée');
          setLoading(false);
        }
      }, 1000);
      
    } catch (err) {
      setError(err.message || 'Erreur lors du chargement de la boutique');
      setLoading(false);
    }
  };

  const toggleFollow = () => {
    setIsFollowing(!isFollowing);
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
      <section className="relative overflow-hidden bg-gradient-primary pt-24 pb-16 lg:pt-32 lg:pb-24">
        <div className="absolute inset-0 bg-black/20"></div>
        
        {/* Éléments décoratifs */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-white/10 rounded-full animate-float"></div>
        <div className="absolute top-40 right-20 w-16 h-16 bg-white/10 rounded-full animate-float delay-200"></div>
        <div className="absolute bottom-20 left-1/4 w-12 h-12 bg-white/10 rounded-full animate-float delay-400"></div>
        
        <div className="container relative z-10">
          <div className="max-w-4xl mx-auto text-center text-white">
            <div className="mb-8">
              <div className="w-20 h-20 mx-auto mb-6 bg-white/20 rounded-full flex items-center justify-center">
                <Store className="w-10 h-10" />
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
              <button
                onClick={toggleFollow}
                className={`btn-primary text-lg px-8 py-4 inline-flex items-center hover-lift ${
                  isFollowing
                    ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    : 'bg-secondary-600 text-white hover:bg-secondary-700'
                }`}
              >
                <Users className="w-5 h-5 mr-2" />
                {isFollowing ? 'Suivi' : 'Suivre'}
              </button>
              <button
                onClick={shareShop}
                className="btn-outline-white text-lg px-8 py-4 inline-flex items-center hover-lift"
              >
                <Share2 className="w-5 h-5 mr-2" />
                Partager
              </button>
              <button className="btn-outline-white text-lg px-8 py-4 inline-flex items-center hover-lift">
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