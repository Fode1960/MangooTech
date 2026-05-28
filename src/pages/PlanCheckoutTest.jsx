import React, { useEffect, useMemo, useState } from 'react';
import { useThemeStore } from '../stores/themeStore';
import { PaymentMethods } from '../components/PaymentMethodsStable';
import { buildApiUrl } from '../config/api.js';
import { useSearchParams } from 'react-router-dom';

export default function PlanCheckoutTest() {
  const { isDark } = useThemeStore();
  const [searchParams] = useSearchParams();
  const [packs, setPacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPackId, setSelectedPackId] = useState('');
  const [paid, setPaid] = useState(null);
  const [currentPack, setCurrentPack] = useState({ mode: 'unknown', pack: null, userPack: null });
  const [prorata, setProrata] = useState({ loading: false, error: '', mode: null, quote: null, currentPack: null });

  const currentUser = useMemo(() => {
    try {
      const raw = localStorage.getItem('mangoo-current-user') || localStorage.getItem('user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  const userId = currentUser?.id || currentUser?.email || '';
  const displayedUserId = userId || 'anonymous';

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch(buildApiUrl(`/api/user-pack/current?userId=${encodeURIComponent(displayedUserId)}`));
        const data = await res.json();
        if (!res.ok || !data?.success) throw new Error(data?.details || data?.error || `HTTP ${res.status}`);

        if (!cancelled) {
          setCurrentPack({ mode: data.mode || 'unknown', pack: data.pack || null, userPack: data.userPack || null });
        }
      } catch {
        if (!cancelled) setCurrentPack({ mode: 'unknown', pack: null, userPack: null });
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [displayedUserId]);

  const localActivePack = useMemo(() => {
    try {
      const raw = localStorage.getItem('mangoo-active-pack');
      const data = raw ? JSON.parse(raw) : null;
      if (!data || typeof data !== 'object') return null;
      if (String(data.userId || '') !== String(displayedUserId)) return null;
      return data;
    } catch {
      return null;
    }
  }, [displayedUserId]);

  const effectiveActivePackId = useMemo(() => {
    return currentPack?.pack?.id || currentPack?.userPack?.pack_id || localActivePack?.packId || null;
  }, [currentPack, localActivePack]);

  const effectiveActivePack = useMemo(() => {
    if (!effectiveActivePackId) return null;
    return packs.find((p) => p.id === effectiveActivePackId) || currentPack?.pack || null;
  }, [currentPack, effectiveActivePackId, packs]);

  const lastSelectedPlan = useMemo(() => {
    try {
      return localStorage.getItem('mangoo-last-selected-plan');
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(buildApiUrl('/api/packs?source=demo'));
        const data = await res.json();
        if (!res.ok || !data?.success) {
          throw new Error(data?.details || data?.error || `HTTP ${res.status}`);
        }
        if (!cancelled) {
          setPacks(Array.isArray(data.packs) ? data.packs : []);
        }
      } catch (e) {
        if (!cancelled) setError(String(e?.message || e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!packs.length) return;
    if (selectedPackId) return;
    const fromQuery = String(searchParams.get('pack') || '').trim();
    if (!fromQuery) return;
    const exists = packs.some((p) => p.id === fromQuery);
    if (exists) setSelectedPackId(fromQuery);
  }, [packs, searchParams, selectedPackId]);

  const selectedPack = useMemo(() => {
    return packs.find((p) => p.id === selectedPackId) || null;
  }, [packs, selectedPackId]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!selectedPackId) {
        setProrata({ loading: false, error: '', mode: null, quote: null, currentPack: null });
        return;
      }
      setProrata((p) => ({ ...p, loading: true, error: '' }));
      try {
        const res = await fetch(buildApiUrl(`/api/demo-billing/prorata-quote?userId=${encodeURIComponent(displayedUserId)}&packId=${encodeURIComponent(selectedPackId)}`));
        const data = await res.json();
        if (!res.ok || !data?.success) throw new Error(data?.details || data?.error || `HTTP ${res.status}`);
        if (!cancelled) {
          setProrata({ loading: false, error: '', mode: data.mode || null, quote: data.quote || null, currentPack: data.currentPack || null });
        }
      } catch (e) {
        if (!cancelled) setProrata({ loading: false, error: String(e?.message || e), mode: null, quote: null, currentPack: null });
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [displayedUserId, selectedPackId]);

  const resolvedCurrency = useMemo(() => {
    const c = String(selectedPack?.currency || 'XOF').toUpperCase();
    if (c === 'FCFA') return 'XOF';
    return c;
  }, [selectedPack]);

  const clientSideQuote = useMemo(() => {
    if (!effectiveActivePackId || !selectedPackId) return null;
    if (!localActivePack?.startedAt || !localActivePack?.expiresAt) return null;
    const startedAt = new Date(localActivePack.startedAt);
    const expiresAt = new Date(localActivePack.expiresAt);
    const now = new Date();
    const totalMs = expiresAt.getTime() - startedAt.getTime();
    if (!Number.isFinite(totalMs) || totalMs <= 0) return null;
    const remainingMs = expiresAt.getTime() - now.getTime();
    const ratio = Math.max(0, Math.min(1, remainingMs / totalMs));
    const fromPrice = Number(effectiveActivePack?.price || 0);
    const toPrice = Number(selectedPack?.price || 0);
    const fromRemaining = Math.max(0, Math.round(fromPrice * ratio));
    const toRemaining = Math.max(0, Math.round(toPrice * ratio));
    const chargeAmount = Math.max(0, Math.round(toRemaining - fromRemaining));
    const creditAmount = Math.max(0, Math.round(fromRemaining - toRemaining));
    return {
      ratio,
      fromPack: { id: effectiveActivePackId, name: effectiveActivePack?.name || effectiveActivePackId, price: fromPrice, currency: 'XOF' },
      toPack: { id: selectedPackId, name: selectedPack?.name || selectedPackId, price: toPrice, currency: 'XOF' },
      fromRemaining,
      toRemaining,
      chargeAmount,
      creditAmount,
    };
  }, [effectiveActivePack?.name, effectiveActivePack?.price, effectiveActivePackId, localActivePack?.expiresAt, localActivePack?.startedAt, selectedPack?.name, selectedPack?.price, selectedPackId]);

  const effectiveQuote = useMemo(() => {
    const serverQuote = prorata?.quote || null;
    const serverFromId = serverQuote?.fromPack?.id || null;
    const localFromId = effectiveActivePackId || null;

    if (
      clientSideQuote &&
      localFromId &&
      (!serverQuote || prorata?.mode === 'new_cycle' || !serverFromId)
    ) {
      return clientSideQuote;
    }

    return serverQuote || clientSideQuote || null;
  }, [clientSideQuote, effectiveActivePackId, prorata?.mode, prorata?.quote]);

  const effectiveProrataPercent = useMemo(() => {
    const r = Number(effectiveQuote?.ratio);
    if (!Number.isFinite(r)) return null;
    return Math.round(r * 100);
  }, [effectiveQuote?.ratio]);

  const isDowngrade = useMemo(() => {
    const fromPrice = Number(effectiveQuote?.fromPack?.price || 0);
    const toPrice = Number(effectiveQuote?.toPack?.price || 0);
    return Number.isFinite(fromPrice) && Number.isFinite(toPrice) && toPrice < fromPrice;
  }, [effectiveQuote?.fromPack?.price, effectiveQuote?.toPack?.price]);

  const downgradeEffectiveAt = useMemo(() => {
    const raw = effectiveQuote?.effectiveAt || prorata?.currentPack?.expires_at || localActivePack?.expiresAt || null;
    if (!raw) return null;
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return null;
    return d;
  }, [effectiveQuote?.effectiveAt, localActivePack?.expiresAt, prorata?.currentPack?.expires_at]);

  const scheduleDowngrade = async () => {
    try {
      if (!selectedPackId) return;
      const res = await fetch(buildApiUrl(`/api/demo-billing/activate-pack?userId=${encodeURIComponent(displayedUserId)}&packId=${encodeURIComponent(selectedPackId)}&source=client_schedule`));
      const data = await res.json();
      if (!res.ok || !data?.success) throw new Error(data?.details || data?.error || `HTTP ${res.status}`);

      try {
        const activeRaw = localStorage.getItem('mangoo-active-pack');
        const active = activeRaw ? JSON.parse(activeRaw) : null;
        const sameUser = active && typeof active === 'object' && String(active.userId || '') === String(displayedUserId);
        const currentPackId = sameUser ? (active.packId || effectiveActivePackId || null) : (effectiveActivePackId || null);
        const next = {
          ...(sameUser ? active : {}),
          userId: String(displayedUserId),
          packId: currentPackId,
          source: 'client_schedule',
          pendingPackId: String(selectedPackId),
          pendingPackEffectiveAt: data?.userPack?.metadata?.pending_pack_effective_at || effectiveQuote?.effectiveAt || null,
          pendingProrata: effectiveQuote || null,
          updatedAt: new Date().toISOString(),
        };
        localStorage.setItem('mangoo-active-pack', JSON.stringify(next));
      } catch {
      }

      try {
        const historyRaw = localStorage.getItem('mangoo-pack-history');
        const historyData = historyRaw ? JSON.parse(historyRaw) : {};
        const map = historyData && typeof historyData === 'object' ? historyData : {};
        const key = String(displayedUserId);
        const list = Array.isArray(map[key]) ? map[key] : [];
        const entry = {
          at: new Date().toISOString(),
          fromPackId: effectiveActivePackId || null,
          toPackId: selectedPackId,
          source: 'client_schedule',
          txId: `schedule_${Date.now()}`,
          prorata: effectiveQuote || null,
        };
        map[key] = [entry, ...list].slice(0, 50);
        localStorage.setItem('mangoo-pack-history', JSON.stringify(map));
      } catch {
      }

      setPaid({ ok: true, kind: 'schedule', tx: { id: `schedule_${Date.now()}` } });
      try {
        window.dispatchEvent(new Event('mangoo-pack-updated'));
      } catch {
      }
    } catch (e) {
      setPaid({ ok: false, error: String(e?.message || e) });
    }
  };

  const cycleInfo = useMemo(() => {
    const startRaw = prorata?.currentPack?.started_at || localActivePack?.startedAt || null;
    const endRaw = prorata?.currentPack?.expires_at || localActivePack?.expiresAt || null;
    if (!startRaw || !endRaw) return null;
    const start = new Date(startRaw);
    const end = new Date(endRaw);
    const now = new Date();
    const totalMs = end.getTime() - start.getTime();
    if (!Number.isFinite(totalMs) || totalMs <= 0) return null;
    const remainingMs = end.getTime() - now.getTime();
    const dayMs = 24 * 60 * 60 * 1000;
    const totalDays = Math.max(1, Math.ceil(totalMs / dayMs));
    const remainingDays = Math.max(0, Math.ceil(remainingMs / dayMs));
    return { start, end, totalDays, remainingDays };
  }, [localActivePack?.expiresAt, localActivePack?.startedAt, prorata?.currentPack?.expires_at, prorata?.currentPack?.started_at]);

  const resolvedAmount = useMemo(() => {
    const quoted = Number(effectiveQuote?.chargeAmount);
    if (Number.isFinite(quoted) && quoted >= 0) return quoted;
    const price = Number(selectedPack?.price ?? 0);
    if (!Number.isFinite(price) || price < 0) return 0;
    return price;
  }, [effectiveQuote?.chargeAmount, selectedPack]);

  return (
    <div className={`min-h-screen py-10 ${isDark ? 'bg-gray-950 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-bold">Test achat de plan</h1>
            <div className={`${isDark ? 'text-gray-300' : 'text-gray-600'} text-sm`}>
              Cette page sert à tester : sélection pack → paiement → activation pack.
            </div>
          </div>
          <a
            href="/"
            className={`text-sm font-semibold px-3 py-2 rounded-lg border transition-colors ${
              isDark ? 'bg-gray-900 border-gray-700 hover:bg-gray-800' : 'bg-white border-gray-200 hover:bg-gray-50'
            }`}
          >
            Retour
          </a>
        </div>

        <div className={`rounded-xl border p-4 mb-6 ${isDark ? 'border-gray-800 bg-gray-900/40' : 'border-gray-200 bg-white'}`}>
          <div className="text-sm font-semibold mb-1">Utilisateur</div>
          <div className={`${isDark ? 'text-gray-300' : 'text-gray-700'} text-sm`}>
            {userId ? (
              <span>Connecté en tant que: {userId}</span>
            ) : (
              <span>Non connecté. Faites d’abord Connexion pour tester l’activation sur votre compte.</span>
            )}
          </div>
          <div className={`${isDark ? 'text-gray-400' : 'text-gray-500'} text-xs mt-2`}>
            ID utilisé pour le test: {displayedUserId}
          </div>
          <div className={`${isDark ? 'text-gray-300' : 'text-gray-700'} text-sm mt-3`}>
            <span className="font-semibold">Plan choisi:</span>{' '}
            {lastSelectedPlan === 'pro' ? 'Pro' : lastSelectedPlan ? 'Gratuit' : '—'}
          </div>
          <div className={`${isDark ? 'text-gray-300' : 'text-gray-700'} text-sm mt-1`}>
            <span className="font-semibold">Pack actif:</span>{' '}
            {effectiveActivePack ? (
              <span>{effectiveActivePack.name}</span>
            ) : (
              <span>Aucun (paiement requis)</span>
            )}
            {currentPack?.mode === 'offline' ? (
              <span className={`ml-2 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>(hors ligne)</span>
            ) : null}
          </div>
        </div>

        {loading ? (
          <div className="py-10 text-center">Chargement des packs…</div>
        ) : error ? (
          <div className={`rounded-xl border p-4 ${isDark ? 'border-red-900 bg-red-950/30 text-red-200' : 'border-red-200 bg-red-50 text-red-700'}`}>
            Erreur chargement packs: {error}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className={`rounded-xl border p-4 ${isDark ? 'border-gray-800 bg-gray-900/40' : 'border-gray-200 bg-white'}`}>
              <div className="text-sm font-semibold mb-3">Choisir un pack</div>
              <select
                value={selectedPackId}
                onChange={(e) => {
                  setPaid(null);
                  setSelectedPackId(e.target.value);
                }}
                className={`w-full px-3 py-2 rounded-lg border ${
                  isDark ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                <option value="">-- Sélectionnez un pack --</option>
                {packs.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {Number(p.price ?? 0).toLocaleString('fr-FR')} {String(p.currency || 'XOF')}
                  </option>
                ))}
              </select>

              {selectedPack && (
                <div className="mt-4 text-sm">
                  <div className="font-semibold">Détails</div>
                  <div className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {selectedPack.description || '—'}
                  </div>
                </div>
              )}
            </div>

            <div>
              {selectedPack ? (
                <>
                  {(prorata.loading || effectiveQuote || prorata.error) && (
                    <div className={`mb-4 rounded-xl border p-4 ${isDark ? 'border-gray-800 bg-gray-950/30' : 'border-gray-200 bg-gray-50'}`}>
                      <div className="text-sm font-semibold">Prorata</div>
                      {prorata.loading ? (
                        <div className={`${isDark ? 'text-gray-300' : 'text-gray-700'} text-sm mt-2`}>Calcul en cours…</div>
                      ) : prorata.error ? (
                        <div className={`${isDark ? 'text-red-200' : 'text-red-700'} text-sm mt-2`}>Erreur: {prorata.error}</div>
                      ) : effectiveQuote ? (
                        <div className={`${isDark ? 'text-gray-300' : 'text-gray-700'} text-sm mt-2 space-y-1`}>
                          {cycleInfo ? (
                            <div>
                              Période: {cycleInfo.start.toLocaleDateString('fr-FR')} → {cycleInfo.end.toLocaleDateString('fr-FR')} ({cycleInfo.remainingDays}/{cycleInfo.totalDays} jours restants)
                            </div>
                          ) : null}
                          <div>
                            Reste de période: {effectiveProrataPercent ?? '—'}%
                          </div>
                          <div>
                            Ancien pack: {effectiveQuote?.fromPack?.name || 'Aucun'} → Nouveau pack: {effectiveQuote?.toPack?.name || '—'}
                          </div>
                          <div>
                            Valeur restante ancien: {Number(effectiveQuote.fromRemaining || 0).toLocaleString('fr-FR')} XOF
                          </div>
                          <div>
                            Valeur restante nouveau: {Number(effectiveQuote.toRemaining || 0).toLocaleString('fr-FR')} XOF
                          </div>
                          <div className="font-semibold">
                            À payer maintenant: {Number(effectiveQuote.chargeAmount || 0).toLocaleString('fr-FR')} XOF
                          </div>
                          {Number(effectiveQuote.creditAmount || 0) > 0 ? (
                            <div>
                              Crédit (si rétrogradation): {Number(effectiveQuote.creditAmount || 0).toLocaleString('fr-FR')} XOF
                            </div>
                          ) : null}
                          {isDowngrade ? (
                            <div className={`${isDark ? 'text-gray-300' : 'text-gray-700'} text-sm`}>
                              Rétrogradation planifiée (conventionnel): effet au {downgradeEffectiveAt ? downgradeEffectiveAt.toLocaleDateString('fr-FR') : 'prochain renouvellement'}.
                            </div>
                          ) : null}
                          <div className={`${isDark ? 'text-gray-400' : 'text-gray-500'} text-xs`}>
                            Formule: montant = (prix_nouveau × %restant) − (prix_actuel × %restant)
                          </div>
                        </div>
                      ) : null}
                    </div>
                  )}

                  {isDowngrade && resolvedAmount === 0 ? (
                    <div className={`rounded-xl border p-4 ${isDark ? 'border-gray-800 bg-gray-900/40' : 'border-gray-200 bg-white'}`}>
                      <div className="text-sm font-semibold">Confirmation</div>
                      <div className={`${isDark ? 'text-gray-300' : 'text-gray-700'} text-sm mt-2`}>
                        Aucun paiement requis. Le changement sera appliqué automatiquement à la fin de la période.
                      </div>
                      <button
                        type="button"
                        onClick={scheduleDowngrade}
                        className="mt-3 w-full bg-orange-500 text-white py-2 rounded-lg font-semibold hover:bg-orange-600 transition-colors"
                      >
                        Programmer la rétrogradation
                      </button>
                    </div>
                  ) : (
                    <PaymentMethods
                      amount={String(resolvedAmount)}
                      currency={resolvedCurrency}
                      country="CI"
                      userId={displayedUserId}
                      packId={selectedPack.id}
                      packName={selectedPack.name}
                      packPrice={selectedPack.price}
                      description={`Abonnement ${selectedPack.name}`}
                      onPaymentSuccess={(tx) => setPaid({ ok: true, tx })}
                      onPaymentError={(e) => setPaid({ ok: false, error: String(e?.message || e) })}
                    />
                  )}
                </>
              ) : (
                <div className={`rounded-xl border p-4 ${isDark ? 'border-gray-800 bg-gray-900/40' : 'border-gray-200 bg-white'}`}>
                  Sélectionnez un pack pour afficher les moyens de paiement.
                </div>
              )}

              {paid && (
                <div className={`mt-4 rounded-xl border p-4 ${
                  paid.ok
                    ? isDark
                      ? 'border-emerald-900 bg-emerald-950/30 text-emerald-200'
                      : 'border-emerald-200 bg-emerald-50 text-emerald-800'
                    : isDark
                      ? 'border-red-900 bg-red-950/30 text-red-200'
                      : 'border-red-200 bg-red-50 text-red-700'
                }`}>
                  {paid.ok ? (
                    <div>
                      <div>{paid.kind === 'schedule' ? 'Changement programmé (test).' : 'Paiement OK (test).'}</div>
                      <div className="mt-2 text-sm">
                        Vérification activation (mode démo):{' '}
                        <a className="underline" href={`/api/demo-billing/user-pack/${encodeURIComponent(displayedUserId)}`}>
                          /api/demo-billing/user-pack/{displayedUserId}
                        </a>
                      </div>
                    </div>
                  ) : (
                    `Paiement KO: ${paid.error}`
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
