import { useState, useEffect } from 'react'

// MINI-BOUTIQUE ULTRA-SIMPLE - VERSION PROPRE
function App() {
  // État simple
  const [currentPage, setCurrentPage] = useState('products')
  const [cart, setCart] = useState([])
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [paymentMethod, setPaymentMethod] = useState('stripe')
  const [darkMode, setDarkMode] = useState(false)
  const [user, setUser] = useState({ name: 'Invité', isLoggedIn: false })
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })

  // Produit unique - Cocomm DT740
  const product = {
    id: 1,
    name: 'Cocomm DT740',
    price: 150,
    stock: 10,
    description: 'Produit électronique haute performance'
  }

  // Injection de styles CSS
  useEffect(() => {
    const styles = `
      .app-container {
        min-height: 100vh;
        transition: background-color 0.3s ease;
      }
      .app-container.dark {
        background-color: #1a1a1a;
        color: white;
      }
      .header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 1rem 2rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      }
      .nav-buttons {
        display: flex;
        gap: 1rem;
      }
      .nav-button {
        background: rgba(255,255,255,0.2);
        border: none;
        color: white;
        padding: 0.5rem 1rem;
        border-radius: 5px;
        cursor: pointer;
        transition: background-color 0.3s;
      }
      .nav-button:hover {
        background: rgba(255,255,255,0.3);
      }
      .dark-toggle {
        background: rgba(255,255,255,0.2);
        border: none;
        color: white;
        padding: 0.5rem;
        border-radius: 50%;
        cursor: pointer;
        font-size: 1.2rem;
      }
      .product-card {
        background: white;
        border-radius: 10px;
        padding: 2rem;
        margin: 2rem auto;
        max-width: 400px;
        box-shadow: 0 5px 20px rgba(0,0,0,0.1);
        text-align: center;
      }
      .dark .product-card {
        background: #2a2a2a;
        color: white;
      }
      .product-title {
        font-size: 1.5rem;
        font-weight: bold;
        margin-bottom: 1rem;
        color: #333;
      }
      .dark .product-title {
        color: white;
      }
      .product-price {
        font-size: 2rem;
        color: #e74c3c;
        font-weight: bold;
        margin: 1rem 0;
      }
      .product-stock {
        color: #27ae60;
        margin-bottom: 1rem;
      }
      .buy-button {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        padding: 1rem 2rem;
        border-radius: 5px;
        font-size: 1.1rem;
        cursor: pointer;
        transition: transform 0.3s;
      }
      .buy-button:hover {
        transform: translateY(-2px);
      }
      .cart {
        background: white;
        border-radius: 10px;
        padding: 2rem;
        margin: 2rem;
        box-shadow: 0 5px 20px rgba(0,0,0,0.1);
      }
      .dark .cart {
        background: #2a2a2a;
        color: white;
      }
      .modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
      }
      .modal-content {
        background: white;
        padding: 2rem;
        border-radius: 10px;
        max-width: 400px;
        width: 90%;
      }
      .dark .modal-content {
        background: #2a2a2a;
        color: white;
      }
      .quantity-selector {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 1rem;
        margin: 1rem 0;
      }
      .quantity-button {
        background: #667eea;
        color: white;
        border: none;
        width: 30px;
        height: 30px;
        border-radius: 50%;
        cursor: pointer;
        font-size: 1.2rem;
      }
      .payment-methods {
        display: flex;
        gap: 1rem;
        margin: 1rem 0;
        justify-content: center;
      }
      .payment-method {
        padding: 0.5rem 1rem;
        border: 2px solid #ddd;
        border-radius: 5px;
        cursor: pointer;
        transition: border-color 0.3s;
      }
      .payment-method.selected {
        border-color: #667eea;
        background: rgba(102, 126, 234, 0.1);
      }
      .login-form {
        background: white;
        padding: 2rem;
        border-radius: 10px;
        margin: 2rem auto;
        max-width: 300px;
        box-shadow: 0 5px 20px rgba(0,0,0,0.1);
      }
      .dark .login-form {
        background: #2a2a2a;
        color: white;
      }
      .form-input {
        width: 100%;
        padding: 0.5rem;
        margin: 0.5rem 0;
        border: 1px solid #ddd;
        border-radius: 5px;
      }
      .dark .form-input {
        background: #333;
        color: white;
        border-color: #555;
      }
      .form-button {
        width: 100%;
        background: #667eea;
        color: white;
        border: none;
        padding: 0.75rem;
        border-radius: 5px;
        cursor: pointer;
        margin-top: 1rem;
      }
    `
    
    const styleSheet = document.createElement('style')
    styleSheet.textContent = styles
    document.head.appendChild(styleSheet)

    // Nettoyer le style lors du démontage
    return () => {
      document.head.removeChild(styleSheet)
    }
  }, [])

  // Fonctions de gestion
  const addToCart = () => {
    if (quantity > 0 && quantity <= product.stock) {
      const existingItem = cart.find(item => item.id === product.id)
      if (existingItem) {
        setCart(cart.map(item => 
          item.id === product.id 
            ? { ...item, quantity: item.quantity + quantity }
            : item
        ))
      } else {
        setCart([...cart, { ...product, quantity }])
      }
      setSelectedProduct(null)
      setQuantity(1)
      alert(`✅ ${quantity} ${product.name}${quantity > 1 ? 's' : ''} ajouté(s) au panier !`)
    }
  }

  const processPayment = () => {
    if (cart.length === 0) {
      alert('🛒 Votre panier est vide !')
      return
    }

    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    
    if (paymentMethod === 'paypal') {
      alert(`💰 Paiement PayPal de ${total}€ simulé avec succès !\n\n📧 Un email de confirmation vous sera envoyé.`)
    } else {
      alert(`💳 Paiement Stripe de ${total}€ simulé avec succès !\n\n📧 Un email de confirmation vous sera envoyé.`)
    }
    
    setCart([])
    setCurrentPage('products')
  }

  const handleLogin = (e) => {
    e.preventDefault()
    if (loginForm.email === 'admin@mangoo.tech' && loginForm.password === 'admin123') {
      setUser({ name: 'Administrateur', isLoggedIn: true })
      setLoginForm({ email: '', password: '' })
      alert('✅ Connexion réussie !')
    } else if (loginForm.email === 'demo@example.com' && loginForm.password === 'demo123') {
      setUser({ name: 'Utilisateur Demo', isLoggedIn: true })
      setLoginForm({ email: '', password: '' })
      alert('✅ Connexion réussie !')
    } else if (loginForm.email === 'user@test.com' && loginForm.password === 'user123') {
      setUser({ name: 'Utilisateur Standard', isLoggedIn: true })
      setLoginForm({ email: '', password: '' })
      alert('✅ Connexion réussie !')
    } else {
      alert('❌ Identifiants incorrects')
    }
  }

  const handleLogout = () => {
    setUser({ name: 'Invité', isLoggedIn: false })
    setCurrentPage('products')
  }

  // Rendu des pages
  const renderProducts = () => (
    <div className="product-card">
      <h2 className="product-title">{product.name}</h2>
      <div className="product-price">{product.price}€</div>
      <p className="product-stock">📦 Stock disponible: {product.stock} unités</p>
      <p>{product.description}</p>
      <button className="buy-button" onClick={() => setSelectedProduct(product)}>
        🛒 Ajouter au panier
      </button>
    </div>
  )

  const renderCart = () => (
    <div className="cart">
      <h2>🛒 Mon Panier</h2>
      {cart.length === 0 ? (
        <p>Votre panier est vide</p>
      ) : (
        <div>
          {cart.map(item => (
            <div key={item.id} style={{ marginBottom: '1rem', padding: '1rem', border: '1px solid #ddd', borderRadius: '5px' }}>
              <strong>{item.name}</strong>
              <div>Quantité: {item.quantity}</div>
              <div>Prix: {item.price}€</div>
              <div>Total: {item.price * item.quantity}€</div>
            </div>
          ))}
          <div style={{ marginTop: '1rem', fontSize: '1.2rem', fontWeight: 'bold' }}>
            Total général: {cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)}€
          </div>
          <div className="payment-methods">
            <div 
              className={`payment-method ${paymentMethod === 'stripe' ? 'selected' : ''}`}
              onClick={() => setPaymentMethod('stripe')}
            >
              💳 Stripe
            </div>
            <div 
              className={`payment-method ${paymentMethod === 'paypal' ? 'selected' : ''}`}
              onClick={() => setPaymentMethod('paypal')}
            >
              💰 PayPal
            </div>
          </div>
          <button className="buy-button" onClick={processPayment} style={{ width: '100%', marginTop: '1rem' }}>
            💳 Payer maintenant
          </button>
        </div>
      )}
    </div>
  )

  const renderLogin = () => (
    <div className="login-form">
      <h2>🔐 Connexion</h2>
      <form onSubmit={handleLogin}>
        <input
          type="email"
          className="form-input"
          placeholder="Email"
          value={loginForm.email}
          onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
          required
        />
        <input
          type="password"
          className="form-input"
          placeholder="Mot de passe"
          value={loginForm.password}
          onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
          required
        />
        <button type="submit" className="form-button">
          🔐 Se connecter
        </button>
      </form>
      <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#666' }}>
        💡 Identifiants de test: admin@mangoo.tech / admin123
      </p>
    </div>
  )

  return (
    <div className={`app-container ${darkMode ? 'dark' : ''}`}>
      {/* Header */}
      <header className="header">
        <div>
          <h1>🛍️ Mini-Boutique</h1>
          <small>Bienvenue, {user.name}!</small>
        </div>
        <div className="nav-buttons">
          <button className="nav-button" onClick={() => setCurrentPage('products')}>
            📦 Produits
          </button>
          <button className="nav-button" onClick={() => setCurrentPage('cart')}>
            🛒 Panier ({cart.length})
          </button>
          {user.isLoggedIn ? (
            <button className="nav-button" onClick={handleLogout}>
              🔓 Déconnexion
            </button>
          ) : (
            <button className="nav-button" onClick={() => setCurrentPage('login')}>
              🔐 Connexion
            </button>
          )}
          <button className="dark-toggle" onClick={() => setDarkMode(!darkMode)}>
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      {/* Contenu principal */}
      <main style={{ padding: '2rem' }}>
        {currentPage === 'products' && renderProducts()}
        {currentPage === 'cart' && renderCart()}
        {currentPage === 'login' && renderLogin()}
      </main>

      {/* Modal pour la sélection de quantité */}
      {selectedProduct && (
        <div className="modal" onClick={() => setSelectedProduct(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>🛒 Ajouter au panier</h3>
            <p><strong>{selectedProduct.name}</strong></p>
            <p>Prix: {selectedProduct.price}€</p>
            <div className="quantity-selector">
              <button className="quantity-button" onClick={() => setQuantity(Math.max(1, quantity - 1))}>
                -
              </button>
              <span>{quantity}</span>
              <button className="quantity-button" onClick={() => setQuantity(Math.min(selectedProduct.stock, quantity + 1))}>
                +
              </button>
            </div>
            <p>Stock disponible: {selectedProduct.stock}</p>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button className="buy-button" onClick={addToCart}>
                ✅ Confirmer
              </button>
              <button className="buy-button" onClick={() => setSelectedProduct(null)}>
                ❌ Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App