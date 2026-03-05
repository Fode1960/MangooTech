// Fonction pour générer un UUID v4 simple
export function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Fonction pour générer un ID d'utilisateur anonyme
export function generateAnonymousUserId() {
  return generateUUID(); // Retourne un UUID pur sans préfixe pour PostgreSQL
}

// Fonction pour obtenir ou créer un ID utilisateur
export function getOrCreateUserId() {
  // Vérifier si on a déjà un ID dans le localStorage
  let userId = localStorage.getItem('anonymous_user_id');
  
  // Si l'ID existe mais contient le préfixe "anon_", le supprimer
  if (userId && userId.startsWith('anon_')) {
    console.log(`🗑️ Suppression de l'ancien ID avec préfixe: ${userId}`);
    localStorage.removeItem('anonymous_user_id');
    userId = null;
  }
  
  if (!userId) {
    // Créer un nouvel ID anonyme
    userId = generateAnonymousUserId();
    localStorage.setItem('anonymous_user_id', userId);
    console.log(`🆕 Nouvel ID utilisateur anonyme créé: ${userId}`);
  } else {
    console.log(`📋 ID utilisateur anonyme existant: ${userId}`);
  }
  
  return userId;
}

// Fonction pour récupérer l'ID utilisateur actuel (connecté ou anonyme)
export function getCurrentUserId() {
  // Pour l'instant, on utilise toujours un ID anonyme
  // Plus tard, on pourra vérifier si l'utilisateur est connecté
  return getOrCreateUserId();
}