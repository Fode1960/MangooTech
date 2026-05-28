#!/usr/bin/env node

/**
 * Script de diagnostic LOCAL pour le problème "Fodé boutique"
 * Ce script analyse uniquement le localStorage sans connexion Supabase
 */

// Clés de stockage utilisées dans l'application
const STORAGE_KEYS = [
  'mangoo-offline-shop',
  'mangoo-shop-status',
  'currentShop',
  'selectedShop',
  'shopData',
  'offlineShop',
  'mangoo-shop-settings'
];

// Fonction pour obtenir toutes les clés de localStorage
function getAllStorageKeys() {
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) {
    keys.push(localStorage.key(i));
  }
  return keys;
}

// Fonction pour obtenir les clés de stockage liées aux boutiques
function getShopStorageKeys() {
  const keys = [];
  const allKeys = getAllStorageKeys();
  
  // Rechercher les clés standards
  STORAGE_KEYS.forEach(key => {
    if (localStorage.getItem(key)) {
      keys.push(key);
    }
  });
  
  // Rechercher les clés utilisateur spécifiques (pattern: mangoo-offline-shop-USER_ID)
  allKeys.forEach(key => {
    if (key && key.includes('mangoo') && key.includes('shop')) {
      if (!keys.includes(key)) {
        keys.push(key);
      }
    }
  });
  
  return keys;
}

// Fonction pour analyser les données de localStorage
function analyzeLocalStorage() {
  console.log('🔍 Analyse du localStorage...');
  
  const keys = getShopStorageKeys();
  const data = {};
  
  console.log(`📦 Clés trouvées: ${keys.length}`);
  
  keys.forEach(key => {
    try {
      const value = localStorage.getItem(key);
      if (value) {
        data[key] = JSON.parse(value);
        console.log(`\n📋 ${key}:`);
        console.log(`   Type: ${typeof data[key]}`);
        
        if (data[key] && typeof data[key] === 'object') {
          // Afficher les propriétés importantes
          if (data[key].name) console.log(`   Nom: ${data[key].name}`);
          if (data[key].id) console.log(`   ID: ${data[key].id}`);
          if (data[key].user_id) console.log(`   User ID: ${data[key].user_id}`);
          if (data[key].status) console.log(`   Status: ${data[key].status}`);
        }
      }
    } catch (error) {
      console.error(`❌ Erreur lors de la lecture de ${key}:`, error);
    }
  });
  
  // Recherche spécifique de "Fodé boutique"
  const fodeData = findFodeBoutique(data);
  if (fodeData) {
    console.log('\n🚨 DONNÉES "FODÉ BOUTIQUE" TROUVÉES:');
    console.log(`   Clé: ${fodeData.key}`);
    console.log(`   Propriété: ${fodeData.property}`);
    console.log(`   Valeur: ${fodeData.value}`);
    console.log('   Données complètes:', fodeData.fullData);
  }
  
  return { keys, data, fodeFound: !!fodeData };
}

// Fonction pour rechercher "Fodé boutique" dans les données
function findFodeBoutique(data) {
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'object' && value !== null) {
      // Rechercher dans les propriétés de l'objet
      for (const [prop, propValue] of Object.entries(value)) {
        if (typeof propValue === 'string' && propValue.toLowerCase().includes('fodé')) {
          return { key, property: prop, value: propValue, fullData: value };
        }
      }
    } else if (typeof value === 'string' && value.toLowerCase().includes('fodé')) {
      return { key, property: 'value', value, fullData: value };
    }
  }
  return null;
}

// Fonction pour afficher les détails d'une clé spécifique
function showKeyDetails(keyName) {
  console.log(`\n🔍 Détails pour la clé: ${keyName}`);
  
  try {
    const value = localStorage.getItem(keyName);
    if (!value) {
      console.log('❌ Clé non trouvée');
      return;
    }
    
    const data = JSON.parse(value);
    console.log('📋 Contenu:', data);
    
    // Rechercher "Fodé" dans ce contenu
    const fodeInKey = findFodeBoutique({ [keyName]: data });
    if (fodeInKey) {
      console.log('🚨 "Fodé" trouvé dans cette clé!');
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

// Fonction pour nettoyer les données "Fodé"
function cleanFodeData() {
  console.log('\n🧹 Nettoyage des données "Fodé"...');
  
  const { data } = analyzeLocalStorage();
  const fodeData = findFodeBoutique(data);
  
  if (fodeData) {
    console.log(`\n🗑️  Suppression de la clé: ${fodeData.key}`);
    localStorage.removeItem(fodeData.key);
    console.log('✅ Données "Fodé" supprimées');
  } else {
    console.log('ℹ️  Aucune donnée "Fodé" trouvée à supprimer');
  }
}

// Fonction pour nettoyer TOUTES les données de boutique
function cleanAllShopData() {
  console.log('\n🧹 Nettoyage COMPLET des données de boutique...');
  
  const keys = getShopStorageKeys();
  console.log(`🗑️  Suppression de ${keys.length} clés...`);
  
  keys.forEach(key => {
    localStorage.removeItem(key);
    console.log(`✅ Supprimé: ${key}`);
  });
  
  console.log('✅ Nettoyage terminé');
}

// Fonction principale
function main() {
  console.log('🚀 Démarrage du diagnostic LOCAL "Fodé Boutique"');
  console.log('==============================================');
  
  // Vérifier qu'on est dans un environnement avec localStorage
  if (typeof localStorage === 'undefined') {
    console.log('❌ Ce script doit être exécuté dans un navigateur ou un environnement avec localStorage');
    return;
  }
  
  // Étape 1: Analyse complète
  console.log('\n📋 ÉTAPE 1: Analyse complète du localStorage');
  const analysis = analyzeLocalStorage();
  
  if (analysis.fodeFound) {
    console.log('\n🚨 ALERTE: Des données "Fodé" ont été trouvées !');
  } else {
    console.log('\n✅ Aucune donnée "Fodé" trouvée dans le localStorage');
  }
  
  // Étape 2: Menu d'actions
  console.log('\n📋 ÉTAPE 2: Actions disponibles');
  console.log('1. Afficher les détails d\'une clé spécifique');
  console.log('2. Nettoyer seulement les données "Fodé"');
  console.log('3. Nettoyer TOUTES les données de boutique');
  console.log('4. Quitter');
  
  // Pour un script Node.js, on exécute automatiquement le nettoyage complet
  console.log('\n🧹 Nettoyage automatique des données de boutique...');
  cleanAllShopData();
  
  console.log('\n✅ Diagnostic terminé');
  console.log('\n💡 RECOMMANDATIONS:');
  console.log('- Rafraîchir la page de l\'application');
  console.log('- Se reconnecter avec chaque utilisateur');
  console.log('- Vérifier que chaque utilisateur voit bien sa propre boutique');
}

// Lancer le diagnostic
main();