const turn = require('node-turn');
const express = require('express');
const cors = require('cors');

/**
 * Serveur TURN/STUN pour WebRTC
 * Permet la traversée des NATs et firewalls
 * Utilise le serveur Contabo (194.163.190.74)
 */

const app = express();
app.use(cors());
app.use(express.json());

// Configuration TURN/STUN
const TURN_PORT = process.env.TURN_PORT || 3478;
const EXTERNAL_IP = process.env.EXTERNAL_IP || '194.163.190.74'; // Votre IP Contabo
const UDP_MIN_PORT = 49152;
const UDP_MAX_PORT = 65535;

// Créer le serveur TURN
const server = new turn({
  // Configuration de base
  listeningPort: TURN_PORT,
  listeningIps: ['0.0.0.0'],
  relayIps: [EXTERNAL_IP],
  externalIps: [EXTERNAL_IP],
  
  // Authentification
  authMech: 'long-term',
  credentials: {
    'mangootech': 'mangootech_secret_key_2024', // À changer en production
    'vendor': 'vendor_secret_key_2024',
    'customer': 'customer_secret_key_2024'
  },
  
  // Configuration réseau
  minPort: UDP_MIN_PORT,
  maxPort: UDP_MAX_PORT,
  
  // Logs et debugging
  debugLevel: 'INFO',
  
  // Sécurité
  maxAllocateLifetime: 3600, // 1 heure
  defaultAllocatetLifetime: 600, // 10 minutes par défaut
  maxPermissions: 50,
  
  // Quotas
  maxAllocationsPerUser: 10,
  totalAvailableCapacity: 1000,
  
  // Configuration avancée
  software: 'Mangootech TURN Server v1.0',
  realm: 'mangootech.com',
  
  // Désactiver certaines fonctionnalités si nécessaire
  disabledProtocols: [],
  
  // Filtres
  allowedPeerIps: [],
  deniedPeerIps: [],
  
  // Rate limiting
  maxRequestsPerMinute: 100
});

/**
 * Statistiques du serveur
 */
let serverStats = {
  startTime: new Date(),
  totalAllocations: 0,
  activeAllocations: 0,
  totalDataTransferred: 0,
  errorCount: 0,
  userStats: new Map()
};

/**
 * Événements du serveur TURN
 */
server.on('listening', () => {
  console.log(`[TURN] Serveur TURN/STUN démarré sur le port ${TURN_PORT}`);
  console.log(`[TURN] IP externe: ${EXTERNAL_IP}`);
  console.log(`[TURN] Plage UDP: ${UDP_MIN_PORT}-${UDP_MAX_PORT}`);
});

server.on('connection', (connection) => {
  console.log(`[TURN] Nouvelle connexion TURN de ${connection.remoteAddress}`);
  
  connection.on('allocate', (allocation) => {
    serverStats.totalAllocations++;
    serverStats.activeAllocations++;
    
    const username = allocation.username;
    if (username) {
      if (!serverStats.userStats.has(username)) {
        serverStats.userStats.set(username, {
          allocations: 0,
          dataTransferred: 0,
          firstSeen: new Date()
        });
      }
      
      const userStats = serverStats.userStats.get(username);
      userStats.allocations++;
      userStats.lastSeen = new Date();
    }
    
    console.log(`[TURN] Allocation créée pour ${username || 'anonymous'}`);
  });
  
  connection.on('close', () => {
    serverStats.activeAllocations--;
    console.log(`[TURN] Connexion TURN fermée`);
  });
  
  connection.on('error', (error) => {
    serverStats.errorCount++;
    console.error(`[TURN] Erreur TURN:`, error);
  });
});

server.on('error', (error) => {
  serverStats.errorCount++;
  console.error(`[TURN] Erreur serveur TURN:`, error);
});

/**
 * Configuration STUN simple (sans authentification)
 */
const stunConfig = {
  port: 3478,
  host: EXTERNAL_IP,
  debug: true
};

/**
 * Routes API pour la gestion TURN
 */
app.get('/api/turn/config', (req, res) => {
  const { username, role = 'customer' } = req.query;
  
  if (!username) {
    return res.status(400).json({ error: 'Username required' });
  }
  
  // Générer des credentials temporaires
  const timestamp = Math.floor(Date.now() / 1000);
  const expiry = timestamp + 3600; // 1 heure
  const password = generateTurnPassword(username, expiry, role);
  
  res.json({
    iceServers: [
      {
        urls: [`stun:${EXTERNAL_IP}:3478`],
        username: username,
        credential: password
      },
      {
        urls: [`turn:${EXTERNAL_IP}:3478`],
        username: username,
        credential: password
      },
      {
        urls: [`turn:${EXTERNAL_IP}:3478?transport=tcp`],
        username: username,
        credential: password
      }
    ],
    iceTransportPolicy: 'all',
    bundlePolicy: 'max-bundle',
    rtcpMuxPolicy: 'require',
    credentials: {
      username: username,
      password: password,
      expiresAt: expiry * 1000
    }
  });
});

/**
 * Statistiques du serveur TURN
 */
app.get('/api/turn/stats', (req, res) => {
  const uptime = Date.now() - serverStats.startTime.getTime();
  
  res.json({
    server: {
      uptime: uptime,
      startTime: serverStats.startTime,
      externalIp: EXTERNAL_IP,
      port: TURN_PORT,
      udpRange: `${UDP_MIN_PORT}-${UDP_MAX_PORT}`
    },
    allocations: {
      total: serverStats.totalAllocations,
      active: serverStats.activeAllocations,
      totalDataTransferred: serverStats.totalDataTransferred
    },
    errors: {
      total: serverStats.errorCount,
      rate: serverStats.errorCount / (uptime / 1000 / 60) // erreurs par minute
    },
    users: Array.from(serverStats.userStats.entries()).map(([username, stats]) => ({
      username,
      allocations: stats.allocations,
      dataTransferred: stats.dataTransferred,
      firstSeen: stats.firstSeen,
      lastSeen: stats.lastSeen
    }))
  });
});

/**
 * Health check
 */
app.get('/api/turn/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date(),
    uptime: Date.now() - serverStats.startTime.getTime(),
    activeAllocations: serverStats.activeAllocations
  });
});

/**
 * Génère un mot de passe TURN basé sur le temps
 * Utilise la méthode HMAC pour la sécurité
 */
function generateTurnPassword(username, expiry, role = 'customer') {
  const crypto = require('crypto');
  const secret = getRoleSecret(role);
  const hmac = crypto.createHmac('sha1', secret);
  hmac.update(`${username}:${expiry}`);
  return hmac.digest('base64');
}

/**
 * Obtient le secret selon le rôle
 */
function getRoleSecret(role) {
  const secrets = {
    'mangootech': 'mangootech_master_secret_2024',
    'vendor': 'vendor_secret_key_2024',
    'customer': 'customer_secret_key_2024'
  };
  
  return secrets[role] || secrets['customer'];
}

/**
 * Test de connectivité STUN
 */
app.get('/api/turn/test-stun', async (req, res) => {
  try {
    // Test STUN simple
    const stun = require('stun');
    
    const response = await stun.request(`${EXTERNAL_IP}:3478`, {
      timeout: 5000
    });
    
    res.json({
      success: true,
      mappedAddress: response.getXorAddress(),
      software: response.getSoftware(),
      server: `${EXTERNAL_IP}:3478`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      server: `${EXTERNAL_IP}:3478`
    });
  }
});

/**
 * Configuration du pare-feu et sécurité
 */
const securityConfig = {
  // Limite le nombre de connexions par IP
  maxConnectionsPerIp: 10,
  
  // Rate limiting
  maxRequestsPerMinute: 60,
  
  // IP blacklist (à configurer selon vos besoins)
  blacklistedIps: [],
  
  // Pays autorisés (optionnel)
  allowedCountries: []
};

/**
 * Middleware de sécurité
 */
app.use((req, res, next) => {
  const clientIp = req.ip || req.connection.remoteAddress;
  
  // Vérifier IP blacklist
  if (securityConfig.blacklistedIps.includes(clientIp)) {
    return res.status(403).json({ error: 'IP blocked' });
  }
  
  // Rate limiting simple
  // (À implémenter avec Redis pour une solution scalable)
  
  next();
});

/**
 * Configuration pour la production
 */
if (process.env.NODE_ENV === 'production') {
  // Logs plus détaillés
  server.on('listening', () => {
    console.log(`[TURN] Production mode activé`);
    console.log(`[TURN] Monitoring: http://localhost:${TURN_PORT}/api/turn/stats`);
  });
}

/**
 * Gestion de l'arrêt gracieux
 */
process.on('SIGTERM', () => {
  console.log('[TURN] Arrêt du serveur TURN...');
  server.stop(() => {
    console.log('[TURN] Serveur TURN arrêté');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('[TURN] Arrêt forcé du serveur TURN...');
  server.stop(() => {
    console.log('[TURN] Serveur TURN arrêté');
    process.exit(0);
  });
});

// Démarrer le serveur
server.start();

// Démarrer le serveur HTTP d'API
const API_PORT = process.env.API_PORT || 8081;
app.listen(API_PORT, () => {
  console.log(`[TURN] API TURN démarrée sur le port ${API_PORT}`);
  console.log(`[TURN] Configuration: http://localhost:${API_PORT}/api/turn/config`);
  console.log(`[TURN] Statistiques: http://localhost:${API_PORT}/api/turn/stats`);
  console.log(`[TURN] Health check: http://localhost:${API_PORT}/api/turn/health`);
});

module.exports = { server, app };