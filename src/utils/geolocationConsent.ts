// Utility functions for managing geolocation consent

export interface GeolocationConsentData {
  userId: string;
  consentGiven: boolean;
  locationData?: {
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp: string;
  } | null;
  consentTimestamp: string;
}

const STORAGE_KEY = 'user_geolocation_consent';

/**
 * Store geolocation consent data
 */
export const storeGeolocationConsent = (data: GeolocationConsentData): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error storing geolocation consent:', error);
  }
};

/**
 * Get geolocation consent data
 */
export const getGeolocationConsent = (): GeolocationConsentData | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Error getting geolocation consent:', error);
    return null;
  }
};

/**
 * Check if user has given geolocation consent
 */
export const hasGeolocationConsent = (): boolean => {
  const consent = getGeolocationConsent();
  return consent?.consentGiven === true;
};

/**
 * Get current geolocation with user consent
 */
export const getCurrentLocation = (): Promise<GeolocationPosition | null> => {
  return new Promise((resolve) => {
    if (!hasGeolocationConsent()) {
      resolve(null);
      return;
    }

    if (!navigator.geolocation) {
      console.warn('Geolocation is not supported by this browser');
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve(position);
      },
      (error) => {
        console.warn('Error getting geolocation:', error);
        resolve(null);
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  });
};

/**
 * Update geolocation data for a user who has already consented
 */
export const updateUserLocation = async (userId: string): Promise<void> => {
  if (!hasGeolocationConsent()) {
    return;
  }

  const position = await getCurrentLocation();
  if (!position) {
    return;
  }

  const consentData: GeolocationConsentData = {
    userId,
    consentGiven: true,
    locationData: {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      timestamp: new Date().toISOString()
    },
    consentTimestamp: new Date().toISOString()
  };

  storeGeolocationConsent(consentData);
};

/**
 * Revoke geolocation consent
 */
export const revokeGeolocationConsent = (userId: string): void => {
  const consentData: GeolocationConsentData = {
    userId,
    consentGiven: false,
    locationData: null,
    consentTimestamp: new Date().toISOString()
  };

  storeGeolocationConsent(consentData);
};