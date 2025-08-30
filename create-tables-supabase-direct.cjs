const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuration Supabase avec service role
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes:');
  console.error('   SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// SQL pour créer les tables manquantes
const createTablesSQL = `
-- Table user_credits pour gérer les crédits utilisateur
CREATE TABLE IF NOT EXISTS user_credits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  type VARCHAR(50) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  used_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_user_credits_user_id ON user_credits(user_id);
CREATE INDEX IF NOT EXISTS idx_user_credits_type ON user_credits(type);
CREATE INDEX IF NOT EXISTS idx_user_credits_expires_at ON user_credits(expires_at);

-- Table cancellation_feedback pour les retours d'annulation
CREATE TABLE IF NOT EXISTS cancellation_feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  pack_id UUID REFERENCES packs(id),
  reason VARCHAR(100),
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_cancellation_feedback_user_id ON cancellation_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_cancellation_feedback_pack_id ON cancellation_feedback(pack_id);
CREATE INDEX IF NOT EXISTS idx_cancellation_feedback_reason ON cancellation_feedback(reason);

-- Politiques RLS
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE cancellation_feedback ENABLE ROW LEVEL SECURITY;

-- Politiques pour user_credits
DROP POLICY IF EXISTS "Users can view their own credits" ON user_credits;
CREATE POLICY "Users can view their own credits" ON user_credits
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service can manage credits" ON user_credits;
CREATE POLICY "Service can manage credits" ON user_credits
  FOR ALL USING (true);

-- Politiques pour cancellation_feedback
DROP POLICY IF EXISTS "Users can insert their own feedback" ON cancellation_feedback;
CREATE POLICY "Users can insert their own feedback" ON cancellation_feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own feedback" ON cancellation_feedback;
CREATE POLICY "Users can view their own feedback" ON cancellation_feedback
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service can manage feedback" ON cancellation_feedback;
CREATE POLICY "Service can manage feedback" ON cancellation_feedback
  FOR ALL USING (true);
`;

async function createTablesDirectly() {
  console.log('\n🔧 === CRÉATION DES TABLES VIA SUPABASE CLIENT ===\n');

  try {
    console.log('🔍 1. Test de connexion Supabase...');
    
    // Test de connexion basique
    const { data: testData, error: testError } = await supabase
      .from('packs')
      .select('count')
      .limit(1);
    
    if (testError) {
      throw new Error(`Erreur de connexion: ${testError.message}`);
    }
    
    console.log('✅ Connexion Supabase réussie');

    console.log('\n📊 2. Vérification des tables existantes...');
    
    // Vérifier si les tables existent
    const tablesToCheck = ['user_credits', 'cancellation_feedback'];
    const existingTables = [];
    const missingTables = [];
    
    for (const tableName of tablesToCheck) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('count')
          .limit(1);
        
        if (!error) {
          console.log(`   ✅ ${tableName} - Existe déjà`);
          existingTables.push(tableName);
        } else {
          console.log(`   ❌ ${tableName} - Manquante (${error.message})`);
          missingTables.push(tableName);
        }
      } catch (err) {
        console.log(`   ❌ ${tableName} - Manquante`);
        missingTables.push(tableName);
      }
    }

    if (missingTables.length === 0) {
      console.log('\n🎉 Toutes les tables existent déjà!');
      return { success: true, message: 'Aucune action nécessaire' };
    }

    console.log(`\n🔨 3. Création des tables manquantes: ${missingTables.join(', ')}...`);
    
    // Diviser le SQL en commandes individuelles pour éviter les erreurs
    const sqlCommands = createTablesSQL
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
    
    console.log(`   Exécution de ${sqlCommands.length} commandes SQL...`);
    
    // Exécuter chaque commande individuellement
    for (let i = 0; i < sqlCommands.length; i++) {
      const command = sqlCommands[i];
      if (command.length > 10) { // Ignorer les commandes trop courtes
        try {
          const { data, error } = await supabase.rpc('exec_sql', {
            sql: command + ';'
          });
          
          if (error) {
            console.log(`   ⚠️ Commande ${i + 1}: ${error.message}`);
          } else {
            console.log(`   ✅ Commande ${i + 1} exécutée`);
          }
        } catch (err) {
          console.log(`   ⚠️ Commande ${i + 1}: ${err.message}`);
        }
      }
    }

    console.log('\n🔐 4. Vérification finale...');
    
    // Vérifier que les tables sont maintenant accessibles
    const finalCheck = [];
    for (const tableName of missingTables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('count')
          .limit(1);
        
        if (!error) {
          console.log(`   ✅ ${tableName} - Créée et accessible`);
          finalCheck.push(tableName);
        } else {
          console.log(`   ❌ ${tableName} - Toujours inaccessible: ${error.message}`);
        }
      } catch (err) {
        console.log(`   ❌ ${tableName} - Erreur: ${err.message}`);
      }
    }

    console.log('\n✅ === CRÉATION TERMINÉE ===\n');
    console.log('📊 RÉSUMÉ:');
    console.log(`   - Tables créées: ${finalCheck.join(', ')}`);
    console.log(`   - Tables existantes: ${existingTables.join(', ')}`);
    
    if (finalCheck.length < missingTables.length) {
      console.log('\n⚠️ ATTENTION: Certaines tables n\'ont pas pu être créées');
      console.log('💡 SOLUTION MANUELLE:');
      console.log('1. Allez sur: https://supabase.com/dashboard/project/ptrqhtwstldphjaraufi/sql');
      console.log('2. Copiez le SQL ci-dessous:');
      console.log('\n```sql');
      console.log(createTablesSQL);
      console.log('```\n');
    } else {
      console.log('\n🎯 PROCHAINES ÉTAPES:');
      console.log('1. Vérifier le déploiement: node verify-production-deployment.cjs');
      console.log('2. Tester les nouvelles fonctions');
      console.log('3. Mettre à jour le frontend');
    }

    return { 
      success: finalCheck.length === missingTables.length, 
      message: finalCheck.length === missingTables.length ? 'Tables créées avec succès' : 'Création partielle',
      createdTables: finalCheck,
      existingTables,
      failedTables: missingTables.filter(t => !finalCheck.includes(t))
    };

  } catch (error) {
    console.error('\n💥 ERREUR:', error.message);
    console.log('\n🔧 SOLUTION MANUELLE:');
    console.log('1. Allez sur: https://supabase.com/dashboard/project/ptrqhtwstldphjaraufi/sql');
    console.log('2. Exécutez le SQL suivant:');
    console.log('\n```sql');
    console.log(createTablesSQL);
    console.log('```\n');
    
    return { 
      success: false, 
      error: error.message,
      sqlContent: createTablesSQL
    };
  }
}

// Exécution du script
if (require.main === module) {
  createTablesDirectly()
    .then(result => {
      if (result.success) {
        console.log('\n🎉 Création réussie!');
        process.exit(0);
      } else {
        console.log('\n⚠️ Création échouée ou partielle');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('💥 Erreur fatale:', error);
      process.exit(1);
    });
}

module.exports = {
  createTablesDirectly,
  createTablesSQL
};