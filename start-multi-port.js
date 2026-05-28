#!/usr/bin/env node

const { spawn } = require('child_process');
const { getAllConfigs } = require('./multi-port.config.js');

const configs = getAllConfigs();
const processes = [];

console.log('🚀 Démarrage des serveurs multi-ports...\n');

Object.entries(configs).forEach(([section, config]) => {
  console.log(`📍 Démarrage du serveur ${section} sur le port ${config.port}...`);
  
  const env = { ...process.env, VITE_PORT: config.port };
  
  const childProcess = spawn('npm', ['run', 'dev'], {
    stdio: 'inherit',
    shell: true,
    env: env
  });
  
  processes.push(childProcess);
  
  childProcess.on('error', (error) => {
    console.error(`❌ Erreur lors du démarrage du serveur ${section}:`, error);
  });
  
  childProcess.on('exit', (code) => {
    console.log(`👋 Serveur ${section} arrêté avec le code ${code}`);
  });
});

// Gestion de l'arrêt propre
process.on('SIGINT', () => {
  console.log('\n🛑 Arrêt de tous les serveurs...');
  processes.forEach(proc => {
    if (proc && !proc.killed) {
      proc.kill('SIGINT');
    }
  });
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Arrêt de tous les serveurs...');
  processes.forEach(proc => {
    if (proc && !proc.killed) {
      proc.kill('SIGTERM');
    }
  });
  process.exit(0);
});

console.log('\n✅ Tous les serveurs ont été démarrés !');
console.log('📋 URLs disponibles :');
Object.entries(configs).forEach(([section, config]) => {
  console.log(`  • ${section}: http://localhost:${config.port}`);
});
console.log('\n💡 Appuyez sur Ctrl+C pour arrêter tous les serveurs');