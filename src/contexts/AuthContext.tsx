import React, { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '../config/supabase'
import { storeGeolocationConsent, GeolocationConsentData } from '../utils/geolocationConsent'

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  signUp: (email: string, password: string, metadata?: any) => Promise<void>
  register: (userData: any) => Promise<void> // Registration with geolocation consent
  signInDemo: () => Promise<void> // Mode démo pour les tests
  signInLocal: (email: string, password: string) => Promise<void> // Mode local sans Supabase
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isLocalMode, setIsLocalMode] = useState(false)

  useEffect(() => {
    // Vérifier d'abord le mode local
    const localMode = localStorage.getItem('local_mode')
    const localUser = localStorage.getItem('local_user')
    
    if (localMode === 'true' && localUser) {
      // Mode local activé - utiliser l'utilisateur local
      const userData = JSON.parse(localUser)
      setUser(userData as User)
      setIsLocalMode(true)
      setLoading(false)
      return
    }
    
    // Vérifier d'abord le mode test
    const testMode = localStorage.getItem('test_mode')
    const testUser = localStorage.getItem('test_user')
    const demoMode = localStorage.getItem('demo_mode')
    const demoUser = localStorage.getItem('demo_user')
    const fakeMode = localStorage.getItem('fake_mode')
    const fakeUser = localStorage.getItem('fake_user')
    
    if (testMode === 'true' && testUser) {
      // Mode test activé - utiliser l'utilisateur de test
      const userData = JSON.parse(testUser)
      setUser(userData as User)
      setLoading(false)
      return
    }
    
    if (demoMode === 'true' && demoUser) {
      // Mode démo activé - utiliser l'utilisateur de démo
      const userData = JSON.parse(demoUser)
      setUser(userData as User)
      setLoading(false)
      return
    }
    
    if (fakeMode === 'true' && fakeUser) {
      // Mode fake activé - utiliser l'utilisateur fake
      const userData = JSON.parse(fakeUser)
      setUser(userData as User)
      setLoading(false)
      return
    }

    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for changes on auth state (logged in, signed out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
  }

  const signUp = async (email: string, password: string, metadata?: any) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    })
    if (error) throw error
  }

  // Registration function with geolocation consent
  const register = async (userData: any) => {
    try {
      // Extract geolocation consent
      const { geolocationConsent, ...userInfo } = userData
      
      // Get geolocation if consent is given
      let locationData = null
      if (geolocationConsent) {
        try {
          if (navigator.geolocation) {
            locationData = await new Promise((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(
                (position) => {
                  resolve({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                    timestamp: new Date().toISOString()
                  })
                },
                (error) => {
                  console.warn('Geolocation error:', error)
                  resolve(null)
                },
                {
                  enableHighAccuracy: false,
                  timeout: 10000,
                  maximumAge: 300000 // 5 minutes
                }
              )
            })
          }
        } catch (geoError) {
          console.warn('Could not get geolocation:', geoError)
        }
      }

      // Create metadata with geolocation data
      const metadata = {
        full_name: userInfo.name,
        phone: userInfo.phone,
        address: userInfo.address,
        user_type: userInfo.userType,
        geolocation_consent: geolocationConsent,
        location_data: locationData,
        consent_timestamp: new Date().toISOString()
      }

      // Store user data locally since Supabase is not configured
      const localUser = {
        id: 'local-user-' + Date.now(),
        email: userInfo.email,
        role: userInfo.userType || 'customer',
        full_name: userInfo.name,
        app_metadata: { provider: 'local' },
        user_metadata: metadata,
        aud: 'authenticated',
        created_at: new Date().toISOString()
      }
      
      // Store in local storage
      localStorage.setItem('local_mode', 'true')
      localStorage.setItem('local_user', JSON.stringify(localUser))
      
      // Store geolocation consent using utility
      const consentData: GeolocationConsentData = {
        userId: localUser.id,
        consentGiven: geolocationConsent,
        locationData: locationData,
        consentTimestamp: new Date().toISOString()
      }
      storeGeolocationConsent(consentData)
      
      // Set user state
      setUser(localUser as User)
      setIsLocalMode(true)

    } catch (error) {
      console.error('Registration error:', error)
      throw error
    }
  }

  const signOut = async () => {
    // Nettoyer tous les modes
    localStorage.removeItem('local_mode')
    localStorage.removeItem('local_user')
    localStorage.removeItem('test_mode')
    localStorage.removeItem('test_user')
    localStorage.removeItem('demo_mode')
    localStorage.removeItem('demo_user')
    
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  // Mode local sans Supabase - connexion simplifiée
  const signInLocal = async (email: string, password: string) => {
    try {
      // Créer un utilisateur local simple
      const localUser = {
        id: 'local-user-' + Date.now(),
        email: email,
        role: 'vendor',
        full_name: email.split('@')[0],
        app_metadata: { provider: 'local' },
        user_metadata: { role: 'vendor', full_name: email.split('@')[0] },
        aud: 'authenticated',
        created_at: new Date().toISOString()
      }
      
      // Stocker en local
      localStorage.setItem('local_mode', 'true')
      localStorage.setItem('local_user', JSON.stringify(localUser))
      
      // Mettre à jour l'état
      setUser(localUser as User)
      setIsLocalMode(true)
      
    } catch (error) {
      console.error('Erreur mode local:', error)
      throw error
    }
  }

  // Mode démo pour faciliter les tests
  const signInDemo = async () => {
    try {
      // Créer un utilisateur démo s'il n'existe pas
      const demoEmail = 'demo@vendeur.com'
      const demoPassword = 'demo123'
      
      // Essayer de se connecter d'abord
      try {
        await signIn(demoEmail, demoPassword)
      } catch (error) {
        // Si l'utilisateur n'existe pas, le créer
        await signUp(demoEmail, demoPassword, {
          role: 'vendor',
          full_name: 'Démonstration Vendeur'
        })
        
        // Attendre un peu pour que l'utilisateur soit créé
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Se connecter avec le nouvel utilisateur
        await signIn(demoEmail, demoPassword)
      }
    } catch (error) {
      console.error('Erreur mode démo:', error)
      throw error
    }
  }

  const value = {
    user,
    loading,
    signIn,
    signUp,
    register,
    signOut,
    signInDemo,
    signInLocal,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
