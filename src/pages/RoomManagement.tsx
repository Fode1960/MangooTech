import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, Play, Clock } from 'lucide-react';

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

export default function RoomManagement() {
  const navigate = useNavigate();
  const [activeRooms, setActiveRooms] = useState<RoomInfo[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newRoomTitle, setNewRoomTitle] = useState('');
  const [newRoomVendor, setNewRoomVendor] = useState('');
  const [userRole, setUserRole] = useState<'vendor' | 'client'>('client');
  const [userId, setUserId] = useState('');

  useEffect(() => {
    // Récupérer les rooms actives
    fetchActiveRooms();
    
    // Rafraîchir toutes les 5 secondes
    const interval = setInterval(fetchActiveRooms, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchActiveRooms = async () => {
    try {
      const response = await fetch('http://localhost:3007/api/live-shopping/rooms/active');
      if (response.ok) {
        const rooms = await response.json();
        setActiveRooms(rooms);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des rooms:', error);
    }
  };

  const generateRoomId = () => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 4);
    return `live-${timestamp}-${random}`;
  };

  const handleCreateRoom = () => {
    if (!newRoomTitle.trim() || !newRoomVendor.trim()) {
      alert('Veuillez remplir tous les champs');
      return;
    }

    const roomId = generateRoomId();
    navigate(`/live-shopping/${roomId}`, {
      state: {
        roomId,
        title: newRoomTitle,
        vendor: newRoomVendor,
        role: 'vendor',
        userId: newRoomVendor
      }
    });
  };

  const handleJoinRoom = (room: RoomInfo) => {
    const userId = prompt('Entrez votre nom d\'utilisateur:');
    if (!userId?.trim()) return;

    navigate(`/live-shopping/${room.roomId}`, {
      state: {
        roomId: room.roomId,
        title: room.title,
        vendor: room.vendor,
        role: 'client',
        userId: userId.trim()
      }
    });
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'À l\'instant';
    if (diffInMinutes < 60) return `Il y a ${diffInMinutes} min`;
    if (diffInMinutes < 1440) return `Il y a ${Math.floor(diffInMinutes / 60)}h`;
    return `Il y a ${Math.floor(diffInMinutes / 1440)}j`;
  };

  return (
    <div className="min-h-screen bg-[#1b5e20] p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            🛍️ Live Shopping Rooms
          </h1>
          <p className="text-white/70">
            Créez ou rejoignez des sessions de shopping en direct
          </p>
        </div>

        {/* Bouton Créer une Room */}
        <div className="text-center mb-8">
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-[#1b5e20] hover:bg-[#16381a] text-white font-bold py-3 px-8 rounded-full shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center gap-2 mx-auto"
          >
            <Plus className="w-5 h-5" />
            Créer une Room
          </button>
        </div>

        {/* Formulaire de création */}
        {showCreateForm && (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mb-8 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-4">Créer une nouvelle room</h2>
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-white/70 mb-2">Titre du live</label>
                <input
                  type="text"
                  value={newRoomTitle}
                  onChange={(e) => setNewRoomTitle(e.target.value)}
                  placeholder="Ex: Soldes d'hiver -50%"
                  className="w-full px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#1b5e20]"
                />
              </div>
              <div>
                <label className="block text-white/70 mb-2">Nom du vendeur</label>
                <input
                  type="text"
                  value={newRoomVendor}
                  onChange={(e) => setNewRoomVendor(e.target.value)}
                  placeholder="Ex: Marie Boutique"
                  className="w-full px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#1b5e20]"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleCreateRoom}
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-6 rounded-lg transition-colors"
              >
                <Play className="w-4 h-4 inline mr-2" />
                Démarrer le Live
              </button>
              <button
                onClick={() => setShowCreateForm(false)}
                className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-6 rounded-lg transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        )}

        {/* Rooms Actives */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <Users className="w-6 h-6" />
            Rooms Actives ({activeRooms.length})
          </h2>

          {activeRooms.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎬</div>
              <p className="text-white/70 text-lg">Aucune room active pour le moment</p>
              <p className="text-white/50 text-sm mt-2">Soyez le premier à créer une session de live shopping !</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeRooms.map((room) => (
                <div key={room.roomId} className="bg-white/10 rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-all duration-200">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-bold text-white text-lg mb-1">{room.title}</h3>
                      <p className="text-white/70 text-sm">par {room.vendor}</p>
                    </div>
                    <div className="flex items-center gap-2 text-green-400">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium">LIVE</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-white/70 mb-4">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{room.viewers} viewers</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{formatTimeAgo(room.createdAt)}</span>
                    </div>
                  </div>

                  {room.currentProduct && (
                    <div className="bg-white/10 rounded-lg p-2 mb-3">
                      <p className="text-white text-sm font-medium truncate">
                        {room.currentProduct.name}
                      </p>
                      <p className="text-white/70 text-xs">
                        {room.currentProduct.price}
                      </p>
                    </div>
                  )}

                  <button
                    onClick={() => handleJoinRoom(room)}
                    className="w-full bg-[#1b5e20] hover:bg-[#16381a] text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-105"
                  >
                    Rejoindre
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-white/70">
          <p className="text-sm">
            💡 Les rooms se créent automatiquement quand un vendeur démarre un live
          </p>
        </div>
      </div>
    </div>
  );
}