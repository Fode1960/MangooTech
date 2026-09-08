'use strict';
/* =========================================================================
   Mangoo Connect+ — intégration Orange Money (Web Payment, redirect)
   -------------------------------------------------------------------------
   Conforme à l'API publique « Orange Money Web Payment » (developer.orange.com) :

     - Auth                : OAuth2 client_credentials (2-legged)
                             POST {base}/oauth/token  (Basic client_id:client_secret)
     - Créer un paiement   : POST {base}/webpayment
     - Statut d'un paiement: GET  {base}/webpayment/{pay_token}
     - Notification        : POST vers notif_url (notif_token à valider)
     - Devise UEMOA        : "OUV" (équivalent XOF)

   Base par défaut (Web Payment Dev) :
     https://api.orange.com/orange-money-webpay/dev/v1

   IMPORTANT — rien n'est « inventé » : endpoints et auth sont ceux de l'API
   publique Orange. Les champs de réponse sont lus de façon tolérante (plusieurs
   alias) car leur nom exact peut varier. À VALIDER en sandbox avec le compte
   développeur réel.

   Module autonome (Node natif + fetch global). Sans clés, configured() = false
   et aucun appel réel n'est effectué.
   ========================================================================= */

const crypto = require('crypto');

const OM_BASE = String(process.env.ORANGE_MONEY_API_BASE || 'https://api.orange.com/orange-money-webpay/dev/v1').replace(/\/+$/, '');
const OM_CLIENT_ID = String(process.env.ORANGE_MONEY_CLIENT_ID || '').trim();
const OM_CLIENT_SECRET = String(process.env.ORANGE_MONEY_CLIENT_SECRET || '').trim();
const OM_MERCHANT_KEY = String(process.env.ORANGE_MONEY_MERCHANT_KEY || '').trim();
const OM_NOTIF_TOKEN = String(process.env.ORANGE_MONEY_NOTIF_TOKEN || '').trim();

// Cache en mémoire du token OAuth2 (expire ~3600 s).
let tokenCache = { access_token: null, expiresAt: 0 };

function configured() {
  return OM_CLIENT_ID !== '' && OM_CLIENT_SECRET !== '' && OM_MERCHANT_KEY !== '';
}

async function getAccessToken() {
  if (tokenCache.access_token && Date.now() < tokenCache.expiresAt) return tokenCache.access_token;
  const auth = Buffer.from(OM_CLIENT_ID + ':' + OM_CLIENT_SECRET).toString('base64');
  const res = await fetch(OM_BASE + '/oauth/token', {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + auth,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });
  const data = await res.json().catch(function () { return {}; });
  if (!res.ok || !data.access_token) {
    throw new Error('Orange Money (token) : ' + (data.error_description || data.error || ('HTTP ' + res.status)));
  }
  const expiresIn = Number(data.expires_in) || 3600;
  tokenCache = { access_token: data.access_token, expiresAt: Date.now() + (expiresIn - 60) * 1000 };
  return data.access_token;
}

async function createWebPayment(opts) {
  opts = opts || {};
  const amount = Math.round(Number(opts.amount) || 0);
  if (amount <= 0) throw new Error('Montant invalide.');
  const token = await getAccessToken();
  const orderId = String(opts.reference || ('MGO-' + Date.now()));
  const body = JSON.stringify({
    merchant_key: OM_MERCHANT_KEY,
    currency: 'OUV', // unités UEMOA (= XOF)
    order_id: orderId,
    amount: amount,
    return_url: String(opts.returnUrl || ''),
    cancel_url: String(opts.cancelUrl || ''),
    notif_url: String(opts.notifUrl || ''),
    lang: 'fr',
    reference: orderId
  });
  const res = await fetch(OM_BASE + '/webpayment', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
    body: body
  });
  const data = await res.json().catch(function () { return {}; });
  if (!res.ok) {
    throw new Error('Orange Money (webpayment) : ' + (data.message || data.error || data.error_description || ('HTTP ' + res.status)));
  }
  return {
    id: data.pay_token || data.payToken || data.payment_token || data.notif_token || null,
    checkoutUrl: data.payment_url || data.pay_url || data.redirect_url || data.webpayment_url || null
  };
}

async function getPaymentStatus(payToken) {
  const token = await getAccessToken();
  const res = await fetch(OM_BASE + '/webpayment/' + encodeURIComponent(String(payToken)), {
    method: 'GET',
    headers: { 'Authorization': 'Bearer ' + token }
  });
  const data = await res.json().catch(function () { return {}; });
  return {
    status: data.status || data.payment_status || data.state || null,
    raw: data
  };
}

function isCompletedStatus(status) {
  return String(status || '').toUpperCase() === 'SUCCESS';
}

// Orange Money n'a pas de webhook public fiable : on valide le notif_token.
function verifyNotificationToken(token) {
  if (!OM_NOTIF_TOKEN) return false;
  if (!token) return false;
  const a = String(token);
  if (a.length !== OM_NOTIF_TOKEN.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(OM_NOTIF_TOKEN));
}

const OrangeMoneyProvider = {
  id: 'orange',
  label: 'Orange Money',
  async initiate(op) {
    op = op || {};
    const session = await createWebPayment({
      amount: op.amount,
      reference: op.reference || '',
      returnUrl: op.returnUrl || '',
      cancelUrl: op.cancelUrl || '',
      notifUrl: op.notifUrl || ''
    });
    return {
      mode: 'live',
      operatorRef: session.id,
      checkoutUrl: session.checkoutUrl,
      instructions: 'Vous allez être redirigé vers Orange Money pour valider le paiement.'
    };
  },
  async confirm(txn) {
    if (!txn || !txn.operatorRef) return { success: false, error: 'Référence Orange Money manquante.' };
    const s = await getPaymentStatus(txn.operatorRef);
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
  OM_BASE: OM_BASE,
  configured: configured,
  verifyNotificationToken: verifyNotificationToken,
  createWebPayment: createWebPayment,
  getPaymentStatus: getPaymentStatus,
  isCompletedStatus: isCompletedStatus,
  OrangeMoneyProvider: OrangeMoneyProvider
};
