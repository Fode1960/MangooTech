/**
 * Script de diagnostic pour identifier et corriger le problème d'URL malformée
 * Problème: http://localhost:300&/ au lieu de http://localhost:3001/
 */

console.log('🔍 === DIAGNOSTIC URL MALFORMÉE ===\n');

// 1. Vérifier les variables d'environnement côté client
console.log('1. Variables d\'environnement côté client:');
console.log('   window.location.origin:', window.location.origin);
console.log('   window.location.href:', window.location.href);
console.log('   window.location.host:', window.location.host);
console.log('   window.location.port:', window.location.port);

// 2. Vérifier la construction des URLs dans le code
console.log('\n2. Test de construction d\'URL:');
const testUrls = {
  success: `${window.location.origin}/dashboard?success=true&pack=test`,
  cancel: `${window.location.origin}/dashboard?canceled=true`
};
console.log('   URL de succès construite:', testUrls.success);
console.log('   URL d\'annulation construite:', testUrls.cancel);

// 3. Fonction pour tester l'appel à smart-pack-change
async function testSmartPackChange() {
  console.log('\n3. Test d\'appel à smart-pack-change...');
  
  try {
    // Simuler un appel sans vraiment changer de pack
    const testPackId = 'test-pack-id';
    const successUrl = `${window.location.origin}/dashboard?success=true&pack=${testPackId}`;
    const cancelUrl = `${window.location.origin}/dashboard?canceled=true`;
    
    console.log('   URLs envoyées à la fonction:');
    console.log('     successUrl:', successUrl);
    console.log('     cancelUrl:', cancelUrl);
    
    // Note: Ne pas faire l'appel réel pour éviter les effets de bord
    console.log('   ⚠️  Appel simulé (pas d\'appel réel pour éviter les changements)');
    
  } catch (error) {
    console.error('   ❌ Erreur lors du test:', error);
  }
}

// 4. Fonction pour vérifier les logs du navigateur
function checkBrowserLogs() {
  console.log('\n4. Vérification des logs récents...');
  
  // Vérifier s'il y a des erreurs dans la console
  const logs = [];
  const originalLog = console.log;
  const originalError = console.error;
  
  // Intercepter temporairement les logs
  console.log = (...args) => {
    logs.push({ type: 'log', args });
    originalLog.apply(console, args);
  };
  
  console.error = (...args) => {
    logs.push({ type: 'error', args });
    originalError.apply(console, args);
  };
  
  // Restaurer après 1 seconde
  setTimeout(() => {
    console.log = originalLog;
    console.error = originalError;
    
    console.log('   Logs interceptés:', logs.length);
    logs.forEach((log, index) => {
      if (log.args.some(arg => typeof arg === 'string' && arg.includes('300&'))) {
        console.log(`   🔴 Log suspect #${index}:`, log.args);
      }
    });
  }, 1000);
}

// 5. Fonction pour vérifier les paramètres d'URL actuels
function checkCurrentUrlParams() {
  console.log('\n5. Paramètres d\'URL actuels:');
  const urlParams = new URLSearchParams(window.location.search);
  
  for (const [key, value] of urlParams.entries()) {
    console.log(`   ${key}: ${value}`);
    if (value.includes('300&')) {
      console.log('   🔴 PROBLÈME DÉTECTÉ: URL malformée dans les paramètres!');
    }
  }
}

// 6. Fonction de correction d'urgence
function emergencyUrlFix() {
  console.log('\n6. Correction d\'urgence des URLs malformées...');
  
  // Vérifier l'URL actuelle
  const currentUrl = window.location.href;
  
  if (currentUrl.includes('300&')) {
    console.log('   🔴 URL malformée détectée:', currentUrl);
    
    // Corriger l'URL
    const correctedUrl = currentUrl.replace(/300&/g, '3002');
    console.log('   ✅ URL corrigée:', correctedUrl);
    
    // Demander confirmation avant redirection
    if (confirm('URL malformée détectée. Voulez-vous être redirigé vers l\'URL corrigée?')) {
      window.location.href = correctedUrl;
    }
  } else {
    console.log('   ✅ Aucune URL malformée détectée dans l\'URL actuelle');
  }
}

// 7. Fonction pour surveiller les redirections
function monitorRedirections() {
  console.log('\n7. Surveillance des redirections activée...');
  
  // Intercepter les changements d'URL
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;
  
  history.pushState = function(...args) {
    console.log('   📍 Navigation détectée (pushState):', args[2]);
    if (args[2] && args[2].includes('300&')) {
      console.log('   🔴 ALERTE: Navigation vers URL malformée bloquée!');
      args[2] = args[2].replace(/300&/g, '3002');
      console.log('   ✅ URL corrigée automatiquement:', args[2]);
    }
    return originalPushState.apply(this, args);
  };
  
  history.replaceState = function(...args) {
    console.log('   📍 Remplacement d\'URL détecté (replaceState):', args[2]);
    if (args[2] && args[2].includes('300&')) {
      console.log('   🔴 ALERTE: Remplacement vers URL malformée bloqué!');
      args[2] = args[2].replace(/300&/g, '3002');
      console.log('   ✅ URL corrigée automatiquement:', args[2]);
    }
    return originalReplaceState.apply(this, args);
  };
  
  // Surveiller les redirections window.location
  let originalLocation = window.location.href;
  setInterval(() => {
    if (window.location.href !== originalLocation) {
      console.log('   📍 Changement d\'URL détecté:', window.location.href);
      if (window.location.href.includes('300&')) {
        console.log('   🔴 ALERTE: URL malformée détectée!');
        emergencyUrlFix();
      }
      originalLocation = window.location.href;
    }
  }, 500);
}

// 8. Fonction principale de diagnostic
async function runDiagnostic() {
  console.log('\n🚀 Lancement du diagnostic complet...');
  
  // Exécuter tous les tests
  checkCurrentUrlParams();
  await testSmartPackChange();
  checkBrowserLogs();
  emergencyUrlFix();
  monitorRedirections();
  
  console.log('\n✅ Diagnostic terminé. Surveillance active.');
  console.log('\n💡 RECOMMANDATIONS:');
  console.log('   1. Vérifiez les variables d\'environnement FRONTEND_URL dans Supabase');
  console.log('   2. Vérifiez la configuration des Edge Functions');
  console.log('   3. Testez un changement de pack pour reproduire le problème');
  console.log('   4. Surveillez la console pour les URLs malformées');
}

// Auto-exécution
if (typeof window !== 'undefined') {
  runDiagnostic();
} else {
  console.log('Script à exécuter dans la console du navigateur');
}

// Export pour utilisation manuelle
window.urlDiagnostic = {
  runDiagnostic,
  testSmartPackChange,
  checkCurrentUrlParams,
  emergencyUrlFix,
  monitorRedirections
};

console.log('\n📋 Fonctions disponibles:');
console.log('   - urlDiagnostic.runDiagnostic() : Diagnostic complet');
console.log('   - urlDiagnostic.emergencyUrlFix() : Correction d\'urgence');
console.log('   - urlDiagnostic.monitorRedirections() : Surveillance des redirections');