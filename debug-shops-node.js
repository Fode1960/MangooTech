/**
 * Script de débogage pour analyser les boutiques dans la base de données
 * Configuration Node.js sans dépendance au navigateur
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Charger les variables d'environnement
config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debugShops() {
  console.log('🔍 Analyse complète des boutiques dans la base de données...\n');
  console.log('URL:', supabaseUrl);

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

    // 5. Statistiques
    const stats = {
      total: allShops?.length || 0,
      boutiqueTest: allShops?.filter(s => s.name === 'Boutique Test').length || 0,
      fodeBoutique: allShops?.filter(s => s.name === 'Fodé Boutique').length || 0,
      orphaned: allShops?.filter(s => !s.user_id).length || 0,
      approved: allShops?.filter(s => s.status === 'approved').length || 0,
      pending: allShops?.filter(s => s.status === 'pending').length || 0
    };

    console.log('📈 STATISTIQUES:');
    console.log(`   Total: ${stats.total}`);
    console.log(`   Boutique Test: ${stats.boutiqueTest}`);
    console.log(`   Fodé Boutique: ${stats.fodeBoutique}`);
    console.log(`   Orphelines: ${stats.orphaned}`);
    console.log(`   Approuvées: ${stats.approved}`);
    console.log(`   En attente: ${stats.pending}`);

    console.log('\n✅ Analyse terminée!');

  } catch (error) {
    console.error('❌ Erreur lors de l\'analyse:', error);
  }
}

// Exécuter le script
debugShops();