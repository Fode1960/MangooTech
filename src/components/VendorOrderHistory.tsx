import { useState, useEffect } from 'react';
import { useTheme } from '../hooks/useTheme';
import { 
  Package, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Truck,
  DollarSign,
  User,
  Calendar,
  Filter,
  Search,
  Eye,
  Download,
  RefreshCw,
  Star,
  MessageCircle,
  MapPin
} from 'lucide-react';
import VendorClientInvoiceModal, { type VendorOrder } from './invoice/VendorClientInvoiceModal';

interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  items: {
    name: string;
    quantity: number;
    price: number;
    total: number;
  }[];
  totalAmount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  orderDate: string;
  estimatedDelivery: string;
  paymentMethod: string;
  notes?: string;
  rating?: number;
}

interface VendorOrderHistoryProps {
  vendorId: string;
}

export default function VendorOrderHistory({ vendorId }: VendorOrderHistoryProps) {
  const { isDark } = useTheme();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [invoiceOrder, setInvoiceOrder] = useState<VendorOrder | null>(null);

  // Données de démonstration
  const generateDemoOrders = (): Order[] => [
    {
      id: 'ORD-001',
      customerName: 'Marie Konaté',
      customerPhone: '+225 07 07 07 07',
      customerAddress: 'Cocody, Rue 12, Abidjan',
      items: [
        { name: 'Cocomm DT740', quantity: 1, price: 150000, total: 150000 },
        { name: 'Coque de protection', quantity: 1, price: 5000, total: 5000 }
      ],
      totalAmount: 155000,
      status: 'delivered',
      orderDate: '2024-01-15',
      estimatedDelivery: '2024-01-17',
      paymentMethod: 'MTN Money',
      notes: 'Client demande livraison rapide',
      rating: 5
    },
    {
      id: 'ORD-002',
      customerName: 'Jean Yao',
      customerPhone: '+225 05 05 05 05',
      customerAddress: 'Yopougon, Marché principal, Abidjan',
      items: [
        { name: 'Pagne Traditionnel Wax', quantity: 2, price: 25000, total: 50000 }
      ],
      totalAmount: 50000,
      status: 'processing',
      orderDate: '2024-01-16',
      estimatedDelivery: '2024-01-18',
      paymentMethod: 'Orange Money',
      notes: 'Cadeau pour mariage'
    },
    {
      id: 'ORD-003',
      customerName: 'Aminata Diallo',
      customerPhone: '+225 01 01 01 01',
      customerAddress: 'Marcory, Boulevard Valéry Giscard d\'Estaing, Abidjan',
      items: [
        { name: 'Mafé Maison Spécial', quantity: 3, price: 3500, total: 10500 },
        { name: 'Attiéké Premium', quantity: 2, price: 2000, total: 4000 }
      ],
      totalAmount: 14500,
      status: 'shipped',
      orderDate: '2024-01-16',
      estimatedDelivery: '2024-01-17',
      paymentMethod: 'Espèces'
    },
    {
      id: 'ORD-004',
      customerName: 'Kouassi Kouamé',
      customerPhone: '+225 07 07 08 08',
      customerAddress: 'Treichville, Avenue 13, Abidjan',
      items: [
        { name: 'Bijou Artisanal Perles', quantity: 1, price: 15000, total: 15000 }
      ],
      totalAmount: 15000,
      status: 'pending',
      orderDate: '2024-01-17',
      estimatedDelivery: '2024-01-19',
      paymentMethod: 'Carte Bancaire'
    },
    {
      id: 'ORD-005',
      customerName: 'Fatou Camara',
      customerPhone: '+225 05 06 07 08',
      customerAddress: 'Adjamé, Marché, Abidjan',
      items: [
        { name: 'Tissu Wax Premium', quantity: 5, price: 30000, total: 150000 }
      ],
      totalAmount: 150000,
      status: 'cancelled',
      orderDate: '2024-01-14',
      estimatedDelivery: '2024-01-16',
      paymentMethod: 'Moov Money',
      notes: 'Annulation client - changement d\'avis'
    }
  ];

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      const demoOrders = generateDemoOrders();
      setOrders(demoOrders);
      setFilteredOrders(demoOrders);
      setLoading(false);
    }, 1000);
  }, [vendorId]);

  useEffect(() => {
    let filtered = orders;

    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.items.some(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    if (dateFilter !== 'all') {
      const today = new Date();
      const filterDate = new Date();
      
      switch (dateFilter) {
        case 'today':
          filtered = filtered.filter(order => order.orderDate === today.toISOString().split('T')[0]);
          break;
        case 'week':
          filterDate.setDate(today.getDate() - 7);
          filtered = filtered.filter(order => new Date(order.orderDate) >= filterDate);
          break;
        case 'month':
          filterDate.setMonth(today.getMonth() - 1);
          filtered = filtered.filter(order => new Date(order.orderDate) >= filterDate);
          break;
      }
    }

    setFilteredOrders(filtered);
  }, [orders, searchTerm, statusFilter, dateFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'processing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'shipped':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'processing':
        return <Package className="h-4 w-4" />;
      case 'shipped':
        return <Truck className="h-4 w-4" />;
      case 'delivered':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const updateOrderStatus = (orderId: string, newStatus: Order['status']) => {
    setOrders(prev => prev.map(order => 
      order.id === orderId ? { ...order, status: newStatus } : order
    ));
  };

  if (loading) {
    return (
      <div className={`p-6 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded mb-4 w-1/3"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className={`h-20 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded`}></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const totalRevenue = orders
    .filter(order => order.status === 'delivered')
    .reduce((sum, order) => sum + order.totalAmount, 0);

  const pendingOrders = orders.filter(order => order.status === 'pending').length;

  return (
    <div className={`space-y-6 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header avec statistiques */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Historique des Commandes
          </h2>
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
            {filteredOrders.length} commandes • {totalRevenue.toLocaleString()} FCFA de revenus
          </p>
        </div>
        <div className="flex items-center space-x-2 text-sm">
          <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${isDark ? 'bg-yellow-900/20 text-yellow-400' : 'bg-yellow-100 text-yellow-800'}`}>
            <Clock className="h-4 w-4" />
            <span>{pendingOrders} En attente</span>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
          <input
            type="text"
            placeholder="Rechercher une commande..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-10 pr-4 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'}`}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={`px-4 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
        >
          <option value="all">Tous les statuts</option>
          <option value="pending">En attente</option>
          <option value="processing">En traitement</option>
          <option value="shipped">Expédié</option>
          <option value="delivered">Livré</option>
          <option value="cancelled">Annulé</option>
        </select>
        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className={`px-4 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
        >
          <option value="all">Toutes les dates</option>
          <option value="today">Aujourd'hui</option>
          <option value="week">Cette semaine</option>
          <option value="month">Ce mois</option>
        </select>
      </div>

      {/* Liste des commandes */}
      <div className="space-y-4">
        {filteredOrders.map((order) => (
          <div key={order.id} className={`rounded-xl shadow-lg p-6 ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {order.id}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                      {getStatusIcon(order.status)}
                      <span className="ml-1 capitalize">{order.status.replace('_', ' ')}</span>
                    </span>
                    {order.rating && (
                      <div className="flex items-center space-x-1">
                        {[...Array(order.rating)].map((_, i) => (
                          <Star key={i} className="h-3 w-3 text-yellow-400 fill-current" />
                        ))}
                      </div>
                    )}
                  </div>
                  <span className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {order.totalAmount.toLocaleString()} FCFA
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <User className={`h-4 w-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                      <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        {order.customerName}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 mb-1">
                      <MapPin className={`h-4 w-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                      <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        {order.customerAddress}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <DollarSign className={`h-4 w-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                      <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        {order.paymentMethod}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <Calendar className={`h-4 w-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                      <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        Commandé: {new Date(order.orderDate).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Truck className={`h-4 w-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                      <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        Livraison: {new Date(order.estimatedDelivery).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mb-3">
                  <p className={`text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Articles:
                  </p>
                  <div className="space-y-1">
                    {order.items.map((item, index) => (
                      <div key={index} className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {item.quantity}x {item.name} - {item.price.toLocaleString()} FCFA
                      </div>
                    ))}
                  </div>
                </div>

                {order.notes && (
                  <div className={`p-2 rounded text-sm ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                    <strong>Notes:</strong> {order.notes}
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-end space-y-2 sm:space-y-0 sm:space-x-2">
                <button
                  onClick={() => setSelectedOrder(order)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm ${isDark ? 'bg-blue-900/20 text-blue-400 hover:bg-blue-900/30' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}
                >
                  <Eye className="h-4 w-4" />
                  <span>Détails</span>
                </button>
                
                {order.status === 'pending' && (
                  <button
                    onClick={() => updateOrderStatus(order.id, 'processing')}
                    className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm bg-orange-500 text-white hover:bg-orange-600"
                  >
                    <Package className="h-4 w-4" />
                    <span>Traiter</span>
                  </button>
                )}
                
                {order.status === 'processing' && (
                  <button
                    onClick={() => updateOrderStatus(order.id, 'shipped')}
                    className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm bg-blue-500 text-white hover:bg-blue-600"
                  >
                    <Truck className="h-4 w-4" />
                    <span>Expédier</span>
                  </button>
                )}
                
                {order.status === 'shipped' && (
                  <button
                    onClick={() => updateOrderStatus(order.id, 'delivered')}
                    className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm bg-green-500 text-white hover:bg-green-600"
                  >
                    <CheckCircle className="h-4 w-4" />
                    <span>Livrer</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {filteredOrders.length === 0 && (
          <div className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Aucune commande trouvée</p>
          </div>
        )}
      </div>

      {/* Modal de détails */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Détails de la commande {selectedOrder.id}
                </h3>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className={`text-2xl ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-800'}`}
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <h4 className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Informations client</h4>
                  <p className={isDark ? 'text-gray-300' : 'text-gray-700'}><strong>Nom:</strong> {selectedOrder.customerName}</p>
                  <p className={isDark ? 'text-gray-300' : 'text-gray-700'}><strong>Téléphone:</strong> {selectedOrder.customerPhone}</p>
                  <p className={isDark ? 'text-gray-300' : 'text-gray-700'}><strong>Adresse:</strong> {selectedOrder.customerAddress}</p>
                </div>
                
                <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <h4 className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Détails de la commande</h4>
                  <p className={isDark ? 'text-gray-300' : 'text-gray-700'}><strong>Date:</strong> {new Date(selectedOrder.orderDate).toLocaleDateString('fr-FR')}</p>
                  <p className={isDark ? 'text-gray-300' : 'text-gray-700'}><strong>Statut:</strong> {selectedOrder.status}</p>
                  <p className={isDark ? 'text-gray-300' : 'text-gray-700'}><strong>Paiement:</strong> {selectedOrder.paymentMethod}</p>
                  <p className={isDark ? 'text-gray-300' : 'text-gray-700'}><strong>Total:</strong> {selectedOrder.totalAmount.toLocaleString()} FCFA</p>
                </div>
                
                <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <h4 className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Articles</h4>
                  {selectedOrder.items.map((item, index) => (
                    <div key={index} className={`flex justify-between items-center py-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      <span>{item.quantity}x {item.name}</span>
                      <span>{item.total.toLocaleString()} FCFA</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => {
                    const o = selectedOrder;
                    setInvoiceOrder({
                      id: o.id,
                      customerName: o.customerName,
                      customerPhone: o.customerPhone,
                      customerAddress: o.customerAddress,
                      items: o.items,
                      totalAmount: o.totalAmount,
                      status: o.status,
                      orderDate: o.orderDate,
                      paymentMethod: o.paymentMethod,
                      notes: o.notes
                    });
                  }}
                  className={`mr-2 px-4 py-2 rounded-lg font-semibold ${isDark ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}
                >
                  🧾 Émettre facture
                </button>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className={`px-4 py-2 rounded-lg ${isDark ? 'bg-gray-600 text-white hover:bg-gray-500' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <VendorClientInvoiceModal
        open={Boolean(invoiceOrder)}
        onClose={() => setInvoiceOrder(null)}
        isDark={isDark}
        vendorLabel={String(vendorId || 'Vendeur')}
        order={invoiceOrder}
      />
    </div>
  );
}
