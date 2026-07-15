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
      .select('id,name,slug,description,short_description,image_url,price,compare_at_price,shop_id,product_images(url,alt_text,position,is_primary),shops!inner(id,slug,name,logo_url,status)', {
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
      const imagesRaw = p?.product_images
      const images = Array.isArray(imagesRaw) ? imagesRaw : []
      const pickImageUrl = () => {
        const direct = safeString(p?.image_url)
        if (direct) return direct
        const primary = images.find((x: any) => Boolean(x?.is_primary)) || null
        if (primary) {
          const u = safeString(primary?.url)
          if (u) return u
        }
        const byPos = [...images].sort((a: any, b: any) => Number(a?.position ?? 0) - Number(b?.position ?? 0))
        const first = byPos[0] || null
        const u = safeString(first?.url)
        return u
      }
      return {
        id: safeString(p?.id),
        name: safeString(p?.name),
        slug: safeString(p?.slug),
        description: safeString(p?.short_description || p?.description),
        fullDescription: safeString(p?.description),
        shortDescription: safeString(p?.short_description),
        imageUrl: pickImageUrl(),
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

// GET /api/products/active — tous les produits actifs (optionnel : shop_id)
router.get('/active', async (req: Request, res: Response): Promise<void> => {
  try {
    const shopId = safeString(req.query.shop_id)

    let query = supabaseAdmin
      .from('products')
      .select('id,name,slug,description,short_description,image_url,price,compare_at_price,shop_id,product_images(url,alt_text,position,is_primary),shops!inner(id,slug,name,logo_url,status)', {
        count: 'exact',
      })
      .eq('status', 'active')
      .eq('shops.status', 'approved')
      .limit(50)

    if (shopId) query = query.eq('shop_id', shopId)

    const { data, error } = await query
    if (error) {
      res.status(500).json({ success: false, error: error.message || 'Query failed' })
      return
    }

    const items = (Array.isArray(data) ? data : []).map((p: any) => {
      const imagesRaw = p?.product_images
      const images = Array.isArray(imagesRaw) ? imagesRaw : []
      const pickImageUrl = () => {
        const direct = safeString(p?.image_url)
        if (direct) return direct
        const primary = images.find((x: any) => Boolean(x?.is_primary)) || null
        if (primary) { const u = safeString(primary?.url); if (u) return u }
        const byPos = [...images].sort((a: any, b: any) => Number(a?.position ?? 0) - Number(b?.position ?? 0))
        const first = byPos[0] || null
        return safeString(first?.url)
      }
      return {
        id: safeString(p?.id),
        name: safeString(p?.name),
        slug: safeString(p?.slug),
        imageUrl: pickImageUrl(),
        price: typeof p?.price === 'number' ? p.price : safeNumber(p?.price),
        currency: 'XOF',
      }
    })

    res.status(200).json({ success: true, items })
  } catch {
    res.status(500).json({ success: false, error: 'Server internal error' })
  }
})

export default router
