/**
 * Script de test pour vérifier la synchronisation du pack après paiement
 * 
 * PROBLÈME RÉSOLU:
 * - Le webhook Stripe utilisait l'UUID du pack pour selected_pack
 * - L'interface Dashboard utilise un système de slug pour l'affichage
 * - Correction: Le webhook génère maintenant le slug correct
 * 
 * À exécuter dans la console du navigateur après un changement de pack
 */

console.log('🧪 === TEST DE SYNCHRONISATION PACK APRÈS PAIEMENT ===\n');

// Configuration
const USER_ID = 'REMPLACER_PAR_VOTRE_USER_ID'; // À remplacer par l'ID utilisateur réel

// Fonction principale de test
async function testPackSyncAfterPayment() {
  try {
    console.log('1️⃣ Vérification de l\'utilisateur connecté...');
    
    // Récupérer l'utilisateur depuis le localStorage
    const authData = localStorage.getItem('sb-' + window.location.hostname.replace(/\./g, '-') + '-auth-token');
    if (!authData) {
      console.error('❌ Aucune donnée d\'authentification trouvée');
      return;
    }
    
    const user = JSON.parse(authData)?.user;
    if (!user?.id) {
      console.error('❌ Utilisateur non connecté');
      return;
    }
    
    console.log('✅ Utilisateur connecté:', user.id);
    
    console.log('\n2️⃣ Vérification du pack actif en base de données...');
    
    // Simuler un appel à l'API Supabase (remplacer par votre configuration)
    const supabaseUrl = 'VOTRE_SUPABASE_URL';
    const supabaseKey = 'VOTRE_SUPABASE_ANON_KEY';
    
    // Test 1: Vérifier le pack actif dans user_packs
    console.log('📦 Récupération du pack actif...');
    const userPackResponse = await fetch(`${supabaseUrl}/rest/v1/user_packs?user_id=eq.${user.id}&status=eq.active&select=*,packs(*)`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!userPackResponse.ok) {
      console.error('❌ Erreur récupération pack actif:', userPackResponse.status);
      return;
    }
    
    const userPacks = await userPackResponse.json();
    console.log('📊 Packs actifs trouvés:', userPacks.length);
    
    if (userPacks.length === 0) {
      console.error('❌ PROBLÈME: Aucun pack actif trouvé');
      console.log('💡 Vérifiez que le webhook Stripe a bien créé le pack');
      return;
    }
    
    const currentPack = userPacks[0];
    console.log('✅ Pack actif:', {
      pack_id: currentPack.pack_id,
      pack_name: currentPack.packs?.name,
      status: currentPack.status,
      started_at: currentPack.started_at
    });
    
    console.log('\n3️⃣ Vérification du selected_pack dans users...');
    
    // Test 2: Vérifier le selected_pack dans la table users
    const userResponse = await fetch(`${supabaseUrl}/rest/v1/users?id=eq.${user.id}&select=id,email,selected_pack`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!userResponse.ok) {
      console.error('❌ Erreur récupération utilisateur:', userResponse.status);
      return;
    }
    
    const users = await userResponse.json();
    if (users.length === 0) {
      console.error('❌ Utilisateur non trouvé');
      return;
    }
    
    const userData = users[0];
    console.log('👤 Selected pack:', userData.selected_pack);
    
    // Test 3: Vérifier la cohérence entre pack actif et selected_pack
    console.log('\n4️⃣ Vérification de la cohérence...');
    
    // Générer le slug attendu à partir du nom du pack
    const expectedSlug = currentPack.packs?.name?.toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    
    console.log('🔍 Slug attendu:', expectedSlug);
    console.log('🔍 Selected pack actuel:', userData.selected_pack);
    
    if (userData.selected_pack === expectedSlug) {
      console.log('✅ SUCCÈS: La synchronisation est correcte!');
      console.log('✅ Le pack actif correspond au selected_pack');
    } else {
      console.log('❌ PROBLÈME: Incohérence détectée');
      console.log('❌ Le selected_pack ne correspond pas au pack actif');
      console.log('💡 Le webhook Stripe n\'a peut-être pas mis à jour selected_pack correctement');
    }
    
    console.log('\n5️⃣ Test de l\'affichage dans l\'interface...');
    
    // Test 4: Vérifier que l'interface affiche le bon pack
    const dashboardPackElement = document.querySelector('[data-testid="current-pack-name"]') || 
                                document.querySelector('.pack-name') ||
                                document.querySelector('h3:contains("Pack")');
    
    if (dashboardPackElement) {
      const displayedPackName = dashboardPackElement.textContent;
      console.log('🖥️  Pack affiché dans l\'interface:', displayedPackName);
      
      if (displayedPackName.includes(currentPack.packs?.name)) {
        console.log('✅ L\'interface affiche le bon pack');
      } else {
        console.log('❌ L\'interface n\'affiche pas le bon pack');
        console.log('💡 Essayez de rafraîchir la page ou de vous reconnecter');
      }
    } else {
      console.log('⚠️  Impossible de trouver l\'élément d\'affichage du pack dans l\'interface');
    }
    
    console.log('\n🎯 === RÉSUMÉ DU TEST ===');
    console.log('Pack en base:', currentPack.packs?.name);
    console.log('Selected pack:', userData.selected_pack);
    console.log('Slug attendu:', expectedSlug);
    console.log('Synchronisation:', userData.selected_pack === expectedSlug ? '✅ OK' : '❌ KO');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  }
}

// Instructions d'utilisation
console.log('📋 INSTRUCTIONS:');
console.log('1. Remplacez USER_ID, supabaseUrl et supabaseKey par vos vraies valeurs');
console.log('2. Exécutez: testPackSyncAfterPayment()');
console.log('3. Vérifiez les résultats dans la console');
console.log('\n💡 Pour exécuter le test, tapez: testPackSyncAfterPayment()');

// Exporter la fonction pour utilisation
window.testPackSyncAfterPayment = testPackSyncAfterPayment;