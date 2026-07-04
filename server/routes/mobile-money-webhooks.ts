import express from 'express';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Configuration des webhooks pour chaque opérateur
const WEBHOOK_CONFIGS = {
  orange: {
    secret: process.env.ORANGE_MONEY_WEBHOOK_SECRET,
    header: 'X-Orange-Signature'
  },
  mtn: {
    secret: process.env.MTN_MOMO_WEBHOOK_SECRET,
    header: 'X-MTN-Signature'
  },
  moov: {
    secret: process.env.MOOV_MONEY_WEBHOOK_SECRET,
    header: 'X-Moov-Signature'
  }
};

// Middleware de vérification des signatures
const verifyWebhookSignature = (operator: string) => {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      const config = WEBHOOK_CONFIGS[operator as keyof typeof WEBHOOK_CONFIGS];
      if (!config || !config.secret) {
        console.warn(`Webhook secret non configuré pour ${operator}`);
        return next();
      }

      const signature = req.headers[config.header.toLowerCase()] as string;
      if (!signature) {
        return res.status(401).json({ 
          success: false, 
          error: 'Signature manquante' 
        });
      }

      const payload = JSON.stringify(req.body);
      const expectedSignature = crypto
        .createHmac('sha256', config.secret)
        .update(payload)
        .digest('hex');

      if (signature !== expectedSignature) {
        return res.status(401).json({ 
          success: false, 
          error: 'Signature invalide' 
        });
      }

      next();
    } catch (error) {
      console.error(`Erreur vérification signature ${operator}:`, error);
      res.status(500).json({ 
        success: false, 
        error: 'Erreur vérification signature' 
      });
    }
  };
};

// Fonction utilitaire pour traiter le paiement réussi
const processSuccessfulPayment = async (paymentData: any) => {
  try {
    const {
      transaction_id,
      amount,
      currency,
      operator,
      status,
      reference,
      timestamp
    } = paymentData;

    // Vérifier si la transaction existe
    const { data: existingTransaction } = await supabase
      .from('transactions')
      .select('*')
      .eq('transaction_id', transaction_id)
      .single();

    if (!existingTransaction) {
      console.error(`Transaction ${transaction_id} non trouvée`);
      return { success: false, error: 'Transaction non trouvée' };
    }

    // Mettre à jour le statut de la transaction
    const { data: updatedTransaction, error: updateError } = await supabase
      .from('transactions')
      .update({
        status: status === 'SUCCESSFUL' ? 'succeeded' : 'failed',
        updated_at: new Date().toISOString(),
        payment_reference: reference,
        processed_at: timestamp || new Date().toISOString()
      })
      .eq('transaction_id', transaction_id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    // Créer une entrée dans l'historique des statuts
    await supabase.from('transaction_status_history').insert({
      transaction_id: existingTransaction.id,
      status: status === 'SUCCESSFUL' ? 'succeeded' : 'failed',
      reason: `Paiement ${operator} - ${status}`,
      created_at: new Date().toISOString()
    });

    // Si le paiement est réussi, mettre à jour les analytics
    if (status === 'SUCCESSFUL') {
      await updateShopAnalytics(existingTransaction.shop_id, {
        amount: parseFloat(amount),
        payment_method: operator,
        status: 'succeeded'
      });
    }

    // Envoyer une notification (implémentée plus tard)
    await sendPaymentNotification(existingTransaction.user_id, {
      transaction_id,
      amount,
      currency,
      status: status === 'SUCCESSFUL' ? 'succeeded' : 'failed',
      payment_method: operator
    });

    return {
      success: true,
      data: updatedTransaction
    };
  } catch (error) {
    console.error('Erreur traitement paiement réussi:', error);
    return {
      success: false,
      error: 'Erreur traitement paiement'
    };
  }
};

// Fonction pour mettre à jour les analytics des boutiques
const updateShopAnalytics = async (shopId: string, paymentData: any) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Récupérer l'analytics actuelle
    const { data: existingAnalytics } = await supabase
      .from('shop_analytics')
      .select('*')
      .eq('shop_id', shopId)
      .eq('date', today)
      .single();

    const updates: any = {
      total_revenue: (existingAnalytics?.total_revenue || 0) + paymentData.amount,
      successful_payments: (existingAnalytics?.successful_payments || 0) + 1
    };

    // Mettre à jour les compteurs par méthode de paiement
    if (paymentData.payment_method === 'orange_money') {
      updates.orange_money_payments = (existingAnalytics?.orange_money_payments || 0) + 1;
    } else if (paymentData.payment_method === 'mtn_money') {
      updates.mtn_money_payments = (existingAnalytics?.mtn_money_payments || 0) + 1;
    } else if (paymentData.payment_method === 'moov_money') {
      updates.moov_money_payments = (existingAnalytics?.moov_money_payments || 0) + 1;
    }

    if (existingAnalytics) {
      await supabase
        .from('shop_analytics')
        .update(updates)
        .eq('id', existingAnalytics.id);
    } else {
      await supabase.from('shop_analytics').insert({
        shop_id: shopId,
        date: today,
        ...updates,
        total_orders: 1,
        failed_payments: 0,
        card_payments: 0,
        cash_payments: 0,
        mobile_money_payments: 1
      });
    }
  } catch (error) {
    console.error('Erreur mise à jour analytics:', error);
  }
};

// Fonction pour envoyer des notifications (placeholder)
const sendPaymentNotification = async (userId: string, paymentData: any) => {
  try {
    // Implémentation future des notifications
    console.log(`Notification envoyée à l'utilisateur ${userId}:`, paymentData);
  } catch (error) {
    console.error('Erreur envoi notification:', error);
  }
};

// === WEBHOOKS ORANGE MONEY ===

router.post('/orange',
  verifyWebhookSignature('orange'),
  async (req: express.Request, res: express.Response) => {
    try {
      const { transaction_id, status, amount, currency, phone_number, reference } = req.body;

      console.log(`Orange Money Webhook: ${transaction_id} - ${status}`);

      const result = await processSuccessfulPayment({
        transaction_id,
        amount,
        currency,
        phone_number,
        operator: 'orange_money',
        status,
        reference,
        timestamp: new Date().toISOString()
      });

      if (result.success) {
        res.json({ 
          success: true, 
          message: 'Paiement Orange Money traité avec succès' 
        });
      } else {
        res.status(400).json({ 
          success: false, 
          error: result.error 
        });
      }
    } catch (error) {
      console.error('Erreur webhook Orange Money:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erreur traitement webhook Orange Money' 
      });
    }
  }
);

// Webhook pour les statuts de transaction Orange Money
router.post('/orange/status',
  verifyWebhookSignature('orange'),
  async (req: express.Request, res: express.Response) => {
    try {
      const { transaction_id, status, message } = req.body;

      console.log(`Orange Money Status Update: ${transaction_id} - ${status}`);

      // Mettre à jour le statut de la transaction
      const { error } = await supabase
        .from('transactions')
        .update({
          status: status.toLowerCase(),
          updated_at: new Date().toISOString(),
          failure_reason: status !== 'SUCCESSFUL' ? message : null
        })
        .eq('transaction_id', transaction_id);

      if (error) {
        throw error;
      }

      res.json({ 
        success: true, 
        message: 'Statut mis à jour avec succès' 
      });
    } catch (error) {
      console.error('Erreur webhook Orange Money status:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erreur mise à jour statut' 
      });
    }
  }
);

// === WEBHOOKS MTN MOMO ===

router.post('/mtn',
  verifyWebhookSignature('mtn'),
  async (req: express.Request, res: express.Response) => {
    try {
      const { transaction_id, status, amount, currency, phone_number, reference } = req.body;

      console.log(`MTN MoMo Webhook: ${transaction_id} - ${status}`);

      const result = await processSuccessfulPayment({
        transaction_id,
        amount,
        currency,
        phone_number,
        operator: 'mtn_money',
        status,
        reference,
        timestamp: new Date().toISOString()
      });

      if (result.success) {
        res.json({ 
          success: true, 
          message: 'Paiement MTN MoMo traité avec succès' 
        });
      } else {
        res.status(400).json({ 
          success: false, 
          error: result.error 
        });
      }
    } catch (error) {
      console.error('Erreur webhook MTN MoMo:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erreur traitement webhook MTN MoMo' 
      });
    }
  }
);

// Webhook pour les statuts de transaction MTN
router.post('/mtn/status',
  verifyWebhookSignature('mtn'),
  async (req: express.Request, res: express.Response) => {
    try {
      const { transaction_id, status, message } = req.body;

      console.log(`MTN Status Update: ${transaction_id} - ${status}`);

      const { error } = await supabase
        .from('transactions')
        .update({
          status: status.toLowerCase(),
          updated_at: new Date().toISOString(),
          failure_reason: status !== 'SUCCESSFUL' ? message : null
        })
        .eq('transaction_id', transaction_id);

      if (error) {
        throw error;
      }

      res.json({ 
        success: true, 
        message: 'Statut mis à jour avec succès' 
      });
    } catch (error) {
      console.error('Erreur webhook MTN status:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erreur mise à jour statut' 
      });
    }
  }
);

// === WEBHOOKS MOOV MONEY ===

router.post('/moov',
  verifyWebhookSignature('moov'),
  async (req: express.Request, res: express.Response) => {
    try {
      const { transaction_id, status, amount, currency, phone_number, reference } = req.body;

      console.log(`Moov Money Webhook: ${transaction_id} - ${status}`);

      const result = await processSuccessfulPayment({
        transaction_id,
        amount,
        currency,
        phone_number,
        operator: 'moov_money',
        status,
        reference,
        timestamp: new Date().toISOString()
      });

      if (result.success) {
        res.json({ 
          success: true, 
          message: 'Paiement Moov Money traité avec succès' 
        });
      } else {
        res.status(400).json({ 
          success: false, 
          error: result.error 
        });
      }
    } catch (error) {
      console.error('Erreur webhook Moov Money:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erreur traitement webhook Moov Money' 
      });
    }
  }
);

// Webhook pour les statuts de transaction Moov
router.post('/moov/status',
  verifyWebhookSignature('moov'),
  async (req: express.Request, res: express.Response) => {
    try {
      const { transaction_id, status, message } = req.body;

      console.log(`Moov Status Update: ${transaction_id} - ${status}`);

      const { error } = await supabase
        .from('transactions')
        .update({
          status: status.toLowerCase(),
          updated_at: new Date().toISOString(),
          failure_reason: status !== 'SUCCESSFUL' ? message : null
        })
        .eq('transaction_id', transaction_id);

      if (error) {
        throw error;
      }

      res.json({ 
        success: true, 
        message: 'Statut mis à jour avec succès' 
      });
    } catch (error) {
      console.error('Erreur webhook Moov status:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erreur mise à jour statut' 
      });
    }
  }
);

// === WEBHOOK GÉNÉRAL POUR TOUS LES OPÉRATEURS ===

router.post('/universal',
  async (req: express.Request, res: express.Response) => {
    try {
      const { transaction_id, status, operator, amount, currency, phone_number, reference } = req.body;

      console.log(`Universal Webhook: ${transaction_id} - ${operator} - ${status}`);

      if (!transaction_id || !operator || !status) {
        return res.status(400).json({ 
          success: false, 
          error: 'Paramètres requis manquants' 
        });
      }

      const result = await processSuccessfulPayment({
        transaction_id,
        amount,
        currency,
        phone_number,
        operator: `${operator}_money`,
        status,
        reference,
        timestamp: new Date().toISOString()
      });

      if (result.success) {
        res.json({ 
          success: true, 
          message: 'Paiement traité avec succès' 
        });
      } else {
        res.status(400).json({ 
          success: false, 
          error: result.error 
        });
      }
    } catch (error) {
      console.error('Erreur webhook universel:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erreur traitement webhook universel' 
      });
    }
  }
);

// Endpoint pour tester les webhooks
router.post('/test/:operator',
  async (req: express.Request, res: express.Response) => {
    try {
      const { operator } = req.params;
      const testData = {
        transaction_id: `TEST_${Date.now()}`,
        status: 'SUCCESSFUL',
        amount: 1000,
        currency: 'XOF',
        phone_number: '22901020304',
        reference: `REF_${Date.now()}`,
        ...req.body
      };

      console.log(`Test Webhook ${operator}:`, testData);

      const result = await processSuccessfulPayment({
        ...testData,
        operator: `${operator}_money`,
        timestamp: new Date().toISOString()
      });

      res.json({
        success: true,
        message: 'Test webhook exécuté',
        data: result
      });
    } catch (error) {
      console.error('Erreur test webhook:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erreur test webhook' 
      });
    }
  }
);

export default router;
