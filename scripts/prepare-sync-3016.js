import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

// Charger les variables d'environnement
dotenv.config();

console.log('🔄 Script de synchronisation des boutiques vers le port 3016\n');

// Configuration Supabase
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Fonction pour récupérer toutes les boutiques avec leurs paramètres d'authentification
async function getAllBoutiquesWithAuth() {
  try {
    console.log('📡 Récupération des boutiques depuis la base de données...');
    
    const { data: shops, error } = await supabase
      .from('shops')
      .select(`
        *,
        shop_auth (
          vendor_login,
          vendor_password,
          shop_url,
          is_active,
          created_at
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Erreur:', error);
      return [];
    }

    console.log(`✅ ${shops.length} boutiques trouvées`);
    return shops || [];
  } catch (error) {
    console.error('❌ Erreur:', error);
    return [];
  }
}

// Fonction pour créer une boutique via l'API du port 3016
async function createBoutiqueOnPort3016(boutique) {
  try {
    const authData = boutique.shop_auth?.[0];
    
    const boutiqueData = {
      id: boutique.id,
      name: boutique.name,
      slug: boutique.slug,
      description: boutique.description,
      address: boutique.address,
      contact_phone: boutique.contact_phone,
      contact_email: boutique.contact_email,
      website_url: boutique.website_url,
      logo_url: boutique.logo_url,
      banner_url: boutique.banner_url,
      category: boutique.category,
      status: boutique.status,
      is_verified: boutique.is_verified,
      created_at: boutique.created_at,
      updated_at: boutique.updated_at,
      // Ajouter les paramètres d'authentification
      auth: authData ? {
        vendor_login: authData.vendor_login,
        vendor_password: authData.vendor_password,
        shop_url: authData.shop_url,
        is_active: authData.is_active
      } : null
    };

    // Ici, nous pourrions appeler une API pour créer la boutique
    // Pour l'instant, nous allons simplement logger les données
    console.log(`📋 Boutique prête pour synchro: ${boutique.name}`);
    console.log(`   - Login: ${authData?.vendor_login || 'N/A'}`);
    console.log(`   - URL: ${authData?.shop_url || 'N/A'}`);
    
    return true;
  } catch (error) {
    console.error(`❌ Erreur création boutique ${boutique.name}:`, error.message);
    return false;
  }
}

// Fonction principale
async function main() {
  try {
    // Récupérer toutes les boutiques
    const boutiques = await getAllBoutiquesWithAuth();
    
    if (boutiques.length === 0) {
      console.log('❌ Aucune boutique trouvée');
      return;
    }

    console.log(`\n🔄 Préparation de la synchronisation de ${boutiques.length} boutiques...\n`);

    // Préparer chaque boutique pour la synchronisation
    let successCount = 0;
    for (const boutique of boutiques) {
      const success = await createBoutiqueOnPort3016(boutique);
      if (success) successCount++;
      
      // Petite pause entre chaque boutique
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`\n✅ Synchronisation terminée: ${successCount}/${boutiques.length} boutiques prêtes`);

    // Afficher un résumé des boutiques
    console.log('\n📊 Résumé des boutiques:');
    boutiques.forEach((boutique, index) => {
      const auth = boutique.shop_auth?.[0];
      console.log(`${index + 1}. ${boutique.name}`);
      console.log(`   - Statut: ${boutique.status}`);
      console.log(`   - Auth: ${auth ? '✅' : '❌'}`);
      if (auth) {
        console.log(`   - Login: ${auth.vendor_login}`);
        console.log(`   - URL: ${auth.shop_url}`);
      }
      console.log('');
    });

    // Afficher les URLs d'accès
    console.log('\n🔗 URLs d\'accès aux boutiques:');
    boutiques.forEach((boutique) => {
      const auth = boutique.shop_auth?.[0];
      if (auth) {
        console.log(`${boutique.name}: http://localhost:3016/shop/${boutique.slug}`);
      }
    });

  } catch (error) {
    console.error('❌ Erreur principale:', error);
  }
}

// Exécution
main().catch(console.error);