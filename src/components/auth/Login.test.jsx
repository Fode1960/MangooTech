import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Login from './Login'
import { AuthProvider } from '../../contexts/AuthContext'
import { createMockSupabaseClient } from '../../test/setup'

// Mock du client Supabase
vi.mock('../../lib/supabase', () => ({
  supabase: createMockSupabaseClient()
}))

// Wrapper pour les tests avec les providers nécessaires
const TestWrapper = ({ children }) => (
  <BrowserRouter>
    <AuthProvider>
      {children}
    </AuthProvider>
  </BrowserRouter>
)

describe('Login Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('devrait afficher le formulaire de connexion', () => {
    render(
      <TestWrapper>
        <Login />
      </TestWrapper>
    )

    expect(screen.getByRole('heading', { name: /connexion/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/mot de passe/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /se connecter/i })).toBeInTheDocument()
  })

  it('devrait afficher des erreurs de validation pour les champs vides', async () => {
    render(
      <TestWrapper>
        <Login />
      </TestWrapper>
    )

    const submitButton = screen.getByRole('button', { name: /se connecter/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/email est requis/i)).toBeInTheDocument()
      expect(screen.getByText(/mot de passe est requis/i)).toBeInTheDocument()
    })
  })

  it('devrait valider le format de l\'email', async () => {
    render(
      <TestWrapper>
        <Login />
      </TestWrapper>
    )

    const emailInput = screen.getByLabelText(/email/i)
    const submitButton = screen.getByRole('button', { name: /se connecter/i })

    fireEvent.change(emailInput, { target: { value: 'email-invalide' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/format d\'email invalide/i)).toBeInTheDocument()
    })
  })

  it('devrait permettre la saisie dans les champs', () => {
    render(
      <TestWrapper>
        <Login />
      </TestWrapper>
    )

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/mot de passe/i)

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })

    expect(emailInput.value).toBe('test@example.com')
    expect(passwordInput.value).toBe('password123')
  })

  it('devrait avoir les attributs d\'accessibilité appropriés', () => {
    render(
      <TestWrapper>
        <Login />
      </TestWrapper>
    )

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/mot de passe/i)
    const form = screen.getByRole('form')

    expect(emailInput).toHaveAttribute('type', 'email')
    expect(emailInput).toHaveAttribute('required')
    expect(passwordInput).toHaveAttribute('type', 'password')
    expect(passwordInput).toHaveAttribute('required')
    expect(form).toHaveAttribute('noValidate')
  })

  it('devrait afficher un indicateur de chargement pendant la soumission', async () => {
    render(
      <TestWrapper>
        <Login />
      </TestWrapper>
    )

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/mot de passe/i)
    const submitButton = screen.getByRole('button', { name: /se connecter/i })

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)

    expect(submitButton).toBeDisabled()
    expect(screen.getByText(/connexion en cours/i)).toBeInTheDocument()
  })

  it('devrait naviguer vers le tableau de bord après une connexion réussie', async () => {
    const mockNavigate = vi.fn()
    vi.mock('react-router-dom', async () => {
      const actual = await vi.importActual('react-router-dom')
      return {
        ...actual,
        useNavigate: () => mockNavigate
      }
    })

    render(
      <TestWrapper>
        <Login />
      </TestWrapper>
    )

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/mot de passe/i)
    const submitButton = screen.getByRole('button', { name: /se connecter/i })

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
    })
  })

  it('devrait afficher un message d\'erreur en cas d\'échec de connexion', async () => {
    // Mock d'une erreur de connexion
    const mockSupabase = createMockSupabaseClient()
    mockSupabase.auth.signInWithPassword.mockRejectedValue(new Error('Identifiants invalides'))

    render(
      <TestWrapper>
        <Login />
      </TestWrapper>
    )

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/mot de passe/i)
    const submitButton = screen.getByRole('button', { name: /se connecter/i })

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/identifiants invalides/i)).toBeInTheDocument()
    })
  })

  it('devrait permettre la navigation vers la page d\'inscription', () => {
    render(
      <TestWrapper>
        <Login />
      </TestWrapper>
    )

    const registerLink = screen.getByRole('link', { name: /créer un compte/i })
    expect(registerLink).toHaveAttribute('href', '/register')
  })
})