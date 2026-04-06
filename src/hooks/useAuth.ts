import { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';

interface User {
  id: string;
  email: string;
  user_metadata: {
    full_name?: string;
    avatar_url?: string;
  };
}

interface AuthState {
  user: User | null;
  isAdmin: boolean;
  adminRole: string | null;
  loading: boolean;
  error: string | null;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAdmin: false,
    adminRole: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    // Vérifier l'utilisateur actuel
    checkUser();

    // Écouter les changements d'authentification
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await checkAdminStatus(session.user);
      } else {
        // Vérifier si on a un utilisateur admin de démo
        const demoUser = localStorage.getItem('admin-demo-user');
        if (demoUser) {
          const userData = JSON.parse(demoUser);
          await checkAdminStatus(userData);
        } else {
          setAuthState({
            user: null,
            isAdmin: false,
            adminRole: null,
            loading: false,
            error: null
          });
        }
      }
    });

    // Écouter les changements de localStorage (pour l'admin de démo)
    const handleStorageChange = () => {
      checkUser();
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      authListener.subscription.unsubscribe();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const checkUser = async () => {
    try {
      // Vérifier d'abord si on a un utilisateur admin de démo
      const demoUser = localStorage.getItem('admin-demo-user');
      if (demoUser) {
        const userData = JSON.parse(demoUser);
        await checkAdminStatus(userData);
        return;
      }

      // Sinon, vérifier Supabase normalement
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        setAuthState(prev => ({ ...prev, loading: false, error: error.message }));
        return;
      }

      if (user) {
        await checkAdminStatus(user);
      } else {
        setAuthState(prev => ({ ...prev, loading: false }));
      }
    } catch (error) {
      setAuthState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error instanceof Error ? error.message : 'Erreur inconnue' 
      }));
    }
  };

  const checkAdminStatus = async (user: any) => {
    try {
      // Pour le compte admin de démo, toujours considérer comme admin
      if (user.email === 'admin@mangoo.tech') {
        setAuthState({
          user: user as User,
          isAdmin: true,
          adminRole: 'Super Administrateur',
          loading: false,
          error: null
        });
        return;
      }

      const tryFetchAdmin = async (roleTable: 'admin_roles' | 'user_roles') => {
        return await supabase
          .from('admin_users')
          .select(`*, role:${roleTable}(id, name, description, permissions)`)
          .eq('user_id', user.id)
          .eq('is_active', true)
          .maybeSingle();
      };

      let adminUser: any = null;
      let adminRoleName: string | null = null;

      const primary = await tryFetchAdmin('admin_roles');
      if (!primary.error && primary.data) {
        adminUser = primary.data;
        adminRoleName = primary.data?.role?.name || null;
      } else {
        const fallback = await tryFetchAdmin('user_roles');
        if (!fallback.error && fallback.data) {
          adminUser = fallback.data;
          adminRoleName = fallback.data?.role?.name || null;
        }
      }

      if (!adminUser) {
        setAuthState({
          user: user as User,
          isAdmin: false,
          adminRole: null,
          loading: false,
          error: null
        });
        return;
      }

      setAuthState({
        user: user as User,
        isAdmin: true,
        adminRole: adminRoleName,
        loading: false,
        error: null
      });
    } catch (error) {
      setAuthState({
        user: user as User,
        isAdmin: false,
        adminRole: null,
        loading: false,
        error: error instanceof Error ? error.message : 'Erreur lors de la vérification admin'
      });
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        setAuthState(prev => ({ ...prev, loading: false, error: error.message }));
        throw error;
      }

      if (data.user) {
        await checkAdminStatus(data.user);
      }

      return data;
    } catch (error) {
      setAuthState(prev => ({ ...prev, loading: false }));
      throw error;
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setAuthState({
        user: null,
        isAdmin: false,
        adminRole: null,
        loading: false,
        error: null
      });
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      throw error;
    }
  };

  const hasPermission = (permission: string): boolean => {
    if (!authState.isAdmin || !authState.user) return false;
    
    // Pour l'instant, retourner true si admin
    // TODO: Implémenter la vérification des permissions basée sur le rôle
    return true;
  };

  return {
    ...authState,
    login,
    logout,
    hasPermission
  };
}
