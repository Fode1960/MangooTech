import React, { useEffect, useState, memo } from 'react';

const PerformanceMonitor = memo(() => {
  const [metrics, setMetrics] = useState({
    fps: 0,
    memory: 0,
    loadTime: 0,
    renderTime: 0
  });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let animationId;

    const measureFPS = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime >= lastTime + 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        setMetrics(prev => ({ ...prev, fps }));
        frameCount = 0;
        lastTime = currentTime;
      }
      
      animationId = requestAnimationFrame(measureFPS);
    };

    // Mesurer l'utilisation mémoire (si disponible)
    const measureMemory = () => {
      if ('memory' in performance) {
        const memoryMB = Math.round(performance.memory.usedJSHeapSize / 1024 / 1024);
        setMetrics(prev => ({ ...prev, memory: memoryMB }));
      }
    };

    // Mesurer le temps de rendu
    const measureRenderTime = () => {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'measure') {
            setMetrics(prev => ({ ...prev, renderTime: Math.round(entry.duration) }));
          }
        }
      });
      
      try {
        observer.observe({ entryTypes: ['measure'] });
      } catch (e) {
        console.warn('Performance Observer not supported');
      }
    };

    // Mesurer le temps de chargement de la page
    const measureLoadTime = () => {
      if (performance.timing) {
        const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
        setMetrics(prev => ({ ...prev, loadTime }));
      }
    };

    // Démarrer les mesures
    measureFPS();
    measureMemory();
    measureRenderTime();
    
    // Mesurer la mémoire toutes les 5 secondes
    const memoryInterval = setInterval(measureMemory, 5000);
    
    // Mesurer le temps de chargement après que la page soit chargée
    if (document.readyState === 'complete') {
      measureLoadTime();
    } else {
      window.addEventListener('load', measureLoadTime);
    }

    // Nettoyer à la désactivation
    return () => {
      cancelAnimationFrame(animationId);
      clearInterval(memoryInterval);
      window.removeEventListener('load', measureLoadTime);
    };
  }, []);

  const getFPSColor = (fps) => {
    if (fps >= 50) return 'text-green-500';
    if (fps >= 30) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getMemoryColor = (memory) => {
    if (memory < 100) return 'text-green-500';
    if (memory < 200) return 'text-yellow-500';
    return 'text-red-500';
  };

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-gray-800 text-white p-2 rounded-full shadow-lg hover:bg-gray-700 transition-colors z-50"
        title="Afficher les métriques de performance"
      >
        📊
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-gray-900 text-white p-4 rounded-lg shadow-xl z-50 min-w-[200px]">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-semibold">Performance Monitor</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-white text-sm"
          aria-label="Fermer"
        >
          ✕
        </button>
      </div>
      
      <div className="space-y-2 text-xs">
        <div className="flex justify-between">
          <span>FPS:</span>
          <span className={getFPSColor(metrics.fps)}>
            {metrics.fps} fps
          </span>
        </div>
        
        {metrics.memory > 0 && (
          <div className="flex justify-between">
            <span>Mémoire:</span>
            <span className={getMemoryColor(metrics.memory)}>
              {metrics.memory} MB
            </span>
          </div>
        )}
        
        {metrics.loadTime > 0 && (
          <div className="flex justify-between">
            <span>Chargement:</span>
            <span className="text-blue-400">
              {metrics.loadTime} ms
            </span>
          </div>
        )}
        
        {metrics.renderTime > 0 && (
          <div className="flex justify-between">
            <span>Rendu:</span>
            <span className="text-purple-400">
              {metrics.renderTime} ms
            </span>
          </div>
        )}
      </div>
      
      <div className="mt-3 pt-2 border-t border-gray-700">
        <button
          onClick={() => {
            if (window.gc) {
              window.gc();
              alert('Garbage collection déclenchée');
            } else {
              alert('Garbage collection non disponible. Lancez Chrome avec --js-flags="--expose-gc"');
            }
          }}
          className="w-full text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded transition-colors"
        >
          Nettoyer mémoire
        </button>
      </div>
    </div>
  );
});

PerformanceMonitor.displayName = 'PerformanceMonitor';

export default PerformanceMonitor;