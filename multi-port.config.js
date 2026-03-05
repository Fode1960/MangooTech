// Configuration multi-ports pour une architecture URL propre

const PORT_CONFIG = {
  // Port 3001: Pages principales (Home, Marketplace, etc.)
  main: {
    port: 3001,
    routes: [
      '/',
      '/home',
      '/marketplace',
      '/about',
      '/contact',
      '/services',
      '/terms',
      '/privacy',
      '/cookies'
    ]
  },
  
  // Port 3002: Authentification (Login, Register, etc.)
  auth: {
    port: 3002,
    routes: [
      '/login',
      '/register',
      '/forgot-password',
      '/reset-password',
      '/auth-callback'
    ]
  },
  
  // Port 3003: Espace vendeur (Dashboard, CreateShop, etc.)
  seller: {
    port: 3003,
    routes: [
      '/seller/dashboard',
      '/seller/create-shop',
      '/seller/products',
      '/seller/products/new',
      '/seller/orders',
      '/seller/settings'
    ]
  },
  
  // Port 3004: Administration
  admin: {
    port: 3004,
    routes: [
      '/admin/dashboard',
      '/admin/users',
      '/admin/shops',
      '/admin/products',
      '/admin/orders',
      '/admin/settings'
    ]
  },
  
  // Port 3005: API et services
  api: {
    port: 3005,
    routes: [
      '/api/*',
      '/webhook/*',
      '/health'
    ]
  }
};

// Fonction pour obtenir le port approprié selon la route
function getPortForRoute(route) {
  for (const [section, config] of Object.entries(PORT_CONFIG)) {
    if (config.routes.some(r => route.startsWith(r))) {
      return config.port;
    }
  }
  // Par défaut, retourner le port principal
  return PORT_CONFIG.main.port;
}

// Fonction pour obtenir la configuration complète d'une section
function getConfigForSection(section) {
  return PORT_CONFIG[section] || PORT_CONFIG.main;
}

// Fonction pour obtenir toutes les configurations
function getAllConfigs() {
  return PORT_CONFIG;
}

module.exports = {
  PORT_CONFIG,
  getPortForRoute,
  getConfigForSection,
  getAllConfigs
};