import { createClient } from '@supabase/supabase-js'

const safeString = (v) => String(v ?? '').trim()

const parseMissingColumn = (message) => {
  const msg = String(message || '')
  const m1 = msg.match(/could not find the '([^']+)' column/)
  if (m1?.[1]) return m1[1]
  const m2 = msg.match(/column "([^"]+)" does not exist/)
  if (m2?.[1]) return m2[1]
  const m3 = msg.match(/column\s+(?:[a-z0-9_]+\.)?([a-z0-9_]+)\s+does not exist/i)
  if (m3?.[1]) return m3[1]
  return ''
}

export default async function handler(req, res) {
  try {
    if (String(req?.method || '').toUpperCase() !== 'GET') {
      res.status(405).json({ success: false, error: 'Method not allowed' })
      return
    }

    const url = safeString(process.env.SUPABASE_URL)
    const key = safeString(process.env.SUPABASE_SERVICE_ROLE_KEY)
    if (!url || !key) {
      res.status(500).json({ success: false, error: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY on server' })
      return
    }

    const supabase = createClient(url, key)

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
    let lastError = null
    for (let i = 0; i < 8; i++) {
      const r = await supabase
        .from('shops')
        .select(cols.join(','))
        .order('created_at', { ascending: false })

      if (!r?.error) {
        res.status(200).json({ success: true, shops: Array.isArray(r?.data) ? r.data : [] })
        return
      }

      lastError = r.error
      const missing = parseMissingColumn(String(r.error.message || ''))
      if (!missing) break
      cols = cols.filter((c) => c !== missing)
      if (!cols.length) break
    }

    res.status(500).json({ success: false, error: String(lastError?.message || 'Erreur serveur') })
  } catch (e) {
    const msg = String(e?.message || e || 'Erreur serveur')
    res.status(500).json({ success: false, error: msg })
  }
}
