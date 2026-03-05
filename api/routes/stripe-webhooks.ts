import { Router } from 'express';
import express from 'express';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { emailService } from '../services/emailService';
import { processPaymentCommissions, processRefundCommissions } from '../services/commissionService';

const router = Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
});

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Middleware pour vérifier la signature Stripe
const verifyStripeSignature = (req: any, res: any, buf: Buffer) => {
  req.rawBody = buf;
};

// Webhook endpoint pour Stripe
router.post('/webhook', 
  express.raw({ type: 'application/json', verify: verifyStripeSignature }),
  async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig!, endpointSecret);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    console.log('Event received:', event.type);

    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          await handlePaymentIntentSucceeded(event.data.object);
          break;
        
        case 'payment_intent.payment_failed':
          await handlePaymentIntentFailed(event.data.object);
          break;
        
        case 'charge.refunded':
          await handleChargeRefunded(event.data.object);
          break;
        
        case 'invoice.payment_succeeded':
          await handleInvoicePaymentSucceeded(event.data.object);
          break;
        
        case 'invoice.payment_failed':
          await handleInvoicePaymentFailed(event.data.object);
          break;
        
        case 'checkout.session.completed':
          await handleCheckoutSessionCompleted(event.data.object);
          break;
        
        case 'customer.subscription.created':
          await handleCustomerSubscriptionCreated(event.data.object);
          break;
        
        case 'customer.subscription.updated':
          await handleCustomerSubscriptionUpdated(event.data.object);
          break;
        
        case 'customer.subscription.deleted':
          await handleCustomerSubscriptionDeleted(event.data.object);
          break;
        
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      res.json({ received: true });
    } catch (error) {
      console.error('Error processing webhook:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Gérer un paiement réussi
async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log('PaymentIntent succeeded:', paymentIntent.id);
  
  try {
    // Mettre à jour le statut du paiement dans la base de données
    const { data: payment, error: fetchError } = await supabase
      .from('payments')
      .select('*')
      .eq('stripe_payment_intent_id', paymentIntent.id)
      .single();

    if (fetchError || !payment) {
      console.error('Payment not found:', paymentIntent.id);
      return;
    }

    // Mettre à jour le statut du paiement
    const { error: updateError } = await supabase
      .from('payments')
      .update({
        status: 'succeeded',
        updated_at: new Date().toISOString(),
        metadata: {
          ...payment.metadata,
          stripe_event: 'payment_intent.succeeded',
          processed_at: new Date().toISOString()
        }
      })
      .eq('id', payment.id);

    if (updateError) {
      console.error('Error updating payment status:', updateError);
      return;
    }

    // Créer une transaction réussie
    await createTransaction(payment, 'success');

    // Traiter les commissions automatiquement
    try {
      const commissionResult = await processPaymentCommissions(payment);
      console.log('Commissions traitées:', commissionResult.commissionData);
    } catch (commissionError) {
      console.error('Erreur traitement commissions:', commissionError);
      // Ne pas bloquer le paiement si les commissions échouent
    }

    // Envoyer un email de confirmation
    await sendPaymentConfirmationEmail(payment);

    console.log('Payment processed successfully:', paymentIntent.id);
  } catch (error) {
    console.error('Error in handlePaymentIntentSucceeded:', error);
  }
}

// Gérer un paiement échoué
async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log('PaymentIntent failed:', paymentIntent.id);
  
  try {
    const { data: payment, error: fetchError } = await supabase
      .from('payments')
      .select('*')
      .eq('stripe_payment_intent_id', paymentIntent.id)
      .single();

    if (fetchError || !payment) {
      console.error('Payment not found:', paymentIntent.id);
      return;
    }

    // Mettre à jour le statut du paiement
    const { error: updateError } = await supabase
      .from('payments')
      .update({
        status: 'failed',
        updated_at: new Date().toISOString(),
        failure_reason: paymentIntent.last_payment_error?.message || 'Unknown error',
        metadata: {
          ...payment.metadata,
          stripe_event: 'payment_intent.payment_failed',
          error_code: paymentIntent.last_payment_error?.code,
          processed_at: new Date().toISOString()
        }
      })
      .eq('id', payment.id);

    if (updateError) {
      console.error('Error updating payment status:', updateError);
      return;
    }

    // Créer une transaction échouée
    await createTransaction(payment, 'failed');

    // Envoyer un email d'échec
    await sendPaymentFailureEmail(payment, paymentIntent.last_payment_error?.message);

    console.log('Payment failure processed:', paymentIntent.id);
  } catch (error) {
    console.error('Error in handlePaymentIntentFailed:', error);
  }
}

// Gérer un remboursement
async function handleChargeRefunded(charge: Stripe.Charge) {
  console.log('Charge refunded:', charge.id);
  
  try {
    const { data: payment, error: fetchError } = await supabase
      .from('payments')
      .select('*')
      .eq('stripe_charge_id', charge.id)
      .single();

    if (fetchError || !payment) {
      console.error('Payment not found for charge:', charge.id);
      return;
    }

    // Mettre à jour le statut du paiement
    const { error: updateError } = await supabase
      .from('payments')
      .update({
        status: 'refunded',
        updated_at: new Date().toISOString(),
        refund_amount: charge.refunds.data[0]?.amount,
        metadata: {
          ...payment.metadata,
          stripe_event: 'charge.refunded',
          refund_reason: charge.refunds.data[0]?.reason,
          processed_at: new Date().toISOString()
        }
      })
      .eq('id', payment.id);

    if (updateError) {
      console.error('Error updating payment status:', updateError);
      return;
    }

    // Créer une transaction de remboursement
    await createTransaction(payment, 'refunded');

    // Traiter les commissions de remboursement
    try {
      const refundAmount = charge.refunds.data[0]?.amount ? charge.refunds.data[0].amount / 100 : 0;
      const refundResult = await processRefundCommissions(payment.id, refundAmount);
      console.log('Commissions de remboursement traitées:', refundResult);
    } catch (refundCommissionError) {
      console.error('Erreur traitement commissions remboursement:', refundCommissionError);
    }

    // Envoyer un email de remboursement
    await sendRefundEmail(payment, charge.refunds.data[0]?.amount);

    console.log('Refund processed successfully:', charge.id);
  } catch (error) {
    console.error('Error in handleChargeRefunded:', error);
  }
}

// Gérer un paiement de facture réussi (abonnements/packs)
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log('Invoice payment succeeded:', invoice.id);
  
  try {
    // Trouver la transaction par subscription_id
    const { data: transaction, error: fetchError } = await supabase
      .from('transactions')
      .select('*')
      .eq('stripe_subscription_id', invoice.subscription)
      .single();

    if (fetchError || !transaction) {
      console.error('Transaction not found for subscription:', invoice.subscription);
      return;
    }

    // Mettre à jour le statut de la transaction
    const { error: updateError } = await supabase
      .from('transactions')
      .update({
        status: 'completed',
        updated_at: new Date().toISOString(),
        metadata: {
          ...transaction.metadata,
          stripe_event: 'invoice.payment_succeeded',
          invoice_id: invoice.id,
          processed_at: new Date().toISOString()
        }
      })
      .eq('id', transaction.id);

    if (updateError) {
      console.error('Error updating transaction status:', updateError);
      return;
    }

    // Activer l'abonnement/pack pour l'utilisateur
    await activateUserPack(transaction.user_id, transaction.pack_id);

    // Envoyer un email de confirmation d'abonnement
    await sendSubscriptionConfirmationEmail(transaction);

    console.log('Subscription payment processed successfully:', invoice.id);
  } catch (error) {
    console.error('Error in handleInvoicePaymentSucceeded:', error);
  }
}

// Gérer un paiement de facture échoué (abonnements/packs)
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.log('Invoice payment failed:', invoice.id);
  
  try {
    // Trouver la transaction par subscription_id
    const { data: transaction, error: fetchError } = await supabase
      .from('transactions')
      .select('*')
      .eq('stripe_subscription_id', invoice.subscription)
      .single();

    if (fetchError || !transaction) {
      console.error('Transaction not found for subscription:', invoice.subscription);
      return;
    }

    // Mettre à jour le statut de la transaction
    const { error: updateError } = await supabase
      .from('transactions')
      .update({
        status: 'failed',
        updated_at: new Date().toISOString(),
        metadata: {
          ...transaction.metadata,
          stripe_event: 'invoice.payment_failed',
          invoice_id: invoice.id,
          failure_reason: invoice.last_finalization_error?.message || 'Payment failed',
          processed_at: new Date().toISOString()
        }
      })
      .eq('id', transaction.id);

    if (updateError) {
      console.error('Error updating transaction status:', updateError);
      return;
    }

    // Désactiver l'abonnement/pack pour l'utilisateur
    await deactivateUserPack(transaction.user_id, transaction.pack_id);

    // Envoyer un email d'échec d'abonnement
    await sendSubscriptionFailureEmail(transaction, invoice.last_finalization_error?.message);

    console.log('Subscription failure processed:', invoice.id);
  } catch (error) {
    console.error('Error in handleInvoicePaymentFailed:', error);
  }
}

// Fonctions utilitaires
async function createTransaction(payment: any, type: string) {
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
          processed_at: new Date().toISOString()
        },
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error creating transaction:', error);
    }
  } catch (error) {
    console.error('Error in createTransaction:', error);
  }
}

async function sendPaymentConfirmationEmail(payment: any) {
  try {
    const emailData = {
      userId: payment.user_id,
      amount: payment.amount,
      currency: payment.currency,
      paymentMethod: payment.payment_method,
      transactionId: payment.id
    };
    
    const emailSent = await emailService.sendPaymentConfirmation(payment.user_id, emailData);
    if (emailSent) {
      console.log('Email de confirmation envoyé pour le paiement:', payment.id);
    } else {
      console.log('Échec de l\'envoi de l\'email de confirmation pour:', payment.id);
    }
  } catch (error) {
    console.error('Error sending confirmation email:', error);
  }
}

async function sendPaymentFailureEmail(payment: any, errorMessage?: string) {
  try {
    const emailData = {
      userId: payment.user_id,
      amount: payment.amount,
      currency: payment.currency,
      paymentMethod: payment.payment_method,
      transactionId: payment.id
    };
    
    const emailSent = await emailService.sendPaymentFailure(payment.user_id, emailData);
    if (emailSent) {
      console.log('Email d\'échec envoyé pour le paiement:', payment.id);
    } else {
      console.log('Échec de l\'envoi de l\'email d\'échec pour:', payment.id);
    }
  } catch (error) {
    console.error('Error sending failure email:', error);
  }
}

async function sendRefundEmail(payment: any, refundAmount?: number) {
  try {
    const emailData = {
      userId: payment.user_id,
      amount: refundAmount || payment.amount,
      currency: payment.currency,
      paymentMethod: payment.payment_method,
      transactionId: payment.id
    };
    
    // Pour le remboursement, on envoie un email de confirmation avec un message spécial
    const emailSent = await emailService.sendPaymentConfirmation(payment.user_id, emailData);
    if (emailSent) {
      console.log('Email de remboursement envoyé pour le paiement:', payment.id);
    } else {
      console.log('Échec de l\'envoi de l\'email de remboursement pour:', payment.id);
    }
  } catch (error) {
    console.error('Error sending refund email:', error);
  }
}

// Fonctions pour gérer les abonnements/packs
async function activateUserPack(userId: string, packId: string) {
  try {
    // Activer le pack pour l'utilisateur
    const { error } = await supabase
      .from('user_packs')
      .upsert({
        user_id: userId,
        pack_id: packId,
        is_active: true,
        activated_at: new Date().toISOString(),
        expires_at: calculatePackExpiry(packId), // Calculer la date d'expiration
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,pack_id'
      });

    if (error) {
      console.error('Error activating user pack:', error);
      return;
    }

    console.log('User pack activated:', userId, packId);
  } catch (error) {
    console.error('Error in activateUserPack:', error);
  }
}

async function deactivateUserPack(userId: string, packId: string) {
  try {
    // Désactiver le pack pour l'utilisateur
    const { error } = await supabase
      .from('user_packs')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('pack_id', packId);

    if (error) {
      console.error('Error deactivating user pack:', error);
      return;
    }

    console.log('User pack deactivated:', userId, packId);
  } catch (error) {
    console.error('Error in deactivateUserPack:', error);
  }
}

function calculatePackExpiry(packId: string): string {
  // Logique pour calculer la date d'expiration basée sur le type de pack
  const now = new Date();
  
  // Exemple : ajouter 30 jours pour un pack mensuel
  // Cette logique peut être améliorée avec des données réelles de la table packs
  now.setDate(now.getDate() + 30);
  
  return now.toISOString();
}

async function sendSubscriptionConfirmationEmail(transaction: any) {
  try {
    // Récupérer les détails du pack pour l'email
    const { data: pack } = await supabase
      .from('packs')
      .select('name, price')
      .eq('id', transaction.pack_id)
      .single();
    
    const emailData = {
      userId: transaction.user_id,
      amount: transaction.amount,
      currency: transaction.currency,
      paymentMethod: transaction.payment_method,
      transactionId: transaction.id,
      packName: pack?.name,
      packPrice: pack?.price
    };
    
    const emailSent = await emailService.sendPaymentConfirmation(transaction.user_id, emailData);
    if (emailSent) {
      console.log('Email de confirmation d\'abonnement envoyé pour:', transaction.id);
    } else {
      console.log('Échec de l\'envoi de l\'email d\'abonnement pour:', transaction.id);
    }
  } catch (error) {
    console.error('Error sending subscription confirmation email:', error);
  }
}

async function sendSubscriptionFailureEmail(transaction: any, errorMessage?: string) {
  try {
    // Récupérer les détails du pack pour l'email
    const { data: pack } = await supabase
      .from('packs')
      .select('name, price')
      .eq('id', transaction.pack_id)
      .single();
    
    const emailData = {
      userId: transaction.user_id,
      amount: transaction.amount,
      currency: transaction.currency,
      paymentMethod: transaction.payment_method,
      transactionId: transaction.id,
      packName: pack?.name,
      packPrice: pack?.price
    };
    
    const emailSent = await emailService.sendPaymentFailure(transaction.user_id, emailData);
    if (emailSent) {
      console.log('Email d\'échec d\'abonnement envoyé pour:', transaction.id);
    } else {
      console.log('Échec de l\'envoi de l\'email d\'échec d\'abonnement pour:', transaction.id);
    }
  } catch (error) {
    console.error('Error sending subscription failure email:', error);
  }
}

// Gérer la complétion d'une session de checkout
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  console.log('Checkout session completed:', session.id);
  
  try {
    // Si c'est un paiement réussi pour un abonnement
    if (session.subscription && session.client_reference_id) {
      // Extraire les informations du client_reference_id
      const [userId, packId] = session.client_reference_id.split('_');
      
      // Créer ou mettre à jour la transaction
      const { error } = await supabase
        .from('transactions')
        .upsert({
          user_id: userId,
          pack_id: packId,
          stripe_session_id: session.id,
          stripe_subscription_id: session.subscription as string,
          amount: session.amount_total || 0,
          currency: session.currency || 'xof',
          payment_method: 'stripe',
          status: 'pending', // En attente du premier paiement
          metadata: {
            checkout_session_id: session.id,
            customer_email: session.customer_details?.email,
            created_at: new Date().toISOString()
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'stripe_session_id'
        });

      if (error) {
        console.error('Error creating/updating transaction:', error);
        return;
      }

      console.log('Checkout session transaction created:', session.id);
    }
  } catch (error) {
    console.error('Error in handleCheckoutSessionCompleted:', error);
  }
}

// Gérer la création d'un abonnement
async function handleCustomerSubscriptionCreated(subscription: Stripe.Subscription) {
  console.log('Customer subscription created:', subscription.id);
  
  try {
    // Rien à faire ici, on attend le premier paiement réussi via invoice.payment_succeeded
    console.log('Subscription created, waiting for first payment:', subscription.id);
  } catch (error) {
    console.error('Error in handleCustomerSubscriptionCreated:', error);
  }
}

// Gérer la mise à jour d'un abonnement
async function handleCustomerSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log('Customer subscription updated:', subscription.id);
  
  try {
    // Mettre à jour la transaction avec le nouvel état
    const { error } = await supabase
      .from('transactions')
      .update({
        status: mapSubscriptionStatus(subscription.status),
        updated_at: new Date().toISOString(),
        metadata: {
          current_period_start: subscription.current_period_start,
          current_period_end: subscription.current_period_end,
          stripe_event: 'customer.subscription.updated',
          processed_at: new Date().toISOString()
        }
      })
      .eq('stripe_subscription_id', subscription.id);

    if (error) {
      console.error('Error updating subscription transaction:', error);
      return;
    }

    console.log('Subscription updated:', subscription.id);
  } catch (error) {
    console.error('Error in handleCustomerSubscriptionUpdated:', error);
  }
}

// Gérer l'annulation d'un abonnement
async function handleCustomerSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log('Customer subscription deleted:', subscription.id);
  
  try {
    // Désactiver la transaction et le pack utilisateur
    const { data: transaction, error: fetchError } = await supabase
      .from('transactions')
      .select('*')
      .eq('stripe_subscription_id', subscription.id)
      .single();

    if (fetchError || !transaction) {
      console.error('Transaction not found for subscription:', subscription.id);
      return;
    }

    // Mettre à jour la transaction
    const { error: updateError } = await supabase
      .from('transactions')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
        metadata: {
          ...transaction.metadata,
          stripe_event: 'customer.subscription.deleted',
          cancelled_at: new Date().toISOString(),
          processed_at: new Date().toISOString()
        }
      })
      .eq('id', transaction.id);

    if (updateError) {
      console.error('Error updating transaction status:', updateError);
      return;
    }

    // Désactiver le pack utilisateur
    await deactivateUserPack(transaction.user_id, transaction.pack_id);

    console.log('Subscription cancelled:', subscription.id);
  } catch (error) {
    console.error('Error in handleCustomerSubscriptionDeleted:', error);
  }
}

// Fonction utilitaire pour mapper le statut Stripe au statut de transaction
function mapSubscriptionStatus(stripeStatus: string): string {
  switch (stripeStatus) {
    case 'active':
      return 'active';
    case 'past_due':
      return 'past_due';
    case 'unpaid':
      return 'unpaid';
    case 'canceled':
      return 'cancelled';
    case 'incomplete':
      return 'incomplete';
    case 'incomplete_expired':
      return 'incomplete_expired';
    default:
      return 'unknown';
  }
}

export default router;