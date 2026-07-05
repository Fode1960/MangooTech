/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useReducer, useEffect, useMemo, ReactNode } from 'react';
import WebRTCService, { CallConfig, CallSession, CallParticipant } from '../services/WebRTCService';

interface VideoCallState {
  isInCall: boolean;
  currentSession: CallSession | null;
  localStream: MediaStream | null;
  remoteStreams: Map<string, MediaStream>;
  isMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing: boolean;
  callDuration: number;
  voipConnectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
}

interface VideoCallContextType extends VideoCallState {
  webRTCService: WebRTCService | null;
  startCall: (participantId: string, type: 'video' | 'audio') => Promise<void>;
  answerCall: (participantId: string, offer: RTCSessionDescriptionInit) => Promise<void>;
  endCall: () => void;
  toggleMute: () => void;
  toggleVideo: () => void;
  shareScreen: () => Promise<void>;
  connectToVoIP: (credentials: { username: string; password: string }) => Promise<void>;
  getCallStats: () => Promise<any>;
}

const initialState: VideoCallState = {
  isInCall: false,
  currentSession: null,
  localStream: null,
  remoteStreams: new Map(),
  isMuted: false,
  isVideoOff: false,
  isScreenSharing: false,
  callDuration: 0,
  voipConnectionStatus: 'disconnected'
};

type VideoCallAction = 
  | { type: 'CALL_STARTED'; payload: CallSession }
  | { type: 'CALL_ENDED' }
  | { type: 'LOCAL_STREAM_READY'; payload: MediaStream }
  | { type: 'REMOTE_STREAM_ADDED'; payload: { participantId: string; stream: MediaStream } }
  | { type: 'REMOTE_STREAM_REMOVED'; payload: string }
  | { type: 'TOGGLE_MUTE'; payload: boolean }
  | { type: 'TOGGLE_VIDEO'; payload: boolean }
  | { type: 'SCREEN_SHARE_STARTED' }
  | { type: 'SCREEN_SHARE_STOPPED' }
  | { type: 'CALL_DURATION_UPDATE'; payload: number }
  | { type: 'VOIP_STATUS_CHANGED'; payload: 'disconnected' | 'connecting' | 'connected' | 'error' }
  | { type: 'VOIP_CONNECTED' }
  | { type: 'VOIP_DISCONNECTED' }
  | { type: 'VOIP_ERROR'; payload: string };

function videoCallReducer(state: VideoCallState, action: VideoCallAction): VideoCallState {
  switch (action.type) {
    case 'CALL_STARTED':
      return {
        ...state,
        isInCall: true,
        currentSession: action.payload,
        callDuration: 0
      };
    
    case 'CALL_ENDED':
      return {
        ...state,
        isInCall: false,
        currentSession: null,
        localStream: null,
        remoteStreams: new Map(),
        isScreenSharing: false,
        callDuration: 0
      };
    
    case 'LOCAL_STREAM_READY':
      return {
        ...state,
        localStream: action.payload
      };
    
    case 'REMOTE_STREAM_ADDED': {
      const newStreams = new Map(state.remoteStreams);
      newStreams.set(action.payload.participantId, action.payload.stream);
      return {
        ...state,
        remoteStreams: newStreams
      };
    }
    
    case 'REMOTE_STREAM_REMOVED': {
      const updatedStreams = new Map(state.remoteStreams);
      updatedStreams.delete(action.payload);
      return {
        ...state,
        remoteStreams: updatedStreams
      };
    }
    
    case 'TOGGLE_MUTE':
      return {
        ...state,
        isMuted: action.payload
      };
    
    case 'TOGGLE_VIDEO':
      return {
        ...state,
        isVideoOff: action.payload
      };
    
    case 'SCREEN_SHARE_STARTED':
      return {
        ...state,
        isScreenSharing: true
      };
    
    case 'SCREEN_SHARE_STOPPED':
      return {
        ...state,
        isScreenSharing: false
      };
    
    case 'CALL_DURATION_UPDATE':
      return {
        ...state,
        callDuration: action.payload
      };
    
    case 'VOIP_STATUS_CHANGED':
      return {
        ...state,
        voipConnectionStatus: action.payload
      };
    
    default:
      return state;
  }
}

const VideoCallContext = createContext<VideoCallContextType | undefined>(undefined);

export const VideoCallProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(videoCallReducer, initialState);
  
  // Configuration WebRTC avec serveurs ICE
  const callConfig: CallConfig = useMemo(() => ({
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      // Ajoutez vos serveurs TURN ici si nÃ©cessaire
      // { urls: 'turn:your-turn-server.com:3478', username: 'user', credential: 'pass' }
    ],
    voipServer: {
      host: '194.163.190.74', // Votre serveur Contabo
      port: 5060, // Port UDP
      protocol: 'udp'
    }
  }), []);

  const webRTCService = useMemo(() => new WebRTCService(callConfig), [callConfig]);

  // Timer pour la durée de l'appel
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (state.isInCall) {
      interval = setInterval(() => {
        dispatch({ type: 'CALL_DURATION_UPDATE', payload: state.callDuration + 1 });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [state.isInCall, state.callDuration]);

  // Configuration des écouteurs WebRTC
  useEffect(() => {
    if (!webRTCService) return;

    const handleLocalStreamReady = (stream: MediaStream) => {
      dispatch({ type: 'LOCAL_STREAM_READY', payload: stream });
    };

    const handleCallStarted = ({ session }: { session: CallSession }) => {
      dispatch({ type: 'CALL_STARTED', payload: session });
    };

    const handleRemoteStream = ({ participantId, stream }: { participantId: string; stream: MediaStream }) => {
      dispatch({ type: 'REMOTE_STREAM_ADDED', payload: { participantId, stream } });
    };

    const handleCallEnded = () => {
      dispatch({ type: 'CALL_ENDED' });
    };

    const handleScreenShareStarted = () => {
      dispatch({ type: 'SCREEN_SHARE_STARTED' });
    };

    const handleScreenShareStopped = () => {
      dispatch({ type: 'SCREEN_SHARE_STOPPED' });
    };

    webRTCService.on('localStreamReady', handleLocalStreamReady);
    webRTCService.on('callStarted', handleCallStarted);
    webRTCService.on('remoteStream', handleRemoteStream);
    webRTCService.on('callEnded', handleCallEnded);
    webRTCService.on('screenShareStarted', handleScreenShareStarted);
    webRTCService.on('screenShareStopped', handleScreenShareStopped);

    return () => {
      webRTCService.off('localStreamReady', handleLocalStreamReady);
      webRTCService.off('callStarted', handleCallStarted);
      webRTCService.off('remoteStream', handleRemoteStream);
      webRTCService.off('callEnded', handleCallEnded);
      webRTCService.off('screenShareStarted', handleScreenShareStarted);
      webRTCService.off('screenShareStopped', handleScreenShareStopped);
    };
  }, [webRTCService]);

  const startCall = async (participantId: string, type: 'video' | 'audio') => {
    try {
      await webRTCService.startCall(participantId, type);
    } catch (error) {
      console.error('Erreur lors du démarrage de l\'appel:', error);
      throw error;
    }
  };

  const answerCall = async (participantId: string, offer: RTCSessionDescriptionInit) => {
    try {
      await webRTCService.answerCall(participantId, offer);
    } catch (error) {
      console.error('Erreur lors de la réponse à l\'appel:', error);
      throw error;
    }
  };

  const endCall = () => {
    webRTCService.endCall();
  };

  const toggleMute = () => {
    const isMuted = webRTCService.toggleMute();
    dispatch({ type: 'TOGGLE_MUTE', payload: isMuted });
  };

  const toggleVideo = () => {
    const isVideoOff = webRTCService.toggleVideo();
    dispatch({ type: 'TOGGLE_VIDEO', payload: isVideoOff });
  };

  const shareScreen = async () => {
    try {
      await webRTCService.shareScreen();
    } catch (error) {
      console.error('Erreur lors du partage d\'écran:', error);
      throw error;
    }
  };

  const connectToVoIP = async (credentials: { username: string; password: string }) => {
    dispatch({ type: 'VOIP_STATUS_CHANGED', payload: 'connecting' });
    try {
      await webRTCService.integrateWithVoIP(credentials);
      dispatch({ type: 'VOIP_STATUS_CHANGED', payload: 'connected' });
    } catch (error) {
      dispatch({ type: 'VOIP_STATUS_CHANGED', payload: 'error' });
      console.error('Erreur de connexion VoIP:', error);
      throw error;
    }
  };

  const getCallStats = async () => {
    return await webRTCService.getCallStats();
  };

  const contextValue: VideoCallContextType = {
    ...state,
    webRTCService,
    startCall,
    answerCall,
    endCall,
    toggleMute,
    toggleVideo,
    shareScreen,
    connectToVoIP,
    getCallStats
  };

  return (
    <VideoCallContext.Provider value={contextValue}>
      {children}
    </VideoCallContext.Provider>
  );
};

export const useVideoCall = () => {
  const context = useContext(VideoCallContext);
  if (context === undefined) {
    throw new Error('useVideoCall doit être utilisé dans un VideoCallProvider');
  }
  return context;
};
