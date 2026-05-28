import React, { useState } from 'react';
import { Plus, Edit, Trash2, Package } from 'lucide-react';

const ProductManagerSimple = ({ vendorId }) => {
  const [products, setProducts] = useState([
    {
      id: 1,
      name: 'iPhone 14 Pro Max',
      description: 'Smartphone haut de gamme avec écran 6.7 pouces',
      price: '899.000 FCFA',
      stock: 15,
      category: 'Électronique',
      icon: '📱'
    },
    {
      id: 2,
      name: 'Robe Wax Africain',
      description: 'Magnifique robe traditionnelle en wax',
      price: '45.000 FCFA',
      stock: 8,
      category: 'Mode',
      icon: '👗'
    }
  ]);

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    category: 'Électronique'
  });

  const categories = [
    { id: 'electronics', name: 'Électronique', icon: '📱' },
    { id: 'fashion', name: 'Mode', icon: '👕' },
    { id: 'food', name: 'Alimentation', icon: '🍲' },
    { id: 'handicraft', name: 'Artisanat', icon: '🎨' }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    const newProduct = {
      id: Date.now(),
      ...formData,
      price: formData.price + ' FCFA'
    };
    setProducts([...products, newProduct]);
    setFormData({ name: '', description: '', price: '', stock: '', category: 'Électronique' });
    setShowForm(false);
  };

  const deleteProduct = (id) => {
    setProducts(products.filter(p => p.id !== id));
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
          <Plus className="w-4 h-4" />
          <span>Ajouter un produit</span>
        </button>
      </div>

      {/* Formulaire d'ajout */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Ajouter un produit
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Prix (FCFA) *
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Stock *
                  </label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData(prev => ({ ...prev, stock: e.target.value }))}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>
              </div>

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
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.name}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="bg-gradient-to-r from-orange-500 to-green-600 text-white px-6 py-2 rounded-lg font-medium hover:from-orange-600 hover:to-green-700 transition-all"
                >
                  Ajouter le produit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Liste des produits */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <div key={product.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-700">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="text-3xl">{product.icon}</div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowForm(true)}
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteProduct(product.id)}
                    className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {product.name}
              </h3>
              
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                {product.description}
              </p>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-orange-600">
                    {product.price}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {product.category}
                  </p>
                </div>
                <div className="flex items-center space-x-1">
                  <Package className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {product.stock} en stock
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {products.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📦</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Aucun produit
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
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

export default ProductManagerSimple;