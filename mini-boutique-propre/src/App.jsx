import React, { useState, useEffect } from 'react';

// Application MODERNE ET PROFESSIONNELLE
function App() {
  // État de navigation
  const [currentPage, setCurrentPage] = useState('products');
  
  // État du panier
  const [cart, setCart] = useState([]);
  
  // État du mode sombre
  const [darkMode, setDarkMode] = useState(false);
  
  // État du modal
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  
  // État du paiement
  const [paymentMethod, setPaymentMethod] = useState('stripe');
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  
  // État des favoris
  const [favorites, setFavorites] = useState([]);
  
  // État de chargement
  const [loading, setLoading] = useState(false);
  
  // État de recherche
  const [searchTerm, setSearchTerm] = useState('');
  
  // État du tri
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  
  // État des notifications
  const [notifications, setNotifications] = useState([]);
  
  // État de l'utilisateur
  const [user, setUser] = useState({ name: 'Invité', email: '', isLoggedIn: false });
  
  // État de l'historique des commandes
  const [orderHistory, setOrderHistory] = useState([]);

  // Catalogue de produits PROFESSIONNEL ET COMPLET (15 produits)
  const products = [
    { 
      id: 1, 
      name: 'Cocomm DT740', 
      price: 150, 
      stock: 10, 
      active: true, 
      category: 'Électronique',
      image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Modern%20electronic%20device%20DT740%20minimalist%20design%20on%20white%20background%20professional%20product%20photography&image_size=square_hd',
      rating: 4.8,
      reviews: 127,
      description: 'Appareil électronique haute performance avec écran tactile et processeur rapide'
    },
    { 
      id: 2, 
      name: 'SmartWatch Pro X', 
      price: 299, 
      stock: 15, 
      active: true, 
      category: 'Montres Connectées',
      image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Premium%20smartwatch%20with%20sleek%20design%20black%20and%20silver%20professional%20photography&image_size=square_hd',
      rating: 4.6,
      reviews: 89,
      description: 'Montre intelligente avec suivi santé avancé, GPS et résistance à l\'eau'
    },
    { 
      id: 3, 
      name: 'Casque Audio Elite', 
      price: 199, 
      stock: 8, 
      active: true, 
      category: 'Audio',
      image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Premium%20wireless%20headphones%20minimalist%20design%20professional%20photography%20soft%20lighting&image_size=square_hd',
      rating: 4.9,
      reviews: 203,
      description: 'Casque sans fil avec réduction de bruit active et son haute fidélité'
    },
    { 
      id: 4, 
      name: 'Tablette Ultra', 
      price: 449, 
      stock: 5, 
      active: true, 
      category: 'Tablettes',
      image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Modern%20tablet%20device%20thin%20bezel%20professional%20product%20photography%20elegant%20design&image_size=square_hd',
      rating: 4.7,
      reviews: 156,
      description: 'Tablette haute résolution avec stylet inclus et écran OLED'
    },
    { 
      id: 5, 
      name: 'Chargeur Rapide Pro', 
      price: 79, 
      stock: 25, 
      active: true, 
      category: 'Accessoires',
      image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Fast%20charging%20adapter%20minimalist%20design%20professional%20photography%20clean%20background&image_size=square_hd',
      rating: 4.5,
      reviews: 67,
      description: 'Chargeur ultra-rapide avec technologie QuickCharge 4.0 et ports multiples'
    },
    { 
      id: 6, 
      name: 'Enceinte Bluetooth', 
      price: 129, 
      stock: 12, 
      active: true, 
      category: 'Audio',
      image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Portable%20bluetooth%20speaker%20modern%20design%20professional%20photography%20ambient%20lighting&image_size=square_hd',
      rating: 4.4,
      reviews: 94,
      description: 'Enceinte portable avec son surround 360° et résistance à l\'eau IPX7'
    },
    // NOUVEAUX PRODUITS AJOUTÉS
    { 
      id: 7, 
      name: 'iPhone 15 Pro', 
      price: 1199, 
      stock: 3, 
      active: true, 
      category: 'Smartphones',
      image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=iPhone%2015%20Pro%20titanium%20finish%20professional%20product%20photography%20elegant%20minimalist&image_size=square_hd',
      rating: 4.9,
      reviews: 342,
      description: 'iPhone flagship avec puce A17 Pro et appareil photo professionnel'
    },
    { 
      id: 8, 
      name: 'MacBook Air M3', 
      price: 1499, 
      stock: 2, 
      active: true, 
      category: 'Ordinateurs',
      image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=MacBook%20Air%20M3%20silver%20ultrathin%20professional%20product%20photography%20clean%20background&image_size=square_hd',
      rating: 4.8,
      reviews: 278,
      description: 'Ordinateur portable ultra-fin avec puce M3 et batterie longue durée'
    },
    { 
      id: 9, 
      name: 'AirPods Pro 3', 
      price: 349, 
      stock: 18, 
      active: true, 
      category: 'Audio',
      image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=AirPods%20Pro%203%20white%20charging%20case%20professional%20product%20photography%20minimalist&image_size=square_hd',
      rating: 4.7,
      reviews: 445,
      description: 'Écouteurs sans fil avec réduction de bruit adaptative et spatial audio'
    },
    { 
      id: 10, 
      name: 'iPad Pro 12.9"', 
      price: 1299, 
      stock: 4, 
      active: true, 
      category: 'Tablettes',
      image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=iPad%20Pro%2012.9%20inch%20space%20gray%20professional%20product%20photography%20with%20Magic%20Keyboard&image_size=square_hd',
      rating: 4.8,
      reviews: 198,
      description: 'Tablette professionnelle avec puce M2 et écran Liquid Retina XDR'
    },
    { 
      id: 11, 
      name: 'Apple Watch Ultra', 
      price: 899, 
      stock: 6, 
      active: true, 
      category: 'Montres Connectées',
      image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Apple%20Watch%20Ultra%20titanium%20rugged%20design%20professional%20product%20photography%20outdoor%20style&image_size=square_hd',
      rating: 4.6,
      reviews: 167,
      description: 'Montre de sport extrême avec GPS précis et batterie longue durée'
    },
    { 
      id: 12, 
      name: 'Câble USB-C Premium', 
      price: 49, 
      stock: 35, 
      active: true, 
      category: 'Accessoires',
      image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Premium%20USB-C%20cable%20braided%20professional%20product%20photography%20high%20quality&image_size=square_hd',
      rating: 4.3,
      reviews: 89,
      description: 'Câble USB-C tressé de haute qualité avec charge rapide 100W'
    },
    { 
      id: 13, 
      name: 'Camera de Sécurité', 
      price: 299, 
      stock: 9, 
      active: true, 
      category: 'Sécurité',
      image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Smart%20security%20camera%20white%20modern%20design%20professional%20product%20photography%20minimalist&image_size=square_hd',
      rating: 4.5,
      reviews: 134,
      description: 'Caméra de surveillance intelligente avec détection de mouvement et vision nocturne'
    },
    { 
      id: 14, 
      name: 'Routeur WiFi 6', 
      price: 249, 
      stock: 7, 
      active: true, 
      category: 'Réseau',
      image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=WiFi%206%20router%20modern%20design%20professional%20product%20photography%20sleek%20black%20finish&image_size=square_hd',
      rating: 4.4,
      reviews: 76,
      description: 'Routeur WiFi 6 haute vitesse avec couverture longue portée et sécurité avancée'
    },
    { 
      id: 15, 
      name: 'Station Météo Connectée', 
      price: 179, 
      stock: 11, 
      active: true, 
      category: 'Maison Connectée',
      image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Smart%20weather%20station%20modern%20design%20professional%20product%20photography%20clean%20aesthetic&image_size=square_hd',
      rating: 4.2,
      reviews: 58,
      description: 'Station météo intelligente avec prévisions précises et contrôle via application'
    }
  ];

  // Injection des styles CSS MODERNES avec animations
  useEffect(() => {
    const styles = `
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      body {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        background: ${darkMode ? '#0f172a' : '#f8fafc'};
        color: ${darkMode ? '#e2e8f0' : '#1e293b'};
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        line-height: 1.6;
      }
      
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }
      
      @keyframes slideIn {
        from { transform: translateX(-100%); }
        to { transform: translateX(0); }
      }
      
      @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
      }
      
      .container {
        max-width: 1400px;
        margin: 0 auto;
        padding: 0 20px;
      }
      
      .header {
        background: ${darkMode ? '#1e293b' : '#ffffff'};
        padding: 24px 0;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        margin-bottom: 40px;
        position: sticky;
        top: 0;
        z-index: 50;
        backdrop-filter: blur(10px);
      }
      
      .header-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
        max-width: 1400px;
        margin: 0 auto;
        padding: 0 20px;
      }
      
      .logo {
        font-size: 32px;
        font-weight: 800;
        background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        cursor: pointer;
        transition: all 0.3s ease;
      }
      
      .logo:hover {
        transform: scale(1.05);
      }
      
      .nav-buttons {
        display: flex;
        gap: 16px;
        align-items: center;
      }
      
      .btn {
        padding: 12px 24px;
        border: none;
        border-radius: 12px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 600;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        text-decoration: none;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        position: relative;
        overflow: hidden;
      }
      
      .btn::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
        transition: left 0.5s;
      }
      
      .btn:hover::before {
        left: 100%;
      }
      
      .btn-primary {
        background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%);
        color: white;
        box-shadow: 0 4px 14px 0 rgba(59, 130, 246, 0.3);
      }
      
      .btn-primary:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px 0 rgba(59, 130, 246, 0.4);
      }
      
      .btn-secondary {
        background: ${darkMode ? '#334155' : '#f1f5f9'};
        color: ${darkMode ? '#e2e8f0' : '#475569'};
        border: 1px solid ${darkMode ? '#475569' : '#e2e8f0'};
      }
      
      .btn-secondary:hover {
        background: ${darkMode ? '#475569' : '#e2e8f0'};
        transform: translateY(-1px);
      }
      
      .btn-success {
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        color: white;
        box-shadow: 0 4px 14px 0 rgba(16, 185, 129, 0.3);
      }
      
      .btn-success:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px 0 rgba(16, 185, 129, 0.4);
      }
      
      .btn-favorite {
        background: ${darkMode ? '#334155' : '#f1f5f9'};
        color: #ef4444;
        border: 1px solid #ef4444;
        padding: 8px 12px;
        border-radius: 8px;
      }
      
      .btn-favorite.active {
        background: #ef4444;
        color: white;
      }
      
      .category-filter {
        display: flex;
        gap: 12px;
        margin-bottom: 32px;
        flex-wrap: wrap;
      }
      
      .category-btn {
        padding: 8px 16px;
        border-radius: 20px;
        border: 1px solid ${darkMode ? '#475569' : '#e2e8f0'};
        background: ${darkMode ? '#1e293b' : '#ffffff'};
        color: ${darkMode ? '#e2e8f0' : '#475569'};
        cursor: pointer;
        transition: all 0.3s ease;
        font-size: 14px;
        font-weight: 500;
      }
      
      .category-btn.active {
        background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
        color: white;
        border-color: transparent;
      }
      
      .product-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
        gap: 24px;
        margin-bottom: 40px;
      }
      
      .product-card {
        background: ${darkMode ? '#1e293b' : '#ffffff'};
        border-radius: 16px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        overflow: hidden;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        animation: fadeIn 0.6s ease-out;
        position: relative;
      }
      
      .product-card:hover {
        transform: translateY(-8px);
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
      }
      
      .product-image {
        width: 100%;
        height: 200px;
        object-fit: cover;
        transition: transform 0.3s ease;
      }
      
      .product-card:hover .product-image {
        transform: scale(1.05);
      }
      
      .product-content {
        padding: 24px;
      }
      
      .product-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 12px;
      }
      
      .product-name {
        font-size: 20px;
        font-weight: 700;
        color: ${darkMode ? '#f1f5f9' : '#1e293b'};
        margin-bottom: 4px;
      }
      
      .product-category {
        font-size: 12px;
        color: #8b5cf6;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .product-rating {
        display: flex;
        align-items: center;
        gap: 4px;
        margin-bottom: 12px;
      }
      
      .stars {
        color: #fbbf24;
      }
      
      .rating-text {
        font-size: 14px;
        color: ${darkMode ? '#94a3b8' : '#64748b'};
      }
      
      .product-description {
        font-size: 14px;
        color: ${darkMode ? '#cbd5e1' : '#64748b'};
        margin-bottom: 16px;
        line-height: 1.5;
      }
      
      .product-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 20px;
      }
      
      .product-price {
        font-size: 28px;
        font-weight: 800;
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }
      
      .product-stock {
        font-size: 12px;
        color: ${darkMode ? '#94a3b8' : '#64748b'};
        font-weight: 500;
      }
      
      .product-actions {
        display: flex;
        gap: 8px;
        margin-top: 16px;
      }
      
      .modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.6);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        backdrop-filter: blur(8px);
        animation: fadeIn 0.3s ease;
      }
      
      .modal-content {
        background: ${darkMode ? '#1e293b' : '#ffffff'};
        padding: 32px;
        border-radius: 20px;
        max-width: 480px;
        width: 90%;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        animation: slideIn 0.3s ease;
      }
      
      .form-group {
        margin-bottom: 20px;
      }
      
      .form-label {
        display: block;
        margin-bottom: 8px;
        font-weight: 600;
        color: ${darkMode ? '#e2e8f0' : '#374151'};
      }
      
      .form-input {
        width: 100%;
        padding: 12px 16px;
        border: 2px solid ${darkMode ? '#475569' : '#e2e8f0'};
        border-radius: 12px;
        background: ${darkMode ? '#334155' : '#f8fafc'};
        color: ${darkMode ? '#ffffff' : '#374151'};
        font-size: 16px;
        transition: all 0.3s ease;
      }
      
      .form-input:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
      }
      
      .payment-methods {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
        margin-bottom: 24px;
      }
      
      .payment-method {
        padding: 20px;
        border: 2px solid ${darkMode ? '#475569' : '#e2e8f0'};
        border-radius: 16px;
        cursor: pointer;
        text-align: center;
        transition: all 0.3s ease;
        position: relative;
        overflow: hidden;
      }
      
      .payment-method::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%);
        opacity: 0;
        transition: opacity 0.3s ease;
      }
      
      .payment-method.active {
        border-color: #3b82f6;
        background: ${darkMode ? '#1e40af' : '#eff6ff'};
        transform: scale(1.02);
      }
      
      .payment-method.active::before {
        opacity: 1;
      }
      
      .cart-summary {
        background: ${darkMode ? '#1e293b' : '#ffffff'};
        padding: 24px;
        border-radius: 16px;
        margin-bottom: 24px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      }
      
      .cart-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 0;
        border-bottom: 1px solid ${darkMode ? '#475569' : '#e2e8f0'};
      }
      
      .cart-item:last-child {
        border-bottom: none;
      }
      
      .cart-total {
        font-size: 24px;
        font-weight: 800;
        text-align: right;
        margin-top: 20px;
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }
      
      .alert {
        padding: 20px;
        border-radius: 16px;
        margin-bottom: 24px;
        animation: fadeIn 0.5s ease;
      }
      
      .alert-success {
        background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
        color: #166534;
        border: 1px solid #bbf7d0;
      }
      
      .btn-group {
        display: flex;
        gap: 12px;
        margin-top: 24px;
      }
      
      .btn-group .btn {
        flex: 1;
      }
      
      .loading {
        display: inline-block;
        width: 20px;
        height: 20px;
        border: 3px solid rgba(255,255,255,.3);
        border-radius: 50%;
        border-top-color: #fff;
        animation: spin 1s ease-in-out infinite;
      }
      
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
      
      .favorite-btn {
        background: transparent;
        border: none;
        cursor: pointer;
        padding: 8px;
        border-radius: 8px;
        transition: all 0.3s ease;
      }
      
      .favorite-btn:hover {
        background: rgba(239, 68, 68, 0.1);
      }
      
      .heart {
        font-size: 20px;
        transition: all 0.3s ease;
      }
      
      .heart.active {
        animation: pulse 0.5s ease;
      }
      
      /* Système de notifications */
      .notification-container {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 1001;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      
      .notification {
        padding: 16px 20px;
        border-radius: 12px;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        animation: slideInRight 0.3s ease;
        max-width: 300px;
        font-size: 14px;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 12px;
      }
      
      .notification.success {
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        color: white;
      }
      
      .notification.error {
        background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
        color: white;
      }
      
      .notification.info {
        background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
        color: white;
      }
      
      .notification.warning {
        background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        color: white;
      }
      
      @keyframes slideInRight {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      
      .notification-close {
        background: none;
        border: none;
        color: inherit;
        cursor: pointer;
        font-size: 18px;
        margin-left: auto;
        opacity: 0.8;
        transition: opacity 0.2s ease;
      }
      
      .notification-close:hover {
        opacity: 1;
      }
      
      @media (max-width: 768px) {
        .product-grid {
          grid-template-columns: 1fr;
          gap: 16px;
        }
        
        .product-card {
          margin: 0 8px;
        }
        
        .product-image {
          height: 160px;
        }
        
        .product-name {
          font-size: 18px;
        }
        
        .product-price {
          font-size: 24px;
        }
        
        .payment-methods {
          grid-template-columns: 1fr;
        }
        
        .header-content {
          flex-direction: column;
          gap: 16px;
          text-align: center;
        }
        
        .logo {
          font-size: 24px;
        }
        
        .nav-buttons {
          justify-content: center;
          width: 100%;
        }
        
        .category-filter {
          justify-content: center;
          gap: 8px;
        }
        
        .category-btn {
          font-size: 12px;
          padding: 6px 12px;
        }
        
        .modal-content {
          margin: 20px;
          padding: 24px;
        }
        
        .btn {
          padding: 10px 20px;
          font-size: 14px;
        }
        
        .product-actions {
          flex-direction: column;
        }
        
        .product-actions .btn {
          width: 100%;
        }
      }
      
      @media (max-width: 480px) {
        .container {
          padding: 0 12px;
        }
        
        .header {
          padding: 16px 0;
        }
        
        .product-content {
          padding: 16px;
        }
        
        .product-grid {
          grid-template-columns: 1fr;
          gap: 12px;
        }
        
        .product-image {
          height: 140px;
        }
        
        .modal-content {
          padding: 20px;
          margin: 10px;
        }
        
        .payment-method {
          padding: 16px;
        }
        
        .category-btn {
          font-size: 11px;
          padding: 5px 10px;
        }
      }
      
      /* Optimisations tactiles */
      .btn, .category-btn, .favorite-btn {
        -webkit-tap-highlight-color: transparent;
        touch-action: manipulation;
      }
      
      .btn:active, .category-btn:active, .favorite-btn:active {
        transform: scale(0.95);
      }
      
      /* Amélioration du défilement */
      .product-grid {
        scroll-behavior: smooth;
      }
      
      /* Support pour mode portrait/paysage */
      @media (orientation: landscape) and (max-width: 768px) {
        .product-grid {
          grid-template-columns: repeat(2, 1fr);
        }
      }
      
      /* Accessibilité - mode haut contraste */
      @media (prefers-contrast: high) {
        .btn-primary {
          border: 2px solid currentColor;
        }
        
        .product-card {
          border: 1px solid;
        }
      }
      
      /* Réduction des animations si demandé */
      @media (prefers-reduced-motion: reduce) {
        * {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }
      }
    `;
    
    const styleSheet = document.createElement("style");
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
    
    return () => {
      document.head.removeChild(styleSheet);
    };
  }, [darkMode]);

  // Fonctions utilitaires
  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getCartItemCount = () => {
    return cart.reduce((count, item) => count + item.quantity, 0);
  };

  // Gestion des favoris
  const toggleFavorite = (productId) => {
    if (favorites.includes(productId)) {
      setFavorites(favorites.filter(id => id !== productId));
    } else {
      setFavorites([...favorites, productId]);
    }
  };

  // Gestion du panier
  const addToCart = (product, qty) => {
    setLoading(true);
    setTimeout(() => {
      setCart([...cart, { ...product, quantity: qty, cartId: Date.now() }]);
      setSelectedProduct(null);
      setQuantity(1);
      setLoading(false);
      // Notification de succès
      addNotification(`✅ ${product.name} ajouté au panier !`, 'success');
    }, 500);
  };

  const clearCart = () => {
    setCart([]);
    addNotification('🗑️ Panier vidé', 'info');
  };
  
  // Système de notifications
  const addNotification = (message, type = 'info') => {
    const notification = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date()
    };
    setNotifications(prev => [...prev, notification]);
    
    // Supprimer la notification après 5 secondes
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 5000);
  };

  // Gestion du paiement
  const handlePaymentSuccess = (details) => {
    setPaymentSuccess(true);
    clearCart();
    setTimeout(() => {
      setCurrentPage('products');
      setPaymentSuccess(false);
    }, 3000);
  };

  const handlePaymentCancel = () => {
    console.log('Paiement annulé');
  };

  // Composant Produits avec filtres et animations
  const ProductsPage = () => {
    const [selectedCategory, setSelectedCategory] = useState('Tous');
    const categories = ['Tous', ...Array.from(new Set(products.map(p => p.category)))];
    
    // Filtrage et recherche
    const filteredProducts = selectedCategory === 'Tous' 
      ? products.filter(p => p.active && p.name.toLowerCase().includes(searchTerm.toLowerCase()))
      : products.filter(p => p.active && p.category === selectedCategory && p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Tri des produits
    const sortedProducts = [...filteredProducts].sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      if (sortBy === 'price') {
        aValue = parseFloat(aValue);
        bValue = parseFloat(bValue);
      }
      
      if (sortBy === 'rating') {
        aValue = parseFloat(aValue);
        bValue = parseFloat(bValue);
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return (
      <div className="container">
        {/* Barre de recherche et contrôles */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ 
            display: 'flex', 
            gap: '16px', 
            marginBottom: '24px',
            flexWrap: 'wrap',
            alignItems: 'center'
          }}>
            <input
              type="text"
              placeholder="🔍 Rechercher un produit..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                flex: 1,
                minWidth: '250px',
                padding: '12px 16px',
                borderRadius: '12px',
                border: `2px solid ${darkMode ? '#475569' : '#e2e8f0'}`,
                background: darkMode ? '#334155' : '#ffffff',
                color: darkMode ? '#ffffff' : '#374151',
                fontSize: '16px'
              }}
            />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                padding: '12px 16px',
                borderRadius: '12px',
                border: `2px solid ${darkMode ? '#475569' : '#e2e8f0'}`,
                background: darkMode ? '#334155' : '#ffffff',
                color: darkMode ? '#ffffff' : '#374151',
                fontSize: '14px'
              }}
            >
              <option value="name">Trier par nom</option>
              <option value="price">Trier par prix</option>
              <option value="rating">Trier par note</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              style={{
                padding: '12px 16px',
                borderRadius: '12px',
                border: `2px solid ${darkMode ? '#475569' : '#e2e8f0'}`,
                background: darkMode ? '#334155' : '#ffffff',
                color: darkMode ? '#ffffff' : '#374151',
                cursor: 'pointer'
              }}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>

        {/* Filtres de catégorie */}
        <div className="category-filter">
          {categories.map(category => (
            <button
              key={category}
              className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Résultats et nombre de produits */}
        <div style={{ 
          marginBottom: '24px', 
          fontSize: '14px', 
          color: darkMode ? '#94a3b8' : '#64748b' 
        }}>
          {sortedProducts.length} produit{sortedProducts.length !== 1 ? 's' : ''} trouvé{sortedProducts.length !== 1 ? 's' : ''}
          {searchTerm && ` pour "${searchTerm}"`}
        </div>

        {/* Grille de produits */}
        <div className="product-grid">
          {sortedProducts.map((product, index) => (
            <div 
              key={product.id} 
              className="product-card"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div style={{ position: 'relative', overflow: 'hidden' }}>
                <img 
                  src={product.image} 
                  alt={product.name}
                  className="product-image"
                />
                <button
                  className={`favorite-btn ${favorites.includes(product.id) ? 'active' : ''}`}
                  onClick={() => toggleFavorite(product.id)}
                >
                  <span className={`heart ${favorites.includes(product.id) ? 'active' : ''}`}>
                    {favorites.includes(product.id) ? '❤️' : '🤍'}
                  </span>
                </button>
              </div>
              
              <div className="product-content">
                <div className="product-header">
                  <div>
                    <div className="product-name">{product.name}</div>
                    <div className="product-category">{product.category}</div>
                  </div>
                </div>
                
                <div className="product-rating">
                  <div className="stars">
                    {'★'.repeat(Math.floor(product.rating))}{'☆'.repeat(5-Math.floor(product.rating))}
                  </div>
                  <span className="rating-text">{product.rating} ({product.reviews})</span>
                </div>
                
                <div className="product-description">{product.description}</div>
                
                <div className="product-footer">
                  <div>
                    <div className="product-price">{product.price}€</div>
                    <div className="product-stock">Stock: {product.stock}</div>
                  </div>
                </div>
                
                <div className="product-actions">
                  <button 
                    className="btn btn-primary"
                    onClick={() => setSelectedProduct(product)}
                    disabled={loading}
                  >
                    {loading ? <span className="loading"></span> : '🛒 Ajouter'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Modal de sélection de quantité */}
        {selectedProduct && (
          <div className="modal">
            <div className="modal-content">
              <h3 style={{ marginBottom: '20px', fontSize: '24px' }}>{selectedProduct.name}</h3>
              <div className="form-group">
                <label className="form-label">Quantité</label>
                <input
                  type="number"
                  min="1"
                  max={selectedProduct.stock}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Math.min(selectedProduct.stock, parseInt(e.target.value) || 1)))}
                  className="form-input"
                />
              </div>
              <div className="btn-group">
                <button
                  onClick={() => addToCart(selectedProduct, quantity)}
                  className="btn btn-success"
                >
                  Confirmer l'ajout
                </button>
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="btn btn-secondary"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Composant Checkout amélioré
  const CheckoutPage = () => {
    const total = getCartTotal();

    if (paymentSuccess) {
      return (
        <div className="container">
          <div className="alert alert-success">
            <h3>🎉 Commande confirmée !</h3>
            <p>Votre paiement a été traité avec succès. Vous allez être redirigé vers la boutique...</p>
          </div>
        </div>
      );
    }

    return (
      <div className="container">
        <h1 style={{ marginBottom: '40px', fontSize: '36px', fontWeight: '800' }}>Finaliser votre commande</h1>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
          {/* Résumé de la commande */}
          <div>
            <div className="cart-summary">
              <h2 style={{ marginBottom: '20px', fontSize: '24px', fontWeight: '700' }}>Votre commande</h2>
              {cart.map((item) => (
                <div key={item.cartId} className="cart-item">
                  <div>
                    <div style={{ fontWeight: '600', marginBottom: '4px' }}>{item.name}</div>
                    <div style={{ fontSize: '14px', color: '#6b7280' }}>Qté: {item.quantity}</div>
                  </div>
                  <div style={{ fontWeight: '700', fontSize: '18px' }}>
                    {(item.price * item.quantity)}€
                  </div>
                </div>
              ))}
              <div className="cart-total">
                Total: {total}€
              </div>
            </div>
          </div>

          {/* Méthode de paiement */}
          <div>
            <h2 style={{ marginBottom: '24px', fontSize: '24px', fontWeight: '700' }}>Méthode de paiement</h2>
            
            {/* Sélecteur de paiement */}
            <div className="payment-methods">
              <div 
                className={`payment-method ${paymentMethod === 'stripe' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('stripe')}
              >
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>💳</div>
                <div style={{ fontWeight: '600', fontSize: '16px' }}>Carte bancaire</div>
                <div style={{ fontSize: '12px', opacity: '0.7' }}>Stripe sécurisé</div>
              </div>
              
              <div 
                className={`payment-method ${paymentMethod === 'paypal' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('paypal')}
              >
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>💰</div>
                <div style={{ fontWeight: '600', fontSize: '16px' }}>PayPal</div>
                <div style={{ fontSize: '12px', opacity: '0.7' }}>Paiement express</div>
              </div>
            </div>

            {/* Formulaire de paiement */}
            <div style={{ 
              background: darkMode ? '#1e293b' : '#ffffff', 
              padding: '24px', 
              borderRadius: '16px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}>
              {paymentMethod === 'stripe' ? (
                <div>
                  <h3 style={{ marginBottom: '20px', fontSize: '20px', fontWeight: '600' }}>
                    Informations de paiement
                  </h3>
                  <div className="form-group">
                    <label className="form-label">Numéro de carte</label>
                    <input 
                      type="text" 
                      placeholder="1234 5678 9012 3456"
                      className="form-input"
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="form-group">
                      <label className="form-label">Date d'expiration</label>
                      <input 
                        type="text" 
                        placeholder="MM/AA"
                        className="form-input"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">CVV</label>
                      <input 
                        type="text" 
                        placeholder="123"
                        className="form-input"
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      // Simulation Stripe
                      alert('Paiement Stripe simulé - Succès!');
                      handlePaymentSuccess({ id: 'pi_test_' + Date.now() });
                    }}
                    className="btn btn-primary"
                    style={{ width: '100%', marginTop: '20px' }}
                  >
                    🔒 Payer {total}€
                  </button>
                </div>
              ) : (
                <div>
                  <h3 style={{ marginBottom: '20px', fontSize: '20px', fontWeight: '600' }}>
                    Payer avec PayPal
                  </h3>
                  <div style={{ textAlign: 'center', padding: '20px' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>💰</div>
                    <p style={{ marginBottom: '20px', fontSize: '16px' }}>
                      Vous allez être redirigé vers PayPal pour finaliser votre paiement en toute sécurité.
                    </p>
                    <button
                      onClick={() => {
                        // Simulation PayPal
                        alert('Paiement PayPal simulé - Succès!');
                        handlePaymentSuccess({ id: 'paypal_test_' + Date.now() });
                      }}
                      className="btn btn-primary"
                      style={{ width: '100%' }}
                    >
                      Continuer avec PayPal
                    </button>
                  </div>
                </div>
              )}
              <button
                onClick={handlePaymentCancel}
                className="btn btn-secondary"
                style={{ width: '100%', marginTop: '12px' }}
              >
                Annuler la commande
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Rendu principal
  return (
    <div>
      {/* Système de notifications */}
      <div className="notification-container">
        {notifications.map(notification => (
          <div key={notification.id} className={`notification ${notification.type}`}>
            <span>{notification.message}</span>
            <button
              className="notification-close"
              onClick={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {/* Header amélioré */}
      <header className="header">
        <div className="header-content">
          <div 
            className="logo"
            onClick={() => setCurrentPage('products')}
          >
            🛍️ Mini-Boutique Pro
          </div>
          <div className="nav-buttons">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="btn btn-secondary"
              title={darkMode ? 'Mode clair' : 'Mode sombre'}
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
            <button
              onClick={() => setCurrentPage('checkout')}
              className="btn btn-primary"
            >
              🛒 Panier {getCartItemCount() > 0 && `(${getCartItemCount()})`}
            </button>
          </div>
        </div>
      </header>

      {/* Contenu principal avec animations */}
      <main style={{ animation: 'fadeIn 0.6s ease-out' }}>
        {currentPage === 'products' ? <ProductsPage /> : <CheckoutPage />}
      </main>
    </div>
  );
}

export default App;