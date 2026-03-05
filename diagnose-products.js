#!/usr/bin/env node

/**
 * Script de diagnostic des PRODUITS dans Supabase
 * Ce script analyse les produits et identifie les problèmes de partage
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

async function diagnoseProducts() {
  try {
    console.log('🔍 Analyse des PRODUITS dans Supabase...\n');

    // Récupérer tous les produits avec leurs boutiques
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select(`
        *,
        shops!inner(*)
      `);

    if (productsError) {
      console.error('❌ Erreur lors de la récupération des produits:', productsError);
      return;
    }

    console.log(`📊 Total des produits: ${products.length}`);

    if (products.length === 0) {
      console.log('✅ Aucun produit trouvé - pas de problème de partage');
      return;
    }

    // Analyser les produits par boutique
    const productsByShop = {};
    const productsWithoutShop = [];
    const productsWithNullUserId = [];

    products.forEach(product => {
      if (!product.shops || product.shops.length === 0) {
        productsWithoutShop.push(product);
      } else {
        const shop = product.shops[0];
        const shopKey = `${shop.id}_${shop.user_id || 'NULL'}`;
        
        if (!productsByShop[shopKey]) {
          productsByShop[shopKey] = {
            shop: shop,
            products: []
          };
        }
        productsByShop[shopKey].products.push(product);

        // Vérifier les produits avec user_id NULL
        if (!shop.user_id) {
          productsWithNullUserId.push(product);
        }
      }
    });

    console.log('\n📈 Analyse par boutique:');
    Object.entries(productsByShop).forEach(([key, data]) => {
      const { shop, products } = data;
      console.log(`   - Boutique ${shop.name} (ID: ${shop.id}, User: ${shop.user_id || 'NULL'}): ${products.length} produits`);
    });

    if (productsWithoutShop.length > 0) {
      console.log(`\n⚠️  Produits sans boutique: ${productsWithoutShop.length}`);
      productsWithoutShop.forEach(product => {
        console.log(`   - Produit ${product.name} (ID: ${product.id})`);
      });
    }

    if (productsWithNullUserId.length > 0) {
      console.log(`\n🚨 ALERTE: ${productsWithNullUserId.length} produits appartiennent à des boutiques sans user_id !`);
      console.log('💡 Ces produits seront visibles par TOUS les utilisateurs !');
      productsWithNullUserId.forEach(product => {
        console.log(`   - Produit ${product.name} (ID: ${product.id}) dans boutique ${product.shops[0].name}`);
      });
    }

    // Vérifier les doublons de noms de produits
    const productNames = products.map(p => p.name);
    const duplicates = productNames.filter((name, index) => productNames.indexOf(name) !== index);
    
    if (duplicates.length > 0) {
      console.log(`\n⚠️  Produits avec des noms en double: ${[...new Set(duplicates)].join(', ')}`);
    }

    // Récupérer les utilisateurs pour comparaison
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email');

    if (!usersError && users) {
      console.log(`\n👥 Total des utilisateurs: ${users.length}`);
      
      // Vérifier si des produits appartiennent à des utilisateurs qui n'existent plus
      const shopUserIds = [...new Set(products.map(p => p.shops?.[0]?.user_id).filter(id => id))];
      const existingUserIds = users.map(u => u.id);
      const orphanUserIds = shopUserIds.filter(id => !existingUserIds.includes(id));
      
      if (orphanUserIds.length > 0) {
        console.log(`\n⚠️  Produits appartenant à des utilisateurs supprimés: ${orphanUserIds.length}`);
      }
    }

    console.log('\n🔍 Analyse terminée !');

  } catch (error) {
    console.error('❌ Erreur lors du diagnostic:', error);
  }
}

// Exécuter le script
diagnoseProducts()
  .then(() => {
    console.log('\n🏁 Diagnostic terminé');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Erreur lors du diagnostic:', error);
    process.exit(1);
  });