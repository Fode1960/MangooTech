// Script pour insérer les données de test du marketplace via l'API Supabase
const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5NjZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function insertMarketplaceData() {
  console.log('🚀 Insertion des données de test du marketplace...');

  try {
    // 1. Créer un utilisateur de test s'il n'existe pas
    const { data: userData, error: userError } = await supabase
      .from('auth.users')
      .select('id')
      .eq('email', 'demo@example.com')
      .single();

    let userId;
    if (userError || !userData) {
      console.log('📋 Création d\'un utilisateur de test...');
      const { data: newUser, error: createUserError } = await supabase.auth.signUp({
        email: 'demo@example.com',
        password: 'demo123456'
      });
      
      if (createUserError) {
        console.error('❌ Erreur lors de la création de l\'utilisateur:', createUserError);
        return;
      }
      
      userId = newUser.user.id;
      console.log('✅ Utilisateur créé:', userId);
    } else {
      userId = userData.id;
      console.log('✅ Utilisateur existant trouvé:', userId);
    }

    // 2. Insérer les catégories
    console.log('📁 Insertion des catégories...');
    const categories = [
      { name: 'Électronique', slug: 'electronique', description: 'Tous les produits électroniques', sort_order: 1, is_active: true, commission_rate: 5.00 },
      { name: 'Mode', slug: 'mode', description: 'Vêtements et accessoires de mode', sort_order: 2, is_active: true, commission_rate: 5.00 },
      { name: 'Maison', slug: 'maison', description: 'Articles pour la maison et décoration', sort_order: 3, is_active: true, commission_rate: 5.00 },
      { name: 'Sport', slug: 'sport', description: 'Équipements et vêtements de sport', sort_order: 4, is_active: true, commission_rate: 5.00 },
      { name: 'Beauté', slug: 'beaute', description: 'Produits de beauté et soins', sort_order: 5, is_active: true, commission_rate: 5.00 },
      { name: 'Livres', slug: 'livres', description: 'Livres et publications', sort_order: 6, is_active: true, commission_rate: 5.00 },
      { name: 'Jouets', slug: 'jouets', description: 'Jouets et jeux', sort_order: 7, is_active: true, commission_rate: 5.00 },
      { name: 'Alimentation', slug: 'alimentation', description: 'Produits alimentaires', sort_order: 8, is_active: true, commission_rate: 5.00 },
      { name: 'Artisanat', slug: 'artisanat', description: 'Produits faits main', sort_order: 9, is_active: true, commission_rate: 5.00 },
      { name: 'Autres', slug: 'autres', description: 'Autres catégories', sort_order: 10, is_active: true, commission_rate: 5.00 }
    ];

    for (const category of categories) {
      const { error } = await supabase
        .from('categories')
        .upsert(category, { onConflict: 'slug' });
      
      if (error) {
        console.error(`❌ Erreur lors de l\'insertion de la catégorie ${category.name}:`, error);
      } else {
        console.log(`✅ Catégorie ${category.name} créée`);
      }
    }

    // 3. Créer une boutique de démonstration
    console.log('🏪 Création de la boutique de démonstration...');
    const { data: shopData, error: shopError } = await supabase
      .from('shops')
      .upsert({
        user_id: userId,
        name: 'Boutique Demo',
        slug: 'boutique-demo',
        description: 'Une boutique de démonstration pour tester le marketplace',
        status: 'approved',
        business_type: 'individual',
        contact_email: 'demo@example.com',
        address: { city: 'Paris', country: 'France' },
        commission_rate: 5.00,
        review_count: 0,
        followers_count: 0,
        total_sales: 0,
        total_revenue: 0.00
      }, { onConflict: 'slug' })
      .select()
      .single();

    if (shopError) {
      console.error('❌ Erreur lors de la création de la boutique:', shopError);
      return;
    }

    console.log('✅ Boutique créée:', shopData.id);

    // 4. Récupérer les IDs des catégories
    const { data: categoryData } = await supabase
      .from('categories')
      .select('id, slug')
      .in('slug', ['electronique', 'mode', 'maison', 'sport']);

    const categoriesBySlug = {};
    categoryData.forEach(cat => {
      categoriesBySlug[cat.slug] = cat.id;
    });

    // 5. Créer des produits de démonstration
    console.log('📦 Création des produits de démonstration...');
    const products = [
      {
        shop_id: shopData.id,
        category_id: categoriesBySlug.electronique,
        name: 'Smartphone Premium',
        slug: 'smartphone-premium',
        description: 'Un smartphone haut de gamme avec toutes les dernières fonctionnalités',
        short_description: 'Smartphone haut de gamme',
        price: 599.99,
        status: 'active',
        featured: true,
        tags: ['smartphone', 'premium', 'technologie'],
        review_count: 0,
        average_rating: 0.00,
        sales_count: 0
      },
      {
        shop_id: shopData.id,
        category_id: categoriesBySlug.mode,
        name: 'T-shirt en Coton Bio',
        slug: 't-shirt-coton-bio',
        description: 'T-shirt confortable en coton biologique',
        short_description: 'T-shirt écologique',
        price: 29.99,
        status: 'active',
        featured: false,
        tags: ['tshirt', 'coton', 'bio', 'mode'],
        review_count: 0,
        average_rating: 0.00,
        sales_count: 0
      },
      {
        shop_id: shopData.id,
        category_id: categoriesBySlug.maison,
        name: 'Lampe Design LED',
        slug: 'lampe-design-led',
        description: 'Lampe moderne avec technologie LED',
        short_description: 'Éclairage moderne',
        price: 89.99,
        status: 'active',
        featured: true,
        tags: ['lampe', 'led', 'design', 'maison'],
        review_count: 0,
        average_rating: 0.00,
        sales_count: 0
      },
      {
        shop_id: shopData.id,
        category_id: categoriesBySlug.sport,
        name: 'Chaussures de Running',
        slug: 'chaussures-running',
        description: 'Chaussures de course professionnelles',
        short_description: 'Chaussures sport',
        price: 129.99,
        status: 'active',
        featured: false,
        tags: ['chaussures', 'running', 'sport'],
        review_count: 0,
        average_rating: 0.00,
        sales_count: 0
      }
    ];

    for (const product of products) {
      const { data: productData, error: productError } = await supabase
        .from('products')
        .upsert(product, { onConflict: 'shop_id, slug' })
        .select()
        .single();

      if (productError) {
        console.error(`❌ Erreur lors de la création du produit ${product.name}:`, productError);
        continue;
      }

      console.log(`✅ Produit ${product.name} créé`);

      // 6. Créer des variantes pour chaque produit
      const variants = [];
      if (product.slug === 'smartphone-premium') {
        variants.push(
          { product_id: productData.id, name: 'Noir 128GB', price: 599.99, inventory_quantity: 10, options: { color: 'noir', storage: '128GB' }, position: 1 },
          { product_id: productData.id, name: 'Blanc 128GB', price: 599.99, inventory_quantity: 8, options: { color: 'blanc', storage: '128GB' }, position: 2 },
          { product_id: productData.id, name: 'Noir 256GB', price: 699.99, inventory_quantity: 5, options: { color: 'noir', storage: '256GB' }, position: 3 }
        );
      } else if (product.slug === 't-shirt-coton-bio') {
        variants.push(
          { product_id: productData.id, name: 'Taille S', price: 29.99, inventory_quantity: 50, options: { size: 'S' }, position: 1 },
          { product_id: productData.id, name: 'Taille M', price: 29.99, inventory_quantity: 45, options: { size: 'M' }, position: 2 },
          { product_id: productData.id, name: 'Taille L', price: 29.99, inventory_quantity: 40, options: { size: 'L' }, position: 3 }
        );
      } else if (product.slug === 'lampe-design-led') {
        variants.push(
          { product_id: productData.id, name: 'Standard', price: 89.99, inventory_quantity: 15, options: { type: 'standard' }, position: 1 }
        );
      } else if (product.slug === 'chaussures-running') {
        variants.push(
          { product_id: productData.id, name: 'Taille 42', price: 129.99, inventory_quantity: 20, options: { size: '42' }, position: 1 },
          { product_id: productData.id, name: 'Taille 43', price: 129.99, inventory_quantity: 18, options: { size: '43' }, position: 2 },
          { product_id: productData.id, name: 'Taille 44', price: 129.99, inventory_quantity: 16, options: { size: '44' }, position: 3 }
        );
      }

      for (const variant of variants) {
        const { error: variantError } = await supabase
          .from('product_variants')
          .upsert(variant, { onConflict: 'product_id, name' });

        if (variantError) {
          console.error(`❌ Erreur lors de la création de la variante ${variant.name}:`, variantError);
        } else {
          console.log(`✅ Variante ${variant.name} créée`);
        }
      }

      // 7. Créer des images pour chaque produit
      const images = [];
      if (product.slug === 'smartphone-premium') {
        images.push(
          { product_id: productData.id, url: 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=500', alt_text: 'Smartphone Premium Noir', position: 1, is_primary: true },
          { product_id: productData.id, url: 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=500', alt_text: 'Smartphone Premium Blanc', position: 2, is_primary: false }
        );
      } else if (product.slug === 't-shirt-coton-bio') {
        images.push(
          { product_id: productData.id, url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500', alt_text: 'T-shirt Coton Bio', position: 1, is_primary: true }
        );
      } else if (product.slug === 'lampe-design-led') {
        images.push(
          { product_id: productData.id, url: 'https://images.unsplash.com/photo-1565636192335-f2e4b8f9c0a0?w=500', alt_text: 'Lampe Design LED', position: 1, is_primary: true }
        );
      } else if (product.slug === 'chaussures-running') {
        images.push(
          { product_id: productData.id, url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500', alt_text: 'Chaussures de Running', position: 1, is_primary: true }
        );
      }

      for (const image of images) {
        const { error: imageError } = await supabase
          .from('product_images')
          .upsert(image, { onConflict: 'product_id, position' });

        if (imageError) {
          console.error(`❌ Erreur lors de la création de l\'image ${image.alt_text}:`, imageError);
        } else {
          console.log(`✅ Image ${image.alt_text} créée`);
        }
      }
    }

    console.log('\n🎉 Données de test marketplace créées avec succès !');
    console.log('\n📍 URLs à tester:');
    console.log('• http://localhost:3001/marketplace');
    console.log('• http://localhost:3001/shop/boutique-demo');
    console.log('• http://localhost:3001/shop/boutique-demo/product/smartphone-premium');

  } catch (error) {
    console.error('❌ Erreur lors de l\'insertion des données:', error);
  }
}

// Exécuter le script
insertMarketplaceData();