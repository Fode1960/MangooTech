import { createClient } from '@supabase/supabase-js'
import { connectPlusStore, type ConnectPlusEntry } from './connectPlusStore'

const supabaseUrl = String(process.env.SUPABASE_URL || '').trim()
const supabaseServiceKey = String(process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim()
const supabase = supabaseUrl && supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null

const safeString = (v: any) => String(v || '').trim()
const safeLower = (v: any) => safeString(v).toLowerCase()
const isProd = safeLower(process.env.NODE_ENV) === 'production'

const normalizeSlug = (v: any) => safeLower(v)
const safeCode = (v: any) => safeString(v)

type _Issued = {
  storage: 'supabase' | 'local'
  shopSlug: string
  pin: string
  token: string
  url: string
}

const isMissingTable = (msg: string) => {
  const m = safeLower(msg)
  if (!m.includes('connect_plus_entries')) return false
  return m.includes('does not exist') || m.includes('relation') || m.includes('schema cache')
}

const isUniqueViolation = (err: any) => {
  const code = safeCode(err?.code)
  if (code === '23505') return true
  const msg = safeLower(err?.message || '')
  const details = safeLower(err?.details || '')
  if (msg.includes('duplicate key')) return true
  if (msg.includes('unique constraint')) return true
  if (details.includes('duplicate key')) return true
  if (details.includes('unique constraint')) return true
  return false
}

const buildUrl = (origin: string, token: string) => {
  const o = safeString(origin)
  const path = `/connect-plus/go/${encodeURIComponent(token)}`
  return o ? `${o}${path}` : path
}

const withTimeout = async <T>(p: PromiseLike<T>, timeoutMs: number): Promise<T> => {
  const ms = Math.max(0, Math.floor(Number(timeoutMs || 0)))
  if (!ms) return await p
  return await Promise.race([
    p,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error('timeout')), ms)
    }),
  ])
}

async function tryGetCurrentFromSupabase(shopSlug: string) {
  if (!supabase) return null
  const slug = normalizeSlug(shopSlug)
  if (!slug) return null
  const r: any = await withTimeout(
    supabase
      .from('connect_plus_entries')
      .select('id,shop_slug,pin,token,is_active,created_at,expires_at')
      .eq('shop_slug', slug)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    1500,
  )
  if (r?.error) {
    if (isMissingTable(String(r.error.message || ''))) return null
    if (isProd) throw new Error(String(r.error.message || 'Erreur Supabase'))
    return null
  }
  const row = r?.data || null
  if (!row?.token) return null
  if (row.expires_at) {
    const exp = Date.parse(String(row.expires_at))
    if (Number.isFinite(exp) && exp <= Date.now()) return null
  }
  return row
}

async function tryGetCurrentStableFromSupabase(shopSlug: string) {
  if (!supabase) return null
  const slug = normalizeSlug(shopSlug)
  if (!slug) return null
  const r: any = await withTimeout(
    supabase
      .from('connect_plus_entries')
      .select('id,shop_slug,pin,token,is_active,created_at,expires_at')
      .eq('shop_slug', slug)
      .eq('is_active', true)
      .is('expires_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    1500,
  )
  if (r?.error) {
    if (isMissingTable(String(r.error.message || ''))) return null
    if (isProd) throw new Error(String(r.error.message || 'Erreur Supabase'))
    return null
  }
  const row = r?.data || null
  if (!row?.token) return null
  return row
}

async function tryInsertIntoSupabase(entry: ConnectPlusEntry) {
  if (!supabase) return null
  const payload = {
    shop_slug: safeString(entry.shop_slug),
    pin: safeString(entry.pin),
    token: safeString(entry.token),
    is_active: true,
    expires_at: entry.expires_at,
  }
  const r: any = await withTimeout(
    supabase
      .from('connect_plus_entries')
      .insert(payload)
      .select('id,shop_slug,pin,token,created_at,expires_at,is_active')
      .single(),
    1500,
  )
  if (r?.error) {
    if (isMissingTable(String(r.error.message || ''))) return null
    if (isProd) throw new Error(String(r.error.message || 'Erreur Supabase'))
    return null
  }
  return r?.data || null
}

async function tryDeactivateOtherSupabaseEntries(shopSlug: string, keepId: string, mode: 'all' | 'temp') {
  if (!supabase) return
  const slug = normalizeSlug(shopSlug)
  const id = safeString(keepId)
  if (!slug || !id) return
  const q = supabase
    .from('connect_plus_entries')
    .update({ is_active: false })
    .eq('shop_slug', slug)
    .eq('is_active', true)
    .neq('id', id)
  const finalQuery = mode === 'temp' ? q.not('expires_at', 'is', null) : q
  const r: any = await withTimeout(
    finalQuery,
    1500,
  )
  if (r?.error) {
    if (isMissingTable(String(r.error.message || ''))) return
    throw new Error(String(r.error.message || 'Erreur Supabase'))
  }
}

export const connectPlusIssuer = {
  getCurrent: async (params: { shopSlug: string; origin?: string }) => {
    const shopSlug = normalizeSlug(params.shopSlug)
    if (!shopSlug) return null

    const origin = safeString(params.origin || '')

    const supa = await tryGetCurrentFromSupabase(shopSlug)
    if (supa?.token) {
      return {
        storage: 'supabase' as const,
        shopSlug: safeString(supa.shop_slug),
        pin: safeString(supa.pin),
        token: safeString(supa.token),
        url: buildUrl(origin, safeString(supa.token)),
      }
    }

    const local = connectPlusStore.findLatestActiveByShopSlug(shopSlug)
    if (!local?.token) return null
    return {
      storage: 'local' as const,
      shopSlug: safeString(local.shop_slug),
      pin: safeString(local.pin),
      token: safeString(local.token),
      url: buildUrl(origin, safeString(local.token)),
    }
  },

  getCurrentStable: async (params: { shopSlug: string; origin?: string }) => {
    const shopSlug = normalizeSlug(params.shopSlug)
    if (!shopSlug) return null
    const origin = safeString(params.origin || '')

    const supa = await tryGetCurrentStableFromSupabase(shopSlug)
    if (supa?.token) {
      return {
        storage: 'supabase' as const,
        shopSlug: safeString(supa.shop_slug),
        pin: safeString(supa.pin),
        token: safeString(supa.token),
        url: buildUrl(origin, safeString(supa.token)),
      }
    }

    const local = connectPlusStore.findLatestActiveStableByShopSlug(shopSlug)
    if (!local?.token) return null
    return {
      storage: 'local' as const,
      shopSlug: safeString(local.shop_slug),
      pin: safeString(local.pin),
      token: safeString(local.token),
      url: buildUrl(origin, safeString(local.token)),
    }
  },

  ensure: async (params: { shopSlug: string; origin?: string; pinLen?: number; expiresHours?: number | null }) => {
    const existing = await connectPlusIssuer.getCurrent({ shopSlug: params.shopSlug, origin: params.origin })
    if (existing) return existing
    return await connectPlusIssuer.issueNew(params)
  },

  ensureStable: async (params: { shopSlug: string; origin?: string; pinLen?: number }) => {
    const existing = await connectPlusIssuer.getCurrentStable({ shopSlug: params.shopSlug, origin: params.origin })
    if (existing) return existing
    return await connectPlusIssuer.issueNew({ ...params, expiresHours: null })
  },

  changeStable: async (params: { shopSlug: string; origin?: string; pinLen?: number }) => {
    return await connectPlusIssuer.issueNew({ ...params, expiresHours: null })
  },

  issueNew: async (params: { shopSlug: string; origin?: string; pinLen?: number; expiresHours?: number | null }) => {
    const shopSlug = normalizeSlug(params.shopSlug)
    if (!shopSlug) throw new Error('shopSlug manquant')

    const preferredPinLen = params.pinLen === undefined || params.pinLen === null
      ? 6
      : Math.max(4, Math.min(6, Math.floor(Number(params.pinLen))))
    const expiresHours = (() => {
      if (params.expiresHours === undefined) return 72
      if (params.expiresHours === null) return null
      const n = Number(params.expiresHours)
      if (!Number.isFinite(n)) return 72
      return Math.max(1, Math.floor(n))
    })()

    const origin = safeString(params.origin || '')

    let localOnly = false

    for (let pinLen = preferredPinLen; pinLen <= 6; pinLen += 1) {
      const attemptsForLen = pinLen === 4 ? 60 : pinLen === 5 ? 40 : 25

      for (let attempt = 0; attempt < attemptsForLen; attempt += 1) {
        const candidate = connectPlusStore.generateEntry({ shopSlug, pinLen, expiresHours })
        if (String(candidate?.pin || '') === '000000') continue

        if (!localOnly) {
          try {
            const row = await tryInsertIntoSupabase(candidate)
            if (row?.token) {
              try {
                const deactivateMode: 'all' | 'temp' = candidate.expires_at ? 'temp' : 'all'
                await tryDeactivateOtherSupabaseEntries(shopSlug, safeString(row.id), deactivateMode)
              } catch {
              }
              return {
                storage: 'supabase' as const,
                shopSlug: safeString(row.shop_slug),
                pin: safeString(row.pin),
                token: safeString(row.token),
                url: buildUrl(origin, safeString(row.token)),
              }
            }
            if (!row) localOnly = true
          } catch (e: any) {
            if (safeLower(e?.message) === 'timeout') {
              localOnly = true
              continue
            }
            if (isUniqueViolation(e)) continue
            throw e
          }

          if (!localOnly) continue
        }

        try {
          const local = connectPlusStore.createEntry({ shopSlug, pinLen, expiresHours })
          if (local?.token) {
            const deactivateMode: 'all' | 'temp' = local.expires_at ? 'temp' : 'all'
            try {
              connectPlusStore.deactivateByShopSlug({ shopSlug, mode: deactivateMode, keepId: safeString(local.id) })
            } catch {
            }
            return {
              storage: 'local' as const,
              shopSlug: safeString(local.shop_slug),
              pin: safeString(local.pin),
              token: safeString(local.token),
              url: buildUrl(origin, safeString(local.token)),
            }
          }
        } catch {
          continue
        }
      }
    }

    throw new Error('Impossible de générer une entrée unique')
  },

  isSupabaseConfigured: () => Boolean(supabase),
}
