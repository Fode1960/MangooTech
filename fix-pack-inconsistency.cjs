const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixPackInconsistency(userEmail) {
  try {
    console.log('🔧 Correction de l\'incohérence des packs pour:', userEmail);
    console.log('=' .repeat(60));

    // 1. Récupérer l'utilisateur
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', userEmail)
      .single();

    if (userError || !user) {
      console.error('❌ Utilisateur non trouvé:', userError?.message);
      return;
    }

    console.log('👤 Utilisateur:');
    console.log('  - ID:', user.id);
    console.log('  - Email:', user.email);
    console.log('  - Selected pack actuel:', user.selected_pack);
    console.log('');

    // 2. Récupérer le pack correspondant au selected_pack
    let targetPackId = null;
    let targetPackName = null;

    if (user.selected_pack === 'pack-premium') {
      // Trouver le Pack Premium
      const { data: premiumPack, error: premiumError } = await supabase
        .from('packs')
        .select('*')
        .eq('name', 'Pack Premium')
        .single();

      if (premiumError || !premiumPack) {
        console.error('❌ Pack Premium non trouvé:', premiumError?.message);
        return;
      }

      targetPackId = premiumPack.id;
      targetPackName = premiumPack.name;
    }

    console.log('🎯 Pack cible:');
    console.log('  - Nom:', targetPackName);
    console.log('  - ID:', targetPackId);
    console.log('');

    // 3. Vérifier les packs actuellement actifs
    const { data: activePacks, error: activePacksError } = await supabase
      .from('user_packs')
      .select(`
        *,
        packs:pack_id (
          name,
          price
        )
      `)
      .eq('user_id', user.id)
      .eq('status', 'active');

    console.log('📦 Packs actuellement actifs:');
    if (activePacksError) {
      console.error('❌ Erreur:', activePacksError.message);
    } else if (activePacks && activePacks.length > 0) {
      activePacks.forEach((pack, index) => {
        console.log(`  ${index + 1}. ${pack.packs?.name}`);
        console.log(`     Status: ${pack.status}`);
        console.log(`     ID: ${pack.id}`);
      });
    } else {
      console.log('  Aucun pack actif');
    }
    console.log('');

    // 4. Désactiver tous les packs actuels
    console.log('🔄 Désactivation des packs actuels...');
    const { error: deactivateError } = await supabase
      .from('user_packs')
      .update({ 
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .eq('status', 'active');

    if (deactivateError) {
      console.error('❌ Erreur désactivation:', deactivateError.message);
      return;
    }
    console.log('✅ Packs désactivés avec succès');

    // 5. Vérifier si le pack cible existe déjà
    const { data: existingPack, error: existingError } = await supabase
      .from('user_packs')
      .select('*')
      .eq('user_id', user.id)
      .eq('pack_id', targetPackId)
      .single();

    if (existingError && existingError.code !== 'PGRST116') {
      console.error('❌ Erreur vérification pack existant:', existingError.message);
      return;
    }

    if (existingPack) {
      // Réactiver le pack existant
      console.log('🔄 Réactivation du pack existant...');
      const { error: reactivateError } = await supabase
        .from('user_packs')
        .update({
          status: 'active',
          started_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', existingPack.id);

      if (reactivateError) {
        console.error('❌ Erreur réactivation:', reactivateError.message);
        return;
      }
      console.log('✅ Pack réactivé avec succès');
    } else {
      // Créer un nouveau pack
      console.log('➕ Création d\'un nouveau pack...');
      const { error: createError } = await supabase
        .from('user_packs')
        .insert({
          user_id: user.id,
          pack_id: targetPackId,
          status: 'active',
          started_at: new Date().toISOString()
        });

      if (createError) {
        console.error('❌ Erreur création:', createError.message);
        return;
      }
      console.log('✅ Nouveau pack créé avec succès');
    }

    // 6. Vérification finale
    console.log('');
    console.log('✅ Vérification finale...');
    const { data: finalPacks, error: finalError } = await supabase
      .from('user_packs')
      .select(`
        *,
        packs:pack_id (
          name,
          price
        )
      `)
      .eq('user_id', user.id)
      .eq('status', 'active');

    if (finalError) {
      console.error('❌ Erreur vérification finale:', finalError.message);
    } else {
      console.log('📦 Pack maintenant actif:');
      if (finalPacks && finalPacks.length > 0) {
        finalPacks.forEach(pack => {
          console.log(`  - ${pack.packs?.name} (${pack.packs?.price} XOF)`);
          console.log(`    Status: ${pack.status}`);
        });
      }
    }

    console.log('');
    console.log('🎉 Incohérence corrigée avec succès!');
    console.log('Le selected_pack et le pack actif sont maintenant synchronisés.');
    console.log('');
    console.log('🔧 Prochaines étapes:');
    console.log('1. Tester un paiement avec un pack différent');
    console.log('2. Vérifier que le webhook fonctionne correctement');
    console.log('3. Surveiller les logs Supabase pendant le test');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

// Utilisation
const userEmail = process.argv[2];
if (!userEmail) {
  console.error('Usage: node fix-pack-inconsistency.cjs <email>');
  process.exit(1);
}

fixPackInconsistency(userEmail);