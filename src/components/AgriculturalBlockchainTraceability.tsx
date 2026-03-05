import React, { useState, useEffect } from 'react';
import { Link, Shield, CheckCircle, Clock, MapPin, User, TrendingUp, Leaf, Package } from 'lucide-react';

interface BlockchainTransaction {
  id: string;
  hash: string;
  timestamp: Date;
  from: string;
  to: string;
  amount: number;
  status: 'pending' | 'confirmed' | 'validated';
  blockNumber: number;
}

interface AgriculturalProduct {
  id: string;
  name: string;
  farmer: string;
  farmLocation: string;
  harvestDate: Date;
  certification: string[];
  blockchainHash: string;
  transactions: BlockchainTransaction[];
  currentLocation: string;
  qualityScore: number;
  sustainabilityRating: number;
}

interface Farm {
  id: string;
  name: string;
  owner: string;
  location: string;
  coordinates: { lat: number; lng: number };
  size: number;
  cropTypes: string[];
  certification: string[];
  blockchainId: string;
  harvestHistory: {
    season: string;
    yield: number;
    quality: number;
    revenue: number;
  }[];
}

const AgriculturalBlockchainTraceability: React.FC = () => {
  const [products] = useState<AgriculturalProduct[]>([
    {
      id: '1',
      name: 'Mangues Bio du Sénégal',
      farmer: 'Moussa Diop',
      farmLocation: 'Kaolack, Sénégal',
      harvestDate: new Date('2024-01-15'),
      certification: ['Bio Européen', 'Fair Trade', 'Label Afrique'],
      blockchainHash: '0x7a8b9c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b',
      transactions: [
        {
          id: '1',
          hash: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0',
          timestamp: new Date('2024-01-15T08:30:00'),
          from: 'Moussa Diop',
          to: 'Coopérative Kaolack',
          amount: 500,
          status: 'validated',
          blockNumber: 1234567
        },
        {
          id: '2',
          hash: '0x2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1',
          timestamp: new Date('2024-01-16T14:20:00'),
          from: 'Coopérative Kaolack',
          to: 'Export Sénégal',
          amount: 750,
          status: 'confirmed',
          blockNumber: 1234568
        }
      ],
      currentLocation: 'Port de Dakar',
      qualityScore: 95,
      sustainabilityRating: 88
    },
    {
      id: '2',
      name: 'Cacao Ivoirien Premium',
      farmer: 'Kouadio Konan',
      farmLocation: 'Abengourou, Côte d\'Ivoire',
      harvestDate: new Date('2024-02-01'),
      certification: ['UTZ Certified', 'Rainforest Alliance', 'Cacao Trace'],
      blockchainHash: '0x9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c',
      transactions: [
        {
          id: '3',
          hash: '0x3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2',
          timestamp: new Date('2024-02-01T06:15:00'),
          from: 'Kouadio Konan',
          to: 'Coopérative Abengourou',
          amount: 1200,
          status: 'validated',
          blockNumber: 1234569
        }
      ],
      currentLocation: 'Chocolaterie européenne',
      qualityScore: 92,
      sustainabilityRating: 85
    }
  ]);

  const [farms] = useState<Farm[]>([
    {
      id: '1',
      name: 'Ferme Bio de Kaolack',
      owner: 'Moussa Diop',
      location: 'Kaolack, Sénégal',
      coordinates: { lat: 14.15, lng: -16.08 },
      size: 25,
      cropTypes: ['Mangues', 'Pastèques', 'Tomates'],
      certification: ['Bio Sénégal', 'GlobalGAP'],
      blockchainId: 'FARM-SN-001',
      harvestHistory: [
        { season: '2023', yield: 15000, quality: 94, revenue: 7500000 },
        { season: '2022', yield: 13500, quality: 91, revenue: 6750000 },
        { season: '2021', yield: 12000, quality: 89, revenue: 6000000 }
      ]
    },
    {
      id: '2',
      name: 'Plantation Konan',
      owner: 'Kouadio Konan',
      location: 'Abengourou, Côte d\'Ivoire',
      coordinates: { lat: 6.73, lng: -3.15 },
      size: 45,
      cropTypes: ['Cacao', 'Café', 'Bananes'],
      certification: ['UTZ', 'Rainforest Alliance'],
      blockchainId: 'FARM-CI-002',
      harvestHistory: [
        { season: '2023', yield: 25000, quality: 90, revenue: 12500000 },
        { season: '2022', yield: 23000, quality: 88, revenue: 11500000 },
        { season: '2021', yield: 21000, quality: 85, revenue: 10500000 }
      ]
    }
  ]);

  const [selectedProduct, setSelectedProduct] = useState<AgriculturalProduct | null>(null);
  const [selectedFarm, setSelectedFarm] = useState<Farm | null>(null);
  const [activeTab, setActiveTab] = useState<'products' | 'farms' | 'transactions'>('products');

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'validated': return 'text-green-600 bg-green-100';
      case 'confirmed': return 'text-blue-600 bg-blue-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getQualityColor = (score: number): string => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  const generateQRCode = (productId: string): string => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=PRODUCT:${productId}:BLOCKCHAIN:TRACE`;
  };

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gradient-to-br from-green-50 to-blue-50">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">Traçabilité Blockchain Agricole</h1>
        <p className="text-lg text-gray-600">Transparence totale de la ferme à l'assiette</p>
      </div>

      {/* Navigation */}
      <div className="flex justify-center mb-8">
        <div className="bg-white rounded-lg p-1 shadow-lg">
          <button
            onClick={() => setActiveTab('products')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'products'
                ? 'bg-green-600 text-white shadow-md'
                : 'text-gray-600 hover:text-green-600'
            }`}
          >
            <Package className="w-5 h-5 inline mr-2" />
            Produits
          </button>
          <button
            onClick={() => setActiveTab('farms')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'farms'
                ? 'bg-green-600 text-white shadow-md'
                : 'text-gray-600 hover:text-green-600'
            }`}
          >
            <Leaf className="w-5 h-5 inline mr-2" />
            Exploitations
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'transactions'
                ? 'bg-green-600 text-white shadow-md'
                : 'text-gray-600 hover:text-green-600'
            }`}
          >
            <Link className="w-5 h-5 inline mr-2" />
            Transactions
          </button>
        </div>
      </div>

      {/* Produits */}
      {activeTab === 'products' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold mb-4">Produits Traçables</h2>
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setSelectedProduct(product)}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold">{product.name}</h3>
                    <p className="text-gray-600 flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {product.farmer}
                    </p>
                    <p className="text-gray-500 text-sm flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {product.farmLocation}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold ${getQualityColor(product.qualityScore)}`}>
                      {product.qualityScore}%
                    </div>
                    <p className="text-xs text-gray-500">Qualité</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-gray-500 text-sm">Localisation actuelle</p>
                    <p className="font-medium">{product.currentLocation}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">Date de récolte</p>
                    <p className="font-medium">{product.harvestDate.toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-gray-500 text-sm mb-2">Certifications</p>
                  <div className="flex flex-wrap gap-2">
                    {product.certification.map((cert, index) => (
                      <span key={index} className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                        {cert}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-blue-600" />
                    <span className="text-sm text-blue-600">Blockchain vérifié</span>
                  </div>
                  <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                    Voir détails
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Détails du produit sélectionné */}
          <div className="bg-white rounded-lg shadow-md p-6">
            {selectedProduct ? (
              <div>
                <h3 className="text-xl font-semibold mb-4">Détails de traçabilité</h3>
                
                <div className="mb-6">
                  <h4 className="font-medium mb-2">Hash Blockchain</h4>
                  <div className="bg-gray-100 p-3 rounded-lg font-mono text-sm break-all">
                    {selectedProduct.blockchainHash}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-medium text-green-800 mb-2">Qualité</h4>
                    <div className="text-2xl font-bold text-green-600">{selectedProduct.qualityScore}%</div>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-800 mb-2">Durabilité</h4>
                    <div className="text-2xl font-bold text-blue-600">{selectedProduct.sustainabilityRating}%</div>
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="font-medium mb-3">Historique des transactions</h4>
                  <div className="space-y-3">
                    {selectedProduct.transactions.map((transaction) => (
                      <div key={transaction.id} className="border-l-4 border-blue-500 pl-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-medium">{transaction.from} → {transaction.to}</p>
                            <p className="text-sm text-gray-600">
                              {transaction.timestamp.toLocaleString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{transaction.amount.toLocaleString()} FCFA</p>
                            <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(transaction.status)}`}>
                              {transaction.status}
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 font-mono">
                          Block: #{transaction.blockNumber}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="font-medium mb-3">Code QR de traçabilité</h4>
                  <div className="flex justify-center">
                    <img 
                      src={generateQRCode(selectedProduct.id)} 
                      alt="QR Code" 
                      className="w-32 h-32"
                    />
                  </div>
                </div>

                <button className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700">
                  Vérifier sur la blockchain
                </button>
              </div>
            ) : (
              <p className="text-gray-500">Sélectionnez un produit pour voir les détails de traçabilité</p>
            )}
          </div>
        </div>
      )}

      {/* Exploitations */}
      {activeTab === 'farms' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold mb-4">Exploitations Agricoles</h2>
            {farms.map((farm) => (
              <div
                key={farm.id}
                className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setSelectedFarm(farm)}
              >
                <div className="mb-4">
                  <h3 className="text-xl font-semibold">{farm.name}</h3>
                  <p className="text-gray-600 flex items-center gap-1">
                    <User className="w-4 h-4" />
                    {farm.owner}
                  </p>
                  <p className="text-gray-500 text-sm flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {farm.location}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-gray-500 text-sm">Superficie</p>
                    <p className="font-medium">{farm.size} hectares</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">ID Blockchain</p>
                    <p className="font-medium text-xs">{farm.blockchainId}</p>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-gray-500 text-sm mb-2">Cultures</p>
                  <div className="flex flex-wrap gap-2">
                    {farm.cropTypes.map((crop, index) => (
                      <span key={index} className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                        {crop}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-600">Certifié</span>
                  </div>
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            ))}
          </div>

          {/* Détails de l'exploitation */}
          <div className="bg-white rounded-lg shadow-md p-6">
            {selectedFarm ? (
              <div>
                <h3 className="text-xl font-semibold mb-4">Détails de l'exploitation</h3>
                
                <div className="mb-6">
                  <h4 className="font-medium mb-2">Coordonnées GPS</h4>
                  <div className="bg-gray-100 p-3 rounded-lg">
                    <p className="font-mono text-sm">
                      Latitude: {selectedFarm.coordinates.lat}<br/>
                      Longitude: {selectedFarm.coordinates.lng}
                    </p>
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="font-medium mb-3">Historique des récoltes</h4>
                  <div className="space-y-3">
                    {selectedFarm.harvestHistory.map((harvest, index) => (
                      <div key={index} className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">{harvest.season}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">Qualité:</span>
                            <span className={`font-medium ${getQualityColor(harvest.quality)}`}>
                              {harvest.quality}%
                            </span>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Rendement:</span>
                            <p className="font-medium">{harvest.yield.toLocaleString()} kg</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Revenu:</span>
                            <p className="font-medium">{harvest.revenue.toLocaleString()} FCFA</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="font-medium mb-2">Certifications</h4>
                  <div className="space-y-2">
                    {selectedFarm.certification.map((cert, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span>{cert}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700">
                  Vérifier la certification
                </button>
              </div>
            ) : (
              <p className="text-gray-500">Sélectionnez une exploitation pour voir les détails</p>
            )}
          </div>
        </div>
      )}

      {/* Transactions */}
      {activeTab === 'transactions' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-6">Transactions Blockchain Récentes</h2>
          <div className="space-y-4">
            {[...products.flatMap(p => p.transactions), ...farms.flatMap(f => 
              f.harvestHistory.map((h, i) => ({
                id: `${f.id}-${i}`,
                hash: `0x${Math.random().toString(16).substr(2, 40)}`,
                timestamp: new Date(),
                from: f.owner,
                to: 'Marché local',
                amount: h.revenue,
                status: 'validated' as const,
                blockNumber: 1234570 + i
              }))
            )].map((transaction) => (
              <div key={transaction.id} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Link className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">{transaction.from} → {transaction.to}</p>
                      <p className="text-sm text-gray-600 font-mono">
                        {transaction.hash.substring(0, 10)}...{transaction.hash.substring(30)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{transaction.amount.toLocaleString()} FCFA</p>
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(transaction.status)}`}>
                      {transaction.status}
                    </span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center text-sm text-gray-500">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {transaction.timestamp.toLocaleString()}
                    </span>
                    <span className="font-mono">Block #{transaction.blockNumber}</span>
                  </div>
                  <button className="text-blue-600 hover:text-blue-800">
                    Voir sur blockchain
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AgriculturalBlockchainTraceability;