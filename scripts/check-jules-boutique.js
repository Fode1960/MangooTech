import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Charger les variables d'environnement
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkBoutiqueStatus() {
  try {
    console.log('🔍 Vérification du statut de Jules Boutique...\n');
    
    // Rechercher toutes les boutiques Jules
    const { data: shops, error } = await supabase
      .from('shops')
      .select('*')
      .ilike('name', '%jules%');

    if (error) {
      console.error('❌ Erreur:', error);
      return;
    }

    if (!shops || shops.length === 0) {
      console.log('❌ Aucune boutique Jules trouvée');
      return;
    }

    console.log(`✅ ${shops.length} boutique(s) Jules trouvée(s):\n`);
    
    shops.forEach((shop, index) => {
      console.log(`${index + 1}. ${shop.name}`);
      console.log(`   - ID: ${shop.id}`);
      console.log(`   - Slug: ${shop.slug}`);
      console.log(`   - Statut: ${shop.status}`);
      console.log(`   - Vérifié: ${shop.is_verified ? 'Oui' : 'Non'}`);
      console.log(`   - Créé: ${new Date(shop.created_at).toLocaleDateString()}`);
      console.log('');
    });

    // Vérifier le slug spécifique
    const targetSlug = 'jules-boutique-mksbfsb8';
    const targetShop = shops.find(s => s.slug === targetSlug);
    
    if (targetShop) {
      console.log(`🎯 Boutique avec slug "${targetSlug}" trouvée:`);
      console.log(`   - Nom: ${targetShop.name}`);
      console.log(`   - Statut: ${targetShop.status}`);
      console.log(`   - Vérifié: ${targetShop.is_verified ? 'Oui' : 'Non'}`);
    } else {
      console.log(`❌ Aucune boutique trouvée avec le slug "${targetSlug}"`);
      console.log('Slugs disponibles:');
      shops.forEach(shop => console.log(`   - ${shop.slug}`));
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

checkBoutiqueStatus();