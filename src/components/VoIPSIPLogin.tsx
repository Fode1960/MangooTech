import React, { useState } from 'react';
import { Phone, User, Lock, Play, ShoppingCart, Users, TrendingUp } from 'lucide-react';

interface VoIPSIPLoginProps {
  onLogin: (number: string, password: string, mode: 'host' | 'viewer') => void;
}

const VoIPSIPLogin: React.FC<VoIPSIPLoginProps> = ({ onLogin }) => {
  const [number, setNumber] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'host' | 'viewer'>('viewer');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (number && password) {
      onLogin(number, password, mode);
    }
  };

  return (
    <div className="min-h-screen bg-[#f6faf3] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-[#1b5e20] p-6 text-center">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
            <Phone className="w-8 h-8 text-[#1b5e20]" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Live Shopping VoIP</h1>
          <p className="text-[#e8f5e9]">Connexion SIP pour vente en direct</p>
        </div>

        {/* Features */}
        <div className="p-6">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="text-center p-3 bg-[#f6faf3] rounded-lg">
              <Play className="w-6 h-6 text-[#1b5e20] mx-auto mb-2" />
              <span className="text-sm font-medium text-gray-700">Live Streaming</span>
            </div>
            <div className="text-center p-3 bg-[#f6faf3] rounded-lg">
              <Phone className="w-6 h-6 text-[#1b5e20] mx-auto mb-2" />
              <span className="text-sm font-medium text-gray-700">Appels VoIP</span>
            </div>
            <div className="text-center p-3 bg-[#f6faf3] rounded-lg">
              <ShoppingCart className="w-6 h-6 text-[#1b5e20] mx-auto mb-2" />
              <span className="text-sm font-medium text-gray-700">Vente Directe</span>
            </div>
            <div className="text-center p-3 bg-[#f6faf3] rounded-lg">
              <Users className="w-6 h-6 text-[#1b5e20] mx-auto mb-2" />
              <span className="text-sm font-medium text-gray-700">Audience Live</span>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Numéro SIP
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                  placeholder="8888 ou 8889"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1b5e20]"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mot de passe"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1b5e20]"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mode de connexion
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setMode('host')}
                  className={`p-3 rounded-lg border-2 transition-colors ${
                    mode === 'host'
                      ? 'border-[#1b5e20] bg-[#f6faf3] text-[#1b5e20]'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-[#1b5e20]/30'
                  }`}
                >
                  <div className="text-center">
                    <div className="w-8 h-8 bg-[#1b5e20] rounded-full flex items-center justify-center mx-auto mb-2">
                      <Play className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-medium">Vendeur</span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setMode('viewer')}
                  className={`p-3 rounded-lg border-2 transition-colors ${
                    mode === 'viewer'
                      ? 'border-[#1b5e20] bg-[#f6faf3] text-[#1b5e20]'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-[#1b5e20]/30'
                  }`}
                >
                  <div className="text-center">
                    <div className="w-8 h-8 bg-[#1b5e20] rounded-full flex items-center justify-center mx-auto mb-2">
                      <Users className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-medium">Client</span>
                  </div>
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-[#1b5e20] text-white py-3 rounded-lg font-medium hover:bg-[#16381a] transition-colors flex items-center justify-center space-x-2"
            >
              <Phone className="w-5 h-5" />
              <span>Se connecter</span>
            </button>
          </form>

          {/* Quick Access */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Accès rapide aux tests:</h3>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  setNumber('8888');
                  setPassword('8888');
                  setMode('host');
                }}
                className="w-full text-left p-3 bg-[#f6faf3] rounded-lg hover:bg-[#e8f5e9] transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-[#1b5e20] rounded-full flex items-center justify-center">
                    <Play className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-800">Vendeur Test</div>
                    <div className="text-sm text-gray-600">8888 / 8888</div>
                  </div>
                </div>
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setNumber('8889');
                  setPassword('8889');
                  setMode('viewer');
                }}
                className="w-full text-left p-3 bg-[#f6faf3] rounded-lg hover:bg-[#e8f5e9] transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-[#1b5e20] rounded-full flex items-center justify-center">
                    <Users className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-800">Client Test</div>
                    <div className="text-sm text-gray-600">8889 / 8889</div>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoIPSIPLogin;