/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';

const ServicesContext = createContext();

export const useServices = () => {
  const context = useContext(ServicesContext);
  if (!context) {
    throw new Error('useServices doit être utilisé dans un ServicesProvider');
  }
  return context;
};

export const ServicesProvider = ({ children }) => {
  const [services, setServices] = useState({
    isOnline: navigator.onLine,
    apiStatus: 'operational',
    lastCheck: new Date()
  });

  useEffect(() => {
    const handleOnline = () => {
      setServices(prev => ({ ...prev, isOnline: true }));
    };

    const handleOffline = () => {
      setServices(prev => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const checkApiStatus = async () => {
    try {
      // Simulation de vérification d'API
      setServices(prev => ({ 
        ...prev, 
        apiStatus: 'operational',
        lastCheck: new Date()
      }));
      return 'operational';
    } catch (error) {
      setServices(prev => ({ 
        ...prev, 
        apiStatus: 'error',
        lastCheck: new Date()
      }));
      return 'error';
    }
  };

  const value = {
    services,
    checkApiStatus
  };

  return (
    <ServicesContext.Provider value={value}>
      {children}
    </ServicesContext.Provider>
  );
};
