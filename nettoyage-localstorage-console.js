
// Script de nettoyage localStorage pour le navigateur
// À exécuter dans la console de développement (F12)

(function() {
  console.log('🧹 Démarrage du nettoyage localStorage...');
  
  const contaminationTerms = ["Fodé Boutique","Fode Boutique","Boutique DAN","Boutique Demo","boutique-dan","contact@boutique-dan.com","https://boutique-dan.com"];
  const contaminatedKeys = ["mangoo-offline-shop","mangoo-shop-status","mangoo-shop-settings","currentShop","selectedShop","shopData","offlineShop"];
  
  let cleanedCount = 0;
  let contaminatedCount = 0;
  
  // Fonction pour vérifier si une valeur est contaminée
  function isContaminated(value) {
    if (!value) return false;
    const str = typeof value === 'string' ? value : JSON.stringify(value);
    return contaminationTerms.some(term => str.includes(term));
  }
  
  // 1. Nettoyer les clés spécifiques connues
  console.log('🔍 Analyse des clés spécifiques...');
  contaminatedKeys.forEach(key => {
    try {
      const value = localStorage.getItem(key);
      if (value) {
        if (isContaminated(value)) {
          console.log(`🚨 Clé contaminée trouvée: ${key}`);
          console.log(`🗑️ Suppression: ${key}`);
          localStorage.removeItem(key);
          cleanedCount++;
        }
      }
    } catch (e) {
      console.error(`❌ Erreur lors du traitement de ${key}:`, e);
    }
  });
  
  // 2. Analyser toutes les clés pour détecter la contamination
  console.log('🔍 Analyse complète de toutes les clés localStorage...');
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    try {
      const value = localStorage.getItem(key);
      if (value && isContaminated(value)) {
        contaminatedCount++;
        console.log(`🚨 Données contaminées trouvées dans: ${key}`);
        console.log(`🗑️ Suppression: ${key}`);
        localStorage.removeItem(key);
        cleanedCount++;
      }
    } catch (e) {
      console.error(`❌ Erreur lors du traitement de ${key}:`, e);
    }
  }
  
  // 3. Nettoyer les clés utilisateur spécifiques
  console.log('🔍 Recherche des clés utilisateur contaminées...');
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.includes('mangoo-offline-shop-') || key.includes('mangoo-shop-status-')) {
      try {
        const value = localStorage.getItem(key);
        if (value && isContaminated(value)) {
          console.log(`🚨 Clé utilisateur contaminée: ${key}`);
          console.log(`🗑️ Suppression: ${key}`);
          localStorage.removeItem(key);
          cleanedCount++;
        }
      } catch (e) {
        console.error(`❌ Erreur lors du traitement de ${key}:`, e);
      }
    }
  }
  
  console.log(`✅ Nettoyage terminé! ${cleanedCount} éléments supprimés.`);
  console.log(`📊 ${contaminatedCount} éléments contaminés détectés.`);
  
  // 4. Vérification finale
  console.log('🔍 Vérification finale...');
  let remainingContamination = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    try {
      const value = localStorage.getItem(key);
      if (value && isContaminated(value)) {
        remainingContamination++;
        console.warn(`⚠️ Contamination restante dans: ${key}`);
      }
    } catch (e) {
      // Ignorer
    }
  }
  
  if (remainingContamination === 0) {
    console.log('🎉 localStorage complètement nettoyé!');
  } else {
    console.warn(`⚠️ ${remainingContamination} éléments contaminants restants.`);
  }
  
  return {
    cleanedCount,
    contaminatedCount,
    remainingContamination,
    totalKeys: localStorage.length
  };
})();
