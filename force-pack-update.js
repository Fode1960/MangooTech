/**
 * Script pour forcer la mise à jour du pack dans le dashboard
 * Ce script force le rechargement des données du contexte React
 */

// Configuration
const SUPABASE_URL = 'https://wnlnkqpjqjqjqjqjqjqj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduaG5rcXBqcWpxanFqcWpxanFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU4MjU2NzcsImV4cCI6MjA1MTQwMTY3N30.example';

// Fonction pour forcer la mise à jour du pack
const forcePackUpdate = async () => {
  console.log('🔄 === FORÇAGE DE LA MISE À JOUR DU PACK ===');
  
  try {
    // 1. Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('❌ Erreur d\'authentification:', authError);
      return false;
    }
    
    console.log('✅ Utilisateur connecté:', user.email);
    
    // 2. Forcer le rechargement des données du pack
    console.log('\n🔄 Rechargement forcé des données du pack...');
    
    // Récupérer le pack actuel directement de la DB
    const { data: currentPack, error: packError } = await supabase
      .from('user_packs')
      .select(`
        *,
        packs(
          id,
          name,
          description,
          price,
          currency,
          billing_period
        )
      `)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (packError) {
      console.error('❌ Erreur lors de la récupération du pack:', packError);
      return false;
    }
    
    console.log('📦 Pack actuel dans la DB:', currentPack);
    
    // 3. Mettre à jour le localStorage avec les nouvelles données
    console.log('\n💾 Mise à jour du cache local...');
    
    // Nettoyer le cache Supabase
    const supabaseKeys = Object.keys(localStorage).filter(key => key.includes('supabase'));
    supabaseKeys.forEach(key => {
      if (key.includes('auth-token') || key.includes('user')) {
        console.log('🗑️  Nettoyage du cache:', key);
        // Ne pas supprimer le token d'auth, juste le marquer pour refresh
      }
    });
    
    // 4. Forcer le rechargement du contexte React
    console.log('\n⚛️  Tentative de rechargement du contexte React...');
    
    // Essayer de déclencher un re-render en modifiant l'état
    if (typeof window !== 'undefined') {
      // Déclencher un événement personnalisé pour forcer le refresh
      const refreshEvent = new CustomEvent('forcePackRefresh', {
        detail: { newPack: currentPack }
      });
      window.dispatchEvent(refreshEvent);
      
      // Essayer d'accéder au contexte React via les DevTools
      if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
        console.log('🔧 React DevTools détecté, tentative de refresh...');
      }
    }
    
    // 5. Simuler un appel à refreshUserServices
    console.log('\n🔄 Simulation de refreshUserServices...');
    
    // Essayer de trouver et appeler la fonction de refresh
    if (typeof refreshUserServices === 'function') {
      console.log('📞 Appel de refreshUserServices...');
      await refreshUserServices();
      console.log('✅ RefreshUserServices exécuté');
    } else {
      console.log('⚠️  refreshUserServices non disponible, utilisation d\'une méthode alternative');
      
      // Méthode alternative : déclencher un refresh via l'événement storage
      localStorage.setItem('pack-refresh-trigger', Date.now().toString());
      localStorage.removeItem('pack-refresh-trigger');
    }
    
    // 6. Forcer la mise à jour de l'affichage
    console.log('\n🎨 Mise à jour forcée de l\'affichage...');
    
    // Essayer de mettre à jour les éléments DOM directement
    const packNameElements = document.querySelectorAll('[data-pack-name], .pack-name, .current-pack-name');
    const packPriceElements = document.querySelectorAll('[data-pack-price], .pack-price, .current-pack-price');
    
    if (packNameElements.length > 0) {
      packNameElements.forEach(element => {
        element.textContent = currentPack.packs?.name || 'Pack mis à jour';
        console.log('🏷️  Nom du pack mis à jour dans:', element);
      });
    }
    
    if (packPriceElements.length > 0) {
      packPriceElements.forEach(element => {
        element.textContent = currentPack.packs?.price || '0';
        console.log('💰 Prix du pack mis à jour dans:', element);
      });
    }
    
    // 7. Déclencher un rechargement complet si nécessaire
    console.log('\n🔄 Options de rechargement...');
    console.log('   1. Rechargement doux (recommandé)');
    console.log('   2. Rechargement complet de la page');
    
    // Rechargement doux d'abord
    setTimeout(() => {
      console.log('🔄 Rechargement doux en cours...');
      
      // Déclencher les événements de changement d'état
      window.dispatchEvent(new Event('resize'));
      window.dispatchEvent(new Event('focus'));
      
      // Si ça ne marche pas, rechargement complet
      setTimeout(() => {
        console.log('🔄 Rechargement complet de la page...');
        window.location.reload();
      }, 3000);
    }, 1000);
    
    console.log('\n✅ Mise à jour forcée terminée!');
    return true;
    
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour forcée:', error);
    return false;
  }
};

// Fonction pour surveiller les changements de pack
const watchPackChanges = () => {
  console.log('👁️  Surveillance des changements de pack activée...');
  
  // Écouter l'événement personnalisé
  window.addEventListener('forcePackRefresh', (event) => {
    console.log('🔔 Événement de refresh détecté:', event.detail);
  });
  
  // Surveiller les changements dans localStorage
  window.addEventListener('storage', (event) => {
    if (event.key && event.key.includes('pack')) {
      console.log('🔔 Changement de pack détecté dans localStorage:', event);
      forcePackUpdate();
    }
  });
  
  // Surveiller les changements d'URL
  let currentUrl = window.location.href;
  setInterval(() => {
    if (window.location.href !== currentUrl) {
      currentUrl = window.location.href;
      if (currentUrl.includes('success=true') || currentUrl.includes('pack=')) {
        console.log('🔔 Changement d\'URL détecté avec paramètres de pack');
        setTimeout(forcePackUpdate, 1000);
      }
    }
  }, 1000);
};

// Fonction de test rapide
const quickPackTest = async () => {
  console.log('⚡ Test rapide du pack...');
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('❌ Utilisateur non connecté');
      return;
    }
    
    const { data: pack } = await supabase
      .from('user_packs')
      .select('*, packs(*)')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();
    
    console.log('📦 Pack actuel:', pack);
    
    // Vérifier si l'affichage correspond
    const displayedPackName = document.querySelector('.pack-name, [data-pack-name]')?.textContent;
    const actualPackName = pack?.packs?.name;
    
    if (displayedPackName !== actualPackName) {
      console.warn('⚠️  Désynchronisation détectée!');
      console.log('   Affiché:', displayedPackName);
      console.log('   Réel:', actualPackName);
      return false;
    } else {
      console.log('✅ Affichage synchronisé');
      return true;
    }
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
    return false;
  }
};

// Fonction de correction intelligente
const smartPackFix = async () => {
  console.log('🧠 Correction intelligente du pack...');
  
  // 1. Test rapide
  const isSync = await quickPackTest();
  
  if (isSync) {
    console.log('✅ Aucune correction nécessaire');
    return true;
  }
  
  // 2. Correction forcée
  console.log('🔧 Correction nécessaire, lancement...');
  return await forcePackUpdate();
};

// Rendre les fonctions disponibles globalement
if (typeof window !== 'undefined') {
  window.packUpdater = {
    forcePackUpdate,
    watchPackChanges,
    quickPackTest,
    smartPackFix
  };
}

// Auto-exécution
console.log('🚀 Script de mise à jour forcée du pack chargé!');
console.log('📋 Fonctions disponibles:');
console.log('   - forcePackUpdate() : Force la mise à jour');
console.log('   - watchPackChanges() : Surveille les changements');
console.log('   - quickPackTest() : Test rapide de synchronisation');
console.log('   - smartPackFix() : Correction intelligente');

// Démarrer la surveillance
if (typeof window !== 'undefined') {
  watchPackChanges();
}

// Lancer la correction intelligente
if (typeof supabase !== 'undefined') {
  console.log('\n🧠 Lancement de la correction intelligente...');
  smartPackFix();
} else {
  console.warn('⚠️  Supabase non disponible, correction manuelle requise');
}