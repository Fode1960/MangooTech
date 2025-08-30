import { createClient } from '@supabase/supabase-js'

// Configuration
const supabaseUrl = 'https://ptrqhtwstldphjaraufi.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0cnFodHdzdGxkcGhqYXJhdWZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MzI0OTIsImV4cCI6MjA3MDUwODQ5Mn0.Wc-dKWVMpAyFoAPFGejzhD0o1rodyEGrBlZK5X3muyA'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testSmartPackChange() {
  try {
    console.log('🧪 Test de smart-pack-change en production...')
    
    // 1. Créer et connecter un utilisateur de test
    console.log('\n1. Création d\'un utilisateur de test...')
    const testEmail = `test-${Date.now()}@example.com`
    const testPassword = 'TestPassword123!@#'
    
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword
    })
    
    if (signUpError) {
      console.error('❌ Erreur de création utilisateur:', signUpError.message)
      return
    }
    
    console.log('✅ Utilisateur créé:', testEmail)
    
    // Attendre un peu pour que l'utilisateur soit bien créé
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Se connecter avec l'utilisateur créé
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    })
    
    if (authError) {
      console.error('❌ Erreur de connexion:', authError.message)
      return
    }
    
    console.log('✅ Utilisateur connecté:', authData.user.email)
    
    // 2. Récupérer les packs disponibles
    console.log('\n2. Récupération des packs...')
    const { data: packs, error: packsError } = await supabase
      .from('packs')
      .select('*')
      .order('price', { ascending: true })
    
    if (packsError) {
      console.error('❌ Erreur récupération packs:', packsError.message)
      return
    }
    
    console.log('✅ Packs disponibles:')
    packs.forEach(pack => {
      console.log(`   - ${pack.name}: ${pack.price} XOF (ID: ${pack.id})`)
    })
    
    // 3. Tester smart-pack-change avec un pack payant
    const packPayant = packs.find(p => p.price > 0)
    if (!packPayant) {
      console.error('❌ Aucun pack payant trouvé')
      return
    }
    
    console.log(`\n3. Test changement vers pack payant: ${packPayant.name}...`)
    
    const { data: changeData, error: changeError } = await supabase.functions.invoke('smart-pack-change', {
      body: {
        packId: packPayant.id
      }
    })
    
    if (changeError) {
      console.error('❌ Erreur smart-pack-change:', changeError.message)
      console.error('❌ Détails erreur:', JSON.stringify(changeError, null, 2))
      return
    }
    
    if (changeData && changeData.error) {
      console.error('❌ Erreur dans la réponse:', changeData.error)
      console.error('❌ Réponse complète:', JSON.stringify(changeData, null, 2))
      return
    }
    
    console.log('\n📊 Résultat smart-pack-change:')
    console.log('Success:', changeData.success)
    console.log('Message:', changeData.message)
    console.log('Change Type:', changeData.changeType)
    console.log('Requires Payment:', changeData.requiresPayment)
    
    if (changeData.checkoutUrl) {
      console.log('\n🎉 URL de checkout Stripe générée:')
      console.log('URL:', changeData.checkoutUrl)
      console.log('\n✅ La redirection Stripe fonctionne correctement!')
      
      // Vérifier que l'URL contient les bons paramètres
      if (changeData.checkoutUrl.includes('checkout.stripe.com')) {
        console.log('✅ URL Stripe valide détectée')
      } else {
        console.log('⚠️ URL ne semble pas être une URL Stripe valide')
      }
    } else if (changeData.effectiveImmediately) {
      console.log('\n✅ Changement immédiat effectué (pas de paiement requis)')
    } else {
      console.log('\n❌ Aucune URL de checkout générée et changement pas immédiat')
    }
    
    // 4. Déconnexion
    await supabase.auth.signOut()
    console.log('\n✅ Test terminé avec succès')
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message)
  }
}

// Exécuter le test
testSmartPackChange()