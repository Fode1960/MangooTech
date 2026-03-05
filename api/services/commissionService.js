import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Configuration des commissions par défaut
const DEFAULT_COMMISSION_RATES = {
  stripe: 0.025,      // 2.5%
  paypal: 0.034,      // 3.4%
  orange_money: 0.01, // 1%
  mtn_momo: 0.015,   // 1.5%
  moov_money: 0.012, // 1.2%
  platform: 0.05,     // 5% commission plateforme
  vendor: 0.90,       // 90% pour le vendeur après commissions
};

// Types de commissions
const COMMISSION_TYPES = {
  PAYMENT_PROCESSING: 'payment_processing',
  PLATFORM: 'platform',
  VENDOR: 'vendor',
  REFUND: 'refund'
};

/**
 * Calculer les commissions pour un paiement
 */
async function calculateCommissions(paymentData) {
  try {
    const { amount, currency, payment_method, vendor_id, shop_id } = paymentData;
    
    // Obtenir les taux de commission configurés
    const commissionRates = await getCommissionRates(shop_id, vendor_id);
    
    // Calculer les commissions
    const processingCommission = amount * commissionRates[payment_method];
    const platformCommission = amount * commissionRates.platform;
    const totalCommissions = processingCommission + platformCommission;
    const vendorAmount = amount - totalCommissions;

    return {
      original_amount: amount,
      currency,
      payment_method,
      processing_commission: processingCommission,
      platform_commission: platformCommission,
      total_commissions: totalCommissions,
      vendor_amount: vendorAmount,
      rates_used: commissionRates,
      calculated_at: new Date().toISOString()
    };
  } catch (error) {
    console.error('Erreur calcul commission:', error);
    throw error;
  }
}

/**
 * Obtenir les taux de commission (avec surcharge de configuration)
 */
async function getCommissionRates(shop_id, vendor_id) {
  try {
    // Chercher des taux personnalisés pour la boutique
    if (shop_id) {
      const { data: shopConfig } = await supabase
        .from('shop_commission_configs')
        .select('commission_rates')
        .eq('shop_id', shop_id)
        .eq('is_active', true)
        .single();

      if (shopConfig?.commission_rates) {
        return { ...DEFAULT_COMMISSION_RATES, ...shopConfig.commission_rates };
      }
    }

    // Chercher des taux personnalisés pour le vendeur
    if (vendor_id) {
      const { data: vendorConfig } = await supabase
        .from('vendor_commission_configs')
        .select('commission_rates')
        .eq('vendor_id', vendor_id)
        .eq('is_active', true)
        .single();

      if (vendorConfig?.commission_rates) {
        return { ...DEFAULT_COMMISSION_RATES, ...vendorConfig.commission_rates };
      }
    }

    // Retourner les taux par défaut
    return DEFAULT_COMMISSION_RATES;
  } catch (error) {
    console.error('Erreur récupération taux commission:', error);
    return DEFAULT_COMMISSION_RATES;
  }
}

/**
 * Créer une distribution de commission
 */
async function createCommissionDistribution(paymentId, commissionData) {
  try {
    const {
      processing_commission,
      platform_commission,
      vendor_amount,
      currency,
      payment_method
    } = commissionData;

    // Commission de traitement (va au fournisseur de paiement)
    const processingDistribution = await supabase
      .from('commission_distributions')
      .insert({
        payment_id: paymentId,
        commission_type: COMMISSION_TYPES.PAYMENT_PROCESSING,
        amount: processing_commission,
        currency,
        recipient_type: 'payment_provider',
        recipient_id: payment_method,
        status: 'processed',
        description: `Frais de traitement ${payment_method.toUpperCase()}`,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    // Commission plateforme
    const platformDistribution = await supabase
      .from('commission_distributions')
      .insert({
        payment_id: paymentId,
        commission_type: COMMISSION_TYPES.PLATFORM,
        amount: platform_commission,
        currency,
        recipient_type: 'platform',
        recipient_id: 'mangoo_tech',
        status: 'processed',
        description: 'Commission MangooTech',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    // Montant pour le vendeur
    const vendorDistribution = await supabase
      .from('commission_distributions')
      .insert({
        payment_id: paymentId,
        commission_type: COMMISSION_TYPES.VENDOR,
        amount: vendor_amount,
        currency,
        recipient_type: 'vendor',
        recipient_id: commissionData.vendor_id || 'unknown',
        status: 'pending',
        description: 'Revenu vendeur',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    return {
      processing: processingDistribution.data,
      platform: platformDistribution.data,
      vendor: vendorDistribution.data
    };
  } catch (error) {
    console.error('Erreur création distribution commission:', error);
    throw error;
  }
}

/**
 * Traiter les commissions pour un paiement réussi
 */
async function processPaymentCommissions(paymentData) {
  try {
    const { id: paymentId, amount, currency, payment_method, vendor_id, shop_id } = paymentData;

    // Calculer les commissions
    const commissionData = await calculateCommissions({
      amount,
      currency,
      payment_method,
      vendor_id,
      shop_id
    });

    // Créer la distribution
    const distributions = await createCommissionDistribution(paymentId, commissionData);

    // Mettre à jour le paiement avec les informations de commission
    const { error: updateError } = await supabase
      .from('payments')
      .update({
        commission_amount: commissionData.total_commissions,
        vendor_amount: commissionData.vendor_amount,
        commission_processed: true,
        commission_processed_at: new Date().toISOString(),
        commission_details: commissionData
      })
      .eq('id', paymentId);

    if (updateError) {
      throw new Error(`Erreur mise à jour paiement: ${updateError.message}`);
    }

    // Créer une transaction de commission
    await createCommissionTransaction(paymentId, commissionData);

    return {
      success: true,
      commissionData,
      distributions
    };
  } catch (error) {
    console.error('Erreur traitement commission paiement:', error);
    throw error;
  }
}

/**
 * Créer une transaction de commission
 */
async function createCommissionTransaction(paymentId, commissionData) {
  try {
    const { error } = await supabase
      .from('commission_transactions')
      .insert({
        payment_id: paymentId,
        original_amount: commissionData.original_amount,
        commission_amount: commissionData.total_commissions,
        vendor_amount: commissionData.vendor_amount,
        currency: commissionData.currency,
        payment_method: commissionData.payment_method,
        commission_breakdown: {
          processing: commissionData.processing_commission,
          platform: commissionData.platform_commission
        },
        status: 'completed',
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Erreur création transaction commission:', error);
    }
  } catch (error) {
    console.error('Erreur dans createCommissionTransaction:', error);
  }
}

/**
 * Traiter un remboursement et ajuster les commissions
 */
async function processRefundCommissions(paymentId, refundAmount) {
  try {
    // Récupérer les distributions de commission
    const { data: distributions } = await supabase
      .from('commission_distributions')
      .select('*')
      .eq('payment_id', paymentId);

    if (!distributions) {
      throw new Error('Aucune distribution trouvée pour ce paiement');
    }

    // Calculer le ratio de remboursement
    const originalPayment = await supabase
      .from('payments')
      .select('amount')
      .eq('id', paymentId)
      .single();

    const refundRatio = refundAmount / originalPayment.data.amount;

    // Créer des distributions de remboursement
    const refundDistributions = [];
    
    for (const distribution of distributions) {
      if (distribution.status === 'processed' && distribution.amount > 0) {
        const refundAmount = distribution.amount * refundRatio;
        
        const refundDistribution = await supabase
          .from('commission_distributions')
          .insert({
            payment_id: paymentId,
            commission_type: COMMISSION_TYPES.REFUND,
            amount: -refundAmount, // Montant négatif pour le remboursement
            currency: distribution.currency,
            recipient_type: distribution.recipient_type,
            recipient_id: distribution.recipient_id,
            status: 'processed',
            description: `Remboursement commission - ${distribution.commission_type}`,
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        refundDistributions.push(refundDistribution.data);
      }
    }

    return {
      success: true,
      refundRatio,
      refundDistributions
    };
  } catch (error) {
    console.error('Erreur traitement remboursement commission:', error);
    throw error;
  }
}

/**
 * Obtenir les statistiques de commission
 */
async function getCommissionStats(startDate, endDate) {
  try {
    const { data: transactions } = await supabase
      .from('commission_transactions')
      .select('*')
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    const stats = {
      total_commissions: 0,
      total_vendor_amounts: 0,
      total_original_amounts: 0,
      by_payment_method: {},
      by_date: {}
    };

    transactions.forEach(transaction => {
      // Totaux généraux
      stats.total_commissions += transaction.commission_amount;
      stats.total_vendor_amounts += transaction.vendor_amount;
      stats.total_original_amounts += transaction.original_amount;

      // Par méthode de paiement
      if (!stats.by_payment_method[transaction.payment_method]) {
        stats.by_payment_method[transaction.payment_method] = {
          commissions: 0,
          vendor_amounts: 0,
          count: 0
        };
      }
      stats.by_payment_method[transaction.payment_method].commissions += transaction.commission_amount;
      stats.by_payment_method[transaction.payment_method].vendor_amounts += transaction.vendor_amount;
      stats.by_payment_method[transaction.payment_method].count += 1;

      // Par date
      const date = transaction.created_at.split('T')[0];
      if (!stats.by_date[date]) {
        stats.by_date[date] = {
          commissions: 0,
          vendor_amounts: 0,
          count: 0
        };
      }
      stats.by_date[date].commissions += transaction.commission_amount;
      stats.by_date[date].vendor_amounts += transaction.vendor_amount;
      stats.by_date[date].count += 1;
    });

    return stats;
  } catch (error) {
    console.error('Erreur récupération stats commission:', error);
    throw error;
  }
}

export {
  calculateCommissions,
  createCommissionDistribution,
  processPaymentCommissions,
  processRefundCommissions,
  getCommissionStats,
  DEFAULT_COMMISSION_RATES,
  COMMISSION_TYPES
};