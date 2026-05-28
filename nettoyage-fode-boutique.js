#!/usr/bin/env node

/**
 * Script de nettoyage complet pour éliminer le problème "Fodé boutique"
 * Ce script nettoie toutes les références à "Fodé" ou "DAN" dans le localStorage
 */

// Clés de stockage à vérifier
const STORAGE_KEYS = [
  'mangoo-offline-shop',
  'mangoo-shop-status',
  'currentShop',
  'selectedShop',
  'shopData',
  'offlineShop',
  'mangoo-shop-settings',
  'mangoo-shop-status',
  'seller-shop-data',
  'shop-cache',
  'boutique-data',
  'fode-shop-data'
];

// Fonction pour obtenir toutes les clés de localStorage
function getAllStorageKeys() {
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) {
    keys.push(localStorage.key(i));
  }
  return keys;
}

// Fonction pour rechercher des patterns dans les clés
function findShopRelatedKeys() {
  const allKeys = getAllStorageKeys();
  const shopKeys = [];
  
  // Rechercher par pattern
  const patterns = [
    /shop/i,
    /boutique/i,
    /mangoo/i,
    /seller/i,
    /dan/i,
    /fode/i,
    /store/i
  ];
  
  allKeys.forEach(key => {
    if (patterns.some(pattern => pattern.test(key))) {
      shopKeys.push(key);
    }
  });
  
  return [...new Set([...STORAGE_KEYS, ...shopKeys])]; // Éviter les doublons
}

// Fonction pour analyser une clé et détecter "Fodé" ou "DAN"
function analyzeKey(key) {
  try {
    const value = localStorage.getItem(key);
    if (!value) return null;
    
    const data = JSON.parse(value);
    const issues = [];
    
    // Fonction récursive pour chercher "Fodé" ou "DAN"
    function checkForIssues(obj, path = '') {
      for (const [prop, val] of Object.entries(obj)) {
        const currentPath = path ? `${path}.${prop}` : prop;
        
        if (typeof val === 'string') {
          const lowerVal = val.toLowerCase();
          
          // Détecter "Fodé" ou variantes
          if (lowerVal.includes('fodé') || lowerVal.includes('fode')) {
            issues.push({
              type: 'fode',
              path: currentPath,
              value: val,
              severity: 'critical'
            });
          }
          
          // Détecter "DAN" ou variantes
          if (lowerVal === 'dan' || lowerVal.includes('boutique dan') || lowerVal.includes('dan boutique')) {
            issues.push({
              type: 'dan',
              path: currentPath,
              value: val,
              severity: 'high'
            });
          }
          
          // Détecter les emails ou URLs suspects
          if (lowerVal.includes('dan@') || lowerVal.includes('boutique.dan') || lowerVal.includes('fode@')) {
            issues.push({
              type: 'suspicious_contact',
              path: currentPath,
              value: val,
              severity: 'medium'
            });
          }
        } else if (typeof val === 'object' && val !== null) {
          checkForIssues(val, currentPath);
        }
      }
    }
    
    if (typeof data === 'object' && data !== null) {
      checkForIssues(data);
    } else if (typeof data === 'string') {
      const lowerData = data.toLowerCase();
      if (lowerData.includes('fodé') || lowerData.includes('fode')) {
        issues.push({
          type: 'fode',
          path: 'value',
          value: data,
          severity: 'critical'
        });
      }
      if (lowerData === 'dan' || lowerData.includes('boutique dan')) {
        issues.push({
          type: 'dan',
          path: 'value',
          value: data,
          severity: 'high'
        });
      }
    }
    
    return {
      key,
      data,
      issues,
      hasIssues: issues.length > 0,
      issueCount: issues.length
    };
  } catch (error) {
    return {
      key,
      data: null,
      issues: [{ type: 'parse_error', path: '', value: error.message, severity: 'low' }],
      hasIssues: true,
      issueCount: 1
    };
  }
}

// Fonction pour supprimer une clé
function deleteKey(key) {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Erreur lors de la suppression de ${key}:`, error);
    return false;
  }
}

// Fonction pour nettoyer une clé (supprimer uniquement les propriétés problématiques)
function cleanKey(key, analysis) {
  try {
    if (!analysis.hasIssues) return true;
    
    let data = analysis.data;
    
    // Pour chaque issue, on va essayer de nettoyer
    analysis.issues.forEach(issue => {
      if (issue.type === 'fode' || issue.type === 'dan' || issue.type === 'suspicious_contact') {
        // Pour les strings problématiques, on les vide
        if (issue.path.includes('.')) {
          // Propriété imbriquée - complexe à nettoyer sans risque
          console.warn(`Propriété imbriquée problématique détectée: ${issue.path}`);
        } else {
          // Propriété de premier niveau
          if (data.hasOwnProperty(issue.path)) {
            data[issue.path] = ''; // Vider la valeur problématique
          }
        }
      }
    });
    
    // Sauvegarder les données nettoyées
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error(`Erreur lors du nettoyage de ${key}:`, error);
    return false;
  }
}

// Fonction principale de nettoyage
function performCleanup() {
  console.log('🧹 Démarrage du nettoyage complet...\n');
  
  const shopKeys = findShopRelatedKeys();
  console.log(`📊 ${shopKeys.length} clés potentiellement liées aux boutiques trouvées`);
  
  let totalIssues = 0;
  let deletedKeys = 0;
  let cleanedKeys = 0;
  let failedKeys = 0;
  
  const report = {
    fode: 0,
    dan: 0,
    suspicious_contact: 0,
    parse_error: 0
  };
  
  // Analyser chaque clé
  shopKeys.forEach(key => {
    console.log(`\n🔍 Analyse de: ${key}`);
    const analysis = analyzeKey(key);
    
    if (!analysis) {
      console.log(`  ❌ Clé vide ou invalide`);
      return;
    }
    
    if (analysis.hasIssues) {
      console.log(`  🚨 ${analysis.issueCount} problème(s) détecté(s):`);
      
      analysis.issues.forEach(issue => {
        console.log(`    - ${issue.type.toUpperCase()}: ${issue.path} = "${issue.value}"`);
        report[issue.type]++;
        totalIssues++;
      });
      
      // Décider de l'action à prendre
      if (analysis.issueCount >= 3 || analysis.issues.some(i => i.severity === 'critical')) {
        // Supprimer complètement la clé si trop de problèmes ou problème critique
        console.log(`  🗑️ Suppression complète de la clé`);
        if (deleteKey(key)) {
          deletedKeys++;
          console.log(`  ✅ Clé supprimée`);
        } else {
          failedKeys++;
          console.log(`  ❌ Échec de la suppression`);
        }
      } else {
        // Nettoyer la clé
        console.log(`  🧹 Nettoyage de la clé`);
        if (cleanKey(key, analysis)) {
          cleanedKeys++;
          console.log(`  ✅ Clé nettoyée`);
        } else {
          // Si le nettoyage échoue, supprimer la clé
          console.log(`  🗑️ Suppression de la clé (nettoyage échoué)`);
          if (deleteKey(key)) {
            deletedKeys++;
            console.log(`  ✅ Clé supprimée`);
          } else {
            failedKeys++;
            console.log(`  ❌ Échec de la suppression`);
          }
        }
      }
    } else {
      console.log(`  ✅ Aucun problème détecté`);
    }
  });
  
  // Afficher le rapport final
  console.log('\n' + '='.repeat(50));
  console.log('📊 RAPPORT DE NETTOYAGE');
  console.log('='.repeat(50));
  console.log(`Total de clés analysées: ${shopKeys.length}`);
  console.log(`Total de problèmes trouvés: ${totalIssues}`);
  console.log(`Clés supprimées: ${deletedKeys}`);
  console.log(`Clés nettoyées: ${cleanedKeys}`);
  console.log(`Échecs: ${failedKeys}`);
  console.log('\nDétail des problèmes:');
  console.log(`  - "Fodé" détecté: ${report.fode} fois`);
  console.log(`  - "DAN" détecté: ${report.dan} fois`);
  console.log(`  - Contacts suspects: ${report.suspicious_contact} fois`);
  console.log(`  - Erreurs de parsing: ${report.parse_error} fois`);
  
  if (totalIssues === 0) {
    console.log('\n✅ Aucun problème "Fodé" ou "DAN" détecté !');
  } else {
    console.log('\n🎉 Nettoyage terminé avec succès !');
    console.log('\n💡 Recommandations:');
    console.log('- Rafraîchir la page de l\'application');
    console.log('- Tester avec différents utilisateurs');
    console.log('- Vérifier que chaque utilisateur voit sa propre boutique');
  }
}

// Vérifier l'environnement
if (typeof localStorage === 'undefined') {
  console.error('❌ Ce script doit être exécuté dans un navigateur avec localStorage');
} else {
  // Lancer le nettoyage
  performCleanup();
}