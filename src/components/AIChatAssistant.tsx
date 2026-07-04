import React, { useState, useEffect, useRef } from 'react';
import { Brain, MessageCircle, Send, Mic, MicOff, Volume2, VolumeX, Sparkles, TrendingUp, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  intent?: string;
  confidence?: number;
  suggestedActions?: string[];
}

interface AIInsight {
  type: 'opportunity' | 'risk' | 'trend';
  message: string;
  action: string;
  confidence: number;
}

export default function AIChatAssistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([]);
  const [predictiveSuggestions, setPredictiveSuggestions] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Simuler l'IA avancée avec analyse prédictive
  const analyzeIntent = (text: string) => {
    const intents = [
      { pattern: /prix|coût|tarif/i, intent: 'pricing', confidence: 0.9 },
      { pattern: /livraison|délai|expédition/i, intent: 'shipping', confidence: 0.95 },
      { pattern: /qualité|authenticité|vérification/i, intent: 'quality', confidence: 0.88 },
      { pattern: /retour|remboursement|échange/i, intent: 'returns', confidence: 0.92 },
      { pattern: /disponible|stock|rupture/i, intent: 'availability', confidence: 0.87 },
      { pattern: /mango|fruit|bio|naturel/i, intent: 'product_info', confidence: 0.85 },
      { pattern: /aide|support|assistance/i, intent: 'support', confidence: 0.93 }
    ];

    for (const { pattern, intent, confidence } of intents) {
      if (pattern.test(text)) {
        return { intent, confidence };
      }
    }
    return { intent: 'general', confidence: 0.5 };
  };

  // Générer des insights prédictifs
  const generatePredictiveInsights = (userMessage: string, intent: string) => {
    const insights: AIInsight[] = [];
    
    if (intent === 'pricing') {
      insights.push({
        type: 'opportunity',
        message: 'Le client montre de l\'intérêt pour les prix - suggérer des remises groupées',
        action: 'Proposer un pack de 5 mangues avec 15% de réduction',
        confidence: 0.89
      });
      insights.push({
        type: 'trend',
        message: 'Augmentation des demandes de prix sur les produits bio',
        action: 'Ajuster les prix compétitifs',
        confidence: 0.76
      });
    }
    
    if (intent === 'shipping') {
      insights.push({
        type: 'risk',
        message: 'Problème potentiel de livraison - client impatient',
        action: 'Offrir la livraison express gratuite',
        confidence: 0.82
      });
    }

    if (intent === 'quality') {
      insights.push({
        type: 'opportunity',
        message: 'Client soucieux de la qualité - parfait pour certification bio',
        action: 'Montrer les certifications et avis clients',
        confidence: 0.91
      });
    }

    setAiInsights(prev => [...prev.slice(-2), ...insights]);
  };

  // Suggestions prédictives basées sur le contexte
  const generatePredictiveSuggestions = (intent: string, userMessage: string) => {
    const suggestions: string[] = [];
    
    const suggestionMap: Record<string, string[]> = {
      'pricing': ['Quels sont vos tarifs groupés?', 'Avez-vous des remises?', 'Puis-je avoir un devis personnalisé?'],
      'shipping': ['Quels sont les délais de livraison?', 'Livrez-vous à l\'international?', 'Puis-je suivre ma commande?'],
      'quality': ['Produits bio certifiés?', 'Contrôle qualité?', 'Garantie satisfait ou remboursé?'],
      'returns': ['Procédure de retour?', 'Délai de remboursement?', 'Conditions d\'échange?'],
      'availability': ['Produits en stock?', 'Réapprovisionnement?', 'Disponibilité saisonnière?']
    };

    const intentSuggestions = suggestionMap[intent] || [];
    suggestions.push(...intentSuggestions.slice(0, 2));
    
    // Ajouter des suggestions contextuelles intelligentes
    if (userMessage.length > 10) {
      suggestions.push('Puis-je vous aider avec autre chose?');
      suggestions.push('Souhaitez-vous voir nos produits populaires?');
    }

    setPredictiveSuggestions(suggestions);
  };

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: text.trim(),
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    // Analyser l'intention et générer des insights
    const { intent, confidence } = analyzeIntent(text);
    generatePredictiveInsights(text, intent);
    generatePredictiveSuggestions(intent, text);

    // Simuler la réponse de l'IA avec délai réaliste
    setTimeout(() => {
      const aiResponse = generateAIResponse(text, intent, confidence);
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponse.text,
        sender: 'ai',
        timestamp: new Date(),
        intent,
        confidence,
        suggestedActions: aiResponse.suggestedActions
      };

      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);

      // Jouer un son de notification si activé
      if (soundEnabled) {
        playNotificationSound();
      }

      // Afficher des insights en temps réel
      if (aiInsights.length > 0) {
        toast.success('💡 Nouvelles insights disponibles!');
      }
    }, 1000 + Math.random() * 1500);
  };

  const generateAIResponse = (userText: string, intent: string, confidence: number) => {
    const responses: Record<string, { text: string; suggestedActions: string[] }> = {
      pricing: {
        text: 'Je comprends votre intérêt pour nos prix! Nos mangues bio sont à 5€/kg avec des remises intéressantes pour les commandes groupées. Puis-je vous proposer un pack découverte?',
        suggestedActions: ['Voir les packs', 'Demander un devis', 'Comparer les prix']
      },
      shipping: {
        text: 'Nos livraisons sont ultra-rapides! Livraison express 24h en France métropolitaine. Pour l\'international, nous livrons dans toute l\'Europe en 48-72h.',
        suggestedActions: ['Calculer frais de port', 'Suivre commande', 'Options express']
      },
      quality: {
        text: 'Excellente question! Tous nos produits sont bio certifiés par Ecocert. Nous avons un taux de satisfaction client de 98%. Chaque produit est inspecté avant expédition.',
        suggestedActions: ['Voir certifications', 'Lire avis clients', 'Garantie qualité']
      },
      returns: {
        text: 'Pas de souci! Nous avons une politique de retour très flexible: 30 jours pour changer d\'avis, remboursement sous 48h, retour gratuit.',
        suggestedActions: ['Procédure retour', 'Conditions', 'Contact support']
      },
      availability: {
        text: 'Nos mangues sont saisonnières et nous réapprovisionnons chaque semaine. Actuellement, nous avons du stock mais je peux vous mettre sur liste d\'attente si besoin.',
        suggestedActions: ['Réserver', 'Alerte réappro', 'Produits similaires']
      },
      product_info: {
        text: 'Nos mangues viennent directement de Côte d\'Ivoire, récoltées à maturité par nos partenaires agriculteurs. Elles sont riches en vitamines et ont un goût exceptionnel!',
        suggestedActions: ['Voir origine', 'Valeurs nutritives', 'Recettes']
      },
      support: {
        text: 'Je suis là pour vous aider! Que puis-je faire pour vous aujourd\'hui? Notre équipe de support est disponible 24/7.',
        suggestedActions: ['FAQ', 'Contact support', 'Guide d\'achat']
      }
    };

    const defaultResponse = {
      text: 'Je comprends votre demande. Pour mieux vous aider, pourriez-vous me donner plus de détails sur ce que vous recherchez exactement?',
      suggestedActions: ['Plus d\'infos', 'Voir catalogue', 'Contacter un conseiller']
    };

    return responses[intent] || defaultResponse;
  };

  const playNotificationSound = () => {
    // Créer un son de notification doux
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  };

  const toggleVoiceRecognition = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast.error('La reconnaissance vocale n\'est pas supportée par votre navigateur');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.lang = 'fr-FR';
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result: any) => result.transcript)
          .join('');
        
        setInputText(transcript);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => {
        toast.error('Erreur de reconnaissance vocale');
        setIsListening(false);
      };

      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleSuggestedAction = (action: string) => {
    sendMessage(action);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Message de bienvenue intelligent
    const welcomeMessage: Message = {
      id: 'welcome',
      text: 'Bonjour! 👋 Je suis votre assistant IA intelligent. Je peux analyser vos besoins avant même que vous ne les exprimiez! Essayez de me poser une question sur nos produits.',
      sender: 'ai',
      timestamp: new Date(),
      suggestedActions: ['Prix des mangues', 'Délai de livraison', 'Qualité des produits']
    };
    setMessages([welcomeMessage]);
  }, []);

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Header avec insights en temps réel */}
      <div className="bg-white shadow-lg border-b border-purple-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Brain className="w-8 h-8 text-purple-600 animate-pulse" />
                <Sparkles className="w-4 h-4 text-yellow-500 absolute -top-1 -right-1 animate-bounce" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">Assistant IA Intelligent</h2>
                <p className="text-sm text-gray-500">Analyse prédictive en temps réel</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`p-2 rounded-lg transition-colors ${
                  soundEnabled ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-400'
                }`}
              >
                {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Insights prédictifs */}
          {aiInsights.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
              {aiInsights.slice(-3).map((insight, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border-l-4 ${
                    insight.type === 'opportunity'
                      ? 'bg-green-50 border-green-400'
                      : insight.type === 'risk'
                      ? 'bg-red-50 border-red-400'
                      : 'bg-blue-50 border-blue-400'
                  }`}
                >
                  <div className="flex items-start space-x-2">
                    {insight.type === 'opportunity' && <TrendingUp className="w-4 h-4 text-green-600 mt-0.5" />}
                    {insight.type === 'risk' && <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5" />}
                    {insight.type === 'trend' && <Brain className="w-4 h-4 text-blue-600 mt-0.5" />}
                    <div className="flex-1">
                      <p className="text-xs font-medium text-gray-700">{insight.message}</p>
                      <p className="text-xs text-gray-500 mt-1">{insight.action}</p>
                      <div className="mt-1">
                        <div className="w-full bg-gray-200 rounded-full h-1">
                          <div
                            className={`h-1 rounded-full ${
                              insight.type === 'opportunity'
                                ? 'bg-green-500'
                                : insight.type === 'risk'
                                ? 'bg-red-500'
                                : 'bg-blue-500'
                            }`}
                            style={{ width: `${insight.confidence * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Zone de messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.sender === 'user'
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-gray-800 shadow-md border border-gray-200'
              }`}
            >
              <p className="text-sm">{message.text}</p>
              {message.intent && (
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs opacity-75">
                    Intent: {message.intent} ({Math.round(message.confidence! * 100)}%)
                  </span>
                </div>
              )}
              
              {/* Actions suggérées */}
              {message.suggestedActions && message.suggestedActions.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {message.suggestedActions.map((action, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestedAction(action)}
                      className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs hover:bg-purple-200 transition-colors"
                    >
                      {action}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white text-gray-800 px-4 py-2 rounded-lg shadow-md border border-gray-200">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions prédictives */}
      {predictiveSuggestions.length > 0 && (
        <div className="px-6 py-3 bg-white border-t border-gray-200">
          <p className="text-xs text-gray-500 mb-2">Suggestions intelligentes:</p>
          <div className="flex flex-wrap gap-2">
            {predictiveSuggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => sendMessage(suggestion)}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs hover:bg-gray-200 transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Zone de saisie */}
      <div className="bg-white border-t border-gray-200 px-6 py-4">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage(inputText)}
              placeholder="Posez votre question... L'IA analyse vos besoins en temps réel"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={toggleVoiceRecognition}
            className={`p-3 rounded-lg transition-colors ${
              isListening
                ? 'bg-red-500 text-white animate-pulse'
                : 'bg-purple-600 text-white hover:bg-purple-700'
            }`}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
          <button
            onClick={() => sendMessage(inputText)}
            disabled={!inputText.trim()}
            className="p-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
