import React, { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'

const LogoutTest = () => {
  const { user, signOut } = useAuth()
  const [testResults, setTestResults] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  const addResult = (message, type = 'info') => {
    setTestResults(prev => [...prev, { message, type, timestamp: new Date().toLocaleTimeString() }])
  }

  const clearResults = () => {
    setTestResults([])
  }

  const testDirectSupabaseLogout = async () => {
    setIsLoading(true)
    addResult('🔍 Test de déconnexion directe Supabase...', 'info')
    
    try {
      // Vérifier la session avant
      const { data: { session: beforeSession } } = await supabase.auth.getSession()
      addResult(`Session avant: ${beforeSession ? 'Connecté (' + beforeSession.user.email + ')' : 'Déconnecté'}`, 'info')
      
      // Tenter la déconnexion
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        addResult(`❌ Erreur Supabase: ${error.message}`, 'error')
      } else {
        addResult('✅ Commande signOut exécutée sans erreur', 'success')
      }
      
      // Vérifier la session après
      setTimeout(async () => {
        const { data: { session: afterSession } } = await supabase.auth.getSession()
        addResult(`Session après: ${afterSession ? 'Encore connecté (' + afterSession.user.email + ')' : 'Déconnecté'}`, afterSession ? 'error' : 'success')
        setIsLoading(false)
      }, 1000)
      
    } catch (error) {
      addResult(`❌ Erreur inattendue: ${error.message}`, 'error')
      setIsLoading(false)
    }
  }

  const testContextLogout = async () => {
    setIsLoading(true)
    addResult('🔍 Test de déconnexion via contexte...', 'info')
    
    try {
      addResult(`Utilisateur avant: ${user ? 'Connecté (' + user.email + ')' : 'Déconnecté'}`, 'info')
      
      const result = await signOut()
      
      if (result?.error) {
        addResult(`❌ Erreur contexte: ${result.error.message}`, 'error')
      } else {
        addResult('✅ Fonction signOut du contexte exécutée', 'success')
      }
      
      // Vérifier l'état après
      setTimeout(() => {
        addResult(`Utilisateur après: ${user ? 'Encore connecté (' + user.email + ')' : 'Déconnecté'}`, user ? 'error' : 'success')
        setIsLoading(false)
      }, 1000)
      
    } catch (error) {
      addResult(`❌ Erreur inattendue: ${error.message}`, 'error')
      setIsLoading(false)
    }
  }

  const checkLocalStorage = () => {
    addResult('🔍 Vérification du localStorage...', 'info')
    
    const authData = localStorage.getItem('mangoo-tech-auth')
    if (authData) {
      try {
        const parsed = JSON.parse(authData)
        addResult(`📦 Données localStorage trouvées: ${Object.keys(parsed).join(', ')}`, 'info')
        if (parsed.access_token) {
          addResult('🔑 Token d\'accès présent', 'warning')
        }
      } catch (e) {
        addResult('⚠️ Données localStorage corrompues', 'warning')
      }
    } else {
      addResult('✅ Aucune donnée localStorage trouvée', 'success')
    }
  }

  const clearLocalStorage = () => {
    localStorage.removeItem('mangoo-tech-auth')
    addResult('🧹 localStorage nettoyé manuellement', 'success')
  }

  const getResultColor = (type) => {
    switch (type) {
      case 'success': return 'text-green-600 dark:text-green-400'
      case 'error': return 'text-red-600 dark:text-red-400'
      case 'warning': return 'text-yellow-600 dark:text-yellow-400'
      default: return 'text-gray-600 dark:text-gray-400'
    }
  }

  if (!user) {
    return (
      <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <h2 className="text-xl font-bold mb-4">Test de Déconnexion</h2>
        <p className="text-gray-600 dark:text-gray-400">Vous devez être connecté pour tester la déconnexion.</p>
      </div>
    )
  }

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <h2 className="text-xl font-bold mb-4">Test de Déconnexion</h2>
      
      <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
        <p className="text-sm">
          <strong>Utilisateur connecté:</strong> {user.email}
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={testDirectSupabaseLogout}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          Test Supabase Direct
        </button>
        
        <button
          onClick={testContextLogout}
          disabled={isLoading}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
        >
          Test Contexte Auth
        </button>
        
        <button
          onClick={checkLocalStorage}
          className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
        >
          Vérifier localStorage
        </button>
        
        <button
          onClick={clearLocalStorage}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Nettoyer localStorage
        </button>
        
        <button
          onClick={clearResults}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          Effacer Résultats
        </button>
      </div>

      {testResults.length > 0 && (
        <div className="bg-gray-50 dark:bg-gray-900 rounded p-4 max-h-96 overflow-y-auto">
          <h3 className="font-semibold mb-2">Résultats des Tests:</h3>
          <div className="space-y-1 text-sm font-mono">
            {testResults.map((result, index) => (
              <div key={index} className={getResultColor(result.type)}>
                <span className="text-gray-500">[{result.timestamp}]</span> {result.message}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {isLoading && (
        <div className="mt-4 text-center">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2">Test en cours...</span>
        </div>
      )}
    </div>
  )
}

export default LogoutTest