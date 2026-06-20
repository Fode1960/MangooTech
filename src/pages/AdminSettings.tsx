export default function AdminSettings() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Paramètres</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">Configuration de la plateforme.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Général</h2>
          <div className="mt-4 space-y-3 text-sm text-gray-700 dark:text-gray-300">
            <div className="flex items-center justify-between">
              <span>Devise par défaut</span>
              <span className="font-semibold">XOF</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Mode actif</span>
              <span className="font-semibold">Production</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Paiements</h2>
          <div className="mt-4 space-y-3 text-sm text-gray-700 dark:text-gray-300">
            <div className="flex items-center justify-between">
              <span>Mangoo Pay (Solde)</span>
              <span className="font-semibold">Activé</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Relais de sécurité</span>
              <span className="font-semibold">Activé</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

