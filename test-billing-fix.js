/**
 * Script de test pour vérifier la correction de next_billing_date
 * Teste que les packs payants ont maintenant une next_billing_date définie
 */

const { createClient } = require('@supabase/supabase-js')

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key'
const supabase = createClient(supabaseUrl, supabaseKey)

async function testBillingFix() {
  console.log('🧪 Test de la correction next_billing_date')
  console.log('=' .repeat(50))
  
  try {
    // 1. Vérifier les packs et leurs prix
    console.log('\n📦 1. Vérification des packs disponibles:')
    const { data: packs, error: packsError } = await supabase
      .from('packs')
      .select('id, name, price')
      .order('price')
    
    if (packsError) {
      console.error('❌ Erreur récupération packs:', packsError)
      return
    }
    
    packs.forEach(pack => {
      console.log(`   ${pack.name}: ${pack.price} FCFA (${pack.price > 0 ? 'PAYANT' : 'GRATUIT'})`)
      console.log(`   UUID: ${pack.id}`)
    })
    
    // 2. Vérifier les user_packs actuels
    console.log('\n👥 2. Vérification des packs utilisateurs:')
    const { data: userPacks, error: userPacksError } = await supabase
      .from('user_packs')
      .select(`
        id,
        user_id,
        pack_id,
        status,
        started_at,
        next_billing_date,
        packs!inner(name, price)
      `)
      .eq('status', 'active')
      .limit(10)
    
    if (userPacksError) {
      console.error('❌ Erreur récupération user_packs:', userPacksError)
      return
    }
    
    console.log(`   Nombre de packs actifs: ${userPacks.length}`)
    
    userPacks.forEach((userPack, index) => {
      console.log(`\n   Pack ${index + 1}:`)
      console.log(`     User ID: ${userPack.user_id}`)
      console.log(`     Pack: ${userPack.packs.name}`)
      console.log(`     Prix: ${userPack.packs.price} FCFA`)
      console.log(`     Started: ${userPack.started_at}`)
      console.log(`     Next Billing: ${userPack.next_billing_date || 'NON DÉFINI'}`)
      
      // Vérifier la logique
      if (userPack.packs.price > 0 && !userPack.next_billing_date) {
        console.log(`     ⚠️  PROBLÈME: Pack payant sans next_billing_date`)
      } else if (userPack.packs.price === 0 && userPack.next_billing_date) {
        console.log(`     ⚠️  ATTENTION: Pack gratuit avec next_billing_date`)
      } else {
        console.log(`     ✅ Logique correcte`)
      }
    })
    
    // 3. Statistiques
    console.log('\n📊 3. Statistiques:')
    const packsByType = {
      gratuits: userPacks.filter(up => up.packs.price === 0),
      payants: userPacks.filter(up => up.packs.price > 0)
    }
    
    console.log(`   Packs gratuits: ${packsByType.gratuits.length}`)
    console.log(`   Packs payants: ${packsByType.payants.length}`)
    
    const payantsAvecBilling = packsByType.payants.filter(up => up.next_billing_date)
    const payantsSansBilling = packsByType.payants.filter(up => !up.next_billing_date)
    
    console.log(`   Packs payants AVEC next_billing_date: ${payantsAvecBilling.length}`)
    console.log(`   Packs payants SANS next_billing_date: ${payantsSansBilling.length}`)
    
    // 4. Résultat du test
    console.log('\n🎯 4. Résultat du test:')
    if (payantsSansBilling.length === 0) {
      console.log('   ✅ SUCCÈS: Tous les packs payants ont une next_billing_date')
    } else {
      console.log(`   ❌ ÉCHEC: ${payantsSansBilling.length} packs payants sans next_billing_date`)
      console.log('   Ces packs nécessitent une correction manuelle:')
      payantsSansBilling.forEach(pack => {
        console.log(`     - User ${pack.user_id}: ${pack.packs.name}`)
      })
    }
    
    // 5. Recommandations
    console.log('\n💡 5. Recommandations:')
    if (payantsSansBilling.length > 0) {
      console.log('   Pour corriger les packs existants, exécutez:')
      console.log('   ```sql')
      payantsSansBilling.forEach(pack => {
        const nextBilling = new Date(pack.started_at)
        nextBilling.setMonth(nextBilling.getMonth() + 1)
        console.log(`   UPDATE user_packs SET next_billing_date = '${nextBilling.toISOString()}' WHERE id = ${pack.id};`)
      })
      console.log('   ```')
    }
    
    console.log('\n   Pour tester avec de nouveaux paiements:')
    console.log('   1. Effectuer un paiement test via Stripe')
    console.log('   2. Vérifier que le webhook définit next_billing_date')
    console.log('   3. Confirmer l\'affichage correct dans le Dashboard')
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error)
  }
}

// Exécuter le test
if (require.main === module) {
  testBillingFix()
    .then(() => {
      console.log('\n🏁 Test terminé')
      process.exit(0)
    })
    .catch(error => {
      console.error('💥 Erreur fatale:', error)
      process.exit(1)
    })
}

module.exports = { testBillingFix }