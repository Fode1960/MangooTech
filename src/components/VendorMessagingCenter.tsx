import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, Send, Paperclip, MoreVertical, Phone, Video, UserPlus, Archive, Trash2, Clock, CheckCheck, Check, Smile, X } from 'lucide-react';
import { useNotification } from '../contexts/NotificationContext';
import { useThemeStore } from '../stores/themeStore';

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
  const [isEmojiOpen, setIsEmojiOpen] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<File[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addNotification } = useNotification();
  const { isDark } = useThemeStore();

  const emojis = useMemo(() => ['😀', '😁', '😂', '😊', '😍', '😎', '🤝', '👍', '🙏', '🎉', '🔥', '💯', '❤️'], []);

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

    if (addNotification) {
      addNotification({
        type: 'alert',
        title: 'Nouveau message',
        message: `${conversation.customerName}: ${newMsg.content}`,
        priority: 'medium',
        sound: true
      });
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = () => {
    if (!selectedConversation) return;
    if (!newMessage.trim() && pendingAttachments.length === 0) return;

    const message: Message = {
      id: `msg-${Date.now()}`,
      senderId: vendorId,
      senderName: 'Vendeur',
      content: newMessage.trim() || ' ',
      timestamp: new Date(),
      isRead: true,
      isOwn: true,
      attachments: pendingAttachments.length ? pendingAttachments.map((f) => f.name) : undefined
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');
    setPendingAttachments([]);
    setIsEmojiOpen(false);
    
    setConversations(prev => prev.map(conv => 
      conv.id === selectedConversation.id 
        ? { ...conv, lastMessage: message.content, lastMessageTime: message.timestamp }
        : conv
    ));

    scrollToBottom();
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const onFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setPendingAttachments((prev) => [...prev, ...files]);
    e.target.value = '';
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
    <div className={`flex h-full min-h-0 rounded-lg shadow-lg overflow-hidden border ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}>
      {/* Liste des conversations */}
      <div className={`w-80 border-r flex flex-col ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        {/* En-tête avec recherche */}
        <div className={`p-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <h2 className={`text-lg font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-800'}`}>Messages</h2>
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-400'}`} />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'}`}
            />
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 text-xs rounded-full ${filter === 'all' ? (isDark ? 'bg-blue-500/20 text-blue-200' : 'bg-blue-100 text-blue-700') : (isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600')}`}
            >
              Tous
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-3 py-1 text-xs rounded-full ${filter === 'unread' ? (isDark ? 'bg-blue-500/20 text-blue-200' : 'bg-blue-100 text-blue-700') : (isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600')}`}
            >
              Non lus
            </button>
            <button
              onClick={() => setFilter('archived')}
              className={`px-3 py-1 text-xs rounded-full ${filter === 'archived' ? (isDark ? 'bg-blue-500/20 text-blue-200' : 'bg-blue-100 text-blue-700') : (isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600')}`}
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
              className={`p-4 border-b cursor-pointer transition-colors ${
                isDark ? 'border-gray-800 hover:bg-gray-800/60' : 'border-gray-100 hover:bg-gray-50'
              } ${selectedConversation?.id === conversation.id ? (isDark ? 'bg-blue-500/10 border-blue-500/40' : 'bg-blue-50 border-blue-200') : ''}`}
            >
              <div className="flex items-start gap-3">
                <div className="relative">
                  <img
                    src={conversation.customerAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(conversation.customerName)}&background=random`}
                    alt={conversation.customerName}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  {conversation.isOnline && (
                    <div className={`absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 ${isDark ? 'border-gray-900' : 'border-white'}`}></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className={`font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{conversation.customerName}</h3>
                    <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{formatTime(conversation.lastMessageTime)}</span>
                  </div>
                  <p className={`text-sm truncate ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{conversation.lastMessage}</p>
                  {conversation.orderNumber && (
                    <span className={`inline-block mt-1 px-2 py-1 text-xs rounded ${isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
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
          <div className={`p-4 border-b flex items-center justify-between ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-center gap-3">
              <img
                src={selectedConversation.customerAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedConversation.customerName)}&background=random`}
                alt={selectedConversation.customerName}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div>
                <h3 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedConversation.customerName}</h3>
                <div className="flex items-center gap-2">
                  {selectedConversation.isOnline && (
                    <span className={`text-xs flex items-center gap-1 ${isDark ? 'text-green-300' : 'text-green-600'}`}>
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      En ligne
                    </span>
                  )}
                  {selectedConversation.orderNumber && (
                    <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>• {selectedConversation.orderNumber}</span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className={`p-2 rounded-lg transition-colors ${isDark ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}>
                <Phone className="w-4 h-4" />
              </button>
              <button className={`p-2 rounded-lg transition-colors ${isDark ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}>
                <Video className="w-4 h-4" />
              </button>
              <button className={`p-2 rounded-lg transition-colors ${isDark ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}>
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className={`flex-1 overflow-y-auto p-4 space-y-4 ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.isOwn
                    ? 'bg-blue-500 text-white'
                    : (isDark ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-900')
                }`}>
                  <p className="text-sm">{message.content}</p>
                  {message.attachments && message.attachments.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {message.attachments.map((a) => (
                        <span
                          key={a}
                          className={`text-[11px] px-2 py-1 rounded ${message.isOwn ? 'bg-white/15 text-white' : (isDark ? 'bg-gray-700 text-gray-200' : 'bg-white text-gray-700 border border-gray-200')}`}
                        >
                          📎 {a}
                        </span>
                      ))}
                    </div>
                  )}
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
          <div className={`p-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            {pendingAttachments.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-2">
                {pendingAttachments.map((f) => (
                  <span
                    key={`${f.name}_${f.lastModified}`}
                    className={`inline-flex items-center gap-2 text-xs px-3 py-1 rounded-full ${isDark ? 'bg-gray-800 text-gray-200' : 'bg-gray-100 text-gray-700'}`}
                  >
                    📎 {f.name}
                    <button
                      type="button"
                      onClick={() => setPendingAttachments((prev) => prev.filter((x) => x !== f))}
                      className={`${isDark ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex items-center gap-2 relative">
              <input ref={fileInputRef} type="file" multiple className="hidden" onChange={onFilesSelected} />
              <button type="button" onClick={openFilePicker} className={`p-2 rounded-lg transition-colors ${isDark ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}>
                <Paperclip className="w-5 h-5" />
              </button>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsEmojiOpen((v) => !v)}
                  className={`p-2 rounded-lg transition-colors ${isDark ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                >
                  <Smile className="w-5 h-5" />
                </button>
                {isEmojiOpen && (
                  <div className={`absolute bottom-12 left-0 z-10 w-56 p-2 rounded-xl border shadow-xl ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}>
                    <div className="flex flex-wrap gap-1">
                      {emojis.map((e) => (
                        <button
                          key={e}
                          type="button"
                          onClick={() => {
                            setNewMessage((prev) => `${prev}${e}`);
                            setIsEmojiOpen(false);
                          }}
                          className={`${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'} w-9 h-9 rounded-lg text-lg`}
                        >
                          {e}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Écrire un message..."
                className={`flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'}`}
              />
              <button
                onClick={sendMessage}
                disabled={!newMessage.trim() && pendingAttachments.length === 0}
                className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className={`flex-1 flex items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
          <div className="text-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`}>
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className={`text-lg font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Sélectionnez une conversation</h3>
            <p className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Choisissez une conversation pour commencer à discuter avec vos clients</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorMessagingCenter;
