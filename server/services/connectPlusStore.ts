import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

export type ConnectPlusEntry = {
  id: string
  shop_slug: string
  pin: string
  token: string
  is_active: boolean
  created_at: string
  expires_at: string | null
}

type Db = {
  entries: ConnectPlusEntry[]
}

const DATA_DIR = path.resolve(process.cwd(), 'server', 'data')
const DB_PATH = path.resolve(DATA_DIR, 'local-connect-plus.json')

const ensureDir = () => {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  } catch {
  }
}

const nowIso = () => new Date().toISOString()
const safeString = (v: any) => String(v || '').trim()

const safeRead = (): Db => {
  ensureDir()
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf8')
    const parsed = raw ? JSON.parse(raw) : null
    const db = parsed && typeof parsed === 'object' ? parsed : null
    return {
      entries: Array.isArray((db as any)?.entries) ? (db as any).entries : [],
    }
  } catch {
    return { entries: [] }
  }
}

const safeWrite = (db: Db) => {
  ensureDir()
  const tmp = `${DB_PATH}.tmp`
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2), 'utf8')
  fs.renameSync(tmp, DB_PATH)
}

const normalizePin = (value: any) => String(value || '').replace(/[^\d]/g, '').slice(0, 6)
const normalizeToken = (value: any) => String(value || '').trim()
const normalizeSlug = (value: any) => String(value || '').trim().toLowerCase()

const RESERVED_PINS = new Set(['000000'])

const randomDigits = (len: number) => {
  const n = Math.max(1, Math.floor(len))
  let out = ''
  for (let i = 0; i < n; i++) {
    out += String(Math.floor(Math.random() * 10))
  }
  return out
}

const randomToken = () => crypto.randomBytes(16).toString('hex')

export const connectPlusStore = {
  generateEntry: (params: { shopSlug: string; pinLen?: number; expiresHours?: number | null }) => {
    const shopSlug = normalizeSlug(params.shopSlug)
    if (!shopSlug) throw new Error('shopSlug manquant')

    const pinLen = Math.max(4, Math.min(6, Math.floor(Number(params.pinLen || 4))))
    const expiresHoursRaw = params.expiresHours === null || params.expiresHours === undefined ? null : Number(params.expiresHours)
    const expiresHours = expiresHoursRaw !== null && Number.isFinite(expiresHoursRaw) ? Math.max(1, Math.floor(expiresHoursRaw)) : null

    const createdAt = nowIso()
    const expiresAt = expiresHours ? new Date(Date.now() + expiresHours * 3600 * 1000).toISOString() : null

    const entry: ConnectPlusEntry = {
      id: `cp_${crypto.randomBytes(10).toString('hex')}`,
      shop_slug: shopSlug,
      pin: randomDigits(pinLen),
      token: randomToken(),
      is_active: true,
      created_at: createdAt,
      expires_at: expiresAt,
    }
    return entry
  },

  createEntry: (params: { shopSlug: string; pinLen?: number; expiresHours?: number | null }) => {
    const shopSlug = normalizeSlug(params.shopSlug)
    if (!shopSlug) throw new Error('shopSlug manquant')

    const pinLen = Math.max(4, Math.min(6, Math.floor(Number(params.pinLen || 4))))
    const expiresHoursRaw = params.expiresHours === null || params.expiresHours === undefined ? null : Number(params.expiresHours)
    const expiresHours = expiresHoursRaw !== null && Number.isFinite(expiresHoursRaw) ? Math.max(1, Math.floor(expiresHoursRaw)) : null

    const db = safeRead()
    const entries = Array.isArray(db.entries) ? db.entries : []

    const active = entries.filter((e) => e && typeof e === 'object' && e.is_active)
    const pins = new Set(active.map((e) => normalizePin((e as any)?.pin)).filter(Boolean))
    const tokens = new Set(active.map((e) => normalizeToken((e as any)?.token)).filter(Boolean))

    let entry: ConnectPlusEntry | null = null
    for (let i = 0; i < 50; i++) {
      const candidate = connectPlusStore.generateEntry({ shopSlug, pinLen, expiresHours })
      const p = normalizePin(candidate.pin)
      const t = normalizeToken(candidate.token)
      if (!p || !t) continue
      if (RESERVED_PINS.has(p)) continue
      if (pins.has(p)) continue
      if (tokens.has(t)) continue
      entry = candidate
      break
    }
    if (!entry) throw new Error('Impossible de générer une entrée unique')

    db.entries = [entry, ...entries].slice(0, 5000)
    safeWrite(db)
    return entry
  },

  findActiveByToken: (token: string) => {
    const t = normalizeToken(token)
    if (!t) return null
    const db = safeRead()
    const entries = Array.isArray(db.entries) ? db.entries : []
    const now = Date.now()
    for (const e of entries) {
      if (!e || typeof e !== 'object') continue
      if (!e.is_active) continue
      if (normalizeToken(e.token) !== t) continue
      const exp = e.expires_at ? Date.parse(String(e.expires_at)) : NaN
      if (Number.isFinite(exp) && exp <= now) continue
      return e
    }
    return null
  },

  findActiveByPin: (pin: string) => {
    const p = normalizePin(pin)
    if (!p) return null
    const db = safeRead()
    const entries = Array.isArray(db.entries) ? db.entries : []
    const now = Date.now()
    for (const e of entries) {
      if (!e || typeof e !== 'object') continue
      if (!e.is_active) continue
      if (normalizePin(e.pin) !== p) continue
      const exp = e.expires_at ? Date.parse(String(e.expires_at)) : NaN
      if (Number.isFinite(exp) && exp <= now) continue
      return e
    }
    return null
  },

  findLatestActiveByShopSlug: (shopSlug: string) => {
    const slug = normalizeSlug(shopSlug)
    if (!slug) return null
    const db = safeRead()
    const entries = Array.isArray(db.entries) ? db.entries : []
    const now = Date.now()
    for (const e of entries) {
      if (!e || typeof e !== 'object') continue
      if (!e.is_active) continue
      if (normalizeSlug(e.shop_slug) !== slug) continue
      const exp = e.expires_at ? Date.parse(String(e.expires_at)) : NaN
      if (Number.isFinite(exp) && exp <= now) continue
      return e
    }
    return null
  },

  findLatestActiveStableByShopSlug: (shopSlug: string) => {
    const slug = normalizeSlug(shopSlug)
    if (!slug) return null
    const db = safeRead()
    const entries = Array.isArray(db.entries) ? db.entries : []
    const now = Date.now()
    for (const e of entries) {
      if (!e || typeof e !== 'object') continue
      if (!e.is_active) continue
      if (normalizeSlug(e.shop_slug) !== slug) continue
      if (e.expires_at) continue
      const exp = e.expires_at ? Date.parse(String(e.expires_at)) : NaN
      if (Number.isFinite(exp) && exp <= now) continue
      return e
    }
    return null
  },

  findLatestActiveTempByShopSlug: (shopSlug: string) => {
    const slug = normalizeSlug(shopSlug)
    if (!slug) return null
    const db = safeRead()
    const entries = Array.isArray(db.entries) ? db.entries : []
    const now = Date.now()
    for (const e of entries) {
      if (!e || typeof e !== 'object') continue
      if (!e.is_active) continue
      if (normalizeSlug(e.shop_slug) !== slug) continue
      if (!e.expires_at) continue
      const exp = e.expires_at ? Date.parse(String(e.expires_at)) : NaN
      if (Number.isFinite(exp) && exp <= now) continue
      return e
    }
    return null
  },

  deactivateByShopSlug: (params: { shopSlug: string; mode?: 'all' | 'stable' | 'temp'; keepId?: string }) => {
    const slug = normalizeSlug(params.shopSlug)
    if (!slug) return
    const mode = params.mode || 'all'
    const keepId = safeString(params.keepId || '')
    const db = safeRead()
    const entries = Array.isArray(db.entries) ? db.entries : []
    let changed = false
    for (const e of entries) {
      if (!e || typeof e !== 'object') continue
      if (!e.is_active) continue
      if (normalizeSlug(e.shop_slug) !== slug) continue
      if (keepId && safeString((e as any).id) === keepId) continue
      const isStable = !e.expires_at
      if (mode === 'stable' && !isStable) continue
      if (mode === 'temp' && isStable) continue
      ;(e as any).is_active = false
      changed = true
    }
    if (!changed) return
    db.entries = entries
    safeWrite(db)
  },
}
