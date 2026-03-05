/**
 * Script de correction pour les redirections automatiques de port
 * 
 * Ce script résout le problème où le navigateur redirige automatiquement
 * vers les ports 3001 ou 3003 au lieu de 3002
 */

console.log('🔧 === CORRECTION DES REDIRECTIONS DE PORT ===');

// 1. Vérifier les processus qui utilisent les ports problématiques
function checkPortUsage() {
  console.log('\n📊 Vérification des ports...');
  
  // Simuler la vérification (à exécuter manuellement dans le terminal)
  console.log('Commandes à exécuter dans le terminal:');
  console.log('netstat -ano | findstr :3001');
  console.log('netstat -ano | findstr :3003');
  console.log('netstat -ano | findstr :3001');
}

// 2. Forcer l'utilisation du port 3001
function forceCorrectPort() {
  console.log('\n🎯 Forçage du port 3001...');
  
  // Vérifier l'URL actuelle
  const currentUrl = window.location.href;
  console.log('URL actuelle:', currentUrl);
  
  // Corriger automatiquement si nécessaire
  if (currentUrl.includes(':3001') || currentUrl.includes(':3003')) {
    const correctedUrl = currentUrl.replace(/:300[13]/g, ':3001');
    console.log('🔄 Redirection vers:', correctedUrl);
    window.location.href = correctedUrl;
    return true;
  }
  
  return false;
}

// 3. Surveiller et corriger les redirections automatiques
function monitorRedirections() {
  console.log('\n👁️ Surveillance des redirections...');
  
  // Intercepter les changements d'URL
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;
  
  history.pushState = function(state, title, url) {
    if (url && (url.includes(':3001') || url.includes(':3003'))) {
      console.warn('🚫 Redirection bloquée vers:', url);
      url = url.replace(/:300[13]/g, ':3001');
      console.log('✅ Corrigée vers:', url);
    }
    return originalPushState.call(this, state, title, url);
  };
  
  history.replaceState = function(state, title, url) {
    if (url && (url.includes(':3001') || url.includes(':3003'))) {
      console.warn('🚫 Redirection bloquée vers:', url);
      url = url.replace(/:300[13]/g, ':3001');
      console.log('✅ Corrigée vers:', url);
    }
    return originalReplaceState.call(this, state, title, url);
  };
  
  // Surveiller les changements de location
  let lastUrl = window.location.href;
  setInterval(() => {
    const currentUrl = window.location.href;
    if (currentUrl !== lastUrl) {
      if (currentUrl.includes(':3001') || currentUrl.includes(':3003')) {
        console.warn('🚫 Changement d\'URL détecté vers port incorrect:', currentUrl);
        const correctedUrl = currentUrl.replace(/:300[13]/g, ':3001');
        console.log('🔄 Correction automatique vers:', correctedUrl);
        window.location.href = correctedUrl;
      }
      lastUrl = currentUrl;
    }
  }, 1000);
}

// 4. Nettoyer le cache du navigateur
function clearBrowserCache() {
  console.log('\n🧹 Instructions pour nettoyer le cache:');
  console.log('1. Appuyez sur Ctrl+Shift+Delete');
  console.log('2. Sélectionnez "Images et fichiers en cache"');
  console.log('3. Cliquez sur "Effacer les données"');
  console.log('4. Ou utilisez Ctrl+F5 pour un rechargement forcé');
}

// 5. Vérifier la configuration Vite
function checkViteConfig() {
  console.log('\n⚙️ Vérification de la configuration Vite...');
  console.log('Le serveur Vite devrait être configuré sur le port 3001');
  console.log('Vérifiez vite.config.js: server.port = 3002');
}

// 6. Solution complète
function fixPortRedirection() {
  console.log('🚀 Démarrage de la correction complète...');
  
  checkPortUsage();
  
  // Correction immédiate si nécessaire
  if (typeof window !== 'undefined') {
    const redirected = forceCorrectPort();
    if (!redirected) {
      monitorRedirections();
      console.log('✅ Surveillance active des redirections');
    }
  }
  
  clearBrowserCache();
  checkViteConfig();
  
  console.log('\n📋 Actions recommandées:');
  console.log('1. Fermez tous les onglets du navigateur');
  console.log('2. Redémarrez le navigateur');
  console.log('3. Ouvrez directement http://localhost:3001');
  console.log('4. Si le problème persiste, redémarrez le serveur Vite');
}

// Exécution automatique si dans le navigateur
if (typeof window !== 'undefined') {
  fixPortRedirection();
} else {
  console.log('Script prêt. Copiez-collez dans la console du navigateur.');
}

// Export pour utilisation en module
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    fixPortRedirection,
    forceCorrectPort,
    monitorRedirections,
    checkPortUsage
  };
}