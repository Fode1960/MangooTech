import { createClient } from '@supabase/supabase-js'

type SupabaseConfigSource = 'env' | 'localStorage' | 'missing'

const envUrl = String(import.meta.env.VITE_SUPABASE_URL || '').trim()
const envAnon = String(import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim()

let supabaseUrl = envUrl
let supabaseAnonKey = envAnon
let supabaseConfigSource: SupabaseConfigSource = envUrl && envAnon ? 'env' : 'missing'

if ((!supabaseUrl || !supabaseAnonKey) && typeof window !== 'undefined') {
  try {
    const storedUrl = String(window.localStorage.getItem('mangoo_supabase_url') || '').trim()
    const storedAnon = String(window.localStorage.getItem('mangoo_supabase_anon_key') || '').trim()
    if (storedUrl && storedAnon) {
      supabaseUrl = storedUrl
      supabaseAnonKey = storedAnon
      supabaseConfigSource = 'localStorage'
    }
  } catch {
  }
}

export const supabaseConfig = {
  source: supabaseConfigSource,
  hasUrl: Boolean(supabaseUrl),
  hasAnonKey: Boolean(supabaseAnonKey),
} as const

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
