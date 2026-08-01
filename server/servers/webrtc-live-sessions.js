// Module de gestion des sessions Live Shopping
// Stocke les sessions en mémoire (pas de persistance fichier)

/**
 * @typedef {Object} LiveSession
 * @property {string} vendorId
 * @property {Object} vendorWs
 * @property {Map<string, Object>} viewers - viewerId → { ws, userId, joinedAt }
 * @property {Array} products - produits mis en avant
 * @property {number} startedAt - timestamp
 */

/** @type {Map<string, LiveSession>} */
const liveSessions = new Map();

/**
 * Démarre une session live pour un vendeur
 */
export function startLiveSession(vendorId, vendorWs, products = []) {
  // Si une session existe déjà, on la remplace
  if (liveSessions.has(vendorId)) {
    endLiveSession(vendorId);
  }
  liveSessions.set(vendorId, {
    vendorId,
    vendorWs,
    viewers: new Map(),
    products,
    startedAt: Date.now()
  });
  console.log(`[LiveSessions] Session démarrée pour vendor ${vendorId} avec ${products.length} produit(s)`);
  return true;
}

/**
 * Arrête une session live
 */
export function endLiveSession(vendorId) {
  const session = liveSessions.get(vendorId);
  if (!session) return false;
  liveSessions.delete(vendorId);
  console.log(`[LiveSessions] Session terminée pour vendor ${vendorId} (${session.viewers.size} viewer(s))`);
  return true;
}

/**
 * Un client rejoint une session live
 */
export function joinLiveSession(vendorId, viewerWs, userId) {
  const session = liveSessions.get(vendorId);
  if (!session) return null;
  const viewerId = userId || ('viewer-' + Date.now());
  session.viewers.set(viewerId, {
    ws: viewerWs,
    userId: viewerId,
    joinedAt: Date.now()
  });
  console.log(`[LiveSessions] ${viewerId} a rejoint le live de ${vendorId} (total: ${session.viewers.size})`);
  return {
    session,
    viewerId,
    products: session.products,
    viewerCount: session.viewers.size,
    startedAt: session.startedAt
  };
}

/**
 * Un client quitte une session live
 */
export function leaveLiveSession(vendorId, userId) {
  const session = liveSessions.get(vendorId);
  if (!session) return false;
  let removed = false;
  for (const [id, viewer] of session.viewers) {
    if (viewer.userId === userId || id === userId) {
      session.viewers.delete(id);
      removed = true;
      break;
    }
  }
  if (removed) {
    console.log(`[LiveSessions] ${userId} a quitté le live de ${vendorId} (reste: ${session.viewers.size})`);
  }
  return { removed, viewerCount: session.viewers.size };
}

/**
 * Met à jour les produits d'une session live
 */
export function updateLiveProducts(vendorId, products) {
  const session = liveSessions.get(vendorId);
  if (!session) return false;
  session.products = products;
  console.log(`[LiveSessions] Produits mis à jour pour vendor ${vendorId}: ${products.length} produit(s)`);
  return true;
}

/**
 * Récupère une session live
 */
export function getLiveSession(vendorId) {
  return liveSessions.get(vendorId) || null;
}

/**
 * Vérifie si un vendeur est en live
 */
export function isVendorLive(vendorId) {
  return liveSessions.has(vendorId);
}

/**
 * Envoie un message à un viewer spécifique
 */
export function sendToViewer(vendorId, userId, message) {
  const session = liveSessions.get(vendorId);
  if (!session) return false;
  const viewer = session.viewers.get(userId);
  if (!viewer || viewer.ws.readyState !== 1) return false;
  try {
    viewer.ws.send(JSON.stringify(message));
    return true;
  } catch (e) {
    console.warn(`[LiveSessions] Erreur sendToViewer ${userId}:`, e.message);
    return false;
  }
}

/**
 * Diffuse un message à tous les viewers d'une session
 */
export function broadcastToLiveViewers(vendorId, message, excludeUserId = null) {
  const session = liveSessions.get(vendorId);
  if (!session) return;
  const msgStr = JSON.stringify(message);
  for (const [id, viewer] of session.viewers) {
    if (id === excludeUserId || viewer.userId === excludeUserId) continue;
    try {
      if (viewer.ws.readyState === 1) { // WebSocket.OPEN
        viewer.ws.send(msgStr);
      }
    } catch (e) {
      console.warn(`[LiveSessions] Erreur broadcast vers ${id}:`, e.message);
    }
  }
}

/**
 * Récupère le résumé d'une session (pour le statut public)
 */
export function getLiveSessionSummary(vendorId) {
  const session = liveSessions.get(vendorId);
  if (!session) return null;
  return {
    vendorId: session.vendorId,
    viewerCount: session.viewers.size,
    productCount: session.products.length,
    products: session.products.map(p => ({
      name: p.name || '',
      price: p.price || 0,
      img: p.img || p.photo || ''
    })),
    startedAt: session.startedAt
  };
}

/**
 * Nettoie les sessions d'un viewer (utilisé quand le viewer se déconnecte)
 */
export function removeViewerFromAllSessions(userId) {
  for (const [vendorId, session] of liveSessions) {
    for (const [id, viewer] of session.viewers) {
      if (viewer.userId === userId || id === userId) {
        session.viewers.delete(id);
        console.log(`[LiveSessions] Viewer ${userId} retiré du live ${vendorId}`);
        break;
      }
    }
  }
}

/**
 * Retourne la liste de tous les vendors actuellement en live
 */
export function getAllActiveLiveVendors() {
  const vendors = [];
  for (const [vendorId, session] of liveSessions) {
    vendors.push({
      vendorId,
      vendorName: session.vendorName || '',
      vendorSlug: session.vendorSlug || '',
      products: session.products || [],
      viewerCount: session.viewers.size
    });
  }
  return vendors;
}

export default {
  startLiveSession,
  endLiveSession,
  joinLiveSession,
  leaveLiveSession,
  updateLiveProducts,
  getLiveSession,
  isVendorLive,
  broadcastToLiveViewers,
  getLiveSessionSummary,
  removeViewerFromAllSessions,
  getAllActiveLiveVendors
};
