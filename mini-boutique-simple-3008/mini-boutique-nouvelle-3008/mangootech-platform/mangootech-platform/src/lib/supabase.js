import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Helpers pour les opérations multi-tenant
export const tenantAwareQuery = (query, tenantId) => {
  return query.eq('tenant_id', tenantId)
}

export const getTenantData = async (table, tenantId) => {
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq('tenant_id', tenantId)
  
  return { data, error }
}

export const createTenantData = async (table, data, tenantId) => {
  const { data: result, error } = await supabase
    .from(table)
    .insert([{ ...data, tenant_id: tenantId }])
    .select()
  
  return { data: result, error }
}