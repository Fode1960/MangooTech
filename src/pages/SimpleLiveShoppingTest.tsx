import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Phone, Users, MessageCircle, Send } from 'lucide-react';
import WebRTCCall from '../components/WebRTCCall';
import { getWsUrl } from '../utils/realtimeUrls';

// Version simplifiée sans authentification pour les tests
const SimpleLiveShoppingTest: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [roomId, setRoomId] = useState('test-room-8888-8889');
  const [userId, setUserId] = useState('');
  const [role, setRole] = useState<'vendor' | 'client'>('client');
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<Array<{user: string, message: string, timestamp: Date}>>([]);
  const [newMessage, setNewMessage] = useState('');
  const [viewerCount, setViewerCount] = useState(0);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [participantId, setParticipantId] = useState('');
  const [currentProduct, setCurrentProduct] = useState<any>(null);

  // Récupérer les paramètres URL
  useEffect(() => {
    const urlUserId = searchParams.get('userId');
    const urlRole = searchParams.get('role') as 'vendor' | 'client';
    const urlRoomId = searchParams.get('roomId');

    if (urlUserId) setUserId(urlUserId);
    if (urlRole) setRole(urlRole);
    if (urlRoomId) setRoomId(urlRoomId);
  }, [searchParams]);

  // Connexion WebSocket
  useEffect(() => {
    if (!userId || !roomId) return;

    const websocket = new WebSocket(getWsUrl(0, '/webrtc-ws'));
    
    websocket.onopen = () => {
      console.log('WebSocket connecté');
      setIsConnected(true);
      
      // Rejoindre la room
      websocket.send(JSON.stringify({
        type: 'join-live-shopping',
        roomId: roomId,
        userId: userId,
        role: role
      }));
    };

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('Message reçu:', data);

      switch (data.type) {
        case 'room-state':
          setViewerCount(data.data.viewerCount);
          setParticipantId(data.data.participants.toString());
          break;
        case 'user-joined':
          setViewerCount(data.data.viewerCount);
          break;
        case 'user-left':
          setViewerCount(data.data.viewerCount);
          break;
        case 'live-chat-message':
          setMessages(prev => [...prev, {
            user: data.data.name || data.data.userId,
            message: data.data.message,
            timestamp: new Date(data.data.timestamp)
          }]);
          break;
        case 'product-selected':
          // Afficher le produit sélectionné
          setCurrentProduct(data.data);
          console.log('Produit sélectionné:', data.data);
          break;
      }
    };

    websocket.onclose = () => {
      console.log('WebSocket déconnecté');
      setIsConnected(false);
    };

    websocket.onerror = (error) => {
      console.error('Erreur WebSocket:', error);
    };

    setWs(websocket);

    return () => {
      websocket.close();
    };
  }, [userId, roomId, role]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() && ws && isConnected) {
      ws.send(JSON.stringify({
        type: 'live-chat-message',
        data: {
          user: userId,
          message: newMessage,
          roomId: roomId
        }
      }));
      setNewMessage('');
    }
  };

  // Produits de démonstration
  const demoProducts = [
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
      image: 'https://images.unsplash.com/photo-1600294037681-c80b4efe5bc8?w=300',
      description: 'Écouteurs avec réduction de bruit',
      stock: 50
    }
  ];

  if (!userId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full">
          <div className="text-center mb-8">
            <div className="text-4xl mb-4">🎧</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Test WebRTC Live Shopping</h1>
            <p className="text-gray-600">Testez le comportement des boutons d'appel WebRTC</p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Votre ID Utilisateur
              </label>
              <input
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Entrez votre ID (ex: 8888 ou 8889)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rôle
              </label>
              <div className="flex space-x-4">
                <button
                  onClick={() => setRole('vendor')}
                  className={`flex-1 py-2 px-4 rounded-lg border transition-colors ${
                    role === 'vendor'
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  Vendeur
                </button>
                <button
                  onClick={() => setRole('client')}
                  className={`flex-1 py-2 px-4 rounded-lg border transition-colors ${
                    role === 'client'
                      ? 'bg-green-500 text-white border-green-500'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  Client
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm text-gray-600 text-center">Configurations rapides:</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    setUserId('8888');
                    setRole('vendor');
                  }}
                  className="py-2 px-4 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors text-sm"
                >
                  Config 8888 (Vendeur)
                </button>
                <button
                  onClick={() => {
                    setUserId('8889');
                    setRole('client');
                  }}
                  className="py-2 px-4 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 transition-colors text-sm"
                >
                  Config 8889 (Client)
                </button>
              </div>
            </div>

            <button
              onClick={() => {
                if (userId.trim()) {
                  // Recharger avec les paramètres
                  setSearchParams({ userId, role, roomId });
                }
              }}
              className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all font-medium"
            >
              Démarrer le test WebRTC
            </button>
          </div>

          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-800 mb-2">Instructions de test:</h3>
            <ol className="text-sm text-gray-600 space-y-1">
              <li>1. Ouvrez DEUX onglets/navigateurs</li>
              <li>2. Configurez 8888 comme vendeur dans le premier</li>
              <li>3. Configurez 8889 comme client dans le second</li>
              <li>4. Testez les boutons d'appel WebRTC</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">Live Shopping Test</h1>
              <div className="flex items-center space-x-2 bg-green-100 text-green-800 px-3 py-1 rounded-full">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                <span className="text-sm font-medium">{viewerCount} spectateurs</span>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              Room: {roomId} | ID: {userId} | Rôle: {role}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Zone principale - WebRTC */}
          <div className="lg:col-span-2 space-y-6">
            {/* WebRTC Call */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <WebRTCCall
              sessionId={roomId}
              vendorId={role === 'vendor' ? userId : 'vendor-001'}
              clientId={role === 'client' ? userId : 'client-001'}
              mode={role}
              onCallStart={() => console.log('Appel démarré')}
              onCallEnd={() => console.log('Appel terminé')}
            />
          </div>

          {/* Produit actuellement présenté */}
          {currentProduct && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">🎯 Produit en cours de présentation</h3>
              <div className="flex items-center space-x-4">
                <img src={currentProduct.image} alt={currentProduct.name} className="w-16 h-16 object-cover rounded" />
                <div>
                  <h4 className="font-medium text-gray-900">{currentProduct.name}</h4>
                  <p className="text-sm text-gray-600">{currentProduct.description}</p>
                  <p className="text-lg font-bold text-green-600">{currentProduct.price}€</p>
                </div>
              </div>
            </div>
          )}

            {/* Produits */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Produits en vente</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {demoProducts.map((product) => (
                  <div key={product.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-32 object-cover rounded-lg mb-3"
                    />
                    <h3 className="font-medium text-gray-900">{product.name}</h3>
                    <p className="text-sm text-gray-600 mb-2">{product.description}</p>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-lg font-bold text-green-600">{product.price}€</span>
                        <span className="text-sm text-gray-500 line-through ml-2">{product.originalPrice}€</span>
                      </div>
                      {role === 'vendor' && (
                        <button 
                          onClick={() => {
                            if (ws && isConnected) {
                              ws.send(JSON.stringify({
                                type: 'product-selected',
                                data: {
                                  id: product.id,
                                  name: product.name,
                                  price: product.price,
                                  image: product.image,
                                  description: product.description
                                }
                              }));
                            }
                          }}
                          className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 transition-colors"
                        >
                          Présenter
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Chat */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Chat</h2>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Users className="w-4 h-4" />
                <span>{viewerCount}</span>
              </div>
            </div>

            <div className="h-64 overflow-y-auto mb-4 p-3 bg-gray-50 rounded-lg">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Aucun message encore</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {messages.map((msg, index) => (
                    <div key={index} className="bg-white p-2 rounded border">
                      <div className="font-medium text-sm text-gray-900">{msg.user}</div>
                      <div className="text-gray-700">{msg.message}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <form onSubmit={handleSendMessage} className="space-y-3">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Tapez votre message..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center space-x-2"
              >
                <Send className="w-4 h-4" />
                <span>Envoyer</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleLiveShoppingTest;
