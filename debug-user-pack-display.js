// Script de diagnostic pour vérifier pourquoi l'utilisateur ne voit pas son pack acheté
// À exécuter dans la console du navigateur sur la page Dashboard

(async function debugUserPackDisplay() {
  console.log('🔍 === DIAGNOSTIC AFFICHAGE PACK UTILISATEUR ===\n');
  
  // 1. Vérifier si l'utilisateur est connecté
  const user = JSON.parse(localStorage.getItem('sb-' + window.location.hostname.replace(/\./g, '-') + '-auth-token') || '{}');
  const userId = user?.user?.id;
  
  if (!userId) {
    console.error('❌ Utilisateur non connecté ou token invalide');
    console.log('💡 Solution: Se reconnecter à l\'application');
    return;
  }
  
  console.log('✅ Utilisateur connecté:', userId);
  
  // 2. Vérifier les données dans le localStorage/sessionStorage
  console.log('\n📱 === VÉRIFICATION STOCKAGE LOCAL ===');
  const authData = localStorage.getItem('sb-' + window.location.hostname.replace(/\./g, '-') + '-auth-token');
  console.log('🔑 Auth token présent:', !!authData);
  
  // 3. Vérifier les appels réseau dans la console
  console.log('\n🌐 === INSTRUCTIONS POUR VÉRIFIER LES APPELS RÉSEAU ===');
  console.log('1. Ouvrez l\'onglet "Network" dans les outils de développement');
  console.log('2. Filtrez par "user_packs" ou "getUserPack"');
  console.log('3. Rechargez la page et vérifiez les réponses');
  
  // 4. Vérifier si les données sont dans le contexte React
  console.log('\n⚛️ === VÉRIFICATION CONTEXTE REACT ===');
  
  // Essayer d'accéder aux données du contexte via les DevTools React
  if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    console.log('✅ React DevTools détectés');
    console.log('💡 Allez dans l\'onglet "Components" et cherchez "ServicesProvider"');
    console.log('💡 Vérifiez la valeur de "userPack" dans le state');
  } else {
    console.log('⚠️ React DevTools non installés');
    console.log('💡 Installez l\'extension React DevTools pour plus de détails');
  }
  
  // 5. Tester l'appel direct à l'API
  console.log('\n🔧 === TEST DIRECT API SUPABASE ===');
  
  try {
    // Récupérer la configuration Supabase depuis les variables d'environnement
    const supabaseUrl = window.location.origin.includes('localhost') 
      ? 'https://your-project.supabase.co' // Remplacer par votre URL
      : 'https://your-project.supabase.co';
    
    console.log('⚠️ ATTENTION: Vous devez remplacer l\'URL Supabase dans ce script');
    console.log('💡 Trouvez votre URL dans src/lib/supabase.js');
    
    // Instructions pour tester manuellement
    console.log('\n📋 === REQUÊTE SQL À TESTER DANS SUPABASE ===');
    console.log(`
SELECT 
  up.*,
  p.name as pack_name,
  p.price,
  p.currency
FROM user_packs up
JOIN packs p ON up.pack_id = p.id
WHERE up.user_id = '${userId}'
AND up.status = 'active'
ORDER BY up.created_at DESC
LIMIT 1;
`);
    
  } catch (error) {
    console.error('❌ Erreur lors du test API:', error);
  }
  
  // 6. Vérifications communes
  console.log('\n🔍 === VÉRIFICATIONS COMMUNES ===');
  
  // Vérifier si la page est bien chargée
  const dashboardElement = document.querySelector('[data-testid="dashboard"], .dashboard, #dashboard');
  console.log('📄 Page Dashboard chargée:', !!dashboardElement);
  
  // Vérifier les erreurs JavaScript
  console.log('\n🚨 === VÉRIFICATION ERREURS ===');
  console.log('💡 Vérifiez la console pour d\'autres erreurs JavaScript');
  console.log('💡 Recherchez les messages commençant par "🔍 Debug" ou "❌"');
  
  // 7. Actions recommandées
  console.log('\n🎯 === ACTIONS RECOMMANDÉES ===');
  console.log('1. ✅ Vérifiez que vous êtes bien connecté');
  console.log('2. 🔄 Essayez de rafraîchir la page (F5)');
  console.log('3. 🚪 Déconnectez-vous et reconnectez-vous');
  console.log('4. 🗃️ Vérifiez la base de données avec la requête SQL ci-dessus');
  console.log('5. 🌐 Vérifiez les appels réseau dans l\'onglet Network');
  console.log('6. ⚛️ Vérifiez le state React avec les DevTools');
  
  // 8. Informations de débogage avancées
  console.log('\n🔬 === INFORMATIONS TECHNIQUES ===');
  console.log('User Agent:', navigator.userAgent);
  console.log('URL actuelle:', window.location.href);
  console.log('Timestamp:', new Date().toISOString());
  
  console.log('\n✅ Diagnostic terminé. Suivez les actions recommandées ci-dessus.');
  
})();

// Fonction utilitaire pour surveiller les changements de state
function watchUserPackChanges() {
  console.log('👀 Surveillance des changements de pack activée...');
  console.log('💡 Cette fonction surveille les changements dans le localStorage');
  
  let lastUserPack = null;
  
  setInterval(() => {
    try {
      const authData = localStorage.getItem('sb-' + window.location.hostname.replace(/\./g, '-') + '-auth-token');
      if (authData) {
        const parsed = JSON.parse(authData);
        const currentUser = parsed?.user;
        
        if (currentUser && currentUser !== lastUserPack) {
          console.log('🔄 Changement détecté dans les données utilisateur:', currentUser);
          lastUserPack = currentUser;
        }
      }
    } catch (error) {
      // Ignorer les erreurs de parsing
    }
  }, 2000);
}

// Démarrer la surveillance (optionnel)
// watchUserPackChanges();

console.log('\n🚀 Script de diagnostic chargé!');
console.log('💡 Tapez "debugUserPackDisplay()" pour lancer le diagnostic');
console.log('💡 Tapez "watchUserPackChanges()" pour surveiller les changements');