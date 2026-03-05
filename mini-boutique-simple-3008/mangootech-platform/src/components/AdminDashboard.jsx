import React, { useState, useEffect } from 'react'
import { Users, Store, Plus, Edit, Trash2, Search, Filter } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { supabase } from '../../supabase'

const AdminDashboard = () => {
  const { user } = useAuthStore()
  const [vendors, setVendors] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [newVendor, setNewVendor] = useState({
    name: '',
    email: '',
    phone: '',
    business_name: '',
    business_type: '',
    address: '',
    city: '',
    country: 'Côte d\'Ivoire'
  })

  useEffect(() => {
    fetchVendors()
  }, [])

  const fetchVendors = async () => {
    try {
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setVendors(data || [])
    } catch (error) {
      console.error('Erreur lors de la récupération des vendeurs:', error)
    } finally {
      setLoading(false)
    }
  }

  const addVendor = async (e) => {
    e.preventDefault()
    try {
      const { data, error } = await supabase
        .from('vendors')
        .insert([{
          ...newVendor,
          status: 'active',
          created_at: new Date().toISOString()
        }])
      
      if (error) throw error
      
      setVendors([data[0], ...vendors])
      setShowAddModal(false)
      setNewVendor({
        name: '',
        email: '',
        phone: '',
        business_name: '',
        business_type: '',
        address: '',
        city: '',
        country: 'Côte d\'Ivoire'
      })
      alert('✅ Vendeur ajouté avec succès!')
    } catch (error) {
      alert('❌ Erreur lors de l\'ajout du vendeur')
      console.error(error)
    }
  }

  const filteredVendors = vendors.filter(vendor =>
    vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.business_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Styles avec charte MangooTech
  const styles = `
    .admin-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }
    .admin-header {
      background: linear-gradient(135deg, #1a5f3f 0%, #2d8659 100%);
      color: white;
      padding: 1.5rem;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    }
    .admin-title {
      font-size: 2rem;
      font-weight: bold;
      margin-bottom: 0.5rem;
    }
    .admin-subtitle {
      opacity: 0.9;
      font-size: 1.1rem;
    }
    .admin-content {
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
    }
    .search-bar {
      display: flex;
      gap: 1rem;
      margin-bottom: 2rem;
      background: white;
      padding: 1rem;
      border-radius: 12px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .search-input {
      flex: 1;
      padding: 0.75rem;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      font-size: 1rem;
      transition: border-color 0.3s;
    }
    .search-input:focus {
      outline: none;
      border-color: #ff6b35;
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
    .vendors-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 1.5rem;
    }
    .vendor-card {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
      transition: transform 0.3s, box-shadow 0.3s;
      border-left: 4px solid #1a5f3f;
    }
    .vendor-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 8px 30px rgba(0,0,0,0.15);
    }
    .vendor-header {
      display: flex;
      justify-content: between;
      align-items: flex-start;
      margin-bottom: 1rem;
    }
    .vendor-name {
      font-size: 1.3rem;
      font-weight: bold;
      color: #1a5f3f;
      margin-bottom: 0.5rem;
    }
    .vendor-business {
      color: #666;
      font-size: 1rem;
      margin-bottom: 1rem;
    }
    .vendor-info {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      color: #555;
      font-size: 0.9rem;
    }
    .vendor-info-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .status-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: bold;
      text-transform: uppercase;
    }
    .status-active {
      background: #e8f5e8;
      color: #1a5f3f;
    }
    .status-inactive {
      background: #ffeaea;
      color: #d32f2f;
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
    .form-input {
      width: 100%;
      padding: 0.75rem;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      font-size: 1rem;
      transition: border-color 0.3s;
    }
    .form-input:focus {
      outline: none;
      border-color: #ff6b35;
    }
    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
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
      <div className="admin-container">
        <style>{styles}</style>
        <div className="loading">Chargement des vendeurs...</div>
      </div>
    )
  }

  return (
    <div className="admin-container">
      <style>{styles}</style>
      
      <div className="admin-header">
        <h1 className="admin-title">🎯 Tableau de Bord Administrateur</h1>
        <p className="admin-subtitle">Gérez les vendeurs et les mini-boutiques de la plateforme</p>
      </div>

      <div className="admin-content">
        <div className="search-bar">
          <div style={{ position: 'relative', flex: 1 }}>
            <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#666' }} size={20} />
            <input
              type="text"
              className="search-input"
              placeholder="Rechercher un vendeur par nom, entreprise ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '40px' }}
            />
          </div>
          <button className="btn-primary" onClick={() => setShowAddModal(true)}>
            <Plus size={20} />
            Ajouter un vendeur
          </button>
        </div>

        {filteredVendors.length === 0 ? (
          <div className="empty-state">
            <Store size={64} style={{ color: '#1a5f3f', marginBottom: '1rem' }} />
            <h3>Aucun vendeur trouvé</h3>
            <p>Commencez par ajouter votre premier vendeur à la plateforme</p>
          </div>
        ) : (
          <div className="vendors-grid">
            {filteredVendors.map((vendor) => (
              <div key={vendor.id} className="vendor-card">
                <div className="vendor-header">
                  <div>
                    <h3 className="vendor-name">{vendor.name}</h3>
                    <p className="vendor-business">{vendor.business_name}</p>
                    <span className={`status-badge status-${vendor.status}`}>
                      {vendor.status}
                    </span>
                  </div>
                </div>
                
                <div className="vendor-info">
                  <div className="vendor-info-item">
                    <span>📧 {vendor.email}</span>
                  </div>
                  <div className="vendor-info-item">
                    <span>📱 {vendor.phone}</span>
                  </div>
                  <div className="vendor-info-item">
                    <span>📍 {vendor.city}, {vendor.country}</span>
                  </div>
                  <div className="vendor-info-item">
                    <span>🏢 {vendor.business_type}</span>
                  </div>
                </div>

                <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                  <button className="btn-primary" style={{ flex: 1, fontSize: '0.9rem' }}>
                    <Edit size={16} />
                    Modifier
                  </button>
                  <button 
                    className="btn-primary" 
                    style={{ 
                      flex: 1, 
                      fontSize: '0.9rem', 
                      background: vendor.status === 'active' ? '#d32f2f' : '#4caf50'
                    }}
                  >
                    {vendor.status === 'active' ? 'Désactiver' : 'Activer'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ color: '#1a5f3f', marginBottom: '1.5rem', textAlign: 'center' }}>
              ➕ Ajouter un nouveau vendeur
            </h2>
            
            <form onSubmit={addVendor}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Nom complet *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newVendor.name}
                    onChange={(e) => setNewVendor({...newVendor, name: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email *</label>
                  <input
                    type="email"
                    className="form-input"
                    value={newVendor.email}
                    onChange={(e) => setNewVendor({...newVendor, email: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Téléphone *</label>
                  <input
                    type="tel"
                    className="form-input"
                    value={newVendor.phone}
                    onChange={(e) => setNewVendor({...newVendor, phone: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Nom de l'entreprise *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newVendor.business_name}
                    onChange={(e) => setNewVendor({...newVendor, business_name: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Type d'activité *</label>
                  <select
                    className="form-input"
                    value={newVendor.business_type}
                    onChange={(e) => setNewVendor({...newVendor, business_type: e.target.value})}
                    required
                  >
                    <option value="">Sélectionner...</option>
                    <option value="Commerçant">Commerçant</option>
                    <option value="Artisan">Artisan</option>
                    <option value="Restaurateur">Restaurateur</option>
                    <option value="Service">Service</option>
                    <option value="Agriculture">Agriculture</option>
                    <option value="Autre">Autre</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Pays</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newVendor.country}
                    onChange={(e) => setNewVendor({...newVendor, country: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Adresse</label>
                <input
                  type="text"
                  className="form-input"
                  value={newVendor.address}
                  onChange={(e) => setNewVendor({...newVendor, address: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Ville</label>
                <input
                  type="text"
                  className="form-input"
                  value={newVendor.city}
                  onChange={(e) => setNewVendor({...newVendor, city: e.target.value})}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" 
                  className="btn-primary" 
                  style={{ flex: 1, background: '#666' }}
                  onClick={() => setShowAddModal(false)}
                >
                  Annuler
                </button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>
                  <Plus size={20} />
                  Ajouter le vendeur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminDashboard