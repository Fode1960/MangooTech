import React from 'react';
import AdminShopsFinalFix from './AdminShopsFinalFix';

// Error Boundary spécifique pour la gestion des boutiques
class AdminShopsErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Mettre à jour l'état pour afficher l'UI de secours
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log l'erreur pour le débogage
    console.error('❌ ERREUR CRITIQUE dans AdminShops:', error);
    console.error('📋 Détails de l\'erreur:', errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      // UI de secours
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-lg p-8">
              <div className="text-center">
                <div className="text-6xl mb-4">🚨</div>
                <h2 className="text-2xl font-bold text-red-800 dark:text-red-200 mb-4">
                  Erreur Critique dans la Gestion des Boutiques
                </h2>
                <p className="text-red-700 dark:text-red-300 mb-6">
                  Une erreur inattendue s'est produite lors de l'affichage des boutiques.
                </p>
                
                {this.state.error && (
                  <div className="bg-red-100 dark:bg-red-900/30 rounded-lg p-4 mb-6 text-left">
                    <h3 className="font-semibold text-red-800 dark:text-red-200 mb-2">Détails de l'erreur :</h3>
                    <pre className="text-xs text-red-700 dark:text-red-300 overflow-auto">
                      {this.state.error.toString()}
                    </pre>
                  </div>
                )}
                
                <div className="space-y-3">
                  <button
                    onClick={() => {
                      console.log('🔄 Tentative de récupération...');
                      this.setState({ hasError: false, error: null, errorInfo: null });
                    }}
                    className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                  >
                    🔄 Réessayer
                  </button>
                  
                  <button
                    onClick={() => {
                      console.log('🏠 Navigation vers le tableau de bord');
                      window.location.hash = '#/admin';
                    }}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors ml-3"
                  >
                    🏠 Retour au tableau de bord
                  </button>
                </div>
                
                <div className="mt-6 text-sm text-gray-600 dark:text-gray-400">
                  <p>Si le problème persiste, contactez l'administrateur technique.</p>
                  <p className="mt-2">Conseil : Essayez de rafraîchir la page (F5)</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Wrapper pour utiliser le Error Boundary
export default function AdminShopsWithErrorBoundary() {
  return (
    <AdminShopsErrorBoundary>
      <AdminShopsFinalFix />
    </AdminShopsErrorBoundary>
  );
}