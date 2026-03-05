import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Package, Video } from 'lucide-react';
import { LiveShoppingProvider } from './contexts/LiveShoppingContext'; // Import du Provider
import TestVideoCallUltraSimple from './pages/TestVideoCallUltraSimple';
import TestLiveShoppingFixed from './pages/TestLiveShoppingFixed';
import QuickLoginDemo from './components/QuickLoginDemo';
import TestAccess from './pages/TestAccess'; // Import direct
import AdminWallet from './pages/AdminWallet'; // Ajout du Wallet
import AdminDashboard from './pages/AdminDashboard'; // Ajout du Dashboard
import AdminShops from './pages/AdminShops'; // Ajout de la gestion des boutiques
import VendorDashboardNew from './pages/VendorDashboard'; // Dashboard Vendeur
import CustomerDashboard from './pages/CustomerDashboard'; // Dashboard Client
import ClientWebRTCPage from './pages/ClientWebRTCPage';
import ChatSystem from './pages/ChatSystem';
import VideoCallManagerPage from './pages/VideoCallManagerPage';
import LiveShoppingPage from './pages/LiveShoppingPage';
import CustomerReviews from './pages/CustomerReviews';
import PushNotifications from './pages/PushNotifications';
import VendorDashboardFinal from './pages/VendorDashboardFinal'; // Version finale stable

// App minimaliste sans Supabase pour éviter les conflits
function AppMinimalClean() {
  const [user, setUser] = useState(null);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 text-gray-900">
        {/* Navigation simple */}
        <nav className="bg-white p-4 border-b border-gray-200 shadow-sm">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <h1 className="text-xl font-bold text-blue-600">MangooTech Test</h1>
              <div className="flex space-x-4 text-sm font-medium">
                <Link to="/" className="text-gray-600 hover:text-blue-600 transition-colors">Accueil</Link>
                <Link to="/test-access" className="text-gray-600 hover:text-blue-600 transition-colors">Tests Avancés</Link>
              </div>
            </div>
            {user && (
              <button
                onClick={handleLogout}
                className="bg-red-50 text-red-600 hover:bg-red-100 px-4 py-2 rounded-lg transition-colors text-sm font-medium"
              >
                Déconnexion
              </button>
            )}
          </div>
        </nav>

        {/* Routes */}
        <Routes>
          {/* DASHBOARDS - Routes prioritaires */}
          <Route path="/vendor/dashboard" element={<VendorDashboardFinal />} />
          <Route path="/customer/dashboard" element={<CustomerDashboard />} />
          {/* Routes alternatives en cas de problème de cache/slash */}
          <Route path="/vendor-dashboard" element={<VendorDashboardFinal />} />
          <Route path="/customer-dashboard" element={<CustomerDashboard />} />

          {/* Route par défaut : TestAccess (Nouvelle version) */}
          <Route path="/" element={<TestAccess />} />
          <Route path="/test-access" element={<TestAccess />} />
          
          {/* ROUTES ADMIN DASHBOARD */}
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/wallet" element={<AdminWallet />} />
          <Route path="/admin/shops" element={<AdminShops />} />
          
          {/* ROUTES FONCTIONNELLES */}
          <Route path="/client-webrtc" element={
            <LiveShoppingProvider>
              <ClientWebRTCPage />
            </LiveShoppingProvider>
          } />
          <Route path="/products" element={
            <div className="min-h-screen bg-gray-50 p-8">
              <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-6">Catalogue Produits</h1>
                <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                  <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Package className="w-8 h-8 text-orange-600" />
                  </div>
                  <h2 className="text-xl font-semibold mb-2">Catalogue en cours de construction</h2>
                  <p className="text-gray-600 mb-6">
                    Nous travaillons sur l'expérience d'achat ultime. En attendant, essayez le Live Shopping !
                  </p>
                  <Link to="/live-shopping" className="inline-flex items-center gap-2 bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors">
                    <Video className="w-5 h-5" />
                    Découvrir le Live Shopping
                  </Link>
                </div>
              </div>
            </div>
          } /> {/* Placeholder Shopping Amélioré */}
          <Route path="/chat" element={<ChatSystem />} />
          <Route path="/vendor-chat" element={<ChatSystem />} />
          <Route path="/reviews" element={<CustomerReviews />} />
          <Route path="/notifications" element={<PushNotifications />} />
          <Route path="/video-call-manager" element={<VideoCallManagerPage />} />
          <Route path="/live-shopping" element={
            <LiveShoppingProvider>
              <LiveShoppingPage />
            </LiveShoppingProvider>
          } />
          <Route path="/create-shop" element={<AdminShops />} /> {/* Redirection vers AdminShops pour démo */}
          
          <Route path="/client-webrtc-page" element={
            <LiveShoppingProvider>
              <ClientWebRTCPage />
            </LiveShoppingProvider>
          } />
          <Route path="/client-webrtc" element={
            <LiveShoppingProvider>
              <ClientWebRTCPage />
            </LiveShoppingProvider>
          } /> {/* Alias */}

          <Route path="/demo" element={<QuickLoginDemo />} />
          <Route path="/test-video-call" element={<TestVideoCallUltraSimple />} />
          <Route path="/test-live-shopping" element={<TestLiveShoppingFixed />} />
          
          {/* Catch all */}
          <Route path="*" element={
            <div className="text-center py-16">
              <h2 className="text-2xl font-bold mb-4">Page introuvable (404)</h2>
              <p className="mb-4">Chemin: {window.location.pathname}</p>
              <Link to="/" className="text-blue-600 hover:text-blue-700 transition-colors underline">
                Retour à l'accueil
              </Link>
            </div>
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default AppMinimalClean;