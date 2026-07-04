import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

type LocalUser = {
  id: string
  email: string
  passwordHash: string
  name: string
  phone?: string | null
  createdAt: string
}

type LocalSession = {
  token: string
  userId: string
  createdAt: string
  expiresAt: string
}

type LocalShop = {
  id: string
  userId: string
  name: string
  slug: string
  category: string
  status: 'pending' | 'approved' | 'rejected'
  logo_url?: string | null
  primary_color?: string | null
  secondary_color?: string | null
  open_time?: string | null
  close_time?: string | null
  timezone?: string | null
  createdAt: string
  updatedAt: string
}

type LocalPlusVendor = {
  id: string
  kind: 'shop' | 'provider'
  name: string
  category: string
  slug?: string
  lat: number
  lng: number
  status: string
  live: boolean
  voicePitch: string
  voiceAudio: string | null
  avatar: string
  approvalStatus: 'pending' | 'approved' | 'rejected'
  ownerEmail: string | null
  ownerName?: string | null
  userId?: string | null
  trade?: string | null
  phone?: string | null
  city?: string | null
  country?: string | null
  isMobile?: boolean
  localPin?: string | null
  services?: string[]
  coverage?: string[]
  portfolio?: string[]
  createdAt: string
  updatedAt: string
}

type LocalSyncDb = {
  users: LocalUser[]
  sessions: LocalSession[]
  shops: LocalShop[]
  localPlusVendors: LocalPlusVendor[]
}

const DATA_DIR = path.resolve(process.cwd(), 'server', 'data')
const DB_PATH = path.resolve(DATA_DIR, 'local-sync.json')

const ensureDir = () => {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  } catch {
  }
}

const nowIso = () => new Date().toISOString()

const normalizeEmail = (value: any) => String(value || '').trim().toLowerCase()
const keepNonEmptyString = (nextValue: any, prevValue: any) => {
  const next = String(nextValue || '').trim()
  if (next) return next
  const prev = String(prevValue || '').trim()
  return prev || null
}
const keepStringArray = (nextValue: any, prevValue: any) => {
  const next = Array.isArray(nextValue) ? nextValue.map((x: any) => String(x || '').trim()).filter(Boolean) : []
  if (next.length) return next
  const prev = Array.isArray(prevValue) ? prevValue.map((x: any) => String(x || '').trim()).filter(Boolean) : []
  return prev
}
const getExampleDomainAliases = (email: string): Set<string> => {
  const e = normalizeEmail(email)
  const out = new Set<string>()
  if (!e) return out
  out.add(e)
  const at = e.lastIndexOf('@')
  if (at <= 0) return out
  const localPart = e.slice(0, at)
  const domain = e.slice(at + 1)
  if (domain === 'example.com') out.add(`${localPart}@exemple.com`)
  if (domain === 'exemple.com') out.add(`${localPart}@example.com`)
  return out
}

const emailsMatch = (a: string, b: string): boolean => {
  const A = getExampleDomainAliases(a)
  const B = getExampleDomainAliases(b)
  if (!A.size || !B.size) return false
  for (const x of A) {
    if (B.has(x)) return true
  }
  return false
}

const safeRead = (): LocalSyncDb => {
  ensureDir()
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf8')
    const parsed = raw ? JSON.parse(raw) : null
    const db = parsed && typeof parsed === 'object' ? parsed : null
    return {
      users: Array.isArray(db?.users) ? db.users : [],
      sessions: Array.isArray(db?.sessions) ? db.sessions : [],
      shops: Array.isArray(db?.shops) ? db.shops : [],
      localPlusVendors: Array.isArray(db?.localPlusVendors) ? db.localPlusVendors : [],
    }
  } catch {
    return { users: [], sessions: [], shops: [], localPlusVendors: [] }
  }
}

const safeWrite = (db: LocalSyncDb) => {
  ensureDir()
  const tmp = `${DB_PATH}.tmp`
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2), 'utf8')
  fs.renameSync(tmp, DB_PATH)
}

const slugify = (value: any) => {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64)
}

const ensureUniqueSlug = (base: string, existing: Set<string>) => {
  let s = base
  if (!s) s = `boutique-${Date.now()}`
  if (!existing.has(s)) return s
  let i = 2
  while (existing.has(`${s}-${i}`)) i += 1
  return `${s}-${i}`
}

const hashPassword = (password: string) => {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.pbkdf2Sync(password, salt, 120000, 32, 'sha256').toString('hex')
  return `${salt}:${hash}`
}

const verifyPassword = (password: string, stored: string) => {
  const [salt, hash] = String(stored || '').split(':')
  if (!salt || !hash) return false
  const calc = crypto.pbkdf2Sync(password, salt, 120000, 32, 'sha256').toString('hex')
  return crypto.timingSafeEqual(Buffer.from(calc, 'hex'), Buffer.from(hash, 'hex'))
}

export const localSyncStore = {
  normalizeEmail,

  registerUser: (input: { email: string; password: string; name?: string; phone?: string | null }) => {
    const email = normalizeEmail(input.email)
    const password = String(input.password || '')
    const name = String(input.name || '').trim() || email.split('@')[0] || 'Utilisateur'
    const phone = String(input.phone || '').trim()
    if (!email || !password) throw new Error('Email et mot de passe requis')

    const db = safeRead()
    const exists = db.users.find((u) => emailsMatch(u.email, email))
    if (exists) return exists

    const user: LocalUser = {
      id: `u_${crypto.randomBytes(12).toString('hex')}`,
      email,
      passwordHash: hashPassword(password),
      name,
      phone: phone || null,
      createdAt: nowIso(),
    }

    db.users.push(user)
    safeWrite(db)
    return user
  },

  loginUser: (input: { email: string; password: string }) => {
    const email = normalizeEmail(input.email)
    const password = String(input.password || '')
    if (!email || !password) throw new Error('Email et mot de passe requis')
    const db = safeRead()
    const user = db.users.find((u) => emailsMatch(u.email, email))
    if (!user || !verifyPassword(password, user.passwordHash)) return null
    return user
  },

  createSession: (userId: string, ttlHours = 24 * 14) => {
    const db = safeRead()
    const createdAt = nowIso()
    const expiresAt = new Date(Date.now() + ttlHours * 3600 * 1000).toISOString()
    const session: LocalSession = {
      token: `t_${crypto.randomBytes(24).toString('hex')}`,
      userId,
      createdAt,
      expiresAt,
    }
    db.sessions = db.sessions.filter((s) => new Date(s.expiresAt).getTime() > Date.now())
    db.sessions.push(session)
    safeWrite(db)
    return session
  },

  getUserByToken: (token: string) => {
    const t = String(token || '').trim()
    if (!t) return null
    const db = safeRead()
    const session = db.sessions.find((s) => s.token === t)
    if (!session) return null
    if (new Date(session.expiresAt).getTime() <= Date.now()) return null
    const user = db.users.find((u) => u.id === session.userId)
    return user || null
  },

  createShop: (userId: string, input: { name: string; category?: string; slug?: string }) => {
    const name = String(input.name || '').trim()
    const category = String(input.category || 'general').trim()
    if (!name) throw new Error('Nom boutique requis')

    const db = safeRead()
    const existingSlugs = new Set(db.shops.map((s) => s.slug))
    const base = slugify(input.slug || name)
    const slug = ensureUniqueSlug(base, existingSlugs)

    const shop: LocalShop = {
      id: `s_${crypto.randomBytes(12).toString('hex')}`,
      userId,
      name,
      slug,
      category,
      status: 'pending',
      createdAt: nowIso(),
      updatedAt: nowIso(),
    }
    db.shops.push(shop)
    safeWrite(db)
    return shop
  },

  listMyShops: (userId: string) => {
    const db = safeRead()
    return db.shops
      .filter((s) => s.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  },

  listAllShops: () => {
    const db = safeRead()
    return db.shops
      .slice()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  },

  listAllUsers: () => {
    const db = safeRead()
    return db.users
      .slice()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  },

  updateShopStatus: (id: string, status: 'pending' | 'approved' | 'rejected') => {
    const shopId = String(id || '').trim()
    if (!shopId) throw new Error('Shop id requis')
    const nextStatus = String(status || '').trim().toLowerCase() as any
    if (nextStatus !== 'pending' && nextStatus !== 'approved' && nextStatus !== 'rejected') {
      throw new Error('Statut invalide')
    }
    const db = safeRead()
    const idx = db.shops.findIndex((s) => s.id === shopId)
    if (idx < 0) throw new Error('Boutique non trouvée')
    db.shops[idx] = { ...db.shops[idx], status: nextStatus, updatedAt: nowIso() }
    safeWrite(db)
    return db.shops[idx]
  },

  updateShopLogoBySlug: (slug: string, logoUrl: string | null) => {
    const s = String(slug || '').trim()
    if (!s) throw new Error('Slug requis')
    const db = safeRead()
    const idx = db.shops.findIndex((x) => String(x?.slug || '').trim() === s)
    if (idx < 0) throw new Error('Boutique non trouvée')
    db.shops[idx] = { ...db.shops[idx], logo_url: logoUrl ? String(logoUrl) : null, updatedAt: nowIso() }
    safeWrite(db)
    return db.shops[idx]
  },

  updateMyShopBySlug: (userId: string, slug: string, patch: any) => {
    const uid = String(userId || '').trim()
    const s = String(slug || '').trim()
    if (!uid) throw new Error('User id requis')
    if (!s) throw new Error('Slug requis')
    const p = patch && typeof patch === 'object' ? patch : {}
    const name = p.name === undefined ? undefined : String(p.name || '').trim()
    const category = p.category === undefined ? undefined : String(p.category || '').trim()
    const logoUrl = p.logo_url === undefined ? undefined : (p.logo_url === null ? null : String(p.logo_url || '').trim())
    const primary = p.primary_color === undefined ? undefined : String(p.primary_color || '').trim()
    const secondary = p.secondary_color === undefined ? undefined : String(p.secondary_color || '').trim()
    const openTime = p.open_time === undefined ? undefined : (p.open_time === null ? null : String(p.open_time || '').trim())
    const closeTime = p.close_time === undefined ? undefined : (p.close_time === null ? null : String(p.close_time || '').trim())
    const timezone = p.timezone === undefined ? undefined : (p.timezone === null ? null : String(p.timezone || '').trim())
    if (name !== undefined && !name) throw new Error('Nom boutique requis')
    if (category !== undefined && !category) throw new Error('Catégorie invalide')
    const isTime = (v: any) => {
      const s = String(v || '').trim()
      if (!s) return false
      return /^\d{2}:\d{2}$/.test(s)
    }
    if (openTime !== undefined && openTime !== null && openTime && !isTime(openTime)) throw new Error('Heure ouverture invalide')
    if (closeTime !== undefined && closeTime !== null && closeTime && !isTime(closeTime)) throw new Error('Heure fermeture invalide')
    const db = safeRead()
    const idx = db.shops.findIndex((x) => String(x?.slug || '').trim() === s)
    if (idx < 0) throw new Error('Boutique non trouvée')
    if (String(db.shops[idx].userId || '') !== uid) throw new Error('Forbidden')
    const next: any = { ...db.shops[idx], updatedAt: nowIso() }
    if (name !== undefined) next.name = name
    if (category !== undefined) next.category = category
    if (logoUrl !== undefined) next.logo_url = logoUrl
    if (primary !== undefined) next.primary_color = primary || null
    if (secondary !== undefined) next.secondary_color = secondary || null
    if (openTime !== undefined) next.open_time = openTime === '' ? null : openTime
    if (closeTime !== undefined) next.close_time = closeTime === '' ? null : closeTime
    if (timezone !== undefined) next.timezone = timezone === '' ? null : timezone
    db.shops[idx] = next
    safeWrite(db)
    return db.shops[idx]
  },

  getShopBySlug: (slug: string) => {
    const s = String(slug || '').trim()
    if (!s) return null
    const db = safeRead()
    return db.shops.find((x) => x.slug === s) || null
  },

  listLocalPlusVendors: () => {
    const db = safeRead()
    return db.localPlusVendors
      .slice()
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  },

  upsertLocalPlusVendor: (input: any, ownerEmail: string | null) => {
    const v = input && typeof input === 'object' ? input : {}
    const idRaw = v.id
    const id = String(idRaw ?? '').trim() || `lp_${crypto.randomBytes(12).toString('hex')}`
    const kindRaw = String(v.kind || 'shop').trim().toLowerCase()
    const kind: 'shop' | 'provider' = kindRaw === 'provider' || kindRaw === 'service' ? 'provider' : 'shop'
    const name = String(v.name || '').trim() || (kind === 'provider' ? 'Prestataire' : 'Boutique')
    const category = String(v.category || 'general').trim() || 'general'
    const lat = Number(v.lat)
    const lng = Number(v.lng)
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) throw new Error('Position invalide')

    const status = String(v.status || 'open')
    const live = Boolean(v.live)
    const voicePitch = String(v.voicePitch || '')
    const voiceAudio = v.voiceAudio ? String(v.voiceAudio) : null
    const avatar = String(v.avatar || '')
    const slug = String(v.slug || '').trim() || undefined
    const rawApproval = String(v.approvalStatus || v.approval_status || 'pending').trim().toLowerCase()
    const approvalStatus: 'pending' | 'approved' | 'rejected' = rawApproval === 'approved' || rawApproval === 'rejected' ? rawApproval : 'pending'

    const now = nowIso()
    const db = safeRead()
    const idx = db.localPlusVendors.findIndex((x) => String(x.id) === id)
    const prev = idx >= 0 ? db.localPlusVendors[idx] : null

    const record: LocalPlusVendor = {
      id,
      kind,
      name,
      category,
      slug,
      lat,
      lng,
      status,
      live,
      voicePitch,
      voiceAudio,
      avatar,
      approvalStatus,
      ownerEmail: ownerEmail ? normalizeEmail(ownerEmail) : prev?.ownerEmail || null,
      ownerName: keepNonEmptyString(v.ownerName, prev?.ownerName),
      userId: keepNonEmptyString(v.userId ?? v.user_id, prev?.userId),
      trade: keepNonEmptyString(v.trade, prev?.trade),
      phone: keepNonEmptyString(v.phone, prev?.phone),
      city: keepNonEmptyString(v.city, prev?.city),
      country: keepNonEmptyString(v.country, prev?.country),
      isMobile: Boolean(v.isMobile ?? v.is_mobile),
      localPin: keepNonEmptyString(v.localPin, prev?.localPin),
      services: keepStringArray(v.services, prev?.services),
      coverage: keepStringArray(v.coverage, prev?.coverage),
      portfolio: keepStringArray(v.portfolio, prev?.portfolio),
      createdAt: idx >= 0 ? db.localPlusVendors[idx].createdAt : now,
      updatedAt: now,
    }

    if (idx >= 0) db.localPlusVendors[idx] = { ...db.localPlusVendors[idx], ...record }
    else db.localPlusVendors.push(record)
    safeWrite(db)
    return record
  },
}

export type { LocalShop }
