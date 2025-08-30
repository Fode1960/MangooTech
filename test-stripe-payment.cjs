const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function testStripePayment() {
  try {
    console.log('🧪 Test de paiement Stripe');
    console.log('=' .repeat(40));

    // 1. Se connecter avec l'utilisateur test
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'mdansoko@mangoo.tech',
      password: 'votre_mot_de_passe' // Vous devrez fournir le bon mot de passe
    });

    if (authError) {
      console.error('❌ Erreur authentification:', authError.message);
      console.log('⚠️ Vous devez modifier le script avec le bon mot de passe');
      return;
    }

    console.log('✅ Authentification réussie');
    console.log('User ID:', authData.user.id);
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
      console.log(`  ${index + 1}. ${pack.name} - ${pack.price} XOF`);
      console.log(`     ID: ${pack.id}`);
    });
    console.log('');

    // 3. Choisir un pack différent du pack actuel (Pack Visibilité par exemple)
    const targetPack = packs.find(p => p.name === 'Pack Visibilité');
    if (!targetPack) {
      console.error('❌ Pack Visibilité non trouvé');
      return;
    }

    console.log('🎯 Pack sélectionné pour le test:', targetPack.name);
    console.log('Prix:', targetPack.price, 'XOF');
    console.log('ID:', targetPack.id);
    console.log('');

    // 4. Créer une session de paiement
    console.log('💳 Création de la session de paiement...');
    
    const { data: sessionData, error: sessionError } = await supabase.functions.invoke('create-checkout-session', {
      body: {
        packId: targetPack.id,
        successUrl: 'http://localhost:3000/dashboard?success=true',
        cancelUrl: 'http://localhost:3000/dashboard?canceled=true'
      }
    });

    if (sessionError) {
      console.error('❌ Erreur création session:', sessionError.message);
      return;
    }

    if (sessionData.error) {
      console.error('❌ Erreur session:', sessionData.error);
      return;
    }

    console.log('✅ Session de paiement créée avec succès!');
    console.log('URL de paiement:', sessionData.url);
    console.log('');
    
    console.log('🔍 Instructions pour tester:');
    console.log('1. Ouvrez cette URL dans votre navigateur:', sessionData.url);
    console.log('2. Utilisez les données de test Stripe:');
    console.log('   - Numéro de carte: 4242 4242 4242 4242');
    console.log('   - Date d\'expiration: 12/34');
    console.log('   - CVC: 123');
    console.log('3. Complétez le paiement');
    console.log('4. Vérifiez les logs Supabase immédiatement après');
    console.log('5. Vérifiez que le selected_pack a changé');
    console.log('');
    
    console.log('📋 Vérifications à faire après le paiement:');
    console.log('- Dashboard Supabase > Edge Functions > stripe-webhook > Logs');
    console.log('- Vérifier que l\'événement checkout.session.completed est reçu');
    console.log('- Vérifier que les métadonnées user_id et pack_id sont présentes');
    console.log('- Vérifier que le selected_pack est mis à jour');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

testStripePayment();