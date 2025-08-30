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

async function checkPacks() {
  try {
    console.log('📦 Vérification des packs disponibles...')
    
    const { data: packs, error } = await supabase
      .from('packs')
      .select('*')
      .order('price', { ascending: true })

    if (error) {
      console.error('❌ Erreur lors de la récupération des packs:', error.message)
      return
    }

    console.log('✅ Packs disponibles:')
    packs.forEach(pack => {
      console.log(`- ID: ${pack.id}, Nom: ${pack.name}, Prix: ${pack.price} ${pack.currency}`)
    })

    // Vérifier les utilisateurs
    console.log('\n👥 Vérification des utilisateurs...')
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers()
    
    if (usersError) {
      console.error('❌ Erreur lors de la récupération des utilisateurs:', usersError.message)
      return
    }

    console.log('✅ Utilisateurs disponibles:')
    users.users.forEach(user => {
      console.log(`- Email: ${user.email}, ID: ${user.id}`)
    })

    // Vérifier les user_packs actifs
    console.log('\n🔗 Vérification des packs utilisateurs actifs...')
    const { data: userPacks, error: userPacksError } = await supabase
      .from('user_packs')
      .select(`
        *,
        packs!inner(*)
      `)
      .eq('status', 'active')

    if (userPacksError) {
      console.error('❌ Erreur lors de la récupération des user_packs:', userPacksError.message)
      return
    }

    console.log('✅ Packs utilisateurs actifs:')
    userPacks.forEach(userPack => {
      console.log(`- Utilisateur: ${userPack.user_id}, Pack: ${userPack.packs.name} (${userPack.pack_id})`)
    })

  } catch (error) {
    console.error('❌ Erreur générale:', error.message)
  }
}

// Exécuter la vérification
checkPacks()
  .then(() => {
    console.log('\n🏁 Vérification terminée')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Erreur fatale:', error)
    process.exit(1)
  })