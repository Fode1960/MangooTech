import React, { useState, useEffect } from 'react';
import { MapPin, CheckCircle, XCircle } from 'lucide-react';
import { 
  getGeolocationConsent, 
  hasGeolocationConsent, 
  updateUserLocation, 
  revokeGeolocationConsent,
  GeolocationConsentData 
} from '../utils/geolocationConsent';

interface GeolocationConsentManagerProps {
  userId: string;
  className?: string;
}

export const GeolocationConsentManager: React.FC<GeolocationConsentManagerProps> = ({ 
  userId, 
  className = '' 
}) => {
  const [consentData, setConsentData] = useState<GeolocationConsentData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    loadConsentData();
  }, []);

  const loadConsentData = () => {
    const data = getGeolocationConsent();
    setConsentData(data);
  };

  const handleUpdateLocation = async () => {
    setIsLoading(true);
    setMessage('');
    
    try {
      await updateUserLocation(userId);
      loadConsentData();
      setMessage('Localisation mise à jour avec succès!');
    } catch (error) {
      console.error('Error updating location:', error);
      setMessage('Erreur lors de la mise à jour de la localisation.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevokeConsent = () => {
    if (window.confirm('Êtes-vous sûr de vouloir révoquer votre consentement à la géolocalisation ?')) {
      revokeGeolocationConsent(userId);
      loadConsentData();
      setMessage('Consentement révoqué avec succès.');
    }
  };

  if (!consentData) {
    return (
      <div className={`bg-gray-50 border border-gray-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center space-x-2 text-gray-600">
          <MapPin className="h-5 w-5" />
          <span>Aucune donnée de géolocalisation trouvée.</span>
        </div>
      </div>
    );
  }

  const hasConsent = consentData.consentGiven;
  const location = consentData.locationData;

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
      <div className="space-y-4">
        {/* Consent Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {hasConsent ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
            <span className="font-medium">
              {hasConsent ? 'Consentement accordé' : 'Consentement refusé'}
            </span>
          </div>
          <span className="text-sm text-gray-500">
            {new Date(consentData.consentTimestamp).toLocaleDateString()}
          </span>
        </div>

        {/* Location Data */}
        {hasConsent && location && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-2">
              <MapPin className="h-4 w-4 text-green-600" />
              <span className="font-medium text-green-800">Localisation actuelle</span>
            </div>
            <div className="text-sm text-green-700 space-y-1">
              <div>Latitude: {location.latitude.toFixed(6)}</div>
              <div>Longitude: {location.longitude.toFixed(6)}</div>
              <div>Précision: ±{location.accuracy.toFixed(0)}m</div>
              <div>Mis à jour: {new Date(location.timestamp).toLocaleString()}</div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-2">
          {hasConsent && (
            <>
              <button
                onClick={handleUpdateLocation}
                disabled={isLoading}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Mise à jour...' : 'Mettre à jour la position'}
              </button>
              <button
                onClick={handleRevokeConsent}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Révoquer le consentement
              </button>
            </>
          )}
        </div>

        {/* Message */}
        {message && (
          <div className={`text-sm p-2 rounded ${
            message.includes('Erreur') 
              ? 'bg-red-50 text-red-700 border border-red-200' 
              : 'bg-green-50 text-green-700 border border-green-200'
          }`}>
            {message}
          </div>
        )}

        {/* Info */}
        <div className="text-xs text-gray-500">
          <p>
            Vos données de localisation sont stockées localement et ne sont pas partagées avec des services tiers.
            Elles nous permettent de vous offrir des fonctionnalités basées sur votre position géographique.
          </p>
        </div>
      </div>
    </div>
  );
};