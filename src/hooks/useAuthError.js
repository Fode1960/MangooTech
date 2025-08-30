import { useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export const useAuthError = () => {
  const [authAlert, setAuthAlert] = useState({
    isVisible: false,
    message: '',
    type: 'warning'
  });
  
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const showAuthError = useCallback((error) => {
    let message = 'Une erreur d\'authentification s\'est produite.';
    let type = 'warning';

    if (error?.message) {
      if (error.message.includes('Session expirée') || 
          error.message.includes('Auth session missing')) {
        message = 'Votre session a expiré. Veuillez vous reconnecter.';
        type = 'warning';
      } else if (error.message.includes('Accès non autorisé') || 
                 error.message.includes('Non autorisé')) {
        message = 'Accès non autorisé. Veuillez vous reconnecter.';
        type = 'error';
      } else if (error.message.includes('vous reconnecter')) {
        message = error.message;
        type = 'warning';
      } else {
        message = error.message;
        type = 'error';
      }
    }

    setAuthAlert({
      isVisible: true,
      message,
      type
    });
  }, []);

  const hideAuthError = useCallback(() => {
    setAuthAlert(prev => ({ ...prev, isVisible: false }));
  }, []);

  const handleReconnect = useCallback(async () => {
    try {
      // Déconnecter l'utilisateur actuel
      await signOut();
      
      // Rediriger vers la page de connexion
      navigate('/login', { 
        state: { 
          message: 'Veuillez vous reconnecter pour continuer.',
          returnUrl: window.location.pathname 
        }
      });
      
      // Masquer l'alerte
      hideAuthError();
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      // Forcer la redirection même en cas d'erreur
      navigate('/login');
    }
  }, [signOut, navigate, hideAuthError]);

  const checkAuthError = useCallback((error) => {
    if (!error) return false;
    
    const authErrorKeywords = [
      'Auth session missing',
      'Session expirée',
      'Non autorisé',
      'Accès non autorisé',
      'vous reconnecter'
    ];
    
    const isAuthError = authErrorKeywords.some(keyword => 
      error.message?.includes(keyword)
    );
    
    if (isAuthError) {
      showAuthError(error);
      return true;
    }
    
    return false;
  }, [showAuthError]);

  return {
    authAlert,
    showAuthError,
    hideAuthError,
    handleReconnect,
    checkAuthError
  };
};