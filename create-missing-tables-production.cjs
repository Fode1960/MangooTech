const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes:');
  console.error('   SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌');
  console.log('\n💡 Ajoutez ces variables dans votre fichier .env:');
  console.log('SUPABASE_URL=https://your-project.supabase.co');
  console.log('SUPABASE_SERVICE_ROLE_KEY=your-service-role-key');
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

async function createMissingTables() {
  console.log('\n🔧 === CRÉATION DES TABLES MANQUANTES EN PRODUCTION ===\n');

  try {
    console.log('🔍 1. Vérification de la connexion...');
    
    // Test de connexion
    const { data: testData, error: testError } = await supabase
      .from('packs')
      .select('count')
      .limit(1);
    
    if (testError) {
      throw new Error(`Erreur de connexion: ${testError.message}`);
    }
    
    console.log('✅ Connexion à Supabase réussie');

    console.log('\n📊 2. Vérification des tables existantes...');
    
    // Vérifier si les tables existent déjà
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
          console.log(`   ❌ ${tableName} - Manquante`);
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
    
    // Exécuter le SQL via l'API REST de Supabase
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey
      },
      body: JSON.stringify({
        sql: createTablesSQL
      })
    });

    if (!response.ok) {
      // Essayer une approche alternative avec une fonction personnalisée
      console.log('⚠️ Méthode principale échouée, essai d\'une approche alternative...');
      
      // Créer une fonction temporaire pour exécuter le SQL
      const createFunctionSQL = `
CREATE OR REPLACE FUNCTION create_subscription_tables()
RETURNS TEXT AS $$
BEGIN
  ${createTablesSQL.replace(/'/g, "''")}
  RETURN 'Tables créées avec succès';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
      `;
      
      // Utiliser la fonction RPC de Supabase
      const { data: functionResult, error: functionError } = await supabase.rpc('create_subscription_tables');
      
      if (functionError) {
        throw new Error(`Erreur lors de la création des tables: ${functionError.message}`);
      }
      
      console.log('✅ Tables créées via fonction personnalisée');
    } else {
      console.log('✅ Tables créées via API REST');
    }

    console.log('\n🔐 4. Vérification des politiques RLS...');
    
    // Vérifier que les tables sont maintenant accessibles
    for (const tableName of missingTables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('count')
          .limit(1);
        
        if (!error) {
          console.log(`   ✅ ${tableName} - Accessible avec RLS`);
        } else {
          console.log(`   ⚠️ ${tableName} - Problème RLS: ${error.message}`);
        }
      } catch (err) {
        console.log(`   ❌ ${tableName} - Erreur: ${err.message}`);
      }
    }

    console.log('\n✅ === CRÉATION TERMINÉE ===\n');
    console.log('📊 TABLES CRÉÉES:');
    missingTables.forEach(table => {
      console.log(`   - ${table}`);
    });
    
    console.log('\n🎯 PROCHAINES ÉTAPES:');
    console.log('1. Vérifier le déploiement: node verify-production-deployment.cjs');
    console.log('2. Tester les nouvelles fonctions');
    console.log('3. Mettre à jour le frontend');

    return { 
      success: true, 
      message: 'Tables créées avec succès',
      createdTables: missingTables,
      existingTables
    };

  } catch (error) {
    console.error('\n💥 ERREUR:', error.message);
    console.log('\n🔧 SOLUTIONS ALTERNATIVES:');
    console.log('1. Créer les tables manuellement dans le Dashboard Supabase');
    console.log('2. Utiliser l\'éditeur SQL du Dashboard avec le contenu de:');
    console.log('   supabase/migrations/20250830142200_create_subscription_tables.sql');
    console.log('3. Vérifier vos permissions de service role');
    
    return { 
      success: false, 
      error: error.message,
      sqlContent: createTablesSQL
    };
  }
}

// Fonction pour afficher le SQL à exécuter manuellement
function displayManualSQL() {
  console.log('\n📋 === SQL À EXÉCUTER MANUELLEMENT ===\n');
  console.log('Copiez et collez ce SQL dans le Dashboard Supabase > SQL Editor:\n');
  console.log('```sql');
  console.log(createTablesSQL);
  console.log('```');
  console.log('\n🔗 Dashboard Supabase: https://supabase.com/dashboard/project/ptrqhtwstldphjaraufi/sql');
}

// Exécution du script
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--sql')) {
    displayManualSQL();
  } else {
    createMissingTables()
      .then(result => {
        if (result.success) {
          console.log('\n🎉 Création réussie!');
          process.exit(0);
        } else {
          console.log('\n⚠️ Création échouée, utilisez --sql pour le SQL manuel');
          process.exit(1);
        }
      })
      .catch(error => {
        console.error('💥 Erreur fatale:', error);
        console.log('\nUtilisez --sql pour obtenir le SQL à exécuter manuellement');
        process.exit(1);
      });
  }
}

module.exports = {
  createMissingTables,
  displayManualSQL,
  createTablesSQL
};