const { execSync } = require('child_process');
const fs = require('fs');
require('dotenv').config();

// SQL à exécuter
const sqlContent = fs.readFileSync('./SQL-A-EXECUTER-MANUELLEMENT.sql', 'utf8');

async function reconnectAndExecuteSQL() {
  console.log('\n🔐 === RECONNEXION ET EXÉCUTION SQL ===\n');
  
  try {
    // 1. Se reconnecter à Supabase
    console.log('🔑 Reconnexion à Supabase...');
    
    const loginResult = execSync('npx supabase login', { 
      encoding: 'utf8',
      stdio: 'inherit'
    });
    
    console.log('✅ Reconnexion réussie!');
    
    // 2. Lier le projet
    console.log('\n🔗 Liaison du projet...');
    
    const linkResult = execSync('npx supabase link --project-ref ptrqhtwstldphjaraufi', { 
      encoding: 'utf8',
      stdio: 'inherit'
    });
    
    console.log('✅ Projet lié!');
    
    // 3. Créer un fichier de migration temporaire
    console.log('\n📝 Création de la migration...');
    
    const timestamp = new Date().toISOString().replace(/[-:T]/g, '').split('.')[0];
    const migrationFile = `./supabase/migrations/${timestamp}_create_missing_tables.sql`;
    
    fs.writeFileSync(migrationFile, sqlContent);
    console.log(`✅ Migration créée: ${migrationFile}`);
    
    // 4. Appliquer la migration
    console.log('\n🚀 Application de la migration...');
    
    const pushResult = execSync('npx supabase db push', { 
      encoding: 'utf8',
      stdio: 'pipe'
    });
    
    console.log('✅ Migration appliquée avec succès!');
    console.log('📋 Résultat:', pushResult);
    
    // 5. Vérification
    console.log('\n🔍 Vérification du déploiement...');
    
    const verifyResult = execSync('node verify-production-deployment.cjs', { 
      encoding: 'utf8',
      stdio: 'pipe'
    });
    
    console.log(verifyResult);
    
    console.log('\n🎉 === DÉPLOIEMENT TERMINÉ ===\n');
    console.log('✅ Tables créées avec succès!');
    console.log('✅ Système d\'abonnements entièrement déployé!');
    
    return { success: true };
    
  } catch (error) {
    console.error('\n💥 ERREUR:', error.message);
    
    if (error.message.includes('login')) {
      console.log('\n🔧 SOLUTION MANUELLE - RECONNEXION:');
      console.log('1. Exécutez: npx supabase login');
      console.log('2. Connectez-vous dans le navigateur');
      console.log('3. Exécutez: npx supabase link --project-ref ptrqhtwstldphjaraufi');
      console.log('4. Relancez ce script');
    } else if (error.message.includes('migration')) {
      console.log('\n🔧 SOLUTION MANUELLE - SQL:');
      console.log('Allez sur: https://supabase.com/dashboard/project/ptrqhtwstldphjaraufi/sql');
      console.log('Copiez le contenu de: SQL-A-EXECUTER-MANUELLEMENT.sql');
    }
    
    return { success: false, error: error.message };
  }
}

// Fonction alternative si la reconnexion échoue
function showManualInstructions() {
  console.log('\n📋 === INSTRUCTIONS MANUELLES ===\n');
  
  console.log('🔐 ÉTAPE 1 - Reconnexion Supabase:');
  console.log('1. Ouvrez votre navigateur');
  console.log('2. Allez sur: https://supabase.com/dashboard');
  console.log('3. Connectez-vous à votre compte');
  console.log('4. Sélectionnez le projet: ptrqhtwstldphjaraufi');
  
  console.log('\n📊 ÉTAPE 2 - Exécution SQL:');
  console.log('1. Allez sur: https://supabase.com/dashboard/project/ptrqhtwstldphjaraufi/sql');
  console.log('2. Ouvrez le fichier: SQL-A-EXECUTER-MANUELLEMENT.sql');
  console.log('3. Copiez tout le contenu');
  console.log('4. Collez dans l\'éditeur SQL');
  console.log('5. Cliquez sur "Run"');
  
  console.log('\n✅ ÉTAPE 3 - Vérification:');
  console.log('Exécutez: node verify-production-deployment.cjs');
  
  console.log('\n🎯 Une fois terminé, votre système sera entièrement déployé!');
}

// Exécution
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--manual')) {
    showManualInstructions();
    process.exit(0);
  }
  
  reconnectAndExecuteSQL().then(result => {
    if (!result.success) {
      console.log('\n⚠️  Échec de l\'exécution automatique.');
      console.log('💡 Utilisez: node reconnect-and-execute-sql.cjs --manual');
    }
    process.exit(result.success ? 0 : 1);
  });
}

module.exports = { reconnectAndExecuteSQL, showManualInstructions };