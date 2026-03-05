import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import TestVideoCall from './pages/TestVideoCallSimple';
import TestLiveShopping from './pages/TestLiveShoppingSimple';
import QuickLoginDemo from './components/QuickLoginDemo';

// App minimaliste pour tester les fonctionnalités
function App() {
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
      <div className="min-h-screen bg-gray-900 text-white">
        {/* Navigation simple */}
        <nav className="bg-gray-800 p-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold">Mangootech Test</h1>
              <Link to="/" className="hover:text-blue-400">Accueil</Link>
              <Link to="/demo" className="hover:text-blue-400">Demo</Link>
              <Link to="/test-video-call" className="hover:text-blue-400">Test Vidéo</Link>
              <Link to="/test-live-shopping" className="hover:text-blue-400">Test Live</Link>
            </div>
            {user && (
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg"
              >
                Déconnexion
              </button>
            )}
          </div>
        </nav>

        {/* Routes */}
        <Routes>
          <Route path="/" element={
            <div className="max-w-6xl mx-auto p-8">
              <h2 className="text-3xl font-bold mb-6">Plateforme de Test Mangootech</h2>
              <p className="text-gray-300 mb-8">
                Testez les fonctionnalités WebRTC, Live Shopping et plus encore.
              </p>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-gray-800 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold mb-4">Tests Directs</h3>
                  <div className="space-y-3">
                    <Link
                      to="/test-video-call"
                      className="block bg-blue-600 hover:bg-blue-700 p-4 rounded-lg text-center transition-colors"
                    >
                      🎥 Test Appel Vidéo
                    </Link>
                    <Link
                      to="/test-live-shopping"
                      className="block bg-red-600 hover:bg-red-700 p-4 rounded-lg text-center transition-colors"
                    >
                      🛍️ Test Live Shopping
                    </Link>
                  </div>
                </div>
                
                <div className="bg-gray-800 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold mb-4">Comptes Demo</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Admin:</span>
                      <span className="text-gray-400">admin@mangoo.tech / admin123</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Vendeur:</span>
                      <span className="text-gray-400">vendor@example.com / vendor123</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Client:</span>
                      <span className="text-gray-400">client@example.com / client123</span>
                    </div>
                  </div>
                  <Link
                    to="/demo"
                    className="block bg-green-600 hover:bg-green-700 p-3 rounded-lg text-center mt-4 transition-colors"
                  >
                    🚀 Interface Demo Complète
                  </Link>
                </div>
              </div>
            </div>
          } />
          
          <Route path="/demo" element={
            <QuickLoginDemo />
          } />
          
          <Route path="/test-video-call" element={
            <TestVideoCall />
          } />
          
          <Route path="/test-live-shopping" element={
            <TestLiveShopping />
          } />
          
          {/* Catch all */}
          <Route path="*" element={
            <div className="max-w-6xl mx-auto p-8 text-center">
              <h2 className="text-2xl font-bold mb-4">Page non trouvée</h2>
              <Link to="/" className="text-blue-400 hover:text-blue-300">
                Retour à l'accueil
              </Link>
            </div>
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;