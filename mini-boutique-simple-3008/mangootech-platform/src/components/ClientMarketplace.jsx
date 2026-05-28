import React, { useState, useEffect } from 'react'
import { Search, ShoppingCart, Heart, Star, Filter, MapPin, Phone } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { supabase } from '../../supabase'

const ClientMarketplace = () => {
  const { user } = useAuthStore()
  const [shops, setShops] = useState([])
  const [products, setProducts] = useState([])
  const [filteredProducts, setFilteredProducts] = useState([])
  const [cart, setCart] = useState([])
  const [favorites, setFavorites] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedShop, setSelectedShop] = useState('all')
  const [loading, setLoading] = useState(true)

  const categories = [
    'all', 'Électronique', 'Vêtements', 'Alimentation', 'Artisanat', 
    'Cosmétiques', 'Maison', 'Agriculture', 'Services'
  ]

  useEffect(() => {
    fetchMarketplaceData()
  }, [])

  const fetchMarketplaceData = async () => {
    try {
      // Récupérer les boutiques actives
      const { data: shopsData, error: shopsError } = await supabase
        .from('shops')
        .select('*')
        .eq('status', 'active')

      if (shopsError) throw shopsError
      setShops(shopsData || [])

      // Récupérer les produits actifs
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select(`
          *,
          shops (
            id,
            name,
            business_name,
            city,
            country
          )
        `)
        .eq('status', 'active')
        .gt('stock', 0)

      if (productsError) throw productsError
      setProducts(productsData || [])
      setFilteredProducts(productsData || [])

    } catch (error) {
      console.error('Erreur lors de la récupération des données:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterProducts = () => {
    let filtered = products

    // Filtrer par recherche
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.shops.business_name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filtrer par catégorie
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => product.category === selectedCategory)
    }

    // Filtrer par boutique
    if (selectedShop !== 'all') {
      filtered = filtered.filter(product => product.shop_id === parseInt(selectedShop))
    }

    setFilteredProducts(filtered)
  }

  useEffect(() => {
    filterProducts()
  }, [searchTerm, selectedCategory, selectedShop, products])

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.id === product.id)
    if (existingItem) {
      setCart(cart.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ))
    } else {
      setCart([...cart, { ...product, quantity: 1 }])
    }
    alert('✅ Produit ajouté au panier!')
  }

  const toggleFavorite = (productId) => {
    if (favorites.includes(productId)) {
      setFavorites(favorites.filter(id => id !== productId))
    } else {
      setFavorites([...favorites, productId])
    }
  }

  // Styles avec charte MangooTech
  const styles = `
    .marketplace-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }
    .marketplace-header {
      background: linear-gradient(135deg, #1a5f3f 0%, #2d8659 100%);
      color: white;
      padding: 2rem;
      text-align: center;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    }
    .marketplace-title {
      font-size: 2.5rem;
      font-weight: bold;
      margin-bottom: 0.5rem;
    }
    .marketplace-subtitle {
      font-size: 1.2rem;
      opacity: 0.9;
      margin-bottom: 2rem;
    }
    .search-section {
      background: white;
      border-radius: 12px;
      padding: 2rem;
      margin: 2rem auto;
      max-width: 800px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    }
    .search-bar {
      position: relative;
      margin-bottom: 1.5rem;
    }
    .search-input {
      width: 100%;
      padding: 1rem 1rem 1rem 3rem;
      border: 2px solid #e0e0e0;
      border-radius: 12px;
      font-size: 1.1rem;
      transition: border-color 0.3s, box-shadow 0.3s;
    }
    .search-input:focus {
      outline: none;
      border-color: #ff6b35;
      box-shadow: 0 0 0 3px rgba(255,107,53,0.1);
    }
    .search-icon {
      position: absolute;
      left: 1rem;
      top: 50%;
      transform: translateY(-50%);
      color: #666;
    }
    .filters-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }
    .filter-select {
      padding: 0.75rem;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      font-size: 1rem;
      background: white;
      transition: border-color 0.3s;
    }
    .filter-select:focus {
      outline: none;
      border-color: #ff6b35;
    }
    .marketplace-content {
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
    }
    .products-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 2rem;
      margin-top: 2rem;
    }
    .product-card {
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
      transition: transform 0.3s, box-shadow 0.3s;
      position: relative;
    }
    .product-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 8px 30px rgba(0,0,0,0.15);
    }
    .product-image {
      width: 100%;
      height: 200px;
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 3rem;
      color: #1a5f3f;
    }
    .product-info {
      padding: 1.5rem;
    }
    .product-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 0.5rem;
    }
    .product-name {
      font-size: 1.2rem;
      font-weight: bold;
      color: #1a5f3f;
      margin-bottom: 0.5rem;
    }
    .product-price {
      font-size: 1.4rem;
      font-weight: bold;
      color: #ff6b35;
    }
    .product-description {
      color: #666;
      font-size: 0.9rem;
      margin-bottom: 1rem;
      line-height: 1.4;
    }
    .product-shop {
      background: #f0f8f4;
      padding: 0.5rem 1rem;
      border-radius: 8px;
      margin-bottom: 1rem;
      font-size: 0.9rem;
      color: #1a5f3f;
    }
    .product-shop-info {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.25rem;
    }
    .product-actions {
      display: flex;
      gap: 0.5rem;
    }
    .btn-primary {
      background: linear-gradient(135deg, #ff6b35 0%, #ff8c42 100%);
      color: white;
      border: none;
      padding: 0.75rem 1rem;
      border-radius: 8px;
      font-weight: bold;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
    }
    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 15px rgba(255,107,53,0.3);
    }
    .btn-favorite {
      background: white;
      border: 2px solid #e0e0e0;
      padding: 0.75rem;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .btn-favorite:hover {
      border-color: #ff6b35;
      color: #ff6b35;
    }
    .btn-favorite.active {
      background: #ff6b35;
      border-color: #ff6b35;
      color: white;
    }
    .cart-badge {
      position: fixed;
      top: 2rem;
      right: 2rem;
      background: linear-gradient(135deg, #ff6b35 0%, #ff8c42 100%);
      color: white;
      padding: 1rem 1.5rem;
      border-radius: 50px;
      font-weight: bold;
      box-shadow: 0 4px 20px rgba(255,107,53,0.3);
      cursor: pointer;
      transition: transform 0.3s;
      z-index: 100;
    }
    .cart-badge:hover {
      transform: scale(1.05);
    }
    .loading {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 200px;
      font-size: 1.2rem;
      color: #1a5f3f;
    }
    .empty-state {
      text-align: center;
      padding: 4rem 2rem;
      color: #666;
    }
    .empty-state h3 {
      color: #1a5f3f;
      margin-bottom: 1rem;
      font-size: 1.5rem;
    }
    .results-count {
      background: white;
      padding: 1rem 2rem;
      border-radius: 12px;
      margin-bottom: 2rem;
      text-align: center;
      font-weight: bold;
      color: #1a5f3f;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
  `

  if (loading) {
    return (
      <div className="marketplace-container">
        <style>{styles}</style>
        <div className="loading">Chargement de la marketplace...</div>
      </div>
    )
  }

  return (
    <div className="marketplace-container">
      <style>{styles}</style>
      
      {/* Header */}
      <div className="marketplace-header">
        <h1 className="marketplace-title">🌍 Marketplace MangooTech</h1>
        <p className="marketplace-subtitle">Découvrez les meilleurs produits des commerçants africains</p>
      </div>

      {/* Panier */}
      {cart.length > 0 && (
        <div className="cart-badge">
          <ShoppingCart size={20} />
          <span>{cart.reduce((sum, item) => sum + item.quantity, 0)}</span>
        </div>
      )}

      {/* Section de recherche et filtres */}
      <div className="search-section">
        <div className="search-bar">
          <Search className="search-icon" size={20} />
          <input
            type="text"
            className="search-input"
            placeholder="Rechercher des produits, boutiques ou commerçants..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="filters-row">
          <select
            className="filter-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category === 'all' ? 'Toutes les catégories' : category}
              </option>
            ))}
          </select>
          
          <select
            className="filter-select"
            value={selectedShop}
            onChange={(e) => setSelectedShop(e.target.value)}
          >
            <option value="all">Toutes les boutiques</option>
            {shops.map(shop => (
              <option key={shop.id} value={shop.id}>
                {shop.business_name} ({shop.city})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Résultats */}
      <div className="marketplace-content">
        <div className="results-count">
          📊 {filteredProducts.length} produit{filteredProducts.length !== 1 ? 's' : ''} trouvé{filteredProducts.length !== 1 ? 's' : ''}
        </div>

        {filteredProducts.length === 0 ? (
          <div className="empty-state">
            <Search size={64} style={{ color: '#1a5f3f', marginBottom: '1rem' }} />
            <h3>Aucun produit trouvé</h3>
            <p>Essayez de modifier vos critères de recherche ou explorez d'autres catégories</p>
          </div>
        ) : (
          <div className="products-grid">
            {filteredProducts.map((product) => (
              <div key={product.id} className="product-card">
                <div className="product-image">
                  📦
                </div>
                
                <div className="product-info">
                  <div className="product-header">
                    <div>
                      <h3 className="product-name">{product.name}</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <Star size={16} fill="#ffc107" color="#ffc107" />
                        <span style={{ fontSize: '0.9rem', color: '#666' }}>4.8 (127 avis)</span>
                      </div>
                    </div>
                    <div className="product-price">
                      {product.price.toLocaleString()} FCFA
                    </div>
                  </div>
                  
                  <p className="product-description">{product.description}</p>
                  
                  <div className="product-shop">
                    <div className="product-shop-info">
                      <Store size={16} />
                      <strong>{product.shops.business_name}</strong>
                    </div>
                    <div className="product-shop-info">
                      <MapPin size={14} />
                      <span>{product.shops.city}, {product.shops.country}</span>
                    </div>
                  </div>

                  <div className="product-actions">
                    <button className="btn-primary" onClick={() => addToCart(product)}>
                      <ShoppingCart size={16} />
                      Ajouter
                    </button>
                    <button
                      className={`btn-favorite ${favorites.includes(product.id) ? 'active' : ''}`}
                      onClick={() => toggleFavorite(product.id)}
                    >
                      <Heart size={16} fill={favorites.includes(product.id) ? 'currentColor' : 'none'} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ClientMarketplace