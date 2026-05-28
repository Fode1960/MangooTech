import { useEffect, useMemo, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { supabase } from '../config/supabase'

const LOCAL_ORDERS_PREFIX = 'mangoo_boost_orders:'

const safeString = (v: any) => String(v ?? '').trim()
const parseMs = (value: any) => {
  const t = value ? Date.parse(String(value)) : NaN
  return Number.isFinite(t) ? t : 0
}

const tierLabelFromNumber = (tier: number | null | undefined) => {
  const n = Number(tier || 0)
  if (n === 3) return 'or'
  if (n === 2) return 'argent'
  if (n === 1) return 'bronze'
  return null
}

function readLocalOrders(email: string) {
  try {
    const key = `${LOCAL_ORDERS_PREFIX}${safeString(email).toLowerCase()}`
    const raw = localStorage.getItem(key)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeLocalOrders(email: string, orders: any[]) {
  try {
    const key = `${LOCAL_ORDERS_PREFIX}${safeString(email).toLowerCase()}`
    localStorage.setItem(key, JSON.stringify(Array.isArray(orders) ? orders : []))
  } catch {
  }
}

async function resolveCanonicalShopIds(params: { vendorId: string; vendorKind: string; shopSlug?: string; email?: string }) {
  const vendorKind = safeString(params.vendorKind).toLowerCase()
  const vendorId = safeString(params.vendorId)
  const ids = new Set<string>()
  if (vendorId) ids.add(vendorId)
  if (vendorKind !== 'shop') return Array.from(ids)

  const email = safeString(params.email).toLowerCase()
  if (email && email.includes('@')) ids.add(`local-${email}`)

  try {
    const slug = safeString(params.shopSlug)
    if (slug) {
      const r = await supabase.from('shops').select('id,email').eq('slug', slug).maybeSingle()
      const shopId = safeString((r as any)?.data?.id)
      const shopEmail = safeString((r as any)?.data?.email).toLowerCase()
      if (shopId) ids.add(shopId)
      if (shopEmail) ids.add(`local-${shopEmail}`)
    }
  } catch {
  }

  if (email && email.includes('@')) {
    try {
      const attempt = async (withOwnerEmail: boolean) => {
        const q = supabase
          .from('shops')
          .select('id,owner_email,email,created_at')
          .order('created_at', { ascending: false })
          .limit(5)
        if (withOwnerEmail) return await q.or(`owner_email.eq.${email},email.eq.${email}`)
        return await q.eq('email', email)
      }
      let r: any = await attempt(true)
      if (r?.error) {
        const msg = String(r.error.message || '').toLowerCase()
        if (msg.includes('could not find') && msg.includes('owner_email')) r = await attempt(false)
      }
      for (const row of Array.isArray(r?.data) ? r.data : []) {
        const shopId = safeString(row?.id)
        const shopEmail = safeString(row?.email || row?.owner_email).toLowerCase()
        if (shopId) ids.add(shopId)
        if (shopEmail) ids.add(`local-${shopEmail}`)
      }
    } catch {
    }
  }

  return Array.from(ids)
}

async function upsertBoostAcrossAliases(params: {
  vendorKind: string
  vendorIds: string[]
  kind: 'sponsored' | 'promo' | 'new'
  durationHours: number
  sponsoredTier?: number | null
}) {
  const vendorKind = safeString(params.vendorKind).toLowerCase()
  const vendorIds = Array.from(new Set((Array.isArray(params.vendorIds) ? params.vendorIds : []).map((x) => safeString(x)).filter(Boolean)))
  if (!vendorIds.length) return { expiresAtIso: null as string | null }

  const field = params.kind === 'sponsored' ? 'sponsored_until' : params.kind === 'promo' ? 'promo_until' : 'new_until'
  let baseMs = Date.now()
  try {
    const r = await supabase
      .from('vendor_boosts')
      .select('sponsored_until,promo_until,new_until')
      .eq('vendor_kind', vendorKind)
      .in('vendor_id', vendorIds)
    const rows = Array.isArray((r as any)?.data) ? (r as any).data : []
    for (const row of rows) {
      const t = parseMs((row as any)?.[field])
      if (t > baseMs) baseMs = t
    }
  } catch {
  }

  const until = new Date(baseMs + Math.max(0, Number(params.durationHours || 0)) * 60 * 60 * 1000).toISOString()
  for (const vendorId of vendorIds) {
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
    try {
      await supabase.from('vendor_boosts').upsert(payload, { onConflict: 'vendor_kind,vendor_id' })
    } catch {
    }
  }
  return { expiresAtIso: until }
}

export default function BoostReturn({ mode }: { mode: 'success' | 'cancel' }) {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const id = window.setInterval(() => setTick((x) => x + 1), 1500)
    return () => window.clearInterval(id)
  }, [])

  const sessionId = useMemo(() => String(params.get('session_id') || '').trim(), [params, tick])
  const orderId = useMemo(() => String(params.get('order_id') || '').trim(), [params, tick])

  useEffect(() => {
    if (mode !== 'success') return
    ;(async () => {
      try {
        const rawUser = localStorage.getItem('mangoo-current-user')
        const parsedUser = rawUser ? JSON.parse(rawUser) : null
        const email = safeString(parsedUser?.email).toLowerCase()
        if (!email) return
        const raw = localStorage.getItem(`mangoo_boost_pending:${email}`)
        const pending = raw ? JSON.parse(raw) : null
        if (!pending?.vendorId || !pending?.vendorKind || !pending?.kind || !pending?.durationHours) return
        const savedAt = Number(pending?.savedAt || 0)
        if (!Number.isFinite(savedAt) || Date.now() - savedAt > 60 * 60 * 1000) return

        const vendorKind = safeString(pending.vendorKind || 'shop')
        const vendorIds = await resolveCanonicalShopIds({
          vendorId: safeString(pending.vendorId),
          vendorKind,
          shopSlug: safeString(pending.shopSlug),
          email,
        })
        const canonicalVendorId = vendorIds.find((id) => !id.startsWith('local-')) || vendorIds[0] || safeString(pending.vendorId)
        const { expiresAtIso } = await upsertBoostAcrossAliases({
          vendorKind,
          vendorIds,
          kind: pending.kind,
          durationHours: Number(pending.durationHours || 0),
          sponsoredTier: Number(pending?.sponsoredTier || 0) || null,
        })

        const stableId = safeString(orderId || sessionId) || `${Date.now()}`
        const order = {
          id: `card_${stableId}`,
          vendor_id: canonicalVendorId,
          vendor_kind: vendorKind,
          boost_kind: pending.kind,
          duration_hours: Number(pending.durationHours || 0),
          amount_xof: Math.floor(Number(pending.amountXof || 0)),
          currency: safeString(pending.currency || 'XOF') || 'XOF',
          status: 'active',
          expires_at: expiresAtIso,
          created_at: new Date().toISOString(),
        }
        const allOrders = readLocalOrders(email).filter((o: any) => String(o?.id || '') !== order.id)
        writeLocalOrders(email, [order, ...allOrders].slice(0, 100))

        try {
          window.dispatchEvent(new Event('mangoo-boosts-updated'))
        } catch {
        }
        localStorage.removeItem(`mangoo_boost_pending:${email}`)
      } catch {
      }
    })()
  }, [mode, orderId, sessionId])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-6">
      <div className="w-full max-w-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-6">
        <div className="text-xl font-black text-gray-900 dark:text-white">
          {mode === 'success' ? 'Paiement reçu' : 'Paiement annulé'}
        </div>
        <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
          {mode === 'success'
            ? 'Ton boost sera activé automatiquement après confirmation serveur.'
            : 'Tu peux relancer le paiement depuis ton espace vendeur.'}
        </div>

        <div className="mt-4 space-y-2 text-xs text-gray-600 dark:text-gray-400">
          {sessionId && (
            <div className="break-all">
              <span className="font-bold">session_id:</span> {sessionId}
            </div>
          )}
          {orderId && (
            <div className="break-all">
              <span className="font-bold">order_id:</span> {orderId}
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-wrap gap-3 justify-end">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="px-4 py-2 rounded-xl text-sm font-bold bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            Retour
          </button>
          <button
            type="button"
            onClick={() => {
              try {
                localStorage.setItem('mangoo-vendor-active-tab', 'boosts')
                localStorage.setItem('mangoo-last-view', 'connexion')
              } catch {
              }
              navigate('/connexion')
            }}
            className="px-4 py-2 rounded-xl text-sm font-bold bg-blue-600 text-white hover:bg-blue-700"
          >
            Ouvrir Boost vendeur
          </button>
        </div>
      </div>
    </div>
  )
}

