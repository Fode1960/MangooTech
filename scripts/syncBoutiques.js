import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Fonction pour récupérer les boutiques du port 3016 (test)
async function getBoutiquesFromPort3016() {
  try {
    console.log('📡 Récupération des boutiques du port 3016...');
    const response = await axios.get('http://localhost:3016/api/test/test-shops-permissions');
    
    if (response.data && response.data.insertedShop) {
      console.log('✅ Boutique de test trouvée sur le port 3016');
      return [response.data.insertedShop];
    }
    
    console.log('ℹ️ Aucune boutique trouvée sur le port 3016');
    return [];
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des boutiques du port 3016:', error.message);
    return [];
  }
}

// Fonction pour récupérer toutes les boutiques de la base de données
async function getAllBoutiquesFromDatabase() {
  try {
    console.log('📡 Récupération de toutes les boutiques depuis la base de données...');
    
    const { data: shops, error } = await supabase
      .from('shops')
      .select(`
        *,
        shop_auth (
          vendor_login,
          vendor_password,
          shop_url,
          qr_code_data
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Erreur lors de la récupération des boutiques:', error);
      return [];
    }

    console.log(`✅ ${shops.length} boutiques trouvées dans la base de données`);
    return shops || [];
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des boutiques:', error);
    return [];
  }
}

// Fonction pour synchroniser les boutiques
async function syncBoutiques() {
  try {
    console.log('🔄 Début de la synchronisation des boutiques...\n');

    // Récupérer les boutiques depuis différentes sources
    const boutiquesDB = await getAllBoutiquesFromDatabase();
    const boutiques3016 = await getBoutiquesFromPort3016();

    console.log('\n📊 Résumé:');
    console.log(`- Base de données: ${boutiquesDB.length} boutiques`);
    console.log(`- Port 3016: ${boutiques3016.length} boutiques`);

    // Vérifier si les boutiques du port 3016 sont dans la base de données principale
    if (boutiques3016.length > 0) {
      console.log('\n🔍 Vérification des boutiques du port 3016...');
      
      for (const boutique of boutiques3016) {
        const existsInDB = boutiquesDB.some(dbShop => dbShop.id === boutique.id);
        
        if (!existsInDB) {
          console.log(`⚠️ Boutique ${boutique.name} (ID: ${boutique.id}) absente de la base de données principale`);
          
          // Optionnel: Copier la boutique dans la base principale
          // Ici, nous pourrions ajouter la logique pour copier
        } else {
          console.log(`✅ Boutique ${boutique.name} synchronisée`);
        }
      }
    }

    // Afficher le statut de synchronisation
    console.log('\n📋 Statut de synchronisation:');
    boutiquesDB.forEach(boutique => {
      const hasAuth = boutique.shop_auth && boutique.shop_auth.length > 0;
      const authStatus = hasAuth ? '✅' : '❌';
      console.log(`${authStatus} ${boutique.name} (ID: ${boutique.id}) - Auth: ${hasAuth ? 'Oui' : 'Non'}`);
    });

    console.log('\n✅ Synchronisation terminée!');
    
    return {
      totalBoutiques: boutiquesDB.length,
      boutiquesWithAuth: boutiquesDB.filter(b => b.shop_auth && b.shop_auth.length > 0).length,
      boutiquesWithoutAuth: boutiquesDB.filter(b => !b.shop_auth || b.shop_auth.length === 0).length
    };

  } catch (error) {
    console.error('❌ Erreur lors de la synchronisation:', error);
    throw error;
  }
}

// Fonction pour vérifier la connectivité entre les ports
async function testConnectivity() {
  console.log('🌐 Test de connectivité...');
  
  try {
    // Test port 3015
    const response3015 = await axios.get('http://localhost:3015/api/health').catch(() => null);
    console.log(`Port 3015: ${response3015 ? '✅ Actif' : '❌ Inactif'}`);
    
    // Test port 3016
    const response3016 = await axios.get('http://localhost:3016/api/health').catch(() => null);
    console.log(`Port 3016: ${response3016 ? '✅ Actif' : '❌ Inactif'}`);
    
    return {
      port3015: !!response3015,
      port3016: !!response3016
    };
  } catch (error) {
    console.error('❌ Erreur lors du test de connectivité:', error.message);
    return { port3015: false, port3016: false };
  }
}

// Fonction principale
async function main() {
  console.log('🚀 Script de synchronisation des boutiques\n');
  
  try {
    // Test de connectivité
    const connectivity = await testConnectivity();
    
    if (!connectivity.port3015 && !connectivity.port3016) {
      console.log('❌ Aucun port accessible. Vérifiez que les serveurs sont démarrés.');
      return;
    }
    
    // Synchronisation
    const result = await syncBoutiques();
    
    console.log('\n📈 Résultat de la synchronisation:');
    console.log(`- Total boutiques: ${result.totalBoutiques}`);
    console.log(`- Boutiques avec auth: ${result.boutiquesWithAuth}`);
    console.log(`- Boutiques sans auth: ${result.boutiquesWithoutAuth}`);
    
  } catch (error) {
    console.error('❌ Erreur principale:', error);
  }
}

// Exécution si appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { syncBoutiques, testConnectivity, getAllBoutiquesFromDatabase };