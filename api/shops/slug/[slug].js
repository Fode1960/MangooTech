import { createClient } from '@supabase/supabase-js'

const safeString = (v) => String(v ?? '').trim()

export default async function handler(req, res) {
  try {
    if (String(req?.method || '').toUpperCase() !== 'GET') {
      res.status(405).json({ success: false, error: 'Method not allowed' })
      return
    }

    const slug = safeString(req?.query?.slug || req?.params?.slug)
    if (!slug) {
      res.status(400).json({ success: false, error: 'Slug manquant' })
      return
    }

    const url = safeString(process.env.SUPABASE_URL)
    const key = safeString(process.env.SUPABASE_SERVICE_ROLE_KEY)
    if (!url || !key) {
      res.status(500).json({ success: false, error: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY on server' })
      return
    }

    const supabase = createClient(url, key)
    const r = await supabase.from('shops').select('*').eq('slug', slug).maybeSingle()
    if (r?.error) {
      res.status(500).json({ success: false, error: String(r.error.message || 'Erreur serveur') })
      return
    }
    if (!r?.data) {
      res.status(404).json({ success: false, error: 'Boutique non trouvée' })
      return
    }
    res.status(200).json({ success: true, shop: r.data })
  } catch (e) {
    const msg = String(e?.message || e || 'Erreur serveur')
    res.status(500).json({ success: false, error: msg })
  }
}

