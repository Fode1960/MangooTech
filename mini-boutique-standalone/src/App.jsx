import React from 'react'

// Application ULTRA-MINIMA - ZÉRO hooks complexes
function App() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md">
        <h1 className="text-3xl font-bold text-orange-600 mb-4">Mini-Boutique</h1>
        <p className="text-gray-600 mb-6">Interface de base ultra-simple</p>
        <div className="space-y-3">
          <a 
            href="/shop"
            className="block w-full bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded transition-colors"
          >
            Accéder à la boutique
          </a>
          <a 
            href="/login"
            className="block w-full bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded transition-colors"
          >
            Connexion
          </a>
        </div>
      </div>
    </div>
  )
}

export default App