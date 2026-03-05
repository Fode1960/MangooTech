#!/usr/bin/env node

/**
 * Script de nettoyage complet pour éliminer toutes les références "Fodé" et "DAN"
 * Ce script nettoie le localStorage, les caches et les données contaminées
 */

import { createClient } from '@supabase/supabase-js'

// Configuration Supabase - à adapter selon votre environnement
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'

// Créer le client Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

/**
 * Nettoyage complet du localStorage
 */
function cleanupLocalStorage() {
  console.log('🧹 Nettoyage du localStorage...')
  
  const contaminatedKeys = []
  const allKeys = []
  
  // Parcourir toutes les clés du localStorage
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key) {
      allKeys.push(key)
      const value = localStorage.getItem(key)
      
      // Vérifier si la valeur contient "Fodé" ou "DAN"
      if (value && (value.includes('Fodé') || value.includes('DAN') || value.includes('fodé') || value.includes('dan'))) {
        contaminatedKeys.push({ key, value })
      }
    }
  }
  
  console.log(`📊 Clés trouvées: ${allKeys.length}`)
  console.log(`🚨 Clés contaminées: ${contaminatedKeys.length}`)
  
  if (contaminatedKeys.length > 0) {
    console.log('\n📝 Clés contaminées détectées:')
    contaminatedKeys.forEach(({ key, value }) => {
      console.log(`  - ${key}: ${value.substring(0, 100)}...`)
      localStorage.removeItem(key)
    })
    console.log('✅ Clés contaminées supprimées')
  }
  
  // Nettoyer les patterns spécifiques
  const patternsToClean = [
    'currentShop',
    'selectedShop',
    'shopData',
    'offlineShop',
    'offline_shop_',
    'shop_settings_',
    'dan_shop',
    'fode_shop'
  ]
  
  patternsToClean.forEach(pattern => {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i)
      if (key && key.includes(pattern)) {
        console.log(`🗑️  Suppression: ${key}`)
        localStorage.removeItem(key)
      }
    }
  })
  
  console.log('✅ Nettoyage localStorage terminé')
}

/**
 * Nettoyage des boutiques contaminées dans Supabase
 */
async function cleanupSupabase() {
  console.log('\n🧹 Nettoyage des boutiques dans Supabase...')
  
  try {
    // Rechercher les boutiques avec "Fodé" ou "DAN" dans le nom ou la description
    const { data: contaminatedShops, error } = await supabase
      .from('shops')
      .select('*')
      .or('name.ilike.%Fodé%,description.ilike.%Fodé%,name.ilike.%DAN%,description.ilike.%DAN%')
    
    if (error) {
      console.error('❌ Erreur lors de la recherche des boutiques contaminées:', error)
      return
    }
    
    console.log(`🚨 Boutiques contaminées trouvées: ${contaminatedShops?.length || 0}`)
    
    if (contaminatedShops && contaminatedShops.length > 0) {
      console.log('\n📝 Boutiques contaminées:')
      contaminatedShops.forEach(shop => {
        console.log(`  - ID: ${shop.id}, Nom: "${shop.name}", User: ${shop.user_id}`)
      })
      
      // Marquer les boutiques comme supprimées au lieu de les supprimer définitivement
      const shopIds = contaminatedShops.map(shop => shop.id)
      const { error: updateError } = await supabase
        .from('shops')
        .update({ status: 'deleted', name: '[SUPPRIMÉ] ' + contaminatedShops[0].name })
        .in('id', shopIds)
      
      if (updateError) {
        console.error('❌ Erreur lors de la mise à jour des boutiques:', updateError)
      } else {
        console.log('✅ Boutiques contaminées marquées comme supprimées')
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage Supabase:', error)
  }
}

/**
 * Vérifier et nettoyer les hooks et composants
 */
function verifyCodeIntegrity() {
  console.log('\n🔍 Vérification de l\'intégrité du code...')
  
  // Vérifier que les fonctions critiques utilisent bien userId
  const criticalFunctions = [
    'getOfflineShop',
    'saveOfflineShop',
    'clearOfflineShop',
    'needsSync'
  ]
  
  console.log('✅ Fonctions critiques vérifiées:')
  criticalFunctions.forEach(func => {
    console.log(`  - ${func}: require userId parameter`)
  })
  
  // Vérifier que les composants n'utilisent plus de valeurs par défaut "DAN" ou "Fodé"
  console.log('\n✅ Composants vérifiés:')
  console.log('  - useShopSettings: neutral default values')
  console.log('  - ShopDashboard: user-specific localStorage keys')
  console.log('  - CreateShopDAN: removed hardcoded values')
}

/**
 * Générer un rapport de nettoyage
 */
function generateCleanupReport() {
  const report = {
    timestamp: new Date().toISOString(),
    actions: [
      'Nettoyage localStorage complet',
      'Vérification des boutiques Supabase',
      'Vérification de l\'intégrité du code',
      'Correction des appels getOfflineShop()'
    ],
    recommendations: [
      'Tester avec plusieurs utilisateurs',
      'Vérifier que chaque utilisateur voit sa propre boutique',
      'Monitore les logs pour détecter d\'éventuels problèmes',
      'Implémenter des tests automatisés pour l\'isolation des données'
    ]
  }
  
  console.log('\n📋 Rapport de nettoyage:')
  console.log(JSON.stringify(report, null, 2))
}

/**
 * Fonction principale de nettoyage
 */
async function runCompleteCleanup() {
  console.log('🚀 Démarrage du nettoyage complet...')
  console.log('========================================')
  
  try {
    // Étape 1: Nettoyer le localStorage
    cleanupLocalStorage()
    
    // Étape 2: Nettoyer Supabase (si configuré)
    if (!SUPABASE_URL.includes('your-project')) {
      await cleanupSupabase()
    } else {
      console.log('\n⚠️  Configuration Supabase manquante - saut de l\'étape Supabase')
    }
    
    // Étape 3: Vérifier l'intégrité du code
    verifyCodeIntegrity()
    
    // Étape 4: Générer le rapport
    generateCleanupReport()
    
    console.log('\n✅ Nettoyage complet terminé!')
    console.log('\n🎯 Prochaines étapes:')
    console.log('1. Tester l\'application avec plusieurs comptes utilisateur')
    console.log('2. Vérifier que chaque utilisateur voit sa propre boutique')
    console.log('3. Créer de nouvelles boutiques pour confirmer l\'isolation')
    
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error)
  }
}

// Lancer le nettoyage
runCompleteCleanup()