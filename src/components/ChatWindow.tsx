import React, { useState, useRef, useEffect } from 'react';
import { 
  Phone, 
  Video, 
  MoreVertical, 
  Archive, 
  Trash2, 
  Check, 
  CheckCheck,
  Download,
  Image,
  FileText,
  Clock,
  User,
  Shield,
  AlertTriangle,
  MessageCircle
} from 'lucide-react';
import { ChatConversation, ChatMessage } from '../contexts/ChatContext';
import { useChat } from '../contexts/ChatContext';
import { useNotification } from '../contexts/NotificationContext';

interface ChatWindowProps {
  conversation: ChatConversation;
  onClose?: () => void;
  onMinimize?: () => void;
  isMinimized?: boolean;
  className?: string;
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  conversation,
  onClose,
  onMinimize,
  isMinimized = false,
  className = ''
}) => {
  const { sendMessage, markAsRead, setTyping, archiveConversation, blockConversation, deleteConversation } = useChat();
  const { addNotification } = useNotification();
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTypingLocal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const emojis = ['😊', '😂', '❤️', '👍', '🎉', '🔥', '✨', '💯', '🚀', '👏', '😍', '🤔', '👋', '🙏', '💪'];

  // Faire défiler vers le bas automatiquement
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation.messages]);

  // Marquer les messages comme lus quand la conversation est active
  useEffect(() => {
    const unreadMessages = conversation.messages.filter(msg => !msg.isRead && msg.senderId !== 'vendor_001');
    unreadMessages.forEach(msg => {
      markAsRead(conversation.id, msg.id);
    });
  }, [conversation]);

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

  const formatMessageTime = (date: Date) => {
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    sendMessage(conversation.id, newMessage, 'text');
    setNewMessage('');
    setIsTypingLocal(false);
    
    // Notification de confirmation
    addNotification({
      type: 'success',
      title: 'Message envoyé',
      message: 'Votre message a été envoyé avec succès',
      priority: 'low'
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleTyping = (value: string) => {
    setNewMessage(value);
    
    // Simuler l'indicateur de frappe
    if (!isTyping && value.length > 0) {
      setIsTypingLocal(true);
      setTyping(conversation.id, true);
      
      setTimeout(() => {
        setIsTypingLocal(false);
        setTyping(conversation.id, false);
      }, 2000);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Simuler l'envoi de fichier
    const fileMessage: ChatMessage = {
      id: `msg_file_${Date.now()}`,
      conversationId: conversation.id,
      senderId: 'vendor_001',
      senderName: 'Vendeur',
      content: `Fichier: ${file.name}`,
      timestamp: new Date(),
      isRead: true,
      type: file.type.startsWith('image/') ? 'image' : 'file',
      fileName: file.name,
      fileSize: file.size,
      fileUrl: URL.createObjectURL(file)
    };

    dispatch({
      type: 'ADD_MESSAGE',
      payload: { conversationId: conversation.id, message: fileMessage }
    });

    addNotification({
      type: 'success',
      title: 'Fichier envoyé',
      message: `Le fichier ${file.name} a été envoyé`,
      priority: 'low'
    });
  };

  const handleArchive = () => {
    archiveConversation(conversation.id);
    setShowDropdown(false);
    onClose?.();
  };

  const handleBlock = () => {
    blockConversation(conversation.id);
    setShowDropdown(false);
    addNotification({
      type: 'warning',
      title: 'Conversation bloquée',
      message: 'Cette conversation a été bloquée',
      priority: 'medium'
    });
  };

  const handleDelete = () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette conversation ?')) {
      deleteConversation(conversation.id);
      setShowDropdown(false);
      onClose?.();
    }
  };

  const getMessageStatusIcon = (message: ChatMessage) => {
    if (message.senderId !== 'vendor_001') return null;
    
    return message.isRead ? (
      <CheckCheck className="h-3 w-3 text-blue-500" />
    ) : (
      <Check className="h-3 w-3 text-gray-400" />
    );
  };

  const getFileIcon = (type: string) => {
    if (type === 'image') return <Image className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  if (isMinimized) {
    return (
      <div className={`bg-white rounded-lg shadow-lg border border-gray-200 ${className}`}>
        <div className="flex items-center justify-between p-3 bg-blue-600 text-white rounded-t-lg">
          <div className="flex items-center space-x-2">
            <img
              src={conversation.customerAvatar}
              alt={conversation.customerName}
              className="w-6 h-6 rounded-full object-cover"
            />
            <span className="text-sm font-medium truncate">{conversation.customerName}</span>
            {conversation.isOnline && (
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            )}
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => {
                addNotification({
                  type: 'info',
                  title: 'Appel Audio',
                  message: `Appel audio à ${conversation.customerName} initié`,
                  priority: 'medium'
                });
              }}
              className="p-1 hover:bg-blue-700 rounded"
              title="Appel audio"
            >
              <Phone className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                addNotification({
                  type: 'info',
                  title: 'Appel Vidéo',
                  message: `Appel vidéo à ${conversation.customerName} initié`,
                  priority: 'medium'
                });
                window.open('/video-call-manager', '_blank', 'width=800,height=600');
              }}
              className="p-1 hover:bg-blue-700 rounded"
              title="Appel vidéo"
            >
              <Video className="w-4 h-4" />
            </button>
            <button
              onClick={onMinimize}
              className="p-1 hover:bg-blue-700 rounded"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>
            <button
              onClick={onClose}
              className="p-1 hover:bg-blue-700 rounded"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-xl border border-gray-200 flex flex-col ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-blue-600 text-white rounded-t-lg">
        <div className="flex items-center space-x-3">
          <img
            src={conversation.customerAvatar}
            alt={conversation.customerName}
            className="w-10 h-10 rounded-full object-cover"
          />
          <div>
            <h3 className="font-medium">{conversation.customerName}</h3>
            <div className="flex items-center space-x-2 text-sm text-blue-100">
              <div className={`w-2 h-2 rounded-full ${
                conversation.isOnline ? 'bg-green-400' : 'bg-gray-400'
              }`}></div>
              <span>{conversation.isOnline ? 'En ligne' : 'Hors ligne'}</span>
              {conversation.isTyping && (
                <span className="italic">• En train d'écrire...</span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => {
              addNotification({
                type: 'info',
                title: 'Appel Audio',
                message: `Appel audio à ${conversation.customerName} en cours...`,
                priority: 'medium'
              });
            }}
            className="p-2 hover:bg-blue-700 rounded-lg transition-colors"
            title="Appel audio"
          >
            <Phone className="h-4 w-4" />
          </button>
          <button 
            onClick={() => {
              addNotification({
                type: 'info',
                title: 'Appel Vidéo',
                message: `Appel vidéo à ${conversation.customerName} en cours...`,
                priority: 'medium'
              });
              window.open('/video-call-manager', '_blank', 'width=800,height=600');
            }}
            className="p-2 hover:bg-blue-700 rounded-lg transition-colors"
            title="Appel vidéo"
          >
            <Video className="h-4 w-4" />
          </button>
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="p-2 hover:bg-blue-700 rounded-lg transition-colors"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
            
            {showDropdown && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                <button
                  onClick={handleArchive}
                  className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-t-lg"
                >
                  <Archive className="h-4 w-4" />
                  <span>Archiver</span>
                </button>
                <button
                  onClick={handleBlock}
                  className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Shield className="h-4 w-4" />
                  <span>Bloquer</span>
                </button>
                <button
                  onClick={handleDelete}
                  className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-b-lg"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Supprimer</span>
                </button>
              </div>
            )}
          </div>
          {onMinimize && (
            <button
              onClick={onMinimize}
              className="p-2 hover:bg-blue-700 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-blue-700 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {conversation.messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <MessageCircle className="h-12 w-12 mb-4" />
            <p>Aucun message pour le moment</p>
            <p className="text-sm">Commencez la conversation !</p>
          </div>
        ) : (
          conversation.messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.senderId === 'vendor_001' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div className={`max-w-xs px-3 py-2 rounded-lg ${
                message.senderId === 'vendor_001'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-900 border border-gray-200'
              }`}>
                {message.type === 'file' && (
                  <div className={`flex items-center space-x-2 mb-1 p-2 rounded ${
                    message.senderId === 'vendor_001' ? 'bg-blue-700' : 'bg-gray-100'
                  }`}>
                    {getFileIcon(message.type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{message.fileName}</p>
                      <p className="text-xs opacity-75">
                        {message.fileSize ? `${(message.fileSize / 1024).toFixed(1)} KB` : ''}
                      </p>
                    </div>
                    <button className="p-1 hover:bg-opacity-20 hover:bg-black rounded">
                      <Download className="h-3 w-3" />
                    </button>
                  </div>
                )}
                
                {message.type === 'image' && message.fileUrl && (
                  <img
                    src={message.fileUrl}
                    alt="Image partagée"
                    className="max-w-full h-auto rounded mb-2 cursor-pointer hover:opacity-90"
                    onClick={() => window.open(message.fileUrl, '_blank')}
                  />
                )}
                
                {message.type === 'text' && (
                  <p className="text-sm">{message.content}</p>
                )}
                
                <div className={`flex items-center justify-end mt-1 space-x-1 text-xs ${
                  message.senderId === 'vendor_001' ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  <span>{formatMessageTime(message.timestamp)}</span>
                  {getMessageStatusIcon(message)}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-gray-200 rounded-b-lg">
        {showEmojiPicker && (
          <div className="flex flex-wrap gap-1 mb-3 p-2 bg-gray-50 rounded-lg">
            {emojis.map((emoji) => (
              <button
                key={emoji}
                onClick={() => {
                  setNewMessage(prev => prev + emoji);
                  setShowEmojiPicker(false);
                }}
                className="p-1 hover:bg-gray-200 rounded text-lg transition-colors"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
          
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>
          
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileUpload}
            className="hidden"
            accept="image/*,.pdf,.doc,.docx,.txt"
          />
          
          <textarea
            value={newMessage}
            onChange={(e) => handleTyping(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Tapez votre message..."
            rows={1}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
          
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;