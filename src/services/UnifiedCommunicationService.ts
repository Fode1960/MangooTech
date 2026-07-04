/**
 * Service de Communication Unifiée
 * Intègre WebRTC + VoIP/SIP dans une seule interface
 * Pour la Mini-Boutique Multi-tenant
 */

import { webRTCService } from './WebRTCService';

export interface UnifiedCallOptions {
  target: string; // Numéro SIP ou ID WebRTC
  type: 'audio' | 'video' | 'phone'; // phone = appel téléphonique SIP
  quality?: 'low' | 'medium' | 'high' | 'ultra';
  screenShare?: boolean;
}

export interface UnifiedMessage {
  id: string;
  type: 'call' | 'message' | 'file';
  from: string;
  to: string;
  content: any;
  timestamp: Date;
  direction: 'inbound' | 'outbound';
}

export interface BoutiqueCommunicationConfig {
  boutiqueId: string;
  sipNumber?: string; // Numéro de téléphone attribué
  webrtcRoom?: string; // Room WebRTC
  maxConcurrentCalls: number;
  callForwarding?: string;
  voicemailEnabled: boolean;
}

type UnifiedEventListener = (data?: unknown) => void;

class UnifiedCommunicationService {
  private currentUser: any = null;
  private boutiqueConfigs: Map<string, BoutiqueCommunicationConfig> = new Map();
  private activeCalls: Map<string, any> = new Map();
  private eventListeners: Map<string, UnifiedEventListener[]> = new Map();
  private gatewayConnection: WebSocket | null = null;
  private isGatewayConnected = false;
  
  // Configuration du gateway
  private readonly GATEWAY_URL = 'ws://localhost:9091';
  private readonly GATEWAY_API = 'http://localhost:9091/api/gateway';

  constructor() {
    this.initializeEventListeners();
  }

  /**
   * Initialiser les écouteurs d'événements
   */
  private initializeEventListeners(): void {
    this.eventListeners.set('callStarted', []);
    this.eventListeners.set('callEnded', []);
    this.eventListeners.set('incomingCall', []);
    this.eventListeners.set('gatewayReady', []);
    this.eventListeners.set('gatewayDisconnected', []);
    this.eventListeners.set('statusChanged', []);
  }

  /**
   * Initialiser le service avec l'utilisateur actuel
   */
  async initialize(user: any): Promise<void> {
    this.currentUser = user;
    
    try {
      // Initialiser WebRTC
      await webRTCService.initialize(user.id, user.role);
      
      // Se connecter au gateway
      await this.connectToGateway();
      
      // Charger les configurations de communication
      await this.loadBoutiqueConfigurations();
      
      console.log('[UNIFIED] Service de communication unifiée initialisé');
    } catch (error) {
      console.error('[UNIFIED] Erreur d\'initialisation:', error);
      throw error;
    }
  }

  private async loadBoutiqueConfigurations(): Promise<void> {
    if (!this.currentUser?.id) return;
    const boutiqueId = String(this.currentUser.id);
    if (!this.boutiqueConfigs.has(boutiqueId)) {
      this.boutiqueConfigs.set(boutiqueId, {
        boutiqueId,
        webrtcRoom: `boutique_${boutiqueId}`,
        maxConcurrentCalls: 3,
        voicemailEnabled: true,
      });
    }
  }

  /**
   * Se connecter au SIP-WebRTC Gateway
   */
  private connectToGateway(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.gatewayConnection = new WebSocket(this.GATEWAY_URL);
        
        this.gatewayConnection.onopen = () => {
          console.log('[UNIFIED] Connecté au gateway');
          this.isGatewayConnected = true;
          
          // S'enregistrer
          this.sendGatewayMessage('register', {
            userId: this.currentUser.id,
            userRole: this.currentUser.role,
            userName: this.currentUser.name || this.currentUser.email
          });
          
          resolve();
        };
        
        this.gatewayConnection.onmessage = (event) => {
          this.handleGatewayMessage(JSON.parse(event.data));
        };
        
        this.gatewayConnection.onclose = () => {
          console.log('[UNIFIED] Déconnecté du gateway');
          this.isGatewayConnected = false;
          this.emit('gatewayDisconnected');
        };
        
        this.gatewayConnection.onerror = (error) => {
          console.error('[UNIFIED] Erreur gateway:', error);
          reject(error);
        };
        
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Envoyer un message au gateway
   */
  private sendGatewayMessage(type: string, data: any): void {
    if (this.gatewayConnection && this.isGatewayConnected) {
      this.gatewayConnection.send(JSON.stringify({ type, data }));
    }
  }

  /**
   * Traiter les messages du gateway
   */
  private handleGatewayMessage(message: any): void {
    const { type, data } = message;
    
    switch (type) {
      case 'incoming-call':
        this.handleIncomingCall(data);
        break;
        
      case 'call-ended':
        this.handleCallEnded(data);
        break;
        
      case 'gateway-ready':
        this.emit('gatewayReady', data);
        break;
        
      default:
        console.warn('[UNIFIED] Message gateway inconnu:', type);
    }
  }

  /**
   * Configurer la communication pour une boutique
   */
  async setupBoutiqueCommunication(boutiqueId: string, config: Partial<BoutiqueCommunicationConfig>): Promise<BoutiqueCommunicationConfig> {
    const fullConfig: BoutiqueCommunicationConfig = {
      boutiqueId,
      sipNumber: config.sipNumber || this.generateSipNumber(boutiqueId),
      webrtcRoom: config.webrtcRoom || `boutique_${boutiqueId}`,
      maxConcurrentCalls: config.maxConcurrentCalls || 5,
      callForwarding: config.callForwarding,
      voicemailEnabled: config.voicemailEnabled !== false
    };
    
    this.boutiqueConfigs.set(boutiqueId, fullConfig);
    
    // Créer la room WebRTC si nécessaire
    if (fullConfig.webrtcRoom) {
      await this.createWebRTCRoom(fullConfig.webrtcRoom);
    }
    
    console.log(`[UNIFIED] Communication configurée pour boutique ${boutiqueId}`);
    return fullConfig;
  }

  /**
   * Générer un numéro SIP unique pour une boutique
   */
  private generateSipNumber(boutiqueId: string): string {
    // Convertir l'ID boutique en numéro de téléphone
    // Par exemple: "boutique_123" → "100123"
    const numericId = boutiqueId.replace(/\D/g, '');
    return `100${numericId.padStart(3, '0')}`.slice(0, 6);
  }

  /**
   * Créer une room WebRTC
   */
  private async createWebRTCRoom(roomId: string): Promise<void> {
    // La room sera créée automatiquement lors du premier appel
    console.log(`[UNIFIED] Room WebRTC préparée: ${roomId}`);
  }

  /**
   * Effectuer un appel unifié
   */
  async makeCall(options: UnifiedCallOptions | string, type?: 'audio' | 'video' | 'phone'): Promise<string> {
    const normalizedOptions: UnifiedCallOptions =
      typeof options === 'string'
        ? {
            target: options,
            type: type || 'audio',
          }
        : options;
    const callId = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`[UNIFIED] Appel unifié: ${this.currentUser.id} → ${normalizedOptions.target} (${normalizedOptions.type})`);
    
    try {
      if (normalizedOptions.type === 'phone') {
        // Appel téléphonique via SIP
        return await this.makeSIPCall(callId, normalizedOptions);
      } else {
        // Appel WebRTC
        return await this.makeWebRTCCall(callId, normalizedOptions);
      }
    } catch (error) {
      console.error('[UNIFIED] Erreur lors de l\'appel:', error);
      throw error;
    }
  }

  /**
   * Appel WebRTC
   */
  private async makeWebRTCCall(callId: string, options: UnifiedCallOptions): Promise<string> {
    const roomId = this.findRoomForTarget(options.target);
    
    const callOptions = {
      video: options.type === 'video',
      audio: true,
      screenShare: options.screenShare || false,
      quality: options.quality || 'high'
    };
    
    await webRTCService.startCall(roomId, callOptions);
    
    this.activeCalls.set(callId, {
      id: callId,
      type: 'webrtc',
      target: options.target,
      roomId: roomId,
      startTime: new Date(),
      status: 'active'
    });
    
    this.emit('callStarted', { callId, type: 'webrtc', target: options.target });
    
    return callId;
  }

  /**
   * Appel SIP (téléphone)
   */
  private async makeSIPCall(callId: string, options: UnifiedCallOptions): Promise<string> {
    // Utiliser le gateway pour l'appel SIP
    this.sendGatewayMessage('make-call', {
      callId: callId,
      from: this.currentUser.id,
      to: options.target,
      type: 'sip'
    });
    
    this.activeCalls.set(callId, {
      id: callId,
      type: 'sip',
      target: options.target,
      startTime: new Date(),
      status: 'connecting'
    });
    
    this.emit('callStarted', { callId, type: 'sip', target: options.target });
    
    return callId;
  }

  /**
   * Recevoir un appel
   */
  private handleIncomingCall(callData: any): void {
    console.log(`[UNIFIED] Appel entrant de ${callData.from}`);
    
    this.emit('incomingCall', {
      callId: callData.callId,
      from: callData.from,
      type: callData.type || 'unknown',
      timestamp: new Date()
    });
  }

  /**
   * Terminer un appel
   */
  async endCall(callId: string, reason: string = 'user-ended'): Promise<void> {
    const call = this.activeCalls.get(callId);
    if (!call) {
      console.warn(`[UNIFIED] Appel inconnu: ${callId}`);
      return;
    }
    
    console.log(`[UNIFIED] Fin d'appel: ${callId} (${reason})`);
    
    if (call.type === 'webrtc') {
      webRTCService.endCall();
    } else if (call.type === 'sip') {
      this.sendGatewayMessage('end-call', { callId, reason });
    }
    
    call.status = 'ended';
    call.endTime = new Date();
    call.duration = call.endTime.getTime() - new Date(call.startTime).getTime();
    
    this.emit('callEnded', { callId, reason, duration: call.duration });
    
    // Supprimer après un délai
    setTimeout(() => {
      this.activeCalls.delete(callId);
    }, 5000);
  }

  /**
   * Gérer la fin d'un appel
   */
  private handleCallEnded(callData: any): void {
    const call = this.activeCalls.get(callData.callId);
    if (call) {
      call.status = 'ended';
      call.endTime = new Date();
      call.duration = callData.duration || (call.endTime.getTime() - new Date(call.startTime).getTime());
      
      this.emit('callEnded', {
        callId: callData.callId,
        reason: callData.reason,
        duration: call.duration
      });
    }
  }

  /**
   * Trouver la room pour une cible
   */
  private findRoomForTarget(target: string): string {
    // Si c'est un ID de boutique, utiliser sa room
    const config = this.boutiqueConfigs.get(target);
    if (config && config.webrtcRoom) {
      return config.webrtcRoom;
    }
    
    // Si c'est un numéro de téléphone, chercher la boutique correspondante
    for (const [boutiqueId, boutiqueConfig] of this.boutiqueConfigs) {
      if (boutiqueConfig.sipNumber === target) {
        return boutiqueConfig.webrtcRoom || `boutique_${boutiqueId}`;
      }
    }
    
    // Sinon, créer une room générique
    return `call_${target}_${Date.now()}`;
  }

  /**
   * Obtenir les statistiques
   */
  getStats() {
    const webrtcStats = webRTCService.isCallActive ? {
      isActive: true,
      currentRoom: webRTCService.currentRoom,
      localStream: !!webRTCService.localMediaStream
    } : { isActive: false };
    
    const activeCalls = Array.from(this.activeCalls.values()).map(call => ({
      id: call.id,
      type: call.type,
      target: call.target,
      status: call.status,
      duration: call.duration || (call.endTime ? new Date(call.endTime).getTime() - new Date(call.startTime).getTime() : Date.now() - new Date(call.startTime).getTime())
    }));
    
    return {
      gatewayConnected: this.isGatewayConnected,
      webrtc: webrtcStats,
      activeCalls: activeCalls,
      totalCalls: this.activeCalls.size,
      boutiqueConfigs: Array.from(this.boutiqueConfigs.values())
    };
  }

  async answerCall(callId: string): Promise<void> {
    const call = this.activeCalls.get(callId);
    if (call) {
      call.status = 'active';
    }
    this.emit('statusChanged', {
      connectionState: this.isGatewayConnected ? 'connected' : 'disconnected',
      currentCall: call || null,
    });
  }

  async getPhoneNumbers(_vendorId?: string): Promise<Array<{
    id: string;
    number: string;
    extension: string;
    status: 'active' | 'inactive' | 'busy';
    assignedTo: string;
    type: 'main' | 'department' | 'mobile';
    voicemailEnabled: boolean;
  }>> {
    return Array.from(this.boutiqueConfigs.values()).map((config) => ({
      id: config.boutiqueId,
      number: config.sipNumber || this.generateSipNumber(config.boutiqueId),
      extension: String(config.sipNumber || this.generateSipNumber(config.boutiqueId)).slice(-3),
      status: 'active',
      assignedTo: config.boutiqueId,
      type: 'main',
      voicemailEnabled: config.voicemailEnabled,
    }));
  }

  async getCallHistory(_vendorId?: string): Promise<any[]> {
    return Array.from(this.activeCalls.values());
  }

  async assignPhoneNumber(
    boutiqueIdOrPayload: string | { vendorId: string; extension: string; type: 'main' | 'department' | 'mobile' },
    sipNumber?: string,
  ): Promise<void> {
    const boutiqueId = typeof boutiqueIdOrPayload === 'string' ? boutiqueIdOrPayload : boutiqueIdOrPayload.vendorId;
    const resolvedSipNumber =
      typeof boutiqueIdOrPayload === 'string'
        ? (sipNumber || this.generateSipNumber(boutiqueId))
        : `${this.generateSipNumber(boutiqueId)}${boutiqueIdOrPayload.extension || ''}`;
    const existing = this.boutiqueConfigs.get(boutiqueId);
    this.boutiqueConfigs.set(boutiqueId, {
      boutiqueId,
      webrtcRoom: existing?.webrtcRoom || `boutique_${boutiqueId}`,
      maxConcurrentCalls: existing?.maxConcurrentCalls || 3,
      voicemailEnabled: existing?.voicemailEnabled ?? true,
      ...existing,
      sipNumber: resolvedSipNumber,
    });
  }

  async updatePhoneNumber(boutiqueId: string, next: string | { status?: string; sipNumber?: string }): Promise<void> {
    const existing = this.boutiqueConfigs.get(boutiqueId);
    await this.assignPhoneNumber(
      boutiqueId,
      typeof next === 'string' ? next : (next.sipNumber || existing?.sipNumber || this.generateSipNumber(boutiqueId)),
    );
  }

  async setAudioMuted(muted: boolean): Promise<void> {
    if (!webRTCService.localMediaStream) return;
    webRTCService.localMediaStream.getAudioTracks().forEach((track) => {
      track.enabled = !muted;
    });
  }

  async stopVideo(): Promise<void> {
    webRTCService.localMediaStream?.getVideoTracks().forEach((track) => {
      track.enabled = false;
    });
  }

  async startVideo(): Promise<void> {
    webRTCService.localMediaStream?.getVideoTracks().forEach((track) => {
      track.enabled = true;
    });
  }

  async shareScreen(): Promise<void> {
    await webRTCService.shareScreen();
  }

  async startLiveShopping(title: string): Promise<void> {
    await webRTCService.startLiveShopping({
      title,
      description: title,
      products: [],
    });
  }

  async stopLiveShopping(): Promise<void> {
    webRTCService.endCall();
  }

  /**
   * Système d'événements
   */
  on(event: string, callback: UnifiedEventListener): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  off(event: string, callback: UnifiedEventListener): void {
    if (this.eventListeners.has(event)) {
      const callbacks = this.eventListeners.get(event)!;
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private emit(event: string, data?: unknown): void {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event)!.forEach(callback => {
        callback(data);
      });
    }
  }

  /**
   * Nettoyer
   */
  destroy(): void {
    // Terminer tous les appels actifs
    this.activeCalls.forEach((call, callId) => {
      this.endCall(callId, 'service-shutdown');
    });
    
    // Déconnecter le gateway
    if (this.gatewayConnection) {
      this.gatewayConnection.close();
    }
    
    // Détruire WebRTC
    webRTCService.destroy();
    
    this.eventListeners.clear();
    console.log('[UNIFIED] Service détruit');
  }
}

// Export singleton
export const unifiedCommunicationService = new UnifiedCommunicationService();
export default UnifiedCommunicationService;
