import React, { useState, useEffect, useRef } from 'react';
import { Search, Send, Paperclip, MoreVertical, Phone, Video, UserPlus, Archive, Trash2, Clock, CheckCheck, Check } from 'lucide-react';
import { useNotification } from '../contexts/NotificationContext';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  timestamp: Date;
  isRead: boolean;
  isOwn: boolean;
  attachments?: string[];
}

interface Conversation {
  id: string;
  customerId: string;
  customerName: string;
  customerAvatar?: string;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  isOnline: boolean;
  status: 'active' | 'archived' | 'blocked';
  orderId?: string;
  orderNumber?: string;
}

interface VendorMessagingCenterProps {
  vendorId: string;
}

const VendorMessagingCenter: React.FC<VendorMessagingCenterProps> = ({ vendorId }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread' | 'archived'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { addNotification } = useNotification();

  // Données de démonstration
  const demoConversations: Conversation[] = [
    {
      id: 'conv-1',
      customerId: 'cust-1',
      customerName: 'Marie Konan',
      customerAvatar: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Professional%20African%20woman%20avatar%20portrait%2C%20friendly%20smile%2C%20modern%20style&image_size=square',
      lastMessage: 'Bonjour, j\'aimerais savoir si vous avez encore ce modèle en stock ?',
      lastMessageTime: new Date(Date.now() - 5 * 60 * 1000),
      unreadCount: 2,
      isOnline: true,
      status: 'active',
      orderId: 'order-123',
      orderNumber: 'CMD-2024-001'
    },
    {
      id: 'conv-2',
      customerId: 'cust-2',
      customerName: 'Jean Yao',
      customerAvatar: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Professional%20African%20man%20avatar%20portrait%2C%20confident%20expression%2C%20modern%20style&image_size=square',
      lastMessage: 'Parfait, merci pour la livraison rapide !',
      lastMessageTime: new Date(Date.now() - 30 * 60 * 1000),
      unreadCount: 0,
      isOnline: false,
      status: 'active',
      orderId: 'order-124',
      orderNumber: 'CMD-2024-002'
    },
    {
      id: 'conv-3',
      customerId: 'cust-3',
      customerName: 'Sophie Diallo',
      lastMessage: 'Je vais réfléchir et vous reviens',
      lastMessageTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
      unreadCount: 0,
      isOnline: true,
      status: 'archived',
      orderId: 'order-125',
      orderNumber: 'CMD-2024-003'
    }
  ];

  const demoMessages: { [key: string]: Message[] } = {
    'conv-1': [
      {
        id: 'msg-1',
        senderId: 'cust-1',
        senderName: 'Marie Konan',
        content: 'Bonjour, j\'aimerais savoir si vous avez encore ce modèle en stock ?',
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
        isRead: true,
        isOwn: false
      },
      {
        id: 'msg-2',
        senderId: vendorId,
        senderName: 'Vendeur',
        content: 'Bonjour Marie ! Oui, nous avons encore cet article en stock. Combien en souhaitez-vous ?',
        timestamp: new Date(Date.now() - 10 * 60 * 1000),
        isRead: true,
        isOwn: true
      },
      {
        id: 'msg-3',
        senderId: 'cust-1',
        senderName: 'Marie Konan',
        content: 'Je voudrais en commander 3 pièces s\'il vous plaît',
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        isRead: false,
        isOwn: false
      }
    ],
    'conv-2': [
      {
        id: 'msg-4',
        senderId: 'cust-2',
        senderName: 'Jean Yao',
        content: 'Bonjour, ma commande CMD-2024-002 a été livrée ce matin',
        timestamp: new Date(Date.now() - 45 * 60 * 1000),
        isRead: true,
        isOwn: false
      },
      {
        id: 'msg-5',
        senderId: vendorId,
        senderName: 'Vendeur',
        content: 'Parfait, merci pour la livraison rapide !',
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        isRead: true,
        isOwn: true
      }
    ]
  };

  useEffect(() => {
    setConversations(demoConversations);
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      setMessages(demoMessages[selectedConversation.id] || []);
      scrollToBottom();
    }
  }, [selectedConversation]);

  useEffect(() => {
    // Simuler de nouveaux messages en temps réel
    const interval = setInterval(() => {
      if (Math.random() > 0.8 && conversations.length > 0) {
        const randomConv = conversations[Math.floor(Math.random() * conversations.length)];
        if (randomConv.status === 'active') {
          simulateNewMessage(randomConv.id);
        }
      }
    }, 20000); // Toutes les 20 secondes

    return () => clearInterval(interval);
  }, [conversations]);

  const simulateNewMessage = (conversationId: string) => {
    const conversation = conversations.find(c => c.id === conversationId);
    if (!conversation) return;

    const newMsg: Message = {
      id: `msg-${Date.now()}`,
      senderId: conversation.customerId,
      senderName: conversation.customerName,
      content: 'Bonjour, avez-vous des nouvelles concernant ma commande ?',
      timestamp: new Date(),
      isRead: false,
      isOwn: false
    };

    if (selectedConversation?.id === conversationId) {
      setMessages(prev => [...prev, newMsg]);
      scrollToBottom();
    }

    setConversations(prev => prev.map(conv => 
      conv.id === conversationId 
        ? { ...conv, lastMessage: newMsg.content, lastMessageTime: newMsg.timestamp, unreadCount: conv.unreadCount + 1 }
        : conv
    ));

    addNotification({
      type: 'alert',
      title: 'Nouveau message',
      message: `${conversation.customerName}: ${newMsg.content}`,
      priority: 'medium',
      sound: true
    });
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) return;

    const message: Message = {
      id: `msg-${Date.now()}`,
      senderId: vendorId,
      senderName: 'Vendeur',
      content: newMessage.trim(),
      timestamp: new Date(),
      isRead: true,
      isOwn: true
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');
    
    setConversations(prev => prev.map(conv => 
      conv.id === selectedConversation.id 
        ? { ...conv, lastMessage: message.content, lastMessageTime: message.timestamp }
        : conv
    ));

    scrollToBottom();
  };

  const markAsRead = (conversationId: string) => {
    setConversations(prev => prev.map(conv => 
      conv.id === conversationId 
        ? { ...conv, unreadCount: 0 }
        : conv
    ));
  };

  const selectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    if (conversation.unreadCount > 0) {
      markAsRead(conversation.id);
    }
  };

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = conv.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         conv.lastMessage.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filter === 'unread') return matchesSearch && conv.unreadCount > 0;
    if (filter === 'archived') return matchesSearch && conv.status === 'archived';
    return matchesSearch && conv.status === 'active';
  });

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'À l\'instant';
    if (minutes < 60) return `Il y a ${minutes} min`;
    if (hours < 24) return `Il y a ${hours}h`;
    return `Il y a ${days}j`;
  };

  return (
    <div className="flex h-[600px] bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Liste des conversations */}
      <div className="w-80 border-r border-gray-200 flex flex-col">
        {/* En-tête avec recherche */}
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Messages</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 text-xs rounded-full ${filter === 'all' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}
            >
              Tous
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-3 py-1 text-xs rounded-full ${filter === 'unread' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}
            >
              Non lus
            </button>
            <button
              onClick={() => setFilter('archived')}
              className={`px-3 py-1 text-xs rounded-full ${filter === 'archived' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}
            >
              Archivés
            </button>
          </div>
        </div>

        {/* Liste des conversations */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.map((conversation) => (
            <div
              key={conversation.id}
              onClick={() => selectConversation(conversation)}
              className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                selectedConversation?.id === conversation.id ? 'bg-blue-50 border-blue-200' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="relative">
                  <img
                    src={conversation.customerAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(conversation.customerName)}&background=random`}
                    alt={conversation.customerName}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  {conversation.isOnline && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-medium text-gray-900 truncate">{conversation.customerName}</h3>
                    <span className="text-xs text-gray-500">{formatTime(conversation.lastMessageTime)}</span>
                  </div>
                  <p className="text-sm text-gray-600 truncate">{conversation.lastMessage}</p>
                  {conversation.orderNumber && (
                    <span className="inline-block mt-1 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                      {conversation.orderNumber}
                    </span>
                  )}
                </div>
                {conversation.unreadCount > 0 && (
                  <div className="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {conversation.unreadCount}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Zone de chat */}
      {selectedConversation ? (
        <div className="flex-1 flex flex-col">
          {/* En-tête du chat */}
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={selectedConversation.customerAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedConversation.customerName)}&background=random`}
                alt={selectedConversation.customerName}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div>
                <h3 className="font-medium text-gray-900">{selectedConversation.customerName}</h3>
                <div className="flex items-center gap-2">
                  {selectedConversation.isOnline && (
                    <span className="text-xs text-green-600 flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      En ligne
                    </span>
                  )}
                  {selectedConversation.orderNumber && (
                    <span className="text-xs text-gray-500">• {selectedConversation.orderNumber}</span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <Phone className="w-4 h-4" />
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <Video className="w-4 h-4" />
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.isOwn
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}>
                  <p className="text-sm">{message.content}</p>
                  <div className={`flex items-center gap-1 mt-1 text-xs ${
                    message.isOwn ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    <span>{formatTime(message.timestamp)}</span>
                    {message.isOwn && (
                      message.isRead ? (
                        <CheckCheck className="w-3 h-3" />
                      ) : (
                        <Check className="w-3 h-3" />
                      )
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Zone de saisie */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center gap-2">
              <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <Paperclip className="w-5 h-5" />
              </button>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Écrire un message..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={sendMessage}
                disabled={!newMessage.trim()}
                className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Sélectionnez une conversation</h3>
            <p className="text-gray-500">Choisissez une conversation pour commencer à discuter avec vos clients</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorMessagingCenter;