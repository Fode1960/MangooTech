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

const isAbortError = (error: any) => {
  const name = String(error?.name || '')
  const msg = String(error?.message || error || '')
  return name === 'AbortError' || msg.includes('signal is aborted') || msg.includes('aborted')
}

const supabaseFetch: typeof fetch = async (input: any, init?: any) => {
  const controller = new AbortController()
  const timeoutMs = 25000
  const t = window.setTimeout(() => controller.abort(), timeoutMs)
  try {
    const { signal: _ignoredSignal, ...rest } = init || {}
    try {
      return await fetch(input, { ...rest, signal: controller.signal })
    } catch (e: any) {
      if (isAbortError(e)) {
        return await fetch(input, { ...rest, signal: controller.signal })
      }
      throw e
    }
  } finally {
    window.clearTimeout(t)
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    fetch: typeof window !== 'undefined' ? supabaseFetch : undefined
  }
})
