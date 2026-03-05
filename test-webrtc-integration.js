#!/usr/bin/env node

/**
 * Script de Test d'Intégration WebRTC-VoIP
 * MangooTech Communication Platform
 */

const http = require('http');
const WebSocket = require('ws');
const axios = require('axios');

// Configuration des serveurs
const SERVERS = {
  signaling: {
    host: 'localhost',
    port: 8080,
    path: '/health'
  },
  turn: {
    host: 'localhost', 
    port: 8081,
    path: '/turn/health'
  },
  gateway: {
    host: 'localhost',
    port: 8082,
    path: '/gateway/health'
  },
  contabo: {
    host: '194.163.190.74',
    port: 5060,
    protocol: 'udp'
  }
};

// Couleurs pour la console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m'
};

// Fonction de test HTTP
async function testHttpServer(serverName, config) {
  return new Promise((resolve) => {
    const options = {
      hostname: config.host,
      port: config.port,
      path: config.path,
      method: 'GET',
      timeout: 5000
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log(`${colors.green}✅${colors.reset} ${serverName}: Serveur actif`);
          try {
            const response = JSON.parse(data);
            console.log(`   Status: ${response.status || 'OK'}`);
            console.log(`   Uptime: ${response.uptime || 'N/A'}`);
          } catch (e) {
            console.log(`   Réponse: ${data}`);
          }
          resolve(true);
        } else {
          console.log(`${colors.red}❌${colors.reset} ${serverName}: HTTP ${res.statusCode}`);
          resolve(false);
        }
      });
    });

    req.on('error', (error) => {
      console.log(`${colors.red}❌${colors.reset} ${serverName}: ${error.message}`);
      resolve(false);
    });

    req.on('timeout', () => {
      console.log(`${colors.yellow}⚠️${colors.reset} ${serverName}: Timeout`);
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

// Fonction de test WebSocket
async function testWebSocket(serverName, config) {
  return new Promise((resolve) => {
    const ws = new WebSocket(`ws://${config.host}:${config.port}`);
    let connected = false;

    ws.on('open', () => {
      console.log(`${colors.green}✅${colors.reset} ${serverName}: WebSocket connecté`);
      connected = true;
      
      // Test d'un message simple
      ws.send(JSON.stringify({
        type: 'test',
        message: 'Test de connexion WebRTC'
      }));
    });

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data);
        console.log(`   Réponse: ${message.type || 'message reçu'}`);
      } catch (e) {
        console.log(`   Réponse: ${data}`);
      }
      ws.close();
      resolve(true);
    });

    ws.on('error', (error) => {
      console.log(`${colors.red}❌${colors.reset} ${serverName}: WebSocket erreur - ${error.message}`);
      resolve(false);
    });

    ws.on('close', () => {
      if (!connected) {
        console.log(`${colors.red}❌${colors.reset} ${serverName}: WebSocket fermé`);
      }
      resolve(connected);
    });

    // Timeout
    setTimeout(() => {
      if (ws.readyState === WebSocket.CONNECTING) {
        console.log(`${colors.yellow}⚠️${colors.reset} ${serverName}: WebSocket timeout`);
        ws.terminate();
        resolve(false);
      }
    }, 5000);
  });
}

// Fonction de test de passerelle SIP
async function testSIPGateway() {
  console.log(`\n${colors.blue}🔄 Test de la passerelle SIP-WebRTC${colors.reset}`);
  
  try {
    // Test de création de session
    const response = await axios.post('http://localhost:8082/gateway/test', {
      action: 'create_session',
      from: 'sip:100@mangoo-connect.local',
      to: 'sip:200@mangoo-connect.local'
    });

    if (response.data.success) {
      console.log(`${colors.green}✅${colors.reset} Passerelle SIP: Session créée`);
      console.log(`   Session ID: ${response.data.sessionId}`);
      return true;
    } else {
      console.log(`${colors.red}❌${colors.reset} Passerelle SIP: ${response.data.error}`);
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}❌${colors.reset} Passerelle SIP: ${error.message}`);
    return false;
  }
}

// Fonction de test de connexion TURN
async function testTURNConnection() {
  console.log(`\n${colors.blue}🔄 Test du serveur TURN${colors.reset}`);
  
  try {
    const response = await axios.get('http://localhost:8081/turn/config');
    
    if (response.data) {
      console.log(`${colors.green}✅${colors.reset} Serveur TURN: Configuration obtenue`);
      console.log(`   Serveur: ${response.data.server}`);
      console.log(`   Port: ${response.data.port}`);
      return true;
    } else {
      console.log(`${colors.red}❌${colors.reset} Serveur TURN: Pas de configuration`);
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}❌${colors.reset} Serveur TURN: ${error.message}`);
    return false;
  }
}

// Fonction de test d'appel WebRTC
async function testWebRTCCall() {
  console.log(`\n${colors.blue}🔄 Test d'appel WebRTC${colors.reset}`);
  
  return new Promise((resolve) => {
    const ws = new WebSocket('ws://localhost:8080');
    
    ws.on('open', () => {
      console.log(`${colors.green}✅${colors.reset} Connexion WebRTC établie`);
      
      // Simuler une demande d'appel
      ws.send(JSON.stringify({
        type: 'call_request',
        from: 'vendor-123',
        to: 'customer-456',
        callType: 'video'
      }));
    });

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data);
        
        if (message.type === 'call_accepted') {
          console.log(`${colors.green}✅${colors.reset} Appel accepté`);
          ws.close();
          resolve(true);
        } else if (message.type === 'call_rejected') {
          console.log(`${colors.yellow}⚠️${colors.reset} Appel rejeté`);
          ws.close();
          resolve(false);
        }
      } catch (e) {
        console.log(`${colors.red}❌${colors.reset} Erreur de parsing: ${e.message}`);
      }
    });

    ws.on('error', (error) => {
      console.log(`${colors.red}❌${colors.reset} Erreur WebRTC: ${error.message}`);
      resolve(false);
    });

    // Timeout après 10 secondes
    setTimeout(() => {
      console.log(`${colors.yellow}⚠️${colors.reset} Timeout d'appel WebRTC`);
      ws.close();
      resolve(false);
    }, 10000);
  });
}

// Fonction de test de performance
async function testPerformance() {
  console.log(`\n${colors.blue}🔄 Test de performance${colors.reset}`);
  
  const startTime = Date.now();
  const results = {
    signaling: 0,
    turn: 0,
    gateway: 0,
    total: 0
  };

  // Test parallèle des serveurs
  const promises = [
    testHttpServer('Serveur Signalisation', SERVERS.signaling).then(r => {
      results.signaling = Date.now() - startTime;
      return r;
    }),
    testTURNConnection().then(r => {
      results.turn = Date.now() - startTime;
      return r;
    }),
    testSIPGateway().then(r => {
      results.gateway = Date.now() - startTime;
      return r;
    })
  ];

  const resultsArray = await Promise.all(promises);
  results.total = Date.now() - startTime;

  console.log(`\n${colors.magenta}📊 Résultats de Performance${colors.reset}`);
  console.log(`   Temps total: ${results.total}ms`);
  console.log(`   Signalisation: ${results.signaling}ms`);
  console.log(`   TURN: ${results.turn}ms`);
  console.log(`   Passerelle: ${results.gateway}ms`);

  return resultsArray.every(r => r);
}

// Fonction principale de test
async function runIntegrationTests() {
  console.log(`${colors.magenta}🚀 Démarrage des Tests d'Intégration WebRTC-VoIP${colors.reset}`);
  console.log(`${colors.magenta}════════════════════════════════════════════════════════${colors.reset}\n`);

  let successCount = 0;
  let totalTests = 0;

  // Tests de base
  console.log(`${colors.blue}📋 Tests de Connexion${colors.reset}`);
  const basicTests = [
    testHttpServer('Serveur Signalisation', SERVERS.signaling),
    testHttpServer('Serveur TURN', SERVERS.turn),
    testHttpServer('Passerelle SIP', SERVERS.gateway)
  ];

  const basicResults = await Promise.all(basicTests);
  successCount += basicResults.filter(r => r).length;
  totalTests += basicTests.length;

  // Tests WebSocket
  console.log(`\n${colors.blue}🔗 Tests WebSocket${colors.reset}`);
  const wsResult = await testWebSocket('WebRTC Signalisation', SERVERS.signaling);
  if (wsResult) successCount++;
  totalTests++;

  // Tests avancés
  console.log(`\n${colors.blue}🔧 Tests Avancés${colors.reset}`);
  const advancedTests = [
    testTURNConnection(),
    testSIPGateway(),
    testWebRTCCall()
  ];

  const advancedResults = await Promise.all(advancedTests);
  successCount += advancedResults.filter(r => r).length;
  totalTests += advancedTests.length;

  // Test de performance
  console.log(`\n${colors.blue}⚡ Test de Performance${colors.reset}`);
  const perfResult = await testPerformance();
  if (perfResult) successCount++;
  totalTests++;

  // Résumé final
  console.log(`\n${colors.magenta}════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.magenta}📊 RÉSUMÉ DES TESTS${colors.reset}`);
  console.log(`${colors.magenta}════════════════════════════════════════════════════════${colors.reset}`);
  
  if (successCount === totalTests) {
    console.log(`${colors.green}✅ TOUS LES TESTS ONT RÉUSSI !${colors.reset}`);
    console.log(`   ${successCount}/${totalTests} tests passés`);
    console.log(`\n${colors.green}🎉 L'intégration WebRTC-VoIP est fonctionnelle !${colors.reset}`);
  } else {
    console.log(`${colors.red}❌ CERTAINS TESTS ONT ÉCHOUÉ${colors.reset}`);
    console.log(`   ${successCount}/${totalTests} tests passés`);
    console.log(`\n${colors.yellow}⚠️  Veuillez vérifier la configuration et les logs${colors.reset}`);
  }

  console.log(`\n${colors.blue}💡 Prochaines Étapes${colors.reset}`);
  console.log(`   1. Vérifiez les logs des serveurs`);
  console.log(`   2. Testez les appels depuis l'interface web`);
  console.log(`   3. Configurez vos numéros SIP dans le tableau de bord`);
  console.log(`   4. Lancez une session de live shopping`);
}

// Vérification des dépendances
function checkDependencies() {
  try {
    require('ws');
    require('axios');
    return true;
  } catch (error) {
    console.log(`${colors.red}❌ Dépendances manquantes:${colors.reset}`);
    console.log(`   npm install ws axios`);
    return false;
  }
}

// Exécution principale
if (require.main === module) {
  if (checkDependencies()) {
    runIntegrationTests().catch(error => {
      console.error(`${colors.red}❌ Erreur fatale:${colors.reset}`, error);
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
}

module.exports = {
  testHttpServer,
  testWebSocket,
  testSIPGateway,
  testTURNConnection,
  testWebRTCCall,
  testPerformance,
  runIntegrationTests
};