const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixSelectedPackFormat(userEmail) {
  try {
    console.log('🔧 Correction du format selected_pack pour:', userEmail);
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

    console.log('👤 Utilisateur trouvé:');
    console.log('  - ID:', user.id);
    console.log('  - Email:', user.email);
    console.log('  - Selected pack actuel:', user.selected_pack);
    console.log('');

    // 2. Vérifier si selected_pack est un UUID
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user.selected_pack);
    
    if (isUUID) {
      console.log('🔍 Selected_pack est un UUID, conversion en slug nécessaire...');
      
      // Récupérer le nom du pack correspondant à l'UUID
      const { data: pack, error: packError } = await supabase
        .from('packs')
        .select('name')
        .eq('id', user.selected_pack)
        .single();

      if (packError || !pack) {
        console.error('❌ Pack non trouvé pour UUID:', user.selected_pack);
        return;
      }

      // Convertir le nom en slug
      const packSlug = pack.name.toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/é/g, 'e')
        .replace(/è/g, 'e')
        .replace(/à/g, 'a');

      console.log('📦 Pack trouvé:', pack.name);
      console.log('🔄 Slug généré:', packSlug);

      // Mettre à jour le selected_pack
      const { error: updateError } = await supabase
        .from('users')
        .update({ selected_pack: packSlug })
        .eq('id', user.id);

      if (updateError) {
        console.error('❌ Erreur mise à jour:', updateError.message);
      } else {
        console.log('✅ Selected_pack mis à jour avec succès!');
        console.log('  Ancien:', user.selected_pack);
        console.log('  Nouveau:', packSlug);
      }
    } else {
      console.log('✅ Selected_pack est déjà au bon format (slug):', user.selected_pack);
    }

    // 3. Vérifier le pack actif dans user_packs
    const { data: activePack, error: activePackError } = await supabase
      .from('user_packs')
      .select(`
        *,
        packs:pack_id (
          id,
          name,
          price
        )
      `)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (activePackError) {
      console.log('⚠️ Aucun pack actif trouvé ou erreur:', activePackError.message);
    } else if (activePack) {
      console.log('');
      console.log('📦 Pack actif dans user_packs:');
      console.log('  - Nom:', activePack.packs?.name);
      console.log('  - Prix:', activePack.packs?.price);
      console.log('  - Status:', activePack.status);
      console.log('  - Stripe Session ID:', activePack.stripe_session_id || 'N/A');
    }

    console.log('');
    console.log('🎯 Prochaines étapes pour tester le paiement:');
    console.log('1. Effectuer un paiement test avec un pack différent');
    console.log('2. Vérifier les logs Supabase en temps réel');
    console.log('3. Vérifier que le webhook reçoit les bonnes métadonnées');
    console.log('4. Vérifier que selected_pack est mis à jour automatiquement');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

// Utilisation
const userEmail = process.argv[2];
if (!userEmail) {
  console.error('Usage: node fix-selected-pack-format.cjs <email>');
  process.exit(1);
}

fixSelectedPackFormat(userEmail);