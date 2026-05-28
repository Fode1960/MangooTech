import React, { useState, useEffect } from 'react';
import { Search, MessageCircle, Send, Paperclip, Smile, Phone, Video, MoreVertical, Filter, Archive, Trash2, Clock, CheckCheck, Check, Users } from 'lucide-react';

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: Date;
  isRead: boolean;
  type: 'text' | 'image' | 'file';
  fileUrl?: string;
  fileName?: string;
}

interface ChatConversation {
  id: string;
  customerId: string;
  customerName: string;
  customerAvatar: string;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  isOnline: boolean;
  status: 'active' | 'archived' | 'blocked';
  messages: ChatMessage[];
  orderId?: string;
  productName?: string;
}

const VendorChatManagement: React.FC = () => {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ChatConversation | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'archived' | 'blocked'>('all');
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [viewMode, setViewMode] = useState<'conversations' | 'contacts'>('conversations');

  const contacts = [
    { id: 'support', name: 'Support Mangoo', avatar: 'S', status: 'online', role: 'Support', color: 'bg-green-500' },
    { id: 'supplier_1', name: 'Fournisseur Chine', avatar: 'F', status: 'offline', role: 'Fournisseur', color: 'bg-purple-500' },
    { id: 'delivery_1', name: 'Livreur Express', avatar: 'L', status: 'online', role: 'Livreur', color: 'bg-blue-500' }
  ];

  // Données de démonstration
  useEffect(() => {
    const demoConversations: ChatConversation[] = [
      {
        id: '1',
        customerId: 'cust_001',
        customerName: 'Marie Koné',
        customerAvatar: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Professional%20African%20woman%20avatar%2C%20friendly%20smile%2C%20modern%20style&image_size=square',
        lastMessage: 'Bonjour, est-ce que ce produit est encore disponible ?',
        lastMessageTime: new Date(Date.now() - 5 * 60 * 1000),
        unreadCount: 2,
        isOnline: true,
        status: 'active',
        orderId: 'ORD-2024-001',
        productName: 'iPhone 14 Pro',
        messages: [
          {
            id: 'msg_1',
            senderId: 'cust_001',
            senderName: 'Marie Koné',
            content: 'Bonjour, est-ce que ce produit est encore disponible ?',
            timestamp: new Date(Date.now() - 5 * 60 * 1000),
            isRead: false,
            type: 'text'
          },
          {
            id: 'msg_2',
            senderId: 'vendor_001',
            senderName: 'Vendeur',
            content: 'Bonjour Marie ! Oui, l\'iPhone 14 Pro est bien disponible. Souhaitez-vous plus d\'informations ?',
            timestamp: new Date(Date.now() - 3 * 60 * 1000),
            isRead: true,
            type: 'text'
          }
        ]
      },
      {
        id: '2',
        customerId: 'cust_002',
        customerName: 'Jean-Baptiste Diallo',
        customerAvatar: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Professional%20African%20man%20avatar%2C%20business%20style%2C%20confident%20look&image_size=square',
        lastMessage: 'Parfait, je vais passer commande maintenant',
        lastMessageTime: new Date(Date.now() - 15 * 60 * 1000),
        unreadCount: 0,
        isOnline: false,
        status: 'active',
        orderId: 'ORD-2024-002',
        productName: 'MacBook Air M2',
        messages: [
          {
            id: 'msg_3',
            senderId: 'cust_002',
            senderName: 'Jean-Baptiste Diallo',
            content: 'Parfait, je vais passer commande maintenant',
            timestamp: new Date(Date.now() - 15 * 60 * 1000),
            isRead: true,
            type: 'text'
          }
        ]
      },
      {
        id: '3',
        customerId: 'cust_003',
        customerName: 'Aminata Sow',
        customerAvatar: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Young%20African%20woman%20avatar%2C%20stylish%2C%20modern%20fashion&image_size=square',
        lastMessage: 'Merci pour votre aide !',
        lastMessageTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
        unreadCount: 0,
        isOnline: true,
        status: 'archived',
        messages: []
      }
    ];
    setConversations(demoConversations);
  }, []);

  // Simulation de nouveaux messages
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        const activeConversations = conversations.filter(c => c.status === 'active');
        if (activeConversations.length > 0) {
          const randomConv = activeConversations[Math.floor(Math.random() * activeConversations.length)];
          
          setConversations(prev => prev.map(conv => {
            if (conv.id === randomConv.id) {
              const newMessage: ChatMessage = {
                id: `msg_${Date.now()}`,
                senderId: randomConv.customerId,
                senderName: randomConv.customerName,
                content: ['Bonjour !', 'Est-ce disponible ?', 'Quel est le prix ?', 'Pouvez-vous me donner plus de détails ?'][Math.floor(Math.random() * 4)],
                timestamp: new Date(),
                isRead: false,
                type: 'text'
              };
              
              return {
                ...conv,
                lastMessage: newMessage.content,
                lastMessageTime: newMessage.timestamp,
                unreadCount: conv.unreadCount + 1,
                messages: [...conv.messages, newMessage]
              };
            }
            return conv;
          }));
        }
      }
    }, 30000); // Nouveau message toutes les 30 secondes

    return () => clearInterval(interval);
  }, [conversations]);

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = conv.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         conv.lastMessage.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || conv.status === filterStatus;
    return matchesSearch && matchesFilter;
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
    return `Il y a ${days} j`;
  };

  const sendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) return;

    const message: ChatMessage = {
      id: `msg_${Date.now()}`,
      senderId: 'vendor_001',
      senderName: 'Vendeur',
      content: newMessage,
      timestamp: new Date(),
      isRead: true,
      type: 'text'
    };

    setConversations(prev => prev.map(conv => {
      if (conv.id === selectedConversation.id) {
        return {
          ...conv,
          lastMessage: newMessage,
          lastMessageTime: message.timestamp,
          messages: [...conv.messages, message]
        };
      }
      return conv;
    }));

    setSelectedConversation(prev => prev ? {
      ...prev,
      lastMessage: newMessage,
      lastMessageTime: message.timestamp,
      messages: [...prev.messages, message]
    } : null);

    setNewMessage('');
  };

  const archiveConversation = (conversationId: string) => {
    setConversations(prev => prev.map(conv => 
      conv.id === conversationId ? { ...conv, status: 'archived' } : conv
    ));
  };

  const deleteConversation = (conversationId: string) => {
    setConversations(prev => prev.filter(conv => conv.id !== conversationId));
    if (selectedConversation?.id === conversationId) {
      setSelectedConversation(null);
    }
  };

  const emojis = ['😊', '😂', '❤️', '👍', '🎉', '🔥', '✨', '💯', '🚀', '👏'];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Liste des conversations */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* En-tête */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              {viewMode === 'conversations' ? 'Messages' : 'Contacts'}
            </h2>
            <button
              onClick={() => setViewMode(viewMode === 'conversations' ? 'contacts' : 'conversations')}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              title={viewMode === 'conversations' ? 'Voir les contacts' : 'Voir les messages'}
            >
              {viewMode === 'conversations' ? <Users className="w-5 h-5" /> : <MessageCircle className="w-5 h-5" />}
            </button>
          </div>
          
          {/* Recherche */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder={viewMode === 'conversations' ? "Rechercher une conversation..." : "Rechercher un contact..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filtres (Visible seulement en mode conversations) */}
          {viewMode === 'conversations' && (
            <div className="flex space-x-2">
              {['all', 'active', 'archived'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status as any)}
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    filterStatus === status
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {status === 'all' ? 'Tous' : status === 'active' ? 'Actifs' : 'Archivés'}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Liste des conversations ou contacts */}
        <div className="flex-1 overflow-y-auto">
          {viewMode === 'contacts' ? (
             <div className="p-2">
               {contacts.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase())).map(contact => (
                 <div 
                   key={contact.id}
                   className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                   onClick={() => {
                     // Logique pour démarrer une conversation avec ce contact
                     setViewMode('conversations');
                     setSearchTerm(contact.name);
                   }}
                 >
                   <div className={`w-10 h-10 ${contact.color} rounded-full flex items-center justify-center text-white font-bold`}>
                     {contact.avatar}
                   </div>
                   <div className="flex-1">
                     <div className="font-medium text-gray-900">{contact.name}</div>
                     <div className="text-xs text-gray-500 flex items-center gap-1">
                       <span className={`w-2 h-2 rounded-full ${contact.status === 'online' ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                       {contact.role}
                     </div>
                   </div>
                 </div>
               ))}
             </div>
          ) : (
            filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => setSelectedConversation(conversation)}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                  selectedConversation?.id === conversation.id ? 'bg-blue-50 border-blue-200' : ''
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className="relative">
                    <img
                      src={conversation.customerAvatar}
                      alt={conversation.customerName}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    {conversation.isOnline && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {conversation.customerName}
                      </h3>
                      <span className="text-xs text-gray-500">
                        {formatTime(conversation.lastMessageTime)}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 truncate mt-1">
                      {conversation.lastMessage}
                    </p>
                    
                    {conversation.unreadCount > 0 && (
                      <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold text-white bg-blue-600 rounded-full mt-1">
                        {conversation.unreadCount}
                      </span>
                    )}
                    
                    {conversation.orderId && (
                      <div className="flex items-center mt-1 text-xs text-gray-500">
                        <span>Commande: {conversation.orderId}</span>
                        {conversation.productName && (
                          <span className="ml-1">• {conversation.productName}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Zone de chat */}
      {selectedConversation ? (
        <div className="flex-1 flex flex-col">
          {/* En-tête du chat */}
          <div className="bg-white border-b border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <img
                  src={selectedConversation.customerAvatar}
                  alt={selectedConversation.customerName}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {selectedConversation.customerName}
                  </h3>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${
                      selectedConversation.isOnline ? 'bg-green-500' : 'bg-gray-400'
                    }`}></div>
                    <span className="text-sm text-gray-500">
                      {selectedConversation.isOnline ? 'En ligne' : 'Hors ligne'}
                    </span>
                    {selectedConversation.orderId && (
                      <span className="text-sm text-gray-500">
                        • Commande: {selectedConversation.orderId}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                  <Phone className="h-5 w-5" />
                </button>
                <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                  <Video className="h-5 w-5" />
                </button>
                <button
                  onClick={() => archiveConversation(selectedConversation.id)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                >
                  <Archive className="h-5 w-5" />
                </button>
                <button
                  onClick={() => deleteConversation(selectedConversation.id)}
                  className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-100"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {selectedConversation.messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.senderId === 'vendor_001' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.senderId === 'vendor_001'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-900'
                }`}>
                  <p className="text-sm">{message.content}</p>
                  <div className={`flex items-center justify-end mt-1 text-xs ${
                    message.senderId === 'vendor_001' ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    <span>{message.timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                    {message.senderId === 'vendor_001' && (
                      message.isRead ? (
                        <CheckCheck className="ml-1 h-3 w-3" />
                      ) : (
                        <Check className="ml-1 h-3 w-3" />
                      )
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Zone de saisie */}
          <div className="bg-white border-t border-gray-200 p-4">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <Smile className="h-5 w-5" />
              </button>
              
              <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <Paperclip className="h-5 w-5" />
              </button>
              
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Tapez votre message..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              
              <button
                onClick={sendMessage}
                disabled={!newMessage.trim()}
                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
            
            {/* Sélecteur d'emojis */}
            {showEmojiPicker && (
              <div className="flex flex-wrap gap-1 mt-2 p-2 bg-gray-50 rounded-lg">
                {emojis.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => {
                      setNewMessage(prev => prev + emoji);
                      setShowEmojiPicker(false);
                    }}
                    className="p-1 hover:bg-gray-200 rounded text-lg"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Sélectionnez une conversation</h3>
            <p className="text-gray-500">Choisissez une conversation pour commencer à discuter avec vos clients</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorChatManagement;