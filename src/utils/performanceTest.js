// Script de test des performances
const performanceTest = {
  // Mesurer le temps de rendu d'un composant
  measureRenderTime(componentName, renderFunction) {
    const startTime = performance.now();
    renderFunction();
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    console.log(`⏱️  ${componentName} render time: ${renderTime.toFixed(2)}ms`);
    return renderTime;
  },

  // Mesurer l'utilisation mémoire
  measureMemoryUsage() {
    if ('memory' in performance) {
      const memoryMB = Math.round(performance.memory.usedJSHeapSize / 1024 / 1024);
      const memoryLimitMB = Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024);
      
      console.log(`💾 Memory Usage: ${memoryMB}MB / ${memoryLimitMB}MB`);
      return { used: memoryMB, limit: memoryLimitMB };
    }
    return null;
  },

  // Tester les performances de filtrage
  testFilteringPerformance(products, filterFunction, iterations = 1000) {
    const startTime = performance.now();
    
    for (let i = 0; i < iterations; i++) {
      filterFunction(products);
    }
    
    const endTime = performance.now();
    const totalTime = endTime - startTime;
    const averageTime = totalTime / iterations;
    
    console.log(`🔍 Filtering Performance (${iterations} iterations):`);
    console.log(`   Total time: ${totalTime.toFixed(2)}ms`);
    console.log(`   Average time per filter: ${averageTime.toFixed(3)}ms`);
    
    return { totalTime, averageTime };
  },

  // Tester les performances de rendu de liste
  testListRenderingPerformance(items, renderFunction, batchSize = 100) {
    const results = [];
    
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const startTime = performance.now();
      
      renderFunction(batch);
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      results.push({
        batchSize: batch.length,
        renderTime,
        itemsPerMs: batch.length / renderTime
      });
    }
    
    const averageRenderTime = results.reduce((sum, r) => sum + r.renderTime, 0) / results.length;
    const averageItemsPerMs = results.reduce((sum, r) => sum + r.itemsPerMs, 0) / results.length;
    
    console.log(`📋 List Rendering Performance:`);
    console.log(`   Average render time: ${averageRenderTime.toFixed(2)}ms`);
    console.log(`   Average items per ms: ${averageItemsPerMs.toFixed(2)}`);
    
    return { results, averageRenderTime, averageItemsPerMs };
  },

  // Benchmark complet
  runFullBenchmark() {
    console.log('🚀 Starting Performance Benchmark...\n');
    
    // Générer des données de test
    const generateProducts = (count) => {
      const categories = ['electronics', 'fashion', 'food', 'handicraft'];
      const icons = ['📱', '👕', '🍲', '🎨'];
      
      return Array.from({ length: count }, (_, i) => ({
        id: i + 1,
        name: `Produit ${i + 1}`,
        description: `Description du produit ${i + 1}`,
        price: `${Math.floor(Math.random() * 200000) + 1000} FCFA`,
        category: categories[Math.floor(Math.random() * categories.length)],
        rating: Math.floor(Math.random() * 5) + 1,
        reviews: Math.floor(Math.random() * 200),
        icon: icons[Math.floor(Math.random() * icons.length)],
        vendor: 'Vendeur Demo',
        stock: Math.floor(Math.random() * 100)
      }));
    };

    const testProducts = generateProducts(1000);
    
    console.log(`📝 Generated ${testProducts.length} test products\n`);
    
    // Test 1: Filtrage basique
    const basicFilter = (products) => {
      return products.filter(p => p.category === 'electronics' && p.rating >= 4);
    };
    
    const filterResults = this.testFilteringPerformance(testProducts, basicFilter);
    
    // Test 2: Filtrage complexe
    const complexFilter = (products) => {
      return products
        .filter(p => p.category === 'electronics' && p.rating >= 4 && p.price.includes('15'))
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 50);
    };
    
    const complexFilterResults = this.testFilteringPerformance(testProducts, complexFilter, 500);
    
    // Test 3: Mémoire
    const memoryBefore = this.measureMemoryUsage();
    
    // Simuler une opération mémoire-intensive
    const largeArray = Array.from({ length: 100000 }, (_, i) => ({
      id: i,
      data: new Array(100).fill(Math.random())
    }));
    void largeArray;
    
    // Forcer garbage collection si disponible
    if (window.gc) {
      window.gc();
    }
    
    const memoryAfter = this.measureMemoryUsage();
    
    console.log('\n📊 Benchmark Summary:');
    console.log('===================');
    console.log(`Basic filtering: ${filterResults.averageTime.toFixed(3)}ms average`);
    console.log(`Complex filtering: ${complexFilterResults.averageTime.toFixed(3)}ms average`);
    console.log(`Memory usage: ${memoryAfter?.used || 'N/A'}MB`);
    
    return {
      filterResults,
      complexFilterResults,
      memoryUsage: { before: memoryBefore, after: memoryAfter }
    };
  },

  // Fonction pour créer un rapport de performance
  generatePerformanceReport() {
    const metrics = this.runFullBenchmark();
    
    const report = {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      metrics,
      recommendations: this.generateRecommendations(metrics)
    };
    
    console.log('\n📋 Performance Report Generated');
    return report;
  },

  // Générer des recommandations basées sur les métriques
  generateRecommendations(metrics) {
    const recommendations = [];
    
    if (metrics.filterResults.averageTime > 1) {
      recommendations.push('Consider implementing memoization for filtering operations');
    }
    
    if (metrics.complexFilterResults.averageTime > 5) {
      recommendations.push('Optimize complex filtering with caching or pre-computation');
    }
    
    if (metrics.memoryUsage?.after?.used > 100) {
      recommendations.push('Monitor memory usage - consider implementing virtual scrolling');
    }
    
    return recommendations;
  }
};

// Exposer globalement pour le debugging
window.performanceTest = performanceTest;

export default performanceTest;
