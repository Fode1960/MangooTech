import { useState, useEffect } from 'react';

export default function DirectNavigationTest() {
  const [hasError, setHasError] = useState(false);
  
  useEffect(() => {
    console.log('🚨 DIRECT NAVIGATION TEST: Component monté!');
    alert('🚨 DIRECT NAVIGATION TEST: Component est monté et visible!');
    
    // Test direct de navigation
    (window as any).testNavigation = () => {
      console.log('🎯 Navigation directe déclenchée!');
      alert('🎯 Navigation directe fonctionne!');
    };
    
    console.log('🎯 Fonction window.testNavigation créée');
  }, []);
  
  const handleDirectNav = () => {
    console.log('🎯 Clic direct sur le bouton!');
    alert('🎯 Bouton cliqué - navigation directe!');
    
    // Créer un élément visible immédiatement
    const content = document.getElementById('direct-content');
    if (content) {
      content.innerHTML = `
        <div style="background: red; color: white; padding: 20px; text-align: center; font-size: 24px; margin: 20px;">
          🎯 NAVIGATION DIRECTE RÉUSSIE! 🎯
          <br>
          <button onclick="location.reload()" style="background: white; color: red; padding: 10px; margin-top: 10px;">
            Recharger la page
          </button>
        </div>
      `;
    }
  };

  if (hasError) {
    return (
      <div className="min-h-screen bg-red-500 text-white p-8">
        <h1 className="text-4xl font-bold mb-4">🚨 ERREUR CRITIQUE 🚨</h1>
        <p>Erreur dans le composant de navigation directe</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-yellow-400 text-black p-8">
      <div className="text-center">
        <h1 className="text-6xl font-bold mb-4">🎯 NAVIGATION DIRECTE 🎯</h1>
        <p className="text-2xl mb-8">Test de navigation sans props React!</p>
        
        <div className="bg-white text-black p-6 rounded-lg mb-8 max-w-2xl mx-auto">
          <h2 className="text-xl font-bold mb-4">Instructions:</h2>
          <ol className="list-decimal list-inside text-left">
            <li>Ouvrez la console (F12)</li>
            <li>Cliquez sur le bouton ci-dessous</li>
            <li>Regardez l'alerte et le contenu apparaître</li>
          </ol>
        </div>
        
        <button 
          onClick={handleDirectNav}
          className="bg-red-500 text-white px-8 py-4 text-2xl font-bold rounded-lg hover:bg-red-600 transition-colors"
        >
          🎯 CLIQUEZ ICI POUR TESTER 🎯
        </button>
        
        <div id="direct-content" className="mt-8">
          {/* Le contenu apparaîtra ici */}
        </div>
        
        <div className="mt-8 bg-blue-100 p-4 rounded-lg">
          <p className="text-blue-800">
            <strong>Console logs attendus:</strong><br />
            🚨 DIRECT NAVIGATION TEST: Component monté!<br />
            🎯 Fonction window.testNavigation créée<br />
            🎯 Clic direct sur le bouton!
          </p>
        </div>
      </div>
    </div>
  );
}