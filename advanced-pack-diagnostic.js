/**
 * Script de diagnostic avancé pour identifier le problème de mise à jour du pack
 * Ce script vérifie tous les aspects de la synchronisation du pack
 */

// Configuration Supabase
const SUPABASE_URL = 'https://wnlnkqpjqjqjqjqjqjqj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduaG5rcXBqcWpxanFqcWpxanFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU4MjU2NzcsImV4cCI6MjA1MTQwMTY3N30.example';

// Fonction de diagnostic complet
const runAdvancedDiagnostic = async () => {
  console.log('🔍 === DIAGNOSTIC AVANCÉ DU PACK UTILISATEUR ===');
  
  try {
    // 1. Vérifier l'authentification
    console.log('\n1️⃣ Vérification de l\'authentification...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('❌ Erreur d\'authentification:', authError);
      return;
    }
    
    console.log('✅ Utilisateur connecté:', user.email);
    console.log('📋 User ID:', user.id);
    
    // 2. Vérifier les données du pack dans la base
    console.log('\n2️⃣ Vérification du pack dans la base de données...');
    const { data: userPacksDB, error: packError } = await supabase
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
      .order('created_at', { ascending: false });
    
    if (packError) {
      console.error('❌ Erreur lors de la récupération des packs:', packError);
      return;
    }
    
    console.log('📦 Tous les packs utilisateur dans la DB:', userPacksDB);
    
    const activePacks = userPacksDB?.filter(p => p.status === 'active') || [];
    console.log('✅ Packs actifs:', activePacks);
    
    if (activePacks.length === 0) {
      console.warn('⚠️  Aucun pack actif trouvé!');
    } else if (activePacks.length > 1) {
      console.warn('⚠️  Plusieurs packs actifs détectés (problème de synchronisation):', activePacks);
    } else {
      console.log('✅ Un seul pack actif (normal):', activePacks[0]);
    }
    
    // 3. Vérifier ce que retourne getUserPack
    console.log('\n3️⃣ Test de la fonction getUserPack...');
    try {
      const userPackResult = await getUserPack(user.id);
      console.log('📋 Résultat getUserPack:', userPackResult);
    } catch (getUserPackError) {
      console.error('❌ Erreur getUserPack:', getUserPackError);
    }
    
    // 4. Vérifier le contexte React (si disponible)
    console.log('\n4️⃣ Vérification du contexte React...');
    if (typeof window !== 'undefined' && window.React) {
      console.log('✅ React détecté dans le contexte');
      
      // Essayer d'accéder au contexte ServicesContext
      const servicesContextData = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
      if (servicesContextData) {
        console.log('🔍 React DevTools disponible');
      }
    }
    
    // 5. Vérifier le localStorage et sessionStorage
    console.log('\n5️⃣ Vérification du cache local...');
    const localStorageKeys = Object.keys(localStorage).filter(key => 
      key.includes('supabase') || key.includes('pack') || key.includes('user')
    );
    console.log('🗄️  Clés localStorage liées:', localStorageKeys);
    
    localStorageKeys.forEach(key => {
      try {
        const value = localStorage.getItem(key);
        console.log(`   ${key}:`, JSON.parse(value));
      } catch (e) {
        console.log(`   ${key}:`, localStorage.getItem(key));
      }
    });
    
    // 6. Tester le rafraîchissement manuel
    console.log('\n6️⃣ Test de rafraîchissement manuel...');
    if (typeof refreshUserServices === 'function') {
      console.log('🔄 Fonction refreshUserServices trouvée, test en cours...');
      await refreshUserServices();
      console.log('✅ RefreshUserServices exécuté');
    } else {
      console.warn('⚠️  Fonction refreshUserServices non disponible dans ce contexte');
    }
    
    // 7. Vérifier les données en temps réel
    console.log('\n7️⃣ Vérification des données en temps réel...');
    const currentUserPack = await getUserPack(user.id);
    console.log('📋 Pack actuel (temps réel):', currentUserPack);
    
    // 8. Diagnostic des problèmes potentiels
    console.log('\n8️⃣ Diagnostic des problèmes potentiels...');
    
    const issues = [];
    
    if (activePacks.length === 0) {
      issues.push('Aucun pack actif dans la base de données');
    }
    
    if (activePacks.length > 1) {
      issues.push('Plusieurs packs actifs (conflit de synchronisation)');
    }
    
    if (!currentUserPack) {
      issues.push('getUserPack retourne null');
    }
    
    if (issues.length > 0) {
      console.log('🚨 Problèmes détectés:');
      issues.forEach((issue, index) => {
        console.log(`   ${index + 1}. ${issue}`);
      });
    } else {
      console.log('✅ Aucun problème majeur détecté');
    }
    
    // 9. Suggestions de correction
    console.log('\n9️⃣ Suggestions de correction...');
    
    if (activePacks.length > 1) {
      console.log('🔧 Correction suggérée: Désactiver les packs en double');
      console.log('   Exécutez: await fixMultipleActivePacks()');
    }
    
    if (activePacks.length === 0) {
      console.log('🔧 Correction suggérée: Assigner un pack par défaut');
      console.log('   Exécutez: await assignDefaultPack()');
    }
    
    console.log('\n✅ Diagnostic terminé!');
    
  } catch (error) {
    console.error('❌ Erreur lors du diagnostic:', error);
  }
};

// Fonction pour corriger les packs multiples
const fixMultipleActivePacks = async () => {
  console.log('🔧 Correction des packs multiples...');
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {throw new Error('Utilisateur non connecté');}
    
    // Récupérer tous les packs actifs
    const { data: activePacks } = await supabase
      .from('user_packs')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false });
    
    if (activePacks && activePacks.length > 1) {
      // Garder le plus récent, désactiver les autres
      const [latestPack, ...oldPacks] = activePacks;
      
      console.log('📦 Pack à conserver:', latestPack);
      console.log('🗑️  Packs à désactiver:', oldPacks);
      
      for (const oldPack of oldPacks) {
        const { error } = await supabase
          .from('user_packs')
          .update({ status: 'cancelled', updated_at: new Date().toISOString() })
          .eq('id', oldPack.id);
        
        if (error) {
          console.error('❌ Erreur lors de la désactivation du pack:', oldPack.id, error);
        } else {
          console.log('✅ Pack désactivé:', oldPack.id);
        }
      }
      
      console.log('✅ Correction terminée!');
      return true;
    } else {
      console.log('ℹ️  Aucun pack multiple détecté');
      return false;
    }
  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error);
    return false;
  }
};

// Fonction pour assigner un pack par défaut
const assignDefaultPack = async () => {
  console.log('🔧 Assignation d\'un pack par défaut...');
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {throw new Error('Utilisateur non connecté');}
    
    // Pack gratuit par défaut
    const defaultPackId = '0a85e74a-4aec-480a-8af1-7b57391a80d2';
    
    const { data, error } = await supabase
      .from('user_packs')
      .insert({
        user_id: user.id,
        pack_id: defaultPackId,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) {
      console.error('❌ Erreur lors de l\'assignation:', error);
      return false;
    }
    
    console.log('✅ Pack par défaut assigné:', data);
    return true;
  } catch (error) {
    console.error('❌ Erreur lors de l\'assignation:', error);
    return false;
  }
};

// Fonction de correction automatique complète
const autoFixPackIssues = async () => {
  console.log('🤖 Correction automatique des problèmes de pack...');
  
  try {
    // 1. Corriger les packs multiples
    const multipleFixed = await fixMultipleActivePacks();
    
    // 2. Vérifier s'il faut assigner un pack par défaut
    const { data: { user } } = await supabase.auth.getUser();
    const { data: activePacks } = await supabase
      .from('user_packs')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active');
    
    if (!activePacks || activePacks.length === 0) {
      await assignDefaultPack();
    }
    
    // 3. Rafraîchir les données
    if (typeof refreshUserServices === 'function') {
      await refreshUserServices();
    }
    
    // 4. Recharger la page pour forcer la mise à jour
    console.log('🔄 Rechargement de la page pour appliquer les corrections...');
    setTimeout(() => {
      window.location.reload();
    }, 2000);
    
    console.log('✅ Correction automatique terminée!');
    
  } catch (error) {
    console.error('❌ Erreur lors de la correction automatique:', error);
  }
};

// Fonctions utilitaires pour les tests
const testFunctions = {
  runAdvancedDiagnostic,
  fixMultipleActivePacks,
  assignDefaultPack,
  autoFixPackIssues
};

// Rendre les fonctions disponibles globalement
if (typeof window !== 'undefined') {
  window.packDiagnostic = testFunctions;
}

// Auto-exécution du diagnostic
console.log('🚀 Script de diagnostic avancé chargé!');
console.log('📋 Fonctions disponibles:');
console.log('   - runAdvancedDiagnostic() : Diagnostic complet');
console.log('   - fixMultipleActivePacks() : Corriger les packs multiples');
console.log('   - assignDefaultPack() : Assigner un pack par défaut');
console.log('   - autoFixPackIssues() : Correction automatique complète');
console.log('\n🔍 Lancement du diagnostic automatique...');

// Lancer le diagnostic automatiquement
if (typeof supabase !== 'undefined') {
  runAdvancedDiagnostic();
} else {
  console.warn('⚠️  Supabase non disponible, diagnostic manuel requis');
}