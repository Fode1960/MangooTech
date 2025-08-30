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

async function checkUserPackStatus() {
  try {
    console.log('🔍 Vérification du statut des packs utilisateur...')
    
    // Vérifier l'utilisateur mdansoko@mangoo.tech
    const userEmail = 'mdansoko@mangoo.tech'
    const userId = '409bf8a6-1f0f-47e6-88e5-d987d6f459d9'
    
    console.log(`\n👤 Utilisateur: ${userEmail} (${userId})`)
    
    // 1. Vérifier les packs actifs de l'utilisateur
    const { data: userPacks, error: userPacksError } = await supabase
      .from('user_packs')
      .select(`
        *,
        packs!inner(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (userPacksError) {
      console.error('❌ Erreur lors de la récupération des user_packs:', userPacksError.message)
      return
    }

    console.log('\n📦 Packs de l\'utilisateur:')
    userPacks.forEach((userPack, index) => {
      console.log(`${index + 1}. Pack: ${userPack.packs.name}`)
      console.log(`   - ID: ${userPack.pack_id}`)
      console.log(`   - Statut: ${userPack.status}`)
      console.log(`   - Prix: ${userPack.packs.price} ${userPack.packs.currency}`)
      console.log(`   - Créé: ${userPack.created_at}`)
      console.log(`   - Stripe ID: ${userPack.stripe_subscription_id || 'Aucun'}`)
      console.log('')
    })
    
    // 2. Vérifier le pack actif spécifiquement
    const { data: activePack, error: activePackError } = await supabase
      .from('user_packs')
      .select(`
        *,
        packs!inner(*)
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .single()

    if (activePackError) {
      console.error('❌ Aucun pack actif trouvé:', activePackError.message)
    } else {
      console.log('✅ Pack actif:')
      console.log(`   - Nom: ${activePack.packs.name}`)
      console.log(`   - ID: ${activePack.pack_id}`)
      console.log(`   - Prix: ${activePack.packs.price} ${activePack.packs.currency}`)
      console.log(`   - Récurrent: ${activePack.packs.is_recurring}`)
    }
    
    // 3. Vérifier tous les packs disponibles
    const { data: allPacks, error: allPacksError } = await supabase
      .from('packs')
      .select('*')
      .order('price', { ascending: true })

    if (allPacksError) {
      console.error('❌ Erreur lors de la récupération des packs:', allPacksError.message)
      return
    }

    console.log('\n🎯 Tous les packs disponibles:')
    allPacks.forEach((pack, index) => {
      console.log(`${index + 1}. ${pack.name} (${pack.id})`)
      console.log(`   - Prix: ${pack.price} ${pack.currency}`)
      console.log(`   - Récurrent: ${pack.is_recurring}`)
      console.log('')
    })

  } catch (error) {
    console.error('❌ Erreur générale:', error.message)
  }
}

// Exécuter la vérification
checkUserPackStatus()
  .then(() => {
    console.log('\n🏁 Vérification terminée')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Erreur fatale:', error)
    process.exit(1)
  })