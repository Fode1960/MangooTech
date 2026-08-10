// Store des souscriptions Push pour les notifications d'appel entrant
// Version robuste : tolère les changements de tunnel Cloudflare (stale flag au lieu de delete)
import fs from 'fs';
import path from 'path';

const STORE_PATH = path.join(process.cwd(), 'server', 'data', 'push-subscriptions.json');
const STALE_GRACE_MS = 7 * 24 * 60 * 60 * 1000; // 7 jours de grâce avant suppression définitive

function readStore() {
  try {
    if (!fs.existsSync(STORE_PATH)) return {};
    const raw = fs.readFileSync(STORE_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function writeStore(data) {
  const dir = path.dirname(STORE_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const tmp = STORE_PATH + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tmp, STORE_PATH);
}

/**
 * Nettoie les souscriptions stale expirées (au-delà du délai de grâce)
 */
function purgeExpiredStale(store) {
  let changed = false;
  const now = Date.now();
  for (const vendorId of Object.keys(store)) {
    store[vendorId] = store[vendorId].filter(sub => {
      if (sub.stale && sub.staleAt) {
        const age = now - new Date(sub.staleAt).getTime();
        if (age > STALE_GRACE_MS) {
          console.log(`[PushStore] Souscription stale expirée pour vendor ${vendorId} (${Math.round(age / 86400000)}j)`);
          changed = true;
          return false;
        }
      }
      return true;
    });
    if (store[vendorId].length === 0) {
      delete store[vendorId];
      changed = true;
    }
  }
  return changed;
}

/**
 * Ajoute ou met à jour une souscription push pour un vendorId
 * @returns {{ ok: boolean, isNew: boolean }}
 */
export function saveSubscription(vendorId, subscription) {
  const store = readStore();
  const oldCount = store[vendorId] ? store[vendorId].length : 0;
  // Remplacer TOUTES les anciennes souscriptions pour ce vendor
  // Évite les doublons de push quand plusieurs souscriptions s'accumulent
  // Retirer le flag stale (le vendor vient de s'enregistrer → la souscription est fraîche)
  const { stale, staleAt, ...cleanSub } = subscription;
  store[vendorId] = [{ ...cleanSub, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }];
  purgeExpiredStale(store);
  writeStore(store);
  console.log(`[PushStore] Souscription sauvegardée pour vendor ${vendorId} (${oldCount} anciennes remplacées, total: 1)`);
  return { ok: true, isNew: true };
}

/**
 * Supprime une souscription push pour un vendorId
 */
export function removeSubscription(vendorId, endpoint) {
  const store = readStore();
  if (!store[vendorId]) return false;
  const before = store[vendorId].length;
  store[vendorId] = store[vendorId].filter(s => s.endpoint !== endpoint);
  if (store[vendorId].length === 0) delete store[vendorId];
  writeStore(store);
  console.log(`[PushStore] Souscription supprimée pour vendor ${vendorId} (${before - (store[vendorId] ? store[vendorId].length : 0)} retirées)`);
  return true;
}

/**
 * Marque une souscription comme stale (tunnel expiré) sans la supprimer.
 * Le vendor pourra la remplacer en se reconnectant.
 */
export function markStale(vendorId, endpoint) {
  const store = readStore();
  if (!store[vendorId]) return false;
  let marked = false;
  for (const sub of store[vendorId]) {
    if (sub.endpoint === endpoint && !sub.stale) {
      sub.stale = true;
      sub.staleAt = new Date().toISOString();
      marked = true;
    }
  }
  if (marked) {
    writeStore(store);
    console.log(`[PushStore] Souscription marquée stale pour vendor ${vendorId} (conservée, sera remplacée à la reconnexion)`);
  }
  return marked;
}

/**
 * Récupère les souscriptions ACTIVES (non-stale) d'un vendorId
 */
export function getSubscriptions(vendorId) {
  const store = readStore();
  const subs = store[vendorId] || [];
  // Ne retourner que les souscriptions non-stale
  return subs.filter(s => !s.stale);
}

/**
 * Récupère TOUTES les souscriptions (y compris stale) d'un vendorId
 */
export function getAllSubscriptions(vendorId) {
  const store = readStore();
  return store[vendorId] || [];
}

/**
 * Vérifie si un vendor a au moins une souscription push ACTIVE
 */
export function hasPushSubscription(vendorId) {
  const subs = getSubscriptions(vendorId);
  return subs.length > 0;
}

export default { saveSubscription, removeSubscription, getSubscriptions, getAllSubscriptions, markStale, hasPushSubscription };
