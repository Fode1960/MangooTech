/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simuler la vérification de l'authentification
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      if (token) {
        // Simuler un utilisateur connecté
        setUser({
          id: 1,
          name: 'Admin',
          email: 'admin@mangootech.com',
          role: 'admin'
        });
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      // Simulation de connexion
      if (email === 'admin@mangootech.com' && password === 'admin') {
        const user = {
          id: 1,
          name: 'Admin',
          email: email,
          role: 'admin'
        };
        setUser(user);
        localStorage.setItem('token', 'fake-jwt-token');
        return { success: true };
      } else {
        return { success: false, error: 'Identifiants invalides' };
      }
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
