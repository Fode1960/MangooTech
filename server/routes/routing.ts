import { Router } from 'express'
import { createClient } from '@supabase/supabase-js'

const router = Router()

const DEFAULT_OSRM_BASE_URL = 'http://localhost:5000'
const PUBLIC_OSRM_BASE_URL = 'https://router.project-osrm.org'

type CacheEntry = { expiresAt: number; value: any }

const ROUTE_CACHE_TTL_MS = Number(process.env.OSRM_ROUTE_CACHE_TTL_MS || 30000)
const ROUTE_CACHE_MAX = Number(process.env.OSRM_ROUTE_CACHE_MAX || 500)
const routeCache = new Map<string, CacheEntry>()

let supabaseClient: ReturnType<typeof createClient> | null | undefined

function getSupabase() {
  if (supabaseClient !== undefined) return supabaseClient
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    supabaseClient = null
    return supabaseClient
  }
  supabaseClient = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  return supabaseClient
}

async function readRouteCacheFromSupabase(key: string, now: number) {
  const supabase = getSupabase()
  if (!supabase) return null
  const { data, error } = await supabase
    .from('route_cache')
    .select('response, expires_at')
    .eq('key', key)
    .maybeSingle()
  if (error || !data) return null
  const exp = new Date(String((data as any).expires_at)).getTime()
  if (!Number.isFinite(exp) || exp <= now) return null
  return { response: (data as any).response, expiresAt: exp }
}

function writeRouteCacheToSupabase(key: string, response: any, expiresAt: number) {
  const supabase = getSupabase()
  if (!supabase) return
  supabase
    .from('route_cache')
    .upsert({ key, response, expires_at: new Date(expiresAt).toISOString() })
    .then(() => {})
    .catch(() => {})
}

function cleanupCache(now: number) {
  for (const [k, v] of routeCache) {
    if (v.expiresAt <= now) routeCache.delete(k)
  }
  while (routeCache.size > ROUTE_CACHE_MAX) {
    const first = routeCache.keys().next().value
    if (!first) break
    routeCache.delete(first)
  }
}

function cacheKey(baseUrl: string, from: { lat: number; lng: number }, to: { lat: number; lng: number }, overview: string, steps: boolean): string {
  const fLat = from.lat.toFixed(5)
  const fLng = from.lng.toFixed(5)
  const tLat = to.lat.toFixed(5)
  const tLng = to.lng.toFixed(5)
  return `${baseUrl}|${fLat},${fLng}|${tLat},${tLng}|overview=${overview}|steps=${steps ? 1 : 0}`
}

type RegionKey = 'cm' | 'ci' | 'sn'

type Region = {
  key: RegionKey
  label: string
  minLat: number
  maxLat: number
  minLng: number
  maxLng: number
  envKey: string
}

const REGIONS: Region[] = [
  {
    key: 'cm',
    label: 'Cameroun',
    minLat: 1.6,
    maxLat: 13.1,
    minLng: 8.4,
    maxLng: 16.2,
    envKey: 'OSRM_CM_BASE_URL',
  },
  {
    key: 'ci',
    label: "Côte d'Ivoire",
    minLat: 4.3,
    maxLat: 10.8,
    minLng: -8.6,
    maxLng: -2.5,
    envKey: 'OSRM_CI_BASE_URL',
  },
  {
    key: 'sn',
    label: 'Sénégal',
    minLat: 12.3,
    maxLat: 16.7,
    minLng: -17.6,
    maxLng: -11.3,
    envKey: 'OSRM_SN_BASE_URL',
  },
]

function inBounds(p: { lat: number; lng: number }, r: Region): boolean {
  return p.lat >= r.minLat && p.lat <= r.maxLat && p.lng >= r.minLng && p.lng <= r.maxLng
}

function pickRegion(from: { lat: number; lng: number }, to: { lat: number; lng: number }): Region | null {
  const fromRegion = REGIONS.find((r) => inBounds(from, r)) || null
  const toRegion = REGIONS.find((r) => inBounds(to, r)) || null
  if (fromRegion && toRegion && fromRegion.key === toRegion.key) return fromRegion
  if (toRegion) return toRegion
  if (fromRegion) return fromRegion
  return null
}

function pickBaseUrl(from: { lat: number; lng: number }, to: { lat: number; lng: number }) {
  const region = pickRegion(from, to)
  const defaultUrl = String(process.env.OSRM_BASE_URL || DEFAULT_OSRM_BASE_URL)
  if (!region) {
    return { baseUrl: defaultUrl, regionKey: null as RegionKey | null, regionLabel: null as string | null }
  }
  const regionUrl = String(process.env[region.envKey] || '')
  return {
    baseUrl: regionUrl || defaultUrl,
    regionKey: region.key,
    regionLabel: region.label,
  }
}

function parseLatLng(input: unknown): { lat: number; lng: number } | null {
  if (typeof input !== 'string') return null
  const parts = input.split(',').map((p) => p.trim())
  if (parts.length !== 2) return null
  const lat = Number(parts[0])
  const lng = Number(parts[1])
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null
  return { lat, lng }
}

async function fetchOsrmRoute(
  baseUrl: string,
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
  options?: { overview?: 'simplified' | 'full' | 'false'; steps?: boolean },
) {
  const now = Date.now()
  cleanupCache(now)
  const overview = options?.overview || 'simplified'
  const steps = Boolean(options?.steps)
  const key = cacheKey(baseUrl, from, to, overview, steps)
  const cached = routeCache.get(key)
  if (cached && cached.expiresAt > now) {
    return cached.value
  }

  if (ROUTE_CACHE_TTL_MS > 0) {
    try {
      const dbCached = await readRouteCacheFromSupabase(key, now)
      if (dbCached) {
        routeCache.set(key, { expiresAt: Math.min(dbCached.expiresAt, now + ROUTE_CACHE_TTL_MS), value: dbCached.response })
        return dbCached.response
      }
    } catch {
    }
  }

  const url = new URL(`${baseUrl.replace(/\/$/, '')}/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}`)
  url.searchParams.set('overview', overview)
  url.searchParams.set('geometries', 'geojson')
  url.searchParams.set('steps', steps ? 'true' : 'false')

  const res = await fetch(url.toString())
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`OSRM ${res.status}: ${text || 'request failed'}`)
  }
  const data = await res.json()
  routeCache.set(key, { expiresAt: now + ROUTE_CACHE_TTL_MS, value: data })

  if (ROUTE_CACHE_TTL_MS > 0) {
    try {
      writeRouteCacheToSupabase(key, data, now + ROUTE_CACHE_TTL_MS)
    } catch {
    }
  }
  return data
}

router.get('/route', async (req, res) => {
  const from = parseLatLng(req.query.from)
  const to = parseLatLng(req.query.to)

  if (!from || !to) {
    return res.status(400).json({
      success: false,
      error: "Paramètres requis: from=lat,lng&to=lat,lng",
    })
  }

  const chosen = pickBaseUrl(from, to)
  const osrmBaseUrl = chosen.baseUrl
  const allowPublicFallback = String(process.env.OSRM_ALLOW_PUBLIC_FALLBACK || 'true') === 'true'

  const overviewRaw = String(req.query.overview || 'simplified')
  const overview: 'simplified' | 'full' | 'false' =
    overviewRaw === 'full' || overviewRaw === 'false' ? overviewRaw : 'simplified'
  const steps = String(req.query.steps || '0') === '1'

  try {
    const data = await fetchOsrmRoute(osrmBaseUrl, from, to, { overview, steps })
    const route = data?.routes?.[0]
    return res.status(200).json({
      success: true,
      requested_source: osrmBaseUrl,
      region: chosen.regionKey,
      region_label: chosen.regionLabel,
      distance_m: route?.distance ?? null,
      duration_s: route?.duration ?? null,
      geometry: route?.geometry ?? null,
      legs: route?.legs ?? null,
    })
  } catch (e) {
    if (!allowPublicFallback) {
      return res.status(502).json({ success: false, error: String((e as Error)?.message || e) })
    }

    try {
      const data = await fetchOsrmRoute(PUBLIC_OSRM_BASE_URL, from, to, { overview, steps })
      const route = data?.routes?.[0]
      return res.status(200).json({
        success: true,
        requested_source: osrmBaseUrl,
        source: PUBLIC_OSRM_BASE_URL,
        region: chosen.regionKey,
        region_label: chosen.regionLabel,
        distance_m: route?.distance ?? null,
        duration_s: route?.duration ?? null,
        geometry: route?.geometry ?? null,
        legs: route?.legs ?? null,
        fallback: true,
      })
    } catch (e2) {
      return res.status(502).json({
        success: false,
        error: String((e2 as Error)?.message || e2),
      })
    }
  }
})

export default router
