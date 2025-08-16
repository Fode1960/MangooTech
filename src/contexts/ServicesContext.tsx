// Contexte pour la gestion des services et packs

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import {
  getAllServices,
  getAllPacks,
  getUserServices,
  getUserPack,
  updateUserServiceStats
} from '../lib/services';
import type {
  Service,
  Pack,
  UserService,
  UserPack,
  UserServiceResponse,
  ServicesContextType
} from '../types/services';

const ServicesContext = createContext<ServicesContextType | undefined>(undefined);

interface ServicesProviderProps {
  children: ReactNode;
}

export function ServicesProvider({ children }: ServicesProviderProps) {
  const { user } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [packs, setPacks] = useState<Pack[]>([]);
  const [userServices, setUserServices] = useState<UserService[]>([]);
  const [allServicesWithStatus, setAllServicesWithStatus] = useState<UserService[]>([]);
  const [userPack, setUserPack] = useState<UserPack | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fonction pour créer la liste de tous les services avec leur statut
  const createAllServicesWithStatus = async (userPackData: UserPack | null, userServicesData: UserServiceResponse[]) => {
    if (!user?.id) return [];

    // Récupérer tous les services disponibles
    const allServices = await getAllServices();
    
    // Récupérer les services du pack actuel de l'utilisateur
    const userPackServices = userPackData ? 
      packs.find(pack => pack.id === userPackData.pack_id)?.services || [] : [];
    
    // Créer un map des services utilisateur pour un accès rapide
    const userServiceMap = new Map(
      userServicesData.map(service => [service.service_id, service])
    );
    
    // Créer la liste complète avec statuts
    return allServices.map(service => {
      const userService = userServiceMap.get(service.id);
      const isInUserPack = userPackServices.some(packService => packService.id === service.id);
      
      return {
        id: `${user.id}-${service.id}`,
        user_id: user.id,
        service_id: service.id,
        pack_id: userPackData?.pack_id || '',
        status: isInUserPack ? 
          (userService?.status as 'active' | 'inactive' | 'setup_required' || 'active') : 
          'inactive' as const,
        service_url: userService?.service_url || null,
        visits_count: userService?.visits_count || 0,
        sales_count: userService?.sales_count || 0,
        revenue_amount: userService?.revenue_amount || 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        service: {
          id: service.id,
          name: service.name,
          service_type: service.service_type,
          icon: service.icon,
          is_active: service.is_active,
          created_at: service.created_at,
          updated_at: service.updated_at
        },
        isAvailableInPack: isInUserPack
      };
    });
  };

  // Charger les services et packs disponibles
  const loadServicesAndPacks = async () => {
    try {
      const [servicesData, packsData] = await Promise.all([
        getAllServices(),
        getAllPacks()
      ]);
      
      setServices(servicesData);
      setPacks(packsData);
    } catch (err) {
      console.error('Erreur lors du chargement des services et packs:', err);
      setError('Impossible de charger les services et packs');
    }
  };

  // Charger les données utilisateur
  const loadUserData = async () => {
    if (!user?.id) {
      setUserServices([]);
      setUserPack(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [userServicesData, userPackData] = await Promise.all([
        getUserServices(user.id),
        getUserPack(user.id)
      ]);

      // Debug: Log des données récupérées
      console.log('Debug - User ID:', user.id);
      console.log('Debug - User Pack Data:', userPackData);
      console.log('Debug - User Services Data:', userServicesData);

      // Transformer les données des services utilisateur
      const transformedUserServices: UserService[] = userServicesData.map(service => ({
        id: `${user.id}-${service.service_id}`,
        user_id: user.id,
        service_id: service.service_id,
        pack_id: userPackData?.pack_id || '',
        status: service.status as 'active' | 'inactive' | 'setup_required',
        service_url: service.service_url,
        visits_count: service.visits_count,
        sales_count: service.sales_count,
        revenue_amount: service.revenue_amount,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        service: {
          id: service.service_id,
          name: service.service_name,
          service_type: service.service_type as any,
          icon: service.service_icon,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      }));

      // Créer une liste de tous les services avec leur statut
      const allServicesWithStatusData = await createAllServicesWithStatus(userPackData, userServicesData);
      
      setUserServices(transformedUserServices);
      setAllServicesWithStatus(allServicesWithStatusData);
      setUserPack(userPackData);
    } catch (err) {
      console.error('Erreur lors du chargement des données utilisateur:', err);
      setError('Impossible de charger vos services');
    } finally {
      setLoading(false);
    }
  };

  // Rafraîchir les services utilisateur
  const refreshUserServices = async () => {
    await loadUserData();
  };

  // Mettre à jour les statistiques d'un service
  const updateServiceStats = async (
    serviceId: string,
    stats: Partial<UserService>
  ) => {
    if (!user?.id) return;

    try {
      await updateUserServiceStats(user.id, serviceId, {
        visits_count: stats.visits_count,
        sales_count: stats.sales_count,
        revenue_amount: stats.revenue_amount
      });

      // Mettre à jour l'état local
      setUserServices(prev => 
        prev.map(service => 
          service.service_id === serviceId
            ? { ...service, ...stats, updated_at: new Date().toISOString() }
            : service
        )
      );
    } catch (err) {
      console.error('Erreur lors de la mise à jour des statistiques:', err);
      throw err;
    }
  };

  // Charger les données au montage du composant
  useEffect(() => {
    loadServicesAndPacks();
  }, []);

  // Charger les données utilisateur quand l'utilisateur change
  useEffect(() => {
    loadUserData();
  }, [user?.id]);

  const value: ServicesContextType = {
    services,
    packs,
    userServices,
    allServicesWithStatus,
    userPack,
    loading,
    error,
    refreshUserServices,
    updateServiceStats
  };

  return (
    <ServicesContext.Provider value={value}>
      {children}
    </ServicesContext.Provider>
  );
}

export function useServices() {
  const context = useContext(ServicesContext);
  if (context === undefined) {
    throw new Error('useServices must be used within a ServicesProvider');
  }
  return context;
}

// Hook pour obtenir les services d'un pack spécifique
export function usePackServices(packId?: string) {
  const { packs } = useServices();
  
  if (!packId) return [];
  
  const pack = packs.find(p => p.id === packId);
  return pack?.services || [];
}

// Hook pour vérifier si un utilisateur a accès à un service
export function useHasService(serviceName: string) {
  const { userServices } = useServices();
  
  return userServices.some(
    service => 
      service.service?.name === serviceName && 
      service.status === 'active'
  );
}

// Hook pour obtenir les statistiques globales des services
export function useServiceStats() {
  const { userServices } = useServices();
  
  const stats = userServices.reduce(
    (acc, service) => ({
      totalVisits: acc.totalVisits + service.visits_count,
      totalSales: acc.totalSales + service.sales_count,
      totalRevenue: acc.totalRevenue + service.revenue_amount,
      activeServices: acc.activeServices + (service.status === 'active' ? 1 : 0)
    }),
    { totalVisits: 0, totalSales: 0, totalRevenue: 0, activeServices: 0 }
  );
  
  return stats;
}