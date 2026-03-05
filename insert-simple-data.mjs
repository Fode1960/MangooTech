import { createClient } from '@supabase/supabase-js';

const supabase = createClient('http://localhost:54321', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5NjZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0');

async function insertData() {
  console.log('🚀 Insertion des données de test...');
  
  try {
    // 1. Catégories
    const categories = [
      { name: 'Électronique', slug: 'electronique', description: 'Produits électroniques', sort_order: 1, is_active: true, commission_rate: 5 },
      { name: 'Mode', slug: 'mode', description: 'Vêtements et accessoires', sort_order: 2, is_active: true, commission_rate: 5 },
      { name: 'Maison', slug: 'maison', description: 'Articles pour la maison', sort_order: 3, is_active: true, commission_rate: 5 },
      { name: 'Sport', slug: 'sport', description: 'Équipements sportifs', sort_order: 4, is_active: true, commission_rate: 5 }
    ];

    for (const cat of categories) {
      const { error } = await supabase.from('categories').upsert(cat, { onConflict: 'slug' });
      if (error) console.log(`Erreur catégorie ${cat.name}: ${error.message}`);
      else console.log(`✅ Catégorie ${cat.name} créée`);
    }

    // 2. Boutique demo
    const { data: shop, error: shopError } = await supabase.from('shops').upsert({
      user_id: '00000000-0000-0000-0000-000000000000',
      name: 'Boutique Demo',
      slug: 'boutique-demo',
      description: 'Boutique de démonstration',
      status: 'approved',
      business_type: 'individual',
      contact_email: 'demo@example.com',
      address: { city: 'Paris', country: 'France' },
      commission_rate: 5
    }, { onConflict: 'slug' }).select().single();

    if (shopError) {
      console.log('Erreur boutique:', shopError.message);
      return;
    }
    console.log('✅ Boutique créée');

    // 3. Produits
    const { data: catIds } = await supabase.from('categories').select('id, slug');
    const catMap = {};
    catIds.forEach(c => catMap[c.slug] = c.id);

    const products = [
      {
        shop_id: shop.id,
        category_id: catMap.electronique,
        name: 'Smartphone Premium',
        slug: 'smartphone-premium',
        description: 'Smartphone haut de gamme',
        short_description: 'Smartphone premium avec caméra avancée',
        price: 599.99,
        status: 'active',
        featured: true,
        tags: ['smartphone', 'premium']
      },
      {
        shop_id: shop.id,
        category_id: catMap.mode,
        name: 'T-shirt Bio',
        slug: 't-shirt-bio',
        description: 'T-shirt en coton biologique',
        short_description: 'T-shirt écologique confortable',
        price: 29.99,
        status: 'active',
        featured: false,
        tags: ['tshirt', 'bio']
      }
    ];

    for (const product of products) {
      const { data: prod, error: prodError } = await supabase.from('products').upsert(product, { onConflict: 'shop_id, slug' }).select().single();
      
      if (prodError) {
        console.log(`Erreur produit ${product.name}:`, prodError.message);
        continue;
      }
      console.log(`✅ Produit ${product.name} créé`);

      // Variantes
      let variants = [];
      if (product.slug === 'smartphone-premium') {
        variants = [
          { product_id: prod.id, name: 'Noir 128GB', price: 599.99, inventory_quantity: 10, options: { color: 'noir', storage: '128GB' }, position: 1 },
          { product_id: prod.id, name: 'Blanc 128GB', price: 599.99, inventory_quantity: 8, options: { color: 'blanc', storage: '128GB' }, position: 2 }
        ];
      } else {
        variants = [
          { product_id: prod.id, name: 'Taille M', price: 29.99, inventory_quantity: 50, options: { size: 'M' }, position: 1 }
        ];
      }

      for (const variant of variants) {
        const { error: varError } = await supabase.from('product_variants').upsert(variant, { onConflict: 'product_id, name' });
        if (varError) console.log(`Erreur variante ${variant.name}:`, varError.message);
        else console.log(`✅ Variante ${variant.name} créée`);
      }

      // Images
      const images = [
        { product_id: prod.id, url: 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=500', alt_text: product.name, position: 1, is_primary: true }
      ];

      for (const image of images) {
        const { error: imgError } = await supabase.from('product_images').upsert(image, { onConflict: 'product_id, position' });
        if (imgError) console.log(`Erreur image ${image.alt_text}:`, imgError.message);
        else console.log(`✅ Image ${image.alt_text} créée`);
      }
    }

    console.log('\n🎉 Données de test marketplace créées avec succès !');
    console.log('📍 URLs à tester:');
    console.log('• http://localhost:3001/marketplace');
    console.log('• http://localhost:3001/shop/boutique-demo');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    process.exit(0);
  }
}

insertData();