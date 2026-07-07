import { useState, useEffect } from 'react';
import { useTheme } from '../hooks/useTheme';
import { 
  Package, 
  Plus, 
  Minus, 
  Edit, 
  Trash2, 
  Search,
  Filter,
  AlertCircle,
  CheckCircle,
  TrendingDown,
  PlusCircle,
  Save,
  X
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  category: string;
  stock: number;
  minStock: number;
  price: number;
  status: 'in-stock' | 'low-stock' | 'out-of-stock';
  lastUpdated: string;
}

interface VendorStockManagerProps {
  vendorId: string;
}

export default function VendorStockManager({ vendorId }: VendorStockManagerProps) {
  const { isDark } = useTheme();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [editStock, setEditStock] = useState<number>(0);

  // Données de démonstration
  const generateDemoData = (): Product[] => [
    {
      id: '1',
      name: 'Cocomm DT740',
      category: 'Électronique',
      stock: 12,
      minStock: 5,
      price: 150000,
      status: 'low-stock',
      lastUpdated: '2024-01-15'
    },
    {
      id: '2',
      name: 'Pagne Traditionnel Wax',
      category: 'Mode',
      stock: 25,
      minStock: 10,
      price: 25000,
      status: 'in-stock',
      lastUpdated: '2024-01-14'
    },
    {
      id: '3',
      name: 'Mafé Maison Spécial',
      category: 'Alimentation',
      stock: 8,
      minStock: 15,
      price: 3500,
      status: 'low-stock',
      lastUpdated: '2024-01-13'
    },
    {
      id: '4',
      name: 'Bijou Artisanal Perles',
      category: 'Artisanat',
      stock: 15,
      minStock: 8,
      price: 15000,
      status: 'in-stock',
      lastUpdated: '2024-01-12'
    },
    {
      id: '5',
      name: 'Tissu Wax Premium',
      category: 'Mode',
      stock: 0,
      minStock: 5,
      price: 30000,
      status: 'out-of-stock',
      lastUpdated: '2024-01-11'
    },
    {
      id: '6',
      name: 'Smartphone Accessoires',
      category: 'Électronique',
      stock: 45,
      minStock: 20,
      price: 15000,
      status: 'in-stock',
      lastUpdated: '2024-01-10'
    }
  ];

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      const demoProducts = generateDemoData();
      setProducts(demoProducts);
      setFilteredProducts(demoProducts);
      setLoading(false);
    }, 1000);
  }, [vendorId]);

  useEffect(() => {
    let filtered = products;

    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(product => product.status === filterStatus);
    }

    setFilteredProducts(filtered);
  }, [products, searchTerm, filterStatus]);

  const updateStock = (productId: string, newStock: number) => {
    setProducts(prev => prev.map(product => {
      if (product.id === productId) {
        let status: 'in-stock' | 'low-stock' | 'out-of-stock' = 'in-stock';
        if (newStock === 0) {
          status = 'out-of-stock';
        } else if (newStock <= product.minStock) {
          status = 'low-stock';
        }
        return {
          ...product,
          stock: newStock,
          status,
          lastUpdated: new Date().toISOString().split('T')[0]
        };
      }
      return product;
    }));
    setEditingProduct(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in-stock':
        return 'text-[#1b5e20] bg-[#eef6ea] border-[#cfe0c8]';
      case 'low-stock':
        return 'text-[#1b5e20] bg-[#eef6ea] border-[#cfe0c8]';
      case 'out-of-stock':
        return 'text-red-600 bg-red-100 border-red-200';
      default:
        return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'in-stock':
        return <CheckCircle className="h-4 w-4" />;
      case 'low-stock':
        return <TrendingDown className="h-4 w-4" />;
      case 'out-of-stock':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className={`p-6 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded mb-4 w-1/3"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className={`h-16 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded`}></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const lowStockCount = products.filter(p => p.status === 'low-stock').length;
  const outOfStockCount = products.filter(p => p.status === 'out-of-stock').length;

  return (
    <div className={`space-y-6 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Gestion des Stocks
          </h2>
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
            Suivez et gérez vos niveaux de stock
          </p>
        </div>
        <div className="flex items-center space-x-4 text-sm">
          <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${isDark ? 'bg-[#17331c]/20 text-[#66bb6a]' : 'bg-[#eef6ea] text-[#1b5e20]'}`}>
            <AlertCircle className="h-4 w-4" />
            <span>{lowStockCount} Stock faible</span>
          </div>
          <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${isDark ? 'bg-red-900/20 text-red-400' : 'bg-red-100 text-red-800'}`}>
            <AlertCircle className="h-4 w-4" />
            <span>{outOfStockCount} Rupture</span>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
          <input
            type="text"
            placeholder="Rechercher un produit..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-10 pr-4 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'}`}
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className={`px-4 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
        >
          <option value="all">Tous les statuts</option>
          <option value="in-stock">En stock</option>
          <option value="low-stock">Stock faible</option>
          <option value="out-of-stock">Rupture</option>
        </select>
      </div>

      {/* Tableau des stocks */}
      <div className={`rounded-xl shadow-lg overflow-hidden ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <tr>
                <th className={`px-6 py-4 text-left text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                  Produit
                </th>
                <th className={`px-6 py-4 text-left text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                  Catégorie
                </th>
                <th className={`px-6 py-4 text-left text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                  Prix
                </th>
                <th className={`px-6 py-4 text-left text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                  Stock
                </th>
                <th className={`px-6 py-4 text-left text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                  Min
                </th>
                <th className={`px-6 py-4 text-left text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                  Statut
                </th>
                <th className={`px-6 py-4 text-left text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredProducts.map((product) => (
                <tr key={product.id} className={`${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center text-lg ${isDark ? 'bg-gray-600' : 'bg-gray-200'}`}>
                          📦
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {product.name}
                        </div>
                        <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          Mis à jour: {product.lastUpdated}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs rounded-full ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800'}`}>
                      {product.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {product.price.toLocaleString()} FCFA
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingProduct === product.id ? (
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          value={editStock}
                          onChange={(e) => setEditStock(Number(e.target.value))}
                          className={`w-16 px-2 py-1 text-sm rounded border ${isDark ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300'}`}
                        />
                        <button
                          onClick={() => updateStock(product.id, editStock)}
                          className="text-[#1b5e20] hover:text-[#1b5e20]"
                        >
                          <Save className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setEditingProduct(null)}
                          className="text-gray-600 hover:text-gray-800"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <span className={`text-sm font-medium ${
                        product.stock === 0 ? 'text-red-600' :
                        product.stock <= product.minStock ? 'text-[#1b5e20]' :
                        'text-[#1b5e20]'
                      }`}>
                        {product.stock}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {product.minStock}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(product.status)}`}>
                      {getStatusIcon(product.status)}
                      <span className="ml-1">
                        {product.status === 'in-stock' && 'En stock'}
                        {product.status === 'low-stock' && 'Stock faible'}
                        {product.status === 'out-of-stock' && 'Rupture'}
                      </span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setEditingProduct(product.id);
                          setEditStock(product.stock);
                        }}
                        className={`${isDark ? 'text-[#66bb6a] hover:text-[#66bb6a]' : 'text-[#1b5e20] hover:text-[#1b5e20]'}`}
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => updateStock(product.id, product.stock + 10)}
                        className={`${isDark ? 'text-[#66bb6a] hover:text-[#66bb6a]' : 'text-[#1b5e20] hover:text-[#1b5e20]'}`}
                      >
                        <PlusCircle className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredProducts.length === 0 && (
          <div className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Aucun produit trouvé</p>
          </div>
        )}
      </div>
    </div>
  );
}