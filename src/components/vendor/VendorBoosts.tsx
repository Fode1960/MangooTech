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
}

const formatXof = (value: number) => {
  const n = Math.floor(Number(value) || 0)
  return new Intl.NumberFormat('fr-FR').format(n)
}

const kindLabel: Record<BoostKind, string> = {
  sponsored: 'Sponsorisé',
  promo: 'Promo',
  new: 'Nouveau'
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
  const [orders, setOrders] = useState<BoostOrder[]>([])
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const loadSeqRef = useRef(0)

  const selectedTarget = useMemo(() => {
    const [vendorKind, vendorId] = String(targetKey || '').split(':')
    if (!vendorKind || !vendorId) return null
    return targets.find((t) => t.vendorKind === vendorKind && t.vendorId === vendorId) || null
  }, [targetKey, targets])

  const computeTargets = useCallback(() => {
    const email = String(userEmail || '').trim().toLowerCase()
    const catalog = readJson<any[]>('mangoo_local_vendors_catalog', [])
    let ids: string[] = []
    try {
      const raw = localStorage.getItem(`mangoo_my_shop_ids:${email}`)
      const parsed = raw ? JSON.parse(raw) : []
      ids = Array.isArray(parsed) ? parsed.map((x) => String(x)) : []
    } catch {
      ids = []
    }
    if (!ids.length) {
      const legacy = localStorage.getItem('mangoo_my_shop_id')
      if (legacy) ids = [String(legacy)]
    }

    const list: VendorTarget[] = []
    for (const id of ids) {
      const v = catalog.find((x) => String(x?.id) === String(id) && String(x?.kind || 'shop') === 'shop')
      list.push({ vendorId: String(id), vendorKind: 'shop', name: String(v?.name || `Boutique ${id}`) })
    }
    const uniq = new Map<string, VendorTarget>()
    for (const t of list) uniq.set(`${t.vendorKind}:${t.vendorId}`, t)
    const finalList = Array.from(uniq.values())
    setTargets(finalList)
    if (!targetKey && finalList.length) setTargetKey(`${finalList[0].vendorKind}:${finalList[0].vendorId}`)
  }, [targetKey, userEmail])

  const getToken = useCallback(async () => {
    const { data } = await supabase.auth.getSession()
    return data.session?.access_token || ''
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
    } finally {
      window.clearTimeout(t)
    }
  }, [])

  const load = useCallback(async () => {
    const seq = ++loadSeqRef.current
    setLoading(true)
    setError(null)
    try {
      computeTargets()

      const pricingRes = await fetchJsonOnce('/api/boosts/pricing', { method: 'GET' }, 6000)
      if (seq !== loadSeqRef.current) return
      const products = Array.isArray(pricingRes.json?.products) ? pricingRes.json.products : []
      const normalized: PricingProduct[] = products
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
        .filter(Boolean) as PricingProduct[]
      setPricing(normalized)

      const token = await getToken()
      if (!token) {
        setBalanceXof(null)
        setOrders([])
        return
      }

      const creditRes = await fetchJsonOnce(
        '/api/boosts/credits-balance',
        { method: 'GET', headers: { Authorization: `Bearer ${token}` } },
        6000
      )
      if (seq !== loadSeqRef.current) return
      if (creditRes.ok) setBalanceXof(Number(creditRes.json?.balanceXof || 0))

      if (selectedTarget) {
        const qs = new URLSearchParams({ vendorId: selectedTarget.vendorId, vendorKind: selectedTarget.vendorKind })
        const ordersRes = await fetchJsonOnce(
          `/api/boosts/my-orders?${qs.toString()}`,
          { method: 'GET', headers: { Authorization: `Bearer ${token}` } },
          6000
        )
        if (seq !== loadSeqRef.current) return
        if (ordersRes.ok) {
          const rows = Array.isArray(ordersRes.json?.orders) ? ordersRes.json.orders : []
          setOrders(rows as BoostOrder[])
        }
      }
    } catch (e: any) {
      setError(e?.message || 'Erreur chargement Boost')
    } finally {
      setLoading(false)
    }
  }, [computeTargets, fetchJsonOnce, getToken, selectedTarget])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!selectedTarget) return
    load()
  }, [selectedTarget?.vendorId, selectedTarget?.vendorKind])

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

        if (!res.ok) throw new Error(res.json?.error || `HTTP ${res.status}`)
        const url = String(res.json?.sessionUrl || '')
        if (!url) throw new Error('URL Stripe manquante')
        window.location.href = url
      } catch (e: any) {
        setError(e?.message || 'Erreur paiement carte')
      } finally {
        setBusy(false)
      }
    },
    [busy, fetchJsonOnce, getToken, selectedTarget]
  )

  const buyByCredits = useCallback(
    async (p: PricingProduct) => {
      if (!selectedTarget || busy) return
      setBusy(true)
      setError(null)
      try {
        const token = await getToken()
        if (!token) throw new Error('Connecte-toi avant d’acheter.')
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
        if (!res.ok) throw new Error(res.json?.error || `HTTP ${res.status}`)
        toast.success('Boost activé par crédits')
        await load()
      } catch (e: any) {
        setError(e?.message || 'Erreur achat crédits')
      } finally {
        setBusy(false)
      }
    },
    [busy, fetchJsonOnce, getToken, load, selectedTarget]
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
          <div className="text-sm font-bold text-gray-900 dark:text-white">Crédits</div>
          <div className="mt-2 text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {balanceXof === null ? '—' : `${formatXof(balanceXof)} XOF`}
          </div>
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">Utilisables pour payer des boosts sans carte.</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {(['sponsored', 'promo', 'new'] as BoostKind[]).map((k) => (
          <div key={k} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-5">
            <div className="text-base font-bold text-gray-900 dark:text-white">{kindLabel[k]}</div>
            <div className="mt-3 space-y-3">
              {(byKind[k] || []).map((p) => {
                const canCredits = balanceXof !== null && balanceXof >= p.priceXof
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
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={!selectedTarget || busy || p.active === false}
                        onClick={() => buyByCard(p)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold ${
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
                        className={`px-4 py-2 rounded-xl text-xs font-bold ${
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
              {!loading && (byKind[k] || []).length === 0 && (
                <div className="text-sm text-gray-600 dark:text-gray-300">Aucune offre disponible.</div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-base font-bold text-gray-900 dark:text-white">Historique</div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Dernières commandes boost pour cette cible.</div>
          </div>
        </div>
        <div className="mt-4 overflow-auto">
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
  )
}

