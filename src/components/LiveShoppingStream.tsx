import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ShoppingCart, Heart, MessageCircle, Share2, Play, Pause, Volume2, VolumeX, Maximize2, Minimize2 } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  price: string;
  originalPrice?: string;
  image: string;
  description: string;
  stock: number;
}

interface LiveStreamData {
  id: string;
  title: string;
  description: string;
  streamer: {
    id: string;
    name: string;
    avatar?: string;
  };
  products: Product[];
  currentProductIndex: number;
  viewers: number;
  likes: number;
  isLive: boolean;
  startTime: Date;
}

interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  message: string;
  timestamp: Date;
  type: 'message' | 'purchase' | 'like';
}

interface LiveShoppingStreamProps {
  streamData: LiveStreamData;
  onProductSelect?: (product: Product) => void;
  onPurchase?: (product: Product) => void;
  onLike?: () => void;
  onShare?: () => void;
  className?: string;
}

const LiveShoppingStream: React.FC<LiveShoppingStreamProps> = ({
  streamData,
  onProductSelect,
  onPurchase,
  onLike,
  onShare,
  className = ''
}) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showChat, setShowChat] = useState(true);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentProduct, setCurrentProduct] = useState<Product>(streamData.products[0]);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();

  // Animation du stream vidéo simulé
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frameCount = 0;

    const animate = () => {
      frameCount++;
      
      // Fond animé
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      const hue = (frameCount * 0.5) % 360;
      gradient.addColorStop(0, `hsl(${hue}, 70%, 20%)`);
      gradient.addColorStop(1, `hsl(${(hue + 60) % 360}, 70%, 10%)`);
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Particules animées
      for (let i = 0; i < 50; i++) {
        const x = (Math.sin(frameCount * 0.01 + i) * 100) + canvas.width / 2;
        const y = (Math.cos(frameCount * 0.015 + i) * 50) + canvas.height / 2;
        const size = Math.sin(frameCount * 0.02 + i) * 3 + 3;
        
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${(hue + i * 10) % 360}, 70%, 60%, 0.6)`;
        ctx.fill();
      }

      // Texte "LIVE"
      ctx.font = 'bold 48px Arial';
      ctx.fillStyle = '#ff0000';
      ctx.textAlign = 'center';
      ctx.fillText('LIVE', canvas.width / 2, 100);

      // Indicateur de produit actuel
      if (currentProduct) {
        ctx.font = '24px Arial';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(currentProduct.name, canvas.width / 2, canvas.height - 100);
        ctx.font = '18px Arial';
        ctx.fillText(currentProduct.price, canvas.width / 2, canvas.height - 70);
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [currentProduct]);

  // Messages de chat simulés
  useEffect(() => {
    const interval = setInterval(() => {
      const messages = [
        { userId: 'user1', username: 'Marie', message: 'Super produit ! 💕' },
        { userId: 'user2', username: 'Jean', message: 'Est-ce que c\'est disponible en rouge ?' },
        { userId: 'user3', username: 'Sophie', message: 'Je l\'ai acheté, très satisfaite !' },
        { userId: 'user4', username: 'Pierre', message: 'Quelle est la taille ?' },
        { userId: 'user5', username: 'Lucie', message: 'Le prix est super !' }
      ];

      const randomMessage = messages[Math.floor(Math.random() * messages.length)];
      
      setChatMessages(prev => [...prev, {
        id: `msg_${Date.now()}_${Math.random()}`,
        ...randomMessage,
        timestamp: new Date(),
        type: 'message'
      }].slice(-50)); // Garder les 50 derniers messages
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Auto-scroll du chat
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const message: ChatMessage = {
      id: `msg_${Date.now()}`,
      userId: 'current_user',
      username: 'Vous',
      message: newMessage,
      timestamp: new Date(),
      type: 'message'
    };

    setChatMessages(prev => [...prev, message]);
    setNewMessage('');
  };

  const handleProductNavigation = (direction: 'prev' | 'next') => {
    const currentIndex = streamData.products.findIndex(p => p.id === currentProduct.id);
    let newIndex;
    
    if (direction === 'prev') {
      newIndex = currentIndex > 0 ? currentIndex - 1 : streamData.products.length - 1;
    } else {
      newIndex = currentIndex < streamData.products.length - 1 ? currentIndex + 1 : 0;
    }
    
    setCurrentProduct(streamData.products[newIndex]);
    if (onProductSelect) {
      onProductSelect(streamData.products[newIndex]);
    }
  };

  const formatDuration = (startTime: Date) => {
    const duration = Date.now() - startTime.getTime();
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
      });
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  return (
    <div className={`bg-black rounded-lg overflow-hidden ${className} ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* Zone vidéo principale */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={800}
          height={450}
          className="w-full h-auto"
        />
        
        {/* Overlay d'information */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
          <div className="bg-black bg-opacity-70 text-white px-3 py-2 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-semibold">LIVE</span>
              <span className="text-sm">{formatDuration(streamData.startTime)}</span>
            </div>
            <div className="text-xs text-gray-300 mt-1">
              {streamData.viewers} viewers
            </div>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="bg-black bg-opacity-70 text-white p-2 rounded-lg hover:bg-opacity-80 transition-colors"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <button
              onClick={toggleFullscreen}
              className="bg-black bg-opacity-70 text-white p-2 rounded-lg hover:bg-opacity-80 transition-colors"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Informations du streamer */}
        <div className="absolute bottom-4 left-4 bg-black bg-opacity-70 text-white px-3 py-2 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-sm font-bold">{streamData.streamer.name[0]}</span>
            </div>
            <div>
              <div className="text-sm font-semibold">{streamData.streamer.name}</div>
              <div className="text-xs text-gray-300">{streamData.title}</div>
            </div>
          </div>
        </div>

        {/* Contrôles de lecture */}
        <div className="absolute bottom-4 right-4">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="bg-black bg-opacity-70 text-white p-3 rounded-lg hover:bg-opacity-80 transition-colors"
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Zone d'interaction */}
      <div className="bg-gray-900 text-white">
        <div className="flex">
          {/* Zone produit */}
          <div className="flex-1 p-4">
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4">Produits en Vedette</h3>
              
              {/* Produit actuel */}
              <div className="bg-gray-700 rounded-lg p-4 mb-4">
                <div className="flex space-x-4">
                  <img
                    src={currentProduct.image}
                    alt={currentProduct.name}
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h4 className="font-semibold">{currentProduct.name}</h4>
                    <p className="text-sm text-gray-300 mb-2">{currentProduct.description}</p>
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-bold text-green-400">{currentProduct.price}</span>
                      {currentProduct.originalPrice && (
                        <span className="text-sm text-gray-400 line-through">{currentProduct.originalPrice}</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-400">
                      Stock: {currentProduct.stock} unités
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-2 mt-4">
                  <button
                    onClick={() => handleProductNavigation('prev')}
                    className="bg-gray-600 hover:bg-gray-500 px-3 py-1 rounded text-sm"
                  >
                    ← Précédent
                  </button>
                  <button
                    onClick={() => onPurchase && onPurchase(currentProduct)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded flex items-center justify-center space-x-2"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>Acheter Maintenant</span>
                  </button>
                  <button
                    onClick={() => handleProductNavigation('next')}
                    className="bg-gray-600 hover:bg-gray-500 px-3 py-1 rounded text-sm"
                  >
                    Suivant →
                  </button>
                </div>
              </div>

              {/* Galerie de produits */}
              <div className="flex space-x-2 overflow-x-auto pb-2">
                {streamData.products.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => setCurrentProduct(product)}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 ${
                      currentProduct.id === product.id ? 'border-blue-500' : 'border-gray-600'
                    }`}
                  >
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Zone chat */}
          {showChat && (
            <div className="w-80 bg-gray-800 border-l border-gray-700">
              <div className="p-4 border-b border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Chat en Direct</h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={onLike}
                      className="text-pink-500 hover:text-pink-400"
                    >
                      <Heart className="w-4 h-4" />
                    </button>
                    <button
                      onClick={onShare}
                      className="text-blue-500 hover:text-blue-400"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
              
              <div
                ref={chatContainerRef}
                className="h-64 overflow-y-auto p-4 space-y-2"
              >
                {chatMessages.map((msg) => (
                  <div key={msg.id} className="text-sm">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-blue-400">{msg.username}</span>
                      <span className="text-xs text-gray-400">
                        {msg.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-gray-200">{msg.message}</p>
                  </div>
                ))}
              </div>
              
              <div className="p-4 border-t border-gray-700">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Écrire un message..."
                    className="flex-1 bg-gray-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleSendMessage}
                    className="bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded-lg"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bouton toggle chat (mobile) */}
      <button
        onClick={() => setShowChat(!showChat)}
        className="md:hidden fixed bottom-4 right-4 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg"
      >
        <MessageCircle className="w-5 h-5" />
      </button>
    </div>
  );
};

export default LiveShoppingStream;