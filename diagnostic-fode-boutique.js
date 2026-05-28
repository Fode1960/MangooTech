#!/usr/bin/env node

/**
 * Script de nettoyage et diagnostic pour le problème "Fodé boutique"
 * Ce script permet de:
 * 1. Identifier les données de boutique stockées dans le localStorage
 * 2. Nettoyer les données obsolètes
 * 3. Vérifier les boutiques par utilisateur
 */

import { createClient } from '@supabase/supabase-js'

// Configuration Supabase
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'

// Créer le client Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

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

// Fonction pour obtenir toutes les clés de localStorage pour un utilisateur
function getUserStorageKeys(userId = null) {
  const keys = [];
  
  // Clés génériques
  STORAGE_KEYS.forEach(key => {
    if (localStorage.getItem(key)) {
      keys.push(key);
    }
  });
  
  // Clés spécifiques à l'utilisateur
  if (userId) {
    const userSpecificKeys = [
      `mangoo-offline-shop-${userId}`,
      `mangoo-shop-status-${userId}`
    ];
    
    userSpecificKeys.forEach(key => {
      if (localStorage.getItem(key)) {
        keys.push(key);
      }
    });
  }
  
  return keys;
}

// Fonction pour analyser les données de localStorage
function analyzeLocalStorage(userId = null) {
  console.log('🔍 Analyse du localStorage...');
  
  const keys = getUserStorageKeys(userId);
  const data = {};
  
  keys.forEach(key => {
    try {
      const value = localStorage.getItem(key);
      if (value) {
        data[key] = JSON.parse(value);
        console.log(`📦 ${key}:`, data[key]);
      }
    } catch (error) {
      console.error(`❌ Erreur lors de la lecture de ${key}:`, error);
    }
  });
  
  // Recherche spécifique de "Fodé boutique"
  const fodeData = findFodeBoutique(data);
  if (fodeData) {
    console.log('🚨 DONNÉES "FODÉ BOUTIQUE" TROUVÉES:', fodeData);
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
    }
  }
  return null;
}

// Fonction pour nettoyer le localStorage
function clearLocalStorage(userId = null, clearAll = false) {
  console.log('🧹 Nettoyage du localStorage...');
  
  if (clearAll) {
    // Nettoyer toutes les clés
    STORAGE_KEYS.forEach(key => {
      localStorage.removeItem(key);
      console.log(`✅ Supprimé: ${key}`);
    });
    
    if (userId) {
      // Nettoyer les clés spécifiques à l'utilisateur
      localStorage.removeItem(`mangoo-offline-shop-${userId}`);
      localStorage.removeItem(`mangoo-shop-status-${userId}`);
      console.log(`✅ Supprimé: mangoo-offline-shop-${userId}`);
      console.log(`✅ Supprimé: mangoo-shop-status-${userId}`);
    }
  } else {
    // Nettoyer seulement les données "Fodé"
    const { data } = analyzeLocalStorage(userId);
    const fodeData = findFodeBoutique(data);
    
    if (fodeData) {
      localStorage.removeItem(fodeData.key);
      console.log(`✅ Supprimé: ${fodeData.key} (contenait "Fodé")`);
    }
  }
  
  console.log('🧹 Nettoyage terminé');
}

// Fonction pour récupérer les boutiques depuis Supabase
async function getShopsFromSupabase() {
  try {
    console.log('📊 Récupération des boutiques depuis Supabase...');
    
    const { data, error } = await supabase
      .from('shops')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (error) {
      console.error('❌ Erreur Supabase:', error);
      return null;
    }
    
    console.log(`✅ ${data.length} boutiques trouvées dans Supabase`);
    
    // Afficher les boutiques avec leurs propriétaires
    data.forEach(shop => {
      console.log(`🏪 ${shop.name} (ID: ${shop.id}, User: ${shop.user_id}, Status: ${shop.status})`);
    });
    
    return data;
  } catch (error) {
    console.error('❌ Exception:', error);
    return null;
  }
}

// Fonction principale
async function main() {
  console.log('🚀 Démarrage du diagnostic "Fodé Boutique"');
  console.log('=====================================');
  
  // Analyser le localStorage actuel
  console.log('\n📋 ÉTAPE 1: Analyse du localStorage');
  const analysis = analyzeLocalStorage();
  
  if (analysis.fodeFound) {
    console.log('\n🚨 ALERTE: Des données "Fodé" ont été trouvées !');
  } else {
    console.log('\n✅ Aucune donnée "Fodé" trouvée dans le localStorage');
  }
  
  // Récupérer les boutiques depuis Supabase
  console.log('\n📋 ÉTAPE 2: Vérification des données Supabase');
  const shops = await getShopsFromSupabase();
  
  if (shops) {
    // Rechercher "Fodé" dans les boutiques Supabase
    const fodeShops = shops.filter(shop => 
      shop.name && shop.name.toLowerCase().includes('fodé')
    );
    
    if (fodeShops.length > 0) {
      console.log('\n🚨 BOUTIQUES "FODÉ" DANS SUPABASE:');
      fodeShops.forEach(shop => {
        console.log(`   🏪 ${shop.name} (ID: ${shop.id}, User: ${shop.user_id})`);
      });
    }
  }
  
  // Proposer le nettoyage
  console.log('\n📋 ÉTAPE 3: Nettoyage');
  console.log('Options:');
  console.log('1. Nettoyer seulement les données "Fodé"');
  console.log('2. Nettoyer tout le localStorage des boutiques');
  console.log('3. Ne rien faire');
  
  // Pour ce script, on propose le nettoyage complet
  console.log('\n🧹 Nettoyage automatique des données obsolètes...');
  clearLocalStorage(null, true); // Nettoyer tout
  
  console.log('\n✅ Diagnostic terminé');
  console.log('\n💡 RECOMMANDATIONS:');
  console.log('- Rafraîchir la page de l\'application');
  console.log('- Se reconnecter avec chaque utilisateur');
  console.log('- Vérifier que chaque utilisateur voit bien sa propre boutique');
}

// Vérifier la configuration
if (!SUPABASE_URL.includes('your-project') && !SUPABASE_ANON_KEY.includes('your-anon-key')) {
  main().catch(console.error);
} else {
  console.log('⚠️  Configuration requise:');
  console.log('Veuillez définir les variables d\'environnement:');
  console.log('VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY');
  console.log('\nOu modifiez directement les variables dans ce script.');
}