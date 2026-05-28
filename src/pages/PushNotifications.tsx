import React, { useState, useEffect } from 'react';
import { Bell, Zap, ShoppingBag, MessageCircle, Star } from 'lucide-react';
import { Toaster, toast } from 'sonner';

const PushNotifications: React.FC = () => {
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: 'Nouvelle commande',
      message: 'Vous avez reçu une nouvelle commande pour "Robe Wax Ankara Premium"',
      type: 'order',
      timestamp: new Date(Date.now() - 1000 * 60 * 5),
      read: false
    },
    {
      id: 2,
      title: 'Nouvel avis',
      message: 'Aminata D. a laissé un avis 5 étoiles sur votre produit',
      type: 'review',
      timestamp: new Date(Date.now() - 1000 * 60 * 15),
      read: false
    },
    {
      id: 3,
      title: 'Stock faible',
      message: 'Le stock de "Collier Perles Traditionnelles" est faible (3 unités restantes)',
      type: 'inventory',
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
      read: true
    }
  ]);

  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
      setIsEnabled(Notification.permission === 'granted');
    }
  }, []);

  const requestPermission = async () => {
    if ('Notification' in window) {
      const result = await Notification.requestPermission();
      setPermission(result);
      setIsEnabled(result === 'granted');
      
      if (result === 'granted') {
        toast.success('Notifications activées avec succès!');
      } else if (result === 'denied') {
        toast.error('Les notifications ont été bloquées. Veuillez les autoriser dans les paramètres de votre navigateur.');
      } else {
        toast.info('Vous pouvez activer les notifications plus tard.');
      }
    }
  };

  const sendTestNotification = () => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Test MangooTech', {
        body: 'Ceci est une notification de test depuis MangooTech!',
        icon: '/favicon.ico',
        badge: '/favicon.ico'
      });
      toast.success('Notification de test envoyée!');
    } else {
      toast.error('Les notifications ne sont pas autorisées. Veuillez activer les notifications.');
    }
  };

  const markAsRead = (id: number) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'order':
        return <ShoppingBag className="w-5 h-5 text-blue-500" />;
      case 'review':
        return <Star className="w-5 h-5 text-yellow-500" />;
      case 'inventory':
        return <Zap className="w-5 h-5 text-orange-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'À l\'instant';
    if (minutes < 60) return `Il y a ${minutes} min`;
    if (hours < 24) return `Il y a ${hours}h`;
    return `Il y a ${days} jours`;
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
      <Toaster position="top-right" />
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-orange-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Bell className="w-8 h-8 text-orange-500 mr-3" />
                Notifications Push
              </h1>
              <p className="text-gray-600 mt-2">Gérez vos notifications et restez informé</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium">
                {unreadCount} non lues
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Permission Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Paramètres des notifications</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 mb-2">
                Statut: <span className={`font-medium ${
                  permission === 'granted' ? 'text-green-600' :
                  permission === 'denied' ? 'text-red-600' : 'text-yellow-600'
                }`}>
                  {permission === 'granted' ? 'Activées' :
                   permission === 'denied' ? 'Bloquées' : 'Non définies'}
                </span>
              </p>
              <p className="text-sm text-gray-500">
                {permission === 'granted' ? 'Vous recevrez les notifications.' :
                 permission === 'denied' ? 'Les notifications sont bloquées par votre navigateur.' :
                 'Cliquez sur le bouton pour activer les notifications.'}
              </p>
            </div>
            <div className="flex space-x-3">
              {permission !== 'granted' && (
                <button
                  onClick={requestPermission}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Activer les notifications
                </button>
              )}
              {permission === 'granted' && (
                <button
                  onClick={sendTestNotification}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Tester les notifications
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Notifications récentes</h2>
          <div className="flex space-x-3">
            <button
              onClick={markAllAsRead}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Tout marquer comme lu</span>
            </button>
            <button
              onClick={clearAll}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
            >
              <Zap className="w-4 h-4" />
              <span>Tout effacer</span>
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow ${
                !notification.read ? 'border-l-4 border-orange-500' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-gray-100 rounded-full">
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 mb-1">{notification.title}</h3>
                    <p className="text-gray-600 mb-3">{notification.message}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>{formatTime(notification.timestamp)}</span>
                      {!notification.read && (
                        <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-medium">
                          Nouveau
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  {!notification.read && (
                    <button
                      onClick={() => markAsRead(notification.id)}
                      className="text-blue-500 hover:text-blue-600 text-sm font-medium"
                    >
                      Marquer comme lu
                    </button>
                  )}
                  <button className="text-gray-400 hover:text-gray-600">
                    <Zap className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {notifications.length === 0 && (
          <div className="text-center py-12">
            <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucune notification</h3>
            <p className="text-gray-600">Vos notifications apparaîtront ici.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PushNotifications;