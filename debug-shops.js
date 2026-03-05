/**
 * Script de débogage pour analyser les boutiques dans la base de données
 * et identifier la source de "Boutique Test"
 */

import { supabase } from './src/lib/supabase.js';

async function debugShops() {
  console.log('🔍 Analyse complète des boutiques dans la base de données...\n');

  try {
    // 1. Récupérer toutes les boutiques
    const { data: allShops, error: shopsError } = await supabase
      .from('shops')
      .select('*')
      .order('created_at', { ascending: true });

    if (shopsError) {
      console.error('❌ Erreur lors de la récupération des boutiques:', shopsError);
      return;
    }

    console.log(`📊 Nombre total de boutiques: ${allShops?.length || 0}\n`);

    // 2. Analyser chaque boutique
    allShops?.forEach((shop, index) => {
      console.log(`🏪 Boutique #${index + 1}:`);
      console.log(`   ID: ${shop.id}`);
      console.log(`   Nom: ${shop.name}`);
      console.log(`   Slug: ${shop.slug}`);
      console.log(`   user_id: ${shop.user_id}`);
      console.log(`   Status: ${shop.status}`);
      console.log(`   Créée le: ${shop.created_at}`);
      console.log(`   Commission: ${shop.commission_rate}%`);
      
      // Vérifier si c'est une boutique problématique
      if (shop.name === 'Boutique Test') {
        console.log(`   ⚠️  BOUTIQUE TEST TROUVÉE!`);
      }
      if (shop.name === 'Fodé Boutique') {
        console.log(`   ⚠️  FODÉ BOUTIQUE TROUVÉE!`);
      }
      if (!shop.user_id) {
        console.log(`   ⚠️  PAS DE USER_ID - Boutique orpheline!`);
      }
      console.log('');
    });

    // 3. Rechercher spécifiquement "Boutique Test"
    const boutiqueTest = allShops?.find(shop => shop.name === 'Boutique Test');
    if (boutiqueTest) {
      console.log("🔍 BOUTIQUE TEST DÉTAILS:");
      console.log('   ID:', boutiqueTest.id);
      console.log('   user_id:', boutiqueTest.user_id);
      console.log('   status:', boutiqueTest.status);
      console.log('   slug:', boutiqueTest.slug);
      console.log('   created_at:', boutiqueTest.created_at);
      console.log('');
    }

    // 4. Vérifier les boutiques sans user_id (boutiques orphelines)
    const orphanedShops = allShops?.filter(shop => !shop.user_id);
    if (orphanedShops?.length > 0) {
      console.log(`⚠️  BOUTIQUES ORPHELINES (sans user_id): ${orphanedShops.length}`);
      orphanedShops.forEach(shop => {
        console.log(`   - ${shop.name} (ID: ${shop.id})`);
      });
      console.log('');
    }

    // 5. Récupérer tous les utilisateurs pour vérifier la correspondance
    const { data: allUsers, error: usersError } = await supabase
      .from('users')
      .select('id, email');

    if (!usersError && allUsers) {
      console.log(`👥 Nombre total d'utilisateurs: ${allUsers.length}\n`);
      
      // Vérifier les user_ids qui n'existent pas
      const shopUserIds = [...new Set(allShops?.map(shop => shop.user_id).filter(Boolean))];
      const existingUserIds = allUsers.map(user => user.id);
      const missingUserIds = shopUserIds.filter(id => !existingUserIds.includes(id));
      
      if (missingUserIds.length > 0) {
        console.log(`⚠️  USER_IDS MANQUANTS: ${missingUserIds.length}`);
        missingUserIds.forEach(userId => {
          const shops = allShops?.filter(shop => shop.user_id === userId);
          console.log(`   - ${userId}: ${shops?.map(s => s.name).join(', ')}`);
        });
        console.log('');
      }
    }

    // 6. Rechercher les doublons de noms
    const nameCounts = {};
    allShops?.forEach(shop => {
      nameCounts[shop.name] = (nameCounts[shop.name] || 0) + 1;
    });
    
    const duplicates = Object.entries(nameCounts).filter(([name, count]) => count > 1);
    if (duplicates.length > 0) {
      console.log('📋 NOMS DE BOUTIQUES EN DOUBLE:');
      duplicates.forEach(([name, count]) => {
        console.log(`   - ${name}: ${count} fois`);
      });
      console.log('');
    }

    console.log('✅ Analyse terminée!');

  } catch (error) {
    console.error('❌ Erreur lors de l\'analyse:', error);
  }
}

// Exécuter le script
debugShops();