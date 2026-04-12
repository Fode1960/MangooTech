import fs from 'fs'
import path from 'path'

export type LocalVendorBoostRow = {
  vendor_id: string
  vendor_kind: 'shop' | 'provider'
  sponsored_until: string | null
  sponsored_tier: 'bronze' | 'argent' | 'or' | null
  promo_until: string | null
  new_until: string | null
  updated_at: string
}

type LocalVendorBoostDb = {
  rows: LocalVendorBoostRow[]
}

const DATA_DIR = path.resolve(process.cwd(), 'server', 'data')
const DB_PATH = path.resolve(DATA_DIR, 'local-vendor-boosts.json')

const ensureDir = () => {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  } catch {
  }
}

const nowIso = () => new Date().toISOString()

const safeRead = (): LocalVendorBoostDb => {
  ensureDir()
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf8')
    const parsed = raw ? JSON.parse(raw) : null
    const db = parsed && typeof parsed === 'object' ? parsed : null
    return { rows: Array.isArray(db?.rows) ? db.rows : [] }
  } catch {
    return { rows: [] }
  }
}

const safeWrite = (db: LocalVendorBoostDb) => {
  ensureDir()
  const tmp = `${DB_PATH}.tmp`
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2), 'utf8')
  fs.renameSync(tmp, DB_PATH)
}

const normalizeKind = (value: any): 'shop' | 'provider' => {
  const k = String(value || '').trim().toLowerCase()
  return k === 'provider' ? 'provider' : 'shop'
}

const baseUntil = (iso: string | null, now: Date) => {
  const d = iso ? new Date(String(iso)) : null
  if (!d || Number.isNaN(d.getTime())) return now
  return d.getTime() > now.getTime() ? d : now
}

const addHours = (d: Date, hours: number) => new Date(d.getTime() + hours * 60 * 60 * 1000)

export const localVendorBoostsStore = {
  get: (vendorId: string, vendorKind: string) => {
    const id = String(vendorId || '').trim()
    if (!id) return null
    const kind = normalizeKind(vendorKind)
    const db = safeRead()
    return db.rows.find((r) => String(r.vendor_id) === id && String(r.vendor_kind) === kind) || null
  },

  listActive: () => {
    const now = Date.now()
    const db = safeRead()
    return (db.rows || []).filter((r) => {
      const s = r.sponsored_until ? Date.parse(String(r.sponsored_until)) : 0
      const p = r.promo_until ? Date.parse(String(r.promo_until)) : 0
      const n = r.new_until ? Date.parse(String(r.new_until)) : 0
      return (Number.isFinite(s) && s > now) || (Number.isFinite(p) && p > now) || (Number.isFinite(n) && n > now)
    })
  },

  activate: (params: {
    vendorId: string
    vendorKind: string
    boostKind: 'sponsored' | 'promo' | 'new'
    durationHours: number
    sponsoredTier?: 'bronze' | 'argent' | 'or' | null
  }) => {
    const vendorId = String(params.vendorId || '').trim()
    if (!vendorId) throw new Error('vendor_id manquant')
    const vendorKind = normalizeKind(params.vendorKind)
    const boostKind = String(params.boostKind || '').trim().toLowerCase() as any
    const durationHours = Math.floor(Number(params.durationHours))
    if (boostKind !== 'sponsored' && boostKind !== 'promo' && boostKind !== 'new') throw new Error('boost_kind invalide')
    if (![12, 24, 48, 72].includes(durationHours)) throw new Error('duration_hours invalide')

    const db = safeRead()
    const now = new Date()
    const idx = db.rows.findIndex((r) => String(r.vendor_id) === vendorId && String(r.vendor_kind) === vendorKind)
    const current: LocalVendorBoostRow = idx >= 0
      ? db.rows[idx]
      : {
        vendor_id: vendorId,
        vendor_kind: vendorKind,
        sponsored_until: null,
        sponsored_tier: null,
        promo_until: null,
        new_until: null,
        updated_at: nowIso(),
      }

    const next: LocalVendorBoostRow = { ...current, updated_at: nowIso() }
    if (boostKind === 'sponsored') {
      const start = baseUntil(current.sponsored_until, now)
      next.sponsored_until = addHours(start, durationHours).toISOString()
      const t = params.sponsoredTier
      next.sponsored_tier = t === 'bronze' || t === 'argent' || t === 'or' ? t : (current.sponsored_tier || 'bronze')
    }
    if (boostKind === 'promo') {
      const start = baseUntil(current.promo_until, now)
      next.promo_until = addHours(start, durationHours).toISOString()
    }
    if (boostKind === 'new') {
      const start = baseUntil(current.new_until, now)
      next.new_until = addHours(start, durationHours).toISOString()
    }

    if (idx >= 0) db.rows[idx] = next
    else db.rows.push(next)
    safeWrite(db)
    return next
  },

  stop: (vendorId: string, vendorKind: string, boostKind: 'sponsored' | 'promo' | 'new') => {
    const id = String(vendorId || '').trim()
    if (!id) throw new Error('vendor_id manquant')
    const kind = normalizeKind(vendorKind)
    const db = safeRead()
    const idx = db.rows.findIndex((r) => String(r.vendor_id) === id && String(r.vendor_kind) === kind)
    if (idx < 0) throw new Error('Aucun boost')
    const row = db.rows[idx]
    const next: LocalVendorBoostRow = { ...row, updated_at: nowIso() }
    if (boostKind === 'sponsored') {
      next.sponsored_until = null
      next.sponsored_tier = null
    }
    if (boostKind === 'promo') next.promo_until = null
    if (boostKind === 'new') next.new_until = null
    db.rows[idx] = next
    safeWrite(db)
    return next
  },

  stopAll: (vendorId: string, vendorKind: string) => {
    const id = String(vendorId || '').trim()
    if (!id) throw new Error('vendor_id manquant')
    const kind = normalizeKind(vendorKind)
    const db = safeRead()
    const idx = db.rows.findIndex((r) => String(r.vendor_id) === id && String(r.vendor_kind) === kind)
    if (idx < 0) throw new Error('Aucun boost')
    const row = db.rows[idx]
    const next: LocalVendorBoostRow = {
      ...row,
      sponsored_until: null,
      sponsored_tier: null,
      promo_until: null,
      new_until: null,
      updated_at: nowIso(),
    }
    db.rows[idx] = next
    safeWrite(db)
    return next
  },
}
