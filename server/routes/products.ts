import { Router, type Request, type Response } from 'express'
import { supabaseAdmin } from '../config/supabase'

const router = Router()

const safeString = (v: any) => String(v ?? '').trim()
const safeNumber = (v: any) => {
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

router.get('/search', async (req: Request, res: Response): Promise<void> => {
  try {
    const q = safeString(req.query.q).slice(0, 120)
    const limitRaw = safeNumber(req.query.limit)
    const limit = Math.max(1, Math.min(30, limitRaw ?? 12))
    const minPrice = safeNumber(req.query.min)
    const maxPrice = safeNumber(req.query.max)

    let query = supabaseAdmin
      .from('products')
      .select('id,name,slug,description,short_description,price,compare_at_price,shop_id,shops!inner(id,slug,name,logo_url,status)', {
        count: 'exact',
      })
      .eq('status', 'active')
      .eq('shops.status', 'approved')
      .limit(limit)

    if (q) {
      const like = `%${q.replace(/%/g, '')}%`
      query = query.or(`name.ilike.${like},description.ilike.${like},short_description.ilike.${like}`)
    }
    if (minPrice !== null) query = query.gte('price', minPrice)
    if (maxPrice !== null) query = query.lte('price', maxPrice)

    const { data, error } = await query
    if (error) {
      res.status(500).json({ success: false, error: error.message || 'Query failed' })
      return
    }

    const items = (Array.isArray(data) ? data : []).map((p: any) => {
      const shop = p?.shops || null
      return {
        id: safeString(p?.id),
        name: safeString(p?.name),
        slug: safeString(p?.slug),
        description: safeString(p?.short_description || p?.description),
        price: typeof p?.price === 'number' ? p.price : safeNumber(p?.price),
        compareAtPrice: typeof p?.compare_at_price === 'number' ? p.compare_at_price : safeNumber(p?.compare_at_price),
        currency: 'XOF',
        shop: shop
          ? {
              id: safeString(shop?.id),
              slug: safeString(shop?.slug),
              name: safeString(shop?.name),
              logoUrl: safeString(shop?.logo_url),
            }
          : null,
      }
    })

    res.status(200).json({ success: true, items })
  } catch {
    res.status(500).json({ success: false, error: 'Server internal error' })
  }
})

export default router

