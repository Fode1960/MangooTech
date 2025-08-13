import React, { createContext, useContext, useEffect, useState } from 'react'
import { auth, db } from '../lib/supabase'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Vérifier l'utilisateur actuel au chargement
    const checkUser = async () => {
      try {
        const { user, error } = await auth.getCurrentUser()
        
        // Ignorer l'erreur AuthSessionMissingError car elle est normale quand aucun utilisateur n'est connecté
        if (error && !error.message.includes('Auth session missing')) {
          throw error
        }
        
        setUser(user)
        
        if (user) {
          // Récupérer le profil utilisateur
          const { data: profile, error: profileError } = await db.users.getById(user.id)
          if (profileError) {
            console.error('Erreur lors de la récupération du profil:', profileError)
          } else {
            setUserProfile(profile)
          }
        }
      } catch (error) {
        console.error('Erreur lors de la vérification de l\'utilisateur:', error)
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }

    checkUser()

    // Écouter les changements d'état d'authentification
    const { data: { subscription } } = auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null)
      
      if (session?.user) {
        // Récupérer le profil utilisateur
        try {
          const { data: profile, error } = await db.users.getById(session.user.id)
          if (error) {
            console.error('Erreur lors de la récupération du profil:', error)
          } else {
            setUserProfile(profile)
          }
        } catch (error) {
          console.error('Erreur lors de la récupération du profil:', error)
        }
      } else {
        setUserProfile(null)
      }
      
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email, password, userData = {}) => {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error } = await auth.signUp(email, password, userData)
      if (error) {throw error}
      
      // Créer le profil utilisateur dans la base de données
      if (data.user) {
        const profileData = {
          id: data.user.id,
          email: data.user.email,
          first_name: userData.firstName || '',
          last_name: userData.lastName || '',
          account_type: userData.accountType || 'individual',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        
        const { error: profileError } = await db.users.create(profileData)
        if (profileError) {
          console.error('Erreur lors de la création du profil:', profileError)
        }
      }
      
      return { data, error: null }
    } catch (error) {
      setError(error.message)
      return { data: null, error }
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email, password) => {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error } = await auth.signIn(email, password)
      if (error) {throw error}
      
      return { data, error: null }
    } catch (error) {
      setError(error.message)
      return { data: null, error }
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { error } = await auth.signOut()
      if (error) {throw error}
      
      setUser(null)
      setUserProfile(null)
      
      return { error: null }
    } catch (error) {
      setError(error.message)
      return { error }
    } finally {
      setLoading(false)
    }
  }

  const updateProfile = async (updates) => {
    try {
      setLoading(true)
      setError(null)
      
      if (!user) {throw new Error('Utilisateur non connecté')}
      
      const { data, error } = await db.users.update(user.id, {
        ...updates,
        updated_at: new Date().toISOString()
      })
      
      if (error) {throw error}
      
      setUserProfile(data[0])
      return { data, error: null }
    } catch (error) {
      setError(error.message)
      return { data: null, error }
    } finally {
      setLoading(false)
    }
  }

  const isAdmin = () => {
    return userProfile?.role === 'admin' || userProfile?.role === 'super_admin' || userProfile?.account_type === 'admin'
  }

  const isSuperAdmin = () => {
    return userProfile?.role === 'super_admin'
  }

  const isProfessional = () => {
    return userProfile?.account_type === 'professional'
  }

  const clearError = () => {
    setError(null)
  }

  const value = {
    user,
    userProfile,
    loading,
    error,
    signUp,
    signIn,
    signOut,
    updateProfile,
    isAdmin,
    isSuperAdmin,
    isProfessional,
    clearError
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthContext