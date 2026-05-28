import React, { useState } from 'react';
import { Rocket, Sparkles, Zap, Brain, Eye, Shield, Volume2, Blocks, Server } from 'lucide-react';
import AIChatAssistant from './AIChatAssistant';
import ARProductViewer from './ARProductViewer';
import FraudDetectionEngine from './FraudDetectionEngine';

export default function InnovationHub() {
  const [activeInnovation, setActiveInnovation] = useState<string>('ai-assistant');

  const innovations = [
    {
      id: 'ai-assistant',
      title: 'IA Conversationnelle Prédictive',
      description: 'Assistant IA qui prédit les besoins clients avant qu\'ils ne les expriment',
      icon: Brain,
      color: 'purple',
      features: [
        'Analyse prédictive en temps réel',
        'Reconnaissance vocale multilingue',
        'Insights commerciaux automatiques',
        'Suggestions contextuelles intelligentes'
      ]
    },
    {
      id: 'ar-viewer',
      title: 'Réalité Augmentée Produit',
      description: 'Visualisez les produits dans votre environnement avec des informations contextuelles',
      icon: Eye,
      color: 'blue',
      features: [
        'Tracking AR sans marqueur',
        'Informations nutritionnelles en temps réel',
        'Visualisation 3D des produits',
        'Détection de surfaces intelligentes'
      ]
    },
    {
      id: 'fraud-detection',
      title: 'Détection de Fraude IA',
      description: 'Moteur prédictif qui détecte les fraudes avant qu\'elles ne se produisent',
      icon: Shield,
      color: 'red',
      features: [
        'Analyse comportementale biométrique',
        'Détection de proxy/VPN/Tor',
        'Scoring de risque en temps réel',
        'Précision de 99%+'
      ]
    },
    {
      id: 'blockchain',
      title: 'Blockchain Traçabilité',
      description: 'Traçabilité complète des produits avec smart contracts',
      icon: Blocks,
      color: 'green',
      features: [
        'Smart contracts autonomes',
        'Historique immuable des transactions',
        'Vérification de l\'authenticité',
        'Paiements cryptographiques sécurisés'
      ]
    },
    {
      id: 'voice-synthesis',
      title: 'Synthèse Vocale Multilingue',
      description: 'Descriptions produits en voix synthétique dans 50+ langues',
      icon: Volume2,
      color: 'yellow',
      features: [
        '50+ langues supportées',
        'Voix naturelle et expressive',
        'Adaptation culturelle automatique',
        'Synthèse en temps réel'
      ]
    },
    {
      id: 'microservices',
      title: 'Microservices Serverless',
      description: 'Architecture ultra-scalable avec fonctions serverless',
      icon: Server,
      color: 'indigo',
      features: [
        'Auto-scaling intelligent',
        'Tolérance aux pannes',
        'Déploiement continu',
        'Performance optimale'
      ]
    }
  ];

  const getColorClasses = (color: string) => {
    const colorMap: Record<string, string> = {
      purple: 'from-purple-500 to-pink-500',
      blue: 'from-blue-500 to-cyan-500',
      red: 'from-red-500 to-orange-500',
      green: 'from-green-500 to-teal-500',
      yellow: 'from-yellow-500 to-amber-500',
      indigo: 'from-indigo-500 to-purple-500'
    };
    return colorMap[color] || 'from-gray-500 to-gray-600';
  };

  const renderActiveComponent = () => {
    switch (activeInnovation) {
      case 'ai-assistant':
        return <AIChatAssistant />;
      case 'ar-viewer':
        return <ARProductViewer />;
      case 'fraud-detection':
        return <FraudDetectionEngine />;
      case 'blockchain':
        return (
          <div className="bg-gradient-to-br from-green-50 to-teal-50 p-8 rounded-xl">
            <div className="text-center">
              <Blocks className="w-20 h-20 text-green-600 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-gray-800 mb-4">Blockchain Traçabilité</h2>
              <p className="text-lg text-gray-600 mb-8">En cours de développement...</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h3 className="text-xl font-semibold mb-4">Smart Contracts</h3>
                  <p>Contrats intelligents pour automatiser les transactions sécurisées</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h3 className="text-xl font-semibold mb-4">Traçabilité Complète</h3>
                  <p>Historique immuable de chaque produit depuis la ferme jusqu'à votre table</p>
                </div>
              </div>
            </div>
          </div>
        );
      case 'voice-synthesis':
        return (
          <div className="bg-gradient-to-br from-yellow-50 to-amber-50 p-8 rounded-xl">
            <div className="text-center">
              <Volume2 className="w-20 h-20 text-yellow-600 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-gray-800 mb-4">Synthèse Vocale Multilingue</h2>
              <p className="text-lg text-gray-600 mb-8">En cours de développement...</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h3 className="text-xl font-semibold mb-4">50+ Langues</h3>
                  <p>Support complet pour une expérience globale</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h3 className="text-xl font-semibold mb-4">Voix Naturelle</h3>
                  <p>Technologie de pointe pour des voix ultra-réalistes</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h3 className="text-xl font-semibold mb-4">Adaptation Culturelle</h3>
                  <p>Contenu adapté à chaque culture et région</p>
                </div>
              </div>
            </div>
          </div>
        );
      case 'microservices':
        return (
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-8 rounded-xl">
            <div className="text-center">
              <Server className="w-20 h-20 text-indigo-600 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-gray-800 mb-4">Microservices Serverless</h2>
              <p className="text-lg text-gray-600 mb-8">En cours de développement...</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h3 className="text-xl font-semibold mb-4">Auto-Scaling</h3>
                  <p>Montée en charge automatique selon la demande</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h3 className="text-xl font-semibold mb-4">Haute Disponibilité</h3>
                  <p>99.99% de disponibilité garantie</p>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <Rocket className="w-12 h-12 text-purple-600" />
            <h1 className="text-5xl font-bold text-gray-800">Hub d'Innovation MangooTech</h1>
            <Sparkles className="w-12 h-12 text-yellow-500" />
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Découvrez nos technologies révolutionnaires qui font de MangooTech la plateforme la plus avancée du marché
          </p>
        </div>

        {/* Innovation Selector */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {innovations.map((innovation) => {
            const IconComponent = innovation.icon;
            return (
              <button
                key={innovation.id}
                onClick={() => setActiveInnovation(innovation.id)}
                className={`p-6 rounded-xl border-2 transition-all duration-300 transform hover:scale-105 ${
                  activeInnovation === innovation.id
                    ? 'border-purple-500 bg-white shadow-xl'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-lg'
                }`}
              >
                <div className={`w-16 h-16 rounded-full bg-gradient-to-r ${getColorClasses(innovation.color)} flex items-center justify-center mx-auto mb-4`}>
                  <IconComponent className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{innovation.title}</h3>
                <p className="text-sm text-gray-600 mb-4">{innovation.description}</p>
                <div className="space-y-1">
                  {innovation.features.slice(0, 2).map((feature, index) => (
                    <div key={index} className="flex items-center space-x-2 text-xs text-gray-500">
                      <Zap className="w-3 h-3" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </button>
            );
          })}
        </div>

        {/* Active Innovation Display */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="p-8">
            {renderActiveComponent()}
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center mt-12">
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-8 text-white">
            <h2 className="text-3xl font-bold mb-4">Prêt à Révolutionner Votre Business ?</h2>
            <p className="text-xl mb-6 opacity-90">
              Ces technologies innovantes sont disponibles dès maintenant sur votre plateforme MangooTech
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <button className="px-8 py-3 bg-white text-purple-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                Tester Maintenant
              </button>
              <button className="px-8 py-3 bg-purple-700 text-white rounded-lg font-semibold hover:bg-purple-800 transition-colors">
                Voir la Documentation
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}