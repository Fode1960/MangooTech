import React from 'react'
import { Link } from 'react-router-dom'
import LogoutTest from '../components/debug/LogoutTest'

const LogoutDebug = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Link 
              to="/dashboard" 
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              ← Retour au Dashboard
            </Link>
          </div>
          
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Diagnostic de Déconnexion
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Cette page permet de diagnostiquer les problèmes de déconnexion de votre compte DANSOKO.
            </p>
          </div>

          <LogoutTest />
          
          <div className="mt-8 p-6 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
              Instructions de Diagnostic
            </h3>
            <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
              <li>• <strong>Test Supabase Direct:</strong> Teste la déconnexion directement via l'API Supabase</li>
              <li>• <strong>Test Contexte Auth:</strong> Teste la déconnexion via le contexte d'authentification de l'application</li>
              <li>• <strong>Vérifier localStorage:</strong> Vérifie si des données d'authentification persistent dans le navigateur</li>
              <li>• <strong>Nettoyer localStorage:</strong> Supprime manuellement les données d'authentification du navigateur</li>
            </ul>
          </div>
          
          <div className="mt-6 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">
              Solutions Possibles
            </h3>
            <div className="text-sm text-blue-700 dark:text-blue-300 space-y-2">
              <p><strong>Si la déconnexion ne fonctionne pas:</strong></p>
              <ol className="list-decimal list-inside space-y-1 ml-4">
                <li>Essayez de nettoyer le localStorage manuellement</li>
                <li>Fermez et rouvrez votre navigateur</li>
                <li>Videz le cache de votre navigateur</li>
                <li>Essayez en navigation privée</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LogoutDebug