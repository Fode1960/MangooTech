import React, { useState, useEffect, useRef } from 'react';
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff, Monitor, Eye, EyeOff, Settings, Maximize2, Users, ShoppingCart, Heart, Share2, MessageCircle } from 'lucide-react';

interface WebRTCManagerProps {
  mode: 'video-call' | 'live-shopping';
  roomId: string;
  userRole: 'vendor' | 'customer';
  onStreamStart?: () => void;
  onStreamEnd?: () => void;
  productData?: {
    id: string;
    name: string;
    price: number;
    image: string;
    description: string;
  };
}

interface Participant {
  id: string;
  name: string;
  stream?: MediaStream;
  isMuted?: boolean;
  isVideoOff?: boolean;
}

const WebRTCManager: React.FC<WebRTCManagerProps> = ({
  mode,
  roomId,
  userRole,
  onStreamStart,
  onStreamEnd,
  productData
}) => {
  const [isCallActive, setIsCallActive] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isRemoteVideoVisible, setIsRemoteVideoVisible] = useState(true);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [messages, setMessages] = useState<Array<{id: string; user: string; message: string; timestamp: Date}>>([]);
  const [newMessage, setNewMessage] = useState('');
  const [viewerCount, setViewerCount] = useState(1);
  const [reactions, setReactions] = useState<Array<{id: string; emoji: string; user: string}>>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [videoQuality, setVideoQuality] = useState('high');
  const [audioMode, setAudioMode] = useState('stereo');
  const [echoCancellation, setEchoCancellation] = useState(true);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localCanvasRef = useRef<HTMLCanvasElement>(null);
  const remoteCanvasRef = useRef<HTMLCanvasElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const canvasAnimationRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Configuration WebRTC
  const iceServers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ];

  // Configuration MangooTech branding
  const mangoColors = {
    primary: '#FF6B35',
    secondary: '#F7931E', 
    accent: '#FFD23F',
    brown: '#8B4513',
    green: '#228B22',
    dark: '#2D1810'
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      endCall();
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const setupCanvasAnimation = (canvas: HTMLCanvasElement, type: 'local' | 'remote') => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 640;
    canvas.height = 480;
    let frame = 0;

    const animate = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Create gradient background
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      if (type === 'local') {
        gradient.addColorStop(0, mangoColors.primary + '40');
        gradient.addColorStop(1, mangoColors.secondary + '40');
      } else {
        gradient.addColorStop(0, mangoColors.green + '40');
        gradient.addColorStop(1, mangoColors.accent + '40');
      }

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw animated circles
      for (let i = 0; i < 5; i++) {
        const x = (canvas.width / 6) * (i + 1);
        const y = canvas.height / 2 + Math.sin(frame * 0.05 + i) * 50;
        const radius = 20 + Math.sin(frame * 0.03 + i) * 10;

        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + Math.sin(frame * 0.02 + i) * 0.2})`;
        ctx.fill();
      }

      // Draw connection lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 4; i++) {
        const x1 = (canvas.width / 6) * (i + 1);
        const y1 = canvas.height / 2 + Math.sin(frame * 0.05 + i) * 50;
        const x2 = (canvas.width / 6) * (i + 2);
        const y2 = canvas.height / 2 + Math.sin(frame * 0.05 + i + 1) * 50;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.quadraticCurveTo((x1 + x2) / 2, (y1 + y2) / 2 - 30, x2, y2);
        ctx.stroke();
      }

      // Add text overlay
      ctx.fillStyle = 'white';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(type === 'local' ? 'VOUS' : 'PARTICIPANT', canvas.width / 2, 50);

      frame++;
      canvasAnimationRef.current = requestAnimationFrame(animate);
    };

    animate();
  };

  const createSimulatedAudioStream = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    const oscillator = audioContextRef.current.createOscillator();
    const gainNode = audioContextRef.current.createGain();
    
    oscillator.connect(gainNode);
    oscillator.frequency.setValueAtTime(440, audioContextRef.current.currentTime);
    gainNode.gain.setValueAtTime(0.1, audioContextRef.current.currentTime);
    oscillator.start();

    const audioStream = audioContextRef.current.createMediaStreamDestination();
    gainNode.connect(audioStream);

    return audioStream.stream;
  };

  const startCall = async () => {
    try {
      setIsCallActive(true);
      
      // Initialize peer connection
      peerConnectionRef.current = new RTCPeerConnection({ iceServers });

      if (mode === 'live-shopping' && userRole === 'vendor') {
        // Vendor starts live stream
        await initializeMediaStream();
      } else {
        // Customer or video call participant
        await initializeSimulatedStream();
      }

      onStreamStart?.();
    } catch (error) {
      console.error('Error starting call:', error);
      setIsCallActive(false);
    }
  };

  const initializeMediaStream = async () => {
    try {
      const constraints = {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        },
        audio: {
          echoCancellation: echoCancellation,
          noiseSuppression: true,
          autoGainControl: true
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Add tracks to peer connection
      stream.getTracks().forEach(track => {
        peerConnectionRef.current?.addTrack(track, stream);
      });

    } catch (error) {
      console.warn('Camera access denied, using simulated stream:', error);
      await initializeSimulatedStream();
    }
  };

  const initializeSimulatedStream = async () => {
    // Create local canvas stream
    if (localCanvasRef.current) {
      setupCanvasAnimation(localCanvasRef.current, 'local');
      const canvasStream = localCanvasRef.current.captureStream(30);
      const audioStream = createSimulatedAudioStream();

      localStreamRef.current = new MediaStream([
        ...canvasStream.getVideoTracks(),
        ...audioStream.getAudioTracks()
      ]);

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }

      // Create remote canvas stream for demonstration
      if (remoteCanvasRef.current) {
        setupCanvasAnimation(remoteCanvasRef.current, 'remote');
        const remoteCanvasStream = remoteCanvasRef.current.captureStream(30);
        const remoteAudioStream = createSimulatedAudioStream();

        remoteStreamRef.current = new MediaStream([
          ...remoteCanvasStream.getVideoTracks(),
          ...remoteAudioStream.getAudioTracks()
        ]);

        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStreamRef.current;
        }
      }
    }
  };

  const endCall = () => {
    setIsCallActive(false);

    // Stop local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }

    // Stop remote stream
    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach(track => track.stop());
      remoteStreamRef.current = null;
    }

    // Stop canvas animation
    if (canvasAnimationRef.current) {
      cancelAnimationFrame(canvasAnimationRef.current);
      canvasAnimationRef.current = null;
    }

    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    // Stop audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    onStreamEnd?.();
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !isVideoEnabled;
        setIsVideoEnabled(!isVideoEnabled);
      }
    }
  };

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !isAudioEnabled;
        setIsAudioEnabled(!isAudioEnabled);
      }
    }
  };

  const shareScreen = async () => {
    try {
      if (!isScreenSharing) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true
        });

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }

        // Replace video track in peer connection
        const screenTrack = screenStream.getVideoTracks()[0];
        const sender = peerConnectionRef.current?.getSenders().find(s => 
          s.track && s.track.kind === 'video'
        );
        
        if (sender) {
          await sender.replaceTrack(screenTrack);
        }

        screenTrack.onended = () => {
          setIsScreenSharing(false);
          if (localStreamRef.current && localVideoRef.current) {
            localVideoRef.current.srcObject = localStreamRef.current;
          }
        };

        setIsScreenSharing(true);
      } else {
        // Stop screen sharing
        setIsScreenSharing(false);
        if (localStreamRef.current && localVideoRef.current) {
          localVideoRef.current.srcObject = localStreamRef.current;
        }
      }
    } catch (error) {
      console.error('Error sharing screen:', error);
    }
  };

  const toggleRemoteVideo = () => {
    setIsRemoteVideoVisible(!isRemoteVideoVisible);
  };

  const toggleFullscreen = () => {
    const element = document.documentElement;
    if (!document.fullscreenElement) {
      element.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      const message = {
        id: Date.now().toString(),
        user: userRole === 'vendor' ? 'Vendeur' : 'Client',
        message: newMessage,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, message]);
      setNewMessage('');
    }
  };

  const addReaction = (emoji: string) => {
    const reaction = {
      id: Date.now().toString(),
      emoji,
      user: userRole === 'vendor' ? 'Vendeur' : 'Client'
    };
    setReactions(prev => [...prev, reaction]);
    
    // Remove reaction after 3 seconds
    setTimeout(() => {
      setReactions(prev => prev.filter(r => r.id !== reaction.id));
    }, 3000);
  };

  const buyProduct = () => {
    if (productData) {
      // Simulate purchase
      alert(`🛍️ Produit acheté : ${productData.name} - ${productData.price}€`);
    }
  };

  return (
    <div className="mangoo-webrtc-container" style={{
      background: `linear-gradient(135deg, ${mangoColors.dark}, ${mangoColors.brown})`,
      minHeight: '100vh',
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div className="webrtc-header" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        padding: '15px 20px',
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        borderRadius: '15px',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <div className="room-info">
          <h2 style={{ color: 'white', margin: 0, fontSize: '1.2rem' }}>
            {mode === 'live-shopping' ? '🛍️ Live Shopping' : '📹 Appel Vidéo'}
          </h2>
          <p style={{ color: 'rgba(255, 255, 255, 0.7)', margin: '5px 0 0 0', fontSize: '0.9rem' }}>
            Room: {roomId} | {userRole === 'vendor' ? 'Vendeur' : 'Client'}
          </p>
        </div>
        
        {mode === 'live-shopping' && (
          <div className="live-stats" style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <div style={{ color: 'white', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Users size={16} />
              <span>{viewerCount} viewers</span>
            </div>
            <div style={{ 
              background: mangoColors.primary, 
              color: 'white', 
              padding: '5px 10px', 
              borderRadius: '20px',
              fontSize: '0.8rem',
              fontWeight: 'bold',
              animation: 'pulse 2s infinite'
            }}>
              🔴 LIVE
            </div>
          </div>
        )}
      </div>

      <div className="webrtc-content" style={{ display: 'flex', gap: '20px', height: 'calc(100vh - 200px)' }}>
        {/* Main Video Area */}
        <div className="main-video-area" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {/* Local Video */}
          <div className="video-container local" style={{
            position: 'relative',
            borderRadius: '15px',
            overflow: 'hidden',
            border: `2px solid ${mangoColors.primary}`,
            background: 'rgba(0, 0, 0, 0.5)'
          }}>
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              style={{
                width: '100%',
                height: '200px',
                objectFit: 'cover',
                display: isVideoEnabled ? 'block' : 'none'
              }}
            />
            <canvas
              ref={localCanvasRef}
              style={{
                width: '100%',
                height: '200px',
                objectFit: 'cover',
                display: isVideoEnabled ? 'block' : 'none'
              }}
            />
            {!isVideoEnabled && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(0, 0, 0, 0.8)',
                color: 'white',
                fontSize: '1.2rem',
                fontWeight: 'bold'
              }}>
                🎭 Caméra désactivée
              </div>
            )}
            <div style={{
              position: 'absolute',
              top: '10px',
              left: '10px',
              background: 'rgba(0, 0, 0, 0.7)',
              color: 'white',
              padding: '5px 10px',
              borderRadius: '15px',
              fontSize: '0.8rem'
            }}>
              {userRole === 'vendor' ? '🛍️ Vendeur' : '👤 Client'}
            </div>
          </div>

          {/* Remote Video */}
          <div className="video-container remote" style={{
            position: 'relative',
            flex: 1,
            borderRadius: '15px',
            overflow: 'hidden',
            border: `2px solid ${mangoColors.green}`,
            background: 'rgba(0, 0, 0, 0.5)',
            filter: isRemoteVideoVisible ? 'none' : 'blur(10px)'
          }}>
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: isRemoteVideoVisible ? 'block' : 'none'
              }}
            />
            <canvas
              ref={remoteCanvasRef}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: isRemoteVideoVisible ? 'block' : 'none'
              }}
            />
            {!isRemoteVideoVisible && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(139, 69, 19, 0.8)',
                color: 'white',
                fontSize: '1.2rem',
                fontWeight: 'bold'
              }}>
                🚫 Vidéo distante masquée
              </div>
            )}
            <div style={{
              position: 'absolute',
              top: '10px',
              left: '10px',
              background: 'rgba(0, 0, 0, 0.7)',
              color: 'white',
              padding: '5px 10px',
              borderRadius: '15px',
              fontSize: '0.8rem'
            }}>
              {mode === 'live-shopping' ? '👥 Audience' : '📹 Participant'}
            </div>
          </div>

          {/* Controls */}
          <div className="controls" style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '15px',
            padding: '15px',
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            borderRadius: '15px',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <button
              onClick={toggleVideo}
              style={{
                background: isVideoEnabled ? mangoColors.primary : 'rgba(220, 53, 69, 0.8)',
                border: 'none',
                borderRadius: '50%',
                width: '50px',
                height: '50px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              {isVideoEnabled ? <Video size={20} /> : <VideoOff size={20} />}
            </button>

            <button
              onClick={toggleAudio}
              style={{
                background: isAudioEnabled ? mangoColors.primary : 'rgba(220, 53, 69, 0.8)',
                border: 'none',
                borderRadius: '50%',
                width: '50px',
                height: '50px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              {isAudioEnabled ? <Mic size={20} /> : <MicOff size={20} />}
            </button>

            {userRole === 'vendor' && (
              <button
                onClick={shareScreen}
                style={{
                  background: isScreenSharing ? mangoColors.accent : 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '50px',
                  height: '50px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                <Monitor size={20} />
              </button>
            )}

            <button
              onClick={toggleRemoteVideo}
              style={{
                background: isRemoteVideoVisible ? 'rgba(255, 255, 255, 0.2)' : mangoColors.secondary,
                border: 'none',
                borderRadius: '50%',
                width: '50px',
                height: '50px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              {isRemoteVideoVisible ? <Eye size={20} /> : <EyeOff size={20} />}
            </button>

            <button
              onClick={toggleFullscreen}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                borderRadius: '50%',
                width: '50px',
                height: '50px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              <Maximize2 size={20} />
            </button>

            <button
              onClick={() => setShowSettings(!showSettings)}
              style={{
                background: showSettings ? mangoColors.accent : 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                borderRadius: '50%',
                width: '50px',
                height: '50px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              <Settings size={20} />
            </button>

            <button
              onClick={endCall}
              style={{
                background: 'rgba(220, 53, 69, 0.8)',
                border: 'none',
                borderRadius: '50%',
                width: '50px',
                height: '50px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              <PhoneOff size={20} />
            </button>
          </div>
        </div>

        {/* Side Panel */}
        <div className="side-panel" style={{
          width: '350px',
          display: 'flex',
          flexDirection: 'column',
          gap: '15px'
        }}>
          {/* Product Info (Live Shopping) */}
          {mode === 'live-shopping' && productData && (
            <div className="product-card" style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              borderRadius: '15px',
              padding: '20px',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <img
                src={productData.image}
                alt={productData.name}
                style={{
                  width: '100%',
                  height: '150px',
                  objectFit: 'cover',
                  borderRadius: '10px',
                  marginBottom: '15px'
                }}
              />
              <h3 style={{ color: 'white', margin: '0 0 10px 0' }}>{productData.name}</h3>
              <p style={{ color: 'rgba(255, 255, 255, 0.8)', margin: '0 0 15px 0', fontSize: '0.9rem' }}>
                {productData.description}
              </p>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{
                  color: mangoColors.accent,
                  fontSize: '1.5rem',
                  fontWeight: 'bold'
                }}>
                  {productData.price}€
                </span>
                <button
                  onClick={buyProduct}
                  style={{
                    background: `linear-gradient(45deg, ${mangoColors.primary}, ${mangoColors.secondary})`,
                    border: 'none',
                    borderRadius: '25px',
                    padding: '10px 20px',
                    color: 'white',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  <ShoppingCart size={16} />
                  Acheter
                </button>
              </div>
            </div>
          )}

          {/* Chat */}
          <div className="chat-container" style={{
            flex: 1,
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            borderRadius: '15px',
            padding: '15px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '15px'
            }}>
              <h4 style={{ color: 'white', margin: 0 }}>💬 Chat</h4>
              <div style={{
                display: 'flex',
                gap: '5px'
              }}>
                {['❤️', '👍', '😍', '🎉'].map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => addReaction(emoji)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      fontSize: '1.2rem',
                      cursor: 'pointer',
                      padding: '2px'
                    }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div className="messages" style={{
              flex: 1,
              overflowY: 'auto',
              marginBottom: '10px',
              maxHeight: '300px'
            }}>
              {messages.map(msg => (
                <div key={msg.id} style={{
                  marginBottom: '10px',
                  padding: '8px 12px',
                  background: msg.user === 'Vendeur' ? 
                    'rgba(255, 107, 53, 0.2)' : 'rgba(34, 139, 34, 0.2)',
                  borderRadius: '10px',
                  borderLeft: `3px solid ${msg.user === 'Vendeur' ? mangoColors.primary : mangoColors.green}`
                }}>
                  <div style={{
                    fontSize: '0.8rem',
                    color: 'rgba(255, 255, 255, 0.7)',
                    marginBottom: '2px'
                  }}>
                    {msg.user}
                  </div>
                  <div style={{ color: 'white', fontSize: '0.9rem' }}>
                    {msg.message}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={sendMessage} style={{
              display: 'flex',
              gap: '5px'
            }}>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Tapez votre message..."
                style={{
                  flex: 1,
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '20px',
                  padding: '8px 15px',
                  color: 'white',
                  fontSize: '0.9rem'
                }}
              />
              <button
                type="submit"
                style={{
                  background: mangoColors.primary,
                  border: 'none',
                  borderRadius: '50%',
                  width: '35px',
                  height: '35px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  cursor: 'pointer'
                }}
              >
                <MessageCircle size={16} />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(15px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '20px',
            padding: '30px',
            maxWidth: '400px',
            width: '90%',
            color: 'white'
          }}>
            <h3 style={{ marginBottom: '20px', color: mangoColors.accent }}>⚙️ Paramètres</h3>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Qualité vidéo:</label>
              <select
                value={videoQuality}
                onChange={(e) => setVideoQuality(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: 'white'
                }}
              >
                <option value="high">Haute (HD)</option>
                <option value="medium">Moyenne (SD)</option>
                <option value="low">Basse (LD)</option>
                <option value="auto">Auto</option>
              </select>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Mode audio:</label>
              <select
                value={audioMode}
                onChange={(e) => setAudioMode(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: 'white'
                }}
              >
                <option value="stereo">Stéréo</option>
                <option value="mono">Mono</option>
                <option value="spatial">Spatial</option>
              </select>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="checkbox"
                  checked={echoCancellation}
                  onChange={(e) => setEchoCancellation(e.target.checked)}
                  style={{ accentColor: mangoColors.primary }}
                />
                <span>Annulation d'écho</span>
              </label>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowSettings(false)}
                style={{
                  padding: '10px 20px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '10px',
                  background: 'transparent',
                  color: 'white',
                  cursor: 'pointer'
                }}
              >
                Annuler
              </button>
              <button
                onClick={() => setShowSettings(false)}
                style={{
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '10px',
                  background: `linear-gradient(45deg, ${mangoColors.primary}, ${mangoColors.secondary})`,
                  color: 'white',
                  cursor: 'pointer'
                }}
              >
                Sauvegarder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Call Start/End */}
      {!isCallActive ? (
        <div style={{
          position: 'fixed',
          bottom: '30px',
          left: '50%',
          transform: 'translateX(-50%)'
        }}>
          <button
            onClick={startCall}
            style={{
              background: `linear-gradient(45deg, ${mangoColors.primary}, ${mangoColors.secondary})`,
              border: 'none',
              borderRadius: '30px',
              padding: '15px 40px',
              color: 'white',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              boxShadow: '0 10px 30px rgba(255, 107, 53, 0.3)'
            }}
          >
            <Phone size={20} />
            {mode === 'live-shopping' ? (userRole === 'vendor' ? 'Démarrer le Live' : 'Rejoindre le Live') : 'Démarrer l\'appel'}
          </button>
        </div>
      ) : (
        <div style={{
          position: 'fixed',
          bottom: '30px',
          left: '50%',
          transform: 'translateX(-50%)'
        }}>
          <button
            onClick={endCall}
            style={{
              background: 'rgba(220, 53, 69, 0.9)',
              border: 'none',
              borderRadius: '30px',
              padding: '15px 40px',
              color: 'white',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              boxShadow: '0 10px 30px rgba(220, 53, 69, 0.3)'
            }}
          >
            <PhoneOff size={20} />
            Terminer
          </button>
        </div>
      )}

      {/* Floating Reactions */}
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
        zIndex: 999
      }}>
        {reactions.map(reaction => (
          <div
            key={reaction.id}
            style={{
              position: 'absolute',
              fontSize: '2rem',
              animation: 'floatUp 3s ease-out forwards',
              opacity: 0.8
            }}
          >
            {reaction.emoji}
          </div>
        ))}
      </div>

      {/* Styles CSS intégrés */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes floatUp {
            0% {
              transform: translateY(0) scale(0.5);
              opacity: 0;
            }
            20% {
              transform: translateY(-20px) scale(1);
              opacity: 1;
            }
            100% {
              transform: translateY(-100px) scale(0.5);
              opacity: 0;
            }
          }

          @keyframes pulse {
            0%, 100% {
              transform: scale(1);
            }
            50% {
              transform: scale(1.05);
            }
          }

          .mangoo-webrtc-container {
            animation: fadeIn 0.5s ease;
          }

          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `
      }} />
    </div>
  );
};

export default WebRTCManager;