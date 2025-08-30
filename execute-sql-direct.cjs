const { execSync } = require('child_process');
const fs = require('fs');
require('dotenv').config();

// SQL pour créer les tables
const sqlContent = `
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

function executeSQLDirect() {
  console.log('\n🔧 === EXÉCUTION DIRECTE DU SQL ===\n');

  try {
    // Créer un fichier SQL temporaire
    const tempSqlFile = './temp_create_tables.sql';
    fs.writeFileSync(tempSqlFile, sqlContent);
    console.log('✅ Fichier SQL temporaire créé');

    // Configuration de connexion
    const dbHost = 'db.ptrqhtwstldphjaraufi.supabase.co';
    const dbPort = '5432';
    const dbName = 'postgres';
    const dbUser = 'postgres';
    const dbPassword = process.env.DB_PASSWORD;

    if (!dbPassword) {
      throw new Error('Mot de passe de base de données manquant dans .env');
    }

    console.log('🔍 Tentative de connexion à PostgreSQL...');

    // Construire la commande psql
    const psqlCommand = `psql "postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}?sslmode=require" -f "${tempSqlFile}"`;
    
    console.log('📊 Exécution du SQL...');
    
    // Exécuter la commande
    const result = execSync(psqlCommand, { 
      encoding: 'utf8',
      stdio: 'pipe'
    });
    
    console.log('✅ SQL exécuté avec succès!');
    console.log('📋 Résultat:');
    console.log(result);

    // Nettoyer le fichier temporaire
    fs.unlinkSync(tempSqlFile);
    console.log('🧹 Fichier temporaire supprimé');

    console.log('\n🎉 === CRÉATION TERMINÉE ===\n');
    console.log('🎯 PROCHAINES ÉTAPES:');
    console.log('1. Vérifier: node verify-production-deployment.cjs');
    console.log('2. Tester: node test-subscription-system.cjs');

    return { success: true, output: result };

  } catch (error) {
    console.error('\n💥 ERREUR:', error.message);
    
    if (error.message.includes('psql')) {
      console.log('\n🔧 PSQL NON TROUVÉ:');
      console.log('- Installez PostgreSQL client');
      console.log('- Ou utilisez le Dashboard Supabase manuellement');
    }
    
    console.log('\n📋 SQL À EXÉCUTER MANUELLEMENT:');
    console.log('Allez sur: https://supabase.com/dashboard/project/ptrqhtwstldphjaraufi/sql');
    console.log('\nCopiez ce SQL:');
    console.log('```sql');
    console.log(sqlContent);
    console.log('```');
    
    return { success: false, error: error.message, sql: sqlContent };
  }
}

// Exécution
if (require.main === module) {
  const result = executeSQLDirect();
  process.exit(result.success ? 0 : 1);
}

module.exports = { executeSQLDirect, sqlContent };