// Script de diagnostic pour le problème de déconnexion
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ptrqhtwstldphjaraufi.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0cnFodHdzdGxkcGhqYXJhdWZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MzI0OTIsImV4cCI6MjA3MDUwODQ5Mn0.Wc-dKWVMpAyFoAPFGejzhD0o1rodyEGrBlZK5X3muyA'

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: window?.localStorage || {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {}
    },
    storageKey: 'mangoo-tech-auth',
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

async function debugLogout() {
  console.log('=== DIAGNOSTIC DE DÉCONNEXION ===\n')
  
  try {
    // 1. Vérifier l'état actuel de la session
    console.log('1. Vérification de l\'état de la session...')
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('❌ Erreur lors de la récupération de la session:', sessionError.message)
      return
    }
    
    if (!session) {
      console.log('⚠️ Aucune session active trouvée')
      console.log('   L\'utilisateur semble déjà déconnecté')
      return
    }
    
    console.log('✅ Session active trouvée:')
    console.log('   Utilisateur:', session.user.email)
    console.log('   ID:', session.user.id)
    console.log('   Expires at:', new Date(session.expires_at * 1000).toLocaleString())
    
    // 2. Vérifier le localStorage
    console.log('\n2. Vérification du localStorage...')
    if (typeof window !== 'undefined' && window.localStorage) {
      const authData = localStorage.getItem('mangoo-tech-auth')
      if (authData) {
        console.log('✅ Données d\'authentification trouvées dans localStorage')
        try {
          const parsed = JSON.parse(authData)
          console.log('   Clés disponibles:', Object.keys(parsed))
        } catch (e) {
          console.log('⚠️ Impossible de parser les données localStorage')
        }
      } else {
        console.log('⚠️ Aucune donnée d\'authentification dans localStorage')
      }
    } else {
      console.log('⚠️ localStorage non disponible')
    }
    
    // 3. Tester la déconnexion
    console.log('\n3. Test de déconnexion...')
    const { error: signOutError } = await supabase.auth.signOut()
    
    if (signOutError) {
      console.error('❌ Erreur lors de la déconnexion:', signOutError.message)
      console.error('   Code d\'erreur:', signOutError.code)
      console.error('   Détails:', signOutError)
      return
    }
    
    console.log('✅ Commande de déconnexion exécutée sans erreur')
    
    // 4. Vérifier l'état après déconnexion
    console.log('\n4. Vérification de l\'état après déconnexion...')
    
    // Attendre un peu pour que la déconnexion soit traitée
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const { data: { session: newSession }, error: newSessionError } = await supabase.auth.getSession()
    
    if (newSessionError) {
      console.error('❌ Erreur lors de la vérification post-déconnexion:', newSessionError.message)
      return
    }
    
    if (newSession) {
      console.log('❌ PROBLÈME: Session encore active après déconnexion!')
      console.log('   Utilisateur:', newSession.user.email)
      console.log('   ID:', newSession.user.id)
    } else {
      console.log('✅ Session correctement supprimée')
    }
    
    // 5. Vérifier le localStorage après déconnexion
    console.log('\n5. Vérification du localStorage après déconnexion...')
    if (typeof window !== 'undefined' && window.localStorage) {
      const authDataAfter = localStorage.getItem('mangoo-tech-auth')
      if (authDataAfter) {
        console.log('⚠️ Données d\'authentification encore présentes dans localStorage')
        try {
          const parsed = JSON.parse(authDataAfter)
          console.log('   Contenu:', parsed)
        } catch (e) {
          console.log('   Données corrompues')
        }
      } else {
        console.log('✅ localStorage correctement nettoyé')
      }
    }
    
    console.log('\n=== FIN DU DIAGNOSTIC ===')
    
  } catch (error) {
    console.error('❌ Erreur inattendue lors du diagnostic:', error)
    console.error('   Stack:', error.stack)
  }
}

// Exécuter le diagnostic
if (typeof window !== 'undefined') {
  // Dans le navigateur
  window.debugLogout = debugLogout
  console.log('Fonction debugLogout() disponible dans la console')
} else {
  // En Node.js
  debugLogout()
}

export default debugLogout