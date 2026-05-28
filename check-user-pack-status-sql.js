// Script de diagnostic SQL alternatif pour vérifier le statut du pack utilisateur
// À exécuter dans la console du navigateur ou directement dans Supabase SQL Editor

(async function checkUserPackStatusSQL() {
  console.log('🔍 === DIAGNOSTIC PACK UTILISATEUR (SQL) ===');
  
  // ID utilisateur des logs
  const userId = '9c97cee9-9c65-47dd-b75b-3d7a0f513701';
  console.log('👤 User ID:', userId);
  
  // Requêtes SQL à exécuter dans Supabase Dashboard
  const sqlQueries = {
    userPacks: `
-- 1. TOUS LES PACKS DE L'UTILISATEUR
SELECT 
    up.id,
    up.user_id,
    up.pack_id,
    p.name as pack_name,
    p.price,
    p.currency,
    up.status,
    up.created_at,
    up.updated_at,
    up.next_billing_date
FROM user_packs up
JOIN packs p ON up.pack_id = p.id
WHERE up.user_id = '${userId}'
ORDER BY up.created_at DESC;
`,
    
    activePacks: `
-- 2. PACKS ACTIFS UNIQUEMENT
SELECT 
    up.id,
    up.user_id,
    up.pack_id,
    p.name as pack_name,
    p.price,
    p.currency,
    up.status,
    up.created_at
FROM user_packs up
JOIN packs p ON up.pack_id = p.id
WHERE up.user_id = '${userId}'
AND up.status = 'active'
ORDER BY up.created_at DESC;
`,
    
    transactions: `
-- 3. TRANSACTIONS RÉCENTES
SELECT 
    t.id,
    t.user_id,
    t.pack_id,
    p.name as pack_name,
    t.amount,
    t.currency,
    t.status,
    t.stripe_payment_intent_id,
    t.created_at
FROM transactions t
JOIN packs p ON t.pack_id = p.id
WHERE t.user_id = '${userId}'
ORDER BY t.created_at DESC
LIMIT 10;
`,
    
    userData: `
-- 4. DONNÉES UTILISATEUR ET SELECTED_PACK
SELECT 
    u.id,
    u.email,
    u.selected_pack,
    p.name as selected_pack_name,
    CASE 
        WHEN u.selected_pack ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
        THEN 'UUID valide'
        ELSE 'Format invalide - probablement un slug'
    END as selected_pack_format
FROM users u
LEFT JOIN packs p ON (
    CASE 
        WHEN u.selected_pack ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
        THEN u.selected_pack::uuid = p.id
        ELSE FALSE
    END
)
WHERE u.id = '${userId}';
`,
    
    packCount: `
-- 5. COMPTAGE DES PACKS ACTIFS
SELECT 
    COUNT(*) as active_packs_count,
    STRING_AGG(p.name, ', ') as active_pack_names
FROM user_packs up
JOIN packs p ON up.pack_id = p.id
WHERE up.user_id = '${userId}'
AND up.status = 'active';
`
  };
  
  console.log('\n📋 === REQUÊTES SQL À EXÉCUTER ===');
  console.log('🔗 Allez sur: https://supabase.com/dashboard/project/ptrqhtwstldphjaraufi/sql');
  console.log('\n📝 Copiez et exécutez ces requêtes une par une:\n');
  
  Object.entries(sqlQueries).forEach(([name, query]) => {
    console.log(`\n--- ${name.toUpperCase()} ---`);
    console.log(query);
  });
  
  console.log('\n🔍 === DIAGNOSTIC BASÉ SUR LES RÉSULTATS ===');
  console.log('\n1. Si PACKS ACTIFS montre uniquement "Pack Découverte":');
  console.log('   ❌ PROBLÈME: Le webhook Stripe n\'a pas créé le nouveau pack');
  console.log('\n2. Si TRANSACTIONS montre des paiements "completed":');
  console.log('   ❌ PROBLÈME: Paiement réussi mais pack non attribué');
  console.log('\n3. Si SELECTED_PACK est un slug (ex: "pack-decouverte"):');
  console.log('   ❌ PROBLÈME: Format incorrect, devrait être un UUID');
  console.log('\n4. Si plusieurs packs actifs:');
  console.log('   ⚠️  ATTENTION: Conflit de packs, désactiver les anciens');
  
  console.log('\n🔧 === SOLUTIONS POSSIBLES ===');
  console.log('\n• Vérifier les logs du webhook Stripe');
  console.log('• Vérifier la fonction handle-subscription-change');
  console.log('• Corriger le selected_pack avec l\'UUID correct');
  console.log('• Créer manuellement le pack utilisateur si nécessaire');
  
  // Essayer d'accéder au client Supabase si disponible
  try {
    let supabase;
    
    if (window.supabase) {
      supabase = window.supabase;
    } else if (window._supabase) {
      supabase = window._supabase;
    }
    
    if (supabase) {
      console.log('\n🚀 === EXÉCUTION AUTOMATIQUE ===');
      console.log('✅ Client Supabase détecté, exécution des requêtes...');
      
      // Exécuter les requêtes automatiquement
      const results = {};
      
      // 1. Packs utilisateur
      const { data: userPacks, error: packsError } = await supabase
        .from('user_packs')
        .select(`
          *,
          packs(
            id,
            name,
            price,
            currency,
            billing_period
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (packsError) {
        console.error('❌ Erreur packs:', packsError);
      } else {
        results.userPacks = userPacks;
        console.log('📦 Packs utilisateur:', userPacks);
        
        const activePacks = userPacks?.filter(pack => pack.status === 'active') || [];
        console.log('✅ Packs actifs:', activePacks.length, activePacks);
      }
      
      // 2. Transactions
      const { data: transactions, error: transError } = await supabase
        .from('transactions')
        .select(`
          *,
          packs(
            id,
            name,
            price
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (transError) {
        console.error('❌ Erreur transactions:', transError);
      } else {
        results.transactions = transactions;
        console.log('💰 Transactions:', transactions);
        
        const successfulTrans = transactions?.filter(t => t.status === 'completed') || [];
        console.log('✅ Paiements réussis:', successfulTrans.length);
      }
      
      // 3. Données utilisateur
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, email, selected_pack')
        .eq('id', userId)
        .single();
      
      if (userError) {
        console.error('❌ Erreur utilisateur:', userError);
      } else {
        results.userData = userData;
        console.log('👤 Utilisateur:', userData);
      }
      
      // Diagnostic final
      console.log('\n🎯 === DIAGNOSTIC FINAL ===');
      
      const activePacks = results.userPacks?.filter(pack => pack.status === 'active') || [];
      const successfulPayments = results.transactions?.filter(t => t.status === 'completed') || [];
      
      if (activePacks.length === 0) {
        console.log('❌ PROBLÈME CRITIQUE: Aucun pack actif');
      } else if (activePacks.length === 1) {
        const currentPack = activePacks[0];
        console.log('📦 Pack actuel:', currentPack.packs?.name);
        
        if (currentPack.packs?.name === 'Pack Découverte' && successfulPayments.length > 0) {
          console.log('❌ PROBLÈME IDENTIFIÉ: Pack Découverte malgré paiements réussis');
          console.log('🔧 CAUSE: Webhook Stripe ou fonction handle-subscription-change défaillante');
        } else if (currentPack.packs?.name === 'Pack Découverte') {
          console.log('ℹ️  NORMAL: Pack Découverte, aucun paiement trouvé');
        } else {
          console.log('✅ NORMAL: Pack payant actif');
        }
      } else {
        console.log('⚠️  ATTENTION: Plusieurs packs actifs détectés');
        activePacks.forEach((pack, i) => {
          console.log(`📦 Pack ${i+1}:`, pack.packs?.name);
        });
      }
      
    } else {
      console.log('\n💡 === INSTRUCTIONS ===');
      console.log('• Copiez les requêtes SQL ci-dessus');
      console.log('• Exécutez-les dans Supabase Dashboard');
      console.log('• Analysez les résultats selon le diagnostic fourni');
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error);
    console.log('\n💡 Utilisez les requêtes SQL manuelles ci-dessus');
  }
})();