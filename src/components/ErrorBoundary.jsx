import React from 'react';
import { useThemeStore } from '../stores/themeStore';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} onReset={() => this.setState({ hasError: false, error: null, errorInfo: null })} />;
    }

    return this.props.children;
  }
}

const ErrorFallback = ({ error, onReset }) => {
  const { isDark } = useThemeStore();
  
  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${
      isDark ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      <div className={`max-w-md w-full rounded-lg shadow-lg p-6 text-center ${
        isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
      }`}>
        <div className="mb-4">
          <div className="text-6xl mb-2">⚠️</div>
          <h2 className={`text-xl font-bold mb-2 ${
            isDark ? 'text-red-400' : 'text-red-600'
          }`}>
            Une erreur est survenue
          </h2>
          <p className={`text-sm mb-4 ${
            isDark ? 'text-gray-300' : 'text-gray-600'
          }`}>
            {error?.message || 'Une erreur inattendue s\'est produite'}
          </p>
        </div>
        
        <div className="space-y-3">
          <button
            onClick={onReset}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
          >
            Réessayer
          </button>
          
          <button
            onClick={() => window.location.reload()}
            className={`w-full font-medium py-2 px-4 rounded-lg transition-colors duration-200 ${
              isDark 
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-300 border border-gray-600' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300'
            }`}
          >
            Recharger la page
          </button>
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
          <p className={`text-xs ${
            isDark ? 'text-gray-400' : 'text-gray-500'
          }`}>
            Si le problème persiste, contactez le support technique
          </p>
        </div>
      </div>
    </div>
  );
};