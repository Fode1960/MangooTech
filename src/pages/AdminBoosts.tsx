import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { BoostCarteAdmin } from '../components/admin/BoostCarteAdmin'
import { BoostCreditsAdmin } from '../components/admin/BoostCreditsAdmin'
import { BoostPricingAdmin } from '../components/admin/BoostPricingAdmin'

type TabId = 'carte' | 'pricing' | 'credits'

export default function AdminBoosts() {
  const { isAdmin, loading, error: authError, adminRole } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState<TabId>('carte')

  const tabs = useMemo(
    () => [
      { id: 'carte' as const, label: 'Boost carte', hint: 'Activer/stopper' },
      { id: 'pricing' as const, label: 'Prix', hint: 'Offres boost' },
      { id: 'credits' as const, label: 'Crédits', hint: 'Créditer un vendeur' }
    ],
    []
  )

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-6">
          <div className="text-gray-700 dark:text-gray-200 font-semibold">Chargement…</div>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    const msg = String(authError || '').trim()
    const isNetwork = msg.includes('Réseau instable') || msg.includes('signal is aborted') || msg.includes('aborted')
    const isMissingConfig = msg.includes('Configuration Supabase manquante')
    const isSessionMissing = msg.includes('Session manquante')
    const isApiHtml = msg.includes('réponse HTML') || msg.includes('API non disponible') || msg === 'HTTP 200'
    const showConnIssue = Boolean(msg) && (isNetwork || isMissingConfig || isSessionMissing || isApiHtml)

    return (
      <div className="max-w-5xl mx-auto">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-6">
          <div className="text-gray-900 dark:text-white font-bold text-lg">{showConnIssue ? 'Connexion impossible' : 'Accès refusé'}</div>
          <div className="text-gray-600 dark:text-gray-300 mt-2">
            {showConnIssue
              ? 'Impossible de vérifier votre session admin pour le moment.'
              : 'Cette page est réservée à l’administrateur.'}
          </div>
          {authError && <div className="mt-3 text-sm text-red-600 dark:text-red-400">{authError}</div>}
          {showConnIssue && (
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-orange-600 text-white hover:bg-orange-700"
              >
                Recharger
              </button>
              <button
                type="button"
                onClick={() => navigate('/connexion')}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                Se reconnecter
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xl font-bold text-gray-900 dark:text-white">Admin Boost</div>
            <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              Boost Carte + prix + crédits. {adminRole ? `Rôle: ${adminRole}` : ''}
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-xl text-sm font-bold border transition-colors ${
                tab === t.id
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-800 border-gray-200 hover:bg-gray-50 dark:bg-gray-900 dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-800'
              }`}
            >
              {t.label}
              <span className={`ml-2 text-xs ${tab === t.id ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'}`}>{t.hint}</span>
            </button>
          ))}
        </div>
      </div>

      {tab === 'carte' && <BoostCarteAdmin isEnabled={isAdmin} />}
      {tab === 'pricing' && <BoostPricingAdmin isEnabled={isAdmin} />}
      {tab === 'credits' && <BoostCreditsAdmin isEnabled={isAdmin} />}
    </div>
  )
}
