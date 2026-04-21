import { createClient } from '@supabase/supabase-js'

const safeString = (v: any) => String(v ?? '').trim()

const parseDataUrl = (dataUrl: string) => {
  const raw = safeString(dataUrl)
  const m = raw.match(/^data:([^;]+);base64,(.+)$/)
  if (!m?.[1] || !m?.[2]) return null
  return { mime: m[1], b64: m[2] }
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

    const slug = safeString(req?.body?.slug)
    const dataUrl = safeString(req?.body?.dataUrl)
    if (!slug || !dataUrl) {
      res.status(400).json({ success: false, error: 'slug et dataUrl requis' })
      return
    }

    const parsed = parseDataUrl(dataUrl)
    if (!parsed) {
      res.status(400).json({ success: false, error: 'dataUrl invalide' })
      return
    }

    const buf = Buffer.from(parsed.b64, 'base64')
    if (!buf.length) {
      res.status(400).json({ success: false, error: 'Image vide' })
      return
    }
    if (buf.length > 1_500_000) {
      res.status(413).json({ success: false, error: 'Image trop lourde (max 1.5MB)' })
      return
    }

    const ext = (() => {
      const m = parsed.mime.toLowerCase()
      if (m.includes('png')) return 'png'
      if (m.includes('jpeg') || m.includes('jpg')) return 'jpg'
      if (m.includes('webp')) return 'webp'
      if (m.includes('gif')) return 'gif'
      return 'png'
    })()

    const supabase = createClient(url, key)
    const fileName = `shop-logos/${slug}-${Date.now()}.${ext}`

    const upload = await supabase.storage
      .from('boutique-images')
      .upload(fileName, buf, { contentType: parsed.mime, upsert: true })

    if (upload?.error) {
      res.status(500).json({ success: false, error: String(upload.error.message || 'Upload failed') })
      return
    }

    const { data } = supabase.storage.from('boutique-images').getPublicUrl(fileName)
    const publicUrl = safeString(data?.publicUrl)
    if (!publicUrl) {
      res.status(500).json({ success: false, error: 'Public URL not available' })
      return
    }

    res.status(200).json({ success: true, logo_url: publicUrl })
  } catch (e: any) {
    res.status(500).json({ success: false, error: String(e?.message || 'Erreur serveur') })
  }
}
