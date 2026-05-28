import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Pause, ShoppingCart, Heart, MessageCircle, Share2, Settings, 
  Users, Eye, Star, Timer, TrendingUp, Gift, X, Send, Smile,
  Volume2, VolumeX, Maximize2, Minimize2, Camera, CameraOff,
  Mic, MicOff, PhoneOff, Film, Sparkles, Crown, Zap, Headphones
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  description: string;
  stock: number;
  rating: number;
  category: string;
  isLive?: boolean;
  discount?: number;
}

interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  message: string;
  timestamp: Date;
  avatar?: string;
  isHost?: boolean;
  isModerator?: boolean;
}

interface Reaction {
  id: string;
  type: 'heart' | 'star' | 'fire' | 'celebration' | 'love' | 'wow';
  x: number;
  y: number;
  userId: string;
}

interface Viewer {
  id: string;
  name: string;
  avatar?: string;
  isHost?: boolean;
  joinedAt: Date;
}

interface LiveShoppingManagerProps {
  mode: 'host' | 'viewer';
  roomId: string;
  userId: string;
  userName: string;
  onEndStream?: () => void;
  embedded?: boolean;
  className?: string;
}

const LiveShoppingManager: React.FC<LiveShoppingManagerProps> = ({
  mode,
  roomId,
  userId,
  userName,
  onEndStream,
  embedded,
  className
}) => {
  const [isLive, setIsLive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [viewers, setViewers] = useState<number>(Math.floor(Math.random() * 50) + 10);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showProductPanel, setShowProductPanel] = useState(false);
  const [showChat, setShowChat] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [streamDuration, setStreamDuration] = useState(0);
  const [totalSales, setTotalSales] = useState(Math.floor(Math.random() * 1000) + 500);
  const [currentProductSales, setCurrentProductSales] = useState(0);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const streamIntervalRef = useRef<NodeJS.Timeout>();
  const reactionIntervalRef = useRef<NodeJS.Timeout>();
  const audioContextRef = useRef<AudioContext | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const localAudioAnalyserRef = useRef<AnalyserNode | null>(null);
  const remoteAudioAnalyserRef = useRef<AnalyserNode | null>(null);
  const [localAudioLevel, setLocalAudioLevel] = useState(0);
  const [remoteAudioLevel, setRemoteAudioLevel] = useState(0);
  const [isAudioConnected, setIsAudioConnected] = useState(false);

  // Produit de démonstration avec design MangooTech
  const demoProducts: Product[] = [
    {
      id: '1',
      name: 'Robe Wax Ankara Premium',
      price: 45000,
      originalPrice: 65000,
      image: '/demo-products/robe-wax.svg',
      description: 'Robe traditionnelle en wax Ankara avec motifs africains authentiques. Tissu premium, coupe élégante.',
      stock: 15,
      rating: 4.8,
      category: 'Mode Femme',
      isLive: true,
      discount: 31
    },
    {
      id: '2',
      name: 'Collier Perles Traditionnelles',
      price: 25000,
      originalPrice: 35000,
      image: '/demo-products/collier-perles.svg',
      description: 'Collier artisanal en perles traditionnelles africaines. Chaque pièce est unique et raconte une histoire.',
      stock: 8,
      rating: 4.9,
      category: 'Bijoux',
      discount: 29
    },
    {
      id: '3',
      name: 'Tissu Wax Mangoo Collection',
      price: 18000,
      originalPrice: 25000,
      image: '/demo-products/tissu-wax.svg',
      description: 'Tissu wax premium de la collection Mangoo. Qualité exceptionnelle, motifs exclusifs.',
      stock: 25,
      rating: 4.7,
      category: 'Tissus',
      discount: 28
    }
  ];

  // Générer des viewers simulés avec design MangooTech
  const generateViewers = (): Viewer[] => {
    const names = [
      'Aminata_D', 'Ousmane_23', 'Fatou_Style', 'Mamadou_B', 'Awa_Design',
      'Ibrahima_F', 'Mariam_K', 'Abdoulaye_S', 'Kadiatou_A', 'Demba_D'
    ];
    
    return names.slice(0, viewers).map((name, index) => ({
      id: `viewer_${index}`,
      name,
      avatar: `https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=African%20avatar%20icon%20with%20traditional%20colors%20${index % 2 ? 'male' : 'female'}%20silhouette%2C%20mango%20orange%20and%20gold%20gradient%2C%20modern%20minimalist%20design%2C%20circular%20icon%2C%20professional%20style&image_size=square`,
      isHost: index === 0 && mode === 'host',
      joinedAt: new Date(Date.now() - Math.random() * 3600000)
    }));
  };

  // Créer un flux vidéo simulé avec animation MangooTech
  const createSimulatedVideoStream = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 1280;
    canvas.height = 720;

    let frame = 0;
    const animate = () => {
      // Fond dégradé MangooTech
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, '#FF8C42'); // Mango orange
      gradient.addColorStop(0.5, '#FFD700'); // Gold
      gradient.addColorStop(1, '#D2691E'); // Terracotta
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Motifs africains animés
      ctx.save();
      ctx.globalAlpha = 0.1;
      
      // Cercles concentriques (tribal pattern)
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.arc(
          canvas.width / 2 + Math.sin(frame * 0.01 + i) * 100,
          canvas.height / 2 + Math.cos(frame * 0.01 + i) * 100,
          50 + i * 30 + Math.sin(frame * 0.02) * 10,
          0,
          Math.PI * 2
        );
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 3;
        ctx.stroke();
      }
      
      // Lignes géométriques
      for (let i = 0; i < 8; i++) {
        ctx.beginPath();
        ctx.moveTo(0, canvas.height * i / 8);
        ctx.lineTo(canvas.width, canvas.height * i / 8 + Math.sin(frame * 0.03 + i) * 20);
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      
      ctx.restore();

      // Logo MangooTech animé
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(frame * 0.005);
      
      // Forme de mangue stylisée
      ctx.beginPath();
      ctx.ellipse(0, 0, 80, 120, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.fill();
      
      // Texte MangooTech
      ctx.fillStyle = '#FF8C42';
      ctx.font = 'bold 48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('MangooTech', 0, 20);
      
      ctx.fillStyle = '#D2691E';
      ctx.font = '24px Arial';
      ctx.fillText('Live Shopping', 0, 60);
      
      ctx.restore();

      // Indicateur LIVE
      if (isLive) {
        ctx.fillStyle = '#FF0000';
        ctx.beginPath();
        ctx.arc(100, 100, 20, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 36px Arial';
        ctx.fillText('LIVE', 140, 110);
      }

      frame++;
      requestAnimationFrame(animate);
    };

    animate();

    // Créer le MediaStream depuis le canvas
    const stream = canvas.captureStream(30);
    
    // Ajouter un audio track simulé
    const audioContext = new AudioContext();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
    gainNode.gain.setValueAtTime(0.001, audioContext.currentTime);
    
    const audioStream = audioContext.createMediaStreamDestination();
    oscillator.connect(audioStream);
    oscillator.start();
    
    const audioTrack = audioStream.stream.getAudioTracks()[0];
    if (audioTrack) {
      stream.addTrack(audioTrack);
    }

    return stream;
  };

  // Effet pour initialiser le flux vidéo
  useEffect(() => {
    if (mode === 'host') {
      const stream = createSimulatedVideoStream();
      if (videoRef.current && stream) {
        videoRef.current.srcObject = stream;
      }
    }
  }, [mode, isLive]);

  // PAS d'initialisation automatique - comme VoIPFinalTest, attendre le clic utilisateur

  // Effet pour le compteur de durée
  useEffect(() => {
    if (isLive && !isPaused) {
      streamIntervalRef.current = setInterval(() => {
        setStreamDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (streamIntervalRef.current) {
        clearInterval(streamIntervalRef.current);
      }
    }

    return () => {
      if (streamIntervalRef.current) {
        clearInterval(streamIntervalRef.current);
      }
    };
  }, [isLive, isPaused]);

  // Effet pour les réactions automatiques
  useEffect(() => {
    if (isLive && !isPaused) {
      reactionIntervalRef.current = setInterval(() => {
        if (Math.random() > 0.7) {
          addRandomReaction();
        }
      }, 2000);
    } else {
      if (reactionIntervalRef.current) {
        clearInterval(reactionIntervalRef.current);
      }
    }

    return () => {
      if (reactionIntervalRef.current) {
        clearInterval(reactionIntervalRef.current);
      }
    };
  }, [isLive, isPaused]);

  // Effet pour simuler l'arrivée de viewers
  useEffect(() => {
    if (isLive) {
      const viewerInterval = setInterval(() => {
        setViewers(prev => {
          const change = Math.floor(Math.random() * 5) - 2;
          return Math.max(1, prev + change);
        });
      }, 5000);

      return () => clearInterval(viewerInterval);
    }
  }, [isLive]);

  // Scroll automatique du chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Nettoyage audio à la fin
  useEffect(() => {
    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (remoteAudioRef.current && remoteAudioRef.current.parentNode) {
        remoteAudioRef.current.parentNode.removeChild(remoteAudioRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Ajouter une réaction aléatoire
  const addRandomReaction = () => {
    const types: Reaction['type'][] = ['heart', 'star', 'fire', 'celebration', 'love', 'wow'];
    const reaction: Reaction = {
      id: Math.random().toString(36).substr(2, 9),
      type: types[Math.floor(Math.random() * types.length)],
      x: Math.random() * 80 + 10,
      y: Math.random() * 60 + 20,
      userId: Math.random().toString(36).substr(2, 9)
    };
    
    setReactions(prev => [...prev, reaction]);
    
    setTimeout(() => {
      setReactions(prev => prev.filter(r => r.id !== reaction.id));
    }, 3000);
  };

  // Envoyer un message
  const sendMessage = () => {
    if (newMessage.trim()) {
      const message: ChatMessage = {
        id: Math.random().toString(36).substr(2, 9),
        userId,
        username: userName,
        message: newMessage,
        timestamp: new Date(),
        isHost: mode === 'host'
      };
      
      setChatMessages(prev => [...prev, message]);
      setNewMessage('');
    }
  };

  // Démarrer/arrêter le live
  const toggleLive = () => {
    setIsLive(!isLive);
    if (!isLive) {
      setStreamDuration(0);
    }
  };

  // Mettre en pause/reprendre
  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  // Formater la durée
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Acheter un produit
  const buyProduct = (product: Product) => {
    setCurrentProductSales(prev => prev + 1);
    setTotalSales(prev => prev + product.price);
    
    // Ajouter au panier (simulation)
    const cartItem = {
      id: `${product.id}-${Date.now()}`,
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      image: product.image
    };
    
    // Récupérer le panier existant
    const existingCart = JSON.parse(localStorage.getItem('live_shopping_cart') || '[]');
    const updatedCart = [...existingCart, cartItem];
    localStorage.setItem('live_shopping_cart', JSON.stringify(updatedCart));
    
    // Notification de succès
    alert(`✅ ${product.name} ajouté au panier!\n💰 Prix: ${product.price.toLocaleString()} FCFA`);
    
    // Animation de succès
    addRandomReaction();
    addRandomReaction();
    addRandomReaction();
  };

  // Obtenir l'icône de réaction
  const getReactionIcon = (type: Reaction['type']) => {
    switch (type) {
      case 'heart': return '❤️';
      case 'star': return '⭐';
      case 'fire': return '🔥';
      case 'celebration': return '🎉';
      case 'love': return '💕';
      case 'wow': return '😮';
      default: return '👍';
    }
  };

  // Fonction simplifiée - MÉTHODE DIRECTE QUI MARCHE (comme VoIPFinalTest)
  const forceAudioToOutput = async (audioElement: HTMLAudioElement) => {
    try {
      console.log('🎧 Configuration audio simplifiée...');
      
      // Configuration simple - pas de sélection de périphérique complexe
      audioElement.volume = 1.0;
      audioElement.muted = false;
      audioElement.playsInline = true;
      
      // Laisser le navigateur gérer le routage audio automatiquement
      console.log('✅ Audio configuré - le navigateur gère le routage');
      
    } catch (error) {
      console.error('❌ Erreur configuration audio:', error);
    }
  };

  // FONCTION SIMPLIFIÉE - MÉTHODE DIRECTE VoIPFinalTest
  const startAudioTest = async () => {
    try {
      console.log('🎧 Démarrage test audio (méthode simple)...');
      
      // Étape 1: Obtenir le microphone (comme VoIPFinalTest)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: false,
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          sampleRate: 16000,
          channelCount: 1
        }
      });
      
      localStreamRef.current = stream;
      console.log('✅ Microphone accessible');
      
      // Étape 2: Créer le contexte audio
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;
      
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
        console.log('✅ Contexte audio repris');
      }
      
      // Étape 3: Créer l'élément audio (SIMPLIFIÉ)
      const audioElement = new Audio();
      audioElement.autoplay = true;
      audioElement.muted = false;
      audioElement.volume = 1.0;
      audioElement.playsInline = true;
      
      document.body.appendChild(audioElement);
      remoteAudioRef.current = audioElement;
      
      // Étape 4: SOLUTION MIRACLE - Connexion directe (comme VoIPFinalTest)
      audioElement.srcObject = stream;
      
      // Étape 5: Jouer l'audio - PAS DE CONFIGURATION COMPLEXE
      await audioElement.play();
      console.log('🎧 AUDIO DÉMARRÉ - VOIX DANS LE CASQUE !');
      
      // Étape 6: Analyseurs pour les niveaux (garder pour l'affichage)
      const localSource = audioContext.createMediaStreamSource(stream);
      const localAnalyser = audioContext.createAnalyser();
      localAnalyser.fftSize = 256;
      localSource.connect(localAnalyser);
      localAudioAnalyserRef.current = localAnalyser;
      
      // Analyseur distant (même source pour les niveaux)
      const remoteSource = audioContext.createMediaStreamSource(stream);
      const remoteAnalyser = audioContext.createAnalyser();
      remoteAnalyser.fftSize = 256;
      remoteSource.connect(remoteAnalyser);
      remoteAudioAnalyserRef.current = remoteAnalyser;
      
      // Marquer comme connecté et démarrer surveillance
      setIsAudioConnected(true);
      startAudioLevelMonitoring();
      
      console.log('✅ TEST AUDIO RÉUSSI - VOIX AUDIBLE DANS LE CASQUE !');
      
    } catch (error) {
      console.error('❌ Erreur test audio:', error);
      setIsAudioConnected(false);
    }
  };

  // Test audio simple et direct - MÉTHODE VoIPFinalTest SIMPLIFIÉE
  const testAudioWithVoice = async () => {
    try {
      console.log('🎤 Test audio simple et direct...');
      
      if (!localStreamRef.current || !remoteAudioRef.current) {
        console.error('❌ Flux local ou élément audio non disponible');
        return;
      }
      
      // MÉTHODE EXACTE DE VoIPFinalTest : connexion directe sans complexité
      remoteAudioRef.current.srcObject = localStreamRef.current;
      remoteAudioRef.current.volume = 1.0;
      remoteAudioRef.current.muted = false;
      
      // Jouer immédiatement - pas de configuration complexe
      await remoteAudioRef.current.play();
      
      console.log('✅ Test audio démarré - VOIX DANS LE CASQUE !');
      
      // Continuer le test pendant 5 secondes
      setTimeout(() => {
        if (remoteAudioRef.current) {
          console.log('✅ Test audio terminé');
        }
      }, 5000);
      
    } catch (error) {
      console.error('❌ Erreur test audio:', error);
    }
  };

  // Fonction pour gérer les flux audio distants (quand ils arrivent)
  const handleRemoteStream = (remoteStream: MediaStream) => {
    try {
      console.log('📡 Traitement du flux audio distant...');
      
      if (!audioContextRef.current || !remoteAudioRef.current) {
        console.error('❌ Contexte audio ou élément audio non disponible');
        return;
      }
      
      // Créer une nouvelle source audio pour le flux distant
      const remoteSource = audioContextRef.current.createMediaStreamSource(remoteStream);
      
      // Créer un nouvel analyseur pour le flux distant
      const remoteAnalyser = audioContextRef.current.createAnalyser();
      remoteAnalyser.fftSize = 256;
      
      // Connecter le flux distant à l'analyseur et à l'élément audio
      remoteSource.connect(remoteAnalyser);
      
      // Mettre à jour l'analyseur distant
      remoteAudioAnalyserRef.current = remoteAnalyser;
      
      // Connecter le flux distant à l'élément audio pour la lecture
      remoteAudioRef.current.srcObject = remoteStream;
      
      console.log('✅ Flux distant connecté et prêt pour la lecture');
      
    } catch (error) {
      console.error('❌ Erreur traitement flux distant:', error);
    }
  };

  // Surveillance du niveau audio
  const startAudioLevelMonitoring = () => {
    if (!localAudioAnalyserRef.current || !remoteAudioAnalyserRef.current) return;
    
    const updateAudioLevels = () => {
      // Niveau audio local (microphone)
      if (localAudioAnalyserRef.current) {
        const localDataArray = new Uint8Array(localAudioAnalyserRef.current.frequencyBinCount);
        localAudioAnalyserRef.current.getByteFrequencyData(localDataArray);
        
        const localAverage = localDataArray.reduce((sum, value) => sum + value, 0) / localDataArray.length;
        const localLevel = Math.round((localAverage / 255) * 100);
        
        setLocalAudioLevel(localLevel);
      }
      
      // Niveau audio distant (sortie casque)
      if (remoteAudioAnalyserRef.current) {
        const remoteDataArray = new Uint8Array(remoteAudioAnalyserRef.current.frequencyBinCount);
        remoteAudioAnalyserRef.current.getByteFrequencyData(remoteDataArray);
        
        const remoteAverage = remoteDataArray.reduce((sum, value) => sum + value, 0) / remoteDataArray.length;
        const remoteLevel = Math.round((remoteAverage / 255) * 100);
        
        setRemoteAudioLevel(remoteLevel);
      }
      
      requestAnimationFrame(updateAudioLevels);
    };
    
    updateAudioLevels();
  };

  return (
    <div className={`${embedded ? 'h-full flex flex-col' : 'min-h-screen'} ${embedded ? 'bg-transparent' : 'bg-gradient-to-br from-orange-50 to-amber-50'} ${className || ''}`}>
      {/* En-tête avec design MangooTech */}
      <div className={`bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg ${embedded ? 'p-3' : 'p-4'}`}>
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
              <Film className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <h1 className={`${embedded ? 'text-xl' : 'text-2xl'} font-bold`}>MangooTech Live Shopping</h1>
              <p className="text-orange-100">Vente en direct • Expérience interactive</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="text-center">
              <div className="text-2xl font-bold">{viewers}</div>
              <div className="text-sm text-orange-100">Spectateurs</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{formatDuration(streamDuration)}</div>
              <div className="text-sm text-orange-100">Durée</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{totalSales.toLocaleString()}</div>
              <div className="text-sm text-orange-100">FCFA ventes</div>
            </div>
          </div>
        </div>
      </div>

      <div className={`max-w-7xl mx-auto p-4 ${embedded ? 'flex-1 overflow-y-auto' : ''}`}>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Zone vidéo principale */}
          <div className="lg:col-span-3">
            <div className="relative bg-black rounded-2xl overflow-hidden shadow-2xl">
              {/* Vidéo */}
              <div className="relative aspect-video">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
                <canvas
                  ref={canvasRef}
                  className={`absolute inset-0 w-full h-full ${mode === 'host' ? 'block' : 'hidden'}`}
                />
                
                {/* Overlay de contrôle */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent">
                  {/* Indicateur LIVE */}
                  {isLive && (
                    <div className="absolute top-4 left-4 flex items-center space-x-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                      <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">LIVE</span>
                    </div>
                  )}

                  {/* Indicateurs de niveau audio */}
                  {isLive && (
                    <div className="absolute top-4 right-4 space-y-2">
                      {/* Niveau microphone */}
                      <div className="bg-black bg-opacity-70 rounded-lg p-2">
                        <div className="flex items-center space-x-2 mb-1">
                          <Mic className="w-4 h-4 text-blue-400" />
                          <span className="text-white text-xs">Micro</span>
                        </div>
                        <div className="w-20 bg-gray-700 rounded-full h-1">
                          <div 
                            className="bg-blue-400 h-1 rounded-full transition-all duration-100"
                            style={{ width: `${localAudioLevel}%` }}
                          ></div>
                        </div>
                        <div className="text-xs text-gray-300 mt-1">{localAudioLevel}%</div>
                      </div>
                      
                      {/* Niveau casque */}
                      <div className="bg-black bg-opacity-70 rounded-lg p-2">
                        <div className="flex items-center space-x-2 mb-1">
                          <Volume2 className="w-4 h-4 text-green-400" />
                          <span className="text-white text-xs">Casque</span>
                        </div>
                        <div className="w-20 bg-gray-700 rounded-full h-1">
                          <div 
                            className="bg-green-400 h-1 rounded-full transition-all duration-100"
                            style={{ width: `${remoteAudioLevel}%` }}
                          ></div>
                        </div>
                        <div className="text-xs text-gray-300 mt-1">{remoteAudioLevel}%</div>
                        {!isAudioConnected && (
                          <button 
                            onClick={startAudioTest}
                            className="mt-1 bg-green-500 hover:bg-green-600 text-white text-xs px-2 py-1 rounded"
                          >
                            ▶️ Démarrer Audio
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Boutons de contrôle */}
                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {mode === 'host' && (
                        <>
                          <button
                            onClick={toggleLive}
                            className={`p-3 rounded-full ${isLive ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'} text-white transition-colors`}
                          >
                            {isLive ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                          </button>
                          
                          {isLive && (
                            <button
                              onClick={togglePause}
                              className="p-3 rounded-full bg-orange-500 hover:bg-orange-600 text-white transition-colors"
                            >
                              {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
                            </button>
                          )}
                        </>
                      )}
                      
                      <button
                        onClick={() => setIsMuted(!isMuted)}
                        className="p-3 rounded-full bg-gray-800 hover:bg-gray-700 text-white transition-colors"
                      >
                        {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                      </button>
                      
                      {/* Bouton de test audio */}
                      <button
                        onClick={testAudioWithVoice}
                        className="p-3 rounded-full bg-purple-500 hover:bg-purple-600 text-white transition-colors"
                        title="Tester l'audio du casque"
                      >
                        <Headphones className="w-5 h-5" />
                      </button>
                      
                      <button
                        onClick={() => setIsVideoOff(!isVideoOff)}
                        className="p-3 rounded-full bg-gray-800 hover:bg-gray-700 text-white transition-colors"
                      >
                        {isVideoOff ? <CameraOff className="w-5 h-5" /> : <Camera className="w-5 h-5" />}
                      </button>
                      
                      <button
                        onClick={() => setIsFullscreen(!isFullscreen)}
                        className="p-3 rounded-full bg-gray-800 hover:bg-gray-700 text-white transition-colors"
                      >
                        {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                      </button>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setShowProductPanel(!showProductPanel)}
                        className="p-3 rounded-full bg-orange-500 hover:bg-orange-600 text-white transition-colors"
                      >
                        <ShoppingCart className="w-5 h-5" />
                      </button>
                      
                      <button
                        onClick={() => setShowChat(!showChat)}
                        className="p-3 rounded-full bg-blue-500 hover:bg-blue-600 text-white transition-colors"
                      >
                        <MessageCircle className="w-5 h-5" />
                      </button>
                      
                      <button
                        onClick={() => setShowSettings(!showSettings)}
                        className="p-3 rounded-full bg-gray-800 hover:bg-gray-700 text-white transition-colors"
                      >
                        <Settings className="w-5 h-5" />
                      </button>
                      
                      {onEndStream && (
                        <button
                          onClick={onEndStream}
                          className="p-3 rounded-full bg-red-500 hover:bg-red-600 text-white transition-colors"
                        >
                          <PhoneOff className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Réactions flottantes */}
                {reactions.map(reaction => (
                  <div
                    key={reaction.id}
                    className="absolute text-4xl animate-bounce pointer-events-none"
                    style={{
                      left: `${reaction.x}%`,
                      top: `${reaction.y}%`,
                      animation: 'float 3s ease-out forwards'
                    }}
                  >
                    {getReactionIcon(reaction.type)}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Produits en vedette */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800 flex items-center">
                  <Sparkles className="w-6 h-6 text-orange-500 mr-2" />
                  Produits en Vedette
                </h3>
                <button
                  onClick={() => setShowProductPanel(true)}
                  className="text-orange-500 hover:text-orange-600 font-medium"
                >
                  Voir tout
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {demoProducts.slice(0, 3).map(product => (
                  <div key={product.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                    <div className="relative">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-48 object-cover"
                      />
                      {product.discount && (
                        <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-full text-sm font-bold">
                          -{product.discount}%
                        </div>
                      )}
                      {product.isLive && (
                        <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold animate-pulse">
                          LIVE
                        </div>
                      )}
                    </div>
                    
                    <div className="p-4">
                      <h4 className="font-bold text-gray-800 mb-2">{product.name}</h4>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>
                      
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <div className="text-xl font-bold text-orange-500">
                            {product.price.toLocaleString()} FCFA
                          </div>
                          {product.originalPrice && (
                            <div className="text-sm text-gray-500 line-through">
                              {product.originalPrice.toLocaleString()} FCFA
                            </div>
                          )}
                        </div>
                        <div className="flex items-center">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span className="text-sm text-gray-600 ml-1">{product.rating}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Stock: {product.stock}</span>
                        <button
                          onClick={() => buyProduct(product)}
                          className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-4 py-2 rounded-lg hover:from-orange-600 hover:to-amber-600 transition-colors flex items-center space-x-2"
                        >
                          <ShoppingCart className="w-4 h-4" />
                          <span>Acheter</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Panel latéral - Chat et viewers */}
          <div className="space-y-6">
            {/* Chat */}
            {showChat && (
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="font-bold text-gray-800 flex items-center">
                    <MessageCircle className="w-5 h-5 text-blue-500 mr-2" />
                    Chat en Direct
                  </h3>
                </div>
                
                <div className="h-96 overflow-y-auto p-4 space-y-3">
                  {chatMessages.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>Aucun message encore</p>
                      <p className="text-sm">Soyez le premier à discuter!</p>
                    </div>
                  ) : (
                    chatMessages.map(message => (
                      <div key={message.id} className={`flex ${message.isHost ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs px-4 py-2 rounded-lg ${message.isHost ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-800'}`}>
                          <div className="font-semibold text-sm">{message.username}</div>
                          <div>{message.message}</div>
                          <div className="text-xs opacity-70 mt-1">
                            {message.timestamp.toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={chatEndRef} />
                </div>
                
                <div className="p-4 border-t border-gray-200">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      placeholder="Écrire un message..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    <button
                      onClick={sendMessage}
                      className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Viewers */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-bold text-gray-800 flex items-center">
                  <Users className="w-5 h-5 text-green-500 mr-2" />
                  Spectateurs ({viewers})
                </h3>
              </div>
              
              <div className="h-64 overflow-y-auto p-4 space-y-3">
                {generateViewers().map(viewer => (
                  <div key={viewer.id} className="flex items-center space-x-3">
                    <img
                      src={viewer.avatar}
                      alt={viewer.name}
                      className="w-8 h-8 rounded-full"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-800 flex items-center">
                        {viewer.name}
                        {viewer.isHost && (
                          <Crown className="w-4 h-4 text-orange-500 ml-1" />
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        En ligne depuis {Math.floor((Date.now() - viewer.joinedAt.getTime()) / 60000)} min
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Statistiques */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-bold text-gray-800 flex items-center">
                  <TrendingUp className="w-5 h-5 text-green-500 mr-2" />
                  Statistiques
                </h3>
              </div>
              
              <div className="p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Vues produits</span>
                  <span className="font-bold text-orange-500">{Math.floor(viewers * 2.5)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Ajouts panier</span>
                  <span className="font-bold text-blue-500">{currentProductSales * 3}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Achat immédiat</span>
                  <span className="font-bold text-green-500">{currentProductSales}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Taux conversion</span>
                  <span className="font-bold text-purple-500">{((currentProductSales / (viewers * 2.5)) * 100).toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Panel des produits */}
      {showProductPanel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                <ShoppingCart className="w-6 h-6 text-orange-500 mr-3" />
                Catalogue Produits
              </h2>
              <button
                onClick={() => setShowProductPanel(false)}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {demoProducts.map(product => (
                  <div key={product.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-shadow">
                    <div className="relative mb-4">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      {product.discount && (
                        <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-full text-sm font-bold">
                          -{product.discount}%
                        </div>
                      )}
                    </div>
                    
                    <h3 className="font-bold text-lg text-gray-800 mb-2">{product.name}</h3>
                    <p className="text-gray-600 mb-4">{product.description}</p>
                    
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="text-2xl font-bold text-orange-500">
                          {product.price.toLocaleString()} FCFA
                        </div>
                        {product.originalPrice && (
                          <div className="text-sm text-gray-500 line-through">
                            {product.originalPrice.toLocaleString()} FCFA
                          </div>
                        )}
                      </div>
                      <div className="flex items-center">
                        <Star className="w-5 h-5 text-yellow-400 fill-current" />
                        <span className="text-gray-600 ml-1">{product.rating}</span>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setSelectedProduct(product);
                          buyProduct(product);
                        }}
                        className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 text-white py-3 rounded-lg hover:from-orange-600 hover:to-amber-600 transition-colors flex items-center justify-center space-x-2"
                      >
                        <ShoppingCart className="w-5 h-5" />
                        <span>Acheter Maintenant</span>
                      </button>
                      
                      <button className="p-3 border border-orange-500 text-orange-500 rounded-lg hover:bg-orange-50 transition-colors">
                        <Heart className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Paramètres */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800 flex items-center">
                <Settings className="w-5 h-5 text-gray-500 mr-3" />
                Paramètres
              </h2>
              <button
                onClick={() => setShowSettings(false)}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Notifications</span>
                <button className="w-12 h-6 bg-orange-500 rounded-full relative">
                  <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5" />
                </button>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Chat automatique</span>
                <button className="w-12 h-6 bg-gray-300 rounded-full relative">
                  <div className="w-5 h-5 bg-white rounded-full absolute left-0.5 top-0.5" />
                </button>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Réactions</span>
                <button className="w-12 h-6 bg-orange-500 rounded-full relative">
                  <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5" />
                </button>
              </div>
              
              <div className="pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setChatMessages([]);
                    setReactions([]);
                  }}
                  className="w-full bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition-colors"
                >
                  Effacer l'historique
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <style jsx>{`
        @keyframes float {
          0% {
            transform: translateY(0px) scale(1);
            opacity: 1;
          }
          100% {
            transform: translateY(-100px) scale(1.5);
            opacity: 0;
          }
        }
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default LiveShoppingManager;
