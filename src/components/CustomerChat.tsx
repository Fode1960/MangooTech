import React, { useState, useEffect } from 'react';
import { MessageCircle, X, Send, Paperclip, Smile, Phone, Video, MoreVertical, Search, ChevronDown } from 'lucide-react';
import { useChat } from '../contexts/ChatContext';
import { toast } from 'sonner';

interface CustomerChatProps {
  vendorId: string;
  vendorName: string;
  vendorAvatar?: string;
  onClose?: () => void;
}

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: Date;
  isRead: boolean;
  type: 'text' | 'file' | 'image';
  fileUrl?: string;
  fileName?: string;
}

const CustomerChat: React.FC<CustomerChatProps> = ({ 
  vendorId, 
  vendorName, 
  vendorAvatar = '👨‍🎨',
  onClose 
}) => {
  const { 
    state, 
    sendMessage, 
    startConversation, 
    markAsRead, 
    setTyping 
  } = useChat();
  
  const { conversations } = state;
  const currentUserId = state.currentUserId;
  
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [currentConversation, setCurrentConversation] = useState<string | null>(null);

  // Trouver ou créer la conversation avec le vendeur
  useEffect(() => {
    const conversation = conversations.find(conv => 
      conv.participants.some(p => p.id === vendorId)
    );
    
    if (conversation) {
      setCurrentConversation(conversation.id);
      conversation.messages
        .filter((msg) => !msg.isRead)
        .forEach((msg) => {
          markAsRead(conversation.id, msg.id);
        });
    } else {
      // Créer une nouvelle conversation
      startConversation(vendorId, vendorName, vendorAvatar);
      // La conversation sera créée et accessible via le contexte
    }
  }, [vendorId, vendorName, vendorAvatar, conversations, startConversation, markAsRead]);

  // Simuler des messages automatiques du vendeur
  useEffect(() => {
    if (!currentConversation) return;

    const interval = setInterval(() => {
      const messages = [
        "Bonjour! Comment puis-je vous aider aujourd'hui?",
        "Je suis là si vous avez des questions sur mes produits.",
        "N'hésitez pas à me demander plus d'informations!",
        "Je peux vous aider à choisir le meilleur produit pour vos besoins.",
        "Merci de votre intérêt pour ma boutique!"
      ];
      
      const randomMessage = messages[Math.floor(Math.random() * messages.length)];
      
      // Simuler un message entrant
      const incomingMessage: ChatMessage = {
        id: `msg_${Date.now()}_${Math.random()}`,
        senderId: vendorId,
        senderName: vendorName,
        content: randomMessage,
        timestamp: new Date(),
        isRead: false,
        type: 'text'
      };

      // Ajouter le message à la conversation actuelle
      if (currentConversation) {
        // Note: Dans une vraie implémentation, cela viendrait du WebSocket
        console.log('📨 Message simulé reçu:', randomMessage);
      }
    }, 45000); // Toutes les 45 secondes

    return () => clearInterval(interval);
  }, [currentConversation, vendorId, vendorName]);

  const handleSendMessage = () => {
    if (!message.trim() || !currentConversation) return;

    sendMessage(currentConversation, message.trim());
    setMessage('');
    
    // Arrêter l'indicateur de frappe
    if (typingTimeout) {
      clearTimeout(typingTimeout);
      setTypingTimeout(null);
    }
    setTyping(currentConversation, false);
  };

  const handleTyping = (value: string) => {
    setMessage(value);
    
    if (!currentConversation) return;
    
    // Indiquer que l'utilisateur est en train de taper
    if (!isTyping) {
      setTyping(currentConversation, true);
      setIsTyping(true);
    }
    
    // Réinitialiser le timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }
    
    const timeout = setTimeout(() => {
      setTyping(currentConversation, false);
      setIsTyping(false);
    }, 1000);
    
    setTypingTimeout(timeout);
  };

  const handleEmojiSelect = (emoji: string) => {
    setMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !currentConversation) return;

    // Simuler l'upload de fichier
    const fileMessage: ChatMessage = {
      id: `file_${Date.now()}`,
      senderId: currentUserId,
      senderName: 'Vous',
      content: `📎 ${file.name}`,
      timestamp: new Date(),
      isRead: true,
      type: 'file' as const,
      fileName: file.name,
      fileUrl: URL.createObjectURL(file)
    };

    // Dans une vraie implémentation, uploader le fichier d'abord
    sendMessage(currentConversation, fileMessage.content, 'file');
  };

  const getCurrentConversation = () => {
    if (!currentConversation) return null;
    return conversations.find(conv => conv.id === currentConversation);
  };

  const conversation = getCurrentConversation();

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsMinimized(false)}
          className="bg-gradient-to-r from-orange-500 to-green-600 text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 h-[500px] bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 z-50 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-green-600 text-white p-4 rounded-t-lg flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="text-2xl">{vendorAvatar}</div>
          <div>
            <h3 className="font-semibold">{vendorName}</h3>
            <p className="text-sm opacity-90">En ligne</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => toast.info(`Appel (démo) vers ${vendorName}`)}
            className="p-1 hover:bg-white/20 rounded"
          >
            <Phone className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => toast.info(`Appel vidéo (démo) vers ${vendorName}`)}
            className="p-1 hover:bg-white/20 rounded"
          >
            <Video className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => toast.info('Options (démo)')}
            className="p-1 hover:bg-white/20 rounded"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setIsMinimized(true)}
            className="p-1 hover:bg-white/20 rounded"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
          {onClose && (
            <button onClick={onClose} className="p-1 hover:bg-white/20 rounded">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher dans la conversation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {conversation?.messages && conversation.messages.length > 0 ? (
          conversation.messages
            .filter(msg => 
              searchQuery === '' || 
              msg.content.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .map((message) => (
            <div
              key={message.id}
              className={`flex ${message.senderId === currentUserId ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs px-4 py-2 rounded-lg ${
                  message.senderId === currentUserId
                    ? 'bg-gradient-to-r from-orange-500 to-green-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                }`}
              >
                <p className="text-sm">{message.content}</p>
                <p className={`text-xs mt-1 ${
                  message.senderId === currentUserId 
                    ? 'text-white/80' 
                    : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {new Date(message.timestamp).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <div className="text-center">
              <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Aucun message encore</p>
              <p className="text-xs mt-1">Commencez la conversation !</p>
            </div>
          </div>
        )}
        
        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-4 py-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        {showEmojiPicker && (
          <div className="mb-2 p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <div className="grid grid-cols-8 gap-1 text-lg">
              {['😀','😃','😄','😁','😆','😅','😂','🤣','😊','😇','🙂','🙃','😉','😌','😍','🥰','😘','😗','😙','😚','😋','😛','😝','😜','🤪','🤨','🧐','🤓','😎','🤩','🥳','😏','😒','😞','😔','😟','😕','🙁','☹️','😣','😖','😫','😩','🥺','😢','😭','😤','😠','😡','🤬','🤯','😳','🥵','🥶','😱','😨','😰','😥','😓','🤗','🤔','🤭','🤫','🤥','😶','😐','😑','😬','🙄','😯','😦','😧','😮','😲','🥱','😴','🤤','😪','😵','🤐','🥴','🤢','🤮','🤧','😷','🤒','🤕','🤑','🤠','😈','👿','👹','👺','🤡','💩','👻','💀','☠️','👽','👾','🤖','🎃','😺','😸','😹','😻','😼','😽','🙀','😿','😾'].slice(0, 40).map((emoji, index) => (
                <button
                  key={index}
                  onClick={() => handleEmojiSelect(emoji)}
                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-sm"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <Smile className="w-5 h-5" />
          </button>
          
          <label className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 cursor-pointer">
            <Paperclip className="w-5 h-5" />
            <input
              type="file"
              className="hidden"
              onChange={handleFileUpload}
              accept="image/*,.pdf,.doc,.docx"
            />
          </label>
          
          <input
            type="text"
            value={message}
            onChange={(e) => handleTyping(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Écrire un message..."
            className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          
          <button
            onClick={handleSendMessage}
            disabled={!message.trim()}
            className="p-2 bg-gradient-to-r from-orange-500 to-green-600 text-white rounded-lg hover:from-orange-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomerChat;
