// Script de diagnostic pour le problème de mapping des packs
// Problème: Current pack DB ID est correct mais Dashboard ID est 0

import { createClient } from '@supabase/supabase-js'

// Configuration Supabase (à adapter selon votre configuration)
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'YOUR_SUPABASE_URL'
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_KEY'
const supabase = createClient(supabaseUrl, supabaseKey)

// UUID de l'utilisateur problématique
const USER_ID = '9c97cee9-9c65-47dd-b75b-3d7a0f513701'

// Mapping hardcodé dans Dashboard.jsx
const DASHBOARD_PACK_MAPPING = {
  '0a85e74a-4aec-480a-8af1-7b57391a80d2': 0, // Pack Découverte
  '209a0b0e-7888-41a3-9cd1-45907705261a': 1, // Pack Visibilité
  'e444b213-6a11-4793-b30d-e55a8fbf3403': 2, // Pack Professionnel
  '9e026c33-1c2a-49aa-8cc2-e2c9d392c303': 3  // Pack Premium
}

async function debugPackMapping() {
  console.log('🔍 === DIAGNOSTIC DU MAPPING DES PACKS ===\n')
  
  try {
    // 1. Récupérer le pack actuel de l'utilisateur
    console.log('1️⃣ Récupération du pack utilisateur...')
    const { data: userPack, error: userPackError } = await supabase
      .from('user_packs')
      .select(`
        *,
        packs(
          id,
          name,
          description,
          price,
          currency,
          billing_period
        )
      `)
      .eq('user_id', USER_ID)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    
    if (userPackError) {
      console.error('❌ Erreur récupération pack utilisateur:', userPackError)
      return
    }
    
    console.log('✅ Pack utilisateur récupéré:')
    console.log('   - User ID:', userPack.user_id)
    console.log('   - Pack ID (UUID):', userPack.pack_id)
    console.log('   - Pack Name:', userPack.packs?.name)
    console.log('   - Status:', userPack.status)
    
    // 2. Vérifier le mapping
    console.log('\n2️⃣ Vérification du mapping...')
    const packUUID = userPack.pack_id
    const dashboardId = DASHBOARD_PACK_MAPPING[packUUID]
    
    console.log('   - UUID du pack:', packUUID)
    console.log('   - Type de l\'UUID:', typeof packUUID)
    console.log('   - Longueur de l\'UUID:', packUUID?.length)
    console.log('   - Dashboard ID mappé:', dashboardId)
    console.log('   - Type du Dashboard ID:', typeof dashboardId)
    
    // 3. Vérifier chaque clé du mapping
    console.log('\n3️⃣ Vérification détaillée du mapping...')
    Object.entries(DASHBOARD_PACK_MAPPING).forEach(([key, value]) => {
      const matches = key === packUUID
      console.log(`   - ${key} => ${value} ${matches ? '✅ MATCH' : '❌'}`)
      
      if (!matches) {
        // Comparaison caractère par caractère
        console.log(`     Comparaison: "${key}" vs "${packUUID}"`)
        if (key.length !== packUUID.length) {
          console.log(`     Longueurs différentes: ${key.length} vs ${packUUID.length}`)
        } else {
          for (let i = 0; i < key.length; i++) {
            if (key[i] !== packUUID[i]) {
              console.log(`     Différence à la position ${i}: "${key[i]}" vs "${packUUID[i]}"`)
              break
            }
          }
        }
      }
    })
    
    // 4. Vérifier tous les packs disponibles
    console.log('\n4️⃣ Vérification de tous les packs...')
    const { data: allPacks, error: packsError } = await supabase
      .from('packs')
      .select('*')
      .order('sort_order')
    
    if (packsError) {
      console.error('❌ Erreur récupération packs:', packsError)
      return
    }
    
    console.log('✅ Tous les packs dans la base:')
    allPacks.forEach(pack => {
      const mappedId = DASHBOARD_PACK_MAPPING[pack.id]
      console.log(`   - ${pack.name}: ${pack.id} => Dashboard ID: ${mappedId ?? 'NON MAPPÉ'}`)
    })
    
    // 5. Diagnostic final
    console.log('\n5️⃣ Diagnostic final...')
    if (dashboardId === undefined) {
      console.log('❌ PROBLÈME: L\'UUID du pack utilisateur ne correspond à aucune clé du mapping')
      console.log('   Solutions possibles:')
      console.log('   1. Mettre à jour le mapping dans Dashboard.jsx')
      console.log('   2. Corriger l\'UUID dans la base de données')
      console.log('   3. Vérifier s\'il y a des espaces ou caractères invisibles')
    } else if (dashboardId === 0) {
      console.log('✅ MAPPING CORRECT: L\'UUID correspond au Pack Découverte (ID: 0)')
      console.log('❌ MAIS: Le Dashboard affiche toujours 0 au lieu de l\'ID correct')
      console.log('   Le problème est probablement dans la logique du Dashboard.jsx')
    } else {
      console.log(`✅ MAPPING CORRECT: L\'UUID correspond au Dashboard ID: ${dashboardId}`)
    }
    
  } catch (error) {
    console.error('❌ Erreur générale:', error)
  }
}

// Exécuter le diagnostic
if (typeof window === 'undefined') {
  // Environnement Node.js
  debugPackMapping()
} else {
  // Environnement navigateur
  console.log('🔍 Script de diagnostic des packs - Exécutez debugPackMapping() dans la console')
  window.debugPackMapping = debugPackMapping
}

export { debugPackMapping }