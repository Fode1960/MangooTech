import { useState, useEffect } from 'react';
import { useTheme } from '../hooks/useTheme';
import { 
  Search, 
  Filter, 
  Star, 
  ShoppingCart, 
  Heart, 
  Eye,
  SortAsc,
  Grid,
  List,
  ChevronLeft,
  ChevronRight,
  MessageCircle
} from 'lucide-react';

interface Product {
  id: number;
  name: string;
  description: string;
  price: string;
  category: string;
  rating: number;
  reviews: number;
  icon: string;
  vendor: string;
  image?: string;
  inStock: boolean;
  discount?: number;
}

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onQuickView: (product: Product) => void;
  onToggleWishlist: (productId: number) => void;
  onChat?: (product: Product) => void;
  isInWishlist: boolean;
  isInCart: boolean;
}

export default function ProductCard({ 
  product, 
  onAddToCart, 
  onQuickView, 
  onToggleWishlist, 
  onChat,
  isInWishlist,
  isInCart 
}: ProductCardProps) {
  const { isDark } = useTheme();
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart(product);
  };

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleWishlist(product.id);
  };

  const handleQuickView = (e: React.MouseEvent) => {
    e.stopPropagation();
    onQuickView(product);
  };

  const handleChat = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChat?.(product);
  };

  const formatPrice = (price: string) => {
    const numericPrice = parseFloat(price.replace(/[^\d]/g, ''));
    return numericPrice.toLocaleString();
  };

  const getDiscountedPrice = () => {
    if (!product.discount) return product.price;
    const numericPrice = parseFloat(product.price.replace(/[^\d]/g, ''));
    const discountedPrice = numericPrice * (1 - product.discount / 100);
    return `${Math.round(discountedPrice).toLocaleString()} FCFA`;
  };

  return (
    <div 
      className={`group relative rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer overflow-hidden ${
        isDark 
          ? 'bg-gray-800 border border-gray-700 hover:border-[#1b5e20]/50' 
          : 'bg-white border border-gray-200 hover:border-[#1b5e20]/50'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Badge réduction */}
      {product.discount && (
        <div className="absolute top-3 left-3 z-10">
          <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
            -{product.discount}%
          </span>
        </div>
      )}

      {/* Badge stock */}
      {!product.inStock && (
        <div className="absolute top-3 right-3 z-10">
          <span className="bg-gray-500 text-white text-xs font-bold px-2 py-1 rounded-full">
            Rupture
          </span>
        </div>
      )}

      {/* Actions rapides */}
      <div className={`absolute top-3 right-3 z-10 flex flex-col space-y-2 transition-all duration-300 ${
        isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'
      }`}>
        <button
          onClick={handleWishlistClick}
          className={`p-2 rounded-full shadow-lg transition-colors ${
            isInWishlist
              ? 'bg-red-500 text-white'
              : isDark
              ? 'bg-gray-700 text-gray-300 hover:bg-red-500 hover:text-white'
              : 'bg-white text-gray-600 hover:bg-red-500 hover:text-white'
          }`}
        >
          <Heart className={`h-4 w-4 ${isInWishlist ? 'fill-current' : ''}`} />
        </button>
        
        <button
          onClick={handleChat}
          className={`p-2 rounded-full shadow-lg transition-colors ${
            isDark
              ? 'bg-gray-700 text-gray-300 hover:bg-[#1b5e20] hover:text-white'
              : 'bg-white text-gray-600 hover:bg-[#1b5e20] hover:text-white'
          }`}
        >
          <MessageCircle className="h-4 w-4" />
        </button>
        
        <button
          onClick={handleQuickView}
          className={`p-2 rounded-full shadow-lg transition-colors ${
            isDark
              ? 'bg-gray-700 text-gray-300 hover:bg-[#1b5e20] hover:text-white'
              : 'bg-white text-gray-600 hover:bg-[#1b5e20] hover:text-white'
          }`}
        >
          <Eye className="h-4 w-4" />
        </button>
      </div>

      {/* Image du produit */}
      <div className="relative h-56 overflow-hidden bg-[#f6faf3] dark:from-gray-700 dark:to-gray-600">
        {product.image && !imageError ? (
          <img 
            src={product.image} 
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-6xl group-hover:scale-110 transition-transform duration-300">
              {product.icon}
            </span>
          </div>
        )}
        
        {/* Overlay au survol */}
        <div className={`absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center transition-opacity duration-300 ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`}>
          <div className="flex flex-col space-y-3">
            <button
              onClick={handleAddToCart}
              disabled={!product.inStock}
              className={`px-6 py-3 rounded-full font-semibold transition-all duration-300 transform hover:scale-105 ${
                product.inStock
                  ? 'bg-[#1b5e20] text-white hover:bg-[#16381a]'
                  : 'bg-gray-500 text-gray-300 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center space-x-2">
                <ShoppingCart className="h-5 w-5" />
                <span>{isInCart ? 'Déjà au panier' : 'Ajouter'}</span>
              </div>
            </button>
            
            {onChat && (
              <button
                onClick={handleChat}
                className="px-6 py-3 rounded-full font-semibold bg-[#1b5e20] text-white hover:bg-[#16381a] transition-all duration-300 transform hover:scale-105"
              >
                <div className="flex items-center space-x-2">
                  <MessageCircle className="h-5 w-5" />
                  <span>Discuter</span>
                </div>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Informations du produit */}
      <div className="p-5">
        {/* Vendeur */}
        <div className="flex items-center space-x-2 mb-2">
          <div className="w-6 h-6 bg-[#1b5e20] rounded-full flex items-center justify-center">
            <span className="text-xs">👤</span>
          </div>
          <span className={`text-xs font-medium ${
            isDark ? 'text-gray-400' : 'text-gray-600'
          }`}>
            {product.vendor}
          </span>
        </div>

        {/* Nom et description */}
        <h3 className={`font-bold text-lg mb-2 line-clamp-2 ${
          isDark ? 'text-white' : 'text-gray-900'
        }`}>
          {product.name}
        </h3>
        
        <p className={`text-sm mb-3 line-clamp-2 ${
          isDark ? 'text-gray-400' : 'text-gray-600'
        }`}>
          {product.description}
        </p>

        {/* Notation */}
        <div className="flex items-center space-x-2 mb-3">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`h-4 w-4 ${
                  i < product.rating
                    ? 'text-yellow-400 fill-current'
                    : isDark
                    ? 'text-gray-600'
                    : 'text-gray-300'
                }`}
              />
            ))}
          </div>
          <span className={`text-sm ${
            isDark ? 'text-gray-500' : 'text-gray-500'
          }`}>
            ({product.reviews})
          </span>
        </div>

        {/* Prix */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {product.discount ? (
              <>
                <span className="text-xl font-bold text-[#1b5e20]">
                  {getDiscountedPrice()}
                </span>
                <span className={`text-sm line-through ${
                  isDark ? 'text-gray-500' : 'text-gray-400'
                }`}>
                  {product.price}
                </span>
              </>
            ) : (
              <span className="text-xl font-bold text-[#1b5e20]">
                {product.price}
              </span>
            )}
          </div>
          
          <span className={`text-xs px-2 py-1 rounded-full ${
            product.inStock
              ? 'bg-[#e8f5e9] text-[#16381a] dark:bg-[#0d3310] dark:text-[#c8e6c9]'
              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
          }`}>
            {product.inStock ? 'En stock' : 'Rupture'}
          </span>
        </div>
      </div>
    </div>
  );
}