import { useState, useEffect } from 'react';
import { useTheme } from '../hooks/useTheme';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingCart, 
  Package, 
  Users,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  Eye,
  Star,
  Clock,
  AlertCircle
} from 'lucide-react';

interface VendorStatsProps {
  vendorId: string;
}

interface SalesData {
  date: string;
  revenue: number;
  orders: number;
  products: number;
}

interface ProductPerformance {
  name: string;
  sales: number;
  revenue: number;
  stock: number;
}

interface CategoryDistribution {
  name: string;
  value: number;
  color: string;
}

export default function VendorStats({ vendorId }: VendorStatsProps) {
  const { isDark } = useTheme();
  const [timeRange, setTimeRange] = useState('7d');
  const [loading, setLoading] = useState(true);
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [topProducts, setTopProducts] = useState<ProductPerformance[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryDistribution[]>([]);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalProducts: 0,
    averageOrderValue: 0,
    growthRate: 0,
    activeCustomers: 0
  });

  // Données de démonstration
  const generateDemoData = () => {
    const demoSalesData: SalesData[] = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      demoSalesData.push({
        date: date.toLocaleDateString('fr-FR', { weekday: 'short' }),
        revenue: Math.floor(Math.random() * 50000) + 20000,
        orders: Math.floor(Math.random() * 15) + 5,
        products: Math.floor(Math.random() * 8) + 2
      });
    }

    const demoTopProducts: ProductPerformance[] = [
      { name: 'Cocomm DT740', sales: 45, revenue: 6750000, stock: 12 },
      { name: 'Pagne Traditionnel', sales: 38, revenue: 950000, stock: 25 },
      { name: 'Mafé Maison', sales: 32, revenue: 112000, stock: 8 },
      { name: 'Bijou Artisanal', sales: 28, revenue: 420000, stock: 15 },
      { name: 'Tissu Wax', sales: 22, revenue: 550000, stock: 30 }
    ];

    const demoCategoryData: CategoryDistribution[] = [
      { name: 'Électronique', value: 35, color: '#3B82F6' },
      { name: 'Mode', value: 25, color: '#EF4444' },
      { name: 'Alimentation', value: 20, color: '#F59E0B' },
      { name: 'Artisanat', value: 15, color: '#10B981' },
      { name: 'Autres', value: 5, color: '#6B7280' }
    ];

    setSalesData(demoSalesData);
    setTopProducts(demoTopProducts);
    setCategoryData(demoCategoryData);
    setStats({
      totalRevenue: 8500000,
      totalOrders: 156,
      totalProducts: 24,
      averageOrderValue: 54487,
      growthRate: 12.5,
      activeCustomers: 89
    });
  };

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      generateDemoData();
      setLoading(false);
    }, 1000);
  }, [timeRange, vendorId]);

  if (loading) {
    return (
      <div className={`p-6 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={`rounded-xl shadow-lg p-6 ${isDark ? 'bg-gray-800' : 'bg-white'} animate-pulse`}>
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
              <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
              <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header avec contrôles */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Statistiques de Vente
          </h2>
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
            Performance de votre boutique sur les 7 derniers jours
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <select 
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className={`px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
          >
            <option value="7d">7 jours</option>
            <option value="30d">30 jours</option>
            <option value="90d">90 jours</option>
          </select>
          <button className={`p-2 rounded-lg ${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-white text-gray-600 hover:bg-gray-50'} border`}>
            <RefreshCw className="h-4 w-4" />
          </button>
          <button className={`p-2 rounded-lg ${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-white text-gray-600 hover:bg-gray-50'} border`}>
            <Download className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Cards de statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className={`rounded-xl shadow-lg p-6 ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Revenus Totaux</p>
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {stats.totalRevenue.toLocaleString()} FCFA
              </p>
              <div className={`flex items-center mt-1 text-sm ${stats.growthRate > 0 ? 'text-[#1b5e20]' : 'text-red-600'}`}>
                {stats.growthRate > 0 ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
                {Math.abs(stats.growthRate)}%
              </div>
            </div>
            <div className="text-3xl">💰</div>
          </div>
        </div>

        <div className={`rounded-xl shadow-lg p-6 ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Commandes</p>
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {stats.totalOrders}
              </p>
              <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Moy: {stats.averageOrderValue.toLocaleString()} FCFA
              </p>
            </div>
            <div className="text-3xl">🛒</div>
          </div>
        </div>

        <div className={`rounded-xl shadow-lg p-6 ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Produits</p>
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {stats.totalProducts}
              </p>
              <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Actifs en vente
              </p>
            </div>
            <div className="text-3xl">📦</div>
          </div>
        </div>

        <div className={`rounded-xl shadow-lg p-6 ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Clients Actifs</p>
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {stats.activeCustomers}
              </p>
              <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Ce mois-ci
              </p>
            </div>
            <div className="text-3xl">👥</div>
          </div>
        </div>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenus par jour */}
        <div className={`rounded-xl shadow-lg p-6 ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
          <div className="flex justify-between items-center mb-4">
            <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Évolution des Revenus
            </h3>
            <Eye className={`h-5 w-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#E5E7EB'} />
                <XAxis dataKey="date" stroke={isDark ? '#9CA3AF' : '#6B7280'} />
                <YAxis stroke={isDark ? '#9CA3AF' : '#6B7280'} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
                    border: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`,
                    borderRadius: '8px'
                  }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#F59E0B" fill="#FEF3C7" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Commandes par jour */}
        <div className={`rounded-xl shadow-lg p-6 ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
          <div className="flex justify-between items-center mb-4">
            <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Commandes par Jour
            </h3>
            <ShoppingCart className={`h-5 w-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#E5E7EB'} />
                <XAxis dataKey="date" stroke={isDark ? '#9CA3AF' : '#6B7280'} />
                <YAxis stroke={isDark ? '#9CA3AF' : '#6B7280'} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
                    border: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`,
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="orders" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Performance des produits */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top produits */}
        <div className={`rounded-xl shadow-lg p-6 ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
          <div className="flex justify-between items-center mb-4">
            <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Top Produits
            </h3>
            <Star className={`h-5 w-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
          </div>
          <div className="space-y-4">
            {topProducts.slice(0, 3).map((product, index) => (
              <div key={product.name} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    index === 0 ? 'bg-[#fff4d6] text-[#8f4b00]' :
                    index === 1 ? 'bg-gray-100 text-gray-800' :
                    'bg-[#eef6ea] text-[#1b5e20]'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {product.name}
                    </p>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {product.sales} ventes
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {product.revenue.toLocaleString()}
                  </p>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>FCFA</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Répartition par catégorie */}
        <div className={`rounded-xl shadow-lg p-6 ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
          <div className="flex justify-between items-center mb-4">
            <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Ventes par Catégorie
            </h3>
            <Package className={`h-5 w-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            {categoryData.map((category) => (
              <div key={category.name} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }}></div>
                  <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {category.name}
                  </span>
                </div>
                <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  {category.value}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Alertes de stock */}
        <div className={`rounded-xl shadow-lg p-6 ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
          <div className="flex justify-between items-center mb-4">
            <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Alertes Stock
            </h3>
            <AlertCircle className="h-5 w-5 text-[#1b5e20]" />
          </div>
          <div className="space-y-3">
            {topProducts.filter(p => p.stock < 10).map((product) => (
              <div key={product.name} className={`p-3 rounded-lg ${isDark ? 'bg-[#17331c]/20 border border-[#2e5d34]' : 'bg-[#eef6ea] border border-[#cfe0c8]'}`}>
                <div className="flex justify-between items-center">
                  <div>
                    <p className={`font-medium ${isDark ? 'text-[#ecf7e7]' : 'text-[#1b5e20]'}`}>
                      {product.name}
                    </p>
                    <p className={`text-sm ${isDark ? 'text-[#66bb6a]' : 'text-[#1b5e20]'}`}>
                      Stock faible: {product.stock} restants
                    </p>
                  </div>
                  <button className={`px-3 py-1 text-xs rounded-lg ${isDark ? 'bg-[#16381a] text-[#ecf7e7]' : 'bg-[#cfe0c8] text-[#1b5e20]'}`}>
                    Réapprovisionner
                  </button>
                </div>
              </div>
            ))}
            {topProducts.filter(p => p.stock < 10).length === 0 && (
              <div className={`text-center py-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                <Package className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm">Aucune alerte de stock</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}