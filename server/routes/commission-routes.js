import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { 
  getCommissionStats, 
  calculateCommissions,
  DEFAULT_COMMISSION_RATES 
} from '../services/commissionService.js';

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Obtenir les statistiques de commission
 */
router.get('/stats', async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    const startDate = start_date ? new Date(start_date) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 jours par défaut
    const endDate = end_date ? new Date(end_date) : new Date();

    const stats = await getCommissionStats(startDate.toISOString(), endDate.toISOString());

    res.json({
      success: true,
      data: stats,
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      }
    });
  } catch (error) {
    console.error('Erreur récupération stats commission:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des statistiques',
      details: error.message
    });
  }
});

/**
 * Obtenir les taux de commission par défaut
 */
router.get('/rates', (req, res) => {
  res.json({
    success: true,
    data: DEFAULT_COMMISSION_RATES
  });
});

/**
 * Calculer les commissions pour un montant donné
 */
router.post('/calculate', async (req, res) => {
  try {
    const { amount, currency, payment_method, vendor_id, shop_id } = req.body;

    if (!amount || !currency || !payment_method) {
      return res.status(400).json({
        success: false,
        error: 'Montant, devise et méthode de paiement requis'
      });
    }

    const commissionData = await calculateCommissions({
      amount: parseFloat(amount),
      currency: currency.toUpperCase(),
      payment_method,
      vendor_id,
      shop_id
    });

    res.json({
      success: true,
      data: commissionData
    });
  } catch (error) {
    console.error('Erreur calcul commission:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors du calcul des commissions',
      details: error.message
    });
  }
});

/**
 * Obtenir l'historique des commissions
 */
router.get('/history', async (req, res) => {
  try {
    const { vendor_id, shop_id, payment_method, start_date, end_date, page = 1, limit = 50 } = req.query;
    
    let query = supabase
      .from('commission_transactions')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    // Appliquer les filtres
    if (vendor_id) {
      query = query.eq('vendor_id', vendor_id);
    }
    
    if (shop_id) {
      query = query.eq('shop_id', shop_id);
    }
    
    if (payment_method) {
      query = query.eq('payment_method', payment_method);
    }
    
    if (start_date) {
      query = query.gte('created_at', start_date);
    }
    
    if (end_date) {
      query = query.lte('created_at', end_date);
    }

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit) - 1;

    query = query.range(startIndex, endIndex);

    const { data: transactions, count, error } = await query;

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Erreur récupération historique commission:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération de l\'historique',
      details: error.message
    });
  }
});

/**
 * Obtenir les distributions de commission pour un paiement
 */
router.get('/distributions/:payment_id', async (req, res) => {
  try {
    const { payment_id } = req.params;

    const { data: distributions, error } = await supabase
      .from('commission_distributions')
      .select('*')
      .eq('payment_id', payment_id)
      .order('created_at', { ascending: true });

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: distributions
    });
  } catch (error) {
    console.error('Erreur récupération distributions:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des distributions',
      details: error.message
    });
  }
});

/**
 * Configurer les taux de commission pour une boutique
 */
router.post('/shop-configs', async (req, res) => {
  try {
    const { shop_id, commission_rates, is_active = true } = req.body;

    if (!shop_id || !commission_rates) {
      return res.status(400).json({
        success: false,
        error: 'Shop ID et taux de commission requis'
      });
    }

    // Désactiver les configurations existantes
    await supabase
      .from('shop_commission_configs')
      .update({ is_active: false })
      .eq('shop_id', shop_id);

    // Créer la nouvelle configuration
    const { data: config, error } = await supabase
      .from('shop_commission_configs')
      .insert({
        shop_id,
        commission_rates,
        is_active,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    console.error('Erreur création config commission boutique:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la création de la configuration',
      details: error.message
    });
  }
});

/**
 * Configurer les taux de commission pour un vendeur
 */
router.post('/vendor-configs', async (req, res) => {
  try {
    const { vendor_id, commission_rates, is_active = true } = req.body;

    if (!vendor_id || !commission_rates) {
      return res.status(400).json({
        success: false,
        error: 'Vendor ID et taux de commission requis'
      });
    }

    // Désactiver les configurations existantes
    await supabase
      .from('vendor_commission_configs')
      .update({ is_active: false })
      .eq('vendor_id', vendor_id);

    // Créer la nouvelle configuration
    const { data: config, error } = await supabase
      .from('vendor_commission_configs')
      .insert({
        vendor_id,
        commission_rates,
        is_active,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    console.error('Erreur création config commission vendeur:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la création de la configuration',
      details: error.message
    });
  }
});

export default router;
