import React, { useState, useCallback, useMemo } from 'react';
import { FixedSizeGrid as Grid } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import ProductCard from './OptimizedProductCard';

const OptimizedProductGrid = ({ 
  products, 
  onAddToCart, 
  onQuickView, 
  onToggleWishlist, 
  wishlist, 
  cart,
  columnWidth = 280,
  rowHeight = 380,
  gap = 20
}) => {
  const [containerWidth, setContainerWidth] = useState(1200);

  // Calcul du nombre de colonnes en fonction de la largeur du conteneur
  const columnCount = useMemo(() => {
    const count = Math.floor(containerWidth / (columnWidth + gap));
    return Math.max(1, count);
  }, [containerWidth, columnWidth, gap]);

  // Calcul du nombre de lignes
  const rowCount = useMemo(() => {
    return Math.ceil(products.length / columnCount);
  }, [products.length, columnCount]);

  // Mémorisation des IDs pour des vérifications rapides
  const wishlistSet = useMemo(() => new Set(wishlist), [wishlist]);
  const cartSet = useMemo(() => new Set(cart.map(item => item.id)), [cart]);

  // Callback pour gérer le redimensionnement
  const handleResize = useCallback((width) => {
    setContainerWidth(width);
  }, []);

  // Rendu d'une cellule individuelle
  const Cell = useCallback(({ columnIndex, rowIndex, style }) => {
    const index = rowIndex * columnCount + columnIndex;
    const product = products[index];

    if (!product) return null;

    return (
      <div 
        style={{
          ...style,
          paddingRight: columnIndex === columnCount - 1 ? 0 : gap / 2,
          paddingLeft: columnIndex === 0 ? 0 : gap / 2,
          paddingBottom: gap
        }}
      >
        <ProductCard
          product={product}
          onAddToCart={onAddToCart}
          onQuickView={onQuickView}
          onToggleWishlist={onToggleWishlist}
          isInWishlist={wishlistSet.has(product.id)}
          isInCart={cartSet.has(product.id)}
        />
      </div>
    );
  }, [products, columnCount, onAddToCart, onQuickView, onToggleWishlist, wishlistSet, cartSet, gap]);

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🔍</div>
        <h3 className="text-xl font-semibold mb-2 text-gray-700 dark:text-gray-300">
          Aucun produit trouvé
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Essayez d'ajuster vos filtres de recherche
        </p>
      </div>
    );
  }

  return (
    <div className="w-full h-full" style={{ minHeight: '600px' }}>
      <AutoSizer onResize={handleResize}>
        {({ height, width }) => (
          <Grid
            columnCount={columnCount}
            columnWidth={columnWidth + gap}
            height={height}
            rowCount={rowCount}
            rowHeight={rowHeight + gap}
            width={width}
            itemData={{
              products,
              columnCount,
              onAddToCart,
              onQuickView,
              onToggleWishlist,
              wishlistSet,
              cartSet,
              gap
            }}
          >
            {Cell}
          </Grid>
        )}
      </AutoSizer>
    </div>
  );
};

export default OptimizedProductGrid;