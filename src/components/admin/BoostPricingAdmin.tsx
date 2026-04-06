import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { buildApiUrl } from '../../config/api'
import { supabase } from '../../config/supabase'

type BoostKind = 'new' | 'promo' | 'sponsored'
type SponsoredTier = 'bronze' | 'argent' | 'or'

export type AdminBoostProduct = {
  id: string
  kind: BoostKind
  duration_hours: number
  price_xof: number
  currency: string
  title: string
  description: string
  sponsored_tier: SponsoredTier | null
  active: boolean
  created_at: string
  updated_at: string
}

const normalizeKind = (value: unknown): BoostKind | null => {
  const v = String(value || '').trim().toLowerCase()
  if (v === 'new' || v === 'promo' || v === 'sponsored') return v
  return null
}

const formatXof = (value: number) => {
  const n = Math.floor(Number(value) || 0)
  return new Intl.NumberFormat('fr-FR').format(n)
}

export function BoostPricingAdmin({ isEnabled }: { isEnabled: boolean }) {
  const [products, setProducts] = useState<AdminBoostProduct[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [editing, setEditing] = useState<Record<string, Partial<AdminBoostProduct>>>({})
  const [savingId, setSavingId] = useState<string | null>(null)
  const [seeding, setSeeding] = useState(false)
  const loadSeqRef = useRef(0)

  const getAdminToken = useCallback(async () => {
    try {
      const demo = localStorage.getItem('admin-demo-user')
      if (demo) return 'demo-admin'
    } catch {
    }
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
    if (!isEnabled) return
    const seq = ++loadSeqRef.current
    setLoading(true)
    setError(null)
    setNotice(null)
    try {
      const token = await getAdminToken()
      if (!token || token === 'demo-admin') {
        setError('Connectez-vous avec un vrai compte admin pour gérer les prix.')
        setProducts([])
        return
      }
      const res = await fetchJsonOnce(
        '/api/admin/boosts/products',
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`
          }
        },
        6000
      )
      if (seq !== loadSeqRef.current) return
      if (!res.ok || !res.json?.success) throw new Error(res.json?.error || `HTTP ${res.status}`)
      const rows = Array.isArray(res.json.products) ? res.json.products : []
      const parsed = rows
        .map((p: any) => {
          const kind = normalizeKind(p?.kind)
          if (!kind) return null
          return {
            id: String(p.id),
            kind,
            duration_hours: Number(p.duration_hours),
            price_xof: Number(p.price_xof),
            currency: String(p.currency || 'XOF'),
            title: String(p.title || ''),
            description: String(p.description || ''),
            sponsored_tier: p.sponsored_tier === 'bronze' || p.sponsored_tier === 'argent' || p.sponsored_tier === 'or' ? p.sponsored_tier : null,
            active: Boolean(p.active),
            created_at: String(p.created_at || ''),
            updated_at: String(p.updated_at || ''),
          } as AdminBoostProduct
        })
        .filter(Boolean) as AdminBoostProduct[]
      setProducts(parsed)
      setEditing({})
    } catch (e: any) {
      setError(e?.message || 'Erreur chargement boosts')
      setProducts([])
    } finally {
      setLoading(false)
    }
  }, [fetchJsonOnce, getAdminToken, isEnabled])

  const seedDefaults = useCallback(async () => {
    if (!isEnabled) return
    if (seeding) return
    setError(null)
    setNotice(null)
    try {
      const token = await getAdminToken()
      if (!token || token === 'demo-admin') throw new Error('Connectez-vous avec un vrai compte admin.')
      setSeeding(true)
      const res = await fetchJsonOnce(
        '/api/admin/boosts/products/seed-defaults',
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        },
        8000
      )
      if (!res.ok || !res.json?.success) throw new Error(res.json?.error || `HTTP ${res.status}`)
      const rows = Array.isArray(res.json.products) ? res.json.products : []
      const parsed = rows
        .map((p: any) => {
          const kind = normalizeKind(p?.kind)
          if (!kind) return null
          return {
            id: String(p.id),
            kind,
            duration_hours: Number(p.duration_hours),
            price_xof: Number(p.price_xof),
            currency: String(p.currency || 'XOF'),
            title: String(p.title || ''),
            description: String(p.description || ''),
            sponsored_tier: p.sponsored_tier === 'bronze' || p.sponsored_tier === 'argent' || p.sponsored_tier === 'or' ? p.sponsored_tier : null,
            active: Boolean(p.active),
            created_at: String(p.created_at || ''),
            updated_at: String(p.updated_at || ''),
          } as AdminBoostProduct
        })
        .filter(Boolean) as AdminBoostProduct[]
      setProducts(parsed)
      setEditing({})
      setNotice('Offres initialisées.')
    } catch (e: any) {
      setError(e?.message || 'Erreur initialisation offres')
    } finally {
      setSeeding(false)
    }
  }, [fetchJsonOnce, getAdminToken, isEnabled, seeding])

  useEffect(() => {
    load()
  }, [load])

  const grouped = useMemo(() => {
    const map: Record<string, AdminBoostProduct[]> = { sponsored: [], promo: [], new: [] }
    for (const p of products) {
      map[p.kind] = Array.isArray(map[p.kind]) ? [...map[p.kind], p] : [p]
    }
    return map
  }, [products])

  const updateDraft = useCallback((id: string, patch: Partial<AdminBoostProduct>) => {
    setEditing((prev) => ({
      ...prev,
      [id]: { ...(prev[id] || {}), ...patch }
    }))
  }, [])

  const resetDraft = useCallback((id: string) => {
    setEditing((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }, [])

  const save = useCallback(async (p: AdminBoostProduct) => {
    if (!isEnabled) return
    if (savingId) return
    setError(null)
    setNotice(null)
    const patch = editing[p.id]
    if (!patch || Object.keys(patch).length === 0) {
      setNotice('Aucun changement à enregistrer.')
      return
    }

    try {
      const token = await getAdminToken()
      if (!token || token === 'demo-admin') throw new Error('Connectez-vous avec un vrai compte admin.')
      setSavingId(p.id)

      const res = await fetchJsonOnce(
        `/api/admin/boosts/products/${encodeURIComponent(p.id)}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            price_xof: patch.price_xof !== undefined ? Number(patch.price_xof) : undefined,
            currency: patch.currency !== undefined ? String(patch.currency) : undefined,
            title: patch.title !== undefined ? String(patch.title) : undefined,
            description: patch.description !== undefined ? String(patch.description) : undefined,
            active: patch.active !== undefined ? Boolean(patch.active) : undefined,
            sponsored_tier: patch.sponsored_tier !== undefined ? patch.sponsored_tier : undefined,
          })
        },
        6000
      )

      if (!res.ok || !res.json?.success) throw new Error(res.json?.error || `HTTP ${res.status}`)
      const updated = res.json.product
      setProducts((prev) => prev.map((x) => (x.id === p.id ? ({ ...x, ...updated } as AdminBoostProduct) : x)))
      resetDraft(p.id)
      setNotice('Enregistré.')
    } catch (e: any) {
      setError(e?.message || 'Erreur enregistrement')
    } finally {
      setSavingId(null)
    }
  }, [editing, fetchJsonOnce, getAdminToken, isEnabled, resetDraft, savingId])

  const kinds: { key: BoostKind; label: string; hint: string }[] = [
    { key: 'sponsored', label: 'Sponsorisé', hint: 'Boost premium (tier)' },
    { key: 'promo', label: 'Promo', hint: 'Boost promotion' },
    { key: 'new', label: 'Nouveau', hint: 'Boost nouveau' }
  ]

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-lg font-bold text-gray-900 dark:text-white">Prix des boosts</div>
            <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">Modifie les prix et active/désactive des offres.</div>
          </div>
          <button
            type="button"
            onClick={load}
            disabled={!isEnabled || loading}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              !isEnabled || loading
                ? 'bg-gray-200 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {loading ? 'Chargement…' : 'Rafraîchir'}
          </button>
        </div>
        {error && <div className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</div>}
        {notice && <div className="mt-3 text-sm text-emerald-700 dark:text-emerald-400">{notice}</div>}
        {!error && !loading && products.length === 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <div className="text-sm text-gray-600 dark:text-gray-300">Aucune offre en base. Initialise les offres par défaut.</div>
            <button
              type="button"
              onClick={seedDefaults}
              disabled={!isEnabled || seeding}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                !isEnabled || seeding
                  ? 'bg-gray-200 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700'
              }`}
            >
              {seeding ? 'Initialisation…' : 'Initialiser les offres'}
            </button>
          </div>
        )}
      </div>

      {kinds.map((k) => (
        <div key={k.key} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-base font-bold text-gray-900 dark:text-white">{k.label}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">{k.hint}</div>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 font-semibold">{(grouped[k.key] || []).length} offre(s)</div>
          </div>

          <div className="mt-4 overflow-auto">
            <table className="min-w-[900px] w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600 dark:text-gray-300">
                  <th className="py-2 pr-3">Durée</th>
                  <th className="py-2 pr-3">Titre</th>
                  <th className="py-2 pr-3">Prix (XOF)</th>
                  <th className="py-2 pr-3">Actif</th>
                  <th className="py-2 pr-3">Tier</th>
                  <th className="py-2 pr-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {(grouped[k.key] || []).map((p) => {
                  const draft = editing[p.id] || {}
                  const priceValue = draft.price_xof !== undefined ? Number(draft.price_xof) : p.price_xof
                  const titleValue = draft.title !== undefined ? String(draft.title) : p.title
                  const activeValue = draft.active !== undefined ? Boolean(draft.active) : p.active
                  const tierValue = draft.sponsored_tier !== undefined ? (draft.sponsored_tier as any) : p.sponsored_tier
                  const dirty = Boolean(editing[p.id] && Object.keys(editing[p.id] || {}).length)

                  return (
                    <tr key={p.id} className="border-t border-gray-100 dark:border-gray-800">
                      <td className="py-3 pr-3 font-semibold text-gray-900 dark:text-white">{p.duration_hours} h</td>
                      <td className="py-3 pr-3">
                        <input
                          value={titleValue}
                          onChange={(e) => updateDraft(p.id, { title: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-white"
                        />
                      </td>
                      <td className="py-3 pr-3">
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={Number.isFinite(priceValue) ? priceValue : 0}
                            onChange={(e) => updateDraft(p.id, { price_xof: Number(e.target.value) })}
                            className="w-40 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-white"
                            min={0}
                          />
                          <div className="text-xs text-gray-500 dark:text-gray-400">≈ {formatXof(priceValue)} F</div>
                        </div>
                      </td>
                      <td className="py-3 pr-3">
                        <button
                          type="button"
                          onClick={() => updateDraft(p.id, { active: !activeValue })}
                          className={`px-3 py-2 rounded-lg text-xs font-bold ${
                            activeValue ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                          }`}
                        >
                          {activeValue ? 'Actif' : 'Off'}
                        </button>
                      </td>
                      <td className="py-3 pr-3">
                        {p.kind === 'sponsored' ? (
                          <select
                            value={tierValue || ''}
                            onChange={(e) => updateDraft(p.id, { sponsored_tier: e.target.value as any })}
                            className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-white"
                          >
                            <option value="bronze">Bronze</option>
                            <option value="argent">Argent</option>
                            <option value="or">Or</option>
                          </select>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="py-3 pr-3">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={!dirty || savingId === p.id}
                            onClick={() => save(p)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                              !dirty || savingId === p.id
                                ? 'bg-gray-200 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                            }`}
                          >
                            {savingId === p.id ? 'Sauvegarde…' : 'Enregistrer'}
                          </button>
                          {dirty && (
                            <button
                              type="button"
                              onClick={() => resetDraft(p.id)}
                              className="px-3 py-2 rounded-xl text-xs font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                            >
                              Annuler
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {!loading && (grouped[k.key] || []).length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-6 text-sm text-gray-500 dark:text-gray-400">Aucune offre.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  )
}
