#!/usr/bin/env node

/**
 * Script de démarrage des serveurs WebRTC
 * Lance le serveur de signalisation et le serveur TURN/STUN
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Démarrage des serveurs WebRTC Mangootech...\n');

// Configuration des serveurs
const servers = [
  {
    name: 'Signaling Server',
    script: 'signaling-server.js',
    port: 8080,
    color: '\x1b[36m' // Cyan
  },
  {
    name: 'TURN/STUN Server',
    script: 'turn-server.js',
    port: 8081,
    color: '\x1b[35m' // Magenta
  }
];

// Variables d'environnement
const env = {
  ...process.env,
  NODE_ENV: process.env.NODE_ENV || 'development',
  EXTERNAL_IP: process.env.EXTERNAL_IP || '194.163.190.74', // IP Contabo
  SIGNALING_PORT: process.env.SIGNALING_PORT || '8080',
  TURN_PORT: process.env.TURN_PORT || '3478',
  API_PORT: process.env.API_PORT || '8081'
};

// Stockage des processus
const processes = new Map();

/**
 * Démarre un serveur
 */
function startServer(serverConfig) {
  return new Promise((resolve, reject) => {
    const { name, script, port, color } = serverConfig;
    const scriptPath = path.join(__dirname, script);
    
    console.log(`${color}[${name}]\x1b[0m Démarrage sur le port ${port}...`);
    
    const child = spawn('node', [scriptPath], {
      env: env,
      stdio: 'pipe'
    });
    
    // Gestion de la sortie standard
    child.stdout.on('data', (data) => {
      const output = data.toString().trim();
      output.split('\n').forEach(line => {
        if (line.trim()) {
          console.log(`${color}[${name}]\x1b[0m ${line}`);
        }
      });
    });
    
    // Gestion des erreurs
    child.stderr.on('data', (data) => {
      const output = data.toString().trim();
      output.split('\n').forEach(line => {
        if (line.trim()) {
          console.error(`${color}[${name}]\x1b[31m [ERROR]\x1b[0m ${line}`);
        }
      });
    });
    
    // Gestion de la fermeture
    child.on('close', (code) => {
      console.log(`${color}[${name}]\x1b[0m Processus arrêté avec le code ${code}`);
      processes.delete(name);
      
      // Si un serveur s'arrête, on arrête tous les autres
      if (code !== 0) {
        console.log('\x1b[31m[SYSTEM]\x1b[0m Un serveur s\'est arrêté. Arrêt de tous les serveurs...');
        stopAllServers();
      }
    });
    
    // Gestion des erreurs de spawn
    child.on('error', (error) => {
      console.error(`${color}[${name}]\x1b[31m [SPAWN ERROR]\x1b[0m ${error.message}`);
      reject(error);
    });
    
    // Attendre que le serveur soit prêt
    let ready = false;
    child.stdout.on('data', (data) => {
      if (!ready && data.toString().includes('démarré')) {
        ready = true;
        console.log(`${color}[${name}]\x1b[0m \x1b[32m✓\x1b[0m Serveur démarré avec succès`);
        processes.set(name, child);
        resolve(child);
      }
    });
    
    // Timeout de démarrage
    setTimeout(() => {
      if (!ready) {
        console.warn(`${color}[${name}]\x1b[0m \x1b[33m⚠\x1b[0m Démarrage en cours... (vérifiez les logs)`);
        processes.set(name, child);
        resolve(child);
      }
    }, 3000);
  });
}

/**
 * Arrête tous les serveurs
 */
function stopAllServers() {
  console.log('\n\x1b[31m[SYSTEM]\x1b[0m Arrêt de tous les serveurs...');
  
  processes.forEach((child, name) => {
    console.log(`\x1b[31m[SYSTEM]\x1b[0m Arrêt de ${name}...`);
    child.kill('SIGTERM');
  });
  
  setTimeout(() => {
    processes.forEach((child, name) => {
      if (!child.killed) {
        console.log(`\x1b[31m[SYSTEM]\x1b[0m Force l\'arrêt de ${name}...`);
        child.kill('SIGKILL');
      }
    });
    
    setTimeout(() => {
      console.log('\x1b[31m[SYSTEM]\x1b[0m Tous les serveurs arrêtés');
      process.exit(0);
    }, 1000);
  }, 2000);
}

/**
 * Vérifie la disponibilité des ports
 */
async function checkPortAvailability(port) {
  const net = require('net');
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(false);
      } else {
        resolve(true);
      }
    });
    
    server.once('listening', () => {
      server.close();
      resolve(true);
    });
    
    server.listen(port);
  });
}

/**
 * Affiche l'état des serveurs
 */
function displayServerStatus() {
  console.log('\n📊 État des serveurs WebRTC:');
  console.log('=' .repeat(50));
  
  servers.forEach(server => {
    const isRunning = processes.has(server.name);
    const status = isRunning ? '\x1b[32m✓ EN LIGNE\x1b[0m' : '\x1b[31m✓ HORS LIGNE\x1b[0m';
    console.log(`${server.color}${server.name}\x1b[0m: ${status} (port ${server.port})`);
  });
  
  console.log('\n🔗 Endpoints disponibles:');
  console.log('  • Signalisation WebSocket: ws://localhost:8080');
  console.log('  • API TURN/STUN: http://localhost:8081/api/turn/config');
  console.log('  • Statistiques: http://localhost:8081/api/turn/stats');
  console.log('  • Health Check: http://localhost:8081/api/turn/health');
  
  console.log('\n⚙️  Configuration:');
  console.log(`  • IP Externe: ${env.EXTERNAL_IP}`);
  console.log(`  • Environnement: ${env.NODE_ENV}`);
  console.log('\n');
}

/**
 * Fonction principale
 */
async function main() {
  try {
    // Vérifier la disponibilité des ports
    console.log('🔍 Vérification des ports...');
    
    for (const server of servers) {
      const isAvailable = await checkPortAvailability(server.port);
      if (!isAvailable) {
        console.error(`\x1b[31m[ERROR]\x1b[0m Le port ${server.port} est déjà utilisé`);
        process.exit(1);
      }
    }
    
    console.log('\x1b[32m✓\x1b[0m Tous les ports sont disponibles\n');
    
    // Démarrer tous les serveurs
    console.log('🚀 Démarrage des serveurs...\n');
    
    for (const server of servers) {
      try {
        await startServer(server);
      } catch (error) {
        console.error(`\x1b[31m[ERROR]\x1b[0m Échec du démarrage de ${server.name}:`, error.message);
        stopAllServers();
        return;
      }
    }
    
    // Afficher l'état
    setTimeout(displayServerStatus, 1000);
    
    // Gestion de l'arrêt gracieux
    process.on('SIGINT', () => {
      console.log('\n\x1b[33m[SYSTEM]\x1b[0m Signal SIGINT reçu');
      stopAllServers();
    });
    
    process.on('SIGTERM', () => {
      console.log('\n\x1b[33m[SYSTEM]\x1b[0m Signal SIGTERM reçu');
      stopAllServers();
    });
    
    // Gestion des erreurs non capturées
    process.on('uncaughtException', (error) => {
      console.error('\x1b[31m[SYSTEM]\x1b[0m Exception non capturée:', error);
      stopAllServers();
    });
    
    process.on('unhandledRejection', (reason, promise) => {
      console.error('\x1b[31m[SYSTEM]\x1b[0m Rejet non géré:', reason);
      stopAllServers();
    });
    
    console.log('\x1b[32m[SYSTEM]\x1b[0m Tous les serveurs sont démarrés. Ctrl+C pour arrêter.\n');
    
  } catch (error) {
    console.error('\x1b[31m[SYSTEM]\x1b[0m Erreur lors du démarrage:', error.message);
    process.exit(1);
  }
}

// Vérifier les dépendances
function checkDependencies() {
  const requiredPackages = ['ws', 'express', 'cors', 'node-turn', 'stun'];
  const missingPackages = [];
  
  requiredPackages.forEach(pkg => {
    try {
      require.resolve(pkg);
    } catch (error) {
      missingPackages.push(pkg);
    }
  });
  
  if (missingPackages.length > 0) {
    console.error('\x1b[31m[ERROR]\x1b[0m Packages manquants:');
    missingPackages.forEach(pkg => {
      console.error(`  - ${pkg}`);
    });
    console.error('\nInstallez-les avec: npm install ' + missingPackages.join(' '));
    process.exit(1);
  }
}

// Vérifier Node.js version
function checkNodeVersion() {
  const version = process.version;
  const major = parseInt(version.slice(1).split('.')[0]);
  
  if (major < 14) {
    console.error(`\x1b[31m[ERROR]\x1b[0m Node.js ${version} n'est pas supporté. Minimum: v14.0.0`);
    process.exit(1);
  }
}

// Script d'installation des dépendances
function installDependencies() {
  console.log('\n📦 Installation des dépendances WebRTC...\n');
  
  const dependencies = ['ws', 'express', 'cors', 'node-turn', 'stun'];
  
  const npm = spawn('npm', ['install', ...dependencies, '--save'], {
    stdio: 'inherit',
    cwd: path.join(__dirname, '../..')
  });
  
  npm.on('close', (code) => {
    if (code === 0) {
      console.log('\x1b[32m✓\x1b[0m Dépendances installées avec succès');
      main();
    } else {
      console.error('\x1b[31m✗\x1b[0m Échec de l\'installation des dépendances');
      process.exit(1);
    }
  });
}

// Point d'entrée
if (require.main === module) {
  checkNodeVersion();
  
  // Vérifier si on doit installer les dépendances
  if (process.argv.includes('--install')) {
    installDependencies();
  } else {
    checkDependencies();
    main();
  }
}

module.exports = { startServer, stopAllServers, displayServerStatus };