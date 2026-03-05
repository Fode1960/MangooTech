import React, { createContext, useContext, useState, useEffect } from 'react';

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

interface RoomInfo {
  roomId: string;
  title: string;
  vendor: string;
  vendorId: string;
  viewers: number;
  currentProduct: any;
  isActive: boolean;
  createdAt: string;
}

interface LiveShoppingRoomContextType {
  messages: ChatMessage[];
  sendMessage: (message: string, from: string) => void;
  clearMessages: () => void;
  currentProduct: any;
  setCurrentProduct: (product: any) => void;
  selectProduct: (product: any) => void;
  products: Product[];
  isLive: boolean;
  setIsLive: (live: boolean) => void;
  viewers: number;
  setViewers: (count: number) => void;
  participantId: string;
  roomInfo: RoomInfo | null;
  isConnected: boolean;
  connectToRoom: (roomId: string, userId: string, role: 'vendor' | 'client', roomTitle?: string, vendorName?: string) => void;
  disconnectFromRoom: () => void;
}

const LiveShoppingRoomContext = createContext<LiveShoppingRoomContextType | undefined>(undefined);

export const useLiveShoppingRoom = () => {
  const context = useContext(LiveShoppingRoomContext);
  if (!context) {
    throw new Error('useLiveShoppingRoom must be used within a LiveShoppingRoomProvider');
  }
  return context;
};

interface LiveShoppingRoomProviderProps {
  children: React.ReactNode;
}

export const LiveShoppingRoomProvider: React.FC<LiveShoppingRoomProviderProps> = ({ children }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentProduct, setCurrentProduct] = useState<any>(null);
  const [isLive, setIsLive] = useState(false);
  const [viewers, setViewers] = useState(0);
  const [participantId, setParticipantId] = useState<string>('');
  const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentRoomId, setCurrentRoomId] = useState<string>('');
  
  // Produits partagés entre vendeur et client
  const products: Product[] = [
    { id: 1, name: 'Robe Wax Ankara', price: 25000, image: '👗', description: 'Magnifique robe wax africain, faite main avec des motifs traditionnels' },
    { id: 2, name: 'Collier Perles', price: 15000, image: '💎', description: 'Collier traditionnel en perles artisanales, parfait pour les occasions spéciales' },
    { id: 3, name: 'Sac Artisanal', price: 20000, image: '👜', description: 'Sac fait main par des artisans locaux, cuir véritable et tissu wax' }
  ];

  const sendMessage = (message: string, from: string) => {
    if (!isConnected || !participantId || !currentRoomId) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      from,
      message,
      timestamp: new Date(),
      roomId: currentRoomId
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
    
    if (window.liveShoppingWS && window.liveShoppingWS.readyState === WebSocket.OPEN) {
      window.liveShoppingWS.send(JSON.stringify({
        type: 'live-chat-message',
        data: {
          participantId: participantId,
          userId: participantId,
          roomId: currentRoomId,
          message: newMessage
        }
      }));
    }
  };

  const clearMessages = () => {
    setMessages([]);
  };

  const selectProduct = (product: any) => {
    if (!isConnected || !participantId || !currentRoomId) return;

    setCurrentProduct(product);
    if (window.liveShoppingWS && window.liveShoppingWS.readyState === WebSocket.OPEN) {
      window.liveShoppingWS.send(JSON.stringify({
        type: 'product-selected',
        data: {
          product: product,
          participantId: participantId
        }
      }));
    }
  };

  const connectToRoom = (roomId: string, userId: string, role: 'vendor' | 'client', roomTitle?: string, vendorName?: string) => {
    if (window.liveShoppingWS && window.liveShoppingWS.readyState === WebSocket.OPEN) {
      // Rejoindre la room
      window.liveShoppingWS.send(JSON.stringify({ 
        type: 'join-live-shopping', 
        roomId: roomId,
        userId: userId,
        role: role,
        title: roomTitle,
        vendor: vendorName
      }));
      
      setCurrentRoomId(roomId);
      setParticipantId(userId);
      setIsConnected(true);
    }
  };

  const disconnectFromRoom = () => {
    if (window.liveShoppingWS && window.liveShoppingWS.readyState === WebSocket.OPEN) {
      window.liveShoppingWS.close();
    }
    setIsConnected(false);
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
      ws = new WebSocket('ws://localhost:3007');
      window.liveShoppingWS = ws;

      ws.onopen = () => {
        console.log('Live Shopping WebSocket connecté');
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'joined-live-shopping') {
            if (data.data && data.data.participantId) {
              setParticipantId(data.data.participantId);
              setRoomInfo(data.data.roomInfo);
              setViewers(data.data.participantCount || 0);
              setMessages(data.data.messages || []);
              setCurrentProduct(data.data.currentProduct);
            }
            return;
          }
          
          if (data.type === 'participant-joined') {
            setViewers(data.data.viewerCount || 0);
            return;
          }
          
          if (data.type === 'participant-left') {
            setViewers(prev => Math.max(0, prev - 1));
            return;
          }
          
          if (data.type === 'live-chat-message') {
            const msg = data.data && data.data.message ? data.data.message : data.data;
            setMessages(prev => {
              const messageExists = prev.some(m => m.id === msg.id);
              if (messageExists) return prev;
              return [...prev, msg];
            });
            return;
          }
          
          if (data.type === 'product-selected') {
            setCurrentProduct(data.data);
            const productMessage = {
              id: Date.now().toString(),
              from: 'Système',
              message: `🛍️ Produit présenté: ${data.data.name} - ${data.data.price.toLocaleString()} FCFA`,
              timestamp: new Date(),
              roomId: currentRoomId
            };
            setMessages(prev => [...prev, productMessage]);
            return;
          }
        } catch (error) {
          console.error('Erreur WebSocket Live Shopping:', error);
        }
      };

      ws.onclose = () => {
        console.log('Live Shopping WebSocket déconnecté');
        setIsConnected(false);
        // Tentative de reconnexion après 3 secondes
        reconnectTimeout = setTimeout(connectWebSocket, 3000);
      };

      ws.onerror = (error) => {
        console.error('Erreur WebSocket Live Shopping:', error);
        setIsConnected(false);
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
    <LiveShoppingRoomContext.Provider value={{
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
      participantId,
      roomInfo,
      isConnected,
      connectToRoom,
      disconnectFromRoom
    }}>
      {children}
    </LiveShoppingRoomContext.Provider>
  );
};

// Déclaration globale pour TypeScript
declare global {
  interface Window {
    liveShoppingWS: WebSocket | null;
  }
}