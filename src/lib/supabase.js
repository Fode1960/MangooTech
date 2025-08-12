import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ptrqhtwstldphjaraufi.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0cnFodHdzdGxkcGhqYXJhdWZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MzI0OTIsImV4cCI6MjA3MDUwODQ5Mn0.Wc-dKWVMpAyFoAPFGejzhD0o1rodyEGrBlZK5X3muyA'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Configuration pour l'authentification
export const authConfig = {
  redirectTo: window.location.origin + '/auth/callback',
  storage: window.localStorage,
  storageKey: 'mangoo-tech-auth',
  debug: process.env.NODE_ENV === 'development'
}

// Fonctions utilitaires pour l'authentification
export const auth = {
  signUp: async (email, password, userData = {}) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData,
        emailRedirectTo: authConfig.redirectTo
      }
    })
    return { data, error }
  },

  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return { data, error }
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  getCurrentUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser()
    return { user, error }
  },

  onAuthStateChange: (callback) => {
    return supabase.auth.onAuthStateChange(callback)
  }
}

// Fonctions utilitaires pour la base de données
export const db = {
  // Gestion des utilisateurs
  users: {
    create: async (userData) => {
      const { data, error } = await supabase
        .from('users')
        .insert([userData])
        .select()
      return { data, error }
    },

    getById: async (id) => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single()
      return { data, error }
    },

    update: async (id, updates) => {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', id)
        .select()
      return { data, error }
    }
  },

  // Gestion des services/modules
  services: {
    getAll: async () => {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('created_at', { ascending: false })
      return { data, error }
    },

    getById: async (id) => {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('id', id)
        .single()
      return { data, error }
    }
  },

  // Gestion des abonnements
  subscriptions: {
    create: async (subscriptionData) => {
      const { data, error } = await supabase
        .from('subscriptions')
        .insert([subscriptionData])
        .select()
      return { data, error }
    },

    getByUserId: async (userId) => {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*, services(*)')
        .eq('user_id', userId)
      return { data, error }
    }
  },

  // Gestion des contacts
  contacts: {
    create: async (contactData) => {
      const { data, error } = await supabase
        .from('contacts')
        .insert([contactData])
        .select()
      return { data, error }
    }
  }
}

// Fonction pour soumettre le formulaire de contact
export const submitContactForm = async (formData) => {
  const contactData = {
    name: formData.name,
    email: formData.email,
    phone: formData.phone,
    company: formData.company,
    subject: formData.subject,
    message: formData.message,
    service: formData.service,
    created_at: new Date().toISOString()
  }
  
  return await db.contacts.create(contactData)
}