import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { buildApiUrl } from '../../config/api'
import { supabase } from '../../config/supabase'

type VendorCatalogItem = {
  id: string
  name: string
  kind: 'shop' | 'provider' | string
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

type BoostKind = 'sponsored' | 'promo' | 'new'
type SponsoredTier = 'bronze' | 'argent' | 'or'

const readJson = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    const parsed = JSON.parse(raw)
    return (parsed ?? fallback) as T
  } catch {
    return fallback
  }
}

const formatRemaining = (iso: string | null, nowMs: number) => {
  if (!iso) return '—'
  const t = Date.parse(String(iso))
  if (!Number.isFinite(t)) return '—'
  const diff = t - nowMs
  if (diff <= 0) return 'Expiré'
  const mins = Math.floor(diff / 60000)
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (h <= 0) return `${m} min`
  return `${h} h ${String(m).padStart(2, '0')} min`
}

export function BoostCarteAdmin({ isEnabled }: { isEnabled: boolean }) {
  const [catalog, setCatalog] = useState<VendorCatalogItem[]>([])
  const [vendorId, setVendorId] = useState('')
  const [vendorKind, setVendorKind] = useState<'shop' | 'provider'>('shop')
  const [tier, setTier] = useState<SponsoredTier>('bronze')
  const [row, setRow] = useState<VendorBoostRow | null>(null)
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const loadSeqRef = useRef(0)
  const [nowTick, setNowTick] = useState(() => Date.now())

  useEffect(() => {
    const id = window.setInterval(() => setNowTick(Date.now()), 15000)
    return () => window.clearInterval(id)
  }, [])

  const getAdminToken = useCallback(async () => {
    const { data } = await supabase.auth.getSession()
    return data.session?.access_token || ''
  }, [])

  const loadCatalog = useCallback(() => {
    const list = readJson<VendorCatalogItem[]>('mangoo_local_vendors_catalog', [])
    const next = Array.isArray(list) ? list : []
    setCatalog(next)
    if (!vendorId && next.length) {
      setVendorId(String(next[0].id || ''))
      const k = String((next[0] as any)?.kind || '').trim().toLowerCase()
      setVendorKind(k === 'provider' ? 'provider' : 'shop')
    }
  }, [vendorId])

  useEffect(() => {
    loadCatalog()
    const onStorage = () => loadCatalog()
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [loadCatalog])

  const selectedVendor = useMemo(() => {
    const id = String(vendorId || '').trim()
    if (!id) return null
    return catalog.find((v) => String(v.id) === id) || null
  }, [catalog, vendorId])

  useEffect(() => {
    const k = String(selectedVendor?.kind || '').trim().toLowerCase()
    if (k === 'provider' || k === 'shop') setVendorKind(k)
  }, [selectedVendor?.kind])

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

  const refresh = useCallback(async () => {
    if (!isEnabled) return
    const id = String(vendorId || '').trim()
    const kind = String(vendorKind || '').trim().toLowerCase()
    if (!id || (kind !== 'shop' && kind !== 'provider')) {
      setRow(null)
      return
    }
    const seq = ++loadSeqRef.current
    setLoading(true)
    setError(null)
    setNotice(null)
    try {
      const token = await getAdminToken()
      if (!token) throw new Error('Connectez-vous avec un compte admin pour gérer le Boost.')
      const res = await fetchJsonOnce(
        `/api/admin/boosts/vendor-boosts?vendor_id=${encodeURIComponent(id)}&vendor_kind=${encodeURIComponent(kind)}`,
        { method: 'GET', headers: { Authorization: `Bearer ${token}` } },
        6000
      )
      if (seq !== loadSeqRef.current) return
      if (!res.ok || !res.json?.success) throw new Error(res.json?.error || `HTTP ${res.status}`)
      setRow(res.json.row || null)
    } catch (e: any) {
      setError(e?.message || 'Erreur chargement boost')
      setRow(null)
    } finally {
      setLoading(false)
    }
  }, [fetchJsonOnce, getAdminToken, isEnabled, vendorId, vendorKind])

  useEffect(() => {
    refresh()
  }, [refresh])

  const callAction = useCallback(async (action: string, body: any) => {
    setError(null)
    setNotice(null)
    try {
      const token = await getAdminToken()
      if (!token) throw new Error('Connectez-vous avec un compte admin pour gérer le Boost.')
      setLoading(true)
      const res = await fetchJsonOnce(
        `/api/admin/boosts/${action}`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        },
        8000
      )
      if (!res.ok || !res.json?.success) throw new Error(res.json?.error || `HTTP ${res.status}`)
      setRow(res.json.row || null)
      setNotice('OK')
    } catch (e: any) {
      setError(e?.message || 'Erreur action')
    } finally {
      setLoading(false)
    }
  }, [fetchJsonOnce, getAdminToken])

  const activate = useCallback((boostKind: BoostKind, durationHours: number) => {
    const id = String(vendorId || '').trim()
    if (!id) return
    callAction('vendor-boosts/activate', {
      vendor_id: id,
      vendor_kind: vendorKind,
      boost_kind: boostKind,
      duration_hours: durationHours,
      sponsored_tier: boostKind === 'sponsored' ? tier : undefined
    })
  }, [callAction, tier, vendorId, vendorKind])

  const stop = useCallback((boostKind: BoostKind) => {
    const id = String(vendorId || '').trim()
    if (!id) return
    callAction('vendor-boosts/stop', { vendor_id: id, vendor_kind: vendorKind, boost_kind: boostKind })
  }, [callAction, vendorId, vendorKind])

  const stopAll = useCallback(() => {
    const id = String(vendorId || '').trim()
    if (!id) return
    callAction('vendor-boosts/stop-all', { vendor_id: id, vendor_kind: vendorKind })
  }, [callAction, vendorId, vendorKind])

  const sponsorActive = row?.sponsored_until ? Date.parse(row.sponsored_until) > nowTick : false
  const promoActive = row?.promo_until ? Date.parse(row.promo_until) > nowTick : false
  const newActive = row?.new_until ? Date.parse(row.new_until) > nowTick : false

  const vendorOptions = useMemo(() => {
    const seen = new Set<string>()
    const list: VendorCatalogItem[] = []
    for (const v of catalog) {
      const id = String(v?.id || '').trim()
      if (!id || seen.has(id)) continue
      seen.add(id)
      list.push({ id, name: String(v?.name || id), kind: String(v?.kind || 'shop') })
    }
    list.sort((a, b) => a.name.localeCompare(b.name, 'fr'))
    return list
  }, [catalog])

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-lg font-bold text-gray-900 dark:text-white">Boost Carte</div>
            <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">Configuration admin (Sponsorisé / Promo / Nouveau). Limite carte: 2 sponsorisés visibles.</div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.open('/mangoo-local.html', '_blank', 'noopener,noreferrer')}
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
            >
              Ouvrir Local+ (nouvel onglet)
            </button>
            <button
              type="button"
              onClick={refresh}
              disabled={!isEnabled || loading}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                !isEnabled || loading
                  ? 'bg-gray-200 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {loading ? 'Chargement…' : 'Actualiser'}
            </button>
            <button
              type="button"
              onClick={stopAll}
              disabled={!isEnabled || loading || !vendorId}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                !isEnabled || loading || !vendorId
                  ? 'bg-red-100 text-red-400 dark:bg-red-900/20 dark:text-red-400'
                  : 'bg-red-600 text-white hover:bg-red-700'
              }`}
            >
              Tout arrêter
            </button>
          </div>
        </div>
        {error && <div className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</div>}
        {notice && <div className="mt-3 text-sm text-emerald-700 dark:text-emerald-400">{notice}</div>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Boutique / Métier</div>
              <select
                value={vendorId}
                onChange={(e) => setVendorId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-white"
              >
                {vendorOptions.length === 0 && <option value="">Aucun vendeur détecté</option>}
                {vendorOptions.map((v) => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">Catalogue: `mangoo_local_vendors_catalog`</div>
            </div>

            <div>
              <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Tier sponsor</div>
              <select
                value={tier}
                onChange={(e) => setTier(e.target.value as SponsoredTier)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-white"
              >
                <option value="bronze">Bronze</option>
                <option value="argent">Argent</option>
                <option value="or">Or</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-5">
          <div className="text-sm font-bold text-gray-900 dark:text-white">État</div>
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-700 dark:text-gray-300">Sponsorisé</span>
              <span className={sponsorActive ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-gray-500 dark:text-gray-400'}>
                {sponsorActive ? formatRemaining(row?.sponsored_until || null, nowTick) : 'Inactif'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700 dark:text-gray-300">Promo</span>
              <span className={promoActive ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-gray-500 dark:text-gray-400'}>
                {promoActive ? formatRemaining(row?.promo_until || null, nowTick) : 'Inactif'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700 dark:text-gray-300">Nouveau</span>
              <span className={newActive ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-gray-500 dark:text-gray-400'}>
                {newActive ? formatRemaining(row?.new_until || null, nowTick) : 'Inactif'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div className="text-base font-bold text-gray-900 dark:text-white">Sponsorisé</div>
            <div className={`text-xs font-semibold px-2 py-1 rounded-lg ${sponsorActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}`}>
              {sponsorActive ? 'Actif' : 'Inactif'}
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button type="button" onClick={() => activate('sponsored', 12)} disabled={!vendorId || loading} className="px-3 py-2 rounded-xl text-sm font-semibold bg-gray-100 text-gray-900 hover:bg-gray-200 disabled:opacity-60 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700">Activer 12h</button>
            <button type="button" onClick={() => activate('sponsored', 24)} disabled={!vendorId || loading} className="px-3 py-2 rounded-xl text-sm font-semibold bg-gray-100 text-gray-900 hover:bg-gray-200 disabled:opacity-60 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700">Activer 24h</button>
            <button type="button" onClick={() => activate('sponsored', 72)} disabled={!vendorId || loading} className="px-3 py-2 rounded-xl text-sm font-semibold bg-gray-100 text-gray-900 hover:bg-gray-200 disabled:opacity-60 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700">Activer 72h</button>
            <button type="button" onClick={() => stop('sponsored')} disabled={!vendorId || loading || !sponsorActive} className="px-3 py-2 rounded-xl text-sm font-semibold bg-gray-200 text-gray-600 disabled:opacity-60 dark:bg-gray-800 dark:text-gray-300">Stop</button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div className="text-base font-bold text-gray-900 dark:text-white">Promo</div>
            <div className={`text-xs font-semibold px-2 py-1 rounded-lg ${promoActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}`}>
              {promoActive ? 'Actif' : 'Inactif'}
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button type="button" onClick={() => activate('promo', 24)} disabled={!vendorId || loading} className="px-3 py-2 rounded-xl text-sm font-semibold bg-amber-100 text-amber-900 hover:bg-amber-200 disabled:opacity-60 dark:bg-amber-900/20 dark:text-amber-200 dark:hover:bg-amber-900/30">Activer 24h</button>
            <button type="button" onClick={() => activate('promo', 72)} disabled={!vendorId || loading} className="px-3 py-2 rounded-xl text-sm font-semibold bg-amber-100 text-amber-900 hover:bg-amber-200 disabled:opacity-60 dark:bg-amber-900/20 dark:text-amber-200 dark:hover:bg-amber-900/30">Activer 72h</button>
            <button type="button" onClick={() => stop('promo')} disabled={!vendorId || loading || !promoActive} className="col-span-2 px-3 py-2 rounded-xl text-sm font-semibold bg-gray-200 text-gray-600 disabled:opacity-60 dark:bg-gray-800 dark:text-gray-300">Stop</button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div className="text-base font-bold text-gray-900 dark:text-white">Nouveau</div>
            <div className={`text-xs font-semibold px-2 py-1 rounded-lg ${newActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}`}>
              {newActive ? 'Actif' : 'Inactif'}
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button type="button" onClick={() => activate('new', 24)} disabled={!vendorId || loading} className="px-3 py-2 rounded-xl text-sm font-semibold bg-indigo-100 text-indigo-900 hover:bg-indigo-200 disabled:opacity-60 dark:bg-indigo-900/20 dark:text-indigo-200 dark:hover:bg-indigo-900/30">Activer 24h</button>
            <button type="button" onClick={() => activate('new', 72)} disabled={!vendorId || loading} className="px-3 py-2 rounded-xl text-sm font-semibold bg-indigo-100 text-indigo-900 hover:bg-indigo-200 disabled:opacity-60 dark:bg-indigo-900/20 dark:text-indigo-200 dark:hover:bg-indigo-900/30">Activer 72h</button>
            <button type="button" onClick={() => stop('new')} disabled={!vendorId || loading || !newActive} className="col-span-2 px-3 py-2 rounded-xl text-sm font-semibold bg-gray-200 text-gray-600 disabled:opacity-60 dark:bg-gray-800 dark:text-gray-300">Stop</button>
          </div>
        </div>
      </div>
    </div>
  )
}

