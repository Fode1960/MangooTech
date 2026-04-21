import { createClient } from '@supabase/supabase-js'

const safeString = (v: any) => String(v ?? '').trim()

const getBearer = (req: any) => {
  const h = safeString(req?.headers?.authorization || req?.headers?.Authorization || '')
  const m = h.match(/^Bearer\s+(.+)$/i)
  return safeString(m?.[1] || '')
}

const parseBody = (req: any) => {
  const b = req?.body
  if (!b) return {}
  if (typeof b === 'object') return b
  if (typeof b === 'string') {
    try {
      return JSON.parse(b)
    } catch {
      return {}
    }
  }
  return {}
}

const dropMissingColumns = (msg: string, payload: any) => {
  const lower = String(msg || '').toLowerCase()
  const missingColumn = lower.includes('could not find') && lower.includes('column')
  if (!missingColumn) return payload
  const next = { ...(payload || {}) }
  const dropIfMissing = (col: string) => {
    if (lower.includes(col)) delete next[col]
  }
  ;['shop_category', 'category', 'primary_color', 'secondary_color', 'logo_url', 'updated_at', 'name'].forEach(dropIfMissing)
  return next
}

export default async function handler(req: any, res: any) {
  try {
    if (String(req?.method || '').toUpperCase() !== 'POST') {
      res.status(405).json({ success: false, error: 'Method not allowed' })
      return
    }

    const url = safeString(process.env.SUPABASE_URL)
    const key = safeString(process.env.SUPABASE_SERVICE_ROLE_KEY)
    if (!url || !key) {
      res.status(500).json({ success: false, error: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY on server' })
      return
    }

    const token = getBearer(req)
    if (!token) {
      res.status(401).json({ success: false, error: 'Unauthorized' })
      return
    }

    const body = parseBody(req)
    const slug = safeString(body?.slug)
    const updates = body?.updates && typeof body.updates === 'object' ? body.updates : {}
    if (!slug) {
      res.status(400).json({ success: false, error: 'slug requis' })
      return
    }

    const supabase = createClient(url, key)
    const { data: userData, error: userErr } = await supabase.auth.getUser(token)
    if (userErr || !userData?.user?.email) {
      res.status(401).json({ success: false, error: 'Invalid session' })
      return
    }

    const email = safeString(userData.user.email).toLowerCase()
    const shopLookup = await supabase
      .from('shops')
      .select('id,slug,owner_email,email')
      .eq('slug', slug)
      .maybeSingle()

    if (shopLookup?.error || !shopLookup?.data?.id) {
      res.status(404).json({ success: false, error: 'Boutique introuvable' })
      return
    }

    const ownerEmail = safeString(shopLookup.data.owner_email || shopLookup.data.email).toLowerCase()
    if (!ownerEmail || ownerEmail !== email) {
      res.status(403).json({ success: false, error: 'Forbidden' })
      return
    }

    const now = new Date().toISOString()
    let payload: any = {
      updated_at: now,
    }
    if (safeString(updates?.name)) payload.name = safeString(updates.name)
    if (safeString(updates?.category)) payload.category = safeString(updates.category)
    if (safeString(updates?.shop_category)) payload.shop_category = safeString(updates.shop_category)
    if (safeString(updates?.primary_color)) payload.primary_color = safeString(updates.primary_color)
    if (safeString(updates?.secondary_color)) payload.secondary_color = safeString(updates.secondary_color)
    if (safeString(updates?.logo_url)) payload.logo_url = safeString(updates.logo_url)

    for (let i = 0; i < 4; i++) {
      const r = await supabase.from('shops').update(payload).eq('slug', slug)
      if (!r?.error) break
      payload = dropMissingColumns(String(r.error.message || ''), payload)
      if (!Object.keys(payload).length) break
    }

    const out = await supabase
      .from('shops')
      .select('id,name,shop_name,slug,category,shop_category,logo_url,primary_color,secondary_color,status,owner_email,email,updated_at')
      .eq('slug', slug)
      .maybeSingle()

    if (out?.error) {
      res.status(200).json({ success: true, shop: { slug } })
      return
    }

    res.status(200).json({ success: true, shop: out?.data || { slug } })
  } catch (e: any) {
    res.status(500).json({ success: false, error: String(e?.message || 'Erreur serveur') })
  }
}

