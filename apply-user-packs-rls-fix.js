import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Configuration Supabase avec clé service (nécessaire pour les opérations admin)
const supabaseUrl = 'https://ptrqhtwstldphjaraufi.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0cnFodHdzdGxkcGhqYXJhdWZpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkzMjQ5MiwiZXhwIjoyMDcwNTA4NDkyfQ.YOUR_SERVICE_KEY_HERE';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyRLSFix() {
  try {
    console.log('=== Application des corrections RLS pour user_packs et user_services ===\n');
    
    // Lire le fichier SQL
    const sqlContent = readFileSync('fix-user-packs-rls.sql', 'utf8');
    
    // Diviser en commandes individuelles
    const commands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
    
    console.log(`Exécution de ${commands.length} commandes SQL...\n`);
    
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      console.log(`${i + 1}. Exécution: ${command.substring(0, 60)}...`);
      
      try {
        const { data, error } = await supabase.rpc('exec_sql', { sql: command });
        
        if (error) {
          console.error(`   Erreur: ${error.message}`);
        } else {
          console.log('   ✓ Succès');
        }
      } catch (cmdError) {
        console.error(`   Erreur d'exécution: ${cmdError.message}`);
      }
    }
    
    console.log('\n=== Vérification des politiques créées ===');
    
    // Vérifier les politiques créées
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('schemaname, tablename, policyname, cmd')
      .in('tablename', ['user_packs', 'user_services']);
    
    if (policiesError) {
      console.error('Erreur lors de la vérification des politiques:', policiesError.message);
    } else {
      console.log('Politiques trouvées:');
      policies.forEach(policy => {
        console.log(`  - ${policy.tablename}.${policy.policyname} (${policy.cmd})`);
      });
    }
    
  } catch (error) {
    console.error('Erreur lors de l\'application des corrections:', error);
  }
}

// Note: Ce script nécessite une clé de service Supabase pour fonctionner
console.log('Note: Ce script nécessite une clé de service Supabase.');
console.log('Pour l\'instant, nous allons essayer une approche alternative...\n');

// Approche alternative : utiliser les migrations Supabase
async function checkCurrentPolicies() {
  try {
    console.log('=== Vérification des politiques actuelles ===\n');
    
    // Tester l'accès aux tables
    const { data: userPacksTest, error: userPacksError } = await supabase
      .from('user_packs')
      .select('count')
      .limit(1);
    
    console.log('Test d\'accès à user_packs:');
    if (userPacksError) {
      console.log(`  Erreur: ${userPacksError.message}`);
    } else {
      console.log('  ✓ Accès réussi');
    }
    
    const { data: userServicesTest, error: userServicesError } = await supabase
      .from('user_services')
      .select('count')
      .limit(1);
    
    console.log('Test d\'accès à user_services:');
    if (userServicesError) {
      console.log(`  Erreur: ${userServicesError.message}`);
    } else {
      console.log('  ✓ Accès réussi');
    }
    
  } catch (error) {
    console.error('Erreur lors de la vérification:', error);
  }
}

// Exécuter la vérification
checkCurrentPolicies();