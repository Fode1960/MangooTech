// Script de Monitoring des Performances
// Surveille les métriques des optimisations implémentées

import https from 'https';
import http from 'http';
import { performance } from 'perf_hooks';

// Configuration du monitoring
const CONFIG = {
  // URLs à surveiller (à modifier avec vos vraies URLs)
  PRODUCTION_URL: 'https://your-app.vercel.app', // Remplacez par votre URL
  SUPABASE_PROJECT: 'your-project', // Remplacez par votre projet
  
  // Intervalles de monitoring (en millisecondes)
  MONITORING_INTERVAL: 30000, // 30 secondes
  CACHE_CHECK_INTERVAL: 60000, // 1 minute
  
  // Seuils de performance
  THRESHOLDS: {
    RESPONSE_TIME: 2000, // 2 secondes max
    CACHE_HIT_RATE: 0.8, // 80% minimum
    ERROR_RATE: 0.05 // 5% maximum
  }
};

// Métriques globales
const metrics = {
  requests: {
    total: 0,
    successful: 0,
    failed: 0,
    totalResponseTime: 0
  },
  cache: {
    hits: 0,
    misses: 0,
    totalRequests: 0
  },
  performance: {
    averageResponseTime: 0,
    minResponseTime: Infinity,
    maxResponseTime: 0
  },
  errors: [],
  startTime: Date.now()
};

// Fonction utilitaire pour faire des requêtes HTTP/HTTPS
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const startTime = performance.now();
    const protocol = url.startsWith('https:') ? https : http;
    
    const req = protocol.get(url, {
      timeout: 10000,
      ...options
    }, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const endTime = performance.now();
        const responseTime = endTime - startTime;
        
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data,
          responseTime,
          success: res.statusCode >= 200 && res.statusCode < 300
        });
      });
    });
    
    req.on('error', (error) => {
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      reject({
        error: error.message,
        responseTime,
        success: false
      });
    });
    
    req.on('timeout', () => {
      req.destroy();
      reject({
        error: 'Request timeout',
        responseTime: 10000,
        success: false
      });
    });
  });
}

// Test de performance de l'application
async function testApplicationPerformance() {
  console.log('🔍 Test de performance de l\'application...');
  
  try {
    const result = await makeRequest(CONFIG.PRODUCTION_URL);
    
    // Mettre à jour les métriques
    metrics.requests.total++;
    metrics.requests.totalResponseTime += result.responseTime;
    
    if (result.success) {
      metrics.requests.successful++;
      console.log(`✅ Application accessible en ${result.responseTime.toFixed(2)}ms`);
    } else {
      metrics.requests.failed++;
      console.log(`❌ Erreur HTTP: ${result.statusCode}`);
    }
    
    // Mettre à jour les statistiques de performance
    updatePerformanceStats(result.responseTime);
    
    // Vérifier les seuils
    checkPerformanceThresholds(result.responseTime);
    
    return result;
  } catch (error) {
    metrics.requests.total++;
    metrics.requests.failed++;
    metrics.errors.push({
      timestamp: new Date().toISOString(),
      error: error.error || error.message,
      type: 'application_performance'
    });
    
    console.log(`❌ Erreur: ${error.error || error.message}`);
    return { success: false, error };
  }
}

// Test des Edge Functions Supabase
async function testEdgeFunctionPerformance() {
  console.log('⚡ Test de performance des Edge Functions...');
  
  const edgeFunctionUrl = `https://${CONFIG.SUPABASE_PROJECT}.supabase.co/functions/v1/create-checkout-session`;
  
  try {
    const result = await makeRequest(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (result.responseTime < 500) {
      console.log(`✅ Edge Function rapide: ${result.responseTime.toFixed(2)}ms`);
    } else if (result.responseTime < 1000) {
      console.log(`⚠️  Edge Function acceptable: ${result.responseTime.toFixed(2)}ms`);
    } else {
      console.log(`❌ Edge Function lente: ${result.responseTime.toFixed(2)}ms`);
    }
    
    return result;
  } catch (error) {
    console.log(`❌ Erreur Edge Function: ${error.error || error.message}`);
    return { success: false, error };
  }
}

// Simulation de test du cache (à adapter selon votre implémentation)
function simulateCacheTest() {
  console.log('🗄️  Simulation du test de cache...');
  
  // Simuler des hits/misses de cache
  const isHit = Math.random() > 0.2; // 80% de chance de hit
  
  metrics.cache.totalRequests++;
  if (isHit) {
    metrics.cache.hits++;
    console.log('✅ Cache hit - Données servies depuis le cache');
  } else {
    metrics.cache.misses++;
    console.log('⚠️  Cache miss - Données récupérées depuis la source');
  }
  
  const hitRate = metrics.cache.hits / metrics.cache.totalRequests;
  console.log(`📊 Taux de hit du cache: ${(hitRate * 100).toFixed(1)}%`);
  
  if (hitRate < CONFIG.THRESHOLDS.CACHE_HIT_RATE) {
    console.log('⚠️  Taux de hit du cache en dessous du seuil!');
  }
}

// Mettre à jour les statistiques de performance
function updatePerformanceStats(responseTime) {
  metrics.performance.minResponseTime = Math.min(metrics.performance.minResponseTime, responseTime);
  metrics.performance.maxResponseTime = Math.max(metrics.performance.maxResponseTime, responseTime);
  metrics.performance.averageResponseTime = metrics.requests.totalResponseTime / metrics.requests.total;
}

// Vérifier les seuils de performance
function checkPerformanceThresholds(responseTime) {
  if (responseTime > CONFIG.THRESHOLDS.RESPONSE_TIME) {
    console.log(`⚠️  Temps de réponse élevé: ${responseTime.toFixed(2)}ms (seuil: ${CONFIG.THRESHOLDS.RESPONSE_TIME}ms)`);
  }
  
  const errorRate = metrics.requests.failed / metrics.requests.total;
  if (errorRate > CONFIG.THRESHOLDS.ERROR_RATE) {
    console.log(`⚠️  Taux d'erreur élevé: ${(errorRate * 100).toFixed(1)}% (seuil: ${CONFIG.THRESHOLDS.ERROR_RATE * 100}%)`);
  }
}

// Afficher le rapport de performance
function displayPerformanceReport() {
  console.log('\n📊 Rapport de Performance');
  console.log('========================');
  
  const uptime = Date.now() - metrics.startTime;
  const uptimeMinutes = Math.floor(uptime / 60000);
  
  console.log(`⏱️  Durée de monitoring: ${uptimeMinutes} minutes`);
  console.log(`📈 Requêtes totales: ${metrics.requests.total}`);
  console.log(`✅ Requêtes réussies: ${metrics.requests.successful}`);
  console.log(`❌ Requêtes échouées: ${metrics.requests.failed}`);
  
  if (metrics.requests.total > 0) {
    const successRate = (metrics.requests.successful / metrics.requests.total) * 100;
    console.log(`📊 Taux de succès: ${successRate.toFixed(1)}%`);
    console.log(`⚡ Temps de réponse moyen: ${metrics.performance.averageResponseTime.toFixed(2)}ms`);
    console.log(`🚀 Temps de réponse min: ${metrics.performance.minResponseTime.toFixed(2)}ms`);
    console.log(`🐌 Temps de réponse max: ${metrics.performance.maxResponseTime.toFixed(2)}ms`);
  }
  
  if (metrics.cache.totalRequests > 0) {
    const cacheHitRate = (metrics.cache.hits / metrics.cache.totalRequests) * 100;
    console.log(`🗄️  Taux de hit du cache: ${cacheHitRate.toFixed(1)}%`);
    console.log(`📦 Requêtes cache: ${metrics.cache.totalRequests}`);
    console.log(`✅ Cache hits: ${metrics.cache.hits}`);
    console.log(`❌ Cache misses: ${metrics.cache.misses}`);
  }
  
  if (metrics.errors.length > 0) {
    console.log(`\n⚠️  Erreurs récentes (${Math.min(5, metrics.errors.length)} dernières):`);
    metrics.errors.slice(-5).forEach((error, index) => {
      console.log(`   ${index + 1}. [${error.timestamp}] ${error.error}`);
    });
  }
  
  console.log('\n');
}

// Cycle de monitoring complet
async function runMonitoringCycle() {
  console.log(`\n🔄 Cycle de monitoring - ${new Date().toLocaleTimeString()}`);
  console.log('================================================');
  
  // Tests de performance
  await testApplicationPerformance();
  await testEdgeFunctionPerformance();
  simulateCacheTest();
  
  // Afficher le rapport
  displayPerformanceReport();
}

// Démarrer le monitoring continu
function startContinuousMonitoring() {
  console.log('🚀 Démarrage du monitoring continu des performances');
  console.log('==================================================');
  console.log(`📊 Intervalle de monitoring: ${CONFIG.MONITORING_INTERVAL / 1000}s`);
  console.log(`🎯 Seuils configurés:`);
  console.log(`   - Temps de réponse max: ${CONFIG.THRESHOLDS.RESPONSE_TIME}ms`);
  console.log(`   - Taux de hit cache min: ${CONFIG.THRESHOLDS.CACHE_HIT_RATE * 100}%`);
  console.log(`   - Taux d'erreur max: ${CONFIG.THRESHOLDS.ERROR_RATE * 100}%`);
  console.log('\n⚠️  Modifiez CONFIG.PRODUCTION_URL et CONFIG.SUPABASE_PROJECT avec vos vraies valeurs\n');
  
  // Premier cycle immédiat
  runMonitoringCycle();
  
  // Cycles réguliers
  const monitoringInterval = setInterval(runMonitoringCycle, CONFIG.MONITORING_INTERVAL);
  
  // Rapport détaillé toutes les 5 minutes
  const reportInterval = setInterval(() => {
    console.log('\n📋 RAPPORT DÉTAILLÉ');
    console.log('==================');
    displayPerformanceReport();
  }, 300000); // 5 minutes
  
  // Gestion de l'arrêt propre
  process.on('SIGINT', () => {
    console.log('\n🛑 Arrêt du monitoring...');
    clearInterval(monitoringInterval);
    clearInterval(reportInterval);
    
    console.log('\n📊 RAPPORT FINAL');
    console.log('================');
    displayPerformanceReport();
    
    process.exit(0);
  });
}

// Instructions d'utilisation
function showInstructions() {
  console.log('📋 Instructions de Monitoring des Performances');
  console.log('==============================================');
  console.log('1. Modifiez CONFIG.PRODUCTION_URL avec votre vraie URL de production');
  console.log('2. Modifiez CONFIG.SUPABASE_PROJECT avec votre ID de projet Supabase');
  console.log('3. Exécutez: node monitor-performance-metrics.js');
  console.log('4. Laissez tourner pour surveiller les performances en continu');
  console.log('5. Utilisez Ctrl+C pour arrêter et voir le rapport final');
  console.log('');
  console.log('📊 Métriques surveillées:');
  console.log('- Temps de réponse de l\'application');
  console.log('- Performance des Edge Functions');
  console.log('- Taux de hit du cache (simulé)');
  console.log('- Taux d\'erreur et disponibilité');
  console.log('');
}

// Exécution du script
if (process.argv[1] && process.argv[1].endsWith('monitor-performance-metrics.js')) {
  showInstructions();
  startContinuousMonitoring();
}

export {
  startContinuousMonitoring,
  runMonitoringCycle,
  testApplicationPerformance,
  testEdgeFunctionPerformance,
  displayPerformanceReport
};