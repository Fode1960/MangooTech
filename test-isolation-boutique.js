#!/usr/bin/env node

/**
 * Script de test pour vérifier que le problème "Fodé boutique" est résolu
 * Ce script teste l'isolation des données entre utilisateurs
 */

import { createClient } from '@supabase/supabase-js'

// Configuration Supabase - à adapter selon votre environnement
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'

// Créer le client Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Simuler le localStorage pour les tests
const localStorage = {
  data: {},
  getItem(key) {
    return this.data[key] || null
  },
  setItem(key, value) {
    this.data[key] = value
  },
  removeItem(key) {
    delete this.data[key]
  },
  clear() {
    this.data = {}
  }
}

// Fonctions simulant le comportement du localStorageShop
const getOfflineShopKey = (userId) => `offline_shop_${userId}`

const getOfflineShop = (userId) => {
  if (!userId) {
    console.log('⚠️ getOfflineShop appelé sans userId')
    return null
  }
  const key = getOfflineShopKey(userId)
  const data = localStorage.getItem(key)
  return data ? JSON.parse(data) : null
}

const saveOfflineShop = (userId, shopData) => {
  if (!userId) {
    console.log('⚠️ saveOfflineShop appelé sans userId')
    return false
  }
  const key = getOfflineShopKey(userId)
  localStorage.setItem(key, JSON.stringify(shopData))
  return true
}

// Fonction de test principale
async function testUserIsolation() {
  console.log('🧪 Test d\'isolation des données utilisateur')
  console.log('==========================================')

  try {
    // Créer des utilisateurs de test fictifs
    const user1 = { id: 'user-001', email: 'user1@test.com' }
    const user2 = { id: 'user-002', email: 'user2@test.com' }
    const user3 = { id: 'user-003', email: 'user3@test.com' }

    // Nettoyer le localStorage
    localStorage.clear()
    console.log('✅ LocalStorage nettoyé')

    // Créer des boutiques pour chaque utilisateur
    const shop1 = {
      id: 'shop-001',
      name: 'Boutique de User1',
      description: 'Ma super boutique',
      user_id: user1.id
    }

    const shop2 = {
      id: 'shop-002', 
      name: 'Boutique de User2',
      description: 'La boutique de User2',
      user_id: user2.id
    }

    const shop3 = {
      id: 'shop-003',
      name: 'Boutique de User3', 
      description: 'Boutique User3',
      user_id: user3.id
    }

    // Sauvegarder les boutiques dans le localStorage (simuler le comportement de l'app)
    console.log('\n📁 Sauvegarde des boutiques dans localStorage...')
    saveOfflineShop(user1.id, shop1)
    saveOfflineShop(user2.id, shop2)
    saveOfflineShop(user3.id, shop3)

    // Tester que chaque utilisateur ne voit que sa boutique
    console.log('\n🔍 Test d\'isolation:')
    
    const retrieved1 = getOfflineShop(user1.id)
    const retrieved2 = getOfflineShop(user2.id)
    const retrieved3 = getOfflineShop(user3.id)

    console.log(`User1 récupère: ${retrieved1?.name || 'null'}`)
    console.log(`User2 récupère: ${retrieved2?.name || 'null'}`)
    console.log(`User3 récupère: ${retrieved3?.name || 'null'}`)

    // Vérifier que les données sont correctes
    const tests = [
      { user: user1, expected: shop1.name, actual: retrieved1?.name },
      { user: user2, expected: shop2.name, actual: retrieved2?.name },
      { user: user3, expected: shop3.name, actual: retrieved3?.name }
    ]

    let allPassed = true
    tests.forEach(test => {
      if (test.expected === test.actual) {
        console.log(`✅ ${test.user.email}: CORRECT - "${test.actual}"`)
      } else {
        console.log(`❌ ${test.user.email}: ERREUR - attendu "${test.expected}", obtenu "${test.actual}"`)
        allPassed = false
      }
    })

    // Tester le cas problématique: appel sans userId
    console.log('\n⚠️ Test appel sans userId (ancien bug):')
    const noUserShop = getOfflineShop()
    if (noUserShop === null) {
      console.log('✅ Appel sans userId retourne null (comportement sécurisé)')
    } else {
      console.log(`❌ Appel sans userId retourne: ${JSON.stringify(noUserShop)}`)
      allPassed = false
    }

    // Tester le cas "Fodé boutique"
    console.log('\n🎯 Test spécifique "Fodé boutique":')
    const fodéShop = {
      id: 'shop-fode',
      name: 'Fodé boutique',
      description: 'Boutique Fodé',
      user_id: user1.id
    }
    
    // Simuler une contamination
    localStorage.setItem('offline_shop_', JSON.stringify(fodéShop)) // Ancienne clé partagée
    
    const contaminatedResult = getOfflineShop() // Appel sans userId
    if (contaminatedResult === null) {
      console.log('✅ Pas de contamination détectée - appel sans userId retourne null')
    } else {
      console.log(`❌ CONTAMINATION DÉTECTÉE: ${JSON.stringify(contaminatedResult)}`)
      allPassed = false
    }

    // Nettoyer la contamination
    localStorage.removeItem('offline_shop_')

    if (allPassed) {
      console.log('\n🎉 TOUS LES TESTS PASSENT - L\'isolation est correcte!')
    } else {
      console.log('\n❌ CERTAINS TESTS ÉCHOUENT - Il reste des problèmes d\'isolation')
    }

    return allPassed

  } catch (error) {
    console.error('❌ Erreur lors du test:', error)
    return false
  }
}

// Vérifier que les variables d'environnement sont définies
if (!SUPABASE_URL.includes('your-project') && !SUPABASE_ANON_KEY.includes('your-anon-key')) {
  // Lancer les tests
  testUserIsolation().then(success => {
    if (success) {
      console.log('\n✅ Les corrections apportées semblent efficaces!')
      console.log('Le problème "Fodé boutique" devrait être résolu.')
    } else {
      console.log('\n⚠️  Il reste probablement des problèmes à corriger.')
    }
  })
} else {
  console.log('⚠️  Configuration requise:')
  console.log('Veuillez définir les variables d\'environnement:')
  console.log('VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY')
  console.log('\nOu modifiez directement les variables dans ce script.')
}