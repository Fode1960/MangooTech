const https = require('https');
const crypto = require('crypto');
require('dotenv').config();

async function testWebhookEndpoint() {
  try {
    console.log('🔍 Test de l\'endpoint webhook Stripe');
    console.log('=' .repeat(50));

    const webhookUrl = `${process.env.SUPABASE_URL}/functions/v1/stripe-webhook`;
    console.log('🌐 URL du webhook:', webhookUrl);
    console.log('');

    // Créer un payload de test simulant un événement checkout.session.completed
    const testPayload = {
      id: 'evt_test_webhook',
      object: 'event',
      api_version: '2024-12-18',
      created: Math.floor(Date.now() / 1000),
      data: {
        object: {
          id: 'cs_test_session',
          object: 'checkout.session',
          payment_status: 'paid',
          status: 'complete',
          mode: 'payment',
          amount_total: 5000,
          currency: 'xof',
          metadata: {
            user_id: '9c97cee9-9c65-47dd-b75b-3d7a0f513701',
            pack_id: '5b8c9d2e-3f4a-4b5c-8d9e-1f2a3b4c5d6e' // ID du Pack Visibilité
          }
        }
      },
      livemode: false,
      pending_webhooks: 1,
      request: {
        id: 'req_test',
        idempotency_key: null
      },
      type: 'checkout.session.completed'
    };

    const payloadString = JSON.stringify(testPayload);
    console.log('📦 Payload de test créé (checkout.session.completed)');
    console.log('👤 User ID:', testPayload.data.object.metadata.user_id);
    console.log('📋 Pack ID:', testPayload.data.object.metadata.pack_id);
    console.log('');

    // Créer une signature de test (si on a le secret)
    let signature = null;
    if (process.env.STRIPE_WEBHOOK_SECRET) {
      const timestamp = Math.floor(Date.now() / 1000);
      const signedPayload = timestamp + '.' + payloadString;
      const expectedSignature = crypto
        .createHmac('sha256', process.env.STRIPE_WEBHOOK_SECRET)
        .update(signedPayload, 'utf8')
        .digest('hex');
      signature = `t=${timestamp},v1=${expectedSignature}`;
      console.log('🔐 Signature générée pour le test');
    } else {
      console.log('⚠️ STRIPE_WEBHOOK_SECRET non disponible, test sans signature');
    }
    console.log('');

    // Tester la connectivité de base
    console.log('🔗 Test de connectivité...');
    
    const url = new URL(webhookUrl);
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payloadString),
        'User-Agent': 'Stripe/1.0 (+https://stripe.com/docs/webhooks)'
      }
    };

    if (signature) {
      options.headers['stripe-signature'] = signature;
    }

    console.log('📡 Envoi de la requête de test...');
    
    const req = https.request(options, (res) => {
      console.log('📊 Réponse reçue:');
      console.log('  - Status:', res.statusCode);
      console.log('  - Headers:', JSON.stringify(res.headers, null, 2));
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('  - Body:', data);
        console.log('');
        
        if (res.statusCode === 200) {
          console.log('✅ Webhook endpoint accessible et fonctionnel!');
          console.log('🎉 Le webhook devrait traiter les paiements correctement.');
        } else if (res.statusCode === 400) {
          console.log('⚠️ Webhook accessible mais erreur de traitement');
          console.log('💡 Cela peut être normal sans signature valide');
        } else {
          console.log('❌ Problème avec le webhook endpoint');
        }
        
        console.log('');
        console.log('🔧 Recommandations:');
        console.log('1. Si le test échoue, vérifiez la configuration Supabase');
        console.log('2. Vérifiez que la fonction stripe-webhook est déployée');
        console.log('3. Vérifiez les variables d\'environnement');
        console.log('4. Testez un vrai paiement pour validation finale');
      });
    });

    req.on('error', (error) => {
      console.error('❌ Erreur de connexion:', error.message);
      console.log('');
      console.log('🚨 Problèmes possibles:');
      console.log('- URL du webhook incorrecte');
      console.log('- Fonction Supabase non déployée');
      console.log('- Problème de réseau');
      console.log('- Configuration Supabase incorrecte');
    });

    req.write(payloadString);
    req.end();

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

testWebhookEndpoint();