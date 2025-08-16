// Types pour le système de gestion des services et packs

export interface Service {
  id: string;
  name: string;
  description?: string;
  service_type: 'website' | 'ecommerce' | 'marketplace' | 'showroom' | 'crm' | 'profile' | 'networking' | 'delivery' | 'seo' | 'support';
  base_url?: string;
  icon?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Pack {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  billing_period: 'monthly' | 'yearly' | 'one-time';
  is_popular: boolean;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  services?: Service[];
}

export interface PackService {
  id: string;
  pack_id: string;
  service_id: string;
  is_included: boolean;
  created_at: string;
}

export interface UserPack {
  id: string;
  user_id: string;
  pack_id: string;
  status: 'active' | 'suspended' | 'cancelled';
  started_at: string;
  expires_at?: string;
  next_billing_date?: string;
  created_at: string;
  updated_at: string;
  pack?: Pack;
}

export interface UserService {
  id: string;
  user_id: string;
  service_id: string;
  pack_id: string;
  status: 'active' | 'inactive' | 'setup_required';
  service_url?: string;
  visits_count: number;
  sales_count: number;
  revenue_amount: number;
  last_activity_at?: string;
  created_at: string;
  updated_at: string;
  service?: Service;
  isAvailableInPack?: boolean;
}

// Types pour les réponses des fonctions de base de données
export interface UserServiceResponse {
  service_id: string;
  service_name: string;
  service_type: string;
  service_icon?: string;
  status: string;
  service_url?: string;
  visits_count: number;
  sales_count: number;
  revenue_amount: number;
}

export interface PackServiceResponse {
  service_id: string;
  service_name: string;
  service_type: string;
  service_icon?: string;
  service_description?: string;
}

// Types pour les formulaires admin
export interface CreateServiceRequest {
  name: string;
  description?: string;
  service_type: Service['service_type'];
  base_url?: string;
  icon?: string;
}

export interface UpdateServiceRequest extends Partial<CreateServiceRequest> {
  id: string;
  is_active?: boolean;
}

export interface CreatePackRequest {
  name: string;
  description?: string;
  price: number;
  currency?: string;
  billing_period?: Pack['billing_period'];
  is_popular?: boolean;
  sort_order?: number;
  service_ids: string[];
}

export interface UpdatePackRequest extends Partial<CreatePackRequest> {
  id: string;
  is_active?: boolean;
}

export interface AssignPackToUserRequest {
  user_id: string;
  pack_id: string;
  status?: 'active' | 'suspended' | 'cancelled';
  expires_at?: string;
  next_billing_date?: string;
}

// Types pour les statistiques
export interface ServiceStats {
  total_visits: number;
  total_sales: number;
  total_revenue: number;
  active_services: number;
  most_used_service: string;
}

export interface PackStats {
  total_users: number;
  active_subscriptions: number;
  monthly_revenue: number;
  most_popular_pack: string;
}

// Types pour les hooks et contextes
export interface ServicesContextType {
  services: Service[];
  packs: Pack[];
  userServices: UserService[];
  allServicesWithStatus: UserService[];
  userPack: UserPack | null;
  loading: boolean;
  error: string | null;
  refreshUserServices: () => Promise<void>;
  updateServiceStats: (serviceId: string, stats: Partial<UserService>) => Promise<void>;
}

// Types pour les composants
export interface ServiceCardProps {
  service: UserService;
  onUpdateStats?: (serviceId: string, stats: Partial<UserService>) => void;
}

export interface PackCardProps {
  pack: Pack;
  isSelected?: boolean;
  onSelect?: (packId: string) => void;
  showServices?: boolean;
}

export interface AdminPackFormProps {
  pack?: Pack;
  onSubmit: (data: CreatePackRequest | UpdatePackRequest) => Promise<void>;
  onCancel: () => void;
}

export interface AdminServiceFormProps {
  service?: Service;
  onSubmit: (data: CreateServiceRequest | UpdateServiceRequest) => Promise<void>;
  onCancel: () => void;
}