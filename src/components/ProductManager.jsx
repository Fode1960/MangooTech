import React, { useState, useCallback } from 'react';
import { Plus, Edit, Trash2, Package, DollarSign, Star, Upload } from 'lucide-react';
import ImageUpload from './ImageUpload';

const PRODUCT_CATEGORIES = [
  { id: 'electronics', name: 'Ã‰lectronique', icon: 'ðŸ“±' },
  { id: 'fashion', name: 'Mode', icon: 'ðŸ‘•' },
  { id: 'food', name: 'Alimentation', icon: 'ðŸ²' },
  { id: 'handicraft', name: 'Artisanat', icon: 'ðŸŽ¨' },
  { id: 'beauty', name: 'BeautÃ©', icon: 'ðŸ’„' },
  { id: 'home', name: 'Maison', icon: 'ðŸ ' }
];

const ProductManager = ({ vendorId }) => {
  const [products, setProducts] = useState([
    {
      id: 1,
      name: 'iPhone 13 Pro',
      description: 'Smartphone haut de gamme avec appareil photo professionnel',
      price: '150.000 FCFA',
      originalPrice: '180.000 FCFA',
      category: 'electronics',
      stock: 15,
      rating: 5,
      reviews: 128,
      images: [
        { id: 1, preview: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE0IiBmaWxsPSIjOWNhM2FmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+8J+TpDwvdGV4dD48L3N2Zz4=' }
      ],
      icon: '📱'
    }
  ]);

  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    originalPrice: '',
    category: 'electronics',
    stock: 0,
    images: []
  });

  const handleImagesChange = useCallback((newImages) => {
    setFormData(prev => ({ ...prev, images: newImages }));
  }, []);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    
    const productData = {
      ...formData,
      id: editingProduct ? editingProduct.id : Date.now(),
      rating: editingProduct ? editingProduct.rating : Math.floor(Math.random() * 5) + 1,
      reviews: editingProduct ? editingProduct.reviews : Math.floor(Math.random() * 50) + 10,
      icon: PRODUCT_CATEGORIES.find(cat => cat.id === formData.category)?.icon || '📦'
    };

    if (editingProduct) {
      setProducts(prev => prev.map(p => p.id === editingProduct.id ? productData : p));
    } else {
      setProducts(prev => [...prev, productData]);
    }

    setFormData({
      name: '',
      description: '',
      price: '',
      originalPrice: '',
      category: 'electronics',
      stock: 0,
      images: []
    });
    setShowForm(false);
    setEditingProduct(null);
  }, [formData, editingProduct]);

  const handleEdit = useCallback((product) => {
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price,
      originalPrice: product.originalPrice,
      category: product.category,
      stock: product.stock,
      images: product.images || []
    });
    setEditingProduct(product);
    setShowForm(true);
  }, []);

  const handleDelete = useCallback((productId) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
      setProducts(prev => prev.filter(p => p.id !== productId));
    }
  }, []);

  const getDiscountPercentage = (price, originalPrice) => {
    if (!originalPrice) return 0;
    const currentPrice = parseFloat(price.replace(/[^\d]/g, ''));
    const original = parseFloat(originalPrice.replace(/[^\d]/g, ''));
    return original > currentPrice ? Math.round(((original - currentPrice) / original) * 100) : 0;
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Gestion des Produits
        </h2>
        <button
          onClick={() => setShowForm(true)}
          className="bg-gradient-to-r from-orange-500 to-green-600 text-white px-4 py-2 rounded-lg font-medium hover:from-orange-600 hover:to-green-700 transition-all flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Ajouter un produit</span>
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {editingProduct ? 'Modifier le produit' : 'Ajouter un produit'}
                </h3>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingProduct(null);
                  }}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Nom du produit *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Description *
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-white"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Prix *
                      </label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          value={formData.price}
                          onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                          placeholder="150.000 FCFA"
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-white"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Prix original
                      </label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          value={formData.originalPrice}
                          onChange={(e) => setFormData(prev => ({ ...prev, originalPrice: e.target.value }))}
                          placeholder="180.000 FCFA"
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Catégorie *
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-white"
                        required
                      >
                        {PRODUCT_CATEGORIES.map(cat => (
                          <option key={cat.id} value={cat.id}>
                            {cat.icon} {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Stock *
                      </label>
                      <div className="relative">
                        <Package className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                        <input
                          type="number"
                          value={formData.stock}
                          onChange={(e) => setFormData(prev => ({ ...prev, stock: parseInt(e.target.value) || 0 }))}
                          min="0"
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-white"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Photos du produit
                    </label>
                    <ImageUpload
                      onImagesChange={handleImagesChange}
                      existingImages={formData.images}
                      maxImages={5}
                    />
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Aperçu du produit
                    </h4>
                    <div className="flex items-center space-x-4">
                      {formData.images.length > 0 ? (
                        <img
                          src={formData.images[0].preview}
                          alt="Aperçu"
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center">
                          <Package className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white truncate">
                          {formData.name || 'Nom du produit'}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {formData.price || 'Prix'}
                        </p>
                        {formData.originalPrice && formData.price && (
                          <p className="text-xs text-green-600 dark:text-green-400">
                            -{getDiscountPercentage(formData.price, formData.originalPrice)}% de réduction
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </form>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingProduct(null);
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  onClick={handleSubmit}
                  className="bg-gradient-to-r from-orange-500 to-green-600 text-white px-6 py-2 rounded-lg font-medium hover:from-orange-600 hover:to-green-700 transition-all flex items-center space-x-2"
                >
                  <span>{editingProduct ? 'Modifier' : 'Ajouter'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <div key={product.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-700">
            <div className="relative h-48 bg-gray-100 dark:bg-gray-700 rounded-t-xl overflow-hidden">
              {product.images && product.images.length > 0 ? (
                <img
                  src={product.images[0].preview}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-4xl">{product.icon}</span>
                </div>
              )}
              
              {product.originalPrice && getDiscountPercentage(product.price, product.originalPrice) > 0 && (
                <div className="absolute top-2 left-2">
                  <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    -{getDiscountPercentage(product.price, product.originalPrice)}%
                  </span>
                </div>
              )}

              <div className="absolute top-2 right-2 space-y-1">
                <button
                  onClick={() => handleEdit(product)}
                  className="bg-blue-500 text-white p-1 rounded-full hover:bg-blue-600 transition-colors"
                  title="Modifier"
                >
                  <Edit className="w-3 h-3" />
                </button>
                <button
                  onClick={() => handleDelete(product.id)}
                  className="bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                  title="Supprimer"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>

            <div className="p-4">
              <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">
                {product.name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                {product.description}
              </p>

              <div className="flex items-center space-x-2 mb-3">
                <span className="text-xl font-bold text-orange-600">
                  {product.price}
                </span>
                {product.originalPrice && (
                  <span className="text-sm text-gray-500 line-through">
                    {product.originalPrice}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-1">
                  <div className="flex text-yellow-400">
                    {'★'.repeat(product.rating)}
                  </div>
                  <span className="text-gray-500">({product.reviews})</span>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs ${
                  product.stock === 0 
                    ? 'bg-red-100 text-red-800' 
                    : product.stock <= 5 
                    ? 'bg-orange-100 text-orange-800'
                    : 'bg-green-100 text-green-800'
                }`}>
                  {product.stock === 0 ? 'Rupture' : `${product.stock} en stock`}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {products.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📦</div>
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Aucun produit trouvé
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Commencez par ajouter votre premier produit
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="bg-gradient-to-r from-orange-500 to-green-600 text-white px-4 py-2 rounded-lg font-medium hover:from-orange-600 hover:to-green-700 transition-all"
          >
            Ajouter un produit
          </button>
        </div>
      )}
    </div>
  );
};

export default ProductManager;
