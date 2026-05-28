import React from 'react';
import { LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabase';

interface LogoutButtonProps {
  className?: string;
  onLogout?: () => void;
}

export default function LogoutButton({ className = '', onLogout }: LogoutButtonProps) {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Nettoyer les données de session
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('currentRole');
    
    // Appeler la fonction personnalisée si fournie
    if (onLogout) {
      onLogout();
    }
    
    // Rediriger vers la page d'accueil
    navigate('/');
  };

  return (
    <button
      onClick={handleLogout}
      className={`group flex items-center space-x-2 px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 ${className}`}
      title="Se déconnecter"
    >
      <LogOut className="w-4 h-4 transition-transform duration-200 group-hover:rotate-12" />
      <span>Déconnexion</span>
    </button>
  );
}