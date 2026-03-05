import React, { useState, useEffect } from 'react';

const LiveShoppingTest = () => {
  const [roomId, setRoomId] = useState('');
  const [userId, setUserId] = useState('');
  const [role, setRole] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [socket, setSocket] = useState(null);
  const [products, setProducts] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentProduct, setCurrentProduct] = useState(null);

  useEffect(() => {
    // Parse URL parameters
    const params = new URLSearchParams(window.location.search);
    const urlRoomId = params.get('roomId') || 'test-room';
    const urlUserId = params.get('userId') || '8888';
    const urlRole = params.get('role') || 'vendor';
    
    setRoomId(urlRoomId);
    setUserId(urlUserId);
    setRole(urlRole);
  }, []);

  const connectToRoom = () => {
    if (!roomId || !userId || !role) return;
    
    // Simulate WebSocket connection
    setIsConnected(true);
    
    // Add some mock products for testing
    const mockProducts = [
      { id: 1, name: 'Produit Test 1', price: 29.99, description: 'Description du produit 1' },
      { id: 2, name: 'Produit Test 2', price: 49.99, description: 'Description du produit 2' },
      { id: 3, name: 'Produit Test 3', price: 19.99, description: 'Description du produit 3' }
    ];
    
    setProducts(mockProducts);
    
    // Add welcome message
    setMessages([{
      id: Date.now(),
      userId: 'system',
      message: `${userId} (${role}) a rejoint la room ${roomId}`,
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  const disconnectFromRoom = () => {
    setIsConnected(false);
    setSocket(null);
    setMessages(prev => [...prev, {
      id: Date.now(),
      userId: 'system',
      message: `${userId} (${role}) a quitté la room`,
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  const sendMessage = () => {
    if (!newMessage.trim() || !isConnected) return;
    
    const message = {
      id: Date.now(),
      userId,
      message: newMessage,
      timestamp: new Date().toLocaleTimeString()
    };
    
    setMessages(prev => [...prev, message]);
    setNewMessage('');
  };

  const presentProduct = (product) => {
    if (role !== 'vendor' || !isConnected) return;
    
    setCurrentProduct(product);
    setMessages(prev => [...prev, {
      id: Date.now(),
      userId: 'system',
      message: `🛍️ ${userId} présente: ${product.name} - €${product.price}`,
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        background: 'white',
        borderRadius: '20px',
        padding: '30px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{
            fontSize: '2.5em',
            color: '#333',
            marginBottom: '10px',
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>🛍️ Live Shopping Test</h1>
          <p style={{
            color: '#666',
            fontSize: '1.2em',
            marginBottom: '20px'
          }}>Room: {roomId} | User: {userId} | Role: {role}</p>
        </div>

        <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
          <button
            onClick={connectToRoom}
            disabled={isConnected}
            style={{
              padding: '12px 24px',
              background: isConnected ? '#ccc' : 'linear-gradient(135deg, #4CAF50, #45a049)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontWeight: '600',
              cursor: isConnected ? 'not-allowed' : 'pointer',
              fontSize: '1em'
            }}
          >
            {isConnected ? '✅ Connecté' : '🔗 Connecter'}
          </button>
          
          <button
            onClick={disconnectFromRoom}
            disabled={!isConnected}
            style={{
              padding: '12px 24px',
              background: !isConnected ? '#ccc' : 'linear-gradient(135deg, #f44336, #d32f2f)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontWeight: '600',
              cursor: !isConnected ? 'not-allowed' : 'pointer',
              fontSize: '1em'
            }}
          >
            🔌 Déconnecter
          </button>
        </div>

        {isConnected && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <h3>💬 Chat</h3>
              <div style={{
                height: '300px',
                border: '1px solid #ddd',
                borderRadius: '10px',
                padding: '10px',
                overflowY: 'auto',
                background: '#f9f9f9'
              }}>
                {messages.map(msg => (
                  <div key={msg.id} style={{
                    marginBottom: '10px',
                    padding: '8px',
                    background: msg.userId === 'system' ? '#e3f2fd' : '#fff',
                    borderRadius: '5px',
                    borderLeft: msg.userId === 'system' ? '3px solid #2196F3' : '3px solid #4CAF50'
                  }}>
                    <strong>{msg.userId}:</strong> {msg.message}
                    <div style={{ fontSize: '0.8em', color: '#666', marginTop: '2px' }}>
                      {msg.timestamp}
                    </div>
                  </div>
                ))}
              </div>
              
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Tapez votre message..."
                  style={{
                    flex: 1,
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '5px'
                  }}
                />
                <button
                  onClick={sendMessage}
                  style={{
                    padding: '10px 20px',
                    background: 'linear-gradient(135deg, #2196F3, #1976D2)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer'
                  }}
                >
                  Envoyer
                </button>
              </div>
            </div>

            <div>
              <h3>🛍️ Produits</h3>
              {role === 'vendor' ? (
                <div>
                  {products.map(product => (
                    <div key={product.id} style={{
                      background: currentProduct?.id === product.id ? '#e8f5e8' : '#fff',
                      border: '1px solid #ddd',
                      borderRadius: '10px',
                      padding: '15px',
                      marginBottom: '10px'
                    }}>
                      <h4>{product.name}</h4>
                      <p>{product.description}</p>
                      <p><strong>Prix: €{product.price}</strong></p>
                      <button
                        onClick={() => presentProduct(product)}
                        style={{
                          padding: '8px 16px',
                          background: 'linear-gradient(135deg, #FF9800, #F57C00)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '5px',
                          cursor: 'pointer'
                        }}
                      >
                        📢 Présenter
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div>
                  {currentProduct ? (
                    <div style={{
                      background: '#e8f5e8',
                      border: '2px solid #4CAF50',
                      borderRadius: '10px',
                      padding: '20px'
                    }}>
                      <h4>🛍️ Produit Actuel</h4>
                      <h3>{currentProduct.name}</h3>
                      <p>{currentProduct.description}</p>
                      <p><strong>Prix: €{currentProduct.price}</strong></p>
                    </div>
                  ) : (
                    <div style={{
                      textAlign: 'center',
                      padding: '40px',
                      color: '#666'
                    }}>
                      <p>Aucun produit présenté pour le moment</p>
                      <p>En attente du vendeur...</p>
                    </div>
                  )}
                  
                  <div style={{ marginTop: '20px' }}>
                    <h4>📋 Tous les produits</h4>
                    {products.map(product => (
                      <div key={product.id} style={{
                        background: '#f9f9f9',
                        border: '1px solid #ddd',
                        borderRadius: '5px',
                        padding: '10px',
                        marginBottom: '5px'
                      }}>
                        <strong>{product.name}</strong> - €{product.price}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {!isConnected && (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            color: '#666'
          }}>
            <h3>🔗 Connectez-vous pour commencer</h3>
            <p>Cliquez sur le bouton "Connecter" pour rejoindre la room et commencer le test</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveShoppingTest;