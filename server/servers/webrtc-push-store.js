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
 */
export function saveSubscription(vendorId, subscription) {
  const store = readStore();
  if (!store[vendorId]) store[vendorId] = [];
  // Éviter les doublons (même endpoint)
  const idx = store[vendorId].findIndex(s => s.endpoint === subscription.endpoint);
  if (idx >= 0) {
    store[vendorId][idx] = { ...subscription, updatedAt: new Date().toISOString() };
  } else {
    store[vendorId].push({ ...subscription, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  }
  writeStore(store);
  console.log(`[PushStore] Souscription sauvegardée pour vendor ${vendorId} (total: ${store[vendorId].length})`);
  return true;
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
