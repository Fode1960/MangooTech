import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, Play, Clock, Film, ShoppingBag, Phone } from 'lucide-react';

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

// Version sans authentification pour tests faciles
const RoomManagementPublic: React.FC = () => {
  const navigate = useNavigate();
  const [activeRooms, setActiveRooms] = useState<RoomInfo[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newRoomTitle, setNewRoomTitle] = useState('');
  const [newRoomVendor, setNewRoomVendor] = useState('');
  const [userId, setUserId] = useState('');
  const [userRole, setUserRole] = useState<'vendor' | 'client'>('client');

  useEffect(() => {
    // Générer un userId par défaut pour les tests
    const defaultUserId = 'user-' + Math.random().toString(36).substr(2, 9);
    setUserId(defaultUserId);
    
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
    
    // Mode test : naviguer directement sans authentification
    const testUserId = newRoomVendor || userId;
    
    // Ouvrir dans un nouvel onglet pour faciliter les tests multi-utilisateurs
    const url = `/live-shopping-test-room/${roomId}?title=${encodeURIComponent(newRoomTitle)}&vendor=${encodeURIComponent(newRoomVendor)}&role=vendor&userId=${encodeURIComponent(testUserId)}`;
    window.open(url, '_blank');
    
    // Réinitialiser le formulaire
    setShowCreateForm(false);
    setNewRoomTitle('');
    setNewRoomVendor('');
    
    // Rafraîchir la liste des rooms
    setTimeout(fetchActiveRooms, 1000);
  };

  const handleJoinRoom = (room: RoomInfo) => {
    const clientUserId = prompt('Entrez votre nom d\'utilisateur (ou laissez vide pour un nom aléatoire):') || 'client-' + Math.random().toString(36).substr(2, 9);
    
    // Ouvrir dans un nouvel onglet
    const url = `/live-shopping-test-room/${room.roomId}?title=${encodeURIComponent(room.title)}&vendor=${encodeURIComponent(room.vendor)}&role=client&userId=${encodeURIComponent(clientUserId)}`;
    window.open(url, '_blank');
  };

  const handleQuickTest = () => {
    // Test rapide avec des données pré-remplies
    setNewRoomTitle('Collection Wax Premium 2024');
    setNewRoomVendor('Marie Boutique');
    setShowCreateForm(true);
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
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            🛍️ Live Shopping Rooms (Test)
          </h1>
          <p className="text-purple-200">
            Système de rooms multiples - Mode Test Sans Authentification
          </p>
        </div>

        {/* Boutons Rapides */}
        <div className="text-center mb-8 space-x-4">
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold py-3 px-8 rounded-full shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center gap-2 mx-auto mb-4"
          >
            <Plus className="w-5 h-5" />
            Créer une Room
          </button>
          
          <button
            onClick={handleQuickTest}
            className="bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white font-bold py-3 px-8 rounded-full shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center gap-2 mx-auto"
          >
            <Play className="w-5 h-5" />
            Test Rapide
          </button>
        </div>

        {/* Formulaire de création */}
        {showCreateForm && (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mb-8 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-4">Créer une nouvelle room</h2>
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-purple-200 mb-2">Titre du live</label>
                <input
                  type="text"
                  value={newRoomTitle}
                  onChange={(e) => setNewRoomTitle(e.target.value)}
                  placeholder="Ex: Soldes d'hiver -50%"
                  className="w-full px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>
              <div>
                <label className="block text-purple-200 mb-2">Nom du vendeur</label>
                <input
                  type="text"
                  value={newRoomVendor}
                  onChange={(e) => setNewRoomVendor(e.target.value)}
                  placeholder="Ex: Marie Boutique"
                  className="w-full px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400"
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
              <p className="text-purple-200 text-lg">Aucune room active pour le moment</p>
              <p className="text-purple-300 text-sm mt-2">Soyez le premier à créer une session de live shopping !</p>
              <button
                onClick={handleQuickTest}
                className="mt-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-2 px-6 rounded-lg transition-colors"
              >
                Créer une Room de Test
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeRooms.map((room) => (
                <div key={room.roomId} className="bg-white/10 rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-all duration-200">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-bold text-white text-lg mb-1">{room.title}</h3>
                      <p className="text-purple-200 text-sm">par {room.vendor}</p>
                    </div>
                    <div className="flex items-center gap-2 text-green-400">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium">LIVE</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-purple-200 mb-4">
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
                    <div className="bg-purple-500/20 rounded-lg p-2 mb-3">
                      <p className="text-white text-sm font-medium truncate">
                        📦 {room.currentProduct.name}
                      </p>
                      <p className="text-purple-200 text-xs">
                        {room.currentProduct.price}
                      </p>
                    </div>
                  )}

                  <button
                    onClick={() => handleJoinRoom(room)}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-105"
                  >
                    Rejoindre
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
          <h3 className="text-xl font-bold text-white mb-4">📖 Guide de Test Rapide</h3>
          <div className="grid md:grid-cols-2 gap-6 text-purple-200">
            <div>
              <h4 className="font-semibold text-white mb-2">Pour le Vendeur :</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Cliquez sur "Créer une Room"</li>
                <li>Remplissez le titre et votre nom</li>
                <li>Cliquez sur "Démarrer le Live"</li>
                <li>Sélectionnez des produits à présenter</li>
                <li>Répondez aux appels des clients</li>
              </ol>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-2">Pour le Client :</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Rejoignez une room active</li>
                <li>Chattez avec le vendeur</li>
                <li>Voyez les produits présentés</li>
                <li>Appelez le vendeur si besoin</li>
                <li>Chaque room dans un onglet séparé</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-purple-200">
          <p className="text-sm">
            💡 <strong>Astuce :</strong> Ouvrez plusieurs onglets pour tester plusieurs rooms simultanément
          </p>
          <p className="text-xs mt-2">
            🔄 Les rooms se mettent à jour automatiquement toutes les 5 secondes
          </p>
        </div>
      </div>
    </div>
  );
};

export default RoomManagementPublic;