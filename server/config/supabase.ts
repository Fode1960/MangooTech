import { createClient, SupabaseClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL || ''
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

function createSupabaseClient(url: string, key: string): SupabaseClient | null {
  if (!url) {
    console.warn('[supabase] SUPABASE_URL non défini – client Supabase désactivé')
    return null
  }
  return createClient(url, key)
}

export const supabase = createSupabaseClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey)
export const supabaseAdmin = createSupabaseClient(supabaseUrl, supabaseServiceKey);