#!/usr/bin/env node

/**
 * Script de test pour vérifier la séparation des données
 * Ce script teste que chaque utilisateur voit uniquement ses propres produits
 */

const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Erreur: VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY doivent être définis');
  console.log('\n💡 Utilisez: set VITE_SUPABASE_URL=votre_url && set VITE_SUPABASE_ANON_KEY=votre_cle');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testDataIsolation() {
  try {
    console.log('🧪 Test de séparation des données...\n');
    
    // 1. Récupérer plusieurs utilisateurs différents
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email')
      .limit(5);
    
    if (usersError) {
      throw new Error(`Erreur lors de la récupération des utilisateurs: ${usersError.message}`);
    }
    
    if (!users || users.length < 2) {
      console.log('⚠️  Pas assez d\'utilisateurs pour tester la séparation');
      return;
    }
    
    console.log(`👥 Test avec ${users.length} utilisateurs:\n`);
    
    // 2. Pour chaque utilisateur, vérifier ses boutiques et produits
    for (const user of users) {
      console.log(`🔍 Utilisateur: ${user.email} (${user.id})`);
      
      // 2.1 Boutiques de l'utilisateur
      const { data: shops, error: shopsError } = await supabase
        .from('shops')
        .select('id, name, user_id, created_at')
        .eq('user_id', user.id);
      
      if (shopsError) {
        console.log(`   ❌ Erreur boutiques: ${shopsError.message}`);
        continue;
      }
      
      console.log(`   🏪 ${shops.length} boutiques`);
      
      // 2.2 Produits de chaque boutique
      for (const shop of shops) {
        const { data: products, error: productsError } = await supabase
          .from('products')
          .select('id, name, shop_id, price, status')
          .eq('shop_id', shop.id);
        
        if (productsError) {
          console.log(`      ❌ Erreur produits: ${productsError.message}`);
          continue;
        }
        
        console.log(`      🛍️  Boutique "${shop.name}": ${products.length} produits`);
        
        // 2.3 Vérifier que les produits appartiennent bien à cette boutique
        const foreignProducts = products.filter(p => p.shop_id !== shop.id);
        if (foreignProducts.length > 0) {
          console.log(`      ⚠️  ${foreignProducts.length} produits étrangers détectés !`);
        }
      }
      
      // 2.4 Vérifier qu'il n'y a pas de produits dans d'autres boutiques
      const { data: foreignProducts, error: foreignError } = await supabase
        .from('products')
        .select('id, name, shop_id, price')
        .neq('shop_id', shops.map(s => s.id));
      
      if (foreignError) {
        console.log(`   ❌ Erreur produits étrangers: ${foreignError.message}`);
        continue;
      }
      
      if (foreignProducts.length > 0) {
        console.log(`   ⚠️  ${foreignProducts.length} produits dans d'autres boutiques détectés`);
        
        // Identifier les boutiques étrangères
        const foreignShopIds = [...new Set(foreignProducts.map(p => p.shop_id))];
        const { data: foreignShops, error: foreignShopsError } = await supabase
          .from('shops')
          .select('id, name, user_id')
          .in('id', foreignShopIds);
        
        if (!foreignShopsError && foreignShops) {
          foreignShops.forEach(shop => {
            console.log(`      🏪 Boutique étrangère: "${shop.name}" (user_id: ${shop.user_id})`);
          });
        }
      }
      
      console.log('');
    }
    
    // 3. Vérifier les boutiques orphelines
    const { data: orphanShops, error: orphanError } = await supabase
      .from('shops')
      .select('id, name, user_id, created_at')
      .is('user_id', null);
    
    if (orphanError) {
      console.log(`❌ Erreur boutiques orphelines: ${orphanError.message}`);
    } else if (orphanShops.length > 0) {
      console.log(`⚠️  ${orphanShops.length} boutiques orphelines détectées !`);
      console.log('   Ces boutiques sont visibles par TOUS les utilisateurs:');
      orphanShops.forEach(shop => {
        console.log(`   - "${shop.name}" (ID: ${shop.id})`);
      });
    }
    
    console.log('\n✅ Test terminé !');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
    process.exit(1);
  }
}

// Exécuter le script
if (require.main === module) {
  testDataIsolation()
    .then(() => {
      console.log('\n🏁 Test terminé');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Erreur fatale:', error);
      process.exit(1);
    });
}

module.exports = { testDataIsolation };