import React, { createContext, useContext, useEffect, useState } from 'react'
import { auth, db, supabase } from '../lib/supabase'
import { assignPackToUser, getUserPack } from '../lib/services'

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

    // Écouter les changements d'état d'authentification sur l'instance principale
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null)
      
      if (session?.user) {
        // Récupérer le profil utilisateur
        try {
          const { data: profile, error } = await db.users.getById(session.user.id)
          if (error) {
            console.error('Erreur lors de la récupération du profil:', error)
          } else {
            setUserProfile(profile)
            
            // Vérifier si l'utilisateur a un pack assigné, sinon assigner le pack gratuit
            try {
              const userPack = await getUserPack(session.user.id)
              if (!userPack) {
                console.log('Aucun pack trouvé pour l\'utilisateur, assignation du pack gratuit...')
                await assignPackToUser({
                  user_id: session.user.id,
                  pack_id: '0a85e74a-4aec-480a-8af1-7b57391a80d2', // Pack Découverte (gratuit)
                  status: 'active'
                })
                console.log('Pack gratuit assigné avec succès')
              }
            } catch (packError) {
              console.error('Erreur lors de la vérification du pack:', packError)
              // Si la vérification échoue (ex: problème RLS), tenter quand même l'assignation
              try {
                console.log('Tentative d\'assignation du pack gratuit malgré l\'erreur de vérification...')
                await assignPackToUser({
                  user_id: session.user.id,
                  pack_id: '0a85e74a-4aec-480a-8af1-7b57391a80d2', // Pack Découverte (gratuit)
                  status: 'active'
                })
                console.log('Pack gratuit assigné avec succès après erreur de vérification')
              } catch (assignError) {
                console.error('Erreur lors de l\'assignation du pack:', assignError)
              }
            }
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
          phone: userData.phone || '',
          company: userData.company || '',
          account_type: userData.accountType || 'individual',
          selected_pack: userData.selectedPack || 'free',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        
        const { error: profileError } = await db.users.create(profileData)
        if (profileError) {
          console.error('Erreur lors de la création du profil:', profileError)
        } else {
          // Assigner automatiquement le pack sélectionné
          // Mapper les IDs des packs de Register.jsx vers les vrais IDs de la base de données
          const packMapping = {
            'free': '0a85e74a-4aec-480a-8af1-7b57391a80d2', // Pack Découverte
            'visibility': 'pack-visibilite-id', // Pack Visibilité - À remplacer par l'ID réel
            'professional': 'pack-professionnel-id', // Pack Professionnel - À remplacer par l'ID réel
            'premium': 'pack-premium-id' // Pack Premium - À remplacer par l'ID réel
          }
          
          let packIdToAssign = packMapping[userData.selectedPack] || packMapping['free']
          
          if (packIdToAssign) {
            try {
              await assignPackToUser({
                user_id: data.user.id,
                pack_id: packIdToAssign,
                status: 'active'
              })
              console.log('Pack assigné avec succès:', packIdToAssign)
            } catch (packError) {
              console.error('Erreur lors de l\'assignation du pack:', packError)
            }
          }
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

  const signIn = async (email, password, rememberMe = false) => {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error } = await auth.signIn(email, password, rememberMe)
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