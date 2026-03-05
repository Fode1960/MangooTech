import { createClient } from '@supabase/supabase-js'

// Configuration Supabase
const supabaseUrl = 'https://ztjmxvhvauqzjyxnvnpx.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0am14dmh2YXVxemp5eG52bnB4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjM1NTI4NzEsImV4cCI6MjAzOTEyODg3MX0.Ej5zQHBJhbcOzuOjqJXGNjSf0ckPYKVXNjd_W2NQZQY'

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugBillingData() {
  console.log('🔍 === DEBUG DONNÉES DE FACTURATION ===')
  
  try {
    // 1. Vérifier tous les user_packs avec leurs données de facturation
    console.log('\n📦 1. Vérification des user_packs:')
    const { data: userPacks, error: packsError } = await supabase
      .from('user_packs')
      .select(`
        id,
        user_id,
        pack_id,
        status,
        started_at,
        expires_at,
        next_billing_date,
        created_at,
        updated_at,
        packs(
          id,
          name,
          price,
          currency,
          billing_period
        )
      `)
      .order('created_at', { ascending: false })
      .limit(10)
    
    if (packsError) {
      console.error('❌ Erreur user_packs:', packsError)
    } else {
      console.log(`✅ Trouvé ${userPacks.length} user_packs:`)
      userPacks.forEach(pack => {
        console.log(`\n📋 User Pack ID: ${pack.id}`)
        console.log(`   User ID: ${pack.user_id}`)
        console.log(`   Pack: ${pack.packs?.name} (${pack.packs?.price} ${pack.packs?.currency})`)
        console.log(`   Status: ${pack.status}`)
        console.log(`   Started: ${pack.started_at}`)
        console.log(`   Next Billing: ${pack.next_billing_date || 'NULL ❌'}`)
        console.log(`   Expires: ${pack.expires_at || 'NULL'}`)
        console.log(`   Billing Period: ${pack.packs?.billing_period}`)
      })
    }
    
    // 2. Vérifier les transactions récentes
    console.log('\n💰 2. Vérification des transactions récentes:')
    const { data: transactions, error: transError } = await supabase
      .from('transactions')
      .select(`
        id,
        user_id,
        pack_id,
        amount,
        currency,
        status,
        stripe_payment_intent_id,
        created_at,
        packs(
          name,
          price,
          billing_period
        )
      `)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (transError) {
      console.error('❌ Erreur transactions:', transError)
    } else {
      console.log(`✅ Trouvé ${transactions.length} transactions complétées:`)
      transactions.forEach(trans => {
        console.log(`\n💳 Transaction ID: ${trans.id}`)
        console.log(`   User ID: ${trans.user_id}`)
        console.log(`   Pack: ${trans.packs?.name}`)
        console.log(`   Montant: ${trans.amount} ${trans.currency}`)
        console.log(`   Date: ${trans.created_at}`)
        console.log(`   Stripe ID: ${trans.stripe_payment_intent_id}`)
      })
    }
    
    // 3. Vérifier la logique de calcul de next_billing_date
    console.log('\n📅 3. Analyse de la logique de facturation:')
    const activeUserPacks = userPacks?.filter(pack => pack.status === 'active') || []
    
    activeUserPacks.forEach(pack => {
      console.log(`\n🔍 Analyse pour ${pack.packs?.name}:`)
      console.log(`   Prix: ${pack.packs?.price} (gratuit: ${pack.packs?.price === 0})`)
      console.log(`   Période: ${pack.packs?.billing_period}`)
      console.log(`   Started: ${pack.started_at}`)
      console.log(`   Next Billing actuel: ${pack.next_billing_date}`)
      
      // Calculer ce que devrait être next_billing_date
      if (pack.packs?.price > 0 && pack.packs?.billing_period === 'monthly') {
        const startDate = new Date(pack.started_at)
        const expectedNextBilling = new Date(startDate)
        expectedNextBilling.setMonth(expectedNextBilling.getMonth() + 1)
        
        console.log(`   Next Billing attendu: ${expectedNextBilling.toISOString()}`)
        console.log(`   ⚠️ Différence détectée: ${pack.next_billing_date !== expectedNextBilling.toISOString().split('T')[0]}`)
      } else if (pack.packs?.price === 0) {
        console.log(`   ✅ Pack gratuit - pas de facturation nécessaire`)
      }
    })
    
    // 4. Recommandations
    console.log('\n🎯 4. Recommandations:')
    const packsWithoutBilling = activeUserPacks.filter(pack => 
      !pack.next_billing_date && pack.packs?.price > 0
    )
    
    if (packsWithoutBilling.length > 0) {
      console.log(`❌ ${packsWithoutBilling.length} packs payants sans next_billing_date:`)
      packsWithoutBilling.forEach(pack => {
        console.log(`   - User ${pack.user_id}: ${pack.packs?.name}`)
      })
      console.log('\n💡 Solution suggérée:')
      console.log('   1. Mettre à jour next_billing_date pour ces packs')
      console.log('   2. Vérifier la logique dans le webhook Stripe')
      console.log('   3. Ajouter une migration pour corriger les données existantes')
    } else {
      console.log('✅ Tous les packs payants ont une next_billing_date')
    }
    
  } catch (error) {
    console.error('❌ Erreur générale:', error)
  }
}

// Exécuter le debug
debugBillingData().then(() => {
  console.log('\n✅ Debug terminé')
}).catch(error => {
  console.error('❌ Erreur lors du debug:', error)
})