import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Charger les variables d'environnement
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testCalculatePackDifference() {
  try {
    console.log('🧪 Test de la fonction calculate-pack-difference...')
    
    // Créer un token d'authentification pour l'utilisateur
    const { data: tokenData, error: tokenError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: 'mdansoko@mangoo.tech'
    })
    
    if (tokenError) {
      console.error('❌ Erreur génération token:', tokenError.message)
      return
    }
    
    // Extraire le token de l'URL
    const url = new URL(tokenData.properties.action_link)
    const accessToken = url.searchParams.get('access_token')
    
    if (!accessToken) {
      console.error('❌ Impossible d\'extraire le token d\'accès')
      return
    }
    
    console.log('✅ Token d\'accès généré')
    
    // Test 1: Calculer la différence du pack gratuit vers pack payant
    console.log('\n🧪 Test 1: Pack Découverte (gratuit) vers Pack Visibilité (5000 FCFA)...')
    const response1 = await fetch(`${supabaseUrl}/functions/v1/calculate-pack-difference`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'apikey': process.env.VITE_SUPABASE_ANON_KEY
      },
      body: JSON.stringify({
        newPackId: '209a0b0e-7888-41a3-9cd1-45907705261a' // Pack Visibilité
      })
    })
    
    const responseText1 = await response1.text()
    console.log(`📊 Statut: ${response1.status}`)
    console.log(`📄 Réponse:`, responseText1)
    
    if (!response1.ok) {
      console.error('❌ Erreur dans calculate-pack-difference')
      try {
        const errorData = JSON.parse(responseText1)
        console.error('Détails:', JSON.stringify(errorData, null, 2))
      } catch (e) {
        console.error('Réponse non-JSON:', responseText1)
      }
    } else {
      try {
        const data = JSON.parse(responseText1)
        console.log('✅ Analyse réussie:')
        console.log(`   - Type: ${data.changeType}`)
        console.log(`   - Différence: ${data.priceDifference} FCFA`)
        console.log(`   - Paiement requis: ${data.requiresPayment}`)
        console.log(`   - Changement immédiat: ${data.canChangeImmediately}`)
        console.log(`   - Action: ${data.recommendedAction}`)
      } catch (e) {
        console.log('✅ Réponse (non-JSON):', responseText1)
      }
    }
    
    // Test 2: Avec un pack inexistant
    console.log('\n🧪 Test 2: Avec un pack inexistant...')
    const response2 = await fetch(`${supabaseUrl}/functions/v1/calculate-pack-difference`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'apikey': process.env.VITE_SUPABASE_ANON_KEY
      },
      body: JSON.stringify({
        newPackId: 'pack-inexistant'
      })
    })
    
    const responseText2 = await response2.text()
    console.log(`📊 Statut: ${response2.status}`)
    console.log(`📄 Réponse:`, responseText2)
    
    // Test 3: Sans newPackId
    console.log('\n🧪 Test 3: Sans newPackId...')
    const response3 = await fetch(`${supabaseUrl}/functions/v1/calculate-pack-difference`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'apikey': process.env.VITE_SUPABASE_ANON_KEY
      },
      body: JSON.stringify({})
    })
    
    const responseText3 = await response3.text()
    console.log(`📊 Statut: ${response3.status}`)
    console.log(`📄 Réponse:`, responseText3)

  } catch (error) {
    console.error('❌ Erreur générale:', error.message)
    console.error('Stack:', error.stack)
  }
}

// Exécuter le test
testCalculatePackDifference()
  .then(() => {
    console.log('\n🏁 Test terminé')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Erreur fatale:', error)
    process.exit(1)
  })