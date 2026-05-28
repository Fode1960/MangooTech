import { Router } from 'express'
import { localSyncStore } from '../services/localSyncStore'

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

router.get('/localplus/vendors', (req, res) => {
  const vendors = localSyncStore.listLocalPlusVendors()
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
