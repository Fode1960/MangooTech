#!/usr/bin/env node

/**
 * Script de diagnostic des boutiques dans Supabase
 * Ce script analyse les boutiques et identifie les problèmes de partage
 */

import { createClient } from '@supabase/supabase-js';

// Configuration Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Erreur: VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY doivent être définis');
  console.log('\n💡 Utilisez: set VITE_SUPABASE_URL=votre_url && set VITE_SUPABASE_ANON_KEY=votre_cle');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function diagnoseShops() {
  try {
    console.log('🔍 Analyse des boutiques dans Supabase...\n');
    
    // 1. Statistiques générales
    const { data: allShops, error: allError } = await supabase
      .from('shops')
      .select('id, name, user_id, status, created_at')
      .order('created_at', { ascending: false });
    
    if (allError) {
      throw new Error(`Erreur lors de la récupération: ${allError.message}`);
    }
    
    console.log(`📊 Total des boutiques: ${allShops.length}`);
    
    // 2. Boutiques par statut
    const byStatus = {};
    allShops.forEach(shop => {
      byStatus[shop.status] = (byStatus[shop.status] || 0) + 1;
    });
    console.log('📈 Boutiques par statut:');
    Object.entries(byStatus).forEach(([status, count]) => {
      console.log(`   - ${status}: ${count}`);
    });
    
    // 3. Boutiques orphelines (sans user_id)
    const orphanShops = allShops.filter(shop => !shop.user_id);
    console.log(`\n⚠️  Boutiques orphelines (sans user_id): ${orphanShops.length}`);
    
    if (orphanShops.length > 0) {
      console.log('   Ces boutiques sont visibles par TOUS les utilisateurs:');
      orphanShops.forEach(shop => {
        console.log(`   - 🏪 ${shop.name} (ID: ${shop.id}, créée le: ${shop.created_at})`);
      });
    }
    
    // 4. Produits des boutiques orphelines
    if (orphanShops.length > 0) {
      const orphanShopIds = orphanShops.map(shop => shop.id);
      const { data: orphanProducts, error: productsError } = await supabase
        .from('products')
        .select('id, name, shop_id, price, status')
        .in('shop_id', orphanShopIds);
      
      if (productsError) {
        console.warn('⚠️  Impossible de récupérer les produits:', productsError.message);
      } else {
        console.log(`\n🛍️  Produits dans les boutiques orphelines: ${orphanProducts.length}`);
        orphanProducts.forEach(product => {
          const shop = orphanShops.find(s => s.id === product.shop_id);
          console.log(`   - ${product.name} (${product.price}€) dans ${shop?.name}`);
        });
      }
    }
    
    // 5. Utilisateurs avec plusieurs boutiques
    const userShops = {};
    allShops.forEach(shop => {
      if (shop.user_id) {
        userShops[shop.user_id] = (userShops[shop.user_id] || 0) + 1;
      }
    });
    
    const multiShopUsers = Object.entries(userShops).filter(([_, count]) => count > 1);
    if (multiShopUsers.length > 0) {
      console.log(`\n👥 Utilisateurs avec plusieurs boutiques: ${multiShopUsers.length}`);
      multiShopUsers.forEach(([userId, count]) => {
        console.log(`   - Utilisateur ${userId}: ${count} boutiques`);
      });
    }
    
    // 6. Recommandations
    console.log('\n💡 Recommandations:');
    if (orphanShops.length > 0) {
      console.log('   1. Supprimez les boutiques orphelines (sans user_id)');
      console.log('   2. Vérifiez que toutes les nouvelles boutiques ont un user_id');
      console.log('   3. Utilisez le script clean-orphan-shops.js pour nettoyer');
    } else {
      console.log('   ✅ Aucune boutique orpheline détectée');
    }
    
    console.log('\n🔍 Analyse terminée !');
    
  } catch (error) {
    console.error('❌ Erreur lors du diagnostic:', error.message);
    process.exit(1);
  }
}

// Exécuter le script
diagnoseShops()
  .then(() => {
    console.log('\n🏁 Diagnostic terminé');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Erreur lors du diagnostic:', error);
    process.exit(1);
  });