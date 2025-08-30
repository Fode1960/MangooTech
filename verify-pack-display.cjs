// Script pour vérifier l'affichage du pack dans l'interface

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyPackDisplay() {
  try {
    console.log('🔍 Vérification de l\'affichage du pack...');
    
    // Vérifier l'utilisateur spécifique
    const userEmail = 'mdansoko@mangoo.tech';
    
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, selected_pack')
      .eq('email', userEmail)
      .single();
    
    if (userError) {
      console.error('❌ Utilisateur non trouvé:', userError);
      return;
    }
    
    console.log(`👤 Utilisateur: ${user.email}`);
    console.log(`📦 Selected Pack: ${user.selected_pack}`);
    
    // Récupérer le pack actif
    const { data: userPack, error: packError } = await supabase
      .from('user_packs')
      .select(`
        *,
        packs(
          id,
          name,
          price,
          currency
        )
      `)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();
    
    if (packError) {
      console.error('❌ Erreur pack actif:', packError);
      return;
    }
    
    console.log('\n📊 Pack actif dans la base de données:');
    console.log(`  - Nom: ${userPack.packs.name}`);
    console.log(`  - Prix: ${userPack.packs.price} ${userPack.packs.currency}`);
    console.log(`  - Status: ${userPack.status}`);
    console.log(`  - Créé: ${userPack.created_at}`);
    console.log(`  - Mis à jour: ${userPack.updated_at}`);
    
    // Simuler ce que l'interface devrait afficher
    console.log('\n🖥️ Ce que l\'interface devrait afficher:');
    if (userPack.packs.price === 0) {
      console.log('  - Pack: Pack Découverte');
      console.log('  - Prix: Gratuit');
    } else {
      console.log(`  - Pack: ${userPack.packs.name}`);
      console.log(`  - Prix: ${userPack.packs.price} FCFA/mois`);
    }
    
    // Vérifier s'il y a d'autres packs actifs (ne devrait pas y en avoir)
    const { data: allActivePacks, error: allPacksError } = await supabase
      .from('user_packs')
      .select(`
        *,
        packs(name, price)
      `)
      .eq('user_id', user.id)
      .eq('status', 'active');
    
    if (allPacksError) {
      console.error('❌ Erreur vérification packs:', allPacksError);
      return;
    }
    
    console.log(`\n🔍 Nombre de packs actifs: ${allActivePacks.length}`);
    if (allActivePacks.length > 1) {
      console.log('⚠️ ATTENTION: Plusieurs packs actifs détectés!');
      allActivePacks.forEach((pack, index) => {
        console.log(`  ${index + 1}. ${pack.packs.name} (${pack.packs.price} FCFA)`);
      });
    } else {
      console.log('✅ Un seul pack actif (correct)');
    }
    
    console.log('\n✅ Vérification terminée');
    console.log('\n💡 Si l\'interface affiche encore "Pack Premium", essayez de:');
    console.log('   1. Rafraîchir la page (F5)');
    console.log('   2. Vider le cache du navigateur');
    console.log('   3. Se déconnecter et se reconnecter');
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

verifyPackDisplay();