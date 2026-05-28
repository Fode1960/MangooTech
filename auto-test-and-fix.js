/**
 * Script de test et correction automatique complet
 * Diagnostique, corrige et valide automatiquement le problème de pack
 */

console.log('🤖 === TEST ET CORRECTION AUTOMATIQUE COMPLET ===\n');

// Fonction principale qui fait tout automatiquement
async function autoTestAndFix() {
  try {
    console.log('🚀 Démarrage du processus automatique...');
    
    // Étape 1: Vérification de l'authentification
    console.log('\n1️⃣ Vérification de l\'authentification...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('❌ ÉCHEC: Utilisateur non connecté');
      return false;
    }
    
    console.log(`✅ Utilisateur connecté: ${user.email}`);
    
    // Étape 2: Diagnostic initial
    console.log('\n2️⃣ Diagnostic initial...');
    const initialState = await getDiagnosticData(user.id);
    
    if (!initialState) {
      console.error('❌ ÉCHEC: Impossible de récupérer les données');
      return false;
    }
    
    console.log('📊 État initial analysé');
    
    // Étape 3: Vérification des problèmes
    console.log('\n3️⃣ Détection des problèmes...');
    const issues = detectIssues(initialState);
    
    if (issues.length === 0) {
      console.log('✅ SUCCÈS: Aucun problème détecté!');
      await displayCurrentState(initialState);
      return true;
    }
    
    console.log(`🚨 ${issues.length} problème(s) détecté(s):`);
    issues.forEach((issue, index) => {
      console.log(`   ${index + 1}. ${issue}`);
    });
    
    // Étape 4: Correction automatique
    console.log('\n4️⃣ Application de la correction...');
    const correctionSuccess = await applyCorrection(user.id, initialState);
    
    if (!correctionSuccess) {
      console.error('❌ ÉCHEC: Correction impossible');
      return false;
    }
    
    console.log('✅ Correction appliquée');
    
    // Étape 5: Validation post-correction
    console.log('\n5️⃣ Validation post-correction...');
    await new Promise(resolve => setTimeout(resolve, 1000)); // Attendre 1 seconde
    
    const finalState = await getDiagnosticData(user.id);
    const finalIssues = detectIssues(finalState);
    
    if (finalIssues.length === 0) {
      console.log('\n🎉 === CORRECTION RÉUSSIE ===');
      await displayCurrentState(finalState);
      
      // Étape 6: Rechargement automatique
      console.log('\n6️⃣ Rechargement de la page...');
      setTimeout(() => {
        console.log('🔄 Rechargement automatique...');
        window.location.reload();
      }, 2000);
      
      return true;
    } else {
      console.log('\n⚠️ === CORRECTION PARTIELLE ===');
      console.log(`${finalIssues.length} problème(s) restant(s):`);
      finalIssues.forEach((issue, index) => {
        console.log(`   ${index + 1}. ${issue}`);
      });
      return false;
    }
    
  } catch (error) {
    console.error('❌ ERREUR CRITIQUE:', error);
    return false;
  }
}

// Fonction pour récupérer les données de diagnostic
async function getDiagnosticData(userId) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select(`
        id,
        email,
        selected_pack,
        user_packs(
          id,
          pack_id,
          status,
          started_at,
          next_billing_date,
          packs(
            id,
            name,
            slug,
            price
          )
        ),
        transactions(
          id,
          pack_id,
          status,
          amount,
          created_at,
          packs(
            id,
            name,
            slug,
            price
          )
        )
      `)
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('Erreur récupération données:', error);
      return null;
    }
    
    return {
      user: data,
      activePacks: data.user_packs?.filter(up => up.status === 'active') || [],
      allPacks: data.user_packs || [],
      completedTransactions: data.transactions?.filter(t => t.status === 'completed')
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at)) || []
    };
  } catch (error) {
    console.error('Erreur getDiagnosticData:', error);
    return null;
  }
}

// Fonction pour détecter les problèmes
function detectIssues(state) {
  const issues = [];
  
  if (!state || !state.user) {
    issues.push('Données utilisateur manquantes');
    return issues;
  }
  
  const { user, activePacks, completedTransactions } = state;
  
  // Vérifier le nombre de packs actifs
  if (activePacks.length === 0) {
    issues.push('Aucun pack actif trouvé');
  } else if (activePacks.length > 1) {
    issues.push(`Trop de packs actifs (${activePacks.length})`);
  }
  
  // Vérifier la cohérence avec les transactions
  if (completedTransactions.length > 0 && activePacks.length > 0) {
    const lastTransaction = completedTransactions[0];
    const activePack = activePacks[0];
    
    if (activePack.pack_id !== lastTransaction.pack_id) {
      issues.push('Pack actif ne correspond pas à la dernière transaction');
    }
    
    if (user.selected_pack !== activePack.packs.slug) {
      issues.push('Selected_pack ne correspond pas au pack actif');
    }
    
    if (user.selected_pack !== lastTransaction.packs.slug) {
      issues.push('Selected_pack ne correspond pas à la dernière transaction');
    }
  }
  
  // Vérifier les dates
  if (activePacks.length > 0) {
    const activePack = activePacks[0];
    if (!activePack.started_at) {
      issues.push('Date de début manquante pour le pack actif');
    }
    if (!activePack.next_billing_date) {
      issues.push('Date de prochaine facturation manquante');
    }
  }
  
  return issues;
}

// Fonction pour appliquer la correction
async function applyCorrection(userId, state) {
  try {
    const { completedTransactions } = state;
    
    if (completedTransactions.length === 0) {
      console.error('Aucune transaction pour déterminer le pack correct');
      return false;
    }
    
    const targetTransaction = completedTransactions[0];
    console.log(`🎯 Correction vers: ${targetTransaction.packs.name}`);
    
    // 1. Supprimer tous les packs existants
    console.log('   - Nettoyage des packs existants...');
    const { error: deleteError } = await supabase
      .from('user_packs')
      .delete()
      .eq('user_id', userId);
    
    if (deleteError) {
      console.error('Erreur suppression packs:', deleteError);
      return false;
    }
    
    // 2. Créer le nouveau pack actif
    console.log('   - Création du nouveau pack...');
    const { error: insertError } = await supabase
      .from('user_packs')
      .insert({
        user_id: userId,
        pack_id: targetTransaction.pack_id,
        status: 'active',
        started_at: new Date().toISOString(),
        next_billing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      });
    
    if (insertError) {
      console.error('Erreur création pack:', insertError);
      return false;
    }
    
    // 3. Mettre à jour selected_pack
    console.log('   - Mise à jour selected_pack...');
    const { error: updateError } = await supabase
      .from('users')
      .update({ selected_pack: targetTransaction.packs.slug })
      .eq('id', userId);
    
    if (updateError) {
      console.error('Erreur mise à jour selected_pack:', updateError);
      return false;
    }
    
    // 4. Nettoyer le cache
    console.log('   - Nettoyage du cache...');
    try {
      Object.keys(localStorage).forEach(key => {
        if (key.includes('supabase') || key.includes('pack') || key.includes('user')) {
          localStorage.removeItem(key);
        }
      });
      
      Object.keys(sessionStorage).forEach(key => {
        if (key.includes('supabase') || key.includes('pack') || key.includes('user')) {
          sessionStorage.removeItem(key);
        }
      });
    } catch (cacheError) {
      console.warn('Avertissement nettoyage cache:', cacheError);
    }
    
    return true;
  } catch (error) {
    console.error('Erreur applyCorrection:', error);
    return false;
  }
}

// Fonction pour afficher l'état actuel
async function displayCurrentState(state) {
  console.log('\n📋 === ÉTAT ACTUEL ===');
  
  if (!state || !state.user) {
    console.log('❌ Aucune donnée disponible');
    return;
  }
  
  const { user, activePacks, completedTransactions } = state;
  
  console.log(`👤 Utilisateur: ${user.email}`);
  console.log(`🏷️  Selected pack: ${user.selected_pack}`);
  
  if (activePacks.length > 0) {
    const activePack = activePacks[0];
    console.log(`📦 Pack actif: ${activePack.packs.name} (${activePack.packs.slug})`);
    console.log(`💰 Prix: ${activePack.packs.price}€`);
    console.log(`📅 Démarré: ${new Date(activePack.started_at).toLocaleString()}`);
    if (activePack.next_billing_date) {
      console.log(`💳 Prochaine facturation: ${new Date(activePack.next_billing_date).toLocaleString()}`);
    }
  } else {
    console.log('📦 Aucun pack actif');
  }
  
  if (completedTransactions.length > 0) {
    const lastTransaction = completedTransactions[0];
    console.log(`💸 Dernière transaction: ${lastTransaction.packs.name} - ${lastTransaction.amount}€`);
    console.log(`📅 Date: ${new Date(lastTransaction.created_at).toLocaleString()}`);
  }
}

// Export des fonctions
window.autoTestAndFix = autoTestAndFix;
window.getDiagnosticData = getDiagnosticData;
window.detectIssues = detectIssues;
window.displayCurrentState = displayCurrentState;

console.log('📋 === COMMANDE PRINCIPALE ===');
console.log('🤖 autoTestAndFix() : Test et correction automatique complet');
console.log('\n🚀 EXÉCUTION AUTOMATIQUE...');

// Exécution automatique
autoTestAndFix().then(success => {
  if (success) {
    console.log('\n✅ === PROCESSUS TERMINÉ AVEC SUCCÈS ===');
  } else {
    console.log('\n❌ === PROCESSUS ÉCHOUÉ ===');
    console.log('💡 Vérifiez les erreurs ci-dessus ou contactez le support');
  }
});