const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variables d\'environnement manquantes')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testSmartPackChange() {
  try {
    console.log('🔍 Test de smart-pack-change avec authentification...')
    
    // Authentification avec un utilisateur existant
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'test-smart-pack@mangoo.tech',
      password: 'testpass123'
    })
    
    if (authError || !authData.user) {
      console.log('❌ Erreur d\'authentification:', authError?.message)
      return
    }
    
    console.log('✅ Utilisateur authentifié:', authData.user.email)
    
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
    
    // Prendre le pack Visibilité (pack payant)
    const targetPack = packs.find(p => p.name.includes('Visibilité')) || packs[1]
    
    console.log('🎯 Pack cible:', targetPack.name, `(ID: ${targetPack.id})`)
    
    // Appel de la fonction smart-pack-change
    console.log('📞 Appel de smart-pack-change...')
    
    const { data: result, error: functionError } = await supabase.functions.invoke('smart-pack-change', {
      body: {
        packId: targetPack.id,
        successUrl: 'https://mangoo.tech/success',
        cancelUrl: 'https://mangoo.tech/cancel'
      }
    })
    
    if (functionError) {
      console.log('❌ Erreur fonction:', functionError.message)
      console.log('🔍 Détails:', JSON.stringify(functionError, null, 2))
    } else {
      console.log('✅ Succès!')
      console.log('🎉 Résultat:')
      console.log(JSON.stringify(result, null, 2))
    }
    
  } catch (err) {
    console.error('💥 Erreur générale:', err.message)
    console.error('📋 Stack trace:', err.stack)
  }
}

testSmartPackChange()