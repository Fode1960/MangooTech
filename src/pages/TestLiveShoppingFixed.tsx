import React, { useState, useEffect } from 'react';

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  description: string;
}

interface ChatMessage {
  id: string;
  user: string;
  message: string;
  timestamp: Date;
}

export default function TestLiveShoppingFixed() {
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [status, setStatus] = useState('Prêt');

  const products: Product[] = [
    {
      id: '1',
      name: 'iPhone 15 Pro',
      price: 999,
      image: 'https://via.placeholder.com/300x200/4F46E5/FFFFFF?text=iPhone+15+Pro',
      description: 'Le dernier iPhone avec puce A17 Pro'
    },
    {
      id: '2',
      name: 'MacBook Air M2',
      price: 1299,
      image: 'https://via.placeholder.com/300x200/10B981/FFFFFF?text=MacBook+Air+M2',
      description: 'Ultra-fin et puissant avec puce M2'
    },
    {
      id: '3',
      name: 'AirPods Pro',
      price: 249,
      image: 'https://via.placeholder.com/300x200/F59E0B/FFFFFF?text=AirPods+Pro',
      description: 'Casque avec réduction de bruit active'
    }
  ];

  const startLive = () => {
    setIsLiveActive(true);
    setStatus('Live actif');
    setViewerCount(Math.floor(Math.random() * 50) + 10);
    
    // Simuler des messages de chat
    const initialMessages: ChatMessage[] = [
      { id: '1', user: 'Alice', message: 'Super produit !', timestamp: new Date() },
      { id: '2', user: 'Bob', message: 'Quelle est la réduction ?', timestamp: new Date() },
      { id: '3', user: 'Carol', message: 'Je l\'ai acheté la semaine dernière, top !', timestamp: new Date() }
    ];
    setChatMessages(initialMessages);

    // Simuler l'arrivée de nouveaux viewers
    const viewerInterval = setInterval(() => {
      setViewerCount(prev => prev + Math.floor(Math.random() * 3));
    }, 3000);

    // Nettoyer à la désactivation
    setTimeout(() => {
      clearInterval(viewerInterval);
    }, 60000);
  };

  const stopLive = () => {
    setIsLiveActive(false);
    setStatus('Live arrêté');
    setViewerCount(0);
  };

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

  const simulatePurchase = (product: Product) => {
    const purchaseMessage: ChatMessage = {
      id: Date.now().toString(),
      user: 'Système',
      message: `🎉 ${product.name} acheté pour $${product.price} !`,
      timestamp: new Date()
    };
    setChatMessages(prev => [...prev, purchaseMessage]);
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#111827', 
      color: 'white', 
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '20px', textAlign: 'center' }}>
          🛍️ Test Live Shopping
        </h1>

        {/* Zone de streaming */}
        <div style={{ 
          backgroundColor: '#1f2937', 
          borderRadius: '12px', 
          padding: '20px', 
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold' }}>Live Shopping Démo</h2>
              <p style={{ color: '#9ca3af' }}>Présentation des meilleurs produits</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ef4444' }}>
                👥 {viewerCount}
              </div>
              <div style={{ fontSize: '14px', color: '#9ca3af' }}>spectateurs</div>
            </div>
          </div>

          {/* Zone vidéo */}
          <div style={{ 
            width: '100%', 
            height: '400px', 
            backgroundColor: '#374151', 
            borderRadius: '8px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            marginBottom: '20px',
            position: 'relative'
          }}>
            {isLiveActive ? (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '64px', marginBottom: '20px' }}>📹</div>
                <h3 style={{ fontSize: '24px', marginBottom: '10px' }}>Live en cours</h3>
                <p style={{ color: '#9ca3af' }}>Présentation des produits en direct</p>
                <div style={{ 
                  position: 'absolute', 
                  top: '20px', 
                  right: '20px', 
                  backgroundColor: '#ef4444', 
                  padding: '8px 16px', 
                  borderRadius: '20px',
                  fontWeight: 'bold'
                }}>
                  🔴 LIVE
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '64px', marginBottom: '20px' }}>⏸️</div>
                <h3 style={{ fontSize: '24px', marginBottom: '10px' }}>Live inactif</h3>
                <p style={{ color: '#9ca3af' }}>Cliquez sur démarrer pour commencer</p>
              </div>
            )}
          </div>

          {/* Contrôles */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            {!isLiveActive ? (
              <button
                onClick={startLive}
                style={{
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                🔴 Démarrer le live
              </button>
            ) : (
              <button
                onClick={stopLive}
                style={{
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                ⏹️ Arrêter le live
              </button>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {/* Produits */}
          <div style={{ 
            backgroundColor: '#1f2937', 
            borderRadius: '12px', 
            padding: '20px'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px' }}>
              Produits ({products.length})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {products.map(product => (
                <div
                  key={product.id}
                  style={{
                    backgroundColor: selectedProduct?.id === product.id ? '#374151' : '#111827',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    padding: '15px',
                    cursor: 'pointer'
                  }}
                  onClick={() => setSelectedProduct(product)}
                >
                  <div style={{ display: 'flex', gap: '15px' }}>
                    <img
                      src={product.image}
                      alt={product.name}
                      style={{
                        width: '80px',
                        height: '60px',
                        borderRadius: '6px',
                        objectFit: 'cover'
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <h4 style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                        {product.name}
                      </h4>
                      <p style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '5px' }}>
                        {product.description}
                      </p>
                      <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#10b981' }}>
                        ${product.price}
                      </p>
                    </div>
                  </div>
                  {isLiveActive && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        simulatePurchase(product);
                      }}
                      style={{
                        backgroundColor: '#10b981',
                        color: 'white',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        fontSize: '14px',
                        cursor: 'pointer',
                        marginTop: '10px',
                        width: '100%'
                      }}
                    >
                      Acheter maintenant
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Chat */}
          <div style={{ 
            backgroundColor: '#1f2937', 
            borderRadius: '12px', 
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            height: '500px'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px' }}>
              Chat en direct
            </h3>
            <div
              style={{
                flex: 1,
                backgroundColor: '#111827',
                borderRadius: '8px',
                padding: '15px',
                marginBottom: '15px',
                overflowY: 'auto',
                maxHeight: '350px'
              }}
            >
              {chatMessages.length === 0 ? (
                <p style={{ color: '#9ca3af', textAlign: 'center' }}>
                  Aucun message pour le moment...
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {chatMessages.map(msg => (
                    <div
                      key={msg.id}
                      style={{
                        backgroundColor: msg.user === 'Système' ? '#1f2937' : '#374151',
                        borderRadius: '8px',
                        padding: '10px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                        <span style={{ fontWeight: 'bold', color: msg.user === 'Vous' ? '#3b82f6' : '#9ca3af' }}>
                          {msg.user}
                        </span>
                        <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                          {msg.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                      <p style={{ margin: 0 }}>{msg.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Tapez votre message..."
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                style={{
                  flex: 1,
                  backgroundColor: '#374151',
                  border: '1px solid #4b5563',
                  borderRadius: '6px',
                  padding: '10px',
                  color: 'white',
                  fontSize: '14px'
                }}
              />
              <button
                onClick={sendMessage}
                style={{
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  padding: '10px 16px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Envoyer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}