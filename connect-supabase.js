#!/usr/bin/env node

/**
 * Script de connexion directe à Supabase (sans Docker)
 * Utilise uniquement l'API REST de Supabase
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

class SupabaseConnector {
  constructor() {
    this.validateEnvironment();
    this.adminClient = createClient(supabaseUrl, supabaseServiceKey);
    this.publicClient = createClient(supabaseUrl, supabaseAnonKey);
  }

  validateEnvironment() {
    if (!supabaseUrl) {
      throw new Error('❌ SUPABASE_URL manquant dans le fichier .env');
    }
    if (!supabaseServiceKey) {
      throw new Error('❌ SUPABASE_SERVICE_ROLE_KEY manquant dans le fichier .env');
    }
    if (!supabaseAnonKey) {
      throw new Error('❌ SUPABASE_ANON_KEY manquant dans le fichier .env');
    }
  }

  async testConnection() {
    console.log('🔄 Test de connexion à Supabase...');
    console.log(`📍 URL: ${supabaseUrl}`);
    console.log(`🔑 Projet ID: ${this.getProjectId()}`);
    
    try {
      // Test avec le client admin
      const { data, error } = await this.adminClient
        .from('users')
        .select('id', { count: 'exact', head: true });
      
      if (error) {
        console.error('❌ Erreur de connexion admin:', error.message);
        return false;
      }
      
      console.log('✅ Connexion admin réussie!');
      
      // Test des tables principales
      await this.testTables();
      
      return true;
    } catch (err) {
      console.error('❌ Erreur lors du test de connexion:', err.message);
      return false;
    }
  }

  async testTables() {
    console.log('\n🔍 Vérification des tables principales...');
    
    const tables = [
      { name: 'users', description: 'Table des utilisateurs' },
      { name: 'packs', description: 'Table des packs de services' },
      { name: 'user_packs', description: 'Table des packs utilisateur' },
      { name: 'services', description: 'Table des services' },
      { name: 'user_services', description: 'Table des services utilisateur' }
    ];
    
    const results = [];
    
    for (const table of tables) {
      try {
        const { count, error } = await this.adminClient
          .from(table.name)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          console.log(`❌ ${table.name}: ${error.message}`);
          results.push({ table: table.name, status: 'error', message: error.message });
        } else {
          console.log(`✅ ${table.name}: ${count || 0} enregistrements`);
          results.push({ table: table.name, status: 'success', count: count || 0 });
        }
      } catch (err) {
        console.log(`❌ ${table.name}: ${err.message}`);
        results.push({ table: table.name, status: 'error', message: err.message });
      }
    }
    
    return results;
  }

  async testRLSPolicies() {
    console.log('\n🔒 Test des politiques RLS...');
    
    try {
      // Test avec le client public (sans privilèges admin)
      const { data, error } = await this.publicClient
        .from('user_packs')
        .select('*')
        .limit(1);
      
      if (error) {
        console.log('🔒 RLS activé - accès restreint (normal)');
      } else {
        console.log('⚠️  RLS pourrait ne pas être correctement configuré');
      }
    } catch (err) {
      console.log('🔒 RLS semble être configuré correctement');
    }
  }

  async getUserPacks(userId = null) {
    if (!userId) {
      console.log('\n📦 Récupération de tous les packs utilisateur...');
      const { data, error } = await this.adminClient
        .from('user_packs')
        .select(`
          *,
          users(email),
          packs(name, description)
        `);
      
      if (error) {
        console.error('❌ Erreur:', error.message);
        return null;
      }
      
      console.log(`📊 ${data.length} packs utilisateur trouvés`);
      return data;
    }
  }

  getProjectId() {
    const match = supabaseUrl.match(/https:\/\/([^.]+)/);
    return match ? match[1] : 'N/A';
  }

  showConnectionInfo() {
    console.log('\n📋 Informations de connexion:');
    console.log(`   URL: ${supabaseUrl}`);
    console.log(`   Projet ID: ${this.getProjectId()}`);
    console.log(`   Clé Service: ${supabaseServiceKey ? '✅ Configurée' : '❌ Manquante'}`);
    console.log(`   Clé Anon: ${supabaseAnonKey ? '✅ Configurée' : '❌ Manquante'}`);
  }

  // Méthodes utilitaires pour les scripts
  getAdminClient() {
    return this.adminClient;
  }

  getPublicClient() {
    return this.publicClient;
  }
}

// Fonction principale
async function main() {
  console.log('🚀 Connexion automatique à Supabase\n');
  
  try {
    const connector = new SupabaseConnector();
    
    connector.showConnectionInfo();
    
    const connected = await connector.testConnection();
    
    if (connected) {
      await connector.testRLSPolicies();
      await connector.getUserPacks();
      
      console.log('\n🎉 Connexion automatique à Supabase configurée avec succès!');
      console.log('\n💡 Commandes disponibles:');
      console.log('   - node connect-supabase.js (tester la connexion)');
      console.log('   - Utiliser SupabaseConnector dans vos scripts');
      
      // Exporter l\'instance pour utilisation dans d\'autres modules
      global.supabaseConnector = connector;
      
    } else {
      console.log('\n❌ Échec de la connexion à Supabase');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

// Exporter la classe et les instances
export { SupabaseConnector };
export const connector = new SupabaseConnector();

// Exécuter si appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}