import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Smile, Phone, Video, Info, Search, MoreVertical, Circle, CheckCheck, Clock, Users } from 'lucide-react';
import { useChat, ChatConversation, ChatMessage } from '../contexts/ChatContext';

interface ChatInterfaceProps {
  className?: string;
  compact?: boolean;
  onClose?: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ className = '', compact = false, onClose }) => {
  const {
    conversations,
    activeConversation,
    messages,
    isConnected,
    isTyping,
    typingUsers,
    setActiveConversation,
    sendMessage,
    markAsRead,
    startTyping,
    stopTyping
  } = useChat();

  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [viewMode, setViewMode] = useState<'conversations' | 'contacts'>('conversations');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const contacts = [
    { id: 'support', name: 'Support Mangoo', avatar: 'S', status: 'online', role: 'Support', color: 'bg-green-500' },
    { id: 'vendor_1', name: 'Vendeur Mode', avatar: 'V', status: 'offline', role: 'Vendeur', color: 'bg-orange-500' },
    { id: 'delivery_1', name: 'Livreur Express', avatar: 'L', status: 'online', role: 'Livreur', color: 'bg-blue-500' }
  ];

  const emojis = ['😀', '😂', '😍', '🤔', '👍', '👎', '❤️', '🎉', '🚀', '💡', '🔥', '✅', '⚠️', '📦', '🚚'];

  // Scroll automatique vers le bas
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Marquer comme lu quand la conversation est active
  useEffect(() => {
    if (activeConversation) {
      markAsRead(activeConversation.id);
    }
  }, [activeConversation, markAsRead]);

  const filteredConversations = conversations.filter(conv =>
    conv.participants.some(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const conversationMessages = messages.filter(msg => 
    msg.conversationId === activeConversation?.id
  ).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  const handleSendMessage = () => {
    if (newMessage.trim() && activeConversation) {
      sendMessage(newMessage.trim());
      setNewMessage('');
      setShowEmojiPicker(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleTyping = (value: string) => {
    setNewMessage(value);
    
    if (activeConversation) {
      if (value.trim()) {
        startTyping(activeConversation.id);
      } else {
        stopTyping(activeConversation.id);
      }
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const messageDate = new Date(date);
    
    if (messageDate.toDateString() === today.toDateString()) {
      return 'Aujourd\'hui';
    }
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Hier';
    }
    
    return messageDate.toLocaleDateString('fr-FR', { 
      day: '2-digit', 
      month: '2-digit' 
    });
  };

  const getMessageStatus = (message: ChatMessage, isLastMessage: boolean) => {
    if (message.senderId === 'current-user') {
      return (
        <div className="flex items-center gap-1 ml-2">
          {message.isRead ? (
            <CheckCheck className="w-4 h-4 text-blue-500" />
          ) : (
            <CheckCheck className="w-4 h-4 text-gray-400" />
          )}
        </div>
      );
    }
    return null;
  };

  const MessageBubble = ({ message, isLastMessage }: { message: ChatMessage; isLastMessage: boolean }) => {
    const isOwnMessage = message.senderId === 'current-user';
    const participant = activeConversation?.participants.find(p => p.id === message.senderId);
    
    return (
      <div className={`flex gap-2 mb-4 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
        {!isOwnMessage && (
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
              {participant?.avatar || message.senderAvatar || message.senderName.charAt(0)}
            </div>
          </div>
        )}
        
        <div className={`max-w-xs lg:max-w-md ${isOwnMessage ? 'order-1' : ''}`}>
          {!isOwnMessage && (
            <div className="text-xs text-gray-600 mb-1 px-3">
              {message.senderName}
            </div>
          )}
          
          <div className={`relative group ${isOwnMessage ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-900'} rounded-2xl px-4 py-2`}>
            <div className="text-sm break-words">
              {message.content}
            </div>
            
            <div className="flex items-center justify-end gap-1 mt-1">
              <span className="text-xs opacity-70">
                {formatTime(message.timestamp)}
              </span>
              {getMessageStatus(message, isLastMessage)}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const ConversationItem = ({ conversation }: { conversation: ChatConversation }) => {
    const otherParticipant = conversation.participants.find(p => p.id !== 'current-user');
    const isActive = activeConversation?.id === conversation.id;
    const unreadCount = conversation.unreadCount;
    
    return (
      <div
        onClick={() => setActiveConversation(conversation)}
        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200 ${
          isActive 
            ? 'bg-blue-50 border-l-4 border-blue-500' 
            : 'hover:bg-gray-50 border-l-4 border-transparent'
        }`}
      >
        <div className="relative flex-shrink-0">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium text-lg">
            {otherParticipant?.avatar || otherParticipant?.name.charAt(0)}
          </div>
          {otherParticipant?.isOnline && (
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-medium text-gray-900 truncate">
              {otherParticipant?.name}
            </h4>
            {conversation.lastMessage && (
              <span className="text-xs text-gray-500">
                {formatTime(conversation.lastMessage.timestamp)}
              </span>
            )}
          </div>
          
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600 truncate">
              {conversation.lastMessage?.content || 'Aucun message'}
            </p>
            {unreadCount > 0 && (
              <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                {unreadCount}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (compact) {
    return (
      <div className={`bg-white rounded-lg shadow-lg ${className}`}>
        {/* Header compact */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <MessageCircle className="w-6 h-6 text-blue-500" />
            <h3 className="font-semibold text-gray-900">Messages</h3>
            {conversations.some(conv => conv.unreadCount > 0) && (
              <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">
                {conversations.reduce((sum, conv) => sum + conv.unreadCount, 0)}
              </span>
            )}
          </div>
          {onClose && (
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <span className="text-xl">&times;</span>
            </button>
          )}
        </div>

        {/* Liste des conversations compacte */}
        <div className="max-h-64 overflow-y-auto">
          {filteredConversations.map(conversation => (
            <div key={conversation.id} className="border-b border-gray-100 last:border-b-0">
              <ConversationItem conversation={conversation} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-[600px] bg-white rounded-lg shadow-lg overflow-hidden ${className}`}>
      {/* Sidebar des conversations */}
      <div className="w-80 bg-gray-50 border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {viewMode === 'conversations' ? 'Messages' : 'Contacts'}
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode(viewMode === 'conversations' ? 'contacts' : 'conversations')}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                title={viewMode === 'conversations' ? 'Voir les contacts' : 'Voir les messages'}
              >
                {viewMode === 'conversations' ? <Users className="w-5 h-5" /> : <MessageCircle className="w-5 h-5" />}
              </button>
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            </div>
          </div>
          
          {/* Barre de recherche */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder={viewMode === 'conversations' ? "Rechercher une conversation..." : "Rechercher un contact..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
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
                    // Pour l'instant, on bascule juste vers la vue messages
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
            filteredConversations.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <MessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>Aucune conversation trouvée</p>
              </div>
            ) : (
              filteredConversations.map(conversation => (
                <div key={conversation.id} className="border-b border-gray-200 last:border-b-0">
                  <ConversationItem conversation={conversation} />
                </div>
              ))
            )
          )}
        </div>
      </div>

      {/* Zone de chat */}
      <div className="flex-1 flex flex-col">
        {activeConversation ? (
          <>
            {/* Header de la conversation */}
            <div className="p-4 border-b border-gray-200 bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                      {activeConversation.participants.find(p => p.id !== 'current-user')?.avatar || 
                       activeConversation.participants.find(p => p.id !== 'current-user')?.name.charAt(0)}
                    </div>
                    {activeConversation.participants.find(p => p.id !== 'current-user')?.isOnline && (
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {activeConversation.participants.find(p => p.id !== 'current-user')?.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {typingUsers.length > 0 ? (
                        <span className="text-blue-500">En train d\'écrire...</span>
                      ) : (
                        activeConversation.participants.find(p => p.id !== 'current-user')?.isOnline ? 'En ligne' : 'Hors ligne'
                      )}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                    <Phone className="w-5 h-5" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                    <Video className="w-5 h-5" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                    <Info className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-1 bg-gray-50">
              {conversationMessages.map((message, index) => (
                <MessageBubble 
                  key={message.id} 
                  message={message} 
                  isLastMessage={index === conversationMessages.length - 1}
                />
              ))}
              
              {/* Indicateur de frappe */}
              {typingUsers.length > 0 && (
                <div className="flex gap-2 mb-4">
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                  </div>
                  <div className="bg-gray-100 rounded-2xl px-4 py-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Zone de saisie */}
            <div className="p-4 border-t border-gray-200 bg-white">
              <div className="flex items-end gap-2">
                {/* Boutons d'attachement */}
                <div className="relative">
                  <button
                    onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                  >
                    <Paperclip className="w-5 h-5" />
                  </button>
                  
                  {showAttachmentMenu && (
                    <div className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg py-2 min-w-[150px]">
                      <button
                        onClick={() => {
                          fileInputRef.current?.click();
                          setShowAttachmentMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
                      >
                        📄 Document
                      </button>
                      <button
                        onClick={() => {
                          // Logique pour image
                          setShowAttachmentMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
                      >
                        🖼️ Image
                      </button>
                    </div>
                  )}
                </div>

                {/* Zone de texte */}
                <div className="flex-1 relative">
                  <textarea
                    value={newMessage}
                    onChange={(e) => handleTyping(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Tapez votre message..."
                    className="w-full resize-none border border-gray-300 rounded-lg px-4 py-2 pr-12 focus:ring-2 focus:ring-blue-500 focus:border-transparent max-h-32"
                    rows={1}
                  />
                  
                  {/* Bouton emoji */}
                  <button
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="absolute right-2 top-2 p-1 text-gray-400 hover:text-gray-600"
                  >
                    <Smile className="w-5 h-5" />
                  </button>
                  
                  {/* Emoji picker */}
                  {showEmojiPicker && (
                    <div className="absolute bottom-full right-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg p-3 grid grid-cols-5 gap-2">
                      {emojis.map((emoji, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            setNewMessage(prev => prev + emoji);
                            setShowEmojiPicker(false);
                          }}
                          className="text-xl hover:bg-gray-100 rounded p-1"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Bouton envoyer */}
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
              
              {/* Input caché pour fichiers */}
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif"
                onChange={(e) => {
                  // Logique de traitement des fichiers
                  console.log('Fichier sélectionné:', e.target.files?.[0]);
                }}
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Sélectionnez une conversation</h3>
              <p className="text-gray-600">Choisissez une conversation pour commencer à discuter</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatInterface;