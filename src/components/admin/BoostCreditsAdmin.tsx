import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { buildApiUrl } from '../../config/api'
import { supabase } from '../../config/supabase'

type AppUser = {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
}

const formatXof = (value: number) => {
  const n = Math.floor(Number(value) || 0)
  return new Intl.NumberFormat('fr-FR').format(n)
}

export function BoostCreditsAdmin({ isEnabled }: { isEnabled: boolean }) {
  const [search, setSearch] = useState('')
  const [users, setUsers] = useState<AppUser[]>([])
  const [selectedUserId, setSelectedUserId] = useState('')
  const [balanceXof, setBalanceXof] = useState<number | null>(null)
  const [amountXof, setAmountXof] = useState<number>(5000)
  const [description, setDescription] = useState('Crédit boost (admin)')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const loadSeqRef = useRef(0)

  const getAdminToken = useCallback(async () => {
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token || ''
    if (token) return token
    try {
      const demo = localStorage.getItem('admin-demo-user')
      if (demo) return 'demo-admin'
    } catch {
    }
    return ''
  }, [])

  const fetchJsonOnce = useCallback(async (endpoint: string, init: RequestInit, timeoutMs: number) => {
    const url = buildApiUrl(endpoint)
    const controller = new AbortController()
    const t = window.setTimeout(() => controller.abort(), timeoutMs)
    try {
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
        if (name === 'AbortError' || String(e?.message || '').includes('aborted')) {
          return { ok: false, status: 0, json: { success: false, error: 'Requête annulée (timeout).' } }
        }
        return { ok: false, status: 0, json: { success: false, error: e?.message || 'Erreur réseau' } }
      }
    } finally {
      window.clearTimeout(t)
    }
  }, [])

  const loadUsers = useCallback(async () => {
    if (!isEnabled) return
    const seq = ++loadSeqRef.current
    setLoading(true)
    setError(null)
    setNotice(null)
    try {
      const token = await getAdminToken()
      if (!token || token === 'demo-admin') {
        setError('Connectez-vous avec un vrai compte admin pour gérer les crédits.')
        setUsers([])
        setBalanceXof(null)
        return
      }
      const qs = new URLSearchParams()
      if (search.trim()) qs.set('search', search.trim())
      const endpoint = `/api/admin/boosts/users${qs.toString() ? `?${qs.toString()}` : ''}`
      const res = await fetchJsonOnce(
        endpoint,
        {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` }
        },
        6000
      )
      if (seq !== loadSeqRef.current) return
      if (!res.ok || !res.json?.success) throw new Error(res.json?.error || `HTTP ${res.status}`)
      const list = Array.isArray(res.json.users) ? res.json.users : []
      const parsed = list
        .map((u: any) => {
          const id = String(u?.id || '').trim()
          const email = String(u?.email || '').trim()
          if (!id || !email) return null
          return {
            id,
            email,
            first_name: u?.first_name ? String(u.first_name) : null,
            last_name: u?.last_name ? String(u.last_name) : null,
          } as AppUser
        })
        .filter(Boolean) as AppUser[]
      setUsers(parsed)
      if (!selectedUserId && parsed.length) setSelectedUserId(parsed[0].id)
    } catch (e: any) {
      setError(e?.message || 'Erreur chargement utilisateurs')
      setUsers([])
    } finally {
      setLoading(false)
    }
  }, [fetchJsonOnce, getAdminToken, isEnabled, search, selectedUserId])

  const loadBalance = useCallback(async (userId: string) => {
    if (!isEnabled) return
    setBalanceXof(null)
    try {
      const token = await getAdminToken()
      if (!token || token === 'demo-admin') return
      const qs = new URLSearchParams({ user_id: userId })
      const res = await fetchJsonOnce(
        `/api/admin/boosts/credits/balance?${qs.toString()}`,
        { method: 'GET', headers: { Authorization: `Bearer ${token}` } },
        6000
      )
      if (!res.ok || !res.json?.success) return
      setBalanceXof(Number(res.json.balanceXof || 0))
    } catch {
      setBalanceXof(null)
    }
  }, [fetchJsonOnce, getAdminToken, isEnabled])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  useEffect(() => {
    if (!selectedUserId) return
    loadBalance(selectedUserId)
  }, [loadBalance, selectedUserId])

  const selectedUser = useMemo(() => users.find((u) => u.id === selectedUserId) || null, [selectedUserId, users])

  const grant = useCallback(async () => {
    if (!isEnabled) return
    setError(null)
    setNotice(null)
    try {
      const token = await getAdminToken()
      if (!token || token === 'demo-admin') throw new Error('Connectez-vous avec un vrai compte admin.')
      if (!selectedUserId) throw new Error('Sélectionne un utilisateur.')
      if (!Number.isFinite(amountXof) || amountXof <= 0) throw new Error('Montant invalide')

      const res = await fetchJsonOnce(
        '/api/admin/boosts/credits/grant',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            user_id: selectedUserId,
            amount_xof: Math.floor(amountXof),
            description: description.trim() || 'Crédit boost (admin)'
          })
        },
        6000
      )

      if (!res.ok || !res.json?.success) throw new Error(res.json?.error || `HTTP ${res.status}`)
      setNotice('Crédit ajouté.')
      await loadBalance(selectedUserId)
    } catch (e: any) {
      setError(e?.message || 'Erreur ajout crédit')
    }
  }, [amountXof, description, fetchJsonOnce, getAdminToken, isEnabled, loadBalance, selectedUserId])

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-5">
        <div className="text-lg font-bold text-gray-900 dark:text-white">Crédits vendeurs / prestataires</div>
        <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
          Les crédits sont en XOF et servent à acheter des boosts sans carte.
        </div>
        {error && <div className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</div>}
        {notice && <div className="mt-3 text-sm text-emerald-700 dark:text-emerald-400">{notice}</div>}
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-5">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[260px] flex-1">
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300">Rechercher un email</label>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ex: vendeur@..."
              className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-white"
            />
          </div>
          <button
            type="button"
            onClick={loadUsers}
            disabled={!isEnabled || loading}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              !isEnabled || loading
                ? 'bg-gray-200 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {loading ? 'Chargement…' : 'Rechercher'}
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4">
            <div className="text-sm font-bold text-gray-900 dark:text-white">Utilisateur</div>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="mt-2 w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-white"
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.email}
                </option>
              ))}
            </select>
            <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">{selectedUser ? `${selectedUser.id}` : '—'}</div>
          </div>

          <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4">
            <div className="text-sm font-bold text-gray-900 dark:text-white">Solde</div>
            <div className="mt-2 text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {balanceXof === null ? '—' : `${formatXof(balanceXof)} XOF`}
            </div>
            <button
              type="button"
              onClick={() => selectedUserId && loadBalance(selectedUserId)}
              className="mt-3 px-3 py-2 rounded-xl text-xs font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              Rafraîchir solde
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-5">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300">Montant à créditer (XOF)</label>
            <input
              type="number"
              min={0}
              value={amountXof}
              onChange={(e) => setAmountXof(Number(e.target.value))}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-white"
            />
          </div>
          <div className="lg:col-span-2">
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300">Description</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-white"
            />
          </div>
        </div>
        <div className="mt-4 flex items-center justify-end">
          <button
            type="button"
            onClick={grant}
            disabled={!isEnabled || !selectedUserId}
            className={`px-5 py-2 rounded-xl text-sm font-bold transition-colors ${
              !isEnabled || !selectedUserId
                ? 'bg-gray-200 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                : 'bg-emerald-600 text-white hover:bg-emerald-700'
            }`}
          >
            Créditer
          </button>
        </div>
      </div>
    </div>
  )
}
