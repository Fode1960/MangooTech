// Client Push Notifications pour MangooTech
// Gère l'abonnement aux notifications push pour les appels entrants

const VAPID_PUBLIC_KEY = 'BIpDGUhhSkE0vdY6iCow8ip9q9Q4SMbp5Vs3CaVtTaisN33UcPy33DNOT4Cro2qssssf2deONVTwG7WCAVidcAY';
const PUSH_SERVER = '/webrtc-ws'; // Le serveur WebSocket 3008 sert aussi les endpoints HTTP

/**
 * Convertit une clé base64 en Uint8Array pour l'API Push
 */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Vérifie si les notifications push sont supportées
 */
export function isPushSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window;
}

/**
 * Demande la permission de notification et s'abonne au push
 * @param {string} vendorId - L'ID du vendeur à associer
 * @returns {Promise<PushSubscription|null>}
 */
export async function subscribeToPush(vendorId) {
  if (!isPushSupported()) {
    console.log('[PushClient] Push non supporté sur ce navigateur');
    return null;
  }

  try {
    // Demander la permission de notification
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('[PushClient] Permission de notification refusée');
      return null;
    }

    // Attendre que le service worker soit prêt
    const registration = await navigator.serviceWorker.ready;

    // S'abonner au push
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    });

    console.log('[PushClient] Abonnement push réussi:', subscription.endpoint);

    // Envoyer la souscription au serveur
    await saveSubscriptionToServer(vendorId, subscription);

    return subscription;
  } catch (error) {
    console.error('[PushClient] Erreur abonnement push:', error);
    return null;
  }
}

/**
 * Se désabonner des notifications push
 */
export async function unsubscribeFromPush(vendorId) {
  if (!isPushSupported()) return;

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await subscription.unsubscribe();
      await removeSubscriptionFromServer(vendorId, subscription.endpoint);
      console.log('[PushClient] Désabonnement push réussi');
    }
  } catch (error) {
    console.error('[PushClient] Erreur désabonnement push:', error);
  }
}

/**
 * Vérifie si déjà abonné
 */
export async function isSubscribed() {
  if (!isPushSupported()) return false;
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return subscription !== null;
  } catch {
    return false;
  }
}

/**
 * Sauvegarde la souscription côté serveur
 */
async function saveSubscriptionToServer(vendorId, subscription) {
  try {
    const res = await fetch(`${PUSH_SERVER}/push/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vendorId,
        subscription: subscription.toJSON()
      })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    console.log('[PushClient] Souscription sauvegardée côté serveur');
  } catch (error) {
    console.error('[PushClient] Erreur sauvegarde serveur:', error);
  }
}

/**
 * Supprime la souscription côté serveur
 */
async function removeSubscriptionFromServer(vendorId, endpoint) {
  try {
    await fetch(`${PUSH_SERVER}/push/unsubscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vendorId, endpoint })
    });
  } catch (error) {
    console.error('[PushClient] Erreur suppression serveur:', error);
  }
}

/**
 * Récupère la clé publique VAPID
 */
export function getVapidPublicKey() {
  return VAPID_PUBLIC_KEY;
}
