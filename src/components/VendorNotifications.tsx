import { useState, useEffect } from 'react';
import { useTheme } from '../hooks/useTheme';
import { 
  Bell, 
  X, 
  CheckCircle, 
  AlertCircle, 
  Info, 
  Package, 
  ShoppingCart, 
  TrendingDown,
  Clock,
  Trash2
} from 'lucide-react';

interface Notification {
  id: string;
  type: 'order' | 'stock' | 'system' | 'payment';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  priority: 'low' | 'medium' | 'high';
  actionUrl?: string;
}

interface VendorNotificationsProps {
  vendorId: string;
}

export default function VendorNotifications({ vendorId }: VendorNotificationsProps) {
  const { isDark } = useTheme();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showPanel, setShowPanel] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Générer des notifications de démonstration
  const generateDemoNotifications = (): Notification[] => {
    const now = new Date();
    const demoNotifications: Notification[] = [
      {
        id: '1',
        type: 'order',
        title: 'Nouvelle commande',
        message: 'Nouvelle commande de 5x Cocomm DT740 pour un total de 750.000 FCFA',
        timestamp: new Date(now.getTime() - 5 * 60 * 1000), // 5 minutes ago
        read: false,
        priority: 'high',
        actionUrl: '/vendor/orders/123'
      },
      {
        id: '2',
        type: 'stock',
        title: 'Stock faible',
        message: 'Stock faible pour "Pagne Traditionnel" (3 restants)',
        timestamp: new Date(now.getTime() - 15 * 60 * 1000), // 15 minutes ago
        read: false,
        priority: 'medium',
        actionUrl: '/vendor/stock'
      },
      {
        id: '3',
        type: 'payment',
        title: 'Paiement reçu',
        message: 'Paiement de 485.000 FCFA reçu pour la commande #CMD-2024-001',
        timestamp: new Date(now.getTime() - 30 * 60 * 1000), // 30 minutes ago
        read: true,
        priority: 'low'
      },
      {
        id: '4',
        type: 'system',
        title: 'Mise à jour système',
        message: 'Nouvelles fonctionnalités disponibles dans votre tableau de bord',
        timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
        read: true,
        priority: 'low'
      },
      {
        id: '5',
        type: 'order',
        title: 'Commande expédiée',
        message: 'La commande #CMD-2024-002 a été expédiée avec succès',
        timestamp: new Date(now.getTime() - 1 * 60 * 60 * 1000), // 1 hour ago
        read: false,
        priority: 'medium'
      }
    ];
    return demoNotifications;
  };

  // Charger les notifications
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      const demoNotifications = generateDemoNotifications();
      setNotifications(demoNotifications);
      const unread = demoNotifications.filter(n => !n.read).length;
      setUnreadCount(unread);
      setLoading(false);
    }, 1000);
  }, [vendorId]);

  // Simulation de nouvelles notifications en temps réel
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.8) { // 20% de chance d'une nouvelle notification
        const newNotification: Notification = {
          id: Date.now().toString(),
          type: Math.random() > 0.5 ? 'order' : 'stock',
          title: Math.random() > 0.5 ? 'Nouvelle commande' : 'Alerte stock',
          message: Math.random() > 0.5 
            ? `Nouvelle commande de ${Math.floor(Math.random() * 10) + 1}x Produit pour ${(Math.floor(Math.random() * 500000) + 100000).toLocaleString()} FCFA`
            : `Stock faible pour "${['Cocomm DT740', 'Pagne Traditionnel', 'Mafé Maison', 'Bijou Artisanal'][Math.floor(Math.random() * 4)]}" (${Math.floor(Math.random() * 5) + 1} restants)`,
          timestamp: new Date(),
          read: false,
          priority: Math.random() > 0.7 ? 'high' : 'medium'
        };
        
        setNotifications(prev => [newNotification, ...prev]);
        setUnreadCount(prev => prev + 1);
      }
    }, 30000); // Nouvelle notification toutes les 30 secondes

    return () => clearInterval(interval);
  }, []);

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    );
    setUnreadCount(0);
  };

  const deleteNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
    const notification = notifications.find(n => n.id === notificationId);
    if (notification && !notification.read) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const clearAll = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order':
        return <ShoppingCart className="h-5 w-5 text-blue-500" />;
      case 'stock':
        return <TrendingDown className="h-5 w-5 text-orange-500" />;
      case 'payment':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'system':
        return <Info className="h-5 w-5 text-gray-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500';
      case 'medium':
        return 'border-l-orange-500';
      case 'low':
        return 'border-l-green-500';
      default:
        return 'border-l-gray-500';
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'À l\'instant';
    if (minutes < 60) return `Il y a ${minutes} min`;
    if (hours < 24) return `Il y a ${hours}h`;
    return `Il y a ${days}j`;
  };

  return (
    <div className="relative">
      {/* Bouton de notification */}
      <button
        onClick={() => setShowPanel(!showPanel)}
        className={`relative p-2 rounded-lg transition-colors ${
          isDark 
            ? 'text-gray-300 hover:text-white hover:bg-gray-700' 
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
        }`}
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Panneau de notifications */}
      {showPanel && (
        <div className={`absolute right-0 mt-2 w-96 rounded-xl shadow-2xl border z-50 ${
          isDark 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Notifications
            </h3>
            <div className="flex items-center space-x-2">
              {notifications.length > 0 && (
                <>
                  <button
                    onClick={markAllAsRead}
                    className={`text-sm px-2 py-1 rounded transition-colors ${
                      isDark 
                        ? 'text-gray-400 hover:text-white hover:bg-gray-700' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    Tout lire
                  </button>
                  <button
                    onClick={clearAll}
                    className={`text-sm px-2 py-1 rounded transition-colors ${
                      isDark 
                        ? 'text-gray-400 hover:text-white hover:bg-gray-700' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    Tout effacer
                  </button>
                </>
              )}
              <button
                onClick={() => setShowPanel(false)}
                className={`p-1 rounded transition-colors ${
                  isDark 
                    ? 'text-gray-400 hover:text-white hover:bg-gray-700' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Contenu */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Chargement des notifications...
                </p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className={`h-12 w-12 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Aucune notification
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border-l-4 ${getPriorityColor(notification.priority)} ${
                      !notification.read 
                        ? isDark 
                          ? 'bg-blue-900/10' 
                          : 'bg-blue-50'
                        : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className={`text-sm font-medium ${
                            isDark 
                              ? notification.read ? 'text-gray-400' : 'text-white'
                              : notification.read ? 'text-gray-600' : 'text-gray-900'
                          }`}>
                            {notification.title}
                          </p>
                          <div className="flex items-center space-x-1">
                            <span className={`text-xs ${
                              isDark ? 'text-gray-500' : 'text-gray-500'
                            }`}>
                              {formatTime(notification.timestamp)}
                            </span>
                            <button
                              onClick={() => deleteNotification(notification.id)}
                              className={`p-1 rounded transition-colors ${
                                isDark 
                                  ? 'text-gray-500 hover:text-gray-300 hover:bg-gray-700' 
                                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                              }`}
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                        <p className={`text-sm mt-1 ${
                          isDark 
                            ? notification.read ? 'text-gray-500' : 'text-gray-300'
                            : notification.read ? 'text-gray-600' : 'text-gray-700'
                        }`}>
                          {notification.message}
                        </p>
                        {!notification.read && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="text-xs text-orange-600 hover:text-orange-700 mt-2"
                          >
                            Marquer comme lu
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <button className="w-full text-center text-sm text-orange-600 hover:text-orange-700 font-medium">
                Voir toutes les notifications
              </button>
            </div>
          )}
        </div>
      )}

      {/* Overlay pour fermer le panneau */}
      {showPanel && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowPanel(false)}
        />
      )}
    </div>
  );
}