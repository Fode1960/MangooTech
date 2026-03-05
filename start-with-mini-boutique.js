#!/usr/bin/env node

const { spawn } = require('child_process');
const { startMiniBoutiqueIfNeeded } = require('./check-and-start-mini-boutique.js');
const miniBoutiqueMonitor = require('./mini-boutique-monitor.js');

console.log('🚀 Démarrage de la plateforme MangooTech avec Mini-Boutique...');

// Fonction pour démarrer le serveur principal
function startMainServer() {
  console.log('🏢 Démarrage du serveur principal...');
  
  const mainProcess = spawn('npm', ['run', 'dev:simple'], {
    stdio: 'inherit',
    shell: true
  });

  mainProcess.on('error', (error) => {
    console.error('❌ Erreur lors du démarrage du serveur principal:', error);
  });

  return mainProcess;
}

// Fonction pour attendre que le serveur principal soit prêt
function waitForMainServer() {
  return new Promise((resolve) => {
    console.log('⏳ Attente du démarrage du serveur principal...');
    
    // Attendre 3 secondes pour laisser le temps au serveur principal de démarrer
    setTimeout(() => {
      console.log('✅ Serveur principal prêt !');
      resolve();
    }, 3000);
  });
}

// Fonction principale de démarrage
async function startAll() {
  try {
    // Démarrer le serveur principal
    const mainProcess = startMainServer();
    
    // Attendre que le serveur principal soit prêt
    await waitForMainServer();
    
    // Vérifier et démarrer le Mini-Boutique si nécessaire
    console.log('🛍️ Vérification et démarrage de Mini-Boutique...');
    await startMiniBoutiqueIfNeeded();
    
    // Démarrer la surveillance du Mini-Boutique
    console.log('📊 Démarrage de la surveillance du Mini-Boutique...');
    miniBoutiqueMonitor.startMonitoring();
    
    console.log('\n🎉 Plateforme complète démarrée avec succès !');
    console.log('📍 Serveur principal: http://localhost:5173');
    console.log('🛍️ Mini-Boutique: http://localhost:3007 ou http://localhost:3009');
    console.log('📊 Surveillance: Activée (vérification toutes les 30 secondes)');
    console.log('\n💡 Appuyez sur Ctrl+C pour arrêter tous les services');
    
    // Gestion de l'arrêt propre
    process.on('SIGINT', () => {
      console.log('\n🛑 Arrêt en cours...');
      miniBoutiqueMonitor.stopMonitoring();
      const miniBoutiqueManager = require('./mini-boutique-manager.js');
      miniBoutiqueManager.stop();
      mainProcess.kill('SIGTERM');
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      console.log('\n🛑 Arrêt forcé...');
      miniBoutiqueMonitor.stopMonitoring();
      const miniBoutiqueManager = require('./mini-boutique-manager.js');
      miniBoutiqueManager.stop();
      mainProcess.kill('SIGTERM');
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Erreur lors du démarrage:', error);
    process.exit(1);
  }
}

// Démarrer tout
startAll();