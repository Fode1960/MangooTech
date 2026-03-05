import React, { useState, useEffect } from 'react';
import { Users, Calendar, Package, Plus, Play } from 'lucide-react';

export interface Room {
  roomId: string;
  title: string;
  vendor: string;
  vendorId: string;
  viewers: number;
  currentProduct?: string;
  isActive: boolean;
  createdAt: string;
  category?: string;
  tags?: string[];
}

interface RoomListProps {
  onRoomSelect: (roomId: string) => void;
  onCreateRoom?: () => void;
  currentRoomId?: string;
}

export const RoomList: React.FC<RoomListProps> = ({ 
  onRoomSelect, 
  onCreateRoom,
  currentRoomId 
}) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchActiveRooms();
    const interval = setInterval(fetchActiveRooms, 10000); // Rafraîchir toutes les 10 secondes
    return () => clearInterval(interval);
  }, []);

  const fetchActiveRooms = async () => {
    try {
      const response = await fetch('http://localhost:3007/api/live-shopping/rooms/active');
      if (!response.ok) throw new Error('Erreur lors du chargement des rooms');
      
      const data = await response.json();
      setRooms(data);
      setError(null);
    } catch (err) {
      setError('Impossible de charger les rooms actives');
      console.error('Erreur lors du chargement des rooms:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "À l'instant";
    if (diffInMinutes < 60) return `Il y a ${diffInMinutes} min`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `Il y a ${diffInHours}h`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `Il y a ${diffInDays}j`;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Sessions Live Actives</h2>
          {onCreateRoom && (
            <button
              onClick={onCreateRoom}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Créer une Room
            </button>
          )}
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 h-20 rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Sessions Live Actives</h2>
          {onCreateRoom && (
            <button
              onClick={onCreateRoom}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Créer une Room
            </button>
          )}
        </div>
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchActiveRooms}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800">
          Sessions Live Actives ({rooms.length})
        </h2>
        {onCreateRoom && (
          <button
            onClick={onCreateRoom}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Créer une Room
          </button>
        )}
      </div>

      {rooms.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">Aucune session live active pour le moment</p>
          {onCreateRoom && (
            <button
              onClick={onCreateRoom}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 mx-auto transition-colors"
            >
              <Play className="w-4 h-4" />
              Démarrer une Session
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {rooms.map((room) => (
            <div
              key={room.roomId}
              className={`border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                currentRoomId === room.roomId ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
              }`}
              onClick={() => onRoomSelect(room.roomId)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800 mb-1">{room.title}</h3>
                  <p className="text-sm text-gray-600 mb-2">par {room.vendor}</p>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{room.viewers} viewers</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{formatTimeAgo(room.createdAt)}</span>
                    </div>
                    {room.currentProduct && (
                      <div className="flex items-center gap-1">
                        <Package className="w-4 h-4" />
                        <span className="text-green-600">Produit en cours</span>
                      </div>
                    )}
                  </div>
                  
                  {room.tags && room.tags.length > 0 && (
                    <div className="flex gap-2 mt-2">
                      {room.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRoomSelect(room.roomId);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors"
                  >
                    Rejoindre
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};