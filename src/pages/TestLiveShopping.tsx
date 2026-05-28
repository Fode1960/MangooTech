import React, { useState, useEffect } from 'react';
import { Video, Users, MessageCircle, ShoppingCart, Heart, Share2, Settings, Play, Pause } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice: number;
  image: string;
  description: string;
  stock: number;
}

interface ChatMessage {
  id: string;
  user: string;
  message: string;
  timestamp: Date;
}

const TestLiveShopping = () => {
  const [isLive, setIsLive] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [streamStatus, setStreamStatus] = useState<string>('Hors ligne');

  // Produits de démonstration
  const demoProducts: Product[] = [
    {
      id: '1',
      name: 'iPhone 15 Pro',
      price: 899,
      originalPrice: 1099,
      image: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=300',
      description: 'Le dernier iPhone avec puce A17 Pro',
      stock: 25
    },
    {
      id: '2',
      name: 'MacBook Air M2',
      price: 1099,
      originalPrice: 1299,
      image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=300',
      description: 'Ultra-portable avec puce M2',
      stock: 15
    },
    {
      id: '3',
      name: 'AirPods Pro',
      price: 199,
      originalPrice: 249,
      image: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=300',
      description: 'Écouteurs avec réduction de bruit',
      stock: 50
    }
  ];

  // Messages de chat de démonstration
  const demoMessages = [
    { user: 'Marie', message: 'Super produit !' },
    { user: 'Jean', message: 'Est-ce que c\'est encore disponible ?' },
    { user: 'Sophie', message: 'Je l\'ai acheté la semaine dernière, très satisfaite' },
    { user: 'Pierre', message: 'Quelle est la garantie ?' },
    { user: 'Julie', message: 'Le prix est très intéressant !' }
  ];

  useEffect(() => {
    // Simuler des viewers
    const viewerInterval = setInterval(() => {
      setViewerCount(prev => {
        const change = Math.floor(Math.random() * 10) - 5;
        return Math.max(1, prev + change);
      });
    }, 3000);

    // Simuler des messages de chat
    const chatInterval = setInterval(() => {
      if (isLive && Math.random() > 0.7) {
        const randomMessage = demoMessages[Math.floor(Math.random() * demoMessages.length)];
        setChatMessages(prev => [...prev, {
          id: Date.now().toString(),
          user: randomMessage.user,
          message: randomMessage.message,
          timestamp: new Date()
        }]);
      }
    }, 5000);

    return () => {
      clearInterval(viewerInterval);
      clearInterval(chatInterval);
    };
  }, [isLive]);

  const startStream = () => {
    setIsLive(true);
    setStreamStatus('En direct');
    setViewerCount(1);
  };

  const stopStream = () => {
    setIsLive(false);
    setStreamStatus('Hors ligne');
    setViewerCount(0);
  };

  const sendMessage = () => {
    if (newMessage.trim()) {
      setChatMessages(prev => [...prev, {
        id: Date.now().toString(),
        user: 'Vendeur',
        message: newMessage,
        timestamp: new Date()
      }]);
      setNewMessage('');
    }
  };

  const addToCart = (product: Product) => {
    alert(`Produit ajouté au panier: ${product.name}`);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto p-4">
        {/* Navigation rapide */}
        <div className="mb-6">
          <a
            href="/demo"
            className="inline-flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors"
          >
            <span>← Retour à la démo</span>
          </a>
        </div>

        {/* En-tête */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Test Live Shopping</h1>
            <p className="text-gray-400">Testez les fonctionnalités de vente en direct</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${isLive ? 'bg-red-500 animate-pulse' : 'bg-gray-500'}`}></div>
              <span className="text-sm">{streamStatus}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span className="text-sm">{viewerCount} viewers</span>
            </div>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Zone principale */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Zone vidéo et produits */}
          <div className="lg:col-span-2 space-y-6">
            {/* Lecteur vidéo */}
            <div className="bg-gray-800 rounded-lg overflow-hidden">
              <div className="aspect-video bg-gray-700 flex items-center justify-center relative">
                {isLive ? (
                  <div className="text-center">
                    <Video className="w-16 h-16 mx-auto mb-4 text-red-500 animate-pulse" />
                    <p className="text-xl font-semibold">EN DIRECT</p>
                    <p className="text-gray-400">Diffusion en cours...</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <Video className="w-16 h-16 mx-auto mb-4 text-gray-500" />
                    <p className="text-xl font-semibold">HORS LIGNE</p>
                    <p className="text-gray-400">Démarrez votre live pour commencer</p>
                  </div>
                )}
                
                {/* Contrôles de stream */}
                <div className="absolute bottom-4 left-4 right-4 flex justify-center">
                  {!isLive ? (
                    <button
                      onClick={startStream}
                      className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg flex items-center space-x-2 transition-colors"
                    >
                      <Play className="w-5 h-5" />
                      <span>Démarrer le live</span>
                    </button>
                  ) : (
                    <button
                      onClick={stopStream}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg flex items-center space-x-2 transition-colors"
                    >
                      <Pause className="w-5 h-5" />
                      <span>Arrêter le live</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Produits en vedette */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                <ShoppingCart className="w-5 h-5 mr-2" />
                Produits en promotion
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {demoProducts.map((product) => (
                  <div key={product.id} className="bg-gray-700 rounded-lg p-4">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-32 object-cover rounded mb-3"
                    />
                    <h4 className="font-semibold mb-2">{product.name}</h4>
                    <p className="text-sm text-gray-400 mb-2">{product.description}</p>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <span className="text-lg font-bold text-green-400">{product.price}€</span>
                        <span className="text-sm text-gray-500 line-through ml-2">{product.originalPrice}€</span>
                      </div>
                      <span className="text-xs bg-blue-600 px-2 py-1 rounded">
                        Stock: {product.stock}
                      </span>
                    </div>
                    <button
                      onClick={() => addToCart(product)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded transition-colors"
                    >
                      Ajouter au panier
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Chat et interactions */}
          <div className="space-y-6">
            {/* Chat */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <MessageCircle className="w-5 h-5 mr-2" />
                Chat en direct
              </h3>
              
              <div className="h-64 overflow-y-auto mb-4 space-y-2">
                {chatMessages.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-8">
                    Aucun message pour le moment...
                  </p>
                ) : (
                  chatMessages.map((msg) => (
                    <div key={msg.id} className="bg-gray-700 rounded p-2">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-sm font-semibold text-blue-400">{msg.user}</span>
                        <span className="text-xs text-gray-500">
                          {msg.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm">{msg.message}</p>
                    </div>
                  ))
                )}
              </div>
              
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Tapez votre message..."
                  className="flex-1 bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:outline-none focus:border-blue-500"
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                />
                <button
                  onClick={sendMessage}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
                >
                  Envoyer
                </button>
              </div>
            </div>

            {/* Statistiques */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4">Statistiques du live</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Viewers actifs:</span>
                  <span className="font-semibold">{viewerCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Messages:</span>
                  <span className="font-semibold">{chatMessages.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Statut:</span>
                  <span className={`font-semibold ${isLive ? 'text-green-400' : 'text-gray-400'}`}>
                    {streamStatus}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions rapides */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4">Actions rapides</h3>
              <div className="space-y-2">
                <button className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded flex items-center justify-center space-x-2 transition-colors">
                  <Heart className="w-4 h-4" />
                  <span>Lancer une offre spéciale</span>
                </button>
                <button className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded flex items-center justify-center space-x-2 transition-colors">
                  <Share2 className="w-4 h-4" />
                  <span>Partager le live</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bouton retour */}
        <div className="text-center mt-8">
          <a
            href="/demo"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded transition-colors"
          >
            Retour à la démo
          </a>
        </div>

        {/* Paramètres */}
        {showSettings && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">Paramètres du live</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Qualité vidéo</label>
                  <select className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600">
                    <option>720p</option>
                    <option>1080p</option>
                    <option>4K</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Audio</label>
                  <select className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600">
                    <option>Stéréo</option>
                    <option>Mono</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-6">
                <button
                  onClick={() => setShowSettings(false)}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={() => setShowSettings(false)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                >
                  Sauvegarder
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TestLiveShopping;