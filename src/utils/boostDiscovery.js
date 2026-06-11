import { supabase, supabaseConfig } from '../config/supabase'

const readBool = (value) => {
  const v = String(value ?? '').trim().toLowerCase()
  if (v === '1' || v === 'true' || v === 'yes' || v === 'on') return true
  if (v === '0' || v === 'false' || v === 'no' || v === 'off') return false
  return null
}

export const getBoostDiscoveryFlags = () => {
  let vitrine = readBool(import.meta.env.VITE_BOOST_VITRINE)
  let promo = readBool(import.meta.env.VITE_BOOST_PROMO)

  try {
    const qs = new URLSearchParams(window.location.search)
    const qVitrine = readBool(qs.get('ff_boost_vitrine'))
    const qPromo = readBool(qs.get('ff_boost_promo'))
    if (qVitrine !== null) vitrine = qVitrine
    if (qPromo !== null) promo = qPromo

    try {
      if (qVitrine !== null) localStorage.setItem('mangoo_ff_boost_vitrine', qVitrine ? '1' : '0')
      if (qPromo !== null) localStorage.setItem('mangoo_ff_boost_promo', qPromo ? '1' : '0')
    } catch {
    }
  } catch {
  }

  try {
    const host = String(window.location.hostname || '')
    const isDevHost = host === 'localhost' || host === '127.0.0.1' || host.startsWith('192.168.') || host.startsWith('10.') || host.startsWith('172.')
    if (isDevHost) {
      try {
        const lsVitrine = readBool(localStorage.getItem('mangoo_ff_boost_vitrine'))
        const lsPromo = readBool(localStorage.getItem('mangoo_ff_boost_promo'))
        if (lsVitrine !== null) vitrine = lsVitrine
        if (lsPromo !== null) promo = lsPromo
      } catch {
      }

      if (vitrine === null || vitrine === undefined) vitrine = true
      if (promo === null || promo === undefined) promo = true
      try {
        localStorage.setItem('mangoo_ff_boost_vitrine', vitrine ? '1' : '0')
        localStorage.setItem('mangoo_ff_boost_promo', promo ? '1' : '0')
      } catch {
      }
    } else {
      if (vitrine === null || vitrine === undefined) vitrine = true
      if (promo === null || promo === undefined) promo = true
    }
  } catch {
  }

  if (vitrine === null || vitrine === undefined) vitrine = true
  if (promo === null || promo === undefined) promo = true

  return {
    vitrine: Boolean(vitrine),
    promo: Boolean(promo),
  }
}

let inFlightBoostRowsPromise = null
let inFlightBoostRowsStartedAt = 0

export const fetchActiveBoostRows = async ({ timeoutMs = 6000 } = {}) => {
  const now = Date.now()
  if (inFlightBoostRowsPromise && now - inFlightBoostRowsStartedAt < 2000) {
    return await inFlightBoostRowsPromise
  }
  inFlightBoostRowsStartedAt = now

  const doFetch = async () => {
  const host = (() => {
    try {
      return String(window.location.hostname || '')
    } catch {
      return ''
    }
  })()
  const isDevHost = host === 'localhost' || host === '127.0.0.1' || host.startsWith('192.168.') || host.startsWith('10.') || host.startsWith('172.')
  const hasSupabase = Boolean(supabaseConfig?.hasUrl && supabaseConfig?.hasAnonKey)

  const serverTimeoutMs = isDevHost && hasSupabase ? Math.min(1200, timeoutMs) : timeoutMs
  const controller = new AbortController()
  const t = window.setTimeout(() => controller.abort(), serverTimeoutMs)
  try {
    const tryFetch = async (url) => {
      const res = await fetch(url, { method: 'GET', signal: controller.signal })
      const json = await res.json().catch(() => null)
      return { res, json }
    }

    const first = await tryFetch('/api/boosts/vendor-boosts-active')
    let rows = Array.isArray(first?.json?.rows) ? first.json.rows : []

    if (rows.length) {
      try {
        localStorage.setItem('mangoo_boost_active_cache_rows', JSON.stringify(rows))
      } catch {
      }
      return rows
    }
  } catch {
  } finally {
    window.clearTimeout(t)
  }

  if (hasSupabase) {
    const controller = new AbortController()
    const t = window.setTimeout(() => controller.abort(), timeoutMs)
    try {
      const attempt = async (withOrder) => {
        let q = supabase
          .from('vendor_boosts')
          .select('vendor_id,vendor_kind,sponsored_until,sponsored_tier,promo_until,new_until,updated_at')
          .limit(200)
        if (withOrder) q = q.order('updated_at', { ascending: false })
        return await q
      }

      let r = await attempt(true)
      if (r?.error) {
        const msg = String(r.error.message || '').toLowerCase()
        const missingUpdatedAt = msg.includes('could not find') && msg.includes('updated_at')
        if (missingUpdatedAt) r = await attempt(false)
      }

      if (!r?.error && Array.isArray(r?.data)) {
        try {
          localStorage.setItem('mangoo_boost_active_cache_rows', JSON.stringify(r.data))
        } catch {
        }
        return r.data
      }
    } catch {
    } finally {
      window.clearTimeout(t)
    }
  }

  try {
    try {
      const raw = localStorage.getItem('mangoo_boost_active_cache_rows')
      const parsed = raw ? JSON.parse(raw) : []
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  } finally {
    window.clearTimeout(t)
  }

  return []
  }

  inFlightBoostRowsPromise = doFetch()
  try {
    return await inFlightBoostRowsPromise
  } finally {
    window.setTimeout(() => {
      try {
        if (inFlightBoostRowsPromise && Date.now() - inFlightBoostRowsStartedAt >= 2000) {
          inFlightBoostRowsPromise = null
        }
      } catch {
      }
    }, 0)
  }
}

export const readBoostConfigCacheRows = () => {
  try {
    const raw = localStorage.getItem('mangoo_boost_config')
    const parsed = raw ? JSON.parse(raw) : null
    if (!parsed || typeof parsed !== 'object') return []
    const rows = []
    Object.keys(parsed).forEach((vendorId) => {
      const cfg = parsed[vendorId]
      if (!cfg || typeof cfg !== 'object') return
      const toIso = (ms) => {
        const n = Number(ms)
        if (!Number.isFinite(n) || n <= 0) return null
        return new Date(n).toISOString()
      }
      rows.push({
        vendor_id: String(vendorId),
        vendor_kind: 'shop',
        sponsored_until: toIso(cfg.sponsoredUntil),
        sponsored_tier: cfg.sponsoredTier === 3 ? 'or' : cfg.sponsoredTier === 2 ? 'argent' : cfg.sponsoredTier === 1 ? 'bronze' : null,
        promo_until: toIso(cfg.promoUntil),
        new_until: toIso(cfg.newUntil),
      })
    })
    return rows
  } catch {
    return []
  }
}

export const readBoostActiveCacheRows = () => {
  try {
    const raw = localStorage.getItem('mangoo_boost_active_cache_rows')
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export const indexActiveBoosts = (rows) => {
  const map = new Map()
  const now = Date.now()
  const toMs = (iso) => {
    if (!iso) return 0
    const raw = String(iso)
    let t = Date.parse(raw)
    if (Number.isFinite(t)) return t
    try {
      const normalized = raw
        .replace(' ', 'T')
        .replace(/\.(\d{3})\d+/, '.$1')
        .replace(/\+00$/, 'Z')
      t = Date.parse(normalized)
      return Number.isFinite(t) ? t : 0
    } catch {
      return 0
    }
  }
  ;(Array.isArray(rows) ? rows : []).forEach((r) => {
    const vendorId = String(r?.vendor_id || '').trim()
    const vendorKind = String(r?.vendor_kind || '').trim().toLowerCase()
    if (!vendorId || (vendorKind !== 'shop' && vendorKind !== 'provider')) return
    const sponsoredUntilMs = toMs(r?.sponsored_until)
    const promoUntilMs = toMs(r?.promo_until)
    const newUntilMs = toMs(r?.new_until)
    if (!(sponsoredUntilMs > now || promoUntilMs > now || newUntilMs > now)) return
    const payload = {
      vendorId,
      vendorKind,
      sponsoredUntilMs,
      sponsoredTier: r?.sponsored_tier || null,
      promoUntilMs,
      newUntilMs,
    }
    map.set(`${vendorKind}:${vendorId}`, payload)
    map.set(vendorId, payload)
    if (vendorKind === 'shop') map.set(`shop:${vendorId}`, payload)
    if (vendorKind === 'provider') map.set(`provider:${vendorId}`, payload)
  })
  return map
}
