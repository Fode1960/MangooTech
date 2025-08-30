// Script pour corriger les problèmes d'attribution de packs
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

// Utiliser la clé de service pour les opérations administratives
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixPackAttributionIssues() {
  console.log('🔧 Correction des problèmes d\'attribution de packs\n');

  try {
    // 1. Identifier et supprimer les user_packs avec pack_id invalide
    console.log('1. 🧹 Nettoyage des user_packs invalides...');
    
    // D'abord récupérer tous les user_packs
    const { data: allUserPacks, error: fetchError } = await supabase
      .from('user_packs')
      .select('*');
    
    if (fetchError) {
      console.error('❌ Erreur lors de la récupération des user_packs:', fetchError.message);
      return;
    }
    
    // Filtrer les pack_id invalides côté client
    const invalidUserPacks = allUserPacks.filter(up => 
      !up.pack_id || up.pack_id === '0' || up.pack_id === 0 || up.pack_id.length < 10
    );

    if (invalidUserPacks && invalidUserPacks.length > 0) {
      console.log(`⚠️  ${invalidUserPacks.length} user_packs invalides trouvés`);
      
      // Supprimer chaque user_pack invalide individuellement
      let deletedCount = 0;
      for (const invalidPack of invalidUserPacks) {
        const { error: deleteError } = await supabase
          .from('user_packs')
          .delete()
          .eq('id', invalidPack.id);

        if (deleteError) {
          console.error(`❌ Erreur lors de la suppression de ${invalidPack.id}:`, deleteError.message);
        } else {
          deletedCount++;
        }
      }
      
      console.log(`✅ ${deletedCount} user_packs invalides supprimés`);
    } else {
      console.log('✅ Aucun user_pack invalide trouvé');
    }

    // 2. Vérifier que tous les utilisateurs ont un pack gratuit par défaut
    console.log('\n2. 🎁 Vérification des packs gratuits par défaut...');
    
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*');

    if (usersError) {
      console.error('❌ Erreur lors de la récupération des utilisateurs:', usersError.message);
      return;
    }

    const { data: packs, error: packsError } = await supabase
      .from('packs')
      .select('*');

    if (packsError) {
      console.error('❌ Erreur lors de la récupération des packs:', packsError.message);
      return;
    }

    // Trouver le pack gratuit
    const freePack = packs.find(pack => pack.price === 0 || pack.name.toLowerCase().includes('découverte'));
    if (!freePack) {
      console.error('❌ Pack gratuit non trouvé');
      return;
    }

    console.log(`📦 Pack gratuit identifié: ${freePack.name} (${freePack.id})`);

    // Vérifier chaque utilisateur
    let usersFixed = 0;
    for (const user of users) {
      const { data: userPacks, error: userPacksError } = await supabase
        .from('user_packs')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (userPacksError) {
        console.error(`❌ Erreur pour l'utilisateur ${user.email}:`, userPacksError.message);
        continue;
      }

      if (!userPacks || userPacks.length === 0) {
        // Créer un user_pack gratuit pour cet utilisateur
        console.log(`🔧 Création d'un pack gratuit pour ${user.email}`);
        
        const { error: insertError } = await supabase
          .from('user_packs')
          .insert({
            user_id: user.id,
            pack_id: freePack.id,
            status: 'active',
            started_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (insertError) {
          console.error(`❌ Erreur lors de la création du pack pour ${user.email}:`, insertError.message);
        } else {
          usersFixed++;
          
          // Mettre à jour selected_pack si nécessaire
          if (user.selected_pack !== 'free') {
            const { error: updateError } = await supabase
              .from('users')
              .update({ selected_pack: 'free' })
              .eq('id', user.id);

            if (updateError) {
              console.error(`❌ Erreur lors de la mise à jour de selected_pack pour ${user.email}:`, updateError.message);
            }
          }
        }
      }
    }

    if (usersFixed > 0) {
      console.log(`✅ ${usersFixed} utilisateurs corrigés`);
    } else {
      console.log('✅ Tous les utilisateurs ont déjà des packs actifs');
    }

    // 3. Créer des user_services pour les utilisateurs avec des packs actifs
    console.log('\n3. 🛠️  Création des user_services...');
    
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select('*');

    if (servicesError) {
      console.error('❌ Erreur lors de la récupération des services:', servicesError.message);
      return;
    }

    const { data: packServices, error: packServicesError } = await supabase
      .from('pack_services')
      .select('*');

    if (packServicesError) {
      console.error('❌ Erreur lors de la récupération des pack_services:', packServicesError.message);
      return;
    }

    const { data: activeUserPacks, error: activeUserPacksError } = await supabase
      .from('user_packs')
      .select('*')
      .eq('status', 'active');

    if (activeUserPacksError) {
      console.error('❌ Erreur lors de la récupération des user_packs actifs:', activeUserPacksError.message);
      return;
    }

    let servicesCreated = 0;
    for (const userPack of activeUserPacks) {
      // Trouver les services inclus dans ce pack
      const includedServices = packServices
        .filter(ps => ps.pack_id === userPack.pack_id && ps.is_included)
        .map(ps => ps.service_id);

      for (const serviceId of includedServices) {
        // Vérifier si l'user_service existe déjà
        const { data: existingUserService, error: checkError } = await supabase
          .from('user_services')
          .select('id')
          .eq('user_id', userPack.user_id)
          .eq('service_id', serviceId)
          .single();

        if (checkError && checkError.code !== 'PGRST116') {
          console.error(`❌ Erreur lors de la vérification de l'user_service:`, checkError.message);
          continue;
        }

        if (!existingUserService) {
          // Créer l'user_service
          const { error: createError } = await supabase
            .from('user_services')
            .insert({
              user_id: userPack.user_id,
              service_id: serviceId,
              pack_id: userPack.pack_id,
              status: 'active',
              visits_count: 0,
              sales_count: 0,
              revenue_amount: 0,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });

          if (createError) {
            console.error(`❌ Erreur lors de la création de l'user_service:`, createError.message);
          } else {
            servicesCreated++;
          }
        }
      }
    }

    console.log(`✅ ${servicesCreated} user_services créés`);

    // 4. Rapport final
    console.log('\n4. 📊 Rapport final...');
    
    const { data: finalUsers } = await supabase.from('users').select('id');
    const { data: finalUserPacks } = await supabase.from('user_packs').select('id').eq('status', 'active');
    const { data: finalUserServices } = await supabase.from('user_services').select('id').eq('status', 'active');
    
    console.log(`   - Utilisateurs: ${finalUsers?.length || 0}`);
    console.log(`   - User_packs actifs: ${finalUserPacks?.length || 0}`);
    console.log(`   - User_services actifs: ${finalUserServices?.length || 0}`);
    console.log(`   - Packs disponibles: ${packs.length}`);
    console.log(`   - Services disponibles: ${services.length}`);

    console.log('\n🎉 Correction des problèmes terminée!');

  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Exécuter la correction
if (process.argv[1] && process.argv[1].endsWith('fix-pack-attribution-issues.js')) {
  fixPackAttributionIssues();
}

export { fixPackAttributionIssues };