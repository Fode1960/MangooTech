import express from 'express'
import { createClient } from '@supabase/supabase-js'
import { localSyncStore } from '../services/localSyncStore'
import { connectPlusStore } from '../services/connectPlusStore'

const router = express.Router()

const supabaseUrl = String(process.env.SUPABASE_URL || '').trim()
const supabaseServiceKey = String(process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim()
const supabase = supabaseUrl && supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null
const isNonProd = String(process.env.NODE_ENV || '').trim().toLowerCase() !== 'production'

const normalizeEmail = (value: any) => String(value || '').trim().toLowerCase()

const requireSupabase = (res: express.Response) => {
  if (supabase) return true
  res.status(503).json({ success: false, error: 'Supabase non configure.' })
  return false
}

const authenticateAdmin = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim()
    if (!token) {
      return res.status(401).json({ success: false, error: 'Token manquant' })
    }

    if (token === 'demo-admin' && isNonProd) {
      ;(req as any).adminUser = { id: 'local-admin', is_active: true }
      ;(req as any).user = { id: 'local-admin', email: 'admin@mangoo.tech' }
      next()
      return
    }

    if (!requireSupabase(res)) return

    const { data: authData, error: authError } = await supabase!.auth.getUser(token)
    const user = authData?.user || null
    if (authError || !user) {
      return res.status(401).json({ success: false, error: 'Token invalide' })
    }

    const { data: adminUser, error: adminError } = await supabase!
      .from('admin_users')
      .select('id, is_active')
      .eq('user_id', user.id)
      .single()

    if (adminError || !adminUser?.is_active) {
      return res.status(403).json({ success: false, error: 'Acces refuse' })
    }

    ;(req as any).adminUser = adminUser
    ;(req as any).user = user
    next()
  } catch {
    res.status(500).json({ success: false, error: 'Erreur serveur' })
  }
}

type AdminClientRecord = {
  id: string
  email: string
  name: string
  first_name: string | null
  last_name: string | null
  phone: string | null
  company: string | null
  account_type: string | null
  sector: 'formal' | 'informal'
  source: 'supabase' | 'local-sync'
  created_at: string | null
}

type AdminVendorRecord = {
  id: string
  email: string | null
  name: string
  shop_name: string
  shop_slug: string | null
  sector: 'formal' | 'informal'
  source: 'supabase' | 'local-sync'
  status: string | null
  created_at: string | null
  phone: string | null
  user_id: string | null
}

type AdminPinRecord = {
  id: string
  pin: string
  account_type: 'shop' | 'provider'
  access_role: 'client' | 'vendor'
  account_name: string
  reference: string | null
  sector: 'formal' | 'informal'
  source: 'supabase' | 'local-sync'
  status: string | null
  created_at: string | null
  expires_at: string | null
  email: string | null
  phone: string | null
  target_path: string | null
}

const matchesSearch = (record: AdminClientRecord, search: string) => {
  if (!search) return true
  const haystack = [
    record.email,
    record.name,
    record.first_name || '',
    record.last_name || '',
    record.phone || '',
    record.company || '',
  ]
    .join(' ')
    .toLowerCase()
  return haystack.includes(search)
}

const matchesVendorSearch = (record: AdminVendorRecord, search: string) => {
  if (!search) return true
  const haystack = [
    record.email || '',
    record.name,
    record.shop_name,
    record.shop_slug || '',
    record.phone || '',
    record.status || '',
  ]
    .join(' ')
    .toLowerCase()
  return haystack.includes(search)
}

const matchesPinSearch = (record: AdminPinRecord, search: string) => {
  if (!search) return true
  const haystack = [
    record.pin,
    record.account_name,
    record.reference || '',
    record.email || '',
    record.phone || '',
    record.account_type,
    record.access_role,
    record.sector,
    record.status || '',
  ]
    .join(' ')
    .toLowerCase()
  return haystack.includes(search)
}

const normalizeVendorText = (value: any) => String(value || '').trim().toLowerCase()

const getVendorIdentityKey = (record: AdminVendorRecord) => {
  const slug = normalizeVendorText(record.shop_slug)
  if (slug) return `slug:${slug}`
  return ''
}

const getVendorPriority = (record: AdminVendorRecord) => {
  let score = 0
  if (record.sector === 'formal') score += 100
  if (record.source === 'supabase') score += 20
  if (normalizeVendorText(record.status) === 'approved') score += 5
  return score
}

const pickPreferredVendorRecord = (current: AdminVendorRecord, candidate: AdminVendorRecord) => {
  const currentScore = getVendorPriority(current)
  const candidateScore = getVendorPriority(candidate)
  if (candidateScore !== currentScore) return candidateScore > currentScore ? candidate : current

  const currentTime = current.created_at ? Date.parse(current.created_at) : 0
  const candidateTime = candidate.created_at ? Date.parse(candidate.created_at) : 0
  if (candidateTime !== currentTime) return candidateTime > currentTime ? candidate : current

  return current
}

const dedupeVendorRecords = (items: AdminVendorRecord[]) => {
  const byIdentity = new Map<string, AdminVendorRecord>()
  const passthrough: AdminVendorRecord[] = []

  for (const item of items) {
    const key = getVendorIdentityKey(item)
    if (!key) {
      passthrough.push(item)
      continue
    }

    const existing = byIdentity.get(key)
    byIdentity.set(key, existing ? pickPreferredVendorRecord(existing, item) : item)
  }

  return [...byIdentity.values(), ...passthrough]
}

router.get('/clients', authenticateAdmin, async (req, res) => {
  try {
    const search = String(req.query.search || '').trim().toLowerCase()
    const sectorFilterRaw = String(req.query.sector || 'all').trim().toLowerCase()
    const sectorFilter = sectorFilterRaw === 'formal' || sectorFilterRaw === 'informal' ? sectorFilterRaw : 'all'

    const records: AdminClientRecord[] = []

    const addRecord = (record: AdminClientRecord) => {
      if (!record.email) return
      if (sectorFilter !== 'all' && record.sector !== sectorFilter) return
      if (!matchesSearch(record, search)) return
      records.push(record)
    }

    let formalLoaded = false
    let formalError: string | null = null

    if (supabase) {
      const [
        usersResult,
        shopsResult,
        providersResult,
        adminsResult,
      ] = await Promise.all([
        supabase
          .from('users')
          .select('id, email, first_name, last_name, phone, company, account_type, created_at')
          .order('created_at', { ascending: false })
          .limit(1000),
        supabase
          .from('shops')
          .select('user_id, owner_email, email')
          .limit(1000),
        supabase
          .from('providers')
          .select('user_id, email')
          .limit(1000),
        supabase
          .from('admin_users')
          .select('user_id')
          .limit(500),
      ])

      if (usersResult.error) {
        formalError = usersResult.error.message
      } else {
        formalLoaded = true
        const excludedUserIds = new Set<string>()
        const excludedEmails = new Set<string>()

        for (const row of shopsResult.data || []) {
          const userId = String((row as any)?.user_id || '').trim()
          if (userId) excludedUserIds.add(userId)
          const ownerEmail = normalizeEmail((row as any)?.owner_email || (row as any)?.email)
          if (ownerEmail) excludedEmails.add(ownerEmail)
        }

        for (const row of providersResult.data || []) {
          const userId = String((row as any)?.user_id || '').trim()
          if (userId) excludedUserIds.add(userId)
          const email = normalizeEmail((row as any)?.email)
          if (email) excludedEmails.add(email)
        }

        for (const row of adminsResult.data || []) {
          const userId = String((row as any)?.user_id || '').trim()
          if (userId) excludedUserIds.add(userId)
        }

        for (const row of usersResult.data || []) {
          const id = String((row as any)?.id || '').trim()
          const email = normalizeEmail((row as any)?.email)
          if (!email) continue
          if (id && excludedUserIds.has(id)) continue
          if (excludedEmails.has(email)) continue

          const firstName = String((row as any)?.first_name || '').trim() || null
          const lastName = String((row as any)?.last_name || '').trim() || null
          const fullName = [firstName, lastName].filter(Boolean).join(' ').trim()

          addRecord({
            id: id || email,
            email,
            name: fullName || email.split('@')[0] || 'Client',
            first_name: firstName,
            last_name: lastName,
            phone: String((row as any)?.phone || '').trim() || null,
            company: String((row as any)?.company || '').trim() || null,
            account_type: String((row as any)?.account_type || '').trim() || null,
            sector: 'formal',
            source: 'supabase',
            created_at: String((row as any)?.created_at || '').trim() || null,
          })
        }
      }
    }

    const localUsers = localSyncStore.listAllUsers()
    const localShops = localSyncStore.listAllShops()
    const localPlusVendors = localSyncStore.listLocalPlusVendors()

    const localShopOwnerIds = new Set<string>()
    const localVendorEmails = new Set<string>()

    for (const shop of localShops || []) {
      const userId = String((shop as any)?.userId || '').trim()
      if (userId) localShopOwnerIds.add(userId)
    }

    for (const vendor of localPlusVendors || []) {
      const email = normalizeEmail((vendor as any)?.ownerEmail)
      if (email) localVendorEmails.add(email)
    }

    for (const user of localUsers || []) {
      const id = String((user as any)?.id || '').trim()
      const email = normalizeEmail((user as any)?.email)
      if (!email) continue
      if (localShopOwnerIds.has(id)) continue
      if (localVendorEmails.has(email)) continue
      if (email.endsWith('@localplus.mangoo.tech')) continue

      addRecord({
        id: id || email,
        email,
        name: String((user as any)?.name || '').trim() || email.split('@')[0] || 'Client',
        first_name: null,
        last_name: null,
        phone: null,
        company: null,
        account_type: null,
        sector: 'informal',
        source: 'local-sync',
        created_at: String((user as any)?.createdAt || '').trim() || null,
      })
    }

    records.sort((a, b) => {
      const sectorA = a.sector === 'formal' ? 0 : 1
      const sectorB = b.sector === 'formal' ? 0 : 1
      if (sectorA !== sectorB) return sectorA - sectorB
      const timeA = a.created_at ? Date.parse(a.created_at) : 0
      const timeB = b.created_at ? Date.parse(b.created_at) : 0
      return timeB - timeA
    })

    const counts = {
      total: records.length,
      formal: records.filter((item) => item.sector === 'formal').length,
      informal: records.filter((item) => item.sector === 'informal').length,
    }

    res.json({
      success: true,
      clients: records,
      counts,
      sources: {
        formal: formalLoaded,
        informal: true,
        formal_error: formalError,
      },
    })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message || 'Erreur serveur' })
  }
})

router.get('/vendors', authenticateAdmin, async (req, res) => {
  try {
    const search = String(req.query.search || '').trim().toLowerCase()
    const sectorFilterRaw = String(req.query.sector || 'all').trim().toLowerCase()
    const sectorFilter = sectorFilterRaw === 'formal' || sectorFilterRaw === 'informal' ? sectorFilterRaw : 'all'
    const statusFilter = String(req.query.status || 'all').trim().toLowerCase()

    const rawRecords: AdminVendorRecord[] = []
    const records: AdminVendorRecord[] = []

    const addRawRecord = (record: AdminVendorRecord) => {
      rawRecords.push(record)
    }

    let formalLoaded = false
    let formalError: string | null = null

    if (supabase) {
      const shopSelectAttempts = [
        'id, user_id, name, slug, status, owner_name, owner_email, email, phone, created_at',
        'id, user_id, name, slug, status, owner_email, email, phone, created_at',
        'id, user_id, name, slug, status, email, phone, created_at',
        'id, user_id, name, slug, status, email, created_at',
      ]
      let data: any[] | null = null
      let error: any = null

      for (const select of shopSelectAttempts) {
        const result = await supabase
          .from('shops')
          .select(select)
          .order('created_at', { ascending: false })
          .limit(1000)
        if (!result.error) {
          data = Array.isArray(result.data) ? result.data : []
          error = null
          break
        }
        error = result.error
      }

      if (error) {
        formalError = error.message
      } else {
        formalLoaded = true
        for (const row of data || []) {
          const shopName = String((row as any)?.name || '').trim() || 'Boutique'
          const ownerEmail = normalizeEmail((row as any)?.owner_email || (row as any)?.email)
          const ownerName = String((row as any)?.owner_name || '').trim()
          addRawRecord({
            id: String((row as any)?.id || (row as any)?.slug || ownerEmail || shopName).trim(),
            email: ownerEmail || null,
            name: ownerName || ownerEmail || shopName,
            shop_name: shopName,
            shop_slug: String((row as any)?.slug || '').trim() || null,
            sector: 'formal',
            source: 'supabase',
            status: String((row as any)?.status || '').trim() || 'pending',
            created_at: String((row as any)?.created_at || '').trim() || null,
            phone: String((row as any)?.phone || '').trim() || null,
            user_id: String((row as any)?.user_id || '').trim() || null,
          })
        }
      }
    }

    const localUsers = localSyncStore.listAllUsers()
    const localShops = localSyncStore.listAllShops()
    const localPlusVendors = localSyncStore
      .listLocalPlusVendors()
      .filter((item: any) => String(item?.kind || '').trim().toLowerCase() === 'shop')

    const userById = new Map<string, any>()
    for (const user of localUsers || []) {
      const id = String((user as any)?.id || '').trim()
      if (id) userById.set(id, user)
    }

    const vendorByUserId = new Map<string, any>()
    const vendorByEmail = new Map<string, any>()
    const vendorBySlug = new Map<string, any>()
    for (const vendor of localPlusVendors || []) {
      const userId = String((vendor as any)?.userId || '').trim()
      const email = normalizeEmail((vendor as any)?.ownerEmail)
      const slug = String((vendor as any)?.slug || '').trim()
      if (userId) vendorByUserId.set(userId, vendor)
      if (email) vendorByEmail.set(email, vendor)
      if (slug) vendorBySlug.set(slug, vendor)
    }

    const seenInformal = new Set<string>()

    for (const shop of localShops || []) {
      const userId = String((shop as any)?.userId || '').trim()
      const user = userById.get(userId)
      const email = normalizeEmail((user as any)?.email)
      const slug = String((shop as any)?.slug || '').trim()
      const vendor = vendorByUserId.get(userId) || vendorByEmail.get(email) || vendorBySlug.get(slug)
      const dedupeKey = `${userId || email || slug}:${slug || ''}`
      seenInformal.add(dedupeKey)

      addRawRecord({
        id: String((shop as any)?.id || dedupeKey).trim(),
        email: email || normalizeEmail((vendor as any)?.ownerEmail) || null,
        name:
          String((vendor as any)?.ownerName || (user as any)?.name || '').trim() ||
          normalizeEmail((vendor as any)?.ownerEmail) ||
          email ||
          'Vendeur',
        shop_name: String((shop as any)?.name || (vendor as any)?.name || '').trim() || 'Boutique',
        shop_slug: slug || String((vendor as any)?.slug || '').trim() || null,
        sector: 'informal',
        source: 'local-sync',
        status:
          String((vendor as any)?.approvalStatus || '').trim() ||
          String((shop as any)?.status || '').trim() ||
          'pending',
        created_at:
          String((shop as any)?.createdAt || '').trim() ||
          String((vendor as any)?.createdAt || '').trim() ||
          null,
        phone: String((vendor as any)?.phone || '').trim() || null,
        user_id: userId || String((vendor as any)?.userId || '').trim() || null,
      })
    }

    for (const vendor of localPlusVendors || []) {
      const userId = String((vendor as any)?.userId || '').trim()
      const email = normalizeEmail((vendor as any)?.ownerEmail)
      const slug = String((vendor as any)?.slug || '').trim()
      const dedupeKey = `${userId || email || slug}:${slug || ''}`
      if (seenInformal.has(dedupeKey)) continue

      addRawRecord({
        id: String((vendor as any)?.id || dedupeKey).trim(),
        email: email || null,
        name: String((vendor as any)?.ownerName || '').trim() || email || 'Vendeur',
        shop_name: String((vendor as any)?.name || '').trim() || 'Boutique',
        shop_slug: slug || null,
        sector: 'informal',
        source: 'local-sync',
        status: String((vendor as any)?.approvalStatus || '').trim() || 'pending',
        created_at: String((vendor as any)?.createdAt || '').trim() || null,
        phone: String((vendor as any)?.phone || '').trim() || null,
        user_id: userId || null,
      })
    }

    // A shop that already exists in the formal catalog should not appear again
    // as a separate informal vendor entry with the same slug.
    for (const record of dedupeVendorRecords(rawRecords)) {
      const sector = record.sector
      const status = String(record.status || '').trim().toLowerCase()
      if (sectorFilter !== 'all' && sector !== sectorFilter) continue
      if (statusFilter !== 'all' && status !== statusFilter) continue
      if (!matchesVendorSearch(record, search)) continue
      records.push(record)
    }

    records.sort((a, b) => {
      const sectorA = a.sector === 'formal' ? 0 : 1
      const sectorB = b.sector === 'formal' ? 0 : 1
      if (sectorA !== sectorB) return sectorA - sectorB
      const timeA = a.created_at ? Date.parse(a.created_at) : 0
      const timeB = b.created_at ? Date.parse(b.created_at) : 0
      return timeB - timeA
    })

    const counts = {
      total: records.length,
      formal: records.filter((item) => item.sector === 'formal').length,
      informal: records.filter((item) => item.sector === 'informal').length,
      approved: records.filter((item) => String(item.status || '').trim().toLowerCase() === 'approved').length,
      pending: records.filter((item) => String(item.status || '').trim().toLowerCase() === 'pending').length,
    }

    res.json({
      success: true,
      vendors: records,
      counts,
      sources: {
        formal: formalLoaded,
        informal: true,
        formal_error: formalError,
      },
    })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message || 'Erreur serveur' })
  }
})

router.get('/pins', authenticateAdmin, async (req, res) => {
  try {
    const search = String(req.query.search || '').trim().toLowerCase()
    const kindFilterRaw = String(req.query.kind || 'all').trim().toLowerCase()
    const kindFilter = kindFilterRaw === 'shop' || kindFilterRaw === 'provider' ? kindFilterRaw : 'all'
    const sectorFilterRaw = String(req.query.sector || 'all').trim().toLowerCase()
    const sectorFilter = sectorFilterRaw === 'formal' || sectorFilterRaw === 'informal' ? sectorFilterRaw : 'all'

    const rawRecords: AdminPinRecord[] = []

    const localUsers = localSyncStore.listAllUsers()
    const localShops = localSyncStore.listAllShops()
    const localProviders = localSyncStore
      .listLocalPlusVendors()
      .filter((item: any) => String(item?.kind || '').trim().toLowerCase() === 'provider')

    const localUserById = new Map<string, any>()
    for (const user of localUsers || []) {
      const id = String((user as any)?.id || '').trim()
      if (id) localUserById.set(id, user)
    }

    const shopMetaBySlug = new Map<
      string,
      {
        name: string
        sector: 'formal' | 'informal'
        status: string | null
        email: string | null
        created_at: string | null
      }
    >()

    let formalLoaded = false
    let formalError: string | null = null
    let pinSource = false
    let pinSourceError: string | null = null

    if (supabase) {
      const shopSelectAttempts = [
        'id, user_id, name, slug, status, owner_email, email, created_at',
        'id, user_id, name, slug, status, email, created_at',
      ]
      let shopData: any[] | null = null
      let shopError: any = null

      for (const select of shopSelectAttempts) {
        const result = await supabase
          .from('shops')
          .select(select)
          .order('created_at', { ascending: false })
          .limit(1000)
        if (!result.error) {
          shopData = Array.isArray(result.data) ? result.data : []
          shopError = null
          break
        }
        shopError = result.error
      }

      if (shopError) {
        formalError = shopError.message
      } else {
        formalLoaded = true
        for (const row of shopData || []) {
          const slug = String((row as any)?.slug || '').trim().toLowerCase()
          if (!slug) continue
          shopMetaBySlug.set(slug, {
            name: String((row as any)?.name || '').trim() || 'Boutique',
            sector: 'formal',
            status: String((row as any)?.status || '').trim() || null,
            email: normalizeEmail((row as any)?.owner_email || (row as any)?.email) || null,
            created_at: String((row as any)?.created_at || '').trim() || null,
          })
        }
      }

      try {
        const pinResult = await supabase
          .from('connect_plus_entries')
          .select('id, shop_slug, pin, token, is_active, created_at, expires_at')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(1000)

        if (pinResult.error) {
          pinSourceError = pinResult.error.message
        } else {
          pinSource = true
          const bestBySlug = new Map<string, any>()
          for (const row of pinResult.data || []) {
            const slug = String((row as any)?.shop_slug || '').trim().toLowerCase()
            const pin = String((row as any)?.pin || '').replace(/[^\d]/g, '').slice(0, 6)
            if (!slug || !pin) continue
            const exp = String((row as any)?.expires_at || '').trim()
            const expTime = exp ? Date.parse(exp) : NaN
            if (Number.isFinite(expTime) && expTime <= Date.now()) continue
            const prev = bestBySlug.get(slug)
            if (!prev) {
              bestBySlug.set(slug, row)
              continue
            }
            const prevStable = String((prev as any)?.expires_at || '').trim() ? 0 : 1
            const nextStable = exp ? 0 : 1
            if (nextStable !== prevStable) {
              if (nextStable > prevStable) bestBySlug.set(slug, row)
              continue
            }
            const prevTime = Date.parse(String((prev as any)?.created_at || '')) || 0
            const nextTime = Date.parse(String((row as any)?.created_at || '')) || 0
            if (nextTime > prevTime) bestBySlug.set(slug, row)
          }

          for (const row of bestBySlug.values()) {
            const slug = String((row as any)?.shop_slug || '').trim().toLowerCase()
            const meta = shopMetaBySlug.get(slug)
            rawRecords.push({
              id: `shop:${String((row as any)?.id || slug).trim()}`,
              pin: String((row as any)?.pin || '').replace(/[^\d]/g, '').slice(0, 6),
              account_type: 'shop',
              access_role: 'client',
              account_name: meta?.name || slug || 'Boutique',
              reference: slug || null,
              sector: meta?.sector || 'formal',
              source: 'supabase',
              status: meta?.status || 'approved',
              created_at:
                String((row as any)?.created_at || '').trim() ||
                meta?.created_at ||
                null,
              expires_at: String((row as any)?.expires_at || '').trim() || null,
              email: meta?.email || null,
              phone: null,
              target_path: `/connect-plus?pin=${encodeURIComponent(String((row as any)?.pin || '').replace(/[^\d]/g, '').slice(0, 6))}`,
            })
          }
        }
      } catch (error: any) {
        pinSourceError = error?.message || 'Erreur source PIN'
      }
    }

    for (const shop of localShops || []) {
      const slug = String((shop as any)?.slug || '').trim().toLowerCase()
      if (!slug || shopMetaBySlug.has(slug)) continue
      const user = localUserById.get(String((shop as any)?.userId || '').trim())
      shopMetaBySlug.set(slug, {
        name: String((shop as any)?.name || '').trim() || 'Boutique',
        sector: 'informal',
        status: String((shop as any)?.status || '').trim() || 'pending',
        email: normalizeEmail((user as any)?.email) || null,
        created_at: String((shop as any)?.createdAt || '').trim() || null,
      })
    }

    const localPinEntries = connectPlusStore.listActiveEntries()
    const localPinBySlug = new Map<string, any>()
    for (const row of localPinEntries || []) {
      const slug = String((row as any)?.shop_slug || '').trim().toLowerCase()
      const pin = String((row as any)?.pin || '').replace(/[^\d]/g, '').slice(0, 6)
      if (!slug || !pin) continue
      if (rawRecords.some((item) => item.account_type === 'shop' && String(item.reference || '').trim().toLowerCase() === slug)) continue
      if (!localPinBySlug.has(slug)) localPinBySlug.set(slug, row)
    }

    for (const [slug, row] of localPinBySlug.entries()) {
      const meta = shopMetaBySlug.get(slug)
      rawRecords.push({
        id: `shop-local:${String((row as any)?.id || slug).trim()}`,
        pin: String((row as any)?.pin || '').replace(/[^\d]/g, '').slice(0, 6),
        account_type: 'shop',
        access_role: 'client',
        account_name: meta?.name || slug || 'Boutique',
        reference: slug || null,
        sector: meta?.sector || 'informal',
        source: 'local-sync',
        status: meta?.status || 'pending',
        created_at:
          String((row as any)?.created_at || '').trim() ||
          meta?.created_at ||
          null,
        expires_at: String((row as any)?.expires_at || '').trim() || null,
        email: meta?.email || null,
        phone: null,
        target_path: `/connect-plus?pin=${encodeURIComponent(String((row as any)?.pin || '').replace(/[^\d]/g, '').slice(0, 6))}`,
      })
    }

    for (const provider of localProviders || []) {
      const pin = String((provider as any)?.localPin || '').replace(/[^\d]/g, '').slice(0, 6)
      if (!pin) continue
      rawRecords.push({
        id: `provider:${String((provider as any)?.id || pin).trim()}`,
        pin,
        account_type: 'provider',
        access_role: 'vendor',
        account_name: String((provider as any)?.name || '').trim() || 'Prestataire',
        reference:
          String((provider as any)?.trade || '').trim() ||
          String((provider as any)?.category || '').trim() ||
          null,
        sector: 'informal',
        source: 'local-sync',
        status:
          String((provider as any)?.approvalStatus || '').trim() ||
          String((provider as any)?.status || '').trim() ||
          'pending',
        created_at: String((provider as any)?.createdAt || '').trim() || null,
        expires_at: null,
        email: normalizeEmail((provider as any)?.ownerEmail) || null,
        phone: String((provider as any)?.phone || '').trim() || null,
        target_path: `/mangoo-local.html?pin=${encodeURIComponent(pin)}`,
      })
    }

    const records = rawRecords
      .filter((record) => {
        if (kindFilter !== 'all' && record.account_type !== kindFilter) return false
        if (sectorFilter !== 'all' && record.sector !== sectorFilter) return false
        if (!matchesPinSearch(record, search)) return false
        return true
      })
      .sort((a, b) => {
        const typeA = a.account_type === 'shop' ? 0 : 1
        const typeB = b.account_type === 'shop' ? 0 : 1
        if (typeA !== typeB) return typeA - typeB
        const sectorA = a.sector === 'formal' ? 0 : 1
        const sectorB = b.sector === 'formal' ? 0 : 1
        if (sectorA !== sectorB) return sectorA - sectorB
        const timeA = a.created_at ? Date.parse(a.created_at) : 0
        const timeB = b.created_at ? Date.parse(b.created_at) : 0
        return timeB - timeA
      })

    const counts = {
      total: records.length,
      shops: records.filter((item) => item.account_type === 'shop').length,
      providers: records.filter((item) => item.account_type === 'provider').length,
      formal: records.filter((item) => item.sector === 'formal').length,
      informal: records.filter((item) => item.sector === 'informal').length,
    }

    res.json({
      success: true,
      pins: records,
      counts,
      sources: {
        formal: formalLoaded,
        pin_source: pinSource || localPinEntries.length > 0,
        formal_error: formalError,
        pin_error: pinSourceError,
      },
    })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message || 'Erreur serveur' })
  }
})

export default router
