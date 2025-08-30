const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variables d\'environnement manquantes')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testSmartPackChangeDetailed() {
  try {
    console.log('🔍 Test détaillé de smart-pack-change...')
    
    // Authentification
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'test-smart-pack@mangoo.tech',
      password: 'testpass123'
    })
    
    if (authError || !authData.user) {
      console.log('❌ Erreur d\'authentification:', authError?.message)
      return
    }
    
    console.log('✅ Utilisateur authentifié:', authData.user.email)
    console.log('🔑 Token:', authData.session?.access_token?.substring(0, 20) + '...')
    
    // Récupérer les packs
    const { data: packs, error: packsError } = await supabase
      .from('packs')
      .select('*')
      .order('price')
    
    if (packsError || !packs?.length) {
      console.log('❌ Erreur récupération packs:', packsError?.message)
      return
    }
    
    console.log('📦 Packs disponibles:')
    packs.forEach(p => console.log(`  - ${p.name}: ${p.price}€ (ID: ${p.id})`))
    
    // Prendre le pack gratuit (Pack Découverte)
    const targetPack = packs.find(p => p.price === 0) || packs[0]
    
    console.log('🎯 Pack cible:', targetPack.name, `(${targetPack.price}€)`)
    
    // Appel direct avec fetch pour plus de détails
    console.log('📞 Appel direct de smart-pack-change...')
    
    const response = await fetch(`${supabaseUrl}/functions/v1/smart-pack-change`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authData.session.access_token}`,
        'Content-Type': 'application/json',
        'apikey': supabaseAnonKey
      },
      body: JSON.stringify({
        packId: targetPack.id,
        successUrl: 'https://mangoo.tech/success',
        cancelUrl: 'https://mangoo.tech/cancel'
      })
    })
    
    console.log('📊 Status de la réponse:', response.status)
    console.log('📋 Headers de la réponse:', Object.fromEntries(response.headers.entries()))
    
    const responseText = await response.text()
    console.log('📄 Réponse brute:', responseText)
    
    try {
      const result = JSON.parse(responseText)
      console.log('✅ Réponse JSON parsée:')
      console.log(JSON.stringify(result, null, 2))
    } catch (parseError) {
      console.log('❌ Erreur de parsing JSON:', parseError.message)
    }
    
  } catch (err) {
    console.error('💥 Erreur générale:', err.message)
    console.error('📋 Stack trace:', err.stack)
  }
}

testSmartPackChangeDetailed()