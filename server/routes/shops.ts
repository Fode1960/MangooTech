import express from 'express'
import { createClient } from '@supabase/supabase-js'

const router = express.Router()

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

const slugify = (value: any) => {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64)
}

const safeString = (v: any) => String(v ?? '').trim()

const selectOneBySlug = async (slug: string) => {
  return await supabase
    .from('shops')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()
}

router.get('/slug/:slug', async (req, res) => {
  try {
    const slug = safeString(req.params.slug)
    if (!slug) return res.status(400).json({ success: false, error: 'Slug manquant' })

    const { data, error } = await selectOneBySlug(slug)
    if (error) return res.status(500).json({ success: false, error: error.message })
    if (!data) return res.status(404).json({ success: false, error: 'Boutique non trouvée' })

    res.json({ success: true, shop: data })
  } catch {
    res.status(500).json({ success: false, error: 'Erreur serveur' })
  }
})

router.get('/by-owner', async (req, res) => {
  try {
    const email = safeString(req.query.email).toLowerCase()
    if (!email) return res.status(400).json({ success: false, error: 'Email manquant' })

    const attempt = async (withOwnerEmail: boolean) => {
      const q = supabase
        .from('shops')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (withOwnerEmail) return await q.or(`owner_email.eq.${email},email.eq.${email}`)
      return await q.eq('email', email)
    }

    let r: any = await attempt(true)
    if (r?.error) {
      const msg = String(r.error.message || '').toLowerCase()
      const missingOwnerEmail = msg.includes('could not find') && msg.includes('owner_email')
      if (missingOwnerEmail) r = await attempt(false)
    }

    if (r?.error) return res.status(500).json({ success: false, error: r.error.message })
    res.json({ success: true, shops: Array.isArray(r?.data) ? r.data : [] })
  } catch {
    res.status(500).json({ success: false, error: 'Erreur serveur' })
  }
})

router.get('/list', async (_req, res) => {
  try {
    const baseCols = [
      'id',
      'name',
      'slug',
      'category',
      'status',
      'owner_email',
      'owner_name',
      'email',
      'logo_url',
      'city',
      'country',
      'created_at',
      'updated_at',
    ]

    let cols = baseCols.slice()
    let lastError: any = null
    for (let i = 0; i < 6; i++) {
      const r = await supabase
        .from('shops')
        .select(cols.join(','))
        .order('created_at', { ascending: false })

      if (!r?.error) {
        res.json({ success: true, shops: Array.isArray(r?.data) ? r.data : [] })
        return
      }

      lastError = r.error
      const msg = String(r.error.message || '').toLowerCase()
      const match = msg.match(/could not find the '([^']+)' column/) || msg.match(/column "([^"]+)" does not exist/)
      const missing = match?.[1]
      if (!missing) break
      cols = cols.filter((c) => c !== missing)
      if (!cols.length) break
    }

    return res.status(500).json({ success: false, error: String(lastError?.message || 'Erreur serveur') })
  } catch {
    res.status(500).json({ success: false, error: 'Erreur serveur' })
  }
})

router.post('/create', async (req, res) => {
  try {
    const name = safeString(req.body?.name)
    const category = safeString(req.body?.category) || 'general'
    const ownerEmail = safeString(req.body?.ownerEmail || req.body?.owner_email || req.body?.email).toLowerCase()
    const ownerName = safeString(req.body?.ownerName || req.body?.owner_name)
    const requestedSlug = safeString(req.body?.slug)

    if (!name) return res.status(400).json({ success: false, error: 'Nom manquant' })

    let slugBase = slugify(requestedSlug || name)
    if (!slugBase) slugBase = `boutique-${Date.now()}`

    let slug = slugBase
    for (let i = 0; i < 4; i++) {
      const { data } = await selectOneBySlug(slug)
      if (!data) break
      const suffix = i === 0 ? String(Date.now()).slice(-6) : `${String(Date.now()).slice(-6)}-${i}`
      slug = `${slugBase}-${suffix}`.slice(0, 64)
    }

    const now = new Date().toISOString()

    const insertBase: any = {
      name,
      slug,
      category,
      status: 'pending',
      updated_at: now,
      created_at: now,
    }

    if (ownerEmail) {
      insertBase.owner_email = ownerEmail
      insertBase.email = ownerEmail
    }
    if (ownerName) insertBase.owner_name = ownerName

    const attempt = async (payload: any) => {
      return await supabase
        .from('shops')
        .insert(payload)
        .select('*')
        .single()
    }

    let r: any = await attempt(insertBase)
    if (r?.error) {
      const msg = String(r.error.message || '').toLowerCase()
      const missingOwnerEmail = msg.includes('could not find') && msg.includes('owner_email')
      const missingOwnerName = msg.includes('could not find') && msg.includes('owner_name')
      const missingStatus = msg.includes('could not find') && msg.includes('status')
      const missingUpdatedAt = msg.includes('could not find') && msg.includes('updated_at')
      const missingCreatedAt = msg.includes('could not find') && msg.includes('created_at')
      const missingCategory = msg.includes('could not find') && msg.includes('category')

      const next = { ...insertBase }
      if (missingOwnerEmail) {
        delete next.owner_email
      }
      if (missingOwnerName) {
        delete next.owner_name
      }
      if (missingStatus) {
        delete next.status
      }
      if (missingUpdatedAt) {
        delete next.updated_at
      }
      if (missingCreatedAt) {
        delete next.created_at
      }
      if (missingCategory) {
        delete next.category
      }

      r = await attempt(next)
    }

    if (r?.error) return res.status(500).json({ success: false, error: r.error.message })
    res.json({ success: true, shop: r.data })
  } catch {
    res.status(500).json({ success: false, error: 'Erreur serveur' })
  }
})

router.post('/sync-local', async (req, res) => {
  try {
    const list = Array.isArray(req.body?.shops) ? req.body.shops : []
    const results: any[] = []
    for (const raw of list) {
      const name = safeString(raw?.name)
      const category = safeString(raw?.category) || 'general'
      const ownerEmail = safeString(raw?.ownerEmail || raw?.owner_email || raw?.email).toLowerCase()
      const ownerName = safeString(raw?.ownerName || raw?.owner_name)
      const requestedSlug = safeString(raw?.slug)
      if (!name && !requestedSlug) continue

      const slugBase = slugify(requestedSlug || name)
      if (!slugBase) continue

      const existing = await selectOneBySlug(slugBase)
      if (existing?.data?.slug) {
        results.push({ slug: slugBase, id: existing.data.id, action: 'exists' })
        continue
      }

      const now = new Date().toISOString()
      const insertBase: any = {
        name: name || slugBase,
        slug: slugBase,
        category,
        status: 'pending',
        updated_at: now,
        created_at: now,
      }
      if (ownerEmail) {
        insertBase.owner_email = ownerEmail
        insertBase.email = ownerEmail
      }
      if (ownerName) insertBase.owner_name = ownerName

      const r = await supabase.from('shops').insert(insertBase).select('id,slug').single()
      if (r.error) {
        results.push({ slug: slugBase, error: r.error.message, action: 'error' })
        continue
      }
      results.push({ slug: r.data.slug, id: r.data.id, action: 'created' })
    }

    res.json({ success: true, results })
  } catch {
    res.status(500).json({ success: false, error: 'Erreur serveur' })
  }
})

export default router
