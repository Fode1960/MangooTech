import { Router } from 'express';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { BOOST_PRODUCTS } from '../config/boostPricing';

const router = Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
});

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

type BoostKind = 'sponsored' | 'promo' | 'new';
type SponsoredTier = 'bronze' | 'argent' | 'or';

type DbBoostProduct = {
  id: string;
  kind: BoostKind;
  duration_hours: number;
  price_xof: number;
  currency: string;
  title: string;
  description: string;
  sponsored_tier: SponsoredTier | null;
  active: boolean;
};

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

function isBoostKind(value: unknown): value is BoostKind {
  return value === 'sponsored' || value === 'promo' || value === 'new';
}

function toSponsoredTier(value: unknown): SponsoredTier | null {
  if (value === 'bronze' || value === 'argent' || value === 'or') return value;
  return null;
}

async function fetchBoostProductsFromDb(): Promise<DbBoostProduct[] | null> {
  const { data, error } = await supabase
    .from('boost_products')
    .select('id, kind, duration_hours, price_xof, currency, title, description, sponsored_tier, active')
    .order('kind', { ascending: true })
    .order('duration_hours', { ascending: true });

  if (error || !data) return null;

  const rows = Array.isArray(data) ? data : [];
  const parsed: DbBoostProduct[] = [];
  for (const r of rows) {
    const kind = String((r as any).kind || '').trim().toLowerCase();
    if (!isBoostKind(kind)) continue;
    parsed.push({
      id: String((r as any).id),
      kind,
      duration_hours: Number((r as any).duration_hours),
      price_xof: Number((r as any).price_xof),
      currency: String((r as any).currency || 'XOF'),
      title: String((r as any).title || ''),
      description: String((r as any).description || ''),
      sponsored_tier: toSponsoredTier((r as any).sponsored_tier),
      active: Boolean((r as any).active),
    });
  }

  return parsed;
}

async function fetchBoostProductFromDb(boostKind: BoostKind, durationHours: number): Promise<DbBoostProduct | null> {
  const { data, error } = await supabase
    .from('boost_products')
    .select('id, kind, duration_hours, price_xof, currency, title, description, sponsored_tier, active')
    .eq('kind', boostKind)
    .eq('duration_hours', durationHours)
    .maybeSingle();

  if (error || !data) return null;

  const kind = String((data as any).kind || '').trim().toLowerCase();
  if (!isBoostKind(kind)) return null;

  return {
    id: String((data as any).id),
    kind,
    duration_hours: Number((data as any).duration_hours),
    price_xof: Number((data as any).price_xof),
    currency: String((data as any).currency || 'XOF'),
    title: String((data as any).title || ''),
    description: String((data as any).description || ''),
    sponsored_tier: toSponsoredTier((data as any).sponsored_tier),
    active: Boolean((data as any).active),
  };
}

async function getUserCreditBalanceXof(userId: string): Promise<number> {
  const now = new Date();
  const { data, error } = await supabase
    .from('user_credits')
    .select('amount, expires_at, used_at')
    .eq('user_id', userId);

  if (error || !data) return 0;
  const rows = Array.isArray(data) ? data : [];
  let sum = 0;
  for (const r of rows) {
    const usedAt = (r as any).used_at;
    if (usedAt) continue;
    const expiresAt = (r as any).expires_at;
    if (expiresAt) {
      const d = new Date(String(expiresAt));
      if (!Number.isNaN(d.getTime()) && d.getTime() <= now.getTime()) continue;
    }
    sum += Number((r as any).amount || 0);
  }
  return Math.floor(sum);
}

async function activateBoostForOrder(params: {
  order: any;
  boostKind: BoostKind;
  durationHours: number;
  sponsoredTier: SponsoredTier | null;
}): Promise<{ expiresAt: string | null } | null> {
  const { order, boostKind, durationHours, sponsoredTier } = params;
  const now = new Date();

  const { data: current } = await supabase
    .from('vendor_boosts')
    .select('*')
    .eq('vendor_id', String(order.vendor_id))
    .eq('vendor_kind', String(order.vendor_kind))
    .maybeSingle();

  const baseUntil = (iso: any) => {
    const d = iso ? new Date(String(iso)) : null;
    if (!d || Number.isNaN(d.getTime())) return now;
    return d.getTime() > now.getTime() ? d : now;
  };

  const addHours = (d: Date, hours: number) => new Date(d.getTime() + hours * 60 * 60 * 1000);

  const patch: any = {
    vendor_id: String(order.vendor_id),
    vendor_kind: String(order.vendor_kind),
    updated_at: new Date().toISOString(),
  };

  let expiresAt: Date | null = null;
  if (boostKind === 'sponsored') {
    const start = baseUntil(current?.sponsored_until);
    expiresAt = addHours(start, durationHours);
    patch.sponsored_until = expiresAt.toISOString();
    patch.sponsored_tier = sponsoredTier;
  } else if (boostKind === 'promo') {
    const start = baseUntil(current?.promo_until);
    expiresAt = addHours(start, durationHours);
    patch.promo_until = expiresAt.toISOString();
  } else if (boostKind === 'new') {
    const start = baseUntil(current?.new_until);
    expiresAt = addHours(start, durationHours);
    patch.new_until = expiresAt.toISOString();
  }

  await supabase
    .from('vendor_boosts')
    .upsert(patch, { onConflict: 'vendor_id,vendor_kind' });

  await supabase
    .from('boost_orders')
    .update({
      status: 'active',
      activated_at: new Date().toISOString(),
      expires_at: expiresAt ? expiresAt.toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', String(order.id));

  return { expiresAt: expiresAt ? expiresAt.toISOString() : null };
}

router.get('/pricing', (_req, res) => {
  fetchBoostProductsFromDb()
    .then((rows) => {
      if (!rows) return res.json({ products: BOOST_PRODUCTS });
      const products = rows
        .filter((p) => p.active)
        .map((p) => ({
          kind: p.kind,
          durationHours: p.duration_hours,
          priceXof: p.price_xof,
          currency: String(p.currency || 'XOF').toUpperCase(),
          title: p.title,
          description: p.description,
          sponsoredTier: p.kind === 'sponsored' ? (p.sponsored_tier === 'or' ? 3 : p.sponsored_tier === 'argent' ? 2 : 1) : null,
          active: p.active,
        }));
      res.json({ products });
    })
    .catch(() => res.json({ products: BOOST_PRODUCTS }));
});

router.get('/credits-balance', async (req, res) => {
  try {
    const auth = await authenticateUser(req, res);
    if (!auth) return;
    const balanceXof = await getUserCreditBalanceXof(auth.user.id);
    res.json({ balanceXof });
  } catch (error: any) {
    res.status(500).json({ error: 'Erreur serveur', details: error?.message || String(error) });
  }
});

router.get('/my-orders', async (req, res) => {
  try {
    const auth = await authenticateUser(req, res);
    if (!auth) return;

    const vendorId = String(req.query?.vendorId || '').trim();
    const vendorKind = String(req.query?.vendorKind || '').trim().toLowerCase();

    let q = supabase
      .from('boost_orders')
      .select('id, vendor_id, vendor_kind, boost_kind, duration_hours, amount_xof, currency, status, sponsored_tier, stripe_session_id, paid_at, activated_at, expires_at, created_at, updated_at')
      .eq('user_id', auth.user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (vendorId) q = q.eq('vendor_id', vendorId);
    if (vendorKind) q = q.eq('vendor_kind', vendorKind);

    const { data, error } = await q;
    if (error) return res.status(500).json({ error: 'Erreur lecture commandes', details: error.message });
    res.json({ orders: data || [] });
  } catch (error: any) {
    res.status(500).json({ error: 'Erreur serveur', details: error?.message || String(error) });
  }
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

    const dbProduct = await fetchBoostProductFromDb(boostKind, durationHours);
    if (!dbProduct || !dbProduct.active) {
      return res.status(400).json({ error: 'Produit boost introuvable (durée invalide ou inactif)' });
    }

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
        duration_hours: dbProduct.duration_hours,
        amount_xof: dbProduct.price_xof,
        currency: currency.toUpperCase(),
        status: 'pending',
        sponsored_tier: boostKind === 'sponsored' ? dbProduct.sponsored_tier : null,
        created_at: nowIso,
        updated_at: nowIso,
      });

    if (insertError) {
      return res.status(500).json({ error: 'Impossible de créer la commande boost', details: insertError.message });
    }

    const inferredOrigin = String(req.headers.origin || '').trim();
    const defaultFrontend = process.env.NODE_ENV === 'production' ? 'https://www.mangoo.tech' : 'http://localhost:5173';
    const frontendUrl = String(process.env.FRONTEND_URL || '').trim() || inferredOrigin || defaultFrontend;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency,
            product_data: {
              name: dbProduct.title,
              description: dbProduct.description,
            },
            unit_amount: toStripeUnitAmount(dbProduct.price_xof, currency),
          },
          quantity: 1,
        },
      ],
      success_url: `${frontendUrl.replace(/\/+$/g, '')}/boost/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendUrl.replace(/\/+$/g, '')}/boost/cancel?order_id=${orderId}`,
      client_reference_id: `boost_${orderId}`,
      customer_email: auth.user.email || undefined,
      metadata: {
        type: 'boost',
        boostOrderId: orderId,
        userId: auth.user.id,
        vendorId,
        vendorKind,
        boostKind,
        durationHours: String(dbProduct.duration_hours),
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

router.post('/purchase-with-credits', async (req, res) => {
  try {
    const auth = await authenticateUser(req, res);
    if (!auth) return;

    const vendorId = String(req.body?.vendorId || '').trim();
    const vendorKind = String(req.body?.vendorKind || '').trim().toLowerCase();
    const boostKind = String(req.body?.boostKind || '').trim().toLowerCase() as BoostKind;
    const durationHours = Number(req.body?.durationHours);

    if (!vendorId) return res.status(400).json({ error: 'vendorId manquant' });
    if (!vendorKind) return res.status(400).json({ error: 'vendorKind manquant' });
    if (!isBoostKind(boostKind)) return res.status(400).json({ error: 'boostKind invalide' });
    if (!Number.isFinite(durationHours) || durationHours <= 0) {
      return res.status(400).json({ error: 'durationHours invalide' });
    }

    const dbProduct = await fetchBoostProductFromDb(boostKind, durationHours);
    if (!dbProduct || !dbProduct.active) {
      return res.status(400).json({ error: 'Produit boost introuvable (durée invalide ou inactif)' });
    }

    const balanceXof = await getUserCreditBalanceXof(auth.user.id);
    if (balanceXof < dbProduct.price_xof) {
      return res.status(400).json({ error: 'Crédits insuffisants', balanceXof, requiredXof: dbProduct.price_xof });
    }

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
        duration_hours: dbProduct.duration_hours,
        amount_xof: dbProduct.price_xof,
        currency: String(dbProduct.currency || 'XOF').toUpperCase(),
        status: 'paid',
        sponsored_tier: boostKind === 'sponsored' ? dbProduct.sponsored_tier : null,
        paid_at: nowIso,
        created_at: nowIso,
        updated_at: nowIso,
        metadata: {
          paid_via: 'credits',
        },
      });

    if (insertError) {
      return res.status(500).json({ error: 'Impossible de créer la commande boost', details: insertError.message });
    }

    const { error: creditError } = await supabase
      .from('user_credits')
      .insert({
        user_id: auth.user.id,
        amount: -Math.abs(dbProduct.price_xof),
        type: 'boost_purchase',
        description: `Achat boost (${boostKind}, ${dbProduct.duration_hours}h) pour vendor ${vendorId}`,
        created_at: nowIso,
        metadata: {
          boost_order_id: orderId,
          vendor_id: vendorId,
          vendor_kind: vendorKind,
          boost_kind: boostKind,
          duration_hours: dbProduct.duration_hours,
        },
      });

    if (creditError) {
      await supabase.from('boost_orders').update({ status: 'failed', updated_at: new Date().toISOString() }).eq('id', orderId);
      return res.status(500).json({ error: 'Impossible de débiter les crédits', details: creditError.message });
    }

    const { data: order } = await supabase.from('boost_orders').select('*').eq('id', orderId).single();
    const activation = order
      ? await activateBoostForOrder({
          order,
          boostKind,
          durationHours: dbProduct.duration_hours,
          sponsoredTier: boostKind === 'sponsored' ? dbProduct.sponsored_tier : null,
        })
      : null;

    res.json({ orderId, status: 'active', expiresAt: activation?.expiresAt || null });
  } catch (error: any) {
    res.status(500).json({ error: 'Erreur serveur', details: error?.message || String(error) });
  }
});

export default router;
