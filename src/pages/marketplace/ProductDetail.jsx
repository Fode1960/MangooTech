import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '../../stores/appStore';
import { useThemeStore } from '../../stores/themeStore';
import { 
  ShoppingCart, 
  Heart, 
  Share2, 
  MessageCircle, 
  Star, 
  ArrowLeft, 
  Truck, 
  Shield, 
  Clock,
  Phone,
  Mail,
  MapPin,
  Search,
  Store
} from 'lucide-react';
import CustomerChat from '../../components/CustomerChat';

const ProductDetail = () => {
  const { shopSlug, productSlug } = useParams();
  const navigate = useNavigate();
  const { isDark } = useThemeStore();
  const { addToCart } = useAppStore();
  
  const [product, setProduct] = useState(null);
  const [shop, setShop] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);

  const loadProductFromSupabase = useCallback(async () => {
    try {
      // Simulation de chargement depuis Supabase
      // Dans une implémentation réelle, ceci appellerait l'API Supabase
      console.log('Chargement du produit depuis Supabase...');
      
      // Données de démonstration
      const mockProduct = {
        id: parseInt(productSlug) || 1,
        name: `Produit ${productSlug}`,
        price: 99.99,
        description: 'Description du produit en cours de chargement...',
        images: ['https://via.placeholder.com/400'],
        vendor: 'Vendeur Demo',
        vendorId: 'vendor_001',
        inStock: true,
        category: 'Electronique'
      };
      
      setProduct(mockProduct);
      setShop({
        id: mockProduct.vendorId,
        name: mockProduct.vendor,
        avatar: 'VD',
        rating: 4.8,
        reviews: 124,
        location: 'Abidjan, Côte d\'Ivoire',
        phone: '+225 07 00 00 00 00',
        email: 'vendor@example.com'
      });
      
    } catch (error) {
      console.error('Erreur lors du chargement du produit:', error);
    }
  }, [productSlug]);

  useEffect(() => {
    // Charger le produit depuis Supabase ou API
    loadProductFromSupabase();
  }, [loadProductFromSupabase]);

  if (!product) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
      }`}>
        <div className="text-center">
          <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl ${
            isDark ? 'bg-gray-800 text-[#ecf7e7]' : 'bg-[#eef6ea] text-[#1b5e20]'
          }`}>
            <Search className="h-8 w-8" aria-hidden="true" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Produit non trouvÃ©</h2>
          <p className="text-gray-500 mb-4">Le produit que vous cherchez n'existe pas.</p>
          <button
            onClick={() => navigate('/marketplace')}
            className="rounded-lg bg-[#1b5e20] px-6 py-3 text-white transition-colors hover:bg-[#16381a]"
          >
            Retour au marchÃ©
          </button>
        </div>
      </div>
    );
  }

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addToCart(product);
    }
    // Notification de succÃ¨s
    const event = new CustomEvent('cartUpdated', { 
      detail: { message: `${product.name} ajoutÃ© au panier !` } 
    });
    window.dispatchEvent(event);
  };

  const handleChatClick = () => {
    setShowChat(true);
  };

  const isInWishlist = false; // Temporairement dÃ©sactivÃ©

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
    }`}>
      <div className="container mx-auto px-4 py-8">
        {/* Bouton de retour */}
        <button
          onClick={() => navigate('/marketplace')}
          className="flex items-center space-x-2 mb-6 text-orange-600 hover:text-orange-700 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Retour au marché</span>
        </button>

        <div className={`rounded-2xl shadow-2xl overflow-hidden ${
          isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
        }`}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
            {/* Section images */}
            <div className="space-y-4">
              <div className={`aspect-square overflow-hidden rounded-xl ${
                isDark ? 'bg-gray-700' : 'bg-[#eef6ea]'
              }`}>
                {product.image ? (
                  <img 
                    src={product.image} 
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className={`flex h-24 w-24 items-center justify-center rounded-3xl ${
                      isDark ? 'bg-gray-800 text-[#ecf7e7]' : 'bg-white text-[#1b5e20]'
                    }`}>
                      <Store className="h-12 w-12" aria-hidden="true" />
                    </div>
                  </div>
                )}
              </div>
              
              {/* Miniatures d'images */}
              <div className="grid grid-cols-4 gap-2">
                {[1,2,3,4].map((i) => (
                  <div 
                    key={i}
                    className={`aspect-square rounded-lg border-2 cursor-pointer transition-all ${
                      selectedImage === i-1 
                        ? 'border-orange-500 shadow-lg' 
                        : 'border-gray-200 dark:border-gray-600 hover:border-orange-300'
                    }`}
                    onClick={() => setSelectedImage(i-1)}
                  >
                    <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-lg">
                      <span className="text-2xl">{product.icon}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Section informations */}
            <div className="space-y-6">
              {/* En-tête */}
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <span className="px-3 py-1 bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 text-sm rounded-full">
                    {product.category}
                  </span>
                  {product.discount && (
                    <span className="px-3 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 text-sm rounded-full">
                      -{product.discount}%
                    </span>
                  )}
                </div>
                
                <h1 className="text-3xl font-bold mb-4">{product.name}</h1>
                
                {/* Notation */}
                <div className="flex items-center space-x-4 mb-4">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${
                          i < product.rating
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300 dark:text-gray-600'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {product.rating} ({product.reviews} avis)
                  </span>
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="text-lg font-semibold mb-2">Description</h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  {product.description}
                </p>
              </div>

              {/* Prix */}
              <div className="space-y-2">
                {product.discount ? (
                  <div className="flex items-center space-x-3">
                    <span className="text-3xl font-bold text-orange-600">
                      {Math.round(parseFloat(product.price.replace(/[^\d]/g, '')) * (1 - product.discount / 100)).toLocaleString()} FCFA
                    </span>
                    <span className="text-lg text-gray-500 line-through">
                      {product.price}
                    </span>
                  </div>
                ) : (
                  <span className="text-3xl font-bold text-orange-600">
                    {product.price}
                  </span>
                )}
              </div>

              {/* Quantité et boutons d'action */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Quantité</label>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-10 rounded-lg border border-gray-300 dark:border-gray-600 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      -
                    </button>
                    <span className="text-lg font-semibold w-12 text-center">{quantity}</span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-10 h-10 rounded-lg border border-gray-300 dark:border-gray-600 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={handleAddToCart}
                    disabled={!product.inStock}
                    className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all ${
                      product.inStock
                        ? 'bg-[#1b5e20] text-white hover:bg-[#16381a]'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <ShoppingCart className="w-5 h-5" />
                      <span>{product.inStock ? 'Ajouter au panier' : 'Rupture de stock'}</span>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => console.log('Wishlist temporairement désactivé')}
                    className={`p-3 rounded-lg border transition-all ${
                      isInWishlist
                        ? 'bg-red-500 text-white border-red-500'
                        : 'border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Heart className={`w-5 h-5 ${isInWishlist ? 'fill-current' : ''}`} />
                  </button>
                  
                  <button className="p-3 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700">
                    <Share2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Informations du vendeur */}
              {shop && (
                <div className={`rounded-lg p-4 ${
                  isDark ? 'bg-gray-700' : 'bg-gray-50'
                }`}>
                  <h4 className="font-semibold mb-3">Vendeur</h4>
                  <div className="flex items-center space-x-3 mb-3">
                    <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl text-sm font-black ${
                      isDark ? 'bg-gray-800 text-[#ecf7e7]' : 'bg-[#eef6ea] text-[#1b5e20]'
                    }`}>
                      {String(shop.avatar || shop.name || 'VD').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium">{shop.name}</p>
                      <div className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span>{shop.rating} ({shop.reviews} avis)</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-600 dark:text-gray-400">{shop.location}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-600 dark:text-gray-400">Répond sous 1h</span>
                    </div>
                  </div>
                  
                  <button
                    onClick={handleChatClick}
                    className="flex w-full items-center justify-center space-x-2 rounded-lg bg-[#1b5e20] px-4 py-2 font-medium text-white transition-colors hover:bg-[#16381a]"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Discuter avec le vendeur</span>
                  </button>
                </div>
              )}

              {/* Garanties */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <Truck className="w-5 h-5 text-green-600" />
                  <span className="text-gray-600 dark:text-gray-400">Livraison rapide</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Shield className="w-5 h-5 text-blue-600" />
                  <span className="text-gray-600 dark:text-gray-400">Paiement sécurisé</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-orange-600" />
                  <span className="text-gray-600 dark:text-gray-400">Retour 14j</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chat avec le vendeur */}
      {showChat && shop && (
        <CustomerChat
          vendorId={shop.id}
          vendorName={shop.name}
          vendorAvatar={shop.avatar}
          onClose={() => setShowChat(false)}
        />
      )}
    </div>
  );
};

export default ProductDetail;
