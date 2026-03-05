import React, { useState, useEffect, useRef } from 'react';
import { Truck, Package, MapPin, Navigation, Clock, User } from 'lucide-react';

interface DeliveryPartner {
  id: string;
  name: string;
  phone: string;
  vehicleType: 'moto' | 'car' | 'van';
  status: 'available' | 'busy' | 'offline';
  currentLocation: { lat: number; lng: number };
}

interface DeliveryLocation {
  id: string;
  address: string;
  coordinates: { lat: number; lng: number };
  type: 'pickup' | 'delivery';
  estimatedTime?: string;
}

interface DeliveryTrackingMapProps {
  deliveryPartner?: DeliveryPartner;
  pickupLocation?: DeliveryLocation;
  deliveryLocation?: DeliveryLocation;
  currentDeliveryLocation?: { lat: number; lng: number };
  onPartnerUpdate?: (location: { lat: number; lng: number }) => void;
}

const DeliveryTrackingMap: React.FC<DeliveryTrackingMapProps> = ({
  deliveryPartner,
  pickupLocation,
  deliveryLocation,
  currentDeliveryLocation,
  onPartnerUpdate
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapCenter, setMapCenter] = useState({ lat: 5.3600, lng: -4.0083 }); // Abidjan coordinates
  const [zoom, setZoom] = useState(13);
  const [isTracking, setIsTracking] = useState(false);
  const [routeProgress, setRouteProgress] = useState(0);

  // Simulated map tiles (grid-based approach for demo)
  const generateMapTiles = () => {
    const tiles = [];
    const tileSize = 50; // pixels
    const gridSize = 10; // 10x10 grid
    
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const isWater = Math.random() > 0.8;
        const isRoad = Math.random() > 0.7 && !isWater;
        const isBuilding = Math.random() > 0.6 && !isWater && !isRoad;
        
        tiles.push({
          id: `${row}-${col}`,
          x: col * tileSize,
          y: row * tileSize,
          type: isWater ? 'water' : isRoad ? 'road' : isBuilding ? 'building' : 'land'
        });
      }
    }
    return tiles;
  };

  const [mapTiles] = useState(generateMapTiles());

  // Calculate pixel position from coordinates
  const coordToPixel = (lat: number, lng: number) => {
    const latDiff = lat - mapCenter.lat;
    const lngDiff = lng - mapCenter.lng;
    const scale = Math.pow(2, zoom - 1) * 10000;
    
    return {
      x: 250 + (lngDiff * scale),
      y: 250 - (latDiff * scale)
    };
  };

  // Simulate GPS tracking
  useEffect(() => {
    if (!isTracking || !deliveryPartner) return;

    const interval = setInterval(() => {
      // Simulate movement along route
      setRouteProgress(prev => Math.min(prev + 0.1, 1));
      
      if (onPartnerUpdate) {
        // Simulate GPS coordinates update
        const newLat = mapCenter.lat + (Math.random() - 0.5) * 0.001;
        const newLng = mapCenter.lng + (Math.random() - 0.5) * 0.001;
        onPartnerUpdate({ lat: newLat, lng: newLng });
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isTracking, deliveryPartner, mapCenter, onPartnerUpdate]);

  const getTileColor = (type: string) => {
    switch (type) {
      case 'water': return 'bg-blue-200';
      case 'road': return 'bg-gray-300';
      case 'building': return 'bg-gray-400';
      default: return 'bg-green-200';
    }
  };

  const getVehicleIcon = (type: string) => {
    switch (type) {
      case 'moto': return '🏍️';
      case 'car': return '🚗';
      case 'van': return '🚐';
      default: return '🚚';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'text-green-600 bg-green-100';
      case 'busy': return 'text-orange-600 bg-orange-100';
      case 'offline': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Map Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Navigation className="w-6 h-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Tracking GPS en Temps Réel</h3>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsTracking(!isTracking)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              isTracking 
                ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            }`}
          >
            {isTracking ? 'Arrêter le tracking' : 'Démarrer le tracking'}
          </button>
          <button
            onClick={() => setZoom(Math.min(zoom + 1, 18))}
            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium"
          >
            +
          </button>
          <button
            onClick={() => setZoom(Math.max(zoom - 1, 1))}
            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium"
          >
            -
          </button>
        </div>
      </div>

      {/* Map Container */}
      <div className="relative bg-blue-50 rounded-lg overflow-hidden" style={{ height: '500px' }}>
        {/* Simulated Map */}
        <div className="absolute inset-0" ref={mapRef}>
          {/* Map Tiles */}
          <div className="relative w-full h-full">
            {mapTiles.map((tile) => (
              <div
                key={tile.id}
                className={`absolute ${getTileColor(tile.type)}`}
                style={{
                  left: `${tile.x}px`,
                  top: `${tile.y}px`,
                  width: '50px',
                  height: '50px'
                }}
              />
            ))}
          </div>

          {/* Pickup Location */}
          {pickupLocation && (
            <div
              className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20"
              style={{
                left: `${coordToPixel(pickupLocation.coordinates.lat, pickupLocation.coordinates.lng).x}px`,
                top: `${coordToPixel(pickupLocation.coordinates.lat, pickupLocation.coordinates.lng).y}px`
              }}
            >
              <div className="relative">
                <div className="absolute -inset-2 bg-blue-400 rounded-full animate-ping opacity-75"></div>
                <div className="relative bg-blue-600 text-white p-2 rounded-full shadow-lg">
                  <Package className="w-4 h-4" />
                </div>
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 bg-white px-2 py-1 rounded shadow-lg text-xs font-medium whitespace-nowrap">
                  {pickupLocation.address}
                </div>
              </div>
            </div>
          )}

          {/* Delivery Location */}
          {deliveryLocation && (
            <div
              className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20"
              style={{
                left: `${coordToPixel(deliveryLocation.coordinates.lat, deliveryLocation.coordinates.lng).x}px`,
                top: `${coordToPixel(deliveryLocation.coordinates.lat, deliveryLocation.coordinates.lng).y}px`
              }}
            >
              <div className="relative">
                <div className="absolute -inset-2 bg-green-400 rounded-full animate-ping opacity-75"></div>
                <div className="relative bg-green-600 text-white p-2 rounded-full shadow-lg">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 bg-white px-2 py-1 rounded shadow-lg text-xs font-medium whitespace-nowrap">
                  {deliveryLocation.address}
                </div>
              </div>
            </div>
          )}

          {/* Delivery Partner */}
          {deliveryPartner && (
            <div
              className="absolute transform -translate-x-1/2 -translate-y-1/2 z-30"
              style={{
                left: `${coordToPixel(
                  currentDeliveryLocation?.lat || deliveryPartner.currentLocation.lat,
                  currentDeliveryLocation?.lng || deliveryPartner.currentLocation.lng
                ).x}px`,
                top: `${coordToPixel(
                  currentDeliveryLocation?.lat || deliveryPartner.currentLocation.lat,
                  currentDeliveryLocation?.lng || deliveryPartner.currentLocation.lng
                ).y}px`
              }}
            >
              <div className="relative">
                <div className="absolute -inset-2 bg-orange-400 rounded-full animate-pulse opacity-75"></div>
                <div className="relative bg-orange-600 text-white p-3 rounded-full shadow-lg flex items-center justify-center">
                  <span className="text-lg">{getVehicleIcon(deliveryPartner.vehicleType)}</span>
                </div>
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 bg-white px-2 py-1 rounded shadow-lg text-xs font-medium whitespace-nowrap">
                  {deliveryPartner.name}
                </div>
              </div>
            </div>
          )}

          {/* Route Line (simplified) */}
          {pickupLocation && deliveryLocation && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
              <line
                x1={coordToPixel(pickupLocation.coordinates.lat, pickupLocation.coordinates.lng).x}
                y1={coordToPixel(pickupLocation.coordinates.lat, pickupLocation.coordinates.lng).y}
                x2={coordToPixel(deliveryLocation.coordinates.lat, deliveryLocation.coordinates.lng).x}
                y2={coordToPixel(deliveryLocation.coordinates.lat, deliveryLocation.coordinates.lng).y}
                stroke="#3B82F6"
                strokeWidth="3"
                strokeDasharray="10,5"
                opacity="0.7"
              />
            </svg>
          )}
        </div>

        {/* Map Controls */}
        <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-2 space-y-2">
          <button className="p-2 hover:bg-gray-100 rounded" title="Centrer">
            <Navigation className="w-4 h-4" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded" title="Actualiser">
            <Clock className="w-4 h-4" />
          </button>
        </div>

        {/* Status Indicator */}
        {isTracking && (
          <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-3">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-green-700">Tracking actif</span>
            </div>
            <div className="text-xs text-gray-600 mt-1">
              Progression: {Math.round(routeProgress * 100)}%
            </div>
          </div>
        )}
      </div>

      {/* Delivery Info Panel */}
      {deliveryPartner && (
        <div className="mt-4 bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900">Informations du livreur</h4>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(deliveryPartner.status)}`}>
              {deliveryPartner.status === 'available' ? 'Disponible' : 
               deliveryPartner.status === 'busy' ? 'En cours' : 'Hors ligne'}
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4 text-gray-500" />
              <div>
                <div className="text-sm font-medium">{deliveryPartner.name}</div>
                <div className="text-xs text-gray-600">{deliveryPartner.phone}</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Truck className="w-4 h-4 text-gray-500" />
              <div>
                <div className="text-sm font-medium">Véhicule</div>
                <div className="text-xs text-gray-600 capitalize">{deliveryPartner.vehicleType}</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-gray-500" />
              <div>
                <div className="text-sm font-medium">Position actuelle</div>
                <div className="text-xs text-gray-600">
                  {currentDeliveryLocation?.lat.toFixed(4) || deliveryPartner.currentLocation.lat.toFixed(4)}, 
                  {currentDeliveryLocation?.lng.toFixed(4) || deliveryPartner.currentLocation.lng.toFixed(4)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
          <span>Point de ramassage</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-600 rounded-full"></div>
          <span>Point de livraison</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-orange-600 rounded-full"></div>
          <span>Livreur</span>
        </div>
      </div>
    </div>
  );
};

export default DeliveryTrackingMap;