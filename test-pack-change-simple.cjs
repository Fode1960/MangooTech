const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://ptrqhtwstldphjaraufi.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0cnFodHdzdGxkcGhqYXJhdWZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MzI0OTIsImV4cCI6MjA3MDUwODQ5Mn0.Wc-dKWVMpAyFoAPFGejzhD0o1rodyEGrBlZK5X3muyA'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testPackChange() {
  try {
    console.log('🔍 Test du changement de pack avec logs détaillés...')
    
    // Test avec un utilisateur existant (sans authentification pour éviter les problèmes de mot de passe)
    const testUserId = '9c97cee9-9c65-47dd-b75b-3d7a0f513701' // mdansoko@mangoo.tech
    
    // Simuler l'authentification en définissant l'utilisateur
     console.log('✅ Utilisation de l\'utilisateur test:', 'mdansoko@mangoo.tech')
     
     // Créer un token d'authentification temporaire pour les tests
     const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
       email: 'mdansoko@mangoo.tech',
       password: 'motdepasse123' // Mot de passe par défaut
     })
     
     if (signInError) {
       console.log('⚠️ Impossible de s\'authentifier, test sans auth:', signInError.message)
       // Continuer le test même sans authentification
     } else {
       console.log('✅ Utilisateur authentifié:', authData.user?.email)
     }
    
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
    
    // Prendre le premier pack différent du pack actuel
    const targetPack = packs.find(p => p.id !== 1) || packs[0]
    
    console.log('🎯 Pack cible:', targetPack.name, `(ID: ${targetPack.id})`)
    
    // Appeler la fonction smart-pack-change
    const { data, error } = await supabase.functions.invoke('smart-pack-change', {
      body: {
        newPackId: targetPack.id,
        reason: 'Test de diagnostic',
        cancelSubscription: false
      }
    })
    
    if (error) {
      console.log('❌ Erreur de la fonction:', error)
      console.log('📋 Détails de l\'erreur:', JSON.stringify(error, null, 2))
    } else {
      console.log('✅ Succès:', data)
    }
    
  } catch (err) {
    console.error('💥 Erreur générale:', err.message)
    console.error('📋 Stack trace:', err.stack)
  }
}

testPackChange()
