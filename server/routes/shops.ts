import express from 'express'
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { localSyncStore } from '../services/localSyncStore'
import { connectPlusIssuer } from '../services/connectPlusIssuer'

const router = express.Router()

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

const slugify = (value: any) => {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64)
}

const safeString = (v: any) => String(v ?? '').trim()
const safeLower = (v: any) => safeString(v).toLowerCase()

function getExampleDomainAliases(email: string): Set<string> {
  const e = safeLower(email)
  const out = new Set<string>()
  if (!e) return out
  out.add(e)
  const at = e.lastIndexOf('@')
  if (at <= 0) return out
  const localPart = e.slice(0, at)
  const domain = e.slice(at + 1)
  if (domain === 'example.com') out.add(`${localPart}@exemple.com`)
  if (domain === 'exemple.com') out.add(`${localPart}@example.com`)
  return out
}

function emailsMatch(a: string, b: string): boolean {
  const A = getExampleDomainAliases(a)
  const B = getExampleDomainAliases(b)
  if (!A.size || !B.size) return false
  for (const x of A) {
    if (B.has(x)) return true
  }
  return false
}

const parseMissingColumn = (message: string): string => {
  const msg = String(message || '')
  const m1 = msg.match(/could not find the '([^']+)' column/i)
  if (m1?.[1]) return m1[1]
  const m2 = msg.match(/column "([^"]+)" does not exist/)
  if (m2?.[1]) return m2[1]
  const m3 = msg.match(/column\s+(?:[a-z0-9_]+\.)?([a-z0-9_]+)\s+does not exist/i)
  if (m3?.[1]) return m3[1]
  return ''
}

function getOrigin(req: any): string {
  try {
    const origin = safeString(req?.headers?.origin)
    if (origin) return origin
  } catch {
  }
  try {
    const host = safeString(req?.headers?.host || req?.hostname)
    if (!host) return ''
    const proto = safeString(req?.headers?.['x-forwarded-proto'] || req?.protocol) || 'http'
    return `${proto}://${host}`
  } catch {
    return ''
  }
}

const shouldAutoProvisionConnectPlus = () => {
  const v = safeLower(process.env.CONNECT_PLUS_AUTO_PROVISION)
  if (v === '1' || v === 'true' || v === 'yes') return true
  if (v === '0' || v === 'false' || v === 'no') return false
  return safeLower(process.env.NODE_ENV) !== 'production'
}

const parseDataUrl = (dataUrl: string): { mime: string; ext: string; buffer: Buffer } | null => {
  const raw = safeString(dataUrl)
  const m = raw.match(/^data:(image\/(?:png|jpeg|jpg|webp));base64,([a-z0-9+/=]+)$/i)
  if (!m?.[1] || !m?.[2]) return null
  const mime = String(m[1]).toLowerCase()
  const ext = mime.includes('png') ? 'png' : (mime.includes('webp') ? 'webp' : 'jpg')
  const buffer = Buffer.from(m[2], 'base64')
  return { mime, ext, buffer }
}

const getBearerToken = (req: any) => {
  const authHeader = safeString(req?.headers?.authorization || req?.headers?.Authorization)
  const token = authHeader.toLowerCase().startsWith('bearer ') ? authHeader.slice(7).trim() : ''
  return token
}

const isUuid = (value: any) => {
  const v = safeString(value)
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v)
}

const isDevBypassAllowed = (req: any) => {
  const hostRaw = safeString(req?.hostname || req?.headers?.host).toLowerCase()
  const host = hostRaw.split(':')[0]
  if (host.includes('localhost') || host.includes('127.0.0.1')) return true
  const origin = safeString(req?.headers?.origin).toLowerCase()
  if (origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) return true
  try {
    const originHost = origin ? new URL(origin).hostname.toLowerCase() : ''
    if (originHost === 'localhost' || originHost === '127.0.0.1') return true
    if (isPrivateIpv4(originHost)) return true
  } catch {
  }
  if (isPrivateIpv4(host)) return true
  const env = safeString(process.env.NODE_ENV).toLowerCase()
  if (env === 'production') return false
  return false
}

const isProd = () => safeString(process.env.NODE_ENV).toLowerCase() === 'production'

const isPrivateIpv4 = (host: string) => {
  const h = safeString(host).toLowerCase().split(':')[0]
  const m = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/)
  if (!m) return false
  const a = Number(m[1])
  const b = Number(m[2])
  const c = Number(m[3])
  const d = Number(m[4])
  if (![a, b, c, d].every((x) => Number.isInteger(x) && x >= 0 && x <= 255)) return false
  if (a === 10) return true
  if (a === 192 && b === 168) return true
  if (a === 172 && b >= 16 && b <= 31) return true
  return false
}

const isTrustedDevRequest = (req: any) => {
  const hostRaw = safeString(req?.hostname || req?.headers?.host).toLowerCase()
  const host = hostRaw.split(':')[0]
  if (host.includes('localhost') || host.includes('127.0.0.1')) return true
  if (isPrivateIpv4(host)) return true
  const origin = safeString(req?.headers?.origin).toLowerCase()
  if (!origin) return false
  try {
    const originHost = new URL(origin).hostname.toLowerCase()
    if (originHost === 'localhost' || originHost === '127.0.0.1') return true
    if (isPrivateIpv4(originHost)) return true
  } catch {
  }
  return false
}

const safeJson = (raw: any) => {
  try {
    if (!raw) return null
    if (typeof raw === 'object') return raw
    return JSON.parse(String(raw))
  } catch {
    return null
  }
}

const toNumber = (v: any) => {
  const n = Number(String(v ?? '').replace(',', '.'))
  return Number.isFinite(n) ? n : 0
}

const toUiProduct = (row: any) => {
  const attrs = safeJson(row?.attributes) || {}
  const category = attrs?.category && typeof attrs.category === 'object'
    ? { name: safeString(attrs.category?.name) || 'Général', slug: safeString(attrs.category?.slug) || 'general' }
    : { name: 'Général', slug: 'general' }

  const imagesRaw = Array.isArray(row?.product_images) ? row.product_images : []
  const images = imagesRaw
    .slice()
    .sort((a: any, b: any) => {
      const ap = a?.is_primary ? 1 : 0
      const bp = b?.is_primary ? 1 : 0
      if (ap !== bp) return bp - ap
      return (Number(a?.position || 0) - Number(b?.position || 0))
    })
    .map((img: any) => ({
      url: safeString(img?.url),
      alt_text: safeString(img?.alt_text) || safeString(row?.name) || 'Image',
    }))

  const variantsRaw = Array.isArray(row?.product_variants) ? row.product_variants : []
  const variants = variantsRaw
    .slice()
    .sort((a: any, b: any) => Number(a?.position || 0) - Number(b?.position || 0))
    .map((v: any) => ({
      inventory_quantity: Number(v?.inventory_quantity ?? 0),
    }))

  return {
    id: safeString(row?.id),
    name: safeString(row?.name),
    slug: safeString(row?.slug),
    description: safeString(row?.description),
    short_description: safeString(row?.short_description),
    price: toNumber(row?.price),
    status: safeString(row?.status) || 'draft',
    featured: Boolean(row?.featured),
    images: images.length ? images : [{ url: '', alt_text: safeString(row?.name) || 'Image' }],
    category,
    average_rating: 4.5,
    review_count: 0,
    sales_count: 0,
    variants: variants.length ? variants : [{ inventory_quantity: 0 }],
  }
}

const uploadProductImageIfNeeded = async (shopSlug: string, productId: string, urlOrDataUrl: string) => {
  const raw = safeString(urlOrDataUrl)
  if (!raw) return ''
  if (!/^data:image\//i.test(raw)) return raw
  const parsed = parseDataUrl(raw)
  if (!parsed) return ''
  if (!parsed.buffer?.length) return ''
  if (parsed.buffer.length > 5 * 1024 * 1024) return ''

  const safeShopSlug = shopSlug.replace(/[^a-z0-9_-]+/gi, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '') || 'shop'
  const safeProduct = productId.replace(/[^a-z0-9_-]+/gi, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '') || 'product'
  const filePath = `product-images/${safeShopSlug}/${safeProduct}-${Date.now()}.${parsed.ext}`
  const uploadRes: any = await supabase
    .storage
    .from('boutique-images')
    .upload(filePath, parsed.buffer, { contentType: parsed.mime, upsert: true })

  if (uploadRes?.error) return ''
  return safeString(supabase.storage.from('boutique-images').getPublicUrl(filePath)?.data?.publicUrl)
}

const selectOneBySlug = async (slug: string) => {
  return await supabase
    .from('shops')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()
}

router.get('/slug/:slug', async (req, res) => {
  try {
    const slug = safeString(req.params.slug)
    if (!slug) return res.status(400).json({ success: false, error: 'Slug manquant' })

    const { data, error } = await selectOneBySlug(slug)
    if (error) return res.status(500).json({ success: false, error: error.message })
    if (!data) return res.status(404).json({ success: false, error: 'Boutique non trouvée' })

    res.json({ success: true, shop: data })
  } catch {
    res.status(500).json({ success: false, error: 'Erreur serveur' })
  }
})

router.get('/slug/:slug/products', async (req, res) => {
  try {
    const slug = safeString(req.params.slug)
    if (!slug) return res.status(400).json({ success: false, error: 'Slug manquant' })

    const token = getBearerToken(req)
    let userEmail = ''
    if (token) {
      const userRes: any = await supabase.auth.getUser(token)
      userEmail = safeString(userRes?.data?.user?.email).toLowerCase()
    }

    const selectShop = async (withOwnerEmail: boolean) => {
      const baseCols = withOwnerEmail ? 'id,slug,status,owner_email,email' : 'id,slug,status,email'
      let q: any = supabase
        .from('shops')
        .select(baseCols)
        .eq('slug', slug)
        .maybeSingle()
      if (isProd() && !userEmail) q = q.eq('status', 'approved')
      return await q
    }

    let shopRes: any = await selectShop(true)
    if (shopRes?.error) {
      const missing = parseMissingColumn(String(shopRes.error.message || ''))
      if (missing === 'owner_email') shopRes = await selectShop(false)
    }
    if (shopRes?.error) return res.status(500).json({ success: false, error: String(shopRes.error.message || 'Erreur serveur') })
    const shop = shopRes?.data
    if (!shop?.id) return res.status(404).json({ success: false, error: 'Boutique non trouvée' })

    const owner = safeString(shop?.owner_email || shop?.email).toLowerCase()
    const canManage = Boolean(userEmail && owner && userEmail === owner)

    const includeAll = canManage && String(req.query?.include || '').toLowerCase() === 'all'
    const statusFilter = includeAll ? null : 'active'

    let q: any = supabase
      .from('products')
      .select('id,name,slug,description,short_description,price,status,featured,attributes,created_at,updated_at,product_images(url,alt_text,position,is_primary),product_variants(inventory_quantity,position,status)')
      .eq('shop_id', shop.id)
      .order('created_at', { ascending: false })

    if (statusFilter) q = q.eq('status', statusFilter)

    const r: any = await q
    if (r?.error) return res.status(500).json({ success: false, error: String(r.error.message || 'Erreur serveur') })

    const list = Array.isArray(r?.data) ? r.data : []
    res.json({ success: true, products: list.map(toUiProduct) })
  } catch {
    res.status(500).json({ success: false, error: 'Erreur serveur' })
  }
})

router.post('/slug/:slug/products/upsert', async (req, res) => {
  try {
    const token = getBearerToken(req)
    const allowDevBypass = isDevBypassAllowed(req)
    if (!token && !allowDevBypass) return res.status(401).json({ success: false, error: 'Missing Authorization bearer token' })

    const slug = safeString(req.params.slug)
    if (!slug) return res.status(400).json({ success: false, error: 'Slug manquant' })

    let userEmail = ''
    if (token) {
      const userRes: any = await supabase.auth.getUser(token)
      userEmail = safeString(userRes?.data?.user?.email).toLowerCase()
      if (!userEmail) return res.status(401).json({ success: false, error: 'Invalid token' })
    }

    const selectShop = async (withOwnerEmail: boolean) => {
      const cols = withOwnerEmail ? 'id,slug,owner_email,email' : 'id,slug,email'
      return await supabase
        .from('shops')
        .select(cols)
        .eq('slug', slug)
        .maybeSingle()
    }

    let shopRes: any = await selectShop(true)
    if (shopRes?.error) {
      const missing = parseMissingColumn(String(shopRes.error.message || ''))
      if (missing === 'owner_email') shopRes = await selectShop(false)
    }
    if (shopRes?.error) return res.status(500).json({ success: false, error: String(shopRes.error.message || 'Erreur serveur') })
    const shop = shopRes?.data
    if (!shop?.id) return res.status(404).json({ success: false, error: 'Boutique non trouvée' })

    const owner = safeString(shop?.owner_email || shop?.email).toLowerCase()
    if (userEmail && owner && owner !== userEmail) return res.status(403).json({ success: false, error: 'Forbidden' })

    const rawProduct = req.body?.product || {}
    const name = safeString(rawProduct?.name)
    const description = safeString(rawProduct?.description)
    const shortDescription = safeString(rawProduct?.short_description || rawProduct?.shortDescription)
    const featured = Boolean(rawProduct?.featured)
    const status = safeString(rawProduct?.status) || 'active'
    const price = toNumber(rawProduct?.price)
    const requestedSlug = safeString(rawProduct?.slug) || name
    const category = rawProduct?.category && typeof rawProduct.category === 'object'
      ? { name: safeString(rawProduct.category?.name) || 'Général', slug: safeString(rawProduct.category?.slug) || 'general' }
      : { name: 'Général', slug: 'general' }

    if (!name) return res.status(400).json({ success: false, error: 'Nom manquant' })

    let productSlug = slugify(requestedSlug || name)
    if (!productSlug) productSlug = `produit-${Date.now()}`

    const now = new Date().toISOString()

    const productIdRaw = safeString(rawProduct?.id)
    const isUpdate = isUuid(productIdRaw)
    let productId = isUpdate ? productIdRaw : ''

    if (!isUpdate) {
      const existing: any = await supabase
        .from('products')
        .select('id')
        .eq('shop_id', shop.id)
        .eq('slug', productSlug)
        .maybeSingle()
      if (existing?.data?.id) {
        productSlug = `${productSlug}-${String(Date.now()).slice(-6)}`.slice(0, 64)
      }
    } else {
      const conflict: any = await supabase
        .from('products')
        .select('id')
        .eq('shop_id', shop.id)
        .eq('slug', productSlug)
        .neq('id', productId)
        .maybeSingle()
      if (conflict?.data?.id) {
        productSlug = `${productSlug}-${String(Date.now()).slice(-6)}`.slice(0, 64)
      }
    }

    const attributes = {
      ...(safeJson(rawProduct?.attributes) || {}),
      category,
    }

    if (!isUpdate) {
      const insertPayload: any = {
        shop_id: shop.id,
        name,
        slug: productSlug,
        description: description || null,
        short_description: shortDescription || null,
        price,
        status,
        featured,
        attributes,
        created_at: now,
        updated_at: now,
      }
      const ins: any = await supabase.from('products').insert(insertPayload).select('id,name,slug,description,short_description,price,status,featured,attributes,created_at,updated_at').single()
      if (ins?.error) return res.status(500).json({ success: false, error: String(ins.error.message || 'Erreur serveur') })
      productId = safeString(ins?.data?.id)
    } else {
      const updatePayload: any = {
        name,
        slug: productSlug,
        description: description || null,
        short_description: shortDescription || null,
        price,
        status,
        featured,
        attributes,
        updated_at: now,
      }
      const upd: any = await supabase
        .from('products')
        .update(updatePayload)
        .eq('id', productId)
        .eq('shop_id', shop.id)
        .select('id')
        .maybeSingle()
      if (upd?.error) return res.status(500).json({ success: false, error: String(upd.error.message || 'Erreur serveur') })
      if (!upd?.data?.id) return res.status(404).json({ success: false, error: 'Produit non trouvé' })
    }

    const imagesIn = Array.isArray(rawProduct?.images) ? rawProduct.images : []
    const imagesPrepared: any[] = []
    for (let i = 0; i < Math.min(imagesIn.length, 5); i++) {
      const img = imagesIn[i] || {}
      const uploaded = await uploadProductImageIfNeeded(slug, productId, safeString(img?.url))
      const finalUrl = safeString(uploaded || img?.url)
      if (!finalUrl) continue
      imagesPrepared.push({
        product_id: productId,
        url: finalUrl,
        alt_text: safeString(img?.alt_text) || name,
        position: i,
        is_primary: i === 0,
      })
    }

    await supabase.from('product_images').delete().eq('product_id', productId)
    if (imagesPrepared.length) {
      const im: any = await supabase.from('product_images').insert(imagesPrepared).select('url,alt_text,position,is_primary')
      if (im?.error) return res.status(500).json({ success: false, error: String(im.error.message || 'Erreur serveur') })
    }

    const stock = Number(rawProduct?.stock ?? rawProduct?.inventory_quantity ?? rawProduct?.variants?.[0]?.inventory_quantity ?? 0)
    const variantPayload: any = {
      product_id: productId,
      name: 'Default',
      price,
      inventory_quantity: Number.isFinite(stock) ? stock : 0,
      position: 0,
      status: 'active',
      updated_at: now,
      created_at: now,
    }

    await supabase.from('product_variants').delete().eq('product_id', productId)
    const v: any = await supabase.from('product_variants').insert(variantPayload).select('inventory_quantity,position,status')
    if (v?.error) return res.status(500).json({ success: false, error: String(v.error.message || 'Erreur serveur') })

    const read: any = await supabase
      .from('products')
      .select('id,name,slug,description,short_description,price,status,featured,attributes,created_at,updated_at,product_images(url,alt_text,position,is_primary),product_variants(inventory_quantity,position,status)')
      .eq('id', productId)
      .maybeSingle()
    if (read?.error) return res.status(500).json({ success: false, error: String(read.error.message || 'Erreur serveur') })
    res.json({ success: true, product: toUiProduct(read?.data || {}) })
  } catch {
    res.status(500).json({ success: false, error: 'Erreur serveur' })
  }
})

router.delete('/slug/:slug/products/:productId', async (req, res) => {
  try {
    const token = getBearerToken(req)
    const allowDevBypass = isDevBypassAllowed(req)
    if (!token && !allowDevBypass) return res.status(401).json({ success: false, error: 'Missing Authorization bearer token' })

    const slug = safeString(req.params.slug)
    const productId = safeString(req.params.productId)
    if (!slug) return res.status(400).json({ success: false, error: 'Slug manquant' })
    if (!isUuid(productId)) return res.status(400).json({ success: false, error: 'Produit invalide' })

    let userEmail = ''
    if (token) {
      const userRes: any = await supabase.auth.getUser(token)
      userEmail = safeString(userRes?.data?.user?.email).toLowerCase()
      if (!userEmail) return res.status(401).json({ success: false, error: 'Invalid token' })
    }

    const selectShop = async (withOwnerEmail: boolean) => {
      const cols = withOwnerEmail ? 'id,slug,owner_email,email' : 'id,slug,email'
      return await supabase
        .from('shops')
        .select(cols)
        .eq('slug', slug)
        .maybeSingle()
    }

    let shopRes: any = await selectShop(true)
    if (shopRes?.error) {
      const missing = parseMissingColumn(String(shopRes.error.message || ''))
      if (missing === 'owner_email') shopRes = await selectShop(false)
    }
    if (shopRes?.error) return res.status(500).json({ success: false, error: String(shopRes.error.message || 'Erreur serveur') })
    const shop = shopRes?.data
    if (!shop?.id) return res.status(404).json({ success: false, error: 'Boutique non trouvée' })

    const owner = safeString(shop?.owner_email || shop?.email).toLowerCase()
    if (userEmail && owner && owner !== userEmail) return res.status(403).json({ success: false, error: 'Forbidden' })

    const r: any = await supabase
      .from('products')
      .delete()
      .eq('id', productId)
      .eq('shop_id', shop.id)

    if (r?.error) return res.status(500).json({ success: false, error: String(r.error.message || 'Erreur serveur') })
    res.json({ success: true })
  } catch {
    res.status(500).json({ success: false, error: 'Erreur serveur' })
  }
})

router.get('/by-owner', async (req, res) => {
  try {
    const email = safeString(req.query.email).toLowerCase()
    if (!email) return res.status(400).json({ success: false, error: 'Email manquant' })

    const emails = Array.from(getExampleDomainAliases(email))
    const clauses = [
      ...emails.map((e) => `owner_email.eq.${e}`),
      ...emails.map((e) => `email.eq.${e}`),
      ...emails.map((e) => `contact_email.eq.${e}`),
    ]
    let lastError: any = null

    for (let i = 0; i < 6; i++) {
      if (!clauses.length) break
      const r: any = await supabase
        .from('shops')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)
        .or(clauses.join(','))

      if (!r?.error) {
        const rows = Array.isArray(r?.data) ? r.data : []
        const tagged = rows.map((s: any) => {
          const oe = safeLower(s?.owner_email)
          const se = safeLower(s?.email)
          const ce = safeLower(s?.contact_email)
          const match =
            oe && emailsMatch(oe, email) ? 'owner_email'
              : se && emailsMatch(se, email) ? 'email'
                : ce && emailsMatch(ce, email) ? 'contact_email'
                  : ''
          return { ...s, match_source: match }
        })
        res.json({ success: true, shops: tagged })
        return
      }

      lastError = r.error
      const missing = parseMissingColumn(String(r.error.message || ''))
      if (!missing) break
      for (let k = clauses.length - 1; k >= 0; k--) {
        if (clauses[k].startsWith(`${missing}.`)) clauses.splice(k, 1)
      }
    }

    return res.status(500).json({ success: false, error: String(lastError?.message || 'Erreur serveur') })
  } catch {
    res.status(500).json({ success: false, error: 'Erreur serveur' })
  }
})

router.get('/list', async (req, res) => {
  try {
    const normalizeLogoUrl = (raw: any) => {
      const v = safeString(raw).trim()
      if (!v) return null
      if (v.startsWith('data:')) return null
      return v
    }

    const baseCols = [
      'id',
      'user_id',
      'name',
      'slug',
      'category',
      'status',
      'owner_email',
      'owner_name',
      'email',
      'contact_email',
      'logo_url',
      'city',
      'country',
      'created_at',
      'updated_at',
    ]

    let cols = baseCols.slice()
    let lastError: any = null
    for (let i = 0; i < 6; i++) {
      let q: any = supabase
        .from('shops')
        .select(cols.join(','))
        .order('created_at', { ascending: false })

      if (cols.includes('status')) q = q.eq('status', 'approved')

      const r = await q

      if (!r?.error) {
        const remoteAll = Array.isArray(r?.data) ? r.data : []
        const remote = remoteAll
          .filter((s: any) => safeString(s?.slug))
          .map((s: any) => ({ ...s, logo_url: normalizeLogoUrl((s as any)?.logo_url) }))
        const env = safeString(process.env.NODE_ENV).toLowerCase()
        const isDev = env !== 'production' || isTrustedDevRequest(req)

        const includeLocal = (() => {
          const raw =
            safeString((req.query as any)?.include_local_sync) ||
            safeString((req.query as any)?.ff_local_sources) ||
            safeString((req.query as any)?.ff_local)
          if (raw === '1') return true
          try {
            const q = req.query as any
            if (q && (q.include_local_sync !== undefined || q.ff_local_sources !== undefined || q.ff_local !== undefined)) return true
          } catch {
          }
          return false
        })()

        if (!isDev || !includeLocal) {
          res.json({ success: true, shops: remote })
          return
        }

        let localSyncRows: any[] = []
        try {
          const localShops = localSyncStore.listAllShops()
          const usersById = new Map<string, any>()
          try {
            const dbPath = path.resolve(process.cwd(), 'server', 'data', 'local-sync.json')
            const raw = fs.readFileSync(dbPath, 'utf8')
            const parsed = raw ? JSON.parse(raw) : null
            const users = Array.isArray(parsed?.users) ? parsed.users : []
            for (const u of users) usersById.set(String(u?.id || ''), u)
          } catch {
          }

          localSyncRows = (Array.isArray(localShops) ? localShops : []).map((s: any) => {
            const user = usersById.get(String(s?.userId || '')) || null
            const email = safeString(user?.email).toLowerCase()
            const name = safeString(user?.name)
            return {
              id: `local_${safeString(s?.id) || safeString(s?.slug) || `ls_${Date.now()}`}`,
              user_id: null,
              name: safeString(s?.name) || 'Boutique',
              slug: safeString(s?.slug),
              category: safeString(s?.category) || 'general',
              status: safeString(s?.status) || 'pending',
              owner_email: email,
              owner_name: name,
              email,
              contact_email: email,
              logo_url: normalizeLogoUrl((s as any)?.logo_url || (s as any)?.logoUrl || ''),
              city: '',
              country: '',
              created_at: safeString(s?.createdAt),
              updated_at: safeString(s?.updatedAt),
            }
          })

          localSyncRows = localSyncRows.filter((s: any) => safeString(s?.status).toLowerCase() === 'approved')
        } catch {
          localSyncRows = []
        }

        const bySlug = new Map<string, any>()
        for (const s of remote) {
          const slug = safeString((s as any)?.slug)
          if (!slug) continue
          bySlug.set(slug, s)
        }
        for (const s of localSyncRows) {
          const slug = safeString((s as any)?.slug)
          if (!slug) continue
          if (!bySlug.has(slug)) bySlug.set(slug, s)
        }

        const merged = Array.from(bySlug.values()).sort((a: any, b: any) => {
          const ta = Date.parse(String(a?.created_at || '')) || 0
          const tb = Date.parse(String(b?.created_at || '')) || 0
          return tb - ta
        })

        res.json({ success: true, shops: merged })
        return
      }

      lastError = r.error
      const missing = parseMissingColumn(String(r.error.message || ''))
      if (!missing) break
      cols = cols.filter((c) => c !== missing)
      if (!cols.length) break
    }

    return res.status(500).json({ success: false, error: String(lastError?.message || 'Erreur serveur') })
  } catch {
    res.status(500).json({ success: false, error: 'Erreur serveur' })
  }
})

router.post('/logo-upload', async (req, res) => {
  try {
    const token = getBearerToken(req)
    const allowDevBypass = isDevBypassAllowed(req)
    if (!token && !allowDevBypass) return res.status(401).json({ success: false, error: 'Missing Authorization bearer token' })

    const slug = safeString(req.body?.slug)
    const dataUrl = safeString(req.body?.dataUrl || req.body?.data_url)
    if (!slug) return res.status(400).json({ success: false, error: 'Slug manquant' })
    if (!dataUrl) return res.status(400).json({ success: false, error: 'Image manquante' })

    const parsed = parseDataUrl(dataUrl)
    if (!parsed) return res.status(400).json({ success: false, error: 'Format image invalide' })
    if (!parsed.buffer?.length) return res.status(400).json({ success: false, error: 'Image invalide' })
    if (parsed.buffer.length > 5 * 1024 * 1024) return res.status(413).json({ success: false, error: 'Image trop lourde (max 5MB)' })

    let userEmail = ''
    if (token) {
      const userRes: any = await supabase.auth.getUser(token)
      userEmail = safeString(userRes?.data?.user?.email).toLowerCase()
      if (!userEmail) return res.status(401).json({ success: false, error: 'Invalid token' })
    }

    const allowLocalSync = allowDevBypass || safeString(process.env.NODE_ENV).toLowerCase() !== 'production' || isTrustedDevRequest(req)
    const tryLocalSync = () => {
      if (!allowLocalSync) return { ok: false, status: 404, error: 'Boutique non trouvée' as any }
      const ls = localSyncStore.getShopBySlug(slug) as any
      if (!ls) return { ok: false, status: 404, error: 'Boutique non trouvée' as any }
      if (userEmail) {
        try {
          const users = localSyncStore.listAllUsers()
          const u = users.find((x: any) => String(x?.id || '') === String(ls?.userId || '')) || null
          const ownerEmail = safeString(u?.email).toLowerCase()
          if (ownerEmail && ownerEmail !== userEmail) return { ok: false, status: 403, error: 'Forbidden' as any }
        } catch {
        }
      }
      const updated = localSyncStore.updateShopLogoBySlug(slug, dataUrl)
      return { ok: true, status: 200, shop: updated }
    }

    const selectOwner = async (withOwnerEmail: boolean) => {
      const cols = withOwnerEmail ? 'id,slug,owner_email,email' : 'id,slug,email'
      return await supabase
        .from('shops')
        .select(cols)
        .eq('slug', slug)
        .maybeSingle()
    }

    let shopRes: any = await selectOwner(true)
    if (shopRes?.error) {
      const missing = parseMissingColumn(String(shopRes.error.message || ''))
      if (missing === 'owner_email') shopRes = await selectOwner(false)
    }
    if (shopRes?.error) return res.status(500).json({ success: false, error: String(shopRes.error.message || 'Erreur serveur') })
    const shop = shopRes?.data
    if (!shop?.slug) {
      const local = tryLocalSync()
      if (local.ok) {
        res.json({ success: true, logo_url: dataUrl })
        return
      }
      return res.status(local.status).json({ success: false, error: String(local.error || 'Boutique non trouvée') })
    }

    const owner = safeString(shop?.owner_email || shop?.email).toLowerCase()
    if (userEmail && owner && owner !== userEmail) return res.status(403).json({ success: false, error: 'Forbidden' })

    const safeSlug = slug.replace(/[^a-z0-9_-]+/gi, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '') || 'shop'
    const filePath = `shop-logos/${safeSlug}-${Date.now()}.${parsed.ext}`
    const uploadRes: any = await supabase
      .storage
      .from('boutique-images')
      .upload(filePath, parsed.buffer, { contentType: parsed.mime, upsert: true })

    if (uploadRes?.error) return res.status(500).json({ success: false, error: String(uploadRes.error.message || 'Upload failed') })

    const publicUrl = safeString(supabase.storage.from('boutique-images').getPublicUrl(filePath)?.data?.publicUrl)
    if (!publicUrl) return res.status(500).json({ success: false, error: 'Public URL unavailable' })

    const now = new Date().toISOString()
    const payload: any = { logo_url: publicUrl, updated_at: now }
    let cols = Object.keys(payload)
    let lastError: any = null
    for (let i = 0; i < 6; i++) {
      const candidate: any = {}
      cols.forEach((k) => { candidate[k] = payload[k] })
      const r: any = await supabase.from('shops').update(candidate).eq('slug', slug)
      if (!r?.error) {
        res.json({ success: true, logo_url: publicUrl })
        return
      }
      lastError = r.error
      const missing = parseMissingColumn(String(r.error.message || ''))
      if (!missing) break
      cols = cols.filter((c) => c !== missing)
      if (!cols.length) break
    }

    return res.status(500).json({ success: false, error: String(lastError?.message || 'Erreur serveur') })
  } catch {
    try {
      const allowDevBypass = isDevBypassAllowed(req)
      const slug = safeString(req.body?.slug)
      const dataUrl = safeString(req.body?.dataUrl || req.body?.data_url)
      const allowLocalSync = allowDevBypass || safeString(process.env.NODE_ENV).toLowerCase() !== 'production' || isTrustedDevRequest(req)
      if (allowLocalSync && slug && dataUrl) {
        const parsed = parseDataUrl(dataUrl)
        if (parsed?.buffer?.length && parsed.buffer.length <= 5 * 1024 * 1024) {
          localSyncStore.updateShopLogoBySlug(slug, dataUrl)
          res.json({ success: true, logo_url: dataUrl })
          return
        }
      }
    } catch {
    }
    res.status(500).json({ success: false, error: 'Erreur serveur' })
  }
})

router.post('/update', async (req, res) => {
  try {
    const token = getBearerToken(req)
    const allowDevBypass = isDevBypassAllowed(req)
    if (!token && !allowDevBypass) return res.status(401).json({ success: false, error: 'Missing Authorization bearer token' })

    const slug = safeString(req.body?.slug)
    if (!slug) return res.status(400).json({ success: false, error: 'Slug manquant' })

    const name = safeString(req.body?.name)
    const category = safeString(req.body?.category || req.body?.shop_category || req.body?.shopCategory)
    const logoUrl = safeString(req.body?.logo_url || req.body?.logoUrl)
    const primaryColor = safeString(req.body?.primary_color || req.body?.primaryColor)
    const secondaryColor = safeString(req.body?.secondary_color || req.body?.secondaryColor)
    const openTime = safeString(req.body?.open_time || req.body?.openTime)
    const closeTime = safeString(req.body?.close_time || req.body?.closeTime)
    const timezone = safeString(req.body?.timezone || req.body?.timeZone)
    const phone = safeString(req.body?.phone || req.body?.contact_phone || req.body?.contactPhone)
    const contactEmail = safeString(req.body?.contact_email || req.body?.contactEmail)

    let userEmail = ''
    if (token) {
      const userRes: any = await supabase.auth.getUser(token)
      userEmail = safeString(userRes?.data?.user?.email).toLowerCase()
      if (!userEmail) return res.status(401).json({ success: false, error: 'Invalid token' })
    }

    const selectOwner = async (withOwnerEmail: boolean) => {
      const cols = withOwnerEmail ? 'id,slug,owner_email,email' : 'id,slug,email'
      return await supabase
        .from('shops')
        .select(cols)
        .eq('slug', slug)
        .maybeSingle()
    }

    let shopRes: any = await selectOwner(true)
    if (shopRes?.error) {
      const missing = parseMissingColumn(String(shopRes.error.message || ''))
      if (missing === 'owner_email') shopRes = await selectOwner(false)
    }
    if (shopRes?.error) return res.status(500).json({ success: false, error: String(shopRes.error.message || 'Erreur serveur') })
    const shop = shopRes?.data
    if (!shop?.slug) return res.status(404).json({ success: false, error: 'Boutique non trouvée' })

    const owner = safeString(shop?.owner_email || shop?.email).toLowerCase()
    if (userEmail && owner && owner !== userEmail) return res.status(403).json({ success: false, error: 'Forbidden' })

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
    if (logoUrl) updatePayload.logo_url = logoUrl
    if (openTime) updatePayload.open_time = openTime
    if (closeTime) updatePayload.close_time = closeTime
    if (timezone) updatePayload.timezone = timezone
    if (phone) {
      updatePayload.phone = phone
      updatePayload.contact_phone = phone
    }
    if (contactEmail) updatePayload.contact_email = contactEmail

    let cols = Object.keys(updatePayload)
    let lastError: any = null
    for (let i = 0; i < 8; i++) {
      const candidate: any = {}
      cols.forEach((k) => { candidate[k] = updatePayload[k] })
      const r: any = await supabase.from('shops').update(candidate).eq('slug', slug)
      if (!r?.error) {
        lastError = null
        break
      }
      lastError = r.error
      const missing = parseMissingColumn(String(r.error.message || ''))
      if (!missing) break
      cols = cols.filter((c) => c !== missing)
      if (!cols.length) break
    }
    if (lastError) return res.status(500).json({ success: false, error: String(lastError?.message || 'Erreur serveur') })

    const selectUpdated = async (withOwnerEmail: boolean) => {
      let cols = withOwnerEmail
        ? 'id,slug,name,shop_name,category,shop_category,logo_url,primary_color,secondary_color,open_time,close_time,timezone,phone,contact_phone,contact_email,owner_email,email,updated_at'
        : 'id,slug,name,shop_name,category,shop_category,logo_url,primary_color,secondary_color,open_time,close_time,timezone,phone,contact_phone,contact_email,email,updated_at'

      for (let i = 0; i < 8; i++) {
        const r: any = await supabase
          .from('shops')
          .select(cols)
          .eq('slug', slug)
          .maybeSingle()
        if (!r?.error) return r

        const missing = parseMissingColumn(String(r.error.message || ''))
        if (!missing) return r
        if (missing === 'owner_email' && withOwnerEmail) {
          withOwnerEmail = false
          cols = 'id,slug,name,shop_name,category,shop_category,logo_url,primary_color,secondary_color,open_time,close_time,timezone,phone,contact_phone,contact_email,email,updated_at'
          continue
        }
        const parts = cols.split(',').map((c) => String(c || '').trim()).filter(Boolean)
        cols = parts.filter((c) => c !== missing).join(',')
        if (!cols) return r
      }
      return await supabase
        .from('shops')
        .select(cols)
        .eq('slug', slug)
        .maybeSingle()
    }

    const readRes: any = await selectUpdated(true)

    if (readRes?.error) return res.json({ success: true })
    res.json({ success: true, shop: readRes?.data || null })
  } catch {
    res.status(500).json({ success: false, error: 'Erreur serveur' })
  }
})

router.post('/create', async (req, res) => {
  try {
    const name = safeString(req.body?.name)
    const category = safeString(req.body?.category) || 'general'
    const ownerEmail = safeString(req.body?.ownerEmail || req.body?.owner_email || req.body?.email).toLowerCase()
    const ownerName = safeString(req.body?.ownerName || req.body?.owner_name)
    const requestedSlug = safeString(req.body?.slug)

    if (!name) return res.status(400).json({ success: false, error: 'Nom manquant' })

    let slugBase = slugify(requestedSlug || name)
    if (!slugBase) slugBase = `boutique-${Date.now()}`

    let slug = slugBase
    for (let i = 0; i < 4; i++) {
      const { data } = await selectOneBySlug(slug)
      if (!data) break
      const suffix = i === 0 ? String(Date.now()).slice(-6) : `${String(Date.now()).slice(-6)}-${i}`
      slug = `${slugBase}-${suffix}`.slice(0, 64)
    }

    const now = new Date().toISOString()

    const insertBase: any = {
      name,
      slug,
      category,
      status: 'pending',
      updated_at: now,
      created_at: now,
    }

    if (ownerEmail) {
      insertBase.owner_email = ownerEmail
      insertBase.email = ownerEmail
      insertBase.contact_email = ownerEmail
    }
    if (ownerName) insertBase.owner_name = ownerName

    const attempt = async (payload: any) => {
      return await supabase
        .from('shops')
        .insert(payload)
        .select('*')
        .single()
    }

    let r: any = await attempt(insertBase)
    if (r?.error) {
      const msg = String(r.error.message || '').toLowerCase()
      const missingOwnerEmail = msg.includes('could not find') && msg.includes('owner_email')
      const missingOwnerName = msg.includes('could not find') && msg.includes('owner_name')
      const missingStatus = msg.includes('could not find') && msg.includes('status')
      const missingUpdatedAt = msg.includes('could not find') && msg.includes('updated_at')
      const missingCreatedAt = msg.includes('could not find') && msg.includes('created_at')
      const missingCategory = msg.includes('could not find') && msg.includes('category')
      const missingContactEmail = msg.includes('could not find') && msg.includes('contact_email')

      const next = { ...insertBase }
      if (missingOwnerEmail) {
        delete next.owner_email
      }
      if (missingOwnerName) {
        delete next.owner_name
      }
      if (missingStatus) {
        delete next.status
      }
      if (missingUpdatedAt) {
        delete next.updated_at
      }
      if (missingCreatedAt) {
        delete next.created_at
      }
      if (missingCategory) {
        delete next.category
      }
      if (missingContactEmail) {
        delete next.contact_email
      }

      r = await attempt(next)
    }

    if (r?.error) return res.status(500).json({ success: false, error: r.error.message })

    if (shouldAutoProvisionConnectPlus()) {
      try {
        await connectPlusIssuer.ensure({ shopSlug: safeString(r?.data?.slug), origin: getOrigin(req) })
      } catch {
      }
    }

    res.json({ success: true, shop: r.data })
  } catch {
    res.status(500).json({ success: false, error: 'Erreur serveur' })
  }
})

router.post('/sync-local', async (req, res) => {
  try {
    const list = Array.isArray(req.body?.shops) ? req.body.shops : []
    const results: any[] = []
    for (const raw of list) {
      const name = safeString(raw?.name)
      const category = safeString(raw?.category) || 'general'
      const ownerEmail = safeString(raw?.ownerEmail || raw?.owner_email || raw?.email).toLowerCase()
      const ownerName = safeString(raw?.ownerName || raw?.owner_name)
      const requestedSlug = safeString(raw?.slug)
      if (!name && !requestedSlug) continue

      const slugBase = slugify(requestedSlug || name)
      if (!slugBase) continue

      const existing = await selectOneBySlug(slugBase)
      if (existing?.data?.slug) {
        if (shouldAutoProvisionConnectPlus()) {
          try {
            await connectPlusIssuer.ensure({ shopSlug: safeString(existing.data.slug), origin: getOrigin(req) })
          } catch {
          }
        }
        results.push({ slug: slugBase, id: existing.data.id, action: 'exists' })
        continue
      }

      const now = new Date().toISOString()
      const insertBase: any = {
        name: name || slugBase,
        slug: slugBase,
        category,
        status: 'pending',
        updated_at: now,
        created_at: now,
      }
      if (ownerEmail) {
        insertBase.owner_email = ownerEmail
        insertBase.email = ownerEmail
        insertBase.contact_email = ownerEmail
      }
      if (ownerName) insertBase.owner_name = ownerName

      let r: any = await supabase.from('shops').insert(insertBase).select('id,slug').single()
      if (r?.error) {
        const payload = { ...insertBase }
        for (let i = 0; i < 6; i++) {
          const missing = parseMissingColumn(String(r?.error?.message || ''))
          if (!missing) break
          delete (payload as any)[missing]
          r = await supabase.from('shops').insert(payload).select('id,slug').single()
          if (!r?.error) break
        }
      }
      if (r?.error) {
        results.push({ slug: slugBase, error: r.error.message, action: 'error' })
        continue
      }

      if (shouldAutoProvisionConnectPlus()) {
        try {
          await connectPlusIssuer.ensure({ shopSlug: safeString(r?.data?.slug), origin: getOrigin(req) })
        } catch {
        }
      }
      results.push({ slug: r.data.slug, id: r.data.id, action: 'created' })
    }

    res.json({ success: true, results })
  } catch {
    res.status(500).json({ success: false, error: 'Erreur serveur' })
  }
})

export default router
