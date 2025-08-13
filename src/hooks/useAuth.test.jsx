import React from 'react'
import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAuth } from './useAuth'
import { AuthProvider } from '../contexts/AuthContext'

// Mock Supabase
const mockSupabase = {
  auth: {
    getSession: vi.fn(),
    onAuthStateChange: vi.fn(),
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    resetPasswordForEmail: vi.fn()
  },
  from: vi.fn().mockReturnValue({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn()
      }),
      insert: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn()
    })
  })
}

vi.mock('../lib/supabase', () => ({
  supabase: mockSupabase
}))

// Wrapper pour les tests avec AuthProvider
const wrapper = ({ children }) => (
  <AuthProvider>
    {children}
  </AuthProvider>
)

describe('useAuth Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Configuration par défaut des mocks
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null
    })
    
    mockSupabase.auth.onAuthStateChange.mockReturnValue({
      data: {
        subscription: {
          unsubscribe: vi.fn()
        }
      }
    })
  })

  it('devrait retourner l\'état initial correct', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })
    
    expect(result.current.user).toBeNull()
    expect(result.current.profile).toBeNull()
    expect(result.current.loading).toBe(true)
    expect(result.current.error).toBeNull()
    expect(typeof result.current.signIn).toBe('function')
    expect(typeof result.current.signUp).toBe('function')
    expect(typeof result.current.signOut).toBe('function')
    expect(typeof result.current.resetPassword).toBe('function')
    expect(typeof result.current.updateProfile).toBe('function')
  })

  it('devrait gérer la connexion réussie', async () => {
    const mockUser = {
      id: '123',
      email: 'test@example.com',
      user_metadata: { name: 'Test User' }
    }
    
    const mockSession = {
      user: mockUser,
      access_token: 'token123'
    }
    
    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: mockUser, session: mockSession },
      error: null
    })
    
    mockSupabase.from().select().eq().single.mockResolvedValue({
      data: { id: '123', name: 'Test User', email: 'test@example.com' },
      error: null
    })
    
    const { result } = renderHook(() => useAuth(), { wrapper })
    
    await act(async () => {
      await result.current.signIn('test@example.com', 'password123')
    })
    
    expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123'
    })
  })

  it('devrait gérer les erreurs de connexion', async () => {
    const mockError = { message: 'Invalid credentials' }
    
    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: mockError
    })
    
    const { result } = renderHook(() => useAuth(), { wrapper })
    
    await act(async () => {
      try {
        await result.current.signIn('test@example.com', 'wrongpassword')
      } catch (error) {
        expect(error.message).toBe('Invalid credentials')
      }
    })
    
    expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'wrongpassword'
    })
  })

  it('devrait gérer l\'inscription réussie', async () => {
    const mockUser = {
      id: '123',
      email: 'newuser@example.com',
      user_metadata: { name: 'New User' }
    }
    
    mockSupabase.auth.signUp.mockResolvedValue({
      data: { user: mockUser, session: null },
      error: null
    })
    
    mockSupabase.from().insert.mockResolvedValue({
      data: [{ id: '123', name: 'New User', email: 'newuser@example.com' }],
      error: null
    })
    
    const { result } = renderHook(() => useAuth(), { wrapper })
    
    await act(async () => {
      await result.current.signUp('newuser@example.com', 'password123', {
        name: 'New User'
      })
    })
    
    expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
      email: 'newuser@example.com',
      password: 'password123',
      options: {
        data: { name: 'New User' }
      }
    })
  })

  it('devrait gérer les erreurs d\'inscription', async () => {
    const mockError = { message: 'Email already registered' }
    
    mockSupabase.auth.signUp.mockResolvedValue({
      data: { user: null, session: null },
      error: mockError
    })
    
    const { result } = renderHook(() => useAuth(), { wrapper })
    
    await act(async () => {
      try {
        await result.current.signUp('existing@example.com', 'password123')
      } catch (error) {
        expect(error.message).toBe('Email already registered')
      }
    })
  })

  it('devrait gérer la déconnexion', async () => {
    mockSupabase.auth.signOut.mockResolvedValue({
      error: null
    })
    
    const { result } = renderHook(() => useAuth(), { wrapper })
    
    await act(async () => {
      await result.current.signOut()
    })
    
    expect(mockSupabase.auth.signOut).toHaveBeenCalled()
  })

  it('devrait gérer la réinitialisation de mot de passe', async () => {
    mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({
      data: {},
      error: null
    })
    
    const { result } = renderHook(() => useAuth(), { wrapper })
    
    await act(async () => {
      await result.current.resetPassword('test@example.com')
    })
    
    expect(mockSupabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
      'test@example.com',
      {
        redirectTo: expect.stringContaining('/reset-password')
      }
    )
  })

  it('devrait gérer la mise à jour du profil', async () => {
    const mockUser = {
      id: '123',
      email: 'test@example.com'
    }
    
    const updatedProfile = {
      name: 'Updated Name',
      bio: 'Updated bio'
    }
    
    mockSupabase.from().update.mockResolvedValue({
      data: [{ id: '123', ...updatedProfile }],
      error: null
    })
    
    const { result } = renderHook(() => useAuth(), { wrapper })
    
    // Simuler un utilisateur connecté
    act(() => {
      result.current.user = mockUser
    })
    
    await act(async () => {
      await result.current.updateProfile(updatedProfile)
    })
    
    expect(mockSupabase.from).toHaveBeenCalledWith('profiles')
  })

  it('devrait gérer les changements d\'état d\'authentification', async () => {
    const mockUser = {
      id: '123',
      email: 'test@example.com'
    }
    
    const mockSession = {
      user: mockUser,
      access_token: 'token123'
    }
    
    let authStateCallback
    
    mockSupabase.auth.onAuthStateChange.mockImplementation((callback) => {
      authStateCallback = callback
      return {
        data: {
          subscription: {
            unsubscribe: vi.fn()
          }
        }
      }
    })
    
    mockSupabase.from().select().eq().single.mockResolvedValue({
      data: { id: '123', name: 'Test User', email: 'test@example.com' },
      error: null
    })
    
    const { result } = renderHook(() => useAuth(), { wrapper })
    
    // Simuler un changement d'état d'authentification
    await act(async () => {
      if (authStateCallback) {
        await authStateCallback('SIGNED_IN', mockSession)
      }
    })
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
  })

  it('devrait nettoyer les subscriptions au démontage', () => {
    const unsubscribeMock = vi.fn()
    
    mockSupabase.auth.onAuthStateChange.mockReturnValue({
      data: {
        subscription: {
          unsubscribe: unsubscribeMock
        }
      }
    })
    
    const { unmount } = renderHook(() => useAuth(), { wrapper })
    
    unmount()
    
    expect(unsubscribeMock).toHaveBeenCalled()
  })

  it('devrait gérer les erreurs de récupération de profil', async () => {
    const mockUser = {
      id: '123',
      email: 'test@example.com'
    }
    
    const mockSession = {
      user: mockUser,
      access_token: 'token123'
    }
    
    mockSupabase.from().select().eq().single.mockResolvedValue({
      data: null,
      error: { message: 'Profile not found' }
    })
    
    let authStateCallback
    
    mockSupabase.auth.onAuthStateChange.mockImplementation((callback) => {
      authStateCallback = callback
      return {
        data: {
          subscription: {
            unsubscribe: vi.fn()
          }
        }
      }
    })
    
    const { result } = renderHook(() => useAuth(), { wrapper })
    
    await act(async () => {
      if (authStateCallback) {
        await authStateCallback('SIGNED_IN', mockSession)
      }
    })
    
    await waitFor(() => {
      expect(result.current.error).toBeTruthy()
    })
  })

  it('devrait valider les paramètres d\'entrée', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })
    
    // Test avec email invalide
    await act(async () => {
      try {
        await result.current.signIn('', 'password')
      } catch (error) {
        expect(error).toBeDefined()
      }
    })
    
    // Test avec mot de passe vide
    await act(async () => {
      try {
        await result.current.signIn('test@example.com', '')
      } catch (error) {
        expect(error).toBeDefined()
      }
    })
  })
})