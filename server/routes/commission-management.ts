import express from 'express';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Configuration des commissions par défaut
const DEFAULT_COMMISSION_RATES = {
  platform: 0.025, // 2.5% pour la plateforme
  payment_processing: {
    orange_money: 0.01,  // 1%
    mtn_money: 0.015,   // 1.5%
    moov_money: 0.01,   // 1%
    stripe: 0.029,      // 2.9%
    paypal: 0.034,      // 3.4%
    card: 0.025         // 2.5%
  },
  minimum_commission: 100, // 100 XOF minimum
  currency: 'XOF'
};

// Middleware d'authentification admin
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

// Fonction pour calculer les commissions
const calculateCommissions = (amount: number, paymentMethod: string, customRates?: any) => {
  const rates = customRates || DEFAULT_COMMISSION_RATES;
  
  // Commission de la plateforme
  const platformCommission = Math.max(
    amount * rates.platform,
    rates.minimum_commission
  );

  // Frais de traitement du paiement
  const paymentProcessingFee = amount * (rates.payment_processing[paymentMethod as keyof typeof rates.payment_processing] || 0.02);

  // Commission totale
  const totalCommission = platformCommission + paymentProcessingFee;

  // Revenu net pour la boutique
  const shopEarning = amount - totalCommission;

  return {
    original_amount: amount,
    platform_commission: platformCommission,
    payment_processing_fee: paymentProcessingFee,
    total_commission: totalCommission,
    shop_earning: shopEarning,
    commission_rate: (totalCommission / amount * 100).toFixed(2),
    currency: rates.currency
  };
};

// Fonction pour distribuer les commissions
const distributeCommissions = async (transactionId: string, commissionData: any) => {
  try {
    // Créer l'entrée de commission
    const { data: commission, error: commissionError } = await supabase
      .from('commissions')
      .insert({
        transaction_id: transactionId,
        platform_commission: commissionData.platform_commission,
        payment_processing_fee: commissionData.payment_processing_fee,
        total_commission: commissionData.total_commission,
        shop_earning: commissionData.shop_earning,
        commission_rate: commissionData.commission_rate,
        currency: commissionData.currency,
        status: 'pending',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (commissionError) {
      throw commissionError;
    }

    // Mettre à jour la transaction avec les données de commission
    const { error: updateError } = await supabase
      .from('transactions')
      .update({
        commission_amount: commissionData.total_commission,
        platform_fee: commissionData.payment_processing_fee,
        shop_earning: commissionData.shop_earning,
        updated_at: new Date().toISOString()
      })
      .eq('id', transactionId);

    if (updateError) {
      throw updateError;
    }

    return {
      success: true,
      data: commission
    };
  } catch (error) {
    console.error('Erreur distribution commissions:', error);
    return {
      success: false,
      error: 'Erreur distribution commissions'
    };
  }
};

// === ROUTES POUR LA GESTION DES COMMISSIONS ===

// Obtenir la configuration actuelle des commissions
router.get('/config',
  authenticateAdmin,
  async (req: express.Request, res: express.Response) => {
    try {
      const { data: config, error } = await supabase
        .from('commission_config')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      const currentConfig = config || DEFAULT_COMMISSION_RATES;

      res.json({
        success: true,
        data: currentConfig
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

// Mettre à jour la configuration des commissions
router.put('/config',
  authenticateAdmin,
  async (req: express.Request, res: express.Response) => {
    try {
      const { platform_rate, payment_processing_rates, minimum_commission, currency } = req.body;

      const newConfig = {
        platform_rate: platform_rate || DEFAULT_COMMISSION_RATES.platform,
        payment_processing_rates: payment_processing_rates || DEFAULT_COMMISSION_RATES.payment_processing,
        minimum_commission: minimum_commission || DEFAULT_COMMISSION_RATES.minimum_commission,
        currency: currency || DEFAULT_COMMISSION_RATES.currency,
        updated_by: (req as any).user.id,
        created_at: new Date().toISOString()
      };

      const { data: config, error } = await supabase
        .from('commission_config')
        .insert(newConfig)
        .select()
        .single();

      if (error) {
        throw error;
      }

      res.json({
        success: true,
        data: config,
        message: 'Configuration des commissions mise à jour avec succès'
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

// Calculer les commissions pour un montant donné
router.post('/calculate',
  authenticateAdmin,
  async (req: express.Request, res: express.Response) => {
    try {
      const { amount, payment_method } = req.body;

      if (!amount || !payment_method) {
        return res.status(400).json({ 
          success: false, 
          error: 'Montant et méthode de paiement requis' 
        });
      }

      // Récupérer la configuration actuelle
      const { data: config } = await supabase
        .from('commission_config')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      const rates = config || DEFAULT_COMMISSION_RATES;
      const commissionData = calculateCommissions(amount, payment_method, rates);

      res.json({
        success: true,
        data: commissionData
      });
    } catch (error) {
      console.error('Erreur calcul commissions:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erreur serveur' 
      });
    }
  }
);

// Traiter automatiquement les commissions pour une transaction
router.post('/process/:transactionId',
  authenticateAdmin,
  async (req: express.Request, res: express.Response) => {
    try {
      const { transactionId } = req.params;

      // Récupérer la transaction
      const { data: transaction, error: transactionError } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', transactionId)
        .single();

      if (transactionError || !transaction) {
        return res.status(404).json({ 
          success: false, 
          error: 'Transaction non trouvée' 
        });
      }

      // Vérifier si les commissions ont déjà été calculées
      if (transaction.commission_amount && transaction.commission_amount > 0) {
        return res.status(400).json({ 
          success: false, 
          error: 'Commissions déjà calculées pour cette transaction' 
        });
      }

      // Récupérer la configuration actuelle
      const { data: config } = await supabase
        .from('commission_config')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      const rates = config || DEFAULT_COMMISSION_RATES;
      const commissionData = calculateCommissions(
        parseFloat(transaction.amount),
        transaction.payment_method,
        rates
      );

      // Distribuer les commissions
      const result = await distributeCommissions(transactionId, commissionData);

      if (result.success) {
        res.json({
          success: true,
          data: result.data,
          message: 'Commissions calculées et distribuées avec succès'
        });
      } else {
        res.status(400).json({ 
          success: false, 
          error: result.error 
        });
      }
    } catch (error) {
      console.error('Erreur traitement commissions:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erreur serveur' 
      });
    }
  }
);

// Obtenir l'historique des commissions
router.get('/history',
  authenticateAdmin,
  async (req: express.Request, res: express.Response) => {
    try {
      const {
        page = 1,
        limit = 50,
        status,
        start_date,
        end_date,
        shop_id
      } = req.query as any;

      let query = supabase
        .from('commissions')
        .select(`
          *,
          transactions!inner(
            transaction_id,
            amount,
            payment_method,
            shop_id,
            user_id
          )
        `, { count: 'exact' });

      // Appliquer les filtres
      if (status) {
        query = query.eq('status', status);
      }
      if (start_date) {
        query = query.gte('created_at', start_date);
      }
      if (end_date) {
        query = query.lte('created_at', end_date);
      }
      if (shop_id) {
        query = query.eq('transactions.shop_id', shop_id);
      }

      // Pagination
      const offset = (parseInt(page) - 1) * parseInt(limit);
      query = query.range(offset, offset + parseInt(limit) - 1)
        .order('created_at', { ascending: false });

      const { data: commissions, count, error } = await query;

      if (error) {
        throw error;
      }

      // Calculer les totaux
      const totals = commissions?.reduce((acc, commission) => ({
        total_commissions: acc.total_commissions + parseFloat(commission.total_commission || 0),
        total_platform_commissions: acc.total_platform_commissions + parseFloat(commission.platform_commission || 0),
        total_payment_fees: acc.total_payment_fees + parseFloat(commission.payment_processing_fee || 0),
        total_shop_earnings: acc.total_shop_earnings + parseFloat(commission.shop_earning || 0),
        count: acc.count + 1
      }), {
        total_commissions: 0,
        total_platform_commissions: 0,
        total_payment_fees: 0,
        total_shop_earnings: 0,
        count: 0
      }) || {
        total_commissions: 0,
        total_platform_commissions: 0,
        total_payment_fees: 0,
        total_shop_earnings: 0,
        count: 0
      };

      res.json({
        success: true,
        data: {
          commissions: commissions || [],
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: count || 0,
            total_pages: Math.ceil((count || 0) / parseInt(limit))
          },
          totals
        }
      });
    } catch (error) {
      console.error('Erreur historique commissions:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erreur serveur' 
      });
    }
  }
);

// Effectuer un paiement de commission à une boutique
router.post('/payout/:commissionId',
  authenticateAdmin,
  async (req: express.Request, res: express.Response) => {
    try {
      const { commissionId } = req.params;
      const { payout_method = 'bank_transfer', notes } = req.body;

      // Récupérer la commission
      const { data: commission, error: commissionError } = await supabase
        .from('commissions')
        .select(`*, transactions!inner(shop_id)`)
        .eq('id', commissionId)
        .single();

      if (commissionError || !commission) {
        return res.status(404).json({ 
          success: false, 
          error: 'Commission non trouvée' 
        });
      }

      if (commission.status === 'paid') {
        return res.status(400).json({ 
          success: false, 
          error: 'Commission déjà payée' 
        });
      }

      // Récupérer les informations de la boutique
      const { data: shop } = await supabase
        .from('shops')
        .select('owner_id, name')
        .eq('id', commission.transactions.shop_id)
        .single();

      if (!shop) {
        return res.status(404).json({ 
          success: false, 
          error: 'Boutique non trouvée' 
        });
      }

      // Créer l'entrée de paiement
      const { data: payout, error: payoutError } = await supabase
        .from('commission_payouts')
        .insert({
          commission_id: commissionId,
          shop_id: commission.transactions.shop_id,
          amount: commission.shop_earning,
          currency: commission.currency,
          payout_method: payout_method,
          status: 'pending',
          notes: notes,
          requested_by: (req as any).user.id,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (payoutError) {
        throw payoutError;
      }

      // Mettre à jour le statut de la commission
      await supabase
        .from('commissions')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
          payout_id: payout.id
        })
        .eq('id', commissionId);

      res.json({
        success: true,
        data: payout,
        message: 'Paiement de commission initié avec succès'
      });
    } catch (error) {
      console.error('Erreur paiement commission:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erreur serveur' 
      });
    }
  }
);

// Obtenir les rapports de commission
router.get('/reports',
  authenticateAdmin,
  async (req: express.Request, res: express.Response) => {
    try {
      const { start_date, end_date, group_by = 'day' } = req.query as any;

      let query = supabase
        .from('commissions')
        .select(`
          *,
          transactions!inner(
            created_at,
            payment_method,
            shop_id
          )
        `);

      if (start_date) {
        query = query.gte('created_at', start_date);
      }
      if (end_date) {
        query = query.lte('created_at', end_date);
      }

      const { data: commissions, error } = await query;

      if (error) {
        throw error;
      }

      // Générer le rapport
      let reportData = [];
      
      if (group_by === 'day') {
        // Grouper par jour
        const dailyData = {};
        commissions?.forEach(commission => {
          const date = new Date(commission.created_at).toISOString().split('T')[0];
          if (!dailyData[date]) {
            dailyData[date] = {
              date,
              total_commissions: 0,
              platform_commissions: 0,
              payment_fees: 0,
              shop_earnings: 0,
              transaction_count: 0
            };
          }
          
          dailyData[date].total_commissions += parseFloat(commission.total_commission || 0);
          dailyData[date].platform_commissions += parseFloat(commission.platform_commission || 0);
          dailyData[date].payment_fees += parseFloat(commission.payment_processing_fee || 0);
          dailyData[date].shop_earnings += parseFloat(commission.shop_earning || 0);
          dailyData[date].transaction_count += 1;
        });
        reportData = Object.values(dailyData);
      } else if (group_by === 'payment_method') {
        // Grouper par méthode de paiement
        const methodData = {};
        commissions?.forEach(commission => {
          const method = commission.transactions.payment_method;
          if (!methodData[method]) {
            methodData[method] = {
              payment_method: method,
              total_commissions: 0,
              platform_commissions: 0,
              payment_fees: 0,
              shop_earnings: 0,
              transaction_count: 0
            };
          }
          
          methodData[method].total_commissions += parseFloat(commission.total_commission || 0);
          methodData[method].platform_commissions += parseFloat(commission.platform_commission || 0);
          methodData[method].payment_fees += parseFloat(commission.payment_processing_fee || 0);
          methodData[method].shop_earnings += parseFloat(commission.shop_earning || 0);
          methodData[method].transaction_count += 1;
        });
        reportData = Object.values(methodData);
      }

      // Calculer les totaux globaux
      const totals = commissions?.reduce((acc, commission) => ({
        total_commissions: acc.total_commissions + parseFloat(commission.total_commission || 0),
        platform_commissions: acc.platform_commissions + parseFloat(commission.platform_commission || 0),
        payment_fees: acc.payment_fees + parseFloat(commission.payment_processing_fee || 0),
        shop_earnings: acc.shop_earnings + parseFloat(commission.shop_earning || 0),
        count: acc.count + 1
      }), {
        total_commissions: 0,
        platform_commissions: 0,
        payment_fees: 0,
        shop_earnings: 0,
        count: 0
      }) || {
        total_commissions: 0,
        platform_commissions: 0,
        payment_fees: 0,
        shop_earnings: 0,
        count: 0
      };

      res.json({
        success: true,
        data: {
          period: { start_date, end_date },
          group_by,
          report: reportData,
          totals
        }
      });
    } catch (error) {
      console.error('Erreur rapport commissions:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erreur serveur' 
      });
    }
  }
);

export default router;
