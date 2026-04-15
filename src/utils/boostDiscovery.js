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

export const fetchActiveBoostRows = async ({ timeoutMs = 6000 } = {}) => {
  try {
    const { supabase, supabaseConfig } = await import('../config/supabase')
    const hasSupabase = Boolean(supabaseConfig?.hasUrl && supabaseConfig?.hasAnonKey)
    if (hasSupabase) {
      const controller = new AbortController()
      const t = window.setTimeout(() => controller.abort(), timeoutMs)
      try {
        const { data, error } = await supabase
          .from('vendor_boosts')
          .select('vendor_id,vendor_kind,sponsored_until,sponsored_tier,promo_until,new_until')
          .order('updated_at', { ascending: false })
          .limit(200)
        if (!error && Array.isArray(data)) return data
      } catch {
      } finally {
        window.clearTimeout(t)
      }
    }
  } catch {
  }

  const controller = new AbortController()
  const t = window.setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch('/api/boosts/vendor-boosts-active', { method: 'GET', signal: controller.signal })
    const json = await res.json().catch(() => null)
    const rows = Array.isArray(json?.rows) ? json.rows : []
    return rows
  } finally {
    window.clearTimeout(t)
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

export const indexActiveBoosts = (rows) => {
  const map = new Map()
  const now = Date.now()
  const toMs = (iso) => {
    if (!iso) return 0
    const t = Date.parse(String(iso))
    return Number.isFinite(t) ? t : 0
  }
  ;(Array.isArray(rows) ? rows : []).forEach((r) => {
    const vendorId = String(r?.vendor_id || '').trim()
    const vendorKind = String(r?.vendor_kind || '').trim().toLowerCase()
    if (!vendorId || (vendorKind !== 'shop' && vendorKind !== 'provider')) return
    const sponsoredUntilMs = toMs(r?.sponsored_until)
    const promoUntilMs = toMs(r?.promo_until)
    const newUntilMs = toMs(r?.new_until)
    if (!(sponsoredUntilMs > now || promoUntilMs > now || newUntilMs > now)) return
    map.set(`${vendorKind}:${vendorId}`, {
      vendorId,
      vendorKind,
      sponsoredUntilMs,
      sponsoredTier: r?.sponsored_tier || null,
      promoUntilMs,
      newUntilMs,
    })
    map.set(vendorId, {
      vendorId,
      vendorKind,
      sponsoredUntilMs,
      sponsoredTier: r?.sponsored_tier || null,
      promoUntilMs,
      newUntilMs,
    })
  })
  return map
}
