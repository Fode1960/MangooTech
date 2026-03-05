import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

// Charger les variables d'environnement
dotenv.config();

console.log('🚀 Script de synchronisation des boutiques\n');

// Configuration Supabase
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Variables d\'environnement manquantes:');
  console.error('- SUPABASE_URL:', SUPABASE_URL ? '✅' : '❌');
  console.error('- SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_ROLE_KEY ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Fonction pour récupérer toutes les boutiques
async function getAllBoutiques() {
  try {
    console.log('📡 Récupération des boutiques depuis la base de données...');
    
    const { data: shops, error } = await supabase
      .from('shops')
      .select(`
        *,
        shop_auth (
          vendor_login,
          vendor_password,
          shop_url
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

// Fonction principale
async function main() {
  try {
    const boutiques = await getAllBoutiques();
    
    console.log('\n📋 Liste des boutiques:');
    boutiques.forEach((boutique, index) => {
      const hasAuth = boutique.shop_auth && boutique.shop_auth.length > 0;
      console.log(`${index + 1}. ${boutique.name} (ID: ${boutique.id})`);
      console.log(`   - Statut: ${boutique.status}`);
      console.log(`   - Auth: ${hasAuth ? '✅' : '❌'}`);
      if (hasAuth) {
        console.log(`   - Login: ${boutique.shop_auth[0].vendor_login}`);
      }
      console.log('');
    });

    // Vérifier la connectivité
    console.log('🌐 Test de connectivité:');
    try {
      const response3015 = await axios.get('http://localhost:3015/api/health', { timeout: 5000 });
      console.log('✅ Port 3015: Actif');
    } catch (error) {
      console.log('❌ Port 3015: Inactif');
    }

    try {
      const response3016 = await axios.get('http://localhost:3016/api/health', { timeout: 5000 });
      console.log('✅ Port 3016: Actif');
    } catch (error) {
      console.log('❌ Port 3016: Inactif');
    }

  } catch (error) {
    console.error('❌ Erreur principale:', error);
  }
}

// Exécution
main().catch(console.error);