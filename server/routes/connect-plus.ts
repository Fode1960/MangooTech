import { Router } from 'express'
import { createClient } from '@supabase/supabase-js'
import { connectPlusStore } from '../services/connectPlusStore'
import { connectPlusIssuer } from '../services/connectPlusIssuer'
import { localSyncStore } from '../services/localSyncStore'
import { findActiveByEmail as findUserIdentityByEmail, findActiveByPin as findUserIdentityByPin, upsertActive as upsertUserIdentity } from '../services/connectPlusUserIdentityStore'

const router = Router()

const supabaseUrl = String(process.env.SUPABASE_URL || '').trim()
const supabaseServiceKey = String(process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim()
const supabase = supabaseUrl && supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null

const safeString = (v: any) => String(v || '').trim()
const safeLower = (v: any) => safeString(v).toLowerCase()
const normalizePin = (v: any) => String(v || '').replace(/[^\d]/g, '').slice(0, 6)

const USERS_TABLE = 'connect_plus_user_identities'

function isMissingTable(err: any) {
  const msg = String(err?.message || err || '').toLowerCase()
  return msg.includes('does not exist') || msg.includes('relation') || msg.includes('schema cache')
}

function isProbablyEmail(value: string) {
  const v = safeLower(value)
  const at = v.indexOf('@')
  const dot = v.lastIndexOf('.')
  return Boolean(v && at > 0 && dot > at + 1 && dot < v.length - 1)
}

function randomPin(len: number) {
  const L = Math.max(4, Math.min(6, Math.floor(len || 6)))
  const min = Math.pow(10, L - 1)
  const max = Math.pow(10, L) - 1
  const n = Math.floor(min + Math.random() * (max - min + 1))
  return String(n)
}

async function ensureUserIdentitySupabase(params: { email: string; pinLen: number }) {
  const email = safeLower(params.email)
  const pinLen = Math.max(4, Math.min(6, Math.floor(params.pinLen || 6)))
  if (!supabase) return null

  const { data: existing, error: existingErr } = await supabase
    .from(USERS_TABLE)
    .select('*')
    .ilike('user_email', email)
    .eq('is_active', true)
    .maybeSingle()
  if (existingErr) {
    if (isMissingTable(existingErr)) return null
    throw existingErr
  }
  if (existing?.pin) return { email, pin: String(existing.pin) }

  for (let i = 0; i < 12; i++) {
    const pin = randomPin(pinLen)
    const { data, error } = await supabase
      .from(USERS_TABLE)
      .insert({ user_email: email, pin, is_active: true })
      .select('*')
      .single()
    if (!error && data?.pin) return { email, pin: String(data.pin) }
  }
  return null
}

async function resolveUserIdentitySupabaseByPin(params: { pin: string }) {
  const pin = normalizePin(params.pin)
  if (!pin) return null
  if (!supabase) return null
  const { data, error } = await supabase
    .from(USERS_TABLE)
    .select('*')
    .eq('pin', pin)
    .eq('is_active', true)
  if (error) {
    if (isMissingTable(error)) return null
    throw error
  }
  const rows = Array.isArray(data) ? data : []
  if (rows.length > 1) {
    const e: any = new Error('Code PIN ambigu')
    e.code = 'AMBIGUOUS_USER_PIN'
    throw e
  }
  const r: any = rows[0] || null
  const email = safeLower(r?.user_email)
  const p = normalizePin(r?.pin)
  if (!email || !p) return null
  return { email, pin: p }
}

async function ensureUserIdentity(params: { email: string; pinLen: number }) {
  const email = safeLower(params.email)
  const pinLen = Math.max(4, Math.min(6, Math.floor(params.pinLen || 6)))
  if (!isProbablyEmail(email)) throw new Error('Email invalide')

  try {
    const row = await ensureUserIdentitySupabase({ email, pinLen })
    if (row?.pin) {
      upsertUserIdentity(email, row.pin)
      return row
    }
  } catch (e: any) {
    if (!isMissingTable(e)) {
      const local = findUserIdentityByEmail(email)
      if (local?.pin) return { email, pin: String(local.pin) }
    }
  }

  const existing = findUserIdentityByEmail(email)
  if (existing?.pin) return { email, pin: String(existing.pin) }

  for (let i = 0; i < 12; i++) {
    const pin = randomPin(pinLen)
    const clash = findUserIdentityByPin(pin)
    if (clash) continue
    const saved = upsertUserIdentity(email, pin)
    if (saved?.pin) return { email, pin: String(saved.pin) }
  }

  throw new Error('Impossible de générer un PIN')
}

function getExampleDomainAliases(email: string): Set<string> {
  const e = safeLower(email)
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

function emailsMatch(a: string, b: string): boolean {
  const A = getExampleDomainAliases(a)
  const B = getExampleDomainAliases(b)
  if (!A.size || !B.size) return false
  for (const x of A) {
    if (B.has(x)) return true
  }
  return false
}

function getOrigin(req: any): string {
  try {
    const origin = safeString(req?.headers?.origin)
    if (origin) return origin
  } catch {
  }
  try {
    const host = safeString(req?.headers?.host || req?.hostname)
    if (!host) return ''
    const proto = safeString(req?.headers?.['x-forwarded-proto'] || req?.protocol) || 'http'
    return `${proto}://${host}`
  } catch {
    return ''
  }
}

function isPrivateIpv4(host: string): boolean {
  const h = safeString(host)
  const parts = h.split('.').map((x) => Number(x))
  if (parts.length !== 4) return false
  if (parts.some((n) => !Number.isFinite(n))) return false
  const [a, b] = parts
  if (a === 10) return true
  if (a === 192 && b === 168) return true
  if (a === 172 && b >= 16 && b <= 31) return true
  return false
}

function getOriginHost(origin: string): string {
  const o = safeString(origin).toLowerCase()
  if (!o) return ''
  try {
    const u = new URL(o)
    return safeString(u.hostname).toLowerCase()
  } catch {
    return ''
  }
}

function isTrustedDevRequest(req: any): boolean {
  try {
    const hostHeader = safeLower(req?.hostname || req?.headers?.host)
    const origin = safeLower(req?.headers?.origin)
    const originHost = getOriginHost(origin)
    const hostOnly = hostHeader.includes(':') ? hostHeader.split(':')[0] : hostHeader
    const isLocalhost =
      hostHeader.includes('localhost') ||
      hostHeader.includes('127.0.0.1') ||
      origin.startsWith('http://localhost') ||
      origin.startsWith('http://127.0.0.1') ||
      originHost === 'localhost' ||
      originHost === '127.0.0.1' ||
      originHost === '::1'
    const isLocal = isLocalhost || isPrivateIpv4(hostOnly) || isPrivateIpv4(originHost)
    if (!isLocal) return false
    const env = safeLower(process.env.NODE_ENV)
    if (env === 'production') return true
    return true
  } catch {
  }
  return false
}

function readBearerToken(req: any): string {
  const h = safeString(req?.headers?.authorization)
  if (!h.toLowerCase().startsWith('bearer ')) return ''
  return h.slice(7).trim()
}

async function canIssueForShop(params: { shopSlug: string; token: string; allowDevBypass: boolean; ownerEmailHint: string }) {
  const slug = safeString(params.shopSlug)
  if (!slug) return { ok: false as const, status: 400, error: 'Slug manquant' }

  let userEmail = ''
  if (params.token && !params.allowDevBypass) {
    if (!supabase) return { ok: false as const, status: 503, error: 'Supabase non configuré' }
    const userRes: any = await supabase.auth.getUser(params.token)
    userEmail = safeLower(userRes?.data?.user?.email)
    if (!userEmail) return { ok: false as const, status: 401, error: 'Token invalide' }
  } else if (!params.allowDevBypass) {
    return { ok: false as const, status: 401, error: 'Missing Authorization bearer token' }
  }

  const actorEmail = userEmail || safeLower(params.ownerEmailHint)
  if (!actorEmail && !params.allowDevBypass) return { ok: false as const, status: 401, error: 'Email vendeur manquant' }

  if (!supabase) {
    if (!params.allowDevBypass) return { ok: false as const, status: 503, error: 'Supabase non configuré' }
    const ls = localSyncStore.getShopBySlug(slug) as any
    if (!ls?.slug) return { ok: false as const, status: 404, error: 'Boutique non trouvée' }
    if (actorEmail) {
      try {
        const users = localSyncStore.listAllUsers()
        const u = users.find((x: any) => String(x?.id || '') === String(ls?.userId || '')) || null
        const ownerEmail = safeLower(u?.email)
        if (ownerEmail && !emailsMatch(ownerEmail, actorEmail)) return { ok: false as const, status: 403, error: 'Forbidden' }
      } catch {
      }
    }
    return { ok: true as const, shop: { slug } }
  }

  const selectShop = async (cols: string) => {
    return await supabase.from('shops').select(cols).eq('slug', slug).maybeSingle()
  }

  let shopRes: any = await selectShop('id,slug,owner_email,contact_email,email,status')
  if (shopRes?.error) {
    const msg = safeLower(shopRes?.error?.message || '')
    const missingOwnerEmail =
      (msg.includes('could not find') && msg.includes('owner_email')) ||
      (msg.includes('owner_email') && (msg.includes('does not exist') || msg.includes('column') || msg.includes('schema cache')))
    const missingContactEmail =
      (msg.includes('could not find') && msg.includes('contact_email')) ||
      (msg.includes('contact_email') && (msg.includes('does not exist') || msg.includes('column') || msg.includes('schema cache')))

    if (missingOwnerEmail && missingContactEmail) shopRes = await selectShop('id,slug,email,status')
    else if (missingOwnerEmail) shopRes = await selectShop('id,slug,contact_email,email,status')
    else if (missingContactEmail) shopRes = await selectShop('id,slug,owner_email,email,status')
  }

  if (shopRes?.error) {
    if (params.allowDevBypass) return { ok: true as const, shop: { slug } }
    return { ok: false as const, status: 500, error: String(shopRes.error.message || 'Erreur serveur') }
  }
  const shop = shopRes?.data
  if (!shop?.slug) {
    if (!params.allowDevBypass) return { ok: false as const, status: 404, error: 'Boutique non trouvée' }
    const ls = localSyncStore.getShopBySlug(slug) as any
    if (!ls?.slug) return { ok: true as const, shop: { slug } }
    if (actorEmail) {
      try {
        const users = localSyncStore.listAllUsers()
        const u = users.find((x: any) => String(x?.id || '') === String(ls?.userId || '')) || null
        const ownerEmail = safeLower(u?.email)
        if (ownerEmail && !emailsMatch(ownerEmail, actorEmail)) return { ok: false as const, status: 403, error: 'Forbidden' }
      } catch {
      }
    }
    return { ok: true as const, shop: { slug } }
  }

  if (actorEmail) {
    const candidates = [
      safeLower(shop?.owner_email),
      safeLower(shop?.email),
      safeLower(shop?.contact_email),
    ].filter(Boolean)
    const ok = candidates.some((c) => emailsMatch(c, actorEmail))
    if (!ok) return { ok: false as const, status: 403, error: 'Forbidden' }
  } else if (!params.allowDevBypass) {
    return { ok: false as const, status: 401, error: 'Email vendeur manquant' }
  }

  return { ok: true as const, shop }
}

async function resolveEntrySupabase(params: { pin?: string; token?: string }) {
  if (!supabase) throw new Error('Supabase non configuré')
  const pin = normalizePin(params.pin)
  const token = safeString(params.token)
  if (!pin && !token) return null

  const isUnexpired = (row: any) => {
    if (!row?.token) return false
    if (!row.expires_at) return true
    const exp = Date.parse(String(row.expires_at))
    if (!Number.isFinite(exp)) return true
    return exp > Date.now()
  }

  if (token) {
    const r: any = await supabase
      .from('connect_plus_entries')
      .select('id,shop_slug,pin,token,is_active,created_at,expires_at')
      .eq('is_active', true)
      .eq('token', token)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (r?.error) throw new Error(String(r.error.message || 'Erreur Supabase'))
    const row = r?.data
    if (!row?.token) return null
    if (!isUnexpired(row)) return null
    return row
  }

  const r: any = await supabase
    .from('connect_plus_entries')
    .select('id,shop_slug,pin,token,is_active,created_at,expires_at')
    .eq('is_active', true)
    .eq('pin', pin)
    .order('created_at', { ascending: false })
    .limit(10)
  if (r?.error) throw new Error(String(r.error.message || 'Erreur Supabase'))
  const rows = Array.isArray(r?.data) ? r.data : []
  const valid = rows.filter(isUnexpired)
  if (!valid.length) return null
  if (valid.length > 1) {
    const err: any = new Error('Code PIN ambigu, régénérez un nouveau code')
    err.code = 'AMBIGUOUS_PIN'
    throw err
  }
  return valid[0]
}

router.post('/issue', async (req, res) => {
  try {
    const allowDevBypass = isTrustedDevRequest(req)
    const token = allowDevBypass ? '' : readBearerToken(req)
    const shopSlug = safeString(req.body?.shopSlug || req.body?.slug)
    const ownerEmailHint = safeString(req.body?.ownerEmail || req.body?.email)
    const pinLen = 6
    const expiresHours = req.body?.expiresHours === null || req.body?.expiresHours === undefined ? 72 : Math.max(1, Math.floor(Number(req.body?.expiresHours || 72)))

    const perm = await canIssueForShop({ shopSlug, token, allowDevBypass, ownerEmailHint })
    if (!perm.ok) return res.status(perm.status).json({ success: false, error: perm.error })

    const origin = getOrigin(req)
    const issued = await connectPlusIssuer.issueNew({ shopSlug, origin, pinLen, expiresHours })
    res.json({ success: true, ...issued })
  } catch (e: any) {
    res.status(500).json({ success: false, error: String(e?.message || 'Erreur serveur') })
  }
})

router.post('/ensure', async (req, res) => {
  try {
    const allowDevBypass = isTrustedDevRequest(req)
    const token = allowDevBypass ? '' : readBearerToken(req)
    const shopSlug = safeString(req.body?.shopSlug || req.body?.slug)
    const ownerEmailHint = safeString(req.body?.ownerEmail || req.body?.email)
    const pinLen = 6
    const expiresHours = req.body?.expiresHours === null || req.body?.expiresHours === undefined ? 72 : Math.max(1, Math.floor(Number(req.body?.expiresHours || 72)))

    const perm = await canIssueForShop({ shopSlug, token, allowDevBypass, ownerEmailHint })
    if (!perm.ok) return res.status(perm.status).json({ success: false, error: perm.error })

    const origin = getOrigin(req)
    const issued = await connectPlusIssuer.ensure({ shopSlug, origin, pinLen, expiresHours })
    res.json({ success: true, ...issued })
  } catch (e: any) {
    res.status(500).json({ success: false, error: String(e?.message || 'Erreur serveur') })
  }
})

router.get('/current', async (req, res) => {
  try {
    const allowDevBypass = isTrustedDevRequest(req)
    const token = allowDevBypass ? '' : readBearerToken(req)
    const shopSlug = safeString((req.query as any)?.shopSlug || (req.query as any)?.slug)
    const ownerEmailHint = safeString((req.query as any)?.ownerEmail || (req.query as any)?.email)

    const perm = await canIssueForShop({ shopSlug, token, allowDevBypass, ownerEmailHint })
    if (!perm.ok) return res.status(perm.status).json({ success: false, error: perm.error })

    const origin = getOrigin(req)
    const current = await connectPlusIssuer.getCurrent({ shopSlug, origin })
    if (!current) return res.status(404).json({ success: false, error: 'Aucun code' })
    res.json({ success: true, ...current })
  } catch (e: any) {
    res.status(500).json({ success: false, error: String(e?.message || 'Erreur serveur') })
  }
})

router.post('/stable/ensure', async (req, res) => {
  try {
    const allowDevBypass = isTrustedDevRequest(req)
    const token = allowDevBypass ? '' : readBearerToken(req)
    const shopSlug = safeString(req.body?.shopSlug || req.body?.slug)
    const ownerEmailHint = safeString(req.body?.ownerEmail || req.body?.email)
    const pinLen = 6

    const perm = await canIssueForShop({ shopSlug, token, allowDevBypass, ownerEmailHint })
    if (!perm.ok) return res.status(perm.status).json({ success: false, error: perm.error })

    const origin = getOrigin(req)
    const issued = await connectPlusIssuer.ensureStable({ shopSlug, origin, pinLen })
    res.json({ success: true, ...issued })
  } catch (e: any) {
    const allowDevBypass = isTrustedDevRequest(req)
    const msg = String(e?.message || 'Erreur serveur')
    const details = allowDevBypass ? String(e?.stack || '') : undefined
    res.status(500).json({ success: false, error: msg, details })
  }
})

router.post('/stable/change', async (req, res) => {
  try {
    const allowDevBypass = isTrustedDevRequest(req)
    const token = allowDevBypass ? '' : readBearerToken(req)
    const shopSlug = safeString(req.body?.shopSlug || req.body?.slug)
    const ownerEmailHint = safeString(req.body?.ownerEmail || req.body?.email)
    const pinLen = 6

    const perm = await canIssueForShop({ shopSlug, token, allowDevBypass, ownerEmailHint })
    if (!perm.ok) return res.status(perm.status).json({ success: false, error: perm.error })

    const origin = getOrigin(req)
    const issued = await connectPlusIssuer.changeStable({ shopSlug, origin, pinLen })
    res.json({ success: true, ...issued })
  } catch (e: any) {
    res.status(500).json({ success: false, error: String(e?.message || 'Erreur serveur') })
  }
})

type RateState = { windowStart: number; count: number }
const rateByIp = new Map<string, RateState>()
const resolveRateLimitOk = (req: any) => {
  const ip = safeString(req?.ip || req?.headers?.['x-forwarded-for'] || req?.socket?.remoteAddress)
  const key = ip || 'unknown'
  const now = Date.now()
  const windowMs = 60_000
  const max = 90
  const prev = rateByIp.get(key)
  if (!prev || now - prev.windowStart >= windowMs) {
    rateByIp.set(key, { windowStart: now, count: 1 })
    return true
  }
  if (prev.count >= max) return false
  prev.count += 1
  return true
}

router.get('/resolve', async (req, res) => {
  try {
    if (!resolveRateLimitOk(req)) {
      return res.status(429).json({ success: false, error: 'Trop de tentatives, réessayez plus tard' })
    }
    const pin = normalizePin((req.query as any)?.pin)
    const token = safeString((req.query as any)?.token)

    if (pin === '000000') {
      const qs = new URLSearchParams()
      qs.set('role', 'client')
      qs.set('roomId', 'support:mangoo')
      qs.set('ui', 'simple')
      qs.set('call', 'audio')
      qs.set('autoCall', '1')
      return res.json({ success: true, kind: 'support', pin, redirect: `/webrtc?${qs.toString()}` })
    }

    let row: any = null
    if (token) {
      let supaRow: any = null
      if (supabase) {
        try {
          supaRow = await resolveEntrySupabase({ token })
        } catch {
          supaRow = null
        }
      }
      row = supaRow || connectPlusStore.findActiveByToken(token)
    } else {
      let supaRow: any = null
      if (supabase) {
        try {
          supaRow = await resolveEntrySupabase({ pin })
        } catch (e: any) {
          if (safeString(e?.code) === 'AMBIGUOUS_PIN') {
            return res.status(409).json({ success: false, error: String(e?.message || 'Code PIN ambigu') })
          }
          supaRow = null
        }
      }
      row = supaRow || connectPlusStore.findActiveByPin(pin)
    }
    if (!row) return res.status(404).json({ success: false, error: 'Code invalide' })

    const slug = safeString(row.shop_slug)
    if (!slug) return res.status(404).json({ success: false, error: 'Boutique introuvable' })
    res.json({ success: true, shopSlug: slug, redirect: `/shop/${encodeURIComponent(slug)}?view=client` })
  } catch (e: any) {
    res.status(500).json({ success: false, error: String(e?.message || 'Erreur serveur') })
  }
})

router.get('/resolve-id', async (req, res) => {
  try {
    if (!resolveRateLimitOk(req)) {
      return res.status(429).json({ success: false, error: 'Trop de tentatives, réessayez plus tard' })
    }
    const pin = normalizePin((req.query as any)?.pin)
    if (pin.length < 4) return res.status(400).json({ success: false, error: 'PIN invalide' })

    if (pin === '000000') {
      return res.json({ success: true, kind: 'support', pin, roomId: 'support:mangoo' })
    }

    const localShopRow = connectPlusStore.findActiveByPin(pin)
    const localUserRow = findUserIdentityByPin(pin)
    if (localShopRow && localUserRow) return res.status(409).json({ success: false, error: 'Code PIN ambigu' })
    if (localUserRow) {
      const p = normalizePin((localUserRow as any)?.pin || pin)
      return res.json({ success: true, kind: 'client', pin: p, roomId: `client:${p}` })
    }
    if (localShopRow) {
      const slug = safeString((localShopRow as any)?.shop_slug)
      if (!slug) return res.status(404).json({ success: false, error: 'Boutique introuvable' })
      return res.json({ success: true, kind: 'shop', shopSlug: slug, roomId: `shop:${slug}` })
    }

    let shopRow: any = null
    if (supabase) {
      try {
        shopRow = await resolveEntrySupabase({ pin })
      } catch (e: any) {
        if (safeString(e?.code) === 'AMBIGUOUS_PIN') {
          return res.status(409).json({ success: false, error: String(e?.message || 'Code PIN ambigu') })
        }
        shopRow = null
      }
    }
    shopRow = shopRow || null

    let userRow: any = null
    if (supabase) {
      try {
        userRow = await resolveUserIdentitySupabaseByPin({ pin })
      } catch (e: any) {
        if (safeString(e?.code) === 'AMBIGUOUS_USER_PIN') {
          return res.status(409).json({ success: false, error: String(e?.message || 'Code PIN ambigu') })
        }
        userRow = null
      }
    }
    userRow = userRow || null

    if (shopRow && userRow) return res.status(409).json({ success: false, error: 'Code PIN ambigu' })
    if (!shopRow && !userRow) return res.status(404).json({ success: false, error: 'Code invalide' })

    if (userRow) {
      const p = normalizePin((userRow as any)?.pin || pin)
      return res.json({ success: true, kind: 'client', pin: p, roomId: `client:${p}` })
    }

    const slug = safeString((shopRow as any)?.shop_slug)
    if (!slug) return res.status(404).json({ success: false, error: 'Boutique introuvable' })
    return res.json({ success: true, kind: 'shop', shopSlug: slug, roomId: `shop:${slug}` })
  } catch (e: any) {
    res.status(500).json({ success: false, error: String(e?.message || 'Erreur serveur') })
  }
})

router.post('/user/stable/ensure', async (req, res) => {
  try {
    const allowDevBypass = isTrustedDevRequest(req)
    const token = allowDevBypass ? '' : readBearerToken(req)
    const email = safeLower(req.body?.email || '')
    const pinLen = req.body?.pinLen === undefined || req.body?.pinLen === null
      ? 6
      : Math.max(4, Math.min(6, Math.floor(Number(req.body?.pinLen))))

    if (!isProbablyEmail(email)) return res.status(400).json({ success: false, error: 'Email invalide' })

    if (!allowDevBypass && token && supabase) {
      try {
        const { data, error } = await supabase.auth.getUser(token)
        if (error) return res.status(401).json({ success: false, error: 'Non autorisé' })
        const authed = safeLower(data?.user?.email || '')
        if (!authed || authed !== email) return res.status(403).json({ success: false, error: 'Non autorisé' })
      } catch {
        return res.status(401).json({ success: false, error: 'Non autorisé' })
      }
    }

    const row = await ensureUserIdentity({ email, pinLen })
    const roomId = `client:${normalizePin(row.pin)}`
    res.json({ success: true, email: row.email, pin: row.pin, roomId })
  } catch (e: any) {
    res.status(500).json({ success: false, error: String(e?.message || 'Erreur serveur') })
  }
})

export default router
