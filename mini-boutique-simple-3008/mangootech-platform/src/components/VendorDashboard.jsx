import React, { useState, useEffect } from 'react'
import { Package, Plus, Edit, Trash2, BarChart3, DollarSign, Users, Settings } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { useShopStore } from '../stores/shopStore'
import { supabase } from '../../supabase'

const VendorDashboard = () => {
  const { user } = useAuthStore()
  const { currentShop, setCurrentShop } = useShopStore()
  const [products, setProducts] = useState([])
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalSales: 0,
    totalRevenue: 0,
    totalCustomers: 0
  })
  const [loading, setLoading] = useState(true)
  const [showAddProduct, setShowAddProduct] = useState(false)
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    category: '',
    image: ''
  })

  useEffect(() => {
    if (user?.id) {
      fetchVendorData()
    }
  }, [user])

  const fetchVendorData = async () => {
    try {
      // Récupérer la boutique du vendeur
      const { data: shopData, error: shopError } = await supabase
        .from('shops')
        .select('*')
        .eq('vendor_id', user.id)
        .single()

      if (shopError) throw shopError
      setCurrentShop(shopData)

      // Récupérer les produits
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('shop_id', shopData.id)
        .order('created_at', { ascending: false })

      if (productsError) throw productsError
      setProducts(productsData || [])

      // Calculer les statistiques
      const totalRevenue = productsData?.reduce((sum, product) => 
        sum + (product.sold || 0) * product.price, 0
      ) || 0

      setStats({
        totalProducts: productsData?.length || 0,
        totalSales: productsData?.reduce((sum, product) => sum + (product.sold || 0), 0) || 0,
        totalRevenue: totalRevenue,
        totalCustomers: Math.floor(totalRevenue / 50) // Estimation
      })

    } catch (error) {
      console.error('Erreur lors de la récupération des données:', error)
    } finally {
      setLoading(false)
    }
  }

  const addProduct = async (e) => {
    e.preventDefault()
    try {
      const { data, error } = await supabase
        .from('products')
        .insert([{
          ...newProduct,
          price: parseFloat(newProduct.price),
          stock: parseInt(newProduct.stock),
          shop_id: currentShop.id,
          sold: 0,
          created_at: new Date().toISOString()
        }])

      if (error) throw error

      setProducts([data[0], ...products])
      setShowAddProduct(false)
      setNewProduct({
        name: '',
        description: '',
        price: '',
        stock: '',
        category: '',
        image: ''
      })
      alert('✅ Produit ajouté avec succès!')
      fetchVendorData() // Rafraîchir les statistiques
    } catch (error) {
      alert('❌ Erreur lors de l\'ajout du produit')
      console.error(error)
    }
  }

  // Styles avec charte MangooTech
  const styles = `
    .vendor-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }
    .vendor-header {
      background: linear-gradient(135deg, #1a5f3f 0%, #2d8659 100%);
      color: white;
      padding: 2rem;
      text-align: center;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    }
    .vendor-title {
      font-size: 2.2rem;
      font-weight: bold;
      margin-bottom: 0.5rem;
    }
    .vendor-subtitle {
      font-size: 1.1rem;
      opacity: 0.9;
    }
    .vendor-content {
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }
    .stat-card {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
      transition: transform 0.3s;
      border-left: 4px solid #ff6b35;
    }
    .stat-card:hover {
      transform: translateY(-5px);
    }
    .stat-icon {
      width: 50px;
      height: 50px;
      background: linear-gradient(135deg, #ff6b35 0%, #ff8c42 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 1rem;
      color: white;
    }
    .stat-value {
      font-size: 2rem;
      font-weight: bold;
      color: #1a5f3f;
      margin-bottom: 0.5rem;
    }
    .stat-label {
      color: #666;
      font-size: 0.9rem;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .products-section {
      background: white;
      border-radius: 12px;
      padding: 2rem;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    }
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }
    .section-title {
      font-size: 1.5rem;
      font-weight: bold;
      color: #1a5f3f;
    }
    .btn-primary {
      background: linear-gradient(135deg, #ff6b35 0%, #ff8c42 100%);
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      font-weight: bold;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 15px rgba(255,107,53,0.3);
    }
    .products-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.5rem;
    }
    .product-card {
      background: #f8f9fa;
      border-radius: 12px;
      padding: 1.5rem;
      transition: transform 0.3s, box-shadow 0.3s;
      border: 2px solid transparent;
    }
    .product-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 25px rgba(0,0,0,0.15);
      border-color: #ff6b35;
    }
    .product-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1rem;
    }
    .product-name {
      font-size: 1.2rem;
      font-weight: bold;
      color: #1a5f3f;
      margin-bottom: 0.5rem;
    }
    .product-price {
      font-size: 1.5rem;
      font-weight: bold;
      color: #ff6b35;
    }
    .product-description {
      color: #666;
      margin-bottom: 1rem;
      line-height: 1.5;
    }
    .product-stats {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
      padding: 0.5rem;
      background: white;
      border-radius: 8px;
    }
    .product-stat {
      text-align: center;
    }
    .product-stat-value {
      font-weight: bold;
      color: #1a5f3f;
    }
    .product-stat-label {
      font-size: 0.8rem;
      color: #666;
    }
    .modal-overlay {
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
      border-radius: 12px;
      padding: 2rem;
      max-width: 500px;
      width: 90%;
      max-height: 90vh;
      overflow-y: auto;
    }
    .form-group {
      margin-bottom: 1rem;
    }
    .form-label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: bold;
      color: #333;
    }
    .form-input, .form-textarea, .form-select {
      width: 100%;
      padding: 0.75rem;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      font-size: 1rem;
      transition: border-color 0.3s;
    }
    .form-input:focus, .form-textarea:focus, .form-select:focus {
      outline: none;
      border-color: #ff6b35;
    }
    .form-textarea {
      resize: vertical;
      min-height: 100px;
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
      padding: 3rem;
      color: #666;
    }
    .empty-state h3 {
      color: #1a5f3f;
      margin-bottom: 1rem;
    }
  `

  if (loading) {
    return (
      <div className="vendor-container">
        <style>{styles}</style>
        <div className="loading">Chargement de votre tableau de bord...</div>
      </div>
    )
  }

  return (
    <div className="vendor-container">
      <style>{styles}</style>
      
      <div className="vendor-header">
        <h1 className="vendor-title">🏪 {currentShop?.name || 'Ma Mini-Boutique'}</h1>
        <p className="vendor-subtitle">Gérez vos produits et suivez vos performances</p>
      </div>

      <div className="vendor-content">
        {/* Statistiques */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">
              <Package size={24} />
            </div>
            <div className="stat-value">{stats.totalProducts}</div>
            <div className="stat-label">Produits</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">
              <BarChart3 size={24} />
            </div>
            <div className="stat-value">{stats.totalSales}</div>
            <div className="stat-label">Ventes</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">
              <DollarSign size={24} />
            </div>
            <div className="stat-value">{stats.totalRevenue.toLocaleString()} FCFA</div>
            <div className="stat-label">Revenus</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">
              <Users size={24} />
            </div>
            <div className="stat-value">{stats.totalCustomers}</div>
            <div className="stat-label">Clients</div>
          </div>
        </div>

        {/* Produits */}
        <div className="products-section">
          <div className="section-header">
            <h2 className="section-title">📦 Mes Produits</h2>
            <button className="btn-primary" onClick={() => setShowAddProduct(true)}>
              <Plus size={20} />
              Ajouter un produit
            </button>
          </div>

          {products.length === 0 ? (
            <div className="empty-state">
              <Package size={64} style={{ color: '#1a5f3f', marginBottom: '1rem' }} />
              <h3>Aucun produit en vente</h3>
              <p>Commencez par ajouter votre premier produit à vendre</p>
            </div>
          ) : (
            <div className="products-grid">
              {products.map((product) => (
                <div key={product.id} className="product-card">
                  <div className="product-header">
                    <div>
                      <h3 className="product-name">{product.name}</h3>
                      <p style={{ color: '#666', fontSize: '0.9rem' }}>{product.category}</p>
                    </div>
                    <div className="product-price">
                      {product.price.toLocaleString()} FCFA
                    </div>
                  </div>
                  
                  <p className="product-description">{product.description}</p>
                  
                  <div className="product-stats">
                    <div className="product-stat">
                      <div className="product-stat-value">{product.stock}</div>
                      <div className="product-stat-label">Stock</div>
                    </div>
                    <div className="product-stat">
                      <div className="product-stat-value">{product.sold}</div>
                      <div className="product-stat-label">Vendus</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn-primary" style={{ flex: 1, fontSize: '0.9rem' }}>
                      <Edit size={16} />
                      Modifier
                    </button>
                    <button 
                      className="btn-primary" 
                      style={{ 
                        flex: 1, 
                        fontSize: '0.9rem', 
                        background: '#d32f2f'
                      }}
                    >
                      <Trash2 size={16} />
                      Supprimer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal Ajout Produit */}
      {showAddProduct && (
        <div className="modal-overlay" onClick={() => setShowAddProduct(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ color: '#1a5f3f', marginBottom: '1.5rem', textAlign: 'center' }}>
              ➕ Ajouter un nouveau produit
            </h2>
            
            <form onSubmit={addProduct}>
              <div className="form-group">
                <label className="form-label">Nom du produit *</label>
                <input
                  type="text"
                  className="form-input"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description *</label>
                <textarea
                  className="form-textarea"
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Prix (FCFA) *</label>
                  <input
                    type="number"
                    className="form-input"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                    required
                    min="0"
                    step="0.01"
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Stock *</label>
                  <input
                    type="number"
                    className="form-input"
                    value={newProduct.stock}
                    onChange={(e) => setNewProduct({...newProduct, stock: e.target.value})}
                    required
                    min="0"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Catégorie *</label>
                <select
                  className="form-select"
                  value={newProduct.category}
                  onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                  required
                >
                  <option value="">Sélectionner une catégorie...</option>
                  <option value="Électronique">Électronique</option>
                  <option value="Vêtements">Vêtements</option>
                  <option value="Alimentation">Alimentation</option>
                  <option value="Artisanat">Artisanat</option>
                  <option value="Cosmétiques">Cosmétiques</option>
                  <option value="Maison">Maison</option>
                  <option value="Autre">Autre</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">URL de l'image (optionnel)</label>
                <input
                  type="url"
                  className="form-input"
                  value={newProduct.image}
                  onChange={(e) => setNewProduct({...newProduct, image: e.target.value})}
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" 
                  className="btn-primary" 
                  style={{ flex: 1, background: '#666' }}
                  onClick={() => setShowAddProduct(false)}
                >
                  Annuler
                </button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>
                  <Plus size={20} />
                  Ajouter le produit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default VendorDashboard