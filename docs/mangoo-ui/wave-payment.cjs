'use strict';
/* =========================================================================
   Mangoo Connect+ — intégration Wave Business (encaissement réel)
   -------------------------------------------------------------------------
   Implémente le flux « Checkout » de Wave (redirect), conformément à la
   documentation officielle (docs.wave.com) :

     - Base URL            : https://api.wave.com  (configurable WAVE_API_BASE)
     - Auth                : Authorization: Bearer <WAVE_API_KEY>
     - Créer une session   : POST /v1/checkout/sessions
     - Statut d'une session: GET  /v1/checkout/sessions/{id}
     - Signature webhook   : HMAC-SHA256 sur le corps brut (WAVE_WEBHOOK_SECRET)
     - Signature requête   : optionnelle (WAVE_SIGNING_SECRET)

   IMPORTANT — rien n'est « inventé » ici : les endpoints et l'auth sont ceux
   de l'API publique Wave. Les champs de réponse (id de session, URL de
   redirection, statut) sont lus de façon tolérante (plusieurs alias possibles)
   car leur nom exact peut varier légèrement selon le compte / le pays. À
   VALIDER une fois en sandbox avec le compte marchand réel.

   Ce module est autonome (Node natif + fetch global, dispo Node >= 18).
   En l'absence de WAVE_API_KEY, `configured()` renvoie false et aucun appel
   réel n'est effectué (le mode démo de server.cjs reste actif).
   ========================================================================= */

const crypto = require('crypto');

const WAVE_API_BASE = String(process.env.WAVE_API_BASE || 'https://api.wave.com').replace(/\/+$/, '');
const WAVE_API_KEY = String(process.env.WAVE_API_KEY || '').trim();
const WAVE_WEBHOOK_SECRET = String(process.env.WAVE_WEBHOOK_SECRET || '').trim();
const WAVE_SIGNING_SECRET = String(process.env.WAVE_SIGNING_SECRET || '').trim();

function configured() {
  return WAVE_API_KEY !== '';
}

function hmacHex(secret, payload) {
  return crypto.createHmac('sha256', secret).update(String(payload || '')).digest('hex');
}

// Signature de requête optionnelle. Si WAVE_SIGNING_SECRET est défini, on
// signe « timestamp + corps brut » et on renvoie l'en-tête Wave-Signature.
function signingHeaders(body) {
  if (!WAVE_SIGNING_SECRET) return {};
  const t = Math.floor(Date.now() / 1000);
  const sig = hmacHex(WAVE_SIGNING_SECRET, String(t) + String(body || ''));
  return { 'Wave-Signature': 't=' + t + ',v1=' + sig };
}

function waveHeaders(body) {
  return Object.assign({
    'Authorization': 'Bearer ' + WAVE_API_KEY,
    'Content-Type': 'application/json'
  }, signingHeaders(body));
}

// Vérifie la signature HMAC d'un webhook entrant.
// En-tête attendu : « t=<timestamp>,v1=<signature> » (Wave-Signature).
function verifyWebhookSignature(rawBody, signatureHeader) {
  if (!WAVE_WEBHOOK_SECRET) return false;
  if (!signatureHeader) return false;
  const m = /t=([0-9]+)\s*,\s*v1=([a-f0-9]+)/i.exec(String(signatureHeader));
  if (!m) return false;
  const timestamp = m[1];
  const provided = m[2].toLowerCase();
  const expected = hmacHex(WAVE_WEBHOOK_SECRET, timestamp + String(rawBody || ''));
  const a = Buffer.from(provided, 'utf8');
  const b = Buffer.from(expected, 'utf8');
  if (a.length !== b.length) return false;
  try { return crypto.timingSafeEqual(a, b); } catch (e) { return false; }
}

// Crée une session de checkout Wave et renvoie { id, checkoutUrl }.
async function createCheckoutSession(opts) {
  opts = opts || {};
  const amount = Math.round(Number(opts.amount) || 0);
  if (amount <= 0) throw new Error('Montant invalide.');
  const body = JSON.stringify({
    amount: String(amount),
    currency: String(opts.currency || 'XOF'),
    success_url: String(opts.successUrl || ''),
    error_url: String(opts.errorUrl || ''),
    client_reference: String(opts.reference || '')
  });
  const res = await fetch(WAVE_API_BASE + '/v1/checkout/sessions', {
    method: 'POST',
    headers: waveHeaders(body),
    body: body
  });
  const data = await res.json().catch(function () { return {}; });
  if (!res.ok) {
    const msg = (data && (data.message || data.error)) || ('HTTP ' + res.status);
    throw new Error('Wave (session) : ' + msg);
  }
  return {
    id: data.id || data.session_id || data.checkout_session_id || null,
    checkoutUrl: data.wave_launch_url || data.payment_url || data.checkout_url || null
  };
}

// Interroge le statut d'une session (polling / webhook de secours).
async function getCheckoutSession(sessionId) {
  const res = await fetch(WAVE_API_BASE + '/v1/checkout/sessions/' + encodeURIComponent(String(sessionId)), {
    method: 'GET',
    headers: waveHeaders('')
  });
  const data = await res.json().catch(function () { return {}; });
  return {
    status: data.status || data.payment_status || data.state || null,
    raw: data
  };
}

// Normalise le statut Wave en « paiement terminé » (true / false).
function isCompletedStatus(status) {
  const s = String(status || '').toLowerCase();
  if (!s) return false;
  return s === 'completed' || s === 'success' || s === 'paid'
    || s.indexOf('checkout.session.completed') !== -1
    || s.indexOf('session.completed') !== -1;
}

// Provider Wave — même interface que DemoPaymentProvider (initiate / confirm),
// mais asynchrone (appels réseau réels). Utilisé uniquement en mode live et
// si WAVE_API_KEY est présente.
const WavePaymentProvider = {
  id: 'wave',
  label: 'Wave',
  async initiate(op) {
    op = op || {};
    const session = await createCheckoutSession({
      amount: op.amount,
      currency: op.currency || 'XOF',
      reference: op.reference || '',
      successUrl: op.successUrl || '',
      errorUrl: op.errorUrl || ''
    });
    return {
      mode: 'live',
      operatorRef: session.id,
      checkoutUrl: session.checkoutUrl,
      instructions: 'Vous allez être redirigé vers Wave pour valider le paiement.'
    };
  },
  async confirm(txn) {
    if (!txn || !txn.operatorRef) return { success: false, error: 'Référence Wave manquante.' };
    const s = await getCheckoutSession(txn.operatorRef);
    if (isCompletedStatus(s.status)) {
      txn.status = 'completed';
      txn.mode = 'live';
      txn.paidAt = new Date().toISOString();
      txn.providerRef = txn.operatorRef;
      return { success: true };
    }
    return { success: false, error: 'Paiement non confirmé (statut : ' + (s.status || 'inconnu') + ').' };
  }
};

module.exports = {
  WAVE_API_BASE: WAVE_API_BASE,
  configured: configured,
  verifyWebhookSignature: verifyWebhookSignature,
  createCheckoutSession: createCheckoutSession,
  getCheckoutSession: getCheckoutSession,
  isCompletedStatus: isCompletedStatus,
  WavePaymentProvider: WavePaymentProvider
};
