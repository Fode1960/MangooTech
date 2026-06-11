import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useThemeStore } from '../stores/themeStore';
import { supabase } from '../config/supabase';

function safeParseJson(raw, fallback) {
  try {
    const parsed = raw ? JSON.parse(raw) : fallback;
    return parsed;
  } catch {
    return fallback;
  }
}

function formatMoneyXof(amount) {
  const n = Number(amount || 0);
  if (!Number.isFinite(n)) return '0 FCFA';
  return `${Math.round(n).toLocaleString('fr-FR')} FCFA`;
}

function formatDateTime(raw) {
  const d = raw ? new Date(raw) : null;
  if (!d || Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('fr-FR');
}

function invoiceNumberFromPayment(p) {
  const paidAt = p?.paidAt ? new Date(p.paidAt) : null;
  const y = paidAt && !Number.isNaN(paidAt.getTime()) ? paidAt.getFullYear() : new Date().getFullYear();
  const m = paidAt && !Number.isNaN(paidAt.getTime()) ? String(paidAt.getMonth() + 1).padStart(2, '0') : '01';
  const d = paidAt && !Number.isNaN(paidAt.getTime()) ? String(paidAt.getDate()).padStart(2, '0') : '01';
  const suffix = String(p?.id || p?.provider || Date.now()).slice(-6).replace(/[^a-zA-Z0-9]/g, '').padStart(6, '0');
  return `INV-${y}${m}${d}-${suffix}`;
}

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizeName(value) {
  return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function isServiceLike(vendor) {
  const rawKind = String(vendor?.kind || '').trim().toLowerCase();
  if (rawKind === 'service' || rawKind === 'provider') return true;
  if (String(vendor?.trade || '').trim()) return true;
  if (Array.isArray(vendor?.services) && vendor.services.length > 0) return true;
  const category = String(vendor?.category || '').trim().toLowerCase();
  return category.includes('service') || category.includes('prestataire') || category.includes('métier') || category.includes('metier');
}

function downloadTextFile(filename, content, mime) {
  const blob = new Blob([content], { type: mime || 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function csvEscape(value) {
  const s = String(value ?? '');
  if (/[",\n\r;]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function getLocalPinForVendorId(vendorId) {
  try {
    const m = safeParseJson(localStorage.getItem('mangoo_local_pin_map'), {});
    const id = String(vendorId || '').trim();
    if (!id) return '';
    if (!m || typeof m !== 'object') return '';
    for (const [pin, mapped] of Object.entries(m)) {
      if (String(mapped) === id) return String(pin || '');
    }
  } catch {
  }
  return '';
}

function reserveUniqueLocalPin(vendorId) {
  const key = 'mangoo_local_pin_map';
  const id = String(vendorId || '').trim();
  if (!id) return '';
  const m = safeParseJson(localStorage.getItem(key), {});
  const exists = (pin) => Object.prototype.hasOwnProperty.call(m, String(pin));
  let tries = 0;
  while (tries < 80) {
    tries += 1;
    let pin = '';
    for (let i = 0; i < 4; i += 1) pin += String(Math.floor(Math.random() * 10));
    if (pin.replace(/0/g, '').length < 1) continue;
    if (exists(pin)) continue;
    m[String(pin)] = id;
    localStorage.setItem(key, JSON.stringify(m));
    return pin;
  }
  const fallback = String(Date.now()).slice(-4);
  m[fallback] = id;
  localStorage.setItem(key, JSON.stringify(m));
  return fallback;
}

function setLocalPinForVendorId(vendorId, nextPin) {
  const key = 'mangoo_local_pin_map';
  const id = String(vendorId || '').trim();
  const pin = String(nextPin || '').trim();
  if (!id || !pin) return false;
  try {
    const m = safeParseJson(localStorage.getItem(key), {});
    for (const [p, mapped] of Object.entries(m || {})) {
      if (String(mapped) === id) delete m[p];
    }
    m[pin] = id;
    localStorage.setItem(key, JSON.stringify(m));
    return true;
  } catch {
    return false;
  }
}

export default function ProviderDashboard() {
  const { isDark } = useThemeStore();
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState('overview');
  const [providerProfile, setProviderProfile] = useState(null);
  const [remoteProviders, setRemoteProviders] = useState([]);
  const [localVersion, setLocalVersion] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const userSelectedRef = useRef(false);

  const returnTo = String(searchParams.get('return') || '').trim();
  const vendorIdFromQuery = String(searchParams.get('vendorId') || '').trim();

  const [selectedProviderId, setSelectedProviderId] = useState(() => {
    if (vendorIdFromQuery) return vendorIdFromQuery;
    return '';
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data: auth } = await supabase.auth.getUser();
        const userId = auth?.user?.id;
        if (!userId) return;
        const { data } = await supabase
          .from('providers')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();
        if (!cancelled) setProviderProfile(data || null);
      } catch {
        if (!cancelled) setProviderProfile(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const accessToken = String(sessionData?.session?.access_token || '').trim();
        const authEmail = normalizeEmail(sessionData?.session?.user?.email);
        const authUserId = String(sessionData?.session?.user?.id || '').trim();
        if (!accessToken || (!authEmail && !authUserId)) {
          if (!cancelled) setRemoteProviders([]);
          return;
        }
        const res = await fetch('/api/local-sync/localplus/vendors', {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        const parsed = await res.json().catch(() => null);
        const list = Array.isArray(parsed?.vendors) ? parsed.vendors : [];
        const owned = list
          .filter((vendor) => isServiceLike(vendor))
          .filter((vendor) => {
            const ownerEmail = normalizeEmail(vendor?.ownerEmail);
            const ownerUserId = String(vendor?.userId || vendor?.user_id || '').trim();
            return (authEmail && ownerEmail === authEmail) || (authUserId && ownerUserId === authUserId);
          })
          .map((vendor) => ({
            id: String(vendor?.id || ''),
            name: String(vendor?.name || '').trim() || 'Prestataire',
            trade: String(vendor?.trade || '').trim(),
            isMobile: Boolean(vendor?.isMobile),
            coverage: Array.isArray(vendor?.coverage) ? vendor.coverage.filter(Boolean) : [],
            phone: String(vendor?.phone || '').trim(),
            city: String(vendor?.city || '').trim(),
            country: String(vendor?.country || '').trim(),
            services: Array.isArray(vendor?.services) ? vendor.services.filter(Boolean) : [],
            portfolio: Array.isArray(vendor?.portfolio) ? vendor.portfolio.filter(Boolean) : [],
            localPin: String(vendor?.localPin || '').trim(),
            raw: vendor
          }));
        if (!cancelled) setRemoteProviders(owned);
      } catch {
        if (!cancelled) setRemoteProviders([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [localVersion]);

  useEffect(() => {
    if (vendorIdFromQuery) return;
    const fromRemote = String(remoteProviders?.[0]?.id || '').trim();
    const profileName = normalizeName(providerProfile?.name);
    const fromProfileMatch = profileName
      ? String(remoteProviders.find((p) => normalizeName(p?.name) === profileName)?.id || '').trim()
      : '';
    const next = fromProfileMatch || fromRemote;
    if (!next) return;
    setSelectedProviderId((prev) => prev || next);
  }, [providerProfile?.name, remoteProviders, vendorIdFromQuery]);

  useEffect(() => {
    if (!showSettings) return;
    const onKey = (e) => {
      if (e?.key === 'Escape') setShowSettings(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showSettings]);

  const currentUser = useMemo(() => {
    return safeParseJson(localStorage.getItem('mangoo-current-user') || localStorage.getItem('user'), null);
  }, []);

  const email = normalizeEmail(currentUser?.email);
  const isAdmin = useMemo(() => {
    const role = String(currentUser?.role || '').trim().toLowerCase()
    if (role === 'admin') return true
    const roles = Array.isArray(currentUser?.roles) ? currentUser.roles.map((x) => String(x || '').trim().toLowerCase()).filter(Boolean) : []
    return roles.includes('admin')
  }, [currentUser?.role, currentUser?.roles]);

  const allProviders = useMemo(() => {
    if (!isAdmin && !vendorIdFromQuery && Array.isArray(remoteProviders) && remoteProviders.length) {
      return remoteProviders;
    }
    const legacy = safeParseJson(localStorage.getItem('mangoo_vendors'), []);
    const custom = safeParseJson(localStorage.getItem('mangoo_custom_vendors'), []);
    const list = [
      ...(Array.isArray(legacy) ? legacy : []),
      ...(Array.isArray(custom) ? custom : []),
      ...(Array.isArray(remoteProviders) ? remoteProviders.map((item) => item?.raw || item) : [])
    ];

    const allowedIds = (() => {
      if (email) {
        const raw = localStorage.getItem(`mangoo_my_provider_ids:${email}`);
        const parsed = safeParseJson(raw, []);
        if (Array.isArray(parsed) && parsed.length) return new Set(parsed.map((x) => String(x)));
      }
      const single = localStorage.getItem('mangoo_my_provider_id');
      return single ? new Set([String(single)]) : new Set();
    })();

    const providers = list
      .filter((v) => isServiceLike(v))
      .filter((v) => {
        if (isAdmin) return true;
        if (vendorIdFromQuery && String(v?.id) === String(vendorIdFromQuery)) return true;
        if (email && normalizeEmail(v?.ownerEmail) === email) return true;
        if (allowedIds.size && allowedIds.has(String(v?.id))) return true;
        return false;
      })
      .map((v) => ({
        id: String(v?.id),
        name: String(v?.name || '').trim() || 'Prestataire',
        trade: String(v?.trade || '').trim(),
        isMobile: !!v?.isMobile,
        coverage: Array.isArray(v?.coverage) ? v.coverage.filter(Boolean) : [],
        phone: String(v?.phone || '').trim(),
        city: String(v?.city || '').trim(),
        country: String(v?.country || '').trim(),
        services: Array.isArray(v?.services) ? v.services.filter(Boolean) : [],
        portfolio: Array.isArray(v?.portfolio) ? v.portfolio.filter(Boolean) : [],
        localPin: String(v?.localPin || '').trim(),
        raw: v
      }));

    const byId = new Map();
    const score = (p) => {
      let s = 0;
      if (String(p?.localPin || '').trim()) s += 100;
      if (String(p?.phone || '').trim()) s += 10;
      if (String(p?.trade || '').trim()) s += 3;
      if (Array.isArray(p?.services) && p.services.length) s += 2;
      if (Array.isArray(p?.portfolio) && p.portfolio.length) s += 1;
      return s;
    };
    providers.forEach((p) => {
      const prev = byId.get(p.id);
      if (!prev) {
        byId.set(p.id, p);
        return;
      }
      if (score(p) > score(prev)) byId.set(p.id, p);
    });
    return Array.from(byId.values());
  }, [email, isAdmin, localVersion, remoteProviders, vendorIdFromQuery]);

  useEffect(() => {
    if (isAdmin) return;
    if (vendorIdFromQuery) return;
    if (userSelectedRef.current) return;
    const profileName = normalizeName(providerProfile?.name);
    if (!profileName) return;
    const match = allProviders.find((p) => normalizeName(p?.name) === profileName) || null;
    if (!match?.id) return;
    setSelectedProviderId((prev) => {
      const prevId = String(prev || '').trim();
      if (!prevId) return String(match.id);
      const prevProvider = allProviders.find((p) => String(p?.id) === prevId) || null;
      const prevName = normalizeName(prevProvider?.name);
      if (prevName === profileName) return prevId;
      return String(match.id);
    });
  }, [allProviders, isAdmin, providerProfile?.name, vendorIdFromQuery]);

  const selectedProvider = useMemo(() => {
    return allProviders.find((p) => p.id === selectedProviderId) || null;
  }, [allProviders, selectedProviderId]);

  const selectedProviderPin = useMemo(() => {
    const direct = String(selectedProvider?.localPin || '').trim();
    if (direct) return direct;
    return getLocalPinForVendorId(selectedProviderId);
  }, [selectedProvider?.localPin, selectedProviderId]);

  const providerValidation = useMemo(() => {
    const rawStatus = String(providerProfile?.status || '').trim().toLowerCase();
    const isVisible = Boolean(providerProfile?.is_visible);

    if (!providerProfile) {
      return {
        badge: 'Aucune fiche envoyée',
        badgeClass: 'bg-orange-50 text-orange-700 border-orange-200',
        message: "Votre fiche n'est pas encore envoyée.",
        actionLabel: '📤 Envoyer ma fiche',
        actionClass: 'px-3 py-2 rounded-xl text-sm font-black bg-gradient-to-r from-orange-500 to-green-600 text-white',
      };
    }

    const isApproved = rawStatus === 'approved' || rawStatus === 'active' || rawStatus === 'validated';
    const needsChanges =
      rawStatus === 'rejected' ||
      rawStatus === 'changes_requested' ||
      rawStatus === 'needs_changes' ||
      rawStatus === 'to_fix';

    if (isApproved || isVisible) {
      return {
        badge: '✅ Fiche validée',
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        message: isVisible ? 'Votre fiche est visible.' : 'Votre fiche est validée.',
        actionLabel: '',
        actionClass: '',
      };
    }

    if (needsChanges) {
      return {
        badge: '✏️ Fiche à corriger',
        badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
        message: 'Quelques informations sont à corriger.',
        actionLabel: '✏️ Corriger ma fiche',
        actionClass: 'px-3 py-2 rounded-xl text-sm font-black border border-gray-200 bg-white hover:bg-gray-50 text-gray-900',
      };
    }

    return {
      badge: '⏳ En attente de validation',
      badgeClass: 'bg-sky-50 text-sky-700 border-sky-200',
      message: 'Votre fiche est en cours de vérification.',
      actionLabel: '',
      actionClass: '',
    };
  }, [providerProfile]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const pin = String(selectedProviderPin || '').trim();
        const id = String(selectedProviderId || '').trim();
        if (!pin || !id) return;
        const currentRemotePin = String(selectedProvider?.raw?.localPin || selectedProvider?.raw?.local_pin || '').trim();
        if (currentRemotePin === pin) return;
        const { data: sessionData } = await supabase.auth.getSession();
        const accessToken = String(sessionData?.session?.access_token || '').trim();
        const authEmail = normalizeEmail(sessionData?.session?.user?.email);
        const ownerEmail = authEmail || normalizeEmail(currentUser?.email);
        if (!ownerEmail) return;
        const raw = selectedProvider?.raw || {};
        const body = {
          ownerEmail,
          vendor: {
            id,
            kind: 'provider',
            approvalStatus: 'approved',
            name: String(raw?.name || selectedProvider?.name || '').trim(),
            category: String(raw?.category || '').trim(),
            status: String(raw?.status || '').trim(),
            lat: typeof raw?.lat === 'number' ? raw.lat : undefined,
            lng: typeof raw?.lng === 'number' ? raw.lng : undefined,
            trade: String(raw?.trade || selectedProvider?.trade || '').trim(),
            phone: String(raw?.phone || selectedProvider?.phone || '').trim(),
            city: String(raw?.city || '').trim(),
            country: String(raw?.country || '').trim(),
            services: Array.isArray(raw?.services) ? raw.services : [],
            coverage: Array.isArray(raw?.coverage) ? raw.coverage : [],
            portfolio: Array.isArray(raw?.portfolio) ? raw.portfolio : [],
            isMobile: Boolean(raw?.isMobile),
            localPin: pin,
            userId: String(sessionData?.session?.user?.id || raw?.userId || raw?.user_id || '').trim(),
          },
        };
        const res = await fetch('/api/local-sync/localplus/vendors', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
          body: JSON.stringify(body),
        }).catch(() => null);
        if (!cancelled && res && typeof res.ok === 'boolean' && res.ok) {
          setLocalVersion((v) => v + 1);
        }
      } catch {
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [currentUser?.email, selectedProvider?.name, selectedProvider?.phone, selectedProvider?.raw, selectedProvider?.trade, selectedProviderId, selectedProviderPin]);

  const payments = useMemo(() => {
    const raw = safeParseJson(localStorage.getItem('mangoo_service_payments'), []);
    const list = Array.isArray(raw) ? raw : [];
    const filtered = selectedProviderId
      ? list.filter((p) => String(p?.vendorId) === String(selectedProviderId))
      : list;
    return filtered.map((p) => ({
      id: String(p?.id || ''),
      requestId: String(p?.requestId || ''),
      vendorId: String(p?.vendorId || ''),
      vendorName: String(p?.vendorName || ''),
      userId: String(p?.userId || ''),
      amount: Number(p?.amount || 0),
      currency: String(p?.currency || 'XOF'),
      provider: String(p?.provider || ''),
      paidAt: String(p?.paidAt || ''),
    }));
  }, [selectedProviderId]);

  const [requestMetaVersion, setRequestMetaVersion] = useState(0);
  const requestMeta = useMemo(() => {
    const raw = safeParseJson(localStorage.getItem('mangoo_service_request_meta'), {});
    return raw && typeof raw === 'object' ? raw : {};
  }, [requestMetaVersion]);

  const setRequestMeta = useCallback((requestId, patch) => {
    try {
      const key = 'mangoo_service_request_meta';
      const raw = localStorage.getItem(key);
      const obj = safeParseJson(raw, {});
      const meta = obj && typeof obj === 'object' ? obj : {};
      const prev = meta[requestId] && typeof meta[requestId] === 'object' ? meta[requestId] : {};
      meta[requestId] = { ...prev, ...patch, updatedAt: new Date().toISOString() };
      localStorage.setItem(key, JSON.stringify(meta));
      setRequestMetaVersion((v) => v + 1);
    } catch {
    }
  }, []);

  const requests = useMemo(() => {
    const raw = safeParseJson(localStorage.getItem('mangoo_connect_requests'), []);
    const list = Array.isArray(raw) ? raw : [];
    const filtered = selectedProviderId
      ? list.filter((r) => String(r?.vendorId) === String(selectedProviderId))
      : list;
    return filtered.map((r) => ({
      requestId: `req:${String(r?.vendorId || '')}:${String(r?.ts || '')}`,
      ts: Number(r?.ts || 0),
      vendorId: String(r?.vendorId || ''),
      vendorName: String(r?.vendorName || ''),
      trade: String(r?.trade || ''),
      quartier: String(r?.quartier || ''),
      urgent: !!r?.urgent,
      devis: !!r?.devis,
      text: String(r?.text || ''),
    }));
  }, [selectedProviderId]);

  const goToServiceCheckout = useCallback((opts) => {
    const amountRaw = prompt('Montant de la prestation (FCFA) :', '5000');
    const cleaned = String(amountRaw || '').replace(/[^\d]/g, '');
    const amount = Number(cleaned);
    if (!Number.isFinite(amount) || amount <= 0) return;
    const params = new URLSearchParams({
      vendorId: String(selectedProviderId || ''),
      vendorName: String(selectedProvider?.name || ''),
      amount: String(amount),
      return: window.location.href,
      requestId: String(opts?.requestId || ''),
    });
    window.location.href = `/service-checkout?${params.toString()}`;
  }, [selectedProvider?.name, selectedProviderId]);

  const exportPaymentsCsv = useCallback(() => {
    const rows = payments.map((p) => [
      p.paidAt,
      p.userId,
      p.provider,
      p.amount,
      p.currency,
      p.vendorId,
      p.requestId,
    ]);
    const header = ['date', 'client', 'mode', 'montant', 'devise', 'prestataire_id', 'request_id'];
    const csv = [header, ...rows].map((r) => r.map(csvEscape).join(';')).join('\n');
    downloadTextFile(`paiements_${selectedProviderId || 'prestataire'}.csv`, csv, 'text/csv;charset=utf-8');
  }, [payments, selectedProviderId]);

  const exportRequestsCsv = useCallback(() => {
    const rows = requests.map((r) => {
      const meta = requestMeta[r.requestId] || {};
      const status = String(meta?.status || 'new');
      const paid = meta?.paid ? 'yes' : 'no';
      return [
        r.ts ? new Date(r.ts).toISOString() : '',
        r.devis ? 'devis' : 'message',
        r.urgent ? 'urgent' : 'normal',
        r.quartier,
        r.text,
        status,
        paid,
        r.requestId,
      ];
    });
    const header = ['date', 'type', 'priorite', 'quartier', 'message', 'status', 'paid', 'request_id'];
    const csv = [header, ...rows].map((r) => r.map(csvEscape).join(';')).join('\n');
    downloadTextFile(`prestations_${selectedProviderId || 'prestataire'}.csv`, csv, 'text/csv;charset=utf-8');
  }, [requestMeta, requests, selectedProviderId]);

  const exportPaymentsPdf = useCallback(() => {
    const providerLabel = selectedProvider?.name || selectedProviderId || 'Prestataire';
    const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Paiements ${providerLabel}</title>
<style>
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif;margin:0;padding:24px;color:#111827;}
.wrap{max-width:920px;margin:0 auto;}
.title{font-size:20px;font-weight:900;margin:0;}
.muted{color:#6b7280;margin-top:6px;}
table{width:100%;border-collapse:collapse;margin-top:14px;}
th,td{border-bottom:1px solid #e5e7eb;padding:10px 8px;text-align:left;font-size:13px;}
th{color:#374151;font-weight:900;}
.right{text-align:right;}
@media print { .no-print{display:none;} body{padding:0;} }
</style></head><body><div class="wrap">
<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;">
  <div><div class="title">Rapport paiements</div><div class="muted">${providerLabel} • ${new Date().toLocaleString('fr-FR')}</div></div>
  <div class="no-print" style="display:flex;gap:10px;">
    <button onclick="window.print()" style="padding:10px 14px;border-radius:10px;border:1px solid #111827;background:#111827;color:white;font-weight:900;cursor:pointer;">Imprimer / PDF</button>
    <button onclick="window.close()" style="padding:10px 14px;border-radius:10px;border:1px solid #e5e7eb;background:white;font-weight:900;cursor:pointer;">Fermer</button>
  </div>
</div>
<table><thead><tr><th>Date</th><th>Client</th><th>Mode</th><th class="right">Montant</th></tr></thead><tbody>
${payments.map((p) => `<tr><td>${formatDateTime(p.paidAt)}</td><td>${csvEscape(p.userId)}</td><td>${csvEscape(String(p.provider || '').toUpperCase())}</td><td class="right">${formatMoneyXof(p.amount)}</td></tr>`).join('') || `<tr><td colspan="4">Aucun paiement</td></tr>`}
</tbody></table>
</div></body></html>`;
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.open();
    w.document.write(html);
    w.document.close();
  }, [payments, selectedProvider?.name, selectedProviderId]);

  const stats = useMemo(() => {
    const total = payments.reduce((sum, p) => sum + (Number.isFinite(p.amount) ? p.amount : 0), 0);
    const count = payments.length;
    const last = payments[0]?.paidAt || null;
    return { total, count, last };
  }, [payments]);

  const printInvoice = useCallback((payment) => {
    const invoiceNo = invoiceNumberFromPayment(payment);
    const providerName = selectedProvider?.name || payment?.vendorName || payment?.vendorId || 'Prestataire';
    const city = selectedProvider?.coverage?.[0] || '';
    const trade = selectedProvider?.trade || '';
    const paidAt = formatDateTime(payment?.paidAt);

    const html = `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${invoiceNo}</title>
    <style>
      body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif;margin:0;padding:24px;color:#111827;}
      .wrap{max-width:820px;margin:0 auto;}
      .row{display:flex;justify-content:space-between;gap:16px;}
      .box{border:1px solid #e5e7eb;border-radius:12px;padding:16px;}
      .muted{color:#6b7280;}
      .title{font-size:22px;font-weight:800;margin:0;}
      .h2{font-size:16px;font-weight:800;margin:0 0 8px 0;}
      table{width:100%;border-collapse:collapse;margin-top:12px;}
      th,td{border-bottom:1px solid #e5e7eb;padding:10px 8px;text-align:left;font-size:14px;}
      th{color:#374151;font-weight:800;}
      .right{text-align:right;}
      .total{font-size:18px;font-weight:900;}
      @media print { .no-print{display:none;} body{padding:0;} .box{border-color:#d1d5db;} }
    </style>
  </head>
  <body>
    <div class="wrap">
      <div class="row" style="align-items:flex-start;">
        <div>
          <p class="title">Facture</p>
          <p class="muted" style="margin:6px 0 0 0;">${invoiceNo}</p>
        </div>
        <div class="no-print" style="display:flex;gap:10px;">
          <button onclick="window.print()" style="padding:10px 14px;border-radius:10px;border:1px solid #111827;background:#111827;color:white;font-weight:800;cursor:pointer;">Imprimer</button>
          <button onclick="window.close()" style="padding:10px 14px;border-radius:10px;border:1px solid #e5e7eb;background:white;font-weight:800;cursor:pointer;">Fermer</button>
        </div>
      </div>

      <div class="row" style="margin-top:16px;">
        <div class="box" style="flex:1;">
          <div class="h2">Prestataire</div>
          <div style="font-weight:900;">${providerName}</div>
          <div class="muted" style="margin-top:6px;">${[trade, city].filter(Boolean).join(' • ') || '—'}</div>
        </div>
        <div class="box" style="flex:1;">
          <div class="h2">Détails</div>
          <div class="muted">Date de paiement</div>
          <div style="font-weight:900;margin-bottom:8px;">${paidAt}</div>
          <div class="muted">Mode</div>
          <div style="font-weight:900;">${String(payment?.provider || '').toUpperCase() || '—'}</div>
        </div>
      </div>

      <div class="box" style="margin-top:16px;">
        <div class="h2">Prestation</div>
        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th class="right">Montant</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Paiement d'une prestation</td>
              <td class="right">${formatMoneyXof(payment?.amount)}</td>
            </tr>
            <tr>
              <td class="right total" colspan="2">Total: ${formatMoneyXof(payment?.amount)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="muted" style="margin-top:14px;font-size:12px;">
        Cette facture est générée automatiquement par MangooTech (mode démo).
      </div>
    </div>
  </body>
</html>`;

    const w = window.open('', '_blank');
    if (!w) return;
    w.document.open();
    w.document.write(html);
    w.document.close();
  }, [selectedProvider]);

  const title = 'Mon compte';
  const pageClass = 'min-h-dvh bg-gray-50 text-gray-900 py-10';
  const surfaceClass = 'rounded-2xl border border-gray-200 bg-white';
  const surfaceClassStrong = 'rounded-2xl border border-gray-200 bg-white';
  const mutedText = 'text-gray-600';
  const ghostBtn =
    'px-3 py-2 rounded-xl text-sm font-black border border-gray-200 bg-white hover:bg-gray-50 text-gray-900';
  const ghostBtnXs =
    'px-3 py-2 rounded-xl text-xs font-black border border-gray-200 bg-white hover:bg-gray-50 text-gray-900';
  const selectClass = 'px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-900 outline-none';

  const goBackToProvider = useCallback(() => {
    const providerId = String(selectedProviderId || '').trim();
    try {
      if (providerId) {
        localStorage.setItem('mangoo-open-vendor-id', providerId);
      }
    } catch {
    }
    const fallbackTarget = `/mangoo-local.html?vendor=${encodeURIComponent(providerId)}`;
    const rawTarget = String(returnTo || fallbackTarget).trim();
    try {
      const url = new URL(rawTarget, window.location.origin);
      if (url.pathname.endsWith('/mangoo-local.html') && providerId) {
        url.searchParams.set('vendor', providerId);
      }
      window.location.href = url.toString();
      return;
    } catch {
    }
    window.location.href = rawTarget;
  }, [returnTo, selectedProvider?.raw?.id, selectedProviderId]);

  const switchAccount = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch {
    }
    try {
      localStorage.removeItem('mangoo-current-user');
      localStorage.removeItem('user');
      localStorage.removeItem('local_mode');
      localStorage.removeItem('local_user');
    } catch {
    }
    const target = returnTo ? `/provider/access?return=${encodeURIComponent(returnTo)}` : '/provider/access';
    window.location.href = target;
  }, [returnTo]);

  const updateLocalProvider = useCallback((providerId, patch) => {
    const id = String(providerId || '').trim();
    if (!id) return false;
    try {
      const keys = ['mangoo_custom_vendors', 'mangoo_vendors'];
      keys.forEach((k) => {
        const list = safeParseJson(localStorage.getItem(k), []);
        const arr = Array.isArray(list) ? list : [];
        const next = arr.map((v) => (String(v?.id) === id ? { ...v, ...patch } : v));
        localStorage.setItem(k, JSON.stringify(next));
      });
      setLocalVersion((v) => v + 1);
      return true;
    } catch {
      return false;
    }
  }, []);

  const copyText = useCallback(async (text) => {
    const t = String(text || '');
    if (!t) return;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(t);
        return;
      }
    } catch {
    }
    try {
      window.prompt('Copier:', t);
    } catch {
    }
  }, []);

  const changePin = useCallback(() => {
    if (!selectedProviderId) return;
    const nextPin = reserveUniqueLocalPin(selectedProviderId);
    if (!nextPin) return;
    try {
      setLocalPinForVendorId(selectedProviderId, nextPin);
    } catch {
    }
    updateLocalProvider(selectedProviderId, { localPin: nextPin });
  }, [selectedProviderId, updateLocalProvider]);

  const onAddPhotos = useCallback(async (files) => {
    try {
      const list = Array.from(files || []).slice(0, 6);
      if (!selectedProviderId || !list.length) return;
      const readFile = (file) =>
        new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : null);
          reader.onerror = () => resolve(null);
          reader.readAsDataURL(file);
        });
      const urls = (await Promise.all(list.map(readFile))).filter(Boolean);
      if (!urls.length) return;
      const current = Array.isArray(selectedProvider?.portfolio) ? selectedProvider.portfolio : [];
      const next = [...current, ...urls].slice(0, 12);
      updateLocalProvider(selectedProviderId, { portfolio: next });
    } catch {
    }
  }, [selectedProvider?.portfolio, selectedProviderId, updateLocalProvider]);

  const removePhoto = useCallback((url) => {
    if (!selectedProviderId) return;
    const current = Array.isArray(selectedProvider?.portfolio) ? selectedProvider.portfolio : [];
    const next = current.filter((x) => String(x) !== String(url));
    updateLocalProvider(selectedProviderId, { portfolio: next });
  }, [selectedProvider?.portfolio, selectedProviderId, updateLocalProvider]);

  return (
    <div className={pageClass}>
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-6">
          <div>
            <div className="text-2xl font-black">{title}</div>
            <div className={`${mutedText} text-sm mt-1`}>
              Factures, paiements et historique des prestations
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <button
              type="button"
              onClick={goBackToProvider}
              className={ghostBtn}
            >
              ← Retour à ma fiche
            </button>
            <div className={`${mutedText} text-sm font-semibold`}>Ma fiche</div>
            <select
              value={selectedProviderId}
              onChange={(e) => {
                userSelectedRef.current = true;
                setSelectedProviderId(e.target.value);
              }}
              className={selectClass}
            >
              {allProviders.length === 0 ? (
                <option value="">Aucune fiche</option>
              ) : (
                allProviders.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}{p.trade ? ` • ${p.trade}` : ''}
                  </option>
                ))
              )}
            </select>
            <button
              type="button"
              onClick={() => setShowSettings(true)}
              className={ghostBtn}
            >
              👤 Mon compte
            </button>
            <button
              type="button"
              onClick={switchAccount}
              className={ghostBtn}
            >
              🔁 Autre compte
            </button>
          </div>
        </div>

        <div className={`mb-6 p-4 ${surfaceClass}`}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm font-black">Ma fiche (validation)</div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-black ${providerValidation.badgeClass}`}>
                  {providerValidation.badge}
                </span>
              </div>
              <div className={`${mutedText} text-sm mt-2`}>
                {providerValidation.message}
              </div>
            </div>
            {providerValidation.actionLabel ? (
              <a
                href="/provider/apply"
                className={providerValidation.actionClass}
              >
                {providerValidation.actionLabel}
              </a>
            ) : null}
          </div>
        </div>

        {allProviders.length === 0 ? (
          <div className={`p-6 ${surfaceClassStrong}`}>
            <div className="text-xl font-black">Aucune fiche</div>
            <div className={`${mutedText} mt-2`}>
              Créez votre fiche dans Mangoo Local+ puis revenez ici.
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-2 mb-6">
              {[
                { key: 'overview', label: 'Accueil' },
                { key: 'payments', label: 'Paiements' },
                { key: 'invoices', label: 'Factures' },
                { key: 'requests', label: 'Demandes' },
              ].map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTab(t.key)}
                  className={`px-3 py-2 rounded-full text-sm font-black border transition-colors ${
                    tab === t.key
                      ? 'bg-gradient-to-r from-orange-500 to-green-600 text-white border-transparent'
                      : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {tab === 'overview' && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="rounded-2xl border p-5 bg-white border-gray-200">
                  <div className="text-gray-600 text-sm font-semibold">Total encaissé</div>
                  <div className="text-3xl font-black mt-2">{formatMoneyXof(stats.total)}</div>
                </div>
                <div className="rounded-2xl border p-5 bg-white border-gray-200">
                  <div className="text-gray-600 text-sm font-semibold">Paiements</div>
                  <div className="text-3xl font-black mt-2">{stats.count}</div>
                  <div className="text-gray-600 text-sm mt-1">Dernier: {formatDateTime(stats.last)}</div>
                </div>
                <div className="rounded-2xl border p-5 bg-white border-gray-200">
                  <div className="text-gray-600 text-sm font-semibold">Demandes (devis/messages)</div>
                  <div className="text-3xl font-black mt-2">{requests.length}</div>
                </div>
                <div className="rounded-2xl border p-5 bg-white border-gray-200">
                  <div className="text-gray-600 text-sm font-semibold">Code PIN (connexion)</div>
                  <div className="text-3xl font-black mt-2 tracking-widest">{selectedProviderPin || '—'}</div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button type="button" onClick={() => copyText(selectedProviderPin)} className={ghostBtnXs}>
                      Copier
                    </button>
                    <button type="button" onClick={changePin} className={ghostBtnXs}>
                      Changer
                    </button>
                  </div>
                </div>
              </div>
            )}

            {(tab === 'payments' || tab === 'invoices') && (
              <div className="rounded-2xl border overflow-hidden bg-white border-gray-200">
                <div className="p-4 flex items-center justify-between">
                  <div className="font-black">{tab === 'payments' ? 'Historique des paiements' : 'Factures'}</div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={exportPaymentsPdf}
                      className={ghostBtnXs}
                    >
                      Export PDF
                    </button>
                    <button
                      type="button"
                      onClick={exportPaymentsCsv}
                      className={ghostBtnXs}
                    >
                      Export CSV
                    </button>
                    <div className="text-gray-600 text-sm">{payments.length} élément(s)</div>
                  </div>
                </div>
                <div className="overflow-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left px-4 py-3 font-black">Date</th>
                        <th className="text-left px-4 py-3 font-black">Client</th>
                        <th className="text-left px-4 py-3 font-black">Mode</th>
                        <th className="text-right px-4 py-3 font-black">Montant</th>
                        <th className="text-right px-4 py-3 font-black">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-10 text-center text-gray-600">
                            Aucun paiement.
                          </td>
                        </tr>
                      ) : (
                        payments.map((p) => (
                          <tr key={p.id} className="border-t border-gray-200">
                            <td className="px-4 py-3">{formatDateTime(p.paidAt)}</td>
                            <td className="px-4 py-3">{p.userId || '—'}</td>
                            <td className="px-4 py-3">{String(p.provider || '').toUpperCase() || '—'}</td>
                            <td className="px-4 py-3 text-right font-black">{formatMoneyXof(p.amount)}</td>
                            <td className="px-4 py-3 text-right">
                              <button
                                type="button"
                                onClick={() => printInvoice(p)}
                                className={ghostBtnXs}
                              >
                                Imprimer facture
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {tab === 'requests' && (
              <div className="rounded-2xl border overflow-hidden bg-white border-gray-200">
                <div className="p-4 flex items-center justify-between">
                  <div className="font-black">Historique des prestations (demandes)</div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={exportRequestsCsv}
                      className={ghostBtnXs}
                    >
                      Export CSV
                    </button>
                    <div className="text-gray-600 text-sm">{requests.length} élément(s)</div>
                  </div>
                </div>
                <div className="overflow-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left px-4 py-3 font-black">Date</th>
                        <th className="text-left px-4 py-3 font-black">Type</th>
                        <th className="text-left px-4 py-3 font-black">Quartier</th>
                        <th className="text-left px-4 py-3 font-black">Message</th>
                        <th className="text-left px-4 py-3 font-black">Statut</th>
                        <th className="text-right px-4 py-3 font-black">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {requests.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-10 text-center text-gray-600">
                            Aucune demande.
                          </td>
                        </tr>
                      ) : (
                        requests
                          .slice()
                          .sort((a, b) => (b.ts || 0) - (a.ts || 0))
                          .map((r) => (
                            <tr key={`${r.ts}-${r.text}`} className="border-t border-gray-200">
                              <td className="px-4 py-3">{r.ts ? new Date(r.ts).toLocaleString('fr-FR') : '—'}</td>
                              <td className="px-4 py-3">
                                {r.devis ? 'Devis' : 'Message'}{r.urgent ? ' • Urgent' : ''}
                              </td>
                              <td className="px-4 py-3">{r.quartier || '—'}</td>
                              <td className="px-4 py-3">{r.text || '—'}</td>
                              <td className="px-4 py-3">
                                {(() => {
                                  const meta = requestMeta[r.requestId] || {};
                                  const status = String(meta?.status || 'new');
                                  const paid = meta?.paid || payments.some((p) => String(p.requestId || '') === r.requestId);
                                  const label = status === 'in_progress'
                                    ? 'En cours'
                                    : status === 'done'
                                      ? 'Terminé'
                                      : status === 'cancelled'
                                        ? 'Annulé'
                                        : status === 'paid'
                                          ? 'Payé'
                                          : 'Nouveau';
                                  return (
                                    <div className="flex items-center gap-2">
                                      <select
                                        value={status}
                                        onChange={(e) => setRequestMeta(r.requestId, { status: e.target.value })}
                                        className="px-2 py-1 rounded-lg border text-xs font-black bg-white border-gray-200 text-gray-900"
                                      >
                                        <option value="new">Nouveau</option>
                                        <option value="in_progress">En cours</option>
                                        <option value="done">Terminé</option>
                                        <option value="cancelled">Annulé</option>
                                        <option value="paid">Payé</option>
                                      </select>
                                      <span className={`text-xs font-black ${paid ? 'text-emerald-600' : 'text-gray-600'}`}>{paid ? '• payé' : ''}</span>
                                      <span className="text-gray-600 text-xs">{label}</span>
                                    </div>
                                  );
                                })()}
                              </td>
                              <td className="px-4 py-3 text-right">
                                <div className="flex justify-end gap-2">
                                  <button
                                    type="button"
                                    onClick={() => goToServiceCheckout({ requestId: r.requestId })}
                                    className={ghostBtnXs}
                                  >
                                    Encaisser
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setRequestMeta(r.requestId, { status: 'done' })}
                                    className={ghostBtnXs}
                                  >
                                    Terminer
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {showSettings && selectedProvider ? (
        <div
          className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4"
          onClick={() => setShowSettings(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-2xl max-h-[90vh] rounded-2xl bg-white border border-gray-200 overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 flex items-center justify-between border-b border-gray-200 bg-white sticky top-0 z-10">
              <div className="font-black">Mon compte</div>
              <div className="flex items-center gap-2">
                <button type="button" className={ghostBtnXs} onClick={() => setShowSettings(false)}>
                  Fermer
                </button>
              </div>
            </div>
            <div className="p-4 space-y-3 overflow-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="text-sm font-black text-gray-700">Nom</div>
                  <input
                    defaultValue={String(selectedProvider?.name || '')}
                    onBlur={(e) => updateLocalProvider(selectedProviderId, { name: String(e.target.value || '').trim() })}
                    className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-900 outline-none focus:ring-2 focus:ring-orange-400/40"
                  />
                </div>
                <div>
                  <div className="text-sm font-black text-gray-700">Métier</div>
                  <input
                    defaultValue={String(selectedProvider?.trade || '')}
                    onBlur={(e) => updateLocalProvider(selectedProviderId, { trade: String(e.target.value || '').trim() })}
                    className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-900 outline-none focus:ring-2 focus:ring-orange-400/40"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="text-sm font-black text-gray-700">Téléphone</div>
                  <input
                    defaultValue={String(selectedProvider?.phone || '')}
                    onBlur={(e) => updateLocalProvider(selectedProviderId, { phone: String(e.target.value || '').trim() })}
                    className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-900 outline-none focus:ring-2 focus:ring-orange-400/40"
                  />
                </div>
                <div>
                  <div className="text-sm font-black text-gray-700">Ville</div>
                  <input
                    defaultValue={String(selectedProvider?.city || '')}
                    onBlur={(e) => updateLocalProvider(selectedProviderId, { city: String(e.target.value || '').trim() })}
                    className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-900 outline-none focus:ring-2 focus:ring-orange-400/40"
                  />
                </div>
              </div>

              <div>
                <div className="text-sm font-black text-gray-700">Zones couvertes (séparées par des virgules)</div>
                <input
                  defaultValue={Array.isArray(selectedProvider?.coverage) ? selectedProvider.coverage.join(', ') : ''}
                  onBlur={(e) =>
                    updateLocalProvider(selectedProviderId, {
                      coverage: String(e.target.value || '')
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                  className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-900 outline-none focus:ring-2 focus:ring-orange-400/40"
                />
              </div>

              <div>
                <div className="text-sm font-black text-gray-700">Services (séparés par des virgules)</div>
                <input
                  defaultValue={Array.isArray(selectedProvider?.services) ? selectedProvider.services.join(', ') : ''}
                  onBlur={(e) =>
                    updateLocalProvider(selectedProviderId, {
                      services: String(e.target.value || '')
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                  className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-900 outline-none focus:ring-2 focus:ring-orange-400/40"
                />
              </div>

              <div>
                <div className="text-sm font-black text-gray-700">Photos</div>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => onAddPhotos(e.target.files)}
                  className="mt-2 block w-full text-sm text-gray-700 file:mr-3 file:px-3 file:py-2 file:rounded-xl file:border file:border-gray-200 file:bg-gray-100 file:text-gray-900 file:font-black"
                />
                <div className="mt-3 flex flex-wrap gap-2">
                  {(Array.isArray(selectedProvider?.portfolio) ? selectedProvider.portfolio : []).slice(0, 12).map((url) => (
                    <button
                      key={String(url)}
                      type="button"
                      className="h-16 w-16 rounded-xl overflow-hidden border border-gray-200 bg-gray-50"
                      onClick={() => removePhoto(url)}
                      title="Supprimer"
                    >
                      <img src={url} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
                <div className="mt-2 text-xs text-gray-600">Cliquez une photo pour la supprimer.</div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <div className="text-sm font-black text-gray-700">Code PIN (connexion)</div>
                <div className="mt-1 text-2xl font-black tracking-widest">{selectedProviderPin || '—'}</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" onClick={() => copyText(selectedProviderPin)} className={ghostBtnXs}>
                    Copier
                  </button>
                  <button type="button" onClick={changePin} className={ghostBtnXs}>
                    Changer
                  </button>
                  <button
                    type="button"
                    onClick={() => copyText(`${window.location.origin}/mangoo-local.html?pin=${encodeURIComponent(String(selectedProviderPin || ''))}`)}
                    className={ghostBtnXs}
                  >
                    Copier lien
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
