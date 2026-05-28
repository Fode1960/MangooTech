import { useState, useEffect, useCallback } from 'react';
import { unifiedCommunicationService } from '../services/UnifiedCommunicationService';

export const useUnifiedCommunication = () => {
  const [service] = useState(() => unifiedCommunicationService);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [currentCall, setCurrentCall] = useState<any>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  useEffect(() => {
    // Écouter les changements de statut
    const handleStatusChange = (status: any) => {
      setConnectionStatus(status.connectionState);
      setCurrentCall(status.currentCall);
    };

    service.on('statusChanged', handleStatusChange);
    
    return () => {
      service.off('statusChanged', handleStatusChange);
    };
  }, [service]);

  const initialize = useCallback(async (boutiqueId: string) => {
    try {
      setConnectionStatus('connecting');
      await service.initialize(boutiqueId);
      setConnectionStatus('connected');
    } catch (error) {
      console.error('Erreur d\'initialisation:', error);
      setConnectionStatus('disconnected');
    }
  }, [service]);

  const makeCall = useCallback(async (number: string, type: 'audio' | 'video' = 'audio') => {
    try {
      const callId = await service.makeCall(number, type);
      return callId;
    } catch (error) {
      console.error('Erreur lors de l\'appel:', error);
      throw error;
    }
  }, [service]);

  const answerCall = useCallback(async (callId: string) => {
    try {
      await service.answerCall(callId);
    } catch (error) {
      console.error('Erreur lors de la réponse:', error);
      throw error;
    }
  }, [service]);

  const endCall = useCallback(async (callId: string) => {
    try {
      await service.endCall(callId);
    } catch (error) {
      console.error('Erreur lors de la fin d\'appel:', error);
      throw error;
    }
  }, [service]);

  const muteAudio = useCallback(async (mute: boolean) => {
    try {
      await service.setAudioMuted(mute);
      setIsMuted(mute);
    } catch (error) {
      console.error('Erreur lors du mute:', error);
      throw error;
    }
  }, [service]);

  const toggleVideo = useCallback(async (off: boolean) => {
    try {
      if (off) {
        await service.stopVideo();
      } else {
        await service.startVideo();
      }
      setIsVideoOff(off);
    } catch (error) {
      console.error('Erreur lors du toggle vidéo:', error);
      throw error;
    }
  }, [service]);

  const shareScreen = useCallback(async () => {
    try {
      await service.shareScreen();
    } catch (error) {
      console.error('Erreur lors du partage d\'écran:', error);
      throw error;
    }
  }, [service]);

  const startLiveShopping = useCallback(async (title: string) => {
    try {
      await service.startLiveShopping(title);
    } catch (error) {
      console.error('Erreur lors du démarrage du live shopping:', error);
      throw error;
    }
  }, [service]);

  const stopLiveShopping = useCallback(async () => {
    try {
      await service.stopLiveShopping();
    } catch (error) {
      console.error('Erreur lors de l\'arrêt du live shopping:', error);
      throw error;
    }
  }, [service]);

  return {
    // État
    connectionStatus,
    currentCall,
    isMuted,
    isVideoOff,
    
    // Méthodes
    initialize,
    makeCall,
    answerCall,
    endCall,
    muteAudio,
    toggleVideo,
    shareScreen,
    startLiveShopping,
    stopLiveShopping,
    
    // Service
    service
  };
};