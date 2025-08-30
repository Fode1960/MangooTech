#!/usr/bin/env node

/**
 * Script de connexion automatique à Supabase
 * Ce script configure et teste la connexion à Supabase automatiquement
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  console.error('❌ SUPABASE_URL manquant dans le fichier .env');
  process.exit(1);
}

if (!supabaseServiceKey && !supabaseAnonKey) {
  console.error('❌ Aucune clé Supabase trouvée dans le fichier .env');
  process.exit(1);
}

// Créer les clients Supabase
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey);
const supabaseClient = createClient(supabaseUrl, supabaseAnonKey || supabaseServiceKey);

async function testConnection() {
  console.log('🔄 Test de connexion à Supabase...');
  console.log(`📍 URL: ${supabaseUrl}`);
  
  try {
    // Test de connexion basique
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('count', { count: 'exact', head: true });
    
    if (error) {
      console.error('❌ Erreur de connexion:', error.message);
      return false;
    }
    
    console.log('✅ Connexion à Supabase réussie!');
    console.log(`📊 Nombre d'utilisateurs: ${data?.length || 0}`);
    
    // Test des tables principales
    await testTables();
    
    return true;
  } catch (err) {
    console.error('❌ Erreur lors du test de connexion:', err.message);
    return false;
  }
}

async function testTables() {
  console.log('\n🔍 Vérification des tables principales...');
  
  const tables = ['users', 'packs', 'user_packs', 'services'];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabaseAdmin
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`❌ Table '${table}': ${error.message}`);
      } else {
        console.log(`✅ Table '${table}': accessible`);
      }
    } catch (err) {
      console.log(`❌ Table '${table}': ${err.message}`);
    }
  }
}

async function showProjectInfo() {
  console.log('\n📋 Informations du projet:');
  console.log(`   URL: ${supabaseUrl}`);
  console.log(`   Projet ID: ${supabaseUrl.match(/https:\/\/([^.]+)/)?.[1] || 'N/A'}`);
  console.log(`   Clé Service: ${supabaseServiceKey ? '✅ Configurée' : '❌ Manquante'}`);
  console.log(`   Clé Anon: ${supabaseAnonKey ? '✅ Configurée' : '❌ Manquante'}`);
}

// Fonction principale
async function main() {
  console.log('🚀 Script de connexion automatique Supabase\n');
  
  showProjectInfo();
  
  const connected = await testConnection();
  
  if (connected) {
    console.log('\n🎉 Connexion automatique à Supabase configurée avec succès!');
    console.log('\n💡 Vous pouvez maintenant utiliser:');
    console.log('   - npx supabase status (statut du projet)');
    console.log('   - npx supabase db pull (synchroniser le schéma)');
    console.log('   - npx supabase db push (pousser les migrations)');
    console.log('   - node supabase-connect.js (tester la connexion)');
  } else {
    console.log('\n❌ Échec de la configuration de la connexion automatique');
    process.exit(1);
  }
}

// Exporter les clients pour utilisation dans d'autres scripts
export { supabaseAdmin, supabaseClient };

// Exécuter si appelé directement
if (process.argv[1] && process.argv[1].endsWith('supabase-connect.js')) {
  main().catch(console.error);
}