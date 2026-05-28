import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useShop } from './ShopContext.jsx';
import { useNotifications } from './NotificationContext.jsx';

const StockContext = createContext();

export const StockProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const { currentShop } = useShop();
  const { push } = useNotifications();
  const LOW_STOCK_THRESHOLD = 5;
  const CRITICAL_STOCK_THRESHOLD = 2;

  const getProductStock = (userId, productId) => {
    const stockData = loadStockData(userId);
    return stockData[productId] || 0;
  };

  const loadStockData = (userId) => {
    try {
      const key = `miniShopStock_${userId}${currentShop?.id ? '_' + currentShop.id : ''}`;
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : {};
    } catch (error) {
      console.error('Erreur chargement stock:', error);
      return {};
    }
  };

  const saveStockData = (userId, stockData) => {
    try {
      const key = `miniShopStock_${userId}${currentShop?.id ? '_' + currentShop.id : ''}`;
      localStorage.setItem(key, JSON.stringify(stockData));
    } catch (error) {
      console.error('Erreur sauvegarde stock:', error);
    }
  };

  const checkStockAvailability = (userId, cartItems) => {
    const stockData = loadStockData(userId);
    const unavailableItems = [];

    for (const item of cartItems) {
      const currentStock = stockData[item.id] || 0;
      if (currentStock < item.quantity) {
        unavailableItems.push({
          productId: item.id,
          productName: item.name,
          requestedQuantity: item.quantity,
          availableStock: currentStock
        });
      }
    }

    return {
      available: unavailableItems.length === 0,
      unavailableItems
    };
  };

  const updateStock = (userId, productId, quantity, type = 'sale') => {
    const stockData = loadStockData(userId);
    const currentStock = stockData[productId] || 0;
    const newStock = type === 'sale' ? Math.max(0, currentStock - quantity) : currentStock + quantity;
    
    stockData[productId] = newStock;
    saveStockData(userId, stockData);

    addStockHistory(userId, productId, quantity, type, currentStock, newStock);
    if (newStock <= CRITICAL_STOCK_THRESHOLD) push({ type: 'stock_low', title: 'Stock critique', message: String(productId), data: { remaining: newStock } })
    else if (newStock <= LOW_STOCK_THRESHOLD) push({ type: 'stock_low', title: 'Stock faible', message: String(productId), data: { remaining: newStock } })

    return newStock;
  };

  const addStockHistory = (userId, productId, quantity, type, oldStock, newStock) => {
    try {
      const historyKey = `miniShopStockHistory_${userId}${currentShop?.id ? '_' + currentShop.id : ''}`;
      const history = JSON.parse(localStorage.getItem(historyKey) || '[]');
      
      history.unshift({
        id: Date.now(),
        productId,
        quantity,
        type,
        oldStock,
        newStock,
        timestamp: new Date().toISOString()
      });

      localStorage.setItem(historyKey, JSON.stringify(history.slice(0, 100)));
    } catch (error) {
      console.error('Erreur historique stock:', error);
    }
  };

  const getStockHistory = (userId, filters = {}) => {
    try {
      const historyKey = `miniShopStockHistory_${userId}${currentShop?.id ? '_' + currentShop.id : ''}`;
      let history = JSON.parse(localStorage.getItem(historyKey) || '[]');

      if (filters.productId) {
        history = history.filter(item => item.productId === filters.productId);
      }
      if (filters.type) {
        history = history.filter(item => item.type === filters.type);
      }
      if (filters.startDate) {
        history = history.filter(item => new Date(item.timestamp) >= new Date(filters.startDate));
      }
      if (filters.endDate) {
        history = history.filter(item => new Date(item.timestamp) <= new Date(filters.endDate));
      }

      return history;
    } catch (error) {
      console.error('Erreur récupération historique:', error);
      return [];
    }
  };

  const getStockAlerts = (userId) => {
    const stockData = loadStockData(userId);
    const products = JSON.parse(localStorage.getItem(`miniShopProducts_${userId}`) || '[]');
    const alerts = [];

    products.forEach(product => {
      const stock = stockData[product.id] || 0;
      if (stock <= CRITICAL_STOCK_THRESHOLD) {
        alerts.push({
          productId: product.id,
          productName: product.name,
          currentStock: stock,
          alertLevel: 'critical'
        });
      } else if (stock <= LOW_STOCK_THRESHOLD) {
        alerts.push({
          productId: product.id,
          productName: product.name,
          currentStock: stock,
          alertLevel: 'low'
        });
      }
    });

    return alerts;
  };

  const getLowStockProducts = (userId, products = null) => {
    try {
      // Si products n'est pas fourni, charger depuis localStorage
      const productsList = products || JSON.parse(localStorage.getItem(`miniShopProducts_${userId}`) || '[]');
      
      // Vérifier que productsList est bien un tableau
      if (!Array.isArray(productsList)) {
        console.warn('⚠️ getLowStockProducts: productsList n\'est pas un tableau valide');
        return [];
      }
      
      return productsList.filter(product => {
        if (!product || !product.id) return false;
        const stock = getProductStock(userId, product.id);
        return stock <= LOW_STOCK_THRESHOLD && stock > 0;
      });
    } catch (error) {
      console.error('❌ Erreur dans getLowStockProducts:', error);
      return [];
    }
  };

  const getCriticalStockProducts = (userId, products = null) => {
    try {
      // Si products n'est pas fourni, charger depuis localStorage
      const productsList = products || JSON.parse(localStorage.getItem(`miniShopProducts_${userId}`) || '[]');
      
      // Vérifier que productsList est bien un tableau
      if (!Array.isArray(productsList)) {
        console.warn('⚠️ getCriticalStockProducts: productsList n\'est pas un tableau valide');
        return [];
      }
      
      return productsList.filter(product => {
        if (!product || !product.id) return false;
        const stock = getProductStock(userId, product.id);
        return stock <= CRITICAL_STOCK_THRESHOLD && stock > 0;
      });
    } catch (error) {
      console.error('❌ Erreur dans getCriticalStockProducts:', error);
      return [];
    }
  };

  const getOutOfStockProducts = (userId, products = null) => {
    try {
      // Si products n'est pas fourni, charger depuis localStorage
      const productsList = products || JSON.parse(localStorage.getItem(`miniShopProducts_${userId}`) || '[]');
      
      // Vérifier que productsList est bien un tableau
      if (!Array.isArray(productsList)) {
        console.warn('⚠️ getOutOfStockProducts: productsList n\'est pas un tableau valide');
        return [];
      }
      
      return productsList.filter(product => {
        if (!product || !product.id) return false;
        const stock = getProductStock(userId, product.id);
        return stock === 0;
      });
    } catch (error) {
      console.error('❌ Erreur dans getOutOfStockProducts:', error);
      return [];
    }
  };

  const adjustStock = (userId, productId, newQuantity, type, notes) => {
    updateStock(userId, productId, newQuantity, type, notes);
  };

  return (
    <StockContext.Provider value={{
      getProductStock,
      checkStockAvailability,
      updateStock,
      getStockHistory,
      getStockAlerts,
      getLowStockProducts,
      getCriticalStockProducts,
      getOutOfStockProducts,
      adjustStock,
      loadStockData,
      saveStockData,
      LOW_STOCK_THRESHOLD,
      CRITICAL_STOCK_THRESHOLD
    }}>
      {children}
    </StockContext.Provider>
  );
};

export const useStock = () => {
  const context = useContext(StockContext);
  if (!context) throw new Error('useStock doit être utilisé dans StockProvider');
  return context;
};