// Script pour tester la récupération du pack utilisateur depuis la base de données
// À exécuter dans Node.js ou dans la console du navigateur

import { supabase } from './src/lib/supabase.js';

// Fonction pour tester la récupération du pack utilisateur
async function testUserPackRetrieval() {
  console.log('🔍 === TEST RÉCUPÉRATION PACK UTILISATEUR ===\n');
  
  try {
    // 1. Vérifier la connexion Supabase
    console.log('📡 Test de connexion Supabase...');
    const { data: testConnection, error: connectionError } = await supabase
      .from('packs')
      .select('count')
      .limit(1);
    
    if (connectionError) {
      console.error('❌ Erreur de connexion Supabase:', connectionError);
      return;
    }
    
    console.log('✅ Connexion Supabase OK');
    
    // 2. Lister tous les utilisateurs avec des packs
    console.log('\n👥 Récupération des utilisateurs avec packs...');
    const { data: allUserPacks, error: allPacksError } = await supabase
      .from('user_packs')
      .select(`
        user_id,
        status,
        created_at,
        next_billing_date,
        packs(
          id,
          name,
          price,
          currency
        )
      `)
      .order('created_at', { ascending: false });
    
    if (allPacksError) {
      console.error('❌ Erreur lors de la récupération des packs:', allPacksError);
      return;
    }
    
    console.log(`📊 Nombre total de packs utilisateur: ${allUserPacks?.length || 0}`);
    
    if (allUserPacks && allUserPacks.length > 0) {
      console.log('\n📋 Liste des packs utilisateur:');
      allUserPacks.forEach((userPack, index) => {
        console.log(`${index + 1}. User: ${userPack.user_id.substring(0, 8)}...`);
        console.log(`   Pack: ${userPack.packs?.name || 'N/A'}`);
        console.log(`   Prix: ${userPack.packs?.price || 'N/A'} ${userPack.packs?.currency || ''}`);
        console.log(`   Status: ${userPack.status}`);
        console.log(`   Créé: ${userPack.created_at}`);
        console.log(`   Prochaine facturation: ${userPack.next_billing_date || 'N/A'}`);
        console.log('---');
      });
    }
    
    // 3. Vérifier les packs actifs uniquement
    console.log('\n🟢 Récupération des packs ACTIFS uniquement...');
    const { data: activePacks, error: activePacksError } = await supabase
      .from('user_packs')
      .select(`
        user_id,
        status,
        created_at,
        next_billing_date,
        packs(
          id,
          name,
          price,
          currency
        )
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false });
    
    if (activePacksError) {
      console.error('❌ Erreur lors de la récupération des packs actifs:', activePacksError);
      return;
    }
    
    console.log(`📊 Nombre de packs ACTIFS: ${activePacks?.length || 0}`);
    
    if (activePacks && activePacks.length > 0) {
      console.log('\n📋 Liste des packs ACTIFS:');
      activePacks.forEach((userPack, index) => {
        console.log(`${index + 1}. User: ${userPack.user_id.substring(0, 8)}...`);
        console.log(`   Pack: ${userPack.packs?.name || 'N/A'}`);
        console.log(`   Prix: ${userPack.packs?.price || 'N/A'} ${userPack.packs?.currency || ''}`);
        console.log(`   Status: ${userPack.status}`);
        console.log(`   Créé: ${userPack.created_at}`);
        console.log(`   Prochaine facturation: ${userPack.next_billing_date || 'N/A'}`);
        console.log('---');
      });
    } else {
      console.log('⚠️ Aucun pack actif trouvé dans la base de données');
      console.log('💡 Cela pourrait expliquer pourquoi l\'utilisateur ne voit pas son pack');
    }
    
    // 4. Vérifier tous les statuts possibles
    console.log('\n📈 Analyse des statuts de packs...');
    const { data: statusAnalysis, error: statusError } = await supabase
      .from('user_packs')
      .select('status')
      .order('status');
    
    if (statusError) {
      console.error('❌ Erreur lors de l\'analyse des statuts:', statusError);
    } else {
      const statusCounts = {};
      statusAnalysis?.forEach(pack => {
        statusCounts[pack.status] = (statusCounts[pack.status] || 0) + 1;
      });
      
      console.log('📊 Répartition des statuts:');
      Object.entries(statusCounts).forEach(([status, count]) => {
        console.log(`   ${status}: ${count}`);
      });
    }
    
    // 5. Vérifier la structure de la table user_packs
    console.log('\n🏗️ Vérification de la structure de la table...');
    const { data: samplePack, error: sampleError } = await supabase
      .from('user_packs')
      .select('*')
      .limit(1)
      .single();
    
    if (sampleError && sampleError.code !== 'PGRST116') {
      console.error('❌ Erreur lors de la récupération d\'un échantillon:', sampleError);
    } else if (samplePack) {
      console.log('📋 Structure d\'un enregistrement user_pack:');
      console.log(JSON.stringify(samplePack, null, 2));
    } else {
      console.log('⚠️ Aucun enregistrement trouvé dans user_packs');
    }
    
    // 6. Recommandations
    console.log('\n🎯 === RECOMMANDATIONS ===');
    
    if (!activePacks || activePacks.length === 0) {
      console.log('❌ PROBLÈME IDENTIFIÉ: Aucun pack actif dans la base de données');
      console.log('\n🔧 Solutions possibles:');
      console.log('1. Vérifier si l\'achat du pack a été correctement enregistré');
      console.log('2. Vérifier le statut des packs (peut-être "pending" au lieu d\'"active")');
      console.log('3. Vérifier si l\'utilisateur a bien un user_id valide');
      console.log('4. Vérifier les webhooks de paiement (Stripe, PayPal, etc.)');
    } else {
      console.log('✅ Des packs actifs existent dans la base de données');
      console.log('\n🔧 Le problème pourrait être:');
      console.log('1. L\'utilisateur connecté n\'a pas de pack actif');
      console.log('2. Problème de récupération côté frontend');
      console.log('3. Problème de cache ou de synchronisation');
    }
    
    console.log('\n✅ Test terminé');
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Fonction pour tester avec un user_id spécifique
async function testSpecificUser(userId) {
  console.log(`\n🔍 === TEST POUR UTILISATEUR SPÉCIFIQUE: ${userId} ===\n`);
  
  try {
    // Test de la fonction getUserPack exacte
    const { data, error } = await supabase
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
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        console.log('❌ Aucun pack actif trouvé pour cet utilisateur');
        
        // Vérifier s'il y a des packs avec d'autres statuts
        const { data: otherPacks, error: otherError } = await supabase
          .from('user_packs')
          .select('*, packs(name, price)')
          .eq('user_id', userId);
        
        if (otherError) {
          console.error('❌ Erreur lors de la vérification des autres packs:', otherError);
        } else if (otherPacks && otherPacks.length > 0) {
          console.log('⚠️ Packs trouvés avec d\'autres statuts:');
          otherPacks.forEach(pack => {
            console.log(`   - ${pack.packs?.name}: ${pack.status}`);
          });
        } else {
          console.log('❌ Aucun pack trouvé pour cet utilisateur (tous statuts confondus)');
        }
      } else {
        console.error('❌ Erreur lors de la récupération:', error);
      }
    } else {
      console.log('✅ Pack actif trouvé:');
      console.log(JSON.stringify(data, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test spécifique:', error);
  }
}

// Export des fonctions pour utilisation
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testUserPackRetrieval, testSpecificUser };
}

// Auto-exécution si lancé directement
if (typeof window !== 'undefined') {
  console.log('🚀 Script de test chargé!');
  console.log('💡 Tapez "testUserPackRetrieval()" pour tester la récupération générale');
  console.log('💡 Tapez "testSpecificUser(\'USER_ID\')" pour tester un utilisateur spécifique');
  
  // Rendre les fonctions disponibles globalement
  window.testUserPackRetrieval = testUserPackRetrieval;
  window.testSpecificUser = testSpecificUser;
} else {
  // Exécution automatique en Node.js
  testUserPackRetrieval();
}