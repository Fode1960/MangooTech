import { createClient } from '@supabase/supabase-js'

const safeString = (v: any) => String(v ?? '').trim()

function parseMissingColumn(message: string): string {
  const msg = String(message || '')
  const m1 = msg.match(/could not find the '([^']+)' column/)
  if (m1?.[1]) return m1[1]
  const m2 = msg.match(/column "([^"]+)" does not exist/)
  if (m2?.[1]) return m2[1]
  const m3 = msg.match(/column\s+(?:[a-z0-9_]+\.)?([a-z0-9_]+)\s+does not exist/i)
  if (m3?.[1]) return m3[1]
  return ''
}

async function readJsonBody(req: any): Promise<any> {
  const body = (req as any)?.body
  if (!body) return {}
  if (typeof body === 'object') return body
  if (typeof body === 'string') {
    try {
      return JSON.parse(body)
    } catch {
      return {}
    }
  }
  return {}
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

    const authHeader = safeString(req?.headers?.authorization || req?.headers?.Authorization)
    const token = authHeader.toLowerCase().startsWith('bearer ') ? authHeader.slice(7).trim() : ''
    if (!token) {
      res.status(401).json({ success: false, error: 'Missing Authorization bearer token' })
      return
    }

    const body = await readJsonBody(req)
    const slug = safeString(body?.slug)
    if (!slug) {
      res.status(400).json({ success: false, error: 'Slug manquant' })
      return
    }

    const name = safeString(body?.name)
    const category = safeString(body?.category || body?.shop_category || body?.shopCategory)
    const logoUrl = safeString(body?.logo_url || body?.logoUrl)
    const primaryColor = safeString(body?.primary_color || body?.primaryColor)
    const secondaryColor = safeString(body?.secondary_color || body?.secondaryColor)

    const supabase = createClient(url, key, { auth: { persistSession: false } })
    const userRes = await supabase.auth.getUser(token)
    const userEmail = safeString(userRes?.data?.user?.email).toLowerCase()
    if (!userEmail) {
      res.status(401).json({ success: false, error: 'Invalid token' })
      return
    }

    const shopRes: any = await supabase
      .from('shops')
      .select('id,slug,owner_email,email')
      .eq('slug', slug)
      .maybeSingle()

    if (shopRes?.error) {
      res.status(500).json({ success: false, error: String(shopRes.error.message || 'Erreur serveur') })
      return
    }

    const shop = shopRes?.data
    if (!shop?.slug) {
      res.status(404).json({ success: false, error: 'Boutique non trouvée' })
      return
    }

    const owner = safeString(shop?.owner_email || shop?.email).toLowerCase()
    if (owner && owner !== userEmail) {
      res.status(403).json({ success: false, error: 'Forbidden' })
      return
    }

    const now = new Date().toISOString()
    const updatePayload: Record<string, any> = { updated_at: now }

    if (name) {
      updatePayload.name = name
      updatePayload.shop_name = name
    }

    if (category) {
      updatePayload.category = category
      updatePayload.shop_category = category
    }

    if (primaryColor) updatePayload.primary_color = primaryColor
    if (secondaryColor) updatePayload.secondary_color = secondaryColor

    if (logoUrl) {
      updatePayload.logo_url = logoUrl
    }

    let cols = Object.keys(updatePayload)
    let lastError: any = null
    for (let i = 0; i < 8; i++) {
      const candidate: any = {}
      cols.forEach((k) => { candidate[k] = updatePayload[k] })
      const r: any = await supabase.from('shops').update(candidate).eq('slug', slug)
      if (!r?.error) {
        break
      }
      lastError = r.error
      const missing = parseMissingColumn(String(r.error.message || ''))
      if (!missing) break
      cols = cols.filter((c) => c !== missing)
      if (!cols.length) break
    }

    if (lastError) {
      res.status(500).json({ success: false, error: String(lastError?.message || 'Erreur serveur') })
      return
    }

    const readRes: any = await supabase
      .from('shops')
      .select('id,slug,name,shop_name,category,shop_category,logo_url,primary_color,secondary_color,owner_email,email,updated_at')
      .eq('slug', slug)
      .maybeSingle()

    if (readRes?.error) {
      res.status(200).json({ success: true })
      return
    }

    res.status(200).json({ success: true, shop: readRes?.data || null })
  } catch {
    res.status(500).json({ success: false, error: 'Erreur serveur' })
  }
}
