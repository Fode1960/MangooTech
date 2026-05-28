import React from 'react';

// ErrorBoundary - Gestion des erreurs React
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          backgroundColor: '#fef2f2',
          padding: '2rem'
        }}>
          <div style={{ textAlign: 'center', maxWidth: '500px' }}>
            <div style={{
              fontSize: '3rem',
              marginBottom: '1rem'
            }}>⚠️</div>
            <h2 style={{ color: '#dc2626', marginBottom: '1rem' }}>Une erreur est survenue</h2>
            <p style={{ color: '#7f1d1d', marginBottom: '1.5rem' }}>
              {this.state.error?.message || 'Une erreur inattendue s\'est produite.'}
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              style={{
                backgroundColor: '#dc2626',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.375rem',
                cursor: 'pointer',
                fontSize: '1rem',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#b91c1c';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#dc2626';
              }}
            >
              Réessayer
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Fonction utilitaire pour capturer les erreurs
export const captureError = (error, errorInfo = {}) => {
  console.error('Captured error:', error);
  console.error('Error info:', errorInfo);
  
  // Ici on pourrait envoyer les erreurs à un service de monitoring
  // Pour l'instant, on les log juste
};

// Hook pour gérer les erreurs dans les composants fonctionnels
export const useErrorHandler = () => {
  return (error, errorInfo) => {
    captureError(error, errorInfo);
  };
};