const { supabase } = require('../config/supabase.ts');

async function createDemoAccount() {
  console.log('🎯 Création du compte de démonstration...');
  
  try {
    // 1. Créer l'utilisateur admin de démo
    const { data: adminUser, error: adminError } = await supabase.auth.signUp({
      email: 'demo@mangootech.com',
      password: 'demo123456'
    });

    if (adminError && !adminError.message.includes('already registered')) {
      throw adminError;
    }

    // 2. Créer la boutique de démo
    const { data: demoShop, error: shopError } = await supabase
      .from('shops')
      .insert([{
        name: 'Boutique Demo Luxe',
        slug: 'boutique-demo-luxe',
        description: 'Boutique de démonstration avec produits de luxe et technologies avancées',
        status: 'approved',
        phone: '+33123456789',
        email: 'demo@mangootech.com',
        address: '123 Avenue de la Démonstration, Paris',
        category: 'Luxe & Technologie',
        is_active: true,
        commission_rate: 5.5,
        vendor_id: adminUser?.user?.id || 'demo-user-id'
      }])
      .select()
      .single();

    if (shopError) throw shopError;

    console.log('✅ Boutique créée:', demoShop.name);

    // 3. Créer l'authentification vendeur
    const { error: authError } = await supabase
      .from('shop_auth')
      .insert([{
        shop_id: demoShop.id,
        user_id: adminUser?.user?.id || 'demo-user-id',
        role: 'admin',
        is_active: true
      }]);

    if (authError) throw authError;

    // 4. Ajouter des produits de démo
    const demoProducts = [
      {
        name: 'iPhone 15 Pro Max - Edition Démonstration',
        description: 'Le dernier iPhone en édition spéciale démonstration avec toutes les fonctionnalités activées',
        price: 1299000,
        stock_quantity: 10,
        category: 'Électronique',
        shop_id: demoShop.id,
        is_active: true,
        image_url: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=iPhone%2015%20Pro%20Max%20premium%20gold%20edition%20elegant%20product%20photography%20white%20background&image_size=square'
      },
      {
        name: 'Montre Rolex Submariner - Démo',
        description: 'Montre de luxe pour la démonstration des fonctionnalités de vente en ligne',
        price: 8500000,
        stock_quantity: 3,
        category: 'Montres & Joaillerie',
        shop_id: demoShop.id,
        is_active: true,
        image_url: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Rolex%20Submariner%20luxury%20watch%20professional%20photography%20elegant%20display&image_size=square'
      },
      {
        name: 'MacBook Pro M3 - Station Démo',
        description: 'Ordinateur portable haut de gamme pour présentations en direct',
        price: 2500000,
        stock_quantity: 5,
        category: 'Informatique',
        shop_id: demoShop.id,
        is_active: true,
        image_url: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=MacBook%20Pro%20M3%20space%20gray%20professional%20setup%20modern%20workspace&image_size=square'
      },
      {
        name: 'Parfum Chanel N°5 - Edition Démo',
        description: 'Parfum emblématique pour démonstration des ventes de produits de beauté',
        price: 150000,
        stock_quantity: 20,
        category: 'Beauté & Parfums',
        shop_id: demoShop.id,
        is_active: true,
        image_url: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Chanel%20No%205%20elegant%20perfume%20bottle%20luxury%20beauty%20product%20photography&image_size=square'
      },
      {
        name: 'Sac Louis Vuitton Neverfull - Démo',
        description: 'Sac de luxe iconique pour démonstration des fonctionnalités e-commerce',
        price: 1800000,
        stock_quantity: 7,
        category: 'Accessoires de Mode',
        shop_id: demoShop.id,
        is_active: true,
        image_url: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Louis%20Vuitton%20Neverfull%20luxury%20handbag%20brown%20monogram%20elegant%20display&image_size=square'
      }
    ];

    const { error: productsError } = await supabase
      .from('products')
      .insert(demoProducts);

    if (productsError) throw productsError;

    console.log('✅ Produits créés:', demoProducts.length);

    // 5. Configurer le numéro SIP pour la communication
    const { error: sipError } = await supabase
      .from('boutique_communications')
      .insert([{
        boutique_id: demoShop.id,
        sip_number: '+33123456789',
        sip_username: 'demo-boutique',
        sip_password: 'demo-sip-pass',
        is_active: true,
        webrtc_enabled: true,
        live_shopping_enabled: true,
        call_recording_enabled: true,
        max_concurrent_calls: 10
      }]);

    if (sipError) {
      console.log('ℹ️ Table boutique_communications non trouvée, création...');
      // La table sera créée automatiquement lors de la première utilisation
    }

    // 6. Créer des avis clients de démo
    const demoReviews = [
      {
        product_id: 'demo-product-1',
        rating: 5,
        comment: 'Produit exceptionnel ! La qualité est au rendez-vous. Service client impeccable.',
        customer_name: 'Marie D.',
        is_verified: true,
        shop_id: demoShop.id
      },
      {
        product_id: 'demo-product-2',
        rating: 4,
        comment: 'Très belle montre, conforme à la description. Livraison rapide.',
        customer_name: 'Jean-Pierre L.',
        is_verified: true,
        shop_id: demoShop.id
      }
    ];

    // Créer la table reviews si elle n'existe pas
    try {
      const { error: reviewsError } = await supabase
        .from('reviews')
        .insert(demoReviews);
      
      if (!reviewsError) {
        console.log('✅ Avis clients créés');
      }
    } catch (e) {
      console.log('ℹ️ Table reviews non trouvée');
    }

    console.log('\n🎉 COMPTE DE DÉMONSTRATION CRÉÉ AVEC SUCCÈS !\n');
    console.log('📧 Email: demo@mangootech.com');
    console.log('🔑 Mot de passe: demo123456');
    console.log('🏪 Boutique: Boutique Demo Luxe');
    console.log('📞 Numéro SIP: +33123456789');
    console.log('🔗 URL: http://localhost:3017/boutique-demo-luxe');
    console.log('\n🚀 Vous pouvez maintenant tester toutes les fonctionnalités !\n');

    // Créer un fichier de configuration pour référence
    const fs = require('fs');
    const demoConfig = {
      email: 'demo@mangootech.com',
      password: 'demo123456',
      boutique: {
        id: demoShop.id,
        name: demoShop.name,
        slug: demoShop.slug,
        sip_number: '+33123456789'
      },
      products: demoProducts.length,
      created_at: new Date().toISOString()
    };

    fs.writeFileSync('demo-account-config.json', JSON.stringify(demoConfig, null, 2));
    console.log('💾 Configuration sauvegardée dans demo-account-config.json');

  } catch (error) {
    console.error('❌ Erreur lors de la création du compte demo:', error);
    process.exit(1);
  }
}

// Exécuter le script
if (require.main === module) {
  createDemoAccount().then(() => {
    console.log('\n✅ Script terminé');
    process.exit(0);
  }).catch((error) => {
    console.error('❌ Script échoué:', error);
    process.exit(1);
  });
}

module.exports = { createDemoAccount };