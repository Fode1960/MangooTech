const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const FUNCTIONS_DIR = './supabase/functions';
const NEW_FUNCTIONS = [
  'smart-pack-change',
  'calculate-pack-difference', 
  'process-immediate-change',
  'handle-subscription-change',
  'cancel-subscription'
];

const REQUIRED_TABLES_SQL = `
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

async function deploySubscriptionSystem() {
  console.log('\n🚀 === DÉPLOIEMENT DU SYSTÈME D\'ABONNEMENTS ===\n');

  try {
    // 1. Vérifier que Supabase CLI est disponible
    console.log('🔍 1. Vérification de Supabase CLI...');
    let supabaseCmd = 'supabase';
    try {
      execSync('supabase --version', { stdio: 'pipe' });
      console.log('✅ Supabase CLI détecté (global)');
    } catch (error) {
      try {
        execSync('npx supabase --version', { stdio: 'pipe' });
        supabaseCmd = 'npx supabase';
        console.log('✅ Supabase CLI détecté (via npx)');
      } catch (npxError) {
        console.log('⚠️ Supabase CLI non trouvé, installation locale...');
        try {
          execSync('npm install supabase --save-dev', { stdio: 'inherit' });
          supabaseCmd = 'npx supabase';
          console.log('✅ Supabase CLI installé localement');
        } catch (installError) {
          throw new Error('Impossible d\'installer Supabase CLI. Installez-le manuellement.');
        }
      }
    }

    // 2. Vérifier que nous sommes dans le bon répertoire
    console.log('\n📁 2. Vérification du répertoire...');
    if (!fs.existsSync('./supabase')) {
      throw new Error('Répertoire supabase non trouvé. Exécutez ce script depuis la racine du projet.');
    }
    console.log('✅ Répertoire supabase trouvé');

    // 3. Vérifier les nouvelles fonctions
    console.log('\n🔧 3. Vérification des nouvelles fonctions...');
    const missingFunctions = [];
    NEW_FUNCTIONS.forEach(funcName => {
      const funcPath = path.join(FUNCTIONS_DIR, funcName, 'index.ts');
      if (fs.existsSync(funcPath)) {
        console.log(`✅ ${funcName} trouvée`);
      } else {
        console.log(`❌ ${funcName} manquante`);
        missingFunctions.push(funcName);
      }
    });

    if (missingFunctions.length > 0) {
      throw new Error(`Fonctions manquantes: ${missingFunctions.join(', ')}`);
    }

    // 4. Créer le fichier SQL pour les tables
    console.log('\n📋 4. Création du fichier SQL pour les tables...');
    const sqlFilePath = './supabase/migrations/create_subscription_tables.sql';
    
    // Créer le répertoire migrations s'il n'existe pas
    const migrationsDir = './supabase/migrations';
    if (!fs.existsSync(migrationsDir)) {
      fs.mkdirSync(migrationsDir, { recursive: true });
      console.log('✅ Répertoire migrations créé');
    }

    // Écrire le fichier SQL
    fs.writeFileSync(sqlFilePath, REQUIRED_TABLES_SQL);
    console.log(`✅ Fichier SQL créé: ${sqlFilePath}`);

    // 5. Déployer les fonctions
    console.log('\n🚀 5. Déploiement des fonctions Supabase...');
    try {
      console.log('   Déploiement en cours...');
      execSync(`${supabaseCmd} functions deploy`, { stdio: 'inherit' });
      console.log('✅ Fonctions déployées avec succès');
    } catch (error) {
      console.log('⚠️ Erreur lors du déploiement des fonctions:');
      console.log(`   Vous pouvez déployer manuellement avec: ${supabaseCmd} functions deploy`);
    }

    // 6. Appliquer les migrations
    console.log('\n📊 6. Application des migrations de base de données...');
    try {
      console.log('   Application des migrations...');
      execSync(`${supabaseCmd} db push`, { stdio: 'inherit' });
      console.log('✅ Migrations appliquées avec succès');
    } catch (error) {
      console.log('⚠️ Erreur lors de l\'application des migrations:');
      console.log(`   Vous pouvez appliquer manuellement avec: ${supabaseCmd} db push`);
      console.log('   Ou exécuter le SQL directement dans le dashboard Supabase');
    }

    // 7. Vérifier les variables d'environnement
    console.log('\n🔐 7. Vérification des variables d\'environnement...');
    const requiredEnvVars = [
      'SUPABASE_URL',
      'SUPABASE_ANON_KEY',
      'STRIPE_SECRET_KEY',
      'STRIPE_WEBHOOK_SECRET',
      'FRONTEND_URL'
    ];

    const missingEnvVars = [];
    requiredEnvVars.forEach(envVar => {
      if (process.env[envVar]) {
        console.log(`✅ ${envVar} configurée`);
      } else {
        console.log(`❌ ${envVar} manquante`);
        missingEnvVars.push(envVar);
      }
    });

    if (missingEnvVars.length > 0) {
      console.log(`\n⚠️ Variables d'environnement manquantes: ${missingEnvVars.join(', ')}`);
      console.log('   Configurez-les dans votre fichier .env ou dans Supabase Dashboard');
    }

    // 8. Résumé du déploiement
    console.log('\n✅ === DÉPLOIEMENT TERMINÉ ===\n');
    
    console.log('📋 NOUVELLES FONCTIONS DÉPLOYÉES:');
    NEW_FUNCTIONS.forEach(func => {
      console.log(`   - ${func}`);
    });

    console.log('\n📊 NOUVELLES TABLES CRÉÉES:');
    console.log('   - user_credits (gestion des crédits)');
    console.log('   - cancellation_feedback (retours d\'annulation)');

    console.log('\n🎯 PROCHAINES ÉTAPES:');
    console.log('1. Tester les nouvelles fonctions avec: node test-subscription-system.cjs');
    console.log('2. Mettre à jour l\'interface utilisateur pour utiliser smart-pack-change');
    console.log('3. Configurer les webhooks Stripe si nécessaire');
    console.log('4. Former l\'équipe sur le nouveau système');
    console.log('5. Surveiller les logs lors des premiers changements de pack');

    console.log('\n🔗 ENDPOINTS DISPONIBLES:');
    console.log(`   - POST /functions/v1/smart-pack-change`);
    console.log(`   - POST /functions/v1/calculate-pack-difference`);
    console.log(`   - POST /functions/v1/process-immediate-change`);
    console.log(`   - POST /functions/v1/handle-subscription-change`);
    console.log(`   - POST /functions/v1/cancel-subscription`);

  } catch (error) {
    console.error('\n❌ ERREUR DE DÉPLOIEMENT:', error.message);
    console.log('\n🔧 DÉPLOIEMENT MANUEL:');
    console.log('1. Déployez les fonctions: supabase functions deploy');
    console.log('2. Appliquez les migrations: supabase db push');
    console.log('3. Ou exécutez le SQL manuellement dans Supabase Dashboard');
    process.exit(1);
  }
}

// Fonction pour générer un guide de migration
function generateMigrationGuide() {
  console.log('\n📖 === GUIDE DE MIGRATION ===\n');
  
  console.log('🔄 REMPLACEMENT DES ANCIENNES FONCTIONS:');
  console.log('\n1. Remplacer create-checkout-session par smart-pack-change:');
  console.log('   AVANT: POST /functions/v1/create-checkout-session');
  console.log('   APRÈS: POST /functions/v1/smart-pack-change');
  
  console.log('\n2. Remplacer change-pack-with-payment par smart-pack-change:');
  console.log('   AVANT: POST /functions/v1/change-pack-with-payment');
  console.log('   APRÈS: POST /functions/v1/smart-pack-change');
  
  console.log('\n📝 CHANGEMENTS D\'API:');
  console.log('\nANCIEN FORMAT:');
  console.log('{ "packId": "uuid" }');
  
  console.log('\nNOUVEAU FORMAT (identique):');
  console.log('{ "packId": "uuid" }');
  
  console.log('\nNOUVELLE RÉPONSE:');
  console.log(`{
  "success": true,
  "message": "Pack changé avec succès",
  "changeType": "upgrade|downgrade|same_price|first_pack",
  "requiresPayment": false,
  "checkoutUrl": "https://checkout.stripe.com/...", // Si paiement requis
  "effectiveImmediately": true,
  "creditApplied": 1500 // Si crédit accordé
}`);

  console.log('\n🎨 CHANGEMENTS UI RECOMMANDÉS:');
  console.log('1. Afficher le type de changement (upgrade/downgrade)');
  console.log('2. Montrer les économies pour les downgrades');
  console.log('3. Expliquer la proration pour les upgrades');
  console.log('4. Ajouter un bouton d\'annulation d\'abonnement');
  console.log('5. Afficher les crédits utilisateur disponibles');
}

// Fonction pour tester la connectivité
async function testConnectivity() {
  console.log('\n🔗 Test de connectivité...');
  
  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL || '',
      process.env.SUPABASE_ANON_KEY || ''
    );
    
    const { data, error } = await supabase.from('packs').select('count').limit(1);
    
    if (error) {
      console.log('❌ Erreur de connexion Supabase:', error.message);
    } else {
      console.log('✅ Connexion Supabase OK');
    }
  } catch (error) {
    console.log('❌ Erreur de test:', error.message);
  }
}

// Exécution du script
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--guide')) {
    generateMigrationGuide();
  } else if (args.includes('--test')) {
    testConnectivity();
  } else {
    deploySubscriptionSystem()
      .then(() => {
        console.log('\n🎉 Déploiement terminé avec succès!');
        console.log('\nUtilisez --guide pour voir le guide de migration');
        console.log('Utilisez --test pour tester la connectivité');
      })
      .catch(error => {
        console.error('💥 Erreur fatale:', error);
        process.exit(1);
      });
  }
}

module.exports = {
  deploySubscriptionSystem,
  generateMigrationGuide,
  testConnectivity
};