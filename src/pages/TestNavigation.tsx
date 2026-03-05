import { useEffect } from 'react';

export default function TestNavigation() {
  useEffect(() => {
    console.log('🧪 TEST NAVIGATION: Component monté!');
    alert('🧪 TEST NAVIGATION: Component monté et visible!');
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-red-600">🧪 TEST NAVIGATION</h1>
      <p className="text-lg text-gray-700 mt-4">
        Si vous voyez ce message, la navigation fonctionne parfaitement!
      </p>
      <div className="mt-8 p-4 bg-yellow-100 border-2 border-yellow-400 rounded-lg">
        <h2 className="text-xl font-semibold text-yellow-800">Instructions:</h2>
        <ol className="list-decimal list-inside mt-2 text-yellow-700">
          <li>Ouvrez la console du navigateur (F12)</li>
          <li>Cliquez sur les boutons latéraux</li>
          <li>Regardez les logs apparaître</li>
        </ol>
      </div>
    </div>
  );
}