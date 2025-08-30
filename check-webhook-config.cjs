const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkWebhookConfig() {
  try {
    console.log('🔍 Vérification de la configuration du webhook Stripe');
    console.log('=' .repeat(60));

    // 1. Vérifier les variables d'environnement
    console.log('🔧 Variables d\'environnement:');
    console.log('  - SUPABASE_URL:', !!process.env.SUPABASE_URL ? '✅ Présente' : '❌ Manquante');
    console.log('  - SUPABASE_SERVICE_ROLE_KEY:', !!process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Présente' : '❌ Manquante');
    console.log('  - STRIPE_SECRET_KEY:', !!process.env.STRIPE_SECRET_KEY ? '✅ Présente' : '❌ Manquante');
    console.log('  - STRIPE_WEBHOOK_SECRET:', !!process.env.STRIPE_WEBHOOK_SECRET ? '✅ Présente' : '❌ Manquante');
    console.log('');

    // 2. Vérifier l'URL du projet Supabase
    const supabaseUrl = process.env.SUPABASE_URL;
    if (supabaseUrl) {
      const webhookUrl = `${supabaseUrl}/functions/v1/stripe-webhook`;
      console.log('🌐 URL du webhook calculée:');
      console.log('  ', webhookUrl);
      console.log('');
    }

    // 3. Vérifier l'état actuel de l'utilisateur
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'mdansoko@mangoo.tech')
      .single();

    if (userError) {
      console.error('❌ Erreur utilisateur:', userError.message);
      return;
    }

    console.log('👤 État actuel de l\'utilisateur:');
    console.log('  - Email:', user.email);
    console.log('  - Selected pack:', user.selected_pack);
    console.log('');

    // 4. Vérifier les packs actifs
    const { data: activePacks, error: activePacksError } = await supabase
      .from('user_packs')
      .select(`
        *,
        packs:pack_id (
          name,
          price
        )
      `)
      .eq('user_id', user.id)
      .eq('status', 'active');

    console.log('📦 Packs actifs:');
    if (activePacksError) {
      console.error('❌ Erreur:', activePacksError.message);
    } else if (activePacks && activePacks.length > 0) {
      activePacks.forEach(pack => {
        console.log(`  - ${pack.packs?.name} (${pack.packs?.price} XOF)`);
        console.log(`    Status: ${pack.status}`);
        console.log(`    Stripe Session: ${pack.stripe_session_id || 'N/A'}`);
      });
    } else {
      console.log('  Aucun pack actif trouvé');
    }
    console.log('');

    // 5. Problèmes identifiés
    console.log('🚨 Problèmes potentiels identifiés:');
    
    // Vérifier l'incohérence entre selected_pack et pack actif
    if (activePacks && activePacks.length > 0) {
      const activePack = activePacks[0];
      const activePackSlug = activePack.packs?.name.toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/é/g, 'e')
        .replace(/è/g, 'e')
        .replace(/à/g, 'a');
      
      if (user.selected_pack !== activePackSlug) {
        console.log('❌ INCOHÉRENCE: selected_pack ne correspond pas au pack actif');
        console.log(`   Selected pack: ${user.selected_pack}`);
        console.log(`   Pack actif: ${activePackSlug}`);
      } else {
        console.log('✅ Cohérence entre selected_pack et pack actif');
      }
    }

    // Vérifier les sessions Stripe manquantes
    if (activePacks && activePacks.some(p => !p.stripe_session_id)) {
      console.log('⚠️ Certains packs actifs n\'ont pas de stripe_session_id');
      console.log('   Cela peut indiquer que le webhook n\'a pas fonctionné');
    }

    console.log('');
    console.log('🔧 Actions recommandées:');
    console.log('1. Vérifier la configuration du webhook dans Stripe Dashboard');
    console.log('2. Vérifier que l\'URL du webhook est correcte');
    console.log('3. Vérifier que les événements checkout.session.completed sont activés');
    console.log('4. Tester un paiement et surveiller les logs en temps réel');
    console.log('5. Vérifier que STRIPE_WEBHOOK_SECRET correspond au secret dans Stripe');
    console.log('');
    
    console.log('📋 Pour tester le webhook:');
    console.log('1. Aller dans Stripe Dashboard > Webhooks');
    console.log('2. Trouver votre webhook et cliquer sur "Send test webhook"');
    console.log('3. Envoyer un événement checkout.session.completed');
    console.log('4. Vérifier les logs dans Supabase Dashboard');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

checkWebhookConfig();