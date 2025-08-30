// Script pour corriger l'attribution incorrecte des packs utilisateur (v2)

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Mapping des services par pack
const packServiceMapping = {
  'Pack Découverte': ['Espace personnel', 'Fiche visible', 'Mangoo Connect+', 'Mini-site', 'Mini-boutique'],
  'Pack Visibilité': ['Référencement Mangoo Market', 'Showroom360 simplifié'],
  'Pack Professionnel': ['Mangoo Express', 'Référencement pro'],
  'Pack Premium': ['CRM/ERP simplifié', 'Showroom360 complet', 'Support personnalisé']
};

// IDs des packs
const packIds = {
  'Pack Découverte': '0a85e74a-4aec-480a-8af1-7b57391a80d2',
  'Pack Visibilité': '209a0b0e-7888-41a3-9cd1-45907705261a',
  'Pack Professionnel': 'e444b213-6a11-4793-b30d-e55a8fbf3403',
  'Pack Premium': '9e026c33-1c2a-49aa-8cc2-e2c9d392c303'
};

function determineCorrectPack(userServices) {
  const serviceNames = userServices.map(s => s.services?.name).filter(Boolean);
  
  // Vérifier si l'utilisateur a des services Premium
  const premiumServices = packServiceMapping['Pack Premium'];
  if (premiumServices.some(service => serviceNames.includes(service))) {
    return 'Pack Premium';
  }
  
  // Vérifier si l'utilisateur a des services Professionnel
  const professionalServices = packServiceMapping['Pack Professionnel'];
  if (professionalServices.some(service => serviceNames.includes(service))) {
    return 'Pack Professionnel';
  }
  
  // Vérifier si l'utilisateur a des services Visibilité
  const visibilityServices = packServiceMapping['Pack Visibilité'];
  if (visibilityServices.some(service => serviceNames.includes(service))) {
    return 'Pack Visibilité';
  }
  
  // Par défaut, Pack Découverte
  return 'Pack Découverte';
}

async function fixUserPackAttribution(userEmail) {
  try {
    console.log('🔧 CORRECTION ATTRIBUTION PACK UTILISATEUR (V2)');
    console.log('==================================================');
    console.log(`📧 Email utilisateur: ${userEmail}`);
    console.log('');

    // 1. Récupérer l'utilisateur
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, selected_pack')
      .eq('email', userEmail)
      .single();

    if (userError) {
      console.error('❌ Erreur récupération utilisateur:', userError.message);
      return;
    }

    console.log(`👤 Utilisateur trouvé: ${userData.email} (${userData.id})`);
    console.log('');

    // 2. Récupérer les services actifs de l'utilisateur
    const { data: userServices, error: servicesError } = await supabase
      .from('user_services')
      .select(`
        *,
        services(name, service_type)
      `)
      .eq('user_id', userData.id)
      .eq('status', 'active');

    if (servicesError) {
      console.error('❌ Erreur récupération services:', servicesError.message);
      return;
    }

    console.log(`🔧 Services actifs: ${userServices.length}`);
    userServices.forEach((service, index) => {
      console.log(`   ${index + 1}. ${service.services?.name}`);
    });
    console.log('');

    // 3. Déterminer le pack correct
    const correctPack = determineCorrectPack(userServices);
    const correctPackId = packIds[correctPack];
    
    console.log(`🎯 Pack correct déterminé: ${correctPack}`);
    console.log(`🆔 ID du pack correct: ${correctPackId}`);
    console.log('');

    // 4. Récupérer tous les user_packs de l'utilisateur
    const { data: allUserPacks, error: allPacksError } = await supabase
      .from('user_packs')
      .select(`
        *,
        packs(name)
      `)
      .eq('user_id', userData.id)
      .order('created_at', { ascending: false });

    if (allPacksError) {
      console.error('❌ Erreur récupération packs:', allPacksError.message);
      return;
    }

    console.log('📋 Packs existants:');
    allUserPacks.forEach((pack, index) => {
      console.log(`   ${index + 1}. ${pack.packs?.name} - ${pack.status}`);
    });
    console.log('');

    // 5. Trouver le pack correct existant
    const existingCorrectPack = allUserPacks.find(pack => pack.pack_id === correctPackId);
    const currentActivePack = allUserPacks.find(pack => pack.status === 'active');

    if (existingCorrectPack && existingCorrectPack.status === 'active') {
      console.log('✅ Le pack correct est déjà actif, aucune action nécessaire.');
      return;
    }

    // 6. Désactiver tous les packs actifs
    console.log('🚫 Désactivation de tous les packs actifs...');
    const { error: deactivateError } = await supabase
      .from('user_packs')
      .update({ 
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userData.id)
      .eq('status', 'active');

    if (deactivateError) {
      console.error('❌ Erreur désactivation packs:', deactivateError.message);
      return;
    }
    console.log('✅ Packs actifs désactivés');

    // 7. Activer le pack correct
    if (existingCorrectPack) {
      console.log(`🔄 Réactivation du pack existant: ${correctPack}...`);
      const { error: reactivateError } = await supabase
        .from('user_packs')
        .update({ 
          status: 'active',
          started_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', existingCorrectPack.id);

      if (reactivateError) {
        console.error('❌ Erreur réactivation pack:', reactivateError.message);
        return;
      }
      console.log('✅ Pack réactivé');
    } else {
      console.log(`📦 Création du nouveau pack: ${correctPack}...`);
      const { error: createError } = await supabase
        .from('user_packs')
        .insert({
          user_id: userData.id,
          pack_id: correctPackId,
          status: 'active',
          started_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (createError) {
        console.error('❌ Erreur création nouveau pack:', createError.message);
        return;
      }
      console.log('✅ Nouveau pack créé');
    }

    // 8. Mettre à jour selected_pack dans users
    console.log('🔄 Mise à jour selected_pack...');
    const { error: updateUserError } = await supabase
      .from('users')
      .update({ 
        selected_pack: correctPackId,
        updated_at: new Date().toISOString()
      })
      .eq('id', userData.id);

    if (updateUserError) {
      console.error('❌ Erreur mise à jour selected_pack:', updateUserError.message);
      return;
    }
    console.log('✅ selected_pack mis à jour');

    console.log('');
    console.log('🎉 CORRECTION TERMINÉE AVEC SUCCÈS!');
    console.log(`✅ ${userData.email} a maintenant le ${correctPack}`);
    console.log('');
    console.log('🔄 PROCHAINES ÉTAPES:');
    console.log('   1. Vider le cache du navigateur (Ctrl+Shift+R)');
    console.log('   2. Redémarrer le serveur de développement');
    console.log('   3. Vérifier l\'affichage dans le Dashboard');

  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error);
  }
}

// Utilisation
const userEmail = process.argv[2];
if (!userEmail) {
  console.log('Usage: node fix-user-pack-attribution-v2.cjs <email>');
  console.log('Exemple: node fix-user-pack-attribution-v2.cjs user@example.com');
  process.exit(1);
}

fixUserPackAttribution(userEmail)
  .then(() => {
    console.log('\n✅ Script terminé.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur:', error);
    process.exit(1);
  });