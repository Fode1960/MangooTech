import { useState, useEffect } from 'react';
import { useTheme } from '../hooks/useTheme';
import { 
  Search, 
  Filter, 
  X, 
  ChevronDown,
  SortAsc,
  DollarSign,
  Star,
  SlidersHorizontal
} from 'lucide-react';

interface FilterOption {
  id: string;
  name: string;
  count?: number;
}

interface FiltersProps {
  categories: FilterOption[];
  priceRange: { min: number; max: number };
  selectedCategory: string;
  selectedPriceRange: { min: number; max: number };
  selectedRating: number;
  selectedSort: string;
  searchQuery: string;
  onCategoryChange: (category: string) => void;
  onPriceRangeChange: (range: { min: number; max: number }) => void;
  onRatingChange: (rating: number) => void;
  onSortChange: (sort: string) => void;
  onSearchChange: (query: string) => void;
  onClearFilters: () => void;
  activeFiltersCount: number;
}

export default function MarketplaceFilters({
  categories,
  priceRange,
  selectedCategory,
  selectedPriceRange,
  selectedRating,
  selectedSort,
  searchQuery,
  onCategoryChange,
  onPriceRangeChange,
  onRatingChange,
  onSortChange,
  onSearchChange,
  onClearFilters,
  activeFiltersCount
}: FiltersProps) {
  const { isDark } = useTheme();
  const [showFilters, setShowFilters] = useState(false);
  const [localPriceRange, setLocalPriceRange] = useState(selectedPriceRange);

  const sortOptions = [
    { id: 'relevance', name: 'Pertinence' },
    { id: 'price-low', name: 'Prix: Croissant' },
    { id: 'price-high', name: 'Prix: Décroissant' },
    { id: 'rating', name: 'Meilleures notes' },
    { id: 'newest', name: 'Plus récents' },
    { id: 'popular', name: 'Plus populaires' }
  ];

  const ratingOptions = [
    { id: '0', name: 'Toutes les notes' },
    { id: '4', name: '4★ et plus' },
    { id: '3', name: '3★ et plus' },
    { id: '2', name: '2★ et plus' },
    { id: '1', name: '1★ et plus' }
  ];

  useEffect(() => {
    setLocalPriceRange(selectedPriceRange);
  }, [selectedPriceRange]);

  const handlePriceRangeSubmit = () => {
    onPriceRangeChange(localPriceRange);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // La recherche est déjà gérée par onSearchChange
  };

  return (
    <div className="space-y-6">
      {/* Barre de recherche principale */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 relative">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Rechercher des produits, marques, catégories..."
              className={`w-full pl-12 pr-4 py-3 rounded-xl border focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors ${
                isDark
                  ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </form>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center space-x-2 px-4 py-3 rounded-xl border transition-colors ${
              isDark
                ? 'bg-gray-800 border-gray-600 text-white hover:bg-gray-700'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <SlidersHorizontal className="h-5 w-5" />
            <span>Filtres</span>
            {activeFiltersCount > 0 && (
              <span className="bg-orange-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </button>

          <select
            value={selectedSort}
            onChange={(e) => onSortChange(e.target.value)}
            className={`px-4 py-3 rounded-xl border focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors ${
              isDark
                ? 'bg-gray-800 border-gray-600 text-white'
                : 'bg-white border-gray-300 text-gray-900'
            }`}
          >
            {sortOptions.map(option => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Panneau de filtres */}
      {showFilters && (
        <div className={`rounded-2xl border p-6 space-y-6 ${
          isDark
            ? 'bg-gray-800 border-gray-700'
            : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center justify-between">
            <h3 className={`text-lg font-semibold ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              Filtres avancés
            </h3>
            <div className="flex items-center space-x-2">
              {activeFiltersCount > 0 && (
                <button
                  onClick={onClearFilters}
                  className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                >
                  Tout effacer
                </button>
              )}
              <button
                onClick={() => setShowFilters(false)}
                className={`p-1 rounded transition-colors ${
                  isDark
                    ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Catégories */}
            <div className="space-y-3">
              <label className={`text-sm font-medium ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Catégories
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {categories.map(category => (
                  <label key={category.id} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="category"
                      value={category.id}
                      checked={selectedCategory === category.id}
                      onChange={(e) => onCategoryChange(e.target.value)}
                      className="text-orange-600 focus:ring-orange-500"
                    />
                    <span className={`text-sm ${
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {category.name}
                      {category.count && (
                        <span className={`ml-1 text-xs ${
                          isDark ? 'text-gray-500' : 'text-gray-500'
                        }`}>
                          ({category.count})
                        </span>
                      )}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Prix */}
            <div className="space-y-3">
              <label className={`text-sm font-medium ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Prix (FCFA)
              </label>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    value={localPriceRange.min}
                    onChange={(e) => setLocalPriceRange(prev => ({
                      ...prev,
                      min: parseInt(e.target.value) || 0
                    }))}
                    placeholder="Min"
                    className={`w-full px-3 py-2 rounded-lg border text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                      isDark
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                  <span className={`text-sm ${
                    isDark ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    -
                  </span>
                  <input
                    type="number"
                    value={localPriceRange.max}
                    onChange={(e) => setLocalPriceRange(prev => ({
                      ...prev,
                      max: parseInt(e.target.value) || priceRange.max
                    }))}
                    placeholder="Max"
                    className={`w-full px-3 py-2 rounded-lg border text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                      isDark
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
                <button
                  onClick={handlePriceRangeSubmit}
                  className="w-full px-3 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors"
                >
                  Appliquer
                </button>
              </div>
            </div>

            {/* Note */}
            <div className="space-y-3">
              <label className={`text-sm font-medium ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Note minimale
              </label>
              <div className="space-y-2">
                {ratingOptions.map(option => (
                  <label key={option.id} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="rating"
                      value={option.id}
                      checked={selectedRating === parseInt(option.id)}
                      onChange={(e) => onRatingChange(parseInt(e.target.value))}
                      className="text-orange-600 focus:ring-orange-500"
                    />
                    <span className={`text-sm ${
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {option.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Disponibilité */}
            <div className="space-y-3">
              <label className={`text-sm font-medium ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Disponibilité
              </label>
              <div className="space-y-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="text-orange-600 focus:ring-orange-500"
                  />
                  <span className={`text-sm ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    En stock uniquement
                  </span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="text-orange-600 focus:ring-orange-500"
                  />
                  <span className={`text-sm ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Avec réduction
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Résumé des filtres actifs */}
      {activeFiltersCount > 0 && (
        <div className={`flex flex-wrap items-center gap-2 p-4 rounded-xl border ${
          isDark
            ? 'bg-gray-800 border-gray-700'
            : 'bg-orange-50 border-orange-200'
        }`}>
          <span className={`text-sm font-medium ${
            isDark ? 'text-gray-300' : 'text-gray-700'
          }`}>
            Filtres actifs:
          </span>
          {selectedCategory !== 'all' && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-orange-100 text-orange-800">
              {categories.find(c => c.id === selectedCategory)?.name}
              <button
                onClick={() => onCategoryChange('all')}
                className="ml-2 text-orange-600 hover:text-orange-800"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {(selectedPriceRange.min > priceRange.min || selectedPriceRange.max < priceRange.max) && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-orange-100 text-orange-800">
              {selectedPriceRange.min.toLocaleString()} - {selectedPriceRange.max.toLocaleString()} FCFA
              <button
                onClick={() => onPriceRangeChange(priceRange)}
                className="ml-2 text-orange-600 hover:text-orange-800"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {selectedRating > 0 && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-orange-100 text-orange-800">
              {selectedRating}★ et plus
              <button
                onClick={() => onRatingChange(0)}
                className="ml-2 text-orange-600 hover:text-orange-800"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}