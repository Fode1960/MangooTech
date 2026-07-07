import React, { memo, useCallback, useMemo } from 'react';

const ProductCard = memo(({ 
  product, 
  onAddToCart, 
  onQuickView, 
  onToggleWishlist, 
  isInWishlist,
  isInCart 
}) => {
  // Mémorisation des callbacks pour éviter les re-rendus inutiles
  const handleAddToCart = useCallback((e) => {
    e.stopPropagation();
    onAddToCart(product);
  }, [onAddToCart, product]);

  const handleQuickView = useCallback((e) => {
    e.stopPropagation();
    onQuickView(product);
  }, [onQuickView, product]);

  const handleToggleWishlist = useCallback((e) => {
    e.stopPropagation();
    onToggleWishlist(product.id);
  }, [onToggleWishlist, product.id]);

  // Mémorisation du calcul du prix avec réduction
  const { displayPrice, originalPrice, discountPercentage } = useMemo(() => {
    const price = parseFloat(product.price.replace(/[^\d]/g, ''));
    const hasDiscount = product.originalPrice && product.originalPrice !== product.price;
    
    if (hasDiscount) {
      const original = parseFloat(product.originalPrice.replace(/[^\d]/g, ''));
      const discount = Math.round(((original - price) / original) * 100);
      return {
        displayPrice: product.price,
        originalPrice: product.originalPrice,
        discountPercentage: discount
      };
    }
    
    return {
      displayPrice: product.price,
      originalPrice: null,
      discountPercentage: 0
    };
  }, [product.price, product.originalPrice]);

  // Mémorisation du statut de stock
  const stockStatus = useMemo(() => {
    if (product.stock === 0) return { text: 'Rupture de stock', className: 'bg-red-100 text-red-800' };
    if (product.stock <= 5) return { text: `Plus que ${product.stock}`, className: 'bg-[#eef6ea] text-[#1b5e20]' };
    return { text: 'En stock', className: 'bg-[#eef6ea] text-[#1b5e20]' };
  }, [product.stock]);

  return (
    <div 
      className="group relative bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden border border-gray-200 dark:border-gray-700"
      onClick={handleQuickView}
    >
      {/* Badge de réduction */}
      {discountPercentage > 0 && (
        <div className="absolute top-2 left-2 z-10">
          <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
            -{discountPercentage}%
          </span>
        </div>
      )}

      {/* Bouton favori */}
      <button
        onClick={handleToggleWishlist}
        className={`absolute top-2 right-2 z-10 p-2 rounded-full transition-all duration-200 ${
          isInWishlist 
            ? 'bg-red-100 text-red-600 hover:bg-red-200' 
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-red-500'
        }`}
        aria-label={isInWishlist ? 'Retirer des favoris' : 'Ajouter aux favoris'}
      >
        <svg className="w-4 h-4" fill={isInWishlist ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      </button>

      {/* Image du produit */}
      <div className="aspect-w-1 aspect-h-1 w-full h-48 bg-gradient-to-br from-[#eef6ea] to-[#eef6ea] dark:from-gray-700 dark:to-gray-600 overflow-hidden">
        <div className="w-full h-full flex items-center justify-center">
          <span className="text-5xl group-hover:scale-110 transition-transform duration-300">
            {product.icon}
          </span>
        </div>
      </div>

      {/* Informations du produit */}
      <div className="p-4">
        <div className="mb-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate group-hover:text-[#1b5e20] dark:group-hover:text-[#66bb6a] transition-colors">
            {product.name}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mt-1">
            {product.description}
          </p>
        </div>

        {/* Note et avis */}
        <div className="flex items-center mb-3">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <svg
                key={i}
                className={`w-4 h-4 ${
                  i < product.rating ? 'text-[#8f4b00]' : 'text-gray-300 dark:text-gray-600'
                }`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
            ({product.reviews})
          </span>
        </div>

        {/* Statut de stock */}
        <div className="mb-3">
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${stockStatus.className}`}>
            {stockStatus.text}
          </span>
        </div>

        {/* Prix et vendeur */}
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xl font-bold text-[#1b5e20] dark:text-[#66bb6a]">
                {displayPrice}
              </span>
              {originalPrice && (
                <span className="text-sm text-gray-500 dark:text-gray-400 line-through">
                  {originalPrice}
                </span>
              )}
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Vendeur: {product.vendor}
          </p>
        </div>

        {/* Actions */}
        <div className="flex space-x-2">
          <button
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all duration-200 ${
              product.stock === 0
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : isInCart
                ? 'bg-[#eef6ea] text-white hover:bg-[#eef6ea]'
                : 'bg-gradient-to-r from-[#1b5e20] to-[#1b5e20] text-white hover:from-[#16381a] hover:to-[#16381a]'
            }`}
          >
            {isInCart ? '✓ Ajouté' : 'Ajouter'}
          </button>
        </div>
      </div>
    </div>
  );
});

ProductCard.displayName = 'ProductCard';

export default ProductCard;