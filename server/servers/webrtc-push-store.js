// Store des souscriptions Push pour les notifications d'appel entrant
import fs from 'fs';
import path from 'path';

const STORE_PATH = path.join(process.cwd(), 'server', 'data', 'push-subscriptions.json');

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
 * Ajoute ou met à jour une souscription push pour un vendorId
 * @returns {{ ok: boolean, isNew: boolean }}
 */
export function saveSubscription(vendorId, subscription) {
  const store = readStore();
  const oldCount = store[vendorId] ? store[vendorId].length : 0;
  // Remplacer TOUTES les anciennes souscriptions pour ce vendor
  // Évite les doublons de push quand plusieurs souscriptions s'accumulent
  store[vendorId] = [{ ...subscription, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }];
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
 * Récupère toutes les souscriptions d'un vendorId
 */
export function getSubscriptions(vendorId) {
  const store = readStore();
  return store[vendorId] || [];
}

/**
 * Vérifie si un vendor a au moins une souscription push
 */
export function hasPushSubscription(vendorId) {
  const subs = getSubscriptions(vendorId);
  return subs.length > 0;
}

export default { saveSubscription, removeSubscription, getSubscriptions, hasPushSubscription };
