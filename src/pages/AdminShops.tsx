import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle, ExternalLink, Search, XCircle } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

type ApprovalStatus = 'pending' | 'approved' | 'rejected';

type DemoShop = {
  id?: string;
  name?: string;
  slug?: string;
  category?: string;
  ownerName?: string;
  ownerEmail?: string;
  logoDataUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  createdAt?: string;
  updatedAt?: string;
  shopUrl?: string;
  approvalStatus?: ApprovalStatus;
  approvedAt?: string;
  approvedBy?: string;
  rejectedAt?: string;
  rejectedBy?: string;
};

const STORAGE_KEY = 'demo_shops';
const ADMIN_EMAIL = 'admin@mangoo.tech';

const readDemoShops = (): DemoShop[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeDemoShops = (shops: DemoShop[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(shops));
  window.dispatchEvent(new Event('demo-shops-updated'));
};

const normalizeStatus = (shop: DemoShop): DemoShop => {
  const status = (shop.approvalStatus || 'pending') as ApprovalStatus;
  return { ...shop, approvalStatus: status };
};

const statusBadge = (status: ApprovalStatus, isDark: boolean) => {
  if (status === 'approved') return isDark ? 'bg-emerald-900/30 text-emerald-200 border border-emerald-700' : 'bg-emerald-50 text-emerald-800 border border-emerald-200';
  if (status === 'rejected') return isDark ? 'bg-red-900/30 text-red-200 border border-red-700' : 'bg-red-50 text-red-800 border border-red-200';
  return isDark ? 'bg-amber-900/30 text-amber-200 border border-amber-700' : 'bg-amber-50 text-amber-800 border border-amber-200';
};

export default function AdminShops() {
  const { isDark } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | ApprovalStatus>('all');
  const [shops, setShops] = useState<DemoShop[]>([]);

  const refresh = useCallback(() => {
    const now = new Date().toISOString();
    const current = readDemoShops();
    let didMigrate = false;
    const migrated = current.map((s) => {
      if (!s?.slug) return s;
      if (s.approvalStatus) return s;
      didMigrate = true;
      return { ...s, approvalStatus: 'pending', updatedAt: s.updatedAt || now };
    });
    if (didMigrate) writeDemoShops(migrated);
    const next = migrated.map(normalizeStatus).filter((s) => s.slug);
    setShops(next);
  }, []);

  useEffect(() => {
    refresh();
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) refresh();
    };
    const onCustom = () => refresh();
    window.addEventListener('storage', onStorage);
    window.addEventListener('demo-shops-updated', onCustom);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('demo-shops-updated', onCustom);
    };
  }, [refresh]);

  const setApproval = useCallback((slug: string, status: ApprovalStatus) => {
    const now = new Date().toISOString();
    const current = readDemoShops();
    const next = current.map((s) => {
      if (s?.slug !== slug) return s;
      if (status === 'approved') {
        return { ...s, approvalStatus: 'approved', approvedAt: now, approvedBy: ADMIN_EMAIL };
      }
      if (status === 'rejected') {
        return { ...s, approvalStatus: 'rejected', rejectedAt: now, rejectedBy: ADMIN_EMAIL };
      }
      return { ...s, approvalStatus: 'pending' };
    });
    writeDemoShops(next);
    setShops(next.map(normalizeStatus).filter((s) => s.slug));
  }, []);

  const filtered = useMemo(() => {
    const q = String(searchTerm || '').trim().toLowerCase();
    return (shops || [])
      .filter((s) => {
        const status = (s.approvalStatus || 'pending') as ApprovalStatus;
        if (filterStatus !== 'all' && status !== filterStatus) return false;
        if (!q) return true;
        const hay = `${s.name || ''} ${s.slug || ''} ${s.ownerEmail || ''} ${s.ownerName || ''} ${s.category || ''}`.toLowerCase();
        return hay.includes(q);
      })
      .sort((a, b) => {
        const pa = (a.approvalStatus || 'pending') as ApprovalStatus;
        const pb = (b.approvalStatus || 'pending') as ApprovalStatus;
        const score = (st: ApprovalStatus) => (st === 'pending' ? 0 : st === 'approved' ? 1 : 2);
        const d = score(pa) - score(pb);
        if (d !== 0) return d;
        return String(b.createdAt || '').localeCompare(String(a.createdAt || ''));
      });
  }, [filterStatus, searchTerm, shops]);

  return (
    <div className={`${isDark ? 'bg-gray-900' : 'bg-gray-50'} min-h-full`}>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Boutiques</h1>
            <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} mt-1`}>Approuvez les boutiques créées côté vendeur avant publication.</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-2 rounded-lg text-sm font-semibold border ${filterStatus === 'all' ? (isDark ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-gray-900 border-gray-200') : (isDark ? 'bg-gray-900 text-gray-300 border-gray-700 hover:bg-gray-800' : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-white')}`}
            >
              Toutes
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('pending')}
              className={`px-3 py-2 rounded-lg text-sm font-semibold border ${filterStatus === 'pending' ? (isDark ? 'bg-amber-900/30 text-amber-100 border-amber-700' : 'bg-amber-50 text-amber-900 border-amber-200') : (isDark ? 'bg-gray-900 text-gray-300 border-gray-700 hover:bg-gray-800' : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-white')}`}
            >
              En attente
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('approved')}
              className={`px-3 py-2 rounded-lg text-sm font-semibold border ${filterStatus === 'approved' ? (isDark ? 'bg-emerald-900/30 text-emerald-100 border-emerald-700' : 'bg-emerald-50 text-emerald-900 border-emerald-200') : (isDark ? 'bg-gray-900 text-gray-300 border-gray-700 hover:bg-gray-800' : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-white')}`}
            >
              Approuvées
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('rejected')}
              className={`px-3 py-2 rounded-lg text-sm font-semibold border ${filterStatus === 'rejected' ? (isDark ? 'bg-red-900/30 text-red-100 border-red-700' : 'bg-red-50 text-red-900 border-red-200') : (isDark ? 'bg-gray-900 text-gray-300 border-gray-700 hover:bg-gray-800' : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-white')}`}
            >
              Rejetées
            </button>
          </div>
        </div>

        <div className={`border rounded-2xl overflow-hidden ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className={`p-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="relative">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-400'}`} />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher une boutique (nom, slug, email…)"
                className={`w-full pl-10 pr-3 py-2 rounded-lg border ${isDark ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-400' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500'}`}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className={isDark ? 'bg-gray-900/50' : 'bg-gray-50'}>
                <tr className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                  <th className="text-left px-4 py-3 font-semibold">Boutique</th>
                  <th className="text-left px-4 py-3 font-semibold">Propriétaire</th>
                  <th className="text-left px-4 py-3 font-semibold">Catégorie</th>
                  <th className="text-left px-4 py-3 font-semibold">Statut</th>
                  <th className="text-right px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className={`px-4 py-10 text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Aucune boutique.
                    </td>
                  </tr>
                ) : (
                  filtered.map((s) => {
                    const status = (s.approvalStatus || 'pending') as ApprovalStatus;
                    return (
                      <tr key={String(s.slug)} className={isDark ? 'border-t border-gray-700' : 'border-t border-gray-200'}>
                        <td className="px-4 py-3">
                          <div className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{s.name || 'Boutique'}</div>
                          <div className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-xs break-all`}>{s.slug}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className={`${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{s.ownerName || '—'}</div>
                          <div className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-xs break-all`}>{s.ownerEmail || '—'}</div>
                        </td>
                        <td className={`px-4 py-3 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{s.category || 'general'}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${statusBadge(status, isDark)}`}>
                            {status === 'approved' ? 'Approuvée' : status === 'rejected' ? 'Rejetée' : 'En attente'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => window.open(`/shop/${encodeURIComponent(String(s.slug))}`, '_blank', 'noopener,noreferrer')}
                              className={`${isDark ? 'bg-gray-900 border border-gray-700 text-gray-200 hover:bg-gray-800' : 'bg-white border border-gray-200 text-gray-900 hover:bg-gray-50'} px-3 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-2`}
                              title="Ouvrir la boutique"
                            >
                              <ExternalLink className="w-4 h-4" />
                              Ouvrir
                            </button>
                            {status !== 'approved' && (
                              <button
                                type="button"
                                onClick={() => setApproval(String(s.slug), 'approved')}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-2"
                                title="Approuver"
                              >
                                <CheckCircle className="w-4 h-4" />
                                Approuver
                              </button>
                            )}
                            {status !== 'rejected' && (
                              <button
                                type="button"
                                onClick={() => setApproval(String(s.slug), 'rejected')}
                                className={`${isDark ? 'bg-gray-900 border border-gray-700 text-red-200 hover:bg-gray-800' : 'bg-white border border-gray-200 text-red-700 hover:bg-red-50'} px-3 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-2`}
                                title="Rejeter"
                              >
                                <XCircle className="w-4 h-4" />
                                Rejeter
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
