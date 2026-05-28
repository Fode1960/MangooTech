import React, { useState, useEffect } from 'react'
import { Store, User, ShoppingCart, LogOut, Menu, X } from 'lucide-react'
import { useAuthStore } from './stores/authStore'
import AdminDashboard from './components/AdminDashboard'
import VendorDashboard from './components/VendorDashboard'
import ClientMarketplace from './components/ClientMarketplace'
import { supabase } from '../supabase'

function App() {
  const { user, setUser, logout } = useAuthStore()
  const [currentPage, setCurrentPage] = useState('login')
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [mobileMenu, setMobileMenu] = useState(false)

  // Styles avec charte MangooTech
  const styles = `
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      min-height: 100vh;
    }

    .app-container {
      min-height: 100vh;
    }

    .header {
      background: linear-gradient(135deg, #1a5f3f 0%, #2d8659 100%);
      color: white;
      padding: 1rem 2rem;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .header-content {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .logo {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 1.5rem;
      font-weight: bold;
      text-decoration: none;
      color: white;
    }

    .nav-menu {
      display: flex;
      gap: 2rem;
      align-items: center;
    }

    .nav-link {
      color: white;
      text-decoration: none;
      padding: 0.5rem 1rem;
      border-radius: 8px;
      transition: background 0.3s;
      cursor: pointer;
    }

    .nav-link:hover {
      background: rgba(255,255,255,0.1);
    }

    .nav-link.active {
      background: rgba(255,255,255,0.2);
    }

    .logout-btn {
      background: linear-gradient(135deg, #ff6b35 0%, #ff8c42 100%);
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      transition: transform 0.2s;
    }

    .logout-btn:hover {
      transform: translateY(-2px);
    }

    .mobile-menu-btn {
      display: none;
      background: none;
      border: none;
      color: white;
      font-size: 1.5rem;
      cursor: pointer;
    }

    .login-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 2rem;
    }

    .login-card {
      background: white;
      border-radius: 16px;
      padding: 3rem;
      box-shadow: 0 8px 32px rgba(0,0,0,0.1);
      max-width: 400px;
      width: 100%;
      text-align: center;
    }

    .login-title {
      color: #1a5f3f;
      font-size: 2rem;
      font-weight: bold;
      margin-bottom: 1rem;
    }

    .login-subtitle {
      color: #666;
      margin-bottom: 2rem;
    }

    .form-group {
      margin-bottom: 1.5rem;
      text-align: left;
    }

    .form-label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: bold;
      color: #333;
    }

    .form-input {
      width: 100%;
      padding: 1rem;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      font-size: 1rem;
      transition: border-color 0.3s;
    }

    .form-input:focus {
      outline: none;
      border-color: #ff6b35;
    }

    .login-btn {
      width: 100%;
      background: linear-gradient(135deg, #ff6b35 0%, #ff8c42 100%);
      color: white;
      border: none;
      padding: 1rem;
      border-radius: 8px;
      font-size: 1.1rem;
      font-weight: bold;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .login-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 15px rgba(255,107,53,0.3);
    }

    .demo-credentials {
      background: #f0f8f4;
      border: 1px solid #1a5f3f;
      border-radius: 8px;
      padding: 1rem;
      margin-top: 2rem;
    }

    .demo-credentials h4 {
      color: #1a5f3f;
      margin-bottom: 0.5rem;
    }

    .demo-credentials p {
      color: #666;
      font-size: 0.9rem;
      margin: 0.25rem 0;
    }

    .role-badge {
      background: rgba(255,255,255,0.2);
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.9rem;
      margin-left: 0.5rem;
    }

    @media (max-width: 768px) {
      .mobile-menu-btn {
        display: block;
      }
      
      .nav-menu {
        position: fixed;
        top: 0;
        right: -100%;
        width: 80%;
        max-width: 300px;
        height: 100vh;
        background: linear-gradient(135deg, #1a5f3f 0%, #2d8659 100%);
        flex-direction: column;
        padding: 2rem;
        transition: right 0.3s;
        z-index: 1000;
      }
      
      .nav-menu.active {
        right: 0;
      }
      
      .header-content {
        padding: 0 1rem;
      }
      
      .login-container {
        padding: 1rem;
      }
      
      .login-card {
        padding: 2rem;
      }
    }
  `

  const handleLogin = async (e) => {
    e.preventDefault()
    
    // Simulation de connexion - dans la vraie version, cela vérifierait Supabase
    const demoUsers = {
      'admin@mangoo.tech': { 
        name: 'Administrateur', 
        role: 'admin',
        email: 'admin@mangoo.tech'
      },
      'vendor@example.com': { 
        name: 'Commerçant Demo', 
        role: 'vendor',
        email: 'vendor@example.com'
      },
      'client@example.com': { 
        name: 'Client Demo', 
        role: 'client',
        email: 'client@example.com'
      }
    }

    const userData = demoUsers[loginForm.email]
    
    if (userData && loginForm.password === 'demo123') {
      setUser(userData)
      
      // Rediriger vers la page appropriée selon le rôle
      switch (userData.role) {
        case 'admin':
          setCurrentPage('admin')
          break
        case 'vendor':
          setCurrentPage('vendor')
          break
        case 'client':
          setCurrentPage('marketplace')
          break
        default:
          setCurrentPage('marketplace')
      }
      
      alert('✅ Connexion réussie!')
    } else {
      alert('❌ Identifiants incorrects')
    }
  }

  const handleLogout = () => {
    logout()
    setCurrentPage('login')
    setLoginForm({ email: '', password: '' })
  }

  const renderContent = () => {
    if (!user) {
      return (
        <div className="login-container">
          <style>{styles}</style>
          <div className="login-card">
            <div className="logo" style={{ justifyContent: 'center', marginBottom: '2rem' }}>
              <Store size={32} />
              <span>MangooTech</span>
            </div>
            
            <h2 className="login-title">Connexion à la Plateforme</h2>
            <p className="login-subtitle">Accédez à votre espace multi-tenant</p>
            
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-input"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
                  required
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Mot de passe</label>
                <input
                  type="password"
                  className="form-input"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                  required
                />
              </div>
              
              <button type="submit" className="login-btn">
                Se connecter
              </button>
            </form>
            
            <div className="demo-credentials">
              <h4>🔑 Comptes de démonstration</h4>
              <p><strong>Administrateur:</strong> admin@mangoo.tech / demo123</p>
              <p><strong>Vendeur:</strong> vendor@example.com / demo123</p>
              <p><strong>Client:</strong> client@example.com / demo123</p>
            </div>
          </div>
        </div>
      )
    }

    // Rendre le contenu approprié selon le rôle
    switch (currentPage) {
      case 'admin':
        return <AdminDashboard />
      case 'vendor':
        return <VendorDashboard />
      case 'marketplace':
        return <ClientMarketplace />
      default:
        return <ClientMarketplace />
    }
  }

  return (
    <div className="app-container">
      <style>{styles}</style>
      
      {user && (
        <header className="header">
          <div className="header-content">
            <div className="logo" onClick={() => setCurrentPage('marketplace')}>
              <Store size={24} />
              <span>MangooTech</span>
            </div>
            
            <nav className={`nav-menu ${mobileMenu ? 'active' : ''}`}>
              {user.role === 'admin' && (
                <>
                  <div 
                    className={`nav-link ${currentPage === 'admin' ? 'active' : ''}`}
                    onClick={() => setCurrentPage('admin')}
                  >
                    Tableau de bord Admin
                  </div>
                </>
              )}
              
              {user.role === 'vendor' && (
                <>
                  <div 
                    className={`nav-link ${currentPage === 'vendor' ? 'active' : ''}`}
                    onClick={() => setCurrentPage('vendor')}
                  >
                    Ma Boutique
                  </div>
                </>
              )}
              
              <div 
                className={`nav-link ${currentPage === 'marketplace' ? 'active' : ''}`}
                onClick={() => setCurrentPage('marketplace')}
              >
                Marketplace
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span>
                  {user.name}
                  <span className="role-badge">{user.role}</span>
                </span>
                
                <button className="logout-btn" onClick={handleLogout}>
                  <LogOut size={16} />
                  Déconnexion
                </button>
              </div>
            </nav>
            
            <button className="mobile-menu-btn" onClick={() => setMobileMenu(!mobileMenu)}>
              {mobileMenu ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </header>
      )}
      
      <main>
        {renderContent()}
      </main>
    </div>
  )
}

export default App