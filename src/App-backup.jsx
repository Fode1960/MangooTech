import React, { Suspense, useEffect, useState, lazy } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { useTranslation } from 'react-i18next'
import { supabase, auth } from './lib/supabase'

console.log('📱 APP - App.jsx chargé')

// Composants de layout (chargés immédiatement)
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import ScrollToTop from './components/ui/ScrollToTop'
import BackToTop from './components/ui/BackToTop'
import CookieBanner from './components/ui/CookieBanner'

// Composants de fallback
import { PageLoadingFallback, LoadingErrorFallback } from './components/ui/LoadingFallback'
import { LazyPages, RoutePreloader } from './utils/performance'
import { ErrorBoundary } from './utils/errorHandling'

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
// Import direct pour les composants utilisés dans ProtectedRoute
import Dashboard from './pages/Dashboard'
import AdminDashboard from './pages/admin/AdminDashboard'
import TestAdminSystem from './pages/admin/TestAdminSystem'
import TestSuperAdmin from './pages/admin/TestSuperAdmin'
import TestAdminServiceFix from './pages/admin/TestAdminServiceFix'
const NotFound = LazyPages.NotFound

// Pages du Marketplace
const Marketplace = LazyPages.Marketplace
// Import direct pour les composants utilisés dans ProtectedRoute
import ShopDashboard from './pages/marketplace/ShopDashboard'
// Test sans lazy loading pour debug
import ProductManagementDirect from './pages/marketplace/ProductManagement'
import CreateProductFixedDirect from './pages/marketplace/CreateProductFixed'
import SellerDashboardDirect from './pages/shop/SellerDashboard'
const ProductManagement = ProductManagementDirect
const CreateProduct = CreateProductFixedDirect
const SellerDashboard = SellerDashboardDirect

// Import direct pour les composants utilisés dans ProtectedRoute (évite les problèmes de lazy loading)
import CreateShop from './pages/marketplace/CreateShop'
import OrderManagementDirect from './pages/marketplace/OrderManagement.tsx'
import SellerSettings from './pages/marketplace/SellerSettings'
import ProductDetail from './pages/marketplace/ProductDetail'

const OrderManagement = OrderManagementDirect

// Pages des Shops
const ShopPage = LazyPages.ShopPage

// Composant de test temporaire
// Import direct pour éviter les problèmes de lazy loading dans les routes protégées
import TestDataCreator from './components/TestDataCreator'
import TestAdminSetup from './pages/TestAdminSetup'

// Page de diagnostic (chargement direct pour le debug)
// import LogoutDebug from './pages/LogoutDebug'

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
        
        // En cas d'erreur de connexion, continuer sans authentification
        if (error.name === 'AbortError' || error.message?.includes('network') || error.message?.includes('timeout')) {
          console.warn('Connexion à Supabase indisponible, continuation en mode hors ligne')
        }
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
                  <ErrorBoundary>
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
                        
                        {/* Routes publiques du Marketplace */}
                        <Route path="/marketplace" element={<Marketplace />} />
                        <Route path="/shop/:shopSlug" element={<ShopPage />} />
                        <Route path="/shop/:shopSlug/product/:productSlug" element={<ProductDetail />} />
                        
                        {/* Route de test temporaire */}
                        <Route path="/test-data" element={
                          <Suspense fallback={<PageLoadingFallback />}>
                            <TestDataCreator />
                          </Suspense>
                        } />
                        
                        {/* Route de test pour l'admin setup */}
                        <Route path="/test-admin-setup" element={
                          <Suspense fallback={<PageLoadingFallback />}>
                            <TestAdminSetup />
                          </Suspense>
                        } />
                        
                        {/* Routes protégées - Vendeur */}
                        <Route 
                          path="/seller/create-shop" 
                          element={
                            <ProtectedRoute>
                              <CreateShop />
                            </ProtectedRoute>
                          } 
                        />
                        <Route 
                          path="/seller/dashboard" 
                          element={
                            <ProtectedRoute>
                              <ShopDashboard />
                            </ProtectedRoute>
                          } 
                        />
                        <Route 
                          path="/seller/products" 
                          element={
                            <ProtectedRoute>
                              <ProductManagement />
                            </ProtectedRoute>
                          } 
                        />
                        <Route 
                          path="/seller/products/new" 
                          element={
                            <ProtectedRoute>
                              <CreateProduct />
                            </ProtectedRoute>
                          } 
                        />
                        <Route 
                          path="/seller/products/:id/edit" 
                          element={
                            <ProtectedRoute>
                              <CreateProduct />
                            </ProtectedRoute>
                          } 
                        />
                        <Route 
                          path="/seller/orders" 
                          element={
                            <ProtectedRoute>
                              <OrderManagement />
                            </ProtectedRoute>
                          } 
                        />
                        <Route 
                          path="/seller/settings" 
                          element={
                            <ProtectedRoute>
                              <SellerSettings />
                            </ProtectedRoute>
                          } 
                        />
                        
                        {/* Routes protégées - Client */}
                        <Route 
                          path="/dashboard" 
                          element={
                            <ProtectedRoute>
                              <Dashboard />
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
                        
                        {/* Route de test pour le système admin */}
                        <Route 
                          path="/admin/test" 
                          element={
                            <ProtectedRoute requireAdmin>
                              <TestAdminSystem />
                            </ProtectedRoute>
                          } 
                        />
                        
                        {/* Route de test pour les fonctionnalités Super Admin */}
                        <Route 
                          path="/admin/test-super" 
                          element={
                            <ProtectedRoute requireAdmin>
                              <TestSuperAdmin />
                            </ProtectedRoute>
                          } 
                        />
                        
                        {/* Route de test pour vérifier le fix du service admin */}
                        <Route 
                          path="/admin/test-service-fix" 
                          element={
                            <ProtectedRoute requireAdmin>
                              <TestAdminServiceFix />
                            </ProtectedRoute>
                          } 
                        />
                        
                        {/* Route 404 */}
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </Suspense>
                  </ErrorBoundary>
                  
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