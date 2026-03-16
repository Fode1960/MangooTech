import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../hooks/useAuth';

type VendorCatalogItem = {
  id: string;
  name: string;
  kind: string;
};

type BoostConfigItem = {
  sponsoredUntil?: number | null;
  sponsoredTier?: number | null;
  promoUntil?: number | null;
  newUntil?: number | null;
};

type BoostConfigMap = Record<string, BoostConfigItem>;

type AdStatsItem = {
  impressions?: number;
  clicks?: number;
  lastImpressionTs?: number | null;
  lastClickTs?: number | null;
};

type AdStatsMap = Record<string, AdStatsItem>;

const readJson = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return (parsed ?? fallback) as T;
  } catch {
    return fallback;
  }
};

const writeJson = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
};

const formatTime = (ts?: number | null) => {
  if (!ts || typeof ts !== 'number') return '—';
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
};

const tierLabel = (tierValue?: number | null) => {
  if (tierValue === 3) return 'Or';
  if (tierValue === 2) return 'Argent';
  return 'Bronze';
};

const formatRemaining = (ts: number | null | undefined, now: number) => {
  if (!ts || typeof ts !== 'number') return '—';
  const diff = ts - now;
  if (diff <= 0) return 'Expiré';
  const mins = Math.floor(diff / 60000);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h <= 0) return `${m} min`;
  return `${h} h ${String(m).padStart(2, '0')} min`;
};

export default function AdminBoosts() {
  const { isAdmin, loading } = useAuth();
  const [vendorId, setVendorId] = useState<string>('');
  const [tier, setTier] = useState<number>(1);
  const [refreshing, setRefreshing] = useState(false);
  const [nowTick, setNowTick] = useState(() => Date.now());

  const activateAdminDemo = useCallback(() => {
    try {
      const adminUser = {
        id: 'admin-demo-123',
        email: 'admin@mangoo.tech',
        role: 'admin',
        name: 'Administrateur'
      };
      localStorage.setItem('admin-demo-user', JSON.stringify(adminUser));
      localStorage.setItem('mangoo-current-user', JSON.stringify(adminUser));
    } catch {
      // ignore
    }
    window.location.reload();
  }, []);

  const [catalog, setCatalog] = useState<VendorCatalogItem[]>([]);
  const [boostConfig, setBoostConfig] = useState<BoostConfigMap>({});
  const [stats, setStats] = useState<AdStatsMap>({});

  const reloadFromStorage = useCallback(() => {
    const list = readJson<VendorCatalogItem[]>('mangoo_local_vendors_catalog', []);
    setCatalog(Array.isArray(list) ? list : []);
    const cfg = readJson<BoostConfigMap>('mangoo_boost_config', {});
    setBoostConfig(cfg && typeof cfg === 'object' ? cfg : {});
    const s = readJson<AdStatsMap>('mangoo_ads_stats', {});
    setStats(s && typeof s === 'object' ? s : {});
  }, []);

  useEffect(() => {
    reloadFromStorage();
    const onStorage = () => reloadFromStorage();
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [reloadFromStorage]);

  useEffect(() => {
    const id = window.setInterval(() => {
      setNowTick(Date.now());
    }, 15000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!vendorId && catalog.length) setVendorId(catalog[0].id);
  }, [catalog, vendorId]);

  const currentBoost = useMemo(() => {
    if (!vendorId) return null;
    return boostConfig[String(vendorId)] || {};
  }, [boostConfig, vendorId]);

  const status = useMemo(() => {
    const sponsorOn = !!(currentBoost?.sponsoredUntil && typeof currentBoost.sponsoredUntil === 'number' && currentBoost.sponsoredUntil > nowTick);
    const promoOn = !!(currentBoost?.promoUntil && typeof currentBoost.promoUntil === 'number' && currentBoost.promoUntil > nowTick);
    const newOn = !!(currentBoost?.newUntil && typeof currentBoost.newUntil === 'number' && currentBoost.newUntil > nowTick);
    return { sponsorOn, promoOn, newOn };
  }, [currentBoost, nowTick]);

  const actionsDisabled = !vendorId || !catalog.length;

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    reloadFromStorage();
    setNowTick(Date.now());
    window.setTimeout(() => setRefreshing(false), 500);
  }, [reloadFromStorage]);

  const currentStats = useMemo(() => {
    if (!vendorId) return { impressions: 0, clicks: 0, ctr: 0 };
    const s = stats[String(vendorId)] || {};
    const impressions = Number(s.impressions || 0);
    const clicks = Number(s.clicks || 0);
    const ctr = impressions ? Math.round((clicks / impressions) * 100) : 0;
    return { impressions, clicks, ctr };
  }, [stats, vendorId]);

  const savePatch = useCallback((patch: BoostConfigItem) => {
    if (!vendorId) return;
    setBoostConfig((prevState) => {
      const next = { ...prevState };
      const prev = next[String(vendorId)] || {};
      next[String(vendorId)] = { ...prev, ...patch };
      writeJson('mangoo_boost_config', next);
      return next;
    });
  }, [vendorId]);

  const setSponsor = useCallback((hours: number) => {
    const until = Date.now() + hours * 60 * 60 * 1000;
    savePatch({ sponsoredUntil: until, sponsoredTier: tier });
  }, [savePatch, tier]);

  const stopSponsor = useCallback(() => {
    savePatch({ sponsoredUntil: null, sponsoredTier: null });
  }, [savePatch]);

  const setPromo = useCallback((hours: number) => {
    const until = Date.now() + hours * 60 * 60 * 1000;
    savePatch({ promoUntil: until });
  }, [savePatch]);

  const stopPromo = useCallback(() => {
    savePatch({ promoUntil: null });
  }, [savePatch]);

  const setNew = useCallback((hours: number) => {
    const until = Date.now() + hours * 60 * 60 * 1000;
    savePatch({ newUntil: until });
  }, [savePatch]);

  const stopNew = useCallback(() => {
    savePatch({ newUntil: null });
  }, [savePatch]);

  const clearAll = useCallback(() => {
    writeJson('mangoo_boost_config', {});
    setBoostConfig({});
  }, []);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-6">
          <div className="text-gray-700 dark:text-gray-200 font-semibold">Chargement…</div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-6">
          <div className="text-gray-900 dark:text-white font-bold text-lg">Accès refusé</div>
          <div className="text-gray-600 dark:text-gray-300 mt-2">Cette page est réservée à l’administrateur.</div>
          <div className="mt-4">
            <button
              type="button"
              onClick={activateAdminDemo}
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700"
            >
              Activer admin (démo)
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xl font-bold text-gray-900 dark:text-white">Boost Carte</div>
            <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              Configuration admin (Sponsorisé / Promo / Nouveau). Limite carte: 2 sponsorisés visibles.
            </div>
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            className={`px-4 py-2 rounded-xl text-sm font-semibold ${refreshing ? 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200 cursor-wait' : 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200'}`}
          >
            {refreshing ? 'Actualisation…' : 'Actualiser'}
          </button>
          <button
            type="button"
            onClick={clearAll}
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-300"
          >
            Tout arrêter
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <a
            href="/mangoo-local.html?v=87"
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-gray-900 text-white hover:bg-gray-800"
          >
            Ouvrir Local+ (nouvel onglet)
          </a>
          <div className="px-4 py-2 rounded-xl text-sm font-semibold bg-gray-50 text-gray-700 border border-gray-200 dark:bg-gray-800/30 dark:text-gray-200 dark:border-gray-700">
            Vendeur choisi: {vendorId ? 'OK' : '—'}
          </div>
          {!catalog.length && (
            <div className="px-4 py-2 rounded-xl text-sm font-semibold bg-amber-50 text-amber-900 border border-amber-200">
              Ouvrez Local+ une fois pour charger la liste des vendeurs
            </div>
          )}
        </div>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Boutique / Métier</label>
            <select
              value={vendorId}
              onChange={(e) => setVendorId(e.target.value)}
              className="w-full px-3 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              {catalog.length ? (
                catalog.map((v) => (
                  <option key={v.id} value={v.id}>
                    {(String(v.kind || '').toLowerCase() === 'shop' ? '🏪' : '🛠️')} {v.name}
                  </option>
                ))
              ) : (
                <option value="">Ouvrez Local+ une fois pour charger la liste</option>
              )}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Tier sponsor</label>
            <select
              value={tier}
              onChange={(e) => setTier(Number(e.target.value || 1))}
              className="w-full px-3 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value={1}>Bronze</option>
              <option value={2}>Argent</option>
              <option value={3}>Or</option>
            </select>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
            <div className="font-bold text-gray-900 dark:text-white">🏷️ Sponsorisé</div>
            <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              {status.sponsorOn ? (
                <span className="inline-flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">Actif</span>
                  {tierLabel(currentBoost?.sponsoredTier ?? tier)} • Jusqu’à {formatTime(currentBoost?.sponsoredUntil ?? null)} • {formatRemaining(currentBoost?.sponsoredUntil ?? null, nowTick)}
                </span>
              ) : (
                <span className="inline-flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-lg bg-gray-100 text-gray-700 border border-gray-200 text-xs font-bold">Inactif</span>
                  —
                </span>
              )}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                onClick={() => setSponsor(12)}
                disabled={actionsDisabled}
                className={`px-3 py-2 rounded-xl font-semibold ${status.sponsorOn ? 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-200' : 'bg-gray-900 text-white hover:bg-gray-800'}`}
              >
                {status.sponsorOn ? 'Prolonger 12h' : 'Activer 12h'}
              </button>
              <button
                onClick={() => setSponsor(24)}
                disabled={actionsDisabled}
                className={`px-3 py-2 rounded-xl font-semibold ${status.sponsorOn ? 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-200' : 'bg-gray-900 text-white hover:bg-gray-800'}`}
              >
                {status.sponsorOn ? 'Prolonger 24h' : 'Activer 24h'}
              </button>
              <button
                onClick={() => setSponsor(72)}
                disabled={actionsDisabled}
                className={`px-3 py-2 rounded-xl font-semibold ${status.sponsorOn ? 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-200' : 'bg-gray-900 text-white hover:bg-gray-800'}`}
              >
                {status.sponsorOn ? 'Prolonger 72h' : 'Activer 72h'}
              </button>
              <button
                onClick={stopSponsor}
                disabled={actionsDisabled || !status.sponsorOn}
                className={`px-3 py-2 rounded-xl font-semibold ${status.sponsorOn ? 'bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-300' : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500 cursor-not-allowed'}`}
              >
                Stop
              </button>
            </div>
          </div>

          <div className="border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
            <div className="font-bold text-gray-900 dark:text-white">✨ Promo</div>
            <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              {status.promoOn ? (
                <span className="inline-flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">Actif</span>
                  Jusqu’à {formatTime(currentBoost?.promoUntil ?? null)} • {formatRemaining(currentBoost?.promoUntil ?? null, nowTick)}
                </span>
              ) : (
                <span className="inline-flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-lg bg-gray-100 text-gray-700 border border-gray-200 text-xs font-bold">Inactif</span>
                  —
                </span>
              )}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                onClick={() => setPromo(24)}
                disabled={actionsDisabled}
                className={`px-3 py-2 rounded-xl font-semibold ${status.promoOn ? 'bg-amber-50 text-amber-900 border border-amber-200' : 'bg-amber-100 text-amber-800 hover:bg-amber-200'}`}
              >
                {status.promoOn ? 'Prolonger 24h' : 'Activer 24h'}
              </button>
              <button
                onClick={() => setPromo(72)}
                disabled={actionsDisabled}
                className={`px-3 py-2 rounded-xl font-semibold ${status.promoOn ? 'bg-amber-50 text-amber-900 border border-amber-200' : 'bg-amber-100 text-amber-800 hover:bg-amber-200'}`}
              >
                {status.promoOn ? 'Prolonger 72h' : 'Activer 72h'}
              </button>
              <button
                onClick={stopPromo}
                disabled={actionsDisabled || !status.promoOn}
                className={`px-3 py-2 rounded-xl font-semibold col-span-2 ${status.promoOn ? 'bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-300' : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500 cursor-not-allowed'}`}
              >
                Stop
              </button>
            </div>
          </div>

          <div className="border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
            <div className="font-bold text-gray-900 dark:text-white">🆕 Nouveau</div>
            <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              {status.newOn ? (
                <span className="inline-flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">Actif</span>
                  Jusqu’à {formatTime(currentBoost?.newUntil ?? null)} • {formatRemaining(currentBoost?.newUntil ?? null, nowTick)}
                </span>
              ) : (
                <span className="inline-flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-lg bg-gray-100 text-gray-700 border border-gray-200 text-xs font-bold">Inactif</span>
                  —
                </span>
              )}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                onClick={() => setNew(24)}
                disabled={actionsDisabled}
                className={`px-3 py-2 rounded-xl font-semibold ${status.newOn ? 'bg-indigo-50 text-indigo-900 border border-indigo-200' : 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200'}`}
              >
                {status.newOn ? 'Prolonger 24h' : 'Activer 24h'}
              </button>
              <button
                onClick={() => setNew(72)}
                disabled={actionsDisabled}
                className={`px-3 py-2 rounded-xl font-semibold ${status.newOn ? 'bg-indigo-50 text-indigo-900 border border-indigo-200' : 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200'}`}
              >
                {status.newOn ? 'Prolonger 72h' : 'Activer 72h'}
              </button>
              <button
                onClick={stopNew}
                disabled={actionsDisabled || !status.newOn}
                className={`px-3 py-2 rounded-xl font-semibold col-span-2 ${status.newOn ? 'bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-300' : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500 cursor-not-allowed'}`}
              >
                Stop
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 bg-gray-50 dark:bg-gray-800/40">
          <div className="flex items-center justify-between gap-4">
            <div className="font-bold text-gray-900 dark:text-white">Stats (session)</div>
            <div className="text-gray-700 dark:text-gray-200 font-semibold">
              {currentStats.impressions} vues • {currentStats.clicks} clics • {currentStats.ctr}%
            </div>
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-300 mt-2">
            Les stats sont stockées en local (prototype). En production, elles seront côté serveur.
          </div>
        </div>

        {!catalog.length && (
          <div className="mt-4 text-sm text-gray-600 dark:text-gray-300">
            Astuce: ouvrez une fois <span className="font-semibold">Mangoo Local+</span> pour remplir la liste des vendeurs.
          </div>
        )}
      </div>
    </div>
  );
}
