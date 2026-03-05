// Script pour créer des données de test marketplace sans dépendances au navigateur
import { createClient } from '@supabase/supabase-js'

// Configuration Supabase depuis les variables d'environnement ou valeurs par défaut
const supabaseUrl = process.env.SUPABASE_URL || 'http://127.0.0.1:54321'
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4M
TI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

const supabase = createClient(supabaseUrl, supabaseKey)

// Script pour créer des données de test pour le marketplace
async function createMarketplaceTestData() {
  try {
    console.log('🚀 Création des données de test pour le marketplace...')

    // 1. Créer les catégories
    const categories = [
      { name: 'Électronique', slug: 'electronique', description: 'Tous les produits électroniques', sort_order: 1 },
      { name: 'Mode', slug: 'mode', description: 'Vêtements et accessoires', sort_order: 2 },
      { name: 'Maison', slug: 'maison', description: 'Articles pour la maison', sort_order: 3 },
      { name: 'Sport', slug: 'sport', description: 'Équipements sportifs', sort_order: 4 },
      { name: 'Beauté', slug: 'beaute', description: 'Produits de beauté et soins', sort_order: 5 }
    ]

    console.log('📁 Création des catégories...')
    for (const category of categories) {
      const { data, error } = await supabase
        .from('categories')
        .upsert(category, { onConflict: 'slug' })
        .select()
        .single()

      if (error) {
        console.error(`❌ Erreur création catégorie ${category.slug}:`, error.message)
      } else {
        console.log(`✅ Catégorie créée: ${category.name}`)
      }
    }

    // 2. Créer une boutique de test (sans utilisateur pour éviter les problèmes de permissions)
    console.log('🏪 Création de la boutique de test...')
    
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
    }

    const { data: shop, error: shopError } = await supabase
      .from('shops')
      .upsert(shopData, { onConflict: 'slug' })
      .select()
      .single()

    if (shopError) {
      console.error('❌ Erreur création boutique:', shopError.message)
      return
    }

    console.log('✅ Boutique créée:', shop.name)

    // 3. Créer des produits de test
    console.log('📦 Création des produits de test...')
    
    // Récupérer les IDs des catégories
    const { data: electronicsCat } = await supabase.from('categories').select('id').eq('slug', 'electronique').single()
    const { data: fashionCat } = await supabase.from('categories').select('id').eq('slug', 'mode').single()
    const { data: homeCat } = await supabase.from('categories').select('id').eq('slug', 'maison').single()

    const products = [
      {
        shop_id: shop.id,
        category_id: electronicsCat?.id,
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
        shop_id: shop.id,
        category_id: fashionCat?.id,
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
        shop_id: shop.id,
        category_id: homeCat?.id,
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
    ]

    for (const productData of products) {
      const { data: product, error: productError } = await supabase
        .from('products')
        .upsert(productData, { onConflict: 'shop_id,slug' })
        .select()
        .single()

      if (productError) {
        console.error(`❌ Erreur création produit ${productData.slug}:`, productError.message)
        continue
      }

      console.log(`✅ Produit créé: ${product.name}`)

      // 4. Créer des variants pour chaque produit
      if (product.slug === 'smartphone-premium') {
        const variants = [
          { name: 'Noir 128GB', sku: 'PHONE-BLK-128', price: 699.99, inventory_quantity: 15 },
          { name: 'Blanc 128GB', sku: 'PHONE-WHT-128', price: 699.99, inventory_quantity: 12 },
          { name: 'Noir 256GB', sku: 'PHONE-BLK-256', price: 799.99, inventory_quantity: 8 }
        ]

        for (const variant of variants) {
          const { error: variantError } = await supabase
            .from('product_variants')
            .upsert({
              product_id: product.id,
              ...variant,
              inventory_tracking: true
            }, { onConflict: 'product_id,sku' })

          if (variantError) {
            console.error(`❌ Erreur création variant ${variant.sku}:`, variantError.message)
          } else {
            console.log(`✅ Variant créé: ${variant.name}`)
          }
        }
      } else {
        // Variant par défaut pour les autres produits
        const { error: variantError } = await supabase
          .from('product_variants')
          .upsert({
            product_id: product.id,
            name: 'Standard',
            sku: `${product.slug.toUpperCase().replace('-', '')}-STD`,
            price: product.price,
            inventory_quantity: 20,
            inventory_tracking: true
          }, { onConflict: 'product_id,sku' })

        if (variantError) {
          console.error(`❌ Erreur création variant pour ${product.slug}:`, variantError.message)
        } else {
          console.log(`✅ Variant créé: Standard pour ${product.name}`)
        }
      }

      // 5. Créer des images pour chaque produit
      const images = [
        {
          url: `https://via.placeholder.com/600x600/${product.slug === 'smartphone-premium' ? '4F46E5' : product.slug === 'montre-connectee' ? 'EC4899' : '10B981'}/FFFFFF?text=${encodeURIComponent(product.name)}`,
          alt_text: `${product.name} - Vue principale`,
          position: 1,
          is_primary: true
        }
      ]

      for (const image of images) {
        const { error: imageError } = await supabase
          .from('product_images')
          .upsert({
            product_id: product.id,
            ...image
          }, { onConflict: 'product_id,position' })

        if (imageError) {
          console.error(`❌ Erreur création image pour ${product.slug}:`, imageError.message)
        } else {
          console.log(`✅ Image créée pour ${product.name}`)
        }
      }
    }

    console.log('\n🎉 Données de test marketplace créées avec succès !')
    console.log('📍 URLs à tester:')
    console.log(`   - http://localhost:3001/marketplace`)
    console.log(`   - http://localhost:3001/shop/${shop.slug}`)
    console.log(`   - http://localhost:3001/shop/${shop.slug}/product/smartphone-premium`)

  } catch (error) {
    console.error('❌ Erreur générale:', error)
  }
}

// Exécuter le script
console.log('🎯 Script de création de données marketplace')
console.log('='.repeat(50))
createMarketplaceTestData()