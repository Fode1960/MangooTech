import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { buildApiUrl } from '../config/api'
import { supabase } from '../config/supabase'
import { useAuth } from '../hooks/useAuth'

type ProviderStatus = 'pending' | 'approved' | 'rejected' | 'suspended'

type Provider = {
  id: string
  user_id: string | null
  name: string
  slug: string
  email: string | null
  phone: string | null
  city: string | null
  country: string | null
  status: ProviderStatus
  is_visible: boolean
  created_at: string
  source?: string | null
}

const normalizeSearchText = (value: any) => {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

const matchesProviderSearch = (provider: Provider, term: string) => {
  const q = normalizeSearchText(term)
  if (!q) return true
  const hay = normalizeSearchText(`${provider.name} ${provider.slug} ${provider.email || ''} ${provider.phone || ''} ${provider.city || ''} ${provider.country || ''}`)
  return hay.includes(q)
}

const statusToLabel = (s: ProviderStatus) => {
  if (s === 'approved') return 'Approuvé'
  if (s === 'pending') return 'En attente'
  if (s === 'rejected') return 'Rejeté'
  if (s === 'suspended') return 'Suspendu'
  return s
}

const statusToBadge = (s: ProviderStatus) => {
  if (s === 'approved') return 'bg-[#f6faf3] text-[#1b5e20] dark:bg-[#1b5e20]/30 dark:text-[#8ccf8c]'
  if (s === 'pending') return 'bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-200'
  if (s === 'rejected') return 'bg-rose-100 text-rose-900 dark:bg-rose-900/30 dark:text-rose-200'
  if (s === 'suspended') return 'bg-gray-200 text-gray-900 dark:bg-gray-800 dark:text-gray-200'
  return 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-200'
}

type AdminProvidersProps = {
  embedded?: boolean;
};

export default function AdminProviders({ embedded = false }: AdminProvidersProps) {
  const { isAdmin } = useAuth()
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [isLocalMode, setIsLocalMode] = useState(false)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<'all' | ProviderStatus>('all')
  const [isProcessing, setIsProcessing] = useState(false)
  const loadSeqRef = useRef(0)

  const LOCAL_PROVIDERS_KEY = 'mangoo-admin-providers'

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

  const getAdminToken = useCallback(async () => {
    try {
      const demo = localStorage.getItem('admin-demo-user')
      if (demo) return 'demo-admin'
    } catch {
    }
    try {
      const raw = localStorage.getItem('mangoo-current-user')
      const u = raw ? JSON.parse(raw) : null
      if (String(u?.role || '') === 'admin') return 'demo-admin'
    } catch {
    }
    return null
  }, [])

  const loadProvidersFromLocalPlus = useCallback(() => {
    const safeGetItem = (key: string) => {
      try {
        return localStorage.getItem(key)
      } catch {
        return null
      }
    }

    const safeSetItem = (key: string, value: string) => {
      try {
        localStorage.setItem(key, value)
        return true
      } catch {
        return false
      }
    }

    const safeParse = (raw: string | null, fallback: any) => {
      try {
        const parsed = raw ? JSON.parse(raw) : fallback
        return parsed
      } catch {
        return fallback
      }
    }

    const readLocalProviders = (): Provider[] => {
      const stored = safeParse(safeGetItem(LOCAL_PROVIDERS_KEY), [])
      return Array.isArray(stored) ? (stored as Provider[]).filter((p) => Boolean(p?.id)) : []
    }

    const ensureSeeded = (): Provider[] => {
      const existing = readLocalProviders()
      if (existing.length > 0) return existing
      const now = new Date().toISOString()
      const seeded: Provider[] = [
        {
          id: 'localprov-1',
          user_id: null,
          name: 'Mangoo Livraison Express',
          slug: 'mangoo-livraison-express',
          email: 'contact@livraison.mangoo.tech',
          phone: '+221 77 123 45 67',
          city: 'Dakar',
          country: 'SN',
          status: 'approved',
          is_visible: true,
          created_at: now,
        },
        {
          id: 'localprov-2',
          user_id: null,
          name: 'Mangoo Support Pro',
          slug: 'mangoo-support-pro',
          email: 'support@mangoo.tech',
          phone: '+33 6 00 00 00 00',
          city: 'Paris',
          country: 'FR',
          status: 'pending',
          is_visible: false,
          created_at: now,
        },
        {
          id: 'localprov-3',
          user_id: null,
          name: 'Studio Live Shopping',
          slug: 'studio-live-shopping',
          email: 'studio@mangoo.tech',
          phone: null,
          city: 'Abidjan',
          country: 'CI',
          status: 'approved',
          is_visible: true,
          created_at: now,
        },
        {
          id: 'localprov-4',
          user_id: null,
          name: 'Partenaire Paiements',
          slug: 'partenaire-paiements',
          email: null,
          phone: null,
          city: null,
          country: null,
          status: 'suspended',
          is_visible: false,
          created_at: now,
        },
      ]
      safeSetItem(LOCAL_PROVIDERS_KEY, JSON.stringify(seeded))
      return seeded
    }

    const localProviders = readLocalProviders()

    const legacy = safeParse(safeGetItem('mangoo_vendors'), [])
    const custom = safeParse(safeGetItem('mangoo_custom_vendors'), [])
    const normalizeNonEmpty = (value: any) => {
      const v = String(value ?? '').trim()
      return v ? v : ''
    }

    const pickBetterVendor = (a: any, b: any) => {
      const score = (v: any) => {
        let s = 0
        if (normalizeNonEmpty(v?.ownerEmail)) s += 5
        if (normalizeNonEmpty(v?.phone)) s += 3
        if (normalizeNonEmpty(v?.name)) s += 2
        if (normalizeNonEmpty(v?.trade) || normalizeNonEmpty(v?.metier) || normalizeNonEmpty(v?.job)) s += 1
        return s
      }
      return score(b) > score(a) ? b : a
    }

    const mergeVendorsById = (rows: any[]) => {
      const out = new Map<string, any>()
      ;(rows || []).forEach((v) => {
        const id = normalizeNonEmpty(v?.id)
        if (!id) return
        const key = id
        const prev = out.get(key)
        if (!prev) {
          out.set(key, v)
          return
        }
        const best = pickBetterVendor(prev, v)
        out.set(key, { ...prev, ...v, ...best })
      })
      return Array.from(out.values())
    }

    const list = mergeVendorsById([...(Array.isArray(legacy) ? legacy : []), ...(Array.isArray(custom) ? custom : [])])

    const term = search
    const isLocalPlusProvider = (v: any) => {
      const kind = String(v?.kind || '').trim().toLowerCase()
      if (kind === 'service') return true
      if (String(v?.trade || '').trim()) return true
      if (String(v?.metier || '').trim()) return true
      if (String(v?.job || '').trim()) return true
      if (Array.isArray(v?.coverage) && v.coverage.length) return true
      if (Array.isArray(v?.neighborhoods) && v.neighborhoods.length) return true
      const cat = String(v?.category || '').toLowerCase()
      if (cat.includes('service') || cat.includes('métier') || cat.includes('metier') || cat.includes('artisan')) return true
      return false
    }

    const providerVendors = list.filter(isLocalPlusProvider)
    const source = providerVendors.length > 0 ? providerVendors : list

    const rowsFromVendors = source
      .map((v: any) => {
        const approval = String(v?.approvalStatus || '').trim().toLowerCase() || 'approved'
        const normalizedStatus: ProviderStatus =
          approval === 'approved' || approval === 'pending' || approval === 'rejected' || approval === 'suspended'
            ? (approval as ProviderStatus)
            : 'pending'
        const id = `localplus-${String(v?.id)}`
        const name = String(v?.name || '').trim() || 'Prestataire'
        const slug = String(v?.slug || '').trim() || String(name).toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').slice(0, 64) || id
        const email = String(v?.ownerEmail || '').trim() || null
        const phone = String(v?.phone || '').trim() || null
        const city = String(v?.city || '').trim() || null
        const country = String(v?.country || '').trim() || null
        const is_visible = normalizedStatus === 'approved'

        return {
          id,
          user_id: null,
          name,
          slug,
          email,
          phone,
          city,
          country,
          status: normalizedStatus,
          is_visible,
          created_at: String(v?.createdAt || v?.updatedAt || new Date().toISOString()),
          source: 'localplus'
        } as Provider
      })

    const normalizeSlug = (value: any) => {
      const s = String(value ?? '').trim().toLowerCase()
      return s
    }

    const mergeProviderStatus = (a: ProviderStatus, b: ProviderStatus): ProviderStatus => {
      if (a === b) return a
      const order: ProviderStatus[] = ['approved', 'pending', 'rejected', 'suspended']
      const ai = order.indexOf(a)
      const bi = order.indexOf(b)
      return (ai >= 0 && bi >= 0 ? order[Math.min(ai, bi)] : a) as ProviderStatus
    }

    const mergeProvidersBySlug = (rows: Provider[]) => {
      const out = new Map<string, Provider>()
      rows.forEach((p) => {
        const key = normalizeSlug(p?.slug) || normalizeSlug(p?.name) || String(p?.id || '')
        if (!key) return
        const prev = out.get(key)
        if (!prev) {
          out.set(key, p)
          return
        }
        const merged: Provider = {
          ...prev,
          ...p,
          id: String(prev.id || '').startsWith('localprov-') ? prev.id : p.id,
          status: mergeProviderStatus(prev.status, p.status),
          is_visible: prev.is_visible || p.is_visible,
          email: prev.email || p.email,
          phone: prev.phone || p.phone,
          city: prev.city || p.city,
          country: prev.country || p.country,
          created_at: String(prev.created_at || p.created_at || new Date().toISOString()),
        }
        out.set(key, merged)
      })
      return Array.from(out.values())
    }

    const combined = mergeProvidersBySlug([...localProviders, ...rowsFromVendors])
    const withSeed = combined.length > 0 ? combined : ensureSeeded()

    const filtered = withSeed.filter((p: Provider) => {
      if (status !== 'all' && p.status !== status) return false
      return matchesProviderSearch(p, term)
    })

    setProviders(filtered)
  }, [search, status])

  const loadProviders = useCallback(async () => {
    const seq = ++loadSeqRef.current
    setLoading(true)
    setError(null)
    setNotice(null)
    setIsLocalMode(false)
    try {
      if (isAdmin) {
        try {
          const term = search.trim()
          let q = supabase
            .from('providers')
            .select('id, user_id, name, slug, email, phone, city, country, status, is_visible, created_at')
            .order('created_at', { ascending: false })

          if (status !== 'all') q = q.eq('status', status)

          const { data, error: supaError } = await q
          if (seq !== loadSeqRef.current) return
          if (supaError) throw supaError
          if (Array.isArray(data)) {
            const rows = (data as any[])
              .filter((p) => Boolean((p as any)?.id))
              .filter((p: any) => matchesProviderSearch(p as Provider, term))
            if (rows.length > 0) {
              setProviders(rows as any)
              setIsLocalMode(false)
              setNotice(null)
              return
            }
            loadProvidersFromLocalPlus()
            setNotice('Serveur indisponible pour le moment. Affichage des données disponibles.')
            setIsLocalMode(true)
            return
          }
        } catch {
          if (seq !== loadSeqRef.current) return
          loadProvidersFromLocalPlus()
          setNotice('Serveur indisponible pour le moment. Affichage des données disponibles.')
          setIsLocalMode(true)
          return
        }
      }

      const token = await getAdminToken()
      if (!token) {
        loadProvidersFromLocalPlus()
        setNotice('Serveur indisponible pour le moment. Affichage des données disponibles.')
        setIsLocalMode(true)
        return
      }

      loadProvidersFromLocalPlus()
      setIsLocalMode(true)
      setNotice(null)
      setLoading(false)

      const qs = new URLSearchParams()
      if (status !== 'all') qs.set('status', status)
      const endpoint = `/api/admin/providers/providers${qs.toString() ? `?${qs.toString()}` : ''}`
      void (async () => {
        try {
          const res = await fetchJsonOnce(
            endpoint,
            {
              method: 'GET',
              headers: {
                Authorization: `Bearer ${token}`
              }
            },
            1200
          )

          if (seq !== loadSeqRef.current) return

          const isValidApiResponse =
            res.ok &&
            res?.json &&
            typeof res.json === 'object' &&
            (res.json as any).success === true &&
            Array.isArray((res.json as any).data)

          if (isValidApiResponse) {
            const data = ((res.json as any).data as Provider[])
              .filter((p) => Boolean(p?.id))
              .filter((p) => matchesProviderSearch(p, search))
            if (data.length > 0) {
              setProviders(data)
              setIsLocalMode(false)
              setNotice(null)
              return
            }
            setNotice('Aucune donnée distante disponible pour le moment. Affichage des données disponibles.')
            setIsLocalMode(true)
            return
          }

          setNotice('Serveur indisponible pour le moment. Affichage des données disponibles.')
          setIsLocalMode(true)
        } catch {
          if (seq !== loadSeqRef.current) return
          setNotice('Serveur indisponible pour le moment. Affichage des données disponibles.')
          setIsLocalMode(true)
        }
      })()
    } catch (e: any) {
      try {
        loadProvidersFromLocalPlus()
        setIsLocalMode(true)
        setNotice('Serveur indisponible pour le moment. Affichage des données disponibles.')
        setError(null)
      } catch {
        const msg = e?.message || 'Erreur lors du chargement'
        setError(msg)
        setProviders([])
      }
    } finally {
      if (seq === loadSeqRef.current) setLoading(false)
    }
  }, [fetchJsonOnce, getAdminToken, isAdmin, loadProvidersFromLocalPlus, search, status])

  useEffect(() => {
    loadProviders()
  }, [loadProviders])

  const updateProvider = useCallback(
    async (id: string, patch: Partial<Provider>) => {
      if (isProcessing) return
      setIsProcessing(true)
      setError(null)
      try {
        if (String(id).startsWith('localprov-')) {
          const safeParse = (raw: string | null, fallback: any) => {
            try {
              const parsed = raw ? JSON.parse(raw) : fallback
              return parsed
            } catch {
              return fallback
            }
          }
          const stored = safeParse(localStorage.getItem(LOCAL_PROVIDERS_KEY), [])
          const list = Array.isArray(stored) ? (stored as Provider[]) : []
          const idx = list.findIndex((p) => String(p?.id) === String(id))
          if (idx >= 0) {
            list[idx] = { ...list[idx], ...patch }
            try {
              localStorage.setItem(LOCAL_PROVIDERS_KEY, JSON.stringify(list))
            } catch {
            }
          }
          setProviders((prev) => prev.map((p) => (p.id === id ? ({ ...p, ...patch } as Provider) : p)))
          return
        }

        if (isAdmin && !String(id).startsWith('localplus-')) {
          const next: any = { ...patch }
          if (patch.status === 'approved') next.approved_at = new Date().toISOString()
          if (patch.status && patch.status !== 'approved') next.approved_at = null

          const { error: supaError } = await supabase.from('providers').update(next).eq('id', id)
          if (supaError) throw supaError
          setProviders((prev) => prev.map((p) => (p.id === id ? ({ ...p, ...patch } as Provider) : p)))
          return
        }

        const token = await getAdminToken()
        if (!token || String(id).startsWith('localplus-')) {
          const localId = String(id).replace(/^localplus-/, '')
          const safeParse = (raw: string | null, fallback: any) => {
            try {
              const parsed = raw ? JSON.parse(raw) : fallback
              return parsed
            } catch {
              return fallback
            }
          }
          const custom = safeParse(localStorage.getItem('mangoo_custom_vendors'), [])
          const legacy = safeParse(localStorage.getItem('mangoo_vendors'), [])
          const merged = [...(Array.isArray(legacy) ? legacy : []), ...(Array.isArray(custom) ? custom : [])]
          const idx = merged.findIndex((v: any) => String(v?.id) === String(localId))
          if (idx >= 0) {
            const nextStatus = patch.status ? String(patch.status) : null
            const approvalStatus = nextStatus || (patch.is_visible === false ? 'pending' : null)
            if (approvalStatus) merged[idx].approvalStatus = approvalStatus
            try {
              localStorage.setItem('mangoo_vendors', JSON.stringify(merged))
            } catch {
            }
          }
          setProviders((prev) => prev.map((p) => (p.id === id ? ({ ...p, ...patch } as Provider) : p)))
          return
        }

        const endpoint = `/api/admin/providers/providers/${encodeURIComponent(String(id))}`
        const res = await fetchJsonOnce(
          endpoint,
          {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(patch)
          },
          2500
        )

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`)
        }
        setProviders((prev) => prev.map((p) => (p.id === id ? ({ ...p, ...patch } as Provider) : p)))
      } catch (e: any) {
        setError(e?.message || 'Erreur lors de la mise à jour')
      } finally {
        setIsProcessing(false)
      }
    },
    [fetchJsonOnce, getAdminToken, isAdmin, isProcessing]
  )

  const approve = useCallback(
    async (p: Provider) => {
      await updateProvider(p.id, { status: 'approved', is_visible: true })
    },
    [updateProvider]
  )

  const reject = useCallback(
    async (p: Provider) => {
      await updateProvider(p.id, { status: 'rejected', is_visible: false })
    },
    [updateProvider]
  )

  const setPending = useCallback(
    async (p: Provider) => {
      await updateProvider(p.id, { status: 'pending', is_visible: false })
    },
    [updateProvider]
  )

  const suspend = useCallback(
    async (p: Provider) => {
      await updateProvider(p.id, { status: 'suspended', is_visible: false })
    },
    [updateProvider]
  )

  const toggleVisibility = useCallback(
    async (p: Provider) => {
      await updateProvider(p.id, { is_visible: !p.is_visible })
    },
    [updateProvider]
  )

  const stats = useMemo(() => {
    const base = { total: providers.length, pending: 0, approved: 0, rejected: 0, suspended: 0 }
    for (const p of providers) {
      if (p.status === 'pending') base.pending += 1
      if (p.status === 'approved') base.approved += 1
      if (p.status === 'rejected') base.rejected += 1
      if (p.status === 'suspended') base.suspended += 1
    }
    return base
  }, [providers])

  return (
    <div className="space-y-4">
      {!embedded && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="text-xl font-black text-gray-900 dark:text-white">Prestataires</div>
          <div className="text-sm text-gray-600 dark:text-gray-300">
            <div className="whitespace-nowrap">Total: {stats.total}</div>
            <div className="flex flex-col gap-0.5">
              <div className="whitespace-nowrap">· En attente: {stats.pending}</div>
              <div className="whitespace-nowrap">· Approuvés: {stats.approved}</div>
              <div className="whitespace-nowrap">· Rejetés: {stats.rejected}</div>
              <div className="whitespace-nowrap">· Suspendus: {stats.suspended}</div>
            </div>
          </div>
          <div className="mt-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-black bg-[#f6faf3] text-[#1b5e20] dark:bg-[#1b5e20]/30 dark:text-[#8ccf8c]">
            Secteur informel
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher (nom, slug, email, telephone...)"
            className="w-full sm:w-72 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
          <button
            type="button"
            onClick={loadProviders}
            disabled={loading || isProcessing}
            className="px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold"
          >
            Rafraîchir
          </button>
          {isLocalMode && (
            <button
              type="button"
              onClick={() => {
                try {
                  localStorage.removeItem(LOCAL_PROVIDERS_KEY)
                } catch {
                }
                loadProvidersFromLocalPlus()
              }}
              disabled={loading || isProcessing}
              className="px-4 py-2 rounded-lg bg-gray-900 hover:bg-gray-800 disabled:opacity-60 text-white font-bold"
            >
              Réinitialiser les données locales
            </button>
          )}
        </div>
      </div>
      )}

      {embedded && (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Prestataires</h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">Suivi des prestataires du secteur informel avec leurs statuts et visibilités.</p>
            </div>
            <div className="inline-flex items-center rounded-full bg-[#f6faf3] px-3 py-1 text-xs font-semibold text-[#1b5e20] dark:bg-[#1b5e20]/30 dark:text-[#8ccf8c]">
              Secteur informel
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher (nom, slug, email, telephone...)"
              className="w-full sm:w-72 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
            <button
              type="button"
              onClick={loadProviders}
              disabled={loading || isProcessing}
              className="px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold"
            >
              Rafraîchir
            </button>
            {isLocalMode && (
              <button
                type="button"
                onClick={() => {
                  try {
                    localStorage.removeItem(LOCAL_PROVIDERS_KEY)
                  } catch {
                  }
                  loadProvidersFromLocalPlus()
                }}
                disabled={loading || isProcessing}
                className="px-4 py-2 rounded-lg bg-gray-900 hover:bg-gray-800 disabled:opacity-60 text-white font-bold"
              >
                Réinitialiser les données locales
              </button>
            )}
          </div>
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => setStatus('all')}
          className={`px-3 py-2 rounded-lg text-sm font-semibold border ${status === 'all' ? 'bg-white text-gray-900 border-gray-200 dark:bg-gray-800 dark:text-white dark:border-gray-700' : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-white dark:bg-gray-900 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-800'}`}
        >
          Tous
        </button>
        <button
          type="button"
          onClick={() => setStatus('pending')}
          className={`px-3 py-2 rounded-lg text-sm font-semibold border ${status === 'pending' ? 'bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-900/30 dark:text-amber-100 dark:border-amber-700' : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-white dark:bg-gray-900 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-800'}`}
        >
          En attente
        </button>
        <button
          type="button"
          onClick={() => setStatus('approved')}
          className={`px-3 py-2 rounded-lg text-sm font-semibold border ${status === 'approved' ? 'bg-[#f6faf3] text-[#1b5e20] border-[#1b5e20]/20 dark:bg-[#1b5e20]/30 dark:text-[#8ccf8c] dark:border-[#1b5e20]/30' : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-white dark:bg-gray-900 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-800'}`}
        >
          Approuvés
        </button>
        <button
          type="button"
          onClick={() => setStatus('rejected')}
          className={`px-3 py-2 rounded-lg text-sm font-semibold border ${status === 'rejected' ? 'bg-rose-50 text-rose-900 border-rose-200 dark:bg-rose-900/30 dark:text-rose-100 dark:border-rose-700' : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-white dark:bg-gray-900 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-800'}`}
        >
          Rejetés
        </button>
        <button
          type="button"
          onClick={() => setStatus('suspended')}
          className={`px-3 py-2 rounded-lg text-sm font-semibold border ${status === 'suspended' ? 'bg-gray-100 text-gray-900 border-gray-300 dark:bg-gray-900/40 dark:text-gray-100 dark:border-gray-700' : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-white dark:bg-gray-900 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-800'}`}
        >
          Suspendus
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {notice && !error && (
        <div className="p-3 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200">
          {notice}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200">
            <tr>
              <th className="px-4 py-3 text-left">Prestataire</th>
              <th className="px-4 py-3 text-left">Contact</th>
              <th className="px-4 py-3 text-left">Secteur</th>
              <th className="px-4 py-3 text-left">Statut</th>
              <th className="px-4 py-3 text-left">Visible</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-600 dark:text-gray-300">Chargement…</td>
              </tr>
            ) : providers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-600 dark:text-gray-300">Aucun prestataire</td>
              </tr>
            ) : (
              providers.map((p) => (
                <tr key={p.id} className="text-gray-900 dark:text-white">
                  <td className="px-4 py-3">
                    <div className="font-bold">{p.name}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-300">{p.slug}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-xs">{p.email || '—'}</div>
                    <div className="text-xs">{p.phone || '—'}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-black bg-[#f6faf3] text-[#1b5e20] dark:bg-[#1b5e20]/30 dark:text-[#8ccf8c]">
                      Informel
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-black ${statusToBadge(p.status)}`}>
                      {statusToLabel(p.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => toggleVisibility(p)}
                      disabled={isProcessing}
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        p.is_visible
                          ? 'bg-[#f6faf3] text-[#1b5e20] dark:bg-[#1b5e20]/30 dark:text-[#8ccf8c]'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                      }`}
                    >
                      {p.is_visible ? 'Oui' : 'Non'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => window.open(`/provider/dashboard?vendorId=${encodeURIComponent(String(p.id))}`, '_blank', 'noopener,noreferrer')}
                        disabled={isProcessing}
                        className="px-3 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold"
                      >
                        Ouvrir
                      </button>
                      <button
                        type="button"
                        onClick={() => approve(p)}
                        disabled={isProcessing || p.status === 'approved'}
                        className="px-3 py-2 rounded-lg bg-[#1b5e20] hover:bg-[#16381a] disabled:opacity-60 text-white font-bold"
                      >
                        Approuver
                      </button>
                      <button
                        type="button"
                        onClick={() => reject(p)}
                        disabled={isProcessing || p.status === 'rejected'}
                        className="px-3 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white font-bold"
                      >
                        Rejeter
                      </button>
                      <button
                        type="button"
                        onClick={() => setPending(p)}
                        disabled={isProcessing || p.status === 'pending'}
                        className="px-3 py-2 rounded-lg bg-gray-700 hover:bg-gray-800 disabled:opacity-60 text-white font-bold"
                      >
                        En attente
                      </button>
                      <button
                        type="button"
                        onClick={() => suspend(p)}
                        disabled={isProcessing || p.status === 'suspended'}
                        className="px-3 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white font-bold"
                      >
                        Suspendre
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
