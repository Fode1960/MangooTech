// 🧪 TEST IMMÉDIAT - Redirection vers nouveau système sécurisé
// 📋 À COPIER DANS LA CONSOLE DU NAVIGATEUR (F12)

console.log('🧪 TEST IMMÉDIAT DU NOUVEAU SYSTÈME SÉCURISÉ')
console.log('🎯 Objectif: Vérifier que Boutique Testeur 2025 s\'affiche correctement')
console.log('')

async function testNouveauSysteme() {
  try {
    console.log('🔍 1. Vérification connexion et boutique...')
    
    // Obtenir l'utilisateur connecté
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.log('❌ Non connecté')
      return
    }
    
    console.log('✅ Connecté:', user.email)
    console.log('📋 User ID:', user.id)
    
    // Importer le nouveau système sécurisé
    const { getSecureUserShop } = await import('./src/lib/secureShopSystem.js')
    
    // Vérifier la boutique sécurisée
    const secureShop = await getSecureUserShop(user.id)
    
    if (secureShop) {
      console.log('🏪 Boutique sécurisée trouvée:', secureShop.name)
      console.log('📊 Statut:', secureShop.status)
      console.log('🔗 Slug:', secureShop.slug)
      
      if (secureShop.name === 'Boutique Testeur 2025') {
        console.log('🎉 SUCCÈS! C\'est la bonne boutique!')
      } else {
        console.log('⚠️  ATTENTION: Nom différent -', secureShop.name)
      }
    } else {
      console.log('ℹ️  Aucune boutique trouvée pour cet utilisateur')
    }
    
    console.log('')
    console.log('🔍 2. Test de redirection vers nouveau système...')
    
    // Rediriger vers le nouveau système sécurisé
    console.log('🧭 Redirection vers /secure-dashboard...')
    window.location.href = '/secure-dashboard'
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error)
  }
}

// Fonction alternative si la redirection ne fonctionne pas
function naviguerManuellement() {
  console.log('🧭 Navigation manuelle vers le nouveau système:')
  console.log('1. Cliquez sur ce lien: http://localhost:3002/secure-dashboard')
  console.log('2. Ou collez cette URL dans la barre d\'adresse')
  console.log('3. Le nouveau système sécurisé doit s\'ouvrir')
}

// Instructions
console.log('📖 INSTRUCTIONS:')
console.log('1. Attendez que cette page charge complètement')
console.log('2. Tapez: testNouveauSysteme()')
console.log('3. Si la redirection échoue: naviguerManuellement()')
console.log('')

// Auto-test après 2 secondes
setTimeout(() => {
  console.log('⏰ Auto-test démarré...')
  testNouveauSysteme()
}, 2000)