import React, { useState, useEffect, useCallback, useMemo } from 'react';
import VendorAccessQR from '../components/VendorAccessQR';
import { useTheme } from '../hooks/useTheme';

const generatePassword = () => Math.random().toString(36).slice(-10);
const normalizeEmail = (value) => String(value || '').trim().toLowerCase();
const normalizeSearchText = (value) => String(value || '')
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .trim();
const buildFallbackOwnerEmail = (shop) => {
  const existing = normalizeEmail(shop?.ownerEmail || shop?.owner_email || shop?.email);
  if (existing) return existing;
  const slug = String(shop?.slug || '').trim().toLowerCase();
  if (!slug) return '';
  return `${slug}@boutique.mangoo.local`;
};

const VendorAccessQRPage = () => {
  const { isDark } = useTheme();
  const [shops, setShops] = useState([]);
  const [selectedShop, setSelectedShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const loadShops = useCallback(() => {
    try {
      setLoading(true);
      setError(null);
      const raw = localStorage.getItem('demo_shops');
      const parsed = raw ? JSON.parse(raw) : [];
      const list = Array.isArray(parsed) ? parsed : [];
      const listWithSlug = list.filter((s) => s?.slug);
      const enriched = listWithSlug
        .map((s) => {
          const ownerEmail = buildFallbackOwnerEmail(s);
          const ownerPassword = String(s?.ownerPassword || s?.owner_password || '').trim() || generatePassword();
          return {
            ...s,
            id: s.id || s.slug,
            ownerEmail,
            ownerPassword,
            approvalStatus: s.approvalStatus || 'pending'
          };
        });
      const changed = enriched.some((s, idx) => {
        const current = listWithSlug[idx] || {};
        const currentEmail = normalizeEmail(current?.ownerEmail || current?.owner_email || current?.email);
        const currentPassword = String(current?.ownerPassword || current?.owner_password || '').trim();
        return currentEmail !== String(s.ownerEmail || '').trim().toLowerCase()
          || currentPassword !== String(s.ownerPassword || '').trim()
          || String(current?.approvalStatus || 'pending') !== String(s.approvalStatus || 'pending');
      });
      if (changed) {
        const bySlug = new Map(enriched.map((s) => [String(s.slug), s]));
        const rewritten = list.map((s) => {
          const slug = String(s?.slug || '').trim();
          return bySlug.get(slug) || s;
        });
        localStorage.setItem('demo_shops', JSON.stringify(rewritten));
      }
      const normalized = enriched
        .filter((s) => s?.slug)
        .sort((a, b) => String(a?.name || '').localeCompare(String(b?.name || ''), 'fr'));

      setShops(normalized);
      if (normalized.length > 0) {
        setSelectedShop((prev) => {
          if (prev && normalized.some((s) => s.slug === prev.slug)) {
            return normalized.find((s) => s.slug === prev.slug) || normalized[0];
          }
          return normalized[0];
        });
      } else {
        setSelectedShop(null);
      }
    } catch {
      setError('Impossible de charger la liste des boutiques');
      setShops([]);
      setSelectedShop(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadShops();
    const onStorage = (e) => {
      if (e.key === 'demo_shops') loadShops();
    };
    const onCustom = () => loadShops();
    window.addEventListener('storage', onStorage);
    window.addEventListener('demo-shops-updated', onCustom);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('demo-shops-updated', onCustom);
    };
  }, [loadShops]);

  const approvedCount = useMemo(() => shops.filter((s) => String(s?.approvalStatus || 'pending') === 'approved').length, [shops]);
  const pendingCount = useMemo(() => shops.filter((s) => String(s?.approvalStatus || 'pending') === 'pending').length, [shops]);
  const filteredShops = useMemo(() => {
    const q = normalizeSearchText(searchTerm);
    if (!q) return shops;
    return shops.filter((shop) => {
      const hay = normalizeSearchText(`${shop?.name || ''} ${shop?.slug || ''} ${shop?.ownerEmail || ''}`);
      return hay.includes(q);
    });
  }, [searchTerm, shops]);

  if (loading) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>Chargement des boutiques...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h2 className="text-xl font-semibold text-red-800 mb-2">Erreur</h2>
          <p className="text-red-700">{error}</p>
          <button 
            onClick={loadShops}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  if (shops.length === 0) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md">
          <h2 className="text-xl font-semibold text-yellow-800 mb-2">Aucune boutique</h2>
          <p className="text-yellow-700">Aucune boutique n'a été trouvée.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Accès vendeur : lien, QR et PIN</h1>
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} mt-2`}>Préparez les identifiants, le lien, le QR code et le PIN pour un accès simple à la boutique.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <div className={`${isDark ? 'bg-gray-800 border-gray-700 text-gray-200' : 'bg-white border-gray-200 text-gray-800'} border rounded-lg px-3 py-2 text-sm font-semibold`}>Total: {shops.length}</div>
            <div className={`${isDark ? 'bg-emerald-900/30 border-emerald-700 text-emerald-200' : 'bg-emerald-50 border-emerald-200 text-emerald-800'} border rounded-lg px-3 py-2 text-sm font-semibold`}>Approuvées: {approvedCount}</div>
            <div className={`${isDark ? 'bg-amber-900/30 border-amber-700 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-800'} border rounded-lg px-3 py-2 text-sm font-semibold`}>En attente: {pendingCount}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Liste des boutiques */}
          <div className="lg:col-span-1">
            <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg shadow p-4`}>
              <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-800'} mb-4`}>Sélectionner une boutique</h2>
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher une boutique"
                className={`w-full mb-4 px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-400' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500'}`}
              />
              <div className="space-y-2">
                {filteredShops.map((shop) => (
                  <button
                    key={shop.id}
                    onClick={() => {
                      setSelectedShop(shop);
                    }}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedShop?.id === shop.id
                        ? (isDark ? 'bg-blue-900/20 border-blue-700 text-blue-200' : 'bg-blue-50 border-blue-300 text-blue-800')
                        : (isDark ? 'bg-gray-900 border-gray-700 text-gray-200 hover:bg-gray-800' : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100')
                    }`}
                  >
                    <div className="font-medium">{shop.name}</div>
                    <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} break-all`}>{shop.slug}</div>
                    {String(shop?.approvalStatus || 'pending') !== 'approved' && (
                      <div className={`mt-2 text-xs font-semibold ${isDark ? 'text-amber-200' : 'text-amber-800'}`}>En attente d’approbation</div>
                    )}
                  </button>
                ))}
                {filteredShops.length === 0 && (
                  <div className={`px-3 py-6 text-sm text-center rounded-lg border ${isDark ? 'bg-gray-900 border-gray-700 text-gray-400' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>
                    Aucune boutique ne correspond à la recherche.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Détails de la boutique sélectionnée */}
          <div className="lg:col-span-3">
            {selectedShop && (
              <div>
                <VendorAccessQR
                  shopId={selectedShop.id}
                  shopName={selectedShop.name}
                  shopSlug={selectedShop.slug}
                  shopOwnerEmail={selectedShop.ownerEmail}
                  shopOwnerPassword={selectedShop.ownerPassword}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorAccessQRPage;
