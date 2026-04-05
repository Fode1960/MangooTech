import { useMemo, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { BoostCarteAdmin } from '../components/admin/BoostCarteAdmin'
import { BoostCreditsAdmin } from '../components/admin/BoostCreditsAdmin'
import { BoostPricingAdmin } from '../components/admin/BoostPricingAdmin'

type TabId = 'carte' | 'pricing' | 'credits'

export default function AdminBoosts() {
  const { isAdmin, loading, error: authError, adminRole } = useAuth()
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
    return (
      <div className="max-w-5xl mx-auto">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-6">
          <div className="text-gray-900 dark:text-white font-bold text-lg">Accès refusé</div>
          <div className="text-gray-600 dark:text-gray-300 mt-2">Cette page est réservée à l’administrateur.</div>
          {authError && <div className="mt-3 text-sm text-red-600 dark:text-red-400">{authError}</div>}
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
