const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  console.error('URL:', supabaseUrl ? '✅' : '❌');
  console.error('Service Key:', supabaseServiceKey ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// SQL divisé en commandes individuelles
const sqlCommands = [
  // Création de la table user_credits
  `CREATE TABLE IF NOT EXISTS user_credits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    type VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    used_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'
  )`,
  
  // Index pour user_credits
  `CREATE INDEX IF NOT EXISTS idx_user_credits_user_id ON user_credits(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_user_credits_type ON user_credits(type)`,
  `CREATE INDEX IF NOT EXISTS idx_user_credits_expires_at ON user_credits(expires_at)`,
  
  // Création de la table cancellation_feedback
  `CREATE TABLE IF NOT EXISTS cancellation_feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    pack_id UUID REFERENCES packs(id),
    reason VARCHAR(100),
    feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
  )`,
  
  // Index pour cancellation_feedback
  `CREATE INDEX IF NOT EXISTS idx_cancellation_feedback_user_id ON cancellation_feedback(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_cancellation_feedback_pack_id ON cancellation_feedback(pack_id)`,
  `CREATE INDEX IF NOT EXISTS idx_cancellation_feedback_reason ON cancellation_feedback(reason)`,
  
  // Activation RLS
  `ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE cancellation_feedback ENABLE ROW LEVEL SECURITY`
];

// Politiques RLS (séparées car plus complexes)
const rlsPolicies = [
  // Politiques user_credits
  `DROP POLICY IF EXISTS "Users can view their own credits" ON user_credits`,
  `CREATE POLICY "Users can view their own credits" ON user_credits FOR SELECT USING (auth.uid() = user_id)`,
  `DROP POLICY IF EXISTS "Service can manage credits" ON user_credits`,
  `CREATE POLICY "Service can manage credits" ON user_credits FOR ALL USING (true)`,
  
  // Politiques cancellation_feedback
  `DROP POLICY IF EXISTS "Users can insert their own feedback" ON cancellation_feedback`,
  `CREATE POLICY "Users can insert their own feedback" ON cancellation_feedback FOR INSERT WITH CHECK (auth.uid() = user_id)`,
  `DROP POLICY IF EXISTS "Users can view their own feedback" ON cancellation_feedback`,
  `CREATE POLICY "Users can view their own feedback" ON cancellation_feedback FOR SELECT USING (auth.uid() = user_id)`,
  `DROP POLICY IF EXISTS "Service can manage feedback" ON cancellation_feedback`,
  `CREATE POLICY "Service can manage feedback" ON cancellation_feedback FOR ALL USING (true)`
];

async function executeSQL() {
  console.log('\n🔧 === EXÉCUTION SQL VIA API SUPABASE ===\n');
  
  let successCount = 0;
  let errorCount = 0;
  const errors = [];
  
  try {
    console.log('📊 Exécution des commandes de création de tables...');
    
    // Exécuter les commandes de base
    for (let i = 0; i < sqlCommands.length; i++) {
      const sql = sqlCommands[i];
      console.log(`\n${i + 1}/${sqlCommands.length} Exécution: ${sql.substring(0, 50)}...`);
      
      try {
        const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
        
        if (error) {
          // Essayer avec une approche différente
          const { error: directError } = await supabase
            .from('_supabase_migrations')
            .select('*')
            .limit(0); // Juste pour tester la connexion
            
          if (directError) {
            throw new Error(`Erreur API: ${error.message}`);
          }
          
          // Si la fonction exec_sql n'existe pas, on continue
          console.log(`⚠️  Fonction exec_sql non disponible, commande ignorée`);
        } else {
          console.log('✅ Succès');
          successCount++;
        }
      } catch (err) {
        console.log(`❌ Erreur: ${err.message}`);
        errors.push({ sql: sql.substring(0, 100), error: err.message });
        errorCount++;
      }
    }
    
    console.log('\n🔐 Exécution des politiques RLS...');
    
    // Exécuter les politiques RLS
    for (let i = 0; i < rlsPolicies.length; i++) {
      const sql = rlsPolicies[i];
      console.log(`\n${i + 1}/${rlsPolicies.length} Politique: ${sql.substring(0, 50)}...`);
      
      try {
        const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
        
        if (error) {
          console.log(`⚠️  Politique ignorée: ${error.message}`);
        } else {
          console.log('✅ Succès');
          successCount++;
        }
      } catch (err) {
        console.log(`❌ Erreur: ${err.message}`);
        errors.push({ sql: sql.substring(0, 100), error: err.message });
        errorCount++;
      }
    }
    
    console.log('\n📊 === RÉSULTATS ===');
    console.log(`✅ Succès: ${successCount}`);
    console.log(`❌ Erreurs: ${errorCount}`);
    
    if (errors.length > 0) {
      console.log('\n🔍 Détails des erreurs:');
      errors.forEach((err, i) => {
        console.log(`${i + 1}. ${err.sql}... -> ${err.error}`);
      });
    }
    
    // Vérification finale
    console.log('\n🔍 Vérification des tables créées...');
    
    try {
      const { data: userCredits, error: ucError } = await supabase
        .from('user_credits')
        .select('*')
        .limit(0);
        
      const { data: feedback, error: fbError } = await supabase
        .from('cancellation_feedback')
        .select('*')
        .limit(0);
        
      if (!ucError) {
        console.log('✅ Table user_credits accessible');
      } else {
        console.log('❌ Table user_credits non accessible:', ucError.message);
      }
      
      if (!fbError) {
        console.log('✅ Table cancellation_feedback accessible');
      } else {
        console.log('❌ Table cancellation_feedback non accessible:', fbError.message);
      }
      
    } catch (verifyError) {
      console.log('⚠️  Erreur de vérification:', verifyError.message);
    }
    
    console.log('\n🎯 PROCHAINES ÉTAPES:');
    console.log('1. Vérifier: node verify-production-deployment.cjs');
    console.log('2. Si échec, utiliser le Dashboard Supabase manuellement');
    
    return { success: errorCount === 0, successCount, errorCount, errors };
    
  } catch (error) {
    console.error('\n💥 ERREUR GÉNÉRALE:', error.message);
    
    console.log('\n📋 SOLUTION MANUELLE:');
    console.log('Allez sur: https://supabase.com/dashboard/project/ptrqhtwstldphjaraufi/sql');
    console.log('\nExécutez ces commandes une par une:');
    
    [...sqlCommands, ...rlsPolicies].forEach((sql, i) => {
      console.log(`\n-- Commande ${i + 1}`);
      console.log(sql + ';');
    });
    
    return { success: false, error: error.message };
  }
}

// Exécution
if (require.main === module) {
  executeSQL().then(result => {
    process.exit(result.success ? 0 : 1);
  });
}

module.exports = { executeSQL };