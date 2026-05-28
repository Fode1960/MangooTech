#!/usr/bin/env node

/**
 * Script de nettoyage des boutiques orphelines dans Supabase
 * Ce script supprime les boutiques qui n'ont pas de user_id (NULL)
 * et les produits associés pour résoudre le problème de partage des données
 */

const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Erreur: VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY doivent être définis');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function cleanOrphanShops() {
  try {
    console.log('🔍 Recherche des boutiques orphelines (sans user_id)...');
    
    // 1. Trouver toutes les boutiques sans user_id
    const { data: orphanShops, error: findError } = await supabase
      .from('shops')
      .select('id, name, user_id, created_at')
      .is('user_id', null);
    
    if (findError) {
      throw new Error(`Erreur lors de la recherche: ${findError.message}`);
    }
    
    console.log(`📊 ${orphanShops.length} boutiques orphelines trouvées:`);
    orphanShops.forEach(shop => {
      console.log(`   - ${shop.name} (ID: ${shop.id}, créée le: ${shop.created_at})`);
    });
    
    if (orphanShops.length === 0) {
      console.log('✅ Aucune boutique orpheline trouvée');
      return;
    }
    
    // 2. Compter les produits associés
    const orphanShopIds = orphanShops.map(shop => shop.id);
    const { count: productCount, error: countError } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .in('shop_id', orphanShopIds);
    
    if (countError) {
      console.warn('⚠️  Impossible de compter les produits:', countError.message);
    } else {
      console.log(`🛍️  ${productCount} produits associés aux boutiques orphelines`);
    }
    
    // 3. Demander confirmation
    console.log('\n⚠️  ATTENTION: Cette action est irréversible !');
    console.log('Les boutiques et produits seront définitivement supprimés.');
    
    // Pour automatiser sans confirmation, décommentez la ligne suivante:
    // const confirmDelete = true;
    const confirmDelete = false; // Passer à true pour automatiser
    
    if (!confirmDelete) {
      console.log('🛑 Suppression annulée. Mettez confirmDelete à true pour automatiser.');
      return;
    }
    
    // 4. Supprimer les produits associés
    console.log('🗑️  Suppression des produits associés...');
    const { error: deleteProductsError } = await supabase
      .from('products')
      .delete()
      .in('shop_id', orphanShopIds);
    
    if (deleteProductsError) {
      throw new Error(`Erreur lors de la suppression des produits: ${deleteProductsError.message}`);
    }
    
    // 5. Supprimer les boutiques orphelines
    console.log('🗑️  Suppression des boutiques orphelines...');
    const { error: deleteShopsError } = await supabase
      .from('shops')
      .delete()
      .is('user_id', null);
    
    if (deleteShopsError) {
      throw new Error(`Erreur lors de la suppression des boutiques: ${deleteShopsError.message}`);
    }
    
    console.log('✅ Nettoyage terminé avec succès !');
    console.log(`🗑️  ${orphanShops.length} boutiques et ${productCount || 0} produits supprimés`);
    
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error.message);
    process.exit(1);
  }
}

// Exécuter le script
if (require.main === module) {
  cleanOrphanShops()
    .then(() => {
      console.log('\n🏁 Script terminé');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Erreur fatale:', error);
      process.exit(1);
    });
}

module.exports = { cleanOrphanShops };