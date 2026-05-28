import React, { useState } from 'react';
import { X, Plus, Tag, User, Video } from 'lucide-react';
import { generateRoomId, generateMemorableRoomId } from '../utils/roomUtils';

interface RoomCreatorProps {
  isOpen: boolean;
  onClose: () => void;
  onRoomCreated: (roomId: string, roomInfo: any) => void;
  vendorId: string;
  vendorName: string;
}

export const RoomCreator: React.FC<RoomCreatorProps> = ({
  isOpen,
  onClose,
  onRoomCreated,
  vendorId,
  vendorName
}) => {
  const [formData, setFormData] = useState({
    title: '',
    roomId: '',
    category: 'fashion',
    tags: '',
    useMemorableId: true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categories = [
    { value: 'fashion', label: 'Mode & Accessoires' },
    { value: 'beauty', label: 'Beauté & Soins' },
    { value: 'home', label: 'Maison & Déco' },
    { value: 'electronics', label: 'Électronique' },
    { value: 'food', label: 'Alimentation' },
    { value: 'art', label: 'Art & Artisanat' },
    { value: 'other', label: 'Autre' }
  ];

  const generateNewId = () => {
    const newId = formData.useMemorableId 
      ? generateMemorableRoomId()
      : generateRoomId(vendorName);
    
    setFormData(prev => ({ ...prev, roomId: newId }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Valider les données
      if (!formData.title.trim()) {
        throw new Error('Le titre est requis');
      }

      if (!formData.roomId.trim()) {
        throw new Error('L\'ID de la room est requis');
      }

      const roomInfo = {
        roomId: formData.roomId,
        title: formData.title,
        vendor: vendorName,
        vendorId: vendorId,
        category: formData.category,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
        viewers: 0,
        isActive: true,
        createdAt: new Date().toISOString()
      };

      // Appeler le callback avec les informations de la room
      onRoomCreated(formData.roomId, roomInfo);
      
      // Réinitialiser le formulaire
      setFormData({
        title: '',
        roomId: '',
        category: 'fashion',
        tags: '',
        useMemorableId: true
      });
      
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <Video className="w-5 h-5" />
            Créer une Session Live
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Titre de la session
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: Collection Wax Premium 2024"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ID de la room
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={formData.roomId}
                onChange={(e) => setFormData(prev => ({ ...prev, roomId: e.target.value }))}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: ELEGANT-ANKARA-2024"
                required
              />
              <button
                type="button"
                onClick={generateNewId}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
              >
                Générer
              </button>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <input
                type="checkbox"
                id="memorableId"
                checked={formData.useMemorableId}
                onChange={(e) => setFormData(prev => ({ ...prev, useMemorableId: e.target.checked }))}
                className="rounded"
              />
              <label htmlFor="memorableId" className="text-sm text-gray-600">
                Utiliser un ID mémorisable
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Catégorie
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Tag className="w-4 h-4" />
              Tags (séparés par des virgules)
            </label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: wax, tradition, ankara, african"
            />
          </div>

          <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
            <User className="w-4 h-4 text-blue-600" />
            <span className="text-sm text-blue-800">
              Vendeur: <strong>{vendorName}</strong>
            </span>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
            >
              {loading ? 'Création...' : 'Créer la Session'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};