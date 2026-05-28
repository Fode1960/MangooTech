import { useEffect } from 'react';

export default function UltraVisibleTest() {
  useEffect(() => {
    console.log('🚨 ULTRA VISIBLE TEST: Component monté!');
    alert('🚨 ULTRA VISIBLE TEST: Component est monté et visible!');
  }, []);

  return (
    <div className="min-h-screen bg-red-500 text-white p-8">
      <div className="text-center">
        <h1 className="text-6xl font-bold mb-4">🚨 TEST ULTRA VISIBLE 🚨</h1>
        <p className="text-2xl mb-8">Si vous voyez cet écran ROUGE, la navigation fonctionne!</p>
        <div className="bg-yellow-400 text-black p-4 rounded-lg text-xl font-bold">
          ✅ Navigation réussie!
        </div>
      </div>
    </div>
  );
}