import { useCallback, useEffect, useMemo, useState } from 'react'
import { apiCall } from '../config/api'

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

export default function AdminProviders() {
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<'all' | ProviderStatus>('all')
  const [isProcessing, setIsProcessing] = useState(false)

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
    const safeParse = (raw: string | null, fallback: any) => {
      try {
        const parsed = raw ? JSON.parse(raw) : fallback
        return parsed
      } catch {
        return fallback
      }
    }

    const legacy = safeParse(localStorage.getItem('mangoo_vendors'), [])
    const custom = safeParse(localStorage.getItem('mangoo_custom_vendors'), [])
    const list = [...(Array.isArray(legacy) ? legacy : []), ...(Array.isArray(custom) ? custom : [])]

    const term = search.trim().toLowerCase()
    const rows = list
      .filter((v: any) => String(v?.kind || '').toLowerCase() === 'service')
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
      .filter((p: Provider) => {
        if (status !== 'all' && p.status !== status) return false
        if (!term) return true
        const hay = `${p.name} ${p.slug} ${p.email || ''}`.toLowerCase()
        return hay.includes(term)
      })

    setProviders(rows)
  }, [search, status])

  const loadProviders = useCallback(async () => {
    setLoading(true)
    setError(null)
    setNotice(null)
    try {
      const token = await getAdminToken()
      if (!token) {
        loadProvidersFromLocalPlus()
        setNotice('Mode Local+ : liste et statut gérés localement')
        return
      }
      const qs = new URLSearchParams()
      if (status !== 'all') qs.set('status', status)
      if (search.trim()) qs.set('search', search.trim())
      const endpoint = `/api/admin/providers/providers${qs.toString() ? `?${qs.toString()}` : ''}`
      const res = await apiCall(endpoint, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      const data = Array.isArray(res?.data) ? (res.data as Provider[]) : []
      setProviders(data.filter((p) => Boolean(p?.id)))
    } catch (e: any) {
      try {
        const msg = String(e?.message || '')
        loadProvidersFromLocalPlus()
        if (msg.includes('HTTP 500')) {
          setNotice('Backend en erreur (Supabase non prêt) : affichage en mode Local+')
        } else if (msg.includes('HTTP 503')) {
          setNotice('Supabase non configuré : affichage en mode Local+')
        } else {
          setNotice('Backend indisponible : affichage en mode Local+')
        }
        setError(null)
      } catch {
        const msg = e?.message || 'Erreur lors du chargement'
        setError(msg)
        setProviders([])
      }
    } finally {
      setLoading(false)
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
        await apiCall(endpoint, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(patch)
        })
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
        <div>
          <div className="text-xl font-black text-gray-900 dark:text-white">Prestataires</div>
          <div className="text-sm text-gray-600 dark:text-gray-300">
            Total: {stats.total} · En attente: {stats.pending} · Approuvés: {stats.approved}
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
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-gray-100 dark:bg-gray-800">
                      {p.status}
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
                        disabled={isProcessing}
                        className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold"
                      >
                        Approuver
                      </button>
                      <button
                        type="button"
                        onClick={() => reject(p)}
                        disabled={isProcessing}
                        className="px-3 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white font-bold"
                      >
                        Rejeter
                      </button>
                      <button
                        type="button"
                        onClick={() => suspend(p)}
                        disabled={isProcessing}
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
