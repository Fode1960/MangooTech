import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

type BoostKind = 'new' | 'promo' | 'sponsored'
type SponsoredTier = 'bronze' | 'argent' | 'or'

export type LocalBoostProduct = {
  id: string
  kind: BoostKind
  duration_hours: number
  price_xof: number
  currency: string
  title: string
  description: string
  sponsored_tier: SponsoredTier | null
  active: boolean
  created_at: string
  updated_at: string
}

type LocalBoostDb = {
  products: LocalBoostProduct[]
}

const DATA_DIR = path.resolve(process.cwd(), 'server', 'data')
const DB_PATH = path.resolve(DATA_DIR, 'local-boost-products.json')

const ensureDir = () => {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  } catch {
  }
}

const nowIso = () => new Date().toISOString()

const safeRead = (): LocalBoostDb => {
  ensureDir()
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf8')
    const parsed = raw ? JSON.parse(raw) : null
    const db = parsed && typeof parsed === 'object' ? parsed : null
    return {
      products: Array.isArray(db?.products) ? db.products : [],
    }
  } catch {
    return { products: [] }
  }
}

const safeWrite = (db: LocalBoostDb) => {
  ensureDir()
  const tmp = `${DB_PATH}.tmp`
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2), 'utf8')
  fs.renameSync(tmp, DB_PATH)
}

const normalizeKind = (value: any): BoostKind | null => {
  const k = String(value || '').trim().toLowerCase()
  if (k === 'new' || k === 'promo' || k === 'sponsored') return k
  return null
}

const normalizeTier = (value: any): SponsoredTier | null => {
  const t = String(value || '').trim().toLowerCase()
  if (t === 'bronze' || t === 'argent' || t === 'or') return t
  return null
}

const normalizeCurrency = (value: any) => {
  const c = String(value || 'XOF').trim().toUpperCase()
  return c || 'XOF'
}

const sortProducts = (list: LocalBoostProduct[]) => {
  const orderKind = (k: BoostKind) => (k === 'sponsored' ? 0 : k === 'promo' ? 1 : 2)
  return list
    .slice()
    .sort((a, b) => {
      const dk = orderKind(a.kind) - orderKind(b.kind)
      if (dk !== 0) return dk
      return (a.duration_hours || 0) - (b.duration_hours || 0)
    })
}

export const localBoostProductsStore = {
  list: () => {
    const db = safeRead()
    return sortProducts(db.products)
  },

  seedDefaults: () => {
    const db = safeRead()
    const existing = db.products
    const now = nowIso()
    const defaults: Omit<LocalBoostProduct, 'id'>[] = [
      { kind: 'sponsored', duration_hours: 12, price_xof: 2000, currency: 'XOF', title: 'Boost Sponsorisé (12h)', description: 'Sponsorisé sur la carte Mangoo Local+ (12h)', sponsored_tier: 'bronze', active: true, created_at: now, updated_at: now },
      { kind: 'sponsored', duration_hours: 24, price_xof: 5000, currency: 'XOF', title: 'Boost Sponsorisé (24h)', description: 'Sponsorisé sur la carte Mangoo Local+ (24h)', sponsored_tier: 'argent', active: true, created_at: now, updated_at: now },
      { kind: 'sponsored', duration_hours: 48, price_xof: 8500, currency: 'XOF', title: 'Boost Sponsorisé (48h)', description: 'Sponsorisé sur la carte Mangoo Local+ (48h)', sponsored_tier: 'argent', active: true, created_at: now, updated_at: now },
      { kind: 'sponsored', duration_hours: 72, price_xof: 12000, currency: 'XOF', title: 'Boost Sponsorisé (72h)', description: 'Sponsorisé sur la carte Mangoo Local+ (72h)', sponsored_tier: 'or', active: true, created_at: now, updated_at: now },
      { kind: 'promo', duration_hours: 24, price_xof: 1000, currency: 'XOF', title: 'Boost Promo (24h)', description: 'Badge Promo sur la carte Mangoo Local+ (24h)', sponsored_tier: null, active: true, created_at: now, updated_at: now },
      { kind: 'promo', duration_hours: 48, price_xof: 1800, currency: 'XOF', title: 'Boost Promo (48h)', description: 'Badge Promo sur la carte Mangoo Local+ (48h)', sponsored_tier: null, active: true, created_at: now, updated_at: now },
      { kind: 'promo', duration_hours: 72, price_xof: 2500, currency: 'XOF', title: 'Boost Promo (72h)', description: 'Badge Promo sur la carte Mangoo Local+ (72h)', sponsored_tier: null, active: true, created_at: now, updated_at: now },
      { kind: 'new', duration_hours: 24, price_xof: 500, currency: 'XOF', title: 'Boost Nouveau (24h)', description: 'Badge Nouveau sur la carte Mangoo Local+ (24h)', sponsored_tier: null, active: true, created_at: now, updated_at: now },
      { kind: 'new', duration_hours: 48, price_xof: 900, currency: 'XOF', title: 'Boost Nouveau (48h)', description: 'Badge Nouveau sur la carte Mangoo Local+ (48h)', sponsored_tier: null, active: true, created_at: now, updated_at: now },
      { kind: 'new', duration_hours: 72, price_xof: 1500, currency: 'XOF', title: 'Boost Nouveau (72h)', description: 'Badge Nouveau sur la carte Mangoo Local+ (72h)', sponsored_tier: null, active: true, created_at: now, updated_at: now },
    ]

    const keyOf = (p: { kind: BoostKind; duration_hours: number; sponsored_tier: SponsoredTier | null }) => {
      return `${p.kind}:${p.duration_hours}:${p.kind === 'sponsored' ? (p.sponsored_tier || 'bronze') : 'na'}`
    }

    const byKey = new Map<string, LocalBoostProduct>()
    existing.forEach((p) => {
      const k = normalizeKind(p?.kind)
      if (!k) return
      byKey.set(keyOf({ kind: k, duration_hours: Number(p.duration_hours), sponsored_tier: normalizeTier(p.sponsored_tier) }), p)
    })

    defaults.forEach((d) => {
      const k = keyOf({ kind: d.kind, duration_hours: d.duration_hours, sponsored_tier: d.sponsored_tier })
      if (byKey.has(k)) return
      byKey.set(k, {
        id: `bp_${crypto.randomBytes(12).toString('hex')}`,
        ...d,
      })
    })

    db.products = sortProducts(Array.from(byKey.values()))
    safeWrite(db)
    return db.products
  },

  create: (input: any) => {
    const kind = normalizeKind(input?.kind)
    const durationHours = Math.floor(Number(input?.duration_hours))
    const priceXof = Math.floor(Number(input?.price_xof))
    const currency = normalizeCurrency(input?.currency)
    const title = String(input?.title || '').trim()
    const description = String(input?.description || '').trim()
    const tier = kind === 'sponsored' ? (normalizeTier(input?.sponsored_tier) || 'bronze') : null
    const active = input?.active === undefined ? true : Boolean(input.active)

    if (!kind) throw new Error('kind invalide')
    if (![12, 24, 48, 72].includes(durationHours)) throw new Error('duration_hours invalide (12/24/48/72)')
    if (!Number.isFinite(priceXof) || priceXof < 0) throw new Error('price_xof invalide')
    const safeTitle = title || (kind === 'sponsored' ? 'Boost Sponsorisé' : kind === 'promo' ? 'Boost Promo' : 'Boost Nouveau')
    const safeDescription = description || `${safeTitle} (${durationHours}h)`

    const db = safeRead()
    const now = nowIso()
    const product: LocalBoostProduct = {
      id: `bp_${crypto.randomBytes(12).toString('hex')}`,
      kind,
      duration_hours: durationHours,
      price_xof: priceXof,
      currency,
      title: safeTitle,
      description: safeDescription,
      sponsored_tier: kind === 'sponsored' ? tier : null,
      active,
      created_at: now,
      updated_at: now,
    }

    db.products.push(product)
    db.products = sortProducts(db.products)
    safeWrite(db)
    return product
  },

  update: (id: string, patchInput: any) => {
    const pid = String(id || '').trim()
    if (!pid) throw new Error('id manquant')
    const db = safeRead()
    const idx = db.products.findIndex((p) => String(p.id) === pid)
    if (idx < 0) throw new Error('Produit introuvable')
    const current = db.products[idx]
    const patch: Partial<LocalBoostProduct> = {}

    if (patchInput?.price_xof !== undefined) patch.price_xof = Math.floor(Number(patchInput.price_xof))
    if (patchInput?.currency !== undefined) patch.currency = normalizeCurrency(patchInput.currency)
    if (patchInput?.title !== undefined) patch.title = String(patchInput.title || '')
    if (patchInput?.description !== undefined) patch.description = String(patchInput.description || '')
    if (patchInput?.active !== undefined) patch.active = Boolean(patchInput.active)
    if (patchInput?.sponsored_tier !== undefined) {
      patch.sponsored_tier = current.kind === 'sponsored' ? normalizeTier(patchInput.sponsored_tier) : null
    }

    const next: LocalBoostProduct = {
      ...current,
      ...patch,
      updated_at: nowIso(),
    }

    db.products[idx] = next
    db.products = sortProducts(db.products)
    safeWrite(db)
    return next
  },

  remove: (id: string) => {
    const pid = String(id || '').trim()
    if (!pid) throw new Error('id manquant')
    const db = safeRead()
    const before = db.products.length
    db.products = db.products.filter((p) => String(p.id) !== pid)
    if (db.products.length === before) throw new Error('Produit introuvable')
    safeWrite(db)
    return true
  },
}
