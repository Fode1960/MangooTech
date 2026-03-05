import { useMemo, useCallback } from 'react';
import { useStore } from '../stores/optimizedStore';

export const useOptimizedProducts = () => {
  const { products, searchQuery, selectedCategory, priceRange, selectedRating, selectedSort } = useStore();

  // Mémorisation du parsing des prix
  const parsePrice = useCallback((priceStr) => {
    return parseFloat(priceStr.replace(/[^\d]/g, ''));
  }, []);

  // Mémorisation du filtrage et du tri des produits
  const filteredAndSortedProducts = useMemo(() => {
    if (!products || products.length === 0) return [];

    return products
      .filter(product => {
        // Filtrage par catégorie
        if (selectedCategory !== 'all' && product.category !== selectedCategory) return false;
        
        // Filtrage par recherche
        if (searchQuery && !product.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
            !product.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        
        // Filtrage par prix
        const price = parsePrice(product.price);
        if (price < priceRange[0] || price > priceRange[1]) return false;
        
        // Filtrage par note
        if (selectedRating > 0 && product.rating < selectedRating) return false;
        
        return true;
      })
      .sort((a, b) => {
        switch (selectedSort) {
          case 'price-low':
            return parsePrice(a.price) - parsePrice(b.price);
          case 'price-high':
            return parsePrice(b.price) - parsePrice(a.price);
          case 'rating':
            return b.rating - a.rating;
          case 'name':
          default:
            return a.name.localeCompare(b.name);
        }
      });
  }, [products, searchQuery, selectedCategory, priceRange, selectedRating, selectedSort, parsePrice]);

  // Mémorisation des statistiques des produits
  const productStats = useMemo(() => {
    const total = filteredAndSortedProducts.length;
    const categories = {};
    const priceRanges = {
      low: 0,
      medium: 0,
      high: 0
    };

    filteredAndSortedProducts.forEach(product => {
      // Compter par catégorie
      categories[product.category] = (categories[product.category] || 0) + 1;
      
      // Compter par gamme de prix
      const price = parsePrice(product.price);
      if (price < 50000) priceRanges.low++;
      else if (price < 150000) priceRanges.medium++;
      else priceRanges.high++;
    });

    return {
      total,
      categories: Object.entries(categories).map(([name, count]) => ({ name, count })),
      priceRanges
    };
  }, [filteredAndSortedProducts, parsePrice]);

  return {
    products: filteredAndSortedProducts,
    stats: productStats,
    isLoading: !products
  };
};

export const useCartOptimization = () => {
  const { cart } = useStore();

  // Mémorisation du total du panier
  const cartTotal = useMemo(() => {
    if (!cart || cart.length === 0) return 0;
    
    return cart.reduce((total, item) => {
      const price = parseFloat(item.price.replace(/[^\d]/g, ''));
      return total + (price * (item.quantity || 1));
    }, 0);
  }, [cart]);

  // Mémorisation du nombre d'articles
  const cartItemsCount = useMemo(() => {
    if (!cart || cart.length === 0) return 0;
    return cart.reduce((total, item) => total + (item.quantity || 1), 0);
  }, [cart]);

  // Mémorisation des IDs des produits dans le panier
  const cartProductIds = useMemo(() => {
    if (!cart || cart.length === 0) return new Set();
    return new Set(cart.map(item => item.id));
  }, [cart]);

  return {
    cartTotal,
    cartItemsCount,
    cartProductIds,
    cart
  };
};

export const useWishlistOptimization = () => {
  const { wishlist } = useStore();

  // Mémorisation des IDs de la wishlist pour des vérifications rapides
  const wishlistSet = useMemo(() => {
    if (!wishlist || wishlist.length === 0) return new Set();
    return new Set(wishlist);
  }, [wishlist]);

  const isInWishlist = useCallback((productId) => {
    return wishlistSet.has(productId);
  }, [wishlistSet]);

  return {
    wishlist,
    wishlistSet,
    isInWishlist,
    wishlistCount: wishlist?.length || 0
  };
};