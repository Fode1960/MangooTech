const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugStripeWebhook(userEmail) {
  try {
    console.log('🔍 Diagnostic du webhook Stripe pour:', userEmail);
    console.log('=' .repeat(60));

    // 1. Récupérer l'utilisateur
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', userEmail)
      .single();

    if (userError || !user) {
      console.error('❌ Utilisateur non trouvé:', userError?.message);
      return;
    }

    console.log('👤 Utilisateur trouvé:');
    console.log('  - ID:', user.id);
    console.log('  - Email:', user.email);
    console.log('  - Selected pack:', user.selected_pack);
    console.log('');

    // 2. Vérifier les packs de l'utilisateur
    const { data: userPacks, error: packsError } = await supabase
      .from('user_packs')
      .select(`
        *,
        packs:pack_id (
          id,
          name,
          price,
          description
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (packsError) {
      console.error('❌ Erreur récupération packs:', packsError.message);
      return;
    }

    console.log('📦 Packs de l\'utilisateur:');
    if (userPacks && userPacks.length > 0) {
      userPacks.forEach((pack, index) => {
        console.log(`  Pack ${index + 1}:`);
        console.log(`    - Nom: ${pack.packs?.name}`);
        console.log(`    - Status: ${pack.status}`);
        console.log(`    - Stripe Session ID: ${pack.stripe_session_id || 'N/A'}`);
        console.log(`    - Créé le: ${pack.created_at}`);
        console.log(`    - Mis à jour le: ${pack.updated_at}`);
        console.log('');
      });
    } else {
      console.log('  Aucun pack trouvé');
    }

    // 3. Vérifier les services actifs
    const { data: activeServices, error: servicesError } = await supabase
      .from('user_services')
      .select(`
        *,
        services:service_id (
          id,
          name,
          pack_id
        )
      `)
      .eq('user_id', user.id)
      .eq('status', 'active');

    if (servicesError) {
      console.error('❌ Erreur récupération services:', servicesError.message);
    } else {
      console.log('🔧 Services actifs:', activeServices?.length || 0);
      if (activeServices && activeServices.length > 0) {
        // Grouper par pack
        const servicesByPack = {};
        activeServices.forEach(service => {
          const packId = service.services?.pack_id;
          if (!servicesByPack[packId]) {
            servicesByPack[packId] = [];
          }
          servicesByPack[packId].push(service.services?.name);
        });

        Object.entries(servicesByPack).forEach(([packId, services]) => {
          console.log(`  Pack ${packId}: ${services.length} services`);
          services.forEach(serviceName => {
            console.log(`    - ${serviceName}`);
          });
        });
      }
    }
    console.log('');

    // 4. Vérifier les logs récents (si disponibles)
    console.log('📋 Recommandations de diagnostic:');
    console.log('1. Vérifiez les logs Supabase Edge Functions pour le webhook Stripe');
    console.log('2. Vérifiez que le webhook Stripe est correctement configuré');
    console.log('3. Testez un paiement et surveillez les logs en temps réel');
    console.log('4. Vérifiez que les métadonnées sont correctement envoyées à Stripe');
    console.log('');

    // 5. Vérifier la configuration Stripe
    console.log('🔧 Points à vérifier dans Stripe:');
    console.log('- URL du webhook: https://[votre-projet].supabase.co/functions/v1/stripe-webhook');
    console.log('- Événements écoutés: checkout.session.completed, invoice.payment_succeeded');
    console.log('- Secret du webhook configuré dans les variables d\'environnement');
    console.log('');

    // 6. Suggestions de test
    console.log('🧪 Test suggéré:');
    console.log('1. Effectuer un paiement test');
    console.log('2. Vérifier immédiatement les logs Supabase');
    console.log('3. Vérifier si les métadonnées user_id et pack_id sont présentes');
    console.log('4. Vérifier si le webhook reçoit l\'événement checkout.session.completed');

  } catch (error) {
    console.error('❌ Erreur lors du diagnostic:', error.message);
  }
}

// Utilisation
const userEmail = process.argv[2];
if (!userEmail) {
  console.error('Usage: node debug-stripe-webhook.cjs <email>');
  process.exit(1);
}

debugStripeWebhook(userEmail);