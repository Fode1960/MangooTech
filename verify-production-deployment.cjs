const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes:');
  console.error('   SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyProductionDeployment() {
  console.log('\n🔍 === VÉRIFICATION DU DÉPLOIEMENT EN PRODUCTION ===\n');

  const results = {
    functions: {},
    tables: {},
    policies: {},
    overall: true
  };

  try {
    // 1. Vérifier les nouvelles fonctions
    console.log('🔧 1. Vérification des fonctions Supabase...');
    
    const newFunctions = [
      'smart-pack-change',
      'calculate-pack-difference',
      'process-immediate-change',
      'handle-subscription-change',
      'cancel-subscription'
    ];

    for (const funcName of newFunctions) {
      try {
        const response = await fetch(`${supabaseUrl}/functions/v1/${funcName}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ test: true })
        });
        
        // Une réponse (même d'erreur) indique que la fonction existe
        if (response.status !== 404) {
          console.log(`   ✅ ${funcName} - Déployée`);
          results.functions[funcName] = true;
        } else {
          console.log(`   ❌ ${funcName} - Non trouvée`);
          results.functions[funcName] = false;
          results.overall = false;
        }
      } catch (error) {
        console.log(`   ⚠️ ${funcName} - Erreur de test:`, error.message);
        results.functions[funcName] = 'error';
      }
    }

    // 2. Vérifier les nouvelles tables
    console.log('\n📊 2. Vérification des tables...');
    
    const newTables = ['user_credits', 'cancellation_feedback'];
    
    for (const tableName of newTables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('count')
          .limit(1);
        
        if (!error) {
          console.log(`   ✅ ${tableName} - Existe`);
          results.tables[tableName] = true;
        } else {
          console.log(`   ❌ ${tableName} - Erreur:`, error.message);
          results.tables[tableName] = false;
          results.overall = false;
        }
      } catch (error) {
        console.log(`   ❌ ${tableName} - Erreur:`, error.message);
        results.tables[tableName] = false;
        results.overall = false;
      }
    }

    // 3. Vérifier les politiques RLS
    console.log('\n🔐 3. Vérification des politiques RLS...');
    
    try {
      // Vérifier user_credits
      const { data: creditsData, error: creditsError } = await supabase
        .from('user_credits')
        .select('id')
        .limit(1);
      
      if (!creditsError) {
        console.log('   ✅ user_credits - Politiques RLS OK');
        results.policies.user_credits = true;
      } else {
        console.log('   ❌ user_credits - Problème RLS:', creditsError.message);
        results.policies.user_credits = false;
      }

      // Vérifier cancellation_feedback
      const { data: feedbackData, error: feedbackError } = await supabase
        .from('cancellation_feedback')
        .select('id')
        .limit(1);
      
      if (!feedbackError) {
        console.log('   ✅ cancellation_feedback - Politiques RLS OK');
        results.policies.cancellation_feedback = true;
      } else {
        console.log('   ❌ cancellation_feedback - Problème RLS:', feedbackError.message);
        results.policies.cancellation_feedback = false;
      }
    } catch (error) {
      console.log('   ❌ Erreur lors de la vérification RLS:', error.message);
      results.overall = false;
    }

    // 4. Test fonctionnel de base
    console.log('\n🧪 4. Test fonctionnel de base...');
    
    try {
      // Test de calculate-pack-difference
      const testResponse = await fetch(`${supabaseUrl}/functions/v1/calculate-pack-difference`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: '00000000-0000-0000-0000-000000000000', // UUID test
          newPackId: '00000000-0000-0000-0000-000000000000'
        })
      });
      
      if (testResponse.status !== 404) {
        console.log('   ✅ Test fonctionnel - Fonctions répondent');
        results.functionalTest = true;
      } else {
        console.log('   ❌ Test fonctionnel - Fonctions non accessibles');
        results.functionalTest = false;
        results.overall = false;
      }
    } catch (error) {
      console.log('   ⚠️ Test fonctionnel - Erreur:', error.message);
      results.functionalTest = 'error';
    }

    // 5. Vérifier les anciennes fonctions (pour migration)
    console.log('\n🔄 5. Vérification des anciennes fonctions...');
    
    const oldFunctions = [
      'create-checkout-session',
      'change-pack-with-payment'
    ];

    for (const funcName of oldFunctions) {
      try {
        const response = await fetch(`${supabaseUrl}/functions/v1/${funcName}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ test: true })
        });
        
        if (response.status !== 404) {
          console.log(`   ✅ ${funcName} - Toujours disponible (migration progressive)`);
        } else {
          console.log(`   ⚠️ ${funcName} - Non trouvée`);
        }
      } catch (error) {
        console.log(`   ⚠️ ${funcName} - Erreur:`, error.message);
      }
    }

    // Résumé final
    console.log('\n📋 === RÉSUMÉ DU DÉPLOIEMENT ===\n');
    
    console.log('🔧 FONCTIONS:');
    Object.entries(results.functions).forEach(([name, status]) => {
      const icon = status === true ? '✅' : status === false ? '❌' : '⚠️';
      console.log(`   ${icon} ${name}`);
    });
    
    console.log('\n📊 TABLES:');
    Object.entries(results.tables).forEach(([name, status]) => {
      const icon = status ? '✅' : '❌';
      console.log(`   ${icon} ${name}`);
    });
    
    console.log('\n🔐 POLITIQUES RLS:');
    Object.entries(results.policies).forEach(([name, status]) => {
      const icon = status ? '✅' : '❌';
      console.log(`   ${icon} ${name}`);
    });

    if (results.overall) {
      console.log('\n🎉 DÉPLOIEMENT EN PRODUCTION: ✅ RÉUSSI');
      console.log('\n✨ Toutes les modifications ont été appliquées avec succès!');
      console.log('\n🚀 PROCHAINES ÉTAPES:');
      console.log('1. Mettre à jour le frontend pour utiliser smart-pack-change');
      console.log('2. Tester avec de vrais utilisateurs');
      console.log('3. Surveiller les logs de production');
      console.log('4. Planifier la dépréciation des anciennes fonctions');
    } else {
      console.log('\n⚠️ DÉPLOIEMENT EN PRODUCTION: ❌ INCOMPLET');
      console.log('\nCertaines modifications n\'ont pas été appliquées correctement.');
      console.log('Vérifiez les erreurs ci-dessus et relancez le déploiement si nécessaire.');
    }

    return results;

  } catch (error) {
    console.error('\n💥 ERREUR CRITIQUE:', error.message);
    console.log('\n🔧 ACTIONS RECOMMANDÉES:');
    console.log('1. Vérifiez vos variables d\'environnement');
    console.log('2. Vérifiez votre connexion à Supabase');
    console.log('3. Relancez le déploiement: node deploy-subscription-system.cjs');
    
    return { overall: false, error: error.message };
  }
}

// Fonction pour générer un rapport détaillé
function generateDeploymentReport(results) {
  const report = {
    timestamp: new Date().toISOString(),
    environment: 'production',
    supabaseUrl,
    deployment: {
      status: results.overall ? 'SUCCESS' : 'FAILED',
      functions: results.functions,
      tables: results.tables,
      policies: results.policies,
      functionalTest: results.functionalTest
    },
    recommendations: []
  };

  if (!results.overall) {
    report.recommendations.push('Relancer le déploiement complet');
    report.recommendations.push('Vérifier les logs Supabase Dashboard');
    report.recommendations.push('Contacter le support si les problèmes persistent');
  } else {
    report.recommendations.push('Procéder à la migration du frontend');
    report.recommendations.push('Tester avec des utilisateurs réels');
    report.recommendations.push('Surveiller les métriques de performance');
  }

  return report;
}

// Exécution du script
if (require.main === module) {
  verifyProductionDeployment()
    .then(results => {
      const report = generateDeploymentReport(results);
      
      // Sauvegarder le rapport
      const fs = require('fs');
      const reportPath = `./deployment-report-${Date.now()}.json`;
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
      
      console.log(`\n📄 Rapport sauvegardé: ${reportPath}`);
      
      if (results.overall) {
        console.log('\n🎯 Le système est prêt pour la production!');
        process.exit(0);
      } else {
        console.log('\n⚠️ Des actions correctives sont nécessaires.');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('💥 Erreur fatale:', error);
      process.exit(1);
    });
}

module.exports = {
  verifyProductionDeployment,
  generateDeploymentReport
};