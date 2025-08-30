import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Charger les variables d'environnement
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testSmartPackChange() {
  try {
    console.log('🧪 Test direct de la fonction smart-pack-change...')
    
    // Tester avec un appel direct sans authentification pour voir l'erreur
    const response = await fetch(`${supabaseUrl}/functions/v1/smart-pack-change`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseAnonKey
      },
      body: JSON.stringify({
        packId: '209a0b0e-7888-41a3-9cd1-45907705261a'
      })
    })
    
    const responseText = await response.text()
    console.log(`\n📊 Statut de la réponse: ${response.status}`)
    console.log(`📄 Réponse brute:`, responseText)
    
    if (!response.ok) {
      console.error('❌ Erreur de la fonction Edge')
      try {
        const errorData = JSON.parse(responseText)
        console.error('Détails de l\'erreur:', JSON.stringify(errorData, null, 2))
      } catch (e) {
        console.error('Réponse non-JSON:', responseText)
      }
    } else {
      try {
        const data = JSON.parse(responseText)
        console.log('✅ Réponse de la fonction:', JSON.stringify(data, null, 2))
      } catch (e) {
        console.log('✅ Réponse (non-JSON):', responseText)
      }
    }
    
    // Test 2: Avec un token invalide pour voir la différence
    console.log('\n🧪 Test avec token invalide...')
    const response2 = await fetch(`${supabaseUrl}/functions/v1/smart-pack-change`, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer invalid_token',
        'Content-Type': 'application/json',
        'apikey': supabaseAnonKey
      },
      body: JSON.stringify({
        packId: '209a0b0e-7888-41a3-9cd1-45907705261a'
      })
    })
    
    const responseText2 = await response2.text()
    console.log(`\n📊 Statut de la réponse 2: ${response2.status}`)
    console.log(`📄 Réponse brute 2:`, responseText2)
    
    // Test 3: Sans packId pour voir l'erreur de validation
    console.log('\n🧪 Test sans packId...')
    const response3 = await fetch(`${supabaseUrl}/functions/v1/smart-pack-change`, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer invalid_token',
        'Content-Type': 'application/json',
        'apikey': supabaseAnonKey
      },
      body: JSON.stringify({})
    })
    
    const responseText3 = await response3.text()
    console.log(`\n📊 Statut de la réponse 3: ${response3.status}`)
    console.log(`📄 Réponse brute 3:`, responseText3)

  } catch (error) {
    console.error('❌ Erreur générale:', error.message)
    console.error('Stack:', error.stack)
  }
}

// Exécuter le test
testSmartPackChange()
  .then(() => {
    console.log('\n🏁 Test terminé')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Erreur fatale:', error)
    process.exit(1)
  })