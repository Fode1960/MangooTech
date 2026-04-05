import { Router } from 'express';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { BOOST_PRODUCTS, getBoostProduct, numberToSponsoredTierLabel, type BoostKind } from '../config/boostPricing';

const router = Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
});

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

function toStripeUnitAmount(amountXof: number, currency: string): number {
  const c = String(currency || 'xof').toLowerCase();
  const zeroDecimal = new Set(['xof', 'xaf', 'jpy', 'krw', 'vnd']);
  if (zeroDecimal.has(c)) return Math.round(amountXof);
  return Math.round(amountXof * 100);
}

async function authenticateUser(req: any, res: any): Promise<{ user: any } | null> {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    res.status(401).json({ error: 'Token manquant' });
    return null;
  }

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    res.status(401).json({ error: 'Token invalide' });
    return null;
  }

  return { user };
}

router.get('/pricing', (_req, res) => {
  res.json({ products: BOOST_PRODUCTS });
});

router.post('/create-checkout-session', async (req, res) => {
  try {
    const auth = await authenticateUser(req, res);
    if (!auth) return;

    const vendorId = String(req.body?.vendorId || '').trim();
    const vendorKind = String(req.body?.vendorKind || '').trim().toLowerCase();
    const boostKind = String(req.body?.boostKind || '').trim().toLowerCase() as BoostKind;
    const durationHours = Number(req.body?.durationHours);
    const currency = String(req.body?.currency || 'xof').trim().toLowerCase();

    if (!vendorId) return res.status(400).json({ error: 'vendorId manquant' });
    if (!vendorKind) return res.status(400).json({ error: 'vendorKind manquant' });
    if (boostKind !== 'sponsored' && boostKind !== 'promo' && boostKind !== 'new') {
      return res.status(400).json({ error: 'boostKind invalide' });
    }

    const product = getBoostProduct(boostKind, durationHours);
    if (!product) return res.status(400).json({ error: 'Produit boost introuvable (durée invalide)' });

    const orderId = crypto.randomUUID();
    const nowIso = new Date().toISOString();

    const { error: insertError } = await supabase
      .from('boost_orders')
      .insert({
        id: orderId,
        user_id: auth.user.id,
        vendor_id: vendorId,
        vendor_kind: vendorKind,
        boost_kind: boostKind,
        duration_hours: product.durationHours,
        amount_xof: product.priceXof,
        currency: currency.toUpperCase(),
        status: 'pending',
        sponsored_tier: boostKind === 'sponsored' ? numberToSponsoredTierLabel(product.sponsoredTier || null) : null,
        created_at: nowIso,
        updated_at: nowIso,
      });

    if (insertError) {
      return res.status(500).json({ error: 'Impossible de créer la commande boost', details: insertError.message });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency,
            product_data: {
              name: product.title,
              description: product.description,
            },
            unit_amount: toStripeUnitAmount(product.priceXof, currency),
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.FRONTEND_URL}/boost/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/boost/cancel?order_id=${orderId}`,
      client_reference_id: `boost_${orderId}`,
      customer_email: auth.user.email || undefined,
      metadata: {
        type: 'boost',
        boostOrderId: orderId,
        userId: auth.user.id,
        vendorId,
        vendorKind,
        boostKind,
        durationHours: String(product.durationHours),
      },
    });

    await supabase
      .from('boost_orders')
      .update({
        stripe_session_id: session.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    res.json({ orderId, sessionId: session.id, sessionUrl: session.url });
  } catch (error: any) {
    res.status(500).json({ error: 'Erreur serveur', details: error?.message || String(error) });
  }
});

export default router;

