import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { buildApiUrl } from '../../config/api'
import { supabase } from '../../config/supabase'
import { X } from 'lucide-react'
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
const PENDING_BOOST_LAST_KEY = 'mangoo_boost_pending:last'
const BOOST_TARGET_HINT_KEY = 'mangoo_boost_target:hint:'
const CREDITS_SYNCED_PREFIX = 'mangoo_boost_credits:synced:'

function getBoostTargetHintKey(email: string) {
  const e = String(email || '').trim().toLowerCase()
  return `${BOOST_TARGET_HINT_KEY}${e || 'unknown'}`
}

function isUuidLike(value: string): boolean {
  const v = String(value || '').trim()
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v)
}

function isPrivateIpv4Host(value: string): boolean {
  const h = String(value || '').trim().toLowerCase()
  const host = h.includes(':') ? h.split(':')[0] : h
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host)
  if (!m) return false
  const a = Number(m[1])
  const b = Number(m[2])
  const c = Number(m[3])
  const d = Number(m[4])
  const parts = [a, b, c, d]
  if (parts.some((x) => !Number.isFinite(x) || x < 0 || x > 255)) return false
  if (a === 10) return true
  if (a === 192 && b === 168) return true
  if (a === 172 && b >= 16 && b <= 31) return true
  return false
}

function readBoostTargetHint(email: string): { vendorId: string; vendorKind: 'shop' | 'provider' } | null {
  try {
    const raw = localStorage.getItem(getBoostTargetHintKey(email))
    const parsed = raw ? JSON.parse(raw) : null
    const vendorId = String(parsed?.vendorId || '').trim()
    const vendorKindRaw = String(parsed?.vendorKind || '').trim().toLowerCase()
    const vendorKind = vendorKindRaw === 'provider' ? 'provider' : vendorKindRaw === 'shop' ? 'shop' : ''
    if (!vendorId || !vendorKind) return null
    return { vendorId, vendorKind: vendorKind as any }
  } catch {
    return null
  }
}

function readGlobalBoostTargetHint(): { vendorId: string; vendorKind: 'shop' | 'provider' } | null {
  try {
    const raw = localStorage.getItem('mangoo_boost_target')
    const parsed = raw ? JSON.parse(raw) : null
    const vendorId = String(parsed?.vendorId || '').trim()
    const vendorKindRaw = String(parsed?.vendorKind || '').trim().toLowerCase()
    const vendorKind = vendorKindRaw === 'provider' ? 'provider' : vendorKindRaw === 'shop' ? 'shop' : ''
    if (!vendorId || !vendorKind) return null
    return { vendorId, vendorKind: vendorKind as any }
  } catch {
    return null
  }
}

function safeNowMs() {
  return Date.now()
}

function sleep(ms: number) {
  const n = Math.max(0, Math.floor(Number(ms || 0)))
  return new Promise<void>((resolve) => window.setTimeout(resolve, n))
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

function creditsSyncedKey(email: string) {
  const e = String(email || '').trim().toLowerCase()
  return `${CREDITS_SYNCED_PREFIX}${e || 'unknown'}`
}

function readCreditsSynced(email: string): boolean {
  try {
    return localStorage.getItem(creditsSyncedKey(email)) === '1'
  } catch {
    return false
  }
}

function markCreditsSynced(email: string) {
  try {
    localStorage.setItem(creditsSyncedKey(email), '1')
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

function isMissingColumnError(error: any, column: string): boolean {
  const msg = String(error?.message || '').toLowerCase()
  const col = String(column || '').toLowerCase()
  if (!msg || !col) return false
  const mentions = msg.includes(col)
  const missing = msg.includes('does not exist') || msg.includes('could not find') || msg.includes('column') || msg.includes('schema cache')
  return Boolean(mentions && missing)
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

function readEffectiveEmail(explicit: string) {
  const v = String(explicit || '').trim().toLowerCase()
  if (v && v.includes('@')) return v
  try {
    const raw = localStorage.getItem('mangoo-current-user')
    const parsed = raw ? JSON.parse(raw) : null
    const e = String(parsed?.email || '').trim().toLowerCase()
    return e && e.includes('@') ? e : ''
  } catch {
    return ''
  }
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
  if (vendorId.startsWith('local_')) ids.add(vendorId.replace(/^local_/, ''))
  if (vendorId.startsWith('s_')) ids.add(`local_${vendorId}`)

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
      } else {
        try {
          const res = await fetch(`/api/local-sync/shops/${encodeURIComponent(slug)}`)
          const json = await res.json().catch(() => null as any)
          const ls = json?.shop
          const lsId = String(ls?.id || '').trim()
          if (lsId) {
            ids.add(lsId)
            ids.add(lsId.startsWith('local_') ? lsId : `local_${lsId}`)
          }
          const ownerEmail = String(ls?.ownerEmail || ls?.owner_email || '').trim().toLowerCase()
          if (ownerEmail) ids.add(`local-${ownerEmail}`)
        } catch {
        }
      }
    }
  } catch {
  }

  return { vendorKind, vendorIds: Array.from(ids) }
}

function pickCanonicalVendorId(vendorIds: string[]): string {
  const list = Array.isArray(vendorIds) ? vendorIds : []
  const uuid = list.find((x) => x && isUuidLike(String(x)))
  if (uuid) return uuid
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
        const attempt = async (withContactEmail: boolean) => {
          const cols = withContactEmail ? 'id,email,contact_email,created_at' : 'id,email,created_at'
          const q = supabase.from('shops').select(cols).order('created_at', { ascending: false }).limit(1)
          if (withContactEmail) return await q.or(`email.eq.${email},contact_email.eq.${email}`)
          return await q.eq('email', email)
        }
        let r: any = await attempt(true)
        if (r?.error && isMissingColumnError(r.error, 'contact_email')) r = await attempt(false)
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

function isDemoLoginEmail(email: string): boolean {
  const e = String(email || '').trim().toLowerCase()
  if (!e || !e.includes('@')) return false
  try {
    const rawUsers = localStorage.getItem('demo_users')
    const data = rawUsers ? JSON.parse(rawUsers) : null
    const map = data && typeof data === 'object' ? data : null
    if (map && Object.prototype.hasOwnProperty.call(map, e)) return true
  } catch {
  }
  try {
    const raw = localStorage.getItem('mangoo-current-user')
    const parsed = raw ? JSON.parse(raw) : null
    const parsedEmail = String(parsed?.email || '').trim().toLowerCase()
    if (parsedEmail !== e) return false
    const id = parsed?.id
    if (typeof id === 'number') return true
    const idStr = String(id || '').trim()
    if (!idStr) return false
    if (idStr.startsWith('admin-demo-')) return true
    if (idStr.startsWith('vendor_')) return true
  } catch {
  }
  return false
}

function isLocalhostRuntime(): boolean {
  try {
    const h = String(window?.location?.hostname || '').trim().toLowerCase()
    return h === 'localhost' || h === '127.0.0.1' || h === '::1'
  } catch {
    return false
  }
}

function isLocalNetworkRuntime(): boolean {
  try {
    const h = String(window?.location?.hostname || '').trim().toLowerCase()
    return isLocalhostRuntime() || isPrivateIpv4Host(h)
  } catch {
    return false
  }
}

function isPcDemoEmail(email: string): boolean {
  const e = String(email || '').trim().toLowerCase()
  return /^pc\d+@/.test(e)
}

function getExampleDomainAliases(email: string): string[] {
  const e = String(email || '').trim().toLowerCase()
  if (!e || !e.includes('@')) return []
  const out = new Set<string>()
  out.add(e)
  if (e.endsWith('@example.com')) out.add(e.replace('@example.com', '@exemple.com'))
  if (e.endsWith('@exemple.com')) out.add(e.replace('@exemple.com', '@example.com'))
  return Array.from(out)
}

function getPcDemoEmailAliases(email: string): string[] {
  const e = String(email || '').trim().toLowerCase()
  if (!isPcDemoEmail(e)) return e ? [e] : []
  const out = new Set<string>()
  if (e) out.add(e)
  if (e.endsWith('@example.com')) out.add(e.replace('@example.com', '@exemple.com'))
  if (e.endsWith('@exemple.com')) out.add(e.replace('@exemple.com', '@example.com'))
  return Array.from(out)
}

function readBoostReturnTarget(params: { vendorId?: string | null; vendorKind?: string | null; shopSlug?: string | null }) {
  try {
    const currentUrl = new URL(window.location.href)
    const explicit = String(currentUrl.searchParams.get('return') || '').trim()
    if (explicit) return explicit
  } catch {
  }

  const vendorId = String(params.vendorId || '').trim()
  const vendorKind = String(params.vendorKind || '').trim().toLowerCase()
  const shopSlug = String(params.shopSlug || '').trim()

  if (vendorKind === 'provider' && vendorId) {
    return `/mangoo-local.html?vendor=${encodeURIComponent(vendorId)}`
  }
  if (vendorKind === 'shop' && shopSlug) {
    return `/shop/${encodeURIComponent(shopSlug)}`
  }
  return ''
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
  const [repairBusy, setRepairBusy] = useState(false)
  const loadSeqRef = useRef(0)
  const loadLockRef = useRef(false)
  const loadQueuedRef = useRef(false)
  const forcedQueryAppliedRef = useRef('')
  const pendingCreditsRef = useRef<{ expected: number; until: number } | null>(null)
  const pendingCreditsTimerRef = useRef<number | null>(null)

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
      const label = String(parsed?.shopName || parsed?.shop_name || '').trim()
      if (!label) return null
      const explicitId = String(parsed?.shopId || parsed?.shop_id || parsed?.vendorId || parsed?.vendor_id || '').trim()
      const vendorId = explicitId || `local-${email}`
      return { vendorId, vendorKind: 'shop' as const, name: label }
    } catch {
      return null
    }
  }, [userEmail])

  const computeTargets = useCallback(async (): Promise<VendorTarget | null> => {
    const email = String(userEmail || '').trim().toLowerCase()
    const catalog = readJson<any[]>('mangoo_local_vendors_catalog', [])
    const hint = readBoostTargetHint(email)
    const globalHint = readGlobalBoostTargetHint()
    let forcedFromQuery: VendorTarget | null = null
    try {
      const qs = new URLSearchParams(String(window.location.search || ''))
      const vendorId = String(qs.get('vendorId') || '').trim()
      const vendorKindRaw = String(qs.get('vendorKind') || '').trim().toLowerCase()
      const vendorKind = vendorKindRaw === 'provider' ? 'provider' : vendorKindRaw === 'shop' ? 'shop' : ''
      if (vendorId && vendorKind) {
        const match = vendorKind === 'shop'
          ? catalog.find((x) => String(x?.id || '') === vendorId && String(x?.kind || 'shop') === 'shop')
          : catalog.find((x) => String(x?.id || '') === vendorId && String(x?.kind || '').trim().toLowerCase() === 'service')
        const name = String(match?.name || (vendorKind === 'shop' ? `Boutique ${vendorId}` : `Prestataire ${vendorId}`))
        const slug = String(match?.slug || '').trim()
        forcedFromQuery = { vendorId, vendorKind: vendorKind as any, name, ...(slug ? { slug } : {}) }
        if (email) {
          try {
            localStorage.setItem(`${TARGET_PREF_KEY}${email}`, `${vendorKind}:${vendorId}`)
            localStorage.setItem(getBoostTargetHintKey(email), JSON.stringify({ vendorId, vendorKind }))
            localStorage.removeItem('mangoo_boost_target')
          } catch {
          }
        }
      }
    } catch {
      forcedFromQuery = null
    }
    let contextShopSlug = ''
    try {
      const raw = localStorage.getItem('mangoo-vendor-edit-shop-slug')
      contextShopSlug = String(raw || '').trim()
    } catch {
      contextShopSlug = ''
    }
    let shopIds: string[] = []
    let shopIdsFromLegacy = false
    try {
      const raw = localStorage.getItem(`mangoo_my_shop_ids:${email}`)
      const parsed = raw ? JSON.parse(raw) : []
      shopIds = Array.isArray(parsed) ? parsed.map((x) => String(x)) : []
    } catch {
      shopIds = []
    }
    if (!shopIds.length) {
      const legacy = localStorage.getItem('mangoo_my_shop_id')
      if (legacy) {
        shopIds = [String(legacy)]
        shopIdsFromLegacy = true
      }
    }
    if (shopIdsFromLegacy && email && shopIds.length === 1) {
      const legacyId = String(shopIds[0] || '').trim()
      const legacyLower = legacyId.toLowerCase()
      if (legacyLower.includes('@') && legacyLower !== email) {
        shopIds = []
      } else if (legacyLower.startsWith('local-')) {
        const legacyEmail = legacyLower.slice(6).trim()
        if (legacyEmail && legacyEmail !== email) shopIds = []
      } else if (isUuidLike(legacyId)) {
        try {
          const r = await supabase.from('shops').select('id,email,contact_email').eq('id', legacyId).maybeSingle()
          const row: any = r?.data || null
          const rowEmail = String(row?.email || row?.contact_email || '').trim().toLowerCase()
          if (rowEmail && rowEmail !== email) shopIds = []
        } catch {
        }
      } else {
        const v = catalog.find((x) => String(x?.id) === legacyId && String(x?.kind || 'shop') === 'shop')
        const ownerEmail = String(v?.ownerEmail || v?.owner_email || v?.email || '').trim().toLowerCase()
        if (!ownerEmail || ownerEmail !== email) shopIds = []
      }
    }

    let providerIds: string[] = []
    let providerIdsFromLegacy = false
    try {
      const raw = localStorage.getItem(`mangoo_my_provider_ids:${email}`)
      const parsed = raw ? JSON.parse(raw) : []
      providerIds = Array.isArray(parsed) ? parsed.map((x) => String(x)) : []
    } catch {
      providerIds = []
    }
    if (!providerIds.length) {
      const legacy = localStorage.getItem('mangoo_my_provider_id')
      if (legacy) {
        providerIds = [String(legacy)]
        providerIdsFromLegacy = true
      }
    }
    if (providerIdsFromLegacy && email && providerIds.length === 1) {
      const legacyId = String(providerIds[0] || '').trim()
      const legacyLower = legacyId.toLowerCase()
      if (legacyLower.includes('@') && legacyLower !== email) {
        providerIds = []
      } else if (legacyLower.startsWith('local-')) {
        const legacyEmail = legacyLower.slice(6).trim()
        if (legacyEmail && legacyEmail !== email) providerIds = []
      } else {
        const v = catalog.find((x) => String(x?.id) === legacyId && String(x?.kind || '').toLowerCase() === 'service')
        const ownerEmail = String(v?.ownerEmail || v?.owner_email || v?.email || '').trim().toLowerCase()
        if (!ownerEmail || ownerEmail !== email) providerIds = []
      }
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

    const localSyncShopTargets: VendorTarget[] = []
    if (email) {
      try {
        const controller = new AbortController()
        const t = window.setTimeout(() => controller.abort(), 12000)
        try {
          const res = await fetch(buildApiUrl('/api/local-sync/shops'), { signal: controller.signal })
          const json = await res.json().catch(() => null as any)
          const list = Array.isArray(json?.shops) ? json.shops : []
          for (const s of list as any[]) {
            const ownerEmail = String(s?.ownerEmail || s?.owner_email || '').trim().toLowerCase()
            if (!ownerEmail || ownerEmail !== email) continue
            const idRaw = String(s?.id || '').trim()
            if (!idRaw) continue
            const vendorId = idRaw.startsWith('local_') ? idRaw : `local_${idRaw}`
            const name = String(s?.name || `Boutique ${vendorId}`)
            const slug = String(s?.slug || '').trim()
            localSyncShopTargets.push({ vendorId, vendorKind: 'shop', name, ...(slug ? { slug } : {}) })
          }
        } finally {
          window.clearTimeout(t)
        }
      } catch {
      }
    }

    const supabaseShopTargets: VendorTarget[] = []
    if (email) {
      try {
        const attempt = async (withContactEmail: boolean) => {
          const cols = withContactEmail ? 'id,name,slug,email,contact_email,created_at' : 'id,name,slug,email,created_at'
          const q = supabase.from('shops').select(cols).order('created_at', { ascending: false }).limit(20)
          if (withContactEmail) return await q.or(`email.eq.${email},contact_email.eq.${email}`)
          return await q.eq('email', email)
        }

        let r: any = await attempt(true)
        if (r?.error && isMissingColumnError(r.error, 'contact_email')) r = await attempt(false)

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

    const localPlusShopTargets: VendorTarget[] = []
    if (email) {
      try {
        const readList = (key: string) => {
          try {
            const raw = localStorage.getItem(key)
            const parsed = raw ? JSON.parse(raw) : []
            return Array.isArray(parsed) ? parsed : []
          } catch {
            return []
          }
        }
        const list = [...readList('mangoo_custom_vendors'), ...readList('mangoo_vendors')]
        for (const v of list as any[]) {
          const kind = String(v?.kind || 'shop').trim().toLowerCase()
          if (kind !== 'shop') continue
          const ownerEmail = String(v?.ownerEmail || v?.owner_email || v?.email || '').trim().toLowerCase()
          if (!ownerEmail || ownerEmail !== email) continue
          const id = v?.id
          if (id === undefined || id === null) continue
          const vendorId = String(id).trim()
          if (!vendorId) continue
          const name = String(v?.name || `Boutique ${vendorId}`).trim() || `Boutique ${vendorId}`
          const slug = String(v?.shopSlug || v?.shop_slug || v?.slug || '').trim()
          localPlusShopTargets.push({ vendorId, vendorKind: 'shop', name, ...(slug ? { slug } : {}) })
        }
      } catch {
      }
    }

    const localPlusProviderTargets: VendorTarget[] = []
    if (email) {
      try {
        const readList = (key: string) => {
          try {
            const raw = localStorage.getItem(key)
            const parsed = raw ? JSON.parse(raw) : []
            return Array.isArray(parsed) ? parsed : []
          } catch {
            return []
          }
        }
        const list = [...readList('mangoo_custom_vendors'), ...readList('mangoo_vendors')]
        for (const v of list as any[]) {
          const kind = String(v?.kind || '').trim().toLowerCase()
          if (kind !== 'service' && kind !== 'provider') continue
          const ownerEmail = String(v?.ownerEmail || v?.owner_email || v?.email || '').trim().toLowerCase()
          if (!ownerEmail || ownerEmail !== email) continue
          const id = v?.id
          if (id === undefined || id === null) continue
          const vendorId = String(id).trim()
          if (!vendorId) continue
          const name = String(v?.name || `Prestataire ${vendorId}`).trim() || `Prestataire ${vendorId}`
          localPlusProviderTargets.push({ vendorId, vendorKind: 'provider', name })
        }
      } catch {
      }
    }

    const remoteProviderTargets: VendorTarget[] = []
    if (email) {
      try {
        const controller = new AbortController()
        const timeoutId = window.setTimeout(() => controller.abort(), 12000)
        let authToken = ''
        let authUserId = ''
        try {
          const { data: sessionData } = await supabase.auth.getSession()
          authToken = String(sessionData?.session?.access_token || '').trim()
          authUserId = String(sessionData?.session?.user?.id || '').trim()
        } catch {
          authToken = ''
          authUserId = ''
        }
        try {
          const res = await fetch(buildApiUrl('/api/local-sync/localplus/vendors?kind=provider'), {
            headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
            signal: controller.signal,
          })
          const parsed = await res.json().catch(() => null as any)
          const list = Array.isArray(parsed?.vendors) ? parsed.vendors : []
          for (const vendor of list as any[]) {
            const ownerEmail = String(vendor?.ownerEmail || vendor?.owner_email || '').trim().toLowerCase()
            const ownerUserId = String(vendor?.userId || vendor?.user_id || '').trim()
            const isOwned = Boolean(
              (ownerEmail && ownerEmail === email) ||
              (authUserId && ownerUserId && ownerUserId === authUserId) ||
              vendor?.isUserOwned === true
            )
            if (!isOwned) continue
            const id = String(vendor?.id || '').trim()
            if (!id) continue
            const name = String(vendor?.name || `Prestataire ${id}`).trim() || `Prestataire ${id}`
            remoteProviderTargets.push({ vendorId: id, vendorKind: 'provider', name })
          }
        } finally {
          window.clearTimeout(timeoutId)
        }
      } catch {
      }
    }

    const forcedFromGlobalHint: VendorTarget | null = (() => {
      try {
        if (!globalHint || globalHint.vendorKind !== 'shop') return null
        const rawId = String(globalHint.vendorId || '').trim()
        if (!rawId) return null
        const readList = (key: string) => {
          try {
            const raw = localStorage.getItem(key)
            const parsed = raw ? JSON.parse(raw) : []
            return Array.isArray(parsed) ? parsed : []
          } catch {
            return []
          }
        }
        const list = [...readList('mangoo_custom_vendors'), ...readList('mangoo_vendors')]
        const v = list.find((x: any) => String(x?.id) === rawId && String(x?.kind || 'shop').trim().toLowerCase() === 'shop') || null
        const name = String(v?.name || `Boutique ${rawId}`).trim() || `Boutique ${rawId}`
        const slug = String(v?.shopSlug || v?.shop_slug || v?.slug || '').trim()
        return { vendorId: rawId, vendorKind: 'shop', name, ...(slug ? { slug } : {}) }
      } catch {
        return null
      }
    })()

    if (hint && hint.vendorKind === 'shop' && isUuidLike(hint.vendorId)) {
      try {
        const r = await supabase.from('shops').select('id,name,slug').eq('id', hint.vendorId).maybeSingle()
        if (!r?.error && r?.data?.id) {
          const vendorId = String((r.data as any)?.id || '').trim()
          const name = String((r.data as any)?.name || `Boutique ${vendorId}`)
          const slug = String((r.data as any)?.slug || '').trim()
          if (vendorId) supabaseShopTargets.push({ vendorId, vendorKind: 'shop', name, ...(slug ? { slug } : {}) })
        }
      } catch {
      }
    }

    const list: VendorTarget[] = []
    for (const id of shopIds) {
      const v = catalog.find((x) => String(x?.id) === String(id) && String(x?.kind || 'shop') === 'shop')
      const slug = String(v?.slug || '').trim()
      list.push({ vendorId: String(id), vendorKind: 'shop', name: String(v?.name || `Boutique ${id}`), ...(slug ? { slug } : {}) })
    }
    for (const id of providerIds) {
      const v = catalog.find((x) => String(x?.id) === String(id) && String(x?.kind || '').toLowerCase() === 'service')
      list.push({ vendorId: String(id), vendorKind: 'provider', name: String(v?.name || `Prestataire ${id}`) })
    }

    const currentLooksLocal = Boolean(currentUserShopTarget && String(currentUserShopTarget.vendorId || '').startsWith('local-'))
    if (currentUserShopTarget && !(currentLooksLocal && supabaseShopTargets.length)) list.push(currentUserShopTarget)
    if (forcedFromQuery) list.push(forcedFromQuery)
    if (forcedFromGlobalHint) list.push(forcedFromGlobalHint)
    for (const t of localPlusShopTargets) list.push(t)
    for (const t of localPlusProviderTargets) list.push(t)
    for (const t of localSyncShopTargets) list.push(t)
    for (const t of demoShopTargets) list.push(t)
    for (const t of supabaseShopTargets) list.push(t)
    for (const t of remoteProviderTargets) list.push(t)
    const uniq = new Map<string, VendorTarget>()
    for (const t of list) uniq.set(`${t.vendorKind}:${t.vendorId}`, t)
    const finalList = Array.from(uniq.values()).sort((a, b) => {
      const aCurrent = currentUserShopTarget && a.vendorKind === currentUserShopTarget.vendorKind && a.vendorId === currentUserShopTarget.vendorId
      const bCurrent = currentUserShopTarget && b.vendorKind === currentUserShopTarget.vendorKind && b.vendorId === currentUserShopTarget.vendorId
      if (aCurrent && !bCurrent) return -1
      if (!aCurrent && bCurrent) return 1
      return String(a.name || '').localeCompare(String(b.name || ''), 'fr', { sensitivity: 'base' })
    })
    const looksNumericId = (value: string) => /^[0-9]{6,}$/.test(String(value || '').trim())
    const hasUuidShop = finalList.some((t) => t.vendorKind === 'shop' && isUuidLike(t.vendorId))
    const filteredList = hasUuidShop
      ? finalList.filter((t) => t.vendorKind !== 'shop' || isUuidLike(t.vendorId) || looksNumericId(t.vendorId))
      : finalList
    setTargets(filteredList)
    if (forcedFromQuery) {
      const forcedKey = `${forcedFromQuery.vendorKind}:${forcedFromQuery.vendorId}`
      const forced = filteredList.find((t) => `${t.vendorKind}:${t.vendorId}` === forcedKey) || null
      if (forced && forcedQueryAppliedRef.current !== forcedKey) {
        forcedQueryAppliedRef.current = forcedKey
        setTargetKey(forcedKey)
        return forced
      }
    } else if (forcedQueryAppliedRef.current) {
      forcedQueryAppliedRef.current = ''
    }
    const exists = targetKey ? filteredList.some((t) => `${t.vendorKind}:${t.vendorId}` === targetKey) : false
    if (targetKey && exists) {
      const [vendorKind, vendorId] = String(targetKey || '').split(':')
      const resolved = filteredList.find((t) => t.vendorKind === vendorKind && t.vendorId === vendorId) || null
      return resolved
    }

    if ((!targetKey || !exists) && filteredList.length) {
      let hintCandidate: { vendorId: string; vendorKind: 'shop' | 'provider' } | null = hint
      if (globalHint && email) {
        const vId = String(globalHint.vendorId || '').trim()
        const vLower = vId.toLowerCase()
        const matched = filteredList.find((t) => t.vendorKind === globalHint.vendorKind && t.vendorId === globalHint.vendorId) || null
        if (matched) {
          let ok = true
          if (vLower.includes('@') && vLower !== email) ok = false
          if (ok && vLower.startsWith('local-')) {
            const legacyEmail = vLower.slice(6).trim()
            if (legacyEmail && legacyEmail !== email) ok = false
          }
          if (ok && globalHint.vendorKind === 'shop' && isUuidLike(vId)) {
            try {
              const r = await supabase.from('shops').select('id,email,contact_email').eq('id', vId).maybeSingle()
              const row: any = r?.data || null
              const rowEmail = String(row?.email || row?.contact_email || '').trim().toLowerCase()
              if (rowEmail && rowEmail !== email) ok = false
            } catch {
            }
          }
          if (ok) {
            hintCandidate = globalHint
            try {
              localStorage.setItem(getBoostTargetHintKey(email), JSON.stringify(globalHint))
              localStorage.removeItem('mangoo_boost_target')
            } catch {
            }
          }
        }
      }

      const hintMatch = hintCandidate
        ? filteredList.find((t) => t.vendorKind === hintCandidate.vendorKind && t.vendorId === hintCandidate.vendorId)
        : null
      const contextMatch = contextShopSlug
        ? filteredList.find((t) => t.vendorKind === 'shop' && String(t.slug || '').trim() === contextShopSlug)
        : null
      const preferredMatch = preferredTargetKey
        ? filteredList.find((t) => `${t.vendorKind}:${t.vendorId}` === preferredTargetKey)
        : null
      const currentMatch = currentUserShopTarget
        ? filteredList.find((t) => t.vendorKind === currentUserShopTarget.vendorKind && t.vendorId === currentUserShopTarget.vendorId)
        : null
      if (contextMatch && email) {
        try {
          localStorage.setItem(`${TARGET_PREF_KEY}${email}`, `${contextMatch.vendorKind}:${contextMatch.vendorId}`)
          localStorage.setItem(getBoostTargetHintKey(email), JSON.stringify({ vendorId: contextMatch.vendorId, vendorKind: contextMatch.vendorKind }))
          localStorage.removeItem('mangoo_boost_target')
        } catch {
        }
      }
      const target = contextMatch || hintMatch || preferredMatch || currentMatch || filteredList[0]
      setTargetKey(`${target.vendorKind}:${target.vendorId}`)
      return target
    }
    return filteredList[0] || null
  }, [currentUserShopTarget, preferredTargetKey, targetKey, userEmail])

  const getToken = useCallback(async () => {
    try {
      const { data } = await supabase.auth.getSession()
      return data.session?.access_token || ''
    } catch {
      return ''
    }
  }, [])

  const getUserId = useCallback(async () => {
    try {
      const { data } = await supabase.auth.getSession()
      return data.session?.user?.id || ''
    } catch {
      return ''
    }
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
    try {
      const { data, error } = await supabase
        .from('boost_products')
        .select('kind, duration_hours, price_xof, currency, title, description, sponsored_tier, active')
        .eq('active', true)
      if (error) return []
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
    } catch {
      return []
    }
  }, [])

  const loadCreditsFromSupabase = useCallback(async () => {
    try {
      const userId = await getUserId()
      if (!userId) return null
      const { data, error } = await supabase
        .from('user_credits')
        .select('amount, expires_at, used_at')
        .eq('user_id', userId)
      if (error) return null
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
    } catch {
      return null
    }
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
    try {
      const { data, error } = await q
      if (error) throw error
      const rows = Array.isArray(data) ? (data as any as VendorBoostRow[]) : []
      const merged = mergeBoostRows(rows)
      if (merged) return merged
    } catch {
    }

    try {
      const qs = new URLSearchParams({ vendorId: String(vendorId || ''), vendorKind: String(vendorKind || '') })
      const rowRes = await fetchJsonOnce(`/api/boosts/vendor-boosts?${qs.toString()}`, { method: 'GET' }, 6500)
      if (rowRes.ok) return (rowRes.json?.row || null) as VendorBoostRow | null
    } catch {
    }
    return null
  }, [fetchJsonOnce, selectedTarget?.slug, userEmail])

  const load = useCallback(async () => {
    if (loadLockRef.current) {
      loadQueuedRef.current = true
      return
    }
    loadLockRef.current = true
    const seq = ++loadSeqRef.current
    setLoading(true)
    setError(null)
    try {
      const target = await computeTargets()
      const emailLower = readEffectiveEmail(userEmail)
      const forceDevMode = isDemoLoginEmail(emailLower) || (isLocalNetworkRuntime() && isPcDemoEmail(emailLower))
      let token = ''
      if (!forceDevMode) {
        try {
          token = await getToken()
        } catch {
          token = ''
        }
      }

      let normalizedPricing: PricingProduct[] = []
      try {
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
        } else if (token) {
          normalizedPricing = await loadPricingFromSupabase()
        }
      } catch {
        normalizedPricing = token ? await loadPricingFromSupabase() : []
      }
      if (!normalizedPricing.length) normalizedPricing = fallbackPricing
      setPricing(normalizedPricing)

      const emailAliases = emailLower ? getExampleDomainAliases(emailLower) : []
      let localCredits = 0
      for (const e of emailAliases) localCredits = Math.max(localCredits, readLocalCredits(e))

      if (!token) {
        const email = emailLower

        if (!normalizedPricing.length) setPricing(fallbackPricing)

        if (target) {
          let row: VendorBoostRow | null = null
          try {
            const qs = new URLSearchParams({ vendorId: target.vendorId, vendorKind: target.vendorKind })
            const rowRes = await fetchJsonOnce(`/api/boosts/vendor-boosts?${qs.toString()}`, { method: 'GET' }, 6000)
            if (seq !== loadSeqRef.current) return
            if (rowRes.ok) row = (rowRes.json?.row || null) as VendorBoostRow | null
          } catch {
            row = null
          }

          if (!row) {
            const cfg = readLocalBoostConfig()[String(target.vendorId)] || {}
            const toIso = (ms?: number | null) => {
              const n = Number(ms || 0)
              return Number.isFinite(n) && n > 0 ? new Date(n).toISOString() : null
            }
            row = {
              vendor_id: String(target.vendorId),
              vendor_kind: String(target.vendorKind),
              sponsored_until: toIso(cfg.sponsoredUntil),
              sponsored_tier: tierLabelFromNumber(cfg.sponsoredTier ?? null),
              promo_until: toIso(cfg.promoUntil),
              new_until: toIso(cfg.newUntil),
              updated_at: new Date().toISOString(),
            }
          }
          setBoostRow(row)
          try {
            if (row) {
              const key = String(target.vendorId)
              const cfgAll = readLocalBoostConfig()
              const prev = cfgAll[key] || {}
              const parseIso = (value: any): number | null => {
                const t = value ? Date.parse(String(value)) : NaN
                return Number.isFinite(t) ? t : null
              }
              const tierRaw = String(row?.sponsored_tier || '').trim().toLowerCase()
              const tierNum = tierRaw === 'or' ? 3 : tierRaw === 'argent' ? 2 : tierRaw === 'bronze' ? 1 : null
              cfgAll[key] = {
                ...prev,
                sponsoredUntil: parseIso(row?.sponsored_until),
                sponsoredTier: tierNum ?? (prev as any)?.sponsoredTier ?? null,
                promoUntil: parseIso(row?.promo_until),
                newUntil: parseIso(row?.new_until),
              }
              writeLocalBoostConfig(cfgAll)
            }
          } catch {
          }
        } else {
          setBoostRow(null)
        }

        setBalanceStatus('loading')
        let remoteCredits = 0
        let sawRemote = false
        if (emailAliases.length) {
          for (const e of emailAliases) {
            try {
              const qs = new URLSearchParams({ email: e })
              const creditRes = await fetchJsonOnce(`/api/boosts/credits-balance?${qs.toString()}`, { method: 'GET' }, 6000)
              if (seq !== loadSeqRef.current) return
              if (creditRes.ok) {
                sawRemote = true
                remoteCredits = Math.max(remoteCredits, Number(creditRes.json?.balanceXof || 0))
              }
            } catch {
            }
          }
          if ((!Number.isFinite(remoteCredits) || remoteCredits <= 0) && !sawRemote) {
            for (const e of emailAliases) {
              try {
                const qs = new URLSearchParams({ email: e })
                const creditRes = await fetchJsonOnce(`/api/boosts/credits-balance-dev?${qs.toString()}`, { method: 'GET' }, 6000)
                if (seq !== loadSeqRef.current) return
                if (creditRes.ok && creditRes.json?.success) {
                  sawRemote = true
                  remoteCredits = Math.max(remoteCredits, Number(creditRes.json?.balanceXof || 0))
                }
              } catch {
              }
            }
          }
        }

        const remoteVal = Number.isFinite(remoteCredits) ? Math.max(0, Math.floor(remoteCredits)) : 0
        const nextCredits = sawRemote
          ? (isLocalNetworkRuntime() ? Math.max(remoteVal, localCredits) : remoteVal)
          : localCredits

        const pending = pendingCreditsRef.current
        if (pending && safeNowMs() < pending.until && nextCredits !== pending.expected) {
          setBalanceStatus('ready')
          if (!pendingCreditsTimerRef.current) {
            pendingCreditsTimerRef.current = window.setTimeout(() => {
              pendingCreditsTimerRef.current = null
              void load()
            }, 1200)
          }
        } else {
          pendingCreditsRef.current = null
          for (const e of emailAliases) writeLocalCredits(e, nextCredits)
          if (sawRemote) for (const e of emailAliases) markCreditsSynced(e)
          setBalanceXof(nextCredits)
          setBalanceStatus('ready')
        }

        if (target && email) {
          const local = readLocalOrders(email)
          if (local.length) {
            try {
              await fetchJsonOnce(
                '/api/boosts/my-orders-local/import',
                { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, orders: local }) },
                6000
              )
            } catch {
            }
          }

          let remote: BoostOrder[] = []
          try {
            const qs = new URLSearchParams({
              email,
              vendorId: target.vendorId,
              vendorKind: target.vendorKind,
            })
            const ordersRes = await fetchJsonOnce(`/api/boosts/my-orders-local?${qs.toString()}`, { method: 'GET' }, 6000)
            if (seq !== loadSeqRef.current) return
            if (ordersRes.ok) {
              remote = Array.isArray(ordersRes.json?.orders) ? (ordersRes.json.orders as BoostOrder[]) : []
            }
          } catch {
            remote = []
          }

          if (remote.length) {
            setOrders(mergeOrders(remote as BoostOrder[], []).slice(0, 50))
            return
          }

          const aliases = await resolveShopAliases({
            vendorId: target.vendorId,
            vendorKind: target.vendorKind,
            slug: target.slug || null,
            userEmail: email
          })
          const filterOne = (o: any) => {
            if (String(o?.vendor_kind || '') !== String(target.vendorKind)) return false
            const id = String(o?.vendor_id || '')
            return aliases.vendorIds.includes(id) || (target.slug && id === String(target.slug))
          }
          setOrders((Array.isArray(local) ? local : []).filter(filterOne).slice(0, 50))
        } else {
          setOrders([])
        }
        return
      }

      if (target) {
        const row = await loadBoostRowFromSupabase(target.vendorId, target.vendorKind)
        if (seq !== loadSeqRef.current) return
        setBoostRow(row)
      } else {
        setBoostRow(null)
      }

      try {
        setBalanceStatus('loading')
        const creditQs = new URLSearchParams()
        if (!token && emailLower) creditQs.set('email', emailLower)
        const creditUrl = creditQs.toString() ? `/api/boosts/credits-balance?${creditQs.toString()}` : '/api/boosts/credits-balance'
        const creditRes = await fetchJsonOnce(
          creditUrl,
          token ? { method: 'GET', headers: { Authorization: `Bearer ${token}` } } : { method: 'GET' },
          6000
        )
        if (seq !== loadSeqRef.current) return
        if (creditRes.ok) {
          const remote = Number(creditRes.json?.balanceXof || 0)
          let next = Number.isFinite(remote) ? remote : 0
          if (next <= 0 && emailAliases.length) {
            for (const e of emailAliases) {
              try {
                const qs = new URLSearchParams({ email: e })
                const devRes = await fetchJsonOnce(`/api/boosts/credits-balance-dev?${qs.toString()}`, { method: 'GET' }, 6000)
                if (seq !== loadSeqRef.current) return
                if (devRes.ok && devRes.json?.success) {
                  const devBal = Number(devRes.json?.balanceXof || 0)
                  if (Number.isFinite(devBal) && devBal > next) next = devBal
                }
              } catch {
              }
            }
          }
          if (isLocalNetworkRuntime()) next = Math.max(next, localCredits)
          const pending = pendingCreditsRef.current
          if (pending && safeNowMs() < pending.until && next !== pending.expected) {
            setBalanceStatus('ready')
            if (!pendingCreditsTimerRef.current) {
              pendingCreditsTimerRef.current = window.setTimeout(() => {
                pendingCreditsTimerRef.current = null
                void load()
              }, 1200)
            }
          } else {
            pendingCreditsRef.current = null
            setBalanceXof(next)
            setBalanceStatus('ready')
            for (const e of emailAliases) writeLocalCredits(e, next)
            if (emailAliases.length) for (const e of emailAliases) markCreditsSynced(e)
          }
        } else {
          const remote = await loadCreditsFromSupabase()
          let next = Math.floor(Number(remote || 0))
          next = Number.isFinite(next) ? next : 0
          if (next <= 0 && emailAliases.length) {
            for (const e of emailAliases) {
              try {
                const qs = new URLSearchParams({ email: e })
                const devRes = await fetchJsonOnce(`/api/boosts/credits-balance-dev?${qs.toString()}`, { method: 'GET' }, 6000)
                if (seq !== loadSeqRef.current) return
                if (devRes.ok && devRes.json?.success) {
                  const devBal = Number(devRes.json?.balanceXof || 0)
                  if (Number.isFinite(devBal) && devBal > next) next = devBal
                }
              } catch {
              }
            }
          }
          if (isLocalNetworkRuntime()) next = Math.max(next, localCredits)
          const pending = pendingCreditsRef.current
          if (pending && safeNowMs() < pending.until && next !== pending.expected) {
            setBalanceStatus('ready')
            if (!pendingCreditsTimerRef.current) {
              pendingCreditsTimerRef.current = window.setTimeout(() => {
                pendingCreditsTimerRef.current = null
                void load()
              }, 1200)
            }
          } else {
            pendingCreditsRef.current = null
            setBalanceXof(next)
            setBalanceStatus('ready')
            for (const e of emailAliases) writeLocalCredits(e, next)
            if (emailAliases.length) for (const e of emailAliases) markCreditsSynced(e)
          }
        }
      } catch {
        if (seq !== loadSeqRef.current) return
        const remote = await loadCreditsFromSupabase()
        let next = Math.floor(Number(remote || 0))
        next = Number.isFinite(next) ? next : 0
        if (next <= 0 && emailAliases.length) {
          for (const e of emailAliases) {
            try {
              const qs = new URLSearchParams({ email: e })
              const devRes = await fetchJsonOnce(`/api/boosts/credits-balance-dev?${qs.toString()}`, { method: 'GET' }, 6000)
              if (seq !== loadSeqRef.current) return
              if (devRes.ok && devRes.json?.success) {
                const devBal = Number(devRes.json?.balanceXof || 0)
                if (Number.isFinite(devBal) && devBal > next) next = devBal
              }
            } catch {
            }
          }
        }
        if (isLocalNetworkRuntime()) next = Math.max(next, localCredits)
        const pending = pendingCreditsRef.current
        if (pending && safeNowMs() < pending.until && next !== pending.expected) {
          setBalanceStatus('ready')
          if (!pendingCreditsTimerRef.current) {
            pendingCreditsTimerRef.current = window.setTimeout(() => {
              pendingCreditsTimerRef.current = null
              void load()
            }, 1200)
          }
        } else {
          pendingCreditsRef.current = null
          setBalanceXof(next)
          setBalanceStatus('ready')
          for (const e of emailAliases) writeLocalCredits(e, next)
          if (emailAliases.length) for (const e of emailAliases) markCreditsSynced(e)
        }
      }

      if (target) {
        try {
          const qs = new URLSearchParams()
          const ordersRes = await fetchJsonOnce(
            `/api/boosts/my-orders?${qs.toString()}`,
            { method: 'GET', headers: { Authorization: `Bearer ${token}` } },
            6000
          )
          if (seq !== loadSeqRef.current) return
          if (ordersRes.ok) {
            const rows = Array.isArray(ordersRes.json?.orders) ? ordersRes.json.orders : []
            const email = emailLower
            const local = email ? readLocalOrders(email) : []
            const aliases = await resolveShopAliases({ vendorId: target.vendorId, vendorKind: target.vendorKind, slug: target.slug || null, userEmail: email })
            const filterOne = (o: any) => {
              if (String(o?.vendor_kind || '') !== String(target.vendorKind)) return false
              const id = String(o?.vendor_id || '')
              return aliases.vendorIds.includes(id) || (target.slug && id === String(target.slug))
            }
            const filteredRemote = (Array.isArray(rows) ? rows : []).filter(filterOne)
            const filteredLocal = (Array.isArray(local) ? local : []).filter(filterOne)
            const pickedRemote = filteredRemote.length ? filteredRemote : rows
            const pickedLocal = filteredLocal.length ? filteredLocal : local
            setOrders(mergeOrders(pickedRemote as BoostOrder[], pickedLocal as BoostOrder[]).slice(0, 50))
          } else {
            const remote = await loadOrdersFromSupabase(target.vendorId, target.vendorKind)
            const email = emailLower
            const local = email ? readLocalOrders(email) : []
            const aliases = await resolveShopAliases({ vendorId: target.vendorId, vendorKind: target.vendorKind, slug: target.slug || null, userEmail: email })
            const filterOne = (o: any) => {
              if (String(o?.vendor_kind || '') !== String(target.vendorKind)) return false
              const id = String(o?.vendor_id || '')
              return aliases.vendorIds.includes(id) || (target.slug && id === String(target.slug))
            }
            const filteredRemote = (Array.isArray(remote) ? remote : []).filter(filterOne)
            const filteredLocal = (Array.isArray(local) ? local : []).filter(filterOne)
            const pickedRemote = filteredRemote.length ? filteredRemote : remote
            const pickedLocal = filteredLocal.length ? filteredLocal : local
            setOrders(mergeOrders(pickedRemote as BoostOrder[], pickedLocal as BoostOrder[]).slice(0, 50))
          }
        } catch {
          if (seq !== loadSeqRef.current) return
          const remote = await loadOrdersFromSupabase(target.vendorId, target.vendorKind)
          const email = emailLower
          const local = email ? readLocalOrders(email) : []
          const aliases = await resolveShopAliases({ vendorId: target.vendorId, vendorKind: target.vendorKind, slug: target.slug || null, userEmail: email })
          const filterOne = (o: any) => {
            if (String(o?.vendor_kind || '') !== String(target.vendorKind)) return false
            const id = String(o?.vendor_id || '')
            return aliases.vendorIds.includes(id) || (target.slug && id === String(target.slug))
          }
          const filteredRemote = (Array.isArray(remote) ? remote : []).filter(filterOne)
          const filteredLocal = (Array.isArray(local) ? local : []).filter(filterOne)
          const pickedRemote = filteredRemote.length ? filteredRemote : remote
          const pickedLocal = filteredLocal.length ? filteredLocal : local
          setOrders(mergeOrders(pickedRemote as BoostOrder[], pickedLocal as BoostOrder[]).slice(0, 50))
        }
      }
    } catch (e: any) {
      const msg = String(e?.message || '').trim()
      setError(/failed to fetch|networkerror|load failed/i.test(msg) ? 'Connexion lente. Touchez Rafraîchir.' : (msg || 'Erreur chargement Boost'))
      setBalanceStatus((prev) => (prev === 'loading' ? 'error' : prev))
    } finally {
      setLoading(false)
      loadLockRef.current = false
      if (loadQueuedRef.current) {
        loadQueuedRef.current = false
        window.setTimeout(() => void load(), 0)
      }
    }
  }, [computeTargets, fetchJsonOnce, getToken, loadBoostRowFromSupabase, loadCreditsFromSupabase, loadOrdersFromSupabase, loadPricingFromSupabase, userEmail])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    setTargets([])
    setTargetKey('')
  }, [userEmail])

  useEffect(() => {
    const onUpdated = () => void load()
    window.addEventListener('mangoo-boosts-updated', onUpdated)
    return () => window.removeEventListener('mangoo-boosts-updated', onUpdated)
  }, [load])

  useEffect(() => {
    try {
      const email = String(userEmail || '').trim().toLowerCase()
      if (email && selectedTarget?.vendorId && selectedTarget?.vendorKind) {
        localStorage.setItem(`${TARGET_PREF_KEY}${email}`, `${selectedTarget.vendorKind}:${selectedTarget.vendorId}`)
        localStorage.setItem(getBoostTargetHintKey(email), JSON.stringify({ vendorId: selectedTarget.vendorId, vendorKind: selectedTarget.vendorKind }))
      }
    } catch {
    }
  }, [selectedTarget?.vendorId, selectedTarget?.vendorKind, userEmail])

  const topup = useCallback(async () => {
    if (topupBusy) return
    const email = readEffectiveEmail(userEmail)
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
      const emailAliases = getExampleDomainAliases(email)
      const forceDevMode = isDemoLoginEmail(email) || isLocalNetworkRuntime() || (isLocalhostRuntime() && isPcDemoEmail(email))
      const localNetworkOnly = isLocalNetworkRuntime() && !isLocalhostRuntime()
      const scheduleBackgroundRefresh = () => {
        // Mobile Safari on local LAN can fail after the server already applied the credit update.
        void (async () => {
          await sleep(1200)
          try {
            await load()
          } catch {
          }
        })()
      }
      const applyTopupResult = async (
        nextValue: number,
        options?: { refresh?: boolean; showToast?: boolean; markSynced?: boolean }
      ) => {
        const finalBal = Number.isFinite(nextValue) ? Math.max(0, Math.floor(nextValue)) : 0
        for (const e of emailAliases) writeLocalCredits(e, finalBal)
        setBalanceXof(finalBal)
        setBalanceStatus('ready')
        pendingCreditsRef.current = { expected: finalBal, until: safeNowMs() + 5000 }
        if (pendingCreditsTimerRef.current) {
          window.clearTimeout(pendingCreditsTimerRef.current)
          pendingCreditsTimerRef.current = null
        }
        if (options?.markSynced) {
          for (const e of emailAliases) markCreditsSynced(e)
        }
        if (options?.showToast !== false) {
          toast.success(`Crédits rechargés: +${formatXof(amount)} XOF`)
        }
        setTopupOpen(false)
        if (options?.refresh !== false) scheduleBackgroundRefresh()
      }

      const readBestLocalBalance = () => {
        let current = balanceXof === null ? 0 : Math.max(0, Math.floor(Number(balanceXof || 0)))
        for (const e of emailAliases) current = Math.max(current, readLocalCredits(e))
        return current
      }

      const devSetBalanceTopup = async (wantedOverride?: number) => {
        const wanted = Number.isFinite(wantedOverride) ? Math.max(0, Math.floor(Number(wantedOverride))) : (readBestLocalBalance() + amount)
        const setRes = await fetchJsonOnce(
          '/api/boosts/credits/set-dev',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, balance_xof: wanted })
          },
          6000
        )
        if (!setRes.ok || !setRes.json?.success) {
          throw new Error(setRes.json?.error || `HTTP ${setRes.status}`)
        }
        return Math.floor(Number(setRes.json?.balanceXof ?? setRes.json?.balance_xof ?? wanted))
      }

      const token = forceDevMode ? '' : await getToken()
      if (!token && localNetworkOnly) {
        const optimisticNext = readBestLocalBalance() + amount
        await applyTopupResult(optimisticNext, { refresh: false })
        void (async () => {
          try {
            const syncedNext = await devSetBalanceTopup(optimisticNext)
            if (syncedNext !== optimisticNext) {
              await applyTopupResult(syncedNext, { showToast: false, markSynced: true })
              return
            }
            for (const e of emailAliases) markCreditsSynced(e)
          } catch {
          } finally {
            scheduleBackgroundRefresh()
          }
        })()
        return
      }

      let remoteError: any = null
      if (token) {
        try {
          const res = await fetchJsonOnce(
            '/api/boosts/credits/topup',
            {
              method: 'POST',
              headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({ amount_xof: amount })
            },
            9000
          )
          if (res.ok && res.json?.success) {
            const next = Math.floor(Number(res.json?.balanceXof ?? 0))
            await applyTopupResult(next, { markSynced: true })
            return
          }
          remoteError = new Error(res.json?.error || `HTTP ${res.status}`)
        } catch (e: any) {
          remoteError = e
        }
      }

      try {
        const next = await devSetBalanceTopup()
        await applyTopupResult(next, { markSynced: true })
        return
      } catch (localError: any) {
        if (remoteError) throw remoteError
        throw localError
      }
    } catch (e: any) {
      const rawMsg = String(e?.message || 'Erreur recharge crédits')
      const msg = /failed to fetch|load failed|networkerror/i.test(rawMsg) ? 'Recharge impossible pour le moment. Réessayez.' : rawMsg
      setError(msg)
      toast.error(msg)
    } finally {
      setTopupBusy(false)
    }
  }, [balanceXof, fetchJsonOnce, getToken, load, topupAmount, topupBusy, userEmail])

  const repairBadges = useCallback(async () => {
    if (repairBusy) return
    setRepairBusy(true)
    setError(null)
    try {
      const token = await getToken()
      if (!token) throw new Error('Connecte-toi avant de réparer.')
      const vendorId = String(selectedTarget?.vendorId || '').trim()
      const vendorKind = String(selectedTarget?.vendorKind || '').trim()
      const res = await fetchJsonOnce(
        '/api/boosts/dev/repair-badges',
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ vendorId, vendorKind })
        },
        9000
      )
      if (!res.ok) throw new Error(res.json?.error || `HTTP ${res.status}`)
      toast.success('Badges synchronisés')
      try {
        window.dispatchEvent(new Event('mangoo-boosts-updated'))
      } catch {
      }
      await load()
    } catch (e: any) {
      setError(e?.message || 'Erreur réparation')
    } finally {
      setRepairBusy(false)
    }
  }, [fetchJsonOnce, getToken, load, repairBusy, selectedTarget?.vendorId, selectedTarget?.vendorKind])

  const buyByCard = useCallback(
    async (p: PricingProduct) => {
      if (!selectedTarget || busy) return
      setBusy(true)
      setError(null)
      try {
        const aliases = await resolveShopAliases({
          vendorId: selectedTarget.vendorId,
          vendorKind: selectedTarget.vendorKind,
          slug: (selectedTarget as any)?.slug || null,
          userEmail,
        })
        const requestVendorId = pickCanonicalVendorId(aliases.vendorIds) || selectedTarget.vendorId
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
              vendorId: requestVendorId,
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
          if (selectedTarget?.vendorId && selectedTarget?.vendorKind) {
            const payload = {
              email: String(email || ''),
              vendorId: String(selectedTarget.vendorId),
              vendorKind: String(selectedTarget.vendorKind),
              vendorName: String(selectedTarget.name || ''),
              shopSlug: String((selectedTarget as any)?.slug || ''),
              returnTo: String(readBoostReturnTarget({
                vendorId: selectedTarget.vendorId,
                vendorKind: selectedTarget.vendorKind,
                shopSlug: (selectedTarget as any)?.slug || null,
              }) || ''),
              kind: p.kind,
              durationHours: Number(p.durationHours),
              sponsoredTier: Number((p as any)?.sponsoredTier || 0) || null,
              amountXof: Number(p.priceXof || 0),
              currency: String(p.currency || 'XOF'),
              savedAt: Date.now(),
            }
            if (email) {
              localStorage.setItem(`${PENDING_BOOST_PREFIX}${email}`, JSON.stringify(payload))
            }
            localStorage.setItem(PENDING_BOOST_LAST_KEY, JSON.stringify(payload))
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
    [busy, fetchJsonOnce, getToken, load, selectedTarget, userEmail]
  )

  const buyByCredits = useCallback(
    async (p: PricingProduct) => {
      if (!selectedTarget || busy) return
      setBusy(true)
      setError(null)
      try {
        const email = readEffectiveEmail(userEmail)
        const forceDevMode = isDemoLoginEmail(email) || (isLocalhostRuntime() && isPcDemoEmail(email))
        const token = forceDevMode ? '' : await getToken()
        if (!email) throw new Error('Email vendeur manquant.')
        const aliases = await resolveShopAliases({
          vendorId: selectedTarget.vendorId,
          vendorKind: selectedTarget.vendorKind,
          slug: (selectedTarget as any)?.slug || null,
          userEmail,
        })
        const requestVendorId = pickCanonicalVendorId(aliases.vendorIds) || selectedTarget.vendorId

        const localFallbackPurchase = async () => {
          const price = Math.floor(Number(p?.priceXof || 0))
          if (!Number.isFinite(price) || price <= 0) throw new Error('Prix invalide')
          const currentCredits = readLocalCredits(email)
          if (currentCredits < price) throw new Error('Crédits insuffisants')
          const nextCredits = currentCredits - price
          writeLocalCredits(email, nextCredits)
          setBalanceXof(nextCredits)
          pendingCreditsRef.current = { expected: nextCredits, until: safeNowMs() + 5000 }
          if (pendingCreditsTimerRef.current) {
            window.clearTimeout(pendingCreditsTimerRef.current)
            pendingCreditsTimerRef.current = null
          }

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
          await sleep(1200)
          await load()
        }

        if (!token) {

          try {
            const res = await fetchJsonOnce(
              '/api/boosts/purchase-with-credits-local',
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  email,
                  vendorId: requestVendorId,
                  vendorKind: selectedTarget.vendorKind,
                  boostKind: p.kind,
                  durationHours: p.durationHours,
                })
              },
              9000
            )
            if (res.ok && res.json?.success) {
              const nextBal = Math.max(0, Math.floor(Number(res.json?.balanceXof ?? 0)))
              setBalanceXof(nextBal)
              const aliases = getExampleDomainAliases(email)
              for (const e of aliases) {
                writeLocalCredits(e, nextBal)
                markCreditsSynced(e)
              }
              pendingCreditsRef.current = { expected: nextBal, until: safeNowMs() + 5000 }
              if (pendingCreditsTimerRef.current) {
                window.clearTimeout(pendingCreditsTimerRef.current)
                pendingCreditsTimerRef.current = null
              }
              try {
                const row = res.json?.row || null
                if (row && selectedTarget) {
                  const key = String(selectedTarget.vendorId)
                  const cfgAll = readLocalBoostConfig()
                  const prev = cfgAll[key] || {}
                  const parseIso = (value: any): number | null => {
                    const t = value ? Date.parse(String(value)) : NaN
                    return Number.isFinite(t) ? t : null
                  }
                  const tierRaw = String(row?.sponsored_tier || '').trim().toLowerCase()
                  const tierNum = tierRaw === 'or' ? 3 : tierRaw === 'argent' ? 2 : tierRaw === 'bronze' ? 1 : null
                  cfgAll[key] = {
                    ...prev,
                    sponsoredUntil: parseIso(row?.sponsored_until),
                    sponsoredTier: tierNum ?? (prev as any)?.sponsoredTier ?? null,
                    promoUntil: parseIso(row?.promo_until),
                    newUntil: parseIso(row?.new_until),
                  }
                  writeLocalBoostConfig(cfgAll)
                }
              } catch {
              }
              toast.success('Boost activé par crédits')
              try {
                window.dispatchEvent(new Event('mangoo-boosts-updated'))
              } catch {
              }
              await sleep(1200)
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
              vendorId: requestVendorId,
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

        if (res.json?.success && res.json?.balanceXof !== undefined && res.json?.balanceXof !== null) {
          const nextBal = Math.max(0, Math.floor(Number(res.json?.balanceXof ?? 0)))
          setBalanceXof(nextBal)
          const aliases = getExampleDomainAliases(email)
          for (const e of aliases) {
            writeLocalCredits(e, nextBal)
            markCreditsSynced(e)
          }
          pendingCreditsRef.current = { expected: nextBal, until: safeNowMs() + 5000 }
          if (pendingCreditsTimerRef.current) {
            window.clearTimeout(pendingCreditsTimerRef.current)
            pendingCreditsTimerRef.current = null
          }
          toast.success('Boost activé par crédits')
          try {
            window.dispatchEvent(new Event('mangoo-boosts-updated'))
          } catch {
          }
          await sleep(1200)
          await load()
          return
        }

        if (res.json?.success) {
          const price = Math.floor(Number(p?.priceXof || 0))
          const current = balanceXof === null ? readLocalCredits(email) : Math.floor(Number(balanceXof || 0))
          const expected = Math.max(0, current - Math.max(0, price))
          setBalanceXof(expected)
          const aliases = getExampleDomainAliases(email)
          for (const e of aliases) {
            writeLocalCredits(e, expected)
            markCreditsSynced(e)
          }
          pendingCreditsRef.current = { expected, until: safeNowMs() + 5000 }
          if (pendingCreditsTimerRef.current) {
            window.clearTimeout(pendingCreditsTimerRef.current)
            pendingCreditsTimerRef.current = null
          }
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
        await sleep(1200)
        await load()
      } catch (e: any) {
        setError(e?.message || 'Erreur achat crédits')
      } finally {
        setBusy(false)
      }
    },
    [balanceXof, busy, fetchJsonOnce, getToken, load, selectedTarget, userEmail]
  )

  const byKind = useMemo(() => {
    const map: Record<BoostKind, PricingProduct[]> = { sponsored: [], promo: [], new: [] }
    for (const p of pricing) map[p.kind].push(p)
    Object.keys(map).forEach((k) => (map[k as BoostKind] = map[k as BoostKind].sort((a, b) => a.durationHours - b.durationHours)))
    return map
  }, [pricing])

  return (
    <div className="space-y-4">
      <div className="bg-white/90 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 backdrop-blur">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-lg font-bold text-gray-900 dark:text-white">Booster ma visibilité</div>
            <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">Achète un boost par carte ou crédits (XOF).</div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void repairBadges()}
              disabled={repairBusy}
              className={`px-4 py-2 rounded-xl text-sm font-bold ${
                repairBusy
                  ? 'bg-gray-200 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                  : 'bg-white/90 text-gray-900 hover:bg-white border border-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 dark:border-gray-700'
              }`}
            >
              {repairBusy ? 'Sync…' : 'Sync badges'}
            </button>
            <button
              type="button"
              onClick={load}
              disabled={loading}
              className={`px-4 py-2 rounded-xl text-sm font-bold ${
                loading
                  ? 'bg-gray-200 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                  : 'bg-[#1b5e20] text-white hover:bg-[#16381a]'
              }`}
            >
              {loading ? 'Chargement…' : 'Rafraîchir'}
            </button>
          </div>
        </div>
        {error && <div className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</div>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white/90 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 lg:col-span-2 backdrop-blur">
          <div className="text-sm font-bold text-gray-900 dark:text-white">Cible</div>
          <select
            value={targetKey}
            onChange={(e) => setTargetKey(e.target.value)}
            className="mt-2 w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-white"
          >
            {targets.map((t) => (
              <option key={`${t.vendorKind}:${t.vendorId}`} value={`${t.vendorKind}:${t.vendorId}`}>
                {`${t.vendorKind === 'provider' ? 'Prestataire' : 'Boutique'} • ${t.name}`}
              </option>
            ))}
          </select>
          {!targets.length && (
            <div className="mt-3 text-sm text-gray-600 dark:text-gray-300">
              Aucune cible liée à ton compte. Associe d’abord ta boutique ou ta fiche prestataire.
            </div>
          )}
        </div>

        <div className="bg-white/90 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 backdrop-blur">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div>
              <div className="text-sm font-bold text-gray-900 dark:text-white">Crédits</div>
              <div className="mt-2 text-2xl font-black text-[#1b5e20] dark:text-[#66bb6a]">
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
              className="w-full rounded-xl bg-[#1b5e20] px-4 py-3 text-xs font-bold text-white transition-colors hover:bg-[#16381a] sm:w-auto sm:px-3 sm:py-2"
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
                className="inline-flex items-center justify-center rounded-xl border border-[#d7e4d1] bg-white px-3 py-2 text-sm font-bold text-gray-700 transition-colors hover:bg-[#f3f8ef] dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div className="mt-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTopupMethod('mobile_money')}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                    topupMethod === 'mobile_money'
                      ? 'bg-[#1b5e20] text-white'
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
                      ? 'bg-[#1b5e20] text-white'
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
                  topupBusy ? 'bg-gray-200 text-gray-500 dark:bg-gray-800 dark:text-gray-400' : 'bg-[#1b5e20] text-white hover:bg-[#16381a]'
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

      <div className="bg-white/90 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 backdrop-blur">
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
        <div className="bg-white/90 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 lg:col-span-2 backdrop-blur">
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
                      ? 'bg-[#1b5e20] text-white'
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
                      <div className="font-black text-[#1b5e20] dark:text-[#66bb6a]">{formatXof(p.priceXof)} XOF</div>
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
                          : 'bg-[#1b5e20] text-white hover:bg-[#16381a]'
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
                          : 'bg-[#1b5e20] text-white hover:bg-[#16381a]'
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

        <div className="bg-white/90 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 backdrop-blur">
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
                    <div className="text-sm font-black text-[#1b5e20] dark:text-[#66bb6a]">{formatXof(o.amount_xof)} {String(o.currency || 'XOF').toUpperCase()}</div>
                    <div className="mt-2">
                      <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                        o.status === 'active'
                          ? 'bg-[#eef6ea] text-[#1b5e20] dark:bg-[#1b5e20]/30 dark:text-[#66bb6a]'
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
                          ? 'bg-[#eef6ea] text-[#1b5e20] dark:bg-[#1b5e20]/30 dark:text-[#66bb6a]'
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
