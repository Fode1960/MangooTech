import React, { useState, useEffect } from 'react';
import { Users, MessageCircle, ShoppingCart, Heart, Share2, Play, Square, Send, Star } from 'lucide-react';

interface ChatMessage {
  id: string;
  user: string;
  message: string;
  timestamp: Date;
  isHost?: boolean;
}

interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  description: string;
  inStock: boolean;
}

interface Viewer {
  id: string;
  name: string;
  avatar: string;
}

export default function TestLiveShopping() {
  const [isLive, setIsLive] = useState(false);
  const [viewerCount, setViewerCount] = useState(42);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showProductPanel, setShowProductPanel] = useState(false);
  const [likes, setLikes] = useState(128);
  const [hasLiked, setHasLiked] = useState(false);
  const [simulationMode, setSimulationMode] = useState(true);

  // Produits de démonstration
  const demoProducts: Product[] = [
    {
      id: '1',
      name: 'Montre Connectée Luxe',
      price: 299,
      originalPrice: 399,
      image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=luxury%20smart%20watch%20elegant%20design%20premium%20materials&image_size=square',
      description: 'Montre intelligente avec écran AMOLED, suivi santé avancé',
      inStock: true
    },
    {
      id: '2',
      name: 'Casque Audio Pro',
      price: 189,
      originalPrice: 249,
      image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=premium%20headphones%20professional%20audio%20quality%20sleek%20design&image_size=square',
      description: 'Casque audio sans fil avec réduction de bruit active',
      inStock: true
    },
    {
      id: '3',
      name: 'Enceinte Intelligente',
      price: 129,
      originalPrice: 179,
      image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=smart%20speaker%20modern%20design%20home%20automation&image_size=square',
      description: 'Enceinte connectée avec assistant vocal IA',
      inStock: false
    }
  ];

  // Messages de chat simulés
  const demoMessages = [
    { user: 'Marie_L', message: 'Ce produit est super ! 😍' },
    { user: 'JeanTech', message: 'Quelle est l\'autonomie de la montre ?' },
    { user: 'Sophie_83', message: 'Je l\'ai achetée la semaine dernière, top qualité' },
    { user: 'Lucas_D', message: 'Est-ce qu\'il y a une garantie ?' },
    { user: 'EmmaShop', message: 'Le prix est très intéressant !' },
    { user: 'Nico_V', message: 'Livraison rapide ?' },
    { user: 'Julie_F', message: 'J\'adore ce design 🎯' },
    { user: 'Pierre_M', message: 'Disponible en autres couleurs ?' }
  ];

  // Démarrer/arrêter le live
  const toggleLive = () => {
    setIsLive(!isLive);
    if (!isLive) {
      // Ajouter un message de bienvenue
      const welcomeMessage: ChatMessage = {
        id: Date.now().toString(),
        user: 'Hôte',
        message: 'Bienvenue dans notre live shopping ! Posez vos questions en direct.',
        timestamp: new Date(),
        isHost: true
      };
      setChatMessages([welcomeMessage]);
      
      // Simuler l'arrivée de viewers
      const interval = setInterval(() => {
        setViewerCount(prev => prev + Math.floor(Math.random() * 3));
      }, 5000);
      
      // Simuler des messages
      const messageInterval = setInterval(() => {
        if (demoMessages.length > 0) {
          const randomMessage = demoMessages[Math.floor(Math.random() * demoMessages.length)];
          const newMsg: ChatMessage = {
            id: Date.now().toString(),
            user: randomMessage.user,
            message: randomMessage.message,
            timestamp: new Date()
          };
          setChatMessages(prev => [...prev.slice(-19), newMsg]); // Garder les 20 derniers messages
        }
      }, 8000);
      
      // Nettoyer à l'arrêt
      setTimeout(() => {
        clearInterval(interval);
        clearInterval(messageInterval);
      }, 60000); // Arrêter après 1 minute
    }
  };

  // Envoyer un message
  const sendMessage = () => {
    if (newMessage.trim()) {
      const message: ChatMessage = {
        id: Date.now().toString(),
        user: 'Vous',
        message: newMessage,
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, message]);
      setNewMessage('');
    }
  };

  // Ajouter un like
  const handleLike = () => {
    setHasLiked(!hasLiked);
    setLikes(prev => hasLiked ? prev - 1 : prev + 1);
  };

  // Acheter un produit
  const handleBuy = (product: Product) => {
    if (product.inStock) {
      alert(`Produit "${product.name}" ajouté au panier !\nPrix: ${product.price}€`);
    } else {
      alert('Produit en rupture de stock');
    }
  };

  // Effet pour simuler des viewers aléatoires
  useEffect(() => {
    if (isLive) {
      const interval = setInterval(() => {
        setViewerCount(prev => {
          const change = Math.floor(Math.random() * 5) - 2; // -2 à +2
          return Math.max(1, prev + change);
        });
      }, 3000);
      
      return () => clearInterval(interval);
    }
  }, [isLive]);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 p-4 border-b border-gray-700">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">Live Shopping Demo</h1>
            {isLive && (
              <div className="flex items-center gap-2 bg-red-600 px-3 py-1 rounded-full">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">EN DIRECT</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              <span className="font-medium">{viewerCount} viewers</span>
            </div>
            
            <button
              onClick={handleLike}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                hasLiked ? 'bg-red-600 text-white' : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              <Heart className={`w-5 h-5 ${hasLiked ? 'fill-current' : ''}`} />
              <span>{likes}</span>
            </button>
            
            <button
              onClick={toggleLive}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                isLive 
                  ? 'bg-red-600 hover:bg-red-700 text-white' 
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {isLive ? <Square className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              {isLive ? 'Arrêter le live' : 'Démarrer le live'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Zone vidéo principale */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800 rounded-lg overflow-hidden">
              {/* Vidéo simulée */}
              <div className="aspect-video bg-gradient-to-br from-purple-900 to-blue-900 flex items-center justify-center relative">
                {!isLive ? (
                  <div className="text-center">
                    <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Play className="w-10 h-10 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Prêt à démarrer le live</h3>
                    <p className="text-gray-400">Cliquez sur "Démarrer le live" pour commencer</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="w-24 h-24 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                      <div className="w-3 h-3 bg-white rounded-full"></div>
                    </div>
                    <h3 className="text-xl font-semibold mb-2">LIVE EN COURS</h3>
                    <p className="text-gray-300">Présentation produits en direct</p>
                    
                    {/* Indicateur de simulation */}
                    {simulationMode && (
                      <div className="absolute top-4 right-4 bg-orange-600 px-2 py-1 rounded text-xs">
                        Mode Démo
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Contrôles vidéo */}
              <div className="p-4 bg-gray-900 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button className="p-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors">
                    <MessageCircle className="w-5 h-5" />
                  </button>
                  
                  <button className="p-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors">
                    <Share2 className="w-5 h-5" />
                  </button>
                </div>
                
                <button
                  onClick={() => setShowProductPanel(!showProductPanel)}
                  className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <ShoppingCart className="w-5 h-5" />
                  Produits ({demoProducts.length})
                </button>
              </div>
            </div>
            
            {/* Description du live */}
            <div className="mt-4 bg-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-2">Live Shopping - Présentation Produits Tech</h3>
              <p className="text-gray-300">
                Découvrez nos meilleurs produits technologiques en direct ! 
                Posez vos questions et profitez d'offres exclusives pendant le live.
              </p>
            </div>
          </div>

          {/* Chat et produits */}
          <div className="space-y-4">
            {/* Chat */}
            <div className="bg-gray-800 rounded-lg h-96 flex flex-col">
              <div className="p-4 border-b border-gray-700">
                <h3 className="font-semibold flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  Chat en Direct
                </h3>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {chatMessages.map((msg) => (
                  <div key={msg.id} className={`${msg.isHost ? 'bg-blue-900 bg-opacity-30' : ''} p-2 rounded-lg`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-sm font-medium ${
                        msg.isHost ? 'text-blue-400' : 'text-gray-300'
                      }`}>
                        {msg.user}
                      </span>
                      <span className="text-xs text-gray-500">
                        {msg.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-200">{msg.message}</p>
                  </div>
                ))}
              </div>
              
              <div className="p-4 border-t border-gray-700">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Écrivez un message..."
                    className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  />
                  <button
                    onClick={sendMessage}
                    className="bg-blue-600 hover:bg-blue-700 p-2 rounded-lg transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
            
            {/* Produits */}
            {showProductPanel && (
              <div className="bg-gray-800 rounded-lg">
                <div className="p-4 border-b border-gray-700">
                  <h3 className="font-semibold flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5" />
                    Produits en Vedette
                  </h3>
                </div>
                
                <div className="p-4 space-y-4">
                  {demoProducts.map((product) => (
                    <div key={product.id} className="bg-gray-700 rounded-lg p-3">
                      <div className="flex gap-3">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{product.name}</h4>
                          <p className="text-xs text-gray-400 mt-1">{product.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-lg font-bold text-green-400">{product.price}€</span>
                            {product.originalPrice && (
                              <span className="text-sm text-gray-500 line-through">{product.originalPrice}€</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 mt-1">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            ))}
                            <span className="text-xs text-gray-400 ml-1">(4.8)</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-3 flex gap-2">
                        <button
                          onClick={() => handleBuy(product)}
                          disabled={!product.inStock}
                          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                            product.inStock
                              ? 'bg-green-600 hover:bg-green-700 text-white'
                              : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          {product.inStock ? 'Acheter Maintenant' : 'Rupture de Stock'}
                        </button>
                        
                        <button
                          onClick={() => setSelectedProduct(product)}
                          className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm transition-colors"
                        >
                          Détails
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Modal de détails produit */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-semibold">{selectedProduct.name}</h3>
              <button
                onClick={() => setSelectedProduct(null)}
                className="text-gray-400 hover:text-white"
              >
                ×
              </button>
            </div>
            
            <img
              src={selectedProduct.image}
              alt={selectedProduct.name}
              className="w-full h-48 object-cover rounded-lg mb-4"
            />
            
            <p className="text-gray-300 mb-4">{selectedProduct.description}</p>
            
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl font-bold text-green-400">{selectedProduct.price}€</span>
              {selectedProduct.originalPrice && (
                <span className="text-lg text-gray-500 line-through">{selectedProduct.originalPrice}€</span>
              )}
            </div>
            
            <button
              onClick={() => {
                handleBuy(selectedProduct);
                setSelectedProduct(null);
              }}
              disabled={!selectedProduct.inStock}
              className={`w-full py-3 rounded-lg font-medium transition-colors ${
                selectedProduct.inStock
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }`}
            >
              {selectedProduct.inStock ? 'Acheter Maintenant' : 'Rupture de Stock'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}