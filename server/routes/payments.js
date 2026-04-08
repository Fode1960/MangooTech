import express from 'express';
import { stripe } from '../config/payments.js';
import { createClient } from '@supabase/supabase-js';
import { activateUserPack, deactivateOtherActivePacks } from '../services/packActivation.js';

const router = express.Router();

// Initialiser Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Créer un paiement Stripe
router.post('/create-stripe-payment', async (req, res) => {
  try {
    const { amount, currency = 'eur', description, customer_email, user_id, pack_id, pack_name, pack_price } = req.body;

    console.log('Requête Stripe reçue:', { amount, currency, description, customer_email, user_id });

    // Validation
    if (!amount || !description) {
      return res.status(400).json({ 
        error: 'Montant et description requis',
        code: 'MISSING_PARAMETERS'
      });
    }

    // Convertir le montant en centimes pour Stripe
    const amountInCents = Math.round(parseFloat(amount) * 100);

    // Calculer les frais de traitement
    const processingFee = Math.round(amountInCents * 0.025); // 2.5% pour Stripe
    const netAmount = amountInCents - processingFee;

    // Vérifier la configuration Stripe
    if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === 'sk_test_your_stripe_secret_key_here') {
      console.error('Clé Stripe non configurée correctement');
      return res.status(500).json({
        error: 'Configuration Stripe invalide',
        code: 'STRIPE_CONFIG_ERROR',
        details: 'La clé secrète Stripe n\'est pas configurée',
      });
    }

    // Créer le PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: currency.toLowerCase(),
      description: description,
      receipt_email: customer_email,
      metadata: {
        platform: 'mangoo_tech',
        payment_method: 'stripe',
        user_id: user_id || 'anonymous',
        pack_id: pack_id || '',
        pack_name: pack_name || '',
        pack_price: pack_price || '',
      },
    });

    // Enregistrer le paiement dans la base de données
    const paymentData = {
      user_id: user_id,
      amount: amount,
      currency: currency.toUpperCase(),
      payment_method: 'stripe',
      status: 'pending',
      gateway_order_id: paymentIntent.id,
      payer_email: customer_email,
      processing_fee: processingFee / 100, // Convertir en euros
      total_amount: amountInCents / 100, // Convertir en euros
      metadata: {
        description: description,
        created_via: 'api',
        stripe_currency: paymentIntent.currency,
        amount_in_cents: amountInCents,
        net_amount_cents: netAmount,
        pack_id: pack_id || null,
        pack_name: pack_name || null,
        pack_price: pack_price || null
      }
    };

    const { data: payment, error: dbError } = await supabase
      .from('payments')
      .insert(paymentData)
      .select()
      .single();

    if (dbError) {
      console.error('Erreur base de données:', dbError);
      return res.status(500).json({
        error: 'Erreur lors de l\'enregistrement du paiement',
        code: 'DATABASE_ERROR',
        details: dbError.message,
      });
    }

    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      paymentId: payment.id,
      amount: amount,
      currency: currency,
      processingFee: processingFee / 100, // Convertir en euros
      netAmount: netAmount / 100, // Convertir en euros
    });

  } catch (error) {
    console.error('Erreur Stripe:', error);
    res.status(500).json({
      error: 'Erreur lors de la création du paiement Stripe',
      code: 'STRIPE_ERROR',
      details: error.message,
    });
  }
});

// Confirmer un paiement Stripe
router.post('/confirm-stripe-payment', async (req, res) => {
  try {
    const { paymentIntentId, paymentId } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({
        error: 'ID du PaymentIntent requis',
        code: 'MISSING_PAYMENT_INTENT_ID',
      });
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === 'succeeded') {
      // Mettre à jour le paiement dans la base de données
      if (paymentId) {
        const { error: updateError } = await supabase
          .from('payments')
          .update({
            status: 'succeeded',
            gateway_response: JSON.stringify({
              stripe_payment_intent_id: paymentIntent.id,
              stripe_charge_id: paymentIntent.charges.data[0]?.id,
              confirmed_at: new Date().toISOString(),
              confirmation_method: 'api',
            }),
            updated_at: new Date().toISOString()
          })
          .eq('id', paymentId);

        if (updateError) {
          console.error('Erreur mise à jour paiement:', updateError);
          // Essayons aussi de trouver par gateway_order_id
          const { error: updateByGatewayError } = await supabase
            .from('payments')
            .update({
              status: 'succeeded',
              gateway_response: JSON.stringify({
                stripe_payment_intent_id: paymentIntent.id,
                stripe_charge_id: paymentIntent.charges.data[0]?.id,
                confirmed_at: new Date().toISOString(),
                confirmation_method: 'api',
              }),
              updated_at: new Date().toISOString()
            })
            .eq('gateway_order_id', paymentIntentId);

          if (updateByGatewayError) {
            console.error('Erreur mise à jour paiement par gateway_order_id:', updateByGatewayError);
          }
        }
      } else {
        // Si pas de paymentId, essayer de trouver le paiement par gateway_order_id
        const { data: existingPayment, error: findError } = await supabase
          .from('payments')
          .select('id')
          .eq('gateway_order_id', paymentIntentId)
          .single();

        if (existingPayment && !findError) {
          const { error: updateError } = await supabase
            .from('payments')
            .update({
              status: 'succeeded',
              gateway_response: JSON.stringify({
                stripe_payment_intent_id: paymentIntent.id,
                stripe_charge_id: paymentIntent.charges.data[0]?.id,
                confirmed_at: new Date().toISOString(),
                confirmation_method: 'api',
              }),
              updated_at: new Date().toISOString()
            })
            .eq('id', existingPayment.id);

          if (updateError) {
            console.error('Erreur mise à jour paiement trouvé:', updateError);
          }
        }
      }

      const { data: paymentRowFetch } = await supabase
        .from('payments')
        .select('*')
        .eq('id', paymentId)
        .single();
      let paymentRow = paymentRowFetch;
      if (!paymentRow) {
        const { data: payByGateway } = await supabase
          .from('payments')
          .select('*')
          .eq('gateway_order_id', paymentIntentId)
          .single();
        paymentRow = payByGateway || null;
      }
      if (paymentRow) {
        const { data: existingTx } = await supabase
          .from('transactions')
          .select('id')
          .eq('payment_id', paymentRow.id)
          .single();
        if (!existingTx) {
          await createTransaction(paymentRow, 'success');
        }

        const packId = paymentRow?.metadata?.pack_id;
        const resolvedUserId = paymentRow?.user_id;
        if (packId && resolvedUserId) {
          try {
            await deactivateOtherActivePacks({ supabase, userId: resolvedUserId, keepPackId: packId });
            await activateUserPack({
              supabase,
              userId: resolvedUserId,
              packId,
              source: 'stripe_confirm',
              transaction: { paymentIntentId, paymentId: paymentRow.id },
            });
          } catch (e) {
            console.error('Activation pack (stripe) échouée:', e);
          }
        }
      }
      res.json({
        success: true,
        status: paymentIntent.status,
        transactionId: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        paymentId: paymentId,
        message: 'Paiement confirmé avec succès',
      });
    } else {
      // Mettre à jour le statut d'échec
      if (paymentId) {
        const { error: updateError } = await supabase
          .from('payments')
          .update({
            status: 'failed',
            gateway_response: JSON.stringify({
              failure_reason: paymentIntent.last_payment_error?.message || 'Paiement non réussi',
              failed_at: new Date().toISOString(),
              failure_reason_detail: paymentIntent.last_payment_error,
            }),
            updated_at: new Date().toISOString()
          })
          .eq('id', paymentId);

        if (updateError) {
          console.error('Erreur mise à jour paiement échoué:', updateError);
        }
      }

      res.status(400).json({
        error: 'Paiement non réussi',
        code: 'PAYMENT_FAILED',
        status: paymentIntent.status,
        paymentId: paymentId,
      });
    }

  } catch (error) {
    console.error('Erreur confirmation Stripe:', error);
    res.status(500).json({
      error: 'Erreur lors de la confirmation du paiement',
      code: 'STRIPE_CONFIRMATION_ERROR',
      details: error.message,
    });
  }
});

// Simulation de paiement mobile money (Orange Money, MTN, Moov)
router.post('/process-mobile-money', async (req, res) => {
  try {
    const { 
      amount, 
      currency = 'XOF', 
      phoneNumber, 
      provider, 
      description 
    } = req.body;

    // Validation
    if (!amount || !phoneNumber || !provider) {
      return res.status(400).json({
        error: 'Montant, numéro de téléphone et fournisseur requis',
        code: 'MISSING_PARAMETERS',
      });
    }

    // Validation du format du numéro
    const phoneRegex = /^\+?(225|221|223|226)\s?\d{8,10}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return res.status(400).json({
        error: 'Format de numéro de téléphone invalide',
        code: 'INVALID_PHONE_FORMAT',
      });
    }

    // Simulation du processus de paiement mobile
    // Dans une vraie implémentation, ceci serait remplacé par des appels API réels
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Simulation de succès (90% de réussite)
    const success = Math.random() > 0.1;

    if (success) {
      const transactionId = `MM${Date.now()}${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
      
      res.json({
        success: true,
        transactionId,
        amount: parseFloat(amount),
        currency,
        provider,
        phoneNumber: phoneNumber.replace(/\d(?=\d{4})/g, '*'), // Masquer le numéro
        status: 'completed',
        message: 'Paiement mobile effectué avec succès',
      });
    } else {
      res.status(400).json({
        error: 'Paiement mobile échoué',
        code: 'MOBILE_MONEY_FAILED',
        message: 'Le paiement a été refusé par le fournisseur',
      });
    }

  } catch (error) {
    console.error('Erreur Mobile Money:', error);
    res.status(500).json({
      error: 'Erreur lors du traitement du paiement mobile',
      code: 'MOBILE_MONEY_ERROR',
      details: error.message,
    });
  }
});

// Obtenir les frais de traitement
router.get('/processing-fees', (req, res) => {
  const fees = {
    stripe: { percentage: 2.5, fixed: 0.25, currency: 'EUR' },
    paypal: { percentage: 3.4, fixed: 0.25, currency: 'EUR' },
    orange_money: { percentage: 1.0, fixed: 0, currency: 'XOF' },
    mtn_momo: { percentage: 1.5, fixed: 0, currency: 'XOF' },
    moov_money: { percentage: 1.2, fixed: 0, currency: 'XOF' },
  };

  res.json({
    success: true,
    fees,
  });
});

// Webhook Stripe (pour les événements de paiement)
router.post('/stripe-webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('Erreur signature webhook:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handleWebhookPaymentIntentSucceeded(event.data.object);
        break;
      case 'payment_intent.payment_failed':
        await handleWebhookPaymentIntentFailed(event.data.object);
        break;
      case 'charge.refunded':
        await handleWebhookChargeRefunded(event.data.object);
        break;
      default:
        console.log(`Événement non traité: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Erreur traitement webhook:', error);
    res.status(500).json({ error: 'Erreur interne' });
  }
});

// Fonctions de traitement des webhooks
async function handleWebhookPaymentIntentSucceeded(paymentIntent) {
  console.log('Webhook - Paiement réussi:', paymentIntent.id);
  
  try {
    // Trouver le paiement dans la base de données
    const { data: payment, error } = await supabase
      .from('payments')
      .select('*')
      .eq('stripe_payment_intent_id', paymentIntent.id)
      .single();

    if (error || !payment) {
      console.error('Paiement non trouvé pour webhook:', paymentIntent.id);
      return;
    }

    // Mettre à jour le statut
    await supabase
      .from('payments')
      .update({
        status: 'succeeded',
        stripe_charge_id: paymentIntent.charges.data[0]?.id,
        updated_at: new Date().toISOString(),
        metadata: {
          ...payment.metadata,
          webhook_processed_at: new Date().toISOString(),
          stripe_event: 'payment_intent.succeeded',
        }
      })
      .eq('id', payment.id);

    // Créer une transaction
    await createTransaction(payment, 'success');

    console.log('Webhook - Paiement mis à jour:', paymentIntent.id);
  } catch (error) {
    console.error('Erreur webhook paiement réussi:', error);
  }
}

async function handleWebhookPaymentIntentFailed(paymentIntent) {
  console.log('Webhook - Paiement échoué:', paymentIntent.id);
  
  try {
    const { data: payment, error } = await supabase
      .from('payments')
      .select('*')
      .eq('stripe_payment_intent_id', paymentIntent.id)
      .single();

    if (error || !payment) {
      console.error('Paiement non trouvé pour webhook échec:', paymentIntent.id);
      return;
    }

    await supabase
      .from('payments')
      .update({
        status: 'failed',
        failure_reason: paymentIntent.last_payment_error?.message || 'Paiement échoué',
        updated_at: new Date().toISOString(),
        metadata: {
          ...payment.metadata,
          webhook_processed_at: new Date().toISOString(),
          stripe_event: 'payment_intent.payment_failed',
          error_code: paymentIntent.last_payment_error?.code,
        }
      })
      .eq('id', payment.id);

    await createTransaction(payment, 'failed');

    console.log('Webhook - Paiement échoué mis à jour:', paymentIntent.id);
  } catch (error) {
    console.error('Erreur webhook paiement échoué:', error);
  }
}

async function handleWebhookChargeRefunded(charge) {
  console.log('Webhook - Remboursement:', charge.id);
  
  try {
    const { data: payment, error } = await supabase
      .from('payments')
      .select('*')
      .eq('stripe_charge_id', charge.id)
      .single();

    if (error || !payment) {
      console.error('Paiement non trouvé pour remboursement:', charge.id);
      return;
    }

    await supabase
      .from('payments')
      .update({
        status: 'refunded',
        refund_amount: charge.refunds.data[0]?.amount || 0,
        updated_at: new Date().toISOString(),
        metadata: {
          ...payment.metadata,
          webhook_processed_at: new Date().toISOString(),
          stripe_event: 'charge.refunded',
          refund_reason: charge.refunds.data[0]?.reason,
        }
      })
      .eq('id', payment.id);

    await createTransaction(payment, 'refunded');

    console.log('Webhook - Remboursement traité:', charge.id);
  } catch (error) {
    console.error('Erreur webhook remboursement:', error);
  }
}

// Fonction utilitaire pour créer une transaction
async function createTransaction(payment, type) {
  try {
    const { error } = await supabase
      .from('transactions')
      .insert({
        payment_id: payment.id,
        user_id: payment.user_id,
        amount: payment.amount,
        currency: payment.currency,
        type: type,
        status: type === 'success' ? 'completed' : type,
        metadata: {
          payment_method: payment.payment_method,
          processed_at: new Date().toISOString(),
          source: (payment && payment.metadata && payment.metadata.created_via) ? payment.metadata.created_via : 'webhook',
        },
        created_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Erreur création transaction:', error);
    }
  } catch (error) {
    console.error('Erreur dans createTransaction:', error);
  }
}

export default router;
