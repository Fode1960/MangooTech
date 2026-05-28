import { createClient } from '@supabase/supabase-js'

const safeString = (v: any) => String(v ?? '').trim()

const parseMs = (value: any): number => {
  const t = value ? Date.parse(String(value)) : NaN
  return Number.isFinite(t) ? t : 0
}

const isLocalShopId = (id: string) => id.startsWith('local-') && id.includes('@')

export default async function handler(req: any, res: any) {
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
    const nowIso = new Date().toISOString()

    const r: any = await supabase
      .from('vendor_boosts')
      .select('vendor_id,vendor_kind,sponsored_until,sponsored_tier,promo_until,new_until,updated_at')
      .or(`sponsored_until.gte.${nowIso},promo_until.gte.${nowIso},new_until.gte.${nowIso}`)

    if (r?.error) {
      res.status(500).json({ success: false, error: String(r.error.message || 'Erreur serveur') })
      return
    }

    const input: any[] = Array.isArray(r?.data) ? r.data : []
    const emails = Array.from(
      new Set(
        input
          .filter((row) => String(row?.vendor_kind || '').trim().toLowerCase() === 'shop')
          .map((row) => safeString(row?.vendor_id))
          .filter((id) => isLocalShopId(id))
          .map((id) => id.slice(6).trim().toLowerCase())
          .filter(Boolean)
      )
    )

    const emailToShopId = new Map<string, string>()
    if (emails.length) {
      try {
        const s: any = await supabase.from('shops').select('id,email').in('email', emails)
        const shops = Array.isArray(s?.data) ? s.data : []
        for (const shop of shops) {
          const email = safeString(shop?.email).toLowerCase()
          const id = safeString(shop?.id)
          if (email && id) emailToShopId.set(email, id)
        }
      } catch {
      }
    }

    const mergeRow = (a: any, b: any) => {
      const out: any = { ...a }
      const sA = parseMs(a?.sponsored_until)
      const sB = parseMs(b?.sponsored_until)
      const pA = parseMs(a?.promo_until)
      const pB = parseMs(b?.promo_until)
      const nA = parseMs(a?.new_until)
      const nB = parseMs(b?.new_until)
      if (sB > sA) {
        out.sponsored_until = b?.sponsored_until
        out.sponsored_tier = b?.sponsored_tier ?? out.sponsored_tier
      }
      if (pB > pA) out.promo_until = b?.promo_until
      if (nB > nA) out.new_until = b?.new_until
      const uA = parseMs(a?.updated_at)
      const uB = parseMs(b?.updated_at)
      if (uB > uA) out.updated_at = b?.updated_at
      if (!out.sponsored_tier && b?.sponsored_tier) out.sponsored_tier = b.sponsored_tier
      return out
    }

    const uniq = new Map<string, any>()
    for (const row of input) {
      const vendorKind = safeString(row?.vendor_kind).toLowerCase()
      let vendorId = safeString(row?.vendor_id)
      if (!vendorId || (vendorKind !== 'shop' && vendorKind !== 'provider')) continue

      if (vendorKind === 'shop' && isLocalShopId(vendorId)) {
        const email = vendorId.slice(6).trim().toLowerCase()
        const mapped = emailToShopId.get(email)
        if (mapped) vendorId = mapped
      }

      const k = `${vendorKind}:${vendorId}`
      const normalized = { ...row, vendor_kind: vendorKind, vendor_id: vendorId }
      const prev = uniq.get(k)
      uniq.set(k, prev ? mergeRow(prev, normalized) : normalized)
    }

    res.status(200).json({ success: true, rows: Array.from(uniq.values()) })
  } catch {
    res.status(500).json({ success: false, rows: [] })
  }
}

