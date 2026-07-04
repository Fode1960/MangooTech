import express from 'express';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Configuration par défaut des méthodes de paiement
const DEFAULT_PAYMENT_METHODS = {
  orange_money: {
    enabled: true,
    name: 'Orange Money',
    countries: ['BJ', 'CI', 'SN', 'ML', 'BF', 'NE'],
    currencies: ['XOF', 'XAF'],
    processing_fee: 0.01,
    minimum_amount: 100,
    maximum_amount: 500000,
    config: {
      api_key: '',
      merchant_code: '',
      service_id: '',
      webhook_url: '/api/mobile-money-webhooks/orange'
    }
  },
  mtn_money: {
    enabled: true,
    name: 'MTN Mobile Money',
    countries: ['BJ', 'CI', 'SN', 'GH', 'UG', 'RW'],
    currencies: ['XOF', 'XAF', 'GHS', 'UGX', 'RWF'],
    processing_fee: 0.015,
    minimum_amount: 100,
    maximum_amount: 500000,
    config: {
      api_key: '',
      merchant_code: '',
      service_id: '',
      webhook_url: '/api/mobile-money-webhooks/mtn'
    }
  },
  moov_money: {
    enabled: true,
    name: 'Moov Money',
    countries: ['BJ', 'CI', 'SN'],
    currencies: ['XOF', 'XAF'],
    processing_fee: 0.01,
    minimum_amount: 100,
    maximum_amount: 500000,
    config: {
      api_key: '',
      merchant_code: '',
      service_id: '',
      webhook_url: '/api/mobile-money-webhooks/moov'
    }
  },
  stripe: {
    enabled: true,
    name: 'Stripe',
    countries: ['GLOBAL'],
    currencies: ['USD', 'EUR', 'GBP', 'XOF', 'XAF'],
    processing_fee: 0.029,
    minimum_amount: 50,
    maximum_amount: 1000000,
    config: {
      publishable_key: '',
      secret_key: '',
      webhook_secret: '',
      webhook_url: '/api/stripe-webhooks'
    }
  },
  paypal: {
    enabled: true,
    name: 'PayPal',
    countries: ['GLOBAL'],
    currencies: ['USD', 'EUR', 'GBP', 'XOF', 'XAF'],
    processing_fee: 0.034,
    minimum_amount: 100,
    maximum_amount: 1000000,
    config: {
      client_id: '',
      client_secret: '',
      webhook_id: '',
      webhook_url: '/api/paypal-webhooks'
    }
  },
  card: {
    enabled: true,
    name: 'Carte Bancaire',
    countries: ['GLOBAL'],
    currencies: ['USD', 'EUR', 'GBP', 'XOF', 'XAF'],
    processing_fee: 0.025,
    minimum_amount: 100,
    maximum_amount: 1000000,
    config: {
      provider: 'stripe',
      webhook_url: '/api/stripe-webhooks'
    }
  }
};

// Middleware d'authentification
const authenticateAdmin = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        error: 'Token manquant' 
      });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Token invalide' 
      });
    }

    // Vérifier si l'utilisateur est admin
    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('role_id, is_active')
      .eq('user_id', user.id)
      .single();

    if (!adminUser || !adminUser.is_active) {
      return res.status(403).json({ 
        success: false, 
        error: 'Accès refusé: Administrateur requis' 
      });
    }

    (req as any).adminUser = adminUser;
    (req as any).user = user;
    next();
  } catch (error) {
    console.error('Erreur authentification admin:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur serveur lors de l\'authentification' 
    });
  }
};

// === ROUTES POUR LA GESTION DES MÉTHODES DE PAIEMENT ===

// Obtenir la configuration actuelle des méthodes de paiement
router.get('/config',
  authenticateAdmin,
  async (req: express.Request, res: express.Response) => {
    try {
      const { data: config, error } = await supabase
        .from('payment_methods_config')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      const currentConfig = config?.config || DEFAULT_PAYMENT_METHODS;

      // Masquer les clés API sensibles
      const sanitizedConfig = {};
      Object.keys(currentConfig).forEach(method => {
        sanitizedConfig[method] = {
          ...currentConfig[method],
          config: {
            ...currentConfig[method].config,
            api_key: currentConfig[method].config.api_key ? '***' : '',
            secret_key: currentConfig[method].config.secret_key ? '***' : '',
            client_secret: currentConfig[method].config.client_secret ? '***' : ''
          }
        };
      });

      res.json({
        success: true,
        data: sanitizedConfig
      });
    } catch (error) {
      console.error('Erreur récupération config:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erreur serveur' 
      });
    }
  }
);

// Mettre à jour la configuration d'une méthode de paiement
router.put('/config/:method',
  authenticateAdmin,
  async (req: express.Request, res: express.Response) => {
    try {
      const { method } = req.params;
      const { enabled, processing_fee, minimum_amount, maximum_amount, config } = req.body;

      // Récupérer la configuration actuelle
      const { data: currentConfigData } = await supabase
        .from('payment_methods_config')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      const currentConfig = currentConfigData?.config || DEFAULT_PAYMENT_METHODS;

      // Vérifier si la méthode existe
      if (!currentConfig[method]) {
        return res.status(404).json({ 
          success: false, 
          error: 'Méthode de paiement non reconnue' 
        });
      }

      // Mettre à jour la configuration
      const updatedMethod = {
        ...currentConfig[method],
        enabled: enabled !== undefined ? enabled : currentConfig[method].enabled,
        processing_fee: processing_fee || currentConfig[method].processing_fee,
        minimum_amount: minimum_amount || currentConfig[method].minimum_amount,
        maximum_amount: maximum_amount || currentConfig[method].maximum_amount,
        config: {
          ...currentConfig[method].config,
          ...config
        }
      };

      const updatedConfig = {
        ...currentConfig,
        [method]: updatedMethod
      };

      // Sauvegarder la nouvelle configuration
      const { error } = await supabase
        .from('payment_methods_config')
        .insert({
          config: updatedConfig,
          updated_by: (req as any).user.id,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Masquer les clés sensibles dans la réponse
      const sanitizedMethod = {
        ...updatedMethod,
        config: {
          ...updatedMethod.config,
          api_key: updatedMethod.config.api_key ? '***' : '',
          secret_key: updatedMethod.config.secret_key ? '***' : '',
          client_secret: updatedMethod.config.client_secret ? '***' : ''
        }
      };

      res.json({
        success: true,
        data: sanitizedMethod,
        message: `Configuration ${method} mise à jour avec succès`
      });
    } catch (error) {
      console.error('Erreur mise à jour config:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erreur serveur' 
      });
    }
  }
);

// Tester la configuration d'une méthode de paiement
router.post('/test/:method',
  authenticateAdmin,
  async (req: express.Request, res: express.Response) => {
    try {
      const { method } = req.params;
      const { amount = 1000, currency = 'XOF' } = req.body;

      // Récupérer la configuration actuelle
      const { data: configData } = await supabase
        .from('payment_methods_config')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      const currentConfig = configData?.config || DEFAULT_PAYMENT_METHODS;

      if (!currentConfig[method]) {
        return res.status(404).json({ 
          success: false, 
          error: 'Méthode de paiement non reconnue' 
        });
      }

      const methodConfig = currentConfig[method];

      // Vérifier si la méthode est activée
      if (!methodConfig.enabled) {
        return res.status(400).json({ 
          success: false, 
          error: 'Méthode de paiement désactivée' 
        });
      }

      // Vérifier les limites de montant
      if (amount < methodConfig.minimum_amount) {
        return res.status(400).json({ 
          success: false, 
          error: `Montant minimum: ${methodConfig.minimum_amount} ${currency}` 
        });
      }

      if (amount > methodConfig.maximum_amount) {
        return res.status(400).json({ 
          success: false, 
          error: `Montant maximum: ${methodConfig.maximum_amount} ${currency}` 
        });
      }

      // Vérifier la devise
      if (!methodConfig.currencies.includes(currency)) {
        return res.status(400).json({ 
          success: false, 
          error: `Devise non supportée: ${currency}` 
        });
      };

      // Simuler un test de configuration
      const testResult = {
        method: method,
        amount: amount,
        currency: currency,
        processing_fee: methodConfig.processing_fee,
        fee_amount: (amount * methodConfig.processing_fee).toFixed(2),
        net_amount: (amount - (amount * methodConfig.processing_fee)).toFixed(2),
        config_valid: true,
        test_status: 'success',
        message: 'Configuration testée avec succès'
      };

      res.json({
        success: true,
        data: testResult
      });
    } catch (error) {
      console.error('Erreur test configuration:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erreur serveur' 
      });
    }
  }
);

// Obtenir les statuts des méthodes de paiement
router.get('/status',
  authenticateAdmin,
  async (req: express.Request, res: express.Response) => {
    try {
      // Récupérer la configuration actuelle
      const { data: configData } = await supabase
        .from('payment_methods_config')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      const currentConfig = (configData as any)?.config || DEFAULT_PAYMENT_METHODS;

      // Obtenir les statistiques d'utilisation
      const usageStats = await supabase
        .from('transactions')
        .select('payment_method, status, count')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .then(result => {
          // Transformer les données en statistiques par méthode
          const stats: Record<string, { total: number; successful: number; failed: number; success_rate: number }> = {};
          result.data?.forEach((row: any) => {
            if (!stats[row.payment_method]) {
              stats[row.payment_method] = {
                total: 0,
                successful: 0,
                failed: 0,
                success_rate: 0
              };
            }
            const count = parseInt(String(row.count || 1), 10) || 1;
            stats[row.payment_method].total += count;
            if (row.status === 'succeeded') {
              stats[row.payment_method].successful += count;
            } else if (row.status === 'failed') {
              stats[row.payment_method].failed += count;
            }
          });

          // Calculer les taux de réussite
          Object.keys(stats).forEach(method => {
            const stat = stats[method];
            stat.success_rate = stat.total > 0 ? 
              Number(((stat.successful / stat.total) * 100).toFixed(2)) : 0;
          });

          return stats;
        });

      // Combiner la configuration avec les statistiques
      const statusData: Record<string, any> = {};
      Object.keys(currentConfig).forEach(method => {
        statusData[method] = {
          ...currentConfig[method],
          stats: usageStats[method] || {
            total: 0,
            successful: 0,
            failed: 0,
            success_rate: 0
          }
        };
      });

      res.json({
        success: true,
        data: statusData
      });
    } catch (error) {
      console.error('Erreur statut méthodes:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erreur serveur' 
      });
    }
  }
);

// Activer/Désactiver une méthode de paiement
router.post('/toggle/:method',
  authenticateAdmin,
  async (req: express.Request, res: express.Response) => {
    try {
      const { method } = req.params;

      // Récupérer la configuration actuelle
      const { data: configData } = await supabase
        .from('payment_methods_config')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      const currentConfig = configData?.config || DEFAULT_PAYMENT_METHODS;

      if (!currentConfig[method]) {
        return res.status(404).json({ 
          success: false, 
          error: 'Méthode de paiement non reconnue' 
        });
      }

      // Basculer l'état
      currentConfig[method].enabled = !currentConfig[method].enabled;

      // Sauvegarder la nouvelle configuration
      const { error } = await supabase
        .from('payment_methods_config')
        .insert({
          config: currentConfig,
          updated_by: (req as any).user.id,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      res.json({
        success: true,
        data: {
          method: method,
          enabled: currentConfig[method].enabled,
          message: `Méthode ${method} ${currentConfig[method].enabled ? 'activée' : 'désactivée'} avec succès`
        }
      });
    } catch (error) {
      console.error('Erreur toggle méthode:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erreur serveur' 
      });
    }
  }
);

// Obtenir les clés API pour une méthode spécifique (endpoint sécurisé)
router.get('/keys/:method',
  authenticateAdmin,
  async (req: express.Request, res: express.Response) => {
    try {
      const { method } = req.params;

      // Récupérer la configuration actuelle
      const { data: configData } = await supabase
        .from('payment_methods_config')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      const currentConfig = configData?.config || DEFAULT_PAYMENT_METHODS;

      if (!currentConfig[method]) {
        return res.status(404).json({ 
          success: false, 
          error: 'Méthode de paiement non reconnue' 
        });
      }

      // Retourner les clés API (endpoint sécurisé pour admin)
      res.json({
        success: true,
        data: {
          method: method,
          keys: currentConfig[method].config
        }
      });
    } catch (error) {
      console.error('Erreur récupération clés:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erreur serveur' 
      });
    }
  }
);

export default router;
