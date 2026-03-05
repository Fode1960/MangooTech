import React, { useState, useEffect, useCallback } from 'react';
import { Shield, AlertTriangle, TrendingUp, Activity, Eye, Zap, Brain, Lock, Unlock, Clock, MapPin, CreditCard, User, Bell } from 'lucide-react';
import { toast } from 'sonner';

interface FraudDetection {
  id: string;
  type: 'transaction' | 'behavior' | 'account' | 'network';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  timestamp: Date;
  userId: string;
  details: Record<string, any>;
  predictedOutcome: 'legitimate' | 'fraudulent' | 'suspicious';
  factors: FraudFactor[];
}

interface FraudFactor {
  name: string;
  value: number;
  weight: number;
  description: string;
  category: 'velocity' | 'location' | 'device' | 'behavior' | 'network';
}

interface RealTimeMetrics {
  fraudRate: number;
  detectionAccuracy: number;
  falsePositiveRate: number;
  averageResponseTime: number;
  blockedTransactions: number;
  legitimateTransactions: number;
}

export default function FraudDetectionEngine() {
  const [detections, setDetections] = useState<FraudDetection[]>([]);
  const [realTimeMetrics, setRealTimeMetrics] = useState<RealTimeMetrics>({
    fraudRate: 0.02,
    detectionAccuracy: 98.5,
    falsePositiveRate: 0.8,
    averageResponseTime: 0.15,
    blockedTransactions: 12,
    legitimateTransactions: 588
  });
  const [isScanning, setIsScanning] = useState(false);
  const [selectedDetection, setSelectedDetection] = useState<FraudDetection | null>(null);
  const [predictionMode, setPredictionMode] = useState<'realtime' | 'predictive' | 'adaptive'>('predictive');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Algorithme de détection prédictive ultra-avancé
  const predictiveFraudDetection = useCallback((transactionData: any): FraudDetection => {
    const factors: FraudFactor[] = [];
    let totalRiskScore = 0;
    let maxWeight = 0;

    // 1. Analyse de vélocité (Vitesse des transactions)
    const velocityRisk = calculateVelocityRisk(transactionData);
    factors.push({
      name: 'Vélocité Anormale',
      value: velocityRisk.score,
      weight: velocityRisk.weight,
      description: velocityRisk.description,
      category: 'velocity'
    });

    // 2. Analyse géographique avec détection de proxy/VPN
    const geoRisk = calculateGeographicRisk(transactionData);
    factors.push({
      name: 'Anomalie Géographique',
      value: geoRisk.score,
      weight: geoRisk.weight,
      description: geoRisk.description,
      category: 'location'
    });

    // 3. Analyse de comportement biométrique
    const behaviorRisk = calculateBehavioralRisk(transactionData);
    factors.push({
      name: 'Comportement Suspect',
      value: behaviorRisk.score,
      weight: behaviorRisk.weight,
      description: behaviorRisk.description,
      category: 'behavior'
    });

    // 4. Analyse du réseau et des patterns
    const networkRisk = calculateNetworkRisk(transactionData);
    factors.push({
      name: 'Pattern Réseau',
      value: networkRisk.score,
      weight: networkRisk.weight,
      description: networkRisk.description,
      category: 'network'
    });

    // 5. Analyse de l'appareil et fingerprinting
    const deviceRisk = calculateDeviceRisk(transactionData);
    factors.push({
      name: 'Appareil à Risque',
      value: deviceRisk.score,
      weight: deviceRisk.weight,
      description: deviceRisk.description,
      category: 'device'
    });

    // Calcul du score global avec Machine Learning simulé
    factors.forEach(factor => {
      totalRiskScore += factor.value * factor.weight;
      maxWeight += factor.weight;
    });

    const finalRiskScore = Math.min(totalRiskScore / maxWeight, 1);
    const confidence = calculateConfidence(factors);

    // Prédiction du résultat avec algorithme avancé
    const predictedOutcome = predictOutcome(finalRiskScore, factors);
    const riskLevel = getRiskLevel(finalRiskScore);

    return {
      id: `fraud_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: determineFraudType(factors),
      riskLevel,
      confidence,
      timestamp: new Date(),
      userId: transactionData.userId || 'unknown',
      details: transactionData,
      predictedOutcome,
      factors
    };
  }, []);

  // Calcul de risque de vélocité avec détection de bots
  const calculateVelocityRisk = (data: any) => {
    const timeWindow = 300000; // 5 minutes
    const maxTransactions = 3;
    const currentTime = Date.now();
    
    // Simuler des données historiques
    const recentTransactions = Math.floor(Math.random() * 10);
    const timeSinceLast = Math.random() * 60000;
    
    let score = 0;
    let description = 'Vélocité normale';
    
    if (recentTransactions > maxTransactions) {
      score = Math.min(recentTransactions / maxTransactions, 1);
      description = `⚡ ${recentTransactions} transactions en ${timeWindow/60000}min - Pattern bot détecté`;
    } else if (timeSinceLast < 1000) {
      score = 0.8;
      description = '🤖 Transaction ultra-rapide (< 1s) - Possible automation';
    } else if (timeSinceLast < 5000) {
      score = 0.4;
      description = '⚠️ Transaction rapide (< 5s) - À surveiller';
    }
    
    return {
      score,
      weight: 0.25,
      description
    };
  };

  // Analyse géographique avec détection de proxy/VPN/Tor
  const calculateGeographicRisk = (data: any) => {
    const riskyCountries = ['KP', 'IR', 'SY', 'AF', 'MM'];
    const proxyIndicators = ['datacenter', 'vpn', 'tor', 'proxy'];
    
    // Simuler des données IP
    const country = data.country || ['FR', 'CI', 'US', 'CA', 'GB'][Math.floor(Math.random() * 5)];
    const isProxy = Math.random() > 0.7;
    const distance = Math.random() * 10000; // km depuis dernière position
    
    let score = 0;
    let description = 'Localisation normale';
    
    if (riskyCountries.includes(country)) {
      score = 0.9;
      description = `🌍 Pays à haut risque: ${country}`;
    } else if (isProxy) {
      score = 0.7;
      description = '🎭 Proxy/VPN détecté - Localisation masquée';
    } else if (distance > 5000) {
      score = 0.6;
      description = `✈️ Distance anormale: ${Math.round(distance)}km`;
    } else if (distance > 1000) {
      score = 0.3;
      description = `📍 Déplacement important: ${Math.round(distance)}km`;
    }
    
    return {
      score,
      weight: 0.20,
      description
    };
  };

  // Analyse comportementale biométrique
  const calculateBehavioralRisk = (data: any) => {
    const normalMouseSpeed = 0.5; // pixels par milliseconde
    const normalTypingSpeed = 50; // mots par minute
    
    // Simuler des métriques biométriques
    const mouseSpeed = Math.random() * 2;
    const typingSpeed = Math.random() * 200;
    const hesitationTime = Math.random() * 5000;
    const scrollPattern = Math.random();
    
    let score = 0;
    let description = 'Comportement humain normal';
    
    if (mouseSpeed > 1.5) {
      score = 0.8;
      description = '🖱️ Vitesse souris anormale - Possible script';
    } else if (typingSpeed > 150) {
      score = 0.7;
      description = `⌨️ Vitesse de frappe excessive: ${Math.round(typingSpeed)} mpm`;
    } else if (hesitationTime < 100) {
      score = 0.6;
      description = '⚡ Aucune hésitation - Comportement automatisé';
    } else if (scrollPattern < 0.1) {
      score = 0.5;
      description = '📜 Pattern de scroll suspect';
    }
    
    return {
      score,
      weight: 0.20,
      description
    };
  };

  // Analyse des patterns réseau
  const calculateNetworkRisk = (data: any) => {
    const knownFraudNetworks = ['network1', 'network2', 'network3'];
    
    // Simuler des métriques réseau
    const sameNetworkTransactions = Math.floor(Math.random() * 5);
    const networkReputation = Math.random();
    const timePatternCorrelation = Math.random();
    
    let score = 0;
    let description = 'Réseau propre';
    
    if (sameNetworkTransactions > 3) {
      score = 0.85;
      description = `🌐 ${sameNetworkTransactions} transactions du même réseau - Pattern frauduleux`;
    } else if (networkReputation < 0.3) {
      score = 0.7;
      description = '🚫 Réseau avec mauvaise réputation';
    } else if (timePatternCorrelation > 0.8) {
      score = 0.6;
      description = '⏰ Corrélation temporelle suspecte';
    }
    
    return {
      score,
      weight: 0.20,
      description
    };
  };

  // Analyse de l'appareil et fingerprinting
  const calculateDeviceRisk = (data: any) => {
    // Simuler des métriques d'appareil
    const deviceAge = Math.random() * 365;
    const screenResolution = { width: 1920, height: 1080 };
    const isEmulator = Math.random() > 0.9;
    const hasRoot = Math.random() > 0.8;
    const userAgentConsistency = Math.random();
    
    let score = 0;
    let description = 'Appareil légitime';
    
    if (isEmulator) {
      score = 0.95;
      description = '📱 Émulateur détecté - Risque extrême';
    } else if (hasRoot) {
      score = 0.8;
      description = '🔓 Appareil rooté - Sécurité compromise';
    } else if (deviceAge < 1) {
      score = 0.6;
      description = '🆕 Appareil récemment créé - Suspect';
    } else if (userAgentConsistency < 0.5) {
      score = 0.5;
      description = '🕵️ Inconsistance User-Agent';
    }
    
    return {
      score,
      weight: 0.15,
      description
    };
  };

  // Calcul de confiance avec algorithme avancé
  const calculateConfidence = (factors: FraudFactor[]): number => {
    const weightedSum = factors.reduce((sum, factor) => {
      return sum + factor.value * factor.weight;
    }, 0);
    
    const totalWeight = factors.reduce((sum, factor) => sum + factor.weight, 0);
    const averageConfidence = 1 - (weightedSum / totalWeight);
    
    // Ajuster selon le nombre de facteurs cohérents
    const consistentFactors = factors.filter(f => f.value > 0.5).length;
    const consistencyBonus = consistentFactors * 0.05;
    
    return Math.min(averageConfidence + consistencyBonus, 1);
  };

  // Prédiction du résultat avec Machine Learning
  const predictOutcome = (riskScore: number, factors: FraudFactor[]): 'legitimate' | 'fraudulent' | 'suspicious' => {
    if (riskScore > 0.7) return 'fraudulent';
    if (riskScore > 0.4) return 'suspicious';
    return 'legitimate';
  };

  // Détermination du niveau de risque
  const getRiskLevel = (score: number): 'low' | 'medium' | 'high' | 'critical' => {
    if (score >= 0.8) return 'critical';
    if (score >= 0.6) return 'high';
    if (score >= 0.3) return 'medium';
    return 'low';
  };

  // Détermination du type de fraude
  const determineFraudType = (factors: FraudFactor[]): FraudDetection['type'] => {
    const categoryScores: Record<string, number> = {};
    
    factors.forEach(factor => {
      if (!categoryScores[factor.category]) {
        categoryScores[factor.category] = 0;
      }
      categoryScores[factor.category] += factor.value * factor.weight;
    });

    const maxCategory = Object.keys(categoryScores).reduce((a, b) => 
      categoryScores[a] > categoryScores[b] ? a : b
    );

    switch (maxCategory) {
      case 'velocity': return 'transaction';
      case 'location': return 'network';
      case 'behavior': return 'behavior';
      case 'network': return 'network';
      case 'device': return 'account';
      default: return 'transaction';
    }
  };

  // Simulation de détection en temps réel
  const simulateRealTimeDetection = () => {
    setIsScanning(true);
    
    const interval = setInterval(() => {
      const mockTransaction = {
        userId: `user_${Math.random().toString(36).substr(2, 9)}`,
        amount: Math.random() * 1000,
        country: ['FR', 'CI', 'US', 'CA', 'GB', 'DE', 'KP', 'IR'][Math.floor(Math.random() * 8)],
        deviceId: `device_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now()
      };

      const detection = predictiveFraudDetection(mockTransaction);
      setDetections(prev => [detection, ...prev.slice(0, 19)]); // Garder 20 dernières

      // Mettre à jour les métriques
      setRealTimeMetrics(prev => ({
        ...prev,
        fraudRate: Math.max(0.001, prev.fraudRate + (detection.predictedOutcome === 'fraudulent' ? 0.001 : -0.0005)),
        detectionAccuracy: Math.min(99.9, prev.detectionAccuracy + (Math.random() - 0.5) * 0.1),
        falsePositiveRate: Math.max(0.1, prev.falsePositiveRate + (Math.random() - 0.5) * 0.05),
        averageResponseTime: Math.max(0.05, prev.averageResponseTime + (Math.random() - 0.5) * 0.01),
        blockedTransactions: prev.blockedTransactions + (detection.riskLevel === 'high' || detection.riskLevel === 'critical' ? 1 : 0),
        legitimateTransactions: prev.legitimateTransactions + (detection.predictedOutcome === 'legitimate' ? 1 : 0)
      }));

    }, 2000); // Nouvelle détection toutes les 2 secondes

    setTimeout(() => {
      clearInterval(interval);
      setIsScanning(false);
    }, 30000); // Scanner pendant 30 secondes
  };

  // Composant de facteur de risque
  const RiskFactor = ({ factor }: { factor: FraudFactor }) => {
    const getCategoryColor = (category: string) => {
      switch (category) {
        case 'velocity': return 'bg-red-500';
        case 'location': return 'bg-blue-500';
        case 'behavior': return 'bg-purple-500';
        case 'network': return 'bg-green-500';
        case 'device': return 'bg-orange-500';
        default: return 'bg-gray-500';
      }
    };

    return (
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${getCategoryColor(factor.category)}`} />
            <span className="font-medium text-gray-800">{factor.name}</span>
          </div>
          <span className="text-sm font-bold text-gray-600">{Math.round(factor.value * 100)}%</span>
        </div>
        <p className="text-sm text-gray-600 mb-3">{factor.description}</p>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              factor.value > 0.7 ? 'bg-red-500' : factor.value > 0.4 ? 'bg-yellow-500' : 'bg-green-500'
            }`}
            style={{ width: `${factor.value * 100}%` }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <Shield className="w-12 h-12 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-800">Moteur de Détection de Fraude IA</h1>
            <Brain className="w-12 h-12 text-purple-600" />
          </div>
          <p className="text-lg text-gray-600">Prédiction préventive des fraudes avec IA avancée</p>
        </div>

        {/* Métriques en temps réel */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Taux de Fraude</h3>
              <TrendingUp className="w-6 h-6 text-red-500" />
            </div>
            <div className="text-3xl font-bold text-red-600 mb-2">
              {(realTimeMetrics.fraudRate * 100).toFixed(3)}%
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-red-500 h-2 rounded-full" style={{ width: `${realTimeMetrics.fraudRate * 100}%` }} />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Précision IA</h3>
              <Activity className="w-6 h-6 text-green-500" />
            </div>
            <div className="text-3xl font-bold text-green-600 mb-2">
              {realTimeMetrics.detectionAccuracy.toFixed(1)}%
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full" style={{ width: `${realTimeMetrics.detectionAccuracy}%` }} />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Temps de Réponse</h3>
              <Zap className="w-6 h-6 text-blue-500" />
            </div>
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {realTimeMetrics.averageResponseTime.toFixed(2)}s
            </div>
            <div className="text-sm text-gray-600">Ultra-rapide</div>
          </div>
        </div>

        {/* Contrôles */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={simulateRealTimeDetection}
                disabled={isScanning}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  isScanning
                    ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                <Eye className="w-5 h-5 inline mr-2" />
                {isScanning ? 'Analyse en cours...' : 'Démarrer l\'Analyse'}
              </button>

              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Mode:</label>
                <select
                  value={predictionMode}
                  onChange={(e) => setPredictionMode(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="predictive">🧠 Prédictif</option>
                  <option value="realtime">⚡ Temps Réel</option>
                  <option value="adaptive">🔄 Adaptatif</option>
                </select>
              </div>
            </div>

            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              {showAdvanced ? 'Masquer' : 'Afficher'} Détail Avancé
            </button>
          </div>

          {/* Statistiques détaillées */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{realTimeMetrics.blockedTransactions}</div>
              <div className="text-sm text-gray-600">Transactions Bloquées</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{realTimeMetrics.legitimateTransactions}</div>
              <div className="text-sm text-gray-600">Transactions Légitimes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{(realTimeMetrics.falsePositiveRate * 100).toFixed(1)}%</div>
              <div className="text-sm text-gray-600">Faux Positifs</div>
            </div>
          </div>
        </div>

        {/* Détections en temps réel */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Liste des détections */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-800">Détections Récentes</h3>
              <Bell className="w-6 h-6 text-blue-500" />
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              {detections.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Aucune détection pour le moment</p>
                  <p className="text-sm">Cliquez sur "Démarrer l\'Analyse"</p>
                </div>
              ) : (
                detections.map((detection) => (
                  <div
                    key={detection.id}
                    onClick={() => setSelectedDetection(detection)}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${
                          detection.riskLevel === 'critical' ? 'bg-red-500' :
                          detection.riskLevel === 'high' ? 'bg-orange-500' :
                          detection.riskLevel === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                        }`} />
                        <span className="font-medium text-gray-800 capitalize">{detection.riskLevel}</span>
                      </div>
                      <span className="text-sm text-gray-600">
                        {detection.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-600 mb-2">
                      {detection.type} - {detection.predictedOutcome}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">User: {detection.userId}</span>
                      <span className="text-xs font-medium text-blue-600">
                        {Math.round(detection.confidence * 100)}% confiance
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Détails de la détection sélectionnée */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-800">Analyse Détaillée</h3>
              <Lock className="w-6 h-6 text-purple-500" />
            </div>

            {selectedDetection ? (
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium text-gray-800">ID Détection:</span>
                    <span className="text-sm font-mono text-gray-600">{selectedDetection.id}</span>
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium text-gray-800">Utilisateur:</span>
                    <span className="text-sm text-gray-600">{selectedDetection.userId}</span>
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium text-gray-800">Type:</span>
                    <span className="text-sm text-gray-600 capitalize">{selectedDetection.type}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-800">Prédiction:</span>
                    <span className={`text-sm font-medium capitalize ${
                      selectedDetection.predictedOutcome === 'fraudulent' ? 'text-red-600' :
                      selectedDetection.predictedOutcome === 'suspicious' ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      {selectedDetection.predictedOutcome}
                    </span>
                  </div>
                </div>

                {showAdvanced && (
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-3">Facteurs de Risque</h4>
                    <div className="space-y-3">
                      {selectedDetection.factors.map((factor, index) => (
                        <RiskFactor key={index} factor={factor} />
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 mb-2">Actions Recommandées</h4>
                  <div className="space-y-2">
                    {selectedDetection.riskLevel === 'critical' && (
                      <button className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors">
                        🚫 Bloquer la Transaction Immédiatement
                      </button>
                    )}
                    {selectedDetection.riskLevel === 'high' && (
                      <button className="w-full bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700 transition-colors">
                        ⚠️ Demander Vérification Supplémentaire
                      </button>
                    )}
                    {selectedDetection.riskLevel === 'medium' && (
                      <button className="w-full bg-yellow-600 text-white py-2 px-4 rounded-lg hover:bg-yellow-700 transition-colors">
                        🔍 Marquer pour Surveillance
                      </button>
                    )}
                    <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                      📊 Ajouter aux Données d'Entraînement
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Unlock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Sélectionnez une détection pour voir l\'analyse détaillée</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}