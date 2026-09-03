import { Router } from 'express'
import { localSyncStore } from '../services/localSyncStore'

const router = Router()

const readToken = (req: any) => {
  const h = String(req.headers?.authorization || '')
  if (!h.toLowerCase().startsWith('bearer ')) return ''
  return h.slice(7).trim()
}

const maybeUserFromRequest = (req: any) => {
  try {
    const token = readToken(req)
    if (!token) return null
    return localSyncStore.getUserByToken(token)
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
    const user = localSyncStore.registerUser({ email, password, name })
    const session = localSyncStore.createSession(user.id)
    res.json({
      success: true,
      token: session.token,
      user: { id: user.id, email: user.email, name: user.name },
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
      user: { id: user.id, email: user.email, name: user.name },
    })
  } catch (e: any) {
    res.status(400).json({ success: false, error: String(e?.message || e || 'Bad request') })
  }
})

router.get('/me', requireAuth, (req: any, res) => {
  const u = req.localUser
  res.json({ success: true, user: { id: u.id, email: u.email, name: u.name } })
})

router.get('/shops/mine', requireAuth, (req: any, res) => {
  const u = req.localUser
  const shops = localSyncStore.listMyShops(u.id)
  res.json({ success: true, shops })
})

router.get('/shops', (req, res) => {
  const shops = localSyncStore.listAllShops()
  res.json({ success: true, shops })
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

router.get('/shops/:slug', (req, res) => {
  const slug = String(req.params?.slug || '').trim()
  const shop = localSyncStore.getShopBySlug(slug)
  if (!shop) {
    res.status(404).json({ success: false, error: 'Boutique non trouvée' })
    return
  }
  res.json({ success: true, shop })
})

const normalizeVendorNameKeyLocalPlus = (value) =>
  String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()

// Correctifs forcés pour la carte Local+ : réaffecte les fiches connues à leur
// vraie position d'inscription, quel que soit l'état stocké en base (coordonnées
// « centre de Paris » erronées issues d'un géocodage par ville). S'applique en
// lecture, avant res.json, donc sans dépendre d'une mise à jour des données.
const KNOWN_LOCALPLUS_VENDOR_FIXES = [
  { ids: ['pro-45624665'], nameKeys: ['sagho', 'sagho mustafa'], patch: { city: 'Vichy', country: 'France', lat: 46.1267, lng: 3.4259, phone: '+33610498123' } },
  { ids: ['pro-41cafa4bcb31', 'ven-e9e831ccf698'], nameKeys: ['dan boutique'], patch: { city: 'Paris', country: 'France', lat: 48.89385, lng: 2.37708, address: '3 rue de Cambrai, 75019 Paris' } },
  { ids: ['ven-7267d483b4d8'], nameKeys: ['boutique jeu video', 'boutique jeux video', 'boutique jeu vidéo'], patch: { city: 'Paris', country: 'France', lat: 48.89385, lng: 2.37708, address: '3 rue de Cambrai, 75019 Paris' } }
]

const localPlusVendorFixFor = (vendor) => {
  if (!vendor || typeof vendor !== 'object') return null
  const id = String(vendor?.id || '').trim()
  const nameKey = normalizeVendorNameKeyLocalPlus(vendor?.name)
  for (const fix of KNOWN_LOCALPLUS_VENDOR_FIXES) {
    if (fix.ids && id && fix.ids.includes(id)) return fix.patch
    if (fix.nameKeys && nameKey && fix.nameKeys.some((k) => nameKey === k || nameKey.includes(k))) return fix.patch
  }
  return null
}

router.get('/localplus/vendors', (req, res) => {
  const vendors = localSyncStore.listLocalPlusVendors().map((v) => {
    const forcedFix = localPlusVendorFixFor(v)
    return forcedFix ? { ...v, ...forcedFix } : v
  })
  res.json({ success: true, vendors })
})

router.post('/localplus/vendors', (req, res) => {
  try {
    const user = maybeUserFromRequest(req)
    const ownerEmail = user?.email || null
    const vendor = localSyncStore.upsertLocalPlusVendor(req.body?.vendor || req.body, ownerEmail)
    res.json({ success: true, vendor })
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
