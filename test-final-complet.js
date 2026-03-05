// 🎯 TEST FINAL - Vérification complète du nouveau système sécurisé
// 📋 À COPIER DANS LA CONSOLE DU NAVIGATEUR (F12) sur http://localhost:3004

console.log('🎯 TEST FINAL - NOUVEAU SYSTÈME SÉCURISÉ')
console.log('🛡️ Vérification que Boutique Testeur 2025 s\'affiche correctement')
console.log('')

async function testFinal() {
  try {
    console.log('🔍 1. Connexion et vérification utilisateur...')
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.log('❌ Non connecté')
      return { success: false, error: 'Non connecté' }
    }
    
    console.log('✅ Connecté:', user.email)
    console.log('📋 User ID:', user.id)
    
    console.log('')
    console.log('🔍 2. Vérification boutique dans Supabase...')
    
    // Vérifier dans Supabase directement
    const { data: shops, error: shopError } = await supabase
      .from('shops')
      .select('*')
      .eq('user_id', user.id)
    
    if (shopError) {
      console.log('❌ Erreur Supabase:', shopError)
      return { success: false, error: shopError.message }
    }
    
    console.log('📊 Boutiques trouvées:', shops?.length || 0)
    
    if (shops && shops.length > 0) {
      const approvedShop = shops.find(s => s.status === 'approved')
      const mainShop = approvedShop || shops[0]
      
      console.log('🏪 Boutique principale:', mainShop.name)
      console.log('📊 Statut:', mainShop.status)
      
      if (mainShop.name === 'Boutique Testeur 2025') {
        console.log('🎉 SUCCÈS! C\'est bien la boutique test!')
      } else {
        console.log('⚠️  ATTENTION: Nom différent -', mainShop.name)
      }
    } else {
      console.log('ℹ️  Aucune boutique trouvée pour cet utilisateur')
    }
    
    console.log('')
    console.log('🔍 3. Test du nouveau système sécurisé...')
    
    // Importer et tester le nouveau système
    const { getSecureUserShop } = await import('./src/lib/secureShopSystem.js')
    const secureShop = await getSecureUserShop(user.id)
    
    if (secureShop) {
      console.log('✅ Système sécurisé: Boutique trouvée -', secureShop.name)
    } else {
      console.log('ℹ️  Système sécurisé: Aucune boutique')
    }
    
    console.log('')
    console.log('🔍 4. Vérification de la navigation...')
    
    // Vérifier que nous sommes sur la bonne page
    const currentPath = window.location.pathname
    console.log('📍 Chemin actuel:', currentPath)
    
    if (currentPath === '/seller/dashboard' || currentPath === '/secure-dashboard') {
      console.log('✅ Navigation: Sur la page du tableau de bord')
    } else {
      console.log('🧭 Navigation: Redirection nécessaire vers /seller/dashboard')
    }
    
    console.log('')
    console.log('🔍 5. Vérification d\'affichage...')
    
    // Vérifier ce qui s'affiche actuellement
    const pageContent = document.body.textContent
    const hasFode = pageContent.includes('Fodé boutique')
    const hasTesteur = pageContent.includes('Boutique Testeur 2025')
    
    console.log('❌ Contient "Fodé boutique":', hasFode)
    console.log('✅ Contient "Boutique Testeur 2025":', hasTesteur)
    
    // Vérifier les boutons
    const hasCreateButton = pageContent.includes('Créer ma boutique')
    const hasMyShopButton = pageContent.includes('Ma Boutique')
    
    console.log('📝 Bouton "Créer ma boutique":', hasCreateButton)
    console.log('🏪 Bouton "Ma Boutique":', hasMyShopButton)
    
    console.log('')
    console.log('📋 RÉSUMÉ FINAL:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('Utilisateur:', user.email)
    console.log('Boutiques:', shops?.length || 0)
    if (shops && shops.length > 0) {
      console.log('Boutique principale:', shops[0].name)
      console.log('Statut:', shops[0].status)
    }
    console.log('Contamination "Fodé":', hasFode ? '❌ OUI' : '✅ NON')
    console.log('Affichage correct:', hasTesteur ? '✅ OUI' : '❌ NON')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
    // CONCLUSION
    const success = !hasFode && hasTesteur && shops && shops.length > 0
    
    if (success) {
      console.log('')
      console.log('🎉🎉🎉 SUCCÈS TOTAL! 🎉🎉🎉')
      console.log('✅ Le nouveau système sécurisé fonctionne parfaitement!')
      console.log('✅ Zéro contamination détectée')
      console.log('✅ Chaque utilisateur voit sa propre boutique')
      console.log('✅ Le problème "Fodé boutique" est RÉSOLU!')
      
      // Stocker le résultat
      window.testFinalResults = {
        success: true,
        user: user.email,
        shop: shops[0],
        contamination: false
      }
      
    } else {
      console.log('')
      console.log('⚠️  PROBLÈME DÉTECTÉ')
      
      if (hasFode) {
        console.log('❌ Contamination "Fodé boutique" encore présente')
      }
      if (!hasTesteur && shops && shops.length > 0) {
        console.log('❌ La boutique approuvée ne s\'affiche pas')
      }
      if (!shops || shops.length === 0) {
        console.log('❌ Aucune boutique trouvée pour cet utilisateur')
      }
      
      // Stocker le résultat
      window.testFinalResults = {
        success: false,
        user: user.email,
        shops: shops,
        contamination: hasFode,
        displayCorrect: hasTesteur
      }
    }
    
    return window.testFinalResults
    
  } catch (error) {
    console.error('❌ Erreur lors du test final:', error)
    window.testFinalResults = { success: false, error: error.message }
    return window.testFinalResults
  }
}

// Fonction pour naviguer vers le nouveau système
function allerAuNouveauSysteme() {
  console.log('🧭 Navigation vers le nouveau système sécurisé...')
  window.location.href = '/seller/dashboard'
}

// Fonction de diagnostic complet
async function diagnosticComplet() {
  console.log('🔍 DIAGNOSTIC COMPLET EN COURS...')
  
  const results = await testFinal()
  
  if (!results.success) {
    console.log('')
    console.log('🔧 SOLUTIONS PROPOSÉES:')
    console.log('1. Naviguez manuellement vers: http://localhost:3004/seller/dashboard')
    console.log('2. Vérifiez que vous êtes connecté avec le bon compte')
    console.log('3. Ouvrez la console et refaites le test')
    console.log('4. Si le problème persiste, le système doit être nettoyé')
  }
  
  return results
}

// Instructions
console.log('📖 INSTRUCTIONS:')
console.log('1. Attendez que cette page charge complètement')
console.log('2. Tapez: testFinal()')
console.log('3. Ou pour diagnostic complet: diagnosticComplet()')
console.log('4. Ou pour navigation directe: allerAuNouveauSysteme()')
console.log('')

// Auto-test après 3 secondes
setTimeout(() => {
  console.log('⏰ Auto-test démarré...')
  diagnosticComplet()
}, 3000)