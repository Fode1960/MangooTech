import React, { useState, useEffect } from 'react';

// MINI-BOUTIQUE ULTRA-SIMPLE - VERSION AVEC DESIGN PROFESSIONNEL
function App() {
  // État simple
  const [currentPage, setCurrentPage] = useState('login');
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

  // Effet pour le style professionnel
  useEffect(() => {
    const styles = `
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; background: #f8f9fa; color: #333; line-height: 1.6; }
      .container { max-width: 1200px; margin: 0 auto; padding: 20px; min-height: 100vh; display: flex; flex-direction: column; justify-content: center; }
      
      /* Login Page Styles */
      .login-container { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; }
      .login-header { text-align: center; margin-bottom: 40px; }
      .login-icon { width: 60px; height: 60px; background: #ff6b35; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; }
      .login-icon::before { content: '🛒'; font-size: 24px; color: white; }
      .login-title { font-size: 32px; font-weight: 700; color: #333; margin-bottom: 8px; }
      .login-subtitle { font-size: 16px; color: #666; }
      
      .login-card { background: white; border-radius: 16px; padding: 40px; max-width: 400px; width: 100%; box-shadow: 0 4px 20px rgba(0,0,0,0.08); border: 1px solid #e9ecef; }
      .form-section { margin-bottom: 24px; }
      .form-label { display: block; font-size: 14px; font-weight: 600; color: #333; margin-bottom: 8px; }
      .form-input { width: 100%; padding: 12px 16px; border: 1px solid #e9ecef; border-radius: 8px; font-size: 16px; background: #f8f9fa; transition: all 0.2s ease; }
      .form-input:focus { outline: none; border-color: #ff6b35; background: white; box-shadow: 0 0 0 3px rgba(255,107,53,0.1); }
      .form-input::placeholder { color: #adb5bd; }
      
      .login-button { width: 100%; padding: 14px; background: #ff6b35; color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer; transition: all 0.2s ease; display: flex; align-items: center; justify-content: center; gap: 8px; }
      .login-button:hover { background: #e55a2b; transform: translateY(-1px); }
      .login-button::before { content: '🔒'; font-size: 14px; }
      
      .divider { text-align: center; margin: 32px 0; position: relative; }
      .divider::before { content: ''; position: absolute; top: 50%; left: 0; right: 0; height: 1px; background: #e9ecef; }
      .divider-text { background: white; padding: 0 16px; font-size: 14px; color: #666; position: relative; }
      
      .quick-access { margin-top: 24px; }
      .access-card { display: flex; align-items: center; justify-content: space-between; padding: 16px; background: white; border: 1px solid #e9ecef; border-radius: 8px; margin-bottom: 12px; cursor: pointer; transition: all 0.2s ease; }
      .access-card:hover { border-color: #ff6b35; transform: translateY(-1px); box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
      .access-info { display: flex; align-items: center; gap: 12px; }
      .access-icon { width: 32px; height: 32px; background: #f8f9fa; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
      .access-icon::before { content: '👤'; font-size: 16px; }
      .access-details { text-align: left; }
      .access-title { font-size: 14px; font-weight: 600; color: #333; }
      .access-email { font-size: 12px; color: #666; }
      .access-arrow { color: #666; font-size: 16px; }
      
      .signup-prompt { text-align: center; margin-top: 32px; }
      .signup-text { font-size: 14px; color: #666; }
      .signup-link { color: #ff6b35; text-decoration: none; font-weight: 600; }
      .signup-link:hover { text-decoration: underline; }
      
      .footer { text-align: center; margin-top: 40px; font-size: 12px; color: #adb5bd; }
      
      /* Main App Styles */
      .main-app { display: none; }
      .header { background: white; padding: 20px; border-radius: 12px; margin-bottom: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.08); }
      .product-card { background: white; padding: 30px; border-radius: 16px; text-align: center; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
      .btn { padding: 12px 24px; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: 600; transition: all 0.2s ease; }
      .btn-primary { background: #ff6b35; color: white; }
      .btn-primary:hover { background: #e55a2b; transform: translateY(-1px); }
      .btn-secondary { background: #6c757d; color: white; margin-left: 10px; }
      .btn-secondary:hover { background: #5a6268; }
    `;
    
    const styleSheet = document.createElement("style");
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
    
    return () => {
      document.head.removeChild(styleSheet);
    };
  }, []);

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
    if (loginForm.email === 'admin@mangoo.com' && loginForm.password === 'admin123') {
      setUser({ name: 'Admin', isLoggedIn: true });
      setLoginForm({ email: '', password: '' });
      setCurrentPage('products');
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
        <div className="login-container">
          <div className="login-header">
            <div className="login-icon"></div>
            <h1 className="login-title">Mini-Boutique</h1>
            <p className="login-subtitle">Votre commerce en ligne professionnel</p>
          </div>
          
          <div className="login-card">
            <form onSubmit={handleLogin}>
              <div className="form-section">
                <label className="form-label">Email Professionnel</label>
                <input
                  type="email"
                  placeholder="votre@email.com"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
                  className="form-input"
                  required
                />
              </div>
              <div className="form-section">
                <label className="form-label">Mot de passe sécurisé</label>
                <input
                  type="password"
                  placeholder="•••••"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                  className="form-input"
                  required
                />
              </div>
              <button type="submit" className="login-button">Se connecter →</button>
            </form>
            
            <div className="divider">
              <span className="divider-text">Accès rapide</span>
            </div>
            
            <div className="quick-access">
              <div className="access-card" onClick={() => setLoginForm({email: 'admin@mangoo.com', password: 'admin123'})}>
                <div className="access-info">
                  <div className="access-icon"></div>
                  <div className="access-details">
                    <div className="access-title">Administrateur</div>
                    <div className="access-email">admin@mangoo.com</div>
                  </div>
                </div>
                <div className="access-arrow">→</div>
              </div>
              <div className="access-card" onClick={() => setLoginForm({email: 'demo@example.com', password: 'demo123'})}>
                <div className="access-info">
                  <div className="access-icon"></div>
                  <div className="access-details">
                    <div className="access-title">Utilisateur</div>
                    <div className="access-email">demo@example.com</div>
                  </div>
                </div>
                <div className="access-arrow">→</div>
              </div>
              <div className="access-card" onClick={() => setLoginForm({email: 'user@test.com', password: 'user123'})}>
                <div className="access-info">
                  <div className="access-icon"></div>
                  <div className="access-details">
                    <div className="access-title">Utilisateur</div>
                    <div className="access-email">user@test.com</div>
                  </div>
                </div>
                <div className="access-arrow">→</div>
              </div>
            </div>
            
            <div className="signup-prompt">
              <span className="signup-text">Pas encore de compte ? </span>
              <a href="#" className="signup-link">S'inscrire</a>
            </div>
          </div>
          
          <div className="footer">
            © 2026 Mini-Boutique by Mangoo Tech
          </div>
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
          <p style={{fontSize: '24px', color: '#ff6b35', fontWeight: 'bold', margin: '15px 0'}}>
            {product.price}€
          </p>
          <p style={{marginBottom: '20px'}}>{product.description}</p>
          <p style={{marginBottom: '20px', color: product.stock > 0 ? '#28a745' : '#dc3545'}}>
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
    <div style={{minHeight: '100vh'}}>
      {currentPage === 'login' ? (
        renderContent()
      ) : (
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
                style={{background: currentPage === 'products' ? '#ff6b35' : ''}}
              >
                Produits
              </button>
              <button 
                onClick={() => setCurrentPage('cart')} 
                className="btn btn-secondary"
                style={{background: currentPage === 'cart' ? '#ff6b35' : ''}}
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
      )}
    </div>
  );
}

export default App;