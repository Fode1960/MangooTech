import React from 'react';
import { Link } from 'react-router-dom';
import { Users, Phone, DollarSign, Globe, ShoppingBag, BarChart3, Shield } from 'lucide-react';

const TestAccess: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">
        
        {/* HEADER & TITRE */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            🚀 Tests MangooTech
          </h1>
          <p className="text-lg text-gray-600">
            Accès rapide à toutes les fonctionnalités de test
          </p>
        </div>

        {/* 🚨 ZONE ADMIN EN PREMIER ET TRÈS VISIBLE 🚨 */}
        <div className="bg-red-600 rounded-xl shadow-2xl p-8 mb-10 transform hover:scale-105 transition-transform border-4 border-white">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Shield className="w-10 h-10 text-white mr-4" />
              <div>
                <h2 className="text-3xl font-extrabold text-white">ZONE ADMINISTRATION</h2>
                <p className="text-red-100 font-medium">Accès complet au système (Wallet, Boutiques, Tontines)</p>
              </div>
            </div>
          </div>
          
          <button
            type="button"
            onClick={() => {
              const adminUser = {
                id: 'admin-user-id',
                email: 'admin@mangoo.tech',
                role: 'admin',
                user_metadata: { role: 'admin', full_name: 'Administrateur' }
              };
              localStorage.setItem('user', JSON.stringify(adminUser));
              localStorage.setItem('token', 'fake-admin-token');
              localStorage.setItem('currentRole', 'admin');
              window.location.href = '/admin/dashboard';
            }}
            className="w-full bg-white text-red-600 hover:bg-gray-100 text-center py-5 px-6 rounded-xl font-black text-2xl shadow-lg transition-all flex items-center justify-center space-x-3"
          >
            <span>🔒</span>
            <span>ACCÉDER AU DASHBOARD ADMIN & WALLET</span>
          </button>
        </div>

        {/* AUTRES TESTS (Secondaire) */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 opacity-90">
          
          {/* Tontines Numériques */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center mb-4">
              <div className="bg-red-100 p-3 rounded-full mr-4">
                <DollarSign className="w-6 h-6 text-red-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800">Tontines</h2>
            </div>
            <Link to="/tontines" className="block w-full bg-red-500 text-white text-center py-2 rounded-lg font-bold">
              💰 Tontines Numériques
            </Link>
          </div>

          {/* WebRTC */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center mb-4">
              <div className="bg-green-100 p-3 rounded-full mr-4">
                <Phone className="w-6 h-6 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800">WebRTC</h2>
            </div>
            <Link to="/webrtc-vendor-final" className="block w-full bg-green-500 text-white text-center py-2 rounded-lg font-bold mb-2">
              🎥 Vendeur
            </Link>
            <Link to="/webrtc-client-final" className="block w-full bg-blue-500 text-white text-center py-2 rounded-lg font-bold">
              � Client
            </Link>
          </div>

          {/* Live Shopping */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center mb-4">
              <div className="bg-pink-100 p-3 rounded-full mr-4">
                <Users className="w-6 h-6 text-pink-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800">Live Shopping</h2>
            </div>
            <Link to="/live-shopping" className="block w-full bg-pink-500 text-white text-center py-2 rounded-lg font-bold">
              🛍️ Live Shopping
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
};

export default TestAccess;