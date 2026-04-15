import { useEffect, useMemo, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { supabase } from '../config/supabase'

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
        const email = String(parsedUser?.email || '').trim().toLowerCase()
        if (!email) return
        const raw = localStorage.getItem(`mangoo_boost_pending:${email}`)
        const pending = raw ? JSON.parse(raw) : null
        if (!pending?.vendorId || !pending?.vendorKind || !pending?.kind || !pending?.durationHours) return
        const savedAt = Number(pending?.savedAt || 0)
        if (!Number.isFinite(savedAt) || Date.now() - savedAt > 60 * 60 * 1000) return

        const now = Date.now()
        const until = new Date(now + Math.max(0, Number(pending.durationHours || 0)) * 60 * 60 * 1000).toISOString()
        const payload: any = {
          vendor_kind: String(pending.vendorKind || 'shop'),
          vendor_id: String(pending.vendorId),
          updated_at: new Date().toISOString(),
        }
        if (pending.kind === 'sponsored') {
          payload.sponsored_until = until
          const tier = Number(pending?.sponsoredTier || 0)
          payload.sponsored_tier = tier === 3 ? 'or' : tier === 2 ? 'argent' : tier === 1 ? 'bronze' : null
        } else if (pending.kind === 'promo') {
          payload.promo_until = until
        } else {
          payload.new_until = until
        }

        await supabase.from('vendor_boosts').upsert(payload, { onConflict: 'vendor_kind,vendor_id' })
        localStorage.removeItem(`mangoo_boost_pending:${email}`)
      } catch {
      }
    })()
  }, [mode])

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

