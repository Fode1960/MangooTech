const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function analyzePaymentLogic() {
  try {
    console.log('🔍 Analyse de la logique de paiement actuelle');
    console.log('=' .repeat(60));

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // 1. Récupérer tous les packs avec leurs prix
    console.log('\n📦 ANALYSE DES PACKS DISPONIBLES');
    const { data: packs, error: packsError } = await supabase
      .from('packs')
      .select('*')
      .order('price', { ascending: true });

    if (packsError) {
      console.error('❌ Erreur récupération packs:', packsError);
      return;
    }

    console.log('\nPacks disponibles:');
    packs.forEach((pack, index) => {
      console.log(`${index + 1}. ${pack.name}`);
      console.log(`   - ID: ${pack.id}`);
      console.log(`   - Prix: ${pack.price} ${pack.currency || 'XOF'}`);
      console.log(`   - Récurrent: ${pack.is_recurring ? 'Oui' : 'Non'}`);
      console.log(`   - Description: ${pack.description || 'N/A'}`);
      console.log('');
    });

    // 2. Analyser la logique actuelle
    console.log('\n🔍 PROBLÈMES IDENTIFIÉS DANS LA LOGIQUE ACTUELLE:');
    console.log('\n1. 🚨 PROBLÈME PRINCIPAL: Rétrogradation avec paiement');
    console.log('   - La fonction change-pack-with-payment force un paiement même pour les downgrades');
    console.log('   - Seule exception: downgrade vers pack gratuit (prix = 0)');
    console.log('   - Exemple: Pack Premium (50000) → Pack Découverte (15000) = PAIEMENT REQUIS!');
    console.log('');

    console.log('2. 🔧 LOGIQUE INCORRECTE:');
    console.log('   - Tous les packs payants utilisent le mode "subscription"');
    console.log('   - Pas de gestion de la différence de prix négative');
    console.log('   - Pas de remboursement ou crédit pour les downgrades');
    console.log('');

    console.log('3. 📋 FONCTIONNALITÉS MANQUANTES:');
    console.log('   - Pas de changement immédiat pour les downgrades payants');
    console.log('   - Pas de gestion de proration');
    console.log('   - Pas de système de crédit/remboursement');
    console.log('   - Pas d\'annulation d\'abonnement sans paiement');
    console.log('');

    // 3. Analyser les scénarios possibles
    console.log('\n📊 SCÉNARIOS DE CHANGEMENT DE PACK:');
    
    const scenarios = [];
    for (let i = 0; i < packs.length; i++) {
      for (let j = 0; j < packs.length; j++) {
        if (i !== j) {
          const currentPack = packs[i];
          const newPack = packs[j];
          const priceDiff = newPack.price - currentPack.price;
          
          let changeType = '';
          let shouldRequirePayment = false;
          let recommendedAction = '';
          
          if (priceDiff > 0) {
            changeType = 'UPGRADE';
            shouldRequirePayment = true;
            recommendedAction = `Payer la différence: ${priceDiff} XOF`;
          } else if (priceDiff < 0) {
            changeType = 'DOWNGRADE';
            shouldRequirePayment = false;
            if (newPack.price === 0) {
              recommendedAction = 'Annuler abonnement + migration gratuite';
            } else {
              recommendedAction = `Crédit de ${Math.abs(priceDiff)} XOF ou migration immédiate`;
            }
          } else {
            changeType = 'MÊME PRIX';
            shouldRequirePayment = false;
            recommendedAction = 'Migration immédiate';
          }
          
          scenarios.push({
            from: currentPack.name,
            to: newPack.name,
            fromPrice: currentPack.price,
            toPrice: newPack.price,
            priceDiff,
            changeType,
            shouldRequirePayment,
            recommendedAction,
            currentLogicRequiresPayment: newPack.price > 0 // Logique actuelle
          });
        }
      }
    }

    // Afficher les scénarios problématiques
    const problematicScenarios = scenarios.filter(s => 
      s.changeType === 'DOWNGRADE' && s.currentLogicRequiresPayment && s.toPrice > 0
    );

    console.log('\n🚨 SCÉNARIOS PROBLÉMATIQUES (Downgrade qui demande paiement):');
    problematicScenarios.forEach((scenario, index) => {
      console.log(`${index + 1}. ${scenario.from} → ${scenario.to}`);
      console.log(`   Prix: ${scenario.fromPrice} → ${scenario.toPrice} (${scenario.priceDiff} XOF)`);
      console.log(`   Logique actuelle: DEMANDE PAIEMENT ❌`);
      console.log(`   Logique correcte: ${scenario.recommendedAction} ✅`);
      console.log('');
    });

    // 4. Recommandations
    console.log('\n💡 RECOMMANDATIONS POUR CORRIGER LE SYSTÈME:');
    console.log('\n1. 🔄 CRÉER UN SYSTÈME DE GESTION INTELLIGENT:');
    console.log('   - Upgrade: Paiement de la différence + proration');
    console.log('   - Downgrade vers gratuit: Annulation immédiate');
    console.log('   - Downgrade vers payant: Migration immédiate + crédit ou remboursement');
    console.log('   - Même prix: Migration immédiate');
    console.log('');

    console.log('2. 🛠️ FONCTIONS À CRÉER/MODIFIER:');
    console.log('   - smart-pack-change: Logique intelligente de changement');
    console.log('   - calculate-pack-difference: Calcul des différences et actions');
    console.log('   - handle-subscription-change: Gestion Stripe des abonnements');
    console.log('   - process-immediate-change: Changements sans paiement');
    console.log('');

    console.log('3. 🎯 PRIORITÉS:');
    console.log('   - URGENT: Corriger les downgrades qui demandent paiement');
    console.log('   - IMPORTANT: Implémenter la gestion de proration');
    console.log('   - MOYEN: Système de crédit/remboursement');
    console.log('   - BONUS: Interface utilisateur améliorée');
    console.log('');

    console.log('✅ Analyse terminée. Prêt à implémenter les corrections!');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

analyzePaymentLogic();