#!/usr/bin/env node

import { spawn } from 'child_process';

console.log('🚀 Démarrage de l\'architecture multi-ports Mangoo Tech...\n');

const servers = [
  {
    name: 'Main Site',
    port: 3001,
    command: 'npm run dev:main',
    description: 'Pages principales (Home, Marketplace, About, Contact)',
    color: '\x1b[32m' // Vert
  },
  {
    name: 'Authentication',
    port: 3002,
    command: 'npm run dev:auth',
    description: 'Authentification (Login, Register, Forgot Password)',
    color: '\x1b[34m' // Bleu
  },
  {
    name: 'Seller Dashboard',
    port: 3003,
    command: 'npm run dev:seller',
    description: 'Espace vendeur (Dashboard, CreateShop, Products, Orders)',
    color: '\x1b[35m' // Magenta
  },
  {
    name: 'Admin Panel',
    port: 3004,
    command: 'npm run dev:admin',
    description: 'Administration (Users, Shops, Products, Orders management)',
    color: '\x1b[33m' // Jaune
  }
];

const processes = [];
const resetColor = '\x1b[0m';

// Fonction pour démarrer un serveur
function startServer(serverConfig, index) {
  const { name, port, command, description, color } = serverConfig;
  
  console.log(`${color}[${name}]${resetColor} Démarrage sur le port ${port}...`);
  console.log(`  ${description}`);
  
  const childProcess = spawn(command, [], {
    stdio: 'pipe',
    shell: true,
    env: { ...process.env, VITE_PORT: port }
  });
  
  // Gestion des logs
  childProcess.stdout.on('data', (data) => {
    const output = data.toString();
    if (output.includes('ready in')) {
      console.log(`${color}[${name}]${resetColor} ✅ Serveur démarré avec succès sur http://localhost:${port}`);
    }
  });
  
  childProcess.stderr.on('data', (data) => {
    const output = data.toString();
    if (!output.includes('Port') && !output.includes('trying another')) {
      console.error(`${color}[${name}]${resetColor} ⚠️  ${output}`);
    }
  });
  
  childProcess.on('error', (error) => {
    console.error(`${color}[${name}]${resetColor} ❌ Erreur: ${error.message}`);
  });
  
  childProcess.on('exit', (code) => {
    console.log(`${color}[${name}]${resetColor} 👋 Serveur arrêté avec le code ${code}`);
  });
  
  processes.push({
    process: childProcess,
    name: name,
    port: port,
    color: color
  });
}

// Démarrer tous les serveurs
servers.forEach((server, index) => {
  setTimeout(() => {
    startServer(server, index);
  }, index * 3000); // Délai de 3 secondes entre chaque serveur
});

// Afficher le résumé
setTimeout(() => {
  console.log('\n' + '\x1b[1m\x1b[36m' + '📋 Architecture démarrée avec succès !' + resetColor);
  console.log('\n' + '\x1b[1m' + 'URLs disponibles :' + resetColor);
  
  servers.forEach((server) => {
    console.log(`  ${server.color}•${resetColor} ${server.name}: ${'\x1b[1m'}http://localhost:${server.port}${resetColor}`);
  });
  
  console.log('\n' + '\x1b[90m' + '💡 Appuyez sur Ctrl+C pour arrêter tous les serveurs' + resetColor);
  console.log('\n' + '\x1b[1m\x1b[32m' + '✅ Tous les serveurs sont opérationnels !' + resetColor + '\n');
}, 15000);

// Gestion de l'arrêt propre
function shutdown() {
  console.log('\n' + '\x1b[33m' + '🛑 Arrêt de tous les serveurs...' + resetColor);
  
  processes.forEach(({ process, name, color }) => {
    if (process && !process.killed) {
      console.log(`${color}[${name}]${resetColor} Arrêt en cours...`);
      process.kill('SIGINT');
    }
  });
  
  setTimeout(() => {
    console.log('\x1b[32m' + '✅ Tous les serveurs ont été arrêtés' + resetColor);
    process.exit(0);
  }, 3000);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Gestion des erreurs globales
process.on('uncaughtException', (error) => {
  console.error('\x1b[31m' + '❌ Erreur non capturée :' + resetColor, error);
  shutdown();
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('\x1b[31m' + '❌ Rejet non géré :' + resetColor, reason);
  shutdown();
});