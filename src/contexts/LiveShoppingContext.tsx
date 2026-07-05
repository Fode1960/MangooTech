/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

interface ChatMessage {
  id: string;
  from: string;
  message: string;
  timestamp: Date;
  roomId: string;
}

interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  description: string;
}

interface LiveShoppingContextType {
  messages: ChatMessage[];
  sendMessage: (message: string, from: string, roomId: string) => void;
  clearMessages: (roomId: string) => void;
  currentProduct: any;
  setCurrentProduct: (product: any) => void;
  selectProduct: (product: any) => void;
  products: Product[];
  isLive: boolean;
  setIsLive: (live: boolean) => void;
  viewers: number;
  setViewers: (count: number) => void;
  setUserRole: (role: 'vendor' | 'client') => void;
  participantId: string;
  currentRoomId: string;
  joinRoom: (roomId: string, userId: string, role: 'vendor' | 'client', roomInfo?: any) => void;
  leaveRoom: () => void;
}

const LiveShoppingContext = createContext<LiveShoppingContextType | undefined>(undefined);

export const useLiveShopping = () => {
  const context = useContext(LiveShoppingContext);
  if (!context) {
    throw new Error('useLiveShopping must be used within a LiveShoppingProvider');
  }
  return context;
};

export const LiveShoppingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentProduct, setCurrentProduct] = useState<any>(null);
  const [isLive, setIsLive] = useState(false);
  const [viewers, setViewers] = useState(0);
  const [participantId, setParticipantId] = useState<string>('');
  const [currentRoomId, setCurrentRoomId] = useState<string>('');
  const participantIdRef = useRef('');
  const currentRoomIdRef = useRef('');

  participantIdRef.current = participantId;
  currentRoomIdRef.current = currentRoomId;
  
  // Produits partagés entre vendeur et client
  const products: Product[] = [
    { id: 1, name: 'Robe Wax Ankara', price: 25000, image: '👗', description: 'Magnifique robe wax africain, faite main avec des motifs traditionnels' },
    { id: 2, name: 'Collier Perles', price: 15000, image: '💎', description: 'Collier traditionnel en perles artisanales, parfait pour les occasions spéciales' },
    { id: 3, name: 'Sac Artisanal', price: 20000, image: '👜', description: 'Sac fait main par des artisans locaux, cuir véritable et tissu wax' }
  ];

  const sendMessage = (message: string, from: string, roomId: string) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      from,
      message,
      timestamp: new Date(),
      roomId
    };
    
    setMessages(prev => {
      const messageExists = prev.some(msg => 
        msg.message === message && 
        msg.from === from && 
        Math.abs(new Date().getTime() - msg.timestamp.getTime()) < 1000
      );
      
      if (messageExists) {
        return prev;
      }
      
      return [...prev, newMessage];
    });
    
    if (window.liveShoppingWS && window.liveShoppingWS.readyState === WebSocket.OPEN && participantId) {
      window.liveShoppingWS.send(JSON.stringify({
        type: 'live-chat-message',
        data: {
          participantId: participantId,
          userId: participantId,
          roomId: roomId,
          message: newMessage
        }
      }));
    }
  };

  const clearMessages = (roomId: string) => {
    setMessages(prev => prev.filter(msg => msg.roomId !== roomId));
  };

  const selectProduct = (product: any) => {
    console.log('=== selectProduct appelé ===');
    console.log('Produit:', product);
    console.log('participantId:', participantId);
    console.log('WebSocket state:', window.liveShoppingWS?.readyState);
    
    setCurrentProduct(product);
    if (window.liveShoppingWS && window.liveShoppingWS.readyState === WebSocket.OPEN && participantId) {
      console.log('Envoi du message product-selected...');
      window.liveShoppingWS.send(JSON.stringify({
        type: 'product-selected',
        data: {
          product: product,
          participantId: participantId
        }
      }));
      console.log('Message product-selected envoyé avec succès');
    } else {
      console.log('Impossible d\'envoyer le message:', {
        hasWebSocket: !!window.liveShoppingWS,
        webSocketState: window.liveShoppingWS?.readyState,
        hasParticipantId: !!participantId
      });
    }
  };

  const setUserRole = (role: 'vendor' | 'client') => {
    // Rejoindre la room avec le nouveau rôle
    if (window.liveShoppingWS && window.liveShoppingWS.readyState === WebSocket.OPEN && currentRoomId) {
      const userId = participantId || 'user-' + Math.random().toString(36).substr(2, 9);
      window.liveShoppingWS.send(JSON.stringify({ 
        type: 'join-live-shopping', 
        roomId: currentRoomId,
        userId: userId,
        role: role
      }));
    }
  };

  const joinRoom = (roomId: string, userId: string, role: 'vendor' | 'client', roomInfo?: any) => {
    console.log(`=== Rejoindre la room: ${roomId} ===`);
    setCurrentRoomId(roomId);
    setParticipantId(userId);
    
    // Nettoyer les messages de la room précédente
    setMessages([]);
    setCurrentProduct(null);
    
    if (window.liveShoppingWS && window.liveShoppingWS.readyState === WebSocket.OPEN) {
      window.liveShoppingWS.send(JSON.stringify({ 
        type: 'join-live-shopping', 
        roomId: roomId,
        userId: userId,
        role: role,
        title: roomInfo?.title,
        vendor: roomInfo?.vendor
      }));
    }
  };

  const leaveRoom = () => {
    console.log(`=== Quitter la room: ${currentRoomId} ===`);
    setCurrentRoomId('');
    setParticipantId('');
    setMessages([]);
    setCurrentProduct(null);
    setViewers(0);
  };

  // WebSocket global pour Live Shopping
  useEffect(() => {
    let ws: WebSocket;
    let reconnectTimeout: NodeJS.Timeout;

    const connectWebSocket = () => {
      const ws = new WebSocket('ws://localhost:3007'); // Utiliser le nouveau port du chat server
      window.liveShoppingWS = ws;

      ws.onopen = () => {
        console.log('Live Shopping WebSocket connecté');
        // Ne pas rejoindre automatiquement une room - attendre que l'utilisateur choisisse
        if (currentRoomIdRef.current) {
          const userId = participantIdRef.current || 'user-' + Math.random().toString(36).substr(2, 9);
          ws.send(JSON.stringify({ 
            type: 'join-live-shopping', 
            roomId: currentRoomIdRef.current,
            userId: userId,
            role: 'client'
          }));
          setParticipantId(userId);
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'joined-live-shopping') {
            if (data.data && data.data.participantId) {
              setParticipantId(data.data.participantId);
            }
            return;
          }
          
          if (data.type === 'room-state') {
            if (data.data && data.data.currentProduct) {
              setCurrentProduct(data.data.currentProduct);
            }
            return;
          }
          
          if (data.type === 'live-chat-message') {
            const msg = data.data && data.data.message ? data.data.message : data.data;
            // Vérifier que le message appartient à la room actuelle
            if (msg.roomId === currentRoomIdRef.current) {
              setMessages(prev => {
                const messageExists = prev.some(m => m.id === msg.id);
                if (messageExists) return prev;
                return [...prev, msg];
              });
            }
            return;
          }
          
          if (data.type === 'product-selected') {
            setCurrentProduct(data.data);
            const productMessage = {
              id: Date.now().toString(),
              from: 'Système',
              message: `🛍️ Produit présenté: ${data.data.name} - ${data.data.price.toLocaleString()} FCFA`,
              timestamp: new Date(),
              roomId: currentRoomIdRef.current
            };
            setMessages(prev => [...prev, productMessage]);
            return;
          }
          
          if (data.type === 'participant-joined' || data.type === 'participant-left') {
            // Mettre à jour le nombre de viewers
            if (data.data && typeof data.data.viewerCount === 'number') {
              setViewers(data.data.viewerCount);
            }
            return;
          }
        } catch (error) {
          console.error('Erreur WebSocket Live Shopping:', error);
        }
      };

      ws.onclose = () => {
        console.log('Live Shopping WebSocket déconnecté');
        // Tentative de reconnexion après 3 secondes
        reconnectTimeout = setTimeout(connectWebSocket, 3000);
      };

      ws.onerror = (error) => {
        console.error('Erreur WebSocket Live Shopping:', error);
      };
    };

    connectWebSocket();

    return () => {
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, []);

  return (
    <LiveShoppingContext.Provider value={{
      messages,
      sendMessage,
      clearMessages,
      currentProduct,
      setCurrentProduct,
      selectProduct,
      products,
      isLive,
      setIsLive,
      viewers,
      setViewers,
      setUserRole,
      participantId,
      currentRoomId,
      joinRoom,
      leaveRoom
    }}>
      {children}
    </LiveShoppingContext.Provider>
  );
};

// Déclaration globale pour TypeScript
declare global {
  interface Window {
    liveShoppingWS: WebSocket | null;
  }
}
