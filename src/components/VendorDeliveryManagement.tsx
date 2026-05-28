import React, { useState, useEffect } from 'react';
import { Truck, MapPin, Clock, CheckCircle, AlertCircle, Package, User, Phone, Navigation, DollarSign, Filter, Search, Calendar, Eye, Download, Map, Building, Star, TrendingUp, Car, Users } from 'lucide-react';
import { useNotification } from '../contexts/NotificationContext';
import DeliveryTrackingMap from './DeliveryTrackingMap';
import { calculateDeliveryFeeFromAddresses } from '../utils/deliveryCalculator';

interface DeliveryAddress {
  street: string;
  city: string;
  district: string;
  postalCode: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

interface DeliveryPartner {
  id: string;
  name: string;
  phone: string;
  vehicleType: 'moto' | 'car' | 'van' | 'truck';
  currentLocation: {
    lat: number;
    lng: number;
  };
  status: 'available' | 'busy' | 'offline';
  rating: number;
  completedDeliveries: number;
}

interface Delivery {
  id: string;
  orderId: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: DeliveryAddress;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  deliveryFee: number;
  totalAmount: number;
  status: 'pending' | 'assigned' | 'picked-up' | 'in-transit' | 'delivered' | 'cancelled';
  assignedPartner?: DeliveryPartner;
  estimatedDeliveryTime?: Date;
  actualDeliveryTime?: Date;
  trackingHistory: Array<{
    status: string;
    timestamp: Date;
    location?: {
      lat: number;
      lng: number;
    };
    notes?: string;
  }>;
  createdAt: Date;
}

interface VendorDeliveryManagementProps {
  vendorId: string;
}

const VendorDeliveryManagement: React.FC<VendorDeliveryManagementProps> = ({ vendorId }) => {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [deliveryPartners, setDeliveryPartners] = useState<DeliveryPartner[]>([]);
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [showPartnerModal, setShowPartnerModal] = useState(false);
  const [currentDeliveryLocation, setCurrentDeliveryLocation] = useState<{ lat: number; lng: number } | null>(null);
  const { addNotification } = useNotification();

  // Données de démonstration
  const demoDeliveryPartners: DeliveryPartner[] = [
    {
      id: 'partner-1',
      name: 'Kouassi Jean',
      phone: '01020304',
      vehicleType: 'moto',
      currentLocation: { lat: 5.3600, lng: -4.0083 },
      status: 'available',
      rating: 4.8,
      completedDeliveries: 127
    },
    {
      id: 'partner-2',
      name: 'Diarra Awa',
      phone: '05060708',
      vehicleType: 'car',
      currentLocation: { lat: 5.3200, lng: -4.0500 },
      status: 'available',
      rating: 4.9,
      completedDeliveries: 203
    },
    {
      id: 'partner-3',
      name: 'Traore Mamadou',
      phone: '09101112',
      vehicleType: 'van',
      currentLocation: { lat: 5.2800, lng: -4.0200 },
      status: 'busy',
      rating: 4.7,
      completedDeliveries: 89
    }
  ];

  const demoDeliveries: Delivery[] = [
    {
      id: 'delivery-1',
      orderId: 'CMD-2024-001',
      customerName: 'Marie Konan',
      customerPhone: '01020304',
      deliveryAddress: {
        street: 'Rue des Jardins, Cocody',
        city: 'Abidjan',
        district: 'Cocody',
        postalCode: '01 BP 1234',
        coordinates: { lat: 5.3400, lng: -4.0083 }
      },
      items: [
        { name: 'iPhone 14 Pro Max', quantity: 1, price: 899000 },
        { name: 'Coque de protection', quantity: 1, price: 15000 }
      ],
      deliveryFee: 5000,
      totalAmount: 919000,
      status: 'pending',
      trackingHistory: [
        {
          status: 'Commande confirmée',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          notes: 'Commande prête pour la livraison'
        }
      ],
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
    },
    {
      id: 'delivery-2',
      orderId: 'CMD-2024-002',
      customerName: 'Jean Yao',
      customerPhone: '05060708',
      deliveryAddress: {
        street: 'Avenue Charles de Gaulle, Plateau',
        city: 'Abidjan',
        district: 'Plateau',
        postalCode: '01 BP 5678',
        coordinates: { lat: 5.3200, lng: -4.0300 }
      },
      items: [
        { name: 'Robe Wax Africain', quantity: 2, price: 45000 }
      ],
      deliveryFee: 3000,
      totalAmount: 93000,
      status: 'assigned',
      assignedPartner: demoDeliveryPartners[0],
      estimatedDeliveryTime: new Date(Date.now() + 45 * 60 * 1000),
      trackingHistory: [
        {
          status: 'Commande confirmée',
          timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
          notes: 'Commande prête pour la livraison'
        },
        {
          status: 'Livreur assigné',
          timestamp: new Date(Date.now() - 30 * 60 * 1000),
          location: { lat: 5.3600, lng: -4.0083 },
          notes: 'Kouassi Jean assigné à la livraison'
        }
      ],
      createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000)
    },
    {
      id: 'delivery-3',
      orderId: 'CMD-2024-003',
      customerName: 'Sophie Diallo',
      customerPhone: '09101112',
      deliveryAddress: {
        street: 'Boulevard de Marseille, Treichville',
        city: 'Abidjan',
        district: 'Treichville',
        postalCode: '01 BP 9012',
        coordinates: { lat: 5.2900, lng: -4.0100 }
      },
      items: [
        { name: 'Attiéké Traditionnel', quantity: 5, price: 2500 }
      ],
      deliveryFee: 2000,
      totalAmount: 14500,
      status: 'in-transit',
      assignedPartner: demoDeliveryPartners[1],
      estimatedDeliveryTime: new Date(Date.now() + 20 * 60 * 1000),
      trackingHistory: [
        {
          status: 'Commande confirmée',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
          notes: 'Commande prête pour la livraison'
        },
        {
          status: 'Livreur assigné',
          timestamp: new Date(Date.now() - 90 * 60 * 1000),
          location: { lat: 5.3200, lng: -4.0500 },
          notes: 'Diarra Awa assignée à la livraison'
        },
        {
          status: 'Colis récupéré',
          timestamp: new Date(Date.now() - 15 * 60 * 1000),
          location: { lat: 5.3100, lng: -4.0250 },
          notes: 'Colis récupéré chez le vendeur'
        }
      ],
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000)
    }
  ];

  useEffect(() => {
    setDeliveries(demoDeliveries);
    setDeliveryPartners(demoDeliveryPartners);

    // Simulation de mises à jour en temps réel
    const interval = setInterval(() => {
      simulateDeliveryUpdate();
    }, 30000); // Toutes les 30 secondes

    return () => clearInterval(interval);
  }, []);

  const simulateDeliveryUpdate = () => {
    const randomDelivery = deliveries[Math.floor(Math.random() * deliveries.length)];
    if (randomDelivery && randomDelivery.status === 'in-transit') {
      const updatedDelivery = {
        ...randomDelivery,
        trackingHistory: [
          ...randomDelivery.trackingHistory,
          {
            status: 'En cours de livraison',
            timestamp: new Date(),
            location: {
              lat: randomDelivery.deliveryAddress.coordinates.lat + (Math.random() - 0.5) * 0.01,
              lng: randomDelivery.deliveryAddress.coordinates.lng + (Math.random() - 0.5) * 0.01
            },
            notes: 'Le livreur est en route vers la destination'
          }
        ]
      };

      setDeliveries(prev => prev.map(d => 
        d.id === randomDelivery.id ? updatedDelivery : d
      ));

      addNotification({
        type: 'alert',
        title: 'Mise à jour livraison',
        message: `La livraison ${randomDelivery.orderId} est en cours`,
        priority: 'medium',
        sound: false
      });
    }
  };

  const getStatusColor = (status: Delivery['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'assigned':
        return 'bg-blue-100 text-blue-800';
      case 'picked-up':
        return 'bg-purple-100 text-purple-800';
      case 'in-transit':
        return 'bg-orange-100 text-orange-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: Delivery['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'assigned':
        return <User className="w-4 h-4" />;
      case 'picked-up':
        return <Package className="w-4 h-4" />;
      case 'in-transit':
        return <Truck className="w-4 h-4" />;
      case 'delivered':
        return <CheckCircle className="w-4 h-4" />;
      case 'cancelled':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Package className="w-4 h-4" />;
    }
  };

  const getVehicleIcon = (vehicleType: DeliveryPartner['vehicleType']) => {
    switch (vehicleType) {
      case 'moto':
        return '🏍️';
      case 'car':
        return '🚗';
      case 'van':
        return '🚐';
      case 'truck':
        return '🚚';
      default:
        return '🚗';
    }
  };

  const filteredDeliveries = deliveries.filter(delivery => {
    const matchesSearch = delivery.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         delivery.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         delivery.customerPhone.includes(searchTerm);
    
    if (filterStatus === 'all') return matchesSearch;
    return matchesSearch && delivery.status === filterStatus;
  });

  const assignDeliveryPartner = (delivery: Delivery, partner: DeliveryPartner) => {
    // Calcul automatique des frais de livraison
    const deliveryFeeResult = calculateDeliveryFee(delivery);
    
    const updatedDelivery = {
      ...delivery,
      status: 'assigned' as const,
      assignedPartner: partner,
      deliveryFee: deliveryFeeResult.fee, // Mise à jour avec le calcul automatique
      estimatedDeliveryTime: new Date(Date.now() + deliveryFeeResult.estimatedTime * 60 * 1000),
      trackingHistory: [
        ...delivery.trackingHistory,
        {
          status: 'Livreur assigné',
          timestamp: new Date(),
          location: partner.currentLocation,
          notes: `${partner.name} assigné à la livraison. Frais: ${formatCurrency(deliveryFeeResult.fee)} (${deliveryFeeResult.estimatedTime} min estimées)`
        }
      ]
    };

    setDeliveries(prev => prev.map(d => 
      d.id === delivery.id ? updatedDelivery : d
    ));

    addNotification({
      type: 'success',
      title: 'Livreur assigné',
      message: `${partner.name} assigné à la livraison ${delivery.orderId}. Frais: ${formatCurrency(deliveryFeeResult.fee)}`,
      priority: 'high',
      sound: true
    });

    setShowAssignModal(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handlePartnerLocationUpdate = (location: { lat: number; lng: number }) => {
    setCurrentDeliveryLocation(location);
    
    // Notification de mise à jour de position
    if (selectedDelivery?.assignedPartner) {
      addNotification({
        type: 'alert',
        title: 'Position mise à jour',
        message: `${selectedDelivery.assignedPartner.name} a changé de position`,
        priority: 'low',
        sound: false
      });
    }
  };

  const calculateDeliveryFee = (delivery: Delivery) => {
    try {
      const result = calculateDeliveryFeeFromAddresses(
        'Boutique principale, Cocody, Abidjan',
        `${delivery.deliveryAddress.street}, ${delivery.deliveryAddress.district}, ${delivery.deliveryAddress.city}`,
        delivery.assignedPartner?.vehicleType || 'moto',
        'normal'
      );
      
      return {
        fee: result.totalFee,
        estimatedTime: result.estimatedTime,
        details: result.details
      };
    } catch (error) {
      console.error('Erreur lors du calcul des frais de livraison:', error);
      return {
        fee: delivery.deliveryFee,
        estimatedTime: 60,
        details: 'Calcul automatique non disponible'
      };
    }
  };

  const exportDeliveries = () => {
    const csvContent = [
      ['ID', 'Commande', 'Client', 'Statut', 'Frais', 'Total', 'Date'].join(','),
      ...filteredDeliveries.map(delivery => [
        delivery.id,
        delivery.orderId,
        delivery.customerName,
        delivery.status,
        delivery.deliveryFee,
        delivery.totalAmount,
        formatDate(delivery.createdAt)
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `livraisons_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* En-tête avec statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Livraisons</p>
              <p className="text-2xl font-bold text-gray-900">{deliveries.length}</p>
            </div>
            <div className="bg-blue-100 p-2 rounded-full">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">En Attente</p>
              <p className="text-2xl font-bold text-yellow-600">
                {deliveries.filter(d => d.status === 'pending').length}
              </p>
            </div>
            <div className="bg-yellow-100 p-2 rounded-full">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">En Cours</p>
              <p className="text-2xl font-bold text-orange-600">
                {deliveries.filter(d => ['assigned', 'picked-up', 'in-transit'].includes(d.status)).length}
              </p>
            </div>
            <div className="bg-orange-100 p-2 rounded-full">
              <Truck className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Livreurs Disponibles</p>
              <p className="text-2xl font-bold text-green-600">
                {deliveryPartners.filter(p => p.status === 'available').length}
              </p>
            </div>
            <div className="bg-green-100 p-2 rounded-full">
              <User className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filtres et recherche */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Rechercher par commande, client ou téléphone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tous les statuts</option>
              <option value="pending">En attente</option>
              <option value="assigned">Assignée</option>
              <option value="picked-up">Récupérée</option>
              <option value="in-transit">En transit</option>
              <option value="delivered">Livrée</option>
              <option value="cancelled">Annulée</option>
            </select>
            <button
              onClick={() => setShowPartnerModal(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
            >
              <Users className="w-4 h-4" />
              Transporteurs
            </button>
            <button
              onClick={exportDeliveries}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Exporter
            </button>
          </div>
        </div>
      </div>

      {/* Liste des livraisons */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Commande
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Adresse
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Livreur
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Frais
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDeliveries.map((delivery) => (
                <tr key={delivery.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{delivery.orderId}</div>
                    <div className="text-xs text-gray-500">{formatDate(delivery.createdAt)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{delivery.customerName}</div>
                    <div className="text-xs text-gray-500">{delivery.customerPhone}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{delivery.deliveryAddress.street}</div>
                    <div className="text-xs text-gray-500">
                      {delivery.deliveryAddress.district}, {delivery.deliveryAddress.city}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(delivery.status)}`}>
                      {getStatusIcon(delivery.status)}
                      {delivery.status.replace('-', ' ').charAt(0).toUpperCase() + delivery.status.slice(1).replace('-', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {delivery.assignedPartner ? (
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getVehicleIcon(delivery.assignedPartner.vehicleType)}</span>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{delivery.assignedPartner.name}</div>
                          <div className="text-xs text-gray-500">⭐ {delivery.assignedPartner.rating}</div>
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">Non assigné</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(delivery.deliveryFee)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedDelivery(delivery);
                          setShowTrackingModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900 bg-blue-100 px-2 py-1 rounded text-xs flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        Suivre
                      </button>
                      {delivery.status === 'pending' && (
                        <button
                          onClick={() => {
                            setSelectedDelivery(delivery);
                            setShowAssignModal(true);
                          }}
                          className="text-green-600 hover:text-green-900 bg-green-100 px-2 py-1 rounded text-xs flex items-center gap-1"
                        >
                          <User className="w-3 h-3" />
                          Assigner
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredDeliveries.length === 0 && (
          <div className="text-center py-8">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">Aucune livraison trouvée</h4>
            <p className="text-gray-600">Aucune livraison ne correspond à vos critères.</p>
          </div>
        )}
      </div>

      {/* Modal d'assignation */}
      {showAssignModal && selectedDelivery && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Assigner un livreur - {selectedDelivery.orderId}
            </h3>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Client: <span className="font-medium">{selectedDelivery.customerName}</span>
              </p>
              <p className="text-sm text-gray-600 mb-2">
                Adresse: <span className="font-medium">{selectedDelivery.deliveryAddress.street}</span>
              </p>
              <p className="text-sm text-gray-600 mb-2">
                Total: <span className="font-medium">{formatCurrency(selectedDelivery.totalAmount)}</span>
              </p>
              <div className="bg-blue-50 p-3 rounded-lg mt-3">
                <p className="text-sm text-blue-800 font-medium mb-1">💡 Calcul automatique des frais</p>
                <p className="text-xs text-blue-600">
                  Les frais de livraison seront calculés automatiquement selon la distance, 
                  le type de véhicule et le district de livraison.
                </p>
              </div>
            </div>
            <div className="space-y-3">
              {deliveryPartners.filter(partner => partner.status === 'available').map((partner) => (
                <div
                  key={partner.id}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => assignDeliveryPartner(selectedDelivery, partner)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getVehicleIcon(partner.vehicleType)}</span>
                      <div>
                        <p className="font-medium text-gray-900">{partner.name}</p>
                        <p className="text-sm text-gray-600">{partner.phone}</p>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="text-xs text-gray-500">⭐ {partner.rating}</span>
                          <span className="text-xs text-gray-500">{partner.completedDeliveries} livraisons</span>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            partner.status === 'available' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {partner.status}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Distance estimée</p>
                      <p className="text-sm font-medium">2.5 km</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowAssignModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de suivi */}
      {showTrackingModal && selectedDelivery && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Suivi de livraison - {selectedDelivery.orderId}
              </h3>
              <button
                onClick={() => setShowTrackingModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="text-2xl">&times;</span>
              </button>
            </div>
            
            {/* Carte de tracking interactive */}
            <div className="mb-6">
              <DeliveryTrackingMap
                deliveryPartner={selectedDelivery.assignedPartner}
                pickupLocation={{
                  id: 'pickup-1',
                  address: 'Boutique principale',
                  coordinates: { lat: 5.3600, lng: -4.0083 },
                  type: 'pickup'
                }}
                deliveryLocation={{
                  id: 'delivery-1',
                  address: selectedDelivery.deliveryAddress.street,
                  coordinates: selectedDelivery.deliveryAddress.coordinates,
                  type: 'delivery'
                }}
                currentDeliveryLocation={currentDeliveryLocation}
                onPartnerUpdate={handlePartnerLocationUpdate}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Informations de livraison */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Informations de livraison</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Client</p>
                      <p className="font-medium">{selectedDelivery.customerName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Statut</p>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedDelivery.status)}`}>
                        {getStatusIcon(selectedDelivery.status)}
                        {selectedDelivery.status.replace('-', ' ').charAt(0).toUpperCase() + selectedDelivery.status.slice(1).replace('-', ' ')}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Adresse de livraison</p>
                    <p className="font-medium">{selectedDelivery.deliveryAddress.street}</p>
                    <p className="text-sm text-gray-600">{selectedDelivery.deliveryAddress.district}, {selectedDelivery.deliveryAddress.city}</p>
                  </div>

                  {selectedDelivery.assignedPartner && (
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Livreur assigné</p>
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getVehicleIcon(selectedDelivery.assignedPartner.vehicleType)}</span>
                        <div>
                          <p className="font-medium">{selectedDelivery.assignedPartner.name}</p>
                          <p className="text-sm text-gray-600">{selectedDelivery.assignedPartner.phone}</p>
                          <p className="text-xs text-gray-500">⭐ {selectedDelivery.assignedPartner.rating} • {selectedDelivery.assignedPartner.completedDeliveries} livraisons</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <p className="text-sm text-gray-600 mb-2">Articles</p>
                    <div className="space-y-1">
                      {selectedDelivery.items.map((item, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span>{item.name} x{item.quantity}</span>
                          <span className="font-medium">{formatCurrency(item.price * item.quantity)}</span>
                        </div>
                      ))}
                      <div className="border-t pt-1 flex justify-between text-sm font-medium">
                        <span>Frais de livraison</span>
                        <span>{formatCurrency(selectedDelivery.deliveryFee)}</span>
                      </div>
                      <div className="border-t pt-1 flex justify-between text-sm font-bold">
                        <span>Total</span>
                        <span>{formatCurrency(selectedDelivery.totalAmount)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Historique du suivi */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Historique du suivi</h4>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {selectedDelivery.trackingHistory.map((history, index) => (
                    <div key={index} className="flex gap-3">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-blue-600" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{history.status}</p>
                        <p className="text-sm text-gray-600">{formatDate(history.timestamp)}</p>
                        {history.notes && (
                          <p className="text-sm text-gray-500 mt-1">{history.notes}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowTrackingModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de gestion des transporteurs */}
      {showPartnerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Gestion des Transporteurs Partenaires
              </h3>
              <button
                onClick={() => setShowPartnerModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="text-2xl">&times;</span>
              </button>
            </div>

            {/* Statistiques des transporteurs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600">Total Transporteurs</p>
                    <p className="text-2xl font-bold text-blue-900">{deliveryPartners.length}</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600">Disponibles</p>
                    <p className="text-2xl font-bold text-green-900">
                      {deliveryPartners.filter(p => p.status === 'available').length}
                    </p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              </div>
              
              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-orange-600">En Mission</p>
                    <p className="text-2xl font-bold text-orange-900">
                      {deliveryPartners.filter(p => p.status === 'busy').length}
                    </p>
                  </div>
                  <Truck className="w-8 h-8 text-orange-600" />
                </div>
              </div>
            </div>

            {/* Liste des transporteurs */}
            <div className="space-y-4">
              {deliveryPartners.map((partner) => (
                <div key={partner.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{getVehicleIcon(partner.vehicleType)}</span>
                      <div>
                        <h4 className="font-semibold text-gray-900">{partner.name}</h4>
                        <p className="text-sm text-gray-600">{partner.phone}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      partner.status === 'available' ? 'bg-green-100 text-green-800' :
                      partner.status === 'busy' ? 'bg-orange-100 text-orange-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {partner.status === 'available' ? 'Disponible' :
                       partner.status === 'busy' ? 'En mission' : 'Hors ligne'}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Véhicule</p>
                      <p className="font-medium capitalize">{partner.vehicleType}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Note</p>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="font-medium">{partner.rating}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-gray-600">Livraisons</p>
                      <p className="font-medium">{partner.completedDeliveries}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Position</p>
                      <p className="font-medium text-xs">
                        {partner.currentLocation.lat.toFixed(4)}, {partner.currentLocation.lng.toFixed(4)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mt-4">
                    <button className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200 transition-colors">
                      Contacter
                    </button>
                    <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200 transition-colors">
                      Historique
                    </button>
                    <button className="px-3 py-1 bg-green-100 text-green-700 rounded text-sm hover:bg-green-200 transition-colors">
                      Localiser
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowPartnerModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorDeliveryManagement;