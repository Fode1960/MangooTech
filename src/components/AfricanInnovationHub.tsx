import React, { useState } from 'react';
import { 
  Smartphone, 
  Users, 
  Leaf, 
  ShoppingCart, 
  Book, 
  Cloud, 
  Coins, 
  Link, 
  Award, 
  TrendingUp,
  MapPin,
  Globe,
  Target
} from 'lucide-react';

import AfricanMobilePayment from './AfricanMobilePayment';
import AfricanMicrocreditSystem from './AfricanMicrocreditSystem';
import AgriculturalBlockchainTraceability from './AgriculturalBlockchainTraceability';
import AfricanTontineManager from './AfricanTontineManager';
import AfricanMarketplace from './AfricanMarketplace';
import AfricanDigitalEducation from './AfricanDigitalEducation';
import AfricanAgriculturalWeather from './AfricanAgriculturalWeather';

const AfricanInnovationHub: React.FC<{ initialFeature?: string }> = ({ initialFeature = 'payment' }) => {
  const [activeFeature, setActiveFeature] = useState<string>(initialFeature);

  const features = [
    {
      id: 'local_map',
      name: 'Mangoo Local+ (Carte)',
      icon: MapPin,
      description: 'Trouvez les commerces autour de vous (Géolocalisation & Voix)',
      color: 'bg-green-600',
      gradient: 'from-green-500 to-teal-400'
    },
    {
      id: 'payment',
      name: 'Paiement Mobile Africain',
      icon: Smartphone,
      description: 'M-Pesa, Orange Money, Wave, MTN Mobile Money',
      color: 'bg-green-600',
      gradient: 'from-green-400 to-blue-500'
    },
    {
      id: 'microcredit',
      name: 'Microcrédit Intelligent',
      icon: Coins,
      description: 'Financement communautaire et évaluation de risque',
      color: 'bg-blue-600',
      gradient: 'from-blue-400 to-purple-500'
    },
    {
      id: 'blockchain',
      name: 'Blockchain Agricole',
      icon: Leaf,
      description: 'Traçabilité complète de la ferme à l\'assiette',
      color: 'bg-green-700',
      gradient: 'from-green-500 to-teal-500'
    },
    {
      id: 'tontine',
      name: 'Gestion des Tontines',
      icon: Users,
      description: 'Systèmes d\'épargne traditionnels modernisés',
      color: 'bg-purple-600',
      gradient: 'from-purple-400 to-pink-500'
    },
    {
      id: 'marketplace',
      name: 'Marché Africain Intelligent',
      icon: ShoppingCart,
      description: 'Prix en temps réel et commerce transfrontalier',
      color: 'bg-orange-600',
      gradient: 'from-orange-400 to-red-500'
    },
    {
      id: 'education',
      name: 'Éducation Numérique',
      icon: Book,
      description: 'Formation professionnelle et certification blockchain',
      color: 'bg-indigo-600',
      gradient: 'from-indigo-400 to-blue-500'
    },
    {
      id: 'weather',
      name: 'Météo Agricole Intelligente',
      icon: Cloud,
      description: 'Prévisions et conseils agricoles personnalisés',
      color: 'bg-cyan-600',
      gradient: 'from-cyan-400 to-blue-500'
    }
  ];

  const renderActiveComponent = () => {
    switch (activeFeature) {
      case 'local_map':
        return (
          <div className="w-full h-[600px] rounded-lg overflow-hidden border border-gray-200">
            <iframe 
              src="/mangoo-local.html" 
              className="w-full h-full border-0"
              title="Mangoo Local+"
            />
          </div>
        );
      case 'payment':
        return <AfricanMobilePayment />;
      case 'microcredit':
        return <AfricanMicrocreditSystem />;
      case 'blockchain':
        return <AgriculturalBlockchainTraceability />;
      case 'tontine':
        return <AfricanTontineManager />;
      case 'marketplace':
        return <AfricanMarketplace />;
      case 'education':
        return <AfricanDigitalEducation />;
      case 'weather':
        return <AfricanAgriculturalWeather />;
      default:
        return <AfricanMobilePayment />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 via-red-600 to-purple-600 text-white py-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center">
            <h1 className="text-5xl font-bold mb-4">🌍 Hub d'Innovation Africaine</h1>
            <p className="text-xl opacity-90">
              Technologies révolutionnaires adaptées aux besoins spécifiques du marché africain
            </p>
            <div className="mt-6 flex justify-center items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>Sénégal • Mali • Côte d'Ivoire • Nigeria</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                <span>Franc CFA • Anglais • Français</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation des fonctionnalités */}
      <div className="bg-white shadow-lg sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex flex-wrap justify-center gap-2">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <button
                  key={feature.id}
                  onClick={() => setActiveFeature(feature.id)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
                    activeFeature === feature.id
                      ? `${feature.color} text-white shadow-lg`
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="hidden sm:inline">{feature.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Feature active */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <div className="text-center">
            <div className={`inline-flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r ${
              features.find(f => f.id === activeFeature)?.gradient || 'from-blue-400 to-purple-500'
            } text-white mb-4`}>
              {React.createElement(features.find(f => f.id === activeFeature)?.icon || Smartphone, { className: "w-6 h-6" })}
              <h2 className="text-2xl font-bold">
                {features.find(f => f.id === activeFeature)?.name}
              </h2>
            </div>
            <p className="text-gray-600 text-lg">
              {features.find(f => f.id === activeFeature)?.description}
            </p>
          </div>
        </div>

        {/* Statistiques rapides */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Smartphone className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800">15M+</h3>
            <p className="text-gray-600">Transactions mobiles</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800">2.5M+</h3>
            <p className="text-gray-600">Agriculteurs connectés</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Award className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800">50K+</h3>
            <p className="text-gray-600">Certifications délivrées</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800">98%</h3>
            <p className="text-gray-600">Taux de satisfaction</p>
          </div>
        </div>

        {/* Composant actif */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {renderActiveComponent()}
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white py-8 mt-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">🌍 MangooTech Afrique</h3>
              <p className="text-gray-300">
                Révolutionnons le commerce africain avec des technologies adaptées aux besoins locaux.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Technologies Clés</h4>
              <ul className="space-y-2 text-gray-300">
                <li>• Paiement Mobile</li>
                <li>• Blockchain Agricole</li>
                <li>• Microcrédit Intelligent</li>
                <li>• Éducation Numérique</li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Impact Social</h4>
              <ul className="space-y-2 text-gray-300">
                <li>• Inclusion financière</li>
                <li>• Traçabilité alimentaire</li>
                <li>• Formation professionnelle</li>
                <li>• Commerce équitable</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center">
            <p className="text-gray-400">
              © 2024 MangooTech. Construisons l'Afrique numérique de demain. 🚀
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AfricanInnovationHub;