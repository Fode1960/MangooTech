import React, { Suspense, useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { useTranslation } from 'react-i18next'
import { supabase, auth } from './lib/supabase'

// Composants de layout (chargés immédiatement)
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import ScrollToTop from './components/ui/ScrollToTop'
import BackToTop from './components/ui/BackToTop'
import CookieBanner from './components/ui/CookieBanner'

// Composants de fallback
import { PageLoadingFallback, LoadingErrorFallback } from './components/ui/LoadingFallback'
import { LazyPages, RoutePreloader } from './utils/performance'

// Contextes
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { ServicesProvider } from './contexts/ServicesContext'

// Composant de protection des routes
import ProtectedRoute from './components/auth/ProtectedRoute'

// SEO
import SEOHead from './components/seo/SEOHead'

// Pages avec lazy loading
const Home = LazyPages.Home
const Services = LazyPages.Services
const About = LazyPages.About
const Contact = LazyPages.Contact
const Terms = LazyPages.Terms
const Privacy = LazyPages.Privacy
const Cookies = LazyPages.Cookies
const Login = LazyPages.Login
const Register = LazyPages.Register
const ForgotPassword = LazyPages.ForgotPassword
const ResetPassword = LazyPages.ResetPassword
// EmailConfirmation supprimée - confirmation d'email désactivée
const AuthCallback = LazyPages.AuthCallback
const Dashboard = LazyPages.Dashboard
const AdminDashboard = LazyPages.AdminDashboard
const NotFound = LazyPages.NotFound

// Page de diagnostic (chargement direct pour le debug)
import LogoutDebug from './pages/LogoutDebug'

function App() {
  const { i18n } = useTranslation()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)

  useEffect(() => {
    // Vérifier l'état d'authentification au chargement
    const checkAuth = async () => {
      try {
        const { user } = await auth.getCurrentUser()
        setUser(user)
      } catch (error) {
        console.error('Erreur lors de la vérification de l\'authentification:', error)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()

    // Écouter les changements d'état d'authentification
    const { data: { subscription } } = auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    // Appliquer la direction RTL pour l'arabe
    const direction = i18n.language === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.setAttribute('dir', direction)
    document.documentElement.setAttribute('lang', i18n.language)
  }, [i18n.language])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <PageLoadingFallback message="Initialisation de l'application..." />
      </div>
    )
  }

  return (
    <HelmetProvider>
      <ThemeProvider>
        <AuthProvider>
          <ServicesProvider>
            <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
              <ScrollToTop />
              <SEOHead pageKey="home" />
              <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
                <Navbar />
                
                <main className="flex-grow">
                  <Suspense fallback={<PageLoadingFallback />}>
                    <Routes>
                      {/* Routes publiques */}
                      <Route path="/" element={<Home />} />
                      <Route path="/services" element={<Services />} />
                      <Route path="/about" element={<About />} />
                      <Route path="/contact" element={<Contact />} />
                      <Route path="/terms" element={<Terms />} />
                      <Route path="/privacy" element={<Privacy />} />
                      <Route path="/cookies" element={<Cookies />} />
                      <Route path="/login" element={<Login />} />
                      <Route path="/register" element={<Register />} />
                      <Route path="/forgot-password" element={<ForgotPassword />} />
                      <Route path="/reset-password" element={<ResetPassword />} />
                      {/* Route EmailConfirmation supprimée - confirmation d'email désactivée */}
                      <Route path="/auth/callback" element={<AuthCallback />} />
                      
                      {/* Routes protégées - Client */}
                      <Route 
                        path="/dashboard" 
                        element={
                          <ProtectedRoute>
                            <Dashboard />
                          </ProtectedRoute>
                        } 
                      />
                      
                      {/* Route de diagnostic de déconnexion */}
                      <Route 
                        path="/logout-debug" 
                        element={
                          <ProtectedRoute>
                            <LogoutDebug />
                          </ProtectedRoute>
                        } 
                      />
                      
                      {/* Routes protégées - Admin */}
                      <Route 
                        path="/admin" 
                        element={
                          <ProtectedRoute requireAdmin>
                            <AdminDashboard />
                          </ProtectedRoute>
                        } 
                      />
                      
                      {/* Route 404 */}
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Suspense>
                  
                  {/* Préchargement intelligent des routes */}
                  <RoutePreloader routes={['About', 'Services', 'Contact']} />
                </main>
                
                <Footer />
              </div>
              
              {/* Bouton retour en haut disponible sur toutes les pages */}
              <BackToTop />
              
              {/* Bannière de cookies */}
              <CookieBanner />
            </Router>
          </ServicesProvider>
        </AuthProvider>
      </ThemeProvider>
    </HelmetProvider>
  )
}

export default App