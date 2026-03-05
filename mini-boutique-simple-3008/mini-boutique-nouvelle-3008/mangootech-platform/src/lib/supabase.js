import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_KEY || 'your-service-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

// Fonctions utilitaires pour la gestion multi-tenant
export const getCurrentTenant = () => {
  // Récupérer le tenant actuel depuis l'URL ou le store
  const urlParams = new URLSearchParams(window.location.search)
  return urlParams.get('shop') || 'default'
}

// Helper pour les requêtes avec filtrage par tenant
export const tenantAwareQuery = (query, tenantId) => {
  return query.eq('tenant_id', tenantId)
}