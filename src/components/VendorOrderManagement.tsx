import React, { useState, useEffect } from 'react';
import { Package, Clock, CheckCircle, XCircle, Truck, DollarSign, Eye, Filter, Search, Calendar, User, Phone, MapPin, BarChart3 } from 'lucide-react';
import { useNotification } from '../contexts/NotificationContext';

interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  image?: string;
}

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed';
  paymentMethod: 'stripe' | 'mtn' | 'moov' | 'card';
  createdAt: string;
  updatedAt: string;
  notes?: string;
  trackingNumber?: string;
}

const VendorOrderManagement = ({ vendorId }: { vendorId: string }) => {
  const { addNotification } = useNotification();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [newOrdersCount, setNewOrdersCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');

  // Statistiques
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0,
    averageOrderValue: 0
  });

  useEffect(() => {
    // Mode DEMO - créer des commandes simulées
    const demoOrders: Order[] = [
      {
        id: 'order-demo-1',
        orderNumber: 'CMD-2024-001',
        customerName: 'Marie Konan',
        customerEmail: 'marie.konan@email.com',
        customerPhone: '+225 07 08 09 10',
        customerAddress: 'Cocody, Riviera Palmeraie, Abidjan',
        items: [
          {
            id: 'item-1',
            productId: 'demo-product-1',
            productName: 'iPhone 14 Pro Max (Demo)',
            quantity: 1,
            price: 899000,
            image: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=100&h=100&fit=crop'
          }
        ],
        totalAmount: 899000,
        status: 'pending',
        paymentStatus: 'paid',
        paymentMethod: 'stripe',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 heures ago
        updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        notes: 'Client demande livraison rapide'
      },
      {
        id: 'order-demo-2',
        orderNumber: 'CMD-2024-002',
        customerName: 'Jean Yao',
        customerEmail: 'jean.yao@email.com',
        customerPhone: '+225 05 06 07 08',
        customerAddress: 'Marcory, Zone 4, Abidjan',
        items: [
          {
            id: 'item-2',
            productId: 'demo-product-2',
            productName: 'Robe Wax Africain (Demo)',
            quantity: 2,
            price: 45000,
            image: 'https://images.unsplash.com/photo-1581044777550-4cfa60707c03?w=100&h=100&fit=crop'
          }
        ],
        totalAmount: 90000,
        status: 'preparing',
        paymentStatus: 'paid',
        paymentMethod: 'mtn',
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 jour ago
        updatedAt: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(), // 18 heures ago
        trackingNumber: 'TRK-2024-002'
      },
      {
        id: 'order-demo-3',
        orderNumber: 'CMD-2024-003',
        customerName: 'Aminata Diallo',
        customerEmail: 'aminata.diallo@email.com',
        customerPhone: '+225 01 02 03 04',
        customerAddress: 'Yopougon, Sicogi, Abidjan',
        items: [
          {
            id: 'item-3',
            productId: 'demo-product-3',
            productName: 'Attiéké Traditionnel (Demo)',
            quantity: 5,
            price: 2500,
            image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=100&h=100&fit=crop'
          }
        ],
        totalAmount: 12500,
        status: 'delivered',
        paymentStatus: 'paid',
        paymentMethod: 'moov',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 jours ago
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 jour ago
        trackingNumber: 'TRK-2024-003'
      }
    ];

    setTimeout(() => {
      setOrders(demoOrders);
      setFilteredOrders(demoOrders);
      calculateStats(demoOrders);
      setLoading(false);
    }, 1000);
  }, [vendorId]);

  const addNewDemoOrder = () => {
    const newOrder: Order = {
      id: `order-${Date.now()}`,
      orderNumber: `CMD-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
      customerName: ['Marie Dupont', 'Jean Martin', 'Sophie Bernard', 'Pierre Leroy'][Math.floor(Math.random() * 4)],
      customerEmail: '',
      customerPhone: '',
      customerAddress: '',
      items: [
        {
          id: `item-${Date.now()}`,
          productId: 'demo-product',
          productName: ['Robe wax', 'Chemise traditionnelle', 'Sac artisanal', 'Bijou fantaisie'][Math.floor(Math.random() * 4)],
          quantity: 1,
          price: [25000, 18000, 15000, 8000][Math.floor(Math.random() * 4)]
        }
      ],
      totalAmount: [25000, 18000, 15000, 8000][Math.floor(Math.random() * 4)],
      status: 'pending',
      paymentStatus: ['paid', 'pending'][Math.floor(Math.random() * 2)],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    setOrders(prev => [newOrder, ...prev]);
    setNewOrdersCount(prev => prev + 1);
    
    // Notification via le système de notifications
    addNotification({
      type: 'order',
      title: 'Nouvelle commande',
      message: `Commande ${newOrder.orderNumber} reçue - ${newOrder.totalAmount.toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })}`,
      priority: 'high',
      sound: true
    });
  };

  const calculateStats = (ordersList: Order[]) => {
    const totalOrders = ordersList.length;
    const pendingOrders = ordersList.filter(order => order.status === 'pending').length;
    const totalRevenue = ordersList.reduce((sum, order) => sum + order.totalAmount, 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    setStats({
      totalOrders,
      pendingOrders,
      totalRevenue,
      averageOrderValue
    });
  };

  useEffect(() => {
    let filtered = [...orders];

    // Filtrer par recherche
    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerEmail.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrer par statut
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    // Filtrer par date
    if (dateFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (dateFilter) {
        case 'today':
          filterDate.setDate(now.getDate() - 1);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
      }
      
      filtered = filtered.filter(order => new Date(order.createdAt) >= filterDate);
    }

    setFilteredOrders(filtered);
  }, [orders, searchTerm, statusFilter, dateFilter]);

  const updateOrderStatus = (orderId: string, newStatus: Order['status']) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    
    setOrders(prev => prev.map(o => 
      o.id === orderId 
        ? { ...o, status: newStatus, updatedAt: new Date().toISOString() }
        : o
    ));
    
    // Notification de changement de statut via le système de notifications
    const statusLabels = {
      pending: 'En attente',
      confirmed: 'Confirmée',
      preparing: 'En préparation',
      shipped: 'Expédiée',
      delivered: 'Livrée',
      cancelled: 'Annulée'
    };
    
    addNotification({
      type: newStatus === 'delivered' ? 'success' : 'order',
      title: 'Statut de commande mis à jour',
      message: `Commande ${order.orderNumber} marquée comme "${statusLabels[newStatus]}"`,
      priority: newStatus === 'cancelled' ? 'high' : 'medium',
      sound: true
    });
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'preparing': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'shipped': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'delivered': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPaymentStatusColor = (paymentStatus: Order['paymentStatus']) => {
    switch (paymentStatus) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'confirmed': return <CheckCircle className="w-4 h-4" />;
      case 'preparing': return <Package className="w-4 h-4" />;
      case 'shipped': return <Truck className="w-4 h-4" />;
      case 'delivered': return <CheckCircle className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Commandes</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalOrders}</p>
              {newOrdersCount > 0 && (
                <button
                  onClick={() => setNewOrdersCount(0)}
                  className="text-xs text-blue-600 hover:text-blue-800 mt-1"
                >
                  🔔 {newOrdersCount} nouvelle{newOrdersCount > 1 ? 's' : ''} commande{newOrdersCount > 1 ? 's' : ''}
                </button>
              )}
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 relative">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Commandes en Attente</p>
              <p className="text-3xl font-bold text-orange-600">{stats.pendingOrders}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          {newOrdersCount > 0 && (
            <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center animate-pulse">
              {newOrdersCount}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Revenu Total</p>
              <p className="text-3xl font-bold text-green-600">
                {stats.totalRevenue.toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Panier Moyen</p>
              <p className="text-3xl font-bold text-purple-600">
                {stats.averageOrderValue.toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Rechercher une commande..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex gap-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="all">Tous les statuts</option>
              <option value="pending">En attente</option>
              <option value="confirmed">Confirmée</option>
              <option value="preparing">En préparation</option>
              <option value="shipped">Expédiée</option>
              <option value="delivered">Livrée</option>
              <option value="cancelled">Annulée</option>
            </select>

            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="all">Toutes les dates</option>
              <option value="today">Aujourd'hui</option>
              <option value="week">Cette semaine</option>
              <option value="month">Ce mois</option>
            </select>
          </div>
        </div>
      </div>

      {/* Liste des commandes */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Commande
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Montant
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Paiement
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{order.orderNumber}</div>
                      <div className="text-sm text-gray-500">{order.items.length} article(s)</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{order.customerName}</div>
                      <div className="text-sm text-gray-500">{order.customerPhone}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {order.totalAmount.toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                      {getStatusIcon(order.status)}
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPaymentStatusColor(order.paymentStatus)}`}>
                      {order.paymentStatus === 'paid' ? '✅' : order.paymentStatus === 'pending' ? '⏳' : '❌'}
                      {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                        title="Voir les détails"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <div className="flex flex-col gap-1">
                        {order.status === 'pending' && (
                          <button
                            onClick={() => updateOrderStatus(order.id, 'confirmed')}
                            className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700"
                          >
                            Confirmer
                          </button>
                        )}
                        {order.status === 'confirmed' && (
                          <button
                            onClick={() => updateOrderStatus(order.id, 'preparing')}
                            className="bg-purple-600 text-white px-2 py-1 rounded text-xs hover:bg-purple-700"
                          >
                            Préparer
                          </button>
                        )}
                        {order.status === 'preparing' && (
                          <button
                            onClick={() => updateOrderStatus(order.id, 'shipped')}
                            className="bg-indigo-600 text-white px-2 py-1 rounded text-xs hover:bg-indigo-700"
                          >
                            Expédier
                          </button>
                        )}
                        {order.status === 'shipped' && (
                          <button
                            onClick={() => updateOrderStatus(order.id, 'delivered')}
                            className="bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700"
                          >
                            Livrer
                          </button>
                        )}
                        {order.status !== 'cancelled' && order.status !== 'delivered' && (
                          <button
                            onClick={() => updateOrderStatus(order.id, 'cancelled')}
                            className="bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700"
                          >
                            Annuler
                          </button>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredOrders.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune commande trouvée</h3>
            <p className="text-gray-500">Essayez d'ajuster vos filtres de recherche</p>
          </div>
        )}
      </div>

      {/* Modal de détails */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Détails de la commande {selectedOrder.orderNumber}
                </h2>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Informations client */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Informations client</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <User className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900">{selectedOrder.customerName}</p>
                        <p className="text-sm text-gray-500">{selectedOrder.customerEmail}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-gray-400" />
                      <p className="text-gray-900">{selectedOrder.customerPhone}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-gray-400" />
                      <p className="text-gray-900">{selectedOrder.customerAddress}</p>
                    </div>
                  </div>
                </div>

                {/* Informations commande */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Détails de la commande</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Date:</span>
                      <span className="font-medium">{new Date(selectedOrder.createdAt).toLocaleDateString('fr-FR')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Statut:</span>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(selectedOrder.status)}`}>
                        {getStatusIcon(selectedOrder.status)}
                        {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Paiement:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(selectedOrder.paymentStatus)}`}>
                        {selectedOrder.paymentStatus.charAt(0).toUpperCase() + selectedOrder.paymentStatus.slice(1)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Méthode:</span>
                      <span className="font-medium uppercase">{selectedOrder.paymentMethod}</span>
                    </div>
                    {selectedOrder.trackingNumber && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Suivi:</span>
                        <span className="font-medium">{selectedOrder.trackingNumber}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Articles de la commande */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Articles</h3>
                <div className="space-y-3">
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                      {item.image && (
                        <img src={item.image} alt={item.productName} className="w-16 h-16 object-cover rounded-lg" />
                      )}
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{item.productName}</h4>
                        <p className="text-sm text-gray-500">Quantité: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">
                          {(item.price * item.quantity).toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })}
                        </p>
                        <p className="text-sm text-gray-500">
                          {item.price.toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })} unité
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className="mt-6 bg-orange-50 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900">Total:</span>
                  <span className="text-2xl font-bold text-orange-600">
                    {selectedOrder.totalAmount.toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => updateOrderStatus(selectedOrder.id, 'confirmed')}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Confirmer la commande
                </button>
                <button
                  onClick={() => updateOrderStatus(selectedOrder.id, 'preparing')}
                  className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors"
                >
                  Marquer en préparation
                </button>
                <button
                  onClick={() => updateOrderStatus(selectedOrder.id, 'shipped')}
                  className="bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 transition-colors"
                >
                  Marquer expédiée
                </button>
                <button
                  onClick={() => updateOrderStatus(selectedOrder.id, 'delivered')}
                  className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
                >
                  Marquer livrée
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorOrderManagement;