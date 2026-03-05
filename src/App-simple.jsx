import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import Navigation from './components/Navigation';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import VendorDashboardSimple from './pages/VendorDashboardSimple';
import CustomerDashboard from './pages/CustomerDashboard';
import ProductManagement from './pages/ProductManagement';
import CustomerReviews from './pages/CustomerReviews';
import PushNotifications from './pages/PushNotifications';
import ChatSystem from './pages/ChatSystem';
import VideoAudioCalls from './pages/VideoAudioCalls';
import LiveShopping from './pages/LiveShopping';
import InnovationHub from './components/InnovationHub';
import AfricanInnovationHub from './components/AfricanInnovationHub';
import MiniBoutiques from './pages/MiniBoutiques';
import TestMiniBoutiques from './pages/TestMiniBoutiques';
import TontinesPage from './pages/TontinesPage';
import TestAccess from './pages/TestAccess';
import VendorWebRTCPage from './pages/VendorWebRTCPage';
import ClientWebRTCPage from './pages/ClientWebRTCPage';
import WebRTCTestGuide from './pages/WebRTCTestGuide';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ChatProvider } from './contexts/ChatContext';
import './App.css';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
};

// Public Route Component (redirect if authenticated)
const PublicRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? <Navigate to="/dashboard" /> : children;
};

function App() {
  return (
    <AuthProvider>
      <ChatProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Navigation />
            <main>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
                <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
                
                {/* Protected Routes */}
                <Route path="/dashboard" element={<ProtectedRoute><CustomerDashboard /></ProtectedRoute>} />
                <Route path="/vendor-dashboard" element={<ProtectedRoute><VendorDashboardSimple /></ProtectedRoute>} />
                <Route path="/products" element={<ProtectedRoute><ProductManagement /></ProtectedRoute>} />
                <Route path="/reviews" element={<ProtectedRoute><CustomerReviews /></ProtectedRoute>} />
                <Route path="/notifications" element={<ProtectedRoute><PushNotifications /></ProtectedRoute>} />
                <Route path="/chat" element={<ProtectedRoute><ChatSystem /></ProtectedRoute>} />
                <Route path="/video-calls" element={<ProtectedRoute><VideoAudioCalls /></ProtectedRoute>} />
                <Route path="/live-shopping" element={<ProtectedRoute><LiveShopping /></ProtectedRoute>} />
                
                {/* WebRTC Final Routes (version finale avec sonnerie) */}
                <Route path="/webrtc-vendor-final" element={<VendorWebRTCPage />} />
                <Route path="/webrtc-client-final" element={<ClientWebRTCPage />} />
                <Route path="/webrtc-test-guide" element={<WebRTCTestGuide />} />
                
                {/* Innovation Hub Routes */}
                <Route path="/innovation-hub" element={<InnovationHub />} />
                <Route path="/african-innovations" element={<AfricanInnovationHub />} />
                
                {/* Mini-Boutiques Routes */}
                <Route path="/mini-boutiques" element={<ProtectedRoute><MiniBoutiques /></ProtectedRoute>} />
                <Route path="/test-mini-boutiques" element={<TestMiniBoutiques />} />
                
                {/* Tontines Numériques Routes */}
                <Route path="/tontines" element={<ProtectedRoute><TontinesPage /></ProtectedRoute>} />
                
                {/* Page d'accès aux tests */}
                <Route path="/test-access" element={<TestAccess />} />
                
                {/* Fallback Route */}
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </main>
            <Toaster position="top-right" />
          </div>
        </Router>
      </ChatProvider>
    </AuthProvider>
  );
}

export default App;