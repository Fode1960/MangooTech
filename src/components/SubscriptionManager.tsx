import React, { useCallback, useEffect, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { useAuth } from '../contexts/AuthContext';
import { useThemeStore } from '../stores/themeStore';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

interface Pack {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  duration_days: number;
  features: string[];
  is_popular?: boolean;
}

interface SubscriptionManagerProps {
  packs?: Pack[];
  onSubscriptionSuccess?: (sessionId: string) => void;
  onSubscriptionCancel?: () => void;
}

const SubscriptionManager: React.FC<SubscriptionManagerProps> = ({
  packs = [],
  onSubscriptionSuccess,
  onSubscriptionCancel,
}) => {
  const { user } = useAuth();
  const { isDark } = useThemeStore();
  const [loading, setLoading] = useState(false);
  const [userSubscriptions, setUserSubscriptions] = useState<any[]>([]);
  const [loadingSubscriptions, setLoadingSubscriptions] = useState(true);

  // Packs par défaut si aucun n'est fourni
  const defaultPacks: Pack[] = [
    {
      id: 'pack_basic',
      name: 'Pack Basic',
      description: 'Pour les petites boutiques',
      price: 10000, // 10 000 XOF
      currency: 'xof',
      duration_days: 30,
      features: ['Jusqu\'à 10 produits', 'Support email', 'Statistiques basiques'],
    },
    {
      id: 'pack_pro',
      name: 'Pack Pro',
      description: 'Pour les boutiques en croissance',
      price: 25000, // 25 000 XOF
      currency: 'xof',
      duration_days: 30,
      features: ['Produits illimités', 'Support prioritaire', 'Statistiques avancées', 'Marketing tools'],
      is_popular: true,
    },
    {
      id: 'pack_enterprise',
      name: 'Pack Enterprise',
      description: 'Pour les grandes entreprises',
      price: 50000, // 50 000 XOF
      currency: 'xof',
      duration_days: 30,
      features: ['Tout du Pack Pro', 'API access', 'Compte dédié', 'Formation incluse'],
    },
  ];

  const displayPacks = packs.length > 0 ? packs : defaultPacks;

  // Charger les abonnements de l'utilisateur
  const loadUserSubscriptions = useCallback(async () => {
    if (!user) return;
    try {
      setLoadingSubscriptions(true);
      const response = await fetch(`/api/stripe-subscriptions/user-subscriptions/${user.id}`);
      
      if (!response.ok) {
        throw new Error('Failed to load subscriptions');
      }

      const data = await response.json();
      setUserSubscriptions(data.subscriptions || []);
    } catch (error) {
      console.error('Error loading subscriptions:', error);
    } finally {
      setLoadingSubscriptions(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      void loadUserSubscriptions();
    }
  }, [loadUserSubscriptions, user]);

  const handleSubscribe = async (pack: Pack) => {
    if (!user) {
      alert('Veuillez vous connecter pour souscrire à un pack');
      return;
    }

    try {
      setLoading(true);

      const response = await fetch('/api/stripe-subscriptions/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          packId: pack.id,
          packName: pack.name,
          packPrice: pack.price,
          currency: pack.currency,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create checkout session');
      }

      const { sessionId, sessionUrl } = await response.json();

      if (sessionUrl) {
        // Rediriger vers Stripe Checkout
        window.location.href = sessionUrl;
      } else {
        throw new Error('No session URL received');
      }
    } catch (error: any) {
      console.error('Error creating subscription:', error);
      alert(`Erreur: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async (subscriptionId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir annuler cet abonnement ?')) {
      return;
    }

    try {
      setLoading(true);

      const response = await fetch('/api/stripe-subscriptions/cancel-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to cancel subscription');
      }

      const data = await response.json();
      alert('Abonnement annulé avec succès. Il restera actif jusqu\'à la fin de la période.');
      
      // Recharger les abonnements
      await loadUserSubscriptions();
      
      if (onSubscriptionCancel) {
        onSubscriptionCancel();
      }
    } catch (error: any) {
      console.error('Error cancelling subscription:', error);
      alert(`Erreur: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const isPackActive = (packId: string): boolean => {
    return userSubscriptions.some(sub => 
      sub.pack_id === packId && 
      ['active', 'completed'].includes(sub.status)
    );
  };

  const getActiveSubscription = (packId: string): any => {
    return userSubscriptions.find(sub => 
      sub.pack_id === packId && 
      ['active', 'completed'].includes(sub.status)
    );
  };

  const formatPrice = (price: number, currency: string): string => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(price);
  };

  if (loadingSubscriptions) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            Chargement de vos abonnements...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen py-12 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* En-tête */}
        <div className="text-center mb-12">
          <h1 className={`text-4xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Choisissez votre Pack
          </h1>
          <p className={`text-xl ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            Trouvez le pack parfait pour votre boutique en ligne
          </p>
        </div>

        {/* Grille des packs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {displayPacks.map((pack) => {
            const isActive = isPackActive(pack.id);
            const activeSubscription = getActiveSubscription(pack.id);
            
            return (
              <div
                key={pack.id}
                className={`relative rounded-2xl shadow-lg overflow-hidden transition-transform hover:scale-105 ${
                  isDark 
                    ? 'bg-gray-800 border border-gray-700' 
                    : 'bg-white border border-gray-200'
                } ${
                  pack.is_popular 
                    ? 'ring-2 ring-orange-500 shadow-xl' 
                    : ''
                }`}
              >
                {/* Badge populaire */}
                {pack.is_popular && (
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-orange-500 to-green-500 text-white px-3 py-1 text-sm font-semibold rounded-bl-lg">
                    Populaire
                  </div>
                )}

                <div className="p-8">
                  {/* En-tête du pack */}
                  <div className="text-center mb-8">
                    <h3 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {pack.name}
                    </h3>
                    <p className={`mb-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      {pack.description}
                    </p>
                    <div className="flex items-baseline justify-center">
                      <span className={`text-5xl font-extrabold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {formatPrice(pack.price, pack.currency)}
                      </span>
                      <span className={`ml-1 text-lg ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
                        /mois
                      </span>
                    </div>
                  </div>

                  {/* Fonctionnalités */}
                  <ul className="mb-8 space-y-4">
                    {pack.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <div className="flex-shrink-0">
                          <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span className={`ml-3 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* Bouton d'action */}
                  {isActive ? (
                    <div className="space-y-3">
                      <div className={`text-center p-3 rounded-lg ${
                        isDark ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-800'
                      }`}>
                        <p className="font-semibold">✅ Pack Actif</p>
                        {activeSubscription?.current_period_end && (
                          <p className="text-sm">
                            Renouvellement: {new Date(activeSubscription.current_period_end * 1000).toLocaleDateString('fr-FR')}
                          </p>
                        )}
                      </div>
                      {activeSubscription?.stripe_subscription_id && (
                        <button
                          onClick={() => handleCancelSubscription(activeSubscription.stripe_subscription_id)}
                          disabled={loading}
                          className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors ${
                            isDark
                              ? 'bg-red-600 hover:bg-red-700 text-white'
                              : 'bg-red-500 hover:bg-red-600 text-white'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          {loading ? 'Annulation...' : 'Annuler l\'abonnement'}
                        </button>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => handleSubscribe(pack)}
                      disabled={loading}
                      className={`w-full py-3 px-6 rounded-lg font-semibold transition-all transform ${
                        pack.is_popular
                          ? 'bg-gradient-to-r from-orange-500 to-green-500 hover:from-orange-600 hover:to-green-600 text-white shadow-lg hover:shadow-xl'
                          : isDark
                          ? 'bg-gray-700 hover:bg-gray-600 text-white'
                          : 'bg-gray-900 hover:bg-gray-800 text-white'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {loading ? 'Chargement...' : 'Choisir ce Pack'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Section des abonnements actifs */}
        {userSubscriptions.length > 0 && (
          <div className={`rounded-2xl shadow-lg p-8 ${
            isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
          }`}>
            <h2 className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Vos Abonnements Actifs
            </h2>
            <div className="space-y-4">
              {userSubscriptions.map((subscription) => (
                <div
                  key={subscription.id}
                  className={`p-4 rounded-lg border ${
                    isDark 
                      ? 'bg-gray-700 border-gray-600' 
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {subscription.packs?.name || 'Pack Inconnu'}
                      </h3>
                      <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        Statut: <span className={`font-medium ${
                          subscription.status === 'active' ? 'text-green-600' :
                          subscription.status === 'past_due' ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>{subscription.status}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        Prochain paiement:
                      </p>
                      <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {subscription.current_period_end 
                          ? new Date(subscription.current_period_end * 1000).toLocaleDateString('fr-FR')
                          : 'N/A'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionManager;
