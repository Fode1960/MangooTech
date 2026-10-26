'use strict';
/* =========================================================================
   Mangoo Connect+ — passerelle SMS (eSMS Africa, HTTP API)
   -------------------------------------------------------------------------
   Contrat de l'API publique eSMS Africa :

     - Envoi        : POST {base}/api/messages/send
     - Authentification : en-tête « Authorization: Bearer <clé> »
     - Corps JSON   : { to, text, sender_id? }
     - Réponse 200  : { id, status, segments, cost, cost_currency, route, balance_after }
     - Statut       : GET {base}/api/messages/{id}

   La clé distingue l'environnement :
     - « esms_test_... »  -> bac à sable (livraison simulée, aucun débit)
     - « esms_live_... »  -> production (débit du solde, envoi réel)

   Base par défaut : https://sms.esmsafrica.io

   IMPORTANT — rien n'est « inventé » : endpoint, en-tête d'authentification et
   champs sont ceux de la documentation publique eSMS Africa. Les réponses sont
   lues de façon tolérante car certains noms de champs peuvent varier selon la
   version de l'API.

   Module autonome (Node natif + fetch global). Les variables d'environnement
   sont lues À CHAQUE APPEL (et non au chargement du module) : l'ordre de
   chargement du fichier .env par server.cjs n'a donc aucune incidence.

   Sans clé, configured() = false et aucun appel réseau n'est effectué : le code
   est alors seulement journalisé côté serveur (repli de développement).
   ========================================================================= */

const DEFAULT_COUNTRY_CODE = '221'; // Sénégal

function apiBase() {
  return String(process.env.ESMS_API_BASE || 'https://sms.esmsafrica.io').replace(/\/+$/, '');
}

function apiKey() {
  return String(process.env.ESMS_API_KEY || '').trim();
}

function senderId() {
  return String(process.env.ESMS_SENDER_ID || '').trim();
}

// Une passerelle est configurée dès qu'une clé API est fournie.
function configured() {
  return apiKey() !== '';
}

// Bac à sable : les clés « esms_test_... » simulent la livraison sans débit.
function sandbox() {
  return /^esms_test_/i.test(apiKey());
}

// Convertit un numéro en format international E.164 exigé par eSMS.
// Un numéro local (ex. « 771234567 ») est préfixé par l'indicatif pays par
// défaut ; un numéro déjà international est conservé tel quel.
function toE164(phone) {
  let s = String(phone || '').replace(/[^\d+]/g, '').trim();
  if (!s) return '';
  if (s.indexOf('00') === 0) s = '+' + s.slice(2);
  if (s.charAt(0) === '+') return s;
  const national = s.replace(/^0+/, '');
  if (!national) return '';
  if (s.length <= 10) return '+' + DEFAULT_COUNTRY_CODE + national;
  return '+' + s;
}

// Message de code de vérification. Volontairement SANS accent ni caractère
// typographique : le jeu de caractères GSM-7 reste alors utilisé, ce qui tient
// en un seul segment de 160 caractères (70 seulement en Unicode). Un SMS = un
// segment = un seul coût, point sensible du pilote.
function buildCodeMessage(code, kind) {
  const label = kind === 'reinitialisation'
    ? 'reinitialisation de PIN'
    : (kind === 'activation' ? 'activation' : 'connexion');
  return 'Mangoo Connect+ : code ' + label + ' ' + code + '. Valable 10 min. Ne le partagez avec personne.';
}

/**
 * Envoie un SMS.
 * @param {{to:string, message:string}} opts
 * @returns {Promise<{ok:boolean, simulated?:boolean, id?:string, status?:string,
 *                    segments?:number, cost?:number, currency?:string, route?:string,
 *                    sandbox?:boolean, statusCode?:number, error?:string}>}
 */
async function sendSms(opts) {
  opts = opts || {};
  const to = toE164(opts.to || opts.phone);
  const text = String(opts.message || opts.text || '').trim();
  if (!to) return { ok: false, error: 'Numéro destinataire invalide.' };
  if (!text) return { ok: false, error: 'Message vide.' };

  if (!configured()) {
    console.log('[SMS:simulé] vers ' + to + ' — ' + text);
    return { ok: false, simulated: true, error: 'Passerelle SMS non configurée (ESMS_API_KEY absent).' };
  }

  const body = { to: to, text: text };
  const sender = senderId();
  if (sender) body.sender_id = sender;

  let res;
  try {
    res = await fetch(apiBase() + '/api/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + apiKey(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
  } catch (e) {
    return { ok: false, error: 'Réseau indisponible : ' + (e && e.message ? e.message : 'échec de connexion') };
  }

  const data = await res.json().catch(function () { return {}; });
  if (!res.ok) {
    const detail = data.message || data.error || data.detail || ('HTTP ' + res.status);
    return { ok: false, statusCode: res.status, error: 'eSMS : ' + detail };
  }

  return {
    ok: true,
    id: data.id || data.message_id || '',
    status: data.status || 'submitted',
    segments: Number(data.segments) || 0,
    cost: data.cost != null ? Number(data.cost) : null,
    currency: data.cost_currency || '',
    route: data.route || '',
    sandbox: sandbox()
  };
}

module.exports = {
  configured: configured,
  sandbox: sandbox,
  toE164: toE164,
  buildCodeMessage: buildCodeMessage,
  sendSms: sendSms
};
