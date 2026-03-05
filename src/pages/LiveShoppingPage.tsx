import React, { useState } from 'react';
import { VideoCallProvider } from '../contexts/VideoCallContext';
import LiveShoppingStream from '../components/LiveShoppingStream';

const LiveShoppingPage: React.FC = () => {
  const [showStream, setShowStream] = useState(true);

  const demoStreamData = {
    id: 'stream_demo_001',
    title: '📱 Vente Flash Smartphones - Jusqu\'à -50%',
    description: 'Découvrez nos meilleurs smartphones en promotion limitée!',
    streamer: {
      id: 'vendor_001',
      name: 'Tech Boutique',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100'
    },
    products: [
      {
        id: 'prod_001',
        name: 'iPhone 14 Pro Max',
        price: '899€',
        originalPrice: '1199€',
        image: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=300',
        description: 'Le smartphone le plus avancé d\'Apple',
        stock: 15
      },
      {
        id: 'prod_002',
        name: 'Samsung Galaxy S23 Ultra',
        price: '999€',
        originalPrice: '1299€',
        image: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=300',
        description: 'Le flagship Android ultime',
        stock: 8
      },
      {
        id: 'prod_003',
        name: 'Google Pixel 7 Pro',
        price: '699€',
        originalPrice: '899€',
        image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300',
        description: 'Le roi de la photo mobile',
        stock: 12
      }
    ],
    currentProductIndex: 0,
    viewers: 247,
    likes: 156,
    isLive: true,
    startTime: new Date()
  };

  const handleProductSelect = (product: any) => {
    console.log('Produit sélectionné:', product);
  };

  const handlePurchase = (product: any) => {
    console.log('Achat du produit:', product);
    alert(`Produit ajouté au panier: ${product.name}`);
  };

  const handleLike = () => {
    console.log('Like envoyé');
  };

  const handleShare = () => {
    console.log('Partage du stream');
    if (navigator.share) {
      navigator.share({
        title: demoStreamData.title,
        text: demoStreamData.description,
        url: window.location.href
      });
    } else {
      // Fallback pour les navigateurs qui ne supportent pas l'API Web Share
      navigator.clipboard.writeText(window.location.href);
      alert('Lien copié dans le presse-papiers !');
    }
  };

  return (
    <VideoCallProvider>
      <div className="min-h-screen bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-4">Live Shopping</h1>
            <p className="text-gray-300">Regardez nos vendeurs en direct et achetez en temps réel</p>
          </div>

          {showStream ? (
            <div className="mb-8">
              <LiveShoppingStream
                streamData={demoStreamData}
                onProductSelect={handleProductSelect}
                onPurchase={handlePurchase}
                onLike={handleLike}
                onShare={handleShare}
                className="w-full max-w-6xl mx-auto"
              />
            </div>
          ) : (
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold text-white mb-4">Aucun stream actif</h2>
              <p className="text-gray-300 mb-6">Revenez plus tard pour voir les streams en direct.</p>
              <button
                onClick={() => setShowStream(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg"
              >
                Voir le stream de démonstration
              </button>
            </div>
          )}

          {/* Section des streams passés */}
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-white mb-6">Streams Passés</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-gray-800 rounded-lg overflow-hidden">
                  <div className="aspect-video bg-gray-700 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-2">
                        <span className="text-2xl">📱</span>
                      </div>
                      <p className="text-gray-400 text-sm">Stream terminé</p>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="text-white font-semibold mb-2">Vente Flash Électronique #{i}</h3>
                    <p className="text-gray-400 text-sm mb-3">Stream du {new Date(Date.now() - i * 86400000).toLocaleDateString()}</p>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>👥 {Math.floor(Math.random() * 500) + 100} viewers</span>
                      <span>❤️ {Math.floor(Math.random() * 200) + 50}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </VideoCallProvider>
  );
};

export default LiveShoppingPage;