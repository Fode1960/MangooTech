#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const servers = [
  {
    name: 'Main Site',
    port: 3001,
    config: 'vite.config.main.js',
    description: 'Pages principales (Home, Marketplace, About, Contact)'
  },
  {
    name: 'Authentication',
    port: 3002,
    config: 'vite.config.js',
    description: 'Authentification (Login, Register, Forgot Password)'
  },
  {
    name: 'Seller Dashboard',
    port: 3003,
    config: 'vite.config.seller.js',
    description: 'Espace vendeur (Dashboard, CreateShop, Products, Orders)'
  },
  {
    name: 'Admin Panel',
    port: 3004,
    config: 'vite.config.js',
    description: 'Administration (Users, Shops, Products, Orders management)'
  }
];

const processes = [];
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

console.log('\n' + colors.bright + colors.cyan + '🚀 Démarrage de l\'architecture multi-ports Mangoo Tech...' + colors.reset + '\n');

// Fonction pour démarrer un serveur
function startServer(serverConfig, index) {
  const { name, port, config, description } = serverConfig;
  const color = [colors.green, colors.blue, colors.magenta, colors.yellow][index % 4];
  
  console.log(`${colors.bright}${color}[${name}]${colors.reset} Démarrage sur le port ${port}...`);
  console.log(`${colors.gray}  ${description}${colors.reset}`);
  
  const env = { 
    ...process.env, 
    VITE_PORT: port,
    VITE_CONFIG: config,
    VITE_SECTION: name.toLowerCase().replace(' ', '_')
  };
  
  const childProcess = spawn('npm', ['run', 'dev'], {
    stdio: 'pipe',
    shell: true,
    env: env,
    cwd: process.cwd()
  });
  
  // Gestion des logs avec couleurs
  childProcess.stdout.on('data', (data) => {
    const output = data.toString();
    if (output.includes('ready in')) {
      console.log(`${colors.bright}${color}[${name}]${colors.reset} ✅ Serveur démarré avec succès sur http://localhost:${port}`);
    }
  });
  
  childProcess.stderr.on('data', (data) => {
    const output = data.toString();
    if (!output.includes('Port') && !output.includes('trying another')) {
      console.error(`${colors.red}[${name}] Erreur: ${colors.reset}${output}`);
    }
  });
  
  childProcess.on('error', (error) => {
    console.error(`${colors.red}[${name}] Erreur critique: ${colors.reset}${error.message}`);
  });
  
  childProcess.on('exit', (code) => {
    console.log(`${colors.yellow}[${name}] Serveur arrêté avec le code ${code}${colors.reset}`);
  });
  
  processes.push({
    process: childProcess,
    name: name,
    port: port,
    color: color
  });
  
  return childProcess;
}

// Démarrer tous les serveurs
servers.forEach((server, index) => {
  setTimeout(() => {
    startServer(server, index);
  }, index * 2000); // Délai de 2 secondes entre chaque serveur
});

// Afficher le résumé
setTimeout(() => {
  console.log('\n' + colors.bright + colors.cyan + '📋 Architecture démarrée avec succès !' + colors.reset);
  console.log('\n' + colors.bright + 'URLs disponibles :' + colors.reset);
  
  servers.forEach((server, index) => {
    const color = [colors.green, colors.blue, colors.magenta, colors.yellow][index % 4];
    console.log(`  ${color}•${colors.reset} ${server.name}: ${colors.bright}http://localhost:${server.port}${colors.reset}`);
  });
  
  console.log('\n' + colors.gray + '💡 Appuyez sur Ctrl+C pour arrêter tous les serveurs' + colors.reset);
  console.log('\n' + colors.bright + colors.green + '✅ Tous les serveurs sont opérationnels !' + colors.reset + '\n');
}, 10000);

// Gestion de l'arrêt propre
function shutdown() {
  console.log('\n' + colors.yellow + '🛑 Arrêt de tous les serveurs...' + colors.reset);
  
  processes.forEach(({ process, name, color }) => {
    if (process && !process.killed) {
      console.log(`${color}[${name}]${colors.reset} Arrêt en cours...`);
      process.kill('SIGINT');
    }
  });
  
  setTimeout(() => {
    console.log(colors.green + '✅ Tous les serveurs ont été arrêtés' + colors.reset);
    process.exit(0);
  }, 3000);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Gestion des erreurs globales
process.on('uncaughtException', (error) => {
  console.error(colors.red + '❌ Erreur non capturée :' + colors.reset, error);
  shutdown();
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(colors.red + '❌ Rejet non géré :' + colors.reset, reason);
  shutdown();
});