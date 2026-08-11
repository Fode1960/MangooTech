import { Router } from 'express'
import { localSyncStore } from '../services/localSyncStore'
import { supabaseAdmin } from '../config/supabase'
import { findActiveByEmail as findUserIdentityByEmail, findActiveByPin as findUserIdentityByPin } from '../services/connectPlusUserIdentityStore'

const router = Router()

const isProd = String(process.env.NODE_ENV || '').trim().toLowerCase() === 'production'
const localSyncFlag = String(process.env.FF_LOCAL_SYNC || '').trim().toLowerCase()
const allowLocalSync = !isProd || localSyncFlag === '1' || localSyncFlag === 'true' || localSyncFlag === 'yes'

router.use((req, res, next) => {
  if (!allowLocalSync) {
    res.status(404).json({ success: false, error: 'Not found' })
    return
  }
  next()
})

const readToken = (req: any) => {
  const h = String(req.headers?.authorization || '')
  if (!h.toLowerCase().startsWith('bearer ')) return ''
  return h.slice(7).trim()
}

const normalizeEmail = (value: any) => String(value || '').trim().toLowerCase()
const normalizePin = (value: any) => String(value || '').replace(/[^\d]/g, '').slice(0, 6)
const isProbablyEmail = (value: any) => {
  const v = normalizeEmail(value)
  const at = v.indexOf('@')
  const dot = v.lastIndexOf('.')
  return Boolean(v && at > 0 && dot > at + 1 && dot < v.length - 1)
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
const emailsMatch = (a: any, b: any) => {
  const A = getExampleDomainAliases(String(a || ''))
  const B = getExampleDomainAliases(String(b || ''))
  if (!A.size || !B.size) return false
  for (const x of A) {
    if (B.has(x)) return true
  }
  return false
}

const parseLatLng = (value: any): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  const next = Number(value)
  return Number.isFinite(next) ? next : null
}

const normalizePhone = (value: any) => String(value || '').replace(/[^\d+]/g, '').replace(/(?!^)\+/g, '').trim()
const normalizePhoneDigits = (value: any) => normalizePhone(value).replace(/\D/g, '')
const providerScopedOwnerEmail = (phoneDigits: string, providerId: string) => {
  const digits = String(phoneDigits || '').replace(/\D/g, '').trim()
  const id = String(providerId || '').trim().replace(/[^a-zA-Z0-9]/g, '').slice(-18)
  if (!digits || digits.length < 8 || !id) return ''
  return `prestataire-${digits}-${id}@localplus.mangoo.tech`
}
const hiddenEmailPhoneDigits = (value: any) => {
  const email = normalizeEmail(value)
  const m = email.match(/^prestataire-([0-9]+)(?:-[a-z0-9]+)?@localplus\.mangoo\.tech$/i)
  return m ? String(m[1] || '').trim() : ''
}
const getResolvedVendorPhone = (vendor: any) => {
  const direct = String(vendor?.phone || '').trim()
  if (direct) return direct
  const inferredDigits = hiddenEmailPhoneDigits(vendor?.ownerEmail)
  return inferredDigits || ''
}

const phoneMatchMeta = (a: any, b: any) => {
  const A = normalizePhoneDigits(a)
  const B = normalizePhoneDigits(b)
  if (!A || !B) return { score: 0, suffixLen: 0 }
  if (A === B) return { score: 3, suffixLen: Math.min(A.length, B.length) }
  const minLen = Math.min(A.length, B.length)
  if (minLen < 4) return { score: 0, suffixLen: 0 }
  let i = 0
  while (i < minLen && A[A.length - 1 - i] === B[B.length - 1 - i]) i += 1
  if (i < 4) return { score: 0, suffixLen: i }
  if (i >= 10) return { score: 2, suffixLen: i }
  return { score: 1, suffixLen: i }
}
const findLocalUserByEmail = (users: any[], email: string) => {
  const target = normalizeEmail(email)
  if (!target) return null
  return users.find((u: any) => emailsMatch(u?.email, target)) || null
}

const getOwnedVendorsForEmail = (vendors: any[], email: string) => {
  const target = normalizeEmail(email)
  if (!target) return []
  return (Array.isArray(vendors) ? vendors : []).filter((v: any) => {
    const ownerEmail = normalizeEmail(v?.ownerEmail)
    return !!ownerEmail && emailsMatch(ownerEmail, target)
  })
}

const getPreferredPhoneForUser = (user: any, vendors: any[]) => {
  const direct = String(user?.phone || '').trim()
  if (direct) return direct
  const email = normalizeEmail(user?.email)
  if (!email) return ''
  const owned = getOwnedVendorsForEmail(vendors, email)
    .map((v: any) => ({ v, phone: getResolvedVendorPhone(v) }))
    .filter((item) => !!String(item.phone || '').trim())
    .sort((a, b) => new Date(String(b.v?.updatedAt || 0)).getTime() - new Date(String(a.v?.updatedAt || 0)).getTime())
  return String(owned[0]?.phone || '').trim()
}

const buildResolvedIdentityFromUser = (params: {
  user: any
  vendors: any[]
  shops: any[]
  preferredRole?: string
  matchedPhone?: string
}) => {
  const user = params.user || {}
  const vendors = Array.isArray(params.vendors) ? params.vendors : []
  const shops = Array.isArray(params.shops) ? params.shops : []
  const email = normalizeEmail(user?.email)
  if (!email) return null

  const ownedShops = shops.filter((s: any) => String(s?.userId || '').trim() === String(user?.id || '').trim())
  const ownedVendors = getOwnedVendorsForEmail(vendors, email)
  const ownedShopVendor = ownedVendors.find((v: any) => getNormalizedVendorKind(v) === 'shop') || null
  // Prioriser "Mangoo Répar" parmi les prestataires service (prestataire principal de la plateforme)
  const ownedProviderVendor = ownedVendors.find((v: any) => getNormalizedVendorKind(v) === 'service' && String(v?.name || '').trim() === 'Mangoo Répar')
    || ownedVendors.find((v: any) => getNormalizedVendorKind(v) === 'service')
    || null

  const requestedRole = String(params.preferredRole || '').trim().toLowerCase()
  const defaultRole = ownedShops.length || ownedShopVendor || ownedProviderVendor ? 'vendor' : 'client'
  const role = requestedRole === 'vendor' || requestedRole === 'client' ? requestedRole : defaultRole
  const vendorRef = role === 'vendor' ? (ownedShopVendor || ownedProviderVendor || null) : null
  const vendorKind = role === 'vendor'
    ? String(vendorRef ? getNormalizedVendorKind(vendorRef) : (ownedProviderVendor ? 'service' : 'shop'))
    : ''
  const phone = String(params.matchedPhone || getPreferredPhoneForUser(user, vendors) || '').trim()
  const identityPin = String(findUserIdentityByEmail(email)?.pin || '').trim()
  const name = String(
    user?.name ||
    user?.full_name ||
    user?.ownerName ||
    user?.owner_name ||
    (ownedShops[0]?.name || '') ||
    email.split('@')[0] ||
    'Utilisateur'
  ).trim()

  return {
    email,
    name,
    phone,
    role,
    roles: role === 'vendor' ? ['vendor', 'client'] : ['client'],
    pin: identityPin,
    vendorId: role === 'vendor' ? String(vendorRef?.id || '').trim() : '',
    vendorKind,
    vendorName: role === 'vendor'
      ? String(vendorRef?.name || ownedShops[0]?.name || name || 'Boutique').trim()
      : '',
    shopSlug: role === 'vendor'
      ? String(vendorRef?.slug || ownedShops[0]?.slug || '').trim()
      : '',
  }
}

const buildResolvedIdentityFromVendor = (vendor: any, preferredRole?: string) => {
  if (!vendor || typeof vendor !== 'object') return null
  const ownerEmail = normalizeEmail(vendor?.ownerEmail) || `shop${vendor?.id || 'guest'}@exemple.com`
  if (!ownerEmail) return null
  const role = String(preferredRole || '').trim().toLowerCase() === 'client' ? 'client' : 'vendor'
  const vendorKind = getNormalizedVendorKind(vendor)
  // AXE 1.5 : Pour une boutique, le nom affiché doit être celui du shop (ex: "DAN PC"),
  // pas le ownerName (ex: "Administrateur"). ownerName est le propriétaire, pas le commerce.
  const displayName = vendorKind === 'shop'
    ? (String(vendor?.name || vendor?.ownerName || ownerEmail.split('@')[0] || 'Utilisateur').trim())
    : (String(vendor?.ownerName || vendor?.name || ownerEmail.split('@')[0] || 'Utilisateur').trim())
  return {
    email: ownerEmail,
    name: displayName,
    phone: String(getResolvedVendorPhone(vendor) || '').trim(),
    role,
    roles: role === 'vendor' ? ['vendor', 'client'] : ['client'],
    pin: String(findUserIdentityByEmail(ownerEmail)?.pin || '').trim(),
    vendorId: role === 'vendor' ? String(vendor?.id || '').trim() : '',
    vendorKind: role === 'vendor' ? vendorKind : '',
    vendorName: role === 'vendor' ? String(vendor?.name || '').trim() : '',
    shopSlug: role === 'vendor' ? String(vendor?.slug || vendor?.shopSlug || vendor?.shop_slug || '').trim() : '',
  }
}

const isServiceCategory = (value: any) => {
  const s = String(value || '').trim().toLowerCase()
  if (!s) return false
  return s.includes('service') || s.includes('métier') || s.includes('metier')
}

const isServiceLikeVendor = (vendor: any) => {
  const rawKind = String(vendor?.kind || '').trim().toLowerCase()
  const rawShopSlug = String(vendor?.shopSlug || vendor?.shop_slug || '').trim()
  const categoryService = isServiceCategory(vendor?.category)
  const hasTrade = !!String(vendor?.trade || '').trim()
  const hasServices = Array.isArray(vendor?.services) && vendor.services.some((x: any) => String(x || '').trim())
  const hasCoverage = Array.isArray(vendor?.coverage) && vendor.coverage.some((x: any) => String(x || '').trim())
  const hasPortfolio = Array.isArray(vendor?.portfolio) && vendor.portfolio.some((x: any) => String(x || '').trim())
  const isMobileService = vendor?.isMobile === true
  const hasServiceSignals = categoryService || hasTrade || hasServices || hasCoverage || hasPortfolio || isMobileService
  if (rawKind === 'shop') return false
  if (rawShopSlug) return false
  if ((rawKind === 'provider' || rawKind === 'service') && !hasServiceSignals) return false
  if (rawKind === 'provider' || rawKind === 'service') return true
  if (hasServiceSignals) return true
  return false
}

const getNormalizedVendorKind = (vendor: any) => (isServiceLikeVendor(vendor) ? 'service' : 'shop')

const getNormalizedApprovalStatus = (vendor: any) => {
  const raw = String(vendor?.approvalStatus || vendor?.approval_status || vendor?.status || '').trim().toLowerCase()
  if (raw === 'approved' || raw === 'rejected') return raw
  if (isServiceLikeVendor(vendor) && raw !== 'rejected') return 'approved'
  return raw || 'pending'
}

const fallbackAvatarUrl = (vendor: any) => {
  const name = encodeURIComponent(String(vendor?.name || 'Mangoo').trim() || 'Mangoo')
  return `https://ui-avatars.com/api/?name=${name}&background=random&color=fff`
}

const isPlaceholderAvatar = (value: any) => {
  const raw = String(value || '').trim()
  if (!raw) return true
  return raw.includes('ui-avatars.com/api/')
}

const getFirstImage = (...values: any[]) => {
  for (const value of values) {
    if (typeof value !== 'string') continue
    const raw = String(value || '').trim()
    if (raw) return raw
  }
  return ''
}

const pickPreferredAvatar = (...values: any[]) => {
  const normalized = values
    .map((value) => (typeof value === 'string' ? String(value || '').trim() : ''))
    .filter(Boolean)
  const rich = normalized.find((value) => !isPlaceholderAvatar(value))
  return rich || normalized[0] || ''
}

const decodeJwtPayload = (token: string) => {
  try {
    const parts = String(token || '').split('.')
    if (parts.length < 2) return null
    const base64 = String(parts[1] || '').replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
    const json = Buffer.from(padded, 'base64').toString('utf8')
    const parsed = JSON.parse(json)
    return parsed && typeof parsed === 'object' ? parsed : null
  } catch {
    return null
  }
}

const maybeUserFromRequest = async (req: any) => {
  try {
    const token = readToken(req)
    if (!token) return null

    const localUser = localSyncStore.getUserByToken(token)
    if (localUser) return localUser

    if (String(process.env.SUPABASE_URL || '').trim() && String(process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim()) {
      const { data, error } = await supabaseAdmin.auth.getUser(token)
      if (!error && data?.user) {
        const user = data.user as any
        return {
          id: String(user?.id || '').trim(),
          email: normalizeEmail(user?.email),
          name: String(user?.user_metadata?.full_name || user?.email || '').trim(),
          source: 'supabase',
          user_metadata: user?.user_metadata || {},
        }
      }
    }

    const decoded: any = decodeJwtPayload(token)
    const email = normalizeEmail(decoded?.email)
    const id = String(decoded?.sub || '').trim()
    if (!email && !id) return null
    return {
      id,
      email,
      name: String(decoded?.user_metadata?.full_name || decoded?.email || '').trim(),
      source: 'jwt',
      user_metadata: decoded?.user_metadata || {},
    }
  } catch {
    return null
  }
}

const requireAuth = (req: any, res: any, next: any) => {
  const token = readToken(req)
  const user = localSyncStore.getUserByToken(token)
  if (!user) {
    res.status(401).json({ success: false, error: 'Unauthorized' })
    return
  }
  req.localUser = user
  next()
}

router.post('/auth/register', (req, res) => {
  try {
    const email = localSyncStore.normalizeEmail(req.body?.email)
    const password = String(req.body?.password || '')
    const name = String(req.body?.name || '').trim()
    const phone = String(req.body?.phone || '').trim()
    const user = localSyncStore.registerUser({ email, password, name, phone })
    const session = localSyncStore.createSession(user.id)
    res.json({
      success: true,
      token: session.token,
      user: { id: user.id, email: user.email, name: user.name, phone: (user as any)?.phone || '' },
    })
  } catch (e: any) {
    res.status(400).json({ success: false, error: String(e?.message || e || 'Bad request') })
  }
})

router.post('/auth/login', (req, res) => {
  try {
    const email = localSyncStore.normalizeEmail(req.body?.email)
    const password = String(req.body?.password || '')
    const user = localSyncStore.loginUser({ email, password })
    if (!user) {
      res.status(401).json({ success: false, error: 'Identifiants incorrects' })
      return
    }
    const session = localSyncStore.createSession(user.id)
    res.json({
      success: true,
      token: session.token,
      user: { id: user.id, email: user.email, name: user.name, phone: (user as any)?.phone || '' },
    })
  } catch (e: any) {
    res.status(400).json({ success: false, error: String(e?.message || e || 'Bad request') })
  }
})

router.get('/me', requireAuth, (req: any, res) => {
  const u = req.localUser
  res.json({ success: true, user: { id: u.id, email: u.email, name: u.name, phone: (u as any)?.phone || '' } })
})

router.get('/shops/mine', requireAuth, (req: any, res) => {
  const u = req.localUser
  const shops = localSyncStore.listMyShops(u.id)
  res.json({ success: true, shops })
})

router.get('/shops', (req, res) => {
  const shops = localSyncStore.listAllShops()
  let usersById = new Map<string, any>()
  try {
    const users = localSyncStore.listAllUsers()
    for (const u of users) usersById.set(String((u as any)?.id || ''), u)
  } catch {
    usersById = new Map()
  }
  const enriched = (Array.isArray(shops) ? shops : []).map((s: any) => {
    const u = usersById.get(String(s?.userId || '')) || null
    return {
      ...s,
      ownerEmail: String(u?.email || ''),
      ownerName: String(u?.name || ''),
    }
  })
  res.json({ success: true, shops: enriched })
})

router.post('/shops', requireAuth, (req: any, res) => {
  try {
    const u = req.localUser
    const name = String(req.body?.name || '').trim()
    const category = String(req.body?.category || 'general').trim()
    const slug = String(req.body?.slug || '').trim()
    const shop = localSyncStore.createShop(u.id, { name, category, slug })
    res.json({ success: true, shop })
  } catch (e: any) {
    res.status(400).json({ success: false, error: String(e?.message || e || 'Bad request') })
  }
})

router.patch('/shops/:slug', requireAuth, (req: any, res) => {
  try {
    const u = req.localUser
    const slug = String(req.params?.slug || '').trim()
    const patch = req.body && typeof req.body === 'object' ? req.body : {}
    const shop = localSyncStore.updateMyShopBySlug(u.id, slug, patch)
    res.json({ success: true, shop })
  } catch (e: any) {
    const msg = String(e?.message || e || 'Bad request')
    const status = msg.toLowerCase() === 'forbidden' ? 403 : 400
    res.status(status).json({ success: false, error: msg })
  }
})

router.get('/shops/:slug', (req, res) => {
  const slug = String(req.params?.slug || '').trim()
  const shop = localSyncStore.getShopBySlug(slug)
  if (!shop) {
    res.status(404).json({ success: false, error: 'Boutique non trouvée' })
    return
  }
  let ownerEmail = ''
  let ownerName = ''
  try {
    const users = localSyncStore.listAllUsers()
    const u = users.find((x: any) => String(x?.id || '') === String((shop as any)?.userId || '')) || null
    ownerEmail = String(u?.email || '')
    ownerName = String(u?.name || '')
  } catch {
    ownerEmail = ''
    ownerName = ''
  }
  res.json({ success: true, shop: { ...(shop as any), ownerEmail, ownerName } })
})

router.get('/localplus/vendors', async (req, res) => {
  const kind = String(req.query?.kind || '').trim().toLowerCase()
  const approvedRaw = String(req.query?.approved || '').trim().toLowerCase()
  const approvedOnly = approvedRaw === '1' || approvedRaw === 'true' || approvedRaw === 'yes'
  const authUser = await maybeUserFromRequest(req)
  const authEmail = normalizeEmail(authUser?.email)
  const authUserId = String(authUser?.id || '').trim()
  const vendors = localSyncStore.listLocalPlusVendors()
  const baseList = Array.isArray(vendors) ? vendors : []

  let supabaseProviders: any[] = []
  try {
    if (String(process.env.SUPABASE_URL || '').trim() && String(process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim()) {
      const { data } = await supabaseAdmin.from('providers').select('*')
      const rows = Array.isArray(data) ? data : []
      const authUsersById = new Map<string, any>()
      const localProviderByEmail = new Map<string, any>()
      const localProviderBySlug = new Map<string, any>()
      const localProviderByName = new Map<string, any>()

      baseList.forEach((v: any) => {
        const kindRaw = String(v?.kind || '').trim().toLowerCase()
        if (kindRaw !== 'service' && kindRaw !== 'provider') return
        const email = normalizeEmail(v?.ownerEmail)
        const slug = String(v?.slug || '').trim().toLowerCase()
        const name = String(v?.name || '').trim().toLowerCase()
        if (email) localProviderByEmail.set(email, v)
        if (slug) localProviderBySlug.set(slug, v)
        if (name) localProviderByName.set(name, v)
      })

      const ensureAuthUser = async (userId: string) => {
        const key = String(userId || '').trim()
        if (!key) return null
        if (authUsersById.has(key)) return authUsersById.get(key) || null
        try {
          const { data } = await supabaseAdmin.auth.admin.getUserById(key)
          const next = data?.user || null
          authUsersById.set(key, next)
          return next
        } catch {
          authUsersById.set(key, null)
          return null
        }
      }

      for (const row of rows) {
        const userId = String((row as any)?.user_id || '').trim()
        const authOwner = userId ? await ensureAuthUser(userId) : null
        const rowEmail = normalizeEmail((row as any)?.email || authOwner?.email)
        const rowSlug = String((row as any)?.slug || '').trim().toLowerCase()
        const rowName = String((row as any)?.name || '').trim().toLowerCase()
        const localMatch =
          (rowEmail && localProviderByEmail.get(rowEmail)) ||
          (rowSlug && localProviderBySlug.get(rowSlug)) ||
          (rowName && localProviderByName.get(rowName)) ||
          null

        const meta = authOwner?.user_metadata || {}
        const loc = (meta as any)?.location_data || {}
        const lat =
          parseLatLng((row as any)?.lat) ??
          parseLatLng((row as any)?.latitude) ??
          parseLatLng(loc?.latitude) ??
          parseLatLng((localMatch as any)?.lat)
        const lng =
          parseLatLng((row as any)?.lng) ??
          parseLatLng((row as any)?.longitude) ??
          parseLatLng(loc?.longitude) ??
          parseLatLng((localMatch as any)?.lng)

        const localAvatar = String((localMatch as any)?.avatar || '').trim()
        const rowAvatar = getFirstImage((row as any)?.avatar_url, (row as any)?.avatar)
        const portfolioAvatar = getFirstImage(
          Array.isArray((row as any)?.portfolio) ? (row as any).portfolio[0] : '',
          Array.isArray((localMatch as any)?.portfolio) ? (localMatch as any).portfolio[0] : ''
        )

        supabaseProviders.push({
          ...(localMatch || {}),
          ...(row as any),
          id: String((row as any)?.id || ''),
          slug: String((row as any)?.slug || ''),
          name: String((row as any)?.name || '').trim() || String((localMatch as any)?.name || '').trim() || 'Prestataire',
          category: String((localMatch as any)?.category || '🔧 Services'),
          trade:
            String((row as any)?.trade || '').trim() ||
            (Array.isArray((row as any)?.services) && (row as any).services[0] ? String((row as any).services[0]).trim() : '') ||
            String((localMatch as any)?.trade || '').trim() ||
            'Prestataire',
          kind: 'service',
          ownerEmail: rowEmail || normalizeEmail((localMatch as any)?.ownerEmail),
          ownerName:
            String(authOwner?.user_metadata?.full_name || '').trim() ||
            String((localMatch as any)?.ownerName || '').trim() ||
            '',
          isUserOwned: Boolean(rowEmail && rowEmail === authEmail),
          approvalStatus:
            String((row as any)?.status || '').trim().toLowerCase() === 'approved' ||
            Boolean((row as any)?.approved_at) ||
            Boolean((row as any)?.is_visible)
              ? 'approved'
              : String((row as any)?.status || '').trim().toLowerCase() || 'pending',
          status: String((row as any)?.status || '').trim().toLowerCase() === 'closed' ? 'closed' : 'open',
          isMobile: Boolean((row as any)?.is_mobile ?? (row as any)?.isMobile ?? (localMatch as any)?.isMobile),
          services: Array.isArray((row as any)?.services) ? (row as any).services : Array.isArray((localMatch as any)?.services) ? (localMatch as any).services : [],
          portfolio: Array.isArray((row as any)?.portfolio) ? (row as any).portfolio : Array.isArray((localMatch as any)?.portfolio) ? (localMatch as any).portfolio : [],
          coverage: Array.isArray((row as any)?.zones) ? (row as any).zones : Array.isArray((localMatch as any)?.coverage) ? (localMatch as any).coverage : [],
          phone:
            String((row as any)?.phone || '').trim() ||
            String((localMatch as any)?.phone || '').trim() ||
            hiddenEmailPhoneDigits(rowEmail),
          city: String((row as any)?.city || (localMatch as any)?.city || '').trim(),
          country: String((row as any)?.country || (localMatch as any)?.country || '').trim(),
          avatar: pickPreferredAvatar(localAvatar, rowAvatar, portfolioAvatar),
          lat: lat ?? undefined,
          lng: lng ?? undefined,
          userId,
        })
      }
    }
  } catch {
    supabaseProviders = []
  }

  const mergedById = new Map<string, any>()
  ;[...baseList, ...supabaseProviders].forEach((v: any) => {
    const id = String(v?.id || '').trim()
    if (!id) return
    const prev = mergedById.get(id)
    mergedById.set(id, prev ? { ...prev, ...v } : v)
  })

  const filtered = Array.from(mergedById.values())
    .filter((v: any) => {
      if (kind !== 'shop' && kind !== 'provider') return true
      const normalizedKind = getNormalizedVendorKind(v)
      if (kind === 'provider') return normalizedKind === 'service'
      return normalizedKind === 'shop'
    })
    .filter((v: any) => {
      if (!approvedOnly) return true
      const ownerEmail = normalizeEmail(v?.ownerEmail)
      const ownerUserId = String(v?.userId || v?.user_id || '').trim()
      const isOwnedByCurrentUser = Boolean(
        (authEmail && ownerEmail && ownerEmail === authEmail) ||
        (authUserId && ownerUserId && ownerUserId === authUserId)
      )
      if (isOwnedByCurrentUser) return true
      const s = getNormalizedApprovalStatus(v)
      return s === 'approved'
    })

  const MAX_VOICE_AUDIO_LEN = 350000
  const MAX_AVATAR_LEN = 350000
  const sanitized = filtered.map((v: any) => {
    const voiceAudioRaw = v?.voiceAudio ?? v?.voice_audio ?? null
    const voiceAudio = typeof voiceAudioRaw === 'string' ? String(voiceAudioRaw) : null
    const safeAudio = voiceAudio && voiceAudio.length <= MAX_VOICE_AUDIO_LEN ? voiceAudio : null
    const avatarRaw = typeof v?.avatar === 'string' ? String(v.avatar) : ''
    const safeAvatar = avatarRaw && avatarRaw.length <= MAX_AVATAR_LEN ? avatarRaw : fallbackAvatarUrl(v)
    const normalizedKind = getNormalizedVendorKind(v)
    const normalizedApproval = getNormalizedApprovalStatus(v)
    const resolvedPhone = getResolvedVendorPhone(v)
    return {
      ...v,
      phone: resolvedPhone || '',
      kind: normalizedKind,
      approvalStatus: normalizedApproval,
      voiceAudio: safeAudio,
      avatar: safeAvatar,
    }
  })
  res.json({ success: true, vendors: sanitized })
})

router.post('/localplus/vendors', async (req, res) => {
  try {
    const user = await maybeUserFromRequest(req)
    const ownerEmail = normalizeEmail(req.body?.ownerEmail || req.body?.vendor?.ownerEmail) || user?.email || null
    const vendorInput = req.body?.vendor || req.body
    const vendorId = String(vendorInput?.id || '').trim()
    // Bloquer les IDs obsolètes supprimés de la production
    const BLOCKED_IDS = ['5', '6', '1780950564842']
    if (BLOCKED_IDS.includes(vendorId)) {
      console.log(`[BLOCKED] upsert refusé pour vendor obsolète id=${vendorId}`)
      res.json({ success: true, blocked: true })
      return
    }
    const vendor = localSyncStore.upsertLocalPlusVendor(vendorInput, ownerEmail)
    res.json({ success: true, vendor })
  } catch (e: any) {
    res.status(400).json({ success: false, error: String(e?.message || e || 'Bad request') })
  }
})

router.post('/localplus/provider-access', async (req, res) => {
  try {
    const phone = String(req.body?.phone || '').trim()
    const phoneDigits = normalizePhoneDigits(phone)
    if (!phoneDigits || phoneDigits.length < 8) {
      res.status(400).json({ success: false, error: 'Numéro invalide' })
      return
    }

    const vendors = localSyncStore.listLocalPlusVendors()
    const candidates = (Array.isArray(vendors) ? vendors : [])
      .map((v: any) => {
        const kind = getNormalizedVendorKind(v)
        const meta = phoneMatchMeta(getResolvedVendorPhone(v), phone)
        return { v, kind, score: meta.score, suffixLen: meta.suffixLen }
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score
        if (b.suffixLen !== a.suffixLen) return b.suffixLen - a.suffixLen
        return new Date(String(b.v?.updatedAt || 0)).getTime() - new Date(String(a.v?.updatedAt || 0)).getTime()
      })

    const best = candidates[0] || null
    if (!best) {
      res.json({ success: true, found: false })
      return
    }

    const bestScore = best.score
    const bestSuffix = best.suffixLen
    const bestGroup = candidates.filter((c) => c.score === bestScore && c.suffixLen === bestSuffix)
    const ambiguous = bestGroup.length > 1
    const vendor = best.v
    const vendorKind = getNormalizedVendorKind(vendor)
    const payload = ambiguous ? null : {
      id: String((vendor as any)?.id || '').trim(),
      name:
        String((vendor as any)?.name || '').trim() ||
        String((vendor as any)?.ownerName || '').trim() ||
        (vendorKind === 'shop' ? 'Boutique' : 'Prestataire'),
      phone: getResolvedVendorPhone(vendor),
      trade: String((vendor as any)?.trade || '').trim(),
      kind: vendorKind,
      category: String((vendor as any)?.category || '').trim(),
      shopSlug: String((vendor as any)?.shopSlug || (vendor as any)?.shop_slug || '').trim(),
    }

    res.json({
      success: true,
      found: true,
      ambiguous,
      ownerEmail: ambiguous ? '' : normalizeEmail((vendor as any)?.ownerEmail),
      vendorKind: ambiguous ? '' : vendorKind,
      vendorId: ambiguous ? '' : String((vendor as any)?.id || '').trim(),
      vendor: payload,
      provider: payload,
    })
  } catch (e: any) {
    res.status(400).json({ success: false, error: String(e?.message || e || 'Bad request') })
  }
})

router.post('/localplus/provider-verify-pin', async (req, res) => {
  try {
    const phone = String(req.body?.phone || '').trim()
    const pin = String(req.body?.pin || req.body?.secret || '').trim()
    const phoneDigits = normalizePhoneDigits(phone)
    if (!phoneDigits || phoneDigits.length < 8) {
      res.status(400).json({ success: false, error: 'Numéro invalide' })
      return
    }
    if (!pin || pin.length < 4) {
      res.status(400).json({ success: false, error: 'Code invalide' })
      return
    }

    const vendors = localSyncStore.listLocalPlusVendors()
    const candidates = (Array.isArray(vendors) ? vendors : [])
      .map((v: any) => {
        const kind = getNormalizedVendorKind(v)
        const meta = phoneMatchMeta(getResolvedVendorPhone(v), phone)
        const stored = String((v as any)?.localPin || (v as any)?.local_pin || '').trim()
        return { v, kind, score: meta.score, suffixLen: meta.suffixLen, stored }
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score
        if (b.suffixLen !== a.suffixLen) return b.suffixLen - a.suffixLen
        return new Date(String(b.v?.updatedAt || 0)).getTime() - new Date(String(a.v?.updatedAt || 0)).getTime()
      })

    if (!candidates.length) {
      res.json({ success: true, found: false, verified: false })
      return
    }

    const matchingPin = candidates.filter((c) => !!c.stored && c.stored === pin)
    const winner = matchingPin[0] || null
    const ok = !!winner
    const vendorId = ok ? String((winner as any)?.v?.id || '').trim() : ''
    const vendorKind = ok ? String((winner as any)?.kind || '').trim() : ''
    const scopedEmail = ok && vendorKind === 'service' ? providerScopedOwnerEmail(phoneDigits, vendorId) : ''
    // Ne pas écraser le ownerEmail existant — le scopedEmail est une info de session, pas de stockage
    if (ok) {
      try {
        localSyncStore.upsertLocalPlusVendor(
          {
            ...((winner as any)?.v || {}),
            id: vendorId,
            localPin: String((winner as any)?.stored || '').trim(),
          },
          null, // ne pas écraser l'ownerEmail existant
        )
      } catch {
      }
    }
    res.json({
      success: true,
      found: true,
      verified: ok,
      ownerEmail: ok ? (scopedEmail || normalizeEmail((winner as any)?.v?.ownerEmail)) : '',
      providerId: vendorId,
      vendorId,
      vendorKind,
      vendor: ok
        ? {
            id: vendorId,
            name: String((winner as any)?.v?.name || '').trim(),
            kind: vendorKind,
            category: String((winner as any)?.v?.category || '').trim(),
            trade: String((winner as any)?.v?.trade || '').trim(),
            phone: getResolvedVendorPhone((winner as any)?.v),
            lat: Number((winner as any)?.v?.lat),
            lng: Number((winner as any)?.v?.lng),
            city: String((winner as any)?.v?.city || '').trim(),
            country: String((winner as any)?.v?.country || '').trim(),
            status: String((winner as any)?.v?.status || '').trim(),
            live: Boolean((winner as any)?.v?.live),
            voicePitch: String((winner as any)?.v?.voicePitch || '').trim(),
            voiceAudio: (winner as any)?.v?.voiceAudio || null,
            avatar: String((winner as any)?.v?.avatar || '').trim(),
            isMobile: Boolean((winner as any)?.v?.isMobile),
            services: Array.isArray((winner as any)?.v?.services) ? (winner as any).v.services : [],
            coverage: Array.isArray((winner as any)?.v?.coverage) ? (winner as any).v.coverage : [],
            portfolio: Array.isArray((winner as any)?.v?.portfolio) ? (winner as any).v.portfolio : [],
            localPin: String((winner as any)?.stored || '').trim(),
            shopSlug: String((winner as any)?.v?.shopSlug || (winner as any)?.v?.shop_slug || '').trim(),
          }
        : null,
      provider: ok
        ? {
            id: vendorId,
            name: String((winner as any)?.v?.name || '').trim(),
            kind: vendorKind,
            category: String((winner as any)?.v?.category || '').trim(),
            trade: String((winner as any)?.v?.trade || '').trim(),
            phone: getResolvedVendorPhone((winner as any)?.v),
            lat: Number((winner as any)?.v?.lat),
            lng: Number((winner as any)?.v?.lng),
            city: String((winner as any)?.v?.city || '').trim(),
            country: String((winner as any)?.v?.country || '').trim(),
            status: String((winner as any)?.v?.status || '').trim(),
            live: Boolean((winner as any)?.v?.live),
            voicePitch: String((winner as any)?.v?.voicePitch || '').trim(),
            voiceAudio: (winner as any)?.v?.voiceAudio || null,
            avatar: String((winner as any)?.v?.avatar || '').trim(),
            isMobile: Boolean((winner as any)?.v?.isMobile),
            services: Array.isArray((winner as any)?.v?.services) ? (winner as any).v.services : [],
            coverage: Array.isArray((winner as any)?.v?.coverage) ? (winner as any).v.coverage : [],
            portfolio: Array.isArray((winner as any)?.v?.portfolio) ? (winner as any).v.portfolio : [],
            localPin: String((winner as any)?.stored || '').trim(),
            shopSlug: String((winner as any)?.v?.shopSlug || (winner as any)?.v?.shop_slug || '').trim(),
          }
        : null,
    })
  } catch (e: any) {
    res.status(400).json({ success: false, error: String(e?.message || e || 'Bad request') })
  }
})

router.post('/localplus/identity/resolve', async (req, res) => {
  try {
    const modeRaw = String(req.body?.mode || req.body?.method || 'auto').trim().toLowerCase()
    const preferredRole = String(req.body?.role || '').trim().toLowerCase()
    const valueRaw = String(req.body?.value || req.body?.identifier || req.body?.email || req.body?.phone || req.body?.pin || '').trim()
    const emailValue = normalizeEmail(valueRaw)
    const phoneValue = String(valueRaw || '').trim()
    const pinValue = normalizePin(valueRaw)

    if (!valueRaw) {
      res.status(400).json({ success: false, error: 'Valeur manquante' })
      return
    }

    const users = localSyncStore.listAllUsers()
    const shops = localSyncStore.listAllShops()
    const vendors = localSyncStore.listLocalPlusVendors()

    const resolveByEmail = () => {
      const user = findLocalUserByEmail(users as any[], emailValue)
      if (user) return buildResolvedIdentityFromUser({ user, vendors: vendors as any[], shops: shops as any[], preferredRole })

      const ownedVendors = getOwnedVendorsForEmail(vendors as any[], emailValue)
        .sort((a: any, b: any) => new Date(String(b?.updatedAt || 0)).getTime() - new Date(String(a?.updatedAt || 0)).getTime())
      // Prioriser "Mangoo Répar" (prestataire principal de la plateforme)
      const vendor = ownedVendors.find((v: any) => String(v?.name || '').trim() === 'Mangoo Répar')
        || ownedVendors[0]
        || null
      if (vendor) return buildResolvedIdentityFromVendor(vendor, preferredRole)
      return null
    }

    const resolveByPhone = () => {
      const candidates = (Array.isArray(users) ? users : [])
        .map((user: any) => {
          const resolvedPhone = getPreferredPhoneForUser(user, vendors as any[])
          const meta = phoneMatchMeta(resolvedPhone, phoneValue)
          return { user, resolvedPhone, score: meta.score, suffixLen: meta.suffixLen }
        })
        .filter((item: any) => item.score > 0)
        .sort((a: any, b: any) => {
          if (b.score !== a.score) return b.score - a.score
          if (b.suffixLen !== a.suffixLen) return b.suffixLen - a.suffixLen
          return new Date(String(b.user?.createdAt || 0)).getTime() - new Date(String(a.user?.createdAt || 0)).getTime()
        })

      const best = candidates[0] || null
      if (best) {
        const bestGroup = candidates.filter((item: any) => item.score === best.score && item.suffixLen === best.suffixLen)
        if (bestGroup.length > 1) return { ambiguous: true, identity: null }
        return {
          ambiguous: false,
          identity: buildResolvedIdentityFromUser({
            user: best.user,
            vendors: vendors as any[],
            shops: shops as any[],
            preferredRole,
            matchedPhone: best.resolvedPhone,
          }),
        }
      }

      const vendorCandidates = (Array.isArray(vendors) ? vendors : [])
        .map((v: any) => {
          const resolvedPhone = getResolvedVendorPhone(v)
          const meta = phoneMatchMeta(resolvedPhone, phoneValue)
          return { v, score: meta.score, suffixLen: meta.suffixLen }
        })
        .filter((item: any) => item.score > 0)
        .sort((a: any, b: any) => {
          if (b.score !== a.score) return b.score - a.score
          if (b.suffixLen !== a.suffixLen) return b.suffixLen - a.suffixLen
          return new Date(String(b.v?.updatedAt || 0)).getTime() - new Date(String(a.v?.updatedAt || 0)).getTime()
        })

      const bestVendor = vendorCandidates[0] || null
      if (!bestVendor) return { ambiguous: false, identity: null }
      const bestGroup = vendorCandidates.filter((item: any) => item.score === bestVendor.score && item.suffixLen === bestVendor.suffixLen)
      if (bestGroup.length > 1) return { ambiguous: true, identity: null }
      return { ambiguous: false, identity: buildResolvedIdentityFromVendor(bestVendor.v, preferredRole) }
    }

    const resolveByPin = () => {
      const userIdentity = findUserIdentityByPin(pinValue)
      if (userIdentity?.user_email) {
        const user = findLocalUserByEmail(users as any[], String(userIdentity.user_email || ''))
        if (user) return { ambiguous: false, identity: buildResolvedIdentityFromUser({ user, vendors: vendors as any[], shops: shops as any[], preferredRole }) }
      }

      const vendorCandidates = (Array.isArray(vendors) ? vendors : [])
        .filter((v: any) => String(v?.localPin || v?.local_pin || '').trim() === pinValue)
        .sort((a: any, b: any) => new Date(String(b?.updatedAt || 0)).getTime() - new Date(String(a?.updatedAt || 0)).getTime())

      if (!vendorCandidates.length) return { ambiguous: false, identity: null }
      if (vendorCandidates.length > 1) return { ambiguous: true, identity: null }
      return { ambiguous: false, identity: buildResolvedIdentityFromVendor(vendorCandidates[0], preferredRole) }
    }

    let result: any = { ambiguous: false, identity: null }
    if (modeRaw === 'email') {
      result.identity = isProbablyEmail(emailValue) ? resolveByEmail() : null
    } else if (modeRaw === 'phone') {
      result = resolveByPhone()
    } else if (modeRaw === 'pin') {
      result = resolveByPin()
    } else {
      if (pinValue && pinValue.length >= 4 && /^[0-9]+$/.test(pinValue)) result = resolveByPin()
      else if (isProbablyEmail(emailValue)) result.identity = resolveByEmail()
      else result = resolveByPhone()
    }

    if (result?.ambiguous) {
      res.json({ success: true, found: true, ambiguous: true, identity: null })
      return
    }

    const identity = result?.identity || null
    if (!identity) {
      res.json({ success: true, found: false, ambiguous: false, identity: null })
      return
    }

    res.json({ success: true, found: true, ambiguous: false, identity })
  } catch (e: any) {
    res.status(400).json({ success: false, error: String(e?.message || e || 'Bad request') })
  }
})

router.patch('/admin/shops/:id', (req, res) => {
  try {
    const id = String(req.params?.id || '').trim()
    const status = String(req.body?.status || '').trim().toLowerCase() as any
    const shop = localSyncStore.updateShopStatus(id, status)
    res.json({ success: true, shop })
  } catch (e: any) {
    res.status(400).json({ success: false, error: String(e?.message || e || 'Bad request') })
  }
})

export default router
