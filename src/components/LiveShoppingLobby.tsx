import React, { useState } from 'react';
import { useLiveShopping } from '../contexts/LiveShoppingContext';
import { RoomList } from '../components/RoomList';
import { RoomCreator } from '../components/RoomCreator';
import { generateRoomId, generateMemorableRoomId } from '../utils/roomUtils';
import { Store, User, Plus } from 'lucide-react';

interface LiveShoppingLobbyProps {
  onRoomJoined: (roomId: string, role: 'vendor' | 'client') => void;
  userId?: string;
  userName?: string;
}

export const LiveShoppingLobby: React.FC<LiveShoppingLobbyProps> = ({
  onRoomJoined,
  userId = 'user-' + Math.random().toString(36).substr(2, 9),
  userName = 'Utilisateur'
}) => {
  const { joinRoom, currentRoomId } = useLiveShopping();
  const [showCreator, setShowCreator] = useState(false);
  const [userRole, setUserRole] = useState<'vendor' | 'client'>('client');

  const handleRoomSelect = (roomId: string) => {
    joinRoom(roomId, userId, userRole);
    onRoomJoined(roomId, userRole);
  };

  const handleCreateRoom = (roomId: string, roomInfo: any) => {
    console.log(`=== Création de la room: ${roomId} ===`);
    console.log('Room info:', roomInfo);
    
    // Rejoindre la room en tant que vendeur
    joinRoom(roomId, userId, 'vendor', roomInfo);
    onRoomJoined(roomId, 'vendor');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                🛍️ Live Shopping Center
              </h1>
              <p className="text-gray-600">
                Découvrez et participez aux sessions live shopping
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                <User className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-blue-800">{userName}</p>
                  <p className="text-xs text-blue-600">ID: {userId.slice(-6)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Role Selection */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Je suis...</h2>
          <div className="flex gap-4">
            <button
              onClick={() => setUserRole('client')}
              className={`flex-1 p-4 rounded-lg border-2 transition-colors ${
                userRole === 'client'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-center">
                <div className="text-2xl mb-2">🛒</div>
                <h3 className="font-semibold">Client</h3>
                <p className="text-sm text-gray-600">Je veux découvrir et acheter des produits</p>
              </div>
            </button>
            <button
              onClick={() => setUserRole('vendor')}
              className={`flex-1 p-4 rounded-lg border-2 transition-colors ${
                userRole === 'vendor'
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-center">
                <div className="text-2xl mb-2">🏪</div>
                <h3 className="font-semibold">Vendeur</h3>
                <p className="text-sm text-gray-600">Je veux présenter et vendre mes produits</p>
              </div>
            </button>
          </div>
        </div>

        {/* Room List */}
        <RoomList
          onRoomSelect={handleRoomSelect}
          onCreateRoom={userRole === 'vendor' ? () => setShowCreator(true) : undefined}
          currentRoomId={currentRoomId}
        />

        {/* Quick Actions for Vendors */}
        {userRole === 'vendor' && (
          <div className="bg-white rounded-lg shadow-md p-6 mt-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Actions Rapides</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => setShowCreator(true)}
                className="flex items-center justify-center gap-3 p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <Plus className="w-5 h-5" />
                <div className="text-left">
                  <h3 className="font-semibold">Créer une Session</h3>
                  <p className="text-sm opacity-90">Démarrer un nouveau live shopping</p>
                </div>
              </button>
              <button
                onClick={() => {
                  // Générer une room avec un ID mémorisable
                  const memorableId = generateMemorableRoomId();
                  const roomInfo = {
                    roomId: memorableId,
                    title: `Session Rapide de ${userName}`,
                    vendor: userName,
                    vendorId: userId,
                    category: 'fashion',
                    viewers: 0,
                    isActive: true,
                    createdAt: new Date().toISOString()
                  };
                  handleCreateRoom(memorableId, roomInfo);
                }}
                className="flex items-center justify-center gap-3 p-4 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                <Store className="w-5 h-5" />
                <div className="text-left">
                  <h3 className="font-semibold">Session Rapide</h3>
                  <p className="text-sm opacity-90">Démarrer immédiatement avec un ID généré</p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Room Creator Modal */}
        <RoomCreator
          isOpen={showCreator}
          onClose={() => setShowCreator(false)}
          onRoomCreated={handleCreateRoom}
          vendorId={userId}
          vendorName={userName}
        />
      </div>
    </div>
  );
};