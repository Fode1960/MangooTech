import express from 'express';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { emailService } from '../services/emailService';

const router = express.Router();

// Configuration PayPal
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
const PAYPAL_ENVIRONMENT = process.env.PAYPAL_ENVIRONMENT || 'sandbox';

// URL de l'API PayPal
const PAYPAL_API_URL = PAYPAL_ENVIRONMENT === 'sandbox' 
  ? 'https://api.sandbox.paypal.com' 
  : 'https://api.paypal.com';

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'YOUR_SUPABASE_SERVICE_ROLE_KEY';
const supabase = createClient(supabaseUrl, supabaseKey);

// Types
interface PayPalPaymentRequest {
  userId: string;
  amount: number;
  currency: string;
  packId?: string;
  packName?: string;
  packPrice?: number;
  description: string;
  returnUrl: string;
  cancelUrl: string;
}

interface PayPalWebhookEvent {
  event_type: string;
  resource: {
    id: string;
    status: string;
    amount?: {
      total: string;
      currency: string;
    };
    custom_id?: string;
    payer?: {
      email_address: string;
    };
  };
}

/**
 * Obtenir un token d'accès PayPal
 */
async function getPayPalAccessToken() {
  try {
    const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
    
    const response = await fetch(`${PAYPAL_API_URL}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials'
    });

    if (!response.ok) {
      throw new Error(`Erreur PayPal auth: ${response.status}`);
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('Erreur lors de l\'obtention du token PayPal:', error);
    throw error;
  }
}

/**
 * Créer une commande PayPal
 */
router.post('/create-order', async (req, res) => {
  try {
    const {
      user_id,
      amount,
      currency,
      pack_id,
      pack_name,
      pack_price,
      description,
      return_url,
      cancel_url
    } = req.body;

    console.log('Requête PayPal reçue:', { user_id, amount, currency, pack_id, description });

    // Validation de la configuration PayPal
    if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
      console.error('Configuration PayPal manquante');
      return res.status(500).json({ 
        success: false, 
        error: 'Configuration PayPal invalide',
        details: 'Clés PayPal non configurées'
      });
    }

    // Validation des données requises
    if (!user_id || !amount || !currency) {
      return res.status(400).json({ 
        success: false, 
        error: 'Données manquantes',
        details: 'user_id, amount et currency sont requis'
      });
    }

    // Calculer les frais de traitement PayPal (2.9% + 0.30 USD)
    const processingFee = (amount * 0.029) + 0.30;
    const totalAmount = amount + processingFee;

    // Obtenir le token d'accès
    let accessToken;
    try {
      accessToken = await getPayPalAccessToken();
    } catch (authError) {
      console.error('Erreur d\'authentification PayPal:', authError);
      return res.status(500).json({ 
        success: false, 
        error: 'Erreur d\'authentification PayPal',
        details: authError.message
      });
    }

    // Créer la commande PayPal
    const orderData = {
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: currency.toUpperCase(),
          value: totalAmount.toFixed(2),
          breakdown: {
            item_total: {
              currency_code: currency.toUpperCase(),
              value: amount.toFixed(2)
            },
            handling: {
              currency_code: currency.toUpperCase(),
              value: processingFee.toFixed(2)
            }
          }
        },
        description: description || 'Achat sur MangooTech',
        custom_id: `${user_id}_${Date.now()}`,
        reference_id: `PACK_${pack_id || 'GENERAL'}_${Date.now()}`,
        items: [{
          name: pack_name || 'Achat MangooTech',
          unit_amount: {
            currency_code: currency.toUpperCase(),
            value: amount.toFixed(2)
          },
          quantity: '1',
          category: 'DIGITAL_GOODS'
        }]
      }],
      application_context: {
        brand_name: 'MangooTech',
        landing_page: 'BILLING',
        user_action: 'PAY_NOW',
        return_url: return_url || `${req.headers.origin || 'http://localhost:3002'}/payment/success`,
        cancel_url: cancel_url || `${req.headers.origin || 'http://localhost:3002'}/payment/cancel`,
        payment_method: {
          payer_selected: 'PAYPAL',
          payee_preferred: 'IMMEDIATE_PAYMENT_REQUIRED'
        }
      }
    };

    // Générer un ID de requête unique
    const requestId = `ORDER_${Date.now()}_${user_id}_${Math.random().toString(36).substr(2, 9)}`;

    console.log('Création commande PayPal avec données:', JSON.stringify(orderData, null, 2));

    const response = await fetch(`${PAYPAL_API_URL}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'PayPal-Request-Id': requestId
      },
      body: JSON.stringify(orderData)
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Erreur API PayPal:', response.status, errorData);
      return res.status(500).json({ 
        success: false, 
        error: 'Erreur lors de la création de la commande PayPal',
        details: errorData
      });
    }

    let paypalOrder;
    try {
      paypalOrder = await response.json();
    } catch (jsonError) {
      console.error('Erreur parsing JSON PayPal:', jsonError);
      return res.status(500).json({ 
        success: false, 
        error: 'Réponse invalide de PayPal'
      });
    }

    console.log('Commande PayPal créée:', paypalOrder);

    // Vérifier que l'ID de commande est présent
    if (!paypalOrder.id) {
      console.error('ID de commande PayPal manquant:', paypalOrder);
      return res.status(500).json({ 
        success: false, 
        error: 'ID de commande PayPal manquant'
      });
    }

    // Créer l'enregistrement dans la base de données (table payments)
    const amountInCents = Math.round(amount * 100);
    const processingFeeCents = Math.round(processingFee * 100);
    const netAmountCents = amountInCents - processingFeeCents;

    const paymentData: any = {
      user_id: user_id,
      amount: amountInCents,
      currency: currency.toUpperCase(),
      payment_method: 'paypal',
      status: 'pending',
      paypal_order_id: paypalOrder.id,
      processing_fee: processingFeeCents,
      net_amount: netAmountCents,
      metadata: {
        pack_id: pack_id,
        pack_name: pack_name,
        pack_price: pack_price,
        total_amount: totalAmount,
        created_via: 'api',
        gateway: 'paypal'
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: paymentRecord, error: dbError } = await supabase
      .from('payments')
      .insert(paymentData)
      .select()
      .single();

    if (dbError) {
      console.error('Erreur base de données PayPal:', dbError);
      return res.status(500).json({ 
        success: false, 
        error: 'Erreur lors de la création du paiement dans la base de données',
        details: dbError.message
      });
    }

    // Trouver l'URL d'approbation
    const approvalUrl = paypalOrder.links?.find(link => link.rel === 'approve')?.href;
    
    if (!approvalUrl) {
      console.error('URL d\'approbation PayPal manquante:', paypalOrder.links);
    }

    res.json({
      success: true,
      orderId: paypalOrder.id,
      paymentId: paymentRecord.id,
      approvalUrl: approvalUrl,
      totalAmount: totalAmount,
      processingFee: processingFee,
      paypalOrder: paypalOrder
    });

  } catch (error) {
    console.error('Erreur lors de la création de la commande PayPal:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la création de la commande',
      details: error.message
    });
  }
});

/**
 * Capturer un paiement PayPal
 */
router.post('/capture-payment', async (req, res) => {
  try {
    const { orderId, paymentId } = req.body;

    if (!orderId || !paymentId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Order ID et Payment ID requis' 
      });
    }

    // Récupérer les détails du paiement
    const { data: payment, error: fetchError } = await supabase
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .single();

    if (fetchError || !payment) {
      return res.status(404).json({ 
        success: false, 
        error: 'Paiement non trouvé' 
      });
    }

    // Obtenir le token d'accès
    const accessToken = await getPayPalAccessToken();

    // Capturer le paiement via l'API PayPal
    const captureResponse = await fetch(`${PAYPAL_API_URL}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'PayPal-Request-Id': `CAPTURE_${Date.now()}_${payment.user_id}`
      }
    });

    if (!captureResponse.ok) {
      const errorData = await captureResponse.text();
      console.error('Erreur capture PayPal:', captureResponse.status, errorData);
      throw new Error(`Erreur capture PayPal: ${captureResponse.status} - ${errorData}`);
    }

    const captureData = await captureResponse.json();

    // Vérifier que la capture a réussi
    if (captureData.status !== 'COMPLETED') {
      throw new Error(`Statut de capture inattendu: ${captureData.status}`);
    }

    // Mettre à jour le statut du paiement
    const captureId = captureData.purchase_units[0]?.payments?.captures[0]?.id;

    const { error: updateError } = await supabase
      .from('payments')
      .update({
        status: 'succeeded',
        updated_at: new Date().toISOString(),
        metadata: {
          ...payment.metadata,
          paypal_event: 'order.capture',
          paypal_capture: captureData,
          capture_id: captureId
        }
      })
      .eq('id', paymentId);

    if (updateError) {
      console.error('Erreur lors de la mise à jour du paiement:', updateError);
      return res.status(500).json({ 
        success: false, 
        error: 'Erreur lors de la mise à jour du paiement' 
      });
    }

    // Si c'est un paiement d'abonnement, activer le pack
    if (payment.pack_id) {
      await activateUserPack(payment.user_id, payment.pack_id);
    }

    // Envoyer un email de confirmation
    await sendPayPalConfirmationEmail(payment);

    res.json({
      success: true,
      capture: captureData,
      payment: {
        id: paymentId,
        status: 'completed',
        amount: payment.total_amount,
        currency: payment.currency
      }
    });

  } catch (error) {
    console.error('Erreur lors de la capture du paiement:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la capture du paiement',
      details: error.message
    });
  }
});

/**
 * Webhook PayPal pour les notifications de paiement
 */
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    // Validation de la signature PayPal
    const transmissionId = req.headers['paypal-transmission-id'] as string;
    const timeStamp = req.headers['paypal-cert-url'] as string;
    const authAlgo = req.headers['paypal-auth-algo'] as string;
    const transmissionSig = req.headers['paypal-transmission-sig'] as string;
    const webhookId = process.env.PAYPAL_WEBHOOK_ID;

    if (!transmissionId || !timeStamp || !authAlgo || !transmissionSig || !webhookId) {
      console.error('Headers PayPal manquants pour la validation');
      return res.status(401).send('Unauthorized');
    }

    // Créer la chaîne de validation
    const expectedSignature = `${transmissionId}|${timeStamp}|${webhookId}|${crypto.createHash('sha256').update(req.body).digest('hex')}`;
    
    // Note: Dans une implémentation réelle, vous devriez:
    // 1. Télécharger le certificat PayPal depuis l'URL fournie
    // 2. Vérifier la signature avec la clé publique
    // 3. Pour l'instant, on logue simplement les informations
    
    console.log('Validation webhook PayPal - Transmission ID:', transmissionId);
    console.log('Validation webhook PayPal - Auth Algo:', authAlgo);
    console.log('Validation webhook PayPal - Signature attendue:', expectedSignature.substring(0, 50) + '...');
    
    const event: PayPalWebhookEvent = req.body;
    
    console.log('Webhook PayPal reçu:', event.event_type);

    switch (event.event_type) {
      case 'PAYMENT.CAPTURE.COMPLETED':
        await handlePaymentCaptureCompleted(event);
        break;
      
      case 'PAYMENT.CAPTURE.DENIED':
        await handlePaymentCaptureDenied(event);
        break;
      
      case 'CHECKOUT.ORDER.APPROVED':
        await handleOrderApproved(event);
        break;
      
      case 'CHECKOUT.ORDER.CANCELLED':
        await handleOrderCancelled(event);
        break;
      
      default:
        console.log('Événement PayPal non géré:', event.event_type);
    }

    res.status(200).send('OK');

  } catch (error) {
    console.error('Erreur lors du traitement du webhook PayPal:', error);
    res.status(500).send('Erreur interne');
  }
});

/**
 * Fonctions auxiliaires pour le traitement des webhooks
 */
async function handlePaymentCaptureCompleted(event: PayPalWebhookEvent) {
  const captureId = event.resource.id;
  const amount = event.resource.amount;
  const customId = event.resource.custom_id;
  
  console.log('Paiement capturé:', captureId, 'Montant:', amount);

  // Mettre à jour le statut du paiement dans la base de données
  if (customId) {
    const paymentId = customId.split('_')[0];
    
    // Récupérer les détails du paiement avant la mise à jour
    const { data: payment, error: fetchError } = await supabase
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .single();

    if (fetchError || !payment) {
      console.error('Paiement non trouvé pour le webhook:', paymentId);
      return;
    }

    // Mettre à jour le statut du paiement
    const { error } = await supabase
      .from('payments')
      .update({
        status: 'succeeded',
        updated_at: new Date().toISOString(),
        metadata: {
          ...payment.metadata,
          paypal_event: 'webhook.capture.completed',
          gateway_response: event.resource
        }
      })
      .eq('id', paymentId);

    if (error) {
      console.error('Erreur lors de la mise à jour du paiement:', error);
      return;
    }

    // Envoyer un email de confirmation
    await sendPayPalConfirmationEmail(payment);
  }
}

async function handlePaymentCaptureDenied(event: PayPalWebhookEvent) {
  const captureId = event.resource.id;
  const customId = event.resource.custom_id;
  
  console.log('Paiement refusé:', captureId);

  if (customId) {
    const paymentId = customId.split('_')[0];
    
    // Récupérer les détails du paiement avant la mise à jour
    const { data: payment, error: fetchError } = await supabase
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .single();

    if (fetchError || !payment) {
      console.error('Paiement non trouvé pour le webhook:', paymentId);
      return;
    }

    const { error } = await supabase
      .from('payments')
      .update({
        status: 'failed',
        updated_at: new Date().toISOString(),
        failure_reason: 'paypal_capture_denied',
        metadata: {
          ...payment.metadata,
          paypal_event: 'webhook.capture.denied',
          gateway_response: event.resource
        }
      })
      .eq('id', paymentId);

    if (error) {
      console.error('Erreur lors de la mise à jour du paiement:', error);
      return;
    }

    // Envoyer un email d'échec
    await sendPayPalFailureEmail(payment);
  }
}

async function handleOrderApproved(event: PayPalWebhookEvent) {
  const orderId = event.resource.id;
  console.log('Commande approuvée:', orderId);
  // Logique supplémentaire si nécessaire
}

async function handleOrderCancelled(event: PayPalWebhookEvent) {
  const orderId = event.resource.id;
  console.log('Commande annulée:', orderId);
  // Logique supplémentaire si nécessaire
}

/**
 * Activer un pack pour un utilisateur
 */
async function activateUserPack(userId: string, packId: string) {
  try {
    // Vérifier si l'utilisateur a déjà ce pack actif
    const { data: existingPack } = await supabase
      .from('user_packs')
      .select('*')
      .eq('user_id', userId)
      .eq('pack_id', packId)
      .eq('status', 'active')
      .single();

    if (existingPack) {
      console.log('Pack déjà actif pour cet utilisateur');
      return;
    }

    // Obtenir les détails du pack
    const { data: pack } = await supabase
      .from('packs')
      .select('*')
      .eq('id', packId)
      .single();

    if (!pack) {
      console.error('Pack non trouvé:', packId);
      return;
    }

    // Calculer la date d'expiration
    const startDate = new Date();
    const endDate = new Date();
    
    if (pack.duration_type === 'monthly') {
      endDate.setMonth(endDate.getMonth() + pack.duration_value);
    } else if (pack.duration_type === 'yearly') {
      endDate.setFullYear(endDate.getFullYear() + pack.duration_value);
    }

    // Créer l'abonnement
    const { error } = await supabase
      .from('user_packs')
      .insert({
        user_id: userId,
        pack_id: packId,
        status: 'active',
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('Erreur lors de l\'activation du pack:', error);
    } else {
      console.log('Pack activé avec succès pour l\'utilisateur:', userId);
    }

  } catch (error) {
    console.error('Erreur lors de l\'activation du pack:', error);
  }
}

/**
 * Obtenir l'historique des paiements PayPal d'un utilisateur
 */
router.get('/history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const { data: payments, error } = await supabase
      .from('payments')
      .select('*')
      .eq('user_id', userId)
      .eq('payment_method', 'paypal')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur lors de la récupération de l\'historique:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Erreur lors de la récupération de l\'historique' 
      });
    }

    res.json({
      success: true,
      payments: payments || []
    });

  } catch (error) {
    console.error('Erreur lors de la récupération de l\'historique:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur interne' 
    });
  }
});

/**
 * Fonctions d'envoi d'emails pour PayPal
 */
async function sendPayPalConfirmationEmail(payment: any) {
  try {
    const emailData = {
      userId: payment.user_id,
      amount: payment.amount,
      currency: payment.currency,
      paymentMethod: 'paypal',
      transactionId: payment.id,
      packName: payment.pack_name,
      packPrice: payment.pack_price
    };
    
    const emailSent = await emailService.sendPaymentConfirmation(payment.user_id, emailData);
    if (emailSent) {
      console.log('Email de confirmation PayPal envoyé pour le paiement:', payment.id);
    } else {
      console.log('Échec de l\'envoi de l\'email de confirmation PayPal pour:', payment.id);
    }
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email de confirmation PayPal:', error);
  }
}

async function sendPayPalFailureEmail(payment: any, errorMessage?: string) {
  try {
    const emailData = {
      userId: payment.user_id,
      amount: payment.amount,
      currency: payment.currency,
      paymentMethod: 'paypal',
      transactionId: payment.id,
      packName: payment.pack_name,
      packPrice: payment.pack_price
    };
    
    const emailSent = await emailService.sendPaymentFailure(payment.user_id, emailData);
    if (emailSent) {
      console.log('Email d\'échec PayPal envoyé pour le paiement:', payment.id);
    } else {
      console.log('Échec de l\'envoi de l\'email d\'échec PayPal pour:', payment.id);
    }
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email d\'échec PayPal:', error);
  }
}

/**
 * Vérifier la configuration PayPal
 */
router.get('/config-check', async (req, res) => {
  try {
    const configStatus = {
      clientId: !!PAYPAL_CLIENT_ID,
      clientSecret: !!PAYPAL_CLIENT_SECRET,
      environment: PAYPAL_ENVIRONMENT,
      apiUrl: PAYPAL_API_URL
    };

    // Tester l'authentification PayPal
    let authStatus = 'error';
    try {
      const accessToken = await getPayPalAccessToken();
      authStatus = 'ok';
    } catch (error) {
      console.error('Erreur lors du test d\'authentification PayPal:', error);
      authStatus = 'error';
    }

    res.json({
      status: authStatus,
      config: configStatus,
      message: authStatus === 'ok' ? 'PayPal configuré correctement' : 'Erreur de configuration PayPal'
    });

  } catch (error) {
    console.error('Erreur lors de la vérification de la configuration PayPal:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'Erreur lors de la vérification de la configuration'
    });
  }
});

export default router;