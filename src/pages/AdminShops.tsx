import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ExternalLink, Search, FileText, X } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { supabase, supabaseConfig } from '../config/supabase';
import { toast } from 'sonner';

type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

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
  suspendedAt?: string;
  suspendedBy?: string;
  billingCountry?: 'sn' | 'ci' | 'cm';
  billingLegalName?: string;
  billingRegistrationId?: string;
  billingTaxId?: string;
  billingAddress?: string;
  billingPhone?: string;
  source?: string;
  sourceVendorId?: string | number;
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

const safeParseJson = (raw: string | null, fallback: any) => {
  try {
    const parsed = raw ? JSON.parse(raw) : fallback;
    return parsed;
  } catch {
    return fallback;
  }
};

const readLocalPlusVendors = (): any[] => {
  const legacy = safeParseJson(localStorage.getItem('mangoo_vendors'), []);
  const custom = safeParseJson(localStorage.getItem('mangoo_custom_vendors'), []);
  const list = [...(Array.isArray(legacy) ? legacy : []), ...(Array.isArray(custom) ? custom : [])];
  const byId = new Map<string, any>();
  list.forEach((v) => {
    const id = v?.id;
    if (id === undefined || id === null) return;
    const k = String(id);
    if (!byId.has(k)) byId.set(k, v);
  });
  return Array.from(byId.values());
};

const isLocalPlusProvider = (v: any) => {
  const kind = String(v?.kind || '').trim().toLowerCase();
  if (kind === 'service') return true;
  if (String(v?.trade || '').trim()) return true;
  if (Array.isArray(v?.coverage) && v.coverage.length) return true;
  const cat = String(v?.category || '').toLowerCase();
  if (cat.includes('service') || cat.includes('métier') || cat.includes('metier')) return true;
  return false;
};

const normalizeApprovalStatus = (raw: any): ApprovalStatus => {
  const s = String(raw || '').trim().toLowerCase();
  if (s === 'approved' || s === 'rejected' || s === 'pending' || s === 'suspended') return s as ApprovalStatus;
  return 'pending';
};

const slugify = (value: any) => {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
};

const ensureUniqueSlug = (base: string, existing: Set<string>, suffix: string) => {
  let slug = base;
  if (!slug) slug = `boutique-${suffix}`;
  if (!existing.has(slug)) return slug;
  const alt = `${slug}-${suffix}`;
  if (!existing.has(alt)) return alt;
  return `${slug}-${Date.now()}`;
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
  if (status === 'suspended') return isDark ? 'bg-gray-900/40 text-gray-200 border border-gray-700' : 'bg-gray-100 text-gray-800 border border-gray-300';
  return isDark ? 'bg-amber-900/30 text-amber-200 border border-amber-700' : 'bg-amber-50 text-amber-800 border border-amber-200';
};

export default function AdminShops() {
  const { isDark } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | ApprovalStatus>('all');
  const [shops, setShops] = useState<DemoShop[]>([]);

  const canUseSupabase = useMemo(() => Boolean(supabaseConfig?.hasUrl && supabaseConfig?.hasAnonKey), [])

  const canTryLocalSync = true

  const [billingOpen, setBillingOpen] = useState(false);
  const [billingSlug, setBillingSlug] = useState<string | null>(null);
  const [billingForm, setBillingForm] = useState({
    billingCountry: 'ci',
    billingLegalName: '',
    billingRegistrationId: '',
    billingTaxId: '',
    billingAddress: '',
    billingPhone: '',
  });

  const refresh = useCallback(() => {
    void (async () => {
      try {
        const res = await fetch('/api/shops-list')
        const json = await res.json().catch(() => null as any)
        if (res.ok && json?.success && Array.isArray(json?.shops)) {
          const mapped: DemoShop[] = (json.shops as any[])
            .map((s: any) => {
              const slug = String(s?.slug || '').trim()
              if (!slug) return null
              const statusRaw = String(s?.status || 'pending').trim().toLowerCase()
              const approvalStatus: ApprovalStatus = (statusRaw === 'approved' || statusRaw === 'rejected' || statusRaw === 'suspended') ? (statusRaw as any) : 'pending'
              return {
                id: String(s?.id || slug),
                name: String(s?.name || 'Boutique'),
                slug,
                category: String(s?.category || 'general'),
                ownerName: String(s?.owner_name || ''),
                ownerEmail: String(s?.owner_email || s?.email || ''),
                approvalStatus,
                createdAt: String(s?.created_at || ''),
                updatedAt: String(s?.updated_at || ''),
                source: 'supabase',
              } as DemoShop
            })
            .filter(Boolean) as DemoShop[]
          if (mapped.length) {
            setShops(mapped)
            return
          }
        }
      } catch {
      }

      let supabaseMapped: DemoShop[] = []
      if (canUseSupabase) {
        try {
          const { data, error } = await supabase
            .from('shops')
            .select('*')
            .order('created_at', { ascending: false })

          if (error || !Array.isArray(data)) {
            supabaseMapped = []
          } else {
            supabaseMapped = data
              .map((s: any) => {
                const slug = String(s?.slug || '').trim()
                if (!slug) return null
                const statusRaw = String(s?.status || 'pending').trim().toLowerCase()
                const approvalStatus: ApprovalStatus = (statusRaw === 'approved' || statusRaw === 'rejected' || statusRaw === 'suspended') ? (statusRaw as any) : 'pending'
                return {
                  id: String(s?.id || slug),
                  name: String(s?.name || 'Boutique'),
                  slug,
                  category: String(s?.category || 'general'),
                  ownerName: String(s?.owner_name || s?.ownerName || ''),
                  ownerEmail: String(s?.owner_email || s?.ownerEmail || s?.email || ''),
                  approvalStatus,
                  approvedAt: String(s?.approved_at || s?.approvedAt || ''),
                  approvedBy: String(s?.approved_by || s?.approvedBy || ''),
                  rejectedAt: String(s?.rejected_at || s?.rejectedAt || ''),
                  rejectedBy: String(s?.rejected_by || s?.rejectedBy || ''),
                  suspendedAt: String(s?.suspended_at || s?.suspendedAt || ''),
                  suspendedBy: String(s?.suspended_by || s?.suspendedBy || ''),
                  createdAt: String(s?.created_at || s?.createdAt || ''),
                  updatedAt: String(s?.updated_at || s?.updatedAt || ''),
                  shopUrl: String(s?.shop_url || s?.shopUrl || ''),
                  source: 'supabase',
                } as DemoShop
              })
              .filter(Boolean) as DemoShop[]
          }
        } catch {
          supabaseMapped = []
        }
      }

    const now = new Date().toISOString();
    const current = readDemoShops();
    let didMigrate = false;
    const migrated = current.map((s) => {
      if (!s?.slug) return s;
      if (s.approvalStatus) return s;
      didMigrate = true;
      return { ...s, approvalStatus: 'pending', updatedAt: s.updatedAt || now };
    });

    const vendors = readLocalPlusVendors();
    const shopVendors = vendors.filter((v) => !isLocalPlusProvider(v));

    const existingSlugs = new Set(migrated.map((s) => String(s?.slug || '')).filter(Boolean));
    const bySourceId = new Map<string, DemoShop>();
    migrated.forEach((s) => {
      const sid = (s as any)?.sourceVendorId;
      if (sid !== undefined && sid !== null) bySourceId.set(String(sid), s);
    });

    let merged = migrated.slice();
    let didMerge = false;

    shopVendors.forEach((v) => {
      const id = v?.id;
      if (id === undefined || id === null) return;
      const sid = String(id);
      const name = String(v?.name || '').trim() || 'Boutique';
      const base = String(v?.slug || '').trim() || slugify(name);
      const slug = bySourceId.has(sid)
        ? String(bySourceId.get(sid)?.slug || base)
        : ensureUniqueSlug(base, existingSlugs, sid);

      const currentShop = bySourceId.get(sid);
      const approvalStatus = currentShop?.approvalStatus
        ? normalizeApprovalStatus(currentShop.approvalStatus)
        : normalizeApprovalStatus(v?.approvalStatus);

      const nextShop: DemoShop = {
        ...(currentShop || {}),
        id: String(currentShop?.id || `shop-${sid}`),
        name,
        slug,
        category: String(v?.category || currentShop?.category || '').trim() || 'general',
        ownerName: String(v?.ownerName || currentShop?.ownerName || ''),
        ownerEmail: String(v?.ownerEmail || currentShop?.ownerEmail || ''),
        approvalStatus,
        source: 'localplus',
        sourceVendorId: id,
        updatedAt: String(v?.updatedAt || currentShop?.updatedAt || now),
      };

      if (currentShop) {
        const idx = merged.findIndex((s) => String((s as any)?.sourceVendorId || '') === sid);
        if (idx >= 0) {
          merged[idx] = nextShop;
          didMerge = true;
          return;
        }
      }

      merged.push({ ...nextShop, createdAt: String(v?.createdAt || now) });
      existingSlugs.add(slug);
      didMerge = true;
    });

    if (canTryLocalSync) {
      try {
        const res = await fetch('/api/local-sync/shops')
        const data = await res.json().catch(() => ({} as any))
        const list = Array.isArray((data as any)?.shops) ? (data as any).shops : []
        if (list.length) {
          const bySlug = new Map<string, DemoShop>()
          merged.forEach((s) => {
            const slug = String(s?.slug || '').trim()
            if (slug) bySlug.set(slug, s)
          })
          list.forEach((s: any) => {
            const slug = String(s?.slug || '').trim()
            if (!slug) return
            const statusRaw = String(s?.status || 'pending').trim().toLowerCase()
            const approvalStatus: ApprovalStatus = (statusRaw === 'approved' || statusRaw === 'rejected') ? (statusRaw as any) : 'pending'
            const nextShop: DemoShop = {
              ...(bySlug.get(slug) || {}),
              id: String(s?.id || slug),
              name: String(s?.name || 'Boutique'),
              slug,
              category: String(s?.category || 'general'),
              ownerName: '',
              ownerEmail: '',
              approvalStatus,
              source: 'local-sync',
              updatedAt: String(s?.updatedAt || s?.updated_at || now),
              createdAt: String(s?.createdAt || s?.created_at || now),
            }
            bySlug.set(slug, nextShop)
          })
          merged = Array.from(bySlug.values())
          didMerge = true
        }
      } catch {
      }
    }

    if (supabaseMapped.length) {
      const bySlug = new Map<string, DemoShop>()
      merged.forEach((s) => {
        const slug = String(s?.slug || '').trim()
        if (slug) bySlug.set(slug, s)
      })
      supabaseMapped.forEach((s) => {
        const slug = String(s?.slug || '').trim()
        if (!slug) return
        const prev = bySlug.get(slug) || {}
        bySlug.set(slug, { ...prev, ...s, source: 'supabase' })
      })
      merged = Array.from(bySlug.values())
      didMerge = true
    }

    if (didMigrate || didMerge) writeDemoShops(merged);
    const next = merged.map(normalizeStatus).filter((s) => s.slug);
    setShops(next);
    })()
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

  const setApproval = useCallback(async (slug: string, status: ApprovalStatus) => {
    if (canUseSupabase) {
      setShops((prev) => prev.map((s) => {
        if (String(s?.slug || '') !== slug) return s
        const now0 = new Date().toISOString()
        if (status === 'approved') return { ...s, approvalStatus: 'approved', approvedAt: now0, approvedBy: ADMIN_EMAIL, updatedAt: now0 }
        if (status === 'rejected') return { ...s, approvalStatus: 'rejected', rejectedAt: now0, rejectedBy: ADMIN_EMAIL, updatedAt: now0 }
        if (status === 'suspended') return { ...s, approvalStatus: 'suspended', suspendedAt: now0, suspendedBy: ADMIN_EMAIL, updatedAt: now0 }
        return { ...s, approvalStatus: 'pending', updatedAt: now0 }
      }))
      try {
        const now = new Date().toISOString()
        const updateBase: any = { status, updated_at: now }
        const updateWithMeta: any = { ...updateBase }
        if (status === 'approved') {
          updateWithMeta.approved_at = now
          updateWithMeta.approved_by = ADMIN_EMAIL
        }
        if (status === 'rejected') {
          updateWithMeta.rejected_at = now
          updateWithMeta.rejected_by = ADMIN_EMAIL
        }
        if (status === 'suspended') {
          updateWithMeta.suspended_at = now
          updateWithMeta.suspended_by = ADMIN_EMAIL
        }

        const attempt = async (payload: any) => {
          return await supabase
            .from('shops')
            .update(payload)
            .eq('slug', slug)
        }

        const r1 = await attempt(updateWithMeta)
        if (r1.error) {
          const msg = String(r1.error.message || '')
          const isMissingColumn = msg.toLowerCase().includes("could not find") && msg.toLowerCase().includes('column')
          if (isMissingColumn) {
            const r2 = await attempt(updateBase)
            if (r2.error) {
              const msg2 = String(r2.error.message || '')
              const isMissingColumn2 = msg2.toLowerCase().includes("could not find") && msg2.toLowerCase().includes('column')
              if (isMissingColumn2) {
                const r3 = await attempt({ status })
                if (r3.error) {
                  toast.error(`Impossible de mettre à jour (Supabase): ${r3.error.message}`)
                  refresh()
                  return
                }
                toast.success('Statut mis à jour')
                refresh()
                return
              }
              toast.error(`Impossible de mettre à jour (Supabase): ${r2.error.message}`)
              refresh()
              return
            }

            toast.success('Statut mis à jour')
            refresh()
            return
          }

          toast.error(`Impossible de mettre à jour (Supabase): ${r1.error.message}`)
          refresh()
          return
        }

        toast.success('Statut mis à jour')
        refresh()
      } catch {
        toast.error('Erreur lors de la mise à jour')
        refresh()
      }
      return
    }

    const now = new Date().toISOString();
    const current = readDemoShops();
    const target = current.find((s) => String(s?.slug || '') === slug) as any;
    const sourceVendorId = target?.sourceVendorId;
    const next = current.map((s) => {
      if (s?.slug !== slug) return s;
      if (status === 'approved') {
        return { ...s, approvalStatus: 'approved', approvedAt: now, approvedBy: ADMIN_EMAIL };
      }
      if (status === 'rejected') {
        return { ...s, approvalStatus: 'rejected', rejectedAt: now, rejectedBy: ADMIN_EMAIL };
      }
      if (status === 'suspended') {
        return { ...s, approvalStatus: 'suspended', suspendedAt: now, suspendedBy: ADMIN_EMAIL };
      }
      return { ...s, approvalStatus: 'pending' };
    });
    writeDemoShops(next);
    setShops(next.map(normalizeStatus).filter((s) => s.slug));

    try {
      const changed = next.find((s) => String(s?.slug || '') === slug) as any
      const isLocalSyncShop = String(changed?.source || '') === 'local-sync' || String(changed?.id || '').startsWith('s_')
      if (isLocalSyncShop && changed?.id) {
        const mapped = status === 'approved' || status === 'rejected' ? status : 'pending'
        await fetch(`/api/local-sync/admin/shops/${encodeURIComponent(String(changed.id))}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: mapped }),
        })
        refresh()
      }
    } catch {
    }

    if (sourceVendorId !== undefined && sourceVendorId !== null) {
      const sid = String(sourceVendorId);
      const applyToKey = (key: string) => {
        const list = safeParseJson(localStorage.getItem(key), []);
        if (!Array.isArray(list) || !list.length) return false;
        let changed = false;
        const updated = list.map((v: any) => {
          if (String(v?.id || '') !== sid) return v;
          changed = true;
          return { ...v, approvalStatus: status, updatedAt: now };
        });
        if (!changed) return false;
        try {
          localStorage.setItem(key, JSON.stringify(updated));
          return true;
        } catch {
          return false;
        }
      };
      applyToKey('mangoo_vendors');
      applyToKey('mangoo_custom_vendors');
    }
  }, [refresh]);

  const openBilling = useCallback((shop: DemoShop) => {
    const slug = String(shop?.slug || '').trim();
    if (!slug) return;
    setBillingSlug(slug);
    setBillingForm({
      billingCountry: (shop?.billingCountry === 'sn' || shop?.billingCountry === 'cm') ? shop.billingCountry : 'ci',
      billingLegalName: String(shop?.billingLegalName || shop?.name || ''),
      billingRegistrationId: String(shop?.billingRegistrationId || ''),
      billingTaxId: String(shop?.billingTaxId || ''),
      billingAddress: String(shop?.billingAddress || ''),
      billingPhone: String(shop?.billingPhone || ''),
    });
    setBillingOpen(true);
  }, []);

  const saveBilling = useCallback(() => {
    if (!billingSlug) return;
    const now = new Date().toISOString();
    const current = readDemoShops();
    const next = current.map((s) => {
      if (String(s?.slug || '') !== billingSlug) return s;
      return {
        ...s,
        updatedAt: now,
        billingCountry: (billingForm.billingCountry === 'sn' || billingForm.billingCountry === 'cm') ? billingForm.billingCountry : 'ci',
        billingLegalName: String(billingForm.billingLegalName || ''),
        billingRegistrationId: String(billingForm.billingRegistrationId || ''),
        billingTaxId: String(billingForm.billingTaxId || ''),
        billingAddress: String(billingForm.billingAddress || ''),
        billingPhone: String(billingForm.billingPhone || ''),
      };
    });
    writeDemoShops(next);
    setBillingOpen(false);
    setBillingSlug(null);
  }, [billingForm, billingSlug]);

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
        const score = (st: ApprovalStatus) => (st === 'pending' ? 0 : st === 'approved' ? 1 : st === 'suspended' ? 2 : 3);
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
            <button
              type="button"
              onClick={() => setFilterStatus('suspended')}
              className={`px-3 py-2 rounded-lg text-sm font-semibold border ${filterStatus === 'suspended' ? (isDark ? 'bg-gray-900/40 text-gray-100 border-gray-700' : 'bg-gray-100 text-gray-900 border-gray-300') : (isDark ? 'bg-gray-900 text-gray-300 border-gray-700 hover:bg-gray-800' : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-white')}`}
            >
              Suspendues
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

          <div className="md:hidden">
            {filtered.length === 0 ? (
              <div className={`px-4 py-10 text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Aucune boutique.</div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {filtered.map((s) => {
                  const status = (s.approvalStatus || 'pending') as ApprovalStatus;
                  return (
                    <div key={String(s.slug)} className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{s.name || 'Boutique'}</div>
                          <div className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-xs break-all`}>{s.slug}</div>
                          <div className={`${isDark ? 'text-gray-300' : 'text-gray-700'} text-sm mt-1`}>{s.category || 'general'}</div>
                          <div className="mt-2">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${statusBadge(status, isDark)}`}>
                              {status === 'approved' ? 'Approuvée' : status === 'rejected' ? 'Rejetée' : status === 'suspended' ? 'Suspendue' : 'En attente'}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => void setApproval(String(s.slug), 'approved')}
                            disabled={status === 'approved'}
                            className="touch-manipulation px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold text-sm"
                          >
                            Approuver
                          </button>
                          <button
                            type="button"
                            onClick={() => void setApproval(String(s.slug), 'rejected')}
                            disabled={status === 'rejected'}
                            className="touch-manipulation px-3 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white font-bold text-sm"
                          >
                            Rejeter
                          </button>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => openBilling(s)}
                          className={`touch-manipulation ${isDark ? 'bg-gray-900 border border-gray-700 text-gray-200 hover:bg-gray-800' : 'bg-white border border-gray-200 text-gray-900 hover:bg-gray-50'} px-3 py-2 rounded-lg text-sm font-semibold inline-flex items-center gap-2`}
                        >
                          <FileText className="w-4 h-4" />
                          Facturation
                        </button>
                        <button
                          type="button"
                          onClick={() => window.open(`/shop/${encodeURIComponent(String(s.slug))}`, '_blank', 'noopener,noreferrer')}
                          className={`touch-manipulation ${isDark ? 'bg-gray-900 border border-gray-700 text-gray-200 hover:bg-gray-800' : 'bg-white border border-gray-200 text-gray-900 hover:bg-gray-50'} px-3 py-2 rounded-lg text-sm font-semibold inline-flex items-center gap-2`}
                        >
                          <ExternalLink className="w-4 h-4" />
                          Ouvrir
                        </button>
                        <button
                          type="button"
                          onClick={() => void setApproval(String(s.slug), 'pending')}
                          disabled={status === 'pending'}
                          className="touch-manipulation px-3 py-2 rounded-lg bg-gray-700 hover:bg-gray-800 disabled:opacity-60 text-white font-bold text-sm"
                        >
                          En attente
                        </button>
                        <button
                          type="button"
                          onClick={() => void setApproval(String(s.slug), 'suspended')}
                          disabled={status === 'suspended'}
                          className="touch-manipulation px-3 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white font-bold text-sm"
                        >
                          Suspendre
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="hidden md:block overflow-x-auto">
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
                            {status === 'approved' ? 'Approuvée' : status === 'rejected' ? 'Rejetée' : status === 'suspended' ? 'Suspendue' : 'En attente'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openBilling(s)}
                              className={`${isDark ? 'bg-gray-900 border border-gray-700 text-gray-200 hover:bg-gray-800' : 'bg-white border border-gray-200 text-gray-900 hover:bg-gray-50'} px-3 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-2`}
                              title="Configurer les informations de facturation"
                            >
                              <FileText className="w-4 h-4" />
                              Facturation
                            </button>
                            <button
                              type="button"
                              onClick={() => window.open(`/shop/${encodeURIComponent(String(s.slug))}`, '_blank', 'noopener,noreferrer')}
                              className={`${isDark ? 'bg-gray-900 border border-gray-700 text-gray-200 hover:bg-gray-800' : 'bg-white border border-gray-200 text-gray-900 hover:bg-gray-50'} px-3 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-2`}
                              title="Ouvrir la boutique"
                            >
                              <ExternalLink className="w-4 h-4" />
                              Ouvrir
                            </button>
                            <button
                              type="button"
                              onClick={() => void setApproval(String(s.slug), 'approved')}
                              disabled={status === 'approved'}
                              className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold text-xs"
                              title="Approuver"
                            >
                              Approuver
                            </button>
                            <button
                              type="button"
                              onClick={() => void setApproval(String(s.slug), 'rejected')}
                              disabled={status === 'rejected'}
                              className="px-3 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white font-bold text-xs"
                              title="Rejeter"
                            >
                              Rejeter
                            </button>
                            <button
                              type="button"
                              onClick={() => void setApproval(String(s.slug), 'pending')}
                              disabled={status === 'pending'}
                              className="px-3 py-2 rounded-lg bg-gray-700 hover:bg-gray-800 disabled:opacity-60 text-white font-bold text-xs"
                              title="Mettre en attente"
                            >
                              En attente
                            </button>
                            <button
                              type="button"
                              onClick={() => void setApproval(String(s.slug), 'suspended')}
                              disabled={status === 'suspended'}
                              className="px-3 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white font-bold text-xs"
                              title="Suspendre"
                            >
                              Suspendre
                            </button>
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

      {billingOpen && (
        <div className="fixed inset-0 z-[1000] bg-black/60 p-4 overflow-y-auto">
          <div className="min-h-[calc(100vh-2rem)] flex items-start justify-center">
            <div className={`w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden max-h-[calc(100vh-2rem)] flex flex-col ${isDark ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'}`}>
              <div className={`px-5 py-4 border-b flex items-center justify-between shrink-0 ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
                <div>
                  <div className="text-lg font-black">Facturation boutique</div>
                  <div className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{billingSlug}</div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setBillingOpen(false);
                    setBillingSlug(null);
                  }}
                  className={`${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'} p-2 rounded-xl`}
                  title="Fermer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 overflow-y-auto space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <div className={`text-xs font-black ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Pays</div>
                    <select
                      value={billingForm.billingCountry}
                      onChange={(e) => setBillingForm((p) => ({ ...p, billingCountry: e.target.value }))}
                      className={`mt-2 w-full px-3 py-2 rounded-xl border ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'}`}
                    >
                      <option value="sn">Sénégal</option>
                      <option value="ci">Côte d’Ivoire</option>
                      <option value="cm">Cameroun</option>
                    </select>
                  </div>
                  <div>
                    <div className={`text-xs font-black ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Raison sociale</div>
                    <input
                      value={billingForm.billingLegalName}
                      onChange={(e) => setBillingForm((p) => ({ ...p, billingLegalName: e.target.value }))}
                      className={`mt-2 w-full px-3 py-2 rounded-xl border ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'}`}
                      placeholder="Nom légal de l’entreprise"
                    />
                  </div>
                  <div>
                    <div className={`text-xs font-black ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>RCCM / Registre</div>
                    <input
                      value={billingForm.billingRegistrationId}
                      onChange={(e) => setBillingForm((p) => ({ ...p, billingRegistrationId: e.target.value }))}
                      className={`mt-2 w-full px-3 py-2 rounded-xl border ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'}`}
                      placeholder="RCCM"
                    />
                  </div>
                  <div>
                    <div className={`text-xs font-black ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>NINEA / NIU / NIF</div>
                    <input
                      value={billingForm.billingTaxId}
                      onChange={(e) => setBillingForm((p) => ({ ...p, billingTaxId: e.target.value }))}
                      className={`mt-2 w-full px-3 py-2 rounded-xl border ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'}`}
                      placeholder="Identifiant fiscal"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <div className={`text-xs font-black ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Adresse</div>
                    <input
                      value={billingForm.billingAddress}
                      onChange={(e) => setBillingForm((p) => ({ ...p, billingAddress: e.target.value }))}
                      className={`mt-2 w-full px-3 py-2 rounded-xl border ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'}`}
                      placeholder="Ville, quartier, rue"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <div className={`text-xs font-black ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Téléphone</div>
                    <input
                      value={billingForm.billingPhone}
                      onChange={(e) => setBillingForm((p) => ({ ...p, billingPhone: e.target.value }))}
                      className={`mt-2 w-full px-3 py-2 rounded-xl border ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'}`}
                      placeholder="+221..."
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setBillingOpen(false);
                      setBillingSlug(null);
                    }}
                    className={`${isDark ? 'bg-gray-800 hover:bg-gray-700 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'} px-4 py-2 rounded-xl font-black`}
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={saveBilling}
                    className="bg-gradient-to-r from-orange-500 to-green-600 text-white px-4 py-2 rounded-xl font-black hover:from-orange-600 hover:to-green-700"
                  >
                    Enregistrer
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
