import { Router } from 'express';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const router = Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
});

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Créer une session de checkout pour un abonnement
router.post('/create-checkout-session', async (req, res) => {
  try {
    const { userId, packId, packName, packPrice, currency = 'xof' } = req.body;

    if (!userId || !packId || !packName || !packPrice) {
      return res.status(400).json({ 
        error: 'Missing required parameters: userId, packId, packName, packPrice' 
      });
    }

    // Récupérer les informations de l'utilisateur
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('email, full_name')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Convertir le prix en cents pour Stripe
    const amountInCents = Math.round(packPrice * 100);

    // Créer la session de checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
      {
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: packName,
              description: `Abonnement ${packName} - Plateforme MangooTech`,
            },
            unit_amount: amountInCents,
            recurring: {
              interval: 'month', // Peut être rendu dynamique selon le pack
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/payment/cancel`,
      customer_email: user.email,
      client_reference_id: `${userId}_${packId}`, // Format: userId_packId
      metadata: {
        userId: userId,
        packId: packId,
        packName: packName,
      },
    });

    // Enregistrer la session dans la base de données
    const { error: sessionError } = await supabase
      .from('payment_sessions')
      .insert({
        session_id: session.id,
        user_id: userId,
        pack_id: packId,
        amount: amountInCents,
        currency: currency.toUpperCase(),
        status: 'open',
        payment_method: 'stripe',
        metadata: {
          pack_name: packName,
          created_at: new Date().toISOString(),
        },
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24h
      });

    if (sessionError) {
      console.error('Error saving session to database:', sessionError);
      // Ne pas échouer la requête, le webhook gérera la sauvegarde
    }

    res.json({
      sessionId: session.id,
      sessionUrl: session.url,
    });
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ 
      error: 'Failed to create checkout session',
      details: error.message 
    });
  }
});

// Récupérer le statut d'une session
router.get('/session-status/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    // Récupérer la session depuis Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // Récupérer les informations depuis la base de données
    const { data: sessionData, error: dbError } = await supabase
      .from('payment_sessions')
      .select('*')
      .eq('session_id', sessionId)
      .single();

    if (dbError) {
      console.error('Error fetching session from database:', dbError);
    }

    res.json({
      session: {
        id: session.id,
        status: session.payment_status,
        customer_email: session.customer_details?.email,
        subscription_id: session.subscription,
      },
      database: sessionData,
    });
  } catch (error: any) {
    console.error('Error retrieving session status:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve session status',
      details: error.message 
    });
  }
});

// Gérer l'annulation d'un abonnement
router.post('/cancel-subscription', async (req, res) => {
  try {
    const { subscriptionId } = req.body;

    if (!subscriptionId) {
      return res.status(400).json({ error: 'Subscription ID is required' });
    }

    // Annuler l'abonnement dans Stripe
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });

    // Mettre à jour la base de données
    const { error } = await supabase
      .from('transactions')
      .update({
        status: 'cancelling',
        updated_at: new Date().toISOString(),
        metadata: {
          cancel_at_period_end: true,
          cancelled_at: new Date().toISOString(),
        },
      })
      .eq('stripe_subscription_id', subscriptionId);

    if (error) {
      console.error('Error updating transaction:', error);
      return res.status(500).json({ error: 'Failed to update database' });
    }

    res.json({
      message: 'Subscription cancelled successfully',
      subscription: {
        id: subscription.id,
        status: subscription.status,
        cancel_at_period_end: subscription.cancel_at_period_end,
        current_period_end: subscription.current_period_end,
      },
    });
  } catch (error: any) {
    console.error('Error cancelling subscription:', error);
    res.status(500).json({ 
      error: 'Failed to cancel subscription',
      details: error.message 
    });
  }
});

// Récupérer les abonnements d'un utilisateur
router.get('/user-subscriptions/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const { data: transactions, error } = await supabase
      .from('transactions')
      .select(`
        *,
        packs (
          id,
          name,
          description,
          price,
          duration_days,
          features
        )
      `)
      .eq('user_id', userId)
      .in('status', ['active', 'completed', 'past_due', 'unpaid'])
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user subscriptions:', error);
      return res.status(500).json({ error: 'Failed to fetch subscriptions' });
    }

    res.json({
      subscriptions: transactions,
    });
  } catch (error: any) {
    console.error('Error retrieving user subscriptions:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve subscriptions',
      details: error.message 
    });
  }
});

export default router;