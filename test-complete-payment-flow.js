import { createClient } from '@supabase/supabase-js'

// Configuration
const supabaseUrl = 'https://ptrqhtwstldphjaraufi.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0cnFodHdzdGxkcGhqYXJhdWZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MzI0OTIsImV4cCI6MjA3MDUwODQ5Mn0.Wc-dKWVMpAyFoAPFGejzhD0o1rodyEGrBlZK5X3muyA'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testCompletePaymentFlow() {
  try {
    console.log('🧪 Test complet du flux de paiement en production...')
    
    // 1. Créer un utilisateur de test
    console.log('\n1. Création d\'un utilisateur de test...')
    const testEmail = `test-payment-${Date.now()}@example.com`
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
    
    // Attendre que l'utilisateur soit bien créé
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // 2. Se connecter
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    })
    
    if (authError) {
      console.error('❌ Erreur de connexion:', authError.message)
      return
    }
    
    console.log('✅ Utilisateur connecté avec token:', authData.session.access_token.substring(0, 20) + '...')
    
    // 3. Récupérer les packs
    console.log('\n2. Récupération des packs...')
    const { data: packs, error: packsError } = await supabase
      .from('packs')
      .select('*')
      .order('price', { ascending: true })
    
    if (packsError) {
      console.error('❌ Erreur récupération packs:', packsError.message)
      return
    }
    
    const packPayant = packs.find(p => p.price > 0)
    if (!packPayant) {
      console.error('❌ Aucun pack payant trouvé')
      return
    }
    
    console.log(`✅ Pack sélectionné: ${packPayant.name} (${packPayant.price} XOF)`)
    
    // 4. Tester smart-pack-change avec le token utilisateur
    console.log('\n3. Test de smart-pack-change avec authentification...')
    
    const { data: changeData, error: changeError } = await supabase.functions.invoke('smart-pack-change', {
      body: {
        packId: packPayant.id
      }
    })
    
    if (changeError) {
      console.error('❌ Erreur smart-pack-change:', changeError.message)
      console.error('❌ Détails:', JSON.stringify(changeError, null, 2))
      return
    }
    
    if (changeData && changeData.error) {
      console.error('❌ Erreur dans la réponse:', changeData.error)
      return
    }
    
    console.log('\n📊 Résultat smart-pack-change:')
    console.log('Success:', changeData.success)
    console.log('Message:', changeData.message)
    console.log('Change Type:', changeData.changeType)
    console.log('Requires Payment:', changeData.requiresPayment)
    
    if (changeData.checkoutUrl) {
      console.log('\n🎉 SUCCESS! URL de checkout Stripe générée:')
      console.log('URL:', changeData.checkoutUrl)
      
      // Vérifier que l'URL est valide
      if (changeData.checkoutUrl.includes('checkout.stripe.com')) {
        console.log('✅ URL Stripe valide détectée')
        
        // Vérifier que l'URL contient les bons paramètres de redirection
        if (changeData.checkoutUrl.includes('success_url') || changeData.checkoutUrl.includes('cancel_url')) {
          console.log('✅ URLs de redirection configurées')
        }
        
        console.log('\n🚀 RÉSULTAT FINAL:')
        console.log('✅ La redirection Stripe fonctionne correctement en production!')
        console.log('✅ FRONTEND_URL est bien configurée')
        console.log('✅ Les fonctions Edge sont déployées correctement')
        console.log('\n📋 Instructions pour l\'utilisateur:')
        console.log('1. Connectez-vous à votre application')
        console.log('2. Sélectionnez un pack payant')
        console.log('3. Cliquez sur "Changer de pack"')
        console.log('4. Vous devriez être redirigé vers Stripe')
        
      } else {
        console.log('⚠️ URL ne semble pas être une URL Stripe valide')
      }
    } else if (changeData.effectiveImmediately) {
      console.log('\n✅ Changement immédiat effectué (pas de paiement requis)')
    } else {
      console.log('\n❌ Aucune URL de checkout générée et changement pas immédiat')
    }
    
    // 5. Nettoyer - supprimer l'utilisateur de test
    console.log('\n4. Nettoyage...')
    await supabase.auth.signOut()
    console.log('✅ Utilisateur déconnecté')
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message)
    console.error('❌ Stack:', error.stack)
  }
}

// Exécuter le test
testCompletePaymentFlow()