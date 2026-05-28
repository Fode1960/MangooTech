// Script simple pour créer des données de test marketplace
// Utilise fetch pour insérer les données directement

const SUPABASE_URL = 'http://127.0.0.1:54321';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

async function createMarketplaceData() {
  console.log('🚀 Création des données de test marketplace...');
  
  try {
    // 1. Créer les catégories
    const categories = [
      { name: 'Électronique', slug: 'electronique', description: 'Tous les produits électroniques', sort_order: 1 },
      { name: 'Mode', slug: 'mode', description: 'Vêtements et accessoires', sort_order: 2 },
      { name: 'Maison', slug: 'maison', description: 'Articles pour la maison', sort_order: 3 },
      { name: 'Sport', slug: 'sport', description: 'Équipements sportifs', sort_order: 4 },
      { name: 'Beauté', slug: 'beaute', description: 'Produits de beauté et soins', sort_order: 5 }
    ];

    console.log('📁 Création des catégories...');
    for (const category of categories) {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify(category)
      });
      
      if (response.ok) {
        console.log(`✅ Catégorie créée: ${category.name}`);
      } else {
        console.log(`ℹ️ Catégorie déjà existante ou erreur: ${category.name}`);
      }
    }

    // 2. Créer une boutique de test
    console.log('🏪 Création de la boutique de test...');
    
    const shopData = {
      name: 'Boutique Demo',
      slug: 'boutique-demo',
      description: 'Une boutique de démonstration pour tester le marketplace',
      business_type: 'individual',
      status: 'approved',
      address: { city: 'Paris', country: 'France' },
      policies: { 
        shipping: 'Livraison gratuite en France métropolitaine',
        returns: 'Retours acceptés sous 30 jours',
        warranty: 'Garantie 2 ans sur tous les produits'
      },
      review_count: 12,
      followers_count: 25,
      rating: 4.5
    };

    const shopResponse = await fetch(`${SUPABASE_URL}/rest/v1/shops`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify(shopData)
    });

    if (shopResponse.ok) {
      console.log('✅ Boutique créée: Boutique Demo');
    } else {
      console.log('ℹ️ Boutique déjà existante ou erreur');
    }

    // 3. Obtenir l'ID de la boutique
    const shopsResponse = await fetch(`${SUPABASE_URL}/rest/v1/shops?slug=eq.boutique-demo&select=id`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });
    
    const shops = await shopsResponse.json();
    const shopId = shops[0]?.id;
    
    if (!shopId) {
      console.error('❌ Impossible de récupérer l\'ID de la boutique');
      return;
    }

    // 4. Créer des produits de test
    console.log('📦 Création des produits de test...');
    
    const products = [
      {
        shop_id: shopId,
        name: 'Smartphone Premium',
        slug: 'smartphone-premium',
        description: 'Un smartphone haut de gamme avec écran OLED et 5G',
        short_description: 'Smartphone 5G haut de gamme',
        price: 699.99,
        compare_at_price: 799.99,
        status: 'active',
        featured: true,
        tags: ['smartphone', '5G', 'premium'],
        review_count: 8
      },
      {
        shop_id: shopId,
        name: 'Montre Connectée',
        slug: 'montre-connectee',
        description: 'Montre intelligente avec suivi de santé et notifications',
        short_description: 'Montre connectée élégante',
        price: 199.99,
        compare_at_price: 249.99,
        status: 'active',
        featured: true,
        tags: ['montre', 'connecte', 'sante'],
        review_count: 6
      },
      {
        shop_id: shopId,
        name: 'Enceinte Bluetooth',
        slug: 'enceinte-bluetooth',
        description: 'Enceinte portable avec son haute qualité',
        short_description: 'Enceinte Bluetooth portable',
        price: 79.99,
        compare_at_price: 99.99,
        status: 'active',
        featured: false,
        tags: ['enceinte', 'bluetooth', 'audio'],
        review_count: 4
      }
    ];

    for (const product of products) {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify(product)
      });
      
      if (response.ok) {
        console.log(`✅ Produit créé: ${product.name}`);
      } else {
        console.log(`ℹ️ Produit déjà existant: ${product.name}`);
      }
    }

    console.log('\n🎉 Données de test marketplace créées avec succès !');
    console.log('📍 URLs à tester:');
    console.log('   - http://localhost:3001/marketplace');
    console.log('   - http://localhost:3001/shop/boutique-demo');
    console.log('   - http://localhost:3001/shop/boutique-demo/product/smartphone-premium');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

// Exécuter le script
createMarketplaceData();