import React from 'react';
import { Video, Phone, MessageCircle, Users, Settings, Play } from 'lucide-react';

const VideoAudioCalls: React.FC = () => {
  const features = [
    {
      icon: Video,
      title: 'Appels Vidéo HD',
      description: 'Communiquez en haute définition avec vos clients',
      action: 'Démarrer un appel vidéo',
      path: '/vendor-webrtc?mode=video-call'
    },
    {
      icon: Phone,
      title: 'Appels Audio',
      description: 'Des conversations claires sans vidéo',
      action: 'Démarrer un appel audio',
      path: '/vendor-webrtc?mode=audio-call'
    },
    {
      icon: MessageCircle,
      title: 'Chat en Temps Réel',
      description: 'Discutez pendant les appels',
      action: 'Ouvrir le chat',
      path: '/chat'
    },
    {
      icon: Users,
      title: 'Appels de Groupe',
      description: 'Jusqu\'à 10 participants',
      action: 'Créer un groupe',
      path: '/vendor-webrtc?mode=group-call'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-orange-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Video className="w-8 h-8 text-orange-500 mr-3" />
                Appels Audio & Vidéo
              </h1>
              <p className="text-gray-600 mt-2">Communiquez en direct avec vos clients via WebRTC</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-500">12</div>
                <div className="text-sm text-gray-500">Appels aujourd\'hui</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-500">4</div>
                <div className="text-sm text-gray-500">En cours</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl flex items-center justify-center">
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-right">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                <p className="text-gray-600 mb-6">{feature.description}</p>
                <a
                  href={feature.path}
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-amber-600 transition-all duration-200 transform hover:scale-105"
                >
                  <Play className="w-5 h-5 mr-2" />
                  {feature.action}
                </a>
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <Settings className="w-6 h-6 text-orange-500 mr-3" />
            Actions Rapides
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <a
              href="/webrtc-test-hub"
              className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 hover:shadow-lg transition-all duration-300 transform hover:scale-105"
            >
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mb-4">
                <Settings className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Test Hub</h3>
              <p className="text-gray-600 text-sm">Testez toutes les fonctionnalités WebRTC</p>
            </a>
            
            <a
              href="/live-shopping-demo"
              className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 hover:shadow-lg transition-all duration-300 transform hover:scale-105"
            >
              <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center mb-4">
                <Play className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Live Shopping</h3>
              <p className="text-gray-600 text-sm">Démonstration de vente en direct</p>
            </a>
            
            <a
              href="/voip-integration"
              className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 hover:shadow-lg transition-all duration-300 transform hover:scale-105"
            >
              <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mb-4">
                <Phone className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Intégration VoIP</h3>
              <p className="text-gray-600 text-sm">Connectez votre système FreePBX/Asterisk</p>
            </a>
          </div>
        </div>
      </div>

      {/* Features Info */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl p-8 text-white text-center">
          <h2 className="text-3xl font-bold mb-4">Technologie WebRTC de Pointe</h2>
          <p className="text-xl mb-8">
            MangooTech utilise la technologie WebRTC pour des communications en temps réel de haute qualité,
            directement dans votre navigateur, sans installation nécessaire.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">HD</div>
              <div className="text-lg">Qualité vidéo haute définition</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">0ms</div>
              <div className="text-lg">Latence ultra-faible</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">100%</div>
              <div className="text-lg">Sécurisé et privé</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoAudioCalls;