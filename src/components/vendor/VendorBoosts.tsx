import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { buildApiUrl } from '../../config/api'
import { supabase } from '../../config/supabase'
import { toast } from 'sonner'

type BoostKind = 'sponsored' | 'promo' | 'new'

type PricingProduct = {
  kind: BoostKind
  durationHours: number
  priceXof: number
  currency: string
  title: string
  description: string
  sponsoredTier?: number | null
  active?: boolean
}

type BoostOrder = {
  id: string
  vendor_id: string
  vendor_kind: string
  boost_kind: BoostKind
  duration_hours: number
  amount_xof: number
  currency: string
  status: string
  expires_at: string | null
  created_at: string
}

type VendorTarget = {
  vendorId: string
  vendorKind: 'shop' | 'provider'
  name: string
  slug?: string
}

type VendorBoostRow = {
  vendor_id: string
  vendor_kind: string
  sponsored_until: string | null
  sponsored_tier: 'bronze' | 'argent' | 'or' | null
  promo_until: string | null
  new_until: string | null
  updated_at: string
}

type LocalBoostConfig = {
  sponsoredUntil?: number | null
  sponsoredTier?: number | null
  promoUntil?: number | null
  newUntil?: number | null
}

const LOCAL_CREDITS_PREFIX = 'mangoo_boost_credits:'
const LOCAL_ORDERS_PREFIX = 'mangoo_boost_orders:'
const LOCAL_CONFIG_KEY = 'mangoo_boost_config'
const TARGET_PREF_KEY = 'mangoo_boost_target:'
const PENDING_BOOST_PREFIX = 'mangoo_boost_pending:'

function safeNowMs() {
  return Date.now()
}

function readLocalCredits(email: string): number {
  try {
    const key = `${LOCAL_CREDITS_PREFIX}${String(email || '').trim().toLowerCase()}`
    const raw = localStorage.getItem(key)
    const n = Number(raw)
    return Number.isFinite(n) ? Math.floor(n) : 0
  } catch {
    return 0
  }
}

function writeLocalCredits(email: string, value: number) {
  try {
    const key = `${LOCAL_CREDITS_PREFIX}${String(email || '').trim().toLowerCase()}`
    localStorage.setItem(key, String(Math.max(0, Math.floor(Number(value) || 0))))
  } catch {
  }
}

function readLocalBoostConfig(): Record<string, LocalBoostConfig> {
  try {
    const raw = localStorage.getItem(LOCAL_CONFIG_KEY)
    const parsed = raw ? JSON.parse(raw) : {}
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function writeLocalBoostConfig(next: Record<string, LocalBoostConfig>) {
  try {
    localStorage.setItem(LOCAL_CONFIG_KEY, JSON.stringify(next || {}))
  } catch {
  }
}

function readLocalOrders(email: string): BoostOrder[] {
  try {
    const key = `${LOCAL_ORDERS_PREFIX}${String(email || '').trim().toLowerCase()}`
    const raw = localStorage.getItem(key)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? (parsed as BoostOrder[]) : []
  } catch {
    return []
  }
}

function writeLocalOrders(email: string, orders: BoostOrder[]) {
  try {
    const key = `${LOCAL_ORDERS_PREFIX}${String(email || '').trim().toLowerCase()}`
    localStorage.setItem(key, JSON.stringify(Array.isArray(orders) ? orders : []))
  } catch {
  }
}

function tierLabelFromNumber(tier: number | null | undefined): VendorBoostRow['sponsored_tier'] {
  const n = Number(tier || 0)
  if (n === 3) return 'or'
  if (n === 2) return 'argent'
  if (n === 1) return 'bronze'
  return null
}

function slugifyValue(value: string) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function parseMs(value: any): number {
  const t = value ? Date.parse(String(value)) : NaN
  return Number.isFinite(t) ? t : 0
}

function mergeBoostRows(rows: VendorBoostRow[]): VendorBoostRow | null {
  const list = Array.isArray(rows) ? rows.filter(Boolean) : []
  if (!list.length) return null
  const first = list[0]
  const merged: VendorBoostRow = {
    vendor_id: String(first.vendor_id),
    vendor_kind: String(first.vendor_kind),
    sponsored_until: null,
    sponsored_tier: null,
    promo_until: null,
    new_until: null,
    updated_at: String(first.updated_at || new Date().toISOString()),
  }
  for (const r of list) {
    const sA = parseMs(merged.sponsored_until)
    const sB = parseMs(r?.sponsored_until)
    if (sB > sA) {
      merged.sponsored_until = r?.sponsored_until || null
      merged.sponsored_tier = (r as any)?.sponsored_tier ?? merged.sponsored_tier
    }
    const pA = parseMs(merged.promo_until)
    const pB = parseMs(r?.promo_until)
    if (pB > pA) merged.promo_until = r?.promo_until || null
    const nA = parseMs(merged.new_until)
    const nB = parseMs(r?.new_until)
    if (nB > nA) merged.new_until = r?.new_until || null
    const uA = parseMs(merged.updated_at)
    const uB = parseMs(r?.updated_at)
    if (uB > uA) merged.updated_at = String(r?.updated_at || merged.updated_at)
    if (!merged.sponsored_tier && (r as any)?.sponsored_tier) merged.sponsored_tier = (r as any).sponsored_tier
  }
  return merged
}

function mergeOrders(remote: BoostOrder[], local: BoostOrder[]): BoostOrder[] {
  const a = Array.isArray(remote) ? remote : []
  const b = Array.isArray(local) ? local : []
  const map = new Map<string, BoostOrder>()
  for (const o of [...b, ...a]) {
    const id = String(o?.id || '')
    if (!id) continue
    map.set(id, o)
  }
  return Array.from(map.values()).sort((x, y) => parseMs(y.created_at) - parseMs(x.created_at))
}

function makeLocalOrder(params: {
  email: string
  vendorId: string
  vendorKind: string
  kind: BoostKind
  durationHours: number
  amountXof: number
  currency: string
  expiresAtIso: string | null
}): BoostOrder {
  const nowIso = new Date().toISOString()
  const suffix = Math.random().toString(16).slice(2, 8)
  return {
    id: `local_${Date.now()}_${suffix}`,
    vendor_id: params.vendorId,
    vendor_kind: params.vendorKind,
    boost_kind: params.kind,
    duration_hours: Math.floor(Number(params.durationHours || 0)),
    amount_xof: Math.floor(Number(params.amountXof || 0)),
    currency: String(params.currency || 'XOF'),
    status: 'active',
    expires_at: params.expiresAtIso,
    created_at: nowIso,
  }
}

async function resolveShopAliases(params: { vendorId: string; vendorKind: string; slug?: string | null; userEmail?: string | null }) {
  const vendorKind = String(params.vendorKind || '').trim().toLowerCase()
  const vendorId = String(params.vendorId || '').trim()
  const slug = String(params.slug || '').trim()
  const ids = new Set<string>()
  if (vendorId) ids.add(vendorId)
  if (vendorKind !== 'shop') return { vendorKind, vendorIds: Array.from(ids) }

  const userEmail = String(params.userEmail || '').trim().toLowerCase()
  if (userEmail && userEmail.includes('@')) ids.add(`local-${userEmail}`)

  try {
    if (slug) {
      const r = await supabase.from('shops').select('id,slug,email').eq('slug', slug).maybeSingle()
      if (!r?.error && r?.data) {
        const shopId = String((r.data as any)?.id || '').trim()
        const email = String((r.data as any)?.email || '').trim().toLowerCase()
        if (shopId) ids.add(shopId)
        if (email) ids.add(`local-${email}`)
      }
    }
  } catch {
  }

  return { vendorKind, vendorIds: Array.from(ids) }
}

function pickCanonicalVendorId(vendorIds: string[]): string {
  const list = Array.isArray(vendorIds) ? vendorIds : []
  const nonLocal = list.find((x) => x && !String(x).startsWith('local-'))
  return nonLocal || list[0] || ''
}

async function upsertVendorBoostRow(params: {
  vendorKind: string
  vendorId: string
  kind: BoostKind
  durationHours: number
  sponsoredTier?: number | null
  shopSlug?: string | null
}) {
  try {
    const vendorKind = String(params.vendorKind || 'shop')
    const vendorId = String(params.vendorId || '')
    if (!vendorId) return

    const nowMs = Date.now()
    const hoursMs = Math.max(0, Number(params.durationHours || 0)) * 60 * 60 * 1000
    const field = params.kind === 'sponsored' ? 'sponsored_until' : params.kind === 'promo' ? 'promo_until' : 'new_until'

    let baseMs = nowMs
    try {
      const current = await supabase
        .from('vendor_boosts')
        .select('sponsored_until,promo_until,new_until')
        .eq('vendor_kind', vendorKind)
        .eq('vendor_id', vendorId)
        .maybeSingle()
      const rawIso = current?.data?.[field]
      const t = rawIso ? Date.parse(String(rawIso)) : NaN
      if (Number.isFinite(t) && t > nowMs) baseMs = t
    } catch {
    }

    const until = new Date(baseMs + hoursMs).toISOString()
    const payload: any = {
      vendor_kind: vendorKind,
      vendor_id: vendorId,
      updated_at: new Date().toISOString(),
    }
    if (params.kind === 'sponsored') {
      payload.sponsored_until = until
      payload.sponsored_tier = tierLabelFromNumber(params.sponsoredTier ?? null)
    } else if (params.kind === 'promo') {
      payload.promo_until = until
    } else {
      payload.new_until = until
    }
    await supabase.from('vendor_boosts').upsert(payload, { onConflict: 'vendor_kind,vendor_id' })

    if (vendorKind === 'shop' && vendorId.startsWith('local-')) {
      const email = vendorId.slice(6)
      const candidateSlug = String(params.shopSlug || '').trim() || slugifyValue(email.includes('@') ? email.split('@')[0] : email) || null

      const resolveBySlug = async () => {
        const slug = String(candidateSlug || '').trim()
        if (!slug) return ''
        const r = await supabase.from('shops').select('id,slug').eq('slug', slug).maybeSingle()
        if (r?.error) return ''
        return String(r?.data?.id || '').trim()
      }

      const resolveByEmail = async () => {
        if (!email.includes('@')) return ''
        const attempt = async (withOwnerEmail: boolean) => {
          const q = supabase
            .from('shops')
            .select('id,owner_email,email,created_at')
            .order('created_at', { ascending: false })
            .limit(1)
          if (withOwnerEmail) return await q.or(`owner_email.eq.${email},email.eq.${email}`)
          return await q.eq('email', email)
        }
        let r: any = await attempt(true)
        if (r?.error) {
          const msg = String(r.error.message || '').toLowerCase()
          const missingOwnerEmail = msg.includes('could not find') && msg.includes('owner_email')
          if (missingOwnerEmail) r = await attempt(false)
        }
        return String(Array.isArray(r?.data) ? r.data[0]?.id : '').trim()
      }

      try {
        const shopId = (await resolveBySlug()) || (await resolveByEmail())
        if (shopId) {
          await supabase.from('vendor_boosts').upsert({ ...payload, vendor_id: shopId }, { onConflict: 'vendor_kind,vendor_id' })
        }
      } catch {
      }
    }
  } catch {
  }
}

const fallbackPricing: PricingProduct[] = [
  { kind: 'sponsored', durationHours: 24, priceXof: 2000, currency: 'XOF', title: 'Sponsorisé 24h (Bronze)', description: 'Plus de visibilité sur les écrans de découverte.', sponsoredTier: 1, active: true },
  { kind: 'sponsored', durationHours: 72, priceXof: 5000, currency: 'XOF', title: 'Sponsorisé 3j (Argent)', description: 'Plus de visibilité sur les écrans de découverte.', sponsoredTier: 2, active: true },
  { kind: 'sponsored', durationHours: 168, priceXof: 12000, currency: 'XOF', title: 'Sponsorisé 7j (Or)', description: 'Maximum de visibilité sur les écrans de découverte.', sponsoredTier: 3, active: true },
  { kind: 'promo', durationHours: 72, priceXof: 3000, currency: 'XOF', title: 'Promo 3j', description: 'Offres mises en avant pour déclencher l’achat.', active: true },
  { kind: 'new', durationHours: 48, priceXof: 1000, currency: 'XOF', title: 'Nouveau 48h', description: 'Nouvelles boutiques mises en lumière.', active: true },
]

const formatXof = (value: number) => {
  const n = Math.floor(Number(value) || 0)
  return new Intl.NumberFormat('fr-FR').format(n)
}

const kindLabel: Record<BoostKind, string> = {
  sponsored: 'Sponsorisé',
  promo: 'Promo',
  new: 'Nouveau'
}

const formatRemaining = (iso: string | null) => {
  if (!iso) return '—'
  const t = Date.parse(String(iso))
  if (!Number.isFinite(t)) return '—'
  const diff = t - Date.now()
  if (diff <= 0) return 'Expiré'
  const mins = Math.floor(diff / 60000)
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (h <= 0) return `${m} min`
  return `${h} h ${String(m).padStart(2, '0')} min`
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    const parsed = JSON.parse(raw)
    return (parsed ?? fallback) as T
  } catch {
    return fallback
  }
}

export function VendorBoosts({ userEmail }: { userEmail: string }) {
  const [targets, setTargets] = useState<VendorTarget[]>([])
  const [targetKey, setTargetKey] = useState('')
  const [pricing, setPricing] = useState<PricingProduct[]>([])
  const [balanceXof, setBalanceXof] = useState<number | null>(null)
  const [balanceStatus, setBalanceStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [orders, setOrders] = useState<BoostOrder[]>([])
  const [boostRow, setBoostRow] = useState<VendorBoostRow | null>(null)
  const [activeKind, setActiveKind] = useState<BoostKind>('sponsored')
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [topupOpen, setTopupOpen] = useState(false)
  const [topupAmount, setTopupAmount] = useState(5000)
  const [topupBusy, setTopupBusy] = useState(false)
  const [topupMethod, setTopupMethod] = useState<'mobile_money' | 'card'>('mobile_money')
  const [topupOperator, setTopupOperator] = useState<'orange_money' | 'mtn' | 'moov' | 'wave'>('orange_money')
  const [topupPhone, setTopupPhone] = useState('')
  const loadSeqRef = useRef(0)
  const loadLockRef = useRef(false)

  const selectedTarget = useMemo(() => {
    const [vendorKind, vendorId] = String(targetKey || '').split(':')
    if (!vendorKind || !vendorId) return null
    return targets.find((t) => t.vendorKind === vendorKind && t.vendorId === vendorId) || null
  }, [targetKey, targets])

  const preferredTargetKey = useMemo(() => {
    const email = String(userEmail || '').trim().toLowerCase()
    if (!email) return ''
    try {
      const raw = localStorage.getItem(`${TARGET_PREF_KEY}${email}`)
      return raw ? String(raw) : ''
    } catch {
      return ''
    }
  }, [userEmail])

  const currentUserShopTarget = useMemo(() => {
    const email = String(userEmail || '').trim().toLowerCase()
    if (!email) return null
    try {
      const raw = localStorage.getItem('mangoo-current-user')
      const parsed = raw ? JSON.parse(raw) : null
      const parsedEmail = String(parsed?.email || '').trim().toLowerCase()
      if (!parsed || parsedEmail !== email) return null
      const label = String(parsed?.shopName || parsed?.shop_name || parsed?.name || '').trim()
      if (!label) return null
      const explicitId = String(parsed?.shopId || parsed?.shop_id || parsed?.vendorId || parsed?.vendor_id || '').trim()
      const vendorId = explicitId || `local-${email}`
      return { vendorId, vendorKind: 'shop' as const, name: label }
    } catch {
      return null
    }
  }, [userEmail])

  const computeTargets = useCallback(async () => {
    const email = String(userEmail || '').trim().toLowerCase()
    const catalog = readJson<any[]>('mangoo_local_vendors_catalog', [])
    let shopIds: string[] = []
    try {
      const raw = localStorage.getItem(`mangoo_my_shop_ids:${email}`)
      const parsed = raw ? JSON.parse(raw) : []
      shopIds = Array.isArray(parsed) ? parsed.map((x) => String(x)) : []
    } catch {
      shopIds = []
    }
    if (!shopIds.length) {
      const legacy = localStorage.getItem('mangoo_my_shop_id')
      if (legacy) shopIds = [String(legacy)]
    }

    let providerIds: string[] = []
    try {
      const raw = localStorage.getItem(`mangoo_my_provider_ids:${email}`)
      const parsed = raw ? JSON.parse(raw) : []
      providerIds = Array.isArray(parsed) ? parsed.map((x) => String(x)) : []
    } catch {
      providerIds = []
    }
    if (!providerIds.length) {
      const legacy = localStorage.getItem('mangoo_my_provider_id')
      if (legacy) providerIds = [String(legacy)]
    }

    const demoShopTargets: VendorTarget[] = []
    try {
      const raw = localStorage.getItem('demo_shops')
      const parsed = raw ? JSON.parse(raw) : []
      const shops = Array.isArray(parsed) ? parsed : []
      for (const s of shops) {
        const ownerEmail = String(s?.ownerEmail || s?.owner_email || s?.email || '').trim().toLowerCase()
        if (!ownerEmail || ownerEmail !== email) continue
        const sourceVendorId = s?.sourceVendorId ?? s?.source_vendor_id
        const idRaw = sourceVendorId ?? s?.id
        if (idRaw === undefined || idRaw === null) continue
        const vendorId = String(idRaw).startsWith('shop-') ? String(idRaw).slice(5) : String(idRaw)
        if (!vendorId) continue
        const name = String(s?.name || `Boutique ${vendorId}`)
        demoShopTargets.push({ vendorId, vendorKind: 'shop', name })
      }
    } catch {
    }

    const supabaseShopTargets: VendorTarget[] = []
    if (email) {
      try {
        const attempt = async (withOwnerEmail: boolean) => {
          const q = supabase
            .from('shops')
            .select('id,name,slug,owner_email,email,created_at')
            .order('created_at', { ascending: false })
            .limit(20)

          if (withOwnerEmail) return await q.or(`owner_email.eq.${email},email.eq.${email}`)
          return await q.eq('email', email)
        }

        let r: any = await attempt(true)
        if (r?.error) {
          const msg = String(r.error.message || '').toLowerCase()
          const missingOwnerEmail = msg.includes('could not find') && msg.includes('owner_email')
          if (missingOwnerEmail) r = await attempt(false)
        }

        const rows = Array.isArray(r?.data) ? r.data : []
        for (const s of rows as any[]) {
          const idRaw = s?.id
          const vendorId = idRaw ? String(idRaw) : ''
          if (!vendorId) continue
          const name = String(s?.name || `Boutique ${vendorId}`)
          const slug = String(s?.slug || '').trim()
          supabaseShopTargets.push({ vendorId, vendorKind: 'shop', name, ...(slug ? { slug } : {}) })
        }
      } catch {
      }
    }

    const list: VendorTarget[] = []
    for (const id of shopIds) {
      const v = catalog.find((x) => String(x?.id) === String(id) && String(x?.kind || 'shop') === 'shop')
      list.push({ vendorId: String(id), vendorKind: 'shop', name: String(v?.name || `Boutique ${id}`) })
    }
    for (const id of providerIds) {
      const v = catalog.find((x) => String(x?.id) === String(id) && String(x?.kind || '').toLowerCase() === 'service')
      list.push({ vendorId: String(id), vendorKind: 'provider', name: String(v?.name || `Prestataire ${id}`) })
    }

    const currentLooksLocal = Boolean(currentUserShopTarget && String(currentUserShopTarget.vendorId || '').startsWith('local-'))
    if (currentUserShopTarget && !(currentLooksLocal && supabaseShopTargets.length)) list.push(currentUserShopTarget)
    for (const t of demoShopTargets) list.push(t)
    for (const t of supabaseShopTargets) list.push(t)
    const uniq = new Map<string, VendorTarget>()
    for (const t of list) uniq.set(`${t.vendorKind}:${t.vendorId}`, t)
    const finalList = Array.from(uniq.values()).sort((a, b) => {
      const aCurrent = currentUserShopTarget && a.vendorKind === currentUserShopTarget.vendorKind && a.vendorId === currentUserShopTarget.vendorId
      const bCurrent = currentUserShopTarget && b.vendorKind === currentUserShopTarget.vendorKind && b.vendorId === currentUserShopTarget.vendorId
      if (aCurrent && !bCurrent) return -1
      if (!aCurrent && bCurrent) return 1
      return String(a.name || '').localeCompare(String(b.name || ''), 'fr', { sensitivity: 'base' })
    })
    setTargets(finalList)
    const exists = targetKey ? finalList.some((t) => `${t.vendorKind}:${t.vendorId}` === targetKey) : false
    if ((!targetKey || !exists) && finalList.length) {
      const currentMatch = currentUserShopTarget
        ? finalList.find((t) => t.vendorKind === currentUserShopTarget.vendorKind && t.vendorId === currentUserShopTarget.vendorId)
        : null
      const preferredMatch = preferredTargetKey
        ? finalList.find((t) => `${t.vendorKind}:${t.vendorId}` === preferredTargetKey)
        : null
      const target = currentMatch || preferredMatch || finalList[0]
      setTargetKey(`${target.vendorKind}:${target.vendorId}`)
    }
  }, [currentUserShopTarget, preferredTargetKey, targetKey, userEmail])

  const getToken = useCallback(async () => {
    const { data } = await supabase.auth.getSession()
    return data.session?.access_token || ''
  }, [])

  const getUserId = useCallback(async () => {
    const { data } = await supabase.auth.getSession()
    return data.session?.user?.id || ''
  }, [])

  const fetchJsonOnce = useCallback(async (endpoint: string, init: RequestInit, timeoutMs: number) => {
    const url = buildApiUrl(endpoint)
    const controller = new AbortController()
    const t = window.setTimeout(() => controller.abort(), timeoutMs)
    try {
      const res = await fetch(url, { ...init, signal: controller.signal })
      const text = await res.text()
      let json: any = null
      try {
        json = text ? JSON.parse(text) : null
      } catch {
        json = null
      }
      return { ok: res.ok, status: res.status, json }
    } catch (e: any) {
      const name = String(e?.name || '')
      if (name === 'AbortError') return { ok: false, status: 0, json: null }
      throw e
    } finally {
      window.clearTimeout(t)
    }
  }, [])

  const loadPricingFromSupabase = useCallback(async () => {
    const { data, error } = await supabase
      .from('boost_products')
      .select('kind, duration_hours, price_xof, currency, title, description, sponsored_tier, active')
      .eq('active', true)
    if (error) throw error
    const rows = Array.isArray(data) ? data : []
    const normalized: PricingProduct[] = rows
      .map((p: any) => {
        const kind = String(p?.kind || '').trim().toLowerCase()
        if (kind !== 'sponsored' && kind !== 'promo' && kind !== 'new') return null
        return {
          kind,
          durationHours: Number(p?.duration_hours),
          priceXof: Number(p?.price_xof),
          currency: String(p?.currency || 'XOF'),
          title: String(p?.title || ''),
          description: String(p?.description || ''),
          sponsoredTier: p?.sponsored_tier ?? null,
          active: p?.active ?? true,
        } as PricingProduct
      })
      .filter(Boolean) as PricingProduct[]
    return normalized
  }, [])

  const loadCreditsFromSupabase = useCallback(async () => {
    const userId = await getUserId()
    if (!userId) return null
    const { data, error } = await supabase
      .from('user_credits')
      .select('amount, expires_at, used_at')
      .eq('user_id', userId)
    if (error) throw error
    const rows = Array.isArray(data) ? data : []
    const now = Date.now()
    let sum = 0
    for (const r of rows) {
      if (r?.used_at) continue
      const exp = r?.expires_at ? Date.parse(String(r.expires_at)) : Number.POSITIVE_INFINITY
      if (Number.isFinite(exp) && exp <= now) continue
      sum += Number(r?.amount || 0)
    }
    return sum
  }, [getUserId])

  const loadOrdersFromSupabase = useCallback(async (vendorId: string, vendorKind: string) => {
    const aliases = await resolveShopAliases({ vendorId, vendorKind, slug: selectedTarget?.slug || null, userEmail })
    let q = supabase
      .from('boost_orders')
      .select('id, vendor_id, vendor_kind, boost_kind, duration_hours, amount_xof, currency, status, expires_at, created_at')
      .eq('vendor_kind', aliases.vendorKind)
      .order('created_at', { ascending: false })
      .limit(30)
    if (aliases.vendorIds.length) q = q.in('vendor_id', aliases.vendorIds)
    const { data, error } = await q
    if (error) throw error
    return (Array.isArray(data) ? data : []) as any as BoostOrder[]
  }, [selectedTarget?.slug, userEmail])

  const loadBoostRowFromSupabase = useCallback(async (vendorId: string, vendorKind: string) => {
    const aliases = await resolveShopAliases({ vendorId, vendorKind, slug: selectedTarget?.slug || null, userEmail })
    let q = supabase
      .from('vendor_boosts')
      .select('vendor_id, vendor_kind, sponsored_until, sponsored_tier, promo_until, new_until, updated_at')
      .eq('vendor_kind', aliases.vendorKind)
      .limit(20)
    if (aliases.vendorIds.length) q = q.in('vendor_id', aliases.vendorIds)
    const { data, error } = await q
    if (error) throw error
    const rows = Array.isArray(data) ? (data as any as VendorBoostRow[]) : []
    return mergeBoostRows(rows)
  }, [selectedTarget?.slug, userEmail])

  const load = useCallback(async () => {
    if (loadLockRef.current) return
    loadLockRef.current = true
    const seq = ++loadSeqRef.current
    setLoading(true)
    setError(null)
    try {
      await computeTargets()

      const token = await getToken()

      let normalizedPricing: PricingProduct[] = []
      const pricingRes = await fetchJsonOnce('/api/boosts/pricing', { method: 'GET' }, 9000)
      if (seq !== loadSeqRef.current) return
      if (pricingRes.ok && Array.isArray(pricingRes.json?.products)) {
        const products = pricingRes.json.products
        normalizedPricing = (products
          .map((p: any) => {
            const kind = String(p?.kind || '').trim().toLowerCase()
            if (kind !== 'sponsored' && kind !== 'promo' && kind !== 'new') return null
            return {
              kind,
              durationHours: Number(p.durationHours),
              priceXof: Number(p.priceXof),
              currency: String(p.currency || 'XOF'),
              title: String(p.title || ''),
              description: String(p.description || ''),
              sponsoredTier: p.sponsoredTier ?? null,
              active: p.active ?? true,
            } as PricingProduct
          })
          .filter(Boolean) as PricingProduct[])
      } else {
        if (token) {
          try {
            normalizedPricing = await loadPricingFromSupabase()
          } catch {
            normalizedPricing = []
          }
        } else {
          normalizedPricing = []
        }
      }
      setPricing(normalizedPricing)

      const emailLower = String(userEmail || '').trim().toLowerCase()
      const localCredits = emailLower ? readLocalCredits(emailLower) : 0

      if (!token) {
        const email = String(userEmail || '').trim().toLowerCase()

        if (!normalizedPricing.length) setPricing(fallbackPricing)

        if (selectedTarget) {
          let row: VendorBoostRow | null = null
          try {
            const qs = new URLSearchParams({ vendorId: selectedTarget.vendorId, vendorKind: selectedTarget.vendorKind })
            const rowRes = await fetchJsonOnce(`/api/boosts/vendor-boosts?${qs.toString()}`, { method: 'GET' }, 6000)
            if (seq !== loadSeqRef.current) return
            if (rowRes.ok) row = (rowRes.json?.row || null) as VendorBoostRow | null
          } catch {
            row = null
          }

          if (!row) {
            const cfg = readLocalBoostConfig()[String(selectedTarget.vendorId)] || {}
            const toIso = (ms?: number | null) => {
              const n = Number(ms || 0)
              return Number.isFinite(n) && n > 0 ? new Date(n).toISOString() : null
            }
            row = {
              vendor_id: String(selectedTarget.vendorId),
              vendor_kind: String(selectedTarget.vendorKind),
              sponsored_until: toIso(cfg.sponsoredUntil),
              sponsored_tier: tierLabelFromNumber(cfg.sponsoredTier ?? null),
              promo_until: toIso(cfg.promoUntil),
              new_until: toIso(cfg.newUntil),
              updated_at: new Date().toISOString(),
            }
          }
          setBoostRow(row)
        } else {
          setBoostRow(null)
        }

        setBalanceStatus('ready')
        setBalanceXof(email ? readLocalCredits(email) : 0)

        if (selectedTarget && email) {
          const all = readLocalOrders(email)
          setOrders(all.filter((o) => String(o?.vendor_id || '') === String(selectedTarget.vendorId) && String(o?.vendor_kind || '') === String(selectedTarget.vendorKind)).slice(0, 50))
        } else {
          setOrders([])
        }
        return
      }

      if (selectedTarget) {
        const row = await loadBoostRowFromSupabase(selectedTarget.vendorId, selectedTarget.vendorKind)
        if (seq !== loadSeqRef.current) return
        setBoostRow(row)
      } else {
        setBoostRow(null)
      }

      try {
        setBalanceStatus('loading')
        if (localCredits > 0) {
          setBalanceXof(localCredits)
          setBalanceStatus('ready')
        }
        const creditRes = await fetchJsonOnce(
          '/api/boosts/credits-balance',
          { method: 'GET', headers: { Authorization: `Bearer ${token}` } },
          6000
        )
        if (seq !== loadSeqRef.current) return
        if (creditRes.ok) {
          const remote = Number(creditRes.json?.balanceXof || 0)
          setBalanceXof(Math.max(remote, localCredits))
          setBalanceStatus('ready')
        } else {
          const remote = await loadCreditsFromSupabase()
          setBalanceXof(Math.max(Number(remote || 0), localCredits))
          setBalanceStatus('ready')
        }
      } catch {
        if (seq !== loadSeqRef.current) return
        const remote = await loadCreditsFromSupabase()
        setBalanceXof(Math.max(Number(remote || 0), localCredits))
        setBalanceStatus('ready')
      }

      if (selectedTarget) {
        try {
          const qs = new URLSearchParams({ vendorId: selectedTarget.vendorId, vendorKind: selectedTarget.vendorKind })
          const ordersRes = await fetchJsonOnce(
            `/api/boosts/my-orders?${qs.toString()}`,
            { method: 'GET', headers: { Authorization: `Bearer ${token}` } },
            6000
          )
          if (seq !== loadSeqRef.current) return
          if (ordersRes.ok) {
            const rows = Array.isArray(ordersRes.json?.orders) ? ordersRes.json.orders : []
            const email = String(userEmail || '').trim().toLowerCase()
            const local = email ? readLocalOrders(email) : []
            const aliases = await resolveShopAliases({ vendorId: selectedTarget.vendorId, vendorKind: selectedTarget.vendorKind, slug: selectedTarget.slug || null, userEmail })
            const filteredLocal = local.filter((o) => {
              if (String(o?.vendor_kind || '') !== String(selectedTarget.vendorKind)) return false
              const id = String(o?.vendor_id || '')
              return aliases.vendorIds.includes(id)
            })
            setOrders(mergeOrders(rows as BoostOrder[], filteredLocal))
          } else {
            const remote = await loadOrdersFromSupabase(selectedTarget.vendorId, selectedTarget.vendorKind)
            const email = String(userEmail || '').trim().toLowerCase()
            const local = email ? readLocalOrders(email) : []
            const aliases = await resolveShopAliases({ vendorId: selectedTarget.vendorId, vendorKind: selectedTarget.vendorKind, slug: selectedTarget.slug || null, userEmail })
            const filteredLocal = local.filter((o) => {
              if (String(o?.vendor_kind || '') !== String(selectedTarget.vendorKind)) return false
              const id = String(o?.vendor_id || '')
              return aliases.vendorIds.includes(id)
            })
            setOrders(mergeOrders(remote, filteredLocal))
          }
        } catch {
          if (seq !== loadSeqRef.current) return
          const remote = await loadOrdersFromSupabase(selectedTarget.vendorId, selectedTarget.vendorKind)
          const email = String(userEmail || '').trim().toLowerCase()
          const local = email ? readLocalOrders(email) : []
          const aliases = await resolveShopAliases({ vendorId: selectedTarget.vendorId, vendorKind: selectedTarget.vendorKind, slug: selectedTarget.slug || null, userEmail })
          const filteredLocal = local.filter((o) => {
            if (String(o?.vendor_kind || '') !== String(selectedTarget.vendorKind)) return false
            const id = String(o?.vendor_id || '')
            return aliases.vendorIds.includes(id)
          })
          setOrders(mergeOrders(remote, filteredLocal))
        }
      }
    } catch (e: any) {
      setError(e?.message || 'Erreur chargement Boost')
    } finally {
      setLoading(false)
      loadLockRef.current = false
    }
  }, [computeTargets, fetchJsonOnce, getToken, loadBoostRowFromSupabase, loadCreditsFromSupabase, loadOrdersFromSupabase, loadPricingFromSupabase, selectedTarget, userEmail])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!selectedTarget) return
    load()
  }, [selectedTarget?.vendorId, selectedTarget?.vendorKind])

  useEffect(() => {
    try {
      const email = String(userEmail || '').trim().toLowerCase()
      if (email && selectedTarget?.vendorId && selectedTarget?.vendorKind) {
        localStorage.setItem(`${TARGET_PREF_KEY}${email}`, `${selectedTarget.vendorKind}:${selectedTarget.vendorId}`)
      }
    } catch {
    }
  }, [selectedTarget?.vendorId, selectedTarget?.vendorKind, userEmail])

  const topup = useCallback(async () => {
    if (topupBusy) return
    const email = String(userEmail || '').trim().toLowerCase()
    if (!email || !email.includes('@')) {
      setError('Email vendeur manquant. Associe ton compte avant de recharger.')
      return
    }
    const amount = Math.floor(Number(topupAmount || 0))
    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Montant invalide')
      return
    }
    setTopupBusy(true)
    setError(null)
    try {
      const res = await fetchJsonOnce(
        '/api/boosts/credits/topup-local',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, amount_xof: amount })
        },
        9000
      )
      if (res.ok && res.json?.success) {
        setBalanceXof(Number(res.json?.balanceXof ?? balanceXof ?? 0))
        setBalanceStatus('ready')
        toast.success(`Crédits rechargés: +${formatXof(amount)} XOF`)
        setTopupOpen(false)
        await load()
        return
      }

      const next = readLocalCredits(email) + amount
      writeLocalCredits(email, next)
      setBalanceXof(next)
      setBalanceStatus('ready')
      toast.success(`Crédits rechargés: +${formatXof(amount)} XOF`)
      setTopupOpen(false)
      await load()
    } catch (e: any) {
      const next = readLocalCredits(email) + amount
      writeLocalCredits(email, next)
      setBalanceXof(next)
      setBalanceStatus('ready')
      toast.success(`Crédits rechargés: +${formatXof(amount)} XOF`)
      setTopupOpen(false)
      await load()
    } finally {
      setTopupBusy(false)
    }
  }, [fetchJsonOnce, load, topupAmount, topupBusy, userEmail])

  const buyByCard = useCallback(
    async (p: PricingProduct) => {
      if (!selectedTarget || busy) return
      setBusy(true)
      setError(null)
      try {
        const token = await getToken()
        if (!token) throw new Error('Connecte-toi avant d’acheter.')

        const res = await fetchJsonOnce(
          '/api/boosts/create-checkout-session',
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              vendorId: selectedTarget.vendorId,
              vendorKind: selectedTarget.vendorKind,
              boostKind: p.kind,
              durationHours: p.durationHours,
              currency: String(p.currency || 'xof').toLowerCase(),
            })
          },
          9000
        )

        if (!res.ok) {
          if (res.status === 404 || res.status === 405) {
            try {
              const ref = window.prompt('Paiement carte indisponible ici. Entrez une référence (ou OK pour activer en démo) :', '')
              if (ref === null) throw new Error('Achat annulé')
              await upsertVendorBoostRow({
                vendorKind: selectedTarget.vendorKind,
                vendorId: selectedTarget.vendorId,
                kind: p.kind,
                durationHours: p.durationHours,
                sponsoredTier: (p as any)?.sponsoredTier ?? null,
                shopSlug: (selectedTarget as any)?.slug || null,
              })
              try {
                const email = String(userEmail || '').trim().toLowerCase()
                if (email) {
                  const allOrders = readLocalOrders(email)
                  const aliases = await resolveShopAliases({ vendorId: selectedTarget.vendorId, vendorKind: selectedTarget.vendorKind, slug: (selectedTarget as any)?.slug || null, userEmail })
                  const canonicalVendorId = pickCanonicalVendorId(aliases.vendorIds) || selectedTarget.vendorId
                  const expiresAtIso = new Date(Date.now() + Math.max(0, Number(p.durationHours || 0)) * 60 * 60 * 1000).toISOString()
                  const order = makeLocalOrder({
                    email,
                    vendorId: canonicalVendorId,
                    vendorKind: selectedTarget.vendorKind,
                    kind: p.kind,
                    durationHours: p.durationHours,
                    amountXof: Number(p.priceXof || 0),
                    currency: String(p.currency || 'XOF'),
                    expiresAtIso,
                  })
                  writeLocalOrders(email, [order, ...allOrders].slice(0, 100))
                }
              } catch {
              }
              toast.success('Boost activé (carte)')
              try {
                window.dispatchEvent(new Event('mangoo-boosts-updated'))
              } catch {
              }
              await load()
              return
            } catch {
              throw new Error('Paiement carte indisponible sur ce déploiement.')
            }
          }
          throw new Error(res.json?.error || `HTTP ${res.status}`)
        }
        const url = String(res.json?.sessionUrl || '')
        if (!url) throw new Error('URL Stripe manquante')
        try {
          const email = String(userEmail || '').trim().toLowerCase()
          if (email && selectedTarget?.vendorId && selectedTarget?.vendorKind) {
            localStorage.setItem(
              `${PENDING_BOOST_PREFIX}${email}`,
              JSON.stringify({
                vendorId: String(selectedTarget.vendorId),
                vendorKind: String(selectedTarget.vendorKind),
                vendorName: String(selectedTarget.name || ''),
                shopSlug: String((selectedTarget as any)?.slug || ''),
                kind: p.kind,
                durationHours: Number(p.durationHours),
                sponsoredTier: Number((p as any)?.sponsoredTier || 0) || null,
                amountXof: Number(p.priceXof || 0),
                currency: String(p.currency || 'XOF'),
                savedAt: Date.now(),
              })
            )
          }
        } catch {
        }
        window.location.href = url
      } catch (e: any) {
        const msg = String(e?.message || '')
        const looksUnavailable = msg.toLowerCase().includes('indisponible') || msg.toLowerCase().includes('fetch')
        if (looksUnavailable) {
          try {
            const ref = window.prompt('Paiement carte indisponible ici. Entrez une référence (ou OK pour activer en démo) :', '')
            if (ref !== null && selectedTarget) {
              await upsertVendorBoostRow({
                vendorKind: selectedTarget.vendorKind,
                vendorId: selectedTarget.vendorId,
                kind: p.kind,
                durationHours: p.durationHours,
                sponsoredTier: (p as any)?.sponsoredTier ?? null,
                shopSlug: (selectedTarget as any)?.slug || null,
              })
              try {
                const email = String(userEmail || '').trim().toLowerCase()
                if (email) {
                  const allOrders = readLocalOrders(email)
                  const aliases = await resolveShopAliases({ vendorId: selectedTarget.vendorId, vendorKind: selectedTarget.vendorKind, slug: (selectedTarget as any)?.slug || null, userEmail })
                  const canonicalVendorId = pickCanonicalVendorId(aliases.vendorIds) || selectedTarget.vendorId
                  const expiresAtIso = new Date(Date.now() + Math.max(0, Number(p.durationHours || 0)) * 60 * 60 * 1000).toISOString()
                  const order = makeLocalOrder({
                    email,
                    vendorId: canonicalVendorId,
                    vendorKind: selectedTarget.vendorKind,
                    kind: p.kind,
                    durationHours: p.durationHours,
                    amountXof: Number(p.priceXof || 0),
                    currency: String(p.currency || 'XOF'),
                    expiresAtIso,
                  })
                  writeLocalOrders(email, [order, ...allOrders].slice(0, 100))
                }
              } catch {
              }
              toast.success('Boost activé (carte)')
              try {
                window.dispatchEvent(new Event('mangoo-boosts-updated'))
              } catch {
              }
              await load()
              return
            }
          } catch {
          }
        }
        setError(e?.message || 'Erreur paiement carte')
      } finally {
        setBusy(false)
      }
    },
    [busy, fetchJsonOnce, getToken, load, selectedTarget]
  )

  const buyByCredits = useCallback(
    async (p: PricingProduct) => {
      if (!selectedTarget || busy) return
      setBusy(true)
      setError(null)
      try {
        const token = await getToken()
        const email = String(userEmail || '').trim().toLowerCase()
        if (!email) throw new Error('Email vendeur manquant.')

        const localFallbackPurchase = async () => {
          const price = Math.floor(Number(p?.priceXof || 0))
          if (!Number.isFinite(price) || price <= 0) throw new Error('Prix invalide')
          const currentCredits = readLocalCredits(email)
          if (currentCredits < price) throw new Error('Crédits insuffisants')
          const nextCredits = currentCredits - price
          writeLocalCredits(email, nextCredits)
          setBalanceXof(nextCredits)

          const ms = safeNowMs()
          const cfgAll = readLocalBoostConfig()
          const key = String(selectedTarget.vendorId)
          const prev = cfgAll[key] || {}
          const bump = (prevMs?: number | null) => {
            const t = Number(prevMs || 0)
            const base = Number.isFinite(t) && t > ms ? t : ms
            return base + Number(p.durationHours || 0) * 60 * 60 * 1000
          }
          if (p.kind === 'sponsored') {
            cfgAll[key] = {
              ...prev,
              sponsoredUntil: bump(prev.sponsoredUntil ?? null),
              sponsoredTier: Number(p.sponsoredTier || 1),
            }
          } else if (p.kind === 'promo') {
            cfgAll[key] = { ...prev, promoUntil: bump(prev.promoUntil ?? null) }
          } else {
            cfgAll[key] = { ...prev, newUntil: bump(prev.newUntil ?? null) }
          }
          writeLocalBoostConfig(cfgAll)

          try {
            const vendorKind = String(selectedTarget.vendorKind || 'shop')
            const vendorId = String(selectedTarget.vendorId || '')
            const key = String(selectedTarget.vendorId)
            const toIso = (ms?: number | null) => {
              const n = Number(ms || 0)
              return Number.isFinite(n) && n > 0 ? new Date(n).toISOString() : null
            }
            await supabase
              .from('vendor_boosts')
              .upsert({
                vendor_kind: vendorKind,
                vendor_id: vendorId,
                sponsored_until: toIso(cfgAll[key]?.sponsoredUntil ?? null),
                sponsored_tier: tierLabelFromNumber(cfgAll[key]?.sponsoredTier ?? null),
                promo_until: toIso(cfgAll[key]?.promoUntil ?? null),
                new_until: toIso(cfgAll[key]?.newUntil ?? null),
                updated_at: new Date().toISOString(),
              }, { onConflict: 'vendor_kind,vendor_id' })
          } catch {
          }

          const expiresKey = p.kind === 'sponsored' ? 'sponsoredUntil' : p.kind === 'promo' ? 'promoUntil' : 'newUntil'
          const expiresAtMs = Number((cfgAll[key] as any)?.[expiresKey] || 0)
          const order: BoostOrder = {
            id: `local_${ms}_${Math.random().toString(36).slice(2, 10)}`,
            vendor_id: String(selectedTarget.vendorId),
            vendor_kind: String(selectedTarget.vendorKind),
            boost_kind: p.kind,
            duration_hours: Number(p.durationHours),
            amount_xof: price,
            currency: String(p.currency || 'XOF'),
            status: 'active',
            expires_at: expiresAtMs ? new Date(expiresAtMs).toISOString() : null,
            created_at: new Date(ms).toISOString(),
          }
          const allOrders = readLocalOrders(email)
          writeLocalOrders(email, [order, ...allOrders].slice(0, 100))

          toast.success('Boost activé par crédits')
          try {
            window.dispatchEvent(new Event('mangoo-boosts-updated'))
          } catch {
          }
          await load()
        }

        if (!token) {

          try {
            const res = await fetchJsonOnce(
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  email,
                  vendorId: selectedTarget.vendorId,
                  vendorKind: selectedTarget.vendorKind,
                  boostKind: p.kind,
                  durationHours: p.durationHours,
                })
              },
              9000
            )
            if (res.ok && res.json?.success) {
              setBalanceXof(Number(res.json?.balanceXof ?? 0))
              toast.success('Boost activé par crédits')
              try {
                window.dispatchEvent(new Event('mangoo-boosts-updated'))
              } catch {
              }
              await load()
              return
            }
          } catch {
          }

          await localFallbackPurchase()
          return
        }
        const res = await fetchJsonOnce(
          '/api/boosts/purchase-with-credits',
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              vendorId: selectedTarget.vendorId,
              vendorKind: selectedTarget.vendorKind,
              boostKind: p.kind,
              durationHours: p.durationHours,
            })
          },
          9000
        )
        if (!res.ok) {
          if (res.status === 404 || res.status === 405) {
            await localFallbackPurchase()
            return
          }
          throw new Error(res.json?.error || `HTTP ${res.status}`)
        }

        await upsertVendorBoostRow({
          vendorKind: selectedTarget.vendorKind,
          vendorId: selectedTarget.vendorId,
          kind: p.kind,
          durationHours: p.durationHours,
          sponsoredTier: (p as any)?.sponsoredTier ?? null,
          shopSlug: (selectedTarget as any)?.slug || null,
        })

        toast.success('Boost activé par crédits')
        try {
          window.dispatchEvent(new Event('mangoo-boosts-updated'))
        } catch {
        }
        await load()
      } catch (e: any) {
        setError(e?.message || 'Erreur achat crédits')
      } finally {
        setBusy(false)
      }
    },
    [busy, fetchJsonOnce, getToken, load, selectedTarget, userEmail]
  )

  const byKind = useMemo(() => {
    const map: Record<BoostKind, PricingProduct[]> = { sponsored: [], promo: [], new: [] }
    for (const p of pricing) map[p.kind].push(p)
    Object.keys(map).forEach((k) => (map[k as BoostKind] = map[k as BoostKind].sort((a, b) => a.durationHours - b.durationHours)))
    return map
  }, [pricing])

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-lg font-bold text-gray-900 dark:text-white">Booster ma visibilité</div>
            <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">Achète un boost par carte ou crédits (XOF).</div>
          </div>
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className={`px-4 py-2 rounded-xl text-sm font-bold ${
              loading ? 'bg-gray-200 text-gray-500 dark:bg-gray-800 dark:text-gray-400' : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {loading ? 'Chargement…' : 'Rafraîchir'}
          </button>
        </div>
        {error && <div className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</div>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 lg:col-span-2">
          <div className="text-sm font-bold text-gray-900 dark:text-white">Cible</div>
          <select
            value={targetKey}
            onChange={(e) => setTargetKey(e.target.value)}
            className="mt-2 w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-white"
          >
            {targets.map((t) => (
              <option key={`${t.vendorKind}:${t.vendorId}`} value={`${t.vendorKind}:${t.vendorId}`}>
                {t.name}
              </option>
            ))}
          </select>
          {!targets.length && (
            <div className="mt-3 text-sm text-gray-600 dark:text-gray-300">
              Aucune boutique liée à ton compte. Associe d’abord ta boutique (Local+ → “Ma boutique”).
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-5">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div>
              <div className="text-sm font-bold text-gray-900 dark:text-white">Crédits</div>
              <div className="mt-2 text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {balanceStatus === 'loading'
                  ? 'Chargement…'
                  : balanceStatus === 'error'
                    ? 'Indisponible'
                    : `${formatXof(balanceXof || 0)} XOF`}
              </div>
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">Utilisables pour payer des boosts sans carte.</div>
            </div>
            <button
              type="button"
              onClick={() => setTopupOpen(true)}
              className="w-full sm:w-auto px-4 py-3 sm:px-3 sm:py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700"
            >
              Recharger mes crédits
            </button>
          </div>
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">En test localhost: recharge instantanée.</div>
        </div>
      </div>

      {topupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-lg font-bold text-gray-900 dark:text-white">Recharger mes crédits</div>
                <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">Test localhost: ajoute des crédits instantanément.</div>
              </div>
              <button
                type="button"
                onClick={() => setTopupOpen(false)}
                className="px-3 py-2 rounded-xl text-sm font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="mt-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTopupMethod('mobile_money')}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                    topupMethod === 'mobile_money'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  Mobile Money
                </button>
                <button
                  type="button"
                  onClick={() => setTopupMethod('card')}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                    topupMethod === 'card'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  Carte bancaire
                </button>
                <div className="text-xs text-gray-500 dark:text-gray-400">Priorité: Mobile Money.</div>
              </div>

              {topupMethod === 'mobile_money' && (
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300">Opérateur</label>
                    <select
                      value={topupOperator}
                      onChange={(e) => setTopupOperator(e.target.value as any)}
                      className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-white"
                    >
                      <option value="orange_money">Orange Money</option>
                      <option value="mtn">MTN Mobile Money</option>
                      <option value="moov">Moov Money</option>
                      <option value="wave">Wave</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300">Numéro</label>
                    <input
                      value={topupPhone}
                      onChange={(e) => setTopupPhone(e.target.value)}
                      placeholder="ex: +221…"
                      className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              )}

              {topupMethod === 'card' && (
                <div className="mt-3 text-sm text-gray-600 dark:text-gray-300">
                  Paiement par carte: bientôt disponible (Stripe).
                </div>
              )}

              <div className="mt-3 text-sm text-gray-600 dark:text-gray-300">
                Solde actuel:{' '}
                <span className="font-bold text-gray-900 dark:text-white">
                  {balanceStatus === 'loading'
                    ? '—'
                    : balanceStatus === 'error'
                      ? 'Indisponible'
                      : `${formatXof(balanceXof || 0)} XOF`}
                </span>
              </div>

              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300">Montant (XOF)</label>
              <input
                type="number"
                min={100}
                value={topupAmount}
                onChange={(e) => setTopupAmount(Number(e.target.value))}
                className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-white"
              />
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => void topup()}
                disabled={topupBusy}
                className={`px-4 py-3 rounded-xl text-sm font-bold transition-colors ${
                  topupBusy ? 'bg-gray-200 text-gray-500 dark:bg-gray-800 dark:text-gray-400' : 'bg-emerald-600 text-white hover:bg-emerald-700'
                }`}
              >
                {topupBusy ? 'Recharge…' : topupMethod === 'mobile_money' ? 'Recharger (test Mobile Money)' : 'Recharger (test Carte)'}
              </button>
              <button
                type="button"
                disabled
                className="px-4 py-3 rounded-xl text-sm font-bold bg-gray-200 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
              >
                Paiement en ligne (bientôt)
              </button>
            </div>
            <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">Le branchement Mobile Money / Carte / PayPal / Stripe sera ajouté ensuite.</div>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-5">
        <div className="text-base font-bold text-gray-900 dark:text-white">Statut actuel</div>
        {!selectedTarget && <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">Choisis une cible pour voir l’état des boosts.</div>}
        {selectedTarget && (
          <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="text-xs font-bold text-gray-600 dark:text-gray-300">Sponsorisé</div>
              <div className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">{formatRemaining(boostRow?.sponsored_until ?? null)}</div>
              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">Tier: {boostRow?.sponsored_tier || '—'}</div>
            </div>
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="text-xs font-bold text-gray-600 dark:text-gray-300">Promo</div>
              <div className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">{formatRemaining(boostRow?.promo_until ?? null)}</div>
            </div>
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="text-xs font-bold text-gray-600 dark:text-gray-300">Nouveau</div>
              <div className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">{formatRemaining(boostRow?.new_until ?? null)}</div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-base font-bold text-gray-900 dark:text-white">Offres</div>
            <div className="flex items-center gap-2">
              {(['sponsored', 'promo', 'new'] as BoostKind[]).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setActiveKind(k)}
                  className={`px-4 py-2 rounded-2xl font-black transition-colors ${
                    activeKind === k
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {kindLabel[k]}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {(byKind[activeKind] || []).map((p) => {
              const canCredits = balanceStatus === 'ready' && (balanceXof || 0) >= p.priceXof
              return (
                <div key={`${p.kind}:${p.durationHours}`} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-bold text-gray-900 dark:text-white">{p.title || `${kindLabel[p.kind]} ${p.durationHours}h`}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">{p.durationHours} h</div>
                      {p.description && <div className="text-xs text-gray-600 dark:text-gray-400 mt-2">{p.description}</div>}
                    </div>
                    <div className="text-right">
                      <div className="text-emerald-600 dark:text-emerald-400 font-black">{formatXof(p.priceXof)} XOF</div>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-1 sm:flex sm:flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={!selectedTarget || busy || p.active === false}
                      onClick={() => buyByCard(p)}
                      className={`w-full sm:w-auto px-4 py-3 sm:py-2 rounded-xl text-xs font-bold ${
                        !selectedTarget || busy || p.active === false
                          ? 'bg-gray-200 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      Payer par carte
                    </button>
                    <button
                      type="button"
                      disabled={!selectedTarget || busy || !canCredits || p.active === false}
                      onClick={() => buyByCredits(p)}
                      className={`w-full sm:w-auto px-4 py-3 sm:py-2 rounded-xl text-xs font-bold ${
                        !selectedTarget || busy || !canCredits || p.active === false
                          ? 'bg-gray-200 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                          : 'bg-emerald-600 text-white hover:bg-emerald-700'
                      }`}
                    >
                      Payer par crédits
                    </button>
                  </div>
                </div>
              )
            })}
            {!loading && (byKind[activeKind] || []).length === 0 && (
              <div className="text-sm text-gray-600 dark:text-gray-300">
                Aucune offre disponible. Ajoute des offres dans l’admin (Boost Carte) ou active les produits boost dans Supabase.
              </div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-5">
          <div className="text-base font-bold text-gray-900 dark:text-white">Historique</div>
          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Dernières commandes boost pour cette cible.</div>
          <div className="mt-4 md:hidden space-y-3">
            {orders.map((o) => (
              <div key={o.id} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-bold text-gray-900 dark:text-white">{kindLabel[o.boost_kind]}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">{o.duration_hours} h</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">{new Date(o.created_at).toLocaleString('fr-FR')}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-black text-emerald-600 dark:text-emerald-400">{formatXof(o.amount_xof)} {String(o.currency || 'XOF').toUpperCase()}</div>
                    <div className="mt-2">
                      <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                        o.status === 'active'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
                          : o.status === 'paid'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                            : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                      }`}>
                        {o.status}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-3 text-xs text-gray-600 dark:text-gray-400">
                  Expire: {o.expires_at ? new Date(o.expires_at).toLocaleString('fr-FR') : '—'}
                </div>
              </div>
            ))}
            {!orders.length && <div className="py-2 text-sm text-gray-500 dark:text-gray-400">Aucune commande.</div>}
          </div>

          <div className="mt-4 hidden md:block overflow-auto">
            <table className="min-w-[900px] w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600 dark:text-gray-300">
                  <th className="py-2 pr-3">Date</th>
                  <th className="py-2 pr-3">Type</th>
                  <th className="py-2 pr-3">Durée</th>
                  <th className="py-2 pr-3">Montant</th>
                  <th className="py-2 pr-3">Statut</th>
                  <th className="py-2 pr-3">Expire</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-t border-gray-100 dark:border-gray-800">
                    <td className="py-3 pr-3 text-gray-900 dark:text-white">{new Date(o.created_at).toLocaleString('fr-FR')}</td>
                    <td className="py-3 pr-3 text-gray-900 dark:text-white">{kindLabel[o.boost_kind]}</td>
                    <td className="py-3 pr-3 text-gray-900 dark:text-white">{o.duration_hours} h</td>
                    <td className="py-3 pr-3 text-gray-900 dark:text-white">{formatXof(o.amount_xof)} {String(o.currency || 'XOF').toUpperCase()}</td>
                    <td className="py-3 pr-3">
                      <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                        o.status === 'active'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
                          : o.status === 'paid'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                            : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                      }`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="py-3 pr-3 text-gray-700 dark:text-gray-300">{o.expires_at ? new Date(o.expires_at).toLocaleString('fr-FR') : '—'}</td>
                  </tr>
                ))}
                {!orders.length && (
                  <tr>
                    <td colSpan={6} className="py-6 text-sm text-gray-500 dark:text-gray-400">Aucune commande.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
