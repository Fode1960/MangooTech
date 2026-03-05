export interface DeliveryLocation {
  lat: number;
  lng: number;
  address: string;
  district: string;
}

export interface DeliveryFeeConfig {
  baseFee: number;
  perKmFee: number;
  vehicleMultiplier: {
    moto: number;
    car: number;
    van: number;
    truck: number;
  };
  districtSurcharge: Record<string, number>;
  timeSurcharge: {
    normal: number;
    express: number;
    overnight: number;
  };
  minimumFee: number;
  maximumFee: number;
}

// Configuration des frais de livraison pour Abidjan
export const defaultDeliveryConfig: DeliveryFeeConfig = {
  baseFee: 2000, // FCFA
  perKmFee: 500, // FCFA par km
  vehicleMultiplier: {
    moto: 1.0,    // Moto: tarif de base
    car: 1.3,     // Voiture: +30%
    van: 1.6,     // Van: +60%
    truck: 2.0    // Camion: +100%
  },
  districtSurcharge: {
    'Cocody': 0,      // Pas de surcoût
    'Plateau': 0,     // Pas de surcoût
    'Marcory': 500,   // +500 FCFA
    'Treichville': 500, // +500 FCFA
    'Adjamé': 300,    // +300 FCFA
    'Yopougon': 800,  // +800 FCFA
    'Abobo': 800,     // +800 FCFA
    'Koumassi': 600,  // +600 FCFA
    'Port-Bouët': 1000 // +1000 FCFA
  },
  timeSurcharge: {
    normal: 1.0,    // Heures normales
    express: 1.5,   // Livraison express (moins de 2h)
    overnight: 2.0  // Livraison de nuit
  },
  minimumFee: 1500,  // Minimum 1500 FCFA
  maximumFee: 15000  // Maximum 15000 FCFA
};

// Points de référence pour les distances (coordonnées approximatives)
const referencePoints = {
  cocody: { lat: 5.3600, lng: -4.0083, name: 'Cocody' },
  plateau: { lat: 5.3200, lng: -4.0300, name: 'Plateau' },
  marcory: { lat: 5.2900, lng: -4.0100, name: 'Marcory' },
  treichville: { lat: 5.2800, lng: -4.0200, name: 'Treichville' }
};

/**
 * Calcule la distance entre deux points GPS en utilisant la formule de Haversine
 */
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Rayon de la Terre en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Détermine le district à partir des coordonnées GPS
 */
function getDistrictFromCoordinates(lat: number, lng: number): string {
  // Cette fonction utilise des approximations basées sur les coordonnées
  // Dans une application réelle, cela nécessiterait une API de géocodage
  
  if (lat > 5.34 && lng < -4.02) return 'Cocody';
  if (lat < 5.31 && lng < -4.025) return 'Plateau';
  if (lat < 5.30 && lng > -4.015) return 'Marcory';
  if (lat < 5.29 && lng > -4.02) return 'Treichville';
  if (lat > 5.33 && lng > -4.015) return 'Adjamé';
  if (lat < 5.28 && lng > -4.05) return 'Yopougon';
  if (lat > 5.35 && lng > -4.00) return 'Abobo';
  if (lat < 5.27 && lng < -4.01) return 'Koumassi';
  if (lat < 5.25 && lng < -4.02) return 'Port-Bouët';
  
  return 'Autre'; // District par défaut
}

/**
 * Calcule les frais de livraison automatiquement
 */
export function calculateDeliveryFee(
  pickupLocation: DeliveryLocation,
  deliveryLocation: DeliveryLocation,
  vehicleType: 'moto' | 'car' | 'van' | 'truck' = 'moto',
  deliveryType: 'normal' | 'express' | 'overnight' = 'normal',
  config: DeliveryFeeConfig = defaultDeliveryConfig
): {
  totalFee: number;
  breakdown: {
    baseFee: number;
    distanceFee: number;
    distance: number;
    vehicleSurcharge: number;
    districtSurcharge: number;
    timeSurcharge: number;
  };
  details: string;
} {
  // Calcul de la distance
  const distance = calculateDistance(
    pickupLocation.lat,
    pickupLocation.lng,
    deliveryLocation.lat,
    deliveryLocation.lng
  );

  // Frais de base
  const baseFee = config.baseFee;

  // Frais basés sur la distance
  const distanceFee = distance * config.perKmFee;

  // Majoration pour le type de véhicule
  const vehicleMultiplier = config.vehicleMultiplier[vehicleType];
  const vehicleSurcharge = (baseFee + distanceFee) * (vehicleMultiplier - 1);

  // Majoration pour le district
  const deliveryDistrict = deliveryLocation.district;
  const districtSurcharge = config.districtSurcharge[deliveryDistrict] || 0;

  // Majoration pour le type de livraison (temps)
  const timeMultiplier = config.timeSurcharge[deliveryType];
  const subtotal = baseFee + distanceFee + vehicleSurcharge + districtSurcharge;
  const timeSurcharge = subtotal * (timeMultiplier - 1);

  // Total
  let totalFee = subtotal + timeSurcharge;

  // Application des minimums et maximums
  totalFee = Math.max(config.minimumFee, Math.min(config.maximumFee, totalFee));

  // Génération du détail
  const breakdown = {
    baseFee,
    distanceFee,
    distance: Math.round(distance * 10) / 10, // Arrondi à 0.1 km près
    vehicleSurcharge: Math.round(vehicleSurcharge),
    districtSurcharge,
    timeSurcharge: Math.round(timeSurcharge)
  };

  const details = `
    Distance: ${breakdown.distance} km
    Véhicule: ${vehicleType} (${Math.round((vehicleMultiplier - 1) * 100)}% majoration)
    District: ${deliveryDistrict} (${districtSurcharge > 0 ? '+' + districtSurcharge + ' FCFA' : 'pas de surcoût'})
    Type de livraison: ${deliveryType === 'normal' ? 'Normale' : deliveryType === 'express' ? 'Express' : 'De nuit'} (${Math.round((timeMultiplier - 1) * 100)}% majoration)
  `.trim();

  return {
    totalFee: Math.round(totalFee),
    breakdown,
    details
  };
}

/**
 * Estime le temps de livraison basé sur la distance et le type de véhicule
 */
export function estimateDeliveryTime(
  distance: number,
  vehicleType: 'moto' | 'car' | 'van' | 'truck' = 'moto',
  deliveryType: 'normal' | 'express' | 'overnight' = 'normal'
): number {
  // Vitesse moyenne en km/h par type de véhicule (compte tenu du trafic urbain)
  const averageSpeeds = {
    moto: 25,   // Moto peut se faufiler dans le trafic
    car: 20,    // Voiture dans le trafic urbain
    van: 18,    // Van plus lent
    truck: 15   // Camion le plus lent
  };

  const speed = averageSpeeds[vehicleType];
  let timeInHours = distance / speed;

  // Majoration pour le type de livraison
  if (deliveryType === 'express') {
    timeInHours *= 0.5; // 50% plus rapide
  } else if (deliveryType === 'overnight') {
    timeInHours *= 1.2; // 20% plus lent (conditions de nuit)
  }

  // Temps additionnel pour la préparation et les arrêts
  const additionalTime = 0.25; // 15 minutes

  return Math.round((timeInHours + additionalTime) * 60); // Retour en minutes
}

/**
 * Calcule la distance entre deux adresses (nécessiterait une API en production)
 */
export function calculateDeliveryFeeFromAddresses(
  pickupAddress: string,
  deliveryAddress: string,
  vehicleType: 'moto' | 'car' | 'van' | 'truck' = 'moto',
  deliveryType: 'normal' | 'express' | 'overnight' = 'normal'
): {
  totalFee: number;
  estimatedTime: number;
  breakdown: any;
  details: string;
} {
  // En production, ceci utiliserait une API de géocodage pour convertir les adresses en coordonnées
  // Pour la démo, nous utilisons des coordonnées par défaut
  
  const pickupLocation: DeliveryLocation = {
    lat: 5.3600,
    lng: -4.0083,
    address: pickupAddress,
    district: 'Cocody'
  };

  // Extraction approximative du district de l'adresse de livraison
  const deliveryDistrict = deliveryAddress.toLowerCase().includes('cocody') ? 'Cocody' :
                          deliveryAddress.toLowerCase().includes('plateau') ? 'Plateau' :
                          deliveryAddress.toLowerCase().includes('marcory') ? 'Marcory' :
                          deliveryAddress.toLowerCase().includes('treichville') ? 'Treichville' :
                          deliveryAddress.toLowerCase().includes('adjamé') ? 'Adjamé' :
                          deliveryAddress.toLowerCase().includes('yopougon') ? 'Yopougon' :
                          deliveryAddress.toLowerCase().includes('abobo') ? 'Abobo' :
                          deliveryAddress.toLowerCase().includes('koumassi') ? 'Koumassi' :
                          deliveryAddress.toLowerCase().includes('port-bouët') ? 'Port-Bouët' : 'Autre';

  const deliveryLocation: DeliveryLocation = {
    lat: 5.3200, // Coordonnées par défaut
    lng: -4.0300,
    address: deliveryAddress,
    district: deliveryDistrict
  };

  const feeResult = calculateDeliveryFee(pickupLocation, deliveryLocation, vehicleType, deliveryType);
  const estimatedTime = estimateDeliveryTime(feeResult.breakdown.distance, vehicleType, deliveryType);

  return {
    ...feeResult,
    estimatedTime
  };
}