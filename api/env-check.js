const safeString = (v) => String(v ?? '').trim()

const safeHost = (url) => {
  try {
    const u = new URL(url)
    return u.host
  } catch {
    return ''
  }
}

export default async function handler(req, res) {
  try {
    if (String(req?.method || '').toUpperCase() !== 'GET') {
      res.status(405).json({ success: false, error: 'Method not allowed' })
      return
    }

    const url = safeString(process.env.SUPABASE_URL)
    const key = safeString(process.env.SUPABASE_SERVICE_ROLE_KEY)

    let networkOk = false
    let networkError = ''

    if (url) {
      try {
        const r = await fetch(url, { method: 'HEAD' })
        networkOk = r.ok || (r.status >= 200 && r.status < 500)
      } catch (e) {
        networkOk = false
        networkError = String(e?.message || e)
      }
    }

    res.status(200).json({
      success: true,
      hasSupabaseUrl: Boolean(url),
      supabaseHost: url ? safeHost(url) : '',
      hasServiceRoleKey: Boolean(key),
      serviceRoleKeyLooksLikeJwt: Boolean(key && key.startsWith('eyJ')),
      networkOk,
      networkError: networkError ? networkError.slice(0, 160) : '',
    })
  } catch {
    res.status(500).json({ success: false, error: 'Erreur serveur' })
  }
}

