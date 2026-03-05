import { supabase } from './src/lib/supabase.js'

// Script pour créer un shop de test
async function createTestShop() {
  try {
    console.log('🚀 Création d\'un shop de test...')
    
    // Vérifier si un shop existe déjà
    const { data: existingShop } = await supabase
      .from('shops')
      .select('id, name, slug')
      .eq('slug', 'boutique-test')
      .single()
    
    if (existingShop) {
      console.log('✅ Shop de test déjà existant:', existingShop)
      return existingShop
    }
    
    // Créer un shop de test
    const { data: shop, error } = await supabase
      .from('shops')
      .insert({
        name: 'Boutique Test',
        slug: 'boutique-test',
        description: 'Une boutique de test pour vérifier le routing',
        business_type: 'individual',
        status: 'active',
        address: {
          city: 'Paris',
          country: 'France'
        },
        policies: {
          shipping: 'Livraison gratuite en France',
          returns: 'Retours acceptés sous 30 jours',
          warranty: 'Garantie 2 ans'
        },
        rating: 4.5,
        review_count: 12,
        followers_count: 25
      })
      .select()
      .single()
    
    if (error) {
      console.error('❌ Erreur lors de la création du shop:', error)
      return null
    }
    
    console.log('✅ Shop de test créé avec succès:', shop)
    return shop
    
  } catch (error) {
    console.error('❌ Erreur:', error)
    return null
  }
}

// Créer un produit de test
async function createTestProduct(shopId) {
  try {
    console.log('🚀 Création d\'un produit de test...')
    
    // Vérifier si un produit existe déjà
    const { data: existingProduct } = await supabase
      .from('products')
      .select('id, name, slug')
      .eq('slug', 'produit-test')
      .eq('shop_id', shopId)
      .single()
    
    if (existingProduct) {
      console.log('✅ Produit de test déjà existant:', existingProduct)
      return existingProduct
    }
    
    // Créer un produit de test
    const { data: product, error } = await supabase
      .from('products')
      .insert({
        name: 'Produit Test',
        slug: 'produit-test',
        description: 'Un produit de test pour vérifier le routing',
        short_description: 'Produit de test',
        price: 29.99,
        compare_at_price: 39.99,
        shop_id: shopId,
        category_id: null,
        status: 'active',
        featured: true,
        tags: ['test', 'demo'],
        rating: 4.3,
        review_count: 8
      })
      .select()
      .single()
    
    if (error) {
      console.error('❌ Erreur lors de la création du produit:', error)
      return null
    }
    
    console.log('✅ Produit de test créé avec succès:', product)
    return product
    
  } catch (error) {
    console.error('❌ Erreur:', error)
    return null
  }
}

// Fonction principale
async function main() {
  console.log('🎯 Script de création de données de test')
  console.log('=' * 50)
  
  const shop = await createTestShop()
  
  if (shop) {
    const product = await createTestProduct(shop.id)
    
    if (product) {
      console.log('\n🎉 Données de test créées avec succès !')
      console.log('📍 URLs à tester:')
      console.log(`   - http://localhost:3001/marketplace`)
      console.log(`   - http://localhost:3001/shop/${shop.slug}`)
      console.log(`   - http://localhost:3001/shop/${shop.slug}/product/${product.slug}`)
    }
  }
  
  console.log('\n✅ Script terminé')
}

// Exécuter le script
main().catch(console.error)