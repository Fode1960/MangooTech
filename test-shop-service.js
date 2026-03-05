#!/usr/bin/env node

/**
 * Script de test simple pour shopService
 * Teste les fonctions principales du service shop
 */

import { createClient } from '@supabase/supabase-js'

// Configuration Supabase - à adapter selon votre environnement
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'

// Créer le client Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Service shop simplifié pour les tests
const shopService = {
  // Récupérer toutes les boutiques
  async getAllShops() {
    try {
      console.log('🔄 Test: Récupération de toutes les boutiques...')
      const { data, error } = await supabase
        .from('shops')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5)

      if (error) {
        console.error('❌ Erreur getAllShops:', error)
        return { data: null, error }
      }

      console.log(`✅ Succès: ${data.length} boutiques trouvées`)
      return { data, error: null }
    } catch (error) {
      console.error('❌ Exception getAllShops:', error)
      return { data: null, error: error.message }
    }
  },

  // Récupérer les boutiques par statut
  async getShopsByStatus(status) {
    try {
      console.log(`🔄 Test: Récupération des boutiques avec statut '${status}'...`)
      const { data, error } = await supabase
        .from('shops')
        .select('*')
        .eq('status', status)
        .order('created_at', { ascending: false })
        .limit(5)

      if (error) {
        console.error(`❌ Erreur getShopsByStatus(${status}):`, error)
        return { data: null, error }
      }

      console.log(`✅ Succès: ${data.length} boutiques avec statut '${status}' trouvées`)
      return { data, error: null }
    } catch (error) {
      console.error(`❌ Exception getShopsByStatus(${status}):`, error)
      return { data: null, error: error.message }
    }
  },

  // Créer une boutique de test
  async createTestShop() {
    try {
      console.log('🔄 Test: Création d\'une boutique de test...')
      
      // Obtenir l'utilisateur actuel
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        console.log('ℹ️  Aucun utilisateur connecté, création d\'une boutique sans user_id')
      }

      const testShopData = {
        name: `Boutique Test ${Date.now()}`,
        description: 'Boutique de test créée par le script',
        user_id: user?.id || null,
        status: 'pending',
        slug: `boutique-test-${Date.now()}`.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      }

      const { data, error } = await supabase
        .from('shops')
        .insert([testShopData])
        .select()
        .maybeSingle()

      if (error) {
        console.error('❌ Erreur createTestShop:', error)
        return { data: null, error }
      }

      console.log('✅ Succès: Boutique de test créée avec ID:', data.id)
      return { data, error: null }
    } catch (error) {
      console.error('❌ Exception createTestShop:', error)
      return { data: null, error: error.message }
    }
  },

  // Tester la vérification de permissions
  async testPermissions() {
    try {
      console.log('🔄 Test: Vérification des permissions...')
      
      // Tester la lecture
      const { data: shops, error: readError } = await supabase
        .from('shops')
        .select('id')
        .limit(1)

      if (readError) {
        console.log('❌ Permission refusée pour la lecture:', readError.message)
        return false
      }

      console.log('✅ Permissions de lecture: OK')

      // Tester l'insertion (si possible)
      try {
        const { error: insertError } = await supabase
          .from('shops')
          .insert([{ 
            name: 'Test Permissions',
            slug: 'test-permissions'
          }])
          .select()

        if (insertError) {
          console.log('ℹ️  Permissions d\'insertion: Refusées (normal sans authentification)')
        } else {
          console.log('✅ Permissions d\'insertion: OK')
        }
      } catch (e) {
        console.log('ℹ️  Permissions d\'insertion: Refusées (normal sans authentification)')
      }

      return true
    } catch (error) {
      console.error('❌ Exception testPermissions:', error)
      return false
    }
  }
}

// Fonction principale de test
async function runTests() {
  console.log('🚀 Démarrage des tests shopService')
  console.log('=====================================')

  try {
    // Test 1: Permissions
    console.log('\n📋 Test 1: Vérification des permissions')
    await shopService.testPermissions()

    // Test 2: Récupération des boutiques
    console.log('\n📋 Test 2: Récupération de toutes les boutiques')
    const allShopsResult = await shopService.getAllShops()
    
    if (allShopsResult.data) {
      console.log('Données des boutiques:', allShopsResult.data.map(shop => ({
        id: shop.id,
        name: shop.name,
        status: shop.status,
        user_id: shop.user_id
      })))
    }

    // Test 3: Récupération par statut
    console.log('\n📋 Test 3: Récupération des boutiques par statut')
    await shopService.getShopsByStatus('pending')
    await shopService.getShopsByStatus('approved')
    await shopService.getShopsByStatus('rejected')

    // Test 4: Création d'une boutique (si authentifié)
    console.log('\n📋 Test 4: Création d\'une boutique de test')
    const createResult = await shopService.createTestShop()
    
    if (createResult.data) {
      console.log('Boutique créée:', {
        id: createResult.data.id,
        name: createResult.data.name,
        status: createResult.data.status
      })
    }

    console.log('\n✅ Tests terminés avec succès!')
    
  } catch (error) {
    console.error('❌ Erreur lors des tests:', error)
  }
}

// Vérifier que les variables d'environnement sont définies
if (!SUPABASE_URL.includes('your-project') && !SUPABASE_ANON_KEY.includes('your-anon-key')) {
  // Lancer les tests
  runTests().catch(console.error)
} else {
  console.log('⚠️  Configuration requise:')
  console.log('Veuillez définir les variables d\'environnement:')
  console.log('VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY')
  console.log('\nOu modifiez directement les variables dans ce script.')
}