import { useEffect, useMemo, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'

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

