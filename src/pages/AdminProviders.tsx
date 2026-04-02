import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { buildApiUrl } from '../config/api'

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
}

const statusToLabel = (s: ProviderStatus) => {
  if (s === 'approved') return 'Approuvé'
  if (s === 'pending') return 'En attente'
  if (s === 'rejected') return 'Rejeté'
  if (s === 'suspended') return 'Suspendu'
  return s
}

const statusToBadge = (s: ProviderStatus) => {
  if (s === 'approved') return 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-200'
  if (s === 'pending') return 'bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-200'
  if (s === 'rejected') return 'bg-rose-100 text-rose-900 dark:bg-rose-900/30 dark:text-rose-200'
  if (s === 'suspended') return 'bg-gray-200 text-gray-900 dark:bg-gray-800 dark:text-gray-200'
  return 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-200'
}

export default function AdminProviders() {
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
    const list = [...(Array.isArray(legacy) ? legacy : []), ...(Array.isArray(custom) ? custom : [])]

    const term = search.trim().toLowerCase()
    const servicesOnly = list.filter((v: any) => String(v?.kind || '').toLowerCase() === 'service')
    const source = servicesOnly.length > 0 ? servicesOnly : list

    const rowsFromVendors = source
      .map((v: any) => {
        const approval = String(v?.approvalStatus || '').trim().toLowerCase() || 'approved'
        const normalizedStatus: ProviderStatus =
          approval === 'approved' || approval === 'pending' || approval === 'rejected' || approval === 'suspended'
            ? (approval as ProviderStatus)
            : 'pending'
        const id = `localplus-${String(v?.id)}`
        const name = String(v?.name || '').trim() || 'Prestataire'
        const slug = String(v?.slug || '').trim() || String(name).toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '').slice(0, 64) || id
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
          created_at: String(v?.createdAt || v?.updatedAt || new Date().toISOString())
        } as Provider
      })

    const baseRows = localProviders.length > 0 ? localProviders : rowsFromVendors
    const withSeed = baseRows.length > 0 ? baseRows : ensureSeeded()

    const filtered = withSeed.filter((p: Provider) => {
      if (status !== 'all' && p.status !== status) return false
      if (!term) return true
      const hay = `${p.name} ${p.slug} ${p.email || ''}`.toLowerCase()
      return hay.includes(term)
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
      const token = await getAdminToken()
      if (!token) {
        loadProvidersFromLocalPlus()
        setNotice('Mode Local : données locales (sans backend)')
        setIsLocalMode(true)
        return
      }

      loadProvidersFromLocalPlus()
      setIsLocalMode(true)
      setNotice(null)
      setLoading(false)

      const qs = new URLSearchParams()
      if (status !== 'all') qs.set('status', status)
      if (search.trim()) qs.set('search', search.trim())
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
            const data = ((res.json as any).data as Provider[]).filter((p) => Boolean(p?.id))
            if (data.length > 0) {
              setProviders(data)
              setIsLocalMode(false)
              setNotice(null)
              return
            }
            setNotice('Backend vide : conservation des données locales')
            setIsLocalMode(true)
            return
          }

          setNotice('Backend indisponible : affichage en mode local (démo)')
          setIsLocalMode(true)
        } catch {
          if (seq !== loadSeqRef.current) return
          setNotice('Backend indisponible : affichage en mode local (démo)')
          setIsLocalMode(true)
        }
      })()
    } catch (e: any) {
      try {
        loadProvidersFromLocalPlus()
        setIsLocalMode(true)
        setNotice('Backend indisponible : affichage en mode local (démo)')
        setError(null)
      } catch {
        const msg = e?.message || 'Erreur lors du chargement'
        setError(msg)
        setProviders([])
      }
    } finally {
      if (seq === loadSeqRef.current) setLoading(false)
    }
  }, [getAdminToken, loadProvidersFromLocalPlus, search, status])

  useEffect(() => {
    loadProviders()
  }, [loadProviders])

  const updateProvider = useCallback(
    async (id: string, patch: Partial<Provider>) => {
      if (isProcessing) return
      setIsProcessing(true)
      setError(null)
      try {
        const token = await getAdminToken()
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
    [getAdminToken, isProcessing]
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="text-xl font-black text-gray-900 dark:text-white">Prestataires</div>
          <div className="text-sm text-gray-600 dark:text-gray-300">
            <div className="whitespace-nowrap">Total: {stats.total}</div>
            <div className="flex flex-col gap-0.5">
              <div className="whitespace-nowrap">· En attente: {stats.pending}</div>
              <div className="whitespace-nowrap">· Approuvés: {stats.approved}</div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher (nom, slug, email)…"
            className="w-full sm:w-72 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            className="w-full sm:w-48 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="all">Tous</option>
            <option value="pending">En attente</option>
            <option value="approved">Approuvés</option>
            <option value="rejected">Rejetés</option>
            <option value="suspended">Suspendus</option>
          </select>
          <button
            type="button"
            onClick={loadProviders}
            disabled={loading || isProcessing}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold"
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
              Réinitialiser démo
            </button>
          )}
        </div>
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
              <th className="px-4 py-3 text-left">Statut</th>
              <th className="px-4 py-3 text-left">Visible</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-600 dark:text-gray-300">Chargement…</td>
              </tr>
            ) : providers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-600 dark:text-gray-300">Aucun prestataire</td>
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
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200'
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
                        onClick={() => approve(p)}
                        disabled={isProcessing || p.status === 'approved'}
                        className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold"
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
