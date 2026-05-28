import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useThemeStore } from '../stores/themeStore';
import { PaymentMethods } from '../components/PaymentMethodsStable';

export default function ServiceCheckout() {
  const { isDark } = useThemeStore();
  const [searchParams] = useSearchParams();
  const [paid, setPaid] = useState(null);
  const [error, setError] = useState('');

  const vendorId = String(searchParams.get('vendorId') || '').trim();
  const vendorName = String(searchParams.get('vendorName') || '').trim();
  const returnTo = String(searchParams.get('return') || '').trim();
  const requestId = String(searchParams.get('requestId') || '').trim();

  const amount = useMemo(() => {
    const raw = String(searchParams.get('amount') || '').replace(/[^\d]/g, '');
    const n = Number(raw);
    return Number.isFinite(n) ? n : 0;
  }, [searchParams]);

  const currentUser = useMemo(() => {
    try {
      const raw = localStorage.getItem('mangoo-current-user') || localStorage.getItem('user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  const userId = String(currentUser?.id || currentUser?.email || 'anonymous');

  const recordPayment = (tx) => {
    try {
      const key = 'mangoo_service_payments';
      const raw = localStorage.getItem(key);
      const list = raw ? JSON.parse(raw) : [];
      const next = Array.isArray(list) ? list : [];
      next.unshift({
        id: `svc-${Date.now()}`,
        requestId: requestId || null,
        vendorId,
        vendorName,
        userId,
        amount,
        currency: String(tx?.currency || 'XOF'),
        provider: String(tx?.provider || ''),
        paidAt: new Date().toISOString(),
      });
      localStorage.setItem(key, JSON.stringify(next.slice(0, 50)));
    } catch {
    }
  };

  const updateRequestMetaPaid = () => {
    if (!requestId) return;
    try {
      const key = 'mangoo_service_request_meta';
      const raw = localStorage.getItem(key);
      const meta = raw ? JSON.parse(raw) : {};
      const obj = meta && typeof meta === 'object' ? meta : {};
      const prev = obj[requestId] && typeof obj[requestId] === 'object' ? obj[requestId] : {};
      obj[requestId] = {
        ...prev,
        status: prev.status && String(prev.status) !== 'new' ? prev.status : 'paid',
        paid: true,
        paidAt: new Date().toISOString(),
        amount,
      };
      localStorage.setItem(key, JSON.stringify(obj));
    } catch {
    }
  };

  const openInvoiceWindow = (tx) => {
    try {
      const paidAt = new Date().toISOString();
      const invoiceNo = `INV-${paidAt.slice(0, 10).replace(/-/g, '')}-${String(tx?.id || Date.now()).slice(-6)}`;
      const providerLabel = vendorName || vendorId || 'Prestataire';
      const method = String(tx?.provider || '').toUpperCase() || '—';
      const money = `${Number(amount || 0).toLocaleString('fr-FR')} FCFA`;
      const html = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8" />
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
@media print { .no-print{display:none;} body{padding:0;} }
</style></head>
<body><div class="wrap">
<div class="row" style="align-items:flex-start;">
  <div><p class="title">Facture</p><p class="muted" style="margin:6px 0 0 0;">${invoiceNo}</p></div>
  <div class="no-print" style="display:flex;gap:10px;">
    <button onclick="window.print()" style="padding:10px 14px;border-radius:10px;border:1px solid #111827;background:#111827;color:white;font-weight:800;cursor:pointer;">Imprimer</button>
    <button onclick="window.close()" style="padding:10px 14px;border-radius:10px;border:1px solid #e5e7eb;background:white;font-weight:800;cursor:pointer;">Fermer</button>
  </div>
</div>
<div class="row" style="margin-top:16px;">
  <div class="box" style="flex:1;"><div class="h2">Prestataire</div><div style="font-weight:900;">${providerLabel}</div><div class="muted" style="margin-top:6px;">—</div></div>
  <div class="box" style="flex:1;"><div class="h2">Détails</div><div class="muted">Date de paiement</div><div style="font-weight:900;margin-bottom:8px;">${new Date().toLocaleString('fr-FR')}</div><div class="muted">Mode</div><div style="font-weight:900;">${method}</div></div>
</div>
<div class="box" style="margin-top:16px;"><div class="h2">Prestation</div>
<table><thead><tr><th>Description</th><th class="right">Montant</th></tr></thead>
<tbody><tr><td>Paiement d'une prestation</td><td class="right">${money}</td></tr>
<tr><td class="right total" colspan="2">Total: ${money}</td></tr></tbody></table></div>
<div class="muted" style="margin-top:14px;font-size:12px;">Cette facture est générée automatiquement par MangooTech (mode démo).</div>
</div></body></html>`;
      const w = window.open('', '_blank');
      if (!w) return;
      w.document.open();
      w.document.write(html);
      w.document.close();
    } catch {
    }
  };

  const goBack = () => {
    const target = returnTo || '/mangoo-local.html';
    window.location.href = target;
  };

  if (!vendorId || amount <= 0) {
    return (
      <div className={`min-h-screen py-12 ${isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
        <div className="container">
          <div className="max-w-xl mx-auto card">
            <div className="card-body">
              <div className="text-xl font-bold mb-2">Paiement prestation</div>
              <div className={`${isDark ? 'text-gray-300' : 'text-gray-700'} text-sm`}>
                Paramètres manquants (prestataire ou montant).
              </div>
              <div className="mt-6">
                <button type="button" onClick={goBack} className="btn-primary">Retour</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (paid) {
    return (
      <div className={`min-h-screen py-12 ${isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
        <div className="container">
          <div className="max-w-xl mx-auto card">
            <div className="card-body">
              <div className="text-2xl font-bold">Paiement réussi</div>
              <div className={`${isDark ? 'text-gray-300' : 'text-gray-700'} mt-2`}>
                Prestataire: <span className="font-semibold">{vendorName || vendorId}</span>
              </div>
              <div className={`${isDark ? 'text-gray-300' : 'text-gray-700'} mt-1`}>
                Montant: <span className="font-semibold">{amount.toLocaleString('fr-FR')} FCFA</span>
              </div>
              <div className="mt-6 flex gap-3">
                <button type="button" onClick={goBack} className="btn-primary">Retour à Local+</button>
                <button type="button" onClick={() => setPaid(null)} className="btn-secondary">Payer autre</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen py-10 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="container">
        <div className="max-w-3xl mx-auto">
          <div className={`mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <div className="text-2xl font-bold">Paiement prestation</div>
            <div className={`${isDark ? 'text-gray-300' : 'text-gray-700'} mt-1`}>
              Prestataire: <span className="font-semibold">{vendorName || vendorId}</span> • {amount.toLocaleString('fr-FR')} FCFA
            </div>
          </div>

          {error && (
            <div className="card mb-4">
              <div className="card-body">
                <div className="text-red-600 font-semibold">{error}</div>
              </div>
            </div>
          )}

          <div className="card">
            <div className="card-body">
              <PaymentMethods
                amount={amount}
                currency="XOF"
                country="CI"
                userId={userId}
                description={`Prestation: ${vendorName || vendorId}`}
                onPaymentSuccess={(tx) => {
                  recordPayment(tx);
                  updateRequestMetaPaid();
                  setPaid(tx);
                  setError('');
                  openInvoiceWindow(tx);
                }}
                onPaymentError={(e) => {
                  setError(String(e?.message || 'Paiement échoué'));
                }}
              />
              <div className="mt-4">
                <button type="button" onClick={goBack} className="btn-secondary">Annuler</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
