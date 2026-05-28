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

function parseDataUrl(dataUrl: string): { mime: string; ext: string; buffer: Buffer } | null {
  const raw = safeString(dataUrl)
  const m = raw.match(/^data:(image\/(?:png|jpeg|jpg|webp));base64,([a-z0-9+/=]+)$/i)
  if (!m?.[1] || !m?.[2]) return null
  const mime = m[1].toLowerCase()
  const ext = mime.includes('png') ? 'png' : (mime.includes('webp') ? 'webp' : 'jpg')
  const buffer = Buffer.from(m[2], 'base64')
  return { mime, ext, buffer }
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
    const dataUrl = safeString(body?.dataUrl || body?.data_url)
    if (!slug) {
      res.status(400).json({ success: false, error: 'Slug manquant' })
      return
    }
    if (!dataUrl) {
      res.status(400).json({ success: false, error: 'Image manquante' })
      return
    }

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

    const parsed = parseDataUrl(dataUrl)
    if (!parsed) {
      res.status(400).json({ success: false, error: 'Format image invalide' })
      return
    }
    if (!parsed.buffer?.length) {
      res.status(400).json({ success: false, error: 'Image invalide' })
      return
    }
    if (parsed.buffer.length > 5 * 1024 * 1024) {
      res.status(413).json({ success: false, error: 'Image trop lourde (max 5MB)' })
      return
    }

    const safeSlug = slug.replace(/[^a-z0-9_-]+/gi, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '') || 'shop'
    const filePath = `shop-logos/${safeSlug}-${Date.now()}.${parsed.ext}`
    const uploadRes: any = await supabase
      .storage
      .from('boutique-images')
      .upload(filePath, parsed.buffer, { contentType: parsed.mime, upsert: true })

    if (uploadRes?.error) {
      res.status(500).json({ success: false, error: String(uploadRes.error.message || 'Upload failed') })
      return
    }

    const publicUrl = safeString(
      supabase.storage.from('boutique-images').getPublicUrl(filePath)?.data?.publicUrl
    )
    if (!publicUrl) {
      res.status(500).json({ success: false, error: 'Public URL unavailable' })
      return
    }

    const now = new Date().toISOString()
    let payload: any = { logo_url: publicUrl, updated_at: now }
    let cols = Object.keys(payload)
    let lastError: any = null
    for (let i = 0; i < 6; i++) {
      const candidate: any = {}
      cols.forEach((k) => { candidate[k] = payload[k] })
      const r: any = await supabase.from('shops').update(candidate).eq('slug', slug)
      if (!r?.error) {
        res.status(200).json({ success: true, logo_url: publicUrl })
        return
      }
      lastError = r.error
      const missing = parseMissingColumn(String(r.error.message || ''))
      if (!missing) break
      cols = cols.filter((c) => c !== missing)
      if (!cols.length) break
    }

    res.status(500).json({ success: false, error: String(lastError?.message || 'Erreur serveur') })
  } catch {
    res.status(500).json({ success: false, error: 'Erreur serveur' })
  }
}
