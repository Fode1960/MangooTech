import React, { useState, useRef } from 'react';
import { MessageCircle, Users, Video, Send, Smile, Paperclip } from 'lucide-react';
import { Toaster, toast } from 'sonner';

const ChatSystem: React.FC = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'them',
      text: 'Bonjour, est-ce que ce produit est encore disponible ?',
      timestamp: '10:30',
      status: 'read'
    },
    {
      id: 2,
      sender: 'me',
      text: 'Bonjour Aminata! Oui, le produit est toujours disponible.',
      timestamp: '10:32',
      status: 'read'
    },
    {
      id: 3,
      sender: 'them',
      text: 'Parfait! Je vais passer commande maintenant',
      timestamp: '10:35',
      status: 'delivered'
    }
  ]);

  const [newMessage, setNewMessage] = useState('');
  const [selectedChat, setSelectedChat] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const chats = [
    {
      id: 1,
      user: 'Aminata D.',
      lastMessage: 'Bonjour, est-ce que ce produit est encore disponible ?',
      timestamp: '10:30',
      unread: 2,
      avatar: 'AD',
      online: true
    },
    {
      id: 2,
      user: 'Ousmane B.',
      lastMessage: 'Merci pour votre achat!',
      timestamp: 'Hier',
      unread: 0,
      avatar: 'OB',
      online: false
    },
    {
      id: 3,
      user: 'Fatou K.',
      lastMessage: 'Je vais passer commande ce soir',
      timestamp: 'Hier',
      unread: 1,
      avatar: 'FK',
      online: true
    }
  ];

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const newMsg = {
        id: messages.length + 1,
        sender: 'me' as const,
        text: newMessage,
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        status: 'sent'
      };
      setMessages([...messages, newMsg]);
      setNewMessage('');
      toast.success('Message envoyé!');
    }
  };

  const handleFileAttachment = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      toast.success(`Fichier sélectionné: ${file.name}`);
      // Ici vous pouvez ajouter la logique d'upload de fichier
    }
  };

  const handleEmojiClick = () => {
    // Pour l'instant, on affiche un toast avec des emojis courants
    const emojis = ['😀', '😂', '😍', '🤔', '👍', '❤️', '🎉', '🔥'];
    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
    setNewMessage(prev => prev + randomEmoji);
    toast.success('Emoji ajouté!');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
      <Toaster position="top-right" />
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-orange-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <MessageCircle className="w-8 h-8 text-orange-500 mr-3" />
                Chat en Direct
              </h1>
              <p className="text-gray-600 mt-2">Discutez avec vos clients et vendeurs</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-500">3</div>
                <div className="text-sm text-gray-500">En ligne</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-500">3</div>
                <div className="text-sm text-gray-500">Non lus</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Chat List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Conversations</h2>
              </div>
              <div className="divide-y divide-gray-200">
                {chats.map((chat) => (
                  <div
                    key={chat.id}
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                      selectedChat === chat.id ? 'bg-orange-50 border-r-2 border-orange-500' : ''
                    }`}
                    onClick={() => setSelectedChat(chat.id)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <div className="w-12 h-12 bg-gradient-to-r from-orange-400 to-amber-400 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold">{chat.avatar}</span>
                        </div>
                        {chat.online && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-semibold text-gray-900 truncate">{chat.user}</h3>
                          <span className="text-xs text-gray-500">{chat.timestamp}</span>
                        </div>
                        <p className="text-sm text-gray-600 truncate">{chat.lastMessage}</p>
                      </div>
                      {chat.unread > 0 && (
                        <span className="bg-orange-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                          {chat.unread}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg h-[600px] flex flex-col">
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-200 flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-orange-400 to-amber-400 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold">AD</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Aminata D.</h3>
                  <p className="text-sm text-green-500">En ligne</p>
                </div>
                <div className="ml-auto flex items-center space-x-2">
                  <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                    <Video className="w-5 h-5" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                    <Users className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === 'me' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.sender === 'me'
                          ? 'bg-orange-500 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="text-sm">{message.text}</p>
                      <div className={`flex items-center justify-between mt-1 text-xs ${
                        message.sender === 'me' ? 'text-orange-100' : 'text-gray-500'
                      }`}>
                        <span>{message.timestamp}</span>
                        {message.sender === 'me' && (
                          <span>
                            {message.status === 'read' ? 'Lu' : 'Envoyé'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-gray-200">
                <div className="flex items-center space-x-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/*,.pdf,.doc,.docx"
                  />
                  <button 
                    onClick={handleFileAttachment}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <Paperclip className="w-5 h-5" />
                  </button>
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Écrire un message..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                  <button 
                    onClick={handleEmojiClick}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <Smile className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    className="bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white p-2 rounded-lg transition-colors"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatSystem;