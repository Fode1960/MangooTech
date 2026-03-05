/**
 * Script de test pour la correction automatique de synchronisation des packs
 * Simule un paiement réussi et teste la fonction d'auto-fix
 */

const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';
const supabase = createClient(supabaseUrl, supabaseKey);

// Fonction de test de l'auto-fix (copie de celle du Dashboard)
async function testAutoFixPackSyncAfterPayment(userId) {
  console.log('🧪 Test Auto-fix synchronisation pack après paiement...');
  console.log('👤 User ID:', userId);
  
  try {
    // Attendre que le webhook Stripe se termine
    console.log('⏳ Simulation attente webhook Stripe (2s)...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Vérifier la dernière transaction
    console.log('🔍 Recherche de la dernière transaction...');
    const { data: lastTransaction, error: transError } = await supabase
      .from('transactions')
      .select(`
        *,
        packs(id, name, slug, price)
      `)
      .eq('user_id', userId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (transError) {
      console.log('❌ Erreur transaction:', transError.message);
      return { success: false, error: transError.message };
    }
    
    if (!lastTransaction) {
      console.log('ℹ️ Aucune transaction récente, pas de correction nécessaire');
      return { success: true, message: 'Aucune transaction récente' };
    }
    
    console.log('💳 Dernière transaction trouvée:');
    console.log('  - ID:', lastTransaction.id);
    console.log('  - Pack ID:', lastTransaction.pack_id);
    console.log('  - Pack:', lastTransaction.packs?.name);
    console.log('  - Montant:', lastTransaction.amount);
    console.log('  - Date:', lastTransaction.created_at);
    
    // Vérifier le pack actuel
    console.log('🔍 Vérification du pack actuel...');
    const { data: currentPack, error: packError } = await supabase
      .from('user_packs')
      .select('*, packs(id, name, slug)')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (packError) {
      console.log('⚠️ Erreur pack actuel (normal si aucun pack):', packError.message);
    }
    
    if (currentPack) {
      console.log('📦 Pack actuel trouvé:');
      console.log('  - ID:', currentPack.id);
      console.log('  - Pack ID:', currentPack.pack_id);
      console.log('  - Pack:', currentPack.packs?.name);
      console.log('  - Status:', currentPack.status);
    } else {
      console.log('📦 Aucun pack actuel trouvé');
    }
    
    // Déterminer si correction nécessaire
    const needsCorrection = packError || !currentPack || currentPack.pack_id !== lastTransaction.pack_id;
    
    console.log('🔧 Correction nécessaire:', needsCorrection);
    
    if (!needsCorrection) {
      console.log('✅ Synchronisation correcte, aucune action nécessaire');
      return { success: true, message: 'Synchronisation déjà correcte' };
    }
    
    console.log('🔧 Lancement de la correction...');
    
    // Désactiver les packs actuels
    console.log('🔄 Désactivation des packs actuels...');
    const { error: deactivateError } = await supabase
      .from('user_packs')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('status', 'active');
    
    if (deactivateError) {
      console.log('❌ Erreur désactivation:', deactivateError.message);
    } else {
      console.log('✅ Packs actuels désactivés');
    }
    
    // Activer le pack correspondant à la transaction
    console.log('🔄 Activation du nouveau pack...');
    const nextBillingDate = new Date();
    nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
    
    const { data: newPack, error: insertError } = await supabase
      .from('user_packs')
      .insert({
        user_id: userId,
        pack_id: lastTransaction.pack_id,
        status: 'active',
        started_at: new Date().toISOString(),
        next_billing_date: nextBillingDate.toISOString()
      })
      .select('*, packs(id, name, slug, price)')
      .single();
    
    if (insertError) {
      console.log('❌ Erreur activation nouveau pack:', insertError.message);
      return { success: false, error: insertError.message };
    }
    
    console.log('✅ Nouveau pack activé:');
    console.log('  - ID:', newPack.id);
    console.log('  - Pack:', newPack.packs?.name);
    console.log('  - Prix:', newPack.packs?.price);
    
    // Mettre à jour selected_pack
    console.log('🔄 Mise à jour du selected_pack...');
    const packSlug = lastTransaction.packs?.slug || 
                    lastTransaction.packs?.name?.toLowerCase().replace(/\s+/g, '-');
    
    if (packSlug) {
      const { error: updateUserError } = await supabase
        .from('users')
        .update({ selected_pack: packSlug })
        .eq('id', userId);
      
      if (updateUserError) {
        console.log('⚠️ Erreur mise à jour selected_pack:', updateUserError.message);
      } else {
        console.log('✅ Selected_pack mis à jour:', packSlug);
      }
    }
    
    console.log('🎉 Auto-fix terminé avec succès!');
    return { 
      success: true, 
      packName: newPack.packs?.name,
      packSlug: packSlug,
      message: 'Pack synchronisé avec succès'
    };
    
  } catch (error) {
    console.error('❌ Erreur auto-fix:', error);
    return { success: false, error: error.message };
  }
}

// Fonction de test principal
async function runTest() {
  console.log('🚀 Démarrage du test de correction automatique');
  console.log('=' .repeat(60));
  
  // Remplacez par un vrai user ID de test
  const testUserId = process.argv[2];
  
  if (!testUserId) {
    console.log('❌ Usage: node test-auto-fix-pack-sync.js <user_id>');
    console.log('Exemple: node test-auto-fix-pack-sync.js 123e4567-e89b-12d3-a456-426614174000');
    process.exit(1);
  }
  
  console.log('👤 Test avec User ID:', testUserId);
  console.log('');
  
  // Vérifier que l'utilisateur existe
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, email, selected_pack')
    .eq('id', testUserId)
    .single();
  
  if (userError || !user) {
    console.log('❌ Utilisateur non trouvé:', userError?.message);
    process.exit(1);
  }
  
  console.log('✅ Utilisateur trouvé:');
  console.log('  - Email:', user.email);
  console.log('  - Pack sélectionné:', user.selected_pack);
  console.log('');
  
  // Lancer le test
  const result = await testAutoFixPackSyncAfterPayment(testUserId);
  
  console.log('');
  console.log('=' .repeat(60));
  console.log('📊 RÉSULTAT DU TEST:');
  console.log('Success:', result.success);
  if (result.packName) {console.log('Pack activé:', result.packName);}
  if (result.packSlug) {console.log('Pack slug:', result.packSlug);}
  if (result.message) {console.log('Message:', result.message);}
  if (result.error) {console.log('Erreur:', result.error);}
  
  console.log('');
  console.log(result.success ? '🎉 TEST RÉUSSI!' : '❌ TEST ÉCHOUÉ!');
}

// Lancer le test si exécuté directement
if (require.main === module) {
  runTest().catch(console.error);
}

module.exports = { testAutoFixPackSyncAfterPayment };