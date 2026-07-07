import React from 'react';
import { Package, Plus, Edit, Trash2, Eye } from 'lucide-react';

const ProductManagement: React.FC = () => {
  const products = [
    {
      id: 1,
      name: 'Robe Wax Ankara Premium',
      price: 45000,
      stock: 15,
      category: 'Mode Femme',
      status: 'active',
      image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Beautiful%20African%20Ankara%20wax%20print%20dress%20with%20vibrant%20mango%20orange%2C%20gold%2C%20and%20terracotta%20colors%2C%20elegant%20traditional%20pattern%2C%20luxurious%20fabric%2C%20professional%20product%20photography%2C%20studio%20lighting%2C%20isolated%20on%20white%20background&image_size=square_hd'
    },
    {
      id: 2,
      name: 'Collier Perles Traditionnelles',
      price: 25000,
      stock: 8,
      category: 'Bijoux',
      status: 'active',
      image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Traditional%20African%20beaded%20necklace%20with%20mango%20orange%2C%20gold%2C%20and%20earth%20tone%20beads%2C%20handcrafted%20jewelry%2C%20cultural%20heritage%20design%2C%20professional%20product%20photography%2C%20elegant%20styling%2C%20isolated%20on%20white%20background&image_size=square_hd'
    },
    {
      id: 3,
      name: 'Tissu Wax Mangoo Collection',
      price: 18000,
      stock: 25,
      category: 'Tissus',
      status: 'active',
      image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=African%20wax%20print%20fabric%20with%20mango%20inspired%20patterns%2C%20vibrant%20orange%2C%20gold%2C%20and%20terracotta%20colors%2C%20traditional%20geometric%20motifs%2C%20high-quality%20cotton%20fabric%2C%20textured%20surface%2C%20professional%20product%20photography%2C%20folded%20elegantly&image_size=square_hd'
    }
  ];

  return (
    <div className="min-h-screen bg-[#f6faf3]">
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-[#c8e6c9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Package className="w-8 h-8 text-[#1b5e20] mr-3" />
                Gestion des Produits
              </h1>
              <p className="text-gray-600 mt-2">Gérez votre catalogue de produits</p>
            </div>
            <button className="bg-[#1b5e20] text-white px-6 py-3 rounded-xl hover:bg-[#16381a] transition-colors flex items-center space-x-2">
              <Plus className="w-5 h-5" />
              <span>Nouveau Produit</span>
            </button>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product) => (
            <div key={product.id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
              <div className="aspect-square bg-[#f6faf3] flex items-center justify-center">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRkY4QzQyIi8+CjxwYXRoIGQ9Ik0xMDAgNTBMMTUwIDEwMEgxMDBWMTUwSDUwVjEwMEgxMDBWNTBaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K';
                  }}
                />
              </div>
              
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{product.name}</h3>
                    <p className="text-sm text-gray-600 mb-2">{product.category}</p>
                    <div className="flex items-center space-x-4">
                      <span className="text-2xl font-bold text-[#1b5e20]">{product.price.toLocaleString()} FCFA</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        product.status === 'active' ? 'bg-[#e8f5e9] text-[#16381a]' : 'bg-red-100 text-red-800'
                      }`}>
                        {product.status === 'active' ? 'Actif' : 'Inactif'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-gray-600">Stock: {product.stock} unités</span>
                </div>
                
                <div className="flex space-x-2">
                  <button className="flex-1 bg-[#1b5e20] hover:bg-[#16381a] text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2">
                    <Eye className="w-4 h-4" />
                    <span>Voir</span>
                  </button>
                  <button className="flex-1 bg-[#1b5e20] hover:bg-[#16381a] text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2">
                    <Edit className="w-4 h-4" />
                    <span>Modifier</span>
                  </button>
                  <button className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductManagement;