import React, { useState, useEffect } from 'react';

// MINI-BOUTIQUE ULTRA-SIMPLE - VERSION SANS ERREUR
function App() {
  // État simple
  const [currentPage, setCurrentPage] = useState('products');
  const [cart, setCart] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('stripe');
  const [darkMode, setDarkMode] = useState(false);
  const [user, setUser] = useState({ name: 'Invité', isLoggedIn: false });
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });

  // Produit unique - Cocomm DT740
  const product = {
    id: 1,
    name: 'Cocomm DT740',
    price: 150,
    stock: 10,
    description: 'Produit électronique haute performance'
  };

  // Effet pour le mode sombre
  useEffect(() => {
    const styles = `
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'Segoe UI', sans-serif; background: ${darkMode ? '#1a1a1a' : '#f5f5f5'}; color: ${darkMode ? '#fff' : '#333'}; }
      .container { max-width: 800px; margin: 0 auto; padding: 20px; }
      .header { background: ${darkMode ? '#2a2a2a' : '#fff'}; padding: 20px; border-radius: 10px; margin-bottom: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
      .product-card { background: ${darkMode ? '#2a2a2a' : '#fff'}; padding: 30px; border-radius: 15px; text-align: center; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
      .btn { padding: 12px 24px; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: bold; transition: all 0.3s ease; }
      .btn-primary { background: #4CAF50; color: white; }
      .btn-primary:hover { background: #45a049; transform: translateY(-2px); }
      .btn-secondary { background: #2196F3; color: white; margin-left: 10px; }
      .btn-secondary:hover { background: #1976D2; }
      .modal { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 1000; }
      .modal-content { background: ${darkMode ? '#2a2a2a' : '#fff'}; padding: 30px; border-radius: 15px; max-width: 400px; width: 90%; }
      .cart { background: ${darkMode ? '#2a2a2a' : '#fff'}; padding: 20px; border-radius: 10px; margin-top: 20px; }
      .login-form { background: ${darkMode ? '#2a2a2a' : '#fff'}; padding: 30px; border-radius: 15px; max-width: 300px; margin: 0 auto; }
      .form-group { margin-bottom: 15px; }
      .form-group input { width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 16px; background: ${darkMode ? '#1a1a1a' : '#fff'}; color: ${darkMode ? '#fff' : '#333'}; }
      .error { color: #f44336; margin-top: 10px; }
      .success { color: #4CAF50; margin-top: 10px; font-weight: bold; }
    `;
    
    const styleSheet = document.createElement("style");
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
    
    return () => {
      document.head.removeChild(styleSheet);
    };
  }, [darkMode]);

  // Fonctions simples
  const addToCart = () => {
    if (quantity > 0 && quantity <= product.stock) {
      const newItem = { ...product, quantity: quantity };
      setCart([newItem]);
      setSelectedProduct(null);
      setQuantity(1);
    }
  };

  const processPayment = (method) => {
    if (method === 'stripe') {
      alert('💳 Paiement Stripe simulé - Succès!');
    } else if (method === 'paypal') {
      alert('💰 Paiement PayPal simulé - Succès!');
    }
    setCart([]);
    setCurrentPage('products');
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (loginForm.email === 'admin@mangoo.tech' && loginForm.password === 'admin123') {
      setUser({ name: 'Admin', isLoggedIn: true });
      setLoginForm({ email: '', password: '' });
    } else {
      alert('Identifiants incorrects');
    }
  };

  const handleLogout = () => {
    setUser({ name: 'Invité', isLoggedIn: false });
    setCart([]);
    setCurrentPage('products');
  };

  // Rendu selon la page
  const renderContent = () => {
    if (currentPage === 'login') {
      return (
        <div className="login-form">
          <h2>Connexion</h2>
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <input
                type="email"
                placeholder="Email"
                value={loginForm.email}
                onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <input
                type="password"
                placeholder="Mot de passe"
                value={loginForm.password}
                onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary">Se connecter</button>
          </form>
          <p style={{marginTop: '15px', fontSize: '14px'}}>
            Test: admin@mangoo.tech / admin123
          </p>
        </div>
      );
    }

    if (currentPage === 'cart') {
      return (
        <div className="cart">
          <h2>🛒 Panier</h2>
          {cart.length === 0 ? (
            <p>Panier vide</p>
          ) : (
            <div>
              {cart.map((item, index) => (
                <div key={index} style={{marginBottom: '15px', padding: '15px', border: '1px solid #ddd', borderRadius: '8px'}}>
                  <h3>{item.name}</h3>
                  <p>Quantité: {item.quantity}</p>
                  <p>Prix: {item.price}€</p>
                  <p><strong>Total: {item.price * item.quantity}€</strong></p>
                </div>
              ))}
              <div style={{marginTop: '20px'}}>
                <h3>Total: {cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)}€</h3>
                <div style={{marginTop: '15px'}}>
                  <label>Méthode de paiement:</label>
                  <select 
                    value={paymentMethod} 
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    style={{marginLeft: '10px', padding: '8px', borderRadius: '5px'}}
                  >
                    <option value="stripe">💳 Stripe</option>
                    <option value="paypal">💰 PayPal</option>
                  </select>
                </div>
                <button 
                  onClick={() => processPayment(paymentMethod)}
                  className="btn btn-primary"
                  style={{marginTop: '15px'}}
                >
                  Payer maintenant
                </button>
              </div>
            </div>
          )}
        </div>
      );
    }

    // Page produits (par défaut)
    return (
      <div>
        <div className="product-card">
          <h2>📦 {product.name}</h2>
          <p style={{fontSize: '24px', color: '#4CAF50', fontWeight: 'bold', margin: '15px 0'}}>
            {product.price}€
          </p>
          <p style={{marginBottom: '20px'}}>{product.description}</p>
          <p style={{marginBottom: '20px', color: product.stock > 0 ? '#4CAF50' : '#f44336'}}>
            Stock: {product.stock > 0 ? `${product.stock} disponibles` : 'Rupture de stock'}
          </p>
          <button 
            onClick={() => setSelectedProduct(product)}
            disabled={product.stock === 0}
            className="btn btn-primary"
          >
            {product.stock > 0 ? 'Ajouter au panier' : 'Rupture de stock'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="container">
      <div className="header">
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <h1>🛍️ Mini-Boutique</h1>
          <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
            <button onClick={() => setDarkMode(!darkMode)} className="btn btn-secondary">
              {darkMode ? '☀️' : '🌙'}
            </button>
            {user.isLoggedIn ? (
              <>
                <span>Bonjour {user.name}</span>
                <button onClick={handleLogout} className="btn btn-secondary">Déconnexion</button>
              </>
            ) : (
              <button onClick={() => setCurrentPage('login')} className="btn btn-secondary">Connexion</button>
            )}
          </div>
        </div>
        
        <div style={{marginTop: '20px', display: 'flex', gap: '10px'}}>
          <button 
            onClick={() => setCurrentPage('products')} 
            className="btn btn-secondary"
            style={{background: currentPage === 'products' ? '#4CAF50' : ''}}
          >
            Produits
          </button>
          <button 
            onClick={() => setCurrentPage('cart')} 
            className="btn btn-secondary"
            style={{background: currentPage === 'cart' ? '#4CAF50' : ''}}
          >
            Panier ({cart.length})
          </button>
        </div>
      </div>

      {renderContent()}

      {/* Modal pour la quantité */}
      {selectedProduct && (
        <div className="modal" onClick={() => setSelectedProduct(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{selectedProduct.name}</h3>
            <p style={{margin: '15px 0'}}>Prix: {selectedProduct.price}€</p>
            <div className="form-group">
              <label>Quantité:</label>
              <input
                type="number"
                min="1"
                max={selectedProduct.stock}
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              />
            </div>
            <div style={{display: 'flex', gap: '10px', marginTop: '20px'}}>
              <button onClick={addToCart} className="btn btn-primary">Ajouter</button>
              <button onClick={() => setSelectedProduct(null)} className="btn btn-secondary">Annuler</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;