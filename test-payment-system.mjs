import axios from 'axios';

// Configuration de base
const API_BASE_URL = 'http://localhost:3005/api';
const ADMIN_TOKEN = 'your-admin-token-here'; // Remplacez par un vrai token admin

// Fonction pour créer un token admin de test
async function createTestAdminToken() {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'admin@mangootech.com',
      password: 'admin123'
    });
    return response.data.token;
  } catch (error) {
    console.log('⚠️  Impossible de créer un token admin, utilisant un token factice');
    return 'fake-admin-token-for-testing';
  }
}

// Fonction de test principale
async function testPaymentSystem() {
  console.log('🚀 Démarrage des tests du système de paiement complet...\n');

  // Créer un token admin pour les tests
  const adminToken = await createTestAdminToken();
  const headers = {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json'
  };

  const tests = [
    {
      name: 'API de statistiques des paiements',
      endpoint: '/admin/payments/stats',
      method: 'GET',
      description: 'Vérifie que les statistiques des paiements sont accessibles'
    },
    {
      name: 'API des méthodes de paiement',
      endpoint: '/admin/payments/methods',
      method: 'GET',
      description: 'Vérifie que les analytics par méthode de paiement fonctionnent'
    },
    {
      name: 'API des pays',
      endpoint: '/admin/payments/countries',
      method: 'GET',
      description: 'Vérifie que les analytics par pays sont disponibles'
    },
    {
      name: 'API des transactions',
      endpoint: '/admin/payments/transactions',
      method: 'GET',
      description: 'Vérifie que la liste des transactions est accessible'
    },
    {
      name: 'API des commissions',
      endpoint: '/admin/payments/commissions',
      method: 'GET',
      description: 'Vérifie que les métriques des commissions sont disponibles'
    },
    {
      name: 'Configuration des commissions',
      endpoint: '/admin/commissions/config',
      method: 'GET',
      description: 'Vérifie que la configuration des commissions est accessible'
    },
    {
      name: 'Calcul des commissions',
      endpoint: '/admin/commissions/calculate',
      method: 'POST',
      data: {
        amount: 10000,
        payment_method: 'orange_money',
        currency: 'XOF'
      },
      description: 'Vérifie que le calcul des commissions fonctionne'
    },
    {
      name: 'Configuration des méthodes de paiement',
      endpoint: '/admin/payment-methods/config',
      method: 'GET',
      description: 'Vérifie que la configuration des méthodes de paiement est accessible'
    },
    {
      name: 'Statut des méthodes de paiement',
      endpoint: '/admin/payment-methods/status',
      method: 'GET',
      description: 'Vérifie que le statut des méthodes de paiement est disponible'
    },
    {
      name: 'Notifications',
      endpoint: '/admin/notifications/stats',
      method: 'GET',
      description: 'Vérifie que les statistiques des notifications sont accessibles'
    },
    {
      name: 'Tableau de bord de réconciliation',
      endpoint: '/admin/reconciliation/dashboard',
      method: 'GET',
      description: 'Vérifie que le tableau de bord de réconciliation fonctionne'
    }
  ];

  let passedTests = 0;
  let failedTests = 0;

  for (const test of tests) {
    try {
      console.log(`🔍 Test: ${test.name}`);
      console.log(`📋 Description: ${test.description}`);
      console.log(`🔗 Endpoint: ${test.endpoint}`);

      let response;
      if (test.method === 'GET') {
        response = await axios.get(`${API_BASE_URL}${test.endpoint}`, { headers });
      } else if (test.method === 'POST') {
        response = await axios.post(`${API_BASE_URL}${test.endpoint}`, test.data, { headers });
      }

      if (response.data.success) {
        console.log(`✅ PASS - Statut: ${response.status}`);
        console.log(`📊 Données: ${JSON.stringify(response.data.data).substring(0, 200)}...`);
        passedTests++;
      } else {
        console.log(`❌ FAIL - Réponse non succès: ${JSON.stringify(response.data)}`);
        failedTests++;
      }
    } catch (error) {
      console.log(`❌ FAIL - Erreur: ${error.response?.status || error.message}`);
      if (error.response?.data) {
        console.log(`📝 Détails: ${JSON.stringify(error.response.data)}`);
      }
      failedTests++;
    }
    console.log(''); // Ligne vide pour la lisibilité
  }

  console.log('📊 RÉSUMÉ DES TESTS:');
  console.log(`✅ Tests réussis: ${passedTests}`);
  console.log(`❌ Tests échoués: ${failedTests}`);
  console.log(`📈 Taux de réussite: ${((passedTests / tests.length) * 100).toFixed(1)}%`);

  // Test des webhooks
  console.log('\n🔄 Test des webhooks de paiement...');
  await testWebhooks();

  // Test d'export
  console.log('\n📤 Test d\'export de données...');
  await testExport(headers);

  console.log('\n✨ Tests terminés !');
}

// Fonction pour tester les webhooks
async function testWebhooks() {
  const webhookTests = [
    {
      name: 'Webhook Orange Money',
      endpoint: '/mobile-money-webhooks/orange',
      data: {
        transaction_id: 'TEST_ORANGE_' + Date.now(),
        status: 'SUCCESSFUL',
        amount: 5000,
        currency: 'XOF',
        phone_number: '22901020304',
        reference: 'REF_ORANGE_' + Date.now()
      }
    },
    {
      name: 'Webhook MTN MoMo',
      endpoint: '/mobile-money-webhooks/mtn',
      data: {
        transaction_id: 'TEST_MTN_' + Date.now(),
        status: 'SUCCESSFUL',
        amount: 3000,
        currency: 'XOF',
        phone_number: '22905060708',
        reference: 'REF_MTN_' + Date.now()
      }
    },
    {
      name: 'Webhook Moov Money',
      endpoint: '/mobile-money-webhooks/moov',
      data: {
        transaction_id: 'TEST_MOOV_' + Date.now(),
        status: 'SUCCESSFUL',
        amount: 2500,
        currency: 'XOF',
        phone_number: '22909101112',
        reference: 'REF_MOOV_' + Date.now()
      }
    }
  ];

  for (const test of webhookTests) {
    try {
      console.log(`🔔 Test webhook: ${test.name}`);
      const response = await axios.post(
        `${API_BASE_URL}${test.endpoint}`, 
        test.data,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data.success) {
        console.log(`✅ Webhook ${test.name} - Succès`);
      } else {
        console.log(`❌ Webhook ${test.name} - Échec: ${JSON.stringify(response.data)}`);
      }
    } catch (error) {
      console.log(`❌ Webhook ${test.name} - Erreur: ${error.response?.status || error.message}`);
    }
  }
}

// Fonction pour tester l'export
async function testExport(headers) {
  try {
    console.log('📊 Test d\'export CSV des paiements...');
    const response = await axios.get(
      `${API_BASE_URL}/admin/payments/export?format=csv&period=30`,
      { 
        headers,
        responseType: 'text'
      }
    );
    
    if (response.data) {
      console.log(`✅ Export CSV réussi - ${response.data.split('\n').length} lignes`);
      console.log(`📝 Aperçu: ${response.data.substring(0, 200)}...`);
    }
  } catch (error) {
    console.log(`❌ Export CSV échoué: ${error.response?.status || error.message}`);
  }
}

// Lancer les tests
testPaymentSystem().catch(console.error);