import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { useNotification } from './NotificationContext';

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  timestamp: Date;
  isRead: boolean;
  type: 'text' | 'image' | 'file' | 'system';
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
}

export interface ChatConversation {
  id: string;
  customerId: string;
  customerName: string;
  customerAvatar: string;
  vendorId: string;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  isOnline: boolean;
  status: 'active' | 'archived' | 'blocked';
  isTyping: boolean;
  orderId?: string;
  productId?: string;
  productName?: string;
  productImage?: string;
  messages: ChatMessage[];
  participants: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatState {
  conversations: ChatConversation[];
  activeConversation: ChatConversation | null;
  isConnected: boolean;
  isTyping: boolean;
  currentUserId: string;
  currentUserRole: 'vendor' | 'customer';
}

export type ChatAction =
  | { type: 'SET_CONVERSATIONS'; payload: ChatConversation[] }
  | { type: 'ADD_CONVERSATION'; payload: ChatConversation }
  | { type: 'UPDATE_CONVERSATION'; payload: { id: string; updates: Partial<ChatConversation> } }
  | { type: 'DELETE_CONVERSATION'; payload: string }
  | { type: 'SET_ACTIVE_CONVERSATION'; payload: ChatConversation | null }
  | { type: 'ADD_MESSAGE'; payload: { conversationId: string; message: ChatMessage } }
  | { type: 'MARK_AS_READ'; payload: { conversationId: string; messageId: string } }
  | { type: 'SET_TYPING'; payload: { conversationId: string; isTyping: boolean } }
  | { type: 'SET_ONLINE_STATUS'; payload: { userId: string; isOnline: boolean } }
  | { type: 'SET_CONNECTION_STATUS'; payload: boolean }
  | { type: 'ARCHIVE_CONVERSATION'; payload: string }
  | { type: 'BLOCK_CONVERSATION'; payload: string };

const initialState: ChatState = {
  conversations: [],
  activeConversation: null,
  isConnected: false,
  isTyping: false,
  currentUserId: 'vendor_001',
  currentUserRole: 'vendor',
};

const chatReducer = (state: ChatState, action: ChatAction): ChatState => {
  switch (action.type) {
    case 'SET_CONVERSATIONS':
      return { ...state, conversations: action.payload };
    
    case 'ADD_CONVERSATION':
      return { 
        ...state, 
        conversations: [action.payload, ...state.conversations] 
      };
    
    case 'UPDATE_CONVERSATION':
      return {
        ...state,
        conversations: state.conversations.map(conv =>
          conv.id === action.payload.id
            ? { ...conv, ...action.payload.updates, updatedAt: new Date() }
            : conv
        ),
        activeConversation: state.activeConversation?.id === action.payload.id
          ? { ...state.activeConversation, ...action.payload.updates, updatedAt: new Date() }
          : state.activeConversation
      };
    
    case 'DELETE_CONVERSATION':
      return {
        ...state,
        conversations: state.conversations.filter(conv => conv.id !== action.payload),
        activeConversation: state.activeConversation?.id === action.payload
          ? null
          : state.activeConversation
      };
    
    case 'SET_ACTIVE_CONVERSATION':
      return { ...state, activeConversation: action.payload };
    
    case 'ADD_MESSAGE':
      return {
        ...state,
        conversations: state.conversations.map(conv => {
          if (conv.id === action.payload.conversationId) {
            const updatedMessages = [...conv.messages, action.payload.message];
            const isCurrentUser = action.payload.message.senderId === state.currentUserId;
            
            return {
              ...conv,
              messages: updatedMessages,
              lastMessage: action.payload.message.content,
              lastMessageTime: action.payload.message.timestamp,
              unreadCount: isCurrentUser ? conv.unreadCount : conv.unreadCount + 1,
              updatedAt: new Date()
            };
          }
          return conv;
        }),
        activeConversation: state.activeConversation?.id === action.payload.conversationId
          ? {
              ...state.activeConversation,
              messages: [...state.activeConversation.messages, action.payload.message],
              lastMessage: action.payload.message.content,
              lastMessageTime: action.payload.message.timestamp,
              updatedAt: new Date()
            }
          : state.activeConversation
      };
    
    case 'MARK_AS_READ':
      return {
        ...state,
        conversations: state.conversations.map(conv => {
          if (conv.id === action.payload.conversationId) {
            return {
              ...conv,
              messages: conv.messages.map(msg =>
                msg.id === action.payload.messageId
                  ? { ...msg, isRead: true }
                  : msg
              ),
              unreadCount: Math.max(0, conv.unreadCount - 1)
            };
          }
          return conv;
        })
      };
    
    case 'SET_TYPING':
      return {
        ...state,
        conversations: state.conversations.map(conv =>
          conv.id === action.payload.conversationId
            ? { ...conv, isTyping: action.payload.isTyping }
            : conv
        )
      };
    
    case 'SET_ONLINE_STATUS':
      return {
        ...state,
        conversations: state.conversations.map(conv =>
          conv.customerId === action.payload.userId
            ? { ...conv, isOnline: action.payload.isOnline }
            : conv
        )
      };
    
    case 'SET_CONNECTION_STATUS':
      return { ...state, isConnected: action.payload };
    
    case 'ARCHIVE_CONVERSATION':
      return {
        ...state,
        conversations: state.conversations.map(conv =>
          conv.id === action.payload
            ? { ...conv, status: 'archived' as const, updatedAt: new Date() }
            : conv
        )
      };
    
    case 'BLOCK_CONVERSATION':
      return {
        ...state,
        conversations: state.conversations.map(conv =>
          conv.id === action.payload
            ? { ...conv, status: 'blocked' as const, updatedAt: new Date() }
            : conv
        )
      };
    
    default:
      return state;
  }
};

interface ChatContextType {
  state: ChatState;
  dispatch: React.Dispatch<ChatAction>;
  sendMessage: (conversationId: string, content: string, type?: ChatMessage['type']) => void;
  startConversation: (customerId: string, customerName: string, customerAvatar: string, initialMessage?: string) => void;
  markAsRead: (conversationId: string, messageId: string) => void;
  setTyping: (conversationId: string, isTyping: boolean) => void;
  archiveConversation: (conversationId: string) => void;
  blockConversation: (conversationId: string) => void;
  deleteConversation: (conversationId: string) => void;
  setActiveConversation: (conversation: ChatConversation | null) => void;
  simulateIncomingMessage: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  
  // Rendre l'utilisation des notifications optionnelle pour éviter les erreurs de contexte
  let addNotification: ((notification: Omit<Notification, 'id'>) => void) | undefined;
  try {
    const notificationContext = useNotification();
    addNotification = notificationContext.addNotification;
  } catch (error) {
    // NotificationProvider n'est pas disponible, continuer sans notifications
    addNotification = undefined;
  }

  // Simuler la connexion WebSocket
  useEffect(() => {
    const connectWebSocket = () => {
      dispatch({ type: 'SET_CONNECTION_STATUS', payload: true });
      console.log('WebSocket connecté');
    };

    connectWebSocket();

    // Simuler des déconnexions aléatoires
    const interval = setInterval(() => {
      if (Math.random() > 0.95) {
        dispatch({ type: 'SET_CONNECTION_STATUS', payload: false });
        setTimeout(() => {
          dispatch({ type: 'SET_CONNECTION_STATUS', payload: true });
        }, 2000);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // Simuler des messages entrants
  const simulateIncomingMessage = () => {
    const activeConversations = state.conversations.filter(c => c.status === 'active');
    if (activeConversations.length === 0) return;

    const randomConv = activeConversations[Math.floor(Math.random() * activeConversations.length)];
    const sampleMessages = [
      'Bonjour !',
      'Est-ce que ce produit est encore disponible ?',
      'Quel est le prix ?',
      'Pouvez-vous me donner plus de détails ?',
      'Je suis intéressé',
      'Merci pour votre réponse',
      'Quand puis-je passer récupérer ?',
      'Acceptez-vous le paiement en espèces ?'
    ];

    const newMessage: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      conversationId: randomConv.id,
      senderId: randomConv.customerId,
      senderName: randomConv.customerName,
      senderAvatar: randomConv.customerAvatar,
      content: sampleMessages[Math.floor(Math.random() * sampleMessages.length)],
      timestamp: new Date(),
      isRead: false,
      type: 'text'
    };

    dispatch({
      type: 'ADD_MESSAGE',
      payload: { conversationId: randomConv.id, message: newMessage }
    });

    // Ajouter une notification
    if (addNotification) {
      addNotification({
        type: 'info',
        title: 'Nouveau message',
        message: `${randomConv.customerName}: ${newMessage.content}`,
        priority: 'medium',
        sound: true,
        action: {
          label: 'Voir le message',
          onClick: () => setActiveConversation(randomConv)
        }
      });
    }
  };

  const sendMessage = (conversationId: string, content: string, type: ChatMessage['type'] = 'text') => {
    const message: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      conversationId,
      senderId: state.currentUserId,
      senderName: 'Vendeur',
      content,
      timestamp: new Date(),
      isRead: true,
      type
    };

    dispatch({
      type: 'ADD_MESSAGE',
      payload: { conversationId, message }
    });
  };

  const startConversation = (customerId: string, customerName: string, customerAvatar: string, initialMessage?: string) => {
    const existingConv = state.conversations.find(conv => conv.customerId === customerId);
    
    if (existingConv) {
      setActiveConversation(existingConv);
      return;
    }

    const newConversation: ChatConversation = {
      id: `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      customerId,
      customerName,
      customerAvatar,
      vendorId: state.currentUserId,
      lastMessage: initialMessage || '',
      lastMessageTime: new Date(),
      unreadCount: 0,
      isOnline: Math.random() > 0.5,
      status: 'active',
      isTyping: false,
      messages: [],
      participants: [state.currentUserId, customerId],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    dispatch({ type: 'ADD_CONVERSATION', payload: newConversation });
    setActiveConversation(newConversation);

    if (initialMessage) {
      sendMessage(newConversation.id, initialMessage);
    }
  };

  const markAsRead = (conversationId: string, messageId: string) => {
    dispatch({ type: 'MARK_AS_READ', payload: { conversationId, messageId } });
  };

  const setTyping = (conversationId: string, isTyping: boolean) => {
    dispatch({ type: 'SET_TYPING', payload: { conversationId, isTyping } });
  };

  const archiveConversation = (conversationId: string) => {
    dispatch({ type: 'ARCHIVE_CONVERSATION', payload: conversationId });
    if (addNotification) {
      addNotification({
        type: 'success',
        title: 'Conversation archivée',
        message: 'La conversation a été archivée avec succès',
        priority: 'low'
      });
    }
  };

  const blockConversation = (conversationId: string) => {
    dispatch({ type: 'BLOCK_CONVERSATION', payload: conversationId });
    if (addNotification) {
      addNotification({
        type: 'warning',
        title: 'Conversation bloquée',
        message: 'Cette conversation a été bloquée',
        priority: 'medium'
      });
    }
  };

  const deleteConversation = (conversationId: string) => {
    dispatch({ type: 'DELETE_CONVERSATION', payload: conversationId });
    if (addNotification) {
      addNotification({
        type: 'info',
        title: 'Conversation supprimée',
        message: 'La conversation a été supprimée',
        priority: 'low'
      });
    }
  };

  const setActiveConversation = (conversation: ChatConversation | null) => {
    dispatch({ type: 'SET_ACTIVE_CONVERSATION', payload: conversation });
  };

  // Simuler des messages entrants automatiquement
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.8) { // 20% de chance d'avoir un nouveau message
        simulateIncomingMessage();
      }
    }, 45000); // Toutes les 45 secondes

    return () => clearInterval(interval);
  }, [state.conversations]);

  const value: ChatContextType = {
    state,
    dispatch,
    sendMessage,
    startConversation,
    markAsRead,
    setTyping,
    archiveConversation,
    blockConversation,
    deleteConversation,
    setActiveConversation,
    simulateIncomingMessage
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};