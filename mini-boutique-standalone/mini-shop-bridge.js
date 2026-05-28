/**
 * Mini-Shop Bridge - Communication entre MangooTech et Mini-Boutique
 * Ce script gère la communication cross-origin entre l'application principale et la Mini-Boutique
 */

(function() {
  'use strict';
  
  console.log('🔐 Mini-Shop Bridge chargé');
  
  // Configuration
  const CONFIG = {
    SHOP_ORIGIN: window.location.origin,
    STORAGE_KEYS: {
      USER_DATA: 'miniShopUser',
      THEME: 'miniShopTheme',
      PRODUCTS: 'miniShopProducts',
      CART: 'miniShopCart',
      STOCK: 'miniShopStock'
    }
  };
  
  // Utilitaire pour générer un ID utilisateur unique
  function generateUserId() {
    return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
  
  // Récupérer ou créer l'utilisateur actuel
  function getCurrentUser() {
    try {
      const stored = sessionStorage.getItem(CONFIG.STORAGE_KEYS.USER_DATA);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Erreur lecture utilisateur:', error);
    }
    
    // Utilisateur par défaut pour la démo
    const defaultUser = {
      id: generateUserId(),
      email: 'demo@example.com',
      name: 'Utilisateur Demo',
      role: 'shop_owner',
      createdAt: new Date().toISOString()
    };
    
    try {
      sessionStorage.setItem(CONFIG.STORAGE_KEYS.USER_DATA, JSON.stringify(defaultUser));
    } catch (error) {
      console.warn('Erreur sauvegarde utilisateur:', error);
    }
    
    return defaultUser;
  }
  
  // Gestionnaire de messages cross-origin
  function handleMessage(event) {
    try {
      // Vérifier l'origine du message (sécurité)
      if (event.origin !== window.location.origin && !event.origin.includes('localhost')) {
        console.warn('Origine non autorisée:', event.origin);
        return;
      }
      
      const { type, data } = event.data;
      
      switch (type) {
        case 'MINI_SHOP_INIT':
          handleShopInit(event);
          break;
          
        case 'MINI_SHOP_GET_USER':
          handleGetUser(event);
          break;
          
        case 'MINI_SHOP_SET_USER':
          handleSetUser(event, data);
          break;
          
        case 'MINI_SHOP_CLEAR_DATA':
          handleClearData(event);
          break;
          
        case 'MINI_SHOP_SYNC_THEME':
          handleSyncTheme(event, data);
          break;
          
        default:
          console.log('Message non géré:', type);
      }
    } catch (error) {
      console.error('Erreur traitement message:', error);
    }
  }
  
  // Initialisation de la boutique
  function handleShopInit(event) {
    const user = getCurrentUser();
    const theme = localStorage.getItem(CONFIG.STORAGE_KEYS.THEME) || 'light';
    
    event.source.postMessage({
      type: 'MINI_SHOP_INIT_RESPONSE',
      data: {
        success: true,
        user: user,
        theme: theme,
        timestamp: new Date().toISOString()
      }
    }, event.origin);
    
    console.log('✅ Mini-Shop initialisé pour utilisateur:', user.id);
  }
  
  // Récupération des données utilisateur
  function handleGetUser(event) {
    const user = getCurrentUser();
    
    event.source.postMessage({
      type: 'MINI_SHOP_USER_DATA',
      data: {
        user: user,
        timestamp: new Date().toISOString()
      }
    }, event.origin);
  }
  
  // Mise à jour des données utilisateur
  function handleSetUser(event, data) {
    try {
      if (data && data.user) {
        sessionStorage.setItem(CONFIG.STORAGE_KEYS.USER_DATA, JSON.stringify(data.user));
        
        event.source.postMessage({
          type: 'MINI_SHOP_SET_USER_RESPONSE',
          data: {
            success: true,
            message: 'Utilisateur mis à jour'
          }
        }, event.origin);
        
        console.log('✅ Utilisateur mis à jour:', data.user.id);
      }
    } catch (error) {
      console.error('Erreur mise à jour utilisateur:', error);
      
      event.source.postMessage({
        type: 'MINI_SHOP_SET_USER_RESPONSE',
        data: {
          success: false,
          error: error.message
        }
      }, event.origin);
    }
  }
  
  // Synchronisation du thème
  function handleSyncTheme(event, data) {
    try {
      if (data && data.theme) {
        localStorage.setItem(CONFIG.STORAGE_KEYS.THEME, data.theme);
        
        // Émettre un événement personnalisé pour le changement de thème
        window.dispatchEvent(new CustomEvent('miniShopThemeChanged', {
          detail: { theme: data.theme }
        }));
        
        event.source.postMessage({
          type: 'MINI_SHOP_THEME_SYNCED',
          data: {
            success: true,
            theme: data.theme
          }
        }, event.origin);
        
        console.log('🎨 Thème synchronisé:', data.theme);
      }
    } catch (error) {
      console.error('Erreur synchronisation thème:', error);
    }
  }
  
  // Nettoyage des données
  function handleClearData(event) {
    try {
      Object.values(CONFIG.STORAGE_KEYS).forEach(key => {
        sessionStorage.removeItem(key);
        localStorage.removeItem(key);
      });
      
      event.source.postMessage({
        type: 'MINI_SHOP_DATA_CLEARED',
        data: {
          success: true,
          message: 'Données nettoyées'
        }
      }, event.origin);
      
      console.log('🗑️ Données Mini-Shop nettoyées');
    } catch (error) {
      console.error('Erreur nettoyage données:', error);
    }
  }
  
  // Fonctions utilitaires publiques
  window.MiniShopBridge = {
    getCurrentUser: getCurrentUser,
    getConfig: () => CONFIG,
    
    // Envoyer un message à la fenêtre parent (si dans iframe)
    sendMessage: function(type, data) {
      if (window.parent !== window) {
        window.parent.postMessage({
          type: type,
          data: data,
          timestamp: new Date().toISOString()
        }, '*');
      }
    },
    
    // Déclencher un changement de thème
    toggleTheme: function() {
      const currentTheme = localStorage.getItem(CONFIG.STORAGE_KEYS.THEME) || 'light';
      const newTheme = currentTheme === 'light' ? 'dark' : 'light';
      
      localStorage.setItem(CONFIG.STORAGE_KEYS.THEME, newTheme);
      
      window.dispatchEvent(new CustomEvent('miniShopThemeChanged', {
        detail: { theme: newTheme }
      }));
      
      this.sendMessage('MINI_SHOP_THEME_CHANGED', { theme: newTheme });
      
      return newTheme;
    }
  };
  
  // Écouter les messages entrants
  window.addEventListener('message', handleMessage);
  
  // Émettre un événement de prêt
  window.dispatchEvent(new CustomEvent('miniShopBridgeReady'));
  
  console.log('🔐 Mini-Shop Bridge chargé. Utilisateur:', getCurrentUser());
  
})();