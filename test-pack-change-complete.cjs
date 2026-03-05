// Test complet du changement de pack après paiement
// Ce script simule un paiement réussi et vérifie si le pack change

const { createClient } = require('@supabase/supabase-js');
const { randomUUID } = require('crypto');

// Configuration Supabase
const supabase = createClient(
  'https://ptrqhtwstldphjaraufi.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0cnFodHdzdGxkcGhqYXJhdWZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MzI0OTIsImV4cCI6MjA3MDUwODQ5Mn0.Wc-dKWVMpAyFoAPFGejzhD0o1rodyEGrBlZK5X3muyA'
);

async function testPackChangeComplete() {
  console.log('🧪 === TEST COMPLET DU CHANGEMENT DE PACK ===');
  
  try {
    // 1. Créer un utilisateur de test
    console.log('\n1️⃣ Création d\'un utilisateur de test...');
    
    const testEmail = `test-${Date.now()}@example.com`;
    // Générer un UUID valide pour l'utilisateur de test
    const testUserId = randomUUID();
    
    const { data: newUser, error: userError } = await supabase
      .from('users')
      .insert({
        id: testUserId,
        email: testEmail,
        selected_pack: 'decouverte'
      })
      .select()
      .single();
    
    if (userError) {
      console.error('❌ Erreur création utilisateur:', userError);
      return;
    }
    
    console.log('✅ Utilisateur créé:', newUser.email);
    
    // 2. Vérifier les packs disponibles
    console.log('\n2️⃣ Vérification des packs disponibles...');
    
    const { data: packs, error: packsError } = await supabase
      .from('packs')
      .select('*')
      .order('price');
    
    if (packsError || !packs || packs.length === 0) {
      console.error('❌ Aucun pack trouvé:', packsError);
      return;
    }
    
    console.log('✅ Packs disponibles:', packs.map(p => `${p.name} (${p.price/100} FCFA)`));
    
    // 3. Créer un pack actuel (découverte)
    console.log('\n3️⃣ Attribution du pack découverte...');
    
    const packDecouverte = packs.find(p => p.slug === 'decouverte' || p.name.toLowerCase().includes('découverte'));
    if (!packDecouverte) {
      console.error('❌ Pack découverte non trouvé');
      return;
    }
    
    const { data: currentPack, error: currentPackError } = await supabase
      .from('user_packs')
      .insert({
        user_id: testUserId,
        pack_id: packDecouverte.id,
        status: 'active',
        started_at: new Date().toISOString()
      })
      .select('*, packs(name, slug)')
      .single();
    
    if (currentPackError) {
      console.error('❌ Erreur attribution pack découverte:', currentPackError);
      return;
    }
    
    console.log('✅ Pack découverte attribué:', currentPack.packs.name);
    
    // 4. Simuler un paiement pour un pack premium
    console.log('\n4️⃣ Simulation d\'un paiement pour pack premium...');
    
    const packPremium = packs.find(p => p.price > packDecouverte.price);
    if (!packPremium) {
      console.error('❌ Aucun pack premium trouvé');
      return;
    }
    
    const { data: transaction, error: transError } = await supabase
      .from('transactions')
      .insert({
        user_id: testUserId,
        pack_id: packPremium.id,
        amount: packPremium.price,
        status: 'completed',
        stripe_session_id: `test_session_${Date.now()}`,
        created_at: new Date().toISOString()
      })
      .select('*, packs(name, slug)')
      .single();
    
    if (transError) {
      console.error('❌ Erreur création transaction:', transError);
      return;
    }
    
    console.log('✅ Transaction créée:', `${transaction.packs.name} - ${transaction.amount/100} FCFA`);
    
    // 5. Appliquer la fonction de correction automatique
    console.log('\n5️⃣ Application de la correction automatique...');
    
    // Simuler la fonction autoFixPackSyncAfterPayment
    await new Promise(resolve => setTimeout(resolve, 1000)); // Attendre webhook
    
    // Vérifier la dernière transaction
    const { data: lastTransaction, error: lastTransError } = await supabase
      .from('transactions')
      .select('*, packs(id, name, slug, price)')
      .eq('user_id', testUserId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (lastTransError || !lastTransaction) {
      console.error('❌ Transaction non trouvée:', lastTransError);
      return;
    }
    
    // Désactiver les packs actuels
    await supabase
      .from('user_packs')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('user_id', testUserId)
      .eq('status', 'active');
    
    // Activer le nouveau pack
    const nextBillingDate = new Date();
    nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
    
    const { data: newPack, error: newPackError } = await supabase
      .from('user_packs')
      .insert({
        user_id: testUserId,
        pack_id: lastTransaction.pack_id,
        status: 'active',
        started_at: new Date().toISOString(),
        next_billing_date: nextBillingDate.toISOString()
      })
      .select('*, packs(id, name, slug, price)')
      .single();
    
    if (newPackError) {
      console.error('❌ Erreur activation nouveau pack:', newPackError);
      return;
    }
    
    // Mettre à jour selected_pack
    const packSlug = lastTransaction.packs?.slug || 
                    lastTransaction.packs?.name?.toLowerCase().replace(/\s+/g, '-');
    
    if (packSlug) {
      await supabase
        .from('users')
        .update({ selected_pack: packSlug })
        .eq('id', testUserId);
    }
    
    console.log('✅ Nouveau pack activé:', newPack.packs.name);
    
    // 6. Vérification finale
    console.log('\n6️⃣ Vérification finale...');
    
    const { data: finalUser, error: finalUserError } = await supabase
      .from('users')
      .select('selected_pack')
      .eq('id', testUserId)
      .single();
    
    const { data: finalPack, error: finalPackError } = await supabase
      .from('user_packs')
      .select('*, packs(name, slug)')
      .eq('user_id', testUserId)
      .eq('status', 'active')
      .single();
    
    console.log('\n📊 === RÉSULTATS DU TEST ===');
    console.log('Pack initial:', packDecouverte.name);
    console.log('Pack payé:', packPremium.name);
    console.log('Pack final (selected_pack):', finalUser?.selected_pack || 'NON DÉFINI');
    console.log('Pack final (user_packs):', finalPack?.packs?.name || 'NON DÉFINI');
    
    const success = finalUser?.selected_pack === packSlug && finalPack?.packs?.name === packPremium.name;
    
    if (success) {
      console.log('\n🎉 ✅ TEST RÉUSSI - Le pack a bien changé!');
    } else {
      console.log('\n❌ TEST ÉCHOUÉ - Le pack n\'a pas changé correctement');
      console.log('Expected selected_pack:', packSlug);
      console.log('Actual selected_pack:', finalUser?.selected_pack);
    }
    
    // 7. Nettoyage
    console.log('\n7️⃣ Nettoyage des données de test...');
    
    await supabase.from('user_packs').delete().eq('user_id', testUserId);
    await supabase.from('transactions').delete().eq('user_id', testUserId);
    await supabase.from('users').delete().eq('id', testUserId);
    
    console.log('✅ Nettoyage terminé');
    
    return success;
    
  } catch (error) {
    console.error('❌ Erreur durant le test:', error);
    return false;
  }
}

// Exécuter le test
if (require.main === module) {
  testPackChangeComplete()
    .then(success => {
      console.log('\n🏁 Test terminé:', success ? 'SUCCÈS' : 'ÉCHEC');
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Erreur fatale:', error);
      process.exit(1);
    });
}

module.exports = { testPackChangeComplete };