import React from 'react';
import { AlertTriangle, RefreshCw, LogIn } from 'lucide-react';

const AuthAlert = ({ 
  isVisible, 
  message, 
  onReconnect, 
  onClose,
  type = 'warning' // 'warning', 'error', 'info'
}) => {
  if (!isVisible) return null;

  const getIcon = () => {
    switch (type) {
      case 'error':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'info':
        return <LogIn className="w-5 h-5 text-blue-500" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getBgColor = () => {
    switch (type) {
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-yellow-50 border-yellow-200';
    }
  };

  const getTextColor = () => {
    switch (type) {
      case 'error':
        return 'text-red-800';
      case 'info':
        return 'text-blue-800';
      default:
        return 'text-yellow-800';
    }
  };

  return (
    <div className={`fixed top-4 right-4 z-50 max-w-md p-4 rounded-lg border shadow-lg ${getBgColor()}`}>
      <div className="flex items-start space-x-3">
        {getIcon()}
        <div className="flex-1">
          <p className={`text-sm font-medium ${getTextColor()}`}>
            Problème d'authentification
          </p>
          <p className={`text-sm mt-1 ${getTextColor()}`}>
            {message || 'Votre session a expiré. Veuillez vous reconnecter.'}
          </p>
          <div className="flex space-x-2 mt-3">
            {onReconnect && (
              <button
                onClick={onReconnect}
                className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Se reconnecter
              </button>
            )}
            {onClose && (
              <button
                onClick={onClose}
                className={`inline-flex items-center px-3 py-1.5 text-xs font-medium rounded border transition-colors ${
                  type === 'error' 
                    ? 'text-red-700 border-red-300 hover:bg-red-100'
                    : type === 'info'
                    ? 'text-blue-700 border-blue-300 hover:bg-blue-100'
                    : 'text-yellow-700 border-yellow-300 hover:bg-yellow-100'
                }`}
              >
                Fermer
              </button>
            )}
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className={`text-gray-400 hover:text-gray-600 transition-colors`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default AuthAlert;