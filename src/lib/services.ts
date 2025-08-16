// Fonctions utilitaires pour la gestion des services et packs

import { supabase } from './supabase';
import type {
  Service,
  Pack,
  UserService,
  UserPack,
  UserServiceResponse,
  PackServiceResponse,
  CreateServiceRequest,
  UpdateServiceRequest,
  CreatePackRequest,
  UpdatePackRequest,
  AssignPackToUserRequest
} from '../types/services';

// ===== SERVICES =====

/**
 * Récupère tous les services disponibles
 */
export async function getAllServices(): Promise<Service[]> {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('is_active', true)
    .order('name');

  if (error) {
    console.error('Erreur lors de la récupération des services:', error);
    throw error;
  }

  return data || [];
}

/**
 * Crée un nouveau service (admin uniquement)
 */
export async function createService(serviceData: CreateServiceRequest): Promise<Service> {
  const { data, error } = await supabase
    .from('services')
    .insert([serviceData])
    .select()
    .single();

  if (error) {
    console.error('Erreur lors de la création du service:', error);
    throw error;
  }

  return data;
}

/**
 * Met à jour un service (admin uniquement)
 */
export async function updateService(serviceData: UpdateServiceRequest): Promise<Service> {
  const { id, ...updateData } = serviceData;
  
  const { data, error } = await supabase
    .from('services')
    .update({ ...updateData, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Erreur lors de la mise à jour du service:', error);
    throw error;
  }

  return data;
}

/**
 * Supprime un service (admin uniquement)
 */
export async function deleteService(serviceId: string): Promise<void> {
  const { error } = await supabase
    .from('services')
    .delete()
    .eq('id', serviceId);

  if (error) {
    console.error('Erreur lors de la suppression du service:', error);
    throw error;
  }
}

// ===== PACKS =====

/**
 * Récupère tous les packs disponibles avec leurs services
 */
export async function getAllPacks(): Promise<Pack[]> {
  const { data, error } = await supabase
    .from('packs')
    .select(`
      *,
      pack_services!inner(
        service_id,
        is_included,
        services(
          id,
          name,
          description,
          service_type,
          icon,
          is_active
        )
      )
    `)
    .eq('is_active', true)
    .eq('pack_services.is_included', true)
    .eq('pack_services.services.is_active', true)
    .order('sort_order');

  if (error) {
    console.error('Erreur lors de la récupération des packs:', error);
    throw error;
  }

  // Transformer les données pour inclure les services dans chaque pack
  const packs = data?.map(pack => ({
    ...pack,
    services: pack.pack_services?.map(ps => ps.services).filter(Boolean) || []
  })) || [];

  return packs;
}

/**
 * Récupère un pack spécifique avec ses services
 */
export async function getPackById(packId: string): Promise<Pack | null> {
  const { data, error } = await supabase
    .from('packs')
    .select(`
      *,
      pack_services!inner(
        service_id,
        is_included,
        services(
          id,
          name,
          description,
          service_type,
          icon,
          is_active
        )
      )
    `)
    .eq('id', packId)
    .eq('pack_services.is_included', true)
    .eq('pack_services.services.is_active', true)
    .single();

  if (error) {
    console.error('Erreur lors de la récupération du pack:', error);
    return null;
  }

  if (!data) return null;

  return {
    ...data,
    services: data.pack_services?.map(ps => ps.services).filter(Boolean) || []
  };
}

/**
 * Crée un nouveau pack (admin uniquement)
 */
export async function createPack(packData: CreatePackRequest): Promise<Pack> {
  const { service_ids, ...packInfo } = packData;
  
  // Créer le pack
  const { data: pack, error: packError } = await supabase
    .from('packs')
    .insert([packInfo])
    .select()
    .single();

  if (packError) {
    console.error('Erreur lors de la création du pack:', packError);
    throw packError;
  }

  // Associer les services au pack
  if (service_ids.length > 0) {
    const packServices = service_ids.map(serviceId => ({
      pack_id: pack.id,
      service_id: serviceId,
      is_included: true
    }));

    const { error: servicesError } = await supabase
      .from('pack_services')
      .insert(packServices);

    if (servicesError) {
      console.error('Erreur lors de l\'association des services:', servicesError);
      throw servicesError;
    }
  }

  return pack;
}

/**
 * Met à jour un pack (admin uniquement)
 */
export async function updatePack(packData: UpdatePackRequest): Promise<Pack> {
  const { id, service_ids, ...updateData } = packData;
  
  // Mettre à jour le pack
  const { data: pack, error: packError } = await supabase
    .from('packs')
    .update({ ...updateData, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (packError) {
    console.error('Erreur lors de la mise à jour du pack:', packError);
    throw packError;
  }

  // Mettre à jour les services associés si fournis
  if (service_ids) {
    // Supprimer les anciennes associations
    await supabase
      .from('pack_services')
      .delete()
      .eq('pack_id', id);

    // Créer les nouvelles associations
    if (service_ids.length > 0) {
      const packServices = service_ids.map(serviceId => ({
        pack_id: id,
        service_id: serviceId,
        is_included: true
      }));

      const { error: servicesError } = await supabase
        .from('pack_services')
        .insert(packServices);

      if (servicesError) {
        console.error('Erreur lors de la mise à jour des services:', servicesError);
        throw servicesError;
      }
    }
  }

  return pack;
}

/**
 * Supprime un pack (admin uniquement)
 */
export async function deletePack(packId: string): Promise<void> {
  const { error } = await supabase
    .from('packs')
    .delete()
    .eq('id', packId);

  if (error) {
    console.error('Erreur lors de la suppression du pack:', error);
    throw error;
  }
}

// ===== GESTION UTILISATEUR =====

/**
 * Récupère le pack actuel d'un utilisateur
 */
export async function getUserPack(userId: string): Promise<UserPack | null> {
  const { data, error } = await supabase
    .from('user_packs')
    .select(`
      *,
      packs(
        id,
        name,
        description,
        price,
        currency,
        billing_period
      )
    `)
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Aucun pack trouvé
      return null;
    }
    console.error('Erreur lors de la récupération du pack utilisateur:', error);
    throw error;
  }

  return data;
}

/**
 * Récupère les services actifs d'un utilisateur
 */
export async function getUserServices(userId: string): Promise<UserServiceResponse[]> {
  const { data, error } = await supabase
    .rpc('get_user_services', { user_uuid: userId });

  if (error) {
    console.error('Erreur lors de la récupération des services utilisateur:', error);
    throw error;
  }

  return data || [];
}

/**
 * Assigne un pack à un utilisateur
 */
export async function assignPackToUser(assignmentData: AssignPackToUserRequest): Promise<UserPack> {
  // Désactiver l'ancien pack s'il existe
  await supabase
    .from('user_packs')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('user_id', assignmentData.user_id)
    .eq('status', 'active');

  // Créer le nouveau pack
  const { data: userPack, error: packError } = await supabase
    .from('user_packs')
    .insert([assignmentData])
    .select()
    .single();

  if (packError) {
    console.error('Erreur lors de l\'assignation du pack:', packError);
    throw packError;
  }

  // Récupérer les services du pack et les créer pour l'utilisateur
  const { data: packServices, error: servicesError } = await supabase
    .rpc('get_pack_services', { pack_uuid: assignmentData.pack_id });

  if (servicesError) {
    console.error('Erreur lors de la récupération des services du pack:', servicesError);
    throw servicesError;
  }

  if (packServices && packServices.length > 0) {
    const userServices = packServices.map(service => ({
      user_id: assignmentData.user_id,
      service_id: service.service_id,
      pack_id: assignmentData.pack_id,
      status: 'active',
      service_url: `https://${service.service_name.toLowerCase().replace(/\s+/g, '-')}.mangootech.com/${assignmentData.user_id}`
    }));

    const { error: userServicesError } = await supabase
      .from('user_services')
      .upsert(userServices, { onConflict: 'user_id,service_id' });

    if (userServicesError) {
      console.error('Erreur lors de la création des services utilisateur:', userServicesError);
      throw userServicesError;
    }
  }

  return userPack;
}

/**
 * Met à jour les statistiques d'un service utilisateur
 */
export async function updateUserServiceStats(
  userId: string,
  serviceId: string,
  stats: Partial<Pick<UserService, 'visits_count' | 'sales_count' | 'revenue_amount'>>
): Promise<void> {
  const { error } = await supabase
    .from('user_services')
    .update({
      ...stats,
      last_activity_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId)
    .eq('service_id', serviceId);

  if (error) {
    console.error('Erreur lors de la mise à jour des statistiques:', error);
    throw error;
  }
}

/**
 * Récupère les services d'un pack spécifique
 */
export async function getPackServices(packId: string): Promise<PackServiceResponse[]> {
  const { data, error } = await supabase
    .rpc('get_pack_services', { pack_uuid: packId });

  if (error) {
    console.error('Erreur lors de la récupération des services du pack:', error);
    throw error;
  }

  return data || [];
}

/**
 * Migre un utilisateur vers un nouveau pack
 */
export async function migrateUserPack(userId: string, newPackId: string): Promise<UserPack> {
  try {
    // 1. Récupérer le pack actuel de l'utilisateur
    const currentUserPack = await getUserPack(userId);
    
    // 2. Désactiver le pack actuel s'il existe
    if (currentUserPack) {
      const { error: deactivateError } = await supabase
        .from('user_packs')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('status', 'active');

      if (deactivateError) {
        console.error('Erreur lors de la désactivation du pack actuel:', deactivateError);
        throw deactivateError;
      }
    }

    // 3. Assigner le nouveau pack
    const newUserPack = await assignPackToUser({
      user_id: userId,
      pack_id: newPackId,
      status: 'active'
    });

    return newUserPack;
  } catch (error) {
    console.error('Erreur lors de la migration du pack:', error);
    throw error;
  }
}

/**
 * Met à jour le statut d'un service utilisateur
 */
export async function updateUserServiceStatus(
  userId: string,
  serviceId: string,
  status: 'active' | 'inactive' | 'suspended'
): Promise<void> {
  try {
    const { error } = await supabase
      .from('user_services')
      .update({ status })
      .eq('user_id', userId)
      .eq('service_id', serviceId);

    if (error) {
      console.error('Erreur lors de la mise à jour du statut du service:', error);
      throw error;
    }
  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut du service:', error);
    throw error;
  }
}