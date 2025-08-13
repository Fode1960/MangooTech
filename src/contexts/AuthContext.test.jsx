import React from 'react'
import { render, screen, waitFor, act } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { AuthProvider, useAuth } from './AuthContext'
import { auth } from '../lib/supabase'

// Mock de Supabase
vi.mock('../lib/supabase', () => ({
  auth: {
    getCurrentUser: vi.fn(),
    onAuthStateChange: vi.fn(),
    signUp: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn(),
    updateProfile: vi.fn()
  },
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn()
        }))
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn()
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn()
          }))
        }))
      }))
    }))
  }
}))

// Composant de test pour utiliser le hook useAuth
const TestComponent = () => {
  const { user, userProfile, loading, error, signUp, signIn, signOut, updateProfile } = useAuth()
  
  return (
    <div>
      <div data-testid="loading">{loading ? 'loading' : 'not-loading'}</div>
      <div data-testid="user">{user ? user.email : 'no-user'}</div>
      <div data-testid="profile">{userProfile ? userProfile.first_name : 'no-profile'}</div>
      <div data-testid="error">{error || 'no-error'}</div>
      <button onClick={() => signUp('test@example.com', 'password123', { first_name: 'Test' })}>Sign Up</button>
      <button onClick={() => signIn('test@example.com', 'password123')}>Sign In</button>
      <button onClick={signOut}>Sign Out</button>
      <button onClick={() => updateProfile({ first_name: 'Updated' })}>Update Profile</button>
    </div>
  )
}

describe('AuthContext', () => {
  let mockSubscription
  
  beforeEach(() => {
    // Reset des mocks
    vi.clearAllMocks()
    
    // Mock de la subscription
    mockSubscription = {
      unsubscribe: vi.fn()
    }
    
    auth.onAuthStateChange.mockReturnValue({
      data: { subscription: mockSubscription }
    })
  })
  
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should render loading state initially', async () => {
    auth.getCurrentUser.mockResolvedValue({ user: null })
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )
    
    expect(screen.getByTestId('loading')).toHaveTextContent('loading')
  })

  it('should handle user authentication state', async () => {
    const mockUser = {
      id: '123',
      email: 'test@example.com'
    }
    
    auth.getCurrentUser.mockResolvedValue({ user: mockUser })
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )
    
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('not-loading')
      expect(screen.getByTestId('user')).toHaveTextContent('test@example.com')
    })
  })

  it('should handle sign up', async () => {
    const mockUser = {
      id: '123',
      email: 'test@example.com'
    }
    
    auth.getCurrentUser.mockResolvedValue({ user: null })
    auth.signUp.mockResolvedValue({ 
      data: { user: mockUser }, 
      error: null 
    })
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )
    
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('not-loading')
    })
    
    const signUpButton = screen.getByText('Sign Up')
    await act(async () => {
      signUpButton.click()
    })
    
    expect(auth.signUp).toHaveBeenCalledWith(
      'test@example.com',
      'password123',
      { first_name: 'Test' }
    )
  })

  it('should handle sign in', async () => {
    const mockUser = {
      id: '123',
      email: 'test@example.com'
    }
    
    auth.getCurrentUser.mockResolvedValue({ user: null })
    auth.signIn.mockResolvedValue({ 
      data: { user: mockUser }, 
      error: null 
    })
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )
    
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('not-loading')
    })
    
    const signInButton = screen.getByText('Sign In')
    await act(async () => {
      signInButton.click()
    })
    
    expect(auth.signIn).toHaveBeenCalledWith(
      'test@example.com',
      'password123'
    )
  })

  it('should handle sign out', async () => {
    const mockUser = {
      id: '123',
      email: 'test@example.com'
    }
    
    auth.getCurrentUser.mockResolvedValue({ user: mockUser })
    auth.signOut.mockResolvedValue({ error: null })
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )
    
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('not-loading')
    })
    
    const signOutButton = screen.getByText('Sign Out')
    await act(async () => {
      signOutButton.click()
    })
    
    expect(auth.signOut).toHaveBeenCalled()
  })

  it('should handle authentication errors', async () => {
    const errorMessage = 'Authentication failed'
    
    auth.getCurrentUser.mockResolvedValue({ user: null })
    auth.signIn.mockResolvedValue({ 
      data: { user: null }, 
      error: { message: errorMessage } 
    })
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )
    
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('not-loading')
    })
    
    const signInButton = screen.getByText('Sign In')
    await act(async () => {
      signInButton.click()
    })
    
    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent(errorMessage)
    })
  })

  it('should handle profile updates', async () => {
    const mockUser = {
      id: '123',
      email: 'test@example.com'
    }
    
    const mockProfile = {
      id: '123',
      first_name: 'Test',
      last_name: 'User'
    }
    
    auth.getCurrentUser.mockResolvedValue({ user: mockUser })
    auth.updateProfile.mockResolvedValue({ 
      data: mockProfile, 
      error: null 
    })
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )
    
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('not-loading')
    })
    
    const updateButton = screen.getByText('Update Profile')
    await act(async () => {
      updateButton.click()
    })
    
    expect(auth.updateProfile).toHaveBeenCalledWith(
      { first_name: 'Updated' }
    )
  })

  it('should throw error when useAuth is used outside AuthProvider', () => {
    // Supprimer les logs d'erreur pour ce test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    expect(() => {
      render(<TestComponent />)
    }).toThrow('useAuth must be used within an AuthProvider')
    
    consoleSpy.mockRestore()
  })

  it('should cleanup subscription on unmount', async () => {
    auth.getCurrentUser.mockResolvedValue({ user: null })
    
    const { unmount } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )
    
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('not-loading')
    })
    
    unmount()
    
    expect(mockSubscription.unsubscribe).toHaveBeenCalled()
  })

  it('should handle auth state changes', async () => {
    const mockUser = {
      id: '123',
      email: 'test@example.com'
    }
    
    let authStateCallback
    auth.getCurrentUser.mockResolvedValue({ user: null })
    auth.onAuthStateChange.mockImplementation((callback) => {
      authStateCallback = callback
      return { data: { subscription: mockSubscription } }
    })
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )
    
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('not-loading')
      expect(screen.getByTestId('user')).toHaveTextContent('no-user')
    })
    
    // Simuler un changement d'état d'authentification
    act(() => {
      authStateCallback('SIGNED_IN', { user: mockUser })
    })
    
    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('test@example.com')
    })
  })
})