import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Play, Pause, ShoppingCart, Heart, MessageCircle, Share2, Settings, 
  Users, Eye, Star, Timer, TrendingUp, Gift, X, Send, Smile,
  Volume2, VolumeX, Maximize2, Minimize2, Camera, CameraOff,
  Mic, MicOff, PhoneOff, Film, Sparkles, Crown, Zap, Headphones,
  Phone, PhoneIncoming, PhoneOutgoing, PhoneCall, PhoneMissed,
  BarChart3, Target, DollarSign, Activity, Award, Clock
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

interface CallParticipant {
  id: string;
  name: string;
  number: string;
  avatar?: string;
  isConnected: boolean;
  isCalling: boolean;
  isIncoming: boolean;
  stream?: MediaStream;
}

interface LiveShoppingVoIPManagerProps {
  mode: 'host' | 'viewer';
  roomId: string;
  userId: string;
  userName: string;
  sipNumber: string;
  sipPassword: string;
  onEndStream?: () => void;
  onProductSale?: (product: Product, quantity: number) => void;
  onCallStarted?: () => void;
  onCallEnded?: () => void;
}

const LiveShoppingVoIPManager: React.FC<LiveShoppingVoIPManagerProps> = ({
  mode,
  roomId,
  userId,
  userName,
  sipNumber,
  sipPassword,
  onEndStream,
  onProductSale,
  onCallStarted,
  onCallEnded
}) => {
  // État Live Shopping
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
  const [salesHistory, setSalesHistory] = useState<Array<{product: Product, quantity: number, timestamp: Date, total: number}>>([]);
  const [conversionRate, setConversionRate] = useState(0);
  const [averageOrderValue, setAverageOrderValue] = useState(0);
  const [peakSalesTime, setPeakSalesTime] = useState<Date | null>(null);
  const [showSalesDashboard, setShowSalesDashboard] = useState(false);
  const [flashSaleActive, setFlashSaleActive] = useState(false);
  const [flashSaleTimer, setFlashSaleTimer] = useState(0);
  const [callSalesBoost, setCallSalesBoost] = useState(0); // Sales boost during calls
  const [productQuantities, setProductQuantities] = useState<{[key: string]: number}>({});
  const [showCallModal, setShowCallModal] = useState(false);
  
  // État VoIP
  const [isRegistered, setIsRegistered] = useState(false);
  const [isCalling, setIsCalling] = useState(false);
  const [isInCall, setIsInCall] = useState(false);
  const [callParticipant, setCallParticipant] = useState<CallParticipant | null>(null);
  const [callNumber, setCallNumber] = useState('');
  const [incomingCall, setIncomingCall] = useState<string | null>(null);
  const [callStatus, setCallStatus] = useState('Déconnecté');
  
  // Refs
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
  const wsRef = useRef<WebSocket | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  
  // Audio levels
  const [localAudioLevel, setLocalAudioLevel] = useState(0);
  const [remoteAudioLevel, setRemoteAudioLevel] = useState(0);
  const [isAudioConnected, setIsAudioConnected] = useState(false);

  // Produits de démonstration
  const demoProducts: Product[] = [
    {
      id: '1',
      name: 'Robe Wax Ankara Premium',
      price: 45000,
      originalPrice: 65000,
      image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Beautiful%20African%20Ankara%20wax%20print%20dress%20with%20vibrant%20mango%20orange%2C%20gold%2C%20and%20terracotta%20colors%2C%20elegant%20traditional%20pattern%2C%20luxurious%20fabric%2C%20professional%20product%20photography%2C%20studio%20lighting%2C%20isolated%20on%20white%20background&image_size=square_hd',
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
      image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Traditional%20African%20beaded%20necklace%20with%20mango%20orange%2C%20gold%2C%20and%20earth%20tone%20beads%2C%20handcrafted%20jewelry%2C%20cultural%20heritage%20design%2C%20professional%20product%20photography%2C%20elegant%20styling%2C%20isolated%20on%20white%20background&image_size=square_hd',
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
      image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=African%20wax%20print%20fabric%20with%20mango%20inspired%20patterns%2C%20vibrant%20orange%2C%20gold%2C%20and%20terracotta%20colors%2C%20traditional%20geometric%20motifs%2C%20high-quality%20cotton%20fabric%2C%20textured%20surface%2C%20professional%20product%20photography%2C%20folded%20elegantly&image_size=square_hd',
      description: 'Tissu wax premium de la collection Mangoo. Qualité exceptionnelle, motifs exclusifs.',
      stock: 25,
      rating: 4.7,
      category: 'Tissus',
      discount: 28
    }
  ];

  // WebSocket connection for VoIP
  const connectWebSocket = useCallback(() => {
    try {
      const ws = new WebSocket('ws://localhost:3040');
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('VoIP WebSocket connecté');
        setCallStatus('Connecté au serveur');
        
        // Register SIP
        ws.send(JSON.stringify({
          type: 'register',
          userId: mode === 'host' ? `vendor-${sipNumber}` : `client-${sipNumber}`,
          role: mode,
          roomId: roomId
        }));
      };

      ws.onmessage = async (event) => {
        const data = JSON.parse(event.data);
        console.log('Message reçu:', data.type);

        switch (data.type) {
          case 'registered':
            setIsRegistered(true);
            setCallStatus('Enregistré');
            break;

          case 'incoming-call':
            setIncomingCall(data.fromUsername);
            setCallStatus(`Appel entrant de ${data.fromUsername}`);
            break;

          case 'call-accepted':
            setIsInCall(true);
            setCallStatus('Appel en cours');
            setIncomingCall(null);
            break;

          case 'call-ended':
            setIsInCall(false);
            setIsCalling(false);
            setCallParticipant(null);
            setIncomingCall(null);
            setCallStatus('Appel terminé');
            break;

          case 'call-initiated':
            setCallStatus(`Appel vers ${data.targetUsername}...`);
            break;

          case 'call-error':
            setCallStatus(`Erreur: ${data.error}`);
            setIsCalling(false);
            break;
        }
      };

      ws.onclose = () => {
        console.log('VoIP WebSocket déconnecté');
        setIsRegistered(false);
        setCallStatus('Déconnecté');
      };

      ws.onerror = (error) => {
        console.error('VoIP Erreur WebSocket:', error);
        setCallStatus('Erreur de connexion');
      };

    } catch (error) {
      console.error('VoIP Erreur connexion WebSocket:', error);
      setCallStatus('Erreur de connexion');
    }
  }, [mode, roomId, sipNumber]);

  // Initialize WebSocket
  useEffect(() => {
    connectWebSocket();
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connectWebSocket]);

  // Start call from modal
  const startCall = () => {
    if (callNumber.trim()) {
      makeCall(callNumber.trim());
    }
  };

  // Make a call
  const makeCall = async (targetNumber: string) => {
    if (!wsRef.current || !isRegistered || isInCall) return;

    try {
      setIsCalling(true);
      setCallNumber(targetNumber);
      setCallStatus(`Appel de ${sipNumber} vers ${targetNumber}`);

      // Create peer connection
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });
      pcRef.current = pc;

      // Add local stream
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => {
          pc.addTrack(track, localStreamRef.current!);
        });
      }

      // Create offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Send call request
      wsRef.current.send(JSON.stringify({
        type: 'call',
        targetUserId: `client-${targetNumber}`,
        roomId: roomId,
        callId: `call-${Date.now()}`
      }));

      setCallParticipant({
        id: targetNumber,
        name: `Utilisateur ${targetNumber}`,
        number: targetNumber,
        isConnected: false,
        isCalling: true,
        isIncoming: false
      });

    } catch (error) {
      console.error('VoIP Erreur appel:', error);
      setIsCalling(false);
      setCallStatus('Erreur appel');
    }
  };

  // Answer incoming call
  const answerCall = async () => {
    if (!wsRef.current || !incomingCall) return;

    try {
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });
      pcRef.current = pc;

      // Trigger call started event
      if (onCallStarted) {
        onCallStarted();
      }

      // Add local stream
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => {
          pc.addTrack(track, localStreamRef.current!);
        });
      }

      // Send answer
      wsRef.current.send(JSON.stringify({
        type: 'answer',
        callId: incomingCall,
        accept: true
      }));

      setIsInCall(true);
      setCallParticipant({
        id: incomingCall,
        name: `Utilisateur ${incomingCall}`,
        number: incomingCall,
        isConnected: true,
        isCalling: false,
        isIncoming: true
      });

      setIncomingCall(null);
      setCallStatus('Appel accepté');

    } catch (error) {
      console.error('VoIP Erreur réponse appel:', error);
      setCallStatus('Erreur réponse');
    }
  };

  // End call
  const endCall = () => {
    if (!wsRef.current) return;

    wsRef.current.send(JSON.stringify({
      type: 'hangup',
      callId: `call-${Date.now()}`
    }));

    // Trigger call ended event
    if (onCallEnded) {
      onCallEnded();
    }

    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }

    setIsInCall(false);
    setIsCalling(false);
    setCallParticipant(null);
    setIncomingCall(null);
    setCallStatus('Appel terminé');
  };

  // Start audio level monitoring
  const startAudioLevelMonitoring = useCallback(() => {
    if (!localAudioAnalyserRef.current) return;
    
    const updateAudioLevels = () => {
      // Local audio level (microphone)
      if (localAudioAnalyserRef.current) {
        const localDataArray = new Uint8Array(localAudioAnalyserRef.current.frequencyBinCount);
        localAudioAnalyserRef.current.getByteFrequencyData(localDataArray);
        
        const localAverage = localDataArray.reduce((sum, value) => sum + value, 0) / localDataArray.length;
        const localLevel = Math.round((localAverage / 255) * 100);
        
        setLocalAudioLevel(localLevel);
      }
      
      // Remote audio level (call participant)
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
  }, []);

  // Audio initialization (same as working VoIPFinalTest)
  const initializeAudio = useCallback(async () => {
    try {
      console.log('Audio VoIP initialisation...');
      
      // Get microphone stream
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
      console.log('Microphone accessible');
      
      // Create audio context
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;
      
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
        console.log('Contexte audio repris');
      }
      
      // Create audio element for remote audio
      const audioElement = new Audio();
      audioElement.autoplay = true;
      audioElement.muted = false;
      audioElement.volume = 1.0;
      audioElement.playsInline = true;
      
      document.body.appendChild(audioElement);
      remoteAudioRef.current = audioElement;
      
      // Connect local stream to audio element (for monitoring)
      audioElement.srcObject = stream;
      await audioElement.play();
      
      // Create audio analysers
      const localSource = audioContext.createMediaStreamSource(stream);
      const localAnalyser = audioContext.createAnalyser();
      localAnalyser.fftSize = 256;
      localSource.connect(localAnalyser);
      localAudioAnalyserRef.current = localAnalyser;
      
      // Remote analyser (for call audio levels)
      const remoteAnalyser = audioContext.createAnalyser();
      remoteAnalyser.fftSize = 256;
      remoteAudioAnalyserRef.current = remoteAnalyser;
      
      setIsAudioConnected(true);
      startAudioLevelMonitoring();
      
      console.log('Audio VoIP initialisé avec succès');
      
    } catch (error) {
      console.error('VoIP Erreur initialisation audio:', error);
      setIsAudioConnected(false);
    }
  }, [startAudioLevelMonitoring]);

  // Create simulated video stream
  const createSimulatedVideoStream = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 1280;
    canvas.height = 720;

    let frame = 0;
    const animate = () => {
      // MangooTech gradient background
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, '#1b5e20');
      gradient.addColorStop(0.5, '#2e7d32');
      gradient.addColorStop(1, '#1b5e20');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Animated African patterns
      ctx.save();
      ctx.globalAlpha = 0.1;
      
      // Concentric circles (tribal pattern)
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
      
      // Geometric lines
      for (let i = 0; i < 8; i++) {
        ctx.beginPath();
        ctx.moveTo(0, canvas.height * i / 8);
        ctx.lineTo(canvas.width, canvas.height * i / 8 + Math.sin(frame * 0.03 + i) * 20);
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      
      ctx.restore();

      // Animated MangooTech logo
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(frame * 0.005);
      
      // Stylized mango shape
      ctx.beginPath();
      ctx.ellipse(0, 0, 80, 120, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.fill();
      
      // MangooTech text
      ctx.fillStyle = '#1b5e20';
      ctx.font = 'bold 48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('MangooTech', 0, 20);
      
      ctx.fillStyle = '#eeeeee';
      ctx.font = '24px Arial';
      ctx.fillText('Live Shopping', 0, 60);
      
      ctx.restore();

      // LIVE indicator
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
    return canvas.captureStream(30);
  }, [isLive]);

  // Initialize video stream
  useEffect(() => {
    if (mode === 'host' && isLive) {
      const stream = createSimulatedVideoStream();
      if (videoRef.current && stream) {
        videoRef.current.srcObject = stream;
      }
    }
  }, [createSimulatedVideoStream, isLive, mode]);

  // Initialize audio on user interaction
  useEffect(() => {
    const initAudio = async () => {
      if (isLive && !isAudioConnected) {
        await initializeAudio();
      }
    };
    
    initAudio();
    
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
  }, [initializeAudio, isAudioConnected, isLive]);

  // Stream duration counter
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

  // Auto reactions
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

  // Simulate viewer changes
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

  // Auto scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Generate random reactions
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

  // Send chat message
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

  // Toggle live stream
  const toggleLive = async () => {
    if (!isLive && !isAudioConnected) {
      await initializeAudio();
    }
    
    setIsLive(!isLive);
    if (!isLive) {
      setStreamDuration(0);
    }
  };

  // Toggle pause
  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  // Format duration
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Buy product with advanced sales tracking
  const buyProduct = (product: Product, quantity: number = 1) => {
    const saleTotal = product.price * quantity;
    const timestamp = new Date();
    
    // Update sales metrics
    setCurrentProductSales(prev => prev + quantity);
    setTotalSales(prev => prev + saleTotal);
    
    // Track sales history for analytics
    const saleRecord = {
      product,
      quantity,
      timestamp,
      total: saleTotal
    };
    
    setSalesHistory(prev => [...prev, saleRecord]);
    
    // Calculate conversion rate
    const newConversionRate = Math.min((salesHistory.length + 1) / viewers * 100, 100);
    setConversionRate(newConversionRate);
    
    // Calculate average order value
    const totalRevenue = salesHistory.reduce((sum, sale) => sum + sale.total, 0) + saleTotal;
    const totalOrders = salesHistory.length + 1;
    setAverageOrderValue(totalRevenue / totalOrders);
    
    // Track peak sales time
    if (!peakSalesTime || timestamp.getHours() > peakSalesTime.getHours()) {
      setPeakSalesTime(timestamp);
    }
    
    // Apply call sales boost if active call
    if (isInCall) {
      setCallSalesBoost(prev => prev + saleTotal * 0.1); // 10% boost during calls
    }
    
    // Trigger product sale callback
    if (onProductSale) {
      onProductSale(product, quantity);
    }
    
    // Add sales notification to chat
    const salesMessage: ChatMessage = {
      id: `sale-${Date.now()}`,
      userId: 'system',
      username: 'Vente Confirmée',
      message: `${quantity}x ${product.name} vendu(s) - ${saleTotal.toLocaleString()} FCFA`,
      timestamp: new Date(),
      isHost: false,
      isModerator: false
    };
    
    setChatMessages(prev => [...prev, salesMessage]);
    
    // Flash sale effect
    if (flashSaleActive) {
      setFlashSaleTimer(prev => Math.max(0, prev - 1));
    }
    
    const cartItem = {
      id: `${product.id}-${Date.now()}`,
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity,
      image: product.image
    };
    
    const existingCart = JSON.parse(localStorage.getItem('live_shopping_cart') || '[]');
    const updatedCart = [...existingCart, cartItem];
    localStorage.setItem('live_shopping_cart', JSON.stringify(updatedCart));
  };

  // Get flash sale price for product
  const getFlashSalePrice = (product: Product) => {
    if (flashSaleActive && isInCall) {
      return Math.round(product.price * 0.85); // 15% discount during calls with flash sale
    } else if (flashSaleActive) {
      return Math.round(product.price * 0.90); // 10% discount during flash sale
    }
    return product.price;
  };

  // Handle quantity change
  const handleQuantityChange = (productId: string, quantity: number) => {
    setProductQuantities(prev => ({
      ...prev,
      [productId]: Math.max(1, Math.min(quantity, 10)) // Limit 1-10
    }));
  };

  // Get reaction icon
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

  // Generate viewers
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

  return (
    <div className="min-h-screen bg-[#f6faf3]">
      {/* Header with VoIP status */}
      <div className="bg-[#1b5e20] text-white p-4 shadow-lg">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
              <Film className="w-6 h-6 text-[#1b5e20]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">MangooTech Live Shopping</h1>
              <p className="opacity-80">Vente en direct ⋅ Appels VoIP ⋅ Expérience interactive</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            {/* VoIP Status */}
            <div className="text-center">
              <div className={`text-lg font-bold ${isRegistered ? 'text-[#66bb6a]' : 'text-red-300'}`}>
                {isRegistered ? 'VoIP' : 'VoIP'}
              </div>
              <div className="text-sm opacity-80">{callStatus}</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold">{viewers}</div>
              <div className="text-sm opacity-80">Spectateurs</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{formatDuration(streamDuration)}</div>
              <div className="text-sm opacity-80">Durée</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{totalSales.toLocaleString()}</div>
              <div className="text-sm opacity-80">FCFA ventes</div>
            </div>
          </div>
        </div>
      </div>

      {/* Incoming Call Modal */}
      {incomingCall && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6 text-center">
            <PhoneIncoming className="w-16 h-16 text-[#1b5e20] mx-auto mb-4 animate-bounce" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Appel entrant</h2>
            <p className="text-lg text-gray-600 mb-6">De: {incomingCall}</p>
            <div className="flex space-x-4">
              <button
                onClick={answerCall}
                className="flex-1 bg-[#eef6ea] hover:bg-[#eef6ea] text-white py-3 rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                <PhoneCall className="w-5 h-5" />
                <span>Répondre</span>
              </button>
              <button
                onClick={() => setIncomingCall(null)}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                <PhoneOff className="w-5 h-5" />
                <span>Refuser</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main video area */}
          <div className="lg:col-span-3">
            <div className="relative bg-black rounded-2xl overflow-hidden shadow-2xl">
              {/* Video */}
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
                
                {/* Control overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent">
                  {/* LIVE indicator */}
                  {isLive && (
                    <div className="absolute top-4 left-4 flex items-center space-x-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                      <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">LIVE</span>
                    </div>
                  )}

                  {/* Audio level indicators */}
                  {isLive && (
                    <div className="absolute top-4 right-4 space-y-2">
                      {/* Microphone level */}
                      <div className="bg-black bg-opacity-70 rounded-lg p-2">
                        <div className="flex items-center space-x-2 mb-1">
                          <Mic className="w-4 h-4 text-[#1b5e20]" />
                          <span className="text-white text-xs">Micro</span>
                        </div>
                        <div className="w-20 bg-gray-700 rounded-full h-1">
                          <div 
                            className="bg-[#1b5e20] h-1 rounded-full transition-all duration-100"
                            style={{ width: `${localAudioLevel}%` }}
                          ></div>
                        </div>
                        <div className="text-xs text-gray-300 mt-1">{localAudioLevel}%</div>
                      </div>
                      
                      {/* Headset level */}
                      <div className="bg-black bg-opacity-70 rounded-lg p-2">
                        <div className="flex items-center space-x-2 mb-1">
                          <Volume2 className="w-4 h-4 text-[#1b5e20]" />
                          <span className="text-white text-xs">Casque</span>
                        </div>
                        <div className="w-20 bg-gray-700 rounded-full h-1">
                          <div 
                            className="bg-[#eef6ea] h-1 rounded-full transition-all duration-100"
                            style={{ width: `${remoteAudioLevel}%` }}
                          ></div>
                        </div>
                        <div className="text-xs text-gray-300 mt-1">{remoteAudioLevel}%</div>
                        {!isAudioConnected && (
                          <button 
                            onClick={initializeAudio}
                            className="mt-1 bg-[#eef6ea] hover:bg-[#eef6ea] text-white text-xs px-2 py-1 rounded"
                          >
                            Démarrer Audio
                          </button>
                        )}
                      </div>
                      
                      {/* Call status */}
                      {isInCall && callParticipant && (
                        <div className="bg-[#eef6ea] bg-opacity-90 rounded-lg p-2">
                          <div className="flex items-center space-x-2 mb-1">
                            <PhoneCall className="w-4 h-4 text-white" />
                            <span className="text-white text-xs">Appel</span>
                          </div>
                          <div className="text-xs text-white">{callParticipant.number}</div>
                          <button 
                            onClick={endCall}
                            className="mt-1 bg-red-500 hover:bg-red-600 text-white text-xs px-2 py-1 rounded"
                          >
                            Raccrocher
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Control buttons */}
                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {mode === 'host' && (
                        <>
                          <button
                            onClick={toggleLive}
                            className={`p-3 rounded-full ${isLive ? 'bg-red-500 hover:bg-red-600' : 'bg-[#eef6ea] hover:bg-[#eef6ea]'} text-white transition-colors`}
                          >
                            {isLive ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                          </button>
                          
                          {isLive && (
                            <button
                              onClick={togglePause}
                              className="p-3 rounded-full bg-[#1b5e20] hover:bg-[#1b5e20] text-white transition-colors"
                            >
                              {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
                            </button>
                          )}
                          
                          {/* Boutons d'appel pour l'hôte */}
                          {!isInCall && !incomingCall && (
                            <button
                              onClick={() => setShowCallModal(true)}
                              className="p-3 rounded-full bg-[#1b5e20] hover:bg-[#1b5e20] text-white transition-colors"
                            >
                              <Phone className="w-5 h-5" />
                            </button>
                          )}
                        </>
                      )}
                      
                      {/* Boutons d'appel pour le client */}
                      {mode === 'viewer' && !isInCall && !incomingCall && (
                        <button
                          onClick={() => setShowCallModal(true)}
                          className="p-3 rounded-full bg-[#1b5e20] hover:bg-[#1b5e20] text-white transition-colors"
                        >
                          <Phone className="w-5 h-5" />
                        </button>
                      )}
                      
                      <button
                        onClick={() => setIsMuted(!isMuted)}
                        className="p-3 rounded-full bg-gray-800 hover:bg-gray-700 text-white transition-colors"
                      >
                        {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
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
                        className="p-3 rounded-full bg-[#1b5e20] hover:bg-[#1b5e20] text-white transition-colors"
                      >
                        <ShoppingCart className="w-5 h-5" />
                      </button>
                      
                      <button
                        onClick={() => setShowChat(!showChat)}
                        className="p-3 rounded-full bg-[#1b5e20] hover:bg-[#1b5e20] text-white transition-colors"
                      >
                        <MessageCircle className="w-5 h-5" />
                      </button>
                      
                      <button
                        onClick={() => setShowSettings(!showSettings)}
                        className="p-3 rounded-full bg-gray-800 hover:bg-gray-700 text-white transition-colors"
                      >
                        <Settings className="w-5 h-5" />
                      </button>
                      
                      <button
                        onClick={() => setShowSalesDashboard(!showSalesDashboard)}
                        className="p-3 rounded-full bg-[#1b5e20] hover:bg-[#1b5e20] text-white transition-colors"
                      >
                        <BarChart3 className="w-5 h-5" />
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
                
                {/* Floating reactions */}
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
            
            {/* VoIP Call Controls */}
            {isLive && isRegistered && (
              <div className="mt-4 bg-white rounded-xl shadow-lg p-4">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                  <Phone className="w-5 h-5 text-[#1b5e20] mr-2" />
                  Contrôles d'appel VoIP
                </h3>
                
                <div className="flex items-center space-x-4">
                  <input
                    type="text"
                    value={callNumber}
                    onChange={(e) => setCallNumber(e.target.value)}
                    placeholder="Numéro à appeler (ex: 8889)"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1b5e20]/30"
                  />
                  
                  <button
                    onClick={() => makeCall(callNumber)}
                    disabled={!callNumber || isInCall || isCalling}
                    className="bg-[#eef6ea] hover:bg-[#eef6ea] disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                  >
                    <PhoneOutgoing className="w-4 h-4" />
                    <span>Appeler</span>
                  </button>
                  
                  {isInCall && (
                    <button
                      onClick={endCall}
                      className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                    >
                      <PhoneOff className="w-4 h-4" />
                      <span>Raccrocher</span>
                    </button>
                  )}
                </div>
                
                <div className="mt-2 text-sm text-gray-600">
                  Votre numéro: <span className="font-bold">{sipNumber}</span> 
                  {isRegistered && <span className="text-[#1b5e20]">Enregistré</span>}
                </div>
              </div>
            )}
            
            {/* Featured products */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800 flex items-center">
                  <Sparkles className="w-6 h-6 text-[#1b5e20] mr-2" />
                  Produits en Vedette
                </h3>
                <button
                  onClick={() => setShowProductPanel(true)}
                  className="text-[#1b5e20] hover:text-[#1b5e20] font-medium"
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
                          <div className="text-xl font-bold text-[#1b5e20]">
                            {getFlashSalePrice(product).toLocaleString()} FCFA
                            {flashSaleActive && (
                              <span className="ml-2 text-xs bg-red-500 text-white px-2 py-1 rounded-full">FLASH SALE</span>
                            )}
                          </div>
                          {product.originalPrice && (
                            <div className="text-sm text-gray-500 line-through">
                              {product.originalPrice.toLocaleString()} FCFA
                            </div>
                          )}
                          {flashSaleActive && (
                            <div className="text-sm text-[#1b5e20] font-medium">
                              Économie: {(product.price - getFlashSalePrice(product)).toLocaleString()} FCFA
                            </div>
                          )}
                        </div>
                        <div className="flex items-center">
                          <Star className="w-4 h-4 text-[#8f4b00] fill-current" />
                          <span className="text-sm text-gray-600 ml-1">{product.rating}</span>
                        </div>
                      </div>
                      
                      {/* Quantity Selection */}
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-gray-500">Quantité:</span>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleQuantityChange(product.id, (productQuantities[product.id] || 1) - 1)}
                            className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-gray-600"
                          >
                            -
                          </button>
                          <span className="w-8 text-center font-medium">{productQuantities[product.id] || 1}</span>
                          <button
                            onClick={() => handleQuantityChange(product.id, (productQuantities[product.id] || 1) + 1)}
                            className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-gray-600"
                          >
                            +
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Stock: {product.stock}</span>
                        <button
                          onClick={() => buyProduct(product, productQuantities[product.id] || 1)}
                          className="bg-[#1b5e20] text-white hover:bg-[#16381a] px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
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
          
          {/* Sidebar - Chat and viewers */}
          <div className="space-y-6">
            {/* Chat */}
            {showChat && (
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="font-bold text-gray-800 flex items-center">
                    <MessageCircle className="w-5 h-5 text-[#1b5e20] mr-2" />
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
                        <div className={`max-w-xs px-4 py-2 rounded-lg ${message.isHost ? 'bg-[#1b5e20] text-white' : 'bg-gray-100 text-gray-800'}`}>
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
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1b5e20]"
                    />
                    <button
                      onClick={sendMessage}
                      className="bg-[#1b5e20] hover:bg-[#1b5e20] text-white px-4 py-2 rounded-lg transition-colors"
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
                  <Users className="w-5 h-5 text-[#1b5e20] mr-2" />
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
                          <Crown className="w-4 h-4 text-[#1b5e20] ml-1" />
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
            
            {/* Statistics */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-bold text-gray-800 flex items-center">
                  <TrendingUp className="w-5 h-5 text-[#1b5e20] mr-2" />
                  Statistiques
                </h3>
              </div>
              
              <div className="p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Vues produits</span>
                  <span className="font-bold text-[#1b5e20]">{Math.floor(viewers * 2.5)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Ajouts panier</span>
                  <span className="font-bold text-[#1b5e20]">{currentProductSales * 3}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Achat immédiat</span>
                  <span className="font-bold text-[#1b5e20]">{currentProductSales}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Taux conversion</span>
                  <span className="font-bold text-[#1b5e20]">{((currentProductSales / (viewers * 2.5)) * 100).toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Product catalog modal */}
      {showProductPanel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                <ShoppingCart className="w-6 h-6 text-[#1b5e20] mr-3" />
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
                        <div className="text-2xl font-bold text-[#1b5e20]">
                          {product.price.toLocaleString()} FCFA
                        </div>
                        {product.originalPrice && (
                          <div className="text-sm text-gray-500 line-through">
                            {product.originalPrice.toLocaleString()} FCFA
                          </div>
                        )}
                      </div>
                      <div className="flex items-center">
                        <Star className="w-5 h-5 text-[#8f4b00] fill-current" />
                        <span className="text-gray-600 ml-1">{product.rating}</span>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setSelectedProduct(product);
                          buyProduct(product);
                        }}
                        className="flex-1 bg-[#1b5e20] text-white hover:bg-[#16381a] py-3 rounded-lg transition-colors flex items-center justify-center space-x-2"
                      >
                        <ShoppingCart className="w-5 h-5" />
                        <span>Acheter Maintenant</span>
                      </button>
                      
                      <button className="p-3 border border-[#cfe0c8] text-[#1b5e20] rounded-lg hover:bg-[#eef6ea] transition-colors">
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
      
      {/* Settings modal */}
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
                <button className="w-12 h-6 bg-[#1b5e20] rounded-full relative">
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
                <button className="w-12 h-6 bg-[#1b5e20] rounded-full relative">
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
      
      {/* Sales Dashboard Modal */}
      {showSalesDashboard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                <BarChart3 className="w-6 h-6 text-[#1b5e20] mr-3" />
                Tableau de Bord des Ventes
              </h2>
              <button
                onClick={() => setShowSalesDashboard(false)}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-[#f6faf3] p-4 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Ventes Totales</p>
                      <p className="text-2xl font-bold text-gray-800">{totalSales.toLocaleString()} FCFA</p>
                    </div>
                    <DollarSign className="w-8 h-8 text-[#1b5e20]" />
                  </div>
                </div>
                
                <div className="bg-[#f6faf3] p-4 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Taux de Conversion</p>
                      <p className="text-2xl font-bold text-gray-800">{conversionRate.toFixed(1)}%</p>
                    </div>
                    <Target className="w-8 h-8 text-[#1b5e20]" />
                  </div>
                </div>
                
                <div className="bg-[#f6faf3] p-4 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Panier Moyen</p>
                      <p className="text-2xl font-bold text-gray-800">{averageOrderValue.toFixed(0)} FCFA</p>
                    </div>
                    <Activity className="w-8 h-8 text-[#1b5e20]" />
                  </div>
                </div>
                
                <div className="bg-[#f6faf3] p-4 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Boost Appel</p>
                      <p className="text-2xl font-bold text-gray-800">{callSalesBoost.toFixed(0)} FCFA</p>
                    </div>
                    <PhoneCall className="w-8 h-8 text-[#1b5e20]" />
                  </div>
                </div>
              </div>
              
              {/* Sales History */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                  <Clock className="w-5 h-5 text-gray-600 mr-2" />
                  Historique des Ventes ({salesHistory.length} commandes)
                </h3>
                
                {salesHistory.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">Aucune vente pour le moment</p>
                ) : (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {salesHistory.slice(-10).reverse().map((sale, index) => (
                      <div key={index} className="flex items-center justify-between bg-white p-3 rounded-lg shadow-sm">
                        <div className="flex items-center space-x-3">
                          <img 
                            src={sale.product.image} 
                            alt={sale.product.name}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                          <div>
                            <p className="font-medium text-gray-800">{sale.product.name}</p>
                            <p className="text-sm text-gray-500">{sale.quantity} x {sale.product.price.toLocaleString()} FCFA</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-[#1b5e20]">{sale.total.toLocaleString()} FCFA</p>
                          <p className="text-xs text-gray-500">{sale.timestamp.toLocaleTimeString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Flash Sale Controls */}
              {mode === 'host' && (
                <div className="bg-[#f6faf3] rounded-xl p-4">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                    <Zap className="w-5 h-5 text-red-500 mr-2" />
                    Vente Flash
                  </h3>
                  
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Statut: {flashSaleActive ? 'Active' : 'Inactive'}</p>
                      {flashSaleActive && (
                        <p className="text-lg font-bold text-red-600">Temps restant: {flashSaleTimer}s</p>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        if (flashSaleActive) {
                          setFlashSaleActive(false);
                          setFlashSaleTimer(0);
                        } else {
                          setFlashSaleActive(true);
                          setFlashSaleTimer(300); // 5 minutes
                        }
                      }}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        flashSaleActive 
                          ? 'bg-red-500 hover:bg-red-600 text-white' 
                          : 'bg-[#eef6ea] hover:bg-[#eef6ea] text-white'
                      }`}
                    >
                      {flashSaleActive ? 'Arrêter' : 'Démarrer'}
                    </button>
                  </div>
                  
                  <p className="text-sm text-gray-600">
                    Les ventes flash augmentent la conversion de 25% pendant les appels actifs!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Call Modal */}
      {showCallModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800 flex items-center">
                <Phone className="w-5 h-5 text-[#1b5e20] mr-2" />
                Passer un appel
              </h2>
              <button
                onClick={() => setShowCallModal(false)}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Numéro à appeler:
                </label>
                <input
                  type="text"
                  value={callNumber}
                  onChange={(e) => setCallNumber(e.target.value)}
                  placeholder="Entrez le numéro (ex: 8889)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1b5e20]/30 focus:border-transparent"
                />
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowCallModal(false);
                    startCall();
                  }}
                  className="flex-1 bg-[#1b5e20] hover:bg-[#1b5e20] text-white py-2 rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  <PhoneCall className="w-4 h-4" />
                  <span>Appeler</span>
                </button>
                
                <button
                  onClick={() => setShowCallModal(false)}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 rounded-lg transition-colors"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <style>{`
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

export default LiveShoppingVoIPManager;
