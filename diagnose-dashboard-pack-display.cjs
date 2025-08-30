// Script pour diagnostiquer pourquoi le Dashboard affiche toujours "Pack Découverte"

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function diagnoseDashboardPackDisplay(userEmail) {
  try {
    console.log('🔍 DIAGNOSTIC AFFICHAGE PACK DASHBOARD');
    console.log('==================================================');
    console.log(`📧 Email utilisateur: ${userEmail}`);
    console.log('');

    // 1. Récupérer les données utilisateur
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, selected_pack')
      .eq('email', userEmail)
      .single();

    if (userError) {
      console.error('❌ Erreur récupération utilisateur:', userError.message);
      return;
    }

    console.log('👤 DONNÉES UTILISATEUR:');
    console.log(`   ID: ${userData.id}`);
    console.log(`   Email: ${userData.email}`);
    console.log(`   selected_pack: ${userData.selected_pack}`);
    console.log('');

    // 2. Récupérer le pack via getUserPack (comme le fait le Dashboard)
    const { data: userPackData, error: userPackError } = await supabase
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
      .eq('user_id', userData.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    console.log('📦 PACK VIA getUserPack (Dashboard):');
    if (userPackError) {
      if (userPackError.code === 'PGRST116') {
        console.log('   ❌ Aucun pack actif trouvé');
      } else {
        console.log(`   ❌ Erreur: ${userPackError.message}`);
      }
    } else {
      console.log(`   ✅ Pack trouvé: ${userPackData.packs?.name}`);
      console.log(`   ID Pack: ${userPackData.pack_id}`);
      console.log(`   Prix: ${userPackData.packs?.price} ${userPackData.packs?.currency}`);
      console.log(`   Statut: ${userPackData.status}`);
      console.log(`   Créé le: ${userPackData.created_at}`);
    }
    console.log('');

    // 3. Récupérer tous les user_packs de l'utilisateur
    const { data: allUserPacks, error: allPacksError } = await supabase
      .from('user_packs')
      .select(`
        *,
        packs(name, price, currency)
      `)
      .eq('user_id', userData.id)
      .order('created_at', { ascending: false });

    console.log('📋 TOUS LES USER_PACKS:');
    if (allPacksError) {
      console.log(`   ❌ Erreur: ${allPacksError.message}`);
    } else {
      allUserPacks.forEach((pack, index) => {
        console.log(`   ${index + 1}. ${pack.packs?.name}`);
        console.log(`      Statut: ${pack.status}`);
        console.log(`      Créé: ${pack.created_at}`);
        console.log(`      Expire: ${pack.expires_at || 'Jamais'}`);
      });
    }
    console.log('');

    // 4. Vérifier le mapping des packs dans le Dashboard
    const packIdMapping = {
      '0a85e74a-4aec-480a-8af1-7b57391a80d2': 'Pack Découverte',
      '209a0b0e-7888-41a3-9cd1-45907705261a': 'Pack Visibilité', 
      'e444b213-6a11-4793-b30d-e55a8fbf3403': 'Pack Professionnel',
      '9e026c33-1c2a-49aa-8cc2-e2c9d392c303': 'Pack Premium'
    };

    console.log('🗺️ MAPPING PACKS DASHBOARD:');
    if (userPackData && userPackData.pack_id) {
      const mappedName = packIdMapping[userPackData.pack_id];
      console.log(`   Pack ID: ${userPackData.pack_id}`);
      console.log(`   Nom mappé: ${mappedName || 'NON TROUVÉ'}`);
      console.log(`   Nom réel: ${userPackData.packs?.name}`);
      
      if (mappedName !== userPackData.packs?.name) {
        console.log('   ⚠️ INCOHÉRENCE DÉTECTÉE!');
      } else {
        console.log('   ✅ Mapping cohérent');
      }
    }
    console.log('');

    // 5. Vérifier les services utilisateur
    const { data: userServices, error: servicesError } = await supabase
      .from('user_services')
      .select(`
        *,
        services(name, service_type)
      `)
      .eq('user_id', userData.id)
      .eq('status', 'active');

    console.log('🔧 SERVICES UTILISATEUR ACTIFS:');
    if (servicesError) {
      console.log(`   ❌ Erreur: ${servicesError.message}`);
    } else {
      console.log(`   Total: ${userServices.length} services`);
      userServices.forEach((service, index) => {
        console.log(`   ${index + 1}. ${service.services?.name} (${service.services?.service_type})`);
      });
    }
    console.log('');

    // 6. Diagnostic final
    console.log('🎯 DIAGNOSTIC:');
    
    if (!userPackData) {
      console.log('   ❌ PROBLÈME: Aucun pack actif dans user_packs');
      console.log('   💡 SOLUTION: Exécuter fix-selected-pack-sync.js');
    } else if (userPackData.packs?.name === 'Pack Découverte' && userServices.length > 5) {
      console.log('   ❌ PROBLÈME: Pack Découverte mais beaucoup de services');
      console.log('   💡 SOLUTION: Vérifier l\'attribution du bon pack');
    } else if (userData.selected_pack !== userPackData.pack_id) {
      console.log('   ⚠️ ATTENTION: selected_pack non synchronisé');
      console.log(`   selected_pack: ${userData.selected_pack}`);
      console.log(`   pack actuel: ${userPackData.pack_id}`);
    } else {
      console.log('   ✅ Tout semble correct');
    }

    console.log('');
    console.log('🔄 RECOMMANDATIONS:');
    console.log('   1. Vider le cache du navigateur (Ctrl+Shift+R)');
    console.log('   2. Vérifier la console du navigateur pour les erreurs');
    console.log('   3. Redémarrer le serveur de développement');
    console.log('   4. Vérifier que les données sont bien synchronisées');

  } catch (error) {
    console.error('❌ Erreur lors du diagnostic:', error);
  }
}

// Utilisation
const userEmail = process.argv[2];
if (!userEmail) {
  console.log('Usage: node diagnose-dashboard-pack-display.js <email>');
  console.log('Exemple: node diagnose-dashboard-pack-display.js user@example.com');
  process.exit(1);
}

diagnoseDashboardPackDisplay(userEmail)
  .then(() => {
    console.log('\n✅ Diagnostic terminé.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur:', error);
    process.exit(1);
  });