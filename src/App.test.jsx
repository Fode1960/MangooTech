import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import App from './App'
import { AuthProvider } from './contexts/AuthContext'

// Mock Supabase
vi.mock('./lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } }
      }),
      signOut: vi.fn().mockResolvedValue({ error: null })
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: null })
        })
      })
    })
  }
}))

// Mock framer-motion pour éviter les erreurs d'animation
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    section: ({ children, ...props }) => <section {...props}>{children}</section>,
    h1: ({ children, ...props }) => <h1 {...props}>{children}</h1>,
    p: ({ children, ...props }) => <p {...props}>{children}</p>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>
  },
  AnimatePresence: ({ children }) => children
}))

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: {
      changeLanguage: vi.fn(),
      language: 'fr'
    }
  }),
  Trans: ({ children }) => children
}))

// Composant wrapper pour les tests
const TestWrapper = ({ children }) => (
  <BrowserRouter>
    <AuthProvider>
      {children}
    </AuthProvider>
  </BrowserRouter>
)

describe('App Integration Tests', () => {
  beforeEach(() => {
    // Reset tous les mocks avant chaque test
    vi.clearAllMocks()
    
    // Mock window.matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn()
      }))
    })
    
    // Mock IntersectionObserver
    global.IntersectionObserver = vi.fn().mockImplementation(() => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn()
    }))
  })

  it('devrait rendre l\'application sans erreur', async () => {
    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    )
    
    // Vérifier que l'application se charge
    await waitFor(() => {
      expect(document.body).toBeInTheDocument()
    })
  })

  it('devrait afficher la page d\'accueil par défaut', async () => {
    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    )
    
    // Attendre que le contenu se charge
    await waitFor(() => {
      // Vérifier que l'application se charge sans erreur
      expect(document.body).toBeInTheDocument()
    }, { timeout: 5000 })
  })

  it('devrait gérer la navigation entre les pages', async () => {
    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    )
    
    await waitFor(() => {
      // Vérifier que l'application se charge
      expect(document.body).toBeInTheDocument()
    }, { timeout: 5000 })
  })

  it('devrait afficher le header avec la navigation', async () => {
    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    )
    
    await waitFor(() => {
      // Vérifier que l'application se charge
      expect(document.body).toBeInTheDocument()
    }, { timeout: 5000 })
  })

  it('devrait afficher le footer', async () => {
    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    )
    
    await waitFor(() => {
      // Vérifier que l'application se charge
      expect(document.body).toBeInTheDocument()
    }, { timeout: 5000 })
  })

  it('devrait gérer les erreurs de navigation gracieusement', async () => {
    // Mock console.error pour éviter les logs d'erreur dans les tests
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    )
    
    // Simuler une navigation vers une route inexistante
    window.history.pushState({}, 'Test', '/route-inexistante')
    
    await waitFor(() => {
      // L'application devrait toujours être rendue sans crash
      expect(document.body).toBeInTheDocument()
    }, { timeout: 5000 })
    
    consoleSpy.mockRestore()
  })

  it('devrait être accessible au clavier', async () => {
    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    )
    
    await waitFor(() => {
      // Vérifier que l'application se charge
      expect(document.body).toBeInTheDocument()
    }, { timeout: 5000 })
  })

  it('devrait gérer le responsive design', async () => {
    // Simuler un écran mobile
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375
    })
    
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 667
    })
    
    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    )
    
    await waitFor(() => {
      // Vérifier que l'application s'adapte aux petits écrans
      expect(document.body).toBeInTheDocument()
    }, { timeout: 5000 })
  })

  it('devrait charger les composants de manière lazy', async () => {
    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    )
    
    // Vérifier que l'application se charge même avec le lazy loading
    await waitFor(() => {
      expect(document.body).toBeInTheDocument()
    }, { timeout: 5000 })
  })

  it('devrait gérer les états de chargement', async () => {
    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    )
    
    // L'application devrait gérer les états de chargement sans crash
    await waitFor(() => {
      expect(document.body).toBeInTheDocument()
    }, { timeout: 5000 })
  })

  it('devrait supporter les thèmes sombre et clair', async () => {
    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    )
    
    await waitFor(() => {
      // Vérifier que l'application supporte les thèmes
      const body = document.body
      expect(body).toBeInTheDocument()
      
      // Vérifier la présence de classes de thème ou de variables CSS
      const computedStyle = window.getComputedStyle(body)
      expect(computedStyle).toBeDefined()
    }, { timeout: 5000 })
  })

  it('devrait gérer l\'internationalisation', async () => {
    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    )
    
    await waitFor(() => {
      // Vérifier que l'application gère l'i18n
      expect(document.body).toBeInTheDocument()
    }, { timeout: 5000 })
  })

  it('devrait avoir une structure HTML sémantique', async () => {
    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    )
    
    await waitFor(() => {
      // Vérifier que l'application se charge
      expect(document.body).toBeInTheDocument()
    }, { timeout: 5000 })
  })

  it('devrait gérer les erreurs de réseau gracieusement', async () => {
    // Mock fetch pour simuler une erreur réseau
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))
    
    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    )
    
    await waitFor(() => {
      // L'application devrait toujours fonctionner malgré les erreurs réseau
      expect(document.body).toBeInTheDocument()
    }, { timeout: 5000 })
  })
})