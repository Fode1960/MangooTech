const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function generateTestPayment() {
  try {
    console.log('💳 Génération d\'un paiement test');
    console.log('=' .repeat(50));

    // 1. Récupérer l'utilisateur
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'mdansoko@mangoo.tech')
      .single();

    if (userError || !user) {
      console.error('❌ Utilisateur non trouvé:', userError?.message);
      return;
    }

    console.log('👤 Utilisateur:', user.email);
    console.log('📦 Pack actuel:', user.selected_pack);
    console.log('');

    // 2. Récupérer les packs disponibles
    const { data: packs, error: packsError } = await supabase
      .from('packs')
      .select('*')
      .order('price', { ascending: true });

    if (packsError) {
      console.error('❌ Erreur récupération packs:', packsError.message);
      return;
    }

    console.log('📦 Packs disponibles:');
    packs.forEach((pack, index) => {
      const isCurrent = user.selected_pack === pack.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/é/g, 'e');
      console.log(`  ${index + 1}. ${pack.name} - ${pack.price} XOF ${isCurrent ? '(ACTUEL)' : ''}`);
      console.log(`     ID: ${pack.id}`);
    });
    console.log('');

    // 3. Choisir un pack différent pour le test (Pack Visibilité)
    const testPack = packs.find(p => p.name === 'Pack Visibilité');
    if (!testPack) {
      console.error('❌ Pack Visibilité non trouvé pour le test');
      return;
    }

    console.log('🎯 Pack sélectionné pour le test:', testPack.name);
    console.log('💰 Prix:', testPack.price, 'XOF');
    console.log('🆔 ID:', testPack.id);
    console.log('');

    // 4. Créer un token d'authentification temporaire
    console.log('🔐 Création d\'une session d\'authentification...');
    
    // Utiliser le service role key pour créer une session
    const { data: authData, error: authError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: user.email,
      options: {
        redirectTo: 'http://localhost:3000/dashboard'
      }
    });

    if (authError) {
      console.error('❌ Erreur génération lien:', authError.message);
      console.log('⚠️ Vous devrez vous connecter manuellement pour tester');
    }

    // 5. Générer l'URL de test
    const webhookUrl = `${process.env.SUPABASE_URL}/functions/v1/stripe-webhook`;
    const createSessionUrl = `${process.env.SUPABASE_URL}/functions/v1/create-checkout-session`;

    console.log('🌐 URLs importantes:');
    console.log('  - Webhook Stripe:', webhookUrl);
    console.log('  - Create Session:', createSessionUrl);
    console.log('');

    // 6. Instructions de test détaillées
    console.log('🧪 INSTRUCTIONS DE TEST DÉTAILLÉES');
    console.log('=' .repeat(50));
    console.log('');
    
    console.log('📋 ÉTAPE 1: Préparer le test');
    console.log('1. Ouvrez le Dashboard Supabase dans un onglet');
    console.log('2. Allez dans Edge Functions > stripe-webhook > Logs');
    console.log('3. Gardez cette page ouverte pour voir les logs en temps réel');
    console.log('');
    
    console.log('📋 ÉTAPE 2: Vérifier la configuration Stripe');
    console.log('1. Ouvrez Stripe Dashboard > Webhooks');
    console.log('2. Vérifiez que votre webhook pointe vers:', webhookUrl);
    console.log('3. Vérifiez que les événements suivants sont activés:');
    console.log('   - checkout.session.completed');
    console.log('   - invoice.payment_succeeded');
    console.log('4. Notez le secret du webhook (commence par whsec_)');
    console.log('');
    
    console.log('📋 ÉTAPE 3: Effectuer le paiement test');
    console.log('1. Connectez-vous sur votre application avec:', user.email);
    console.log('2. Allez sur la page de sélection des packs');
    console.log('3. Sélectionnez "Pack Visibilité" (différent du pack actuel)');
    console.log('4. Procédez au paiement avec les données de test Stripe:');
    console.log('   - Numéro de carte: 4242 4242 4242 4242');
    console.log('   - Date d\'expiration: 12/34');
    console.log('   - CVC: 123');
    console.log('   - Code postal: 12345');
    console.log('');
    
    console.log('📋 ÉTAPE 4: Vérifier les logs');
    console.log('1. Immédiatement après le paiement, vérifiez les logs Supabase');
    console.log('2. Recherchez les messages suivants:');
    console.log('   - "🛒 SESSION CHECKOUT COMPLÉTÉE"');
    console.log('   - "📋 MÉTADONNÉES SESSION"');
    console.log('   - "🔄 MISE À JOUR SELECTED_PACK"');
    console.log('   - "✅ selected_pack mis à jour"');
    console.log('');
    
    console.log('📋 ÉTAPE 5: Vérifier le résultat');
    console.log('1. Rechargez votre dashboard');
    console.log('2. Vérifiez que le pack affiché a changé');
    console.log('3. Vérifiez dans la base de données:');
    console.log('   - Table users: selected_pack doit être "pack-visibilite"');
    console.log('   - Table user_packs: Pack Visibilité doit être "active"');
    console.log('');
    
    console.log('🚨 EN CAS DE PROBLÈME:');
    console.log('1. Vérifiez que STRIPE_WEBHOOK_SECRET est correct');
    console.log('2. Vérifiez que l\'URL du webhook est accessible');
    console.log('3. Testez le webhook manuellement depuis Stripe Dashboard');
    console.log('4. Vérifiez les logs d\'erreur dans Supabase');
    console.log('');
    
    console.log('🔧 COMMANDES UTILES APRÈS LE TEST:');
    console.log('- Vérifier l\'état: node check-webhook-config.cjs');
    console.log('- Diagnostiquer: node debug-stripe-webhook.cjs mdansoko@mangoo.tech');
    console.log('');
    
    console.log('✅ Prêt pour le test!');
    console.log('Suivez les étapes ci-dessus et surveillez les logs en temps réel.');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

generateTestPayment();