const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function debugFunctionError() {
  try {
    console.log('🔍 Test de diagnostic avec process-immediate-change...')
    
    // Récupérer un utilisateur existant
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'mdansoko@mangoo.tech')
      .single()
    
    if (usersError || !users) {
      console.log('❌ Erreur récupération utilisateur:', usersError?.message)
      return
    }
    
    console.log('✅ Utilisateur trouvé:', users.email, 'ID:', users.id)
    
    // Récupérer les packs disponibles
    const { data: packs, error: packsError } = await supabase
      .from('packs')
      .select('*')
      .order('price')
    
    if (packsError || !packs?.length) {
      console.log('❌ Erreur récupération packs:', packsError?.message)
      return
    }
    
    console.log('📦 Packs disponibles:', packs.map(p => `${p.id}: ${p.name} (${p.price}€)`))
    
    // Prendre un pack différent du pack actuel
    const currentPackId = users.selected_pack === 'pack-decouverte' ? 1 : 2
    const targetPack = packs.find(p => p.id !== currentPackId) || packs[0]
    
    console.log('🎯 Pack cible:', targetPack.name, `(ID: ${targetPack.id})`)
    
    // Appel direct de la fonction process-immediate-change avec fetch
    console.log('📞 Appel de process-immediate-change...')
    
    const response = await fetch(`${supabaseUrl}/functions/v1/process-immediate-change`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
        'x-user-id': users.id // Header personnalisé pour identifier l\'utilisateur
      },
      body: JSON.stringify({
        userId: users.id,
        newPackId: targetPack.id,
        reason: 'Test de diagnostic avec service key',
        cancelSubscription: false
      })
    })
    
    console.log('📊 Status de la réponse:', response.status)
    console.log('📋 Headers de la réponse:')
    for (const [key, value] of response.headers.entries()) {
      console.log(`  ${key}: ${value}`)
    }
    
    const responseText = await response.text()
    console.log('📄 Contenu brut de la réponse:')
    console.log(responseText)
    
    if (!response.ok) {
      console.log('❌ Erreur HTTP:', response.status, response.statusText)
      try {
        const errorData = JSON.parse(responseText)
        console.log('🔍 Données d\'erreur parsées:')
        console.log(JSON.stringify(errorData, null, 2))
      } catch (parseError) {
        console.log('⚠️ Impossible de parser la réponse comme JSON')
        console.log('📝 Contenu brut:', responseText)
      }
    } else {
      console.log('✅ Succès!')
      try {
        const successData = JSON.parse(responseText)
        console.log('🎉 Données de succès:')
        console.log(JSON.stringify(successData, null, 2))
      } catch (parseError) {
        console.log('⚠️ Réponse de succès non-JSON')
        console.log('📝 Contenu:', responseText)
      }
    }
    
  } catch (err) {
    console.error('💥 Erreur générale:', err.message)
    console.error('📋 Stack trace:', err.stack)
  }
}

debugFunctionError()