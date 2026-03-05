const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Configuration avec service key pour les opérations administratives
const supabaseUrl = process.env.SUPABASE_URL || 'https://votre-projet.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || 'votre-service-key';

// Client avec service key pour contourner RLS
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function appliquerSolutionPack() {
  console.log('🔧 APPLICATION DE LA SOLUTION PACK PERSISTANT');
  console.log('=' .repeat(55));
  
  const rapport = {
    timestamp: new Date().toISOString(),
    etapes: [],
    corrections: [],
    erreurs: []
  };

  try {
    // ÉTAPE 1: Diagnostic initial
    console.log('\n1️⃣ DIAGNOSTIC INITIAL');
    console.log('Vérification des utilisateurs avec pack découverte...');
    
    const { data: usersDecouverte, error: errorUsers } = await supabaseAdmin
      .from('users')
      .select('id, email, selected_pack, updated_at')
      .eq('selected_pack', 'decouverte')
      .limit(5);
    
    if (errorUsers) {
      console.error('❌ Erreur lecture users:', errorUsers.message);
      rapport.erreurs.push({ etape: 'diagnostic', erreur: errorUsers.message });
      return;
    }
    
    console.log(`📊 ${usersDecouverte.length} utilisateurs avec pack découverte`);
    usersDecouverte.forEach(user => {
      console.log(`   - ${user.email}: ${user.selected_pack}`);
    });
    
    rapport.etapes.push({ 
      etape: 'diagnostic', 
      status: 'ok', 
      utilisateurs_decouverte: usersDecouverte.length 
    });

    // ÉTAPE 2: Vérification des transactions récentes
    console.log('\n2️⃣ VÉRIFICATION DES TRANSACTIONS');
    const { data: transactions, error: errorTrans } = await supabaseAdmin
      .from('transactions')
      .select('user_id, pack_type, status, created_at')
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (errorTrans) {
      console.log('⚠️  Impossible de lire les transactions:', errorTrans.message);
    } else {
      console.log(`💳 ${transactions.length} transactions réussies récentes`);
      
      // Identifier les utilisateurs avec paiement réussi mais pack incorrect
      const utilisateursACorreger = [];
      
      for (const trans of transactions) {
        const userWithWrongPack = usersDecouverte.find(u => u.id === trans.user_id);
        if (userWithWrongPack && trans.pack_type !== 'decouverte') {
          utilisateursACorreger.push({
            user_id: trans.user_id,
            email: userWithWrongPack.email,
            pack_actuel: userWithWrongPack.selected_pack,
            pack_paye: trans.pack_type,
            date_paiement: trans.created_at
          });
        }
      }
      
      console.log(`🎯 ${utilisateursACorreger.length} utilisateurs à corriger:`);
      utilisateursACorreger.forEach(user => {
        console.log(`   - ${user.email}: ${user.pack_actuel} → ${user.pack_paye}`);
      });
      
      rapport.corrections = utilisateursACorreger;
    }

    // ÉTAPE 3: Application des corrections
    if (rapport.corrections.length > 0) {
      console.log('\n3️⃣ APPLICATION DES CORRECTIONS');
      
      for (const correction of rapport.corrections) {
        console.log(`\n🔄 Correction pour ${correction.email}...`);
        
        try {
          // Tentative de mise à jour directe avec service key
          const { data: updateResult, error: updateError } = await supabaseAdmin
            .from('users')
            .update({ 
              selected_pack: correction.pack_paye,
              updated_at: new Date().toISOString()
            })
            .eq('id', correction.user_id)
            .select('id, email, selected_pack');
          
          if (updateError) {
            console.error(`❌ Échec correction ${correction.email}:`, updateError.message);
            rapport.erreurs.push({
              user_id: correction.user_id,
              email: correction.email,
              erreur: updateError.message
            });
          } else {
            console.log(`✅ Correction réussie pour ${correction.email}`);
            console.log(`   Pack mis à jour: ${correction.pack_actuel} → ${correction.pack_paye}`);
            
            rapport.etapes.push({
              etape: 'correction_utilisateur',
              user_id: correction.user_id,
              email: correction.email,
              ancien_pack: correction.pack_actuel,
              nouveau_pack: correction.pack_paye,
              status: 'reussi'
            });
          }
        } catch (error) {
          console.error(`💥 Erreur critique pour ${correction.email}:`, error.message);
          rapport.erreurs.push({
            user_id: correction.user_id,
            email: correction.email,
            erreur: error.message
          });
        }
      }
    } else {
      console.log('\n✅ Aucune correction nécessaire - tous les packs sont synchronisés');
    }

    // ÉTAPE 4: Vérification post-correction
    console.log('\n4️⃣ VÉRIFICATION POST-CORRECTION');
    const { data: usersApresCorrection } = await supabaseAdmin
      .from('users')
      .select('id, email, selected_pack')
      .in('id', rapport.corrections.map(c => c.user_id));
    
    if (usersApresCorrection) {
      console.log('📋 État après correction:');
      usersApresCorrection.forEach(user => {
        const correction = rapport.corrections.find(c => c.user_id === user.id);
        const status = user.selected_pack === correction?.pack_paye ? '✅' : '❌';
        console.log(`   ${status} ${user.email}: ${user.selected_pack}`);
      });
    }

    // ÉTAPE 5: Recommandations pour éviter le problème
    console.log('\n5️⃣ RECOMMANDATIONS PRÉVENTIVES');
    console.log('=' .repeat(40));
    console.log('Pour éviter ce problème à l\'avenir:');
    console.log('1. Vérifier les politiques RLS sur la table users');
    console.log('2. S\'assurer que les webhooks utilisent la service key');
    console.log('3. Implémenter une fonction de vérification périodique');
    console.log('4. Ajouter des logs détaillés dans les webhooks');
    
    // Sauvegarde du rapport
    fs.writeFileSync('rapport-correction-pack.json', JSON.stringify(rapport, null, 2));
    console.log('\n📄 Rapport détaillé sauvegardé: rapport-correction-pack.json');
    
    // Résumé final
    console.log('\n📊 RÉSUMÉ DE L\'INTERVENTION');
    console.log('=' .repeat(35));
    console.log(`✅ Corrections appliquées: ${rapport.etapes.filter(e => e.status === 'reussi').length}`);
    console.log(`❌ Erreurs rencontrées: ${rapport.erreurs.length}`);
    console.log(`📈 Utilisateurs traités: ${rapport.corrections.length}`);
    
    if (rapport.erreurs.length === 0) {
      console.log('\n🎉 SUCCÈS - Tous les packs ont été synchronisés!');
      console.log('Les utilisateurs devraient maintenant voir leur pack correct.');
    } else {
      console.log('\n⚠️  ATTENTION - Certaines corrections ont échoué');
      console.log('Consultez le rapport JSON pour les détails des erreurs.');
      console.log('\nSOLUTION MANUELLE RECOMMANDÉE:');
      console.log('1. Ouvrir le dashboard Supabase');
      console.log('2. Aller dans SQL Editor');
      console.log('3. Exécuter: ALTER TABLE users DISABLE ROW LEVEL SECURITY;');
      console.log('4. Corriger manuellement les packs');
      console.log('5. Réactiver RLS avec des politiques appropriées');
    }
    
  } catch (error) {
    console.error('💥 ERREUR CRITIQUE:', error.message);
    rapport.erreur_critique = error.message;
    fs.writeFileSync('rapport-correction-pack.json', JSON.stringify(rapport, null, 2));
    
    console.log('\n🆘 SOLUTION D\'URGENCE:');
    console.log('1. Utilisez le fichier solution-pack-persistant-finale.sql');
    console.log('2. Appliquez les corrections manuellement via le dashboard Supabase');
    console.log('3. Désactivez temporairement RLS si nécessaire');
  }
}

// Instructions d'utilisation
console.log('🚀 SCRIPT DE CORRECTION AUTOMATIQUE DES PACKS');
console.log('=' .repeat(50));
console.log('Ce script va:');
console.log('1. Identifier les utilisateurs avec pack incorrect');
console.log('2. Corriger automatiquement les packs basés sur les paiements');
console.log('3. Générer un rapport détaillé');
console.log('\nPRÉREQUIS:');
console.log('- Variables d\'environnement SUPABASE_URL et SUPABASE_SERVICE_KEY');
console.log('- Ou modifier les valeurs dans le script');
console.log('\nDémarrage dans 3 secondes...');

setTimeout(() => {
  appliquerSolutionPack().catch(console.error);
}, 3000);