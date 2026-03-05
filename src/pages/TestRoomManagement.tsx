import React, { useState, useEffect } from 'react';
import { RoomList } from '../components/RoomList';
import { RoomCreator } from '../components/RoomCreator';
import { generateMemorableRoomId } from '../utils/roomUtils';
import { Users, Plus, Play, Store } from 'lucide-react';

const TestRoomManagement: React.FC = () => {
  const [showCreator, setShowCreator] = useState(false);
  const [userRole, setUserRole] = useState<'vendor' | 'client'>('client');
  const [currentRoom, setCurrentRoom] = useState<string>('');
  const [userId] = useState('test-user-' + Math.random().toString(36).substr(2, 9));
  const [userName] = useState('Test User');

  const handleRoomSelect = (roomId: string) => {
    console.log(`Sélection de la room: ${roomId}`);
    setCurrentRoom(roomId);
    alert(`Room sélectionnée: ${roomId}`);
  };

  const handleCreateRoom = (roomId: string, roomInfo: any) => {
    console.log(`Création de la room: ${roomId}`, roomInfo);
    setCurrentRoom(roomId);
    setShowCreator(false);
    alert(`Room créée: ${roomId} - ${roomInfo.title}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                🛍️ Test Room Management
              </h1>
              <p className="text-gray-600">
                Test de la gestion des rooms Live Shopping
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                <Store className="w-5 h-5 text-blue-600" />
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

        {/* Current Room Info */}
        {currentRoom && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-green-800">Room Active</h3>
                <p className="text-green-700">{currentRoom}</p>
              </div>
              <button
                onClick={() => setCurrentRoom('')}
                className="text-green-600 hover:text-green-800 transition-colors"
              >
                Quitter
              </button>
            </div>
          </div>
        )}

        {/* Room List */}
        <RoomList
          onRoomSelect={handleRoomSelect}
          onCreateRoom={userRole === 'vendor' ? () => setShowCreator(true) : undefined}
          currentRoomId={currentRoom}
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
                <Play className="w-5 h-5" />
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

export default TestRoomManagement;