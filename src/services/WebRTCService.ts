/**
 * Service WebRTC pour appels audio/vidéo et live shopping
 * Utilise notre infrastructure Contabo autonome
 */

export interface WebRTCConfig {
  iceServers: RTCIceServer[];
  iceTransportPolicy: RTCIceTransportPolicy;
  bundlePolicy: RTCBundlePolicy;
  rtcpMuxPolicy: RTCRtcpMuxPolicy;
}

export interface CallOptions {
  video: boolean;
  audio: boolean;
  screenShare: boolean;
  quality: 'low' | 'medium' | 'high' | 'ultra';
}

export interface LiveShoppingOptions {
  title: string;
  description: string;
  products: Array<{
    id: string;
    name: string;
    price: number;
    image: string;
  }>;
}

export interface PeerConnection {
  id: string;
  pc: RTCPeerConnection;
  stream?: MediaStream;
  dataChannel?: RTCDataChannel;
  isInitiator: boolean;
}

class WebRTCService {
  private signalingSocket: WebSocket | null = null;
  private peerConnections: Map<string, PeerConnection> = new Map();
  private localStream: MediaStream | null = null;
  private screenStream: MediaStream | null = null;
  private dataChannel: RTCDataChannel | null = null;
  private currentRoomId: string | null = null;
  private userId: string | null = null;
  private userRole: 'vendor' | 'customer' = 'customer';
  
  // Configuration WebRTC
  private rtcConfig: WebRTCConfig | null = null;
  
  // Événements
  private eventListeners: Map<string, Function[]> = new Map();
  
  // État
  private isConnected = false;
  private isInCall = false;
  private isLiveShopping = false;
  
  constructor() {
    this.initializeEventListeners();
  }

  /**
   * Initialiser les écouteurs d'événements
   */
  private initializeEventListeners(): void {
    // Configuration par défaut des événements
    this.eventListeners.set('callStarted', []);
    this.eventListeners.set('callEnded', []);
    this.eventListeners.set('streamReceived', []);
    this.eventListeners.set('connectionStateChanged', []);
    this.eventListeners.set('error', []);
  }
  
  /**
   * Initialise le service WebRTC
   */
  async initialize(userId: string, userRole: 'vendor' | 'customer' = 'customer'): Promise<void> {
    this.userId = userId;
    this.userRole = userRole;
    
    try {
      // Obtenir la configuration TURN/STUN
      await this.fetchRTCConfig();
      
      // Se connecter au serveur de signalisation
      await this.connectToSignalingServer();
      
      console.log('[WebRTC] Service initialisé avec succès');
    } catch (error) {
      console.error('[WebRTC] Erreur d\'initialisation:', error);
      throw error;
    }
  }
  
  /**
   * Obtient la configuration TURN/STUN depuis notre serveur
   */
  private async fetchRTCConfig(): Promise<void> {
    try {
      const response = await fetch(`http://localhost:8081/api/turn/config?username=${this.userId}&role=${this.userRole}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      this.rtcConfig = data;
      
      console.log('[WebRTC] Configuration TURN/STUN obtenue');
    } catch (error) {
      console.error('[WebRTC] Erreur lors de la récupération de la config TURN:', error);
      
      // Configuration de secours
      this.rtcConfig = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ],
        iceTransportPolicy: 'all',
        bundlePolicy: 'max-bundle',
        rtcpMuxPolicy: 'require'
      };
    }
  }
  
  /**
   * Se connecte au serveur de signalisation
   */
  private connectToSignalingServer(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.signalingSocket = new WebSocket('ws://localhost:8080');
        
        this.signalingSocket.onopen = () => {
          console.log('[WebRTC] Connecté au serveur de signalisation');
          this.isConnected = true;
          
          // S'enregistrer auprès du serveur
          this.sendSignalingMessage('register', {
            peerId: this.userId,
            userData: {
              id: this.userId,
              role: this.userRole,
              timestamp: Date.now()
            }
          });
          
          resolve();
        };
        
        this.signalingSocket.onmessage = (event) => {
          this.handleSignalingMessage(JSON.parse(event.data));
        };
        
        this.signalingSocket.onclose = () => {
          console.log('[WebRTC] Déconnecté du serveur de signalisation');
          this.isConnected = false;
          this.emit('disconnected');
        };
        
        this.signalingSocket.onerror = (error) => {
          console.error('[WebRTC] Erreur WebSocket:', error);
          reject(error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }
  
  /**
   * Envoie un message au serveur de signalisation
   */
  private sendSignalingMessage(type: string, data: any): void {
    if (this.signalingSocket && this.signalingSocket.readyState === WebSocket.OPEN) {
      this.signalingSocket.send(JSON.stringify({ type, data }));
    }
  }
  
  /**
   * Gère les messages de signalisation
   */
  private handleSignalingMessage(message: any): void {
    const { type, data } = message;
    
    console.log('[WebRTC] Message reçu:', type, data);
    
    switch (type) {
      case 'registered':
        this.emit('registered', data);
        break;
        
      case 'room-joined':
        this.handleRoomJoined(data);
        break;
        
      case 'peer-joined':
        this.handlePeerJoined(data);
        break;
        
      case 'peer-left':
        this.handlePeerLeft(data);
        break;
        
      case 'offer':
        this.handleOffer(data);
        break;
        
      case 'answer':
        this.handleAnswer(data);
        break;
        
      case 'ice-candidate':
        this.handleIceCandidate(data);
        break;
        
      case 'live-started':
        this.handleLiveStarted(data);
        break;
        
      case 'live-joined':
        this.handleLiveJoined(data);
        break;
        
      case 'live-ended':
        this.handleLiveEnded(data);
        break;
        
      case 'error':
        console.error('[WebRTC] Erreur serveur:', data.error);
        this.emit('error', data.error);
        break;
        
      default:
        console.warn('[WebRTC] Type de message inconnu:', type);
    }
  }
  
  /**
   * Obtient le flux média local
   */
  async getUserMedia(options: CallOptions): Promise<MediaStream> {
    try {
      const constraints = this.buildMediaConstraints(options);
      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      console.log('[WebRTC] Flux local obtenu');
      this.emit('localStream', this.localStream);
      
      return this.localStream;
    } catch (error) {
      console.error('[WebRTC] Erreur getUserMedia:', error);
      throw error;
    }
  }
  
  /**
   * Construit les contraintes média
   */
  private buildMediaConstraints(options: CallOptions): MediaStreamConstraints {
    const constraints: MediaStreamConstraints = {};
    
    if (options.video) {
      constraints.video = {
        width: this.getVideoWidth(options.quality),
        height: this.getVideoHeight(options.quality),
        frameRate: this.getFrameRate(options.quality)
      };
    }
    
    if (options.audio) {
      constraints.audio = {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      };
    }
    
    return constraints;
  }
  
  /**
   * Obtient la résolution vidéo selon la qualité
   */
  private getVideoWidth(quality: string): number {
    const resolutions = {
      'low': 320,
      'medium': 640,
      'high': 1280,
      'ultra': 1920
    };
    return resolutions[quality] || 640;
  }
  
  private getVideoHeight(quality: string): number {
    const resolutions = {
      'low': 240,
      'medium': 480,
      'high': 720,
      'ultra': 1080
    };
    return resolutions[quality] || 480;
  }
  
  private getFrameRate(quality: string): number {
    const frameRates = {
      'low': 15,
      'medium': 24,
      'high': 30,
      'ultra': 60
    };
    return frameRates[quality] || 24;
  }
  
  /**
   * Démarre un appel vidéo/audio
   */
  async startCall(roomId: string, options: CallOptions): Promise<void> {
    try {
      // Obtenir le flux local
      await this.getUserMedia(options);
      
      // Rejoindre la room
      this.currentRoomId = roomId;
      this.sendSignalingMessage('join-room', {
        roomId: roomId,
        roomType: options.video ? 'video-call' : 'audio-call',
        maxParticipants: 10
      });
      
      this.isInCall = true;
      console.log(`[WebRTC] Appel démarré dans la room ${roomId}`);
    } catch (error) {
      console.error('[WebRTC] Erreur lors du démarrage de l\'appel:', error);
      throw error;
    }
  }
  
  /**
   * Rejoint un appel existant
   */
  async joinCall(roomId: string, options: CallOptions): Promise<void> {
    try {
      // Obtenir le flux local
      await this.getUserMedia(options);
      
      // Rejoindre la room
      this.currentRoomId = roomId;
      this.sendSignalingMessage('join-room', {
        roomId: roomId,
        roomType: options.video ? 'video-call' : 'audio-call'
      });
      
      this.isInCall = true;
      console.log(`[WebRTC] Appel rejoint dans la room ${roomId}`);
    } catch (error) {
      console.error('[WebRTC] Erreur lors de la participation à l\'appel:', error);
      throw error;
    }
  }
  
  /**
   * Termine l'appel
   */
  endCall(): void {
    if (this.currentRoomId) {
      this.sendSignalingMessage('leave-room', {});
    }
    
    // Nettoyer les connexions peer
    this.peerConnections.forEach((peerConn, peerId) => {
      this.closePeerConnection(peerId);
    });
    
    // Arrêter les flux locaux
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
    
    if (this.screenStream) {
      this.screenStream.getTracks().forEach(track => track.stop());
      this.screenStream = null;
    }
    
    this.currentRoomId = null;
    this.isInCall = false;
    
    this.emit('callEnded');
    console.log('[WebRTC] Appel terminé');
  }
  
  /**
   * Démarre un live shopping
   */
  async startLiveShopping(options: LiveShoppingOptions): Promise<void> {
    try {
      // Obtenir le flux avec écran + caméra
      await this.getUserMedia({
        video: true,
        audio: true,
        screenShare: false,
        quality: 'high'
      });
      
      // Envoyer la demande de démarrage
      this.sendSignalingMessage('live-start', {
        title: options.title,
        description: options.description,
        products: options.products
      });
      
      this.isLiveShopping = true;
      console.log('[WebRTC] Live shopping démarré');
    } catch (error) {
      console.error('[WebRTC] Erreur lors du démarrage du live shopping:', error);
      throw error;
    }
  }
  
  /**
   * Rejoint un live shopping
   */
  async joinLiveShopping(roomId: string): Promise<void> {
    try {
      // Rejoindre en tant que viewer
      this.sendSignalingMessage('live-join', { roomId });
      
      // Pas besoin de flux pour un viewer
      console.log(`[WebRTC] Live shopping rejoint: ${roomId}`);
    } catch (error) {
      console.error('[WebRTC] Erreur lors de la participation au live shopping:', error);
      throw error;
    }
  }
  
  /**
   * Partage l'écran
   */
  async startScreenShare(): Promise<MediaStream> {
    try {
      this.screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: 'always',
          displaySurface: 'monitor'
        },
        audio: true
      });
      
      // Remplacer la vidéo dans les connexions existantes
      this.peerConnections.forEach((peerConn) => {
        const videoSender = peerConn.pc.getSenders().find(sender => 
          sender.track && sender.track.kind === 'video'
        );
        
        if (videoSender && this.screenStream) {
          const videoTrack = this.screenStream.getVideoTracks()[0];
          videoSender.replaceTrack(videoTrack);
        }
      });
      
      this.emit('screenShareStarted', this.screenStream);
      console.log('[WebRTC] Partage d\'écran démarré');
      
      return this.screenStream;
    } catch (error) {
      console.error('[WebRTC] Erreur lors du partage d\'écran:', error);
      throw error;
    }
  }
  
  /**
   * Arrête le partage d'écran
   */
  stopScreenShare(): void {
    if (this.screenStream) {
      this.screenStream.getTracks().forEach(track => track.stop());
      this.screenStream = null;
      
      // Revenir à la caméra
      if (this.localStream) {
        this.peerConnections.forEach((peerConn) => {
          const videoSender = peerConn.pc.getSenders().find(sender => 
            sender.track && sender.track.kind === 'video'
          );
          
          if (videoSender && this.localStream) {
            const videoTrack = this.localStream.getVideoTracks()[0];
            if (videoTrack) {
              videoSender.replaceTrack(videoTrack);
            }
          }
        });
      }
      
      this.emit('screenShareStopped');
      console.log('[WebRTC] Partage d\'écran arrêté');
    }
  }
  
  /**
   * Crée une connexion peer
   */
  private createPeerConnection(peerId: string, isInitiator: boolean = false): RTCPeerConnection {
    const pc = new RTCPeerConnection(this.rtcConfig);
    
    const peerConn: PeerConnection = {
      id: peerId,
      pc: pc,
      isInitiator: isInitiator
    };
    
    this.peerConnections.set(peerId, peerConn);
    
    // Gérer les candidats ICE
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendSignalingMessage('ice-candidate', {
          targetPeerId: peerId,
          candidate: event.candidate
        });
      }
    };
    
    // Gérer les flux entrants
    pc.ontrack = (event) => {
      console.log(`[WebRTC] Flux reçu de ${peerId}:`, event.track.kind);
      this.emit('remoteStream', { peerId, stream: event.streams[0] });
    };
    
    // Gérer l'état de connexion
    pc.onconnectionstatechange = () => {
      console.log(`[WebRTC] État connexion ${peerId}:`, pc.connectionState);
      this.emit('connectionStateChange', { peerId, state: pc.connectionState });
    };
    
    // Ajouter le flux local
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        pc.addTrack(track, this.localStream!);
      });
    }
    
    return pc;
  }
  
  /**
   * Gère la réponse de room rejoint
   */
  private handleRoomJoined(data: any): void {
    this.currentRoomId = data.roomId;
    this.emit('roomJoined', data);
  }
  
  /**
   * Gère l'arrivée d'un nouveau peer
   */
  private handlePeerJoined(data: any): void {
    const { peerId } = data;
    
    // Créer une connexion avec le nouveau peer
    const pc = this.createPeerConnection(peerId, true);
    
    // Créer une offre
    pc.createOffer().then(offer => {
      return pc.setLocalDescription(offer);
    }).then(() => {
      this.sendSignalingMessage('offer', {
        targetPeerId: peerId,
        offer: pc.localDescription
      });
    });
    
    this.emit('peerJoined', data);
  }
  
  /**
   * Gère le départ d'un peer
   */
  private handlePeerLeft(data: any): void {
    const { peerId } = data;
    this.closePeerConnection(peerId);
    this.emit('peerLeft', data);
  }
  
  /**
   * Gère une offre WebRTC
   */
  private handleOffer(data: any): void {
    const { peerId, offer } = data;
    
    const pc = this.createPeerConnection(peerId, false);
    
    pc.setRemoteDescription(new RTCSessionDescription(offer)).then(() => {
      return pc.createAnswer();
    }).then(answer => {
      return pc.setLocalDescription(answer);
    }).then(() => {
      this.sendSignalingMessage('answer', {
        targetPeerId: peerId,
        answer: pc.localDescription
      });
    });
  }
  
  /**
   * Gère une réponse WebRTC
   */
  private handleAnswer(data: any): void {
    const { peerId, answer } = data;
    const peerConn = this.peerConnections.get(peerId);
    
    if (peerConn) {
      peerConn.pc.setRemoteDescription(new RTCSessionDescription(answer));
    }
  }
  
  /**
   * Gère les candidats ICE
   */
  private handleIceCandidate(data: any): void {
    const { peerId, candidate } = data;
    const peerConn = this.peerConnections.get(peerId);
    
    if (peerConn) {
      peerConn.pc.addIceCandidate(new RTCIceCandidate(candidate));
    }
  }
  
  /**
   * Ferme une connexion peer
   */
  private closePeerConnection(peerId: string): void {
    const peerConn = this.peerConnections.get(peerId);
    
    if (peerConn) {
      peerConn.pc.close();
      this.peerConnections.delete(peerId);
      console.log(`[WebRTC] Connexion avec ${peerId} fermée`);
    }
  }
  
  /**
   * Gère le démarrage d'un live shopping
   */
  private handleLiveStarted(data: any): void {
    this.currentRoomId = data.roomId;
    this.emit('liveStarted', data);
  }
  
  /**
   * Gère la participation à un live shopping
   */
  private handleLiveJoined(data: any): void {
    this.currentRoomId = data.roomId;
    this.emit('liveJoined', data);
  }
  
  /**
   * Gère la fin d'un live shopping
   */
  private handleLiveEnded(data: any): void {
    this.isLiveShopping = false;
    this.currentRoomId = null;
    this.emit('liveEnded', data);
  }
  
  /**
   * Système d'événements
   */
  on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }
  
  off(event: string, callback: Function): void {
    if (this.eventListeners.has(event)) {
      const callbacks = this.eventListeners.get(event)!;
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }
  
  private emit(event: string, data?: any): void {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event)!.forEach(callback => {
        callback(data);
      });
    }
  }
  
  /**
   * Getters d'état
   */
  get isCallActive(): boolean {
    return this.isInCall;
  }
  
  get isLiveActive(): boolean {
    return this.isLiveShopping;
  }
  
  get currentRoom(): string | null {
    return this.currentRoomId;
  }
  
  get localMediaStream(): MediaStream | null {
    return this.localStream;
  }
  
  /**
   * Nettoyage
   */
  destroy(): void {
    this.endCall();
    
    if (this.signalingSocket) {
      this.signalingSocket.close();
      this.signalingSocket = null;
    }
    
    this.eventListeners.clear();
    console.log('[WebRTC] Service détruit');
  }
}

// Export singleton
export const webRTCService = new WebRTCService();
export default WebRTCService;