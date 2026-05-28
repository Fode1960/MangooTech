import React, { useState, useEffect } from 'react';
import { MapPin, TrendingUp, ShoppingCart, Users, DollarSign, Truck, Globe, Smartphone } from 'lucide-react';

interface MarketPrice {
  id: string;
  product: string;
  category: string;
  currentPrice: number;
  previousPrice: number;
  unit: string;
  location: string;
  lastUpdated: Date;
  trend: 'up' | 'down' | 'stable';
  volume: number;
  suppliers: number;
}

interface MarketStall {
  id: string;
  vendor: string;
  location: string;
  products: string[];
  rating: number;
  totalSales: number;
  isOnline: boolean;
  coordinates: { lat: number; lng: number };
}

interface CrossBorderTrade {
  id: string;
  fromCountry: string;
  toCountry: string;
  product: string;
  quantity: number;
  price: number;
  status: 'pending' | 'in_transit' | 'delivered';
  estimatedDelivery: Date;
  customsFees: number;
  transportCost: number;
}

const AfricanMarketplace: React.FC = () => {
  const [marketPrices] = useState<MarketPrice[]>([
    {
      id: '1',
      product: 'Mangues',
      category: 'Fruits',
      currentPrice: 1500,
      previousPrice: 1200,
      unit: 'kg',
      location: 'Marché Sandaga, Dakar',
      lastUpdated: new Date('2024-02-12T08:30:00'),
      trend: 'up',
      volume: 2500,
      suppliers: 15
    },
    {
      id: '2',
      product: 'Tomates',
      category: 'Légumes',
      currentPrice: 800,
      previousPrice: 900,
      unit: 'kg',
      location: 'Marché Tilène, Bamako',
      lastUpdated: new Date('2024-02-12T09:15:00'),
      trend: 'down',
      volume: 1800,
      suppliers: 23
    },
    {
      id: '3',
      product: 'Cacao',
      category: 'Produits de base',
      currentPrice: 1200,
      previousPrice: 1200,
      unit: 'kg',
      location: 'Marché d\'Abengourou',
      lastUpdated: new Date('2024-02-12T07:45:00'),
      trend: 'stable',
      volume: 5000,
      suppliers: 8
    },
    {
      id: '4',
      product: 'Mil',
      category: 'Céréales',
      currentPrice: 450,
      previousPrice: 400,
      unit: 'kg',
      location: 'Marché de Kano, Nigeria',
      lastUpdated: new Date('2024-02-12T10:00:00'),
      trend: 'up',
      volume: 8000,
      suppliers: 32
    }
  ]);

  const [marketStalls] = useState<MarketStall[]>([
    {
      id: '1',
      vendor: 'Mamadou Diallo',
      location: 'Marché Sandaga, Dakar',
      products: ['Mangues', 'Pastèques', 'Melons'],
      rating: 4.8,
      totalSales: 12500,
      isOnline: true,
      coordinates: { lat: 14.6928, lng: -17.4467 }
    },
    {
      id: '2',
      vendor: 'Awa Traoré',
      location: 'Marché Tilène, Bamako',
      products: ['Tomates', 'Oignons', 'Piments'],
      rating: 4.6,
      totalSales: 8900,
      isOnline: true,
      coordinates: { lat: 12.6392, lng: -8.0029 }
    },
    {
      id: '3',
      vendor: 'Kouassi Konan',
      location: 'Marché d\'Abengourou',
      products: ['Cacao', 'Café', 'Bananes'],
      rating: 4.9,
      totalSales: 15600,
      isOnline: false,
      coordinates: { lat: 6.7333, lng: -3.4833 }
    }
  ]);

  const [crossBorderTrades] = useState<CrossBorderTrade[]>([
    {
      id: '1',
      fromCountry: 'Sénégal',
      toCountry: 'Mali',
      product: 'Mangues',
      quantity: 500,
      price: 750000,
      status: 'in_transit',
      estimatedDelivery: new Date('2024-02-15'),
      customsFees: 75000,
      transportCost: 120000
    },
    {
      id: '2',
      fromCountry: 'Côte d\'Ivoire',
      toCountry: 'Burkina Faso',
      product: 'Cacao',
      quantity: 1000,
      price: 1200000,
      status: 'pending',
      estimatedDelivery: new Date('2024-02-18'),
      customsFees: 120000,
      transportCost: 180000
    }
  ]);

  const [selectedProduct, setSelectedProduct] = useState<MarketPrice | null>(null);
  const [selectedStall, setSelectedStall] = useState<MarketStall | null>(null);
  const [selectedTrade, setSelectedTrade] = useState<CrossBorderTrade | null>(null);
  const [activeTab, setActiveTab] = useState<'prices' | 'stalls' | 'crossborder'>('prices');
  const [priceFilter, setPriceFilter] = useState<string>('all');

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-5 h-5 text-red-500" />;
      case 'down': return <TrendingUp className="w-5 h-5 text-green-500 transform rotate-180" />;
      default: return <div className="w-5 h-5 text-gray-500">—</div>;
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'in_transit': return 'text-blue-600 bg-blue-100';
      case 'delivered': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const categories = ['all', 'Fruits', 'Légumes', 'Produits de base', 'Céréales'];

  const filteredPrices = priceFilter === 'all' 
    ? marketPrices 
    : marketPrices.filter(price => price.category === priceFilter);

  const formatCurrency = (amount: number): string => {
    return amount.toLocaleString() + ' FCFA';
  };

  const simulatePriceUpdate = (productId: string) => {
    alert(`Simulation de mise à jour des prix pour le produit ${productId}`);
  };

  const contactVendor = (stallId: string) => {
    alert(`Appeler le vendeur ${stallId}`);
  };

  const trackShipment = (tradeId: string) => {
    alert(`Suivi GPS de l'expédition ${tradeId}`);
  };

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gradient-to-br from-orange-50 to-yellow-50">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">Marché Africain Intelligent</h1>
        <p className="text-lg text-gray-600">Prix en temps réel, commerce transfrontalier et connexion des marchés locaux</p>
      </div>

      {/* Navigation */}
      <div className="flex justify-center mb-8">
        <div className="bg-white rounded-lg p-1 shadow-lg">
          <button
            onClick={() => setActiveTab('prices')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'prices'
                ? 'bg-orange-600 text-white shadow-md'
                : 'text-gray-600 hover:text-orange-600'
            }`}
          >
            <TrendingUp className="w-5 h-5 inline mr-2" />
            Prix du Marché
          </button>
          <button
            onClick={() => setActiveTab('stalls')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'stalls'
                ? 'bg-orange-600 text-white shadow-md'
                : 'text-gray-600 hover:text-orange-600'
            }`}
          >
            <ShoppingCart className="w-5 h-5 inline mr-2" />
            Étalages
          </button>
          <button
            onClick={() => setActiveTab('crossborder')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'crossborder'
                ? 'bg-orange-600 text-white shadow-md'
                : 'text-gray-600 hover:text-orange-600'
            }`}
          >
            <Globe className="w-5 h-5 inline mr-2" />
            Commerce Transfrontalier
          </button>
        </div>
      </div>

      {/* Prix du marché */}
      {activeTab === 'prices' && (
        <div>
          {/* Filtres */}
          <div className="mb-6">
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setPriceFilter(category)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    (category === 'all' && priceFilter === 'all') || (category === priceFilter)
                      ? 'bg-orange-600 text-white'
                      : 'bg-white text-gray-600 hover:bg-orange-100'
                  }`}
                >
                  {category === 'all' ? 'Tous' : category}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold mb-4">Prix en Temps Réel</h2>
              {filteredPrices.map((price) => (
                <div
                  key={price.id}
                  className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => setSelectedProduct(price)}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">{price.product}</h3>
                      <p className="text-gray-600 text-sm">{price.category}</p>
                      <p className="text-gray-500 text-xs flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {price.location}
                      </p>
                    </div>
                    <div className="text-right">
                      {getTrendIcon(price.trend)}
                      <p className="text-xs text-gray-500 mt-1">
                        {price.lastUpdated.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-gray-500 text-sm">Prix actuel</p>
                      <p className="text-xl font-bold text-orange-600">
                        {formatCurrency(price.currentPrice)}
                      </p>
                      <p className="text-xs text-gray-500">par {price.unit}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-sm">Variation</p>
                      <p className={`text-lg font-semibold ${
                        price.trend === 'up' ? 'text-red-600' :
                        price.trend === 'down' ? 'text-green-600' :
                        'text-gray-600'
                      }`}>
                        {price.trend === 'up' ? '+' : price.trend === 'down' ? '-' : ''}
                        {Math.abs(((price.currentPrice - price.previousPrice) / price.previousPrice) * 100).toFixed(1)}%
                      </p>
                      <p className="text-xs text-gray-500">vs veille</p>
                    </div>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span>Volume: {price.volume.toLocaleString()} {price.unit}</span>
                    <span>Fournisseurs: {price.suppliers}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Détails du produit sélectionné */}
            <div className="bg-white rounded-lg shadow-md p-6">
              {selectedProduct ? (
                <div>
                  <h3 className="text-xl font-semibold mb-4">Analyse détaillée</h3>
                  
                  <div className="mb-6">
                    <h4 className="font-medium mb-2">Évolution du prix</h4>
                    <div className="bg-gray-100 h-32 rounded-lg flex items-end justify-center p-4">
                      <div className="flex items-end gap-2 h-full">
                        {[40, 55, 45, 60, 50, 65, 70, 60, 75, 80, 70, 85].map((height, index) => (
                          <div
                            key={index}
                            className="bg-orange-500 w-6 rounded-t"
                            style={{ height: `${height}%` }}
                          ></div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-orange-50 p-4 rounded-lg">
                      <h4 className="font-medium text-orange-800">Prix moyen</h4>
                      <p className="text-2xl font-bold text-orange-600">
                        {formatCurrency(selectedProduct.currentPrice * 0.95)}
                      </p>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-medium text-blue-800">Volume total</h4>
                      <p className="text-2xl font-bold text-blue-600">
                        {selectedProduct.volume.toLocaleString()} {selectedProduct.unit}
                      </p>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h4 className="font-medium mb-3">Marchés similaires</h4>
                    <div className="space-y-2">
                      {marketPrices
                        .filter(p => p.category === selectedProduct.category && p.id !== selectedProduct.id)
                        .slice(0, 3)
                        .map((price) => (
                          <div key={price.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                            <span className="font-medium">{price.product}</span>
                            <span>{formatCurrency(price.currentPrice)}</span>
                          </div>
                        ))}
                    </div>
                  </div>

                  <button 
                    onClick={() => simulatePriceUpdate(selectedProduct.id)}
                    className="w-full bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700"
                  >
                    Actualiser le prix
                  </button>
                </div>
              ) : (
                <p className="text-gray-500">Sélectionnez un produit pour voir l'analyse détaillée</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Étalages */}
      {activeTab === 'stalls' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {marketStalls.map((stall) => (
            <div
              key={stall.id}
              className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setSelectedStall(stall)}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold">{stall.vendor}</h3>
                  <p className="text-gray-600 text-sm flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {stall.location}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${stall.isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                  <span className="text-sm text-gray-500">
                    {stall.isOnline ? 'En ligne' : 'Hors ligne'}
                  </span>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-gray-500 text-sm mb-2">Produits</p>
                <div className="flex flex-wrap gap-1">
                  {stall.products.map((product, index) => (
                    <span key={index} className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs">
                      {product}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                <div>
                  <p className="text-gray-500">Note</p>
                  <div className="flex items-center gap-1">
                    <span className="font-medium">{stall.rating}/5</span>
                    <span className="text-yellow-500">★</span>
                  </div>
                </div>
                <div>
                  <p className="text-gray-500">Ventes</p>
                  <p className="font-medium">{stall.totalSales.toLocaleString()}</p>
                </div>
              </div>

              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  contactVendor(stall.id);
                }}
                className="w-full bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700 flex items-center justify-center gap-2"
              >
                <Smartphone className="w-4 h-4" />
                Contacter
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Commerce transfrontalier */}
      {activeTab === 'crossborder' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-semibold mb-4">Opérations Transfrontalières</h2>
              <div className="space-y-4">
                {crossBorderTrades.map((trade) => (
                  <div
                    key={trade.id}
                    className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50"
                    onClick={() => setSelectedTrade(trade)}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold">{trade.product}</h3>
                        <p className="text-gray-600 text-sm">
                          {trade.fromCountry} → {trade.toCountry}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(trade.status)}`}>
                        {trade.status === 'in_transit' ? 'En transit' : trade.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                      <div>
                        <p className="text-gray-500">Quantité</p>
                        <p className="font-medium">{trade.quantity.toLocaleString()} kg</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Valeur</p>
                        <p className="font-medium">{formatCurrency(trade.price)}</p>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-sm">
                      <span>Livraison estimée: {trade.estimatedDelivery.toLocaleDateString()}</span>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          trackShipment(trade.id);
                        }}
                        className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                      >
                        <Truck className="w-4 h-4" />
                        Suivre
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Détails du commerce sélectionné */}
            <div className="bg-white rounded-lg shadow-md p-6">
              {selectedTrade ? (
                <div>
                  <h3 className="text-xl font-semibold mb-4">Détails de l'Opération</h3>
                  
                  <div className="mb-6">
                    <h4 className="font-medium mb-2">Itinéraire</h4>
                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                      <div className="text-center">
                        <p className="font-semibold">{selectedTrade.fromCountry}</p>
                        <p className="text-sm text-gray-600">Départ</p>
                      </div>
                      <div className="flex-1 mx-4">
                        <div className="border-t-2 border-dashed border-blue-300 relative">
                          <Truck className="w-6 h-6 text-blue-600 absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-blue-50" />
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold">{selectedTrade.toCountry}</p>
                        <p className="text-sm text-gray-600">Destination</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="font-medium text-green-800">Valeur marchandise</h4>
                      <p className="text-2xl font-bold text-green-600">
                        {formatCurrency(selectedTrade.price)}
                      </p>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg">
                      <h4 className="font-medium text-orange-800">Frais totaux</h4>
                      <p className="text-2xl font-bold text-orange-600">
                        {formatCurrency(selectedTrade.customsFees + selectedTrade.transportCost)}
                      </p>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h4 className="font-medium mb-3">Répartition des coûts</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Droits de douane:</span>
                        <span className="font-medium">{formatCurrency(selectedTrade.customsFees)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Transport:</span>
                        <span className="font-medium">{formatCurrency(selectedTrade.transportCost)}</span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span className="font-semibold">Total:</span>
                        <span className="font-semibold">
                          {formatCurrency(selectedTrade.price + selectedTrade.customsFees + selectedTrade.transportCost)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => trackShipment(selectedTrade.id)}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                  >
                    <Globe className="w-5 h-5" />
                    Suivre en temps réel
                  </button>
                </div>
              ) : (
                <p className="text-gray-500">Sélectionnez une opération pour voir les détails</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AfricanMarketplace;
