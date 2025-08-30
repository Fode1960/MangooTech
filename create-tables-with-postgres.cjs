const { Client } = require('pg');
require('dotenv').config();

// Configuration PostgreSQL pour Supabase
const dbConfig = {
  host: 'db.ptrqhtwstldphjaraufi.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: process.env.DB_PASSWORD,
  ssl: {
    rejectUnauthorized: false
  }
};

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

async function createTablesWithPostgres() {
  console.log('\n🔧 === CRÉATION DES TABLES VIA POSTGRESQL ===\n');

  if (!process.env.DB_PASSWORD) {
    console.error('❌ Mot de passe de base de données manquant dans .env');
    console.log('💡 Ajoutez: DB_PASSWORD=votre_mot_de_passe');
    process.exit(1);
  }

  const client = new Client(dbConfig);

  try {
    console.log('🔍 1. Connexion à PostgreSQL...');
    await client.connect();
    console.log('✅ Connexion réussie');

    console.log('\n📊 2. Vérification des tables existantes...');
    
    // Vérifier les tables existantes
    const checkTablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('user_credits', 'cancellation_feedback');
    `;
    
    const existingTablesResult = await client.query(checkTablesQuery);
    const existingTables = existingTablesResult.rows.map(row => row.table_name);
    
    console.log('   Tables existantes:', existingTables.length > 0 ? existingTables.join(', ') : 'Aucune');
    
    const missingTables = ['user_credits', 'cancellation_feedback'].filter(
      table => !existingTables.includes(table)
    );
    
    if (missingTables.length === 0) {
      console.log('\n🎉 Toutes les tables existent déjà!');
      return { success: true, message: 'Aucune action nécessaire' };
    }

    console.log(`\n🔨 3. Création des tables manquantes: ${missingTables.join(', ')}...`);
    
    // Exécuter le SQL de création
    await client.query(createTablesSQL);
    console.log('✅ Tables créées avec succès');

    console.log('\n🔐 4. Vérification des politiques RLS...');
    
    // Vérifier que les tables sont maintenant présentes
    const finalCheckResult = await client.query(checkTablesQuery);
    const finalTables = finalCheckResult.rows.map(row => row.table_name);
    
    console.log('   Tables finales:', finalTables.join(', '));
    
    // Vérifier les politiques RLS
    const rlsQuery = `
      SELECT schemaname, tablename, policyname 
      FROM pg_policies 
      WHERE tablename IN ('user_credits', 'cancellation_feedback')
      ORDER BY tablename, policyname;
    `;
    
    const rlsResult = await client.query(rlsQuery);
    console.log(`   Politiques RLS créées: ${rlsResult.rows.length}`);
    
    rlsResult.rows.forEach(row => {
      console.log(`     - ${row.tablename}: ${row.policyname}`);
    });

    console.log('\n✅ === CRÉATION TERMINÉE ===\n');
    console.log('📊 RÉSUMÉ:');
    console.log(`   - Tables créées: ${missingTables.join(', ')}`);
    console.log(`   - Politiques RLS: ${rlsResult.rows.length} politiques`);
    console.log(`   - Index: 6 index créés`);
    
    console.log('\n🎯 PROCHAINES ÉTAPES:');
    console.log('1. Vérifier le déploiement: node verify-production-deployment.cjs');
    console.log('2. Tester les nouvelles fonctions');
    console.log('3. Mettre à jour le frontend selon GUIDE-MIGRATION-ABONNEMENTS.md');

    return { 
      success: true, 
      message: 'Tables créées avec succès',
      createdTables: missingTables,
      existingTables,
      rlsPolicies: rlsResult.rows.length
    };

  } catch (error) {
    console.error('\n💥 ERREUR:', error.message);
    
    if (error.code === '28P01') {
      console.log('\n🔐 ERREUR D\'AUTHENTIFICATION:');
      console.log('- Vérifiez le mot de passe dans .env');
      console.log('- Assurez-vous que l\'IP est autorisée dans Supabase');
    } else if (error.code === '3D000') {
      console.log('\n🗄️ ERREUR DE BASE DE DONNÉES:');
      console.log('- Vérifiez le nom de la base de données');
      console.log('- Utilisez "postgres" comme nom de base');
    } else {
      console.log('\n🔧 SOLUTIONS ALTERNATIVES:');
      console.log('1. Créer les tables manuellement dans le Dashboard Supabase');
      console.log('2. Utiliser l\'éditeur SQL du Dashboard');
      console.log('3. Vérifier la connectivité réseau');
    }
    
    return { 
      success: false, 
      error: error.message,
      code: error.code
    };
  } finally {
    await client.end();
    console.log('\n🔌 Connexion fermée');
  }
}

// Exécution du script
if (require.main === module) {
  createTablesWithPostgres()
    .then(result => {
      if (result.success) {
        console.log('\n🎉 Création réussie!');
        process.exit(0);
      } else {
        console.log('\n⚠️ Création échouée');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('💥 Erreur fatale:', error);
      process.exit(1);
    });
}

module.exports = {
  createTablesWithPostgres,
  createTablesSQL,
  dbConfig
};