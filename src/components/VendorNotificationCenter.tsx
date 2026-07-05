import React, { useState, useEffect, useCallback } from 'react';
import { Bell, X, Package, MessageCircle, TrendingUp, Clock, AlertCircle, CheckCircle, Volume2, VolumeX } from 'lucide-react';

export interface Notification {
  id: string;
  type: 'order' | 'review' | 'alert' | 'success' | 'info' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  priority?: 'low' | 'medium' | 'high';
  actionUrl?: string;
  sound?: boolean;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  actions?: Array<{
    label: string;
    onClick: () => void;
  }>;
}

interface VendorNotificationCenterProps {
  vendorId: string;
  onNotificationClick?: (notification: Notification) => void;
}

const VendorNotificationCenter: React.FC<VendorNotificationCenterProps> = ({ 
  vendorId, 
  onNotificationClick 
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hasPermission, setHasPermission] = useState(false);

  // Sons de notification
  const notificationSounds = {
    order: '🔔',
    review: '⭐',
    alert: '⚠️',
    success: '✅',
    info: 'ℹ️',
    warning: '⚠️',
    error: '❌'
  };

  // Demander la permission pour les notifications push
  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setHasPermission(permission === 'granted');
    }
  };

  // Jouer un son de notification
  const playNotificationSound = useCallback((type: Notification['type']) => {
    if (!soundEnabled) return;
    
    // Créer un son simple avec Web Audio API
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Fréquences différentes selon le type
      const frequencies = {
        order: 800,
        review: 600,
        alert: 400,
        success: 1000,
        info: 700,
        warning: 450,
        error: 300
      };
      
      oscillator.frequency.setValueAtTime(frequencies[type], audioContext.currentTime);
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.log('Audio non supporté');
    }
  }, [soundEnabled]);

  // Afficher une notification push
  const showPushNotification = useCallback((notification: Notification) => {
    if (!hasPermission || !('Notification' in window)) return;
    
    new Notification(notification.title, {
      body: notification.message,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: notification.id,
      requireInteraction: notification.priority === 'high',
      silent: !soundEnabled
    });
  }, [hasPermission, soundEnabled]);

  // Ajouter une notification
  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      read: false
    };

    setNotifications(prev => [newNotification, ...prev]);
    setUnreadCount(prev => prev + 1);
    
    // Jouer le son et afficher la notification push
    playNotificationSound(newNotification.type);
    showPushNotification(newNotification);
    
    // Animation du bouton de notification
    const bellElement = document.querySelector('.notification-bell');
    if (bellElement) {
      bellElement.classList.add('animate-bounce');
      setTimeout(() => {
        bellElement.classList.remove('animate-bounce');
      }, 1000);
    }
  }, [playNotificationSound, showPushNotification]);

  // Marquer comme lu
  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  // Marquer tous comme lus
  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
    setUnreadCount(0);
  };

  // Supprimer une notification
  const removeNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
    const notification = notifications.find(n => n.id === notificationId);
    if (notification && !notification.read) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  // Obtenir l'icône selon le type
  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'order': return <Package className="w-5 h-5 text-blue-500" />;
      case 'review': return <MessageCircle className="w-5 h-5 text-yellow-500" />;
      case 'alert': return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />;
      default: return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  // Obtenir la couleur selon la priorité
  const getPriorityColor = (priority: Notification['priority']) => {
    switch (priority) {
      case 'high': return 'border-red-400 bg-red-50';
      case 'medium': return 'border-yellow-400 bg-yellow-50';
      case 'low': return 'border-green-400 bg-green-50';
      default: return 'border-gray-400 bg-gray-50';
    }
  };

  // Formater le temps écoulé
  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return `À l'instant`;
    if (diffInSeconds < 3600) return `Il y a ${Math.floor(diffInSeconds / 60)} min`;
    if (diffInSeconds < 86400) return `Il y a ${Math.floor(diffInSeconds / 3600)} h`;
    return `Il y a ${Math.floor(diffInSeconds / 86400)} j`;
  };

  // Simulation de notifications en temps réel (mode démo)
  useEffect(() => {
    requestNotificationPermission();

    const demoNotifications = [
      {
        type: 'order' as const,
        title: 'Nouvelle commande',
        message: 'Commande #CMD-1234 reçue - 45.000 CFA',
        priority: 'high' as const,
        sound: true
      },
      {
        type: 'review' as const,
        title: 'Nouvel avis',
        message: 'Marie a laissé un avis 5⭐ sur votre robe wax',
        priority: 'medium' as const,
        sound: true
      },
      {
        type: 'success' as const,
        title: 'Commande expédiée',
        message: 'La commande #CMD-1230 a été marquée comme expédiée',
        priority: 'low' as const,
        sound: false
      },
      {
        type: 'alert' as const,
        title: 'Stock faible',
        message: 'Attention : Plus que 2 robes wax en stock',
        priority: 'high' as const,
        sound: true
      }
    ];

    // Envoyer des notifications de démonstration
    const interval = setInterval(() => {
      if (Math.random() > 0.7) { // 30% de chance
        const randomNotif = demoNotifications[Math.floor(Math.random() * demoNotifications.length)];
        addNotification(randomNotif);
      }
    }, 15000); // Toutes les 15 secondes

    // Notification initiale
    setTimeout(() => {
      addNotification({
        type: 'success',
        title: 'Système de notifications activé',
        message: 'Vous recevrez des notifications en temps réel',
        priority: 'medium',
        sound: true
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [addNotification]);

  return (
    <div className="relative">
      {/* Bouton de notification */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="notification-bell relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Bell className="w-6 h-6" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* Centre de notifications */}
        {isOpen && (
          <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-xl border border-gray-200 z-50">
            {/* En-tête */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className={`p-1 rounded ${soundEnabled ? 'text-blue-600 hover:text-blue-700' : 'text-gray-400 hover:text-gray-600'}`}
                  title={soundEnabled ? 'Son activé' : 'Son désactivé'}
                >
                  {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-700"
                  disabled={unreadCount === 0}
                >
                  Tout marquer comme lu
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Liste des notifications */}
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>Aucune notification</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 border-l-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                        notification.read ? 'bg-white' : 'bg-blue-50'
                      } ${getPriorityColor(notification.priority)}`}
                      onClick={() => {
                        markAsRead(notification.id);
                        onNotificationClick?.(notification);
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className={`text-sm font-medium ${
                              notification.read ? 'text-gray-700' : 'text-gray-900'
                            }`}>
                              {notification.title}
                            </p>
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-gray-500">
                                {formatTimeAgo(notification.timestamp)}
                              </span>
                              {!notification.read && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              )}
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {notification.message}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeNotification(notification.id);
                          }}
                          className="flex-shrink-0 text-gray-400 hover:text-red-500 p-1"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pied de page */}
            {notifications.length > 0 && (
              <div className="p-3 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={() => setNotifications([])}
                  className="w-full text-sm text-red-600 hover:text-red-700"
                >
                  Effacer toutes les notifications
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Overlay pour fermer */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default VendorNotificationCenter;
